import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, Shield, Smartphone, Wallet } from "lucide-react";

interface WalletConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletConnect: (walletType: string) => void;
}

const WalletConnectionModal = ({ open, onOpenChange, onWalletConnect }: WalletConnectionModalProps) => {
  const walletOptions = [
    {
      name: "MetaMask",
      icon: Wallet,
      description: "Connect using browser extension",
      color: "from-orange-500 to-yellow-500"
    },
    {
      name: "WalletConnect",
      icon: Smartphone,
      description: "Connect using WalletConnect",
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "Coinbase Wallet",
      icon: Globe,
      description: "Connect using Coinbase",
      color: "from-blue-600 to-blue-700"
    },
    {
      name: "Trust Wallet",
      icon: Shield,
      description: "Connect using Trust Wallet",
      color: "from-blue-400 to-blue-500"
    }
  ];

  const handleWalletSelect = (walletName: string) => {
    onWalletConnect(walletName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-foreground text-xl font-medium">Connect a wallet</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {walletOptions.map((wallet) => {
            const Icon = wallet.icon;
            return (
              <Button
                key={wallet.name}
                variant="ghost"
                onClick={() => handleWalletSelect(wallet.name)}
                className="w-full justify-start h-auto p-4 hover:bg-secondary/80 border border-border/50 hover:border-border"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${wallet.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{wallet.name}</div>
                    <div className="text-sm text-muted-foreground">{wallet.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          New to Ethereum wallets?{" "}
          <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
            Learn more about wallets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectionModal;