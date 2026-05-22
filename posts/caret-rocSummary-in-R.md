---
title: "caret rocSummary in R: ROC AUC With twoClassSummary"
slug: "caret-rocSummary-in-R"
description: "caret has no rocSummary() function; use twoClassSummary() to score binary models on ROC AUC, Sensitivity, and Specificity per fold inside trainControl()."
keywords: "caret rocSummary, rocSummary caret R, caret ROC summary function, caret summaryFunction ROC, caret twoClassSummary, R caret ROC AUC, caret train metric ROC"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "rocSummary|caret rocSummary|rocSummary caret|rocSummary function|caret ROC summary"
auto_link_case_sensitive: true
target_keyword: "caret rocSummary"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret rocSummary in R: ROC AUC With twoClassSummary

<p class="lead">caret rocSummary is the function name many R users type when they want ROC AUC as a resampling metric, but the caret package ships no function called <code>rocSummary()</code>. The right function is <code>twoClassSummary()</code> for binary outcomes, <code>prSummary()</code> for precision-recall, and <code>multiClassSummary()</code> for three or more classes. This page maps the search term to the actual function and shows the wiring that scores ROC AUC inside <code>trainControl()</code>.</p>

[QUICK ANSWER]
twoClassSummary(df, lev = levels(df$obs))                          # binary ROC, Sens, Spec
trainControl(summaryFunction = twoClassSummary, classProbs = TRUE) # wire-in for train()
train(..., metric = "ROC")                                          # tune on ROC AUC
prSummary(df, lev = levels(df$obs))                                # PR-AUC for imbalanced data
multiClassSummary(df, lev = levels(df$obs))                        # 3+ classes, per-class AUC
pROC::roc(obs, prob)                                                # raw ROC outside caret
fit$resample$ROC                                                    # per-fold AUC after train()

[DECISION TREE: Which caret function gives me ROC AUC?]
- score a two-class resample on ROC AUC: twoClassSummary
- score 3+ classes with per-class AUC: multiClassSummary
- score heavily imbalanced binary (rare positives): prSummary
- compute ROC AUC for two raw vectors: pROC::roc(obs, prob)
- score regression resamples (numeric outcome): defaultSummary
- one-off scoring outside the resample loop: postResample
- need the full classifier scorecard: confusionMatrix(pred, obs)

## What is "rocSummary" in caret?

**There is no function named rocSummary in the caret package.** The search term most often refers to `twoClassSummary()`, which is the binary-classification `summaryFunction` that `trainControl()` calls per fold and which returns ROC AUC together with Sensitivity and Specificity. A few tutorials and custom training scripts define their own `rocSummary` wrapper, but it is not a built-in caret export. If you typed `caret::rocSummary` and got `Error in loadNamespace`, that is the underlying reason.

[KEY INSIGHT]
**caret names its summary functions by what they cover, not by the metric.** `twoClassSummary` covers any binary outcome, `multiClassSummary` covers any multinomial outcome, `defaultSummary` covers regression. ROC AUC sits inside `twoClassSummary` and `multiClassSummary` rather than getting its own dedicated function.

## Use twoClassSummary() for binary ROC AUC

**twoClassSummary() is the binary classifier scoring contract caret runs on every resample.** It accepts a data frame with `obs`, `pred`, and one probability column per class, then returns a named numeric vector with `ROC`, `Sens`, and `Spec`. To wire it into a `train()` call, set `summaryFunction = twoClassSummary` and `classProbs = TRUE` in `trainControl()`, then pass `metric = "ROC"` to `train()` so tuning optimises AUC.

```r title="Wire twoClassSummary for ROC AUC scoring"
library(caret)

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
fit$results
#>   parameter   ROC Sens Spec      ROCSD    SensSD    SpecSD
#> 1      none 0.992 0.94 0.96 0.01788854 0.0547723 0.0547723
```

`fit$results` reports the mean ROC across folds plus the per-fold standard deviation (`ROCSD`). caret picks the row with the maximum mean ROC as the best tune; here the model has no tuning grid, so a single row is returned.

[NOTE]
**classProbs = TRUE is mandatory.** Without it, caret has no probability column to feed into the ROC calculation and `train()` aborts with "use of ROC codes requires class probabilities."

## Tune a caret model on ROC AUC

**Once twoClassSummary is wired in, any tunable model optimises ROC AUC automatically.** Pass a `tuneGrid` (or `tuneLength`) and caret rbinds one row per (resample, hyperparameter) pair into `fit$resample`, then averages into `fit$results`. The row with the highest mean `ROC` becomes `fit$bestTune`.

