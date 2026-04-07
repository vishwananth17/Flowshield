import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import safe_decode_token
from app.core.websockets import ws_manager
from app.db.session import AsyncSessionLocal
from app.models.user import User

router = APIRouter(prefix="/feed", tags=["Feed"])

async def get_org_id_from_token(token: str) -> str | None:
    if not token:
        return None
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        return None

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
        user = result.scalar_one_or_none()
        if user:
            return str(user.org_id)
    return None

@router.websocket("/ws")
async def websocket_feed(websocket: WebSocket, token: str = Query(None)):
    cookie_token = websocket.cookies.get("access_token")
    actual_token = token or cookie_token
    org_id = await get_org_id_from_token(actual_token)
    if not org_id:
        await websocket.close(code=1008, reason="Unauthorized")
        return

    await ws_manager.connect(websocket, org_id)
    try:
        while True:
            # We don't expect the client to send anything, but we keep the connection open
            # and handle ping-pong or unexpected messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, org_id)
