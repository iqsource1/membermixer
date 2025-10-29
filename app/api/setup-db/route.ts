import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('[Setup] Creating profiles table...');

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

    console.log('[Setup] Profiles table created successfully!');

    // Verify table exists
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
    `;

    return NextResponse.json({
      success: true,
      message: 'Database setup complete!',
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
