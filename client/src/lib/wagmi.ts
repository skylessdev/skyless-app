import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8e14440210757c077abf3cefc6f38b5e';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected({
      target: 'metaMask'
    }),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Skyless',
        description: 'Connect to the network',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://skyless.app',
        icons: []
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
