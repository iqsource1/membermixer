'use client';

import { useState, useEffect } from 'react';

export function useWhop() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if running in Whop app context
    const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
    
    if (!appId) {
      // Mock mode for local development
      setUser({
        id: 'test-user-123',
        email: 'test@example.com',
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
        // Fallback to mock for development
        setUser({
          id: 'test-user-123',
          email: 'test@example.com',
        });
        setLoading(false);
      });
  }, []);

  return { user, loading };
}

