from fastapi import APIRouter

from app.api.v1 import api_keys, auth, feed, transactions, billing, analytics, alerts, health, waitlist

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(transactions.router)
api_router.include_router(api_keys.router)
api_router.include_router(feed.router)
api_router.include_router(billing.router)
api_router.include_router(analytics.router)
api_router.include_router(alerts.router)
api_router.include_router(waitlist.router, prefix="/waitlist", tags=["waitlist"])

