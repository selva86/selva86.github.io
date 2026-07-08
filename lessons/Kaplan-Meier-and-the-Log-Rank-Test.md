---
title: "Survival Analysis Lesson 2: Kaplan-Meier and the Log-Rank Test"
catalog_blurb: "Estimate survival curves from censored data and test whether two groups differ."
description: "Build a Kaplan-Meier survival curve from censored data by hand and in R, read its median off the curve, and compare two treatment arms with the log-rank test."
keywords: "Kaplan-Meier, log-rank test, survival curve, product-limit estimator, survfit, survdiff, censoring, median survival, survival analysis in R, at-risk set"
post_type: "LESSON"
curriculum_id: "6.150.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "2"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: "Cox-Proportional-Hazards.html"
course_prev: "Survival-Data-and-Censoring.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Kaplan-Meier and the Log-Rank Test

In Lesson 1 you met Dr. Meera Rao's heart-failure trial and the two things that make time-to-event data special: right-censoring (patients still alive when we last saw them) and the survival curve \(S(t)\), the probability of surviving past time \(t\). You could describe such a curve. Now you will **build** one from real, censored data, read its median, and answer the question Dr. Rao actually cares about: does her new drug beat the standard one, or is the gap just noise?

By the end of this lesson you will be able to:

- Estimate a Kaplan-Meier survival curve from censored data, by hand and with `survfit`, and read its median
- Read a KM curve correctly: the steps, the censoring ticks, and the 50% crossing
- Compare two arms with the **log-rank test**, and say exactly what its p-value does and does not claim

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (right-censoring, the `Surv(time, status)` outcome, the survival function \(S(t)\) and its median). You can run R and read a small table.

::widget km-curve {}

=== step === concept
::eyebrow The problem
## Why you cannot just count heads

Here is the obvious idea, and why it breaks. To estimate survival at month 15, count how many of Dr. Rao's 15 standard-arm patients are still alive and divide by 15. Simple, until you hit a censored patient.

One standard-arm patient was last seen alive at **9.4 months**, then lost to follow-up: she moved, or the study ended for her, or she simply stopped coming in. At month 15, is she alive or dead? **We do not know.** Counting her as alive is too optimistic. Dropping her entirely throws away a real fact, that she survived at least 9.4 months. Neither choice is honest, and every censored patient forces the same bad choice.

Kaplan and Meier's fix is to never ask the month-15 question directly. Instead, walk forward in time and stop only at the moments a death actually happens. At each death, look only at the patients still under observation right then, the **at-risk set**, and ask a tiny question: of those at risk, what fraction survived this instant? A censored patient counts fully, right up until the moment we lose her, and then quietly leaves the at-risk set without ever being called alive-or-dead.

[KEY INSIGHT]
The at-risk set \(n_i\) is the number of patients who are alive AND still under observation just before time \(t_i\). It shrinks for two reasons: a death, or a censoring. That single bookkeeping rule is what lets Kaplan-Meier use a censored patient's real follow-up time without ever having to guess what happened after we lost sight of them.

=== step === concept
::eyebrow The estimator
## The product-limit estimator, by hand

Line up the standard arm's death times in order: \(t_1 < t_2 < \dots\). At each death time \(t_i\), let \(d_i\) be the number of deaths at that instant and \(n_i\) the number at risk just before it. The fraction who survive that instant is \(1 - d_i/n_i\). To survive **past** time \(t\), a patient must survive every death instant up to \(t\), so the survival estimate is the running product of those fractions:

\[ \hat S(t) = \prod_{t_i \le t}\left(1 - \frac{d_i}{n_i}\right). \]

That product is why it is called the **product-limit estimator**. Read it left to right: start at \(\hat S = 1\) (everyone alive at time 0), and each time a death happens, multiply by the fraction who survived it. Between deaths the curve is flat, because nothing changed. Walk it down the standard arm:

| time \(t\) (mo) | at risk \(n_i\) | deaths \(d_i\) | survive this instant \(1 - d_i/n_i\) | \(\hat S(t)\) |
|---|---|---|---|---|
| 0 | 15 | 0 | - | 1.000 |
| 2.7 | 15 | 1 | 14/15 | 0.933 |
| 3.2 | 14 | 1 | 13/14 | 0.867 |
| 4.5 | 13 | 1 | 12/13 | 0.800 |
| 5.5 | 12 | 1 | 11/12 | 0.733 |
| 6.1 | 11 | 1 | 10/11 | 0.667 |
| 7.0 | 10 | 1 | 9/10 | 0.600 |
| 8.3 | 9 | 1 | 8/9 | 0.533 |
| **9.4 (censored)** | 8 | 0 | - (curve flat) | 0.533 |
| 11.5 | **7** | 1 | 6/7 | **0.457** |

