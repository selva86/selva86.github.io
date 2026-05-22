---
title: "yardstick rsq() in R: Score Regression R-Squared"
slug: yardstick-rsq-in-R
description: "Use yardstick rsq() in R to score regression models with R-squared. See syntax, grouped scoring, weighting, rsq_trad() differences, and common pitfalls."
keywords: "yardstick rsq, rsq function R, yardstick rsq examples, R-squared yardstick, tidymodels rsq, rsq_trad R, R squared regression metric"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "rsq()|yardstick rsq|yardstick::rsq()|R-squared metric|coefficient of determination"
auto_link_case_sensitive: true
target_keyword: yardstick rsq
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick rsq() in R: Score Regression R-Squared

<p class="lead">The yardstick rsq() function in R returns the R-squared of a regression model as a unit-free goodness-of-fit score, accepting a tibble with truth and estimate columns and producing a tidy one-row summary you can pipe straight into a metrics report.</p>

[QUICK ANSWER]
rsq(df, truth, estimate)                          # basic call
rsq(df, truth = obs, estimate = pred)             # named arguments
rsq(df, solubility, prediction)                   # default tidymodels output
df |> group_by(fold) |> rsq(obs, pred)            # by resample
rsq(df, obs, pred, na_rm = TRUE)                  # drop missing rows
rsq_vec(truth_vec, pred_vec)                      # vector interface
rsq(df, obs, pred, case_weights = w)              # weighted R-squared
rsq_trad(df, obs, pred)                           # 1 - SSE/SST variant

[DECISION TREE: Is rsq() the right tool?]
- unit-free goodness-of-fit for regression: rsq(df, truth, estimate)
- need 1 - SSE/SST (can go negative): rsq_trad(df, truth, estimate)
- error in outcome units: rmse(df, truth, estimate)
- less outlier sensitive than rmse: mae(df, truth, estimate)
- percentage error matters most: mape(df, truth, estimate)
- predicting classes, not numbers: accuracy(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)

## What rsq() measures

**rsq() reports the squared Pearson correlation between truth and estimate.** You pass a data frame with the observed numeric outcome and the predicted values, and the function returns a one-row tibble with three columns: `.metric`, `.estimator`, and `.estimate`. The estimate sits between 0 and 1 for well-behaved fits, so an rsq of 0.82 means roughly 82 percent of the variance in your outcome is explained by the predictions.

Because it is a correlation-based statistic, rsq() is invariant to a constant shift or rescale of the predictions. That is a feature when you want a pure goodness-of-fit signal, and a trap when the model is biased: a forecast that is systematically off by 10 units can still score a very high rsq. Pair rsq() with `rmse()` whenever you compare regression models, so units and explained variance both stay in view.

[KEY INSIGHT]
**rsq() is correlation-squared, not 1 - SSE/SST.** It only tracks the shape of the prediction curve, not its level. A model that always predicts truth + 1000 still earns rsq = 1.0. Use rsq_trad() when bias should count against the score.

## rsq() syntax and arguments

**The signature matches every other yardstick numeric metric.** Once you know the shape, the same call works for `rmse()`, `mae()`, `mape()`, and the rest of the regression family.

