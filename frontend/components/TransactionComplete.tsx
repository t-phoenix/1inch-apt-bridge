'use client';

import { formatCurrency, formatTokenAmount } from '@/lib/format';
import { ExternalLink, X } from 'lucide-react';

interface TransactionCompleteProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData: {
    hash: string;
    timestamp: string;
    status: 'executed' | 'pending' | 'failed';
    fromToken: {
      symbol: string;
      amount: number;
      value: number;
      chain: string;
      icon: string;
    };
    toToken: {
      symbol: string;
      amount: number;
      value: number;
      chain: string;
      icon: string;
    };
    rates: {
      fromRate: number;
      toRate: number;
    };
  };
}

export function TransactionComplete({ isOpen, onClose, transactionData }: TransactionCompleteProps) {
  if (!isOpen) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return '✓';
      case 'pending': return '○';
      case 'failed': return '✗';
      default: return '○';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#10151c] border border-[#1e2632] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-bold text-white">Swap Complete</h1>
              <div className="text-gray-400 text-sm mt-1">
                {transactionData.timestamp}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 ${getStatusColor(transactionData.status)}`}>
              <span className="text-sm">{getStatusIcon(transactionData.status)}</span>
              <span className="font-medium capitalize text-sm">{transactionData.status}</span>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-6">
          {/* Token Swap Display */}
          <div className="space-y-4">
            {/* From Token */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {transactionData.fromToken.symbol[0]}
                </div>
                <div>
                  <div className="text-white text-base font-medium">
                    {transactionData.fromToken.symbol}
                  </div>
                  <div className="text-gray-400 text-xs">
                    on {transactionData.fromToken.chain}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white text-lg font-semibold">
                  -{formatTokenAmount(transactionData.fromToken.amount, 1)}
                </div>
                <div className="text-gray-400 text-xs">
                  ~{formatCurrency(transactionData.fromToken.value)}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-1">
              <div className="text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14"/>
                  <path d="m19 12-7 7-7-7"/>
                </svg>
              </div>
            </div>

            {/* To Token */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {transactionData.toToken.symbol[0]}
                </div>
                <div>
                  <div className="text-white text-base font-medium">
                    {transactionData.toToken.symbol}
                  </div>
                  <div className="text-gray-400 text-xs">
                    on {transactionData.toToken.chain}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-lg font-semibold">
                  +{formatTokenAmount(transactionData.toToken.amount, 3)}
                </div>
                <div className="text-gray-400 text-xs">
                  ~{formatCurrency(transactionData.toToken.value)}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Information */}
          <div className="bg-[#0e1621] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Transaction Hash</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-mono text-sm">
                  {formatAddress(transactionData.hash)}
                </span>
                <button className="text-gray-400 hover:text-white">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">1 {transactionData.fromToken.symbol}</span>
                <span className="text-white">
                  {formatTokenAmount(transactionData.toToken.amount / transactionData.fromToken.amount, 4)} {transactionData.toToken.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">1 {transactionData.toToken.symbol}</span>
                <span className="text-white">
                  {formatTokenAmount(transactionData.fromToken.amount / transactionData.toToken.amount, 4)} {transactionData.fromToken.symbol}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-gray-400 text-sm">
                <span>Status</span>
                <span className={`capitalize ${getStatusColor(transactionData.status)}`}>
                  {transactionData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
            </div>
            <h3 className="text-white font-semibold mb-1">Transaction Successful!</h3>
            <p className="text-gray-400 text-sm">
              Your swap has been completed successfully
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}