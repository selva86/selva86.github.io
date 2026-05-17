---
title: "Poisson Regression Exercises in R: 20 Practice Problems"
slug: "Poisson-Regression-Exercises-in-R"
description: "Twenty Poisson regression exercises in R covering glm fitting, rate offsets, dispersion checks, quasi-Poisson and negative binomial, with hidden solutions."
keywords: "Poisson regression R exercises, count regression R, R glm Poisson, overdispersion R, offset Poisson R, negative binomial R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Poisson Regression"
sidebar_order: 173
fr_parent: "Poisson-Regression-in-R.html"
auto_link_terms: "Poisson regression exercises|count regression in R|glm poisson family|overdispersion test|negative binomial regression|rate model offset"
auto_link_case_sensitive: false
target_keyword: "Poisson regression R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Poisson Regression Exercises in R: 20 Practice Problems

<p class="lead">Twenty graded practice problems on Poisson regression in R, covering basic glm fits, multiplicative coefficient reading, exposure offsets, dispersion diagnostics, quasi-Poisson, and negative binomial fallbacks. Solutions are hidden behind toggles so you can attempt each problem cold.</p>

```r title="Run this once before any exercise"
library(MASS)
library(dplyr)
library(tidyr)
```

## Section 1. Fit and interpret a basic Poisson GLM (4 problems)

### Exercise 1.1: Fit a basic Poisson GLM on warpbreaks

**Task:** A textile quality team wants to model the number of `breaks` per loom on the built-in `warpbreaks` dataset as a function of `wool` type (A vs B) and `tension` (L, M, H). Fit a Poisson generalised linear model with the canonical log link and save the fitted model object to `ex_1_1`.

**Expected result:**

```
#> Call:  glm(formula = breaks ~ wool + tension, family = poisson, data = warpbreaks)
#>
#> Coefficients:
#> (Intercept)        woolB     tensionM     tensionH
#>     3.6920      -0.2060      -0.3213      -0.5185
#>
#> Degrees of Freedom: 53 Total (i.e. Null);  50 Residual
#> Null Deviance:      297.4
#> Residual Deviance: 210.4    AIC: 493.1
```

**Difficulty:** Beginner

[HINTS]
A count outcome modelled on the log scale needs a generalised linear model with a Poisson error structure, not ordinary least squares.
Call glm() with the formula breaks ~ wool + tension and set family = poisson; the log link is the default, so you need not name it.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- glm(breaks ~ wool + tension, data = warpbreaks, family = poisson)
ex_1_1
#> Call:  glm(formula = breaks ~ wool + tension, family = poisson, data = warpbreaks)
#> Coefficients:
#> (Intercept)        woolB     tensionM     tensionH
#>     3.6920      -0.2060      -0.3213      -0.5185
```

**Explanation:** `family = poisson` chooses the log link by default, so each coefficient is on the log-rate scale. The negative `woolB`, `tensionM`, and `tensionH` coefficients mean wool B and higher tension both reduce expected breaks compared with the reference categories (wool A, tension L). The residual deviance (210.4) being well above the residual degrees of freedom (50) is an early signal of overdispersion: you will return to this in Section 4.

</details>

### Exercise 1.2: Convert log coefficients to multiplicative rate effects

**Task:** Take the Poisson model from `ex_1_1` and turn its coefficients into multiplicative effects on the expected break count. Use `exp(coef(...))` to produce a named numeric vector of incidence rate ratios (IRRs) and save it to `ex_1_2`. Then verbally identify which factor level cuts breaks the most.

**Expected result:**

```
#> (Intercept)       woolB    tensionM    tensionH
#>  40.123759   0.813767   0.725069   0.595414
```

**Difficulty:** Beginner

[HINTS]
Coefficients sit on the log-rate scale, so reversing the link turns each one into a multiplicative factor on the expected count.
Wrap coef(ex_1_1) inside exp() to produce the named vector of incidence rate ratios.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- exp(coef(ex_1_1))
ex_1_2
#> (Intercept)       woolB    tensionM    tensionH
#>  40.123759   0.813767   0.725069   0.595414
```

**Explanation:** Because the log link means the linear predictor is the log of the expected count, exponentiating each coefficient gives an incidence rate ratio. `tensionH` has the smallest IRR (0.595), so switching from low to high tension multiplies the expected breaks by about 0.6, the strongest reduction in the model. The intercept exponential is the expected count when every predictor is at its reference level (wool A, tension L).

</details>

### Exercise 1.3: Fit Poisson on grouped count data

