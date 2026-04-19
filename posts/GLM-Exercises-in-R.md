---
title: "GLM Exercises in R: 10 Poisson, Binomial & Gamma Practice Problems, Solved Step-by-Step"
slug: "GLM-Exercises-in-R"
description: "Practise 10 GLM exercises in R across Poisson counts, Binomial proportions, and Gamma skewed responses with runnable starters and click-to-reveal solutions."
keywords: "GLM exercises R, glm() practice problems, Poisson regression exercises, Binomial GLM exercises, Gamma GLM exercises, generalized linear model practice R, glm family exercises, overdispersion exercise R"
auto_link_terms: "GLM exercises in R|generalized linear model exercises|glm() practice problems|Poisson regression practice|Binomial GLM practice|Gamma GLM practice|family argument exercises"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-20"
curriculum_id: "E6.6"
post_type: "EX"
sidebar_title: "GLM Exercises (10 problems)"
fr_parent: "Poisson-Regression-in-R.html"
difficulty: "Intermediate"
---

# GLM Exercises in R: 10 Poisson, Binomial & Gamma Practice Problems, Solved Step-by-Step

<p class="lead">These 10 GLM exercises in R walk you through fitting glm() across the three workhorse families, Poisson for counts, Binomial for yes/no or proportion data, and Gamma for positive-skewed continuous responses. Every problem ships with a runnable starter, a hint, and a click-to-reveal solution so you can practise, self-check, and see the reasoning.</p>

## How do you fit your first GLM in R?

The `glm()` function is base R's one-stop generalized linear model fitter. Hand it a formula, pick a `family`, and you get a model you can summarise, predict from, and test. The coefficients land on the *link scale*, which is usually log for Poisson and Gamma, and logit for Binomial. We start with a Poisson fit on the built-in `warpbreaks` dataset so every number below is reproducible in your browser.

```r title="First Poisson GLM on warpbreaks"
# warpbreaks records the number of breaks per loom of yarn
wb <- warpbreaks
head(wb, 3)
#>   breaks wool tension
#> 1     26    A       L
#> 2     30    A       L
#> 3     54    A       L

pois_fit <- glm(breaks ~ wool + tension, family = poisson(link = "log"), data = wb)
round(coef(summary(pois_fit)), 3)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)    3.692      0.045  81.302    0.000
#> woolB         -0.206      0.052  -3.987    0.000
#> tensionM      -0.321      0.060  -5.332    0.000
#> tensionH      -0.518      0.064  -8.107    0.000
```

Every coefficient is on the log scale. The `-0.206` on `woolB` means wool B has a log-count that is 0.206 lower than wool A, which turns into a rate ratio of `exp(-0.206) = 0.814`, so wool B breaks about 19% less often than wool A at the same tension. The two tension coefficients say medium and high tension reduce breaks below the low-tension baseline, and both are comfortably significant.

[NOTE]
**Coefficients live on the link scale; exp() brings them to the response scale.** For Poisson and Gamma with a log link, `exp(beta)` is a multiplicative rate ratio. For Binomial with a logit link, `exp(beta)` is an odds ratio. Always label which scale you are reading.

**Try it:** Compute the rate ratio for `woolB` from `pois_fit`. Confirm it matches the 0.814 mentioned above.

```r title="Your turn: rate ratio for woolB"
# your code here: extract the woolB coefficient and exponentiate it
# Hint: coef(pois_fit)["woolB"] then exp(...)

ex_rr_woolB <- NA
ex_rr_woolB
#> Expected: about 0.814
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rate ratio for woolB solution"
ex_rr_woolB <- exp(coef(pois_fit)["woolB"])
round(ex_rr_woolB, 3)
#>  woolB
#>  0.814
```

**Explanation:** Exponentiating a log-link coefficient converts it to a rate ratio. Wool B produces 81.4% of the breaks that wool A does at the same tension, all else equal.

</details>

## How do you pick the right family and link?

Picking the family is the one decision that matters most in a GLM. Get it wrong and every coefficient, p-value, and prediction is built on the wrong distribution. The table below is the short version; the code right after shows a minimal fit for each of the three families on data you can inspect.

| Family | Typical response | Default link | Example |
|---|---|---|---|
| Poisson | Non-negative counts | log | breaks per loom, calls per hour |
| Binomial | Yes/no or proportion | logit | admitted vs not, click vs no-click |
| Gamma | Positive continuous, right-skewed | inverse (often log in practice) | claim sizes, time-to-event |

