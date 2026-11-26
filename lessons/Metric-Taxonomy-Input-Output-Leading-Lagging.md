---
title: "Product Metric Design Lesson 1: Metric Taxonomy: Input, Output, Leading, Lagging"
catalog_blurb: "Classify any metric so a rising input is never mistaken for a win."
description: "GlowFit raises its reminder cadence and watches renewal fall a year later. Learn to sort any metric into input, output, leading, and lagging before celebrating."
keywords: "metric taxonomy, input metric, output metric, leading metric, lagging metric, overall evaluation criterion, product metrics, growth metrics, renewal rate, cohort comparison, product data science"
post_type: "LESSON"
curriculum_id: "3.20.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "1"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "The-Overall-Evaluation-Criterion.html"
course_prev: ""
---

=== step === cover
## Metric Taxonomy: Input, Output, Leading, Lagging

Today let's understand the four questions that sort any metric on a dashboard into its right place, so a number that looks good does not get mistaken for a number that actually matters.

GlowFit is a fitness subscription app with monthly and annual plans. Its growth team just raised how often the app reminds a new signup to work out, from 3 push notifications a week to 7. That one change put several numbers in motion: how many reminders went out, how often people actually worked out, how much staff time it cost, and whether people stuck around a year later.

Each of those numbers answers two separate questions. The first is who produced it: the team itself, or the person using the app. The second is how soon you know it: in time to still act on it, or only once the decision is already made.

Here are the four terms that answer those two questions.

::widget process-flow {"steps":[{"title":"Input","sub":"did the team set this number directly"},{"title":"Output","sub":"is this number a result of what users did"},{"title":"Leading","sub":"is it known soon enough to still act on it"},{"title":"Lagging","sub":"is it known only after the decision is already made"}]}

Those four boxes are the whole lesson. Every metric GlowFit tracks, and every metric you will ever report on, sorts into one of them.

=== step === concept
## GlowFit's dashboard: four numbers, one cadence change

GlowFit tracks two signup cohorts of 10,000 users each, one month apart. Cohort A signed up under the old cadence, 3 reminders a week. Cohort B signed up a month later, once the growth team had already raised it to 7.

Four numbers sit on the dashboard for both cohorts.

```r
# Build GlowFit's four metrics as one table, each with its value before and after the cadence change
library(tibble)

glowfit_metrics <- tribble(
  ~metric, ~before, ~after,
  "Reminders sent per week", 3, 7,
  "Day-7 workout completion rate", 0.42, 0.45,
  "Coaching-call hours per quarter", 400, 650,
  "Annual renewal rate", 0.61, 0.54
)

glowfit_metrics
#> # A tibble: 4 × 3
#>   metric                          before  after
#>   <chr>                            <dbl>  <dbl>
#> 1 Reminders sent per week           3      7   
#> 2 Day-7 workout completion rate     0.42   0.45
#> 3 Coaching-call hours per quarter 400    650   
#> 4 Annual renewal rate               0.61   0.54
```

Reminders went from 3 to 7 a week. Day-7 workout completion, the share of a cohort still working out a week after signup, moved from 42% to 45%. Coaching-call hours, the hours GlowFit's coaching team spent on calls that quarter, rose from 400 to 650. And annual renewal, the share of a cohort still subscribed a year after signing up, fell from 61% to 54%.

Four numbers, all moving at once. None of them says yet whether raising the cadence actually helped. That is exactly what this lesson sorts out.

=== step === concept
## The two questions behind every metric
::prose-only the two questions and their two answers are stated directly in prose, as a short definition list

Every metric on GlowFit's dashboard, in fact every metric on any dashboard, answers two separate questions.

The first question is who produced the number. If the team set it directly, by configuring how the app behaves, it is an **input** metric. If it only exists because of what users did, after the team's decision was already made, it is an **output** metric.

The second question is how soon you know it. If the number is available in time to still act on it, change course, adjust the plan, it is a **leading** metric. If it only becomes known once that period's decision is already locked in, it is a **lagging** metric.

