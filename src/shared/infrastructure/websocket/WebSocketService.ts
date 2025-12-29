import { WebSocket } from '@fastify/websocket';

export interface WebSocketClient {
  socket: WebSocket;
  userId: number;
  role: string;
}

export interface WebSocketEvent {
  type: 'new_order' | 'new_task' | 'low_stock' | 'out_of_stock' | 'new_notification' | 'task_overdue' | 'order_status_changed';
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();

  addClient(clientId: string, socket: WebSocket, userId: number, role: string): void {
    this.clients.set(clientId, { socket, userId, role });
    console.log(`WebSocket client connected: ${clientId} (user: ${userId}, role: ${role})`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`WebSocket client disconnected: ${clientId}`);
  }

  broadcast(event: WebSocketEvent): void {
    const message = JSON.stringify(event);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(message);
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    });

    console.log(`Broadcast event ${event.type} to ${sentCount} clients`);
  }

  broadcastToUser(userId: number, event: WebSocketEvent): void {
    const message = JSON.stringify(event);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.userId === userId && client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(message);
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message to user:', error);
        }
      }
    });

    console.log(`Sent event ${event.type} to user ${userId} (${sentCount} connections)`);
  }

  broadcastToRole(role: string, event: WebSocketEvent): void {
    const message = JSON.stringify(event);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.role === role && client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(message);
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message to role:', error);
        }
      }
    });

    console.log(`Broadcast event ${event.type} to role ${role} (${sentCount} clients)`);
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  getConnectedUserIds(): number[] {
    return Array.from(new Set(Array.from(this.clients.values()).map((c) => c.userId)));
  }
}
