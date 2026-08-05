# Growth playbook 2026: from organic accidents to a working funnel

Written 2026-08-02. Based on primary-source research into 20+ education platforms
across developer education, medical/nursing test prep, finance education, legal
and accounting certification, and language learning. Every number in this
document is sourced. Where a figure is a vendor claim or an inference rather than
a measured fact, it says so.

---

## Part 1: What is actually wrong

You have two sales. Both were organic: strangers found the site through Google,
read something, decided to buy, and bought without you ever knowing they existed.
That is a real signal, because it proves the product converts cold traffic with
zero assistance. It is not a strategy, because you cannot make it happen again on
purpose.

The reason is structural. Your funnel currently has two states:

```
1,836 ranking pages  ->  pricing page  ->  checkout
```

There is nothing in between. Someone who lands on your ANOVA tutorial, finds it
useful, and is not ready to spend money today has no way to stay in touch with
you and you have no way to reach them. They leave and are gone permanently. Every
platform studied in this research has something in that gap. You have nothing.

The second problem is that you have no way to talk to the people who *did* buy.
There is no customer-facing email anywhere in the fulfilment path. Both buyers
received a Paddle receipt and nothing else. No welcome, no "here is how to start",
no renewal warning.

Everything in this plan is either filling that gap or fixing that silence.

---

## Part 2: The numbers to plan against

Getting these wrong is the most likely way this plan fails, so they come before
the work.

### Conversion rate

Boot.dev converts **5.49%** of registered users to paying (336,271 registered,
18,255 paying individuals, October 2024 data). Do not plan against that number.

Their registered users arrive having already decided to change careers into
backend development. Yours arrive from a Google search for "how to interpret
p-value in R", read one page, and leave. That is informational intent, not
transformational intent, and it converts an order of magnitude worse.

**Plan against 0.5% to 2% free-to-paid.** If you beat it, good. If you build a
budget or a roadmap assuming 5%, everything downstream is wrong.

For comparison, the only hard freemium number in the research: Duolingo converts
**~9% of monthly active users** to paid (FY2025 10-K: 133.1M MAU, 12.2M paid
subs) with **no learning content behind the paywall at all**. Typical edtech
freemium sits at ~2.6% (vendor benchmark, unverified methodology). Duolingo's 3x
outperformance on an entirely open content library is the strongest single
argument against paywalling your tutorials.

### Revenue per customer

Boot.dev's inferred blended ARPU is **~$133/year against a $399 list price**.
That gap is parity pricing and short monthly runs. Their revenue-weighted median
customer is not a US annual subscriber.

Your two sales: $342.51 net from a Lifetime purchase, $60.89 net from an annual
single-track. Your largest sale by a factor of five was the most expensive tier.
Adam Wathan observed the same thing on his $100K launch: *"the expensive tier was
outselling the low tier."* Do not assume price is your barrier.

### What Paddle takes

Verified from your own transactions, not from their published rate card:

| | Mirko (Lifetime) | Amrul (annual track) |
|---|---|---|
| Customer paid | EUR 319.87 | $72.15 |
| Tax (Paddle remits) | EUR 0.00 | $7.15 |
| Paddle fee | EUR 16.42 / $18.53 | $4.11 |
| **You receive** | **$342.51** | **$60.89** |

`fee_rate` reports as **0.05** on both. Your effective rate is ~5%, better than
the 5% + 50c you had budgeted. As Merchant of Record, Paddle absorbs global tax
compliance, which is most of what that 5% buys.

---

## Part 3: Two decisions that shape everything below

### Decision 1: Where the wall goes

There are two ways to paywall an education site, and they are not equivalent.

**Chapter-depth wall** cuts a course off partway through. DataCamp stops at
chapter 1. Boot.dev at chapter 4, lesson 1. 365 Data Science at section 4. ZTM
after section 1.

**Feature-type wall** gives away whole courses and gates the *goods* instead.
Codecademy's free courses include every lesson; projects, quizzes and
certificates are paid. Dataquest gives away introductory courses whole and gates
assessments and certificates.

**Take the feature wall.** Your competitive advantage is 1,836 individually
ranking, fully readable tutorial pages. A chapter-depth wall fights your own SEO.
A feature wall does not touch it. Your graded exercises, assessments, and
certificates are the paid goods, and you are building them anyway.

Boot.dev states the same position: *"all of the content on Boot.dev is free. So
why pay? Put simply: interactivity."*

**Specifically do NOT truncate your tutorial pages mid-sentence** the way
Educative does, even though it is the sharpest capture mechanic found. Google
permits it if you declare it with `isAccessibleForFree: false` and `hasPart`
structured data, so the risk is not primarily a penalty. The risk is the trade:
those pages rank and earn links *because* they are the complete free answer, and
that is why two strangers found you and bought. You would be spending your only
durable asset to buy a capture mechanic you can get four other ways.

Where the free-account wall IS safe: interactive lessons, exercise hubs, and
assessments. Those are already gated, carry no search weight, and nobody links to
them.

### Decision 2: Certificates are the paid good

