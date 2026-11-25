---
title: "Survival and Event History Analysis Lesson 4: Checking proportional hazards and what to do instead"
catalog_blurb: "How to test whether one hazard ratio holds throughout a trial's follow-up."
description: "A 40-patient drug trial's pooled hazard ratio of 0.598 hides an early effect and a late one that cancel out, caught by Schoenfeld residuals and cox.zph()."
keywords: "proportional hazards, Schoenfeld residuals, cox.zph, hazard ratio, survival analysis, Cox model, time-varying effect, R"
post_type: "LESSON"
curriculum_id: "4.140.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "4"
course_total: "7"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: "Covariates-That-Change-During-Follow-Up"
course_prev: "The-Cox-Model-and-What-a-Hazard-Ratio-Means"
---

=== step === cover
## Checking proportional hazards and what to do instead

Today let's understand what the Cox model's proportional-hazards promise really claims, and what to do when a trial breaks it.

The chart below is not this lesson's trial yet. It is a generic baseline survival curve, and a second curve you can pull with the hazard ratio toggle above it.

::widget hazard-ratio {}

Toggle the hazard ratio and watch the second curve move, always on the same side of the baseline, right from month zero to the end of follow-up. That is the geometric promise of proportional hazards: one hazard ratio scales the whole curve the same way at every single month, so the two curves never cross.

Here is a trial that will test whether a real drug keeps that promise. A clinic runs a 36-month trial on 40 patients with a chronic condition. Twenty get standard care, and twenty get a new drug, and every patient is followed until the condition returns or the trial ends, whichever comes first.

Early in the trial, the new drug looked like a clear win. But by month 36, that early advantage looked like it had faded. This lesson asks whether one hazard ratio can honestly describe a drug whose effect changes like that, and if not, what to report instead.

That never-crossing picture above is the claim we are about to test against this trial's own numbers.

=== step === concept
## What the proportional-hazards assumption actually claims

Here is that promise, written as one equation.

\[ \frac{h_{\text{drug}}(t)}{h_{\text{standard}}(t)} = HR \quad \text{for every value of } t \]

\(h_{\text{drug}}(t)\) and \(h_{\text{standard}}(t)\) are each arm's hazard at month \(t\): the instantaneous risk that the condition returns right at that month, among patients who have made it that far without it returning. The part that matters most is "for every value of t". The ratio has to be the same number whether \(t\) is month 2 or month 30, not something you average once over the whole trial and call it a day.

HR itself is not a separate guess. It comes straight out of the Cox model's own fitted coefficient.

\[ HR = e^{\beta} \]

where \(\beta\) is the coefficient `coxph()` estimates for the arm variable. That is exactly the shape a never-crossing pair of curves draws: pick any one hazard ratio, and the two curves keep that same relationship at every month, which is only possible if the ratio itself never changes.

=== step === concept
## The trial, and the one hazard ratio it returns

Here is the trial built from the actual follow-up times, with one Cox model fit across both arms at once.

```r
# Build the trial from the recorded follow-up times and fit one Cox model across both arms
library(survival)

std_time   <- c(12.6, 2.3, 0.8, 1.6, 15.1, 4.5, 3.6, 11.3, 5.1, 36.0,
                 34.0, 13.1, 3.8, 4.9, 36.0, 3.9, 1.3, 22.6, 26.2, 17.1)
std_status <- c(1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1)
drug_time   <- c(12.4, 6.1, 22.4, 36.0, 24.2, 29.2, 3.3, 32.0, 36.0, 22.8,
                  33.6, 5.0, 27.5, 20.9, 12.5, 33.7, 14.1, 25.5, 25.2, 17.2)
drug_status <- c(1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)

trial <- data.frame(
  time   = c(std_time, drug_time),
  status = c(std_status, drug_status),
  arm    = factor(rep(c("standard", "drug"), each = 20), levels = c("standard", "drug"))
)

fit <- coxph(Surv(time, status) ~ arm, data = trial)
summary(fit)
#>
#> Call:
#> coxph(formula = Surv(time, status) ~ arm, data = trial)
#>
#>   n= 40, number of events= 36
#>
#>            coef exp(coef) se(coef)      z Pr(>|z|)
#> armdrug -0.5150    0.5975   0.3377 -1.525    0.127
#>
#>         exp(coef) exp(-coef) lower .95 upper .95
#> armdrug    0.5975      1.674    0.3083     1.158
#>
#> Concordance= 0.616  (se = 0.043 )
#> Likelihood ratio test= 2.3  on 1 df,   p=0.1
#> Wald test            = 2.33  on 1 df,   p=0.1
#> Score (logrank) test = 2.37  on 1 df,   p=0.1
```

