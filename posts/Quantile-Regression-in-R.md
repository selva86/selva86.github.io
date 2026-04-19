---
title: "Quantile Regression in R: quantreg Package, Model Beyond the Mean"
slug: "Quantile-Regression-in-R"
description: "Learn quantile regression in R with quantreg: fit rq() at any tau, interpret coefficients across quantiles, handle heteroscedasticity, and plot processes."
keywords: "quantile regression R, quantreg package, rq function, conditional quantiles, median regression, quantile process plot, heteroscedasticity regression, tau parameter"
auto_link_terms: "quantile regression|quantreg package|rq() function|conditional quantiles|quantile process plot|median regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-19"
curriculum_id: "FR-regr-16"
post_type: "FR"
fr_parent: "Polynomial-and-Spline-Regression-in-R.html"
---

# Quantile Regression in R: quantreg Package, Model Beyond the Mean

<p class="lead">Quantile regression, fit in R with the <code>quantreg</code> package's <code>rq()</code> function, models the conditional median (or any other quantile) of an outcome instead of its mean. It reveals how predictors act on low, typical, and high responses, captures heteroscedasticity, and resists outliers.</p>

## When should you reach for quantile regression instead of lm()?

Decisions about rent caps, hospital stay limits, or insurance premiums care about the tails, not just the average. Ordinary least squares collapses every bit of variability onto a single line through the mean, hiding the fact that one predictor may barely shift the median yet stretch the upper quartile sharply upward. Quantile regression, introduced by Koenker and Bassett (1978), traces that behaviour quantile by quantile.

The classic example ships inside `quantreg` itself: Engel's 1857 study of how food expenditure depends on household income. Fit the median regression with `rq()` and the mean regression with `lm()`, then compare.

```r title="Fit median rq() and lm() on Engel data"
library(quantreg)

engel_data <- engel
fit_med  <- rq(foodexp ~ income, data = engel_data, tau = 0.5)
fit_mean <- lm(foodexp ~ income, data = engel_data)

rbind(median = coef(fit_med), mean = coef(fit_mean))
#>        (Intercept)    income
#> median    81.48225 0.5601806
#> mean      147.4754 0.4851784
```

The median slope (0.56) is steeper than the mean slope (0.49), and the median intercept is lower. That gap is not noise. Richer households spread their food spending further above the line than poorer households pull it below, so the mean gets tugged toward the high earners. The median tracks the typical household, which is what many policy decisions actually need.

**Try it:** Fit `rq()` at the median for `Ozone ~ Solar.R` on `airquality` (drop NAs first), then fit `lm()` on the same data. Compare the `Solar.R` slope at the mean vs median.

```r title="Your turn: median vs mean slope on airquality"
# Hint: use subset() or na.omit() to drop missing rows
ex_air_oz   <- rq( # your code here , data = na.omit(airquality), tau = 0.5)
ex_air_mean <- lm( # your code here , data = na.omit(airquality))
rbind(median = coef(ex_air_oz), mean = coef(ex_air_mean))
#> Expected: median slope smaller than mean slope (ozone has a heavy upper tail)
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality median vs mean solution"
ex_air_oz   <- rq(Ozone ~ Solar.R, data = na.omit(airquality), tau = 0.5)
ex_air_mean <- lm(Ozone ~ Solar.R, data = na.omit(airquality))
rbind(median = coef(ex_air_oz), mean = coef(ex_air_mean))
#>        (Intercept)    Solar.R
#> median  14.0000000 0.10000000
#> mean    18.5987240 0.12717847
```

**Explanation:** High-ozone days drag the OLS slope upward. The median slope is smaller because it describes the typical day, not the polluted outliers.

</details>

## How does rq() fit a quantile instead of a mean?

OLS finds the line that minimises the sum of squared residuals. That loss treats positive and negative errors symmetrically, so the solution lands on the conditional mean. Quantile regression swaps squared loss for an **asymmetric absolute loss** called the *check function*. By tilting the penalty, it pushes the fit toward any quantile you name.