Five of five major platforms gate the certificate: DataCamp, Codecademy, 365 Data
Science, Dataquest, Boot.dev. The only free-certificate operator found is
HackerRank, whose revenue is entirely employer-side, making the certificate
supply-side acquisition for a hiring marketplace. That is a different business.

This resolves the open question about giving free users certificates from the
Statistics, ggplot2 and Time Series handbooks while gating Bayesian and A/B.
Splitting the credential by *topic* is something nobody does and makes the
certification look arbitrary. The field splits by *depth*:

- **Free:** the diagnostic result, section 1 of everything, all tutorial content
- **Paid:** graded exercises, track credentials, assessments

Coursera's variant is worth understanding because it is cleverer than a content
paywall: audit is free forever, but the certificate requires an **active paid
subscription at the moment of completion**. That is a duration tax, and it makes
the learner's own procrastination the revenue driver.

---

## Phase 0: Unblock and stop the bleeding

**Why first:** every email-dependent item below is blocked on 0.1, and you
currently have paying customers sitting in silence.

### 0.1 Top up ZeptoMail credits [OWNER ACTION, blocks everything]

Transactional email is returning 429 TM_5001. Until this is resolved, nothing in
Phase 1 or 2 can ship. This is a billing action only you can take.

**Verify after:** send a test through `notify.ts` and confirm delivery.

### 0.2 Customer fulfilment email

**What:** an email that fires on `transaction.completed` telling the buyer their
access is live, what they just bought, where to start, and how to reach you.

**Why:** there is currently no customer-facing email anywhere in the webhook
path. Both buyers got a Paddle receipt and nothing from you. A EUR 320 purchase
followed by silence is the single most likely cause of a refund request or a
chargeback, and as Merchant of Record a chargeback is a mark against your Paddle
account, not just a lost sale.

**How:** `functions/api/webhooks/paddle.ts` already has the entitlement branch
and one `notifyAdminEvent` call. Add a customer send alongside it. The lifetime
branch and the subscription branch need different copy (one has no renewal).

**Effort:** small. The webhook logic exists; this is a template plus a send.

**Depends on:** 0.1

### 0.3 Fix the subscriber metric

**What:** your dashboard counts subscription rows. Lifetime purchases create no
Paddle subscription entity, so Mirko does not appear. The metric reads
"subscribers: 1" while you have two paying customers, and it hides the one who
accounts for 85% of revenue.

**How:** count entitled users instead: `pro_until = -1` OR `pro_until > now`.
The `-1` sentinel is the documented lifetime marker in `functions/_lib/db.ts`.

**Effort:** tiny. One query change.

### 0.4 Renewal reminder

**What:** an email roughly seven days before `next_billed_at`.

**Why:** Amrul's subscription is `collection_mode: "automatic"` and renews
2027-07-26. He will be charged without warning twelve months after purchase.
Unannounced annual renewals are a leading trigger of chargebacks and angry refund
requests. Paddle can send these; check whether it is enabled on your account
under customer notifications, and if not, send your own.

**Effort:** small if Paddle's toggle covers it, medium if you build it.

### 0.5 Fix the checkout-opened admin email

The "Amount (minor units)" label is showing raw minor units. Cosmetic but it
makes your own alerts hard to read at a glance.

---

## Phase 1: Build the capture layer

**Why this phase:** this is the missing middle of the funnel. Ordered by effort,
cheapest first, so you get wins while the big one is being built.

### 1.1 The 404 page captures email

**What:** put an email field on `404.html`. ZTM's copy: *"Seems you got lost,
enter your email for directions."*

**Why:** you already have a custom 404 doing nothing. Someone who hits it came
from a broken link or a stale search result, so they were looking for something
specific on your site. That is a warm visitor being thrown away.

**Effort:** tiny. Half a day.

**Measure:** submissions per week.

### 1.2 Gated PDF of ungated content

**What:** the tutorial stays fully readable on the page. Add "Want a PDF version?
Send it to me" which asks for an email and delivers the PDF.

**Why:** ZTM runs exactly this, and it is the safe version of the Educative
truncation wall. Nothing is hidden, nothing is cloaked, the SEO content is
untouched, and you capture the subset of readers who want to keep it. Those are
disproportionately the serious ones.

**Which pages:** start with your highest-traffic 20 tutorials and the handbook
chapters. Do not do all 1,836.

**Effort:** small-medium. Needs a PDF generation step (your build system already
produces clean HTML) plus the form and the send.

**Depends on:** 0.1

**Measure:** conversion rate of pageview to PDF request, per page.

### 1.3 The deferred account ask on WebR pages

**What:** anonymous visitors keep running R exactly as they do now, with no wall.
After a visitor has run code some number of times, a non-blocking prompt appears:
*"You have been running code. Create a free account to save your work and track
progress."* With a visible dismiss.

**Why this shape specifically:** Boot.dev's demo is the best-executed version of
this in the research. The sequence matters:

| Step | What happens |
|---|---|
| 0-1 | Two qualifying questions |
| **2** | **First real lesson. Run works logged out.** |
| 3 | Pick a goal: "earn a reward by gaining XP in the next 24 hours" |
| 4-5 | Two more lessons |
| 6-8 | Five profiling questions, deferred to here |
| **9** | **The ask: "Save your progress. You gained some XP!"** |

