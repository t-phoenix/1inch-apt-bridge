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
        <div className="bg-[#0e1621] border border-[#223042] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">
              1 {payToken} = {payAmount > 0 ? formatTokenAmount(rate, 2) : '4014.26'} {receiveToken} ~$4014.3
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Detailed Information - Only show when expanded */}
        {isExpanded && (
          <div className="space-y-4 text-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between text-gray-400 py-2">
              <span>Slippage tolerance</span>
              <span className="text-white font-medium">Auto 0.5%</span>
            </div>
            
            <div className="flex items-center justify-between text-gray-400 py-2">
              <span>Minimum receive</span>
              <div className="text-right">
                <div className="text-white font-medium">~{payAmount > 0 ? formatCurrency(minReceiveAmount * receivePrice) : '$3951.03'}</div>
                <div className="text-xs text-gray-500">{payAmount > 0 ? formatTokenAmount(minReceiveAmount) : '3951.10892'} {receiveToken}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-gray-400 py-2">
              <span>Network Fee</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium">Free</span>
                <span className="text-gray-500 line-through">$0.52</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}