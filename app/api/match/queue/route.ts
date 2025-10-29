import { NextRequest, NextResponse } from 'next/server';
import {
  getProfile,
  createChat,
  createOrUpdateProfile,
  addToMatchQueue,
  findWaitingUser,
  updateMatchQueueStatus,
  getAllProfiles
} from '@/lib/db';
import { jaccardSimilarity } from '@/lib/matching';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('[Match Queue] Request from user:', userId);

    // Get current user profile
    const currentUser = await getProfile(userId);
    console.log('[Match Queue] User profile:', currentUser);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Please create your profile first' },
        { status: 400 }
      );
    }

    // Check if user already in queue
    const existingQueue = await sql`
      SELECT * FROM match_queue
      WHERE user_id = ${userId}
      AND status = 'waiting'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existingQueue.rows.length > 0) {
      console.log('[Match Queue] User already in queue');
      // Already in queue, check if we can find a match now
      const match = await findMatchInQueue(userId, currentUser);

      if (match) {
        return NextResponse.json({
          status: 'matched',
          queueId: existingQueue.rows[0].id,
          match,
        });
      }

      return NextResponse.json({
        status: 'waiting',
        queueId: existingQueue.rows[0].id,
        message: 'Searching for your match...',
      });
    }

    // Add user to queue
    console.log('[Match Queue] Adding user to queue');
    const queueEntry = await addToMatchQueue(userId);

    if (!queueEntry) {
      console.error('[Match Queue] Failed to add to queue');
      return NextResponse.json({ error: 'Failed to join queue' }, { status: 500 });
    }

    console.log('[Match Queue] User added to queue:', queueEntry.id);

    // Try to find a match immediately
    const match = await findMatchInQueue(userId, currentUser);

    if (match) {
      console.log('[Match Queue] Match found immediately!');
      return NextResponse.json({
        status: 'matched',
        queueId: queueEntry.id,
        match,
      });
    }

    console.log('[Match Queue] No match yet, waiting...');
    return NextResponse.json({
      status: 'waiting',
      queueId: queueEntry.id,
      message: 'Searching for your match...',
    });

  } catch (error) {
    console.error('[Match Queue] Error:', error);
    return NextResponse.json({ error: 'Failed to process match request' }, { status: 500 });
  }
}

// Check queue status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const queueId = searchParams.get('queueId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's queue entry
    const queueResult = queueId
      ? await sql`
          SELECT * FROM match_queue
          WHERE user_id = ${userId} AND id = ${queueId}
          AND status = 'waiting'
          ORDER BY created_at DESC
          LIMIT 1
        `
      : await sql`
          SELECT * FROM match_queue
          WHERE user_id = ${userId}
          AND status = 'waiting'
          ORDER BY created_at DESC
          LIMIT 1
        `;

    if (queueResult.rows.length === 0) {
      return NextResponse.json({ status: 'not_in_queue' });
    }

    const queueEntry = queueResult.rows[0];

    // Check if match was found
    if (queueEntry.matched_with) {
      const matchProfile = await getProfile(queueEntry.matched_with);

      return NextResponse.json({
        status: 'matched',
        match: {
          id: matchProfile?.user_id,
          name: matchProfile?.name,
          bio: matchProfile?.bio,
          sharedInterests: [],
        },
      });
    }

    // Still waiting, try to find match
    const currentUser = await getProfile(userId);
    if (currentUser) {
      const match = await findMatchInQueue(userId, currentUser);

      if (match) {
        return NextResponse.json({
          status: 'matched',
          match,
        });
      }
    }

    return NextResponse.json({
      status: 'waiting',
      message: 'Still searching...',
    });

  } catch (error) {
    console.error('[Match Queue] Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

// Helper function to find match in queue
async function findMatchInQueue(userId: string, currentUser: any) {
  try {
    console.log('[Match Queue] Looking for matches for user:', userId);

    // Get all waiting users in queue (excluding current user)
    const queueUsers = await sql`
      SELECT user_id FROM match_queue
      WHERE status = 'waiting'
      AND user_id != ${userId}
      AND expires_at > NOW()
    `;

    console.log('[Match Queue] Found', queueUsers.rows.length, 'waiting users');

    if (queueUsers.rows.length === 0) {
      return null;
    }

    // Get profiles for queue users
    const candidateIds = queueUsers.rows.map(q => q.user_id);

    // If no candidates, return null
    if (candidateIds.length === 0) {
      return null;
    }

    // Build SQL query with multiple OR conditions instead of ANY
    let profiles;
    if (candidateIds.length === 1) {
      profiles = await sql`SELECT * FROM profiles WHERE user_id = ${candidateIds[0]}`;
    } else {
      // For multiple IDs, query each one separately and combine results
      const allProfiles = await Promise.all(
        candidateIds.map(id => sql`SELECT * FROM profiles WHERE user_id = ${id}`)
      );
      profiles = { rows: allProfiles.flatMap(p => p.rows) };
    }

    const candidates = profiles.rows;
    console.log('[Match Queue] Found', candidates.length, 'candidate profiles');

    if (candidates.length === 0) {
      return null;
    }

    // Pick a completely random match from waiting users
    const randomMatch = candidates[Math.floor(Math.random() * candidates.length)];

    console.log('[Match Queue] Randomly selected match:', randomMatch.user_id);

    // Calculate shared interests if they exist (for display purposes only)
    const sharedInterests = (currentUser.interests && randomMatch.interests)
      ? currentUser.interests.filter((i: string) => randomMatch.interests.includes(i))
      : [];

    const score = sharedInterests.length / Math.max(
      (currentUser.interests?.length || 1),
      (randomMatch.interests?.length || 1)
    );

    const bestMatch = {
      candidate: randomMatch,
      score,
      sharedInterests,
    };

    console.log('[Match Queue] Match:', bestMatch.candidate.user_id);

    // Create chat
    const chat = await createChat(userId, bestMatch.candidate.user_id);

    if (!chat) {
      console.error('[Match Queue] Failed to create chat');
      return null;
    }

    console.log('[Match Queue] Created chat:', chat.id);

    // Update both queue entries
    await updateMatchQueueStatus(userId, 'matched', bestMatch.candidate.user_id);
    await updateMatchQueueStatus(bestMatch.candidate.user_id, 'matched', userId);

    // Update match counts
    await createOrUpdateProfile({
      ...currentUser,
      matches_used: currentUser.matches_used + 1,
      last_match_at: new Date().toISOString(),
    });

    await createOrUpdateProfile({
      ...bestMatch.candidate,
      matches_used: bestMatch.candidate.matches_used + 1,
      last_match_at: new Date().toISOString(),
    });

    console.log('[Match Queue] Match complete!');

    return {
      id: bestMatch.candidate.user_id,
      name: bestMatch.candidate.name,
      bio: bestMatch.candidate.bio,
      sharedInterests: bestMatch.sharedInterests,
      compatibilityScore: Math.round(bestMatch.score * 100),
      chatId: chat.id,
    };

  } catch (error) {
    console.error('[Match Queue] Find match error:', error);
    return null;
  }
}

// Cancel queue entry
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await sql`
      UPDATE match_queue
      SET status = 'cancelled'
      WHERE user_id = ${userId}
      AND status = 'waiting'
    `;

    return NextResponse.json({ success: true, message: 'Left queue' });

  } catch (error) {
    console.error('[Match Queue] Cancel error:', error);
    return NextResponse.json({ error: 'Failed to leave queue' }, { status: 500 });
  }
}

