---
title: "caret defaultSummary() in R: Regression Resample Metrics"
slug: "caret-defaultSummary-in-R"
description: "Use caret defaultSummary() in R as the default regression summaryFunction in trainControl. Score resamples with RMSE, R-squared, and MAE from obs and pred."
keywords: "caret defaultSummary, defaultSummary function R, caret defaultSummary examples, defaultSummary trainControl, R regression metrics caret, summaryFunction default caret"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "defaultSummary()|caret defaultSummary|caret::defaultSummary()|defaultSummary function|caret summaryFunction"
auto_link_case_sensitive: true
target_keyword: "caret defaultSummary"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret defaultSummary() in R: Regression Resample Metrics

<p class="lead">The <code>defaultSummary()</code> function in caret is the regression-side <code>summaryFunction</code> that <code>trainControl()</code> calls on every resample. It accepts a data frame with columns named <code>obs</code> and <code>pred</code> and returns a named numeric vector of RMSE, R-squared, and MAE. caret wires it in by default for numeric outcomes, so every regression resample row in <code>fit$resample</code> comes from this one function.</p>

[QUICK ANSWER]
defaultSummary(data.frame(obs = y, pred = yhat))           # regression metrics
trainControl(summaryFunction = defaultSummary)             # explicit default
train(..., metric = "RMSE")                                # optimise on RMSE
train(..., metric = "Rsquared", maximize = TRUE)           # optimise on R-squared
defaultSummary(data, lev = NULL, model = NULL)             # full API signature
fit$resample                                                # rows defaultSummary produced
defaultSummary(df)["MAE"]                                  # extract one metric

[DECISION TREE: Is defaultSummary() the right summaryFunction?]
- score a regression resample (numeric outcome): defaultSummary
- score a two-class problem with ROC, Sens, Spec: twoClassSummary
- score a multi-class problem with Accuracy plus Kappa: multiClassSummary
- need log-loss for probabilistic classification: mnLogLoss
- score two vectors outside the resample loop: postResample(pred, obs)
- need a full classifier scorecard (15 metrics): confusionMatrix(pred, obs)
- build your own metric: write a function with the (data, lev, model) signature

## What defaultSummary() does in one sentence

**defaultSummary() is caret's regression scoring contract.** It is the function `train()` calls on each fold's held-out predictions when the outcome is numeric, and the function any custom `summaryFunction` must imitate in shape. The body simply wraps `postResample(data$pred, data$obs)` and returns a length-three named numeric vector with `RMSE`, `Rsquared`, and `MAE`.

The data-frame interface (rather than two vectors) exists so caret can pipe in resample frames that may carry extra columns (`rowIndex`, `Resample`, model-specific predictions) without breaking the contract.

[KEY INSIGHT]
**defaultSummary() is regression-only.** A factor outcome silently produces NAs because the metrics arithmetic falls through `postResample()`'s numeric branch but the columns are wrong. For classification, switch to `twoClassSummary` or `multiClassSummary` inside `trainControl()`.

## defaultSummary() syntax and arguments

**The signature has three arguments but only one carries data.** caret fixes the shape so any function plugged into `summaryFunction` is interchangeable.

```r title="Load caret and call defaultSummary on a tiny frame"
library(caret)

set.seed(1)
n  <- 20
df <- data.frame(
  obs  = rnorm(n, mean = 10, sd = 3),
  pred = NA
)
df$pred <- df$obs + rnorm(n, sd = 1.2)

defaultSummary(df)
#>     RMSE Rsquared      MAE
#>  1.13245  0.85992  0.93871
```

The required argument is `data`, a data frame with at minimum columns `obs` (truth) and `pred` (model output). The other two, `lev` (factor levels) and `model` (training method name), are part of the API contract for swap-ability but are ignored by this implementation. Custom summaryFunctions for classification, like `twoClassSummary`, read both.

The return value is a flat named numeric vector. `train()` rbinds one row per resample into `fit$resample`, then averages columns into `fit$results`. The names you return become the column names; whichever name matches `metric =` in the `train()` call is used for tuning.

