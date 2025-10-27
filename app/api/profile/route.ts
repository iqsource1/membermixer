import { NextRequest, NextResponse } from 'next/server';
import { getProfile, createOrUpdateProfile } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const profile = await getProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, interests, bio, avatarPath } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    // Get existing profile or create new one
    let profile = await getProfile(userId);

    const profileData = {
      user_id: userId,
      name,
      interests: interests || profile?.interests || [],
      bio: bio || profile?.bio || '',
      avatar_path: avatarPath || profile?.avatar_path,
      matches_used: profile?.matches_used || 0,
      has_unlimited_matches: profile?.has_unlimited_matches || false,
      active_subscription: profile?.active_subscription || false,
      last_match_at: profile?.last_match_at,
      created_at: profile?.created_at || new Date().toISOString(),
    };

    const updatedProfile = await createOrUpdateProfile(profileData);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
