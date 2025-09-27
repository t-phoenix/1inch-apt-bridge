'use client';

import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useNotification } from '@/lib/NotificationContext';
import { useSwapStore } from '@/store/useSwapStore';
import { useState } from 'react';

interface SlippageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const presetSlippages = [
  { label: '0.1%', value: 10 },
  { label: '0.5%', value: 50 },
  { label: '1.0%', value: 100 },
];

export function SlippageSheet({ open, onOpenChange }: SlippageSheetProps) {
  const { slippageBps, setSlippageBps } = useSwapStore();
  const { showInfo } = useNotification();
  const [customSlippage, setCustomSlippage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const currentSlippagePercent = slippageBps / 100;

  const handlePresetSelect = (value: number) => {
    setSlippageBps(value);
    setIsCustom(false);
    setCustomSlippage('');
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      setSlippageBps(Math.round(numericValue * 100));
      setIsCustom(true);
    }
  };

  const handleAutoClick = () => {
    showInfo('Auto slippage mode - automatically optimized!', 'Auto Mode');
  };

  const handleCustomTokensClick = () => {
    showInfo('Custom tokens management coming soon!', 'Coming Soon');
  };

  const handleAdvancedModeClick = () => {
    showInfo('Advanced trading mode coming soon!', 'Coming Soon');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#10151c] border-[#1e2632] w-full sm:w-[540px]">
        <SheetHeader className="text-left">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <SheetTitle className="text-white text-xl font-semibold">
              Swap settings
            </SheetTitle>
          </div>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Slippage Tolerance Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                        fill="currentColor"/>
                </svg>
                <span className="text-white text-lg font-medium">Slippage tolerance</span>
              </div>
              <button 
                onClick={handleAutoClick}
                className="flex items-center space-x-2 hover:bg-[#1a2332] px-3 py-1 rounded-lg transition-colors"
              >
                <span className="text-gray-400 text-sm">Auto</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            </div>

            {/* Slippage Buttons */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant="outline"
                onClick={() => handlePresetSelect(50)}
                className={`px-4 py-2 rounded-xl ${
                  slippageBps === 50 && !isCustom
                    ? 'bg-[#1a2332] border-[#1a2332] text-white'
                    : 'bg-[#1a2332] border-[#1a2332] text-gray-300 hover:bg-[#1a2332]'
                }`}
              >
                Auto
              </Button>
              
              {presetSlippages.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`px-4 py-2 rounded-xl ${
                    slippageBps === preset.value && !isCustom
                      ? 'bg-[#1a2332] border-[#1a2332] text-white'
                      : 'bg-transparent border-gray-600 text-gray-400 hover:bg-[#1a2332]'
                  }`}
                >
                  {preset.label}
                </Button>
              ))}
              
              <Button
                variant="outline"
                onClick={() => showInfo('Custom slippage input coming soon!', 'Coming Soon')}
                className="px-4 py-2 rounded-xl bg-transparent border-gray-600 text-gray-400 hover:bg-[#1a2332]"
              >
                Custom
              </Button>
            </div>
          </div>

          {/* Custom Tokens Section */}
          <div>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-white text-lg font-medium">Custom tokens</span>
              </div>
              <button 
                onClick={handleCustomTokensClick}
                className="flex items-center space-x-3 hover:bg-[#1a2332] px-3 py-2 rounded-lg transition-colors"
              >
                <span className="text-blue-400 text-lg">0</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Settings Icon and Advanced Mode */}
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1"/>
                <path d="M12 1v6m0 8v6m11-7h-6m-8 0H1" stroke="currentColor" strokeWidth="1"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            
            <div className="text-center space-y-3">
              <div className="text-gray-400">For extended settings</div>
              <Button
                variant="link"
                onClick={handleAdvancedModeClick}
                className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              >
                Open advanced mode
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}