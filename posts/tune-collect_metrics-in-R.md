---
title: "tune collect_metrics() in R: Extract Tuning Metrics"
slug: "tune-collect_metrics-in-R"
description: "Use tune collect_metrics() in R to pull mean and per-resample metrics from tune_grid, fit_resamples, and last_fit results. See summarize, type, and pitfalls."
keywords: "tune collect_metrics, collect_metrics function R, tune collect_metrics examples, collect_metrics tidymodels, R extract tuning metrics, collect_metrics summarize, collect_metrics wide format"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidymodels-family"
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "collect_metrics()|tune collect_metrics|tune::collect_metrics()|collect_metrics tidymodels|extract tuning metrics"
auto_link_case_sensitive: true
target_keyword: "tune collect_metrics"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tune collect_metrics() in R: Extract Tuning Metrics

<p class="lead">The tune collect_metrics() function in R pulls performance metrics out of a tune_results object, returning a tidy tibble with one row per hyperparameter candidate (and metric) so you can rank, plot, or join the results downstream.</p>

[QUICK ANSWER]
collect_metrics(res)                          # aggregated mean and std_err
collect_metrics(res, summarize = FALSE)       # per-resample, per-candidate
collect_metrics(res, type = "wide")           # one column per metric
collect_metrics(last_fit_obj)                 # test set metrics from last_fit()
collect_metrics(res) |> filter(.metric == "rmse")  # keep one metric
collect_metrics(res) |> arrange(mean)         # rank candidates by mean
collect_metrics(res) |> group_by(.metric) |> slice_min(mean, n = 1)  # best per metric

[DECISION TREE: Is collect_metrics() the right tool?]
- pull mean metrics from tuning: collect_metrics(res)
- get the top-N candidates ranked: show_best(res, metric = "rmse")
- pick a single best candidate as a tibble: select_best(res, metric = "rmse")
- raw out-of-fold predictions, not metrics: collect_predictions(res)
- notes thrown during tuning fits: collect_notes(res)
- extract the underlying fitted workflow: extract_workflow(res)
- finalize and fit on full train + test: last_fit(final_wf, split)

## What collect_metrics() does in one sentence

**collect_metrics() unpacks the metric column of a tune_results tibble into a flat, mergeable summary.** When tune_grid(), fit_resamples(), tune_bayes(), or last_fit() runs, each row of the returned object stores a nested list column called `.metrics` with the per-resample numbers. collect_metrics() walks that column, optionally averages across folds, and hands you a tibble with the tuning parameters, `.metric`, `.estimator`, `mean`, `n`, and `std_err`.

This is the function you almost always call right after a tuning run finishes. show_best() and autoplot() rely on the same data; collect_metrics() is the version you reach for when you want full control over filtering, grouping, or joining.

## Set up a tune_results object

**You need a fitted tuning result before collect_metrics() does anything useful.** The block below tunes the elastic-net penalty and mixture on a 5-fold split of the Ames housing data so the rest of the page has a real object to work with.

```r title="Tune a small elastic net grid"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(1)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)
folds <- vfold_cv(train, v = 5, strata = Sale_Price)

rec <- recipe(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type, data = train) |>
  step_dummy(all_nominal_predictors()) |>
  step_normalize(all_numeric_predictors())

spec <- linear_reg(penalty = tune(), mixture = tune()) |> set_engine("glmnet")
wf   <- workflow() |> add_recipe(rec) |> add_model(spec)

set.seed(2)
res <- tune_grid(wf, resamples = folds, grid = 6)
res
#> # Tuning results
#> # 5-fold cross-validation using stratification
#> # A tibble: 5 x 4
#>   splits             id    .metrics          .notes
#>   <list>             <chr> <list>            <list>
#> 1 <split [1873/469]> Fold1 <tibble [12 x 6]> <tibble [0 x 3]>
#> ... 4 more rows
```

The `.metrics` list column is exactly what collect_metrics() will flatten.

## collect_metrics() syntax and arguments

**The signature is intentionally minimal.**

```r title="collect_metrics signature"
collect_metrics(
  x,                 # tune_results, last_fit, or fit_resamples object
  ...,
  summarize = TRUE,  # TRUE = mean + std_err across resamples
  type = "long",     # "long" (default) or "wide"
  event_level        # passed through for survival / class metrics
)
```

