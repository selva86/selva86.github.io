# Account pages + persona menu — wiring plan (F2)

Status: build. Verified against backend audit 2026-06-22. Scope = 3 new F2 account
pages + two account menus, wired to REAL endpoints only; aspirational mock features
honestly degraded (no fake data).

## Backend reality (audited)

REAL endpoints:
- `GET /api/me` -> {user{id,email,display_name,avatar_url,handle,total_xp,current_streak_days,created_at}, pro, pro_until}. No provider field.
- `GET /api/me/stats|tracks|certificates|reading|saved|exercises` — all live.
- `GET /api/me/sessions` -> {sessions[{session_id,device,created_at,last_seen_at,expires_at,current}]}
- `DELETE /api/me/sessions/[sid]` (revoke one) · `POST /api/me/sessions-revoke-all`
- `POST /api/cert/mint {track_id}` -> mint eligible cert (idempotent) · `/cert/[id]` public page · `/api/cert/[id]/badge.json`
- `POST /api/newsletter/claim-optin` — opt-IN only (no read, no unsubscribe)
- Sign out via `window.__auth.signOut()` (auth-hydrate).

DOES NOT EXIST (Phase 4 / deferred): subscription/payment/invoice/portal · profile update (display_name not PATCHable) · export-data · delete-account · 2FA · public profile (/u/handle) · LinkedIn auto-add · recruiter/availability · "profile views".

Rule: never render fake invoices/cards/scores. Degrade to honest copy + email support.

## Pages (all standalone root .html, F2 theme, share www/account.css + www/account.js)

Shared shell: F2 nav (brand + Roadmap/Tutorials/Exercises/Tools + auth slots) · left account-nav rail (Dashboard, My Certificates, Saved posts, Billing & plan, Account settings; current = .on) · content panel · F2 footer · scroll-progress. `body[data-acct]` = `settings|billing|certificates` drives account.js. All gated: 401 / user:null -> redirect `/signin.html?next=<self>`.

### 1. account.html — Account Settings (`data-acct=settings`)
- **Profile** (real, read-only v1): avatar initial, display_name, email. Note "Name and email come from your sign-in." (No PATCH endpoint — editable later.)
- **Active sessions** (REAL): list devices from `/api/me/sessions`; mark `current`; "Sign out this device" -> DELETE sessions/[sid]; "Sign out all other devices" -> POST sessions-revoke-all. Empty/one-device handled.
- **Sign out** (real).
- **Your data** (honest): Export + Delete -> "Email support" mailto (no API yet). Clearly framed, not fake buttons.
- OMIT v1: dark mode (F2 is light-only), newsletter toggle (opt-in only, no unsub -> can't honestly toggle), connected accounts (no provider data), 2FA (deferred), public profile, recruiter.

### 2. account-billing.html — Billing & Plan (`data-acct=billing`)
- **Plan card** from `/api/me` {pro, pro_until}:
  - Free: "Free plan" + what Pro unlocks (graded practice, all sections, projects, certificate) + primary CTA -> `/pricing.html`.
  - Pro: "Pro — active" + `pro_until` renewal date; manage/cancel -> mailto support (no processor portal yet).
- **Honest note**: self-service invoices + payment method arrive with the paid Program. No fake VISA/invoice table/switcher.
- Edge: pro_until null but pro true (comp/lifetime) -> "Active" no date.

### 3. account-certificates.html — My Certificates (`data-acct=certificates`)
- **Stat strip** (real): Earned = certs.length; In progress = tracks 0<pct<100; Avg score = mean(cert.score) (omit if none have score). Drop "profile views".
- **Earned grid** from `/api/me/certificates`: each card = track_name, score, issued date, verify_url. Actions: Share/View -> verify_url (the `/cert/<id>` page is the shareable+printable artifact); Add to LinkedIn -> `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=<track>&organizationName=r-statistics.co&certUrl=<verify_url>&certId=<public_id>`. No PDF button (no endpoint) — the cert page prints.
- **Claimable** from `/api/me/tracks` where `eligible && !minted`: "Claim your certificate" -> POST /api/cert/mint {track_id}; on success re-fetch + move to earned. Errors surfaced.
- **In progress** = tracks 0<pct<100 -> Continue -> role page (RM slug map). 
- **Empty state**: no certs -> "Finish a track to earn your first" + roadmap CTA.
- ts has no cert track (track:null) -> never appears as claimable; shown only via lessons (fine).

## Menus

### Guest persona menu (www/persona-menu.js — simplify, make always-on)
Remove flag gate (live, not preview). Remove: stat strip, lock glyphs, green dot, Reading-progress/XP/streak rows. Keep header "Browsing as guest". Rows (order): **Saved posts, My certificates, Dashboard** (leading icon, no lock) each -> `/signin.html?next=<dest>`. Footer CTA box: **Create free account** (primary) + **Sign in** + one-line nudge "Free account. Save posts, track progress, get certified." Circle button (user glyph) toggles. GA events kept.

### Signed-in menu (www/auth-hydrate.js — edit AUTH_USER_HTML items, bump to ?v=11)
Header (name/email) + keep XP + streak stat rows (real, Selva-requested). Items (order): **Dashboard** (/dashboard.html), **Saved posts** (/saved-posts.html), **My certificates** (/account-certificates.html), **Account settings** (/account.html), **Billing & plan** (/account-billing.html), sep, **Sign out**. No behavior change to sign-out/stats/token logic.

## Rollout / versioning
- Edit /www/auth-hydrate.js -> bump ?v=10->v=11 at every reference (template.html, F2 generator, dashboard.html, 3 account pages). Immutable cache: only v=11 pages get new menu; v=10 (un-rebuilt site) unaffected until merge rebuild. Safe.
- persona-menu.js -> ?v=2. Add persona-menu.js + auth-hydrate v=11 to template.html so the merge `build.py` rolls BOTH menus site-wide. On the branch (no full rebuild) only F2/account/dashboard pages show new menus — correct review surface.
- New menu links must all resolve BEFORE menu goes live -> build account-billing.html first. ✓ (others already exist).

## Edge cases / conflicts checked
- 401 vs user:null: account.js treats both as signed-out -> redirect. /api/me returns 200 user:null (not 401); the /me/* sub-calls 401 when anon -> either path redirects.
- Stale optimistic state-pro (auth-hydrate sets state-pro from localStorage token): if token invalid, /api/me corrects to anon; account.js independently redirects on its own fetch. No conflict.
- persona-menu replaces .auth-anon innerHTML; auth-hydrate only toggles .auth-anon visibility + fills .auth-user — no clobber (verified: setAuthState anon branch clears .auth-USER only).
- Title resolution for saved/reading reuses dashboard.js approach (RM.STOP_LINKS + RM2.links + sidebar.json).
- saved-posts.html stays IBM-Plex (not in scope) — account-nav links to it; minor theme jump, noted as follow-up.
- LinkedIn add-to-profile uses public verify_url only (no auth leak).
- Cert claim race: mint is idempotent (second call returns existing) — safe to double-click.
- No em-dashes anywhere (project rule).
