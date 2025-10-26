# Cloudflare Pages Frontend Deployment Guide

**Time Estimate:** 15-20 minutes (first time)
**What You'll Deploy:** Your React frontend to Cloudflare Pages (global CDN)

---

## What Cloudflare Pages Does

Cloudflare Pages is a static site hosting platform that deploys your React app to Cloudflare's global CDN.

**Why it matters:**
- ⚡ **Global CDN** - Your frontend serves from the edge, close to users
- 🚀 **Instant builds** - Connected to GitHub, auto-deploys on push
- 💰 **Free tier** - Unlimited static requests and bandwidth
- 🔒 **Automatic HTTPS** - Free SSL certificates for custom domains

Your frontend will be accessible at: `https://your-project.pages.dev`

---

## Prerequisites

Before deploying, ensure you have:

✅ **Backend deployed** - Completed [Cloudflare Workers Deployment](../platforms/cf.md)
✅ **Webhooks configured** - Completed [Stripe Webhooks Deployment](stripe-deploy.md)
✅ **Worker URL ready** - e.g., `https://your-worker.workers.dev`
✅ **GitHub account** - Your code pushed to a GitHub repository
✅ **Clerk live mode keys** - Publishable key that starts with `pk_live_...`

---

## What You'll Do

This guide covers:

1. **Push Code to GitHub** - Get your frontend repo ready
2. **Create Cloudflare Pages Project** - Connect your repo
3. **Configure Build Settings** - Set up Vite build
4. **Add Environment Variables** - Connect frontend to production API
5. **Deploy** - Trigger first build
6. **Verify Deployment** - Test your live frontend
7. **Configure Custom Domain** (Optional)

---

## Step 1: Push Your Code to GitHub

### 1.1 Initialize Git (If Not Already)

If your project isn't already in Git:

```bash
cd /home/mini/Documents/clerk-exp
git init
git add .
git commit -m "Initial commit - Production ready SaaS"
```

### 1.2 Create GitHub Repository

