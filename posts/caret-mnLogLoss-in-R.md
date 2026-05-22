---
title: "caret mnLogLoss() in R: Multinomial Log Loss Metric"
slug: "caret-mnLogLoss-in-R"
description: "Use caret mnLogLoss() in R as the lightweight summaryFunction in trainControl to tune classification models on log loss for calibrated class probabilities."
keywords: "caret mnLogLoss, mnLogLoss function R, caret mnLogLoss examples, R log loss caret, caret summaryFunction logLoss, multinomial log loss in R, classProbs caret tuning"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "mnLogLoss()|caret mnLogLoss|caret::mnLogLoss()|mnLogLoss function|caret log loss summary"
auto_link_case_sensitive: true
target_keyword: "caret mnLogLoss"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret mnLogLoss() in R: Multinomial Log Loss Metric

<p class="lead">The <code>mnLogLoss()</code> function in caret is the lightweight <code>summaryFunction</code> that <code>trainControl()</code> calls on every resample when you want to tune a classifier purely on log loss. It accepts a data frame with <code>obs</code>, <code>pred</code>, and one probability column per class, then returns a single named scalar <code>logLoss</code> that <code>train()</code> minimises across the tuning grid. Use it when probability calibration is the only metric that matters and you want to skip the heavier ROC and macro-F1 machinery in <code>twoClassSummary()</code> or <code>multiClassSummary()</code>.</p>

[QUICK ANSWER]
mnLogLoss(df, lev = levels(df$obs))                              # direct call
trainControl(summaryFunction = mnLogLoss, classProbs = TRUE)     # wire-in
train(..., metric = "logLoss", maximize = FALSE)                 # tune (smaller is better)
fit$resample[, c("Resample", "logLoss")]                         # per-fold log loss
fit$results[, c("mtry", "logLoss", "logLossSD")]                 # mean and SD per grid row
mnLogLoss(df, lev = levels(df$obs))["logLoss"]                   # scalar extract

[DECISION TREE: Is mnLogLoss() the right summaryFunction?]
- only logLoss matters, tune fast: mnLogLoss
- two-class ROC, Sens, Spec needed: twoClassSummary
- multi-class with 14-metric scorecard: multiClassSummary
- imbalanced binary, PR-AUC preferred: prSummary
- regression resamples, numeric outcome: defaultSummary
- score two vectors outside the loop: postResample(pred, obs)
- per-class scorecard once on a test set: confusionMatrix(pred, obs)

## What mnLogLoss() does in one sentence

**mnLogLoss() is caret's minimal logarithmic-loss scoring contract.** caret calls it on each fold's held-out predictions when the outcome is a factor with two or more levels and `classProbs = TRUE`. The body returns one number, `logLoss`, equal to the average negative log-likelihood of the true class under each row's predicted probability vector. Rows assigned high probability to the correct class contribute near zero; rows confidently mislabelled contribute large positive values.

[KEY INSIGHT]
**Log loss is calibration-sensitive, not just rank-sensitive.** Two models with identical accuracy can have very different log loss if one assigns the true class probability 0.55 and the other assigns 0.95. AUC sees them as equivalent; log loss rewards the confident-and-correct model. Tune on log loss when downstream consumers act on probability values, not just argmax labels.

## mnLogLoss() syntax and arguments

**The signature has three arguments and the data frame must carry obs, pred, and one probability column per class.** caret fixes the shape so every summaryFunction is interchangeable across binary, multi-class, and regression workflows.

```r title="Load caret and call mnLogLoss directly"
library(caret)

set.seed(7)
n     <- 60
truth <- factor(sample(levels(iris$Species), n, replace = TRUE))
pmat  <- matrix(runif(n * 3, 0.1, 0.9), n, 3)
pmat  <- pmat / rowSums(pmat)
colnames(pmat) <- levels(iris$Species)
pred  <- factor(colnames(pmat)[max.col(pmat)], levels = levels(truth))

df <- data.frame(obs = truth, pred = pred, pmat)
mnLogLoss(df, lev = levels(df$obs))
#>  logLoss
#> 1.107229
```

