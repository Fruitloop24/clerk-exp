# Tier Customization Guide

This template ships with **3 default tiers** (Free, Pro, Enterprise). This guide shows you how to add more tiers or customize existing ones.

## Quick Start: Use the `/configure-tiers` Command

The fastest way to configure custom tiers is with the `/configure-tiers` slash command.

### Prerequisites
- **Stripe Price IDs** ready for each paid tier

### Run the Command

In Claude Code, simply type:

```
/configure-tiers
```

Then answer the questions:
- How many tiers? (2-4)
- For each tier: name, price, limit, features, Stripe Price ID, popular badge

**What it does:**
1. ✅ Asks questions about each tier
2. ✅ Updates backend `TIER_CONFIG` in `api/src/index.ts`
3. ✅ Adds Stripe Price ID mappings
4. ✅ Updates frontend pricing cards (`Landing.tsx`, `Dashboard.tsx`, `ChoosePlanPage.tsx`)
5. ✅ Adds environment variables to `.dev.vars`
6. ✅ Checks for common gotchas (hardcoded fallbacks, metadata consistency)

**Time to complete:** ~2-3 minutes

---

## Manual Tier Configuration

If you prefer manual control, follow these steps to add a new tier.

### Example: Adding "Starter" Tier

We'll add a Starter tier between Free and Pro:
- **Price:** $19/month
- **Limit:** 100 requests/month
- **Stripe Price ID:** `price_starter123`

---

### Step 1: Update Backend Types

**File:** `api/src/index.ts`

**Line ~47** - Add tier to type union:
```typescript
interface UsageData {
  usageCount: number;
  plan: 'free' | 'pro' | 'starter';  // ← Add 'starter'
  lastUpdated: string;
  periodStart?: string;
  periodEnd?: string;
}
```

**Line ~64** - Add to PlanTier type:
```typescript
type PlanTier = 'free' | 'pro' | 'starter';  // ← Add 'starter'
```

---

### Step 2: Add Tier Configuration

**File:** `api/src/index.ts`

**Line ~66** - Add to TIER_CONFIG:
```typescript
const TIER_CONFIG: Record<string, { limit: number; price: number; name: string }> = {
  free: {
    name: 'Free',
    price: 0,
    limit: 5
  },
  starter: {  // ← Add this block
    name: 'Starter',
    price: 19,
    limit: 100
  },
  pro: {
    name: 'Pro',
    price: 29,
    limit: Infinity
  }
};
```

---

### Step 3: Add Stripe Price ID Mapping

**File:** `api/src/index.ts`

**Line ~88** - Add to PRICE_ID_MAP:
```typescript
const PRICE_ID_MAP: Record<string, (env: Env) => string> = {
  starter: (env) => env.STRIPE_PRICE_ID_STARTER || '',  // ← Add this
  pro: (env) => env.STRIPE_PRICE_ID_PRO || ''
};
```

---

### Step 4: Add Environment Variable

**File:** `api/src/index.ts`

**Line ~28** - Add to Env interface:
```typescript
interface Env {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID_STARTER?: string;  // ← Add this
  STRIPE_PRICE_ID_PRO?: string;
  STRIPE_PORTAL_CONFIG_ID?: string;
  ALLOWED_ORIGINS?: string;
  USAGE_KV: KVNamespace;
  CLERK_JWT_TEMPLATE: string;
}
```

**File:** `api/.dev.vars`

Add the Stripe Price ID:
```bash
STRIPE_PRICE_ID_STARTER=price_starter123
```

---

### Step 5: Create Stripe Product

1. Go to https://dashboard.stripe.com/products
2. Click **Add Product**
3. Configure:
   - **Name:** Starter Plan
   - **Price:** $19/month (recurring)
   - **Metadata:** `{ "plan": "starter" }` ← **CRITICAL**
4. Copy the Price ID (starts with `price_`)
5. Add to `api/.dev.vars` as shown above

**Important:** The metadata `plan` value must match the tier name exactly (lowercase).

---

### Step 6: Add Frontend Pricing Card

**File:** `frontend-v2/src/pages/Landing.tsx`

Add a new pricing card between Free and Pro:

