# The conversion layer: window context, the Pro wall, and the contact centre

Written 2026-09-27. Nothing here is built yet except where marked EXISTS.

Three features the owner asked for, planned together because they share one
spine: the signals already collected about what a person did, and the judgement
about what to say to them next.

## Why these three belong in one plan

All three answer the same question at different moments.

| Moment | Surface | What the person needs to know |
|---|---|---|
| Opens today's daily lesson | the player | what else is open, what closed, how long is left |
| Hits a Pro lesson | the wall | what is behind it and whether it is worth it |
| The owner opens the admin | contact centre | who is close, and what to say to them |

The same facts drive all three. Building them separately would mean deriving
the same state three times in three shapes.

---

# Ground truth: what already exists

Researched 2026-09-27, not assumed. This is the single most important section,
because most of the proposal is smaller than it first appears.

| Thing | State |
|---|---|
| `/api/me/shelf` | **EXISTS.** Returns `open[]` with `{seq, subject, slug, course, closes_at}`, plus `position`, `badges`, `milestones`. Derived from the send ledger, no stored unlock state |
| Windowed access gate | **EXISTS.** `_middleware.ts serveWindowedLesson`: Pro opens everything; otherwise the `seq:<n>` row in `sent_emails` must be under `window_hours` (72) old. Fails closed to `/lesson-locked.html` |
| `/lesson-locked.html` | **EXISTS**, 14 KB. Already has a headline, a lesson-name line, a schedule line, a "Keep going free" block and an "Open every lesson, forever" block. Already calls `/api/me/shelf` |
| Pro wall | **EXISTS.** `lesson-mode.js renderProGate` + `upgradeGateForMember` |
| `/admin/analytics.html` + `/api/admin/stats` | **EXISTS.** Already computes `hot_leads`, `at_risk`, `checkout_leads`, solvers, XP, streaks, readers, as top-10 leaderboards |
| `/admin/user.html` + `/api/admin/user-stats?email=` | **EXISTS.** Already a complete per-user picture: account, engagement, practice, credentials, library, email, intent signals |
| Email senders | **EXIST.** wall, cart recovery (2 touch), quiet probe, pass arc, price alerts, digest, daily series |

**The contact centre is therefore not greenfield.** What is missing is the list,
the state machine, the score, and the action. The drill-down is done.

---

# Scale, and what it means for design

Measured on production 2026-09-27.

```
users               979      subscriptions        12
intent_signals    4,581      pro users            13
sent_emails       4,754      exercise solvers    235
email_events      8,814      certificates          0
exercise_attempts 4,332      badges_earned         0
reading_progress  4,048      quiz_attempts         0
DB size          59.3 MB
```

Two consequences that shape every decision below.

**1. This is a reading tool, not a statistics tool.** With 12 purchases, no lead
score can be validated. Any model presented as predictive would be theatre. The
value is operational: who do I talk to today, and what do I say. The design must
therefore make the *evidence* visible, never just a number.

**2. Three of the signals the owner listed are dead.** `certificates`,
`badges_earned` and `quiz_attempts` are all **zero rows**. Scoring leads on
"certs and badges" would be scoring on nothing. Either fix those systems or
leave them out of v1. This plan leaves them out and says so on screen.

---

# Feature 1: window context in the daily series

## The problem, precisely

A windowed lesson is open only while the `seq:<n>` email is under 72 hours old.
Open a lesson and there is no indication of what else is open, what has already
closed, or how long this one has left. The person is walking a path blindfolded,
and the one fact that would motivate an upgrade, that lessons they were given
have quietly expired, is invisible.

## The gap is small

`shelf` already computes `open[]` including `closes_at`. Its loop **skips**
sends outside the window rather than reporting them:

```ts
if (at !== undefined && now - at < WINDOW_SEC) { open.push({...}) }
```

So the work is: also collect the ones that fail that test, and the sequence
items never sent. No new table, no new query, no stored state.

## What `shelf` should return

```
open[]      { seq, subject, slug, course, closes_at }         EXISTS
expired[]   { seq, subject, slug, course, closed_at }         NEW
upcoming    count of sequence items not yet sent              NEW
window_hours                                                  NEW (for honest copy)
```

## Must have

- A state strip in the player and on the locked page: every lesson sent, in one
  of four states, **open (time left) / closing soon / closed / not yet sent**.