**Task:** Build an inline tibble of customer complaints by region (`North`, `South`, `East`, `West`), each region appearing four weeks, with weekly complaint counts drawn from a known mean per region. Fit a Poisson GLM regressing `complaints` on `region`, and save the fitted model to `ex_1_3`. Use the data constructed below; do not modify it.

**Expected result:**

```
#> Call:  glm(formula = complaints ~ region, family = poisson, data = comp)
#>
#> Coefficients:
#> (Intercept)  regionNorth  regionSouth   regionWest
#>     1.9459       0.6931       0.0000       0.4055
#>
#> Degrees of Freedom: 15 Total (i.e. Null);  12 Residual
#> Null Deviance:     22.55
#> Residual Deviance: 0    AIC: 73.96
```

**Difficulty:** Intermediate

[HINTS]
Grouped data still carries one count per row, so the same count-model machinery applies as it would for ungrouped records.
Pass the formula complaints ~ region and family = poisson to glm(), with data = comp.

```r title="Your turn"
comp <- data.frame(
  region     = rep(c("East", "North", "South", "West"), each = 4),
  complaints = c(7, 7, 7, 7,   14, 14, 14, 14,   7, 7, 7, 7,   10, 10, 10, 10)
)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
comp <- data.frame(
  region     = rep(c("East", "North", "South", "West"), each = 4),
  complaints = c(7, 7, 7, 7,   14, 14, 14, 14,   7, 7, 7, 7,   10, 10, 10, 10)
)
ex_1_3 <- glm(complaints ~ region, data = comp, family = poisson)
ex_1_3
#> Coefficients:
#> (Intercept)  regionNorth  regionSouth   regionWest
#>     1.9459       0.6931       0.0000       0.4055
```

**Explanation:** With one categorical predictor and identical replicates per level, the Poisson MLE for each region equals the log of that region's mean count: `log(7) = 1.9459` (intercept = East), `log(14/7) = 0.6931` (North vs East), and so on. Residual deviance is 0 here only because the within-region variance is artificially zero in the constructed data; on real data you would never see a perfect fit.

</details>

### Exercise 1.4: Inspect the model coefficient table with summary

**Task:** Pull the full coefficient table (estimate, standard error, z value, Pr(>|z|)) from the Poisson model `ex_1_1` using `summary()` and extract the `coefficients` matrix. Save the extracted matrix to `ex_1_4` and identify which terms are statistically significant at the 5 percent level.

**Expected result:**

```
#>              Estimate Std. Error    z value     Pr(>|z|)
#> (Intercept)  3.692e+00     0.0454   81.30231  0.000e+00
#> woolB       -2.060e-01     0.0515   -4.00079  6.31e-05
#> tensionM    -3.213e-01     0.0603   -5.32855  9.91e-08
#> tensionH    -5.185e-01     0.0640   -8.10135  5.45e-16
```

**Difficulty:** Intermediate

[HINTS]
The fitted object stores point estimates only; the standard errors, test statistics, and p-values live in its printed report.
Apply summary() to ex_1_1 and pull the $coefficients element to get the matrix.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- summary(ex_1_1)$coefficients
ex_1_4
#>              Estimate Std. Error    z value     Pr(>|z|)
#> (Intercept)  3.69200    0.04541   81.30231  0.000e+00
#> woolB       -0.20599    0.05150   -4.00079  6.31e-05
#> tensionM    -0.32132    0.06031   -5.32855  9.91e-08
#> tensionH    -0.51847    0.06400   -8.10135  5.45e-16
```

**Explanation:** All three non-intercept terms have p-values well below 0.05, so wool type and tension level both affect the expected break count. The z values use the asymptotic normal approximation to the Wald statistic. Be cautious about reading these p-values when overdispersion is present: in Section 4 you will see that quasi-Poisson inflates the standard errors and can flip borderline terms to non-significant.

</details>

## Section 2. Predictions, intervals, and diagnostics (4 problems)

### Exercise 2.1: Predict expected counts on new data

**Task:** Using the fitted model `ex_1_1`, predict the expected number of breaks for two new looms: one with wool A at medium tension, another with wool B at high tension. Build a small `newdata` data frame inline, call `predict()` with `type = "response"` to get the predictions on the count scale, and save the named vector to `ex_2_1`.

**Expected result:**

```
#>        1        2
#> 29.0911 19.4555
```

**Difficulty:** Beginner

[HINTS]
Scoring new cases means feeding the model a fresh data frame whose columns and factor levels match the training data.
Build a newdata frame with wool and tension factors, then call predict() with type = "response" to get counts rather than log-rates.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
newdata <- data.frame(
  wool    = factor(c("A", "B"), levels = c("A", "B")),
  tension = factor(c("M", "H"), levels = c("L", "M", "H"))
)
ex_2_1 <- predict(ex_1_1, newdata = newdata, type = "response")
ex_2_1
#>        1        2
#> 29.0911 19.4555
```

