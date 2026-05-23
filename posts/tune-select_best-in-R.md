---
title: "tune select_best() in R: Pick Top Hyperparameter Set"
slug: tune-select_best-in-R
description: "tune select_best() in R returns the single winning hyperparameter row from a tuning result, ready for finalize_workflow(). Covers metric, one-SE rule, pct loss."
keywords: "tune select_best, select_best function R, tune select_best examples, select_best tidymodels, R hyperparameter tuning select_best, tune package select_best, select_by_one_std_err"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "select_best()|tune select_best|tune::select_best()|pick best hyperparameter row|select_by_one_std_err"
auto_link_case_sensitive: true
target_keyword: tune select_best
sibling_block_enabled: true
difficulty: Beginner
---

# tune select_best() in R: Pick Top Hyperparameter Set

<p class="lead">The tune <code>select_best()</code> function in R returns the single winning hyperparameter row from a tuning result, ready to hand straight to <code>finalize_workflow()</code>. You pass a tuning object and a metric name, and it picks the row with the best mean score across resamples.</p>

[QUICK ANSWER]
select_best(tune_res)                                # default: first metric, top 1
select_best(tune_res, metric = "rmse")               # rank by RMSE (minimize)
select_best(tune_res, metric = "roc_auc")            # rank by ROC AUC (maximize)
select_best(tune_res, metric = "accuracy")           # classification pick
select_by_one_std_err(tune_res, metric = "rmse", trees)   # one-SE simpler model
select_by_pct_loss(tune_res, metric = "rmse", limit = 2, trees)  # 2% loss tolerance
finalize_workflow(wf, select_best(tune_res, metric = "rmse"))    # plug straight in

[DECISION TREE: Is select_best() the right tool?]
- pick the single winning parameter row: select_best(tune_res, metric = "rmse")
- preview the leaderboard before picking: show_best(tune_res, metric = "rmse")
- pick a simpler model within one SE: select_by_one_std_err(tune_res, metric, trees)
- pick the cheapest within a loss budget: select_by_pct_loss(tune_res, metric, limit, trees)
- inspect every row and metric: collect_metrics(tune_res)
- finalize the workflow from the pick: finalize_workflow(wf, best_params)

## What select_best() does in one sentence

**select_best() distills a tuning result down to a single row of parameters.** Hand it a `tune_results` object from `tune_grid()`, `tune_bayes()`, or `tune_race_anova()`, name the metric, and you get back a one-row tibble containing only the tuned columns and a `.config` label. That row is the input shape `finalize_workflow()` expects.

The return value is intentionally narrow. Where `show_best()` gives the metric, mean, standard error, and resample count for the top n rows, `select_best()` strips every column except the hyperparameters and `.config`. The direction of each metric is registered in `yardstick`, so RMSE picks the smallest mean automatically and ROC AUC picks the largest.

[KEY INSIGHT]
**select_best() is the machine pick; show_best() is the human read.** Both consult the same metric table, but `select_best()` returns parameters-only for finalization while `show_best()` returns the leaderboard for inspection. Use them in sequence: inspect, then select.

## select_best() syntax and arguments

**select_best() needs a tuning result plus a metric name.** Both arguments default sensibly, but naming the metric is the recommended pattern.

```r title="The select_best() argument skeleton"
select_best(
  x,                # a tune_results object
  metric = NULL,    # which metric to optimize; default is the first one collected
  eval_time = NULL, # survival models with time-indexed metrics
  ...               # passed to underlying methods
)
```

The `x` argument is the tuning object. The `metric` argument must match a metric you passed into `metric_set()` during the tuning call. The output is a single row with columns for each tuned parameter plus `.config`, matching the same row in `collect_metrics()` and `show_best()`.

The sibling helpers `select_by_one_std_err()` and `select_by_pct_loss()` share this output shape but apply a tradeoff rule before picking. They take the same `x` and `metric` plus an unquoted tie-breaking column, dplyr style.

## Use select_best() in four scenarios

**Every example below runs on built-in R data so the entire chain reproduces in a single session.** A small random forest on `mtcars` keeps each run fast.

### Example 1: Pick the lowest RMSE row from tune_grid()

**Tune a random forest, then call select_best() to lock in the winner.** The output is a one-row tibble ready for `finalize_workflow()`.

```r title="Tune a random forest and select the best row"
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

folds   <- vfold_cv(cars_train, v = 3)
rf_grid <- expand.grid(mtry = c(2, 4, 6), trees = c(100, 500))

rf_res <- tune_grid(
  rf_wf,
  resamples = folds,
  grid      = rf_grid,
  metrics   = metric_set(rmse, rsq)
)

best_rf <- select_best(rf_res, metric = "rmse")
best_rf
#> # A tibble: 1 x 3
#>    mtry trees .config
#>   <dbl> <dbl> <chr>
#> 1     4   500 Preprocessor1_Model05
```

