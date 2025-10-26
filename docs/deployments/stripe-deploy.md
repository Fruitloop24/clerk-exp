# Stripe Production Webhooks Deployment Guide

**Time Estimate:** 15-20 minutes
**What You'll Configure:** Production Stripe webhooks to sync subscription updates with your live API

---

## What This Step Does

In local development, you used the **Stripe CLI** with the `stripe listen --forward-to` command to simulate webhooks. This forwarded Stripe events from test mode to your local server.

**Now in production:**
- You'll create a **real webhook endpoint** in Stripe's dashboard
- Stripe will send live subscription events directly to your deployed API
- Your API will update user tiers in real-time when users upgrade, downgrade, or cancel

**Without this step configured, upgrades won't work in production** - users will pay but their tier won't update.

---

## Prerequisites

Before starting, ensure you have:

✅ **Backend deployed to Cloudflare Workers** - Completed [Cloudflare Deployment Guide](../platforms/cf.md)
✅ **Worker URL ready** - e.g., `https://your-worker.workers.dev`
✅ **Stripe account in Live Mode** - You'll be working with real products and webhooks

---

## What You'll Do

This guide covers:

1. **Migrate Stripe Products from Test to Live** - Recreate your tiers in production mode
2. **Update Environment Variables** - Switch to live Stripe keys and Price IDs
3. **Create Production Webhook** - Point Stripe to your live API
4. **Add Webhook Secret** - Secure webhook signature verification
5. **Test Webhook Delivery** - Verify events are reaching your API
6. **Test End-to-End Flow** - Complete a real upgrade in production

---

## Step 1: Switch Stripe to Live Mode

### 1.1 Toggle to Live Mode

