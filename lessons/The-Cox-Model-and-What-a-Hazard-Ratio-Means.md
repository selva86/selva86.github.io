---
title: "Survival and Event History Analysis Lesson 3: The Cox model and what a hazard ratio means"
catalog_blurb: "What a Cox hazard ratio actually compares, and two ways people misread it."
description: "A 30-patient drug trial's Cox model returns a hazard ratio of 0.192, built by hand from risk sets, then checked against two tempting but wrong readings."
keywords: "Cox proportional hazards, hazard ratio, partial likelihood, risk set, coxph, survival analysis, R"
post_type: "LESSON"
curriculum_id: "4.140.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "3"
course_total: "7"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: "Checking-Proportional-Hazards-and-What-to-Do-Instead"
course_prev: "Kaplan-Meier-Curves-and-the-Log-Rank-Test"
---

=== step === cover
## The Cox model and what a hazard ratio means

Today let's understand the Cox model, the method researchers reach for most often when comparing how fast an event happens between two groups, and the one number it hands back at the end, the hazard ratio.

Here is the trial we will use throughout this lesson. A hospital runs a 24-month trial on 30 patients with a chronic condition. Fifteen patients get standard care, and fifteen get a new drug. Every patient is followed for up to 24 months, and for each one the hospital records whether the condition came back and, if so, when, or else notes that the patient was still being followed with no return yet when the trial ended.

The chart below plots, for each arm, the share of patients who have not yet had the condition return, at every month of follow up.

::widget km-curve {}

Both curves start at 1, since nobody has had the condition return yet at month zero, and both fall as more patients do. By month 24 the two curves have drifted noticeably apart, the new drug's curve sitting above standard care for almost the whole 24 months.

=== step === concept
## Why the Cox model needs no assumption about survival time

Before writing the model down, one definition comes first. The hazard at a moment t is the instantaneous risk that the event happens right at t, given that it has not happened before t. A higher hazard means higher risk right then, not over the patient's whole follow-up.

The Cox model writes the hazard for patient i, at time t, as this.

\[
h_i(t) = h_0(t)\, e^{\beta x_i}
\]

- \(h_i(t)\) is the hazard for patient i at time t.
- \(h_0(t)\) is the baseline hazard, a function of time only, the same for every patient in the trial.
- \(\beta\) is a single coefficient the model estimates.
- \(x_i\) is 0 for a patient on standard care and 1 for a patient on the new drug.

Notice what \(h_0(t)\) is doing. It is left completely unspecified. The model never says whether it rises, falls, or wiggles over the 24 months. It only has to be the same function for every patient, whichever arm they are in.

That is why the ratio of two patients' hazards comes out so clean. Take a new-drug patient and a standard-care patient, both still being followed at the same moment t.

\[
\frac{h_{\text{new}}(t)}{h_{\text{standard}}(t)} = \frac{h_0(t)\, e^{\beta \times 1}}{h_0(t)\, e^{\beta \times 0}} = e^{\beta}
\]

The unspecified \(h_0(t)\) sits in both the top and the bottom, and cancels exactly. Whatever shape it has, the ratio comes out to \(e^{\beta}\) at every single moment of the trial. That constant, \(e^{\beta}\), is the hazard ratio, written HR.

This is why the Cox model is called semiparametric. It estimates \(\beta\), one real number, without ever assuming the trial's survival times follow a particular distribution such as exponential or Weibull. A model that had to assume a shape for \(h_0(t)\) would need that assumption to be right before any of its numbers could be trusted. The Cox model sidesteps the question entirely.

=== step === concept
## Risk sets: who is still being observed at each event

A risk set at a given moment is every patient who has not yet had the condition return and is still being followed right before that moment. A patient who already had the event, or who was censored earlier, has left the risk set and no longer counts.

The table below lists the trial's first seven event times, the earliest deaths and censorings across the whole 30-patient trial, and how many patients from each arm were still in the risk set right before each one.

