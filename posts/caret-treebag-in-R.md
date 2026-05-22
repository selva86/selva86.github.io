---
title: "caret treebag in R: Bagging Decision Trees with train()"
slug: "caret-treebag-in-R"
description: "Fit bagged decision trees in R with caret method treebag via train(): setup, tuning, cross-validation, variable importance, plus a full worked example."
keywords: "caret treebag, treebag R, caret bagged trees, treebag method caret, bagged decision trees R, caret train treebag, treebag varImp"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "treebag|caret treebag|method = \"treebag\"|caret bagged trees|bagged decision trees|bagged trees in caret"
auto_link_case_sensitive: true
target_keyword: "caret treebag"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret treebag in R: Bagging Decision Trees with train()

<p class="lead">The <code>caret treebag</code> method fits a bagged ensemble of unpruned decision trees by drawing many bootstrap samples, growing one <code>rpart</code> tree on each, and averaging the predictions. You invoke it through <code>train(method = "treebag")</code>, which delegates to <code>ipred::bagging()</code> and gives you cross-validation, variable importance, and a single tidy model object in return.</p>

[QUICK ANSWER]
train(mpg ~ ., data = mtcars, method = "treebag")              # regression
train(Species ~ ., data = iris, method = "treebag")            # classification
train(mpg ~ ., data = mtcars, method = "treebag", nbagg = 50)  # 50 trees
train(mpg ~ ., data = mtcars, method = "treebag",              # 10-fold CV
      trControl = trainControl(method = "cv", number = 10))
predict(fit, newdata = mtcars[1:5, ])                          # bag-averaged
varImp(fit)                                                    # importance
ipred::bagging(mpg ~ ., data = mtcars, nbagg = 25)             # direct call

[DECISION TREE: Is treebag the right tool?]
- bagged trees with caret tuning + CV: train(method = "treebag")
- bagged trees without caret wrapper: ipred::bagging(mpg ~ ., data = mtcars)
- random forest (bagging + feature sampling): train(method = "rf")
- gradient boosted trees instead: train(method = "gbm")
- bagged MARS, not trees: train(method = "bagEarth")
- single decision tree (no bagging): rpart::rpart(mpg ~ ., data = mtcars)

## What treebag does in one sentence

**`treebag` is caret's name for bootstrap-aggregated CART trees.** When you pass `method = "treebag"` to `train()`, caret bootstraps the training rows `nbagg` times, fits an unpruned `rpart` tree on each resample, and stores all trees inside one object. Calling `predict()` later averages the regression outputs or majority-votes the classification labels, cutting the high variance a single tree shows on noisy data.

## treebag syntax and arguments

**There is no `treebag()` function; you call it through `train()`.** caret routes `method = "treebag"` to `ipred::bagging()` under the hood and exposes the standard `train()` interface for tuning, resampling, and pre-processing.

```r title="Load caret and inspect mtcars"
library(caret)
library(ipred)

set.seed(1)
head(mtcars, 3)
#>                mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 16.46  1  1    4    1
```

Formula and matrix shapes both work:

```
train(formula, data, method = "treebag", trControl, ...)
train(x, y,        method = "treebag", trControl, ...)
```

Arguments you actually tune:

- `formula` or `x`, `y`: target on the left, predictors on the right; numeric outcome for regression, factor for classification.
- `data`: data frame matching the formula.
- `method = "treebag"`: tells caret to use bagged trees.
- `trControl`: the resampling plan, built with `trainControl()`. Default is bootstrap with 25 reps.
- `nbagg`: number of bootstrap trees. Forwarded to `ipred::bagging()`; default 25, push to 50 to 100 for noisy data.
- `keepX`: keep the predictor matrices on the fitted object; set `FALSE` to shrink memory.
- `...`: extra args forwarded to `ipred::bagging()` and then on to `rpart` (`control = rpart.control(...)`).

[NOTE]
**`treebag` has zero tunable hyperparameters.** `modelLookup("treebag")` returns one row with `parameter = "parameter"`, which is caret's signal that there is nothing to grid-search. Cross-validation still gives you an honest performance estimate; it just won't sweep a tuning grid.

