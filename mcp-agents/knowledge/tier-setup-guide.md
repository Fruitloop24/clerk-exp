# Tier Configurator - Technical Reference

## Purpose
Generate tier-specific code for backend and frontend based on user's pricing structure.

## Data Collection Format

Collect this data from the user:

```typescript
interface TierData {
  name: string;           // lowercase, no spaces (e.g., "free", "starter", "pro")
  displayName: string;    // Display name (e.g., "Free", "Starter", "Pro")
  price: number;          // Monthly price in dollars (0 for free)
  limit: number | "unlimited";  // Request limit per month
  features: string[];     // Array of feature strings
  description: string;    // One-line description for pricing card
  stripePriceId?: string; // Stripe Price ID (only for paid tiers)
  highlighted?: boolean;  // Show as "most popular" badge
}
```

**Example collected data:**
```typescript
const tiers = [
  {
    name: "free",
    displayName: "Free",
    price: 0,
    limit: 5,
    features: ["5 documents/month", "Basic AI", "Community support"],
    description: "Perfect for trying out",
    highlighted: false
  },
  {
    name: "starter",
    displayName: "Starter",
    price: 9,
    limit: 50,
    features: ["50 documents/month", "Priority processing", "Email support"],
    description: "For growing businesses",
    stripePriceId: "price_abc123",
    highlighted: false
  },
  {
    name: "pro",
    displayName: "Pro",
    price: 29,
    limit: "unlimited",
    features: ["Unlimited documents", "Full API access", "Priority support", "Webhooks"],
    description: "For power users",
    stripePriceId: "price_def456",
    highlighted: true
  }
];
```

---

## Backend Modifications: `api/src/index.ts`

### Location 1: UsageData Interface (Line 47-53)

**FIND THIS:**
```typescript
interface UsageData {
	usageCount: number;
	plan: 'free' | 'pro';      // User's current plan
	lastUpdated: string;
	periodStart?: string;
	periodEnd?: string;
}
```

**REPLACE WITH (using collected tier names):**
```typescript
interface UsageData {
	usageCount: number;
	plan: 'free' | 'starter' | 'pro';  // Add all tier names here
	lastUpdated: string;
	periodStart?: string;
	periodEnd?: string;
}
```

**Pattern:** Join all tier names with ` | ` in the type union.

---

### Location 2: Env Interface (Line 28-40)

**FIND THIS:**
```typescript
interface Env {
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET?: string;
	STRIPE_PRICE_ID: string;            // Stripe price ID for Pro tier
	STRIPE_PORTAL_CONFIG_ID?: string;
	ALLOWED_ORIGINS?: string;
	USAGE_KV: KVNamespace;
	CLERK_JWT_TEMPLATE: string;
}
```

**REPLACE WITH (add price IDs for each PAID tier):**
```typescript
interface Env {
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET?: string;
	STRIPE_PRICE_ID_STARTER?: string;   // Add for each paid tier
	STRIPE_PRICE_ID_PRO?: string;
	STRIPE_PORTAL_CONFIG_ID?: string;
	ALLOWED_ORIGINS?: string;
	USAGE_KV: KVNamespace;
	CLERK_JWT_TEMPLATE: string;
}
```

**Pattern:** For each paid tier, add `STRIPE_PRICE_ID_<UPPERCASE_NAME>?: string;`

**Note:** Remove the old `STRIPE_PRICE_ID: string;` line.

---

### Location 3: Tier Configuration (Line 66)

**FIND THIS:**
```typescript
const FREE_TIER_LIMIT = 5;
```

**REPLACE WITH (using collected tier data):**
```typescript
// Tier configuration object
type PlanTier = 'free' | 'starter' | 'pro';

const TIER_CONFIG: Record<string, { limit: number; price: number; name: string }> = {
	free: {
		name: 'Free',
		price: 0,
		limit: 5
	},
	starter: {
		name: 'Starter',
		price: 9,
		limit: 50
	},
	pro: {
		name: 'Pro',
		price: 29,
		limit: Infinity
	}
};

// Map tier names to Stripe Price IDs
const PRICE_ID_MAP: Record<string, (env: Env) => string> = {
	starter: (env) => env.STRIPE_PRICE_ID_STARTER || '',
	pro: (env) => env.STRIPE_PRICE_ID_PRO || ''
};
```

