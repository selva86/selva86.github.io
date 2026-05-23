---
title: "workflowsets workflow_set() in R: Compare Models at Once"
slug: workflowsets-workflow_set-in-R
description: "Use workflowsets workflow_set() in R to bundle multiple preprocessors and parsnip models into one tibble. Syntax, four examples, cross vs paired, pitfalls."
keywords: "workflowsets workflow_set, workflow_set function R, workflowsets workflow_set examples, R compare models tidymodels, tidymodels workflow_set, workflow_set parsnip, workflowsets tutorial"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "workflow_set()|workflowsets workflow_set|workflowsets::workflow_set()|bundle workflows into one tibble|compare workflows side by side"
auto_link_case_sensitive: true
target_keyword: "workflowsets workflow_set"
sibling_block_enabled: true
difficulty: Beginner
---

# workflowsets workflow_set() in R: Compare Models at Once

<p class="lead">The workflowsets <code>workflow_set()</code> function in R bundles a list of preprocessors and a list of parsnip model specs into a single tibble, where each row is one fully formed workflow. Pass that tibble to <code>workflow_map()</code> to fit, resample, or tune every combination in one call and compare them with <code>rank_results()</code> or <code>autoplot()</code>.</p>

[QUICK ANSWER]
workflow_set(preproc = list(rec = rec), models = list(lm = lm_spec))     # one preproc, one model
workflow_set(list(rec1 = rec1, rec2 = rec2), list(lm = lm_spec))         # 2 preprocs x 1 model
workflow_set(list(rec = rec), list(lm = lm_spec, rf = rf_spec))          # 1 preproc x 2 models
workflow_set(list(rec1, rec2), list(lm, rf), cross = TRUE)               # full 2x2 grid
workflow_set(list(rec1, rec2), list(lm, rf), cross = FALSE)              # paired element-wise
extract_workflow(ws, id = "rec_lm")                                      # pull one workflow out

[DECISION TREE: Is workflow_set() the right tool?]
- compare multiple preprocessor/model combos in one tibble: workflow_set(preprocs, models)
- attach a single model to a single workflow: workflow() |> add_model(spec)
- attach a single recipe to a single workflow: workflow() |> add_recipe(rec)
- fit one workflow on resamples: fit_resamples(wf, resamples)
- tune one workflow's hyperparameters: tune_grid(wf, resamples, grid)
- map fit/tune across a workflow set: workflow_map(ws, "tune_grid", resamples)
- pull one fitted workflow back out of a set: extract_workflow_set_result(ws, id)

## What workflow_set() does

**workflow_set() turns a Cartesian product of preprocessors and model specs into a tibble of workflows.** It does not fit anything. It records every (preprocessor, model) pair as one row, generates a stable `wflow_id` for each row from the names you supplied, and returns a tibble that subsequent functions in the workflowsets package know how to map over. The actual call to each engine happens later when you pipe the set into `workflow_map()`.

This shape is what makes model comparison painless. Instead of writing one `workflow()` per candidate and one `fit_resamples()` per workflow, you list the preprocessors once, list the models once, and let the set carry the bookkeeping. Resampling, tuning, ranking, and plotting all read from the same tibble.

[KEY INSIGHT]
**A workflow set is a tibble of unfit workflows, not a model.** The `info` column holds each workflow object as a list-column, and the `result` column starts empty. `workflow_map()` writes resampling or tuning results into `result` row by row, so the set grows in place rather than producing a separate fit object per candidate.

## workflow_set() syntax and arguments

**workflow_set() takes a named list of preprocessors and a named list of model specs.** Four arguments, and most calls use only the first two.

```r title="The workflow_set argument skeleton"
library(tidymodels)
library(workflowsets)

workflow_set(
  preproc,              # named list of preprocessors (recipes, formulas, or variable lists)
  models,               # named list of parsnip model specs
  cross = TRUE,         # TRUE = cross-join all combos, FALSE = pair element-wise
  case_weights = NULL   # optional column for case weights, passed to each workflow
)
```

The `preproc` argument accepts recipes, formulas, or `workflow_variables()` calls; each entry must be named because the names become the left half of every `wflow_id`. The `models` argument accepts parsnip specs (unfit), one per entry, also named. The `cross` argument decides whether you get every preprocessor crossed with every model (the default and most common case) or whether the two lists are zipped pairwise (rare, but useful when each preprocessor only makes sense with one model). The `case_weights` argument names a column from your training data that should be passed to each fit as importance weights.

**workflow_set() returns a tibble with class `workflow_set`.** Columns are `wflow_id` (character), `info` (list of one-row tibbles holding the workflow and metadata), `option` (list of saved options for workflow_map), and `result` (list, empty until workflow_map populates it).

