---
title: "Mixed Effects and Longitudinal Models Lesson 4: Reading variance components and the ICC"
slug: "Reading-Variance-Components-and-the-ICC"
description: "Compute the within-clinic and between-clinic variance by hand, form the intraclass correlation, and see why more patients per clinic eventually stops helping."
keywords: "intraclass correlation, variance components, within-clinic variance, between-clinic variance, ICC in R, design effect, effective sample size, clustered data, mean squares, mixed effects model"
mathjax: true
webr: true
post_type: "LESSON"
course_id: "res-mixed"
course_title: "Mixed Effects and Longitudinal Models"
course_lesson: "4"
course_total: "7"
course_landing: "Mixed-Effects-and-Longitudinal-Models-Course.html"
course_prev: "Modeling-Change-Within-a-Person"
course_next: "GEE-or-Mixed-Model-Two-Different-Questions"
curriculum_id: "4.90.4"
lesson_access: "pro"
catalog_blurb: "Compute the ICC by hand and see why more patients per clinic stops helping."
---

=== step === cover
## Reading variance components and the ICC

Today let's take the two numbers sitting underneath almost every mixed model, the within-group variance and the between-group variance, and turn them into one number worth reading on its own: the intraclass correlation.

Thirty clinics each started ten patients on a new blood pressure medication, and eight weeks later every patient's drop in systolic blood pressure was recorded. Here is that trial laid out before any formula touches it: every patient's own drop, grouped by clinic, with each clinic's own mean marked and the grand mean drawn as a dashed line across all three hundred.

![Each patient's blood pressure drop, by clinic, with each clinic's own mean and the grand mean marked.](screenshots/Reading-Variance-Components-and-the-ICC-cover-scatter.png)

*Each patient's blood pressure drop, by clinic, with each clinic's own mean and the grand mean marked.*

Build that same trial in R now, and reproduce this picture yourself.

```r
# Build 30 clinics of 10 patients each and plot every patient by clinic
set.seed(42)
n_clinics <- 30
n_patients <- 10
clinic <- factor(rep(1:n_clinics, each = n_patients))
clinic_effect <- rnorm(n_clinics, mean = 0, sd = 1)
patient_noise <- rnorm(n_clinics * n_patients, mean = 0, sd = 1)
y <- 10 + 3 * clinic_effect[clinic] + 6 * patient_noise
clin <- data.frame(clinic = clinic, y = y)

clinic_means <- tapply(clin$y, clin$clinic, mean)
grand_mean <- mean(clin$y)

plot(as.numeric(clin$clinic), clin$y, pch = 16, col = "grey55",
     xlab = "clinic", ylab = "drop in systolic blood pressure (mmHg)",
     main = "Each patient's blood pressure drop, by clinic")
points(1:n_clinics, clinic_means, pch = 18, col = "firebrick", cex = 1.6)
abline(h = grand_mean, lty = 2, lwd = 2)

round(grand_mean, 2)
#> [1] 10.02
round(clinic_means[c(2, 4)], 2)
#>     2     4 
#>  8.18 15.13 
```

Each grey dot is one of the three hundred patients. Each red diamond is one clinic's own mean, and the dashed line is the grand mean across the whole trial, 10.02. Clinic 2's ten patients average a drop of just 8.18, while clinic 4's average 15.13, even though every patient in the trial came from the same overall population.

So there are two kinds of scatter sitting in that one picture: how far a patient sits from their own clinic's mean, and how far a clinic's mean sits from the grand mean. This lesson turns both of those into one ratio, and then into a very practical answer to how many patients a clustered study like this one is really worth.

=== step === concept
## The within-clinic variance: how much patients differ inside one clinic

Write \(y_{ij}\) for patient \(i\)'s measurement in clinic \(j\), and \(\bar y_j\) for clinic \(j\)'s own mean. The within-clinic variance pools every patient's squared deviation from their own clinic's mean, across all thirty clinics, then divides by the degrees of freedom left over once each clinic has used up one of its ten patients to estimate its own mean.

\[ s^2_{\text{within}} = \frac{\sum_{j=1}^{k}\sum_{i=1}^{m} (y_{ij} - \bar y_j)^2}{N - k} \]

With \(k = 30\) clinics and \(N = 300\) patients, that denominator is 270. Compute it directly, then check it against R's own ANOVA table for the same model.

