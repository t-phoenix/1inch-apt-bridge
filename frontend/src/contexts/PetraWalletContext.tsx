import { PetraWallet } from 'petra-plugin-wallet-adapter';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

// 🔥 PETRA WALLET TYPES
interface PetraWalletState {
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  publicKey: string | null;
  network: string | null;
  
  // Balance & Tokens
  balance: string;
  formattedBalance: string;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (network: string) => Promise<void>;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
  
  // Utilities
  getAccountResources: () => Promise<any[]>;
  error: string | null;
}

const PetraWalletContext = createContext<PetraWalletState | null>(null);

/**
 * 🚀 PETRA WALLET PROVIDER
 * Complete Aptos wallet integration with Petra
 */
export const PetraWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>('mainnet');
  const [balance, setBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);
  
  // Petra wallet instance
  const [petraWallet, setPetraWallet] = useState<PetraWallet | null>(null);

  /**
   * Initialize Petra wallet
   */
  useEffect(() => {
    const initializePetra = async () => {
      try {
        console.log('🔍 Checking for Petra wallet...');
        
        // Check if Petra is installed
        if (typeof window !== 'undefined' && 'aptos' in window) {
          console.log('✅ Petra wallet detected!');
          
          const wallet = new PetraWallet();
          setPetraWallet(wallet);
          
          // Check if already connected
          const isAlreadyConnected = await wallet.isConnected();
          if (isAlreadyConnected) {
            console.log('🔄 Auto-reconnecting to Petra...');
            await handleAutoReconnect(wallet);
          }
        } else {
          console.log('❌ Petra wallet not found');
          setError('Petra wallet not installed. Please install Petra extension.');
        }
      } catch (error) {
        console.error('❌ Petra initialization failed:', error);
        setError('Failed to initialize Petra wallet');
      }
    };
    
    initializePetra();
  }, []);

  /**
   * Auto-reconnect to Petra on page load
   */
  const handleAutoReconnect = async (wallet: PetraWallet) => {
    try {
      // Check if user manually disconnected (respect user intent)
      const wasManuallyDisconnected = localStorage.getItem('petra-wallet-disconnected');
      if (wasManuallyDisconnected === 'true') {
        console.log('🚫 Skipping auto-reconnect - user manually disconnected');
        return;
      }
      
      const accountInfo = await wallet.account();
      const networkInfo = await wallet.network();
      
      setAccount(accountInfo.address);
      setPublicKey(Array.isArray(accountInfo.publicKey) ? accountInfo.publicKey[0] : accountInfo.publicKey);
      setNetwork(networkInfo.name);
      setIsConnected(true);
      
      // Fetch balance
      await fetchAptosBalance(accountInfo.address);
      
      // Mark as connected in localStorage
      localStorage.setItem('petra-wallet-connected', 'true');
      localStorage.removeItem('petra-wallet-disconnected');
      
      console.log('✅ Auto-reconnected to Petra:', accountInfo.address.slice(0, 10) + '...');
      
    } catch (error) {
      console.warn('⚠️ Auto-reconnect failed:', error);
      // Don't show error toast for auto-reconnect failures
    }
  };

  /**
   * 🔗 CONNECT TO PETRA WALLET
   */
  const connectWallet = useCallback(async () => {
    if (!petraWallet) {
      toast.error('Petra wallet not available. Please install the Petra extension.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔄 Connecting to Petra wallet...');
      
      // Connect to Petra
      const response = await petraWallet.connect();
      console.log('📡 Petra connection response:', response);

      // Get account info
      const accountInfo = await petraWallet.account();
      const networkInfo = await petraWallet.network();

      setAccount(accountInfo.address);
      setPublicKey(Array.isArray(accountInfo.publicKey) ? accountInfo.publicKey[0] : accountInfo.publicKey);
      setNetwork(networkInfo.name);
      setIsConnected(true);

      // Fetch balance
      await fetchAptosBalance(accountInfo.address);

      // Mark as connected and clear any disconnect flag
      localStorage.setItem('petra-wallet-connected', 'true');
      localStorage.removeItem('petra-wallet-disconnected');

      console.log('✅ Petra connected successfully!');
      console.log('📍 Account:', accountInfo.address);
      console.log('🌐 Network:', networkInfo.name);

      toast.success(`Connected to Petra wallet!`, {
        description: `Account: ${accountInfo.address.slice(0, 10)}...`
      });

    } catch (error: any) {
      console.error('❌ Petra connection failed:', error);
      setError(error.message || 'Failed to connect to Petra wallet');
      
      toast.error('Failed to connect to Petra wallet', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsConnecting(false);
    }
  }, [petraWallet]);

  /**
   * 🔌 DISCONNECT FROM PETRA WALLET
   */
  const disconnectWallet = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting from Petra wallet...');
      
      // 1. Disconnect from Petra wallet extension
      if (petraWallet) {
        try {
          await petraWallet.disconnect();
          console.log('✅ Petra wallet extension disconnected');
        } catch (petraError) {
          console.warn('⚠️ Petra extension disconnect failed:', petraError);
          // Continue with state reset even if extension disconnect fails
        }
      }

      // 2. Clear localStorage to prevent auto-reconnection
      try {
        localStorage.removeItem('petra-wallet-connected');
        localStorage.setItem('petra-wallet-disconnected', 'true');
        localStorage.removeItem('aptos-wallet-connected');
        console.log('🧹 Set Petra disconnect flag in localStorage');
      } catch (storageError) {
        console.warn('⚠️ localStorage operations failed:', storageError);
      }

      // 3. Force reset all state immediately
      setIsConnected(false);
      setAccount(null);
      setPublicKey(null);
      setNetwork(null);
      setBalance('0');
      setError(null);

      console.log('✅ Petra wallet state reset complete');
      
      toast.success('Disconnected from Petra wallet', {
        description: 'Wallet has been disconnected successfully'
      });

    } catch (error: any) {
      console.error('❌ Disconnect error:', error);
      
      // Force state reset even if disconnect fails
      setIsConnected(false);
      setAccount(null);
      setPublicKey(null);
      setNetwork(null);
      setBalance('0');
      setError(null);
      
      toast.error('Error disconnecting wallet', {
        description: 'State has been reset, but extension may still show as connected'
      });
    }
  }, [petraWallet]);

  /**
   * 💰 FETCH APTOS BALANCE
   */
  const fetchAptosBalance = async (address: string) => {
    try {
      console.log('💰 Fetching APT balance for:', address.slice(0, 10) + '...');
      
      // Use Aptos REST API to get account resources
      const response = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${address}/resources`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch account resources');
      }
      
      const resources = await response.json();
      
      // Find APT coin resource
      const coinResource = resources.find((r: any) => 
        r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );
      
      if (coinResource) {
        const balanceValue = coinResource.data.coin.value;
        const aptBalance = (parseInt(balanceValue) / 100000000).toFixed(4); // APT has 8 decimals
        
        setBalance(aptBalance);
        console.log('✅ APT balance:', aptBalance);
      } else {
        setBalance('0');
        console.log('⚠️ No APT balance found');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch APT balance:', error);
      setBalance('0');
    }
  };

  /**
   * 🔄 SWITCH NETWORK
   */
  const switchNetwork = useCallback(async (targetNetwork: string) => {
    if (!petraWallet) {
      toast.error('Petra wallet not connected');
      return;
    }

    try {
      console.log(`🔄 Switching to ${targetNetwork} network...`);
      
      // Petra handles network switching through the extension UI
      toast.info(`Please switch to ${targetNetwork} network in Petra extension`);
      
      // Refresh connection after network switch
      setTimeout(async () => {
        try {
          const networkInfo = await petraWallet.network();
          setNetwork(networkInfo.name);
          
          if (account) {
            await fetchAptosBalance(account);
          }
        } catch (error) {
          console.error('Error after network switch:', error);
        }
      }, 2000);

    } catch (error: any) {
      console.error('❌ Network switch failed:', error);
      toast.error('Failed to switch network');
    }
  }, [petraWallet, account]);

  /**
   * ✍️ SIGN AND SUBMIT TRANSACTION
   */
  const signAndSubmitTransaction = useCallback(async (transaction: any) => {
    if (!petraWallet || !account) {
      throw new Error('Petra wallet not connected');
    }

    try {
      console.log('✍️ Signing transaction with Petra...');
      
      const response = await petraWallet.signAndSubmitTransaction(transaction);
      console.log('✅ Transaction submitted:', response.hash);
      
      return response;
      
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }, [petraWallet, account]);

  /**
   * 📋 GET ACCOUNT RESOURCES
   */
  const getAccountResources = useCallback(async () => {
    if (!account) {
      throw new Error('No account connected');
    }

    try {
      const response = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${account}/resources`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch account resources');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Failed to fetch account resources:', error);
      throw error;
    }
  }, [account]);

  // Formatted balance for display
  const formattedBalance = balance === '0' ? '0.00' : parseFloat(balance).toFixed(4);

  /**
   * 🎯 CONTEXT VALUE
   */
  const value: PetraWalletState = {
    // Connection State
    isConnected,
    isConnecting,
    account,
    publicKey,
    network,
    
    // Balance & Tokens
    balance,
    formattedBalance,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signAndSubmitTransaction,
    
    // Utilities
    getAccountResources,
    error
  };

  return (
    <PetraWalletContext.Provider value={value}>
      {children}
    </PetraWalletContext.Provider>
  );
};

/**
 * 🪝 USE PETRA WALLET HOOK
 */
export const usePetraWallet = () => {
  const context = useContext(PetraWalletContext);
  
  if (!context) {
    throw new Error('usePetraWallet must be used within PetraWalletProvider');
  }
  
  return context;
};

export default PetraWalletContext;