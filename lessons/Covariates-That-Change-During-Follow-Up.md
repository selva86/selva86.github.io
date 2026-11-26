---
title: "Survival and Event History Analysis Lesson 5: Covariates that change during follow-up"
catalog_blurb: "How treating a mid-study upgrade as a baseline trait manufactures a spurious effect."
description: "A subscriber who upgrades partway through needs the counting-process layout, or the Cox model manufactures a hazard ratio near half the real cancellation risk."
keywords: "time-varying covariate, counting-process layout, Surv start stop event, Cox model, immortal time bias, hazard ratio, survival analysis, R"
post_type: "LESSON"
curriculum_id: "4.140.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "5"
course_total: "7"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: "Parametric-Survival-Models-and-When-to-Prefer-Them"
course_prev: "Checking-Proportional-Hazards-and-What-to-Do-Instead"
---

=== step === cover
## Covariates that change during follow-up

Today let's look at a kind of covariate that does not sit still once you start watching it: one whose value can change partway through a subscriber's own follow-up.

A software company has 1,000 subscribers, each one followed for up to 36 months, until they cancel, the event, or the 36 months run out with them still subscribed, censored.

Most of these subscribers stay on the company's standard plan for their entire subscription. But some of them upgrade to a premium support plan, and not on the same day. One subscriber might upgrade in month 2, another in month 14, another not at all.

Here is one subscriber's own timeline, drawn out as two steps.

::widget process-flow {"steps":[{"title":"Month 0: signs up","sub":"starts on the standard support plan"},{"title":"Some month later: upgrades","sub":"switches to premium support, partway through the subscription"}]}

That second step is the one that matters. Before it, this subscriber is not on premium support. After it, they are. One subscriber, one timeline, and two different true answers to the same question, depending on which month you ask it.

=== step === concept
## A covariate that is not fixed at baseline

A covariate like a patient's sex, or which treatment arm they were randomized to, is fixed the moment they enroll. It is one value, decided before follow-up even starts, and it stays that value for the whole time you watch them. Call that a baseline covariate: known and fixed at time zero.

Premium-support status is not like that. Every subscriber starts at 0, not on premium support, because nobody has upgraded before they even sign up. For some subscribers it later switches to 1, at their own upgrade month. Call this a time-varying covariate: its value can change during follow-up, at a real month you can point to in the data.

That difference matters because an ordinary Cox model call expects one row per subscriber, and one row can only hold one value of premium. Four of this cohort's own subscribers make the problem concrete.

Here is that cohort of 1,000 subscribers built in R, with four of them pulled out to make the point.

```r
# Build the cohort of 1,000 subscribers, and look at four of them by hand
set.seed(42)
n <- 1000
event_time <- rexp(n, rate = 0.03)
final_time <- pmin(event_time, 36)
event <- as.integer(event_time <= 36)

candidate <- rbinom(n, 1, 0.5)
would_upgrade_at <- runif(n, 3, 18)
upgraded <- as.integer(candidate == 1 & would_upgrade_at < final_time)
upgrade_time <- ifelse(upgraded == 1, would_upgrade_at, NA)

cohort <- data.frame(id = 1:n, final_time = final_time, event = event,
                      upgraded = upgraded, upgrade_time = upgrade_time)

four <- cohort[c(1, 38, 720, 155), ]
four$final_time <- round(four$final_time, 1)
four$upgrade_time <- round(four$upgrade_time)
print(four, row.names = FALSE)
#>  id final_time event upgraded upgrade_time
#>   1        6.6     1        0           NA
#>  38       11.7     1        1            6
#> 720       13.3     1        1           11
#> 155       36.0     0        1           15
```

Subscriber 1 never upgrades, so premium is honestly 0 for their whole 6.6 months. But look at subscriber 38. They upgrade in month 6 and are followed to month 11.7. A single row for them has to pick one premium value, 0 or 1, for all 11.7 months.

Neither one is true: for the five and a half months before the upgrade, premium really was 0, and for the months after, it really was 1. Subscribers 720 and 155 have the exact same problem, each at their own upgrade month, 11 and 15.

=== step === concept
## The counting-process layout: one row per interval per subject
::prose-only the counting-process layout is defined in words and a small worked table here; the full build in R happens next step

