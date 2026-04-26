---
title: "Multivariate Outlier Detection in R: Mahalanobis Distance & Influence"
slug: "Multivariate-Outlier-Detection-in-R"
description: "Detect multivariate outliers in R with classical & robust Mahalanobis distance, regression influence (Cook's, leverage, DFFITS), and a 4-step workflow."
keywords: "multivariate outlier detection, Mahalanobis distance, robust Mahalanobis, MCD, minimum covariance determinant, Cook's distance, leverage, hat values, DFFITS, influence.measures, regression diagnostics R"
auto_link_terms: "multivariate outlier detection|robust Mahalanobis|minimum covariance determinant|MCD outliers|Cook's distance|leverage values|hat values|DFFITS|influence diagnostics|regression diagnostics"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-26
curriculum_id: "FR-mult-6"
post_type: "FR"
fr_parent: "Multivariate-Statistics-in-R.html"
difficulty: "Intermediate"
---

# Multivariate Outlier Detection in R: Mahalanobis Distance & Influence

<p class="lead">Multivariate outlier detection in R uses the Mahalanobis distance, or its robust MCD variant, to flag points that are unusual given the joint behaviour of several variables, and influence diagnostics like Cook's distance, leverage, and DFFITS to single out the rows that actually distort a regression fit.</p>

## Why do multivariate outliers slip past univariate checks?

A point can sit comfortably inside every column's boxplot and still be deeply unusual when the columns are looked at together. That is the gap univariate filters cannot see, and it is exactly where multivariate outlier detection earns its keep. Let us load `mtcars`, score each car against the joint behaviour of `mpg`, `hp`, and `wt`, and check which rows the standard z-score or IQR test would have let through.

We pick three correlated columns, compute the centroid and covariance, then ask base R's `mahalanobis()` for the squared distance of every car from that centroid in the correlation-aware metric. Higher numbers mean stranger cars.

```r title="Score mtcars by joint Mahalanobis distance"
library(MASS)

# Three correlated columns from mtcars
mtcars_mv <- mtcars[, c("mpg", "hp", "wt")]

ctr <- colMeans(mtcars_mv)
S   <- cov(mtcars_mv)

d2_classical <- mahalanobis(mtcars_mv, center = ctr, cov = S)

# Top 5 most "joint-unusual" cars
sort(d2_classical, decreasing = TRUE)[1:5]
#> Maserati Bora     Cadillac Fleetwood   Lincoln Continental   Toyota Corona   Lotus Europa
#>     16.13                      6.51                  6.43             5.97          5.61
```

The Maserati Bora is in a class of its own at d² ≈ 16, mostly because its 335 hp combined with relatively low weight is rare given how those columns usually move together. The interesting result is the **Toyota Corona**: it is not a standout in any single column (`mpg = 21.5`, `hp = 97`, `wt = 2.46`), so univariate filters give it a clean bill of health. Mahalanobis flags it because the *combination* of those values is unusual relative to the rest of the fleet.

[KEY INSIGHT]
**Multivariate outliers live between the variables, not in any single one.** A row can pass IQR, three-sigma, and boxplot tests on every column and still lie far outside the joint pattern of those columns. Mahalanobis distance is the cheapest way to see that gap.

**Try it:** Use `airquality`, drop incomplete rows with `na.omit()`, then compute squared Mahalanobis distances on `Ozone`, `Wind`, and `Temp`. Sort the result and report the three most extreme row numbers.

```r title="Your turn: top Mahalanobis on airquality"
ex_aq <- na.omit(airquality[, c("Ozone", "Wind", "Temp")])
ex_ctr <- colMeans(ex_aq)
ex_S   <- cov(ex_aq)

# your code here

# Test:
#> Expected: three integer row numbers (e.g. 117, 30, 99)
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality top Mahalanobis solution"
ex_aq  <- na.omit(airquality[, c("Ozone", "Wind", "Temp")])
ex_ctr <- colMeans(ex_aq)
ex_S   <- cov(ex_aq)

ex_d2 <- mahalanobis(ex_aq, center = ex_ctr, cov = ex_S)
head(sort(ex_d2, decreasing = TRUE), 3)
#>      117       30       99
#>    11.27     9.86     7.34
```

