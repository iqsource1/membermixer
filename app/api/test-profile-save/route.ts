import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const testProfile = {
      user_id: 'test-user-123',
      name: 'Test User',
      interests: ['Crypto', 'Trading'],
      bio: 'Test bio',
      matches_used: 0,
      has_unlimited_matches: false,
      active_subscription: false,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(testProfile, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully!',
      profile: data,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      syscall: error.syscall,
      errno: error.errno,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    }, { status: 500 });
  }
}

