# Production SaaS Starter - Cloudflare Edge Edition

> **Ship your SaaS in days, not months.** Complete auth + billing + tier management on Cloudflare's edge. Stateless JWT architecture. No database to maintain. Free hosting until 10,000+ users.

**Live Demo**: https://clerk-frontend.pages.dev/
**Stack**: React 19 + Cloudflare Workers + Clerk + Stripe

---

## Why This Template?

Most SaaS templates are "hello world" demos. **This is production-ready infrastructure.**

### The Hard Parts, Already Built

✅ **Stateless JWT Authentication** - User's plan lives in the token. Zero database lookups for authorization.
✅ **Subscription Billing** - Stripe integration with webhooks, customer portal, and tier management.
✅ **Usage Limits & Tracking** - Per-tier request limits with monthly resets.
✅ **Global Edge Deployment** - Runs in 300+ cities. ~50ms response times worldwide.
✅ **Security Hardening** - Rate limiting, webhook verification, CORS, security headers.
✅ **$0 Hosting Costs** - Free until 10k+ users on Cloudflare's free tier.

### What Makes This Different

**1. JWT as Single Source of Truth**

Traditional SaaS: `Request → Verify auth → Query DB for plan → Check limits → Process`

This template: `Request → Verify JWT (plan included) → Check limits → Process`

**No database lookups.** The user's subscription tier is embedded in their JWT. When they upgrade, Stripe webhooks update Clerk metadata, and the next JWT automatically includes the new plan.

**2. Edge-Native Architecture**

Your API runs globally, not in a single region. Cloudflare deploys your code to 300+ cities. Users in Tokyo, London, and New York all get ~50ms response times.

**Zero cold starts.** No Lambda spin-up delays. Always-on Workers.

**3. No Database Until You Need One**

- **User identity** → Clerk stores it
- **Subscription status** → Stripe stores it
- **Usage counters** → Cloudflare KV (key-value store)

You only add a database when YOU need to store YOUR app's data (documents, files, posts, etc.). Not for auth/billing infrastructure.

---

## Who Needs This

### Perfect For

🎯 **Indie hackers** - Ship MVPs fast, validate ideas cheaply
🎯 **Solo devs** - Complete backend infrastructure, no team needed
🎯 **SaaS builders** - Focus on YOUR product, not auth/billing wiring
🎯 **Edge-first teams** - Leverage Cloudflare's global network
🎯 **Cost-conscious founders** - $0/month until you're making money

### Drop Your App Behind It

This template provides the **infrastructure layer:**
- ✅ User sign-up and authentication
- ✅ Subscription checkout and management
- ✅ Usage tracking and tier enforcement
- ✅ JWT routing to protect endpoints

**You provide the product logic:**
- AI document processing? Plug it in.
- Image generation API? Drop it behind the auth layer.
- Analytics dashboard? Protected routes ready.
- Whatever you're building? The separation is clean.

**Example integration:**
```typescript
// api/src/index.ts - Add your endpoint

if (url.pathname === '/api/your-feature' && request.method === 'POST') {
  // JWT already verified, userId and plan available
  // Tier limits already checked

  // YOUR CODE HERE
  const result = await yourBusinessLogic(userId, plan);

  // Usage automatically tracked
  return new Response(JSON.stringify({ result }), { status: 200 });
}
```

The JWT, usage tracking, and tier enforcement are already wired up. You write the features.

---

## What You Get

### Authentication & Authorization
- Complete sign-up/sign-in flows with email verification
- JWT token verification on every API request
- User plan metadata in JWT claims (no DB lookups)
- Works perfectly on static hosting (no server sessions)

### Subscription Billing
- Stripe Checkout integration for payment processing
- Default: **2 tiers** (Free + Pro) - add more with MCP agent
- Stripe Customer Portal (manage subscriptions, update cards, view invoices)
- Webhook integration with signature verification and idempotency
- Automatic plan upgrades via metadata sync

### Security & Reliability
- Rate limiting (100 requests/minute per user)
- Webhook idempotency (prevents duplicate processing)
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Dynamic CORS (no wildcards, validated origins)
- User data isolation (all data keyed by userId)
- PCI compliance via Stripe-hosted checkout