```r
# Pool each clinic's own squared deviations from its own mean into one within-clinic variance
deviations <- clin$y - clinic_means[clin$clinic]
within_ss <- sum(deviations^2)
within_df <- nrow(clin) - n_clinics
within_var <- within_ss / within_df
round(within_var, 2)
#> [1] 31.83

summary(aov(y ~ clinic, data = clin))
#>              Df Sum Sq Mean Sq F value   Pr(>F)    
#> clinic       29   4702  162.15   5.095 1.27e-13 ***
#> Residuals   270   8593   31.83                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

31.83 is exactly the Residuals row's Mean Sq in `aov()`'s own table. That is not a coincidence: `aov()` computes the within-clinic variance the same way you just did by hand, pooling every patient's deviation from their own clinic's mean. This is the noise that exists between patients even inside the very same clinic.

=== step === concept
## The between-clinic variance: how much the clinics differ from each other

The `aov()` table also has a clinic row, with a mean square of its own. That number compares the thirty clinic means to the grand mean, weighted by how many patients went into each one.

\[ MS_{\text{between}} = \frac{m\sum_{j=1}^{k} (\bar y_j - \bar y)^2}{k - 1} \]

```r
# Compare the thirty clinic means to the grand mean, weighted by ten patients each
between_ss <- sum(n_patients * (clinic_means - grand_mean)^2)
between_df <- n_clinics - 1
between_ms <- between_ss / between_df
round(between_ms, 2)
#> [1] 162.15
```

162.15 matches the clinic row in the table from the step before. But this mean square is not yet the between-clinic variance you want. It still carries a share of the same within-clinic noise you just measured, scaled up by the ten patients that went into each clinic mean. Remove that recycled noise, then divide by ten patients to undo the scaling, and what is left is the genuine between-clinic variance.

\[ s^2_{\text{between}} = \frac{MS_{\text{between}} - s^2_{\text{within}}}{m} \]

```r
# Remove the within-clinic noise still inside that mean square, then divide by patients per clinic
between_var <- (between_ms - within_var) / n_patients
round(between_var, 2)
#> [1] 13.03
```

13.03 is how much the clinics genuinely differ from one another, once the noise between their own patients has been subtracted out.

=== step === concept
## The intraclass correlation: one ratio, two interpretations

Two variances now sit on screen: 31.83 for how much patients differ inside a clinic, and 13.03 for how much clinics differ from each other. The intraclass correlation is the share of the total that the between-clinic piece accounts for.

\[ \text{ICC} = \frac{s^2_{\text{between}}}{s^2_{\text{between}} + s^2_{\text{within}}} \]

```r
# Form the intraclass correlation: between-clinic variance over total variance
icc <- between_var / (between_var + within_var)
round(icc, 2)
#> [1] 0.29
```

0.29 carries two interpretations at once, and both are exactly true under this model. First, it is the correlation between two patients drawn from the same clinic: knowing one patient's result tells you something real about the other, because they share a clinic effect. Second, it is the share of the total variance in blood pressure drop that clinic membership alone explains, 29%, with the remaining 71% coming down to patient-to-patient differences within a clinic.

=== step === widget
## How much should a clinic trust its own mean?

The ICC's second interpretation, the share of variance a clinic explains, has a direct consequence for how much you should trust any one clinic's own raw mean against the grand mean. A clinic with very few patients gives a noisy estimate of its own true average, so that raw mean should be pulled some way back toward the grand mean. A clinic with many patients already gives a trustworthy estimate on its own, so it should barely move. The widget below swaps in its own eight clinics, with between 2 and 40 patients each, to show that pull directly in place of our thirty.

::widget shrinkage-pool {}

At the default halfway setting, the widget shows clinic E, with just two patients, pulled 12.8 points toward the grand mean, while clinic D, with forty patients, barely moves, pulled by only 0.2. Drag the dial toward no pooling and every clinic is trusted on its own, so the smallest, noisiest clinics swing wildly on almost no evidence. Drag it toward complete pooling and every clinic collapses onto one shared number, throwing away real differences between them.

A clinic whose apparent difference reflects a genuinely high ICC keeps more of its own mean; one whose difference is mostly noise gets pooled harder toward the grand mean. That pull, automatic and proportional to how much evidence each clinic carries, is exactly what a random-effects model does for you.

=== step === quiz
## Quick check: which ratio is the ICC

A different clustered study, with six patients per clinic this time, reports a between-clinic mean square of 90 and a within-clinic mean square of 18. Which of these is the intraclass correlation?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 18 divided by 90, the within mean square over the between mean square: 0.2. ::no
- The between-clinic variance over the total variance: (90 minus 18) over 6 gives a between-clinic variance of 12, and 12 over (12 plus 18) gives 0.4. ::ok Right. The between-clinic variance comes first, (90 minus 18) divided by 6, which is 12. Then the ICC is that 12 over 12 plus the within-clinic variance of 18, which is 0.4.
- The pooling weight you dragged on the shrinkage dial in the last step. ::no Not quite. The ICC is always the between-clinic variance over the total variance, between plus within, computed from the data's own mean squares. It is never a mean square divided directly by another mean square, and it is not the pooling weight from the shrinkage widget, which is a different, user-set number that does not come from any data.

=== step === concept
## From the ICC to an effective sample size

The ICC has a direct consequence for how much information a clustered study actually carries. For \(m\) patients per clinic, the design effect says how many times larger the true uncertainty is than a regression would report if it treated every row as independent.

\[ \text{design effect} = 1 + (m-1)\,\text{ICC}, \qquad n_{\text{eff}} = \frac{N}{\text{design effect}} \]

```r
# Turn the ICC into a design effect, then into an effective sample size
design_effect <- 1 + (n_patients - 1) * icc
n_total <- n_clinics * n_patients
n_eff <- n_total / design_effect
round(design_effect, 2)
#> [1] 3.61
round(n_eff, 2)
#> [1] 82.99
```

With ten patients per clinic and an ICC of 0.29, the design effect is 3.61. Divide the trial's three hundred patient rows by that number and you get an effective sample size of about 83. The three hundred rows you collected carry the statistical weight of roughly 83 genuinely independent patients, not three hundred, because patients who share a clinic are telling you some of the same thing.

=== step === widget
## Effective sample size falls as the intraclass correlation rises

The same thirty clinics of ten patients can be turned into a live dial. This version adds its own hypothetical treatment, splitting the clinics into two colors so it can also compare four different standard errors for that treatment effect. The number worth watching here is simpler: the design effect and the effective sample size it reports for whatever intraclass correlation the dial is set to.

::widget cluster-icc-sim {"k":30,"m":10,"tau":4,"iccMax":0.6,"levels":13,"start":6,"sims":3000,"seed":11}

It opens near an intraclass correlation of 0.3, close to the 0.29 you computed by hand, where it reports a design effect of about 3.7 and an effective sample size of about 81, in the same neighborhood as your hand-built numbers. Drag the dial up toward 0.6 and the effective sample size falls well below that, because more clustering means more of each new patient's information is a repeat of their clinic's. Drag it back down toward zero and the effective sample size climbs back up toward the full 300, because with no clustering left, every patient really is independent again.

=== step === concept
## Why ten more patients per clinic barely helps

Hold the clinic count and the ICC fixed at 30 and 0.29, and sweep the number of patients per clinic upward instead.

```r
# Sweep patients per clinic upward, holding clinic count and ICC fixed
patients_per_clinic <- c(10, 20, 50, 100)
effective_n <- n_clinics * patients_per_clinic / (1 + (patients_per_clinic - 1) * icc)
data.frame(patients_per_clinic, effective_n = round(effective_n, 1))
#>   patients_per_clinic effective_n
#> 1                  10        83.0
#> 2                  20        92.0
#> 3                  50        98.5
#> 4                 100       100.8

