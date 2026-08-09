# Free-user onboarding, metering and email program

> **STATUS (2026-08-10):** approved direction; build not started. Decisions marked
> DECIDED are the owner's; boxes marked OWNER are open. Companion docs:
> `Plans/newsletter-email-program-plan.md` (broadcast stream, consent sync — Phase A
> item A is DONE there), `Plans/growth-playbook-2026.md` (the funnel this serves).
>
> Facts in this plan were measured on 2026-08-10, not assumed: 410 exercise hubs in
> the manifest = 267 lesson hubs + 143 standalone practice hubs; practice hub sizes
> 12 to 50, median 20; a 25-cap fully covers 121 of 143, 30 covers 131, 50 covers all.

---

## 1. The three signup gates, and the context capture that everything branches on

| Gate | Where it fires today | Signup motivation |
|---|---|---|
| Exercise | practice hubs (sign in to grade / keep XP) | wants to DO |
| Lesson | free interactive lessons, New-to-R + Data Analyst tracks | interrupted mid-lesson |
| Browsing | signin-nudge.js, 3rd page + 10s | wants the nudge gone / save reading |

**Enabler (build first, ~1 day): `signup_context`.** Two columns on `users`
(`signup_gate`, `signup_slug`) written once at first authenticated hydration. Source:
the `?next=` param the signin flow already carries, plus the nudge/gate that fired
(sessionStorage, same mechanism as intent-replay). Never overwritten. Every sequence
below branches on it.

## 2. Onboarding sequences, one per gate (Day 0-10)

Shared rules: sender ZeptoMail; one flag per sequence, default OFF; every send goes
through the dedupe + suppression gate (section 6); allowlist-only until launch.

### 2a. Exercise-gate

| # | When | Email |
|---|---|---|
| 1 | minutes | Welcome. ONE link: finish the exercise that gated them (deep link + replay). |
| 2 | +24h, inactive only | Same first win, reframed. Two minutes. |
| 3 | day 3 | Their track map + XP so far + free Foundations cert as the near prize. |
| 4 | day 7 | First recap: solved, XP, streak. Ends on the cert path. |

### 2b. Lesson-gate (New-to-R / Data Analyst)

| # | When | Email |
|---|---|---|
| 1 | minutes | "Pick up exactly where you left off": deep link to the gating lesson. DA signups: names the 30-day pass and its end date, plainly. |
| 2 | +24h branch | Finished lesson 1 -> track map, lesson 2 named. Not -> resume link, "8 minutes". |
| 3 | day 3 | Track map with position marked (35 lessons NR / DA arc), first quiz milestone named. |
| 4 | day 5-7 | NR: free Foundations certificate. DA: first section-quiz milestone. |
| 5 | day 10 | Recap. Zero-activity users get the win-back track instead, never this. |

### 2c. Browsing-gate (weakest motivation; reader identity first)

| # | When | Email |
|---|---|---|
| 1 | minutes | "Your reading list, saved": the 3 tutorials they read, linked. |
| 2 | +24h | The interactive twin of what they read, via `lesson-links.json`. One click, runnable. The reader-to-doer bridge IS the conversion event for this cohort. |
| 3+ | | Joins 2b at step 3 once they touch anything interactive; else a gentle weekly reading digest until they do. |

## 3. Behavioral, intent and conversion emails (ongoing)

**Milestones (event-triggered):** first hub completed · 3-day streak · streak-save
(active yesterday, not today, sent near their usual hour) · free cert earned (the one
moment upsell is a compliment: sample PAID cert rendered with their name) · cap-hit
(section 4) · pass-day triggers (section 5).

**Intent (event-triggered off `intent_signals`, which the site already writes):**

| Trigger | Response |
|---|---|
| Pro lesson wall hit | within ~1h: what is behind THAT wall, the guarantee, one-click checkout. |
| Pricing visit, no purchase | the comparison finished for them; founding-rate status with the REAL remaining count of 200. |
| +48h, once | one quiet follow-up. |
| +5d, once | founding-rate framing. Then permanent silence for that intent event. Three touches max, ever. |

