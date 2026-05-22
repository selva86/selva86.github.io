---
title: "caret RMSE() in R: Root Mean Squared Error for Regression"
slug: "caret-RMSE-in-R"
description: "Use caret RMSE() in R to compute root mean squared error between predicted and observed values. Outlier-sensitive regression score, same units as outcome."
keywords: "caret RMSE, RMSE function R, caret RMSE examples, R root mean squared error caret, regression error metric R, caret::RMSE, RMSE vs MAE R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "RMSE()|caret RMSE|caret::RMSE()|root mean squared error in caret|RMSE function"
auto_link_case_sensitive: true
target_keyword: "caret RMSE"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret RMSE() in R: Root Mean Squared Error for Regression

<p class="lead">The <code>RMSE()</code> function in caret computes root mean squared error: the square root of the average squared difference between predicted and observed numeric values. It returns one number in the units of the outcome, penalises large misses quadratically, and is the default selection metric for regression inside <code>caret::train()</code>.</p>

[QUICK ANSWER]
RMSE(pred, obs)                               # basic call: returns one number
RMSE(pred, obs, na.rm = TRUE)                 # drop NAs in either vector
caret::RMSE(pred, obs)                        # namespaced when caret not attached
sqrt(mean((pred - obs)^2))                    # equivalent base R
postResample(pred, obs)["RMSE"]               # RMSE inside the full metric set
RMSE(predict(fit, newdata = te), te$y)        # score a fitted regression model
sapply(fold_preds, function(p) RMSE(p, obs))  # per-fold RMSE in resampling

[DECISION TREE: Is RMSE() the right tool?]
- score squared error on a regression vector: RMSE(pred, obs)
- treat every miss equally regardless of size: MAE(pred, obs)
- report error as a percent of truth: mean(abs((pred - obs) / obs))
- get RMSE, Rsquared, MAE in one call: postResample(pred, obs)
- score a classifier instead of regression: caret::confusionMatrix(pred, obs)
- need RMSE inside caret::train resampling: summaryFunction = defaultSummary

## What RMSE() does in one sentence

**`RMSE()` returns the square root of the mean of squared residuals.** You pass two numeric vectors of equal length and get back one number with the same units as the outcome. There is no model object, no formula, and no resampling logic; the function exists so you can score a vector of predictions in a single line and compare models on a common scale.

Internally the call is `sqrt(mean((pred - obs)^2))` with an optional `na.rm`. caret exposes RMSE at the top level so it can also drop into `defaultSummary()` and `train()` resampling, where it is the default metric for regression.

[KEY INSIGHT]
**Squaring the residuals is what makes RMSE different from MAE.** A residual of 10 contributes 100 to the inner mean, while two residuals of 5 each contribute only 25. RMSE rewards models that keep their worst predictions small; if you do not care more about big misses than small ones, use MAE instead.

## RMSE() syntax and arguments

**The signature is three arguments, two of them mandatory.** Both vectors must be numeric and the same length. Mismatched lengths trigger a recycling warning and a meaningless result, so check `length(pred) == length(obs)` before scoring.

```r title="Load caret and compute RMSE on a small vector"
library(caret)

set.seed(1)
obs  <- rnorm(20, mean = 50, sd = 8)
pred <- obs + rnorm(20, sd = 3)        # noisy predictions around truth

RMSE(pred = pred, obs = obs)
#> [1] 2.612139
```

The arguments are `pred` (predictions), `obs` (the truth), and `na.rm` (default `FALSE`). The order is `pred` first, consistent with the rest of caret but reversed from `Metrics::rmse(actual, predicted)`; name the arguments if you switch between packages.

RMSE is bounded below by zero and unbounded above. Zero means every prediction matched exactly. There is no upper benchmark: compare RMSE to the standard deviation of the outcome, to a baseline predictor, or to a competing model on the same hold-out set.

[NOTE]
**Coming from scikit-learn?** The equivalent of `caret::RMSE(pred, obs)` is `sklearn.metrics.mean_squared_error(y_true, y_pred, squared = FALSE)` or, from sklearn 1.4, the dedicated `root_mean_squared_error(y_true, y_pred)`. sklearn takes truth first; caret takes predictions first.

## RMSE() examples by use case

**Most calls fall into four patterns: a quick vector score, a hold-out test score, a per-fold cross-validation score, and side-by-side model comparison.** Each example uses RMSE in the role it does best: penalising big regression misses on a common scale.

