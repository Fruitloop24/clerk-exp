# Testing Guide

Comprehensive testing checklist for local development and production deployment.

## Local Testing Setup

### Required: 3 Terminals

You need three processes running simultaneously for local development:

**Terminal 1 - Backend API:**
```bash
cd api
npm run dev
# Runs on http://localhost:8787
```

**Terminal 2 - Frontend:**
```bash
cd frontend-v2
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 - Stripe Webhook Forwarder:**
```bash
stripe listen --forward-to http://localhost:8787/webhook/stripe
# Copy the whsec_... signing secret to api/.dev.vars
```

**Important:** After setting `STRIPE_WEBHOOK_SECRET` in `.dev.vars`, restart Terminal 1 (backend).

## End-to-End Test Flow

### Test 1: Sign-Up Flow

**Steps:**
1. Navigate to http://localhost:5173
2. Click **Sign Up**
3. Enter email and password
4. Check email for verification link
5. Click verification link
6. Should redirect back to app (signed in)

**Expected Results:**
- ✅ Verification email received within 1 minute
- ✅ After verification, automatically signed in
- ✅ Dashboard loads and shows "Free Plan"
- ✅ Usage shows **0 / 5**

**Common Issues:**
- Email not received → Check spam folder, verify Clerk email config
- Redirect fails → Check `VITE_API_URL` in frontend `.env`

---

### Test 2: Free Tier Usage Limits

**Steps:**
1. Sign in with newly created account
2. Go to Dashboard
3. Click **Process Request** button
4. Repeat until you hit 5 requests
5. Try a 6th request

**Expected Results:**
- ✅ First 5 requests succeed
- ✅ Counter increments: 0/5 → 1/5 → 2/5 → 3/5 → 4/5 → 5/5
- ✅ On 6th request: "Free tier limit reached" error
- ✅ Upgrade CTA appears

**Common Issues:**
- Counter doesn't increment → Check Terminal 1 for KV errors
- No limit enforced → Check `TIER_CONFIG` in `api/src/index.ts`
- Rate limit error → Wait 1 minute (security rate limit is separate)

---

### Test 3: Stripe Checkout Flow

**Steps:**
1. From Dashboard (after hitting limit), click **Upgrade to Pro**
2. Should redirect to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
   - Expiry: `12/34` (any future date)
   - CVC: `123` (any 3 digits)
   - ZIP: `12345` (any 5 digits)
4. Click **Subscribe**
5. Should redirect back to Dashboard

**Expected Results:**
- ✅ Stripe Checkout loads with correct plan/price ($29/mo or your price)
- ✅ Payment succeeds (test mode)
- ✅ Redirects to Dashboard with `?success=true` parameter
- ✅ **Terminal 3** shows webhook received:
  ```
  ✔ Received event checkout.session.completed
  → POST http://localhost:8787/webhook/stripe [200]
  ```

**Common Issues:**
- Checkout fails to load → Check `STRIPE_PRICE_ID_PRO` in `.dev.vars`
- Webhook shows `[400]` → Check webhook signature secret matches
- Webhook shows `[500]` → Check Terminal 1 backend logs for errors

---

### Test 4: Plan Upgrade Verification

**Steps:**
1. After successful checkout and redirect to Dashboard
2. **Refresh the page** (Cmd+R or Ctrl+R)
3. Check plan status

**Expected Results:**
- ✅ Plan badge shows **"Pro"** (not Free)
- ✅ Usage counter shows **"Unlimited"** or large number
- ✅ No usage limit enforced

**Why refresh is needed:** JWT tokens are cached. Refreshing forces Clerk to issue a new JWT with updated `plan` claim from metadata.

**Common Issues:**
- Still shows Free plan → Check Terminal 3 webhook response
- Webhook didn't run → Ensure Terminal 3 is running
- Metadata not updated → Check Stripe product metadata: `{ "plan": "pro" }`

---

### Test 5: Unlimited Usage (Pro Tier)

**Steps:**
1. As a Pro user, click **Process Request** 20+ times
2. Verify no limits enforced

**Expected Results:**
- ✅ All requests succeed
- ✅ Counter increments freely: 6, 7, 8, ..., 25, 26, ...
- ✅ No "limit reached" errors

**Common Issues:**
- Rate limit error (429) → This is the security rate limit (100 req/min). Wait 1 minute.
- Still sees limit → User's JWT still has old `plan: "free"` claim. Force refresh or sign out/in.

---

### Test 6: Billing Portal Access

**Steps:**
1. In Dashboard, click **Manage Billing**
2. Should open Stripe Customer Portal in new tab
3. Navigate portal sections

**Expected Results:**
- ✅ Portal loads with user's subscription details
- ✅ Shows current plan (Pro at $29/mo)
- ✅ Can view invoices
- ✅ Can update payment method
- ✅ Can cancel subscription

**Common Issues:**
- Portal fails to load → Check `STRIPE_PORTAL_CONFIG_ID` in `.dev.vars`
- 404 error → Portal not enabled in Stripe Dashboard → Settings → Billing → Portal

---

### Test 7: Subscription Cancellation

**Steps:**
1. In Customer Portal, click **Cancel subscription**
2. Confirm cancellation
3. Return to Dashboard
4. Refresh page

**Expected Results:**
- ✅ **Terminal 3** shows webhook: `customer.subscription.deleted`
- ✅ After refresh, plan reverts to **"Free"**
- ✅ Usage limits enforced again (5 req/month)

**Common Issues:**
- Plan doesn't downgrade → Check `customer.subscription.deleted` webhook handler in `api/src/stripe-webhook.ts`

---

### Test 8: Sign Out / Sign In

**Steps:**
1. Click **Sign Out**
2. Should redirect to landing page
3. Click **Sign In**
4. Enter credentials
5. Should return to Dashboard

**Expected Results:**
- ✅ Sign out clears session
- ✅ Protected routes redirect to sign-in
- ✅ Sign in restores session and plan status

---

## Automated Testing (Optional)

### Unit Tests

Create `api/src/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TIER_CONFIG } from './index';

