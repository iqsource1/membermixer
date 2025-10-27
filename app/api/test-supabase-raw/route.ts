import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables missing',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
    }

    // Show the URL format
    const urlInfo = {
      fullUrl: supabaseUrl,
      startsWithHttps: supabaseUrl.startsWith('https://'),
      endsWithSupabaseCo: supabaseUrl.includes('.supabase.co'),
      length: supabaseUrl.length,
      trimmed: supabaseUrl.trim(),
      hasSameLength: supabaseUrl.length === supabaseUrl.trim().length,
    };

    // Try a raw fetch to Supabase REST API
    const testUrl = `${supabaseUrl.trim()}/rest/v1/`;
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey.trim(),
          'Authorization': `Bearer ${supabaseKey.trim()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Raw fetch to Supabase worked!',
        urlInfo,
        fetchStatus: response.status,
        fetchOk: response.ok,
      });
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        message: 'Raw fetch failed',
        urlInfo,
        testUrl,
        fetchError: fetchError.message,
        fetchErrorCode: fetchError.code,
        fetchErrorCause: fetchError.cause?.message,
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Outer catch error',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

