---
title: "yardstick smape() in R: Symmetric Percentage Error Metric"
slug: yardstick-smape-in-R
description: "Use yardstick smape() in R for a bounded, symmetric percentage error. See syntax, four worked examples, per-fold scoring, and how SMAPE differs from MAPE."
keywords: "yardstick smape, smape function R, yardstick smape examples, symmetric mean absolute percentage error R, tidymodels smape, smape metric R, bounded regression error R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: smape()|yardstick smape|yardstick::smape()|symmetric mean absolute percentage error|smape metric
auto_link_case_sensitive: true
target_keyword: yardstick smape
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick smape() in R: Symmetric Percentage Error Metric

<p class="lead">The yardstick smape() function in R returns the symmetric mean absolute percentage error of a regression model, dividing each absolute residual by the average of the truth and estimate, so the result is bounded near 0 to 200 percent and stays stable when the outcome sits near zero.</p>

[QUICK ANSWER]
smape(df, truth, estimate)                         # basic call
smape(df, truth = obs, estimate = pred)            # named arguments
smape(df, sales, forecast)                         # forecast columns
df |> group_by(series) |> smape(obs, pred)         # by group or series
smape(df, obs, pred, na_rm = TRUE)                 # drop missing rows
smape_vec(truth_vec, pred_vec)                     # vector interface
smape(df, obs, pred, case_weights = w)             # weighted SMAPE

[DECISION TREE: Is smape() the right tool?]
- symmetric percent error that stays bounded: smape(df, truth, estimate)
- simple percent-of-truth headline, truth far from zero: mape(df, truth, estimate)
- error in raw outcome units, no scaling: mae(df, truth, estimate)
- punish large misses harder than small ones: rmse(df, truth, estimate)
- compare forecast quality across many series: mase(df, truth, estimate)
- proportion of variance explained: rsq(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)

## What smape() measures

**smape() averages the absolute residual scaled by the half-sum of truth and estimate.** You pass a data frame with the observed numeric outcome and the predicted values, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate reads as a percent, and the value is bounded near 0 to 200 percent.

The denominator is `(|truth| + |estimate|) / 2`, not truth alone. That swap makes SMAPE symmetric, and a model predicting zero against a small positive truth no longer produces an unbounded percentage. The trade is that the result is no longer "percent of truth", so the business reading drifts away from MAPE's.

[KEY INSIGHT]
**SMAPE replaces division by truth with division by the average magnitude.** That single change bounds the metric, makes it symmetric to over and under-prediction, and stops near-zero truths from blowing up the headline. The trade is a less intuitive scale: 40 percent SMAPE does not mean predictions are off by 40 percent of the truth.

## smape() syntax and arguments

**The signature matches the rest of yardstick's numeric metrics.** Once you know the shape, the same call works for `mae()`, `rmse()`, `mape()`, and the rest of the regression family.