```r title="Score an lm fit on mtcars hold-out data"
library(caret)

set.seed(42)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
tr  <- mtcars[idx, ]
te  <- mtcars[-idx, ]

fit  <- lm(mpg ~ wt + hp + cyl, data = tr)
pred <- predict(fit, newdata = te)

RMSE(pred, te$mpg)
#> [1] 2.872461
```

An RMSE of 2.87 on mtcars means the linear model is typically off by about 2.9 mpg, but with extra weight on the test cars where it missed worst. Always pair RMSE with a one-line `sd(te$mpg)` for context: an RMSE smaller than the test SD shows the model is doing better than always predicting the mean.

```r title="Per-fold RMSE in 5-fold cross-validation"
library(caret)

set.seed(7)
ctrl <- trainControl(method = "cv", number = 5,
                     summaryFunction = defaultSummary)

fit_cv <- train(mpg ~ wt + hp + cyl, data = mtcars,
                method = "lm", trControl = ctrl,
                metric = "RMSE")

fit_cv$resample[, c("Resample", "RMSE")]
#>   Resample     RMSE
#> 1    Fold1 2.534612
#> 2    Fold2 3.011804
#> 3    Fold3 2.687233
#> 4    Fold4 2.918551
#> 5    Fold5 2.612988
```

`metric = "RMSE"` is the default for regression, but writing it makes the choice obvious to a reviewer. Lower is better, and caret minimises RMSE automatically (no `maximize = FALSE` needed; minimisation is the default for RMSE). The `$resample` slot exposes the per-fold values so you can plot them or take a confidence interval.

```r title="Compare two models with RMSE on the same hold-out set"
fit_lm  <- lm(mpg ~ wt + hp + cyl, data = tr)
fit_lm2 <- lm(mpg ~ wt + hp + cyl + disp + drat, data = tr)

c(
  small = RMSE(predict(fit_lm,  newdata = te), te$mpg),
  large = RMSE(predict(fit_lm2, newdata = te), te$mpg)
)
#>    small    large
#> 2.872461 3.054318
```

Side-by-side RMSE on the same hold-out set is the cleanest regression comparison: same units, same observations, same metric. The smaller model wins despite having fewer predictors, the signature of mild overfitting in the larger one.

## RMSE vs MAE vs MAPE: which to report

**Pick the metric whose penalty matches how your stakeholder feels about errors.** All three measure regression error but weight it differently.

| Metric | Formula (mean of...) | Units | Outlier weight | Best when |
|---|---|---|---|---|
| RMSE | squared residuals, then sqrt | outcome units | Quadratic | Large misses are disproportionately costly |
| MAE | absolute residuals | outcome units | Equal | Every miss is equally bad; stakeholder-friendly |
| MAPE | absolute percent residuals | percent | Variable | Outcome magnitudes vary widely across rows |

RMSE answers "how bad are my worst predictions on average." MAE answers "on a typical row, how far off am I." MAPE answers "what fraction of the truth do I miss." Pick RMSE when extreme errors are catastrophic; pick MAE when you need a number you can explain to a product manager in one sentence.

[TIP]
**Report RMSE alongside MAE, not instead of it.** The ratio `RMSE / MAE` quantifies error skew. A ratio near 1 means residuals are uniform; a ratio above 1.5 means a few large misses are driving RMSE up. Showing both numbers in the same row of your report gives readers more signal than either alone, and a sudden ratio jump in a refreshed dataset is an early warning that outliers have changed.

## Common pitfalls

**Three mistakes show up repeatedly in RMSE workflows.** Each has a one-line fix.

```r title="Mistake 1: silent NA propagation"
obs2  <- c(10, 12, NA, 15)
pred2 <- c(11, 11, 14, 14)

RMSE(pred2, obs2)
#> [1] NA

RMSE(pred2, obs2, na.rm = TRUE)
#> [1] 1
```

Without `na.rm = TRUE`, a single `NA` in either vector wipes out the score. Drop or impute missing values explicitly before scoring, or pass `na.rm = TRUE`; do not assume the test set is clean just because `train()` succeeded.

```r title="Mistake 2: confusing RMSE with MSE"
pred3 <- c(11, 13, 14, 16)
obs3  <- c(10, 12, 15, 15)

mse  <- mean((pred3 - obs3)^2)
rmse <- RMSE(pred3, obs3)

c(MSE = mse, RMSE = rmse)
#>  MSE RMSE
#> 1.00 1.00
```

The numbers happen to agree here because the inner mean is 1, but in general `MSE = RMSE^2`. They have different units: MSE is in squared units of the outcome, RMSE is back in the original units. Always report RMSE for human consumption; MSE is a calculator-stage value.

