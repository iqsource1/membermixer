import { NextRequest, NextResponse } from 'next/server';
import {
  getProfile,
  getAllProfiles,
  createOrUpdateProfile,
  createChat,
  getActiveChat
} from '@/lib/db';
import {
  filterCandidates,
  findBestMatch,
  canCreateMatch
} from '@/lib/matching';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user profile
    const currentUser = await getProfile(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile first.' },
        { status: 404 }
      );
    }

    // Check if user has interests
    if (!currentUser.interests || currentUser.interests.length === 0) {
      return NextResponse.json(
        { error: 'Please add interests to your profile before matching' },
        { status: 400 }
      );
    }

    // Check if user already has an active chat
    const existingChat = await getActiveChat(userId);
    if (existingChat) {
      return NextResponse.json(
        { error: 'You already have an active chat. End it before finding a new match.' },
        { status: 400 }
      );
    }

    // Check if user can create a new match
    if (!canCreateMatch(currentUser)) {
      return NextResponse.json(
        { 
          error: 'Match limit reached',
          message: 'You have used all your free matches. Upgrade to continue matching!',
          requiresPayment: true 
        },
        { status: 403 }
      );
    }

    // Get all user profiles except current user
    const allUsers = await getAllProfiles(userId);

    // Filter candidates (exclude self, inactive users, etc.)
    const candidates = filterCandidates(userId, allUsers);

    // Check if we have enough users
    if (candidates.length === 0) {
      return NextResponse.json(
        { 
          error: 'No matches available',
          message: 'Not enough active users in the community. Check back later!'
        },
        { status: 404 }
      );
    }

    // Find best match
    const matchResult = findBestMatch(currentUser, candidates);

    if (!matchResult) {
      return NextResponse.json(
        { error: 'No suitable match found' },
        { status: 404 }
      );
    }

    // Create chat between users
    const chat = await createChat(userId, matchResult.match.user_id);

    if (!chat) {
      return NextResponse.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      );
    }

    // Update both users' match counts and last match time
    await createOrUpdateProfile({
      ...currentUser,
      matches_used: currentUser.matches_used + 1,
      last_match_at: new Date().toISOString(),
    });

    await createOrUpdateProfile({
      ...matchResult.match,
      matches_used: matchResult.match.matches_used + 1,
      last_match_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      match: {
        id: matchResult.match.user_id,
        name: matchResult.match.name,
        bio: matchResult.match.bio,
        sharedInterests: matchResult.sharedInterests,
        compatibilityScore: Math.round(matchResult.score * 100),
      },
      chatId: chat.id,
    });

  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json(
      { error: 'Failed to find match' },
      { status: 500 }
    );
  }
}
