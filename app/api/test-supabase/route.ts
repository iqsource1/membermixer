import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Try raw fetch directly to Supabase REST API
    const testUrl = `${supabaseUrl}/rest/v1/profiles?select=user_id&limit=1`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: 'Raw fetch got error response',
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Raw fetch to Supabase worked!',
      foundProfiles: Array.isArray(data) ? data.length : 0,
      data: data,
    });
    
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      code: err.code,
      syscall: err.syscall,
      errno: err.errno,
      stack: err.stack,
    }, { status: 500 });
  }
}

