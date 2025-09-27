'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTokenAmount } from '@/lib/format';
import { calculateReceiveAmount } from '@/lib/prices';
import { useSwapStore } from '@/store/useSwapStore';
import { RefreshCw, Settings } from 'lucide-react';
import { useState } from 'react';
import { AmountInput } from './AmountInput';
import { ConnectWalletDialog } from './ConnectWalletDialog';
import { RateFeeRow } from './RateFeeRow';
import { TokenButton } from './TokenButton';
import { TransactionComplete } from './TransactionComplete';

export function SwapCard() {
  const {
    payToken,
    receiveToken,
    payAmount,
    slippageBps,
    isConnected,
    isRefreshing,
    setPayToken,
    setReceiveToken,
    setPayAmount,
    setSlippageBps,
    flip,
    setIsRefreshing,
  } = useSwapStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showTransactionComplete, setShowTransactionComplete] = useState(false);

  const payAmountNum = parseFloat(payAmount) || 0;
  const receiveAmountNum = calculateReceiveAmount(
    payAmountNum,
    payToken.symbol,
    receiveToken.symbol,
    slippageBps
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleSwap = () => {
    if (!isConnected) {
      setShowConnectDialog(true);
    } else {
      // Simulate swap execution
      console.log('Executing swap...');
      // Show transaction complete after a brief delay
      setTimeout(() => {
        setShowTransactionComplete(true);
      }, 1000);
    }
  };

  // Mock transaction data for the completion view
  const mockTransactionData = {
    hash: '0x4e39...fc80',
    timestamp: 'Sep 26 2025 22:41',
    status: 'executed' as const,
    fromToken: {
      symbol: payToken.symbol,
      amount: payAmountNum,
      value: payAmountNum * 4012.64,
      chain: 'Base',
      icon: '',
    },
    toToken: {
      symbol: receiveToken.symbol,
      amount: receiveAmountNum,
      value: receiveAmountNum * 1.0,
      chain: receiveToken.symbol === 'USDC' ? 'Base' : 'Polygon',
      icon: '',
    },
    rates: {
      fromRate: 4012.64,
      toRate: 1.0,
    },
  };

  return (
    <>
      <Card className="w-full max-w-[500px] mx-auto bg-gradient-to-br from-black/80 via-gray-900/90 to-black/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-black/30">
        <CardContent className="p-10">
          {/* Header with elegant tabs and icons */}
          <div className="flex items-center justify-between mb-12">
            <Tabs defaultValue="swap" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="swap"
                    className="text-xl font-bold px-0 py-4 mr-12 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b-3 border-transparent data-[state=active]:border-blue-500 rounded-none text-gray-400 hover:text-white transition-all duration-300"
                  >
                    Swap
                  </TabsTrigger>
                  <TabsTrigger
                    value="limit"
                    className="text-xl font-bold px-0 py-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b-3 border-transparent data-[state=active]:border-blue-500 rounded-none text-gray-400 hover:text-white transition-all duration-300"
                  >
                    Limit
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="h-12 w-12 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                    disabled={isRefreshing}
                  >
                    <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-12 w-12 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                  >
                    <Settings size={20} />
                  </Button>
                </div>
              </div>

              <TabsContent value="swap" className="mt-14 space-y-8">
                {showSettings ? (
                  // Inline Settings View
                  <div className="space-y-8">
                    {/* Settings Header */}
                    <div className="flex items-center space-x-4 mb-8">
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m15 18-6-6 6-6"/>
                        </svg>
                      </button>
                      <h2 className="text-white text-xl font-semibold">Swap settings</h2>
                    </div>

                    {/* Slippage Tolerance Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                                  fill="currentColor"/>
                          </svg>
                          <span className="text-white text-lg font-medium">Slippage tolerance</span>
                        </div>
                        <button className="flex items-center space-x-2 hover:bg-[#1a2332] px-3 py-2 rounded-lg transition-colors">
                          <span className="text-gray-400 text-sm">Auto</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                      </div>

                      {/* Slippage Buttons */}
                      <div className="flex space-x-3 mb-8">
                        <Button
                          variant="outline"
                          onClick={() => setSlippageBps(50)}
                          className={`px-4 py-2 rounded-xl ${
                            slippageBps === 50
                              ? 'bg-[#1a2332] border-[#1a2332] text-white'
                              : 'bg-[#1a2332] border-[#1a2332] text-gray-300 hover:bg-[#1a2332]'
                          }`}
                        >
                          Auto
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => setSlippageBps(10)}
                          className={`px-4 py-2 rounded-xl ${
                            slippageBps === 10
                              ? 'bg-[#1a2332] border-[#1a2332] text-white'
                              : 'bg-transparent border-gray-600 text-gray-400 hover:bg-[#1a2332]'
                          }`}
                        >
                          0.1%
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => setSlippageBps(50)}
                          className={`px-4 py-2 rounded-xl ${
                            slippageBps === 50 && slippageBps !== 50
                              ? 'bg-[#1a2332] border-[#1a2332] text-white'
                              : 'bg-transparent border-gray-600 text-gray-400 hover:bg-[#1a2332]'
                          }`}
                        >
                          0.5%
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => setSlippageBps(100)}
                          className={`px-4 py-2 rounded-xl ${
                            slippageBps === 100
                              ? 'bg-[#1a2332] border-[#1a2332] text-white'
                              : 'bg-transparent border-gray-600 text-gray-400 hover:bg-[#1a2332]'
                          }`}
                        >
                          1%
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="px-4 py-2 rounded-xl bg-transparent border-gray-600 text-gray-400 hover:bg-[#1a2332]"
                        >
                          Custom
                        </Button>
                      </div>
                    </div>

                    {/* Custom Tokens Section */}
                    <div className="py-4">
                      <div className="flex items-center justify-between py-6">
                        <div className="flex items-center space-x-3">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="text-white text-lg font-medium">Custom tokens</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-400 text-lg">0</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                            <path d="m9 18 6-6-6-6"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="flex flex-col items-center justify-center py-16 space-y-8">
                      <div className="relative">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1"/>
                          <path d="M12 1v6m0 8v6m11-7h-6m-8 0H1" stroke="currentColor" strokeWidth="1"/>
                          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="1"/>
                        </svg>
                      </div>
                      
                      <div className="text-center space-y-4">
                        <div className="text-gray-400">For extended settings</div>
                        <Button
                          variant="link"
                          className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                        >
                          Open advanced mode
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal Swap View
                  <>
                    {/* You pay section */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300">
                      <div className="text-sm font-medium text-gray-300 mb-6 tracking-wide uppercase">You Pay</div>
                      <div className="flex items-center justify-between">
                        <TokenButton
                          token={payToken}
                          onTokenSelect={setPayToken}
                          type="pay"
                        />
                        <div className="flex-1 ml-6">
                          <AmountInput
                            value={payAmount}
                            onChange={setPayAmount}
                            tokenSymbol={payToken.symbol}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Arrow swap button */}
                    <div className="flex justify-center -my-6 relative z-10 py-6">
                      <Button
                        onClick={flip}
                        size="icon"
                        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7 16 4 4 4-4"/>
                          <path d="m11 12 0 8"/>
                          <path d="m7 8 4-4 4 4"/>
                          <path d="m11 4 0 8"/>
                        </svg>
                      </Button>
                    </div>

                    {/* You receive section */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300">
                      <div className="text-sm font-medium text-gray-300 mb-6 tracking-wide uppercase">You Receive</div>
                      <div className="flex items-center justify-between">
                        <TokenButton
                          token={receiveToken}
                          onTokenSelect={setReceiveToken}
                          type="receive"
                        />
                        <div className="flex-1 ml-6">
                          <AmountInput
                            value={receiveAmountNum > 0 ? formatTokenAmount(receiveAmountNum, 6) : ''}
                            onChange={() => {}}
                            tokenSymbol={receiveToken.symbol}
                            placeholder="0.00"
                            readOnly={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rate and fee information */}
                    <div className="pt-10">
                      <RateFeeRow
                        payToken={payToken.symbol}
                        receiveToken={receiveToken.symbol}
                        payAmount={payAmountNum}
                        receiveAmount={receiveAmountNum}
                      />
                    </div>

                    {/* Connect wallet button */}
                    <Button
                      onClick={handleSwap}
                      className="w-full mt-10 h-18 text-xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border border-blue-500/30"
                    >
                      {isConnected ? 'Swap' : 'Connect wallet'}
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="limit" className="mt-6">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">Coming soon</div>
                  <div className="text-sm text-gray-500">
                    Limit orders are not yet available
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <ConnectWalletDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />

      <TransactionComplete
        isOpen={showTransactionComplete}
        onClose={() => setShowTransactionComplete(false)}
        transactionData={mockTransactionData}
      />
    </>
  );
}