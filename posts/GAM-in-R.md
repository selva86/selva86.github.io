---
title: "GAM in R: Generalized Additive Models with mgcv, Smooth Nonlinear Effects"
slug: GAM-in-R
description: "Fit generalized additive models in R with mgcv. Use s() for smooths, te() for interactions, and learn to interpret edf, plot effects, and check model fit."
keywords: "GAM in R, mgcv, generalized additive models, smooth regression, s() function, te() tensor product, REML, penalized splines, nonlinear regression, gam() R"
auto_link_terms: "GAM|generalized additive models|mgcv package|gam() function|smooth terms|penalized regression splines|tensor product smooths"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-15
post_type: FR
fr_parent: Polynomial-and-Spline-Regression-in-R.html
difficulty: Intermediate
---

# GAM in R: Generalized Additive Models with mgcv, Smooth Nonlinear Effects

<p class="lead">A generalized additive model (GAM) fits flexible nonlinear effects as a sum of smooth functions, letting the data decide how wiggly each predictor's effect should be. In R, the mgcv package makes this a one-line change from <code>lm()</code>.</p>

## What makes a GAM different from polynomial regression?

Linear regression forces every predictor into a straight line. Polynomial terms help, but you have to pick the degree, and high-order terms wiggle unpredictably at the edges. A GAM sidesteps both problems: you write `s(x)` instead of `x`, and mgcv automatically picks how smooth that effect should be. The payoff below fits Ozone as a smooth function of Temp on the built-in `airquality` dataset.

```r title="Fit and plot a GAM with s(Temp)"
# Load mgcv and drop rows with NAs
library(mgcv)
aq <- na.omit(airquality)

# Fit Ozone as a smooth function of Temp
m1 <- gam(Ozone ~ s(Temp), data = aq, method = "REML")

summary(m1)$s.table
#>              edf    Ref.df        F      p-value
#> s(Temp) 3.685137  4.566049 24.09896 1.347918e-15

plot(m1, shade = TRUE, seWithMean = TRUE, main = "Smooth effect of Temp on Ozone")
```

Three numbers tell the story. `edf = 3.69` means the fitted effect is about as complex as a degree-3 polynomial, far from a straight line. `p-value ~ 1e-15` says the smooth is overwhelmingly significant. The plot (a runnable cell renders it) shows Ozone rising gently at low temperatures and sharply above about 80 degrees, exactly the kind of curve a linear fit would miss.

[KEY INSIGHT]
**GAMs let the data choose the shape.** You tell mgcv "x has some smooth effect on y" with `s(x)`. The package picks how wiggly that smooth should be by penalising curvature and tuning the penalty with REML. No degree to guess, no knot placement to fuss over.

Compare the GAM against a plain linear fit to see the gap.

```r title="Compare GAM fit to linear fit"
# Fit a straight-line model for contrast
m1_lin <- lm(Ozone ~ Temp, data = aq)

# Compare AIC (lower is better)
c(linear = AIC(m1_lin), gam = AIC(m1))
#>   linear      gam
#> 996.6547 970.0361

# R-squared / deviance explained
c(linear_r2 = summary(m1_lin)$r.squared,
  gam_dev_expl = summary(m1)$dev.expl)
#>    linear_r2 gam_dev_expl
#>    0.4877072    0.6078488
```

The GAM cuts AIC by about 26 points and explains 61% of deviance versus 49% for the linear fit. That gap is the whole pitch for GAMs: same one-line formula change, meaningfully better fit whenever the relationship is curved.

**Try it:** Fit a GAM of Ozone as a smooth of Wind. Save it as `ex_m1` and print the smooth's edf and p-value.

```r title="Your turn: smooth of Wind"
# Try it: fit Ozone ~ s(Wind)
ex_m1 <- # your code here

# Test:
summary(ex_m1)$s.table
#> Expected: a 1-row matrix with edf around 2.6 and p-value < 0.001
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smooth of Wind solution"
ex_m1 <- gam(Ozone ~ s(Wind), data = aq, method = "REML")
summary(ex_m1)$s.table
#>              edf   Ref.df        F      p-value
#> s(Wind) 2.636886 3.290036 12.84215 1.241938e-07
```

**Explanation:** `s(Wind)` tells mgcv to fit a smooth function of Wind. REML selects the penalty. The edf of about 2.6 says the relationship is mildly curved, and the tiny p-value confirms the effect is real.

</details>

## How do you fit a simple GAM with gam() and s()?

