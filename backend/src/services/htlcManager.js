import { logger } from '../utils/logger.js';
import { EthereumService } from './ethereum.js';
import { AptosService } from './aptos.js';
import { OrderService } from './orderService.js';
import { Escrow } from '../models/Escrow.js';
import { Transaction } from '../models/Transaction.js';
import { 
  verifyPreimage, 
  validateHash, 
  validateSecret,
  hexToBytes,
  bytesToHex 
} from '../utils/crypto.js';

export class HTLCManager {
  constructor() {
    this.ethereumService = new EthereumService();
    this.aptosService = new AptosService();
    this.orderService = new OrderService();
    this.activeSwaps = new Map(); // Track active swaps
    this.finalityBlocks = {
      ethereum: 12, // ~2-3 minutes
      polygon: 128, // ~4 minutes
      aptos: 10 // ~10 seconds
    };
  }

  /**
   * Create escrow on source chain (EVM)
   * @param {Object} order - Order data
   * @returns {Object} Escrow creation result
   */
  async createSourceEscrow(order) {
    try {
      logger.info(`Creating source escrow for order ${order.id} on ${order.fromChain}`);

      // Validate order data
      this.validateOrderData(order);

      // Determine which service to use based on source chain
      const service = this.getServiceForChain(order.fromChain);
      if (!service) {
        throw new Error(`Unsupported source chain: ${order.fromChain}`);
      }

      // Prepare escrow parameters
      const escrowParams = this.prepareEscrowParams(order, 'source');

      // Create escrow on source chain
      const result = await this.executeEscrowCreation(service, escrowParams, order.fromChain);

      // Create escrow record in database
      const escrowRecord = await this.createEscrowRecord(order, 'source', result);

      logger.info(`Source escrow created successfully: ${result.transactionHash}`);
      return {
        success: true,
        escrowId: escrowRecord.id,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };

    } catch (error) {
      logger.error(`Failed to create source escrow for order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Create escrow on destination chain (Aptos)
   * @param {Object} order - Order data
   * @param {Object} sourceEscrowResult - Source escrow creation result
   * @returns {Object} Escrow creation result
   */
  async createDestinationEscrow(order, sourceEscrowResult) {
    try {
      logger.info(`Creating destination escrow for order ${order.id} on ${order.toChain}`);

      // Wait for source escrow finality
      await this.waitForFinality(order.fromChain, sourceEscrowResult.blockNumber);

      // Validate source escrow exists and is confirmed
      const sourceEscrow = await this.validateSourceEscrow(order, sourceEscrowResult);
      if (!sourceEscrow) {
        throw new Error('Source escrow validation failed');
      }

      // Determine which service to use based on destination chain
      const service = this.getServiceForChain(order.toChain);
      if (!service) {
        throw new Error(`Unsupported destination chain: ${order.toChain}`);
      }

      // Prepare escrow parameters
      const escrowParams = this.prepareEscrowParams(order, 'destination');

      // Create escrow on destination chain
      const result = await this.executeEscrowCreation(service, escrowParams, order.toChain);

      // Create escrow record in database
      const escrowRecord = await this.createEscrowRecord(order, 'destination', result);

      // Update order status
      await this.orderService.updateOrder(order.id, { 
        status: 'escrowed',
        fromChainTxHash: sourceEscrowResult.transactionHash,
        toChainTxHash: result.transactionHash
      });

      logger.info(`Destination escrow created successfully: ${result.transactionHash}`);
      return {
        success: true,
        escrowId: escrowRecord.id,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };

    } catch (error) {
      logger.error(`Failed to create destination escrow for order ${order.id}:`, error);
      
      // Update order status to failed
      await this.orderService.updateOrder(order.id, { status: 'failed' });
      
      throw error;
    }
  }

  /**
   * Process redemption when secret is revealed
   * @param {Object} order - Order data
   * @param {string} preimage - Secret preimage
   * @returns {Object} Redemption result
   */
  async processRedemption(order, preimage) {
    try {
      logger.info(`Processing redemption for order ${order.id}`);

      // Validate preimage
      if (!validateSecret(preimage)) {
        throw new Error('Invalid preimage format');
      }

      if (!verifyPreimage(preimage, order.hash)) {
        throw new Error('Preimage does not match hashlock');
      }

      // Get escrow records
      const escrows = await this.getEscrowRecords(order.id);
      if (!escrows || escrows.length !== 2) {
        throw new Error('Invalid escrow records found');
      }

      const sourceEscrow = escrows.find(e => e.chain === order.fromChain);
      const destinationEscrow = escrows.find(e => e.chain === order.toChain);

      // Redeem on both chains
      const results = await Promise.allSettled([
        this.redeemEscrow(order.fromChain, sourceEscrow.contractAddress, order.id, preimage),
        this.redeemEscrow(order.toChain, destinationEscrow.contractAddress, order.id, preimage)
      ]);

      // Check results
      const sourceResult = results[0];
      const destinationResult = results[1];

      if (sourceResult.status === 'rejected' || destinationResult.status === 'rejected') {
        logger.error('Redemption failed on one or both chains:', {
          source: sourceResult.status,
          destination: destinationResult.status
        });
        
        // Update order status
        await this.orderService.updateOrder(order.id, { status: 'failed' });
        
        throw new Error('Redemption failed on one or both chains');
      }

      // Update order status
      await this.orderService.updateOrder(order.id, { 
        status: 'claimed',
        secret: preimage // Store the revealed secret
      });

      logger.info(`Redemption completed successfully for order ${order.id}`);
      return {
        success: true,
        sourceResult: sourceResult.value,
        destinationResult: destinationResult.value
      };

    } catch (error) {
      logger.error(`Failed to process redemption for order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Process refund when timelock expires
   * @param {Object} order - Order data
   * @returns {Object} Refund result
   */
  async processRefund(order) {
    try {
      logger.info(`Processing refund for order ${order.id}`);

      // Check if timelock has expired
      if (!this.isTimelockExpired(order)) {
        throw new Error('Timelock has not expired yet');
      }

      // Get escrow records
      const escrows = await this.getEscrowRecords(order.id);
      if (!escrows || escrows.length !== 2) {
        throw new Error('Invalid escrow records found');
      }

      const sourceEscrow = escrows.find(e => e.chain === order.fromChain);
      const destinationEscrow = escrows.find(e => e.chain === order.toChain);

      // Refund on both chains
      const results = await Promise.allSettled([
        this.refundEscrow(order.fromChain, sourceEscrow.contractAddress, order.id),
        this.refundEscrow(order.toChain, destinationEscrow.contractAddress, order.id)
      ]);

      // Check results
      const sourceResult = results[0];
      const destinationResult = results[1];

      if (sourceResult.status === 'rejected' || destinationResult.status === 'rejected') {
        logger.error('Refund failed on one or both chains:', {
          source: sourceResult.status,
          destination: destinationResult.status
        });
      }

      // Update order status
      await this.orderService.updateOrder(order.id, { status: 'refunded' });

      logger.info(`Refund completed for order ${order.id}`);
      return {
        success: true,
        sourceResult: sourceResult.value,
        destinationResult: destinationResult.value
      };

    } catch (error) {
      logger.error(`Failed to process refund for order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Monitor escrow status and handle timeouts
   * @param {string} orderId - Order ID
   */
  async monitorEscrow(orderId) {
    try {
      const order = await this.orderService.getOrder(orderId);
      if (!order) {
        logger.warn(`Order ${orderId} not found for monitoring`);
        return;
      }

      // Check if order is in escrowed state
      if (order.status !== 'escrowed') {
        logger.debug(`Order ${orderId} is not in escrowed state: ${order.status}`);
        return;
      }

      // Check if timelock has expired
      if (this.isTimelockExpired(order)) {
        logger.info(`Timelock expired for order ${orderId}, processing refund`);
        await this.processRefund(order);
      }

    } catch (error) {
      logger.error(`Failed to monitor escrow for order ${orderId}:`, error);
    }
  }

  // Helper methods

  validateOrderData(order) {
    if (!order || !order.id) {
      throw new Error('Invalid order data');
    }

    if (!validateHash(order.hash)) {
      throw new Error('Invalid hashlock format');
    }

    if (!order.fromChain || !order.toChain) {
      throw new Error('Missing chain information');
    }

    if (!order.makerAddress || !order.takerAddress) {
      throw new Error('Missing participant addresses');
    }
  }

  getServiceForChain(chain) {
    switch (chain.toLowerCase()) {
      case 'ethereum':
      case 'polygon':
        return this.ethereumService;
      case 'aptos':
        return this.aptosService;
      default:
        return null;
    }
  }

  prepareEscrowParams(order, type) {
    const isSource = type === 'source';
    const chain = isSource ? order.fromChain : order.toChain;
    
    return {
      swapId: order.id,
      maker: order.makerAddress,
      recipient: isSource ? order.takerAddress : order.makerAddress,
      token: isSource ? order.fromToken : order.toToken,
      amount: order.amount,
      hashlock: order.hash,
      timelock: order.timelock,
      safetyDepositAmount: this.getSafetyDepositAmount(chain)
    };
  }

  async executeEscrowCreation(service, params, chain) {
    try {
      if (chain === 'aptos') {
        return await service.createHTLCEscrow(
          params.swapId,
          params.maker,
          params.recipient,
          params.amount,
          params.hashlock,
          params.timelock,
          params.safetyDepositAmount
        );
      } else {
        return await service.createHTLCEscrow(
          params.swapId,
          params.maker,
          params.recipient,
          params.token,
          params.amount,
          params.hashlock,
          params.timelock,
          params.safetyDepositAmount
        );
      }
    } catch (error) {
      logger.error(`Failed to execute escrow creation on ${chain}:`, error);
      throw error;
    }
  }

  async createEscrowRecord(order, type, result) {
    const chain = type === 'source' ? order.fromChain : order.toChain;
    const contractAddress = this.getContractAddress(chain);

    return await Escrow.create({
      id: `${chain}_${order.id}_${type}`,
      orderId: order.id,
      chain: chain,
      contractAddress: contractAddress,
      hash: order.hash,
      timelock: order.timelock,
      status: 'created',
      creationTxHash: result.transactionHash,
      creationBlockNumber: result.blockNumber
    });
  }

  async waitForFinality(chain, blockNumber) {
    const requiredConfirmations = this.finalityBlocks[chain.toLowerCase()];
    if (!requiredConfirmations) {
      logger.warn(`Unknown finality requirements for chain: ${chain}`);
      return;
    }

    logger.info(`Waiting for ${requiredConfirmations} confirmations on ${chain}`);
    
    const service = this.getServiceForChain(chain);
    if (!service) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Poll until we have enough confirmations
    while (true) {
      const currentBlock = await service.getCurrentBlockNumber();
      const confirmations = currentBlock - blockNumber;
      
      if (confirmations >= requiredConfirmations) {
        logger.info(`Finality reached on ${chain} with ${confirmations} confirmations`);
        break;
      }
      
      logger.debug(`Waiting for finality on ${chain}: ${confirmations}/${requiredConfirmations} confirmations`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
  }

  async validateSourceEscrow(order, sourceEscrowResult) {
    const service = this.getServiceForChain(order.fromChain);
    if (!service) {
      throw new Error(`Unsupported chain: ${order.fromChain}`);
    }

    try {
      const swapInfo = await service.getSwapInfo(order.id);
      return swapInfo && !swapInfo.redeemed && !swapInfo.refunded;
    } catch (error) {
      logger.error('Failed to validate source escrow:', error);
      return false;
    }
  }

  async redeemEscrow(chain, contractAddress, orderId, preimage) {
    const service = this.getServiceForChain(chain);
    if (!service) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    return await service.redeemHTLC(orderId, preimage);
  }

  async refundEscrow(chain, contractAddress, orderId) {
    const service = this.getServiceForChain(chain);
    if (!service) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    return await service.refundHTLC(orderId);
  }

  async getEscrowRecords(orderId) {
    return await Escrow.findAll({
      where: { orderId }
    });
  }

  isTimelockExpired(order) {
    const now = Math.floor(Date.now() / 1000);
    return now > order.timelock;
  }

  getSafetyDepositAmount(chain) {
    // Return safety deposit amounts based on chain
    const amounts = {
      ethereum: 0.1, // 0.1 ETH
      polygon: 10,   // 10 MATIC
      aptos: 10      // 10 APT
    };
    
    return amounts[chain.toLowerCase()] || 0.1;
  }

  getContractAddress(chain) {
    // Return contract addresses based on chain
    const addresses = {
      ethereum: process.env.HTLC_ESCROW_ADDRESS_ETHEREUM,
      polygon: process.env.HTLC_ESCROW_ADDRESS_POLYGON,
      aptos: process.env.HTLC_ESCROW_ADDRESS_APTOS
    };
    
    const address = addresses[chain.toLowerCase()];
    if (!address) {
      throw new Error(`Contract address not configured for chain: ${chain}`);
    }
    
    return address;
  }

  // Utility methods for service access
  getCurrentBlockNumber(chain) {
    const service = this.getServiceForChain(chain);
    if (!service) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    return service.getCurrentBlockNumber();
  }

  async getGasPrice(chain) {
    const service = this.getServiceForChain(chain);
    if (!service) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    return await service.getGasPrice();
  }

  /**
   * Process redemption on both chains when secret is revealed
   * @param {Object} order - Order data
   * @param {string} preimage - The secret preimage
   * @returns {Object} Redemption results
   */
  async processRedemption(order, preimage) {
    try {
      logger.info(`Processing redemption for order ${order.id}`);
      
      // Verify preimage matches the hashlock
      if (!verifyPreimage(preimage, order.hash)) {
        throw new Error('Invalid preimage for redemption');
      }

      // Process redemption on both chains
      const redemptionPromises = [];

      if (order.fromChain === 'ethereum') {
        redemptionPromises.push(
          this.ethereumService.redeemHTLC(order.id, preimage)
        );
      } else if (order.fromChain === 'aptos') {
        redemptionPromises.push(
          this.aptosService.redeemHTLC(order.id, preimage)
        );
      }

      if (order.toChain === 'ethereum') {
        redemptionPromises.push(
          this.ethereumService.redeemHTLC(order.id, preimage)
        );
      } else if (order.toChain === 'aptos') {
        redemptionPromises.push(
          this.aptosService.redeemHTLC(order.id, preimage)
        );
      }

      // Execute redemptions in parallel
      const results = await Promise.allSettled(redemptionPromises);
      
      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        logger.error(`Some redemptions failed for order ${order.id}:`, failures);
        // Continue with successful redemptions
      }

      // Update order status
      await this.orderService.updateOrder(order.id, { 
        status: 'completed',
        completedAt: new Date()
      });

      logger.info(`Redemption completed for order ${order.id}`);
      
      return {
        success: true,
        results: results.map((result, index) => ({
          chain: index < redemptionPromises.length / 2 ? order.fromChain : order.toChain,
          status: result.status,
          value: result.status === 'fulfilled' ? result.value : result.reason
        }))
      };
      
    } catch (error) {
      logger.error(`Failed to process redemption for order ${order.id}:`, error);
      throw error;
    }
  }
}
