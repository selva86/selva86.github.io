# Email copy book, r-statistics.co

Every planned email: trigger, timing, subject, and full body copy. This is the
copy SSOT; the lifecycle engine and event senders implement FROM this file.
Program plan: `free-user-onboarding-plan.md` (s3b nurture, s5 pass arc, s6
one-brain). Status: copy approved-pending-owner; no sender built yet except
fulfilment + renewal + signup-admin (live).

## Voice and hard rules

- Plain speech, short sentences, one idea per email, ONE primary CTA.
- Every email reads like Selva wrote it to one person. No marketing voice, no
  "we're excited", no "unlock", no urgency theater beyond real deadlines.
- **P3 (hard): no invented numbers.** Every number is a `{token}` filled from
  real data, listed in the token registry below. If the data source is empty,
  the sentence carrying the token is dropped, never faked.
- No em dashes anywhere. Subjects state facts; no clickbait, no "You won't
  believe", no comma-hinged slogans.
- Sender: `noreply@r-statistics.co` for account/transactional; personal sends
  use from-name **"Selva from r-statistics.co"**. Reply-to on EVERYTHING:
  `selva@r-statistics.co` (replies are wanted; they are the support channel).
- Every non-account email ends with the one-line footer:
  `You get this because you have an r-statistics.co account. [Email preferences] · [Unsubscribe]`
- Test sends: allowlist only (selva@r-statistics.co, selva86@gmail.com).

## One-brain gate (s6, enforced by the engine)

- Categories: `account` (always sends) | `progress` | `nurture` | `offers` | `broadcast`.
- Max ONE non-account email per user per day. Priority when competing:
  pass-deadline > intent > milestone > rep > digest.
- `sent_emails (user_id, email_key)` is the exactly-once ledger; every send
  checks it first.

## Token registry (P3 compliance)

| Token | Source |
|---|---|
| `{first_name}` | users.display_name, first word; fallback: drop the greeting name |
| `{pass_end_date}` | resolvePass().ends_at, formatted "Sep 8" |
| `{days_left}` | resolvePass().days_left |
| `{pct_complete}` | DA-track lessons finished / total, from lesson progress |
| `{lessons_done}` / `{lessons_total}` | same source, raw counts |
| `{finish_date_at_pace}` | extrapolation of last-14-day lesson rate; if rate is 0, the pace sentence is dropped |
| `{coupon_code}` / `{coupon_expiry}` | Paddle discount record (unique, one-time, 72h) |
| `{hub_name}` / `{hub_url}` | the completed exercise hub |
| `{track_name}` / `{cert_url}` | certificates row |
| `{xp}` / `{streak}` | users.total_xp / current_streak_days |
| `{left}` | meter: 25 minus this month's counted attempts |
| `{reset_date}` | first of next month, "Sep 1" |
| `{next_lesson_title}` / `{next_lesson_url}` | first unfinished lesson in the user's track order |
| `{course_title}` | the course of the lesson that gated them (signup_slug) |

---

# 1. Welcome, day 0 (category: account, flag: welcome-email)

One of three variants by `users.signup_gate`. Sent on first confirmed sign-in,
minutes after signup. All three name the pass and its end date (s5 day 0).

## 1a. signup_gate = exercise (they signed up to keep a solve)

- **Subject:** `Your first solve is saved`
- **Preheader:** `The XP is on your profile. Here is what else your account does.`

```
Hi {first_name},

That solve you just made is on your profile now, with its XP. Your streak
started today.

Two things your free account gives you, so you know what you have:

1. 25 graded exercises every month. Any practice hub you start stays open
   until the month ends, so you can always finish what you began.

2. The full Data Analyst track, free until {pass_end_date}. That is 30 days
   of interactive lessons, from wrangling data to building reports. It is
   the fastest way we know to get job-ready in R.

Start here: [Continue practicing -> {hub_url}]

The New to R course and every tutorial on the site stay free forever, no
clock on those.

If anything is confusing, just reply. I read these.

Selva
```

## 1b. signup_gate = lesson (they signed up at a lesson wall)

- **Subject:** `Pick up where you left off`
- **Preheader:** `{course_title} is open, and the Data Analyst track is free for 30 days.`

```
Hi {first_name},

You stopped at lesson {lesson_order} of {course_title}. It is open now, and
your place is saved.

[Continue the lesson -> {next_lesson_url}]

Your account also comes with the Data Analyst 30-day pass: the full track,
free until {pass_end_date}. Lessons you finish stay finished, and your XP
and streak build as you go.

The New to R course and every tutorial stay free forever.

Questions? Reply to this email. I read every one.

Selva
```

## 1c. signup_gate = browsing (signed up from the nudge or nav)

- **Subject:** `Your r-statistics.co account, in 30 seconds`
- **Preheader:** `What is free, what the 30-day pass covers, and where to start.`