::widget styled-table {"cols": ["time", "arm", "status", "n_at_risk_standard", "n_at_risk_new"], "rows": [[1.5, "standard care", "returned", 15, 15], [2.2, "standard care", "returned", 14, 15], [3.0, "new drug", "censored", 13, 15], [3.1, "standard care", "returned", 13, 14], [4.0, "standard care", "returned", 12, 14], [4.6, "standard care", "censored", 11, 14], [5.1, "new drug", "returned", 10, 14]], "formats": {"time": "1dp"}, "title": "Risk sets at the first seven event times in the trial", "note": "The risk set is everyone still being followed, event free, right before that moment. Watch n_at_risk_standard and n_at_risk_new shrink as deaths and censorings remove patients."}

Read the first row. At 1.5 months the whole trial is still intact, 15 standard-care and 15 new-drug patients, and the patient whose condition returns at 1.5 months is on standard care. Read the row for 3.0 months next, where nobody's condition actually returns.

A new-drug patient is simply censored there, meaning they leave the risk set with no event, which is why n_at_risk_new drops from 15 to 14 without any return being recorded. By the time the fifth death happens, at 5.1 months on the new drug, the risk set has shrunk to 10 standard-care and 14 new-drug patients.

That table has everything the Cox model needs for what comes next. Not the full shape of either curve, and not how long anyone eventually survived. Just the risk set at each moment, split by arm, and which arm the death at that moment fell in.

=== step === concept
## Building the partial likelihood by hand

At each death, ask a narrow question. Given everyone in the risk set at that exact moment, what is the probability that the patient who died is the one who actually did, rather than any of the others sharing that same risk set?

If the patient who died was on standard care, that probability is 1 divided by the risk set's weighted size, where every standard-care patient counts as 1 and every new-drug patient counts as HR. If the patient who died was on the new drug, the denominator is the same weighted size, but the numerator becomes HR instead of 1, since that is the new drug's share of the weighted total.

Written out, a standard-care death at a risk set of n0 standard and n1 new-drug patients contributes 1 / (n0 + n1 * HR). A new-drug death at the same kind of risk set contributes HR / (n0 + n1 * HR).

The partial likelihood multiplies one such term per death. Using the first five deaths from the table above, at 1.5, 2.2, 3.1, 4.0 and 5.1 months, with risk sets of 15/15, 14/15, 13/14, 12/14 and 10/14, here is that product written as a function of HR alone.

```r
# Multiply the five death terms to get the partial likelihood as a function of HR
partial_likelihood <- function(HR) {
  term1 <- 1 / (15 + 15 * HR)   # standard death, risk set 15 standard / 15 new
  term2 <- 1 / (14 + 15 * HR)   # standard death, risk set 14 standard / 15 new
  term3 <- 1 / (13 + 14 * HR)   # standard death, risk set 13 standard / 14 new
  term4 <- 1 / (12 + 14 * HR)   # standard death, risk set 12 standard / 14 new
  term5 <- HR / (10 + 14 * HR)  # new death, risk set 10 standard / 14 new
  term1 * term2 * term3 * term4 * term5
}

partial_likelihood(0.1)
#> [1] 1.777511e-07
partial_likelihood(0.192)
#> [1] 2.175895e-07
partial_likelihood(0.22)
#> [1] 2.190939e-07
partial_likelihood(0.5)
#> [1] 1.599987e-07
partial_likelihood(1)
#> [1] 6.822325e-08
```

Look at those five numbers. The product is highest somewhere around HR = 0.192 to 0.22, and falls away on both sides, lower at HR = 0.1, lower again at HR = 0.5, and much lower at HR = 1. `optimize()` finds exactly where that peak sits.

```r
# Find the HR that maximizes the partial likelihood
best_HR <- optimize(partial_likelihood, interval = c(0.01, 5), maximum = TRUE)
best_HR$maximum
#> [1] 0.2193573
```

