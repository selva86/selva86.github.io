---
title: "Mixed Effects and Longitudinal Models Lesson 6: Correlated residuals inside a group"
slug: "Correlated-Residuals-Inside-a-Group"
description: "A random intercept misses residuals that are still correlated over time. Fit an AR(1) correction with nlme and see the standard error it actually raises."
keywords: "autocorrelation, AR(1) residuals, correlated residuals, mixed effects model, corAR1, nlme, lme, longitudinal data, repeated measures, standard error, lme4, random intercept, serial correlation"
mathjax: true
webr: true
post_type: "LESSON"
course_id: "res-mixed"
course_title: "Mixed Effects and Longitudinal Models"
course_lesson: "6"
course_total: "7"
course_landing: "Mixed-Effects-and-Longitudinal-Models-Course.html"
course_prev: "GEE-or-Mixed-Model-Two-Different-Questions"
course_next: "What-to-Do-When-Your-Mixed-Model-Will-Not-Converge"
curriculum_id: "4.90.6"
lesson_access: "pro"
catalog_blurb: "See why a random intercept misses correlation over time, and how to correct it."
---

=== step === cover
## Correlated residuals inside a group

Today let's look at what is actually left over once a mixed model's random intercept has finished its job.

Twenty patients are enrolled in a 12 week blood pressure trial, with a check-in every week. A random intercept gives each patient their own starting level: some patients run high on average, some run low, and the intercept is exactly the number that tells them apart.

Simulate the trial, then print patient 1 and patient 2's own 12 readings.

```r
# Simulate 20 patients over 12 weekly blood pressure visits
phi_true <- 0.6
innovation_sd <- 3
start_sd <- innovation_sd / sqrt(1 - phi_true^2)

simulate_patients <- function(n_patients, n_weeks) {
  patient_rows <- list()
  for (patient_id in 1:n_patients) {
    random_intercept <- rnorm(1, mean = 0, sd = 5)
    residual <- numeric(n_weeks)
    residual[1] <- rnorm(1, mean = 0, sd = start_sd)
    for (week in 2:n_weeks) {
      residual[week] <- phi_true * residual[week - 1] + rnorm(1, mean = 0, sd = innovation_sd)
    }
    bp <- 140 + random_intercept - 1.2 * (1:n_weeks) + residual
    patient_rows[[patient_id]] <- data.frame(patient = patient_id, week = 1:n_weeks, bp = bp)
  }
  out <- do.call(rbind, patient_rows)
  out$patient <- factor(out$patient)
  out
}

set.seed(42)
full <- simulate_patients(n_patients = 20, n_weeks = 12)

round(full$bp[full$patient == 1], 1)
#>  [1] 143.5 144.3 145.0 144.3 141.9 144.8 141.3 145.0 140.5 141.4 144.5 134.8
round(full$bp[full$patient == 2], 1)
#>  [1] 136.9 137.8 135.1 125.9 120.5 128.1 127.3 121.9 123.0 127.4 131.6 126.6
```

Plot those same two patients to see the shape instead of just the numbers.

```r
# Plot the two patients side by side
library(ggplot2)
ggplot(full[full$patient %in% c(1, 2), ], aes(week, bp, color = patient)) +
  geom_point() +
  geom_line() +
  labs(x = "Week", y = "Systolic blood pressure")
```

Both patients drift down over the 12 weeks, which is the treatment working. Patient 2 just happens to run lower overall than patient 1, and a random intercept is built exactly to capture a difference like that: one number per patient that shifts their whole line up or down, fitted straight from the data.

But that one number per patient says nothing about the smaller week to week bounce inside each patient's own 12 readings. Is that bounce independent noise, the way a plain mixed model assumes? Or does a high week still lean on the week right before it, something a random intercept was never built to catch? Measure it properly, rather than guess at it by eye.

Here is patient 1's own run once more, so you can look at that week to week bounce up close.

