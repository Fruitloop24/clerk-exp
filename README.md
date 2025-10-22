# Production SaaS Starter - Cloudflare Edge Edition

> **A complete, production-ready SaaS template** built entirely on Cloudflare's edge platform. Stateless JWT authentication, no database to maintain, lightning-fast global deployment, and free hosting until 10,000+ users.

**Live Demo**: https://clerk-frontend.pages.dev (CloudDocs Pro - AI Document Processing Demo)
**API**: https://pan-api.k-c-sheffield012376.workers.dev
**Stack**: Vite + React 19 + Cloudflare Workers + Clerk + Stripe

---

## Why This Stack?

Most SaaS tutorials stop at "hello world." This template goes all the way to production with battle-tested patterns that scale.

### Core Architecture Advantages

✅ **Stateless JWT Auth** - No sessions, no cookies, fully stateless authentication via Clerk
✅ **Cloudflare Edge** - Deploy globally in 300+ cities, zero cold starts, infinite scale
✅ **No Database to Maintain** - Clerk stores identity, Stripe handles billing, KV for counters
✅ **Free Hosting Until 10k+ Users** - Start with $0/month hosting costs (see [Cost Analysis](#cost-analysis))
✅ **Production-Ready Patterns** - Rate limiting, webhook idempotency, security headers, CORS hardening

### What's Included (Production Features)

**Authentication & Authorization**
- ✅ Complete sign-up/sign-in flows with email verification
- ✅ JWT token verification on every API request
- ✅ User plan metadata in JWT claims (no extra DB lookups)
- ✅ Works perfectly on static hosting (no server sessions)

**Subscription Billing**
- ✅ Stripe Checkout integration for payment processing
- ✅ Free tier (5 requests/month) with automatic reset
- ✅ Pro tier (unlimited usage, $29/month)
- ✅ Stripe Customer Portal (update payment methods, view invoices, cancel subscriptions)
- ✅ Webhook integration with signature verification
- ✅ Automatic plan upgrades via metadata sync

**Security & Reliability**
- ✅ Rate limiting (100 requests/minute per user)
- ✅ Webhook idempotency (prevents duplicate processing)
- ✅ Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ Dynamic CORS (no wildcard, validated origins)
- ✅ User data isolation (all data keyed by userId)
- ✅ PCI compliance via Stripe-hosted checkout and portal

**Performance & Scalability**
- ✅ Global edge deployment (300+ cities)
- ✅ Zero cold starts (always-on Workers)
- ✅ Instant HMR in development (Vite)
- ✅ Optimized production builds
- ✅ CDN-first static frontend (Cloudflare Pages)

**Developer Experience**
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Heavily documented code (~2,500 lines TypeScript)
- ✅ Environment variable validation
- ✅ Local development with hot reload
- ✅ TypeScript throughout

---

## Architecture Overview

### Data Flow: JWT-Based Stateless Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER AUTHENTICATES                          │
│                     (Clerk Sign-In Flow)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│                   CLERK ISSUES JWT TOKEN                         │
│                                                                   │
│  Token Payload:                                                  │
│  {                                                                │
│    "userId": "user_abc123",                                      │
│    "plan": "free"  ← from user.public_metadata                  │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND STORES TOKEN IN MEMORY                     │
│              (ClerkProvider auto-manages)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│           USER MAKES API REQUEST WITH JWT                        │
│                                                                   │
│  GET /api/data                                                    │
│  Authorization: Bearer <jwt_token>                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│        CLOUDFLARE WORKER VERIFIES JWT & EXTRACTS CLAIMS         │
│                                                                   │
│  const { userId, plan } = verifyToken(token)                     │
│  const limit = TIER_LIMITS[plan]  // "free" → 5, "pro" → ∞     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│           WORKER CHECKS USAGE IN CLOUDFLARE KV                  │
│                                                                   │
│  const usage = await KV.get(`usage:${userId}`)                  │
│  if (usage.count >= limit) return 429 Rate Limited              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│              PROCESS REQUEST & INCREMENT COUNTER                 │
│                                                                   │
│  await KV.put(`usage:${userId}`, count + 1)                     │
│  return 200 Success                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           WHEN USER UPGRADES (STRIPE WEBHOOK)                    │
│                                                                   │
│  1. User completes Stripe checkout                               │
│  2. Stripe sends webhook → Worker verifies signature             │
│  3. Worker updates Clerk metadata: { plan: "pro" }              │
│  4. Next JWT refresh includes plan: "pro"                        │
│  5. Unlimited usage automatically enabled                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: The user's plan is stored in Clerk metadata and included in every JWT. This means zero database lookups for authorization checks. The Worker reads the plan from the token and enforces limits instantly.

---

## 🤖 AI-Powered Installer (Optional Accelerator)

Want to skip manual configuration? We've built an **AI orchestrator** with specialized agents to guide you through setup.

**What it automates:**
- ✅ Environment configuration (local + production)
- ✅ Clerk API key retrieval and JWT template setup
- ✅ Stripe product/price creation via CLI
- ✅ Webhook endpoint configuration
- ✅ GitHub Actions workflow generation
- ✅ Security audit and validation

**What still requires manual steps:**
- ⚠️ Creating Clerk and Stripe accounts
- ⚠️ Cloudflare Pages dashboard configuration
- ⚠️ Approving each automation step (human-in-the-loop)

**[→ Read the AI Installer Guide](mcp-agents/README.md)**

### Quick Start with AI Installer

```bash
# 1. Clone and navigate to installer
cd mcp-agents

# 2. Launch with Claude Code
claude code orchestration/coordinator.json

# 3. Tell Claude
"Run the orchestrator to perform full project setup"

# 4. Follow AI prompts and approve each step
# The orchestrator will invoke 6 specialized agents in sequence:
#   - onboarding-agent (env setup)
#   - clerk-agent (auth config)
#   - tiers-agent (Stripe setup)
#   - frontend-agent (UI components)
#   - deployment-agent (CI/CD)
#   - security-agent (audit)
```

**Estimated time**: ~30-45 minutes with AI guidance (vs 2-3 hours manually)

---

## Manual Setup (Complete Instructions)

Prefer full control? Follow these step-by-step instructions.

### Prerequisites

- Node.js 20+
- Cloudflare account (free tier works)
- Clerk account (free up to 10k users)
- Stripe account (test mode)

### 1. Clone & Install

```bash
git clone <your-repo>
cd clerk

# Install backend dependencies
cd api && npm install

# Install frontend dependencies
cd ../frontend-v2 && npm install
```

### 2. Configure Clerk

1. Create a Clerk application at https://clerk.com
2. Create a JWT template named `pan-api` with claims:
   ```json
   {
     "plan": "{{user.public_metadata.plan}}"
   }
   ```
3. Copy your publishable and secret keys

### 3. Configure Stripe

1. Create a Stripe account at https://stripe.com
2. Create a product with two prices:
   - Free: $0/month (for reference)
   - Pro: $29/month (or your price)
3. Copy the Pro price ID (starts with `price_`)
4. Set up Stripe Customer Portal at https://dashboard.stripe.com/settings/billing/portal
5. Copy the portal configuration ID (starts with `bpc_`)
6. Set up webhook endpoint (see [Stripe Webhook Setup](#stripe-webhook-setup))

### 4. Set Environment Variables

**Backend** (`api/.dev.vars`):
```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_TEMPLATE=pan-api
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
STRIPE_PORTAL_CONFIG_ID=bpc_...
```

**Frontend** (`frontend-v2/.env`):
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8787
```

### 5. Run Locally

```bash
# Terminal 1: Start backend
cd api
npm run dev  # http://localhost:8787

# Terminal 2: Start frontend
cd frontend-v2
npm run dev  # http://localhost:5173
```

### 6. Deploy

**Backend** (Cloudflare Workers):
```bash
cd api
npm run deploy
```

**Frontend** (Cloudflare Pages):
1. Push to GitHub
2. Connect repo to Cloudflare Pages
3. Configure build:
   - **Root directory**: `frontend-v2`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add environment variables in CF dashboard
5. Deploy!

---

## Stripe Webhook Setup

### Step 1: Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your worker URL + `/webhook/stripe`:
   ```
   https://YOUR-WORKER.workers.dev/webhook/stripe
   ```
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)

### Step 2: Set Webhook Secret

```bash
cd api
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the whsec_... value when prompted
```

### Step 3: Set Portal Configuration ID

```bash
wrangler secret put STRIPE_PORTAL_CONFIG_ID
# Paste the bpc_... value when prompted
```

### Step 4: Test End-to-End

1. Sign up as a new user
2. Use 5 free requests
3. Click "Upgrade to Pro"
4. Complete checkout (test card: `4242 4242 4242 4242`)
5. Verify dashboard shows "Unlimited • Pro Plan Active"
6. Test unlimited usage
7. Click "Manage Billing" and verify portal opens
8. Test cancellation (webhook updates plan back to free)

---

## File Structure

```
clerk/
├── api/                        # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts           # Main API (~830 lines, heavily documented)
│   │   └── stripe-webhook.ts  # Stripe webhook handler (~190 lines)
│   ├── wrangler.toml          # Worker configuration
│   ├── .dev.vars              # Local secrets (gitignored)
│   └── package.json
│
├── frontend-v2/                # Vite + React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx    # Landing page with pricing
│   │   │   ├── Dashboard.tsx  # Protected dashboard
│   │   │   ├── SignInPage.tsx # Sign-in flow
│   │   │   └── SignUpPage.tsx # Sign-up flow
│   │   ├── App.tsx            # React Router + protected routes
│   │   ├── main.tsx           # Entry point + ClerkProvider
│   │   └── index.css          # Tailwind directives
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind v3 configuration
│   └── package.json
│
├── mcp-agents/                 # AI-powered installer
│   ├── orchestration/
│   │   └── coordinator.json   # Master orchestrator
│   ├── agents/                # Individual agent configs
│   │   ├── onboarding-agent.json
│   │   ├── clerk-agent.json
│   │   ├── tiers-agent.json
│   │   ├── frontend-agent.json
│   │   ├── deployment-agent.json
│   │   ├── security-agent.json
│   │   ├── testing-agent.json
│   │   └── cf-specialist.json
│   ├── base/                  # Knowledge bases
│   │   ├── project-config.json
│   │   ├── clerk-knowledge.json
│   │   ├── tiers-knowledge.json
│   │   ├── frontend-knowledge.json
│   │   ├── deployment-knowledge.json
│   │   ├── security-knowledge.json
│   │   ├── cloudflare-workers.txt
│   │   └── vite-react-tailwind.txt
│   └── README.md              # AI installer guide
│
├── .github/workflows/
│   └── deploy-worker.yml      # CI/CD for Worker deployment
│
└── README.md                  # This file
```

**Total Code**: ~2,500 lines TypeScript (1,020 backend, ~1,500 frontend)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vite + React 19 | Pure client-side SPA |
| **Hosting (Frontend)** | Cloudflare Pages | Static hosting + global CDN |
| **Auth** | Clerk | User management + JWT |
| **Payments** | Stripe | Subscription billing + webhooks + portal |
| **API** | Cloudflare Workers | Serverless edge functions |
| **Storage** | Cloudflare KV | Usage counters + idempotency |
| **CSS** | Tailwind CSS v3 | Utility-first styling |
| **Testing** | Vitest + Miniflare | Unit + integration tests |
| **CI/CD** | GitHub Actions | Automated deployment |

---

## Cost Analysis

### Development (Free Tier)

| Service | Cost | Notes |
|---------|------|-------|
| Cloudflare Pages | **$0** | Unlimited static sites |
| Cloudflare Workers | **$0** | 100k requests/day free |
| Cloudflare KV | **$0** | 100k reads/day free |
| Clerk | **$0** | Free up to 10k MAU |
| Stripe | **$0** | Pay per transaction (2.9% + 30¢) |
| **Total** | **$0/month** | Perfect for MVPs |

### Production (10k Active Users)

| Service | Cost | Notes |
|---------|------|-------|
| Cloudflare Pages | **$0** | Still free! |
| Cloudflare Workers | **$5/mo** | Paid plan (10M req included) |
| Cloudflare KV | **$0.50/mo** | Estimated for 10k users |
| Clerk | **$25/mo** | 10k-50k MAU tier |
| Stripe | **2.9% + $0.30** | Per transaction |
| **Total** | **~$30/month** | + transaction fees |

**Scalability**: Can handle 10M requests/month for $5 on Workers. Pages scales infinitely. No database costs ever.

---

## Security Features

### Implemented ✅

- **JWT verification** on every API request
- **Stripe webhook signature verification** (prevents spoofing)
- **Idempotency protection** (prevents duplicate webhook processing)
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting** (100 req/min per user)
- **User data isolation** (all data keyed by userId)
- **Dynamic CORS** (no wildcard, validated origins)
- **Environment variable validation** (fails fast on misconfiguration)
- **PCI compliance** via Stripe-hosted checkout and portal

### Production Hardening TODO

- [ ] Error tracking (Sentry or Cloudflare Logs)
- [ ] Request logging (Axiom/Logflare)
- [ ] Audit logs for plan changes
- [ ] CAPTCHA for sign-up (bot prevention)
- [ ] Content moderation (if applicable)

---

## Testing Checklist

### Manual Testing Flow (End-to-End)

1. ✅ **Sign Up**: New user registration with email verification
2. ✅ **Dashboard**: Check usage shows "0 / 5" for free tier
3. ✅ **Make Requests**: Process 5 documents, verify counter increments
4. ✅ **Hit Limit**: 6th request shows "Free tier limit reached"
5. ✅ **Upgrade Flow**: Click "Upgrade to Pro" → Complete Stripe checkout
6. ✅ **Webhook Processing**: Verify plan updates (check Clerk metadata)
7. ✅ **Pro Tier**: Dashboard shows "Unlimited • Pro Plan Active"
8. ✅ **Unlimited Usage**: Process 20+ requests successfully
9. ✅ **Billing Portal**: Click "Manage Billing" → Portal opens successfully
10. ✅ **Cancellation**: Test subscription cancellation via portal
11. ✅ **Sign Out**: Verify redirect to landing page

### What to Test in Production

- Rate limiting (100 req/min)
- Webhook idempotency (use Stripe CLI to replay events)
- Security headers (use https://securityheaders.com)
- CORS (test from different origins)
- Error handling (kill Clerk API temporarily)
- Billing portal (update payment method, view invoices)

---

## Deployment & CI/CD

### GitHub Actions Workflow

**Triggers**:
- Push to `master` (if `api/**` changed)
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Install Wrangler v4
5. Deploy to Cloudflare Workers
6. Deploy includes minification

**Configuration**: `.github/workflows/deploy-worker.yml`

### Frontend Deployment

**Automatic via Cloudflare Pages**:
- Triggers on every push to main
- Preview URLs for every PR
- Configured in CF dashboard

---

## Next Steps / Roadmap

### Completed ✅

1. ~~**GitHub Actions debugging**~~ - Worker deployment via GitHub Actions complete
2. ~~**Billing portal**~~ - Stripe customer portal for subscription management complete

### High Priority

3. **SEO optimization** - Meta tags, robots.txt, sitemap for discoverability
4. **Custom domain** - Point custom domain to CF Pages
5. **Production keys** - Prod keys obtained after verification (holding off on switching for now)

### Medium Priority

6. **Load testing** - Test rate limits, concurrent users, edge cases
7. **Monitoring** - Using Clerk and Stripe dashboards for now
8. **E2E tests** - Playwright tests for complete user flows

### Low Priority

9. **Code organization** - Extract tier config to separate module
10. **TypeScript strictness** - Enable stricter type checking
11. **Caching strategy** - Use CF Cache API for static responses
12. **Analytics dashboard** - Show usage trends over time

---

## Demo Site

The live demo at https://clerk-frontend.pages.dev showcases this template as **CloudDocs Pro** - a fictional AI document processing service. The demo illustrates how the template can be branded and customized for a real SaaS product while demonstrating all core features:

- User authentication and registration
- Free tier with usage limits
- Subscription upgrade flow
- Usage tracking and display
- Billing portal integration
- Professional landing page and dashboard

---

## Contributing

This is an open-source SaaS starter template. Contributions welcome!

**How to contribute**:
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features or improvements
- 🔀 Submit Pull Requests with enhancements
- 📖 Improve documentation

**Areas that need help**:
- E2E testing setup (Playwright)
- Additional payment providers
- Multi-currency support
- Example feature implementations

---

## License

MIT - Use this template for your SaaS, commercial or personal projects.

---

## Questions & Support

**Common Issues**:
- **Deployment fails**: Check GitHub Actions logs or CF Workers dashboard
- **Auth not working**: Verify Clerk JWT template includes `plan` claim
- **Usage not tracking**: Check KV namespace binding in `wrangler.toml`
- **Webhook fails**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- **Portal not opening**: Verify `STRIPE_PORTAL_CONFIG_ID` is set and portal is enabled in Stripe dashboard

**Need help?** Open an issue on GitHub or check the inline code documentation (heavily commented).

---

## Acknowledgments

**Built with**:
- [Claude Code](https://claude.com/claude-code) - AI pair programming
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge compute platform
- [Clerk](https://clerk.com/) - Authentication
- [Stripe](https://stripe.com/) - Payments

**Timeline**: Production-ready SaaS on Cloudflare in under a week.

---

**⭐ If this template helped you, consider starring the repo!**

---

## Technical Notes

### Tailwind CSS Version Fix (Oct 2025)

**Issue**: Tailwind v4 has breaking PostCSS changes causing incomplete CSS builds (4-7KB instead of 25-30KB).

**Solution**: Use Tailwind CSS v3 with standard PostCSS config.

```bash
# Correct installation
npm install -D tailwindcss@3 postcss autoprefixer
```

**postcss.config.js** - use standard plugin:
```js
export default {
  plugins: {
    tailwindcss: {},      // ✅ Correct (v3)
    autoprefixer: {},
  },
}
```

**DO NOT use**: `@tailwindcss/postcss` (v4 package) - causes missing utility classes.

**Verification**: After build, check that `dist/assets/*.css` is ~29KB and includes classes like `bg-white`, `from-blue-600`.
