from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_db
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Background scheduler (optional, only starts if apscheduler is installed)
scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global scheduler
    # Startup
    logger.info("Initializing Database...")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Start background sync scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.services.sync_worker import run_background_sync
        
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            run_background_sync,
            'interval',
            minutes=5,
            id='gmail_background_sync',
            name='Gmail Background Sync',
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Background sync scheduler started (every 5 minutes)")
    except ImportError:
        logger.warning("APScheduler not installed. Background sync disabled. Install with: pip install apscheduler")
    except Exception as e:
        logger.error(f"Failed to start background scheduler: {e}")
    
    yield
    
    # Shutdown
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Background sync scheduler stopped")

app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    debug=settings.DEBUG
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to MailOS Backend"}