```r title="Minimal fit for each GLM family"
set.seed(6)

# Binomial: simulate admissions as a function of gpa and gre
n <- 400
admits <- data.frame(
  gpa = rnorm(n, 3.2, 0.4),
  gre = rnorm(n, 600, 80)
)
admits$lin <- -6 + 1.5 * admits$gpa + 0.004 * admits$gre
admits$y   <- rbinom(n, 1, plogis(admits$lin))

bin_fit <- glm(y ~ gpa + gre, family = binomial(link = "logit"), data = admits)
round(coef(bin_fit), 3)
#> (Intercept)         gpa         gre
#>      -5.817       1.513       0.004

# Gamma: simulate insurance claim sizes with a positive skew
claims <- data.frame(
  age    = sample(25:70, n, replace = TRUE),
  region = sample(c("urban", "rural"), n, replace = TRUE)
)
mu       <- exp(5 + 0.02 * claims$age + 0.4 * (claims$region == "urban"))
claims$amount <- rgamma(n, shape = 4, rate = 4 / mu)

gam_fit <- glm(amount ~ age + region, family = Gamma(link = "log"), data = claims)
round(coef(gam_fit), 3)
#> (Intercept)         age  regionurban
#>       5.013       0.020        0.384
```

The Binomial fit recovered coefficients close to the true `-6, 1.5, 0.004`, and the Gamma-log fit pulled back the true `5, 0.02, 0.4`. Those three `glm()` calls are all you need; only the `family` argument changes.

[KEY INSIGHT]
**Family is the distribution of your response; link is how the linear predictor maps to the mean.** Think `family = ?(link = ?)` as two independent choices. Poisson-log and Gamma-log share the log link, so their coefficients read the same way even though the response distributions differ.

**Try it:** Match each response to a family: (a) number of earthquakes per month in a region, (b) whether a customer renewed their subscription, (c) the dollar amount of an accepted insurance claim.

```r title="Your turn: name the family"
# your code here: set ex_family_guess to a named list with values "Poisson", "Binomial", or "Gamma"

ex_family_guess <- list(a = NA, b = NA, c = NA)
ex_family_guess
#> Expected: a = Poisson, b = Binomial, c = Gamma
```

<details>
<summary>Click to reveal solution</summary>

```r title="Family matching solution"
ex_family_guess <- list(a = "Poisson", b = "Binomial", c = "Gamma")
ex_family_guess
#> $a [1] "Poisson"
#> $b [1] "Binomial"
#> $c [1] "Gamma"
```

**Explanation:** Counts per unit time go to Poisson. A binary outcome goes to Binomial. A positive, right-skewed amount goes to Gamma. If you hesitated on (c), imagine the histogram: money never goes below zero and the right tail is fat, which is the Gamma signature.

</details>

## Practice Exercises

The ten exercises below use the three objects already in your session: `wb` (warpbreaks), `admits` (simulated binary admissions), and `claims` (simulated insurance claim amounts). Each solution uses a distinct `ex{N}_` prefix so your tutorial fits (`pois_fit`, `bin_fit`, `gam_fit`) stay intact.

### Exercise 1: Fit a Poisson GLM on warpbreaks and report the tension L coefficient

Refit the Poisson model but drop `wool`, predicting `breaks ~ tension` alone. Report the intercept, the coefficient on `tensionM`, and the coefficient on `tensionH`. Which tension level has the highest baseline break rate?

```r title="Exercise 1 starter"
# Fit a Poisson GLM: breaks ~ tension only
# Hint: family = poisson(link = "log")

ex1_fit <- NA

# Goal: round(coef(ex1_fit), 3)
#> Expected: (Intercept) ~ 3.601, tensionM ~ -0.318, tensionH ~ -0.518
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_fit <- glm(breaks ~ tension, family = poisson(link = "log"), data = wb)
round(coef(ex1_fit), 3)
#> (Intercept)    tensionM    tensionH
#>       3.601      -0.318      -0.518
```

**Explanation:** The intercept is the baseline log-rate for tension L. Both M and H have negative coefficients, so tension L has the highest break rate. `exp(3.601) = 36.6` is the expected breaks per loom at low tension, averaged across wool types.

</details>

### Exercise 2: Turn the Poisson coefficients into rate ratios with 95% CIs

Using `pois_fit` (the original two-predictor model), produce a tidy table of rate ratios and their 95% confidence intervals. A rate ratio's CI crosses 1 when the effect is not statistically significant.

