import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Create fresh client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to query profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connected to Supabase!',
      foundProfiles: data?.length || 0,
    });
    
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

