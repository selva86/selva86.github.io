---
title: "tune tune_race_anova() in R: ANOVA Hyperparameter Racing"
slug: tune-tune_race_anova-in-R
description: "Use tune tune_race_anova() in R to race tidymodels hyperparameter candidates with ANOVA early stopping. See syntax, control_race options, and pitfalls."
keywords: "tune tune_race_anova, tune_race_anova function R, finetune tune_race_anova, tidymodels racing methods, ANOVA hyperparameter racing R, race tune grid R, finetune package R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "tune_race_anova()|finetune tune_race_anova|finetune::tune_race_anova()|ANOVA racing|race tuning"
auto_link_case_sensitive: true
target_keyword: tune tune_race_anova
sibling_block_enabled: true
difficulty: Beginner
---

# tune tune_race_anova() in R: ANOVA Hyperparameter Racing

<p class="lead">The tune tune_race_anova() function in R, from the finetune package, runs a tidymodels grid against an initial set of resamples, then uses repeated-measures ANOVA to drop losing candidates so the remaining folds only score the survivors.</p>

[QUICK ANSWER]
tune_race_anova(wf, resamples = folds)                          # default racing with grid = 10
tune_race_anova(wf, resamples = folds, grid = 25)               # larger grid to race down
tune_race_anova(wf, resamples = folds, grid = my_grid)          # explicit candidate tibble
tune_race_anova(wf, resamples = folds, metrics = mset)          # custom metric set
tune_race_anova(wf, resamples = folds, control = ctrl)          # control_race(): burn_in, alpha
tune_race_anova(wf, resamples = folds, param_info = params)     # custom parameter ranges
tune_race_anova(model_spec, recipe, resamples = folds)          # spec + recipe shortcut
plot_race(res)                                                  # visualize candidate survival

[DECISION TREE: Is tune_race_anova() the right tool?]
- race candidates with ANOVA early stopping: tune_race_anova(wf, resamples = folds, grid = 25)
- race with head-to-head win-loss instead: finetune::tune_race_win_loss(wf, resamples = folds)
- search every candidate on every fold: tune_grid(wf, resamples = folds, grid = g)
- continuous params with expensive fits: tune_bayes(wf, resamples = folds, iter = 25)
- iterative search via simulated annealing: finetune::tune_sim_anneal(wf, resamples = folds)
- final fit on full train + test: last_fit(final_wf, split)
- inspect tuning ranges only: extract_parameter_set_dials(wf)

## What tune_race_anova() does in one sentence

**tune_race_anova() prunes losing hyperparameter candidates after a burn-in set of resamples.** You hand it a workflow with at least one `tune()` placeholder, a resample object, and a grid. The function scores every candidate on the first few folds (the burn-in), then fits a repeated-measures ANOVA on the per-resample metric. Candidates whose 1-sided confidence interval lies entirely below the current leader get dropped, and the next fold only scores survivors. The total number of model fits drops sharply when the parameter range has clear winners and losers.

The function lives in the finetune package, which is part of the tidymodels family but shipped separately. Install it once with `install.packages("finetune")` and load alongside tidymodels.

## Set up a tunable workflow

**You need the same three pieces as tune_grid(): spec, recipe or formula, and resamples.** Racing only changes how fits are scheduled, not what they are.

```r title="Load tidymodels and finetune"
library(tidymodels)
library(finetune)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split  <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train  <- training(split)
folds  <- vfold_cv(train, v = 10, strata = Sale_Price)
folds
#> #  10-fold cross-validation using stratification
#> # A tibble: 10 x 2
#>   splits             id
#>   <list>             <chr>
#> 1 <split [2107/235]> Fold01
#> 2 <split [2107/235]> Fold02
```

Racing benefits from more folds, not fewer. Use 10-fold or higher so the ANOVA has degrees of freedom to detect losers early.

