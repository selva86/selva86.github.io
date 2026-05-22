---
title: "caret prSummary() in R: Precision and Recall Summary Metrics"
slug: "caret-prSummary-in-R"
description: "Use caret prSummary() in R as the trainControl summaryFunction for imbalanced binary classification. Returns PR-AUC, Precision, Recall, and the F1 score."
keywords: "caret prSummary, prSummary function R, caret prSummary examples, prSummary trainControl, caret imbalanced classification, R precision recall caret, prSummary classProbs"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "prSummary()|caret prSummary|caret::prSummary()|prSummary function|caret precision recall"
auto_link_case_sensitive: true
target_keyword: "caret prSummary"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret prSummary() in R: Precision and Recall Summary Metrics

<p class="lead">The <code>prSummary()</code> function in caret is the precision-recall <code>summaryFunction</code> that <code>trainControl()</code> calls on every resample when the outcome is imbalanced. It accepts a data frame with <code>obs</code>, <code>pred</code>, and class-probability columns, then returns a named vector of <code>AUC</code> (precision-recall AUC), <code>Precision</code>, <code>Recall</code>, and <code>F</code> (F1 score). Wire it into <code>trainControl()</code> with <code>classProbs = TRUE</code> when positives are rare and ROC overstates performance.</p>

[QUICK ANSWER]
prSummary(df, lev = levels(df$obs))                              # direct call
trainControl(summaryFunction = prSummary, classProbs = TRUE)     # wire-in
train(..., metric = "F", maximize = TRUE)                        # optimise F1
train(..., metric = "AUC", maximize = TRUE)                      # optimise PR-AUC
train(..., metric = "Precision")                                 # optimise precision
fit$resample[, c("AUC", "Precision", "Recall", "F")]             # per-fold metrics
levels(y)[1]                                                     # the positive class

[DECISION TREE: Is prSummary() the right summaryFunction?]
- two-class problem with rare positives, want PR-AUC: prSummary
- two-class problem with balanced classes, want ROC: twoClassSummary
- three or more classes: multiClassSummary
- regression (numeric outcome): defaultSummary
- need log-loss for probabilistic ranking: mnLogLoss
- score two vectors outside the resample loop: postResample(pred, obs)
- full classifier scorecard with confusion matrix: confusionMatrix(pred, obs)

## What prSummary() does in one sentence

**prSummary() is caret's precision-recall scoring contract.** It is the `summaryFunction` you pass to `trainControl()` when the positive class is rare and the precision-recall curve carries more signal than the ROC curve. The body computes four numbers from `data$obs`, `data$pred`, and the probability column matching the first factor level: PR-AUC via `MLmetrics::PRAUC()`, plus `Precision`, `Recall`, and the F1 score `F` from caret's own helpers.

The first factor level is the "positive" class. caret looks up `lev[1]` to find the matching probability column, so the order of levels in your outcome variable controls which class precision and recall are computed against.

[KEY INSIGHT]
**ROC AUC and PR AUC tell different stories on imbalanced data.** A model that ranks the abundant negative class well can post a high ROC AUC while missing most positives; the precision-recall AUC that prSummary returns is sensitive to ranking on the minority class. When positives are under roughly 10 percent of rows, prefer prSummary over twoClassSummary.

## prSummary() syntax and arguments

**The signature matches every caret summaryFunction.** Three arguments, of which only `data` carries values.

```r title="Load caret and call prSummary on a tiny frame"
library(caret)

set.seed(1)
n  <- 60
y  <- factor(c(rep("pos", 12), rep("neg", 48)), levels = c("pos", "neg"))
pp <- ifelse(y == "pos",
             rbeta(n, 6, 2),
             rbeta(n, 2, 6))
df <- data.frame(
  obs  = y,
  pred = factor(ifelse(pp > 0.5, "pos", "neg"), levels = c("pos", "neg")),
  pos  = pp,
  neg  = 1 - pp
)

prSummary(df, lev = levels(df$obs))
#>       AUC Precision    Recall         F
#> 0.8732910 0.7142857 0.8333333 0.7692308
```

The arguments:

- `data`: a data frame with `obs` (factor truth), `pred` (factor predictions), and one column per class named for that level. caret hands the resample frame in unchanged.
- `lev`: a character vector of factor levels. The first element is the positive class. Pass `lev = levels(df$obs)` when calling outside `train()`.
- `model`: the caret training method name. Ignored by prSummary; present only to match the API contract.

