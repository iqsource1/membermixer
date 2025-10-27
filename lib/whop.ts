import { WhopAPI } from '@whop-sdk/api';

// Server-side Whop SDK instance
export const whop = new WhopAPI({
  TOKEN: process.env.WHOP_API_KEY!,
});

// Types
export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  profilePictureUrl?: string;
}

export interface WhopMembership {
  id: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: Date;
}

// Helper functions
export async function getWhopUser(userId: string): Promise<WhopUser | null> {
  try {
    const user = await whop.users.retrieve(userId);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      profilePictureUrl: user.profile_picture_url,
    };
  } catch (error) {
    console.error('Error fetching Whop user:', error);
    return null;
  }
}

export async function getUserMemberships(userId: string): Promise<WhopMembership[]> {
  try {
    const memberships = await whop.memberships.list({ userId });
    return memberships.data.map((m) => ({
      id: m.id,
      planId: m.plan_id,
      status: m.status as 'active' | 'expired' | 'cancelled',
      expiresAt: m.expires_at ? new Date(m.expires_at) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return [];
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const memberships = await getUserMemberships(userId);
  return memberships.some((m) => m.status === 'active');
}

export async function hasUnlimitedMatches(userId: string): Promise<boolean> {
  // Check if user has purchased unlimited matches product
  // You'll configure the product ID in Whop dashboard
  const unlimitedMatchesPlanId = process.env.WHOP_UNLIMITED_MATCHES_PLAN_ID;
  
  if (!unlimitedMatchesPlanId) return false;
  
  const memberships = await getUserMemberships(userId);
  return memberships.some(
    (m) => m.planId === unlimitedMatchesPlanId && m.status === 'active'
  );
}
