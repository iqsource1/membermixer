-- Complete Supabase Setup for Member Mixer
-- Run this entire file in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  avatar_path TEXT,
  matches_used INTEGER DEFAULT 0,
  has_unlimited_matches BOOLEAN DEFAULT false,
  active_subscription BOOLEAN DEFAULT false,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  text TEXT,
  attachment_path TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create match_queue table
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  matched_with TEXT,
  match_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chats_user_ids ON chats USING GIN(user_ids);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_queue_status ON match_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON match_queue(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (allow all for now - using mock auth)
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON profiles FOR UPDATE TO public USING (true);

-- RLS Policies for chats (allow all for now)
CREATE POLICY "Anyone can view chats" ON chats FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert chats" ON chats FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update chats" ON chats FOR UPDATE TO public USING (true);

-- RLS Policies for messages (allow all for now)
CREATE POLICY "Anyone can view messages" ON messages FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert messages" ON messages FOR INSERT TO public WITH CHECK (true);

-- RLS Policies for match_queue (allow all for now)
CREATE POLICY "Anyone can view queue" ON match_queue FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert to queue" ON match_queue FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update queue" ON match_queue FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete from queue" ON match_queue FOR DELETE TO public USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (allow all for now)
CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload attachments" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'chat-attachments');
CREATE POLICY "Anyone can view attachments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat-attachments');

COMMENT ON TABLE profiles IS 'User profiles with interests and match history';
COMMENT ON TABLE chats IS '1:1 chat sessions between matched users';
COMMENT ON TABLE messages IS 'Messages within chats';
COMMENT ON TABLE match_queue IS 'Queue system for asynchronous user matching';

