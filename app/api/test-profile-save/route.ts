import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
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
      stack: error.stack,
    }, { status: 500 });
  }
}

