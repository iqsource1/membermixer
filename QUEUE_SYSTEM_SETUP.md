# Match Queue System - Setup Guide

## 🎯 What This Does

The queue system allows users to find matches **asynchronously** - they don't need to be online at the same time!

### How It Works:
1. User clicks "Find Match" → Added to queue
2. Shows "Finding your match..." (with spinner)
3. System checks queue every 2 seconds for compatible matches
4. When match found → Both users get notified instantly!
5. Chat created automatically

---

## 📝 Setup Steps

### Step 1: Create Match Queue Table

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `supabase-queue-setup.sql` (in your project root)
3. Copy ALL the SQL
4. Paste into Supabase SQL Editor
5. Click **"Run"**

You should see: ✅ "Success. No rows returned"

This creates:
- `match_queue` table to store waiting users
- Indexes for fast queries
- RLS policies for security
- Helper function to clean expired entries

---

### Step 2: Test the Queue System

#### **Test with 2 Users:**

**Browser 1 (Chrome):**
1. Go to `http://localhost:3001/matches`
2. Click "Find a Match"
3. You'll see "Finding your match..." spinner
4. **Leave this running!**

**Browser 2 (Firefox or Incognito):**
1. Open `hooks/use-whop-mock.ts`
2. Change the user ID:
```typescript
user: {
  id: 'test-user-456',  // ← Changed from 123 to 456
  email: 'test2@example.com',
}
```
3. Go to `/profile` and create a profile with similar interests
4. Go to `/matches`
5. Click "Find a Match"

**Result:** Within 2 seconds, **BOTH browsers** should show "Match Found!" 🎉

---

## 🔍 How the Queue Works

### Queue Flow:

```
User A clicks "Find Match"
  ↓
Added to match_queue table (status: 'waiting')
  ↓
System polls every 2 seconds
  ↓
User B clicks "Find Match"
  ↓
Added to queue
  ↓
System finds them compatible!
  ↓
Creates chat
  ↓
Updates both queue entries (status: 'matched')
  ↓
Both see "Match Found!" screen
```

### Database Tables:

**match_queue:**
```sql
id          | UUID
user_id     | TEXT (e.g., "test-user-123")
status      | TEXT ('waiting', 'matched', 'cancelled')
matched_with| TEXT (user_id of match)
match_score | FLOAT (compatibility: 0.0-1.0)
created_at  | TIMESTAMPTZ
matched_at  | TIMESTAMPTZ
expires_at  | TIMESTAMPTZ (10 minutes)
```

---

## ⚙️ API Endpoints

### **POST /api/match/queue**
Join the match queue

**Request:**
```json
{
  "userId": "test-user-123"
}
```

**Response (waiting):**
```json
{
  "status": "waiting",
  "queueId": "uuid-here",
  "message": "Searching for your match..."
}
```

**Response (matched):**
```json
{
  "status": "matched",
  "queueId": "uuid-here",
  "match": {
    "id": "test-user-456",
    "name": "John Doe",
    "bio": "Love crypto!",
    "sharedInterests": ["Crypto", "Trading"],
    "compatibilityScore": 75,
    "chatId": "chat-id-here"
  }
}
```

### **GET /api/match/queue?userId=xxx**
Check queue status (polled every 2 seconds)

### **DELETE /api/match/queue?userId=xxx**
Leave the queue (cancel search)

---

## 🎨 UI States

### **Idle State**
- Shows "Find a Match" button
- User hasn't clicked yet

### **Waiting State**
- Shows spinning loader
- "Finding your match..." text
- Animated pulse dot
- "Cancel Search" button
- **Polls API every 2 seconds**

### **Matched State**
- Shows match details
- Compatibility score
- Shared interests
- "Start Chatting" button

---

## 🔧 Configuration

### Queue Expiration:
Default: **10 minutes**

Change in `supabase-queue-setup.sql`:
```sql
expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
```

### Polling Interval:
Default: **2 seconds**

Change in `app/matches/page.tsx`:
```typescript
const pollInterval = setInterval(async () => {
  // ... polling code
}, 2000); // ← Change this (milliseconds)
```

### Matching Algorithm:
- **Threshold**: 0.2 (20% shared interests)
- **Fallback**: Top 20% of candidates if no good match

---

## 🐛 Troubleshooting

### Queue not working?

**Check SQL ran successfully:**
```sql
-- In Supabase SQL Editor
SELECT * FROM match_queue LIMIT 1;
```

Should return empty result (no error).

**Check queue entries:**
```sql
SELECT * FROM match_queue WHERE status = 'waiting';
```

Should show users waiting for matches.

**Check browser console:**
- Press F12
- Look for errors in Console tab

### Not finding matches?

**Requirements:**
1. Both users need profiles with interests
2. At least 3 interests each
3. Some overlap helps (but not required)

**Force a match:**
Give both users identical interests for testing.

### Match found but no chat?

Check `chats` table:
```sql
SELECT * FROM chats ORDER BY created_at DESC LIMIT 5;
```

Should show new chat with both user_ids.

---

## 🚀 Improvements (Future)

### **Add Real-time Subscriptions**
Instead of polling, use Supabase Realtime:

```typescript
const channel = supabase
  .channel('match-queue')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'match_queue',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.new.status === 'matched') {
      // Match found!
    }
  })
  .subscribe();
```

### **Show Queue Position**
```sql
SELECT COUNT(*) FROM match_queue 
WHERE status = 'waiting' 
AND created_at < (SELECT created_at FROM match_queue WHERE user_id = 'xxx');
```

### **Show Waiting Users Count**
```sql
SELECT COUNT(*) FROM match_queue WHERE status = 'waiting';
```

Display: "5 people waiting..."

### **Match Notifications**
- Email when matched
- Push notifications
- Sound effect

---

## ✅ Testing Checklist

- [ ] SQL script ran successfully
- [ ] `match_queue` table exists
- [ ] Can join queue (see waiting spinner)
- [ ] Can cancel queue
- [ ] Two users match successfully
- [ ] Chat created when matched
- [ ] Compatibility score shows correctly
- [ ] Queue expires after 10 minutes
- [ ] No duplicate matches

---

## 📊 Monitoring

### Check queue activity:
```sql
-- Waiting users
SELECT COUNT(*) FROM match_queue WHERE status = 'waiting';

-- Matched today
SELECT COUNT(*) FROM match_queue 
WHERE status = 'matched' 
AND matched_at > NOW() - INTERVAL '1 day';

-- Average wait time
SELECT AVG(EXTRACT(EPOCH FROM (matched_at - created_at))) as avg_wait_seconds
FROM match_queue 
WHERE status = 'matched';
```

---

**Queue System Complete!** 🎉

Users can now find matches asynchronously - no need to be online at the same time!

