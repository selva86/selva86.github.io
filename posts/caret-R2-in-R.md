---
title: "caret R2() in R: R-Squared for Regression Predictions"
slug: "caret-R2-in-R"
description: "Use caret R2() in R to compute R-squared between predictions and truth. Variance-explained regression score with two formulas: corr default and traditional."
keywords: "caret R2, R2 function R, caret R2 examples, R R-squared caret, caret::R2, R-squared regression metric R, postResample R2"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "R2()|caret R2|caret::R2()|R-squared in caret|R2 regression metric"
auto_link_case_sensitive: true
target_keyword: "caret R2"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret R2() in R: R-Squared for Regression Predictions

<p class="lead">The <code>R2()</code> function in caret computes R-squared between a vector of predictions and a vector of observed values. It returns one number in [0, 1] (or negative under the traditional formula when the model is worse than the mean baseline), and is part of the default regression summary used inside <code>caret::train()</code>.</p>

[QUICK ANSWER]
R2(pred, obs)                                # default: squared Pearson correlation
R2(pred, obs, formula = "traditional")       # 1 - SSres/SStot, can go negative
R2(pred, obs, na.rm = TRUE)                  # drop NA pairs in either vector
caret::R2(pred, obs)                         # namespaced when caret not attached
postResample(pred, obs)["Rsquared"]          # R-squared inside the full metric set
R2(predict(fit, newdata = te), te$y)         # score a fitted regression model
sapply(fold_preds, function(p) R2(p, obs))   # per-fold R-squared in resampling

[DECISION TREE: Is R2() the right tool?]
- score variance explained on a regression vector: R2(pred, obs)
- get an error metric in outcome units instead: RMSE(pred, obs)
- get an outlier-robust score in outcome units: MAE(pred, obs)
- get RMSE, R-squared, MAE in one call: postResample(pred, obs)
- compute R-squared inside caret::train resampling: summaryFunction = defaultSummary
- score a classifier instead of regression: caret::confusionMatrix(pred, obs)

## What R2() does in one sentence

**`R2()` returns the proportion of variance in the observed outcome that the predictions explain.** You pass two numeric vectors of equal length and get back one unitless number, by default the squared Pearson correlation between `pred` and `obs`. There is no model object, no formula interface, and no resampling logic; the function exists so you can score a vector of predictions in one line.

Caret exposes R2 at the top level so it can also drop into `defaultSummary()` and `train()` resampling alongside RMSE and MAE. A value of 1 means perfect ranking of predictions; 0 means predictions explain no variance; values below 0 (only under `formula = "traditional"`) mean the model is worse than always predicting the outcome mean.

[KEY INSIGHT]
**caret::R2() has two formulas and the default is not what most users assume.** `formula = "corr"` (the default) returns the squared Pearson correlation, which is invariant to a constant bias in `pred`. `formula = "traditional"` returns 1 minus the sum of squared residuals over total variance, the same number `summary(lm())$r.squared` reports in-sample. The two agree on in-sample lm fits and diverge whenever predictions carry a systematic offset.

## R2() syntax and arguments

**The signature is four arguments, two of them mandatory.** Both vectors must be numeric and the same length. Mismatched lengths trigger a recycling warning and a meaningless score, so check `length(pred) == length(obs)` before calling.

```r title="Load caret and compute R-squared on a small vector"
library(caret)

set.seed(1)
obs  <- rnorm(20, mean = 50, sd = 8)
pred <- obs + rnorm(20, sd = 3)        # noisy predictions around truth

R2(pred = pred, obs = obs)
#> [1] 0.880129
```

The arguments are `pred` (predictions), `obs` (the truth), `formula` (either `"corr"` or `"traditional"`, default `"corr"`), and `na.rm` (default `FALSE`). Order is `pred` first, consistent with `RMSE()` and `MAE()` in caret but reversed from `Metrics::R2_Score(actual, predicted)`; name the arguments when switching packages.

R2 is bounded above by 1 under either formula. Under `"corr"` it is bounded below by 0. Under `"traditional"` it has no lower bound: a model that misses the mean of `obs` produces a negative score, the signal that the model is worse than a constant baseline.

[NOTE]
**Coming from scikit-learn?** The equivalent of `caret::R2(pred, obs, formula = "traditional")` is `sklearn.metrics.r2_score(y_true, y_pred)`. sklearn takes truth first, uses the traditional formula by default, and matches `summary(lm())$r.squared` on in-sample fits. To get the sklearn answer in caret, set `formula = "traditional"` explicitly.

## R2() examples by use case

