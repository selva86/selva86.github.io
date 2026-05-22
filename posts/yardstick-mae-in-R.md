---
title: "yardstick mae() in R: Outlier-Robust Regression Scoring"
slug: yardstick-mae-in-R
description: "Use yardstick mae() in R for outlier-robust regression scoring. See the syntax, four worked examples, per-fold scoring, case weights, and common pitfalls."
keywords: "yardstick mae, mae function R, yardstick mae examples, mean absolute error R, tidymodels mae, mae metric R, robust regression error R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: mae()|yardstick mae|yardstick::mae()|mean absolute error|mae metric
auto_link_case_sensitive: true
target_keyword: yardstick mae
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick mae() in R: Outlier-Robust Regression Scoring

<p class="lead">The yardstick mae() function in R returns the mean absolute error of a regression model, accepting a tibble with truth and estimate columns and producing a tidy one-row summary in the same units as the outcome, with no penalty inflation from outliers.</p>

[QUICK ANSWER]
mae(df, truth, estimate)                          # basic call
mae(df, truth = obs, estimate = pred)             # named arguments
mae(df, solubility, prediction)                   # tidymodels columns
df |> group_by(fold) |> mae(obs, pred)            # by resample
mae(df, obs, pred, na_rm = TRUE)                  # drop missing rows
mae_vec(truth_vec, pred_vec)                      # vector interface
mae(df, obs, pred, case_weights = w)              # weighted MAE

[DECISION TREE: Is mae() the right tool?]
- outlier-robust error in outcome units: mae(df, truth, estimate)
- penalise large misses more heavily: rmse(df, truth, estimate)
- need a unit-free goodness-of-fit score: rsq(df, truth, estimate)
- percentage error matters more than absolute: mape(df, truth, estimate)
- scale-free comparison across series: mase(df, truth, estimate)
- predicting classes, not numbers: accuracy(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)

## How mae() scores a regression model

**mae() takes the absolute value of each residual and averages them.** You pass a data frame with the observed numeric outcome and the predicted values, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is non-negative and reads in the same units as the outcome, so an MAE of 0.5 on a solubility score means typical predictions miss by half a unit.

Because absolute value treats a small miss and a large miss in proportion, MAE is less sensitive to outliers than RMSE. That makes it the right choice when a handful of unusual observations should not dominate the metric, and it pairs naturally with quantile regression at the median.

[KEY INSIGHT]
**MAE is the average of |residual|, not the average of squared residuals.** A model that minimises MAE behaves like a median predictor: it tolerates many small misses and refuses to chase outliers. RMSE behaves like a mean predictor: it punishes the rare big miss more than the many tiny ones.

## mae() syntax and arguments

**The signature matches every other yardstick numeric metric.** Once you know the shape, the same call works for `rmse()`, `rsq()`, `mape()`, and the rest of the regression family.