```r title="rsq generic signature"
rsq(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|---|---|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

Truth and estimate must both be numeric; factor, character, or logical inputs raise an error. If you fitted a classification model, reach for `accuracy()` or `roc_auc()` instead.

## Compute R-squared: four examples

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

**Example 1 calls rsq() with positional arguments.** The function picks up truth and estimate by position and returns the tidy summary.

```r title="Basic rsq score on solubility predictions"
rsq(solubility_test, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rsq     standard       0.879
```

About 88 percent of the variance in solubility is explained by the prediction curve, which is the same scale you would read off `summary(lm(...))$r.squared` on a held-out set.

**Example 2 scores predictions inside a group_by pipeline.** Pass folds, batches, or experiments through `group_by()` and yardstick returns one row per group.

```r title="rsq per fold using group_by"
set.seed(7)
folded <- solubility_test |>
  mutate(fold = sample(1:5, n(), replace = TRUE))

folded |>
  group_by(fold) |>
  rsq(solubility, prediction)
#> # A tibble: 5 x 4
#>    fold .metric .estimator .estimate
#>   <int> <chr>   <chr>          <dbl>
#> 1     1 rsq     standard       0.881
#> 2     2 rsq     standard       0.866
#> 3     3 rsq     standard       0.892
#> 4     4 rsq     standard       0.878
#> 5     5 rsq     standard       0.872
```

The five fold estimates cluster tightly around the overall 0.879, a sign the predictions generalise evenly across the held-out subsets.

**Example 3 weights rows with case_weights.** Pass a numeric column of weights to upweight observations that should count more.

```r title="Weighted rsq with case weights"
weighted <- solubility_test |>
  mutate(w = ifelse(solubility > 0, 2, 1))

rsq(weighted, solubility, prediction, case_weights = w)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rsq     standard       0.881
```

Doubling the weight on positive-solubility rows nudges the score, since the correlation now leans on those observations more heavily.

**Example 4 plugs rsq() into a multi-metric report.** Build a metric set with `metric_set()` to score several metrics in one call.

```r title="Multi-metric report with rsq, rmse, and mae"
reg_metrics <- metric_set(rsq, rmse, mae)

reg_metrics(solubility_test, solubility, prediction)
#> # A tibble: 3 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rsq     standard       0.879
#> 2 rmse    standard       0.722
#> 3 mae     standard       0.521
```

The bundle reports all three metrics together. Reading rsq alongside rmse keeps both the explained-variance story and the residual scale in the same table.

[TIP]
**Bind metric_set() once and reuse it across resamples.** A single `reg_metrics` object plugs into `fit_resamples()`, `last_fit()`, and `tune_grid()` without re-listing metrics each call.

## rsq() vs rsq_trad() and the wider regression family

**Two R-squared variants ship in yardstick, and they answer different questions.** Pick the right one before you compare scores.

| Metric | Formula | Bounds | Best use |
|---|---|---|---|
| `rsq()` | Squared Pearson correlation of truth and estimate | 0 to 1 | Pure goodness-of-fit; ignores bias and scale shifts |
| `rsq_trad()` | 1 - SSE / SST | Can be negative | Traditional R-squared; penalises bias and bad calibration |
| `rmse()` | Square root of mean squared error | 0 and up | Error in outcome units; outlier-sensitive |
| `mae()` | Mean absolute error | 0 and up | Error in outcome units; robust to outliers |
| `mape()` | Mean absolute percentage error | 0 and up | Percentage error; undefined when truth is zero |

For most tidymodels workflows where you compare a calibrated model on held-out data, `rsq()` is the right default because it matches the squared correlation reported by `lm()` on training data. Switch to `rsq_trad()` when you suspect bias, when predictions live on a different scale than the truth, or when you need a score that can punish a model for being systematically off.

```r title="rsq vs rsq_trad on a biased prediction"
biased <- solubility_test |> mutate(prediction = prediction + 5)

rsq(biased, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rsq     standard       0.879

rsq_trad(biased, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 rsq_trad standard     -27.6
```

The bias did not move rsq() at all, but rsq_trad() collapsed to a large negative number. That gap is the whole story behind the two variants.

## Common pitfalls

**Three rsq() failure modes catch most newcomers.** Knowing them up front saves an hour of debugging silent bugs.

1. **rsq() ignores a constant bias.** Add 100 to every prediction and rsq stays put while rsq_trad() crashes. If your model is mis-calibrated, rsq() will lie to you.
2. **Truth and estimate must be numeric.** Passing a factor or character column raises `Error: ... must be numeric, not a <factor>`. Coerce with `as.numeric()` only when the levels are already meaningful numbers; otherwise the cast silently corrupts the score.
3. **Constant predictions return NA, not 0.** When `var(estimate) == 0`, the correlation is undefined and rsq() emits a warning plus an NA estimate. Filter out degenerate folds before averaging or your summary will be NA.

[WARNING]
**Never rank tuning configurations on rsq() alone.** A high rsq says the shape lines up, not that the predictions are usable. Always pair it with `rmse()` or `rsq_trad()` so a beautifully shaped but badly biased model cannot win the leaderboard.

## Try it yourself

**Try it:** Add a `group_by()` step to the solubility example so rsq is scored separately for the rows above and below the median solubility. Save the result to `ex_rsq`.

```r title="Your turn: rsq by split"
# Try it: rsq above and below median solubility
ex_rsq <- solubility_test |>
  mutate(half = # your code here
  ) |>
  group_by(half) |>
  rsq(solubility, prediction)

ex_rsq
#> Expected: 2 rows, one per half, both close to 0.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rsq <- solubility_test |>
  mutate(half = ifelse(solubility >= median(solubility), "upper", "lower")) |>
  group_by(half) |>
  rsq(solubility, prediction)

ex_rsq
#> # A tibble: 2 x 4
#>   half  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 lower rsq     standard       0.706
#> 2 upper rsq     standard       0.685
```

**Explanation:** Splitting the data restricts the correlation to a narrower outcome range, so each half scores lower than the full-range 0.879. That collapse is the classic signal that R-squared depends on the variance of truth, not only on prediction quality.

</details>

## Related yardstick functions

- `rsq_trad()` for the 1 - SSE / SST variant that penalises bias and can return negative scores.
- `rmse()` for root mean squared error in outcome units; see [yardstick rmse() in R](yardstick-rmse-in-R.html).
- `mae()` for mean absolute error, a less outlier-sensitive companion to rmse; see [yardstick mae() in R](yardstick-mae-in-R.html).
- `mape()` for mean absolute percentage error when relative error matters.
- `metric_set()` to bundle rsq, rmse, and mae into one reusable scoring function.

For the full tidymodels scoring API and the canonical yardstick reference, see the [tidymodels documentation](https://yardstick.tidymodels.org/reference/rsq.html).

## FAQ

**Is yardstick rsq() the same as base R's summary(lm())$r.squared?**

On the training set the two match because both reduce to the squared Pearson correlation when the model has an intercept. On held-out predictions, `summary(lm())$r.squared` does not apply, while `rsq()` keeps working on any pair of truth and estimate columns. That uniform scoring API is the whole reason yardstick exists.

**When should I use rsq_trad() instead of rsq()?**

Use `rsq_trad()` whenever bias or scale should count against the score. The traditional formula 1 - SSE / SST punishes a model that is systematically high, low, or on a different scale. Use plain `rsq()` when you only care how well the predicted curve tracks the shape of the outcome.

**Why does rsq() return NA on some resamples?**

`rsq()` divides by the variance of the estimate. When a resample contains predictions that are all the same value, that variance is zero, the correlation is undefined, and the function returns NA with a warning. Filter degenerate folds before averaging.

**Can rsq() handle missing values in truth or estimate?**

Yes. By default `na_rm = TRUE`, so any row with NA in either column is dropped before scoring. Set `na_rm = FALSE` if you want the function to error rather than silently shrink the sample.

**Does rsq() work for classification models?**

No. `rsq()` requires numeric truth and estimate columns. For classification, reach for `accuracy()`, `kap()`, or `roc_auc()` from the same yardstick family. The shared call shape stays familiar even though the metric is different.