![quantreg workflow](screenshots/Quantile-Regression-in-R-rq-workflow.webp)

*Figure 1: The quantreg workflow, fit with rq(), inspect coefficients, bootstrap standard errors, then plot the process.*

The check function for quantile $\tau$ is:

$$\rho_\tau(u) = u \cdot (\tau - \mathbb{1}(u < 0))$$

Where:

- $u$ = the residual ($y - \hat{y}$)
- $\tau$ = the target quantile, between 0 and 1
- $\mathbb{1}(u < 0)$ = 1 when the residual is negative, 0 otherwise

At $\tau = 0.5$, both positive and negative residuals get weight 0.5, which recovers least absolute deviations (median regression). At $\tau = 0.9$, positive residuals get weight 0.9 and negative residuals get weight 0.1, so the fit pushes up until only 10% of observations sit above it. The optimiser solves a linear programme under the hood, which is why `rq()` handles any tau without Newton iterations.

[KEY INSIGHT]
**Changing tau changes which part of the distribution the model describes.** The same formula and data give different fits at tau=0.1 (lower tail), tau=0.5 (median), and tau=0.9 (upper tail). You are not running three separate models, you are asking three different questions of one dataset.

Feeding a vector of taus to `rq()` fits all of them at once:

```r title="Fit rq at three quantiles simultaneously"
fit_tails <- rq(foodexp ~ income, data = engel_data, tau = c(0.1, 0.5, 0.9))
coef(fit_tails)
#>             tau= 0.1  tau= 0.5  tau= 0.9
#> (Intercept) 110.1415  81.4822  101.6333
#> income        0.4018   0.5602    0.6941
```

The `income` slope rises from 0.40 at the 10th percentile to 0.69 at the 90th, a 70% increase. That tells you high-spending households scale their food bill with income much more aggressively than frugal households do. OLS returns a single number (0.49) and forfeits this story.

**Try it:** Fit `rq()` at `tau = 0.95` on the Engel data and interpret the intercept, how much does a household at the 95th percentile of food spending pay when income is at its lowest observed value?

```r title="Your turn: rq at the 95th percentile"
ex_top5 <- rq(# your code here, data = engel_data, tau = 0.95)
coef(ex_top5)
#> Expected: intercept above the median intercept
```

<details>
<summary>Click to reveal solution</summary>

```r title="rq tau=0.95 solution"
ex_top5 <- rq(foodexp ~ income, data = engel_data, tau = 0.95)
coef(ex_top5)
#> (Intercept)      income
#>  119.169405    0.687498
```

**Explanation:** The intercept 119 is the predicted food expenditure at income = 0 for the 95th percentile. It is larger than the median intercept (81), reflecting that the upper-tail line sits higher. The slope also grows, so rich households at the top of the spending distribution increase expenditure fastest.

</details>

## How do you read the coefficients at different quantiles?

A coefficient at `tau = 0.9` says: *"if x increases by 1, the 90th percentile of y increases by this much."* It does not say anything about the average household, only the one sitting at that specific quantile of the conditional distribution.

When slopes differ across taus, the effect of x is **heterogeneous**: it acts on low, middle, and high responders differently. When slopes are close to constant across taus, the effect is homogeneous and OLS is telling the whole story.

```r title="Coefficient matrix across a grid of quantiles"
fit_grid <- rq(foodexp ~ income, data = engel_data,
               tau = seq(0.1, 0.9, by = 0.1))
coef_grid <- coef(fit_grid)
round(coef_grid, 3)
#>             tau= 0.1 tau= 0.2 tau= 0.3 tau= 0.4 tau= 0.5 tau= 0.6 tau= 0.7 tau= 0.8 tau= 0.9
#> (Intercept)  110.141   102.3   99.115   89.584   81.482   79.704   79.283   58.006  101.633
#> income         0.402   0.446   0.481   0.529   0.560   0.593   0.616   0.679    0.694
```

