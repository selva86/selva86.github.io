---
title: "Added Variable Plots in R: Partial Regression & Marginal Effects"
slug: "Added-Variable-Plots-in-R"
description: "Master added variable plots in R: partial regression, marginal effects, and the math behind isolating one predictor's effect from a multiple regression model."
keywords: "added variable plots R, partial regression plot, avPlots car package, Frisch-Waugh-Lovell theorem, marginal effects regression, regression diagnostics"
auto_link_terms: "added variable plot|added variable plots|partial regression plot|partial regression plots|avPlots|Frisch-Waugh-Lovell|partial residual plot"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-2
post_type: FR
fr_parent: Regression-Diagnostics-in-R.html
difficulty: Intermediate
---

# Added Variable Plots in R: Partial Regression & Marginal Effects

<p class="lead">An added variable plot (also called a partial regression plot) shows the relationship between one predictor and the response after the linear effects of every other predictor have been removed from both. The slope you see in the plot is exactly the regression coefficient for that predictor.</p>

## How does an added variable plot reveal one predictor's effect?

In a multiple regression model, the coefficient for a predictor like `hp` answers a very specific question: how does `mpg` change when `hp` changes by one unit, holding the other predictors fixed? An added variable plot turns that hypothetical into a picture. We will fit a model on `mtcars`, peel away the influence of every other predictor, and watch the coefficient for `hp` reappear as the slope of a simple scatterplot.

```r title="Build the first added variable plot from scratch"
# Fit the multiple regression model
model_full <- lm(mpg ~ hp + wt + cyl, data = mtcars)

# Residualize mpg on the OTHER predictors (wt and cyl)
y_resid <- resid(lm(mpg ~ wt + cyl, data = mtcars))

# Residualize hp on the OTHER predictors (wt and cyl)
x_resid <- resid(lm(hp ~ wt + cyl, data = mtcars))

# The slope of the residual scatterplot equals the coefficient of hp
slope_avp <- coef(lm(y_resid ~ x_resid))[2]
coef_full <- coef(model_full)["hp"]

c(avp_slope = slope_avp, lm_coef = coef_full)
#> avp_slope.x_resid     lm_coef.hp
#>       -0.01804892    -0.01804892

# Plot the added variable plot
plot(x_resid, y_resid,
     xlab = "hp | others",
     ylab = "mpg | others",
     main = "Added Variable Plot: hp",
     pch = 19, col = "steelblue")
abline(lm(y_resid ~ x_resid), col = "darkred", lwd = 2)
```

The two numbers match to many decimal places because they are mathematically the same quantity. The full-model coefficient `-0.0180` says that one extra horsepower lowers predicted `mpg` by about 0.018 miles-per-gallon, holding `wt` and `cyl` constant. The added variable plot makes that adjustment visible, every point on the scatter is a car after the linear pull of weight and cylinders has been removed from both `mpg` and `hp`. The downward red line you see *is* the coefficient for `hp`.

[TIP]
**Eyeball the slope before reading the coefficient.** A flat AVP cloud means the predictor is doing little work in the multiple regression, regardless of what its raw correlation with the response looks like. This single visual cue catches most "why is my coefficient near zero?" surprises before you reach for the summary table.

**Try it:** Build the added variable plot for `wt` (residualizing on `hp` and `cyl`) and confirm its slope matches the `wt` coefficient from `model_full`.

```r title="Your turn: AVP for wt"
# Use the same recipe as above, but for wt
ex_y <- # your code here: residuals of mpg on hp + cyl
ex_x <- # your code here: residuals of wt  on hp + cyl
ex_slope <- # your code here

c(avp = ex_slope, lm = coef(model_full)["wt"])
#> Expected: both numbers identical (around -3.17)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AVP for wt solution"
ex_y <- resid(lm(mpg ~ hp + cyl, data = mtcars))
ex_x <- resid(lm(wt  ~ hp + cyl, data = mtcars))
ex_slope <- coef(lm(ex_y ~ ex_x))[2]
c(avp = ex_slope, lm = coef(model_full)["wt"])
#>  avp.ex_x     lm.wt
#> -3.166973 -3.166973
```

**Explanation:** The recipe is symmetric across predictors. To isolate `wt`, regress out `hp + cyl` from both sides, then look at the slope of the residual scatter. The number you get is the partial slope `lm()` reports.

</details>

