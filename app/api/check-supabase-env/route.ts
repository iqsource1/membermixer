import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if variables are set
  const status = {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    urlValue: supabaseUrl || 'NOT SET',
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
    keyPreview: supabaseKey 
      ? `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 4)}`
      : 'NOT SET',
    // Check URL format
    urlIsHttps: supabaseUrl?.startsWith('https://'),
    urlHasSupabase: supabaseUrl?.includes('.supabase.co'),
    // Check if it matches expected
    urlMatches: supabaseUrl === 'https://fpicbxwhzputathuprhj.supabase.co',
  };

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

