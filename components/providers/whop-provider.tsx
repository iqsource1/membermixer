'use client';

import { ReactNode } from 'react';

// Whop SDK Provider - simplified for development
export function WhopProvider({ children }: { children: ReactNode }) {
  // Simple wrapper - actual auth is handled in useWhop hook
  return <>{children}</>;
}

