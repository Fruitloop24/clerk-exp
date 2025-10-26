# Stripe Setup Guide

**Time Estimate:** 10 minutes  
**What You'll Configure:** Payment processing and subscription management

---

## What Stripe Does in This Template

Stripe handles all payment and subscription logic:
- Processes credit card payments
- Manages recurring subscriptions (monthly billing)
- Provides customer portal for users to manage their subscriptions
- Sends webhooks when subscriptions are created, updated, or cancelled

Your backend receives these webhooks and updates the user's tier in Clerk automatically.

---

## What You'll Get from Stripe

By the end of this guide, you'll have:

- ✅ **Secret Key** (starts with `sk_test_...`)
- ✅ **Price ID** for each paid tier (starts with `price_...`)
- ✅ **Portal Configuration ID** (starts with `bpc_...`)

These go in your config files → See [Backend ENV Example](../example-files/backend-env.md)

---

## Step 1: Switch to Test Mode

### 1.1 Log In to Stripe

📍 Go to: **https://dashboard.stripe.com**

Sign in or create a free account if you don't have one.

### 1.2 Enable Test Mode

Look in the **top-right corner** of the dashboard for a toggle switch.

Make sure it says **"TEST MODE"** (you should see a test mode banner at the top).

⚠️ **Important:** Always use test mode for local development. You'll switch to live mode only when deploying to production.

In test mode, you can use test credit card numbers and no real money is processed.

---

## Step 2: Get Your Secret Key

### 2.1 Navigate to API Keys

📍 Click **"Developers"** in the top navigation → Click **"API keys"**

Direct link: **https://dashboard.stripe.com/test/apikeys**

### 2.2 Copy Your Secret Key

Look for **"Secret key"** in the "Standard keys" section.

- It starts with `sk_test_` (for test mode)
- Click **"Reveal test key"** if it's hidden
- Click the copy button

**Keep this key secret** - it's used by your backend to create checkout sessions and process webhooks.

You'll add this to:
- `api/dev.env` as `STRIPE_SECRET_KEY`

💡 You'll get production keys (`sk_live_`) later during deployment.

---

## Step 3: Create Products for Your Tiers

You need to create a Stripe product for **each paid tier** in your SaaS.