```r title="mae generic signature"
mae(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

Truth and estimate must both be numeric; factor, character, or logical inputs raise an error. If you fitted a classification model, reach for `accuracy()` or `roc_auc()` instead.

## MAE in action: four worked examples

**The examples below use yardstick's built-in solubility_test data, which ships a real regression prediction set.** Load the package and inspect the data first.

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

**Example 1 calls mae() with positional arguments.** The function locates truth and estimate by position and returns the tidy summary.

```r title="Basic mae score on solubility predictions"
mae(solubility_test, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mae     standard       0.524
```

The `.estimator` is `standard` because MAE has no binary or multiclass variant. The estimate of 0.524 sits in log-solubility units and is smaller than the RMSE of 0.722 on the same data, which is the expected ordering whenever residuals contain any spread.

**Example 2 contrasts MAE and RMSE under an injected outlier.** Adding one large miss inflates RMSE far more than MAE, which is exactly why MAE survives heavy-tailed errors.

```r title="MAE versus RMSE when one outlier appears"
spike <- solubility_test
spike$prediction[1] <- spike$prediction[1] + 10  # inject one big miss

mae(spike, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mae     standard       0.556

rmse(spike, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rmse    standard       0.917
```

MAE rises from 0.524 to 0.556 (about 6 percent), while RMSE jumps from 0.722 to 0.917 (about 27 percent). The same outlier costs RMSE roughly four times what it costs MAE.

**Example 3 groups scoring by resample fold.** When cross-validation predictions live in one tibble, `group_by()` plus mae returns one score per fold for instant per-resample diagnostics.

```r title="Per-fold mae from a cross-validation tibble"
folded <- solubility_test |>
  mutate(fold = rep(paste0("fold", 1:5), length.out = n()))

folded |>
  group_by(fold) |>
  mae(truth = solubility, estimate = prediction)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 mae     standard       0.531
#> 2 fold2 mae     standard       0.523
#> 3 fold3 mae     standard       0.514
#> 4 fold4 mae     standard       0.527
#> 5 fold5 mae     standard       0.523
```

**Example 4 uses the vector interface for quick checks.** Inside `map()` calls or unit tests, `mae_vec()` returns a plain scalar instead of a one-row tibble.

```r title="Vector interface returns a numeric scalar"
mae_vec(solubility_test$solubility, solubility_test$prediction)
#> [1] 0.5236449
```

Use the vector form when you need a scalar for thresholds or unit tests; otherwise stay with the data-frame form so you can bind, group, or plot scores.

[TIP]
**Report MAE alongside RMSE, never alone.** The gap between RMSE and MAE measures how much the tail of the residual distribution moves the headline number. A widening gap across model versions usually means the tail grew, even when the typical error looks stable.

## When to pick mae() over its neighbors

**MAE is the outlier-robust default in the yardstick regression family.** The table below picks the metric you want when MAE is not the right fit.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `mae()` | Errors in outcome units, robust to outliers | Ignores whether a big error matters more than a small one |
| `rmse()` | Errors in outcome units, large misses matter | Heavily penalises outliers |
| `rsq()` | Need a unit-free 0-to-1 goodness-of-fit | Can mask large systematic bias |
| `mape()` | Communicate relative error to non-technical readers | Explodes when truth is near zero |
| `mase()` | Compare scale-free across multiple time series | Requires a naive baseline forecast |
| `huber_loss()` | Want MAE-style robustness with smooth gradient near zero | Adds a delta hyperparameter to tune |

A safe default is MAE as the robust headline, RMSE for outlier sensitivity, and R-squared for cross-model comparison on the same target.

## Common pitfalls

**Three small mistakes account for most mae() failures.** Each one has a one-line fix.

The first is passing a factor column. yardstick rejects factor inputs because a factor implies classification, not regression. The fix is to cast to numeric before scoring:

```r title="Fix cast factor predictions to numeric"
bad <- tibble(obs = c(1.2, 3.4, 5.6), pred = factor(c("1", "3", "6")))
# mae(bad, obs, pred)  # would error
bad <- bad |>
  mutate(pred = as.numeric(as.character(pred)))
mae(bad, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mae     standard       0.333
```

The second pitfall is comparing MAE across different target transformations. An MAE of 0.2 on log-price and 30 on raw-price are not on the same scale. Back-transform predictions before scoring, or stick to one target representation.

The third pitfall is silent NA handling. With `na_rm = TRUE` (the default), yardstick drops rows where either column is missing, which changes the denominator. Pre-filter the prediction frame when comparing models that handle missingness differently.

[WARNING]
**MAE never tells you about error direction.** A model with MAE of 0.5 could be systematically over-predicting by 0.5, or evenly mixing 0.5 unders and overs. Pair MAE with a residual plot or `mean(estimate - truth)` to detect bias.

## Try it yourself

**Try it:** Use the built-in `solubility_test` data. Add +5 to the first prediction, then compute both MAE and RMSE on the perturbed frame. Bind the two results into a single comparison tibble and save it to `ex_mae_vs_rmse`.

```r title="Your turn MAE versus RMSE with one outlier"
library(yardstick)
library(dplyr)
data("solubility_test")

# Try it: compare MAE and RMSE after injecting one outlier
ex_mae_vs_rmse <- # your code here

ex_mae_vs_rmse
#> Expected: 2 rows, one per metric
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
spike <- solubility_test |>
  mutate(prediction = if_else(row_number() == 1, prediction + 5, prediction))

ex_mae_vs_rmse <- bind_rows(
  mae(spike, solubility, prediction),
  rmse(spike, solubility, prediction)
)
ex_mae_vs_rmse
#> # A tibble: 2 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mae     standard       0.540
#> 2 rmse    standard       0.776
```

**Explanation:** A single +5 outlier moves MAE only slightly because absolute errors are averaged linearly, while RMSE jumps because squared residuals amplify the spike. The size of the gap is a quick diagnostic for tail-heavy errors.

</details>

## Related yardstick metrics

**mae() is one entry in the yardstick numeric-metric family.** Reach for these neighbors when MAE alone is not enough:

- `rmse()` for an error in outcome units that punishes large misses
- `mape()` for percentage error reporting to non-technical stakeholders
- `rsq()` for a unit-free 0-to-1 goodness-of-fit
- `mase()` for scale-free comparison across multiple time series
- `huber_loss()` for a metric that switches from MAE-style to RMSE-style at a threshold
- `metrics()` to compute several regression scores in a single call

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good MAE value?**

There is no universal threshold. MAE is in the units of your outcome, so a "good" value depends on the spread of that outcome. Compare MAE against the standard deviation or interquartile range of the truth column: if MAE is much smaller, the model is adding signal; if it is close, the model is barely better than predicting the median. Always interpret alongside `rsq()` and a residual plot.

**How is mae() different from mean(abs(y - yhat))?**

They return the same number. yardstick wraps the formula in a function that validates inputs, handles missing values, supports `case_weights`, and returns a tidy tibble that integrates with `metrics()` and `group_by()`. Use mae() everywhere for consistency with the tidymodels workflow.

**Can mae() handle case weights?**

Yes. Pass a `case_weights` column to mae(). Common uses are survey weights, sample weights produced by `parsnip::fit()`, or importance weights when some rows matter more than others. Weights must be non-negative; the function returns a weighted average of |residual| in the same units as the outcome.

**Why does mae() return a tibble instead of a number?**

The tidy return shape is the yardstick convention. Every metric returns the same three columns: `.metric`, `.estimator`, `.estimate`. That uniformity lets you `bind_rows()` calls or pipe into `group_by()` with no reshape step. Call `mae_vec()` when you only need the scalar.

## Summary

**mae() is the outlier-robust scorecard in yardstick's regression family.** Use it as the headline when residuals are heavy-tailed, partner it with `rmse()` to expose how much outliers move the number, and switch to `mae_vec()` when you need a scalar. Combined with `group_by()` it scales to any resampling scheme, and with `metrics()` it produces a clean multi-metric report.
