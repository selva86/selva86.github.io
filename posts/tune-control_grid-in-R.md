---
title: "tune control_grid() in R: Configure Grid Search Behavior"
slug: tune-control_grid-in-R
description: "Use tune control_grid() in R to configure tune_grid() runs. Set verbose, save_pred, save_workflow, parallel_over, extract, and avoid silent control-list bugs."
keywords: "tune control_grid, control_grid function R, tune control_grid examples, R control_grid tidymodels, control_grid verbose, tune_grid control options, tidymodels grid control"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "control_grid()|tune control_grid|tune::control_grid()|grid control object|tune_grid control"
auto_link_case_sensitive: true
target_keyword: tune control_grid
sibling_block_enabled: true
difficulty: Beginner
---

# tune control_grid() in R: Configure Grid Search Behavior

<p class="lead">The tune control_grid() function in R builds a control list that you pass to tune_grid(), tune_race_anova(), or tune_sim_anneal() so the run prints progress, saves predictions, ships extra packages to workers, and exposes the workflow for later fit_best() calls.</p>

[QUICK ANSWER]
control_grid()                                                # silent defaults
control_grid(verbose = TRUE)                                  # print fold-level progress
control_grid(allow_par = TRUE, parallel_over = "everything")  # max parallelism
control_grid(save_pred = TRUE)                                # keep out-of-sample preds
control_grid(save_workflow = TRUE)                            # enable fit_best() later
control_grid(extract = function(x) extract_fit_parsnip(x))    # capture per-fit objects
control_grid(pkgs = c("glmnet"))                              # ship extra pkgs to workers
control_grid(event_level = "second")                          # flip positive class

[DECISION TREE: Is control_grid() the right tool?]
- configure tune_grid() or finetune racing/anneal: control_grid(verbose = TRUE)
- configure tune_bayes() iterative search: control_bayes(no_improve = 10)
- configure fit_resamples() with no tuning: control_resamples(save_pred = TRUE)
- configure last_fit() on a single split: control_last_fit(extract = ...)
- need workers wired up first: doParallel::registerDoParallel(cores = 4)
- already have results, just inspect: collect_metrics(res); collect_predictions(res)

## What control_grid() does in one sentence

**control_grid() returns a list of class control_grid that tune_grid() reads at the start of a run.** You never call it on its own. You build the list, pass it through the `control` argument of a tuning function, and tune respects every switch you flipped: print progress, save predictions, save the workflow, extract per-fit objects, ship packages to parallel workers, and decide whether to parallelize over resamples, candidates, or both.

The defaults are conservative. No prose, no predictions, no workflow, no extracts. Most production tuning runs need at least two of those switches on, so writing your own control object is part of the normal tidymodels workflow rather than an advanced trick.

## control_grid() arguments

**Every argument has a sensible default; you only set what you need.** Here is the full signature with the type and effect of each parameter.

| Argument | Default | Effect |
|---|---|---|
| `verbose` | `FALSE` | Print a one-line log per resample + candidate combination |
| `allow_par` | `TRUE` | Use the registered parallel backend if one exists |
| `extract` | `NULL` | Function applied to each fitted workflow; result stored per-fit |
| `save_pred` | `FALSE` | Save out-of-sample predictions in a `.predictions` column |
| `pkgs` | `NULL` | Extra packages loaded on each parallel worker |
| `save_workflow` | `FALSE` | Attach the un-fitted workflow to the result; required for `fit_best()` |
| `event_level` | `"first"` | Which factor level counts as the positive class for binary metrics |
| `parallel_over` | `NULL` | `"resamples"`, `"everything"`, or `NULL` (auto) |
| `backend_options` | `NULL` | Backend-specific knobs from `tune::new_backend_options()` |

[NOTE]
**save_workflow vs save_pred do different things.** `save_pred = TRUE` keeps the raw out-of-sample predictions for diagnostics. `save_workflow = TRUE` attaches the un-fitted workflow object so `fit_best()` can refit on the full training set without rebuilding the spec.

## Examples by use case

**A control list is cheap to build; spin one per run.** The four examples below cover the cases that account for almost every real-world call. They share the same minimal setup so the relevant change is just the `control_grid()` call.

```r title="Load tidymodels and build a tunable workflow"
library(tidymodels)
library(glmnet)

set.seed(1)
split  <- initial_split(mtcars, prop = 0.75)
train  <- training(split)
folds  <- vfold_cv(train, v = 5)

spec <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")

wf <- workflow() |>
  add_model(spec) |>
  add_formula(mpg ~ .)
#> Loaded tidymodels objects: split, train, folds, spec, wf
```

