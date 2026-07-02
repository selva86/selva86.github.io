---
title: "Survival Analysis Lesson 2: Kaplan-Meier and the Log-Rank Test"
catalog_blurb: "Estimate survival curves from censored data and test whether two groups differ."
description: "Build the Kaplan-Meier survival curve from censored data by hand and in R, read its median, then use the log-rank test to compare two treatment arms with survdiff."
keywords: "Kaplan-Meier, log-rank test, survival curve, product-limit estimator, survfit, survdiff, median survival, censored data, survival analysis in R"
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

In Lesson 1 you learned that a censored row like Arun's `18+` is a floor, not a death, and that the honest summary of a waiting time is the survival curve S(t). But we never built one. This lesson does exactly that: it turns Dr. Rao's censored table into the two step curves below, one careful drop at a time, and then tests whether the gap between her two arms is real or just luck.

By the end of this lesson you will be able to:

- Explain why "the fraction still alive" quietly breaks the moment a patient is censored
- Compute a Kaplan-Meier survival curve by hand, then reproduce it in R and read its median
- Say what the log-rank test actually compares, run it, and read its p-value, and know the one thing it will not tell you

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (right-censoring, the `Surv()` outcome, the survival function S(t) and its median). You can run R and read a data frame.

::widget km-curve {}

=== step === concept
::eyebrow The obstacle
## Why you cannot just count heads

Here is the tempting shortcut. To estimate the chance of surviving past 12 months, count how many patients lasted past 12 months and divide by the total. On clean data that works. On censored data it falls apart, and Lesson 1 told you why: Farid left the study alive at 9.4 months. Is he a survivor past 12 months? We have no idea. Counting him as a death understates survival; counting him as a survivor overstates it; dropping him throws away the real fact that he lived at least 9.4 months.

Kaplan and Meier's fix is to stop asking one big question and ask a chain of tiny ones. Do not compute S(12) in one shot. Instead, walk forward in time and, at each moment a death actually happens, ask only: **of the patients still being watched right now, what fraction just died?** That group still being watched is the **at-risk set**: everyone who has neither died nor been censored yet. Its size just before a death time \(t_i\) is written \(n_i\).

[KEY INSIGHT]
A censored patient stays in the at-risk set for every month you actually saw them alive, then simply leaves it, without ever being scored as a death. That is how Kaplan-Meier uses Farid's "at least 9.4 months" honestly: he helps hold the curve up while he is watched, and quietly steps out when we lose sight of him.

=== step === concept
::eyebrow The estimator
## The product-limit estimator, by hand

Chain those tiny questions together and you get the **Kaplan-Meier estimator**, also called the **product-limit estimator**. At each death time the curve is multiplied by the fraction of the at-risk set that survived that instant:

\[ \hat{S}(t) = \prod_{t_i \le t} \left(1 - \frac{d_i}{n_i}\right) \]

Read the pieces slowly. The big \(\prod\) means "multiply together", running over every death time \(t_i\) up to the time \(t\) you care about. At each such time, \(d_i\) is the number of deaths exactly then, and \(n_i\) is the number at risk just before it. So \(1 - d_i/n_i\) is the fraction who survived that moment, and the running product of those fractions is the probability of surviving all of them, which is exactly S(t).

Let's turn the crank on Dr. Rao's standard arm, all fifteen patients, ordered by follow-up time. Start with everyone alive, \(\hat{S} = 1\), and update only at deaths:

| Month | At risk (n) | Deaths (d) | Survives the moment (1 - d/n) | S(t) |
|---|---|---|---|---|
| 2.7 | 15 | 1 | 14/15 = 0.933 | 0.933 |
| 3.2 | 14 | 1 | 13/14 = 0.929 | 0.867 |
| 4.5 | 13 | 1 | 12/13 = 0.923 | 0.800 |
| 5.5 | 12 | 1 | 11/12 = 0.917 | 0.733 |
| 6.1 | 11 | 1 | 10/11 = 0.909 | 0.667 |
| 7.0 | 10 | 1 | 9/10 = 0.900 | 0.600 |
| 8.3 | 9 | 1 | 8/9 = 0.889 | 0.533 |
| 9.4 | 8 | 0 (censored) | no drop | 0.533 |
| 11.5 | 7 | 1 | 6/7 = 0.857 | 0.457 |