round(n_clinics / icc, 1)
#> [1] 103.3
```

Going from 10 to 20 patients per clinic lifts the effective sample size from 83 to 92. Going all the way to 100 patients per clinic only lifts it to 100.8, and no matter how many patients you add to these same thirty clinics, it never climbs past about 103, the clinic count divided by the ICC. Each extra patient added to a clinic you already have repeats information that clinic already gave you. A patient in a brand new clinic does not, which is why adding clinics, not patients per clinic, is what actually buys more information in a clustered study.

Confirm the two hand-built variances one more time, this time from a proper mixed model rather than from sums of squares.

```r
# Confirm the hand-built variances against lme4's own estimates
library(lme4)
fit <- lmer(y ~ 1 + (1 | clinic), data = clin)
VarCorr(fit)
#>  Groups   Name        Std.Dev.
#>  clinic   (Intercept) 3.6101  
#>  Residual             5.6415  
```

Square those two standard deviations and you get 13.03 and 31.83, the exact same between-clinic and within-clinic variances you built by hand earlier in this lesson. `lmer()` is doing the same decomposition, just estimating it all in one call instead of two separate sums of squares.

=== step === quiz
## Quick check: what an ICC number is actually telling you

A different clustered study reports an intraclass correlation of 0.45. Which statement reads that number correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- 45% of the total variance sits between groups, and two observations from the same group correlate at exactly 0.45. ::ok Right. An ICC of 0.45 carries two interpretations at once: 45% of the total variance in the outcome sits between groups rather than within them, and any two observations drawn from the same group correlate at exactly 0.45.
- The correlation between the two treatment arms shown in the widget a moment ago. ::no
- 45% of the observations belong to the same group. ::no Not quite. The ICC is not the correlation between two arms of a treatment comparison, that is a different number the simulator widget showed for its own treatment effect, and it is not a count of how many observations share a group. It is a variance ratio: the share of total variance that sits between groups, and equally the correlation between two observations drawn from the same group.

=== step === tryit
## Your turn: find the effective sample size for a new clinic design

A dental practice group runs the same kind of study: twenty clinics, eight patients in each. Its ANOVA reports a between-clinic mean square of 54 and a within-clinic mean square of 12.

```r
# Dental-clinic study: 20 clinics, 8 patients each, mean squares already computed
k <- 20
m <- 8
n <- k * m
ms_between <- 54
ms_within <- 12
between_var2 <- (ms_between - ms_within) / m
round(between_var2, 2)
#> [1] 5.25
```

Build the ICC the same way you did earlier in this lesson, then the effective sample size the same way you did a few steps after that. Name them `icc2` and `n_eff2`, so they stay separate from the clinic trial's own `icc` and `n_eff`.

```r
# Compute icc2 as between_var2 over (between_var2 plus ms_within)
# Then compute n_eff2 as n over (1 plus (m minus 1) times icc2)
# Two lines. Press Check when you have them.
```
::check {"regex": "icc2\\s*<-\\s*between_var2\\s*/\\s*[(]\\s*between_var2\\s*\\+\\s*ms_within\\s*[)][\\s\\S]*n_eff2\\s*<-\\s*n\\s*/\\s*[(]\\s*1\\s*\\+\\s*[(]\\s*m\\s*-\\s*1\\s*[)]\\s*\\*\\s*icc2\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. The ICC comes out at 0.30, and the effective sample size at 51.11: these 160 dental patients carry about as much information as 51 independent ones, the same squeeze you saw in the clinic trial, just on a smaller design.", "no": "Build icc2 the same way as four steps back: between_var2 over (between_var2 plus ms_within). Then build n_eff2 the same way as two steps after that: n over (1 plus (m minus 1) times icc2)."}
::solution
```r
# ICC and effective sample size for the dental-clinic design
icc2 <- between_var2 / (between_var2 + ms_within)
icc2
#> [1] 0.3043478
n_eff2 <- n / (1 + (m - 1) * icc2)
n_eff2
#> [1] 51.11111
```

0.30 and 51.11. A design effect driven mostly by patients per clinic rather than clinic count, the same relationship you swept by hand a moment ago, squeezes these 160 patients down to the information of about 51 independent ones.

=== step === complete
## References

Thirty clinics gave you two variances: 31.83 for how much patients differ inside a clinic, and 13.03 for how much clinics differ from each other. Their ratio, 0.29, is the intraclass correlation, the correlation between two patients who share a clinic, and equally the 29% of the total variance in blood pressure drop that clinic membership alone explains.

That single number turned three hundred patient rows into an effective sample size of about 83 independent ones. Sweeping patients per clinic higher without adding more clinics only lifts that number as far as about 103, because every extra patient in a clinic you already have repeats information that clinic already gave you, while a new clinic does not.

The next part of this course asks what happens when two different methods, fit to the same clustered data, answer two different questions about the treatment effect itself.

- Searle, S.R., Casella, G. and McCulloch, C.E. (1992). *Variance Components*. Wiley. The standard reference for variance components and how mean squares convert into them.
- [Intraclass correlations: uses in assessing rater reliability](https://doi.org/10.1037/0033-2909.86.2.420) - Shrout, P.E. and Fleiss, J.L. (1979), Psychological Bulletin, 86(2), 420-428. The paper that gave the intraclass correlation its two standard interpretations.
- [Multilevel Analysis: An Introduction to Basic and Advanced Multilevel Modeling](https://collegepublishing.sagepub.com/products/234191) - Snijders, T. and Bosker, R. (2012), 2nd edition, Sage. A wider treatment of the variance components this lesson builds by hand.
- Donner, A. and Klar, N. (2000). *Design and Analysis of Cluster Randomization Trials in Health Research*. Arnold. The reference text on the design effect and effective sample size used in this lesson.
- [Fitting Linear Mixed-Effects Models Using lme4](https://doi.org/10.18637/jss.v067.i01) - Bates, D., Machler, M., Bolker, B. and Walker, S. (2015), Journal of Statistical Software, 67(1). The paper behind the lmer() function used to confirm the hand-built variances.
