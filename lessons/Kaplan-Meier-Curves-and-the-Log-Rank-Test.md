---
title: "Survival and Event History Analysis Lesson 2: Kaplan-Meier curves and the log-rank test"
catalog_blurb: "How to build a survival curve by hand and test whether two groups differ."
description: "A 30-patient trial compares a new drug against standard care for 24 months. Build the Kaplan-Meier curve by hand, then test whether the arms truly differ."
keywords: "Kaplan-Meier estimator, survival curve, log-rank test, censoring, median survival, confidence band, survival analysis, R"
post_type: "LESSON"
curriculum_id: "4.140.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "2"
course_total: "8"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: "The-Cox-Model-and-What-a-Hazard-Ratio-Means"
course_prev: "What-Censoring-Does-to-Your-Data"
---

=== step === cover
## Kaplan-Meier curves and the log-rank test

Today let's understand how to build a survival curve from real patient data, by hand, and how to tell whether two such curves are genuinely different or just noise.

A hospital runs a 24-month trial on 30 patients with a chronic condition. Fifteen are randomised to standard care, and fifteen to a new drug. Every patient is followed for up to 24 months, and for each one the hospital records a time in months, together with whether that time ended in the condition returning or the patient simply still being followed at that point with no return yet.

Here are all 30 patients at the end of the trial.

::widget styled-table {"cols": ["patient", "arm", "status", "time"], "rows": [[1, "standard care", "returned", 1.5], [2, "standard care", "returned", 2.2], [3, "standard care", "returned", 3.1], [4, "standard care", "returned", 4.0], [5, "standard care", "censored", 4.6], [6, "standard care", "returned", 5.2], [7, "standard care", "returned", 6.0], [8, "standard care", "returned", 6.1], [9, "standard care", "returned", 7.4], [10, "standard care", "censored", 8.0], [11, "standard care", "returned", 9.2], [12, "standard care", "returned", 11.0], [13, "standard care", "returned", 13.5], [14, "standard care", "censored", 15.0], [15, "standard care", "returned", 18.0], [16, "new drug", "censored", 3.0], [17, "new drug", "returned", 5.1], [18, "new drug", "returned", 7.2], [19, "new drug", "censored", 9.0], [20, "new drug", "returned", 10.4], [21, "new drug", "censored", 12.0], [22, "new drug", "returned", 13.6], [23, "new drug", "returned", 15.1], [24, "new drug", "censored", 16.0], [25, "new drug", "returned", 18.5], [26, "new drug", "censored", 20.0], [27, "new drug", "returned", 21.2], [28, "new drug", "censored", 22.0], [29, "new drug", "returned", 23.5], [30, "new drug", "censored", 24.0]], "formats": {"time": "1dp"}, "title": "The 30 trial patients at the end of follow-up", "note": "Time is in months since enrolment. Returned means the condition came back at that month. Censored means the patient was still being followed with no return yet."}

Fifteen of these rows belong to the standard-care arm, and fifteen to the new drug. Some end in the condition returning. Others end in censored, meaning that patient lasted at least that long, with no return seen yet. From just this table, can you say which arm did better, and whether that gap is real or could easily be chance?

=== step === concept
## The Kaplan-Meier estimator, built step by step down the table

Start with just the standard-care arm: 15 patients, each with a time and whether that time ended in a return or in censoring.

The idea behind the Kaplan-Meier estimator is this. At time 0, nobody has returned yet, so survival is 1. Then walk down the sorted times one by one. Every time you reach a time where the condition returned, multiply a running product by one minus the fraction of at-risk patients who returned right then. Every time you reach a censored time, leave that running product untouched, since nothing happened to that patient yet, and just drop them out of who counts as at risk for every row after.

Written as a formula, with \(d_i\) returns and \(n_i\) patients at risk at each return time \(t_i\):

\[
S(t) = \prod_{t_i \le t} \left(1 - \frac{d_i}{n_i}\right)
\]

In this trial \(d_i\) is always 1, since no two patients return in exactly the same month.

Here is that running product, computed by hand down all 15 rows of the standard arm.