`status` is 1 when the condition returned and 0 when the patient was still return-free at last contact, so `time` and `status` together are exactly what `Surv()` needs. Out of 40 patients, 36 eventually had the condition return and 4 were still return-free when the trial ended.

Read the coefficient row first. The coefficient is -0.515, so `HR = exp(-0.515) = 0.598`. A hazard ratio below 1 means the drug lowers the hazard: across the whole trial, a drug patient's risk of the condition returning at any given month is 0.598 times a standard-care patient's risk at that same month. The 95% interval runs from 0.308 to 1.158, and it crosses 1, so this pooled hazard ratio is not even significant on its own, p = 0.127.

Concordance is a different number answering a different question. Pick any two patients where you know who returned first, and ask how often the model ranks them in the right order: that share is concordance, running from 0.5 (no better than a coin flip) to 1 (perfect ranking). Concordance here is 0.616, better than chance but far from perfect, which is a statement about ranking, not about whether 0.598 is one honest number for the whole 36 months.

=== step === concept
## Schoenfeld residuals: comparing each death to its risk set, by hand

A Schoenfeld residual is not computed for every patient. It is computed only at the moment an event happens, and it compares that one patient's arm against what the fitted hazard ratio would expect the arm value to average out to among everyone still being followed at that exact moment.

Take the first event, at month 0.8. At that instant all 40 patients are still being followed: nobody has had the condition return yet, and nobody has been censored. Twenty are on standard care, arm value 0, and twenty are on the drug, arm value 1.

If the hazard ratio of 0.598 really held at month 0.8, the drug patients in that risk set carry 0.598 times the hazard of a standard-care patient. So the expected arm value is not a plain fifty-fifty average. It is weighted by hazard: each standard patient counts once, each drug patient counts 0.598 times, because a hazard ratio below 1 means a drug patient is less likely to be the one who fails right now.

That weighted average has one formula: the number of drug patients at risk, times HR, divided by the whole risk set weighted the same way.

\[ \text{weighted mean} = \frac{n_{\text{drug}} \cdot HR}{n_{\text{std}} + n_{\text{drug}} \cdot HR} \]

With 20 standard and 20 drug patients both still at risk at month 0.8, and HR = 0.598, that works out to \(20 \times 0.598 / (20 + 20 \times 0.598) = 0.374\). The patient who actually had the condition return at month 0.8 was on standard care, arm value 0. So the Schoenfeld residual at that event is 0 minus 0.374, which is -0.374.

Six more events, computed the same way by hand, line up exactly with what R's own `residuals()` returns.

```r
# Compute a Schoenfeld residual by hand for seven events, and check it against R's own residuals()
HR <- exp(coef(fit))

event_times <- c(0.8, 3.3, 6.1, 12.6, 17.2, 25.5, 33.7)
sch <- residuals(fit, type = "schoenfeld")

n_std  <- sapply(event_times, function(t) sum(trial$arm == "standard" & trial$time >= t))
n_drug <- sapply(event_times, function(t) sum(trial$arm == "drug" & trial$time >= t))
weighted_mean <- n_drug * HR / (n_std + n_drug * HR)
x_i <- sapply(event_times, function(t) as.numeric(trial$arm[trial$time == t & trial$status == 1][1] == "drug"))
by_hand <- x_i - weighted_mean

schoenfeld_table <- data.frame(
  time           = event_times,
  n_std_at_risk  = n_std,
  n_drug_at_risk = n_drug,
  weighted_mean  = round(weighted_mean, 3),
  residual_hand  = round(by_hand, 3),
  residual_R     = round(unname(sch[as.character(event_times)]), 3)
)
print(schoenfeld_table, row.names = FALSE)
#>  time n_std_at_risk n_drug_at_risk weighted_mean residual_hand residual_R
#>   0.8            20             20         0.374        -0.374     -0.374
#>   3.3            16             20         0.428         0.572      0.572
#>   6.1            10             18         0.518         0.482      0.482
#>  12.6             9             15         0.499        -0.499     -0.499
#>  17.2             5             14         0.626         0.374      0.374
#>  25.5             4              8         0.544         0.456      0.456
#>  33.7             3              3         0.374         0.626      0.626
```