## treebag examples by use case

**Four worked examples cover the calls you will reach for most.** Each one runs in a fresh session and prints the resampled performance summary.

### 1. Regression on mtcars

```r title="Bagged tree regression on mtcars"
set.seed(2)
fit_reg <- train(mpg ~ ., data = mtcars, method = "treebag")
fit_reg
#> Bagged CART
#>
#> 32 samples
#> 10 predictors
#>
#> No pre-processing
#> Resampling: Bootstrapped (25 reps)
#> Summary of sample sizes: 32, 32, 32, ...
#> Resampling results:
#>
#>   RMSE      Rsquared   MAE
#>   2.612473  0.7949481  2.158139
```

### 2. Classification on iris

```r title="Bagged tree classification on iris"
set.seed(3)
fit_cls <- train(Species ~ ., data = iris, method = "treebag")
fit_cls
#> Bagged CART
#>
#> 150 samples
#>   4 predictor
#>   3 classes: 'setosa', 'versicolor', 'virginica'
#>
#> Resampling: Bootstrapped (25 reps)
#> Resampling results:
#>
#>   Accuracy   Kappa
#>   0.9526648  0.9286194
```

### 3. Tune the bag size with `nbagg`

```r title="Push nbagg to 100 trees"
set.seed(4)
fit_big <- train(mpg ~ ., data = mtcars,
                 method = "treebag",
                 nbagg = 100)
fit_big$finalModel$mtrees |> length()
#> [1] 100
```

### 4. Honest 10-fold cross-validation and variable importance

```r title="10-fold CV with variable importance"
set.seed(5)
ctrl <- trainControl(method = "cv", number = 10)
fit_cv <- train(mpg ~ ., data = mtcars,
                method = "treebag",
                trControl = ctrl)

fit_cv$results
#>   parameter     RMSE  Rsquared      MAE   RMSESD RsquaredSD     MAESD
#> 1      none 2.541889 0.8362195 2.142107 0.961043  0.1614422 0.7717519

varImp(fit_cv)
#> treebag variable importance
#>
#>      Overall
#> wt    100.00
#> disp   86.42
#> hp     71.55
#> cyl    52.18
#> drat   18.04
#> qsec    9.67
```

[TIP]
**Match `nbagg` to your noise level, not your data size.** Clean small data plateaus around 25 trees; noisy or imbalanced data keeps improving up to 100 or 200. Beyond that the marginal RMSE drop is usually smaller than the cross-validation standard error.

## treebag vs other ensembles

**Pick the ensemble whose bias-variance trade matches the signal.** All four below sit in caret with the same `train()` call shape, so swapping is a one-line edit.

| Method | What it does | Tuning surface | Best when |
|--------|--------------|----------------|-----------|
| `treebag` | Bagged unpruned CART trees | None (just `nbagg`) | Quick variance reduction over a single tree |
| `rf` | Bagged trees plus random feature subsets | `mtry` | Many correlated predictors |
| `gbm` | Sequential boosted shallow trees | `n.trees`, `interaction.depth`, `shrinkage` | Maximum predictive power on tabular data |
| `bagEarth` | Bagged MARS (piecewise linear) | `degree`, `nprune` | Smooth nonlinearities, not step functions |

The decision rule is short: start with `treebag` to baseline what bagging buys over a single tree, then move to `rf` if you have many predictors and `gbm` if you have time to tune.

## Common pitfalls

**Three traps catch most first-time users.** Each one shows up as a confusing error or a quietly worse score.

```r title="Pitfall: tuneGrid does not apply"
set.seed(6)
try(train(mpg ~ ., data = mtcars,
          method = "treebag",
          tuneGrid = data.frame(nbagg = c(25, 50, 100))))
#> Error: The tuning parameter grid should have columns parameter
```

`treebag` is a no-tuning-grid model, so caret rejects the `tuneGrid`. To compare bag sizes you fit several models and compare resampling distributions with `resamples()`.