```r title="Mistake 3: comparing RMSE across different outcomes"
mpg_rmse  <- RMSE(predict(fit_lm, newdata = te), te$mpg)
disp_rmse <- RMSE(rnorm(nrow(te), mean(te$disp)), te$disp)

mpg_rmse    # ~2.87 mpg
disp_rmse   # ~100 cubic inches
# Same metric, different scales, NOT comparable.
```

RMSE is in the outcome's units, so the same number means very different things on different targets. Normalise by the outcome's standard deviation (`NRMSE = RMSE / sd(obs)`) or by its range before comparing models across datasets.

[WARNING]
**One huge outlier can dominate RMSE.** Because residuals are squared, a single bad prediction can move the score more than dozens of small misses combined. Plot residuals before trusting RMSE: if a residual plot shows one or two extreme points, decide whether that point is data quality (clean it) or a real tail observation (then RMSE is right to flag it).

## Try it yourself

**Try it:** Compute RMSE for a linear model predicting `Petal.Length` from `Petal.Width` on the `iris` dataset, using a 70/30 split. Save the value to `ex_rmse`.

```r title="Your turn: RMSE on iris"
library(caret)
set.seed(99)

# Try it: fit lm and compute RMSE on hold-out
ex_idx  <- # your code here
ex_tr   <- # your code here
ex_te   <- # your code here
ex_fit  <- # your code here
ex_rmse <- # your code here

ex_rmse
#> Expected: a number around 0.4 to 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(caret)
set.seed(99)

ex_idx  <- createDataPartition(iris$Petal.Length, p = 0.7, list = FALSE)
ex_tr   <- iris[ex_idx, ]
ex_te   <- iris[-ex_idx, ]

ex_fit  <- lm(Petal.Length ~ Petal.Width, data = ex_tr)
ex_rmse <- RMSE(predict(ex_fit, newdata = ex_te), ex_te$Petal.Length)

ex_rmse
#> [1] 0.4671248
```

**Explanation:** `createDataPartition()` stratifies on the outcome so train and test distributions match. With a single strong predictor (`Petal.Width`), RMSE on iris hovers near 0.47; adding `Sepal.Length` typically drops it below 0.4.

</details>

## FAQ

**What is a good RMSE value in R?**

There is no universal threshold. A good RMSE is small relative to the spread of the outcome on the test set. Compare it to `sd(obs)`, to a baseline (always predicting `mean(obs)`), or to a competing model's RMSE on the same hold-out rows. Rule of thumb: RMSE under half the test SD is a usable model; RMSE at or above the SD means the model has not learned anything useful.

**How is RMSE different from MAE in caret?**

Both `RMSE()` and `MAE()` summarise residuals in the outcome's units, but RMSE squares residuals before averaging and then takes the square root. The squaring penalises large misses much more heavily, so RMSE is always greater than or equal to MAE for the same data. The ratio `RMSE / MAE` flags outliers in the residual distribution: a ratio near 1 means errors are uniform, a ratio above 1.5 signals a few large misses driving RMSE up.

**Does caret RMSE handle NA values?**

Yes, but only when you ask. The default is `na.rm = FALSE`, so any `NA` in `pred` or `obs` propagates and the result is `NA`. Pass `na.rm = TRUE` to drop pairs where either side is missing, or impute upstream so the test set has no gaps.

**Why does caret pick RMSE as the default metric?**

`caret::train()` calls `defaultSummary()` per fold, which returns RMSE, R-squared, and MAE for regression. RMSE drives tuning by default because it is differentiable, in the outcome's units, and penalises large misses. Override with `metric = "MAE"` or `metric = "Rsquared"` if RMSE is the wrong target for your use case.

**Can RMSE be used for classification in caret?**

No. RMSE is a regression metric; it requires numeric inputs. For factor outcomes, use `caret::confusionMatrix(pred, obs)` for accuracy and kappa, or `postResample(pred, obs)` which switches metric sets based on input type. Calling `RMSE()` on factors throws an error before any computation runs.

## Related caret functions

- [caret::MAE()](caret-MAE-in-R.html): absolute-error sibling, equal weight per miss
- [caret::R2()](caret-R2-in-R.html): proportion of variance explained
- [caret::postResample()](caret-postResample-in-R.html): RMSE, R-squared, and MAE in one call
- [caret::defaultSummary()](caret-defaultSummary-in-R.html): the default summary function used inside `train()`
- [caret::train()](caret-train-in-R.html): fit and tune regression models with RMSE as the selection metric

For the official function reference, see the [caret package documentation on CRAN](https://cran.r-project.org/package=caret).
