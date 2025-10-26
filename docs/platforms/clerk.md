# Clerk Setup Guide

**Time Estimate:** 10 minutes  
**What You'll Configure:** User authentication and JWT tokens with subscription tier

---

## What Clerk Does in This Template

Clerk handles all user authentication in your SaaS:
- Sign-up and sign-in flows with email verification
- Issues JWT tokens that include the user's subscription tier
- Stores the user's plan (free/pro/enterprise) in their profile metadata

This means your API can see what tier a user is on just by reading their JWT token - no database lookups needed.

---

## What You'll Get from Clerk

By the end of this guide, you'll have three values:

- ✅ **Publishable Key** (starts with `pk_test_...`)
- ✅ **Secret Key** (starts with `sk_test_...`)
- ✅ **JWT Template** configured (named "pan-api")

These go in your config files → See [Backend ENV Example](../example-files/backend-env.md)

---

## Step 1: Create Clerk Application

### 1.1 Sign Up or Log In

📍 Go to: **https://dashboard.clerk.com**

- If you don't have an account, sign up (free for up to 10,000 monthly active users)
- If you already have an account, sign in

### 1.2 Create Your Application

1. Click the **"Add application"** button (you'll see it in the center if this is your first app, or top-right if you have existing apps)

2. **Application name:** Enter your SaaS name (you can change this later)

3. **Sign-in options:** 
   - Check **"Email"** (required)
   - Optional: Add social sign-in providers like Google, GitHub, etc.

4. Click **"Create application"**

You'll be taken to your new application's dashboard.

---

## Step 2: Get Your API Keys

### 2.1 Navigate to API Keys

📍 In your Clerk dashboard, click **"API Keys"** in the left sidebar

Direct link format: `https://dashboard.clerk.com/apps/[your-app-id]/api-keys`

You'll see two keys on this page.

### 2.2 Copy Your Publishable Key

- Look for **"Publishable key"**
- It starts with `pk_test_` (for development) or `pk_live_` (for production)
- Click the copy button

**This key is safe to expose** - it's used in your frontend React code.

You'll add this to:
- `api/dev.env` as `CLERK_PUBLISHABLE_KEY`
- `frontend-v2/.env` as `VITE_CLERK_PUBLISHABLE_KEY`

### 2.3 Copy Your Secret Key

- Look for **"Secret key"**  
- It starts with `sk_test_` (for development) or `sk_live_` (for production)
- Click the copy button

**Keep this key secret** - never expose it in frontend code. It's used by your Cloudflare Worker backend to verify JWT tokens.

You'll add this to:
- `api/dev.env` as `CLERK_SECRET_KEY`

---

## Step 3: Create JWT Template (CRITICAL FOR TIER SYSTEM)

### 3.1 Navigate to JWT Templates

📍 In your Clerk dashboard, click **"JWT Templates"** in the left sidebar

Direct link format: `https://dashboard.clerk.com/apps/[your-app-id]/jwt-templates`

### 3.2 Create New Template

Click the **"New template"** button

### 3.3 Configure the Template

Fill in these exact settings:

**Name:** `pan-api`

⚠️ **Must be exact** - lowercase, with hyphen, no spaces. The backend looks for a template with this exact name.

**Token lifetime:** `3600` (1 hour - this is fine, leave as default)

**Algorithm:** `RS256` (leave as default)

### 3.4 Add the Claims

In the **Claims** section, you'll see a JSON editor.

Paste this **exactly as shown**:
```json
{
  "plan": "{{user.public_metadata.plan}}"
}
```

⚠️ **Important details:**
- The key must be `"plan"` (in quotes)
- The value must be `"{{user.public_metadata.plan}}"` with double curly braces
- Don't change the property path - it must be `user.public_metadata.plan`

### 3.5 Save the Template

Click **"Create"**

You should now see "pan-api" in your list of JWT templates.

---

## Why This JWT Template Matters

This is what makes the tier system work without a database.

**Here's the flow:**

1. **User signs up** → Clerk automatically sets `user.publicMetadata.plan = "free"`

2. **User upgrades to Pro** → Stripe webhook tells Clerk to update `user.publicMetadata.plan = "pro"`

3. **Every API request** → The JWT token automatically includes:
```json
   {
     "userId": "user_abc123",
     "plan": "pro"
   }
```

4. **Your API reads the tier from the JWT** → No need to query a database to check what plan they're on

Without this JWT template, your API can't see what tier the user is on. Upgrades will appear to succeed in Stripe, but users will still be treated as "free" tier in your app.

📖 **Want to understand the architecture?** See [JWT Routing Explained](../features/architecture.md)

---

## Step 4: Configure Allowed Origins

### 4.1 Navigate to Allowed Origins

📍 On the same **"API Keys"** page in your Clerk dashboard, scroll down to the **"Allowed origins"** section

### 4.2 Add Local Development Origins

Click **"Add origin"** and add these two URLs:

1. `http://localhost:5173` (Vite's default port)
2. `http://localhost:3000` (alternative port, in case 5173 is in use)

Click **"Save"** after adding each one.

### 4.3 Production Origins (You'll Add These Later)

When you deploy to production, come back here and add your production domain:
- `https://yourdomain.com`
- `https://www.yourdomain.com` (if you use the www subdomain)

⚠️ **Why this is needed:** Without allowed origins, browsers will block your sign-in requests with CORS errors.

---

## What You Have Now

You should have collected these three values:

1. **CLERK_PUBLISHABLE_KEY** = `pk_test_abc123...` (your actual key)
2. **CLERK_SECRET_KEY** = `sk_test_xyz789...` (your actual key)
3. **CLERK_JWT_TEMPLATE** = `pan-api` (exact value for everyone)

### Where These Go

**Backend** (`api/dev.env`):
```bash
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**Frontend** (`frontend-v2/.env`):
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

📋 **See complete example:** [Backend ENV File](../example-files/backend-env.md)

---

## Common Mistakes to Avoid

### ❌ JWT Template Named Wrong
**Wrong:** "pan-API", "panapi", "pan_api"  
**Correct:** `pan-api` (lowercase with hyphen)

### ❌ Wrong JWT Claim
**Wrong:** `{"tier": "..."}` or `{"plan": "free"}` (hardcoded value)  
**Correct:** `{"plan": "{{user.public_metadata.plan}}"}` (dynamic template)

### ❌ Mixed Up the Keys
**Check:** Publishable key starts with `pk_`, Secret key starts with `sk_`  
Don't paste the secret key where the publishable key goes (or vice versa)

### ❌ Forgot Allowed Origins
**Result:** You'll get CORS errors when trying to sign in  
**Fix:** Make sure you added `http://localhost:5173` to allowed origins

---

## Next Steps

✅ **Clerk is configured!**

You now have authentication set up with JWT tokens that include subscription tiers.

**Next platform:** [Stripe Setup →](stripe.md)

---

## Need Help?

- 📖 [Clerk Official Documentation](https://clerk.com/docs)
- 🔐 [JWT Templates Guide](https://clerk.com/docs/backend-requests/making/jwt-templates)
- 🐛 [Troubleshooting Guide](../reference/troubleshooting.md) (for errors during testing)