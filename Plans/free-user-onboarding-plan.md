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

**A fourth lane, when lead magnets ship:** magnet captures create email-only
contacts with no account. They live in the nurture digest lane only (their own
consent), and graduate into this full program at account creation, with the magnet
recorded as their `signup_gate`.

## 2. Onboarding sequences, one per gate (Day 0-10)

Shared rules: sender ZeptoMail; one flag per sequence, default OFF; every send goes
through the one-brain gate (section 6): dedupe, suppression, category opt-out,
frequency cap; allowlist-only until launch. Email copy follows
`_build/prose-voice.md` -- P1/P2 as guidance, P3 hard: every number in an email is
measured from D1 or absent. Real cohort counts are allowed and encouraged
("214 people started this track this month"); invented ones never.
v1.1: welcome #1 carries a one-tap goal picker (signed links, no login needed);
the goal branches later steps here and feeds P2's study plan.

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
| Pro lesson wall hit | within ~1h: what is behind THAT wall, the guarantee, one-click checkout (prefilled). v1.1: the lesson's first two steps rendered inside the email -- the preview does the selling. |
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

## 3b. Nurture: the daily rep -- the trust engine

The sequence everything else leans on. It converts nobody today and everybody
eventually; it is what makes the pitch sequences land as help rather than noise.
This section IMPLEMENTS the newsletter plan's Phases C and E (mini-course drip +
every-other-day micro-track) as one thing -- do not build those separately.

- **Unit: one complete concept + one rep.** Each email teaches one thing in a
  90-second read, then one runnable exercise. v1: the rep deep-links to the
  lesson/exercise. v1.1: the link lands in an editor pre-loaded with the email's
  code, live. v3 (deferred): AMP in-inbox interactivity.
- **Cadence: every other day, opt-managed.** Not default-on: prompted opt-in at
  the day-3 onboarding email and in-product. Cadence choices in the preference
  center: daily / every other day / weekly / off. Browsing-gate users who never
  touch anything interactive get the weekly reading digest instead until they do.
- **Sequencing: along their chosen track** (goal from the one-tap, else
  signup_context). v1 follows track order. v2 adds mastery-skipping: skip
  concepts their exercise history shows mastered -- requires the
  concept-to-exercise mapping, which does not exist yet and is v2's real cost.
- **Milestone interrupts ride on top:** streak saves at their active hour, hub
  completions, cert progress ("2 exercises from your certificate"). An interrupt
  displaces that day's rep (section 6 arbitration), never stacks on it.
- **The weekly recap belongs to this layer:** "Your R Week" every 7 days to
  active users -- XP, streak, solved, position on their track. v1 text; v2 the
  server-rendered personal image; v2.1 the monthly wrapped, built to be shared.
