'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWhop } from '@/hooks/use-whop-mock';
import { ChatWindow } from '@/components/chat-window';
import { Button } from '@/components/ui/button';
import { getOtherUserId } from '@/lib/utils';

export default function ChatPage() {
  const { user, loading } = useWhop();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [chat, setChat] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user && chatId) {
      fetchChatDetails();
    }
  }, [user, loading, chatId]);

  const fetchChatDetails = async () => {
    try {
      // Get chat details to find other user
      const chatResponse = await fetch(`/api/messages/${chatId}`);
      if (!chatResponse.ok) {
        router.push('/matches');
        return;
      }

      // Get other user's profile
      const otherUserId = getOtherUserId(chatId, user!.id);
      const profileResponse = await fetch(`/api/profile?userId=${otherUserId}`);
      
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setOtherUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch chat details:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleEndChat = async () => {
    const confirmed = confirm('Are you sure you want to end this chat? You can find a new match after ending.');
    
    if (!confirmed) return;

    try {
      const response = await fetch('/api/chat/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          chatId,
        }),
      });

      if (response.ok) {
        router.push('/matches');
      }
    } catch (error) {
      console.error('Failed to end chat:', error);
      alert('Failed to end chat. Please try again.');
    }
  };

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!user || !otherUserProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Chat not found</p>
        <Button onClick={() => router.push('/matches')}>
          Back to Matches
        </Button>
      </div>
    );
  }

  return (
    <ChatWindow
      chatId={chatId}
      currentUserId={user.id}
      otherUserName={otherUserProfile.name}
      onEndChat={handleEndChat}
    />
  );
}

