// Chain configuration for the bridge
export const CHAIN_CONFIG = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      htlcEscrow: import.meta.env.VITE_ETHEREUM_HTLC_CONTRACT || '',
      tokenSwap: import.meta.env.VITE_ETHEREUM_TOKEN_SWAP_CONTRACT || '',
    },
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    contracts: {
      htlcEscrow: import.meta.env.VITE_POLYGON_HTLC_CONTRACT || '',
      tokenSwap: import.meta.env.VITE_POLYGON_TOKEN_SWAP_CONTRACT || '',
    },
  },
  aptos: {
    id: 1,
    name: 'Aptos',
    rpcUrl: import.meta.env.VITE_APTOS_RPC_URL || 'https://fullnode.mainnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
    nativeCurrency: {
      name: 'Aptos',
      symbol: 'APT',
      decimals: 8,
    },
    contracts: {
      htlcModule: import.meta.env.VITE_APTOS_HTLC_MODULE || '',
      tokenSwapModule: import.meta.env.VITE_APTOS_TOKEN_SWAP_MODULE || '',
    },
  },
} as const;

export type ChainId = keyof typeof CHAIN_CONFIG;
export type Chain = typeof CHAIN_CONFIG[ChainId];

export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIG) as ChainId[];

export const getChainById = (id: number): Chain | undefined => {
  return Object.values(CHAIN_CONFIG).find(chain => chain.id === id);
};

export const getChainByName = (name: string): Chain | undefined => {
  return Object.values(CHAIN_CONFIG).find(chain => 
    chain.name.toLowerCase() === name.toLowerCase()
  );
};
