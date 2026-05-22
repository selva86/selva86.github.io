---
title: "caret twoClassSummary() in R: ROC, Sensitivity, Specificity"
slug: "caret-twoClassSummary-in-R"
description: "Use caret twoClassSummary() in R as the binary-classification summaryFunction in trainControl. Score with ROC AUC, Sensitivity, and Specificity per fold."
keywords: "caret twoClassSummary, twoClassSummary function R, caret twoClassSummary examples, R twoClassSummary ROC, caret summaryFunction ROC, train metric ROC R, classProbs caret"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "twoClassSummary()|caret twoClassSummary|caret::twoClassSummary()|twoClassSummary function|caret ROC metric"
auto_link_case_sensitive: true
target_keyword: "caret twoClassSummary"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret twoClassSummary() in R: ROC, Sensitivity, Specificity

<p class="lead">The <code>twoClassSummary()</code> function in caret is the binary-classification <code>summaryFunction</code> that <code>trainControl()</code> calls on every resample when the outcome is a two-level factor. It accepts a data frame with <code>obs</code>, <code>pred</code>, and one probability column per class, then returns ROC (AUC), Sensitivity, and Specificity as a named numeric vector. Wiring it in is the standard way to optimise a caret model on AUC instead of accuracy.</p>

[QUICK ANSWER]
twoClassSummary(df, lev = levels(df$obs))                       # direct call
trainControl(summaryFunction = twoClassSummary, classProbs = TRUE)  # wire-in
train(..., metric = "ROC")                                       # optimise on AUC
train(..., metric = "Sens", maximize = TRUE)                    # optimise on Sensitivity
twoClassSummary(data, lev = NULL, model = NULL)                 # full signature
fit$resample                                                     # ROC/Sens/Spec per fold
levels(factor)[1]                                                # the "event" class

[DECISION TREE: Is twoClassSummary() the right summaryFunction?]
- score a two-class resample with ROC, Sens, Spec: twoClassSummary
- score regression resamples (numeric outcome): defaultSummary
- score 3+ classes (multinomial): multiClassSummary
- imbalanced classes, precision-recall preferred over ROC: prSummary
- evaluate probabilistic calibration via log-loss: mnLogLoss
- compute the full classifier scorecard (15+ metrics): confusionMatrix(pred, obs)
- score two probability vectors outside the resample loop: pROC::roc(obs, prob)

## What twoClassSummary() does in one sentence

**twoClassSummary() is caret's binary-classifier scoring contract.** It is the function `train()` calls on each fold's held-out predictions when the outcome is a two-level factor and `classProbs = TRUE`, and the function any custom binary `summaryFunction` must imitate in shape. The body computes ROC AUC using `pROC::roc()` against the first level's probability column, plus Sensitivity and Specificity from the predicted class labels.

Because the metric is computed per resample and then averaged, ROC reported in `fit$results` is the mean of fold-wise AUCs, not a single AUC pooled across all out-of-fold predictions. Both numbers are commonly cited; the mean-of-folds version is what `metric = "ROC"` tunes on.

[KEY INSIGHT]
**The first factor level is treated as the positive class.** caret reads `levels(data$obs)[1]` as the "event" label and computes Sensitivity against it. If your outcome is `c("No", "Yes")` alphabetically, "No" becomes positive, which is almost never what you want. Always set the desired event level first with `factor(x, levels = c("Yes", "No"))`.

## twoClassSummary() syntax and arguments

**The signature has three arguments and the data frame must carry four columns minimum.** caret fixes the shape so any function plugged into `summaryFunction` is interchangeable across regression and classification.

```r title="Load caret and call twoClassSummary on a simulated frame"
library(caret)

set.seed(7)
n     <- 100
truth <- factor(sample(c("yes", "no"), n, replace = TRUE, prob = c(0.4, 0.6)),
                levels = c("yes", "no"))
p_yes <- pmin(pmax(ifelse(truth == "yes", 0.65, 0.35) + rnorm(n, sd = 0.20),
                   0.01), 0.99)

df <- data.frame(
  obs  = truth,
  pred = factor(ifelse(p_yes > 0.5, "yes", "no"), levels = c("yes", "no")),
  yes  = p_yes,
  no   = 1 - p_yes
)

twoClassSummary(df, lev = levels(df$obs))
#>       ROC      Sens      Spec
#> 0.8634123 0.7727273 0.7894737
```

