---
title: "Mixed Effects and Longitudinal Models Lesson 2: Random intercepts and random slopes"
catalog_blurb: "Why letting dose effects vary by clinic gives a more honest confidence interval."
description: "Write a random-intercept model, add a random slope, fit both with lmer(), and see why ignoring slope variation makes a drug's effect look falsely certain."
keywords: "random intercept, random slope, mixed model, lmer, lme4, variance components, partial pooling, confidence interval, multilevel model, R"
post_type: "LESSON"
curriculum_id: "4.90.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-mixed"
course_title: "Mixed Effects and Longitudinal Models"
course_lesson: "2"
course_total: "7"
course_landing: "Mixed-Effects-and-Longitudinal-Models-Course.html"
course_next: ""
course_prev: "Why-Grouped-Data-Breaks-Ordinary-Regression"
---

=== step === cover
## Random intercepts and random slopes

Today let's understand how a mixed model lets every group in your data keep its own starting point, and sometimes its own rate of change too.

Picture a trial of a new pain-relief drug, run across thirty clinics. Each clinic enrolls ten patients, so the trial has three hundred patients in total. Every patient gets the same drug, at a dose somewhere between 0 and 10 milligrams, and a week later a relief score is recorded on a 0 to 100 scale, where 100 means complete relief.

Simulate that trial in R, so every number in this lesson is real.

```r
# Simulate 30 clinics of 10 patients, dosed 0-10 mg, relief on a 0-100 scale
library(ggplot2)
set.seed(2)
n_clinics <- 30
n_per_clinic <- 10
clinic <- factor(rep(1:n_clinics, each = n_per_clinic))
dose <- runif(n_clinics * n_per_clinic, 0, 10)
u0 <- rnorm(n_clinics, mean = 0, sd = 4)
u1 <- rnorm(n_clinics, mean = 0, sd = 1.2)
relief <- 50 + u0[clinic] + (2 + u1[clinic]) * dose +
  rnorm(n_clinics * n_per_clinic, mean = 0, sd = 5)
trial <- data.frame(clinic = clinic, dose = round(dose, 1), relief = round(relief, 1))
head(trial, 6)
#>   clinic dose relief
#> 1      1  1.8   60.4
#> 2      1  7.0   56.6
#> 3      1  5.7   67.3
#> 4      1  1.7   48.0
#> 5      1  9.4   61.8
#> 6      1  9.4   63.4
```

`trial` has one row per patient: which clinic they belong to, the dose they got, and the relief score they reported. There are 300 rows in total, 10 for each of the 30 clinics.

Here is a first, plain look: every patient's relief against their dose, with no clinic information at all.

