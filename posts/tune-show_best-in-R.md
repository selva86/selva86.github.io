---
title: "tune show_best() in R: Inspect Top Tuning Results"
slug: tune-show_best-in-R
description: "tune show_best() in R returns the top hyperparameter combinations from tuning results. Covers metric selection, n, std_err, the one-SE rule, and select_best."
keywords: "tune show_best, show_best function R, tune show_best examples, show_best tidymodels, tune results top models, R show_best metric, tune package show_best"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "show_best()|tune show_best|tune::show_best()|show top tuning results|tune leaderboard"
auto_link_case_sensitive: true
target_keyword: "tune show_best"
sibling_block_enabled: true
difficulty: Beginner
---

# tune show_best() in R: Inspect Top Tuning Results

<p class="lead">The tune <code>show_best()</code> function in R returns the top hyperparameter combinations from a tuning run, ranked by a metric you choose. You pass a tuning result object and ask for the best n rows, sorted by accuracy, RMSE, ROC AUC, or any metric you collected.</p>

[QUICK ANSWER]
show_best(tune_res)                              # default: top 5 by first metric
show_best(tune_res, metric = "rmse")             # rank by RMSE
show_best(tune_res, metric = "roc_auc", n = 10)  # top 10 by ROC AUC
show_best(tune_res, metric = "accuracy", n = 1)  # single best row
show_best(tune_res, std_err = 1)                 # one-SE rule rows
show_best(race_res, eval_time = 5)               # survival models, time-indexed
select_best(tune_res, metric = "rmse")           # only the winning params

[DECISION TREE: Is show_best() the right tool?]
- inspect top N tuned params: show_best(tune_res, metric = "rmse")
- pick one row to finalize: select_best(tune_res, metric = "rmse")
- get every row of metrics: collect_metrics(tune_res)
- get raw fold predictions: collect_predictions(tune_res)
- plot the metric surface: autoplot(tune_res)
- finalize a workflow from a pick: finalize_workflow(wf, best_params)

## What show_best() does

**show_best() ranks the metric table of a tuning result and returns the top rows.** A call to `tune_grid()`, `tune_bayes()`, or `tune_race_anova()` produces a tibble of resampling metrics. `show_best()` aggregates folds, sorts by your chosen metric, and returns the top n rows so you can read the leaderboard at a glance.

The output is a tidy tibble with one row per hyperparameter combination. Columns include the tuned parameters, the metric name, the mean across folds, the standard error, the resample count, and a `.config` label. Nothing in the original tuning object is mutated.

Because `show_best()` is meant for inspection, it is the function you reach for first after `tune_grid()` finishes. Hand the same object to `select_best()` or `finalize_workflow()` to lock the winning settings in.

[KEY INSIGHT]
**show_best() is the human-readable summary, select_best() is the machine pick.** Both read the same metric table, but `show_best()` returns multiple rows with standard errors while `select_best()` returns one row ready for `finalize_workflow()`. Use them in sequence.

[NOTE]
**show_best() lives in tune and is re-exported by tidymodels.** It dispatches on the result class, so the same call accepts objects from `tune_grid()`, `tune_bayes()`, `tune_race_anova()`, and `fit_resamples()`.

## show_best() syntax and arguments

**show_best() needs a tuning result and a metric, with row count optional.** Every other argument has a working default.

```r title="The show_best() argument skeleton"
show_best(
  x,                # a tune_results object from tune_grid(), tune_bayes(), etc.
  metric = NULL,    # which metric to rank by; default is the first collected
  n = 5,            # how many top rows to return
  eval_time = NULL, # for survival models with time-indexed metrics
  ...               # passed to underlying methods
)
```

The `x` argument is the tuning object itself. The `metric` argument names a single metric and must match one passed to `metric_set()`. The `n` argument controls how many rows you see; the default of 5 suits small grids, but raise it for large random or Bayesian searches.