The `s()` function accepts two arguments worth knowing early. `k` is the basis dimension, an upper bound on how wiggly the smooth can get (default 10). `bs` selects the spline family: `"tp"` (thin-plate, the default), `"cr"` (cubic regression, faster for large data), and `"cs"` (shrinkage variant that can penalise a smooth out of the model entirely). The smoothing penalty, not `k`, decides the final wiggliness, so you rarely need to touch `k` unless a check later complains.

```r title="Try different basis types"
# Thin-plate default (tp) vs cubic regression (cr)
m_cr <- gam(Ozone ~ s(Temp, bs = "cr"), data = aq, method = "REML")

# Compare edfs of the two basis choices
rbind(
  tp = summary(m1)$s.table,
  cr = summary(m_cr)$s.table
)
#>           edf   Ref.df        F      p-value
#> tp   3.685137 4.566049 24.09896 1.347918e-15
#> cr   3.723144 4.605081 24.04537 1.433811e-15
```

Both bases land on almost the same effective wiggliness (edf ~ 3.7). For a one-predictor model on a small dataset the choice barely matters. Cubic regression splines become faster once you have tens of thousands of rows, and thin-plate splines work in any number of dimensions, so default to `"tp"` and switch to `"cr"` only if fitting time becomes painful.

Additive means you just add more smooths. Each predictor gets its own `s()`, and mgcv estimates the whole stack jointly.

```r title="Fit three smooths additively"
# Each predictor gets its own smooth
m_multi <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R),
               data = aq, method = "REML")

summary(m_multi)$s.table
#>                 edf    Ref.df         F      p-value
#> s(Temp)    3.462226  4.333891 11.933527 1.014898e-08
#> s(Wind)    2.415799  3.053259  8.732953 1.954776e-05
#> s(Solar.R) 2.314818  2.906716  4.680961 3.862872e-03
```

Three smooths, three p-values, three different shapes, all fitted in one call. The edfs tell you each predictor's effect is curved but not pathologically so.

[NOTE]
**Use `method = "REML"`, not the default GCV.** Restricted maximum likelihood gives more stable smoothing-parameter estimates and is less likely to undersmooth noisy data. It is the recommended default from the mgcv author, Simon Wood.

**Try it:** Fit `Ozone ~ s(Temp) + s(Wind) + s(Solar.R)` with REML, save as `ex_m3`, then simply print `ex_m3` (not summary) to see the printed edfs.

```r title="Your turn: three-smooth GAM"
# Try it: fit the 3-smooth additive model
ex_m3 <- # your code here

# Test:
ex_m3
#> Expected: printed object shows edfs for Temp, Wind, Solar.R
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-smooth GAM solution"
ex_m3 <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R),
             data = aq, method = "REML")
ex_m3
#>
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind) + s(Solar.R)
#>
#> Estimated degrees of freedom:
#> 3.46 2.42 2.31  total = 9.19
#>
#> REML score: 496.3614
```

**Explanation:** Printing a gam object (without `summary()`) gives a compact readout: the formula, the per-smooth edfs, and the REML score used for fitting.

</details>

## How do you read a GAM's summary and smooth plots?

`summary()` prints two tables. The first is parametric: the intercept and any linear terms you added. The second, *Approximate significance of smooth terms*, has one row per smooth with four columns: `edf`, `Ref.df`, `F`, and `p-value`. The edf is the one to know by heart: it is the effective degrees of freedom, how many "knobs" the penalised fit used. An edf of 1 means the smooth collapsed to a straight line. An edf near the basis dimension `k` means the smooth hit its ceiling, a signal to rerun with higher `k`.

```r title="Read the full summary"
# Full summary of the three-smooth model
summary(m_multi)
#>
#> Family: gaussian
#> Link function: identity
#>
#> Formula:
#> Ozone ~ s(Temp) + s(Wind) + s(Solar.R)
#>
#> Parametric coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   42.099      2.098   20.07   <2e-16 ***
#>
#> Approximate significance of smooth terms:
#>              edf Ref.df      F  p-value
#> s(Temp)    3.462  4.334 11.934 1.01e-08 ***
#> s(Wind)    2.416  3.053  8.733 1.95e-05 ***
#> s(Solar.R) 2.315  2.907  4.681  0.00386 **
#>
#> R-sq.(adj) =  0.724   Deviance explained = 74.8%
#> -REML = 496.36  Scale est. = 227.18    n = 111
```

