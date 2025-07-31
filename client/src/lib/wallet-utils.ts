/**
 * Wallet detection and utility functions
 */

export interface WalletInfo {
  isAvailable: boolean;
  provider: any;
  name: string;
  type: 'metamask' | 'coinbase' | 'injected' | 'none';
}

export function detectWallet(): WalletInfo {
  if (typeof window === 'undefined') {
    return { isAvailable: false, provider: null, name: 'None', type: 'none' };
  }

  // Check for MetaMask specifically
  if (window.ethereum?.isMetaMask) {
    return {
      isAvailable: true,
      provider: window.ethereum,
      name: 'MetaMask',
      type: 'metamask'
    };
  }

  // Check for Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    return {
      isAvailable: true,
      provider: window.ethereum,
      name: 'Coinbase Wallet',
      type: 'coinbase'
    };
  }

  // Check for any injected provider
  if (window.ethereum) {
    return {
      isAvailable: true,
      provider: window.ethereum,
      name: 'Web3 Wallet',
      type: 'injected'
    };
  }

  return { isAvailable: false, provider: null, name: 'None', type: 'none' };
}

export function getWalletInstallUrl(walletType: string = 'metamask'): string {
  const urls = {
    metamask: 'https://metamask.io/download/',
    coinbase: 'https://www.coinbase.com/wallet/downloads',
    rainbow: 'https://rainbow.me/download',
    trust: 'https://trustwallet.com/download'
  };
  
  return urls[walletType as keyof typeof urls] || urls.metamask;
}

// Extend Window type for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}