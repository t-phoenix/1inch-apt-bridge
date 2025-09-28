// Swap service for managing cross-chain swaps
import { apiService } from './api';
import { wsService } from './websocket';

export interface SwapRequest {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipientAddress: string;
  timelock?: number;
  slippage?: number;
  deadline?: number;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  route: any[];
  protocols: string[];
}

export interface SwapStatus {
  id: string;
  status: 'pending' | 'escrowed' | 'completed' | 'failed' | 'refunded';
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipientAddress: string;
  timelock: number;
  createdAt: string;
  updatedAt: string;
  fromChainTxHash?: string;
  toChainTxHash?: string;
  completedAt?: string;
  error?: string;
}

class SwapService {
  private activeSwaps = new Map<string, SwapStatus>();

  // Create a new swap order
  async createSwap(request: SwapRequest): Promise<SwapStatus> {
    try {
      const response = await apiService.createSwap({
        orderId: this.generateSwapId(),
        fromChain: request.fromChain,
        toChain: request.toChain,
        fromToken: request.fromToken,
        toToken: request.toToken,
        amount: request.amount,
        recipientAddress: request.recipientAddress,
        timelock: request.timelock || this.getDefaultTimelock(request.fromChain),
      });

      const swap = response.data.order;
      this.activeSwaps.set(swap.id, swap);
      
      // Subscribe to swap updates
      wsService.subscribe(['swaps']);
      
      return swap;
    } catch (error) {
      console.error('Failed to create swap:', error);
      throw error;
    }
  }

  // Get swap status
  async getSwapStatus(swapId: string): Promise<SwapStatus> {
    try {
      const response = await apiService.getSwap(swapId);
      const swap = response.data.status;
      
      this.activeSwaps.set(swapId, swap);
      return swap;
    } catch (error) {
      console.error('Failed to get swap status:', error);
      throw error;
    }
  }

