import { sql } from '@vercel/postgres';

// Database types
export interface Profile {
  user_id: string;
  name: string;
  interests: string[];
  avatar_path?: string;
  bio?: string;
  matches_used: number;
  has_unlimited_matches: boolean;
  active_subscription: boolean;
  last_match_at?: string;
  created_at: string;
}

// Helper functions for database operations

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const result = await sql`
      SELECT * FROM profiles WHERE user_id = ${userId}
    `;

    return result.rows[0] as Profile || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function createOrUpdateProfile(profile: Partial<Profile>): Promise<{ data: Profile | null; error: any }> {
  try {
    console.log('[DB] Attempting to upsert profile:', profile.user_id);

    // Convert interests array to PostgreSQL array format
    const interestsArray = profile.interests || [];
    const interestsStr = `{${interestsArray.map(i => `"${i}"`).join(',')}}`;

    const result = await sql`
      INSERT INTO profiles (
        user_id, name, bio, interests, avatar_path,
        matches_used, has_unlimited_matches, active_subscription
      )
      VALUES (
        ${profile.user_id},
        ${profile.name},
        ${profile.bio || ''},
        ${interestsStr}::text[],
        ${profile.avatar_path || null},
        ${profile.matches_used || 0},
        ${profile.has_unlimited_matches || false},
        ${profile.active_subscription || false}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        avatar_path = EXCLUDED.avatar_path
      RETURNING *
    `;

    const data = result.rows[0] as Profile;
    console.log('[DB] Profile upserted successfully:', data.user_id);

    return { data, error: null };
  } catch (error) {
    console.error('[DB] Error upserting profile:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export async function getAllProfiles(excludeUserId?: string): Promise<Profile[]> {
  try {
    let result;

    if (excludeUserId) {
      result = await sql`
        SELECT * FROM profiles
        WHERE user_id != ${excludeUserId}
        AND array_length(interests, 1) > 0
      `;
    } else {
      result = await sql`
        SELECT * FROM profiles
        WHERE array_length(interests, 1) > 0
      `;
    }

    return result.rows as Profile[];
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}
