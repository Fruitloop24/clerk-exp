# Manual Tier Configuration Guide

**Time Estimate:** 20-30 minutes
**When to Use This:** If you want full manual control over tier configuration, or if you don't have Claude Code available.

---

## Overview

This guide walks you through manually configuring your pricing tiers. You'll need to update **5 files** total:

1. **Backend API** - `api/src/index.ts` (tier limits, prices, Stripe mappings)
2. **Frontend Dashboard** - `frontend-v2/src/pages/Dashboard.tsx` (tier display info)
3. **Frontend Landing Page** - `frontend-v2/src/pages/Landing.tsx` (pricing cards)
4. **Frontend Choose Plan Page** - `frontend-v2/src/pages/ChoosePlanPage.tsx` (tier gradients & features)
5. **Environment Variables** - `api/.dev.vars` (Stripe Price IDs)

---

## Example: Default 3-Tier Setup

The template ships with these default tiers:

| Tier Name | Display Name | Price | Limit | Stripe Price ID Variable |
|-----------|-------------|-------|-------|-------------------------|
| `free` | Free | $0 | 10 requests | None (no Stripe product) |
| `pro` | Pro | $29/mo | 50 requests | `STRIPE_PRICE_ID_PRO` |
| `enterprise` | Enterprise | $35/mo | Unlimited | `STRIPE_PRICE_ID_ENTERPRISE` |

We'll use this as our working example throughout the guide.

---

## Step 1: Update Backend Tier Configuration

**File:** `api/src/index.ts`

### 1.1 Update the Plan Type Union (Line ~50)

Find the `UsageData` interface and update the `plan` property:

```typescript
interface UsageData {
	usageCount: number;
	plan: 'free' | 'pro' | 'enterprise';  // ← Add/remove tier names here
	lastUpdated: string;
	periodStart?: string;
	periodEnd?: string;
}
```

**Example for 4 tiers (Free, Starter, Pro, Enterprise):**
```typescript
plan: 'free' | 'starter' | 'pro' | 'enterprise';
```

---

### 1.2 Update Environment Variable Types (Line ~33-34)

Find the `Env` interface and add Stripe Price ID variables for each **paid tier**:

```typescript
interface Env {
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET?: string;
	STRIPE_PRICE_ID_PRO?: string;           // ← Pro tier
	STRIPE_PRICE_ID_ENTERPRISE?: string;    // ← Enterprise tier
	STRIPE_PORTAL_CONFIG_ID?: string;
	ALLOWED_ORIGINS?: string;
	USAGE_KV: KVNamespace;
	CLERK_JWT_TEMPLATE: string;
}
```

**Example for 4 tiers (add Starter):**
```typescript
STRIPE_PRICE_ID_STARTER?: string;      // ← Add this line
STRIPE_PRICE_ID_PRO?: string;
STRIPE_PRICE_ID_ENTERPRISE?: string;
```

⚠️ **Free tier doesn't need a Stripe Price ID** (users aren't charged).

---

### 1.3 Update PlanTier Type (Line ~64)

Find the `PlanTier` type definition:

```typescript
type PlanTier = 'free' | 'pro' | 'enterprise';
```

**Example for 4 tiers:**
```typescript
type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
```

---

### 1.4 Update TIER_CONFIG Object (Line ~66)

This is where you define **name, price, and request limits** for each tier:

```typescript
const TIER_CONFIG: Record<string, { limit: number; price: number; name: string }> = {
	free: {
		name: 'free',
		price: 0,
		limit: 10           // 10 requests per month
	},
	pro: {
		name: 'pro',
		price: 29,
		limit: 50           // 50 requests per month
	},
	enterprise: {
		name: 'enterprise',
		price: 35,
		limit: Infinity     // Unlimited requests
	}
};
```

**Example for 4 tiers (adding Starter at $9/mo with 25 requests):**
```typescript
const TIER_CONFIG: Record<string, { limit: number; price: number; name: string }> = {
	free: {
		name: 'free',
		price: 0,
		limit: 10
	},
	starter: {
		name: 'starter',
		price: 9,
		limit: 25
	},
	pro: {
		name: 'pro',
		price: 29,
		limit: 100
	},
	enterprise: {
		name: 'enterprise',
		price: 99,
		limit: Infinity
	}
};
```

💡 **Tips:**
- Use `Infinity` for unlimited tiers
- `name` should match the tier key (lowercase, no spaces)
- `price` is in dollars (monthly)
- `limit` is the number of API requests allowed per billing period

---