::widget chart-plotter {"data": [{"x":1,"y":143.5},{"x":2,"y":144.3},{"x":3,"y":145},{"x":4,"y":144.3},{"x":5,"y":141.9},{"x":6,"y":144.8},{"x":7,"y":141.3},{"x":8,"y":145},{"x":9,"y":140.5},{"x":10,"y":141.4},{"x":11,"y":144.5},{"x":12,"y":134.8}], "geoms": ["point", "line"], "x": "Week", "y": "Systolic blood pressure", "code": {}}

Switch between the point and line view above. The same twelve readings sit there either way, with whatever link connects one week to the next still hidden inside them.

=== step === concept
## What a random intercept leaves behind

Fit the familiar random-intercept model across all 20 patients, 12 readings each, and read off the fixed effects.

```r
# Fit the familiar random-intercept model across all 20 patients
library(lme4)
m_lmer <- lmer(bp ~ week + (1 | patient), data = full)

round(fixef(m_lmer), 3)
#> (Intercept)        week 
#>     141.190      -1.211 
round(sqrt(diag(vcov(m_lmer))), 3)
#> (Intercept)        week 
#>       1.142       0.058 
```

The week slope comes out at -1.211, with a standard error of 0.058, close to the true weekly drop of -1.2 used to build the data. So the fixed part of the model, the part that is the same for every patient, looks right.

Now check the part that is specific to each patient: the residuals left over once the model's own fitted line is subtracted out. If the random intercept had already caught everything that keeps a patient's readings together over time, each patient's own 12 residuals should look like independent noise, with no real link between one week's residual and the next.

Split the residuals by patient, and for each patient correlate every residual with the very next week's residual, what statisticians call the lag-1 correlation. Average that correlation across all 20 patients.

```r
# Check whether each patient's own residuals still move together week to week
full$resid <- residuals(m_lmer)
lag1_by_patient <- sapply(split(full$resid, full$patient), function(r) cor(r[-length(r)], r[-1]))
round(mean(lag1_by_patient), 3)
#> [1] 0.314
```

0.314 is nowhere close to zero. A random intercept is a single number per patient, fixed for every one of that patient's 12 weeks, so it cannot create or remove any link between neighbouring weeks on its own. Whatever is producing that 0.314 came from somewhere else, something still sitting inside the week-to-week readings themselves.

=== step === widget
## Watching a confidence interval fail while the fit looks fine

The pattern just measured, where a residual depends partly on the residual right before it, has a name: an autoregressive process of order 1, or AR(1) for short. In an AR(1) process, today's residual is written as a fraction of yesterday's residual, plus a fresh nudge that owes nothing to the past:

\(e_{i,t} = \phi \, e_{i,t-1} + \varepsilon_{i,t}\)

Here \(\phi\) (phi) is a single number between -1 and 1 that sets how strongly a residual leans on the one before it, and \(\varepsilon_{i,t}\) is the fresh nudge. When \(\phi\) is 0, every residual is independent of the last, which is exactly what a plain mixed model always assumes. The 0.314 you just measured says that assumption is already shaky.

Drag the severity dial below from none to severe, and read two numbers together: how often a 95% interval still covers the true value (coverage), and how good the fit looks by R-squared.

::widget assumption-dial {"assumption": "autocorrelation"}

This dial is not reading the patient panel above. It runs its own single 60 point time series, rebuilt fresh at every setting, but driven by the exact same AR(1) process just defined, so it is measuring the identical disease on a scale you can turn up by hand. Drag it toward severe, and coverage falls well below the 95% it claims, while R-squared holds steady or even climbs a little. The fit gives no sign that anything is wrong. Only the coverage does.

=== step === widget
## Reading the dial at this trial's own strength

Now pin that same dial at roughly this trial's own strength, instead of its most extreme setting.

::widget assumption-dial {"assumption": "autocorrelation", "start": 6}

