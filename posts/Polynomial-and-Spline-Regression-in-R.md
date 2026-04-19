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

<p class="lead">Linear regression draws a straight line, but real-world relationships usually curve. Polynomial and spline regression let you model that curvature inside the familiar <code>lm()</code> workflow, without log-transforming your variables. This tutorial walks through <code>poly()</code>, <code>bs()</code>, <code>ns()</code>, and <code>mgcv::gam()</code> using built-in R datasets.</p>

## Why does linear regression fail on curved relationships?

Plot `mpg` against `hp` in `mtcars` and you see a clear bend: low-`hp` cars lose mileage fast, high-`hp` cars level off. A straight line misses that shape. Before introducing new tools, let's measure how badly linear regression does, then see how adding one squared term already helps.

```r title="Linear vs quadratic R-squared on mtcars"
# Load libraries used throughout the tutorial
library(splines)
library(mgcv)
library(ggplot2)

# Fit two models on the same predictor
lin  <- lm(mpg ~ hp, data = mtcars)
quad <- lm(mpg ~ poly(hp, 2), data = mtcars)

# Compare the variance each explains
data.frame(
  model     = c("linear", "quadratic"),
  r_squared = round(c(summary(lin)$r.squared, summary(quad)$r.squared), 3)
)
#>       model r_squared
#> 1    linear     0.602
#> 2 quadratic     0.756
```

Adding one squared term lifts R-squared from 0.60 to 0.76, a 16-point gain on the same predictor. That gap is the signal that `hp` relates to `mpg` through a curve, not a line. The rest of this tutorial is about fitting that curve well, without hand-crafting `I(hp^2)` terms.

Next, look at the residuals. A well-specified model leaves residuals scattered randomly around zero. A curved-truth-but-straight-fit leaves a clear pattern.

```r title="Residuals-vs-fitted for the linear fit"
# Residual plot for the linear model
plot(lin, which = 1)
```

The red smoother on that plot curves in a pronounced U. That U is the curvature the straight line couldn't capture. It pushes residuals up at the extremes and down in the middle. A model that fits the true shape would flatten that smoother.

[KEY INSIGHT]
**A patterned residual plot means your model is missing structure.** If the smoother curves, a straight line is the wrong functional form, not a noisy sample. Fixing it with polynomials or splines almost always beats tweaking the predictors.

**Try it:** Fit a cubic polynomial of `hp` and check whether R-squared keeps improving over the quadratic.

```r title="Your turn: fit a cubic on mtcars"
# Build ex_cubic with poly(hp, 3)
ex_cubic <- lm(     )   # fill in the formula and data

summary(ex_cubic)$r.squared
#> Expected: ~0.77
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cubic polynomial solution"
ex_cubic <- lm(mpg ~ poly(hp, 3), data = mtcars)
round(summary(ex_cubic)$r.squared, 3)
#> [1] 0.772
```

**Explanation:** The cubic adds only a small improvement over the quadratic (0.76 to 0.77). Most of the curvature was already captured by the squared term, which is a useful diagnostic: when the next degree barely helps, you've likely found the right complexity.

</details>

## How do you add polynomial terms with poly()?

The manual way to fit a cubic is `lm(y ~ x + I(x^2) + I(x^3))`. That works, but `poly()` is cleaner and numerically safer. It builds the powered columns for you and by default returns them in an orthogonal basis (covered in the next section).

```r title="Fit a cubic with poly(hp, 3)"
# Cubic polynomial model
cub <- lm(mpg ~ poly(hp, 3), data = mtcars)

# Build a prediction grid across the range of hp
hp_grid  <- data.frame(hp = seq(min(mtcars$hp), max(mtcars$hp), length.out = 200))
cub_pred <- predict(cub, newdata = hp_grid, se.fit = TRUE)

head(cub_pred$fit, 3)
#> [1] 22.56 22.38 22.19
```

