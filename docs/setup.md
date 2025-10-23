# Complete Setup Guide

This guide walks through manual configuration of Clerk, Stripe, and Cloudflare deployment.

## Prerequisites

- **Node.js 20+** installed
- **Cloudflare account** (free tier works)
- **Clerk account** (free up to 10k users)
- **Stripe account** (test mode is fine)
- **Git** for version control

## Step 1: Clone & Install

```bash
git clone <your-repo>
cd clerk-exp

# Install backend dependencies
cd api && npm install

# Install frontend dependencies
cd ../frontend-v2 && npm install
```

## Step 2: Configure Clerk

### 2.1 Create Application

1. Go to https://clerk.com and sign up
2. Create a new application
3. Choose **Email** as authentication method
4. Copy your API keys (we'll use these in Step 4)

### 2.2 Create JWT Template

This is critical for the stateless architecture to work.

1. In Clerk Dashboard, go to **JWT Templates**
2. Click **New Template**
3. Name it: `pan-api` (exact name matters!)
4. Add this custom claim:

```json
{
  "plan": "{{user.public_metadata.plan}}"
}
```

5. Save the template

**Why this matters:** The `plan` claim allows your API to read the user's subscription tier directly from the JWT, with zero database lookups.

### 2.3 Copy API Keys

From Clerk Dashboard → API Keys:
- **Publishable Key**: Starts with `pk_test_...` or `pk_live_...`
- **Secret Key**: Starts with `sk_test_...` or `sk_live_...`

Keep these handy for Step 4.

## Step 3: Configure Stripe

### 3.1 Create Products

1. Go to https://dashboard.stripe.com/products
2. Click **Add Product**

**Create TWO products:**

#### Product 1: Free Tier (for reference only)
- **Name**: Free Plan
- **Price**: $0/month (one-time)
- **Description**: 5 requests per month
- This is just for display - we handle free tier logic in code

#### Product 2: Pro Tier
- **Name**: Pro Plan
- **Price**: $29/month (recurring)
- **Description**: Unlimited requests
- **Copy the Price ID** - starts with `price_...` (you'll need this!)

### 3.2 Configure Customer Portal

The Customer Portal lets users manage their subscription, update payment methods, and view invoices.

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Click **Enable customer portal**
3. Configure settings:
   - ✅ Allow subscription cancellation
   - ✅ Allow payment method updates
   - ✅ Allow invoice history viewing
4. Click **Save**
5. **Copy the Portal Configuration ID** - starts with `bpc_...`

### 3.3 Set Up Webhook Endpoint

**For Production:**

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your Worker URL:
   ```
   https://YOUR-WORKER-NAME.workers.dev/webhook/stripe
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. **Copy the Signing Secret** - starts with `whsec_...`

**For Local Development:**

We'll set this up in Step 5 using Stripe CLI.

### 3.4 Add Product Metadata (CRITICAL)

This is how the webhook knows which tier the user purchased.

1. Go to https://dashboard.stripe.com/products
2. Click your **Pro Plan** product
3. Scroll to **Metadata** section
4. Add metadata:
   - **Key**: `plan`
   - **Value**: `pro` (lowercase, exact match)
5. Save

**Without this metadata, webhooks won't update user plans correctly!**

## Step 4: Environment Variables

### Backend Configuration

Create `api/.dev.vars` (for local development):

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_TEMPLATE=pan-api

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # From Step 3.3 (local) or Step 5
STRIPE_PRICE_ID_PRO=price_...            # From Step 3.1
STRIPE_PORTAL_CONFIG_ID=bpc_...          # From Step 3.2

# CORS (Optional - defaults to localhost)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Important Notes:**
- This file is gitignored (never commit secrets!)
- For production, set these as Cloudflare Worker secrets (see Deployment guide)

### Frontend Configuration

Create `frontend-v2/.env`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8787
```

**For production**, change `VITE_API_URL` to your Worker URL.

## Step 5: Run Locally

You need **THREE terminals** running simultaneously:

### Terminal 1: Backend (Cloudflare Worker)

```bash
cd api
npm run dev
```

**Output:** `Ready on http://localhost:8787`

### Terminal 2: Frontend (Vite Dev Server)

```bash
cd frontend-v2
npm run dev
```

**Output:** `Local: http://localhost:5173`

### Terminal 3: Stripe Webhook Forwarder

**First, install Stripe CLI** (one-time setup):

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

**Then run webhook forwarder:**

```bash
stripe listen --forward-to http://localhost:8787/webhook/stripe
```

**Important:** Copy the webhook signing secret from the output:
```
> Ready! Your webhook signing secret is whsec_xxxxx...
```

Add this to `api/.dev.vars`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
```

Restart Terminal 1 (backend) after updating `.dev.vars`.

## Step 6: Test End-to-End

### 6.1 Sign Up Flow

1. Open http://localhost:5173
2. Click **Sign Up**
3. Create account with email
4. Check email for verification link
5. Verify email and sign in

### 6.2 Free Tier Usage

1. Go to Dashboard
2. Should show: **0 / 5 Requests**
3. Click **Process Request** 5 times
4. On 6th click: Should see "Free tier limit reached"

### 6.3 Upgrade Flow

1. Click **Upgrade to Pro**
2. Redirects to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., 12/34)
   - **CVC**: Any 3 digits (e.g., 123)
   - **ZIP**: Any 5 digits (e.g., 12345)
4. Complete payment
5. Redirects back to Dashboard
6. **Refresh the page** (needed for JWT to update)
7. Should now show: **Unlimited • Pro Plan Active**

### 6.4 Verify Webhook Processed

In Terminal 3 (Stripe CLI), you should see:
```
✔ Received event checkout.session.completed
→ POST http://localhost:8787/webhook/stripe [200]
```

If you see `[400]` or `[500]`, check your backend logs in Terminal 1.

### 6.5 Test Billing Portal

1. In Dashboard, click **Manage Billing**
2. Should open Stripe Customer Portal
3. Verify you can:
   - View subscription details
   - Update payment method
   - Cancel subscription (optional - don't do this if you want to keep testing)

### 6.6 Test Unlimited Usage

1. Click **Process Request** 10+ times
2. Should all succeed (no limit errors)

## Step 7: Deploy to Production

See [Deployment Guide](deployment.md) for complete instructions.

**Quick overview:**

1. **Backend**: Deploy to Cloudflare Workers
   ```bash
   cd api
   npm run deploy
   ```

2. **Frontend**: Connect GitHub repo to Cloudflare Pages
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `frontend-v2`

3. **Set production secrets** in Cloudflare dashboard

4. **Update Stripe webhook** to point to production Worker URL

## Troubleshooting

### "Invalid JWT" Error

**Symptom:** API returns 401 Unauthorized

**Fixes:**
- Verify `CLERK_SECRET_KEY` is correct in `api/.dev.vars`
- Check JWT template is named exactly `pan-api`
- Ensure JWT template includes `plan` claim

### "No price ID configured" on Checkout

**Symptom:** Clicking "Upgrade" fails with error

**Fixes:**
- Verify `STRIPE_PRICE_ID_PRO` is set in `api/.dev.vars`
- Price ID should start with `price_`
- Restart backend after changing `.dev.vars`

### Webhook Not Updating Plan

**Symptom:** After payment, still shows Free tier

**Fixes:**
- Check Terminal 3 - is webhook forwarder running?
- Copy the `whsec_...` secret to `api/.dev.vars`
- Restart backend after updating secret
- Verify Stripe product has metadata: `{ "plan": "pro" }`

### CORS Errors in Browser Console

**Symptom:** API requests fail with CORS error

**Fixes:**
- Check `ALLOWED_ORIGINS` in `api/.dev.vars`
- Should include `http://localhost:5173`
- Format: Comma-separated, no spaces
- Restart backend after changing

### KV Errors

**Symptom:** `Error: KV namespace not found`

**Fixes:**
- Check `wrangler.toml` has KV binding:
  ```toml
  [[kv_namespaces]]
  binding = "USAGE_KV"
  id = "..."
  ```
- Run `wrangler kv:namespace create USAGE_KV` if missing

### Rate Limit Errors (429)

**Symptom:** Requests fail with "Rate limit exceeded"

**Context:** This is the security rate limit (100 req/min), separate from tier limits.

**Fixes:**
- This is working as intended - wait 1 minute
- To adjust: Change `RATE_LIMIT_PER_MINUTE` in `api/src/index.ts`

## Production Checklist

Before going live, verify:

- [ ] All test mode keys replaced with live keys
- [ ] Webhook points to production Worker URL
- [ ] `ALLOWED_ORIGINS` includes production frontend URL
- [ ] Stripe products have correct metadata
- [ ] Customer Portal is enabled and tested
- [ ] Email verification is working
- [ ] Test end-to-end flow in production (sign up → upgrade → verify)

## Security Recommendations

### Environment Variables
- ✅ Never commit `.dev.vars` or `.env` files
- ✅ Use Cloudflare Worker secrets for production
- ✅ Rotate keys if accidentally exposed

### Clerk Settings
- ✅ Enable email verification
- ✅ Set session lifetime (default 7 days is fine)
- ✅ Configure allowed redirect URLs in production

### Stripe Settings
- ✅ Enable webhook signature verification (we do this)
- ✅ Set up fraud prevention rules in Stripe Dashboard
- ✅ Monitor failed payment events

### Cloudflare Settings
- ✅ Enable Bot Fight Mode (free DDoS protection)
- ✅ Set up rate limiting rules (optional, beyond code-level limits)
- ✅ Review security headers (already configured in code)

---

**Next Steps:**
- [Architecture Guide](architecture.md) - Understand how it works
- [Deployment Guide](deployment.md) - Deploy to production
- [Testing Guide](testing.md) - Comprehensive testing checklist
