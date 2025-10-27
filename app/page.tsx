import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, MessageCircle, Users, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center">
            <Sparkles className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Member Mixer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with your community through intelligent 1:1 text chats. 
            Find matches based on shared interests and start meaningful conversations.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/profile">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/matches">
              <Button size="lg" variant="outline" className="text-lg">
                Find Matches
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Smart Matching</CardTitle>
              <CardDescription>
                Our algorithm finds the best matches based on your interests and compatibility
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Real-time Chat</CardTitle>
              <CardDescription>
                Instant messaging with typing indicators and seamless synchronization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-yellow-600 mb-2" />
              <CardTitle>Easy to Use</CardTitle>
              <CardDescription>
                Set up your profile, find a match, and start chatting in minutes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Pricing */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">$0</div>
                <ul className="space-y-2 text-sm">
                  <li>✓ 5 matches per month</li>
                  <li>✓ Real-time messaging</li>
                  <li>✓ Smart matching algorithm</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-600 border-2">
              <CardHeader>
                <CardTitle>Per Match</CardTitle>
                <CardDescription>Pay as you go</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">$1</div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Single match</li>
                  <li>✓ No commitment</li>
                  <li>✓ All features included</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unlimited</CardTitle>
                <CardDescription>Best value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">$19/mo</div>
                <ul className="space-y-2 text-sm">
                  <li>✓ Unlimited matches</li>
                  <li>✓ Priority matching</li>
                  <li>✓ All features included</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Built with ❤️ for Whop communities</p>
        </div>
      </div>
    </div>
  );
}

