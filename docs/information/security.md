# Security Guide

**TL;DR:** Small attack surface. No servers to hack. Edge deployment with built-in DDoS protection, rate limiting, and enterprise-grade security features - all included for free.

---

## The Security Advantage of Edge Architecture

### Small Attack Surface = Fewer Vulnerabilities

Traditional SaaS stacks expose massive attack surfaces:
- **Database servers** - SQL injection, unauthorized access, backup breaches
- **Application servers** - SSH access, OS vulnerabilities, privilege escalation
- **Redis/cache servers** - Memory dumps, unauthorized access
- **Load balancers** - Configuration errors, certificate issues
- **VPCs and networking** - Firewall misconfigurations, exposed ports

**This template?**
- ❌ **No servers to SSH into** - No shell access means no brute force attacks
- ❌ **No database to SQL inject** - Auth/billing data lives in Clerk/Stripe (managed services)
- ❌ **No persistent connections** - Every request is stateless and isolated
- ❌ **No open ports** - Everything runs through Cloudflare's edge (HTTPS only)
- ✅ **Minimal footprint** - Just your code running on Cloudflare's hardened infrastructure

**Why this matters:**

When you deploy to Cloudflare Workers, you're not managing servers. You can't SSH into anything. There's no `/etc/passwd` to leak. No database credentials in environment files on a server. No Redis instances to exploit.