`x` is the tuning result. `summarize = TRUE` aggregates across folds; `summarize = FALSE` returns one row per fold per candidate per metric. `type = "wide"` pivots `.metric` into columns, which is handy for plotting two metrics against the same parameter axis.

The four switches above interact with the input shape. The table below shows which columns to expect for each combination, so you know which downstream code to write.

| Input type | summarize | Returns | Key columns |
|---|---|---|---|
| tune_grid / tune_bayes | TRUE | one row per candidate per metric | params, `.metric`, `mean`, `n`, `std_err` |
| tune_grid / tune_bayes | FALSE | one row per resample per candidate per metric | params, `id`, `.metric`, `.estimate` |
| fit_resamples | TRUE | one row per metric | `.metric`, `mean`, `n`, `std_err` |
| last_fit | (ignored) | one row per metric on the test set | `.metric`, `.estimate` |

[NOTE]
**collect_metrics() works on more than tune_grid().** It accepts output from fit_resamples(), tune_bayes(), finetune::tune_race_anova(), finetune::tune_sim_anneal(), and last_fit(). The shape of the returned tibble adapts to what the input carries: tuning runs include candidate parameter columns, while last_fit() returns a single row per metric.

## Aggregated vs per-resample results

**The default aggregates across folds; pass summarize = FALSE to keep individual fold scores.** Aggregated output is what you usually want for model selection. Per-resample output is what you want for variance plots, paired comparisons, or to feed into perf_mod().

```r title="Default aggregated metrics"
collect_metrics(res)
#> # A tibble: 12 x 8
#>   penalty mixture .metric .estimator    mean     n std_err .config
#>     <dbl>   <dbl> <chr>   <chr>        <dbl> <int>   <dbl> <chr>
#> 1 3.13e-7  0.0123 rmse    standard    0.0879     5 0.00185 Preprocessor1_Model1
#> 2 3.13e-7  0.0123 rsq     standard    0.692      5 0.0119  Preprocessor1_Model1
#> 3 1.05e-4  0.211  rmse    standard    0.0875     5 0.00181 Preprocessor1_Model2
#> ... 9 more rows
```

```r title="Per-resample metrics with summarize = FALSE"
collect_metrics(res, summarize = FALSE) |>
  filter(.metric == "rmse") |>
  head()
#> # A tibble: 6 x 7
#>   id    penalty mixture .metric .estimator .estimate .config
#>   <chr>   <dbl>   <dbl> <chr>   <chr>          <dbl> <chr>
#> 1 Fold1 3.13e-7  0.0123 rmse    standard      0.0870 Preprocessor1_Model1
#> 2 Fold2 3.13e-7  0.0123 rmse    standard      0.0902 Preprocessor1_Model1
#> ... 4 more rows
```

Notice the column rename: aggregated output has `mean` and `std_err`, per-resample has `.estimate` and `id`. Code that consumes both modes must check which columns exist.

[KEY INSIGHT]
**The `n` column tells you how many resamples actually scored.** If `n` is less than the resample count you set up, some folds failed silently. Check `collect_notes(res)` to see why and decide whether the mean is still trustworthy.

## Long vs wide format

**Wide format gives one row per candidate and one column per metric.** This is what you want when you plot rmse against rsq, or when a downstream join expects a single key per parameter set.

```r title="Wide format pivots metrics into columns"
collect_metrics(res, type = "wide")
#> # A tibble: 6 x 7
#>   penalty mixture .config                   n    rmse    rsq mae_default
#>     <dbl>   <dbl> <chr>                 <int>   <dbl>  <dbl>       <dbl>
#> 1 3.13e-7  0.0123 Preprocessor1_Model1      5 0.0879  0.692       NA
#> 2 1.05e-4  0.211  Preprocessor1_Model2      5 0.0875  0.694       NA
#> ... 4 more rows
```

The `std_err` columns are dropped in wide mode. Use long for variance work, wide for plotting and joining.

## Joining with show_best() and select_best()

**collect_metrics() is the source; show_best() and select_best() are convenience wrappers.** They call collect_metrics() internally, then sort and slice. You can replicate either by hand and add custom filters along the way.