Two design decisions do the work. The profiling questions sit **after** the value
is delivered, not before. And the goal accepted at step 3 is stored in
localStorage and **replayed after registration**, so by the time the ask arrives
the visitor has something to lose. The signup reads as loss-aversion rather than
a toll gate.

Roughly 30 seconds and four interactions from landing to executing real code with
no identity given up. Contrast DataCamp, which redirects to signup before a
single line runs.

**Why you are well placed:** WebR already runs client-side on every tutorial
page. You have the hard part. What is missing is the XP-and-progress object that
makes an account worth creating, and your exercise hubs already mint exactly that.

**Do NOT copy:** Boot.dev's marketing email toggle is opt-out and pre-ticked
(`aria-checked="true"` by default). Your existing plan for an unticked opt-in with
an audit trail is both the right call and the one that survives GDPR scrutiny.

**Effort:** medium.

**Measure:** anonymous-run-to-account conversion; and watch tutorial page bounce
rate for regression.

### 1.4 The free R Skills Diagnostic [the big one]

**What:** a standalone free assessment, roughly 10 to 20 minutes, gated behind an
account with no card, returning a score, a percentile against other learners, and
a named list of weak areas each linked to the chapter that fixes it.

**Why this is the highest-value item in the plan:** DataCamp, Pluralsight and
HackerRank independently converged on this exact design. Three companies with
real budgets, real data and real A/B infrastructure all arrived at the same
mechanic. That is worth more than any benchmark table.

Verbatim from DataCamp's own documentation: *"DataCamp Signal is an adaptive
assessment tool... Each assessment takes about 10 minutes to complete."*
*"Everyone with an account can take DataCamp Signal assessments."* *"Take
unlimited assessments for free. No credit card required."* And the output:
*"you will receive an assessment score and percentile ranking, your skill level,
an overview of your strengths and skill gaps, and personalized course
recommendations."*

Score, then percentile, then named gap, then the link that fixes it, then the
wall. All on one screen. The assessment manufactures the felt deficiency and
sells the remedy in the same view.

**You are ~80% built.** The assessment engine exists on the `assessments` branch:
serve/grade/percentile/cooldown, 27 assessment definitions, the player UI, the
question banks. What is missing is the framing (standalone diagnostic rather than
end-of-section quiz), the result screen, and the links from your 1,836 pages.

**Design rules that are not optional:**

**Failure must be invisible.** HackerRank: *"If you don't pass, we'll keep your
test scores private."* DataCamp: *"your assessment results are private to you."*
Both converged on this independently. Zero social downside is what maximizes
funnel entry. Never put a public leaderboard on the diagnostic.

**Abandonment must not burn an attempt.** DataCamp: *"The attempt will only count
if you complete the assessment, so if you cannot finish, that will not count
against you."* They also support resuming. Your current 24-hour cooldown combined
with an attempt that burns on abandonment would punish someone who closed a tab.
Check how `submit.ts` treats an incomplete attempt.

**Cooldown should differ by purpose.** DataCamp allows twice per week. Your
24-hour cooldown is right for a *graded certification* attempt and wrong for a
*free diagnostic* whose job is capture.

**Length: run the diagnostic longer than the section quizzes.** Your
`QUESTIONS_PER_ATTEMPT = 12` is fine for a pass/fail gate at 75%. It is thin for a
*published percentile*. Pluralsight's engine maintains a ratings deviation
alongside the score and puts ~20 questions as where that confidence becomes
statistically meaningful, and theirs is adaptive, which buys precision per item
that a fixed form does not get. If you are going to show someone "62nd
percentile", that number needs to survive the question of whether a different
draw of 12 would have said 45th.

You already handle the other half well: `MIN_ATTEMPTS_FOR_PERCENTILE = 50` gates
on cohort size. AMBOSS does the equivalent by requiring 40+ answered questions
before showing peer comparison, and publishes the method (Equated Percent
Correct, trailing 12 months). That methodological transparency is itself a
credibility asset and very much your register.

**Offer tiered lengths.** Magoosh runs four entry points from a 20-minute section
test to a 2-hour full practice test, so a cold visitor can pick a small
commitment instead of bouncing. Consider a 5-minute micro-diagnostic and a
20-minute full one.

**No certificate on the diagnostic.** DataCamp states outright: *"Currently, we
don't issue statements of accomplishment for assessment completions."* The
assessment is the lead magnet; the certificate is the paid good. Keep the two
jobs on separate objects.

**Then link it from everywhere.** Every one of your 1,836 pages becomes a landing
page for it. Your 74 tools should terminate in it too, rather than in nothing.
That tool surface is the same land-grab that the NBME score calculator sites
occupy in medical education purely because the incumbents left it unowned.

**Effort:** medium-large, but mostly assembly of existing parts.

**Depends on:** 0.1 (for the result email), and merging the `assessments` branch.

**Measure:** starts, completions, start-to-account conversion, and
diagnostic-to-purchase over 90 days.

---

## Phase 2: Lifecycle email

**Why this phase:** capture without follow-up is just a slower way of losing
people. This is what makes Phase 1 worth anything.

### 2.1 The event schema

**What:** the set of user properties you record and can trigger emails on.