Look hard at the 9.4-month row, the whole idea lives there. Farid is censored, not dead, so the curve does **not** drop: nothing died, so the fraction surviving that instant is 1. But he still leaves the at-risk set. That is why the very next death, at 11.5 months, is now divided over 7 patients instead of 8, so it takes a slightly bigger bite out of the curve. Censoring never pushes the curve down; it only shrinks the pool that later deaths are measured against.

[KEY INSIGHT]
The curve crosses 0.5 at 11.5 months: that is the **median survival**, the time by which half the standard arm has died. You read it straight off the estimate, no averaging, no assumption about the shape of the hazard.

=== step === concept
::eyebrow In R
## The same curve in two lines

You will never build that table by hand again, because `survfit()` in the `survival` package does the entire product-limit calculation for you. Each lesson runs in a fresh R session, so we create Dr. Rao's standard arm right here first (run this once):

```r
library(survival)

# Dr. Rao's standard arm: 15 patients. months = follow-up, status = 1 died / 0 censored.
std_months <- c(2.7, 3.2, 4.5, 5.5, 6.1, 7.0, 8.3, 9.4, 11.5, 12.6, 13.5, 15.8, 18.0, 24.0, 24.0)
std_status <- c(1,   1,   1,   1,   1,   1,   1,   0,   1,    1,    1,    1,    0,    0,    0)

km <- survfit(Surv(std_months, std_status) ~ 1)
summary(km)     # one row per death: the product-limit table you just built by hand
#>  time n.risk n.event survival std.err lower 95% CI upper 95% CI
#>   2.7     15       1    0.933  0.0644        0.815        1.000
#>   3.2     14       1    0.867  0.0878        0.711        1.000
#>   4.5     13       1    0.800  0.1033        0.621        1.000
#>   ...
#>   8.3      9       1    0.533  0.1288        0.332        0.856
#>  11.5      7       1    0.457  0.1310        0.261        0.802
```

The `survival` column matches your hand table to the last digit, and the `n.risk` column shows the at-risk set shrinking. Now ask R for the headline number:

```r
km        # n, number of events, and the median with a 95% confidence interval
#>       n events median 0.95LCL 0.95UCL
#> [1,] 15     11   11.5     6.1      NA
```

Median survival 11.5 months, exactly where your table crossed 0.5. The upper confidence limit prints `NA` because the curve never reliably reaches the low survival levels needed to pin it down: a fingerprint of censored data, not a bug.

=== step === widget
::eyebrow Read the picture
## What a KM curve is telling you

Now put both arms on one plot. The chart below draws a Kaplan-Meier curve for each of Dr. Rao's arms. Toggle between them and read the four things every survival curve shows:

::widget km-curve {}

- **The steps.** The curve is flat, then drops. Every drop is a death; the height of the drop is that death's bite out of the at-risk set. Flat stretches are periods when nobody died.
- **The ticks.** Each vertical tick is a censored patient leaving the study alive. Notice the curve does not fall at a tick.
- **The median.** Where a curve crosses the dashed 50% line is that arm's median survival. The new drug's curve crosses much further to the right.
- **The gap.** The new-drug curve sits above the standard curve almost the whole way. That vertical gap, at every time point, is the visible effect of the treatment, and it is what the log-rank test will put a number on.

[NOTE]
A Kaplan-Meier estimate is exactly right on average, but on a small arm it is chunky and its tail is uncertain (those widening confidence intervals). With fifteen patients per arm you should trust the overall shape and the early curve far more than the last few steps. More patients give a smoother, more trustworthy curve.

