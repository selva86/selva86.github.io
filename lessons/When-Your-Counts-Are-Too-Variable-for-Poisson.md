---
title: "Generalized Linear Models Lesson 4: When your counts are too variable for Poisson"
catalog_blurb: "Diagnose overdispersion in a Poisson fit, then pick the right repair for it."
description: "A Poisson fit can report a confident interval that is wrong most of the time. Diagnose overdispersion and compare three repairs against measured coverage."
keywords: "overdispersion, quasi-Poisson, negative binomial, cluster-robust standard error, dispersion ratio, Poisson regression, count data, glm.nb, coverage simulation, R"
post_type: "LESSON"
curriculum_id: "4.80.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "4"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: "Rates-Offsets-and-Unequal-Exposure"
course_prev: "Modeling-Counts-with-Poisson-Regression"
---

=== step === cover
## When your counts are too variable for Poisson

Today let's understand overdispersion: what happens when a Poisson model's central assumption, that a count's variance equals its mean, turns out to be false, and the three repairs that put its reported intervals back on solid ground.

Here is the example for the whole lesson. Twenty five urgent care clinics each report one number a week: how many patients walked in. Twelve of them run standard hours, open 9 to 5. The other thirteen run extended hours, open until midnight. Tracked for 4 weeks each, that gives 100 weekly counts in total.

Standard-hours clinics average 8.44 visits a week. Extended-hours clinics average 12.96, close to half again as many, which fits with being open more hours.

Here is a sample of those weekly counts, five from each kind of clinic, nudged apart a little so the dots do not stack on top of each other.

::widget chart-plotter {"data":[{"x":-0.06,"y":6},{"x":0.03,"y":8},{"x":-0.02,"y":8},{"x":0.06,"y":9},{"x":0,"y":11},{"x":0.96,"y":4},{"x":1.04,"y":9},{"x":0.99,"y":13},{"x":1.07,"y":19},{"x":1,"y":26}],"geoms":["point"],"x":"hours","y":"visits"}

Standard-hours clinics, on the left, stay close together, from 6 to 11 visits. Extended-hours clinics, on the right, spread far wider, from 4 up to 26.

=== step === concept
## Checking whether this data's variance really equals its mean

A Poisson model carries one defining assumption: for a true Poisson count, the variance equals the mean, exactly. If a clinic's weekly visits really followed a Poisson distribution, that clinic group's week-to-week variance should land close to its own average.

Build the 100 weekly counts first, then check that assumption on each group.

```r
# Build the 25 clinics' weekly visit counts: 12 standard-hours, 13 extended-hours, 4 weeks each
set.seed(34)
clinic_group <- rep(c(0, 1), c(12, 13))
clinic_effect <- rnorm(25, 0, 0.35)
clinic_rate <- exp(log(8) + log(1.5) * clinic_group + clinic_effect)
visits <- rpois(100, rep(clinic_rate, each = 4))
extended <- rep(clinic_group, each = 4)
clinic_id <- rep(1:25, each = 4)

# Compare each group's mean weekly count to its own variance
tapply(visits, extended, mean)
tapply(visits, extended, var)
#>        0        1 
#>  8.43750 12.96154 
#>        0        1 
#> 12.54920 61.92006 
```

Each of the 25 clinics also got its own small random bump or dip in its typical rate, since real clinics are not perfectly identical even within the same hours group.

Standard-hours clinics (`extended` equal to 0) average 8.44 visits with a variance of 12.55. Divide one by the other and you get 1.49, close enough to the Poisson assumption of 1.

Extended-hours clinics average 12.96 visits, but their variance is 61.92, nearly five times their own mean. Divide and you get 4.78, nowhere near 1. This group's counts spread out far more than a Poisson distribution allows. That is called **overdispersion**: the variance running past what the chosen distribution permits.

That informal check, variance divided by mean, is worth running on any count data before fitting anything. But `glm()` carries a formal version of the same check, computed from the fitted model rather than the raw groups.

```r
# Fit the Poisson model and check how overdispersed the fit really is
fit <- glm(visits ~ extended, family = poisson)
round(summary(fit)$coef, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   2.1327     0.0497 42.9195        0
#> extended      0.4293     0.0629  6.8282        0

deviance_ratio <- fit$deviance / fit$df.residual
pearson_ratio <- sum(residuals(fit, type = "pearson")^2) / fit$df.residual
round(c(deviance_ratio = deviance_ratio, pearson_ratio = pearson_ratio), 2)
#> deviance_ratio  pearson_ratio 
#>           2.93           3.20 
```