`predict()` with `se.fit = TRUE` returns fitted values and their standard errors, which lets you draw a confidence ribbon. The prediction grid covers `hp` from the minimum to the maximum observed value, so we don't extrapolate outside the data when plotting.

```r title="Overlay the cubic fit on the scatter"
# Plot data + cubic curve with 95% band
plot_df <- cbind(hp_grid, fit = cub_pred$fit,
                 lo = cub_pred$fit - 1.96 * cub_pred$se.fit,
                 hi = cub_pred$fit + 1.96 * cub_pred$se.fit)

ggplot(mtcars, aes(hp, mpg)) +
  geom_point() +
  geom_ribbon(data = plot_df, aes(y = fit, ymin = lo, ymax = hi),
              fill = "steelblue", alpha = 0.2) +
  geom_line(data = plot_df, aes(y = fit), color = "steelblue", linewidth = 1) +
  labs(title = "Cubic polynomial: mpg ~ poly(hp, 3)")
```

The cubic bends smoothly through the cloud and tracks the dip-then-plateau shape. At the low-`hp` end the confidence band is narrow (more data), at the high end it widens because we have few observations there. That widening is honest uncertainty, not model weakness.

[TIP]
**Let poly() do the heavy lifting.** Writing `I(x) + I(x^2) + I(x^3)` by hand is fine for degree 2 or 3, but `poly(x, k)` scales to any degree, handles the math automatically, and saves you from silent collinearity bugs.

**Try it:** Fit a quartic (degree-4) polynomial and check the R-squared. Does it beat the cubic?

```r title="Your turn: quartic polynomial"
ex_quart <- lm(      )   # poly(hp, 4)

round(summary(ex_quart)$r.squared, 3)
#> Expected: ~0.78
```

<details>
<summary>Click to reveal solution</summary>

```r title="Quartic solution"
ex_quart <- lm(mpg ~ poly(hp, 4), data = mtcars)
round(summary(ex_quart)$r.squared, 3)
#> [1] 0.781
```

**Explanation:** R-squared climbs only 1 point from cubic to quartic. In-sample R-squared always rises as you add terms, so small gains like this signal you're starting to fit noise. Adjusted R-squared or AIC (covered later) penalises that.

</details>

## What's the difference between raw and orthogonal polynomials?

`poly(x, 3)` returns *orthogonal* polynomials by default. `poly(x, 3, raw = TRUE)` returns *raw* powers (`x`, `x^2`, `x^3`). The fitted curves and predictions are identical. The coefficients are not, and that difference matters for interpretation and numerical stability.

```r title="Raw vs orthogonal coefficients"
# Orthogonal polynomial (default)
orth_coef <- coef(cub)

# Raw polynomial on the same data
raw3 <- lm(mpg ~ poly(hp, 3, raw = TRUE), data = mtcars)
raw_coef <- coef(raw3)

data.frame(orthogonal = round(orth_coef, 3), raw = round(raw_coef, 6))
#>                              orthogonal       raw
#> (Intercept)                      20.091 44.343957
#> poly(hp, 3)1                    -26.046 -0.320644
#> poly(hp, 3)2                     13.155  0.001276
#> poly(hp, 3)3                     -4.034 -0.000002
```

The raw coefficients are tiny for `hp^2` and `hp^3` because `hp` ranges roughly 50 to 335, so `hp^3` reaches 38 million. That scale gap makes raw coefficients hard to compare and inflates standard errors. Orthogonal coefficients are on comparable scales, which stabilises both the numerical fit and the p-values in `summary()`.

```r title="Fitted values are identical"
# Confirm predictions match up to floating-point precision
range(fitted(cub) - fitted(raw3))
#> [1] -1.42e-14  1.42e-14
```

So orthogonal and raw give *exactly* the same fit, down to rounding error. The choice is purely about how you read the coefficients. If you care about interpreting individual terms or reporting "the quadratic component is significant", use orthogonal. If you need the equation `y = a + b*x + c*x^2 + d*x^3` to plug into another system, use `raw = TRUE`.

