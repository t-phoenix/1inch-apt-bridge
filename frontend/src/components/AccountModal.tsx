import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePetraWallet } from "@/contexts/PetraWalletContext";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpRight, Copy, ExternalLink, LogOut, Plus, Send, TrendingDown } from "lucide-react";
import TokenIcon from "./TokenIcon";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Transaction {
  type: "swap" | "send";
  fromToken: string;
  toToken?: string;
  amount: string;
  value: string;
  date: string;
  status: "executed" | "pending";
  gain?: string;
}

const AccountModal = ({ open, onOpenChange }: AccountModalProps) => {
  // Get both wallet states
  const { 
    account: metaMaskAccount, 
    balance: metaMaskBalance, 
    walletType: metaMaskType, 
    chainId, 
    disconnectWallet: disconnectMetaMask, 
    provider,
    isConnected: isMetaMaskConnected
  } = useWallet();
  
  const { 
    account: petraAccount, 
    formattedBalance: petraBalance, 
    network: petraNetwork, 
    disconnectWallet: disconnectPetra,
    isConnected: isPetraConnected
  } = usePetraWallet();
  
  const { toast } = useToast();
  
  // Determine active wallet
  const isMetaMaskActive = isMetaMaskConnected;
  const isPetraActive = isPetraConnected;
  
  const activeAccount = isMetaMaskActive ? metaMaskAccount : isPetraActive ? petraAccount : null;
  const activeBalance = isMetaMaskActive ? metaMaskBalance : isPetraActive ? petraBalance : null;
  const activeWalletType = isMetaMaskActive ? 'MetaMask' : isPetraActive ? 'Petra' : null;
  
  const transactions: Transaction[] = [
    {
      type: "swap",
      fromToken: "POL",
      toToken: "APT", 
      amount: "-0.1 POL",
      value: "+0.253 APT",
      date: "Today",
      status: "executed",
      gain: "+0.253 APT"
    },
    {
      type: "send",
      fromToken: "POL",
      amount: "-0.0213 POL",
      value: "",
      date: "July 17",
      status: "executed"
    },
    {
      type: "send", 
      fromToken: "POL",
      amount: "-0.0213 POL",
      value: "",
      date: "July 17",
      status: "executed"
    }
  ];

  const handleCopyAddress = async () => {
    if (activeAccount) {
      try {
        let addressToCopy = activeAccount;
        
        // For MetaMask, get the full address from provider
        if (isMetaMaskActive && provider) {
          const signer = await provider.getSigner();
          addressToCopy = await signer.getAddress();
        }
        // For Petra, activeAccount already contains the full address
        
        await navigator.clipboard.writeText(addressToCopy);
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect the appropriate wallet
      if (isMetaMaskActive) {
        await disconnectMetaMask();
        toast({
          title: "MetaMask Disconnected",
          description: "Your MetaMask wallet has been disconnected",
        });
      } else if (isPetraActive) {
        await disconnectPetra();
        toast({
          title: "Petra Wallet Disconnected", 
          description: "Your Petra wallet has been disconnected",
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect wallet completely",
        variant: "destructive"
      });
    }
  };

  const getChainName = () => {
    if (isMetaMaskActive) {
      switch (chainId) {
        case 1: return "Ethereum";
        case 137: return "Polygon";
        default: return `Chain ${chainId}`;
      }
    } else if (isPetraActive) {
      return petraNetwork || "Aptos";
    }
    return "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-foreground text-xl font-medium">Account</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDisconnect}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Wallet Section */}
          <div className="p-6 bg-gradient-to-br from-primary/20 to-purple-500/20">
            {/* Wallet Address */}
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 mb-6">
              <TokenIcon symbol={isMetaMaskActive ? "POL" : "APT"} size="sm" />
              <div className="flex-1">
                <div className="text-foreground font-medium">
                  {activeAccount || 'Not connected'}
                </div>
                <div className="text-muted-foreground text-xs">
                  {activeWalletType} • {getChainName()}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleCopyAddress}
                disabled={!activeAccount}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => {
                  if (activeAccount) {
                    const explorerUrl = isMetaMaskActive 
                      ? `https://etherscan.io/address/${activeAccount}`
                      : `https://explorer.aptoslabs.com/account/${activeAccount}`;
                    window.open(explorerUrl, '_blank');
                  }
                }}
                disabled={!activeAccount}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Balance */}
            <div className="text-center mb-6">
              <div className="text-4xl font-light text-foreground mb-4">
                {activeBalance 
                  ? `${activeBalance} ${isMetaMaskActive ? 'ETH' : 'APT'}` 
                  : '$0.00'
                }
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button className="flex-1 bg-black/20 hover:bg-black/30 text-foreground border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Buy
                </Button>
                <Button className="flex-1 bg-black/20 hover:bg-black/30 text-foreground border-0">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Receive
                </Button>
                <Button className="flex-1 bg-black/20 hover:bg-black/30 text-foreground border-0">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Assets/History Tabs */}
          <div className="flex border-b border-border">
            <Button variant="ghost" className="flex-1 text-muted-foreground rounded-none py-3">
              Assets
            </Button>
            <Button variant="ghost" className="flex-1 text-foreground border-b-2 border-primary rounded-none py-3">
              History
            </Button>
          </div>

          {/* Transaction History */}
  <div className="p-6 overflow-y-auto max-h-80" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <h3 className="text-foreground font-medium mb-4">Recent Activity</h3>
            
            {/* Show message if no transactions */}
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">No transactions yet</div>
              </div>
            ) : (
              <>
                {/* Today's Transaction */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex -space-x-2">
                    <TokenIcon symbol="POL" size="sm" />
                    <TokenIcon symbol="APT" size="sm" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground rotate-45" />
                      <span className="text-foreground font-medium">Swap</span>
                    </div>
                    <div className="text-muted-foreground text-sm">POL → APT</div>
                  </div>
                  <div className="text-right">
                    <div className="text-success font-medium">+0.253 APT</div>
                    <div className="text-muted-foreground text-sm">-0.1 POL</div>
                  </div>
                </div>

                {/* Other Transactions */}
                {transactions.slice(1).map((tx, index) => (
                  <div key={index} className="flex items-center gap-3 mb-4">
                    <TokenIcon symbol="POL" size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Send className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground font-medium">Send</span>
                      </div>
                      <div className="text-muted-foreground text-sm">Polygon</div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground font-medium">{tx.amount}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;