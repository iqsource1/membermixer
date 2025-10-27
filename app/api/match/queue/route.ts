import { NextRequest, NextResponse } from 'next/server';
import { supabase, getProfile, createChat, createOrUpdateProfile } from '@/lib/supabase';
import { jaccardSimilarity } from '@/lib/matching';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get current user profile
    const currentUser = await getProfile(userId);
    if (!currentUser || !currentUser.interests?.length) {
      return NextResponse.json(
        { error: 'Please complete your profile with interests first' },
        { status: 400 }
      );
    }

    // Check if user already in queue
    const { data: existingQueue } = await supabase
      .from('match_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'waiting')
      .single();

    if (existingQueue) {
      // Already in queue, check if we can find a match now
      const match = await findMatchInQueue(userId, currentUser);
      
      if (match) {
        return NextResponse.json({
          status: 'matched',
          queueId: existingQueue.id,
          match,
        });
      }

      return NextResponse.json({
        status: 'waiting',
        queueId: existingQueue.id,
        message: 'Searching for your match...',
      });
    }

    // Add user to queue
    const { data: queueEntry, error: queueError } = await supabase
      .from('match_queue')
      .insert({
        user_id: userId,
        status: 'waiting',
      })
      .select()
      .single();

    if (queueError) {
      console.error('Queue insert error:', queueError);
      return NextResponse.json({ error: 'Failed to join queue' }, { status: 500 });
    }

    // Try to find a match immediately
    const match = await findMatchInQueue(userId, currentUser);

    if (match) {
      return NextResponse.json({
        status: 'matched',
        queueId: queueEntry.id,
        match,
      });
    }

    return NextResponse.json({
      status: 'waiting',
      queueId: queueEntry.id,
      message: 'Searching for your match...',
    });

  } catch (error) {
    console.error('Match queue error:', error);
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
    let query = supabase.from('match_queue').select('*').eq('user_id', userId);
    
    if (queueId) {
      query = query.eq('id', queueId);
    }

    const { data: queueEntry } = await query
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!queueEntry) {
      return NextResponse.json({ status: 'not_in_queue' });
    }

    // Check if match was found
    if (queueEntry.matched_with) {
      const matchProfile = await getProfile(queueEntry.matched_with);
      
      return NextResponse.json({
        status: 'matched',
        match: {
          id: matchProfile?.user_id,
          name: matchProfile?.name,
          bio: matchProfile?.bio,
          sharedInterests: [], // Will calculate from chat
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
    console.error('Queue status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

// Helper function to find match in queue
async function findMatchInQueue(userId: string, currentUser: any) {
  try {
    // Get all waiting users in queue (excluding current user)
    const { data: queueUsers } = await supabase
      .from('match_queue')
      .select('user_id')
      .eq('status', 'waiting')
      .neq('user_id', userId)
      .gt('expires_at', new Date().toISOString());

    if (!queueUsers || queueUsers.length === 0) {
      return null;
    }

    // Get profiles for queue users
    const candidateIds = queueUsers.map(q => q.user_id);
    const { data: candidates } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', candidateIds);

    if (!candidates || candidates.length === 0) {
      return null;
    }

    // Calculate compatibility scores
    const scored = candidates
      .filter(c => c.interests && c.interests.length > 0)
      .map(candidate => {
        const score = jaccardSimilarity(currentUser.interests, candidate.interests);
        const shared = currentUser.interests.filter((i: string) => candidate.interests.includes(i));
        
        return {
          candidate,
          score,
          sharedInterests: shared,
        };
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return null;
    }

    // Get best match (or random from top 20%)
    const threshold = 0.2;
    const goodMatches = scored.filter(s => s.score >= threshold);
    const matchPool = goodMatches.length > 0 ? goodMatches : scored.slice(0, Math.max(1, Math.ceil(scored.length * 0.2)));
    
    const bestMatch = matchPool[Math.floor(Math.random() * matchPool.length)];

    // Create chat
    const chat = await createChat(userId, bestMatch.candidate.user_id);
    
    if (!chat) {
      return null;
    }

    // Update both queue entries
    await supabase
      .from('match_queue')
      .update({
        status: 'matched',
        matched_with: bestMatch.candidate.user_id,
        match_score: bestMatch.score,
        matched_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'waiting');

    await supabase
      .from('match_queue')
      .update({
        status: 'matched',
        matched_with: userId,
        match_score: bestMatch.score,
        matched_at: new Date().toISOString(),
      })
      .eq('user_id', bestMatch.candidate.user_id)
      .eq('status', 'waiting');

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

    return {
      id: bestMatch.candidate.user_id,
      name: bestMatch.candidate.name,
      bio: bestMatch.candidate.bio,
      sharedInterests: bestMatch.sharedInterests,
      compatibilityScore: Math.round(bestMatch.score * 100),
      chatId: chat.id,
    };

  } catch (error) {
    console.error('Find match error:', error);
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

    await supabase
      .from('match_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'waiting');

    return NextResponse.json({ success: true, message: 'Left queue' });

  } catch (error) {
    console.error('Cancel queue error:', error);
    return NextResponse.json({ error: 'Failed to leave queue' }, { status: 500 });
  }
}