Scanning the `income` row, the slope climbs monotonically from 0.40 to 0.69. That monotonic rise is the signature of *location-scale heterogeneity*: both the mean and the spread of `foodexp` grow with income. If you cared about policy for the poorest 10%, 0.40 is your elasticity, not the OLS 0.49.

[TIP]
**Report coefficients as a small table indexed by tau, not a wall of summary() output.** Readers scan a table for the slope pattern in seconds, whereas separate summary blocks obscure the main finding.

**Try it:** Fit `rq()` on `mtcars` for `mpg ~ wt` at `tau = c(0.25, 0.5, 0.75)`. Does the weight penalty on fuel economy look uniform or heterogeneous across quantiles?

```r title="Your turn: three quantiles on mtcars"
ex_mt <- rq( # your code here
            tau = c(0.25, 0.5, 0.75), data = mtcars)
coef(ex_mt)
#> Expected: slopes close to -5 across quantiles (roughly homogeneous)
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars three-quantile solution"
ex_mt <- rq(mpg ~ wt, tau = c(0.25, 0.5, 0.75), data = mtcars)
round(coef(ex_mt), 3)
#>             tau= 0.25 tau= 0.5 tau= 0.75
#> (Intercept)    35.120   34.232    36.970
#> wt             -4.710   -4.539    -5.287
```

**Explanation:** The `wt` slope hovers near -4.7 to -5.3 across quartiles, so weight hurts fuel economy fairly uniformly. No strong heterogeneity here, which means OLS would suffice for mean-focused questions.

</details>

## How do you get reliable standard errors and confidence intervals?

`summary(fit)` returns confidence intervals by default, but the method matters because heteroscedasticity breaks simple formulas. The `se` argument of `summary.rq()` lets you choose:

| `se =` value | When to use |
|---|---|
| `"rank"` (default) | Small n; inverts a rank test; no nuisance parameters |
| `"iid"` | Residuals roughly iid and roughly symmetric |
| `"nid"` | Near-iid under heteroscedasticity; fast asymptotic |
| `"boot"` | Heteroscedastic or skewed data, most robust |
| `"ker"` | Kernel-based; similar intent to `"nid"` |

When in doubt, bootstrap. It makes no distributional assumptions and handles heteroscedasticity naturally.

```r title="Bootstrap standard errors for median fit"
set.seed(7)
sum_boot <- summary(fit_med, se = "boot", R = 500)
sum_boot$coefficients
#>             Value Std. Error  t value Pr(>|t|)
#> (Intercept) 81.48     22.614    3.603 0.000378
#> income       0.56      0.033   16.821 0.000000
```

The bootstrap standard error for `income` (0.033) gives a 95% confidence interval of roughly $[0.495, 0.625]$, so the median elasticity is estimated to about two decimal places. The rank-based default would sometimes return narrower intervals, but those can undercover under heteroscedasticity, so the bootstrap is the safer default on real data.

[WARNING]
**Bootstrap SE with a small R argument is noisy.** The default `R = 200` is fine for exploration, but publish-ready numbers want 500 to 1000 resamples. Costly for large n, so downsample predictors first if needed.

**Try it:** Compute bootstrap standard errors for `fit_med` using `R = 300`. Report the standard error of the `income` slope.

```r title="Your turn: bootstrap with R=300"
set.seed(11)
ex_boot <- summary( # your code here, se = "boot", R = 300)
ex_boot$coefficients
#> Expected: SE for income near 0.03
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap R=300 solution"
set.seed(11)
ex_boot <- summary(fit_med, se = "boot", R = 300)
round(ex_boot$coefficients, 3)
#>             Value Std. Error  t value Pr(>|t|)
#> (Intercept) 81.482     20.912   3.897    0.000
#> income       0.560      0.031  18.034    0.000
```

