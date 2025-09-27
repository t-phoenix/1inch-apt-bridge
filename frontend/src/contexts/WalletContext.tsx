import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string | null;
  
  // Wallet info
  walletType: string | null;
  provider: ethers.BrowserProvider | null;
  
  // Methods
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => Promise<void>;
  
  // Errors
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// Supported networks
export const SUPPORTED_NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorerUrl: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com'
  }
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num < 0.001) return '< 0.001';
    return num.toFixed(3);
  };

  // Get balance for connected account
  const updateBalance = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const balance = await provider.getBalance(address);
      const formattedBalance = formatBalance(ethers.formatEther(balance));
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.000');
    }
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    const ethereum = await detectEthereumProvider();
    
    if (!ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask extension.');
    }

    if (ethereum !== window.ethereum) {
      throw new Error('Multiple wallets detected. Please use MetaMask.');
    }

    // Request account access
    const accounts = await (ethereum as any).request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    // Get chain ID
    const chainId = await (ethereum as any).request({ method: 'eth_chainId' });
    
    // Create provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    return {
      account: accounts[0],
      chainId: parseInt(chainId, 16),
      provider
    };
  };

  // Connect wallet based on type
  const connectWallet = async (type: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      let connectionResult;

      switch (type.toLowerCase()) {
        case 'metamask':
          connectionResult = await connectMetaMask();
          break;
        case 'walletconnect':
          throw new Error('WalletConnect integration coming soon');
        case 'coinbase wallet':
          throw new Error('Coinbase Wallet integration coming soon');
        case 'trust wallet':
          throw new Error('Trust Wallet integration coming soon');
        default:
          throw new Error(`Unsupported wallet type: ${type}`);
      }

      const { account, chainId, provider } = connectionResult;

      // Update state
      setAccount(account);
      setChainId(chainId);
      setProvider(provider);
      setWalletType(type);
      setIsConnected(true);

      // Get balance
      await updateBalance(provider, account);

      // Store connection in localStorage
      localStorage.setItem('walletConnected', JSON.stringify({
        type,
        account,
        chainId
      }));

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
      
      // Reset state on error
      setAccount(null);
      setChainId(null);
      setProvider(null);
      setWalletType(null);
      setIsConnected(false);
      setBalance(null);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setWalletType(null);
    setIsConnected(false);
    setBalance(null);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('walletConnected');
  };

  // Switch chain/network
  const switchChain = async (targetChainId: number) => {
    if (!window.ethereum || !provider) {
      throw new Error('No wallet connected');
    }

    try {
      await (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        const network = SUPPORTED_NETWORKS[targetChainId as keyof typeof SUPPORTED_NETWORKS];
        if (network) {
          await (window.ethereum as any).request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorerUrl],
              },
            ],
          });
        }
      } else {
        throw switchError;
      }
    }
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          if (provider) {
            updateBalance(provider, accounts[0]);
          }
        }
      };

      // Handle chain changes
      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
        
        // Update balance when chain changes
        if (provider && account) {
          updateBalance(provider, account);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, provider]);

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const tryAutoConnect = async () => {
      const stored = localStorage.getItem('walletConnected');
      if (stored) {
        try {
          const { type } = JSON.parse(stored);
          if (type === 'metamask') {
            const ethereum = await detectEthereumProvider();
            if (ethereum) {
              const accounts = await (ethereum as any).request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                await connectWallet(type);
              } else {
                localStorage.removeItem('walletConnected');
              }
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          localStorage.removeItem('walletConnected');
        }
      }
    };

    tryAutoConnect();
  }, []);

  const value: WalletContextType = {
    isConnected,
    isConnecting,
    account: account ? formatAddress(account) : null,
    chainId,
    balance,
    walletType,
    provider,
    connectWallet,
    disconnectWallet,
    switchChain,
    error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}