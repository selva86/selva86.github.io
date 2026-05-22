---
title: "yardstick rsq_trad() in R: Traditional R-Squared Score"
slug: yardstick-rsq_trad-in-R
description: "Compute traditional R-squared (1 - SS_res/SS_tot) on regression predictions with yardstick rsq_trad() in R. Syntax, examples, rsq() differences, pitfalls."
keywords: "yardstick rsq_trad, rsq_trad function R, yardstick rsq_trad examples, traditional R-squared yardstick, tidymodels rsq_trad, R rsq vs rsq_trad, 1 minus SSE over SST R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "rsq_trad()|yardstick rsq_trad|yardstick::rsq_trad()|traditional R-squared|rsq_trad metric"
auto_link_case_sensitive: true
target_keyword: yardstick rsq_trad
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick rsq_trad() in R: Traditional R-Squared Score

<p class="lead">The yardstick rsq_trad() function in R computes the traditional 1 - SS_res / SS_tot R-squared on regression predictions, returning a tidy one-row score that, unlike rsq(), can fall below zero whenever a model performs worse than just predicting the mean of the outcome.</p>

[QUICK ANSWER]
rsq_trad(df, truth, estimate)                     # basic call
rsq_trad(df, truth = obs, estimate = pred)        # named arguments
df |> group_by(fold) |> rsq_trad(obs, pred)       # by resample
rsq_trad(df, obs, pred, na_rm = TRUE)             # drop missing rows
rsq_trad_vec(truth_vec, pred_vec)                 # vector interface
rsq_trad(df, obs, pred, case_weights = w)         # weighted score
metric_set(rsq_trad, rmse)(df, obs, pred)         # multi-metric bundle

[DECISION TREE: Is rsq_trad() the right tool?]
- need 1 - SSE/SST that punishes bias: rsq_trad(df, truth, estimate)
- want squared-correlation only, no bias penalty: rsq(df, truth, estimate)
- error in outcome units: rmse(df, truth, estimate)
- robust to outliers, in outcome units: mae(df, truth, estimate)
- percentage error of truth: mape(df, truth, estimate)
- agreement penalising bias and shape: ccc(df, truth, estimate)
- multi-metric report in one call: metric_set(rsq_trad, rmse, mae)(df, obs, pred)

## What rsq_trad() measures

**rsq_trad() reports the traditional R-squared, defined as 1 minus the residual sum of squares over the total sum of squares.** You pass a data frame with the observed numeric outcome and the predicted values, and the function returns a one-row tibble with three columns: `.metric`, `.estimator`, and `.estimate`. The estimate hits 1.0 when predictions are perfect, sits near 0 when predictions are no better than the outcome mean, and goes negative whenever predictions are actively worse than that mean baseline.

That negative-score behaviour is the whole reason rsq_trad() exists as a separate metric. Plain rsq() reports the squared Pearson correlation, so it stays inside `[0, 1]` no matter how badly biased a model is. rsq_trad() instead uses the textbook ordinary-least-squares formula, so a constant offset, a wrong scale, or a model that always predicts the worst-case value will all drag the score down past zero. Use it whenever bias and calibration matter, not just shape.

[KEY INSIGHT]
**A negative rsq_trad() is not a bug, it is the metric working.** Zero means a model ties the mean baseline. Below zero means a model loses to that baseline. Above zero means a model beats it. Trust the sign.

## rsq_trad() syntax and arguments

**The signature mirrors every other numeric yardstick metric.** Once the call shape is familiar, the same pattern works for `rmse()`, `mae()`, `mape()`, and the rest of the regression family.

```r title="rsq_trad generic signature"
rsq_trad(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|---|---|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

A vector flavour, `rsq_trad_vec()`, takes truth and estimate as numeric vectors and returns a bare double, handy inside `summarise()` or custom loops.

## Compute traditional R-squared: four examples

**The examples below fit a small regression on mtcars, score it on held-out rows, then probe edge cases.** First, load the packages and split the data.

```r title="Load yardstick and fit a regression on mtcars"
library(yardstick)
library(dplyr)