**Example 1: Print fold-level progress with verbose = TRUE.** Long runs feel like they hang; the verbose switch confirms tune is alive.

```r title="Verbose progress"
ctrl_v <- control_grid(verbose = TRUE)

res_v <- tune_grid(wf, resamples = folds, grid = 5, control = ctrl_v)
#> i Fold1: preprocessor 1/1
#> v Fold1: preprocessor 1/1
#> i Fold1: preprocessor 1/1, model 1/5
#> v Fold1: preprocessor 1/1, model 1/5
#> ... (one pair of lines per fold + candidate)
```

**Example 2: Save predictions for diagnostic plots.** Without this you cannot draw calibration curves or residual scatterplots after the run.

```r title="Save out-of-sample predictions"
ctrl_p <- control_grid(save_pred = TRUE)

res_p <- tune_grid(wf, resamples = folds, grid = 5, control = ctrl_p)

collect_predictions(res_p) |> head(3)
#> # A tibble: 3 x 7
#>   id    .pred  .row penalty mixture .config              mpg
#>   <chr> <dbl> <int>   <dbl>   <dbl> <chr>              <dbl>
#> 1 Fold1  17.8     5  0.0103   0.198 Preprocessor1_Model1  17.8
#> 2 Fold1  20.4    11  0.0103   0.198 Preprocessor1_Model1  21.0
#> 3 Fold1  15.4    18  0.0103   0.198 Preprocessor1_Model1  14.3
```

**Example 3: Enable fit_best() with save_workflow = TRUE.** `fit_best()` rebuilds the best candidate on the full training set in one call, but it needs the original workflow attached.

```r title="Save workflow so fit_best() works"
ctrl_w <- control_grid(save_workflow = TRUE)

res_w  <- tune_grid(wf, resamples = folds, grid = 5, control = ctrl_w)
final_fit <- fit_best(res_w)
#> Returns a fitted workflow on the full training set,
#> ready for predict(final_fit, new_data = test)
```

**Example 4: Capture per-fit objects with extract.** Useful when you want to inspect coefficients, variable importance, or model-specific diagnostics across every fold.

```r title="Extract fitted parsnip object per fit"
ctrl_e <- control_grid(extract = function(x) extract_fit_parsnip(x))

res_e <- tune_grid(wf, resamples = folds, grid = 3, control = ctrl_e)

res_e$.extracts[[1]]$.extracts[[1]]
#> parsnip model object
#>
#> Fit time:  6ms
#> Call:  glmnet::glmnet(x = maybe_matrix(x), y = y, family = "gaussian",
#>     alpha = ~0.198)
```

[TIP]
**Combine flags in one control object per run.** A typical production call sets `verbose = TRUE`, `save_pred = TRUE`, and `save_workflow = TRUE` together. The cost of extra flags is small (predictions are a single tibble), and you avoid the "I should have saved that" feeling 40 minutes into the tune.

## control_grid() versus control_bayes() and control_resamples()

**Pick the control function that matches the tuning function.** Mixing them is the most common silent failure: tune accepts the wrong control list, ignores the unknown fields, and runs with defaults.

| Function | Use with | Unique args |
|---|---|---|
| `control_grid()` | `tune_grid()`, `tune_race_anova()`, `tune_race_win_loss()`, `tune_sim_anneal()` | `parallel_over`, `extract` |
| `control_bayes()` | `tune_bayes()` | `no_improve`, `uncertain`, `verbose_iter`, `time_limit` |
| `control_resamples()` | `fit_resamples()` | Same as grid minus `extract` knobs |
| `control_last_fit()` | `last_fit()` | Minimal; one resample, no candidates |

The rule of thumb: if the tuning function name contains `grid`, `race`, or `anneal`, use `control_grid()`. If it is `tune_bayes()`, use `control_bayes()`. If there is no tuning happening, use `control_resamples()` or `control_last_fit()`.

## Common pitfalls

**Three mistakes account for most failed runs.** Each one fails silently or with a cryptic message; the fix is one-line.

1. **Passing control_grid() to tune_bayes().** Bayes ignores `parallel_over` and the `verbose` you set goes nowhere because Bayes prints under `verbose_iter`. Use `control_bayes()` instead.
2. **allow_par = TRUE with no backend registered.** Tune falls back to sequential execution and you do not get a warning. Register a backend first: `library(doParallel); registerDoParallel(cores = 4)`.
3. **Forgetting save_workflow = TRUE.** `fit_best(res)` errors with "no workflow attached" and you have to re-run the tune. Set `save_workflow = TRUE` on every production run; it is cheap.