```r title="Replicate show_best with collect_metrics"
collect_metrics(res) |>
  filter(.metric == "rmse") |>
  arrange(mean) |>
  slice_head(n = 3) |>
  select(penalty, mixture, mean, std_err)
#> # A tibble: 3 x 4
#>   penalty mixture    mean std_err
#>     <dbl>   <dbl>   <dbl>   <dbl>
#> 1 0.00104   0.421 0.0871  0.00179
#> 2 1.05e-4   0.211 0.0875  0.00181
#> 3 3.13e-7   0.0123 0.0879 0.00185
```

When you want to inspect a metric the default helpers do not surface (for example a custom yardstick metric inside a metric_set), collect_metrics() is the only path that gives you the full set.

## Common pitfalls

**Three failure modes account for most of the friction.**

- **Calling collect_metrics() on a workflow instead of the result.** The workflow has no metrics yet. Run tune_grid() or fit_resamples() first; pass the returned object.
- **Assuming `mean` always exists.** With `summarize = FALSE`, the column is `.estimate`. Code that hard-codes `mean` breaks. Branch on summarize or rename early.
- **Forgetting the metric filter.** `slice_min(mean, n = 1)` without a `.metric` filter picks the row with the smallest value across rmse, rsq, and any others. Always filter to a single metric or group by `.metric` before slicing.

[WARNING]
**collect_metrics() never refits the model.** It only summarises what was already computed. If you tuned with a small grid and want different aggregation, you can re-call collect_metrics() with new arguments, but you cannot recover metrics you did not score during the original run. Add the metric to your metric_set() before tuning.

## Try it yourself

**Try it:** From the `res` tibble above, use collect_metrics() to find the candidate with the smallest RMSE and save its penalty and mixture to `ex_best`.

```r title="Your turn: find the best candidate"
# Try it: smallest RMSE row
ex_best <- # your code here

ex_best
#> Expected: 1 row, columns penalty and mixture
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_best <- collect_metrics(res) |>
  filter(.metric == "rmse") |>
  arrange(mean) |>
  slice_head(n = 1) |>
  select(penalty, mixture)

ex_best
#> # A tibble: 1 x 2
#>   penalty mixture
#>     <dbl>   <dbl>
#> 1 0.00104   0.421
```

**Explanation:** collect_metrics() flattens the nested `.metrics` column, the filter keeps RMSE rows only, and slice_head() after arrange() picks the smallest mean. select() trims to the two tuning parameters so `ex_best` is a one-row, two-column tibble ready to plug into finalize_workflow().

</details>

## Related tune functions

- show_best() returns the top-N candidates pre-sorted on one metric.
- select_best() returns the single best candidate as a one-row tibble.
- collect_predictions() pulls out-of-fold predictions instead of metrics.
- autoplot() on tune_results uses collect_metrics() output to draw faceted curves.
- finalize_workflow() takes the tibble select_best() returns and fills in the tune() placeholders.

For the official reference, see the [tune package documentation](https://tune.tidymodels.org/reference/collect_predictions.html).

## FAQ

**What is the difference between collect_metrics() and show_best()?**

show_best() is collect_metrics() plus a filter on one metric, an arrange by mean, and a slice_head() of the top N. If you want all metrics, custom filters, or the full table for plotting, call collect_metrics() directly. If you just want the leaderboard for one metric, show_best() saves three lines.

**Why does collect_metrics() return NA for std_err sometimes?**

NA appears when only one resample produced a finite value for that metric. With `n = 1`, the standard error is undefined. The fix is upstream: check collect_notes() for fold-level errors, add more resamples, or remove problematic candidates.

**Can I use collect_metrics() with last_fit()?**

Yes. last_fit() returns a one-row tibble that behaves like a single-resample tune_results object. collect_metrics() on it gives the test-set scores (one row per metric in the metric_set you passed). There is no `summarize` choice in that case because there is only one fold.

**Does collect_metrics() work with custom yardstick metrics?**

Yes. Any metric that was part of the metric_set() at tune time is included automatically. The column shape is identical: `.metric` carries the custom metric name and the rest of the columns are unchanged.

**Can I pivot back from wide to long?**

Yes, but the more direct path is to re-call `collect_metrics(res, type = "long")`. The wide form drops `std_err`, so manual pivoting from wide cannot reconstruct the standard errors. Always derive both views from the same tune_results object.