Here is that same table twice, a raw print beside a formatted version, with the arm of the patient who actually had the event added in.

::widget styled-table {"cols": ["time","arm","n_std_at_risk","n_drug_at_risk","weighted_mean","residual"], "rows": [[0.8,"standard",20,20,0.374,-0.374],[3.3,"drug",16,20,0.428,0.572],[6.1,"drug",10,18,0.518,0.482],[12.6,"standard",9,15,0.499,-0.499],[17.2,"drug",5,14,0.626,0.374],[25.5,"drug",4,8,0.544,0.456],[33.7,"drug",3,3,0.374,0.626]], "formats": {}, "title": "Each event compared with its own risk set", "note": "weighted_mean uses the risk set sizes and the fitted hazard ratio, 0.598."}

Notice the risk set shrinking as the months go by: 20 and 20 at month 0.8, down to 3 and 3 by month 33.7, since every earlier event and every censoring removes one more patient from the pool. The hand-built residual matches R's own `residuals()` to three decimal places at all seven events. One residual on its own just says whether this particular event matched or beat what a constant hazard ratio of 0.598 would expect. Whether all 36 of them, taken together, actually drift with time is a separate question, and it is exactly what comes next.

=== step === concept
## Testing the whole trial at once: cox.zph() and its plot

`cox.zph()` takes every one of the trial's 36 Schoenfeld residuals, rescales each one by how much uncertainty the fitted hazard ratio carried at that moment, and tests whether that rescaled series trends with time instead of scattering flat around zero.

```r
# Test whether the Schoenfeld residuals drift with time instead of scattering flat
cox.zph(fit)
#>        chisq df      p
#> arm     6.78  1 0.0092
#> GLOBAL  6.78  1 0.0092
```

A chi-square of 6.78 on 1 degree of freedom gives p = 0.0092. If proportional hazards really held, a trend this strong would turn up only about 9 times in 1,000 trials by chance alone. That is small enough to say the hazard ratio is not holding steady across the 36 months.

Here is that same test drawn as a picture: each of the 36 rescaled residuals plotted against the month it happened, with a smooth line fit through them.

```r
# Plot the scaled Schoenfeld residuals against time, with a smooth trend line through them
plot(cox.zph(fit))
```

A flat, roughly horizontal line through these points would say the hazard ratio implied by the data stays the same number throughout follow-up. Here the fitted line climbs as the months go by, low on the left and higher on the right, which is the same drift the chi-square test already caught, just drawn out in full.

=== step === concept
## Splitting the follow-up: two hazard ratios instead of one

If the hazard ratio is drifting, the natural next move is to stop asking for one number and compute two instead: one for early follow-up, one for late.

```r
# Split follow-up at month 12 and fit a separate Cox model to each half
d_split <- survSplit(Surv(time, status) ~ ., data = trial, cut = 12, episode = "period")
d_split$period <- factor(d_split$period, levels = c(1, 2), labels = c("early", "late"))

fit_early <- coxph(Surv(tstart, time, status) ~ arm, data = d_split[d_split$period == "early", ])
fit_late  <- coxph(Surv(tstart, time, status) ~ arm, data = d_split[d_split$period == "late", ])

round(summary(fit_early)$coefficients, 4)
round(summary(fit_late)$coefficients, 4)
round(c(pooled = unname(exp(coef(fit))), early = unname(exp(coef(fit_early))), late = unname(exp(coef(fit_late)))), 3)
#>           coef exp(coef) se(coef)       z Pr(>|z|)
#> armdrug -1.6132    0.1992   0.6533 -2.4694   0.0135
#>
#>          coef exp(coef) se(coef)      z Pr(>|z|)
#> armdrug 0.1309    1.1398   0.4638 0.2822   0.7778
#>
#> pooled  early   late
#>  0.598  0.199  1.140
```

`survSplit()` cuts every patient's follow-up at month 12, so a patient who had the condition return at month 20 now contributes one row for months 0 to 12 (still return-free) and a second row for months 12 to 20 (the event). Fitting a separate Cox model on each half gives two very different answers. In the first 12 months the drug's hazard ratio is 0.199, p = 0.0135: a strong, real effect. From month 12 onward it is 1.140, p = 0.778: no effect at all, and if anything, the drug patients are doing very slightly worse.

The pooled hazard ratio of 0.598 is not a typo and it is not wrong arithmetic. It is the average of a real early effect and no late effect at all, which is a number that honestly describes neither period. That is exactly the drift `cox.zph()` already flagged, now visible as two concrete, opposite-looking hazard ratios instead of one trend line.

