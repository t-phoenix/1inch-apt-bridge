'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { formatCurrency, formatTokenAmount } from '@/lib/format';
import { getPrice } from '@/lib/prices';

interface RateFeeRowProps {
  payToken: string;
  receiveToken: string;
  payAmount: number;
  receiveAmount: number;
}

export function RateFeeRow({ payToken, receiveToken, payAmount, receiveAmount }: RateFeeRowProps) {
  const payPrice = getPrice(payToken);
  const receivePrice = getPrice(receiveToken);
  const rate = payPrice / receivePrice;
  
  if (payAmount === 0) return null;
  
  return (
    <TooltipProvider>
      <div className="bg-[#0e1621] border border-[#223042] rounded-xl p-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">
            1 {payToken} = {formatTokenAmount(rate, 2)} {receiveToken}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              ~{formatCurrency(payPrice)}
            </span>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 text-sm">Free</span>
              <span className="text-gray-500 text-sm line-through">$1.87</span>
            </div>
            <button className="p-1 hover:bg-gray-800 rounded">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}