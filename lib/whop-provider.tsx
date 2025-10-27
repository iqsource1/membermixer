'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@whop-apps/sdk/react';

interface WhopContextValue {
  user: {
    id: string;
    email: string;
  } | null;
  loading: boolean;
  signOut: () => void;
}

const WhopContext = createContext<WhopContextValue | undefined>(undefined);

export function WhopProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  const value: WhopContextValue = {
    user: user
      ? {
          id: user.id,
          email: user.email || '',
        }
      : null,
    loading: isLoading,
    signOut: () => {
      // Redirect to Whop logout
      window.location.href = 'https://whop.com/logout';
    },
  };

  return <WhopContext.Provider value={value}>{children}</WhopContext.Provider>;
}

export function useWhop() {
  const context = useContext(WhopContext);
  if (context === undefined) {
    throw new Error('useWhop must be used within a WhopProvider');
  }
  return context;
}