[NOTE]
**Workflow ids are deterministic, not random.** Each id is `<preproc_name>_<model_name>`, so the same call always produces the same ids. That stability matters when you later filter the set by id, join it to a grid of hyperparameters, or compare runs across sessions.

## Four examples of workflow_set() in action

**workflow_set() shines when you want a small grid of candidates compared on the same resamples.** The examples below all use `mtcars` so they run quickly in the browser.

```r title="Setup with two recipes and two model specs"
library(tidymodels)
library(workflowsets)
set.seed(1)

data(mtcars)
mtcars$cyl <- factor(mtcars$cyl)

rec_basic <- recipe(mpg ~ ., data = mtcars) |>
  step_dummy(all_nominal_predictors())

rec_norm <- rec_basic |>
  step_normalize(all_numeric_predictors())

lm_spec <- linear_reg() |> set_engine("lm")
rf_spec <- rand_forest(trees = 200) |> set_engine("ranger") |> set_mode("regression")
```

The first example crosses both recipes with both specs into a 2 by 2 grid. Use this when you want to ask, in one shot, which preprocessor pairs best with which model.

```r title="Cross-join: 2 recipes x 2 models = 4 workflows"
ws_cross <- workflow_set(
  preproc = list(basic = rec_basic, norm = rec_norm),
  models  = list(lm = lm_spec, rf = rf_spec),
  cross   = TRUE
)
ws_cross
#> # A workflow set/tibble: 4 x 4
#>   wflow_id  info             option    result    
#>   <chr>     <list>           <list>    <list>    
#> 1 basic_lm  <tibble [1 x 4]> <opts[0]> <list [0]>
#> 2 basic_rf  <tibble [1 x 4]> <opts[0]> <list [0]>
#> 3 norm_lm   <tibble [1 x 4]> <opts[0]> <list [0]>
#> 4 norm_rf   <tibble [1 x 4]> <opts[0]> <list [0]>
```

The second example zips the two lists pairwise with `cross = FALSE`. Two preprocessors, two models, two workflows. Use this when normalisation only matters for the linear model and the basic recipe only makes sense for the random forest.

```r title="Paired: 2 recipes x 2 models = 2 workflows"
ws_paired <- workflow_set(
  preproc = list(basic = rec_basic, norm = rec_norm),
  models  = list(rf = rf_spec, lm = lm_spec),
  cross   = FALSE
)
nrow(ws_paired)
#> [1] 2
ws_paired$wflow_id
#> [1] "basic_rf" "norm_lm"
```

The third example fits every workflow in the cross set on 5-fold cross-validation in one `workflow_map()` call. The verb string `"fit_resamples"` tells workflowsets which tune function to apply per row.

```r title="Resample every workflow in the set at once"
folds <- vfold_cv(mtcars, v = 5)

ws_fit <- ws_cross |>
  workflow_map("fit_resamples", resamples = folds, verbose = FALSE)

rank_results(ws_fit, rank_metric = "rmse")
#> # A tibble: 8 x 9
#>   wflow_id .config       .metric mean std_err     n preprocessor model rank
#>   <chr>    <chr>         <chr>  <dbl>   <dbl> <int> <chr>        <chr> <int>
#> 1 norm_lm  Preprocessor1 rmse    2.62   0.218     5 recipe       line~     1
#> 2 norm_lm  Preprocessor1 rsq     0.842  0.030     5 recipe       line~     1
#> ...
```

The fourth example pulls one workflow out of the set by id, in case you want to refit it on the full data after picking the winner. `extract_workflow()` is the inverse of `add_model()` plus `add_recipe()`.

```r title="Pull a single workflow back out by id"
best_wf <- extract_workflow(ws_fit, id = "norm_lm")
class(best_wf)
#> [1] "workflow"
```

## workflow_set() compared with single workflows and caret

**workflow_set() is the multi-candidate sibling of workflow().** Reach for it the moment you have more than one candidate; stick with plain `workflow()` while you only have one.

| Tool | Returns | Best for |
|------|---------|----------|
| `workflow()` | one workflow object | a single preprocessor + single model |
| `workflow_set()` | a tibble of workflows | many candidates compared on the same resamples |
| `caret::train()` | a single `train` object | legacy code; one model at a time, no shared resamples |

The contrast with `caret::train()` is the headline: caret fits one model per call, so comparing five models means five `train()` calls and manual bookkeeping. `workflow_set()` plus `workflow_map()` does the same job in two lines, with shared folds, shared metric collection, and a single tibble of results.

## Common pitfalls