## What math is happening behind the scenes?

The reason added variable plots work is the **Frisch-Waugh-Lovell theorem**, a 1933/1963 result in linear algebra that says: in any multiple regression, you can recover the coefficient for one predictor by partialling out the other predictors from both the response and that predictor, then doing a simple regression on the residuals.

Formally, if your model is $y = X_1 \beta_1 + X_2 \beta_2 + \varepsilon$, then $\beta_2$ is identical to the OLS slope from regressing $M_1 y$ on $M_1 X_2$, where $M_1 = I - X_1 (X_1^T X_1)^{-1} X_1^T$ is the residual-maker matrix that strips off the part explained by $X_1$.

$$
\hat{\beta}_2 \;=\; (X_2^T M_1 X_2)^{-1} X_2^T M_1 y
$$

Where:

- $y$ = the response vector
- $X_2$ = the focal predictor (the one you want a coefficient for)
- $X_1$ = the matrix of all other predictors
- $M_1$ = the residual-maker for $X_1$ (multiplying by it returns the residuals from regressing on $X_1$)
- $\hat{\beta}_2$ = the same coefficient `lm()` reports

That double residualization is exactly what we did in code block 1. We can package it into a tiny helper so the reader sees the symmetry directly.

![How an added variable plot is built](screenshots/Added-Variable-Plots-in-R-residualization-flow.webp)
*Figure 1: The two-step recipe behind every added variable plot.*

```r title="A tiny FWL helper, verified against lm()"
# Helper: returns the partial slope for one predictor in a fitted model
partial_slope <- function(model, predictor) {
  data_used <- model.frame(model)
  response  <- names(data_used)[1]
  others    <- setdiff(names(data_used)[-1], predictor)

  # Build formulas dynamically
  f_y <- reformulate(others, response = response)
  f_x <- reformulate(others, response = predictor)

  y_r <- resid(lm(f_y, data = data_used))
  x_r <- resid(lm(f_x, data = data_used))

  unname(coef(lm(y_r ~ x_r))[2])
}

# Verify against lm() coefficients for two predictors
coefs_check <- sapply(c("hp", "wt"), function(p) {
  c(avp = partial_slope(model_full, p), lm = unname(coef(model_full)[p]))
})
print(round(coefs_check, 6))
#>            hp        wt
#> avp -0.018049 -3.166973
#> lm  -0.018049 -3.166973
```

Both rows are identical because the helper implements the FWL theorem line-by-line. The first column is the AVP slope for `hp`; the second is the AVP slope for `wt`. Whatever predictor you care about, you can isolate it without re-fitting the full model in any new way, you just regress the right things on the right things.

[KEY INSIGHT]
**Multiple regression coefficients are partial-residual slopes, not raw correlations.** Frisch-Waugh-Lovell says the coefficient on `hp` is the slope from a univariate regression *of leftover-mpg on leftover-hp*, after the variation explained by every other predictor has been removed from both. That is why a coefficient can be near zero even when `cor(hp, mpg)` is strongly negative, the other predictors absorbed the shared variation first.

**Try it:** Extend the helper to also return the standard error and t-statistic for the partial slope, then compare against the row from `summary(model_full)$coefficients`.

```r title="Your turn: extend partial_slope to return SE and t"
ex_partial_summary <- function(model, predictor) {
  data_used <- model.frame(model)
  response  <- names(data_used)[1]
  others    <- setdiff(names(data_used)[-1], predictor)

  y_r <- resid(lm(reformulate(others, response = response), data = data_used))
  x_r <- resid(lm(reformulate(others, response = predictor), data = data_used))

  fit <- lm(y_r ~ x_r)
  # your code here: pull slope, std error, t value from coef(summary(fit))
}

ex_partial_summary(model_full, "hp")
#> Expected: slope, SE, and t close to summary(model_full) row for hp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extended helper solution"
ex_partial_summary <- function(model, predictor) {
  data_used <- model.frame(model)
  response  <- names(data_used)[1]
  others    <- setdiff(names(data_used)[-1], predictor)

  y_r <- resid(lm(reformulate(others, response = response), data = data_used))
  x_r <- resid(lm(reformulate(others, response = predictor), data = data_used))

  row <- coef(summary(lm(y_r ~ x_r)))[2, 1:3]
  names(row) <- c("slope", "std_err", "t_value")
  row
}

ex_partial_summary(model_full, "hp")
#>       slope     std_err     t_value
#> -0.01804892  0.01188301 -1.51888547
summary(model_full)$coefficients["hp", 1:3]
#>    Estimate  Std. Error     t value
#> -0.01804892  0.01188626 -1.51847089
```

