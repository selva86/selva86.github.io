---
title: "yardstick rmse() in R: Score Regression Models"
slug: yardstick-rmse-in-R
description: "Use yardstick rmse() in R to score regression models with a tidy interface. See syntax, grouped scoring, weighting, MAE comparison, and common pitfalls."
keywords: "yardstick rmse, rmse function R, yardstick rmse examples, root mean squared error R, tidymodels rmse, rmse metric R, regression error R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: rmse()|yardstick rmse|yardstick::rmse()|root mean squared error|rmse metric|regression error metric
auto_link_case_sensitive: true
target_keyword: yardstick rmse
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick rmse() in R: Score Regression Models

<p class="lead">The yardstick rmse() function in R returns the root mean squared error of a regression model, accepting a tibble with truth and estimate columns and producing a tidy one-row summary that reads in the same units as the outcome variable.</p>

[QUICK ANSWER]
rmse(df, truth, estimate)                          # basic call
rmse(df, truth = obs, estimate = pred)             # named arguments
rmse(df, solubility, prediction)                   # default tidymodels output
df |> group_by(fold) |> rmse(obs, pred)            # by resample
rmse(df, obs, pred, na_rm = TRUE)                  # drop missing rows
rmse_vec(truth_vec, pred_vec)                      # vector interface
rmse(df, obs, pred, case_weights = w)              # weighted RMSE

[DECISION TREE: Is rmse() the right tool?]
- standard regression error in outcome units: rmse(df, truth, estimate)
- want errors in the same units, less outlier-sensitive: mae(df, truth, estimate)
- need a unit-free goodness-of-fit score: rsq(df, truth, estimate)
- percentage error matters more than absolute: mape(df, truth, estimate)
- outcome spans orders of magnitude (skewed): rmsle(df, truth, estimate)
- predicting classes, not numbers: accuracy(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)

## What rmse() measures

**rmse() squares each residual, averages them, then takes the square root.** You pass a data frame with the observed numeric outcome and the predicted values, and the function returns a one-row tibble with three columns: `.metric`, `.estimator`, and `.estimate`. The estimate is a non-negative number on the same scale as the outcome, so an RMSE of 0.7 on a solubility score means predictions are off by roughly 0.7 units on average.

Because squaring punishes large misses, RMSE is more outlier-sensitive than mean absolute error. That sensitivity is a feature when one big miss matters more than many small ones, and a bug when noisy outliers dominate the score. Pair RMSE with `mae()` and `rsq()` whenever you compare regression models.

[KEY INSIGHT]
**RMSE inherits the units of your outcome.** An RMSE of 3 on a price-in-dollars target means typical errors of about $3; on a log-price target it means a multiplicative factor of about exp(3). Always interpret RMSE on the scale you trained on.

## rmse() syntax and arguments

**The signature matches every other yardstick numeric metric.** Once you know the shape, the same call works for `mae()`, `rsq()`, `mape()`, and the rest of the regression family.

```r title="rmse generic signature"
rmse(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

Truth and estimate must both be numeric; factor, character, or logical inputs raise an error. If you fitted a classification model, reach for `accuracy()` or `roc_auc()` instead.

## Score regression models: four examples

**The examples below use yardstick's built-in solubility_test data, which ships a real regression prediction set.** First, load the package and inspect the data.

```r title="Load yardstick and inspect solubility data"
library(yardstick)
library(dplyr)