  // Get quote for a swap
  async getSwapQuote(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapQuote> {
    try {
      // For same-chain swaps, use 1inch
      if (fromChain === toChain) {
        const response = await apiService.getQuote(fromChain, {
          fromToken,
          toToken,
          amount,
          slippage: 0.5,
        });

        return {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: response.data.quote.toAmount,
          priceImpact: response.data.quote.estimatedGas || '0',
          gasEstimate: response.data.quote.estimatedGas || '0',
          route: response.data.quote.protocols || [],
          protocols: response.data.quote.protocols || [],
        };
      }

      // For cross-chain swaps, we need to implement custom logic
      // This would involve getting quotes from both chains and calculating the best route
      return this.getCrossChainQuote(fromChain, toChain, fromToken, toToken, amount);
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      throw error;
    }
  }

  // Get cross-chain quote
  private async getCrossChainQuote(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapQuote> {
    // This is a simplified implementation
    // In a real implementation, you would:
    // 1. Get quotes from both chains
    // 2. Calculate the best route
    // 3. Consider gas costs and slippage
    // 4. Factor in the HTLC timelock

    const fromChainQuote = await apiService.getQuote(fromChain, {
      fromToken,
      toToken: this.getWrappedToken(fromChain), // Use wrapped token for cross-chain
      amount,
      slippage: 0.5,
    });

    const toChainQuote = await apiService.getQuote(toChain, {
      fromToken: this.getWrappedToken(toChain),
      toToken,
      amount: fromChainQuote.data.quote.toAmount,
      slippage: 0.5,
    });

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: toChainQuote.data.quote.toAmount,
      priceImpact: 0.5, // Estimated price impact
      gasEstimate: '0', // Will be calculated during execution
      route: [
        ...fromChainQuote.data.quote.protocols,
        'HTLC',
        ...toChainQuote.data.quote.protocols,
      ],
      protocols: [
        ...fromChainQuote.data.quote.protocols,
        'HTLC',
        ...toChainQuote.data.quote.protocols,
      ],
    };
  }

  // Redeem swap with preimage
  async redeemSwap(swapId: string, preimage: string): Promise<void> {
    try {
      await apiService.redeemSwap(swapId, preimage);
      
      // Update local status
      const swap = this.activeSwaps.get(swapId);
      if (swap) {
        swap.status = 'completed';
        swap.completedAt = new Date().toISOString();
        this.activeSwaps.set(swapId, swap);
      }
    } catch (error) {
      console.error('Failed to redeem swap:', error);
      throw error;
    }
  }

  // Refund swap
  async refundSwap(swapId: string): Promise<void> {
    try {
      await apiService.refundSwap(swapId);
      
      // Update local status
      const swap = this.activeSwaps.get(swapId);
      if (swap) {
        swap.status = 'refunded';
        this.activeSwaps.set(swapId, swap);
      }
    } catch (error) {
      console.error('Failed to refund swap:', error);
      throw error;
    }
  }

  // Get active swaps
  getActiveSwaps(): SwapStatus[] {
    return Array.from(this.activeSwaps.values());
  }

  // Get swap by ID
  getSwap(swapId: string): SwapStatus | undefined {
    return this.activeSwaps.get(swapId);
  }

  // Clear completed swaps
  clearCompletedSwaps(): void {
    for (const [id, swap] of this.activeSwaps.entries()) {
      if (swap.status === 'completed' || swap.status === 'refunded' || swap.status === 'failed') {
        this.activeSwaps.delete(id);
      }
    }
  }

  // Validate swap request
  validateSwapRequest(request: SwapRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.fromChain) errors.push('From chain is required');
    if (!request.toChain) errors.push('To chain is required');
    if (!request.fromToken) errors.push('From token is required');
    if (!request.toToken) errors.push('To token is required');
    if (!request.amount || parseFloat(request.amount) <= 0) errors.push('Amount must be greater than 0');
    if (!request.recipientAddress) errors.push('Recipient address is required');

    if (request.fromChain === request.toChain) {
      errors.push('From and to chains must be different for cross-chain swaps');
    }

    if (request.timelock && request.timelock < 300) {
      errors.push('Timelock must be at least 5 minutes (300 seconds)');
    }

    if (request.slippage && (request.slippage < 0.1 || request.slippage > 50)) {
      errors.push('Slippage must be between 0.1% and 50%');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get supported chains
  getSupportedChains(): string[] {
    return ['ethereum', 'polygon', 'aptos'];
  }

  // Get supported tokens for a chain
  async getSupportedTokens(chain: string): Promise<any[]> {
    try {
      const response = await apiService.getTokens(chain);
      return response.data.tokens || [];
    } catch (error) {
      console.error(`Failed to get supported tokens for ${chain}:`, error);
      return [];
    }
  }

  // Get default timelock for a chain
  private getDefaultTimelock(chain: string): number {
    const timelocks = {
      ethereum: 3600, // 1 hour
      polygon: 1800,  // 30 minutes
      aptos: 1800,    // 30 minutes
    };
    return timelocks[chain as keyof typeof timelocks] || 3600;
  }

  // Get wrapped token for a chain
  private getWrappedToken(chain: string): string {
    const wrappedTokens = {
      ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      aptos: '0x1::aptos_coin::AptosCoin', // APT
    };
    return wrappedTokens[chain as keyof typeof wrappedTokens] || '';
  }

  // Generate unique swap ID
  private generateSwapId(): string {
    return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format swap status for display
  formatSwapStatus(swap: SwapStatus): {
    status: string;
    statusColor: string;
    progress: number;
    message: string;
  } {
    const statusMap = {
      pending: { status: 'Pending', color: 'yellow', progress: 10, message: 'Waiting for confirmation' },
      escrowed: { status: 'Escrowed', color: 'blue', progress: 50, message: 'Funds locked, waiting for secret' },
      completed: { status: 'Completed', color: 'green', progress: 100, message: 'Swap completed successfully' },
      failed: { status: 'Failed', color: 'red', progress: 0, message: 'Swap failed' },
      refunded: { status: 'Refunded', color: 'gray', progress: 0, message: 'Swap refunded' },
    };

    return statusMap[swap.status] || statusMap.pending;
  }

  // Calculate time remaining for a swap
  calculateTimeRemaining(swap: SwapStatus): number | null {
    if (swap.status !== 'escrowed') return null;

    const timelock = swap.timelock * 1000; // Convert to milliseconds
    const createdAt = new Date(swap.createdAt).getTime();
    const expiresAt = createdAt + timelock;
    const now = Date.now();

    return Math.max(0, expiresAt - now);
  }

  // Check if swap is expired
  isSwapExpired(swap: SwapStatus): boolean {
    const timeRemaining = this.calculateTimeRemaining(swap);
    return timeRemaining !== null && timeRemaining <= 0;
  }
}

export const swapService = new SwapService();
export default swapService;
