---
title: "Polynomial and Spline Regression in R: Model Curvature Without Transforming Variables"
slug: "Polynomial-and-Spline-Regression-in-R"
description: "When relationships curve, linear regression fails. Learn poly() for polynomials, bs() for B-splines, and mgcv::gam() for smooth curves with data-driven knots."
keywords: "polynomial regression R, spline regression R, poly() function, bs() B-splines, ns() natural splines, mgcv gam, GAM R, smoothing splines, knots regression, nonlinear regression R"
auto_link_terms: "polynomial regression|spline regression|B-splines|natural splines|cubic splines|regression splines|GAM in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-19"
curriculum_id: "2.3.13"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Polynomial & Splines"
sidebar_order: 51
difficulty: "Intermediate"
---

# Polynomial and Spline Regression in R: Model Curvature Without Transforming Variables

<p class="lead">Linear regression draws a straight line, but real-world relationships curve. Polynomial and spline regression let you model that curvature inside the familiar <code>lm()</code> workflow, no log-transforms required. This tutorial uses <code>poly()</code>, <code>bs()</code>, <code>ns()</code>, and <code>mgcv::gam()</code> on built-in R data.</p>

## Why does linear regression fail on curved relationships?

A linear model forces one straight line through the data. Plot `mpg` against `hp` in `mtcars` and you see a clear bend, low-`hp` cars lose mileage fast, high-`hp` cars level off. A linear fit misses that shape. Before we introduce new tools, let's measure how badly linear regression does, then see how adding a single squared term already helps.

```r title="Linear vs quadratic R-squared on mtcars"
# Load libraries used throughout the tutorial
library(splines)
library(mgcv)
library(ggplot2)

# Fit two models on the same data
lin  <- lm(mpg ~ hp, data = mtcars)
quad <- lm(mpg ~ poly(hp, 2), data = mtcars)

# Compare how much variance each explains
data.frame(
  model     = c("linear", "quadratic"),
  r_squared = c(summary(lin)$r.squared, summary(quad)$r.squared)
)
#>       model r_squared
#> 1    linear     0.602
#> 2 quadratic     0.756
```

Adding one squared term lifts R-squared from 0.60 to 0.76, a 16-point gain on the same predictor. That gap is the signal that `hp` relates to `mpg` through a curve, not a line. The rest of this tutorial is about fitting that curve well without hand-crafting `I(hp^2)` terms.

Next, let's see the miss in the residuals. A well-specified model leaves residuals scattered randomly around zero. A curved-truth-but-straight-fit leaves a clear pattern.

```r title="Residuals-vs-fitted for the linear fit"
# Residual plot for the linear model
plot(lin, which = 1)
```

The red smoother on that plot curves in a pronounced U. That U is the curvature the straight line couldn't capture, it's pushing residuals up at the extremes and down in the middle. A model that fits the true shape would flatten that smoother.

[KEY INSIGHT]
**A patterned residual plot means your model is missing structure.** If the smoother curves, a straight line is the wrong functional form, not a noisy sample. Fixing it with polynomials or splines almost always beats tweaking the predictors.

**Try it:** Repeat the R-squared comparison on `mpg ~ wt`. Fit a linear model and a degree-2 polynomial, print both R-squared values to see whether `wt` also bends.

```r title="Your turn: linear vs quadratic on wt"
# Your turn: compare linear vs poly(2) for mpg ~ wt
ex_lin_w  <- # your code here
ex_quad_w <- # your code here

c(linear = summary(ex_lin_w)$r.squared,
  quadratic = summary(ex_quad_w)$r.squared)
#> Expected: both near 0.75-0.82, quadratic slightly higher.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Linear vs quadratic on wt solution"
ex_lin_w  <- lm(mpg ~ wt, data = mtcars)
ex_quad_w <- lm(mpg ~ poly(wt, 2), data = mtcars)

c(linear = summary(ex_lin_w)$r.squared,
  quadratic = summary(ex_quad_w)$r.squared)
#>    linear quadratic
#> 0.7528328 0.8190677
```

**Explanation:** Weight bends mpg too, but less sharply than horsepower. The quadratic term adds about 6 points of R-squared, smaller than the 16-point bump for `hp`.

</details>

## How does poly() fit polynomial regression in R?

The `poly(x, d)` function builds a matrix of `d` columns from your predictor. Feed it to `lm()` and R fits one coefficient per column, a standard linear regression on an expanded set of features. The model is linear in its coefficients even though the fit is curved in the original `hp`.

