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
          className="h-auto p-4 bg-gray-900/50 hover:bg-gray-800/70 backdrop-blur-sm border border-gray-700/30 hover:border-blue-500/30 rounded-2xl transition-all duration-300 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Image
                src={`/icons/${token.symbol.toLowerCase()}.svg`}
                alt={token.symbol}
                width={48}
                height={48}
                className="rounded-full ring-2 ring-blue-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">◊</span>
              </div>
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl text-white">{token.symbol}</span>
                <ChevronDown size={18} className="text-gray-300" />
              </div>
              <span className="text-sm text-gray-400 font-medium">
                {token.chainId === 'polygon' ? 'Ethereum' : 'Aptos'}
              </span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
            <DropdownMenuContent className="w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2 shadow-2xl">
        {availableTokens.map((availableToken) => (
          <DropdownMenuItem
            key={availableToken.symbol}
            onClick={() => onTokenSelect(availableToken)}
            className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-800/50 transition-all duration-300 cursor-pointer"
          >
            <Image
              src={`/icons/${availableToken.symbol.toLowerCase()}.svg`}
              alt={availableToken.symbol}
              width={40}
              height={40}
              className="rounded-full ring-2 ring-blue-500/20"
            />
            <div className="flex flex-col items-start">
              <span className="font-bold text-white text-lg">{availableToken.symbol}</span>
              <span className="text-sm text-gray-400">{availableToken.name}</span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-white font-bold">0.00</div>
              <div className="text-sm text-gray-400">$0.00</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}