At this setting the dial's own \(\phi\) works out to about 0.92 times six tenths, or roughly 0.55, close to the 0.6 used to simulate the patients and close to the 0.554 that an AR(1) model fits later in this lesson, on these patients' own data. Read the coverage number at this setting, and hold onto it. It is roughly how far a 95% interval's true coverage has already fallen for a trial shaped like this one, before anyone corrects for it.

=== step === quiz
## Quick check: fit versus coverage

On that dial, dragging toward severe left R-squared steady or higher while coverage fell well below 95%. Which statement reads that correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because R-squared held steady or even rose as the dial moved, the interval's reported coverage must still be trustworthy too. ::no
- A confidence interval's coverage can fall well below 95% even while R-squared holds steady or rises, because autocorrelation damages the standard error, not the fitted line. ::ok Right. A violated independence assumption attacks the standard error quoted around an estimate. It does not have to touch how well the fitted line matches the data, which is what R-squared measures.
- Once autocorrelation is present, the fitted slope itself becomes biased, which is why the interval needs fixing. ::no
- R-squared and interval coverage always move together, so if one looks fine the other does too. ::no No. On the dial, R-squared held steady or even rose while coverage fell well below 95%. A violated independence assumption breaks the standard error quoted around an estimate. It does not have to touch the fitted line's own fit statistic at all. The two numbers answer different questions, and only coverage tells you whether the interval can be trusted.

=== step === concept
## Fitting the correction with lme() and corAR1()

Fit the same mean structure twice on the full trial: once assuming independent residuals, and once letting each patient's own residuals follow an AR(1) process in time.

```r
# Fit the same model with and without an AR(1) correlation structure on the residuals
library(nlme)
m_lme_indep <- lme(bp ~ week, random = ~1 | patient, data = full)
m_lme_ar1 <- lme(bp ~ week, random = ~1 | patient, data = full,
                  correlation = corAR1(form = ~week | patient))

round(c(indep = AIC(m_lme_indep), ar1 = AIC(m_lme_ar1)), 1)
#>  indep    ar1 
#> 1302.1 1248.2 
round(coef(m_lme_ar1$modelStruct$corStruct, unconstrained = FALSE), 3)
#>   Phi 
#> 0.554 
anova(m_lme_indep, m_lme_ar1)
#>             Model df      AIC      BIC    logLik   Test  L.Ratio p-value
#> m_lme_indep     1  4 1302.123 1316.012 -647.0615                        
#> m_lme_ar1       2  5 1248.194 1265.555 -619.0968 1 vs 2 55.92952  <.0001
```

The `correlation = corAR1(form = ~week | patient)` argument tells `lme()` to let each patient's own residuals follow the AR(1) process just defined, ordered by week, with the `patient` column marking where one patient's own series ends and the next one's begins.

The fitted \(\phi\) comes out at 0.554, close to the 0.6 used to build the data in the first place. AIC rewards a model for fitting better, but it also charges a penalty for every extra parameter a model spends, and here it drops from 1302.1 without the correction to 1248.2 with it, comfortably clearing that penalty. A likelihood-ratio test puts a number on how unlikely a drop that size would be if the simpler, independent-residual model were actually correct: L.Ratio of 55.93 on the one extra parameter corAR1() spends, with a p-value under 0.0001. The correlated-residual model is not a cosmetic add-on. The data clearly prefer it.

=== step === concept
## What changes for the treatment effect, and what does not

Pull the week slope and its standard error from both models, with and without the correction.

```r
# Compare the week slope and its standard error, with and without the correction
round(summary(m_lme_indep)$tTable["week", c("Value", "Std.Error")], 3)
#>     Value Std.Error 
#>    -1.211     0.058 
round(summary(m_lme_ar1)$tTable["week", c("Value", "Std.Error")], 3)
#>     Value Std.Error 
#>    -1.210     0.092 
se_ratio <- summary(m_lme_ar1)$tTable["week", "Std.Error"] /
            summary(m_lme_indep)$tTable["week", "Std.Error"]
round(se_ratio, 2)
#> [1] 1.57
```

