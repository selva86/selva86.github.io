---
title: "tune collect_predictions() in R: Inspect Tuning Predictions"
slug: "tune-collect_predictions-in-R"
description: "Use tune collect_predictions() in R to extract out-of-fold predictions from tune_grid, fit_resamples, and last_fit. See save_pred, parameters, and pitfalls."
keywords: "tune collect_predictions, collect_predictions function R, tune collect_predictions examples, collect_predictions tidymodels, save_pred TRUE tune, R extract tuning predictions, collect_predictions parameters"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidymodels-family"
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "collect_predictions()|tune collect_predictions|tune::collect_predictions()|collect_predictions tidymodels|extract tuning predictions"
auto_link_case_sensitive: true
target_keyword: "tune collect_predictions"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tune collect_predictions() in R: Inspect Tuning Predictions

<p class="lead">The tune collect_predictions() function in R extracts out-of-fold predictions from a tune_results object, returning a tidy tibble with one row per resampled observation (per candidate) so you can plot residuals, compute custom metrics, or build ensembles.</p>

[QUICK ANSWER]
collect_predictions(res)                                  # all candidates, averaged
collect_predictions(res, summarize = FALSE)               # per-resample rows
collect_predictions(res, parameters = best)               # filter to one candidate
collect_predictions(last_fit_obj)                         # test set predictions
collect_predictions(res) |> filter(.config == "Preprocessor1_Model1")
collect_predictions(res) |> mutate(resid = Sale_Price - .pred)
collect_predictions(cls_res) |> select(.pred_class, .pred_yes, truth)

[DECISION TREE: Is collect_predictions() the right tool?]
- pull held-out predictions from tuning: collect_predictions(res)
- get summarized metrics, not predictions: collect_metrics(res)
- show the top-N candidates ranked: show_best(res, metric = "rmse")
- pick the single best candidate row: select_best(res, metric = "rmse")
- finalize and predict on a new test set: last_fit(final_wf, split)
- raw notes from failing folds: collect_notes(res)
- predictions from a fitted workflow on new data: predict(fit_wf, new_data)

## What collect_predictions() does in one sentence

**collect_predictions() unpacks the prediction column of a tune_results tibble into a flat, joinable table of held-out predictions.** When tune_grid(), fit_resamples(), tune_bayes(), or last_fit() runs with `save_pred = TRUE`, each row of the returned object stores a nested list column called `.predictions`. collect_predictions() walks that column, optionally averages predictions across resamples for repeats, and returns a tibble with `.pred` (or `.pred_class` for classification), `.row`, `.config`, the candidate parameter columns, and the response variable.

You reach for this function any time you need predictions, not metrics. Residual plots, calibration curves, custom yardstick metrics, stacking and ensembling, and per-observation error analysis all start here.

## Save predictions during tuning

**collect_predictions() returns nothing unless predictions were saved at tune time.** The save flag lives on the control object you pass to `tune_grid()`. The block below tunes an elastic net on Ames housing with predictions retained.

```r title="Tune with save_pred enabled"
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
res <- tune_grid(
  wf, resamples = folds, grid = 6,
  control = control_grid(save_pred = TRUE)
)
```

Without `control_grid(save_pred = TRUE)`, `.predictions` stays empty and `collect_predictions(res)` returns a zero-row tibble. The same flag is `control_resamples(save_pred = TRUE)` for `fit_resamples()` and `control_race(save_pred = TRUE)` for the finetune racing engines.

[WARNING]
**Saving predictions is opt-in for a reason.** Each fold stores `nrow(fold)` predictions per candidate per metric_set evaluation, which can balloon memory on large grids. Enable `save_pred` deliberately on small-to-medium grids, or drop columns from the recipe before tuning if memory is tight.

## collect_predictions() syntax and arguments

**The signature is short, but the `parameters` argument is the one most people miss.**

```r title="collect_predictions signature"
collect_predictions(
  x,                  # tune_results, last_fit, or fit_resamples object
  ...,
  summarize = TRUE,   # average duplicate predictions across repeats
  parameters = NULL   # tibble or row that filters to one candidate
)
```

`x` is the tuning result. `summarize = TRUE` averages predictions when the same observation appears in multiple repeats of a repeated CV scheme; with simple v-fold CV it has no effect because each row appears in exactly one held-out fold. `parameters` accepts a one-row tibble (typically from `select_best()`) and keeps only predictions from that candidate, which is how you turn a 6-candidate, 5-fold result into a single 1873-row tibble of one model's out-of-fold predictions.

The four input shapes return different column sets. The table below shows what to expect.

| Input type | Returns | Key columns |
|---|---|---|
| tune_grid / tune_bayes (regression) | one row per held-out obs per candidate | `.pred`, `.row`, params, `.config`, response |
| tune_grid / tune_bayes (classification) | one row per held-out obs per candidate | `.pred_class`, `.pred_<level>`, `.row`, params, `.config`, response |
| fit_resamples | one row per held-out obs | `.pred`, `.row`, `.config`, response |
| last_fit | one row per test-set obs | `.pred` (or `.pred_class`), `.row`, response |

## Filter to one candidate with parameters

**`select_best()` plus the `parameters` argument is the standard handoff.** Pick the winning candidate on a metric, then ask collect_predictions() to return only that candidate's held-out predictions.