Fix the one-value problem by changing the unit of the data from one row per subscriber to one row per interval per subscriber. An interval is a stretch of time during which the covariate holds exactly one value, with two edges: start, the month it begins, and stop, the month it ends.

Inside one interval, premium holds exactly one value for its whole stretch. The moment premium would have to change, that interval ends and a new one begins.

A subscriber who never upgrades needs only one interval, because premium never changes for them. Their follow-up runs from month 0 to their final month in a single row, premium = 0 throughout, with event set to whatever actually happened to them.

A subscriber who upgrades needs two. Take a subscriber who upgrades in month 9 and is followed to month 14. Their first row runs from month 0 to month 9, premium = 0, because that is genuinely true for those nine months.

Their second row runs from month 9 to month 14, premium = 1, because that is genuinely true for the five months after. Say this particular subscriber cancels at month 14. Only the second row's event column carries that outcome, because that is the only interval where their follow-up actually ends.

| start | stop | premium | event |
|---|---|---|---|
| 0 | 9 | 0 | 0 |
| 9 | 14 | 1 | 1 |

This is the counting-process layout, and the R function that reads it is Surv(start, stop, event), with three arguments instead of the two a one-row-per-subject table would use. start and stop mark one interval's edges, and event is 1 only on the row where follow-up actually ends in cancellation, 0 everywhere else, including on a row that ends only because the covariate changed. Fit it as coxph(Surv(start, stop, event) ~ premium, data = cp): one formula, the same premium column, just spread across more rows than subscribers.

=== step === concept
## Building the counting-process table in R

That two-row example used clean, round numbers to make the rule easy to see. Real subscriber data is messier, so here are six real subscribers pulled from the cohort, one row each, exactly as a one-row-per-subject table would hold them.

```r
# Pull six real subscribers out of the cohort, one row per subscriber
six <- cohort[c(1, 2, 3, 4, 132, 899), c("id", "final_time", "event", "upgraded", "upgrade_time")]
six$final_time <- round(six$final_time, 1)
six$upgrade_time <- round(six$upgrade_time)
print(six, row.names = FALSE)
#>  id final_time event upgraded upgrade_time
#>   1        6.6     1        0           NA
#>   2       22.0     1        0           NA
#>   3        9.4     1        0           NA
#>   4        1.3     1        0           NA
#> 132       16.2     1        1            7
#> 899       36.0     0        1           12
```

::widget styled-table {"cols":["id","final_time","event","upgraded","upgrade_time"],"rows":[[1,6.6,1,0,"-"],[2,22.0,1,0,"-"],[3,9.4,1,0,"-"],[4,1.3,1,0,"-"],[132,16.2,1,1,7],[899,36.0,0,1,12]],"title":"Six subscribers, one row per subscriber","note":"upgraded is 1 for the two who switch to premium support, and upgrade_time names the month, a dash where it never happens."}

Subscribers 1 through 4 never upgrade, so one row each is already honest: premium would just be 0 for their whole follow-up. Subscribers 132 and 899 are exactly the kind that cannot take a single honest premium value. Subscriber 132 upgrades in month 7 and cancels in month 16.2. Subscriber 899 upgrades in month 12 and is still subscribed when the 36-month window ends, censored rather than cancelled.

Split just those two into intervals, the same way.

```r
# Restructure these same six subscribers into one row per interval
cp_rows <- list()
for (i in seq_len(nrow(six))) {
  s <- six[i, ]
  if (s$upgraded == 0) {
    cp_rows[[length(cp_rows) + 1]] <- data.frame(id = s$id, start = 0, stop = s$final_time, premium = 0, event = s$event)
  } else {
    cp_rows[[length(cp_rows) + 1]] <- data.frame(id = s$id, start = 0, stop = s$upgrade_time, premium = 0, event = 0)
    cp_rows[[length(cp_rows) + 1]] <- data.frame(id = s$id, start = s$upgrade_time, stop = s$final_time, premium = 1, event = s$event)
  }
}
cp_six <- do.call(rbind, cp_rows)
print(cp_six, row.names = FALSE)
#>  id start stop premium event
#>   1     0  6.6       0     1
#>   2     0 22.0       0     1
#>   3     0  9.4       0     1
#>   4     0  1.3       0     1
#> 132     0  7.0       0     0
#> 132     7 16.2       1     1
#> 899     0 12.0       0     0
#> 899    12 36.0       1     0
```

