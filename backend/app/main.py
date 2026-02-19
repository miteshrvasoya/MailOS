from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
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
    allow_origins=[
        "https://mail-os.vercel.app",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers(origin: str | None) -> dict:
    """Headers to add for CORS when origin is allowed."""
    h = {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }
    if origin and origin in _cors_origins:
        h["Access-Control-Allow-Origin"] = origin
    elif _cors_origins:
        h["Access-Control-Allow-Origin"] = _cors_origins[0]
    return h


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Ensure CORS headers on HTTP exception responses."""
    content = {"detail": exc.detail} if isinstance(exc.detail, str) else exc.detail
    origin = request.headers.get("origin")
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=_cors_headers(origin),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers on 500 responses so browser shows real error."""
    logger.exception("Unhandled exception: %s", exc)
    origin = request.headers.get("origin")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_headers(origin),
    )


app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to MailOS Backend"}
