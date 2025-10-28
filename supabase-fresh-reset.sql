-- =====================================================
-- FRESH SUPABASE RESET - Run this to start clean
-- =====================================================

-- DROP ALL TABLES IN CORRECT ORDER (respecting foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS match_queue CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- DROP STORAGE BUCKETS
DELETE FROM storage.buckets WHERE id IN ('avatars', 'chat-attachments');

-- NOW CREATE EVERYTHING FRESH

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_path TEXT,
  matches_used INT DEFAULT 0,
  has_unlimited_matches BOOLEAN DEFAULT FALSE,
  active_subscription BOOLEAN DEFAULT FALSE,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - ALLOW EVERYTHING for now (we'll secure later)
CREATE POLICY "Allow all operations on profiles"
  ON profiles FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. CHATS TABLE
-- =====================================================
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_chats_user_ids ON chats USING GIN (user_ids);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on chats"
  ON chats FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  text TEXT,
  attachment_path TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on messages"
  ON messages FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. MATCH_QUEUE TABLE
-- =====================================================
CREATE TABLE match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  matched_with TEXT,
  match_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

CREATE INDEX idx_queue_status ON match_queue(status);
CREATE INDEX idx_queue_user_id ON match_queue(user_id);
CREATE INDEX idx_queue_created_at ON match_queue(created_at DESC);

ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on match_queue"
  ON match_queue FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
  END LOOP;
END $$;

-- Create ONE simple public policy for ALL storage operations
CREATE POLICY "public-access-all"
  ON storage.objects
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- DONE!
-- =====================================================
-- Your database is now fresh and ready to use!
-- All tables have open RLS policies (we'll secure later)

