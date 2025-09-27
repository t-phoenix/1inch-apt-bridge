import AccountModal from "@/components/AccountModal";
import DualWalletModal from "@/components/DualWalletModal";
import Navigation from "@/components/Navigation";
import PriceTestPanel from "@/components/PriceTestPanel";
import SettingsModal from "@/components/SettingsModal";
import SwapInterface from "@/components/SwapInterface";
import SwapSuccessModal from "@/components/SwapSuccessModal";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePetraWallet } from "@/contexts/PetraWalletContext";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

/**
 * 🔧 ADMIN PAGE
 * Advanced page with swap interface + real-time price testing
 */
const AdminPage = () => {
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
        isAdminPage={true}
      />
      
      {/* Admin Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🔧 Admin Dashboard
                <Badge variant="secondary">Advanced</Badge>
              </h1>
              <p className="text-muted-foreground mt-1">
                Swap interface with real-time price monitoring and testing tools
              </p>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {isMetaMaskConnected ? '🦊 MetaMask' : '❌ No MetaMask'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {isPetraConnected ? '🅰️ Petra' : '❌ No Petra'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        {/* Admin Layout: Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Swap Interface */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💱 Swap Interface
                  <Badge variant="secondary">Live</Badge>
                </CardTitle>
                <CardDescription>
                  Production swap interface with dual-chain support
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SwapInterface 
                  onOpenSettings={() => setShowSettings(true)}
                  onConnectWallet={handleConnectWallet}
                  onSwapExecute={handleSwapExecute}
                  isConnected={isAnyWalletConnected}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right: Price Testing Panel */}
          <div className="space-y-4">
            <PriceTestPanel />
            
            {/* Additional Admin Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Backend</div>
                    <div className="font-mono">http://localhost:3001</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Frontend</div>
                    <div className="font-mono">http://localhost:8080</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">MetaMask Status</div>
                    <div className={`font-medium ${isMetaMaskConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isMetaMaskConnected ? '✅ Connected' : '❌ Disconnected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Petra Status</div>
                    <div className={`font-medium ${isPetraConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isPetraConnected ? '✅ Connected' : '❌ Disconnected'}
                    </div>
                  </div>
                </div>
                
                {/* Errors Display */}
                {(metaMaskError || petraError) && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="text-sm text-destructive">
                      {metaMaskError && <div>🦊 MetaMask: {metaMaskError}</div>}
                      {petraError && <div>🅰️ Petra: {petraError}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
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

export default AdminPage;