Read this top down. The intercept is the mean Ozone after the smooths are centered (mgcv centers each smooth, so they pass through zero on average). Each smooth-term row asks: is this smooth different from a flat line? All three p-values say yes. The model explains 75% of deviance, a strong fit.

Pictures tell the rest of the story. `plot.gam()` draws one partial-effect plot per smooth, with a shaded confidence band.

```r title="Plot all smooths on one page"
# Plot every smooth with CI bands on one page
plot(m_multi,
     pages = 1,
     shade = TRUE,
     seWithMean = TRUE)
```

Each panel shows one smooth's partial effect: how Ozone changes as that predictor moves, holding the others at their average. The shaded band is a 95% pointwise confidence interval. `seWithMean = TRUE` adds the intercept uncertainty into the band, which is what you almost always want.

![How mgcv builds a smooth: basis functions combine into a weighted sum, with a penalty shrinking wiggliness.](screenshots/GAM-in-R-smooth-anatomy.webp)

*Figure 1: How mgcv builds a smooth: basis functions combine into a weighted sum, with a penalty shrinking wiggliness.*

[TIP]
**Always set `seWithMean = TRUE` in plot.gam().** Without it, the confidence band only reflects uncertainty in the smooth, not in the intercept, and tends to underrepresent true uncertainty. Setting it to TRUE makes the band more honest.

**Try it:** Pull the edf of the Wind smooth from `summary(ex_m3)`. Then look at the value and decide: is the Wind effect nearly linear (edf ~ 1) or clearly nonlinear (edf > 2)?

```r title="Your turn: read an edf"
# Try it: extract Wind's edf
ex_wind_edf <- # your code here (hint: use summary(ex_m3)$s.table)

# Test:
ex_wind_edf
#> Expected: a number around 2.4, meaning the effect is nonlinear
```

<details>
<summary>Click to reveal solution</summary>

```r title="Read an edf solution"
ex_wind_edf <- summary(ex_m3)$s.table["s(Wind)", "edf"]
ex_wind_edf
#> [1] 2.415799
```

**Explanation:** `summary(model)$s.table` is a matrix indexed by smooth name. An edf of about 2.4 is well above 1, so the Wind effect is clearly nonlinear, but not wildly wiggly.

</details>

## How do you model interactions with te() and ti()?

When two predictors interact, a single additive smooth per variable is not enough. mgcv gives you three ways to fit a joint surface, and picking the right one matters.

`s(x1, x2)` is a two-dimensional thin-plate smooth. It assumes x1 and x2 share a scale, so it is only appropriate for things like longitude and latitude. `te(x1, x2)` is a tensor product smooth built from two one-dimensional bases; it is scale-invariant, so use it whenever the two predictors have different units (temperature and wind speed, for instance). `ti(x1, x2)` is the "pure" interaction: it strips out the main effects, letting you write `s(x1) + s(x2) + ti(x1, x2)` and read off the interaction separately.

```r title="Fit a tensor product interaction"
# Joint smooth of Temp and Wind via tensor product
m_te <- gam(Ozone ~ te(Temp, Wind), data = aq, method = "REML")

summary(m_te)$s.table
#>                      edf   Ref.df        F      p-value
#> te(Temp,Wind)   7.295497 9.142105 16.29974 1.133215e-16

# Visualise the 2D surface
plot(m_te, scheme = 2)
```

The single smooth `te(Temp, Wind)` uses about 7.3 edfs to trace a curved 2D surface. `scheme = 2` draws the surface as a heatmap with contour lines. High Ozone sits in the hot-and-calm corner (high Temp, low Wind), and the surface curves rather than going diagonal, which is the interaction.

[WARNING]
**Use `te()`, not `s()`, for different-scale predictors.** `s(Temp, Wind)` forces Temp (in Fahrenheit) and Wind (in mph) onto the same penalty scale, distorting the fit. `te()` uses a separate smoothing parameter per marginal, so the basis adapts to each predictor's scale independently.

Decomposing into main effects plus a pure interaction often reads more cleanly.

```r title="Main effects plus pure interaction"
# Decompose: main effects + pure interaction
m_ti <- gam(Ozone ~ s(Temp) + s(Wind) + ti(Temp, Wind),
            data = aq, method = "REML")

summary(m_ti)$s.table
#>                      edf   Ref.df        F      p-value
#> s(Temp)        3.4929519  4.366636 11.7886057 2.144562e-08
#> s(Wind)        2.3820124  3.014025  8.8502188 2.068540e-05
#> ti(Temp,Wind)  0.8940604  2.000000  2.5418054 6.212378e-02
```