```tsx
{/* Starter Tier */}
<div className="relative p-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all">
  <div className="text-center mb-8">
    <h3 className="text-2xl mb-2 font-bold">Starter</h3>
    <div className="mb-4">
      <span className="text-6xl font-extrabold">$19</span>
      <span className="text-xl opacity-90 font-medium">/month</span>
    </div>
    <p className="opacity-90">Perfect for growing teams</p>
  </div>

  <ul className="space-y-4 mb-8">
    <li className="flex items-start gap-3">
      <span className="text-green-300 text-xl flex-shrink-0">✓</span>
      <span>100 requests per month</span>
    </li>
    <li className="flex items-start gap-3">
      <span className="text-green-300 text-xl flex-shrink-0">✓</span>
      <span>Priority processing</span>
    </li>
    <li className="flex items-start gap-3">
      <span className="text-green-300 text-xl flex-shrink-0">✓</span>
      <span>Email support</span>
    </li>
  </ul>

  <SignedOut>
    <button
      onClick={() => navigate('/sign-up?plan=starter')}
      className="w-full py-4 px-8 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg"
    >
      Start with Starter
    </button>
  </SignedOut>

  <SignedIn>
    {plan === 'free' ? (
      <button
        onClick={() => handleUpgrade('starter')}
        className="w-full py-4 px-8 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg"
      >
        Upgrade to Starter
      </button>
    ) : plan === 'starter' ? (
      <button
        disabled
        className="w-full py-4 px-8 bg-white/20 text-white rounded-xl font-bold text-lg cursor-not-allowed"
      >
        Current Plan
      </button>
    ) : null}
  </SignedIn>
</div>
```

**Customize:**
- **Gradient colors:** `from-purple-500 to-purple-600` (change to match brand)
- **Features list:** Update bullet points for your tier
- **Button text:** "Start with Starter" or custom CTA

---

### Step 7: Update Dashboard Display

**File:** `frontend-v2/src/pages/Dashboard.tsx`

Add a usage card for the Starter tier:

```tsx
{plan === 'starter' && usage && (
  <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-purple-500 to-purple-600 shadow-2xl shadow-purple-500/30">
    <div className="text-8xl font-black mb-2 leading-none">
      {usage.usageCount} / {usage.limit}
    </div>
    <p className="text-2xl opacity-95 mb-2 font-semibold">
      Requests Processed
    </p>
    <p className="text-lg opacity-90">
      {usage.remaining} remaining this month
    </p>
  </div>
)}
```

---

### Step 8: Test the New Tier

1. **Restart backend:**
   ```bash
   cd api
   # Stop the dev server (Ctrl+C)
   npm run dev
   ```

2. **Test signup flow:**
   - Go to landing page
   - Click "Start with Starter"
   - Sign up with new email
   - Complete Stripe checkout
   - Verify dashboard shows "Starter" plan

3. **Test usage limits:**
   - Make 100 requests (should succeed)
   - 101st request should fail with "Tier limit reached"

---

## Advanced Tier Configurations

### Unlimited Tier

For unlimited tiers, set `limit: Infinity`:

```typescript
enterprise: {
  name: 'Enterprise',
  price: 199,
  limit: Infinity  // ← No usage limits
}
```

Update dashboard to show "Unlimited":

```tsx
{plan === 'enterprise' && usage && (
  <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/30">
    <div className="text-8xl font-black mb-2 leading-none">
      {usage.usageCount}
    </div>
    <p className="text-2xl opacity-95 mb-2 font-semibold">
      Requests Processed
    </p>
    <p className="text-lg opacity-90">
      ✨ Unlimited • Enterprise Plan
    </p>
  </div>
)}
```

---

### Per-Feature Limits (Coming Soon)

Currently, tiers only track total request count. To add per-feature limits:

**Example: Different limits for different API endpoints**

```typescript
const TIER_FEATURES = {
  free: {
    documents: 5,
    images: 0,
    api_access: false
  },
  pro: {
    documents: Infinity,
    images: 100,
    api_access: true
  }
};

// In your endpoint handlers:
if (url.pathname === '/api/process-document') {
  const limit = TIER_FEATURES[plan].documents;
  // ... check limit ...
}

if (url.pathname === '/api/process-image') {
  const limit = TIER_FEATURES[plan].images;
  if (limit === 0) {
    return new Response(JSON.stringify({ error: 'Feature not available in your plan' }), {
      status: 403
    });
  }
  // ... check limit ...
}
```

Store separate counters in KV:

```typescript
const documentUsage = await env.USAGE_KV.get(`documents:${userId}`);
const imageUsage = await env.USAGE_KV.get(`images:${userId}`);
```

---

## Multiple Price Points (Annual Plans)

Add annual pricing alongside monthly:

### In Stripe:
1. Create **two prices** for Pro tier:
   - Monthly: $29/month → `price_pro_monthly`
   - Annual: $290/year ($24/mo effective) → `price_pro_annual`

