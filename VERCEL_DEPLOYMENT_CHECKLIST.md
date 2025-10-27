# Vercel Deployment Troubleshooting Guide

## Profile Creation Not Working on Vercel?

If profile creation works locally but fails on Vercel, follow this checklist:

## 🔍 Quick Diagnostic

Visit **`https://your-app.vercel.app/diagnostics`** to run automated tests.

## ✅ Checklist

### 1. Environment Variables (MOST COMMON ISSUE)

Go to your Vercel project → Settings → Environment Variables and verify ALL three are set:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
  - From: Supabase → Settings → API → Project URL
  - Example: `https://xxxxx.supabase.co`

- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - From: Supabase → Settings → API → Project API keys → `anon` `public`
  - This is the public/anon key (not service role!)

- ✅ `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITICAL**
  - From: Supabase → Settings → API → Project API keys → `service_role` `secret`
  - This must be the SERVICE ROLE key (not anon!)
  - This bypasses Row Level Security (RLS) for server-side operations
  - **This is the one most likely to be missing!**

### 2. Redeploy After Setting Variables

⚠️ **Important:** After adding environment variables, you MUST:
1. Click "Redeploy" in Vercel
2. OR make a new commit and push

Environment variables are NOT applied to existing deployments!

### 3. Check Environment Scope

Make sure environment variables are set for the correct environment:
- Production
- Preview
- Development

Tip: Set them for "All" to ensure they work everywhere.

## 🧪 Test Endpoints

Use these endpoints to debug issues:

1. **`/api/test-env`** - Check if all environment variables are present
2. **`/api/test-db`** - Test database connection and operations
3. **`/diagnostics`** - Visual dashboard showing all test results

## 🐛 Common Errors

### Error: "Missing Supabase credentials"

**Cause:** `SUPABASE_SERVICE_ROLE_KEY` is not set in Vercel

**Fix:**
1. Go to Supabase → Settings → API
2. Copy the `service_role` key (reveal it first)
3. Add to Vercel environment variables
4. Redeploy

### Error: "fetch failed" or network errors

**Cause:** Using Edge runtime instead of Node.js runtime

**Fix:** Already handled! The profile route has `export const runtime = 'nodejs';`

### Error: "Profile not found" after creation

**Cause:** Row Level Security (RLS) might be blocking reads

**Fix:** Check Supabase RLS policies on `profiles` table

## 📋 Supabase Database Schema

Ensure your `profiles` table has these columns:

```sql
create table profiles (
  user_id text primary key,
  name text not null,
  interests text[] not null default '{}',
  avatar_path text,
  bio text,
  matches_used integer not null default 0,
  has_unlimited_matches boolean not null default false,
  active_subscription boolean not null default false,
  last_match_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);
```

## 🔐 Row Level Security (RLS)

The app uses the **service role key** which bypasses RLS. However, if you're seeing permission errors, check:

1. Service role key is correctly set
2. The key hasn't been regenerated (old key would be invalid)
3. Supabase project is active (not paused)

## 🆘 Still Not Working?

1. Check Vercel deployment logs:
   - Go to your deployment → View Function Logs
   - Look for errors from `/api/profile`

2. Check browser console:
   - Open DevTools → Console
   - Try creating a profile
   - Look for error messages

3. Test locally with production env vars:
   ```bash
   # Copy your Vercel env vars to .env.local
   npm run build
   npm start
   ```

## 📞 Need More Help?

Include this info when asking for help:
- Output from `/api/test-env`
- Output from `/api/test-db`
- Error message from browser console
- Error message from Vercel function logs
