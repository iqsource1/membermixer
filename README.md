# Member Mixer

A Next.js app for 1:1 chat matching in Whop communities. Connect members based on shared interests through intelligent matching and real-time messaging.

## Features

- 🎯 **Smart Matching Algorithm**: Uses Jaccard similarity to match users based on interests
- 💬 **Real-time Chat**: Powered by Supabase Realtime for instant messaging
- 📎 **File Attachments**: Send images and PDFs in chats
- 🖼️ **Profile Avatars**: Upload custom profile pictures
- 🔐 **Whop SDK Integration**: Seamless authentication and payment processing
- 📊 **User Dashboard**: Track matches and manage profile
- 💳 **Flexible Pricing**: Free tier (5 matches/month), pay-per-match ($1), or unlimited ($19/mo)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase Postgres
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Authentication**: Whop SDK
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Whop account and app credentials
- Supabase account (free tier works)
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd membermixr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Whop Configuration
NEXT_PUBLIC_WHOP_CLIENT_ID=your_whop_client_id
WHOP_SECRET_KEY=your_whop_secret_key
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret
NEXT_PUBLIC_WHOP_ENVIRONMENT=sandbox  # or 'production'

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setting Up Services

#### 1. Whop Setup

1. Go to [Whop Developer Portal](https://whop.com/developers)
2. Create a new app
3. Get your Client ID and Secret Key
4. Set up OAuth redirect URI: `http://localhost:3000/auth/callback` (for dev)
5. Create webhook endpoint: `https://your-domain.com/api/webhook`

#### 2. Supabase Setup

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
4. Copy your Project URL and anon key to `.env`

**Important**: Run the SQL setup script from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create tables and configure security policies.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import to Vercel:
```bash
npm i -g vercel
vercel
```

3. Add environment variables in Vercel dashboard (Settings → Environment Variables)

4. Set up KV database in Vercel:
   - Go to Storage tab
   - Create KV database
   - Environment variables auto-populate

5. Configure Whop webhook:
   - Update webhook URL to: `https://your-domain.vercel.app/api/webhook`
   - Add webhook secret to environment variables

### Post-Deployment

1. Update OAuth redirect URIs in Whop dashboard
2. Test authentication flow
3. Test webhook by making a test payment
4. Monitor logs in Vercel dashboard

## Project Structure

```
membermixr/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── end/route.ts        # End chat API
│   │   ├── match/route.ts          # Matching algorithm API
│   │   ├── messages/[chatId]/      # Message operations
│   │   ├── profile/route.ts        # Profile management
│   │   └── webhook/route.ts        # Whop webhook handler
│   ├── chat/[id]/page.tsx          # Chat interface
│   ├── dashboard/page.tsx          # User dashboard
│   ├── matches/page.tsx            # Match finding page
│   ├── profile/page.tsx            # Profile setup/edit
│   ├── layout.tsx                  # Root layout with Whop provider
│   ├── page.tsx                    # Landing page
│   └── globals.css                 # Global styles
├── components/
│   ├── providers/
│   │   └── whop-provider.tsx       # Whop SDK provider
│   ├── ui/                         # shadcn/ui components
│   ├── chat-window.tsx             # Real-time chat component
│   ├── match-button.tsx            # Match finding button
│   └── profile-form.tsx            # Profile creation form
├── hooks/
│   └── use-pusher.ts               # Pusher hook
├── lib/
│   ├── kv.ts                       # Vercel KV operations
│   ├── matching.ts                 # Matching algorithm
│   ├── pusher.ts                   # Pusher config
│   ├── utils.ts                    # Utility functions
│   └── whop.ts                     # Whop SDK instances
└── package.json
```

## Matching Algorithm

The app uses **Jaccard similarity** to calculate compatibility between users:

```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

Where A and B are sets of user interests.

### Algorithm Flow:

1. Fetch all active users with completed profiles
2. Filter out:
   - Current user
   - Users with active chats
   - Users matched recently (< 24h)
3. Calculate compatibility scores
4. Return best match (threshold > 0.2) or random from top 20%

## API Routes

### POST `/api/match`
Find a match for a user.

**Body:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "match": {
    "id": "user_456",
    "name": "John Doe",
    "sharedInterests": ["AI & ML", "Crypto"],
    "compatibilityScore": 75
  },
  "chatId": "user_123:user_456"
}
```

### POST `/api/messages/[chatId]`
Send a message in a chat.

**Body:**
```json
{
  "userId": "user_123",
  "text": "Hello!"
}
```

### GET `/api/messages/[chatId]`
Get chat message history.

### POST `/api/profile`
Create or update user profile.

**Body:**
```json
{
  "userId": "user_123",
  "name": "John Doe",
  "bio": "Love crypto and AI",
  "interests": ["AI & ML", "Crypto", "Trading"]
}
```

### POST `/api/webhook`
Handle Whop payment webhooks.

## Payment Integration

### Whop Checkout Flow:

1. User reaches match limit
2. Show upgrade options
3. Create checkout session via Whop SDK
4. Redirect to Whop checkout
5. Handle webhook to grant access
6. User can continue matching

### Event Types:

- `checkout.completed` - Grant access after one-time purchase
- `subscription.created` - Enable unlimited matches
- `subscription.cancelled` - Revert to free tier

## Database Schema (Supabase Postgres)

### profiles
```sql
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_path TEXT,
  matches_used INTEGER DEFAULT 0,
  has_unlimited_matches BOOLEAN DEFAULT FALSE,
  active_subscription BOOLEAN DEFAULT FALSE,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### chats
```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
```

### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT REFERENCES chats(id),
  user_id TEXT NOT NULL,
  text TEXT,
  attachment_path TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Buckets

- **chat-attachments**: Store images and PDFs sent in chats (max 10MB)
- **user-profiles**: Store user avatar images (max 2MB)

## Troubleshooting

### Whop SDK Issues

- Ensure `NEXT_PUBLIC_WHOP_CLIENT_ID` is set correctly
- Check OAuth redirect URIs match exactly
- Verify webhook secret matches Whop dashboard

### Supabase Connection Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project status (must be active)
- Ensure database tables exist (run SQL from SUPABASE_SETUP.md)
- Check RLS policies are configured correctly

### Supabase Realtime Not Working

- Enable replication for `messages` table in Supabase dashboard
- Check browser console for WebSocket errors
- Verify anon key has correct permissions

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next`
- Check for TypeScript errors: `npm run build`

## License

MIT

## Support

For issues or questions:
- Open an issue on GitHub
- Check [Whop Docs](https://docs.whop.com)
- Join the Whop Discord community

---

Built with ❤️ for Whop communities