::widget styled-table {"cols":["id","start","stop","premium","event"],"rows":[[1,0,6.6,0,1],[2,0,22.0,0,1],[3,0,9.4,0,1],[4,0,1.3,0,1],[132,0,7,0,0],[132,7,16.2,1,1],[899,0,12,0,0],[899,12,36.0,1,0]],"title":"The same six subscribers, one row per interval","note":"Subscribers 132 and 899 now carry two rows each. Subscribers 1 through 4 keep their single row, because premium never changes for them."}

Subscriber 132 now has two rows: 0 to 7 with premium = 0 and event = 0, because nothing happened at month 7 except the upgrade, then 7 to 16.2 with premium = 1 and event = 1, because that is where they actually cancel. Subscriber 899 follows the same pattern: 0 to 12 with premium = 0, then 12 to 36 with premium = 1 and event = 0, since they are still subscribed when the window closes. Subscribers 1 through 4 keep their single row, because premium never changes for them.

Do this for all 1,000 subscribers and you have the full counting-process table a correct model needs.

=== step === quiz
## Quick check: reading the counting-process table

In the counting-process table, which pair of rows belongs to the subscriber who upgrades in month 12 and is censored at month 36?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- One row, 0 to 36, with premium = 1 for the entire stretch. ::no
- Two rows: 0 to 12 with premium = 0 and event = 0, then 12 to 36 with premium = 1 and event = 0. ::ok Exactly right. Premium stays 0 until month 12, when the upgrade happens, then 1 from month 12 to month 36, where this subscriber is censored, not cancelled.
- Two rows split at month 18, the midpoint of their 36 months: 0 to 18 with premium = 0, then 18 to 36 with premium = 1. ::no The split happens at the subscriber's own upgrade month, not at the midpoint of their follow-up. This subscriber upgrades in month 12, so that is where the first row ends and the second begins, not month 18. And a single row covering all 36 months with premium = 1 throughout would credit them with premium support for the 12 months before they ever upgraded, which is exactly the mistake the counting-process layout exists to prevent.

=== step === concept
## Fitting the correct Cox model on the full cohort

The same rule applied to six subscribers by hand applies to the full cohort of 1,000. Doing it for everyone is what actually answers whether premium support changes the cancellation hazard.

Out of the 1,000 subscribers, 406 upgrade to premium support at some point. Every one of them contributes two rows to the counting-process table, one before their upgrade and one after, while the other 594 contribute one row each. That puts the full table at 1,406 rows, more rows than subscribers, but still one row per interval, built the same way, just for everyone instead of six.

```r
# Build the counting-process table for all 1,000 subscribers, and fit the Cox model on it
library(survival)

build_cp <- function(df) {
  rows <- list()
  for (i in seq_len(nrow(df))) {
    r <- df[i, ]
    if (r$upgraded == 0) {
      rows[[length(rows) + 1]] <- data.frame(start = 0, stop = r$final_time, premium = 0, event = r$event)
    } else {
      rows[[length(rows) + 1]] <- data.frame(start = 0, stop = r$upgrade_time, premium = 0, event = 0)
      rows[[length(rows) + 1]] <- data.frame(start = r$upgrade_time, stop = r$final_time, premium = 1, event = r$event)
    }
  }
  do.call(rbind, rows)
}

cp <- build_cp(cohort)
nrow(cp)
#> [1] 1406

correct_fit <- coxph(Surv(start, stop, event) ~ premium, data = cp)
print(summary(correct_fit)$coefficients)
#>               coef exp(coef)   se(coef)         z  Pr(>|z|)
#> premium 0.05505395  1.056598 0.09448316 0.5826853 0.5601052
```

Read the coefficient row the same way you would for any Cox model. exp(coef) is the hazard ratio, 1.057. A subscriber on premium support has 1.057 times the cancellation hazard of a subscriber not on premium support at that same month, close enough to 1 to be practically no difference at all, and p = 0.56 is nowhere near small enough to call that difference real.

That result should not surprise you. The cohort was simulated with no true premium effect at all, the same constant 0.03 monthly cancellation hazard whether or not a subscriber is on premium support. The correct model, fit on the correct layout, found exactly what was actually built into the data: nothing.

=== step === concept
## The mistake: assigning the eventual value to time zero

Go back to one row per subscriber, the shape the counting-process layout just replaced, but fill in premium a different, tempting way this time: label a subscriber 1 if they ever upgrade to premium support, at any point in their follow-up, and 0 if they never do. Call this premium_ever.

