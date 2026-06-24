import { WebSocketServer, WebSocket } from 'ws';
import supabase from './supabase.js';
import url from 'url';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// Map of org_id -> Set of WebSocket connections
const activeConnections = new Map();

export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/v1/feed/ws') {
      const token = parsedUrl.query.token;
      if (!token) {
        logger.warn("WS Connection rejected: Missing token");
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        // Authenticate with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          logger.warn("WS Connection rejected: Invalid token");
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Fetch org_id for the user from pool
        const { pool } = await import('./db.js');
        const userRes = await pool.query('SELECT org_id FROM users WHERE id = $1', [user.id]);
        if (userRes.rows.length === 0 || !userRes.rows[0].org_id) {
          logger.warn("WS Connection rejected: User org not found");
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const orgId = userRes.rows[0].org_id;

        wss.handleUpgrade(request, socket, head, (ws) => {
          ws.orgId = orgId;
          
          if (!activeConnections.has(orgId)) {
            activeConnections.set(orgId, new Set());
          }
          activeConnections.get(orgId).add(ws);
          logger.info(`WS Client connected for org: ${orgId}`);

          ws.on('message', (message) => {
            try {
              const payload = JSON.parse(message);
              if (payload.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
              }
            } catch (err) {
              logger.error(`WS message error: ${err.message}`);
            }
          });

          ws.on('close', () => {
            const conns = activeConnections.get(orgId);
            if (conns) {
              conns.delete(ws);
              if (conns.size === 0) {
                activeConnections.delete(orgId);
              }
            }
            logger.info(`WS Client disconnected for org: ${orgId}`);
          });

          ws.on('error', (err) => {
            logger.error(`WS client error: ${err.message}`);
          });
        });

      } catch (err) {
        logger.error(`WS upgrade error: ${err.message}`);
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      }
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  logger.info("🚀 WebSocket Server initialized and attached to HTTP Server");
}

export function broadcastToOrg(orgId, payload) {
  const conns = activeConnections.get(orgId);
  if (conns && conns.size > 0) {
    const dataStr = JSON.stringify(payload);
    for (const ws of conns) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(dataStr);
      }
    }
  }
}
