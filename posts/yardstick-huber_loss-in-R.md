---
title: "yardstick huber_loss() in R: Robust Regression Loss"
slug: yardstick-huber_loss-in-R
description: "Use yardstick huber_loss() in R for a quadratic-to-linear regression loss that smooths over outliers. See the delta argument, syntax, examples, and pitfalls."
keywords: "yardstick huber_loss, huber_loss function R, yardstick huber_loss examples, huber loss R, tidymodels huber loss, robust regression loss, huber metric R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: huber_loss()|yardstick huber_loss|yardstick::huber_loss()|huber loss|huber loss metric
auto_link_case_sensitive: true
target_keyword: yardstick huber_loss
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick huber_loss() in R: Robust Regression Loss

<p class="lead">The yardstick huber_loss() function in R scores a regression model with a loss that is squared for small residuals and linear for large ones, giving you the gradient behaviour of RMSE near the centre and the outlier tolerance of MAE in the tail.</p>

[QUICK ANSWER]
huber_loss(df, truth, estimate)                       # default delta = 1
huber_loss(df, truth = obs, estimate = pred)          # named arguments
huber_loss(df, solubility, prediction, delta = 0.5)   # tighter quadratic zone
df |> group_by(fold) |> huber_loss(obs, pred)         # by resample
huber_loss(df, obs, pred, na_rm = TRUE)               # drop missing rows
huber_loss_vec(truth_vec, pred_vec, delta = 1)        # vector interface
huber_loss(df, obs, pred, case_weights = w)           # weighted Huber

[DECISION TREE: Is huber_loss() the right tool?]
- robust quadratic-linear loss for scoring or training: huber_loss(df, truth, estimate)
- pure squared error in outcome units: rmse(df, truth, estimate)
- pure absolute error, fully outlier-robust: mae(df, truth, estimate)
- smooth twice-differentiable variant for optimisation: huber_loss_pseudo(df, truth, estimate)
- percentage error for stakeholder reports: mape(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)
- predicting classes, not numbers: accuracy(df, truth, estimate)

## What huber_loss() measures

**huber_loss() blends squared and absolute error using a single threshold delta.** You pass a data frame with the observed numeric outcome, the predicted values, and an optional `delta` (default 1). For each row the function applies `0.5 * residual^2` when the absolute residual is below delta, and `delta * (abs(residual) , 0.5 * delta)` above it. The mean of those per-row losses lands in a one-row tibble with `.metric`, `.estimator`, and `.estimate`.

The two pieces meet smoothly at the threshold, so the loss has a continuous first derivative, which is what gradient-based learners want. The linear tail means a single 50-unit outlier no longer dominates the score the way it does for RMSE. Tune `delta` to set how many outcome units count as "normal noise" before the linear penalty kicks in.

[KEY INSIGHT]
**Huber loss is a hybrid, not a unit.** Unlike `mae()` or `rmse()`, which report errors on the outcome scale, huber_loss returns a quantity whose interpretation depends on `delta`. Compare huber_loss values only across models scored with the same delta on the same target.

## huber_loss() syntax and arguments

**The signature follows the yardstick numeric-metric convention with one extra parameter.** Once you understand `delta`, the rest matches `rmse()`, `mae()`, and the related regression scorers.

