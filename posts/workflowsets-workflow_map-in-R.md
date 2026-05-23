---
title: "workflowsets workflow_map() in R: Fit All Workflows at Once"
slug: "workflowsets-workflow_map-in-R"
description: "Use workflowsets workflow_map() in R to fit, tune, and rank every workflow in a set on the same resamples with one call. Syntax, examples, and pitfalls."
keywords: "workflowsets workflow_map, workflow_map function R, workflowsets workflow_map examples, R tidymodels workflow_map, workflow_map tune_grid, workflow_map fit_resamples, workflowsets tutorial"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "workflow_map()|workflowsets workflow_map|workflowsets::workflow_map()|fit every workflow in a set|map over a workflow set"
auto_link_case_sensitive: true
target_keyword: "workflowsets workflow_map"
sibling_block_enabled: true
difficulty: Beginner
---

# workflowsets workflow_map() in R: Fit All Workflows at Once

The workflowsets `workflow_map()` function in R fits, resamples, or tunes every workflow in a `workflow_set()` on the same resamples in one call, returning the set with a populated `result` column you can rank with `rank_results()` and plot with `autoplot()`.

[QUICK ANSWER]
workflow_map(ws, "fit_resamples", resamples = folds)              # fit each workflow on resamples
workflow_map(ws, "tune_grid", resamples = folds, grid = 5)         # tune each workflow with grid search
workflow_map(ws, "tune_bayes", resamples = folds, iter = 10)       # Bayesian tune each workflow
workflow_map(ws, "tune_grid", resamples = folds, verbose = TRUE)   # log progress per workflow
workflow_map(ws, "tune_grid", resamples = folds, seed = 1)         # fix the seed for reproducibility
workflow_map(ws, "tune_grid", resamples = folds, control = ctrl)   # pass tune_grid control
rank_results(res, rank_metric = "rmse", select_best = TRUE)        # rank the populated set

[DECISION TREE: Is workflow_map() the right tool?]
- fit/tune every workflow in a workflow_set: workflow_map(ws, "tune_grid", resamples)
- fit one workflow on resamples: fit_resamples(wf, resamples)
- tune one workflow with a grid: tune_grid(wf, resamples, grid)
- build the set of candidate workflows first: workflow_set(preprocs, models)
- rank fitted workflows after mapping: rank_results(res, rank_metric = "rmse")
- pull one fitted result back out: extract_workflow_set_result(res, id)
- visualize tuning curves across the set: autoplot(res)

## What workflow_map() does

**workflow_map() applies one fitting function to every row of a workflow set.** It iterates over the `info` column of a `workflow_set` tibble, runs the function you named (`"fit_resamples"`, `"tune_grid"`, or `"tune_bayes"`) on each candidate, and stores each fit's tune result in the `result` column. The set goes in, the same set comes out, with the empty `result` column now filled.

The mental model is map-over-a-tibble. The workflowsets package keeps the bookkeeping (which preprocessor, which model spec, which id) and `workflow_map()` does the fitting. You never call `fit_resamples()` or `tune_grid()` directly on a workflow set; you name the function as a string and let the map handle the loop.

[KEY INSIGHT]
**workflow_map() is a setter, not a getter.** It populates the `result` column in place and returns the whole tibble, so you can pipe straight into `rank_results()` or `collect_metrics()`. You do not get a list of fits back; you get a workflow set with results attached row by row.

## workflow_map() syntax and arguments

**workflow_map() takes a workflow set and the name of a tune function.** Everything else passes through to that function via `...`.

```r title="The workflow_map argument skeleton"
library(tidymodels)
library(workflowsets)

workflow_map(
  object,                       # a workflow_set built with workflow_set()
  fn = "tune_grid",             # "fit_resamples", "tune_grid", or "tune_bayes"
  verbose = FALSE,              # print progress as each workflow runs
  seed = sample.int(1e4, 1),    # fixed seed makes the whole map reproducible
  ...                           # extra args passed to fn (resamples, grid, control, metrics)
)
```

