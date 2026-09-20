# The daily operator digest

Built 2026-09-21. Live. One email a day to the admin address, 03:00 UTC
(08:30 India), reporting the previous UTC day.

## What it is, and what it deliberately is not

The ask was a list of counts: sign-ups, sign-ins, lessons finished, wall
hits, purchase intent, emails sent and opened. All of that is in it.

What it is not is a dashboard in an inbox. A dashboard in an inbox gets read
for a fortnight and then filtered, because a wall of numbers with nothing to
react to teaches you there is nothing to react to. So three rules shape it:

**Every number carries a baseline.** "6 sign-ups" means nothing. "6 sign-ups,
7-day mean 4, up 2" means something. Each row shows yesterday, the mean of
the seven days before it, and the direction. A move is only called out when
it is both proportionally large (1.6x or 0.55x) and absolutely large
(3 or more), so a day going 1 to 3 does not shout as loudly as one going
400 to 1200.

**The top of the funnel is in it even though it was not asked for.**
Sign-ups without visits is a ratio with one side missing: six sign-ups on
400 visits and six on 1,800 are different days. `traffic_daily` already
carries visits, pageviews and the top pages.

**It watches for silence.** The most expensive bug on this site was a signal
that recorded zero rows for months while everything downstream looked
healthy: `pro_wall_hit`, dropped by an allowlist, blocking an email that had
its flag on the whole time (fixed 2026-09-21, `6314b5a796`). A count that
used to happen and has stopped is now reported as loudly as a spike, because
the quiet one is the one nobody notices.

**Most days should say nothing.** When nothing is notable and nothing is
broken, the email opens with one line saying exactly that, and the numbers
sit below for anyone who wants them. The exceptions are what should stand
out.

## What it reports

| Section | Rows |
|---|---|
| Who arrived | visits, pageviews, sign-ups, people who signed in |
| What they did | signed up and solved the same day (activation), came back from an earlier day (retention), people who solved, exercises solved, people who finished a lesson, lessons finished |
| Intent and money | pricing views, Pro lesson walls hit, sign-in walls hit, checkouts opened, emails left at checkout, price alerts set, purchases |
| Email | sent, opened, clicked, bounced, unsubscribed, plus the open and click rate |
| Earned | badges, certificates |

Then three detail tables: which email templates sent and how they performed,
every intent signal recorded with its count (this is the silence tripwire in
raw form), and the most visited pages.

**Activation and retention are the two rows that were not asked for and
matter most.** Activation is somebody who signed up and solved something the
same day; it is the single most predictive number a learning site has.
Retention is somebody active who signed up before that day. Acquisition
without either is a leaky bucket you are filling faster.

## Alerts

Deliberately rare. An alert that fires most days is furniture.

- any email send error
- bounce rate above 5% on 20 or more sends (a sending-domain risk)
- a core count going silent: visits, sign-ups, solves, emails sent, pricing views
- checkouts opened and none completed
- three or more sign-ups and none of them solved anything

## Where it lives

- `functions/_lib/digest.ts` - the numbers, the HTML and the text
- `functions/api/admin/digest.ts` - look at it on demand, admin-gated
- `functions/api/cron/email-brain.ts` - the once-a-day send, on the hourly heartbeat

Nothing new is written and no schema changed. It is about a dozen grouped
queries over bounded date ranges against tables that already exist.

## Controls

| | |
|---|---|
| See today's | `GET /api/admin/digest` (also `?format=text`, `?format=json`) |
| Send it now | `GET /api/admin/digest?send=1` |
| Force from the cron | `POST /api/cron/email-brain?force_digest=1` |
| Turn it off | KV `flag:digest-email` = `off` (absent means on) |
| Change the hour | `DIGEST_HOUR_UTC` in `digest.ts` |

The once-a-day guard is the `email_events` row the send itself writes
(`email_key = 'digest'`), so a retry, a second Worker or a manual run cannot
produce two.

## Worth adding later

- Revenue, not just purchase counts. `subscriptions.amount` and `.currency`
  are both null on every row today, so the digest can only count purchases.
  Filling those from the Paddle webhook would let it report money.
- Quiz and assessment completions. `quiz_attempts` and `assessment_attempts`
  exist and are not in the digest yet.
- A weekly edition on Mondays with seven-day totals and the trend, which is
  the right cadence for judging whether a change worked.
