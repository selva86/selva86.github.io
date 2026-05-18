---
title: "caret nearZeroVar() in R: Drop Near-Constant Predictors"
slug: "caret-nearZeroVar-in-R"
description: "Use caret nearZeroVar() in R to find and drop near-zero variance predictors before modeling. Covers freqCut, uniqueCut, saveMetrics, and worked examples."
keywords: "caret nearZeroVar, nearZeroVar function R, caret nearZeroVar example, R remove near zero variance predictors, nearZeroVar saveMetrics, zero variance predictors R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "nearZeroVar()|caret nearZeroVar|caret::nearZeroVar()|near-zero variance|zero variance predictors"
auto_link_case_sensitive: true
target_keyword: "caret nearZeroVar"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret nearZeroVar() in R: Drop Near-Constant Predictors

<p class="lead">The <code>nearZeroVar()</code> function in caret flags predictors that barely vary, columns where one value dominates and distinct values are few. These near-zero variance features add noise and can break model fitting, so nearZeroVar() finds them so you can drop them before training.</p>

[QUICK ANSWER]
nearZeroVar(df)                              # indices of bad columns
nearZeroVar(df, names = TRUE)                # column names instead
nearZeroVar(df, saveMetrics = TRUE)          # full metrics table
df[, -nearZeroVar(df)]                       # drop the flagged columns
nearZeroVar(df, freqCut = 99/1)              # stricter cutoff
nearZeroVar(df, uniqueCut = 5)               # require fewer unique values
preProcess(df, method = "nzv")               # same filter inside preProcess

[DECISION TREE: Is nearZeroVar() the right tool?]
- drop near-constant predictors: nearZeroVar(df, names = TRUE)
- drop highly correlated predictors: findCorrelation(cor(df))
- drop linear-combination columns: findLinearCombos(df)
- center and scale predictors: preProcess(df, method = "scale")
- one-hot encode factor columns: dummyVars(~ ., data = df)
- rank predictors by importance: varImp(model)

## What nearZeroVar() does in one sentence

**`nearZeroVar()` flags predictors that carry almost no information.** It scans each column, computes two diagnostics, and reports the columns whose distribution is so lopsided that a model would learn nothing useful from them. By default it returns a vector of column positions.

A predictor counts as near-zero variance when **both** conditions hold: one value appears far more often than the next most common value, and the column has very few distinct values overall. A column with a single repeated value is a special case called zero variance. Removing these columns before modeling speeds up training and prevents resampling folds from accidentally containing a constant predictor, which crashes many algorithms. One-hot encoding a factor with rare levels, stuck sensor readings, and survey questions answered the same way by nearly everyone all produce such columns, and `nearZeroVar()` catches every one of these patterns with a single call.

## nearZeroVar() syntax and arguments

**`nearZeroVar()` needs only a data frame or matrix of predictors.** Every other argument tunes how aggressive the filter is or changes the shape of the output.

```r title="Load caret and build sample data"
library(caret)

set.seed(1)
df <- data.frame(
  height     = rnorm(100, mean = 170, sd = 8),
  coin_flip  = rep(c(0, 1), 50),
  near_const = c(rep(1, 97), 2, 2, 3),
  constant   = rep(5, 100)
)
str(df)
#> 'data.frame': 100 obs. of  4 variables:
#>  $ height    : num  165 172 163 183 173 ...
#>  $ coin_flip : num  0 1 0 1 0 1 0 1 0 1 ...
#>  $ near_const: num  1 1 1 1 1 1 1 1 1 1 ...
#>  $ constant  : num  5 5 5 5 5 5 5 5 5 5 ...
```

The arguments that matter most are:

- `x`: a data frame or numeric matrix of predictors.
- `freqCut`: the cutoff for the ratio of the most common value to the second most common. Defaults to `95/5`, which equals 19.
- `uniqueCut`: the cutoff for the percentage of distinct values. Defaults to `10`.
- `saveMetrics`: if `TRUE`, return a diagnostic data frame instead of a position vector.
- `names`: if `TRUE`, return column names instead of column indices.
- `foreach` and `allowParallel`: switch to a parallel backend for very wide data frames; both default to the single-threaded path.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `VarianceThreshold`, but it only inspects raw variance. `nearZeroVar()` is stricter because it also checks how lopsided the value frequencies are.

