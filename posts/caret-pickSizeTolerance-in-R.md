---
title: "caret pickSizeTolerance() in R: Parsimonious RFE Picks"
slug: caret-pickSizeTolerance-in-R
description: "caret pickSizeTolerance() in R picks the smallest rfe subset within tol percent of the best metric. Covers signature, tol tuning, pickSizeBest comparison."
keywords: "caret pickSizeTolerance, pickSizeTolerance function R, caret pickSizeTolerance examples, R parsimonious model selection, caret rfe tolerance, smallest model within tolerance, pickSizeTolerance argument"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: caret-functions
fr_parent: R-Tutorial.html
auto_link_terms: "pickSizeTolerance()|caret pickSizeTolerance|caret::pickSizeTolerance()|parsimonious model selection|tolerance selector"
auto_link_case_sensitive: true
target_keyword: caret pickSizeTolerance
sibling_block_enabled: true
difficulty: Beginner
---

# caret pickSizeTolerance() in R: Parsimonious RFE Picks

<p class="lead">The <code>caret pickSizeTolerance()</code> function returns the smallest recursive feature elimination subset size whose resampled metric is within a stated percentage of the best size. Use it when a slightly worse but much smaller model beats the absolute top score on interpretability or deployment cost.</p>

[QUICK ANSWER]
pickSizeTolerance(x, metric, tol = 1.5, maximize)         # default 1.5 percent slack
pickSizeTolerance(x, "RMSE", tol = 2, maximize = FALSE)   # regression, tighter parsimony
pickSizeTolerance(x, "ROC", tol = 1, maximize = TRUE)     # classification, strict
pickSizeTolerance(rfe_fit$results, "Accuracy", 3, TRUE)   # call on a fitted rfe object
rfeControl(functions = list(selectSize = pickSizeTolerance))  # wire as size selector
identical(rfFuncs$selectSize, pickSizeBest)               # TRUE; default is pickSizeBest, not tolerance
caret::pickSizeTolerance                                  # inspect source code

[DECISION TREE: Is pickSizeTolerance() the right tool?]
- prefer smallest subset within tol of best score: pickSizeTolerance(x, metric, tol, maximize)
- absolute top score, no parsimony bias: pickSizeBest(x, metric, maximize)
- run the recursive feature elimination loop: rfe(x, y, sizes, rfeControl)
- configure rfe resampling and helpers: rfeControl(functions = rfFuncs, method = "cv")
- tune-parameter tolerance for train(): tolerance(x, metric, tol, maximize)
- rank predictors without elimination: varImp(fit)

## What pickSizeTolerance() does in one sentence

**pickSizeTolerance() scans an rfe results table and returns the smallest subset size whose resampled metric is within `tol` percent of the best.** It is a stateless integer-returning helper, not a model. You hand it the `results` data frame from a recursive feature elimination run, name the metric column, set a tolerance percentage, and tell it whether higher scores are better. It returns one integer: the chosen number of predictors.

The parsimony bias is the whole point. Two subsets that score 0.918 and 0.915 ROC are statistically indistinguishable, but the smaller one trains faster, ships smaller, and is easier to explain. `pickSizeTolerance()` formalizes that judgment.

## pickSizeTolerance() syntax and arguments

**The signature has four arguments and a tolerance default of 1.5 percent.**

```r title="Load caret and call pickSizeTolerance on a toy table"
library(caret)

results <- data.frame(
  Variables = c(2, 4, 6, 8, 10),
  RMSE      = c(3.21, 2.85, 2.47, 2.41, 2.39),
  Rsquared  = c(0.42, 0.55, 0.66, 0.68, 0.69)
)

pickSizeTolerance(results, metric = "RMSE", tol = 5, maximize = FALSE)
#> [1] 6
```

The full signature is:

```r title="Function signature"
pickSizeTolerance(x, metric, tol = 1.5, maximize)
```

Arguments:

- `x`: a data frame of resampled results. Must contain a column named `Variables` (the subset size tried) and a column whose name matches `metric`.
- `metric`: character string. Column name to optimize. Regression: `"RMSE"`, `"MAE"`, `"Rsquared"`. Classification: `"Accuracy"`, `"Kappa"`, `"ROC"`, `"Sens"`, `"Spec"`.
- `tol`: numeric percentage of slack from the best score. Default is `1.5` (1.5 percent). Larger values pick smaller subsets.
- `maximize`: logical. `TRUE` when higher is better (Accuracy, ROC, Rsquared). `FALSE` when lower is better (RMSE, MAE, logLoss).

The return value is one integer: the `Variables` value of the smallest qualifying row. Internally caret computes the percent loss per size, filters to rows with loss less than or equal to `tol`, and picks the row with the fewest variables. Ties on size are broken by the smaller index, which already corresponds to the smaller subset.

