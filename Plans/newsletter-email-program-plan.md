# Newsletter & Lifecycle Email Program — r-statistics.co

> **STATUS (updated 2026-06-12)** — approved plan, in progress.
>
> | Phase | What | Status |
> |---|---|---|
> | Quick-win 0 | Admin "new signup" email to selva86@gmail.com | ✅ **DONE & LIVE** (merge `7defdb15b`; `flag:signup-admin-email`=on; confirmed working). Code: `functions/_lib/notify.ts`. |
> | Phase A | Foundation: consent sync, Zoho list + sender domain, subscribe + double-opt-in, preference center, DMARC/SPF | ⏸️ **PAUSED — NEXT UP.** Nothing built yet for Phase A. **Resume here** (see "▶ RESUME HERE" below). Sending is also **blocked on owner provisioning:** Zoho Campaigns API token + new list key + sender-domain DNS. |
> | Phase B | Flagship broadcast + welcome sequence (Zoho Campaigns) | ⏳ pending Phase A |
> | Phase C | Mini-course drip (Zoho autoresponder) | ⏳ pending |
> | Phase D | Lifecycle engine (D1-triggered, ZeptoMail, cron Worker + dedupe table) | ⏳ pending |
> | Phase E | Every-other-day opt-in micro-track | ⏳ pending |
>
> **Open decisions** (see end of doc): cadence architecture; newsletter name/voice; account-only vs public subscribe form; lifecycle cron approach (companion Worker vs GitHub-Actions).
>
> **Owner provisioning needed to unblock sending:** (1) Zoho Campaigns self-client API token [scopes `ZohoCampaigns.contact.ALL`+`campaign.ALL`] → `ZOHO_AUTH_TOKEN`; (2) NEW dedicated list "r-statistics.co platform" → its List Key → `ZOHO_LIST_KEY`; (3) add `r-statistics.co` as a Zoho sender domain (DKIM CNAME + SPF merge `include:zoho.com`). Set token+key as CF Pages secrets.
>
> Mirror of the working plan at `~/.claude/plans/rustling-singing-hummingbird.md`; cross-session memory: `project_newsletter_program`.
>
> ### ▶ RESUME HERE (next session)
> **Next concrete step = build the consent sync** (Phase A item A below). It's pure code, no Zoho dependency, and it makes the opt-ins we already ship actually set `users.newsletter_opt_in=1` in D1 (today they're stranded — the Supabase webhook ignores the `marketing_opt_in` metadata, and OAuth opt-ins sit only in `localStorage`). Steps:
> 1. New branch off master (e.g. `newsletter-consent-sync`).
> 2. `functions/_lib/db.ts`: add `recordNewsletterOptIn(db, userId, email, source)` — sets `users.newsletter_opt_in=1` + `newsletter_subscribed_at` (COALESCE; never downgrade), upserts `newsletter_subs` (`confirmed_at=now` for account signups, `source`). Never flip to 0 here (only an explicit unsubscribe does that).
> 3. `functions/api/webhooks/supabase.ts`: on first-processing INSERT/UPDATE, if `record.raw_user_meta_data.marketing_opt_in` truthy → call it (email/magic-link path).
> 4. `functions/api/me.ts`: in the lazy-create block, if `payload.user_metadata.marketing_opt_in` truthy → call it.
> 5. New `functions/api/newsletter/claim-optin.ts` (POST, authed via middleware `context.data.user`) → calls it for the current user (OAuth path).
> 6. `www/auth-hydrate.js`: after state-pro, if `localStorage['rs-marketing-optin']` has `opted_in:true` → POST `/api/newsletter/claim-optin`, then remove the key. (High-blast-radius file — keep minimal, guard tightly.)
> 7. Verify: typecheck (`tsc --noEmit` adds 0 errors vs baseline 27 pre-existing); since preview lacks Supabase secrets + webhooks point to prod, verify on prod by signing up (email + Google) with the box ticked, then `SELECT newsletter_opt_in FROM users` + `newsletter_subs` via `wrangler d1 execute r-stats-prod --remote`. Branch → merge.
>
> After consent sync: provisioning lands (Zoho token/list/sender-domain) → build `functions/_lib/zoho.ts` (Phase A item C) → then Phases B–E. Open decisions still pending (see end).

