'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#10151c] border-[#1e2632]">
        <SheetHeader>
          <SheetTitle className="text-white">Slippage Settings</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <Label className="text-white text-sm font-medium">
              Slippage tolerance
            </Label>
            <p className="text-gray-400 text-sm mt-1">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex space-x-2">
            {presetSlippages.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset.value)}
                className={`${
                  slippageBps === preset.value && !isCustom
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-[#0e1621] border-[#223042] text-gray-400 hover:bg-[#1a1f2e]'
                }`}
              >
                {preset.label}
              </Button>
            ))}
            
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => handleCustomSlippage(e.target.value)}
                className="w-20 bg-[#0e1621] border-[#223042] text-white text-sm"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>

          {/* Current Setting Display */}
          <div className="p-4 rounded-lg bg-[#0b0f14] border border-[#223042]">
            <div className="text-sm text-gray-400">Current slippage tolerance</div>
            <div className="text-lg font-semibold text-white">
              {(currentSlippagePercent).toFixed(2)}%
            </div>
          </div>

          {/* Warning for high slippage */}
          {currentSlippagePercent > 5 && (
            <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">
                High slippage tolerance may result in unfavorable trades
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}