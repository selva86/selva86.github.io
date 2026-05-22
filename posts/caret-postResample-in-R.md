---
title: "caret postResample() in R: Score Model Predictions"
slug: "caret-postResample-in-R"
description: "Use caret postResample() in R to score predictions. Get RMSE, R-squared, MAE for regression and Accuracy, Kappa for classification with a single call."
keywords: "caret postResample, postResample function R, caret postResample examples, R regression metrics caret, RMSE Rsquared MAE caret, R model evaluation caret"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "postResample()|caret postResample|caret::postResample()|postResample function|caret regression metrics"
auto_link_case_sensitive: true
target_keyword: "caret postResample"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret postResample() in R: Score Model Predictions

<p class="lead">The <code>postResample()</code> function in caret takes a vector of predicted values and a vector of observed values and returns a labeled numeric summary of prediction quality. For numeric outcomes it reports RMSE, R-squared, and MAE; for factor outcomes it reports Accuracy and Kappa. One call covers regression and classification with no model object required.</p>

[QUICK ANSWER]
postResample(pred, obs)                              # regression: RMSE, Rsquared, MAE
postResample(pred_factor, obs_factor)                # classification: Accuracy, Kappa
postResample(pred, obs)["RMSE"]                      # extract one metric
postResample(pred_matrix, obs_matrix)                # multi-output regression
caret::defaultSummary(data.frame(obs = obs, pred = pred))  # same metrics, wider API
do.call(rbind, fold_scores)                          # per-fold score table
1 - postResample(pred, obs)["Rsquared"]              # variance unexplained

[DECISION TREE: Is postResample() the right tool?]
- score a regression vector quickly: postResample(pred, obs)
- score a classification vector: caret::confusionMatrix(pred, obs)
- score during caret::train() resampling: pass summaryFunction to trainControl()
- need ROC, sensitivity, specificity: twoClassSummary(data, lev, model)
- want tidy tibble output: yardstick::metrics(df, truth, estimate)
- compare many fitted caret models: resamples(list(a = fit1, b = fit2))

## What postResample() does in one sentence

**`postResample()` is caret's lightweight metric helper.** You pass a vector of predictions and a vector of observations and get a small named numeric vector with the standard metrics. The function detects whether inputs are numeric or factor and switches metric sets automatically, so one call covers regression and classification.

It does not need a fitted model, only the two vectors, so it works with predictions from any source: `caret::train`, a base `lm`, an `xgboost` booster, or a hand-coded rule. Internally, `defaultSummary()` and `train()` call it to build per-fold metric rows.

[KEY INSIGHT]
**The R-squared is Pearson correlation squared, not 1 minus SS_res over SS_tot.** That distinction matters when predictions are biased: a perfectly correlated but shifted prediction returns Rsquared = 1 even though residuals are large. Pair it with RMSE before reporting model quality.

## postResample() syntax and arguments

**The signature is short: two vectors in, one named vector out.** Both inputs must have the same length and the same type (both numeric or both factor with the same levels).

```r title="Load caret and create a small regression scoring set"
library(caret)

set.seed(1)
n   <- 30
obs <- rnorm(n, mean = 10, sd = 3)
pred <- obs + rnorm(n, sd = 1.2)        # noisy predictions around truth

postResample(pred = pred, obs = obs)
#>     RMSE Rsquared      MAE
#>  1.10987  0.86445  0.91402
```

The two arguments are `pred` (predictions) and `obs` (the truth). For a single outcome both are vectors. For multi-output regression both are matrices with the same number of columns; the result is a 3 by k matrix. Subset by name with bracket indexing to extract one metric.

RMSE and MAE inherit the units of the outcome, which makes them easier to communicate than scale-free metrics. Kappa corrects accuracy for chance agreement, so it is safer than raw accuracy when one class dominates. The function does not accept weights; for those, use `defaultSummary()` inside a `trainControl(summaryFunction = ...)` block.

[NOTE]
**Argument order is `pred` then `obs`.** This matches caret's broader convention but reverses `Metrics::rmse(actual, predicted)`. Swapping does not change RMSE or MAE, but it affects asymmetric metrics added via `summaryFunction`. Name the arguments when in doubt.

## postResample() examples by use case

**Most calls fall into four patterns: regression scoring, classification scoring, multi-output regression, and integration with caret resampling.** Each pattern uses the same function with slightly different inputs.

```r title="Score a regression model trained on mtcars"
library(caret)

set.seed(42)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
tr  <- mtcars[idx, ]
te  <- mtcars[-idx, ]

fit  <- lm(mpg ~ wt + hp + cyl, data = tr)
pred <- predict(fit, newdata = te)

postResample(pred, te$mpg)
#>     RMSE Rsquared      MAE
#>  2.84571  0.79234  2.31448
```

RMSE penalises large residuals quadratically, so a single bad prediction inflates it more than several small ones, while MAE weights every residual equally and tracks typical error better. Always inspect a residual plot before celebrating a high Rsquared; correlation alone hides bias.

