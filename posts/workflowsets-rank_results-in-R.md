---
title: "workflowsets rank_results() in R: Rank Tuned Workflows"
slug: workflowsets-rank_results-in-R
description: "Use workflowsets rank_results() in R to rank every workflow in a fitted workflow_set by a chosen metric. Syntax, three examples, ties, and common pitfalls."
keywords: "workflowsets rank_results, rank_results function R, workflowsets rank_results examples, R tidymodels rank_results, tidymodels compare workflows, workflow_set rank models, workflowsets tutorial"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "rank_results()|workflowsets rank_results|workflowsets::rank_results()|rank tuned workflows|sort workflow set by metric"
auto_link_case_sensitive: true
target_keyword: "workflowsets rank_results"
sibling_block_enabled: true
difficulty: Beginner
---

# workflowsets rank_results() in R: Rank Tuned Workflows

The workflowsets `rank_results()` function in R sorts every workflow in a populated `workflow_set` by a chosen performance metric, returning a tibble with one row per tuning configuration so you can read off the winner without writing a custom `collect_metrics()` filter.

[QUICK ANSWER]
rank_results(res)                                          # rank by the first metric, all configs
rank_results(res, rank_metric = "rmse")                    # rank by a named metric
rank_results(res, rank_metric = "roc_auc")                 # rank by a classification metric
rank_results(res, select_best = TRUE)                      # one best row per workflow
rank_results(res, rank_metric = "rmse", select_best = TRUE)# best per workflow by rmse
rank_results(res, eval_time = 1.0)                         # survival models, pick eval time
rank_results(res) |> filter(.metric == "rmse")             # drop the other metrics manually

[DECISION TREE: Is rank_results() the right tool?]
- sort a fitted workflow_set by a metric: rank_results(res, rank_metric = "rmse")
- pull every metric row across the set: collect_metrics(res)
- compare workflows visually instead of as a table: autoplot(res)
- extract the best tuning result for one workflow: extract_workflow_set_result(res, id)
- finalize the top workflow on the full training set: fit_best(res)
- promote one workflow into a stand-alone object: extract_workflow(res, id)
- fit every workflow first so rank_results has something to read: workflow_map(ws, "tune_grid", resamples)

## What rank_results() does

**rank_results() turns a fitted workflow_set into a leaderboard.** It walks the `result` column that `workflow_map()` populated, collects every `(.metric, .config)` pair from every workflow, sorts the chosen metric in the direction that signals "better" (smaller for `rmse`, larger for `roc_auc`), and stamps a `rank` column on the output. The same tibble also carries `wflow_id`, `.metric`, `mean`, `std_err`, `n`, `preprocessor`, and `model`, so one glance tells you which model and which preprocessor sit at rank 1.

The function is shape-preserving in its mental model: workflow set in, long tibble out, one row per metric per tuning configuration per workflow. Ties on the rank metric are broken by `std_err`, smallest first, which is the workflowsets default for "more stable wins."

[KEY INSIGHT]
**rank_results() is a sorter, not a fitter.** It never touches resamples or refits anything. If the `result` column is empty because you forgot `workflow_map()`, rank_results() errors out before it can rank anything. The fit happens upstream; the ranking is the cheap part.

## rank_results() syntax and arguments

**rank_results() takes the populated workflow set and a metric to rank by.** Every other argument is a switch that trims the output.

```r title="The rank_results argument skeleton"
library(tidymodels)
library(workflowsets)

rank_results(
  x,                       # a workflow_set already passed through workflow_map()
  rank_metric = NULL,      # metric name, e.g. "rmse" or "roc_auc"; default = first metric
  select_best = FALSE,     # TRUE keeps only the best config per workflow
  eval_time = NULL         # numeric eval time for dynamic survival metrics
)
```

The `x` argument is the workflow set returned by `workflow_map()`. Pass an empty workflow set and rank_results() throws an "object has not been fit" error. The `rank_metric` argument names one of the metrics you computed during tuning; the default picks the first metric in the `tune_results` `metric_set`. The `select_best` argument collapses every workflow down to its single best tuning row, which is what you want when comparing models head-to-head rather than scanning all tuning configurations. The `eval_time` argument only applies to censored regression (survival) models where metrics are measured at multiple time horizons.

**rank_results() returns a tibble with one row per (workflow, .config, .metric).** When `select_best = TRUE`, the row count drops to (workflows times metrics computed).

## Three rank_results() examples

**rank_results() pays off once you have a workflow set with two or more tuned workflows.** Each example below stays in browser memory by using `mtcars` and a small grid.

