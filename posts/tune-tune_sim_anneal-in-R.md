---
title: "tune tune_sim_anneal() in R: Simulated Annealing Tuning"
slug: tune-tune_sim_anneal-in-R
description: "Use tune tune_sim_anneal() in R for iterative simulated annealing hyperparameter search in tidymodels. See syntax, control_sim_anneal options, and pitfalls."
keywords: "tune tune_sim_anneal, tune_sim_anneal function R, finetune tune_sim_anneal, simulated annealing tidymodels, tidymodels iterative tuning, R hyperparameter search, finetune package R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "tune_sim_anneal()|finetune tune_sim_anneal|finetune::tune_sim_anneal()|simulated annealing tuning|simulated annealing tidymodels"
auto_link_case_sensitive: true
target_keyword: tune tune_sim_anneal
sibling_block_enabled: true
difficulty: Beginner
---

# tune tune_sim_anneal() in R: Simulated Annealing Tuning

<p class="lead">The tune tune_sim_anneal() function in R, from the finetune package, runs iterative simulated annealing over a tidymodels workflow, proposing a neighbor candidate each round and accepting or rejecting it by metric improvement plus a temperature-controlled probability.</p>

[QUICK ANSWER]
tune_sim_anneal(wf, resamples = folds)                            # default iter = 10 from random initial
tune_sim_anneal(wf, resamples = folds, iter = 30)                 # longer search
tune_sim_anneal(wf, resamples = folds, initial = init_res)        # warm start from tune_grid() result
tune_sim_anneal(wf, resamples = folds, initial = 6)               # space-filling initial design size
tune_sim_anneal(wf, resamples = folds, metrics = mset)            # custom metric set
tune_sim_anneal(wf, resamples = folds, control = ctrl_sa)         # control_sim_anneal(): cooling, radius
tune_sim_anneal(wf, resamples = folds, param_info = params)       # custom parameter ranges
autoplot(res, type = "performance")                               # trace metric across iterations

[DECISION TREE: Is tune_sim_anneal() the right tool?]
- iterative local search around a good starting point: tune_sim_anneal(wf, resamples = folds, iter = 30)
- global surrogate-driven search: tune_bayes(wf, resamples = folds, iter = 25)
- race candidates with ANOVA stopping: finetune::tune_race_anova(wf, resamples = folds)
- score every candidate in a fixed grid: tune_grid(wf, resamples = folds, grid = g)
- single resample fit with no tuning: fit_resamples(wf, resamples = folds)
- finalize the survivor on full train and test: last_fit(final_wf, split)
- list tunable parameters in the workflow: extract_parameter_set_dials(wf)

## What tune_sim_anneal() does in one sentence

**tune_sim_anneal() walks the parameter space one neighbor at a time.** You give it a workflow with `tune()` placeholders, a resample object, and an iteration budget. The function scores a small initial design (or accepts a prior `tune_grid()` result), then at each iteration picks a neighbor of the current best candidate inside a shrinking radius. If the neighbor scores better the algorithm moves there; if worse, it still moves with a probability that depends on how far the metric dropped and the current temperature. The temperature cools each iteration, so the walk explores broadly at first and refines locally near the end.

The function lives in the finetune package, which ships separately from tidymodels core. Install it once with `install.packages("finetune")` and load alongside tidymodels.

## Set up a tunable workflow

**You need the same three pieces every iterative tuner expects: spec, recipe, and resamples.** Simulated annealing benefits most from continuous parameters with broad ranges, since neighbor proposals draw from a Gaussian centered on the current point.

```r title="Load tidymodels and finetune"
library(tidymodels)
library(finetune)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)
folds <- vfold_cv(train, v = 5, strata = Sale_Price)
folds
#> #  5-fold cross-validation using stratification
#> # A tibble: 5 x 2
#>   splits             id
#>   <list>             <chr>
#> 1 <split [1873/469]> Fold1
#> 2 <split [1873/469]> Fold2
#> 3 <split [1874/468]> Fold3
#> 4 <split [1874/468]> Fold4
#> 5 <split [1874/468]> Fold5
```

