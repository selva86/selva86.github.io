---
title: "caret multiClassSummary() in R: Multi-Class Metrics"
slug: "caret-multiClassSummary-in-R"
description: "Use caret multiClassSummary() in R as the multi-class summaryFunction in trainControl. Tune on AUC, logLoss, or Mean_F1 across 14 macro-averaged metrics."
keywords: "caret multiClassSummary, multiClassSummary function R, caret multiClassSummary examples, R multiClassSummary AUC, caret summaryFunction multiclass, multinomial logLoss caret, classProbs caret"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "multiClassSummary()|caret multiClassSummary|caret::multiClassSummary()|multiClassSummary function|caret multi-class metric"
auto_link_case_sensitive: true
target_keyword: "caret multiClassSummary"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret multiClassSummary() in R: Multi-Class Metrics

<p class="lead">The <code>multiClassSummary()</code> function in caret is the multinomial <code>summaryFunction</code> that <code>trainControl()</code> calls on every resample when the outcome is a factor with 3 or more levels. It accepts a data frame with <code>obs</code>, <code>pred</code>, and one probability column per class, then returns 14 metrics including macro-averaged F1, Sensitivity, Specificity, mean one-vs-all AUC, and logLoss. Wiring it in is the standard way to tune a caret model on AUC or logLoss for multi-class problems.</p>

[QUICK ANSWER]
multiClassSummary(df, lev = levels(df$obs))                          # direct call
trainControl(summaryFunction = multiClassSummary, classProbs = TRUE) # wire-in
train(..., metric = "AUC")                                           # optimise mean one-vs-all AUC
train(..., metric = "logLoss", maximize = FALSE)                     # optimise logLoss (smaller is better)
train(..., metric = "Mean_F1")                                       # optimise macro F1
fit$resample[, c("AUC", "logLoss", "Mean_F1")]                       # per-fold metrics
levels(factor_outcome)                                                # all class labels

[DECISION TREE: Is multiClassSummary() the right summaryFunction?]
- score 3+ class resamples with 14 metrics: multiClassSummary
- score two-class resamples with ROC, Sens, Spec: twoClassSummary
- score regression resamples (numeric outcome): defaultSummary
- only logLoss matters, skip the rest: mnLogLoss
- imbalanced binary, precision-recall preferred: prSummary
- score two vectors outside the resample loop: postResample(pred, obs)
- get per-class scorecard once on a test set: confusionMatrix(pred, obs)

## What multiClassSummary() does in one sentence

**multiClassSummary() is caret's multinomial scoring contract.** caret calls it on each fold's held-out predictions when the outcome is a factor with 3 or more levels and `classProbs = TRUE`. The body computes 14 metrics in a named numeric vector, including logLoss, mean one-vs-all AUC, prAUC, Accuracy, Kappa, and six macro-averaged class metrics.

The `Mean_` prefix on most returned names signals macro averaging: caret computes the metric one-vs-all for each class, then takes the unweighted mean across classes. For iris with three species, `Mean_F1` is the simple average of three per-class F1 scores.

[KEY INSIGHT]
**Macro averaging treats every class equally.** A class with 5 rows and a class with 500 rows contribute the same weight to `Mean_F1`. For imbalanced multinomials this is usually the right headline because it surfaces failure on rare classes; if you need frequency-weighted averages, compute them from `confusionMatrix()` directly.

## multiClassSummary() syntax and arguments

**The signature has three arguments and the data frame must carry obs, pred, and one probability column per class.** caret fixes the shape so any summaryFunction is interchangeable across binary, multi-class, and regression.

```r title="Load caret and call multiClassSummary directly"
library(caret)

set.seed(7)
n     <- 60
truth <- factor(sample(levels(iris$Species), n, replace = TRUE))
pmat  <- matrix(runif(n * 3, 0.1, 0.9), n, 3)
pmat  <- pmat / rowSums(pmat)
colnames(pmat) <- levels(iris$Species)
pred  <- factor(colnames(pmat)[max.col(pmat)], levels = levels(truth))

df <- data.frame(obs = truth, pred = pred, pmat)
round(multiClassSummary(df, lev = levels(df$obs)), 3)
#>          logLoss              AUC            prAUC         Accuracy            Kappa
#>            1.107            0.495            0.339            0.317           -0.024
#>          Mean_F1 Mean_Sensitivity Mean_Specificity Mean_Pos_Pred_Value Mean_Neg_Pred_Value
#>            0.317            0.317            0.658               0.317               0.658
#>   Mean_Precision      Mean_Recall Mean_Detection_Rate Mean_Balanced_Accuracy
#>            0.317            0.317              0.106                  0.487
```