### 1.5 Update PRICE_ID_MAP Object (Line ~86)

This maps your tier names to environment variables:

```typescript
const PRICE_ID_MAP: Record<string, (env: Env) => string> = {
	pro: (env) => env.STRIPE_PRICE_ID_PRO || '',
	enterprise: (env) => env.STRIPE_PRICE_ID_ENTERPRISE || ''
};
```

**Example for 4 tiers:**
```typescript
const PRICE_ID_MAP: Record<string, (env: Env) => string> = {
	starter: (env) => env.STRIPE_PRICE_ID_STARTER || '',
	pro: (env) => env.STRIPE_PRICE_ID_PRO || '',
	enterprise: (env) => env.STRIPE_PRICE_ID_ENTERPRISE || ''
};
```

⚠️ **Only include PAID tiers** - don't add the free tier here.

---

## Step 2: Update Frontend Dashboard Display

**File:** `frontend-v2/src/pages/Dashboard.tsx`

### 2.1 Update TIER_DISPLAY Object (Line ~26)

This controls how tier names are displayed to users in the dashboard:

```typescript
const TIER_DISPLAY: Record<string, string> = {
	free: 'Free',
	pro: 'Pro',
	enterprise: 'Enterprise'
};
```

**Example for 4 tiers:**
```typescript
const TIER_DISPLAY: Record<string, string> = {
	free: 'Free',
	starter: 'Starter',
	pro: 'Pro',
	enterprise: 'Enterprise'
};
```

💡 These are the **display names** users see (can have capitals, spaces, etc.)

---

## Step 3: Update Frontend Landing Page (Pricing Cards)

**File:** `frontend-v2/src/pages/Landing.tsx`

### 3.1 Update TIER_STYLES Object (Line ~15)

This defines the color scheme for each pricing card:

```typescript
const TIER_STYLES: Record<string, { gradient: string; badge: string; popular?: boolean }> = {
	free: {
		gradient: 'from-slate-50 to-slate-100',
		badge: 'bg-slate-100 text-slate-700 border-slate-200'
	},
	pro: {
		gradient: 'from-cyan-50 to-cyan-100',
		badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
		popular: true  // Shows "Most Popular" badge
	},
	enterprise: {
		gradient: 'from-purple-50 to-purple-100',
		badge: 'bg-purple-100 text-purple-700 border-purple-200'
	}
};
```

**Example for 4 tiers:**
```typescript
const TIER_STYLES: Record<string, { gradient: string; badge: string; popular?: boolean }> = {
	free: {
		gradient: 'from-slate-50 to-slate-100',
		badge: 'bg-slate-100 text-slate-700 border-slate-200'
	},
	starter: {
		gradient: 'from-green-50 to-green-100',
		badge: 'bg-green-100 text-green-700 border-green-200'
	},
	pro: {
		gradient: 'from-cyan-50 to-cyan-100',
		badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
		popular: true
	},
	enterprise: {
		gradient: 'from-purple-50 to-purple-100',
		badge: 'bg-purple-100 text-purple-700 border-purple-200'
	}
};
```

💡 **Recommended colors:**
- Free: slate (gray)
- Tier 2: cyan or green
- Tier 3: purple or blue
- Tier 4: orange or indigo

---

### 3.2 Update getTierFeatures Function (Line ~50)

This defines the feature list for each pricing card:

```typescript
const getTierFeatures = (tier: string): string[] => {
	switch (tier) {
		case 'free':
			return [
				'10 API requests/month',
				'Basic email support',
				'Community access'
			];
		case 'pro':
			return [
				'50 API requests/month',
				'Priority email support',
				'Advanced analytics',
				'API access'
			];
		case 'enterprise':
			return [
				'Unlimited API requests',
				'24/7 phone & email support',
				'Custom integrations',
				'Dedicated account manager',
				'SLA guarantee'
			];
		default:
			return [];
	}
};
```

**Example for 4 tiers:**
```typescript
const getTierFeatures = (tier: string): string[] => {
	switch (tier) {
		case 'free':
			return [
				'10 API requests/month',
				'Basic email support',
				'Community access'
			];
		case 'starter':
			return [
				'25 API requests/month',
				'Email support',
				'Basic analytics',
				'API documentation'
			];
		case 'pro':
			return [
				'100 API requests/month',
				'Priority email support',
				'Advanced analytics',
				'Webhooks',
				'Custom branding'
			];
		case 'enterprise':
			return [
				'Unlimited API requests',
				'24/7 phone & email support',
				'Custom integrations',
				'Dedicated account manager',
				'SLA guarantee',
				'SSO authentication'
			];
		default:
			return [];
	}
};
```

