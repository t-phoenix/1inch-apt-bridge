// Token configuration for supported chains
import { CHAIN_CONFIG, type ChainId } from './chains';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
  isNative?: boolean;
  isWrapped?: boolean;
}

export const SUPPORTED_TOKENS: Record<ChainId, Token[]> = {
  ethereum: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: 1,
      isNative: true,
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      chainId: 1,
      isWrapped: true,
    },
    {
      address: '0xA0b86a33E6441b8C4C8C0E4A8c8a0b86a33E6441b',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1,
    },
  ],
  polygon: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      chainId: 137,
      isNative: true,
    },
    {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'WMATIC',
      name: 'Wrapped MATIC',
      decimals: 18,
      chainId: 137,
      isWrapped: true,
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 137,
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 137,
    },
  ],
  aptos: [
    {
      address: '0x1::aptos_coin::AptosCoin',
      symbol: 'APT',
      name: 'Aptos',
      decimals: 8,
      chainId: 1,
      isNative: true,
    },
    {
      address: '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    },
    {
      address: '0x6f986d6efc0430be35706c417af9d16a5da3bce0e1ab15fe203b8708fd6e16e1::coin::T',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1,
    },
  ],
};

export const getTokensByChain = (chainId: ChainId): Token[] => {
  return SUPPORTED_TOKENS[chainId] || [];
};

export const getTokenByAddress = (chainId: ChainId, address: string): Token | undefined => {
  return getTokensByChain(chainId).find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  );
};

export const getNativeToken = (chainId: ChainId): Token | undefined => {
  return getTokensByChain(chainId).find(token => token.isNative);
};

export const getWrappedToken = (chainId: ChainId): Token | undefined => {
  return getTokensByChain(chainId).find(token => token.isWrapped);
};

export const isNativeToken = (chainId: ChainId, address: string): boolean => {
  const token = getTokenByAddress(chainId, address);
  return token?.isNative || false;
};

export const isWrappedToken = (chainId: ChainId, address: string): boolean => {
  const token = getTokenByAddress(chainId, address);
  return token?.isWrapped || false;
};