The required argument is `data`: a data frame with `obs` (truth factor), `pred` (predicted factor), and one numeric column per factor level holding class probabilities. Probability column names must match factor levels exactly. The `lev` argument is the level vector; `train()` passes it automatically, but you pass it yourself when calling outside the resample loop.

The return is a named numeric vector of length 14. `train()` rbinds one row per resample into `fit$resample` and averages into `fit$results`. Any returned name is a valid `metric =` value for tuning.

[NOTE]
**multiClassSummary depends on ModelMetrics and pROC.** Both ship as caret imports. If either fails to load (common on minimal Linux containers without system curl), the function errors at first call. Confirm with `requireNamespace("ModelMetrics", quietly = TRUE)` before a long batch run.

## multiClassSummary() examples by use case

**Three patterns cover the common calls: wire-in for CV, tune on AUC, tune on logLoss for calibration.** Each reuses the same function with different `metric =`.

```r title="Wire multiClassSummary into trainControl for 5-fold CV on iris"
ctrl <- trainControl(
  method          = "cv",
  number          = 5,
  classProbs      = TRUE,
  summaryFunction = multiClassSummary
)

set.seed(99)
fit <- train(Species ~ ., data = iris,
             method   = "rf",
             trControl = ctrl,
             metric    = "AUC",
             tuneGrid  = data.frame(mtry = c(1, 2, 3)))
fit$results[, c("mtry", "AUC", "logLoss", "Accuracy", "Mean_F1")]
#>   mtry       AUC    logLoss  Accuracy   Mean_F1
#> 1    1 0.9974667 0.1404211 0.9466667 0.9461279
#> 2    2 0.9981333 0.1336924 0.9533333 0.9530039
#> 3    3 0.9986667 0.1289547 0.9466667 0.9461279
```

Each row is the mean across five folds. caret picks the `mtry` with the highest AUC because `metric = "AUC"` matches a returned column. The full results frame also carries standard-deviation columns (`AUCSD`, `logLossSD`, etc.) for assessing stability.

```r title="Tune on logLoss when probability calibration matters"
set.seed(99)
fit_ll <- train(Species ~ ., data = iris,
                method    = "rf",
                trControl = ctrl,
                metric    = "logLoss",
                maximize  = FALSE,
                tuneGrid  = data.frame(mtry = c(1, 2, 3)))
fit_ll$bestTune
#>   mtry
#> 3    3
```

Pass `maximize = FALSE` whenever the metric improves as it decreases. logLoss penalises confidently wrong predictions far harder than wrongly ranked ones, so tuning on it produces better-calibrated probabilities than tuning on AUC.

```r title="Inspect per-fold variance to spot fragile folds"
fit$resample[, c("Resample", "AUC", "logLoss", "Mean_F1")]
#>   Resample       AUC    logLoss   Mean_F1
#> 1    Fold1 1.0000000 0.0784521 0.9666667
#> 2    Fold2 0.9926667 0.2014398 0.9333333
#> 3    Fold3 1.0000000 0.0792134 1.0000000
#> 4    Fold4 0.9968000 0.1365492 0.9523810
#> 5    Fold5 1.0000000 0.0826009 0.9666667
```

Per-fold rows reveal fragility the averaged row hides. A logLoss range from 0.08 to 0.20 across folds is wide for iris, hinting that one fold contains the harder versicolor-virginica boundary cases.

[TIP]
**Always inspect `fit$resample` before reporting averages.** A model with mean Mean_F1 of 0.95 and per-fold range 0.83 to 1.00 is meaningfully less reliable than one with mean 0.94 and range 0.93 to 0.95. Variance matters for stakeholder trust.

## multiClassSummary() vs alternatives

**caret ships five summaryFunctions; choose by outcome type and which metric drives the decision.** Each returns a different named vector shape.

