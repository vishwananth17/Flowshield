from fastapi import APIRouter

from app.api.v1 import auth, transactions, api_keys, stream

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(transactions.router)
api_router.include_router(api_keys.router)
api_router.include_router(stream.router, prefix="/stream")
