export const PRICES: Record<string, number> = {
  MATIC: 0.65,
  WMATIC: 0.65,
  USDC: 1.0,
  DAI: 1.0,
  APT: 24.0,
  'USDC.ap': 1.0,
  tAPT: 24.0,
};

export const getPrice = (tokenSymbol: string): number => {
  return PRICES[tokenSymbol] || 0;
};

export const calculateReceiveAmount = (
  payAmount: number,
  payTokenSymbol: string,
  receiveTokenSymbol: string,
  slippageBps: number
): number => {
  const payPrice = getPrice(payTokenSymbol);
  const receivePrice = getPrice(receiveTokenSymbol);
  
  if (payPrice === 0 || receivePrice === 0) return 0;
  
  const baseAmount = (payAmount * payPrice) / receivePrice;
  const slippageMultiplier = 1 - slippageBps / 10000;
  
  return baseAmount * slippageMultiplier;
};

export const calculateUsdValue = (amount: number, tokenSymbol: string): number => {
  return amount * getPrice(tokenSymbol);
};