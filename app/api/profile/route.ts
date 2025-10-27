import { NextRequest, NextResponse } from 'next/server';
import { getProfile, createOrUpdateProfile } from '@/lib/supabase';

// Force Node.js runtime (not Edge) for Supabase compatibility
export const runtime = 'nodejs';

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
    console.log('[Profile API] Starting profile update/create');

    const body = await req.json();
    const { userId, name, interests, bio, avatarPath } = body;

    console.log('[Profile API] Request data:', {
      userId,
      name,
      interestsCount: interests?.length,
      hasBio: !!bio,
      hasAvatar: !!avatarPath
    });

    if (!userId || !name) {
      console.error('[Profile API] Validation failed: missing userId or name');
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    // Get existing profile or create new one
    console.log('[Profile API] Fetching existing profile for:', userId);
    let profile = await getProfile(userId);
    console.log('[Profile API] Existing profile:', profile ? 'Found' : 'Not found');

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

    console.log('[Profile API] Upserting profile data:', {
      user_id: profileData.user_id,
      name: profileData.name,
      interestsCount: profileData.interests.length
    });

    const { data: updatedProfile, error: dbError } = await createOrUpdateProfile(profileData);

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

    console.log('[Profile API] Profile saved successfully:', updatedProfile.user_id);
    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (error) {
    console.error('[Profile API] Caught exception:', error);
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
