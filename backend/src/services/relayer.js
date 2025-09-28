import { logger } from '../utils/logger.js';
import { EthereumService } from './ethereum.js';
import { AptosService } from './aptos.js';
import { OrderService } from './orderService.js';
import { HTLCManager } from './htlcManager.js';
import { Escrow } from '../models/Escrow.js';
import { Transaction } from '../models/Transaction.js';
import { verifyPreimage } from '../utils/crypto.js';

class RelayerService {
  constructor() {
    this.ethereumService = new EthereumService();
    this.aptosService = new AptosService();
    this.orderService = new OrderService();
    this.htlcManager = new HTLCManager();
    this.isRunning = false;
    this.processingOrders = new Set(); // Track orders being processed
    this.eventHandlers = new Map();
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Relayer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting relayer service...');

    try {
      // Start listening to Ethereum events
      await this.ethereumService.startEventListening();
      
      // Start listening to Aptos events
      await this.aptosService.startEventListening();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      logger.info('Relayer service started successfully');
    } catch (error) {
      logger.error('Failed to start relayer service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping relayer service...');

    try {
      // Stop event listeners
      await this.ethereumService.stopEventListening();
      await this.aptosService.stopEventListening();
      
      // Clear processing orders
      this.processingOrders.clear();
      
      logger.info('Relayer service stopped');
    } catch (error) {
      logger.error('Error stopping relayer service:', error);
    }
  }

  setupEventHandlers() {
    // Set up Ethereum event handlers
    this.ethereumService.contract.on('EscrowCreated', this.handleEthereumEscrowCreated.bind(this));
    this.ethereumService.contract.on('Redeemed', this.handleEthereumRedeemed.bind(this));
    this.ethereumService.contract.on('Refunded', this.handleEthereumRefunded.bind(this));

    // Set up Aptos event handlers (polling-based)
    this.eventHandlers.set('aptos-escrow-created', this.handleAptosEscrowCreated.bind(this));
    this.eventHandlers.set('aptos-redeemed', this.handleAptosRedeemed.bind(this));
    this.eventHandlers.set('aptos-refunded', this.handleAptosRefunded.bind(this));
  }

  async processOrder(orderId) {
    if (this.processingOrders.has(orderId)) {
      logger.warn(`Order ${orderId} is already being processed`);
      return;
    }

    try {
      this.processingOrders.add(orderId);
      logger.info(`Processing order: ${orderId}`);
      
      const order = await this.orderService.getOrder(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Validate order state
      if (order.status !== 'pending') {
        throw new Error(`Order ${orderId} is not in pending state: ${order.status}`);
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
      
      // Update order status to failed
      try {
        await this.orderService.updateOrder(orderId, { status: 'failed' });
      } catch (updateError) {
        logger.error(`Failed to update order ${orderId} status:`, updateError);
      }
      
      throw error;
    } finally {
      this.processingOrders.delete(orderId);
    }
  }

  async processEVMToAptos(order) {
    logger.info(`Processing EVM to Aptos swap for order ${order.id}`);
    
    try {
      // Step 1: Create source escrow on Ethereum
      logger.info(`Creating source escrow on ${order.fromChain}`);
      const sourceEscrowResult = await this.htlcManager.createSourceEscrow(order);
      
      // Step 2: Create destination escrow on Aptos
      logger.info(`Creating destination escrow on ${order.toChain}`);
      const destinationEscrowResult = await this.htlcManager.createDestinationEscrow(order, sourceEscrowResult);
      
      // Step 3: Update order status
      await this.orderService.updateOrder(order.id, { 
        status: 'escrowed',
        fromChainTxHash: sourceEscrowResult.transactionHash,
        toChainTxHash: destinationEscrowResult.transactionHash
      });

      logger.info(`Successfully created escrows for order ${order.id}`);
      
      // Step 4: Wait for secret reveal (this will be handled by event listeners)
      logger.info(`Order ${order.id} is now waiting for secret reveal`);
      
    } catch (error) {
      logger.error(`Failed to process EVM to Aptos swap for order ${order.id}:`, error);
      throw error;
    }
  }

  async processAptosToEVM(order) {
    logger.info(`Processing Aptos to EVM swap for order ${order.id}`);
    
    try {
      // Step 1: Create source escrow on Aptos
      logger.info(`Creating source escrow on ${order.fromChain}`);
      const sourceEscrowResult = await this.htlcManager.createSourceEscrow(order);
      
      // Step 2: Create destination escrow on Ethereum
      logger.info(`Creating destination escrow on ${order.toChain}`);
      const destinationEscrowResult = await this.htlcManager.createDestinationEscrow(order, sourceEscrowResult);
      
      // Step 3: Update order status
      await this.orderService.updateOrder(order.id, { 
        status: 'escrowed',
        fromChainTxHash: sourceEscrowResult.transactionHash,
        toChainTxHash: destinationEscrowResult.transactionHash
      });

      logger.info(`Successfully created escrows for order ${order.id}`);
      
      // Step 4: Wait for secret reveal (this will be handled by event listeners)
      logger.info(`Order ${order.id} is now waiting for secret reveal`);
      
    } catch (error) {
      logger.error(`Failed to process Aptos to EVM swap for order ${order.id}:`, error);
      throw error;
    }
  }

  // Event Handlers

  async handleEthereumEscrowCreated(swapId, maker, resolver, recipient, token, amount, hashlock, timelock, safetyDeposit, event) {
    try {
      logger.info(`Ethereum EscrowCreated event received for swap ${swapId}`);
      
      // Update escrow record
      await this.updateEscrowRecord(swapId, 'ethereum', {
        status: 'created',
        creationTxHash: event.transactionHash,
        creationBlockNumber: event.blockNumber
      });
      
    } catch (error) {
      logger.error(`Failed to handle Ethereum EscrowCreated event for ${swapId}:`, error);
    }
  }

  async handleEthereumRedeemed(swapId, redeemer, preimage, event) {
    try {
      logger.info(`Ethereum Redeemed event received for swap ${swapId}`);
      
      // Update escrow record
      await this.updateEscrowRecord(swapId, 'ethereum', {
        status: 'claimed',
        claimTxHash: event.transactionHash,
        claimBlockNumber: event.blockNumber
      });
      
      // Propagate secret to other chain
      await this.propagateSecret(swapId, preimage);
      
    } catch (error) {
      logger.error(`Failed to handle Ethereum Redeemed event for ${swapId}:`, error);
    }
  }

  async handleEthereumRefunded(swapId, refunder, event) {
    try {
      logger.info(`Ethereum Refunded event received for swap ${swapId}`);
      
      // Update escrow record
      await this.updateEscrowRecord(swapId, 'ethereum', {
        status: 'refunded',
        refundTxHash: event.transactionHash,
        refundBlockNumber: event.blockNumber
      });
      
      // Update order status
      await this.orderService.updateOrder(swapId, { status: 'refunded' });
      
    } catch (error) {
      logger.error(`Failed to handle Ethereum Refunded event for ${swapId}:`, error);
    }
  }

  async handleAptosEscrowCreated(event) {
    try {
      const swapId = event.data.swap_id;
      logger.info(`Aptos EscrowCreated event received for swap ${swapId}`);
      
      // Update escrow record
      await this.updateEscrowRecord(swapId, 'aptos', {
        status: 'created',
        creationTxHash: event.transaction_hash,
        creationBlockNumber: event.version
      });
      
    } catch (error) {
      logger.error(`Failed to handle Aptos EscrowCreated event:`, error);
    }
  }

  async handleAptosRedeemed(event) {
    try {
      const swapId = event.data.swap_id;
      const preimage = event.data.preimage;
      logger.info(`Aptos Redeemed event received for swap ${swapId}`);
      
      // Update escrow record
      await this.updateEscrowRecord(swapId, 'aptos', {
        status: 'claimed',
        claimTxHash: event.transaction_hash,
        claimBlockNumber: event.version
      });
      
      // Propagate secret to other chain
      await this.propagateSecret(swapId, preimage);
      
    } catch (error) {
      logger.error(`Failed to handle Aptos Redeemed event:`, error);
    }
  }

  async handleAptosRefunded(event) {
    try {
      const swapId = event.data.swap_id;
      logger.info(`Aptos Refunded event received for swap ${swapId}`);
      
      // Update escrow record
      await this.updateEscrowRecord(swapId, 'aptos', {
        status: 'refunded',
        refundTxHash: event.transaction_hash,
        refundBlockNumber: event.version
      });
      
      // Update order status
      await this.orderService.updateOrder(swapId, { status: 'refunded' });
      
    } catch (error) {
      logger.error(`Failed to handle Aptos Refunded event:`, error);
    }
  }

  // Helper Methods

  async updateEscrowRecord(swapId, chain, updates) {
    try {
      const escrow = await Escrow.findOne({
        where: { orderId: swapId, chain }
      });
      
      if (escrow) {
        await escrow.update(updates);
        logger.debug(`Updated escrow record for ${swapId} on ${chain}`);
      } else {
        logger.warn(`Escrow record not found for ${swapId} on ${chain}`);
      }
    } catch (error) {
      logger.error(`Failed to update escrow record for ${swapId} on ${chain}:`, error);
    }
  }

  async propagateSecret(swapId, preimage) {
    try {
      logger.info(`Propagating secret for swap ${swapId}`);
      
      // Get order details
      const order = await this.orderService.getOrder(swapId);
      if (!order) {
        logger.warn(`Order ${swapId} not found for secret propagation`);
        return;
      }

      // Verify preimage matches hashlock
      if (!verifyPreimage(preimage, order.hash)) {
        logger.error(`Invalid preimage for swap ${swapId}`);
        return;
      }

      // Process redemption on both chains
      await this.htlcManager.processRedemption(order, preimage);
      
      logger.info(`Secret propagated successfully for swap ${swapId}`);
      
    } catch (error) {
      logger.error(`Failed to propagate secret for swap ${swapId}:`, error);
    }
  }

  // Public API methods

  async getOrderStatus(orderId) {
    try {
      const order = await this.orderService.getOrder(orderId);
      if (!order) {
        return null;
      }

      return {
        orderId: order.id,
        status: order.status,
        fromChain: order.fromChain,
        toChain: order.toChain,
        amount: order.amount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        fromChainTxHash: order.fromChainTxHash,
        toChainTxHash: order.toChainTxHash
      };
    } catch (error) {
      logger.error(`Failed to get order status for ${orderId}:`, error);
      throw error;
    }
  }

  async getProcessingOrders() {
    return Array.from(this.processingOrders);
  }

  async getServiceStatus() {
    return {
      isRunning: this.isRunning,
      processingOrders: this.processingOrders.size,
      ethereumListening: this.ethereumService.isListening,
      aptosListening: this.aptosService.isListening
    };
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
