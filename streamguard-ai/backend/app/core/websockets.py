from collections import defaultdict
from typing import Any

from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, org_id: str):
        await websocket.accept()
        self.active_connections[org_id].append(websocket)

    def disconnect(self, websocket: WebSocket, org_id: str):
        if org_id in self.active_connections and websocket in self.active_connections[org_id]:
            self.active_connections[org_id].remove(websocket)

    async def broadcast(self, org_id: str, message: dict[str, Any]):
        if org_id in self.active_connections:
            for connection in self.active_connections[org_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

ws_manager = ConnectionManager()
