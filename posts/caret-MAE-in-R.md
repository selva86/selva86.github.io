---
title: "caret MAE() in R: Mean Absolute Error for Regression"
slug: "caret-MAE-in-R"
description: "Use caret MAE() in R to compute mean absolute error between predicted and observed values. Outlier-robust regression score in the same units as your outcome."
keywords: "caret MAE, MAE function R, caret MAE examples, R mean absolute error caret, regression error metric R, caret::MAE, MAE vs RMSE R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "MAE()|caret MAE|caret::MAE()|mean absolute error in caret|MAE function"
auto_link_case_sensitive: true
target_keyword: "caret MAE"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret MAE() in R: Mean Absolute Error for Regression

<p class="lead">The <code>MAE()</code> function in caret computes mean absolute error: the average of the absolute differences between predicted and observed numeric values. It returns a single number in the units of the outcome, treats every residual equally, and is less sensitive to outliers than RMSE, making it the natural error metric when a few extreme misses should not dominate the score.</p>

[QUICK ANSWER]
MAE(pred, obs)                                # basic call: returns one number
MAE(pred, obs, na.rm = TRUE)                  # drop NAs in either vector
caret::MAE(pred, obs)                         # namespaced when caret not attached
mean(abs(pred - obs))                         # equivalent base R
postResample(pred, obs)["MAE"]                # MAE inside the full metric set
MAE(predict(fit, newdata = te), te$y)         # score a fitted regression model
sapply(fold_preds, function(p) MAE(p, obs))   # per-fold MAE in resampling

[DECISION TREE: Is MAE() the right tool?]
- score absolute error on a regression vector: MAE(pred, obs)
- penalise large misses more strongly: RMSE(pred, obs)
- report error as a percent of truth: mean(abs((pred - obs) / obs))
- get RMSE, Rsquared, MAE together: postResample(pred, obs)
- score a classifier instead of regression: caret::confusionMatrix(pred, obs)
- need MAE inside caret::train resampling: summaryFunction = defaultSummary

## What MAE() does in one sentence

**`MAE()` returns the mean of the absolute residuals.** You pass two numeric vectors of equal length and get back one number with the same units as the outcome. There is no model object, no formula, and no resampling logic; the function exists to give you a clean, interpretable error score that you can compare across models or report directly to a stakeholder.

Internally the call is `mean(abs(pred - obs))` with an optional `na.rm`. caret exposes it as a top-level helper so it can also be plugged into `defaultSummary()` and `train()` resampling, where MAE appears alongside RMSE and R-squared in every fold's metric row.

[KEY INSIGHT]
**MAE is the typical error in the same units as your outcome.** If you predict house prices and `MAE(pred, obs) = 12000`, your model is off by about $12,000 on a typical house. That direct interpretability is why product and business teams often prefer MAE over RMSE, which weights large misses more heavily and is harder to translate into plain language.

## MAE() syntax and arguments

**The signature is three arguments, only two of them mandatory.** Both vectors must be numeric and the same length. Mismatched lengths trigger a recycling warning and a meaningless result, so check `length()` before scoring.

```r title="Load caret and compute MAE on a small vector"
library(caret)

set.seed(1)
obs  <- rnorm(20, mean = 50, sd = 8)
pred <- obs + rnorm(20, sd = 3)        # noisy predictions around truth

MAE(pred = pred, obs = obs)
#> [1] 2.184391
```

The arguments are `pred` (predictions), `obs` (the truth), and `na.rm` (default `FALSE`). If either vector contains `NA`, the result is `NA` unless `na.rm = TRUE`. The order is `pred` first, which matches the rest of caret but reverses `Metrics::mae(actual, predicted)`; name the arguments if you switch between packages often.

MAE is bounded below by zero and unbounded above. A value of zero means every prediction matched its observation exactly. There is no upper benchmark: you must compare MAE either to the standard deviation of the outcome, to a baseline predictor (e.g., always predicting the mean), or to a competing model on the same hold-out set.

[NOTE]
**Coming from scikit-learn?** The equivalent of `caret::MAE(pred, obs)` is `sklearn.metrics.mean_absolute_error(y_true, y_pred)`. Note that sklearn takes truth first; caret takes predictions first.

## MAE() examples by use case