The return is a length-four named numeric vector with `AUC`, `Precision`, `Recall`, and `F`. Any of those four names is valid for `metric =` in `train()`. `AUC` here is precision-recall AUC, not ROC AUC; the column name is reused for backwards compatibility.

[NOTE]
**The PR-AUC computation needs the MLmetrics package.** Caret loads it lazily on the first prSummary call. If the package is missing, `AUC` returns `NA` while `Precision`, `Recall`, and `F` still compute. Install once with `install.packages("MLmetrics")`.

## prSummary() examples by use case

**Three patterns cover the common calls: wiring into trainControl, optimising on F1 or PR-AUC, and wrapping for a custom threshold.** Each reuses the same scorer with different framing.

```r title="Use prSummary inside trainControl on imbalanced data"
data(GermanCredit)
gc <- GermanCredit[, c("Class", "Duration", "Amount", "Age",
                       "InstallmentRatePercentage", "NumberExistingCredits")]
gc$Class <- factor(gc$Class, levels = c("Bad", "Good"))

ctrl <- trainControl(
  method          = "cv",
  number          = 5,
  classProbs      = TRUE,
  summaryFunction = prSummary
)

set.seed(42)
fit <- train(Class ~ ., data = gc, method = "glm",
             family = "binomial", trControl = ctrl,
             metric = "F", maximize = TRUE)
fit$resample[, c("AUC", "Precision", "Recall", "F", "Resample")]
#>         AUC Precision    Recall         F Resample
#> 1 0.5142537 0.4615385 0.2000000 0.2790698    Fold1
#> 2 0.5028571 0.5000000 0.1666667 0.2500000    Fold2
#> 3 0.5396825 0.5454545 0.2000000 0.2926829    Fold3
#> 4 0.4793651 0.4666667 0.2333333 0.3111111    Fold4
#> 5 0.5380952 0.4444444 0.1333333 0.2051282    Fold5
```

`classProbs = TRUE` is mandatory. Without it `train()` cannot produce the probability columns that prSummary reads, and the resample call errors before scoring.

```r title="Tune random forest on PR-AUC"
set.seed(7)
fit_rf <- train(
  Class ~ ., data = gc,
  method    = "rf",
  trControl = ctrl,
  tuneGrid  = data.frame(mtry = c(2, 3, 4)),
  metric    = "AUC",
  maximize  = TRUE
)
fit_rf$results[, c("mtry", "AUC", "Precision", "Recall", "F")]
#>   mtry       AUC Precision    Recall         F
#> 1    2 0.4949619 0.3666667 0.1000000 0.1571429
#> 2    3 0.5117989 0.4333333 0.1333333 0.2037037
#> 3    4 0.5066667 0.4181818 0.1466667 0.2173913
```

`metric = "AUC"` here means precision-recall AUC because the summaryFunction is prSummary. The same code with `summaryFunction = twoClassSummary` would interpret `"AUC"` as a typo and abort, because twoClassSummary names its ROC column `"ROC"` instead.

```r title="Wrap prSummary to control the decision threshold"
prAt <- function(threshold) {
  function(data, lev = NULL, model = NULL) {
    data$pred <- factor(
      ifelse(data[, lev[1]] > threshold, lev[1], lev[2]),
      levels = lev
    )
    prSummary(data, lev = lev, model = model)
  }
}

ctrl_25 <- trainControl(method = "cv", number = 5,
                        classProbs = TRUE,
                        summaryFunction = prAt(0.25))

set.seed(11)
fit_t <- train(Class ~ ., data = gc, method = "glm",
               family = "binomial", trControl = ctrl_25,
               metric = "Recall", maximize = TRUE)
fit_t$resample[, c("Precision", "Recall", "F")]
#>   Precision    Recall         F
#> 1 0.3137255 0.5333333 0.3950617
#> 2 0.3373494 0.5666667 0.4225589
#> 3 0.3414634 0.4666667 0.3943662
#> 4 0.3265306 0.5333333 0.4050633
#> 5 0.3076923 0.4000000 0.3478261
```

The wrapper overrides `pred` from the probability column before calling prSummary, which is the right way to score at a custom threshold. Lower thresholds trade precision for recall; choose by what cost matters for your application.

[TIP]
**Set the rare class as the first level of your outcome factor.** caret reads `lev[1]` for the probability column lookup and as the positive target for precision and recall. The default alphabetical ordering rarely matches business intent. Use `factor(y, levels = c("positive_class", "negative_class"))` to force the order.

