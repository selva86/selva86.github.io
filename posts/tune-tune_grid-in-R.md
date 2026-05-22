---
title: "tune tune_grid() in R: Hyperparameter Search on Resamples"
slug: tune-tune_grid-in-R
description: "Use tune tune_grid() in R to search hyperparameters across resamples. See syntax, grid types, metrics, parallel control, finalize_workflow, and common pitfalls."
keywords: "tune tune_grid, tune_grid function R, tune tune_grid examples, R hyperparameter tuning tidymodels, tune_grid tidymodels, tune_grid workflow R, grid search R tidymodels"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "tune_grid()|tune tune_grid|tune::tune_grid()|grid search tuning|hyperparameter tuning grid"
auto_link_case_sensitive: true
target_keyword: tune tune_grid
sibling_block_enabled: true
difficulty: Beginner
---

# tune tune_grid() in R: Hyperparameter Search on Resamples

<p class="lead">The tune tune_grid() function in R fits a tidymodels workflow at every point of a hyperparameter grid against a resample set, returning a tibble of per-resample metrics you can rank with show_best() and feed into finalize_workflow().</p>

[QUICK ANSWER]
tune_grid(wf, resamples = folds)                       # default 10-point Latin hypercube
tune_grid(wf, resamples = folds, grid = 20)            # 20-point space-filling grid
tune_grid(wf, resamples = folds, grid = my_grid)       # user grid as a tibble
tune_grid(wf, resamples = folds, metrics = mset)       # custom metric set
tune_grid(wf, resamples = folds, control = ctrl)       # save predictions, parallel
tune_grid(model_spec, recipe, resamples = folds)       # spec + recipe shortcut
tune_grid(wf, resamples = folds, param_info = params)  # custom parameter ranges
tune_grid(wf, resamples = folds, eval_time = c(5, 10)) # survival metrics at times

[DECISION TREE: Is tune_grid() the right tool?]
- search a fixed grid of hyperparameters: tune_grid(wf, resamples = folds, grid = g)
- search by Bayesian optimization: tune_bayes(wf, resamples = folds, iter = 25)
- one-shot fit with no tuning: fit_resamples(wf, resamples = folds)
- early-stop racing instead of full grid: finetune::tune_race_anova(wf, resamples = folds)
- simulated annealing search: finetune::tune_sim_anneal(wf, resamples = folds)
- final fit on the full train + test: last_fit(final_wf, split)
- inspect tuning ranges only: extract_parameter_set_dials(wf)

## What tune_grid() does in one sentence

**tune_grid() fits a workflow once per candidate per resample.** You hand it a workflow that contains at least one parameter marked with `tune()`, a resample object such as a v-fold cross-validation set, and either a grid size or a tibble of candidate values. The function loops every candidate across every fold, scores each fit with the chosen metric set, and returns a `tune_results` object that downstream helpers like `collect_metrics()`, `show_best()`, and `select_best()` know how to read.

This is the workhorse of tidymodels hyperparameter search. It is deterministic given a seed, parallel-friendly, and decoupled from any specific model engine, so the same call shape works for elastic net, xgboost, random forest, kknn, or any spec that exposes tunable arguments.

## Set up a tunable workflow

**You need three pieces before calling tune_grid().** A model spec with `tune()` placeholders, a preprocessing recipe or formula, and a resample object that splits the training data.

```r title="Load tidymodels and prepare data"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split  <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train  <- training(split)
folds  <- vfold_cv(train, v = 5, strata = Sale_Price)
folds
#> #  5-fold cross-validation using stratification
#> # A tibble: 5 x 2
#>   splits             id
#>   <list>             <chr>
#> 1 <split [1873/469]> Fold1
#> 2 <split [1873/469]> Fold2
#> 3 <split [1873/469]> Fold3
#> 4 <split [1874/468]> Fold4
#> 5 <split [1874/469]> Fold5
```

The recipe below scales numeric predictors and dummies the factors, which lets the same workflow drive a regularized regression. Two arguments, `penalty` and `mixture`, are flagged with `tune()` so tune_grid() knows which knobs to vary.

```r title="Recipe, model, workflow with tune placeholders"
rec <- recipe(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood,
              data = train) |>
  step_dummy(all_nominal_predictors()) |>
  step_normalize(all_numeric_predictors())

glmnet_spec <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")

wf <- workflow() |>
  add_recipe(rec) |>
  add_model(glmnet_spec)
wf
#> == Workflow ==================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
```

## tune_grid() syntax and arguments

**The signature is small but the defaults matter.**

```r title="tune_grid generic signature"
tune_grid(
  object,                # workflow or model spec
  preprocessor,          # recipe or formula (when object is a spec)
  resamples,             # rset from rsample (vfold_cv, bootstraps, ...)
  ...,
  param_info = NULL,     # parameters() object with custom ranges
  grid = 10,             # int (space-filling) or tibble of candidates
  metrics  = NULL,       # metric_set() or NULL for defaults
  eval_time = NULL,      # numeric vector for survival models
  control  = control_grid()
)
```

