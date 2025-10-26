# Frequently Asked Questions

Common questions, troubleshooting, and best practices.

## General Questions

### What makes this template different from others?

**Three key differences:**

1. **Stateless architecture** - No database for auth/billing. JWT carries all user context. This means:
   - Zero latency for authorization checks
   - Infinite horizontal scaling
   - No database to maintain or pay for

2. **Edge-first** - Runs on Cloudflare's global network (300+ cities). Your API responds in ~50ms globally, not just from one region.

3. **Production-ready** - Most templates are "hello world." This has:
   - Complete webhook handling with idempotency
   - Security headers and CORS hardening
   - Rate limiting and tier enforcement
   - Billing portal integration
   - CI/CD pipeline ready

### How much does it cost to run?

**Development:** $0/month
- Cloudflare Workers free tier: 100k req/day
- Cloudflare KV free tier: 100k reads/day, 1k writes/day
- Cloudflare Pages: Free (unlimited)
- Clerk: Free up to 10k MAU
- Stripe: $0 (pay 2.9% + 30¢ per transaction)

**Production (10k active users):**
- Cloudflare Workers: $5/mo (10M requests included)
- Cloudflare KV: ~$1/mo (storage + operations)
- Clerk: $25/mo (10k-50k MAU tier)
- Stripe: 2.9% + 30¢ per transaction
- **Total: ~$31/month + transaction fees**

Compare to typical SaaS stack:
- Vercel: $20/mo
- Supabase/Database: $25/mo
- Redis: $5/mo
- Auth service: $25/mo
- **Total: $75/month before transactions**

### Can I use a different payment provider?

Yes! The architecture is modular. Replace Stripe with:
- **Paddle** - Better for global taxes
- **LemonSqueezy** - Merchant of record
- **PayPal** - Lower fees in some regions

**What to change:**
1. Replace `api/src/stripe-webhook.ts` with your provider's webhook handler
2. Update checkout flow in `api/src/index.ts`
3. Keep the Clerk metadata sync pattern (update `publicMetadata.plan` on payment events)

### Can I add a database?

Absolutely! The template is designed to let you add a database **only for your app-specific data**, not for auth/billing.

**Recommended options:**
- **Cloudflare D1** (SQLite at the edge) - Stays edge-native
- **Neon** (Serverless Postgres) - Low latency from edge
- **PlanetScale** (Serverless MySQL) - Good edge support

**What to store in DB:**
- User-generated content (documents, files, etc.)
- Complex relationships between entities
- Historical data beyond usage counters

**What NOT to store:**
- User credentials (Clerk handles this)
- Subscription status (Stripe handles this)
- JWT tokens (stateless, no storage needed)

### Does this work with other frontend frameworks?

Yes! The backend is framework-agnostic. Replace React with:
- **Next.js** - Use Clerk's Next.js SDK
- **Vue/Nuxt** - Use Clerk's Vue SDK
- **Svelte/SvelteKit** - Use Clerk's Svelte SDK
- **Mobile (React Native)** - Use Clerk's Expo SDK

**Core requirement:** Frontend must send JWT in `Authorization: Bearer <token>` header to API.

### Can I self-host this?

The backend (Cloudflare Worker) can run anywhere that supports edge functions:
- **Cloudflare Workers** (recommended, cheapest)
- **Vercel Edge Functions**
- **Netlify Edge Functions**
- **Deno Deploy**

Convert to Node.js server:
```typescript
import express from 'express';
const app = express();

app.get('/api/data', async (req, res) => {
  // Same logic as Worker handler
  const token = req.headers.authorization?.split('Bearer ')[1];
  // ... JWT verification, usage checks, etc ...
});
```

**Trade-offs:**
- ❌ Lose global edge deployment (single region)
- ❌ Lose zero cold starts
- ❌ Higher hosting costs ($5-20/mo minimum)
- ✅ More control over infrastructure

---

## Technical Questions

### How does JWT routing work?

**Flow:**
1. User signs up → Clerk creates account with `publicMetadata.plan = "free"`
2. Clerk issues JWT with claim: `{ "plan": "free" }`
3. Frontend sends request with JWT
4. Worker verifies JWT and extracts `plan` claim
5. Worker enforces tier limits based on plan

