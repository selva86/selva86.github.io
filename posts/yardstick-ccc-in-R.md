---
title: "yardstick ccc() in R: Concordance With Bias Correction"
slug: yardstick-ccc-in-R
description: "Use yardstick ccc() in R to score regression agreement with Lin's concordance correlation. See syntax, the bias argument, grouped scoring, and common pitfalls."
keywords: "yardstick ccc, ccc function R, yardstick ccc examples, Lin's concordance correlation R, tidymodels ccc, concordance correlation coefficient R, regression agreement metric"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "ccc()|yardstick ccc|yardstick::ccc()|concordance correlation coefficient|Lin's concordance correlation"
auto_link_case_sensitive: true
target_keyword: yardstick ccc
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick ccc() in R: Concordance With Bias Correction

<p class="lead">The yardstick ccc() function in R returns Lin's concordance correlation coefficient between observed and predicted values, accepting a tibble with truth and estimate columns and producing a tidy one-row summary that scores precision and accuracy in a single number.</p>

[QUICK ANSWER]
ccc(df, truth, estimate)                          # basic call
ccc(df, truth = obs, estimate = pred)             # named arguments
ccc(df, solubility, prediction)                   # default tidymodels output
ccc(df, obs, pred, bias = TRUE)                   # unbiased variance estimator
df |> group_by(fold) |> ccc(obs, pred)            # by resample
ccc(df, obs, pred, na_rm = TRUE)                  # drop missing rows
ccc_vec(truth_vec, pred_vec)                      # vector interface
ccc(df, obs, pred, case_weights = w)              # weighted concordance

[DECISION TREE: Is ccc() the right tool?]
- agreement plus calibration in one score: ccc(df, truth, estimate)
- shape only, ignore systematic offset: rsq(df, truth, estimate)
- error in outcome units: rmse(df, truth, estimate)
- less outlier sensitive than rmse: mae(df, truth, estimate)
- percentage error matters most: mape(df, truth, estimate)
- predicting classes, not numbers: accuracy(df, truth, estimate)
- multi-metric report in one call: metrics(df, truth, estimate)

## What ccc() measures

**ccc() multiplies the Pearson correlation by a bias-correction factor.** You pass a data frame with the observed outcome and the predicted values, and the function returns a one-row tibble with three columns: `.metric`, `.estimator`, and `.estimate`. The estimate ranges from -1 to 1, where 1 means every prediction sits on the 45-degree line and 0 means no agreement.

The score decomposes into precision (tightness of the scatter around its own best-fit line) and accuracy (how close that line sits to the identity). A high Pearson correlation can still produce a mediocre ccc when predictions are systematically high or low, which is why agreement studies in clinical chemistry and method comparison prefer it.

[KEY INSIGHT]
**ccc() catches bias that rsq() misses.** A model that always predicts truth plus 10 still earns rsq = 1.0, but ccc drops fast because the prediction cloud is shifted off the identity line. Reach for ccc whenever calibration matters as much as ranking.

## ccc() syntax and arguments

**The signature extends the standard yardstick numeric-metric shape with one extra argument.** Once you know the common arguments, you only need to learn `bias` to use ccc in production.

```r title="ccc generic signature"
ccc(data, truth, estimate, bias = FALSE, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `bias` | If `TRUE`, use the unbiased variance estimator (divide by n - 1); default `FALSE` matches Lin's original biased formula. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights for survey or importance-weighted data. |

Truth and estimate must both be numeric; factors raise an error. The `bias` flag only switches the variance formula, so the two estimates agree to three decimals for samples above n = 50.

## Compute concordance: four examples

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

**Example 1 calls ccc() with positional arguments.** The function picks up truth and estimate by position and returns the tidy summary.

```r title="Basic ccc score on solubility predictions"
ccc(solubility_test, solubility, prediction)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ccc     standard       0.913
```

The `.estimator` column reports `standard` because ccc has no binary or multiclass variant. The estimate of 0.913 says predictions sit close to the identity line, with only small bias.

**Example 2 toggles the bias argument.** Switching to the unbiased variance estimator shifts the score by a small amount that grows when the sample is small.

```r title="Toggle the bias argument"
ccc(solubility_test, solubility, prediction, bias = FALSE)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ccc     standard       0.913

ccc(solubility_test, solubility, prediction, bias = TRUE)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ccc     standard       0.912
```

For the 1,267 rows in solubility_test the two variants barely differ. Report `bias = FALSE` for compatibility with Lin's 1989 paper; switch to `bias = TRUE` for tiny samples.

**Example 3 groups scoring by resample fold.** When predictions from cross-validation live in one tibble, `group_by()` plus ccc returns one score per fold, giving instant per-resample diagnostics.

```r title="Per-fold ccc from a cross-validation tibble"
folded <- solubility_test |>
  mutate(fold = rep(paste0("fold", 1:5), length.out = n()))

folded |>
  group_by(fold) |>
  ccc(truth = solubility, estimate = prediction)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 ccc     standard       0.912