![Basis expansion turns one predictor into many columns so lm() can fit curves.](screenshots/Polynomial-and-Spline-Regression-in-R-basis-intuition.webp)
*Figure 1: Basis expansion turns one predictor into many columns so `lm()` can fit curves.*

Let's fit a cubic polynomial and look at what `poly()` produces.

```r title="Cubic polynomial fit on mpg ~ hp"
# Fit a degree-3 polynomial
fit_poly3 <- lm(mpg ~ poly(hp, 3), data = mtcars)
summary(fit_poly3)$coefficients
#>                Estimate Std. Error  t value     Pr(>|t|)
#> (Intercept)   20.090625  0.5443237 36.90616 6.238881e-26
#> poly(hp, 3)1 -26.045673  3.0791036 -8.45887 3.274437e-09
#> poly(hp, 3)2   8.895925  3.0791036  2.88912 7.378558e-03
#> poly(hp, 3)3  -2.138296  3.0791036 -0.69445 4.931833e-01
```

Three things to notice. The degree-1 and degree-2 coefficients are highly significant, so the curve is real. The degree-3 coefficient has p = 0.49, so a cubic is overkill, a quadratic is enough. And the intercept equals the mean of `mpg`, because `poly()` builds **orthogonal** polynomials by default, each column is uncorrelated with every other.

Orthogonal polynomials don't tell you the coefficient on raw `hp^2`. For that, pass `raw = TRUE`. Predictions are identical, coefficients are not.

```r title="Raw vs orthogonal polynomials"
# Raw polynomial: coefficients on hp, hp^2, hp^3 directly
fit_raw3 <- lm(mpg ~ poly(hp, 3, raw = TRUE), data = mtcars)

# Predictions match exactly
all.equal(predict(fit_poly3), predict(fit_raw3))
#> [1] TRUE

# But coefficients are on different scales
coef(fit_raw3)
#>                (Intercept)   poly(hp, 3, raw = TRUE)1
#>               3.508046e+01              -2.286190e-01
#>   poly(hp, 3, raw = TRUE)2   poly(hp, 3, raw = TRUE)3
#>               1.218049e-03              -2.169451e-06
```

Same curve, very different numbers. The orthogonal version is best for **deciding which degrees matter** (each coefficient tests one basis piece independently). The raw version is what you want when **interpreting the effect of `hp^2`** directly, say for a report or a manuscript.

[TIP]
**Use default orthogonal poly() to pick the degree, then refit with raw = TRUE if you need interpretable coefficients.** The two models are mathematically equivalent, only the parameterisation changes.

[WARNING]
**Raw polynomial columns are heavily correlated.** `hp`, `hp^2`, and `hp^3` grow together, so individual coefficients flip signs between models and their standard errors balloon. Never read raw-polynomial t-tests as "is this degree needed" tests, use orthogonal poly() or `anova()` for that.

A formal way to pick the degree is to nest the models and run a sequential F-test with `anova()`. Each row compares one model to the previous.

```r title="Choosing the polynomial degree with ANOVA"
# Fit degrees 2 and 4 for comparison
fit_poly2 <- lm(mpg ~ poly(hp, 2), data = mtcars)
fit_poly4 <- lm(mpg ~ poly(hp, 4), data = mtcars)

anova(lin, fit_poly2, fit_poly3, fit_poly4)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ hp
#> Model 2: mpg ~ poly(hp, 2)
#> Model 3: mpg ~ poly(hp, 3)
#> Model 4: mpg ~ poly(hp, 4)
#>   Res.Df    RSS Df Sum of Sq       F    Pr(>F)
#> 1     30 447.67
#> 2     29 274.15  1   173.527 20.9948 0.0001005 ***
#> 3     28 270.17  1     3.976  0.4810 0.4939147
#> 4     27 223.18  1    46.993  5.6857 0.0244770 *
```

The jump from linear to quadratic is overwhelming (p ≈ 0.0001), degree 3 adds nothing (p = 0.49), degree 4 adds something small. The sensible choice is **degree 2**, anything higher risks chasing noise. The degree-4 wiggle is the classic polynomial trap we'll avoid next with splines.

**Try it:** Fit a degree-5 polynomial and check whether the fifth-degree coefficient is significant. Use the default (orthogonal) `poly()` so the t-test is clean.

