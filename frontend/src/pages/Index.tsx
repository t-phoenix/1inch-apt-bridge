import { useState } from "react";
import Navigation from "@/components/Navigation";
import SwapInterface from "@/components/SwapInterface";
import SettingsModal from "@/components/SettingsModal";
import AccountModal from "@/components/AccountModal";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import WalletConnectionModal from "@/components/WalletConnectionModal";
import SwapSuccessModal from "@/components/SwapSuccessModal";

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [showSwapSuccess, setShowSwapSuccess] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [swapDetails, setSwapDetails] = useState({
    fromToken: "",
    toToken: "",
    fromAmount: "",
    toAmount: ""
  });

  const handleConnectWallet = () => {
    setShowWalletConnection(true);
  };

  const handleWalletConnect = (walletType: string) => {
    // Simulate wallet connection
    setIsConnected(true);
    setWalletAddress("0x4e39...Fc80");
    setShowWalletConnection(false);
  };

  const handleAccountClick = () => {
    setShowAccount(true);
  };

  const handleSwapExecute = (fromToken: string, toToken: string, fromAmount: string, toAmount: string) => {
    setSwapDetails({ fromToken, toToken, fromAmount, toAmount });
    setShowSwapSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onConnectWallet={handleConnectWallet}
        onAccountClick={handleAccountClick}
        isConnected={isConnected}
        walletAddress={walletAddress}
        balance="$1.39"
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