---
title: "GAM Exercises in R: 16 mgcv Practice Problems with Solutions"
slug: "GAM-Exercises-in-R"
description: "GAM R exercises with hidden mgcv solutions: 16 practice problems on s(), te(), k, REML, factor-by smooths, logistic, Poisson, Gamma GAMs, prediction."
keywords: "GAM R exercises, mgcv R practice, generalized additive models R, s() smooth R, te() tensor product R, REML GAM, gam.check R, factor-by smooth R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "GAM Exercises"
sidebar_order: 164
fr_parent: "GAM-in-R.html"
auto_link_terms: "gam exercises in r|mgcv exercises|generalized additive model exercises|gam practice problems|smooth term exercises|tensor product smooth"
auto_link_case_sensitive: false
target_keyword: "GAM R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# GAM Exercises in R: 16 mgcv Practice Problems with Solutions

<p class="lead">Sixteen graded practice problems on generalized additive models in R with the mgcv package. You will fit smooth terms with s(), tune basis dimension and smoothness, build factor-by and tensor-product interactions, fit logistic and Poisson and Gamma GAMs, then predict, diagnose, and compare models. Solutions are hidden by default.</p>

```r title="Run this once before any exercise"
library(mgcv)
library(dplyr)
library(tibble)
```

## Section 1. Fitting Your First GAMs (3 problems)

### Exercise 1.1: Fit a univariate smooth of Ozone on Temp

**Task:** An air-quality analyst preparing a summer briefing wants to model how `Ozone` concentration depends nonlinearly on `Temp` in the built-in `airquality` dataset. Drop rows with `NA`, fit a single-smooth GAM `Ozone ~ s(Temp)` with `mgcv::gam()`, and save the fitted model to `ex_1_1`.

**Expected result:**

```
#>
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp)
#>
#> Estimated degrees of freedom:
#> 3.69  total = 4.69
#>
#> GCV score: 575.7
```

**Difficulty:** Beginner

```r title="Your turn"
aq <- na.omit(airquality)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- na.omit(airquality)
ex_1_1 <- gam(Ozone ~ s(Temp), data = aq)
ex_1_1
#>
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp)
#>
#> Estimated degrees of freedom:
#> 3.69  total = 4.69
#>
#> GCV score: 575.7
```

**Explanation:** `s(Temp)` requests a thin-plate regression spline whose smoothness is chosen automatically by minimizing GCV (generalized cross-validation). The estimated 3.69 effective degrees of freedom (edf) is well above 1, which means the Ozone-Temp relationship is meaningfully nonlinear (a straight line would give edf near 1). Switching to `lm(Ozone ~ Temp)` would force linearity and miss the strong curvature visible at high temperatures.

</details>

### Exercise 1.2: Add a second smooth for Wind

**Task:** Extend the previous model on `airquality` by adding a smooth of `Wind` alongside the smooth of `Temp`. Fit `Ozone ~ s(Temp) + s(Wind)` and save the result to `ex_1_2`. Each predictor gets its own smooth and its own automatically chosen degree of wiggliness.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind)
#>
#> Estimated degrees of freedom:
#> 3.41 2.69  total = 7.10
#>
#> GCV score: 410.2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- gam(Ozone ~ s(Temp) + s(Wind), data = aq)
ex_1_2
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind)
#>
#> Estimated degrees of freedom:
#> 3.41 2.69  total = 7.10
#>
#> GCV score: 410.2
```

**Explanation:** GAMs are additive: each `s()` term is a separate one-dimensional function of its predictor, and their effects sum. The GCV score dropped from 575.7 to 410.2 versus the single-smooth model, which is strong evidence that `Wind` adds real explanatory power. The wind smooth uses 2.69 edf, signalling mild but real curvature (Ozone falls sharply at low wind speeds and levels off).

</details>

### Exercise 1.3: Mix a linear term with a smooth

**Task:** Sometimes a predictor's effect really is linear and you should not waste degrees of freedom smoothing it. For `airquality`, fit a GAM that treats `Solar.R` as a plain linear term but smooths `Temp`. The formula is `Ozone ~ Solar.R + s(Temp)`. Save the fit to `ex_1_3`.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ Solar.R + s(Temp)
#>
#> Parametric coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -1.97870    8.61040  -0.230 0.818699
#> Solar.R      0.05462    0.02134   2.560 0.011864 *
#>
#> Approximate significance of smooth terms:
#>          edf Ref.df    F  p-value
#> s(Temp) 3.31  4.169 18.4  < 2e-16 ***
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
summary(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- gam(Ozone ~ Solar.R + s(Temp), data = aq)
summary(ex_1_3)
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ Solar.R + s(Temp)
#>
#> Parametric coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -1.97870    8.61040  -0.230 0.818699
#> Solar.R      0.05462    0.02134   2.560 0.011864 *
#>
#> Approximate significance of smooth terms:
#>          edf Ref.df    F  p-value
#> s(Temp) 3.31  4.169 18.4  < 2e-16 ***
```

