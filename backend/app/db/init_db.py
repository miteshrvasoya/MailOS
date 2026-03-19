import logging
from sqlalchemy import create_engine, text
from app.core.config import settings
from alembic import command, config
import os

logger = logging.getLogger(__name__)

def init_db():
    """
    Creates database (locally) if it doesn't exist and runs migrations.

    On Render / production we skip DB creation (assume DB already exists)
    and optionally run Alembic migrations depending on env.
    """
    # Detect local/dev vs remote (Render)
    is_local = settings.POSTGRES_SERVER in ("localhost", "127.0.0.1") or settings.DEBUG

    # 1. Create Database if not exists (LOCAL ONLY)
    if is_local:
        # Connect to default 'postgres' db to create the new db
        postgres_uri = (
            f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
            f"@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres?connect_timeout=5"
        )
        try:
            engine = create_engine(postgres_uri, isolation_level="AUTOCOMMIT")
            with engine.connect() as conn:
                # Check if database exists
                result = conn.execute(
                    text("SELECT 1 FROM pg_database WHERE datname=:dbname"),
                    {"dbname": settings.POSTGRES_DB},
                )
                if not result.fetchone():
                    logger.info(f"Database {settings.POSTGRES_DB} does not exist. Creating...")
                    conn.execute(text(f'CREATE DATABASE "{settings.POSTGRES_DB}"'))
                    logger.info(f"Database {settings.POSTGRES_DB} created successfully.")
                else:
                    logger.info(f"Database {settings.POSTGRES_DB} already exists.")
        except Exception as e:
            logger.error(f"Error creating database (local only): {e}")
            # Continue to migrations even if DB creation failed locally
    else:
        logger.info("Skipping database creation in non-local environment (e.g. Render/prod).")

    # 2. Run Alembic Migrations
    try:
        run_migrations = os.getenv("RUN_MIGRATIONS_ON_STARTUP", "true").lower() == "true"
        if not run_migrations:
            logger.info("RUN_MIGRATIONS_ON_STARTUP=false, skipping Alembic migrations on startup.")
            return
        logger.info("Running Alembic migrations...")
        # __file__ is app/db/init_db.py -> backend/app/db/init_db.py
        current_file = os.path.abspath(__file__)
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
        alembic_ini_candidate = os.path.join(backend_dir, "alembic.ini")

        # Try multiple paths in case the working directory is different
        possible_paths = [
            alembic_ini_candidate,
            "alembic.ini",
            os.path.join(os.getcwd(), "alembic.ini"),
        ]

        alembic_ini_path = None
        for path in possible_paths:
            if os.path.exists(path):
                alembic_ini_path = path
                break

        if not alembic_ini_path:
            raise FileNotFoundError(f"Could not find alembic.ini. Tried: {possible_paths}")

        logger.info(f"Using Alembic config: {alembic_ini_path}")
        alembic_cfg = config.Config(alembic_ini_path)
        # env.py already uses settings.SQLALCHEMY_DATABASE_URI, but set here as a fallback
        alembic_cfg.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)

        logger.info(f"Running migrations with database: {settings.POSTGRES_DB}")
        command.upgrade(alembic_cfg, "head")
        logger.info("Alembic migrations completed successfully.")
    except Exception as e:
        logger.error(f"Error running migrations: {e}", exc_info=True)
        # Don't raise - allow app to start even if migrations fail
        logger.warning(
            "Continuing startup despite migration error. "
            "Please check logs and fix migrations manually."
        )

    # 3. Safety net: ensure critical `user` columns exist.
    # This prevents runtime crashes when the DB schema lags behind the model
    # (common when migrations fail or didn't run on a particular deploy).
    try:
        logger.info("Ensuring critical `user` columns exist (schema safety net)...")
        # Add a short connect timeout in case Render transiently fails to connect.
        db_url = settings.SQLALCHEMY_DATABASE_URI or ""
        if "connect_timeout=" not in db_url:
            joiner = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{joiner}connect_timeout=5"

        from sqlalchemy import create_engine as _create_engine, text as _text

        engine = _create_engine(db_url, isolation_level="AUTOCOMMIT")
        stmts = [
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS label_prefix VARCHAR NOT NULL DEFAULT \'MailOS\'',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS apply_prefix_to_existing BOOLEAN NOT NULL DEFAULT false',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS auto_create_events BOOLEAN NOT NULL DEFAULT false',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS auto_fetch_enabled BOOLEAN NOT NULL DEFAULT true',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN NOT NULL DEFAULT true',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS digest_frequency VARCHAR NOT NULL DEFAULT \'daily\'',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS digest_time_local VARCHAR DEFAULT \'09:00\'',
        ]

        with engine.connect() as conn:
            for stmt in stmts:
                conn.execute(_text(stmt))

        logger.info("Schema safety net completed: critical `user` columns ensured.")
    except Exception as e:
        # Never block startup due to schema safety net issues.
        logger.error(f"Schema safety net failed: {e}", exc_info=True)
