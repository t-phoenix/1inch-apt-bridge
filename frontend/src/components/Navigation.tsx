import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePetraWallet } from "@/contexts/PetraWalletContext";
import { useWallet } from "@/contexts/WalletContext";
import { HelpCircle, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavigationProps {
  onConnectWallet: () => void;
  onAccountClick: () => void;
  isAdminPage?: boolean;
}

const Navigation = ({ onConnectWallet, onAccountClick, isAdminPage = false }: NavigationProps) => {
  const location = useLocation();
  
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
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/logo.svg" 
            alt="1inch APT Bridge" 
            className="h-8 w-auto object-contain"
          />
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-4">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-sm"
            >
              👤 User
            </Button>
          </Link>
          
          <Link to="/admin">
            <Button 
              variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-sm flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </nav>
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