[NOTE]
**The default `tol = 1.5` matches caret's built-in `rfFuncs$selectSize` recipe.** If you swap `pickSizeTolerance` into `rfeControl`, the same 1.5 percent slack applies unless you pass a custom wrapper that fixes a different `tol`.

## pickSizeTolerance() examples by use case

**The function takes one resampled table; the four examples below vary the metric, the tol, and the call context.**

### Example 1: regression with default tolerance

**Default `tol = 1.5` covers the most common regression workflow.** Use it when RMSE is the headline metric and you want a sensible parsimony floor without thinking about the number.

```r title="Default 1.5 percent slack for RMSE"
results_reg <- data.frame(
  Variables = c(1, 2, 4, 8, 16),
  RMSE      = c(4.10, 3.05, 2.62, 2.50, 2.48)
)

pickSizeTolerance(results_reg, "RMSE", tol = 1.5, maximize = FALSE)
#> [1] 8
```

Best RMSE is 2.48 at 16 variables. The 1.5 percent slack threshold is `2.48 * 1.015 = 2.517`. Size 8 (RMSE 2.50) qualifies, size 4 (RMSE 2.62) does not, so 8 wins. You traded a 0.02 RMSE bump for half the predictors.

### Example 2: classification with strict tolerance

**Tighten `tol` to 1 when small ROC differences matter for downstream decisions.** Clinical scoring, fraud screening, and credit risk often cannot afford the 1.5 percent default give-up.

```r title="ROC with 1 percent tolerance for tighter selection"
results_clf <- data.frame(
  Variables = c(2, 4, 8, 12, 20),
  ROC       = c(0.78, 0.84, 0.89, 0.91, 0.915)
)

pickSizeTolerance(results_clf, "ROC", tol = 1, maximize = TRUE)
#> [1] 12
```

Best ROC is 0.915 at 20 variables. The 1 percent slack floor is `0.915 * 0.99 = 0.906`. Sizes 12 and 20 clear the bar; the smaller (12) wins. Drop `tol` to 0.5 and only size 20 qualifies.

### Example 3: wired into rfe() through rfeControl()

**Swap `pickSizeTolerance` into the `selectSize` slot of `rfFuncs` to change rfe behavior end-to-end.** The change applies to `optsize`, `optVariables`, and any plot drawn from the fitted `rfe` object.

```r title="Use pickSizeTolerance as the rfe size selector"
data(mtcars)
funs <- rfFuncs
funs$selectSize <- pickSizeTolerance

ctrl <- rfeControl(functions = funs, method = "cv", number = 5)

set.seed(42)
rfe_fit <- rfe(
  x          = mtcars[, -1],
  y          = mtcars$mpg,
  sizes      = c(2, 4, 6, 8, 10),
  rfeControl = ctrl,
  metric     = "RMSE"
)

rfe_fit$optsize
#> [1] 4
```

By copying `rfFuncs` and overriding only its `selectSize` slot, `rfe()` calls `pickSizeTolerance()` instead of the default `pickSizeBest()` when picking `optsize`. The resulting fit reports the parsimonious size in `rfe_fit$optsize` and stores the chosen variables in `rfe_fit$optVariables`.

### Example 4: scan multiple tol values to see the trade-off

**Sweep `tol` across a small grid before committing to one value.** The output exposes the parsimony curve and gives you something concrete to defend in code review.

```r title="Sweep tol values to inspect parsimony curve"
results_sweep <- data.frame(
  Variables = c(2, 4, 8, 16, 32),
  Accuracy  = c(0.71, 0.79, 0.84, 0.86, 0.865)
)

sapply(c(0.5, 1, 3, 10), function(t) {
  pickSizeTolerance(results_sweep, "Accuracy", tol = t, maximize = TRUE)
})
#> [1] 32 16  8  4
```

A `tol` sweep is the fastest way to pick a defensible value. The output maps tolerance to chosen size, so you can argue "1 percent slack still costs us 16 features; 3 percent halves it again" instead of guessing.

[TIP]
**Always pair the sweep with the metric column to show what you gave up.** Print `results_sweep[results_sweep$Variables %in% chosen_sizes, ]` so the trade is visible, not hidden inside a single integer.

## pickSizeTolerance() vs pickSizeBest() and custom selectors

**The two built-in selectors optimize different objectives; custom selectors handle anything else.**

| Selector | Returns | Bias | Default `tol` | When to use |
|---|---|---|---|---|
| `pickSizeBest()` | Size with absolute best metric | Performance only | n/a | Maximum accuracy matters, model size does not |
| `pickSizeTolerance()` | Smallest size within `tol` percent of best | Parsimony with floor | 1.5 | Interpretability or deployment cost matters |
| Custom `selectSize` | Whatever you write | Anything | Anything | Combine size, score variance, and stability |