**Pattern:**
- For `limit: "unlimited"` → use `Infinity`
- For `limit: number` → use the actual number
- Only add to `PRICE_ID_MAP` if tier has `stripePriceId`

---

### Location 4: handleDataRequest Function (Line 586-655)

**FIND THIS (around line 619):**
```typescript
// Check if free tier limit exceeded
if (plan === 'free' && usageData.usageCount >= FREE_TIER_LIMIT) {
	return new Response(
		JSON.stringify({
			error: 'Free tier limit reached',
			usageCount: usageData.usageCount,
			limit: FREE_TIER_LIMIT,
			message: 'Please upgrade to Pro for unlimited access',
		}),
		{
			status: 403,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		}
	);
}
```

**REPLACE WITH:**
```typescript
// Get tier limit from config
const tierLimit = TIER_CONFIG[plan]?.limit || 0;

// Check if tier limit exceeded
if (tierLimit !== Infinity && usageData.usageCount >= tierLimit) {
	return new Response(
		JSON.stringify({
			error: 'Tier limit reached',
			usageCount: usageData.usageCount,
			limit: tierLimit,
			message: 'Please upgrade to unlock more requests',
		}),
		{
			status: 403,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		}
	);
}
```

**ALSO UPDATE (around line 646):**
```typescript
// Return success response
return new Response(
	JSON.stringify({
		success: true,
		data: { message: 'Request processed successfully' },
		usage: {
			count: usageData.usageCount,
			limit: plan === 'free' ? FREE_TIER_LIMIT : 'unlimited',
			plan,
		},
	}),
```

**TO:**
```typescript
// Return success response
return new Response(
	JSON.stringify({
		success: true,
		data: { message: 'Request processed successfully' },
		usage: {
			count: usageData.usageCount,
			limit: tierLimit === Infinity ? 'unlimited' : tierLimit,
			plan,
		},
	}),
```

---

### Location 5: handleUsageCheck Function (Line 657-693)

**FIND THIS (around line 683):**
```typescript
return new Response(
	JSON.stringify({
		userId,
		plan,
		usageCount: usageData.usageCount,
		limit: plan === 'free' ? FREE_TIER_LIMIT : 'unlimited',
		remaining: plan === 'free' ? Math.max(0, FREE_TIER_LIMIT - usageData.usageCount) : 'unlimited',
		periodStart: usageData.periodStart,
		periodEnd: usageData.periodEnd,
	}),
```

**REPLACE WITH:**
```typescript
const tierLimit = TIER_CONFIG[plan]?.limit || 0;

return new Response(
	JSON.stringify({
		userId,
		plan,
		usageCount: usageData.usageCount,
		limit: tierLimit === Infinity ? 'unlimited' : tierLimit,
		remaining: tierLimit === Infinity ? 'unlimited' : Math.max(0, tierLimit - usageData.usageCount),
		periodStart: usageData.periodStart,
		periodEnd: usageData.periodEnd,
	}),
```

---

### Location 6: handleCreateCheckout Function (Line 695-752)

**FIND THIS (around line 695):**
```typescript
async function handleCreateCheckout(
	userId: string,
	clerkClient: any,
	env: Env,
	corsHeaders: Record<string, string>,
	origin: string
): Promise<Response> {
```

**REPLACE WITH (add request parameter):**
```typescript
async function handleCreateCheckout(
	userId: string,
	clerkClient: any,
	env: Env,
	corsHeaders: Record<string, string>,
	origin: string,
	request: Request
): Promise<Response> {
```

**FIND THIS (around line 702-726):**
```typescript
try {
	// Get user email from Clerk
	const user = await clerkClient.users.getUser(userId);
	const userEmail = user.emailAddresses[0]?.emailAddress || '';

	// Use origin from request for success/cancel URLs
	const frontendUrl = origin || 'https://app.panacea-tech.net';

	// Create Stripe checkout session
	const checkoutSession = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			'success_url': `${frontendUrl}/dashboard?success=true`,
			'cancel_url': `${frontendUrl}/dashboard?canceled=true`,
			'customer_email': userEmail,
			'client_reference_id': userId,
			'mode': 'subscription',
			'line_items[0][price]': env.STRIPE_PRICE_ID,
			'line_items[0][quantity]': '1',
			'metadata[userId]': userId,
		}).toString(),
	});
```

