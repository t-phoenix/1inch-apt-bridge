import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowUpRight, Copy, ExternalLink, Plus, Send, TrendingDown } from "lucide-react";
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
  const walletAddress = "0x4e39...Fc80";
  const balance = "$1.39";
  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-foreground text-xl font-medium">Account</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Wallet Section */}
          <div className="p-6 bg-gradient-to-br from-primary/20 to-purple-500/20">
            {/* Wallet Address */}
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 mb-6">
              <TokenIcon symbol="POL" size="sm" />
              <span className="text-foreground font-medium">{walletAddress}</span>
              <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Balance */}
            <div className="text-center mb-6">
              <div className="text-4xl font-light text-foreground mb-4">{balance}</div>
              
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
            <h3 className="text-foreground font-medium mb-4">Today</h3>
            
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

            <h3 className="text-foreground font-medium mb-4">July 17</h3>
            
            {/* July Transactions */}
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

            {/* Question Transaction */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 font-medium">?</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">Transaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;