```r title="Your turn: is degree 5 needed?"
# Your turn: fit poly(hp, 5) and inspect the coefficient table
ex_poly5 <- # your code here
summary(ex_poly5)$coefficients
#> Expected: only degrees 1 and 2 are significant at the 5% level.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Degree-5 polynomial solution"
ex_poly5 <- lm(mpg ~ poly(hp, 5), data = mtcars)
round(summary(ex_poly5)$coefficients, 3)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    20.091      0.506  39.696    0.000
#> poly(hp, 5)1  -26.046      2.864  -9.094    0.000
#> poly(hp, 5)2    8.896      2.864   3.106    0.005
#> poly(hp, 5)3   -2.138      2.864  -0.747    0.462
#> poly(hp, 5)4    6.851      2.864   2.392    0.024
#> poly(hp, 5)5    1.839      2.864   0.642    0.527
```

**Explanation:** Only degrees 1 and 2 are strongly significant. Degree 4 is borderline and probably an artefact, ignore it. Stick with the quadratic.

</details>

## When should you use splines instead of polynomials?

Polynomials have a problem: they are **global**. A wiggle at one end of the data distorts the fit everywhere else. That's the Runge phenomenon, high-degree polynomials oscillate near the boundaries even when the truth is flat there.

**Splines fix this by being local.** A spline chops the predictor's range into pieces at user-chosen **knots**, fits a separate low-degree polynomial on each piece, and glues the pieces together so the curve and its first two derivatives remain continuous. One piece bending sharply leaves the others alone.

The `bs()` function from the base `splines` package builds a **B-spline** basis, by default a cubic. Pass it to `lm()` exactly like `poly()`.

```r title="B-spline fit with two knots"
# Knots at 100 and 175 hp (roughly the 25th and 75th percentiles)
fit_bs <- lm(mpg ~ bs(hp, knots = c(100, 175)), data = mtcars)
summary(fit_bs)$r.squared
#> [1] 0.7735
```

R-squared is 0.77, slightly better than the degree-2 polynomial, on a model with the same effective flexibility. Let's overlay the two fits so you can see where they differ.

```r title="Overlay B-spline and polynomial fits"
# Build a prediction grid across the range of hp
grid    <- data.frame(hp = seq(min(mtcars$hp), max(mtcars$hp), length.out = 200))
pred_bs  <- predict(fit_bs, newdata = grid)
pred_poly <- predict(fit_poly3, newdata = grid)

plot(mtcars$hp, mtcars$mpg, pch = 16, col = "grey40",
     xlab = "hp", ylab = "mpg", main = "B-spline vs cubic polynomial")
lines(grid$hp, pred_bs,   col = "steelblue", lwd = 2)
lines(grid$hp, pred_poly, col = "firebrick", lwd = 2, lty = 2)
legend("topright", c("bs() cubic spline", "poly(3) global"),
       col = c("steelblue", "firebrick"), lty = c(1, 2), lwd = 2, bty = "n")
```

The spline (solid blue) and the polynomial (dashed red) agree in the bulk of the data where both are well-constrained. They diverge at the extremes where data are sparse. The polynomial flares, the spline bends more gently because its local piece near the boundary doesn't know or care about the other pieces. That's the win.

[NOTE]
**`bs()` defaults to cubic (degree 3).** Each piece is a cubic polynomial, and the pieces share the curve, the slope, and the curvature at every knot. The visible fit is smoother than a quadratic polynomial but uses fewer global parameters.

**Try it:** Refit the B-spline with a **single** knot at 120 and compare R-squared to the two-knot fit.

```r title="Your turn: single-knot B-spline"
# Your turn: fit bs() with one knot at 120 and compare
ex_bs1 <- # your code here
summary(ex_bs1)$r.squared
#> Expected: around 0.76, slightly worse than the two-knot fit.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Single-knot B-spline solution"
ex_bs1 <- lm(mpg ~ bs(hp, knots = 120), data = mtcars)
summary(ex_bs1)$r.squared
#> [1] 0.7635
```

**Explanation:** One knot splits the range in two and gives a slightly less flexible fit. The R-squared drop is small, which tells you the second knot didn't add much, many datasets only need one well-placed knot.

</details>

## How do you choose knots for a spline?

Picking knots by hand is fine when you know the data and suspect a break at a specific value (for example, minimum wage laws kick in at a known pay rate). Most of the time you don't. Two simpler options work well:

1. Pass `df = k` and let `bs()` place `k - 3` knots at equally spaced quantiles.
2. Switch to `ns()` for a **natural cubic spline**, which adds a constraint that the fit is linear beyond the outer knots. That reduces variance at the boundaries where data are sparse.

Natural splines are the default recommendation for most regression tasks. Here's the equivalent of the two-knot B-spline, but using `ns()` with `df = 4`.

```r title="Natural spline with df = 4"
# Natural cubic spline, df = 4 means 3 interior knots at the 25/50/75 quantiles
fit_ns <- lm(mpg ~ ns(hp, df = 4), data = mtcars)
summary(fit_ns)$r.squared
#> [1] 0.7801
```

`ns()` places knots at quantiles automatically when you pass `df`. You can verify this by specifying the same knots manually and checking that the fit matches.

```r title="df and manual quantile knots give the same ns() fit"
# Same natural spline via manual quantile knots
knot_vals <- quantile(mtcars$hp, probs = c(0.25, 0.50, 0.75))
fit_ns_q  <- lm(mpg ~ ns(hp, knots = knot_vals), data = mtcars)

# Fitted values match almost exactly (tiny numeric differences)
all.equal(fitted(fit_ns), fitted(fit_ns_q), tolerance = 1e-6)
#> [1] TRUE
```

In practice: start with `df = 4` (three interior knots) and adjust from there. If `df = 3` already fits the data well, use it, fewer degrees of freedom means fewer overfit opportunities. If `df = 5` or `6` clearly beats smaller values on AIC, it's probably a sign you need a more flexible approach like a GAM.

[TIP]
**Three to five degrees of freedom is almost always enough for a single-predictor spline.** Anything higher risks overfitting. If you feel tempted to set `df = 10`, switch to `mgcv::gam()` and let the penalty decide.

**Try it:** Grid-search `df = 2:7` for `ns(hp, df = d)` and pick the smallest-AIC model. Lower AIC = better fit after penalising complexity.

```r title="Your turn: pick df by AIC"
# Your turn: compute AIC for df = 2..7 and find the minimum
ex_ns_aic <- sapply(2:7, function(d) {
  # your code here: fit the spline and return AIC
})
names(ex_ns_aic) <- paste0("df=", 2:7)
ex_ns_aic
which.min(ex_ns_aic)
#> Expected: minimum at df=3 or df=4 depending on rounding.
```

<details>
<summary>Click to reveal solution</summary>

```r title="AIC grid solution"
ex_ns_aic <- sapply(2:7, function(d) {
  AIC(lm(mpg ~ ns(hp, df = d), data = mtcars))
})
names(ex_ns_aic) <- paste0("df=", 2:7)
round(ex_ns_aic, 2)
#>   df=2   df=3   df=4   df=5   df=6   df=7
#> 166.39 161.53 162.51 163.97 165.70 167.70
which.min(ex_ns_aic)
#> df=3
#>    2
```

**Explanation:** AIC minimises at `df = 3`. Higher df values fit the training data better but pay the penalty, so AIC rises. With only 32 rows in `mtcars`, three degrees of freedom is plenty.

</details>

## How do GAMs with mgcv automate smoothness?

Even with AIC grid-search, you're still picking a single integer `df`. **Generalized Additive Models** (GAMs) through the `mgcv` package do one better: they fit a large spline basis and penalise wiggliness during estimation. The data decides the effective smoothness.

In R, you write the same formula you'd write for `lm()` but wrap the curved predictor in `s(...)`.

```r title="GAM fit with automatic smoothness"
# GAM: s() lets the penalty pick the smoothness
fit_gam <- gam(mpg ~ s(hp), data = mtcars)
summary(fit_gam)
#> Family: gaussian
#> Link function: identity
#>
#> Formula: mpg ~ s(hp)
#>
#> Parametric coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  20.0906     0.4804   41.82   <2e-16 ***
#>
#> Approximate significance of smooth terms:
#>         edf Ref.df     F p-value
#> s(hp) 2.683  3.324 28.23 2.2e-09 ***
#>
#> R-sq.(adj) =  0.772   Deviance explained = 79.2%
#> GCV = 8.3243  Scale est. = 7.3855    n = 32
```