0.219, close to 0.22. Notice everything that went into this number: five risk sets, five arm labels, and nothing else.

No survival times beyond the five deaths themselves enter the picture, and no assumption about what standard care's hazard looks like at month 20. Only the order the deaths happened in, and who shared the risk set when they did.

=== step === quiz
## Quick check: what the partial likelihood actually needs

To build the five-term product above, which of these did the calculation actually need to know?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The exact shape of the baseline hazard for standard care, since the product needs a starting curve to build from. ::no
- Only which patients were still being followed, event free, right before each death, and the order the deaths happened in. ::ok Exactly right. Each term in the product only looks at who shared the risk set at that moment and which arm the death fell in. Nothing about how long anyone would have survived if left alone ever enters the calculation.
- The total length of the trial's 24-month follow-up window. ::no
- The calendar date each death actually happened on. ::no None of these enter the partial likelihood. Every term only needs the risk set at that moment, split by arm, and whether the death there was on standard care or the new drug. The calendar dates, the follow-up length, and the shape of the baseline hazard never appear in the product.

=== step === concept
## Fitting the full model and reading its hazard ratio

The five-death calculation above is the idea in miniature. The full trial has 20 deaths across both arms, not five, and fitting the real Cox model means building that same kind of product over all 20 and maximizing it properly. R's `coxph()` does exactly that.

```r
# Build the 30-patient trial and fit the Cox model to read off the hazard ratio
library(survival)

std_time   <- c(1.5, 2.2, 3.1, 4.0, 4.6, 5.2, 6.0, 6.1, 7.4, 8.0, 9.2, 11.0, 13.5, 15.0, 18.0)
std_status <- c(1,   1,   1,   1,   0,   1,   1,   1,   1,   0,   1,   1,    1,    0,    1)
new_time   <- c(3.0, 5.1, 7.2, 9.0, 10.4, 12.0, 13.6, 15.1, 16.0, 18.5, 20.0, 21.2, 22.0, 23.5, 24.0)
new_status <- c(0,   1,   1,   0,   1,    0,    1,    1,    0,    1,    0,    1,    0,    1,    0)

trial <- data.frame(
  time   = c(std_time, new_time),
  status = c(std_status, new_status),
  arm    = factor(rep(c("standard", "new"), each = 15), levels = c("standard", "new"))
)

fit <- coxph(Surv(time, status) ~ arm, data = trial)
round(coef(fit), 3)
#> armnew 
#>  -1.65 
round(exp(coef(fit)), 3)
#> armnew 
#>  0.192 
round(exp(confint(fit)), 3)
#>        2.5 % 97.5 %
#> armnew 0.065   0.57
round(summary(fit)$coefficients[, "Pr(>|z|)"], 4)
#> [1] 0.0029
```

`status` is 1 when the condition returned and 0 when the patient was censored, and `arm` is set up so standard care is the reference level, which means the fitted coefficient describes the new drug against standard care.

`coef(fit)` is -1.65, the \(\beta\) coefficient from the hazard equation. `exp(coef(fit))` undoes that to give the hazard ratio directly, 0.192. The 95% confidence interval runs from 0.065 to 0.57, and the p-value is 0.0029, so this is not a result that could plausibly be noise.

Read the direction before the number. A hazard ratio under 1 means lower risk on the new drug, so 0.192 says this: at any moment during follow-up where a patient from each arm is still being watched, a new-drug patient's instantaneous risk of the condition returning is about a fifth of a standard-care patient's risk at that same moment. That is the only thing a hazard ratio is allowed to say about risk at a single moment. It says nothing about the overall chance the condition ever comes back, and nothing about how long anyone survives.

=== step === concept
## Two things a hazard ratio is not

The first tempting reading is a risk ratio, the share of each arm that ever had the event, divided across arms. Here is that crude comparison on the full trial, together with a comparison of median survival time.

