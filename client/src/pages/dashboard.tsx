import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

interface DashboardData {
  user: {
    id: number;
    identityVector: number[];
    preferredMood: string;
    connectionType: string;
  };
  growthSinceLast: number;
  networkWhispers: Array<{
    id: number;
    content: string;
    resonanceCount: number;
    createdAt: string;
  }>;
  lastVisit: string | null;
}

interface NetworkWhisper {
  id: number;
  content: string;
  resonanceCount: number;
  createdAt: string;
}

export default function Dashboard() {
  const [userId] = React.useState(1); // In real app, this would come from auth context
  const [reflectionContent, setReflectionContent] = React.useState('');
  const [showReflectionForm, setShowReflectionForm] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', userId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json() as Promise<DashboardData>;
    },
  });

  // Fetch whispers
  const { data: whispersData } = useQuery({
    queryKey: ['/api/whispers'],
    queryFn: async () => {
      const response = await fetch('/api/whispers');
      if (!response.ok) throw new Error('Failed to fetch whispers');
      return response.json() as Promise<{ whispers: NetworkWhisper[] }>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create reflection mutation
  const createReflectionMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content, isAnonymous: true }),
      });
      if (!response.ok) throw new Error('Failed to create reflection');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reflection Shared",
        description: "Your thought has been shared with the network anonymously",
      });
      setReflectionContent('');
      setShowReflectionForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whispers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share reflection",
        variant: "destructive",
      });
    },
  });

  // Resonate with whisper mutation
  const resonateMutation = useMutation({
    mutationFn: async ({ whisperId }: { whisperId: number }) => {
      const response = await fetch(`/api/whispers/${whisperId}/resonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to resonate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whispers'] });
    },
    onError: (error: any) => {
      if (!error.message?.includes('Already resonated')) {
        toast({
          title: "Error",
          description: "Failed to resonate with whisper",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmitReflection = () => {
    if (!reflectionContent.trim()) return;
    createReflectionMutation.mutate(reflectionContent.trim());
  };

  const handleResonate = (whisperId: number) => {
    resonateMutation.mutate({ whisperId });
  };

  const calculateVectorStrength = (vector: number[]) => {
    if (!vector) return 0;
    return Math.round(vector.reduce((sum, val) => sum + val, 0) / vector.length * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-blue-200 text-xl"
        >
          Loading your space...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm" 
                className="border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Landing
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-light text-white tracking-wide">
                Your Space
              </h1>
              <p className="text-white/60 text-sm">
                {dashboardData?.user.connectionType === 'wallet' ? 'Connected via Wallet' : 'Anonymous Explorer'}
              </p>
            </div>
          </div>
          
          {dashboardData?.lastVisit && (
            <div className="text-right text-sm text-white/40">
              Last visit: {new Date(dashboardData.lastVisit).toLocaleDateString()}
            </div>
          )}
        </motion.div>

        {/* Growth Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Coherence */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/8 hover:border-white/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-white/70" />
                <h3 className="text-lg font-light text-white/70">Coherence</h3>
              </div>
              <div className="text-3xl font-light text-white">
                {calculateVectorStrength(dashboardData?.user.identityVector || [])}%
              </div>
              <p className="text-white/50 text-sm mt-1">
                Current vector strength
              </p>
            </CardContent>
          </Card>

          {/* Growth */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/8 hover:border-white/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/70" />
                </div>
                <h3 className="text-lg font-light text-white/70">Growth</h3>
              </div>
              <div className="text-3xl font-light text-white">
                +{dashboardData?.growthSinceLast || 0}%
              </div>
              <p className="text-white/50 text-sm mt-1">
                Since last session
              </p>
            </CardContent>
          </Card>

          {/* Mood */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/8 hover:border-white/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/70" />
                </div>
                <h3 className="text-lg font-light text-white/70">Mood</h3>
              </div>
              <div className="text-xl font-light text-white capitalize">
                {dashboardData?.user.preferredMood || 'contemplative'}
              </div>
              <p className="text-white/50 text-sm mt-1">
                Current preference
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reflection Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {!showReflectionForm ? (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 cursor-pointer hover:bg-white/8 hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <Button
                  onClick={() => setShowReflectionForm(true)}
                  variant="ghost"
                  className="w-full justify-start text-white/40 hover:text-white/70"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share a reflection with the network...
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <Textarea
                  placeholder="What's on your mind? This will be shared anonymously with the network..."
                  value={reflectionContent}
                  onChange={(e) => setReflectionContent(e.target.value)}
                  className="bg-transparent border-white/20 text-white placeholder:text-white/40 resize-none min-h-[100px] mb-4 font-serif"
                  maxLength={500}
                  style={{ fontFamily: 'Georgia, serif' }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">
                    {reflectionContent.length}/500 characters
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowReflectionForm(false);
                        setReflectionContent('');
                      }}
                      className="border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReflection}
                      disabled={!reflectionContent.trim() || createReflectionMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                    >
                      {createReflectionMutation.isPending ? 'Sharing...' : 'Share'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Network Whispers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-light mb-4 text-white/80">Network Whispers</h2>
          <div className="space-y-4">
            {whispersData?.whispers?.map((whisper, index) => (
              <motion.div
                key={whisper.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/8 hover:border-white/20 transition-all">
                  <CardContent className="p-6">
                    <p className="text-white/90 mb-4 leading-relaxed font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                      {whisper.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">
                        {new Date(whisper.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResonate(whisper.id)}
                        disabled={resonateMutation.isPending}
                        className="text-blue-400 hover:text-blue-300 transition-colors group flex items-center gap-1 p-2 rounded-md hover:bg-blue-400/10"
                      >
                        <img
                          src="/heart.png"
                          alt="Resonate"
                          width={20}
                          height={20}
                          className="transition-all group-hover:scale-110"
                        />
                        {whisper.resonanceCount}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {(!whispersData?.whispers || whispersData.whispers.length === 0) && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-8 text-center">
                  <p className="text-white/60 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                    The network is quiet right now. Share the first whisper?
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}