import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

const jwtVerifyFn = (jwt as any).verify || jwt.default?.verify;

export async function websocketRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();

  app.get('/ws', { websocket: true }, async (connection, req) => {
    const { socket } = connection;

    try {
      // Extract token from query parameter or headers
      const token = (req.query as any).token || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      let decoded: any;
      try {
        decoded = jwtVerifyFn(token, config.jwt.secret);
      } catch (err) {
        socket.close(1008, 'Invalid token');
        return;
      }

      const userId = decoded.userId;
      const role = decoded.role;
      const clientId = uuidv4();

      // Add client to WebSocketService
      c.webSocketService.addClient(clientId, socket, userId, role);

      // Send welcome message
      socket.send(
        JSON.stringify({
          type: 'connected',
          data: {
            message: 'Successfully connected to real-time updates',
            userId,
            role,
          },
          timestamp: new Date().toISOString(),
        })
      );

      // Handle ping/pong for connection keep-alive (PWA support)
      const pingInterval = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.ping();
        }
      }, 30000); // Ping every 30 seconds

      socket.on('pong', () => {
        // Connection is alive
      });

      // Handle incoming messages from client
      socket.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());

          // Handle client requests (e.g., subscribe to specific channels)
          if (data.type === 'ping') {
            socket.send(
              JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      // Handle connection close
      socket.on('close', () => {
        clearInterval(pingInterval);
        c.webSocketService.removeClient(clientId);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
        c.webSocketService.removeClient(clientId);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      socket.close(1011, 'Internal server error');
    }
  });

  // Health check endpoint for WebSocket
  app.get('/ws/health', async (req, reply) => {
    return {
      status: 'ok',
      connectedClients: c.webSocketService.getConnectedClientsCount(),
      connectedUsers: c.webSocketService.getConnectedUserIds().length,
    };
  });
}
