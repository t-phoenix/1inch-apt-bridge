import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePetraWallet } from "@/contexts/PetraWalletContext";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

interface DualWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🔥 DUAL WALLET CONNECTION MODAL
 * Supports both MetaMask (Ethereum/Polygon) and Petra (Aptos)
 */
export function DualWalletModal({ isOpen, onClose }: DualWalletModalProps) {
  const { 
    connectWallet: connectMetaMask, 
    isConnecting: isMetaMaskConnecting,
    isConnected: isMetaMaskConnected 
  } = useWallet();
  
  const { 
    connectWallet: connectPetra, 
    isConnecting: isPetraConnecting,
    isConnected: isPetraConnected 
  } = usePetraWallet();

  const handleMetaMaskConnect = async () => {
    try {
      await connectMetaMask('metamask');
      onClose();
    } catch (error: any) {
      toast.error('MetaMask connection failed', {
        description: error.message
      });
    }
  };

  const handlePetraConnect = async () => {
    try {
      await connectPetra();
      onClose();
    } catch (error: any) {
      toast.error('Petra connection failed', {
        description: error.message
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">🔗 Connect Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Connect your wallet to start swapping between chains
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ethereum" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ethereum" className="text-sm">
              🔷 Ethereum/Polygon
            </TabsTrigger>
            <TabsTrigger value="aptos" className="text-sm">
              🅰️ Aptos
            </TabsTrigger>
          </TabsList>

          {/* ETHEREUM/POLYGON WALLETS */}
          <TabsContent value="ethereum" className="space-y-4 mt-6">
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Connect to Ethereum or Polygon networks
              </div>
              
              <Button
                variant="outline"
                className="w-full justify-between h-14 px-4"
                onClick={handleMetaMaskConnect}
                disabled={isMetaMaskConnecting || isMetaMaskConnected}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    🦊
                  </div>
                  <div className="text-left">
                    <div className="font-medium">MetaMask</div>
                    <div className="text-sm text-muted-foreground">
                      Popular Ethereum wallet
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isMetaMaskConnected && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      ✅ Connected
                    </Badge>
                  )}
                  {isMetaMaskConnecting && (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </Button>

              {/* Other Ethereum wallets - placeholder for future */}
              <Button
                variant="outline"
                className="w-full justify-between h-14 px-4 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    🔗
                  </div>
                  <div className="text-left">
                    <div className="font-medium">WalletConnect</div>
                    <div className="text-sm text-muted-foreground">
                      Coming soon
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">Soon</Badge>
              </Button>
            </div>
          </TabsContent>

          {/* APTOS WALLETS */}
          <TabsContent value="aptos" className="space-y-4 mt-6">
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Connect to Aptos blockchain
              </div>
              
              <Button
                variant="outline"
                className="w-full justify-between h-14 px-4"
                onClick={handlePetraConnect}
                disabled={isPetraConnecting || isPetraConnected}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    🅰️
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Petra Wallet</div>
                    <div className="text-sm text-muted-foreground">
                      Official Aptos wallet
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isPetraConnected && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      ✅ Connected
                    </Badge>
                  )}
                  {isPetraConnecting && (
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </Button>

              {/* Other Aptos wallets - placeholder for future */}
              <Button
                variant="outline"
                className="w-full justify-between h-14 px-4 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    🔮
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Martian Wallet</div>
                    <div className="text-sm text-muted-foreground">
                      Coming soon
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">Soon</Badge>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            🔐 Your keys, your crypto. We never store your private keys.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DualWalletModal;