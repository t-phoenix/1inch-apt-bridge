import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkDatabaseConnection } from '../db/connection.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'connected' : 'disconnected',
      relayer: 'running'
    }
  });
}));

export { router as healthRouter };