```r
# Build the standard arm's 15 patients and compute the Kaplan-Meier product by hand
std <- data.frame(
  t = c(1.5, 2.2, 3.1, 4.0, 4.6, 5.2, 6.0, 6.1, 7.4, 8.0, 9.2, 11.0, 13.5, 15.0, 18.0),
  e = c(1,   1,   1,   1,   0,   1,   1,   1,   1,   0,   1,   1,    1,    0,    1)
)
std <- std[order(std$t), ]
n <- nrow(std)
at_risk <- n - (seq_len(n) - 1)
survival <- numeric(n)
running_product <- 1
for (i in seq_len(n)) {
  if (std$e[i] == 1) {
    running_product <- running_product * (1 - 1 / at_risk[i])
  }
  survival[i] <- running_product
}
data.frame(time = std$t, event = std$e, at_risk = at_risk, survival = round(survival, 3))
#>    time event at_risk survival
#> 1   1.5     1      15    0.933
#> 2   2.2     1      14    0.867
#> 3   3.1     1      13    0.800
#> 4   4.0     1      12    0.733
#> 5   4.6     0      11    0.733
#> 6   5.2     1      10    0.660
#> 7   6.0     1       9    0.587
#> 8   6.1     1       8    0.513
#> 9   7.4     1       7    0.440
#> 10  8.0     0       6    0.440
#> 11  9.2     1       5    0.352
#> 12 11.0     1       4    0.264
#> 13 13.5     1       3    0.176
#> 14 15.0     0       2    0.176
#> 15 18.0     1       1    0.000
```

Read the first two rows. At month 1.5, all 15 patients are still at risk and 1 of them returns, so the product becomes \(1 \times (1 - 1/15) = 0.933\). At month 2.2, 14 remain at risk and 1 returns, so the product drops again to \(0.933 \times (1 - 1/14) = 0.867\).

Now look at month 4.6. That row is censored, so the survival column stays at 0.733, exactly what it was after month 4.0. But the at-risk count still falls, from 12 at month 4.0 to 11 at month 4.6, and that lower count of 11 is what the next row, month 5.2, actually divides by. A censored patient never pulls survival down. They only shrink the at-risk count for every row that comes after them.

By month 18.0 only 1 patient is left at risk, and that patient returns, so survival finishes at exactly 0.

The `survival` package's `survfit()` function builds this exact same running product with one function call. Confirm your hand table against it.

```r
# Confirm the hand-built sequence with survival::survfit()
library(survival)
fit_std <- survfit(Surv(t, e) ~ 1, data = std)
round(summary(fit_std)$surv, 3)
#>  [1] 0.933 0.867 0.800 0.733 0.660 0.587 0.513 0.440 0.352 0.264 0.176 0.000
```

That is 12 numbers, one for each of the 12 return times. Match them against the survival column from your hand table, skipping the 3 censored rows, and they line up exactly. `survfit()` only ever reports survival at a return time, since a censored time never changes it.

=== step === widget
## The survival curve as a step function

Here is that same standard-arm survival sequence, drawn as a curve instead of a table.

::widget km-curve {}

Use the toggle above the plot to switch to Standard, which isolates exactly the 15-patient arm you just built by hand. The curve drops at each of its 12 return times, by exactly the fraction you multiplied in at that row. Between returns it stays perfectly flat, and at each of its 3 censored times, 4.6, 8.0 and 15.0 months, it carries a small vertical tick mark with no drop.

That tick is the whole point of this picture. A drop means a return happened and survival fell. A tick means nothing happened at that moment, the patient was simply still being followed, and the curve has no reason to move.

=== step === quiz
## Quick check: reading a tick on the curve

Look at the standard arm's curve again. At month 8.0 there is a tick mark with no drop. What does that tick correctly tell you about that patient?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- That patient had not had the condition return by month 8.0, and was still being followed, with no return yet. ::ok Right. A tick with no drop means that patient reached month 8.0 with no return, still being followed. It is a lower bound on how long they lasted, not nothing, and not a return either.
- Nothing at all is known about that patient past month 8.0, since the tick just marks where their data stops. ::no
- The condition returned for that patient at month 8.0, it was just not drawn as a step down. ::no Both of those misread the tick. A tick is not nothing known, the patient's record up to that point is a real fact. And it is not a return either, since a return would have shown up as a drop in the curve. A tick marks exactly one thing: this patient was still being followed, with no return yet, at that month.

