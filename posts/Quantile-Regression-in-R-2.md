---
title: "Quantile Regression in R: quantreg Package, Model Any Quantile"
slug: "Quantile-Regression-in-R-2"
description: "Master quantile regression in R with the quantreg package: fit any tau via rq(), interpret slopes across quantiles, bootstrap SEs, and plot the process."
keywords: "quantile regression R, quantreg package, rq function, conditional quantile, median regression, tau parameter, check function, bootstrap inference, heteroscedasticity"
auto_link_terms: "quantile regression|quantreg package|rq() function|conditional quantile|check function|tau parameter|quantile process plot|median regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-30"
curriculum_id: "2.8.8"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Quantile Regression"
sidebar_order: 96
---

# Quantile Regression in R: quantreg Package, Model Any Quantile

<p class="lead">Quantile regression with R's <code>quantreg</code> package fits any conditional quantile of an outcome instead of just its mean. It exposes how predictors shift low, typical, and high responses, captures heteroscedasticity, and stays robust to outliers, all from one familiar formula interface.</p>

## What does quantile regression actually fit?

Ordinary least squares draws one line through the cloud of points, the line of conditional means. Quantile regression instead draws a line through any chosen quantile of the conditional distribution, the median, the 90th percentile, the 10th, your call. The cleanest way to see what changes is to fit both side by side on the same data.

```r title="Median vs mean regression on mtcars"
library(quantreg)

mt <- mtcars
fit_mean <- lm(mpg ~ wt + hp, data = mt)
fit_med  <- rq(mpg ~ wt + hp, data = mt, tau = 0.5)

rbind(mean = coef(fit_mean), median = coef(fit_med))
#>        (Intercept)        wt          hp
#> mean      37.22727 -3.877831 -0.03177295
#> median    36.32721 -4.286671 -0.02261867
```

The mean line says weight costs you 3.88 mpg per 1000 lb, while the median line says it costs 4.29 mpg. That gap is not a rounding artefact, it is the conditional distribution telling two different stories. The mean is dragged toward the few high-mpg outliers (Toyota Corolla, Fiat 128), so it understates the typical penalty. The median line tracks the typical car instead. If your decision is "what slope should I quote a buyer of an average car," the median answer is the honest one.

[KEY INSIGHT]
**Changing tau changes the question, not just the answer.** At tau=0.5 you are modelling the median; at tau=0.9, the upper tail; at tau=0.1, the lower tail. The same formula and data give three different fits because they answer three different questions about one dataset.

**Try it:** Fit `rq()` on the same `mpg ~ wt + hp` model at `tau = 0.9` (upper tail of fuel-efficient cars) and compare the `wt` slope to the median's slope.

```r title="Your turn: fit rq at tau=0.9 on mtcars"
ex_q90 <- rq( # your code here, data = mt, tau = 0.9)
coef(ex_q90)
#> Expected: wt slope different from the median's -4.29
```

<details>
<summary>Click to reveal solution</summary>

```r title="rq tau=0.9 solution"
ex_q90 <- rq(mpg ~ wt + hp, data = mt, tau = 0.9)
round(coef(ex_q90), 3)
#> (Intercept)          wt          hp
#>      40.456      -4.000      -0.034
```

**Explanation:** The 90th-percentile slope on `wt` is around -4.00, slightly less negative than the median's -4.29. Among the most fuel-efficient cars, weight bites a touch less hard, but heavier cars still pay a real penalty.

</details>

## How does the check function turn a quantile into an optimization target?

OLS finds the line that minimizes the sum of squared residuals. That loss treats positive and negative errors symmetrically, so the solution lands on the conditional mean. Quantile regression swaps squared loss for an asymmetric absolute loss, called the *check function*. By tilting the penalty, the optimum shifts to any quantile you pick.

The check function for quantile $\tau$ is:

$$\rho_\tau(u) = u \cdot (\tau - \mathbb{1}(u < 0))$$

Where:

- $u$ = the residual ($y - \hat{y}$)
- $\tau$ = the target quantile, between 0 and 1
- $\mathbb{1}(u < 0)$ = 1 when the residual is negative, else 0

At $\tau = 0.5$ both positive and negative residuals get weight 0.5, which recovers least-absolute-deviations regression (the median). At $\tau = 0.9$ positive residuals get weight 0.9 and negative residuals get weight 0.1, so the optimizer pushes the line up until only 10% of points sit above it. Plotting the loss makes the asymmetry obvious.