Dataquest published theirs by accident through a public Mailchimp preference
centre. It is effectively a competitor's lifecycle spec, free:

```
SIGNUPDATE     STARTINGPO (starting point)   HRSDESIRED
HRSSPENTCW     MISSIONSTA / MISSIONCOM       COURSESTAR / COURSECOMP
PAYMENTPAG     NUMLSNDONE                    DAYSACTIVE
IPOINTS        LNEXT_RANK / PTS_NRANK        RECENTACTI
SEENRECENT     COUPONCODE                    PLAN
```

Five streams: Newsletters, Webinars and Events, Product Announcements,
Onboarding, Promotions.

Two of those fields are the interesting ones. `PAYMENTPAG` is a payment-page
visit date, meaning they trigger on *visited pricing and did not buy* — precisely
the case you hit with the stalled Swiss buyer. `PTS_NRANK` is points to next
rank, meaning they email people about how close they are to the next tier, which
is a decay mechanic delivered by email.

You already generate every one of these signals through the exercise and XP
backend. This is a ready-made build list.

**Effort:** medium.

### 2.2 Single opt-in, offer delayed 30 days

**What:** no double opt-in confirmation step, and no purchase pitch in the first
month.

**Why:** this is the hardest published number in the entire research. Motley Fool
A/B tested it at 35,000 recipients per file. Double opt-in was losing **40% of
signups at the confirmation step**. Switching to single opt-in grew the house
file **130%** and paying subscribers **45%**, even though headline conversion
rates fell. They delivered the incentive plus a welcome, then made the
subscription offer **30 days later**.

Two more findings from the same programme that run against standard practice:

- Adding social proof to the top-of-funnel email capture modal (*"Join over
  121,837,512 other Fools..."*) **cost 11.2% of signups**
- Removing testimonials from the *order* page hurt transactions, AOV and revenue
  per session

Their published conclusion: **social proof helps at the point of purchase and
hurts at the top of the funnel.** Worth testing rather than assuming, but it is
the opposite of what most sites do.

**Effort:** small, mostly a configuration and copy decision.

### 2.3 Core sequences

| Sequence | Trigger | Content |
|---|---|---|
| Welcome | Account created | What you get free, one recommended starting point |
| Diagnostic result | Assessment completed | Score, percentile, named gaps, chapter links |
| Day 3 / Day 7 | Account age | Check-in tied to what they actually did |
| Fulfilment | `transaction.completed` | Access live, where to start (Phase 0.2) |
| Renewal | 7 days before `next_billed_at` | What renews, how much, how to cancel |
| Abandoned checkout | Transaction stuck in `ready` | Paddle `?_ptxn=` resume link, max 2 nudges |
| Reactivation | 30+ days inactive | Points to next tier, what is new |

**On the abandoned-checkout job specifically:** this is already designed and not
built. A cron lists transactions stuck in `ready` for more than a few hours and
emails the customer their `?_ptxn=` resume link, which Paddle generates and which
drops them into a prefilled checkout. Cap at two nudges. The same job should
alert you on `needs_retry` and `failed` notification states, so a signature fault
surfaces in minutes instead of the week it took last time.

Benchmark, flagged as vendor-published: three-email abandoned-cart flows across
the first 72 hours generate ~70% more recovered orders than a single send.
Win-back reactivation medians of 14.7% (Klaviyo) and 13.2% (Omnisend).

**Effort:** medium. Build them one at a time, fulfilment first.

**Depends on:** 0.1, 2.1

---

## Phase 3: Retention mechanics

**Why this phase:** everything above brings people in. This is what stops them
leaving. It comes third because retaining nobody is pointless.

**Design constraint, from Boot.dev, worth adopting verbatim:** *"The purpose of
all our game mechanics is to encourage great learning habits."* They rebuilt boss
battles in March 2024 after admitting *"we even had some students spend an...
unhealthy... amount of time doing coding lessons as a result... we're making some
big tweaks to encourage less competition and more collaboration."*

### 3.1 XP-priced hints

**What:** revealing a hint costs the learner XP on that exercise rather than
being free or being metered by a quota.

**Why:** this is the cleverest single mechanic found. Boot.dev charges in-game
currency for AI tutor access, **or the learner accepts a 50% XP reduction on that
lesson**. Viewing the full solution costs more. No quota UI, no token counter, no
upgrade nag, and the pedagogy is preserved because the cost is real but the help
is always available.

**Why it fits you better than it fits them:** their version exists partly to cap
AI spend. You already have pre-authored hints (`Scripts/batch_hints.py`), so
there is no per-use cost at all. You are only using the price signal for its
pedagogical effect, which is the good half.

Their usage data: hint/tutor use runs 9% in beginner Python but **32-35% in
advanced courses**. Demand scales with difficulty. Statistics is dense with
"why is my model wrong" moments, so expect the high end.

**Verify first:** confirm how your existing hint system is wired and whether XP is
awarded per-exercise in a way that can be reduced.

**Effort:** small-medium.

### 3.2 The monthly changelog

**What:** a monthly post listing what shipped, with screenshots.

**Why:** Boot.dev has published 45 consecutive monthly editions since October
2022, in the first ~12 days of each month. Fixed skeleton: a short personal
opening letter, then numbered **patch notes** (3-7 named items, biggest first,
each with a screenshot or GIF), then a handful of one-line minor improvements,
then **"What Is Yet to Come"** — a roadmap tease that is the actual retention
mechanic. About nine items an issue.

Two things worth noticing. A brand-new mechanic appears only every 3-5 months; in
between it is polish, and they ship one system then refine it for six consecutive
months. And unshipped roadmap items get restated verbatim for up to ten straight
issues with no embarrassment.

It is pure retention with no SEO pretence, and it is the cheapest item in this
phase.

**Effort:** small, recurring. Two to three hours a month.

### 3.3 Spaced repetition practice

**What:** a generator that surfaces problems on topics the learner is starting to
forget, weighted toward concepts they have struggled with.

**Why:** Boot.dev's "Training Grounds" launched August 2025: *"Infinite coding
challenges personalized to your programming journey"*, surfacing *"topics you
might be forgetting"* and weighting *"toward concepts you've struggled with."*
40,000+ rated challenges; 82,578 completed in December 2025 alone.

**This may fit statistics better than it fits backend dev.** Test selection,
assumption checking, and output interpretation are exactly the things people
forget between projects, because they use them episodically rather than daily.
You have 4,390 graded exercises to seed the weighting from.

**Effort:** medium-large.

### 3.4 Streak insurance

**What:** a mechanism that absorbs missed days instead of breaking the streak.

**Why:** Boot.dev sells "frozen flames" covering four days and "embers" that bank
productive days for guilt-free time off, which they describe as turning a daily
streak into *"more of a 5 days a week streak."* The streak break is the single
most common quit trigger in daily-habit products, and this removes it.

They also widened what counts: a GitHub commit extends the streak, not just a
lesson. Your equivalent would be a solved exercise, a passed quiz, or a completed
lesson step.

DataCamp's version: streaks require 250XP/day, freezes are automatic and capped
at two.

**Effort:** small-medium. You already have streaks and best-streak.

### 3.5 Progressive gated quizzes

**What:** answer one question correctly and the next unlocks; finish the set to
complete the lesson and earn the reward.

**Why:** Boot.dev shipped this in July 2026 and describes it exactly that way. It
converts a quiz from a test into a sequence, which changes the felt experience
from evaluation to progress.

**Effort:** small. Your quiz player already exists.

### 3.6 What NOT to build

**Competitive leagues.** Boot.dev puts learners into leagues of exactly 25 for
four-week cycles, unlocked at level 10, and built them because the global
leaderboard *"became dominated by experienced developers speedrunning the
courses."* The mechanic is sound and the scoping fix is smart.

It is still the highest-risk copy for you. It works because their audience is
young, gaming-native, career-switching, and all running the same 12-month race. A
pharma biostatistician or a grad student fitting models for a thesis will not
compete for XP rank against strangers, and a public competitive ladder actively
signals "toy" to the professional-credibility segment you are selling
certificates to.

If you want the social mechanic, scope it to **private cohorts** rather than
global leagues.

**The fantasy skin.** Wizard bear, spellbooks, boss raids, plush toys.
Demographically load-bearing for Boot.dev, repellent for academics and working
analysts. Take the *scheduling* — seasons, events, a reason to show up this month
— without the costume.

**A Discord community.** There is **no rigorous independent evidence that
community reduces churn or lifts LTV** in developer or data-science education. No
cohort comparison of joiners against non-joiners, no A/B test, no
creator-published retention delta. The most defensible number in that entire body
of research is the Community Roundtable's finding that **under 10% of community
programs can measure their ROI at all**.

Two data points make the case. DataCamp has ~19M learners and no community
whatsoever (`discord.gg/datacamp` returns 404). And freeCodeCamp's forum has 2.1M
lifetime posts but **761 people posted in the last 30 days** — 0.21% of registered
users. That archive earns its keep as indexed search surface, not as a community.

For a solo operator, moderation cost against unmeasurable return is the wrong
trade. See Phase 5.2 for the alternative.

---

## Phase 4: Pricing and structure

**Why this phase:** these are independent of Phases 1-3 and can run in parallel.
Grouped here because they are decisions rather than builds.

### 4.1 Never run a countdown timer or a strikethrough sale

**Why, with the strongest evidence in the research:**

Luguri and Strahilevitz, *Journal of Legal Analysis* 13(1):43-109 (2021), two
census-weighted nationally representative experiments. Study 2, n = 3,777, against
a 14.8% do-nothing control:

| Technique | Acceptance |
|---|---|
| Hidden information | 30.1% |
| Obstruction | 23.6% |
| Social proof | 22.1% |
| Default selection | 20.1% |
| Confirmshaming | 19.6% |
| **Scarcity / countdown timers** | **14.3%** (no significant effect) |

**Countdown timers landed marginally below doing nothing.** Meanwhile Study 1
(n = 1,963) found the aggressive-pattern condition produced significantly higher
negative affect (3.94 vs 2.96-3.05, p < 0.001) and a **7x dropout rate** (65 vs 9).

There is also a legal dimension. **Williams v. Udemy settled for $4,000,000** over
a $199.99 strikethrough with "94% off" down to $10.99, plus countdowns that kept
showing "ends in 0s" after expiry. The governing rule, **16 CFR 233.1**, requires a
former price to be one at which the product was *"openly and actively offered for
sale, for a reasonably substantial period of time, in the recent, regular course
of his business."* A flat pricing page passes that automatically; a permanent
"was $289" fails it.

And the mechanic is trivially caught. Educative was captured running two
different countdown deadlines *and* two different discount percentages for the
same "TODAY", same URL, minutes apart, US versus India render.

Udemy's own words to their instructors are the cleanest summary: fixed price
deals *"train students to wait for the lowest price and lead to an erosion of your
average selling price."* Their end state is roughly **$15.94 realized per
buyer-month against a $199.99 list**.

Boot.dev, at $10M ARR, has zero countdown copy anywhere, confirmed by grepping
all 200 of their JS chunks.

### 4.2 Purchasing power parity pricing

**What:** structurally lower prices for lower-income countries, presented as a
regional license rather than a discount.

**Why:** it is the only discount axis every credible operator uses. They segment
by **who you are** (region, student, team), never by **when you buy**. A regional
license says "this price is right for you." A countdown says "this price is a
trick and you must be fast to catch it."

Boot.dev's actual five-tier table, verified against their API. Discount off local
full price:

| | |
|---|---|
| India | 78-82% |
| Turkey | 75% |
| Philippines, Pakistan, Nigeria, Russia | 74% |
| Vietnam | 73% |
| Egypt | 72% |
| Poland | 57% |
| South Africa | 52% |
| Mexico | 51% |
| Brazil | 50% |
| Australia | 33% |
| UK | 23% |
| Canada | 11% |
| Germany | 7% |
| US | 0% |

**The implementation detail that matters:** Josh Comeau's regional licenses *"can
only be accessed within your home region"* — entitlement-level locking rather
than IP detection at checkout. That survives VPN abuse without needing to detect
anything. He also closes upgrade arbitrage: *"Any future discounts or sales cannot
be applied to upgrades."*

**Relevance to you:** your one single-track buyer is Indonesian and paid full
price, so parity is not rescuing a lost sale there. It is a volume lever for
markets where your traffic is large and conversion is near zero. You are also
India-based with a large Indian R audience.

**Honest caveat:** **nobody has published PPP conversion-lift numbers.** Data
School runs a 25-75% band across 160+ countries and has published no results.
Every "PPP increases revenue" claim traced back to a vendor testimonial with no
methodology. If you roll it out, instrument it properly — you would be running
the experiment the field is missing, and it would be worth publishing.

**Known objection**, from a 169-point HN thread: *"a millionaire in Turkey gets it
for $4 while a homeless American single mother has to pay $20."* And the branding
cost: at checkout you are *"essentially saying 'your country has a shit
economy'"*. Frame it as a regional license, not a pity discount.

### 4.3 Extend the refund window to 30 days

**What:** match the field.

**Why:** yours is 14 days on a cheaper product than everyone running 30. Observed:
Boot.dev 30 days, 365 Data Science 30, ZTM 30, Josh Comeau 30, Babbel 20,
Dataquest 14, Educative none ever.

Boot.dev treats it as a conversion lever rather than a policy footnote, and says
so on the pricing page: *"There's no risk, cancel anytime. We don't tolerate
unhappy students: ask for a refund within 30 days and it's yours."* And: *"We
absolutely hate dark patterns, so we've made it easy to cancel."*

**Effort:** trivial. It is a policy and a paragraph.

### 4.4 Keep the Lifetime tier

**What:** deliberately diverge from Boot.dev here.

**Why:** they reject lifetime explicitly: *"Due to the nature of the interactive
features (AI chats in particular...), we have ongoing costs to host and maintain
Boot.dev. Lifetime purchases just don't really make sense in that paradigm."*

That reasoning is about **server-side code execution and per-user AI chat**. You
run R client-side in WebR at near-zero marginal cost. Your cost structure
genuinely supports one-time pricing where theirs does not, and your largest sale
to date was Lifetime at $342.51 net. Do not copy their rejection.

Related: your audience is more episodic than theirs — people arrive because a
paper or a model is due, finish, and leave. That argues *for* one-time pricing,
not against it.

### 4.5 Referrals pay on retention, never on signup

**Why:** three independent operators converged on this.

- **UWorld:** gift card only after the referred subscription is **30 days old**,
  and only on a qualifying purchase of **$199 or more**
- **Dataquest:** "Give 20, Get 20" vests **30 days after a new subscriber pays at
  least $50**
- **Boot.dev:** rebuilt deliberately against farming — 2020 paid both parties at
  signup, 2026 pays only when the recruit reaches **level 20**

For a solo operation, pay in product: "refer someone who stays 30 days, get 30
days free" costs nothing in cash. Barbri pays campus reps entirely in product — a
free bar review course worth $2,695 for about an hour of tabling a week — which is
why it scales.

### 4.6 Certificates as a distribution channel

**What:** design the certificate to be posted, not filed.

**Why:** HackerRank gives certifications away free and states the reason in their
own copy: *"add it directly to your LinkedIn profile"*, *"industry-recognized,
helping your LinkedIn profile stand out to recruiters."* Every certificate posted
is a free branded impression.

A certificate that lives in a dashboard is a completion device. A certificate with
a verification URL on your domain is an acquisition channel that compounds with
every student.

**The cheapest version**, from ZTM: they grant an "Alumni" Discord role only to
people who **complete a course AND publicly post the certificate**. That fuses the
completion incentive to testimonial generation in a single grant.

**Anti-gaming:** Educative gates certificates on **time-on-task, not completion**:
*"Marking a course as complete does not unlock the certificate."* Failed
assessments get a 7-day cooldown with two bonus attempts. If certificates are
meant to be shared publicly, that layer is what keeps them worth sharing.

**Also from Boot.dev:** custom self-assembled paths award **no** certificate; only
curated career tracks do. Certificate scarcity is deliberately tied to the
curated path.

### 4.7 Own a named readiness standard

**What:** a published, defined bar such as "R Analyst Ready", measurable only
inside your system.

**Why:** Becker invented "Exam Day Ready" and published its exact definition: 80%
of lecture videos watched, 80% of practice questions correct, 50%+ on mock exams.
Archer publishes that *"scoring high or very high in four consecutive assessments
aligns with a 98.98% NCLEX pass rate."*

The strategic move is owning a named threshold only your product can measure, so
"am I ready?" becomes a question only you can answer.

You have no external exam date, so the standard has to be built honestly from
your exercise completion, assessment scores and XP data, published openly with
its methodology. AMBOSS does exactly this for percentiles and the transparency is
itself the credibility asset.

**This is also a second revenue line.** UWorld sells NCLEX Readiness Assessments
at **$25 each, separately from the question bank**, to people who are already
subscribed, because practice and verdict are different psychological products. A
timed, rationale-suppressed, scored simulation is something people pay for on top
of the thing that teaches them.

---

## Phase 5: Acquisition

**Why last:** every channel below is more expensive and less certain than the
work above, and most of them require the email list from Phase 2 to function.

### The finding that reframes this phase

Boot.dev's blog post count by year:

| 2019 | 2020 | 2021 | 2022 | 2023 | **2024** | **2025** | 2026 (Jan-Jul) |
|---|---|---|---|---|---|---|---|
| 17 | 108 | 84 | 59 | 62 | **19** | **18** | 102 |

They effectively abandoned content for two years. **That gap is exactly when
revenue went from $110K/month to $1M/month.** Lane Wagner has said on record he
*"focused on [SEO] for too long."*

Their actual engine during that period was **creator sponsorships at roughly
$200K/month**, running through ThePrimeagen and gaming channels, tracked by promo
codes because the traffic arrives as direct, at a reported 2-3x month-one ROAS.
Their own YouTube channel (173K subscribers, 201 videos) is not the channel;
other people's channels are. Their affiliate programme is invite-only and
deliberately unadvertised — `/affiliate`, `/partners`, `/referral`, `/ambassador`
and `/creators` all 404.

**Two conclusions, and they pull in opposite directions.**

First: **the acquisition half of the Boot.dev playbook is capital-gated and not
currently available to you.** You cannot spend $200K/month off two sales. No
amount of execution discipline substitutes for that.

Second: **do not conclude SEO does not work.** Boot.dev deprioritized content
because "learn to code" is one of the most contested keyword spaces on the
internet and they were losing to freeCodeCamp, W3Schools and every funded
bootcamp. Your niche is R and applied statistics: narrower, more technical, far
less contested. You rank across 1,836 pages and both sales arrived through that
base with no intervention. That is an asset they never had.

What their history *does* prove is that **SEO traffic with informational intent
will not, on its own, produce a subscription business.** People arrive to learn
one thing, learn it, and leave. Which is the same conclusion the 0.5-2%
conversion estimate reaches from the other direction, and the reason Phases 1 and
2 come first.

### 5.1 Ask your customers who they watch [do this first, costs nothing]

**What:** one survey question to every buyer and every account holder: which
YouTube channels, newsletters, and podcasts do you follow?

**Why:** it is how Boot.dev sources every creator relationship. And it answers a
better question than "who covers R" — see 5.4.

**Effort:** one question. Add it to the welcome email in 2.3.

### 5.2 Live cohort events instead of a community

**What:** occasional scheduled live sessions run against your email list.

**Why:** this is the solo-operator substitute for a community, and three separate
findings converge on it.

Master.dev (formerly Frontend Masters) runs $39/mo with **no Discord, Slack or
forum in any tier**. Their entire social layer is live workshop chat during the
broadcast, then nothing. A live event produces the same appointment-based reason
to return that a community does, with none of the moderation load.

Kaggle's largest single-day acquisition on record was the **5-Day Gen AI Intensive
with Google: 30,000 new users in one day**.

Zerodha Varsity Live runs three programmes a week and has crossed 20,000
registrations.

**The mechanic to attach**, from Dataquest: a webinar on 2026-07-30 where *"this
Premium project will be unlocked for all webinar attendees from July 30 to Aug 6,
giving you one week of free access."* Attend the live event, get a week of the
paid product. Honest deadline, real urgency, no discount.

This is also the launch vehicle for the Bayesian arm, the A/B arm and the
assessments.

**The launch pattern**, from the one fully documented case in the research — Adam
Wathan's *Refactoring to Collections*:

| | |
|---|---|
| Night before launch | 14 sales |
| Launch day | **403 sales, $28,000** |
| Day 3 | **901 sales, $61,000** |
| Total | **$100,000+** |

Tiers were $29 / $59 / $135. The only urgency mechanic was a **two-day advance
notice to his list**. Runway: Twitter announcement, three free sample chapters, a
blog post, a list update, the notice, then launch. **No discount, no countdown,
no time-limited pricing.**

### 5.3 Course-mirrored programmatic SEO pointed at conversion

**What:** short posts that mirror a specific course or handbook chapter and link
into it, rather than generic keyword farming.

**Why:** this is what Boot.dev's 2026 blog revival actually is. Every bulk
publishing day is single-category and maps 1:1 to a course page: eleven SQL posts
in one day pointing at `/courses/learn-sql`, ten Linux posts pointing at
`/courses/learn-linux`, twelve Go posts pointing at `/courses/learn-golang`.

Format: 389-436 words, a contents block, one direct-answer H2, an FAQ section,
and full `Article` + `FAQPage` + `BreadcrumbList` schema even at 389 words.

Two details worth noting. **None of the 469 posts are in their sitemap** —
discovery is internal linking only, because the posts exist to convert traffic
that arrives elsewhere, not to be found. And they attach the **course
instructor's** byline to the posts that mirror their course (ThePrimeagen has 21
posts, all Git and devops, published in four bulk drops), which is an E-E-A-T
play.

