import { NextRequest, NextResponse } from 'next/server';

// Simple auth endpoint for Whop integration
// In production, this would validate Whop tokens/sessions
export async function GET(req: NextRequest) {
  // For now, return mock user if in development
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  
  if (!appId) {
    // Development mode - return mock user
    return NextResponse.json({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
      },
    });
  }

  // TODO: In production, validate Whop session/token
  // For now, return mock data
  return NextResponse.json({
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
    },
  });
}