Note the output has no `mean` or `std_err` column. Those belong to `show_best()`; `select_best()` strips them so the result fits cleanly into the next step.

### Example 2: Select the best classification row by ROC AUC

**Switch to a classification problem and select by a maximize-direction metric.** The same call shape works because the metric direction is registered automatically.

```r title="Select the best classification row"
cars_cls <- mtcars
cars_cls$am <- factor(cars_cls$am, labels = c("auto", "manual"))

cls_spec <- logistic_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet") |>
  set_mode("classification")

cls_wf <- workflow() |>
  add_formula(am ~ mpg + hp + wt) |>
  add_model(cls_spec)

cls_folds <- vfold_cv(cars_cls, v = 3)
cls_grid  <- expand.grid(
  penalty = c(0.001, 0.01, 0.1),
  mixture = c(0, 0.5, 1)
)

cls_res <- tune_grid(
  cls_wf,
  resamples = cls_folds,
  grid      = cls_grid,
  metrics   = metric_set(roc_auc, accuracy)
)

best_cls <- select_best(cls_res, metric = "roc_auc")
best_cls
#> # A tibble: 1 x 3
#>   penalty mixture .config
#>     <dbl>   <dbl> <chr>
#> 1    0.01    0.5  Preprocessor1_Model05
```

ROC AUC is a maximize-direction metric, so the row with the largest mean wins. No sorting argument is needed.

### Example 3: Apply the one standard error rule

**Use select_by_one_std_err() to prefer a simpler model within one SE of the leader.** This rule picks the most regularized or smallest model whose mean falls inside the leader's one-SE band.

```r title="Pick the simplest model within one standard error"
best_simple <- select_by_one_std_err(
  rf_res,
  metric = "rmse",
  trees                # tie-breaker: prefer fewer trees
)

best_simple
#> # A tibble: 1 x 3
#>    mtry trees .config
#>   <dbl> <dbl> <chr>
#> 1     2   100 Preprocessor1_Model01
```

The tie-breaking column is unquoted. With `trees`, the helper sorts candidates within the one-SE band by tree count and picks the smallest. The returned row has the `select_best()` shape, so it drops straight into `finalize_workflow()`.

### Example 4: Apply a percent-loss budget

**Use select_by_pct_loss() to allow a small metric drop in exchange for a simpler model.** A two percent loss limit trades a tiny bit of accuracy for substantial simplicity.

```r title="Pick a simpler model within a 2% loss budget"
best_budget <- select_by_pct_loss(
  rf_res,
  metric = "rmse",
  limit  = 2,          # tolerate up to 2% worse than the leader
  trees                # tie-breaker
)

best_budget
#> # A tibble: 1 x 3
#>    mtry trees .config
#>   <dbl> <dbl> <chr>
#> 1     2   100 Preprocessor1_Model01
```

`limit = 2` means any candidate within 2 percent of the leader's mean is fair game; the tie-breaker decides which one.

[TIP]
**Always name metric explicitly, even when one metric is collected.** Adding a second metric later silently changes the default. A named metric makes the call self-documenting and immune to that change.

## Chain select_best() into finalize_workflow()

**select_best() exists to feed finalize_workflow().** The pair locks the winning parameters into the workflow and produces a model ready for `last_fit()` or `fit()` on the full training set.

```r title="Finalize, then fit on the held-out split"
best_rf  <- select_best(rf_res, metric = "rmse")
final_wf <- finalize_workflow(rf_wf, best_rf)

final_fit <- last_fit(final_wf, cars_split)

collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric .estimator .estimate .config
#>   <chr>   <chr>          <dbl> <chr>
#> 1 rmse    standard       3.10  Preprocessor1_Model1
#> 2 rsq     standard       0.741 Preprocessor1_Model1
```

`finalize_workflow()` reads the parameter columns of `best_rf`, substitutes them for the `tune()` placeholders inside the workflow, and returns a workflow you can fit. `last_fit()` then trains on the full training data and scores the test split in one step.

## Compare select_best() with show_best() and the selection helpers

**select_best() is one verb in a four-function pick API.** Each one reads the same metric table but applies a different selection rule.

| Function | Returns | Selection rule | Use when |
|---|---|---|---|
| `select_best()` | 1 row, parameters only | best mean by metric | Finalizing with the leader |
| `select_by_one_std_err()` | 1 row, parameters only | simpler model within 1 SE | You want a parsimonious pick |
| `select_by_pct_loss()` | 1 row, parameters only | simpler model within X% loss | You have a metric budget |
| `show_best()` | top n rows with metrics | best mean by metric | Inspecting the leaderboard |