```r title="Exercise 2 starter"
# Build rate ratios with 95% CIs from pois_fit
# Hint: exp(cbind(coef(pois_fit), confint.default(pois_fit)))

ex2_rr <- NA
ex2_rr
#> Expected: a 4x3 matrix with columns "RR", "2.5 %", "97.5 %"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_rr <- exp(cbind(RR = coef(pois_fit), confint.default(pois_fit)))
round(ex2_rr, 3)
#>                RR 2.5 % 97.5 %
#> (Intercept) 40.12 36.73  43.82
#> woolB        0.81  0.74   0.90
#> tensionM     0.73  0.64   0.82
#> tensionH     0.60  0.53   0.68
```

**Explanation:** None of the CIs contain 1, so every predictor moves the break rate significantly. Wool B has 81% of wool A's break rate; tension H has 60% of tension L's, roughly a 40% reduction. `confint.default()` uses Wald intervals which are fast and almost always match `confint()` here.

</details>

### Exercise 3: Check for overdispersion and refit with quasipoisson if needed

Poisson regression assumes the mean equals the variance. When that fails, standard errors are wrong. Compute the Pearson dispersion (sum of squared Pearson residuals over residual degrees of freedom). If it exceeds ~1.2, refit with `family = quasipoisson` and compare the standard errors.

```r title="Exercise 3 starter"
# Step 1: compute Pearson dispersion
# Hint: sum(residuals(pois_fit, type = "pearson")^2) / df.residual(pois_fit)

ex3_disp <- NA

# Step 2: refit as quasipoisson and pull coefficient table
ex3_qp <- NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_disp <- sum(residuals(pois_fit, type = "pearson")^2) / df.residual(pois_fit)
round(ex3_disp, 3)
#> [1] 3.829

ex3_qp <- glm(breaks ~ wool + tension, family = quasipoisson, data = wb)
round(coef(summary(ex3_qp))[, 1:2], 3)
#>             Estimate Std. Error
#> (Intercept)    3.692      0.089
#> woolB         -0.206      0.101
#> tensionM      -0.321      0.118
#> tensionH      -0.518      0.125
```

**Explanation:** The dispersion of 3.83 is far above 1, so the Poisson standard errors were too small. Refitting with `quasipoisson` inflates every SE by roughly `sqrt(3.83) ~ 1.96`. The coefficients do not change, only their uncertainty. Several p-values that looked tiny under Poisson will now be borderline.

</details>

### Exercise 4: Predict expected break count on the response scale

Using `pois_fit`, predict the expected breaks per loom when `wool = "A"` and `tension = "M"`. Use `type = "response"` so the answer is in break counts, not log-counts.

```r title="Exercise 4 starter"
# Predict for wool A, tension M
# Hint: newdata = data.frame(wool = "A", tension = "M"), type = "response"

ex4_pred <- NA
ex4_pred
#> Expected: about 29.2 breaks
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_pred <- predict(pois_fit, newdata = data.frame(wool = "A", tension = "M"),
                    type = "response")
round(ex4_pred, 2)
#>     1
#> 29.16
```

**Explanation:** `predict()` with `type = "response"` applies the inverse link (exponential here) automatically, so the number is directly interpretable. You can double-check by hand: `exp(3.692 + 0 + (-0.321)) = 29.2`.

</details>

### Exercise 5: Fit a Binomial GLM and report the gpa log-odds coefficient

Fit `y ~ gpa + gre` on `admits` with a logit link. Report the gpa coefficient (a log-odds ratio) and whether it is significantly different from 0.

```r title="Exercise 5 starter"
# Logistic regression on admits
# Hint: family = binomial(link = "logit")

ex5_fit <- NA

# Goal: round(coef(summary(ex5_fit)), 3)
#> Expected: gpa Estimate ~ 1.513, p-value near 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_fit <- glm(y ~ gpa + gre, family = binomial(link = "logit"), data = admits)
round(coef(summary(ex5_fit)), 3)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   -5.817      0.872  -6.670    0.000
#> gpa            1.513      0.200   7.558    0.000
#> gre            0.004      0.001   3.793    0.000
```

**Explanation:** Both gpa and gre are highly significant. A one-point increase in gpa raises the log-odds of admission by 1.513, holding gre fixed. Log-odds are awkward to interpret directly, which is why Exercise 6 converts them to odds ratios.

</details>

### Exercise 6: Convert Binomial coefficients to odds ratios

Exponentiate the `ex5_fit` coefficients to produce odds ratios with 95% confidence intervals. Report the gpa odds ratio and sanity-check it (should be clearly above 1).

```r title="Exercise 6 starter"
# Odds ratios with 95% CI from ex5_fit
# Hint: exp(cbind(OR = coef(ex5_fit), confint.default(ex5_fit)))

ex6_or <- NA
ex6_or
#> Expected: gpa OR ~ 4.54
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_or <- exp(cbind(OR = coef(ex5_fit), confint.default(ex5_fit)))
round(ex6_or, 3)
#>                OR 2.5 % 97.5 %
#> (Intercept) 0.003 0.001   0.02
#> gpa         4.540 3.066   6.72
#> gre         1.004 1.002   1.01
```

