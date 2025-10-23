# Configure Pricing Tiers

Ask the user SIMPLE questions, update files, and CHECK for common gotchas!

**Ask directly (one question at a time):**

1. "How many tiers? (2-4)"
2. For EACH tier, ask in plain text:
   - "Tier X name? (lowercase, no spaces, e.g., free, pro, plus, business)"
   - "Display name? (e.g., Free, Pro, Plus, Enterprise)"
   - "Price? (dollars, just the number, e.g., 0, 29, 199)"
   - "Limit? (number like 10, 500, or type 'unlimited')"
   - "Features? (comma-separated list, e.g., 'API access, Email support, Analytics')"
   - "Stripe Price ID? (e.g., price_xxxxx or type 'none' for free tier)"
   - "Show Popular badge? (yes/no)"

**Default colors (DON'T ASK USER):**
- Free tier: slate
- Tier 2: cyan
- Tier 3: purple
- Tier 4: orange

**Update these files:**

Backend: `/home/mini/Documents/clerk-exp/api/src/index.ts`
- Line ~50: UsageData plan type union
- Line ~33-34: Env STRIPE_PRICE_ID vars
- Line ~64: PlanTier type
- Line ~66: TIER_CONFIG object
- Line ~86: PRICE_ID_MAP object
- Line ~758: handleCreateCheckout - MUST use dynamic fallback, not hardcoded tier name

Frontend Dashboard: `/home/mini/Documents/clerk-exp/frontend-v2/src/pages/Dashboard.tsx`
- Line ~26: TIER_DISPLAY object

Frontend Landing: `/home/mini/Documents/clerk-exp/frontend-v2/src/pages/Landing.tsx`
- Line ~15: TIER_STYLES object
- Line ~50: getTierFeatures function

Frontend ChoosePlan: `/home/mini/Documents/clerk-exp/frontend-v2/src/pages/ChoosePlanPage.tsx`
- Line ~79: getTierGradient function
- Line ~92: getFeatures function

Env vars: `/home/mini/Documents/clerk-exp/api/.dev.vars`
- Add STRIPE_PRICE_ID_[TIERNAME] lines

**Icons:** 📄 Free, ⚡ Plus, 🚀 Business/Enterprise, ✨ Pro, 💎 Premium

**Convert:** "unlimited" → Infinity in code

**CRITICAL CHECKS (after updating):**

1. **Search for hardcoded tier fallbacks:**
   - `api/src/index.ts` line ~758: Should be `Object.keys(PRICE_ID_MAP)[0]` NOT `'pro'` or `'plus'`
   - `api/src/stripe-webhook.ts` lines ~91, ~123: Should fail explicitly if tier missing, NO fallbacks

2. **Verify .dev.vars:**
   - Check all STRIPE_PRICE_ID_* variables are present for paid tiers
   - Warn user to restart API server

3. **Check consistency:**
   - All tier names in TIER_CONFIG match PRICE_ID_MAP
   - All tier names match type unions (UsageData, PlanTier)
   - All tier names have frontend styling entries

**Report format:**
```
✅ Done! Updated 3 tiers: free, plus, premium

⚠️ IMPORTANT CHECKS:
1. Verify Stripe product metadata:
   - Plus → { "plan": "plus" }
   - Premium → { "plan": "premium" }

2. Restart API server to load new .dev.vars:
   cd api && npm run dev

3. Test upgrade flow:
   - Go to /dashboard
   - Click "Upgrade Plan"
   - Select a tier
   - Should redirect to Stripe checkout (no 500 error!)
```