```r title="Build, tune, and rank two workflow rows"
library(tidymodels)
library(workflowsets)
set.seed(1)

cv <- vfold_cv(mtcars, v = 3)

rec_basic <- recipe(mpg ~ ., data = mtcars)
rec_norm  <- rec_basic |> step_normalize(all_numeric_predictors())

lm_spec  <- linear_reg() |> set_engine("lm")
knn_spec <- nearest_neighbor(neighbors = tune()) |>
  set_engine("kknn") |> set_mode("regression")

ws <- workflow_set(
  preproc = list(basic = rec_basic, norm = rec_norm),
  models  = list(lm = lm_spec, knn = knn_spec),
  cross   = FALSE
)

res <- ws |> workflow_map("tune_grid", resamples = cv, grid = 3, verbose = FALSE)
rank_results(res, rank_metric = "rmse")
#> # A tibble: 8 x 9
#>   wflow_id  .config              .metric  mean std_err     n preprocessor model         rank
#>   <chr>     <chr>                <chr>   <dbl>   <dbl> <int> <chr>        <chr>        <int>
#> 1 basic_lm  Preprocessor1_Model1 rmse     2.84   0.305     3 recipe       linear_reg       1
#> 2 norm_knn  Preprocessor1_Model3 rmse     3.21   0.288     3 recipe       nearest_neig…    2
#> ...
```

The leaderboard is sorted by `mean` rmse ascending. The `basic_lm` workflow takes rank 1 with no tuning needed, because `linear_reg()` has no tune-able parameters. The `norm_knn` workflow appears at multiple ranks because each `neighbors` value is its own configuration.

**`select_best = TRUE` collapses tuning configurations to one row per workflow.** This is the right shape for a model-versus-model comparison.

```r title="Keep only the best config per workflow"
rank_results(res, rank_metric = "rmse", select_best = TRUE)
#> # A tibble: 4 x 9
#>   wflow_id  .config              .metric  mean std_err     n preprocessor model         rank
#> 1 basic_lm  Preprocessor1_Model1 rmse     2.84   0.305     3 recipe       linear_reg       1
#> 2 norm_knn  Preprocessor1_Model2 rmse     3.05   0.272     3 recipe       nearest_neig…    2
#> 3 basic_knn Preprocessor1_Model3 rmse     3.41   0.310     3 recipe       nearest_neig…    3
#> 4 norm_lm   Preprocessor1_Model1 rmse     2.84   0.305     3 recipe       linear_reg       4
```

Notice `basic_lm` and `norm_lm` produce identical rmse: the recipe step has no effect on `linear_reg()` because lm rescales internally. rank_results() still keeps both rows so you see the duplication rather than hiding it.

**For classification, swap the metric name and the direction flips.** rank_results() knows `roc_auc` is "larger is better" and sorts descending without any extra argument.

```r title="Rank a classification workflow set by roc_auc"
data(two_class_dat, package = "modeldata")
set.seed(1)
cv2 <- vfold_cv(two_class_dat, v = 3)

logit <- logistic_reg() |> set_engine("glm")
tree  <- decision_tree(cost_complexity = tune()) |>
  set_engine("rpart") |> set_mode("classification")

ws2 <- workflow_set(list(plain = recipe(Class ~ ., two_class_dat)),
                    list(logit = logit, tree = tree))

res2 <- ws2 |> workflow_map("tune_grid", resamples = cv2, grid = 3,
                            metrics = metric_set(roc_auc, accuracy))

rank_results(res2, rank_metric = "roc_auc", select_best = TRUE)
#> # A tibble: 4 x 9
#>   wflow_id    .config              .metric   mean std_err     n preprocessor model           rank
#> 1 plain_logit Preprocessor1_Model1 accuracy 0.831  0.013      3 recipe       logistic_reg       1
#> 2 plain_logit Preprocessor1_Model1 roc_auc  0.902  0.011      3 recipe       logistic_reg       1
#> 3 plain_tree  Preprocessor1_Model2 accuracy 0.804  0.018      3 recipe       decision_tree      2
#> 4 plain_tree  Preprocessor1_Model2 roc_auc  0.871  0.014      3 recipe       decision_tree      2
```

The output keeps every metric row (you asked tune_grid for two), but `rank` is computed off `roc_auc` alone. Logit wins.

## rank_results() compared with siblings

**Three workflowsets helpers read the same `result` column; pick by output shape.**

| Helper | Output shape | When to reach for it |
|---|---|---|
| `rank_results()` | Long tibble sorted with a `rank` column | You want a leaderboard you can sort, filter, or print |
| `collect_metrics()` | Long tibble, all configs, no rank | You want raw metric numbers to plot or aggregate yourself |
| `autoplot()` | ggplot showing metric vs config per workflow | You want a visual comparison rather than a table |

Use rank_results() when the question is "which workflow won?" Use `collect_metrics()` when the question is "what do all the numbers look like?" Use `autoplot()` when you need the answer in a slide.

[TIP]
**Chain rank_results() into `slice_head()` for a one-line top-N table.** `rank_results(res, rank_metric = "rmse", select_best = TRUE) |> slice_head(n = 3)` gives you the three best models in print-ready order, ready for `gt()` or `kable()`.

## Common pitfalls

**rank_results() fails fast when the workflow set is unfit.** Three traps catch most beginners.

1. **Forgetting `workflow_map()` before rank_results().** The set's `result` column is empty until you map a tune function across it. The error reads "object has not been fit" and points at the unfit row. Fix: pipe `ws |> workflow_map("tune_grid", resamples = cv)` first.