**Most calls fall into four patterns: a quick vector score, a hold-out test score, a per-fold cross-validation score, and side-by-side model comparison.** Each example uses MAE in the role it does best: producing a single number in the outcome's units.

```r title="Score an lm fit on mtcars hold-out data"
library(caret)

set.seed(42)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
tr  <- mtcars[idx, ]
te  <- mtcars[-idx, ]

fit  <- lm(mpg ~ wt + hp + cyl, data = tr)
pred <- predict(fit, newdata = te)

MAE(pred, te$mpg)
#> [1] 2.314482
```

A MAE of 2.31 on mtcars means the linear model is off by roughly 2.3 miles per gallon on a typical hold-out car. Whether that is good depends on the spread of mpg in the test set, so always pair MAE with a one-line `sd(te$mpg)` for context.

```r title="Per-fold MAE in 5-fold cross-validation"
library(caret)

set.seed(7)
ctrl <- trainControl(method = "cv", number = 5,
                     summaryFunction = defaultSummary)

fit_cv <- train(mpg ~ wt + hp + cyl, data = mtcars,
                method = "lm", trControl = ctrl,
                metric = "MAE", maximize = FALSE)

fit_cv$resample[, c("Resample", "MAE")]
#>   Resample      MAE
#> 1    Fold1 1.96234
#> 2    Fold2 2.45102
#> 3    Fold3 2.10987
#> 4    Fold4 2.38445
#> 5    Fold5 2.02613
```

Passing `metric = "MAE"` tells `train()` to select tuning parameters on MAE rather than the default RMSE. Set `maximize = FALSE` because MAE is a loss; lower is better. The `$resample` slot exposes the per-fold values so you can plot them or compute a confidence interval.

```r title="Compare two models with MAE on the same hold-out set"
fit_lm  <- lm(mpg ~ wt + hp + cyl, data = tr)
fit_lm2 <- lm(mpg ~ wt + hp + cyl + disp + drat, data = tr)

c(
  small = MAE(predict(fit_lm,  newdata = te), te$mpg),
  large = MAE(predict(fit_lm2, newdata = te), te$mpg)
)
#>    small    large
#> 2.314482 2.401775
```

Side-by-side MAE on the same hold-out set is the cleanest model comparison: same units, same observations, same metric. The smaller model wins here despite having fewer features, a hint that the extra predictors overfit the training rows.

## MAE vs RMSE vs MAPE: which to report

**Pick the metric whose penalty matches how your stakeholder feels about errors.** All three measure prediction error but weight it differently.

| Metric | Formula (mean of...) | Units | Outlier weight | Best when |
|---|---|---|---|---|
| MAE | absolute residuals | outcome units | Equal | Equal-weight typical error; stakeholder-friendly |
| RMSE | squared residuals, then sqrt | outcome units | Quadratic | Large misses are disproportionately costly |
| MAPE | absolute percent residuals | percent | Variable | Outcome magnitudes vary widely across rows |

MAE answers "on a typical prediction, how far off am I." RMSE answers "how bad are my worst predictions." MAPE answers "what fraction of the truth do I miss." If you can pick only one, MAE wins on interpretability; if extreme errors are catastrophic (medical dosage, structural load), pick RMSE.

[TIP]
**Report MAE alongside RMSE, not instead of it.** The ratio `RMSE / MAE` tells you how skewed your error distribution is. A ratio near 1 means errors are uniform; a ratio above 1.5 signals a few large outliers driving RMSE up. Both numbers in the same row of your report give readers more signal than either alone.

## Common pitfalls

**Three mistakes show up over and over in MAE workflows.** Each has a quick fix.

```r title="Mistake 1: silent NA propagation"
obs2  <- c(10, 12, NA, 15)
pred2 <- c(11, 11, 14, 14)

MAE(pred2, obs2)
#> [1] NA

MAE(pred2, obs2, na.rm = TRUE)
#> [1] 1
```

Without `na.rm = TRUE`, a single `NA` in either vector wipes out the score. The fix is to drop or impute missing values explicitly before scoring, or pass `na.rm = TRUE`.

```r title="Mistake 2: comparing MAE across different outcomes"
mpg_mae   <- MAE(predict(fit_lm, newdata = te), te$mpg)
disp_mae  <- MAE(rnorm(nrow(te), mean(te$disp)), te$disp)

mpg_mae    # 2.31 mpg
disp_mae   # 90+ cubic inches

# Same metric, different scales, NOT comparable.
```