**Most calls fall into four patterns: a quick vector score, a hold-out test score, a per-fold resampling score, and a side-by-side comparison.** Each example uses R2 in the role it does best: a unitless score for ranking models on variance explained.

```r title="Score an lm fit on mtcars hold-out data"
library(caret)

set.seed(42)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
tr  <- mtcars[idx, ]
te  <- mtcars[-idx, ]

fit  <- lm(mpg ~ wt + hp + cyl, data = tr)
pred <- predict(fit, newdata = te)

R2(pred, te$mpg)
#> [1] 0.8513
```

An R-squared of 0.85 on the mtcars hold-out means the model captures about 85% of test-set `mpg` variance (under the default `"corr"` formula). Always pair R-squared with RMSE: R2 alone hides the units of error.

```r title="Per-fold R-squared in 5-fold cross-validation"
library(caret)

set.seed(7)
ctrl <- trainControl(method = "cv", number = 5,
                     summaryFunction = defaultSummary)

fit_cv <- train(mpg ~ wt + hp + cyl, data = mtcars,
                method = "lm", trControl = ctrl,
                metric = "Rsquared")

fit_cv$resample[, c("Resample", "Rsquared")]
#>   Resample  Rsquared
#> 1    Fold1 0.8731
#> 2    Fold2 0.7842
#> 3    Fold3 0.8459
#> 4    Fold4 0.8911
#> 5    Fold5 0.8204
```

Setting `metric = "Rsquared"` tells caret to pick tuning parameters that maximise R-squared rather than minimise RMSE. The `$resample` slot exposes per-fold values for plotting or a confidence interval. A fold-to-fold R2 range wider than 0.1 means the dataset is small relative to the signal.

```r title="Compare corr vs traditional formula on a biased model"
set.seed(11)
obs  <- rnorm(50, mean = 100, sd = 10)
pred <- obs + 5                        # constant +5 bias, no random noise

c(
  corr        = R2(pred, obs, formula = "corr"),
  traditional = R2(pred, obs, formula = "traditional")
)
#>        corr traditional
#>   1.0000000   0.7500000
```

The `"corr"` formula scores this as perfect because `pred` is a linear function of `obs` (slope 1, intercept 5). The `"traditional"` formula penalises the offset and reports 0.75. Use `"traditional"` when calibration bias matters; use `"corr"` when only ranking matters.

## R2 vs RMSE vs MAE: when to report each

**Pick the metric that answers the question your stakeholder is asking.** All three describe regression quality but on different axes.

| Metric | Returns | Units | Sensitive to | Best when |
|---|---|---|---|---|
| R2 | Proportion of variance explained | Unitless | Variance ratio | Ranking models on a common scale |
| RMSE | Square root of mean squared error | Outcome units | Large misses (quadratic) | Large errors are disproportionately costly |
| MAE | Mean absolute error | Outcome units | Every miss equally | Stakeholder wants one explainable number |

R2 answers "how much of the spread did the model capture." RMSE answers "how bad are the worst misses on average." Report R2 alongside RMSE: R2 alone hides whether 0.85 means errors of 0.01 or 100 on your outcome scale.

[TIP]
**Report R-squared alongside the outcome's standard deviation, not by itself.** A 0.85 R-squared on a target with `sd(obs) = 0.5` and a 0.85 on a target with `sd(obs) = 50` are two very different real-world models. Pair every R-squared with `sd(obs)` and `RMSE(pred, obs)` so a reader can recover the absolute error: an R2 of 0.85 implies RMSE near `sqrt(1 - 0.85) * sd(obs)` when residuals are uncorrelated with predictions, a useful sanity check.

## Common pitfalls

**Three mistakes show up repeatedly in caret R-squared workflows.** Each has a one-line fix.

```r title="Mistake 1: assuming caret R2 matches summary(lm)"
fit_lm <- lm(mpg ~ wt + hp, data = mtcars)
in_sample_pred <- predict(fit_lm)

c(
  caret_default     = R2(in_sample_pred, mtcars$mpg),
  caret_traditional = R2(in_sample_pred, mtcars$mpg, formula = "traditional"),
  lm_summary        = summary(fit_lm)$r.squared
)
#>     caret_default caret_traditional        lm_summary
#>         0.8267855         0.8267855         0.8267855
```

In-sample, all three agree because the fitted values from `lm()` are unbiased. The moment you score out-of-sample predictions or predictions from a non-`lm` model, the default `"corr"` formula can drift above `summary(lm)$r.squared`. Pass `formula = "traditional"` to compare apples to apples.

```r title="Mistake 2: silent NA propagation"
obs2  <- c(10, 12, NA, 15)
pred2 <- c(11, 11, 14, 14)

R2(pred2, obs2)
#> [1] NA

R2(pred2, obs2, na.rm = TRUE)
#> [1] 0.75
```

