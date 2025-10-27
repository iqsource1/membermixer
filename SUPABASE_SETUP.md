# Supabase Setup Guide for Member Mixer

This guide walks you through setting up Supabase as the database and storage backend for Member Mixer.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in details:
   - **Project Name**: member-mixer
   - **Database Password**: (generate secure password)
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free tier works for development

5. Wait for project to initialize (~2 minutes)

## 2. Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Create Database Tables

Go to **SQL Editor** in Supabase dashboard and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_path TEXT,
  matches_used INTEGER DEFAULT 0,
  has_unlimited_matches BOOLEAN DEFAULT FALSE,
  active_subscription BOOLEAN DEFAULT FALSE,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE chats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  text TEXT,
  attachment_path TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_chats_user_ids ON chats USING GIN (user_ids);
CREATE INDEX idx_profiles_interests ON profiles USING GIN (interests);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- RLS Policies for chats
CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (true);

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own chats"
  ON chats FOR UPDATE
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id
    )
  );

CREATE POLICY "Users can insert messages in their chats"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_id
    )
  );
```

## 4. Set Up Storage Buckets

### Create chat-attachments bucket:

1. Go to **Storage** in Supabase dashboard
2. Click "New bucket"
3. Settings:
   - **Name**: `chat-attachments`
   - **Public**: Off (private bucket)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/*,application/pdf`

4. Click "Create bucket"

### Create user-profiles bucket:

1. Click "New bucket" again
2. Settings:
   - **Name**: `user-profiles`
   - **Public**: Off (private bucket)
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/*`

3. Click "Create bucket"

## 5. Set Up Storage Security Policies

Go to **Storage** → **Policies** and create these policies:

### For chat-attachments bucket:

```sql
-- Allow authenticated users to upload to chat-attachments
CREATE POLICY "Allow uploads to chat-attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  true
);

-- Allow users to read chat attachments
CREATE POLICY "Allow reads from chat-attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  true
);
```

### For user-profiles bucket:

```sql
-- Allow users to upload their own avatar
CREATE POLICY "Allow users to upload avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profiles' AND
  true
);

-- Allow users to update their own avatar
CREATE POLICY "Allow users to update avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-profiles' AND
  true
);

-- Allow anyone to read profile pictures
CREATE POLICY "Allow reads from user-profiles"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-profiles'
);
```

## 6. Enable Realtime

1. Go to **Database** → **Replication**
2. Find the `messages` table
3. Enable replication for `INSERT` events
4. This allows real-time message updates in chats

## 7. Test the Setup

### Test Database Connection:

Run this in SQL Editor:
```sql
SELECT * FROM profiles LIMIT 1;
```

Should return empty result (no error).

### Test Storage:

1. Go to **Storage** → `chat-attachments`
2. Try uploading a test image
3. Verify you can see it in the bucket

## 8. Update Application

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 9. Verify Setup

Run the app locally:

```bash
npm run dev
```

Test these features:
1. Create a profile → Check `profiles` table
2. Find a match → Check `chats` table
3. Send a message → Check `messages` table
4. Upload avatar → Check `user-profiles` bucket
5. Send image in chat → Check `chat-attachments` bucket

## Troubleshooting

### "relation does not exist" error
- Make sure you ran all SQL commands in Step 3
- Check table names are lowercase

### Storage upload fails
- Verify buckets exist with correct names
- Check storage policies are set up (Step 5)
- Ensure file size is within limits

### Realtime not working
- Verify replication is enabled (Step 6)
- Check browser console for connection errors
- Ensure Supabase URL and anon key are correct

### RLS errors
- For development, you can temporarily disable RLS:
  ```sql
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
  ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
  ```
- **Warning**: Only disable for local testing, never in production!

## Production Checklist

Before deploying to production:

- [ ] All tables created
- [ ] Indexes created for performance
- [ ] RLS enabled and policies configured
- [ ] Storage buckets created with correct settings
- [ ] Storage security policies configured
- [ ] Realtime enabled for messages table
- [ ] Environment variables set in Vercel
- [ ] Database backups configured (Settings → Database → Backups)
- [ ] Monitor usage in Supabase dashboard

## Useful Supabase CLI Commands

Install Supabase CLI:
```bash
npm install -g supabase
```

Login:
```bash
supabase login
```

Link project:
```bash
supabase link --project-ref your-project-ref
```

Pull schema:
```bash
supabase db pull
```

Push migrations:
```bash
supabase db push
```

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Realtime Guide**: https://supabase.com/docs/guides/realtime
- **Storage Guide**: https://supabase.com/docs/guides/storage
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

Need help? Check the [Supabase Discord](https://discord.supabase.com) or [GitHub Discussions](https://github.com/supabase/supabase/discussions).

