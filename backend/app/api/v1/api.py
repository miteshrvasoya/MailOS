from fastapi import APIRouter
from app.api.v1.endpoints import users, emails, rules, dashboard, notifications, feedback, actions, onboarding, gmail, categories

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(emails.router, prefix="/emails", tags=["emails"])
api_router.include_router(rules.router, prefix="/rules", tags=["rules"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(actions.router, prefix="/actions", tags=["actions"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(gmail.router, prefix="/gmail", tags=["gmail"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])