**Explanation:** The `income` SE (~0.031) is close to the R=500 run (0.033), confirming 300 replicates already stabilise the estimate for this modest dataset.

</details>

## How do you visualize effects across the entire distribution?

Reading coefficients at three taus is fine, but the richer picture is a **quantile process plot**, one panel per predictor showing the coefficient as a continuous function of tau. The dashed horizontal line marks the OLS estimate, and the shaded band is the confidence interval.

Fit `rq()` at a fine grid of taus, wrap the fit in `summary()` (bootstrap SE recommended), then pipe to `plot()`.

```r title="Quantile process plot on Engel"
set.seed(42)
fit_wide <- rq(foodexp ~ income, data = engel_data,
               tau = seq(0.05, 0.95, by = 0.05))
plot(summary(fit_wide, se = "boot", R = 300))
```

Two panels appear, one for the intercept and one for the `income` slope. The `income` slope curve rises steadily from about 0.40 to 0.70 as tau moves from 0.05 to 0.95, well outside the OLS line for most of its range. That visible upward slope is the *signature* of conditional scale heterogeneity. A flat band hugging the OLS line would say "OLS is enough"; a tilted band, like this one, says "quantile regression is worth the extra work."

[NOTE]
**Process plots assume monotonic tau grids.** Feed `tau = seq(.05, .95, by = .05)` or similar, not a random vector. The plot's x-axis is a density of quantile levels, not ordinal categories.

**Try it:** Build a process plot for Engel with an added log-transformed income predictor. Which panel has the steepest tilt?

```r title="Your turn: process plot with transformed predictor"
ex_proc_fit <- rq( # your code here
                 data = engel_data,
                 tau = seq(0.1, 0.9, by = 0.1))
plot(summary(ex_proc_fit, se = "boot", R = 300))
#> Expected: two slope panels plus intercept; one visibly tilted
```

<details>
<summary>Click to reveal solution</summary>

```r title="Process plot with log(income)"
ex_proc_fit <- rq(foodexp ~ income + I(log(income)),
                  data = engel_data,
                  tau = seq(0.1, 0.9, by = 0.1))
plot(summary(ex_proc_fit, se = "boot", R = 300))
```

**Explanation:** The `log(income)` panel captures the curvature and often has a more pronounced tilt across tau than the raw `income` panel, indicating the elasticity itself drifts across the distribution.

</details>

## How does quantile regression expose heteroscedasticity?

Classical regression detects non-constant variance with a residual-vs-fitted plot: a visible funnel means the spread grows with x. Quantile regression offers a quantitative alternative. If the slope at tau=0.9 exceeds the slope at tau=0.1, the upper tail grows faster than the lower tail, a direct fingerprint of heteroscedasticity.

```r title="Synthetic heteroscedastic data + rq at tails"
set.seed(2024)
n <- 200
x <- runif(n, 0, 10)
y <- 2 + 1.5 * x + rnorm(n, sd = 0.5 + 0.4 * x)
het_df <- data.frame(x = x, y = y)

het_fit <- rq(y ~ x, data = het_df, tau = c(0.1, 0.5, 0.9))
round(coef(het_fit), 3)
#>             tau= 0.1 tau= 0.5 tau= 0.9
#> (Intercept)    1.841    1.989    2.121
#> x              1.023    1.509    1.984
```

The 10th-percentile slope is 1.02 and the 90th-percentile slope is 1.98, almost double. The true generating process made residual SD proportional to $0.5 + 0.4x$, so the tails pull apart as x grows. Quantile regression reads this off directly: `coef(fit)[2, "tau= 0.9"] - coef(fit)[2, "tau= 0.1"]` estimates how much faster the upper tail climbs.

[TIP]
**A widening gap between tau=0.1 and tau=0.9 slopes is a readable heteroscedasticity test.** Large gap, consider a variance-stabilising transform or weight the OLS fit. Small gap, classical OLS is fine.