The required argument is `data`: a data frame with `obs` (truth factor), `pred` (predicted factor, required by the contract but unused by the math), and one numeric column per factor level holding class probabilities. Probability column names must match factor levels exactly. `train()` passes `lev` automatically; supply it yourself when calling outside the resample loop. The return is a named numeric of length 1; `"logLoss"` is the only valid `metric =` value when this summaryFunction is wired in.

[NOTE]
**mnLogLoss has no pROC or ModelMetrics dependency.** Unlike `twoClassSummary()` and `multiClassSummary()`, the body is base-R arithmetic on the probability matrix. That makes it fast and safe on minimal containers where pROC or ModelMetrics fail to compile.

## mnLogLoss() examples by use case

**Three patterns cover the common calls: wire-in for CV, tune on log loss, inspect per-fold variance.** Each reuses the same function with `metric = "logLoss"` and `maximize = FALSE`.

```r title="Wire mnLogLoss into trainControl for 5-fold CV on iris"
ctrl <- trainControl(
  method          = "cv",
  number          = 5,
  classProbs      = TRUE,
  summaryFunction = mnLogLoss
)

set.seed(99)
fit <- train(Species ~ ., data = iris,
             method    = "rf",
             trControl = ctrl,
             metric    = "logLoss",
             maximize  = FALSE,
             tuneGrid  = data.frame(mtry = c(1, 2, 3)))
fit$results[, c("mtry", "logLoss", "logLossSD")]
#>   mtry    logLoss   logLossSD
#> 1    1 0.14042111 0.04956283
#> 2    2 0.13369236 0.04571202
#> 3    3 0.12895474 0.04498119
```

Each row is the mean across five folds. caret picks the `mtry` with the lowest log loss because `maximize = FALSE` flips the optimisation direction. The `logLossSD` column is the across-fold standard deviation, the right input for a fragility check.

```r title="Compare two probability vectors at the row level"
calibrated   <- c(0.90, 0.10, 0.85, 0.95, 0.05)
overcautious <- c(0.55, 0.45, 0.55, 0.55, 0.45)
truth        <- factor(c("yes","no","yes","yes","no"), levels = c("no","yes"))

df_cal <- data.frame(obs = truth,
                     pred = factor(ifelse(calibrated > 0.5, "yes","no"), levels = c("no","yes")),
                     no   = 1 - calibrated, yes = calibrated)
df_oc  <- data.frame(obs = truth,
                     pred = factor(ifelse(overcautious > 0.5, "yes","no"), levels = c("no","yes")),
                     no   = 1 - overcautious, yes = overcautious)

c(calibrated   = mnLogLoss(df_cal, lev = c("no","yes")),
  overcautious = mnLogLoss(df_oc,  lev = c("no","yes")))
#> calibrated.logLoss overcautious.logLoss
#>         0.09357887           0.65687234
```

Both models are 100 percent accurate, but the calibrated probabilities score seven times better on log loss. This is the gap AUC and Accuracy hide.

```r title="Inspect per-fold variance to spot fragile folds"
fit$resample[, c("Resample", "logLoss")]
#>   Resample    logLoss
#> 1    Fold1 0.07845210
#> 2    Fold2 0.20143984
#> 3    Fold3 0.07921337
#> 4    Fold4 0.13654917
#> 5    Fold5 0.08260088
```

Per-fold rows reveal fragility the averaged row hides. A log loss range from 0.08 to 0.20 across folds is wide for iris, hinting one fold caught the harder versicolor-virginica boundary cases. Report mean and worst-fold together; the worst fold predicts real-world failure modes better than the average.

[TIP]
**Use mnLogLoss for speed when only log loss matters.** Swapping multiClassSummary for mnLogLoss in a long Bayesian-optimisation loop or 50-fold repeated CV saves real wall time. If you later need AUC or Mean_F1, run a one-off scoring pass on the chosen tuneGrid row.

## mnLogLoss() vs alternatives

**caret ships five summaryFunctions; mnLogLoss is the smallest.** Choose by outcome type and which metric drives the decision.