| Argument | Description |
|---|---|
| `object` | A workflow or a model spec. If a spec, pass `preprocessor` next. |
| `resamples` | An rset such as `vfold_cv()`, `bootstraps()`, or `validation_split()`. |
| `grid` | Integer = space-filling Latin hypercube of that size; tibble = explicit candidates. |
| `metrics` | A `metric_set()`; defaults are RMSE+R-squared (regression) or accuracy+ROC AUC (classification). |
| `param_info` | A `parameters()` object when defaults need updating, e.g. `penalty(range = c(-4, 0))`. |
| `control` | Returns of `control_grid()`. Toggles `save_pred`, `save_workflow`, `verbose`, parallel options. |

[NOTE]
**Grid is a smart argument.** A scalar `grid = 25` builds a 25-row space-filling design from the parameter set. A tibble lets you script `grid_regular()`, `grid_random()`, or a hand-crafted set of candidates.

## Examples by use case

**Pass an integer first, then move to explicit grids as you learn the model.** Two-knob regularized regression is the cleanest demo.

```r title="Run tune_grid with a space-filling design"
set.seed(123)
res <- tune_grid(
  wf,
  resamples = folds,
  grid      = 15,
  metrics   = metric_set(rmse, rsq, mae),
  control   = control_grid(save_pred = TRUE, verbose = FALSE)
)
res
#> # Tuning results
#> # 5-fold cross-validation using stratification
#> # A tibble: 5 x 5
#>   splits             id    .metrics          .notes           .predictions
#>   <list>             <chr> <list>            <list>           <list>
#> 1 <split [1873/469]> Fold1 <tibble [45 x 6]> <tibble [0 x 3]> <tibble [...]>
```

Once results are back, `collect_metrics()` averages across folds and `show_best()` ranks candidates by the chosen metric.

```r title="Collect metrics and rank candidates"
collect_metrics(res) |>
  filter(.metric == "rmse") |>
  arrange(mean) |>
  head(3)
#> # A tibble: 3 x 8
#>   penalty mixture .metric .estimator   mean     n std_err .config
#>     <dbl>   <dbl> <chr>   <chr>       <dbl> <int>   <dbl> <chr>
#> 1 0.00342   0.812 rmse    standard   0.0712     5 0.00121 Preprocessor1_Model02
#> 2 0.00518   0.347 rmse    standard   0.0719     5 0.00118 Preprocessor1_Model09
#> 3 0.0214    0.611 rmse    standard   0.0731     5 0.00134 Preprocessor1_Model13

show_best(res, metric = "rmse", n = 3)
```

For a regular grid, build it explicitly so reviewers can see what was tried.

```r title="Regular grid over named parameters"
reg_grid <- grid_regular(
  penalty(range = c(-4, 0)),    # log10 scale: 1e-4 to 1
  mixture(range = c(0, 1)),
  levels = c(penalty = 5, mixture = 4)
)
nrow(reg_grid)
#> [1] 20

res_reg <- tune_grid(wf, resamples = folds, grid = reg_grid,
                     metrics = metric_set(rmse))
select_best(res_reg, metric = "rmse")
#> # A tibble: 1 x 3
#>   penalty mixture .config
#>     <dbl>   <dbl> <chr>
#> 1 0.00316   0.667 Preprocessor1_Model09
```

Finalize the workflow with the winning row and fit on the full training set.

```r title="Finalize workflow and last_fit"
best <- select_best(res_reg, metric = "rmse")
final_wf <- finalize_workflow(wf, best)

final_fit <- last_fit(final_wf, split)
collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric .estimator .estimate .config
#>   <chr>   <chr>          <dbl> <chr>
#> 1 rmse    standard      0.0709 Preprocessor1_Model1
#> 2 rsq     standard      0.819  Preprocessor1_Model1
```

## tune_grid() versus tune_bayes() and fit_resamples()

**Pick by search style, not by sophistication.**

| Function | When to reach for it |
|---|---|
| `tune_grid()` | A fixed candidate set: regular grid, Latin hypercube, or scripted tibble. Easiest to reason about, parallelizes perfectly. |
| `tune_bayes()` | Continuous parameters with expensive fits. Uses a Gaussian process surrogate to propose new candidates iteratively. |
| `fit_resamples()` | No tuning at all; just resample a fixed workflow to score it. Same return type as tune_grid(), so downstream code is identical. |
| `finetune::tune_race_anova()` | A grid run that drops losing candidates after a few folds. Useful when one fold takes minutes. |

The fastest workflow is usually: prototype with `tune_grid(grid = 10)`, then either refine the ranges and rerun, or switch to `tune_bayes()` once you trust the search space.

## Common pitfalls

**Three errors account for most failed runs.**

