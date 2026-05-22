---
title: "yardstick mape() in R: Scale-Free Percentage Error"
slug: yardstick-mape-in-R
description: "Use yardstick mape() in R to report scale-free percentage error. See syntax, four examples, per-fold scoring, the near-zero pitfall, and the asymmetry warning."
keywords: "yardstick mape, mape function R, yardstick mape examples, mean absolute percentage error R, tidymodels mape, mape metric R, scale-free regression error R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: mape()|yardstick mape|yardstick::mape()|mean absolute percentage error|mape metric
auto_link_case_sensitive: true
target_keyword: yardstick mape
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick mape() in R: Scale-Free Percentage Error

<p class="lead">The yardstick mape() function in R returns the mean absolute percentage error of a regression model, dividing each absolute residual by the truth value and averaging, so the result reads as a single percentage that compares cleanly across targets, units, and series.</p>

[QUICK ANSWER]
mape(df, truth, estimate)                          # basic call
mape(df, truth = obs, estimate = pred)             # named arguments
mape(df, sales, forecast)                          # forecast columns
df |> group_by(series) |> mape(obs, pred)          # by group or series
mape(df, obs, pred, na_rm = TRUE)                  # drop missing rows
mape_vec(truth_vec, pred_vec)                      # vector interface
mape(df, obs, pred, case_weights = w)              # weighted MAPE

[DECISION TREE: Is mape() the right tool?]
- relative error as a single percent: mape(df, truth, estimate)
- truth contains zero or near-zero values: mae(df, truth, estimate)
- error in raw outcome units, robust to outliers: mae(df, truth, estimate)
- punish large misses harder than small ones: rmse(df, truth, estimate)
- compare error across many time series: mase(df, truth, estimate)
- symmetric percentage that handles small truth: smape(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)

## What mape() measures

**mape() averages the absolute percentage residual across every row.** You pass a data frame with the observed numeric outcome and the predicted values, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate reads as a percentage: a MAPE of 12 means typical predictions miss by 12 percent of the truth.

Because each residual is normalised by truth, MAPE strips out the scale of the outcome. A miss of $5 on a $100 invoice scores the same 5 percent as a miss of $50 on a $1,000 invoice, which makes MAPE the standard headline when one number has to cover products, regions, or series.

[KEY INSIGHT]
**MAPE is the average of |residual| divided by truth, not |residual| alone.** That single division makes the metric scale-free and intuitive, but it also explodes when truth is near zero and punishes over-predictions harder than under-predictions. Every MAPE pitfall traces back to that one division.

## mape() syntax and arguments

**The signature matches every other yardstick numeric metric.** Once you know the shape, the same call works for `mae()`, `rmse()`, `smape()`, and the rest of the regression family.

```r title="mape generic signature"
mape(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

Truth and estimate must both be numeric. The output is already scaled as a percent (so 12.3 means 12.3 percent), not a 0-to-1 ratio.

## MAPE in action: four worked examples

**The examples below fit a simple lm on mtcars and score the in-sample predictions.** Load the package and build a small prediction frame first.

```r title="Load yardstick and build prediction frame"
library(yardstick)
library(dplyr)