```r title="Predictions from the best candidate"
best <- select_best(res, metric = "rmse")
preds_best <- collect_predictions(res, parameters = best)
head(preds_best)
#> # A tibble: 6 x 6
#>   .pred  .row penalty mixture .config              Sale_Price
#>   <dbl> <int>   <dbl>   <dbl> <chr>                     <dbl>
#> 1  5.21    14 0.00104   0.421 Preprocessor1_Model5       5.18
#> 2  5.30    23 0.00104   0.421 Preprocessor1_Model5       5.33
#> 3  5.14    41 0.00104   0.421 Preprocessor1_Model5       5.10
```

Without `parameters`, you get predictions for all six candidates stacked together, which is 6 x 1873 rows. Always filter when you only care about one model.

[KEY INSIGHT]
**Each prediction is held-out, so you can compute honest metrics by hand.** The `.pred` column is the prediction made when that row was in the assessment fold, not the analysis fold. That makes `yardstick::rmse(preds_best, Sale_Price, .pred)` directly comparable to what `collect_metrics()` reported, with the bonus that you can swap in any custom metric or residual diagnostic.

## Aggregated vs per-resample output

**`summarize = TRUE` averages predictions across repeats; with simple v-fold CV the output is identical to FALSE.** The difference shows up only when you use `vfold_cv(repeats = 5)` or a Monte Carlo scheme that revisits the same row.

```r title="summarize matters for repeated CV"
collect_predictions(res, summarize = TRUE)  |> nrow()
#> [1] 11238
collect_predictions(res, summarize = FALSE) |> nrow()
#> [1] 11238
```

Both return 11,238 rows here (1,873 obs x 6 candidates) because every observation lands in exactly one held-out fold. Switch to `vfold_cv(repeats = 3)` and the FALSE form triples while the TRUE form stays at 11,238.

[TIP]
**Join predictions back to the training data via `.row`.** The `.row` column indexes into the data you passed to `tune_grid()`. `train |> mutate(.row = row_number()) |> inner_join(preds_best, by = ".row")` gives you every original column alongside the prediction, which is what you need for grouped error analysis or to plot residuals against an unmodeled covariate.

## Common pitfalls

**Three failure modes account for most of the friction.**

- **Forgetting `save_pred = TRUE`.** Without it, `.predictions` is empty and collect_predictions() returns zero rows. The fix is at tune time, not at collect time; re-tune with `control_grid(save_pred = TRUE)`.
- **Skipping `parameters` and getting all candidates.** Calling collect_predictions(res) on a 50-candidate grid gives a 50x table; downstream code that expects one row per observation silently averages or duplicates. Pass `parameters = select_best(res, metric = "rmse")` whenever you want a single model.
- **Confusing `.row` with the row position in the assessment fold.** `.row` indexes the FULL training tibble, not the fold. Use it to join back to `train`, not to `assessment(folds$splits[[1]])`.

## Try it yourself

**Try it:** Pull the held-out predictions for the best RMSE candidate in `res`, compute residuals, and save the result to `ex_resid`. The tibble should include `Sale_Price`, `.pred`, and a new column `resid = Sale_Price - .pred`.

```r title="Your turn: residuals for the best candidate"
# Try it: residuals for best candidate
ex_resid <- # your code here

head(ex_resid)
#> Expected: 6 rows with Sale_Price, .pred, resid columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
best <- select_best(res, metric = "rmse")
ex_resid <- collect_predictions(res, parameters = best) |>
  mutate(resid = Sale_Price - .pred) |>
  select(Sale_Price, .pred, resid)

head(ex_resid)
#> # A tibble: 6 x 3
#>   Sale_Price .pred    resid
#>        <dbl> <dbl>    <dbl>
#> 1       5.18  5.21 -0.0341
#> 2       5.33  5.30  0.0277
#> 3       5.10  5.14 -0.0410
```

**Explanation:** `select_best()` returns the one-row tibble of winning hyperparameters; passing it to `parameters` filters collect_predictions() to that single model. `mutate()` adds the residual column, and `select()` trims to the three columns the prompt asked for.

</details>

## Related tune functions

- collect_metrics() returns summarized metrics from the same tune_results object.
- select_best() returns the winning candidate as a one-row tibble, perfect for `parameters`.
- show_best() prints the top-N candidates ranked on one metric.
- last_fit() finalizes a workflow and returns a tune_results-shaped object with test predictions.
- augment() on a fitted workflow appends `.pred` columns to new data, the post-tuning analog.

For the official reference, see the [tune package documentation](https://tune.tidymodels.org/reference/collect_predictions.html).

## FAQ

**Why does collect_predictions() return zero rows?**

The `.predictions` list column is empty because you tuned without `save_pred = TRUE`. Re-run tune_grid() with `control = control_grid(save_pred = TRUE)`. The flag is opt-in to keep memory predictable on large grids; it costs roughly `nrow(train) * n_candidates * 8 bytes` for a regression with default metric sets.

**What is the difference between collect_predictions() and predict()?**

collect_predictions() gives you held-out predictions from cross-validation, made on data the model never saw during fitting. predict() gives you predictions from a single fitted model on new data, which can be train, test, or arbitrary input. Use collect_predictions() to assess generalization during tuning; use predict() (or augment()) on the final fitted workflow for deployment.

**Can I use collect_predictions() with classification models?**

Yes. The returned tibble includes `.pred_class` plus one `.pred_<level>` column per class containing predicted probabilities. Pass it to yardstick metrics like `roc_auc(preds, truth, .pred_yes)` for AUC or `conf_mat(preds, truth, .pred_class)` for a confusion matrix.

**Does the parameters argument accept multiple candidates?**

Yes. You can pass any tibble whose columns are a subset of the tuning parameters. Multiple rows filter to multiple candidates, which is useful for comparing the top three models or for building a stacking ensemble across the top-K rows of show_best().