=== step === concept
## How uncertain the curve is: the confidence band

Fifteen patients is not a lot of patients. If this trial had drawn a different 15, the survival curve would come out slightly different each time. Greenwood's formula turns that sampling uncertainty into a standard error for \(S(t)\), by summing one small variance term for every return time up to \(t\):

\[
\text{Var}(S(t)) = S(t)^2 \sum_{t_i \le t} \frac{d_i}{n_i (n_i - d_i)}
\]

Each term in that sum uses the same \(d_i\) and \(n_i\) from the running product itself, so nothing new has to be measured. Here it is computed by hand for the standard arm, up through month 7.4.

```r
# Hand-compute Greenwood's variance sum for the standard arm up to month 7.4
events_so_far <- data.frame(
  time    = c(1.5, 2.2, 3.1, 4.0, 5.2, 6.0, 6.1, 7.4),
  at_risk = c(15,  14,  13,  12,  10,  9,   8,   7)
)
events_so_far$term <- 1 / (events_so_far$at_risk * (events_so_far$at_risk - 1))
variance_sum <- sum(events_so_far$term)
S_7_4 <- 0.440
se_7_4 <- S_7_4 * sqrt(variance_sum)
round(variance_sum, 4)
#> [1] 0.0909
round(se_7_4, 4)
#> [1] 0.1327
```

Eight return times have happened by month 7.4, so the sum has eight terms, one per row. Squaring that sum, multiplying by \(S(7.4)^2\), and taking the square root gives a standard error of 0.1327. At month 1.5 there is only one term in the sum, \(1/(15 \times 14)\), which gives a much smaller standard error, since only one return has happened yet.

`summary()` runs this same formula automatically and turns the standard error into a 95% confidence interval.

```r
# Confirm the standard error and 95% CI for the standard arm at months 1.5 and 7.4
summary(fit_std, times = c(1.5, 7.4))
#> Call: survfit(formula = Surv(t, e) ~ 1, data = std)
#> 
#>  time n.risk n.event survival std.err lower 95% CI upper 95% CI
#>   1.5     15       1    0.933  0.0644        0.815        1.000
#>   7.4      7       7    0.440  0.1327        0.244        0.795
```

At month 1.5, with 15 patients still at risk, survival sits at 0.933 with a tight interval, 0.815 to 1.000. By month 7.4, with only 7 patients left at risk, survival has fallen to 0.440, and the interval has stretched out to 0.244 to 0.795. The fewer patients remain, the less any one of them tells you about the whole arm, so the same curve carries a wider band the further out it runs.

=== step === concept
## Median survival, and when there isn't one

Median survival is the first time the curve is at or below 0.5. From the hand table two steps back, the standard arm sits at 0.513 at month 6.1, still above 0.5, then drops to 0.440 at month 7.4. So median survival for standard care is 7.4 months.

Build the new-drug arm's table the identical way, sorting its 15 times and multiplying in the same running product.

```r
# Build the new-drug arm's 15 patients the same way as the standard arm
new <- data.frame(
  t = c(3.0, 5.1, 7.2, 9.0, 10.4, 12.0, 13.6, 15.1, 16.0, 18.5, 20.0, 21.2, 22.0, 23.5, 24.0),
  e = c(0,   1,   1,   0,   1,    0,    1,    1,    0,    1,    0,    1,    0,    1,    0)
)
new <- new[order(new$t), ]
n <- nrow(new)
at_risk <- n - (seq_len(n) - 1)
survival <- numeric(n)
running_product <- 1
for (i in seq_len(n)) {
  if (new$e[i] == 1) {
    running_product <- running_product * (1 - 1 / at_risk[i])
  }
  survival[i] <- running_product
}
data.frame(time = new$t, event = new$e, at_risk = at_risk, survival = round(survival, 3))
#>    time event at_risk survival
#> 1   3.0     0      15    1.000
#> 2   5.1     1      14    0.929
#> 3   7.2     1      13    0.857
#> 4   9.0     0      12    0.857
#> 5  10.4     1      11    0.779
#> 6  12.0     0      10    0.779
#> 7  13.6     1       9    0.693
#> 8  15.1     1       8    0.606
#> 9  16.0     0       7    0.606
#> 10 18.5     1       6    0.505
#> 11 20.0     0       5    0.505
#> 12 21.2     1       4    0.379
#> 13 22.0     0       3    0.379
#> 14 23.5     1       2    0.189
#> 15 24.0     0       1    0.189
```