::widget chart-plotter {"data":[{"x":1.8,"y":60.4},{"x":7,"y":56.6},{"x":5.7,"y":67.3},{"x":1.7,"y":48},{"x":9.4,"y":61.8},{"x":9.4,"y":63.4},{"x":1.3,"y":61},{"x":8.3,"y":53.6},{"x":4.7,"y":51.8},{"x":5.5,"y":66.5},{"x":5.5,"y":54},{"x":2.4,"y":54.1},{"x":7.6,"y":49.1},{"x":1.8,"y":59.8},{"x":4.1,"y":51.6},{"x":8.5,"y":55.8},{"x":9.8,"y":53.6},{"x":2.3,"y":54.9},{"x":4.4,"y":49.6},{"x":0.7,"y":61},{"x":6.6,"y":77.1},{"x":3.9,"y":52.7},{"x":8.4,"y":70.5},{"x":1.5,"y":56.5},{"x":3.5,"y":52.9},{"x":4.9,"y":59.7},{"x":1.5,"y":53.7},{"x":3.6,"y":64.1},{"x":9.6,"y":77.2},{"x":1.3,"y":53.2},{"x":0.1,"y":46.3},{"x":1.6,"y":62.1},{"x":8.1,"y":57.7},{"x":8.7,"y":55},{"x":5.1,"y":53.8},{"x":6.3,"y":47.8},{"x":8.4,"y":52.6},{"x":2.8,"y":49.9},{"x":6.7,"y":48.5},{"x":1.5,"y":45.3},{"x":9.8,"y":83.7},{"x":3,"y":61},{"x":1.2,"y":57.3},{"x":1.6,"y":57.8},{"x":9.4,"y":84.4},{"x":7.9,"y":78.6},{"x":9.7,"y":79.4},{"x":3.5,"y":62.9},{"x":5,"y":73.3},{"x":8.1,"y":75.8},{"x":0.1,"y":51.6},{"x":0.1,"y":44.6},{"x":6.8,"y":66.3},{"x":9.3,"y":66.8},{"x":2.8,"y":50.8},{"x":8.1,"y":65.3},{"x":7.9,"y":81.1},{"x":9.9,"y":80.7},{"x":6.1,"y":68.2},{"x":7.1,"y":68.7},{"x":7.7,"y":55.1},{"x":8.9,"y":70.8},{"x":6.3,"y":65.8},{"x":2.6,"y":52.2},{"x":8.6,"y":71.8},{"x":4.4,"y":70},{"x":3.9,"y":60.8},{"x":4.6,"y":67.6},{"x":2.2,"y":55.5},{"x":0.7,"y":54.7},{"x":2.8,"y":69.3},{"x":3.1,"y":63.2},{"x":0.4,"y":59.4},{"x":1.8,"y":53.6},{"x":1.8,"y":63.4},{"x":7.6,"y":80},{"x":2.9,"y":65.3},{"x":8.7,"y":74.6},{"x":4,"y":68.9},{"x":5.7,"y":66.4},{"x":3.5,"y":49.7},{"x":6.7,"y":62.2},{"x":0.3,"y":51.8},{"x":4,"y":54.8},{"x":2,"y":60.9},{"x":8.6,"y":59.7},{"x":9.7,"y":65},{"x":3.2,"y":44.5},{"x":7.3,"y":53.1},{"x":3.4,"y":51.8},{"x":9.8,"y":76.5},{"x":4,"y":61.4},{"x":3.8,"y":67},{"x":5.6,"y":57.8},{"x":4.6,"y":68.4},{"x":2,"y":61.7},{"x":4.3,"y":64.8},{"x":0.9,"y":59.7},{"x":1.2,"y":61.9},{"x":4.4,"y":60.7},{"x":2,"y":55.1},{"x":4.3,"y":51.3},{"x":9.8,"y":53.7},{"x":8.3,"y":45.6},{"x":2.9,"y":50.1},{"x":6,"y":56.8},{"x":9,"y":61.9},{"x":4.5,"y":54.3},{"x":1.5,"y":52.7},{"x":1.3,"y":51.2},{"x":0.2,"y":45.4},{"x":7.4,"y":66.9},{"x":3.7,"y":59.2},{"x":5.7,"y":60.2},{"x":8.3,"y":64.7},{"x":8.1,"y":65.6},{"x":8.7,"y":68.9},{"x":1.1,"y":59.1},{"x":9.5,"y":73.1},{"x":5.7,"y":56.7},{"x":0.4,"y":53.8},{"x":2.5,"y":49.4},{"x":9.8,"y":51.7},{"x":8.9,"y":56},{"x":2.4,"y":55},{"x":7.6,"y":50.3},{"x":5.6,"y":54.9},{"x":3.1,"y":50},{"x":6.9,"y":59.1},{"x":3.4,"y":52.5},{"x":2.1,"y":55.8},{"x":9.2,"y":68.8},{"x":0.2,"y":45.4},{"x":9.6,"y":68.8},{"x":3.2,"y":60.3},{"x":6.7,"y":61.4},{"x":5.3,"y":58.8},{"x":8.2,"y":70.1},{"x":1.9,"y":58.7},{"x":4,"y":60.1},{"x":1.8,"y":57.9},{"x":2.9,"y":57.5},{"x":6.3,"y":63.7},{"x":3,"y":62.4},{"x":4.4,"y":71.1},{"x":7.3,"y":75.9},{"x":6.7,"y":62.1},{"x":3.1,"y":59.2},{"x":4.8,"y":64.2},{"x":2.9,"y":55},{"x":1.8,"y":59.4},{"x":3.6,"y":63.8},{"x":9,"y":70.3},{"x":3.9,"y":55.2},{"x":7.8,"y":59.2},{"x":2.8,"y":48.8},{"x":8.5,"y":68.4},{"x":1.7,"y":57.2},{"x":0.8,"y":47.1},{"x":2.9,"y":55},{"x":8.4,"y":69.8},{"x":9.5,"y":83.6},{"x":0.4,"y":55},{"x":7.6,"y":75.6},{"x":3,"y":62.5},{"x":6.5,"y":64.6},{"x":0.8,"y":58.3},{"x":9.8,"y":85.3},{"x":0.1,"y":59.3},{"x":5.4,"y":70},{"x":9.7,"y":49.6},{"x":1,"y":39},{"x":2.6,"y":45},{"x":9,"y":47.5},{"x":3.9,"y":52.3},{"x":7.9,"y":42.1},{"x":3.5,"y":45.5},{"x":1.4,"y":42.9},{"x":6.5,"y":55.5},{"x":5.4,"y":51.5},{"x":9.5,"y":55.1},{"x":5.7,"y":57.3},{"x":9.5,"y":60.3},{"x":7.8,"y":57},{"x":1.2,"y":45.6},{"x":8.4,"y":54.9},{"x":0.9,"y":41},{"x":7.5,"y":58},{"x":0.7,"y":46.8},{"x":0.8,"y":50.4},{"x":1.1,"y":54.1},{"x":4.1,"y":44.8},{"x":9.7,"y":59.7},{"x":1.6,"y":51.6},{"x":5,"y":63.8},{"x":2,"y":55},{"x":2,"y":52.7},{"x":1.8,"y":43.7},{"x":2.7,"y":62.7},{"x":1.3,"y":55.4},{"x":8.6,"y":74.9},{"x":6.5,"y":64},{"x":6,"y":69.6},{"x":9.7,"y":71.1},{"x":3.8,"y":62.6},{"x":8.2,"y":67.1},{"x":2.3,"y":65.2},{"x":2.1,"y":54.2},{"x":1.9,"y":66.8},{"x":2.4,"y":61.5},{"x":9.8,"y":64.7},{"x":5.2,"y":51.2},{"x":8.3,"y":66.8},{"x":6.7,"y":62.2},{"x":9.8,"y":67.4},{"x":0.6,"y":58.3},{"x":3.4,"y":58.6},{"x":0.1,"y":57.4},{"x":3.6,"y":50.3},{"x":2.1,"y":56.7},{"x":1.5,"y":52.6},{"x":9.4,"y":99.5},{"x":4,"y":66.9},{"x":4.9,"y":83.3},{"x":6.8,"y":87.5},{"x":8.5,"y":96.3},{"x":9.1,"y":97.7},{"x":4.8,"y":77.2},{"x":7.1,"y":89},{"x":8.3,"y":93.1},{"x":6.8,"y":56.1},{"x":3.4,"y":57.6},{"x":8.9,"y":63.6},{"x":5.3,"y":64.7},{"x":8.7,"y":72.3},{"x":2.6,"y":56.5},{"x":5.4,"y":60},{"x":2.2,"y":61.5},{"x":2.2,"y":46.1},{"x":4.7,"y":64.6},{"x":8.9,"y":50.8},{"x":3,"y":49},{"x":5.6,"y":49.8},{"x":7.6,"y":47.8},{"x":9.6,"y":62.3},{"x":9.5,"y":53.1},{"x":3.3,"y":46.7},{"x":5.2,"y":61.1},{"x":1.5,"y":51},{"x":3.6,"y":50.4},{"x":7,"y":64.5},{"x":0.8,"y":49.9},{"x":2.5,"y":52.3},{"x":0.5,"y":45.3},{"x":7.4,"y":70.3},{"x":0.1,"y":50.2},{"x":0.4,"y":50.7},{"x":2.8,"y":54},{"x":0.4,"y":54.9},{"x":6.3,"y":56.2},{"x":7.5,"y":70.7},{"x":0.5,"y":57.1},{"x":6.3,"y":65.3},{"x":3.6,"y":49},{"x":8.1,"y":65.3},{"x":6.7,"y":57.4},{"x":0.2,"y":47.5},{"x":6.9,"y":58.7},{"x":8.9,"y":53.3},{"x":5.4,"y":56.3},{"x":8.9,"y":54.9},{"x":9.1,"y":61.4},{"x":8.5,"y":55.2},{"x":2.9,"y":50.5},{"x":7.8,"y":66.6},{"x":4.9,"y":48},{"x":9.8,"y":53.5},{"x":2.4,"y":50.4},{"x":0.7,"y":42.7},{"x":2.3,"y":45.2},{"x":2.8,"y":65.2},{"x":9.7,"y":80.5},{"x":6.6,"y":77.7},{"x":6.7,"y":66.1},{"x":2.1,"y":61},{"x":9.9,"y":80.1},{"x":5.3,"y":61.5},{"x":5.7,"y":64.2},{"x":7.7,"y":73.3},{"x":3.6,"y":63.7},{"x":2.6,"y":47},{"x":3.2,"y":53.8},{"x":7.4,"y":56.9},{"x":5,"y":52},{"x":7.1,"y":60.7},{"x":4.1,"y":59.2},{"x":2.1,"y":44.4},{"x":0.8,"y":51.4},{"x":1.6,"y":41.4},{"x":5,"y":62.3}],"geoms":["point"],"x":"dose","y":"relief"}

