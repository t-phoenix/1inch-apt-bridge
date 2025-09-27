import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { Transaction } from '../models/Transaction.js';
import HTLC_ABI from '../contracts/HTLCEscrow.json' assert { type: 'json' };

export class EthereumService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.signer = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.provider);
    this.contractAddress = process.env.HTLC_ESCROW_ADDRESS_ETHEREUM;
    this.contract = new ethers.Contract(this.contractAddress, HTLC_ABI, this.signer);
    this.eventListeners = new Map();
    this.isListening = false;
  }

  async startEventListening() {
    if (this.isListening) {
      logger.warn('Ethereum event listening already started');
      return;
    }

    logger.info('Starting Ethereum event listening...');
    
    try {
      // Listen for EscrowCreated events
      const escrowCreatedFilter = this.contract.filters.EscrowCreated();
      const escrowCreatedListener = async (swapId, maker, resolver, recipient, token, amount, hashlock, timelock, safetyDeposit, event) => {
        await this.handleEscrowCreated(swapId, maker, resolver, recipient, token, amount, hashlock, timelock, safetyDeposit, event);
      };
      
      this.contract.on(escrowCreatedFilter, escrowCreatedListener);
      this.eventListeners.set('EscrowCreated', escrowCreatedListener);

      // Listen for Redeemed events
      const redeemedFilter = this.contract.filters.Redeemed();
      const redeemedListener = async (swapId, redeemer, preimage, event) => {
        await this.handleRedeemed(swapId, redeemer, preimage, event);
      };
      
      this.contract.on(redeemedFilter, redeemedListener);
      this.eventListeners.set('Redeemed', redeemedListener);

      // Listen for Refunded events
      const refundedFilter = this.contract.filters.Refunded();
      const refundedListener = async (swapId, refunder, event) => {
        await this.handleRefunded(swapId, refunder, event);
      };
      
      this.contract.on(refundedFilter, refundedListener);
      this.eventListeners.set('Refunded', refundedListener);

      this.isListening = true;
      logger.info('Ethereum event listening started successfully');
      
    } catch (error) {
      logger.error('Failed to start Ethereum event listening:', error);
      throw error;
    }
  }

  async stopEventListening() {
    if (!this.isListening) {
      return;
    }

    logger.info('Stopping Ethereum event listening...');
    
    try {
      // Remove all event listeners
      for (const [eventName, listener] of this.eventListeners) {
        this.contract.off(eventName, listener);
      }
      this.eventListeners.clear();
      
      this.isListening = false;
      logger.info('Ethereum event listening stopped');
      
    } catch (error) {
      logger.error('Failed to stop Ethereum event listening:', error);
      throw error;
    }
  }

  async createHTLCEscrow(swapId, maker, recipient, token, amount, hashlock, timelock, safetyDepositAmount) {
    try {
      logger.info(`Creating HTLC escrow on Ethereum for swap ${swapId}...`);
      
      // Validate inputs
      if (!swapId || !maker || !recipient || !token || !amount || !hashlock || !timelock) {
        throw new Error('Missing required parameters for HTLC escrow creation');
      }

      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `eth_${swapId}_create_${Date.now()}`,
        orderId: swapId,
        chain: 'ethereum',
        txHash: 'pending',
        type: 'escrow_creation',
        status: 'pending'
      });

      try {
        // Call createEscrow function with safety deposit
        const tx = await this.contract.createEscrow(
          swapId,
          maker,
          recipient,
          token,
          ethers.parseUnits(amount.toString(), 18), // Assuming 18 decimals
          hashlock,
          timelock,
          { value: ethers.parseEther(safetyDepositAmount.toString()) }
        );

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`HTLC escrow creation transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        // Update transaction record with confirmation
        await txRecord.update({
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString()
        });

        logger.info(`HTLC escrow created successfully on block ${receipt.blockNumber}`);
        
        return {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };

      } catch (txError) {
        // Update transaction record with failure
        await txRecord.update({
          status: 'failed',
          errorMessage: txError.message
        });
        
        throw txError;
      }
      
    } catch (error) {
      logger.error('Failed to create HTLC escrow:', error);
      throw error;
    }
  }

  async redeemHTLC(swapId, preimage) {
    try {
      logger.info(`Redeeming HTLC escrow on Ethereum for swap ${swapId}...`);
      
      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `eth_${swapId}_redeem_${Date.now()}`,
        orderId: swapId,
        chain: 'ethereum',
        txHash: 'pending',
        type: 'escrow_claim',
        status: 'pending'
      });

      try {
        // Call redeem function
        const tx = await this.contract.redeem(swapId, preimage);

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`HTLC redeem transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        // Update transaction record with confirmation
        await txRecord.update({
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString()
        });

        logger.info(`HTLC redeemed successfully on block ${receipt.blockNumber}`);
        
        return {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };

      } catch (txError) {
        // Update transaction record with failure
        await txRecord.update({
          status: 'failed',
          errorMessage: txError.message
        });
        
        throw txError;
      }
      
    } catch (error) {
      logger.error('Failed to redeem HTLC:', error);
      throw error;
    }
  }

  async refundHTLC(swapId) {
    try {
      logger.info(`Refunding HTLC escrow on Ethereum for swap ${swapId}...`);
      
      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `eth_${swapId}_refund_${Date.now()}`,
        orderId: swapId,
        chain: 'ethereum',
        txHash: 'pending',
        type: 'escrow_refund',
        status: 'pending'
      });

      try {
        // Call refund function
        const tx = await this.contract.refund(swapId);

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`HTLC refund transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        // Update transaction record with confirmation
        await txRecord.update({
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString()
        });

        logger.info(`HTLC refunded successfully on block ${receipt.blockNumber}`);
        
        return {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };

      } catch (txError) {
        // Update transaction record with failure
        await txRecord.update({
          status: 'failed',
          errorMessage: txError.message
        });
        
        throw txError;
      }
      
    } catch (error) {
      logger.error('Failed to refund HTLC:', error);
      throw error;
    }
  }

  async claimSafetyDeposit(swapId) {
    try {
      logger.info(`Claiming safety deposit on Ethereum for swap ${swapId}...`);
      
      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `eth_${swapId}_claim_${Date.now()}`,
        orderId: swapId,
        chain: 'ethereum',
        txHash: 'pending',
        type: 'escrow_claim',
        status: 'pending'
      });

      try {
        // Call claimSafetyDeposit function
        const tx = await this.contract.claimSafetyDeposit(swapId);

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`Safety deposit claim transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        // Update transaction record with confirmation
        await txRecord.update({
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString()
        });

        logger.info(`Safety deposit claimed successfully on block ${receipt.blockNumber}`);
        
        return {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };

      } catch (txError) {
        // Update transaction record with failure
        await txRecord.update({
          status: 'failed',
          errorMessage: txError.message
        });
        
        throw txError;
      }
      
    } catch (error) {
      logger.error('Failed to claim safety deposit:', error);
      throw error;
    }
  }

  async getSwapInfo(swapId) {
    try {
      const swapData = await this.contract.getSwap(swapId);
      
      return {
        maker: swapData.maker,
        resolver: swapData.resolver,
        recipient: swapData.recipient,
        token: swapData.token,
        amount: swapData.amount.toString(),
        hashlock: swapData.hashlock,
        timelock: swapData.timelock.toString(),
        safetyDeposit: swapData.safetyDeposit.toString(),
        redeemed: swapData.redeemed,
        refunded: swapData.refunded,
        createdAt: swapData.createdAt.toString()
      };
    } catch (error) {
      logger.error(`Failed to get swap info for ${swapId}:`, error);
      throw error;
    }
  }

  async checkSwapExists(swapId) {
    try {
      return await this.contract.swapExists(swapId);
    } catch (error) {
      logger.error(`Failed to check if swap exists for ${swapId}:`, error);
      return false;
    }
  }

  async isSwapExpired(swapId) {
    try {
      return await this.contract.isExpired(swapId);
    } catch (error) {
      logger.error(`Failed to check if swap is expired for ${swapId}:`, error);
      return false;
    }
  }

  // Event handlers
  async handleEscrowCreated(swapId, maker, resolver, recipient, token, amount, hashlock, timelock, safetyDeposit, event) {
    try {
      logger.info(`EscrowCreated event received for swap ${swapId}`);
      
      // Update database with escrow creation
      // This would typically update the order status and create escrow record
      // Implementation depends on your specific business logic
      
    } catch (error) {
      logger.error(`Failed to handle EscrowCreated event for ${swapId}:`, error);
    }
  }

  async handleRedeemed(swapId, redeemer, preimage, event) {
    try {
      logger.info(`Redeemed event received for swap ${swapId}`);
      
      // Update database with redemption
      // This would typically update the order status and escrow record
      
    } catch (error) {
      logger.error(`Failed to handle Redeemed event for ${swapId}:`, error);
    }
  }

  async handleRefunded(swapId, refunder, event) {
    try {
      logger.info(`Refunded event received for swap ${swapId}`);
      
      // Update database with refund
      // This would typically update the order status and escrow record
      
    } catch (error) {
      logger.error(`Failed to handle Refunded event for ${swapId}:`, error);
    }
  }

  // Utility methods
  async getCurrentBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Failed to get current block number:', error);
      throw error;
    }
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice;
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async estimateGas(method, ...args) {
    try {
      return await this.contract[method].estimateGas(...args);
    } catch (error) {
      logger.error(`Failed to estimate gas for ${method}:`, error);
      throw error;
    }
  }
}
