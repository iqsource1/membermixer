# Migration Summary: Vercel KV + Pusher → Supabase

This document summarizes the changes made to migrate Member Mixer from Vercel KV and Pusher to Supabase.

## What Changed

### Dependencies

**Removed:**
- `@vercel/kv` - Replaced with Supabase Postgres
- `pusher` and `pusher-js` - Replaced with Supabase Realtime

**Added:**
- `@supabase/supabase-js` - Main Supabase client
- `@supabase/auth-helpers-nextjs` - Auth helpers for Next.js

### Files Modified

#### New Files
- `lib/supabase.ts` - Supabase client and helper functions
- `SUPABASE_SETUP.md` - Complete setup guide for Supabase
- `MIGRATION_SUMMARY.md` - This file

#### Deleted Files
- `lib/kv.ts` - Removed (replaced by Supabase)
- `lib/pusher.ts` - Removed (replaced by Supabase Realtime)
- `hooks/use-pusher.ts` - Removed (no longer needed)

#### Updated Files

**Core Logic:**
- `lib/matching.ts` - Updated to use Supabase `Profile` type
- `lib/utils.ts` - No changes (still works)

**API Routes:**
- `app/api/match/route.ts` - Uses Supabase queries
- `app/api/messages/[chatId]/route.ts` - Uses Supabase for messages
- `app/api/profile/route.ts` - Uses Supabase for profiles
- `app/api/chat/end/route.ts` - Uses Supabase to mark chats as ended
- `app/api/webhook/route.ts` - Updated to use Supabase profile operations

**Components:**
- `components/chat-window.tsx` - Major update:
  - Uses Supabase Realtime instead of Pusher
  - Adds file attachment support
  - Displays attachments with signed URLs
- `components/profile-form.tsx` - Updated:
  - Added avatar upload functionality
  - Uses Supabase Storage

**Pages:**
- `app/profile/page.tsx` - Updated to handle avatarPath
- Other pages remain mostly unchanged

**Configuration:**
- `package.json` - Updated dependencies
- `env.local.example` - Removed KV/Pusher vars, added Supabase vars

## Key Features Added

### 1. File Attachments in Chat
- Users can now send images (JPEG, PNG, GIF, WebP) and PDFs
- Files are stored in `chat-attachments` Supabase Storage bucket
- Max file size: 10MB
- Files are displayed inline (images) or as download links (PDFs)

### 2. Profile Avatars
- Users can upload profile pictures
- Stored in `user-profiles` Supabase Storage bucket
- Max file size: 2MB
- Images are displayed as circular avatars

### 3. Real-time Updates via Supabase
- Messages update in real-time using Supabase Realtime subscriptions
- More reliable than Pusher for database-driven apps
- No additional WebSocket server needed

## Database Structure

### Supabase Postgres Tables

**profiles**
- Replaces KV `user:{id}` keys
- Uses snake_case for column names (Postgres convention)
- Supports PostgreSQL array type for interests

**chats**  
- Replaces KV `chat:{id}` keys
- Uses TEXT[] array for `user_ids`
- Added `ended_at` field for tracking ended chats

**messages**
- Replaces KV `messages:{chatId}` list
- Uses UUID for message IDs
- Added `attachment_path` for file attachments

### Storage Buckets

**chat-attachments**
- Private bucket
- Stores images and PDFs
- Access via signed URLs (1 hour expiry)

**user-profiles**
- Private bucket
- Stores user avatars
- Access via signed URLs

## Security Improvements

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies ensure users can only access their data
- More granular control than KV

### Storage Security
- Bucket-level access policies
- Files are private by default
- Signed URLs provide temporary access

### No Exposed Secrets
- Supabase anon key is safe to expose (RLS provides security)
- No need for service role key in client code

## Performance Considerations

### Advantages
- **Indexing**: Postgres indexes on `chat_id`, `user_ids`, `interests`
- **Relational queries**: Join chats and messages efficiently
- **GIN indexes**: Fast array searches for interests matching

### Potential Bottlenecks
- File uploads block message sending (mitigated with loading states)
- Signed URL generation adds latency (cached on client)
- Realtime subscriptions use WebSockets (monitor connection limits)

## Migration Steps (For Existing Deployments)

If you have an existing deployment with data in Vercel KV:

1. **Set up Supabase** (see SUPABASE_SETUP.md)

2. **Migrate data** (manual for MVP):
   ```sql
   -- Insert profiles from KV
   INSERT INTO profiles (user_id, name, interests, bio, matches_used, ...)
   VALUES (...);
   ```

3. **Update environment variables**:
   - Remove KV vars
   - Remove Pusher vars
   - Add Supabase vars

4. **Deploy new code**:
   ```bash
   git push origin main
   vercel --prod
   ```

5. **Test thoroughly**:
   - Create profile
   - Find match
   - Send messages
   - Upload files

6. **Deprecate KV/Pusher**:
   - Delete Vercel KV database (after confirming migration)
   - Cancel Pusher subscription

## Breaking Changes

### API Response Changes
- User IDs: Still use Whop user IDs (no change)
- Timestamps: Now ISO strings instead of Unix timestamps
- Profile keys: Changed from camelCase to snake_case

### Client Code Changes
- Import from `@/lib/supabase` instead of `@/lib/kv`
- Use Supabase Realtime instead of Pusher hooks
- Handle file uploads in forms

## Testing Checklist

- [ ] Profile creation/update works
- [ ] Avatar upload works
- [ ] Matching algorithm finds users
- [ ] Chat messages send in real-time
- [ ] Image attachments upload and display
- [ ] PDF attachments upload and download
- [ ] File size limits enforced
- [ ] RLS prevents unauthorized access
- [ ] Whop payments still work

## Rollback Plan

If issues arise:

1. **Keep old code in Git branch**:
   ```bash
   git checkout pre-supabase-migration
   ```

2. **Restore environment variables**:
   - Re-add KV vars
   - Re-add Pusher vars

3. **Redeploy old version**:
   ```bash
   vercel --prod
   ```

4. **Note**: Data created in Supabase will need manual migration back to KV

## Future Enhancements

Now that we're on Supabase:

1. **Advanced Search**: Full-text search on profiles
2. **Analytics**: Query match success rates
3. **Reporting**: User moderation tools
4. **Webhooks**: Supabase Database Webhooks for events
5. **Edge Functions**: Supabase Edge Functions for complex logic

## Cost Comparison

### Before (KV + Pusher)
- Vercel KV: ~$20/mo (100k commands)
- Pusher: ~$49/mo (Scale plan)
- **Total**: ~$69/mo

### After (Supabase)
- Supabase Pro: $25/mo (or Free tier for small projects)
- Includes: Database, Storage, Realtime, Auth
- **Total**: $25/mo (or $0 on free tier)

**Savings**: ~$44/mo (~63% reduction)

## Resources

- **Supabase Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Supabase Docs**: https://supabase.com/docs
- **Migration Guide**: This file

## Support

Questions about the migration? Check:
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue if you encounter problems

---

**Migration Date**: October 2025  
**Migration By**: AI Assistant  
**Status**: ✅ Complete