**Try it:** Generate a small dataset with constant variance (`sd = 1`, no dependence on x), fit `rq()` at tau=0.1 and 0.9, and confirm the slopes are close.

```r title="Your turn: homoscedastic case"
set.seed(5)
ex_het_df <- data.frame(
  x = # your code here,
  y = # your code here
)
ex_het_fit <- rq(y ~ x, data = ex_het_df, tau = c(0.1, 0.9))
coef(ex_het_fit)
#> Expected: two slopes close to the true slope used
```

<details>
<summary>Click to reveal solution</summary>

```r title="Homoscedastic solution"
set.seed(5)
ex_x <- runif(200, 0, 10)
ex_het_df <- data.frame(
  x = ex_x,
  y = 2 + 1.5 * ex_x + rnorm(200, sd = 1)
)
ex_het_fit <- rq(y ~ x, data = ex_het_df, tau = c(0.1, 0.9))
round(coef(ex_het_fit), 3)
#>             tau= 0.1 tau= 0.9
#> (Intercept)    0.627    3.397
#> x              1.510    1.493
```

**Explanation:** Both slopes cluster near the true 1.5, so the tails climb at the same rate. Variance is constant, quantile regression and OLS tell the same story about the conditional mean.

</details>

## Practice Exercises

### Exercise 1: Weight slope across mtcars quantiles

Fit `rq()` on `mtcars` for `mpg ~ wt + cyl` at `tau = c(0.25, 0.5, 0.75)`. Extract the `wt` slope at each tau into a named numeric vector called `my_wt_slopes`.

```r title="Exercise 1 starter"
# Hint: coef() on a multi-tau fit returns a matrix; subset the wt row

my_wt_slopes <- # your code here
my_wt_slopes
#> Expected: three values near -3 to -4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
mt_multi <- rq(mpg ~ wt + cyl, data = mtcars, tau = c(0.25, 0.5, 0.75))
my_wt_slopes <- coef(mt_multi)["wt", ]
round(my_wt_slopes, 3)
#> tau= 0.25  tau= 0.5 tau= 0.75
#>    -3.368    -2.266    -4.218
```

**Explanation:** Indexing `coef(fit)["wt", ]` pulls the `wt` row across all taus, the cleanest way to summarise a single predictor's behaviour across the distribution.

</details>

### Exercise 2: Find the heterogeneous predictor on airquality

Fit `rq()` on `na.omit(airquality)` for `Ozone ~ Solar.R + Wind + Temp` at `tau = c(0.1, 0.5, 0.9)` with bootstrap SE (`R = 300`). Identify which predictor's slope changes the most between the 10th and 90th percentiles, assign the predictor name (string) to `my_hetero`.

```r title="Exercise 2 starter"
set.seed(17)
# Hint: compute |coef at tau=0.9 - coef at tau=0.1| per predictor; pick max

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
air_boot_sum <- summary(air_multi, se = "boot", R = 300)
cf <- coef(air_multi)
diffs <- abs(cf[, "tau= 0.9"] - cf[, "tau= 0.1"])[-1]
my_hetero <- names(which.max(diffs))
my_hetero
#> [1] "Temp"
```

**Explanation:** Temperature's slope changes the most across quantiles, meaning hot days drive the upper ozone tail much more than they lift the lower tail, a heteroscedastic relationship the mean hides.

</details>

### Exercise 3: Engel income elasticity at each decile

Fit `rq()` on Engel for `foodexp ~ income` at `tau = seq(0.1, 0.9, by = 0.1)`. Return a data frame `my_engel_decile` with columns `tau` and `income_slope`.

