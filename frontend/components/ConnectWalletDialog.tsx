'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useSwapStore } from '@/store/useSwapStore';
import Image from 'next/image';
import { useState } from 'react';

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const walletOptions = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/icons/metamask.svg',
    description: 'Connect using browser wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/icons/walletconnect.svg',
    description: 'Connect using WalletConnect',
  },
  {
    id: 'petra',
    name: 'Petra',
    icon: '/icons/petra.svg',
    description: 'Connect using Petra wallet',
  },
];

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { setIsConnected } = useSwapStore();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setConnecting(null);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#10151c] border border-[#1e2632]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Connect wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="w-full justify-start h-16 bg-[#0b0f14] border-[#223042] hover:bg-[#1a1f2e] text-left p-4"
              onClick={() => handleConnect(wallet.id)}
              disabled={connecting === wallet.id}
            >
              <div className="flex items-center space-x-4">
                <Image
                  src={wallet.icon}
                  alt={wallet.name}
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div>
                  <div className="font-medium text-white">{wallet.name}</div>
                  <div className="text-sm text-gray-400">{wallet.description}</div>
                </div>
              </div>
              {connecting === wallet.id && (
                <div className="ml-auto">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}