# Architecture Overview

## Core Principles

This SaaS starter is built on three architectural pillars:

1. **Stateless Authentication** - JWT tokens carry all user context (no sessions, no cookies)
2. **Edge-Native** - Runs on Cloudflare's global network (300+ cities, zero cold starts)
3. **No Database** - Identity in Clerk, billing in Stripe, usage counters in KV

## Data Flow: JWT-Based Stateless Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER AUTHENTICATES                          │
│                     (Clerk Sign-In Flow)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│                   CLERK ISSUES JWT TOKEN                         │
│                                                                   │
│  Token Payload:                                                  │
│  {                                                                │
│    "userId": "user_abc123",                                      │
│    "plan": "free"  ← from user.public_metadata                  │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND STORES TOKEN IN MEMORY                     │
│              (ClerkProvider auto-manages)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│           USER MAKES API REQUEST WITH JWT                        │
│                                                                   │
│  GET /api/data                                                    │
│  Authorization: Bearer <jwt_token>                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│        CLOUDFLARE WORKER VERIFIES JWT & EXTRACTS CLAIMS         │
│                                                                   │
│  const { userId, plan } = verifyToken(token)                     │
│  const limit = TIER_LIMITS[plan]  // "free" → 5, "pro" → ∞     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│           WORKER CHECKS USAGE IN CLOUDFLARE KV                  │
│                                                                   │
│  const usage = await KV.get(`usage:${userId}`)                  │
│  if (usage.count >= limit) return 429 Rate Limited              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│              PROCESS REQUEST & INCREMENT COUNTER                 │
│                                                                   │
│  await KV.put(`usage:${userId}`, count + 1)                     │
│  return 200 Success                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           WHEN USER UPGRADES (STRIPE WEBHOOK)                    │
│                                                                   │
│  1. User completes Stripe checkout                               │
│  2. Stripe sends webhook → Worker verifies signature             │
│  3. Worker updates Clerk metadata: { plan: "pro" }              │
│  4. Next JWT refresh includes plan: "pro"                        │
│  5. Unlimited usage automatically enabled                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### Why JWT as Single Source of Truth?

**Traditional approach:**
```
Request → Verify auth → Query DB for user plan → Check limits → Process
```

**This approach:**
```
Request → Verify JWT (plan included) → Check limits → Process
```

**Benefits:**
- Zero database lookups for authorization
- Works perfectly on edge (no DB connection needed)
- Scales infinitely (stateless)
- Plan changes sync automatically via JWT refresh

### Why No Database?

**What we DON'T need a database for:**
- ✅ User identity → Clerk stores it
- ✅ Subscription status → Stripe stores it
- ✅ Payment history → Stripe stores it
- ✅ Usage counters → Cloudflare KV (key-value store)

**When you WOULD add a database:**
- User-generated content (documents, files, etc.)
- Complex relationships between entities
- Full-text search requirements
- Historical analytics beyond usage counts

The template is designed to let you add a database ONLY for your app-specific data, not for auth/billing infrastructure.

## Component Responsibilities

### Frontend (React + Vite)
- **Role**: Pure presentation layer
- **Auth**: ClerkProvider handles sign-in/sign-up
- **Data**: Fetches from API with JWT in Authorization header
- **Routing**: Public pages (landing) vs protected pages (dashboard)
- **Hosting**: Cloudflare Pages (static CDN)

### Backend (Cloudflare Worker)
- **Role**: Stateless API + webhook handler
- **Auth**: Verifies JWT on every request
- **Logic**: Enforces tier limits, tracks usage
- **Storage**: Writes usage counters to KV
- **Webhooks**: Syncs Stripe events to Clerk metadata

### Clerk (Auth Provider)
- **Role**: Identity management
- **Features**: Sign-up, sign-in, email verification
- **JWT**: Issues tokens with user metadata
- **Metadata**: Stores `publicMetadata.plan` (free, pro, etc.)

### Stripe (Payment Provider)
- **Role**: Subscription billing
- **Features**: Checkout, customer portal, webhooks
- **Products**: Each tier is a Stripe product/price
- **Webhooks**: Notifies our API of subscription changes

### Cloudflare KV (Key-Value Store)
- **Role**: Persistent storage for usage counters
- **Schema**: `usage:{userId}` → `{ usageCount, plan, periodStart, periodEnd }`
- **Performance**: Eventually consistent, globally replicated
- **Cost**: First 100k reads/day free

## Security Model

### Authentication Flow
1. User signs in via Clerk
2. Clerk issues JWT signed with secret key
3. Frontend includes JWT in `Authorization: Bearer <token>` header
4. Worker verifies JWT signature using `CLERK_SECRET_KEY`
5. If valid, extracts `userId` and `plan` from claims

### Authorization Flow
1. Extract `plan` from verified JWT
2. Look up tier limit from `TIER_CONFIG`
3. Fetch usage from KV for this user
4. Allow/deny based on `usageCount < limit`

### Webhook Security
1. Stripe sends webhook with `Stripe-Signature` header
2. Worker reconstructs signature using `STRIPE_WEBHOOK_SECRET`
3. Compares signatures - if mismatch, reject (prevents spoofing)
4. Uses idempotency keys to prevent duplicate processing

### CORS Hardening
- No wildcard (`*`) origins
- Validates origin against `ALLOWED_ORIGINS` environment variable
- Returns proper CORS headers only for approved origins

### Rate Limiting
- Global rate limit: 100 requests/minute per user (security)
- Tier limits: 5/month (free), unlimited (pro) - business logic
- Separate concerns: Rate limiting prevents abuse, tier limits enforce business rules

## File Structure

```
clerk-exp/
├── api/                        # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts           # Main API (830+ lines, documented)
│   │   └── stripe-webhook.ts  # Webhook handler (190+ lines)
│   ├── wrangler.toml          # Worker config + KV bindings
│   └── .dev.vars              # Local secrets (gitignored)
│
├── frontend-v2/                # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx    # Public landing + pricing
│   │   │   ├── Dashboard.tsx  # Protected dashboard
│   │   │   ├── SignInPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   ├── App.tsx            # Router + protected routes
│   │   └── main.tsx           # Entry + ClerkProvider
│   └── vite.config.ts
│
├── docs/                       # Documentation
└── README.md                  # Quick start guide
```

## How to Extend This Architecture

### Adding Your Application Logic

The template provides the **infrastructure layer** (auth + billing + routing). Your app logic plugs in as additional API endpoints:

**Example: Add a document processing endpoint**

```typescript
// api/src/index.ts

if (url.pathname === '/api/process-document' && request.method === 'POST') {
  // JWT already verified, userId and plan extracted

  // Check tier limits (already done by middleware)
  const tierLimit = TIER_CONFIG[plan]?.limit || 0;
  if (tierLimit !== Infinity && usageData.usageCount >= tierLimit) {
    return new Response(JSON.stringify({ error: 'Tier limit reached' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // YOUR APP LOGIC HERE
  const document = await request.json();
  const result = await processDocument(document, plan);

  // Increment usage counter
  usageData.usageCount += 1;
  await env.USAGE_KV.put(`usage:${userId}`, JSON.stringify(usageData));

  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**Key benefits of this separation:**
- ✅ Auth/billing handled before your code runs
- ✅ `userId` and `plan` available in scope
- ✅ Usage tracking integrated
- ✅ Error handling consistent

### Adding a Database (When You Need One)

If your app needs persistent storage:

1. **Add Cloudflare D1** (SQLite at the edge) or external DB
2. **Update `wrangler.toml`** with database binding
3. **Create tables** for YOUR app data (not auth/billing)
4. **Query in your endpoints** using the userId from JWT

```typescript
// Example with D1
const documents = await env.DB.prepare(
  'SELECT * FROM documents WHERE user_id = ?'
).bind(userId).all();
```

The JWT still handles auth/billing. Database only stores your app's domain data.

## Performance Characteristics

### Cold Starts
**Zero.** Cloudflare Workers are always warm. No Lambda-style cold starts.

### Global Latency
**~50ms** globally. Worker runs in 300+ cities, responds from nearest location.

### JWT Verification
**~2ms** per request. Clerk's JWK verification is cached.

### KV Reads
**~10-30ms** globally (eventually consistent, read from nearest location).

### KV Writes
**~100-200ms** (globally replicated writes).

### Webhook Processing
**~200-500ms** (includes Clerk API call to update metadata).

## Scalability

### Request Capacity
- **Free tier**: 100k requests/day
- **Paid tier**: 10M requests/month ($5/mo)
- **Beyond that**: $0.50 per additional 1M requests

### KV Storage
- **Free tier**: 1 GB storage
- **Operations**: 100k reads/day, 1k writes/day free
- **Typical usage**: 1 user = ~500 bytes → 2M users fit in free tier

### Bottlenecks
1. **KV write limits** (1k/day free) - upgrade to paid ($5/mo = 1M writes)
2. **Clerk API rate limits** (during webhook processing) - rarely hit in practice
3. **Stripe webhook processing** - Cloudflare auto-scales, not an issue

## Monitoring & Observability

### Built-in Dashboards
- **Clerk Dashboard**: User sign-ups, active sessions, JWT issuance
- **Stripe Dashboard**: Subscription events, revenue, failed payments
- **Cloudflare Dashboard**: Request volume, errors, KV operations

### What's NOT Included (Add Yourself)
- ❌ Error tracking (add Sentry or Cloudflare Logs)
- ❌ Custom analytics (add Plausible or Cloudflare Web Analytics)
- ❌ Audit logs (log plan changes to external service)

---

**Next Steps:**
- [Setup Guide](setup.md) - Configure Clerk, Stripe, and deploy
- [Testing Guide](testing.md) - Verify end-to-end flows
- [Tier Customization](tier-customization.md) - Add more pricing tiers
