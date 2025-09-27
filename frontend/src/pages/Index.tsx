import AccountModal from "@/components/AccountModal";
import Navigation from "@/components/Navigation";
import SettingsModal from "@/components/SettingsModal";
import SwapInterface from "@/components/SwapInterface";
import SwapSuccessModal from "@/components/SwapSuccessModal";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import WalletConnectionModal from "@/components/WalletConnectionModal";
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
  const { 
    isConnected, 
    account, 
    balance, 
    connectWallet, 
    error,
    isConnecting 
  } = useWallet();

  const handleConnectWallet = () => {
    setShowWalletConnection(true);
  };

  const handleWalletConnect = async (walletType: string) => {
    try {
      await connectWallet(walletType);
      setShowWalletConnection(false);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletType}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleAccountClick = () => {
    setShowAccount(true);
  };

  const handleSwapExecute = (fromToken: string, toToken: string, fromAmount: string, toAmount: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to perform swaps",
        variant: "destructive",
      });
      return;
    }

    setSwapDetails({ fromToken, toToken, fromAmount, toAmount });
    setShowSwapSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onConnectWallet={handleConnectWallet}
        onAccountClick={handleAccountClick}
        isConnected={isConnected}
        walletAddress={account}
        balance={balance ? `${balance} ETH` : undefined}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-start min-h-[80vh]">
          <SwapInterface 
            onOpenSettings={() => setShowSettings(true)}
            onConnectWallet={handleConnectWallet}
            onSwapExecute={handleSwapExecute}
            isConnected={isConnected}
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

      <WalletConnectionModal
        open={showWalletConnection}
        onOpenChange={setShowWalletConnection}
        onWalletConnect={handleWalletConnect}
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