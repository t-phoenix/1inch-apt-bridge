// Custom hook for API calls with React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Query keys
export const queryKeys = {
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  swaps: ['swaps'] as const,
  swap: (id: string) => ['swaps', id] as const,
  prices: ['prices'] as const,
  tokenPrice: (chain: string, token: string) => ['prices', chain, token] as const,
  tokens: (chain: string) => ['tokens', chain] as const,
  tokenInfo: (chain: string, token: string) => ['tokenInfo', chain, token] as const,
  quote: (chain: string, params: any) => ['quote', chain, params] as const,
  swapData: (chain: string, params: any) => ['swapData', chain, params] as const,
  gasPrice: (chain: string) => ['gasPrice', chain] as const,
  protocols: (chain: string) => ['protocols', chain] as const,
  health: ['health'] as const,
  status: ['status'] as const,
  relayerStatus: ['relayerStatus'] as const,
  wsStats: ['wsStats'] as const,
  wsInfo: ['wsInfo'] as const,
};

// Order hooks
export const useOrders = (params?: any) => {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => apiService.getOrders(params).then(res => res.data),
    staleTime: 30000, // 30 seconds
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => apiService.getOrder(orderId).then(res => res.data),
    enabled: !!orderId,
    refetchInterval: 10000, // 10 seconds
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: any) => apiService.createOrder(orderData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: any }) => 
      apiService.updateOrder(orderId, updates).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(variables.orderId) });
    },
  });
};

// Swap hooks
export const useSwap = (swapId: string) => {
  return useQuery({
    queryKey: queryKeys.swap(swapId),
    queryFn: () => apiService.getSwap(swapId).then(res => res.data),
    enabled: !!swapId,
    refetchInterval: 5000, // 5 seconds
  });
};

export const useCreateSwap = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (swapData: any) => apiService.createSwap(swapData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps });
    },
  });
};

export const useRedeemSwap = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ swapId, preimage }: { swapId: string; preimage: string }) => 
      apiService.redeemSwap(swapId, preimage).then(res => res.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap(variables.swapId) });
    },
  });
};

export const useRefundSwap = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (swapId: string) => apiService.refundSwap(swapId).then(res => res.data),
    onSuccess: (data, swapId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap(swapId) });
    },
  });
};

// Price hooks
export const useTokenPrice = (chain: string, tokenAddress: string, currency = 'usd') => {
  return useQuery({
    queryKey: queryKeys.tokenPrice(chain, tokenAddress),
    queryFn: () => apiService.getTokenPrice(chain, tokenAddress, currency).then(res => res.data),
    enabled: !!chain && !!tokenAddress,
    refetchInterval: 30000, // 30 seconds
  });
};

export const useMultipleTokenPrices = (requests: any[]) => {
  return useQuery({
    queryKey: ['prices', 'batch', requests],
    queryFn: () => apiService.getMultipleTokenPrices(requests).then(res => res.data),
    enabled: requests.length > 0,
    refetchInterval: 30000, // 30 seconds
  });
};

export const useTokenPriceHistory = (tokenId: string, days = 7, currency = 'usd') => {
  return useQuery({
    queryKey: ['priceHistory', tokenId, days, currency],
    queryFn: () => apiService.getTokenPriceHistory(tokenId, days, currency).then(res => res.data),
    enabled: !!tokenId,
  });
};

export const useTrendingTokens = () => {
  return useQuery({
    queryKey: ['trendingTokens'],
    queryFn: () => apiService.getTrendingTokens().then(res => res.data),
    refetchInterval: 300000, // 5 minutes
  });
};

export const useMarketData = (tokenId: string, currency = 'usd') => {
  return useQuery({
    queryKey: ['marketData', tokenId, currency],
    queryFn: () => apiService.getMarketData(tokenId, currency).then(res => res.data),
    enabled: !!tokenId,
    refetchInterval: 60000, // 1 minute
  });
};

// 1inch hooks
export const useTokens = (chain: string) => {
  return useQuery({
    queryKey: queryKeys.tokens(chain),
    queryFn: () => apiService.getTokens(chain).then(res => res.data),
    enabled: !!chain,
    staleTime: 300000, // 5 minutes
  });
};

export const useTokenInfo = (chain: string, tokenAddress: string) => {
  return useQuery({
    queryKey: queryKeys.tokenInfo(chain, tokenAddress),
    queryFn: () => apiService.getTokenInfo(chain, tokenAddress).then(res => res.data),
    enabled: !!chain && !!tokenAddress,
  });
};

export const useQuote = (chain: string, params: any) => {
  return useQuery({
    queryKey: queryKeys.quote(chain, params),
    queryFn: () => apiService.getQuote(chain, params).then(res => res.data),
    enabled: !!chain && !!params.fromToken && !!params.toToken && !!params.amount,
    refetchInterval: 10000, // 10 seconds
  });
};

export const useSwapData = (chain: string, params: any) => {
  return useQuery({
    queryKey: queryKeys.swapData(chain, params),
    queryFn: () => apiService.getSwapData(chain, params).then(res => res.data),
    enabled: !!chain && !!params.fromToken && !!params.toToken && !!params.amount && !!params.fromAddress,
  });
};

export const useGasPrice = (chain: string) => {
  return useQuery({
    queryKey: queryKeys.gasPrice(chain),
    queryFn: () => apiService.getGasPrice(chain).then(res => res.data),
    enabled: !!chain,
    refetchInterval: 30000, // 30 seconds
  });
};

export const useProtocols = (chain: string) => {
  return useQuery({
    queryKey: queryKeys.protocols(chain),
    queryFn: () => apiService.getProtocols(chain).then(res => res.data),
    enabled: !!chain,
    staleTime: 300000, // 5 minutes
  });
};

export const useValidateSwap = () => {
  return useMutation({
    mutationFn: ({ chain, fromToken, toToken, amount }: { 
      chain: string; 
      fromToken: string; 
      toToken: string; 
      amount: string; 
    }) => apiService.validateSwap(chain, fromToken, toToken, amount).then(res => res.data),
  });
};

export const useOptimalRoute = (chain: string, params: any) => {
  return useQuery({
    queryKey: ['optimalRoute', chain, params],
    queryFn: () => apiService.getOptimalRoute(chain, params).then(res => res.data),
    enabled: !!chain && !!params.fromToken && !!params.toToken && !!params.amount && !!params.fromAddress,
  });
};

// System hooks
export const useHealth = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiService.getHealth().then(res => res.data),
    refetchInterval: 30000, // 30 seconds
  });
};

export const useStatus = () => {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => apiService.getStatus().then(res => res.data),
    refetchInterval: 60000, // 1 minute
  });
};

export const useRelayerStatus = () => {
  return useQuery({
    queryKey: queryKeys.relayerStatus,
    queryFn: () => apiService.getRelayerStatus().then(res => res.data),
    refetchInterval: 30000, // 30 seconds
  });
};

export const useWebSocketStats = () => {
  return useQuery({
    queryKey: queryKeys.wsStats,
    queryFn: () => apiService.getWebSocketStats().then(res => res.data),
    refetchInterval: 60000, // 1 minute
  });
};

export const useWebSocketInfo = () => {
  return useQuery({
    queryKey: queryKeys.wsInfo,
    queryFn: () => apiService.getWebSocketInfo().then(res => res.data),
  });
};