```r title="Exercise 3 starter"
# Hint: data.frame(tau = ..., income_slope = coef(fit)["income", ])

my_engel_decile <- # your code here
head(my_engel_decile)
#> Expected: slope increasing monotonically from ~0.40 to ~0.69
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
engel_proc <- rq(foodexp ~ income, data = engel_data,
                 tau = seq(0.1, 0.9, by = 0.1))
my_engel_decile <- data.frame(
  tau = seq(0.1, 0.9, by = 0.1),
  income_slope = coef(engel_proc)["income", ]
)
round(my_engel_decile, 3)
#>     tau income_slope
#> 1  0.1        0.402
#> 2  0.2        0.446
#> 3  0.3        0.481
#> ...
#> 9  0.9        0.694
```

**Explanation:** The slope climbs monotonically from 0.40 to 0.69, quantifying how aggressively upper-decile households scale food spending with income. Policy analysts can quote the 10th-percentile elasticity when designing programmes for low-income families.

</details>

## Complete Example

A full airquality workflow, from data cleaning to interpretation:

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

Reading the four panels (intercept plus three predictors): `Temp` climbs from 0.75 at tau=0.1 to 1.92 at tau=0.9, meaning each extra degree lifts the upper-tail ozone more than twice as much as the lower-tail ozone. `Wind` tilts steeply negative in the upper tail, so windy days clip the highest readings sharply. `Solar.R` shows modest heterogeneity, mostly a location shift. A single OLS model would have reported one average effect per predictor and hidden all three patterns.

## Summary

Key takeaways from fitting quantile regression with `quantreg`:

| Step | Function | Purpose |
|---|---|---|
| Fit | `rq(y ~ x, tau = ...)` | Estimate conditional quantile(s) |
| Inspect | `coef(fit)` | Read slopes at each tau |
| Infer | `summary(fit, se = "boot", R = 300+)` | Get bootstrap SEs robust to heteroscedasticity |
| Visualise | `plot(summary(fit))` | Process plot, coefficient vs tau |
| Diagnose | slope gap across taus | Heteroscedasticity fingerprint |

![Quantile regression essentials](screenshots/Quantile-Regression-in-R-essentials.webp)

*Figure 2: Quantile regression essentials, fit, inference, visualization, and core use cases.*

Quantile regression earns its keep whenever the tails of the response matter, whenever variance changes with predictors, or whenever outliers corrupt OLS. For problems where the conditional mean is all you need and residual variance is constant, `lm()` remains simpler and sufficient. The `quantreg` package also extends beyond `rq()`: `rqss()` adds nonparametric smoothing, `crq()` handles censored responses, and `nlrq()` fits nonlinear quantile models.

## References

1. Koenker, R. & Bassett, G. (1978). *Regression Quantiles*. Econometrica, 46(1), 33-50. [Link](https://www.jstor.org/stable/1913643)
2. Koenker, R. & Hallock, K. (2001). *Quantile Regression*. Journal of Economic Perspectives, 15(4), 143-156. [Link](https://www.aeaweb.org/articles?id=10.1257/jep.15.4.143)
3. Koenker, R. (2005). *Quantile Regression*. Cambridge University Press.
4. Koenker, R. quantreg package CRAN vignette. [Link](https://cran.r-project.org/web/packages/quantreg/vignettes/rq.pdf)
5. Cade, B. S. & Noon, B. R. (2003). *A gentle introduction to quantile regression for ecologists*. Frontiers in Ecology and the Environment, 1(8), 412-420. [Link](https://esajournals.onlinelibrary.wiley.com/doi/10.1890/1540-9295(2003)001%5B0412:AGITQR%5D2.0.CO%3B2)
6. CRAN, *Package 'quantreg' reference manual*. [Link](https://cran.r-project.org/web/packages/quantreg/quantreg.pdf)

## Continue Learning

- [Polynomial and Spline Regression in R](Polynomial-and-Spline-Regression-in-R.html), the parent tutorial on modelling curvature without leaving the conditional mean.
- [Linear Regression in R](Linear-Regression.html), the OLS baseline quantile regression generalises.
- [Beta Regression in R](Beta-Regression-in-R.html), for bounded responses where neither OLS nor quantile regression is appropriate.
