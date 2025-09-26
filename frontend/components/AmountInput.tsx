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
    <div className="flex flex-col items-end space-y-1">
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="text-3xl font-semibold bg-transparent border-none p-0 h-auto text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-full"
      />
      {showUsdValue && numericValue > 0 && (
        <div className="text-sm text-gray-400">
          ~{formatCurrency(usdValue)}
        </div>
      )}
    </div>
  );
}