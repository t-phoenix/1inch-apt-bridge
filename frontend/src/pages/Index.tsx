import AccountModal from "@/components/AccountModal";
import DualWalletModal from "@/components/DualWalletModal";
import Navigation from "@/components/Navigation";
import SettingsModal from "@/components/SettingsModal";
import SwapInterface from "@/components/SwapInterface";
import SwapSuccessModal from "@/components/SwapSuccessModal";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import { usePetraWallet } from "@/contexts/PetraWalletContext";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [showSwapSuccess, setShowSwapSuccess] = useState(false);
  const [swapDetails, setSwapDetails] = useState({
    fromToken: "",
    toToken: "",
    fromAmount: "",
    toAmount: ""
  });

  const { toast } = useToast();
  
  // Get both wallet states
  const { 
    isConnected: isMetaMaskConnected, 
    account: metaMaskAccount, 
    balance: metaMaskBalance,
    error: metaMaskError 
  } = useWallet();
  
  const { 
    isConnected: isPetraConnected, 
    account: petraAccount, 
    formattedBalance: petraBalance,
    error: petraError 
  } = usePetraWallet();

  // Check if any wallet is connected
  const isAnyWalletConnected = isMetaMaskConnected || isPetraConnected;

  const handleConnectWallet = () => {
    setShowWalletConnection(true);
  };

  const handleAccountClick = () => {
    setShowAccount(true);
  };

  const handleSwapExecute = (fromToken: string, toToken: string, fromAmount: string, toAmount: string) => {
    if (!isAnyWalletConnected) {
      toast({
        title: "🔗 Wallet Required",
        description: "Please connect your wallet to perform swaps",
        variant: "destructive",
      });
      return;
    }

    // Determine which wallet should handle the swap based on tokens
    const isAptosSwap = fromToken === 'APT' || toToken === 'APT';
    
    if (isAptosSwap && !isPetraConnected) {
      toast({
        title: "🅰️ Petra Wallet Required",
        description: "Please connect Petra wallet for Aptos swaps",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAptosSwap && !isMetaMaskConnected) {
      toast({
        title: "🦊 MetaMask Required", 
        description: "Please connect MetaMask for Ethereum/Polygon swaps",
        variant: "destructive",
      });
      return;
    }

    setSwapDetails({ fromToken, toToken, fromAmount, toAmount });
    setShowSwapSuccess(true);
    
    toast({
      title: "🚀 Swap Executed!",
      description: `Swapped ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onConnectWallet={handleConnectWallet}
        onAccountClick={handleAccountClick}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-start min-h-[80vh]">
          <SwapInterface 
            onOpenSettings={() => setShowSettings(true)}
            onConnectWallet={handleConnectWallet}
            onSwapExecute={handleSwapExecute}
            isConnected={isAnyWalletConnected}
          />
        </div>
      </main>

      <SettingsModal 
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      <AccountModal
        open={showAccount}
        onOpenChange={setShowAccount}
      />

      <TransactionDetailModal
        open={showTransactionDetail}
        onOpenChange={setShowTransactionDetail}
      />

      {/* 🔥 NEW DUAL WALLET MODAL */}
      <DualWalletModal
        isOpen={showWalletConnection}
        onClose={() => setShowWalletConnection(false)}
      />

      <SwapSuccessModal
        open={showSwapSuccess}
        onOpenChange={setShowSwapSuccess}
        fromToken={swapDetails.fromToken}
        toToken={swapDetails.toToken}
        fromAmount={swapDetails.fromAmount}
        toAmount={swapDetails.toAmount}
      />
    </div>
  );
};

export default Index;