## prSummary() vs alternatives

**Caret ships five summaryFunctions plus the postResample helper.** Pick prSummary only when classes are imbalanced and the precision-recall curve is the relevant ranking.

| summaryFunction       | Outcome type        | Returned metrics                          | Pick when                                      |
|-----------------------|---------------------|-------------------------------------------|------------------------------------------------|
| `prSummary`           | Two-class factor    | AUC (PR), Precision, Recall, F            | Imbalanced binary, positives rare              |
| `twoClassSummary`     | Two-class factor    | ROC, Sens, Spec                           | Roughly balanced binary, ROC is the headline   |
| `multiClassSummary`   | Multi-class factor  | Accuracy, Kappa, per-class metrics        | Three or more classes                          |
| `defaultSummary`      | Numeric (regression)| RMSE, Rsquared, MAE                       | Regression                                     |
| `mnLogLoss`           | Two- or multi-class | logLoss                                   | Probability calibration matters most           |
| `postResample`        | Either              | RMSE/Rsq/MAE or Accuracy/Kappa            | Two-vector scoring outside the resample loop   |

The deciding test is class balance. Under 10 percent positives, prSummary; between 10 and 40 percent, both are reasonable but twoClassSummary remains the convention; above 40 percent, twoClassSummary because ROC AUC reads more cleanly. For three or more classes, multiClassSummary regardless of balance.

## Common pitfalls

**Three mistakes cause most prSummary failures.** Each has a quick fix.

```r title="Pitfall 1: classProbs must be TRUE"
ctrl_bad <- trainControl(method = "cv", number = 5,
                         summaryFunction = prSummary)
set.seed(3)
fit_bad <- try(train(Class ~ ., data = gc, method = "glm",
                     family = "binomial", trControl = ctrl_bad,
                     metric = "F"), silent = TRUE)
substr(attr(fit_bad, "condition")$message, 1, 70)
#> [1] "train()'s use of ROC codes requires class probabilities. See the cla"
```

prSummary reads `data[, lev[1]]` for the probability of the positive class. Without `classProbs = TRUE`, that column does not exist and `train()` aborts before scoring the first resample. Always set `classProbs = TRUE` alongside `summaryFunction = prSummary`.

```r title="Pitfall 2: the first factor level is the positive class"
gc_flip <- gc
gc_flip$Class <- factor(gc_flip$Class, levels = c("Good", "Bad"))

set.seed(4)
fit_flip <- train(Class ~ ., data = gc_flip, method = "glm",
                  family = "binomial", trControl = ctrl,
                  metric = "F", maximize = TRUE)
fit_flip$resample[1, c("Precision", "Recall", "F")]
#>   Precision    Recall         F
#> 1 0.7714286 0.7714286 0.7714286
```

With "Good" as the first level, prSummary now scores recall against the majority class and metrics look excellent while the actual problem (detecting "Bad" credit) gets ignored. Order the factor so the rare or business-critical class is first: `factor(y, levels = c("Bad", "Good"))`.

```r title="Pitfall 3: AUC is NA when MLmetrics is not installed"
df_min <- data.frame(
  obs = y,
  pred = factor(ifelse(pp > 0.5, "pos", "neg"), levels = c("pos", "neg")),
  pos = pp,
  neg = 1 - pp
)

if (!requireNamespace("MLmetrics", quietly = TRUE)) {
  prSummary(df_min, lev = c("pos", "neg"))
  #>       AUC Precision    Recall         F
  #>        NA 0.7142857 0.8333333 0.7692308
} else {
  prSummary(df_min, lev = c("pos", "neg"))
}
```

The PR-AUC computation calls `MLmetrics::PRAUC()`. When the package is missing, prSummary returns `NA` for `AUC` and the other three metrics still compute. Run `install.packages("MLmetrics")` once if you tune on `metric = "AUC"`; otherwise switch the metric to `"F"`.

[WARNING]
**The column name `AUC` is precision-recall AUC, not ROC AUC.** Reports that combine output from prSummary and twoClassSummary side by side will mislead readers who assume "AUC" means ROC. Rename the column in your reporting code, or document the metric explicitly in plots and tables.

## Try it yourself

**Try it:** Build a 5-fold CV pipeline on the imbalanced `GermanCredit` data predicting `Class` with logistic regression. Wire `prSummary` into `trainControl()` with `classProbs = TRUE` and tune on `F`. Save the mean F1 across folds to `ex_f1`.

