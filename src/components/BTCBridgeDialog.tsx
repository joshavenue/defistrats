
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BTCBridgeDialogProps {
  children: React.ReactNode;
}

export const BTCBridgeDialog: React.FC<BTCBridgeDialogProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[80vh] bg-[#0C0E12] border-[#22262F]">
        <DialogHeader>
          <DialogTitle className="text-[#F7F7F7]">BTC Bridge</DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full h-full min-h-[600px]">
          {/* The widget will render here automatically via the global script */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
