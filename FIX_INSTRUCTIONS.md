# Member Mixer - Supabase Profile Creation Fix

## Problem Identified

The profile creation was failing with "fetch failed" errors because the API routes were using the Supabase **anon key** (client-side key with Row Level Security restrictions) instead of the **service role key** (server-side admin key that bypasses RLS).

## Changes Made

### 1. Updated Supabase Client (`lib/supabase.ts`)
- Created separate `supabaseAdmin` client using service role key
- Updated all helper functions to use `supabaseAdmin` instead of `supabase`
- This allows server-side operations to bypass RLS policies

### 2. Enhanced Error Logging (`app/api/profile/route.ts`)
- Added detailed console.log statements at each step
- Better error messages to identify exactly where failures occur
- This will help debug issues in Vercel logs

### 3. Added Environment Variable
- Added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

## Steps to Fix

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (fpicbxwhzputathuprhj)
3. Click **Settings** (gear icon in sidebar)
4. Click **API** in the settings menu
5. Scroll down to **Project API keys**
6. Copy the `service_role` key (⚠️ **KEEP THIS SECRET - DO NOT COMMIT TO GIT**)

### Step 2: Update Local Environment

1. Open `.env.local` in your project
2. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with the actual service role key you copied
3. Save the file

Example:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwaWNieHdoenB1dGF0aHVwcmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU4MDUxNSwiZXhwIjoyMDc3MTU2NTE1fQ...
```

### Step 3: Update Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select the `membermixr` project
3. Click **Settings**
4. Click **Environment Variables**
5. Add a new variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: [paste the service role key]
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 4: Verify Existing Environment Variables

Make sure these are set in Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (newly added)

### Step 5: Redeploy

After adding the environment variable to Vercel:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. OR: Push a new commit to trigger automatic deployment

### Step 6: Test

1. Visit your deployed app: https://membermixr-7hsgiuh82-iqsource1s-projects.vercel.app
2. Try creating a profile with:
   - Name: Your name
   - Bio: A short bio
   - Interests: Select at least 3 interests
3. Click "Save Profile"
4. ✅ Should redirect to `/matches` page without errors

## Verify the Fix Works

### Test Locally First

```bash
# Make sure you added the service role key to .env.local
npm run dev

# Visit http://localhost:3000/profile
# Try creating a profile
```

Check console logs for detailed step-by-step output:
```
[Profile API] Starting profile update/create
[Profile API] Request data: { userId: 'test-user-123', name: 'John Doe', ... }
[Supabase] Attempting to upsert profile: test-user-123
[Supabase] Profile upserted successfully: test-user-123
[Profile API] Profile saved successfully: test-user-123
```

### Check Vercel Logs

After deploying to Vercel:
1. Go to Vercel Dashboard → Your Project
2. Click **Logs** tab
3. Try creating a profile on your deployed site
4. Watch real-time logs for the same output as above
5. If you see errors, they will now be detailed with exact error messages from Supabase

## What Changed Under the Hood

### Before (Broken)
```typescript
// lib/supabase.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ❌ Limited permissions
);

// All operations used this client
```

### After (Fixed)
```typescript
// lib/supabase.ts
export const supabase = createClient(...) // Client-side only

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ Admin permissions
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// All API route operations use supabaseAdmin
```

## Security Notes

⚠️ **IMPORTANT**:
- The `SUPABASE_SERVICE_ROLE_KEY` is a **server-only** secret
- It bypasses all Row Level Security (RLS) policies
- **NEVER** expose it to the client (no `NEXT_PUBLIC_` prefix)
- Only use `supabaseAdmin` in API routes (server-side)
- Use regular `supabase` client in React components (client-side)

## Troubleshooting

### Issue: Still getting "fetch failed"

**Check:**
1. Is `SUPABASE_SERVICE_ROLE_KEY` set in Vercel? (Settings → Environment Variables)
2. Did you redeploy after adding the variable?
3. Is the key correct? (Should start with `eyJ...` and be very long)

**Debug:**
1. Check Vercel logs for detailed error messages
2. Look for `[Supabase] Error upserting profile:` in logs
3. The error will show the exact Supabase error code/message

### Issue: "Missing environment variable"

**Error:** `supabaseAdmin` throws error about missing `SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
1. Make sure you added the key to `.env.local` (local) or Vercel (production)
2. Restart your dev server: `npm run dev`
3. Redeploy to Vercel

### Issue: RLS policy errors

**Error:** Logs show "new row violates row-level security policy"

**Fix:**
1. The `supabaseAdmin` client should bypass RLS
2. Verify the service role key is correct
3. Check that helper functions use `supabaseAdmin` not `supabase`

## Files Modified

1. `lib/supabase.ts` - Added `supabaseAdmin` client and updated all functions
2. `app/api/profile/route.ts` - Added detailed logging
3. `.env.local` - Added `SUPABASE_SERVICE_ROLE_KEY` placeholder

## Next Steps

After profile creation works:
1. Test the matching feature (`/matches`)
2. Test the chat feature (`/chat/[id]`)
3. Verify avatar uploads work
4. Consider implementing proper Whop authentication (currently using mock auth)

## Need Help?

If profile creation still fails after following these steps:
1. Check Vercel deployment logs
2. Look for `[Profile API]` and `[Supabase]` log entries
3. Copy the error message
4. Check if the database tables exist (run queries in Supabase SQL Editor)
5. Verify the `supabase-complete-setup.sql` was executed on your Supabase project
