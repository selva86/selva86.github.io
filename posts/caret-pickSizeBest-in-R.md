---
title: "caret pickSizeBest() in R: Pick the Top RFE Subset Size"
slug: "caret-pickSizeBest-in-R"
description: "caret pickSizeBest() in R picks the rfe subset size with the best resampled metric value. Covers signature, rfeControl wiring, pickSizeTolerance comparison."
keywords: "caret pickSizeBest, pickSizeBest function R, caret pickSizeBest examples, R rfe optimal subset, caret rfe select best size, pickSizeBest rfeControl, caret feature elimination"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "pickSizeBest()|caret pickSizeBest|caret::pickSizeBest()|pickSizeTolerance()|rfe subset size selector"
auto_link_case_sensitive: true
target_keyword: "caret pickSizeBest"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret pickSizeBest() in R: Pick the Top RFE Subset Size

<p class="lead">The <code>pickSizeBest()</code> function in caret scans the resampled performance table from a recursive feature elimination run and returns the single subset size whose metric value is best. It is the default size-selector wired into every built-in <code>rfeControl()</code> recipe, so most users invoke it indirectly through <code>rfe()</code>.</p>

[QUICK ANSWER]
pickSizeBest(x, metric = "RMSE", maximize = FALSE)    # regression default
pickSizeBest(x, metric = "Accuracy", maximize = TRUE) # classification default
pickSizeBest(rfe_fit$results, "ROC", TRUE)            # call on a fitted rfe object
rfe_fit$optsize                                       # the size pickSizeBest chose
rfeControl(functions = rfFuncs)                       # uses pickSizeBest by default
identical(rfFuncs$selectSize, pickSizeBest)           # TRUE; default size selector
pickSizeTolerance(x, metric, tol = 1.5, maximize)     # parsimony alternative

[DECISION TREE: Is pickSizeBest() the right tool?]
- pick the rfe subset with the single best resampled score: pickSizeBest(x, metric, maximize)
- prefer a smaller subset within tolerance of best: pickSizeTolerance(x, metric, tol = 1.5, maximize)
- run the recursive feature elimination loop itself: rfe(x, y, sizes, rfeControl)
- configure the resampling and helper functions: rfeControl(functions = rfFuncs, method = "cv")
- rank predictors without elimination: varImp(fit)
- write a custom rule that combines size, score, and stability: define your own selectSize function

## What pickSizeBest() does in one sentence

**`pickSizeBest()` returns the subset size whose resampled performance metric is best across all sizes tried by `rfe()`.** It is a stateless helper, not a model. You hand it the `results` data frame produced by a recursive feature elimination run, name the metric column, and tell it whether higher is better. It returns one integer, the chosen number of predictors.

The function lives inside caret's `rfe()` machinery as the default value of `functions$selectSize`. When you call `rfe()` with `rfeControl(functions = rfFuncs)`, the loop fits models at each requested subset size, averages the metric across resamples, and at the end calls `pickSizeBest()` on that averaged table to decide which size `optsize` should hold.

## pickSizeBest() syntax and arguments

**The signature has three arguments and no defaults that depend on the caller's data.**

```r title="Load caret and call pickSizeBest on a toy table"
library(caret)

results <- data.frame(
  Variables = c(2, 4, 6, 8, 10),
  RMSE      = c(3.21, 2.85, 2.41, 2.39, 2.47),
  Rsquared  = c(0.42, 0.55, 0.68, 0.69, 0.66)
)

pickSizeBest(results, metric = "RMSE", maximize = FALSE)
#> [1] 8
```

The full signature is:

```
pickSizeBest(x, metric, maximize)
```

- `x`: a data frame of resampled results. Must contain a column named `Variables` (the subset size tried) and a column whose name matches `metric`.
- `metric`: character string. The column name to optimize. For regression, `"RMSE"`, `"MAE"`, or `"Rsquared"`. For classification, `"Accuracy"`, `"Kappa"`, `"ROC"`, `"Sens"`, `"Spec"`.
- `maximize`: logical. `TRUE` if higher is better (Accuracy, ROC, Rsquared). `FALSE` if lower is better (RMSE, MAE, logLoss).

The return value is a single integer, the `Variables` value of the winning row. Ties are broken by `which.max` / `which.min`, which returns the first index, so the smallest size in a tie wins.

[NOTE]
**`pickSizeBest()` never inspects standard errors or fold-level spread.** It optimizes the point estimate of the resampled metric, nothing more. For a more conservative choice that prefers parsimony, use `pickSizeTolerance()` (see the comparison section below).

