# Tier Configuration System

This folder contains the slash command for configuring multi-tier SaaS pricing.

## Quick Start

To configure or change your pricing tiers:

```
/configure-tiers
```

Answer simple questions and it updates everything automatically.

---

## What It Does

The `/configure-tiers` command:

1. **Asks you simple questions:**
   - How many tiers? (2-4)
   - For each tier: name, price, limit, features, Stripe Price ID, popular badge

2. **Updates all necessary files:**
   - Backend: `api/src/index.ts` (types, TIER_CONFIG, PRICE_ID_MAP)
   - Frontend: `Dashboard.tsx`, `Landing.tsx`, `ChoosePlanPage.tsx`
   - Env vars: `api/.dev.vars`

3. **Checks for common gotchas:**
   - Removes hardcoded tier fallbacks
   - Validates environment variables
   - Ensures type consistency

4. **Gives you a checklist:**
   - Stripe product metadata setup
   - Server restart reminders
   - Test upgrade flow instructions

---

## Example Session

```
You: /configure-tiers

Claude: How many tiers? (2-4)
You: 3

Claude: Tier 1 name? (lowercase, no spaces)
You: free

Claude: Display name?
You: Free

Claude: Price? (just the number)
You: 0

Claude: Limit? (number or 'unlimited')
You: 15

Claude: Features? (comma-separated)
You: Basic processing, Cloud storage

Claude: Stripe Price ID? (or 'none' for free tier)
You: none

Claude: Show Popular badge? (yes/no)
You: no

[Repeats for Tier 2 and Tier 3]

✅ Done! Updated 3 tiers: free, plus, premium

⚠️ IMPORTANT CHECKS:
1. Verify Stripe product metadata matches tier names
2. Restart API server to load new .dev.vars
3. Test upgrade flow
```

---

## Critical Setup Requirements

### 1. Stripe Product Metadata

**MUST match tier name exactly:**

```
Tier in code: "plus"
Stripe Product Metadata: { "plan": "plus" }  ✅

Tier in code: "plus"
Stripe Product Metadata: { "plan": "pro" }   ❌ BREAKS
```

**How to set:**
1. Stripe Dashboard → Products → [Your Product]
2. Scroll to "Metadata" section
3. Add: Key = `plan`, Value = `<tier_name>`

### 2. Environment Variables

Each paid tier needs a Stripe Price ID in `api/.dev.vars`:

```bash
STRIPE_PRICE_ID_PLUS=price_1SKpMg2L5f0FfOp2d6zGtYbW
STRIPE_PRICE_ID_PREMIUM=price_1SKpLH2L5f0FfOp2CU2X4CJU
```

**IMPORTANT:** After updating `.dev.vars`, you MUST restart the API server:
```bash
cd api
# Ctrl+C to kill
npm run dev
```

Wrangler doesn't hot-reload environment variables!

### 3. Testing Checklist

After running `/configure-tiers`:

- [ ] Restart API server (`cd api && npm run dev`)
- [ ] Hard refresh frontend (Ctrl+Shift+R)
- [ ] Verify `/api/tiers` endpoint: `curl http://localhost:8787/api/tiers`
- [ ] Check Stripe product metadata matches tier names
- [ ] Test upgrade flow:
  - Go to `/dashboard`
  - Click "Upgrade Plan"
  - Select a tier
  - Should redirect to Stripe checkout (no 500 error!)
  - Complete test payment
  - Verify plan updates after redirect back

---

## Common Issues

### 500 Error on Upgrade

**Cause:** Hardcoded tier fallbacks in code referencing old tier names.

**Fix:** Run `/configure-tiers` - it checks for this automatically.

### Plan Doesn't Update After Payment

**Cause:** Stripe product metadata doesn't match tier name.

**Fix:** Update Stripe product metadata to match exactly (lowercase, no spaces).

### "No price ID configured for tier: X"

**Cause:**
1. Missing env var in `.dev.vars`, OR
2. API server not restarted after adding env var

**Fix:**
1. Check `api/.dev.vars` has `STRIPE_PRICE_ID_<TIERNAME>`
2. Restart API server (Ctrl+C, then `npm run dev`)

### Wrong Price/Limit Showing

**Cause:**
1. Stripe products have wrong prices (not updated in Stripe Dashboard)
2. Frontend cache showing old data

**Fix:**
1. Update Stripe product prices in Dashboard
2. Hard refresh frontend (Ctrl+Shift+R)
3. Restart API server

---

## File Locations

The `/configure-tiers` command is defined in:
```
.claude/commands/configure-tiers.md
```

Files it updates:
```
api/src/index.ts              (Backend config, types, logic)
api/src/stripe-webhook.ts     (Webhook tier handling)
api/.dev.vars                 (Environment variables)
frontend-v2/src/pages/Dashboard.tsx      (Tier display styling)
frontend-v2/src/pages/Landing.tsx        (Pricing page styling & features)
frontend-v2/src/pages/ChoosePlanPage.tsx (Tier selection page)
```

---

## Architecture Overview

### Dynamic Tier System

The system is fully dynamic - tiers are defined once in `TIER_CONFIG` and automatically flow through:

1. **Backend** (`api/src/index.ts`):
   - `TIER_CONFIG` = single source of truth
   - `/api/tiers` endpoint returns config to frontend
   - Usage validation checks limits dynamically

2. **Frontend**:
   - Fetches tiers from `/api/tiers` on load
   - Renders pricing cards dynamically
   - Styling configs (colors, badges, features) map to tier IDs

3. **Stripe Integration**:
   - Checkout session includes `metadata: { tier: "<tiername>" }`
   - Webhook reads tier from metadata
   - Updates Clerk `publicMetadata.plan` with tier name
   - JWT automatically includes plan via Clerk template

4. **Authentication**:
   - Clerk JWT template: `{ "plan": "{{user.public_metadata.plan}}" }`
   - Backend reads plan from JWT claims
   - Validates usage against `TIER_CONFIG[plan].limit`

---

## Tips

- **Keep tier names lowercase** - Prevents case-sensitivity bugs
- **Always test upgrade flow** - Most bugs show up during checkout/webhook
- **Don't hardcode tier names** - Use dynamic lookups from `TIER_CONFIG`
- **Restart API after env changes** - Wrangler caches `.dev.vars`
- **Use `/configure-tiers` when changing tiers** - Faster and safer than manual edits

---

**Last Updated:** 2025-10-23