1. **No tune() placeholder.** Calling tune_grid() on a workflow with no tunable arguments throws `! No tuning parameters have been detected`. Fix by adding `tune()` to at least one model argument.
2. **Grid columns do not match parameter ids.** A custom grid must use the names returned by `extract_parameter_set_dials(wf)`. If your spec uses `tune("lambda")`, the grid column has to be `lambda`, not `penalty`.
3. **Metric direction confusion.** `show_best()` sorts by the metric's default direction (lower for RMSE, higher for ROC AUC). Pass the metric name explicitly so the ranking matches what you intend.

[WARNING]
**Notes are not errors.** `tune_results` carry per-resample notes. Always inspect `collect_notes(res)` after a run; engine warnings such as glmnet convergence messages live there and never raise.

## Try it yourself

**Try it:** Tune a kknn classifier on the iris data over a 5-point grid of `neighbors`. Use 5-fold cross-validation, score by accuracy, and identify the best k.

```r title="Your turn: tune neighbors on iris"
# Try it: tune neighbors on iris with kknn
library(tidymodels)

set.seed(7)
ex_folds <- vfold_cv(iris, v = 5, strata = Species)

ex_spec <- nearest_neighbor(neighbors = tune()) |>
  set_engine("kknn") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_spec)

ex_grid <- # your code here

ex_res <- # your code here

show_best(ex_res, metric = "accuracy", n = 3)
#> Expected: a tibble of the top 3 k values ranked by mean accuracy
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- tibble(neighbors = c(3, 5, 7, 9, 11))

ex_res <- tune_grid(
  ex_wf,
  resamples = ex_folds,
  grid      = ex_grid,
  metrics   = metric_set(accuracy)
)

show_best(ex_res, metric = "accuracy", n = 3)
#> # A tibble: 3 x 7
#>   neighbors .metric  .estimator  mean     n std_err .config
#>       <dbl> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1         7 accuracy multiclass 0.967     5  0.0211 Preprocessor1_Model3
#> 2         9 accuracy multiclass 0.960     5  0.0249 Preprocessor1_Model4
#> 3         5 accuracy multiclass 0.953     5  0.0211 Preprocessor1_Model2
```

**Explanation:** A scripted tibble with column name `neighbors` matches the `tune()` placeholder, so tune_grid() knows where each candidate goes. Five folds plus five candidates produce 25 fits, and show_best() ranks them by mean accuracy.

</details>

## Related tidymodels functions

**Most tune_grid() calls live inside a short chain of helpers.**

- `tune_bayes()` for surrogate-driven search when fits are expensive.
- `fit_resamples()` to score a workflow that has no tunable arguments.
- `last_fit()` to refit the finalized workflow on the full train and score the test set.
- `finalize_workflow()` and `select_best()` to lock in the winning hyperparameters.
- `grid_regular()`, `grid_random()`, `grid_space_filling()` for candidate construction.
- `control_grid()` to toggle prediction saving, parallel backends, and progress output.

External reference: the official tune package documentation at [tune.tidymodels.org](https://tune.tidymodels.org/reference/tune_grid.html).

## FAQ

**How do I make tune_grid() run in parallel?**

Register a parallel backend before the call. With the `doFuture` package, `library(doFuture); plan(multisession, workers = 4)` is enough. Inside `control_grid()`, leave `parallel_over = "resamples"` for most workflows; switch to `"everything"` only when both folds and candidates are large. tune_grid() detects the backend automatically and prints `i Creating pre-processing data to finalize unknown parameter ranges` once before workers start.

**What is the difference between grid as an integer and grid as a tibble?**

An integer triggers `grid_space_filling()` (Latin hypercube on the parameter set), so coverage is good with few points. A tibble lets you control exactly which combinations get scored, which matters when you want a regular grid for plots or when only a few discrete settings are valid. Use an integer to prototype, a tibble once you know what to vary.

**Why does select_best() pick a different model than show_best()?**

It does not, but tie-breaking can look that way. `show_best()` sorts by the mean metric, ascending or descending by metric direction. `select_best()` returns the single top row by that same rule. When two candidates have nearly identical means, std_err and config name decide ordering, so always include `metric = "..."` explicitly to avoid surprises.

**Can I tune a recipe step and a model argument at the same time?**

Yes. Mark a recipe step argument with `tune()` (for example, `step_pca(num_comp = tune())`) and any model argument with `tune()` as usual. `extract_parameter_set_dials(wf)` shows the combined set, and `param_info` lets you update the recipe-side range. The grid then has columns for both, scored jointly per candidate.

**How do I save predictions from every candidate?**

Set `control = control_grid(save_pred = TRUE)`. The resulting `tune_results` object carries a `.predictions` list column; `collect_predictions(res)` flattens it into one tidy tibble with `.row`, `.pred`, truth, and the candidate identifier. Useful for residual diagnostics, calibration plots, and stacking via the stacks package.
