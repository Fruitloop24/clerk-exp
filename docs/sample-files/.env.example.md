# Frontend Environment Variables Example

Copy `frontend-v2/.env.example` → `frontend-v2/.env` and fill in your values.

---

## File Structure (`frontend-v2/.env`)

```bash
# ===================================
# CLERK AUTHENTICATION
# ===================================
# Get this from: https://dashboard.clerk.com/
# NOTE: Use test key (pk_test_...) for development
#       Switch to live key (pk_live_...) for production
# This is your PUBLISHABLE key (safe to expose in frontend)

VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY_HERE

# ===================================
# API CONFIGURATION
# ===================================
# Your Cloudflare Worker URL
# Development: http://localhost:8787 (wrangler dev)
# Production: https://your-worker-name.your-subdomain.workers.dev

VITE_API_URL=http://localhost:8787
```

---

## Variable Explanations

### Clerk Authentication

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Public key for Clerk frontend SDK | Clerk Dashboard → API Keys |

**Important:**
- This is your **PUBLISHABLE** key (starts with `pk_`), NOT the secret key
- It's safe to expose in frontend code (that's why it has the `VITE_` prefix)
- Vite will embed this in your built JavaScript

**Test vs Production:**
- **Development**: Use key starting with `pk_test_`
- **Production**: Use key starting with `pk_live_`

---

### API Configuration

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_API_URL` | Your backend Worker URL | Cloudflare Workers dashboard or local dev server |

**Development:**
```bash
VITE_API_URL=http://localhost:8787
```

**Production:**
```bash
VITE_API_URL=https://your-worker-name.your-subdomain.workers.dev
```

Or if you're using a custom domain:
```bash
VITE_API_URL=https://api.yourdomain.com
```

---

## Local Development Setup

1. **Copy the example file:**
   ```bash
   cd frontend-v2
   cp .env.example .env
   ```

2. **Fill in your values:**
   - Get Clerk publishable key from Clerk Dashboard
   - Set API URL to `http://localhost:8787` (or whatever port your Worker runs on)

3. **Run the frontend:**
   ```bash
   npm run dev
   ```

4. **Vite dev server will start at:** `http://localhost:5173`

---

## Production Deployment (Cloudflare Pages)

### Option 1: Set via Cloudflare Dashboard

1. Go to **Cloudflare Dashboard → Pages → Your Project**
2. Click **Settings → Environment Variables**
3. Add variables for **Production** environment:
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_YOUR_KEY`
   - `VITE_API_URL` = `https://your-worker.workers.dev`

### Option 2: Set via Wrangler CLI

```bash
# From your frontend-v2 directory
wrangler pages project create your-project-name

# Set production environment variables
wrangler pages secret put VITE_CLERK_PUBLISHABLE_KEY
wrangler pages secret put VITE_API_URL
```

**Important:** After changing environment variables, you need to trigger a new deployment for changes to take effect.

---

## Development vs Production Examples

### Development `.env`

```bash
# Local development - uses test keys and local API
VITE_CLERK_PUBLISHABLE_KEY=pk_test_abc123xyz789...
VITE_API_URL=http://localhost:8787
```

### Production (Cloudflare Pages Environment Variables)

```bash
# Production - uses live keys and deployed Worker
VITE_CLERK_PUBLISHABLE_KEY=pk_live_abc123xyz789...
VITE_API_URL=https://my-worker.my-subdomain.workers.dev
```

Or with custom domain:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_abc123xyz789...
VITE_API_URL=https://api.myapp.com
```

---

## Common Issues

### Clerk Authentication Not Working

**Error:**
```
Clerk: Missing publishable key
```

**Solution:**
1. Make sure you have a `.env` file in `frontend-v2/`
2. Check the variable name is exactly `VITE_CLERK_PUBLISHABLE_KEY`
3. Restart your Vite dev server after adding/changing `.env`

---

### API Requests Failing

**Error:**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solution:**
1. Make sure your backend Worker is running: `cd api && npm run dev`
2. Check `VITE_API_URL` matches the port your Worker is running on
3. Default Worker port is `8787`, but check your terminal output

---

### Wrong Clerk Environment (Test vs Live)

**Error:**
```
User not found in Clerk
```

**Solution:**
- If using `pk_test_` key in frontend, make sure backend uses `sk_test_` key
- If using `pk_live_` key in frontend, make sure backend uses `sk_live_` key
- Frontend and backend must use the **same Clerk environment**

---

### CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:8787' has been blocked by CORS policy
```

**Solution:**
1. Make sure your backend Worker has CORS configured
2. Check `ALLOWED_ORIGINS` in backend includes your frontend URL
3. Example: Backend should have `ALLOWED_ORIGINS=http://localhost:5173`

---

### Environment Variables Not Updating

**Issue:** Changed `.env` but nothing happened

**Solution:**
1. **Stop** your Vite dev server (Ctrl+C)
2. **Restart** it: `npm run dev`
3. Vite only reads `.env` on startup

---

### Production Build Not Using New Variables

**Issue:** Deployed to Cloudflare Pages but still seeing old API URL

**Solution:**
1. Go to Cloudflare Pages dashboard
2. Check **Settings → Environment Variables**
3. **Trigger a new deployment** (redeploy or push a commit)
4. Environment variables only apply to new builds

---

## Security Notes

### Safe to Commit?

**❌ DO NOT commit `.env` to Git**

Even though `VITE_CLERK_PUBLISHABLE_KEY` is safe to expose, your `.env` file is gitignored to prevent accidentally committing secrets later.

### Safe to Expose in Frontend?

**✅ YES** - These variables are safe in frontend code:
- `VITE_CLERK_PUBLISHABLE_KEY` - Designed to be public
- `VITE_API_URL` - Just a URL, no secrets

**❌ NEVER** put these in frontend:
- `CLERK_SECRET_KEY` - Backend only
- `STRIPE_SECRET_KEY` - Backend only
- Any variable starting with `sk_` - Backend only

Vite will embed anything starting with `VITE_` into your built JavaScript, so anyone can see it.

---

## Related Documentation

- **[Clerk Setup Guide](../platforms/clerk.md)** - How to get your Clerk publishable key
- **[Frontend Deployment](../deployments/frontend-deploy.md)** - Deploy to Cloudflare Pages
- **[Architecture Guide](../features/architecture.md)** - How frontend and backend communicate

---

**Questions?** Check the [FAQ](../information/faq.md) or open a GitHub issue.