[NOTE]
**The data frame can carry extra columns.** caret passes the full resample frame, often with `rowIndex` and `Resample`. defaultSummary ignores everything except `obs` and `pred`, so wrapping it in a custom function and adding metrics is safe.

## defaultSummary() examples by use case

**Four patterns cover almost every call: direct scoring, wiring into trainControl, optimising on a chosen metric, and wrapping it for custom output.** Each reuses the same function with slightly different framing.

```r title="Direct scoring with mtcars predictions"
set.seed(42)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
tr  <- mtcars[idx, ]
te  <- mtcars[-idx, ]

fit  <- lm(mpg ~ wt + hp + cyl, data = tr)
scores_df <- data.frame(obs = te$mpg, pred = predict(fit, te))

defaultSummary(scores_df)
#>     RMSE Rsquared      MAE
#>  2.78924  0.81012  2.24560
```

The same numbers come out of `postResample(pred, obs)`. The reason to use defaultSummary here is consistency: a script that scores resamples via `summaryFunction` and ad-hoc test sets the same way is easier to maintain.

Wiring defaultSummary into `trainControl()` is the canonical use. caret defaults to it for numeric outcomes, but stating it explicitly documents intent.

```r title="Use defaultSummary inside trainControl"
ctrl <- trainControl(
  method          = "cv",
  number          = 5,
  summaryFunction = defaultSummary
)

set.seed(99)
fit <- train(mpg ~ ., data = mtcars, method = "lm", trControl = ctrl)
fit$resample
#>       RMSE  Rsquared      MAE Resample
#> 1  2.96120 0.7548204 2.376811   Fold1
#> 2  2.51307 0.8423110 2.084322   Fold2
#> 3  3.34508 0.7012998 2.715890   Fold3
#> 4  2.78224 0.8001457 2.349557   Fold4
#> 5  3.12880 0.7660451 2.512603   Fold5
```

The `metric =` argument of `train()` picks which column drives tuning. Pass `"RMSE"` (minimised) or `"Rsquared"` with `maximize = TRUE`.

```r title="Optimise hyperparameters on Rsquared"
set.seed(7)
fit_rf <- train(
  mpg ~ ., data = mtcars,
  method    = "rf",
  trControl = ctrl,
  tuneGrid  = data.frame(mtry = c(2, 4, 6)),
  metric    = "Rsquared",
  maximize  = TRUE
)
fit_rf$results
#>   mtry     RMSE  Rsquared      MAE    RMSESD RsquaredSD     MAESD
#> 1    2 2.532166 0.8678321 1.997104 0.4271552 0.07140218 0.3614872
#> 2    4 2.444819 0.8784512 1.918244 0.3994018 0.06887911 0.3433215
#> 3    6 2.451907 0.8761283 1.929011 0.4022891 0.06955744 0.3470001
```

A fourth pattern wraps defaultSummary to add extra metrics without rewriting the regression core. Bind the new metric to the named vector and keep the original columns intact.

```r title="Extend defaultSummary with a custom metric"
mapeSummary <- function(data, lev = NULL, model = NULL) {
  base <- defaultSummary(data, lev, model)
  mape <- mean(abs((data$obs - data$pred) / data$obs)) * 100
  c(base, MAPE = mape)
}

ctrl2 <- trainControl(method = "cv", number = 5, summaryFunction = mapeSummary)
set.seed(11)
fit2 <- train(mpg ~ ., data = mtcars, method = "lm", trControl = ctrl2)
colnames(fit2$resample)
#> [1] "RMSE"     "Rsquared" "MAE"      "MAPE"     "Resample"
```

The wrapper keeps the standard three metrics and adds Mean Absolute Percentage Error. Any function that returns a named numeric vector is a valid `summaryFunction`; using defaultSummary as the base makes the new metric drop into reporting code that already reads RMSE, Rsquared, and MAE.