- The locked page names what **is** open right now and links it, instead of
  being a dead end.
- One honest line, shown **only when `expired.length > 0`**.

## Good to have

- A true countdown on open lessons, driven by `closes_at`, which already exists.
- The same state as two or three lines of text **inside the email**, so the
  context arrives before the click.

## Great to have

- A permanent mini-course shelf: done, open, closed, upcoming, with per-course
  progress. The closed count grows on its own, so the argument builds itself.
- **Reopen one closed lesson per month, free.** Converts a wall into goodwill;
  the second request is the upsell moment.
- Per-course completion tension: "2 of 3 parts done, the third closed."

## The rule that keeps it non-intrusive

**No upsell line when nothing has expired.** Then the strip reads as information
the person is owed rather than as marketing. This is the whole difference between
a feature people like and a feature people resent.

## Options

Four fully-worked options are mocked separately (see `_mocks/`), because the
choice here is a judgement about tone that should be made by looking, not by
reading a description.

---

# Feature 2: the Pro lesson wall

## What is shown today

`renderProGate` draws, over **one blurred content step**: a lock icon, a
headline ("This is a Pro lesson"), a position line ("Lesson 3 of 6 - Course -
14 steps"), the page's **meta description**, a CTA to `/pricing.html`, a price
line, a refund line, sometimes a free-lesson link, and a back link.
`upgradeGateForMember` then rewrites the CTA for signed-in free members into a
direct Paddle checkout and swaps the price line.

## Five defects, each concrete

1. **Two hardcoded prices.** `From $9/month, or $65 for a full year` in the gate
   markup, and `$129 a year, or $14 a month.` in `upgradeGateForMember`. Both
   bypass parity pricing, so a reader in a parity country is quoted a price they
   would not pay. Same class of defect as the wall email's hardcoded price.
2. **The meta description is doing the selling.** It is an SEO string.
3. **A blurred paragraph proves nothing.** The weakest possible sample.
4. **Position is scope, not value.** "Lesson 3 of 6" says how much, never what.
5. **Three exits dilute one decision**: pricing, free lesson, back.

## Must have

- Remove both hardcoded prices. Render the parity price or no price at all.
- Replace the meta description with **the real outline of the locked steps**.
  The step titles are in the page already.
- One primary CTA.

## Good to have

- **Give the first step in full rather than blurred.** A complete step proves
  quality. The track gate already does first-section-free; the wall can inherit
  that idea per lesson.
- **A secondary action that is not buying**, because most people at a wall will
  not buy today and are currently offered nothing but exit. "Tell me when this
  opens" captures the lead; price alerts already exist.
- **Use their own record as the argument**: "You have finished 7 lessons and
  solved 23 exercises here. The rest of this track is 39 lessons."

## Great to have

- **A day pass to this one lesson** at peak intent. The DA pass mechanic exists;
  this is the per-lesson version. Turns a toll into a trial.
- **Escalate by hit count**: first wall informs, third wall offers.
  `pro_wall_hit` records correctly since 2026-09-21, so this is measurable.
- Show the credential the track ends in, **once certificates record anything**.

---

# Feature 3: the contact centre

## What to build, and what to reuse

**Reuse:** `/admin/user.html` and `/api/admin/user-stats` for the drill-down.
They already do this well. **Build:** the list, the state machine, the score
with its evidence, and the recommended action.

## The state machine

Deliberately simple enough to trust. Evaluated in order; first match wins.

| State | Rule |
|---|---|
| Customer | `pro_until` set (or `-1` for lifetime) |
| Hot | pricing view, wall hit or checkout start in the last 7 days |
| Engaged | any activity in the last 7 days |
| Cooling | last activity 8 to 30 days ago |
| Dormant | last activity 31 to 90 days ago |
| Lost | no activity for over 90 days |
| New | created under 7 days ago with no activity yet |

## The score, and why it shows its work

A weighted sum with recency decay over: checkout start, wall hits, pricing
views, parity view, price alert set, lessons completed, exercises solved, XP,
streak, email open and click rate, saved posts.

**Every row must show the three signals that drove its score.** At n=12
conversions the number cannot be trusted on its own, and a score without its
evidence invites false confidence. The "why" column is not a nicety here; it is
what makes the tool honest.

Excluded from v1: badges, certificates, quizzes. Zero rows each.

## Must have

- The list: all users, one row each, sortable and filterable on email, state,
  score, signup gate, last seen, lessons, solved, XP, wall hits, pricing views,
  email opens. Row click goes to the existing drill-down.
- The filters the owner named: hottest leads, highest XP, most exercises solved,
  most wall hits, most pricing views, checkout opened.
- The "why" column.

## Good to have

- Recommended action per state. Mostly wiring, because the senders exist:
  hot with wall hits and no checkout goes to the wall email; checkout started
  goes to cart recovery; cooling goes to the quiet probe; dormant goes to a
  reactivation quoting their own history; happy customer goes to a review ask.
- One-click trigger from the row. `email-plan` already renders and sends per
  template.
- **Cohort conversion by `signup_gate` and `signup_slug`.** The entry point of
  every user is already captured. This is the highest-value analysis available
  at this scale: which door produces buyers.

## Great to have

- **The purchase autopsy**: for each of the 12 purchases, the full action
  sequence before it, on one page. Twelve is an anecdote, and reading twelve
  stories by hand is exactly the right use of twelve.
- Saved segments, and a daily "who needs attention" block in the digest that
  already exists.

---

# Cloudflare consumption

D1 bills on rows read. All CRM-relevant tables together are about **31,000
rows**.

| Usage | Rows read | Share of the 25B monthly allowance |
|---|---|---|
| One full-scan list view | ~31,000 | negligible |
| 100 list views a day | ~93M a month | **0.4%** |
| One per-user drill-down | 5 to 10k | negligible |

Workers requests: a page load is a few API calls against a 10M monthly
allowance. Irrelevant.

**The one scaling cliff, and the single highest-value fix.**
`intent_signals` is created at runtime with **one index, on `at` alone**:

```sql
CREATE INDEX IF NOT EXISTS idx_intent_at ON intent_signals (at)
```

There is no index on `user_id` or `signal`, which is precisely what this feature
filters by. At 4,581 rows that costs nothing. At 100x traffic it is 450,000 rows
scanned per query: still inside the allowance, but slow enough to make the page
feel broken.

**Add `(user_id, at)` and `(signal, at)` before building anything else.**

Do **not** build a nightly rollup table yet. That is correct above roughly
20,000 users or 500,000 signals, and premature below it.

---

# Issue, conflict and gap register

Found while checking, not anticipated. Each needs a decision or an action.

| # | Finding | Impact | Action |
|---|---|---|---|
| 1 | `shelf` discards expired sends | Feature 1 has no data for its core idea | Extend `shelf`, no new query |
| 2 | `intent_signals` indexed on `at` only | Latency cliff for the contact centre | Add two indexes |
| 3 | Admin API auth is bearer-only in `user-stats`/`stats` | Typing the URL in a browser 401s, as `digest` did | Add the `rsc-id` cookie fallback to the new endpoint |
| 4 | `/admin/*` is NOT excluded in `_routes.json` | Pages are served through Functions, which is what we want. But the **HTML is publicly reachable** | The page must render nothing without a successful authed fetch |
| 5 | Two hardcoded prices in the Pro wall | Parity readers quoted a price they will not pay | Feature 2 must-have |
| 6 | `badges_earned`, `certificates`, `quiz_attempts` all zero | Three proposed lead signals are dead | Excluded from v1, stated on screen |
| 7 | `lesson-locked.html` already well developed | Risk of building a second, worse version | Extend it, do not replace |
| 8 | `table-transform` widget strikes through every row when a column is added | Any published lesson using it that way reads as "all rows deleted" | Separate fix, not in this plan |
| 9 | `lessons-status.json` is the driver's source of truth, not git | A lesson published outside the driver gets rebuilt | Fixed 2026-09-27 in the recovery script |
| 10 | `subscriptions.amount` and `.currency` are null on every row | No revenue figure anywhere, including the digest | Out of scope, but it caps what the autopsy can show |

---

# Sequencing

Ordered by ratio of value to risk, not by feature number.

1. **The two hardcoded prices.** An hour. Readers are currently quoted wrong
   prices.
2. **The two indexes on `intent_signals`.** Minutes. Unblocks everything else.
3. **Extend `shelf`** with `expired`, `upcoming`, `window_hours`. One function.
4. **The contact centre**, reusing the drill-down.
5. **Feature 1 UI**, once the owner has picked a mock.
6. **The wall redesign**, last, because it benefits from what the contact centre
   teaches about who actually converts.
