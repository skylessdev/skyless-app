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
      connect({ connector: injected() });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Please make sure you have a wallet installed",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Auto-register wallet when connected
  React.useEffect(() => {
    if (isConnected && address && !connectWalletMutation.isPending) {
      connectWalletMutation.mutate(address);
    }
  }, [isConnected, address]);

  return {
    address,
    isConnected,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isRegistering: connectWalletMutation.isPending,
  };
}
