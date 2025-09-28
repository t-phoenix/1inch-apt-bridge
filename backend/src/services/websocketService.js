// WebSocket service for real-time updates
import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { createServer } from 'http';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.rooms = new Map(); // For grouping clients by interests
    this.heartbeatInterval = 30000; // 30 seconds
    this.maxConnections = 1000;
    this.connectionCount = 0;
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      maxPayload: 1024 * 1024, // 1MB
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    
    logger.info('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      if (this.connectionCount >= this.maxConnections) {
        ws.close(1013, 'Server overloaded');
        return;
      }

      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ws,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        connectedAt: new Date(),
        lastPing: Date.now(),
        subscriptions: new Set(),
        isAlive: true,
      };

      this.clients.set(clientId, clientInfo);
      this.connectionCount++;

      logger.info(`WebSocket client connected: ${clientId} (${this.connectionCount} total)`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId,
        serverTime: Date.now(),
        message: 'Connected to 1inch-apt-bridge WebSocket'
      });

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          logger.error(`Invalid message from client ${clientId}:`, error);
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Invalid message format'
          });
        }
      });

      // Handle pong responses
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
          client.isAlive = true;
        }
      });

      // Handle disconnection
      ws.on('close', (code, reason) => {
        this.handleDisconnection(clientId, code, reason);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId, 1011, 'Internal error');
      });
    });
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message);
        break;
      case 'ping':
        this.handlePing(clientId, message);
        break;
      case 'get_status':
        this.handleGetStatus(clientId, message);
        break;
      case 'get_rooms':
        this.handleGetRooms(clientId, message);
        break;
      default:
        logger.warn(`Unknown message type from client ${clientId}: ${message.type}`);
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${message.type}`
        });
    }
  }

  handleSubscribe(clientId, message) {
    const { topics } = message;
    if (!Array.isArray(topics)) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Topics must be an array'
      });
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    const validTopics = ['orders', 'swaps', 'prices', 'transactions', 'relayer', 'system'];
    const invalidTopics = topics.filter(topic => !validTopics.includes(topic));

    if (invalidTopics.length > 0) {
      this.sendToClient(clientId, {
        type: 'error',
        message: `Invalid topics: ${invalidTopics.join(', ')}`
      });
      return;
    }

    topics.forEach(topic => {
      client.subscriptions.add(topic);
      
      // Add to room
      if (!this.rooms.has(topic)) {
        this.rooms.set(topic, new Set());
      }
      this.rooms.get(topic).add(clientId);
    });

    this.sendToClient(clientId, {
      type: 'subscribed',
      topics: Array.from(client.subscriptions)
    });

    logger.info(`Client ${clientId} subscribed to: ${topics.join(', ')}`);
  }

  handleUnsubscribe(clientId, message) {
    const { topics } = message;
    if (!Array.isArray(topics)) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Topics must be an array'
      });
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    topics.forEach(topic => {
      client.subscriptions.delete(topic);
      
      // Remove from room
      if (this.rooms.has(topic)) {
        this.rooms.get(topic).delete(clientId);
        if (this.rooms.get(topic).size === 0) {
          this.rooms.delete(topic);
        }
      }
    });

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      topics: Array.from(client.subscriptions)
    });

    logger.info(`Client ${clientId} unsubscribed from: ${topics.join(', ')}`);
  }

  handlePing(clientId, message) {
    this.sendToClient(clientId, {
      type: 'pong',
      timestamp: Date.now()
    });
  }

  handleGetStatus(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendToClient(clientId, {
      type: 'status',
      clientId,
      connectedAt: client.connectedAt,
      subscriptions: Array.from(client.subscriptions),
      serverTime: Date.now(),
      connectionCount: this.connectionCount
    });
  }

  handleGetRooms(clientId, message) {
    const roomInfo = {};
    for (const [topic, clients] of this.rooms.entries()) {
      roomInfo[topic] = clients.size;
    }

    this.sendToClient(clientId, {
      type: 'rooms',
      rooms: roomInfo
    });
  }

  handleDisconnection(clientId, code, reason) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all rooms
    for (const topic of client.subscriptions) {
      if (this.rooms.has(topic)) {
        this.rooms.get(topic).delete(clientId);
        if (this.rooms.get(topic).size === 0) {
          this.rooms.delete(topic);
        }
      }
    }

    this.clients.delete(clientId);
    this.connectionCount--;

    logger.info(`WebSocket client disconnected: ${clientId} (${this.connectionCount} total) - Code: ${code}, Reason: ${reason}`);
  }

  startHeartbeat() {
    setInterval(() => {
      for (const [clientId, client] of this.clients.entries()) {
        if (!client.isAlive) {
          logger.info(`Terminating inactive client: ${clientId}`);
          client.ws.terminate();
          this.handleDisconnection(clientId, 1001, 'Heartbeat timeout');
          continue;
        }

        client.isAlive = false;
        client.ws.ping();
      }
    }, this.heartbeatInterval);
  }

  // Broadcast methods
  broadcast(topic, data) {
    if (!this.rooms.has(topic)) return;

    const message = {
      type: topic,
      data,
      timestamp: Date.now()
    };

    for (const clientId of this.rooms.get(topic)) {
      this.sendToClient(clientId, message);
    }

    logger.debug(`Broadcasted ${topic} to ${this.rooms.get(topic).size} clients`);
  }

  broadcastToAll(data) {
    const message = {
      type: 'broadcast',
      data,
      timestamp: Date.now()
    };

    for (const [clientId, client] of this.clients.entries()) {
      this.sendToClient(clientId, message);
    }

    logger.debug(`Broadcasted to all ${this.connectionCount} clients`);
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) return;

    try {
      client.ws.send(JSON.stringify(data));
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}:`, error);
      this.handleDisconnection(clientId, 1011, 'Send error');
    }
  }

  // Specific broadcast methods for different data types
  broadcastOrderUpdate(orderData) {
    this.broadcast('orders', {
      action: 'update',
      order: orderData
    });
  }

  broadcastSwapUpdate(swapData) {
    this.broadcast('swaps', {
      action: 'update',
      swap: swapData
    });
  }

  broadcastPriceUpdate(priceData) {
    this.broadcast('prices', {
      action: 'update',
      prices: priceData
    });
  }

  broadcastTransactionUpdate(transactionData) {
    this.broadcast('transactions', {
      action: 'update',
      transaction: transactionData
    });
  }

  broadcastRelayerUpdate(relayerData) {
    this.broadcast('relayer', {
      action: 'update',
      relayer: relayerData
    });
  }

  broadcastSystemUpdate(systemData) {
    this.broadcast('system', {
      action: 'update',
      system: systemData
    });
  }

  // Utility methods
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      totalConnections: this.connectionCount,
      activeRooms: this.rooms.size,
      roomStats: Object.fromEntries(
        Array.from(this.rooms.entries()).map(([topic, clients]) => [topic, clients.size])
      ),
      uptime: process.uptime()
    };
  }

  getClientInfo(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return null;

    return {
      id: client.id,
      ip: client.ip,
      userAgent: client.userAgent,
      connectedAt: client.connectedAt,
      subscriptions: Array.from(client.subscriptions),
      isAlive: client.isAlive
    };
  }

  close() {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket service closed');
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
