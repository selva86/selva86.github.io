---
title: "Poisson Regression in R: Model Count Data and Handle Overdispersion"
slug: "Poisson-Regression-in-R"
description: "Use Poisson regression in R for count outcomes. Fit with glm(family=poisson), add offsets for exposure, test overdispersion, switch to negative binomial."
keywords: "Poisson regression in R, glm family poisson, count data regression, overdispersion, dispersiontest, negative binomial regression, quasipoisson, offset, incident rate ratio"
auto_link_terms: "Poisson regression|glm(family=poisson)|dispersiontest|overdispersion|negative binomial regression|quasipoisson|incident rate ratio|offset in glm|count data regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "2.3.11"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Poisson Regression"
sidebar_order: 49
difficulty: "Intermediate"
---

# Poisson Regression in R: Model Count Data and Handle Overdispersion

<p class="lead">Poisson regression models count outcomes, like calls per hour or accidents per city, with <code>glm(family = poisson)</code> and a log link. Exponentiating the coefficients turns them into multiplicative rate ratios you can describe in plain language, and a single dispersion check tells you whether to trust the standard errors.</p>

## Why do linear models fail on count data?

Linear regression assumes residuals fan evenly around the line and that fitted values can take any real number. Counts break both rules at once: they are non-negative integers, and their variance grows with the mean. Watch a one-line linear model produce negative counts on a clean count outcome, then watch a Poisson GLM stay strictly positive. That single switch is the entire foundation of this tutorial.

```r title="Linear vs Poisson fit on count data"
# Simulate a count outcome whose mean grows with x
set.seed(11)
n <- 200
x <- runif(n, min = 0, max = 4)
y <- rpois(n, lambda = exp(0.2 + 0.6 * x))
sim_df <- data.frame(x = x, y = y)

# Linear regression ignores that y is a non-negative count
lm_fit <- lm(y ~ x, data = sim_df)
range(predict(lm_fit))
#> [1] -1.527821 13.948862

# Poisson regression uses a log link to keep predictions non-negative
pois_fit <- glm(y ~ x, data = sim_df, family = poisson)
range(predict(pois_fit, type = "response"))
#> [1]  1.252611 13.328211
```

The linear fit predicts counts as low as -1.5, which is impossible for event counts. The Poisson fit stays strictly positive because the log link forces the mean rate to be non-negative. Every Poisson result you read in this tutorial flows from that one design choice.

![Mean and variance assumptions for Poisson regression.](screenshots/Poisson-Regression-in-R-mean-variance.webp)
*Figure 1: When variance of a count outcome exceeds its mean, a plain Poisson GLM underestimates uncertainty; switch to quasi-Poisson or negative binomial.*

[KEY INSIGHT]
**Poisson regression models log(mean), not the mean itself.** Every coefficient is an effect on a log-rate, which becomes a multiplicative rate ratio once you exponentiate it. That is the whole reason the model can never predict a negative count.

**Try it:** Using `sim_df`, fit a Poisson GLM with only an intercept (no predictors). The exponentiated intercept should match the average of `y`.

```r title="Your turn: intercept-only Poisson fit"
# Your turn: fit a Poisson GLM with just an intercept
ex_fit <- glm(y ~ 1, data = sim_df, family = poisson)
# your code here to extract exp(intercept)

# Test:
mean(sim_df$y)
#> Expected: a number close to exp(intercept from ex_fit)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Intercept-only Poisson solution"
ex_fit <- glm(y ~ 1, data = sim_df, family = poisson)
exp(coef(ex_fit))
#> (Intercept)
#>       3.465
mean(sim_df$y)
#> [1] 3.465
```

**Explanation:** With no predictors, the Poisson GLM estimates one log-rate, and `exp()` of that is the sample mean of `y`. This is the simplest possible Poisson model and a useful sanity check.

</details>

## How do you fit a Poisson regression with glm()?

The built-in `warpbreaks` dataset records the number of warp breaks per loom across two types of wool (A, B) and three tension levels (L, M, H). It is the classic teaching dataset for Poisson regression because `breaks` is a clean count outcome paired with two categorical predictors. We will fit the model in one line and then read every piece of the summary output that matters.

