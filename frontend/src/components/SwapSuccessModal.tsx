import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, X } from "lucide-react";
import TokenIcon from "./TokenIcon";

interface SwapSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  transactionHash?: string;
}

const SwapSuccessModal = ({ 
  open, 
  onOpenChange, 
  fromToken, 
  toToken, 
  fromAmount, 
  toAmount,
  transactionHash = "0x742d35...8c6e"
}: SwapSuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md">
        <div className="text-center py-6">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-semibold text-foreground mb-2">Swap Successful!</h2>
          <p className="text-muted-foreground mb-6">Your transaction has been executed</p>

          {/* Transaction Details */}
          <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">You paid</span>
              <div className="flex items-center gap-2">
                <TokenIcon symbol={fromToken} size="sm" />
                <span className="font-medium text-foreground">{fromAmount} {fromToken}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">You received</span>
              <div className="flex items-center gap-2">
                <TokenIcon symbol={toToken} size="sm" />
                <span className="font-medium text-success">{toAmount} {toToken}</span>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 mb-6">
            <span className="text-muted-foreground text-sm">Transaction</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm font-mono">{transactionHash}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => onOpenChange(false)}
            >
              Make another swap
            </Button>
          </div>
        </div>

        {/* Close button - REMOVED DUPLICATE */}
      </DialogContent>
    </Dialog>
  );
};

export default SwapSuccessModal;