**Direction is automatic.** Maximize-direction metrics like `roc_auc` and `accuracy` sort descending; minimize-direction metrics like `rmse` sort ascending. Each `yardstick` metric declares its own direction, so you never set it by hand.

## Use show_best() in four scenarios

**Every example below uses built-in R data.** `mtcars` drives the regression run and a factor version of `mtcars` drives the classification example, so nothing requires a download.

### Example 1: Inspect the top RMSE rows from tune_grid()

**Run a small grid, then pass the result to show_best().** A `rand_forest()` spec with two tunable parameters keeps the run fast.

```r title="Tune a random forest and rank by RMSE"
library(tidymodels)
set.seed(42)

cars_split <- initial_split(mtcars, prop = 0.75)
cars_train <- training(cars_split)

rf_spec <- rand_forest(mtry = tune(), trees = tune()) |>
  set_engine("ranger") |>
  set_mode("regression")

rf_wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(rf_spec)

folds <- vfold_cv(cars_train, v = 3)

rf_grid <- expand.grid(mtry = c(2, 4, 6), trees = c(100, 500))

rf_res <- tune_grid(
  rf_wf,
  resamples = folds,
  grid = rf_grid,
  metrics = metric_set(rmse, rsq)
)

show_best(rf_res, metric = "rmse")
#> # A tibble: 5 x 8
#>    mtry trees .metric .estimator  mean     n std_err .config
#>   <dbl> <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1     4   500 rmse    standard    2.61     3   0.342 Preprocessor1_Model05
#> 2     2   500 rmse    standard    2.65     3   0.397 Preprocessor1_Model04
#> 3     4   100 rmse    standard    2.71     3   0.388 Preprocessor1_Model02
#> 4     6   500 rmse    standard    2.74     3   0.355 Preprocessor1_Model06
#> 5     2   100 rmse    standard    2.79     3   0.412 Preprocessor1_Model01
```

The output ranks five combinations by mean RMSE across the three folds. The `.config` column gives each combination a stable label for cross-referencing in `collect_metrics()` later.

### Example 2: Rank classification results by ROC AUC

**Switch the spec to logistic_reg() and ask for a different metric.** The same `show_best()` call works for classification once the metric set includes a class-probability metric.

```r title="Rank classification results by ROC AUC"
cars_cls <- mtcars
cars_cls$am <- factor(cars_cls$am, labels = c("auto", "manual"))

cls_spec <- logistic_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet") |>
  set_mode("classification")

cls_wf <- workflow() |>
  add_formula(am ~ mpg + hp + wt) |>
  add_model(cls_spec)

cls_folds <- vfold_cv(cars_cls, v = 3)

cls_grid <- expand.grid(
  penalty = c(0.001, 0.01, 0.1),
  mixture = c(0, 0.5, 1)
)

cls_res <- tune_grid(
  cls_wf,
  resamples = cls_folds,
  grid = cls_grid,
  metrics = metric_set(roc_auc, accuracy)
)

show_best(cls_res, metric = "roc_auc", n = 3)
#> # A tibble: 3 x 8
#>   penalty mixture .metric .estimator  mean     n std_err .config
#>     <dbl>   <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1   0.01      0.5 roc_auc binary     0.946     3  0.0312 Preprocessor1_Model05
#> 2   0.001     0   roc_auc binary     0.939     3  0.0287 Preprocessor1_Model01
#> 3   0.1       1   roc_auc binary     0.928     3  0.0421 Preprocessor1_Model09
```

ROC AUC is a maximize-direction metric, so the highest value lands at the top. The `n = 3` argument keeps the table compact for a wide grid.

### Example 3: Apply the one standard error rule

**Pass std_err = 1 to filter for parameters within one standard error of the best.** The one-SE rule trades a small amount of metric performance for a simpler model.