For classification, pass two factors with identical levels. The function falls through to the two-class metric branch and returns Accuracy and Kappa.

```r title="Score a classifier on iris"
set.seed(2)
idx_c <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
trc   <- iris[idx_c, ]
tec   <- iris[-idx_c, ]

fitc  <- train(Species ~ ., data = trc, method = "rpart")
predc <- predict(fitc, newdata = tec)

postResample(predc, tec$Species)
#>  Accuracy     Kappa
#>  0.93333   0.90000
```

The gap between Accuracy and Kappa shrinks when class prevalence is balanced and widens when one class dominates; for an imbalanced binary outcome with 95 percent negatives, a constant-negative predictor scores 0.95 accuracy but Kappa near zero.

Multi-output regression works by passing matrices with one column per outcome. The result widens to a metric-by-output matrix that is easy to print or convert to a data frame.

```r title="Multi-output regression: one column of metrics per outcome"
set.seed(3)
n <- 50
obs_m  <- cbind(o1 = rnorm(n, 5, 2),
                o2 = rnorm(n, 50, 10))
pred_m <- obs_m + cbind(rnorm(n, sd = 0.8),
                        rnorm(n, sd = 4))

postResample(pred_m, obs_m)
#>             o1        o2
#> RMSE     0.778     4.211
#> Rsquared 0.872     0.821
#> MAE      0.621     3.395
```

A fourth pattern hand-rolls a per-fold score table. Loop the folds, call `postResample()` on each, `rbind` the rows.

```r title="Per-fold scores from saved predictions"
set.seed(7)
folds  <- caret::createFolds(mtcars$mpg, k = 4, returnTrain = TRUE)
scores <- lapply(folds, function(tr_idx) {
  fit  <- lm(mpg ~ wt + hp, data = mtcars[tr_idx, ])
  pred <- predict(fit, newdata = mtcars[-tr_idx, ])
  postResample(pred, mtcars[-tr_idx, "mpg"])
})
do.call(rbind, scores)
#>            RMSE Rsquared      MAE
#> Fold1   2.55482  0.83441  2.13209
#> Fold2   3.10293  0.75812  2.62018
#> Fold3   2.78416  0.79927  2.27365
#> Fold4   2.94175  0.77244  2.41889
```

The four-row data frame matches the shape caret stores in `fit$resample`.

[TIP]
**Use `postResample()` to score holdout predictions without re-running caret.** If you trained a model in another session and saved only the prediction vectors, you can recover the standard metrics in one line. Pair it with `summary()` on the residuals when the holdout is small and you want a sanity check on bias.

## postResample() vs alternatives

**Five tools score predictions in R: postResample(), defaultSummary(), confusionMatrix(), yardstick, and Metrics.** They differ in input shape, return shape, and metric coverage.

| Tool                       | Input shape                  | Returns                          | Best for                                  |
|----------------------------|------------------------------|----------------------------------|-------------------------------------------|
| `postResample()`           | Two vectors or matrices      | Named numeric vector             | Quick scoring outside caret resamples     |
| `defaultSummary()`         | Data frame with `obs`, `pred`| Named numeric vector             | `summaryFunction` in `trainControl()`     |
| `confusionMatrix()`        | Two factor vectors           | List with table plus 15 metrics  | Full classification scorecard             |
| `yardstick::metrics()`     | Tibble with truth, estimate  | Tibble (one row per metric)      | Tidy pipelines and reporting              |
| `Metrics::rmse()` etc.     | Two vectors                  | Single numeric                   | One metric at a time, no caret dependency |

Pick `postResample()` when you want a one-line score outside the caret training loop and a compact named vector you can subset by metric name. Switch to `defaultSummary()` (which calls `postResample()` under the hood) when you write a custom `summaryFunction` for `trainControl()`. Switch to `confusionMatrix()` for the full classifier scorecard with sensitivity, specificity, and per-class breakdown. Use `yardstick` when downstream code expects tibbles, especially in tidymodels pipelines. Reach for `Metrics::rmse()` only when you want a single number with no caret dependency.

## Common pitfalls

**Three mistakes account for most postResample() bugs.** Each has a quick fix.

```r title="Pitfall 1: factor with mismatched levels returns NA"
pred_bad <- factor(c("yes", "no", "yes"))
obs_bad  <- factor(c("yes", "no", "no"), levels = c("no", "yes", "maybe"))

postResample(pred_bad, obs_bad)
#>  Accuracy     Kappa
#>  0.66667        NA
```

Kappa needs matching factor levels on both sides. Align them with `factor(x, levels = lv)` before scoring, or use `confusionMatrix(pred, obs)` which surfaces the mismatch in its error message.

```r title="Pitfall 2: NA in either vector propagates to all metrics"
pred_na <- c(1, 2, NA, 4)
obs_na  <- c(1.1, 1.9, 3, 4.2)

postResample(pred_na, obs_na)
#>     RMSE Rsquared      MAE
#>       NA       NA       NA
```

