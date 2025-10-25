# Complete Setup Guide

**Time to complete:** 15-20 minutes
**Difficulty:** Beginner-friendly

This guide walks you through setting up your local development environment. By the end, you'll have a working SaaS with auth, billing, and edge deployment running on your laptop.

---

## 📋 Chapter 1: Prerequisites (5 minutes)

### What You Need

Before starting, create **free accounts** at these platforms:

1. **[Clerk](https://clerk.com)** - User authentication
   - Free tier: 10,000 monthly active users
   - Why: Handles signup, login, OAuth, password resets

2. **[Stripe](https://stripe.com)** - Payment processing
   - Free tier: Unlimited test mode transactions
   - Why: Handles subscriptions, billing, customer portal

3. **[Cloudflare](https://cloudflare.com)** - Edge hosting
   - Free tier: 100,000 requests/day
   - Why: Hosts your API globally (300+ cities, <50ms latency)

**Total signup time:** ~5 minutes

---

### Install Required Tools

You need these CLI tools to run the project locally:

#### 1. Node.js 20+
**Download:** https://nodejs.org
**Why:** Runs the build tools and local dev servers
**Check version:** `node --version` (should show v20 or higher)

#### 2. Wrangler CLI (Cloudflare)
```bash
npm install -g wrangler
```
**Why:** Deploys your API to Cloudflare Workers and runs it locally
**Official docs:** https://developers.cloudflare.com/workers/wrangler/

#### 3. Stripe CLI
**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
scoop install stripe
```

**Linux:**
Download from https://github.com/stripe/stripe-cli/releases

**Why:** Forwards Stripe webhooks to your local development server (without this, paid users stay on the free tier forever)
**Official docs:** https://stripe.com/docs/stripe-cli

---

### Clone & Install Dependencies

```bash
git clone <your-repo>
cd clerk-exp

# Install backend dependencies
cd api
npm install

# Install frontend dependencies
cd ../frontend-v2
npm install
```

**What just happened:**
- `api/` - Backend (Cloudflare Worker) - handles auth, billing, usage tracking
- `frontend-v2/` - Frontend (React + Vite) - landing page, dashboard, Clerk UI

---

## 🔐 Chapter 2: Clerk Setup (5 minutes)

Clerk handles all user management - signups, logins, password resets, OAuth flows. You never touch passwords or session management.

### Step 1: Create Clerk Application

1. Go to [clerk.com/dashboard](https://dashboard.clerk.com)
2. Click **"Add Application"**
3. Choose authentication methods:
   - ✅ **Email** (recommended - works everywhere)
   - ✅ **Google OAuth** (optional - easier signup)
   - ❌ Skip phone/SMS for now (costs money)

**📸 Screenshot marker:** *Clerk application creation screen with Email + Google selected*

**Why these choices:** Email is universal. Google OAuth increases conversion (one-click signup). Phone auth costs money and adds friction.

---

### Step 2: Create JWT Template ⚠️ CRITICAL STEP

**This is the most important configuration step. Get this wrong and your API won't know which plan users are on.**

1. In Clerk Dashboard, go to **"JWT Templates"**
2. Click **"New Template"**
3. Set **Name:** `pan-api` (this exact name!)
4. Click **"Add Claim"**
5. Add this custom claim:

```json
{
  "plan": "{{user.public_metadata.plan}}"
}
```

6. Click **"Save"**

**📸 Screenshot marker:** *JWT template editor showing the plan claim*

**Why this matters:**

Your API reads the user's subscription tier directly from their JWT token. Here's the flow:

```
User signs in → Clerk generates JWT → JWT includes "plan" field
↓
User makes API request with JWT → API reads plan from token
↓
API checks: plan === 'free' ? Limit 10 requests : Unlimited
```

**No database lookup needed.** When a user upgrades via Stripe, the webhook updates their `public_metadata.plan` in Clerk. The next time they request a JWT (automatic on page refresh), it includes the new plan.

**What if I name it wrong?** Your API won't find the template and will reject all requests with 401 Unauthorized.

**Official docs:** [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
**Video tutorial:** [JWT Templates Explained (8 min)](https://www.youtube.com/watch?v=8VKx91bU7GY)

---

### Step 3: Copy Your API Keys

From Clerk Dashboard → **API Keys**, copy these two values:

- **Publishable Key**: Starts with `pk_test_...` (safe to expose in frontend)
- **Secret Key**: Starts with `sk_test_...` (NEVER expose - backend only)

**📸 Screenshot marker:** *API Keys page showing the two keys*

**Save these** - you'll paste them into environment variables in Chapter 4.

**⚠️ Test vs Live Keys:**

You have TWO sets of keys:
- **Test mode** (`pk_test`, `sk_test`) - For development, creates fake users
- **Live mode** (`pk_live`, `sk_live`) - For production, creates real users

Use **test keys** until you're ready to charge real money. Switch to **live keys** when deploying to production.

---

## 💳 Chapter 3: Stripe Setup (5 minutes)

Stripe handles subscription billing, payment processing, and the customer portal (where users manage their billing).

### Step 1: Create Products & Price IDs

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click **"Add Product"**

**Create your pricing tiers as Stripe products:**

#### Product 1: Pro Plan
- **Name:** Pro
- **Description:** Unlimited requests
- **Pricing:** $29/month (recurring monthly)
- Click **"Save product"**
- **Copy the Price ID** (starts with `price_` - you'll need this!)

**Repeat for other paid tiers** (e.g., Enterprise at $199/month)

**📸 Screenshot marker:** *Product creation page with recurring monthly selected*

**Why "Price ID" not "Product ID"?**

Stripe separates products (what you're selling) from prices (how much it costs). One product can have multiple prices (e.g., monthly $29, annual $290). You need the **Price ID** to create checkout sessions.

**What about the Free tier?**

Don't create a Stripe product for Free. We handle free tier logic in code. Only create Stripe products for **paid tiers**.

---

### Step 2: Add Critical Product Metadata ⚠️

**This is how webhooks know which plan the user bought. Skip this and webhooks will fail silently.**

For **each paid product**:

1. Click the product name in [Products dashboard](https://dashboard.stripe.com/test/products)
2. Scroll to **"Metadata"** section
3. Click **"Add metadata"**
4. Key: `plan`
5. Value: `pro` (lowercase, matches your tier name exactly)
6. Click **"Save"**

**📸 Screenshot marker:** *Metadata section showing plan:pro*

**Why this matters:**

When a user completes checkout, Stripe sends a webhook like:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "metadata": {
      "plan": "pro"  ← This tells our webhook which tier to assign
    }
  }
}
```

Our webhook reads this and updates Clerk: `user.publicMetadata.plan = 'pro'`

**What if metadata is wrong?**

If you set metadata to `"Pro"` (capital P) but your code expects `"pro"` (lowercase), the webhook won't match and users stay on the free tier after paying. **Case and spelling must match exactly.**

**Official docs:** [Stripe Product Metadata](https://stripe.com/docs/api/metadata)

---

### Step 3: Enable Customer Portal

The Customer Portal lets users manage their subscription without you building a billing UI.

1. Go to [Stripe Dashboard → Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
2. Click **"Activate test link"**
3. Configure settings:
   - ✅ **Cancel subscriptions** (let users downgrade to free)
   - ✅ **Update payment methods** (expired cards)
   - ✅ **View invoices** (download receipts)
4. Click **"Save"**
5. **Copy the Portal Configuration ID** (starts with `bpc_...`)

**📸 Screenshot marker:** *Customer Portal settings page*

**Why this matters:**

Without this, users can't cancel subscriptions or update their credit card. You'd have to build a whole billing UI. Stripe's portal is free and handles all edge cases (failed payments, proration, tax).

**What does it look like?**

Users click "Manage Billing" → Opens `billing.stripe.com` → They see their subscription, payment method, invoices. Everything is Stripe-hosted.

---

### Step 4: Set Up Local Webhook Testing

**This step is for local development only. Production webhooks are configured after deployment.**

Open a new terminal and run:

```bash
stripe login
```

Follow the browser prompt to authorize the CLI.

Then start the webhook forwarder:

```bash
stripe listen --forward-to http://localhost:8787/webhook/stripe
```

**Keep this terminal open!** You'll see webhook events in real-time.

The output will show:
```
> Ready! Your webhook signing secret is whsec_abc123...
```

**Copy that `whsec_...` secret** - you'll paste it in the next chapter.

**📸 Screenshot marker:** *Terminal showing webhook forwarder running*

**Why this matters:**

When a user pays in production, Stripe sends a POST request to your server: "Hey, user X just subscribed to plan Y." But in development, your laptop isn't accessible from the internet. Stripe CLI creates a tunnel:

```
Stripe.com → Stripe CLI (your laptop) → http://localhost:8787/webhook
```

Without this, you can test checkout, but users won't actually upgrade after paying.

**Official docs:** [Test Webhooks Locally](https://stripe.com/docs/webhooks/test)
**Video tutorial:** [Stripe Webhooks Explained (6 min)](https://www.youtube.com/watch?v=oYSLhriIZaA)

---

## 🔧 Chapter 4: Environment Variables (3 minutes)

**The most tedious part, but you only do it once.**

You need to create **two** `.env` files - one for backend, one for frontend.

---

### Backend: `api/.dev.vars`

Create the file:
```bash
cd api
touch .dev.vars
```

Paste this template (replace with YOUR keys):

```bash
# ==========================================
# CLERK CONFIGURATION
# ==========================================
# From: https://dashboard.clerk.com → API Keys
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_JWT_TEMPLATE=pan-api

# ==========================================
# STRIPE CONFIGURATION
# ==========================================
# From: https://dashboard.stripe.com → Developers → API Keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# From: Terminal running `stripe listen` (Chapter 3, Step 4)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# From: Products page → Click product → Copy Price ID
STRIPE_PRICE_ID_PRO=price_YOUR_PRICE_HERE
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_PRICE_HERE

# From: Customer Portal settings (Chapter 3, Step 3)
STRIPE_PORTAL_CONFIG_ID=bpc_YOUR_CONFIG_HERE

# ==========================================
# CORS & FRONTEND
# ==========================================
# Comma-separated list of allowed origins (no spaces!)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Where your frontend is running
FRONTEND_URL=http://localhost:5173
```

**Where to find each value:**

| Variable | Source |
|----------|--------|
| `CLERK_SECRET_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys → Secret Key |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable Key |
| `CLERK_JWT_TEMPLATE` | Always `pan-api` (the template name you created) |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) → Secret Key |
| `STRIPE_WEBHOOK_SECRET` | Output from `stripe listen` command |
| `STRIPE_PRICE_ID_*` | Stripe Dashboard → Products → Click product → Price ID |
| `STRIPE_PORTAL_CONFIG_ID` | Customer Portal settings → Configuration ID |

**⚠️ IMPORTANT:**
- This file is **.gitignored** (never commit secrets to GitHub!)
- For production, you'll use Cloudflare's secret manager (see Deployment guide)

---

### Frontend: `frontend-v2/.env`

Create the file:
```bash
cd ../frontend-v2
touch .env
```

Paste this:

```bash
# Clerk public key (safe to expose in browser)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Backend API URL
VITE_API_URL=http://localhost:8787
```

**⚠️ Gotcha:** Vite requires the `VITE_` prefix for environment variables. Without it, the values won't be accessible in your React code.

**For production:** Change `VITE_API_URL` to your deployed Worker URL (e.g., `https://api.yourdomain.com`)

---

### Verify Your Setup

Check both files exist:

```bash
ls api/.dev.vars            # Should show: api/.dev.vars
ls frontend-v2/.env         # Should show: frontend-v2/.env
```

**Why so many environment variables?**

Each service (Clerk, Stripe, Cloudflare) needs its own credentials. Think of it like house keys - you need one for the front door, one for the garage, one for the mailbox. Pain to set up once, then you never touch them again.

**What if I miss a variable?**

The app will crash with a helpful error message telling you which key is missing. Common errors:
- `CLERK_SECRET_KEY is undefined` → You forgot to add it to `.dev.vars`
- `VITE_CLERK_PUBLISHABLE_KEY is not defined` → You forgot the `VITE_` prefix

---

## 🚀 Chapter 5: Run Locally (2 minutes)

You need **THREE terminals** running simultaneously. This is normal for full-stack development.

### Terminal 1: Backend API

```bash
cd api
npm run dev
```

**Expected output:**
```
⛅️ wrangler 3.x.x
------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

**What's running:** Your Cloudflare Worker (backend API) with JWT verification, Stripe integration, and usage tracking.

**If it fails:**
- Check `api/.dev.vars` exists and has all variables
- Try `rm -rf node_modules && npm install` and run again

---

### Terminal 2: Frontend Dev Server

```bash
cd frontend-v2
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**What's running:** React app with Vite hot-reload. Changes to code update instantly.

**If it fails:**
- Check `frontend-v2/.env` exists
- Make sure port 5173 isn't in use (`lsof -i :5173` to check)

---

### Terminal 3: Stripe Webhook Forwarder

```bash
stripe listen --forward-to http://localhost:8787/webhook/stripe
```

**Expected output:**
```
Ready! Your webhook signing secret is whsec_xxxxx
```

**What's running:** Tunnel that forwards Stripe webhook events to your local backend.

**⚠️ Did the secret change?**

If you see a different `whsec_...` value than before:
1. Copy the new secret
2. Update `api/.dev.vars` with new `STRIPE_WEBHOOK_SECRET`
3. **Restart Terminal 1** (backend doesn't hot-reload env vars)

**If it fails:**
- Run `stripe login` first
- Check you're not already running `stripe listen` in another terminal

---

### You're Ready!

Open your browser to **http://localhost:5173**

You should see the landing page with pricing tiers.

**📸 Screenshot marker:** *Landing page with Free, Pro, Enterprise tiers*

---

## ✅ Chapter 6: Test End-to-End (5 minutes)

Let's verify everything works by going through the full user journey.

### Test 1: Sign Up Flow

1. Click **"Get Started"** on the Free tier
2. Enter email and password
3. Check your email for verification link
4. Click verification link
5. You should land on the **Dashboard**

**Expected result:** Dashboard shows "0 / 10 requests" (Free tier)

**📸 Screenshot marker:** *Dashboard showing Free tier with 0/10 usage*

**If it fails:**
- "Invalid JWT" error → Check your JWT template name is exactly `pan-api`
- Redirect loop → Check `VITE_CLERK_PUBLISHABLE_KEY` in frontend `.env`

---

### Test 2: Free Tier Limits

1. In Dashboard, click **"Process Request"** button
2. Counter should increment: 1/10, 2/10, etc.
3. Click 10 times total
4. On the 11th click: Should see error "Free tier limit reached"

**Expected result:** Free tier correctly enforces 10 request limit

**If it fails:**
- Check Terminal 1 (backend) logs for errors
- Verify `TIER_CONFIG` in `api/src/index.ts` has `free: { limit: 10 }`

---

### Test 3: Upgrade to Pro

1. Click **"Upgrade Plan"** button
2. Should redirect to Stripe Checkout page
3. Enter test credit card:
   - **Card:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/34`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP:** Any 5 digits (e.g., `12345`)
4. Click **"Subscribe"**
5. Should redirect back to Dashboard

**Expected result:** You're redirected back successfully

**If checkout doesn't load:**
- Check `STRIPE_PRICE_ID_PRO` in `api/.dev.vars`
- Price ID should start with `price_`
- Check Terminal 1 for "No price ID configured" error

**More test cards:** https://stripe.com/docs/testing#cards

---

### Test 4: Verify Webhook Processed

**In Terminal 3** (Stripe webhook forwarder), you should see:

```
2025-01-15 12:34:56   --> checkout.session.completed [evt_abc123]
2025-01-15 12:34:56   <-- [200] POST http://localhost:8787/webhook/stripe [evt_abc123]
```

**Expected result:** Status code `[200]` (success)

**If you see `[400]` or `[500]`:**
1. Check Terminal 1 (backend) for error details
2. Common issues:
   - `[400]` → Webhook secret is wrong, update `STRIPE_WEBHOOK_SECRET`
   - `[500]` → Stripe product metadata missing, add `{ "plan": "pro" }`

---

### Test 5: Verify Plan Updated

1. **Refresh the Dashboard page** (this is important!)
2. Should now show: **"✨ Unlimited • Pro Plan Active"**
3. Usage counter should show: **"10"** (no limit)

**📸 Screenshot marker:** *Dashboard showing Pro plan with unlimited badge*

**Why refresh?**

The JWT token is cached in your browser. Refreshing fetches a new token from Clerk with the updated `plan` field. In production, you can auto-refresh after webhook confirms payment.

**If plan doesn't update:**
- Check Stripe product has metadata: `{ "plan": "pro" }`
- Verify Clerk Dashboard → Users → Your user → Public Metadata shows `{ "plan": "pro" }`
- If metadata is missing, webhook didn't run - check Terminal 3 logs

---

### Test 6: Unlimited Usage

1. Click **"Process Request"** 20+ times
2. All requests should succeed
3. No "limit reached" error

**Expected result:** Pro plan has no limits

---

### Test 7: Billing Portal

1. Click **"Manage Billing"** button
2. Should open Stripe Customer Portal (billing.stripe.com)
3. Verify you can see:
   - Current subscription (Pro - $29/month)
   - Payment method (test card ending in 4242)
   - Invoice history

**Expected result:** Portal loads and shows subscription details

**📸 Screenshot marker:** *Stripe Customer Portal showing active subscription*

**If portal doesn't load:**
- Check `STRIPE_PORTAL_CONFIG_ID` in `api/.dev.vars`
- Verify Customer Portal is enabled in Stripe Dashboard

---

### Test 8: Subscription Cancellation (Optional)

**Only do this if you want to test the downgrade flow:**

1. In Customer Portal, click **"Cancel plan"**
2. Confirm cancellation
3. Return to Dashboard
4. Should still show Pro (subscription ends at period end)
5. Wait until period end OR manually expire in Stripe Dashboard
6. User downgrades to Free automatically

**Why test this?**

Ensures the `customer.subscription.deleted` webhook works correctly.

---

## 🎉 Success!

If all tests passed, your local environment is fully configured! You now have:

✅ Working auth with Clerk
✅ Subscription billing with Stripe
✅ Usage tracking with Cloudflare KV
✅ JWT-based tier routing
✅ Webhook processing
✅ Customer portal

---

## 🚨 Common Issues & Fixes

### Issue: "Invalid JWT" (401 Unauthorized)

**Symptoms:**
- API returns 401 on every request
- Browser console shows "Unauthorized"

**Fixes:**
1. Check JWT template name is **exactly** `pan-api` (case-sensitive)
2. Verify `CLERK_SECRET_KEY` in `api/.dev.vars` matches Clerk Dashboard
3. Ensure JWT template includes the `plan` claim
4. Restart Terminal 1 (backend) after changing `.dev.vars`

**Still broken?**

Test JWT verification:
```bash
cd api
wrangler tail
```

Make a request from frontend, check logs for detailed error.

---

### Issue: "No price ID configured for tier: pro"

**Symptoms:**
- Checkout fails when clicking "Upgrade"
- Error in Terminal 1

**Fixes:**
1. Check `STRIPE_PRICE_ID_PRO` is set in `api/.dev.vars`
2. Price ID should start with `price_` (not `prod_`)
3. Copy from Stripe Dashboard → Products → Click product → Price ID
4. **Restart Terminal 1** after adding the variable

---

### Issue: Plan doesn't update after payment

**Symptoms:**
- Checkout succeeds
- Stripe shows subscription as active
- Dashboard still shows Free tier (even after refresh)

**Fixes:**
1. **Check Terminal 3**: Is webhook forwarder running?
2. **Check webhook status**: Should show `[200]` not `[400]` or `[500]`
3. **Verify Stripe metadata**: Product must have `{ "plan": "pro" }` (lowercase!)
4. **Check Clerk metadata**: Dashboard → Users → Your user → Public Metadata
   - Should show `{ "plan": "pro" }`
   - If missing, webhook didn't update it
5. **Check webhook secret**: Copy `whsec_...` from Terminal 3 to `api/.dev.vars`

**Debug webhook:**

In Terminal 3, resend the last event:
```bash
stripe trigger checkout.session.completed
```

Check Terminal 1 for error details.

---

### Issue: CORS errors in browser console

**Symptoms:**
```
Access to fetch at 'http://localhost:8787' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Fixes:**
1. Check `ALLOWED_ORIGINS` in `api/.dev.vars`
2. Should include: `http://localhost:5173` (no trailing slash!)
3. Format: Comma-separated, **no spaces**
4. Example: `http://localhost:5173,http://localhost:3000`
5. **Restart Terminal 1** after changing

---

### Issue: KV namespace errors

**Symptoms:**
```
Error: KV namespace "USAGE_KV" not found
```

**Fixes:**
1. Check `api/wrangler.toml` has KV binding:
   ```toml
   [[kv_namespaces]]
   binding = "USAGE_KV"
   id = "YOUR_NAMESPACE_ID"
   ```
2. If missing, create namespace:
   ```bash
   cd api
   wrangler kv:namespace create USAGE_KV
   ```
3. Copy the `id` from output to `wrangler.toml`
4. Restart Terminal 1

---

### Issue: Rate limit errors (429)

**Symptoms:**
- Requests fail with "Rate limit exceeded"
- Happens after ~100 requests in 1 minute

**Context:**

This is the **security rate limit** (separate from tier limits). Prevents API abuse.

**Fixes:**
- **Wait 1 minute** for rate limit window to reset
- This is working as intended
- To adjust: Edit `RATE_LIMIT_PER_MINUTE` in `api/src/index.ts`

**Tier limits vs Rate limits:**
- **Tier limit**: How many requests per month (Free: 10, Pro: Unlimited)
- **Rate limit**: How many requests per minute (100 for all tiers)

---

### Issue: Wrangler fails to start

**Symptoms:**
```
Error: Could not resolve "some-package"
```

**Fixes:**
```bash
cd api
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Issue: Vite port already in use

**Symptoms:**
```
Port 5173 is already in use
```

**Fixes:**

Find and kill the process:
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or use a different port:
```bash
npm run dev -- --port 3000
```

---

## 📚 What's Next?

You're now running locally! Here's what to do next:

### Customize Your Tiers
Use the `/configure-tiers` command to add more tiers or change pricing:
```
/configure-tiers
```

See [Tier Customization Guide](tier-customization.md) for details.

---

### Deploy to Production
Ready to go live? See the [Deployment Guide](deployment.md):
- Deploy backend to Cloudflare Workers
- Deploy frontend to Cloudflare Pages
- Set production secrets
- Configure production webhooks

---

### Understand the Architecture
Read the [Architecture Guide](architecture.md) to understand:
- Why JWT-based stateless auth is used
- How the tier system works
- Data flow diagrams
- Security decisions

---

### Test Thoroughly
Before launch, run the [Testing Guide](testing.md) checklist:
- Edge cases (failed payments, expired cards)
- Security testing (rate limits, auth)
- Load testing (can it handle traffic?)

---

## 🔗 Helpful Resources

### Official Documentation
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Stripe Test Cards](https://stripe.com/docs/testing)

### Video Tutorials
- [Clerk + React Setup (8 min)](https://www.youtube.com/watch?v=8VKx91bU7GY)
- [Stripe Webhooks Explained (6 min)](https://www.youtube.com/watch?v=oYSLhriIZaA)
- [Cloudflare Workers Crash Course (12 min)](https://www.youtube.com/watch?v=7zPQ9pY_ADE)

---

**Questions?** See the [FAQ](faq.md) or check [Troubleshooting](#-common-issues--fixes) above.

**Ready to ship?** Continue to the [Deployment Guide](deployment.md) →