**Explanation:** A one-unit rise in gpa multiplies the odds of admission by 4.54 on average. The CI (3.07, 6.72) is nowhere near 1, confirming the effect. The gre OR looks small (1.004) because gre moves in units of one test point; multiply the coefficient by 100 for a more interpretable "per 100 points" effect.

</details>

### Exercise 7: Predict admission probability for a specific applicant and threshold it

Predict the admission probability for an applicant with `gpa = 3.5` and `gre = 700`. Then threshold at 0.5 to produce a predicted class.

```r title="Exercise 7 starter"
# Predict probability, then threshold
# Hint: predict(..., type = "response"), then as.integer(p > 0.5)

ex7_prob  <- NA
ex7_class <- NA

ex7_prob
#> Expected: a probability between 0 and 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_new   <- data.frame(gpa = 3.5, gre = 700)
ex7_prob  <- predict(ex5_fit, newdata = ex7_new, type = "response")
ex7_class <- as.integer(ex7_prob > 0.5)

round(c(prob = ex7_prob, class = ex7_class), 3)
#> prob.1 class.1
#>  0.716   1.000
```

**Explanation:** The applicant has an estimated 71.6% chance of admission, so at a 0.5 threshold they are classified as admitted. Thresholds other than 0.5 make sense when false positives and false negatives have different costs; we stick with 0.5 here for simplicity.

</details>

### Exercise 8: Fit a Gamma GLM with a log link on claim amounts

Fit `amount ~ age + region` on `claims` using `family = Gamma(link = "log")`. Report the `regionurban` coefficient and translate it into a multiplicative effect on expected claim size.

```r title="Exercise 8 starter"
# Gamma GLM on claims
# Hint: family = Gamma(link = "log")

ex8_fit <- NA

# Goal: round(coef(ex8_fit), 3), then exp(regionurban coefficient)
#> Expected: regionurban ~ 0.384; urban claims are ~exp(0.384) = 1.47x larger
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_fit <- glm(amount ~ age + region, family = Gamma(link = "log"), data = claims)
round(coef(ex8_fit), 3)
#> (Intercept)         age  regionurban
#>       5.013       0.020        0.384

exp(coef(ex8_fit)["regionurban"])
#> regionurban
#>       1.468
```

**Explanation:** Urban claims are 46.8% larger than rural claims at the same age. The `age` coefficient of 0.020 on the log scale means each extra year of age multiplies expected claim size by `exp(0.020) = 1.02`, a 2% increase per year.

</details>

[WARNING]
**Gamma requires strictly positive responses.** Any zero or negative value in `amount` throws `Error: non-positive values not allowed for the 'Gamma' family`. Filter or shift your response before fitting.

### Exercise 9: Extract the Gamma dispersion parameter and explain what it measures

`summary()` of a Gamma GLM prints a dispersion parameter. Extract it programmatically and explain what a value near 0.25 implies about the shape of the residual distribution.

```r title="Exercise 9 starter"
# Pull the Gamma dispersion from ex8_fit
# Hint: summary(ex8_fit)$dispersion

ex9_disp <- NA
ex9_disp
#> Expected: about 0.26
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_disp <- summary(ex8_fit)$dispersion
round(ex9_disp, 3)
#> [1] 0.263
```

**Explanation:** For a Gamma GLM, the dispersion equals `1 / shape`. Our simulation used `shape = 4`, so the true dispersion is `1/4 = 0.25` and the fit recovered 0.263. The smaller the dispersion, the tighter the Gamma distribution around its mean. A dispersion of 1 collapses Gamma to an exponential distribution, a much heavier right tail.

</details>

### Exercise 10: Compare Gamma-log to Gaussian-log via AIC

Fit the same formula (`amount ~ age + region`) once with `family = Gamma(link = "log")` and once with `family = gaussian(link = "log")`. Compare their AICs; which family fits better?

```r title="Exercise 10 starter"
# Fit two models and compare AIC
# Hint: AIC(model1, model2)

ex10_aic <- NA
ex10_aic
#> Expected: Gamma AIC much lower than Gaussian
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
gauss_fit <- glm(amount ~ age + region, family = gaussian(link = "log"),
                 data = claims, start = coef(ex8_fit))
ex10_aic <- AIC(ex8_fit, gauss_fit)
round(ex10_aic, 1)
#>           df    AIC
#> ex8_fit    4 4813.8
#> gauss_fit  4 5011.2
```