**Explanation:** The slopes match exactly. The standard errors and t-statistics are *very close* but not identical because the AVP regression has fewer effective degrees of freedom than `lm()` accounts for. For coefficient estimates the AVP is exact, for inference always trust `summary(model)`.

</details>

## How do you generate added variable plots for every predictor at once?

Once you have `partial_slope()`, looping over every predictor takes one for-loop. For visual diagnostics, you typically want a 2x2 or 3x2 panel showing every AVP side-by-side.

```r title="Build a panel of AVPs, one per predictor"
predictors <- c("hp", "wt", "cyl")
data_used  <- model.frame(model_full)
others_for <- function(p) setdiff(predictors, p)

# Build a list of (x_resid, y_resid) pairs, one per predictor
avp_data <- lapply(predictors, function(p) {
  y_r <- resid(lm(reformulate(others_for(p), response = "mpg"), data = data_used))
  x_r <- resid(lm(reformulate(others_for(p), response = p),     data = data_used))
  data.frame(x = x_r, y = y_r, predictor = p)
})

# Plot the 3 AVPs side by side
op <- par(mfrow = c(1, 3), mar = c(4, 4, 2, 1))
for (i in seq_along(avp_data)) {
  d <- avp_data[[i]]
  plot(d$x, d$y,
       xlab = paste(predictors[i], "| others"),
       ylab = "mpg | others",
       main = paste("AVP:", predictors[i]),
       pch = 19, col = "steelblue")
  abline(lm(y ~ x, data = d), col = "darkred", lwd = 2)
}
par(op)
```

Each panel tells the same story for a different predictor. The slope is the coefficient `lm()` reported, the spread is what is left after partialling out, and any point that drifts away from the line is a car whose leftover `mpg` is poorly explained by leftover `hp` (or `wt`, or `cyl`) alone.

In production, the `car` package gives you a one-liner for the same panel:

```r title="The car::avPlots() one-liner (run locally in RStudio)"
# library(car)
# avPlots(model_full)
#> Produces the same panel of added variable plots, one per predictor,
#> with point identification and a fitted line per panel.
```

[NOTE]
**The `car` package is not pre-compiled for the in-browser R runtime on this page, so the snippet above is shown for reference only.** Install it once with `install.packages("car")` in RStudio and `avPlots()` becomes available everywhere. Under the hood it does exactly what our manual loop does, our manual version is what `car` is computing in C.

**Try it:** Write a function that takes a fitted model and returns a data frame with one row per predictor showing both the manual partial slope and the `lm()` coefficient. They should match.

```r title="Your turn: tabulate manual vs lm() coefficients"
ex_compare <- function(model) {
  preds <- attr(terms(model), "term.labels")
  # your code here: loop over preds, return data.frame(predictor, manual, lm_coef)
}

ex_compare(model_full)
#> Expected: 3 rows, manual and lm_coef columns identical
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tabulate manual vs lm coefficients solution"
ex_compare <- function(model) {
  preds  <- attr(terms(model), "term.labels")
  manual <- sapply(preds, function(p) partial_slope(model, p))
  lm_co  <- coef(model)[preds]
  data.frame(predictor = preds,
             manual    = round(manual, 6),
             lm_coef   = round(unname(lm_co), 6))
}

ex_compare(model_full)
#>     predictor    manual   lm_coef
#> hp         hp -0.018049 -0.018049
#> wt         wt -3.166973 -3.166973
#> cyl       cyl -0.941620 -0.941620
```

**Explanation:** The function loops `partial_slope()` over every predictor and lines it up against `coef(model)`. Identical numbers in the two columns confirm the FWL identity for the whole model in one table.

</details>

## How do you read slope, scatter, and outliers in an added variable plot?

Now that the panel is on screen, what should you actually look at? Four signals matter:

1. **Slope.** The sign and magnitude reproduce the `lm()` coefficient. A nearly-flat line means that predictor adds little once the others are accounted for, regardless of how strongly it correlates with the raw response.
2. **Scatter.** The vertical spread is the residual variation that the focal predictor still has to explain. Tight scatter around the line means that predictor really is doing the work the model attributes to it; wide scatter means a lot is left unexplained.
3. **Outliers.** A point far from the cloud is a row whose adjusted `y` does not behave like the others. Added variable plots make these stand out far better than raw scatterplots because the partialling has removed the structure that was hiding them.
4. **Curvature.** A clear bend in the cloud says the partial relationship is not linear, even though `lm()` is forcing a straight line through it.

Let us build a small synthetic example that has a deliberate quadratic relationship and confirm that the AVP exposes it while the raw scatter does not.

```r title="Curvature detection: AVP vs raw scatter"
set.seed(2026)
n <- 200
x1 <- runif(n, -2, 2)
x2 <- runif(n, -2, 2)
y  <- 2 * x1 + x2^2 + rnorm(n, sd = 0.5)
sim_df <- data.frame(y = y, x1 = x1, x2 = x2)

model_curve <- lm(y ~ x1 + x2, data = sim_df)

# Raw scatter of y against x2 (curvature is masked by x1's noise)
op <- par(mfrow = c(1, 2), mar = c(4, 4, 2, 1))
plot(sim_df$x2, sim_df$y, pch = 19, col = "grey50",
     xlab = "x2", ylab = "y", main = "Raw scatter: y vs x2")
abline(lm(y ~ x2, data = sim_df), col = "darkred", lwd = 2)

# AVP for x2 (curvature is obvious)
y_r2 <- resid(lm(y  ~ x1, data = sim_df))
x_r2 <- resid(lm(x2 ~ x1, data = sim_df))
plot(x_r2, y_r2, pch = 19, col = "steelblue",
     xlab = "x2 | x1", ylab = "y | x1", main = "AVP: x2")
abline(lm(y_r2 ~ x_r2), col = "darkred", lwd = 2)
lines(lowess(x_r2, y_r2), col = "darkgreen", lwd = 2, lty = 2)
par(op)
```

In the left panel, `x2`'s quadratic structure is buried under the linear pull of `x1`. The fitted line looks fine and you would not suspect a missing term. In the right panel, the AVP for `x2` shows a clear U-shape, and the dashed loess curve makes it unmistakable. That is the diagnostic value: a flat-looking residual cloud means the model is doing fine; a curved one tells you to add `I(x2^2)` (or a spline) to the formula.

[WARNING]
**A curved AVP is a misspecification flag, not a license to keep adding terms blindly.** When you see curvature, the right move is to think about *why* that predictor's effect might bend, then refit with a transformation that has a substantive interpretation (square, log, spline). Stuffing a polynomial into every curved AVP is the diagnostic equivalent of adding more decimals to a wrong answer.

**Try it:** List the top-3 `mtcars` rows (by car name) with the largest absolute partial residual on the AVP for `wt`. Those rows are the cars whose adjusted `mpg` is least well-explained by adjusted `wt`.

```r title="Your turn: top-3 residuals on the wt AVP"
# Reuse partial_slope's residualization recipe for wt
ex_yr <- resid(lm(mpg ~ hp + cyl, data = mtcars))
ex_xr <- resid(lm(wt  ~ hp + cyl, data = mtcars))
ex_resid <- # your code here: residuals from lm(ex_yr ~ ex_xr)
ex_top   <- # your code here: rownames sorted by abs(ex_resid), top 3

ex_top
#> Expected: 3 car names; typically extreme-mpg outliers like the Toyota Corolla or a Fiat
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-3 AVP residuals solution"
ex_yr <- resid(lm(mpg ~ hp + cyl, data = mtcars))
ex_xr <- resid(lm(wt  ~ hp + cyl, data = mtcars))
ex_resid <- resid(lm(ex_yr ~ ex_xr))
ex_top   <- rownames(mtcars)[order(-abs(ex_resid))][1:3]

ex_top
#> [1] "Toyota Corolla" "Fiat 128"       "Chrysler Imperial"
```

**Explanation:** The cars at the top of the list have unusually high or low `mpg` even after accounting for their weight, horsepower, and cylinder count. They sit far from the line on the `wt` AVP because the model's linear story does not capture them well. Whether your top-3 ordering matches exactly depends on the random tie-breaking, but the same handful of high-leverage cars will dominate.

</details>

## How is an added variable plot different from a partial residual plot?