Five folds is a reasonable floor here because every iteration of the annealer is one full resample cycle. Many folds plus many iterations gets expensive fast.

```r title="Recipe, model spec, and workflow"
rec <- recipe(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood,
              data = train) |>
  step_dummy(all_nominal_predictors()) |>
  step_normalize(all_numeric_predictors())

glmnet_spec <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")

wf <- workflow() |>
  add_recipe(rec) |>
  add_model(glmnet_spec)
```

## tune_sim_anneal() syntax and arguments

**The signature mirrors tune_bayes(); the annealing knobs live in control_sim_anneal().**

```r title="tune_sim_anneal generic signature"
tune_sim_anneal(
  object,                       # workflow or model spec
  preprocessor,                 # recipe or formula (when object is a spec)
  resamples,                    # rset such as vfold_cv()
  ...,
  iter = 10,                    # number of annealing iterations
  param_info = NULL,            # parameters() object with custom ranges
  metrics  = NULL,              # metric_set() or NULL for defaults
  initial  = 1,                 # int (random initial design) or prior tune_results
  control  = control_sim_anneal()
)
```

| Argument | Description |
|---|---|
| `object` | A workflow or a model spec. If a spec, pass `preprocessor` next. |
| `resamples` | An rset such as `vfold_cv()`. Each iteration scores one candidate on every fold. |
| `iter` | Number of annealing steps after the initial design. 20 to 40 is the common range. |
| `initial` | Integer = space-filling design of that size; a `tune_results` object = warm start. |
| `metrics` | A `metric_set()`; the FIRST metric drives the acceptance decision. |
| `control` | A `control_sim_anneal()` object with `cooling_coef`, `radius`, `flip`, `no_improve`, `restart`, `verbose_iter`. |

[NOTE]
**Only the first metric drives acceptance.** `metric_set(rmse, rsq, mae)` anneals on RMSE; the others ride along for diagnostics. Put the target metric first.

The control knobs that matter most:

- `cooling_coef = 0.02`: how fast the temperature falls. Smaller = slower cooling, more exploration.
- `radius = c(0.05, 0.15)`: neighborhood radius range as a fraction of the parameter range. Wider = bolder jumps.
- `no_improve = 10L`: iterations without improvement before stopping early.
- `restart = 8L`: iterations without improvement before jumping back to the best-so-far point.
- `verbose_iter = FALSE`: set TRUE to log every accept and reject.

## Examples by use case

**Warm-start from a small tune_grid() result; the surrogate-free walk pays off when you know roughly where to look.**

```r title="Seed with tune_grid then anneal"
set.seed(123)
init_res <- tune_grid(
  wf,
  resamples = folds,
  grid      = 6,
  metrics   = metric_set(rmse, rsq)
)

ctrl_sa <- control_sim_anneal(verbose_iter = FALSE, no_improve = 10, restart = 8)

sa_res <- tune_sim_anneal(
  wf,
  resamples = folds,
  iter      = 25,
  initial   = init_res,
  metrics   = metric_set(rmse, rsq),
  control   = ctrl_sa
)
sa_res
#> # Iteration numbers and results
#> # A tibble: 31 x 5
#>    .iter  penalty mixture .metrics          .notes
#>    <int>    <dbl>   <dbl> <list>            <list>
#>  1     0 0.00316    0.250 <tibble [10 x 4]> <tibble [0 x 3]>
#>  2     0 0.0316     0.500 <tibble [10 x 4]> <tibble [0 x 3]>
#>  3     0 0.000316   0.750 <tibble [10 x 4]> <tibble [0 x 3]>
```

`show_best()`, `select_best()`, `collect_metrics()`, and `finalize_workflow()` work on the result exactly as they do for `tune_grid()`. Iterations 0 are the initial design rows; iterations 1 to `iter` are the annealed proposals.