```r
# Compare the hazard ratio against a crude risk ratio and a median-survival-time ratio
n_events <- tapply(trial$status, trial$arm, sum)
n_patients <- table(trial$arm)
crude_risk_standard <- n_events["standard"] / n_patients["standard"]
crude_risk_new <- n_events["new"] / n_patients["new"]
as.numeric(crude_risk_standard)
#> [1] 0.8
as.numeric(crude_risk_new)
#> [1] 0.5333333
crude_risk_ratio <- as.numeric(crude_risk_new / crude_risk_standard)
round(crude_risk_ratio, 3)
#> [1] 0.667

km_table <- summary(survfit(Surv(time, status) ~ arm, data = trial))$table
km_table[, c("records", "events", "median")]
#>              records events median
#> arm=standard      15     12    7.4
#> arm=new           15      8   21.2

median_standard <- as.numeric(km_table["arm=standard", "median"])
median_new <- as.numeric(km_table["arm=new", "median"])
median_ratio <- round(median_new / median_standard, 2)
median_ratio
#> [1] 2.86
round(1 / median_ratio, 2)
#> [1] 0.35
```

By the end of the trial, 12 of the 15 standard-care patients had the condition return, against 8 of the 15 on the new drug, a crude risk ratio of 0.667. Compare that to the fitted hazard ratio, 0.192, and the two numbers are nowhere near each other.

They are not measuring the same thing. The crude risk ratio only counts whether the event ever happened by month 24, while the hazard ratio describes risk at each moment along the way, which is a sharper and different question.

The second tempting reading is a fixed conversion to survival time. The median time to the condition returning was 7.4 months on standard care and 21.2 months on the new drug, a ratio of 2.86. Even its reciprocal, 0.35, does not match 0.192. A hazard ratio is not a scale factor you can multiply or divide a survival time by.

=== step === widget
## Why doubling a hazard does not usually halve survival time

Here is a question worth asking before moving on. If the new drug's hazard ratio were exactly 2 instead of 0.192, would that mean the condition returns in exactly half the time? The widget below answers it directly, using its own simple baseline hazard rather than this trial's.

::widget hazard-ratio {}

The widget's baseline hazard is constant over time, the same instantaneous risk at month 1 as at month 20. Push the toggle to HR = 2 and the median survival falls from exactly 20 to exactly 10, a clean halving. That clean relationship holds here because a constant hazard makes the whole survival curve exponential, and for an exponential curve, doubling the hazard really does halve every percentile of survival time, median included.

That is a special case, not a general rule. This trial's own hazard is not constant, since the underlying risk of the condition returning almost certainly changes over the 24 months. That is exactly why the median ratio, 2.86, and its reciprocal, 0.35, never landed anywhere near the hazard ratio, 0.192. A hazard ratio converts cleanly into a survival-time ratio only in the constant-hazard case this widget is built to show, and real trials are rarely that tidy.

=== step === quiz
## Quick check: reading this trial's hazard ratio honestly

A colleague looks at the fitted hazard ratio, 0.192, and says it means two things: the new drug cuts the chance the condition ever comes back to about a fifth, and stretches the time until it returns by about five times. Is the colleague right?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Yes, both halves are right: a fifth the chance the condition ever comes back, and about five times the survival time. ::no
- Only the first half is right. A fifth the chance the condition ever comes back, but it says nothing about survival time. ::no
- No. The hazard ratio of 0.192 only says that at any shared moment during follow-up, a patient on the new drug has about a fifth the instantaneous risk of a patient on standard care at that same moment. It says nothing fixed about the chance the condition ever returns, and nothing fixed about how long anyone survives. ::ok Right. This trial's own numbers already rule out both halves of that reading: the crude risk ratio came out at 0.667, not 0.192, and the median ratio came out at 2.86, with its reciprocal at 0.35, neither matching 0.192. A hazard ratio is honest only about instantaneous risk at a shared moment.
- Partly right. The two survival curves stay the same distance apart for the whole 24 months, which is what the hazard ratio is really describing. ::no A hazard ratio of 0.192 describes instantaneous risk at a shared moment, nothing else. It is not the chance the condition ever returns, not a fixed ratio of survival times, and not a promise that the gap between the two curves stays constant. This trial's own numbers, 0.667 and 2.86, already ruled out the first two readings.

