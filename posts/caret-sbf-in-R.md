---
title: "caret sbf() in R: Filter-Based Feature Selection"
slug: caret-sbf-in-R
description: "Use caret sbf() in R for selection by filtering, a resampling-based univariate feature selection method. Covers sbfControl, lmSBF, rfSBF, and a worked example."
keywords: "caret sbf, sbf function R, caret sbf example, selection by filtering R, caret feature selection, sbfControl R, univariate filter feature selection"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: caret-functions
fr_parent: R-Tutorial.html
auto_link_terms: "sbf()|caret sbf|caret::sbf()|selection by filtering|sbfControl()"
auto_link_case_sensitive: true
target_keyword: caret sbf
sibling_block_enabled: true
difficulty: Intermediate
---

# caret sbf() in R: Filter-Based Feature Selection

<p class="lead">The caret <code>sbf()</code> function runs selection by filtering, a resampling-based feature selection method that scores each predictor with a univariate filter and keeps only those that pass before fitting a model.</p>

[QUICK ANSWER]
sbf(x, y, sbfControl = sbfControl(functions = lmSBF))   # regression filter
sbf(x, y, sbfControl = sbfControl(functions = rfSBF))   # classification filter
sbfControl(functions = lmSBF, method = "cv", number = 5) # 5-fold resampling
model$optVariables                                       # variables kept
predict(model, newdata)                                  # filter then predict
model$results                                            # resampled performance

[DECISION TREE: Is sbf() the right tool?]
- univariate filter then model: sbf(x, y, sbfControl = ctrl)
- search variable subsets by fit: rfe(x, y, rfeControl = ctrl)
- rank predictors inside a model: varImp(model)
- drop near-constant predictors: nearZeroVar(df)
- drop correlated predictors: findCorrelation(cor(df))
- genetic-algorithm search: gafs(x, y)

## What sbf() does in one sentence

**sbf() applies a univariate filter to every predictor, then fits a model on the survivors.** The name stands for Selection By Filtering. For each predictor, a scoring function computes a statistic that measures the predictor's relationship with the outcome on its own. A filter rule then decides which predictors to keep, and the chosen modeling function fits only on that subset.

The important detail is *where* the filtering happens. `sbf()` repeats the entire filter-then-fit cycle inside each resampling fold, so the predictor set is re-selected on every training split. That keeps the performance estimate honest.

[KEY INSIGHT]
**Filtering inside resampling is what makes sbf() trustworthy.** If you filter predictors once on the full data and then resample, the test folds have already influenced selection, and the accuracy estimate is optimistic. `sbf()` avoids that leak by design.

## sbf() syntax and arguments

**The core call passes predictors, an outcome, and a control object.** The most common form uses the `x` / `y` interface, though a formula interface also exists.

```r title="The sbf function signature"
sbf(x, y, sbfControl = sbfControl(), ...)
```

| Argument | Description |
|---|---|
| `x` | Predictor data frame or matrix |
| `y` | Outcome vector; numeric triggers a regression filter, a factor triggers a classification filter |
| `sbfControl` | Control object built by `sbfControl()` |
| `...` | Extra options passed to the modeling function |

The behaviour of `sbf()` is driven almost entirely by `sbfControl()`. Its key arguments:

| Argument | Description |
|---|---|
| `functions` | A filter-and-fit function set: `lmSBF`, `rfSBF`, `caretSBF`, `nbSBF`, `ldaSBF`, `treebagSBF` |
| `method` | Resampling scheme: `"boot"`, `"cv"`, `"repeatedcv"`, `"LOOCV"` |
| `number` | Number of folds or bootstrap resamples |
| `repeats` | Repeats when `method = "repeatedcv"` |
| `saveDetails` | Keep the per-resample selections for inspection |

Each function set bundles a `score`, `filter`, `fit`, and `pred` function. `lmSBF` scores predictors with a linear-model p-value and suits numeric outcomes. `rfSBF` uses random forest importance and suits classification. The default filter keeps predictors with a p-value below 0.05.

## A worked sbf() example

**Start with data where you know the answer.** The example below builds 8 predictors but only `real1` and `real2` actually drive the outcome. A good feature selector should recover those two and discard the noise.

```r title="Load caret and simulate data"
library(caret)

set.seed(1)
n <- 200
real1 <- rnorm(n)
real2 <- rnorm(n)
y <- 2 * real1 - 1.5 * real2 + rnorm(n)      # only 2 true predictors
noise <- matrix(rnorm(n * 6), ncol = 6)
colnames(noise) <- paste0("noise", 1:6)
predictors <- data.frame(real1, real2, noise)

dim(predictors)
#> [1] 200   8
```

With the data ready, build a control object and run `sbf()`. The `lmSBF` set fits a linear model, which matches the numeric outcome.

```r title="Run sbf with the lmSBF filter"
ctrl <- sbfControl(functions = lmSBF, method = "cv", number = 5)
sbf_model <- sbf(x = predictors, y = y, sbfControl = ctrl)
sbf_model
#> Selection By Filter
#> 
#> Outer resampling method: Cross-Validated (5 fold) 
#> 
#> Resampling performance:
#> 
#>   RMSE Rsquared   MAE RMSESD RsquaredSD  MAESD
#>  1.014    0.889 0.812 0.0731     0.0322 0.0689
#> 
#> Using the training set, 2 variables were selected:
#>    real1, real2.
#> 
#> During resampling, the top 5 selected variables (out of 8):
#>    real1 (100%), real2 (100%), noise2 (20%), noise5 (20%), noise6 (20%)
```

The summary reports two things at once. The selection on the full training set kept exactly `real1` and `real2`. The resampling section shows how stable that choice was: both true predictors survived in 100% of folds, while each noise variable slipped through only occasionally by chance.