- Dependencies: lifecycle engine + preference center. Ships after both.

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
- **Display (decided from the placement mocks + simulator, owner-amended
  2026-08-10):** layered composite —
  (a) hub-header pill, canonical, ALWAYS visible on practice hubs and STARTING
  FULL ("25 of 25" with a 5-segment bar on day one — a defined allowance is
  shown as a grant, never hidden and revealed late); neutral grey while >=6
  remain, amber at <=5; green "This hub stays open" chip replaces it inside
  started hubs at any count; the pill stands down at 0 where the wall carries
  everything;
  (b) inline count on the grade feedback ONLY when <=5 remain;
  (c) exercises-index card badges (Unlocked / Counts toward your 25 / Limit
  reached) so cost is visible before entering a hub;
  (d) dashboard module: ring, reset date, unlocked-hub list.
  Copy rules: always "N of 25"; the reset date lives in the pill small-text and
  the wall; never a lock icon on a started hub. One-time explainer card on first
  hub visit, owner-trimmed to exactly: "You get 25 graded exercises a month. Any
  hub you start stays open until the month ends, so you can always finish what
  you began." The zero state is an achievement screen (month stats, what stays
  open, reset date, then Pro; "your streak and XP are safe either way"), never
  an error. The exercise-gate welcome email (s2a #1) names the allowance and
  that the meter starts full. Behavior spec = the simulator:
  claude.ai/code/artifact/e134099e-60b8-4676-a7b0-0d130271ff55
  (placements: claude.ai/code/artifact/f07ced68-f1c6-42a5-80f5-9d860d0fc958)
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

**One brain: categories, priority, frequency.** Every send passes one gate:

| Category | Sequences | Opt model |
|---|---|---|
| Account | fulfilment, receipts, pass-expiry notices | always on |
| Progress | onboarding, milestones, weekly recap | on by default, opt-out |
| Nurture | daily rep, reading digest | explicit opt-in, cadence choice |
| Offers | intent emails, conversion arc, coupon | on by default, opt-out; killed by global unsubscribe |
| Broadcast | The Residual (Campaigns) | newsletter_opt_in (consent sync, built) |

- **Frequency cap: max ONE non-account email per user per day.** Priority when
  several qualify: pass-deadline > intent > milestone > nurture rep > digest.
  The loser skips, the rep reschedules; nothing ever stacks.
- Global unsubscribe kills Progress + Nurture + Offers in one click and writes
  back to D1 (Campaigns webhook included). Categories are granular on top.
- **The preference center is therefore a launch dependency of the nurture
  layer**, not a later item: category toggles + rep cadence + unsubscribe all.

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

- **P1 (upgraded 2026-08-10): the WIN-FIRST funnel.** The gate moves to AFTER the
  first win, per the Duolingo lesson-before-signup result. Behavior spec, clickable
  across all three doors: claude.ai/code/artifact/5dfb2631-5327-47a3-bc30-f2211bfebdb1
  1. **BUILT 2026-08-10 on branch `meter-ui` (90806dee4c), ships with the meter.**
     Anonymous visitors can attempt ONE exercise and see it grade; sign-in is how
     they KEEP it ("+15 XP. Sign in to keep it"). Banked via the existing backfill
     endpoint; capped at one so nobody farms XP. The taster is ON THE HOUSE: the
     meter still reads 25 of 25 after banking (backfilled attempts carry
     source='backfill', excluded by the shared meter query; column live on both
     DBs). Also wired: signup_gate='exercise' attribution on fresh-account
     backfill, ?winxp= contextual headline on signin.html, GA4 funnel events,
     corner-nudge quieting while the contextual card is up. Not flag-gated:
     the taster gate is live for anonymous visitors as soon as this merges
     (it needs no meter and sells sign-up, not Pro).
  2. The sign-in screen names the stakes per door, driven by ?next=: the XP
     waiting / "lesson 3 of 35, step 2 saved" / "3 articles in your list". Same
     three auth options + consent checkbox underneath.
  3. Goal screen CONFIRMS an inference from signup_context ("You're working on
     statistics - follow the Statistics track?"), one tap; three alternates; a
     skip that never re-asks.
  4. First session ends with a plan: XP-banked toast, Day-1 streak lit, full
     meter pill, and exactly three next steps. The welcome email repeats the same
     story within minutes (banked win, the 25 allowance, ONE next step;
     reply-to a real person).
  Build order within P1: contextual headlines (days) -> goal confirm (days) ->
  next-three plan (days) -> anonymous banking (the real piece, ~a week).
  Trade-off accepted: some anonymous winners leave without signing up; they were
  bouncing at the old gate anyway.
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

Reordered 2026-08-10 for the ship-now decision:

1. Schema: `signup_context` + `sent_emails` (days)
2. Metering: manifest lesson-hub set + `attempt.ts` enforcement + meter UI
   (chip / index badges / dashboard) — `flag:exercise-meter`
3. DA pass: entitlement + middleware + countdown UI — `flag:da-pass`
4. **FLIP both** after preview verification, with the existing-user announcement
   email. This starts the engine countdown.
5. Bucket-1 event emails behind flags: welcome x3 gates, cert-earned, first-hub,
   intent #1, cap-hit
6. Lifecycle engine — DEADLINE: flip + 21 days (first pass user's day-21 email)
6b. Preference center -> nurture daily rep v1 + weekly recap v1 (text)
7. P1 -> P3 -> P2 -> P4
8. Later: stats-image artifact (recap v2 + monthly wrapped), one-tap goal picker,
   pre-loaded editor links (rep v1.1), send-time v2, mastery-skip (rep v2; needs
   the concept-to-exercise mapping). AMP deferred indefinitely (the deep-link
   fallback captures most of its value).

## 9. Metrics (all measurable in D1/GA4 today)

Activation: signup -> first XP same session (target: majority). Sequence health:
open/click per step, dedupe violations = 0. Meter: % of actives hitting the wall
monthly; wall -> pricing CTR. Pass: %% finishing >=50% of DA in 30 days; day-27
coupon redemption; pass -> Pro conversion. Nurture health: rep open trend over
weeks (flat or rising = the content is carrying it), micro-track step completion,
per-category opt-out rates. Frequency: non-account emails per user per day <= 1,
violations = 0. Guardrails: unsubscribe rate per sequence; spam complaints ~0;
sender reputation.

## 10. Decisions

1. Meter unit — DECIDED: the hybrid in section 4.
2. Coupon — DECIDED: 23% off, one-time, 72h.
3. Reply-to — DECIDED (delegated): `selva@r-statistics.co`, read by the owner.
   Pre-launch check: confirm the mailbox actually receives.
4. Campaigns — DECIDED (delegated): proceed for broadcasts once the owner runs the
   portal contact-headroom check and adds the DNS (DKIM selector + SPF merge).
5. Newsletter name — DECIDED (delegated): The Residual.
6. **Launch timing — DECIDED (owner, 2026-08-10): flip metering and the pass NOW,
   not launch-coupled.** Build dark behind flags, verify on preview, flip.
   Consequences built into the build:
   (a) grandfathering clock for existing accounts = the flag-flip date, announced
   by an account-category email that tells the whole story: what stays free
   forever, what the pass is, that the founding rate exists;
   (b) the flip starts a HARD DEADLINE for the lifecycle engine — the first
   affected user reaches pass day 21 three weeks later, so the engine (at
   minimum the pass arc) must be live by flip + 21 days;
   (c) the on-site copy at the meter and the pass carries the story the launch
   announcement would have carried.