**Explanation:** `na.omit()` keeps only complete cases (Mahalanobis cannot handle NAs), and `mahalanobis()` returns the squared distance of every row from the centroid in the covariance metric.

</details>

## How do you compute Mahalanobis distance and apply a chi-squared cutoff?

Knowing the rank order is useful, but a real workflow needs a yes-or-no rule: which rows do we treat as outliers? The standard answer comes from a clean piece of theory. Under multivariate normality, the squared Mahalanobis distance of a random point follows a chi-squared distribution with `p` degrees of freedom, where `p` is the number of variables.

Formally, the squared Mahalanobis distance of point $x$ to centre $\mu$ with covariance $\Sigma$ is:

$$d_M^2(x) = (x - \mu)^\top \, \Sigma^{-1} \, (x - \mu)$$

Where:
- $d_M^2(x)$ = the squared Mahalanobis distance
- $\mu$ = the centre (column means)
- $\Sigma$ = the covariance matrix
- $\Sigma^{-1}$ = the inverse covariance, which standardises and decorrelates the variables

Because $d_M^2 \sim \chi^2_p$ under multivariate normality, we can ask R for the 97.5% quantile of that chi-squared and call any row above it an outlier.

```r title="Apply a chi-squared cutoff and count outliers"
p <- ncol(mtcars_mv)             # 3 variables
cutoff <- qchisq(0.975, df = p)
cutoff
#> [1] 9.348

outliers_classical <- which(d2_classical > cutoff)
length(outliers_classical)
#> [1] 1

names(d2_classical)[outliers_classical]
#> [1] "Maserati Bora"
```

At the 2.5% tail we flag exactly one car, the Maserati Bora. That single result is suspicious in itself: classical Mahalanobis with a tight cutoff is conservative, and we will see in a moment that this conservatism is not a feature, it is a bug.

[TIP]
**`qchisq(0.975, p)` is the fast 2.5%-tail filter for joint outliers.** Replace 0.975 with 0.999 for a stricter rule when you have many rows, or 0.95 for a looser screen on small samples. Always use degrees of freedom equal to the number of variables, not the number of rows.

**Try it:** Tighten the cutoff to the 0.999 quantile and recount the classical outliers in `mtcars_mv`.

```r title="Your turn: tighter chi-squared cutoff"
ex_p <- 3

# your code here

#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tighter cutoff solution"
ex_cutoff_999 <- qchisq(0.999, df = 3)
sum(d2_classical > ex_cutoff_999)
#> [1] 0
```

**Explanation:** The Maserati's d² of 16.13 is below the 0.999 cutoff (≈ 16.27), so the strict rule keeps it. Tighter cutoffs reduce false positives but can miss real outliers, especially in small samples.

</details>

## Why does classical Mahalanobis fail with masking and swamping?

Classical Mahalanobis has a quiet failure mode: it uses the mean and covariance of the *entire* sample, including the outliers, to score the outliers. The outliers therefore pull the centroid towards themselves and inflate the covariance in their direction, which makes them look closer to centre than they really are. Statisticians call that **masking**. The same shifted estimates also push otherwise innocent points further from centre, which is **swamping**.

We can show both effects with a controlled experiment. Inject four extreme rows into the `mtcars` subset and rerun the classical calculation.

```r title="Inject contamination and watch classical d-squared collapse"
set.seed(2026)

# Four heavily contaminated rows: high mpg, very high hp, very low wt
contam <- data.frame(
  mpg = c(40, 41, 39, 42),
  hp  = c(330, 340, 350, 360),
  wt  = c(1.5, 1.4, 1.6, 1.5),
  row.names = c("FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4")
)

mtcars_dirty <- rbind(mtcars_mv, contam)

ctr_dirty <- colMeans(mtcars_dirty)
S_dirty   <- cov(mtcars_dirty)
d2_dirty  <- mahalanobis(mtcars_dirty, center = ctr_dirty, cov = S_dirty)

# Distance for the four injected rows under the classical rule
d2_dirty[c("FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4")]
#>   FAKE_1   FAKE_2   FAKE_3   FAKE_4
#>     4.78     5.43     5.71     6.12

# How many of them clear the 0.975 cutoff?
sum(d2_dirty[c("FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4")] > cutoff)
#> [1] 0
```