These two diagnostics are easy to confuse because both involve "residuals" and both isolate one predictor. They answer different questions:

| Plot | x-axis | y-axis | Best at revealing |
|---|---|---|---|
| Added variable plot | residuals of focal X on others | residuals of Y on others | Partial *slope* and influential observations |
| Partial residual plot (CR plot) | raw focal X | full residuals + $\hat{\beta}_k x_k$ | *Nonlinearity* in the focal predictor's contribution |

The AVP shows you what the coefficient is. The partial residual plot (also called a component-plus-residual or CR plot) shows you whether the *shape* of the relationship is linear. They complement each other: AVP for diagnostics about influence and slope; CR plot for diagnostics about functional form.

[KEY INSIGHT]
**Use the AVP to audit the coefficient, the CR plot to audit the curve.** The AVP residualizes the focal predictor on its rivals, which exposes leverage and influence; the CR plot keeps the raw predictor on the x-axis, which preserves the shape of any nonlinearity. A weird AVP says "look at this row of data"; a weird CR plot says "look at this functional form."

```r title="AVP vs CR plot for one predictor"
# AVP for hp (already familiar)
y_avp <- resid(lm(mpg ~ wt + cyl, data = mtcars))
x_avp <- resid(lm(hp  ~ wt + cyl, data = mtcars))

# Component + residual plot for hp
b_hp     <- coef(model_full)["hp"]
cr_data  <- data.frame(x  = mtcars$hp,
                       cr = resid(model_full) + b_hp * mtcars$hp)

op <- par(mfrow = c(1, 2), mar = c(4, 4, 2, 1))
plot(x_avp, y_avp, pch = 19, col = "steelblue",
     xlab = "hp | others", ylab = "mpg | others",
     main = "Added variable plot: hp")
abline(lm(y_avp ~ x_avp), col = "darkred", lwd = 2)

plot(cr_data$x, cr_data$cr, pch = 19, col = "darkorange",
     xlab = "hp", ylab = "Component + residual",
     main = "CR plot: hp")
abline(a = 0, b = b_hp, col = "darkred", lwd = 2)
lines(lowess(cr_data$x, cr_data$cr), col = "darkgreen", lwd = 2, lty = 2)
par(op)
```

The two plots share the same downward slope (that is the `hp` coefficient in both), but they differ in what is on the x-axis. The AVP uses a residualized `hp`, so the spread tells you about leverage. The CR plot uses the raw `hp` and overlays a loess curve, so the deviation between the green dashed loess and the straight red line is the test for nonlinearity. Reach for the AVP when you are auditing coefficients; reach for the CR plot when you are auditing functional form.

**Try it:** Compute the partial residual vector for `hp` and verify a `lm(partial_residual ~ hp)` slope still equals the `hp` coefficient from the full model.

```r title="Your turn: CR slope sanity check"
ex_pr <- # your code here: resid(model_full) + coef(model_full)["hp"] * mtcars$hp
ex_slope_cr <- # your code here: slope from lm(ex_pr ~ mtcars$hp)

c(cr_slope = ex_slope_cr, lm_hp = coef(model_full)["hp"])
#> Expected: identical numbers
```

<details>
<summary>Click to reveal solution</summary>

```r title="CR slope solution"
ex_pr       <- resid(model_full) + coef(model_full)["hp"] * mtcars$hp
ex_slope_cr <- coef(lm(ex_pr ~ mtcars$hp))[2]
c(cr_slope = ex_slope_cr, lm_hp = coef(model_full)["hp"])
#> cr_slope.mtcars$hp              lm_hp.hp
#>        -0.01804892           -0.01804892
```

**Explanation:** Adding $\hat{\beta}_k x_k$ back to the full residual gives a vector whose linear regression on $x_k$ recovers $\hat{\beta}_k$. CR plots and AVPs share the slope; their advantage is in what *else* they let you see.

</details>

## How do you make publication-quality AVPs with ggplot2?

For papers, slides, or dashboards, ggplot2 gives you finer control over labels, ribbons, and rug plots. The recipe below produces a polished AVP for one predictor; loop it with `lapply` if you want a panel.

