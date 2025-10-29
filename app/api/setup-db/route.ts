import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('[Setup] Creating tables...');

    // Create profiles table
    await sql`
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
      )
    `;
    console.log('[Setup] Profiles table created!');

    // Create chats table
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_ids TEXT[] NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ
      )
    `;
    console.log('[Setup] Chats table created!');

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        text TEXT,
        attachment_path TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('[Setup] Messages table created!');

    // Create match_queue table
    await sql`
      CREATE TABLE IF NOT EXISTS match_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'waiting',
        matched_with TEXT,
        match_score FLOAT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        matched_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
      )
    `;
    console.log('[Setup] Match queue table created!');

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_chats_user_ids ON chats USING GIN(user_ids)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_queue_status ON match_queue(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_queue_user_id ON match_queue(user_id)`;
    console.log('[Setup] Indexes created!');

    // Verify tables exist
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'chats', 'messages', 'match_queue')
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! All tables created.',
      tablesCreated: result.rows
    });

  } catch (error) {
    console.error('[Setup] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