**Unnamed lists fail loudly.** Both `preproc` and `models` must be named lists. `workflow_set(list(rec_basic), list(lm_spec))` errors with "names attribute must be the same length as the vector." Always pass `list(basic = rec_basic, ...)` even for one element.

**Mixed problem types silently rank poorly.** If one model spec is `linear_reg()` and another is `logistic_reg()`, every row still builds, but the workflows expect different outcomes. `workflow_map()` will only error at fit time, not at construction. Keep one outcome type per set.

**Forgetting `cross = FALSE` produces n times m workflows.** Two preprocessors and three models gives six workflows by default. If you only intended pairs, the set quietly explodes to six and resampling time grows with it. Always state `cross` explicitly when the list lengths match.

[WARNING]
**workflow_map() requires resamples, not training data.** A common slip is passing `data = mtcars` instead of `resamples = folds`. The function will error with "argument resamples is missing." Build the rset first with `vfold_cv()`, `bootstraps()`, or `validation_split()` and pass that.

## Try it yourself

**Try it:** Build a workflow set that crosses a single recipe (`mpg ~ .` with dummy encoding) against three model specs: a linear regression, a random forest with 100 trees, and a boosted tree with 50 trees. Save the result to `ex_ws`. Confirm it contains three rows.

```r title="Your turn: workflow_set with three models"
# Try it: build a 1 x 3 workflow set
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_dummy(all_nominal_predictors())

ex_lm  <- linear_reg() |> set_engine("lm")
ex_rf  <- rand_forest(trees = 100) |> set_engine("ranger") |> set_mode("regression")
ex_bt  <- boost_tree(trees = 50)   |> set_engine("xgboost") |> set_mode("regression")

ex_ws <- # your code here

nrow(ex_ws)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ws <- workflow_set(
  preproc = list(rec = ex_rec),
  models  = list(lm = ex_lm, rf = ex_rf, bt = ex_bt),
  cross   = TRUE
)

nrow(ex_ws)
#> [1] 3
ex_ws$wflow_id
#> [1] "rec_lm" "rec_rf" "rec_bt"
```

**Explanation:** One preprocessor crossed with three models gives three rows. The ids combine the preprocessor name with each model name, so the order in the `models` list determines the order of `rec_lm`, `rec_rf`, `rec_bt`.

</details>

## Related workflowsets and tidymodels functions

- `workflow_map()`: apply `fit_resamples()`, `tune_grid()`, or `tune_bayes()` to every row of a workflow set in one call.
- `rank_results()`: sort the `result` column by a chosen metric, returning a long tibble ready for comparison.
- `autoplot.workflow_set()`: visualise metric distributions across all workflows on the same resamples.
- `extract_workflow()`: pull one workflow back out of the set by its `wflow_id`.
- `as_workflow_set()`: cast a list of already-built workflows into a workflow_set tibble.

See the workflowsets reference at [workflowsets.tidymodels.org](https://workflowsets.tidymodels.org/reference/workflow_set.html) for the full argument table and edge cases.

## FAQ

**What is the difference between workflow_set() and workflow()?**

`workflow()` produces a single workflow object holding one preprocessor and one model. `workflow_set()` produces a tibble of workflows, one row per (preprocessor, model) pair. Use `workflow()` when you have a single candidate and `workflow_set()` when you want to compare many candidates on the same resamples without writing the resampling and metric-collection code multiple times.

**Can workflow_set() handle hyperparameter tuning?**

Yes. Build the set with `workflow_set()`, then call `workflow_map("tune_grid", resamples = folds, grid = 10)`. Each row that contains a tunable parsnip spec gets its own tuning grid, and `collect_metrics()` or `rank_results()` aggregates across all rows. Pass a list of grids through the `option_add()` helper if different workflows need different grids.

**How do I extract the best workflow after fitting a set?**

Run `rank_results(ws_fit, rank_metric = "rmse")` to find the top `wflow_id`, then call `extract_workflow(ws_fit, id = "the_winner")` to pull that workflow back out as a normal `workflow` object. Refit it on the full training data with `last_fit()` or `fit()` before producing final predictions.

**Does cross = FALSE require equal-length preproc and models lists?**

Yes. When `cross = FALSE`, workflow_set zips the two lists element by element, so they must be the same length. Different lengths raise an error about mismatched dimensions. Set `cross = TRUE` (the default) whenever the lists differ in length, or pad the shorter list with repeated entries.

**Is workflow_set() faster than fitting models one at a time?**

The fit time per workflow is the same. The savings come from sharing one set of resamples across all candidates, eliminating duplicate metric-collection code, and getting parallel evaluation for free when you register a parallel backend with `doParallel::registerDoParallel()`. The bookkeeping savings are larger than the raw compute savings.
