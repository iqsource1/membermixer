import { NextResponse } from 'next/server';

// Force Node.js runtime to access server-side env vars
export const runtime = 'nodejs';

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Determine overall status
  const allPresent = hasUrl && hasAnonKey && hasServiceRoleKey;
  const status = allPresent ? 'OK' : 'MISSING_CREDENTIALS';

  return NextResponse.json({
    status,
    environment: process.env.NODE_ENV || 'unknown',
    vercel: !!process.env.VERCEL,
    credentials: {
      NEXT_PUBLIC_SUPABASE_URL: {
        present: hasUrl,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT_SET',
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        present: hasAnonKey,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        preview: hasAnonKey ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 8) : 'NOT_SET',
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        present: hasServiceRoleKey,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        preview: hasServiceRoleKey ? '***' + process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 8) : 'NOT_SET',
        critical: true,
        note: 'Required for profile creation - must be set in Vercel environment variables'
      }
    },
    instructions: !allPresent ? {
      message: 'Missing required environment variables',
      steps: [
        '1. Go to your Vercel project settings',
        '2. Navigate to Environment Variables',
        '3. Ensure all three variables are set:',
        '   - NEXT_PUBLIC_SUPABASE_URL',
        '   - NEXT_PUBLIC_SUPABASE_ANON_KEY',
        '   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Settings > API)',
        '4. Redeploy your application after adding variables'
      ]
    } : null
  });
}