At month 18.5 the new-drug arm is still at 0.505, just above 0.5. It is only at month 21.2 that survival falls to 0.379, below the 0.5 line. So the new drug's median survival is 21.2 months, nearly three times the standard arm's 7.4.

```r
# Confirm the new-drug median with survival::survfit()
fit_new <- survfit(Surv(t, e) ~ 1, data = new)
fit_new
#> Call: survfit(formula = Surv(t, e) ~ 1, data = new)
#> 
#>       n events median 0.95LCL 0.95UCL
#> [1,] 15      8   21.2    13.6      NA
```

Now suppose this same trial had stopped early, at month 16, with every patient who had not yet returned by then simply censored at that point instead of followed further.

```r
# Administratively censor the new-drug arm at month 16 and rebuild the curve
new16 <- new
new16$e[new16$t > 16] <- 0
new16$t[new16$t > 16] <- 16
fit_new16 <- survfit(Surv(t, e) ~ 1, data = new16)
fit_new16
#> Call: survfit(formula = Surv(t, e) ~ 1, data = new16)
#> 
#>       n events median 0.95LCL 0.95UCL
#> [1,] 15      5     NA    13.6      NA
```

With the trial cut short at month 16, the curve's last observed return is at month 15.1, where survival sits at 0.606, and it never gets the chance to fall any further. Since 0.606 never reaches 0.5, `survfit()` reports the median as `NA`, not reached, rather than guessing at a number past the data it actually has.

[KEY INSIGHT]
A median that is "not reached" is not a missing result. It is the honest answer when a curve never crosses 0.5 inside the follow-up you actually have. Reporting a guessed number instead would claim more than the data supports.

=== step === widget
## Comparing both arms on one curve

Here are both arms on the same plot: the 15 standard-care patients and the 15 new-drug patients you just built by hand.

::widget km-curve {}

Each curve crosses the 50% line exactly where you computed its median: the standard-care curve at month 7.4, and the new-drug curve at month 21.2. For most of the 24 months the new-drug curve sits above the standard-care curve, meaning that at any given month, a larger share of new-drug patients are still return-free.

=== step === concept
## Is the gap real, or could it be noise: the log-rank test

A 7.4-month median against a 21.2-month median looks like a real difference, but with only 15 patients on a side, could standard care have just drawn an unlucky 15? The log-rank test answers exactly that, by comparing observed returns against expected returns at every time either arm has one.

At each such time, if both arms truly shared one common risk of returning, the expected number of standard-arm returns is that time's total returns, across both arms, multiplied by the standard arm's share of who is still at risk:

\[
E_i = e_i \times \frac{n_i^{\text{standard}}}{n_i^{\text{standard}} + n_i^{\text{new}}}
\]

```r
# Compare observed standard-arm returns against expected, at each pooled return time
std$arm <- "standard"
new$arm <- "new"
dat <- rbind(std, new)

pooled_times <- sort(unique(dat$t[dat$e == 1]))
expected_std <- numeric(length(pooled_times))
for (i in seq_along(pooled_times)) {
  tt <- pooled_times[i]
  at_risk_std <- sum(std$t >= tt)
  at_risk_new <- sum(new$t >= tt)
  total_events <- sum(dat$t == tt & dat$e == 1)
  expected_std[i] <- total_events * at_risk_std / (at_risk_std + at_risk_new)
}
data.frame(time = pooled_times, expected_std = round(expected_std, 3))[c(1, 17), ]
#>    time expected_std
#> 1   1.5        0.500
#> 17 18.0        0.143
round(sum(expected_std), 2)
#> [1] 5.84
sum(std$e)
#> [1] 12
```

