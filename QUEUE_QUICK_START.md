# Queue System - Quick Start ⚡

## 🚀 Get It Running in 3 Minutes

### Step 1: Add the Queue Table (1 minute)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** → **New query**
3. Open the file `supabase-queue-setup.sql` in your project
4. Copy the entire SQL
5. Paste it and click **"Run"**

✅ You should see "Success. No rows returned"

---

### Step 2: Test It! (2 minutes)

**Terminal:**
```bash
npm run dev
```

**Browser 1 (You - User A):**
1. Go to `http://localhost:3001/matches`
2. Click **"Find a Match"**
3. See the spinning loader: "Finding your match..."
4. **Leave this running!**

**Browser 2 (Test User B):**
1. Open **Firefox** or **Chrome Incognito**
2. Edit `hooks/use-whop-mock.ts`:
```typescript
user: {
  id: 'test-user-456',  // Changed!
  email: 'test2@example.com',
}
```
3. Go to `http://localhost:3001/profile`
4. Create a profile (name + 3 interests - use similar ones to User A)
5. Go to `/matches`
6. Click **"Find a Match"**

**Result:** Within 2 seconds, BOTH browsers show **"Match Found!"** 🎉

---

## ✨ What's New

### **Before (Old System):**
- Both users had to click at exact same time
- Instant match or nothing

### **After (Queue System):**
- Click anytime, get added to queue
- System finds matches automatically
- Real-time updates every 2 seconds
- Can cancel search
- Shows waiting animation

---

## 🎯 Key Features

✅ **Asynchronous Matching** - No need to be online simultaneously  
✅ **Smart Algorithm** - Finds best compatibility match  
✅ **Real-time Updates** - Polls every 2 seconds  
✅ **Cancel Anytime** - Leave queue with one click  
✅ **10 Minute Timeout** - Auto-expire to keep queue fresh  
✅ **Beautiful UI** - Spinning loader + status messages  

---

## 📱 User Flow

```
1. User clicks "Find Match"
   ↓
2. Added to queue (status: waiting)
   ↓
3. Shows: "Finding your match..." 🔄
   ↓
4. System polls every 2 seconds
   ↓
5. Compatible user found!
   ↓
6. Creates chat automatically
   ↓
7. Both users see: "Match Found!" ❤️
   ↓
8. Click "Start Chatting"
```

---

## 🔍 Check If It's Working

### In Supabase Table Editor:

**View the queue:**
```sql
SELECT * FROM match_queue ORDER BY created_at DESC;
```

You'll see:
- `status`: 'waiting' or 'matched'
- `user_id`: Who's in queue
- `matched_with`: Who they matched with
- `match_score`: Compatibility (0.0 - 1.0)

---

## 🎨 UI States

| State | What You See |
|-------|-------------|
| **Idle** | "Find a Match" button |
| **Waiting** | Spinner + "Finding your match..." + Cancel button |
| **Matched** | Match details + "Start Chatting" button |

---

## ⚙️ Configuration

### Change poll speed:
`app/matches/page.tsx` line ~84:
```typescript
}, 2000); // 2 seconds - make it 1000 for 1 second
```

### Change queue timeout:
`supabase-queue-setup.sql`:
```sql
expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
-- Change to '5 minutes' or '30 minutes'
```

---

## 🐛 Quick Troubleshooting

**"No match found" after minutes?**
- Make sure both users have interests
- Try giving them identical interests
- Check browser console (F12) for errors

**Spinner keeps going forever?**
- Check Supabase SQL ran successfully
- Verify `match_queue` table exists
- Look for console errors

**Match found but can't chat?**
- Check `chats` table has the entry
- Verify both user IDs are in `user_ids` array

---

## ✅ You're Done!

The queue system is now live! Users can find matches asynchronously. 🎉

**Next Steps:**
- Add Whop authentication (real users)
- Deploy to Vercel
- Test with real users!

See **QUEUE_SYSTEM_SETUP.md** for full technical details.