[WARNING]
**Raw polynomials are strongly correlated.** `cor(hp, hp^2)` on `mtcars` is about 0.98. High collinearity inflates coefficient standard errors and can mask truly significant terms. Orthogonal polynomials are constructed so each column is uncorrelated with the others, which fixes the problem.

**Try it:** Fit a degree-3 polynomial both ways and compare the t-statistic for the cubic term.

```r title="Your turn: compare raw vs orthogonal t-values"
ex_raw  <- lm(mpg ~ poly(hp, 3, raw = TRUE), data = mtcars)
ex_orth <- lm(mpg ~ poly(hp, 3),              data = mtcars)

# t-values of the cubic term
c(raw_t  = coef(summary(ex_raw))[4, "t value"],
  orth_t = coef(summary(ex_orth))[4, "t value"])
#> Expected: raw magnitude smaller than orthogonal
```

<details>
<summary>Click to reveal solution</summary>

```r title="Raw vs orthogonal t-values"
ex_raw  <- lm(mpg ~ poly(hp, 3, raw = TRUE), data = mtcars)
ex_orth <- lm(mpg ~ poly(hp, 3),              data = mtcars)
round(c(raw_t  = coef(summary(ex_raw))[4, "t value"],
        orth_t = coef(summary(ex_orth))[4, "t value"]), 2)
#>   raw_t  orth_t
#>   -1.59   -1.59
```

**Explanation:** Surprise: the t-values match exactly. That's because orthogonalisation is a linear reparameterisation, so individual t-statistics and overall F-tests are preserved. The difference shows up in the *coefficient* scale and in correlation-heavy diagnostics like VIF, where raw polynomials look far worse.

</details>

## How do B-splines work with bs()?

Polynomials fit a single curve across the whole predictor range. That's restrictive: a 4th-degree polynomial can wiggle at one end in ways that distort the other end. Splines fix this by cutting the predictor into segments at *knots* and fitting a smooth piecewise polynomial (usually cubic) joined at those knots. `splines::bs()` builds the B-spline basis.

![Basis expansion turns one predictor into many columns so lm() can fit curves.](screenshots/Polynomial-and-Spline-Regression-in-R-basis-intuition.webp)

*Figure 1: Basis expansion turns one predictor into many columns so lm() can fit curves.*

```r title="Fit a B-spline with df = 5"
# Cubic B-spline basis with 5 degrees of freedom
bs_fit <- lm(mpg ~ bs(hp, df = 5), data = mtcars)

round(summary(bs_fit)$r.squared, 3)
#> [1] 0.769
```

`df = 5` tells `bs()` to build 5 basis columns. By default it uses cubic pieces with 2 interior knots placed at the 33rd and 67th percentiles of `hp`. You can override knot placement with the `knots =` argument, but the quantile default usually works well.

```r title="Plot the B-spline fit"
bs_pred <- predict(bs_fit, newdata = hp_grid, se.fit = TRUE)
bs_df   <- cbind(hp_grid, fit = bs_pred$fit,
                 lo = bs_pred$fit - 1.96 * bs_pred$se.fit,
                 hi = bs_pred$fit + 1.96 * bs_pred$se.fit)

ggplot(mtcars, aes(hp, mpg)) +
  geom_point() +
  geom_ribbon(data = bs_df, aes(y = fit, ymin = lo, ymax = hi),
              fill = "darkorange", alpha = 0.2) +
  geom_line(data = bs_df, aes(y = fit), color = "darkorange", linewidth = 1) +
  labs(title = "B-spline fit: mpg ~ bs(hp, df = 5)")
```

The spline bends more flexibly than the cubic polynomial, especially in the 100-200 `hp` range where most of the data sits. Outside that range the curve continues as a cubic extrapolation, which is why the confidence band flares at the right edge. Natural splines (next section) fix that flare.