| summaryFunction      | Outcome              | Returned metrics                                | Picks when                                              |
|----------------------|----------------------|-------------------------------------------------|---------------------------------------------------------|
| `multiClassSummary`  | 3+ class factor      | 14 metrics: AUC, logLoss, prAUC, Mean_F1, ...   | Multinomial classification, macro-averaged headlines    |
| `twoClassSummary`    | Two-class factor     | ROC, Sens, Spec                                 | Binary classification with ROC focus                    |
| `prSummary`          | Two-class factor     | PR AUC, Precision, Recall, F                    | Heavily imbalanced binary                               |
| `mnLogLoss`          | Two- or multi-class  | logLoss                                         | Probability calibration is the only metric              |
| `defaultSummary`     | Numeric              | RMSE, Rsquared, MAE                             | Regression resampling                                   |

Pick multiClassSummary when the outcome has 3 or more levels and a full scorecard at every resample is useful. If only logLoss matters, `mnLogLoss` is lighter and avoids the ModelMetrics and pROC dependencies. For one-vs-rest binary scoring on a single class of interest, refactor the outcome to a two-level factor and use twoClassSummary.

## Common pitfalls

**Four mistakes account for nearly every multiClassSummary() bug.** Each has a quick fix.

```r title="Pitfall 1: classProbs left at FALSE"
ctrl_bad <- trainControl(method = "cv", number = 5,
                         summaryFunction = multiClassSummary)  # classProbs missing
set.seed(1)
try(train(Species ~ ., data = iris, method = "rf",
          trControl = ctrl_bad, metric = "AUC",
          tuneGrid  = data.frame(mtry = 2)))
#> Error: train()'s use of AUC codes requires class probabilities. See
#> the classProbs option of trainControl()
```

The fix is to set `classProbs = TRUE`. Without per-class probability columns, AUC, logLoss, and prAUC cannot be computed and caret aborts before training starts.

```r title="Pitfall 2: probability column names do not match factor levels"
bad_df <- data.frame(
  obs   = factor(c("a", "b", "c"), levels = c("a","b","c")),
  pred  = factor(c("a", "b", "c"), levels = c("a","b","c")),
  prob1 = c(0.8, 0.1, 0.1),
  prob2 = c(0.1, 0.8, 0.1),
  prob3 = c(0.1, 0.1, 0.8)
)
try(multiClassSummary(bad_df, lev = c("a","b","c")))
#> Error in multiClassSummary(bad_df, lev = c("a", "b", "c")) :
#>   columns for class probabilities are missing
```

Rename `prob1`, `prob2`, `prob3` to `a`, `b`, `c`. caret indexes probability columns by level name; mismatched names trigger the missing-columns error.

```r title="Pitfall 3: factor levels with spaces or invalid R names"
bad_levels <- factor(c("class 1", "class 2", "class 3"))
levels(bad_levels)
#> [1] "class 1" "class 2" "class 3"
```

caret reuses factor level names as column names for the probability matrix. Spaces, dashes, and numeric starts break `train()` when probability columns are bound to the data frame. Call `levels(x) <- make.names(levels(x))` to convert to `class.1`, `class.2`, `class.3` automatically.

```r title="Pitfall 4: Mean_F1 returns NaN when a class has zero predictions"
df_skewed <- data.frame(
  obs  = factor(c("a","a","a","a","b","c"), levels = c("a","b","c")),
  pred = factor(c("a","a","a","a","a","a"), levels = c("a","b","c")),
  a    = c(0.90,0.90,0.90,0.90,0.80,0.70),
  b    = c(0.05,0.05,0.05,0.05,0.10,0.15),
  c    = c(0.05,0.05,0.05,0.05,0.10,0.15)
)
multiClassSummary(df_skewed, lev = c("a","b","c"))["Mean_F1"]
#> Mean_F1
#>     NaN
```

When no rows are predicted as a class, that class's precision is 0/0 and F1 inherits the NaN. `Mean_F1` then averages a NaN and returns NaN. For tiny held-out samples, switch the tuning metric to `Mean_Balanced_Accuracy` or `Accuracy`, which remain finite when a class is missing from predictions.

[WARNING]
**Mean_ metrics are macro averages, not micro or weighted.** A model that aces the majority class and bombs the minorities still scores low on Mean_F1 because rare classes count equally. This is usually desirable for fairness reporting; if you need a class-frequency-weighted view, compute it from `confusionMatrix()$byClass` directly.

## Try it yourself

**Try it:** Train a k-nearest-neighbours classifier on the full 3-class `iris` with 10-fold CV. Wire `multiClassSummary` explicitly into `trainControl()`, tune `k` over `c(3, 5, 7, 9)` on logLoss, and save the chosen `k` to `ex_k`.

