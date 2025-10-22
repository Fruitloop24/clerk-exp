# Tier Configurator

**One tool. One job. Generate custom pricing tiers for your SaaS in 2 minutes.**

## What It Does

This AI agent helps you configure custom pricing tiers by:
- ✅ Asking you questions about your tiers (names, prices, limits, features)
- ✅ Generating backend configuration code
- ✅ Creating beautiful pricing cards for your landing page
- ✅ Building tier-specific dashboards
- ✅ Showing you how to connect everything to Stripe

## Quick Start

### Prerequisites

1. **Claude Code installed** - This tool requires Claude Code CLI
2. **Stripe products created** - Have your Price IDs ready (e.g., `price_abc123`)
3. **Products have metadata** - Each Stripe product needs `{ "plan": "tiername" }` in metadata

### Run the Configurator

```bash
cd mcp-agents
claude code .claude/tier-configurator.json
```

Then tell Claude:

```
Read knowledge/tier-setup-guide.md and help me configure my pricing tiers.
Ask me about my tiers one by one, then generate all the code.
```

### What You'll Be Asked

1. **How many tiers?** (2-5 recommended)
2. **For each tier:**
   - Name (e.g., "free", "starter", "pro")
   - Monthly price ($0, $9, $29, etc.)
   - Request limit (5, 50, unlimited, etc.)
   - Key features (comma-separated)
   - Short description (one sentence)
   - Stripe Price ID (for paid tiers only)

### What Gets Generated

**Backend** (`api/src/index.ts`):
- Type definitions for your tiers
- Tier configuration object with limits/prices
- Price ID mapping for Stripe
- Updated checkout logic
- Updated usage validation

**Frontend** (`frontend-v2/src/pages/Landing.tsx`):
- Pricing cards with your tier names/prices
- Upgrade buttons that pass tier names
- Beautiful gradient styling

**Frontend** (`frontend-v2/src/pages/Dashboard.tsx`):
- Tier-specific usage displays
- Colored gradients per tier
- Upgrade CTAs based on current tier

**Environment** (`api/.dev.vars`):
- Price ID variables for each paid tier

## Example Session

```
You: Read knowledge/tier-setup-guide.md and configure my pricing tiers.

Claude: I'll help you configure your pricing tiers! Let me ask you some questions.

How many tiers would you like? (2-5 recommended)

You: 3

Claude: Great! Let's configure each tier.

=== Tier 1 (usually Free) ===
- Name: free
- Monthly price: $0
- Request limit: 5
- Features: Basic AI, Cloud storage, Community support
- Description: Perfect for trying out

=== Tier 2 ===
- Name: starter
- Monthly price: $9
- Request limit: 50
- Features: Priority processing, Email support, Advanced AI
- Description: For growing businesses
- Stripe Price ID: price_abc123

=== Tier 3 ===
- Name: pro
- Monthly price: $29
- Request limit: unlimited
- Features: Unlimited requests, API access, Priority support, Webhooks
- Description: For power users
- Stripe Price ID: price_def456

Claude: Perfect! Generating all code now...
[Modifies all files]

✅ Configuration complete!

📋 Next steps:
1. Verify Stripe product metadata matches:
   - starter → { "plan": "starter" }
   - pro → { "plan": "pro" }
2. Test locally:
   cd api && npm run dev
   cd frontend-v2 && npm run dev
3. Sign up, upgrade, and verify routing works!
```

## How JWT Routing Works

**The magic:** Your Stripe product metadata automatically routes users to the right dashboard.

```
Stripe Product → metadata: { plan: "starter" }
      ↓
Webhook updates Clerk → publicMetadata.plan = "starter"
      ↓
JWT includes → { "plan": "starter" }
      ↓
Frontend reads → user.publicMetadata.plan === "starter"
      ↓
Dashboard shows → Starter-specific UI (purple gradient, 50 limit)
```

**No JWT template changes needed!** The template stays as:
```json
{
  "plan": "{{user.public_metadata.plan}}"
}
```

It automatically picks up whatever tier name is in the metadata.

## File Structure

```
mcp-agents/
├── .claude/
│   └── tier-configurator.json     (agent MCP config)
├── knowledge/
│   └── tier-setup-guide.md        (comprehensive code examples)
└── README.md                      (this file)
```

## What You Still Do Manually

This tool **doesn't** automate:
- ❌ Creating Stripe products/prices (you do this in Stripe Dashboard)
- ❌ Setting up webhooks (you already have this from initial setup)
- ❌ Clerk JWT template (no changes needed - it's already dynamic)
- ❌ Deploying (you do this via GitHub Actions as usual)

Why? These are one-time setup steps that you've already done. This tool focuses on the **hard part**: generating all the tier-specific code.

## Troubleshooting

### "Dashboard doesn't update after upgrade"
User needs to refresh browser to get new JWT with updated plan.

### "Checkout fails with 'No price ID configured'"
Check that tier name in Stripe metadata matches button's `handleUpgrade('tiername')` exactly.

### "Backend returns wrong limit"
Verify `TIER_CONFIG` object has entry for the user's plan (case-sensitive).

### "Want to add more tiers later?"
Just run the configurator again! It will regenerate all code with your new tiers.

## Why This Approach?

**Instead of a complex multi-agent installer,** we built one focused tool that:
- ✅ Does one thing really well (tier configuration)
- ✅ Generates production-ready code
- ✅ Works with your existing Stripe setup
- ✅ Takes 2 minutes instead of 30
- ✅ Easy to understand and modify

## Next Steps

After configuring tiers, refer to the main README for:
- Complete manual setup guide (Clerk, Stripe, deployment)
- Production deployment instructions
- Security best practices

---

**Questions?** Check `knowledge/tier-setup-guide.md` for detailed code examples and explanations.