=== step === quiz
::eyebrow Check yourself
## Reading the curve

On a Kaplan-Meier curve you see a vertical tick mark at 9 months, and the curve stays perfectly flat across it. What does that tick mean?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A patient died at 9 months, which is why the curve is marked there ::no A death makes the curve DROP. The curve stayed flat across this mark, so nothing died here. Deaths are the steps down, not the ticks.
- A patient was censored at 9 months: last seen alive, then out of the at-risk set, so no drop ::ok Right. A tick is a censoring, a patient still alive at last contact. The curve holds steady because no one died; the patient simply leaves the pool that later deaths are measured against.
- The study collected no data at 9 months ::no The tick is real data: it records a patient who was alive at 9 months and then left follow-up. That "at least 9 months" is exactly the censored information Kaplan-Meier is built to use.

=== step === concept
::eyebrow Comparing two arms
## The log-rank test: observed versus expected

The curves clearly separate, but eyeballing is not proof. A gap that size could still show up by chance in thirty patients. The **log-rank test** turns the question "is the gap real?" into a hypothesis test.

Its logic is the same at-risk bookkeeping, now done for both arms at once. Walk through every time a death happens in the whole trial. At that moment there are \(n_i\) patients at risk in total and \(d_i\) deaths; the standard arm holds \(n_{1i}\) of those at-risk patients. If the two drugs were truly identical (the null hypothesis), a death should land in the standard arm in proportion to its share of the risk set. So the **expected** standard-arm deaths at that time are

\[ e_{1i} = d_i \times \frac{n_{1i}}{n_i}. \]

Add these up across all death times and compare the total the standard arm actually suffered, \(O_1 = \sum_i d_{1i}\) (observed), against the total we would expect under the null, \(E_1 = \sum_i e_{1i}\) (expected). A large gap between \(O_1\) and \(E_1\) is evidence the arms differ. The test rolls that gap into a single chi-square statistic,

\[ \chi^2 = \frac{(O_1 - E_1)^2}{V}, \]

where \(V\) is its variance (R computes it for you), and reads off a p-value with one degree of freedom.

[KEY INSIGHT]
The log-rank test never looks at the medians. It compares the whole curves, death time by death time, weighting the entire follow-up. Two arms with the same median but different long-run survival can still come apart under a log-rank test.

=== step === concept
::eyebrow In R
## Run the log-rank test with survdiff

Add the new-drug arm, stack both arms into one data frame with an `arm` label, and hand it to `survdiff()`. The formula is the same `Surv(...) ~` you know, with the grouping variable on the right:

```r
# The new-drug arm: 15 patients, longer follow-up, more still alive at the 24-month close.
new_months <- c(9.0, 24.0, 19.2, 24.0, 13.0, 22.5, 24.0, 16.4, 24.0, 20.8, 15.0, 24.0, 18.0, 21.0, 23.0)
new_status <- c(1,   0,    1,    0,    1,    1,    0,    1,    0,    1,    0,    0,    1,    1,    1)

trial <- data.frame(
  months = c(std_months, new_months),
  status = c(std_status, new_status),
  arm    = factor(rep(c("standard", "new"), each = 15), levels = c("standard", "new"))
)

survfit(Surv(months, status) ~ arm, data = trial)   # a median for each arm
#>              n events median 0.95LCL 0.95UCL
#> arm=standard 15     11   11.5     6.1      NA
#> arm=new      15      9   22.5    19.2      NA

survdiff(Surv(months, status) ~ arm, data = trial)  # the log-rank test
#>              N Observed Expected (O-E)^2/E (O-E)^2/V
#> arm=standard 15       11      6.3      3.51      5.41
#> arm=new      15        9     13.7      1.61      5.41
#>  Chisq= 5.4  on 1 degrees of freedom, p= 0.02
```