**Conversion arc (day 10-21, engine-scheduled).** Audience: active in last 14 days,
>=1 intent signal or >=50 XP, not Pro. Four emails: what Pro actually is (wall on
practice + certificates, never content) / the certificate concretely (verify page,
LinkedIn badge, alumni) / founding rate with real count / last call, then the arc ends
permanently for that user.

**Post-sale:** fulfilment (BUILT, flag off) · week-1 concierge arc · paid-cert
LinkedIn prefill · verify-page-views notification · dormant 14/30 win-backs with
one-click resume · dormant 60 breakup (pause + one-click return) · renewal-30 usage
recap (BUILT as sweep; migrate into engine later).

## 4. Practice metering — DECIDED (owner, 2026-08-10): hybrid

**Displayed as "25 free exercises a month." Enforced as: count 25/month, started
hubs fully unlocked, 2-hub floor.** An attempt is ALLOWED if ANY of:

1. hub is a lesson hub (267 of 410; never counted, never gated)
2. user is Pro
3. this hub was already started this calendar month (started = unlocked completely;
   no mid-hub wall, ever)
4. monthly practice-hub attempts < 25 (may start new hubs)
5. distinct practice hubs started this month < 2 (the floor: one 50-exercise hub
   cannot consume the whole month)

- Anti-seeding guard (invisible to honest users): max 4 hub-STARTS per month
  (config), closing the 1-attempt-per-hub unlock-banking hole rules 3+4 open.
- Enforcement in `attempt.ts`; two queries against `exercise_attempts`; no new
  table. Lesson-hub set baked into the manifest at build time.
- Grandfathering: applies from feature launch; historical volume never counts.
- **Display (decided from the placement mocks):** layered composite —
  (a) hub-header chip, canonical, always visible: "N of 25 free this month",
  flipping to "This hub is unlocked, finish it all" on started hubs;
  (b) inline count on the grade feedback ONLY when <=5 remain;
  (c) exercises-index card badges (Unlocked / Counts toward your 25 / Limit
  reached) so cost is visible before entering a hub;
  (d) dashboard module: ring, reset date, unlocked-hub list.
  Copy rules: always "N of 25", always name the reset date, never a lock icon on
  a started hub. Mock: claude.ai/code/artifact/f07ced68-f1c6-42a5-80f5-9d860d0fc958
- Cap-hit email: once per month max.

## 5. The Data Analyst 30-day pass — DECIDED

- **Scope: DA track only. New-to-R stays permanently free** (beginner funnel + free
  Foundations cert live there).
- Clock: 30 days from account creation for new signups. Existing accounts: from
  feature launch, announced by email (a re-engagement event). Implementation:
  `pass_started_at` = `users.created_at` for post-launch accounts, else the launch
  constant; no new table.
- Enforcement: extend the existing pro-lesson middleware check — DA lesson allowed if
  Pro, OR within pass window, OR the lesson is positional-free (lesson 1 floor).
  Expiry reverts to the standard gate: preview-2-steps + wall, reading intact,
  indexed pages unaffected. Never zero.
- UI: countdown from day 1 — player-rail chip "Pass: N days left", roadmap banner,
  dashboard module. Springing it late is a trap; showing it early is the device.
- **Email arc (engine):**