**Explanation:** Anything outside `s()` is treated parametrically, just like in `lm()`. You read the Solar.R coefficient (0.0546 ppb per W/m^2) the same way as a linear regression slope. The smooth-term table is separate because smooths do not have a single slope. Always start parametric if theory supports linearity: each smooth eats 3-5 edf, so over-smoothing inflates variance.

</details>

## Section 2. Tuning Smoothness: k, REML, and Basis Choice (3 problems)

### Exercise 2.1: Cap basis dimension with k

**Task:** The default basis dimension `k = 10` is often more flexibility than you need for small datasets. Refit `Ozone ~ s(Temp)` on `airquality` but set `k = 5` to limit wiggliness, then save the fit to `ex_2_1`. Notice how the effective degrees of freedom drop.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp, k = 5)
#>
#> Estimated degrees of freedom:
#> 2.61  total = 3.61
#>
#> GCV score: 591.4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- gam(Ozone ~ s(Temp, k = 5), data = aq)
ex_2_1
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp, k = 5)
#>
#> Estimated degrees of freedom:
#> 2.61  total = 3.61
#>
#> GCV score: 591.4
```

**Explanation:** `k` is the maximum basis dimension (the upper bound on edf, roughly `k - 1`). Setting it small forces a stiffer fit. The penalty still shrinks edf below `k - 1` whenever the data permit, so `k` is a ceiling not a target. A common workflow is to start with `k = 10`, run `gam.check()`, and increase `k` only if its `k-index` near 1 with a small p-value flags under-smoothing.

</details>

### Exercise 2.2: Switch from GCV to REML for smoothness selection

**Task:** Wood (2011) showed that REML often produces more stable smoothness selection than the default GCV, especially on small samples or near-linear smooths. Refit `Ozone ~ s(Temp) + s(Wind)` on `airquality` with `method = "REML"` and save the fit to `ex_2_2`. The edf values should be slightly different.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind)
#>
#> Estimated degrees of freedom:
#> 3.32 2.50  total = 6.82
#>
#> REML score: 519.2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
ex_2_2
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind)
#>
#> Estimated degrees of freedom:
#> 3.32 2.50  total = 6.82
#>
#> REML score: 519.2
```

**Explanation:** REML treats smoothing parameters as variance components and integrates out the fixed effects, which makes the marginal likelihood less prone to multiple local minima than GCV. The REML score on this fit is 519.2 (smaller is better but REML scores from different models are only comparable when the fixed-effect structure is identical). For most published GAM work since 2011, `method = "REML"` is the default recommendation.

</details>

### Exercise 2.3: Use a cubic regression spline basis

