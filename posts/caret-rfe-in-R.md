---
title: "caret rfe() in R: Recursive Feature Elimination"
slug: "caret-rfe-in-R"
description: "Use caret rfe() in R for recursive feature elimination. Covers rfeControl, sizes, the rfFuncs and lmFuncs backends, and a worked variable selection example."
keywords: "caret rfe, rfe function R, caret rfe example, recursive feature elimination R, caret feature selection, rfeControl R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "rfe()|caret rfe|caret::rfe()|recursive feature elimination|rfeControl()"
auto_link_case_sensitive: true
target_keyword: "caret rfe"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# caret rfe() in R: Recursive Feature Elimination

<p class="lead">The caret <code>rfe()</code> function runs recursive feature elimination, a resampling-based search that fits a model, ranks predictors by importance, drops the weakest, and repeats until it finds the smallest subset of variables that does not lose predictive accuracy.</p>

[QUICK ANSWER]
rfe(x, y, sizes = c(1,2,3), rfeControl = ctrl)   # core call
rfeControl(functions = rfFuncs, method = "cv")    # random forest backend
rfeControl(functions = lmFuncs, number = 5)       # linear model backend
predictors(rfe_fit)                               # the chosen variables
rfe_fit$optVariables                              # same, as a vector
rfe_fit$optsize                                   # size of the best subset
plot(rfe_fit, type = c("g", "o"))                 # performance vs size

[DECISION TREE: Is rfe() the right tool?]
- rank then eliminate by resampling: rfe(x, y, sizes, rfeControl)
- filter predictors one at a time: sbf(x, y, sbfControl)
- genetic-algorithm feature search: gafs(x, y, iters = 10)
- simulated-annealing feature search: safs(x, y, iters = 100)
- drop near-constant columns first: nearZeroVar(df, names = TRUE)
- drop correlated predictors first: findCorrelation(cor(df))
- score importance without selecting: varImp(model)

## What rfe() does in one sentence

**`rfe()` is a wrapper method for feature selection.** Unlike filter methods that judge each predictor in isolation, recursive feature elimination judges predictors by how a real model performs with them. It fits the model, ranks variables by importance, removes the least useful, and refits on the smaller set.

This loop runs inside a resampling scheme such as cross-validation, so every candidate subset size gets an honest out-of-sample score. The function then picks the subset size with the best resampled performance and reports which variables belong in it. Because the search is driven by the model you actually intend to use, `rfe()` tends to keep predictors that interact well together, something a one-at-a-time filter cannot see.

## rfe() syntax and arguments

**`rfe()` needs a predictor set, an outcome, candidate subset sizes, and a control object.** The control object decides which model powers the search and how resampling is done.

```r title="Load caret and prepare data"
library(caret)

set.seed(1)
x <- mtcars[, c("cyl", "disp", "hp", "drat", "wt", "qsec", "gear", "carb")]
y <- mtcars$mpg
dim(x)
#> [1] 32  8
```

The arguments that matter most are:

- `x`: a data frame or matrix of predictors only. The outcome must not be inside it.
- `y`: the response vector, numeric for regression or a factor for classification.
- `sizes`: an integer vector of subset sizes to evaluate, for example `c(1, 2, 3, 5)`.
- `rfeControl`: the object returned by `rfeControl()`, which sets the backend model and resampling.
- `metric`: the score used to pick the winner, such as `"RMSE"` or `"Accuracy"`.

[TIP]
**Always set a seed before `rfe()`.** Recursive feature elimination resamples the data, so the selected subset can shift between runs. A `set.seed()` call directly before `rfe()` makes the chosen variables reproducible.

## A worked rfe() example

**Build the control object first, then pass it to `rfe()`.** Here `lmFuncs` powers the search with linear regression and `method = "cv"` requests 5-fold cross-validation.

```r title="Run recursive feature elimination"
ctrl <- rfeControl(functions = lmFuncs, method = "cv", number = 5)

set.seed(1)
rfe_fit <- rfe(x, y, sizes = c(1, 2, 3, 4, 5), rfeControl = ctrl)
rfe_fit
#> Recursive feature selection
#>
#> Outer resampling method: Cross-Validated (5 fold)
#>
#> Resampling performance over subset size:
#>
#>  Variables  RMSE Rsquared   MAE Selected
#>          1 3.290   0.7438 2.711
#>          2 2.829   0.8128 2.336
#>          3 2.665   0.8311 2.220        *
#>          4 2.730   0.8252 2.289
#>          5 2.812   0.8147 2.366
#>          8 2.844   0.8098 2.401
#>
#> The top 3 variables (out of 3):
#>    wt, hp, cyl
```

The starred row marks the winning subset size. A model with just three predictors beats the full eight-variable model on cross-validated RMSE, so the extra columns were adding noise rather than signal.

```r title="Extract the selected predictors"
predictors(rfe_fit)
#> [1] "wt" "hp" "cyl"

rfe_fit$optsize
#> [1] 3
```

[KEY INSIGHT]
**The reported scores come from resampling, not the training fit.** Each subset size in the table was scored on held-out folds, so the curve reflects how the model would generalize. That is why a smaller subset can legitimately win: fewer predictors lower variance.