**REPLACE WITH:**
```typescript
try {
	// Get user email from Clerk
	const user = await clerkClient.users.getUser(userId);
	const userEmail = user.emailAddresses[0]?.emailAddress || '';

	// Get target tier from request body
	const body = await request.json().catch(() => ({ tier: 'pro' }));
	const targetTier = body.tier || 'pro';

	// Get the price ID for target tier
	const getPriceId = PRICE_ID_MAP[targetTier];
	const priceId = getPriceId ? getPriceId(env) : '';

	if (!priceId) {
		throw new Error(`No price ID configured for tier: ${targetTier}`);
	}

	// Use origin from request for success/cancel URLs
	const frontendUrl = origin || 'https://app.panacea-tech.net';

	// Create Stripe checkout session
	const checkoutSession = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			'success_url': `${frontendUrl}/dashboard?success=true`,
			'cancel_url': `${frontendUrl}/dashboard?canceled=true`,
			'customer_email': userEmail,
			'client_reference_id': userId,
			'mode': 'subscription',
			'line_items[0][price]': priceId,  // Dynamic price ID
			'line_items[0][quantity]': '1',
			'metadata[userId]': userId,
		}).toString(),
	});
```

---

### Location 7: Update Route Handler (Line 564)

**FIND THIS:**
```typescript
if (url.pathname === '/api/create-checkout' && request.method === 'POST') {
	return await handleCreateCheckout(userId, clerkClient, env, corsHeaders, origin);
}
```

**REPLACE WITH:**
```typescript
if (url.pathname === '/api/create-checkout' && request.method === 'POST') {
	return await handleCreateCheckout(userId, clerkClient, env, corsHeaders, origin, request);
}
```

---

### Location 8: Update Type in Main Handler (Line 552)

**FIND THIS:**
```typescript
const plan = ((auth.sessionClaims as any)?.plan as 'free' | 'pro') || 'free';
```

**REPLACE WITH (using collected tier names):**
```typescript
const plan = ((auth.sessionClaims as any)?.plan as PlanTier) || 'free';
```

---

## Frontend Modifications: `frontend-v2/src/pages/Landing.tsx`

### Location 1: handleUpgrade Function (Line 15-39)

**FIND THIS:**
```typescript
const handleUpgrade = async () => {
  setIsUpgrading(true);
  try {
    const token = await getToken({ template: 'pan-api' });
    const response = await fetch(`${API_URL}/api/create-checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