```r title="Tune a random forest on ROC"
set.seed(13)
fit_rf <- train(
  Species ~ ., data = binary_iris,
  method    = "rf",
  trControl = ctrl,
  tuneGrid  = data.frame(mtry = c(1, 2, 3)),
  metric    = "ROC"
)
fit_rf$bestTune
#>   mtry
#> 1    1
fit_rf$results
#>   mtry    ROC Sens Spec      ROCSD    SensSD    SpecSD
#> 1    1 0.9920 0.94 0.96 0.01788854 0.0547723 0.0547723
#> 2    2 0.9880 0.92 0.94 0.02190890 0.0836660 0.0547723
#> 3    3 0.9880 0.92 0.92 0.02190890 0.0836660 0.0836660
```

The per-resample AUCs live in `fit_rf$resample$ROC`, useful for sanity-checking that the mean is not driven by one outlier fold.

## Multi-class ROC AUC with multiClassSummary()

**For three or more classes, multiClassSummary() returns per-class AUC plus a weighted mean.** It lives in `caret`'s extended metrics and requires `classProbs = TRUE` plus one probability column per factor level. The function reports `Mean_AUC` (one-vs-rest, averaged), `prAUC`, accuracy, and per-class precision, recall, and F1.

```r title="Multi-class ROC AUC on iris"
ctrl_mc <- trainControl(
  method          = "cv",
  number          = 5,
  classProbs      = TRUE,
  summaryFunction = multiClassSummary
)

set.seed(21)
fit_mc <- train(Species ~ ., data = iris,
                method = "rf",
                trControl = ctrl_mc,
                tuneGrid  = data.frame(mtry = 2),
                metric    = "Mean_AUC")
fit_mc$results[, c("mtry", "Mean_AUC", "Accuracy", "Kappa")]
#>   mtry  Mean_AUC Accuracy Kappa
#> 1    2 0.9933333     0.96  0.94
```

`Mean_AUC` is the macro-average of three one-vs-rest AUCs (setosa, versicolor, virginica) and is the multi-class analogue of ROC AUC. Tune on it by passing `metric = "Mean_AUC"`.

## rocSummary vs twoClassSummary vs prSummary

**Map the search term to the right built-in by outcome type and class balance.** All three are valid `summaryFunction` values; pick the one whose metric drives the tuning decision.

| Search term users type | Actual caret function | Returns                         | When to use                                       |
|------------------------|-----------------------|---------------------------------|---------------------------------------------------|
| `rocSummary`           | `twoClassSummary`     | ROC AUC, Sens, Spec             | Binary outcome, balanced or moderately imbalanced |
| `roc auc multi-class`  | `multiClassSummary`   | Mean_AUC plus per-class metrics | Three or more classes                             |
| `pr auc summary`       | `prSummary`           | AUC (PR), Precision, Recall, F  | Heavily imbalanced binary (under 10 percent positives) |
| `regression rmse`      | `defaultSummary`      | RMSE, Rsquared, MAE             | Numeric outcome                                   |
| `log loss caret`       | `mnLogLoss`           | logLoss                         | Probability calibration matters                   |

[TIP]
**Print `fit$resample` before trusting the headline metric.** Per-fold ROC variance reveals model fragility that the averaged number hides. A mean ROC of 0.92 with a per-fold range of 0.78 to 0.99 is much less reliable than one with mean 0.90 and range 0.88 to 0.92.

## Common mistakes when searching for rocSummary

**Three patterns account for most of the trouble.** Each has a one-line fix.

```r title="Mistake 1: calling rocSummary directly"
try(rocSummary(df, lev = c("yes", "no")))
#> Error in rocSummary(df, lev = c("yes", "no")) :
#>   could not find function "rocSummary"

try(caret::rocSummary)
#> Error: 'rocSummary' is not an exported object from 'namespace:caret'
```

The function does not exist in caret. Replace `rocSummary` with `twoClassSummary` and the call resolves. Keep `lev = levels(df$obs)` so the positive class is read from the factor.

```r title="Mistake 2: classProbs left at FALSE while requesting metric = ROC"
ctrl_bad <- trainControl(method = "cv", number = 5,
                         summaryFunction = twoClassSummary)
set.seed(1)
try(train(Species ~ ., data = binary_iris, method = "glm",
          family = "binomial", trControl = ctrl_bad, metric = "ROC"))
#> Error: train()'s use of ROC codes requires class probabilities. See
#> the classProbs option of trainControl()
```

Add `classProbs = TRUE` to `trainControl()`. ROC AUC cannot be computed from hard predictions; the function needs a probability column for each factor level.

```r title="Mistake 3: the wrong factor level is treated as positive"
truth <- factor(c("No", "Yes", "Yes", "No"))
levels(truth)
#> [1] "No"  "Yes"
```

