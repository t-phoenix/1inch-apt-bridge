// Custom hook for swap operations
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { toast } from 'react-hot-toast';

export interface SwapParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  slippage?: number;
  deadline?: number;
}

export interface SwapStatus {
  id: string;
  status: 'pending' | 'escrowed' | 'completed' | 'failed' | 'refunded';
  fromChain: string;
  toChain: string;
  amount: string;
  fromChainTxHash?: string;
  toChainTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export function useSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSwap, setCurrentSwap] = useState<SwapStatus | null>(null);
  const [swaps, setSwaps] = useState<SwapStatus[]>([]);

  const createSwap = useCallback(async (params: SwapParams): Promise<SwapStatus | null> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.createSwap({
        ...params,
        slippage: params.slippage || 0.5,
        deadline: params.deadline || 20,
      });

      const swap = response.data;
      setCurrentSwap(swap);
      
      toast.success('Swap created successfully');
      return swap;
    } catch (error: any) {
      console.error('Failed to create swap:', error);
      toast.error(error.response?.data?.message || 'Failed to create swap');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSwap = useCallback(async (swapId: string): Promise<SwapStatus | null> => {
    try {
      const response = await apiService.getSwap(swapId);
      const swap = response.data;
      setCurrentSwap(swap);
      return swap;
    } catch (error: any) {
      console.error('Failed to get swap:', error);
      toast.error('Failed to fetch swap details');
      return null;
    }
  }, []);

  const processSwap = useCallback(async (swapId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await apiService.processSwap(swapId);
      toast.success('Swap processing initiated');
      return true;
    } catch (error: any) {
      console.error('Failed to process swap:', error);
      toast.error(error.response?.data?.message || 'Failed to process swap');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSwap = useCallback(async (swapId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await apiService.cancelSwap(swapId);
      toast.success('Swap cancelled');
      return true;
    } catch (error: any) {
      console.error('Failed to cancel swap:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel swap');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSwap = useCallback(async (swapId: string) => {
    const swap = await getSwap(swapId);
    if (swap) {
      setCurrentSwap(swap);
    }
  }, [getSwap]);

  // Set up WebSocket listeners for real-time updates
  const setupWebSocketListeners = useCallback(() => {
    wsService.setEventHandlers({
      onSwapsUpdate: (swaps: SwapStatus[]) => {
        setSwaps(swaps);
        
        // Update current swap if it's in the list
        if (currentSwap) {
          const updatedSwap = swaps.find(s => s.id === currentSwap.id);
          if (updatedSwap) {
            setCurrentSwap(updatedSwap);
          }
        }
      },
    });

    // Subscribe to swap updates
    wsService.subscribe('swaps', () => {
      console.log('Subscribed to swap updates');
    });
  }, [currentSwap]);

  const clearCurrentSwap = useCallback(() => {
    setCurrentSwap(null);
  }, []);

  return {
    // State
    isLoading,
    currentSwap,
    swaps,
    
    // Actions
    createSwap,
    getSwap,
    processSwap,
    cancelSwap,
    refreshSwap,
    setupWebSocketListeners,
    clearCurrentSwap,
  };
}
