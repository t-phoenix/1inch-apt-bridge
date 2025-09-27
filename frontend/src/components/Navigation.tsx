import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePetraWallet } from "@/contexts/PetraWalletContext";
import { useWallet } from "@/contexts/WalletContext";
import { HelpCircle } from "lucide-react";

interface NavigationProps {
  onConnectWallet: () => void;
  onAccountClick: () => void;
}

const Navigation = ({ onConnectWallet, onAccountClick }: NavigationProps) => {
  // Get both wallet states
  const { 
    isConnected: isMetaMaskConnected, 
    account: metaMaskAccount, 
    balance: metaMaskBalance,
    chainId 
  } = useWallet();
  
  const { 
    isConnected: isPetraConnected, 
    account: petraAccount, 
    formattedBalance: petraBalance,
    network: petraNetwork 
  } = usePetraWallet();

  // Determine which wallet to show in primary position
  const hasAnyConnection = isMetaMaskConnected || isPetraConnected;
  
  // Priority: Show active wallet, or MetaMask if both connected
  const primaryWallet = isMetaMaskConnected ? 'metamask' : isPetraConnected ? 'petra' : null;

  const getNetworkIcon = () => {
    if (isMetaMaskConnected) {
      return chainId === 137 ? "🔷" : "🔶"; // Polygon or Ethereum
    }
    if (isPetraConnected) {
      return "🅰️"; // Aptos
    }
    return "🔗";
  };

  const getNetworkName = () => {
    if (isMetaMaskConnected) {
      return chainId === 137 ? "Polygon" : "Ethereum";
    }
    if (isPetraConnected) {
      return "Aptos";
    }
    return "";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-2 bg-card/50 backdrop-blur-sm border-b border-border">
      {/* Logo */}
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base">1</span>
          </div>
          <span className="text-foreground font-semibold text-lg">inch</span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        {hasAnyConnection ? (
          /* 🔥 DUAL WALLET DISPLAY */
          <div className="flex items-center gap-2">
            {/* Secondary Wallet Indicator */}
            {isMetaMaskConnected && isPetraConnected && (
              <Badge variant="outline" className="text-xs">
                {primaryWallet === 'metamask' ? '🅰️' : '🔷'} Connected
              </Badge>
            )}
            
            {/* Primary Wallet Display */}
            <Button
              variant="ghost"
              onClick={onAccountClick}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-3 py-2 h-auto"
            >
              <div className="text-lg">{getNetworkIcon()}</div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium text-sm">
                    {primaryWallet === 'metamask' ? metaMaskAccount : 
                     petraAccount ? `${petraAccount.slice(0, 6)}...${petraAccount.slice(-4)}` : 'Unknown'}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getNetworkName()}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {primaryWallet === 'metamask' ? `${metaMaskBalance} ETH` : `${petraBalance} APT`}
                </div>
              </div>
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onConnectWallet}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
          >
            🔗 Connect wallet
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;