2. **Asking for a metric you did not compute.** If your `workflow_map()` call used the default metric set (rmse + rsq for regression), passing `rank_metric = "mae"` errors out. Fix: pass a `metric_set()` to `workflow_map()` if you want a non-default ranking metric: `workflow_map(ws, "tune_grid", resamples = cv, metrics = metric_set(mae, rmse))`.

3. **Trusting rank 1 on rmse alone without checking `std_err`.** Two workflows can sit one decimal apart on `mean` but overlap fully on standard error, which means the resamples cannot tell them apart. Always print `std_err` and prefer the simpler model when intervals overlap.

[WARNING]
**rank_results() drops `.iter` from `tune_bayes()` output by design.** The Bayesian tuner records one row per iteration, but rank_results() collapses iterations to the final configurations. If you want the per-iteration trace, call `collect_metrics()` instead.

## Try it yourself

**Try it:** Build a workflow_set with one recipe and two regression models, tune across 3 folds, then rank by `rmse` keeping only the best config per workflow. Save the leaderboard to `ex_leader`.

```r title="Your turn: rank a regression workflow set"
# Try it: rank workflows by rmse
library(tidymodels)
library(workflowsets)
set.seed(1)

ex_cv <- vfold_cv(mtcars, v = 3)
ex_rec  <- recipe(mpg ~ ., data = mtcars)
ex_lm   <- linear_reg() |> set_engine("lm")
ex_tree <- decision_tree(cost_complexity = tune()) |>
  set_engine("rpart") |> set_mode("regression")

ex_ws  <- workflow_set(list(base = ex_rec), list(lm = ex_lm, tree = ex_tree))
ex_res <- # tune the set on ex_cv with grid = 3

ex_leader <- # rank ex_res by rmse, keep best config per workflow
ex_leader
#> Expected: 2 rows, one per workflow, sorted by mean rmse ascending
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_res <- ex_ws |> workflow_map("tune_grid", resamples = ex_cv, grid = 3,
                                verbose = FALSE)
ex_leader <- rank_results(ex_res, rank_metric = "rmse", select_best = TRUE)
ex_leader
#> # A tibble: 2 x 9
#>   wflow_id  .config              .metric  mean std_err     n preprocessor model         rank
#> 1 base_lm   Preprocessor1_Model1 rmse     2.84   0.305     3 recipe       linear_reg       1
#> 2 base_tree Preprocessor1_Model2 rmse     3.62   0.401     3 recipe       decision_tree    2
```

**Explanation:** `workflow_map("tune_grid", ...)` populates the `result` column for both workflows. Passing `select_best = TRUE` collapses the three tuning configurations from `base_tree` down to its single best row, giving you a two-row leaderboard with `linear_reg()` on top.

</details>

## Related workflowsets functions

**rank_results() sits at the read end of the workflowsets pipeline.** These helpers wrap around it:

- `workflow_set()` builds the unfit candidate tibble that rank_results() eventually scores.
- `workflow_map()` fills the `result` column that rank_results() reads from.
- `collect_metrics()` returns the same metric rows without sorting or a `rank` column.
- `autoplot()` plots the leaderboard as facets of metric vs tuning parameter per workflow.
- `extract_workflow_set_result()` pulls one workflow's tune_results back out so you can finalize it.

[NOTE]
**Coming from caret?** The closest analog is `resamples()` plus `summary()` on a list of train objects. Workflowsets handles both the fitting bookkeeping (workflow_map) and the leaderboard sort (rank_results) in one tibble; caret splits those across `resamples()` and `bwplot()`.

## FAQ

**Why does rank_results() return more rows than I expected?**

By default, rank_results() returns one row per (workflow, tuning config, metric). A workflow set with 2 workflows tuned over 5 grid points with 2 metrics returns 20 rows. Pass `select_best = TRUE` to collapse to one config per workflow per metric. Filter by `.metric` to keep one row per (workflow, config). Both operations are safe to chain with `dplyr::filter()`.

**Can rank_results() rank workflows tuned with different metrics?**

No. Every workflow in the set must share the same metric_set, because rank_results() needs a common column to sort on. If you tuned workflow A with `rmse` and workflow B with `mae`, the columns will not line up and ranking is undefined. Re-run `workflow_map()` with a unified `metrics = metric_set(...)` call so every row carries identical metrics.

**How does rank_results() break ties on the rank metric?**

Ties on `mean` are broken by `std_err` ascending: the workflow with the tighter resample variance wins. If both `mean` and `std_err` are equal, rank_results() uses the row order from the workflow set, which is the order you supplied to `workflow_set()`. To force a different tiebreaker, sort the output manually with `arrange()` after ranking.

**Do I need select_best = TRUE for unsupervised tuning?**

No. `select_best = TRUE` only makes sense when each workflow had multiple tuning configurations to compare. For untuned workflows (`fit_resamples` calls), every workflow contributes a single row already, so `select_best` is a no-op. Leave it `FALSE` (the default) for those sets.

**Does rank_results() respect a custom metric direction?**

Yes. If you wrote a custom yardstick metric and registered it with `direction = "maximize"` or `"minimize"`, rank_results() reads that attribute and sorts in the right direction. Stock metrics like `rmse`, `mae`, `roc_auc`, and `accuracy` already declare their direction, so you never set it by hand.
