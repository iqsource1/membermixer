# Vercel Deployment Checklist

## Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Make sure you have EXACTLY these two:

1. **Variable Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://fpicbxwhzputathuprhj.supabase.co`
   - **Environment:** Production, Preview, Development (check ALL)

2. **Variable Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Your anon key from Supabase (Settings → API → anon public)
   - **Environment:** Production, Preview, Development (check ALL)

## After Adding/Changing Variables

1. Go to **Deployments** tab
2. Click the "..." menu on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

## Test These URLs (after deployment)

1. `https://your-app.vercel.app/api/debug-supabase`
   - Shows env var status, fetch diagnostics
   
2. `https://your-app.vercel.app/api/test-supabase`
   - Tests raw connection to Supabase

## Quick Test

Visit `/api/debug-supabase` and check:
- `matchesExpected: true` (URL matches your Supabase URL)
- `hasUrl: true`
- `hasKey: true`

If any are false, env vars aren't set correctly in Vercel!

