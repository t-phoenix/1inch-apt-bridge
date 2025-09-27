import express from 'express';
import { healthRouter } from './health.js';
import { swapRouter } from './swap.js';
import { orderRouter } from './order.js';

export function setupRoutes(app) {
  // Health check
  app.use('/health', healthRouter);
  
  // API routes
  app.use('/api/v1/swap', swapRouter);
  app.use('/api/v1/order', orderRouter);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: '1inch-apt-bridge API',
      version: '1.0.0',
      status: 'running'
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl
    });
  });
}