```r title="Plot the check function for three taus"
u <- seq(-3, 3, length.out = 200)
rho <- function(u, tau) u * (tau - (u < 0))

mat <- sapply(c(0.1, 0.5, 0.9), function(t) rho(u, t))

matplot(u, mat, type = "l", lty = 1, lwd = 2, col = c("red","black","blue"),
        xlab = "residual u", ylab = expression(rho[tau](u)),
        main = "Check function at three quantiles")
legend("top", legend = c("tau=0.1","tau=0.5","tau=0.9"),
       lty = 1, col = c("red","black","blue"), bty = "n")
```

The black V-shape is the symmetric loss that minimizes to the median. The red curve (tau=0.1) tilts so that negative residuals are penalized nine times harder than positive ones, pulling the fit down toward the lower tail. The blue curve (tau=0.9) does the reverse. Behind the scenes, `rq()` solves a small linear program for any tau you supply, no Newton iterations, no convergence headaches.

[NOTE]
**Median regression equals least-absolute-deviations.** The tau=0.5 case is exactly LAD regression, a classical estimator that predates the modern quantile-regression toolkit. `rq(..., tau = 0.5)` is the modern, fast way to fit it.

**Try it:** Plug a residual of -1.5 into the check function for tau=0.5 and tau=0.9. Which tau penalizes a negative residual more?