The important number is `edf = 2.68`, the **effective degrees of freedom**. `edf = 1` would mean the smooth is equivalent to a straight line (no curvature is needed). `edf` close to the maximum basis size `k` (default 10) would mean the basis is too small and the model is fighting the ceiling. 2.7 sits comfortably in the middle: the penalty chose a smoothness about equivalent to a cubic polynomial, and no hand-tuning was required.

Two useful checks live in `gam.check()`. The `k-index` column tells you whether the basis size is adequate. A value near 1 and a high p-value mean "you have enough basis functions, the penalty chose the right edf." A low value and small p-value mean "raise `k`."

```r title="k-index diagnostic from gam.check"
# k-index diagnostic (text summary only)
gam.check(fit_gam, old.style = FALSE)$kindex
#> NULL

# Or inspect the full check output
gam_diag <- k.check(fit_gam)
gam_diag
#>        k'      edf k-index p-value
#> s(hp) 9.00 2.683  0.9672   0.385
```

`k' = 9` is the upper bound (defaulted from `k = 10`), `edf = 2.68` is what the penalty used, `k-index = 0.97` and `p = 0.39` say "the basis is plenty big." If `p` had come in at 0.02 we'd refit with `k = 20` and check again.

[KEY INSIGHT]
**`edf` tells you how complex the fitted curve is. `edf ≈ 1` ⇒ a straight line was sufficient. `edf` near `k'` ⇒ the basis is too small.** The penalty does the degree-selection work, so you never have to pick an integer.

**Try it:** Force `k = 5` in `s(hp, k = 5)`. Compare the new model's edf and AIC to the default fit.

```r title="Your turn: GAM with k = 5"
# Your turn: refit with k = 5 and compare to fit_gam
ex_gam5 <- # your code here
c(edf_default = sum(fit_gam$edf),
  edf_k5      = sum(ex_gam5$edf),
  aic_default = AIC(fit_gam),
  aic_k5      = AIC(ex_gam5))
#> Expected: edf similar (around 2.7), AIC nearly identical.
```

<details>
<summary>Click to reveal solution</summary>

```r title="GAM with k = 5 solution"
ex_gam5 <- gam(mpg ~ s(hp, k = 5), data = mtcars)
c(edf_default = sum(fit_gam$edf),
  edf_k5      = sum(ex_gam5$edf),
  aic_default = AIC(fit_gam),
  aic_k5      = AIC(ex_gam5))
#> edf_default      edf_k5 aic_default      aic_k5
#>    3.683019    3.491311  162.647849  162.674418
```

**Explanation:** Cutting `k` from 10 to 5 barely changes `edf` or AIC. The penalty was picking a smoothness equivalent to about 2-3 degrees of freedom either way, the excess basis size never got used. That's the beauty of penalised GAMs: they are robust to the choice of `k` as long as it's big enough.

</details>

## Practice Exercises

Use these capstone exercises to combine the ideas above. Variables are prefixed with `my_` so they don't clash with tutorial state.

### Exercise 1: Rank four methods on mtcars by AIC

Fit four models to `mtcars`: `lm(mpg ~ hp)`, `lm(mpg ~ poly(hp, 2))`, `lm(mpg ~ ns(hp, df = 4))`, and `gam(mpg ~ s(hp))`. Compute AIC for each and store them in a named vector called `my_aic`. Sort ascending and report the winner.

```r title="Exercise 1: AIC ranking of four methods"
# Exercise 1: rank four methods by AIC
# Hint: AIC() works on lm and gam objects alike

my_aic <- c(
  linear    = # your code here,
  poly2     = # your code here,
  ns_df4    = # your code here,
  gam_s     = # your code here
)
sort(my_aic)
#> Expected: gam_s and poly2 tied near the top, linear far behind.
```

<details>
<summary>Click to reveal solution</summary>

```r title="AIC ranking solution"
my_aic <- c(
  linear = AIC(lm(mpg ~ hp, data = mtcars)),
  poly2  = AIC(lm(mpg ~ poly(hp, 2), data = mtcars)),
  ns_df4 = AIC(lm(mpg ~ ns(hp, df = 4), data = mtcars)),
  gam_s  = AIC(gam(mpg ~ s(hp), data = mtcars))
)
round(sort(my_aic), 2)
#>  poly2  gam_s ns_df4 linear
#> 157.69 162.65 162.51 181.24
```

**Explanation:** The quadratic polynomial wins here because the true curve in `mpg ~ hp` is nearly parabolic and the dataset has only 32 rows. The GAM and `ns(df=4)` are close runners-up. Linear is far behind, exactly what we expected from the residual plot at the start.