`pickSizeBest()` ignores the gap between sizes; a one-feature difference and a hundred-feature difference look identical if scores are equal. `pickSizeTolerance()` always prefers the smaller of two near-tied sizes. Custom selectors get the full `results` frame plus the metric and maximize flag, so you can rank by `mean - sd`, penalize sizes above a budget, or apply business rules.

[KEY INSIGHT]
**Tolerance turns the size selector into a parsimony lever you tune, not a fixed rule.** Move `tol` from 0 (= pickSizeBest) to 5 and you slide along the bias-variance trade-off without rewriting any model code.

## Common pitfalls

**The two failure modes are wrong-direction maximize and tol values on the wrong scale.**

```r title="Pitfall: setting maximize incorrectly for RMSE"
results_bad <- data.frame(Variables = c(2, 4, 8), RMSE = c(3.5, 2.8, 2.5))

pickSizeTolerance(results_bad, "RMSE", tol = 1.5, maximize = TRUE)
#> [1] 2
```

With `maximize = TRUE` the function treats 3.5 as the "best" RMSE and picks the size with the highest error. Always set `maximize = FALSE` for RMSE, MAE, logLoss, and `maximize = TRUE` for Accuracy, ROC, Rsquared. Read the metric direction once and write it down at the top of the script.

The second pitfall is `tol` scaling. `tol` is a percentage (1.5 means 1.5 percent), not a raw metric unit. Passing `tol = 0.015` thinking it means "1.5 percent" gives you near-zero slack and reduces the call to `pickSizeBest()`.

[WARNING]
**Custom `rfFuncs$selectSize <- pickSizeTolerance` assignments persist for the R session.** Reset with `data(rfFuncs)` or restart R; otherwise downstream `rfe()` calls quietly use tolerance selection when you expected best.

## Try it yourself

**Try it:** Given the resampled accuracy table below, pick the smallest subset size within 2 percent of the best ROC. Save the chosen size to `ex_size`.

```r title="Your turn: tolerance pick on a custom table"
ex_results <- data.frame(
  Variables = c(3, 6, 9, 12, 15),
  ROC       = c(0.81, 0.86, 0.892, 0.905, 0.91)
)

# Try it: parsimonious ROC pick at tol = 2
ex_size <- # your code here

ex_size
#> Expected: 9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_size <- pickSizeTolerance(ex_results, metric = "ROC", tol = 2, maximize = TRUE)
ex_size
#> [1] 9
```

**Explanation:** Best ROC is 0.91 at size 15. The percent loss for size 9 is `(0.91 - 0.892)/0.91 * 100 = 1.98`, which is within `tol = 2`. Sizes 9, 12 and 15 all qualify, so the smallest (9) wins.

</details>

## Related caret functions

For the rest of the rfe workflow, reach for these companions:

- `pickSizeBest()`: pick the size with the absolute best resampled metric, no parsimony bias.
- `pickVars()`: return the list of variables held across resamples at the chosen size.
- `rfe()`: run the recursive feature elimination loop itself.
- `rfeControl()`: configure resampling, helper functions, and the size selector.
- `tolerance()`: the analogue of `pickSizeTolerance()` for `train()` tuning grids.

## FAQ

**What does `tol = 1.5` actually mean in `pickSizeTolerance()`?**

`tol = 1.5` means a 1.5 percent slack from the best resampled metric. If best accuracy is 0.90, the function accepts any size with accuracy at least `0.90 * (1 - 0.015) = 0.8865`. For RMSE, the threshold flips: with best RMSE 2.00 and tol 1.5, any size with RMSE at most `2.00 * 1.015 = 2.03` qualifies. The smallest qualifying size wins.

**When should I use `pickSizeTolerance()` instead of `pickSizeBest()`?**

Pick tolerance when model size has downstream cost: scoring latency on a serving path, interpretability for stakeholders, or a feature-engineering budget. `pickSizeBest()` returns the score-maximizing size regardless of how many extra features it dragged in. `pickSizeTolerance()` formalizes the "I'd rather have a slightly worse, much smaller model" trade as a single percentage.

**How do I wire `pickSizeTolerance()` into an `rfe()` call?**

Pass a custom `functions` list to `rfeControl()` with `selectSize = pickSizeTolerance`. The simplest form is `rfeControl(functions = c(rfFuncs, list(selectSize = pickSizeTolerance)))`, which inherits everything from `rfFuncs` and overrides only the size selector. The `tol` value defaults to 1.5; set a different default by wrapping the function: `selectSize = function(...) pickSizeTolerance(..., tol = 3)`.

**Does `pickSizeTolerance()` work with custom metrics?**

Yes, as long as the `results` data frame has a column named exactly what you pass to `metric`. If your `rfeControl(functions$summary)` returns columns `MeanAUC` and `MeanLogLoss`, call `pickSizeTolerance(x, "MeanAUC", tol = 2, maximize = TRUE)`. The function never inspects metric meaning; it only reads the column you name and applies the percent-loss rule.
