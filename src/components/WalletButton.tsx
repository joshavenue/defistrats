import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export const WalletButton: React.FC = () => {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  if (!ready) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={login}
        className="bg-[#22262F] text-[#F7F7F7] border-[#373A41] hover:bg-[#2A2F3A] hover:text-[#75E0A7] transition-colors"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  // Get the primary wallet
  const primaryWallet = wallets[0];
  const walletAddress = primaryWallet?.address;
  const displayAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'No Wallet';

  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col items-end">
        <span className="text-[#CECFD2] text-xs">
          {user?.email?.address || 'Connected'}
        </span>
        <span className="text-[#75E0A7] text-sm font-mono">
          {displayAddress}
        </span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={logout}
        className="bg-[#22262F] text-[#F7F7F7] border-[#373A41] hover:bg-[#2A2F3A] transition-colors"
      >
        Disconnect
      </Button>
    </div>
  );
};