```r title="Inspect annealed survivors and finalize"
show_best(sa_res, metric = "rmse", n = 3)
#> # A tibble: 3 x 9
#>    penalty mixture .metric .estimator   mean     n std_err .config        .iter
#>      <dbl>   <dbl> <chr>   <chr>       <dbl> <int>   <dbl> <chr>          <int>
#> 1 0.00181    0.794 rmse    standard   0.0701    5 0.00104 Iter17             17
#> 2 0.00198    0.812 rmse    standard   0.0702    5 0.00109 Iter22             22
#> 3 0.00214    0.758 rmse    standard   0.0704    5 0.00114 Iter11             11

best  <- select_best(sa_res, metric = "rmse")
final <- finalize_workflow(wf, best)
```

[KEY INSIGHT]
**Annealing exploits a smooth landscape.** When neighboring penalty values produce similar RMSEs, the walk converges quickly to a local optimum. When the metric surface is jagged (many discrete params, sharp boundaries), annealing thrashes and a Bayesian or racing tuner is a better fit.

To watch the search trajectory across iterations, plot it with `autoplot()`.

```r title="Visualize the annealing trace"
autoplot(sa_res, type = "performance")
#> A ggplot showing the chosen metric (RMSE) per iteration, with the best
#> value declining over time and occasional uphill moves where the
#> temperature accepted a worse candidate.
```

## tune_sim_anneal() versus alternatives

**Pick by how smooth your metric surface looks and how cheap your fits are.**

| Function | When to reach for it |
|---|---|
| `tune_sim_anneal()` | Smooth metric surface, continuous params, you want local refinement from a good starting point. Sequential, one candidate per iteration. |
| `tune_bayes()` | Continuous params, expensive fits, no good starting point. The Gaussian process surrogate proposes globally. |
| `tune_grid()` | Small fixed candidate list, or downstream stacking that needs every candidate scored on every fold. |
| `finetune::tune_race_anova()` | Large fixed grid, runtime per fit matters. Drops losing candidates with a parametric test instead of searching. |

Annealing returns an `iteration_results` object with the same shape as a `tune_bayes()` output. Downstream helpers like `select_best()`, `finalize_workflow()`, and `last_fit()` treat the two interchangeably.

## Common pitfalls

**Three issues account for most disappointing annealing runs.**

1. **No warm start.** Calling with `initial = 1` starts from a single random point and burns iterations climbing out of nowhere. Pass a small `tune_grid()` result via `initial = init_res` so the walk begins in a sensible region.
2. **Too aggressive cooling.** A large `cooling_coef` cools the temperature fast, so the walk freezes before it explores. Drop to `cooling_coef = 0.01` when iterations end clustered at the starting point.
3. **Discrete or categorical heavy params.** Annealing proposes Gaussian neighbors, then snaps to the nearest legal value for discrete dials. Heavily discrete grids defeat the neighbor proposal logic; reach for `tune_grid()` or `tune_race_anova()` instead.

[WARNING]
**Set a seed before annealing.** The proposal noise, the acceptance probabilities, and the resample folds all draw from the RNG. Without `set.seed()` ahead of `tune_sim_anneal()`, two runs on the same data produce different traces and different best candidates.

## Try it yourself

**Try it:** Anneal a knn classifier on iris with 5-fold cross-validation, 15 iterations, and accuracy as the metric. Warm-start from a 4-point `tune_grid()` and pick the best `neighbors` value.

