# Email copy book, r-statistics.co

Every planned email: trigger, timing, subject, and full body copy. This is the
copy SSOT; the lifecycle engine and event senders implement FROM this file.
Program plan: `free-user-onboarding-plan.md` (s3b nurture, s5 pass arc, s6
one-brain). Status: copy approved-pending-owner; no sender built yet except
fulfilment + renewal + signup-admin (live).

## Voice and hard rules

Voice pass v2 (2026-08-13, owner: v1 read mechanical). The additions:

- **Sender persona: Akshay <akshay@r-statistics.co>**, from-name "Akshay from
  r-statistics.co", reply-to akshay@, signatures "Akshay". The mailbox must
  exist (Cloudflare Email Routing rule) before flag:email-live flips, or replies bounce.
- **Personal-note rendering.** No card chrome, no logo header, no CTA button:
  plain paragraphs, default font stack, links inline. What a person sends
  from a mail client. This is also the Gmail-Promotions defense - buttons,
  benefit bullets, and branded shells are what the tab classifier keys on.
- **Contractions everywhere** ("you've", "that's", "I'd"). Formal-complete
  sentences in every slot is the single biggest AI tell.
- **Dissolve symmetric lists into prose.** Numbered benefit lists read as
  marketing; two facts can live in two sentences.
