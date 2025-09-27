import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { logger } from '../utils/logger.js';
import { Transaction } from '../models/Transaction.js';
import { hexToBytes, bytesToHex } from '../utils/crypto.js';

export class AptosService {
  constructor() {
    const config = new AptosConfig({
      network: Network.MAINNET,
      fullnode: process.env.APTOS_NODE_URL
    });
    this.client = new Aptos(config);
    
    // Create account from private key
    const privateKey = new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY);
    this.account = Account.fromPrivateKey({ privateKey });
    
    this.moduleAddress = process.env.HTLC_ESCROW_ADDRESS_APTOS;
    this.eventListeners = new Map();
    this.isListening = false;
    this.pollingInterval = null;
  }

  async startEventListening() {
    if (this.isListening) {
      logger.warn('Aptos event listening already started');
      return;
    }

    logger.info('Starting Aptos event listening...');
    
    try {
      // Start polling for events (Aptos doesn't have real-time event streaming like Ethereum)
      this.startEventPolling();
      
      this.isListening = true;
      logger.info('Aptos event listening started successfully');
      
    } catch (error) {
      logger.error('Failed to start Aptos event listening:', error);
      throw error;
    }
  }

  async stopEventListening() {
    if (!this.isListening) {
      return;
    }

    logger.info('Stopping Aptos event listening...');
    
    try {
      // Stop polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      this.eventListeners.clear();
      this.isListening = false;
      logger.info('Aptos event listening stopped');
      
    } catch (error) {
      logger.error('Failed to stop Aptos event listening:', error);
      throw error;
    }
  }

  startEventPolling() {
    // Poll for events every 5 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForEvents();
      } catch (error) {
        logger.error('Error polling for Aptos events:', error);
      }
    }, 5000);
  }

  async pollForEvents() {
    try {
      // Get recent transactions and check for HTLC events
      const events = await this.client.getEvents({
        query: {
          moveType: `${this.moduleAddress}::htlc::EscrowCreatedEvent`
        }
      });

      for (const event of events) {
        await this.handleEscrowCreatedEvent(event);
      }
    } catch (error) {
      // Ignore errors for individual event polling
      logger.debug('Event polling error:', error.message);
    }
  }

  async createHTLCEscrow(swapId, maker, recipient, amount, hashlock, timelock, safetyDepositAmount) {
    try {
      logger.info(`Creating HTLC escrow on Aptos for swap ${swapId}...`);
      
      // Validate inputs
      if (!swapId || !maker || !recipient || !amount || !hashlock || !timelock) {
        throw new Error('Missing required parameters for HTLC escrow creation');
      }

      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `aptos_${swapId}_create_${Date.now()}`,
        orderId: swapId,
        chain: 'aptos',
        txHash: 'pending',
        type: 'escrow_creation',
        status: 'pending'
      });

      try {
        // Convert hashlock to bytes
        const hashlockBytes = hexToBytes(hashlock);
        
        // Create transaction payload
        const payload = {
          function: `${this.moduleAddress}::htlc::create_escrow`,
          typeArguments: [],
          arguments: [
            swapId,
            maker,
            recipient,
            amount.toString(),
            Array.from(hashlockBytes), // Convert to array for Aptos
            timelock.toString(),
          ],
        };

        // Submit transaction with safety deposit
        const tx = await this.client.transaction({
          sender: this.account.accountAddress,
          data: payload,
          options: {
            maxGasAmount: 100000,
          },
        });

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`HTLC escrow creation transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await this.client.waitForTransaction({
          transactionHash: tx.hash,
        });

        if (receipt.success) {
          // Update transaction record with confirmation
          await txRecord.update({
            status: 'confirmed',
            blockNumber: receipt.version, // Aptos uses version instead of block number
          });

          logger.info(`HTLC escrow created successfully on version ${receipt.version}`);
          
          return {
            transactionHash: tx.hash,
            blockNumber: receipt.version,
            gasUsed: receipt.gas_used
          };
        } else {
          throw new Error(`Transaction failed: ${receipt.vm_status}`);
        }

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
      logger.info(`Redeeming HTLC escrow on Aptos for swap ${swapId}...`);
      
      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `aptos_${swapId}_redeem_${Date.now()}`,
        orderId: swapId,
        chain: 'aptos',
        txHash: 'pending',
        type: 'escrow_claim',
        status: 'pending'
      });

      try {
        // Convert preimage to bytes
        const preimageBytes = hexToBytes(preimage);
        
        // Create transaction payload
        const payload = {
          function: `${this.moduleAddress}::htlc::redeem`,
          typeArguments: [],
          arguments: [
            swapId,
            Array.from(preimageBytes), // Convert to array for Aptos
          ],
        };

        // Submit transaction
        const tx = await this.client.transaction({
          sender: this.account.accountAddress,
          data: payload,
          options: {
            maxGasAmount: 100000,
          },
        });

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`HTLC redeem transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await this.client.waitForTransaction({
          transactionHash: tx.hash,
        });

        if (receipt.success) {
          // Update transaction record with confirmation
          await txRecord.update({
            status: 'confirmed',
            blockNumber: receipt.version,
          });

          logger.info(`HTLC redeemed successfully on version ${receipt.version}`);
          
          return {
            transactionHash: tx.hash,
            blockNumber: receipt.version,
            gasUsed: receipt.gas_used
          };
        } else {
          throw new Error(`Transaction failed: ${receipt.vm_status}`);
        }

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
      logger.info(`Refunding HTLC escrow on Aptos for swap ${swapId}...`);
      
      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `aptos_${swapId}_refund_${Date.now()}`,
        orderId: swapId,
        chain: 'aptos',
        txHash: 'pending',
        type: 'escrow_refund',
        status: 'pending'
      });

      try {
        // Create transaction payload
        const payload = {
          function: `${this.moduleAddress}::htlc::refund`,
          typeArguments: [],
          arguments: [swapId],
        };

        // Submit transaction
        const tx = await this.client.transaction({
          sender: this.account.accountAddress,
          data: payload,
          options: {
            maxGasAmount: 100000,
          },
        });

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`HTLC refund transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await this.client.waitForTransaction({
          transactionHash: tx.hash,
        });

        if (receipt.success) {
          // Update transaction record with confirmation
          await txRecord.update({
            status: 'confirmed',
            blockNumber: receipt.version,
          });

          logger.info(`HTLC refunded successfully on version ${receipt.version}`);
          
          return {
            transactionHash: tx.hash,
            blockNumber: receipt.version,
            gasUsed: receipt.gas_used
          };
        } else {
          throw new Error(`Transaction failed: ${receipt.vm_status}`);
        }

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
      logger.info(`Claiming safety deposit on Aptos for swap ${swapId}...`);
      
      // Record transaction attempt
      const txRecord = await Transaction.create({
        id: `aptos_${swapId}_claim_${Date.now()}`,
        orderId: swapId,
        chain: 'aptos',
        txHash: 'pending',
        type: 'escrow_claim',
        status: 'pending'
      });

      try {
        // Create transaction payload
        const payload = {
          function: `${this.moduleAddress}::htlc::claim_safety_deposit`,
          typeArguments: [],
          arguments: [swapId],
        };

        // Submit transaction
        const tx = await this.client.transaction({
          sender: this.account.accountAddress,
          data: payload,
          options: {
            maxGasAmount: 100000,
          },
        });

        // Update transaction record
        await txRecord.update({
          txHash: tx.hash,
          status: 'pending'
        });

        logger.info(`Safety deposit claim transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await this.client.waitForTransaction({
          transactionHash: tx.hash,
        });

        if (receipt.success) {
          // Update transaction record with confirmation
          await txRecord.update({
            status: 'confirmed',
            blockNumber: receipt.version,
          });

          logger.info(`Safety deposit claimed successfully on version ${receipt.version}`);
          
          return {
            transactionHash: tx.hash,
            blockNumber: receipt.version,
            gasUsed: receipt.gas_used
          };
        } else {
          throw new Error(`Transaction failed: ${receipt.vm_status}`);
        }

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
      const response = await this.client.view({
        payload: {
          function: `${this.moduleAddress}::htlc::get_swap`,
          typeArguments: [],
          arguments: [swapId],
        },
      });

      if (response && response.length > 0) {
        const swapData = response[0];
        return {
          maker: swapData.maker,
          resolver: swapData.resolver,
          recipient: swapData.recipient,
          amount: swapData.amount.toString(),
          hashlock: bytesToHex(new Uint8Array(swapData.hashlock)),
          timelock: swapData.timelock.toString(),
          safetyDeposit: swapData.safety_deposit.toString(),
          redeemed: swapData.redeemed,
          refunded: swapData.refunded,
          createdAt: swapData.created_at.toString()
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get swap info for ${swapId}:`, error);
      throw error;
    }
  }

  async checkSwapExists(swapId) {
    try {
      const response = await this.client.view({
        payload: {
          function: `${this.moduleAddress}::htlc::swap_exists`,
          typeArguments: [],
          arguments: [swapId],
        },
      });

      return response && response.length > 0 ? response[0] : false;
    } catch (error) {
      logger.error(`Failed to check if swap exists for ${swapId}:`, error);
      return false;
    }
  }

  async isSwapExpired(swapId) {
    try {
      const response = await this.client.view({
        payload: {
          function: `${this.moduleAddress}::htlc::is_expired`,
          typeArguments: [],
          arguments: [swapId],
        },
      });

      return response && response.length > 0 ? response[0] : false;
    } catch (error) {
      logger.error(`Failed to check if swap is expired for ${swapId}:`, error);
      return false;
    }
  }

  // Event handlers
  async handleEscrowCreatedEvent(event) {
    try {
      logger.info(`EscrowCreated event received for swap ${event.data.swap_id}`);
      
      // Update database with escrow creation
      // This would typically update the order status and create escrow record
      // Implementation depends on your specific business logic
      
    } catch (error) {
      logger.error(`Failed to handle EscrowCreated event for ${event.data.swap_id}:`, error);
    }
  }

  // Utility methods
  async getCurrentVersion() {
    try {
      const response = await this.client.getLedgerInfo();
      return parseInt(response.ledger_version);
    } catch (error) {
      logger.error('Failed to get current version:', error);
      throw error;
    }
  }

  async getAccountBalance() {
    try {
      const response = await this.client.getAccountAPTAmount({
        accountAddress: this.account.accountAddress,
      });
      return response;
    } catch (error) {
      logger.error('Failed to get account balance:', error);
      throw error;
    }
  }

  async estimateGas(payload) {
    try {
      // Aptos doesn't have gas estimation like Ethereum
      // Return a default gas amount
      return 100000;
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  // Helper method to convert Aptos address format
  normalizeAddress(address) {
    // Remove 0x prefix and pad to 64 characters
    const cleanAddress = address.replace('0x', '');
    return '0x' + cleanAddress.padStart(64, '0');
  }

  // Helper method to validate Aptos transaction
  async validateTransaction(transactionHash) {
    try {
      const tx = await this.client.getTransactionByHash({
        transactionHash,
      });
      return tx && tx.success;
    } catch (error) {
      logger.error(`Failed to validate transaction ${transactionHash}:`, error);
      return false;
    }
  }
}