📍 Go to: **Stripe Dashboard** (https://dashboard.stripe.com)

Look in the **top-right corner** for the "Test mode" toggle.

**Click the toggle to turn it OFF** - The banner should disappear and you should see "Viewing live data" or no banner at all.

⚠️ **CRITICAL:** Make sure you're in live mode for all remaining steps. Live mode products/webhooks are separate from test mode.

---

## Step 2: Migrate Products to Live Mode

### 2.1 Why You Need to Recreate Products

Stripe **does not** automatically copy test mode products to live mode. You need to manually recreate each paid tier in live mode.

**What you're recreating:**
- Pro tier product (or whatever you named it)
- Enterprise tier product (if applicable)
- Any other paid tiers

💡 **Free tier doesn't need a Stripe product** - It's handled entirely in your code.

### 2.2 Recreate Your Pro Product

📍 Go to: **Stripe Dashboard → Products → Add product**

Direct link: https://dashboard.stripe.com/products

Fill in the same details as your test mode product:

**Name:** `Pro Plan` (or your tier name)

**Description:** (optional) `Unlimited API requests and premium features`

**Pricing:**
- Click **"Add pricing"**
- **Price:** `29.00` USD (or your monthly price - **same as test mode**)
- **Billing period:** Select **"Monthly"**
- **Payment type:** Keep as **"Recurring"**

Click **"Save product"**

### 2.3 Add Product Metadata (CRITICAL)

After saving, scroll down to the **"Metadata"** section on the product page.

Click **"Add metadata"**

**Key:** `plan`
**Value:** `pro` (must match your tier name exactly - lowercase, no spaces)

Click **"Save"**

⚠️ **Why this matters:** Your webhook handler reads this metadata to know which tier to assign the user. Without it, upgrades will fail silently.

### 2.4 Copy the Price ID

Scroll to the **"Pricing"** section on the product page.

You'll see something like:
```
$29.00 / month
price_1Abc23DEfg45HIjk  ← This is your LIVE Price ID
```

**Copy the Price ID** (starts with `price_`)

⚠️ **This is a NEW Price ID** - It's different from your test mode Price ID. You'll update your environment variables with this.

### 2.5 Repeat for Additional Tiers

If you have more paid tiers (Enterprise, Starter, etc.), repeat steps 2.2-2.4 for each one:

**For Enterprise:**
- Name: `Enterprise Plan`
- Price: `99.00` USD (or your price)
- Metadata: `{ "plan": "enterprise" }`
- Copy live Price ID

**For Starter:**
- Name: `Starter Plan`
- Price: `9.00` USD (or your price)
- Metadata: `{ "plan": "starter" }`
- Copy live Price ID

💡 **Keep track of all live Price IDs** - You'll need them in the next step.

---

## Step 3: Update Production Environment Variables

### 3.1 What Needs to Change

You need to update these secrets in your Cloudflare Worker:

| Secret | Old Value (Test Mode) | New Value (Live Mode) |
|--------|----------------------|----------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_PRICE_ID_PRO` | `price_...` (test) | `price_...` (live) |
| `STRIPE_PRICE_ID_ENTERPRISE` | `price_...` (test) | `price_...` (live) |

### 3.2 Get Your Live Stripe Secret Key

📍 Go to: **Stripe Dashboard → Developers → API keys**

Direct link: https://dashboard.stripe.com/apikeys

**Make sure Live Mode is ON** (no "Test mode" banner at top)

Look for **"Secret key"** in the "Standard keys" section.

- Click **"Reveal live key"** if hidden
- Copy the key (starts with `sk_live_...`)

### 3.3 Update Secrets in Cloudflare

Open your terminal and navigate to your API directory:

```bash
cd api
```

Update each secret one at a time:

```bash
# Update Stripe secret key to live mode
wrangler secret put STRIPE_SECRET_KEY
# Paste your sk_live_... key, press Enter

# Update Pro tier Price ID to live mode
wrangler secret put STRIPE_PRICE_ID_PRO
# Paste your LIVE price_... ID (from Step 2.4), press Enter

# Update Enterprise tier Price ID to live mode (if applicable)
wrangler secret put STRIPE_PRICE_ID_ENTERPRISE
# Paste your LIVE price_... ID, press Enter
```

**Expected output for each:**
```
✨ Success! Uploaded secret STRIPE_SECRET_KEY
```

### 3.4 Verify Secrets Were Updated

List all secrets to confirm:

```bash
wrangler secret list
```

You should see all your secrets listed (but not their values - security feature).

💡 **No redeploy needed** - Secrets update immediately in your worker.

---

## Step 4: Enable Customer Portal in Live Mode

### 4.1 Activate Live Mode Portal

📍 Go to: **Stripe Dashboard → Settings → Billing → Customer portal**

Direct link: https://dashboard.stripe.com/settings/billing/portal

**Make sure you're in Live Mode** (no test mode banner)

Click the **"Activate"** button (or it might say "Activate link")

### 4.2 Configure Portal Settings (Optional)

Default settings are fine:
- ✅ Update payment methods
- ✅ Cancel subscriptions
- ✅ View invoices

Click **"Save"** if you made any changes.

### 4.3 Verify Portal Configuration ID

The Portal Configuration ID should be the **same** for test and live mode (usually `bpc_...`).

If it changed, update the secret:

```bash
wrangler secret put STRIPE_PORTAL_CONFIG_ID
# Paste your bpc_... ID, press Enter
```

💡 **Most likely you won't need to update this** - It's usually the same across modes.

---

## Step 5: Create Production Webhook Endpoint

### 5.1 Navigate to Webhooks

📍 Go to: **Stripe Dashboard → Developers → Webhooks**

Direct link: https://dashboard.stripe.com/webhooks

**Make sure "Test mode" is OFF** (you want live mode webhooks)

Click **"Add endpoint"**

### 5.2 Configure the Webhook Endpoint

**Endpoint URL:**
```
https://your-worker.workers.dev/webhook/stripe
```

⚠️ **Replace `your-worker.workers.dev`** with your actual worker URL from the Cloudflare deployment.

**Example:**
```
https://pan-api-abc123.workers.dev/webhook/stripe
```

**Description:** (optional)
```
Production webhook for subscription lifecycle events
```

### 5.3 Select Events to Send

Click **"Select events"**

Choose these **4 events** (these are the ones your API handles):

- ✅ `checkout.session.completed` - When user completes payment
- ✅ `customer.subscription.created` - When subscription starts
- ✅ `customer.subscription.updated` - When subscription changes (upgrade/downgrade)
- ✅ `customer.subscription.deleted` - When subscription cancels

Click **"Add events"**

### 5.4 Add API Version (Optional)

Stripe will use your account's default API version. You can specify a version if needed, but the default is fine.

### 5.5 Save the Endpoint

Click **"Add endpoint"**

You'll be taken to the webhook details page.

---

## Step 6: Get Webhook Signing Secret

### 6.1 Reveal Signing Secret

On the webhook details page, look for the **"Signing secret"** section.

Click **"Reveal"** next to the signing secret.

**Copy the secret** (starts with `whsec_...`)

⚠️ **This is DIFFERENT from your test mode webhook secret** - It's a new one for production.

### 6.2 Add Secret to Cloudflare Worker

In your terminal:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the whsec_... value, press Enter
```

**Expected output:**
```
✨ Success! Uploaded secret STRIPE_WEBHOOK_SECRET
```

💡 **Worker automatically picks up the new secret** - No redeploy needed.

---

## Step 7: Test Webhook Delivery

### 7.1 Send Test Webhook from Stripe

Back on the webhook details page in Stripe, click **"Send test webhook"**

Select event: `customer.subscription.created`

Click **"Send test webhook"**

### 7.2 Check the Response

**Expected response:**
- ✅ Status: `200 OK`
- ✅ Response time: < 1 second
- ✅ Response body: `{"received": true}`

✅ **If you see this** - Your webhook is working correctly!

### 7.3 Monitor Worker Logs

Open a terminal and run:

```bash
wrangler tail
```

Then send another test webhook from Stripe.

**You should see logs like:**
```
[INFO] Received webhook event: customer.subscription.created
[INFO] Webhook signature verified
[INFO] Processing subscription for customer: cus_...
```

✅ **If you see these logs** - Your API is receiving and processing webhooks!

---

## Step 8: Test End-to-End Production Flow

### 8.1 Prerequisites for Testing

⚠️ **WARNING:** You're about to create a **real subscription** with **real money**.

**Options for testing:**
1. Use a real credit card and immediately cancel (you'll be charged)
2. Create a 100% off coupon in Stripe for testing
3. Use a very low price ($0.50) for initial testing

**To create a test coupon:**
- Go to Stripe Dashboard → Products → Coupons
- Create coupon: 100% off, one-time use
- Apply at checkout

### 8.2 Complete the Full Upgrade Flow

1. **Go to your production frontend** (deployed site)
2. **Sign up with a real email** (or test email you control)
3. **Verify your tier is "Free"** in the dashboard
4. **Click "Upgrade Plan"**
5. **Select a paid tier** (Pro, Enterprise, etc.)
6. **You should be redirected to Stripe Checkout**
7. **Enter payment details:**
   - Use a real card OR
   - Use test card `4242 4242 4242 4242` if you're in Stripe test mode (but you shouldn't be!)
   - Apply coupon code if you created one
8. **Complete the checkout**
9. **You should be redirected back to your app**
10. **Refresh the dashboard**
11. **Verify your tier updated** (should show "Pro" or whatever tier you bought)

### 8.3 Expected Behavior

**What should happen:**

1. Stripe Checkout completes → sends `checkout.session.completed` webhook
2. Your API receives webhook → verifies signature → updates Clerk metadata
3. User returns to dashboard → JWT refreshes → shows new tier
4. Usage limit updates to new tier's limit

**If tier doesn't update:**
- Check webhook logs in Stripe (Dashboard → Webhooks → Your Endpoint → Logs)
- Check worker logs: `wrangler tail`
- See troubleshooting section below

---

## Step 9: Verify Everything is Working

### 9.1 Check Stripe Webhook Logs

📍 Go to: **Stripe Dashboard → Webhooks → Your Endpoint → Logs**

You should see recent webhook events with:
- ✅ Status: 200 OK
- ✅ Response time: < 1 second
- ✅ No errors

### 9.2 Check Clerk User Metadata

📍 Go to: **Clerk Dashboard → Users → [Your Test User]**

Click on the user you just upgraded.

Scroll to **"Public metadata"** section.

**You should see:**
```json
{
  "plan": "pro"
}
```

✅ **If you see this** - The webhook successfully updated Clerk!

### 9.3 Test Usage Tracking

1. In your dashboard, make some API requests
2. Verify the usage counter increments
3. Verify you can make up to your tier's limit
4. Verify limit matches your tier (Pro: 50, Enterprise: Unlimited, etc.)

### 9.4 Test Customer Portal

1. In your dashboard, click **"Manage Billing"**
2. You should be redirected to Stripe Customer Portal
3. Verify you can:
   - ✅ View your subscription
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Cancel subscription (don't actually cancel unless testing!)

---

## Step 10: Clean Up Test Subscriptions (Optional)

If you created test subscriptions during testing:

📍 Go to: **Stripe Dashboard → Customers**

Find your test customer, click into their details.

**Cancel the subscription:**
1. Click on the subscription
2. Click **"Actions" → "Cancel subscription"**
3. Select "Cancel immediately"
4. Confirm cancellation

💡 **This will trigger a `customer.subscription.deleted` webhook** - Your user's tier should revert to "free".

---

## Common Issues & Fixes

### ❌ Issue: Webhook returns 401 "Invalid signature"

**Cause:** Missing or incorrect `STRIPE_WEBHOOK_SECRET`

**Fix:**
1. Go to Stripe Dashboard → Webhooks → Your Endpoint
2. Reveal the signing secret (starts with `whsec_...`)
3. Make sure you copied the **LIVE mode** webhook secret (not test mode)
4. Update: `wrangler secret put STRIPE_WEBHOOK_SECRET`
5. Paste the correct `whsec_...` value
6. Send test webhook again from Stripe dashboard

---

### ❌ Issue: Webhook returns 500 error

**Cause:** Code error in webhook handler or missing environment variables

**Fix:**
1. Run `wrangler tail` to see live logs
2. Send test webhook from Stripe
3. Check error message in logs
4. Common causes:
   - Missing `CLERK_SECRET_KEY` or `STRIPE_SECRET_KEY`
   - Invalid Price ID in `STRIPE_PRICE_ID_PRO`
   - Missing Stripe product metadata

---

### ❌ Issue: User pays but tier doesn't update

**Cause:** Webhook succeeded but Clerk metadata wasn't updated

**Fix:**
1. Check Stripe webhook logs - Verify status is 200 OK
2. Check Clerk user metadata - Does it show the new plan?
3. If webhook succeeded but Clerk wasn't updated:
   - Verify `CLERK_SECRET_KEY` is the **live mode** key (starts with `sk_live_`)
   - Check worker logs for Clerk API errors
4. If Clerk metadata is correct but dashboard still shows old tier:
   - Force JWT refresh: Sign out and sign back in
   - Check JWT template includes `plan` claim

---

### ❌ Issue: Stripe product metadata is wrong

**Symptom:** Webhook processes but assigns wrong tier

**Cause:** Product metadata doesn't match tier name in code

**Fix:**
1. Go to Stripe Dashboard → Products → [Your Product]
2. Scroll to **Metadata** section
3. Verify: `{ "plan": "pro" }` (or your tier name)
4. Must be:
   - **Lowercase** (`pro` not `Pro`)
   - **Exact match** to tier name in `TIER_CONFIG` in your code
   - **Key is "plan"** (not "tier" or anything else)

---

### ❌ Issue: Checkout redirects to Stripe but shows error

**Cause:** Using test mode Price IDs with live mode keys (or vice versa)

**Fix:**
1. Verify you're in Stripe live mode (no test banner)
2. Verify you updated `STRIPE_PRICE_ID_PRO` with **live** Price ID
3. Live Price IDs start with `price_` but are different from test IDs
4. Run: `wrangler secret list` - Verify all secrets are set
5. Update: `wrangler secret put STRIPE_PRICE_ID_PRO` with correct live ID

---

### ❌ Issue: "No such price" error in Stripe

**Cause:** Price ID is from test mode but you're in live mode

**Fix:**
1. Go to Stripe Dashboard → Products (make sure in live mode)
2. Find your product → Copy the **live** Price ID
3. Update: `wrangler secret put STRIPE_PRICE_ID_PRO`
4. Paste the live Price ID
5. Try checkout again

---

### ❌ Issue: Multiple webhooks firing for same event

**Symptom:** User tier updates multiple times or you see duplicate logs

**Cause:** Multiple webhook endpoints configured (test + production)

**Fix:**
1. Go to Stripe Dashboard → Webhooks
2. Disable or delete the **test mode** webhook endpoint
3. Keep only the **live mode** webhook endpoint
4. Verify only one endpoint is "Enabled"

---

## Gotchas & Best Practices

### 🔥 Gotcha: Test vs Live Mode Keys

**The Problem:** Mixing test and live mode keys causes silent failures.

**What happens:**
- Test mode `sk_test_` key with live mode `price_` ID → Checkout fails
- Test mode webhook secret with live endpoint → 401 errors
- Live key with test Price ID → "No such price" error

**The Fix:**
- ✅ Always verify you're in the correct mode (test vs live)
- ✅ Update ALL secrets when switching modes
- ✅ Live keys start with `sk_live_`, `pk_live_`
- ✅ Test keys start with `sk_test_`, `pk_test_`

---

### 🔥 Gotcha: Stripe Product Metadata is Case-Sensitive

**The Problem:** Metadata `{ "plan": "Pro" }` doesn't match code tier `"pro"`

**What happens:**
- Webhook processes successfully (200 OK)
- User tier doesn't update (stays on free)
- No error shown in logs

**The Fix:**
- ✅ Always use **lowercase** tier names in Stripe metadata
- ✅ Match exactly: `{ "plan": "pro" }` not `{ "plan": "Pro" }`
- ✅ Double-check every product's metadata after creating in live mode

---

### 🔥 Gotcha: JWT Doesn't Refresh Immediately

**The Problem:** User upgrades but dashboard still shows "Free" tier.

**What happens:**
- Webhook succeeded and updated Clerk metadata
- But user's JWT still has old `plan: "free"` claim
- JWT doesn't refresh until expiration (default: 1 hour)

**The Fix:**
- ✅ Force JWT refresh: Sign out and sign back in
- ✅ Or refresh the page a few times (Clerk refreshes tokens periodically)
- ✅ Or reduce JWT expiration time in Clerk settings (not recommended for production)

---

### 🔥 Gotcha: Webhook Signature Verification

**The Problem:** Webhooks fail with "Invalid signature" after deployment.

**What happens:**
- Stripe sends webhooks but your API rejects them
- Upgrades complete in Stripe but users stay on free tier

**The Fix:**
- ✅ Make sure you set `STRIPE_WEBHOOK_SECRET` for production
- ✅ Secret must be from the **live mode webhook endpoint** (not test mode)
- ✅ Verify: `wrangler secret list` shows STRIPE_WEBHOOK_SECRET
- ✅ Test: Send test webhook from Stripe dashboard → Should return 200 OK

---

### ✅ Best Practice: Test in Live Mode Before Launch

**Do this:**
1. Create a 100% off coupon in Stripe
2. Complete a real checkout using the coupon
3. Verify tier updates correctly
4. Verify usage limits enforce
5. Verify customer portal works
6. Cancel the subscription
7. Verify tier reverts to free

**Why:** Catches issues before real users encounter them.

---

### ✅ Best Practice: Monitor Webhook Failures

**Set up alerts:**
- Stripe Dashboard → Settings → Notifications
- Enable "Webhook endpoint failures" notifications
- You'll get emailed if webhooks fail repeatedly

**Why:** You'll know immediately if subscription updates are failing.

---

### ✅ Best Practice: Keep Test Mode Products Synced

**Do this:**
- When you update pricing in live mode, update test mode too
- Keep tier names consistent across modes
- Test changes in test mode before applying to live

**Why:** Easier to test locally and catch issues before production.

---

## Verification Checklist

Before considering deployment complete, verify:

### ✅ Stripe Live Mode Setup
- [ ] Stripe toggled to Live Mode (no test banner)
- [ ] All paid tier products recreated in live mode
- [ ] Each product has correct metadata: `{ "plan": "pro" }`
- [ ] All live Price IDs copied

### ✅ Environment Variables Updated
- [ ] `STRIPE_SECRET_KEY` set to `sk_live_...`
- [ ] `STRIPE_PRICE_ID_PRO` set to live Price ID
- [ ] `STRIPE_PRICE_ID_ENTERPRISE` set to live Price ID (if applicable)
- [ ] `STRIPE_WEBHOOK_SECRET` set to live webhook secret
- [ ] Run `wrangler secret list` - All secrets present

### ✅ Webhook Configuration
- [ ] Production webhook endpoint created in live mode
- [ ] Endpoint URL points to deployed worker: `https://your-worker.workers.dev/webhook/stripe`
- [ ] 4 events selected: checkout.session.completed, customer.subscription.*
- [ ] Test webhook returns 200 OK
- [ ] Webhook logs show successful deliveries

### ✅ End-to-End Testing
- [ ] Test user can sign up
- [ ] Test user can click "Upgrade"
- [ ] Stripe Checkout loads correctly
- [ ] After payment, user tier updates in dashboard
- [ ] Usage limits match new tier
- [ ] Customer portal accessible and functional
- [ ] Subscription cancellation reverts tier to free

---

## Next Steps

✅ **Production webhooks configured!**

**Your subscription system is now live:**
- Users can upgrade and Stripe will notify your API
- Tiers update automatically via webhooks
- Customer portal lets users manage subscriptions

**Next:**
- Deploy your frontend to Cloudflare Pages
- Test the full flow end-to-end with real users
- Monitor webhook logs and worker performance

---

## Need Help?

- 📖 [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- 🔐 [Webhook Signature Verification](https://stripe.com/docs/webhooks/signatures)
- 🐛 [FAQ & Troubleshooting](../faq.md)
- 💬 [Stripe Support](https://support.stripe.com/)

---

**🎉 Your subscription billing is live!**

Stripe will now automatically sync tier changes to your API in real-time.