## nearZeroVar() examples by use case

**Set `saveMetrics = TRUE` to see why each column is flagged.** This returns a data frame with the frequency ratio, the percent of unique values, and two logical flags for every predictor.

```r title="Inspect the full metrics table"
nearZeroVar(df, saveMetrics = TRUE)
#>            freqRatio percentUnique zeroVar   nzv
#> height          1.00           100   FALSE FALSE
#> coin_flip       1.00             2   FALSE FALSE
#> near_const     48.50             3   FALSE  TRUE
#> constant        0.00             1    TRUE  TRUE
```

`height` varies freely and `coin_flip` is balanced, so both are kept. `near_const` is flagged because 97 of 100 rows share one value, and `constant` is flagged as both `zeroVar` and `nzv` because it never changes.

[KEY INSIGHT]
**A column is flagged only when both gates fail.** `freqRatio` above `freqCut` AND `percentUnique` below `uniqueCut` together trigger `nzv`. A binary column survives because its frequency ratio is low, even though it has few unique values.

**Call `nearZeroVar()` with no extra arguments to get column positions.** Add `names = TRUE` when you want the column names instead, which is easier to read and safer to reuse.

```r title="Return indices or names"
nearZeroVar(df)
#> [1] 3 4

nearZeroVar(df, names = TRUE)
#> [1] "near_const" "constant"
```

**Use the result to subset the data frame.** Negative indexing drops the flagged columns and keeps the informative ones.

```r title="Drop the flagged columns"
clean <- df[, -nearZeroVar(df)]
names(clean)
#> [1] "height"    "coin_flip"
```

**Tune `freqCut` to make the filter stricter or looser.** A higher `freqCut` demands a more extreme imbalance before a column is flagged, so `near_const` survives while the truly constant column is still removed.

```r title="Raise freqCut to keep near_const"
nearZeroVar(df, freqCut = 99/1, names = TRUE)
#> [1] "constant"
```

Raising the cutoff to 99 moves the threshold past `near_const`'s ratio of 48.5, so only the truly constant column remains. Tune `uniqueCut` the same way to control how many distinct values a column may have before it is kept.

## nearZeroVar() vs preProcess and recipes

**`nearZeroVar()` is the standalone version of a filter that also lives inside other tools.** The right choice depends on whether you want a quick diagnostic or a step bundled into a modeling pipeline.

| Tool | Returns | Best for |
|---|---|---|
| `nearZeroVar()` | Column indices or a metrics table | Inspecting and filtering predictors by hand |
| `preProcess(method = "nzv")` | A reusable preprocessing object | Bundling the filter with centering and scaling |
| `recipes::step_nzv()` | A step in a recipe | tidymodels workflows |
| `apply(df, 2, var)` | Variance per column | Catching exact zero variance only |

Reach for `nearZeroVar()` when you want to see the metrics and decide manually. Reach for `preProcess(method = "nzv")` when the filter should travel with the model so test data is treated identically. A plain variance check with `apply()` misses the lopsided-but-not-constant case that `nearZeroVar()` was built to catch.

The distinction matters most once you split data into training and test sets. Filtering the full frame at once lets a column that is near-constant only in the test fold leak into your decision. Wrapping the filter in `preProcess()` or a recipe ties the rule to the training data alone.

## Common pitfalls

**`nearZeroVar()` returns positions, not a filtered data frame.** It tells you which columns to drop; the subsetting is your job. Pass the result to negative indexing, never expect a cleaned frame back directly.

**An empty result silently drops every column.** When no column is flagged, `nearZeroVar()` returns `integer(0)`. Using that in `df[, -integer(0)]` does not keep all columns, it removes all of them. Always guard with a length check.

```r title="Guard against an empty result"
safe_df <- data.frame(a = rnorm(10), b = rnorm(10))
nearZeroVar(safe_df)
#> integer(0)

ncol(safe_df[, -nearZeroVar(safe_df)])
#> [1] 0

nzv <- nearZeroVar(safe_df)
result <- if (length(nzv) > 0) safe_df[, -nzv] else safe_df
ncol(result)
#> [1] 2
```