=== step === widget
## The same drift, across many simulated trials

This one trial's split could in principle be a fluke of which 40 patients happened to enroll. The widget below checks that by running the same kind of drift 600 times over, on its own simulated data rather than this trial's numbers.

Its proportional-hazards setting fixes an early hazard ratio at 0.50 and drags a late hazard ratio from 0.50 up to 1.00 as you move the severity dial, rerunning 600 simulated trials at every setting on the dial.

::widget assumption-dial {"assumption": "proportional-hazards"}

This trial's own early hazard ratio of 0.199 and late hazard ratio of 1.140 sit close to the dial's severe end. Drag it there and two things happen together: the 95% interval quoted for the early-period effect misses the true value far more often than the 95% it promises, while the model's concordance barely moves. A Cox model can keep ranking patients just as well while the one number it reports for an effect is already badly wrong for one half of the follow-up.

=== step === concept
## Three responses to the violation, and what each one gives up

There are three honest ways to respond once `cox.zph()` says one hazard ratio will not do, and they are worth comparing side by side.

```r
# Try two honest responses: let the baseline hazard differ by period, then add an explicit arm-by-period interaction
fit_strat <- coxph(Surv(tstart, time, status) ~ arm + strata(period), data = d_split)
fit_int   <- coxph(Surv(tstart, time, status) ~ arm * period, data = d_split)

round(summary(fit_strat)$coefficients, 3)
round(summary(fit_strat)$concordance, 3)
round(summary(fit_int)$coefficients, 4)
#>           coef exp(coef) se(coef)      z Pr(>|z|)
#> armdrug -0.515     0.598    0.338 -1.525    0.127
#>     C se(C)
#> 0.616 0.047
#>
#>                       coef exp(coef) se(coef)       z Pr(>|z|)
#> armdrug            -1.6132    0.1992   0.6533 -2.4694   0.0135
#> periodlate              NA        NA   0.0000      NA       NA
#> armdrug:periodlate  1.7441    5.7207   0.8012  2.1769   0.0295
```

The first response, `strata(period)`, lets the baseline hazard differ between the early and late period while still asking for one arm coefficient. It returns -0.515, exactly the pooled coefficient from the first fit, and concordance of 0.616, also unchanged. Stratifying by period fixes nothing here, and there is a reason: every risk set in this split data already sits entirely inside one period or the other, so letting only the baseline hazard move by period has no way to change what a single, assumed-constant arm coefficient estimates.

[NOTE]
The output also lists `periodlate` as NA, and that is not an error. At any single moment in this split data, every patient still being followed is in the early period or the late period together, never a mix, because period is just a label for when the calendar sits, the same for everyone at that instant. `coxph()` estimates an effect by comparing patients within the same risk set, and a covariate that never varies within any one risk set gives it nothing to compare. That is the same reason stratifying by period left the arm coefficient untouched: period's own effect is already absorbed into which risk set a patient belongs to.

The second response adds an explicit interaction, `arm * period`. The interaction term, `armdrug:periodlate`, comes out at 1.744, a hazard ratio of 5.72, with p = 0.0295. That is a direct, significant test that the arm effect itself changes between the two periods, at the cost of a model with one more term to explain to a reader.

The third response needs no new model at all: report the two period-specific hazard ratios from the split fits, 0.199 and 1.140, as two separate numbers instead of folding them into one. It is the least elegant of the three on paper and the most honest on the page, since it never pretends a single number was ever describing the whole 36 months.

=== step === quiz
## Quick check: fit, residuals and the hazard ratio