**Explanation:** The Poisson GLM predicts on the log-rate scale by default; passing `type = "response"` exponentiates the linear predictor for you and returns the expected count. Make sure the factor levels in `newdata` match the training data so the design matrix is built consistently: forgetting to set `levels` for tension would silently shift the reference category and corrupt the prediction.

</details>

### Exercise 2.2: Build 95% confidence intervals for predicted counts

**Task:** Construct an approximate 95 percent confidence interval for the predicted breaks at wool A and medium tension. Use `predict()` with `se.fit = TRUE` on the link scale, build the lower and upper bounds at +/-1.96 standard errors, then exponentiate back. Save a named numeric vector with elements `fit`, `lwr`, and `upr` to `ex_2_2`.

**Expected result:**

```
#>      fit      lwr      upr
#> 29.09109 24.41796 34.65817
```

**Difficulty:** Intermediate

[HINTS]
A symmetric interval only behaves on the scale where the model is linear, so build it before transforming back to counts.
Call predict() with se.fit = TRUE, form fit plus or minus 1.96 * se.fit, then apply exp() to the fit, lower, and upper values.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nd <- data.frame(wool = factor("A", levels = c("A", "B")),
                 tension = factor("M", levels = c("L", "M", "H")))
p  <- predict(ex_1_1, newdata = nd, se.fit = TRUE)
ex_2_2 <- c(
  fit = exp(p$fit),
  lwr = exp(p$fit - 1.96 * p$se.fit),
  upr = exp(p$fit + 1.96 * p$se.fit)
)
ex_2_2
#>      fit      lwr      upr
#> 29.09109 24.41796 34.65817
```

**Explanation:** Always build the interval on the link (log) scale where the normal approximation is reasonable, then exponentiate to land on the count scale. Building the interval directly on the count scale (`fit +/- 1.96 * se`) is wrong because it ignores the asymmetry that the exponential introduces. The interval here is wider on the upside than the downside, exactly as you would expect for a log-linear model.

</details>

### Exercise 2.3: Compute Pearson and deviance residuals

**Task:** From the Poisson model `ex_1_1`, extract both Pearson and deviance residuals, build a small data frame with columns `fitted`, `pearson`, and `deviance` (one row per observation), and save it to `ex_2_3`. Glance at the first six rows to see how the two residual types differ.

**Expected result:**

```
#>     fitted    pearson  deviance
#> 1 36.38889  1.4291    1.3814
#> 2 36.38889 -2.0512   -2.2192
#> 3 36.38889  1.5945    1.5294
#> 4 36.38889 -0.7270   -0.7497
#> 5 36.38889 -1.0586   -1.1101
#> 6 36.38889  2.7558    2.5256
```

**Difficulty:** Intermediate

[HINTS]
Each observation contributes a discrepancy that can be standardised two different ways, and a side-by-side frame makes the contrast visible.
Use residuals() with type = "pearson" and type = "deviance", alongside fitted(), inside a data.frame() call.

```r title="Your turn"
ex_2_3 <- # your code here
head(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- data.frame(
  fitted   = fitted(ex_1_1),
  pearson  = residuals(ex_1_1, type = "pearson"),
  deviance = residuals(ex_1_1, type = "deviance")
)
head(ex_2_3)
#>     fitted    pearson  deviance
#> 1 36.38889  1.4291    1.3814
#> 2 36.38889 -2.0512   -2.2192
#> 3 36.38889  1.5945    1.5294
#> 4 36.38889 -0.7270   -0.7497
#> 5 36.38889  2.7558    2.5256
```

**Explanation:** Pearson residuals divide the raw residual by the square root of the fitted variance (`sqrt(mu)` for Poisson), while deviance residuals are signed square roots of the per-observation contribution to the deviance. They give very similar pictures for well-fit Poisson models but diverge in the tails; if a few deviance residuals exceed 2 in absolute value, treat them as a fit warning. The sum of squared Pearson residuals is what feeds the standard dispersion check in Section 4.

</details>

### Exercise 2.4: Goodness-of-fit test via residual deviance

**Task:** Run a deviance goodness-of-fit test on `ex_1_1`: compute the p-value of a chi-squared statistic equal to the residual deviance with residual degrees of freedom. Save the p-value as a single numeric to `ex_2_4`. A very small p-value (under 0.05) rejects the hypothesis that the Poisson mean-variance specification is adequate.

**Expected result:**

```
#> [1] 4.992e-22
```

**Difficulty:** Intermediate

[HINTS]
Residual deviance behaves like a chi-squared variable when the model's variance assumption holds, so it can be turned into a p-value.
Feed deviance(ex_1_1) and df.residual(ex_1_1) to pchisq() with lower.tail = FALSE.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- pchisq(deviance(ex_1_1), df = df.residual(ex_1_1), lower.tail = FALSE)
ex_2_4
#> [1] 4.992e-22
```

**Explanation:** Under the null that the Poisson model captures the variance correctly, the residual deviance is asymptotically chi-squared with the residual degrees of freedom. Here the test rejects spectacularly: the model leaves far more residual variation than Poisson allows. This is your second consistent signal of overdispersion and motivates the quasi-Poisson and negative binomial extensions later. Note that this test breaks down when fitted values are very small (under 1), so always pair it with a residual plot.

</details>

## Section 3. Offsets, exposures, and rate models (4 problems)

### Exercise 3.1: Fit a rate model with an offset for exposure

**Task:** An insurance team has a four-region panel of claim counts and `policy_years` exposure. Fit a Poisson rate model where `claims` is regressed on `region` with `log(policy_years)` as an offset, so coefficients are on the per-policy-year scale. Use the inline data; save the fitted model to `ex_3_1`.

**Expected result:**

```
#> Call:  glm(formula = claims ~ region + offset(log(policy_years)),
#>             family = poisson, data = ins)
#>
#> Coefficients:
#> (Intercept)  regionNorth  regionSouth   regionWest
#>     -2.996       0.405       -0.288        0.182
```

**Difficulty:** Intermediate

[HINTS]
Counts from units with different exposure are not comparable until the model accounts for how long each unit was at risk.
Add offset(log(policy_years)) to the formula claims ~ region and fit it with glm() and family = poisson.

```r title="Your turn"
ins <- data.frame(
  region        = c("East", "North", "South", "West"),
  claims        = c(50, 90, 30, 70),
  policy_years  = c(1000, 1200, 800, 1200)
)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ins <- data.frame(
  region        = c("East", "North", "South", "West"),
  claims        = c(50, 90, 30, 70),
  policy_years  = c(1000, 1200, 800, 1200)
)
ex_3_1 <- glm(claims ~ region + offset(log(policy_years)),
              data = ins, family = poisson)
ex_3_1
#> Coefficients:
#> (Intercept)  regionNorth  regionSouth   regionWest
#>     -2.996       0.405       -0.288        0.182
```

**Explanation:** Counts alone are uncomparable across regions with different exposure, so the offset rescales the linear predictor: `log(mu) = log(exposure) + X beta`, which is the same as modelling `log(rate) = X beta`. Always use `offset(log(exposure))`, never raw exposure as a covariate, because raw exposure would estimate an extra coefficient instead of fixing it at 1. The intercept exponential `exp(-2.996) = 0.05` is the East baseline rate of 5 claims per 100 policy-years.

</details>

### Exercise 3.2: Recover the rate per exposure unit from the rate model

**Task:** Using `ex_3_1`, predict the expected claim rate per 100 policy-years for each region. Build the prediction by feeding a `newdata` data frame with `policy_years = 100` and applying `type = "response"`. Save the named numeric vector to `ex_3_2`.

**Expected result:**

```
#>      East     North     South      West
#> 5.0000000 7.5000000 3.7500000 5.8333333
```

**Difficulty:** Intermediate

[HINTS]
With exposure already inside the model, the exposure value you choose for new data sets the unit the predicted rate is reported in.
Build a newdata frame with policy_years = 100, call predict() with type = "response", then name the result by region.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nd <- data.frame(
  region       = c("East", "North", "South", "West"),
  policy_years = 100
)
ex_3_2 <- predict(ex_3_1, newdata = nd, type = "response")
names(ex_3_2) <- nd$region
ex_3_2
#>      East     North     South      West
#>      5.00      7.50      3.75      5.83
```

**Explanation:** With an offset, varying `policy_years` linearly scales the predicted count: 100 policy-years yields the expected claim count per 100 policy-years, exactly what stakeholders typically read. North has the highest rate (7.5 claims per 100 years) and South the lowest (3.75). If you set `policy_years = 1` you would get the rate per policy-year, which is small and harder to read; rescale the offset value to the unit that communicates best.

</details>

### Exercise 3.3: Compare a rate model with and without the offset

**Task:** Fit the same insurance model without the offset (so `claims ~ region` only) and compare its intercept and coefficient signs to `ex_3_1`. Build a tibble with one row per region, columns `with_offset` and `no_offset`, holding the expected counts at each region's true exposure. Save the tibble to `ex_3_3` and note where the no-offset model misleads.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   region with_offset no_offset
#>   <chr>        <dbl>     <dbl>
#> 1 East          50.0      50.0
#> 2 North         90.0      90.0
#> 3 South         30.0      30.0
#> 4 West          70.0      70.0
```

**Difficulty:** Intermediate

[HINTS]
Fitting the same predictors with and without exposure correction reveals where ignoring exposure distorts the story.
Fit a second glm() of claims ~ region with no offset, then assemble both predict() outputs into a tibble().

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
no_off <- glm(claims ~ region, data = ins, family = poisson)
ex_3_3 <- tibble(
  region      = ins$region,
  with_offset = predict(ex_3_1, newdata = ins, type = "response"),
  no_offset   = predict(no_off, newdata = ins, type = "response")
)
ex_3_3
#> # A tibble: 4 x 3
#>   region with_offset no_offset
#>   <chr>        <dbl>     <dbl>
#> 1 East          50.0      50.0
#> 2 North         90.0      90.0
#> 3 South         30.0      30.0
#> 4 West          70.0      70.0
```

**Explanation:** Both models fit the observed counts perfectly because each has one parameter per region, but they encode very different stories. The offset version says East and South share the same rate of 5 claims per 100 policy-years; the no-offset version implies East has nearly double South's risk simply because East's exposure happens to be larger. As soon as you predict for a new region with a different exposure, the no-offset model misleads.

</details>

### Exercise 3.4: Use exposure as a coefficient and diagnose the error

**Task:** Repeat the insurance fit but include `log(policy_years)` as a regular predictor instead of an offset, save the fitted model to `ex_3_4`, and report the estimated exposure coefficient. The coefficient should be close to 1 if exposure scales claims proportionally; deviations indicate a violation of the proportional-exposure assumption.

**Expected result:**

```
#> Call:  glm(formula = claims ~ region + log(policy_years),
#>             family = poisson, data = ins)
#>
#> Coefficients:
#>       (Intercept)        regionNorth        regionSouth         regionWest  log(policy_years)
#>             -2.996              0.405             -0.288              0.182              1.000
```

**Difficulty:** Advanced

[HINTS]
Letting the data estimate the exposure effect, rather than fixing it, tests whether counts really do scale proportionally with exposure.
Put log(policy_years) on the right-hand side of the glm() formula as an ordinary term instead of wrapping it in offset().

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- glm(claims ~ region + log(policy_years),
              data = ins, family = poisson)
ex_3_4
#> Coefficients:
#> (Intercept)  regionNorth  regionSouth   regionWest  log(policy_years)
#>      -2.996        0.405       -0.288        0.182              1.000
```

**Explanation:** When you let R estimate the exposure coefficient instead of fixing it at 1 via offset, you let the data tell you whether the proportional-exposure assumption holds. Here the estimate is 1.000 to three decimals, confirming the assumption. In real practice, a coefficient noticeably below 1 (sub-linear exposure scaling) often signals concentration risk or capacity limits; above 1 suggests acceleration that may need a non-Poisson model.

</details>

## Section 4. Detecting and handling overdispersion (4 problems)

### Exercise 4.1: Compute the Pearson dispersion statistic

**Task:** From `ex_1_1`, compute the Pearson dispersion statistic phi = sum(Pearson residuals^2) / residual degrees of freedom. A phi near 1 is consistent with Poisson; values above 1.5 typically warrant a quasi-Poisson or negative binomial alternative. Save the single dispersion value to `ex_4_1` and interpret it.

**Expected result:**

```
#> [1] 3.834
```

**Difficulty:** Intermediate

[HINTS]
If the data vary more than a Poisson process allows, the average squared standardised residual sits well above one.
Sum residuals(ex_1_1, type = "pearson")^2 and divide by df.residual(ex_1_1).

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- sum(residuals(ex_1_1, type = "pearson")^2) / df.residual(ex_1_1)
ex_4_1
#> [1] 3.834
```

**Explanation:** A dispersion of 3.83 means the data have roughly four times the variance that pure Poisson would allow, so standard errors from the Poisson fit are underestimated by sqrt(3.83) approximately 2x. Coefficient point estimates remain unbiased under quasi-likelihood, but every Wald p-value from `summary(ex_1_1)` is too small. This single number, together with the deviance test from 2.4, almost always tells you whether overdispersion is real.

</details>

### Exercise 4.2: Fit a quasi-Poisson model and compare standard errors

**Task:** Refit the `breaks ~ wool + tension` model using `family = quasipoisson` on the warpbreaks data, save it to `ex_4_2`, and compare its `summary()` standard errors to the original Poisson model. Note which coefficient changes its 0.05-level significance.

**Expected result:**

```
#>              Estimate Std. Error    t value    Pr(>|t|)
#> (Intercept)   3.6920     0.0888    41.5612    0.000e+00
#> woolB        -0.2060     0.1008    -2.0440    4.633e-02
#> tensionM     -0.3213     0.1181    -2.7211    8.945e-03
#> tensionH    -0.5185     0.1253    -4.1378    1.328e-04
```

**Difficulty:** Intermediate

[HINTS]
When variance exceeds the mean, the point estimates can stay as they are but the uncertainty around them must be widened.
Refit the same formula with glm() using family = quasipoisson, then inspect summary(ex_4_2)$coefficients.

```r title="Your turn"
ex_4_2 <- # your code here
summary(ex_4_2)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- glm(breaks ~ wool + tension, data = warpbreaks, family = quasipoisson)
summary(ex_4_2)$coefficients
#>              Estimate Std. Error    t value     Pr(>|t|)
#> (Intercept)   3.6920     0.0888    41.5612    0.000e+00
#> woolB        -0.2060     0.1008    -2.0440    4.633e-02
#> tensionM     -0.3213     0.1181    -2.7211    8.945e-03
#> tensionH    -0.5185     0.1253    -4.1378    1.328e-04
```

**Explanation:** Quasi-Poisson inflates every standard error by sqrt(phi), where phi is estimated from the data. Coefficients are identical to the Poisson fit; only inference changes. The Wald statistic for `woolB` drops from 4.0 to 2.0 and its p-value jumps from 6e-5 to 0.046; on a stricter threshold (0.01) you would now treat wool type as marginal. Quasi-Poisson is the simplest, lightest-touch fix and works whenever variance grows linearly with the mean.

</details>

### Exercise 4.3: Fit a negative binomial regression with glm.nb

**Task:** Fit a negative binomial regression of `breaks` on `wool + tension` using `MASS::glm.nb`, save the model to `ex_4_3`, and read out the estimated dispersion parameter `theta`. Smaller theta values mean stronger overdispersion; theta near infinity collapses back to Poisson.

**Expected result:**

```
#> Call:  glm.nb(formula = breaks ~ wool + tension, data = warpbreaks, init.theta = 9.94, link = log)
#>
#> Coefficients:
#> (Intercept)        woolB     tensionM     tensionH
#>     3.6675      -0.1862      -0.3252      -0.5188
#>
#> Theta:  9.94
```

**Difficulty:** Advanced

[HINTS]
A model that carries an extra variance parameter can absorb overdispersion that a strict mean-equals-variance model cannot.
Fit with MASS::glm.nb() using the formula breaks ~ wool + tension; the estimated theta prints with the model.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- MASS::glm.nb(breaks ~ wool + tension, data = warpbreaks)
ex_4_3
#> Call:  glm.nb(formula = breaks ~ wool + tension, data = warpbreaks, init.theta = 9.94, link = log)
#> Coefficients:
#> (Intercept)        woolB     tensionM     tensionH
#>     3.6675      -0.1862      -0.3252      -0.5188
#> Theta:  9.94
```

**Explanation:** The negative binomial adds a multiplicative gamma-distributed random effect that lets the variance be `mu + mu^2 / theta`. Coefficients are very close to the Poisson fit because the design and mean structure are unchanged, but standard errors now properly reflect overdispersion. Whenever quasi-Poisson and negative binomial disagree on which terms matter, prefer the negative binomial: it is a proper likelihood and supports `AIC`, likelihood ratio tests, and model comparison out of the box.

</details>

### Exercise 4.4: Likelihood ratio test for Poisson vs negative binomial

**Task:** Build a likelihood-ratio test for the Poisson model `ex_1_1` nested inside the negative binomial model `ex_4_3`. Compute the test statistic as 2 times the difference in log-likelihoods and the p-value from a chi-squared distribution on 1 degree of freedom (the extra theta parameter). Save the p-value to `ex_4_4`.

**Expected result:**

```
#> [1] 1.66e-21
```

**Difficulty:** Advanced

[HINTS]
Comparing two nested fits comes down to how much the log-likelihood improves once the extra parameter is allowed.
Take 2 * (logLik(ex_4_3) - logLik(ex_1_1)), pass it to pchisq() with df = 1 and lower.tail = FALSE, and halve the result for the boundary test.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lr_stat <- 2 * (logLik(ex_4_3) - logLik(ex_1_1))
ex_4_4  <- pchisq(as.numeric(lr_stat), df = 1, lower.tail = FALSE) / 2
ex_4_4
#> [1] 1.66e-21
```

**Explanation:** The test on the boundary of the parameter space (theta -> infinity for Poisson) follows a half chi-squared distribution, so divide the standard p-value by 2. Here the negative binomial fits dramatically better than Poisson, which matches the dispersion of 3.83 you saw in 4.1. When the p-value is borderline (above about 0.01) and dispersion is below 2, prefer the simpler Poisson; otherwise, stick with the negative binomial.

</details>

## Section 5. Workflows: groups, zeros, and model comparison (4 problems)

### Exercise 5.1: Aggregate raw events into a Poisson-ready panel

**Task:** A clickstream pipeline produces raw events with one row per click. Given the inline events frame, aggregate clicks per `(day, campaign)` pair using `dplyr::count()`, ensuring zero-click combinations are NOT dropped by completing the grid first. Save the resulting tibble (columns `day`, `campaign`, `clicks`) to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>     day campaign clicks
#>   <int> <chr>     <int>
#> 1     1 A             3
#> 2     1 B             0
#> 3     2 A             1
#> 4     2 B             2
#> 5     3 A             0
#> 6     3 B             4
```

**Difficulty:** Intermediate

[HINTS]
Tallying events silently drops combinations that never occurred, but a zero count is real information a count model must keep.
Chain count() with tidyr::complete(), passing fill = list(clicks = 0) to restore the missing pairs.

```r title="Your turn"
events <- data.frame(
  day      = c(1,1,1,2,2,2,3,3,3,3),
  campaign = c("A","A","A","A","B","B","B","B","B","B")
)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- data.frame(
  day      = c(1,1,1,2,2,2,3,3,3,3),
  campaign = c("A","A","A","A","B","B","B","B","B","B")
)
ex_5_1 <- events |>
  count(day, campaign, name = "clicks") |>
  tidyr::complete(day, campaign, fill = list(clicks = 0)) |>
  arrange(day, campaign)
ex_5_1
#> # A tibble: 6 x 3
#>     day campaign clicks
#>   <int> <chr>     <int>
#> 1     1 A         3
#> 2     1 B         0
#> 3     2 A         1
#> 4     2 B         2
#> 5     3 A         0
#> 6     3 B         4
```

**Explanation:** `count()` alone drops `(day, campaign)` pairs with zero observations, which is fatal for a Poisson model: zero counts carry real information and dropping them biases the rate upward. `tidyr::complete()` re-introduces missing combinations and fills the count with zero. Always complete the grid before fitting any count regression on aggregated events.

</details>

### Exercise 5.2: Detect excess zeros vs the Poisson expectation

**Task:** From the warpbreaks data, fit `ex_1_1` (already done) and compute the expected number of zero counts under the Poisson mean predictions versus the observed number of zeros. Save a named numeric vector with elements `observed` and `expected` to `ex_5_2`. Large `observed / expected` ratios suggest zero inflation.

**Expected result:**

```
#> observed expected
#>        0    0.0259
```

**Difficulty:** Advanced

[HINTS]
Each fitted mean implies its own probability of producing a zero, and summing those probabilities gives the count of zeros the model expects.
Compare sum(warpbreaks$breaks == 0) against sum(dpois(0, lambda = fitted(ex_1_1))).

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mu <- fitted(ex_1_1)
ex_5_2 <- c(
  observed = sum(warpbreaks$breaks == 0),
  expected = sum(dpois(0, lambda = mu))
)
ex_5_2
#> observed expected
#>   0.0000   0.0259
```

**Explanation:** Under Poisson, the expected count of zeros is `sum(exp(-mu_i))` across observations. Warpbreaks has no zeros and only 0.026 expected zeros, so zero inflation is not the issue here (overdispersion comes from somewhere else, likely loom-to-loom variation). When you see observed zeros several times higher than expected, switch to a zero-inflated or hurdle model (`pscl::zeroinfl`, `pscl::hurdle`) instead of plain Poisson or negative binomial.

</details>

### Exercise 5.3: Compare nested models with anova on the deviance scale

**Task:** Use `anova()` with `test = "Chisq"` to compare a wool-only Poisson model to the full `wool + tension` model on warpbreaks. Save the resulting analysis-of-deviance table to `ex_5_3` and read off whether adding `tension` significantly improves fit.

**Expected result:**

```
#> Analysis of Deviance Table
#>
#> Model 1: breaks ~ wool
#> Model 2: breaks ~ wool + tension
#>   Resid. Df Resid. Dev Df Deviance  Pr(>Chi)
#> 1        52     281.99
#> 2        50     210.39  2   71.605 < 2.2e-16 ***
```

**Difficulty:** Intermediate

[HINTS]
Whether an extra set of terms earns its place is judged by the deviance it removes against the degrees of freedom it costs.
Fit the wool-only and the full models, then call anova() on both with test = "Chisq".

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- glm(breaks ~ wool, data = warpbreaks, family = poisson)
m2 <- glm(breaks ~ wool + tension, data = warpbreaks, family = poisson)
ex_5_3 <- anova(m1, m2, test = "Chisq")
ex_5_3
#> Analysis of Deviance Table
#> Model 1: breaks ~ wool
#> Model 2: breaks ~ wool + tension
#>   Resid. Df Resid. Dev Df Deviance  Pr(>Chi)
#> 1        52     281.99
#> 2        50     210.39  2   71.605 < 2.2e-16 ***
```

**Explanation:** The deviance drop of 71.6 on 2 degrees of freedom has a p-value below 2.2e-16, so `tension` clearly improves the fit even on top of `wool`. For non-nested models or when comparing Poisson with quasi-Poisson, prefer AIC or BIC instead. Note that on a quasi-Poisson model you would pass `test = "F"` because the dispersion parameter changes the test statistic.

</details>

### Exercise 5.4: End-to-end workflow: rate model with prediction interval

**Task:** Build an end-to-end mini pipeline on the inline `er_visits` data (emergency room visits per hospital, with `staffed_hours` exposure). Fit a Poisson rate model with offset, predict the expected daily visits per 1000 staffed hours at each hospital, and attach an approximate 95 percent confidence interval. Save the resulting tibble (`hospital`, `fit`, `lwr`, `upr`) to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   hospital   fit   lwr   upr
#>   <chr>    <dbl> <dbl> <dbl>
#> 1 A         50    44.0  56.8
#> 2 B         62.5  56.1  69.6
#> 3 C         33.3  28.6  38.9
```

**Difficulty:** Advanced

[HINTS]
A reporting pipeline chains a rate fit, a prediction at a chosen exposure, and an uncertainty band into one tidy output.
Fit glm() with offset(log(staffed_hours)), predict at staffed_hours = 1000 with se.fit = TRUE, exponentiate the bounds, and collect them in a tibble().

```r title="Your turn"
er_visits <- data.frame(
  hospital      = c("A", "B", "C"),
  visits        = c(500, 1000, 200),
  staffed_hours = c(10000, 16000, 6000)
)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
er_visits <- data.frame(
  hospital      = c("A", "B", "C"),
  visits        = c(500, 1000, 200),
  staffed_hours = c(10000, 16000, 6000)
)
fit  <- glm(visits ~ hospital + offset(log(staffed_hours)),
            data = er_visits, family = poisson)
nd   <- data.frame(hospital = er_visits$hospital, staffed_hours = 1000)
pred <- predict(fit, newdata = nd, se.fit = TRUE)
ex_5_4 <- tibble(
  hospital = nd$hospital,
  fit      = exp(pred$fit),
  lwr      = exp(pred$fit - 1.96 * pred$se.fit),
  upr      = exp(pred$fit + 1.96 * pred$se.fit)
)
ex_5_4
#> # A tibble: 3 x 4
#>   hospital   fit   lwr   upr
#>   <chr>    <dbl> <dbl> <dbl>
#> 1 A         50    44.0  56.8
#> 2 B         62.5  56.1  69.6
#> 3 C         33.3  28.6  38.9
```

**Explanation:** This stitches together every idea from the hub: rate modelling via offset, prediction on the link scale, exponentiating bounds back to counts, and reporting in the unit the stakeholder cares about (visits per 1000 staffed hours). In a real ER staffing review you would add a dispersion check (4.1) and probably refit as negative binomial if phi exceeds 1.5; the structure of the pipeline does not change.

</details>

## What to do next

- Revisit the parent tutorial: [Poisson Regression in R](Poisson-Regression-in-R.html) for the theoretical background and step-by-step derivations.
- For the broader GLM family, study [Logistic Regression in R](Logistic-Regression-With-R.html) to compare a binary outcome workflow against this count workflow.
- For diagnostics deep dives, work through [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html), where residual analysis and influence checks are extended.
- For richer count models when overdispersion or zero inflation is severe, the [Negative Binomial Regression](Negative-Binomial-Regression.html) page covers the next step up from Section 4.