[TIP]
**Always set a seed before sbf().** Resampling splits are random, so `set.seed()` makes the selected variables and the reported RMSE reproducible across runs.

```r title="Inspect the selected variables"
sbf_model$optVariables
#> [1] "real1" "real2"

predictors(sbf_model)
#> [1] "real1" "real2"
```

To score new observations, call `predict()`. It applies the same filter and then the fitted model in one step.

```r title="Predict on new data"
new_obs <- predictors[1:5, ]
predict(sbf_model, newdata = new_obs)
#> [1]  1.9827 -0.4385 -1.2596  3.0518  0.6218
```

## sbf() vs rfe(): choosing a feature selector

**Use sbf() when predictors can be judged one at a time, and rfe() when they cannot.** Both are caret wrappers that run feature selection inside resampling, but they search very differently.

| Aspect | `sbf()` | `rfe()` |
|---|---|---|
| Strategy | Univariate filter, each predictor scored alone | Recursive elimination, predictors ranked together |
| Speed | Fast, one pass per predictor | Slower, refits across subset sizes |
| Redundancy | Ignores it; keeps correlated predictors | Handles it through joint importance |
| Best for | Quick screening, many predictors | Final subset selection when interactions matter |

The decision rule is short. Reach for `sbf()` as a fast first screen, especially with a wide predictor matrix. Reach for [caret rfe()](caret-rfe-in-R.html) when predictors interact or are correlated and you need the smallest subset that holds accuracy.

## Common pitfalls

**The outcome type silently changes the filter.** A numeric `y` runs a regression filter; a factor `y` runs a classification filter. Encoding classes as 0 and 1 leaves them numeric, so `sbf()` quietly applies the wrong filter.

```r title="Outcome type drives the filter"
# A 0/1 numeric vector triggers the regression filter
class(ifelse(y > 0, 1, 0))
#> [1] "numeric"

# Fix: convert to a factor so sbf uses a classification filter
y_class <- factor(ifelse(y > 0, "high", "low"))
class(y_class)
#> [1] "factor"
```

[WARNING]
**A univariate filter cannot see redundancy.** Two predictors that are strongly correlated will both pass the filter because each looks useful on its own. `sbf()` will keep both. Pair it with [findCorrelation()](caret-findCorrelation-in-R.html) when collinearity is a concern.

Two more traps to avoid. First, do not pre-filter predictors before calling `sbf()`; that reintroduces the selection bias the function exists to prevent. Second, the default p-value cutoff of 0.05 is a convention, not a law. With many predictors, a stricter threshold or a different `functions` set often yields a cleaner subset.

## Try it yourself

**Try it:** Use `sbf()` with the `lmSBF` filter to select predictors of `mpg` from the `mtcars` dataset. Save the fitted object to `ex_sbf`.

```r title="Your turn: filter mtcars predictors"
# Try it: select predictors of mpg from mtcars with sbf
ex_ctrl <- sbfControl(functions = lmSBF, method = "cv", number = 5)
ex_sbf <- # your code here

ex_sbf$optVariables
#> Expected: most or all 10 mtcars predictors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ctrl <- sbfControl(functions = lmSBF, method = "cv", number = 5)
ex_sbf <- sbf(x = mtcars[, -1], y = mtcars$mpg, sbfControl = ex_ctrl)
ex_sbf$optVariables
#> [1] "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "vs"   "am"   "gear" "carb"
```

**Explanation:** Every `mtcars` predictor is individually correlated with `mpg`, so the univariate filter keeps all ten. That is the expected behaviour: `sbf()` scores one variable at a time and never removes redundant predictors.

</details>

## Related caret functions

**sbf() sits inside a wider caret feature-selection toolkit.** These functions cover the tasks `sbf()` deliberately leaves out.

- [caret rfe()](caret-rfe-in-R.html): recursive feature elimination for subset search
- [caret varImp()](caret-varImp-in-R.html): rank predictors inside an already-fitted model
- [caret nearZeroVar()](caret-nearZeroVar-in-R.html): drop predictors with almost no variance
- [caret findCorrelation()](caret-findCorrelation-in-R.html): remove highly correlated predictors
- [caret preProcess()](caret-preProcess-in-R.html): centre, scale, and transform predictors

See the official [caret feature selection documentation](https://topepo.github.io/caret/feature-selection-using-univariate-filters.html) for the full list of `sbfControl` function sets.

## FAQ

**What does sbf stand for in caret?**

`sbf` stands for Selection By Filtering. It is a feature selection wrapper in the caret package that screens predictors with a univariate filter. Each predictor is scored on its own relationship with the outcome, a filter rule decides which ones to keep, and a model is fitted on the survivors. The whole cycle runs inside resampling so the reported performance is not biased by the selection step.

**What is the difference between sbf and rfe in caret?**

`sbf()` filters predictors univariately: each one is judged alone, which is fast but blind to redundancy. `rfe()` runs recursive feature elimination, ranking predictors jointly and removing the weakest in repeated passes. Use `sbf()` as a quick screen on wide data, and `rfe()` when predictors interact or correlate and you need the smallest accurate subset.

**Does caret sbf prevent selection bias?**

Yes, when used as intended. `sbf()` re-runs the filter inside every resampling fold, so the held-out data never influences which predictors are selected. That produces an honest performance estimate. The bias returns only if you filter predictors manually before calling `sbf()`, which defeats the purpose of the wrapper.

**Which sbfControl functions should I use?**

Match the function set to the outcome. `lmSBF` suits numeric regression outcomes, while `rfSBF`, `ldaSBF`, and `nbSBF` suit classification. `caretSBF` is the most flexible because it delegates fitting to `train()`, and `treebagSBF` uses bagged trees. Start with `lmSBF` or `rfSBF` and switch only if a different model better fits your data.