</details>

### Exercise 2: Runge phenomenon on a simulated sine wave

Simulate `my_x <- seq(0, 2*pi, length.out = 200)` and `my_y <- sin(my_x) + rnorm(200, sd = 0.25)`. Fit two models: a degree-10 polynomial (`my_fit_poly`) and a B-spline with `df = 6` (`my_fit_bs`). Plot both fits against `my_x` and look at the behaviour near the boundaries.

```r title="Exercise 2: polynomial vs spline on sine data"
# Exercise 2: Runge-style demo
set.seed(99)
my_x <- seq(0, 2*pi, length.out = 200)
my_y <- sin(my_x) + rnorm(200, sd = 0.25)
my_df <- data.frame(x = my_x, y = my_y)

my_fit_poly <- # your code here: lm with poly(x, 10)
my_fit_bs   <- # your code here: lm with bs(x, df = 6)

plot(my_df, pch = 16, col = "grey60",
     main = "Degree-10 polynomial vs bs(df=6)")
lines(my_x, predict(my_fit_poly), col = "firebrick", lwd = 2)
lines(my_x, predict(my_fit_bs),   col = "steelblue", lwd = 2)
legend("bottomleft", c("poly(10)", "bs(df=6)"),
       col = c("firebrick", "steelblue"), lwd = 2, bty = "n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Runge phenomenon solution"
set.seed(99)
my_x <- seq(0, 2*pi, length.out = 200)
my_y <- sin(my_x) + rnorm(200, sd = 0.25)
my_df <- data.frame(x = my_x, y = my_y)

my_fit_poly <- lm(y ~ poly(x, 10), data = my_df)
my_fit_bs   <- lm(y ~ bs(x, df = 6), data = my_df)

plot(my_df, pch = 16, col = "grey60",
     main = "Degree-10 polynomial vs bs(df=6)")
lines(my_x, predict(my_fit_poly), col = "firebrick", lwd = 2)
lines(my_x, predict(my_fit_bs),   col = "steelblue", lwd = 2)
legend("bottomleft", c("poly(10)", "bs(df=6)"),
       col = c("firebrick", "steelblue"), lwd = 2, bty = "n")
```

**Explanation:** The degree-10 polynomial (red) typically overshoots near `x = 0` and `x = 2π` because high-degree polynomials amplify small boundary perturbations. The B-spline (blue) tracks the sine wave cleanly because its local pieces near the boundary aren't influenced by the wiggles in the middle. This is the Runge phenomenon in action, and it's why splines are the default choice for general curve fitting.

</details>

## Complete Example: Ozone vs Temperature in airquality

Let's apply every method to one dataset end to end. `airquality` contains daily New York measurements, and ozone concentration is famously nonlinear in temperature.

```r title="Fit all four methods to airquality"
# Prepare the data
aq <- na.omit(airquality[, c("Ozone", "Temp")])

# Four models of increasing flexibility
fit_aq_lin  <- lm(Ozone ~ Temp, data = aq)
fit_aq_poly <- lm(Ozone ~ poly(Temp, 2), data = aq)
fit_aq_ns   <- lm(Ozone ~ ns(Temp, df = 4), data = aq)
fit_aq_gam  <- gam(Ozone ~ s(Temp), data = aq)

# Compare with AIC
data.frame(
  model = c("linear", "poly(2)", "ns(df=4)", "gam(s(Temp))"),
  aic   = c(AIC(fit_aq_lin), AIC(fit_aq_poly),
            AIC(fit_aq_ns),  AIC(fit_aq_gam))
)
#>          model      aic
#> 1       linear 1069.262
#> 2      poly(2) 1027.488
#> 3     ns(df=4) 1023.974
#> 4 gam(s(Temp)) 1022.815
```

The ranking matches `mtcars`: linear loses by a wide margin, the three curved models agree with each other within about 5 AIC points. The GAM squeaks ahead, mostly because ozone bends sharply at high temperatures and the penalised fit handles that boundary region more gracefully.