## pickSizeBest() examples by use case

### 1. Standalone call on a fitted rfe object

After `rfe()` returns, its `results` slot holds one row per subset size. You can call `pickSizeBest()` directly on it.

```r title="Run rfe on the Boston housing data"
library(caret)
library(MASS)

set.seed(1)
ctrl  <- rfeControl(functions = lmFuncs, method = "cv", number = 5)
sizes <- c(2, 4, 6, 8, 10, 13)
fit   <- rfe(Boston[, -14], Boston$medv, sizes = sizes, rfeControl = ctrl)

pickSizeBest(fit$results, metric = "RMSE", maximize = FALSE)
#> [1] 13

fit$optsize
#> [1] 13
```

The two calls agree because `rfe()` ran `pickSizeBest()` internally and stored its choice in `optsize`. Calling the helper yourself is useful when you want to re-evaluate the choice with a different metric or after filtering `fit$results`.

### 2. Default plug-in inside rfeControl()

The built-in function bundles (`rfFuncs`, `lmFuncs`, `nbFuncs`, `treebagFuncs`, `caretFuncs`) all set `selectSize = pickSizeBest`. You inherit the behavior whenever you pass one of those bundles to `rfeControl()`.

```r title="Inspect the default selectSize"
identical(rfFuncs$selectSize,  pickSizeBest)
#> [1] TRUE
identical(lmFuncs$selectSize,  pickSizeBest)
#> [1] TRUE
```

The bundles also wire `pickVars`, the helper that returns the variable names belonging to the chosen size. Together, `pickSizeBest()` and `pickVars()` produce `fit$optsize` and `fit$optVariables`.

### 3. Re-wire to pickSizeTolerance for parsimony

If a tiny gain in metric is not worth a much larger feature set, swap the size selector before passing the bundle to `rfeControl()`.

```r title="Prefer the smallest size within 1.5 percent of the best"
my_funcs <- rfFuncs
my_funcs$selectSize <- function(x, metric, maximize) {
  pickSizeTolerance(x, metric, tol = 1.5, maximize = maximize)
}

set.seed(1)
ctrl2 <- rfeControl(functions = my_funcs, method = "cv", number = 5)
fit2  <- rfe(Boston[, -14], Boston$medv,
             sizes = sizes, rfeControl = ctrl2)
fit2$optsize
#> [1] 6
```

The tolerance variant pulled the chosen size down from 13 to 6 because the RMSE at size 6 is within 1.5 percent of the absolute best. The model is much smaller and rarely loses much accuracy.

### 4. Custom rule on top of pickSizeBest

Wrap the helper to combine its choice with a hard cap or a stability check.

```r title="Cap the chosen size at 5 predictors"
my_funcs$selectSize <- function(x, metric, maximize) {
  best <- pickSizeBest(x, metric, maximize)
  min(best, 5)
}
```

The wrapper still defers to `pickSizeBest()` for the unconstrained choice and then enforces the cap. Custom rules belong here, not inside `rfe()` itself, because `rfeControl()` is the only injection point caret exposes.

## pickSizeBest vs pickSizeTolerance

**Both helpers consume the same `results` table. They differ in how they balance score against subset size.**

| Helper | What it returns | When to prefer |
|---|---|---|
| `pickSizeBest()` | Size with the single best resampled metric | You want maximum point-estimate performance and can afford a larger feature set |
| `pickSizeTolerance()` | Smallest size within `tol` percent of best | You want parsimony, robustness to fold noise, or a smaller production model |
| Custom `selectSize` | Whatever your function returns | You have domain rules (cost per feature, regulatory limits) the built-ins do not encode |

`pickSizeTolerance()` takes an extra `tol` argument (default 1.5, in percent). The metric value at every candidate size is compared to the best; the smallest size whose value is within `tol` percent is returned. It typically picks a smaller subset than `pickSizeBest()` and is less likely to chase noise on small resampling samples.

[TIP]
**Use `pickSizeTolerance()` with `tol = 1.5` as a low-effort upgrade for production models.** You usually drop 30 to 70 percent of the features at the cost of fewer than 2 percent of the metric, and the resulting model trains and scores much faster.

## Common pitfalls

**Three mistakes show up often when calling `pickSizeBest()` directly or inspecting its choice.**

1. **Passing `maximize = TRUE` with RMSE.** Lower RMSE is better. With `maximize = TRUE`, `pickSizeBest()` returns the worst size. Always set `maximize = FALSE` for RMSE, MAE, logLoss, and any error metric.

