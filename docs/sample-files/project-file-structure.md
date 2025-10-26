# Project File Structure

This document shows the complete file structure of the template after setup.

---

## Overview

```
clerk-exp/
├── api/                    # Backend (Cloudflare Worker)
├── frontend-v2/            # Frontend (React + Vite)
├── docs/                   # Documentation
├── .claude/                # Claude Code configuration
├── .github/                # GitHub Actions CI/CD
└── README.md               # Main documentation
```

---

## Backend (`api/`)

```
api/
├── src/
│   ├── index.ts           # Main Worker (JWT auth, tier enforcement, routing)
│   └── stripe-webhook.ts  # Webhook handler (subscription lifecycle events)
├── .dev.vars              # Local environment variables (gitignored)
├── package.json           # Dependencies (Clerk, Stripe SDKs)
├── tsconfig.json          # TypeScript configuration
└── wrangler.toml          # Cloudflare Worker configuration + KV bindings
```

**Key files:**

- **`src/index.ts`** (~830 lines): Main API logic
  - JWT verification with Clerk
  - Tier enforcement (Free, Pro, Enterprise)
  - Usage tracking with KV
  - Rate limiting
  - CORS handling
  - Stripe Checkout creation
  - Customer Portal session creation

- **`src/stripe-webhook.ts`** (~190 lines): Webhook handler
  - Processes subscription events from Stripe
  - Updates Clerk user metadata when tier changes
  - Handles: `checkout.session.completed`, `customer.subscription.*`

- **`wrangler.toml`**: Worker configuration
  - Worker name and routes
  - KV namespace bindings
  - Compatibility date

- **`.dev.vars`**: Local development secrets
  - Clerk keys (test mode)
  - Stripe keys (test mode)
  - Price IDs and portal config

---

## Frontend (`frontend-v2/`)

```
frontend-v2/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx           # Landing page + pricing cards
│   │   ├── Dashboard.tsx         # Protected dashboard (usage + tier display)
│   │   ├── ChoosePlanPage.tsx    # Upgrade/tier selection page
│   │   ├── CheckoutPage.tsx      # Stripe Checkout redirect handler
│   │   ├── SignUpPage.tsx        # Clerk sign-up
│   │   └── SignInPage.tsx        # Clerk sign-in
│   ├── components/               # Reusable components
│   ├── App.tsx                   # Router + protected routes
│   ├── main.tsx                  # Entry point + ClerkProvider
│   └── index.css                 # Global styles (Tailwind)
├── .env                          # Environment variables (gitignored)
├── index.html                    # HTML entry point
├── package.json                  # Dependencies (React, Clerk, Vite)
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite build configuration
```

**Key files:**

- **`pages/Landing.tsx`**: Marketing page
  - Hero section
  - Pricing cards for all tiers
  - Feature lists
  - Tier-specific styling

- **`pages/Dashboard.tsx`**: Protected dashboard
  - Shows current tier
  - Displays usage count and limit
  - "Upgrade Plan" button
  - "Manage Billing" button (Customer Portal link)

- **`pages/ChoosePlanPage.tsx`**: Tier selection
  - Displays all available tiers
  - "Select Plan" buttons trigger Stripe Checkout
  - Tier comparison

- **`App.tsx`**: Routing logic
  - Public routes: `/`, `/sign-in`, `/sign-up`
  - Protected routes: `/dashboard`, `/choose-plan`
  - Clerk authentication guards

- **`.env`**: Frontend environment variables
  - `VITE_CLERK_PUBLISHABLE_KEY`: Clerk public key
  - `VITE_API_URL`: Backend Worker URL

---

## Documentation (`docs/`)

```
docs/
├── platforms/                       # Platform setup guides
│   ├── clerk.md                     # Clerk authentication setup
│   ├── stripe.md                    # Stripe payment setup
│   ├── cf.md                        # Cloudflare Workers deployment
│   └── react.md                     # (placeholder for React guide)
├── deployments/                     # Deployment guides
│   ├── stripe-deploy.md             # Production webhook configuration
│   └── frontend-deploy.md           # Cloudflare Pages deployment
├── features/                        # Feature explanations
│   ├── architecture.md              # JWT routing, data flow diagrams
│   ├── cost-breakdown.md            # Detailed cost analysis
│   └── deployment.md                # General deployment overview
├── sample-files/                    # Reference files
│   ├── manual-tier-setup.md         # Manual tier configuration guide
│   └── project-file-structure.md    # This file
├── faq.md                           # Frequently asked questions
└── testing.md                       # Testing guide (3-terminal setup)
```

