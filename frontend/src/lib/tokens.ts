export type ChainId = 'polygon' | 'aptos';

export type Token = {
  symbol: string;
  name: string;
  addressOrType: string;
  decimals: number;
  chainId: ChainId;
};

export const TOKENS: Record<ChainId, Token[]> = {
  polygon: [
    {
      symbol: 'MATIC',
      name: 'Polygon',
      addressOrType: '0x0000000000000000000000000000000000001010',
      decimals: 18,
      chainId: 'polygon',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      addressOrType: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      decimals: 6,
      chainId: 'polygon',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      addressOrType: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      decimals: 18,
      chainId: 'polygon',
    },
    {
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      addressOrType: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      decimals: 18,
      chainId: 'polygon',
    },
  ],
  aptos: [
    {
      symbol: 'APT',
      name: 'Aptos',
      addressOrType: '0x1::aptos_coin::AptosCoin',
      decimals: 8,
      chainId: 'aptos',
    },
    {
      symbol: 'USDC.ap',
      name: 'USD Coin (Aptos)',
      addressOrType: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
      decimals: 6,
      chainId: 'aptos',
    },
    {
      symbol: 'tAPT',
      name: 'Test Aptos',
      addressOrType: '0x1::test_coin::TestCoin',
      decimals: 8,
      chainId: 'aptos',
    },
  ],
};

export const getTokensByChain = (chainId: ChainId): Token[] => {
  return TOKENS[chainId] || [];
};