```
Hi {first_name},

Welcome. Here is the short version of what you now have:

- 25 graded practice exercises a month, with instant feedback in the browser.
- The Data Analyst track, free until {pass_end_date}. Interactive lessons,
  quizzes, and a certificate at the end.
- The New to R course and 1,300+ tutorials, free forever.

If you are new to R, start with New to R. If you already write some R,
start the Data Analyst track and see how far you get in 30 days.

[Start learning -> /roadmap/data-analyst.html]

Reply if you get stuck anywhere. I read these.

Selva
```

---

# 2. The Data Analyst pass arc (category: offers, flag: lifecycle-engine)

Days count from pass start (account creation, or launch for older accounts).
Skipped entirely for Pro users; each email checks entitlement at send time.
The day-21 email is the engine's first hard deadline (flip + 21 days).

## 2a. Day 21: progress recap

Only sent if `{lessons_done}` > 0; otherwise day 23 is the first arc email.

- **Subject:** `{days_left} days left on your pass, {pct_complete}% through`
- **Preheader:** `Here is the pace that finishes the track before {pass_end_date}.`

```
Hi {first_name},

A quick progress check. You have finished {lessons_done} of {lessons_total}
lessons on the Data Analyst track, which is {pct_complete}%.

Your pass runs until {pass_end_date}. At your recent pace you would finish
around {finish_date_at_pace}.

[Continue: {next_lesson_title} -> {next_lesson_url}]

Everything you finish stays finished, whatever happens after the pass.

Selva
```

## 2b. Day 23: one-week warning

- **Subject:** `Your Data Analyst pass ends {pass_end_date}`
- **Preheader:** `One week left. What stays free after, and what does not.`

```
Hi {first_name},

One week left on your pass. Until {pass_end_date} the full Data Analyst
track is open to you. After that, the track moves to Pro, and here is
exactly what changes:

Stays free forever: the New to R course, every tutorial, your XP, your
streak, and everything you already finished.

Needs Pro after {pass_end_date}: the remaining Data Analyst lessons and
their quizzes.

If you have momentum, this is the week to use it.

[Continue the track -> {next_lesson_url}]

Selva
```

## 2c. Day 27: the coupon (72 hours, genuinely one-time)

- **Subject:** `23% off Pro, ends {coupon_expiry}`
- **Preheader:** `A one-time code for your last pass days. It will not come back.`

```
Hi {first_name},

Your pass ends {pass_end_date}. If you want to keep going without a break,
here is 23% off any Pro plan:

    {coupon_code}

It works once, for you only, until {coupon_expiry}. I do not re-send these
and there is no "extended by popular demand" email coming later. One code,
72 hours, that is the whole offer.

[See plans and use the code -> /pricing.html]

If Pro is not right for you now, that is fine. The New to R course and all
tutorials stay free, and your progress is not going anywhere.

Selva
```

## 2d. Day 30: final day

- **Subject:** `Last day of your Data Analyst pass`
- **Preheader:** `The track closes tonight. Your progress stays.`

```
Hi {first_name},

Today is the last day of your pass. At midnight UTC the Data Analyst track
moves to Pro for your account.

If you are mid-lesson, tonight is the time to finish it.

[Open the track -> {next_lesson_url}]

{coupon_line}

Everything you finished stays on your profile, and your XP and streak keep
building through the free practice exercises.

Selva
```

`{coupon_line}` = `Your 23% code {coupon_code} still works until {coupon_expiry}.`
if the coupon is unused and unexpired; otherwise the line is dropped.

## 2e. Day 31: graceful landing

- **Subject:** `What stays free on r-statistics.co`
- **Preheader:** `Your pass ended. Here is everything that did not.`

```
Hi {first_name},

Your 30-day pass ended yesterday. Before anything else: thank you for
spending part of your month learning here.

What you keep, free, forever:

- Everything you finished. {lessons_done} lessons, {xp} XP, all of it.
- The New to R course, end to end.
- 25 graded practice exercises a month.
- 1,300+ tutorials.

{coupon_last_call}

If you come back to Pro someday, your progress will be exactly where you
left it. Reply anytime if I can help with something.

Selva
```

`{coupon_last_call}` = `One practical note: your 23% code {coupon_code} is
valid for a few more hours, until {coupon_expiry}. After that it is gone.`
if applicable; dropped otherwise.

---

# 3. Event emails (bucket 1)

## 3a. Certificate earned (category: account, flag: cert-email)

Sent minutes after minting.

- **Subject:** `Your {track_name} certificate is ready`
- **Preheader:** `Verified link, LinkedIn button, PDF. All yours.`

```
Hi {first_name},

You earned it: the {track_name} certificate is live on your profile.

[View and share your certificate -> {cert_url}]

The link is publicly verifiable, so you can put it on LinkedIn or a resume
and it holds up when someone checks. The Add-to-LinkedIn button on the
certificate page fills in everything for you.

Congratulations. This took real work.

Selva
```

## 3b. First hub completed (category: progress, flag: milestone-email)

Sent once, on the first time a user solves every exercise in a hub.

- **Subject:** `You finished {hub_name}`
- **Preheader:** `Every exercise, solved. Here is a good next set.`

```
Hi {first_name},

Every exercise in {hub_name}, solved. That is the whole set.

Most people who finish that hub do well with this one next:

[{next_hub_name} -> {next_hub_url}]

Your streak is at {streak} days. Tomorrow keeps it alive.

Selva
```