These two questions are independent of each other. Knowing whether a metric is input or output tells you nothing about whether it is leading or lagging, and the other way round. So a metric can land in any of the four combinations: input and leading, input and lagging, output and leading, or output and lagging.

GlowFit's own four numbers, one at a time, show exactly how that plays out.

=== step === concept
## Input metrics: what the team itself did
::prose-only points back at the reminders row already shown in the table above

Start with reminders sent per week. GlowFit's growth team set this number directly: 3 a week for Cohort A, 7 a week for Cohort B. Nobody had to wait and see what users did. The team opened a settings panel, changed a number, and the reminders went out exactly that often from that point on.

That is what makes reminders sent an **input** metric. It measures an action the team took, not a result the team is hoping for. And because the team controls it directly, the number alone says nothing about whether users actually responded to those reminders by working out more. It only tells you what GlowFit did, not what happened because of it.

=== step === concept
## Output metrics: what the team is actually after
::prose-only points back at the annual renewal row already shown in the table above

Now take annual renewal rate: 61% for Cohort A, 54% for Cohort B. Nobody at GlowFit can set this number. It is the result of 10,000 individual users each deciding, a year after they signed up, whether to keep paying for the app.

That is what makes annual renewal an **output** metric. The team cannot configure it the way it configured reminder cadence. All it can do is change inputs, such as how many reminders go out, and hope those changes move the output in the direction it wants.

The team is not trying to raise reminders sent for its own sake. It raised reminders because it was trying to raise renewal. Reminders are the input, and renewal is the output the input is meant to serve.

=== step === concept
## Leading metrics: an early read you can still act on
::prose-only points back at the day-7 completion row already shown in the table above

Day-7 workout completion moved from 42% to 45%. GlowFit knows this number just seven days after each cohort signs up, which is fast. The team deciding what cadence to use for the cohort signing up next month already has this number in hand.

That is what makes Day-7 completion a **leading** metric: it arrives in time to still act on it. Notice that Day-7 completion is also an output metric, the same kind of number as annual renewal, since it is a result of what users did, not something the team set directly. Leading and output are two different questions, so a metric can be both at once. Output tells you who produced the number, and leading tells you how soon you know it.

=== step === concept
## Lagging metrics: known only once the decision is already made
::prose-only points back at the coaching-hours row already shown in the table above

Coaching-call hours rose from 400 to 650 that quarter. GlowFit's growth team decides staffing levels directly, how many coaches to schedule and how many calls to offer, so this is an input metric, the same kind of number as reminders sent.

But there is something different about it. The team sets staffing levels at the start of the quarter, and the actual hours delivered only add up to a final total once the quarter closes. Nobody can read off 650 hours partway through. The number exists only in hindsight, after the period it would have informed is already over.

That is what makes coaching-call hours **lagging**. It shares the lagging property with annual renewal, even though one is an input and the other is an output. Coaching-call hours is lagging because a quarter has to finish before its total is known. Annual renewal is lagging for a longer and more costly reason: it takes a full twelve months after a cohort signs up before that cohort's renewal decision is in.

That twelve-month delay is exactly why GlowFit could celebrate the cadence change for a full year before anything proved it wrong. By the time Cohort B's annual renewal rate is actually known, a full year will have passed since its signup. In that year, every new cohort GlowFit signed up also received the higher, 7-a-week cadence. If the cadence was quietly hurting renewal the whole time, nobody would find out until the first lagging renewal number came back, long after the decision to raise the cadence had already been applied to every cohort in between.

=== step === widget
## Sorting GlowFit's four numbers into the grid

Reminders sent is leading, not just input: GlowFit knows the number the instant the team sets it, before a single notification goes out.

Sort all four of GlowFit's numbers into one grid, both answers at once.

::widget styled-table {"cols":["Metric","Input or output","Leading or lagging","Before","After"],"rows":[["Reminders sent per week (count)","Input","Leading",3,7],["Day-7 workout completion rate (percent)","Output","Leading",42,45],["Coaching-call hours per quarter (hours)","Input","Lagging",400,650],["Annual renewal rate (percent)","Output","Lagging",61,54]],"title":"GlowFit metrics sorted into the grid","note":"Day-7 completion and annual renewal are shown as percentages. Reminders and coaching hours are counts."}