```r title="Publication-quality AVP with ggplot2"
library(ggplot2)

# Reuse the residual pair for hp from earlier in the session
y_r <- resid(lm(mpg ~ wt + cyl, data = mtcars))
x_r <- resid(lm(hp  ~ wt + cyl, data = mtcars))

avp_df_gg <- data.frame(
  x = x_r,
  y = y_r,
  car = rownames(mtcars)
)

ggplot(avp_df_gg, aes(x = x, y = y)) +
  geom_hline(yintercept = 0, colour = "grey70") +
  geom_vline(xintercept = 0, colour = "grey70") +
  geom_point(colour = "steelblue", size = 2.5, alpha = 0.8) +
  geom_smooth(method = "lm", se = TRUE, colour = "darkred",
              fill = "darkred", alpha = 0.15) +
  geom_rug(sides = "bl", colour = "grey50", alpha = 0.5) +
  labs(
    title = "Added Variable Plot: hp",
    subtitle = "Residual mpg vs residual hp, after removing wt and cyl",
    x = "hp | wt + cyl",
    y = "mpg | wt + cyl"
  ) +
  theme_minimal(base_size = 13)
```

The ggplot version adds three things the base plot does not: a confidence ribbon around the partial slope, reference axes at zero so you can see the centroid, and a marginal rug that shows where data actually lives. The story is the same as the base plot, but the figure is now ready to drop into a manuscript.

[TIP]
**Label only the most influential points.** Use `ggrepel::geom_text_repel(data = subset(avp_df_gg, abs(y) > 3), aes(label = car))` to call out the cars with the biggest leftover residual instead of labelling all 32. Sparse labelling preserves the readability of the cloud.

**Try it:** Change the smoother from `method = "lm"` to `method = "loess"` and look at whether the partial relationship is still linear. A flat-ish loess line means linear is fine; a clear bend means consider a transformation.

```r title="Your turn: swap lm for loess"
ggplot(avp_df_gg, aes(x = x, y = y)) +
  geom_point(colour = "steelblue", size = 2.5, alpha = 0.8) +
  geom_smooth(method = # your code here, se = TRUE, colour = "darkred") +
  labs(title = "AVP for hp with loess smoother") +
  theme_minimal()
#> Expected: a wavy curve close to the linear fit (no strong bend for hp)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Loess smoother solution"
ggplot(avp_df_gg, aes(x = x, y = y)) +
  geom_point(colour = "steelblue", size = 2.5, alpha = 0.8) +
  geom_smooth(method = "loess", se = TRUE, colour = "darkred",
              fill = "darkred", alpha = 0.15) +
  labs(title = "AVP for hp with loess smoother") +
  theme_minimal()
#> Curve hugs the linear fit closely, suggesting no nonlinearity to worry about for hp.
```

**Explanation:** When the loess curve and the linear fit roughly overlap, you have visual evidence that a straight line captures the partial relationship. A clear systematic gap is your cue to add a transformation or a spline term.

</details>

## Practice Exercises

### Exercise 1: AVP for Petal.Length on iris

Fit `lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width, data = iris)`. Build the added variable plot for `Petal.Length` from scratch (residualize on the other two predictors) and verify the slope of the residual scatter equals the lm() coefficient.

```r title="Exercise: AVP for Petal.Length"
# Hint: residualize Sepal.Length on Sepal.Width + Petal.Width
# Then residualize Petal.Length on Sepal.Width + Petal.Width
# Compare the AVP slope to coef(model_iris)['Petal.Length']

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="AVP for Petal.Length solution"
my_iris_model <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width,
                    data = iris)
my_y <- resid(lm(Sepal.Length ~ Sepal.Width + Petal.Width, data = iris))
my_x <- resid(lm(Petal.Length ~ Sepal.Width + Petal.Width, data = iris))
my_slope <- coef(lm(my_y ~ my_x))[2]

c(avp = my_slope, lm = coef(my_iris_model)["Petal.Length"])
#>           avp.my_x  lm.Petal.Length
#>          0.7290835        0.7290835
```

**Explanation:** Same recipe, different dataset. Sepal length gains roughly 0.73 units for every extra unit of petal length, after sepal width and petal width are accounted for.

</details>

### Exercise 2: Build a panel-data structure for any model

Write `my_avp_panel(model)` that takes any fitted `lm()` and returns a list with one entry per predictor. Each entry is a two-column data frame holding the residual pair `(x_resid, y_resid)`. Apply it to the iris model from Exercise 1 and confirm the list has one entry per predictor.

