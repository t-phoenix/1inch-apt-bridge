import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger.js';
import { databaseConfig, validateDatabaseConfig, getDatabaseUrl } from '../config/database.js';

// Validate database configuration
if (!validateDatabaseConfig()) {
  logger.warn('Database configuration validation failed');
}

// Initialize Sequelize connection for NeonDB
const databaseUrl = getDatabaseUrl() || 'postgresql://localhost:5432/oneinch_apt_bridge';

export const sequelize = new Sequelize(databaseUrl, {
  logging: databaseConfig.query.logging ? console.log : false,
  dialect: 'postgres',
  dialectOptions: databaseConfig.neon.ssl,
  pool: databaseConfig.neon.pool,
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: databaseConfig.retry.max
  }
});

export async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...');
    
    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Import models and setup associations
    const { setupModelAssociations } = await import('../models/index.js');
    await import('../models/Order.js');
    await import('../models/Escrow.js');
    await import('../models/Transaction.js');
    
    // Setup model associations
    await setupModelAssociations();
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized');
    
    logger.info('Database connection initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function checkDatabaseConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error('Database connection check failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection() {
  try {
    logger.info('Closing database connection...');
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Failed to close database connection:', error);
    throw error;
  }
}