2. **Calling it on the per-fold table instead of the averaged results.** `rfe(...)$resample` has one row per fold per size and lacks a single metric column with the right shape. The right input is `rfe(...)$results`, which has one row per size with averaged metrics.

3. **Expecting it to honor standard errors.** A 0.001 RMSE win at size 14 over size 6 is meaningless if the fold standard error is 0.05. `pickSizeBest()` will still choose 14. For statistical parity within noise, use `pickSizeTolerance()` or a custom rule that consults `fit$results$RMSESD`.

[WARNING]
**`pickSizeBest()` requires that the `Variables` column matches one of the sizes you passed to `rfe(sizes = ...)`.** If the helper is called on a filtered table that no longer contains the candidate sizes, the returned integer will be the best of whatever rows remain, not the best overall. Filter the table only when you mean to constrain the choice.

## Try it yourself

**Try it:** Run `rfe()` on `iris` to classify `Species`, then call `pickSizeBest()` on the result with the `"Accuracy"` metric.

```r title="Your turn: rfe on iris"
# Try it: pick the best subset size for an iris classifier
library(caret)
set.seed(1)
ctrl_ex <- rfeControl(functions = rfFuncs, method = "cv", number = 5)
fit_ex  <- # your code here

best_ex <- # your code here

best_ex
#> Expected: an integer between 1 and 4 (often 2 or 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_ex  <- rfe(iris[, 1:4], iris$Species,
               sizes = c(1, 2, 3, 4), rfeControl = ctrl_ex)
best_ex <- pickSizeBest(fit_ex$results, metric = "Accuracy",
                        maximize = TRUE)
best_ex
#> [1] 2
```

**Explanation:** Petal width and petal length carry nearly all the signal in iris, so the size-2 subset typically ties or beats the full set on cross-validated accuracy. `pickSizeBest()` returns the smallest tied size first, which is why size 2 wins.

</details>

## Related caret functions

- `pickSizeTolerance(x, metric, tol, maximize)`: the parsimony-aware sibling. Same inputs, prefers smaller sizes within a tolerance.
- `rfe(x, y, sizes, rfeControl)`: the recursive feature elimination loop that produces the `results` table `pickSizeBest()` consumes.
- `rfeControl(functions, method, number)`: configures the resampling scheme and the function bundle that contains `selectSize`.
- `pickVars(y, size)`: companion to `pickSizeBest()`, returns the variable names belonging to the chosen size.
- `varImp(fit)`: ranks predictors inside a fitted `train` object. Useful for inspecting why a given subset was selected.

External reference: the [caret variable selection guide](https://topepo.github.io/caret/recursive-feature-elimination.html) on the official caret site documents the full set of `selectSize` plug-ins.

## FAQ

**What is the difference between `pickSizeBest()` and `pickSizeTolerance()` in caret?**

`pickSizeBest()` returns the subset size with the highest (or lowest) resampled metric value, ignoring how close other sizes came. `pickSizeTolerance()` returns the smallest size whose metric is within a tolerance, defaulting to 1.5 percent of the best. Use `pickSizeBest()` for raw performance and `pickSizeTolerance()` when you prefer a smaller model that is statistically indistinguishable from the best.

**How does `rfe()` use `pickSizeBest()` automatically?**

Every built-in function bundle (`rfFuncs`, `lmFuncs`, `nbFuncs`, `treebagFuncs`, `caretFuncs`) sets `selectSize = pickSizeBest`. When `rfe()` finishes its resampling loop, it calls the bundle's `selectSize` on the averaged `results` table and stores the chosen size in `fit$optsize`. You never call `pickSizeBest()` yourself in the default workflow, but the choice is entirely controlled by it.

**Why does `pickSizeBest()` sometimes pick the largest subset?**

When the resampled metric improves monotonically with more features, the best score lands at the largest size you tried, so `pickSizeBest()` returns that size. This is common with linear models on low-noise data. If you want to discourage the result, swap in `pickSizeTolerance()` or pass a wrapper that caps the returned size.

**Can `pickSizeBest()` be used outside of `rfe()`?**

Yes. The helper is a pure function over a data frame. Any table with a `Variables` column and a named metric column will work, including hand-built tables from other feature selection routines. The only contract is the column layout, not the source of the rows.

**Does `pickSizeBest()` look at standard errors or fold-level variance?**

No. It optimizes the point estimate in the metric column. If your resampling has high variance, the chosen size may be unstable across reruns of `rfe()`. Use `pickSizeTolerance()` for a noise-aware alternative, or build a custom `selectSize` that consults the metric's `SD` column.
