import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Test 1: Check if we can connect
    console.log('[Test DB] Testing Supabase connection...');

    // Test 2: Try to select from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    // Test 3: Try to insert a test profile
    const testProfile = {
      user_id: 'test-connection-' + Date.now(),
      name: 'Test User',
      interests: ['Testing'],
      bio: 'Connection test',
      matches_used: 0,
      has_unlimited_matches: false,
      active_subscription: false,
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()
      .single();

    // Clean up test data
    if (insertData) {
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testProfile.user_id);
    }

    return NextResponse.json({
      success: true,
      tests: {
        connection: {
          success: true,
          message: 'Supabase client created'
        },
        selectProfiles: {
          success: !profilesError,
          error: profilesError ? {
            message: profilesError.message,
            code: profilesError.code,
            details: profilesError.details,
            hint: profilesError.hint
          } : null,
          count: profiles?.length || 0
        },
        insertProfile: {
          success: !insertError,
          error: insertError ? {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          } : null,
          inserted: !!insertData
        }
      }
    });

  } catch (error) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
