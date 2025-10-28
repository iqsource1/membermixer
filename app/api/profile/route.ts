import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force Node.js runtime (not Edge) for Supabase compatibility
export const runtime = 'nodejs';

// Create Supabase client directly
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get profile error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const { userId, name, interests, bio, avatarPath } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    // Try to get existing profile first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const profileData = {
      user_id: userId,
      name,
      interests: interests || existingProfile?.interests || [],
      bio: bio || existingProfile?.bio || '',
      avatar_path: avatarPath || existingProfile?.avatar_path,
      matches_used: existingProfile?.matches_used || 0,
      has_unlimited_matches: existingProfile?.has_unlimited_matches || false,
      active_subscription: existingProfile?.active_subscription || false,
      last_match_at: existingProfile?.last_match_at,
      created_at: existingProfile?.created_at || new Date().toISOString(),
    };

    const { data: updatedProfile, error: dbError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (dbError || !updatedProfile) {
      console.error('[Profile API] Failed to upsert profile:', dbError);
      return NextResponse.json(
        {
          error: 'Failed to save profile',
          details: dbError ? dbError.message : 'No data returned',
          code: dbError?.code,
          hint: dbError?.hint,
          supabaseDetails: dbError?.details
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (error: any) {
    console.error('[Profile API] Caught exception:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