Both numbers measure the same thing in slightly different ways: how much bigger the fitted model's actual spread is than a Poisson fit assumes. The Pearson version is

$$\hat\phi = \frac{1}{n-p}\sum_i \frac{(y_i-\hat\mu_i)^2}{\hat\mu_i}$$

the sum of each row's squared miss divided by its own fitted rate, averaged over the 98 degrees of freedom left after estimating the intercept and the `extended` coefficient. A well-behaved Poisson fit keeps this ratio near 1. Here it comes out to 2.93 by one measure and 3.20 by the other, both saying the fit is roughly three times as variable as a Poisson model expects.

Exponentiate the `extended` coefficient and the fit still looks perfectly usable.

```r
# Read the coefficient as a rate ratio, with its reported 95% interval
beta_extended <- coef(fit)[["extended"]]
naive_se <- summary(fit)$coefficients["extended", "Std. Error"]
rate_ratio <- exp(beta_extended)
naive_ci <- exp(beta_extended + c(-1, 1) * 1.96 * naive_se)
round(rate_ratio, 2)
#> [1] 1.54
round(naive_se, 4)
#> [1] 0.0629
round(naive_ci, 2)
#> [1] 1.36 1.74
```

Extended-hours clinics see 1.54 times the visits of standard-hours ones, and the reported 95% interval, 1.36 to 1.74, looks narrow and confident. But that confidence was computed by a model that had just failed its own dispersion check by a factor of three. Call this one the **naive standard error**, naive because it assumes variance equals mean, the very assumption the data just broke.

=== step === widget
## Seeing the mismatch in a textbook count distribution

This widget switches to a different dataset, a factory floor's daily equipment-breakdown count, running from 0 up to 9 breakdowns. It is not the clinic data, but it shows the same kind of mismatch you just computed.

::widget count-dist {}

On the Poisson view, the grey bar at zero holds 34% of the days, but the orange Poisson line only reaches about 10%. That gap, 0.24, is the same overdispersion you just measured on the clinics: a Poisson distribution that is too thin everywhere it needs to be thick, both at zero and out in its long tail. Switch to Negative Binomial and watch the orange line bend out to chase both.

=== step === concept
## The real cost: how often the naive interval is actually right

A dispersion ratio of 2.93 is a warning sign, but it does not yet say how much damage the naive standard error does to the 95% interval. The only way to find that out is to run the whole study many times and count.

Here is the plan. Generate a fresh batch of 25 clinics from the exact same process as before, true rate ratio 1.5, fit the naive Poisson model, build its 95% interval the usual way, and check whether 1.5, the number used to generate the data, actually falls inside that interval. Repeat that 2000 times.

```r
# Repeat the clinic study 2000 times and check how often the naive
# 95% interval actually contains the true rate ratio of 1.5
set.seed(100)
true_beta <- log(1.5)
nrep <- 2000
covered_naive <- logical(nrep)
for (i in seq_len(nrep)) {
  clinic_group_i <- rep(c(0, 1), c(12, 13))
  clinic_effect_i <- rnorm(25, 0, 0.35)
  clinic_rate_i <- exp(log(8) + log(1.5) * clinic_group_i + clinic_effect_i)
  visits_i <- rpois(100, rep(clinic_rate_i, each = 4))
  extended_i <- rep(clinic_group_i, each = 4)

  fit_i <- glm(visits_i ~ extended_i, family = poisson)
  beta_i <- coef(fit_i)[["extended_i"]]
  se_i <- summary(fit_i)$coefficients["extended_i", "Std. Error"]
  covered_naive[i] <- abs(beta_i - true_beta) <= 1.96 * se_i
}
round(100 * mean(covered_naive), 0)
#> [1] 58
```

That share of interval hits is called the interval's **coverage**: how often a 95% interval, built the usual way over and over, actually contains the true value. A trustworthy 95% interval should have a coverage close to 95%. This one covers the truth only 58% of the time, a little more than half.

That is not saying the 0.4293 coefficient itself is wrong. Overdispersion changes how spread out the data really is, not where the model's best estimate lands. What goes wrong is only the width drawn around that estimate: the naive standard error comes out too small, so the interval built from it is too narrow, and a rate ratio that is genuinely uncertain ends up looking far more settled than it actually is.