| Day | Email |
|---|---|
| 0 | welcome names the pass and its end date (2b #1) |
| 21 | progress recap: "% through; here is the pace to finish" |
| 23 | one-week warning |
| 27 | the coupon, 72h validity (a weekend to act) |
| 30 | final hours |
| 31 | graceful landing: what stays free, coupon's last hours |

- Coupon — DECIDED (owner): **23% off**, Paddle discount, unique per user,
  genuinely one-time, 72h validity.
- Guardrail: the pass copy always says what remains free forever. The floor is the
  trust layer.

## 6. Infrastructure

**Lifecycle engine (the one core build; everything time-based depends on it):**
- Companion cron Worker (separate from Pages Functions, which have no cron). Runs
  hourly; each sequence step = a D1 query (audience) + a template + a send.
- `sent_emails` table: `(user_id, email_key, sent_at)`, UNIQUE(user_id, email_key).
  Nobody receives a step twice, ever. Event-triggered sends use it too.
- Suppression: one gate for all mail — `newsletter_opt_in`/`unsubscribed_at` (built
  June) + per-category preference later. A Campaigns unsubscribe must write back to
  D1 (webhook) so ZeptoMail lifecycle stops too. One suppression brain.
- Sunset policy: no opens across N sends -> drop to monthly digest -> silence.
- Send-time: v1 fixed sensible hour; v2 per-user active-hour from attempt/reading
  timestamps.

**Sending split — DECIDED:** ZeptoMail (live, 10k/mo free) for every per-user
sequence in this plan; Zoho Campaigns for the weekly broadcast only, pending owner
headroom check + DNS (DKIM selector, SPF merge into the one apex record).

**Schema:** `users.signup_gate`, `users.signup_slug`, `users.goal` (P1), `sent_emails`.
**Flags (all default off):** `welcome-email`, `lifecycle-engine`, `intent-emails`,
`exercise-meter`, `da-pass`, plus existing `fulfilment-email`, `renewal-reminder`.

## 7. Product onboarding (AMBOSS / Boot.dev bar) — phased

- **P1 (week 1): the 90-second first win.** Post-signup: one-screen goal picker
  (3 options) -> straight into a runnable moment chosen by gate + goal. Target: first
  XP within 90 seconds. First-session checklist: run code, earn XP, see your path.
- **P3 (week 2): visible progression.** Roadmap as the signed-in home; streak flame;
  weekly XP goal; the two meters (hubs left, pass days left). Mostly flipping the
  profile-v3 flags (daily set, freezes, recap, share cards are BUILT, flags off) on a
  branch preview and wiring the landing.
- **P2 (weeks 3-4): the study plan.** Goal + weekly hours -> dated plan ("finish DA by
  <date> at N hrs/wk"), dashboard module, calendar export, drives email cadence. The
  pass deadline becomes a plan, not a threat.
- **P4 (post-engine): the coach loop.** One next-best-action brain, expressed as an
  in-product card + its email echo; stuck-state detection (3 fails on one exercise ->
  hint + stepping stone); day-3 "stuck anywhere? just reply". Built ON the engine.

## 8. Build order

1. `signup_context` + `sent_emails` + suppression gate (days)
2. Bucket-1 event emails behind flags: welcome x3 gates, cert-earned, first-hub,
   intent #1, cap-hit (days, parallel with 1)
3. Metering (server enforcement + meter UI) — needs owner unit confirmation
4. DA pass (entitlement + countdown UI) — arc emails ride the engine
5. Lifecycle engine -> all scheduled steps (onboarding branches, streaks, conversion
   arc, pass arc, win-backs)
6. P1 -> P3 -> P2 -> P4
7. Later: stats-image artifact, one-tap goal picker, send-time v2, mastery-skip drip.
   AMP deferred indefinitely (deep-link fallback captures most value).

## 9. Metrics (all measurable in D1/GA4 today)

Activation: signup -> first XP same session (target: majority). Sequence health:
open/click per step, dedupe violations = 0. Meter: % of actives hitting the wall
monthly; wall -> pricing CTR. Pass: %% finishing >=50% of DA in 30 days; day-27
coupon redemption; pass -> Pro conversion. Guardrails: unsubscribe rate per sequence;
spam complaints ~0; sender reputation.

## 10. Decisions

1. Meter unit — DECIDED: the hybrid in section 4.
2. Coupon — DECIDED: 23% off, one-time, 72h.
3. Reply-to — DECIDED (delegated): `selva@r-statistics.co`, read by the owner.
   Pre-launch check: confirm the mailbox actually receives.
4. Campaigns — DECIDED (delegated): proceed for broadcasts once the owner runs the
   portal contact-headroom check and adds the DNS (DKIM selector + SPF merge).
5. Newsletter name — DECIDED (delegated): The Residual.
6. **OPEN — launch timing.** In plain terms: metering and the pass REMOVE things
   free users have today. Flip the flags now, and users lose something with no new
   story attached. Flip them WITH the 2026-09-08 launch, and the limits arrive
   inside the announcement of Pro/certificates/founding rate, as the shape of the
   free tier. Recommended: with launch. Owner to confirm.