The required argument is `data`, a data frame with `obs` (truth factor), `pred` (predicted factor), and one numeric column per factor level holding class probabilities. The probability column names must match the factor levels exactly. The `lev` argument is the vector of level names; caret passes it automatically, but you pass it yourself when calling outside `train()`.

The return value is a length-three named numeric vector: `ROC`, `Sens`, `Spec`. `train()` rbinds one row per resample into `fit$resample` and averages into `fit$results`. Whichever name matches `metric =` in `train()` is used for tuning.

[NOTE]
**twoClassSummary requires `classProbs = TRUE` in trainControl.** Without probabilities, the function has no way to compute ROC AUC. caret throws an error during `train()` setup if you wire `summaryFunction = twoClassSummary` while `classProbs` is left at its default of FALSE.

## twoClassSummary() examples by use case

**Four patterns cover almost every call: direct scoring, wiring into trainControl, optimising on ROC, and wrapping for added metrics.** Each reuses the same function with slightly different framing.

```r title="Wire twoClassSummary into trainControl for 5-fold CV"
binary_iris <- droplevels(iris[iris$Species %in% c("versicolor", "virginica"), ])

ctrl <- trainControl(
  method          = "cv",
  number          = 5,
  classProbs      = TRUE,
  summaryFunction = twoClassSummary
)

set.seed(99)
fit <- train(Species ~ ., data = binary_iris,
             method = "glm", family = "binomial",
             trControl = ctrl, metric = "ROC")
fit$resample
#>     ROC Sens Spec Resample
#> 1 1.000  1.0  0.9    Fold1
#> 2 0.980  0.9  1.0    Fold2
#> 3 1.000  1.0  1.0    Fold3
#> 4 0.940  0.9  0.8    Fold4
#> 5 1.000  1.0  0.9    Fold5
```

Each row of `fit$resample` comes from one call to `twoClassSummary()` on that fold's held-out predictions. Optimising on ROC happens automatically because `metric = "ROC"` matches a column the function returns.

```r title="Tune a random forest's mtry on ROC"
set.seed(13)
fit_rf <- train(
  Species ~ ., data = binary_iris,
  method    = "rf",
  trControl = ctrl,
  tuneGrid  = data.frame(mtry = c(1, 2, 3)),
  metric    = "ROC"
)
fit_rf$results
#>   mtry    ROC Sens Spec     ROCSD    SensSD    SpecSD
#> 1    1 0.9920 0.94 0.92 0.0178885 0.0547723 0.0836660
#> 2    2 0.9880 0.92 0.94 0.0219089 0.0836660 0.0547723
#> 3    3 0.9880 0.92 0.92 0.0219089 0.0836660 0.0836660
```

The `ROCSD`, `SensSD`, `SpecSD` columns are the standard deviations across folds, useful for spotting unstable models. caret picks the row with the maximum ROC as the best tune.

A fourth pattern wraps twoClassSummary to add Precision and F1 without rewriting the binary core. Bind the new metrics to the named vector and keep the original three intact.

```r title="Extend twoClassSummary with precision and F1"
prSummary2 <- function(data, lev = NULL, model = NULL) {
  base <- twoClassSummary(data, lev, model)
  tp   <- sum(data$pred == lev[1] & data$obs == lev[1])
  fp   <- sum(data$pred == lev[1] & data$obs == lev[2])
  fn   <- sum(data$pred == lev[2] & data$obs == lev[1])
  prec <- tp / (tp + fp)
  f1   <- 2 * prec * base["Sens"] / (prec + base["Sens"])
  c(base, Precision = prec, F1 = unname(f1))
}

ctrl2 <- trainControl(method = "cv", number = 5,
                      classProbs = TRUE, summaryFunction = prSummary2)
set.seed(11)
fit2 <- train(Species ~ ., data = binary_iris, method = "glm",
              family = "binomial", trControl = ctrl2, metric = "F1")
colnames(fit2$resample)
#> [1] "ROC"       "Sens"      "Spec"      "Precision" "F1"        "Resample"
```

The wrapper preserves ROC, Sens, Spec and appends Precision and F1. Any function returning a named numeric vector is a valid `summaryFunction`, so this pattern is how you graft new metrics into caret without forking it.

