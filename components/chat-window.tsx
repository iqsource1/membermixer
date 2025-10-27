'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, X, Paperclip, FileText, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { supabase, getSignedUrl, uploadFile } from '@/lib/supabase';
import type { Message } from '@/lib/supabase';

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  otherUserName: string;
  onEndChat: () => void;
}

export function ChatWindow({ chatId, currentUserId, otherUserName, onEndChat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${chatId}`);
        const data = await response.json();
        
        if (response.ok) {
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  // Set up Supabase Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's not from current user (to avoid duplicates from optimistic updates)
          if (newMessage.user_id !== currentUserId) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Check file type (images and PDFs only)
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedFile) || isSending) return;

    const messageText = input.trim();
    setInput('');
    setIsSending(true);
    
    let attachmentPath: string | null = null;

    try {
      // Upload file if present
      if (selectedFile) {
        setIsUploading(true);
        const fileName = `${chatId}/${crypto.randomUUID()}-${selectedFile.name}`;
        attachmentPath = await uploadFile('chat-attachments', fileName, selectedFile);
        setSelectedFile(null);
        setIsUploading(false);
      }

      // Optimistically add message to UI
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        user_id: currentUserId,
        text: messageText || null,
        attachment_path: attachmentPath,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);

      // Send message to API
      const response = await fetch(`/api/messages/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          text: messageText || null,
          attachmentPath,
        }),
      });

      if (!response.ok) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        console.error('Failed to send message');
      } else {
        // Replace temp message with real one
        const { message } = await response.json();
        setMessages((prev) => 
          prev.map((m) => (m.id === tempMessage.id ? message : m))
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h2 className="font-semibold text-lg">{otherUserName}</h2>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEndChat}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center">
            <div>
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Say hi to {otherUserName}! 👋</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.user_id === currentUserId;
            const showTimestamp =
              index === 0 ||
              new Date(message.timestamp).getTime() -
                new Date(messages[index - 1].timestamp).getTime() >
                5 * 60 * 1000; // 5 minutes

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-muted-foreground mb-2">
                    {formatDate(new Date(message.timestamp).getTime())}
                  </div>
                )}
                <div
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.text && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    )}
                    {message.attachment_path && (
                      <AttachmentViewer path={message.attachment_path} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded">
            <FileText className="h-4 w-4" />
            <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending || isUploading}
            className="flex-1"
            autoFocus
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!input.trim() && !selectedFile) || isSending || isUploading}
            size="icon"
          >
            {isSending || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttachmentViewer({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      const signedUrl = await getSignedUrl('chat-attachments', path);
      setUrl(signedUrl);
      setIsLoading(false);
    };
    fetchUrl();
  }, [path]);

  if (isLoading) {
    return <p className="text-xs mt-1">Loading attachment...</p>;
  }

  if (!url) {
    return <p className="text-xs mt-1 text-destructive">Failed to load attachment</p>;
  }

  const isPdf = path.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-background/20 rounded hover:bg-background/30"
      >
        <FileText className="h-4 w-4" />
        <span className="text-xs underline">View PDF</span>
      </a>
    );
  }

  return (
    <img
      src={url}
      alt="Attachment"
      className="max-w-full mt-2 rounded cursor-pointer"
      onClick={() => window.open(url, '_blank')}
    />
  );
}
