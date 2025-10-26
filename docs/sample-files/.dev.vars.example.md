# Backend Environment Variables Example

Copy `api/.dev.vars.example` → `api/.dev.vars` and fill in your values.

---

## File Structure (`api/.dev.vars`)

```bash
# ===================================
# CLERK AUTHENTICATION
# ===================================
# Get these from: https://dashboard.clerk.com/
# NOTE: Use test keys (sk_test_..., pk_test_...) for development
#       Switch to live keys (sk_live_..., pk_live_...) for production

CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY_HERE

# JWT Template name (create in Clerk Dashboard → JWT Templates)
CLERK_JWT_TEMPLATE=pan-api

# ===================================
# STRIPE PAYMENT PROCESSING
# ===================================
# Get API keys from: https://dashboard.stripe.com/apikeys
# NOTE: Use test keys (sk_test_...) for development
#       Switch to live keys (sk_live_...) for production

STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE

# Stripe Product Price IDs
# Get these after creating products in Stripe Dashboard → Products
# You need one Price ID for each paid tier
# Format: price_1ABC123xyz...

STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID_HERE
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_PRICE_ID_HERE

# Add more tiers as needed:
# STRIPE_PRICE_ID_PREMIUM=price_YOUR_PREMIUM_PRICE_ID_HERE

# Stripe Customer Portal Configuration ID
# Get this from: https://dashboard.stripe.com/settings/billing/portal
STRIPE_PORTAL_CONFIG_ID=bpc_YOUR_PORTAL_CONFIG_ID_HERE

# Stripe Webhook Secret (PRODUCTION ONLY)
# Get this after creating webhook endpoint in Stripe Dashboard → Webhooks
# Leave commented for local development (Stripe CLI handles this)
# STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# ===================================
# OPTIONAL CONFIGURATION
# ===================================

# Allowed origins for CORS (comma-separated)
# Development: Include all local ports you use
# Production: Your production frontend URL(s) only
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend URL (for redirects)
# Development: Your local Vite dev server
# Production: Your deployed frontend domain
FRONTEND_URL=http://localhost:5173
```

---

## Variable Explanations

### Clerk Authentication

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `CLERK_SECRET_KEY` | Server-side authentication key | Clerk Dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Public key for Clerk SDK | Clerk Dashboard → API Keys |
| `CLERK_JWT_TEMPLATE` | Name of your JWT template | Clerk Dashboard → JWT Templates (create one named "pan-api") |

**Test vs Production:**
- **Development**: Use keys starting with `sk_test_` and `pk_test_`
- **Production**: Use keys starting with `sk_live_` and `pk_live_`

---

### Stripe Payment Processing

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API key | Stripe Dashboard → Developers → API Keys |
| `STRIPE_PRICE_ID_PRO` | Price ID for Pro tier | Stripe Dashboard → Products → Pro → Pricing |
| `STRIPE_PRICE_ID_ENTERPRISE` | Price ID for Enterprise tier | Stripe Dashboard → Products → Enterprise → Pricing |
| `STRIPE_PORTAL_CONFIG_ID` | Customer Portal configuration | Stripe Dashboard → Settings → Billing → Customer Portal |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Stripe Dashboard → Developers → Webhooks (after creating endpoint) |

**Test vs Production:**
- **Development**: Use keys starting with `sk_test_`
- **Production**: Use keys starting with `sk_live_`

**Adding More Tiers:**
If you have more than 2 paid tiers, add additional `STRIPE_PRICE_ID_*` variables:
```bash
STRIPE_PRICE_ID_STARTER=price_1ABC123xyz...
STRIPE_PRICE_ID_PRO=price_1DEF456xyz...
STRIPE_PRICE_ID_PREMIUM=price_1GHI789xyz...
STRIPE_PRICE_ID_ENTERPRISE=price_1JKL012xyz...
```

You'll also need to update `api/src/index.ts` to reference these new variables.

---

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | - |
| `FRONTEND_URL` | Your frontend URL (for redirects) | - |

**Development Example:**
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**Production Example:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

## Local Development Setup

1. **Copy the example file:**
   ```bash
   cd api
   cp .dev.vars.example .dev.vars
   ```

2. **Fill in your values** from Clerk and Stripe dashboards

3. **Run the Worker locally:**
   ```bash
   npm run dev
   # or
   wrangler dev
   ```

---

## Production Deployment

**Do NOT commit `.dev.vars` to Git.** For production, set secrets using Wrangler:

```bash
# Clerk
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY
wrangler secret put CLERK_JWT_TEMPLATE

# Stripe
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PRICE_ID_PRO
wrangler secret put STRIPE_PRICE_ID_ENTERPRISE
wrangler secret put STRIPE_PORTAL_CONFIG_ID
wrangler secret put STRIPE_WEBHOOK_SECRET

# Optional
wrangler secret put ALLOWED_ORIGINS
wrangler secret put FRONTEND_URL
```

Each command will prompt you to paste the secret value.

---

## Common Issues

### Missing JWT Template

**Error:**
```
JWT verification failed: Template not found
```

**Solution:**
1. Go to Clerk Dashboard → JWT Templates
2. Create a new template named `pan-api` (must match `CLERK_JWT_TEMPLATE`)
3. Add custom claims for `plan` and other metadata

---

### Wrong Stripe Keys

**Error:**
```
No such price: 'price_...'
```

**Solution:**
- Make sure you're using **test keys** with **test Price IDs** in development
- Make sure you're using **live keys** with **live Price IDs** in production
- Stripe test and live modes are completely separate

---

### CORS Errors in Production

**Error:**
```
Access to fetch at 'https://api.example.com' has been blocked by CORS policy
```

**Solution:**
- Add your production frontend URL to `ALLOWED_ORIGINS`
- Format: `https://yourdomain.com` (no trailing slash)
- Multiple origins: `https://yourdomain.com,https://app.yourdomain.com`

---

## Related Documentation

- **[Clerk Setup Guide](../platforms/clerk.md)** - How to get Clerk keys
- **[Stripe Setup Guide](../platforms/stripe.md)** - How to create products and get Price IDs
- **[Cloudflare Deployment](../platforms/cf.md)** - How to deploy Worker and set production secrets

---

**Questions?** Check the [FAQ](../information/faq.md) or open a GitHub issue.
