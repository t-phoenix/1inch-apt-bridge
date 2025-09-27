import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowDown, Settings, RotateCcw, TrendingUp } from "lucide-react";
import TokenIcon from "./TokenIcon";

interface Token {
  symbol: string;
  name: string;
  balance?: number;
  price?: number;
}

interface SwapInterfaceProps {
  onOpenSettings: () => void;
  onConnectWallet: () => void;
  onSwapExecute: (fromToken: string, toToken: string, fromAmount: string, toAmount: string) => void;
  isConnected: boolean;
}

const SwapInterface = ({ onOpenSettings, onConnectWallet, onSwapExecute, isConnected }: SwapInterfaceProps) => {
  const [fromToken, setFromToken] = useState<Token>({ symbol: "POL", name: "Polygon" });
  const [toToken, setToToken] = useState<Token>({ symbol: "APT", name: "Aptos" });
  const [fromAmount, setFromAmount] = useState("0.9898");
  const [toAmount, setToAmount] = useState("3983.526131");
  
  const exchangeRate = "1 POL = 4024.57 APT ~$4022.3";
  const slippage = "Auto 0.5%";
  const minReceive = "3963.6037 APT";
  const networkFee = "Free $0.99";

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwapExecute = () => {
    onSwapExecute(fromToken.symbol, toToken.symbol, fromAmount, toAmount);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Swap/Limit Tabs */}
      <div className="flex mb-6">
        <Button variant="ghost" className="text-foreground border-b-2 border-primary rounded-none">
          Swap
        </Button>
        <Button variant="ghost" className="text-muted-foreground rounded-none ml-6">
          Limit
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Swap Card */}
      <Card className="p-4 bg-card border border-border shadow-card">
        {/* You pay */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm">You pay</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 min-w-0 flex-1">
              <TokenIcon symbol={fromToken.symbol} />
              <div className="min-w-0">
                <div className="font-medium">{fromToken.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">on Polygon</div>
              </div>
            </div>
            <div className="text-right">
              <Input
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="text-right text-xl font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
              />
              <div className="text-xs text-muted-foreground">~$3991.29</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Polygon</div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapTokens}
            className="bg-secondary border border-border rounded-full hover:bg-secondary/80"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* You receive */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 min-w-0 flex-1">
              <TokenIcon symbol={toToken.symbol} />
              <div className="min-w-0">
                <div className="font-medium">{toToken.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">on Aptos</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-medium">{toAmount}</div>
              <div className="text-xs text-muted-foreground">~$3981.3 (-0.25%)</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Aptos</div>
        </div>

        {/* Exchange Rate & Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{exchangeRate}</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Slippage tolerance</span>
            <span className="text-foreground">{slippage}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Minimum receive</span>
            <span className="text-foreground">~$3961.38 {minReceive}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="text-success">{networkFee}</span>
          </div>
        </div>

        {/* Action Button */}
        {isConnected ? (
          <Button 
            onClick={handleSwapExecute}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
          >
            Swap
          </Button>
        ) : (
          <Button 
            onClick={onConnectWallet}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
          >
            Connect wallet
          </Button>
        )}
      </Card>
    </div>
  );
};

export default SwapInterface;