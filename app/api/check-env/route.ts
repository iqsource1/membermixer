import { NextResponse } from 'next/server';

export async function GET() {
  const envStatus = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    // Don't expose full key, just first/last characters
    supabaseKeyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 10)}`
      : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json(envStatus);
}