Look carefully at the censored row. At 9.4 months a patient leaves, but nobody died, so \(\hat S\) does not drop, it stays at 0.533. What DOES change is the denominator: the at-risk set falls from 8 to 7. So when the next death arrives at 11.5 months, we multiply by \(1 - 1/7 = 6/7\) instead of by \(1 - 1/8\). The censoring made the next death "count for more."

[KEY INSIGHT]
The **median survival** is the earliest time the curve reaches or drops below 0.5. Here \(\hat S\) is 0.533 at 8.3 months (still above half) and 0.457 at 11.5 months (below half), so the standard arm's median survival is **11.5 months**. The median is a time, read off the horizontal 50% line, not an average of the follow-up numbers.

=== step === concept
::eyebrow In R
## The same curve with survfit

You never build that table by hand in practice; the `survival` package does it exactly. Each lesson runs in a fresh R session, so we create the standard arm inline first. The outcome goes into `Surv(time, status)`, where `status` is 1 for a death and 0 for a censored patient, and `survfit` returns the product-limit estimate:

```r
library(survival)

# Dr. Rao's standard arm: 15 patients. months = follow-up, status = 1 died / 0 still alive at last visit.
std_months <- c(2.7, 3.2, 4.5, 5.5, 6.1, 7.0, 8.3, 9.4, 11.5, 12.6, 13.5, 15.8, 18.0, 24.0, 24.0)
std_status <- c(1,   1,   1,   1,   1,   1,   1,   0,   1,    1,    1,    1,    0,    0,    0)

km_std <- survfit(Surv(std_months, std_status) ~ 1)
summary(km_std)          # the product-limit table, one row per death
#>  time n.risk n.event survival std.err lower 95% CI upper 95% CI
#>   2.7     15       1    0.933  0.0644        0.815        1.000
#>   3.2     14       1    0.867  0.0878        0.711        1.000
#>   4.5     13       1    0.800  0.1033        0.621        1.000
#>   5.5     12       1    0.733  0.1142        0.540        0.995
#>   6.1     11       1    0.667  0.1217        0.466        0.953
#>   7.0     10       1    0.600  0.1265        0.397        0.907
#>   8.3      9       1    0.533  0.1288        0.332        0.856
#>  11.5      7       1    0.457  0.1310        0.261        0.802
#>  12.6      6       1    0.381  0.1295        0.196        0.742
#>  13.5      5       1    0.305  0.1240        0.137        0.676
#>  15.8      4       1    0.229  0.1140        0.086        0.608
```

Those `survival` numbers are exactly your hand table. And notice the sleight of hand in the `n.risk` column: it jumps straight from **9** (at 8.3) to **7** (at 11.5). The missing patient is the one censored at 9.4, gone from the denominator with no death row of her own, precisely the mechanic you traced above. Now ask R for the median:

```r
km_std                   # n, number of events, and the median survival
#>       n events median 0.95LCL 0.95UCL
#> [1,] 15     11   11.5     6.1      NA
```

`median = 11.5`, matching the hand calculation. The `NA` for the upper confidence limit is honest reporting: the curve never climbs back, so R cannot pin down the upper end from this much data.

=== step === widget
::eyebrow Reading the picture
## What a Kaplan-Meier curve is telling you

