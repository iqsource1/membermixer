import { Profile } from './supabase';

/**
 * Calculate Jaccard similarity between two sets of interests
 * Formula: |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity(setA: string[], setB: string[]): number {
  if (setA.length === 0 && setB.length === 0) return 0;
  
  const intersection = setA.filter(x => setB.includes(x)).length;
  const union = new Set([...setA, ...setB]).size;
  
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate compatibility score between two users
 */
export function calculateCompatibility(user1: Profile, user2: Profile): number {
  return jaccardSimilarity(user1.interests, user2.interests);
}

/**
 * Find the best match for a user from a pool of candidates
 * Returns null if no suitable match is found
 */
export function findBestMatch(
  currentUser: Profile,
  candidates: Profile[],
  threshold = 0.2
): { match: Profile; score: number; sharedInterests: string[] } | null {
  if (candidates.length === 0) return null;

  // Calculate compatibility scores for all candidates
  const scoredCandidates = candidates.map(candidate => {
    const score = calculateCompatibility(currentUser, candidate);
    const sharedInterests = currentUser.interests.filter(i => 
      candidate.interests.includes(i)
    );
    
    return {
      match: candidate,
      score,
      sharedInterests,
    };
  });

  // Sort by score (descending)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Get best match
  const bestMatch = scoredCandidates[0];

  // If best match meets threshold, return it
  if (bestMatch.score >= threshold) {
    return bestMatch;
  }

  // Otherwise, pick a random match from top 20% of candidates
  const topCandidates = scoredCandidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.2)));
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  
  return topCandidates[randomIndex];
}

/**
 * Filter candidates for matching
 * Excludes: self, users with active chats, users matched recently
 */
export function filterCandidates(
  currentUserId: string,
  allUsers: Profile[],
  excludeUserIds: string[] = [],
  minHoursSinceLastMatch = 24
): Profile[] {
  const now = new Date().getTime();
  const minTimeSinceMatch = minHoursSinceLastMatch * 60 * 60 * 1000;

  return allUsers.filter(user => {
    // Exclude self
    if (user.user_id === currentUserId) return false;

    // Exclude specified users
    if (excludeUserIds.includes(user.user_id)) return false;

    // Exclude users without completed profiles
    if (!user.interests || user.interests.length === 0) return false;

    // Exclude users matched too recently (unless they have unlimited)
    if (!user.has_unlimited_matches && user.last_match_at) {
      const lastMatchTime = new Date(user.last_match_at).getTime();
      const timeSinceLastMatch = now - lastMatchTime;
      if (timeSinceLastMatch < minTimeSinceMatch) return false;
    }

    return true;
  });
}

/**
 * Check if user can create a new match based on their plan
 */
export function canCreateMatch(user: Profile): boolean {
  // Unlimited matches via subscription
  if (user.has_unlimited_matches || user.active_subscription) {
    return true;
  }

  // Free tier: 5 matches per month
  const freeMatchLimit = 5;
  return user.matches_used < freeMatchLimit;
}

/**
 * Get remaining matches for a user
 */
export function getRemainingMatches(user: Profile): number | 'unlimited' {
  if (user.has_unlimited_matches || user.active_subscription) {
    return 'unlimited';
  }

  const freeMatchLimit = 5;
  return Math.max(0, freeMatchLimit - user.matches_used);
}