**Purpose:**

- **`platforms/`**: Step-by-step setup guides for each service (Clerk, Stripe, Cloudflare)
- **`deployments/`**: Production deployment guides (webhooks, frontend)
- **`features/`**: Deep dives into how features work (architecture, costs)
- **`sample-files/`**: Reference documentation and examples

---

## Configuration Files

### Root Level

```
clerk-exp/
├── .gitignore                 # Ignores node_modules, .env, .dev.vars, etc.
├── README.md                  # Main project documentation
└── claude.md                  # Claude Code notes
```

### Claude Code Configuration

```
.claude/
└── commands/
    └── configure-tiers.md     # /configure-tiers slash command definition
```

**Purpose:** Custom slash commands for AI-assisted tier configuration.

### GitHub Actions CI/CD

```
.github/
└── workflows/
    └── deploy-worker.yml      # Auto-deploy Worker on push to main
```

**Purpose:** Automatically deploys backend Worker when code is pushed to GitHub.

---

## Environment Variables Reference

### Backend (`.dev.vars`)

```bash
# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_TEMPLATE=pan-api

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
STRIPE_PORTAL_CONFIG_ID=bpc_...

# Optional
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`.env`)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8787
```

---

## Build Artifacts (Gitignored)

### Backend

```
api/
├── .wrangler/               # Wrangler build cache
└── dist/                    # Compiled Worker output
```

### Frontend

```
frontend-v2/
├── dist/                    # Production build output
│   ├── assets/              # JS, CSS bundles
│   └── index.html           # Built HTML
└── node_modules/            # Dependencies
```

**These are auto-generated and excluded from Git.**

---

## Code Statistics

| Component | Lines of Code | Files | Language |
|-----------|---------------|-------|----------|
| **Backend API** | ~1,020 lines | 2 files | TypeScript |
| **Frontend** | ~1,500 lines | 6 pages + App | TypeScript + React |
| **Documentation** | ~8,000 lines | 13 files | Markdown |
| **Total** | **~10,520 lines** | **21 files** | Mixed |

---

## Key Directories Explained

### Why `frontend-v2/`?

Historical naming - This is the current production frontend. (v1 was an earlier iteration, now removed.)

You can rename this to `frontend/` if desired - just update:
- Cloudflare Pages root directory setting
- Any references in documentation

### Why separate `platforms/` and `deployments/`?

**`platforms/`**: Setup guides for external services (Clerk, Stripe, Cloudflare)
**`deployments/`**: Deployment procedures (production webhooks, frontend hosting)

This separation makes it easier to find setup guides vs deployment guides.

### Why `sample-files/`?

Reference documentation and examples that don't fit into platforms/deployments/features categories.

Examples:
- Manual tier configuration
- Project file structure (this file)
- Example environment variable files (future)

---

## Files NOT in Git

These files are gitignored for security and portability:

```
# Backend
api/.dev.vars                # Local development secrets
api/.wrangler/               # Build cache

# Frontend
frontend-v2/.env             # Local environment variables
frontend-v2/dist/            # Build output

# General
node_modules/                # Dependencies
.DS_Store                    # macOS files
*.log                        # Log files
```

**Why:** API keys and secrets should never be committed to Git.

---

## Common File Operations

### Adding a New Page

1. Create `frontend-v2/src/pages/NewPage.tsx`
2. Add route in `frontend-v2/src/App.tsx`
3. Optionally add to navigation

### Adding a New API Endpoint

1. Add route handler in `api/src/index.ts`
2. Place after authentication check
3. Before the 404 handler

### Adding a New Tier

**Option 1:** Use `/configure-tiers` command (recommended)
**Option 2:** Follow [Manual Tier Setup Guide](manual-tier-setup.md)

### Adding Documentation

1. Determine category: `platforms/`, `deployments/`, `features/`, or `sample-files/`
2. Create `.md` file in appropriate directory
3. Link from README.md if user-facing

---

## Related Documentation

- **[Architecture Guide](../features/architecture.md)** - Understand how the pieces fit together
- **[Manual Tier Setup](manual-tier-setup.md)** - Detailed guide for customizing tiers
- **[FAQ](../faq.md)** - Common questions about the project structure

---

**Questions about the file structure?**

Check the [FAQ](../faq.md) or open a GitHub issue.