Relief clearly rises with dose. But is that the whole story? Not quite. Color each point by clinic instead, and a different picture emerges.

Now plot every patient, coloring each one by clinic. With thirty colors a legend would be unreadable, so leave it off and just look at the shape of the cloud.

```r
# Plot all 300 patients' relief against dose, colored faintly by clinic
ggplot(trial, aes(x = dose, y = relief, color = clinic)) +
  geom_point(alpha = 0.6, size = 1.8) +
  guides(color = "none") +
  labs(x = "dose (mg)", y = "relief score")
```

Now the cloud has structure. Look closely and two things stand out. Some colors sit noticeably higher or lower than others even at the same dose, so clinics seem to differ in where they start. And some colors seem to climb faster across the dose range than others, so clinics might differ in how much a milligram actually buys.

Those are the two questions this lesson answers: do clinics genuinely differ in their average relief, and does a milligram of the drug buy the same relief in every clinic?

=== step === concept
## Why one pooled line fails every clinic

The simplest thing to do with this data is to ignore which clinic each patient came from, and fit one regression line across all 300 of them.

```r
# Fit one pooled regression line across all 300 patients, ignoring clinic
fit_pooled <- lm(relief ~ dose, data = trial)
summary(fit_pooled)
#>
#> Call:
#> lm(formula = relief ~ dose, data = trial)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -22.947  -6.071  -0.060   5.745  31.789
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  51.0143     0.9923   51.41   <2e-16 ***
#> dose          1.7763     0.1714   10.36   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 8.921 on 298 degrees of freedom
#> Multiple R-squared:  0.2648,	Adjusted R-squared:  0.2624
#> F-statistic: 107.3 on 1 and 298 DF,  p-value: < 2.2e-16
```