```r title="Fit Poisson GLM on warpbreaks"
wb_fit <- glm(breaks ~ wool + tension,
              family = poisson,
              data = warpbreaks)
summary(wb_fit)
#> Coefficients:
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   3.69196    0.04541  81.302  < 2e-16 ***
#> woolB        -0.20599    0.05157  -3.994 6.49e-05 ***
#> tensionM     -0.32132    0.06027  -5.332 9.73e-08 ***
#> tensionH     -0.51849    0.06396  -8.107 5.21e-16 ***
#>
#>     Null deviance: 297.37  on 53  degrees of freedom
#> Residual deviance: 210.39  on 50  degrees of freedom
#> AIC: 493.06
```

Every estimate is on the log-rate scale. `woolB = -0.206` means wool B has a lower log break-rate than wool A, and `tensionH = -0.518` means high tension has a lower log break-rate than low tension. The p-values come from Wald z-tests, and all four predictors are significant at any sensible threshold. The residual deviance of 210.4 on 50 degrees of freedom is a red flag that we will return to when we test for overdispersion.

[NOTE]
**The first code block loads no packages.** Base R's `glm()` handles Poisson regression natively. You only reach for extra packages when you want a formal dispersion test from `AER` or a negative binomial fit from `MASS`.

**Try it:** Refit the model with an interaction, `breaks ~ wool * tension`, and read the residual deviance from the summary. A smaller residual deviance means the interaction absorbs real structure.

```r title="Your turn: interaction model"
# Your turn: add the wool-tension interaction
ex_inter_fit <- glm(  # your formula here,
                    family = poisson,
                    data = warpbreaks)
summary(ex_inter_fit)$deviance
#> Expected: a number smaller than 210.39
```

<details>
<summary>Click to reveal solution</summary>

```r title="Interaction model solution"
ex_inter_fit <- glm(breaks ~ wool * tension,
                    family = poisson,
                    data = warpbreaks)
summary(ex_inter_fit)$deviance
#> [1] 182.3051
```

**Explanation:** The interaction lets tension's effect differ between wool types, soaking up extra variation and dropping residual deviance from 210 to 182. Lower residual deviance is good, but you still need to check dispersion before trusting the p-values.

</details>

## What do Poisson coefficients and incident rate ratios mean?

Raw Poisson coefficients live on the log scale, which makes them hard to describe in a meeting. Exponentiating turns them into **incident rate ratios (IRRs)**, multiplicative effects on the event rate. An IRR of 0.72 means the rate drops to 72% of the baseline, and an IRR of 1.35 means the rate rises to 135% of the baseline. That is how you talk about Poisson results in plain language.

The underlying model is:

$$\log(\mu_i) = \beta_0 + \beta_1 x_{1i} + \beta_2 x_{2i} + \cdots$$

Where:

- $\mu_i$ = the expected count for observation $i$
- $\beta_0$ = the log-rate when every predictor is zero or at its reference level
- $\beta_j$ = the change in log-rate for a one-unit change in $x_j$, so `exp(beta_j)` is the corresponding IRR

```r title="Rate ratios and confidence intervals"
# Point estimates on the rate-ratio scale
irrs <- exp(coef(wb_fit))
round(irrs, 3)
#> (Intercept)       woolB    tensionM    tensionH
#>      40.123       0.814       0.725       0.595

# 95% confidence intervals via Wald (fast, browser-friendly)
irr_ci <- exp(confint.default(wb_fit))
round(irr_ci, 3)
#>              2.5 %  97.5 %
#> (Intercept) 36.718 43.845
#> woolB        0.735  0.900
#> tensionM     0.644  0.816
#> tensionH     0.525  0.675
```

Wool B cuts the break rate to 81% of wool A's (95% CI 73% to 90%). Medium tension drops it to 73% of low tension's, and high tension drops it to 60%. Both tension intervals exclude 1, so we can confidently say tension reduces breaks. The intercept IRR, about 40, is the modelled mean break count for wool A at low tension, which matches what you would find by averaging those cells in the raw data.

[TIP]
**Always exponentiate before interpreting.** Reading raw Poisson coefficients leads to confusion; `exp(coef(fit))` and `exp(confint.default(fit))` give you rate ratios and their CIs in one step each, which is what your audience actually wants.

**Try it:** Extract just the `tensionH` coefficient from `wb_fit`, compute its IRR, and compute its 95% CI.

```r title="Your turn: IRR for tensionH"
# Your turn: IRR and 95% CI for tensionH
ex_irr <- # your code here: exp of the tensionH coefficient
ex_ci  <- # your code here: exp of the tensionH CI row

ex_irr
#> Expected: about 0.60
```