**Default setup:** Create a "Pro" product (the free tier doesn't need a Stripe product)

**If you have multiple paid tiers:** Create a product for each one (Pro, Enterprise, etc.)

### 3.1 Navigate to Products

📍 Click **"Products"** in the left sidebar → Click **"Add product"**

Direct link: **https://dashboard.stripe.com/test/products**

### 3.2 Create Your First Product (Pro Tier)

Fill in these fields:

**Name:** `Pro Plan` (or whatever you want to call it)

**Description:** (optional) `Unlimited API requests and premium features`

**Pricing:**
- Click **"Add pricing"**
- **Price:** `29.00` USD (or your monthly price)
- **Billing period:** Select **"Monthly"**
- **Payment type:** Keep as **"Recurring"**

Click **"Save product"**

### 3.3 Get the Price ID (CRITICAL)

After saving, you'll see your product details page.

Scroll down to the **"Pricing"** section.

You'll see something like:
```
$29.00 / month
price_1Abc23DEfg45HIjk  ← This is what you need
```

⚠️ **IMPORTANT:** Copy the **PRICE ID** (starts with `price_`)

**Do NOT copy the Product ID** (starts with `prod_`) - you need the **PRICE ID**.

**Why this matters:** The price ID is what you use in checkout. The product can have multiple prices (monthly/yearly), so you need the specific price ID.

You'll add this to:
- `api/dev.env` as `STRIPE_PRICE_ID_PRO`

### 3.4 Create Additional Tiers (If Needed)

If you have more paid tiers (like Enterprise at $99/month), repeat steps 3.2-3.3:

**For Enterprise tier:**
- Name: `Enterprise Plan`
- Price: `99.00` USD monthly
- Get Price ID → Add to `api/dev.env` as `STRIPE_PRICE_ID_ENTERPRISE`

**For Starter tier:**
- Name: `Starter Plan`
- Price: `9.00` USD monthly
- Get Price ID → Add to `api/dev.env` as `STRIPE_PRICE_ID_STARTER`

💡 The free tier doesn't need a Stripe product since users aren't charged.

---

## Step 4: Enable Customer Portal

The Customer Portal lets your users manage their own subscriptions (update payment method, cancel, view invoices).

### 4.1 Navigate to Customer Portal Settings

📍 Click **"Settings"** in the top navigation → **"Billing"** → **"Customer portal"**

Direct link: **https://dashboard.stripe.com/test/settings/billing/portal**

### 4.2 Activate the Portal

Click the **"Activate"** button (or it might say "Activate test link" in test mode)

### 4.3 Configure Portal Settings (Optional)

You can customize what users can do in the portal:

**Default settings are fine for now:**
- ✅ Update payment methods
- ✅ Cancel subscriptions
- ✅ View invoices

Click **"Save"** if you made any changes.

### 4.4 Get the Portal Configuration ID

After activating, look for the **Configuration ID** at the top of the page.

It looks like: `bpc_1Abc23DEfg45HIjk` (starts with `bpc_`)

Click the copy button.

You'll add this to:
- `api/dev.env` as `STRIPE_PORTAL_CONFIG_ID`

💡 This ID tells Stripe which portal configuration to use when your users click "Manage Billing" in your app.

---

## Step 5: Webhooks (You'll Set This Up During Testing)

You don't need to configure webhooks right now.

When you get to the "Test Locally" step in the main README, you'll use the Stripe CLI to forward webhooks to your local server.

**For now, just note:** You'll need to run this command later:
```bash
stripe listen --forward-to http://localhost:8787/webhook/stripe
```

This will give you a webhook secret that starts with `whsec_...`

---

## What You Have Now

You should have collected these values:

### For One Tier (Pro):
1. **STRIPE_SECRET_KEY** = `sk_test_abc123...` (your actual key)
2. **STRIPE_PRICE_ID_PRO** = `price_xyz789...` (your actual price ID)
3. **STRIPE_PORTAL_CONFIG_ID** = `bpc_def456...` (your actual config ID)

### For Multiple Tiers (Pro + Enterprise):
1. **STRIPE_SECRET_KEY** = `sk_test_abc123...`
2. **STRIPE_PRICE_ID_PRO** = `price_xyz789...`
3. **STRIPE_PRICE_ID_ENTERPRISE** = `price_uvw123...`
4. **STRIPE_PORTAL_CONFIG_ID** = `bpc_def456...`

### Where These Go

**Backend** (`api/dev.env`):
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PRICE_ID_PRO=price_YOUR_ID_HERE
STRIPE_PORTAL_CONFIG_ID=bpc_YOUR_ID_HERE

# If you have additional tiers:
# STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ID_HERE
# STRIPE_PRICE_ID_STARTER=price_YOUR_ID_HERE
```

📋 **See complete example:** [Backend ENV File](../example-files/backend-env.md)

---

## Common Mistakes to Avoid

### ❌ Copied Product ID Instead of Price ID
**Wrong:** `prod_abc123...` (product ID)  
**Correct:** `price_xyz789...` (price ID)

**Where to find it:** On the product page, scroll to "Pricing" section - the ID under the price amount.

### ❌ Used Live Mode Keys for Local Dev
**Check:** Your secret key should start with `sk_test_` (not `sk_live_`)  
**Check:** Top-right corner shows "TEST MODE" banner

### ❌ Forgot to Activate Customer Portal
**Symptom:** Users click "Manage Billing" and get an error  
**Fix:** Go to Settings → Billing → Customer portal → Click "Activate"

### ❌ Created Multiple Prices for One Product
**Issue:** If you created both monthly and yearly prices, make sure you copy the right price ID (probably the monthly one)

---

## Testing Your Stripe Setup

You can't fully test until you've configured webhooks (which happens during the "Test Locally" step).

But you can verify your setup:

✅ **Check you're in test mode** (banner at top)  
✅ **Check you have products** (Go to Products, see your tiers listed)  
✅ **Check you copied price IDs** (They start with `price_` not `prod_`)  
✅ **Check portal is active** (Settings → Billing → Customer portal shows "Active")

---

## Next Steps

✅ **Stripe is configured!**

You now have:
- Payment processing ready
- Products created for each paid tier
- Customer portal enabled for subscription management

**Next:** Add these values to your config files, then continue with the remaining setup steps in the main README.

📋 **See where to add these:** [Backend ENV File](../example-files/backend-env.md)

---

## Need Help?

- 📖 [Stripe Official Documentation](https://stripe.com/docs)
- 💳 [Test Card Numbers](https://stripe.com/docs/testing) (for testing payments later)
- 🔔 [Webhooks Guide](https://stripe.com/docs/webhooks) (you'll set these up during testing)
- 🐛 [Troubleshooting Guide](../reference/troubleshooting.md) (for errors during testing)