At month 1.5, 15 of the 30 patients at risk are on standard care, so with 1 return that month the standard arm's expected share is \(1 \times 15/30 = 0.5\). At month 18.0, only 1 of the 7 patients still at risk is on standard care, so its expected share of that month's 1 return falls to \(1 \times 1/7 = 0.143\). Summed across all 20 pooled return times, the standard arm's expected count comes to 5.84, against 12 actually observed.

That 12-versus-5.84 gap, scaled by how much it could plausibly wobble by chance, is what the log-rank test turns into a chi-squared statistic.

```r
# Run the log-rank test comparing the two arms
log_rank <- survdiff(Surv(t, e) ~ arm, data = dat)
log_rank
#> Call:
#> survdiff(formula = Surv(t, e) ~ arm, data = dat)
#> 
#>               N Observed Expected (O-E)^2/E (O-E)^2/V
#> arm=new      15        8    14.16      2.68      10.6
#> arm=standard 15       12     5.84      6.51      10.6
#> 
#>  Chisq= 10.6  on 1 degrees of freedom, p= 0.001 
round(1 - pchisq(log_rank$chisq, df = 1), 4)
#> [1] 0.0012
```

That gives a chi-squared of 10.56 on 1 degree of freedom, and a p-value of 0.0012. Two things matter about what this test actually compares. First, it weighs the whole curve, every return time from both arms, not survival at any single month you might pick out. Second, it is at its weakest exactly when the two curves cross partway through, since an early advantage for one arm and a later advantage for the other can cancel out in the sum, even when each half is real on its own. Neither of those applies here. The new-drug curve sits above the standard-care curve for almost the entire 24 months, so the test has a clean, one-sided gap to work with.

=== step === widget
## How surprising a chi-squared of 10.56 is under pure chance

A chi-squared statistic on 1 degree of freedom is just a squared z-score, so this same statistic has an equivalent z value too.

```r
# Convert the log-rank chi-squared into its equivalent z-score
log_rank$chisq
#> [1] 10.5635
sqrt(log_rank$chisq)
#> [1] 3.250154
```

That is a z of about 3.25. Here is that value dragged onto a standard normal curve, the same bell-shaped distribution you would get from pure chance alone.

::widget null-distribution {"tails": 2, "max": 4, "start": 3.25, "label": "z equivalent of the log-rank statistic"}

The shaded area is the share of pure-chance results, in both directions, that would reach a statistic this extreme or more. At 3.25 that shaded area comes out to about 0.0012, matching the p-value computed above. Drag the slider back toward 0 and watch that shaded area grow, since a smaller gap between observed and expected events is far more ordinary under pure chance.

=== step === quiz
## Quick check: what the p-value actually says (closing, part 1)

The log-rank test comparing the two arms came back with p = 0.0012. Which sentence reads that correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- If both arms truly shared one survival curve, a gap in returns as large as the 12 observed against 5.84 expected on standard care would be rare, which is what p = 0.0012 says. ::ok Right. The test assumes both arms share one curve, then reports how rare a gap this large would be under that assumption. That is the only direction a log-rank p-value runs.
- Every patient on the new drug survives about three times as long as every patient on standard care. ::no
- p = 0.0012 proves the new drug is safe to give to patients. ::no Both of those claim more than the test can say. The log-rank test never looks at any one patient, so it cannot promise a fixed multiple of survival time for each person; the 21.2-against-7.4 medians describe the two arms overall, not every patient alike. And the test says nothing about safety at all, only that the two survival curves are unlikely to be the same curve.

=== step === tryit
## Your turn: extend the standard arm's table by one more row (closing, part 2)

`std` still holds the standard arm's 15 patients. You already know survival sits at 0.440 after month 7.4. Continue the running product one more row, to month 9.2.

