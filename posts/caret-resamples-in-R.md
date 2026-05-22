---
title: "caret resamples() in R: Compare Cross-Validated Models"
slug: "caret-resamples-in-R"
description: "Use caret resamples() in R to compare cross-validated models. Build a resamples object from multiple train fits, then summarize, plot, and diff metrics."
keywords: "caret resamples, resamples function R, caret resamples examples, R compare models caret, caret model comparison, summary resamples R, caret resamples diff"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "resamples()|caret resamples|caret::resamples()|resamples object|compare caret models"
auto_link_case_sensitive: true
target_keyword: "caret resamples"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret resamples() in R: Compare Cross-Validated Models

<p class="lead">The <code>resamples()</code> function in caret bundles two or more <code>caret::train</code> objects fit on identical resampling folds, then exposes a unified API to summarize, plot, and statistically test their performance. It is the canonical way to settle which model is best when every candidate has been tuned with the same cross-validation plan.</p>

[QUICK ANSWER]
resamples(list(rf = fit_rf, gbm = fit_gbm, glm = fit_glm))   # bundle models
summary(res)                                                 # mean/min/max per metric
bwplot(res)                                                  # box-whisker by metric
dotplot(res)                                                 # mean and CI by metric
summary(diff(res))                                           # paired t-tests
res$values                                                   # per-fold scores
modelCor(res)                                                # between-model correlation

[DECISION TREE: Is resamples() the right tool?]
- compare 2+ caret models on the same folds: resamples(list(a = fit1, b = fit2))
- score a single prediction vector: postResample(pred, obs)
- inspect one trained model's CV metrics: fit$results
- pairwise statistical test on differences: diff(resamples_obj)
- visualize the model comparison: bwplot(resamples_obj) or dotplot(resamples_obj)
- compare tidymodels workflows instead: tune::collect_metrics(workflow_set)
- compare rfe or sbf objects too: resamples() also accepts those classes

## What resamples() does in one sentence

**`resamples()` is caret's model-comparison constructor.** You pass a named list of fitted `train`, `rfe`, or `sbf` objects and it returns a `resamples` object holding the per-fold metric matrix for every model side by side. From there, generic methods like `summary()`, `bwplot()`, `dotplot()`, `diff()`, and `modelCor()` operate on that bundle.

The function never refits anything. It only collects the cross-validation scores that each `train()` call already produced and aligns them by fold. Because the alignment is per fold, the comparison is paired, which gives tighter confidence intervals than independent comparisons.

[KEY INSIGHT]
**Every model in the list must share the exact same resampling indices.** Identical fold assignments make the metric vectors paired observations on the same data, so differences between models reflect the model, not random fold luck. Use shared seeds or pass `index =` / `indexOut =` to `trainControl()` to enforce this.

## resamples() syntax and arguments

**The signature is short and the input does the heavy lifting.** Most invocations are one line with a named list of fits.

```r title="Load caret and fit three models with identical folds"
library(caret)

set.seed(123)
ctrl <- trainControl(method = "repeatedcv",
                     number = 5, repeats = 3,
                     savePredictions = "final")

set.seed(1); fit_rf  <- train(mpg ~ ., data = mtcars, method = "rf",     trControl = ctrl)
set.seed(1); fit_gbm <- train(mpg ~ ., data = mtcars, method = "gbm",    trControl = ctrl, verbose = FALSE)
set.seed(1); fit_glm <- train(mpg ~ ., data = mtcars, method = "glmnet", trControl = ctrl)

res <- resamples(list(rf = fit_rf, gbm = fit_gbm, glm = fit_glm))
class(res)
#> [1] "resamples"
```

The two positional arguments are `x` (the named list of fits) and `modelNames` (defaults to `names(x)`). Anything else is forwarded. The names you give in `list(...)` become the model labels in every downstream summary and plot, so pick short, distinct labels.

Internally, `resamples()` extracts each fit's `pred` data frame (when `savePredictions = "final"`) and the per-fold metric vector, then checks that the resampling indices match across fits. If they do not, it throws an error rather than silently averaging unequal folds.