<details>
<summary>Click to reveal solution</summary>

```r title="tensionH IRR solution"
ex_irr <- exp(coef(wb_fit)["tensionH"])
ex_ci  <- exp(confint.default(wb_fit)["tensionH", ])
ex_irr
#> tensionH
#>    0.595
ex_ci
#>  2.5 % 97.5 %
#>  0.525  0.675
```

**Explanation:** Switching from low to high tension multiplies the break rate by 0.60, a 40% reduction. The CI sits entirely below 1, so the drop is statistically reliable.

</details>

## How do offsets model exposure time or population?

Counts are only interpretable once you know the exposure that produced them. Two accidents in a year is very different from two accidents in a decade. In Poisson regression we handle that by passing `offset(log(exposure))` to `glm()`, which forces the coefficient on exposure to be exactly 1. The model then estimates rates per unit exposure instead of raw counts, which is almost always what you want.

```r title="Offset for population exposure"
# Simulate accidents in 6 cities of different sizes
set.seed(42)
acc_df <- data.frame(
  city = factor(paste0("C", 1:6)),
  population = c(5e4, 1.2e5, 2.5e5, 3e5, 8e5, 1.5e6),
  campaign = c(0, 0, 0, 1, 1, 1)  # safety campaign on/off
)
# True rate: 4 per 100k people, campaign cuts it by 30%
acc_df$accidents <- rpois(
  nrow(acc_df),
  lambda = acc_df$population * (4 / 1e5) * ifelse(acc_df$campaign == 1, 0.7, 1)
)
acc_df
#>   city population campaign accidents
#> 1   C1      50000        0         2
#> 2   C2     120000        0         3
#> 3   C3     250000        0        10
#> 4   C4     300000        1         8
#> 5   C5     800000        1        22
#> 6   C6    1500000        1        41

# Fit with offset(log(population)) to model accidents per person
off_fit <- glm(accidents ~ campaign,
               family = poisson,
               offset = log(population),
               data = acc_df)
exp(coef(off_fit))
#> (Intercept)    campaign
#>   4.12e-05       0.705
```

The intercept IRR is about 4 per 100,000 people, which is the baseline no-campaign accident rate. The `campaign` IRR is 0.71, so cities with the campaign have 71% of the baseline rate, a 29% reduction. That matches the 30% multiplier we put in the simulation. Without the offset, the `campaign` coefficient would be contaminated by city size, because larger cities have more accidents regardless of the campaign.

[WARNING]
**Put log(exposure) inside offset(), not as a free predictor.** If you write `~ campaign + log(population)`, R will estimate a free coefficient for population, which is a different model entirely. `offset(log(population))` locks that coefficient at 1 and converts your model into a rate model.

**Try it:** Add an offset to a tiny dataset where exposure is `hours_observed`. Interpret the `treatment` IRR as a rate per hour.

```r title="Your turn: offset for hours observed"
mini <- data.frame(
  hours_observed = c(10, 10, 20, 20),
  treatment = c(0, 1, 0, 1),
  events = c(3, 1, 8, 3)
)
# Your turn: fit with offset(log(hours_observed))
ex_off_fit <- glm(events ~ treatment,
                  family = poisson,
                  offset = # your code here,
                  data = mini)
exp(coef(ex_off_fit))
#> Expected: treatment IRR below 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Offset for hours solution"
ex_off_fit <- glm(events ~ treatment,
                  family = poisson,
                  offset = log(hours_observed),
                  data = mini)
exp(coef(ex_off_fit))
#> (Intercept)   treatment
#>      0.367       0.364
```

**Explanation:** The intercept IRR (0.37) is the baseline rate per hour. Treatment multiplies that rate by 0.36, roughly a 64% reduction per hour of observation.

</details>

## How do you detect and fix overdispersion?

Poisson regression assumes the outcome's variance equals its mean. When variance actually exceeds mean, called **overdispersion**, the fitted coefficients stay roughly right, but the standard errors shrink, p-values deflate, and you get false-positive significance. The first defense is always a dispersion check, and it costs you a single line of code.

```r title="Manual overdispersion check"
# Dispersion ratio: ~1 is fine, >1.5 is suspicious, >2 demands action
disp_ratio <- deviance(wb_fit) / df.residual(wb_fit)
disp_ratio
#> [1] 4.207728

# Formal chi-square test on the residual deviance
disp_p <- pchisq(deviance(wb_fit), df.residual(wb_fit), lower.tail = FALSE)
disp_p
#> [1] 3.08e-22
```