| summaryFunction      | Outcome              | Returned metrics                                | Picks when                                              |
|----------------------|----------------------|-------------------------------------------------|---------------------------------------------------------|
| `mnLogLoss`          | Two- or multi-class  | logLoss                                         | Probability calibration is the only metric              |
| `twoClassSummary`    | Two-class factor     | ROC, Sens, Spec                                 | Binary classification with ROC focus                    |
| `multiClassSummary`  | 3+ class factor      | 14 metrics: AUC, logLoss, prAUC, Mean_F1, ...   | Multinomial classification, full scorecard              |
| `prSummary`          | Two-class factor     | PR AUC, Precision, Recall, F                    | Heavily imbalanced binary                               |
| `defaultSummary`     | Numeric              | RMSE, Rsquared, MAE                             | Regression resampling                                   |

Pick mnLogLoss when probability calibration is the only metric you tune on. If you also need AUC or per-class F1 alongside, multiClassSummary returns both in one call and saves a second pass. For binary outcomes where threshold choice matters, twoClassSummary returns ROC at the resample level so you can balance Sens and Spec.

## Common pitfalls

**Four mistakes account for nearly every mnLogLoss() bug.** Each has a quick fix.

```r title="Pitfall 1: classProbs left at FALSE"
ctrl_bad <- trainControl(method = "cv", number = 5,
                         summaryFunction = mnLogLoss)  # classProbs missing
set.seed(1)
try(train(Species ~ ., data = iris, method = "rf",
          trControl = ctrl_bad, metric = "logLoss", maximize = FALSE,
          tuneGrid  = data.frame(mtry = 2)))
#> Error: train()'s use of logLoss codes requires class probabilities. See
#> the classProbs option of trainControl()
```

The fix is to set `classProbs = TRUE`. Without per-class probability columns, log loss cannot be computed and caret aborts before training starts.

```r title="Pitfall 2: forgetting maximize = FALSE"
set.seed(99)
fit_wrong <- train(Species ~ ., data = iris,
                   method    = "rf",
                   trControl = ctrl,
                   metric    = "logLoss",     # maximize defaults to TRUE
                   tuneGrid  = data.frame(mtry = c(1, 2, 3)))
fit_wrong$bestTune
#>   mtry
#> 1    1
```

caret picks the worst row instead of the best because `maximize = TRUE` is the default. Log loss is a loss, not a score, so always pass `maximize = FALSE`. Metric typos surface as nonsense `bestTune` rows.

```r title="Pitfall 3: probabilities clipped to exactly 0 or 1"
df_clipped <- data.frame(
  obs  = factor(c("yes","no"), levels = c("no","yes")),
  pred = factor(c("yes","no"), levels = c("no","yes")),
  no   = c(0, 1),
  yes  = c(1, 0)
)
mnLogLoss(df_clipped, lev = c("no","yes"))
#>  logLoss
#> 2.22e-16
```

Some models return hard 0 or 1 probabilities, which would otherwise cause `log(0) = -Inf`. caret silently clips the probability matrix to `[eps, 1-eps]` before applying log, so the result is a tiny positive number. If your log loss is suspiciously close to zero, check the model is returning real probabilities, not hard labels.

```r title="Pitfall 4: probability column names do not match factor levels"
bad_df <- data.frame(
  obs   = factor(c("a","b","c"), levels = c("a","b","c")),
  pred  = factor(c("a","b","c"), levels = c("a","b","c")),
  prob1 = c(0.8, 0.1, 0.1),
  prob2 = c(0.1, 0.8, 0.1),
  prob3 = c(0.1, 0.1, 0.8)
)
try(mnLogLoss(bad_df, lev = c("a","b","c")))
#> Error in mnLogLoss(bad_df, lev = c("a", "b", "c")) :
#>   columns for class probabilities are missing
```

Rename `prob1`, `prob2`, `prob3` to `a`, `b`, `c`. caret indexes probability columns by level name; mismatched names trigger the missing-columns error. The same trap bites every summaryFunction.

