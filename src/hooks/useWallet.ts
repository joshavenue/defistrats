import { usePrivy, useWallets } from '@privy-io/react-auth';

export const useWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Get the primary wallet (first connected wallet)
  const primaryWallet = wallets[0];
  const walletAddress = primaryWallet?.address;
  
  // Format address for display
  const displayAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  // Get wallet type/connector info
  const walletType = primaryWallet?.walletClientType;
  const connectorType = primaryWallet?.connectorType;

  return {
    // Connection state
    ready,
    authenticated,
    isConnected: authenticated && walletAddress,
    
    // User info
    user,
    email: user?.email?.address,
    
    // Wallet info
    walletAddress,
    displayAddress,
    walletType,
    connectorType,
    wallets,
    primaryWallet,
    
    // Actions
    connect: login,
    disconnect: logout,
  };
};