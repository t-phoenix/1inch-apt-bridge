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
import { SlippageSheet } from './SlippageSheet';
import { TokenButton } from './TokenButton';

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
    flip,
    setIsRefreshing,
  } = useSwapStore();

  const [showSlippageSheet, setShowSlippageSheet] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

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
      console.log('Executing swap...');
    }
  };

  return (
    <>
      <Card className="w-full max-w-[460px] mx-auto bg-[#10151c] border border-[#1e2632] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <CardContent className="p-4">
          {/* Header with tabs and icons */}
          <div className="flex items-center justify-between mb-6">
            <Tabs defaultValue="swap" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="swap"
                    className="text-base font-medium px-0 py-2 mr-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-white rounded-none text-gray-400"
                  >
                    Swap
                  </TabsTrigger>
                  <TabsTrigger
                    value="limit"
                    className="text-base font-medium px-0 py-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-white rounded-none text-gray-400"
                  >
                    Limit
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                    disabled={isRefreshing}
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSlippageSheet(true)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                  >
                    <Settings size={16} />
                  </Button>
                </div>
              </div>

              <TabsContent value="swap" className="mt-6 space-y-1">
                {/* You pay section */}
                <div className="bg-[#0b0f14] rounded-2xl p-4">
                  <div className="text-sm text-gray-400 mb-4">You pay</div>
                  <div className="flex items-center justify-between">
                    <TokenButton
                      token={payToken}
                      onTokenSelect={setPayToken}
                      type="pay"
                    />
                    <div className="flex-1 ml-4">
                      <AmountInput
                        value={payAmount}
                        onChange={setPayAmount}
                        tokenSymbol={payToken.symbol}
                        placeholder="0.9898"
                      />
                    </div>
                  </div>
                </div>

                {/* Arrow swap button */}
                <div className="flex justify-center -my-2 relative z-10">
                  <Button
                    onClick={flip}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-[#10151c] border border-[#1e2632] hover:bg-[#1a1f2e] text-gray-400 hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 13l3 3 7-7"/>
                      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/>
                    </svg>
                  </Button>
                </div>

                {/* You receive section */}
                <div className="bg-[#0b0f14] rounded-2xl p-4">
                  <div className="text-sm text-gray-400 mb-4">You receive</div>
                  <div className="flex items-center justify-between">
                    <TokenButton
                      token={receiveToken}
                      onTokenSelect={setReceiveToken}
                      type="receive"
                    />
                    <div className="flex-1 ml-4">
                      <AmountInput
                        value={receiveAmountNum > 0 ? formatTokenAmount(receiveAmountNum, 6) : ''}
                        onChange={() => {}}
                        tokenSymbol={receiveToken.symbol}
                        placeholder="4 002.468823"
                        readOnly={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Rate and fee information */}
                <div className="pt-4">
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
                  className="w-full mt-4 h-14 text-lg font-semibold bg-gradient-to-r from-[#1D90F5] to-[#00D4FF] hover:from-[#0D7FE5] hover:to-[#00C4EF] text-white rounded-2xl"
                >
                  {isConnected ? 'Swap' : 'Connect wallet'}
                </Button>
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

      <SlippageSheet
        open={showSlippageSheet}
        onOpenChange={setShowSlippageSheet}
      />
      
      <ConnectWalletDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </>
  );
}