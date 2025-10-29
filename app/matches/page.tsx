'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/hooks/use-whop-mock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';
import { getRemainingMatches } from '@/lib/matching';

export default function MatchesPage() {
  const { user, loading } = useWhop();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
  const [queueId, setQueueId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchProfile();
      checkActiveChat();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        // No profile yet, redirect to profile creation
        router.push('/profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const checkActiveChat = async () => {
    try {
      const response = await fetch(`/api/profile?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        // Check if user has active chat in KV
        // For now, we'll rely on the match flow
      }
    } catch (error) {
      console.error('Failed to check active chat:', error);
    }
  };

  // Poll queue status when waiting
  useEffect(() => {
    if (queueStatus !== 'waiting' || !user?.id) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/match/queue?userId=${user.id}&queueId=${queueId}`);
        const data = await response.json();

        if (data.status === 'matched' && data.match) {
          setQueueStatus('matched');
          setMatch(data.match);
          setActiveChat(data.match.chatId);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Queue poll error:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [queueStatus, user?.id, queueId]);

  const handleFindMatch = async () => {
    if (!user?.id) return;

    setQueueStatus('waiting');

    try {
      const response = await fetch('/api/match/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error);
        setQueueStatus('idle');
        return;
      }

      setQueueId(data.queueId);

      if (data.status === 'matched') {
        setQueueStatus('matched');
        setMatch(data.match);
        setActiveChat(data.match.chatId);
      } else {
        setQueueStatus('waiting');
      }
    } catch (error) {
      console.error('Match error:', error);
      setQueueStatus('idle');
    }
  };

  const handleCancelQueue = async () => {
    if (!user?.id) return;

    try {
      await fetch(`/api/match/queue?userId=${user.id}`, {
        method: 'DELETE',
      });
      setQueueStatus('idle');
      setQueueId(null);
    } catch (error) {
      console.error('Cancel queue error:', error);
    }
  };

  const handleMatchFound = (matchData: any) => {
    setMatch(matchData.match);
    setActiveChat(matchData.chatId);
  };

  const handleStartChat = () => {
    if (activeChat) {
      router.push(`/chat/${activeChat}`);
    }
  };

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const remainingMatches = profile ? getRemainingMatches(profile) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        {!match ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-purple-600" />
                Find Your Match
              </CardTitle>
              <CardDescription>
                Connect with someone who shares your interests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile && (
                <div>
                  <h3 className="font-semibold mb-2">Your Interests</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.interests.map((interest: string) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <Link href="/profile">
                    <Button variant="link" className="px-0">
                      Edit profile
                    </Button>
                  </Link>
                </div>
              )}

              <div className="border-t pt-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Remaining matches:{' '}
                    <span className="font-semibold text-foreground">
                      {remainingMatches === 'unlimited' ? '∞ Unlimited' : remainingMatches}
                    </span>
                  </p>
                </div>

                {queueStatus === 'idle' && (
                  <Button
                    onClick={handleFindMatch}
                    disabled={!profile}
                    size="lg"
                    className="w-full"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Find a Match
                  </Button>
                )}

                {queueStatus === 'waiting' && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <h3 className="text-lg font-semibold mb-2">Finding your match...</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We're searching for someone with shared interests
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span>Looking for compatible users</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleCancelQueue}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel Search
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Heart className="h-8 w-8 text-red-500" />
                Match Found!
              </CardTitle>
              <CardDescription>
                You've been matched with someone special
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{match.name}</h3>
                {match.bio && (
                  <p className="text-muted-foreground mb-4">{match.bio}</p>
                )}
                
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">
                    Compatibility: {match.compatibilityScore}%
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Shared interests:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {match.sharedInterests.map((interest: string) => (
                      <Badge key={interest} variant="default">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleStartChat} size="lg" className="w-full">
                Start Chatting
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