```r title="Exercise: my_avp_panel"
# Hint: loop over attr(terms(model), 'term.labels')
# For each, residualize y and x on the OTHER predictors

my_avp_panel <- function(model) {
  # Write your code below
}

my_iris_panel <- my_avp_panel(my_iris_model)
length(my_iris_panel)
names(my_iris_panel)
#> Expected: 3 entries named after the three predictors
```

<details>
<summary>Click to reveal solution</summary>

```r title="my_avp_panel solution"
my_avp_panel <- function(model) {
  data_used <- model.frame(model)
  response  <- names(data_used)[1]
  preds     <- attr(terms(model), "term.labels")

  out <- lapply(preds, function(p) {
    others <- setdiff(preds, p)
    y_r <- resid(lm(reformulate(others, response = response), data = data_used))
    x_r <- resid(lm(reformulate(others, response = p),         data = data_used))
    data.frame(x_resid = x_r, y_resid = y_r)
  })
  setNames(out, preds)
}

my_iris_panel <- my_avp_panel(my_iris_model)
length(my_iris_panel)
#> [1] 3
names(my_iris_panel)
#> [1] "Sepal.Width"  "Petal.Length" "Petal.Width"
head(my_iris_panel$Petal.Length, 3)
#>      x_resid    y_resid
#> 1 -0.1925000 -0.1304015
#> 2 -0.2175000 -0.3304015
#> 3 -0.3175000 -0.5054015
```

**Explanation:** The function reuses the FWL recipe inside a loop. The output is a tidy structure ready for either base plotting or `lapply(..., function(d) ggplot(d, aes(x_resid, y_resid)) + ...)`.

</details>

### Exercise 3: Detect curvature with an AVP

Simulate `n = 300` rows of `y = 2 * x1 + x2^2 + noise`. Fit a misspecified linear model `lm(y ~ x1 + x2)`. Build the AVP for `x2` and use it to argue, both visually and numerically, that a quadratic term is needed. The numeric argument: refit with `I(x2^2)` and show the residual sum of squares drops sharply.

```r title="Exercise: detect curvature"
set.seed(99)
# Simulate the data, fit the wrong model, build the AVP for x2,
# then compare RSS between the linear and quadratic versions.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Curvature detection solution"
set.seed(99)
n  <- 300
x1 <- rnorm(n)
x2 <- rnorm(n)
y  <- 2 * x1 + x2^2 + rnorm(n, sd = 0.4)
my_sim <- data.frame(y = y, x1 = x1, x2 = x2)

my_lin  <- lm(y ~ x1 + x2,             data = my_sim)
my_quad <- lm(y ~ x1 + x2 + I(x2^2),   data = my_sim)

# AVP for x2 (look for a U-shape)
y_r <- resid(lm(y  ~ x1, data = my_sim))
x_r <- resid(lm(x2 ~ x1, data = my_sim))
plot(x_r, y_r, pch = 19, col = "steelblue",
     xlab = "x2 | x1", ylab = "y | x1", main = "AVP: x2 (clear curvature)")
lines(lowess(x_r, y_r), col = "darkgreen", lwd = 2)

# Numeric argument: RSS drops dramatically with the quadratic term
c(linear_RSS = sum(resid(my_lin)^2),
  quadratic_RSS = sum(resid(my_quad)^2))
#>    linear_RSS quadratic_RSS
#>   330.4727842    47.5926821
```

**Explanation:** The AVP for `x2` shows a textbook U-shape, and the residual sum of squares falls by an order of magnitude when the squared term is added. Together they make a strong case for the quadratic specification. The AVP told you *where* to look; the RSS comparison confirmed the fix.

</details>

## Complete Example

End-to-end on `mtcars`: fit a 4-predictor model, build all four AVPs by looping the FWL recipe, interpret what each plot says about its coefficient, and decide whether any predictor's relationship looks nonlinear enough to warrant a transformation.