[TIP]
**Always print `fit$resample` once during model development.** It shows per-fold variance that the averaged `fit$results` row hides. A model with mean RMSE 2.5 and per-fold RMSE ranging 1.8 to 3.6 is less reliable than one with mean 2.7 and range 2.5 to 2.9.

## defaultSummary() vs alternatives

**Caret ships five summaryFunctions plus the postResample helper.** The right one depends on outcome type and which metrics you want recorded.

| summaryFunction       | Outcome type        | Returned metrics                          | Picks when                                    |
|-----------------------|---------------------|-------------------------------------------|-----------------------------------------------|
| `defaultSummary`      | Numeric (regression)| RMSE, Rsquared, MAE                       | Standard regression resampling (the default)  |
| `twoClassSummary`     | Two-class factor    | ROC, Sens, Spec                           | Binary classification with `classProbs=TRUE`  |
| `multiClassSummary`   | Multi-class factor  | Accuracy, Kappa, per-class metrics        | More than two classes                         |
| `mnLogLoss`           | Two- or multi-class | logLoss                                   | Probability-calibrated classifiers            |
| `prSummary`           | Two-class factor    | AUC, Precision, Recall, F                 | Imbalanced classification, precision-recall   |
| `postResample`        | Either              | RMSE/Rsq/MAE or Accuracy/Kappa            | Quick scoring of two vectors outside `train()`|

Pick defaultSummary when the outcome is numeric and you want the three standard regression metrics. Switch to twoClassSummary the moment the outcome becomes a binary factor; remember to also set `trainControl(classProbs = TRUE, summaryFunction = twoClassSummary)`. Use multiClassSummary for three or more classes, mnLogLoss when probability calibration matters more than the hard label, and prSummary when classes are imbalanced and ROC overstates performance.

## Common pitfalls

**Three mistakes account for most defaultSummary() bugs.** Each has a quick fix.

```r title="Pitfall 1: column names must be obs and pred"
bad <- data.frame(actual = c(1, 2, 3), predicted = c(1.1, 1.9, 3.05))
defaultSummary(bad)
#> Error in data$obs - data$pred :
#>   non-numeric argument to binary operator
```

defaultSummary reads `data$obs` and `data$pred` literally. Rename columns before calling, or use `postResample(pred, obs)` when starting from vectors. The error message refers to `NULL - NULL` because the missing columns become NULL.

```r title="Pitfall 2: a factor outcome returns RMSE NAs"
df_factor <- data.frame(
  obs  = factor(c("yes", "no", "yes")),
  pred = factor(c("yes", "no", "no"))
)
defaultSummary(df_factor)
#>     RMSE Rsquared      MAE
#>       NA       NA       NA
```

defaultSummary is regression-only. A factor outcome falls through the same code path but the numeric arithmetic produces NAs. Swap to `twoClassSummary` or `multiClassSummary` for factor outcomes, and remember to set `classProbs = TRUE` when the metric needs probabilities.

```r title="Pitfall 3: train() ignores defaultSummary when classProbs = TRUE without a classification summary"
ctrl_bad <- trainControl(method = "cv", classProbs = TRUE)  # no summaryFunction set
set.seed(3)
fit_bad <- train(Species ~ ., data = iris, method = "rpart", trControl = ctrl_bad)
fit_bad$results[, c("Accuracy", "Kappa")]
#>    Accuracy     Kappa
#> 1 0.9333333 0.9000000
```

Here caret silently swaps in a classification summary because the outcome is a factor; the explicit `defaultSummary` would have failed earlier. The fix is to make summaryFunction explicit (`summaryFunction = multiClassSummary`) so the metric set is intentional and the code reads its own intent.

[WARNING]
**The R-squared in defaultSummary is squared Pearson correlation, not 1 minus SS_res over SS_tot.** A perfectly correlated but shifted prediction returns Rsquared = 1 while residuals are large. Always inspect RMSE alongside Rsquared before claiming a strong regression fit.

## Try it yourself

**Try it:** Build a 5-fold CV pipeline on `airquality` (drop NAs) predicting `Ozone` from `Solar.R` and `Wind` with `lm`. Wire `defaultSummary` explicitly into `trainControl()`. Save the mean RMSE to `ex_rmse`.

