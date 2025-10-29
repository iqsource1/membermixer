'use client';

import { useState, useEffect } from 'react';

// Generate or retrieve unique user ID for this browser session
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'temp-user';

  // Check if user already has an ID in localStorage
  let userId = localStorage.getItem('membermixr_user_id');

  if (!userId) {
    // Generate new unique ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('membermixr_user_id', userId);
  }

  return userId;
}

export function useWhop() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if running in Whop app context
    const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

    if (!appId) {
      // Mock mode - generate unique user ID for each browser session
      const userId = getOrCreateUserId();
      setUser({
        id: userId,
        email: `${userId}@example.com`,
      });
      setLoading(false);
      return;
    }

    // Try to get user from Whop session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback to mock with unique ID
        const userId = getOrCreateUserId();
        setUser({
          id: userId,
          email: `${userId}@example.com`,
        });
        setLoading(false);
      });
  }, []);

  return { user, loading };
}

