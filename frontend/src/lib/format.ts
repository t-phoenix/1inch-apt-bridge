import { getPrice } from './prices';

export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === 0) return '0';
  
  if (num < 0.01 && num > 0) {
    return num.toFixed(6);
  }
  
  if (num >= 1000) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  
  return num.toFixed(decimals);
};

export const formatCurrency = (num: number): string => {
  return `$${formatNumber(num, 2)}`;
};

export const formatTokenAmount = (num: number, decimals: number = 6): string => {
  if (num === 0) return '0';
  
  // For very small numbers, show more decimal places
  if (num < 0.000001 && num > 0) {
    return num.toExponential(2);
  }
  
  // For small numbers, show up to 6 decimal places
  if (num < 1) {
    return num.toFixed(Math.min(6, decimals));
  }
  
  // For larger numbers, show fewer decimal places
  if (num >= 1000) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  
  return num.toFixed(Math.min(4, decimals));
};

export const calculateUsdValue = (amount: number, tokenSymbol: string): number => {
  return amount * getPrice(tokenSymbol);
};