```r title="Inspect performance per subset size"
rfe_fit$results[, c("Variables", "RMSE", "Rsquared")]
#>   Variables  RMSE Rsquared
#> 1         1 3.290   0.7438
#> 2         2 2.829   0.8128
#> 3         3 2.665   0.8311
#> 4         4 2.730   0.8252
#> 5         5 2.812   0.8147
#> 6         8 2.844   0.8098
```

The `results` data frame holds one row per subset size, which is exactly what `plot(rfe_fit)` draws as a performance curve. Use it to confirm the winner is a clear minimum and not a flat tie.

## Choosing the rfeControl backend

**The `functions` argument decides which model ranks and scores predictors.** caret ships several ready-made backends, and the right one depends on your outcome type and how nonlinear the relationships are.

| `functions` | Model used | Best for |
|---|---|---|
| `lmFuncs` | Linear regression | Numeric outcome, roughly linear effects |
| `rfFuncs` | Random forest | Mixed predictors, nonlinear effects |
| `treebagFuncs` | Bagged trees | Robust nonlinear search, few tuning knobs |
| `nbFuncs` | Naive Bayes | Fast classification baseline |
| `caretFuncs` | Any `train()` model | Custom model chosen via the `method` argument |

The other `rfeControl()` arguments tune the resampling: `method` picks the scheme (`"cv"`, `"repeatedcv"`, or `"boot"`), `number` sets the fold or resample count, and `repeats` applies when you use repeated cross-validation.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `RFECV`, which also wraps recursive elimination in cross-validation. The difference is that `rfe()` lets you swap the backend model through `rfeControl()` rather than passing the estimator directly.

## Common pitfalls

**Three mistakes account for most broken `rfe()` runs.** Each one is easy to spot once you know the symptom.

- **Leaving the outcome inside `x`.** If the response column is still in the predictor matrix, the model fits it perfectly and `rfe()` selects only that column. Always build `x` and `y` as separate objects.
- **Setting `sizes` larger than the column count.** Any value in `sizes` above `ncol(x)` is silently ignored, and the full size is always tested anyway. Keep `sizes` within the real range of predictors.
- **Treating the reported RMSE as a final test score.** The resampled score guided the selection, so it is mildly optimistic. Estimate true performance on a separate hold-out set after selection.

[WARNING]
**Do not filter predictors on the whole dataset before `rfe()`.** Pre-selecting variables using all the data leaks information into every resampling fold. Let `rfe()` do the selection inside its own resampling loop instead.

## Try it yourself

**Try it:** Run recursive feature elimination on the four iris measurements to classify `Species`, using the random forest backend and 5-fold cross-validation. Save the result to `ex_rfe`.

```r title="Your turn: rfe on iris"
# Try it: select predictors for Species
ex_ctrl <- rfeControl(functions = rfFuncs, method = "cv", number = 5)
ex_rfe <- # your code here

predictors(ex_rfe)
#> Expected: the two petal measurements
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_ctrl <- rfeControl(functions = rfFuncs, method = "cv", number = 5)
ex_rfe  <- rfe(iris[, 1:4], iris$Species,
               sizes = c(1, 2, 3), rfeControl = ex_ctrl)
predictors(ex_rfe)
#> [1] "Petal.Width"  "Petal.Length"
```

**Explanation:** `rfe()` ranks the four iris measurements by random forest importance and finds that the two petal measurements alone match full-model accuracy, so it selects the smallest subset that does not lose accuracy.

</details>

## Related caret functions

**`rfe()` is one of several feature-selection tools in caret.** Reach for a neighbour when the wrapper search is not the right fit:

- `sbf()`: selection by filter, scores predictors one at a time.
- `gafs()`: genetic algorithm search over feature subsets.
- `safs()`: simulated annealing search over feature subsets.
- `varImp()`: ranks predictor importance without removing anything.
- `nearZeroVar()`: drops near-constant columns before any search.

## FAQ

**What is the difference between rfe() and varImp()?**

`varImp()` only ranks predictors by importance for a single fitted model and never removes anything. `rfe()` uses that ranking inside a resampling loop: it drops the weakest predictors, refits, and scores each subset size on held-out folds. The result is an actual recommended subset, not just a ranking. Use `varImp()` to understand a model and `rfe()` to choose which variables to keep.

**How does rfe() avoid overfitting during feature selection?**

`rfe()` wraps the entire elimination process inside resampling. For every fold, it ranks and removes predictors using only the training portion, then scores the surviving subset on the held-out portion. Because selection happens separately within each fold, the reported curve reflects out-of-sample performance rather than the training fit, which keeps the chosen subset size honest.

**What does the sizes argument do in rfe()?**

`sizes` lists the candidate subset sizes that `rfe()` should evaluate, such as `c(1, 2, 3, 5)`. For each size, the function keeps that many top-ranked predictors and scores the model through resampling. The full predictor count is always tested too. `rfe()` then selects the size with the best metric and reports it as `optsize`.

**Can rfe() be used for classification?**

Yes. Pass a factor as `y` and choose a classification backend such as `rfFuncs` or `nbFuncs` in `rfeControl()`. The metric switches to `"Accuracy"` or `"Kappa"` automatically, and `rfe()` reports the subset of predictors that maximizes classification performance across the resampling folds.