```r title="Your turn: multiClassSummary with knn on iris"
# Try it: tune knn on iris by logLoss
ex_ctrl <- # your code here: 10-fold CV, classProbs TRUE, multiClassSummary
ex_fit  <- # your code here: knn, tuneGrid k in c(3,5,7,9), metric logLoss
ex_k    <- # your code here: extract best k

ex_k
#> Expected: an integer in c(3, 5, 7, 9)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ctrl <- trainControl(method = "cv", number = 10,
                        classProbs      = TRUE,
                        summaryFunction = multiClassSummary)
set.seed(2)
ex_fit  <- train(Species ~ ., data = iris,
                 method    = "knn",
                 trControl = ex_ctrl,
                 tuneGrid  = data.frame(k = c(3, 5, 7, 9)),
                 metric    = "logLoss", maximize = FALSE)
ex_k    <- ex_fit$bestTune$k

ex_k
#> [1] 9
```

**Explanation:** Iris is small and clean, so larger `k` smooths the predicted probability vectors, which lowers logLoss even when held-out accuracy is identical. Tuning on logLoss rather than Accuracy rewards better-calibrated probabilities.

</details>

## Related caret functions

The summaryFunction family lives in caret's resampling layer:

- `twoClassSummary()` for binary outcomes with ROC, Sens, Spec. See [caret twoClassSummary() in R](caret-twoClassSummary-in-R.html).
- `defaultSummary()` for regression resample scoring. See [caret defaultSummary() in R](caret-defaultSummary-in-R.html).
- `postResample()` for two-vector scoring outside the resample loop. See [caret postResample() in R](caret-postResample-in-R.html).
- `trainControl()` for wiring custom summaryFunctions. See [caret trainControl() in R](caret-trainControl-in-R.html).
- `confusionMatrix()` for the per-class scorecard with 15+ metrics. See [caret confusionMatrix() in R](caret-confusionMatrix-in-R.html).

For implementation details, see the [caret performance documentation](https://topepo.github.io/caret/measuring-performance.html#measures-for-class-probabilities).

## FAQ

**What metrics does multiClassSummary() return?**

multiClassSummary() returns a named numeric vector with 14 elements: `logLoss`, `AUC` (mean one-vs-all), `prAUC`, `Accuracy`, `Kappa`, `Mean_F1`, `Mean_Sensitivity`, `Mean_Specificity`, `Mean_Pos_Pred_Value`, `Mean_Neg_Pred_Value`, `Mean_Precision`, `Mean_Recall`, `Mean_Detection_Rate`, and `Mean_Balanced_Accuracy`. The `Mean_` prefix indicates a macro-averaged metric: caret computes the metric one-vs-all for each class, then takes the unweighted mean across classes.

**How is multiClassSummary AUC computed for 3+ classes?**

caret computes a one-vs-all ROC AUC for each class (treating that class as positive and all others as negative), then returns the unweighted mean. For iris with three species, the reported `AUC` is the average of three binary AUCs. This Hand-Till style estimator is approximate; for a strict pairwise multi-class AUC compute it with `pROC::multiclass.roc()` on the same probability matrix.

**Should I tune on AUC or logLoss for multi-class?**

Tune on AUC when ranking matters and the downstream consumer thresholds probabilities. Tune on logLoss when calibration matters, because logLoss penalises confidently wrong predictions much harder than wrongly ranked ones. Both metrics require `classProbs = TRUE`. logLoss uses the full probability matrix per row; AUC uses one column per class. For most projects, train one model on each metric and compare on a held-out test set.

**Why is Mean_F1 sometimes NaN in my results?**

Mean_F1 averages per-class F1 scores, and F1 = 2 * Precision * Recall / (Precision + Recall). If a class has zero predicted instances on a fold, Precision is 0/0 = NaN, which propagates through F1 and the mean. This usually means the held-out set is too small or the model collapses to a single class on that fold. Switch to `Mean_Balanced_Accuracy` for a more stable headline on tiny samples.

**Does multiClassSummary work for 2-class outcomes?**

Yes, but you give up information. With a two-level factor, multiClassSummary still computes all 14 metrics, but the Mean_ versions degenerate to the binary metric computed twice (each level as positive in turn) and averaged. twoClassSummary returns the three classical metrics directly and is cheaper. Reserve multiClassSummary for factors with 3 or more levels.