describe('Tier Configuration', () => {
  it('should have correct limits', () => {
    expect(TIER_CONFIG.free.limit).toBe(5);
    expect(TIER_CONFIG.pro.limit).toBe(Infinity);
  });

  it('should have correct prices', () => {
    expect(TIER_CONFIG.free.price).toBe(0);
    expect(TIER_CONFIG.pro.price).toBe(29);
  });
});
```

Run tests:
```bash
cd api
npm install -D vitest
npm run test
```

### Integration Tests with Miniflare

Test Workers locally without deploying:

```typescript
import { describe, it, expect } from 'vitest';
import { Miniflare } from 'miniflare';

describe('API Integration', () => {
  it('should return 401 for missing JWT', async () => {
    const mf = new Miniflare({
      scriptPath: './src/index.ts',
      modules: true,
    });

    const response = await mf.dispatchFetch('http://localhost/api/data');
    expect(response.status).toBe(401);
  });
});
```

### E2E Tests with Playwright (Recommended)

Install Playwright:
```bash
cd frontend-v2
npm install -D @playwright/test
npx playwright install
```

Create `frontend-v2/tests/checkout.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('complete signup and upgrade flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');

  // Sign up
  await page.click('text=Sign Up');
  await page.fill('[name=email]', `test${Date.now()}@example.com`);
  await page.fill('[name=password]', 'TestPassword123!');
  await page.click('button:has-text("Sign Up")');

  // Wait for email verification (mock in test)
  // ... verification flow ...

  // Check free tier
  await expect(page.locator('text=0 / 5')).toBeVisible();

  // Upgrade to Pro
  await page.click('text=Upgrade to Pro');

  // Stripe Checkout appears
  await expect(page.url()).toContain('checkout.stripe.com');

  // Fill test card (in Stripe's iframe)
  // ... payment flow ...

  // Verify upgrade
  await expect(page.locator('text=Pro Plan')).toBeVisible();
});
```

Run E2E tests:
```bash
npx playwright test
```

---

## Production Testing Checklist

### Pre-Launch Verification

Before going live, test in production environment:

- [ ] **Sign Up Flow**
  - [ ] Email verification works
  - [ ] New users default to Free plan
  - [ ] Dashboard loads after signup

- [ ] **Free Tier Limits**
  - [ ] 5 requests enforced
  - [ ] 6th request denied
  - [ ] Usage resets monthly

- [ ] **Upgrade Flow**
  - [ ] Checkout loads with LIVE Stripe keys
  - [ ] Real payment processes successfully
  - [ ] Webhook updates plan (check Clerk metadata)
  - [ ] Dashboard reflects Pro tier after refresh

- [ ] **Billing Portal**
  - [ ] Portal opens correctly
  - [ ] Can view invoices
  - [ ] Can update payment method
  - [ ] Can cancel subscription

- [ ] **Security**
  - [ ] API rejects invalid JWTs
  - [ ] CORS blocks unauthorized origins
  - [ ] Rate limiting works (100 req/min)
  - [ ] Webhook rejects invalid signatures

- [ ] **Performance**
  - [ ] API responds in <100ms (check Cloudflare Analytics)
  - [ ] Frontend loads in <2s (check Lighthouse score)
  - [ ] No console errors in production

---

## Load Testing

### Test Worker Capacity

Use `wrk` or `artillery` to simulate traffic:

```bash
# Install artillery
npm install -g artillery

