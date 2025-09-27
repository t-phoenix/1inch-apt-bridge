import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import TokenIcon from "./TokenIcon";

// Supported chains
const SUPPORTED_CHAINS = [
  {
    id: 137,
    name: "Polygon",
    symbol: "MATIC",
    icon: "🔷"
  },
  {
    id: 1,
    name: "Ethereum", 
    symbol: "ETH",
    icon: "⟠"
  },
  {
    id: 99999, // Custom ID for Aptos
    name: "Aptos",
    symbol: "APT",
    icon: "🔺"
  }
];

// Supported tokens per chain
const CHAIN_TOKENS = {
  137: [ // Polygon
    { symbol: "POL", name: "Polygon Ecosystem Token", address: "0x455e53908abea3c36d86123a5e5a54b4c8e70933" },
    { symbol: "WMATIC", name: "Wrapped MATIC", address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" },
    { symbol: "USDC", name: "USD Coin", address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174" },
    { symbol: "USDT", name: "Tether USD", address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" },
    { symbol: "WETH", name: "Wrapped Ethereum", address: "0x7ceb23fd6f88dd72b04ac0e5b7e2b8eac1b1b6e2" }
  ],
  1: [ // Ethereum
    { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000" },
    { symbol: "USDC", name: "USD Coin", address: "0xa0b86a33e6b6c38dd2b0d6e3e0e3c6cc3b1a8f1d" },
    { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }
  ],
  99999: [ // Aptos
    { symbol: "APT", name: "Aptos", address: "0x1::aptos_coin::AptosCoin" },
    { symbol: "USDC", name: "USD Coin", address: "aptos_usdc_address" },
    { symbol: "USDT", name: "Tether USD", address: "aptos_usdt_address" }
  ]
};

interface TokenSelectorProps {
  selectedChain: number;
  selectedToken: string;
  onChainChange: (chainId: number) => void;
  onTokenChange: (tokenSymbol: string) => void;
  tokenPrice?: number;
  label: string;
}

const TokenSelector = ({ 
  selectedChain, 
  selectedToken, 
  onChainChange, 
  onTokenChange, 
  tokenPrice,
  label 
}: TokenSelectorProps) => {
  const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
  
  const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === selectedChain);
  const availableTokens = CHAIN_TOKENS[selectedChain] || [];
  const currentToken = availableTokens.find(token => token.symbol === selectedToken);

  const handleTokenSelect = (tokenSymbol: string) => {
    onTokenChange(tokenSymbol);
    setIsTokenSelectOpen(false);
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {tokenPrice && (
            <Badge variant="outline" className="text-xs">
              ${tokenPrice.toFixed(6)}
            </Badge>
          )}
        </div>
      )}

      {/* Chain Selection */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Network</span>
        <Select 
          value={selectedChain.toString()} 
          onValueChange={(value) => onChainChange(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{currentChain?.icon}</span>
                <span>{currentChain?.name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{chain.icon}</span>
                  <span>{chain.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Token Selection */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Token</span>
        {isTokenSelectOpen ? (
          <Card>
            <CardContent className="p-2">
              <div className="space-y-1">
                {availableTokens.map((token) => (
                  <Button
                    key={token.symbol}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleTokenSelect(token.symbol)}
                  >
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={token.symbol} />
                      <div className="text-left">
                        <div className="font-medium text-sm">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button 
            variant="outline" 
            className="w-full justify-start p-3 h-auto"
            onClick={() => setIsTokenSelectOpen(true)}
          >
            <div className="flex items-center gap-3">
              <TokenIcon symbol={selectedToken} />
              <div className="text-left">
                <div className="font-medium">{selectedToken}</div>
                <div className="text-xs text-muted-foreground">
                  {currentToken?.name || "Select token"}
                </div>
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};

export default TokenSelector;
export { CHAIN_TOKENS, SUPPORTED_CHAINS };