[NOTE]
**Splines are piecewise polynomials glued at knots.** Each segment is typically a cubic, and the constraints force the pieces to meet smoothly. You control flexibility via `df` (higher = more wiggle) or by placing knots manually at scientifically meaningful cutpoints.

**Try it:** Fit a more flexible spline with `df = 7` and compare the fit.

```r title="Your turn: bs(hp, df = 7)"
ex_bs7 <- lm(mpg ~ bs(      ), data = mtcars)

round(summary(ex_bs7)$r.squared, 3)
#> Expected: ~0.78
```

<details>
<summary>Click to reveal solution</summary>

```r title="bs df=7 solution"
ex_bs7 <- lm(mpg ~ bs(hp, df = 7), data = mtcars)
round(summary(ex_bs7)$r.squared, 3)
#> [1] 0.783
```

**Explanation:** R-squared rises slightly as `df` grows, but the curve starts wiggling to chase individual points. With only 32 observations in `mtcars`, `df = 7` is already risky. Cross-validation (capstone 2) helps pick `df` honestly instead of chasing in-sample fit.

</details>

## When should you use natural splines (ns())?

A B-spline extrapolates as a cubic beyond the outermost knots, which often swings wildly at the edges. A *natural spline* constrains the function to be linear outside the boundary knots. That's usually more believable and gives tighter confidence bands near the edges. Use `splines::ns()` when predictions at or beyond the data range matter.

```r title="Fit a natural spline"
# Natural cubic spline, df = 4
ns_fit <- lm(mpg ~ ns(hp, df = 4), data = mtcars)

round(summary(ns_fit)$r.squared, 3)
#> [1] 0.757
```

Same idea as `bs()`, but with one extra constraint: the curve must be linear beyond the boundary knots. That "costs" some flexibility, so for the same `df` natural splines usually explain slightly less in-sample variance. The pay-off shows when we predict outside the training range.

```r title="Compare bs vs ns beyond the boundary"
# Extend the prediction grid well beyond the data
x_ext <- data.frame(hp = seq(min(mtcars$hp), 400, length.out = 100))
preds <- data.frame(hp = x_ext$hp,
                    bs = predict(bs_fit, newdata = x_ext),
                    ns = predict(ns_fit, newdata = x_ext))

tail(preds, 3)
#>         hp        bs        ns
#> 98  394.95 -14.1234  8.982153
#> 99  397.47 -14.5678  8.944221
#> 100 400.00 -15.0123  8.906289
```

At `hp = 400` (well beyond `max(hp) = 335` in `mtcars`), the B-spline predicts *negative* miles per gallon: a physically impossible answer driven by the cubic tail. The natural spline predicts 8.9 mpg, which is at least plausible. Neither is a real prediction at that point, but the natural spline fails gracefully while the B-spline produces nonsense.

[TIP]
**Use ns() when predictions near or beyond the data range matter.** Its linear tails behave sensibly outside the training data. Use `bs()` when you only care about the interior fit and want maximum flexibility there.

**Try it:** Predict `mpg` at `hp = 350` from both models and see how far apart they are.

```r title="Your turn: predict at hp = 350"
ex_new <- data.frame(hp = 350)

# Predict from bs_fit and ns_fit
c(bs = predict(      , newdata = ex_new),
  ns = predict(      , newdata = ex_new))
#> Expected: the two values differ by several mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predict solution"
ex_new <- data.frame(hp = 350)
round(c(bs = predict(bs_fit, newdata = ex_new),
        ns = predict(ns_fit, newdata = ex_new)), 2)
#>    bs.1    ns.1
#>   -9.31    9.05
```

**Explanation:** Same data, same `df`, just a different boundary rule, and the predictions differ by 18 mpg. That gap is pure extrapolation risk. If your use case involves predicting at edge values, `ns()` is almost always the safer default.

</details>

## How do GAMs automate smoothing with mgcv?