- **One small human aside per email, max** ("Genuinely." / "Most people never
  get close."). More than one reads as performance.
- Vary the rhythm: a fragment is allowed. A two-word sentence is allowed.

- Plain speech, short sentences, one idea per email, ONE primary CTA.
- Every email reads like one person wrote it to one person. No marketing
  voice, no "we're excited", no "unlock", no urgency theater beyond real
  deadlines.
- **P3 (hard): no invented numbers.** Every number is a `{token}` filled from
  real data, listed in the token registry below. If the data source is empty,
  the sentence carrying the token is dropped, never faked.
- No em dashes anywhere. Subjects state facts; no clickbait, no "You won't
  believe", no comma-hinged slogans.
- Sender: **"Akshay from r-statistics.co" <akshay@r-statistics.co>** for every
  lifecycle email; `noreply@r-statistics.co` stays for receipts/fulfilment.
  Reply-to on EVERYTHING: `akshay@r-statistics.co` (replies are wanted; they
  are the support channel).
- Every non-account email ends with a footer whose first line states the
  SPECIFIC reason it sent, then the links:
  `You get this because <reason, e.g. "your Data Analyst pass ends this week">. [Email preferences] · [Unsubscribe]`
  Each email's reason string ships with its template; nobody should ever
  wonder why we wrote to them.
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
| `{lesson_title}` | the Pro lesson whose wall fired the intent signal (3e) |
| `{xp}` / `{streak}` | users.total_xp / current_streak_days |
| `{left}` | meter: 25 minus this month's counted attempts |
| `{reset_date}` | first of next month, "Sep 1" |
| `{next_lesson_title}` / `{next_lesson_url}` | first unfinished lesson in the user's track order |
| `{course_title}` / `{lesson_order}` | the course of the lesson that gated them (signup_slug) + their position in it |
| `{next_hub_name}` / `{next_hub_url}` | recommended follow-on hub; from a hand-curated next-hub map, sentence dropped if unmapped |
| `{exercise_title}` / `{exercise_url}` / `{exercise_prompt_first_line}` / `{est_minutes}` | the daily rep's exercise, from the manifest + hub page |
| `{week_solves}` / `{week_xp}` | this week's attempts + xp_ledger sums |
| `{billing_update_url}` | Paddle customer-portal update link from the subscription record |
| `{grace_end_date}` / `{access_end_date}` | Paddle dunning grace end / scheduled cancellation effective date |
| `{recent_highlights}` | 1-3 lines of genuinely new content since their expiry, from a maintained changelog; dropped when empty |
| `{progress_snapshot}` | up to 3 lines from real data (lessons done, solves, XP); zero-lines dropped; all-zero users never get the email |
| `{org_name}` / `{admin_name}` / `{admin_email}` / `{team_admin_url}` | orgs + org_members rows |
| `{active_seats}` / `{total_seats}` | org_members activation counts |

---

> **2026-08-16: the three welcome bodies and the flip were rewritten** (voice
> pass v3: genuinely conversational, no em dashes, claim-to-start phrasing for
> the pass). The live copy is `functions/_data/lifecycle-emails.json`; the
> fenced bodies below for those four emails are historical.

# 1. Welcome, day 0 (category: account, flag: welcome-email)

One of three variants by `users.signup_gate`. Sent on first confirmed sign-in,
minutes after signup. All three name the pass and its end date (s5 day 0).

## 1a. signup_gate = exercise (they signed up to keep a solve)

- **Subject:** `Your first solve is saved`
- **Preheader:** `The XP is on your profile. A couple of things worth knowing.`

```
Hi {first_name},

Nice one. That solve you just made is safely on your profile, XP and all,
and your streak started today.

Since you're new, two things worth knowing.

You get 25 graded exercises a month on the free plan, and any hub you
start stays open until the month ends, so you can always finish what you
began.

You've also got the full Data Analyst track free until {pass_end_date}.
Thirty days of interactive lessons, from wrangling messy data to building
reports. If you're even half-serious about R, that's the thing I'd point
you at.

[Keep practicing where you left off -> {hub_url}]

Everything else, the New to R course and all 1,300+ tutorials, is free
forever. No clock on those.

Stuck or confused about anything? Just hit reply. I actually read these.

Akshay
```

## 1b. signup_gate = lesson (they signed up at a lesson wall)

- **Subject:** `Pick up where you left off`
- **Preheader:** `Your lesson is open again, and your place is saved.`

```
Hi {first_name},

You're in. {course_title} is open again and your place is saved, so you
can carry on right where the wall stopped you.

[Continue the lesson -> {next_lesson_url}]

One thing worth knowing: your account comes with the full Data Analyst
track, free until {pass_end_date}. Whatever you finish in those 30 days
stays finished, along with the XP and streak you build up.

The New to R course and all the tutorials don't have a clock. Those are
free, period.

If anything's confusing, just reply and ask. Happy to help.

Akshay
```

## 1c. signup_gate = browsing (signed up from the nudge or nav)

- **Subject:** `Welcome, and where to start` (retitled 2026-08-13: the listicle subject read promotional)
- **Preheader:** `What is free, what the 30-day pass covers, and where to start.`

```
Hi {first_name},

Welcome aboard. Quick lay of the land, then I'll get out of your way.

The New to R course and all 1,300+ tutorials are free forever. Practice
gives you 25 graded exercises a month, with instant feedback right in the
browser.

And for your first 30 days, the full Data Analyst track is open to you
free, until {pass_end_date}. Lessons, quizzes, the certificate path, all
of it.

If you're brand new to R, start with New to R. If you already write a bit
of code, jump straight into the track:

[Start the Data Analyst track -> /roadmap/data-analyst.html]

Wherever you get stuck, hit reply. A person answers, not a bot.

Akshay
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

Akshay
```

## 2b. Day 23: one-week warning

- **Subject:** `Your Data Analyst pass ends {pass_end_date}`
- **Preheader:** `One week left. What stays free after, and what does not.`

```
Hi {first_name},

Quick heads-up: one week left on your Data Analyst pass. Until
{pass_end_date} the whole track is open to you.

After that it moves to Pro. What stays free: New to R, every tutorial,
your XP and streak, and everything you've already finished. What doesn't:
the remaining lessons and quizzes on the track.

If you've got momentum, this is the week to use it.

[Carry on with the track -> {next_lesson_url}]

Akshay
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

Akshay
```

## 2d. Day 30: final day

- **Subject:** `Last day of your Data Analyst pass`
- **Preheader:** `The track closes tonight. Your progress stays.`

```
Hi {first_name},

Last day of your pass. Tonight at midnight UTC the Data Analyst track
moves to Pro for your account.

If you're mid-lesson, finish it tonight. It stays finished forever.

[Open the track -> {next_lesson_url}]

{coupon_line}

Your XP, streak, and free practice aren't going anywhere either way.

Akshay
```

`{coupon_line}` = `Your 23% code {coupon_code} still works until {coupon_expiry}.`
if the coupon is unused and unexpired; otherwise the line is dropped.

## 2e. Day 31: graceful landing

- **Subject:** `Your pass ended, your progress didn't` (retitled 2026-08-13)
- **Preheader:** `Your pass ended. Here is everything that did not.`

```
Hi {first_name},

Your 30-day pass wrapped up yesterday. First, thanks for spending part of
your month learning here. Genuinely.

Nothing you did is lost. Every lesson you finished, all your XP, your
streak: still on your profile. The New to R course and all the tutorials
stay free, and you still get 25 graded practice exercises every month.

{coupon_last_call}

If Pro ever makes sense for you down the road, you'll pick up exactly
where you left off. Nothing resets.

And if there's something I can help with in the meantime, you know where
the reply button is.

Akshay
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

Akshay
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

Akshay
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

Akshay
```

## 3d. Cap hit (category: progress, flag: cap-email)

Trigger: the month's 25th counted attempt. Once per month per user.

- **Subject:** `All 25 for this month, done`
- **Preheader:** `Your started hubs stay open. Fresh 25 on {reset_date}.`

```
Hi {first_name},

You just used your 25th graded exercise this month. That's a serious
month of practice. Most people never get close.

Nothing dramatic happens now: every hub you started stays open until
{reset_date}, lessons and tutorials aren't affected, and your streak and
XP are safe. A fresh 25 lands on {reset_date}.

If waiting sounds annoying, Pro removes the cap entirely:

[Have a look at Pro -> /pricing.html]

Either way, nice work this month.

Akshay
```

## 3e. Wall follow-up (category: offers, flag: wall-email, send policy: fast)

Trigger: a signed-in free user hits a Pro lesson wall. Sends 30-90 minutes
after the signal (the hourly run), quiet hours respected. Unlike 3c this
names the wall, because the user experienced it (cart-abandonment logic).
Marketing consent required. At most once per 14 days, three lifetime, never
twice for the same lesson. Retired instantly by purchase (derivation).

- **Subject:** `About that locked lesson`
- **Preheader:** `The honest picture, so you can decide with full information.`

```
Hi {first_name},

You ran into the Pro wall on {lesson_title} earlier. Sorry about the
stop. Here is the honest picture so you can decide with full information.

Pro opens that lesson, the rest of the {track_name} track, every quiz,
and the certificate path.

[What it costs -> /pricing.html]

If Pro is not on the cards right now, the first lessons of that course
are free, and so is everything you have already done.

Stuck on whether it is worth it? Reply and ask me the hard question.

Akshay
```

---

# 4. The flip announcement (category: account, one-time broadcast to all existing users)

Sent once, the day metering + the pass go live. This starts the lifecycle
engine clock for pre-launch accounts.

- **Subject:** `Two changes to your r-statistics.co account`
- **Preheader:** `Free practice gets a monthly allowance. The Data Analyst track opens free for 30 days.`

```
Hi {first_name},

Two changes to the free tier, live today. The short version:

Free practice now gives you 25 graded exercises a month. Any hub you
start stays open until the month ends, so you won't get cut off mid-set.
Lessons and tutorials aren't metered at all, and nothing you've already
earned changes.

Second, and this one's the good news: the full Data Analyst track is open
to you, free, for the next 30 days, until {pass_end_date}. Whatever you
finish stays finished, even after the window closes.

Why the change? Grading and hosting cost real money, and this keeps the
free tier sustainable without touching what matters: New to R and all
1,300+ tutorials stay free forever.

Thirty days is enough to get real value out of that track. It's yours:

[Start the Data Analyst track -> /roadmap/data-analyst.html]

Questions or objections, just reply. I answer every one.

Akshay
```

---

# 5. Nurture (category: nurture, opt-in via preference center, flag: daily-rep)

## 5a. The daily rep

One exercise a day, picked from the user's current track position - and,
once profiling ships, from the persona track's hub ladder at the user's
level (see `nurture-personalization-plan.md`). Skipped any day the
one-brain gate already sent something. Sunset: no opens across 10 sends
drops to the weekly recap only.

- **Subject:** `Today's rep: {exercise_title}`
- **Preheader:** `One exercise, about {est_minutes} minutes.`

```
{exercise_prompt_first_line}

That is today's rep. One exercise from {hub_name}, right at your level.

[Open it -> {exercise_url}]

Streak: {streak} days.

Akshay
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

Akshay
```

## 5c. The guided tour (category: nurture, opt-in, flag: guided-tour)

One email a week (Tuesdays), each showcasing ONE piece of the site's best
content matched to the user's persona track and level. Queues, mapping, and
per-item subjects/hooks: `nurture-personalization-plan.md` s5. Ledger key
`tour:<track>:<n>`; queue exhausted = the tour goes quiet, no recycling.

**The template every issue follows:**

1. Open with the hook: one or two sentences that TEACH or provoke, no
   greeting-fluff. The reader should learn something even if they never
   click.
2. One link, framed as what they will be able to do after.
3. Sign off. Under 90 words total. No "in this week's issue" framing ever.
4. Footer reason line: "You get this because you turned on the weekly
   guided tour."

**First issue per track, fully written** (later issues follow the template
against the queue's subject + hook):

### tour:student:1 - Subject: `Your first ten lines of R`

```
Most R courses start with two weeks of theory. This one starts with you
writing working code in the browser, in the first minute, no installs.

Ten lines in, you will have made R do arithmetic, store data, and answer
a question. That is the whole point of lesson one.

[Start R Foundations: The Basics -> /R-Foundations-Basics-Course.html]

Twenty minutes, and entirely free.

Akshay
```

### tour:analyst:1 - Subject: `Import to insight, properly`

```
Analyst work does not start with a clean data frame. It starts with a
messy file someone exported at 5pm. The dplyr course starts in the same
place: import, tidy, then the five verbs that do ninety percent of the
job.

[Start Data Wrangling with dplyr -> /Data-Wrangling-dplyr-Course.html]

By the end you will reshape in one pipe what used to take an afternoon
of spreadsheet surgery.

Akshay
```

### tour:ds:1 - Subject: `Cross-validation, done honestly`

```
Most model failures are not modeling failures. They are evaluation
failures: leakage, the wrong split, a metric that flattered the model
until production disagreed.

That is why this track starts with evaluation, not algorithms.

[Start Model Evaluation and Tuning -> /R-Model-Evaluation-Course.html]

Get this right and every model you build afterwards is judged fairly.

Akshay
```

### tour:mle:1 - Subject: `The ML system design checklist`

```
"Walk me through how you would productionize this model." The question
shows up in every MLE interview and every real deployment, and most
answers wander.

This checklist is the one-pager that stops the wandering: data, serving,
monitoring, failure modes, in order.

[Read the ML System Design Checklist -> /An-ML-System-Design-Checklist.html]

Akshay
```

### tour:ai:1

Same as tour:mle:1 (the ai queue opens on the systems items; see the plan
for the divergence from slot 3).

### tour:pm:1 - Subject: `A/B testing, designed right`

```
Most A/B tests are decided before they launch: wrong metric, sample too
small, peeked at on day two. The fix is design, and design is a PM
skill, not a statistician's secret.

[Start A/B Testing and Experiment Design -> /AB-Testing-and-Experiment-Design.html]

After this one you will know, before anyone ships a variant, whether the
test can possibly answer the question.

Akshay
```

### tour:researcher:1 - Subject: `Design decides everything`

```
By the time the data arrives, most of your paper's fate is already
decided. RCT, cohort, case-control: each design earns different claims,
and reviewers know the difference even when authors forget.

[Read Study Design Types -> /Study-Design-Types-RCT-Cohort-Case-Control.html]

Chapter one of the handbook, for exactly that reason.

Akshay
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

> **Voice pass v2 status:** sections 1-4 above carry the shipped v2 copy
> (personal note, Akshay, contractions). Sections 5 and 8-10 below are
> approved v1 content with signatures updated; each gets its full v2
> loosening when its sender is built, before its flag ever turns on.

# 8. Pro lifecycle (category: account unless noted)

## 8a. Pro welcome (flag: pro-welcome)

Sent minutes after entitlement activates. Replaces the free welcome when the
purchase came before any free history.

- **Subject:** `Your Pro plan is live`
- **Preheader:** `What just opened, and the best place to start.`

```
Hi {first_name},

Thank you. Genuinely - purchases like yours are what keep this site
running and the tutorials free.

Everything is open now: every lesson, every quiz, no practice cap, and
the certificate paths. Your XP and progress carried over exactly as they
were.

If you want a place to start, this is the next lesson on your track:

[{next_lesson_title} -> {next_lesson_url}]

One practical thing: there is a 14-day money-back guarantee, no questions
asked. If Pro is not what you expected, reply and I will sort the refund.

Akshay
```

## 8b. Day-7 Pro activation nudge (category: progress, flag: pro-nudge)

Only if no Pro lesson opened since purchase. Once ever.

- **Subject:** `A week in, one suggestion`
- **Preheader:** `You have not opened a Pro lesson yet. Here is the easiest way in.`

```
Hi {first_name},

You went Pro a week ago, and unless the data is lying to me, you have not
opened a Pro lesson yet. Life happens. But I would feel bad taking your
money for something you never used.

The easiest way in is the next lesson on your track. It picks up exactly
where your progress ends:

[{next_lesson_title} -> {next_lesson_url}]

Twenty minutes today and you will know whether Pro is going to work for
you. And if it is not, remember the 14-day guarantee: reply, and I refund
it.

Akshay
```

## 8c. Payment failed, day 3 (flag: dunning-note)

Paddle's own dunning runs first; this is one plain note from Selva if the
payment is still failing three days in. Verify Paddle's send schedule before
enabling, so nobody gets doubles.

- **Subject:** `A payment problem on your Pro plan`
- **Preheader:** `Almost always an expired card. One-minute fix inside.`

```
Hi {first_name},

Quick heads-up: your last Pro payment did not go through. This is almost
always an expired card or a bank being cautious, nothing dramatic.

Here is the fix, takes about a minute:

[Update your payment method -> {billing_update_url}]

Your access is unaffected right now. If the payment keeps failing, Pro
pauses on {grace_end_date}, and picks up exactly where it left off once
the card works again.

If something looks wrong on our side, reply and I will dig into it.

Akshay
```

## 8d. Cancellation confirmed (flag: cancel-confirm)

Sent when a cancellation is scheduled. Confirmation first, one honest
question second, zero retention theater.

- **Subject:** `Your cancellation is confirmed`
- **Preheader:** `Full access until {access_end_date}. What stays after, inside.`

```
Hi {first_name},

Done: your Pro plan will not renew. You keep full access until
{access_end_date}, and after that:

Stays: everything you finished, your XP, streak, certificates, the New
to R course, all tutorials, and 25 practice exercises a month.

Ends: the Pro lessons and quizzes.

No forms, no retention offers. Just one question, because it genuinely
helps: what was missing? Reply with a sentence if you have one in you.

Thanks for having been a customer.

Akshay
```

## 8e. Pro winback, expiry + 30 days (category: offers, flag: pro-winback)

Once ever per churn.

- **Subject:** `Your progress is where you left it`
- **Preheader:** `Nothing reset. Here is what is new since you left.`

```
Hi {first_name},

It has been a month since your Pro access ended. No pitch here beyond the
facts: everything you built is still on your profile, and if you come
back, you continue from exactly where you stopped. Nothing resets.

{recent_highlights}

Current plans are on the pricing page if the timing is ever right:

[See plans -> /pricing.html]

Either way, the free side is yours for good. Good luck with the R work.

Akshay
```

---

# 9. Team (category: account)

## 9a. Seat welcome (flag: team-welcome)

Sent when a member accepts their invite. Replaces the free welcome.

- **Subject:** `Your team seat on r-statistics.co is active`
- **Preheader:** `What the seat includes and where to start.`

```
Hi {first_name},

{org_name} set you up with a Pro seat. It is tied to this email address
and works like any Pro account: every lesson and quiz, unlimited graded
practice, and the certificate paths. Certificates are earned by you and
stay yours, even if you change teams.

A good first step is to pick your track:

[Choose a roadmap -> /roadmap/]

Your team admin is {admin_name} ({admin_email}) for seat questions.
Anything about the content itself, reply here and you get me.

Akshay
```

## 9b. Seat adoption note, day 14 (category: progress, flag: team-adoption)

To the org owner, only when seats sit unactivated. Once per billing cycle.

- **Subject:** `{active_seats} of {total_seats} seats are active`
- **Preheader:** `A resend button and a one-liner you can forward.`

```
Hi {first_name},

Two weeks in, a quick usage note: {active_seats} of {total_seats} seats
on your team have been activated.

Unclaimed invites sometimes just get buried, so here is a resend button:

[Manage your team -> {team_admin_url}]

And if it helps, forward this to the team. It is the one-liner I would
send: "We have r-statistics.co Pro seats - interactive R lessons with
certificates. Check your inbox for the invite, it takes a minute."

If seats are sitting unused because something is not landing, reply. I
would rather fix it than bill you for shelf-ware.

Akshay
```

---

# 10. Winback and orientation

## 10a. Free winback, 21 days dormant (category: progress, flag: free-winback)

Only for accounts with real progress (Persona C ghosts get silence, not
this). Once per dormancy; a site visit resets the clock.

- **Subject:** `Where you left off`
- **Preheader:** `A marker of where things stand, and one next step.`

```
Hi {first_name},

You have not been around for a few weeks. No drama. Just a marker of
where things stand, in case the timing works again:

{progress_snapshot}

The single next step, when you want it:

[{next_lesson_title} -> {next_lesson_url}]

And if R is off your plate for now, that is fine too. This is the last
nudge: from here we stay quiet apart from the essentials, and everything
above will be waiting.

Akshay
```

## 10b. Browser orientation, day 3 (category: progress, flag: orientation)

Only for signup_gate = browsing accounts with zero activity. Once ever.

- **Subject:** `Where to start`
- **Preheader:** `Three doors. One of them is probably yours.`

```
Hi {first_name},

You made an account a few days ago and have not picked anything up yet.
Completely normal, the site is big. Here is the honest map; pick the door
that sounds like you:

New to R, or rusty: the New to R course. Free forever, starts from zero.
[Start New to R -> /roadmap/new-to-r.html]

Already write some R for work: the Data Analyst track, free for you until
{pass_end_date}.
[Start the track -> /roadmap/data-analyst.html]

Just want to practice: the exercise hubs, 25 graded a month.
[Pick a hub -> /exercises/]

That is the whole email. One of those three doors is probably yours.

Akshay
```

---

# 11. Already live (reference, no copy changes here)

| Email | Trigger | Where |
|---|---|---|
| Purchase fulfilment | Paddle webhook | functions, live |
| Renewal reminder | subscription period end approaching | functions, live |
| Signup admin notification | confirmed signup, to owner | notify.ts, live |
| Magic link | Supabase auth | Supabase SMTP via ZeptoMail |

# 12. Send-order sanity example

A day-27 user who also completed a hub and visited pricing yesterday gets ONE
email: the coupon (pass-deadline outranks intent outranks milestone). The
others wait for their next eligible day or are dropped if stale.
