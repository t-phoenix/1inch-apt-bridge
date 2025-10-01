import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiters } from './middleware/rateLimiter.js';
import { sanitize } from './middleware/validation.js';
import { setupRoutes } from './routes/index.js';
import { initializeDatabase } from './db/connection.js';
import { startRelayer } from './services/relayer.js';
import { startMonitoring } from './services/monitoringService.js';
import { wsService } from './services/websocketService.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8080', // Vite default port
    'http://localhost:3000'  // React default port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization middleware
app.use(sanitize);

// General rate limiting
app.use(rateLimiters.general);

// Routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Try to initialize database, but don't fail if it's not available
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      logger.info('Database initialized successfully');
    } else {
      logger.warn('Database not available, continuing without database');
    }
    
    // Initialize WebSocket service
    wsService.initialize(server);
    logger.info('WebSocket service initialized');
    
    server.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT}`);
      logger.info(`WebSocket server running on ws://localhost:${PORT}/ws`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start relayer service (only if database is available)
    if (dbInitialized) {
      await startRelayer();
      logger.info('Relayer service started');
      
      // Start monitoring service
      await startMonitoring();
      logger.info('Monitoring service started');
    } else {
      logger.warn('Skipping relayer and monitoring services (database not available)');
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