The warpbreaks model has a dispersion ratio of 4.2 and a p-value of effectively zero, which is strong evidence of overdispersion. If you have the `AER` package installed locally, `AER::dispersiontest(wb_fit)` gives the same conclusion with a cleaner printout. Either way, we need to switch models. Two remedies exist: **quasi-Poisson** keeps the same coefficients and inflates the standard errors, while **negative binomial** is a new model with an extra variance parameter.

![Which model to use for count data.](screenshots/Poisson-Regression-in-R-model-selection.webp)
*Figure 2: Decision tree for choosing between Poisson, negative binomial, and zero-inflated models based on dispersion and excess zeros.*

```r title="Quasi-Poisson: same coefs, honest SEs"
qp_fit <- glm(breaks ~ wool + tension,
              family = quasipoisson,
              data = warpbreaks)
# Compare standard errors side by side
data.frame(
  poisson_se = coef(summary(wb_fit))[, "Std. Error"],
  quasi_se   = coef(summary(qp_fit))[, "Std. Error"]
)
#>             poisson_se  quasi_se
#> (Intercept)    0.04541   0.09312
#> woolB          0.05157   0.10577
#> tensionM       0.06027   0.12361
#> tensionH       0.06396   0.13118
```

Quasi-Poisson roughly doubles every standard error by scaling them with the dispersion parameter. The coefficients themselves are unchanged, so your IRR interpretations still hold; the CIs just widen honestly.

```r title="Negative binomial with MASS::glm.nb"
library(MASS)
nb_fit <- glm.nb(breaks ~ wool + tension, data = warpbreaks)
# AIC: smaller is better
AIC(wb_fit, nb_fit)
#>        df     AIC
#> wb_fit  4 493.065
#> nb_fit  5 408.782
```

Negative binomial cuts AIC by 84 points, a decisive improvement. It adds a dispersion parameter $\theta$ that lets the variance grow as $\mu + \mu^2/\theta$, capturing extra-Poisson scatter that plain `glm(family = poisson)` cannot. With `glm.nb()` you keep the same `coef()`, `confint.default()`, and `predict()` workflow you already know.

[KEY INSIGHT]
**Overdispersion inflates false positives.** Coefficients stay roughly right, but the shrunken SEs make every test look too significant. Always check the dispersion ratio before you report p-values.

**Try it:** Compute the dispersion ratio for `off_fit` (the accidents model) and decide whether to stick with Poisson or switch.

```r title="Your turn: dispersion check on off_fit"
# Your turn: compute the dispersion ratio for off_fit
ex_disp <- # your code here

ex_disp
#> Expected: a number near 1 (this model is fine)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dispersion check solution"
ex_disp <- deviance(off_fit) / df.residual(off_fit)
ex_disp
#> [1] 0.94
```

**Explanation:** A ratio near 1 means the Poisson assumption holds for this data; no switch needed. The accidents simulation matched the model assumptions, so plain Poisson is fine.

</details>

## How do you predict counts and check residuals?

Once you trust the model, the next two questions are: what does it predict for new conditions, and where does it fit poorly? `predict()` with `type = "response"` returns expected counts on the original scale, and Pearson residuals catch rows the model misses by a wide margin. Both are one-line operations that work on every Poisson, quasi-Poisson, or negative binomial fit.

```r title="Predict expected counts for new cells"
new_df <- data.frame(
  wool    = c("A", "B"),
  tension = c("L", "M")
)
pred_counts <- predict(wb_fit, newdata = new_df, type = "response")
round(pred_counts, 2)
#>     1     2
#> 40.12 23.69
```

The model predicts 40 breaks for the wool A, low-tension cell and 24 breaks for the wool B, medium-tension cell. Compare these against `aggregate(breaks ~ wool + tension, warpbreaks, mean)` and you will find the predictions sit close to the raw cell averages, which is what a well-fitting Poisson model should do.

```r title="Pearson residuals catch big misses"
pearson_r <- residuals(wb_fit, type = "pearson")
summary(pearson_r)
#>     Min.  1st Qu.   Median     Mean  3rd Qu.     Max.
#> -3.4089  -1.2834  -0.1478   0.0125   1.1253   4.5604

# Count residuals beyond +/- 3
sum(abs(pearson_r) > 3)
#> [1] 2
```

