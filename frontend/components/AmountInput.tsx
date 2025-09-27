'use client';

import { Input } from '@/components/ui/input';
import { calculateUsdValue, formatCurrency } from '@/lib/format';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  tokenSymbol: string;
  placeholder?: string;
  readOnly?: boolean;
  showUsdValue?: boolean;
}

export function AmountInput({
  value,
  onChange,
  tokenSymbol,
  placeholder = '0',
  readOnly = false,
  showUsdValue = true,
}: AmountInputProps) {
  const numericValue = parseFloat(value) || 0;
  const usdValue = calculateUsdValue(numericValue, tokenSymbol);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string, numbers, and single decimal point
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div className="flex flex-col items-end space-y-2">
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="text-4xl font-bold bg-transparent border-none p-0 h-auto text-white placeholder:text-slate-400/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-full tracking-tight"
      />
      {showUsdValue && numericValue > 0 && (
        <div className="text-base text-slate-300 font-medium">
          ≈ {formatCurrency(usdValue)}
        </div>
      )}
    </div>
  );
}