Without `na.rm = TRUE`, a single `NA` in either vector wipes out the score. Drop or impute missing values before calling, or pass `na.rm = TRUE`; do not assume the test set is clean just because `train()` succeeded.

```r title="Mistake 3: trusting R-squared on tiny test sets"
set.seed(5)
obs3  <- rnorm(5)
pred3 <- obs3 + rnorm(5, sd = 0.5)

R2(pred3, obs3)
#> [1] 0.7286034
```

Five observations cannot tell you much about variance explained; the metric is dominated by sampling noise at small N. Use cross-validation or bootstrapping on small datasets and report the resampled mean plus its spread, not a single test-set number.

[WARNING]
**A negative R-squared is not a bug.** Under `formula = "traditional"`, R2 can go below zero when the sum of squared residuals exceeds the total variance of `obs`, meaning the model predicts worse than the constant `mean(obs)`. Do not clip negative values to zero. Treat the negative score as the diagnostic it is: the model has learned a pattern that does not generalise, or the training and test distributions differ.

## Try it yourself

**Try it:** Compute R-squared for a linear model predicting `Petal.Length` from `Petal.Width` on the `iris` dataset, using a 70/30 split and the traditional formula. Save the value to `ex_r2`.

```r title="Your turn: R-squared on iris"
library(caret)
set.seed(99)

# Try it: fit lm and compute traditional R-squared on hold-out
ex_idx  <- # your code here
ex_tr   <- # your code here
ex_te   <- # your code here
ex_fit  <- # your code here
ex_r2   <- # your code here

ex_r2
#> Expected: a number around 0.92 to 0.95
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
ex_r2   <- R2(predict(ex_fit, newdata = ex_te),
              ex_te$Petal.Length,
              formula = "traditional")

ex_r2
#> [1] 0.9272
```

**Explanation:** `createDataPartition()` stratifies on the outcome so train and test distributions match. Petal.Width is a very strong single predictor of Petal.Length in iris, which is why R-squared lands above 0.9. Switching to `formula = "corr"` here barely changes the number because `predict.lm()` returns unbiased fits.

</details>

## FAQ

**What is a good R-squared value in caret?**

There is no universal threshold. A useful R-squared depends on the noise floor of the outcome: physics data can demand 0.95, while behavioural data is often strong at 0.3. Compare your R2 to a baseline (always predicting `mean(obs)` gives 0 under the traditional formula) and to a competing model on the same hold-out set.

**Why does caret R2 return a different value than summary(lm)?**

`caret::R2()` defaults to `formula = "corr"`, the squared Pearson correlation, which is invariant to a constant bias in `pred`. `summary(lm())$r.squared` uses the traditional formula, `1 - SSres/SStot`, on the in-sample fitted values where the two happen to agree. They diverge as soon as predictions carry an offset, for example when scoring a held-out set or a non-lm model. Pass `formula = "traditional"` to match `summary(lm)`.

**Can caret R2 be negative?**

Yes, but only under `formula = "traditional"`. A negative score means the sum of squared residuals exceeds the total variance of `obs`, so the model is worse than predicting the outcome mean. Under the default `"corr"` formula R2 is bounded in [0, 1]. Treat a negative traditional R2 as a diagnostic, not an error.

**Does caret R2 handle NA values?**

Yes, when asked. The default is `na.rm = FALSE`, so any `NA` in `pred` or `obs` propagates and the result is `NA`. Pass `na.rm = TRUE` to drop pairs where either side is missing, or impute upstream so the test vectors have no gaps.

**Should I use R-squared or RMSE for caret::train tuning?**

Either is valid; the choice changes which model wins. R-squared maximises variance explained and is unitless, useful for comparing across datasets. RMSE minimises squared error in outcome units, useful when absolute miss size matters. Set `metric = "Rsquared"` or `metric = "RMSE"` explicitly in `train()` so the choice is visible in code review.

## Related caret functions

- [caret::RMSE()](caret-RMSE-in-R.html): root mean squared error sibling, in outcome units
- [caret::MAE()](caret-MAE-in-R.html): mean absolute error sibling, outlier-robust
- [caret::postResample()](caret-postResample-in-R.html): RMSE, R-squared, and MAE in one call
- [caret::defaultSummary()](caret-defaultSummary-in-R.html): the default summary function used inside `train()`
- [caret::train()](caret-train-in-R.html): fit and tune regression models with R-squared as an optional selection metric

For the official reference, see the [caret package on CRAN](https://cran.r-project.org/package=caret).
