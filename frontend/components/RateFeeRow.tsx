'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { formatCurrency, formatTokenAmount } from '@/lib/format';
import { getPrice } from '@/lib/prices';
import { useState } from 'react';

interface RateFeeRowProps {
  payToken: string;
  receiveToken: string;
  payAmount: number;
  receiveAmount: number;
}

export function RateFeeRow({ payToken, receiveToken, payAmount, receiveAmount }: RateFeeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const payPrice = getPrice(payToken);
  const receivePrice = getPrice(receiveToken);
  const rate = payPrice / receivePrice;
  
  const minReceiveAmount = receiveAmount * 0.995; // Accounting for 0.5% slippage
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Exchange Rate Row - Always show */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-white text-base font-medium">
              1 {payToken} = {payAmount > 0 ? formatTokenAmount(rate, 2) : '4,014.26'} {receiveToken} 
              <span className="text-slate-300 ml-2">≈ ${payAmount > 0 ? formatTokenAmount(rate, 2) : '4,014.30'}</span>
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 group"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                className={`text-slate-400 group-hover:text-white transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Detailed Information - Only show when expanded */}
        {isExpanded && (
          <div className="space-y-4 text-base animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between text-slate-300 py-3 border-b border-white/10">
              <span className="font-medium">Slippage tolerance</span>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold">
                  Auto 0.5%
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-slate-300 py-3 border-b border-white/10">
              <span className="font-medium">Minimum receive</span>
              <div className="text-right">
                <div className="text-white font-bold text-lg">{payAmount > 0 ? formatCurrency(minReceiveAmount * receivePrice) : '$3,951.03'}</div>
                <div className="text-sm text-slate-400">{payAmount > 0 ? formatTokenAmount(minReceiveAmount) : '3,951.10892'} {receiveToken}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-slate-300 py-3">
              <span className="font-medium">Network Fee</span>
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-bold text-lg">Free</span>
                <span className="text-slate-500 line-through text-sm">$0.52</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}