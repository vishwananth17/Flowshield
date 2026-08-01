import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, org_id: str):
        await websocket.accept()
        async with self._lock:
            self.active_connections[org_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, org_id: str):
        async with self._lock:
            if org_id in self.active_connections and websocket in self.active_connections[org_id]:
                self.active_connections[org_id].remove(websocket)
                if not self.active_connections[org_id]:
                    del self.active_connections[org_id]

    async def broadcast(self, org_id: str, message: dict[str, Any]):
        connections = self.active_connections.get(org_id, [])
        if not connections:
            return

        # Broadcast to all connected clients concurrently
        results = await asyncio.gather(
            *[conn.send_json(message) for conn in connections],
            return_exceptions=True
        )

        # Cleanup any failed / closed connections concurrently
        dead_connections = [
            conn for conn, res in zip(connections, results) if isinstance(res, Exception)
        ]
        if dead_connections:
            async with self._lock:
                for dead in dead_connections:
                    if dead in self.active_connections.get(org_id, []):
                        self.active_connections[org_id].remove(dead)

ws_manager = ConnectionManager()