```r title="huber_loss generic signature"
huber_loss(data, truth, estimate, delta = 1, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `delta` | Positive threshold where the loss switches from quadratic to linear. Default 1. |
| `na_rm` | If `TRUE`, drop rows with missing truth or estimate before scoring. |
| `case_weights` | Optional column of non-negative row weights for survey or importance-weighted data. |

Truth and estimate must both be numeric. Factor, character, or logical inputs error out. Use `accuracy()` or `roc_auc()` for classifiers.

## Score regression models: four examples

**The examples below use yardstick's built-in solubility_test data.** First, load the package and inspect a few rows of the prediction set.

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

**Example 1 calls huber_loss() with positional arguments and the default delta.** Truth and estimate are picked up by position, and the tidy summary lands in three columns.

```r title="Basic huber_loss on solubility predictions"
huber_loss(solubility_test, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric    .estimator .estimate
#>   <chr>      <chr>          <dbl>
#> 1 huber_loss standard       0.221
```

The `.estimator` column reports `standard` because Huber has no multiclass variant. The estimate of 0.221 is in log-solubility-loss units at delta = 1.

**Example 2 varies delta to see how the loss changes shape.** Small delta acts like MAE; large delta acts like half the MSE.

```r title="Compare huber_loss at three delta values"
bind_rows(
  huber_loss(solubility_test, solubility, prediction, delta = 0.25),
  huber_loss(solubility_test, solubility, prediction, delta = 1.00),
  huber_loss(solubility_test, solubility, prediction, delta = 4.00)
) |>
  mutate(delta = c(0.25, 1.00, 4.00)) |>
  select(delta, .estimate)
#> # A tibble: 3 x 2
#>   delta .estimate
#>   <dbl>     <dbl>
#> 1  0.25     0.117
#> 2  1        0.221
#> 3  4        0.261
```

As delta grows, the quadratic zone widens and the score rises toward `0.5 * mean(residual^2)`. As delta shrinks, fewer rows sit in the quadratic zone and the score approaches `delta * mean(abs(residual))`.

**Example 3 groups scoring by resample fold.** With cross-validation predictions in one tibble, `group_by()` plus huber_loss returns one score per fold.

```r title="Per-fold huber_loss from a cross-validation tibble"
folded <- solubility_test |>
  mutate(fold = rep(paste0("fold", 1:5), length.out = n()))

folded |>
  group_by(fold) |>
  huber_loss(truth = solubility, estimate = prediction)
#> # A tibble: 5 x 4
#>   fold  .metric    .estimator .estimate
#>   <chr> <chr>      <chr>          <dbl>
#> 1 fold1 huber_loss standard       0.227
#> 2 fold2 huber_loss standard       0.217
#> 3 fold3 huber_loss standard       0.228
#> 4 fold4 huber_loss standard       0.215
#> 5 fold5 huber_loss standard       0.220
```

**Example 4 uses the vector interface for scalar output.** Inside `map()` calls or unit tests, `huber_loss_vec()` skips the tibble wrapping.

```r title="Vector interface returns a numeric scalar"
huber_loss_vec(solubility_test$solubility, solubility_test$prediction, delta = 1)
#> [1] 0.2210663
```

Use the vector form for bare numbers; stay with the data-frame form to bind, group, or plot scores alongside the rest of the yardstick family.

[TIP]
**Pair huber_loss with rmse and mae in one call.** `metrics(df, truth, estimate)` does not include huber_loss by default, but `metric_set(rmse, mae, huber_loss)` builds a custom scorer that returns all three in a tidy stack, ready for `ggplot()` or `gt()`.

## huber_loss() compared with related losses

**Pick a partner from the table when huber_loss alone is not enough.**

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `huber_loss()` | Outlier-tolerant training or scoring with a single tunable threshold | Score scale depends on delta, not directly the outcome unit |
| `rmse()` | Headline error in outcome units, large misses matter | Heavily penalises outliers |
| `mae()` | Outlier-robust error in outcome units | Treats a tiny miss and a small miss the same way |
| `huber_loss_pseudo()` | Twice-differentiable smooth approximation for gradient methods | Slightly different value than huber_loss for the same data |
| `mape()` | Percentage error reporting | Explodes when truth is near zero |
| `rsq()` | Unit-free goodness-of-fit | Can mask large systematic bias |

A common pattern is to train on huber_loss for robustness, then report rmse and mae for interpretation.

## Choosing delta

**Delta is the residual size at which the loss flips from quadratic to linear.** Two rules cover most cases. The quantile rule sets delta to the 0.9 quantile of held-out absolute residuals, so roughly 90 percent of points stay quadratic. The noise-scale rule sets `delta = 1.345 * sigma`, matching Huber's M-estimator efficiency under a Gaussian contamination model. Either way, score and train with the same delta; mixing values gives nonsense numbers.

## Common pitfalls

**Three small mistakes account for most huber_loss() failures.** Each has a one-line fix.

The first is comparing huber_loss values across different deltas. The loss scale shifts with delta, so a tighter delta produces a smaller number even when the model is unchanged. Lock delta before any comparison.

The second is treating huber_loss as an error in outcome units. RMSE of 0.7 on log-solubility means typical residuals near 0.7; a huber_loss of 0.22 is a delta-dependent blend of squared and linear pieces. Always cite delta next to the score.

The third is using a tiny positive delta like 1e-12. The loss collapses to almost zero and hides genuine error. Pick a delta near the typical residual magnitude.

[WARNING]
**Do not stack huber_loss scores trained on different targets.** The loss is sensitive to the target's units and scale. A huber_loss of 0.22 on log-solubility is not comparable to 0.22 on raw price. Back-transform predictions before scoring, or score each target separately.

## Try it yourself

**Try it:** Use the built-in `solubility_test` data. Compute Huber loss at three deltas: 0.5, 1, and 2. Stack the three results into a tibble with columns `delta` and `.estimate`. Save the stacked table to `ex_huber_delta`.

```r title="Your turn: Huber loss across deltas"
library(yardstick)
library(dplyr)
data("solubility_test")

# Try it: huber_loss across three deltas
ex_huber_delta <- # your code here

ex_huber_delta
#> Expected: 3 rows, one per delta
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_huber_delta <- bind_rows(
  huber_loss(solubility_test, solubility, prediction, delta = 0.5),
  huber_loss(solubility_test, solubility, prediction, delta = 1.0),
  huber_loss(solubility_test, solubility, prediction, delta = 2.0)
) |>
  mutate(delta = c(0.5, 1.0, 2.0)) |>
  select(delta, .estimate)
ex_huber_delta
#> # A tibble: 3 x 2
#>   delta .estimate
#>   <dbl>     <dbl>
#> 1   0.5     0.181
#> 2   1       0.221
#> 3   2       0.249
```

**Explanation:** Each call to huber_loss() returns a one-row tibble, and `bind_rows()` stacks the three calls into a single table. The estimate rises monotonically with delta because more residuals fall into the quadratic zone, where the squared term carries a higher cost than the linear tail.

</details>

## Related yardstick metrics

**huber_loss() sits among yardstick's regression scorers.** Reach for these when huber_loss alone is not enough:

- `huber_loss_pseudo()` for a smooth, twice-differentiable cousin
- `rmse()` for headline squared error in outcome units
- `mae()` for the fully outlier-robust absolute error
- `mape()` for percentage error reporting
- `rsq()` for unit-free goodness-of-fit
- `metric_set()` to bundle huber_loss with rmse and mae

For the full list, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good huber_loss value?**

There is no universal threshold. The score depends on both delta and the spread of your target, so a "good" value is one that beats a baseline model scored with the same delta. Always report huber_loss next to rmse and mae, and pin delta in the report.

**How is huber_loss() different from rmse() and mae()?**

RMSE squares every residual, so one big miss can dominate the score. MAE takes absolute values, so a 100-unit residual contributes 100, not 10,000. Huber sits between the two: residuals below delta are squared, residuals above delta are linear, combining RMSE-like gradients near zero with MAE-like outlier resistance in the tail.

**What is the difference between huber_loss() and huber_loss_pseudo()?**

`huber_loss()` is the piecewise function with a hard switch at delta. `huber_loss_pseudo()` uses `delta^2 * (sqrt(1 + (r / delta)^2) , 1)`, a smooth approximation that is twice differentiable everywhere. Pseudo-Huber is safer for gradient-based optimisers; the original Huber is fine for scoring.

**Can I weight rows when computing huber_loss?**

Yes. Pass a `case_weights` column to huber_loss() with non-negative row weights. Common uses are survey weights and importance weights from `parsnip::fit()`. The function returns the weighted mean of per-row Huber losses on the same delta-dependent scale.

## Summary

**huber_loss() is the robust middle ground between rmse() and mae().** Use it when you want squared-error gradients for typical points and absolute-error tolerance for outliers. Tune delta from the residual scale, and report it next to rmse and mae so readers can interpret the value in outcome units. Pair with `group_by()` for per-fold scoring and `metric_set()` to bundle it into a tidymodels workflow.