### Performance & Scalability
- Global edge deployment (300+ cities)
- Zero cold starts (always-on Workers)
- Instant HMR in development (Vite)
- Optimized production builds
- CDN-first static frontend (Cloudflare Pages)

### Developer Experience
- CI/CD pipeline ready (GitHub Actions)
- Heavily commented code (~2,500 lines TypeScript)
- Environment variable validation
- Local development with hot reload
- TypeScript throughout

---

## Quick Start

### Prerequisites

- Node.js 20+
- Cloudflare account (free tier)
- Clerk account (free up to 10k users)
- Stripe account (test mode)

### 1. Clone & Install

```bash
git clone <your-repo>
cd clerk-exp

# Backend
cd api && npm install

# Frontend
cd ../frontend-v2 && npm install
```

### 2. Configure Services

Create accounts and get API keys:

**Clerk** (https://clerk.com):
- Create application
- Create JWT template named `pan-api` with claim: `{"plan": "{{user.public_metadata.plan}}"}`
- Copy publishable and secret keys

**Stripe** (https://stripe.com):
- Create a Pro tier product ($29/mo or your price)
- Add metadata to product: `{"plan": "pro"}`
- Copy Price ID (starts with `price_`)
- Set up Customer Portal and copy config ID (starts with `bpc_`)

### 3. Set Environment Variables

**Backend** (`api/.dev.vars`):
```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_TEMPLATE=pan-api
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PORTAL_CONFIG_ID=bpc_...
```

**Frontend** (`frontend-v2/.env`):
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8787
```

### 4. Run Locally (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd api && npm run dev
# http://localhost:8787
```

**Terminal 2 - Frontend:**
```bash
cd frontend-v2 && npm run dev
# http://localhost:5173
```

**Terminal 3 - Stripe Webhooks:**
```bash
stripe listen --forward-to http://localhost:8787/webhook/stripe
# Copy whsec_... to api/.dev.vars and restart Terminal 1
```

### 5. Test End-to-End

1. Open http://localhost:5173
2. Sign up with email
3. Make 5 free requests (hit the limit)
4. Click "Upgrade to Pro"
5. Use test card: `4242 4242 4242 4242`
6. Verify unlimited access after refresh

**It works!** 🎉

---

## Add More Tiers (Optional)

Default template ships with **3 tiers**: Free, Pro, and Enterprise.

### Use the `/configure-tiers` Command (Fastest)

If you have Claude Code, simply type:

```
/configure-tiers
```

Answer the questions about your tiers (name, price, limit, features), and it automatically updates:
- ✅ Backend `TIER_CONFIG` with limits and prices
- ✅ Frontend pricing cards with your branding
- ✅ Dashboard displays for each tier
- ✅ Environment variables
- ✅ All routing and Stripe integration

**Time: ~2-3 minutes**

### Manual Configuration

Prefer manual control? Follow the [Tier Customization Guide](docs/tier-customization.md) for step-by-step instructions.

---

## Deploy to Production

### Backend (Cloudflare Workers)

```bash
cd api

# Create KV namespace
wrangler kv:namespace create USAGE_KV
# Copy ID to wrangler.toml

# Set production secrets
wrangler secret put CLERK_SECRET_KEY
wrangler secret put STRIPE_SECRET_KEY
# ... (set all secrets)

# Deploy
npm run deploy
```

### Frontend (Cloudflare Pages)

1. Push to GitHub
2. Go to Cloudflare Dashboard → **Pages** → **Create a project**
3. Connect your repo
4. Configure:
   - **Root directory**: `frontend-v2`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
5. Add environment variables (Clerk + API URL)
6. Deploy!

**Detailed instructions:** [Deployment Guide](docs/deployment.md)

---

## Architecture Overview

### Data Flow

```
User Sign-Up
    ↓
Clerk creates account (publicMetadata.plan = "free")
    ↓
JWT issued with { "userId": "...", "plan": "free" }
    ↓
Frontend sends requests with JWT
    ↓
Worker verifies JWT → Extracts plan → Enforces limits
    ↓
User upgrades via Stripe
    ↓
Webhook updates Clerk metadata (plan = "pro")
    ↓
Next JWT refresh includes { "plan": "pro" }
    ↓
Unlimited access automatically enabled
```

**Key insight:** The plan lives in the JWT. No database lookups. Stateless at the edge.

**Deep dive:** [Architecture Guide](docs/architecture.md)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vite + React 19 | Pure client-side SPA |
| **Frontend Hosting** | Cloudflare Pages | Static CDN (free, unlimited) |
| **Auth** | Clerk | User management + JWT issuance |
| **Payments** | Stripe | Subscriptions + webhooks + portal |
| **API** | Cloudflare Workers | Serverless edge functions |
| **Storage** | Cloudflare KV | Usage counters (key-value store) |
| **CSS** | Tailwind CSS v3 | Utility-first styling |
| **CI/CD** | GitHub Actions | Automated Worker deployment |

---

## Cost Breakdown

### Development (Free Tier)

| Service | Free Limit | Cost |
|---------|-----------|------|
| Cloudflare Workers | 100k req/day | **$0** |
| Cloudflare KV | 100k reads/day, 1k writes/day | **$0** |
| Cloudflare Pages | Unlimited | **$0** |
| Clerk | 10k MAU | **$0** |
| Stripe | Free platform | **$0** + 2.9% per transaction |
| **Total** | | **$0/month** |

### Production (10k Active Users)

| Service | Cost | Notes |
|---------|------|-------|
| Cloudflare Workers | **$5/mo** | 10M requests included |
| Cloudflare KV | **~$1/mo** | Storage + operations |
| Clerk | **$25/mo** | 10k-50k MAU tier |
| Stripe | **2.9% + 30¢** | Per transaction |
| **Total** | **~$31/month** | + transaction fees |

**Compare to typical SaaS stack:**
- Vercel: $20/mo
- Database (Supabase/PlanetScale): $25/mo
- Redis: $5/mo
- Auth (Auth0): $25/mo
- **Total: $75/month** (before transactions)

**Savings: $44/month** or **58% cheaper**

### At Scale (100k Users)

| Service | Cost |
|---------|------|
| Workers | $5/mo (under 10M req) |
| KV | ~$5/mo |
| Clerk | $99/mo (50k-100k MAU) |
| Stripe | 2.9% + 30¢ per transaction |
| **Total** | **~$109/month** + transaction fees |

**Still no database costs.** Scale without infrastructure bloat.

---

## Documentation

- **[Architecture Guide](docs/architecture.md)** - How JWT routing works, data flow diagrams
- **[Setup Guide](docs/setup.md)** - Complete manual setup (Clerk, Stripe, webhooks)
- **[Deployment Guide](docs/deployment.md)** - Deploy to Cloudflare (Workers + Pages)
- **[Testing Guide](docs/testing.md)** - End-to-end testing checklist, 3-terminal setup
- **[Tier Customization](docs/tier-customization.md)** - Add/modify pricing tiers manually
- **[FAQ](docs/faq.md)** - Common issues, troubleshooting, best practices

---

## File Structure

```
clerk-exp/
├── api/                        # Cloudflare Worker (Backend)
│   ├── src/
│   │   ├── index.ts           # Main API (830+ lines, documented)
│   │   └── stripe-webhook.ts  # Webhook handler (190+ lines)
│   ├── wrangler.toml          # Worker config + KV bindings
│   └── .dev.vars              # Local secrets (gitignored)
│
├── frontend-v2/                # React SPA (Frontend)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx    # Landing + pricing cards
│   │   │   ├── Dashboard.tsx  # Protected dashboard
│   │   │   ├── SignInPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   ├── App.tsx            # Router + protected routes
│   │   └── main.tsx           # Entry + ClerkProvider
│   └── vite.config.ts
│
├── docs/                       # Complete documentation
│   ├── architecture.md
│   ├── setup.md
│   ├── deployment.md
│   ├── testing.md
│   ├── tier-customization.md
│   └── faq.md
│
├── .claude/commands/
│   └── configure-tiers.md      # /configure-tiers slash command
│
├── .github/workflows/
│   └── deploy-worker.yml       # CI/CD for Workers
│
└── README.md                   # This file
```

**Total Code:** ~2,500 lines TypeScript (backend + frontend)

---

## What's Next?

### After Cloning

1. **Follow Quick Start** above to get local development running
2. **Read [Setup Guide](docs/setup.md)** for detailed configuration steps
3. **Test end-to-end** - Sign up, upgrade, verify webhooks work
4. **Customize tiers** - Use `/configure-tiers` command or manual configuration
5. **Add your product logic** - Drop your app behind the auth/billing layer

### Before Launch

1. **Switch to live keys** - Production Clerk + Stripe keys
2. **Deploy to production** - Follow [Deployment Guide](docs/deployment.md)
3. **Test in production** - Complete checkout flow with real payment
4. **Set up monitoring** - Cloudflare Analytics, Stripe Dashboard, Clerk Dashboard
5. **Configure custom domain** (optional)

### When Scaling

1. **Add more tiers** - Run MCP agent again or customize manually
2. **Add database** - Only for YOUR app data (Neon, D1, PlanetScale)
3. **Implement features** - AI, analytics, APIs - whatever you're building
4. **Monitor costs** - Cloudflare dashboard shows usage vs free tier limits
5. **Optimize performance** - Cache aggressively, batch KV writes

---

## Common Questions

### Does this work with my frontend framework?

Yes! The backend is framework-agnostic. The frontend just needs to:
1. Use Clerk SDK for your framework
2. Send JWT in `Authorization: Bearer <token>` header

Works with Next.js, Vue, Svelte, React Native, or any framework that can make HTTP requests.

### Can I use a different payment provider?

Absolutely. Replace Stripe with Paddle, LemonSqueezy, PayPal, etc. Just update the webhook handler to sync `publicMetadata.plan` in Clerk. The JWT routing pattern stays the same.

### Do I need Cloudflare specifically?

The backend Worker can run on Vercel Edge Functions, Netlify Edge, or Deno Deploy with minimal changes. You could even convert it to a traditional Node.js server. But Cloudflare offers the best combination of performance, pricing, and DX.

### What if I need a database?

Add one! Cloudflare D1 (SQLite), Neon (Postgres), or PlanetScale (MySQL) all work great. Store YOUR app data there. The template handles auth/billing without a DB - that's the innovation.

### More questions?

Check the [FAQ](docs/faq.md) for troubleshooting, best practices, and detailed answers.

---

## Security

### Built-In Security Features

- ✅ JWT verification on every request
- ✅ Stripe webhook signature verification
- ✅ Idempotency keys for webhooks
- ✅ Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ Rate limiting (100 req/min per user)
- ✅ Dynamic CORS (no wildcards)
- ✅ User data isolation (userId-keyed storage)
- ✅ PCI compliance (Stripe-hosted checkout)

### Production Hardening Recommendations

- Enable Cloudflare Bot Fight Mode (free DDoS protection)
- Set up error tracking (Sentry or Cloudflare Logs)
- Monitor webhook failures (Stripe dashboard)
- Rotate API keys periodically
- Review Cloudflare Analytics for unusual patterns

**Details:** [FAQ - Security Best Practices](docs/faq.md#best-practices)

---

## Contributing

This is an open-source SaaS template. Contributions welcome!

**How to contribute:**
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features or improvements
- 🔀 Submit Pull Requests
- 📖 Improve documentation

**Areas that need help:**
- E2E testing with Playwright
- Additional payment provider integrations
- Multi-currency support
- Example app integrations

---

## License

MIT - Use this template for commercial or personal SaaS projects.

---

## Acknowledgments

**Built with:**
- [Claude Code](https://claude.com/claude-code) - AI pair programming
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge compute
- [Clerk](https://clerk.com/) - Authentication
- [Stripe](https://stripe.com/) - Payments

**Timeline**: Production-ready SaaS infrastructure in under a week.

---

**⭐ If this template saves you time, consider starring the repo!**

---

**Questions? Issues? Feedback?**
Open a GitHub issue or check the [FAQ](docs/faq.md).

**Ready to ship?**
[Get started with the Setup Guide →](docs/setup.md)