💡 Features should **increase in value** as tiers go up.

---

## Step 4: Update Choose Plan Page (Tier Details)

**File:** `frontend-v2/src/pages/ChoosePlanPage.tsx`

### 4.1 Update getTierGradient Function (Line ~79)

This controls the gradient background for tier cards on the upgrade page:

```typescript
const getTierGradient = (tier: string) => {
	switch (tier) {
		case 'free':
			return 'from-slate-50 via-slate-100 to-slate-50';
		case 'pro':
			return 'from-cyan-50 via-cyan-100 to-cyan-50';
		case 'enterprise':
			return 'from-purple-50 via-purple-100 to-purple-50';
		default:
			return 'from-gray-50 via-gray-100 to-gray-50';
	}
};
```

**Example for 4 tiers:**
```typescript
const getTierGradient = (tier: string) => {
	switch (tier) {
		case 'free':
			return 'from-slate-50 via-slate-100 to-slate-50';
		case 'starter':
			return 'from-green-50 via-green-100 to-green-50';
		case 'pro':
			return 'from-cyan-50 via-cyan-100 to-cyan-50';
		case 'enterprise':
			return 'from-purple-50 via-purple-100 to-purple-50';
		default:
			return 'from-gray-50 via-gray-100 to-gray-50';
	}
};
```

💡 Should **match the color scheme** from `TIER_STYLES` in `Landing.tsx`.

---

### 4.2 Update getFeatures Function (Line ~92)

This defines features shown on the "Choose Plan" page:

```typescript
const getFeatures = (tier: string): string[] => {
	switch (tier) {
		case 'free':
			return [
				'10 API requests per month',
				'Basic email support',
				'Community access'
			];
		case 'pro':
			return [
				'50 API requests per month',
				'Priority support',
				'Advanced analytics',
				'API access'
			];
		case 'enterprise':
			return [
				'Unlimited API requests',
				'24/7 phone support',
				'Custom integrations',
				'Dedicated account manager'
			];
		default:
			return [];
	}
};
```

**Example for 4 tiers:**
```typescript
const getFeatures = (tier: string): string[] => {
	switch (tier) {
		case 'free':
			return [
				'10 API requests per month',
				'Basic email support',
				'Community access'
			];
		case 'starter':
			return [
				'25 API requests per month',
				'Email support',
				'Basic analytics',
				'API documentation'
			];
		case 'pro':
			return [
				'100 API requests per month',
				'Priority support',
				'Advanced analytics',
				'Webhooks',
				'Custom branding'
			];
		case 'enterprise':
			return [
				'Unlimited API requests',
				'24/7 phone support',
				'Custom integrations',
				'Dedicated account manager',
				'SLA guarantee'
			];
		default:
			return [];
	}
};
```

💡 Should **match feature lists** from `Landing.tsx` for consistency.

---

## Step 5: Update Environment Variables

**File:** `api/.dev.vars`

Add a `STRIPE_PRICE_ID_[TIERNAME]` variable for **each paid tier**:

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_abc123...
CLERK_PUBLISHABLE_KEY=pk_test_xyz789...
CLERK_JWT_TEMPLATE=pan-api

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_def456...
STRIPE_PRICE_ID_PRO=price_1Abc23DEfg45HIjk
STRIPE_PRICE_ID_ENTERPRISE=price_1Xyz98WVut76
STRIPE_PORTAL_CONFIG_ID=bpc_1SK6M
```

**Example for 4 tiers (adding Starter):**
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_def456...
STRIPE_PRICE_ID_STARTER=price_1Def45GHij67KLmn      # ← Add this
STRIPE_PRICE_ID_PRO=price_1Abc23DEfg45HIjk
STRIPE_PRICE_ID_ENTERPRISE=price_1Xyz98WVut76
STRIPE_PORTAL_CONFIG_ID=bpc_1SK6M
```

⚠️ **Important:**
- Variable names must be **UPPERCASE**
- Format: `STRIPE_PRICE_ID_[TIERNAME]`
- Example: `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_BUSINESS`
- Get Price IDs from Stripe Dashboard → Products → [Your Product] → Pricing section

---

## Step 6: Verify Stripe Product Metadata

For the webhook system to work, each Stripe product **must have metadata** that matches your tier name.

### 6.1 Check Stripe Product Metadata

📍 Go to: **Stripe Dashboard → Products → [Your Product]**