The `object` argument is the unfit workflow set. The `fn` argument is a character string naming a function from the tune package; passing the function itself does not work. The `seed` argument is set once before the loop runs, so every workflow sees the same RNG state and bootstrap order. Everything in `...` is forwarded to `fn`, which is how you supply `resamples`, `grid`, `metrics`, and `control` without listing them in the `workflow_map()` signature.

**workflow_map() returns the input workflow set with `result` populated.** Each row's `result` is a `tune_results` or `resample_results` object that `rank_results()`, `collect_metrics()`, `collect_predictions()`, and `autoplot()` know how to read.

## Three examples of workflow_map() in action

**workflow_map() pays off when you want every candidate scored on the same resamples in one call.** The examples below all use `mtcars` so they run quickly in the browser.

```r title="Build a workflow set with two recipes and two models"
library(tidymodels)
library(workflowsets)
set.seed(1)

data(mtcars)
mtcars$cyl <- factor(mtcars$cyl)

rec_base <- recipe(mpg ~ ., data = mtcars)
rec_norm <- recipe(mpg ~ ., data = mtcars) |> step_normalize(all_numeric_predictors())

lm_spec <- linear_reg() |> set_engine("lm")
rf_spec <- rand_forest(mode = "regression", trees = 200) |> set_engine("ranger")

ws <- workflow_set(
  preproc = list(base = rec_base, norm = rec_norm),
  models  = list(lm = lm_spec, rf = rf_spec)
)
ws
#> # A workflow set/tibble: 4 x 4
#>   wflow_id info             option    result    
#>   <chr>    <list>           <list>    <list>    
#> 1 base_lm  <tibble [1 x 4]> <opts[0]> <list [0]>
#> 2 base_rf  <tibble [1 x 4]> <opts[0]> <list [0]>
#> 3 norm_lm  <tibble [1 x 4]> <opts[0]> <list [0]>
#> 4 norm_rf  <tibble [1 x 4]> <opts[0]> <list [0]>
```

The set is four rows of unfit workflows. The `result` column is empty list-columns, ready to be filled.

**Example 1, fit_resamples across the set.** Use this when no model has hyperparameters to tune.

```r title="workflow_map with fit_resamples on five folds"
folds <- vfold_cv(mtcars, v = 5)

res_fit <- ws |>
  workflow_map("fit_resamples", resamples = folds, seed = 1)

res_fit
#> # A workflow set/tibble: 4 x 4
#>   wflow_id info             option    result   
#>   <chr>    <list>           <list>    <list>   
#> 1 base_lm  <tibble [1 x 4]> <opts[2]> <rsmp[+]>
#> 2 base_rf  <tibble [1 x 4]> <opts[2]> <rsmp[+]>
#> 3 norm_lm  <tibble [1 x 4]> <opts[2]> <rsmp[+]>
#> 4 norm_rf  <tibble [1 x 4]> <opts[2]> <rsmp[+]>
```

The `result` column now shows `<rsmp[+]>`, meaning each row holds a populated `resample_results` object.

**Example 2, tune_grid across the set.** Use this when some models have tunable parameters; non-tunable workflows fall back to a single fit per fold.

```r title="workflow_map with tune_grid, grid = 5"
rf_tune <- rand_forest(mode = "regression", trees = 200, mtry = tune()) |> set_engine("ranger")

ws_tune <- workflow_set(
  preproc = list(base = rec_base),
  models  = list(lm = lm_spec, rf = rf_tune)
)

res_tune <- ws_tune |>
  workflow_map("tune_grid", resamples = folds, grid = 5, verbose = FALSE, seed = 1)

rank_results(res_tune, rank_metric = "rmse", select_best = TRUE)
#> # A tibble: 4 x 9
#>   wflow_id .config       .metric  mean std_err     n preprocessor model        rank
#>   <chr>    <chr>         <chr>   <dbl>   <dbl> <int> <chr>        <chr>       <int>
#> 1 base_rf  Preprocessor~ rmse     2.65   0.343     5 recipe       rand_forest     1
#> 2 base_rf  Preprocessor~ rsq      0.832  0.046     5 recipe       rand_forest     1
#> 3 base_lm  Preprocessor~ rmse     2.97   0.388     5 recipe       linear_reg      2
#> 4 base_lm  Preprocessor~ rsq      0.798  0.056     5 recipe       linear_reg      2
```