```

**REPLACE WITH:**
```typescript
const handleUpgrade = async (targetTier: string) => {
  setIsUpgrading(true);
  try {
    const token = await getToken({ template: 'pan-api' });
    const response = await fetch(`${API_URL}/api/create-checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tier: targetTier }),
    });
```

---

### Location 2: Pricing Cards Section (Line 227-353)

**ENTIRE SECTION - Generate pricing cards dynamically**

**Pattern for each tier:**

```tsx
{/* Free Tier - Always plain card */}
<div className="p-10 bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all">
  <div className="text-center mb-8">
    <h3 className="text-2xl mb-2 text-slate-700 font-bold">{displayName}</h3>
    <div className="mb-4">
      <span className="text-6xl font-extrabold text-slate-900">${price}</span>
      <span className="text-xl text-slate-600 font-medium">/month</span>
    </div>
    <p className="text-slate-600">{description}</p>
  </div>
  <ul className="space-y-4 mb-8">
    {features.map(feature => (
      <li className="flex items-start gap-3 text-slate-700">
        <span className="text-green-500 text-xl flex-shrink-0">✓</span>
        <span>{feature}</span>
      </li>
    ))}
  </ul>
  {/* Buttons here */}
</div>

{/* Paid Tier with highlighted=true - Gradient card */}
<div className="relative p-10 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-3xl text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all">
  {highlighted && (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase shadow-lg">
      Most Popular
    </div>
  )}
  {/* Same structure as above but with white text */}
</div>
```

**Gradient colors by tier index:**
- Tier 1 (free): White card
- Tier 2: `from-purple-500 to-purple-600` OR gradient if highlighted
- Tier 3: `from-blue-600 via-purple-600 to-blue-700` if highlighted, else `from-emerald-500 to-emerald-600`
- Tier 4+: `from-orange-500 to-orange-600`

**Button logic:**
```tsx
<SignedIn>
  {plan === 'free' ? (
    <button onClick={() => handleUpgrade('starter')}>
      Upgrade to Starter
    </button>
  ) : plan === 'starter' ? (
    <button>Current Plan</button>
  ) : null}
</SignedIn>
```

---

## Frontend Modifications: `frontend-v2/src/pages/Dashboard.tsx`

### Location 1: handleUpgrade Function (Line 78-100)

**FIND THIS:**
```typescript
const handleUpgrade = async () => {
  try {
    const token = await getToken({ template: 'pan-api' });
    const response = await fetch(`${API_URL}/api/create-checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
```

**REPLACE WITH:**
```typescript
const handleUpgrade = async (targetTier: string) => {
  try {
    const token = await getToken({ template: 'pan-api' });
    const response = await fetch(`${API_URL}/api/create-checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tier: targetTier }),
    });
```

---

### Location 2: Usage Counter Section (Line 182-201)

**Generate tier-specific usage displays**

**Pattern for each tier:**

```tsx
{/* Tier-specific usage card */}
{plan === 'free' && usage && (
  <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/30">
    <div className="text-8xl font-black mb-2 leading-none">
      {usage.usageCount} / {usage.limit}
    </div>
    <p className="text-2xl opacity-95 mb-2 font-semibold">
      Documents Processed
    </p>
    <p className="text-lg opacity-90">
      {usage.remaining} remaining this month
    </p>
  </div>
)}

{plan === 'starter' && usage && (
  <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-purple-500 to-purple-600 shadow-2xl shadow-purple-500/30">
    <div className="text-8xl font-black mb-2 leading-none">
      {usage.usageCount} / {usage.limit}
    </div>
    <p className="text-2xl opacity-95 mb-2 font-semibold">
      Documents Processed
    </p>
    <p className="text-lg opacity-90">
      {usage.remaining} remaining • Starter Plan
    </p>
  </div>
)}

{plan === 'pro' && usage && (
  <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/30">
    <div className="text-8xl font-black mb-2 leading-none">
      {usage.usageCount}
    </div>
    <p className="text-2xl opacity-95 mb-2 font-semibold">
      Documents Processed
    </p>
    <p className="text-lg opacity-90">
      ✨ Unlimited • Pro Plan Active
    </p>
  </div>
)}
```

**Gradient mapping:**
- free: `from-blue-500 to-blue-600`
- tier 2: `from-purple-500 to-purple-600`
- tier 3+: `from-emerald-500 to-emerald-600`, `from-orange-500 to-orange-600`, etc.

---

### Location 3: Upgrade CTA Section (Line 290-306)

**Generate upgrade CTAs based on tier hierarchy**

**Pattern:**
```tsx
{plan === 'free' && (
  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-12 rounded-3xl text-white text-center shadow-2xl shadow-purple-500/30 mb-8">
    <h3 className="text-3xl mb-4 font-bold">
      Upgrade to Starter
    </h3>
    <p className="text-lg mb-8 opacity-95 leading-relaxed">
      Get 50 requests per month with priority processing
    </p>
    <button onClick={() => handleUpgrade('starter')}>
      Upgrade to Starter - $9/mo
    </button>
  </div>
)}

{plan === 'starter' && (
  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-12 rounded-3xl text-white text-center shadow-2xl shadow-emerald-500/30 mb-8">
    <h3 className="text-3xl mb-4 font-bold">
      Upgrade to Pro
    </h3>
    <p className="text-lg mb-8 opacity-95 leading-relaxed">
      Unlock unlimited requests and full API access
    </p>
    <button onClick={() => handleUpgrade('pro')}>
      Upgrade to Pro - $29/mo
    </button>
  </div>
)}
```

**Logic:** Show upgrade CTA only if there's a higher tier available.

---

## Output After Generation

After generating all code, output this message:

```
✅ Tier configuration complete!

📋 Generated:
- Backend tier config with {tier_count} tiers
- Frontend pricing cards
- Tier-specific dashboards

⚠️ IMPORTANT: Verify your Stripe product metadata:
{for each paid tier}
- Product "{displayName}" → metadata: { "plan": "{name}" }

🧪 Test locally:
1. cd api && npm run dev
2. cd frontend-v2 && npm run dev (new terminal)
3. Sign up → Upgrade → Verify routing

✨ JWT routing is automatic - no template changes needed!
```

---

## Notes

- **Rate limiting (RATE_LIMIT_PER_MINUTE)** - DO NOT modify, it's security throttling
- **Environment variables** - DO NOT create .dev.vars entries, user already has them
- **JWT template** - DO NOT modify, it's already dynamic
- **Routing** - Automatically works via JWT claims, no changes needed
- **Type safety** - Use PlanTier type everywhere instead of hardcoded unions

---

## ⚠️ CRITICAL: Post-Generation Fixes Required

After generating the tier code, you MUST implement these two critical features that are missing:

### Issue 1: Upgrade Paths Between Paid Tiers

**Problem:** After generation, only FREE tier users can upgrade. Paid tier users only see "Manage Billing" with no way to upgrade to higher tiers.

**Example:**
- Pro user ($29/mo) wants to upgrade to Developer ($50/mo) → No button available
- Enterprise user ($35/mo) wants to upgrade to Pro ($29/mo) or Developer ($50/mo) → No button available

**Fix Required:**

#### A. Update Dashboard Navigation (Dashboard.tsx Line ~152)

**FIND THIS:**
```tsx
{plan === 'free' ? (
  <button onClick={() => handleUpgrade('pro')}>
    ⚡ Upgrade to Pro
  </button>
) : (
  <button onClick={handleManageBilling}>
    Manage Billing
  </button>
)}
```

**REPLACE WITH:**
```tsx
{plan === 'free' ? (
  <button onClick={() => handleUpgrade('pro')}>
    ⚡ Upgrade to Pro
  </button>
) : plan === 'enterprise' ? (
  <div className="flex gap-2">
    <button onClick={() => handleUpgrade('pro')}>
      Upgrade to Pro
    </button>
    <button onClick={handleManageBilling}>
      Manage Billing
    </button>
  </div>
) : plan === 'pro' ? (
  <div className="flex gap-2">
    <button onClick={() => handleUpgrade('developer')}>
      Upgrade to Developer
    </button>
    <button onClick={handleManageBilling}>
      Manage Billing
    </button>
  </div>
) : (
  <button onClick={handleManageBilling}>
    Manage Billing
  </button>
)}
```

**Logic:**
- Free → Show upgrade to any paid tier
- Enterprise ($35) → Can upgrade to Pro ($29) or Developer ($50)
- Pro ($29) → Can upgrade to Developer ($50)
- Developer ($50) → Highest tier, only show "Manage Billing"

#### B. Update Dashboard Upgrade CTA Section (Dashboard.tsx Line ~334)

The generated code shows upgrade options for FREE users. You need to add upgrade CTAs for PAID tier users too:

```tsx
{plan === 'enterprise' && (
  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-12 rounded-3xl text-white text-center shadow-2xl mb-8">
    <h3 className="text-3xl mb-4 font-bold">Upgrade Options</h3>
    <div className="flex gap-4 justify-center">
      <button onClick={() => handleUpgrade('pro')}>
        Pro - $29/mo (Unlimited)
      </button>
      <button onClick={() => handleUpgrade('developer')}>
        Developer - $50/mo (Unlimited + API)
      </button>
    </div>
  </div>
)}

{plan === 'pro' && (
  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-12 rounded-3xl text-white text-center shadow-2xl mb-8">
    <h3 className="text-3xl mb-4 font-bold">Unlock More Features</h3>
    <button onClick={() => handleUpgrade('developer')}>
      Upgrade to Developer - $50/mo
    </button>
  </div>
)}
```

---

### Issue 2: Signup Flow with Paid Tier Selection

**Problem:** When a signed-out user clicks a paid tier button (e.g., "Get Started" on Developer $50/mo), they:
1. Sign up and get FREE plan by default
2. Land on dashboard
3. Have to manually click "Upgrade to Developer" again

This is a **broken user experience** - they intended to buy Developer from the start!

**Expected Flow:**
1. Click "Get Started" on Developer tier (signed out)
2. Complete signup with Google/Email
3. **Automatically redirect to Stripe checkout for Developer tier**
4. Pay $50
5. Land on dashboard with Developer plan active

**Fix Required: URL Parameter Flow**

#### A. Update Landing.tsx SignedOut Buttons (Line ~265, ~309, ~360, ~411)

**FIND THIS:**
```tsx
<SignedOut>
  <button onClick={() => navigate('/sign-up')}>
    Get Started
  </button>
</SignedOut>
```

**REPLACE WITH (for each paid tier):**
```tsx
<SignedOut>
  {/* Free tier - normal signup */}
  <button onClick={() => navigate('/sign-up')}>
    Get Started Free
  </button>

  {/* Pro tier - signup with plan intent */}
  <button onClick={() => navigate('/sign-up?plan=pro')}>
    Start Free Trial
  </button>

  {/* Enterprise tier */}
  <button onClick={() => navigate('/sign-up?plan=enterprise')}>
    Get Started
  </button>

  {/* Developer tier */}
  <button onClick={() => navigate('/sign-up?plan=developer')}>
    Get Started
  </button>
</SignedOut>
```

#### B. Create Post-Signup Redirect Logic

**NEW FILE:** `frontend-v2/src/components/PostSignupRedirect.tsx`

```tsx
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PostSignupRedirect() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePostSignup = async () => {
      if (!isLoaded || !user) return;

      const intendedPlan = searchParams.get('plan');
      const currentPlan = user.publicMetadata?.plan || 'free';

      // If user just signed up and intended a paid plan, redirect to checkout
      if (intendedPlan && intendedPlan !== 'free' && currentPlan === 'free') {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
          const token = await getToken({ template: 'pan-api' });

          const response = await fetch(`${API_URL}/api/create-checkout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tier: intendedPlan }),
          });

          const data = await response.json();

          if (response.ok && data.url) {
            // Redirect to Stripe checkout
            window.location.href = data.url;
          }
        } catch (error) {
          console.error('Post-signup checkout redirect failed:', error);
          // Fall back to dashboard
          navigate('/dashboard');
        }
      }
    };

    handlePostSignup();
  }, [isLoaded, user, searchParams, getToken, navigate]);

  return null; // This is a logic component, renders nothing
}
```

#### C. Add Redirect Component to Sign-Up Page

**FILE:** `frontend-v2/src/pages/SignUp.tsx` (or wherever your sign-up route renders)

```tsx
import { SignUp } from '@clerk/clerk-react';
import PostSignupRedirect from '../components/PostSignupRedirect';