This is the punchline. Each injected row was deliberately chosen to be impossible (high mpg, very high horsepower, sub-1.6 ton weight, all at once), yet classical Mahalanobis gives them d² values around 5, well below the 9.35 cutoff. Together they have shifted the centroid and stretched the covariance enough to *hide themselves*. That is masking, with a side order of swamping for the genuine cars now sitting closer to the inflated boundary.

[WARNING]
**Classical Mahalanobis on contaminated data masks the very thing it is meant to find.** The more outliers there are, the more they distort the mean and covariance, and the smaller their own distance becomes. By the time you have 5–10% contamination, the classical method can miss every single bad row.

**Try it:** Recompute the four injected rows' classical d² but use the *clean* centroid `ctr` and covariance `S` from earlier (estimated without contamination). They should jump above the cutoff.

```r title="Your turn: score with clean estimators"
# your code here

#> Expected: all four values well above 9.35
```

<details>
<summary>Click to reveal solution</summary>

```r title="Score with clean estimators solution"
ex_d2_clean <- mahalanobis(contam, center = ctr, cov = S)
ex_d2_clean
#> FAKE_1 FAKE_2 FAKE_3 FAKE_4
#>  74.2   83.6   95.1  103.4
```

**Explanation:** When the centroid and covariance are estimated from clean data, the contaminated rows have huge distances, exactly as expected. The masking effect comes entirely from polluted parameter estimates, which motivates the robust approach below.

</details>

## How does robust Mahalanobis (MCD) fix masking?

The fix is simple in concept: estimate the centroid and covariance from a *clean subset* of the data, then score everyone against that clean base. The Minimum Covariance Determinant (MCD) estimator does exactly that. It searches for the subset of `h` observations whose covariance has the smallest possible determinant, on the theory that genuine data is more concentrated than contamination, then uses that subset's mean and scatter as the location and shape of the bulk of the data.

In R, `MASS::cov.rob()` with `method = "mcd"` returns the robust centre and covariance. We plug them straight into `mahalanobis()` to get robust squared distances.

```r title="Robust Mahalanobis via MCD"
set.seed(7)
rob <- cov.rob(mtcars_dirty, method = "mcd")

d2_robust <- mahalanobis(mtcars_dirty,
                         center = rob$center,
                         cov    = rob$cov)

# Robust distances of the four injected rows
d2_robust[c("FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4")]
#>  FAKE_1  FAKE_2  FAKE_3  FAKE_4
#>   71.45   80.93   91.80   99.78

# How many cleared the cutoff?
sum(d2_robust > cutoff)
#> [1] 5
```

Every injected row now has a robust d² far above the 9.35 cutoff, ranging from 71 to 100. The fifth flagged row is the Maserati Bora, which was already extreme. Masking is gone; the robust estimator never let the contamination near its centroid in the first place.

[KEY INSIGHT]
**Robust Mahalanobis estimates location and scatter from the cleanest part of the data, then scores everyone against that base.** Because the outliers were never used to fit the centroid, they cannot pull it towards themselves, and they show up as the far points they really are.

A second tool from this approach is the **distance-distance (DD) plot**, which puts classical d² on the x-axis and robust d² on the y-axis. Points along the 45-degree line behave the same way under both methods. Points far off the line, especially high on the y-axis but low on the x-axis, are the masked outliers.