MAE is in the outcome's units, so an MAE of 2 on a target that ranges 0 to 50 is very different from an MAE of 2 on a target that ranges 0 to 5. Normalise by the outcome's standard deviation or its range before comparing models on different targets.

[WARNING]
**MAE hides bias.** A model that predicts the median of `obs` for every row gets a finite MAE even though it is useless for ranking observations. Pair MAE with R-squared, which tracks variance explained, or with a residual plot to catch flat predictors that pass the MAE bar.

## Try it yourself

**Try it:** Compute MAE for a linear model trained to predict `Sepal.Length` from `Sepal.Width` on the `iris` dataset, using a 70/30 split. Save the value to `ex_mae`.

```r title="Your turn: MAE on iris"
library(caret)
set.seed(99)

# Try it: fit lm and compute MAE on hold-out
ex_idx <- # your code here
ex_tr  <- # your code here
ex_te  <- # your code here
ex_fit <- # your code here
ex_mae <- # your code here

ex_mae
#> Expected: a number around 0.4 to 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(caret)
set.seed(99)

ex_idx <- createDataPartition(iris$Sepal.Length, p = 0.7, list = FALSE)
ex_tr  <- iris[ex_idx, ]
ex_te  <- iris[-ex_idx, ]

ex_fit <- lm(Sepal.Length ~ Sepal.Width, data = ex_tr)
ex_mae <- MAE(predict(ex_fit, newdata = ex_te), ex_te$Sepal.Length)

ex_mae
#> [1] 0.6612541
```

**Explanation:** `createDataPartition()` builds a stratified index on the outcome, keeping the train and test distributions similar. The lm fit uses only one predictor, so MAE is relatively high; adding `Petal.Length` typically drops it below 0.4.

</details>

## FAQ

**What is a good MAE value in R?**

There is no universal threshold. A good MAE is small relative to the spread of the outcome on the test set. Compare it to `sd(obs)`, to a baseline (always predicting `mean(obs)`), or to a competing model's MAE on the same hold-out rows. If your MAE equals or beats the standard deviation of the target, the model has not learned anything useful.

**How is MAE different from RMSE in caret?**

Both `MAE()` and `RMSE()` summarise residuals in the outcome's units, but RMSE squares residuals before averaging and then takes the square root. That squaring penalises large misses much more heavily, so RMSE is always greater than or equal to MAE for the same data. The ratio `RMSE / MAE` is a quick sign of error skew: near 1 means uniform errors, above 1.5 means a few outliers.

**Does caret MAE handle NA values?**

Yes, but only when you ask. The default is `na.rm = FALSE`, so any `NA` in `pred` or `obs` propagates and the result is `NA`. Pass `na.rm = TRUE` to drop pairs where either side is missing, or impute the missing values upstream of the scoring call so the test set has no gaps.

**Can MAE be used for classification in caret?**

No. MAE is a regression metric; it requires numeric inputs. For factor outcomes, use `caret::confusionMatrix(pred, obs)` for accuracy and kappa, or `postResample(pred, obs)` which switches metric sets based on input type. Trying to call `MAE()` on factors throws an error.

**Why does caret report MAE in `train()` output?**

`caret::train()` calls `defaultSummary()` per fold, which itself calls `postResample()` and returns RMSE, R-squared, and MAE for regression. MAE appears so you can see typical error in the outcome's units without doing the math by hand. You can select tuning parameters on MAE by passing `metric = "MAE"` and `maximize = FALSE` to `train()`.

## Related caret functions

- [caret::RMSE()](caret-RMSE-in-R.html): squared-error sibling, penalises large misses
- [caret::R2()](caret-R2-in-R.html): proportion of variance explained
- [caret::postResample()](caret-postResample-in-R.html): RMSE, R-squared, and MAE in one call
- [caret::defaultSummary()](caret-defaultSummary-in-R.html): the default summary function used inside `train()`
- [caret::train()](caret-train-in-R.html): fit and tune regression models with MAE as the selection metric

For the official function reference, see the [caret package documentation on CRAN](https://cran.r-project.org/package=caret).