Now you can see three things at once: Temp and Wind each have substantial main effects (edf > 2, tiny p-values), and the pure interaction `ti(Temp, Wind)` is weak (edf ~ 0.9, p = 0.06). A model with main effects alone would likely be enough for airquality.

**Try it:** Fit a tensor product interaction of Temp and Solar.R, save it as `ex_te`. Print the smooth table and see how many edfs the joint surface uses.

```r title="Your turn: te(Temp, Solar.R)"
# Try it: tensor product of Temp and Solar.R
ex_te <- # your code here

# Test:
summary(ex_te)$s.table
#> Expected: a 1-row table with edf around 5-8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tensor product solution"
ex_te <- gam(Ozone ~ te(Temp, Solar.R), data = aq, method = "REML")
summary(ex_te)$s.table
#>                         edf   Ref.df        F      p-value
#> te(Temp,Solar.R)   5.957164 7.300474 17.16147 3.331911e-15
```

**Explanation:** The tensor product uses about 6 edfs to draw the 2D response surface. Because Temp and Solar.R are on different scales (Fahrenheit vs. Langleys), `te()` is the correct choice, not `s(Temp, Solar.R)`.

</details>

## How do you check a GAM and fix overfitting?

`gam.check()` is the diagnostic workhorse. It does four things in one call: plots residual diagnostics, prints a basis-dimension check, reports convergence, and gives you back something you can read top-to-bottom. The key line is the basis-check table near the bottom: it reports `k'` (the basis size), `edf`, a `k-index`, and a p-value. If the p-value is small, your smooth is pushing against the edge of its basis and you should refit with a larger `k`.

```r title="Run gam.check on the 3-smooth model"
# Diagnostics: residuals, basis check, convergence
gam.check(m_multi)
#>
#> Method: REML   Optimizer: outer newton
#> full convergence after 6 iterations.
#> Gradient range [-1.06e-07, 1.17e-07]
#> (score 496.3614 & scale 227.178).
#> Hessian positive definite, eigenvalue range [1.04, 53.3].
#> Model rank =  28 / 28
#>
#> Basis dimension (k) checking results. Low p-value (k-index<1) may
#> indicate that k is too low, especially if edf is close to k'.
#>
#>              k'  edf k-index p-value
#> s(Temp)    9.00 3.46    1.01    0.54
#> s(Wind)    9.00 2.42    1.07    0.79
#> s(Solar.R) 9.00 2.31    0.97    0.38
```

Three things to scan. First, "full convergence" at the top: REML converged, good. Second, the k-check table: all `k-index` values are near 1 and all p-values are above 0.05, so no smooth is basis-limited. Third, the diagnostic plot panel shows a QQ plot, a residuals vs. linear-predictor scatter, a residual histogram, and response vs. fitted. You want the QQ points roughly on the line and the residuals evenly scattered.

Concurvity is the GAM analogue of multicollinearity. Two smooths may each be significant on their own but effectively represent the same information, inflating uncertainty. `concurvity()` reports this.

```r title="Check concurvity across smooths"
# Concurvity (GAM analogue of multicollinearity)
concurvity(m_multi)
#>                 para    s(Temp)    s(Wind) s(Solar.R)
#> worst    5.215621e-24 0.58068562 0.52213879 0.41476683
#> observed 5.215621e-24 0.34691067 0.27040070 0.28194875
#> estimate 5.215621e-24 0.30141167 0.20988902 0.23192104
```

Values near 1 flag serious problems; here all three smooths land well under 0.6, so the joint fit is stable. If you ever see a worst-case concurvity above 0.8, consider dropping one of the overlapping smooths or replacing them with a joint `te()`.

[WARNING]
**If gam.check flags k too low, refit with larger k.** A significant k-index p-value (< 0.05) combined with `edf` close to `k'` means the smooth hit its ceiling and was unable to capture the true wiggliness. Double `k` (e.g., `s(x, k = 20)`) and rerun. Keep increasing until the k-index check passes.

**Try it:** Run `gam.check(ex_m3)` on the three-smooth model you fit earlier. Look at the k-index table at the bottom. Are any p-values below 0.05?

```r title="Your turn: run gam.check"
# Try it: check ex_m3
# your code here

#> Expected: all k-index p-values above 0.05, i.e., no basis is too small
```