export default function SignUpPage() {
  return (
    <>
      <PostSignupRedirect />
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </>
  );
}
```

**How it works:**
1. User clicks "Get Started" on Developer tier → goes to `/sign-up?plan=developer`
2. Signs up with Clerk (gets free plan initially)
3. `PostSignupRedirect` component checks URL params
4. Sees `plan=developer` in URL
5. Automatically creates checkout session for developer tier
6. Redirects to Stripe payment
7. After payment, webhook updates plan to developer
8. User lands on dashboard with developer plan active

---

## Testing Checklist

After generation and implementing the fixes above, test these scenarios:

### Scenario 1: Free User Upgrade
- ✅ Sign up as new user (gets free plan)
- ✅ Dashboard shows free tier usage (blue gradient, X/5 limit)
- ✅ Click "Upgrade to Pro" button
- ✅ Complete Stripe checkout with test card `4242 4242 4242 4242`
- ✅ Webhook fires and updates Clerk metadata
- ✅ Refresh dashboard → See Pro UI (purple gradient, unlimited)

### Scenario 2: Signed-Out User Buys Paid Tier
- ✅ Sign out
- ✅ Go to landing page
- ✅ Click "Get Started" on Developer tier ($50)
- ✅ Complete Clerk signup
- ✅ **Automatically** redirected to Stripe checkout (don't manually click upgrade)
- ✅ Complete payment
- ✅ Land on dashboard with Developer plan active

### Scenario 3: Paid Tier Upgrade to Higher Tier
- ✅ User with Enterprise plan ($35, 10 docs)
- ✅ Dashboard shows Enterprise UI (orange gradient, X/10 limit)
- ✅ See "Upgrade to Pro" or "Upgrade to Developer" buttons
- ✅ Click upgrade → Complete checkout
- ✅ Plan updates correctly

### Scenario 4: Verify Tier Limits
- ✅ Free user: Make 5 requests → 6th request gets 403 error
- ✅ Enterprise user: Make 10 requests → 11th request gets 403 error
- ✅ Pro user: Make unlimited requests → Never hits limit
- ✅ Developer user: Make unlimited requests → Never hits limit

### Scenario 5: Stripe Metadata Verification
- ✅ Check Stripe Dashboard → Each product has correct metadata
  - Pro product: `{ plan: "pro" }`
  - Enterprise product: `{ plan: "enterprise" }`
  - Developer product: `{ plan: "developer" }`
- ✅ Webhook receives correct plan name on subscription creation
- ✅ Clerk user metadata updates correctly

---

## Common Errors and Solutions

### Error: "No price ID configured for tier: X"

**Cause:** Missing or incorrect price ID in environment variables

**Fix:**
1. Check `api/.dev.vars` has all price IDs
2. Verify env var names match exactly: `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_ENTERPRISE`, etc.
3. Restart backend worker after adding env vars

### Error: User clicks upgrade but nothing happens

**Cause:** JavaScript error in browser console, likely TypeScript type mismatch

**Fix:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Common issue: `handleUpgrade` not receiving tier parameter
4. Ensure all buttons call `onClick={() => handleUpgrade('tiername')}` not `onClick={handleUpgrade}`

### Error: Stripe checkout session fails to create

**Cause:** Price ID format incorrect or doesn't exist in Stripe

**Fix:**
1. Verify price IDs in Stripe Dashboard (should start with `price_`)
2. Check price is active (not archived)
3. Verify price is recurring monthly subscription (not one-time payment)

### Error: Webhook doesn't update plan after payment

**Cause:** Stripe webhook not configured or metadata missing

**Fix:**
1. Check Stripe Dashboard → Webhooks → Recent events
2. Verify webhook received `checkout.session.completed` event
3. Check webhook logs for errors
4. Verify product metadata is set correctly: `{ plan: "tiername" }`

### Error: Dashboard shows wrong tier UI after upgrade

**Cause:** User needs to refresh to get new JWT with updated plan

**Fix:**
1. This is expected behavior - user must refresh after webhook updates Clerk
2. Can add automatic refresh in success redirect: `?success=true` checks for this and auto-refreshes
3. Or display message: "Upgrade successful! Refreshing your account..."

---

## Advanced: Handling Downgrades

The generated code only handles upgrades. If you want to support downgrades:

**Stripe Customer Portal:**
Users can manage subscriptions via Stripe Customer Portal (already implemented):
- Click "Manage Billing" button
- Redirects to Stripe portal
- User can cancel or change subscription
- Webhook fires on subscription update/cancellation
- Plan updates automatically via webhook

**Custom Downgrade Logic:**
If you want in-app downgrade buttons:

```tsx
{plan === 'developer' && (
  <button onClick={() => handleDowngrade('pro')}>
    Downgrade to Pro - Save $21/mo
  </button>
)}
```

**Backend handler:**
```typescript
async function handleDowngrade(userId, targetTier, currentStripeSubscriptionId) {
  // Use Stripe API to update subscription to new price
  const updatedSubscription = await stripe.subscriptions.update(
    currentStripeSubscriptionId,
    { items: [{ price: PRICE_ID_MAP[targetTier] }] }
  );
  // Webhook will fire and update Clerk metadata automatically
}
```

---

## Summary

**Auto-generated code provides:**
- ✅ Backend tier configuration
- ✅ Frontend pricing cards
- ✅ Tier-specific dashboards
- ✅ JWT-based routing

**You must manually add:**
- ⚠️ Upgrade paths between paid tiers (nav buttons + CTAs)
- ⚠️ Signup flow with paid tier intent (URL params + redirect logic)
- ⚠️ Proper testing of all flows
- ⚠️ Stripe metadata configuration

**Time estimate:** 30-40 minutes to implement both missing features after code generation.

**Difficulty:** Medium - requires understanding of Clerk auth flow and Stripe checkout redirect logic.
