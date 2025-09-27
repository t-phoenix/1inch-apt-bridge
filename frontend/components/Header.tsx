'use client';

import { Button } from '@/components/ui/button';
import { useSwapStore } from '@/store/useSwapStore';
import { HelpCircle, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { AccountModal } from './AccountModal';
import { ConnectWalletDialog } from './ConnectWalletDialog';
import { NavLinks } from './NavLinks';

interface HeaderProps {
  isAccountModalOpen?: boolean;
  setIsAccountModalOpen?: (open: boolean) => void;
}

export function Header({ isAccountModalOpen, setIsAccountModalOpen }: HeaderProps) {
  const { isConnected } = useSwapStore();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleAccountClick = () => {
    const newState = !showAccountModal;
    setShowAccountModal(newState);
    if (setIsAccountModalOpen) {
      setIsAccountModalOpen(newState);
    }
  };

  const handleAccountClose = () => {
    setShowAccountModal(false);
    if (setIsAccountModalOpen) {
      setIsAccountModalOpen(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-8 py-6 backdrop-blur-xl bg-black/20 border-b border-gray-700/50">
      {/* Logo and Navigation */}
      <div className="flex items-center space-x-12">
        <div className="flex items-center space-x-4">
          <Image
            src="/icons/1inch-logo.png"
            alt="1inch"
            width={36}
            height={36}
            className="rounded-full ring-2 ring-blue-500/30"
          />
          <span className="text-2xl font-bold text-white tracking-tight">1inch</span>
        </div>
        
        <NavLinks />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300 rounded-2xl backdrop-blur-sm">
          <HelpCircle size={22} />
        </button>
        
        <button 
          onClick={handleAccountClick}
          className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-300 rounded-2xl backdrop-blur-sm"
        >
          <User size={22} />
        </button>

        <Button
          onClick={() => setShowConnectDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30"
        >
          {isConnected ? 'Connected' : 'Connect Wallet'}
        </Button>
      </div>

      <ConnectWalletDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={handleAccountClose}
      />
    </header>
  );
}