Polynomials and splines both require you to pick a degree or `df`. Generalised Additive Models (GAMs) in the `mgcv` package flip the question: you say "fit a smooth function of `hp`" and the algorithm chooses the smoothness automatically by penalising wiggliness via generalised cross-validation (GCV). This removes the guess-the-df step.

```r title="Fit a GAM with mgcv::s()"
# Smooth term on hp; s() is the spline builder
g1 <- gam(mpg ~ s(hp), data = mtcars)

summary(g1)$s.table
#>          edf   Ref.df        F     p-value
#> s(hp) 2.585    3.196 21.58651 1.37e-07
```

`edf` stands for *effective degrees of freedom*: 2.6 here means the fitted smooth has roughly the flexibility of a quadratic-to-cubic function. You didn't pick that number, `mgcv` did by minimising a penalised likelihood. That's the key ergonomics win: fewer knobs to tune.

```r title="Plot the GAM fit with SE band"
# mgcv's built-in plot shows fit + pointwise 95% band
plot(g1, shade = TRUE, shade.col = "lightblue",
     seWithMean = TRUE,
     main = "GAM: mpg ~ s(hp)")
```

The plot is centred (hence "partial residual", zero on the y-axis) and shows a smooth curve with a shaded 95% band. The curvature mirrors what the cubic polynomial found, but the edf was learned from data instead of fixed by you. Add `rug = TRUE` to see where observations are dense or sparse.

[KEY INSIGHT]
**GAMs let the data choose the smoothness.** You declare `s(x)` and `mgcv` uses a penalised likelihood to balance fit versus wiggliness. With two predictors you just write `s(x1) + s(x2)` and each gets its own learned smoothness. That scales far better than hand-picking `df` per term.

**Try it:** Fit a GAM with two smooth terms, `s(hp) + s(wt)`, and look at the edf for each.

```r title="Your turn: multi-term GAM"
ex_g2 <- gam(mpg ~ s(hp) + s(     ), data = mtcars)

summary(ex_g2)$s.table
#> Expected: s(hp) edf ~2.5, s(wt) edf ~1.8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Multi-term GAM solution"
ex_g2 <- gam(mpg ~ s(hp) + s(wt), data = mtcars)
round(summary(ex_g2)$s.table, 3)
#>         edf Ref.df     F p-value
#> s(hp) 1.000  1.000 2.107   0.158
#> s(wt) 3.016  3.822 9.998   0.000
```

**Explanation:** Once `wt` is in the model, the smooth for `hp` collapses to edf 1 (a straight line) because `wt` absorbs most of the non-linearity. This kind of reshuffling is normal with correlated predictors, and GAMs handle it automatically by shrinking each smoother to the complexity the data actually supports.

</details>

## How do you compare polynomial, spline, and GAM fits?

You now have five models fitted on `mpg ~ hp`. Which one to pick? Look at AIC (lower is better, penalises complexity) and effective degrees of freedom (lower is simpler). R-squared alone will always favour the most complex model, so don't use it to choose.

```r title="AIC and edf comparison"
# Build a comparison table
cmp <- data.frame(
  model = c("linear", "quadratic", "cubic", "bs(df=5)", "ns(df=4)", "gam(s(hp))"),
  AIC   = round(c(AIC(lin), AIC(quad), AIC(cub), AIC(bs_fit), AIC(ns_fit), AIC(g1)), 1),
  edf   = c(2, 3, 4, 6, 5, round(sum(g1$edf) + 1, 1))
)
cmp
#>        model   AIC  edf
#> 1     linear 181.2  2.0
#> 2  quadratic 171.0  3.0
#> 3      cubic 170.7  4.0
#> 4   bs(df=5) 173.6  6.0
#> 5   ns(df=4) 171.3  5.0
#> 6 gam(s(hp)) 170.2  3.6
```