=== step === quiz
## Quick check: what overdispersion breaks

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The rate ratio itself stays a trustworthy estimate. What breaks is the reported standard error: it comes out too small, so the interval is too narrow and the effect looks more certain than it really is. ::ok Right. Overdispersion is a story about spread, not about where the estimate centers. The coefficient keeps landing near the truth; only the measured uncertainty around it is wrong.
- The rate ratio itself is biased, and a different link function is needed to fix it. ::no The log link is not the problem here. The coefficient stays centered on the truth even when the data is badly overdispersed. What is wrong is only the standard error measuring how sure you can be about it.
- The Poisson family is simply the wrong choice here and should be dropped entirely in favor of an ordinary linear model. ::no Dropping Poisson for a linear model brings back the problems Poisson regression was built to avoid, like negative predictions. Overdispersion calls for a model that keeps the same count structure but allows more spread, not for abandoning count models altogether.

=== step === concept
## Repair 1: quasi-Poisson, the same shape scaled by one number

The simplest fix keeps every part of the Poisson model exactly as it is, and only changes one number: instead of assuming the dispersion ratio equals 1, let the data say what it actually is, and multiply every variance by that number. This is called **quasi-Poisson**.

```r
# Fit a quasi-Poisson model: same formula, a dispersion estimated from the data
fit_qp <- glm(visits ~ extended, family = quasipoisson)
qp_dispersion <- summary(fit_qp)$dispersion
qp_se <- summary(fit_qp)$coefficients["extended", "Std. Error"]
round(qp_dispersion, 2)
#> [1] 3.2
round(qp_se, 4)
#> [1] 0.1125
round(qp_se / naive_se, 2)
#> [1] 1.79
```

The estimated dispersion, 3.20, is exactly the Pearson ratio from before. The standard error grows from 0.0629 to 0.1125, 1.79 times wider.

```r
# Rebuild the 95% interval with the widened standard error
qp_ci <- exp(beta_extended + c(-1, 1) * 1.96 * qp_se)
round(qp_ci, 2)
#> [1] 1.23 1.91
```

The interval widens from 1.36 to 1.74, out to 1.23 to 1.91. The coefficient, 0.4293, has not moved at all, since quasi-Poisson never re-estimates it. It only rescales every standard error by the same constant factor, the square root of 3.20, applied equally to every row regardless of what that row's own mean happens to be.

=== step === concept
## Repair 2: negative binomial, a variance that grows with the mean

Quasi-Poisson stretches every standard error by the same fixed multiple, no matter how big or small that row's mean is. But look back at the two groups from the first step: standard-hours clinics were only mildly overdispersed, ratio 1.49, while extended-hours clinics were badly overdispersed, ratio 4.78. A single flat multiplier cannot tell those two apart. The **negative binomial** model can, because it lets the variance grow with the mean instead of just scaling it.

$$\text{Var}(Y) = \mu + \frac{\mu^2}{\theta}$$

Here $\mu$ is the fitted mean, the same rate the Poisson model already estimates, and $\theta$ is one new parameter the negative binomial estimates from the data. A smaller $\theta$ means more extra variance piling on top of the mean. `MASS::glm.nb()` fits this model.

```r
# Fit a negative binomial model with the MASS package
library(MASS)
fit_nb <- glm.nb(visits ~ extended)
round(summary(fit_nb)$coef, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   2.1327     0.0769 27.7179        0
#> extended      0.4293     0.1029  4.1718        0
```

The coefficient, 0.4293, is identical to the Poisson fit's. The standard error grows to 0.1029, 1.64 times the naive one, a smaller jump than quasi-Poisson's 1.79 times. Unlike quasi-Poisson's single flat multiplier, this correction comes out of the negative binomial's own variance formula, which treats each group's mean on its own terms rather than inflating every row by the same fixed amount.

```r
# theta measures how much extra variance the mean alone cannot explain
round(fit_nb$theta, 2)
#> [1] 6.04
round(fit_nb$SE.theta, 2)
#> [1] 1.29
```

Theta comes out to 6.04, with a standard error of 1.29 around that estimate.

```r
# Compare the negative binomial's standard error and CI to the naive ones
nb_se <- summary(fit_nb)$coefficients["extended", "Std. Error"]
nb_ci <- exp(beta_extended + c(-1, 1) * 1.96 * nb_se)
round(nb_se / naive_se, 2)
#> [1] 1.64
round(nb_ci, 2)
#> [1] 1.26 1.88
```