`rank_results()` collapses the populated set into one tibble sorted by the metric you name. `select_best = TRUE` keeps only the best configuration per workflow.

**Example 3, autoplot across all candidates.** Pipe the fitted set straight into a plot.

```r title="Visualize ranked metrics across the workflow set"
autoplot(res_tune, rank_metric = "rmse", metric = "rmse", select_best = TRUE)
#> ggplot object: one point per workflow, error bars from resample std_err, ordered by rmse
```

The plot shows each workflow as a point with error bars, ordered by the rank metric. Hover, save, or compose it into a multi-panel report like any ggplot.

## workflow_map() compared with alternatives

**workflow_map() replaces a manual loop over fit_resamples() or tune_grid() calls.** Pick by how many candidates you have.

| Approach | What it does | When to use |
|---|---|---|
| `fit_resamples(wf, resamples)` | Cross-validate one workflow | Single candidate, no tuning |
| `tune_grid(wf, resamples, grid)` | Tune one workflow | Single candidate with tunable args |
| `workflow_map(ws, "fit_resamples", resamples)` | Cross-validate every workflow in a set | 2+ candidates, no tuning |
| `workflow_map(ws, "tune_grid", resamples, grid)` | Tune every workflow in the set | 2+ candidates, some tunable |
| Manual `lapply()` over a list of workflows | Roll your own loop | Almost never; workflow_map handles bookkeeping |

Use `workflow_map()` whenever you have two or more candidates you want to score on the same resamples. The set keeps the comparison fair (same folds, same seed, same metrics) without you wiring it up by hand.

[NOTE]
**Coming from caret?** `workflow_map()` is the workflowsets answer to `caretEnsemble` or a manual `caret::train()` loop. caret returned a list of fits; workflowsets returns a tibble with the fits stored in a list-column, which keeps the downstream verbs (`rank_results`, `collect_metrics`, `autoplot`) uniform.

## Common pitfalls

**Three mistakes account for most workflow_map() errors.**

The first is forgetting that `resamples` belongs in `...`, not in the workflow_map signature. Calling `workflow_map(ws, "tune_grid")` with no resamples passes nothing to `tune_grid()` and errors with "argument 'resamples' is missing." The fix is to always pass `resamples = folds` (and `grid` if tuning) as named arguments in the `...` slot.

The second is mixing tunable and non-tunable workflows under `fn = "tune_grid"`. The non-tunable ones still work; tune treats them as a one-row grid and returns a single resample fit. That is usually fine, but the output shape for those rows differs from a real tuned row, so beware when downstream code assumes every result has tunable parameters.

The third is non-reproducible runs. `workflow_map(ws, "tune_grid", resamples = folds)` picks a fresh seed each call. To get the same numbers next time, pass `seed = <integer>` explicitly. Setting `set.seed()` outside the call does not lock in the result column because the map resets the RNG internally before fitting.

[WARNING]
**Calling workflow_map() with the function itself fails.** `workflow_map(ws, tune_grid, ...)` errors because the `fn` argument expects a character string. Pass `"tune_grid"` quoted; the dispatch happens inside workflowsets.

## Try it yourself

**Try it:** Map `fit_resamples()` across a workflow set with one linear model and one decision tree on `mtcars`. Use 3-fold cross-validation and rank by rmse.