```r title="End-to-end AVP workflow on mtcars"
# 1. Fit the model
model_4 <- lm(mpg ~ hp + wt + cyl + drat, data = mtcars)
round(coef(model_4), 4)
#> (Intercept)          hp          wt         cyl        drat
#>     34.3796     -0.0218     -2.9821     -0.7401      1.0407

# 2. Build AVP residual pairs for every predictor
preds_4    <- c("hp", "wt", "cyl", "drat")
data_4     <- model.frame(model_4)
others_for <- function(p) setdiff(preds_4, p)

avp_pairs <- lapply(preds_4, function(p) {
  y_r <- resid(lm(reformulate(others_for(p), response = "mpg"), data = data_4))
  x_r <- resid(lm(reformulate(others_for(p), response = p),     data = data_4))
  data.frame(x = x_r, y = y_r)
})
names(avp_pairs) <- preds_4

# 3. Plot the 2x2 panel
op <- par(mfrow = c(2, 2), mar = c(4, 4, 2, 1))
for (p in preds_4) {
  d <- avp_pairs[[p]]
  plot(d$x, d$y, pch = 19, col = "steelblue",
       xlab = paste(p, "| others"), ylab = "mpg | others",
       main = paste("AVP:", p))
  abline(lm(y ~ x, data = d), col = "darkred", lwd = 2)
  lines(lowess(d$x, d$y), col = "darkgreen", lwd = 2, lty = 2)
}
par(op)

# 4. Verify slopes equal coefficients (FWL identity check)
slopes <- sapply(preds_4, function(p) coef(lm(y ~ x, data = avp_pairs[[p]]))[2])
data.frame(predictor = preds_4,
           avp_slope = round(slopes, 4),
           lm_coef   = round(unname(coef(model_4)[preds_4]), 4))
#>     predictor avp_slope lm_coef
#> hp         hp   -0.0218 -0.0218
#> wt         wt   -2.9821 -2.9821
#> cyl       cyl   -0.7401 -0.7401
#> drat     drat    1.0407  1.0407
```

Reading the panel, all four AVPs show roughly straight clouds, the loess curves track the red linear fits closely. None of the four predictors flags an obvious nonlinearity at this sample size. The slope-vs-coefficient table at the bottom confirms the FWL identity for every predictor, your visual diagnostics are anchored to the same numbers `lm()` reports. If one of those loess curves had bent dramatically, that would be your cue to add an `I(x^2)` term or a spline before trusting the linear coefficient.

## Summary

| Concept | Key takeaway |
|---|---|
| Definition | An AVP plots the residuals of `Y` (on other Xs) against the residuals of focal `X` (on other Xs). |
| Frisch-Waugh-Lovell | The OLS slope of those residuals equals the multiple-regression coefficient for the focal predictor. |
| Slope reading | Sign + magnitude reproduce the `lm()` coefficient exactly. |
| Scatter reading | Vertical spread = leftover variation; tight = focal predictor explains most of it. |
| Outliers | Stand out far better than in raw scatterplots because partialling removes confounding structure. |
| Curvature | A bent cloud says the linear fit is misspecified; consider a transformation or spline. |
| AVP vs CR plot | AVP audits *coefficients and influence*; partial residual (CR) plots audit *functional form*. |
| Production shortcut | `car::avPlots(model)` draws the panel for you (run locally in RStudio). |

## References

1. Fox, J. & Weisberg, S., *An R Companion to Applied Regression*, 3rd Edition. Sage (2019). Chapter on regression diagnostics.
2. car package documentation, `avPlots()` reference. [Link](https://search.r-project.org/CRAN/refmans/car/html/avPlots.html)
3. Lovell, M. C. (1963). Seasonal adjustment of economic time series and multiple regression analysis. *Journal of the American Statistical Association*, 58(304), 993-1010. (Origin of the FWL theorem in modern form.)
4. Belsley, D. A., Kuh, E., & Welsch, R. E., *Regression Diagnostics: Identifying Influential Data and Sources of Collinearity*. Wiley (1980).
5. Frisch, R. & Waugh, F. V. (1933). Partial Time Regressions as Compared with Individual Trends. *Econometrica*, 1(4), 387-401. [Link](https://www.jstor.org/stable/1907330)
6. Fox, J. (1991). *Regression Diagnostics: An Introduction*. Sage University Paper.
7. Cook, R. D. (1996). Added-variable plots and curvature in linear regression. *Technometrics*, 38(3), 275-278.

## Continue Learning

- [Regression Diagnostics in R: 5 Plots That Reveal Model Violations Instantly](Regression-Diagnostics-in-R.html), the parent tutorial that surveys the full diagnostic toolkit.
- [Multicollinearity in R](Multicollinearity-in-R.html), when partial slopes get unstable, AVPs alone are not enough; pair them with VIF.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), the broader assumption checklist that AVPs help you validate.
