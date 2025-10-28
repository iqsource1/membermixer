import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Build info object
    const info: any = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...${supabaseUrl.substring(supabaseUrl.length - 20)}` : 'MISSING',
      keyPreview: supabaseKey ? `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 10)}` : 'MISSING',
    };

    // Check exact URL match
    if (supabaseUrl) {
      info.matchesExpected = supabaseUrl === 'https://fpicbxwhzputathuprhj.supabase.co';
      info.isHttps = supabaseUrl.startsWith('https://');
      info.endsWithSupabase = supabaseUrl.includes('.supabase.co');
    }

    // Try to create fetch manually
    if (supabaseUrl && supabaseKey) {
      try {
        const testEndpoint = `${supabaseUrl.trim()}/rest/v1/`;
        const fetchOptions = {
          method: 'GET',
          headers: {
            'apikey': supabaseKey.trim(),
            'Authorization': `Bearer ${supabaseKey.trim()}`,
          },
        };

        const response = await fetch(testEndpoint, fetchOptions);
        
        info.fetchResult = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };

        try {
          const text = await response.text();
          info.fetchResult.responseText = text.substring(0, 200);
        } catch (e) {
          info.fetchResult.responseError = String(e);
        }

      } catch (fetchError: any) {
        info.fetchError = {
          message: fetchError.message,
          code: fetchError.code,
          cause: fetchError.cause?.toString(),
          errno: fetchError.errno,
          syscall: fetchError.syscall,
        };
      }
    }

    return NextResponse.json({
      success: true,
      info,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

