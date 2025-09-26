'use client';

import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

interface ArrowSwapProps {
  onClick: () => void;
}

export function ArrowSwap({ onClick }: ArrowSwapProps) {
  return (
    <div className="flex justify-center -my-3 relative z-10">
      <Button
        onClick={onClick}
        size="icon"
        variant="outline"
        className="h-10 w-10 rounded-full bg-[#10151c] border-[#1e2632] hover:bg-[#1a1f2e] text-gray-400 hover:text-white"
      >
        <ArrowDown size={16} />
      </Button>
    </div>
  );
}