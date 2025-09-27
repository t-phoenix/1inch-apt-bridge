'use client';

import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, X } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Transaction {
  id: string;
  type: 'swap' | 'send' | 'receive' | 'unknown';
  fromToken?: string;
  toToken?: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'swap',
    fromToken: 'USDC',
    toToken: 'POL',
    amount: '+0.253 POL',
    date: 'Today',
    status: 'completed'
  },
  {
    id: '2',
    type: 'send',
    amount: '-0.0213 USDC',
    date: 'July 17',
    status: 'completed'
  },
  {
    id: '3',
    type: 'send',
    amount: '-0.0213 USDC',
    date: 'July 17',
    status: 'completed'
  },
  {
    id: '4',
    type: 'unknown',
    amount: '',
    date: 'July 17',
    status: 'completed'
  },
  {
    id: '5',
    type: 'send',
    amount: '-0.0213 USDC',
    date: 'July 17',
    status: 'completed'
  },
];

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  if (!isOpen) return null;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center absolute -top-1 -left-1">
              <span className="text-white text-xs font-bold">$</span>
            </div>
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center absolute -bottom-1 -right-1">
              <span className="text-white text-xs font-bold">◊</span>
            </div>
          </div>
        );
      case 'send':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="m22 2-7 20-4-9-9-4Z"/>
              <path d="M22 2 11 13"/>
            </svg>
          </div>
        );
      case 'receive':
        return (
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M12 5v14"/>
              <path d="m19 12-7 7-7-7"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white text-lg">?</span>
          </div>
        );
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'swap':
        return 'Swap';
      case 'send':
        return 'Send';
      case 'receive':
        return 'Receive';
      default:
        return 'Transaction';
    }
  };

  const getTransactionSubtitle = (transaction: Transaction) => {
    if (transaction.type === 'swap') {
      return `${transaction.fromToken} → ${transaction.toToken}`;
    }
    return 'USD Coin';
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#7b1fa2] text-white">
      <div className="min-h-screen overflow-y-auto flex justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-bold text-white">Account</h1>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

        {/* Account Info */}
        <div className="px-6 pb-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 space-y-6">
            {/* Wallet Address */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">0x4e39...fc80</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Copy size={16} className="text-white/80" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ExternalLink size={16} className="text-white/80" />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">$1.39</div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <Button className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-2xl py-4 flex items-center justify-center space-x-2">
                <span className="text-lg">+</span>
                <span>Buy</span>
              </Button>
              <Button className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-2xl py-4 flex items-center justify-center space-x-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14"/>
                  <path d="m19 12-7 7-7-7"/>
                </svg>
                <span>Receive</span>
              </Button>
              <Button className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-2xl py-4 flex items-center justify-center space-x-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4Z"/>
                </svg>
                <span>Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 mb-6">
          <div className="flex bg-black/20 rounded-2xl p-1">
            <button className="flex-1 text-center py-3 text-white/60 font-medium">
              Assets
            </button>
            <button className="flex-1 text-center py-3 bg-white/20 text-white font-medium rounded-xl">
              History
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="px-6 space-y-6">
          {mockTransactions.map((transaction, index) => {
            const isToday = transaction.date === 'Today';
            const showDateHeader = index === 0 || (index === 1 && transaction.date !== mockTransactions[0].date);
            
            return (
              <div key={transaction.id}>
                {showDateHeader && (
                  <div className="text-white font-semibold text-lg mb-4 mt-6">
                    {transaction.date}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 py-2">
                  {getTransactionIcon(transaction.type)}
                  
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {getTransactionTitle(transaction)}
                    </div>
                    <div className="text-white/60 text-sm">
                      {getTransactionSubtitle(transaction)}
                    </div>
                  </div>
                  
                  {transaction.amount && (
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.amount.startsWith('+') ? 'text-green-400' : 
                        transaction.amount.startsWith('-') ? 'text-white' : 'text-white'
                      }`}>
                        {transaction.type === 'swap' ? (
                          <div className="space-y-1">
                            <div className="text-green-400">{transaction.amount}</div>
                            <div className="text-white">-0.1 USDC</div>
                          </div>
                        ) : (
                          transaction.amount
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
}