```r title="Use the one standard error rule"
show_best(
  rf_res,
  metric = "rmse",
  n = 5,
  std_err = 1
)
#> # A tibble: 5 x 8
#>    mtry trees .metric .estimator  mean     n std_err .config
#>   <dbl> <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1     4   500 rmse    standard    2.61     3   0.342 Preprocessor1_Model05
#> 2     2   500 rmse    standard    2.65     3   0.397 Preprocessor1_Model04
#> 3     4   100 rmse    standard    2.71     3   0.388 Preprocessor1_Model02
#> 4     6   500 rmse    standard    2.74     3   0.355 Preprocessor1_Model06
#> 5     2   100 rmse    standard    2.79     3   0.412 Preprocessor1_Model01
```

With `std_err = 1`, only rows whose mean sits within one standard error of the leader are returned. On a tight grid every row often qualifies, so the effect appears on noisier searches where the leader is not statistically distinct from cheaper alternatives.

### Example 4: Chain show_best() into finalize_workflow()

**show_best() is for reading; pair it with select_best() and finalize_workflow() for writing.** The pattern is inspect, pick, finalize.

```r title="Inspect, then finalize the workflow"
show_best(rf_res, metric = "rmse", n = 3)

best_rf <- select_best(rf_res, metric = "rmse")
best_rf
#> # A tibble: 1 x 3
#>    mtry trees .config
#>   <dbl> <dbl> <chr>
#> 1     4   500 Preprocessor1_Model05

final_wf <- finalize_workflow(rf_wf, best_rf)

final_fit <- last_fit(final_wf, cars_split)

collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric .estimator .estimate .config
#>   <chr>   <chr>          <dbl> <chr>
#> 1 rmse    standard       3.10  Preprocessor1_Model1
#> 2 rsq     standard       0.741 Preprocessor1_Model1
```

Calling `show_best()` first confirms the leaderboard before locking in `select_best()`. `finalize_workflow()` then substitutes the winning parameters, and `last_fit()` trains on the full training set and scores the held-out split in one step.

[TIP]
**Always name metric explicitly even with a single metric collected.** Adding a second metric to `metric_set()` later silently changes the default sort. Naming the metric makes the call self-documenting and immune to that change.

## Compare show_best() with select_best() and collect_metrics()

**show_best() is one of three inspection verbs in tune.** Each one reads the same metric table but gives you a different slice.

| Function | Returns | Rows | Use when |
|---|---|---|---|
| `show_best()` | tibble with metric, mean, std_err | top n by metric | Reading the leaderboard, comparing nearby configs |
| `select_best()` | tibble with parameters only | exactly 1 | Finalizing a workflow with the winner |
| `collect_metrics()` | tibble with all metrics, all configs | all rows | Custom analysis, plotting, or alternative sorts |

The decision mirrors the workflow stages. Use `show_best()` while exploring results, switch to `select_best()` once you have settled on a metric, and fall back to `collect_metrics()` for custom sorting or plotting.

## Common pitfalls

**Three mistakes catch most newcomers to show_best().** Each one below shows the symptom and the fix.

The most common is asking for a metric the tuning run never collected. `show_best()` checks the metric name against the run's metric set and stops with an error if it does not match.

```r title="The metric name must match metric_set()"
# Wrong: rsq was not in metric_set(rmse, rsq) - actually OK, but asking for mae fails
show_best(rf_res, metric = "mae")
#> Error in `show_best()`:
#> ! "mae" was not in the metric set. Please choose from: "rmse", "rsq"

# Right: pick a metric that was collected
show_best(rf_res, metric = "rsq")
```

The second pitfall is calling `show_best()` on a `fit_resamples()` object and expecting parameter columns. Resampling without tuning produces metric rows but no hyperparameters, so only `.config` and metric columns appear. The third is forgetting the function aggregates across folds: the `mean` column is a fold average, not a single observation.

[WARNING]
**show_best() will not warn you when n exceeds the row count.** If you ask for `n = 50` and only 12 hyperparameter combinations exist, you get all 12 rows back with no message. Always cross-check against `nrow(collect_metrics(tune_res))` when the count matters.

## Try it yourself