**On upgrade:**
1. Stripe webhook fires after payment
2. Webhook updates Clerk metadata: `publicMetadata.plan = "pro"`
3. Next time Clerk issues JWT (on refresh or new session), it includes `{ "plan": "pro" }`
4. Worker automatically sees updated plan

**Key insight:** No database lookup needed. Plan is embedded in the JWT itself.

### Why do I need to refresh after upgrading?

JWTs are cached by Clerk for performance (typically 60 seconds). After upgrading:

1. Webhook updates Clerk metadata immediately
2. User's current JWT still has old `plan` claim (cached)
3. Refresh forces Clerk to issue new JWT with updated plan

**Solutions:**
- **Manual refresh** (current approach) - Simple, user refreshes browser
- **Auto-refresh** (future enhancement) - Listen for Clerk JWT expiry and auto-refresh:
  ```typescript
  const { getToken } = useAuth();
  useEffect(() => {
    const interval = setInterval(async () => {
      await getToken({ template: 'pan-api', skipCache: true });
    }, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);
  ```

### What's the difference between rate limiting and tier limits?

**Rate limiting (100 req/min):**
- **Purpose:** Security (prevent abuse)
- **Scope:** All users, all tiers
- **Resets:** Every minute
- **Enforced by:** IP + userId combination

**Tier limits (5/month, 100/month, etc.):**
- **Purpose:** Business logic (monetization)
- **Scope:** Per-tier configuration
- **Resets:** Monthly billing cycle
- **Enforced by:** `TIER_CONFIG` in code

**Example:**
- Free user: Max 100 req/min, max 5/month total
- Pro user: Max 100 req/min, unlimited total

### How secure is storing plan in JWT?

**Very secure, if done correctly.**

**Potential attack:** User tries to modify JWT to fake "pro" plan

**Why it fails:**
1. JWT is cryptographically signed by Clerk using secret key
2. Worker verifies signature using `CLERK_SECRET_KEY`
3. If signature doesn't match payload → Rejected (401 Unauthorized)
4. User cannot forge signature without secret key

**Best practices:**
- ✅ Store secret key in Cloudflare Worker secrets (not in code)
- ✅ Use `getToken({ template: 'pan-api' })` in frontend (never construct JWT manually)
- ✅ Verify JWT on every API request (never trust client-side claims)

### Can users downgrade from paid to free?

Yes! When they cancel subscription:

1. User cancels in Stripe Customer Portal
2. Stripe fires `customer.subscription.deleted` webhook
3. Webhook updates Clerk metadata: `publicMetadata.plan = "free"`
4. Next JWT refresh includes "free" plan
5. Usage limits automatically enforced again

**Prorated refunds:**
- Stripe handles refund logic (configurable in Stripe Dashboard)
- Options: Immediate cancellation vs end of billing period
- Set in Stripe → Settings → Billing → Portal → Cancellation policy

### What happens to usage counters when upgrading?

**Current behavior:** Usage counter persists across tier changes.

**Example:**
- Free user: 3 requests made (3/5)
- Upgrades to Pro: Counter shows 3 requests (unlimited plan)
- Downgrade to Free: Counter still at 3 (2 remaining)

**Alternative behavior** (reset on upgrade):
```typescript
// In webhook handler after updating plan
await env.USAGE_KV.put(`usage:${userId}`, JSON.stringify({
  usageCount: 0,  // ← Reset counter
  plan: 'pro',
  lastUpdated: new Date().toISOString(),
  periodStart: new Date().toISOString(),
  periodEnd: /* 30 days from now */
}));
```

---

## Troubleshooting

### "Invalid JWT" or 401 errors

**Causes:**
1. JWT template not configured in Clerk
2. Wrong `CLERK_SECRET_KEY` in Worker
3. JWT expired (rare, default 7 days)

**Fixes:**
1. Check Clerk Dashboard → JWT Templates → Verify `pan-api` exists
2. Verify secret key starts with `sk_test_` or `sk_live_`
3. Sign out and sign back in to get fresh JWT

