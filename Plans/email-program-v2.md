# Email program v2: the complete customer workflow

The umbrella SSOT for every email the site sends: who gets what, when, why,
and what decides between them. Bodies live in `email-copy-book.md`; this file
owns states, triggers, journeys, arbitration, consent, and the build order.
Supersedes the sequence sections of `newsletter-email-program-plan.md` and
extends `free-user-onboarding-plan.md` s3b/s5/s6.

## 0. The voice contract (applies to every email, no exceptions)

Authentic, friendly, concise, natural speaking voice. Every email sounds like
Selva wrote it to one person, because he effectively did.

- The read-aloud test: if a sentence sounds like a company, rewrite it until
  it sounds like a person. "We're excited to announce" fails. "This is live
  now, here is what it does for you" passes.
- Short. Most emails under 120 words. One idea, one CTA.
- Say the true thing plainly, including the uncomfortable true thing ("after
  {date} the track moves to Pro"). Trust is the asset the whole program
  compounds.
- Never: "unlock", "supercharge", "level up", "journey", urgency theater,
  fake scarcity, em dashes, exclamation stacking, emoji in subjects.
- Numbers only from real data (P3, hard rule). A sentence whose token has no
  data is dropped, never faked.
- Reply-to selva@r-statistics.co on everything. Replies are the support
  channel and the best product feedback we have.

## 1. Sending infrastructure (decided, partially live)

| Layer | System | Status |
|---|---|---|
| Per-user sequences + events | ZeptoMail (funded ~6 months) | live, used by fulfilment/renewal/admin |
| Broadcasts (The Residual) | Zoho Campaigns, dedicated list | blocked on owner: token, list key, sender-domain DNS |
| Magic links | Supabase via ZeptoMail SMTP | live |
| Exactly-once ledger | `sent_emails (user_id, email_key)` | table live on both DBs |
| Engine | Cron Worker, daily at send hour + event senders inline | to build |
| Kill switch | `flag:email-engine` (master), plus per-sender flags | to build |

Headers on every non-account send: `List-Unsubscribe` (one-click, RFC 8058;
Gmail requires it) and `utm_source=email&utm_campaign=<email_key>` on links.

## 2. The state model

Every account is in exactly one state. The engine evaluates state first,
then eligibility, then arbitration.

| State | Definition | Email goal |
|---|---|---|
| S0 Anonymous | no account | none (product surfaces do the talking) |
| S1 New free | day 0-30, pass window open | activate: first lesson, first solve, pass progress |
| S2 Established free | post-pass, active in last 21 days | habit: reps, recaps, milestones; convert on real intent |
| S3 Dormant free | no visit and no email open for 21 days | one honest winback, then near-silence |
| S4 Pro active | entitlement live | success: make the purchase keep feeling right |
| S5 Pro at risk | payment failed or cancel scheduled | recover with dignity, never guilt |
| S6 Churned Pro | entitlement lapsed | one winback at +30 days, then treat as S2/S3 |
| S7 Team | seat holder or org owner | owner: adoption; member: same as S4 with team framing |
| N Newsletter-only | on the Residual list, no account | broadcast only; soft path to an account |

State transitions the engine must handle: S1 to S2 at pass end (the arc
handles the moment), any to S3 by inactivity clock, S3 back to S2 on any
visit (re-awaken), S2/S3 to S4 on purchase, S4 to S5 on webhook, S5 to S4 on
recovery, S5/S4 to S6 on expiry.

## 3. Entry triggers and their welcomes

`users.signup_gate` (set once at signup) picks the welcome variant. All
welcome emails are category account, sent minutes after first confirmed
sign-in, and all name the pass and its end date.

| Trigger | signup_gate | Welcome (copy book) |
|---|---|---|
| Solved an exercise anonymously, signed up to keep it | exercise | 1a "Your first solve is saved" |
| Hit a lesson sign-in wall or account gate | lesson | 1b "Pick up where you left off" |
| Corner nudge, navbar, or direct signin | browsing | 1c "Your r-statistics.co account, in 30 seconds" |
| Accepted a team invite | team | NEW 9a (to write): seat welcome, from the org's context |
| Bought before creating history (rare) | purchase | Pro welcome 8a replaces the free welcome entirely |
| Newsletter-only subscriber | n/a (no account) | Campaigns confirmation only; no lifecycle emails |

Acquisition surfaces feeding these gates today: exercise hubs (win-first
taster), lesson walls, tutorial nudges, pricing page. Surfaces with NO email
capture today, listed as proposals, not commitments: the 73 tools ("email me
this result"), the Publishing Handbook (chapter-updates list), assessments
(cert follow-up; branch pending). Each would need its own consent language.

## 4. Consent and category law

The line that keeps us honest and legal (EU users especially):

| Category | Legal basis | Can it send without marketing opt-in? |
|---|---|---|
| account (welcome, cert, billing, security, the flip announcement) | contract / service | yes, always |
| progress (milestones, cap-hit, recaps) | legitimate interest | yes, individually opt-out-able in preferences |
| nurture (daily rep, streak-save) | consent | no: strictly opt-in via preference center |
| offers (pass arc days 21-31, intent) | soft opt-in for the pass arc (it concerns an entitlement they hold), consent for everything else | pass arc: yes with prominent opt-out; intent and future promos: marketing opt-in only |
| broadcast (The Residual) | consent | no: double-opt-in list only |

Owner decision to confirm: treating the pass arc as service-adjacent (it
describes an entitlement expiring) is defensible and standard, but the day-27
coupon inside it is promotional. Mitigation chosen: the coupon email honors
`marketing_opt_out` if the user has set it; days 21/23/30/31 still send.

Preference center (to build, /account.html email section): toggles for
progress, nurture-rep, offers, broadcast. Account cannot be toggled.
`unsubscribe all` sets everything off except account.

## 5. Arbitration: the one-brain rule, complete

Account/billing emails always send and never count. Everything else: max ONE
per user per day, chosen by priority. Higher wins; loser re-queues if still
relevant tomorrow, or drops if stale.

1. Pass deadline (day 27, 30) - a real clock beats everything
2. Payment recovery (ours, if any beyond Paddle's) - money already committed
3. Intent follow-up - they raised a hand yesterday
4. Cap hit - explains a wall they just hit
5. Pass progress (day 21, 23)
6. Milestone (cert first, then hub completion)
7. Streak save (opt-in nurture)
8. Daily rep (opt-in nurture)
9. Weekly recap
10. Broadcast day: the Residual (Campaigns, Thursdays). The engine skips rep
    and recap for Residual subscribers on Thursdays so nobody gets two.

Global guards: no email between 21:00 and 08:00 in the user's likely
timezone (from signup country; UTC 13:00 when unknown). Sunset: 10
consecutive non-account sends with no opens drops the user to weekly recap
only; 6 more weeks silent drops to account-only. Any site visit fully
re-awakens.

## 6. Journeys, persona by persona

Day numbers count from account creation unless noted. Copy IDs from the
copy book; NEW = body still to be written there.

### Persona A: the practicer (came in through the exercise gate)

Anonymous: solves the taster, hits the gate, signs up to keep the XP.

| Day | Condition | Email |
|---|---|---|
| 0 | always | 1a Your first solve is saved |
| 1-20 | opted into nurture | 5a daily rep, at most |
| 7 | finished a hub | 3b You finished {hub} |
| any | 25th attempt of the month | 3d All 25 for this month, done |
| any | visited pricing / hit a wall | 3c Questions about Pro? (once ever) |
| 21 | has lesson progress | 2a pass recap |
| 23 | always | 2b one-week warning |
| 27 | marketing not opted out | 2c the 23% coupon |
| 30 | always | 2d last day |
| 31 | always | 2e what stays free |
| 32+ | active | S2: reps, recaps, milestones |
| 32+ | inactive 21 days | S3: one winback (NEW 10a), then quiet |

### Persona B: the course learner (lesson wall signup)

Same spine as A with two differences: welcome is 1b (points back at the
exact lesson), and the pass arc is the main event because their whole intent
is the track. Milestone emphasis shifts from hubs to lesson sections.

### Persona C: the browser (nudge signup, low intent)

Welcome 1c. No taster, often no early activity. The risk is silence into
dormancy, the sin would be nagging.

| Day | Condition | Email |
|---|---|---|
| 0 | always | 1c account in 30 seconds |
| 3 | zero activity so far | NEW 10b "Where to start" : one honest orientation email, once. If ignored, nothing further except the pass arc endpoints |
| 21-31 | pass arc | 2b, 2d, 2e only (no 2a: no progress to recap; 2c coupon only if they showed any activity, a coupon to a ghost is spam) |
| 35+ | still zero activity | account-only silence; they know where we are |

### Persona D: the existing account at the flip (one-time cohort)

| Day (from flip) | Email |
|---|---|
| 0 | 4 the flip announcement (account category, everyone) |
| 0-30 | the pass arc mapped onto flip-relative days, same conditions as A |
| n/a | everything else as their activity state dictates |

### Persona E: the buyer (Pro)

| Moment | Email |
|---|---|
| purchase | Paddle receipt + our fulfilment (live) |
| day 0 | NEW 8a Pro welcome: what just opened, the one best next step for THEIR track, and "reply if anything is off". Warm, short, zero upsell |
| day 7 | NEW 8b only if they have not opened a Pro lesson yet: "getting your money's worth" nudge, one link, once ever |
| renewal minus 7 | renewal reminder (live) |
| payment failed | Paddle dunning first; we add NEW 8c one plain-text note from Selva at +3 days if still failing ("card bounced, here is the fix link, no drama"). Verify Paddle's sends first so nobody gets doubles |
| cancel scheduled | NEW 8d confirm + one honest save: what they keep, what ends, one question ("what was missing?"). Never a guilt trip |
| expired +30 | NEW 8e winback, once: what changed since they left, current price, done |

### Persona F: the team

| Moment | Email |
|---|---|
| owner provisions seats | invite emails (live, invites.ts) |
| member accepts | NEW 9a seat welcome: what the seat includes, where to start, who their admin is |
| owner, day 14 | NEW 9b adoption note if seats sit unused: "5 of 8 seats active, here is a nudge template you can forward" |
| renewals/billing | account category, owner only |

### Persona G: newsletter-only

The Residual (6) weekly. Every issue carries one quiet line linking site
features. No lifecycle emails ever; the list is not a funnel to spam.

## 7. The engine (build spec)

- **Event senders** (inline, `waitUntil`, minutes-fresh): welcome 1a/1b/1c,
  cert 3a, fulfilment (live), team 9a. Gated by flag + `sent_emails`.
- **The daily brain** (cron Worker, once daily per timezone band): computes
  state, collects eligible candidates, applies category consent, applies
  arbitration, sends at most one, writes the ledger. Idempotent by
  `(user_id, email_key)`; day-keyed emails use keys like `rep:2026-08-14`.
- **Data it reads**: users (created_at, pro_until, signup_gate, consent
  fields), resolvePass, exercise_attempts, lesson progress, certificates,
  intent_signals, sent_emails, open events.
- **Opens/bounces**: ZeptoMail webhooks into a small `email_events` table
  (to add to schema); bounce marks `email_status=bounced` and suppresses.
- **Flags**: `email-engine` master kill; per-sender flags as in the copy
  book. Everything defaults off; the flip turns on welcome + arc + cap-hit
  first, nurture only after the preference center ships.

## 8. Measurement (what tells us it works)

- Per email: sends, opens, clicks (UTM), unsubscribes. Kill any email whose
  unsub rate beats its click rate for two consecutive months.
- Program: gate-to-signup rate (GA4 win/gate card events, already live),
  welcome open rate, day-7 activation (any solve or lesson), pass completion
  %, day-27 coupon redemptions (Paddle), free-to-Pro conversion by persona,
  dormancy rate, winback resurrection rate.
- The one number for the program: monthly free-to-Pro conversions attributed
  to an email click or coupon, against the baseline before the flip.

## 9. Copy debt (bodies to add to email-copy-book.md, in this voice)

8a Pro welcome · 8b day-7 Pro nudge · 8c payment note · 8d cancel confirm ·
8e Pro winback · 9a seat welcome · 9b seat adoption · 10a free winback ·
10b browser orientation. Nine bodies, all short. Streak-save (7) is
deliberately NOT committed: it is the highest-nag-risk email in the set;
decide after the rep's open data exists.

## 10. Build order

1. `email_events` table + ZeptoMail webhook receiver (small, unblocks metrics)
2. Event senders: welcome x3 + cert (flags on at the flip)
3. The daily brain with ONLY the pass arc + cap-hit (the flip's needs)
4. Preference center, then nurture rep + recap
5. Pro lifecycle (8a-8e) + team (9a-9b)
6. Winbacks (10a-10b), sunset automation
7. Campaigns provisioning (owner) then The Residual issue 1

Steps 2-3 are the flip dependency; everything after ships incrementally.