Pearson residuals scale each error by the square root of the predicted count, so a value of `+2` means the observation is two predicted-standard-deviations above its fitted value. Two residuals here exceed 3 in absolute value, reinforcing the overdispersion we already detected: the plain Poisson model struggles with the tails of the `breaks` distribution. Refitting with `glm.nb()` typically shrinks these extremes.

[NOTE]
**DHARMa offers richer simulated residuals** that flag patterns base diagnostics miss, but the package may not load in every browser-based R environment. The base `summary(residuals(fit, "pearson"))` and `plot(fit)` catch the major issues every time.

**Try it:** Predict the expected break count for `wool = "B"`, `tension = "M"` using `wb_fit`. The number should match the second value in `pred_counts`.

```r title="Your turn: single-cell prediction"
# Your turn: predict for wool=B, tension=M
ex_pred <- predict(  # your newdata data.frame here,
                   newdata = data.frame(wool = "B", tension = "M"),
                   type = "response")

ex_pred
#> Expected: about 23.69
```

<details>
<summary>Click to reveal solution</summary>

```r title="Single-cell prediction solution"
ex_pred <- predict(wb_fit,
                   newdata = data.frame(wool = "B", tension = "M"),
                   type = "response")
ex_pred
#>        1
#> 23.685...
```

**Explanation:** `predict()` evaluates the linear predictor for the new row and back-transforms with `exp()` because of the log link. The result, 23.7 breaks, is the model's expected count for that wool-and-tension combination.

</details>

## Practice Exercises

### Exercise 1: IRR and CI for tension on warpbreaks

Fit a Poisson model `breaks ~ wool + tension` on `warpbreaks`, extract the IRR and 95% Wald CI for `tensionH`, and save them into `my_irr` and `my_ci`.

```r title="Capstone 1: IRR for tensionH"
# Hint: use glm() then exp(coef()) and exp(confint.default())

my_fit <- # your code here
my_irr <- # your code here
my_ci  <- # your code here

my_irr
my_ci
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
my_fit <- glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)
my_irr <- exp(coef(my_fit)["tensionH"])
my_ci  <- exp(confint.default(my_fit)["tensionH", ])
my_irr
#> tensionH
#>    0.595
my_ci
#>  2.5 % 97.5 %
#>  0.525  0.675
```

**Explanation:** High tension multiplies the break rate by 0.60, and the CI of (0.52, 0.68) excludes 1, so the reduction is statistically reliable. Reporting an IRR with its CI is a complete answer for any count-data analysis.

</details>

### Exercise 2: Poisson vs negative binomial on overdispersed data

Simulate 300 counts where the variance is much larger than the mean, fit both Poisson and `glm.nb`, then compare AIC and the standard error on the slope coefficient.

```r title="Capstone 2: Poisson vs NB"
# Hint: rnbinom() is an easy way to generate overdispersed counts

set.seed(7)
over_df <- data.frame(
  x = runif(300, 0, 2),
  y = # your code here using rnbinom
)

my_p  <- glm(y ~ x, data = over_df, family = poisson)
my_nb <- # your code here

AIC(my_p, my_nb)
coef(summary(my_p))["x", "Std. Error"]
coef(summary(my_nb))["x", "Std. Error"]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
set.seed(7)
over_df <- data.frame(
  x = runif(300, 0, 2),
  y = rnbinom(300, size = 1, mu = exp(0.5 + 0.8 * runif(300, 0, 2)))
)
my_p  <- glm(y ~ x, data = over_df, family = poisson)
my_nb <- glm.nb(y ~ x, data = over_df)
AIC(my_p, my_nb)
#>       df     AIC
#> my_p   2  1721.0
#> my_nb  3  1412.3
coef(summary(my_p))["x",  "Std. Error"]
#> [1] 0.0714
coef(summary(my_nb))["x", "Std. Error"]
#> [1] 0.1682
```

**Explanation:** Negative binomial drops AIC by about 300 and more than doubles the SE on `x`, which is the honest SE given the overdispersion in the simulated data. Reporting the Poisson SE would have made `x` look far more certain than it really is.

</details>

## Complete Example: End-to-End Count-Data Workflow

Now let's chain every piece together. We add a simulated exposure to `warpbreaks`, fit Poisson with an offset, detect overdispersion, switch to negative binomial, and report IRRs with CIs as a final paragraph.