```r
# Continue the standard arm's table one row past month 7.4, to month 9.2
at_risk_9_2 <- sum(std$t >= 9.2)
events_9_2  <- sum(std$t == 9.2 & std$e == 1)
factor_9_2 <- NA
factor_9_2
#> [1] NA

S_7_4 <- 0.440
S_9_2 <- NA
S_9_2
#> [1] NA
```

Replace the first `NA` with 1 minus `events_9_2` divided by `at_risk_9_2`. Replace the second `NA` with `S_7_4` times `factor_9_2`. Then say whether month 9.2 falls before or after the median you found two steps back. Press Check when you have both.

::check {"regex": "(?=[\\s\\S]*(1\\s*-\\s*events_9_2\\s*/\\s*at_risk_9_2|1\\s*-\\s*1\\s*/\\s*5))(?=[\\s\\S]*(S_7_4\\s*\\*\\s*factor_9_2|0\\.44\\s*\\*\\s*0\\.8))", "gate": true, "difficulty": "beginner", "ok": "Right. factor_9_2 is 1 - 1/5 = 0.8, so S_9_2 is 0.440 * 0.8 = 0.352. Month 9.2 falls after the median of 7.4 found earlier, so by month 9.2 more than half the standard arm has already returned.", "no": "Replace factor_9_2's NA with 1 - events_9_2 / at_risk_9_2 (or the fraction 1 - 1/5), and S_9_2's NA with S_7_4 * factor_9_2 (or 0.440 * 0.8)."}
::solution
```r
# Continue the standard arm's table one row past month 7.4, to month 9.2
at_risk_9_2 <- sum(std$t >= 9.2)
events_9_2  <- sum(std$t == 9.2 & std$e == 1)
factor_9_2 <- 1 - events_9_2 / at_risk_9_2
factor_9_2
#> [1] 0.8

S_7_4 <- 0.440
S_9_2 <- S_7_4 * factor_9_2
S_9_2
#> [1] 0.352
```

5 patients are at risk entering month 9.2, and 1 of them returns, which is why `factor_9_2` is smaller than most of the earlier rows. Month 9.2 comes after the standard arm's median of 7.4, so the running product has already fallen below 0.5 by the time it reaches 0.352.

=== step === concept
## References
::prose-only the sources are text, not a visual

- Kaplan, E.L., and Meier, P. (1958). [Nonparametric Estimation from Incomplete Observations](https://doi.org/10.1080/01621459.1958.10501452). Journal of the American Statistical Association, 53(282), 457-481. The paper that defines the estimator this lesson builds by hand.
- Mantel, N. (1966). [Evaluation of survival data and two new rank order statistics arising in its consideration](https://pubmed.ncbi.nlm.nih.gov/5910392/). Cancer Chemotherapy Reports, 50(3), 163-170. One of the two papers the log-rank test is named after.
- Peto, R., and Peto, J. (1972). [Asymptotically Efficient Rank Invariant Test Procedures](https://doi.org/10.2307/2344317). Journal of the Royal Statistical Society, Series A, 135(2), 185-207. The other founding paper, giving the test its modern form.
- Kleinbaum, D.G., and Klein, M. (2012). [Survival Analysis: A Self-Learning Text](https://doi.org/10.1007/978-1-4419-6646-9) (3rd ed.). Springer. A step-by-step treatment of both the estimator and the log-rank test for a first-time reader.
- Bland, J.M., and Altman, D.G. (2004). [The logrank test](https://doi.org/10.1136/bmj.328.7447.1073). BMJ, 328(7447), 1073. A short, widely cited explanation of what the test does and does not show.

=== step === complete
## What this gives you, and what comes next

Here is the trial's result in one sentence. The new drug's median survival, 21.2 months, is roughly three times the standard arm's 7.4 months, and the log-rank test says that gap is not the kind of thing pure chance produces on its own, at p = 0.0012.

You built that result from nothing but a running product multiplied down a sorted table, a variance sum that widens the fewer patients remain, and an observed-against-expected count at every time either arm had a return. No step along the way needed anything beyond arithmetic you could check by hand.

One number is still missing from this picture: a single figure for how much the new drug lowers the risk of returning, rather than just two medians to eyeball against each other. That is what the Cox model gives you, next.