[NOTE]
**Names matter.** `resamples(list(rf = fit_rf, gbm = fit_gbm))` labels rows and columns by `rf` and `gbm` everywhere downstream. An unnamed list falls back to `Model1`, `Model2`, which is hard to skim in plots.

## resamples() examples by use case

**Three patterns cover almost every comparison job: summary, paired test, and per-fold inspection.** Each operates on the same `resamples` object.

```r title="Summarize metrics across folds and models"
summary(res)
#> Models: rf, gbm, glm
#> Number of resamples: 15
#>
#> RMSE
#>      Min. 1st Qu. Median  Mean 3rd Qu.   Max. NA's
#> rf  1.92   2.41   2.65  2.71    3.02   3.55    0
#> gbm 1.88   2.36   2.59  2.66    2.95   3.49    0
#> glm 2.30   2.74   3.01  3.05    3.31   3.92    0
#>
#> Rsquared
#>      Min. 1st Qu. Median  Mean 3rd Qu.   Max. NA's
#> rf  0.71   0.80   0.84  0.83    0.87   0.92    0
#> gbm 0.73   0.82   0.85  0.84    0.88   0.93    0
#> glm 0.60   0.72   0.78  0.77    0.83   0.89    0
```

The summary reports five-number plus mean per metric, per model. Eyeball the medians first: `gbm` edges out `rf` on both RMSE and Rsquared, and `glm` trails on both. That gap may or may not be statistically meaningful, which is what `diff()` answers.

```r title="Paired t-tests between every pair of models"
diffs <- diff(res)
summary(diffs)
#> p-value adjustment: bonferroni
#> Upper diagonal: estimates of the difference
#> Lower diagonal: p-value for H0 : difference = 0
#>
#> RMSE
#>      rf     gbm    glm
#> rf          0.044 -0.341
#> gbm 0.41           -0.385
#> glm 0.0021 0.0013
```

`diff()` runs paired t-tests on the per-fold metric vectors, then `summary()` prints estimates above the diagonal and Bonferroni-adjusted p-values below. Above, `glm` is significantly worse than both tree models, while `rf` versus `gbm` is a coin flip.

```r title="Per-fold scores and model correlation"
head(res$values, 3)
#>            Resample   rf~RMSE  gbm~RMSE  glm~RMSE   rf~Rsquared
#> 1 Fold1.Rep1            2.51      2.46      2.91          0.85
#> 2 Fold2.Rep1            2.83      2.74      3.14          0.79
#> 3 Fold3.Rep1            2.38      2.31      2.78          0.88

modelCor(res, metric = "RMSE")
#>        rf  gbm  glm
#> rf   1.00 0.94 0.71
#> gbm  0.94 1.00 0.69
#> glm  0.71 0.69 1.00
```

[TIP]
**High between-model correlation is an ensembling green light.** When two models score similarly fold-by-fold (correlation above 0.9), they are making the same mistakes; stacking adds little. Low correlation with similar averages is the sweet spot for an ensemble.

## Compare resamples() with alternatives

**Pick the function that matches the comparison granularity you need.**

| Goal | Function | Returns |
|---|---|---|
| Compare 2+ caret fits on shared folds | `resamples()` | resamples object with paired per-fold metrics |
| Score one prediction vector | `postResample(pred, obs)` | named numeric vector |
| Inspect one model's tuning results | `fit$results` | data frame, one row per hyperparameter combo |
| Paired statistical test on differences | `diff(resamples_obj)` | matrix of estimates and p-values |
| Compare tidymodels workflows | `tune::collect_metrics()` | tibble in tidy long form |

`resamples()` is the only one that pairs metrics fold-by-fold and ships with plotting and testing methods out of the box. If the candidate models come from different frameworks, fall back to a manual fold loop and combine the metric vectors by hand.

## Common pitfalls

**Three mistakes break resamples() silently or noisily.**

