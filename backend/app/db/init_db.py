import logging
from sqlalchemy import create_engine, text
from app.core.config import settings
from alembic import command, config
import os

logger = logging.getLogger(__name__)

def init_db():
    """
    Creates database if it doesn't exist and runs migrations.
    """
    # 1. Create Database if not exists
    # Connect to default 'postgres' db to create the new db
    postgres_uri = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
    
    try:
        engine = create_engine(postgres_uri, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{settings.POSTGRES_DB}'"))
            if not result.fetchone():
                logger.info(f"Database {settings.POSTGRES_DB} does not exist. Creating...")
                conn.execute(text(f"CREATE DATABASE {settings.POSTGRES_DB}"))
                logger.info(f"Database {settings.POSTGRES_DB} created successfully.")
            else:
                logger.info(f"Database {settings.POSTGRES_DB} already exists.")
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        # Setup might fail if we can't connect to postgres db (e.g. cloud SQL permissions), 
        # but we might still access the target DB if it exists. Continue to migrations.

    # 2. Run Alembic Migrations
    try:
        logger.info("Running Alembic migrations...")
        # Get the path to alembic.ini - it should be in the backend directory
        # We're in app/db/init_db.py, so we need to go up to backend/
        # __file__ is app/db/init_db.py -> backend/app/db/init_db.py
        current_file = os.path.abspath(__file__)
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
        alembic_ini_path = os.path.join(backend_dir, "alembic.ini")
        
        # Try multiple paths in case the working directory is different
        possible_paths = [
            alembic_ini_path,
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
        # The env.py already uses settings.SQLALCHEMY_DATABASE_URI, so we don't need to override
        # But we can set it here as a fallback
        alembic_cfg.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)
        
        logger.info(f"Running migrations with database: {settings.POSTGRES_DB}")
        command.upgrade(alembic_cfg, "head")
        logger.info("Alembic migrations completed successfully.")
    except Exception as e:
        logger.error(f"Error running migrations: {e}", exc_info=True)
        # Don't raise - allow app to start even if migrations fail
        # This prevents the app from crashing on startup if there's a migration issue
        # The error will be logged and can be fixed manually
        logger.warning("Continuing startup despite migration error. Please check logs and fix migrations manually.")