premium_ever uses the exact same 406 subscribers who upgrade in the correct model, and the exact same final_time and event every subscriber actually had. The only thing that changes is the row shape: one row per subscriber instead of one row per interval, with premium_ever credited back to time zero for the whole follow-up.

```r
# Build a one-row-per-subject table, label each subscriber by their eventual premium status, and fit a Cox model on it
naive <- data.frame(time = cohort$final_time, event = cohort$event, premium_ever = cohort$upgraded)
naive_fit <- coxph(Surv(time, event) ~ premium_ever, data = naive)

cat("Counting-process layout (the same cohort, same model as above):\n")
print(summary(correct_fit)$coefficients)

cat("\nBaseline assignment (the naive table):\n")
print(summary(naive_fit)$coefficients)
#> Counting-process layout (the same cohort, same model as above):
#>               coef exp(coef)   se(coef)         z  Pr(>|z|)
#> premium 0.05505395  1.056598 0.09448316 0.5826853 0.5601052
#> 
#> Baseline assignment (the naive table):
#>                   coef exp(coef)   se(coef)         z     Pr(>|z|)
#> premium_ever -0.672297 0.5105345 0.08500839 -7.908596 2.603073e-15
```

Read the naive coefficient row the way you read any Cox model. exp(coef) is 0.511. On the face of it, a subscriber labeled premium_ever = 1 has roughly half, 0.511 times, the cancellation hazard of one labeled 0, and p = 2.6e-15 looks about as far from chance as a p-value gets.

Put the two rows side by side and the result is strange. Both models are fit on the same 1,000 subscribers, the same upgrades, the same cancellations. The counting-process model found a hazard ratio of 1.057, no real effect.

This naive model, one row per subscriber, finds 0.511, premium support looking like it roughly halves the cancellation hazard. Something in the naive table is manufacturing an effect that simply is not in the data, because the data is identical both times.

=== step === concept
## Immortal time bias: where the spurious benefit comes from

The naive model's 0.511 is not a different, more sensitive way of measuring the same thing the correct model measured. It is wrong, and the mechanism that makes it wrong is called immortal time bias.

To be labeled premium_ever = 1, a subscriber has to do something specific first: survive, uncancelled, all the way to their own upgrade month. In this cohort that upgrade month has a median of 9.4 months. Nobody who cancels before reaching their own upgrade month is ever labeled premium_ever = 1, no matter how close they came.

The naive table does not know that, though. It credits premium_ever = 1 to a subscriber's entire follow-up starting at month zero, including the months before they had even upgraded. For a subscriber whose real upgrade month is 9, the naive table counts all nine of those pre-upgrade months as premium time, time during which that subscriber could not possibly have cancelled under the premium label, because surviving those exact months is what earned them the label in the first place. Those months are immortal: nobody counted under them can cancel in them.

That one borrowed stretch of guaranteed survival is doing all the work. Sum the real cancellations and the real months of follow-up the naive table assigns to each group, and divide one by the other, and you get each group's real rate, events per person-month.

::widget chart-plotter {"data":[{"x":"naive premium","y":0.0184},{"x":"naive other","y":0.0361}],"geoms":["bar","point"],"x":"group","y":"rate"}

The naive premium group's rate, 0.0184 events per person-month, comes out at roughly half the naive other group's, 0.0361, which is exactly the roughly-half gap the hazard ratio of 0.511 reported. But that gap is not premium support protecting anyone. It is immortal time, borrowed from before the upgrade ever happened, sitting inside a group that was never actually at risk of cancelling under that label during those borrowed months.

=== step === quiz
## Quick check: why the naive grouping looks protective

Why does the naive premium_ever grouping make premium support look protective in this cohort, when the simulation builds in no true premium effect at all?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Subscribers can only enter the premium group by first surviving, uncancelled, to their own upgrade month, and the naive table then counts that guaranteed survival time as premium time starting at month zero. ::ok Exactly. That borrowed stretch of guaranteed survival, counted as premium time it never was, is immortal time bias. It is the whole reason the naive rate comes out at roughly half the other group's, with no real premium effect anywhere in the data that produced it.
- The premium group happens to be a larger sample, which inflates how significant the result looks. ::no
- Subscribers who upgrade to premium support are probably just more satisfied customers, so they would cancel less anyway. ::no Sample size alone does not push a hazard ratio in one direction, and nothing in this cohort's simulation gives upgraders a different underlying cancellation hazard. Every subscriber shares the same constant 0.03 monthly hazard regardless of premium status. The whole gap comes from crediting each premium subscriber's own pre-upgrade months, time they had to survive just to earn the label, as if that time had always been premium time.