This one line says every patient starts at about 51.0 points and gains about 1.78 points per milligram, no matter which clinic they are in. But the R-squared is only 0.2648, meaning dose alone, fit this way, explains barely a quarter of the spread in relief scores. The rest is sitting somewhere else, unaccounted for.

Draw that same line over the by-clinic scatter from the cover, and you can see exactly where it goes wrong.

```r
# Draw the pooled regression line over the by-clinic scatter
ggplot(trial, aes(x = dose, y = relief)) +
  geom_point(aes(color = clinic), alpha = 0.6, size = 1.8) +
  guides(color = "none") +
  geom_abline(intercept = coef(fit_pooled)[1], slope = coef(fit_pooled)[2], linewidth = 1) +
  labs(x = "dose (mg)", y = "relief score")
```

One straight line cannot sit close to a clinic that starts high and close to a clinic that starts low at the same time. It cannot be flat for a clinic whose relief barely moves with dose and steep for a clinic whose relief climbs fast, either. The pooled line is a compromise that fits no single clinic particularly well, because clinic identity was never part of what it was fit on.

What you actually want is a model that gives every clinic its own intercept, and lets that intercept be estimated rather than guessed. That is what a random intercept is.

=== step === concept
## Writing the random-intercept model before it's fitted

Before fitting anything, write down exactly what a random-intercept model claims. For patient \(i\) in clinic \(j\):

$$\text{relief}_{ij} = (\gamma_0 + u_{0j}) + e_{ij}$$

Each piece has a specific job.

- \(\gamma_0\) is the fixed grand intercept: the average relief, across all clinics, when dose is zero. In this trial it is 50. It is "fixed" because it is one single number shared by every clinic.
- \(u_{0j}\) is clinic \(j\)'s own deviation from that 50. It is not one fixed number. It is drawn from a normal distribution centered at 0, with a variance the model has to estimate, written \(\tau_0^2\). Here that variance is 16, so its standard deviation is 4. A clinic's \(u_{0j}\) is random precisely because it comes from that shared distribution, rather than being fit clinic by clinic as a separate term.
- \(e_{ij}\) is patient \(i\)'s own leftover deviation from their clinic's line, the ordinary noise a regression always has. Its variance, \(\sigma^2\), is 25 here, so its standard deviation is 5.

To see how the three pieces combine, picture two clinics before any fitting happens. Suppose one clinic's deviation turns out to be \(u_{0j} = +6\): its patients sit, on average, 6 points above the grand intercept, so its expected relief at dose zero is \(50 + 6 = 56\). Suppose a second clinic's deviation turns out to be \(u_{0j} = -8\): its baseline sits at \(50 - 8 = 42\). Add each patient's own noise \(e_{ij}\) on top of their clinic's baseline, and you get that one patient's actual relief score.

Notice that the pooled regression's intercept from the last step, 51.0, already landed close to this 50. That is not a coincidence. At dose zero, the only thing separating clinics is this intercept term, before dose gets a chance to pull scores apart.

What is still missing is a way to estimate \(\tau_0^2\) and \(\sigma^2\) from the data, rather than just asserting them, since in real life you would never know them in advance. That is the job of `lmer()`.

=== step === widget
## Partial pooling shrinks noisy clinic means

Before fitting the full 30-clinic model, it helps to see the mechanic lmer() uses up close, on a simpler set of clinics.

The widget below uses a separate, smaller set of eight clinics, not the 300 patients above, just to make the pooling effect easy to see. All eight share the same grand mean of 50, but they differ wildly in how many patients back up their own average.

::widget shrinkage-pool {}