Drop NAs before scoring with `complete.cases()`. Predictions are NA most often when a newdata row contains a level the model has not seen; investigate the source rather than silently dropping. A third common cause is a `summaryFunction` that runs on a fold where one class never appears, which produces a Kappa of NA even though Accuracy is defined; in that case the right fix is `createDataPartition` with a stratified split, not silent imputation.

```r title="Pitfall 3: character vectors silently fall through to regression"
pred_chr <- c("yes", "no", "yes", "no")
obs_chr  <- c("yes", "no", "no", "no")

postResample(pred_chr, obs_chr)
#> Error in mean((pred - obs)^2) :
#>   non-numeric argument to binary operator
```

`postResample()` decides between regression and classification branches by checking whether inputs are numeric. Character vectors fall through to the regression path and error. Wrap both inputs in `factor()` with matching levels before scoring.

[WARNING]
**Rsquared is the squared Pearson correlation between pred and obs, not 1 minus SS_res over SS_tot.** A model that returns `pred = obs + 10` has perfect correlation and reports Rsquared = 1 even though every prediction is off by ten units. Always inspect RMSE alongside Rsquared before claiming a strong fit.

## Try it yourself

**Try it:** Fit a linear model of `airquality$Ozone` on `Solar.R` and `Wind` (dropping NAs first). Generate predictions on the same data and score them with `postResample()`. Save the RMSE to `ex_rmse`.

```r title="Your turn: score an ozone model"
# Try it: postResample on airquality
ex_data  <- na.omit(airquality)
ex_fit   <- # your code here: lm of Ozone on Solar.R and Wind
ex_pred  <- # your code here: predict on ex_data
ex_score <- # your code here: postResample of ex_pred vs Ozone
ex_rmse  <- ex_score["RMSE"]

ex_rmse
#> Expected: a single named numeric near 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data  <- na.omit(airquality)
ex_fit   <- lm(Ozone ~ Solar.R + Wind, data = ex_data)
ex_pred  <- predict(ex_fit, newdata = ex_data)
ex_score <- postResample(ex_pred, ex_data$Ozone)
ex_rmse  <- ex_score["RMSE"]

ex_rmse
#>     RMSE
#> 21.40432
```

**Explanation:** `na.omit()` drops rows with missing values so the model can fit; `postResample()` then returns RMSE, Rsquared, and MAE on the training predictions. Subset with `["RMSE"]` to pull a single metric out of the named vector.

</details>

## Related caret functions

The metric you want often sits one call away:

- `confusionMatrix()` for the full classifier scorecard. See [caret confusionMatrix() in R](caret-confusionMatrix-in-R.html).
- `train()` for fitting and resampling models that call `postResample()` on every fold. See [caret train() in R](caret-train-in-R.html).
- `trainControl()` for swapping in a custom `summaryFunction`. See [caret trainControl() in R](caret-trainControl-in-R.html).
- `createDataPartition()` for stratified train/test splits. See [caret createDataPartition() in R](caret-createDataPartition-in-R.html).
- `preProcess()` for scaling before a regression fit. See [caret preProcess() in R](caret-preProcess-in-R.html).

For the upstream reference, see the [caret package documentation](https://topepo.github.io/caret/).

## FAQ

**What does postResample() return for regression?**

For numeric `pred` and `obs`, `postResample()` returns a named numeric vector with three entries: `RMSE`, `Rsquared` (squared Pearson correlation), and `MAE`. The vector is length 3 for a single outcome and a 3 by k matrix for multi-output regression. Subset by name with `["RMSE"]` to pull a single metric.

**Why does postResample() report Rsquared = 1 when my predictions are biased?**

caret defines `Rsquared` as the squared Pearson correlation, so a prediction shifted by a constant returns 1 even though residuals are large. The traditional 1 minus SS_res over SS_tot definition is available via `yardstick::rsq_trad()`. Always report RMSE alongside Rsquared so a biased model cannot pass off as accurate.

**How is postResample() different from defaultSummary()?**

`defaultSummary()` is the function caret calls inside the resampling loop. It expects a data frame with columns `obs` and `pred` and calls `postResample()` internally. Use `postResample()` interactively on two vectors; use `defaultSummary()` when writing a custom `summaryFunction` for `trainControl()`.

**Can I use postResample() for binary classification with probabilities?**

Not directly. `postResample()` switches on input type: factor inputs trigger Accuracy and Kappa, numeric inputs trigger regression metrics. Threshold probabilities to a factor first, or use `twoClassSummary()` which expects probabilities and returns ROC, sensitivity, and specificity.

**Does postResample() handle missing values?**

No. A single NA in either `pred` or `obs` propagates to all metrics. Drop missing rows with `complete.cases(pred, obs)` before scoring, and investigate why predictions are NA (the most common cause is a `newdata` row with an unseen factor level).