```r title="Your turn: anneal knn on iris"
# Try it: anneal knn on iris with finetune
library(tidymodels)
library(finetune)

set.seed(7)
ex_folds <- vfold_cv(iris, v = 5, strata = Species)

ex_spec <- nearest_neighbor(neighbors = tune()) |>
  set_engine("kknn") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_spec)

ex_init <- # your code here (small tune_grid)

ex_res  <- # your code here (tune_sim_anneal)

show_best(ex_res, metric = "accuracy", n = 3)
#> Expected: top 3 neighbor values discovered during the anneal
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_init <- tune_grid(
  ex_wf,
  resamples = ex_folds,
  grid      = 4,
  metrics   = metric_set(accuracy)
)

ex_res <- tune_sim_anneal(
  ex_wf,
  resamples = ex_folds,
  iter      = 15,
  initial   = ex_init,
  metrics   = metric_set(accuracy),
  control   = control_sim_anneal(no_improve = 8, restart = 5)
)

show_best(ex_res, metric = "accuracy", n = 3)
#> # A tibble: 3 x 8
#>   neighbors .metric  .estimator  mean     n std_err .config .iter
#>       <int> <chr>    <chr>      <dbl> <int>   <dbl> <chr>   <int>
#> 1         9 accuracy multiclass 0.973     5  0.0163 Iter08      8
#> 2        11 accuracy multiclass 0.967     5  0.0177 Iter12     12
#> 3         7 accuracy multiclass 0.960     5  0.0211 Iter04      4
```

**Explanation:** The four-point initial grid gives the annealer a sense of the metric landscape across `neighbors`. From there it proposes Gaussian neighbors rounded to integers and accepts or rejects each by the temperature schedule. Fifteen iterations is enough on iris because the surface across `neighbors` is smooth.

</details>

## Related tidymodels functions

**Annealing sits in the iterative tuners corner of the tidymodels family.**

- `tune_grid()` for the unraced, unannealed baseline.
- `tune_bayes()` for surrogate-driven global search.
- `finetune::tune_race_anova()` and `finetune::tune_race_win_loss()` for early-stopping racing on fixed grids.
- `control_sim_anneal()` to set cooling_coef, radius, no_improve, restart, and verbose_iter.
- `autoplot()` with `type = "performance"` for the iteration-by-iteration trace.
- `select_best()`, `finalize_workflow()`, `last_fit()` to lock in the survivor on full train and test.

External reference: the finetune package documentation at [finetune.tidymodels.org](https://finetune.tidymodels.org/reference/tune_sim_anneal.html).

## FAQ

**How is tune_sim_anneal() different from tune_bayes()?**

tune_bayes() fits a Gaussian process surrogate to past metric values and proposes the next candidate by maximizing an acquisition function across the parameter space. tune_sim_anneal() ignores the global surrogate; it picks a Gaussian neighbor of the current best, then accepts or rejects by metric improvement plus a temperature-controlled probability. Annealing is cheaper per iteration and shines on smooth landscapes. Bayes is more sample-efficient but pays the surrogate-fitting cost each round.

**When should I use tune_sim_anneal() versus tune_race_anova()?**

Racing assumes a fixed grid and scores the survivors efficiently. Annealing proposes candidates dynamically as the search proceeds. Use racing when you can enumerate the candidates and runtime per fit dominates. Use annealing when the parameter space is continuous and you want to refine around a starting point.

**Do I need a warm start with initial = tune_results?**

It is not required, but it is the single biggest leverage point for a productive anneal. Starting with `initial = 1` means the first proposal walks away from a single random point, which wastes early iterations climbing out of an arbitrary location. A 4 to 6 point `tune_grid()` result gives the annealer a sense of the landscape, so the temperature-controlled walk concentrates the iteration budget on improving rather than discovering.

**What control_sim_anneal() defaults should I tune first?**

`no_improve` is the highest-leverage knob. Default 10 stops the search after ten unproductive iterations; lower it for fast experiments, raise it when fits are cheap and you want to extract every drop. `restart = 8` jumps the walk back to the best-so-far point after eight stale iterations, which helps escape shallow local optima. Leave `cooling_coef = 0.02` unless iterations end clustered at the start (drop it) or end scattered far from the best (raise it).

**Can I parallelize tune_sim_anneal()?**

You can parallelize the resample evaluations inside each iteration, but the iterations themselves are sequential by design. Register a parallel backend with `library(doFuture); plan(multisession, workers = 4)` before the call. Each iteration then fans out the folds across workers, fits them in parallel, and the annealer waits for the fold metrics to make its accept-or-reject decision before proposing the next neighbor.
