'use client';

import { WhopProvider as WhopAppsProvider } from '@whop-apps/sdk/react';
import { WhopProvider } from '@/lib/whop-provider';
import { ReactNode } from 'react';

export function WhopConfig({ children }: { children: ReactNode }) {
  return (
    <WhopAppsProvider
      clientId={process.env.NEXT_PUBLIC_WHOP_CLIENT_ID!}
      appId={process.env.NEXT_PUBLIC_WHOP_APP_ID!}
    >
      <WhopProvider>{children}</WhopProvider>
    </WhopAppsProvider>
  );
}