=== step === tryit
## Your turn: the hazard ratio the other way round

The hazard ratio fitted so far describes the new drug against standard care, 0.192. Flip which arm is the reference, and the number should flip to its reciprocal, the hazard of standard care against the new drug. `relevel()` changes which level of a factor R treats as the baseline.

```r
# Relevel so the new drug becomes the reference arm, then refit and
# read the hazard the other way round.
# Three lines: relevel(trial$arm, ref = "new"), coxph() on that
# releveled arm, and exp(coef(...)) on the refitted model.
# Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*relevel[(])(?=[\\s\\S]*exp[(]coef[(])[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Exactly. Releveling just swaps which arm is the baseline, so the number flips to its reciprocal.", "no": "You need relevel() on the arm column of trial, with the new drug level set as the reference, then coxph() on that releveled arm, and exp(coef(...)) on the refitted model, to read the hazard the other way round."}
::solution
```r
# Relevel so the new drug becomes the reference arm, then refit and read the hazard the other way round
arm_new_ref <- relevel(trial$arm, ref = "new")
fit_reversed <- coxph(Surv(time, status) ~ arm_new_ref, data = trial)
round(unname(exp(coef(fit_reversed))), 2)
#> [1] 5.21
```

5.21, close to 1 divided by 0.192, which is also 5.21. Releveling does not change anything about the data or the fit itself. It only changes which arm the output is written relative to, so the same underlying result can be read as "new drug against standard care" or "standard care against the new drug," and the two readings are reciprocals of each other.

=== step === concept
## References

These are the sources behind the model and the numbers used in this lesson.

::prose-only the references are a text list of sources, not a visual

- [Regression Models and Life-Tables](https://doi.org/10.1111/j.2517-6161.1972.tb00899.x) - Cox (1972), Journal of the Royal Statistical Society, Series B, 34(2), 187 to 220. The original paper defining the Cox model and its partial likelihood.
- [Modeling Survival Data: Extending the Cox Model](https://doi.org/10.1007/978-1-4757-3294-8) - Therneau and Grambsch (2000), Springer. The standard reference for how `coxph()` actually computes a fit.
- [Survival Analysis: A Self-Learning Text](https://doi.org/10.1007/978-1-4419-6646-9) - Kleinbaum and Klein (2012), 3rd edition, Springer. An accessible, fully worked treatment of partial likelihood and hazard ratios.
- [The survival package](https://cran.r-project.org/package=survival) - Therneau, Comprehensive R Archive Network (CRAN). The documentation for `coxph()`, `Surv()`, and `relevel()` as used in this lesson.

=== step === complete
## What this gives you, and what comes next

Here is the whole lesson in one sentence. The new drug's hazard ratio against standard care is 0.192, with a 95% confidence interval from 0.065 to 0.57, built from a partial likelihood that only needed the order the deaths happened in and who shared each risk set.

That 0.192 is not a risk ratio. By month 24, 12 of 15 standard-care patients and 8 of 15 new-drug patients had the condition return, a crude risk ratio of 0.667, nowhere near 0.192.

It is not a survival-time ratio either. The median time to the condition returning was 7.4 months on standard care and 21.2 on the new drug, a ratio of 2.86, and neither that number nor its reciprocal, 0.35, matches 0.192. What 0.192 says, and all it says, is that at any shared moment during follow-up, a new-drug patient's instantaneous risk is about a fifth of a standard-care patient's.

One number describing the whole 24 months only works if that instantaneous risk stays in the same proportion the whole way through. The next lesson checks exactly that, whether this one hazard ratio holds steady over the full follow-up or drifts as time passes.