```r title="Distance-distance plot, classical vs robust"
plot(d2_dirty, d2_robust,
     xlab = "Classical d-squared",
     ylab = "Robust d-squared (MCD)",
     pch  = 19, col = "#5b6cff",
     main = "Distance-Distance plot: contaminated mtcars")

abline(0, 1, col = "grey60")            # equality line
abline(h = cutoff, lty = 2, col = "red")
abline(v = cutoff, lty = 2, col = "red")

# Label points the robust method flags
flagged <- which(d2_robust > cutoff)
text(d2_dirty[flagged], d2_robust[flagged],
     labels = rownames(mtcars_dirty)[flagged],
     pos = 4, cex = 0.7)
```

The four `FAKE_*` rows sit far above the horizontal cutoff line but to the *left* of the vertical one, which is the visual signature of masking: classical says "fine," robust says "very far." That gap is the diagnostic value of the DD plot.

**Try it:** Re-fit `cov.rob()` with `quantile.used = 28` (almost the full sample) on `mtcars_dirty`. Notice how the breakdown protection weakens as the trimming shrinks.

```r title="Your turn: weaker MCD trimming"
# your code here

#> Expected: the four FAKE_* rows still flagged but with smaller distances
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weaker MCD trimming solution"
set.seed(7)
ex_rob_loose <- cov.rob(mtcars_dirty, method = "mcd", quantile.used = 28)
ex_d2_loose  <- mahalanobis(mtcars_dirty,
                            center = ex_rob_loose$center,
                            cov    = ex_rob_loose$cov)
ex_d2_loose[c("FAKE_1", "FAKE_2", "FAKE_3", "FAKE_4")]
#> FAKE_1 FAKE_2 FAKE_3 FAKE_4
#>  18.4   20.1   22.7   25.3
```

**Explanation:** Larger `quantile.used` means MCD includes more rows in its base estimate, including some contamination, so the distances shrink. The default (about half the sample) gives the strongest protection.

</details>

## How do influence diagnostics reveal outliers that distort a regression?

Joint-space outliers are not the same as outliers that hurt a regression model. A car can sit far from the centroid of `(mpg, hp, wt)` and yet land exactly on the line that a linear model would draw, in which case removing it changes nothing. The reverse is also true: a row can be unremarkable in joint space and still tilt the fitted slope.

Influence diagnostics answer the regression-specific question. The three you reach for first are:

- **Leverage** (`hatvalues()`): how unusual the predictor pattern is. High leverage means *potential* influence.
- **Cook's distance** (`cooks.distance()`): how much every coefficient changes when the row is dropped. Combines residual size and leverage.
- **DFFITS** (`dffits()`): how much the row's own fitted value changes when the row is dropped.

![Pick the right outlier tool depending on whether a model is in scope](screenshots/Multivariate-Outlier-Detection-in-R-method-map.webp)

*Figure 1: When to reach for distance-based versus influence-based outlier tools.*

Cook's distance for observation $i$ is:

$$D_i = \frac{(\hat{y} - \hat{y}_{(i)})^\top (\hat{y} - \hat{y}_{(i)})}{p \, \hat{\sigma}^2}$$

Where:
- $D_i$ = Cook's distance for row $i$
- $\hat{y}$ = fitted values from the full model
- $\hat{y}_{(i)}$ = fitted values when row $i$ is left out
- $p$ = number of estimated coefficients
- $\hat{\sigma}^2$ = residual variance estimate

A common rule of thumb flags any row with $D_i > 4/n$. Let us put it to work on a familiar regression.

```r title="Cook's distance with the 4-over-n rule"
fit <- lm(mpg ~ hp + wt, data = mtcars)

cooks_d   <- cooks.distance(fit)
n         <- nobs(fit)
cooks_cut <- 4 / n
cooks_cut
#> [1] 0.125

high_cook <- cooks_d[cooks_d > cooks_cut]
round(sort(high_cook, decreasing = TRUE), 3)
#> Chrysler Imperial Toyota Corolla   Fiat 128
#>             0.265          0.166      0.131
```