```r title="Pitfall: forgetting to set the seed"
set.seed(NULL)
a <- train(mpg ~ ., data = mtcars, method = "treebag")$results$RMSE
b <- train(mpg ~ ., data = mtcars, method = "treebag")$results$RMSE
c(a, b)
#> [1] 2.71 2.83
```

Each call resamples 25 fresh bootstraps and grows different trees, so RMSE shifts run to run. Wrap every fit in `set.seed()` if you compare numbers in a report.

[WARNING]
**Bagged trees do not extrapolate.** A tree splits within the observed range of each predictor; the bag averages those splits but never predicts outside training-data extremes. If your test set has predictors well past the training range, expect predictions to flatten out, not to track the trend.

## Try it yourself

**Try it:** Train a bagged-tree classifier on `iris` with 60 bootstrap trees and 10-fold cross-validation. Save the fitted model to `ex_treebag` and print its accuracy from `ex_treebag$results`.

```r title="Your turn: treebag on iris"
# Train treebag on iris with nbagg = 60 and 10-fold CV
ex_treebag <- # your code here

ex_treebag$results
#> Expected: one row, Accuracy near 0.95
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_treebag <- train(Species ~ ., data = iris,
                    method = "treebag",
                    nbagg = 60,
                    trControl = trainControl(method = "cv", number = 10))
ex_treebag$results
#>   parameter  Accuracy     Kappa AccuracySD   KappaSD
#> 1      none 0.9533333 0.9300000 0.05488484 0.0823273
```

**Explanation:** `method = "treebag"` plus `nbagg = 60` grows 60 bagged trees per resample; `trainControl(method = "cv", number = 10)` swaps the default bootstrap for 10-fold CV so you get an honest accuracy estimate.

</details>

## Related caret functions

- `train()` is the entry point for every caret model, including `treebag`. See the `train` deep-dive.
- `trainControl()` builds the resampling plan you pass to `train()`.
- `varImp()` extracts importance scores from the fitted bag.
- `bagEarth()` is the same bagging idea applied to MARS rather than CART trees.
- `predict.train()` returns bag-averaged predictions on new data.

## FAQ

**What is the difference between treebag and randomForest in caret?**
Both bag trees, but `randomForest` additionally samples a random subset of predictors at each split, which decorrelates the trees and usually improves accuracy on data with many correlated features. `treebag` keeps the full predictor set at every split, so its trees look more alike and the variance reduction plateaus sooner. Use `treebag` as a quick baseline and switch to `method = "rf"` when you have many predictors.

**Can I tune the number of trees in treebag with tuneGrid?**
No. `modelLookup("treebag")` shows zero tunable hyperparameters, so caret blocks `tuneGrid` calls. To compare bag sizes, fit several models with different `nbagg` values, collect them with `caret::resamples()`, and compare the resampling distributions. The cost of growing more trees is linear, and most datasets stop improving past 100.

**Does treebag handle missing values automatically?**
The underlying `rpart` trees can split on surrogate variables when a row has missing predictors, so a single tree tolerates `NA`s. `ipred::bagging()` passes data through unchanged, so the same surrogate behavior applies inside `treebag`. You still need to handle missing values in the outcome before calling `train()`, since caret drops those rows by default.

**How do I extract feature importance from a treebag model?**
Call `varImp(fit)` on the fitted `train` object. caret averages the importance score across the bag of trees, where each tree contributes the sum of goodness-of-split improvements for every variable it used. The output is a data frame ranked 0 to 100, with the strongest predictor pinned at 100. Plot with `plot(varImp(fit))` for a quick bar chart.

**Is treebag suitable for very large datasets?**
It depends on memory rather than runtime. Each bootstrap fits a full unpruned tree, so the in-memory size grows roughly linearly with `nbagg` and with the number of predictors. For tens of thousands of rows on a laptop, 25 to 50 trees is usually safe; beyond that, consider `ranger` (a faster random forest) or `xgboost` through caret, both of which scale better and tune more aggressively.