Look at the two middle columns together. Reminders and Day-7 completion are both leading, but one is input and the other is output. Coaching hours and annual renewal are both lagging, but again one is input and the other is output. The two questions really do move independently of each other: knowing one tells you nothing about the other.

=== step === widget
## Watching the input rise while the output falls

The team already has two good-looking numbers in hand the same quarter the cadence changes: reminders are up, and Day-7 completion is up too.

Compute how far reminders and annual renewal actually moved, each as a percent change from its own starting point.

```r
# Compute reminders' and annual renewal's percent change from their own baseline
reminders_before <- glowfit_metrics$before[glowfit_metrics$metric == "Reminders sent per week"]
reminders_after  <- glowfit_metrics$after[glowfit_metrics$metric == "Reminders sent per week"]
renewal_before   <- glowfit_metrics$before[glowfit_metrics$metric == "Annual renewal rate"]
renewal_after    <- glowfit_metrics$after[glowfit_metrics$metric == "Annual renewal rate"]

pct_change <- function(before, after) (after - before) / before * 100

reminders_pct_change <- pct_change(reminders_before, reminders_after)
renewal_pct_change <- pct_change(renewal_before, renewal_after)

round(reminders_pct_change, 1)
#> [1] 133.3
round(renewal_pct_change, 1)
#> [1] -11.5
```

Reminders rose 133.3% from their old-cadence baseline. That is the number the growth team put in its quarterly update, alongside the 3-point rise in Day-7 completion, and called it a win. Both of those numbers were real, and both were already known the same quarter the cadence changed. Neither one is the annual renewal rate.

Plot both series the same way: where each one started, at 0% change, and where it landed.

::widget chart-plotter {"data":[{"x":"Before","y":0,"fill":"Reminders sent per week"},{"x":"After","y":133.3,"fill":"Reminders sent per week"},{"x":"Before","y":0,"fill":"Annual renewal rate"},{"x":"After","y":-11.5,"fill":"Annual renewal rate"}],"geoms":["line","point"],"x":"period","y":"pct_change"}

Reminders climb sharply from 0 to 133.3%. Annual renewal moves the other way, down to -11.5%, which is the 7-percentage-point fall from 61% to 54%. The two lines run in opposite directions.

Annual renewal is lagging. It is only known twelve months after a cohort signs up, so at the moment the team reported its win, Cohort B had not even reached its own renewal date yet. By the time the 54% figure actually arrived a year later, against Cohort A's 61%, the higher cadence had already run for every cohort that signed up in between. The input kept climbing and the output kept falling, and nobody caught it until the one lagging number that mattered finally came in.

=== step === quiz
## Quick check: classifying a fifth GlowFit number

Suppose GlowFit adds a fifth number to the dashboard: average session length this week, how many minutes the typical user spends in the app during the current week. How would you classify it?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Input and leading, because the team can change average session length by redesigning the app. ::no
- Output and lagging, because you need a full week of sessions before the average means anything. ::no
- Output and leading, because session length is a result of what users did, and it is already known within the same week it happens. ::ok Right. Average session length is produced by users, not set by the team, which makes it an output metric. And it is known within the same week it happens, which makes it leading.
- Input and lagging, because the team shapes how the app is designed and the number only firms up once enough sessions have piled up. ::no Average session length is not something the team sets directly, the way it sets reminder cadence. Users produce it by how they actually use the app, which makes it an output metric, not an input one. And it does not take a long delay to know it either: it is available the same week it happens, which makes it leading, not lagging.

=== step === tryit
## Your turn: catch the same mistake in a new scenario

GlowFit also runs a referral programme. Existing users are invited to send referral invites to friends, and the growth team raised that from 2 invites per user a month to 5. Ninety-day retention, the share of referred users still subscribed 90 days after joining, fell from 58% to 50% over the same period.