The slope itself barely moves: -1.211 without the correction, -1.210 with it, the same number to two decimal places. Correcting for autocorrelation did not change the estimated treatment effect at all.

What changed is the standard error: 0.058 without the correction, 0.092 with it, 1.57 times larger. That 1.57 is not a quirk of this one fit. Twelve weekly readings on the same patient are not twelve independent pieces of evidence when neighbouring weeks move together, because each new reading partly repeats what the week before it already said. A model that assumes independent rows, like the plain random-intercept fit, treats all twelve as fully independent and ends up quoting a standard error that is too small for the information it actually has. The AR(1) correction counts the real, smaller amount of independent information honestly, so its standard error comes out larger, and that larger number is the trustworthy one.

=== step === concept
## How many visits before this correction is worth it?

Run the exact same comparison again, on the same 20 patients, but with only 3 visits each instead of 12.

```r
# Repeat the comparison, but with only 3 visits per patient instead of 12
set.seed(42)
short <- simulate_patients(n_patients = 20, n_weeks = 3)

m_lme_indep_s <- lme(bp ~ week, random = ~1 | patient, data = short)
m_lme_ar1_s <- lme(bp ~ week, random = ~1 | patient, data = short,
                    correlation = corAR1(form = ~week | patient))

round(c(indep = AIC(m_lme_indep_s), ar1 = AIC(m_lme_ar1_s)), 1)
#> indep   ar1 
#> 351.3 350.9 
anova(m_lme_indep_s, m_lme_ar1_s)
#>               Model df      AIC     BIC    logLik   Test  L.Ratio p-value
#> m_lme_indep_s     1  4 351.2663 359.508 -171.6331                        
#> m_lme_ar1_s       2  5 350.8958 361.198 -170.4479 1 vs 2 2.370499  0.1236
se_ratio_s <- summary(m_lme_ar1_s)$tTable["week", "Std.Error"] /
              summary(m_lme_indep_s)$tTable["week", "Std.Error"]
round(se_ratio_s, 2)
#> [1] 1.22
```

With only 3 visits per patient, AIC barely moves, 351.3 without the correction against 350.9 with it, and the likelihood-ratio test does not clear the usual 0.05 bar: its p-value is 0.124. The standard-error ratio shrinks too, from 1.57 times with 12 visits down to 1.22 times with 3.

The reason is the same effective-information idea from a moment ago, just run in the other direction. With only 3 readings per patient, there are only 2 gaps between neighbouring weeks for the correlation to act on, far too little for an AR(1) correction to earn its extra parameter back. With 12 readings per patient, there are 11 such gaps, plenty for the same correlation to add up to something that matters. The rule that falls out of both comparisons: check for this correction when each subject carries many repeated measurements, and feel safe skipping it when each subject only has a handful.

=== step === quiz
## Quick check: putting it together

A colleague brings two new datasets. The first follows 40 patients through 6 monthly visits each. The second follows 15 patients through 20 weekly visits each. Based on what the 3-visit and 12-visit comparison just showed, which statement applies the rule correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Both datasets are different enough from the 3-visit and 12-visit cases that nothing learned here carries over to them. ::no
- Fit the AR(1) correction by default on every mixed model, no matter how many visits each subject has, since it can only help. ::no
- The 20-visit study has enough repeated measurements per subject for the correction to likely matter, much as the 12-visit trial did. The 6-visit study sits closer to the 3-visit case, where the correction barely moved anything. ::ok Right. The number of repeated measurements per subject, not the dataset's name or its total size, is what decides whether this correction is worth fitting.
- Skip the AR(1) correction on both datasets, since it spends an extra parameter and makes the model harder to explain. ::no No. The correction is not free, but it is not optional either. A handful of visits per subject rarely carries enough signal for it to move the answer, the way the 3-visit comparison showed. Many repeated visits per subject, as in the 20-visit study, carries enough signal for the same correlation to matter, the way the 12-visit comparison showed. There is no single default: check for it when subjects carry many repeated measurements, and feel safe skipping it when they only have a few.