[TIP]
**Always print `fit$resample` once during model development.** Per-fold ROC variance reveals fragility that the averaged row hides. A model with mean ROC 0.92 and per-fold range 0.78 to 0.99 is much less reliable than one with mean 0.90 and range 0.88 to 0.92.

## twoClassSummary() vs alternatives

**caret ships five summaryFunctions plus the postResample helper.** The right one depends on outcome type, class balance, and which metrics drive the decision.

| summaryFunction      | Outcome type        | Returned metrics                          | Picks when                                            |
|----------------------|---------------------|-------------------------------------------|-------------------------------------------------------|
| `twoClassSummary`    | Two-class factor    | ROC, Sens, Spec                           | Binary classification, balanced or moderately imbalanced |
| `prSummary`          | Two-class factor    | AUC (PR), Precision, Recall, F            | Heavily imbalanced binary, precision-recall focus     |
| `multiClassSummary`  | 3+ class factor     | Accuracy, Kappa, per-class metrics        | Multinomial outcomes                                  |
| `mnLogLoss`          | Two- or multi-class | logLoss                                   | Probability calibration matters more than hard label  |
| `defaultSummary`     | Numeric (regression)| RMSE, Rsquared, MAE                       | Regression resampling                                 |
| `postResample`       | Either              | RMSE/Rsq/MAE or Accuracy/Kappa            | Quick scoring of two vectors outside `train()`        |

Pick twoClassSummary when the outcome is a two-level factor and ROC is the headline metric. If positives are rare (under 10 percent of rows), switch to `prSummary` so PR-AUC reflects ranking on the minority class. Use mnLogLoss for calibration, and confusionMatrix() for one-off scoring outside the resample loop.

## Common pitfalls

**Four mistakes account for most twoClassSummary() bugs.** Each has a quick fix.

```r title="Pitfall 1: classProbs left at FALSE"
ctrl_bad <- trainControl(method = "cv", number = 5,
                         summaryFunction = twoClassSummary)  # classProbs missing
set.seed(1)
try(train(Species ~ ., data = binary_iris, method = "glm",
          family = "binomial", trControl = ctrl_bad, metric = "ROC"))
#> Error: train()'s use of ROC codes requires class probabilities. See
#> the classProbs option of trainControl()
```

The fix is to add `classProbs = TRUE`. caret cannot compute ROC AUC without a probability column for each class.

```r title="Pitfall 2: wrong probability column names"
bad_df <- data.frame(
  obs   = factor(c("yes", "no", "yes"), levels = c("yes", "no")),
  pred  = factor(c("yes", "no", "no"),  levels = c("yes", "no")),
  prob1 = c(0.8, 0.2, 0.4),
  prob2 = c(0.2, 0.8, 0.6)
)
try(twoClassSummary(bad_df, lev = c("yes", "no")))
#> Error in twoClassSummary(bad_df, lev = c("yes", "no")) :
#>   columns for class probabilities are missing
```

The probability columns must be named exactly after the factor levels. Rename `prob1` to `yes` and `prob2` to `no` and the call succeeds.

```r title="Pitfall 3: positive class is the wrong level"
truth <- factor(c("No", "Yes", "Yes", "No"))  # alphabetical: No is level 1
levels(truth)
#> [1] "No"  "Yes"
```

caret treats `levels(obs)[1]` as the positive class. Alphabetical ordering makes "No" the event, which inverts Sensitivity and Specificity from what the reader expects. Set the order explicitly: `factor(x, levels = c("Yes", "No"))`.

```r title="Pitfall 4: factor levels with spaces or invalid R names"
truth_bad <- factor(c("class 0", "class 1"), levels = c("class 0", "class 1"))
levels(truth_bad)
#> [1] "class 0" "class 1"
```

caret uses level names as column names for class probabilities. Spaces, dashes, and numeric starts trigger `train()` errors when columns are bound to the data frame. Use `make.names()` or rename levels to syntactic names: `levels(truth_bad) <- c("class0", "class1")`.

[WARNING]
**ROC is computed per resample and then averaged.** This is not the same as pooling all out-of-fold predictions and computing one AUC. With unbalanced folds or small samples, mean-of-fold AUC can differ from pooled AUC by 0.02 or more. Cite the metric you used; reviewers will ask.

## Try it yourself

**Try it:** Build a 5-fold CV pipeline on `binary_iris` (versicolor vs virginica) predicting `Species` from `Sepal.Length` and `Sepal.Width` with `glm`. Wire `twoClassSummary` explicitly into `trainControl()` and tune on ROC. Save the mean ROC to `ex_roc`.

