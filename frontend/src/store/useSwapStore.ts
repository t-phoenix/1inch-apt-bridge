import { create } from 'zustand';
import { ChainId, Token, getTokensByChain } from '@/lib/tokens';

interface SwapState {
  chain: ChainId;
  payToken: Token;
  receiveToken: Token;
  payAmount: string;
  slippageBps: number;
  isConnected: boolean;
  isRefreshing: boolean;
  
  setChain: (c: ChainId) => void;
  setPayToken: (t: Token) => void;
  setReceiveToken: (t: Token) => void;
  setPayAmount: (v: string) => void;
  flip: () => void;
  setSlippageBps: (bps: number) => void;
  setIsConnected: (connected: boolean) => void;
  setIsRefreshing: (refreshing: boolean) => void;
}

const getDefaultTokens = (chainId: ChainId) => {
  const tokens = getTokensByChain(chainId);
  return {
    payToken: tokens[0] || tokens[0],
    receiveToken: tokens[1] || tokens[0],
  };
};

export const useSwapStore = create<SwapState>((set, get) => {
  const initialChain: ChainId = 'polygon';
  const { payToken, receiveToken } = getDefaultTokens(initialChain);
  
  return {
    chain: initialChain,
    payToken,
    receiveToken,
    payAmount: '',
    slippageBps: 50, // 0.5%
    isConnected: false,
    isRefreshing: false,
    
    setChain: (c: ChainId) => {
      const { payToken, receiveToken } = getDefaultTokens(c);
      set({ chain: c, payToken, receiveToken, payAmount: '' });
    },
    
    setPayToken: (t: Token) => {
      const { receiveToken } = get();
      // If pay token is same as receive token, swap them
      if (t.symbol === receiveToken.symbol) {
        const tokens = getTokensByChain(t.chainId);
        const newReceiveToken = tokens.find(token => token.symbol !== t.symbol) || tokens[0];
        set({ payToken: t, receiveToken: newReceiveToken });
      } else {
        set({ payToken: t });
      }
    },
    
    setReceiveToken: (t: Token) => {
      const { payToken } = get();
      // If receive token is same as pay token, swap them
      if (t.symbol === payToken.symbol) {
        const tokens = getTokensByChain(t.chainId);
        const newPayToken = tokens.find(token => token.symbol !== t.symbol) || tokens[0];
        set({ receiveToken: t, payToken: newPayToken });
      } else {
        set({ receiveToken: t });
      }
    },
    
    setPayAmount: (v: string) => set({ payAmount: v }),
    
    flip: () => {
      const { payToken, receiveToken } = get();
      set({ payToken: receiveToken, receiveToken: payToken, payAmount: '' });
    },
    
    setSlippageBps: (bps: number) => set({ slippageBps: bps }),
    setIsConnected: (connected: boolean) => set({ isConnected: connected }),
    setIsRefreshing: (refreshing: boolean) => set({ isRefreshing: refreshing }),
  };
});