Use theta to predict each group's own variance, and compare it to what the first step actually measured.

```r
# Use theta to predict each group's variance, and compare to the real one
mean_standard <- tapply(visits, extended, mean)[["0"]]
mean_extended <- tapply(visits, extended, mean)[["1"]]
var_pred <- c(standard = mean_standard + mean_standard^2 / fit_nb$theta,
              extended = mean_extended + mean_extended^2 / fit_nb$theta)
round(var_pred, 1)
#> standard extended 
#>     20.2     40.8 
```

The negative binomial's predicted variances, 20.2 for standard-hours and 40.8 for extended-hours, are not exact matches to the real 12.55 and 61.92. But they move in the right direction: extended-hours gets the bigger predicted variance, because theta lets variance grow with the mean. A Poisson model cannot do that at all, since it is locked into predicting the same variance as the mean for every row, 8.44 and 12.96, flat and unconnected to how overdispersed each group actually is.

=== step === concept
## Repair 3: cluster-robust SE, naming where the variance comes from

Quasi-Poisson and the negative binomial both treat every one of the 100 weekly counts as 100 separate, unrelated pieces of information. They are not. Look back at how the data was built: each of the 25 clinics got its own random rate multiplier, and then contributed 4 weeks, all drawn from that same clinic-specific rate. A clinic that happens to run a bit busier than its hours group would predict stays a bit busier for all 4 of its weeks, not just one.

That means the 100 rows are not 100 independent observations. They are 25 clusters of 4, and whatever makes one week at a clinic differ from what the model expects tends to push that clinic's other 3 weeks in the same direction too. Neither quasi-Poisson nor the negative binomial knows this: both still spread their correction evenly across rows, never asking which clinic a row came from.

A **cluster-robust standard error** asks exactly that question. For each row, its **score** is how far the observed count missed the fitted rate, weighted by its own predictor value, $(y_i - \hat\mu_i) \cdot x_i$. Instead of squaring every row's score on its own, sum the scores inside each clinic first, so a clinic's 4 weeks combine into one number, and only then square and add those 25 combined numbers together. That single change is what makes the correction cluster-robust instead of row-robust.

```r
# Build the cluster-robust standard error by hand: sum each clinic's
# score before squaring it, instead of squaring every row on its own
cluster_robust_se <- function(fit, cluster) {
  X <- model.matrix(fit)
  fitted_rate <- fitted(fit)
  score <- (fit$y - fitted_rate) * X
  clinic_score <- rowsum(score, cluster)
  bread <- solve(t(X) %*% (X * fitted_rate))
  meat <- t(clinic_score) %*% clinic_score
  sandwich <- bread %*% meat %*% bread
  sqrt(diag(sandwich))
}
cr_se <- cluster_robust_se(fit, clinic_id)[["extended"]]
round(cr_se, 4)
#> [1] 0.1679
```

`bread` is the same matrix `glm()` itself uses to compute its naive standard errors, the inverse of the weighted cross-product of the model's predictors. `meat` is where the cluster-robust idea actually lives: the sum, over all 25 clinics, of each clinic's squared combined score. Sandwiching `meat` between two copies of `bread` is why this family of corrections is called the **sandwich estimator**.

```r
# Rebuild the 95% interval with the cluster-robust standard error
cr_ci <- exp(beta_extended + c(-1, 1) * 1.96 * cr_se)
round(cr_se / naive_se, 2)
#> [1] 2.67
round(cr_ci, 2)
#> [1] 1.11 2.14
```

0.1679 is 2.67 times the naive standard error, the largest correction of the three, because this is the only one that names the clinics as the actual source of the extra variance rather than just inflating every row's uncertainty by a flat or mean-dependent amount. The rate ratio's interval, 1.11 to 2.14, comes close enough to 1 to show real doubt that the first two repairs hid completely.

=== step === concept
## Which repair matches the truth: the coverage numbers, compared

A single fit's standard error only tells you how that one repair treats this one sample. The fair test is the same one from before: repeat the clinic study 2000 times and measure how often each repair's 95% interval actually contains the true rate ratio of 1.5.