```r title="Your turn: fit_resamples across two models"
# Try it: workflow_map with fit_resamples
library(tidymodels)
library(workflowsets)

ex_rec <- recipe(mpg ~ ., data = mtcars)
ex_lm <- linear_reg() |> set_engine("lm")
ex_dt <- decision_tree(mode = "regression") |> set_engine("rpart")

ex_ws <- # your code here, build a workflow_set
ex_folds <- vfold_cv(mtcars, v = 3)

ex_res <- # your code here, run workflow_map on ex_ws
rank_results(ex_res, rank_metric = "rmse", select_best = TRUE)
#> Expected: 4 rows (2 workflows x 2 metrics, ranked)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ws <- workflow_set(
  preproc = list(base = ex_rec),
  models  = list(lm = ex_lm, dt = ex_dt)
)

ex_res <- ex_ws |>
  workflow_map("fit_resamples", resamples = ex_folds, seed = 1)

rank_results(ex_res, rank_metric = "rmse", select_best = TRUE)
#> # A tibble: 4 x 9
#>   wflow_id .config       .metric  mean std_err     n preprocessor model           rank
#>   <chr>    <chr>         <chr>   <dbl>   <dbl> <int> <chr>        <chr>          <int>
#> 1 base_lm  Preprocessor~ rmse    2.97  0.412       3 recipe       linear_reg         1
#> 2 base_dt  Preprocessor~ rmse    3.62  0.521       3 recipe       decision_tree      2
```

**Explanation:** `workflow_set()` builds the unfit candidates, `workflow_map()` fits each on the same 3 folds, and `rank_results()` collapses the populated `result` column into a ranked tibble.

</details>

## Related workflowsets and tidymodels functions

**workflow_map() sits in the middle of a small but tightly coupled toolset.** Each function below has a dedicated job, and the four together cover the full set-then-fit-then-rank loop.

- `workflow_set()` builds the candidate tibble that `workflow_map()` consumes; see [workflowsets workflow_set in R](workflowsets-workflow_set-in-R.html).
- `rank_results()` ranks the populated workflow set by a metric.
- `tune_grid()` is the per-workflow tuner that `workflow_map()` calls under `fn = "tune_grid"`.
- `fit_resamples()` is the per-workflow resampler that `workflow_map()` calls under `fn = "fit_resamples"`.
- `autoplot()` for `workflow_set` plots ranked metrics with error bars.

External reference: [workflowsets package documentation](https://workflowsets.tidymodels.org/).

## FAQ

**What does workflow_map() do in R?**

`workflow_map()` applies one fitting function (`fit_resamples`, `tune_grid`, or `tune_bayes`) to every workflow in a `workflow_set` and stores each fit's tune result in the set's `result` column. You name the function as a character string and pass that function's arguments (`resamples`, `grid`, `metrics`, `control`) via `...`. The set goes in unfit and comes out with the result column populated, ready to feed into `rank_results()`, `collect_metrics()`, or `autoplot()`.

**How do I fit every workflow in a workflow set on the same resamples?**

Pipe the set into `workflow_map("fit_resamples", resamples = your_folds, seed = 1)`. The string `"fit_resamples"` tells workflow_map which tune function to dispatch to per row. The `resamples` argument forwards to each call. The `seed` argument fixes the RNG so every workflow sees the same fold order. The return value is the same workflow set with each row's `result` slot filled with a `resample_results` object.

**What is the difference between workflow_map() and tune_grid()?**

`tune_grid()` tunes one workflow at a time. `workflow_map()` is the loop that calls `tune_grid()` (or `fit_resamples()`, or `tune_bayes()`) once per row of a workflow set. Use `tune_grid()` directly when you have a single candidate workflow; use `workflow_map()` when you have two or more candidates and want them scored on identical resamples with consistent metrics in one call.

**Can workflow_map() run in parallel?**

Yes, register a parallel backend with the `future` package before calling it. `library(future); plan(multisession)` enables parallel resampling across folds; the gains are largest when each workflow has many folds or a wide tuning grid. The workflowsets package respects the same parallel hooks as `tune_grid()` itself.

**How do I get reproducible results from workflow_map()?**

Pass `seed = <integer>` to `workflow_map()`. The seed is set once before the loop, so every workflow sees the same bootstrap order and the same fold order. Calling `set.seed()` outside the call does not lock the result column because `workflow_map()` resets the RNG internally before fitting.