Invites per user is an input: the team sets how many invites each user is prompted to send. Ninety-day retention is an output and lagging: it is a result of what referred users decided, and it only becomes known 90 days after they join.

The code below computes how far invites moved, as a percent change from its own baseline.

```r
# GlowFit's referral programme: invites per user (input) against 90-day retention of referred users (output, lagging)
pct_change <- function(before, after) (after - before) / before * 100

invites_before <- 2
invites_after <- 5
retention_before <- 0.58
retention_after <- 0.50

invites_pct_change <- pct_change(invites_before, invites_after)
round(invites_pct_change, 1)
#> [1] 150

same_direction <- NA
same_direction
#> [1] NA
```

Invites rose 150%. The one number still missing is whether retention moved the same way. Replace `NA` with the same kind of calculation `pct_change` already did for invites, then compare its sign against `invites_pct_change`. Then press Check.

::check {"regex": "same_direction\\s*<-\\s*sign[(]pct_change[(]retention_before,\\s*retention_after[)][)]\\s*==\\s*sign[(]invites_pct_change[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. Retention fell from 58% to 50%, a -13.8% change, while invites rose 150%. The two signs do not match, which means the input and the output moved in opposite directions, the same mistake GlowFit made with its reminder cadence.", "no": "Compute retention percent change the same way pct_change was used for invites, then compare its sign against invites_pct_change: same_direction <- sign(pct_change(retention_before, retention_after)) == sign(invites_pct_change)."}
::solution
```r
# GlowFit's referral programme: invites per user (input) against 90-day retention of referred users (output, lagging)
pct_change <- function(before, after) (after - before) / before * 100

invites_before <- 2
invites_after <- 5
retention_before <- 0.58
retention_after <- 0.50

invites_pct_change <- pct_change(invites_before, invites_after)
round(invites_pct_change, 1)
#> [1] 150

same_direction <- sign(pct_change(retention_before, retention_after)) == sign(invites_pct_change)
same_direction
#> [1] FALSE
```

Invites rose 150%, and retention actually fell by 13.8%. `same_direction` comes back `FALSE`: the input went up while the output went down. Referral invites looked like a success on their own, the same way GlowFit's reminders did, but the output they were meant to help, retention, moved the other way the whole time.

=== step === concept
## References
::prose-only the references are text, not a visual

- Croll, A. and Yoskovitz, B. (2013). [Lean Analytics: Use Data to Build a Better Startup Faster](https://www.oreilly.com/library/view/lean-analytics/9781098168179/). O'Reilly Media. On separating the one metric a team is trying to move from the levers it directly controls.
- Kaplan, R.S. and Norton, D.P. (1996). [The Balanced Scorecard: Translating Strategy into Action](https://www.publishersweekly.com/9780875846514). Harvard Business School Press. The source of the leading-versus-lagging distinction used in this lesson.
- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. On combining several metrics into one overall evaluation criterion that reflects what an experiment is actually trying to achieve.
- Reichheld, F.F. (1996). [The Loyalty Effect: The Hidden Force Behind Growth, Profits, and Lasting Value](https://www.publishersweekly.com/9780875844480). Harvard Business School Press. On measuring retention by signup cohort and reading the number back to the decision it should inform.

=== step === complete
## What the taxonomy buys you

GlowFit's growth team raised the reminder cadence from 3 to 7 a week, and the same quarter it did, reminders were up 133.3% and Day-7 completion was up 3 points. Both numbers were real, and both looked like a win.

But reminders sent is an input, and Day-7 completion, while a genuine output, is only a leading read on it. The number the cadence change was actually supposed to help, annual renewal, is lagging. It took a full year to arrive, and when it did, it had fallen from 61% to 54%, after the higher cadence had already run for every cohort in between.

Sort a metric by asking who produced it and how soon you know it, and you get the whole picture before you act on half of it. An input moving in the right direction is not the same as the output it is meant to serve moving with it. Only the output's own number, however long it takes to arrive, actually tells you that.

The next lesson takes this further: combining several metrics like these into one overall evaluation criterion, so a test has a single answer instead of four separate ones pulling in different directions.
