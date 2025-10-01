import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ArrowDown, ChevronDown, ChevronUp, RotateCcw, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import TokenSelector from "./TokenSelector";

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
  // Chain and token selection state
  const [fromChain, setFromChain] = useState(137); // Polygon
  const [toChain, setToChain] = useState(137); // Polygon
  const [fromTokenSymbol, setFromTokenSymbol] = useState("WMATIC");
  const [toTokenSymbol, setToTokenSymbol] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [lastEditedField, setLastEditedField] = useState<'from' | 'to'>('from');
  const [showDetails, setShowDetails] = useState(false);
  
  // Memoize token arrays to prevent unnecessary re-renders
  const fromTokens = useMemo(() => [fromTokenSymbol], [fromTokenSymbol]);
  const toTokens = useMemo(() => [toTokenSymbol], [toTokenSymbol]);
  
  // Fetch prices for selected tokens
  const { prices: fromPrices, isLoading: fromLoading, refetch: refetchFromPrices } = useTokenPrices(fromChain, fromTokens);
  const { prices: toPrices, isLoading: toLoading, refetch: refetchToPrices } = useTokenPrices(toChain, toTokens);
  
  const fromTokenPrice = fromPrices[fromTokenSymbol]?.price || 0;
  const toTokenPrice = toPrices[toTokenSymbol]?.price || 0;
  
  // Calculate exchange rates
  const fromToRate = fromTokenPrice && toTokenPrice ? (fromTokenPrice / toTokenPrice) : 0;
  const toFromRate = fromTokenPrice && toTokenPrice ? (toTokenPrice / fromTokenPrice) : 0;
  
  // Handle refresh - manually refetch prices
  const handleRefresh = useCallback(() => {
    refetchFromPrices();
    refetchToPrices();
  }, [refetchFromPrices, refetchToPrices]);
  
  // Debounced calculation function with limited decimal places
  const calculateAmount = useCallback((value: string, rate: number, isFromField: boolean) => {
    if (!value || !rate) return '';
    const result = parseFloat(value || '0') * rate;
    // Limit to 6 decimal places to prevent excessive precision
    return result.toFixed(6).replace(/\.?0+$/, '');
  }, []);
  
  // Calculate amounts when prices change, but not on every keystroke
  useEffect(() => {
    if (!fromToRate || !toFromRate) return;
    
    if (lastEditedField === 'from' && fromAmount) {
      const calculated = calculateAmount(fromAmount, fromToRate, true);
      setToAmount(calculated);
    } else if (lastEditedField === 'to' && toAmount) {
      const calculated = calculateAmount(toAmount, toFromRate, false);
      setFromAmount(calculated);
    }
  }, [fromToRate, toFromRate, calculateAmount]); // Removed fromAmount and toAmount to prevent loops
  
  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value);
    setLastEditedField('from');
    
    if (value && fromToRate) {
      const calculated = calculateAmount(value, fromToRate, true);
      setToAmount(calculated);
    } else {
      setToAmount('');
    }
  }, [fromToRate, calculateAmount]);
  
  const handleToAmountChange = useCallback((value: string) => {
    setToAmount(value);
    setLastEditedField('to');
    
    if (value && toFromRate) {
      const calculated = calculateAmount(value, toFromRate, false);
      setFromAmount(calculated);
    } else {
      setFromAmount('');
    }
  }, [toFromRate, calculateAmount]);
  
  
  const slippagePercent = 0.5; // 0.5% slippage
  const slippage = `Auto ${slippagePercent}%`;
  const minReceive = toAmount ? `${(parseFloat(toAmount) * (1 - slippagePercent/100)).toFixed(6)} ${toTokenSymbol}` : `39 795.2615 ${toTokenSymbol}`;
  const networkFee = "Free $2.22";
  
  // Calculate slippage-adjusted USD value
  const getSlippageAdjustedUSD = useCallback((amount: string, price: number) => {
    if (!amount || !price) return { usdValue: 0, slippagePercent: 0 };
    
    const originalUSD = parseFloat(amount) * price;
    const adjustedUSD = originalUSD * (1 - slippagePercent/100);
    const actualSlippagePercent = ((originalUSD - adjustedUSD) / originalUSD) * 100;
    
    return { 
      usdValue: adjustedUSD, 
      slippagePercent: actualSlippagePercent 
    };
  }, [slippagePercent]);

  const handleSwapTokens = useCallback(() => {
    // Swap chains
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
    
    // Swap tokens
    const tempToken = fromTokenSymbol;
    setFromTokenSymbol(toTokenSymbol);
    setToTokenSymbol(tempToken);
    
    // Swap amounts
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    
    // Flip the last edited field
    setLastEditedField(lastEditedField === 'from' ? 'to' : 'from');
  }, [fromChain, toChain, fromTokenSymbol, toTokenSymbol, fromAmount, toAmount, lastEditedField]);

  const handleSwapExecute = useCallback(() => {
    onSwapExecute(fromTokenSymbol, toTokenSymbol, fromAmount, toAmount);
  }, [onSwapExecute, fromTokenSymbol, toTokenSymbol, fromAmount, toAmount]);

  // Format numbers for display with max 6 decimal places
  const formatAmount = useCallback((amount: string) => {
    if (!amount) return '';
    const num = parseFloat(amount);
    if (num >= 1000) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    }
    // For smaller numbers, limit to 6 decimal places
    return num.toFixed(Math.min(6, amount.split('.')[1]?.length || 0));
  }, []);

  // Format exchange rate with max 6 decimal places
  const formatRate = useCallback((rate: number) => {
    if (rate >= 1) {
      return rate.toFixed(Math.min(6, 2)); // At least 2 decimals for rates >= 1
    }
    return rate.toFixed(6); // Max 6 decimals for smaller rates
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-foreground font-medium text-2xl">Swap</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground" 
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Swap Card */}
      <Card className="p-4 bg-card border border-border shadow-card">
        {/* You pay */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">You pay</span>
          </div>
          <div className="flex items-center gap-3">
            <TokenSelector
              selectedChain={fromChain}
              selectedToken={fromTokenSymbol}
              onChainChange={setFromChain}
              onTokenChange={setFromTokenSymbol}
              tokenPrice={fromTokenPrice}
              label=""
            />
            <div className="flex-1 text-right">
              <Input
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="10"
                className="text-right text-2xl font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0 text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {fromTokenPrice && fromAmount ? `~$${Math.floor(fromTokenPrice * parseFloat(fromAmount)).toLocaleString()}` : 'Enter amount'}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-4 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapTokens}
            className="bg-card border-2 border-border rounded-full hover:bg-accent shadow-sm p-2 transition-all duration-200"
          >
            <ArrowDown className="h-5 w-5 text-foreground" />
          </Button>
        </div>

        {/* You receive */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <TokenSelector
              selectedChain={toChain}
              selectedToken={toTokenSymbol}
              onChainChange={setToChain}
              onTokenChange={setToTokenSymbol}
              tokenPrice={toTokenPrice}
              label=""
            />
            <div className="flex-1 text-right">
              <div className="text-2xl font-medium text-foreground">
                {formatAmount(toAmount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {toTokenPrice && toAmount ? (() => {
                  const { usdValue, slippagePercent: actualSlippage } = getSlippageAdjustedUSD(toAmount, toTokenPrice);
                  return `~$${Math.floor(usdValue).toLocaleString()} (-${actualSlippage.toFixed(2)}%)`;
                })() : '~$39,930 (-0.21%)'}
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate & Collapsible Details */}
        <div className="space-y-2 mb-4">
          {/* Main exchange rate row */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span>1 {fromTokenSymbol} = {formatRate(fromToRate)} {toTokenSymbol}</span>
              <span className="text-muted-foreground">~${fromTokenPrice ? (fromTokenPrice * fromToRate).toFixed(1) : '0'}</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-success">🔒 Free</span>
              <span className="text-muted-foreground line-through">$2.71</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Collapsible details */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Slippage tolerance</span>
                <span className="text-foreground">{slippage}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum receive</span>
                <span className="text-foreground">{minReceive}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="text-success">{networkFee}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isConnected ? (
          <Button 
            onClick={handleSwapExecute}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
            disabled={!fromAmount || !toAmount}
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