Reach for `select_best()` for a straight pick. Use `select_by_one_std_err()` when you want regularization unless the leader is statistically distinct. Use `select_by_pct_loss()` when your accuracy budget is a percent number.

## Common pitfalls

**Three select_best() mistakes account for most stuck pipelines.** Each one below shows the symptom and the fix.

The first is asking for a metric that was not collected during tuning. `select_best()` checks the name against the run's metric set and stops with an error if it does not match.

```r title="The metric name must match metric_set()"
# Wrong: mae is not in metric_set(rmse, rsq)
select_best(rf_res, metric = "mae")
#> Error in `select_best()`:
#> ! "mae" was not in the metric set. Please choose from: "rmse", "rsq"

# Right: pick a metric that was collected
select_best(rf_res, metric = "rsq")
```

The second is passing a quoted string to the tie-breaking column of `select_by_one_std_err()`. The helpers use NSE like dplyr, so `trees` is correct and `"trees"` triggers an error. The third is feeding a `show_best()` output to `finalize_workflow()`. That tibble has metric columns that `finalize_workflow()` does not expect, so it errors. Always call `select_best()` (or a sibling) before finalizing.

[WARNING]
**select_best() returns a one-row tibble, not a named list.** If you index it with `$mtry` you get a length-one vector, which is usually what you want. Older code that calls `as.list()` on the result still works, but the modern pattern is to pass the tibble whole to `finalize_workflow()`.

## Try it yourself

**Try it:** Tune a `decision_tree()` spec on `mtcars` over `tree_depth` values 3, 5, and 7, then use `select_best()` to pick the row with the lowest RMSE. Save the row to `ex_pick`.

```r title="Your turn: tune and select"
# Try it: tune a decision tree and select the best tree_depth
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

ex_pick <- # your code here

ex_pick
#> Expected: a 1-row tibble with tree_depth and .config columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pick <- select_best(dt_res, metric = "rmse")

ex_pick
#> # A tibble: 1 x 2
#>   tree_depth .config
#>        <dbl> <chr>
#> 1          5 Preprocessor1_Model2
```

**Explanation:** `select_best()` aggregates the per-fold RMSE values into a mean for each `tree_depth`, picks the smallest, and returns only the parameter columns plus `.config`. Hand the result to `finalize_workflow(dt_wf, ex_pick)` to lock the depth in.

</details>

## Related tune functions

**select_best() sits at the boundary between tuning and finalization.** These siblings cover the steps on either side.

- `show_best()` returns the top n rows with metric columns for visual inspection.
- `select_by_one_std_err()` picks the simplest model within one standard error of the leader.
- `select_by_pct_loss()` picks the simplest model within a percent-loss budget.
- `finalize_workflow()` substitutes the picked parameters into the tunable workflow.
- `collect_metrics()` returns every metric for every parameter combination for custom analysis.
- `last_fit()` trains the finalized workflow and scores the held-out test split.

## FAQ

**Does select_best() work with tune_bayes() and tune_race_anova()?**

Yes. `select_best()` dispatches on the class of the tuning result, so the same call accepts objects from `tune_grid()`, `tune_bayes()`, `tune_race_anova()`, and `tune_race_win_loss()`. The shape of the returned row is identical. Racing results sometimes carry fewer candidates because losers were dropped early, but the pick rule is unchanged.

**What is the difference between select_best() and select_by_one_std_err()?**

`select_best()` picks the row with the best mean metric. `select_by_one_std_err()` first finds the leader, then walks down candidates ranked by your tie-breaking column and picks the simplest one whose mean still sits within one standard error of the leader. The one-SE rule trades a tiny amount of expected performance for a parsimonious model that is statistically indistinguishable from the leader.

**Why does select_best() drop the mean and std_err columns?**

The output is shaped to plug directly into `finalize_workflow()`, which expects only parameter columns and `.config`. Carrying mean or standard error along would force every downstream consumer to drop them first. For the metric numbers, call `show_best(tune_res, n = 1, metric = "rmse")` instead.

**Can select_best() return a tie or multiple rows?**

No. `select_best()` always returns exactly one row. When two candidates share the same mean to floating-point precision, the helper breaks the tie by the order rows appear in `collect_metrics()`. For a rule-based tie-break, switch to `select_by_one_std_err()` or `select_by_pct_loss()` with an unquoted tie-breaking column.

**How do I pass the result into finalize_model() instead of finalize_workflow()?**

Use `finalize_model()` when your tuning target is a bare model spec, not a full workflow. The call shape is identical: `finalize_model(rf_spec, best_rf)` substitutes the tuned arguments into the spec. Choose `finalize_workflow()` when tunable parameters include preprocessing steps from a recipe, since only a workflow knows about the recipe.
