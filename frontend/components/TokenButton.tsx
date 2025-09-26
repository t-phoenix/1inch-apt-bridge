'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Token, getTokensByChain } from '@/lib/tokens';
import { useSwapStore } from '@/store/useSwapStore';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface TokenButtonProps {
  token: Token;
  onTokenSelect: (token: Token) => void;
  type: 'pay' | 'receive';
}

export function TokenButton({ token, onTokenSelect, type }: TokenButtonProps) {
  const { chain } = useSwapStore();
  const availableTokens = getTokensByChain(chain);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 bg-transparent border-none hover:bg-transparent text-white"
        >
          <div className="flex items-center space-x-3">
            <Image
              src={`/icons/${token.symbol.toLowerCase()}.svg`}
              alt={token.symbol}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex flex-col items-start">
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-lg">{token.symbol}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
              <span className="text-sm text-gray-400">
                on {token.chainId === 'polygon' ? 'Ethereum' : 'Aptos'}
              </span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 bg-[#10151c] border border-[#1e2632]">
        {availableTokens.map((availableToken) => (
          <DropdownMenuItem
            key={availableToken.symbol}
            className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-[#1a1f2e] text-white"
            onClick={() => onTokenSelect(availableToken)}
          >
            <Image
              src={`/icons/${availableToken.symbol.toLowerCase()}.svg`}
              alt={availableToken.symbol}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <div className="font-medium">{availableToken.symbol}</div>
              <div className="text-xs text-gray-400">{availableToken.name}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}