📍 Go to: **GitHub** (https://github.com/new)

Create a new repository:
- **Name:** `your-saas-name` (whatever you want)
- **Visibility:** Private or Public (your choice)
- **Don't** initialize with README (you already have code)

Click **"Create repository"**

### 1.3 Push to GitHub

Copy the commands from GitHub's "push an existing repository" section:

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

## Step 2: Create Cloudflare Pages Project

### 2.1 Navigate to Pages (IMPORTANT)

📍 Go to: **Cloudflare Dashboard** (https://dash.cloudflare.com)

In the left sidebar, click **"Workers & Pages"**

⚠️ **IMPORTANT:** At the top of the page, you'll see two tabs: **"Workers"** and **"Pages"**

**Click on the "Pages" tab** - It's easy to miss! Make sure you're on the Pages tab before proceeding.

### 2.2 Create New Project

Click the **"Create application"** button (or "Create a project" if you have no projects yet)

Click **"Connect to Git"**

### 2.3 Connect GitHub Account

If this is your first time:
1. Click **"Connect GitHub"**
2. Authorize Cloudflare to access your GitHub account
3. Choose which repositories to allow access (select your repo or all repos)
4. Click **"Install & Authorize"**

You'll be redirected back to Cloudflare.

### 2.4 Select Your Repository

You should now see a list of your GitHub repositories.

**Find and select** your repository (the one you just pushed to)

Click **"Begin setup"**

---

## Step 3: Configure Build Settings

### 3.1 Set Up Build Configuration

You'll see a form with build settings. Fill them in:

**Project name:** `your-saas-name` (this will be your subdomain: `your-saas-name.pages.dev`)

**Production branch:** `main` (or `master` if that's your default branch)

**Framework preset:** Select **"Vite"** from the dropdown

⚠️ **IMPORTANT:** After selecting Vite, the build settings should auto-fill. **But verify they match below:**

**Build command:**
```
npm run build
```

**Build output directory:**
```
dist
```

**Root directory (path):**
```
frontend-v2
```

⚠️ **This is critical!** - Your frontend code is in the `frontend-v2` folder, not the root. If you forget this, the build will fail.

### 3.2 Double-Check Build Settings

Before proceeding, verify:
- ✅ Framework preset: **Vite**
- ✅ Build command: `npm run build`
- ✅ Build output directory: `dist`
- ✅ Root directory: `frontend-v2`

---

## Step 4: Add Environment Variables

### 4.1 Scroll to Environment Variables Section

On the same setup page, scroll down to **"Environment variables (advanced)"**

Click **"Add variable"**

### 4.2 Add Clerk Publishable Key

**Variable name:**
```
VITE_CLERK_PUBLISHABLE_KEY
```

**Value:**
```
pk_live_abc123...
```

⚠️ **Use your LIVE mode Clerk key**, not test mode!

**Where to get it:**
- Go to Clerk Dashboard (https://dashboard.clerk.com)
- Select your application
- Click **API Keys**
- Toggle to **Production** mode (top-right)
- Copy **Publishable key** (starts with `pk_live_...`)

Click **"Add variable"**

### 4.3 Add API URL

Click **"Add variable"** again

**Variable name:**
```
VITE_API_URL
```

**Value:**
```
https://your-worker.workers.dev
```

⚠️ **Replace with your actual worker URL** from the backend deployment (Step 6).

**Example:**
```
https://pan-api-abc123.workers.dev
```

Click **"Add variable"**

### 4.4 Verify Environment Variables

You should now see both variables listed:
- ✅ `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
- ✅ `VITE_API_URL` = `https://your-worker.workers.dev`

---

## Step 5: Deploy Your Frontend

### 5.1 Save and Deploy

Click the **"Save and Deploy"** button at the bottom

Cloudflare will now:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Run the build command (`npm run build`)
4. Deploy the `dist` folder to the CDN
5. Assign you a URL

### 5.2 Monitor the Build

You'll see a build log in real-time showing:
```
Cloning repository...
Installing dependencies...
Running build command...
Deploying to Cloudflare's network...
```

**Expected build time:** 2-5 minutes

### 5.3 Build Success

When complete, you'll see:
```
✅ Success! Deployed to https://your-saas-name.pages.dev
```

**Copy this URL** - This is your live frontend!

---

## Step 6: Verify Your Deployment

### 6.1 Visit Your Live Site

Open your browser and go to: `https://your-saas-name.pages.dev`

**You should see:**
- ✅ Your landing page loads
- ✅ Pricing cards display correctly
- ✅ Sign up/sign in buttons work

### 6.2 Test Authentication Flow

1. Click **"Sign Up"**
2. Enter your email and create an account
3. Verify email (if required by Clerk)
4. You should be redirected to the dashboard

✅ **If this works** - Your frontend is correctly connected to Clerk production!

### 6.3 Test API Connection

In your dashboard:
1. You should see your current tier (likely "Free")
2. You should see usage counter
3. Click "Make Request" or whatever triggers your API
4. Verify the request succeeds

✅ **If this works** - Your frontend is correctly connected to your backend API!

### 6.4 Test Upgrade Flow

1. Click **"Upgrade Plan"** (or similar button)
2. Select a paid tier
3. You should be redirected to Stripe Checkout
4. **DON'T complete payment yet** - Just verify Checkout loads

✅ **If Checkout loads** - Your integration is working end-to-end!

---

## Step 7: Update Clerk Allowed Origins

### 7.1 Why This is Needed

Clerk needs to know which domains are allowed to make authentication requests. You need to add your production frontend URL.

### 7.2 Add Production Origin

📍 Go to: **Clerk Dashboard → [Your App] → API Keys**

Direct link format: `https://dashboard.clerk.com/apps/[your-app-id]/api-keys`

Scroll down to **"Allowed origins"** section

Click **"Add origin"**

**Add your Pages URL:**
```
https://your-saas-name.pages.dev
```

Click **"Save"**

### 7.3 Test Authentication Again

Go back to your live site and try signing up or signing in again.

✅ **Should work without CORS errors now!**

---

## Step 8: Test Full End-to-End Flow

Now test the complete production flow:

### 8.1 Sign Up and Verify Free Tier

1. Sign up with a new email (or use existing account)
2. Go to dashboard
3. Verify tier shows "Free"
4. Verify usage counter is at 0

### 8.2 Test Usage Limits

1. Make API requests (whatever triggers your API)
2. Verify usage counter increments
3. Make requests until you hit your free tier limit (e.g., 10 requests)
4. Verify you get an error when limit is exceeded

✅ **Usage tracking is working!**

### 8.3 Test Upgrade Flow

1. Click **"Upgrade Plan"**
2. Select a paid tier (Pro, Enterprise, etc.)
3. Complete Stripe Checkout:
   - Use a real card OR
   - Use a 100% coupon if you set one up
4. After payment, return to dashboard
5. **Refresh the page** (to refresh JWT)
6. Verify your tier updated

✅ **Full subscription flow is working!**

### 8.4 Test Customer Portal

1. Click **"Manage Billing"** in dashboard
2. Verify Stripe Customer Portal loads
3. Verify you can view subscription details

✅ **Customer portal is working!**

---

## Step 9: Set Up Automatic Deployments

### 9.1 How It Works

Cloudflare Pages automatically deploys when you push to GitHub:
- **Push to `main` branch** → Deploys to production
- **Push to other branches** → Creates preview deployment

### 9.2 Test Automatic Deployment

Make a small change to your frontend:

```bash
cd frontend-v2
# Make a small change (edit a text string, etc.)
git add .
git commit -m "Test auto-deploy"
git push origin main
```

### 9.3 Watch the Build

📍 Go to: **Cloudflare Dashboard → Workers & Pages → Pages tab → [Your Project]**

Click on the **"Deployments"** tab

You should see a new deployment in progress.

**Expected time:** 2-5 minutes

✅ **Your changes go live automatically!**

---

## Step 10: Configure Custom Domain (Optional)

### 10.1 Why Use a Custom Domain?

Instead of `your-saas-name.pages.dev`, use `yourdomain.com` or `app.yourdomain.com`

### 10.2 Add Custom Domain

📍 Go to: **Workers & Pages → Pages tab → [Your Project] → Custom domains**

Click **"Set up a custom domain"**

**Enter your domain:**
```
yourdomain.com
```
OR
```
app.yourdomain.com
```

Click **"Continue"**

### 10.3 Configure DNS

If your domain is **managed by Cloudflare:**
- Cloudflare will automatically add the DNS records
- Click **"Activate domain"**
- Done! ✅

If your domain is **managed elsewhere** (GoDaddy, Namecheap, etc.):
- Cloudflare will show you DNS records to add
- Add the CNAME record in your DNS provider
- Come back and click **"Verify"**

### 10.4 Wait for SSL

Cloudflare automatically provisions an SSL certificate for your custom domain.

**Expected time:** 2-10 minutes

You'll see a status indicator change from "Pending" to "Active"

### 10.5 Update Clerk Allowed Origins

Add your custom domain to Clerk:

📍 Go to: **Clerk Dashboard → API Keys → Allowed origins**

Click **"Add origin"**

```
https://yourdomain.com
```

Click **"Save"**

✅ **Your custom domain is live!**

---

## Common Issues & Fixes

### ❌ Issue: Build fails with "No such file or directory"

**Cause:** Root directory not set to `frontend-v2`

**Fix:**
1. Go to Workers & Pages → Pages → Your Project → Settings → Builds & deployments
2. Scroll to **"Build configuration"**
3. Set **Root directory** to: `frontend-v2`
4. Click **"Save"**
5. Go to Deployments tab → Click **"Retry deployment"**

---

### ❌ Issue: Build fails with "Command not found: vite"

**Cause:** Build command or framework preset incorrect

**Fix:**
1. Go to Settings → Builds & deployments
2. Verify **Framework preset**: `Vite`
3. Verify **Build command**: `npm run build`
4. Verify **Build output directory**: `dist`
5. Click **"Save"** → **"Retry deployment"**

---

### ❌ Issue: Site loads but shows "Clerk is not loaded"

**Cause:** Missing `VITE_CLERK_PUBLISHABLE_KEY` environment variable

**Fix:**
1. Go to Settings → Environment variables
2. Verify `VITE_CLERK_PUBLISHABLE_KEY` is set
3. Verify it's your **production** key (starts with `pk_live_`)
4. If missing or wrong, add/update it
5. Go to Deployments → **"Retry deployment"** (env changes require rebuild)

---

### ❌ Issue: CORS error when signing in

**Cause:** Your Pages URL not added to Clerk allowed origins

**Fix:**
1. Go to Clerk Dashboard → API Keys
2. Scroll to **"Allowed origins"**
3. Add: `https://your-saas-name.pages.dev`
4. Click **"Save"**
5. Try signing in again (may need to refresh page)

---

### ❌ Issue: API requests fail with CORS errors

**Cause:** Your frontend URL not allowed by your backend

**Fix:**

**Option 1: Allow all origins** (easier, less secure)
- Your backend's CORS is already set to allow all origins by default
- This should work unless you set `ALLOWED_ORIGINS`

**Option 2: Whitelist specific domains** (more secure)
- Update your worker secret:
```bash
wrangler secret put ALLOWED_ORIGINS
# Value: https://your-saas-name.pages.dev,https://yourdomain.com
```
- No redeploy needed - updates immediately

---

### ❌ Issue: Environment variable changes don't take effect

**Cause:** Environment variables only apply to new builds, not existing deployments

**Fix:**
1. After changing environment variables
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click **"Retry deployment"**
5. Wait for build to complete
6. Changes will now be live

---

### ❌ Issue: "This site can't be reached" with custom domain

**Cause:** DNS not configured correctly or SSL pending

**Fix:**
1. Go to Custom domains in your Pages project
2. Check status - Should say "Active"
3. If "Pending SSL", wait 5-10 more minutes
4. If "DNS Error":
   - Click **"View configuration"**
   - Verify DNS records in your DNS provider
   - CNAME should point to your Pages project
5. If "Verification failed":
   - Check DNS propagation: https://www.whatsmydns.net
   - Wait up to 24 hours for propagation

---

## Gotchas & Best Practices

### 🔥 Gotcha: Workers & Pages Tab is Confusing

**The Problem:** It's easy to end up on the Workers tab instead of Pages tab.

**What to watch for:**
- After clicking "Workers & Pages" in sidebar
- Look at the **top of the page** for two tabs: "Workers" and "Pages"
- Make sure you click **"Pages"** tab
- If you don't see your Pages project, you're probably on the Workers tab

**The Fix:**
- Always check which tab you're on (Workers vs Pages)
- Bookmark the direct link after first setup

---

### 🔥 Gotcha: Root Directory Must Be Set

**The Problem:** Your frontend is in `frontend-v2/` folder, not the repo root.

**What happens if you forget:**
- Build fails with "package.json not found"
- Or builds the wrong folder entirely

**The Fix:**
- ✅ Always set **Root directory** to `frontend-v2`
- Check this setting in the initial setup AND in Settings later
- Cloudflare won't warn you if it's wrong

---

### 🔥 Gotcha: Environment Variables Need Rebuild

**The Problem:** You add/change env variables but they don't take effect.

**What happens:**
- Your site still uses old values
- New API URL doesn't work
- Clerk keys don't update

**The Fix:**
- ✅ After changing env variables, **always trigger a new deployment**
- Go to Deployments → Retry deployment
- Or push a new commit to trigger auto-deploy

---

### 🔥 Gotcha: Test vs Live Mode Keys

**The Problem:** Using `pk_test_` key in production.

**What happens:**
- Users sign up in Clerk test mode
- Test mode users don't appear in live mode
- Subscriptions fail or go to wrong Stripe mode

**The Fix:**
- ✅ Always use `pk_live_` keys for production frontend
- Verify in Clerk Dashboard → API Keys → "Production" toggle is on
- Double-check the key starts with `pk_live_`

---

### ✅ Best Practice: Use Preview Deployments

**Do this:**
- Create a new branch for features: `git checkout -b new-feature`
- Push the branch: `git push origin new-feature`
- Cloudflare automatically creates a preview deployment
- Test changes at: `https://abc123.your-project.pages.dev`
- Merge to main when ready

**Why:** Test changes before they go live to production.

---

### ✅ Best Practice: Monitor Build Logs

**Do this:**
- After deploying, click into the deployment
- Read through the build log
- Look for warnings or errors even if build succeeded

**Why:** Catches issues like missing env vars, deprecated packages, or build warnings.

---

### ✅ Best Practice: Set Up Branch Protections

**Do this:**
- In GitHub, enable branch protection on `main`
- Require pull request reviews before merging
- This prevents accidental direct pushes to production

**Why:** Safer deployment workflow, especially with teams.

---

## Verification Checklist

Before considering deployment complete, verify:

### ✅ Build Configuration
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Root directory: `frontend-v2`
- [ ] Latest deployment shows "Success"

### ✅ Environment Variables
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set to `pk_live_...`
- [ ] `VITE_API_URL` set to your worker URL
- [ ] Both variables visible in Settings → Environment variables

### ✅ Clerk Configuration
- [ ] Production Pages URL added to Clerk allowed origins
- [ ] Custom domain added to allowed origins (if applicable)

### ✅ End-to-End Testing
- [ ] Landing page loads without errors
- [ ] Sign up flow works
- [ ] Dashboard loads and shows correct tier
- [ ] API requests succeed
- [ ] Usage tracking increments correctly
- [ ] Upgrade flow redirects to Stripe Checkout
- [ ] After upgrade, tier updates in dashboard
- [ ] Customer portal accessible

### ✅ Automatic Deployments
- [ ] Push to main triggers new deployment
- [ ] New deployment completes successfully
- [ ] Changes appear on live site

---

## Managing Your Deployment

### View Deployment History

📍 Go to: **Workers & Pages → Pages → Your Project → Deployments**

You'll see:
- All deployments (production + previews)
- Build status (success/failed)
- Build duration
- Commit message
- Who triggered the deploy

### Rollback to Previous Deployment

1. Go to **Deployments** tab
2. Find the deployment you want to rollback to
3. Click **"Rollback to this deployment"**
4. Confirm

✅ **Instant rollback** - No rebuild needed.

### View Build Logs

1. Go to **Deployments** tab
2. Click on any deployment
3. Scroll through build logs
4. Look for errors, warnings, or useful info

### Update Environment Variables

1. Go to **Settings → Environment variables**
2. Click **"Edit"** next to a variable
3. Update the value
4. Click **"Save"**
5. Go to **Deployments → Retry deployment**

---

## Performance Monitoring

### View Analytics

📍 Go to: **Workers & Pages → Pages → Your Project → Analytics**

You'll see:
- **Requests per day** - Total page loads
- **Data transfer** - Bandwidth used
- **Unique visitors** - Approximate user count

### Pages Performance

Cloudflare Pages automatically optimizes:
- ✅ Gzip/Brotli compression
- ✅ HTTP/2 and HTTP/3
- ✅ Global CDN caching
- ✅ Automatic minification

**Expected load times:**
- First load: < 2 seconds
- Cached loads: < 500ms

---

## Cost Management

### Free Tier Limits

| Resource | Free Limit | Overage Cost |
|----------|-----------|--------------|
| Pages Builds | 500/month | $0.50 per build |
| Bandwidth | Unlimited | Free |
| Requests | Unlimited | Free |

💡 **For most projects:** You'll stay on free tier indefinitely.

**500 builds/month = ~16 builds per day** - More than enough for most workflows.

---

## Next Steps

✅ **Frontend deployed to Cloudflare Pages!**

**Your SaaS is now fully live:**
- ✅ Backend API on Cloudflare Workers
- ✅ Frontend on Cloudflare Pages
- ✅ Webhooks configured for subscriptions
- ✅ Full authentication and billing working

**Recommended next steps:**
- Set up custom domain for professional URLs
- Monitor usage and performance in Cloudflare dashboard
- Set up error tracking (Sentry, LogRocket, etc.)
- Add Google Analytics or your preferred analytics tool
- Test thoroughly with real users

---

## Need Help?

- 📖 [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- 🚀 [Pages Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)
- 🐛 [FAQ & Troubleshooting](../faq.md)
- 💬 [Cloudflare Community](https://community.cloudflare.com/)

---

**🎉 Your SaaS is live on the edge!**

Users worldwide will get fast load times and reliable service thanks to Cloudflare's global network.