Scroll down to the **"Metadata"** section.

### 6.2 Add Metadata (If Missing)

Click **"Add metadata"** and enter:

**Key:** `plan`
**Value:** `[your tier name]` (must match exactly)

**Examples:**
- Pro product → `{ "plan": "pro" }`
- Starter product → `{ "plan": "starter" }`
- Enterprise product → `{ "plan": "enterprise" }`

⚠️ **CRITICAL:** The `plan` value must **exactly match** the tier name you used in your code (lowercase, no spaces).

---

## Step 7: Restart Your Development Servers

After making all these changes, you need to restart your servers to load the new configuration:

```bash
# Stop all terminals (Ctrl+C)

# Restart backend (Terminal 1)
cd api && npm run dev

# Restart frontend (Terminal 2)
cd frontend-v2 && npm run dev

# Restart Stripe webhooks (Terminal 3)
stripe listen --forward-to http://localhost:8787/webhook/stripe
```

---

## Testing Your Tier Configuration

### ✅ Test Checklist

1. **Visit landing page** (`http://localhost:5173`)
   - Verify all tier cards display correctly
   - Check pricing, features, and colors look right
   - Confirm "Most Popular" badge appears on correct tier

2. **Sign up and check dashboard** (`http://localhost:5173/dashboard`)
   - Verify your tier displays correctly (should be "Free")
   - Check usage counter appears

3. **Test upgrade flow**
   - Click "Upgrade Plan" button
   - Verify all paid tiers appear with correct info
   - Click a tier → Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout

4. **Verify upgrade worked**
   - Return to dashboard (might need to refresh)
   - Tier should update to the one you purchased
   - Usage limit should reflect new tier

---

## Common Issues & Fixes

### ❌ Issue: "500 Error" when clicking upgrade

**Cause:** Mismatch between tier name in code and `PRICE_ID_MAP`

**Fix:**
1. Check `TIER_CONFIG` keys match `PRICE_ID_MAP` keys exactly
2. Verify environment variable names match (uppercase, with underscores)
3. Restart backend server

---

### ❌ Issue: Tier doesn't update after Stripe checkout

**Cause:** Stripe product metadata doesn't match tier name

**Fix:**
1. Go to Stripe Dashboard → Products → [Your Product]
2. Scroll to Metadata section
3. Ensure metadata has: `{ "plan": "pro" }` (or your tier name)
4. Must match **exactly** (case-sensitive, lowercase)

---

### ❌ Issue: Pricing card styling looks broken

**Cause:** Missing tier in `TIER_STYLES` or `getTierGradient`

**Fix:**
1. Check `Landing.tsx` → `TIER_STYLES` includes your tier
2. Check `ChoosePlanPage.tsx` → `getTierGradient` includes your tier
3. Use consistent Tailwind color names (e.g., `cyan-50`, not `lightblue`)

---

### ❌ Issue: Features not showing on pricing cards

**Cause:** Missing tier in `getTierFeatures` or `getFeatures` functions

**Fix:**
1. Check `Landing.tsx` → `getTierFeatures` includes your tier
2. Check `ChoosePlanPage.tsx` → `getFeatures` includes your tier
3. Make sure both functions return the same features for consistency

---

## Quick Reference: All Files to Update

| File | Line(s) | What to Update |
|------|---------|----------------|
| `api/src/index.ts` | ~50 | UsageData plan type union |
| | ~33-34 | Env STRIPE_PRICE_ID variables |
| | ~64 | PlanTier type definition |
| | ~66 | TIER_CONFIG object |
| | ~86 | PRICE_ID_MAP object |
| `frontend-v2/src/pages/Dashboard.tsx` | ~26 | TIER_DISPLAY object |
| `frontend-v2/src/pages/Landing.tsx` | ~15 | TIER_STYLES object |
| | ~50 | getTierFeatures function |
| `frontend-v2/src/pages/ChoosePlanPage.tsx` | ~79 | getTierGradient function |
| | ~92 | getFeatures function |
| `api/.dev.vars` | N/A | Add STRIPE_PRICE_ID_* variables |

---

## Need Help?

- 🤖 Use `/configure-tiers` for automated setup (requires Claude Code)
- 📖 [Architecture Guide](../features/architecture.md) - How the tier system works
- 🐛 [FAQ](../faq.md) - Common questions and troubleshooting
- 💳 [Stripe Setup Guide](../platforms/stripe.md) - Getting Stripe Price IDs

---

**🎉 Once complete, your custom tier system is ready!**

Test thoroughly before deploying to production.
