from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.kafka_service import kafka_service
import logging

router = APIRouter()
logger = logging.getLogger("streamguard.ws")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await kafka_service.add_websocket(websocket)
    logger.info("WebSocket connected")
    try:
        while True:
            # We don't expect messages from client, but we must read to keep connection alive and detect disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        kafka_service.remove_websocket(websocket)