[WARNING]
**parallel_over = "everything" can explode worker counts.** `"resamples"` parallelizes only across folds (5-10 workers); `"everything"` parallelizes across the fold + candidate Cartesian product (50+ workers for a 10-candidate, 5-fold run). On a laptop, the default `NULL` (auto) is safer.

## Try it yourself

**Try it:** Build a control object that prints progress AND saves predictions, then pass it to a tune_grid() run on the workflow above. Save the result to `ex_res` and pull the first 3 rows of predictions.

```r title="Your turn: configure a verbose, prediction-saving run"
# Try it: build the control list, run tune_grid, collect_predictions()
ex_ctrl <- # your code here
ex_res  <- # your code here

collect_predictions(ex_res) |> head(3)
#> Expected: 3 rows with .pred, mpg, penalty, mixture, .config
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ctrl <- control_grid(verbose = TRUE, save_pred = TRUE)

ex_res  <- tune_grid(wf, resamples = folds, grid = 3, control = ex_ctrl)

collect_predictions(ex_res) |> head(3)
#> # A tibble: 3 x 7
#>   id    .pred  .row penalty mixture .config              mpg
#>   <chr> <dbl> <int>   <dbl>   <dbl> <chr>              <dbl>
#> 1 Fold1  17.8     5  0.0103   0.198 Preprocessor1_Model1  17.8
#> 2 Fold1  20.4    11  0.0103   0.198 Preprocessor1_Model1  21.0
#> 3 Fold1  15.4    18  0.0103   0.198 Preprocessor1_Model1  14.3
```

**Explanation:** The two switches stack in a single call. `verbose = TRUE` prints one line per fold-candidate pair during the run; `save_pred = TRUE` populates the `.predictions` list column so `collect_predictions()` can return the row-level out-of-sample preds.

</details>

## Related tidymodels functions

- `tune_grid()`: the function that consumes the control list.
- `control_bayes()`: control list for `tune_bayes()`.
- `control_resamples()`: control list for `fit_resamples()`.
- `collect_predictions()`: extracts the predictions that `save_pred = TRUE` retained.
- `fit_best()`: refits the best candidate on the full training set; requires `save_workflow = TRUE`.

For an end-to-end tidymodels tuning run that uses several of these together, see the [tidymodels exercises hub](tidymodels-Exercises-in-R.html) or the official [tune control reference](https://tune.tidymodels.org/reference/control_grid.html).

## FAQ

**What is the difference between control_grid() and control_resamples()?**

`control_grid()` controls tuning runs (`tune_grid()`, `tune_race_anova()`, `tune_sim_anneal()`) where the workflow contains parameters marked with `tune()`. `control_resamples()` controls `fit_resamples()`, which evaluates a single fixed workflow across resamples without searching any grid. The two control lists share most arguments (`verbose`, `save_pred`, `save_workflow`, `extract`), but `control_grid()` adds `parallel_over` because tuning has both folds and candidates to parallelize across.

**Does control_grid() actually do the parallelization?**

No. `control_grid(allow_par = TRUE)` only authorizes tune to dispatch work to a registered parallel backend. You still have to register one yourself: `library(doParallel); registerDoParallel(cores = 4)` before the `tune_grid()` call. Without a backend, `allow_par = TRUE` runs sequentially without warning.

**Why do I need save_workflow = TRUE?**

`fit_best()` refits the best-performing candidate on the full training set with one line. To do that, it needs the original un-fitted workflow attached to the results object. Without `save_workflow = TRUE`, that workflow is not stored and `fit_best()` errors out. The argument is cheap (the workflow is small), so set it on every tuning run you intend to ship.

**Can I see fold-level errors and warnings during a run?**

Yes. The `.notes` column in any `tune_results` object contains the per-fold messages, errors, and warnings even when `verbose = FALSE`. Use `collect_notes(res)` to pull them into a tidy tibble. Setting `verbose = TRUE` streams the same content live as the run progresses, useful when you suspect a single fold is hanging.

**What does parallel_over = "everything" mean?**

`"resamples"` (the default when a backend is registered) parallelizes only across resamples, so at most v workers run at once (v = number of folds). `"everything"` parallelizes across the Cartesian product of resamples and candidates, so for 5 folds and 10 candidates you can saturate 50 workers. Use `"everything"` when you have many cores and the model fit is fast; stick with `"resamples"` when each model fit is slow or when each candidate prints a lot of model state.
