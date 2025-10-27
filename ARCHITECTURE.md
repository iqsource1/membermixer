# Member Mixer - Technical Architecture

## Overview

Member Mixer is a serverless Next.js application built for Whop communities, enabling 1:1 chat matching based on shared interests.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Landing   │  │   Profile    │  │   Chat Window    │   │
│  │    Page    │  │    Setup     │  │  (Real-time)     │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└────────────┬─────────────────────────────────┬─────────────┘
             │                                  │
             │ Whop SDK (Auth)                 │ Pusher Client
             │                                  │
┌────────────▼─────────────────────────────────▼─────────────┐
│                    Next.js App (Vercel)                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Routes (Serverless)                 │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐ ┌────────┐ │  │
│  │  │  Match  │  │Messages │  │ Profile  │ │Webhook │ │  │
│  │  │Algorithm│  │   CRUD  │  │   CRUD   │ │Handler │ │  │
│  │  └────┬────┘  └────┬────┘  └────┬─────┘ └────┬───┘ │  │
│  └───────┼────────────┼────────────┼────────────┼─────┘  │
└──────────┼────────────┼────────────┼────────────┼────────┘
           │            │            │            │
    ┌──────▼────────────▼────────────▼────────────▼──────┐
    │              Vercel KV (Redis)                      │
    │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
    │  │  Users   │  │  Chats   │  │    Messages     │  │
    │  │Profiles  │  │  Active  │  │    History      │  │
    │  └──────────┘  └──────────┘  └─────────────────┘  │
    └─────────────────────────────────────────────────────┘
           │                                      │
    ┌──────▼──────────┐                   ┌──────▼──────────┐
    │   Whop API      │                   │     Pusher      │
    │  (Auth/Pay)     │                   │  (Real-time)    │
    └─────────────────┘                   └─────────────────┘
```

## Core Components

### 1. Frontend (React/Next.js)

**Pages:**
- `/` - Landing page with features and pricing
- `/profile` - Profile creation/editing with interests
- `/matches` - Match finding interface
- `/chat/[id]` - Real-time 1:1 chat
- `/dashboard` - User stats and management

**Components:**
- `ProfileForm` - Interest selection with suggestions
- `MatchButton` - Triggers matching algorithm
- `ChatWindow` - Real-time messaging interface
- UI components from shadcn/ui

### 2. Backend (API Routes)

**Matching Algorithm (`/api/match`):**
```typescript
1. Validate user has profile with interests
2. Check for existing active chat
3. Verify match quota (free: 5/month)
4. Fetch all eligible users from KV
5. Calculate Jaccard similarity for each candidate
6. Return best match (score > 0.2) or random from top 20%
7. Create chat session and update both users
```

**Message Handler (`/api/messages/[chatId]`):**
- GET: Fetch message history (last 50)
- POST: Save message to KV + trigger Pusher event

**Profile Handler (`/api/profile`):**
- GET: Fetch user profile
- POST: Create/update profile with interests

**Webhook Handler (`/api/webhook`):**
- Verify Whop signature
- Process payment events
- Grant unlimited matches on subscription

### 3. Data Layer (Vercel KV)

**Storage Strategy:**
- Key-value pairs for fast lookups
- Lists for message histories
- No complex queries needed

**Schema:**

```typescript
// User profiles
"user:{userId}" → UserProfile

// Active chats (rate limiting)
"activeChat:{userId}" → chatId

// Chat metadata
"chat:{chatId}" → Chat