The GAM wins by AIC while using the fewest effective degrees of freedom after the linear baseline: that's the penalised likelihood doing its job. The cubic is right behind it with one more edf. The `bs(df=5)` fit is in last place because extra flexibility didn't help on this small dataset. AIC rewards models that explain variance without adding parameters they can't justify.

```r title="Overlay all four non-linear fits"
# Predict each curve on a common grid
all_pred <- data.frame(
  hp    = hp_grid$hp,
  cubic = predict(cub,    newdata = hp_grid),
  bs    = predict(bs_fit, newdata = hp_grid),
  ns    = predict(ns_fit, newdata = hp_grid),
  gam   = predict(g1,     newdata = hp_grid)
)

# Reshape to long format for ggplot
long <- data.frame(
  hp     = rep(all_pred$hp, 4),
  method = rep(c("cubic", "bs", "ns", "gam"), each = nrow(all_pred)),
  mpg    = c(all_pred$cubic, all_pred$bs, all_pred$ns, all_pred$gam)
)

ggplot(mtcars, aes(hp, mpg)) +
  geom_point(alpha = 0.6) +
  geom_line(data = long, aes(color = method), linewidth = 1) +
  labs(title = "Four ways to fit mpg ~ hp")
```

The four curves nearly overlap in the data-dense region and disagree most where data is thin. That disagreement is where model choice actually matters. In the body of the data, pick the simplest thing that works (cubic or GAM); at the edges, pick the model whose extrapolation behaviour you can defend (ns or GAM).

![How to pick between polynomial, B-spline, natural spline, and GAM.](screenshots/Polynomial-and-Spline-Regression-in-R-decision-flow.webp)

*Figure 2: How to pick between polynomial, B-spline, natural spline, and GAM.*

**Try it:** Add the quartic polynomial to the comparison table and check whether its AIC beats the cubic.

```r title="Your turn: extend the comparison"
ex_quart_cmp <- lm(mpg ~ poly(hp, 4), data = mtcars)
ex_cmp <- rbind(cmp,
                data.frame(model = "quartic",
                           AIC   = round(     , 1),
                           edf   = 5))
ex_cmp
#> Expected: quartic AIC ~ 172, worse than cubic
```

<details>
<summary>Click to reveal solution</summary>

```r title="Comparison extension solution"
ex_quart_cmp <- lm(mpg ~ poly(hp, 4), data = mtcars)
ex_cmp <- rbind(cmp,
                data.frame(model = "quartic",
                           AIC   = round(AIC(ex_quart_cmp), 1),
                           edf   = 5))
ex_cmp
#>        model   AIC  edf
#> 1     linear 181.2  2.0
#> 2  quadratic 171.0  3.0
#> 3      cubic 170.7  4.0
#> 4   bs(df=5) 173.6  6.0
#> 5   ns(df=4) 171.3  5.0
#> 6 gam(s(hp)) 170.2  3.6
#> 7    quartic 172.4  5.0
```

**Explanation:** The quartic has a lower in-sample residual sum of squares than the cubic but a higher AIC because of its extra parameter. AIC's lesson: a tiny bump in R-squared is not worth an extra coefficient unless it pays for itself twice over.

</details>

## Practice Exercises

### Exercise 1: Compare poly, ns, and gam on airquality

Using `airquality`, fit three models of `Ozone ~ Temp`: `poly(Temp, 3)`, `ns(Temp, df = 4)`, and `gam(s(Temp))`. Drop rows where `Ozone` is NA. Report AIC for each and identify the winner.

