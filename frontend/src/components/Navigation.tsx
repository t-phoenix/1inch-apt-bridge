import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import TokenIcon from "./TokenIcon";

interface NavigationProps {
  onConnectWallet: () => void;
  onAccountClick: () => void;
  isConnected: boolean;
  walletAddress?: string;
  balance?: string;
}

const Navigation = ({ onConnectWallet, onAccountClick, isConnected, walletAddress, balance }: NavigationProps) => {
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
        
        {isConnected ? (
          /* Connected Account Display */
          <Button
            variant="ghost"
            onClick={onAccountClick}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-3 py-2 h-auto"
          >
            <TokenIcon symbol="POL" size="sm" />
            <div className="text-left">
              <div className="text-foreground font-medium text-sm">{walletAddress}</div>
              <div className="text-muted-foreground text-xs">{balance}</div>
            </div>
          </Button>
        ) : (
          <Button 
            onClick={onConnectWallet}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
          >
            Connect wallet
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;