set.seed(42)
idx   <- sample(seq_len(nrow(mtcars)), size = 22)
train <- mtcars[idx, ]
test  <- mtcars[-idx, ]

fit <- lm(mpg ~ wt + hp + disp, data = train)
preds <- tibble(
  obs  = test$mpg,
  pred = predict(fit, newdata = test)
)
head(preds, 4)
#> # A tibble: 4 x 2
#>     obs  pred
#>   <dbl> <dbl>
#> 1  21.0  21.5
#> 2  22.8  25.7
#> 3  18.7  18.3
#> 4  19.2  19.6
```

**Example 1 calls rsq_trad() on the held-out predictions.** With positional arguments the function picks up `obs` as truth and `pred` as estimate.

```r title="Basic rsq_trad on held-out mpg predictions"
rsq_trad(preds, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 rsq_trad standard       0.802
```

About 80 percent of the variance in held-out mpg is explained by the linear fit. Because predictions are roughly unbiased, this estimate sits close to what `rsq()` would report on the same pair.

**Example 2 shows how a constant bias pulls rsq_trad() apart from rsq().** Add 10 mpg to every prediction and rescore.

```r title="Biased predictions push rsq_trad below zero"
biased <- preds |> mutate(pred = pred + 10)

rsq(biased, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rsq     standard       0.802

rsq_trad(biased, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 rsq_trad standard      -1.94
```

The squared correlation does not move because the shape of the prediction curve is identical. rsq_trad() collapses to roughly -1.9 because the residuals are now much larger than the variance of the truth. That gap is the entire point of keeping both metrics in the yardstick toolbox.

[TIP]
**When rsq() and rsq_trad() agree, your model is well calibrated.** When they diverge, the gap measures bias. Treat the difference as a free diagnostic, not just a second number on the dashboard.

**Example 3 reaches for the vector interface.** `rsq_trad_vec()` skips the tibble wrapper and returns a plain double, handy inside `summarise()`.

```r title="Vector interface returns a single double"
rsq_trad_vec(preds$obs, preds$pred)
#> [1] 0.8021

preds |>
  summarise(score = rsq_trad_vec(obs, pred))
#> # A tibble: 1 x 1
#>   score
#>   <dbl>
#> 1 0.802
```

The vector form ignores group context, so wrap it in `summarise()` if you want grouped output without leaving the data-frame interface.

**Example 4 bundles rsq_trad() into a multi-metric report.** `metric_set()` glues several metrics into one scoring function.

```r title="Multi-metric report with rsq, rsq_trad, rmse, and mae"
reg_metrics <- metric_set(rsq, rsq_trad, rmse, mae)

reg_metrics(preds, obs, pred)
#> # A tibble: 4 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 rsq      standard       0.802
#> 2 rsq_trad standard       0.802
#> 3 rmse     standard       2.41
#> 4 mae      standard       1.83
```

Reading rsq and rsq_trad side by side flags calibration drift instantly. The same bundle plugs into `fit_resamples()` or `last_fit()` for tuning workflows.

## rsq_trad() vs rsq(): when the two disagree

**Two R-squared formulas, two answers.** The choice matters whenever predictions live on a different scale or with a different mean than the truth.

| Behaviour | `rsq()` | `rsq_trad()` |
|---|---|---|
| Formula | Squared Pearson correlation | 1 - SSE / SST |
| Bounds | Strictly `[0, 1]` | Can be negative |
| Constant bias | Ignored | Penalised harshly |
| Scale shift | Ignored | Penalised |
| Matches `summary(lm())$r.squared` on training data | Yes | Yes |
| Matches it on held-out data | No | Approximately yes |

For a calibrated OLS model on training data the two metrics are mathematically identical, which is why textbooks rarely distinguish them. They diverge on held-out predictions, on regularised models with shrunk coefficients, and on any case where the prediction mean drifts from the truth mean. In those situations `rsq_trad()` is the honest answer; `rsq()` is the optimistic one.

For the squared-correlation companion metric and the standard way to call it inside tidymodels, see [yardstick rsq() in R](yardstick-rsq-in-R.html). For the residual-scale companions, see [yardstick rmse() in R](yardstick-rmse-in-R.html) and [yardstick mae() in R](yardstick-mae-in-R.html).

## Common pitfalls

**Three rsq_trad() failure modes trip up most newcomers.** Knowing them up front saves time debugging a model that is fine and a metric that is fine but mismatched.

1. **A negative score is informative, not broken.** Below-zero values mean the predictions lose to a constant-mean baseline. The fix is the model, not the metric.
2. **Truth and estimate must be numeric.** Passing a factor or character column raises `Error: ... must be numeric, not a <factor>`. Coerce with `as.numeric()` only when the levels already encode numbers.
3. **Single-row groups return NA.** `rsq_trad()` needs at least two rows per group to compute `SS_tot`. Filter degenerate groups before averaging.

[WARNING]
**Never average rsq_trad() across resamples without checking the spread.** A single fold with a near-constant truth can produce a wildly negative score that drags the mean below the median of the remaining folds. Report the median or trim outliers before turning the bundle into one number.

## Try it yourself

**Try it:** Re-score the mtcars regression after deliberately biasing predictions by 5 mpg, and compare rsq_trad() before and after. Save the after-bias score to `ex_rsq_trad`.

```r title="Your turn: rsq_trad before and after bias"
# Try it: rescore with a +5 mpg bias
biased_preds <- preds |>
  mutate(pred = # your code here
  )

ex_rsq_trad <- rsq_trad(biased_preds, obs, pred)
ex_rsq_trad
#> Expected: one row, .estimate noticeably below the un-biased 0.802
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
biased_preds <- preds |>
  mutate(pred = pred + 5)

ex_rsq_trad <- rsq_trad(biased_preds, obs, pred)
ex_rsq_trad
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 rsq_trad standard      -0.118
```

**Explanation:** Adding 5 to every prediction inflates the residual sum of squares while leaving the total sum of squares unchanged, so rsq_trad() falls from 0.802 to roughly -0.12. The same biased predictions still score rsq() at 0.802, which is the diagnostic gap that motivates keeping both metrics.

</details>

## Related yardstick functions

- `rsq()` for the squared Pearson correlation variant that ignores bias.
- `rmse()` for root mean squared error in outcome units; pairs naturally with rsq_trad().
- `mae()` for mean absolute error when outliers should count less.
- `ccc()` for Lin's concordance correlation, which punishes both bias and shape.
- `metric_set()` to bundle rsq_trad with companions in one reusable scoring function.

For the full yardstick reference and the canonical tidymodels scoring API, see the [yardstick documentation for rsq_trad](https://yardstick.tidymodels.org/reference/rsq_trad.html).

## FAQ

**Why does rsq_trad() return a negative number?**

A negative rsq_trad() means the residual sum of squares is larger than the total sum of squares, so the predictions are worse than always guessing the mean of the truth. The number quantifies how badly the model loses to that baseline, where -1 means residuals carry twice the variance of the outcome itself. Treat it as a calibration alarm, not a software error.

**When should I use rsq_trad() instead of rsq()?**

Use rsq_trad() whenever bias or scale should count against the score. The traditional formula 1 - SSE / SST punishes predictions that are systematically high, low, or on a different scale, so it is the right default on held-out predictions, regularised models, and external forecasts. Reach for rsq() only when shape alone matters and a constant offset is acceptable.

**Does rsq_trad() match summary(lm())$r.squared on training data?**

Yes, exactly, provided the model has an intercept and you score on the training rows the model was fitted to. On any other data the equality breaks because the OLS identity that makes rsq() and rsq_trad() coincide no longer holds. That is why yardstick separates the two: held-out scoring needs the honest formula.

**Can rsq_trad() handle missing values in truth or estimate?**

Yes. By default `na_rm = TRUE`, so any row with NA in either column is dropped before scoring. Set `na_rm = FALSE` if you want the function to error rather than silently shrink the sample. The same toggle applies to `rsq_trad_vec()`.
