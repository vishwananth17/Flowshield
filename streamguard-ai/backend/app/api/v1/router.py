from fastapi import APIRouter

from app.api.v1 import api_keys, auth, feed, transactions, billing, analytics, alerts, health, waitlist, legal, integrations_detect, shopify_oauth, shopify_webhooks, disputes, dispute_webhooks, integrations, account_events, refund_events

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
api_router.include_router(legal.router)
api_router.include_router(integrations_detect.router)
api_router.include_router(shopify_oauth.router)
api_router.include_router(shopify_webhooks.router)
api_router.include_router(disputes.router)
api_router.include_router(dispute_webhooks.router)
api_router.include_router(integrations.router)
api_router.include_router(account_events.router)
api_router.include_router(refund_events.router)