---

## Context

r-statistics.co is about to introduce **paid/premium content**. Before asking for money, the platform needs to bank trust and stay in constant, valuable contact with its audience of R/stats learners (students, academics, working data scientists — global, incl. EU). The owner wants email that is **essential and highly valuable** (never spammy), **frequent** (proposed: every other day), and that **builds brand/reputation/relationship** ahead of the premium launch.

**Inputs decided by owner:**
- **Audience = ONLY people who signed up on r-statistics.co (consented platform users), NOT the 62k legacy Zoho list.** Send only to our own opted-in account signups.
- Wants all four pillars; cadence "every other day"; voice personal but *not* using his name.
- Signup-notification signal = **confirmed signups only** (not raw INSERT).

---

## Strategic frame

Run **two streams**:
1. **Predictable broadcast(s)** people look forward to — brand/relationship layer (Zoho Campaigns).
2. **Behavior-triggered lifecycle emails** that fire only when relevant — retention layer, powered by D1 data (ZeptoMail). Our unfair advantage.

**Cadence:** small, fully-consented, engaged audience → high frequency is lower-risk but still dilutes value. **Recommended:** weekly flagship for all + an **opt-in "every-other-day R tip" micro-track** via the preference center for keen learners.

---

## Sender identity (personal, not named)

Named newsletter brand as From-name + warm first-person voice signed by the publication. From: `"<Newsletter name>" <newsletter@r-statistics.co>`. Name shortlist: **The Residual** *(recommended)*, First Difference, The R Companion, Vectorized, Degrees of Freedom, set.seed(). Decision needed before Phase B.

---

## The four pillars

1. **Flagship broadcast** (relationship core): original, value-dense, default weekly. "One R thing" / paste-and-run snippet / "gotcha of the week" + secondary new-content roundup. Zoho Campaigns editor, scheduled.
2. **Welcome sequence** (evergreen, Zoho autoresponder): 4–5 emails — best place to start, exercises+XP/streaks, free tools, certificate tracks (premium seed), how-to-get-the-most + expectations.
3. **Behavior-triggered lifecycle** (ZeptoMail, build-heavy): "60% through *[tutorial]*", "N-day streak", "2 exercises from *[track]* certificate", "first certificate earned", lapsed re-engagement.
4. **Structured mini-course** ("Learn R in N weeks", Zoho autoresponder): lead magnet + free→paid funnel.

Plus the **opt-in every-other-day micro-track** (short single-tip emails to a preference-center segment).

**Channel split:** marketing/editorial (broadcasts, welcome, mini-course, micro-track) → **Zoho Campaigns**; behavioral/transactional (lifecycle, magic links, receipts, certs) → **Zoho ZeptoMail**. Never mix.

---

## List, consent & segmentation
- Audience = D1 `users WHERE newsletter_opt_in = 1` (synced from the opt-in we shipped). 62k legacy list NOT used.
- **NEW dedicated Zoho Campaigns list** ("r-statistics.co platform") synced from D1; do not touch the 62k.
- Starts small, grows with signups. Optional growth lever: public double-opt-in `/newsletter.html` form feeding the same pool (decision pending).
- Double opt-in for any non-account subscribe path. Preference center: topic + frequency + native unsubscribe. Segments: skill level, engagement, free vs Pro.
- Canonical source of truth = D1 (`users.newsletter_opt_in` + `newsletter_subs`), mirrored to Zoho via API.

---

