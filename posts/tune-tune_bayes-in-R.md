---
title: "tune tune_bayes() in R: Bayesian Hyperparameter Search"
slug: tune-tune_bayes-in-R
description: "Use tune tune_bayes() in R to optimize hyperparameters with Bayesian search. See syntax, initial designs, iter, objective control, and common pitfalls."
keywords: "tune tune_bayes, tune_bayes function R, tune tune_bayes examples, R Bayesian hyperparameter tuning, tidymodels tune_bayes, Bayesian optimization tidymodels, tune_bayes tidymodels"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "tune_bayes()|tune tune_bayes|tune::tune_bayes()|Bayesian hyperparameter tuning|Bayesian optimization tidymodels"
auto_link_case_sensitive: true
target_keyword: tune tune_bayes
sibling_block_enabled: true
difficulty: Beginner
---

# tune tune_bayes() in R: Bayesian Hyperparameter Search

<p class="lead">The tune tune_bayes() function in R runs iterative Bayesian optimization over a tidymodels workflow, fitting a Gaussian process surrogate on past results to propose smarter candidates each round instead of scoring a fixed grid.</p>

[QUICK ANSWER]
tune_bayes(wf, resamples = folds)                            # default 5-point init + 10 iter
tune_bayes(wf, resamples = folds, iter = 25)                 # longer search
tune_bayes(wf, resamples = folds, initial = 15)              # bigger initial design
tune_bayes(wf, resamples = folds, initial = init_res)        # reuse a prior tune_grid()
tune_bayes(wf, resamples = folds, metrics = mset)            # custom metric set
tune_bayes(wf, resamples = folds, objective = exp_improve()) # expected improvement
tune_bayes(wf, resamples = folds, param_info = params)       # custom ranges
tune_bayes(wf, resamples = folds, control = ctrl_bayes)      # verbose, no_improve, parallel

[DECISION TREE: Is tune_bayes() the right tool?]
- search continuous params with expensive fits: tune_bayes(wf, resamples = folds, iter = 25)
- search a fixed grid of candidates: tune_grid(wf, resamples = folds, grid = g)
- one-shot resample with no tuning: fit_resamples(wf, resamples = folds)
- race candidates with early stopping: finetune::tune_race_anova(wf, resamples = folds)
- simulated annealing search: finetune::tune_sim_anneal(wf, resamples = folds)
- inspect param ranges before tuning: extract_parameter_set_dials(wf)
- final test-set fit after tuning: last_fit(final_wf, split)

## What tune_bayes() does in one sentence

**tune_bayes() learns where the metric is best, then samples there.** You give it a workflow whose model spec contains `tune()` placeholders, a resample object, and an iteration budget. The function first scores a small space-filling initial design, fits a Gaussian process to the metric values, then repeatedly maximizes an acquisition function (expected improvement by default) to pick the next candidate. Each iteration adds one row to the surrogate and refits it, so the search concentrates on promising regions instead of treating every grid point equally.

The return value is a `tune_results` object identical in shape to `tune_grid()`, which means `collect_metrics()`, `show_best()`, `select_best()`, and `finalize_workflow()` work without changes. The difference is fits per run: a 15-point grid scored on 10 folds is 150 fits, while a `tune_bayes()` call with 5 initial points and 10 iterations is 150 fits scattered intelligently across the parameter space.

## Set up a tunable workflow

**You need three pieces before calling tune_bayes().** A model spec with `tune()` placeholders, a recipe or formula, and a resample object that splits the training data. Continuous parameters with broad ranges benefit most from Bayesian search.

```r title="Load tidymodels and prepare data"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)
folds <- vfold_cv(train, v = 5, strata = Sale_Price)
```

The example below tunes a random forest via the ranger engine. Three knobs vary at once: `mtry`, `min_n`, and `trees`. With nine possible values of mtry, ten of min_n, and a continuous trees range, an exhaustive grid quickly explodes; Bayesian search stays tractable.

```r title="Recipe, model, workflow with tune placeholders"
rec <- recipe(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood,
              data = train) |>
  step_dummy(all_nominal_predictors())

rf_spec <- rand_forest(mtry = tune(), min_n = tune(), trees = tune()) |>
  set_engine("ranger") |>
  set_mode("regression")

wf <- workflow() |>
  add_recipe(rec) |>
  add_model(rf_spec)
```

[NOTE]
**mtry has an unknown upper bound.** Until the recipe is prepped, tune cannot know the number of predictors. Either call `extract_parameter_set_dials(wf) |> finalize(train)` or pass `param_info` so ranges are concrete before search begins.

## tune_bayes() syntax and arguments

**The signature is short, but a few arguments do most of the work.**