At "no pooling", every clinic's own raw average is trusted completely, however few patients it has. Slide toward "complete pooling" and watch clinic E, with only 2 patients, get pulled hard toward 50, while clinic D, with 40 patients, barely moves at all. A raw average from 2 patients is almost pure noise, so the model leans on the grand mean instead. A raw average from 40 patients is already fairly reliable, so the model mostly leaves it alone.

This is exactly the behavior that estimating \(u_{0j}\) from a normal distribution buys you, instead of fitting a separate, unconstrained intercept for every clinic. A clinic with little data borrows strength from the rest of the trial. A clinic with plenty of data is trusted on its own. That borrowing is called partial pooling, and it is the main reason a random-intercept model behaves better than treating clinic as an ordinary fixed factor.

=== step === concept
## Fitting the random-intercept model with lmer()

Fit exactly the model from two steps back on the real 300-row trial, using `lmer()` from the lme4 package.

```r
# Fit the random-intercept model: one overall intercept, one deviation per clinic
library(lme4)
fit_int <- lmer(relief ~ 1 + (1 | clinic), data = trial)
summary(fit_int)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: relief ~ 1 + (1 | clinic)
#>    Data: trial
#>
#> REML criterion at convergence: 2133.5
#>
#> Scaled residuals:
#>     Min      1Q  Median      3Q     Max
#> -3.8504 -0.6100 -0.0729  0.6331  2.3382
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev.
#>  clinic   (Intercept) 51.75    7.193
#>  Residual             57.71    7.597
#> Number of obs: 300, groups:  clinic, 30
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)   59.802      1.385   43.19
```

The formula `relief ~ 1 + (1 | clinic)` reads as "an overall intercept, plus one random intercept per clinic". REML, short for restricted maximum likelihood, is simply the estimation method lmer() uses by default to get unbiased variance estimates; you never have to compute it by hand. Skip the "Scaled residuals" block too, it is a quick diagnostic on the leftover noise and not something this lesson needs.

The two tables that matter are "Random effects" and "Fixed effects". The Fixed effects table gives \(\gamma_0\): 59.80. The Random effects table gives the clinic-to-clinic variance, \(\tau_0^2\): 51.75, and the residual variance, \(\sigma^2\): 57.71.

Compare those to the true values from the last two steps, 50, 16 and 25, and all three look too large. The reason is that this model has not been told about dose at all. Every patient here was dosed somewhere between 0 and 10 milligrams, and dose genuinely adds relief, about 2 points per milligram. A model with no dose term has nowhere to put that effect except into the intercept and the two variances.

A clinic that happened to enroll more high-dose patients looks, to this model, like a clinic with a higher baseline, which inflates \(\tau_0^2\). Patient-to-patient differences in dose, within a clinic, look like unexplained noise to this same model, which inflates \(\sigma^2\).

So this fit is not wrong, it is just incomplete. The clinic variance of 51.75 is the same kind of number the pooling dial in the last step was shrinking against: lmer() used exactly that partial-pooling mechanic to produce every one of these 30 clinics' intercepts, it is just currently absorbing dose's effect along with real clinic differences. Once dose enters the model, watch both variances drop.

=== step === concept
## Writing the random-slope model

Dose is the missing piece. Extend the equation from before to let dose have its own fixed effect, and to let that effect vary by clinic too:

$$\text{relief}_{ij} = (\gamma_0 + u_{0j}) + (\gamma_1 + u_{1j}) \times \text{dose}_{ij} + e_{ij}$$

Everything from before, \(\gamma_0\), \(u_{0j}\) and \(e_{ij}\), means exactly what it meant two steps back. Two new pieces have been added, both attached to dose.

- \(\gamma_1\) is the fixed dose effect: the average number of relief points one extra milligram buys, shared across all clinics. Here it is 2.
- \(u_{1j}\) is clinic \(j\)'s own deviation from that 2. Like \(u_{0j}\), it is drawn from a normal distribution centered at 0, with its own variance to estimate, \(\tau_1^2\). Here that variance is 1.44, so its standard deviation is 1.2.

So a clinic no longer gets just one borrowed number, it gets two. A clinic with \(u_{1j} = +2\) would respond at \(2 + 2 = 4\) points per milligram, twice the average rate. A clinic with \(u_{1j} = -1.5\) would respond at only \(2 - 1.5 = 0.5\) points per milligram, barely moving at all.

That is the random slope: the same partial-pooling idea as the random intercept, just applied to how steeply each clinic's relief rises with dose, instead of to where it starts.

=== step === widget
## Comparing one slope to thirty

Before fitting this new model, look at whether real clinics actually disagree on slope, the way the equation just allowed for.

The widget below plots four of the trial's thirty clinics, 10 patients each. Toggle between one combined chart, colored by clinic, and `facet_wrap(~clinic)`, which gives each clinic its own small panel on the same scale.