1. **Different resampling indices.** Forgetting to set the same seed before each `train()` call gives each model its own folds. `resamples()` throws a clear error in most cases, but if you reuse `trainControl()` without seeds across an interactive session, the folds drift. Pass `index =` and `indexOut =` to `trainControl()` to lock folds explicitly.
2. **Missing metric across models.** Comparing a regression model to a classification model returns NAs for every cell where one of them lacks the metric. Keep model lists homogeneous in outcome type.
3. **Forgetting `savePredictions = "final"`.** Plotting methods like `xyplot(res, models = c("rf","gbm"))` need the per-fold predictions, not just the metrics. Set `savePredictions = "final"` in `trainControl()` if you plan to do per-fold residual plots.

[WARNING]
**Always seed immediately before each `train()` call, not just once at the top.** Caret consumes random numbers internally during tuning, so a single top-of-script seed leaves later models with shifted RNG state and slightly different folds. The fix is `set.seed(N)` on the line above every `train()`.

## Try it yourself

**Try it:** Train a `knn` model and a `rpart` model on iris with the same five-fold trainControl, bundle them with `resamples()`, then print the Accuracy summary.

```r title="Your turn: bundle two iris classifiers"
# Try it: compare knn and rpart on iris
ctrl_iris <- trainControl(method = "cv", number = 5)

set.seed(7); fit_knn   <- # your code here
set.seed(7); fit_rpart <- # your code here

ex_res <- # your code here
summary(ex_res)
#> Expected: Accuracy and Kappa tables for knn and rpart
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctrl_iris <- trainControl(method = "cv", number = 5)

set.seed(7); fit_knn   <- train(Species ~ ., data = iris, method = "knn",   trControl = ctrl_iris)
set.seed(7); fit_rpart <- train(Species ~ ., data = iris, method = "rpart", trControl = ctrl_iris)

ex_res <- resamples(list(knn = fit_knn, rpart = fit_rpart))
summary(ex_res)
#> Models: knn, rpart
#> Accuracy median: knn 0.967, rpart 0.933
```

**Explanation:** Seeding immediately before each `train()` makes the five-fold splits identical, so `resamples()` can pair scores fold by fold. The summary then reports a fair head-to-head for both Accuracy and Kappa.

</details>

## Related caret functions

**Pair `resamples()` with these for a full model-selection workflow.**

- `caret::train()` builds each candidate model.
- `caret::trainControl()` defines the shared resampling plan.
- `caret::postResample()` scores a single prediction vector outside the train loop.
- `caret::confusionMatrix()` gives a richer classification report on test predictions.
- `caret::varImp()` ranks predictors after the winning model is chosen.

## FAQ

**Do all models passed to resamples() need to use the same trainControl?**

They need the same resampling indices, which is most reliably done by reusing the same `trainControl` object and seeding identically before each `train()` call. Different `summaryFunction` settings are fine as long as the resulting metric names overlap; non-overlapping metrics get NAs. The strict requirement is fold alignment, not the entire `trainControl` being byte-identical.

**Can resamples() compare regression and classification models together?**

Not usefully. Regression fits report RMSE, Rsquared, and MAE; classification fits report Accuracy and Kappa. The combined object has those columns side by side with NAs in the off-diagonal cells, and `diff()` cannot run paired tests across metric sets. Keep each comparison to one outcome family.

**What does diff() actually test?**

`diff()` runs paired t-tests on the per-fold metric differences for every pair of models, then `summary()` prints Bonferroni-adjusted p-values under the diagonal and effect-size estimates above it. The null hypothesis is that the mean per-fold difference equals zero. Significance depends on both effect size and how many folds and repeats the resampling plan used.

**How many models can I put in resamples()?**

There is no hard cap, but readability of plots and the Bonferroni penalty on `diff()` both degrade past 5 to 6 models. For wider sweeps, narrow to the top performers with `train()` first, then bundle the finalists for the formal comparison.

**Does resamples() work with rfe and sbf objects?**

Yes. `resamples()` accepts any combination of `train`, `rfe`, and `sbf` objects in the input list, as long as the resampling indices match. The summary, plot, and diff methods all behave the same way regardless of which class produced the underlying scores.