```r
# Repeat the clinic study 2000 times, now tracking all four
# standard errors and their 95% coverage of the true rate ratio
set.seed(100)
cover_naive <- cover_qp <- cover_nb <- cover_cr <- logical(nrep)
for (i in seq_len(nrep)) {
  clinic_group_i <- rep(c(0, 1), c(12, 13))
  clinic_effect_i <- rnorm(25, 0, 0.35)
  clinic_rate_i <- exp(log(8) + log(1.5) * clinic_group_i + clinic_effect_i)
  visits_i <- rpois(100, rep(clinic_rate_i, each = 4))
  extended_i <- rep(clinic_group_i, each = 4)
  cluster_i <- rep(1:25, each = 4)

  fit_i <- glm(visits_i ~ extended_i, family = poisson)
  beta_i <- coef(fit_i)[["extended_i"]]
  se_naive_i <- summary(fit_i)$coefficients["extended_i", "Std. Error"]
  cover_naive[i] <- abs(beta_i - true_beta) <= 1.96 * se_naive_i

  se_qp_i <- summary(glm(visits_i ~ extended_i, family = quasipoisson))$coefficients["extended_i", "Std. Error"]
  cover_qp[i] <- abs(beta_i - true_beta) <= 1.96 * se_qp_i

  fit_nb_i <- MASS::glm.nb(visits_i ~ extended_i)
  beta_nb_i <- coef(fit_nb_i)[["extended_i"]]
  se_nb_i <- summary(fit_nb_i)$coefficients["extended_i", "Std. Error"]
  cover_nb[i] <- abs(beta_nb_i - true_beta) <= 1.96 * se_nb_i

  se_cr_i <- cluster_robust_se(fit_i, cluster_i)[["extended_i"]]
  cover_cr[i] <- abs(beta_i - true_beta) <= 1.96 * se_cr_i
}
round(100 * c(naive = mean(cover_naive), quasi_poisson = mean(cover_qp),
              negative_binomial = mean(cover_nb), cluster_robust = mean(cover_cr)), 0)
#>            naive     quasi_poisson negative_binomial    cluster_robust 
#>               58                77                76                93 
```

::widget styled-table {"title":"Coverage of the naive 95% interval, four repairs","cols":["Method","SE (x naive)","95% coverage"],"rows":[["Naive Poisson","1.00x","58%"],["Quasi-Poisson","1.79x","77%"],["Negative binomial","1.64x","76%"],["Cluster-robust","2.67x","93%"]],"note":"2000 simulated repeats of the clinic design; true rate ratio 1.5."}

Quasi-Poisson and the negative binomial both lift the naive interval's coverage a long way, from 58% up to around 77%, but both fall well short of the 95% they are supposed to deliver. Cluster-robust reaches 93%, closest to nominal by a wide margin, because it is the only repair that models the actual source of the extra variance, clinic to clinic, not row to row.

Why not a clean 95%, even for cluster-robust? Because the sandwich estimator needs enough clusters to average over before it stabilizes, and 25 clinics is a moderate number, not a large one. More clinics in the study would likely close the rest of that gap.

This is the same mismatch the count-dist widget showed earlier, just measured a different way.

::widget count-dist {}

Switch that widget to Negative Binomial again. It closes most of the gap between the bars and the orange line, the same partial improvement the 76% coverage number just quantified: real progress, short of a complete fix.

=== step === quiz
## Quick check: matching a repair to what it assumes

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Quasi-Poisson, since it multiplies every row's variance by the same one estimated dispersion number, no matter how large that row's own mean is. ::ok Right. Quasi-Poisson's whole correction is one constant factor, the dispersion estimate, applied equally everywhere. The negative binomial and cluster-robust corrections both let the correction vary instead of holding it flat.
- The negative binomial, since its variance formula multiplies the mean by one constant factor. ::no The negative binomial's variance formula is the mean plus the mean squared over theta, which grows faster than the mean, not a constant multiple of it. A flat multiplier at every mean is quasi-Poisson's assumption, not the negative binomial's.
- Cluster-robust standard errors, since they are always the safest choice no matter how few clusters the data has. ::no Cluster-robust reached only 93% coverage here, short of the nominal 95%, precisely because 25 clusters is a moderate number, not a large one. More clusters would close that gap further; cluster-robust is not a free, assumption-free safest option regardless of cluster count.

=== step === tryit
## Your turn: diagnose overdispersion on a new stretch of clinics

A different stretch of 18 clinics, 9 standard-hours and 9 extended-hours, tracked for 5 weeks each, is already simulated and fitted below with the same kind of Poisson model as before.

