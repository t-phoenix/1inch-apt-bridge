import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, ArrowDown, ExternalLink, RefreshCw } from "lucide-react";
import TokenIcon from "./TokenIcon";

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransactionDetailModal = ({ open, onOpenChange }: TransactionDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-foreground text-lg font-medium">Swap</h2>
              <p className="text-muted-foreground text-sm">Sep 26 2025 22:38</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-success text-sm font-medium">Executed</span>
          </div>
        </div>

        <div className="p-4">
          {/* From Token */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TokenIcon symbol="USDC" />
              <div>
                <div className="font-medium text-foreground">USDC</div>
                <div className="text-muted-foreground text-sm">on Base</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-foreground">-0.1</div>
              <div className="text-muted-foreground text-sm">~$0.1</div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* To Token */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TokenIcon symbol="POL" />
              <div>
                <div className="font-medium text-foreground">POL</div>
                <div className="text-muted-foreground text-sm">on Polygon</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-success">+0.2533</div>
              <div className="text-muted-foreground text-sm">~$0.06</div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Wallet</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm">0x4e39...fc80</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">1 POL</span>
              <span className="text-foreground text-sm">$0.4 0.3952 USDC</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">1 USDC</span>
              <span className="text-foreground text-sm">$0.56 2.5303 POL</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Executed</span>
              <span className="text-foreground text-sm">Sep 26 2025 22:41</span>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-secondary rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Filled</span>
              <span className="text-muted-foreground">Sold, USDC</span>
              <span className="text-muted-foreground">Price, POL</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="text-success font-medium">100%</div>
                <div className="text-muted-foreground">$0.06</div>
              </div>
              <div className="flex items-center gap-2">
                <TokenIcon symbol="USDC" size="sm" />
                <span className="text-foreground">0.1</span>
                <span className="text-muted-foreground">$0.1</span>
              </div>
              <div className="text-foreground">2.5303</div>
              <span className="text-muted-foreground">$0.56</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;