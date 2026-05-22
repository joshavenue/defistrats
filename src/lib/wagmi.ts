import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, polygon, optimism, base } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, polygon, optimism, base],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: 'your-project-id' // You'll need to get this from WalletConnect
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
})