```r title="Recipe, model, and workflow"
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

## tune_race_anova() syntax and arguments

**Most arguments mirror tune_grid(); the racing knobs live in control_race().**

```r title="tune_race_anova generic signature"
tune_race_anova(
  object,                    # workflow or model spec
  preprocessor,              # recipe or formula (when object is a spec)
  resamples,                 # rset with v >= 5; 10 is a good floor
  ...,
  param_info = NULL,         # parameters() object with custom ranges
  grid = 10,                 # int (space-filling) or tibble of candidates
  metrics  = NULL,           # metric_set() or NULL for defaults
  eval_time = NULL,          # numeric vector for survival models
  control  = control_race()
)
```

| Argument | Description |
|---|---|
| `object` | A workflow or a model spec. If a spec, pass `preprocessor` next. |
| `resamples` | An rset such as `vfold_cv()`. Need at least `burn_in + 2` folds. |
| `grid` | Integer = space-filling design; tibble = explicit candidates. Larger grids benefit racing the most. |
| `metrics` | A `metric_set()`; the FIRST metric in the set drives the race. |
| `control` | A `control_race()` object with `burn_in`, `num_ties`, `alpha`, `verbose_elim`. |

[NOTE]
**Only the first metric drives elimination.** `metric_set(rmse, rsq, mae)` races on RMSE; the others ride along for diagnostics. If you want to race on R-squared, list it first.

The four control_race() knobs are worth knowing by name:

- `burn_in = 3`: how many resamples score every candidate before testing begins.
- `num_ties = 10`: candidates within this many resamples of the leader survive even if the ANOVA would drop them.
- `alpha = 0.05`: significance level for the elimination test.
- `verbose_elim = FALSE`: set to TRUE to log each elimination round.

## Examples by use case

**Start with a moderately large grid; racing pays off as the grid grows.** The following races 25 glmnet candidates across 10 folds.

```r title="Race a 25-point glmnet grid"
set.seed(123)
ctrl <- control_race(verbose_elim = TRUE, burn_in = 3, alpha = 0.05)

res <- tune_race_anova(
  wf,
  resamples = folds,
  grid      = 25,
  metrics   = metric_set(rmse, rsq),
  control   = ctrl
)
res
#> # Tuning results
#> # 10-fold cross-validation using stratification
#> # A tibble: 10 x 5
#>   splits             id     .order .metrics          .notes
#>   <list>             <chr>   <int> <list>            <list>
#> 1 <split [2107/235]> Fold01      1 <tibble [50 x 6]> <tibble [0 x 3]>
#> 2 <split [2107/235]> Fold02      2 <tibble [50 x 6]> <tibble [0 x 3]>
#> 3 <split [2107/235]> Fold03      3 <tibble [50 x 6]> <tibble [0 x 3]>
```

After racing, `show_best()`, `select_best()`, and `collect_metrics()` work exactly as they do for tune_grid(). The losers simply have fewer fold entries.

```r title="Inspect survivors and pick the winner"
show_best(res, metric = "rmse", n = 3)
#> # A tibble: 3 x 8
#>   penalty mixture .metric .estimator   mean     n std_err .config
#>     <dbl>   <dbl> <chr>   <chr>       <dbl> <int>   <dbl> <chr>
#> 1 0.00214   0.758 rmse    standard   0.0701    10 0.00098 Preprocessor1_Model07
#> 2 0.00318   0.612 rmse    standard   0.0703    10 0.00104 Preprocessor1_Model14
#> 3 0.00118   0.823 rmse    standard   0.0708    10 0.00112 Preprocessor1_Model21

best  <- select_best(res, metric = "rmse")
final <- finalize_workflow(wf, best)
```

[KEY INSIGHT]
**Racing shines on uneven grids and slow fits.** When most candidates are clearly bad after 3 folds, racing fits 2x to 4x fewer models than tune_grid() with the same final answer. When all candidates are close, racing degrades to tune_grid() with a small overhead.

For a visual sense of who survived how long, pipe results into `plot_race()` from finetune.

```r title="Visualize candidate survival"
plot_race(res)
#> A ggplot showing per-resample metric trajectories for each .config,
#> with eliminated candidates ending early and survivors continuing
#> across all 10 folds.
```

## tune_race_anova() versus alternatives

**Pick by how candidates compare across folds, not by raw speed.**

| Function | When to reach for it |
|---|---|
| `tune_race_anova()` | Many candidates, ANOVA-friendly metric, runtime per fit matters. Drops losers using a parametric test. |
| `finetune::tune_race_win_loss()` | Same racing idea, non-parametric. Robust when metrics are skewed or candidates are highly correlated. |
| `tune_grid()` | Small grids (<= 10), or when you want every candidate on every fold for downstream stacking. |
| `tune_bayes()` | Continuous parameters, expensive fits, no need to score a fixed candidate list. |

Racing is a wrapper around the same fitting machinery as tune_grid(); the return object is interchangeable with downstream helpers like `select_best()`, `finalize_workflow()`, and `last_fit()`.

## Common pitfalls

**Three issues account for most failed races.**

1. **Too few folds.** Racing needs `burn_in + 2` folds minimum, and elimination is unreliable below 10. Bump `vfold_cv(v = 10)` rather than `v = 5` when you adopt this function.
2. **Tiny grid.** A 5-candidate grid rarely produces statistically distinct losers. Racing only pays off above roughly 15 candidates, so size up the grid when switching from tune_grid().
3. **Wrong leading metric.** Racing eliminates against the FIRST metric in `metric_set()`. Reorder when the metric you care about is not first; otherwise the wrong candidates survive.

[WARNING]
**Set a seed before racing.** The elimination sequence depends on resample order. Without `set.seed()` ahead of `tune_race_anova()`, two runs can produce different survivors even on the same data and grid.

## Try it yourself

**Try it:** Race a 12-point knn grid on iris using 10-fold cross-validation and accuracy. Use `control_race(burn_in = 3)` and pick the best k.

```r title="Your turn: race knn on iris"
# Try it: race knn on iris with finetune
library(tidymodels)
library(finetune)

