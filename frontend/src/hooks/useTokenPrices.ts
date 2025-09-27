import { useCallback, useEffect, useRef, useState } from 'react';

interface TokenPrice {
  symbol: string;
  address: string;
  price: number;
  timestamp: number;
}

interface UsePricesResult {
  prices: { [key: string]: TokenPrice };
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useTokenPrices(chainId: number, tokenSymbols: string[]): UsePricesResult {
  const [prices, setPrices] = useState<{ [key: string]: TokenPrice }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<{ key: string; timestamp: number }>({ key: '', timestamp: 0 });

  const fetchPrices = useCallback(async () => {
    if (!tokenSymbols.length) return;

    // Create a stable key for caching
    const cacheKey = `${chainId}-${tokenSymbols.sort().join(',')}`;
    
    // Don't fetch if we just fetched the same data within 1 second
    const now = Date.now();
    if (lastFetchRef.current.key === cacheKey && now - lastFetchRef.current.timestamp < 1000) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokensParam = tokenSymbols.join(',');
      const url = `${BACKEND_URL}/api/prices?chainId=${chainId}&tokens=${tokensParam}`;

      console.log('Fetching prices from:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Price API response:', result);

      if (result.success && result.data) {
        const priceMap: { [key: string]: TokenPrice } = {};
        result.data.forEach((tokenPrice: TokenPrice) => {
          priceMap[tokenPrice.symbol] = tokenPrice;
        });
        setPrices(priceMap);
        lastFetchRef.current = { key: cacheKey, timestamp: Date.now() };
      } else {
        throw new Error(result.error || 'Failed to fetch prices');
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Set mock prices as fallback
      const mockPrices: { [key: string]: TokenPrice } = {};
      tokenSymbols.forEach(symbol => {
        mockPrices[symbol] = {
          symbol,
          address: 'mock',
          price: symbol === 'USDC' || symbol === 'USDT' ? 1.0 : 
                symbol === 'WMATIC' || symbol === 'POL' ? 0.4 : // POL same as MATIC
                symbol === 'WETH' || symbol === 'ETH' ? 2500 : 
                symbol === 'APT' ? 8.5 : 1.0, // APT price
          timestamp: Date.now()
        };
      });
      setPrices(mockPrices);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, tokenSymbols.join(',')]); // Stable dependency

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      fetchPrices();
    }, 10000); // 10 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    refetch: fetchPrices
  };
}