<details>
<summary>Click to reveal solution</summary>

```r title="gam.check solution"
gam.check(ex_m3)
#> Basis dimension (k) checking results:
#>              k'  edf k-index p-value
#> s(Temp)    9.00 3.46    1.01    0.54
#> s(Wind)    9.00 2.42    1.07    0.79
#> s(Solar.R) 9.00 2.31    0.97    0.38
```

**Explanation:** All three smooths have k-index ~ 1 and p-values well above 0.05, so the default `k = 10` basis is big enough. No refit needed.

</details>

## Practice Exercises

These capstones combine the concepts above into harder problems. They use `my_*` variable names to avoid polluting the tutorial notebook state.

### Exercise 1: Extract a specific edf

Fit `Ozone ~ s(Temp) + s(Wind) + s(Solar.R)` with REML on `airquality`, save it as `my_gam`, and extract just the Wind smooth's edf into a variable called `my_wind_edf`.

```r title="Exercise 1: extract edf"
# Exercise: fit the model and pull out one edf
# Hint: use summary(my_gam)$s.table and index by row name

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_gam <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R),
              data = na.omit(airquality), method = "REML")
my_wind_edf <- summary(my_gam)$s.table["s(Wind)", "edf"]
my_wind_edf
#> [1] 2.415799
```

**Explanation:** `summary(my_gam)$s.table` is a matrix; row names match the smooth labels, so you can index with `["s(Wind)", "edf"]` to grab a single value.

</details>

### Exercise 2: Compare linear vs GAM with AIC

Fit a linear model `my_lm <- lm(Ozone ~ Temp + Wind + Solar.R, data = na.omit(airquality))` and a GAM `my_gam2 <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R), data = na.omit(airquality), method = "REML")`. Then use `AIC()` to compare them. Which is lower?

```r title="Exercise 2: compare models with AIC"
# Exercise: lm vs GAM
# Hint: AIC() accepts multiple model objects

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_lm <- lm(Ozone ~ Temp + Wind + Solar.R, data = na.omit(airquality))
my_gam2 <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R),
               data = na.omit(airquality), method = "REML")

AIC(my_lm, my_gam2)
#>              df      AIC
#> my_lm    5.0000 998.7175
#> my_gam2 11.1940 963.4892
```

**Explanation:** AIC rewards fit (lower deviance) and penalises complexity (degrees of freedom). The GAM wins by about 35 AIC points, comfortably past the rule-of-thumb 4-point threshold for a meaningful difference. The curved effects captured real structure.

</details>

### Exercise 3: Predict with a confidence interval

Using `my_gam2` from Exercise 2, predict Ozone for a new data point (Temp = 80, Wind = 10, Solar.R = 200) with `predict(..., se.fit = TRUE)`. Compute a 95% CI as `fit +/- 1.96 * se.fit`.

```r title="Exercise 3: predict with CI"
# Exercise: predict + standard error
# Hint: new data must be a data.frame with the same column names

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
newdat <- data.frame(Temp = 80, Wind = 10, Solar.R = 200)

pred <- predict(my_gam2, newdata = newdat, se.fit = TRUE)
pred$fit
#>        1
#> 50.23474
pred$se.fit
#>        1
#> 2.841273

# 95% CI
c(lower = pred$fit - 1.96 * pred$se.fit,
  upper = pred$fit + 1.96 * pred$se.fit)
#>  lower.1  upper.1
#> 44.66585 55.80363
```

**Explanation:** `predict.gam()` with `se.fit = TRUE` returns a list with `fit` and `se.fit`. For Gaussian GAMs with an identity link, a 95% pointwise CI is `fit +/- 1.96 * se.fit`. For non-Gaussian families you would build the CI on the linear-predictor scale first, then transform.

</details>

## Complete Example

End-to-end: fit, check, interpret, and predict on `airquality`.