// Message histories (Redis list)
"messages:{chatId}" → [Message, Message, ...]
```

### 4. Real-time Layer (Pusher)

**Channels:**
- `chat-{chatId}` - Per-chat channel for messages

**Events:**
- `new-message` - Broadcast new messages
- `typing` - Show typing indicators (optional)

**Flow:**
1. User sends message → POST to API
2. API saves to KV → triggers Pusher
3. Pusher broadcasts → other user receives instantly

## Matching Algorithm Deep Dive

### Jaccard Similarity

```typescript
function jaccardSimilarity(setA: string[], setB: string[]): number {
  const intersection = setA.filter(x => setB.includes(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
```

**Example:**
- User A: ["AI", "Crypto", "Trading", "Gaming"]
- User B: ["AI", "Crypto", "NFTs", "Art"]

```
Intersection: ["AI", "Crypto"] = 2 items
Union: 6 unique items
Score: 2/6 = 0.33 (33% compatibility)
```

### Candidate Filtering

**Exclude:**
1. Self
2. Users without completed profiles (< 3 interests)
3. Users with active chats
4. Users matched recently (< 24h, unless unlimited)

**Fallback Logic:**
- If no match meets threshold (0.2), pick random from top 20%
- Ensures users always get matched even with low compatibility
- Weighted by recency to prioritize active users

### Edge Cases

| Scenario | Handling |
|----------|----------|
| < 5 users in community | Show "grow community" message |
| All users have active chats | Queue system or "check back later" |
| User has no interests | Require profile completion |
| Match limit reached | Prompt upgrade to paid |

## Payment Integration

### Tiers

1. **Free**: 5 matches/month
2. **Per Match**: $1 one-time payment
3. **Unlimited**: $19/month subscription

### Whop Checkout Flow

```typescript
// 1. User clicks upgrade
const checkoutUrl = await whop.payments.createCheckout({
  productId: 'mixer-subscription',
  successUrl: '/dashboard',
  cancelUrl: '/matches',
});

// 2. Redirect to Whop
window.location.href = checkoutUrl;

// 3. Whop processes payment

// 4. Webhook receives event
POST /api/webhook
{
  type: 'subscription.created',
  data: { user_id: 'user_123' }
}

// 5. Grant access
await updateUserProfile('user_123', {
  activeSubscription: true,
  hasUnlimitedMatches: true
});
```

## Authentication Flow

Member Mixer uses Whop SDK for authentication:

```typescript
// 1. User lands on protected page
const { user, loading } = useWhop();

// 2. If not authenticated, show sign in
if (!user) {
  const signInUrl = whop.auth.getSignInUrl({
    redirectUri: '/profile'
  });
  window.location.href = signInUrl;
}

// 3. Whop handles OAuth flow

// 4. User redirected back with token

// 5. SDK verifies token and populates user context
```

## Performance Optimizations

### 1. Serverless Functions
- Cold start optimization via minimal dependencies
- Edge functions for low latency (optional)

### 2. KV Caching
- Store user profiles for fast lookup
- Use Redis lists for message pagination
- TTL for temporary data (active chats)

### 3. Real-time Efficiency
- Pusher for websocket management (no custom server)
- Optimistic UI updates
- Message batching for high-volume chats

### 4. Frontend Optimization
- Client-side caching with SWR
- Lazy loading for chat history
- Debounced typing indicators

## Scalability Considerations

### Bottlenecks

1. **Matching Algorithm**
   - O(n) complexity per match request
   - Solution: Cache candidate pools, background processing

2. **KV Storage**
   - Message history growth
   - Solution: Archive old messages, limit history to 500

3. **Pusher Connections**
   - Free tier: 100 concurrent
   - Solution: Upgrade plan or implement reconnection logic

### Scaling Path

**Phase 1 (MVP):** 
- 100 users, 50 concurrent chats
- Current architecture sufficient

**Phase 2 (Growth):**
- 1,000 users
- Add caching layer (Redis cache)
- Batch matching requests

**Phase 3 (Scale):**
- 10,000+ users
- Move to PostgreSQL for relational queries
- Implement message queueing (BullMQ)
- Consider WebSocket server for real-time

## Security

### Authentication
- All routes protected via Whop SDK
- User ID from verified JWT token
- No manual session management

### Data Access
- Users can only access own profile
- Chat access verified via `chat.userIds`
- Messages filtered by chat membership

### Webhooks
- Verify Whop signature on all webhook requests
- Validate event payload structure
- Log suspicious attempts

### Rate Limiting
- 1 active chat per user
- Match cooldown (24h for free tier)
- Message rate limiting (10/second)

## Error Handling

### API Errors

```typescript
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  );
}
```

### Client-side Errors
- Fallback UI for failed API calls
- Retry logic for transient failures
- Offline mode for messages (localStorage)

### Monitoring
- Vercel Analytics for page views
- Function logs for debugging
- Webhook delivery status in Whop dashboard

## Testing Strategy

### Unit Tests (Future)
- Matching algorithm logic
- Jaccard similarity calculations
- Filter functions

### Integration Tests (Future)
- API route handlers
- KV operations
- Webhook processing

### Manual Testing
- Create 5+ test profiles
- Test matching with various interest overlaps
- Verify real-time message delivery
- Test payment flows in sandbox mode

## Future Enhancements

### V2 Features
- [ ] Group chats (3-5 people)
- [ ] Video calls (via WebRTC)
- [ ] Match history and favorites
- [ ] Advanced filters (location, language)
- [ ] In-app notifications
- [ ] Analytics dashboard for creators

### Technical Improvements
- [ ] GraphQL API for flexible queries
- [ ] Background jobs for matching
- [ ] Redis pub/sub for real-time
- [ ] CDN for static assets
- [ ] A/B testing framework

---

## Development Notes

### Local Development
```bash
npm run dev
# Access at http://localhost:3000
```

### Environment Setup
- Use `sandbox` mode for Whop
- Test webhooks with ngrok/localtunnel
- Mock Pusher events for offline dev

### Debugging
- Vercel logs: `vercel logs`
- KV inspection: Vercel dashboard
- Pusher debug console: pusher.com

---

**Last Updated:** October 2025
**Version:** 1.0.0