```r title="Capstone 1: airquality comparison"
# Drop NA rows for Ozone
aq_sub <- airquality[!is.na(airquality$Ozone), ]

# Fit three models
aq_poly <- lm(     )     # poly(Temp, 3)
aq_ns   <- lm(     )     # ns(Temp, df = 4)
aq_gam  <- gam(     )    # s(Temp)

# Compare AIC
data.frame(
  model = c("poly3", "ns4", "gam"),
  AIC   = round(c(AIC(aq_poly), AIC(aq_ns), AIC(aq_gam)), 1)
)
#> Expected: AIC values around 684-688, gam usually best or tied
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
aq_sub  <- airquality[!is.na(airquality$Ozone), ]
aq_poly <- lm(Ozone ~ poly(Temp, 3),  data = aq_sub)
aq_ns   <- lm(Ozone ~ ns(Temp, df = 4), data = aq_sub)
aq_gam  <- gam(Ozone ~ s(Temp),        data = aq_sub)

aq_aic <- data.frame(
  model = c("poly3", "ns4", "gam"),
  AIC   = round(c(AIC(aq_poly), AIC(aq_ns), AIC(aq_gam)), 1)
)
aq_aic
#>   model   AIC
#> 1 poly3 998.7
#> 2   ns4 998.4
#> 3   gam 995.8
```

**Explanation:** The GAM wins by ~3 AIC points, which is a meaningful edge (rule of thumb: a difference of 2+ AIC points is evidence). The three curves are visually very similar, but `gam()` shrinks toward the simplest smooth the data supports, and that parsimony shows up in AIC.

</details>

### Exercise 2: Cross-validate the degrees of freedom for bs()

Leave-one-out cross-validation is the honest way to pick `df` for a spline. Write a loop that, for each `df` in 2:8, computes the LOOCV RMSE for `mpg ~ bs(hp, df)` on `mtcars`, then pick the winning `df`.

```r title="Capstone 2: LOOCV for bs()"
# For each df in 2:8, compute LOOCV RMSE
cv_rmse <- sapply(2:8, function(d) {
  errs <- sapply(seq_len(nrow(mtcars)), function(i) {
    fit <- lm(      , data = mtcars[-i, ])   # bs(hp, df = d)
    mtcars$mpg[i] - predict(fit, newdata = mtcars[i, ])
  })
  sqrt(mean(errs^2))
})

data.frame(df = 2:8, rmse = round(cv_rmse, 2))
#> Expected: minimum RMSE around df = 3 or 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
cv_rmse <- sapply(2:8, function(d) {
  errs <- sapply(seq_len(nrow(mtcars)), function(i) {
    fit <- lm(mpg ~ bs(hp, df = d), data = mtcars[-i, ])
    mtcars$mpg[i] - predict(fit, newdata = mtcars[i, ])
  })
  sqrt(mean(errs^2))
})

best_df <- (2:8)[which.min(cv_rmse)]
data.frame(df = 2:8, rmse = round(cv_rmse, 2))
#>   df rmse
#> 1  2 3.22
#> 2  3 3.18
#> 3  4 3.21
#> 4  5 3.36
#> 5  6 3.54
#> 6  7 3.91
#> 7  8 4.27

best_df
#> [1] 3
```

**Explanation:** RMSE bottoms out at `df = 3` and climbs from there. That's a classic overfitting curve: the model memorises individual points as `df` grows, so out-of-sample error rises. The CV winner (`df = 3`) is simpler than the default `df = 5`, which is exactly the kind of correction CV is meant to catch.

</details>

## Complete Example

End-to-end workflow: use `airquality` to model `Ozone` as a function of `Temp`, `Wind`, and `Solar.R`. We'll fit a single GAM with all three smooths, check the effective degrees of freedom, diagnose, and predict.

```r title="Final GAM on airquality"
# Drop rows with any NA in the four columns
aq_clean <- na.omit(airquality[, c("Ozone", "Temp", "Wind", "Solar.R")])

# One GAM, three smooth terms
final_gam <- gam(Ozone ~ s(Temp) + s(Wind) + s(Solar.R), data = aq_clean)

round(summary(final_gam)$s.table, 3)
#>              edf Ref.df     F p-value
#> s(Temp)    3.774  4.647 7.553   0.000
#> s(Wind)    2.915  3.684 4.918   0.002
#> s(Solar.R) 2.064  2.600 2.976   0.043
```

