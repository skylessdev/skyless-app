import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { injected } from 'wagmi/connectors';

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
      toast({
        title: "Wallet Connected",
        description: `${data.user.walletAddress.slice(0, 6)}...${data.user.walletAddress.slice(-4)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
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
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && !window.ethereum) {
        toast({
          variant: "destructive",
          title: "No Wallet Found",
          description: "Please install MetaMask or another wallet extension",
        });
        return;
      }
      
      const connector = injected({ target: 'metaMask' });
      console.log('Connector created:', connector);
      await connect({ connector });
      console.log('Connect called successfully');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Please make sure you have MetaMask installed and try again",
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