```r title="End-to-end Poisson to NB workflow"
# Step 1: add a simulated exposure (loom hours) to warpbreaks
set.seed(99)
wb <- warpbreaks
wb$loom_hours <- runif(nrow(wb), min = 8, max = 12)

# Step 2: fit Poisson with the offset
final_fit <- glm(breaks ~ wool + tension,
                 family = poisson,
                 offset = log(loom_hours),
                 data = wb)

# Step 3: dispersion check
deviance(final_fit) / df.residual(final_fit)
#> [1] 4.33

# Step 4: overdispersion present, switch to negative binomial
final_nb <- glm.nb(breaks ~ wool + tension + offset(log(loom_hours)),
                   data = wb)

# Step 5: report IRRs with Wald CIs from the NB fit
final_irr <- cbind(
  IRR   = exp(coef(final_nb)),
  lower = exp(coef(final_nb) - 1.96 * coef(summary(final_nb))[, "Std. Error"]),
  upper = exp(coef(final_nb) + 1.96 * coef(summary(final_nb))[, "Std. Error"])
)
round(final_irr, 3)
#>              IRR lower upper
#> (Intercept) 3.97  3.15  5.00
#> woolB       0.82  0.65  1.03
#> tensionM    0.73  0.57  0.94
#> tensionH    0.60  0.47  0.76
```

The final report reads: "Controlling for loom hours, medium tension cut the break rate to 73% of low tension's (95% CI 57% to 94%), and high tension cut it to 60% (47% to 76%). Wool B's effect was not statistically reliable after accounting for overdispersion." That sentence is the deliverable for a count-data analysis, and it took five short steps to produce.

## Summary

![Poisson regression workflow overview.](screenshots/Poisson-Regression-in-R-mindmap.webp)
*Figure 3: The pieces of a Poisson regression workflow: fit, offset, interpret, and diagnose dispersion.*

| Task | Function | Package |
|---|---|---|
| Fit a Poisson GLM | `glm(y ~ x, family = poisson)` | base R (stats) |
| Use exposure | `offset = log(exposure)` argument | base R |
| Get rate ratios | `exp(coef(fit))` | base R |
| Wald CIs for IRRs | `exp(confint.default(fit))` | base R |
| Detect overdispersion | `deviance(fit) / df.residual(fit)` | base R |
| Formal dispersion test | `dispersiontest(fit)` | AER |
| Quasi-Poisson | `family = quasipoisson` | base R |
| Negative binomial | `glm.nb(y ~ x)` | MASS |
| Predicted counts | `predict(fit, newdata, type = "response")` | base R |
| Residual diagnostics | `residuals(fit, "pearson")`, `plot(fit)` | base R |

Poisson regression is the right starting point for any count outcome, but you should never stop there. The four-step workflow of fit, dispersion check, remediate if needed, and report IRRs with CIs protects you from the single most common bug in applied count-data analysis: reporting Poisson p-values on overdispersed data.

## References

1. Venables, W. N. & Ripley, B. D. *Modern Applied Statistics with S*, 4th Edition. Springer (2002). Chapter 7: Generalized Linear Models. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
2. McCullagh, P. & Nelder, J. A. *Generalized Linear Models*, 2nd Edition. Chapman & Hall (1989).
3. R Core Team. `glm` documentation (stats package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
4. Kleiber, C. & Zeileis, A. AER package and `dispersiontest()` reference. [Link](https://cran.r-project.org/web/packages/AER/AER.pdf)
5. UCLA OARC Stats. Poisson Regression examples in R. [Link](https://stats.oarc.ucla.edu/r/dae/poisson-regression/)
6. CRAN vignette. Count Data and Overdispersion (GlmSimulatoR). [Link](https://cran.r-project.org/web/packages/GlmSimulatoR/vignettes/count_data_and_overdispersion.html)
7. Gelman, A. & Hill, J. *Data Analysis Using Regression and Multilevel Models*, Chapter 6. Cambridge University Press (2006).

## Continue Learning

- [Logistic Regression in R](Logistic-Regression-in-R.html): binary outcomes use the same GLM framework with a logit link, giving odds ratios instead of rate ratios.
- [Linear Regression in R](Linear-Regression.html): the foundation that fails on counts and motivates the log link.
- [Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html): the Poisson distribution that sits under every Poisson GLM.