```r
# A fresh batch of 18 clinics, 9 standard-hours and 9 extended-hours, 5 weeks each
set.seed(6)
clinic_group2 <- rep(c(0, 1), c(9, 9))
clinic_effect2 <- rnorm(18, 0, 0.35)
clinic_rate2 <- exp(log(8) + log(1.5) * clinic_group2 + clinic_effect2)
visits2 <- rpois(90, rep(clinic_rate2, each = 5))
extended2 <- rep(clinic_group2, each = 5)
fit2 <- glm(visits2 ~ extended2, family = poisson)
```

Write the one line that computes `fit2`'s Pearson dispersion ratio: the sum of its squared Pearson residuals, divided by its residual degrees of freedom. The same formula computed `pearson_ratio` for the original clinics earlier in this lesson.

```r
# fit2 is already fit above. Compute its Pearson dispersion ratio:
# sum of squared Pearson residuals, divided by residual degrees of freedom.
# One line. Press Check when you have it.
```
::check {"regex": "sum[(]\\s*residuals[(]\\s*fit2\\s*,\\s*type\\s*=\\s*[\"']pearson[\"'][)]\\s*\\^\\s*2[)]\\s*/\\s*fit2\\$df\\.residual", "gate": true, "difficulty": "intermediate", "ok": "Right: 2.67, confirming this fresh batch of clinics is overdispersed too, independent of the first one.", "no": "Reuse the dispersion-ratio formula from near the start of this lesson, with fit2 in place of fit: sum(residuals(fit2, type = \"pearson\")^2) / fit2$df.residual."}
::solution
```r
# Sum the squared Pearson residuals, divide by the residual degrees of freedom
round(sum(residuals(fit2, type = "pearson")^2) / fit2$df.residual, 2)
#> [1] 2.67
```

=== step === concept
## References
::prose-only a list of citations carries no visualizable concept

- [Regression Analysis of Count Data, 2nd edition](https://www.cambridge.org/core/books/regression-analysis-of-count-data/introduction/B75A323D25241D7B4F9C9AE735666827) - Cameron, A.C. and Trivedi, P.K. (2013), Cambridge University Press. The standard reference for quasi-Poisson, negative binomial, and other overdispersed count models.
- [Quasi-Poisson vs. Negative Binomial Regression: How Should We Model Overdispersed Count Data?](https://doi.org/10.1890/07-0043.1) - Ver Hoef, J.M. and Boveng, P.L. (2007), Ecology, 88(11). A direct comparison of the two repairs covered in this lesson.
- [A Practitioner's Guide to Cluster-Robust Inference](https://doi.org/10.3368/jhr.50.2.317) - Cameron, A.C. and Miller, D.L. (2015), Journal of Human Resources, 50(2). The reference behind the hand-built sandwich estimator in this lesson.
- [Modern Applied Statistics with S, 4th edition](https://www.stats.ox.ac.uk/pub/MASS4/) - Venables, W.N. and Ripley, B.D. (2002), Springer. The MASS package and `glm.nb()`, used to fit the negative binomial model here.
- [Negative Binomial Regression, 2nd edition](https://doi.org/10.1017/CBO9780511973420) - Hilbe, J.M. (2011), Cambridge University Press. A full treatment of theta and the negative binomial's variance assumption.

=== step === complete
## What you now know about overdispersed counts

A dispersion ratio of 2.93 to 3.20 flagged that this clinic data could not really be Poisson. The coverage simulation measured exactly what that cost: a 95% interval that actually contained the truth only 58% of the time.

Three repairs, three different standard errors:

- Quasi-Poisson scaled every standard error by one flat number, the estimated dispersion, 1.79 times the naive one.
- The negative binomial let variance grow with the mean through theta, 1.64 times the naive standard error, slightly less because its correction is not shared evenly between groups.
- Cluster-robust named the clinics themselves as the real source of the extra spread, 2.67 times the naive standard error, the largest correction and the one that reached 93% coverage, closest to the nominal 95%.

One rule carries all of this forward: diagnose first, with the dispersion ratio, before trusting any Poisson model's reported uncertainty. If the extra variance has no particular structure, quasi-Poisson or a negative binomial is usually enough. If it comes from the data sitting in natural groups, clinics, schools, patients measured more than once, reach for a cluster-robust standard error instead, and expect it to need more clusters than you might think before its own coverage closes all the way to nominal.