### In Backend:
```typescript
const PRICE_ID_MAP = {
  pro_monthly: (env) => env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
  pro_annual: (env) => env.STRIPE_PRICE_ID_PRO_ANNUAL || '',
};
```

### In Frontend:
Add a toggle switch for monthly/annual billing:

```tsx
const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

// In pricing section:
<div className="flex justify-center mb-8">
  <button onClick={() => setBillingPeriod('monthly')}>Monthly</button>
  <button onClick={() => setBillingPeriod('annual')}>Annual (Save 17%)</button>
</div>

// Update button handler:
onClick={() => handleUpgrade(billingPeriod === 'monthly' ? 'pro_monthly' : 'pro_annual')}
```

---

## Upgrading Between Paid Tiers

Currently, the template handles:
- ✅ Free → Paid tier (create subscription)
- ✅ Paid tier → Free (cancel subscription)

To support **Paid → Different Paid tier** (e.g., Starter → Pro):

### Backend Changes:

Add a new endpoint in `api/src/index.ts`:

```typescript
if (url.pathname === '/api/change-subscription' && request.method === 'POST') {
  const body = await request.json() as { targetTier: string };
  const currentSubscriptionId = user.publicMetadata.stripeSubscriptionId;

  // Cancel current subscription
  await fetch(`https://api.stripe.com/v1/subscriptions/${currentSubscriptionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` },
  });

  // Create new checkout session for target tier
  // ... (reuse checkout logic) ...
}
```

### Frontend Changes:

Update Dashboard.tsx to show upgrade options:

```tsx
{plan === 'starter' && (
  <button onClick={() => handleUpgrade('pro')}>
    Upgrade to Pro
  </button>
)}
```

---

## Tier Comparison Table (Optional)

Add a comparison table to your landing page:

```tsx
<div className="mt-20">
  <h2 className="text-3xl font-bold text-center mb-10">Feature Comparison</h2>
  <table className="w-full max-w-4xl mx-auto">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Free</th>
        <th>Starter</th>
        <th>Pro</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Requests/month</td>
        <td>5</td>
        <td>100</td>
        <td>Unlimited</td>
      </tr>
      <tr>
        <td>Support</td>
        <td>Community</td>
        <td>Email</td>
        <td>Priority</td>
      </tr>
      <tr>
        <td>API Access</td>
        <td>❌</td>
        <td>❌</td>
        <td>✅</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Color Scheme Recommendations

Choose distinct gradients for each tier to create visual hierarchy:

| Tier | Gradient | Use Case |
|------|----------|----------|
| Free | `bg-white border-2 border-slate-200` | Neutral, lowest tier |
| Starter | `from-indigo-500 to-indigo-600` | Entry paid tier |
| Pro | `from-blue-600 via-purple-600 to-blue-700` | Most popular (highlighted) |
| Enterprise | `from-emerald-500 to-emerald-600` | Premium tier |
| Custom | `from-orange-500 to-red-600` | Limited-time offers |

---

## Testing Your New Tier

**Checklist:**
- [ ] Backend `TIER_CONFIG` includes new tier with correct limit
- [ ] `PRICE_ID_MAP` includes Stripe Price ID
- [ ] Environment variable `STRIPE_PRICE_ID_TIERNAME` is set
- [ ] Stripe product has metadata: `{ "plan": "tiername" }`
- [ ] Frontend pricing card renders correctly
- [ ] Signup flow passes `?plan=tiername` parameter
- [ ] Checkout session loads with correct price
- [ ] Webhook updates Clerk metadata correctly
- [ ] Dashboard shows correct tier after upgrade
- [ ] Usage limits are enforced correctly

**Test flow:**
1. Sign up as new user via new tier button
2. Complete Stripe checkout
3. Verify dashboard shows correct tier
4. Make requests up to limit
5. Verify limit is enforced

---

## Removing a Tier

To deprecate a tier (e.g., removing Starter):

1. **Don't delete from `TIER_CONFIG`** - Existing users still have this tier
2. **Remove from frontend** - Hide pricing card so new users can't sign up
3. **Archive Stripe product** - Don't delete (breaks webhooks for existing subscriptions)
4. **Grandfather existing users** - Let them keep their plan or force upgrade via email campaign

---

**Next Steps:**
- [Testing Guide](testing.md) - Test your new tier
- [Architecture Guide](architecture.md) - Understand JWT routing
- [Setup Guide](setup.md) - Environment configuration reference
