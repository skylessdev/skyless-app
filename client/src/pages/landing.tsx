import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Wallet, Mail, EyeOff, Loader2, CheckCircle } from 'lucide-react';

import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { apiRequest } from '@/lib/queryClient';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

type ViewState = 'landing' | 'options' | 'email' | 'connected' | 'success';

export default function Landing() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const { toast } = useToast();
  const { address, isConnected, isConnecting, connect, isRegistering } = useWallet();

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await apiRequest('POST', '/api/signup-email', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Registered",
        description: "Successfully signed up with email",
      });
      setCurrentView('success');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to register email",
      });
    },
  });

  const anonymousMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/anonymous-session', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Anonymous Session",
        description: "Successfully created anonymous session",
      });
      setCurrentView('success');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to create anonymous session",
      });
    },
  });

  const handleEnter = () => {
    setCurrentView('options');
  };

  const handleConnectWallet = () => {
    console.log('Wallet connect button clicked');
    console.log('useWallet connect function:', connect);
    connect();
  };

  const handleEmailSubmit = (data: EmailFormData) => {
    emailMutation.mutate(data);
  };

  const handleExploreAnonymously = () => {
    anonymousMutation.mutate();
  };

  const handleBackToOptions = () => {
    setCurrentView('options');
  };

  // Auto-update view when wallet connects
  React.useEffect(() => {
    if (isConnected && address && !isRegistering) {
      console.log('Wallet connected, updating view to connected state');
      setCurrentView('connected');
    }
  }, [isConnected, address, isRegistering]);

  return (
    <div className="min-h-screen bg-dark-bg text-white font-inter overflow-x-hidden">
      {/* Mobile Status Bar */}
      <div className="block sm:hidden px-6 py-2 text-sm font-medium">
        <div className="flex justify-between items-center">
          <span>9:41</span>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white rounded-full"></div>
            </div>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"></path>
            </svg>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-4 h-1 bg-white rounded-sm mx-auto mt-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-8 text-center"
      >
        <h1 className="text-lg font-light tracking-wide text-white/90" style={{ fontFamily: 'Georgia, serif' }}>skyless</h1>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 space-y-8">
        <AnimatePresence mode="wait">
          {currentView === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center space-y-8"
            >
              <Logo />
              <Button
                onClick={handleEnter}
                className="glass-button px-12 py-3 rounded-full text-base font-medium tracking-wide"
              >
                enter
              </Button>
            </motion.div>
          )}

          {currentView === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-sm space-y-4"
            >
              <h2 className="text-xl font-light text-center mb-8 tracking-wide">
                connect to the network
              </h2>
              
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting || isRegistering}
                className="glass-button w-full py-4 rounded-2xl text-base font-medium tracking-wide"
              >
                {(isConnecting || isRegistering) ? (
                  <span className="flex items-center justify-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>connecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-3">
                    <Wallet className="w-5 h-5" />
                    <span>connect wallet</span>
                  </span>
                )}
              </Button>
              
              {/* Wallet installation prompt */}
              <div className="text-xs text-white/50 text-center mt-2">
                Need a wallet? Install{' '}
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 underline hover:text-white transition-colors"
                >
                  MetaMask
                </a>
              </div>

              <Button
                onClick={() => setCurrentView('email')}
                className="glass-button w-full py-4 rounded-2xl text-base font-medium tracking-wide"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Mail className="w-5 h-5" />
                  <span>sign in with email</span>
                </span>
              </Button>

              <Button
                onClick={handleExploreAnonymously}
                disabled={anonymousMutation.isPending}
                className="glass-button w-full py-4 rounded-2xl text-base font-medium tracking-wide"
              >
                {anonymousMutation.isPending ? (
                  <span className="flex items-center justify-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>connecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-3">
                    <EyeOff className="w-5 h-5" />
                    <span>explore anonymously</span>
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {currentView === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-light mb-2 tracking-wide">sign in with email</h2>
                <p className="text-sm text-white/60">Enter your email to connect to the network</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your@email.com"
                            className="glass-morphism w-full px-4 py-4 rounded-2xl bg-transparent text-white placeholder:text-white/40 border-white/10 focus:border-white/25"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    disabled={emailMutation.isPending}
                    className="glass-button w-full py-4 rounded-2xl text-base font-medium tracking-wide"
                  >
                    {emailMutation.isPending ? (
                      <span className="flex items-center justify-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>connecting...</span>
                      </span>
                    ) : (
                      'continue'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleBackToOptions}
                    variant="ghost"
                    className="w-full py-2 text-white/60 hover:text-white transition-colors text-sm"
                  >
                    ← back
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}

          {currentView === 'connected' && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-sm"
            >
              <div className="glass-morphism p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-medium">Wallet Connected</h3>
                <p className="text-sm text-white/60 font-mono break-all">
                  {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
                <Button
                  onClick={() => setCurrentView('success')}
                  className="glass-button w-full py-3 rounded-2xl text-base font-medium tracking-wide"
                >
                  enter app
                </Button>
              </div>
            </motion.div>
          )}

          {currentView === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-light text-white">Welcome to skyless</h1>
              <p className="text-white/60">Connection successful. Redirecting to app...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="px-6 py-6 pb-safe"
      >
        <div className="flex justify-center space-x-8 text-white/60">
          <a href="/docs" className="hover:text-white transition-colors text-base tracking-wide">
            docs
          </a>
          <a href="https://github.com/skyless" className="hover:text-white transition-colors text-base tracking-wide">
            github
          </a>
          <a href="/xmtp" className="hover:text-white transition-colors text-base tracking-wide">
            xmtp
          </a>
        </div>
      </motion.footer>
    </div>
  );
}
