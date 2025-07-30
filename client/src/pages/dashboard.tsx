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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.1),transparent_50%)]" />
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-blue-300 hover:text-blue-200">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Landing
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Your Space
              </h1>
              <p className="text-blue-300/80 text-sm">
                {dashboardData?.user.connectionType === 'wallet' ? 'Connected via Wallet' : 'Anonymous Explorer'}
              </p>
            </div>
          </div>
          
          {dashboardData?.lastVisit && (
            <div className="text-right text-sm text-blue-300/60">
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
          {/* Identity Vector Strength */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Coherence</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {calculateVectorStrength(dashboardData?.user.identityVector || [])}%
              </div>
              <p className="text-blue-300/60 text-sm mt-1">
                Current vector strength
              </p>
            </CardContent>
          </Card>

          {/* Growth */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Growth</h3>
              </div>
              <div className="text-3xl font-bold text-green-400">
                +{dashboardData?.growthSinceLast || 0}%
              </div>
              <p className="text-blue-300/60 text-sm mt-1">
                Since last session
              </p>
            </CardContent>
          </Card>

          {/* Mood */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Mood</h3>
              </div>
              <div className="text-xl font-semibold text-purple-400 capitalize">
                {dashboardData?.user.preferredMood || 'contemplative'}
              </div>
              <p className="text-blue-300/60 text-sm mt-1">
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
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <CardContent className="p-6">
                <Button
                  onClick={() => setShowReflectionForm(true)}
                  variant="ghost"
                  className="w-full justify-start text-blue-300/60 hover:text-blue-200"
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
                  className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/40 resize-none min-h-[100px] mb-4"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-300/40">
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
                      className="text-blue-300/60 hover:text-blue-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReflection}
                      disabled={!reflectionContent.trim() || createReflectionMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
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
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Network Whispers</h2>
          <div className="space-y-4">
            {whispersData?.whispers?.map((whisper, index) => (
              <motion.div
                key={whisper.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-6">
                    <p className="text-blue-100 mb-4 leading-relaxed">
                      {whisper.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-300/40">
                        {new Date(whisper.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResonate(whisper.id)}
                        disabled={resonateMutation.isPending}
                        className="text-blue-300/60 hover:text-red-400 transition-colors group"
                      >
                        <Heart className="w-4 h-4 mr-1 group-hover:fill-current" />
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
                  <p className="text-blue-300/60">
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