Read it as a story. The standard arm suffered 11 deaths but, under the null of no difference, only about 6.3 were expected: it did far worse than chance predicts. The new arm did the mirror image, 9 deaths against 13.7 expected. That mismatch gives a chi-square of 5.4 and a p-value of 0.02. Under a true null, a gap this large would appear about 2 times in 100, so we conclude the two survival curves genuinely differ.

=== step === tryit
::eyebrow Your turn
## Point the test at the right groups

`survdiff()` needs to know which column splits the patients into groups to compare. Everything else is built: `trial` has `months`, `status`, and an `arm` column. Fill in the grouping variable so the test compares the standard and new arms.

```r
survdiff(Surv(months, status) ~ ____, data = trial)
```
::check {"regex":"~\\s*arm|Surv\\([^)]*\\)\\s*~\\s*arm","gate":true,"difficulty":"intermediate","ok":"That is the log-rank test comparing the two arms: chi-square 5.4, p = 0.02. The variable to the right of ~ is what you are comparing across.","no":"The grouping column is arm. Put it on the right of the ~ : survdiff(Surv(months, status) ~ arm, data = trial)."}
::solution
```r
survdiff(Surv(months, status) ~ arm, data = trial)
```

=== step === quiz
::eyebrow Check yourself
## What the p-value does and does not say

Dr. Rao's log-rank test returns p = 0.02. A colleague summarizes the result four different ways. Which statement is correct?

::quiz {"correct":3,"gate":true,"difficulty":"advanced"}
- "There is a 2% chance the two drugs are actually the same." ::no That inverts the p-value. It is the probability of a gap this large IF the drugs were identical, not the probability that they are identical. The p-value never gives the chance a hypothesis is true.
- "The new drug extends median survival by 11 months, and that is significant." ::no The log-rank test reports no effect size at all. The 11.5 vs 22.5 medians come from survfit, not from the test, and the test says nothing about how big the benefit is, only that the curves differ.
- "If the drugs were truly identical, a difference this large would arise only about 2% of the time, so we have good evidence they differ." ::ok Exactly. That is what a log-rank p-value means: evidence against the null of identical survival. It flags that the curves differ, and leaves the size of the difference to the next tool.
- "A p above 0.05 would have proved the drugs are equally effective." ::no A non-significant test never proves equality; it just fails to find a difference, often because the study is too small. Absence of evidence is not evidence of absence.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [The survival package vignette (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - the canonical R reference for `survfit` and `survdiff`, from the package's own author.
- [An Introduction to Statistical Learning, ch. 11 (free PDF)](https://www.statlearning.com/) - a clear chapter on the Kaplan-Meier estimator and the log-rank test with worked intuition.
- [Bland and Altman (2004), The logrank test, BMJ 328:1073](https://doi.org/10.1136/bmj.328.7447.1073) - a one-page classic that walks through the observed-versus-expected calculation by hand.
- [Rich et al. (2010), A practical guide to understanding Kaplan-Meier curves](https://doi.org/10.1016/j.otohns.2010.05.007) - how to read, and how not to misread, a published KM curve.

=== step === complete
## Lesson 2 complete

You can now build a survival curve from censored data instead of just describing one. Kaplan-Meier walks time forward and, at each death, multiplies the curve by the fraction of the at-risk set that survived, letting censored patients hold the curve up and then leave without ever counting as deaths; the median is where the curve crosses 0.5. And the log-rank test compares two arms by summing observed against expected deaths across every event time, turning a visible gap (here, medians of 11.5 vs 22.5 months) into a p-value (0.02) that says the curves genuinely differ.

But notice the one number the log-rank test refused to give you: **how much** better the new drug is. It tells you the arms differ, not by how much, and it cannot adjust for age, sex, or disease severity. Next, Lesson 3: Cox proportional hazards, the model that estimates the hazard ratio, a single number for the size of the effect, while controlling for everything else in the chart.
