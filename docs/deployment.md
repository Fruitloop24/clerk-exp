# Deployment Guide

Complete instructions for deploying to Cloudflare's edge platform.

## Overview

This template uses two Cloudflare products:

1. **Cloudflare Workers** - Backend API (stateless edge functions)
2. **Cloudflare Pages** - Frontend hosting (static site on global CDN)

Both are free until you hit significant scale (10k+ users).

## Prerequisites

- Cloudflare account (sign up at https://cloudflare.com)
- GitHub account (for Pages auto-deployment)
- Wrangler CLI installed (`npm install -g wrangler`)
- All environment variables ready (see Setup Guide)

## Part 1: Deploy Backend (Cloudflare Workers)

### 1.1 Install Wrangler

```bash
npm install -g wrangler
```

### 1.2 Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authorize Wrangler. Click **Allow**.

### 1.3 Create KV Namespace

```bash
cd api
wrangler kv:namespace create USAGE_KV
```

**Output:**
```
✨ Created namespace USAGE_KV
{ binding = "USAGE_KV", id = "abc123..." }
```

Copy the `id` value and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "USAGE_KV"
id = "abc123..."  # ← Paste your ID here
```

### 1.4 Set Production Secrets

These are separate from `.dev.vars` (local only). Set each secret:

```bash
# Clerk secrets
wrangler secret put CLERK_SECRET_KEY
# Paste your sk_live_... key when prompted

wrangler secret put CLERK_PUBLISHABLE_KEY
# Paste your pk_live_... key

wrangler secret put CLERK_JWT_TEMPLATE
# Enter: pan-api

# Stripe secrets
wrangler secret put STRIPE_SECRET_KEY
# Paste your sk_live_... key

wrangler secret put STRIPE_WEBHOOK_SECRET
# We'll set this after creating the webhook in Step 1.6

wrangler secret put STRIPE_PRICE_ID_PRO
# Paste your price_... ID

wrangler secret put STRIPE_PORTAL_CONFIG_ID
# Paste your bpc_... ID

# CORS (optional)
wrangler secret put ALLOWED_ORIGINS
# Enter your production frontend URL (e.g., https://yourdomain.com)
```

**Pro tip:** To update a secret later, just run the same command again.

### 1.5 Deploy Worker

```bash
npm run deploy
```

**Output:**
```
✨ Uploaded clerk-api (X.X KiB)
✨ Published clerk-api
   https://clerk-api.<your-subdomain>.workers.dev
```

Copy this Worker URL - you'll need it for:
- Frontend configuration (`VITE_API_URL`)
- Stripe webhook endpoint

### 1.6 Configure Stripe Webhook (Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://YOUR-WORKER.workers.dev/webhook/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing Secret** (starts with `whsec_...`)

Set the webhook secret:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the whsec_... value
```

### 1.7 Test Worker

```bash
curl https://YOUR-WORKER.workers.dev/health
```

**Expected response:**
```json
{"status":"ok"}
```

If you see this, your Worker is live! 🎉

## Part 2: Deploy Frontend (Cloudflare Pages)

### 2.1 Push Code to GitHub

If you haven't already:

```bash
git remote add origin https://github.com/yourusername/your-repo.git
git add .
git commit -m "Ready for deployment"
git push -u origin main
```

### 2.2 Connect GitHub to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Authorize Cloudflare to access your GitHub account
5. Select your repository

### 2.3 Configure Build Settings

On the setup page, configure:

**Framework preset:** Vite

**Build configuration:**
- **Root directory:** `frontend-v2`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Click **Save and Deploy**.

### 2.4 Set Environment Variables (Frontend)

While the first build is running, set environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add variables:

**Production (and Preview):**
```
VITE_CLERK_PUBLISHABLE_KEY = pk_live_...
VITE_API_URL = https://YOUR-WORKER.workers.dev
```

**Important:** Use your production Clerk key (starts with `pk_live_`), not test key.

3. Click **Save**

### 2.5 Trigger Redeploy

The first build used default values. Redeploy to pick up environment variables:

1. Go to **Deployments** tab
2. Click **···** on latest deployment
3. Click **Retry deployment**

### 2.6 Verify Deployment

Once deployed (takes ~1 minute):

1. Click **Visit site**
2. Test the flow:
   - Sign up with real email
   - Verify email
   - Make 5 free requests
   - Hit limit
   - Upgrade to Pro (use real card or test card)
   - Verify unlimited access

Your SaaS is now LIVE! 🚀

## Part 3: Custom Domain (Optional)

### 3.1 Add Custom Domain to Pages

1. In Cloudflare Pages dashboard, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions

Cloudflare automatically provisions SSL certificates (free).

### 3.2 Update Environment Variables

Update `VITE_API_URL` if you want a custom domain for the API too:

1. In Workers dashboard, go to your Worker
2. Click **Settings** → **Triggers** → **Add Custom Domain**
3. Enter domain (e.g., `api.yourdomain.com`)
4. Update `VITE_API_URL` in Pages environment variables
5. Redeploy Pages

### 3.3 Update Stripe Webhook URL

If using custom domain for API:

1. Go to Stripe webhooks
2. Edit your production endpoint
3. Update URL to: `https://api.yourdomain.com/webhook/stripe`

### 3.4 Update Clerk Allowed Origins

1. Go to Clerk Dashboard → **API Keys**
2. Scroll to **Allowed origins**
3. Add your custom domain: `https://app.yourdomain.com`

## Part 4: CI/CD with GitHub Actions

The template includes a GitHub Actions workflow for automatic Worker deployment.

### 4.1 Configure GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

**CLOUDFLARE_API_TOKEN:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Copy the token and add to GitHub

**CLOUDFLARE_ACCOUNT_ID:**
1. Go to Cloudflare dashboard
2. Click any Worker
3. Right sidebar shows **Account ID** - copy it
4. Add to GitHub secrets

### 4.2 How CI/CD Works

**Automatic deployment triggers:**
- Push to `main` branch
- Changes in `api/**` directory only

**Manual deployment:**
- Go to **Actions** tab → **Deploy Worker** → **Run workflow**

**Workflow steps:**
1. Checkout code
2. Install dependencies
3. Deploy to Cloudflare Workers
4. Worker automatically picks up secrets (already set via `wrangler secret`)

## Part 5: Monitoring & Logs

### 5.1 Worker Logs

**Real-time logs:**

```bash
wrangler tail
```

Shows live request logs, errors, and console output.

**Dashboard logs:**
1. Go to Workers dashboard → Your Worker
2. Click **Logs** tab
3. View request metrics, errors, CPU time

### 5.2 Pages Logs

1. Go to Pages dashboard → Your project
2. Click **Deployments** → Latest deployment
3. View build logs and function logs

### 5.3 Error Tracking (Optional)

Integrate Sentry for better error tracking:

1. Sign up at https://sentry.io
2. Create project for Cloudflare Workers
3. Add SDK to `api/src/index.ts`:

```typescript
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

4. Set `SENTRY_DSN` secret via Wrangler

### 5.4 Uptime Monitoring (Optional)

Use Cloudflare Health Checks or UptimeRobot:

1. Monitor `https://YOUR-WORKER.workers.dev/health`
2. Alert if response isn't `{"status":"ok"}`

## Cost Breakdown

### Development (Free Tier)

| Service | Limit | Overage |
|---------|-------|---------|
| Workers | 100k req/day | N/A (hard limit) |
| KV | 100k reads/day, 1k writes/day | N/A (hard limit) |
| Pages | Unlimited builds | Free |
| Clerk | 10k MAU | $25/mo for 10k-50k |
| Stripe | Free | 2.9% + 30¢ per transaction |

**Total:** $0/month until 10k users

### Production (Paid Workers Plan)

| Service | Cost | Notes |
|---------|------|-------|
| Workers | $5/mo | 10M requests included |
| KV | $0.50/GB + $0.50/M reads | ~$1/mo for 10k users |
| Pages | Free | Unlimited |
| Clerk | $25/mo | 10k-50k MAU tier |
| Stripe | 2.9% + 30¢ | Per transaction |

**Total:** ~$31/month + transaction fees

### When You Hit 100k Users

| Service | Estimated Cost |
|---------|----------------|
| Workers | $5/mo (10M req) |
| KV | ~$5/mo (storage + ops) |
| Clerk | $99/mo (50k-100k MAU) |
| Stripe | 2.9% + 30¢ per transaction |

**Total:** ~$109/month + transaction fees

**Still no database costs.** That's the power of stateless architecture.

## Rollback & Version Management

### Rollback to Previous Deployment

**Workers:**
```bash
wrangler rollback
```

**Pages:**
1. Go to **Deployments** tab
2. Find previous working deployment
3. Click **···** → **Rollback to this deployment**

### Version Tags

Tag production releases:

```bash
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

Reference tags in rollbacks:

```bash
git checkout v1.0.0
cd api && npm run deploy
```

## Security Hardening for Production

### Workers Security

✅ **Already Configured:**
- JWT verification on every request
- Webhook signature verification
- Security headers (CSP, HSTS, etc.)
- Dynamic CORS (no wildcards)
- Rate limiting (100 req/min per user)

🔒 **Additional Hardening:**

1. **Enable Bot Fight Mode** (free DDoS protection)
   - Go to Cloudflare dashboard → Your domain → Security → Bots
   - Enable **Bot Fight Mode**

2. **Add WAF Rules** (paid feature, optional)
   - Block common attack patterns
   - Geo-blocking if needed

3. **Set up Alerts**
   - Email notifications for 5xx errors
   - Spike alerts for unusual traffic

### Pages Security

✅ **Already Configured:**
- HTTPS enforced (automatic)
- Static assets on CDN (DDoS resistant)

🔒 **Additional Hardening:**

1. **Access Policies** (if app has admin sections)
   - Use Cloudflare Access to add auth layer

2. **Content Security Policy**
   - Already set in Worker responses
   - Review and tighten for your use case

## Troubleshooting Deployment

### "Unauthorized" Error During Deploy

**Fix:**
```bash
wrangler logout
wrangler login
```

### KV Binding Error

**Symptom:** `Error: No such namespace USAGE_KV`

**Fix:** Check `wrangler.toml` has correct KV namespace ID:
```bash
wrangler kv:namespace list
```

### Pages Build Fails

**Symptom:** Build fails with `MODULE_NOT_FOUND`

**Fix:** Verify `Build command` is `npm run build`, not `npm build`

### Environment Variables Not Applied

**Symptom:** Pages build succeeds but app doesn't work

**Fix:**
1. Verify variables are set in **both** Production and Preview
2. Redeploy after setting variables (not automatic)

### Worker Returns 500 on All Requests

**Fix:** Check real-time logs:
```bash
wrangler tail
```

Common causes:
- Missing secrets (check with `wrangler secret list`)
- Incorrect KV binding in `wrangler.toml`
- Syntax errors in recent code changes

---

**Next Steps:**
- [Testing Guide](testing.md) - Test production deployment
- [Architecture Guide](architecture.md) - Understand the stack
- [Setup Guide](setup.md) - Local development reference
