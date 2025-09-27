import { logger } from '../utils/logger.js';
import { EthereumService } from './ethereum.js';
import { AptosService } from './aptos.js';
import { OrderService } from './orderService.js';

class RelayerService {
  constructor() {
    this.ethereumService = new EthereumService();
    this.aptosService = new AptosService();
    this.orderService = new OrderService();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Relayer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting relayer service...');

    // Start listening to Ethereum events
    await this.ethereumService.startEventListening();
    
    // Start listening to Aptos events
    await this.aptosService.startEventListening();
    
    logger.info('Relayer service started successfully');
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping relayer service...');

    // Stop event listeners
    await this.ethereumService.stopEventListening();
    await this.aptosService.stopEventListening();
    
    logger.info('Relayer service stopped');
  }

  async processOrder(orderId) {
    try {
      logger.info(`Processing order: ${orderId}`);
      
      const order = await this.orderService.getOrder(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Process based on order type
      if (order.fromChain === 'ethereum' && order.toChain === 'aptos') {
        await this.processEVMToAptos(order);
      } else if (order.fromChain === 'aptos' && order.toChain === 'ethereum') {
        await this.processAptosToEVM(order);
      } else {
        throw new Error(`Unsupported chain pair: ${order.fromChain} -> ${order.toChain}`);
      }

    } catch (error) {
      logger.error(`Failed to process order ${orderId}:`, error);
      throw error;
    }
  }

  async processEVMToAptos(order) {
    logger.info(`Processing EVM to Aptos swap for order ${order.id}`);
    
    // 1. Monitor EVM escrow creation
    // 2. Create corresponding Aptos escrow
    // 3. Monitor for secret reveal
    // 4. Propagate secret to both chains
    
    // Implementation will be added in subsequent commits
  }

  async processAptosToEVM(order) {
    logger.info(`Processing Aptos to EVM swap for order ${order.id}`);
    
    // 1. Monitor Aptos escrow creation
    // 2. Create corresponding EVM escrow
    // 3. Monitor for secret reveal
    // 4. Propagate secret to both chains
    
    // Implementation will be added in subsequent commits
  }
}

let relayerInstance = null;

export async function startRelayer() {
  if (!relayerInstance) {
    relayerInstance = new RelayerService();
  }
  await relayerInstance.start();
  return relayerInstance;
}

export function getRelayer() {
  return relayerInstance;
}