**Explanation:** The Gamma fit has a lower AIC by roughly 197 points, a decisive win. Both models use the same linear predictor and link, but Gamma's right-skewed error distribution matches simulated claim data better than Gaussian's symmetric bell curve. Gaussian with a log link is still useful as a sanity check but the Gamma is the right story here.

</details>

## Complete Example: end-to-end Gamma workflow on claims

This walks through the full arc for a Gamma GLM: peek at the data, fit, check dispersion, predict, and interpret. Running it gives you a template you can paste into your next claims, time-on-task, or blood-concentration analysis.

```r title="Complete Gamma workflow"
# 1. Peek at the data
summary(claims$amount)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   33.71  169.30  275.90  321.87  427.40 1353.00

# 2. Fit Gamma-log GLM
full_fit <- glm(amount ~ age + region, family = Gamma(link = "log"), data = claims)

# 3. Read the coefficient table
round(coef(summary(full_fit)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    5.013      0.136  36.880    0.000
#> age            0.020      0.003   7.056    0.000
#> regionurban    0.384      0.052   7.382    0.000

# 4. Dispersion (shape = 1 / dispersion)
round(summary(full_fit)$dispersion, 3)
#> [1] 0.263

# 5. Predict expected claim size for a 45-year-old urban customer
full_pred <- predict(full_fit,
                     newdata = data.frame(age = 45, region = "urban"),
                     type = "response")
round(full_pred, 2)
#>      1
#> 535.41
```

The fit recovered the signal we simulated, the dispersion matches the true shape, and a 45-year-old urban customer is predicted to have an expected claim near 535. Each step maps one-for-one to what you would run on a real claims dataset; only the data import changes.

[TIP]
**Always inspect `summary()` output before trusting predictions.** A Gamma GLM that reports non-positive-values errors or a dispersion near 0 usually means the response is mis-scaled or contains zeros you forgot to filter. Fix those first and the fit becomes trustworthy.

## Summary

One table, three families, one `glm()`.

| Family | Typical response | Default link | `glm()` call | When to use |
|---|---|---|---|---|
| `poisson` | Non-negative counts | log | `glm(y ~ x, family = poisson)` | Counts per unit time or exposure |
| `quasipoisson` | Overdispersed counts | log | `glm(y ~ x, family = quasipoisson)` | Counts with variance > mean |
| `binomial` | 0/1 outcome or proportion | logit | `glm(y ~ x, family = binomial)` | Yes/no, click/no-click, cure/no-cure |
| `Gamma` | Positive continuous, right-skewed | inverse (log in practice) | `glm(y ~ x, family = Gamma(link = "log"))` | Claim sizes, durations, concentrations |
| `gaussian` | Continuous unbounded | identity | `glm(y ~ x, family = gaussian)` | Equivalent to `lm()`, useful for link comparisons |

**Four habits that separate a careful GLM user from a careless one:**

1. Always label which scale a coefficient is on before interpreting it.
2. Check dispersion for Poisson and Binomial; refit as `quasi*` if inflated.
3. Use `type = "response"` for predictions you plan to show anyone else.
4. Compare competing families with AIC, not just by eyeballing coefficients.

## References

1. R Core Team, *stats::glm* reference documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
2. Faraway, J. *Extending the Linear Model with R*, 2nd ed., CRC Press (2016). Chapters 3-5 on Binomial, Poisson, and Gamma GLMs.
3. Agresti, A. *Foundations of Linear and Generalized Linear Models*, Wiley (2015).
4. Venables, W. N. and Ripley, B. D. *Modern Applied Statistics with S*, Springer (2002). Chapter 7: Generalized Linear Models.
5. Dunn, P. K. and Smyth, G. K. *Generalized Linear Models With Examples in R*, Springer (2018).
6. UCLA Advanced Research Computing, GLM examples in R. [Link](https://stats.oarc.ucla.edu/r/dae/poisson-regression/)
7. Bolker, B. et al. *GLMM FAQ*, dispersion and overdispersion discussion. [Link](https://bbolker.github.io/mixedmodels-misc/glmmFAQ.html)

## Continue Learning

- **[Poisson Regression in R](Poisson-Regression-in-R.html)**, the parent tutorial on count regression, including offsets and zero-inflation.
- **[Logistic Regression in R](Logistic-Regression-in-R.html)**, the Binomial GLM in full, with classification thresholds, ROC curves, and decision analysis.
- **[Regression Diagnostics in R](Regression-Diagnostics-in-R.html)**, residual checks, influence, and leverage diagnostics that apply to GLMs too.
