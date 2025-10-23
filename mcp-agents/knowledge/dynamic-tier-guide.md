# Dynamic Tier Configuration Guide

**IMPORTANT:** This system is now FULLY dynamic. The frontend fetches tiers from `/api/tiers` and renders everything automatically.

---

## How It Works

### Single Source of Truth: `TIER_CONFIG`

Located in `api/src/index.ts` (around line 66):

```typescript
const TIER_CONFIG: Record<string, { limit: number; price: number; name: string }> = {
	free: {
		name: 'Free',
		price: 0,
		limit: 5
	},
	pro: {
		name: 'Pro',
		price: 29,
		limit: Infinity
	},
	enterprise: {
		name: 'Enterprise',
		price: 35,
		limit: 10
	}
};
```

### What Happens Automatically

1. **API Endpoint** (`/api/tiers`) - Returns all tiers from `TIER_CONFIG`
2. **Frontend** - Fetches tiers and renders pricing cards dynamically
3. **Dashboard** - Shows usage counters based on user's plan
4. **ChoosePlanPage** - Lists all available tiers from API

---

## To Add a New Tier

### Step 1: Edit `TIER_CONFIG` (api/src/index.ts line ~66)

```typescript
const TIER_CONFIG = {
	// ... existing tiers
	business: {
		name: 'Business',
		price: 199,
		limit: 1000  // or Infinity for unlimited
	}
};
```

### Step 2: Add Stripe Price ID (if paid tier)

Located in `api/src/index.ts` around line 93:

```typescript
const PRICE_ID_MAP: Record<string, (env: Env) => string> = {
	pro: (env) => env.STRIPE_PRICE_ID_PRO || '',
	enterprise: (env) => env.STRIPE_PRICE_ID_ENTERPRISE || '',
	business: (env) => env.STRIPE_PRICE_ID_BUSINESS || ''  // Add this
};
```

### Step 3: Add Environment Variable

In `api/.dev.vars`:
```bash
STRIPE_PRICE_ID_BUSINESS=price_xxxxx
```

### Step 4: Add Styling (Optional)

**Dashboard** (`frontend-v2/src/pages/Dashboard.tsx` line ~26):
```typescript
const TIER_DISPLAY: Record<string, { gradient: string; shadow: string; badge: string; icon: string }> = {
	// ... existing tiers
	business: {
		gradient: 'from-red-500 to-red-600',
		shadow: 'shadow-red-500/30',
		badge: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
		icon: '🚀'
	}
};
```

**Landing** (`frontend-v2/src/pages/Landing.tsx` line ~15):
```typescript
const TIER_STYLES: Record<string, { /* ... */ }> = {
	// ... existing tiers
	business: {
		containerClass: 'p-8 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl text-white shadow-2xl hover:shadow-red-500/50 hover:scale-105 transition-all',
		textColor: 'text-white',
		checkColor: 'text-white',
		buttonClass: 'bg-white text-red-600 hover:bg-red-50',
		buttonText: 'text-red-600',
		highlighted: false  // true = "Popular" badge
	}
};
```

**Features Helper** (`frontend-v2/src/pages/Landing.tsx` line ~58):
```typescript
const getTierFeatures = (tier: Tier): string[] => {
	const features: string[] = [];

	if (tier.limit === 'unlimited') {
		features.push('Unlimited documents');
	} else {
		features.push(`${tier.limit} documents/month`);
	}

	// Add custom features per tier
	if (tier.id === 'business') {
		features.push('Dedicated account manager', 'Custom integrations', 'SLA guarantee');
	}

	return features;
};
```

---

## Tier Removal

Just comment out or delete from `TIER_CONFIG` and `PRICE_ID_MAP`:

```typescript
const TIER_CONFIG = {
	free: { ... },
	pro: { ... }
	// REMOVED: enterprise tier
	// enterprise: { ... }
};
```

Frontend automatically updates - no other changes needed!

---

## Available Color Gradients

Choose from these Tailwind gradient classes:

- `from-blue-500 to-blue-600` (Blue - Free tier default)
- `from-purple-500 to-purple-600` (Purple - Pro tier)
- `from-orange-500 to-orange-600` (Orange - Enterprise)
- `from-emerald-500 to-emerald-600` (Green - Developer)
- `from-red-500 to-red-600` (Red)
- `from-pink-500 to-pink-600` (Pink)
- `from-indigo-500 to-indigo-600` (Indigo)
- `from-yellow-500 to-yellow-600` (Yellow)

---

## Testing Checklist

After adding/removing tiers:

1. ✅ Restart API dev server (`cd api && npm run dev`)
2. ✅ Check `/api/tiers` endpoint: `curl http://localhost:8787/api/tiers`
3. ✅ Refresh frontend - new tiers should appear automatically
4. ✅ Verify ChoosePlanPage shows correct tiers
5. ✅ Test checkout flow with new tier
6. ✅ Verify Stripe webhook updates plan correctly

---

## Important Notes

### Stripe Product Metadata

Each Stripe product MUST have metadata matching the tier name:

```
Stripe Product: "Business"
Metadata: { "plan": "business" }
```

Without this, webhooks won't update the user's plan correctly!

### Type Safety

Update the `PlanTier` type union (api/src/index.ts line ~64):

```typescript
type PlanTier = 'free' | 'pro' | 'enterprise' | 'business';
```

### Fallback Styling

If you don't add a tier to `TIER_DISPLAY` or `TIER_STYLES`, it will use:
- Default gradient: blue
- Default icon: 📄
- Generic features based on limit

The system won't break - it just won't be as pretty!

---

## MCP Agent Instructions

When a user asks to add/modify tiers:

1. **Collect tier details:**
   - Name (lowercase, no spaces)
   - Display name (for UI)
   - Price (number)
   - Limit (number or Infinity)
   - Features (array of strings)
   - Stripe Price ID (if paid)
   - Highlighted? (boolean)

2. **Update backend:**
   - Add to `TIER_CONFIG`
   - Add to `PRICE_ID_MAP` (if paid)
   - Update `PlanTier` type union

3. **Update frontend styling:**
   - Add to `TIER_DISPLAY` (Dashboard)
   - Add to `TIER_STYLES` (Landing)
   - Add features to `getTierFeatures` helper

4. **Add environment variable:**
   - Add to `api/.dev.vars` if paid tier

5. **Remind user:**
   - Create Stripe product with matching metadata
   - Restart dev servers to test
   - Check `/api/tiers` endpoint

---

## Example: Adding "Starter" Tier

**User request:** "Add a Starter tier at $9/mo with 25 docs"

**Changes needed:**

1. `api/src/index.ts`:
```typescript
const TIER_CONFIG = {
	free: { name: 'Free', price: 0, limit: 5 },
	starter: { name: 'Starter', price: 9, limit: 25 },  // NEW
	pro: { name: 'Pro', price: 29, limit: Infinity }
};

const PRICE_ID_MAP = {
	starter: (env) => env.STRIPE_PRICE_ID_STARTER || '',  // NEW
	pro: (env) => env.STRIPE_PRICE_ID_PRO || ''
};

type PlanTier = 'free' | 'starter' | 'pro';  // UPDATED
```

2. `api/.dev.vars`:
```bash
STRIPE_PRICE_ID_STARTER=price_xxxxx
```

3. `frontend-v2/src/pages/Dashboard.tsx`:
```typescript
const TIER_DISPLAY = {
	// ... existing
	starter: {
		gradient: 'from-cyan-500 to-cyan-600',
		shadow: 'shadow-cyan-500/30',
		badge: 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white',
		icon: '⚡'
	}
};
```

4. `frontend-v2/src/pages/Landing.tsx`:
```typescript
const TIER_STYLES = {
	// ... existing
	starter: {
		containerClass: 'p-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-3xl text-white shadow-2xl',
		textColor: 'text-white',
		checkColor: 'text-white',
		buttonClass: 'bg-white text-cyan-600 hover:bg-cyan-50',
		buttonText: 'text-cyan-600',
		highlighted: false
	}
};

const getTierFeatures = (tier: Tier): string[] => {
	// ... existing logic
	if (tier.id === 'starter') {
		features.push('Email support', 'Basic analytics');
	}
	return features;
};
```

**Done!** Restart servers and the new tier appears everywhere.

---

## Troubleshooting

**Tier not showing up?**
- Check `TIER_CONFIG` spelling (case-sensitive)
- Restart API dev server
- Check browser console for errors
- Verify `/api/tiers` returns the new tier

**Styling looks wrong?**
- Check `TIER_DISPLAY` and `TIER_STYLES` for typos
- Verify Tailwind class names are valid
- Restart frontend dev server (Vite sometimes needs this)

**Checkout fails?**
- Verify Stripe Price ID is correct (starts with `price_`)
- Check `PRICE_ID_MAP` has entry for tier
- Verify environment variable is set
- Check Stripe product metadata matches tier name

---

**That's it!** The system is designed to be simple: edit one config object, add some styling, and everything else is automatic.