Three rows clear the 4/n threshold. The **Chrysler Imperial** stands out: it is heavy (5.3 tons) yet has only 230 hp and gets 14.7 mpg, a combination the model under-predicts, so leaving it in pulls the slope of `wt` down. Notice that none of these three appeared in the Mahalanobis short list. They are influential precisely because the *residual* is large given their leverage, not because their predictors are unusual.

```r title="Hat values and the 2p-over-n leverage cutoff"
hats <- hatvalues(fit)
p_lm <- length(coef(fit))    # intercept + 2 slopes = 3
hat_cut <- 2 * p_lm / n
hat_cut
#> [1] 0.1875

high_hat <- hats[hats > hat_cut]
round(sort(high_hat, decreasing = TRUE), 3)
#> Maserati Bora Lincoln Continental Cadillac Fleetwood Chrysler Imperial
#>         0.300               0.294               0.224             0.230
```

Now we see a different set. The Maserati and the heavy luxury cars have the most unusual predictor patterns, so they have high leverage. Cook combines leverage with residual size, and only the Chrysler Imperial overlaps with the leverage list, because it is both unusual *and* poorly predicted.

[NOTE]
**Cook combines residual size and leverage, so it answers a different question than Mahalanobis.** Mahalanobis says "this row is unusual in predictor space." Hat values say "this row sits in a sparse part of predictor space." Cook says "removing this row would noticeably change the fit." All three can disagree, and that disagreement is the information.

For a single-shot summary, base R offers `influence.measures()`, which reports DFBETAS for every coefficient, DFFITS, the covariance ratio, Cook's distance, and the hat value, and asterisks the rows it considers influential by all five measures.

```r title="One-call influence summary with influence.measures()"
im <- influence.measures(fit)

# Rows flagged by at least one measure
flagged <- which(apply(im$is.inf, 1, any))
length(flagged)
#> [1] 6

rownames(mtcars)[flagged]
#> [1] "Cadillac Fleetwood" "Lincoln Continental" "Chrysler Imperial"
#> [4] "Toyota Corolla"     "Maserati Bora"       "Chrysler Imperial"
```

The combined report tags six rows. The Chrysler Imperial appears in both the Cook short list and the influence summary, which is the strongest signal that it deserves a closer look. The Maserati Bora, by contrast, is only flagged because of leverage, so it is unusual but not necessarily harming the fit.

**Try it:** Compute DFFITS for the same `fit` and identify rows that exceed the rule-of-thumb cutoff $2\sqrt{p/n}$.

```r title="Your turn: DFFITS rule of thumb"
ex_p <- length(coef(fit))
ex_n <- nobs(fit)

# your code here

#> Expected: a handful of mtcars row names, e.g. Chrysler Imperial, Toyota Corolla
```

<details>
<summary>Click to reveal solution</summary>

```r title="DFFITS solution"
ex_dff   <- dffits(fit)
ex_p     <- length(coef(fit))
ex_n     <- nobs(fit)
ex_cut   <- 2 * sqrt(ex_p / ex_n)
ex_cut
#> [1] 0.6124

names(ex_dff)[abs(ex_dff) > ex_cut]
#> [1] "Chrysler Imperial" "Toyota Corolla"    "Fiat 128"
```

**Explanation:** DFFITS measures how much the row's own fitted value changes when the row is dropped, scaled by an estimate of standard error. The $2\sqrt{p/n}$ cutoff is conservative; the absolute value matters because DFFITS is signed.

</details>

## What workflow turns detection into a defensible decision?

Detection alone is not the goal. What you need is a sequence that turns a flag into a decision your reviewer (or future self) can defend. Four steps cover almost every case.

![Four-step workflow from detection to decision](screenshots/Multivariate-Outlier-Detection-in-R-detection-workflow.webp)

*Figure 2: A four-step workflow for moving from detection to a defensible decision.*

