import { fetchPOLandAPTPrices } from '@/utils/priceService';
import { useEffect, useState } from 'react';

interface PriceData {
  polPrice: number;
  aptPrice: number;
  exchangeRate: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

export const usePrices = (refreshInterval: number = 30000) => {
  const [priceData, setPriceData] = useState<PriceData>({
    polPrice: 0,
    aptPrice: 0,
    exchangeRate: '',
    isLoading: true,
    error: null,
    lastUpdated: 0,
  });

  const fetchPrices = async () => {
    try {
      setPriceData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { polPrice, aptPrice, exchangeRate } = await fetchPOLandAPTPrices();
      
      setPriceData({
        polPrice,
        aptPrice,
        exchangeRate,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      setPriceData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prices',
      }));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, []);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
    ...priceData,
    refetch: fetchPrices,
  };
};