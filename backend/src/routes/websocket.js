// WebSocket management routes
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { wsService } from '../services/websocketService.js';

const router = express.Router();

// Get WebSocket server statistics
router.get('/stats', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const stats = wsService.getStats();
    
    res.json({
      success: true,
      websocket: stats
    });
  })
);

// Get client information
router.get('/client/:clientId', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    
    const clientInfo = wsService.getClientInfo(clientId);
    if (!clientInfo) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      client: clientInfo
    });
  })
);

// Broadcast message to all clients
router.post('/broadcast', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const { message, data } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    wsService.broadcastToAll({
      message,
      data,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      message: 'Broadcast sent to all clients'
    });
  })
);

// Broadcast message to specific topic
router.post('/broadcast/:topic', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const { topic } = req.params;
    const { data } = req.body;
    
    const validTopics = ['orders', 'swaps', 'prices', 'transactions', 'relayer', 'system'];
    if (!validTopics.includes(topic)) {
      return res.status(400).json({
        success: false,
        error: `Invalid topic. Must be one of: ${validTopics.join(', ')}`
      });
    }
    
    wsService.broadcast(topic, data);
    
    res.json({
      success: true,
      message: `Broadcast sent to topic: ${topic}`
    });
  })
);

// Send message to specific client
router.post('/client/:clientId/send', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { type, data } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Message type is required'
      });
    }
    
    const clientInfo = wsService.getClientInfo(clientId);
    if (!clientInfo) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    wsService.sendToClient(clientId, {
      type,
      data,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      message: `Message sent to client: ${clientId}`
    });
  })
);

// Get WebSocket connection info
router.get('/info', 
  rateLimiters.general,
  asyncHandler(async (req, res) => {
    const stats = wsService.getStats();
    
    res.json({
      success: true,
      websocket: {
        ...stats,
        endpoint: `ws://localhost:${process.env.PORT || 3001}/ws`,
        supportedTopics: ['orders', 'swaps', 'prices', 'transactions', 'relayer', 'system'],
        messageTypes: {
          subscribe: 'Subscribe to topics',
          unsubscribe: 'Unsubscribe from topics',
          ping: 'Ping server',
          get_status: 'Get client status',
          get_rooms: 'Get room information'
        }
      }
    });
  })
);

export { router as websocketRouter };