set.seed(42)
fit <- lm(mpg ~ wt + cyl, data = mtcars)
preds <- tibble(
  actual = mtcars$mpg,
  pred   = predict(fit, mtcars)
)
head(preds, 4)
#> # A tibble: 4 x 2
#>   actual  pred
#>    <dbl> <dbl>
#> 1   21    22.3
#> 2   21    21.5
#> 3   22.8  26.3
#> 4   21.4  20.4
```

**Example 1 calls mape() with positional arguments.** The function locates truth and estimate by position and returns the tidy summary.

```r title="Basic MAPE on mtcars predictions"
mape(preds, actual, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mape    standard        11.9
```

The `.estimator` is `standard` because MAPE has no binary or multiclass variant. The 11.9 reads as 11.9 percent: predictions are off by about 12 percent of true mpg on average, and that number compares cleanly across any other regression target.

**Example 2 shows why MAPE explodes near zero.** Adding a row where truth is 0.01 dominates the average because the denominator is tiny.

```r title="MAPE explodes when truth approaches zero"
risky <- bind_rows(
  preds,
  tibble(actual = 0.01, pred = 0.50)
)
mape(risky, actual, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mape    standard       160. 
```

One row sent the headline from 11.9 to 160. Whenever the outcome can be zero, near-zero, or change sign, MAPE becomes unreliable, and the fix is filtering, capping, or switching to `smape()` or `mae()`.

**Example 3 groups scoring across folds or product lines.** When cross-validation predictions or per-segment forecasts live in one tibble, `group_by()` plus mape returns one percentage per group.

```r title="Per-fold MAPE from a single prediction tibble"
folded <- preds |>
  mutate(fold = rep(paste0("fold", 1:4), length.out = n()))

folded |>
  group_by(fold) |>
  mape(truth = actual, estimate = pred)
#> # A tibble: 4 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 mape    standard        11.4
#> 2 fold2 mape    standard        12.6
#> 3 fold3 mape    standard        11.1
#> 4 fold4 mape    standard        12.6
```

**Example 4 uses the vector interface for quick checks.** Inside `map()` calls or unit tests, `mape_vec()` returns a plain scalar instead of a one-row tibble.

```r title="Vector interface returns a numeric scalar"
mape_vec(preds$actual, preds$pred)
#> [1] 11.9332
```

Use the vector form for scalar thresholds or unit tests; otherwise stay with the data-frame form so you can bind, group, or plot.

[TIP]
**Inspect the truth distribution before reporting MAPE.** If `min(abs(truth))` is small relative to its mean, MAPE is fragile. A two-line summary tells you whether the headline will be stable across resamples.

## When to pick mape() over its neighbors

**MAPE is the metric you reach for when stakeholders ask "how far off, in percent?".** The table below picks the right neighbor when MAPE is not the right fit.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `mape()` | Single-percent error, scale-free across targets | Explodes when truth is near zero; asymmetric |
| `smape()` | Symmetric percentage error, more stable near zero | Loses the simple "percent of truth" reading |
| `mae()` | Outlier-robust error in outcome units | Not comparable across targets with different scales |
| `rmse()` | Penalises large misses harder than small ones | Sensitive to outliers, not scale-free |
| `mase()` | Scale-free comparison across many time series | Requires a naive baseline forecast |
| `rsq()` | Unit-free 0-to-1 goodness-of-fit | Can mask large systematic bias |

A safe default is MAPE as the headline, MAE as the engineering cross-check, and `mase()` when the report covers several series at different scales.

## Common pitfalls

**Three small mistakes account for most mape() failures.** Each one has a one-line fix.

The first is computing MAPE when truth contains zero or near-zero values. Division by a tiny number produces a single row that dominates the average and a metric that swings wildly across resamples. Filter, cap, or switch to `smape()`:

```r title="Filter near-zero truths before scoring MAPE"
clean <- preds |>
  filter(abs(actual) > 1)
mape(clean, actual, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mape    standard        11.9
```

The second pitfall is treating MAPE as symmetric. An under-prediction caps at 100 percent error (predict zero), while an over-prediction is unbounded, so two models with the same RMSE can score very differently on MAPE. Pair MAPE with `mean(estimate - truth)` to expose the asymmetry.

The third pitfall is mixing transformed and raw targets. Log-space residuals are not percentages of the original scale, so back-transform predictions before calling mape(), or stay in log space and use `mae()` instead.

[WARNING]
**MAPE rewards systematic under-prediction.** Because |truth - estimate| / truth is capped at 1 when estimate is 0 but unbounded above, a model that consistently under-predicts can score better than an unbiased one. If MAPE matters for a business decision, audit `mean(estimate - truth)` before trusting the headline.

## Try it yourself

**Try it:** Use the mtcars `lm` fit from above. Build a small forecast tibble with one row where `actual = 0.5` and `pred = 0.6`, append it to `preds`, and compute both MAPE and MAE. Save the comparison to `ex_mape_vs_mae`.

```r title="Your turn: see how MAPE reacts to a small truth"
library(yardstick)
library(dplyr)

# Try it: compare MAPE and MAE after appending a small-truth row
ex_mape_vs_mae <- # your code here

ex_mape_vs_mae
#> Expected: 2 rows, one per metric
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
risky <- bind_rows(
  preds,
  tibble(actual = 0.5, pred = 0.6)
)

ex_mape_vs_mae <- bind_rows(
  mape(risky, actual, pred),
  mae(risky, actual, pred)
)
ex_mape_vs_mae
#> # A tibble: 2 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mape    standard       12.4 
#> 2 mae     standard        2.49
```

**Explanation:** One row with a small truth nudges MAPE upward (from 11.9 to 12.4) while MAE barely moves, because MAE never divides by truth. The gap is a quick diagnostic for how exposed a forecast is to small-denominator outliers.

</details>

## Related yardstick metrics

**mape() is one entry in the yardstick numeric-metric family.** Reach for these neighbors when MAPE is not enough:

- `smape()` for a symmetric percentage error that survives small truths
- `mae()` for an outlier-robust error in the outcome's original units
- `rmse()` for a penalty that punishes large misses harder than small ones
- `mase()` for scale-free comparison across multiple time series
- `rsq()` for a unit-free 0-to-1 goodness-of-fit score
- `metrics()` to compute several regression scores in a single call

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good MAPE value?**

Forecasting practice gives rough bands: below 10 percent is highly accurate, 10 to 20 percent is good, 20 to 50 percent is reasonable for noisy targets, and above 50 percent usually signals a problem. These bands assume well-behaved truth values; once the outcome can sit near zero, MAPE bands stop being meaningful and you should compare against `mae()`.

**Why does mape() return a percent and not a 0-to-1 ratio?**

yardstick follows the forecasting convention of expressing MAPE as a percentage. The output 12.3 means 12.3 percent. Multiply or divide by 100 if you need to match a tool that uses ratios, but most reporting templates expect the percent form. The same convention applies to `smape()`.

**How is mape() different from mean(abs((y - yhat) / y) * 100)?**

They return the same number for clean inputs. yardstick wraps the formula with input validation, NA handling, `case_weights` support, and a tidy tibble that integrates with `metrics()` and `group_by()`. Use mape() for consistency with the tidymodels workflow.

**Can MAPE be used with negative truth values?**

It can run, but the result is hard to interpret because the division uses raw truth. For data that crosses zero (returns, deltas, balances), use `mae()` for outcome-unit error or `smape()` for a percentage-style metric that handles sign changes more gracefully.

## Summary

**mape() is the scale-free percentage scorecard in yardstick's regression family.** Reach for it when one number has to compare performance across targets or series, pair it with `mae()` for a cross-check, and switch to `smape()` whenever truth can sit near zero. With `group_by()` it gives per-segment percentages, and with `metrics()` it slots into a multi-metric report.