=== step === tryit
## Your turn: add the correction yourself

`full` still holds all 20 patients' 12 weekly readings. Add the AR(1) correlation structure to this plain `lme()` call, the same way it was fitted earlier in this lesson, then compare the week slope's standard error to the 0.058 a plain fit gives.

```r
# Add the AR(1) correction to this model, then compare its standard error
m_lme_corrected <- lme(bp ~ week, random = ~1 | patient, data = full,
                        ____)

round(summary(m_lme_corrected)$tTable["week", c("Value", "Std.Error")], 3)
```
::check {"regex": "corAR1[(]form *= *~week *[|] *patient[)]", "gate": true, "difficulty": "beginner", "ok": "Right. The standard error should land at about 0.092 now, close to 0.058 times 1.57, the exact relationship just computed by hand.", "no": "The correlation argument goes inside the same lme() call, right after data: correlation = corAR1(form = ~week | patient)."}
::solution
```r
# Add the AR(1) correction to this model, then compare its standard error
m_lme_corrected <- lme(bp ~ week, random = ~1 | patient, data = full,
                        correlation = corAR1(form = ~week | patient))

round(summary(m_lme_corrected)$tTable["week", c("Value", "Std.Error")], 3)
#>     Value Std.Error 
#>    -1.210     0.092 
```

=== step === concept
## References

::prose-only a list of citations carries no visualizable concept

- [Mixed-Effects Models in S and S-PLUS](https://doi.org/10.1007/b98882) - Pinheiro, J.C. and Bates, D.M. (2000), Springer. The book behind nlme's lme() and its correlation structures, including corAR1(), fitted in this lesson.
- [Fitting Linear Mixed-Effects Models Using lme4](https://doi.org/10.18637/jss.v067.i01) - Bates, D., Machler, M., Bolker, B. and Walker, S. (2015), Journal of Statistical Software, 67(1). The paper behind lmer(), fitted first in this lesson before the correction is added.
- Diggle, P.J., Heagerty, P., Liang, K.Y. and Zeger, S.L. (2002). Analysis of Longitudinal Data, 2nd edition. Oxford University Press. Covers serial correlation among repeated measurements on the same subject, the exact pattern this lesson corrects for.
- [Random-effects models for longitudinal data](https://doi.org/10.2307/2529876) - Laird, N.M. and Ware, J.H. (1982), Biometrics, 38(4), 963-974. A founding paper on mixed models for repeated measures, the setting this lesson's correction extends.
- [Linear Mixed Models for Longitudinal Data](https://doi.org/10.1007/b98969) - Verbeke, G. and Molenberghs, G. (2000), Springer. A full treatment of residual covariance structures for mixed models, including the autoregressive structure fitted in this lesson.

=== step === complete
## What the autoregressive correction changed, and what it did not

This lesson started with twenty patients, twelve weekly readings each, and a random intercept that only ever tells one patient's line apart from another's.

That random intercept left a real signal behind: a mean lag-1 residual correlation of 0.314 across all 20 patients, far from the zero a plain mixed model assumes. Fitting an AR(1) correction with corAR1() put a proper number on it, phi of 0.554, close to the 0.6 used to build the data, and it earned its place: AIC dropped from 1302.1 to 1248.2, backed by a likelihood-ratio test that does not leave much room for doubt.

The week slope itself barely moved, -1.211 to -1.210. What moved was the honesty of its standard error, up from 0.058 to 0.092, 1.57 times larger, because 12 correlated weekly readings never carried 12 independent readings' worth of information in the first place.

None of that showed up with only 3 visits per patient. AIC barely moved, the likelihood-ratio test did not clear its usual bar, and the standard-error ratio shrank to 1.22. So the rule is about how many repeated measurements each subject carries, not about whether a model happens to have a time variable in it: check for this correction with many repeated visits per subject, and feel safe skipping it with only a few.

The next part of this course asks what to do when a mixed model like this one refuses to converge at all.
