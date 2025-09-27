#!/usr/bin/env node

import { initializeDatabase, closeDatabaseConnection } from '../src/db/connection.js';
import { logger } from '../src/utils/logger.js';

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    await initializeDatabase();
    
    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

migrate();

