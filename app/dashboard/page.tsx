'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/hooks/use-whop-mock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, MessageCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getRemainingMatches } from '@/lib/matching';

export default function DashboardPage() {
  const { user, loading } = useWhop();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Profile not found</p>
        <Link href="/profile">
          <Button>Create Profile</Button>
        </Link>
      </div>
    );
  }

  const remainingMatches = getRemainingMatches(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.name}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.matchesUsed}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {remainingMatches === 'unlimited' ? '∞' : remainingMatches}
              </div>
              <p className="text-xs text-muted-foreground">
                {remainingMatches === 'unlimited' ? 'Unlimited plan' : 'Matches left'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile.activeSubscription ? 'Premium' : 'Free'}
              </div>
              <p className="text-xs text-muted-foreground">
                Current plan
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Name</p>
                <p className="text-sm text-muted-foreground">{profile.name}</p>
              </div>
              
              {profile.bio && (
                <div>
                  <p className="text-sm font-semibold mb-2">Bio</p>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your next match</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/matches">
                <Button className="w-full" size="lg">
                  Find New Match
                </Button>
              </Link>

              {!profile.activeSubscription && (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold">Upgrade to Premium</p>
                  <p className="text-xs text-muted-foreground">
                    Get unlimited matches for $19/month
                  </p>
                  <Button variant="secondary" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center">
                <p>
                  Member since{' '}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