**Try it:** Tune a `decision_tree()` spec on `mtcars` over `tree_depth` values 3, 5, and 7, then return the top 2 rows ranked by RMSE. Save the leaderboard to `ex_best`.

```r title="Your turn: tune and inspect"
# Try it: tune a decision tree and show top 2 rows
library(tidymodels)
set.seed(123)

dt_spec <- decision_tree(tree_depth = tune()) |>
  set_engine("rpart") |>
  set_mode("regression")

dt_wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(dt_spec)

dt_folds <- vfold_cv(mtcars, v = 3)
dt_grid  <- tibble(tree_depth = c(3, 5, 7))

dt_res <- tune_grid(dt_wf, resamples = dt_folds, grid = dt_grid,
                    metrics = metric_set(rmse))

ex_best <- # your code here

ex_best
#> Expected: a 2-row tibble sorted by mean RMSE ascending
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_best <- show_best(dt_res, metric = "rmse", n = 2)

ex_best
#> # A tibble: 2 x 7
#>   tree_depth .metric .estimator  mean     n std_err .config
#>        <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1          5 rmse    standard    3.42     3   0.401 Preprocessor1_Model2
#> 2          3 rmse    standard    3.55     3   0.388 Preprocessor1_Model1
```

**Explanation:** `show_best()` aggregates the per-fold RMSE values into a mean for each `tree_depth`, then returns the two rows with the lowest mean. The standard error column shows how stable each estimate is across the three folds.

</details>

## Related tune functions

**show_best() works alongside the rest of the tune inspection and finalization API.** These functions cover the neighboring steps in a tuning project.

- `select_best()` returns the single winning hyperparameter row for finalization.
- `collect_metrics()` returns every metric row across every configuration and fold.
- `collect_predictions()` returns the raw out-of-fold predictions for diagnostics.
- `autoplot()` visualizes the metric surface across the tuning grid automatically.
- `finalize_workflow()` substitutes a parameter pick into a workflow for the final fit.

## FAQ

**What does show_best() return in R?**

`show_best()` returns a tibble with the top n hyperparameter combinations ranked by your chosen metric. Each row holds the tuned parameter values, the metric name, the mean across resamples, the standard error, the fold count, and a `.config` label. The tibble is sorted automatically: descending for metrics like `roc_auc`, ascending for metrics like `rmse`. The source tuning object is untouched, so you can call `show_best()` repeatedly with different metrics.

**What is the difference between show_best() and select_best()?**

Both functions read the same tuning result, but return different shapes. `show_best()` returns up to n rows with parameters, the metric mean, and the standard error so you can compare nearby configurations. `select_best()` returns exactly one row containing only the parameter columns, ready for `finalize_workflow()`. The usual flow is `show_best()` first for human inspection, then `select_best()` once you have chosen a metric.

**How do I rank by multiple metrics in show_best()?**

You cannot. `show_best()` accepts a single metric name and sorts on it alone. To compare configurations across several metrics, use `collect_metrics()`, which returns one row per metric per configuration in long format. Pivot wide and sort on your own composite criterion if needed. The single-metric rule keeps `show_best()` deterministic and avoids ambiguity about ties.

**Why does show_best() say my metric is not in the metric set?**

The error fires when the name passed to `metric` does not match any metric in the `metric_set()` you supplied to `tune_grid()`. Common causes are typos like `"r2"` instead of `"rsq"`, or assuming a default like `mae` is always available. Inspect collected metrics with `unique(collect_metrics(tune_res)$.metric)`, then call `show_best()` with one of those exact strings.

**Does show_best() work with tune_bayes() and racing methods?**

Yes. `show_best()` dispatches on the class of the tuning object and has methods for results from `tune_grid()`, `tune_bayes()`, `tune_race_anova()`, `tune_race_win_loss()`, and `fit_resamples()`. The output format is identical across these, so it is the universal first stop after tuning. For racing methods, only configurations that survived the race appear, which is the intended behavior.

For the full argument reference, see the [tune show_best() documentation](https://tune.tidymodels.org/reference/show_best.html).
