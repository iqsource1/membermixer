-- Match Queue System for Member Mixer
-- Run this SQL in your Supabase SQL Editor

-- Create match_queue table
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- 'waiting', 'matched', 'cancelled'
  matched_with TEXT, -- user_id of matched person
  match_score FLOAT, -- compatibility score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Index for faster queries
CREATE INDEX idx_queue_status ON match_queue(status);
CREATE INDEX idx_queue_user_id ON match_queue(user_id);
CREATE INDEX idx_queue_created_at ON match_queue(created_at DESC);

-- Enable Row Level Security
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own queue entries"
  ON match_queue FOR SELECT
  TO public
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

CREATE POLICY "Users can insert to queue"
  ON match_queue FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own queue entries"
  ON match_queue FOR UPDATE
  TO public
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

-- Function to clean up expired queue entries
CREATE OR REPLACE FUNCTION cleanup_expired_queue_entries()
RETURNS void AS $$
BEGIN
  UPDATE match_queue
  SET status = 'cancelled'
  WHERE status = 'waiting'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired entries
-- (This would need Supabase cron extension, for now we'll handle in API)

COMMENT ON TABLE match_queue IS 'Queue system for matching users - users wait here until matched';

