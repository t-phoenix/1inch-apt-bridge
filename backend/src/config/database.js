import { logger } from '../utils/logger.js';

export const databaseConfig = {
  // NeonDB connection configuration
  neon: {
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  },
  
  // Retry configuration for serverless database
  retry: {
    max: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  },
  
  // Query configuration
  query: {
    timeout: 30000,
    logging: process.env.NODE_ENV === 'development'
  }
};

export function validateDatabaseConfig() {
  const requiredEnvVars = ['DATABASE_URL', 'NEON_DATABASE_URL'];
  const hasValidConfig = requiredEnvVars.some(envVar => process.env[envVar]);
  
  if (!hasValidConfig) {
    logger.warn('No valid database URL found. Please set DATABASE_URL or NEON_DATABASE_URL');
    return false;
  }
  
  return true;
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
}
