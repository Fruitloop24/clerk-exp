# Multi-Tier SaaS Progress Report

**Date**: 2025-10-21
**Goal**: Fix signup flow so paid tier buttons actually charge users and update their plan

---

## What We Built Today

### The Good Stuff ✅
1. **4-tier system working** (free, pro, enterprise, developer)
   - Backend `TIER_CONFIG` with correct limits
   - Separate Stripe price IDs for each tier
   - Usage counters work per-tier
   - JWT routing works (plan flows through publicMetadata)

2. **Dashboard upgrade paths** - Paid users can now upgrade to other paid tiers
   - Enterprise → Pro or Developer
   - Pro → Developer
   - Free → Pro

3. **New checkout page approach**
   - Created `/checkout` page
   - SignUpPage dynamically redirects based on `?plan=X` parameter
   - Landing page buttons have correct plan params

### The Broken Stuff ❌

**MAIN ISSUE**: Webhook doesn't update user's tier after payment

When user clicks "Start with Pro" → Signs up → Redirects to Stripe → Pays → **Still shows free tier**

**Root Causes**:
1. **Stripe webhook not running locally** - Need 3rd terminal with Stripe CLI
2. **Webhook hardcoded to 'pro'** - Lines 94 & 123 in `api/src/stripe-webhook.ts`
3. **Checkout doesn't send tier to Stripe** - Missing `metadata[tier]` in checkout session (line 774)
4. **TypeScript error** - `body` is type `unknown` (line 745)

---

## How to Test (Once Fixed)

### Local Testing Requires 3 Terminals:

**Terminal 1 - Frontend**:
```bash
cd frontend-v2
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - API**:
```bash
cd api
npm run dev
# Runs on http://localhost:8787
```

**Terminal 3 - Stripe Webhook Forwarding**:
```bash
stripe listen --forward-to http://localhost:8787/webhook
# Copy the webhook signing secret (whsec_...)
# Put it in api/.dev.vars as STRIPE_WEBHOOK_SECRET
```

### Test Flow:
1. Sign out completely
2. Click "Start with Enterprise" button
3. URL should be `/sign-up?plan=enterprise`
4. Complete signup
5. Should redirect to `/checkout?plan=enterprise`
6. Should redirect to Stripe checkout with $35/month price
7. Use test card: `4242 4242 4242 4242`
8. After payment, return to `/dashboard`
9. **Dashboard should show Enterprise tier** (currently shows free)

---

## Code Changes Needed

### Fix 1: Add tier to checkout metadata
**File**: `api/src/index.ts` (line 774)

```typescript
// BEFORE:
'metadata[userId]': userId,

// AFTER:
'metadata[userId]': userId,
'metadata[tier]': targetTier,  // ← Add this line
```

### Fix 2: Read tier from metadata in webhook
**File**: `api/src/stripe-webhook.ts` (lines 90-105)

```typescript
// BEFORE (line 94):
publicMetadata: {
  plan: 'pro',  // ← Hardcoded!

// AFTER:
const tier = session.metadata?.tier || 'pro';
publicMetadata: {
  plan: tier,  // ← Dynamic based on what they bought
```

**Same fix needed** at line 123 for subscription events.

### Fix 3: TypeScript error
**File**: `api/src/index.ts` (line 745)

```typescript
// BEFORE:
const body = await request.json().catch(() => ({ tier: 'pro' }));

// AFTER:
const body = await request.json().catch(() => ({ tier: 'pro' })) as { tier?: string };
```

---

## URL Parameter Approach - Sustainable?

### Pros:
- ✅ Simple, no state management
- ✅ Debuggable (can see plan in URL)
- ✅ Works across page reloads
- ✅ Clerk preserves params in `afterSignUpUrl`

### Cons:
- ❌ User can manually change `?plan=enterprise` to `?plan=pro` (but Stripe still charges correct amount based on metadata)
- ❌ Parameters get lost if user navigates away during signup
- ❌ Deprecated `afterSignUpUrl` warning (Clerk moving to new redirect API)

### Alternative: Session Storage
```typescript
// Landing.tsx - Before signup
onClick={() => {
  sessionStorage.setItem('intended_tier', 'enterprise');
  navigate('/sign-up');
}}

// CheckoutPage.tsx - After signup
const tier = sessionStorage.getItem('intended_tier') || 'free';
sessionStorage.removeItem('intended_tier');
```

**Verdict**: URL params work fine for MVP. Session storage is slightly more robust but adds complexity. Current approach is good enough.

---

## How to Rollback

If things are broken and you want to start fresh:

```bash
git status  # See what changed
git log --oneline -5  # See recent commits

# Rollback to last commit (BEFORE today's changes):
git reset --hard HEAD~1

# Or rollback to specific commit:
git reset --hard 9ed13b8  # "comprehensive README overhaul" commit
```

**Changed files today**:
- `frontend-v2/src/pages/CheckoutPage.tsx` (NEW)
- `frontend-v2/src/pages/SignUpPage.tsx`
- `frontend-v2/src/pages/Landing.tsx`
- `frontend-v2/src/pages/Dashboard.tsx`
- `frontend-v2/src/App.tsx`
- `frontend-v2/src/components/PostSignupRedirect.tsx` (DELETED)

---

## Knowledge Base Updates Needed

Current KB at `mcp-agents/knowledge/tier-setup-guide.md` is **way too long** (became a manifesto).

### What to Keep:
1. **The Flow** (5 lines):
   - User clicks tier → signup with `?plan=X` → checkout page → Stripe → webhook updates → dashboard

2. **The 3 Key Files**:
   - `api/src/index.ts` - TIER_CONFIG, PRICE_ID_MAP, checkout metadata
   - `api/src/stripe-webhook.ts` - Read tier from metadata
   - `frontend-v2/src/pages/CheckoutPage.tsx` - Bridge between signup and payment

3. **Testing Checklist** (3 terminals, test card, expected behavior)

4. **Common Issues**:
   - Webhook not running → Tier stays free
   - Missing metadata[tier] → Always defaults to pro
   - TypeScript errors on body parsing

### What to Cut:
- Long explanations of JWT (it works, move on)
- Rate limiting vs usage limits (not related to tier selection)
- Multiple upgrade path examples (one example is enough)
- Downgrade handling (not implemented yet)

---

## Tomorrow's Plan

1. **Make the 3 code fixes** (5 minutes)
2. **Start Stripe webhook listener** (1 minute)
3. **Test complete flow** (5 minutes)
4. **If it works**: Update KB to lean version (10 minutes)
5. **If it breaks**: Debug webhook logs, check Stripe dashboard events

---

## Questions to Resolve

1. **Do we need Stripe products to have metadata too?** Or is session metadata enough?
2. **How do we handle upgrades?** (Pro → Enterprise means cancel old sub, create new sub?)
3. **What about downgrades?** (Enterprise → Pro - how does refund work?)
4. **Should we deploy this or keep testing local?**

---

**Current Status**: 80% there. Signup flow works, routing works, JWT works. Just need webhook to actually update the tier based on what they bought.

**Blocker**: Webhook not running + hardcoded tier in webhook code.

**Next Step**: Fix 3 lines of code + start Stripe CLI → Should work end-to-end.