#> 2 fold2 ccc     standard       0.917
#> 3 fold3 ccc     standard       0.908
#> 4 fold4 ccc     standard       0.918
#> 5 fold5 ccc     standard       0.911
```

**Example 4 uses the vector interface for quick checks.** Inside `map()` calls or unit tests, `ccc_vec()` returns a plain scalar instead of a one-row tibble.

```r title="Vector interface returns a numeric scalar"
ccc_vec(solubility_test$solubility, solubility_test$prediction)
#> [1] 0.9131929
```

Use the vector form for thresholds or unit tests; otherwise stay with the data-frame form so you can bind, group, or plot scores alongside other metrics.

[TIP]
**Report ccc next to rsq, not instead of it.** rsq tells you how tightly predictions track the truth; ccc tells you how close that track sits to the identity line. Binding both with `bind_rows(rsq(...), ccc(...))` exposes calibration drift in a single tidy table.

## ccc() compared with related metrics

**Pick a partner metric that reveals what ccc hides.** The table summarises when each one earns a slot.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `ccc()` | Agreement plus calibration in one score | Less familiar to readers used to rsq |
| `rsq()` | Unit-free shape-only goodness-of-fit | Misses systematic bias entirely |
| `rsq_trad()` | Penalises bias with 1 - SSE/SST | Can go negative, harder to explain |
| `rmse()` | Errors in outcome units | Outliers can dominate the score |
| `mae()` | Robust error in outcome units | Treats tiny and small misses equally |
| `cor()` | Plain Pearson correlation | No bias correction, no tidy output |

A safe default is ccc as the headline agreement number, rmse for absolute error, and rsq for the unit-free shape signal.

## Common pitfalls

**Three small mistakes account for most ccc() failures.** Each one has a one-line fix.

The first is treating ccc as a drop-in for cor(). The two agree only when prediction and truth share the same mean and variance; any shift or rescale pulls ccc below cor by design. Plot residuals against truth before chasing the metric.

The second pitfall is comparing ccc across target transformations. A ccc of 0.91 on log-price and 0.78 on raw-price says nothing about which model is better. Back-transform predictions to a common scale before scoring.

The third pitfall is using ccc on a tiny sample. The bias-correction factor depends on second moments that are noisy at small n. For samples under 30, set `bias = TRUE` and add a bootstrap confidence interval.

[WARNING]
**ccc and rsq can diverge sharply.** A model with rsq = 0.95 but ccc = 0.40 is a strong ranker that is badly miscalibrated. Always plot predictions against truth with a `geom_abline(slope = 1)` reference; do not rely on either score alone.

## Try it yourself

**Try it:** Add a `shifted` column to `solubility_test` equal to `prediction + 1`, then compute ccc on both versions and save a two-row tibble to `ex_ccc_shift` comparing the scores.

```r title="Your turn: ccc with a deliberate bias shift"
library(yardstick)
library(dplyr)
data("solubility_test")

# Try it: compare ccc on raw and shifted predictions
ex_ccc_shift <- # your code here

ex_ccc_shift
#> Expected: 2 rows, one "raw" and one "shifted"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
shifted_df <- solubility_test |>
  mutate(shifted = prediction + 1)

ex_ccc_shift <- bind_rows(
  ccc(shifted_df, solubility, prediction) |> mutate(version = "raw"),
  ccc(shifted_df, solubility, shifted)    |> mutate(version = "shifted")
) |>
  select(version, .metric, .estimate)

ex_ccc_shift
#> # A tibble: 2 x 3
#>   version .metric .estimate
#>   <chr>   <chr>       <dbl>
#> 1 raw     ccc         0.913
#> 2 shifted ccc         0.629
```

**Explanation:** Adding a constant 1 to every prediction leaves the Pearson correlation untouched, but the bias-correction factor collapses, dragging ccc from 0.913 down to 0.629. The same exercise with rsq would show no change at all, which is exactly why ccc earns a slot in the report.

</details>

## Related yardstick metrics

**ccc() lives in the yardstick numeric-metric family.** Reach for these neighbours when concordance alone is not enough:

- `rsq()` for a unit-free shape-only goodness-of-fit
- `rsq_trad()` for the 1 - SSE/SST variant that penalises bias
- `rmse()` for an error reported in the outcome's own units
- `mae()` for an outlier-robust error in the same units
- `mape()` for percentage error reporting to stakeholders
- `metrics()` to compute several regression scores in a single call

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good ccc value?**

There is no universal cutoff, but McBride (2005) offers a rough ladder for agreement studies: below 0.90 is "poor", 0.90 to 0.95 is "moderate", 0.95 to 0.99 is "substantial", and above 0.99 is "almost perfect". These thresholds came from clinical method comparison, so treat them as a starting point.

**How is ccc() different from cor() or rsq()?**

`cor()` returns plain Pearson correlation and ignores bias entirely. `rsq()` returns its square, so it also ignores bias. `ccc()` multiplies Pearson by a bias-correction factor that drops below 1 whenever predictions are shifted or rescaled. A model that overpredicts by 5 units keeps a perfect cor and rsq, but ccc falls.

**When should I use bias = TRUE in ccc()?**

Use `bias = TRUE` for small samples (under n = 30) where the moment estimators are noisy. For production evaluation with hundreds of predictions, the two settings agree to three decimals, and `bias = FALSE` matches Lin's 1989 paper. Pick one and stick with it across reports.

**Can I use ccc() for classification?**

No. ccc requires numeric truth and estimate columns. For classification agreement, reach for `kap()` (Cohen's kappa) or `mcc()` (Matthews correlation coefficient).

**Why does ccc() return a tibble instead of a number?**

Every yardstick metric returns the same three columns: `.metric`, `.estimator`, `.estimate`. That uniformity lets you `bind_rows()` calls or pipe into `group_by()` with no reshape step. Call `ccc_vec()` for a bare scalar.

## Summary

**ccc() scores agreement, not just correlation.** Use it when calibration matters as much as ranking, pair it with `rsq()` and `rmse()` for a balanced regression scorecard, and switch to `ccc_vec()` only when you need a bare scalar. Combined with `group_by()` it scales to any resampling scheme without reshaping, and combined with `bind_rows(metrics(...))` it produces a clean multi-metric report ready to publish.