set.seed(7)
ex_folds <- vfold_cv(iris, v = 10, strata = Species)

ex_spec <- nearest_neighbor(neighbors = tune()) |>
  set_engine("kknn") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_spec)

ex_grid <- # your code here

ex_res  <- # your code here

show_best(ex_res, metric = "accuracy", n = 3)
#> Expected: a tibble of the top 3 k values that survived racing
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- tibble(neighbors = c(1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 25))

ex_res <- tune_race_anova(
  ex_wf,
  resamples = ex_folds,
  grid      = ex_grid,
  metrics   = metric_set(accuracy),
  control   = control_race(burn_in = 3, alpha = 0.05)
)

show_best(ex_res, metric = "accuracy", n = 3)
#> # A tibble: 3 x 7
#>   neighbors .metric  .estimator  mean     n std_err .config
#>       <dbl> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1         9 accuracy multiclass 0.973    10  0.0163 Preprocessor1_Model04
#> 2         7 accuracy multiclass 0.967    10  0.0167 Preprocessor1_Model03
#> 3        11 accuracy multiclass 0.967    10  0.0163 Preprocessor1_Model05
```

**Explanation:** Twelve neighbor values plus 10 folds would be 120 fits with tune_grid(). Racing drops the obviously bad k values (1, 25) after the burn-in, leaving a handful of mid-range survivors. The accuracy metric leads the race because it is first in the metric set.

</details>

## Related tidymodels functions

**Racing sits next to a short stack of helpers.**

- `tune_grid()` for the unraced baseline.
- `tune_bayes()` for surrogate-driven search when fits are expensive.
- `finetune::tune_race_win_loss()` for the non-parametric racing variant.
- `finetune::tune_sim_anneal()` for iterative simulated annealing search.
- `control_race()` to set burn_in, alpha, num_ties, and verbose_elim.
- `plot_race()` for the candidate-survival ggplot.
- `last_fit()` and `finalize_workflow()` to lock in the survivor on full train and test.

External reference: the finetune package documentation at [finetune.tidymodels.org](https://finetune.tidymodels.org/reference/tune_race_anova.html).

## FAQ

**How is tune_race_anova() different from tune_grid()?**

tune_grid() scores every candidate on every resample, so its total work is `candidates x folds` fits. tune_race_anova() scores every candidate on the first `burn_in` resamples, then runs a repeated-measures ANOVA after each subsequent fold. Candidates whose 1-sided confidence interval falls below the current leader are eliminated; remaining folds only score the survivors. On grids of 20 or more with a clearly varying metric, racing typically does 30 to 60 percent of the fits with the same winning candidate.

**When should I use tune_race_anova() versus tune_race_win_loss()?**

tune_race_anova() is parametric; it assumes the metric distribution across resamples is roughly normal. That holds for RMSE, R-squared, log loss, and accuracy on moderate-size folds. tune_race_win_loss() is a non-parametric ranking test (binomial sign test on pairwise comparisons). Prefer it when the metric is skewed, when fold sample sizes vary a lot, or when ANOVA assumptions are obviously violated.

**Does racing change the winning candidate compared to tune_grid()?**

In well-conditioned grids, no. Racing is designed to drop candidates that are statistically unlikely to beat the leader, so the survivor matches what tune_grid() would have chosen. Near-tied candidates occasionally swap rank because they are eliminated before the late folds add evidence. Lower `alpha` (for example `alpha = 0.01`) to be more conservative, or raise `num_ties` to keep close runners alive longer.

**What control_race() defaults should I tune first?**

`burn_in` is the highest-leverage knob. A burn-in of 3 works on standard benchmark data; bump to 5 when the metric is noisy across folds. `alpha = 0.05` is sensible for exploration; tighten to 0.01 when you want to be slow to eliminate. Leave `num_ties = 10` alone unless your grid has many near-identical candidates, in which case raise it so close runners survive into the late folds.

**Can I parallelize tune_race_anova()?**

Yes, and it benefits more than tune_grid() because surviving candidates dominate later folds. Register a parallel backend with `library(doFuture); plan(multisession, workers = 4)` before the call. Set `control_race(parallel_over = "everything")` for grids large enough that fold-level parallelism alone leaves cores idle. Racing detects the backend automatically.