::widget facet-grid {"data":[{"x":5.5,"y":54.0,"facet":"Clinic 2"},{"x":2.4,"y":54.1,"facet":"Clinic 2"},{"x":7.6,"y":49.1,"facet":"Clinic 2"},{"x":1.8,"y":59.8,"facet":"Clinic 2"},{"x":4.1,"y":51.6,"facet":"Clinic 2"},{"x":8.5,"y":55.8,"facet":"Clinic 2"},{"x":9.8,"y":53.6,"facet":"Clinic 2"},{"x":2.3,"y":54.9,"facet":"Clinic 2"},{"x":4.4,"y":49.6,"facet":"Clinic 2"},{"x":0.7,"y":61.0,"facet":"Clinic 2"},{"x":0.1,"y":51.6,"facet":"Clinic 6"},{"x":0.1,"y":44.6,"facet":"Clinic 6"},{"x":6.8,"y":66.3,"facet":"Clinic 6"},{"x":9.3,"y":66.8,"facet":"Clinic 6"},{"x":2.8,"y":50.8,"facet":"Clinic 6"},{"x":8.1,"y":65.3,"facet":"Clinic 6"},{"x":7.9,"y":81.1,"facet":"Clinic 6"},{"x":9.9,"y":80.7,"facet":"Clinic 6"},{"x":6.1,"y":68.2,"facet":"Clinic 6"},{"x":7.1,"y":68.7,"facet":"Clinic 6"},{"x":0.4,"y":53.8,"facet":"Clinic 13"},{"x":2.5,"y":49.4,"facet":"Clinic 13"},{"x":9.8,"y":51.7,"facet":"Clinic 13"},{"x":8.9,"y":56.0,"facet":"Clinic 13"},{"x":2.4,"y":55.0,"facet":"Clinic 13"},{"x":7.6,"y":50.3,"facet":"Clinic 13"},{"x":5.6,"y":54.9,"facet":"Clinic 13"},{"x":3.1,"y":50.0,"facet":"Clinic 13"},{"x":6.9,"y":59.1,"facet":"Clinic 13"},{"x":3.4,"y":52.5,"facet":"Clinic 13"},{"x":1.5,"y":52.6,"facet":"Clinic 23"},{"x":9.4,"y":99.5,"facet":"Clinic 23"},{"x":4.0,"y":66.9,"facet":"Clinic 23"},{"x":4.9,"y":83.3,"facet":"Clinic 23"},{"x":6.8,"y":87.5,"facet":"Clinic 23"},{"x":8.5,"y":96.3,"facet":"Clinic 23"},{"x":9.1,"y":97.7,"facet":"Clinic 23"},{"x":4.8,"y":77.2,"facet":"Clinic 23"},{"x":7.1,"y":89.0,"facet":"Clinic 23"},{"x":8.3,"y":93.1,"facet":"Clinic 23"}],"x":"dose","y":"relief","facetVar":"clinic"}

In the combined chart, the four clinics share the same x and y axes, and their low-dose points sit close together. Switch to the faceted view, four small panels on the same scale, and the disagreement in how steeply each one climbs becomes obvious.

In clinic 2, a patient dosed at 0.7 mg scores 61.0, and one dosed at 9.8 mg scores only 53.6, almost no climb at all. In clinic 23, a patient dosed at 1.5 mg scores 52.6, but one dosed at 9.4 mg scores 99.5, a steep climb across the same dose range. Clinic 13 looks as flat as clinic 2. Clinic 6 climbs almost as steeply as clinic 23.

So within the same thirty-clinic trial, a milligram buys almost nothing in some clinics and a great deal in others. That is real disagreement about the slope, sitting in the data before any model touches it.

=== step === quiz
## Quick check: what one combined slope hides

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Clinics differ in the range of doses their patients happened to receive. ::no
- Clinics differ in how many points a milligram buys, and a single combined line can only report one shared slope for all thirty clinics. ::ok Exactly. The facets showed relief barely rising with dose in clinics 2 and 13, and climbing steeply in clinics 6 and 23. A single pooled slope can only report one average rate, which hides that real disagreement.
- Clinics differ in how many patients they enrolled. ::no
- Clinics differ in their average relief score. ::no None of these is what the facets specifically revealed. Every clinic here has exactly 10 patients and a similar dose range, so sample size and dose range are not what changed. Average relief does differ too, but that is about where a clinic starts, not about how fast it responds to dose, which is the one thing a single combined slope cannot show.

=== step === concept
## Fitting the random-slope model and reading its variance components

Fit the model from two steps back, now letting both the intercept and the dose slope vary by clinic.