```r title="Your turn: prSummary on GermanCredit"
# Try it: 5-fold CV with prSummary
data(GermanCredit)
ex_gc <- GermanCredit[, c("Class", "Duration", "Amount", "Age")]
ex_gc$Class <- factor(ex_gc$Class, levels = c("Bad", "Good"))

ex_ctrl <- # your code here: trainControl(method='cv', number=5, classProbs=TRUE, summaryFunction=prSummary)
ex_fit  <- # your code here: train(Class ~ ., method='glm', family='binomial', metric='F')
ex_f1   <- # your code here: mean of ex_fit$resample$F

ex_f1
#> Expected: a single numeric near 0.27
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
data(GermanCredit)
ex_gc <- GermanCredit[, c("Class", "Duration", "Amount", "Age")]
ex_gc$Class <- factor(ex_gc$Class, levels = c("Bad", "Good"))

ex_ctrl <- trainControl(method = "cv", number = 5,
                        classProbs = TRUE,
                        summaryFunction = prSummary)
set.seed(1)
ex_fit  <- train(Class ~ ., data = ex_gc, method = "glm",
                 family = "binomial", trControl = ex_ctrl,
                 metric = "F", maximize = TRUE)
ex_f1   <- mean(ex_fit$resample$F)

ex_f1
#> [1] 0.2706
```

**Explanation:** `classProbs = TRUE` produces the probability columns prSummary reads; ordering levels with `c("Bad", "Good")` makes the rare "Bad" class the positive target so `Precision`, `Recall`, and `F` measure detection of bad credit. Averaging `fit$resample$F` gives the cross-validated F1.

</details>

## Related caret functions

The precision-recall stack sits one call away:

- `twoClassSummary()` for ROC, sensitivity, specificity on balanced binary. See [caret twoClassSummary() in R](caret-twoClassSummary-in-R.html).
- `multiClassSummary()` for three-class or more outcomes. See [caret multiClassSummary() in R](caret-multiClassSummary-in-R.html).
- `defaultSummary()` for the regression scorer. See [caret defaultSummary() in R](caret-defaultSummary-in-R.html).
- `confusionMatrix()` for the full classification scorecard. See [caret confusionMatrix() in R](caret-confusionMatrix-in-R.html).
- `trainControl()` for swapping summaryFunctions and setting classProbs. See [caret trainControl() in R](caret-trainControl-in-R.html).

For the upstream reference, see the [caret package documentation](https://topepo.github.io/caret/).

## FAQ

**What does prSummary() return?**

For a two-class problem with `classProbs = TRUE`, `prSummary()` returns a length-four named numeric vector: `AUC` (precision-recall AUC via `MLmetrics::PRAUC`), `Precision`, `Recall`, and `F` (the F1 score). caret rbinds one row per fold into `fit$resample` and averages columns into `fit$results`. Any of the four names is valid for `metric =` in `train()`.

**When should I use prSummary instead of twoClassSummary?**

Switch to prSummary when the positive class is roughly under 10 percent of rows. ROC AUC under twoClassSummary is dominated by the abundant negative class, so a model that ranks the rare positives poorly can still report high AUC. Precision-recall AUC is sensitive to ranking on the minority class. For 10 to 40 percent positives, both are reasonable; above 40 percent twoClassSummary is conventional.

**Why is AUC always NA in my output?**

The `AUC` column comes from `MLmetrics::PRAUC()`. If the MLmetrics package is not installed, `prSummary()` returns NA for AUC and still computes Precision, Recall, and F. Install it with `install.packages("MLmetrics")` and re-run, or change `metric =` in `train()` to `"F"`, `"Precision"`, or `"Recall"`, all of which are computed without MLmetrics.

**How do I make prSummary score against the rare class?**

Order the outcome factor so the rare class is the first level: `factor(y, levels = c("rare_class", "common_class"))`. caret reads `lev[1]` as the positive class for the probability column lookup and for precision and recall. Alphabetical ordering rarely matches business intent, so set the levels explicitly when constructing the outcome.

**Can I use prSummary with a custom decision threshold?**

Yes. Wrap prSummary in a function that overwrites `data$pred` from the probability column before delegating: `data$pred <- factor(ifelse(data[, lev[1]] > 0.3, lev[1], lev[2]), levels = lev); prSummary(data, lev, model)`. Pass the wrapper as `summaryFunction` in `trainControl()`. Lower thresholds raise recall and lower precision; the `F` column tracks the trade-off.
