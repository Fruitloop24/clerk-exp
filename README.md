# Production SaaS Starter - Cloudflare Edge Edition

<div align="center">

## 🚀 Ship your SaaS in days, not months

**Complete auth + billing + tier management on Cloudflare's edge**

Stateless JWT architecture • No database to maintain • Free hosting until 10,000+ users

**[📊 See cost breakdown →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/cost-breakdown.md)**

---

### 🌐 Live Demo
**https://clerk-frontend.pages.dev/**

### ⚡ Tech Stack
React 19 + Cloudflare Workers + Clerk + Stripe

</div>

---

## Why This Template?

Most SaaS templates are "hello world" demos. **This is production-ready infrastructure.**

## ✨ The Hard Parts, Already Built

<table>
<tr>
<td width="50%">

### 🎨 Complete Frontend Template
**Working React template included**: Pricing pages, protected routes, customer portal, dashboard, tier cards. All wired up and ready to use.

</td>
<td width="50%">

### 🤖 AI-Guided Tier Configuration
**Claude Code `/configure-tiers`**: Answer questions, automatically updates frontend routes, pricing cards, backend limits, Stripe integration. **[See command →](https://github.com/Fruitloop24/clerk-exp/blob/master/.claude/commands/configure-tiers.md)**

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Stateless JWT Authentication
User's plan lives in the token. **Zero database lookups** for authorization.

**[🔍 Architecture deep dive →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/architecture.md)**

</td>
<td width="50%">

### 💳 Subscription Billing
Stripe integration with webhooks, customer portal, and tier management.

**[💰 Cost breakdown →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/cost-breakdown.md)**

</td>
</tr>
<tr>
<td width="50%">

### 📊 Usage Limits & Tracking
Per-tier request limits with monthly resets. Built-in enforcement.

**[🏗️ Architecture guide →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/architecture.md)**

</td>
<td width="50%">

### 🌍 Global Edge Deployment
Runs in **300+ cities**. ~50ms response times worldwide. Zero cold starts.

**[📐 How it works →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/architecture.md)**

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Security Hardening
Rate limiting, webhook verification, CORS, security headers. **Built-in.**

**[🔒 Security guide →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/information/security.md)**

</td>
<td width="50%">

### 💵 $0 Hosting Costs
**Free until 10k+ users** on Cloudflare's free tier. Then ~$31/month.

**[📈 See cost breakdown →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/cost-breakdown.md)**

</td>
</tr>
</table>

### What Makes This Different

**1. JWT as Single Source of Truth**

Traditional SaaS: `Request → Verify auth → Query DB for plan → Check limits → Process`

This template: `Request → Verify JWT (plan included) → Check limits → Process`

**No database lookups.** The user's subscription tier is embedded in their JWT. When they upgrade, Stripe webhooks update Clerk metadata, and the next JWT automatically includes the new plan.

**📖 Deep dive:** [Architecture Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/architecture.md)

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

### 🎯 Perfect For

<table>
<tr>
<td width="50%">

**🚀 Indie Hackers**
Ship MVPs fast, validate ideas cheaply

</td>
<td width="50%">

**👨‍💻 Solo Developers**
Complete backend infrastructure, no team needed

</td>
</tr>
<tr>
<td width="50%">

**🏗️ SaaS Builders**
Focus on YOUR product, not auth/billing wiring

</td>
<td width="50%">

**⚡ Edge-First Teams**
Leverage Cloudflare's global network

</td>
</tr>
<tr>
<td colspan="2" align="center">

**💰 Cost-Conscious Founders**
$0/month until you're making money • **[See detailed costs →](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/cost-breakdown.md)**

</td>
</tr>
</table>

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

Before you begin, make sure you have:

- **Node.js 20+** installed
- **Wrangler CLI** - Cloudflare's deployment tool: `npm install -g wrangler`
- **Stripe CLI** - For webhook testing: [Install guide](https://stripe.com/docs/stripe-cli#install)
- **Accounts created** (all free to start):
  - Cloudflare account (free tier)
  - Clerk account (free up to 10k users)
  - Stripe account (test mode)

### 1. Clone & Install

```bash
git clone <your-repo>
cd clerk-exp

# Install backend dependencies
cd api && npm install

# Install frontend dependencies
cd ../frontend-v2 && npm install
```

### 2. Set Up Clerk Authentication

Clerk handles all user authentication and JWT tokens for this application.

**📖 Follow the detailed setup guide:** [Clerk Setup Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/platforms/clerk.md)

This guide will walk you through:
- Creating your Clerk application
- Setting up the JWT template (required for tier system)
- Getting your API keys

**✅ When complete, you should have:**

Copy the example files and fill in your Clerk keys:
```bash
# Backend
cp api/.dev.vars.example api/.dev.vars

# Frontend
cp frontend-v2/.env.example frontend-v2/.env
```

**📋 See complete examples:** [Backend .dev.vars](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/backend-dev-vars-example.md) | [Frontend .env](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/frontend-env-example.md)

Your `api/.dev.vars` should look like this:
```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_abc123...      # From Clerk Dashboard
CLERK_PUBLISHABLE_KEY=pk_test_xyz789... # From Clerk Dashboard
CLERK_JWT_TEMPLATE=pan-api              # Exact value (must match template name)

```

Your `frontend-v2/.env` should look like this:
```bash
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xyz789... # Same as above
VITE_API_URL=http://localhost:8787           # Local backend URL
```

### 3. Set Up Stripe Payments

Stripe handles all payment processing and subscription billing for this application.

**📖 Follow the detailed setup guide:** [Stripe Setup Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/platforms/stripe.md)

This guide will walk you through:
- Getting your Stripe API keys
- Creating products for each paid tier (Pro, Enterprise, etc.)
- Setting up the Customer Portal for subscription management
- Getting your Price IDs and Portal Configuration ID

**📋 See complete backend config:** [Backend .dev.vars Example](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/backend-dev-vars-example.md)

**✅ When complete, you should have:**

Your `api/.dev.vars` should now look like this:
```bash
# Clerk Configuration (from Step 2)
CLERK_SECRET_KEY=sk_test_abc123...
CLERK_PUBLISHABLE_KEY=pk_test_xyz789...
CLERK_JWT_TEMPLATE=pan-api

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_def456...           # From Stripe Dashboard
STRIPE_PRICE_ID_PRO=price_1Abc23DEfg45HIjk    # Pro tier product price ID

# Add a STRIPE_PRICE_ID for each paid tier you created in Stripe
# The variable name should match whatever you named your tiers/products
STRIPE_PRICE_ID_ENTERPRISE=price_1Xyz98WVut76 # Enterprise tier product price ID (if applicable)

STRIPE_PORTAL_CONFIG_ID=bpc_1SK6M             # For customer subscription management
```

### 4. Configure Your Pricing Tiers (Optional)

The default template provides a complete multi-tier system (Free, Pro, Enterprise) with frontend routes, pricing cards, and backend enforcement. You can easily customize this using natural language with any AI CLI.

**🤖 Use the `/configure-tiers` Command (Recommended - works best with Claude Code)**

```
/configure-tiers
```

Works with Claude Code, Gemini CLI, Codex CLI, or DeepSeek. Or manually call `.claude/commands/configure-tiers.md` with your AI tool.

Answer questions about your tiers (name, price, limit, features), and it updates:
- ✅ Backend tier limits and Stripe integration
- ✅ Frontend pricing cards and routes
- ✅ Dashboard tier displays
- ✅ Environment variables

Modify everything in natural language to fit your product.

**📝 Manual Configuration**

Prefer manual control? Follow the [Manual Tier Setup Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/manual-tier-setup.md) for step-by-step instructions on updating each file.

---

### 5. Run Locally (3 Terminals)

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

## Deploy to Production

Once local development is working, you're ready to deploy your SaaS to production.

### 6. Deploy Backend API (Cloudflare Workers)

Your backend API will run on Cloudflare's global edge network (300+ cities worldwide) with ~50ms response times.

**📖 Follow the detailed deployment guide:** [Cloudflare Workers Deployment](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/platforms/cf.md)

This guide will walk you through:
- Authenticating with Cloudflare
- Creating a KV namespace for usage tracking
- Setting production secrets (live Clerk & Stripe keys)
- Deploying your worker to the edge
- Verifying your deployment

**✅ When complete, you'll have:**
- Your API live at: `https://your-worker.workers.dev`
- All secrets configured securely
- KV namespace created and bound
- Real-time logs available via `wrangler tail`

---

### 7. Configure Production Webhooks

In local development, you used `stripe listen --forward-to` to simulate webhooks. Now you'll set up real production webhooks so Stripe can notify your API when subscriptions are created, updated, or cancelled.

**📖 Follow the detailed deployment guide:** [Stripe Webhooks Deployment](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/deployments/stripe-deploy.md)

This guide will walk you through:
- Migrating your Stripe products from test mode to live mode
- Updating environment variables with live Stripe keys and Price IDs
- Creating a production webhook endpoint in Stripe
- Adding the webhook signing secret to your worker
- Testing webhook delivery and the full upgrade flow

**✅ When complete, you'll have:**
- All products recreated in Stripe live mode with correct metadata
- Live Stripe keys and Price IDs configured in your worker
- Production webhook endpoint pointing to your API
- Real-time subscription updates working (upgrade/downgrade/cancel)

---

### 8. Deploy Frontend

Deploy your React frontend to Cloudflare Pages so users can access your SaaS from anywhere in the world with fast load times.

**📖 Follow the detailed deployment guide:** [Cloudflare Pages Frontend Deployment](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/deployments/frontend-deploy.md)

This guide will walk you through:
- Pushing your code to GitHub and connecting your repository
- Creating a Cloudflare Pages project (watch for the Workers vs Pages tabs!)
- Configuring build settings for Vite
- Adding production environment variables (live Clerk keys and API URL)
- Deploying and verifying your live frontend
- Testing the full end-to-end flow (sign up, upgrade, billing portal)

**✅ When complete, you'll have:**
- Your frontend live at: `https://your-project.pages.dev`
- Connected to your production backend API
- Automatic deployments on every git push
- Full authentication and subscription flows working

---

## Architecture

Want to understand how the stateless JWT architecture works? How Stripe webhooks sync with Clerk? How usage tracking works without a database?

**📖 Read the complete architecture guide:** [Architecture Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/architecture.md)

This guide covers:
- JWT as single source of truth (how plan metadata flows)
- Complete data flow diagrams (sign-up → upgrade → tier enforcement)
- Webhook integration architecture (Stripe → Clerk sync)
- Usage tracking with Cloudflare KV
- Why this approach scales without a database

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

**$0/month until 10,000+ users. Then ~$31/month. At 100k users: ~$109/month.**

Compare that to typical SaaS stacks costing $75-150/month from day one.

**📖 See the complete cost analysis:** [Cost Breakdown & Comparison](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/cost-breakdown.md)

This guide includes:
- Detailed cost breakdown at every scale (0-100k+ users)
- What triggers each cost increase (so you can forecast)
- Comparisons to other stacks (Vercel, AWS, Firebase, other SaaS templates)
- Cost optimization strategies (batch operations, caching, aggregation)
- Real-world cost projections with revenue scenarios
- Hidden costs you avoid (database maintenance, CDN, SSL, monitoring)

**TL;DR:** Infrastructure costs ~3% of revenue instead of 15%. More money for building your product.

---

## File Structure

**Backend:** `api/` - Cloudflare Worker with JWT auth + Stripe webhooks (~1,020 lines)
**Frontend:** `frontend-v2/` - React + Vite SPA (~1,500 lines)
**Docs:** `docs/` - Complete setup and deployment guides

**📖 See the complete project structure:** [Project File Structure](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/project-file-structure.md)

This guide includes:
- Full directory tree with explanations
- Key files and what they do
- Environment variables reference
- Build artifacts and gitignored files
- Common file operations (adding pages, endpoints, tiers)

---

## FAQ

Got questions about the template? How to customize it? What works with what?

**📖 Read the complete FAQ:** [Frequently Asked Questions](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/information/faq.md)

Common topics covered:
- Framework compatibility (Next.js, Vue, Svelte, React Native)
- Alternative payment providers (Paddle, LemonSqueezy, PayPal)
- Platform alternatives (Vercel Edge, Netlify, Deno Deploy)
- Adding a database (when and how)
- Troubleshooting common issues
- Security best practices
- Performance optimization

---

## Security

**Small attack surface. No servers to hack. Enterprise-grade security included for free.**

Built-in: JWT verification, webhook signing, rate limiting, security headers, PCI compliance.
Cloudflare: DDoS protection, WAF, Bot Fight Mode, IP restrictions, Access policies - all free.

**📖 Read the complete security guide:** [Security Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/information/security.md)

This guide covers:
- Why edge deployment means fewer vulnerabilities (no servers to SSH into!)
- All 8 built-in security features explained (with code locations)
- **Cloudflare's 11 free security features** (DDoS, WAF, Bot Fight, Rate Limiting, Access, and more)
- Security best practices and monitoring
- Incident response procedures
- Compliance (SOC 2, ISO 27001, PCI DSS, GDPR)

---

## Work Together

### 🚀 Need Help?

Stuck on setup? Want custom features? Need it deployed ASAP?

**I offer paid consulting and setup services:**
- Complete deployment and configuration
- Custom tier structures and integrations
- Additional payment providers or databases
- Architecture consulting and optimization

**Contact:** [kc@panacea-tech.net](mailto:kc@panacea-tech.net)

### ⭐ Show Support

- **Star this repo** - Helps others discover it
- **Fork and build** - Make something awesome
- **Share it** - Help other builders find this

### 💬 Get Involved

- **Questions?** Open a GitHub issue or email me
- **Bug?** Submit an issue with details
- **Built something cool?** Share it!
- **Want to contribute?** PRs welcome

### 🤝 Open to Opportunities

Interested in partnerships, revenue shares, or white-label licensing?

**Let's talk:** [kc@panacea-tech.net](mailto:kc@panacea-tech.net)

---

## Known Limitations

This template is optimized for speed and simplicity. We've identified some trade-offs:

**📖 Read the full analysis:** [Known Limitations & Trade-Offs](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/information/limitations.md)

- KV eventual consistency (pay-per-use apps)
- Multi-dashboard observability
- No built-in CRM or customer success tools
- Single-region KV writes
- No testing suite

**Found something we missed?** [Let us know](mailto:kc@panacea-tech.net) - we're always improving this template.

---

## License

MIT - Use this template for commercial or personal SaaS projects.

---

## Acknowledgments

**Built with:**
- [Claude Code](https://claude.com/claude-code) - AI pair programming
- [Gemini CLI](https://ai.google.dev/) - AI assistance
- [Codex CLI](https://openai.com/codex) - AI code generation
- [DeepSeek](https://www.deepseek.com/) - AI development
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge compute
- [Clerk](https://clerk.com/) - Authentication
- [Stripe](https://stripe.com/) - Payments

**Contributors:**
- Claude Code
- Gemini CLI
- Codex CLI
- DeepSeek

---

## Documentation

- **[Architecture Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/architecture.md)** - How JWT routing works, data flow diagrams
- **[Cost Breakdown](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/features/cost-breakdown.md)** - Detailed cost analysis at every scale
- **[Security Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/information/security.md)** - Built-in security + Cloudflare's free features
- **[Testing Guide](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/testing.md)** - End-to-end testing checklist, 3-terminal setup
- **[FAQ](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/information/faq.md)** - Common issues, troubleshooting, best practices

**Platform Setup Guides:**
- **[Clerk Setup](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/platforms/clerk.md)** - Authentication configuration
- **[Stripe Setup](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/platforms/stripe.md)** - Payment processing configuration
- **[Cloudflare Workers Deployment](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/platforms/cf.md)** - Backend deployment

**Deployment Guides:**
- **[Stripe Webhooks](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/deployments/stripe-deploy.md)** - Production webhook configuration
- **[Frontend Deployment](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/deployments/frontend-deploy.md)** - Cloudflare Pages deployment

**Reference:**
- **[Manual Tier Setup](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/manual-tier-setup.md)** - Add/modify pricing tiers manually
- **[Project File Structure](https://github.com/Fruitloop24/clerk-exp/blob/master/docs/sample-files/project-file-structure.md)** - Complete file organization

---

**⭐ If this template saves you time, consider starring the repo!**