```r title="smape generic signature"
smape(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame holding the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

Both columns must be numeric. Output is scaled as a percent (22.4 means 22.4 percent) and can exceed 100 when one side of the pair is much larger than the other.

## SMAPE in action: four worked examples

**The examples fit a simple lm on mtcars and score in-sample predictions.** Build the prediction frame first.

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

**Example 1 calls smape() with positional arguments.** The function locates truth and estimate by position and returns the tidy summary.

```r title="Basic SMAPE on mtcars predictions"
smape(preds, actual, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 smape   standard        11.7
```

The `.estimator` is `standard` because SMAPE has no binary or multiclass variant. The 11.7 reads as 11.7 percent and sits close to MAPE on this dataset because truth values stay well away from zero, the regime where the two metrics agree.

**Example 2 shows what happens when truth approaches zero.** Adding a row where truth is 0.01 leaves SMAPE stable, where MAPE would spike.

```r title="SMAPE stays stable when truth is near zero"
risky <- bind_rows(
  preds,
  tibble(actual = 0.01, pred = 0.50)
)
smape(risky, actual, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 smape   standard        17.4
```

The headline moved from 11.7 to 17.4, not to 160 the way MAPE did on the same row. The bounded denominator absorbed the small truth instead of dividing by it.

**Example 3 groups scoring across folds or product lines.** When cross-validation predictions or per-segment forecasts live in one tibble, `group_by()` plus smape returns one percentage per group.

```r title="Per-fold SMAPE from a single prediction tibble"
folded <- preds |>
  mutate(fold = rep(paste0("fold", 1:4), length.out = n()))

folded |>
  group_by(fold) |>
  smape(truth = actual, estimate = pred)
#> # A tibble: 4 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 smape   standard        11.0
#> 2 fold2 smape   standard        12.5
#> 3 fold3 smape   standard        11.2
#> 4 fold4 smape   standard        12.1
```

**Example 4 uses the vector interface for quick checks.** Inside `map()` calls or unit tests, `smape_vec()` returns a plain scalar instead of a one-row tibble.

```r title="Vector interface returns a numeric scalar"
smape_vec(preds$actual, preds$pred)
#> [1] 11.7204
```

Use the vector form for scalar thresholds; otherwise stay with the data-frame form to bind, group, or plot.

[TIP]
**Report SMAPE alongside MAE when truth crosses zero.** SMAPE handles the small denominator gracefully, but MAE in outcome units anchors the magnitude. The pair gives reviewers a bounded percent and a unit-correct error in one glance.

## When to pick smape() over its neighbors

**SMAPE is the metric for percent error when truths sit near zero.** The table picks the right neighbor otherwise.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `smape()` | Bounded percent error stable near zero | Less intuitive than MAPE; rewards equal-magnitude misses oddly |
| `mape()` | Plain percent-of-truth headline, truth far from zero | Explodes near zero; asymmetric to under and over-prediction |
| `mae()` | Outlier-robust error in outcome units | Not comparable across targets with different scales |
| `rmse()` | Punishes large misses harder than small ones | Sensitive to outliers; not scale-free |
| `mase()` | Scale-free comparison across many time series | Requires a naive baseline forecast |
| `rsq()` | Unit-free 0-to-1 goodness-of-fit | Can mask large systematic bias |

A common pairing is SMAPE plus MAE: SMAPE for a bounded percent that survives small truths, MAE for raw error in the outcome's own units.

## Common pitfalls

**Three SMAPE mistakes show up repeatedly in forecasting reports.** Each has a one-line fix.

The first is reading SMAPE as "percent of truth". It is not. A SMAPE of 40 percent does not mean predictions are 40 percent off the actual value, because the denominator is the average of truth and estimate. Report SMAPE next to MAE so readers anchor on unit-correct error.

The second is treating SMAPE as fully symmetric. Swapping truth and estimate gives the same score, but constant under- and over-prediction of equal size still produce different scores when scale differs. Pair SMAPE with `mean(estimate - truth)` to expose direction bias.

The third is comparing SMAPE across tools. Some textbooks divide by `(|truth| + |estimate|)` instead of half that sum, which halves the headline. yardstick uses the bounded-near-200 percent convention; confirm the formula before copying values across tools.

```r title="Audit direction bias when reporting SMAPE"
bias <- mean(preds$pred - preds$actual)
smape_val <- smape_vec(preds$actual, preds$pred)
c(bias = bias, smape = smape_val)
#>    bias   smape 
#>  0.0000 11.7204
```

[WARNING]
**SMAPE can drift toward 200 percent when truth and estimate sign-flip.** If the outcome can be negative and the model predicts a positive (or vice versa), `|truth| + |estimate|` shrinks the denominator relative to the residual and the metric inflates. Inspect sign agreement before trusting a high SMAPE reading.

## Try it yourself

**Try it:** Use the mtcars `lm` fit from above. Build a small forecast tibble with one row where `actual = 0.5` and `pred = 0.6`, append it to `preds`, and compute both SMAPE and MAPE. Save the comparison to `ex_smape_vs_mape`.

```r title="Your turn: compare SMAPE and MAPE near zero"
library(yardstick)
library(dplyr)

# Try it: compare SMAPE and MAPE after appending a small-truth row
ex_smape_vs_mape <- # your code here

ex_smape_vs_mape
#> Expected: 2 rows, one per metric
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
risky <- bind_rows(
  preds,
  tibble(actual = 0.5, pred = 0.6)
)

ex_smape_vs_mape <- bind_rows(
  smape(risky, actual, pred),
  mape(risky, actual, pred)
)
ex_smape_vs_mape
#> # A tibble: 2 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 smape   standard       12.0 
#> 2 mape    standard       12.4
```

**Explanation:** One small-truth row barely moves SMAPE (11.7 to 12.0) while MAPE rises faster because it divides by the small truth directly.

</details>

## Related yardstick metrics

**smape() sits inside yardstick's regression family.** Reach for these neighbors when SMAPE is not the right fit:

- `mape()` for percent-of-truth when truths stay well away from zero
- `mae()` for outlier-robust error in the outcome's units
- `rmse()` to punish large misses harder than small ones
- `mase()` for scale-free comparison across many series
- `rsq()` for a unit-free 0-to-1 goodness-of-fit score
- `metrics()` to compute several scores in one call

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good SMAPE value?**

Bands are looser than for MAPE because SMAPE is bounded near 200 percent. Roughly: below 10 percent is excellent, 10 to 30 percent is good for noisy targets, 30 to 80 percent is workable, and above 100 percent usually signals sign-flips or scale misses. Anchor SMAPE with MAE for unit-correct context.

**How is smape() different from mape()?**

MAPE divides each absolute residual by truth, so a small truth blows up the headline and over-prediction stays unbounded. SMAPE divides by the average of `|truth|` and `|estimate|`, which bounds the metric and keeps it stable when truth approaches zero. Use SMAPE when truths cross or sit near zero; use MAPE for a cleaner percent-of-truth reading when truths stay well away from zero.

**Does yardstick scale smape() to 0 to 100 or 0 to 200?**

yardstick divides by the half-sum of `|truth|` and `|estimate|`, putting the upper bound near 200 percent. Some textbooks divide by the full sum and report half that value, so confirm the formula before comparing across tools.

**Can smape() be used with negative truth values?**

It runs, and the absolute values in the denominator avoid dividing by a signed near-zero quantity. But when truth and estimate sit on opposite sides of zero, SMAPE inflates quickly because the residual grows while the denominator stays small. For sign-flipping series, prefer `mae()` for error in raw units.

## Summary

**smape() is the bounded, symmetric percentage scorecard in yardstick's regression family.** Reach for it when truths sit near or cross zero, pair it with `mae()` to anchor magnitude, and remember the reading is not "percent of truth" but a stability-friendly cousin. With `group_by()` it gives per-segment percentages; with `metrics()` it slots into a multi-metric report.