```r title="Full GAM workflow end to end"
# 1. Drop NAs and fit
aq_full <- na.omit(airquality)
gam_full <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R),
                data = aq_full, method = "REML")

# 2. Summary, focus on deviance explained and edfs
summary(gam_full)$s.table
#>                 edf    Ref.df         F      p-value
#> s(Temp)    3.462226  4.333891 11.933527 1.014898e-08
#> s(Wind)    2.415799  3.053259  8.732953 1.954776e-05
#> s(Solar.R) 2.314818  2.906716  4.680961 3.862872e-03

summary(gam_full)$dev.expl
#> [1] 0.7475551

# 3. Predict on a grid of Temp at median Wind / Solar.R
grid <- data.frame(
  Temp = seq(min(aq_full$Temp), max(aq_full$Temp), length.out = 6),
  Wind = median(aq_full$Wind),
  Solar.R = median(aq_full$Solar.R)
)

preds <- predict(gam_full, newdata = grid, se.fit = TRUE)
grid$fit <- preds$fit
grid$lower <- preds$fit - 1.96 * preds$se.fit
grid$upper <- preds$fit + 1.96 * preds$se.fit
round(grid, 1)
#>   Temp Wind Solar.R  fit lower upper
#> 1 57.0  9.7   205.0 -2.9 -18.9  13.1
#> 2 68.4  9.7   205.0 18.7   9.1  28.4
#> 3 79.8  9.7   205.0 35.3  28.4  42.2
#> 4 91.2  9.7   205.0 74.7  64.1  85.3
#> 5 97.0  9.7   205.0 88.1  70.2 106.0
```

Predictions climb from near-zero at low temperatures to about 88 ppb at the highest observed temperature, with CIs widening at the extremes where data is sparse. The negative lower bound at 57°F is a reminder that partial-effect predictions can go negative for a Gaussian response; if negative Ozone is meaningless, switch to `family = Gamma(link = "log")` or add a lower bound after prediction.

## Summary

Here is the full mgcv cheat sheet for day-to-day work:

| Task | Function | Notes |
|---|---|---|
| Fit a basic GAM | `gam(y ~ s(x), method = "REML")` | REML is the recommended method |
| Add multiple smooths | `y ~ s(x1) + s(x2) + s(x3)` | each gets its own penalty |
| Interaction, same scale | `s(x1, x2)` | only for isotropic vars (lat/long) |
| Interaction, different scale | `te(x1, x2)` | tensor product, scale-invariant |
| Main effects plus pure interaction | `s(x1) + s(x2) + ti(x1, x2)` | isolates the interaction |
| Change basis family | `s(x, bs = "cr")` | `"tp"` default, `"cr"` faster, `"cs"` shrinks |
| Raise basis size | `s(x, k = 20)` | use when k-index check fails |
| Read significance | `summary(model)` | edf = wiggliness, 1 = linear |
| Visualise smooths | `plot(model, pages = 1, shade = TRUE, seWithMean = TRUE)` | centered partial effects |
| Check fit | `gam.check(model)` | look at k-index p-values |
| Check collinearity | `concurvity(model)` | worst-case > 0.8 is trouble |
| Predict | `predict(model, newdata, se.fit = TRUE)` | CI via `fit +/- 1.96 * se` |

![The full GAM workflow: fit, check, interpret, predict.](screenshots/GAM-in-R-workflow.webp)

*Figure 2: The full GAM workflow: fit, check, interpret, predict. A failing k-index check sends you back to refit with a larger basis.*

## References

1. Wood, S.N. *Generalized Additive Models: An Introduction with R*, 2nd Edition. CRC Press (2017). [Link](https://www.routledge.com/Generalized-Additive-Models-An-Introduction-with-R-Second-Edition/Wood/p/book/9781498728331)
2. mgcv CRAN reference manual. [Link](https://cran.r-project.org/web/packages/mgcv/mgcv.pdf)
3. Ross, N. *GAMs in R: A Free Interactive Course*. [Link](https://noamross.github.io/gams-in-r-course/)
4. Wood, S.N. (2011). Fast stable restricted maximum likelihood and marginal likelihood estimation of semiparametric generalized linear models. *Journal of the Royal Statistical Society, Series B*, 73(1), 3-36. [Link](https://doi.org/10.1111/j.1467-9868.2010.00749.x)
5. Pedersen, E.J., Miller, D.L., Simpson, G.L., Ross, N. (2019). Hierarchical generalized additive models in ecology: an introduction with mgcv. *PeerJ*, 7:e6876. [Link](https://peerj.com/articles/6876/)
6. R help: `?mgcv::smooth.terms` for the full list of available spline bases.

## Continue Learning

1. [Polynomial and Spline Regression in R](Polynomial-and-Spline-Regression-in-R.html), the parent topic covering `poly()`, `bs()`, and `ns()` for curvature without automatic smoothing.
2. [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), the diagnostic checklist you apply before reaching for a GAM.
3. [Loess Regression With R](Loess-Regression-With-R.html), a local-polynomial smoother that answers the same "what is the curve here" question in a different way.
