import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { injected } from 'wagmi/connectors';
import { detectWallet } from '@/lib/wallet-utils';

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await apiRequest('POST', '/api/connect-wallet', {
        walletAddress,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Wallet registration successful:', data);
      
      // Store user ID for dashboard access
      localStorage.setItem('skyless_user_id', data.user_id.toString());
      
      toast({
        title: "Wallet Connected",
        description: `${data.wallet_address.slice(0, 6)}...${data.wallet_address.slice(-4)}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Direct redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
      });
    },
  });

  const handleConnect = async () => {
    try {
      console.log('Attempting to connect wallet...');
      
      // Detect available wallet
      const walletInfo = detectWallet();
      
      if (!walletInfo.isAvailable) {
        toast({
          variant: "destructive",
          title: "No Wallet Found", 
          description: "Please install MetaMask or another wallet extension to continue",
        });
        return;
      }
      
      console.log(`Detected wallet: ${walletInfo.name}`);
      
      // Try to connect with the injected provider
      const connector = injected();
      console.log('Connector created:', connector);
      await connect({ connector });
      console.log('Connect called successfully');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // Better error handling based on error type
      let errorMessage = "Please try again";
      if (error.message?.includes('User rejected') || error.code === 4001) {
        errorMessage = "Connection was cancelled. Please try again when ready.";
      } else if (error.message?.includes('No provider') || error.message?.includes('provider')) {
        errorMessage = "Please install MetaMask or another wallet extension";
      } else if (error.message?.includes('already pending')) {
        errorMessage = "Connection already in progress. Please check your wallet.";
      }
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Auto-register wallet when connected (only once)
  const [hasRegistered, setHasRegistered] = React.useState(false);
  
  React.useEffect(() => {
    if (isConnected && address && !connectWalletMutation.isPending && !hasRegistered) {
      console.log('Auto-registering wallet:', address);
      connectWalletMutation.mutate(address);
      setHasRegistered(true);
    }
    if (!isConnected) {
      setHasRegistered(false);
    }
  }, [isConnected, address, connectWalletMutation.isPending, hasRegistered]);

  return {
    address,
    isConnected,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isRegistering: connectWalletMutation.isPending,
  };
}