=== step === tryit
## Your turn: confirm the size of the bias yourself

You already have two rates: 0.0184 and 0.0361, events per person-month for the two naive groups. You do not have to take those on faith. The naive table has every subscriber's time, event, and premium_ever already in it. Group it by premium_ever, sum each group's time and each group's event, and divide, and you get the same two numbers yourself.

```r
# naive holds one row per subscriber: time, event, and premium_ever.
# Group naive by premium_ever, sum the time column and the event
# column within each group, then divide each group's event sum by
# its own time sum to get its rate, in events per person-month.
# A few lines. Press Check when you have it.
```
::check {"regex": "premium_ever[\\s\\S]*sum[\\s\\S]*\\/", "gate": true, "difficulty": "intermediate", "ok": "Right. The naive table's two real rates are 0.0184 events per person-month for the group labeled premium_ever = 1, and 0.0361 for the group labeled premium_ever = 0, the exact gap behind the hazard ratio of 0.511.", "no": "Group naive by premium_ever, sum the time column and the event column within each group, then divide each group's event sum by its own time sum. aggregate(cbind(time, event) ~ premium_ever, data = naive, sum) does the grouping and summing in one call."}
::solution
```r
# Group the naive table by premium_ever, sum time and event, and divide to get each group's rate
totals <- aggregate(cbind(time, event) ~ premium_ever, data = naive, sum)
totals$rate <- totals$event / totals$time
totals
#>   premium_ever     time event       rate
#> 1            0 11593.80   418 0.03605374
#> 2            1 11303.37   208 0.01840160
```

=== step === concept
## References
::prose-only a closing list of sources, no visual needed

- [Modeling Survival Data: Extending the Cox Model](https://doi.org/10.1007/978-1-4757-3294-8) - Therneau and Grambsch (2000), Springer. The chapter on time-dependent covariates and the counting-process form is where this lesson's Surv(start, stop, event) layout comes from.
- [Using Time Dependent Covariates and Time Dependent Coefficients in the Cox Model](https://cran.r-project.org/web/packages/survival/vignettes/timedep.pdf) - Therneau, the R survival package's own "timedep" vignette. The same counting-process construction, written for the survival package directly.
- [Time-dependent covariates in the Cox proportional-hazards regression model](https://doi.org/10.1146/annurev.publhealth.20.1.145) - Fisher and Lin (1999), Annual Review of Public Health 20, 145-157.
- [Immortal time bias in pharmacoepidemiology](https://doi.org/10.1093/aje/kwm324) - Suissa (2008), American Journal of Epidemiology 167(4), 492-499. The paper that names the bias the naive model fell into above.

=== step === complete
## Recap: the counting-process layout, and what's next

You now know how to spot a covariate that will not sit still, and what to do about it.

- A baseline covariate is fixed at time zero and never changes. A time-varying covariate, like premium-support status here, can switch value during follow-up, and a one-row-per-subject table has no honest single value to give it.
- The fix is the counting-process layout: one row per interval per subject, start and stop marking each interval's edges, with Surv(start, stop, event) ~ premium reading it directly. Fit on that layout, this cohort's correct hazard ratio came out at 1.057, no real premium effect, exactly as the simulation was built.
- The mistake the layout exists to prevent is crediting a subscriber's eventual status back to time zero. Here that mistake manufactured a hazard ratio of 0.511, premium support looking like it nearly halved the cancellation hazard, out of a cohort with no true premium effect anywhere in it.
- The name for that mistake is immortal time bias: time a subscriber had to survive just to earn a label, miscounted as time that already carried the label.

Next time you see a covariate recorded as present or absent for a subject's whole record, a treatment, a diagnosis, a promotion, ask when it actually started. If the answer is anytime other than time zero for everyone, reach for the counting-process layout before you reach for coxph().

The next lesson moves on from the Cox model's unspecified baseline hazard to parametric survival models, and when fitting one actually buys you something the Cox model cannot.