```r title="tune_bayes generic signature"
tune_bayes(
  object,                    # workflow or model spec
  preprocessor,              # recipe or formula (when object is a spec)
  resamples,                 # rset from rsample (vfold_cv, bootstraps, ...)
  ...,
  iter = 10,                 # Bayesian iterations after the initial design
  param_info = NULL,         # parameters() object with finalized ranges
  metrics = NULL,            # metric_set() or NULL for defaults
  objective = exp_improve(), # acquisition function
  initial = 5,               # int (space-filling) or a prior tune_results
  control = control_bayes()
)
```

| Argument | Description |
|---|---|
| `iter` | Bayesian iterations after the initial design. Each iteration adds one candidate. |
| `initial` | Integer = size of the initial space-filling design; a prior `tune_grid()` result reuses its rows as starting data. |
| `objective` | Acquisition rule. `exp_improve()` balances exploration and exploitation; `conf_bound(kappa)` tilts toward exploration. |
| `param_info` | A `parameters()` object with finalized ranges. Required when any range depends on the data, such as `mtry`. |
| `control` | `control_bayes()` options. Notable ones: `no_improve`, `verbose_iter`, `save_pred`, `parallel_over`. |

## Examples by use case

**Start with the simplest Bayesian call, then refine.** Finalize the parameter set first so `mtry` has a concrete upper bound.

```r title="Run tune_bayes with default settings"
params <- extract_parameter_set_dials(wf) |> finalize(train)

set.seed(123)
res_bayes <- tune_bayes(
  wf,
  resamples  = folds,
  param_info = params,
  initial    = 8,
  iter       = 15,
  metrics    = metric_set(rmse, rsq),
  control    = control_bayes(no_improve = 10, verbose_iter = FALSE)
)
res_bayes
#> # Tuning results
#> # 5-fold cross-validation using stratification
#> # Iter 1 of 15: penalty=0.0042 mixture=0.81  rmse=0.0712
#> # Iter 2 of 15: ...
```

[TIP]
**Seed twice for full reproducibility.** Set a top-level seed for the initial design and pass `control_bayes(seed = 99)` so the acquisition optimizer is also deterministic across machines.

Once results are back, the helpers behave exactly as with grid search.

```r title="Inspect Bayesian search results"
show_best(res_bayes, metric = "rmse", n = 3)
#> # A tibble: 3 x 9
#>    mtry min_n trees .metric .estimator   mean     n std_err .config
#>   <int> <int> <int> <chr>   <chr>       <dbl> <int>   <dbl> <chr>
#> 1     6    12  1182 rmse    standard   0.0688     5 0.00102 Iter11
#> 2     5    14   894 rmse    standard   0.0691     5 0.00118 Iter08
#> 3     7    11  1310 rmse    standard   0.0693     5 0.00124 Iter13

best <- select_best(res_bayes, metric = "rmse")
final_wf <- finalize_workflow(wf, best)
```

Reuse a prior `tune_grid()` call as the initial design when you already have grid results, which avoids paying for a fresh space-filling sample.

```r title="Warm-start tune_bayes from a tune_grid result"
init_res <- tune_grid(wf, resamples = folds, grid = 10,
                      param_info = params, metrics = metric_set(rmse))

res_warm <- tune_bayes(
  wf,
  resamples  = folds,
  param_info = params,
  initial    = init_res,
  iter       = 12,
  metrics    = metric_set(rmse)
)
autoplot(res_warm, type = "performance")
```

Switch the acquisition function when the search keeps revisiting the same neighborhood. `conf_bound()` with a larger `kappa` pushes the next pick away from current best estimates.

```r title="Force exploration with a confidence bound"
res_explore <- tune_bayes(
  wf,
  resamples  = folds,
  param_info = params,
  initial    = 8, iter = 15,
  objective  = conf_bound(kappa = 2.5),
  metrics    = metric_set(rmse)
)
```

## tune_bayes() versus tune_grid() and tune_sim_anneal()

**Pick by parameter type and fit cost, not by sophistication.**

| Function | When to reach for it |
|---|---|
| `tune_bayes()` | Two or more continuous parameters and fits that take seconds or minutes. Surrogate amortizes the search cost. |
| `tune_grid()` | A handful of discrete settings or when you want every candidate scored for reporting. Easiest to reason about. |
| `finetune::tune_sim_anneal()` | Mixed continuous and integer parameters where the surface looks rugged. Cheaper per iteration than the GP fit. |
| `finetune::tune_race_anova()` | Large fixed grids where most candidates are obviously bad. Drops losers after a few folds. |

Bayesian search shines when fits are slow and ranges are wide. With a 50ms fit, `tune_grid(grid = 50)` beats `tune_bayes(iter = 30)` on wall clock; with a 30s fit, the calculus flips.

## Common pitfalls

**Three errors account for most failed Bayesian runs.**

1. **Unfinalized parameter set.** Calling `tune_bayes()` without finalizing `mtry` or any other data-dependent range throws `! Some parameter values are unknown`. Always pass `param_info` built with `finalize(train)`.
2. **Too few initial points.** A surrogate fit on three candidates is meaningless; the search wanders. Use at least one initial point per tunable parameter, ideally more.
3. **Confusing iterations with fits.** `iter = 25` means 25 single candidates added on top of `initial`. Total fits is `(initial + iter) * folds`, not `iter * folds`. Budget accordingly.