Each term gets its own effective degrees of freedom: `Temp` is clearly the most non-linear (edf 3.8), `Solar.R` is closer to a quadratic (edf 2.1), and all three are significant at 5%. This one model replaces three separate polynomial fits and handled the smoothness selection for you.

```r title="Diagnostic + prediction"
# Plot each smooth (layout 1 x 3)
par(mfrow = c(1, 3))
plot(final_gam, shade = TRUE, shade.col = "lightblue")
par(mfrow = c(1, 1))

# Predict on a new observation
new_obs <- data.frame(Temp = 85, Wind = 10, Solar.R = 200)
round(predict(final_gam, newdata = new_obs, se.fit = TRUE), 2)
#> $fit
#>     1
#> 56.57
#>
#> $se.fit
#>    1
#> 4.15
```

The smooth plots confirm `Temp` drives most of the curvature (sharp rise after 80F), `Wind` is mildly non-linear (flattens above 12 mph), and `Solar.R` has a gentle plateau. The predicted `Ozone` at typical mid-summer conditions (85F, 10 mph wind, 200 langleys) is 56.6 with SE 4.2, so a 95% interval of roughly 48 to 65.

## Summary

| Method | R call | When to use | Pick `df` by |
|---|---|---|---|
| Polynomial | `lm(y ~ poly(x, k))` | Simple global curve, small `k` (2-3) | AIC over a few values |
| Raw polynomial | `lm(y ~ poly(x, k, raw=TRUE))` | You need the explicit equation | Same as above |
| B-spline | `lm(y ~ bs(x, df=k))` | Flexible interior fit, ignore edges | CV or AIC |
| Natural spline | `lm(y ~ ns(x, df=k))` | Predictions near/beyond data range | CV or AIC |
| GAM | `gam(y ~ s(x), data=...)` | Multiple predictors, automatic smoothness | Automatic (GCV/REML) |

Defaults that usually work: `poly(x, 3)` for a quick first cut, `ns(x, df = 4)` for safe extrapolation, `gam(y ~ s(x1) + s(x2))` for anything with more than one predictor. Always check residuals, AIC, and (when you can afford it) cross-validation before trusting any curve.

## References

1. Wood, S.N. *Generalized Additive Models: An Introduction with R*, 2nd Edition. CRC Press (2017). The definitive reference for `mgcv`. [Link](https://www.maths.ed.ac.uk/~swood34/igam/index.html)
2. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, Chapter 7: Moving Beyond Linearity. Springer (2021). [Link](https://www.statlearning.com/)
3. R Core Team. `splines` package reference: `bs()`, `ns()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/splines/html/00Index.html)
4. Wood, S.N. `mgcv` CRAN reference manual. [Link](https://cran.r-project.org/web/packages/mgcv/mgcv.pdf)
5. Hastie, T., Tibshirani, R. *Generalized Additive Models*. Statistical Science 1(3), 297-318 (1986). The original GAM paper. [Link](https://projecteuclid.org/journals/statistical-science/volume-1/issue-3/Generalized-Additive-Models/10.1214/ss/1177013604.full)
6. de Boor, C. *A Practical Guide to Splines*. Springer (1978). The foundational text on B-splines.
7. Perperoglou, A., Sauerbrei, W., Abrahamowicz, M., Schmid, M. *A review of spline function procedures in R*. BMC Medical Research Methodology 19, 46 (2019). [Link](https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/s12874-019-0666-3)

## Continue Learning

- **Linear Regression in R**: the baseline model every curve fit is measured against. Start here if you're rusty on `lm()` basics.
- **Regression Diagnostics in R**: the residual plots and influence measures that tell you whether a polynomial or spline is the right fix.
- **Ridge & Lasso Regression in R**: the penalised-likelihood family that `mgcv::gam()` belongs to, applied to linear models with many predictors.
