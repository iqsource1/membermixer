# Quick Start Guide

Get Member Mixer running locally in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Accounts: Whop (free), Pusher (free), Vercel (free)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

```bash
cp env.local.example .env.local
```

### 3. Get Whop Credentials

1. Go to https://whop.com/developers
2. Click "Create App"
3. Name: "Member Mixer Dev"
4. Copy **Client ID** and **Secret Key**
5. Add to `.env.local`:
```env
NEXT_PUBLIC_WHOP_CLIENT_ID=your_client_id
WHOP_SECRET_KEY=your_secret_key
NEXT_PUBLIC_WHOP_ENVIRONMENT=sandbox
```

### 4. Get Pusher Credentials

1. Go to https://pusher.com/channels
2. Create account (free)
3. Create new app: "member-mixer"
4. Copy credentials from "App Keys" tab
5. Add to `.env.local`:
```env
NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
PUSHER_APP_ID=your_app_id
PUSHER_APP_SECRET=your_app_secret
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

### 5. Set Up Local KV (Optional for Dev)

For local development, you can:

**Option A: Use Vercel KV (Recommended)**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Create KV: `vercel storage create kv`
5. Pull env vars: `vercel env pull .env.local`

**Option B: Mock KV (Quick Test)**
- The app will work without real KV for initial testing
- Some features may not persist data

### 6. Run the App

```bash
npm run dev
```

Open http://localhost:3000

## First Test

### Create Profile
1. Visit http://localhost:3000/profile
2. Enter name: "Test User"
3. Add interests: "AI", "Crypto", "Trading"
4. Click "Save Profile"

### Test Matching (Need 2+ Users)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2 (Different Browser/Incognito):**
- Create another profile with overlapping interests
- Click "Find Match"
- Should match with first user

### Test Chat
1. After match found, click "Start Chatting"
2. Send messages from both windows
3. Verify real-time delivery

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Whop Auth Not Working
- Check `NEXT_PUBLIC_WHOP_CLIENT_ID` is correct
- Verify you're using `sandbox` environment
- Clear browser cache and cookies

### Pusher Connection Failed
- Verify all 4 Pusher env vars are set
- Check app key matches cluster
- Try creating new Pusher app

### KV Errors
- If using Vercel KV, ensure you're logged in
- Check all KV env vars are present
- Try `vercel env pull` again

### Build Errors
```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

## Development Tips

### Hot Reload
- Next.js auto-reloads on file changes
- API routes need manual refresh

### View Logs
```bash
# In terminal running dev server
# All console.log and errors appear here
```

### Test Multiple Users

**Option 1: Multiple Browsers**
- Chrome (normal)
- Chrome (incognito)
- Firefox

**Option 2: Multiple Ports**
```bash
# Terminal 1
npm run dev

# Terminal 2
PORT=3001 npm run dev
```

### Mock Data

Create test profiles programmatically:

```typescript
// In API route or script
const testUsers = [
  { name: "Alice", interests: ["AI", "Crypto"] },
  { name: "Bob", interests: ["AI", "Gaming"] },
  { name: "Carol", interests: ["Crypto", "Trading"] },
];

for (const user of testUsers) {
  await fetch('http://localhost:3000/api/profile', {
    method: 'POST',
    body: JSON.stringify({ userId: `test_${user.name}`, ...user }),
  });
}
```

## Next Steps

1. ✅ App running locally
2. 📝 Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
3. 🚀 Deploy to Vercel: [DEPLOYMENT.md](./DEPLOYMENT.md)
4. 💡 Customize features for your community

## Common Tasks

### Add New Interest Tag
Edit `components/profile-form.tsx`:
```typescript
const SUGGESTED_INTERESTS = [
  // ... existing
  'Your New Interest',
];
```

### Change Free Match Limit
Edit `lib/matching.ts`:
```typescript
const freeMatchLimit = 10; // Change from 5 to 10
```

### Adjust Match Threshold
Edit `lib/matching.ts`:
```typescript
const threshold = 0.1; // Lower = more lenient matching
```

### Customize Colors
Edit `app/globals.css`:
```css
:root {
  --primary: 262.1 83.3% 57.8%; /* Purple by default */
}
```

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Whop SDK**: https://docs.whop.com/reference/whop-sdk
- **Pusher Docs**: https://pusher.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

## Get Help

- 📖 Check README.md for full documentation
- 🐛 Issues? Open GitHub issue
- 💬 Join Whop Discord community
- 📧 Contact: [your-email]

---

Happy coding! 🚀