**Debug:**
```bash
# Check JWT contents (decode, don't verify)
echo "YOUR_JWT_TOKEN" | jq -R 'split(".") | .[1] | @base64d | fromjson'

# Should show:
# {
#   "userId": "user_...",
#   "plan": "free"
# }
```

---

### Webhook not firing / Plan not updating

**Symptom:** Successful payment but user still on Free tier

**Checklist:**
- [ ] Stripe CLI running locally? (`stripe listen --forward-to ...`)
- [ ] Webhook secret in `.dev.vars` matches CLI output?
- [ ] Stripe product has metadata: `{ "plan": "pro" }`?
- [ ] Webhook endpoint returns 200 (check logs)?

**Debug production webhooks:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click your endpoint → **Attempted Events** tab
3. Check for 4xx or 5xx errors
4. Click event → View raw request/response

**Common issues:**
- Webhook secret mismatch → Re-copy `whsec_...` to Worker secrets
- Product metadata missing → Add `plan` key to Stripe product metadata
- CORS blocking webhook → Remove CORS checks for `/webhook/stripe` endpoint

---

### "Price ID not configured" error

**Symptom:** Clicking "Upgrade to Pro" fails immediately

**Cause:** Missing environment variable

**Fix:**
1. Check `api/.dev.vars` has `STRIPE_PRICE_ID_PRO=price_...`
2. Verify price ID is correct (copy from Stripe Dashboard → Products)
3. Restart backend (`npm run dev` in api folder)

**Production fix:**
```bash
wrangler secret put STRIPE_PRICE_ID_PRO
# Paste price ID when prompted
```

---

### CORS errors in browser console

**Symptom:** `Access to fetch at 'http://localhost:8787' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Cause:** Allowed origins not configured

**Fix:**
1. Add to `api/.dev.vars`:
   ```bash
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
2. Restart backend

**Production fix:**
```bash
wrangler secret put ALLOWED_ORIGINS
# Enter: https://yourdomain.com
```

---

### KV namespace errors

**Symptom:** `Error: KV namespace not found`

**Cause:** KV binding not configured

**Fix:**
1. Create KV namespace:
   ```bash
   cd api
   wrangler kv:namespace create USAGE_KV
   ```
2. Copy `id` from output
3. Update `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "USAGE_KV"
   id = "abc123..."
   ```

---

### Billing Portal won't open

**Symptom:** Clicking "Manage Billing" does nothing or shows error

**Causes:**
1. Portal not enabled in Stripe
2. Missing `STRIPE_PORTAL_CONFIG_ID`
3. User doesn't have Stripe customer ID yet

**Fixes:**
1. Enable portal: Stripe Dashboard → Settings → Billing → Portal → Enable
2. Add config ID to `.dev.vars`: `STRIPE_PORTAL_CONFIG_ID=bpc_...`
3. User must complete at least one payment first (portal only works for existing customers)

---

### Rate limit errors (429) on every request

**Symptom:** Even first request returns 429

**Cause:** Rate limiter using wrong key (likely global instead of per-user)

**Debug:**
Check `api/src/index.ts` rate limiter key:
```typescript
const rateLimitKey = `ratelimit:${userId}:${minute}`;  // ← Should include userId
```

If it's:
```typescript
const rateLimitKey = `ratelimit:${minute}`;  // ← Wrong! Global limit
```

This would rate-limit ALL users together.

---

### Usage counter not incrementing

**Symptom:** Make request, counter stays at 0

**Cause:** KV write failing silently

**Debug:**
1. Check Worker logs: `wrangler tail`
2. Look for KV errors
3. Verify KV binding name matches `wrangler.toml`:
   ```typescript
   await env.USAGE_KV.put(...)  // ← 'USAGE_KV' must match binding name
   ```

---

### Test card declined

**Symptom:** Stripe checkout fails with "Card declined"

**Cause:** Using real card in test mode (or vice versa)

**Test mode cards:**
- ✅ Success: `4242 4242 4242 4242`
- ❌ Declined: `4000 0000 0000 0002`
- ⚠️ Requires auth: `4000 0025 0000 3155`

**Check mode:**
Stripe Dashboard top-left should show "Test Mode" or "Live Mode"

---

## Best Practices

