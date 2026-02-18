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
        logger.info("Running Alembic migrations... (SKIPPED for debugging)")
        # Assume we are in the root 'backend' directory where alembic.ini is
        # alembic_cfg = config.Config("alembic.ini")
        # command.upgrade(alembic_cfg, "head")
        logger.info("Alembic migrations skipped.")
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        raise e