```r title="Your turn: twoClassSummary on iris sepals"
# Try it: explicit twoClassSummary on a sepal-only binary classifier
ex_data <- droplevels(iris[iris$Species %in% c("versicolor", "virginica"), ])
ex_ctrl <- # your code here: cv, number = 5, classProbs = TRUE, twoClassSummary
ex_fit  <- # your code here: train Species ~ Sepal.Length + Sepal.Width, glm binomial
ex_roc  <- # your code here: mean of fit$resample$ROC

ex_roc
#> Expected: a single numeric between 0.75 and 0.85
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- droplevels(iris[iris$Species %in% c("versicolor", "virginica"), ])
ex_ctrl <- trainControl(method = "cv", number = 5,
                        classProbs = TRUE, summaryFunction = twoClassSummary)
set.seed(1)
ex_fit  <- train(Species ~ Sepal.Length + Sepal.Width, data = ex_data,
                 method = "glm", family = "binomial",
                 trControl = ex_ctrl, metric = "ROC")
ex_roc  <- mean(ex_fit$resample$ROC)

ex_roc
#> [1] 0.804
```

**Explanation:** Restricting predictors to sepal length and width strips out the highly discriminative petal features, so ROC drops from near 1 (with all four predictors) to around 0.80. Averaging `fit$resample$ROC` reproduces the mean-of-folds AUC that `fit$results$ROC` reports.

</details>

## Related caret functions

The metric machinery sits one call away:

- `defaultSummary()` for regression resample scoring. See [caret defaultSummary() in R](caret-defaultSummary-in-R.html).
- `postResample()` for two-vector scoring outside the resample loop. See [caret postResample() in R](caret-postResample-in-R.html).
- `trainControl()` for swapping summaryFunctions and configuring resamples. See [caret trainControl() in R](caret-trainControl-in-R.html).
- `train()` for the resample-and-tune driver that calls twoClassSummary. See [caret train() in R](caret-train-in-R.html).
- `confusionMatrix()` for the full classification scorecard with 15+ metrics. See [caret confusionMatrix() in R](caret-confusionMatrix-in-R.html).

For the upstream reference, see the [caret package documentation](https://topepo.github.io/caret/measuring-performance.html).

## FAQ

**What does twoClassSummary() return?**

For a data frame with a two-level factor `obs`, a matching `pred` factor, and one probability column per level, `twoClassSummary()` returns a length-three named numeric vector: `ROC`, `Sens`, and `Spec`. ROC is the area under the ROC curve computed with `pROC::roc()`, Sensitivity is the recall on the first factor level (the event), and Specificity is the recall on the second level. caret rbinds one such row per fold into `fit$resample` and averages into `fit$results`.

**Why does my ROC come out as 0.5 or look reversed?**

The first level of the outcome factor is treated as the positive class. If your factor is `c("No", "Yes")` alphabetically, "No" is positive and the probability column caret reads is "No", which inverts the AUC. The fix is to set levels explicitly with `factor(x, levels = c("Yes", "No"))` so the event class is first. Always inspect `levels(data$obs)` before training.

**twoClassSummary or prSummary for imbalanced data?**

Use `prSummary` when the positive class is under roughly 10 percent of rows. The ROC curve under twoClassSummary is dominated by the abundant negative class, so a model that ranks the rare positives poorly can still report a high AUC. The precision-recall AUC that `prSummary` returns is more sensitive to performance on the minority class. For moderately imbalanced data (20 to 40 percent positive), twoClassSummary remains the standard choice.

**Can I tune on Sensitivity instead of ROC?**

Yes. Pass `metric = "Sens"` and `maximize = TRUE` to `train()`; caret picks the hyperparameter row with the highest mean Sensitivity. Tuning on Sens alone is risky because a model that predicts everything as the event scores Sens = 1. Pair it with a Specificity floor, or define a custom metric that combines both.

**How does twoClassSummary differ from confusionMatrix()?**

`twoClassSummary(data, lev)` returns three resample-friendly metrics from a frame with probability columns; `confusionMatrix(pred, obs)` returns 15-plus metrics from two factor vectors. twoClassSummary is what `train()` calls per fold; confusionMatrix is what you call once on a held-out test set for the final report.