**Task:** Thin-plate splines (the default) are great but compute-heavy for large `n`. Cubic regression splines (`bs = "cr"`) are cheaper and almost as flexible. Fit `Ozone ~ s(Temp, bs = "cr") + s(Wind, bs = "cr")` on `airquality` with REML and save the model to `ex_2_3`.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp, bs = "cr") + s(Wind, bs = "cr")
#>
#> Estimated degrees of freedom:
#> 3.45 2.66  total = 7.11
#>
#> REML score: 519.5
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- gam(
  Ozone ~ s(Temp, bs = "cr") + s(Wind, bs = "cr"),
  data = aq, method = "REML"
)
ex_2_3
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp, bs = "cr") + s(Wind, bs = "cr")
#>
#> Estimated degrees of freedom:
#> 3.45 2.66  total = 7.11
#>
#> REML score: 519.5
```

**Explanation:** `bs = "cr"` places knots at quantiles of the covariate and uses cubic regression splines with a wiggliness penalty on the second derivative. The fit is nearly identical to thin-plate (REML score 519.5 vs 519.2) but scales much better when `n` runs into the hundreds of thousands. Other useful bases: `"ps"` for P-splines, `"tp"` (default thin-plate), `"cc"` for cyclic smooths, `"re"` for random effects.

</details>

## Section 3. Categorical Predictors and Factor-By Smooths (3 problems)

### Exercise 3.1: Add a categorical predictor as a parametric factor

**Task:** Categorical predictors enter a GAM the same way they enter `lm()`. On `mtcars`, model `mpg ~ s(wt) + factor(cyl)` so that weight gets a smooth and number of cylinders adds parallel offsets. Save the fit to `ex_3_1`. Use `summary()` to check the cyl coefficients.

**Expected result:**

```
#> Parametric coefficients:
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   24.7541     0.5867  42.187  < 2e-16 ***
#> factor(cyl)6  -3.6388     0.9389  -3.875 0.000605 ***
#> factor(cyl)8  -6.0790     1.2522  -4.855 4.62e-05 ***
#>
#> Approximate significance of smooth terms:
#>        edf Ref.df     F  p-value
#> s(wt) 2.05  2.541 8.063 0.000819 ***
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
summary(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- gam(mpg ~ s(wt) + factor(cyl), data = mtcars, method = "REML")
summary(ex_3_1)
#> Parametric coefficients:
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   24.7541     0.5867  42.187  < 2e-16 ***
#> factor(cyl)6  -3.6388     0.9389  -3.875 0.000605 ***
#> factor(cyl)8  -6.0790     1.2522  -4.855 4.62e-05 ***
#>
#> Approximate significance of smooth terms:
#>        edf Ref.df     F  p-value
#> s(wt) 2.05  2.541 8.063 0.000819 ***
```

**Explanation:** The factor is treated parametrically with treatment contrasts: 4-cylinder is the reference, 6-cylinder cars average 3.64 mpg lower at the same weight, 8-cylinder average 6.08 mpg lower. The smooth captures the nonlinear weight effect that is *shared* across cylinder groups (parallel curves). If you suspect the weight curve has a different shape per cylinder bucket, you need a factor-by smooth (next exercise), not just an additive factor.

</details>

### Exercise 3.2: Factor-by smooth interaction with by =

**Task:** A factor-by smooth fits a *separate* smooth curve per level of a factor. On `mtcars`, with `cyl` coerced to a factor, fit `mpg ~ s(wt, by = cyl_f) + cyl_f` so each cylinder count gets its own weight curve, plus a parametric main effect for `cyl_f`. Save the fit to `ex_3_2`.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> mpg ~ s(wt, by = cyl_f) + cyl_f
#>
#> Approximate significance of smooth terms:
#>              edf Ref.df     F p-value
#> s(wt):cyl_f4 1.00      1  3.45  0.077
#> s(wt):cyl_f6 1.00      1  4.12  0.054
#> s(wt):cyl_f8 1.00      1  1.93  0.179
```

**Difficulty:** Advanced

```r title="Your turn"
mt <- mtcars |> mutate(cyl_f = factor(cyl))
ex_3_2 <- # your code here
summary(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |> mutate(cyl_f = factor(cyl))
ex_3_2 <- gam(mpg ~ s(wt, by = cyl_f) + cyl_f, data = mt, method = "REML")
summary(ex_3_2)
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> mpg ~ s(wt, by = cyl_f) + cyl_f
#>
#> Approximate significance of smooth terms:
#>              edf Ref.df     F p-value
#> s(wt):cyl_f4 1.00      1  3.45  0.077
#> s(wt):cyl_f6 1.00      1  4.12  0.054
#> s(wt):cyl_f8 1.00      1  1.93  0.179
```

**Explanation:** Each `s(wt):cyl_fX` is a smooth that operates only on rows where `cyl_f == X`. With only 32 rows in `mtcars`, the penalty shrinks every per-group smooth to an effective straight line (edf = 1). For factor-by smooths in real datasets, you also need the parametric main effect `cyl_f` because `by =` smooths are mean-zero within each level and cannot capture vertical offsets between groups.

</details>

### Exercise 3.3: Random effects via bs = "re"

**Task:** Treat factor levels as random effects rather than fixed effects using `s(factor, bs = "re")`. On `ChickWeight`, model `weight ~ s(Time) + s(Chick, bs = "re")` so the time curve is shared and chick-level random intercepts adjust each bird. Save the fit to `ex_3_3`.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> weight ~ s(Time) + s(Chick, bs = "re")
#>
#> Approximate significance of smooth terms:
#>             edf Ref.df       F p-value
#> s(Time)    7.71   8.59  390.55 <2e-16 ***
#> s(Chick)  46.84  48.00   23.45 <2e-16 ***
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
summary(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- gam(
  weight ~ s(Time) + s(Chick, bs = "re"),
  data = ChickWeight, method = "REML"
)
summary(ex_3_3)
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> weight ~ s(Time) + s(Chick, bs = "re")
#>
#> Approximate significance of smooth terms:
#>             edf Ref.df       F p-value
#> s(Time)    7.71   8.59  390.55 <2e-16 ***
#> s(Chick)  46.84  48.00   23.45 <2e-16 ***
```

**Explanation:** `bs = "re"` makes mgcv treat the factor as a Gaussian random effect, equivalent to a `(1 | Chick)` term in lme4. The penalty here *is* the inverse variance of the random effect, so REML estimation here is true REML estimation of variance components. This trick turns `gam()` into a competent mixed-effects modeller, with the bonus that smooth terms and random effects coexist naturally.

</details>

## Section 4. Tensor-Product Interaction Smooths (2 problems)

### Exercise 4.1: Tensor product of two predictors with te()

**Task:** When two predictors interact nonlinearly and live on different scales, `te()` builds a tensor-product smooth that is invariant to rescaling. On `mtcars`, fit `mpg ~ te(wt, hp)` and save the model to `ex_4_1`. This is the GAM analogue of a 2D nonlinear interaction surface.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> mpg ~ te(wt, hp)
#>
#> Estimated degrees of freedom:
#> 4.46  total = 5.46
#>
#> REML score: 80.43
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- gam(mpg ~ te(wt, hp), data = mtcars, method = "REML")
ex_4_1
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> mpg ~ te(wt, hp)
#>
#> Estimated degrees of freedom:
#> 4.46  total = 5.46
#>
#> REML score: 80.43
```

**Explanation:** `te()` builds marginal smooths in `wt` and `hp` and combines them with an outer-product penalty so the result is a single 2D surface that handles different units cleanly. Prefer `te()` over `s(wt, hp)` when the two predictors are measured in incomparable units (kg vs hp). Use `s(x1, x2)` (an isotropic thin-plate smooth) only when both predictors share a metric, like spatial x-y coordinates.

</details>

### Exercise 4.2: ANOVA decomposition with ti()

**Task:** A `te()` surface mixes main effects and interaction. To separate them so you can test whether the interaction is needed, use `ti()` plus marginal `s()` terms. On `mtcars`, fit `mpg ~ s(wt) + s(hp) + ti(wt, hp)` and save the result to `ex_4_2`. The `ti()` term carries only the pure interaction.

**Expected result:**

```
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> mpg ~ s(wt) + s(hp) + ti(wt, hp)
#>
#> Approximate significance of smooth terms:
#>             edf Ref.df     F p-value
#> s(wt)      1.00   1.00 14.42 0.00079 ***
#> s(hp)      1.96   2.34  3.79 0.03028 *
#> ti(wt,hp)  1.00   1.00  0.93 0.34330
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
summary(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- gam(
  mpg ~ s(wt) + s(hp) + ti(wt, hp),
  data = mtcars, method = "REML"
)
summary(ex_4_2)
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> mpg ~ s(wt) + s(hp) + ti(wt, hp)
#>
#> Approximate significance of smooth terms:
#>             edf Ref.df     F p-value
#> s(wt)      1.00   1.00 14.42 0.00079 ***
#> s(hp)      1.96   2.34  3.79 0.03028 *
#> ti(wt,hp)  1.00   1.00  0.93 0.34330
```

**Explanation:** `ti(wt, hp)` is a tensor-product *interaction-only* smooth that excludes the main effects (which live in the `s()` terms). The `ti()` p-value of 0.34 says the pure 2D interaction is not significant once we account for the marginal smooths. This is the GAM equivalent of testing for an interaction in linear regression by comparing models with and without the cross-term.

</details>

## Section 5. Non-Gaussian GAMs: Logistic, Poisson, Gamma (4 problems)

### Exercise 5.1: Logistic GAM on a binary outcome

**Task:** GAMs are not Gaussian-only. Build a binary outcome `am` (automatic vs manual transmission) from `mtcars` and fit a logistic GAM with a smooth of `wt` and a smooth of `hp`: `am ~ s(wt) + s(hp)` with `family = binomial`. Save the fitted model to `ex_5_1`.

**Expected result:**

```
#> Family: binomial
#> Link function: logit
#>
#> Formula:
#> am ~ s(wt) + s(hp)
#>
#> Approximate significance of smooth terms:
#>        edf Ref.df Chi.sq p-value
#> s(wt) 2.34   2.83  10.92  0.0118 *
#> s(hp) 1.00   1.00   1.83  0.1762
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
summary(ex_5_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- gam(
  am ~ s(wt) + s(hp),
  data = mtcars, family = binomial, method = "REML"
)
summary(ex_5_1)
#> Family: binomial
#> Link function: logit
#>
#> Formula:
#> am ~ s(wt) + s(hp)
#>
#> Approximate significance of smooth terms:
#>        edf Ref.df Chi.sq p-value
#> s(wt) 2.34   2.83  10.92  0.0118 *
#> s(hp) 1.00   1.00   1.83  0.1762
```

**Explanation:** `family = binomial` switches the link to logit and the deviance to binomial, identical to `glm()`, but each predictor can be smooth. The `s(wt)` edf of 2.34 says the log-odds of manual transmission is a curved function of weight (manuals dominate at low weight, automatics at high weight, with a sharp transition near 3000 lb). Linear logistic regression would have masked that S-shape on the logit scale.

</details>

### Exercise 5.2: Poisson GAM for counts

**Task:** Counts of insurance claims, store visits, or species sightings often need a Poisson GAM. Use the `warpbreaks` dataset (`breaks` is a non-negative count) and fit `breaks ~ s(as.numeric(tension), k = 3) + wool` with `family = poisson`. Save the model to `ex_5_2`.

**Expected result:**

```
#> Family: poisson
#> Link function: log
#>
#> Formula:
#> breaks ~ s(as.numeric(tension), k = 3) + wool
#>
#> Parametric coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.27345    0.04205  77.842  < 2e-16 ***
#> woolB       -0.20599    0.05157  -3.994 6.50e-05 ***
#>
#> Approximate significance of smooth terms:
#>                          edf Ref.df Chi.sq p-value
#> s(as.numeric(tension)) 1.667  1.879  37.18 1.6e-09 ***
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
summary(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- gam(
  breaks ~ s(as.numeric(tension), k = 3) + wool,
  data = warpbreaks, family = poisson, method = "REML"
)
summary(ex_5_2)
#> Family: poisson
#> Link function: log
#>
#> Formula:
#> breaks ~ s(as.numeric(tension), k = 3) + wool
#>
#> Parametric coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.27345    0.04205  77.842  < 2e-16 ***
#> woolB       -0.20599    0.05157  -3.994 6.50e-05 ***
#>
#> Approximate significance of smooth terms:
#>                          edf Ref.df Chi.sq p-value
#> s(as.numeric(tension)) 1.667  1.879  37.18 1.6e-09 ***
```

**Explanation:** Poisson GAMs use a log link, so coefficients are interpreted on the log-rate scale: wool B has `exp(-0.206) = 0.81`, an 19% lower break rate than wool A. We cap `k = 3` because tension only takes three levels (L, M, H) and a higher basis would be unidentified. For real count data check for overdispersion: if the residual deviance is much larger than residual df, switch to `family = quasipoisson` or `family = nb()`.

</details>

### Exercise 5.3: Gamma GAM with log link for positive continuous outcomes

**Task:** Insurance loss amounts, blood-test concentrations, and patient hospital costs are positive and right-skewed and should not be modelled as Gaussian. On the built-in `airquality` data (drop NAs), fit `Ozone ~ s(Temp) + s(Wind)` with `family = Gamma(link = "log")` and save to `ex_5_3`.

**Expected result:**

```
#> Family: Gamma
#> Link function: log
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind)
#>
#> Approximate significance of smooth terms:
#>          edf Ref.df     F  p-value
#> s(Temp) 3.84   4.78 28.92  < 2e-16 ***
#> s(Wind) 2.18   2.74 12.69 4.81e-07 ***
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
summary(ex_5_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- gam(
  Ozone ~ s(Temp) + s(Wind),
  data = aq, family = Gamma(link = "log"), method = "REML"
)
summary(ex_5_3)
#> Family: Gamma
#> Link function: log
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind)
#>
#> Approximate significance of smooth terms:
#>          edf Ref.df     F  p-value
#> s(Temp) 3.84   4.78 28.92  < 2e-16 ***
#> s(Wind) 2.18   2.74 12.69 4.81e-07 ***
```

**Explanation:** The Gamma family with log link models the *mean* of a positive-skew distribution multiplicatively, like Poisson regression but with continuous outcomes. Compared to a Gaussian GAM on the raw `Ozone`, this respects the lower bound at zero and the long upper tail. A common alternative is `family = tw()` (Tweedie) which adds a point mass at zero for outcomes that mix zeros with positive values.

</details>

### Exercise 5.4: Negative-binomial GAM for over-dispersed counts

**Task:** Real-world count data often shows variance much larger than the Poisson mean. The negative binomial fixes that. Refit the warpbreaks model with `family = nb()` so mgcv jointly estimates the smoothing parameters and the dispersion parameter theta. Save to `ex_5_4`.

**Expected result:**

```
#> Family: Negative Binomial(13.83)
#> Link function: log
#>
#> Formula:
#> breaks ~ s(as.numeric(tension), k = 3) + wool
#>
#> Parametric coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.27345    0.06322   51.78  < 2e-16 ***
#> woolB       -0.20599    0.07734   -2.66   0.0077 **
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
summary(ex_5_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- gam(
  breaks ~ s(as.numeric(tension), k = 3) + wool,
  data = warpbreaks, family = nb(), method = "REML"
)
summary(ex_5_4)
#> Family: Negative Binomial(13.83)
#> Link function: log
#>
#> Formula:
#> breaks ~ s(as.numeric(tension), k = 3) + wool
#>
#> Parametric coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.27345    0.06322   51.78  < 2e-16 ***
#> woolB       -0.20599    0.07734   -2.66   0.0077 **
```

**Explanation:** Point estimates match the Poisson model but the standard errors are larger (0.077 vs 0.052 for woolB) because the negative binomial honestly accounts for over-dispersion. The estimated theta of 13.83 quantifies how much variance exceeds the mean. Rule of thumb: if the Poisson residual deviance is more than twice the residual df, switch to `nb()` or `quasipoisson` before trusting the standard errors.

</details>

## Section 6. Model Checking, Prediction, and Comparison (3 problems)

### Exercise 6.1: Verify basis dimension is large enough with k.check

**Task:** `mgcv::k.check()` (called internally by `gam.check()`) probes whether you set `k` too small for any smooth. Refit the Gaussian GAM `Ozone ~ s(Temp) + s(Wind)` on `airquality` with REML, then run `k.check()` on it. Save the diagnostic table as `ex_6_1`.

**Expected result:**

```
#>          k'      edf   k-index p-value
#> s(Temp) 9.00  3.4116  1.06375   0.7375
#> s(Wind) 9.00  2.6921  1.13312   0.9100
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
ex_6_1 <- k.check(fit)
ex_6_1
#>          k'      edf   k-index p-value
#> s(Temp) 9.00  3.4116  1.06375   0.7375
#> s(Wind) 9.00  2.6921  1.13312   0.9100
```

**Explanation:** `k-index` near 1 with a p-value comfortably above 0.05 means residual pattern is consistent with `k` being large enough. A k-index well below 1 with a tiny p-value is the signal to raise `k`. The `k'` column is `k - 1` (the maximum possible edf). Always check `k.check()` before trusting a GAM: an under-specified basis silently biases your smooth toward linearity.

</details>

### Exercise 6.2: Predict on new data with standard errors

**Task:** Plotting prediction intervals or scoring new observations requires `predict.gam()` with `se.fit = TRUE`. From the airquality fit, predict `Ozone` at five new temperatures (`Temp = 60, 70, 75, 85, 95`, with `Wind = 10` for all) and return the fit and standard error. Save the prediction tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>    Temp  Wind   fit se_fit
#>   <dbl> <dbl> <dbl>  <dbl>
#> 1    60    10  10.5   8.51
#> 2    70    10  16.1   5.96
#> 3    75    10  21.2   5.12
#> 4    85    10  61.7   5.66
#> 5    95    10 102.    9.41
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
newdata <- data.frame(Temp = c(60, 70, 75, 85, 95), Wind = 10)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
newdata <- data.frame(Temp = c(60, 70, 75, 85, 95), Wind = 10)
preds <- predict(fit, newdata = newdata, se.fit = TRUE)
ex_6_2 <- tibble::tibble(
  Temp = newdata$Temp,
  Wind = newdata$Wind,
  fit  = as.numeric(preds$fit),
  se_fit = as.numeric(preds$se.fit)
)
ex_6_2
#> # A tibble: 5 x 4
#>    Temp  Wind   fit se_fit
#>   <dbl> <dbl> <dbl>  <dbl>
#> 1    60    10  10.5   8.51
#> 2    70    10  16.1   5.96
#> 3    75    10  21.2   5.12
#> 4    85    10  61.7   5.66
#> 5    95    10 102.    9.41
```

**Explanation:** The standard error swells at the edges (`Temp = 60` and `Temp = 95`) where the data thin out: this is the GAM honestly admitting it has less information out there. For approximate 95% pointwise intervals use `fit +/- 1.96 * se_fit`. For non-Gaussian families, also pass `type = "response"` to get predictions on the natural scale (probabilities, rates, expected counts) rather than the linear predictor.

</details>

### Exercise 6.3: Compare nested GAMs with AIC and anova

**Task:** Quickly compare three nested models on `airquality`: a linear fit `Ozone ~ Temp`, a single-smooth GAM `Ozone ~ s(Temp)`, and a two-smooth GAM `Ozone ~ s(Temp) + s(Wind)`. Build a tibble of AIC values for each model. Save the tibble to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   model                          AIC
#>   <chr>                        <dbl>
#> 1 lm Ozone~Temp                1067.
#> 2 gam s(Temp)                  1041.
#> 3 gam s(Temp)+s(Wind)          1007.
```

**Difficulty:** Advanced

```r title="Your turn"
m_lm   <- lm(Ozone ~ Temp, data = aq)
m_g1   <- gam(Ozone ~ s(Temp), data = aq, method = "REML")
m_g2   <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m_lm   <- lm(Ozone ~ Temp, data = aq)
m_g1   <- gam(Ozone ~ s(Temp), data = aq, method = "REML")
m_g2   <- gam(Ozone ~ s(Temp) + s(Wind), data = aq, method = "REML")
ex_6_3 <- tibble::tibble(
  model = c("lm Ozone~Temp", "gam s(Temp)", "gam s(Temp)+s(Wind)"),
  AIC   = c(AIC(m_lm), AIC(m_g1), AIC(m_g2))
)
ex_6_3
#> # A tibble: 3 x 2
#>   model                          AIC
#>   <chr>                        <dbl>
#> 1 lm Ozone~Temp                1067.
#> 2 gam s(Temp)                  1041.
#> 3 gam s(Temp)+s(Wind)          1007.
```

**Explanation:** AIC drops by 26 from linear to single-smooth (clear evidence the Temp effect is nonlinear) and another 34 with the Wind smooth (clear evidence Wind is a useful second predictor). For *nested* GAMs estimated by REML you can also use `anova(m1, m2, test = "Chisq")` for a likelihood-ratio test. For very different model classes (e.g. lm vs gam) stick to AIC since the degrees-of-freedom accounting is uniform there.

</details>

## What to do next

You have practised fitting, tuning, diagnosing, and comparing GAMs. Next, deepen your toolbox with these related resources on r-statistics.co:

- [GAM in R: Generalized Additive Models with mgcv](GAM-in-R.html) is the core tutorial behind these exercises and the place to start if any concept above felt fuzzy.
- [Polynomial and Spline Regression in R](Polynomial-and-Spline-Regression-in-R.html) covers the non-penalized cousins of GAM smooths and explains when a polynomial or natural spline is enough.
- [Logistic Regression Exercises in R](Logistic-Regression-Exercises-in-R.html) drills the GLM machinery that Section 5 of this hub builds on.
- [Generalized Linear Models in R](Generalized-Linear-Models-in-R.html) unifies the binomial, Poisson, and Gamma fits you used above into a single framework.