## Brand, reputation & deliverability
- Add `r-statistics.co` as a Zoho Campaigns sender domain → DKIM selector (likely `zoho._domainkey`, coexists with ZeptoMail's `2492047._domainkey`) + SPF merge `v=spf1 include:zeptomail.in include:zoho.com ~all` (ONE apex SPF record only).
- Finish DMARC tightening (p=none → quarantine → reject) and SPF `~all → -all`.
- Privacy policy/ToS: add Zoho Campaigns as a subprocessor.

---

## Premium funnel
Give relentlessly via the free newsletter → identify most-engaged segment → founding-member rate first → skills/cert-data-driven relevant upgrade asks. Free newsletter stays excellent; premium = deeper/structured. No dark patterns.

---

## Technical implementation (grounded in existing code)

**Reuse:** `functions/_lib/email.ts` (`sendMail` + `emailShell`); `functions/_lib/db.ts` (`listReadingProgress`, `getStats`, `getSolvedByHub`, `listCertificates`); `functions/_lib/tracks.ts` (`computeTrackProgress`); KV flags; schema `newsletter_subs` + `users.newsletter_opt_in`/`newsletter_subscribed_at` (present, unused).

**A. Consent sync** (⏸️ NOT STARTED — this is the resume point; see "▶ RESUME HERE" at top): extend `webhooks/supabase.ts` + a `db.ts` helper to read `raw_user_meta_data.marketing_opt_in` → set `users.newsletter_opt_in` + `newsletter_subscribed_at` + upsert `newsletter_subs`; `/api/me` lazy-create also syncs; OAuth path (localStorage `rs-marketing-optin`) via a post-auth `/api/newsletter/claim-optin` call.

**B. Subscribe + double opt-in** (public): `api/newsletter/subscribe.ts` (insert `confirmed_at=NULL`, send confirm email) + `api/newsletter/confirm.ts` (set `confirmed_at`, sync to Zoho). Public form behind `flag:newsletter`.

**C. D1 ↔ Zoho sync:** `functions/_lib/zoho.ts` (Contacts API, `ZOHO_AUTH_TOKEN`+`ZOHO_LIST_KEY`); `api/webhooks/zoho.ts` for bounce/unsubscribe → D1.

**D. Lifecycle engine:** new `lifecycle_email_sends` dedupe table; companion **Cloudflare cron Worker** (Pages Functions can't cron) bound to same D1/KV; sends via `emailShell`, gated by `flag:lifecycle`; per-user frequency cap.

---

## Risks, conflicts & edge cases (from pre-build review)
- **Unified suppression:** Zoho unsubscribe MUST write back to D1 `newsletter_opt_in=0` (Zoho unsub webhook) so ZeptoMail lifecycle also stops; lifecycle templates need their OWN unsubscribe link.
- **Lifecycle dedup granularity:** `trigger_type` encodes specifics (`resume:<slug>`, `streak:5`, `cert-near:<track>`); recurring triggers need a cooldown window, not permanent UNIQUE. Global per-user frequency cap so streams don't stack same-day.
- **DMARC sequencing:** verify new Zoho sender DKIM/SPF + a passing Campaigns test send BEFORE `p=reject`. Watch SPF 10-lookup limit.
- **No double opt-in for account signups** (already email-verified + explicit tick).
- **Consent-sync coverage:** OAuth opt-ins live only in localStorage → need the claim call; lazy-create fallback must also sync.
- **Recapture missed opt-in (most OAuth users skip the box):** re-ask IN-APP only (never email for consent). (A) one-time post-signup card + (B) `/account` toggle + (C) value-moment nudge + (D) optional signed-in toast. Don't pre-tick/clutter the sign-in page.
- **Cron deploy target:** lifecycle Worker is a standalone `wrangler deploy` (not the Pages auto-build) — operational overhead vs. GitHub-Actions alternative.
- **Admin-email volume:** one per signup fine now; daily digest if volume climbs.

## Verification
- **Deliverability:** mail-tester.com (target 10/10); DKIM/SPF/DMARC = pass; watch DMARC reports before each tightening step.
- **Consent sync:** signup (email + Google) with box ticked → `users.newsletter_opt_in=1` + `newsletter_subs` row via `wrangler d1 execute r-stats-prod --remote`.
- **Double opt-in:** `confirmed_at` set only after the email link click; Zoho contact appears.
- **Lifecycle:** seed a test user past a threshold, run cron, assert one send + dedupe row + no duplicate on re-run; flag off → no sends.
- All UI/template changes go through branch → CF preview before master.

## Open decisions
1. Cadence: weekly + opt-in every-other-day micro-track (recommended) vs every-other-day for all.
2. Newsletter name + voice (recommended: **The Residual**).
3. Audience growth: account-signups only vs. also a public double-opt-in form.
4. Lifecycle cron: companion Cloudflare Worker (recommended) vs external GitHub-Actions cron.
