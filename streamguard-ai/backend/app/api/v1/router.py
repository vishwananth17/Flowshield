from fastapi import APIRouter

from app.api.v1 import api_keys, auth, feed, transactions, billing

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(transactions.router)
api_router.include_router(api_keys.router)
api_router.include_router(feed.router)
api_router.include_router(billing.router)
