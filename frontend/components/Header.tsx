'use client';

import { Button } from '@/components/ui/button';
import { useSwapStore } from '@/store/useSwapStore';
import { HelpCircle, Settings } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ConnectWalletDialog } from './ConnectWalletDialog';
import { NavLinks } from './NavLinks';

export function Header() {
  const { isConnected } = useSwapStore();
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4">
      {/* Logo and Navigation */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <Image
            src="/icons/1inch-logo.png"
            alt="1inch"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-xl font-bold text-white">1inch</span>
        </div>
        
        <NavLinks />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg">
          <HelpCircle size={20} />
        </button>
        
        <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg">
          <Settings size={20} />
        </button>

        <Button
          onClick={() => setShowConnectDialog(true)}
          className="bg-gradient-to-r from-[#1D90F5] to-[#00D4FF] hover:from-[#0D7FE5] hover:to-[#00C4EF] text-white font-semibold px-6 py-2 rounded-xl"
        >
          {isConnected ? 'Connected (mock)' : 'Connect wallet'}
        </Button>
      </div>

      <ConnectWalletDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </header>
  );
}