[WARNING]
**Watch for stalled iterations.** When `control_bayes(no_improve = 10)` is set and no improvement appears for 10 iterations, the search exits early. Inspect `collect_notes(res)` to confirm the run stopped on the rule, not on a fit error.

## Try it yourself

**Try it:** Tune an xgboost classifier on the iris data with Bayesian search. Vary `trees` and `learn_rate` over 10 iterations, score by accuracy, and identify the best candidate.

```r title="Your turn: Bayesian search on iris"
# Try it: tune xgboost on iris
library(tidymodels)

set.seed(7)
ex_folds <- vfold_cv(iris, v = 5, strata = Species)

ex_spec <- boost_tree(trees = tune(), learn_rate = tune()) |>
  set_engine("xgboost") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_spec)

ex_params <- # your code here

ex_res <- # your code here

show_best(ex_res, metric = "accuracy", n = 3)
#> Expected: a tibble of the top 3 (trees, learn_rate) candidates ranked by accuracy
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_wf) |>
  update(learn_rate = learn_rate(range = c(-3, -0.5)))

ex_res <- tune_bayes(
  ex_wf,
  resamples  = ex_folds,
  param_info = ex_params,
  initial    = 6,
  iter       = 10,
  metrics    = metric_set(accuracy)
)

show_best(ex_res, metric = "accuracy", n = 3)
#> # A tibble: 3 x 9
#>   trees learn_rate .metric  .estimator  mean     n std_err .config
#>   <int>      <dbl> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1   842    0.0451  accuracy multiclass 0.967     5  0.0211 Iter08
#> 2  1103    0.0312  accuracy multiclass 0.960     5  0.0249 Iter05
#> 3   674    0.0589  accuracy multiclass 0.953     5  0.0211 Iter10
```

**Explanation:** `extract_parameter_set_dials(ex_wf)` builds the parameter set; `update()` widens `learn_rate` since the default range (`10^-10` to `10^-1`) is too narrow at the lower end. Six initial points plus ten Bayesian iterations score sixteen candidates against five folds.

</details>

## Related tidymodels functions

**Most tune_bayes() runs sit inside a short chain of helpers.**

- `tune_grid()` to score a fixed candidate set or seed a Bayesian warm start.
- `fit_resamples()` to resample a workflow with no tunable arguments.
- `last_fit()` to refit the finalized workflow on the full train and score the test set.
- `finalize_workflow()` and `select_best()` to lock in the winning hyperparameters.
- `extract_parameter_set_dials()` and `finalize()` to discover and resolve parameter ranges.
- `control_bayes()` to toggle verbose iteration logs, early stopping, parallel backend, and prediction saving.

External reference: the official tune package documentation at [tune.tidymodels.org](https://tune.tidymodels.org/reference/tune_bayes.html).

## FAQ

**How many iterations should I set for tune_bayes()?**

Budget the initial design first, then add iterations as patience allows. A good rule is five initial points per tunable parameter and fifteen to thirty iterations on top. If `control_bayes(no_improve = 10)` is set, the search exits early when the surrogate stops finding gains, so over-budgeting is mostly free. With one-second fits and ten folds, sixty total candidates take roughly ten minutes; scale linearly from there.

**What is the difference between exp_improve() and conf_bound()?**

`exp_improve()` weights candidates by expected gain over the current best metric. It exploits when the surrogate is confident and explores otherwise. `conf_bound(kappa)` adds `kappa` standard deviations to the surrogate mean, so larger kappa forces exploration. Default is `exp_improve()`; switch to `conf_bound(kappa = 2)` when the search collapses to a single neighborhood and you suspect a better region exists elsewhere.

**Can I run tune_bayes() in parallel?**

Yes, but iteration logic is sequential by nature. Register a backend before the call (`doFuture` plus `plan(multisession, workers = 4)`) and the function parallelizes folds within each iteration, not iterations themselves. Set `control_bayes(parallel_over = "everything")` only when the inner per-iteration grid is large; for typical single-candidate iterations, `"resamples"` is fastest.

**Why does the initial design matter so much?**

The surrogate's quality depends on how well the initial points cover the space. Too few points or a clustered design produce a misleading mean surface, and the acquisition function chases noise. Use at least one point per parameter, prefer space-filling designs over random ones, and reuse a previous `tune_grid()` result via `initial = prior_res` when you have one.

**Does tune_bayes() always beat tune_grid()?**

No. With one or two discrete parameters and cheap fits, an exhaustive grid is faster and reports more uniformly. Bayesian search wins when the parameter space is continuous, the dimension is at least three, fits cost seconds or more, and you accept that results are no longer a uniform map of the metric surface. Prototype with `tune_grid(grid = 10)`, then escalate to `tune_bayes()` once the ranges feel right.