A colleague looks at this trial's concordance, 0.616, barely different from an ordinary Cox fit, and concludes the pooled hazard ratio of 0.598 is a fine single summary of the whole trial. Are they right?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Yes, because if the hazard ratio were really drifting, the model's concordance would have dropped along with it. ::no Concordance measures whether the model ranks patients in the right order. The drug lowered risk for most of the trial, which is enough to rank most pairs correctly even while the size of that effect changes over time.
- No. Concordance measures how well the model ranks patients by risk, which is a different question from whether one hazard ratio holds constant over the whole follow-up period. cox.zph() already returned p = 0.0092 for that second question, and splitting the follow-up confirmed it: an early hazard ratio of 0.199 against a late hazard ratio of 1.140, two different effects the pooled number of 0.598 averages away. ::ok Exactly. A model can rank patients well while still reporting one number for an effect that is really two different numbers, early and late. That gap is what cox.zph() is built to catch.
- Yes, because the pooled hazard ratio's own p-value, 0.127, is not significant, which already rules out a real drug effect. ::no A non-significant pooled hazard ratio only says that single averaged number is not distinguishable from 1. It says nothing about whether that single number is hiding two different, real effects.
- No, but only because a Schoenfeld residual causes concern only when it turns out negative. ::no A hazard ratio that is constant over time and a model that ranks patients well are two different claims. cox.zph() tests the first directly, and its p-value here, 0.0092, says the hazard ratio is drifting. Splitting the follow-up at month 12 shows exactly how: an early hazard ratio of 0.199 next to a late hazard ratio of 1.140. Concordance and a non-significant pooled p-value do not touch that question, and the sign of a Schoenfeld residual is not what cox.zph() tests either.

=== step === tryit
## Your turn: testing a response in code

`d_split` already holds the follow-up split at month 12, with its `period` column set to `early` or `late`. Fit the arm-by-period interaction model on it, the second of the three responses, and read its interaction coefficient.

```r
# fit_check should be a Cox fit on d_split, with an outcome of Surv(tstart, time, status)
# and a formula that includes an arm-by-period interaction, written as arm * period.
# Two lines: fit the model, then print round(summary(fit_check)$coefficients, 4).
# Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*coxph[(])(?=[\\s\\S]*arm\\s*[*:]\\s*period|[\\s\\S]*period\\s*[*:]\\s*arm)", "gate": true, "difficulty": "intermediate", "ok": "Right. The interaction coefficient on arm:period(late) is 1.744, a hazard ratio of 5.72, with p = 0.0295: the drift between the early and late hazard ratios is itself a real, detectable effect, not just two noisy separate estimates that happen to look different.", "no": "fit_check needs a coxph() call on d_split, with an interaction term between arm and period, written as arm * period or arm:period."}
::solution
```r
# Fit the arm-by-period interaction model and read its interaction coefficient
fit_check <- coxph(Surv(tstart, time, status) ~ arm * period, data = d_split)
round(summary(fit_check)$coefficients, 4)
#>                       coef exp(coef) se(coef)       z Pr(>|z|)
#> armdrug            -1.6132    0.1992   0.6533 -2.4694   0.0135
#> periodlate              NA        NA   0.0000      NA       NA
#> armdrug:periodlate  1.7441    5.7207   0.8012  2.1769   0.0295
```

=== step === concept
## References

- [Partial residuals for the proportional hazards regression model](https://doi.org/10.1093/biomet/69.1.239) - Schoenfeld (1982), Biometrika 69(1), 239-241. The original paper defining the Schoenfeld residual used by hand in this lesson.
- [Proportional hazards tests and diagnostics based on weighted residuals](https://doi.org/10.1093/biomet/81.3.515) - Grambsch and Therneau (1994), Biometrika 81(3), 515-526. The scaled-residual test behind `cox.zph()`.
- [Modeling Survival Data: Extending the Cox Model](https://doi.org/10.1007/978-1-4757-3294-8) - Therneau and Grambsch (2000), Springer. The standard reference for testing and extending the proportional-hazards assumption.
- [Survival Analysis: A Self-Learning Text](https://doi.org/10.1007/978-1-4419-6646-9) - Kleinbaum and Klein (2012, 3rd ed.), Springer. An accessible worked treatment of checking and handling non-proportional hazards.
- [The survival package](https://cran.r-project.org/package=survival) - Therneau, T. M., CRAN. The documentation for `coxph()`, `cox.zph()`, `survSplit()` and `residuals()` as used in this lesson.

=== step === complete
## What this gives you, and what comes next

A single sentence covers why 0.598 was never the honest answer: it averaged a real early effect, hazard ratio 0.199, against a late period with no effect at all, hazard ratio 1.140, into one number that was not even significant on its own and that `cox.zph()` flagged at p = 0.0092.

Stratifying by period alone did not fix anything, since every risk set already sat inside one period, leaving the arm coefficient exactly where it started. Adding an explicit arm-by-period interaction confirmed the drift was real, p = 0.0295 on the interaction term, and reporting the two period-specific hazard ratios separately covered both halves of the trial honestly instead of averaging them away.

The next lesson takes on a covariate that is not fixed at the start of follow-up at all, one that changes value partway through, like a treatment a patient starts midway, and the row-per-interval layout that handles it correctly.