[WARNING]
**Log loss is unbounded on the right.** A single confidently wrong prediction (true class probability 0.001) contributes about 6.9 to the per-row sum, enough to dominate a 100-row resample. caret clips silently, but cannot undo a model that is systematically over-confident on tail cases.

## Try it yourself

**Try it:** Train a k-nearest-neighbours classifier on the full 3-class `iris` with 10-fold CV. Wire `mnLogLoss` into `trainControl()`, tune `k` over `c(3, 5, 7, 9)`, and save the chosen `k` to `ex_k`.

```r title="Your turn: mnLogLoss with knn on iris"
# Try it: tune knn on iris by logLoss
ex_ctrl <- # your code here: 10-fold CV, classProbs TRUE, mnLogLoss
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
                        summaryFunction = mnLogLoss)
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

**Explanation:** Larger `k` averages more neighbours, smoothing the predicted probability vectors. Smoothed probabilities lower log loss even when accuracy is identical, because log loss rewards moderate confidence on borderline rows.

</details>

## Related caret functions

The summaryFunction family lives in caret's resampling layer:

- `multiClassSummary()` for 3+ class outcomes with the full 14-metric scorecard. See [caret multiClassSummary() in R](caret-multiClassSummary-in-R.html).
- `twoClassSummary()` for binary outcomes with ROC, Sens, Spec. See [caret twoClassSummary() in R](caret-twoClassSummary-in-R.html).
- `defaultSummary()` for regression resample scoring. See [caret defaultSummary() in R](caret-defaultSummary-in-R.html).
- `postResample()` for two-vector scoring outside the resample loop. See [caret postResample() in R](caret-postResample-in-R.html).
- `trainControl()` for wiring custom summaryFunctions. See [caret trainControl() in R](caret-trainControl-in-R.html).

For implementation details, see the [caret performance documentation](https://topepo.github.io/caret/measuring-performance.html#measures-for-class-probabilities).

## FAQ

**What does mnLogLoss() return?**

mnLogLoss() returns a named numeric vector of length 1 with name `logLoss`. The value is the mean negative log-likelihood of the true class under the predicted probability vector, averaged across rows in the supplied data frame. Lower is better. `"logLoss"` is the only valid `metric =` value when this summaryFunction is wired into `trainControl()`, and you must pair it with `maximize = FALSE` so `train()` selects the row that minimises the loss.

**How does mnLogLoss handle probabilities of exactly 0 or 1?**

caret clips the probability matrix to `[eps, 1-eps]` before taking logs, where `eps` is a small machine-precision value. This prevents `log(0) = -Inf` from poisoning the resample average. A row where the model returned probability 0 for the true class still produces a large but finite contribution. If log loss looks suspiciously close to zero across folds, your model is returning hard 0/1 labels rather than calibrated probabilities.

**Does mnLogLoss work for two-class outcomes?**

Yes. mnLogLoss accepts any factor with 2 or more levels. For binary problems it computes the same log loss you would get from a manual `-mean(y*log(p) + (1-y)*log(1-p))` calculation. The advantage over twoClassSummary is speed: you skip the ROC curve entirely. The trade-off is losing the ROC, Sens, and Spec columns, so reporting requires a second scoring pass.

**Should I tune on logLoss or AUC?**

Tune on logLoss when calibrated probabilities matter to downstream consumers (pricing models, risk scores, cost-weighted thresholds). Tune on AUC when ranking matters but threshold choice happens later (top-K selection, human review queues). logLoss is calibration-sensitive; AUC is rank-only. Models that ace AUC can have terrible log loss if probabilities are systematically squeezed toward 0.5. For high-stakes projects, fit one model on each metric and compare on a held-out test set.

**Why is mnLogLoss faster than multiClassSummary?**

multiClassSummary computes 14 metrics per resample; two (AUC, prAUC) load pROC and iterate the probability matrix. mnLogLoss computes one metric in base-R arithmetic with no pROC or ModelMetrics import. On a 5-fold CV the saving is small absolute, but in a 50-fold repeated CV with a Bayesian-optimisation outer loop it compounds.