```r
# Fit the random-slope model: dose as a fixed effect, plus a random intercept AND slope
fit_slope <- lmer(relief ~ dose + (1 + dose | clinic), data = trial)
summary(fit_slope)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: relief ~ dose + (1 + dose | clinic)
#>    Data: trial
#>
#> REML criterion at convergence: 1904.3
#>
#> Scaled residuals:
#>      Min       1Q   Median       3Q      Max
#> -2.51660 -0.68286  0.06342  0.64033  2.42044
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev. Corr
#>  clinic   (Intercept)  8.821   2.970
#>           dose         1.059   1.029    0.24
#>  Residual             23.576   4.855
#> Number of obs: 300, groups:  clinic, 30
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  51.2538     0.7785  65.833
#> dose          1.6966     0.2123   7.992
#>
#> Correlation of Fixed Effects:
#>      (Intr)
#> dose -0.140
```

`(1 + dose | clinic)` is lme4's way of writing "let both the intercept and the dose slope vary by clinic". Ignore the "Correlation of Fixed Effects" line at the bottom, it is about the fixed-effect estimates' own sampling correlation, a different thing from the Corr column above it, and not needed here.

Start with the Fixed effects table. The intercept is now 51.25, much closer to the true 50 than `fit_int`'s 59.80 was, because dose is finally in the model and can properly explain its own share of relief. The dose coefficient is 1.70, close to the true \(\gamma_1 = 2\): that is \(\gamma_1\), the average points gained per milligram across all clinics.

Now the Random effects table, which has grown a row. The clinic intercept variance, \(\tau_0^2\), is 8.82, in the right range of the true 16, and far below `fit_int`'s inflated 51.75, now that dose is no longer being wrongly credited to it. The new dose row is \(\tau_1^2\), the clinic-to-clinic variance in the slope: 1.06, in the right range of the true 1.44.

That row did not exist in `fit_int` at all, because that model had no dose term to let vary. It is the number behind the steep-versus-flat clinics you just saw in the facets. The residual variance, \(\sigma^2\), is 23.58, close to the true 25 and far below `fit_int`'s 57.71.

The "Corr" column next to the clinic rows, 0.24, is lme4's estimate of the correlation between a clinic's intercept deviation and its slope deviation. It came out close to zero here, which fits how the two were simulated: independently of each other.

For an outcome that is a count or a yes-or-no instead of a continuous score, this same idea, a fixed effect plus a random intercept and slope per group, is fit with the glmmTMB package instead of lme4. The model is conceptually identical, just suited to a different kind of outcome.

=== step === concept
## Why ignoring slope variation makes the dose effect look more certain than it is

The dose coefficient was close to 1.7 either way, whether or not the slope was allowed to vary by clinic. So does it matter which model you use? Fit a third model, one that keeps dose as a fixed effect but gives clinics only a random intercept, no random slope, and compare its confidence interval for dose against `fit_slope`'s.

```r
# Fit a third model: dose fixed, but only a random intercept (no random slope)
fit_fixed <- lmer(relief ~ dose + (1 | clinic), data = trial)
summary(fit_fixed)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: relief ~ dose + (1 | clinic)
#>    Data: trial
#>
#> REML criterion at convergence: 1976.7
#>
#> Scaled residuals:
#>     Min      1Q  Median      3Q     Max
#> -3.8828 -0.6218  0.0105  0.6237  2.6731
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev.
#>  clinic   (Intercept) 48.55    6.968
#>  Residual             32.48    5.699
#> Number of obs: 300, groups:  clinic, 30
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  51.5894     1.4289   36.10
#> dose          1.6600     0.1135   14.63
#>
#> Correlation of Fixed Effects:
#>      (Intr)
#> dose -0.393
```

The dose estimate, 1.66, is close to `fit_slope`'s 1.70. But look at the random effects: clinic variance is 48.55 and residual variance is 32.48, both far above `fit_slope`'s 8.82 and 23.58. With no random slope to absorb it, the real clinic-to-clinic disagreement in slope has to leak somewhere, and it leaks back into the intercept variance and the residual, echoing `fit_int`'s problem in a smaller way.

Now compare the dose coefficient's 95% confidence interval from each model. `method = "Wald"` asks for the plain estimate-plus-or-minus-1.96-standard-errors interval, the fastest of the ways `confint()` can compute this, and accurate enough here.

```r
# Compare the dose coefficient's 95% interval, with and without a random slope
round(confint(fit_fixed, parm = "dose", method = "Wald"), 2)
#>      2.5 % 97.5 %
#> dose  1.44   1.88
round(confint(fit_slope, parm = "dose", method = "Wald"), 2)
#>      2.5 % 97.5 %
#> dose  1.28   2.11
```

`fit_fixed`'s interval is 1.44 to 1.88, a width of 0.44. `fit_slope`'s interval is 1.28 to 2.11, a width of 0.83, almost double. `fit_fixed` forces every clinic to share the exact same dose slope, so it never has to account for the real disagreement you saw in the facets two steps back.