[WARNING]
**Never index with `-integer(0)`.** A length-zero negative index returns a zero-column data frame, not the original. This bug hides easily because it throws no error. The `names = TRUE` form avoids it, since dropping by an empty character vector is harmless.

**Near-zero variance is not the same as useless.** A rare-event flag, such as a fraud indicator that is 1 for 0.5 percent of rows, will be flagged even though it is highly predictive. Review flagged columns with `saveMetrics = TRUE` before deleting them rather than dropping the whole list blindly.

**The flag depends on the rows you pass in.** `nearZeroVar()` recomputes its metrics on whatever data it sees, so a small or unrepresentative sample can flag a column that varies fine in the full data set. Run it on training data large enough to reflect real variation.

## Try it yourself

**Try it:** Run nearZeroVar on a data frame that has one near-constant column, and save the names of the flagged columns to ex_flagged.

```r title="Your turn: flag near-zero variance"
# Try it: flag the near-constant column
ex_df <- data.frame(
  x    = rnorm(50),
  flat = c(rep(0, 49), 1)
)
ex_flagged <- # your code here

ex_flagged
#> Expected: "flat"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_df <- data.frame(
  x    = rnorm(50),
  flat = c(rep(0, 49), 1)
)
ex_flagged <- nearZeroVar(ex_df, names = TRUE)
ex_flagged
#> [1] "flat"
```

**Explanation:** The `flat` column has 49 identical values and only two distinct values, so its frequency ratio (49) clears `freqCut` and its percent-unique (4) falls below `uniqueCut`, which flags it as near-zero variance.

</details>

[TIP]
**Run `saveMetrics = TRUE` first, then decide.** The metrics table shows exactly why each column was flagged, so you can spot a rare-but-useful predictor before it gets dropped with the rest.

## Related caret functions

These caret functions pair naturally with `nearZeroVar()` when preparing predictors for a model:

- [preProcess()](caret-preProcess-in-R.html) centers, scales, and imputes numeric predictors.
- [dummyVars()](caret-dummyVars-in-R.html) one-hot encodes categorical predictors.
- [findCorrelation()](caret-findCorrelation-in-R.html) removes highly correlated predictors.
- [findLinearCombos()](caret-findLinearCombos-in-R.html) drops columns that are exact linear combinations of others.
- [train()](caret-train-in-R.html) fits and tunes a model on the cleaned data.

## FAQ

**What does near-zero variance mean in caret?**

Near-zero variance describes a predictor whose values are almost all the same. caret flags a column when two conditions hold together: the most common value occurs far more often than the second most common (the frequency ratio is large), and the column has very few distinct values relative to the row count. Such columns add little signal, slow training, and can cause resampling folds to contain a constant predictor, so they are usually removed before modeling.

**How is nearZeroVar() different from zero variance?**

Zero variance means a column has exactly one value, so it never changes. Near-zero variance is broader: the column does change, but so rarely that it is nearly constant. In the `saveMetrics` output, a zero-variance column shows `zeroVar = TRUE` and `nzv = TRUE`, while a near-zero-variance column shows `zeroVar = FALSE` and `nzv = TRUE`. `nearZeroVar()` catches both, whereas a plain variance check only catches the exact zero-variance case.

**Should I always remove near-zero variance predictors?**

Not blindly. Most near-zero variance columns are noise and safe to drop, but a rare-event indicator, such as a fraud or default flag, can be both near-zero variance and strongly predictive. Inspect the flagged columns with `saveMetrics = TRUE`, confirm none of them encode a meaningful rare event, and then drop the rest. Tree-based models tolerate these columns better than linear models do.

**How do I use nearZeroVar() inside a caret modeling pipeline?**

Pass `preProcess = "nzv"` to `train()`, or build a `preProcess(method = "nzv")` object and apply it with `predict()`. Both apply the same near-zero variance filter as `nearZeroVar()` but learn the rule on the training data and replay it on test data, which keeps the two sets column-aligned and prevents leakage.
</content>
</invoke>