**Your attack surface is:**
- Your Worker code (TypeScript, reviewed, version-controlled)
- Your secrets (encrypted, write-only in Cloudflare dashboard)
- Your JWT validation logic (using Clerk's battle-tested SDK)

**That's it.**

Compare that to a traditional stack where you're managing:
- Server OS patches
- Database security updates
- Redis vulnerability fixes
- Load balancer SSL certificates
- VPC firewall rules
- SSH key management
- Docker container vulnerabilities

**You avoid all of that.**

---

## Built-In Security Features

This template includes production-grade security from day one.

### 1. JWT Verification on Every Request

**What it does:**
- Every API request must include a valid JWT from Clerk
- JWT signature is verified using Clerk's public keys
- Expired tokens are automatically rejected
- Forged or tampered tokens fail validation

**Code location:** `api/src/index.ts` (~line 200)

```typescript
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const payload = await verifyToken(token, {
  secretKey: env.CLERK_SECRET_KEY
});
```

**What this prevents:**
- ❌ Unauthorized API access
- ❌ Session hijacking (JWT is short-lived, 1 hour default)
- ❌ Token forgery (cryptographically signed)

---

### 2. Stripe Webhook Signature Verification

**What it does:**
- Every webhook from Stripe includes a signature header
- Signature is verified using your webhook secret
- Prevents replay attacks with timestamp validation

**Code location:** `api/src/stripe-webhook.ts` (~line 50)

```typescript
const signature = request.headers.get('stripe-signature');
const event = await stripe.webhooks.constructEvent(
  body,
  signature,
  env.STRIPE_WEBHOOK_SECRET
);
```

**What this prevents:**
- ❌ Fake webhook requests (can't forge Stripe's signature)
- ❌ Replay attacks (timestamp validation)
- ❌ Man-in-the-middle tampering

**Why this matters:**
Without webhook verification, an attacker could send fake "subscription created" events and upgrade themselves to Pro for free.

---

### 3. Idempotency Keys for Webhooks

**What it does:**
- Each webhook event has a unique ID
- Events are processed only once (tracked in KV)
- Duplicate events are silently ignored

**Code location:** `api/src/stripe-webhook.ts` (~line 80)

```typescript
const processed = await env.USAGE_KV.get(`webhook:${event.id}`);
if (processed) {
  return new Response('Already processed', { status: 200 });
}
```

**What this prevents:**
- ❌ Double-charging users (if webhook fires twice)
- ❌ Double-upgrading tiers
- ❌ Race conditions in subscription updates

---

### 4. Rate Limiting (100 requests/minute per user)

**What it does:**
- Tracks requests per user per minute in KV
- Blocks requests exceeding 100/minute
- Returns 429 Too Many Requests with retry-after header

**Code location:** `api/src/index.ts` (~line 300)

**What this prevents:**
- ❌ API abuse (scrapers, bots)
- ❌ DDoS attempts from authenticated users
- ❌ Accidental infinite loops in client code

**Future enhancement:**
You can add IP-based rate limiting on top of user-based limits using Cloudflare's Rate Limiting rules (see Cloudflare features section below).

---

### 5. Security Headers

**What it does:**
- Sets secure HTTP headers on every response
- Prevents common web vulnerabilities

**Headers included:**

```javascript
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

**What this prevents:**
- ❌ Cross-site scripting (XSS) attacks
- ❌ Clickjacking (embedding your site in iframes)
- ❌ MIME-type sniffing attacks
- ❌ Downgrade attacks (HSTS forces HTTPS)

---

### 6. Dynamic CORS (No Wildcards)

**What it does:**
- Validates origin header against allowed list
- Only returns `Access-Control-Allow-Origin` for approved domains
- No wildcard `*` allowed

**Code location:** `api/src/index.ts` (~line 150)

**What this prevents:**
- ❌ Unauthorized domains calling your API from browsers
- ❌ CSRF attacks from malicious sites
- ❌ API key theft via XSS on unauthorized domains

**Configuration:**
Set `ALLOWED_ORIGINS` env variable:
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

### 7. User Data Isolation

**What it does:**
- All KV storage keys are prefixed with user ID
- One user cannot access another user's data
- No shared state between users

**Key format:**
```
usage:{userId}
rate-limit:{userId}:{timestamp}
```

**What this prevents:**
- ❌ Data leakage between users
- ❌ Unauthorized usage tracking manipulation
- ❌ Cross-user attacks

---

### 8. PCI Compliance via Stripe

**What it does:**
- All credit card data is handled by Stripe Checkout
- Your code never touches card numbers
- Stripe is PCI DSS Level 1 certified (highest level)

**What this prevents:**
- ❌ Credit card data breaches (you don't store cards)
- ❌ PCI compliance burden (Stripe handles it)
- ❌ Card skimming attacks (checkout is on Stripe's domain)

**Best practice:**
Never add custom payment forms that collect card numbers. Always redirect to Stripe Checkout or use Stripe Elements (which is PCI-compliant).

---

## Cloudflare's Free Security Features

Deploying to Cloudflare gives you enterprise-grade security for free. Here's what you get:

### 1. DDoS Protection (Always On)

**What it is:**
Cloudflare's network absorbs and mitigates DDoS attacks automatically. No configuration needed.

**How it works:**
- Cloudflare sees 46+ million requests per second across its network
- Uses machine learning to detect attack patterns
- Filters malicious traffic before it reaches your Worker
- Scales to handle attacks of any size (100+ Gbps)

**Cost:** **Free** (included on all plans)

**Attacks it stops:**
- ❌ Volumetric attacks (UDP floods, ICMP floods)
- ❌ Protocol attacks (SYN floods, Ping of Death)
- ❌ Application-layer attacks (HTTP floods)

**Why this matters:**
Traditional DDoS mitigation costs $500-5,000/month. Cloudflare includes it for free.

**Enable advanced DDoS:**
- Go to Cloudflare Dashboard → Security → DDoS
- Enable "HTTP DDoS Attack Protection" (free)
- Set sensitivity to High

---

### 2. Bot Fight Mode (Free Bot Detection)

**What it is:**
Automatically challenges and blocks bad bots (scrapers, credential stuffers, vulnerability scanners).

**How to enable:**
1. Go to Cloudflare Dashboard → Security → Bots
2. Enable **"Bot Fight Mode"** (free tier)
3. Select "Definitely automated" challenge level

**What it does:**
- Challenges suspicious bots with JavaScript challenges
- Blocks bots that fail challenges
- Allows good bots (Google, Bing crawlers) through

**Cost:** **Free**

**Use cases:**
- Prevent account enumeration attacks
- Stop credential stuffing (login attempts with stolen passwords)
- Block web scrapers stealing your pricing data

**Upgrade option:**
"Super Bot Fight Mode" ($20/mo) adds more aggressive detection and custom rules.

---

### 3. WAF (Web Application Firewall)

**What it is:**
Filters malicious HTTP requests using predefined rule sets (OWASP Top 10, SQL injection, XSS, etc.).

**Free tier includes:**
- Cloudflare Managed Ruleset (blocks known attack patterns)
- OWASP Core Ruleset (protects against OWASP Top 10)

**How to enable:**
1. Go to Security → WAF
2. Enable **"Cloudflare Managed Ruleset"** (free)
3. Set to "On" (or "Simulate" to test first)

**What it blocks:**
- ❌ SQL injection attempts
- ❌ Cross-site scripting (XSS)
- ❌ Remote code execution attempts
- ❌ Path traversal attacks (`../../../etc/passwd`)
- ❌ Log4j exploits, Shellshock, etc.

**Cost:** **Free** for basic rules

**Pro tip:**
Start with "Simulate" mode to see what would be blocked. Review logs, then switch to "On" to enforce.

---

### 4. IP Access Rules

**What it is:**
Allow or block specific IP addresses, countries, or ASNs (networks).

**How to configure:**
1. Go to Security → WAF → Tools
2. Add IP Access Rules

**Use cases:**

**Block by country:**
- Block traffic from high-risk countries
- Example: Block North Korea, Iran, etc. (if you don't have users there)

**Allow only specific IPs:**
- Whitelist your office IP for admin endpoints
- Block everyone else from accessing `/admin/*`

**Block specific IPs:**
- Block IPs you identify as malicious (from logs)

**Cost:** **Free** (5 rules on free plan, unlimited on paid)

**Example rule:**
```
IF country = "CN" AND path starts with "/api/admin"
THEN Challenge
```

---

### 5. Rate Limiting (Cloudflare-Level)

**What it is:**
Cloudflare's rate limiting (different from the in-app rate limiting we built).

**Free tier:**
- 10,000 requests free per month
- $0.05 per 10,000 requests after that

**How to configure:**
1. Go to Security → WAF → Rate limiting rules
2. Create rule: "If more than 100 requests/minute from same IP → Block"

**Use cases:**
- Protect login endpoints from brute force
- Limit API calls per IP (in addition to per-user limits)
- Block abusive crawlers

**Example rule:**
```
IF path = "/api/login"
AND requests > 10 in 1 minute
THEN Block for 10 minutes
```

**Why use this + built-in rate limiting:**
- Cloudflare's catches attacks before they reach your Worker (saves costs)
- Built-in catches authenticated users exceeding limits (saves KV writes)

---

### 6. Firewall Rules (Custom Logic)

**What it is:**
Create custom rules based on any request property (path, headers, cookies, etc.).

**Free tier:**
- 5 active rules

**How to configure:**
1. Go to Security → WAF → Firewall rules
2. Create custom rules

**Examples:**

**Block specific user agents:**
```
IF http.user_agent contains "curl"
THEN Block
```

**Require specific header:**
```
IF path starts with "/api/admin"
AND http.headers["X-Admin-Key"] != "secret123"
THEN Block
```

**Geo-block admin endpoints:**
```
IF path contains "/admin"
AND country not in {"US", "CA", "GB"}
THEN Challenge
```

**Cost:** **Free** (5 rules), $5/mo for 20 rules (Pro plan)

---

### 7. Access Policies (Zero Trust)

**What it is:**
Cloudflare Access lets you add authentication in front of ANY part of your app - no code changes needed.

**Free tier:**
- Up to 50 users free

**How it works:**
1. Go to Cloudflare Zero Trust → Access → Applications
2. Create application: "Admin Panel"
3. Set path: `yourdomain.com/admin/*`
4. Add authentication: Email OTP, Google SSO, GitHub SSO, etc.
5. Define who can access (specific emails, domains, groups)

**Use cases:**

**Protect admin endpoints:**
- Require Google SSO before accessing `/admin`
- No code changes - Cloudflare handles it

**Internal tools:**
- Protect staging environments
- Require company email to access

**Example policy:**
```
Path: /admin/*
Require: Email ends with @yourcompany.com
```

**Cost:** **Free** for up to 50 users

**Why this is amazing:**
You can add auth to ANY route without touching your code. Cloudflare sits in front and enforces it.

---

### 8. Page Rules (Redirects, Caching, Security)

**What it is:**
Apply specific settings to specific URL patterns.

**Free tier:**
- 3 page rules

**Security use cases:**

**Force HTTPS:**
```
URL: http://yourdomain.com/*
Setting: Always Use HTTPS
```

**Disable caching on sensitive endpoints:**
```
URL: yourdomain.com/api/checkout
Setting: Cache Level = Bypass
```

**Security level:**
```
URL: yourdomain.com/api/*
Setting: Security Level = High
```

**Cost:** **Free** (3 rules), $5/mo for 20 rules (Pro plan)

---

### 9. Email Routing (Prevent Email Spoofing)

**What it is:**
Free email forwarding + DMARC/SPF/DKIM setup to prevent email spoofing.

**How it helps security:**
- Prevents attackers from sending emails "from" your domain
- Configures SPF, DKIM, DMARC records automatically
- Catches phishing attempts impersonating your brand

**Cost:** **Free** (unlimited forwarding)

**Setup:**
1. Go to Email → Email Routing
2. Add your domain
3. Cloudflare auto-configures DNS records

**Why this matters:**
If attackers spoof `support@yourdomain.com`, users might give them login credentials. DMARC prevents this.

---

### 10. DNSSEC (DNS Security)

**What it is:**
Cryptographically signs your DNS records to prevent DNS hijacking.

**How to enable:**
1. Go to DNS → Settings
2. Enable **DNSSEC**

**What it prevents:**
- ❌ DNS cache poisoning (redirecting your domain to attacker's server)
- ❌ Man-in-the-middle attacks via DNS

**Cost:** **Free**

---

### 11. SSL/TLS (Automatic HTTPS)

**What you get for free:**
- Automatic SSL certificates
- Automatic renewal (no expiration)
- TLS 1.3 support (latest, most secure)
- Free wildcard certificates (`*.yourdomain.com`)

**Configuration:**
1. Go to SSL/TLS → Overview
2. Set to **"Full (strict)"** mode (most secure)

**What this prevents:**
- ❌ Man-in-the-middle attacks
- ❌ Data interception
- ❌ Certificate expiration issues

**Cost:** **Free** (would be $50-500/year elsewhere)

---

## Security Best Practices

### 1. Rotate API Keys Regularly

**What to rotate:**
- Clerk secret keys (every 90 days)
- Stripe secret keys (every 90 days)
- Webhook secrets (if compromised)

**How to rotate without downtime:**
1. Generate new key in service dashboard
2. Update Cloudflare secret: `wrangler secret put CLERK_SECRET_KEY`
3. Old key continues working (Clerk/Stripe support multiple keys)
4. Remove old key after 24 hours

---

### 2. Monitor Webhook Failures

**Why this matters:**
If webhooks fail silently, users can pay but not get upgraded.

**How to monitor:**
1. Stripe Dashboard → Webhooks → Your Endpoint → Logs tab
2. Set up alerts for failed webhooks
3. Check daily for unusual patterns

**Red flags:**
- 401 errors (signature verification failing)
- 500 errors (code bug in webhook handler)
- Timeouts (webhook handler taking too long)

---

### 3. Enable Cloudflare Analytics

**What to monitor:**
- Request volume spikes (potential DDoS)
- Error rate spikes (something broke)
- Unusual traffic sources (countries you don't serve)

**How to access:**
- Cloudflare Dashboard → Analytics → Traffic

**Set up alerts:**
- Notifications → Create alert
- Alert on: Requests > 10x normal, Errors > 5%

---

### 4. Review Cloudflare Security Events

**Where:**
- Security → Events

**What to look for:**
- WAF blocks (are legitimate requests being blocked?)
- Bot challenges (are real users being challenged?)
- Rate limit hits (who's hitting limits? Adjust thresholds?)

**Frequency:**
- Weekly in first month
- Monthly after that

---

### 5. Use Secrets, Not Environment Variables

**Bad:**
```toml
# wrangler.toml
[vars]
STRIPE_SECRET_KEY = "sk_live_abc123"  # ❌ NEVER DO THIS
```

**Good:**
```bash
wrangler secret put STRIPE_SECRET_KEY  # ✅ Encrypted, write-only
```

**Why:**
- Secrets are encrypted at rest
- Secrets can't be read via dashboard (write-only)
- Secrets aren't in Git
- Secrets aren't in logs

---

### 6. Test in Staging Before Production

**Create a staging environment:**
1. Deploy Worker with different name: `pan-api-staging`
2. Use test mode keys (Clerk + Stripe)
3. Test all flows before deploying to production

**What to test:**
- Sign up flow
- Upgrade flow
- Webhook processing
- Usage tracking
- Rate limiting

---

### 7. Keep Dependencies Updated

**What to update:**
- Clerk SDK (`@clerk/backend`)
- Stripe SDK (`stripe`)
- Wrangler (`wrangler`)

**How to check:**
```bash
cd api
npm outdated
```

**How to update:**
```bash
npm update
npm run deploy
```

**Frequency:**
- Check monthly
- Update when security patches released

---

## Incident Response

### If You Detect a Security Issue

**1. Assess severity:**
- **Critical:** User data leaked, unauthorized access
- **High:** Service disruption, payment issues
- **Medium:** Potential vulnerability, no active exploit
- **Low:** Non-security bug, edge case

**2. Immediate actions (Critical/High):**
- Rotate compromised API keys immediately
- Deploy fix via `wrangler deploy` (instant)
- Notify affected users (if data leaked)
- Document timeline and impact

**3. Post-incident:**
- Write postmortem
- Add monitoring to detect similar issues
- Update security practices

---

## Compliance & Certifications

### What Cloudflare Provides

**SOC 2 Type II:**
- Cloudflare is SOC 2 certified
- Your Workers run on SOC 2 infrastructure

**ISO 27001:**
- Cloudflare is ISO 27001 certified

**PCI DSS:**
- Stripe is PCI DSS Level 1 (you inherit this for payments)

**GDPR:**
- Cloudflare is GDPR-compliant
- Clerk is GDPR-compliant
- Stripe is GDPR-compliant

**Your responsibility:**
- Have a privacy policy
- Handle data deletion requests (delete user from Clerk)
- Don't store unnecessary PII in KV

---

## Security Checklist

Before going live, verify:

### ✅ Built-In Features
- [ ] JWT verification enabled (it's default in template)
- [ ] Webhook signature verification enabled (it's default)
- [ ] Rate limiting configured (100 req/min default)
- [ ] Security headers present (they're default)
- [ ] CORS configured (set ALLOWED_ORIGINS or allow all)

### ✅ Cloudflare Configuration
- [ ] DDoS protection enabled (auto-enabled)
- [ ] Bot Fight Mode enabled
- [ ] WAF rules enabled (Cloudflare Managed Ruleset)
- [ ] SSL set to "Full (strict)"
- [ ] DNSSEC enabled

### ✅ Secrets Management
- [ ] All secrets set via `wrangler secret put`
- [ ] No secrets in `wrangler.toml` or Git
- [ ] Secrets documented (what they are, where to get them)

### ✅ Monitoring
- [ ] Cloudflare Analytics enabled
- [ ] Stripe webhook logs reviewed
- [ ] Clerk dashboard checked for unusual activity
- [ ] Alerts configured for error rate spikes

### ✅ Testing
- [ ] Tested with invalid JWT (should reject)
- [ ] Tested with expired JWT (should reject)
- [ ] Tested rate limit (should block after 100 req/min)
- [ ] Tested webhook with fake signature (should reject)

---

## Further Reading

**Cloudflare Security Resources:**
- [Cloudflare DDoS Protection](https://www.cloudflare.com/ddos/)
- [Web Application Firewall](https://www.cloudflare.com/waf/)
- [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/)
- [Bot Management](https://www.cloudflare.com/products/bot-management/)

**Standards & Compliance:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [GDPR Overview](https://gdpr.eu/)

**APIs & SDKs:**
- [Clerk Security Docs](https://clerk.com/docs/security)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)

---

**🔒 Your SaaS is secure by design.**

Small attack surface + built-in hardening + Cloudflare's enterprise security = worry less, ship faster.