# Create load test config
cat > load-test.yml <<EOF
config:
  target: 'https://YOUR-WORKER.workers.dev'
  phases:
    - duration: 60
      arrivalRate: 100
scenarios:
  - name: "Health check"
    flow:
      - get:
          url: "/health"
EOF

# Run test
artillery run load-test.yml
```

**Expected results:**
- ✅ 6000 requests in 60 seconds (100 req/s)
- ✅ Median latency <50ms
- ✅ 99th percentile <200ms
- ✅ 0% error rate

### Test KV Under Load

Simulate 1000 concurrent users making requests:

```bash
# Test authenticated requests (requires valid JWT)
artillery quick --duration 60 --rate 100 \
  -H "Authorization: Bearer <jwt_token>" \
  https://YOUR-WORKER.workers.dev/api/data
```

**Expected results:**
- ✅ KV reads handle load (100k reads/day free tier limit)
- ✅ Usage counters increment correctly
- ✅ No stale data issues

---

## Monitoring & Observability

### Real-Time Logs

**Worker logs:**
```bash
wrangler tail
```

**Watch for:**
- ❌ 500 errors (code bugs)
- ❌ 401 errors (JWT issues)
- ❌ Stripe webhook failures
- ✅ Successful request patterns

### Cloudflare Analytics

Check in Workers dashboard:
1. **Request volume** - Spikes indicate issues or success
2. **Error rate** - Should be <1%
3. **CPU time** - Should be <5ms per request
4. **Success rate** - Should be >99%

### Clerk Analytics

Check in Clerk dashboard:
1. **Active users** - Track growth
2. **Sign-up conversion** - Optimize if low
3. **Session duration** - Indicates engagement

### Stripe Analytics

Check in Stripe dashboard:
1. **MRR (Monthly Recurring Revenue)** - Track revenue
2. **Failed payments** - Follow up with customers
3. **Churn rate** - Monitor cancellations

---

## Debugging Common Issues

### Issue: "TypeError: Cannot read property 'plan' of undefined"

**Location:** Backend trying to read `auth.sessionClaims.plan`

**Cause:** JWT doesn't include `plan` claim

**Fix:**
1. Check Clerk JWT template includes: `"plan": "{{user.public_metadata.plan}}"`
2. Verify template is named exactly `pan-api` (or update `CLERK_JWT_TEMPLATE` env var)
3. Sign out and sign back in to get new JWT

---

### Issue: Webhook returns 200 but plan doesn't update

**Cause:** Webhook processed but metadata not synced

**Debug:**
1. Check Terminal 3 or production webhook logs
2. Verify webhook includes Clerk API call
3. Check Clerk dashboard → User → Metadata → Should show `plan: "pro"`
4. If metadata is correct but JWT still says "free" → User needs to refresh

---

### Issue: Rate limit hit immediately (429 error)

**Cause:** Security rate limit (100 req/min) triggered

**Fix:**
- This is working as intended for security
- Wait 1 minute for rate limit to reset
- If too restrictive, increase `RATE_LIMIT_PER_MINUTE` in `api/src/index.ts`

---

### Issue: KV "key not found" errors

**Cause:** First request for a user, KV key doesn't exist yet

**Fix:** This is normal! Code should handle missing keys:

```typescript
const usageData = await env.USAGE_KV.get(`usage:${userId}`, 'json') || {
  usageCount: 0,
  plan: 'free',
  lastUpdated: new Date().toISOString(),
};
```

---

## Test Data Cleanup

### Reset Test User's Usage

```bash
# Use Wrangler to delete KV keys
wrangler kv:key delete --binding=USAGE_KV "usage:user_abc123"
```

### Delete Test Users in Clerk

1. Go to Clerk Dashboard → **Users**
2. Search for test emails
3. Click **···** → **Delete User**

### Cancel Test Subscriptions in Stripe

1. Go to Stripe Dashboard → **Customers**
2. Search for test customer
3. Click customer → **Subscriptions** → **Cancel**

---

**Next Steps:**
- [Deployment Guide](deployment.md) - Deploy to production
- [Architecture Guide](architecture.md) - Understand the system
- [FAQ](faq.md) - Common questions and troubleshooting
