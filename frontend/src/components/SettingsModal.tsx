import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [selectedSlippage, setSelectedSlippage] = useState("Auto");

  const slippageOptions = [
    { label: "Auto", value: "Auto" },
    { label: "0.1%", value: "0.1" },
    { label: "0.5%", value: "0.5" },
    { label: "1%", value: "1" },
    { label: "Custom", value: "Custom" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md">
        <DialogHeader className="flex-row items-center gap-4 space-y-0 pb-4">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-foreground text-lg font-medium">Swap settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Slippage Tolerance */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                <div className="w-3 h-0.5 bg-primary rounded"></div>
                <div className="w-3 h-0.5 bg-primary rounded ml-0.5"></div>
              </div>
              <span className="text-foreground font-medium">Slippage tolerance</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{selectedSlippage}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>
            </div>

            {/* Slippage Options */}
            <div className="flex gap-2">
              {slippageOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedSlippage === option.value ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedSlippage(option.value)}
                  className={`px-4 py-2 ${
                    selectedSlippage === option.value 
                      ? "bg-secondary text-foreground" 
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Tokens */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full border border-primary"></div>
              </div>
              <span className="text-foreground font-medium">Custom tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">0</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="text-center pt-8 pb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground mb-3">For extended settings</p>
            <Button variant="link" className="text-primary hover:text-primary/80 p-0">
              Open advanced mode
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;