```r title="Your turn: defaultSummary on airquality"
# Try it: explicit defaultSummary on airquality CV
ex_data <- na.omit(airquality)
ex_ctrl <- # your code here: trainControl with method='cv', number=5, summaryFunction=defaultSummary
ex_fit  <- # your code here: train Ozone ~ Solar.R + Wind, method='lm'
ex_rmse <- # your code here: mean of fit$resample$RMSE

ex_rmse
#> Expected: a single numeric near 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- na.omit(airquality)
ex_ctrl <- trainControl(method = "cv", number = 5, summaryFunction = defaultSummary)
set.seed(1)
ex_fit  <- train(Ozone ~ Solar.R + Wind, data = ex_data,
                 method = "lm", trControl = ex_ctrl)
ex_rmse <- mean(ex_fit$resample$RMSE)

ex_rmse
#> [1] 20.93817
```

**Explanation:** `na.omit()` removes rows with missing values; `trainControl(summaryFunction = defaultSummary)` makes the regression scorer explicit; averaging `fit$resample$RMSE` gives the cross-validated RMSE that `fit$results` would also report.

</details>

## Related caret functions

The metric machinery sits one call away:

- `postResample()` for vector-in scoring outside the resample loop. See [caret postResample() in R](caret-postResample-in-R.html).
- `trainControl()` for swapping summaryFunctions and configuring resamples. See [caret trainControl() in R](caret-trainControl-in-R.html).
- `train()` for the resample-and-tune driver that calls defaultSummary. See [caret train() in R](caret-train-in-R.html).
- `confusionMatrix()` for the full classification scorecard. See [caret confusionMatrix() in R](caret-confusionMatrix-in-R.html).
- `createDataPartition()` for the train/test split that feeds resampling. See [caret createDataPartition() in R](caret-createDataPartition-in-R.html).

For the upstream reference, see the [caret package documentation](https://topepo.github.io/caret/).

## FAQ

**What does defaultSummary() return?**

For a data frame with numeric `obs` and `pred` columns, `defaultSummary()` returns a length-three named numeric vector: `RMSE`, `Rsquared` (squared Pearson correlation), and `MAE`. caret rbinds one such row per fold into `fit$resample`, then averages columns into `fit$results`. The names of the vector become the column names you can pass to `metric =` in `train()`.

**How is defaultSummary() different from postResample()?**

`postResample(pred, obs)` takes two vectors; `defaultSummary(data)` takes a data frame with columns named `obs` and `pred`. defaultSummary calls postResample internally on those columns. The data-frame interface exists so caret can hand the resample frame to any pluggable `summaryFunction` without unpacking it, and it ignores extra columns like `rowIndex` and `Resample`.

**Can I use defaultSummary() for classification?**

No. defaultSummary is regression-only and returns NAs for factor `obs` and `pred`. Use `twoClassSummary` for binary outcomes (returns ROC, Sens, Spec; requires `classProbs = TRUE`), `multiClassSummary` for three or more classes, or `mnLogLoss` when probability calibration matters. All three share the `(data, lev, model)` signature so they swap into `trainControl(summaryFunction = ...)` cleanly.

**How do I add a custom metric to defaultSummary's output?**

Write a wrapper function with the same `(data, lev = NULL, model = NULL)` signature that calls `defaultSummary(data)`, computes the extra metric, and concatenates it onto the returned vector with `c(base, NewMetric = value)`. Pass that wrapper into `trainControl(summaryFunction = ...)`. The new column appears in `fit$resample` and can be passed to `metric =` in `train()`.

**Why is my Rsquared near 1 but predictions look wrong?**

caret's Rsquared is the squared Pearson correlation between `obs` and `pred`, not the traditional 1 minus SS_res over SS_tot. A model whose predictions are perfectly correlated but shifted by a constant returns Rsquared = 1 while RMSE is large. Always pair Rsquared with RMSE in reporting, and use `yardstick::rsq_trad()` if you need the traditional definition.