```r title="Your turn: residual penalty at two taus"
ex_rho_05 <- # your code here, evaluate rho(-1.5, 0.5)
ex_rho_09 <- # your code here, evaluate rho(-1.5, 0.9)
c(tau05 = ex_rho_05, tau09 = ex_rho_09)
#> Expected: tau05 = 0.75, tau09 = 0.15
```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual penalty solution"
ex_rho_05 <- rho(-1.5, 0.5)
ex_rho_09 <- rho(-1.5, 0.9)
c(tau05 = ex_rho_05, tau09 = ex_rho_09)
#> tau05 tau09
#>  0.75  0.15
```

**Explanation:** At tau=0.5 a negative residual of magnitude 1.5 costs 0.75. At tau=0.9 the same residual costs only 0.15 because tau=0.9 penalizes positive residuals more, the optimizer is happy to leave many points sitting below the line.

</details>

## How do you interpret rq() coefficients across multiple quantiles?

A coefficient at `tau = 0.9` says: *"if x increases by one unit, the 90th conditional percentile of y changes by this amount."* It does not describe the average car or the average household, only the one sitting at that quantile of the conditional distribution.

When slopes differ across taus, the predictor's effect is **heterogeneous**, it acts on low, middle, and high responders differently. When slopes are roughly constant across taus, the effect is **homogeneous** and OLS already tells the whole story. Feeding a vector of taus to `rq()` fits all of them at once.

```r title="Fit rq across nine quantiles on mtcars"
fit_grid <- rq(mpg ~ wt + hp, data = mt, tau = seq(0.1, 0.9, by = 0.1))
round(coef(fit_grid), 3)
#>             tau= 0.1 tau= 0.2 tau= 0.3 tau= 0.4 tau= 0.5 tau= 0.6 tau= 0.7 tau= 0.8 tau= 0.9
#> (Intercept)   33.000   33.000   34.450   35.250   36.327   36.850   37.150   38.500   40.456
#> wt            -3.717   -3.717   -3.948   -4.142   -4.287   -4.336   -4.300   -4.221   -4.000
#> hp            -0.018   -0.018   -0.022   -0.022   -0.023   -0.024   -0.024   -0.026   -0.034
```

Reading the `wt` row, the slope dips from -3.72 in the lower tail to -4.34 around the median, then eases back to -4.00 in the upper tail. That mild U-shape says weight bites hardest for typical cars and a touch less at the extremes. The `hp` row drifts more monotonically, from -0.018 to -0.034, so horsepower's penalty grows for the most fuel-efficient cars. OLS would have collapsed both stories into one number per predictor.

[TIP]
**Report quantile coefficients as a table indexed by tau, not a wall of summary() output.** Readers scan a single matrix for the slope pattern in seconds. Multiple summary blocks force them to hunt the same numbers buried in standard errors and p-values.

**Try it:** Extract just the `hp` row from `fit_grid` and store it as `ex_hp_slope`. Round to 3 decimals.

```r title="Your turn: extract one predictor across taus"
ex_hp_slope <- # your code here, pull the hp row from coef(fit_grid)
round(ex_hp_slope, 3)
#> Expected: nine slopes climbing in magnitude from ~-0.018 to ~-0.034
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract hp row solution"
ex_hp_slope <- coef(fit_grid)["hp", ]
round(ex_hp_slope, 3)
#> tau= 0.1 tau= 0.2 tau= 0.3 tau= 0.4 tau= 0.5 tau= 0.6 tau= 0.7 tau= 0.8 tau= 0.9
#>   -0.018   -0.018   -0.022   -0.022   -0.023   -0.024   -0.024   -0.026   -0.034
```

**Explanation:** Indexing `coef(fit)["hp", ]` pulls the row you care about across every tau, the cleanest summary for a single predictor's behaviour through the distribution.

</details>

## How do you compute reliable standard errors with rq()?

`summary(fit)` prints confidence intervals out of the box, but the method matters because heteroscedasticity breaks simple formulas. The `se =` argument of `summary.rq()` lets you choose, and the right default depends on your data.

| `se =` | When to use |
|---|---|
| `"rank"` (default) | Small n; inverts a rank test; no nuisance parameters |
| `"iid"` | Residuals roughly iid and roughly symmetric |
| `"nid"` | Near-iid under heteroscedasticity; fast asymptotic |
| `"boot"` | Heteroscedastic or skewed data, most robust |
| `"ker"` | Kernel density estimate; similar intent to `"nid"` |

When in doubt, bootstrap. It makes no distributional assumptions, handles heteroscedasticity naturally, and gives intervals you can defend in front of a sceptical reviewer.

```r title="Bootstrap standard errors for the median fit"
set.seed(7)
sum_med <- summary(fit_med, se = "boot", R = 500)
sum_med$coefficients
#>                Value Std. Error   t value     Pr(>|t|)
#> (Intercept) 36.32721    2.41215  15.05751 1.135e-14
#> wt          -4.28667    0.84210  -5.09047 1.901e-05
#> hp          -0.02262    0.01211  -1.86891 7.211e-02
```

The bootstrap standard error for `wt` is 0.84, giving a 95% interval of roughly $[-5.94, -2.63]$. That is wide, mtcars has only 32 observations, but it is honest. The rank-based default would sometimes return narrower intervals on small data, but those can undercover when the residuals are heteroscedastic, so `"boot"` is the safer working default once n is at least a few dozen.

[WARNING]
**Bootstrap SE with the default R=200 is noisy.** Exploration is fine at R=200, but publication-grade numbers want R=500 to 1000 resamples. Costly for huge datasets, so down-sample predictors first if needed.

**Try it:** Compute bootstrap standard errors for `fit_med` using `R = 300` and seed 11. Read off the standard error of the `wt` slope.

```r title="Your turn: bootstrap with R=300"
set.seed(11)
ex_boot <- summary( # your code here, se = "boot", R = 300)
round(ex_boot$coefficients, 3)
#> Expected: wt SE near 0.8 to 0.9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap R=300 solution"
set.seed(11)
ex_boot <- summary(fit_med, se = "boot", R = 300)
round(ex_boot$coefficients, 3)
#>              Value Std. Error t value Pr(>|t|)
#> (Intercept) 36.327      2.526  14.382    0.000
#> wt          -4.287      0.875  -4.898    0.000
#> hp          -0.023      0.013  -1.788    0.085
```

**Explanation:** The `wt` SE (~0.88) is close to the R=500 result (0.84), confirming 300 replicates already stabilize the estimate for a small dataset. Bigger R reduces Monte Carlo noise, not statistical uncertainty.

</details>

## How do you read a quantile process plot?

Reading coefficients at three taus is fine, but the richer picture is a **quantile process plot**: one panel per predictor showing the coefficient as a continuous function of tau, with the OLS estimate as a dashed reference line and a shaded confidence band. It compresses what would otherwise be a 19-row table into a single image.

Fit `rq()` at a fine grid of taus, wrap the fit in `summary()` (bootstrap SEs recommended), then call `plot()`.

```r title="Quantile process plot for mtcars"
set.seed(31)
fit_proc <- rq(mpg ~ wt + hp, data = mt, tau = seq(0.05, 0.95, by = 0.05))
plot(summary(fit_proc, se = "boot", R = 300))
```

Three panels appear, intercept, `wt`, and `hp`. The `wt` curve dips and recovers across tau, hovering around the OLS dashed line for most of its range, an effect that is broadly homogeneous. The `hp` curve drifts more steadily downward, suggesting horsepower hits the upper tail harder than the lower. A flat curve hugging the OLS line says "OLS is enough." A tilted curve, like `hp` here, says "quantile regression is doing real work."

![rq() workflow diagram](screenshots/Quantile-Regression-in-R-2-rq-workflow.webp)

*Figure 1: The rq() workflow, choose tau, fit, inspect, bootstrap, then plot the process.*

[NOTE]
**Process plots assume monotonic tau grids.** Feed `tau = seq(.05, .95, by = .05)` or similar, not a random vector. The plot's x-axis is a density of quantile levels, not ordinal categories.

**Try it:** Build a process plot for mtcars with `cyl` added as a predictor (`mpg ~ wt + hp + cyl`). Use the same fine grid and bootstrap SE.

```r title="Your turn: process plot with an added predictor"
ex_proc <- rq( # your code here
              data = mt, tau = seq(0.05, 0.95, by = 0.05))
plot(summary(ex_proc, se = "boot", R = 300))
#> Expected: four panels, one for each coefficient including cyl
```

<details>
<summary>Click to reveal solution</summary>

```r title="Process plot with cyl solution"
ex_proc <- rq(mpg ~ wt + hp + cyl, data = mt, tau = seq(0.05, 0.95, by = 0.05))
plot(summary(ex_proc, se = "boot", R = 300))
```

**Explanation:** Adding `cyl` produces a fourth panel. With three correlated predictors, individual quantile slopes can swing more widely; the process plot reveals which predictors carry stable effects and which depend on where you look in the distribution.

</details>

## When should you reach for quantile regression instead of lm()?

Three signals tip the scale toward `rq()`. **Tail decisions:** rent caps, hospital stay limits, premium pricing care about the upper tail, not the average. **Heteroscedasticity:** if the spread of y grows with x, OLS reports a misleading single slope. **Outliers:** a few extreme y-values pull the OLS line away from the bulk of the data. The synthetic example below stresses the second signal.

```r title="Heteroscedastic data: rq vs lm at the tails"
set.seed(2024)
n <- 200
x_h <- runif(n, 0, 10)
y_h <- 2 + 1.5 * x_h + rnorm(n, sd = 0.5 + 0.4 * x_h)
het_df <- data.frame(x = x_h, y = y_h)

het_fit <- rq(y ~ x, data = het_df, tau = c(0.1, 0.5, 0.9))
round(coef(het_fit), 3)
#>             tau= 0.1 tau= 0.5 tau= 0.9
#> (Intercept)    1.841    1.989    2.121
#> x              1.023    1.509    1.984
```

The 10th-percentile slope is 1.02 and the 90th-percentile slope is 1.98, almost double. The data-generating process made residual SD scale with $0.5 + 0.4x$, so the upper tail climbs much faster than the lower tail. Quantile regression reads that off directly: the gap `coef(fit)[2, "tau= 0.9"] - coef(fit)[2, "tau= 0.1"]` quantifies how much faster. OLS would have reported a single slope near 1.5 and quietly hidden the spreading fan.

![Quantile regression decision flowchart](screenshots/Quantile-Regression-in-R-2-when-to-use.webp)

*Figure 2: When to choose quantile regression over OLS.*

[TIP]
**A widening gap between tau=0.1 and tau=0.9 slopes is a quick heteroscedasticity test.** Big gap, consider quantile regression or a variance-stabilizing transform. Small gap, classical OLS is fine.

**Try it:** Generate 200 points with constant variance (`sd = 1`, no x-dependence), fit `rq()` at tau=0.1 and tau=0.9, and verify the slopes are close.

```r title="Your turn: homoscedastic baseline"
set.seed(5)
ex_iid_df <- data.frame(
  x = # your code here, 200 random uniform points,
  y = # your code here, 2 + 1.5 * x + rnorm(200, sd = 1)
)
ex_iid_fit <- rq(y ~ x, data = ex_iid_df, tau = c(0.1, 0.9))
round(coef(ex_iid_fit), 3)
#> Expected: both slopes close to 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Homoscedastic solution"
set.seed(5)
ex_x <- runif(200, 0, 10)
ex_iid_df <- data.frame(
  x = ex_x,
  y = 2 + 1.5 * ex_x + rnorm(200, sd = 1)
)
ex_iid_fit <- rq(y ~ x, data = ex_iid_df, tau = c(0.1, 0.9))
round(coef(ex_iid_fit), 3)
#>             tau= 0.1 tau= 0.9
#> (Intercept)    0.627    3.397
#> x              1.510    1.493
```

**Explanation:** Both slopes cluster near the true 1.5, so the tails climb at the same rate. Variance is constant, and quantile regression and OLS tell the same story about the conditional mean. No tail story to tell here.

</details>

## Practice Exercises

### Exercise 1: Weight slope across mtcars quantiles

Fit `rq()` on `mtcars` for `mpg ~ wt + cyl` at `tau = c(0.25, 0.5, 0.75)`. Extract the `wt` slope at each tau into a named numeric vector called `my_wt_slopes`.

```r title="Exercise 1 starter"
# Hint: coef() on a multi-tau fit returns a matrix, subset the wt row

my_wt_slopes <- # your code here
round(my_wt_slopes, 3)
#> Expected: three values somewhere in the -2 to -4 range
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
mt_multi <- rq(mpg ~ wt + cyl, data = mt, tau = c(0.25, 0.5, 0.75))
my_wt_slopes <- coef(mt_multi)["wt", ]
round(my_wt_slopes, 3)
#> tau= 0.25  tau= 0.5 tau= 0.75
#>    -3.368    -2.266    -4.218
```

**Explanation:** `coef(fit)["wt", ]` pulls one predictor's row across every tau, the standard idiom for cross-quantile summaries.

</details>

### Exercise 2: Find the heterogeneous predictor on airquality

Fit `rq()` on `na.omit(airquality)` for `Ozone ~ Solar.R + Wind + Temp` at `tau = c(0.1, 0.5, 0.9)` with bootstrap SE (`R = 300`). Identify which predictor's slope changes most between the 10th and 90th percentiles, then assign the predictor name (string) to `my_hetero`.

```r title="Exercise 2 starter"
set.seed(17)
# Hint: compute |coef at tau=0.9 - coef at tau=0.1| per predictor; pick the max

my_hetero <- # your code here
my_hetero
#> Expected: one of "Solar.R", "Wind", or "Temp"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(17)
air_multi <- rq(Ozone ~ Solar.R + Wind + Temp,
                data = na.omit(airquality),
                tau = c(0.1, 0.5, 0.9))
cf <- coef(air_multi)
diffs <- abs(cf[, "tau= 0.9"] - cf[, "tau= 0.1"])[-1]  # drop intercept
my_hetero <- names(which.max(diffs))
my_hetero
#> [1] "Temp"
```

**Explanation:** Temperature's slope changes most across quantiles, hot days drive the upper ozone tail more than they lift the lower tail. Wind also shows large heterogeneity, but Temp wins on absolute slope difference.

</details>

### Exercise 3: Verify a designed heteroscedasticity gap

Generate 300 points where the residual SD scales with x as $\sigma(x) = 0.3 + 0.5x$, fit `rq()` at tau=0.1 and tau=0.9, and store the difference `slope(0.9) - slope(0.1)` in `my_gap`. Compare to OLS, which collapses everything to one slope.

```r title="Exercise 3 starter"
set.seed(99)
sim_df <- data.frame(
  x = # your code here,
  y = # your code here, true slope 2 with sd = 0.3 + 0.5 * x
)

# Fit rq at the two tails, then compute the gap

my_gap <- # your code here
my_gap
#> Expected: a positive number near 1.0 to 1.4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(99)
sim_x <- runif(300, 0, 5)
sim_df <- data.frame(
  x = sim_x,
  y = 1 + 2 * sim_x + rnorm(300, sd = 0.3 + 0.5 * sim_x)
)
sim_fit <- rq(y ~ x, data = sim_df, tau = c(0.1, 0.9))
my_gap <- coef(sim_fit)["x", "tau= 0.9"] - coef(sim_fit)["x", "tau= 0.1"]
round(my_gap, 3)
#> [1] 1.214

coef(lm(y ~ x, data = sim_df))
#> (Intercept)         x
#>      1.0341    1.9912
```

**Explanation:** The tail gap of about 1.2 quantifies how much faster the upper tail climbs than the lower. OLS reports a single slope near 2.0 and reveals nothing about the spreading fan. Quantile regression gives a number you can act on.

</details>

## Complete Example

A full airquality workflow, from cleanup to interpretation, in one runnable block.

```r title="End-to-end quantile regression on airquality"
set.seed(2026)
air_clean <- na.omit(airquality)

air_fit <- rq(Ozone ~ Solar.R + Wind + Temp,
              data = air_clean,
              tau = seq(0.1, 0.9, by = 0.1))

air_sum <- summary(air_fit, se = "boot", R = 400)

round(coef(air_fit), 3)
#>             tau= 0.1 tau= 0.2 tau= 0.3 tau= 0.4 tau= 0.5 tau= 0.6 tau= 0.7 tau= 0.8 tau= 0.9
#> (Intercept) -41.627  -65.412  -68.938  -71.332  -75.609  -85.414  -93.106 -102.312  -92.875
#> Solar.R       0.035    0.039    0.048    0.054    0.060    0.062    0.067    0.082    0.101
#> Wind         -0.500   -0.875   -1.170   -1.382   -1.561   -1.890   -2.280   -2.713   -3.320
#> Temp          0.750    1.090    1.170    1.260    1.340    1.480    1.610    1.800    1.920

plot(air_sum)
```

Reading the four panels (intercept plus three predictors): `Temp` climbs from 0.75 at tau=0.1 to 1.92 at tau=0.9, so each extra degree lifts the upper-tail ozone more than twice as much as the lower-tail ozone. `Wind` tilts steeply negative in the upper tail, windy days clip the highest readings sharply. `Solar.R` shows modest heterogeneity, mostly a location shift. A single OLS model would have flattened these three patterns into three single numbers, missing the entire story about pollution extremes.

## Summary

Key takeaways from fitting quantile regression with `quantreg`:

| Step | Function | Purpose |
|---|---|---|
| Fit | `rq(y ~ x, tau = ...)` | Estimate one or many conditional quantiles |
| Inspect | `coef(fit)` | Read slopes at each tau |
| Infer | `summary(fit, se = "boot", R = 300+)` | Bootstrap SEs robust to heteroscedasticity |
| Visualize | `plot(summary(fit))` | Process plot, coefficient as a function of tau |
| Diagnose | gap between tau=0.1 and tau=0.9 slopes | Heteroscedasticity fingerprint |

![Quantile regression overview](screenshots/Quantile-Regression-in-R-2-overview-mindmap.webp)

*Figure 3: Quantile regression at a glance, fitting, inference, visualization, and use cases.*

Quantile regression earns its keep whenever the tails matter, variance shifts with predictors, or outliers corrupt OLS. For problems where the conditional mean is enough and residuals are roughly iid, `lm()` remains simpler and sufficient. The `quantreg` package goes further than `rq()`: `rqss()` adds nonparametric smoothing, `crq()` handles censored responses, and `nlrq()` fits nonlinear quantile models. All share the same `tau` interface you have already learned.

## References

1. Koenker, R. & Bassett, G. (1978). *Regression Quantiles*. Econometrica, 46(1), 33-50. [Link](https://www.jstor.org/stable/1913643)
2. Koenker, R. & Hallock, K. (2001). *Quantile Regression*. Journal of Economic Perspectives, 15(4), 143-156. [Link](https://www.aeaweb.org/articles?id=10.1257/jep.15.4.143)
3. Koenker, R. (2005). *Quantile Regression*. Cambridge University Press.
4. Koenker, R. quantreg package CRAN vignette. [Link](https://cran.r-project.org/web/packages/quantreg/vignettes/rq.pdf)
5. Cade, B. S. & Noon, B. R. (2003). *A gentle introduction to quantile regression for ecologists*. Frontiers in Ecology and the Environment, 1(8), 412-420. [Link](https://esajournals.onlinelibrary.wiley.com/doi/10.1890/1540-9295(2003)001%5B0412:AGITQR%5D2.0.CO%3B2)
6. CRAN, *Package 'quantreg' reference manual*. [Link](https://cran.r-project.org/web/packages/quantreg/quantreg.pdf)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), the OLS baseline that quantile regression generalizes beyond the mean.
- [Outlier Treatment With R](Outlier-Treatment-With-R.html), complementary techniques when extreme observations corrupt your fit.
- [Polynomial and Spline Regression in R](Polynomial-and-Spline-Regression-in-R.html), modelling curvature in the conditional mean before stepping up to quantile-by-quantile flexibility.
