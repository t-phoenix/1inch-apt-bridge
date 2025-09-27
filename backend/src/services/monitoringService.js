import { logger } from '../utils/logger.js';
import { HTLCManager } from './htlcManager.js';
import { OrderService } from './orderService.js';
import { Escrow } from '../models/Escrow.js';
import cron from 'node-cron';

export class MonitoringService {
  constructor() {
    this.htlcManager = new HTLCManager();
    this.orderService = new OrderService();
    this.isRunning = false;
    this.monitoringTasks = new Map();
  }

  /**
   * Start the monitoring service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Monitoring service is already running');
      return;
    }

    logger.info('Starting monitoring service...');
    this.isRunning = true;

    // Start periodic monitoring tasks
    this.startPeriodicTasks();

    logger.info('Monitoring service started successfully');
  }

  /**
   * Stop the monitoring service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping monitoring service...');
    this.isRunning = false;

    // Stop all monitoring tasks
    this.stopPeriodicTasks();

    logger.info('Monitoring service stopped');
  }

  /**
   * Start periodic monitoring tasks
   */
  startPeriodicTasks() {
    // Monitor escrows every 30 seconds
    this.scheduleTask('escrow-monitor', '*/30 * * * * *', async () => {
      await this.monitorActiveEscrows();
    });

    // Check for expired orders every minute
    this.scheduleTask('expiry-check', '0 * * * * *', async () => {
      await this.checkExpiredOrders();
    });

    // Clean up old transactions every hour
    this.scheduleTask('cleanup', '0 0 * * * *', async () => {
      await this.cleanupOldTransactions();
    });

    // Health check every 5 minutes
    this.scheduleTask('health-check', '0 */5 * * * *', async () => {
      await this.performHealthCheck();
    });
  }

  /**
   * Stop all periodic tasks
   */
  stopPeriodicTasks() {
    for (const [taskName, task] of this.monitoringTasks) {
      task.destroy();
      logger.debug(`Stopped monitoring task: ${taskName}`);
    }
    this.monitoringTasks.clear();
  }

  /**
   * Schedule a monitoring task
   */
  scheduleTask(name, cronExpression, taskFunction) {
    const task = cron.schedule(cronExpression, async () => {
      try {
        await taskFunction();
      } catch (error) {
        logger.error(`Error in monitoring task ${name}:`, error);
      }
    }, {
      scheduled: false
    });

    task.start();
    this.monitoringTasks.set(name, task);
    logger.debug(`Scheduled monitoring task: ${name} (${cronExpression})`);
  }

  /**
   * Monitor active escrows and handle timeouts
   */
  async monitorActiveEscrows() {
    try {
      // Get all orders in escrowed state
      const activeOrders = await this.orderService.getAllOrders({
        status: 'escrowed',
        limit: 100
      });

      logger.debug(`Monitoring ${activeOrders.count} active escrows`);

      for (const order of activeOrders.rows) {
        try {
          await this.htlcManager.monitorEscrow(order.id);
        } catch (error) {
          logger.error(`Failed to monitor escrow for order ${order.id}:`, error);
        }
      }

    } catch (error) {
      logger.error('Failed to monitor active escrows:', error);
    }
  }

  /**
   * Check for expired orders and process refunds
   */
  async checkExpiredOrders() {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Find orders that are past their timelock
      const expiredOrders = await this.orderService.getAllOrders({
        status: 'escrowed',
        limit: 100
      });

      let processedCount = 0;
      for (const order of expiredOrders.rows) {
        if (now > order.timelock) {
          try {
            logger.info(`Processing expired order: ${order.id}`);
            await this.htlcManager.processRefund(order);
            processedCount++;
          } catch (error) {
            logger.error(`Failed to process refund for expired order ${order.id}:`, error);
          }
        }
      }

      if (processedCount > 0) {
        logger.info(`Processed ${processedCount} expired orders`);
      }

    } catch (error) {
      logger.error('Failed to check expired orders:', error);
    }
  }

  /**
   * Clean up old transaction records
   */
  async cleanupOldTransactions() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Delete old confirmed transactions
      const deletedCount = await Transaction.destroy({
        where: {
          status: 'confirmed',
          createdAt: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old transaction records`);
      }

    } catch (error) {
      logger.error('Failed to cleanup old transactions:', error);
    }
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        services: {}
      };

      // Check database connection
      try {
        await this.orderService.getAllOrders({ limit: 1 });
        healthStatus.services.database = 'healthy';
      } catch (error) {
        healthStatus.services.database = 'unhealthy';
        logger.error('Database health check failed:', error);
      }

      // Check Ethereum service
      try {
        const ethService = this.htlcManager.getServiceForChain('ethereum');
        if (ethService) {
          await ethService.getCurrentBlockNumber();
          healthStatus.services.ethereum = 'healthy';
        } else {
          healthStatus.services.ethereum = 'not_configured';
        }
      } catch (error) {
        healthStatus.services.ethereum = 'unhealthy';
        logger.error('Ethereum service health check failed:', error);
      }

      // Check Aptos service
      try {
        const aptosService = this.htlcManager.getServiceForChain('aptos');
        if (aptosService) {
          await aptosService.getCurrentVersion();
          healthStatus.services.aptos = 'healthy';
        } else {
          healthStatus.services.aptos = 'not_configured';
        }
      } catch (error) {
        healthStatus.services.aptos = 'unhealthy';
        logger.error('Aptos service health check failed:', error);
      }

      // Log health status
      const unhealthyServices = Object.entries(healthStatus.services)
        .filter(([_, status]) => status === 'unhealthy')
        .map(([service, _]) => service);

      if (unhealthyServices.length > 0) {
        logger.warn(`Health check detected unhealthy services: ${unhealthyServices.join(', ')}`);
      } else {
        logger.debug('Health check passed for all services');
      }

      return healthStatus;

    } catch (error) {
      logger.error('Failed to perform health check:', error);
      return null;
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats() {
    try {
      const stats = {
        activeOrders: 0,
        expiredOrders: 0,
        completedOrders: 0,
        failedOrders: 0,
        totalEscrows: 0,
        lastUpdated: new Date().toISOString()
      };

      // Count orders by status
      const orderStats = await this.orderService.getAllOrders({ limit: 1000 });
      for (const order of orderStats.rows) {
        switch (order.status) {
          case 'escrowed':
            stats.activeOrders++;
            break;
          case 'claimed':
            stats.completedOrders++;
            break;
          case 'failed':
            stats.failedOrders++;
            break;
          case 'refunded':
            stats.completedOrders++;
            break;
        }
      }

      // Count escrows
      stats.totalEscrows = await Escrow.count();

      // Count expired orders
      const now = Math.floor(Date.now() / 1000);
      for (const order of orderStats.rows) {
        if (order.status === 'escrowed' && now > order.timelock) {
          stats.expiredOrders++;
        }
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get monitoring stats:', error);
      return null;
    }
  }

  /**
   * Force monitor a specific order
   */
  async forceMonitorOrder(orderId) {
    try {
      logger.info(`Force monitoring order: ${orderId}`);
      await this.htlcManager.monitorEscrow(orderId);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to force monitor order ${orderId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.monitoringTasks.keys()),
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// Global monitoring service instance
let monitoringInstance = null;

export async function startMonitoring() {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService();
  }
  await monitoringInstance.start();
  return monitoringInstance;
}

export async function stopMonitoring() {
  if (monitoringInstance) {
    await monitoringInstance.stop();
  }
}

export function getMonitoringService() {
  return monitoringInstance;
}
