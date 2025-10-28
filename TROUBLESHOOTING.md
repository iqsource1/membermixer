# Troubleshooting "fetch failed" Error

## The Problem
Getting `TypeError: fetch failed` when trying to save profiles on Vercel.

## Most Common Causes (in order)

### 1. Supabase Project is Paused ⚠️
**Supabase free projects pause after ~1 week of inactivity!**

**How to check:**
1. Go to https://supabase.com/dashboard
2. Open your project: `fpicbxwhzputathuprhj`
3. Look for a "Paused" indicator or "Reactivate" button

**How to fix:**
- Click "Reactivate" button
- Wait 1-2 minutes
- Try saving a profile again

---

### 2. Environment Variables Not Set in Vercel

**How to check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure you see:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://fpicbxwhzputathuprhj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your key)

**How to fix:**
- If missing, ADD them
- Make sure to check ALL environments (Production, Preview, Development)
- After adding, REDEPLOY your app

---

### 3. Wrong Environment Variable Values

**How to check:**
Visit: `https://your-app.vercel.app/api/check-env`

You should see:
```json
{
  "hasSupabaseUrl": true,
  "hasSupabaseKey": true,
  "supabaseUrl": "https://fpicbxwhzputathuprhj.supabase.co"
}
```

**How to fix:**
- If `hasSupabaseUrl: false` or `hasSupabaseKey: false`, env vars aren't loaded
- If URL doesn't match exactly, edit the variable in Vercel
- REDEPLOY after fixing

---

### 4. Supabase Database Tables Missing

**How to check:**
- Go to Supabase SQL Editor
- Run: `SELECT * FROM profiles LIMIT 1;`

**How to fix:**
- If it errors, run `supabase-complete-setup.sql` script

---

## Quick Test Checklist

After deploying, test these URLs:

1. `/api/check-env` - Shows if env vars are loaded
2. `/api/debug-supabase` - Shows detailed connection info
3. `/api/test-supabase` - Tests raw Supabase connection

## Still Not Working?

The most common issue is **#1 - Supabase project is paused**. Check that first!