caret reads `levels(obs)[1]` as the event. Alphabetical ordering makes "No" the positive class, which inverts Sensitivity and Specificity from what the analyst expects. Set the order explicitly: `factor(x, levels = c("Yes", "No"))` so "Yes" is the event.

[WARNING]
**ROC reported in fit$results is the mean of per-fold AUCs, not a pooled AUC across all out-of-fold predictions.** With unbalanced folds or small samples, the two numbers can differ by 0.02 or more. Cite the metric you actually used; reviewers and reproducers will ask.

## Try it yourself

**Try it:** Build a 5-fold CV pipeline on `binary_iris` (versicolor vs virginica) predicting `Species` from `Sepal.Length` and `Sepal.Width` with a logistic regression. Wire `twoClassSummary` into `trainControl()` and tune on ROC. Save the mean ROC across folds to `ex_roc`.

```r title="Your turn: score ROC AUC via twoClassSummary"
# Try it: score a sepal-only binary classifier with ROC AUC
ex_data <- droplevels(iris[iris$Species %in% c("versicolor", "virginica"), ])
ex_ctrl <- # your code here: cv, number = 5, classProbs = TRUE, twoClassSummary
ex_fit  <- # your code here: train Species ~ Sepal.Length + Sepal.Width, glm binomial
ex_roc  <- # your code here: mean of ex_fit$resample$ROC

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

**Explanation:** Sepal length and width alone produce a weaker classifier than the full four-predictor model, so ROC drops from near 1 to about 0.80. Averaging `fit$resample$ROC` reproduces the mean-of-folds AUC that `fit$results$ROC` reports.

</details>

## Related caret functions

The full ROC and resampling toolchain sits one call away:

- `twoClassSummary()` for the binary ROC AUC contract. See [caret twoClassSummary() in R](caret-twoClassSummary-in-R.html).
- `prSummary()` for precision-recall AUC on imbalanced binary data. See [caret prSummary() in R](caret-prSummary-in-R.html).
- `multiClassSummary()` for per-class AUC across three or more classes. See [caret multiClassSummary() in R](caret-multiClassSummary-in-R.html).
- `defaultSummary()` for regression resample scoring. See [caret defaultSummary() in R](caret-defaultSummary-in-R.html).
- `trainControl()` for swapping summaryFunctions and configuring resamples. See [caret trainControl() in R](caret-trainControl-in-R.html).
- `confusionMatrix()` for the full binary classification scorecard. See [caret confusionMatrix() in R](caret-confusionMatrix-in-R.html).

For the upstream reference, see the [caret measuring performance guide](https://topepo.github.io/caret/measuring-performance.html).

## FAQ

**Is rocSummary a real function in caret?**

No. The caret package does not export a function named `rocSummary()`. Calls like `caret::rocSummary` or `rocSummary(df)` return "could not find function" because the symbol is undefined. The closest built-in is `twoClassSummary()`, which returns a named numeric vector with `ROC`, `Sens`, and `Spec` for binary outcomes. A few user-written scripts define a local `rocSummary <- function(data, lev, model) ...` wrapper, but that is custom code, not part of caret.

**Which caret function should I use to score ROC AUC?**

Use `twoClassSummary()` for binary classification (two-level factor outcome) and `multiClassSummary()` for three or more classes. Both go into `trainControl(summaryFunction = ..., classProbs = TRUE)`, and you tune the model by passing `metric = "ROC"` or `metric = "Mean_AUC"` to `train()`. For heavily imbalanced binary data, switch to `prSummary()` so the metric reflects ranking on the rare positive class.

**Why does my caret model give the wrong ROC?**

Two checks. First, confirm `classProbs = TRUE` in `trainControl()`; without it, caret has no probability column and `train()` aborts. Second, check `levels(your_outcome)` and make sure the intended positive class is the FIRST level. caret treats `levels(obs)[1]` as the event, so an alphabetical factor like `c("No", "Yes")` puts "No" as positive and inverts Sens/Spec from what most analysts expect.

**Can I compute ROC AUC without caret?**

Yes. Use `pROC::roc(response = obs, predictor = prob)` and read the `auc` element, or `PRROC::roc.curve(scores.class0 = prob, weights.class0 = (obs == "yes"))` for a different implementation. Both accept raw vectors and do not require the caret resample frame. Inside caret, however, `twoClassSummary` is preferred because it produces per-fold AUCs that align with the rest of the `fit$resample` columns.

**How do I tune on Sensitivity or Specificity instead of ROC?**

Pass `metric = "Sens"` or `metric = "Spec"` to `train()` and keep `summaryFunction = twoClassSummary`. caret picks the hyperparameter row with the highest mean of the requested column. Tuning on Sens alone is risky because a model that always predicts the positive class scores Sens = 1; pair it with a Specificity floor in a custom summary, or stick with ROC for a balanced objective.