## 3c. Purchase intent #1 (category: offers, flag: intent-emails)

Trigger: intent_signals row (pricing page visit or lesson-wall hit) from a
signed-in free user, once per user, sent the next morning. Deliberately does
NOT say "we saw you on the pricing page".

- **Subject:** `Questions about Pro?`
- **Preheader:** `The honest version of what it includes and what free covers.`

```
Hi {first_name},

Quick one. If you have been weighing whether Pro is worth it, here is the
honest version:

Free already covers a lot: New to R, all tutorials, 25 graded exercises a
month. If that is serving you, keep using it, seriously.

Pro is for when you want the full lesson tracks: every interactive lesson,
every quiz, and the certificates, across Data Analyst and Data Scientist.
It is built to take you from "I can follow along" to "I can do this at
work".

[What Pro includes -> /pricing.html]

If something specific is holding you back, reply and ask me directly.
I would rather answer a hard question than have you guess.

Selva
```

## 3d. Cap hit (category: progress, flag: cap-email)

Trigger: the month's 25th counted attempt. Once per month per user.

- **Subject:** `All 25 for this month, done`
- **Preheader:** `Your started hubs stay open. Fresh 25 on {reset_date}.`

```
Hi {first_name},

You used all 25 graded exercises this month. That is a full month of
practice, most people do not get close.

Until {reset_date}:

- Every hub you started stays open, finish them anytime.
- Lessons and tutorials are not affected at all.
- Your streak and XP are safe.

A fresh 25 lands on {reset_date}. If you do not want to wait, Pro removes
the cap entirely:

[See Pro plans -> /pricing.html]

Selva
```

---

# 4. The flip announcement (category: account, one-time broadcast to all existing users)

Sent once, the day metering + the pass go live. This starts the lifecycle
engine clock for pre-launch accounts.

- **Subject:** `Two changes to your r-statistics.co account`
- **Preheader:** `Free practice gets a monthly allowance. The Data Analyst track opens free for 30 days.`

```
Hi {first_name},

Two changes to how the free tier works, both live today.

1. Free practice is now 25 graded exercises a month. Any hub you start
   stays open until the month ends, so you will never be cut off in the
   middle of a set. Lessons and tutorials are not metered, and nothing
   you have already earned is affected.

2. The full Data Analyst track is open to you, free, for the next 30 days,
   until {pass_end_date}. Interactive lessons, quizzes, the certificate
   path, all of it. After 30 days the track moves to Pro, but whatever you
   finish stays finished.

Why the change: grading and hosting cost real money, and this keeps the
free tier sustainable while keeping New to R and all 1,300+ tutorials free
forever.

If 30 days is enough to get value from the Data Analyst track, it is yours.

[Start the track -> /roadmap/data-analyst.html]

Questions or objections, reply to this email. I answer.

Selva
```

---

# 5. Nurture (category: nurture, opt-in via preference center, flag: daily-rep)

## 5a. The daily rep

One exercise a day, picked from the user's current track position. Skipped
any day the one-brain gate already sent something. Sunset: no opens across
10 sends drops to the weekly recap only.

- **Subject:** `Today's rep: {exercise_title}`
- **Preheader:** `One exercise, about {est_minutes} minutes.`

```
{exercise_prompt_first_line}

That is today's rep. One exercise from {hub_name}, right at your level.

[Open it -> {exercise_url}]

Streak: {streak} days.

Selva
```

## 5b. Weekly recap (v1, text only)

Sent Sunday. Skipped if the week's numbers are all zero.

- **Subject:** `Your week: {week_solves} solved, {week_xp} XP`
- **Preheader:** `And the one thing that moves next week forward.`

```
Hi {first_name},

Your week on r-statistics.co:

- Exercises solved: {week_solves}
- XP earned: {week_xp}
- Streak: {streak} days

Next up on your track: {next_lesson_title}.

[Continue -> {next_lesson_url}]

Selva
```

---

# 6. Broadcast (category: broadcast, Zoho Campaigns, opt-in list only)

## The Residual (weekly newsletter)

Copy written per issue; the format contract:

- **Subject pattern:** the issue's single topic, stated plainly. Example
  shape: `Why your model fails on Mondays` (topic-specific, never a template).
- One R idea explained properly, one code snippet that runs, one link to the
  relevant tutorial or lesson, under 400 words. No roundup-of-links filler.

---

# 7. Already live (reference, no copy changes here)

| Email | Trigger | Where |
|---|---|---|
| Purchase fulfilment | Paddle webhook | functions, live |
| Renewal reminder | subscription period end approaching | functions, live |
| Signup admin notification | confirmed signup, to owner | notify.ts, live |
| Magic link | Supabase auth | Supabase SMTP via ZeptoMail |

# 8. Send-order sanity example

A day-27 user who also completed a hub and visited pricing yesterday gets ONE
email: the coupon (pass-deadline outranks intent outranks milestone). The
others wait for their next eligible day or are dropped if stale.
