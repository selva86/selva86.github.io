# BUILD-PHASE-0 — Walkthrough

This is the one-time provisioning checklist that bridges "mocks signed off" and "Phase 1 ready". Once complete, every future change is `git push`. Plan to spend ~90 minutes end-to-end (most of it is waiting for approval emails).

Decisions baked into this checklist:
- **wrangler CLI** path (you confirmed).
- **Giscus** for v1 comments (deferred from schema).
- **`mail.r-statistics.co`** for transactional sender domain.
- **functions/** directory for CF Pages Functions (CF convention, deviation from plan's `_app/`).

---

## 0. Prereqs (one-time, ~5 min)

```bash
# Node 20+ required by wrangler
node --version

# Install wrangler globally so all wrangler commands work anywhere
npm install -g wrangler@latest pagefind@latest

# Verify
wrangler --version    # should be 3.99+
pagefind --version    # should be 1.1+
```

`npm install` (no -g) inside the repo will use the versions pinned in `package.json` — equivalent for project-scoped installs.

---

## 1. Cloudflare account + DNS

1. Sign up at https://dash.cloudflare.com if you don't already have an account.
2. Add `r-statistics.co` as a zone (Add Site, Free plan).
3. Update nameservers at your domain registrar to the two Cloudflare nameservers shown. **24-48 h propagation; the GH Pages site keeps working throughout** since the DNS records you copy in will continue pointing at GH Pages.
4. While the zone is pending, copy your **Account ID** (Account Home, right rail).
5. Add Workers Paid at $5/mo (Workers & Pages > Plans > Workers Paid). Buys 10M requests/mo + higher CPU + Browser Rendering headroom for cert PDFs later.

---

## 2. Authenticate wrangler

```bash
wrangler login
# opens browser for OAuth; pick the account from step 1
wrangler whoami        # confirms login + lists account IDs
```

---

## 3. Provision D1, KV, R2 (paste the IDs into wrangler.toml as you go)

Each command prints an ID. Paste it into `wrangler.toml` where `REPLACE_AFTER_WRANGLER_*` placeholders sit.

### D1 (two databases — prod and dev)

```bash
wrangler d1 create r-stats-prod
#  database_id = "abc123..."  <-- paste into wrangler.toml [[d1_databases]] (top section)

wrangler d1 create r-stats-dev
#  database_id = "def456..."  <-- paste into wrangler.toml [[env.dev.d1_databases]]
```

### KV (two namespaces)

```bash
wrangler kv namespace create r-stats-cache
#  id = "ghi789..."  <-- wrangler.toml [[kv_namespaces]]

wrangler kv namespace create r-stats-cache-dev
#  id = "jkl012..."  <-- wrangler.toml [[env.dev.kv_namespaces]]
```

### R2 (4 buckets per environment = 8 total)

**bash / macOS / Linux:**
```bash
for b in certs avatars exports course-media; do
  wrangler r2 bucket create r-stats-$b
  wrangler r2 bucket create r-stats-$b-dev
done
```

**PowerShell (Windows):**
```powershell
foreach ($b in 'certs','avatars','exports','course-media') {
  wrangler r2 bucket create "r-stats-$b"
  wrangler r2 bucket create "r-stats-$b-dev"
}
```

No ID to paste — wrangler.toml binds buckets by name. Confirm with `wrangler r2 bucket list`.

### Apply schema (both environments)

```bash
wrangler d1 execute r-stats-dev  --remote --file schema.sql
wrangler d1 execute r-stats-prod --remote --file schema.sql
```

Re-runnable. The schema uses `IF NOT EXISTS`.

---

## 4. Supabase project (Auth + nothing else)

1. https://supabase.com -> New Project. Region: pick the one closest to your largest user share (EU Frankfurt or US East are usually right for global English audiences).
2. Wait ~2 min for provisioning.
3. Project Settings -> API -> copy:
   - Project URL -> `SUPABASE_URL`
   - `anon` public key -> `SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (treat as a secret; never ship to the client)
4. Project Settings -> API -> JWT Settings:
   - **JWT signing algorithm: select `HS256`** (some new projects default to ECC P256; our edge verifier only supports HS256 for v1; ECC support adds JWKS fetching and is not yet shipped).
   - Copy JWT Secret -> `SUPABASE_JWT_SECRET`
5. Authentication -> Providers:
   - Email: Enable (magic link mode, no password required if you want passwordless-only)
   - Google: Enable, paste your Google OAuth client ID + secret (you create those at https://console.cloud.google.com/apis/credentials)
   - GitHub: Enable, paste your GitHub OAuth app credentials (https://github.com/settings/developers)
6. Authentication -> URL Configuration -> Site URL = `https://r-statistics.co`. Add `http://localhost:8788` and the CF Pages preview URL (`https://*.pages.dev`) to Redirect URLs.
7. Authentication -> Email Templates -> tweak from-name + branding (later, not blocking).

---

## 5. Paddle (Merchant of Record for non-India)

1. https://paddle.com -> Sign up. Pick "Paddle Billing" (NOT the legacy "Paddle Classic").
2. Submit business info. Approval is 1-3 days; you can do other steps while waiting.
3. After approval:
   - Developer Tools -> Authentication -> create API key -> `PADDLE_API_KEY`
   - Developer Tools -> Notifications -> Create destination -> URL `https://r-statistics.co/api/webhooks/paddle` -> subscribe to events: `subscription.activated`, `subscription.canceled`, `subscription.payment_succeeded`, `subscription.payment_failed`, `subscription.trial_will_end`, `transaction.refunded` -> copy notification secret -> `PADDLE_WEBHOOK_SECRET`
4. Catalog -> create three products: Pro Monthly, Pro Annual, Lifetime. Pricing per plan.

---

## 6. Razorpay (Indian customers)

1. If you already have Razorpay for the business: skip to step 3.
2. https://razorpay.com -> KYC -> upload PAN + GST cert (1-3 days).
3. Settings -> API Keys -> Generate Live Keys -> `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
4. Settings -> Webhooks -> Add `https://r-statistics.co/api/webhooks/razorpay` -> subscribe to `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.halted` -> copy secret -> `RAZORPAY_WEBHOOK_SECRET`
5. Subscriptions -> Plans -> create matching plans (must align with Paddle plan names so internal routing is symmetric).

---

## 7. Resend (transactional email only)

1. https://resend.com -> Sign up.
2. Domains -> Add `mail.r-statistics.co`.
3. Add the 4 DNS records Resend shows (SPF, DKIM x2, DMARC) to Cloudflare DNS for the `r-statistics.co` zone. DMARC starts at `p=none` for 2 weeks then move to `p=reject`.
4. API Keys -> Create -> `RESEND_API_KEY`.

The 62k newsletter list stays on Zoho. Resend is only for magic links, receipts, dunning, cert "your cert is ready" emails.

---

## 8. Zoho Campaigns API token (existing account)

1. Zoho Campaigns dashboard -> Settings -> Developer Space -> API -> Generate self-client token.
2. Scope: `ZohoCampaigns.contact.ALL` and `ZohoCampaigns.campaign.ALL` are enough.
3. Copy token -> `ZOHO_AUTH_TOKEN`.
4. List Management -> find your main 62k list -> copy the List Key -> `ZOHO_LIST_KEY`.

No DNS work needed; sender reputation transfers automatically.

---

## 9. Sentry

1. https://sentry.io -> New project -> Platform: Cloudflare Workers.
2. Copy DSN -> `SENTRY_DSN`.

---

## 10. Set all secrets in CF Pages

The CF Pages project must exist first. Connect the GH repo:

1. CF dashboard -> Workers & Pages -> Create application -> Pages -> Connect to Git -> pick `selva86/selva86.github.io`.
2. Project name: `r-statistics-co`. Production branch: `master`.
3. Build settings:
   - Framework preset: None
   - Build command: `python _build/build_with_pagefind.py`
   - Build output directory: `.` (a single dot — repo root)
4. Click Save and Deploy. First build will fail on missing secrets (expected). Continue:

**bash / macOS / Linux:**
```bash
# Set each secret (interactive prompt for the value)
for s in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_JWT_SECRET \
         PADDLE_API_KEY PADDLE_WEBHOOK_SECRET \
         RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET \
         ZOHO_AUTH_TOKEN ZOHO_LIST_KEY \
         RESEND_API_KEY SENTRY_DSN; do
  wrangler pages secret put $s --project-name r-statistics-co
done
```

**PowerShell (Windows):**
```powershell
$secrets = @(
  'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_JWT_SECRET',
  'PADDLE_API_KEY','PADDLE_WEBHOOK_SECRET',
  'RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET',
  'ZOHO_AUTH_TOKEN','ZOHO_LIST_KEY',
  'RESEND_API_KEY','SENTRY_DSN'
)
foreach ($s in $secrets) {
  wrangler pages secret put $s --project-name r-statistics-co
}
```

Each prompt: paste the value from steps 4-9. They are encrypted at rest and only readable by your Functions at runtime.

For dev environment secrets (same names, different values), repeat with `--env dev`.

---

## 11. First real deploy

```bash
git add wrangler.toml schema.sql functions/ package.json tsconfig.json BUILD-PHASE-0.md _build/build_with_pagefind.py .dev.vars.example
git commit -m "live: phase 0 scaffolding (wrangler, schema, functions, build pipeline)"
git push origin master
```

CF Pages detects the push, runs the build, and deploys. Watch in Workers & Pages -> r-statistics-co -> Deployments.

When green: test the smoke endpoint:

```bash
curl https://r-statistics-co.pages.dev/api/health
# expected: {"ok":true,"db":"ok","kv":"ok","env":"production","time":"..."}

curl https://r-statistics-co.pages.dev/api/me
# expected: {"user":null,"pro":false}    (unsigned)
```

If `db` or `kv` show errors, the binding IDs in `wrangler.toml` don't match the resources you provisioned. Re-check step 3.

---

## 12. Local dev loop

```bash
# Copy env template, fill with dev-environment values
cp .dev.vars.example .dev.vars

# Run the same stack locally on port 8788
wrangler pages dev . --port 8788

# In another terminal:
curl http://localhost:8788/api/health
```

`.dev.vars` is gitignored. Never commit it. Production secrets stay in CF (step 10).

---

## 13. DNS cutover (later, when Phase 7 ships)

Do NOT cut over now. The current site keeps serving from GH Pages until you've validated auth + payments + certs end-to-end behind `r-statistics-co.pages.dev`. Cutover plan lives in `r-statistics-live-plan.md` Section 9 Phase 8.

When ready:
1. CF DNS -> CNAME `@` -> `r-statistics-co.pages.dev` (proxied, orange cloud on)
2. Verify in incognito within 5 minutes; revert by pointing CNAME back to `selva86.github.io` if anything breaks
3. Keep GH Pages repo identical to the deployed master for 30 days as a hot rollback

---

## 14. Done when

- [ ] `curl https://r-statistics-co.pages.dev/api/health` returns `{ok:true}`
- [ ] `curl https://r-statistics-co.pages.dev/api/me` returns `{user:null,pro:false}`
- [ ] Both D1 databases have all tables (`wrangler d1 execute r-stats-prod --remote --command ".tables"`)
- [ ] All 4 R2 buckets exist in both prod and dev
- [ ] KV namespace exists in both envs
- [ ] All 13 secrets set in Pages project
- [ ] Sentry project receives at least one test event
- [ ] You've manually issued an OAuth signin to Supabase + verified the JWT verifies at edge

At that point, Phase 1 (auth + identity wiring) is unblocked.

---

## What I scaffolded for you

| File | Purpose |
|---|---|
| `wrangler.toml` | CF Pages binding config; D1/KV/R2 wiring, dev/prod env split |
| `schema.sql` | Full D1 schema (Section 7 of plan); idempotent; v1 omits `comments` (Giscus) |
| `functions/_middleware.ts` | Runs on every request; verifies JWT, attaches user to `context.data` |
| `functions/_lib/auth.ts` | Edge JWT verify (HS256, Web Crypto, no Node deps) |
| `functions/_lib/db.ts` | D1 helpers + `User` type; `isProActive` gate |
| `functions/_lib/flags.ts` | KV-backed feature flags (`flag:<name>` keys) |
| `functions/_lib/errors.ts` | JSON response + error helpers (401/402/403/404/409/429/500) |
| `functions/api/health.ts` | Smoke endpoint (DB + KV ping) |
| `functions/api/me.ts` | First real endpoint: returns user + Pro state |
| `_build/build_with_pagefind.py` | Build pipeline = static build + tools sitemap + Pagefind index |
| `package.json` | wrangler + pagefind + TS pinned versions; scripts for build / dev / schema |
| `tsconfig.json` | Strict TS targeting Workers runtime |
| `.dev.vars.example` | Template for local secrets (`.dev.vars` is gitignored) |