**How this differs from what you already do:** your PSEO pipeline optimizes for
ranking. This optimizes for conversion from an existing arrival. Both are valid;
they are different jobs. Point your existing PSEO output at handbook chapters and
tracks more aggressively.

### 5.4 Creator sponsorship, at a scale you can afford

**The transferable insight is not "sponsor data science YouTubers."**

Boot.dev did not buy an audience interested in their *subject* (backend
development). They bought an audience with pre-existing affinity for their
product's **form factor** — RPG mechanics, so they went to gamers.

The R equivalent is identifying who already has affinity for the format you would
build, not for R itself. Answer 5.1 first; it is the cheapest input to this
decision.

**Start small.** One creator, one promo code, measure month-one ROAS before
scaling anything. Boot.dev tracks by promo code precisely because sponsored
traffic arrives as direct and is otherwise unattributable.

### 5.5 The Discord server tag [if you ever do run a Discord]

Boot.dev gives a **+20% karma multiplier** to members who display the `BOOT`
server tag. Discord server tags render on a member's profile **across all of
Discord**, so they are buying member-carried branding for in-game currency. The
cleverest single growth mechanic in the research, and it costs nothing.

Filed here rather than in Phase 3 because it is contingent on a decision I have
recommended against.

---

## Summary: the order

| # | Item | Effort | Depends on |
|---|---|---|---|
| 0.1 | Top up ZeptoMail | owner action | — |
| 0.2 | Customer fulfilment email | S | 0.1 |
| 0.3 | Fix subscriber metric | XS | — |
| 0.4 | Renewal reminder | S | 0.1 |
| 1.1 | 404 email capture | XS | 0.1 |
| 1.2 | Gated PDF | S-M | 0.1 |
| 4.3 | 30-day refund | XS | — |
| 1.3 | Deferred account ask on WebR | M | — |
| 1.4 | **Free R Skills Diagnostic** | M-L | 0.1, assessments merge |
| 2.1 | Event schema | M | — |
| 2.2 | Single opt-in, 30-day delay | S | 0.1 |
| 2.3 | Core sequences | M | 0.1, 2.1 |
| 3.1 | XP-priced hints | S-M | verify hint wiring |
| 3.2 | Monthly changelog | S, recurring | — |
| 3.5 | Progressive gated quizzes | S | — |
| 3.4 | Streak insurance | S-M | — |
| 4.2 | PPP pricing | M | — |
| 4.6 | Certificate share loop | M | cert mint wiring |
| 3.3 | Spaced repetition practice | M-L | — |
| 4.7 | Named readiness standard | M | 1.4 |
| 5.1 | Ask customers who they watch | XS | 2.3 |
| 5.2 | Live cohort event | M | 2.x list exists |
| 5.3 | Course-mirrored pSEO | M | — |
| 5.4 | Creator sponsorship pilot | $ | 5.1 |

### What to measure

- **Weekly:** new accounts, diagnostic starts and completions, email list size
- **Monthly:** free-to-paid conversion (expect 0.5-2%), revenue, refund rate
- **Per-experiment:** PPP conversion by region (nobody has published this — you
  would be first), sponsorship ROAS by creator, sequence open and click rates

### Open items carried from elsewhere

- A/B Testing arm for the Statistics Handbook (last outstanding handbook work)
- Statistics Handbook assessment banks, 14 sections
- Assessment banks ts-7 and ts-11 need regenerating
- Certificate mint wiring and track credential
- Merge the `assessments` branch and turn the flag on