Because `fit_fixed` never lets clinics disagree on slope, it reports a false confidence, an interval too narrow because it is missing a genuine source of uncertainty: which clinic a patient happens to be in. `fit_slope`'s wider interval is the honest one, because \(\tau_1^2\) is counted as a real source of noise around the fixed dose effect, not swept away.

=== step === quiz
## Quick check: reading the two mixed models

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The clinic-to-clinic variance in the intercept, tau0-squared. ::no
- The clinic-to-clinic variance in the dose slope, tau1-squared. ::ok Right. The random-effects table in fit_fixed has only two rows, intercept and residual. It has no dose row at all, because that model never lets the slope vary by clinic. The output from fit_slope adds that row from nothing, which is the one true structural difference between the two.
- The patient-to-patient residual variance, sigma-squared. ::no
- The fixed dose coefficient, gamma1. ::no Three of these already exist in the output of both models, just with different fitted values: tau0-squared, sigma-squared and the fixed dose coefficient all appear in fit_fixed and simply change in degree once a random slope is added. The dose variance row is the one piece with nothing to compare against in fit_fixed, because that model has no random slope to estimate in the first place.

=== step === tryit
## Your turn: fit a random-slope model and read its interval

`trial` still holds all 300 patients from the cover. Write your own call to `lmer()`, fitting relief against dose, with a random intercept AND a random slope for dose, by clinic. Then print `confint()` for the dose row, using `method = "Wald"`.

```r
# trial already holds the 300 patients from this lesson.
# Fit relief ~ dose with dose as a fixed effect, plus a random
# intercept AND a random slope for dose, by clinic.
# Then print confint() for the dose row using method = "Wald".
# Two lines. Press Check when you have them.
```
::check {"regex": "lmer\\s*[(][\\s\\S]*[(]\\s*1\\s*\\+\\s*dose\\s*\\|\\s*clinic\\s*[)][\\s\\S]*confint\\s*[(]", "gate": true, "difficulty": "intermediate", "ok": "Right: 1.28 to 2.11. That is the same wide interval fit_slope gave two steps back, because this is the same honestly-specified model, just fit by you this time.", "no": "Write a lmer() call shaped like fit_slope: relief ~ dose + (1 + dose | clinic), data = trial. Then call confint() on it for the dose row with method = \"Wald\"."}
::solution
```r
# Fit the same random-slope model yourself, then read its dose interval
fit_tryit <- lmer(relief ~ dose + (1 + dose | clinic), data = trial)
round(confint(fit_tryit, parm = "dose", method = "Wald"), 2)
#>      2.5 % 97.5 %
#> dose  1.28   2.11
```

That interval is wide for a reason you can now name: it is honestly counting \(\tau_1^2\), the clinic-to-clinic disagreement in slope, as part of the uncertainty around the dose effect. The narrower interval from `fit_fixed`, 1.44 to 1.88, got that way by assuming that disagreement does not exist.

=== step === concept
## References

::prose-only a list of citations, bibliography carries no teaching objective

- [Fitting Linear Mixed-Effects Models Using lme4](https://doi.org/10.18637/jss.v067.i01). Bates, Machler, Bolker and Walker (2015), Journal of Statistical Software 67(1). The paper behind the `lme4` package used throughout this lesson.
- [Random effects structure for confirmatory hypothesis testing: Keep it maximal](https://doi.org/10.1016/j.jml.2012.11.001). Barr, Levy, Scheepers and Tily (2013), Journal of Memory and Language 68(3).
- [Data Analysis Using Regression and Multilevel/Hierarchical Models](https://doi.org/10.1017/CBO9780511790942). Gelman and Hill (2007), Cambridge University Press.

=== step === complete
## What writing the model down bought you

Clinics differ in where they start, and the model can say by how much. The true intercept variance, \(\tau_0^2\), is 16. Once dose was properly in the model, `lmer()`'s own fit landed at 8.82, in the right range, instead of the inflated 51.75 that the dose-free intercept-only model produced.

Clinics differ in how fast they respond to dose too, and that difference has a name and a number now. The true slope variance, \(\tau_1^2\), is 1.44. `lmer()`'s fit put it at 1.06, the row that simply did not exist before dose was allowed to vary by clinic.

And because the random-slope model honestly counts that disagreement, the dose effect's 95% interval widened from a range of 1.44 to 1.88 points to a range of 1.28 to 2.11 points. That is a less flattering answer than the fixed-slope model gave, but it is the true one.

The next lesson keeps the same idea, a random intercept and a random slope, but moves from thirty clinics to one person measured repeatedly over time, where each subject gets their own trajectory instead of each clinic getting its own line.