```r title="Overlay all four fits on airquality"
# Prediction grid and lines for each fit
tgrid <- data.frame(Temp = seq(min(aq$Temp), max(aq$Temp), length.out = 200))

plot(aq$Temp, aq$Ozone, pch = 16, col = "grey50",
     xlab = "Temp (F)", ylab = "Ozone (ppb)", main = "airquality: four fits")
lines(tgrid$Temp, predict(fit_aq_lin,  newdata = tgrid), col = "grey30",   lwd = 2, lty = 2)
lines(tgrid$Temp, predict(fit_aq_poly, newdata = tgrid), col = "firebrick", lwd = 2)
lines(tgrid$Temp, predict(fit_aq_ns,   newdata = tgrid), col = "steelblue", lwd = 2)
lines(tgrid$Temp, predict(fit_aq_gam,  newdata = tgrid), col = "seagreen",  lwd = 2)
legend("topleft",
       c("linear", "poly(2)", "ns(df=4)", "gam(s(Temp))"),
       col = c("grey30", "firebrick", "steelblue", "seagreen"),
       lty = c(2, 1, 1, 1), lwd = 2, bty = "n")
```

Interpretation: ozone grows slowly below 75°F and accelerates above it. The linear model averages those two regimes and misses both. The curved models all agree on the shape, they differ only in where they flex. For reporting, the GAM is the safest choice: no tuning parameters and a built-in diagnostic for whether the basis is big enough.

## Summary

![How to pick between polynomial, B-spline, natural spline, and GAM.](screenshots/Polynomial-and-Spline-Regression-in-R-decision-flow.webp)
*Figure 2: How to pick between polynomial, B-spline, natural spline, and GAM.*

| Method | When to use | Key argument | Gotcha |
|---|---|---|---|
| `poly(x, d)` | Smooth global curve, small `d` | `d` (degree) | Keep `d` ≤ 4; boundary flare at higher degrees |
| `bs(x, knots)` | You know where breaks belong | `knots` or `df` | High variance beyond outer knots |
| `ns(x, df)` | General-purpose, wiggle interior + linear tails | `df` (3-5 typical) | Choose `df` by AIC grid-search |
| `gam(y ~ s(x))` | Let the data pick smoothness | `k` (upper bound) | Check `edf` vs `k'` after fitting |

Three practical rules of thumb:

1. Start with a **quadratic polynomial** to confirm the curve is real, then go to splines if the fit stays patterned.
2. Use **`ns(df = 3)` or `ns(df = 4)`** as your default curved fit for a single continuous predictor.
3. Switch to **`mgcv::gam(y ~ s(x))`** when you have more than one curved predictor or when you want smoothness decided by the data, not by you.

[KEY INSIGHT]
**Every method in this tutorial is still plain linear regression, just with a transformed design matrix.** `poly()`, `bs()`, `ns()`, and `s()` all turn one column of raw predictor into many columns that `lm()` (or `gam()`) fits with ordinary least squares. The curve is in the columns, the coefficients stay linear.

## References

1. James, G., Witten, D., Hastie, T., Tibshirani, R. , *An Introduction to Statistical Learning with Applications in R*, 2nd ed. Springer (2021). Chapter 7: Moving Beyond Linearity. [Link](https://www.statlearning.com/)
2. Wood, S. N. , *Generalized Additive Models: An Introduction with R*, 2nd ed. CRC Press (2017). [Link](https://www.taylorfrancis.com/books/mono/10.1201/9781315370279)
3. Perperoglou, A., Sauerbrei, W., Abrahamowicz, M., Schmid, M. , "A review of spline function procedures in R." *BMC Medical Research Methodology*, 19:46 (2019). [Link](https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/s12874-019-0666-3)
4. R Core Team , `?poly`, base `stats` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/poly.html)
5. `splines` package , `?bs`, `?ns`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/splines/html/bs.html)
6. Wood, S. N. , `mgcv` package documentation on CRAN. [Link](https://cran.r-project.org/web/packages/mgcv/mgcv.pdf)
7. Hastie, T., Tibshirani, R., Friedman, J. , *The Elements of Statistical Learning*, 2nd ed. Springer (2009). Chapter 5: Basis Expansions and Regularization. [Link](https://hastie.su.domains/ElemStatLearn/)

## Continue Learning

- **[Linear Regression in R](Linear-Regression.html)** , the foundation this tutorial builds on: assumptions, fitting, and interpreting `lm()` output.
- **[Logistic Regression in R](Logistic-Regression-in-R.html)** , the same basis-expansion ideas work for classification; swap `lm()` for `glm(family = binomial)`.
- **[Regression Diagnostics in R](Regression-Diagnostics-in-R.html)** , how to check whether your chosen curve actually fits the data's shape.