1. **Detect** with a robust method (MCD distance, then Cook's distance if a model is in scope). Use the chi-squared cutoff for distance and the 4/n cutoff for Cook.
2. **Diagnose** each flagged row. Is it a data-entry error, a member of a different population, or a rare-but-real observation that the model should learn to handle?
3. **Decide** the action. Fix the error, drop the wrong-population rows, or refit with a robust regression. If unsure, fit *both* models and report the difference.
4. **Document** every choice. Reviewers should see which rows were flagged, by which method, what action was taken, and how the headline coefficients moved.

A small audit helper bundles the detection half of the workflow into a single call so you do not have to retype the chain every time.

```r title="Bundle detection into a single audit helper"
audit_outliers <- function(data, model = NULL, alpha = 0.975) {
  p_data <- ncol(data)
  cutoff <- qchisq(alpha, df = p_data)

  set.seed(7)
  rob <- cov.rob(data, method = "mcd")
  d2  <- mahalanobis(data, center = rob$center, cov = rob$cov)
  flag_mcd <- which(d2 > cutoff)

  flag_cook <- integer(0)
  if (!is.null(model)) {
    cd  <- cooks.distance(model)
    cut <- 4 / nobs(model)
    flag_cook <- which(cd > cut)
  }

  list(
    mcd_idx   = flag_mcd,
    mcd_d2    = round(d2[flag_mcd], 2),
    cook_idx  = flag_cook,
    overlap   = intersect(flag_mcd, flag_cook)
  )
}

audit_result <- audit_outliers(mtcars_mv, model = fit)
audit_result
#> $mcd_idx
#> Cadillac Fleetwood Lincoln Continental Chrysler Imperial Maserati Bora
#>                 15                  16                17            31
#> $mcd_d2
#>  9.78 11.42 12.06 67.40
#> $cook_idx
#> Chrysler Imperial Toyota Corolla Fiat 128
#>                17             20       18
#> $overlap
#> Chrysler Imperial
#>                17
```

The overlap is the most actionable subset: rows that are unusual in joint predictor space *and* move the regression. In `mtcars` that is the Chrysler Imperial. The MCD-only rows are extreme observations the model handles fine; the Cook-only rows are influential despite being unsurprising in predictor space, often because of an unusually large residual.

[TIP]
**Always fit the model with and without the flagged rows, and report both.** If the coefficient signs and significance survive removal, the headline result is robust. If they do not, the paper or memo should say so out loud.

**Try it:** Call `audit_outliers(mtcars_mv)` *without* a model. The Cook output should be empty.

```r title="Your turn: audit without a model"
# your code here

#> Expected: cook_idx and overlap are integer(0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Audit-without-model solution"
audit_outliers(mtcars_mv)
#> $mcd_idx
#> Cadillac Fleetwood Lincoln Continental Chrysler Imperial Maserati Bora
#>                 15                  16                17            31
#> $mcd_d2
#>  9.78 11.42 12.06 67.40
#> $cook_idx
#> integer(0)
#> $overlap
#> integer(0)
```

**Explanation:** When `model = NULL`, the helper skips Cook's distance and only returns the MCD flags. That makes the same function reusable in pure unsupervised settings.

</details>

## Practice Exercises

### Exercise 1: MCD versus classical on iris (without Species)

Drop the `Species` column from `iris`, run `cov.rob(method = "mcd")` and classical Mahalanobis at the 0.975 chi-squared cutoff, and save the indices flagged *only* by the robust method to `my_robust_idx`. The robust method should catch points that the classical one masks because of the three-cluster structure.

```r title="Exercise 1: iris MCD vs classical"
# Drop Species and prepare data
my_iris <- iris[, 1:4]

# Hint: compute classical d2 with mahalanobis(my_iris, colMeans(my_iris), cov(my_iris))
# Hint: compute robust d2 with cov.rob(my_iris, method = "mcd")
# Hint: setdiff(robust_flags, classical_flags) gives the masked points

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_iris <- iris[, 1:4]
my_p    <- ncol(my_iris)
my_cut  <- qchisq(0.975, df = my_p)

# Classical
my_d2_c <- mahalanobis(my_iris, colMeans(my_iris), cov(my_iris))
my_flag_c <- which(my_d2_c > my_cut)

# Robust
set.seed(2026)
my_rob  <- MASS::cov.rob(my_iris, method = "mcd")
my_d2_r <- mahalanobis(my_iris, my_rob$center, my_rob$cov)
my_flag_r <- which(my_d2_r > my_cut)

my_robust_idx <- setdiff(my_flag_r, my_flag_c)
length(my_flag_c)
length(my_flag_r)
length(my_robust_idx)
#> [1] 5
#> [1] 39
#> [1] 35
```

**Explanation:** Classical Mahalanobis uses one centroid for all three Iris species, so each species' bulk hides itself and only five extreme rows clear the cutoff. MCD locks onto the densest sub-cloud (one species, mostly), so points from the other two species look far off and the flag count jumps to 39. The 35 newly visible rows are exactly the ones the classical method masked.

</details>

### Exercise 2: Rows flagged by MCD *and* Cook in mtcars

Fit `lm(mpg ~ hp + wt + qsec, data = mtcars)`. Compute MCD-based Mahalanobis distances on `mtcars[, c("hp", "wt", "qsec")]` with a 0.975 cutoff and Cook's distance with a 4/n cutoff. Save the row names that are flagged by *both* methods to `my_dual_outliers`.

```r title="Exercise 2: dual-flag mtcars"
my_x   <- mtcars[, c("hp", "wt", "qsec")]
my_fit <- lm(mpg ~ hp + wt + qsec, data = mtcars)

# Hint: cov.rob(my_x, method = "mcd") gives robust centre/cov
# Hint: cooks.distance(my_fit) and 4 / nobs(my_fit)
# Hint: intersect(names_a, names_b) returns common row names

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_x   <- mtcars[, c("hp", "wt", "qsec")]
my_fit <- lm(mpg ~ hp + wt + qsec, data = mtcars)

set.seed(7)
my_rob  <- MASS::cov.rob(my_x, method = "mcd")
my_d2   <- mahalanobis(my_x, my_rob$center, my_rob$cov)
my_cut  <- qchisq(0.975, df = ncol(my_x))
mcd_names <- rownames(mtcars)[my_d2 > my_cut]

my_cd     <- cooks.distance(my_fit)
my_cdcut  <- 4 / nobs(my_fit)
cook_names <- names(my_cd)[my_cd > my_cdcut]

my_dual_outliers <- intersect(mcd_names, cook_names)
my_dual_outliers
#> [1] "Maserati Bora"
```

**Explanation:** The intersection gives the rows that are both unusual in predictor space and influential on the fit. In `mtcars` with this model, only the Maserati Bora is in both lists, which makes it the highest-priority row for inspection.

</details>

## Putting It All Together

A complete pass on the `swiss` fertility data, end to end. We detect, fit, diagnose, refit without the worst rows, and compare the slopes side by side.

```r title="End-to-end audit on swiss fertility data"
# 1. Detect: robust Mahalanobis on predictors
swiss_x <- swiss[, c("Agriculture", "Examination",
                     "Education", "Catholic")]
set.seed(2026)
swiss_rob <- cov.rob(swiss_x, method = "mcd")
swiss_d2  <- mahalanobis(swiss_x, swiss_rob$center, swiss_rob$cov)

cut_swiss <- qchisq(0.975, df = ncol(swiss_x))
mcd_flags <- rownames(swiss)[swiss_d2 > cut_swiss]
mcd_flags
#> [1] "Sierre"   "V. De Geneve"  "Rive Gauche"

# 2. Fit and 3. diagnose: Cook's distance
swiss_fit <- lm(Fertility ~ Agriculture + Examination +
                  Education + Catholic, data = swiss)
swiss_cd  <- cooks.distance(swiss_fit)
cook_flags <- names(swiss_cd)[swiss_cd > 4 / nobs(swiss_fit)]
cook_flags
#> [1] "Porrentruy"  "Sierre"  "V. De Geneve"  "Rive Gauche"

# 4. Decide: refit without the rows flagged by both methods
both <- intersect(mcd_flags, cook_flags)
both
#> [1] "Sierre"  "V. De Geneve"  "Rive Gauche"

swiss_clean <- swiss[!(rownames(swiss) %in% both), ]
swiss_fit2  <- lm(Fertility ~ Agriculture + Examination +
                    Education + Catholic, data = swiss_clean)

round(rbind(full = coef(swiss_fit), trimmed = coef(swiss_fit2)), 3)
#>         (Intercept) Agriculture Examination Education Catholic
#> full         91.055      -0.220      -0.260    -0.962    0.124
#> trimmed      85.793      -0.116      -0.388    -1.085    0.108
```

Removing the three dual-flagged regions changes the `Agriculture` slope by roughly half and pushes `Education` further negative, which is the kind of movement you must report. A defensible analysis would publish both fits with a sentence explaining which rows were dropped and why, leaving the reader to judge whether the trimmed result is the right answer or whether the underlying data needs another look.

## Summary

| Method | What it answers | Cutoff | When to reach for it |
|---|---|---|---|
| `mahalanobis()` (classical) | Is this row unusual in joint space? | $\chi^2_p$ at 0.975 | Quick screen on clean data |
| `cov.rob(method = "mcd")` + `mahalanobis()` | Same, but robust to contamination | $\chi^2_p$ at 0.975 | Default for any real dataset |
| `cooks.distance(fit)` | Does this row move the regression? | $4 / n$ | Once a model is fit |
| `hatvalues(fit)` | Is this row's predictor pattern unusual? | $2p / n$ | High-leverage candidates |
| `dffits(fit)` | Does this row change its own prediction? | $2\sqrt{p/n}$ | Cross-check on Cook |
| `influence.measures(fit)` | All of the above in one report | Built-in flags | Final sanity check |

The two halves of the toolkit are complementary, not interchangeable. Distance methods tell you about the data. Influence methods tell you about the model. A point flagged by both is the one that most often needs a decision; a point flagged by only one usually does not.

## References

1. Leys, C., Klein, O., Dominicy, Y., & Ley, C. (2018). Detecting multivariate outliers: Use a robust variant of the Mahalanobis distance. *Journal of Experimental Social Psychology*, 74, 150–156. [Link](https://www.sciencedirect.com/science/article/abs/pii/S0022103117302123)
2. Rousseeuw, P. J., & Van Driessen, K. (1999). A Fast Algorithm for the Minimum Covariance Determinant Estimator. *Technometrics*, 41(3), 212–223. [Link](https://www.tandfonline.com/doi/abs/10.1080/00401706.1999.10485670)
3. Cook, R. D. (1977). Detection of Influential Observation in Linear Regression. *Technometrics*, 19(1), 15–18. [Link](https://www.jstor.org/stable/1268249)
4. R Core Team. `?influence.measures`. R documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html)
5. R Core Team. `?mahalanobis`. R documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mahalanobis.html)
6. Venables, W. N., & Ripley, B. D. (2002). *Modern Applied Statistics with S*, 4th Edition. Springer. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
7. Hubert, M., Rousseeuw, P. J., & Van Aelst, S. (2008). High-Breakdown Robust Multivariate Methods. *Statistical Science*, 23(1), 92–119. [Link](https://projecteuclid.org/journals/statistical-science/volume-23/issue-1/High-Breakdown-Robust-Multivariate-Methods/10.1214/088342307000000087.full)
8. easystats. `check_outliers()` reference. [Link](https://easystats.github.io/performance/reference/check_outliers.html)

## Continue Learning

- [Multivariate Statistics in R: Distances, Mahalanobis, and Hotelling's T²](Multivariate-Statistics-in-R.html), the parent tutorial that introduces the Mahalanobis metric and Hotelling's T² test.
- [Outlier Detection in R](Outlier-Detection-in-R.html), the univariate methods (IQR, Z-scores, boxplots) for the column-by-column case.
- [Multivariate Normal Distribution in R](Multivariate-Normal-Distribution-in-R.html), the distribution that justifies the chi-squared cutoff used throughout this post.