The widget below shows a two-arm KM plot (an illustrative trial, not Dr. Rao's exact numbers). Ignore the specific values and read the **shape**, because every survival paper you ever open is read the same four ways:

- **The steps.** Each curve is flat, then drops straight down at a death, then flat again. A KM curve only ever moves at a death; the height of each drop is that \(1 - d_i/n_i\) factor.
- **The ticks.** The little vertical marks are censored patients, still alive when last seen. A tick is **not** a death; the curve does not step down there, it just loses one from the at-risk set.
- **The median.** Where a curve crosses the dashed 50% line, drop straight down to the time axis: that time is the median survival for that arm.
- **The gap.** The vertical distance between the two curves is the survival advantage of one arm over the other, and it is exactly what the log-rank test, coming next, turns into a single number.

Toggle the arms and watch the higher curve's median sit far to the right of the lower one's.

::widget km-curve {}

[NOTE]
Read the far-right tail of any KM curve with caution. Out there only a handful of patients are still at risk, so a single death causes a huge step and the estimate gets shaky. That is why the confidence band flares wide at the end, and why medians are reported far more often than, say, "24-month survival."

=== step === quiz
::eyebrow Check yourself
## The tick that is not a death

On Dr. Rao's standard-arm curve, at month 9.4 there is a small vertical tick, but the curve does **not** step down. At month 11.5 it does drop. What does the tick at 9.4 tell you?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- A patient died at 9.4 months, so survival fell there ::no A tick marks a censoring, not a death. The curve only steps DOWN at a death; at 9.4 it stayed flat, which is the visual signature of a censored patient, not a death.
- A patient was censored at 9.4 (last seen alive), so she leaves the at-risk set but the curve does not drop ::ok Right. A censoring removes a patient from the denominator without a death, so the estimate stays flat. That is exactly why the next death, at 11.5, divides by 7 instead of 8 and drops a little further.
- The study ended for everyone at 9.4 months ::no Follow-up runs all the way to 24 months. The tick is one individual patient leaving observation, not the whole study stopping.

=== step === concept
::eyebrow Comparing two arms
## The log-rank test: observed versus expected deaths

Now put both arms on the same plot. The new-drug curve sits higher, so its median (22.5 months, you will fit it in a moment) is well to the right of the standard arm's 11.5. But eyeballing a gap is not proof: with only 15 patients an arm, a gap that size could happen by chance. The **log-rank test** turns "the curves look different" into a probability.

The idea is a running tally of surprise. Walk forward through every death time in the pooled data. At each death time \(t_i\), suppose for a moment the two arms were truly identical. Then a death should land in an arm just in proportion to how many of that arm are still at risk. With \(n_i\) patients at risk in total, \(n_i^{\text{s}}\) of them in the standard arm, and \(d_i\) deaths at that instant, the **expected** number of standard-arm deaths if the arms were identical is

\[ e_i^{\text{s}} = d_i \times \frac{n_i^{\text{s}}}{n_i}. \]

Make it concrete at the very first death, month 2.7. All 30 patients are still at risk (the earliest new-arm event is not until month 9), so \(n_i = 30\) and \(n_i^{\text{s}} = 15\), and there is \(d_i = 1\) death. The expected standard-arm deaths are \(1 \times 15/30 = 0.5\), and the same 0.5 for the new arm. But the patient who actually died was in the standard arm, so **observed = 1, expected = 0.5**: a small excess of half a death for the standard arm at this one time.

Add those observed and expected counts across every death time to get the arm's totals, \(O\) and \(E\). The test statistic squares the gap between them and divides by its variance \(V\) under the "identical arms" assumption:

\[ \chi^2 = \frac{(O - E)^2}{V}. \]

One number, one degree of freedom for two arms. If the arms really are identical, \(O\) and \(E\) stay close and \(\chi^2\) is small; a large \(\chi^2\) means one arm kept dying more (or less) than chance allows.

=== step === concept
::eyebrow In R
## The log-rank test with survdiff

`survdiff` runs that whole tally for you. We build the full 30-patient `trial` inline, fit both arms with one `survfit`, then test the gap. First the two medians:

```r
library(survival)

# Dr. Rao's full trial: 15 standard-arm patients and 15 on the new drug.
std_months <- c(2.7, 3.2, 4.5, 5.5, 6.1, 7.0, 8.3, 9.4, 11.5, 12.6, 13.5, 15.8, 18.0, 24.0, 24.0)
std_status <- c(1,   1,   1,   1,   1,   1,   1,   0,   1,    1,    1,    1,    0,    0,    0)
new_months <- c(9.0, 24.0, 19.2, 24.0, 13.0, 22.5, 24.0, 16.4, 24.0, 20.8, 15.0, 24.0, 18.0, 21.0, 23.0)
new_status <- c(1,   0,    1,    0,    1,    1,    0,    1,    0,    1,    0,    0,    1,    1,    1)

trial <- data.frame(
  months = c(std_months, new_months),
  status = c(std_status, new_status),
  arm    = factor(rep(c("standard", "new"), each = 15), levels = c("standard", "new"))
)

km <- survfit(Surv(months, status) ~ arm, data = trial)
km                       # median survival per arm
#>              n events median 0.95LCL 0.95UCL
#> arm=standard 15     11   11.5     6.1      NA
#> arm=new      15      9   22.5    19.2      NA
```

The new arm's median (22.5 months) is nearly double the standard arm's (11.5). Now test whether that gap is real:

```r
survdiff(Surv(months, status) ~ arm, data = trial)   # the log-rank test
#>               N Observed Expected (O-E)^2/E (O-E)^2/V
#> arm=standard 15       11      6.3      3.51      5.41
#> arm=new      15        9     13.7      1.61      5.41
#>
#>  Chisq= 5.4  on 1 degrees of freedom, p= 0.02
```

Read it straight across. The standard arm had **11 deaths observed but only 6.3 expected** if the arms were identical: it died more than its share. The new arm mirrors it, 9 observed against 13.7 expected: it died less. Those gaps combine into `Chisq = 5.4` on 1 degree of freedom, giving **p = 0.02**. The difference between Dr. Rao's two curves is unlikely to be chance.

[NOTE]
One honest detail. The final chi-square (5.4) uses the variance form \((O-E)^2/V\), the rightmost column, not the naive sum of the per-arm \((O-E)^2/E\) values (3.51 + 1.61). The \((O-E)^2/E\) column is a rough guide printed alongside; the proper log-rank statistic divides by the full variance \(V\), which is why both arms show the same 5.41.

=== step === tryit
::eyebrow Your turn
## Run the test yourself

`trial` is already in memory with `months`, `status`, and `arm`. Write the log-rank test that compares survival **between the two arms**. Fill in the variable that splits the patients into groups, to the right of the `~`.

```r
survdiff(Surv(months, status) ~ ____, data = trial)
```
::check {"regex":"~\\s*arm","gate":true,"difficulty":"intermediate","ok":"That is the log-rank test: it compares the standard and new arms and returns Chisq = 5.4, p = 0.02. The grouping variable goes to the right of the ~.","no":"Group by the treatment arm: the variable is arm, so the formula is Surv(months, status) ~ arm."}
::solution
```r
survdiff(Surv(months, status) ~ arm, data = trial)
```

=== step === concept
::eyebrow The fine print
## What the log-rank test will not tell you

A p-value of 0.02 is a real result, but a narrow one. Three limits are worth carrying into every survival analysis you do, and together they are exactly why this course does not stop here.

- **No effect size.** The log-rank says the curves differ; it never says by how much. It cannot tell you "the new drug roughly halves the risk of dying" or "adds 11 months of median survival." A tiny, useless difference measured on 100,000 patients gives a tiny p just as easily as a big one on 30.
- **It weighs the whole curve, not the medians.** The test sums observed-minus-expected across all follow-up. Two arms with the same median but different shapes can differ; two with different medians but curves that cross can wash out to nothing. Read the curve, not just its midpoint.
- **It is strongest when the gap is steady.** The log-rank has the most power to detect a difference when one arm's hazard stays a roughly constant multiple of the other's over time (the curves do not cross). When an early advantage reverses later, the test can badly understate a real difference.

[WARNING]
The log-rank test also cannot **adjust** for anything. If the new-arm patients happened to be younger, the test has no way to separate the drug's effect from youth; it only ever compares whole groups as they are. Answering "how big is the effect, holding age fixed?" needs a model, not a test.

=== step === quiz
::eyebrow Check yourself
## Reading p = 0.02 correctly

Dr. Rao's log-rank test returns p = 0.02. A colleague offers four readings. Which one is correct?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- p = 0.02 tells you the new drug adds about 11 months of median survival ::no The log-rank p is not an effect size. It says the curves differ, not by how much. The 11-month gap comes from the KM medians, not from the test, and a Cox model is what quantifies the effect properly.
- The test compares the two survival curves across all of follow-up, not just their medians ::ok Right. The log-rank sums observed-minus-expected deaths at every death time, so it weighs the whole curve. Two arms with equal medians but different shapes can still differ, and arms whose curves cross can wash out to a non-significant result.
- Because p is below 0.05, the proportional-hazards assumption is confirmed ::no The log-rank never checks that. It is simply most powerful WHEN the hazards stay proportional; a small p does not verify the assumption, and Lesson 4 is where you actually test it.
- p = 0.02 proves the new drug is 0.02 times as deadly as the standard drug ::no p is a probability of seeing a gap this large by chance, not a ratio of risks. "Significant" is not "large," and the risk ratio (the hazard ratio) is a separate number the log-rank never produces.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Kaplan and Meier (1958), Nonparametric Estimation from Incomplete Observations, JASA 53(282):457](https://doi.org/10.1080/01621459.1958.10501452) - the original paper that defined the product-limit estimator you built here.
- [The survival package vignette (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - the canonical R reference for `survfit` and `survdiff`, written by the package's author.
- [Bland and Altman (2004), The logrank test, BMJ 328:1073](https://doi.org/10.1136/bmj.328.7447.1073) - a short, clear derivation of the observed-versus-expected logic, from the BMJ Statistics Notes series.
- [An Introduction to Statistical Learning, ch. 11 (free PDF)](https://www.statlearning.com/) - a worked treatment of Kaplan-Meier and the log-rank test with the same notation used here.

=== step === complete
## Lesson 2 complete

You can now turn censored follow-up into a survival curve and a verdict. The **Kaplan-Meier estimator** \(\hat S(t) = \prod_{t_i \le t}(1 - d_i/n_i)\) drops only at deaths and lets censored patients leave the at-risk set cleanly, so you read the standard arm's median as 11.5 months and the new arm's as 22.5 straight off the curve. The **log-rank test** compared the two arms by tallying observed against expected deaths at every death time, returning \(\chi^2 = 5.4\) and p = 0.02: Dr. Rao's gap is unlikely to be chance.

But the test stopped exactly where the clinician's real questions begin. It said the arms differ, not how much, and it could not rule out that the new-arm patients were simply younger. Next, Lesson 3: the **Cox proportional hazards model**, which turns "the arms differ" into a single hazard ratio and lets you adjust that number for age and anything else you measured.