data("solubility_test")
head(solubility_test, 4)
#> # A tibble: 4 x 2
#>   solubility prediction
#>        <dbl>      <dbl>
#> 1      0.93       0.99
#> 2      0.85       0.71
#> 3      0.17       0.18
#> 4     -0.99      -0.57
```

**Example 1 calls rmse() with positional arguments.** The function picks up truth and estimate by position and returns the tidy summary.

```r title="Basic rmse score on solubility predictions"
rmse(solubility_test, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rmse    standard       0.722
```

The `.estimator` column reports `standard` because RMSE has no binary or multiclass variant. The estimate of 0.722 is in log-solubility units.

**Example 2 uses named arguments on a fresh prediction frame.** Named arguments are clearer when truth and estimate sit next to other features in a larger tibble.

```r title="Named-argument rmse on a custom frame"
set.seed(1)
custom <- tibble(
  obs  = rnorm(100, mean = 50, sd = 10),
  pred = rnorm(100, mean = 50, sd = 10)
)

rmse(custom, truth = obs, estimate = pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rmse    standard        14.1
```

**Example 3 groups scoring by resample fold.** When predictions from cross-validation live in one tibble, `group_by()` plus rmse returns one score per fold, giving instant per-resample diagnostics.

```r title="Per-fold rmse from a cross-validation tibble"
folded <- solubility_test |>
  mutate(fold = rep(paste0("fold", 1:5), length.out = n()))

folded |>
  group_by(fold) |>
  rmse(truth = solubility, estimate = prediction)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 rmse    standard       0.730
#> 2 fold2 rmse    standard       0.713
#> 3 fold3 rmse    standard       0.737
#> 4 fold4 rmse    standard       0.709
#> 5 fold5 rmse    standard       0.722
```

**Example 4 uses the vector interface for quick checks.** Inside `map()` calls or unit tests, `rmse_vec()` returns a plain scalar instead of a one-row tibble.

```r title="Vector interface returns a numeric scalar"
rmse_vec(solubility_test$solubility, solubility_test$prediction)
#> [1] 0.7222584
```

Use the vector form when you need a scalar for thresholds or unit tests; otherwise stay with the data-frame form so you can bind, group, or plot scores.

[TIP]
**Bind multiple metric calls with bind_rows().** Because every yardstick metric returns the same three columns, `bind_rows(rmse(...), mae(...), rsq(...))` produces a tidy three-row scorecard you can pass straight to `ggplot()` or `gt()` with no reshaping.

## rmse() compared with related metrics

**RMSE is the most popular regression metric, but rarely the only one you should report.** Pick a partner from the table when RMSE alone hides the story.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `rmse()` | Errors in outcome units, large misses matter | Heavily penalises outliers |
| `mae()` | Errors in outcome units, robust to outliers | Treats a tiny miss and a small miss the same way |
| `rsq()` | Need a unit-free 0-to-1 goodness-of-fit | Can mask large systematic bias |
| `mape()` | Communicate relative error to non-technical readers | Explodes when truth is near zero |
| `rmsle()` | Outcome spans orders of magnitude, skewed | Undefined for negative predictions |
| `ccc()` | Want agreement plus calibration in one number | Less familiar to most readers |

A safe default is RMSE as the headline number, MAE for outlier sensitivity, and R-squared for unit-free comparison across models with the same target.

## Common pitfalls

**Three small mistakes account for most rmse() failures.** Each one has a one-line fix.

The first is passing a factor column. yardstick refuses factor inputs because a factor implies classification, not regression. The fix is to cast to numeric before scoring:

```r title="Fix: cast factor predictions to numeric"
bad <- tibble(obs = c(1.2, 3.4, 5.6), pred = factor(c("1", "3", "6")))
# rmse(bad, obs, pred)  # would error
bad <- bad |>
  mutate(pred = as.numeric(as.character(pred)))
rmse(bad, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rmse    standard       0.471
```

The second pitfall is comparing RMSE across different target transformations. An RMSE of 0.2 on log-price and 50 on raw-price are not on the same scale. Back-transform predictions before scoring, or stick to one target representation.

The third pitfall is missing values. With `na_rm = TRUE` (the default), yardstick silently drops `NA` rows, which changes the denominator. Pre-filter the prediction frame when comparing models that handle missingness differently.

[WARNING]
**One big outlier can swamp RMSE.** Because errors are squared, a single residual of 100 contributes more to RMSE than a hundred residuals of 10. When you see RMSE jump after a small data change, plot residuals first; do not chase the metric.

## Try it yourself

**Try it:** Use the built-in `solubility_test` data. Compute the overall RMSE, then mutate a `bucket` column that splits predictions into "low" (below 0) and "high" (0 or above), group by bucket, and report RMSE per group. Save the per-bucket result to `ex_rmse_by_bucket`.

```r title="Your turn: bucketed rmse"
library(yardstick)
library(dplyr)
data("solubility_test")

# Try it: rmse by prediction bucket
ex_rmse_by_bucket <- # your code here

ex_rmse_by_bucket
#> Expected: 2 rows, one per bucket
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rmse_by_bucket <- solubility_test |>
  mutate(bucket = if_else(prediction < 0, "low", "high")) |>
  group_by(bucket) |>
  rmse(truth = solubility, estimate = prediction)
ex_rmse_by_bucket
#> # A tibble: 2 x 4
#>   bucket .metric .estimator .estimate
#>   <chr>  <chr>   <chr>          <dbl>
#> 1 high   rmse    standard       0.706
#> 2 low    rmse    standard       0.739
```

**Explanation:** Grouping before calling rmse() returns one row per bucket without reshaping. The "low" bucket has slightly higher RMSE, which suggests the model is a touch noisier when it predicts low solubility values.

</details>

## Related yardstick metrics

**rmse() is one entry in the yardstick numeric-metric family.** Reach for these neighbors when RMSE alone is not enough:

- `mae()` for an outlier-robust error in the same units
- `mape()` for percentage error reporting to stakeholders
- `rsq()` for a unit-free 0-to-1 goodness-of-fit
- `rmsle()` for skewed targets where multiplicative error matters
- `ccc()` for concordance correlation, useful in clinical and reliability work
- `metrics()` to compute several regression scores in a single call

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good RMSE value?**

There is no universal threshold. RMSE is in the units of your outcome, so a "good" value depends on the spread of that outcome. Compare RMSE against the standard deviation of the truth column: if RMSE is much smaller, the model is adding signal; if it is close, the model is barely better than predicting the mean. Always interpret alongside `rsq()` and a residual plot.

**How is rmse() different from sqrt(mean((y - yhat)^2))?**

They return the same number. yardstick wraps the formula in a function that validates inputs, handles missing values, supports `case_weights`, and returns a tidy tibble that integrates with `metrics()` and `group_by()`. Use rmse() everywhere for consistency with the tidymodels workflow.

**Can I weight rows when computing RMSE?**

Yes. Pass a `case_weights` column to `rmse()`. Common uses are survey weights, sample weights from `parsnip::fit()`, or importance weights. The result is a weighted root mean squared error on the outcome scale. Weights must be non-negative.

**Why does rmse() return a tibble instead of a number?**

The tidy return shape is the yardstick convention. Every metric returns the same three columns: `.metric`, `.estimator`, `.estimate`. That uniformity lets you `bind_rows()` calls or pipe into `group_by()` with no reshape step. Call `rmse_vec()` when you only need the scalar.

**Should I prefer RMSE or MAE for tuning?**

If you care most about avoiding large individual errors, tune on RMSE. If your business cost is roughly linear in error size, tune on MAE. The difference matters when the error distribution is heavy-tailed: RMSE favours models that flatten the tail; MAE favours models that minimise typical error.

## Summary

**rmse() is the default regression scorecard in yardstick.** Use it for the headline number, lean on `mae()` and `rsq()` for partners, and switch to `rmse_vec()` only when you need a scalar. Combined with `group_by()` it scales to any resampling scheme without reshaping, and combined with `bind_rows(metrics(...))` it produces a clean multi-metric report ready to publish.
