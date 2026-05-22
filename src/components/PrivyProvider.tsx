import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

interface PrivyWrapperProps {
  children: React.ReactNode;
}

export const PrivyWrapper: React.FC<PrivyWrapperProps> = ({ children }) => {
  return (
    <PrivyProvider
      appId="cmfno7p7z00nfjs0bm8bi8sd0"
      config={{
        // Display email and wallet as login methods
        loginMethods: ['email', 'wallet'],
        // Customize appearance
        appearance: {
          theme: 'dark',
          accentColor: '#75E0A7',
          logo: '/assets/f221d606-a350-4353-a6d2-92dd3106c53e.png',
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};