### When to add a database

**Don't add DB for:**
- User authentication (Clerk handles it)
- Subscription status (Stripe handles it)
- Simple usage counters (KV is perfect)

**Add DB when you need:**
- User-generated content (documents, files, posts)
- Complex queries (search, filters, joins)
- Relationships between entities
- More than 1 GB of data (KV limit)

### Handling high traffic

**Built-in scaling:**
- Workers auto-scale to millions of requests
- KV globally replicates reads (fast)
- Clerk handles auth traffic separately

**Bottlenecks:**
1. **KV writes** (1k/day free) → Upgrade to paid ($5/mo = 1M writes)
2. **Clerk API calls** (webhook metadata updates) → Rarely hit limits
3. **Stripe webhooks** (sequential processing) → Consider queue for >100 req/sec

**Optimization:**
- Cache usage data in Worker memory for 1 minute (reduce KV reads)
- Batch KV writes (update counter every 10 requests instead of every request)
- Use Cloudflare Durable Objects for real-time features

### Security checklist

- [ ] Environment variables in Worker secrets (not `.dev.vars` in production)
- [ ] Webhook signature verification enabled
- [ ] CORS restricted to your domain (no wildcards)
- [ ] Rate limiting enabled
- [ ] JWT verification on every API request
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Bot Fight Mode enabled in Cloudflare
- [ ] Stripe in live mode with real keys
- [ ] Email verification enabled in Clerk

### Monitoring setup

**Essential metrics:**
1. **Error rate** (should be <1%)
   - Monitor via Cloudflare Workers dashboard
   - Set up alerts for 5xx errors

2. **Webhook success rate** (should be 100%)
   - Check Stripe Dashboard → Webhooks → Attempted Events
   - Alert on any failures

3. **Sign-up conversion** (industry avg: 2-5%)
   - Track in Clerk Dashboard
   - Optimize if below 2%

4. **MRR (Monthly Recurring Revenue)**
   - Track in Stripe Dashboard
   - Set growth goals

**Optional (advanced):**
- Sentry for error tracking
- Plausible/Fathom for privacy-friendly analytics
- Axiom/Logflare for structured logs

---

## Migration & Upgrades

### Migrating from another auth provider

**From Firebase Auth:**
1. Export users via Firebase Admin SDK
2. Import to Clerk via Clerk API (batch import)
3. Users will need to reset passwords (email link)

**From Auth0/Okta:**
1. Use Clerk's bulk user import API
2. Map user metadata to `publicMetadata.plan`
3. Test migration with 10 users first

### Migrating from another billing provider

**From Gumroad/Paddle:**
1. Export customer list with subscription status
2. Create Stripe customers via Stripe API
3. Set up subscriptions manually or send checkout links
4. Update Clerk metadata to match new subscriptions

**From in-house billing:**
1. Keep old billing for existing customers (grandfather)
2. Use Stripe for new sign-ups only
3. Gradually migrate existing customers over 3-6 months

### Updating to latest template version

**Check for updates:**
```bash
git remote add template https://github.com/ORIGINAL-REPO-URL.git
git fetch template
git log --oneline template/main..HEAD
```

**Merge updates:**
```bash
git merge template/main
# Resolve conflicts (likely in wrangler.toml, .dev.vars)
```

**Test thoroughly after merging!**

---

## Getting Help

### Where to find answers

1. **This FAQ** - Start here
2. **GitHub Issues** - Search for similar problems
3. **Clerk Docs** - https://clerk.com/docs
4. **Stripe Docs** - https://stripe.com/docs
5. **Cloudflare Docs** - https://developers.cloudflare.com

### Reporting bugs

Open a GitHub issue with:
- **Environment:** Local or production
- **Error message:** Full text from console/logs
- **Steps to reproduce:** Numbered list
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens

### Feature requests

Open a GitHub issue with:
- **Use case:** Why you need this feature
- **Proposed solution:** How you'd implement it
- **Alternatives:** What you've tried instead

---

**Next Steps:**
- [Setup Guide](setup.md) - Get started locally
- [Testing Guide](testing.md) - Test your deployment
- [Architecture Guide](architecture.md) - Understand the system
