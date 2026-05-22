---
title: "tune tune_race_win_loss() in R: Win-Loss Racing"
slug: tune-tune_race_win_loss-in-R
description: "Use tune tune_race_win_loss() in R to race tidymodels hyperparameters with head-to-head pairwise comparisons. See syntax, control_race options, examples."
keywords: "tune tune_race_win_loss, tune_race_win_loss function R, finetune tune_race_win_loss, tidymodels racing methods, win loss racing R, race tune grid R, finetune package R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "tune_race_win_loss()|finetune tune_race_win_loss|finetune::tune_race_win_loss()|win-loss racing|win/loss racing"
auto_link_case_sensitive: true
target_keyword: tune tune_race_win_loss
sibling_block_enabled: true
difficulty: Beginner
---

# tune tune_race_win_loss() in R: Win-Loss Racing

<p class="lead">The tune tune_race_win_loss() function in R, from the finetune package, races tidymodels hyperparameter candidates with pairwise head-to-head matchups across resamples and drops losers using a log-rank style win/loss tally instead of an ANOVA fit.</p>

[QUICK ANSWER]
tune_race_win_loss(wf, resamples = folds)                       # default win/loss racing
tune_race_win_loss(wf, resamples = folds, grid = 30)            # larger candidate grid
tune_race_win_loss(wf, resamples = folds, grid = my_grid)       # explicit candidate tibble
tune_race_win_loss(wf, resamples = folds, metrics = mset)       # custom metric set
tune_race_win_loss(wf, resamples = folds, control = ctrl)       # control_race(): burn_in, alpha
tune_race_win_loss(wf, resamples = folds, param_info = params)  # custom parameter ranges
tune_race_win_loss(spec, recipe, resamples = folds)             # spec + recipe shortcut
plot_race(res)                                                  # visualize candidate eliminations

[DECISION TREE: Is tune_race_win_loss() the right tool?]
- race candidates with pairwise win/loss tally: tune_race_win_loss(wf, resamples = folds, grid = 30)
- race with ANOVA early stopping instead: finetune::tune_race_anova(wf, resamples = folds)
- score every candidate on every fold: tune_grid(wf, resamples = folds, grid = g)
- continuous params, expensive fits: tune_bayes(wf, resamples = folds, iter = 25)
- iterative simulated annealing search: finetune::tune_sim_anneal(wf, resamples = folds)
- finalize a winner and refit on full data: last_fit(final_wf, split)
- inspect tunable parameters first: extract_parameter_set_dials(wf)

## What tune_race_win_loss() does in one sentence

**tune_race_win_loss() runs a pairwise tournament between hyperparameter candidates and drops losers.** You hand it a workflow with at least one `tune()` placeholder, a resample object, and a grid. The function scores every candidate on a burn-in set of folds, then for each new fold counts how many head-to-head matchups each candidate wins against every other. A log-rank style test compares those win counts; candidates whose tally falls significantly behind the current leader are dropped, and the next fold only fits the survivors. The number of model fits drops sharply when one parameter combination clearly dominates.

The function lives in the finetune package, shipped separately from the tidymodels metapackage. Install it once with `install.packages("finetune")` and load it alongside tidymodels.

## When to choose win-loss over ANOVA racing

**Pick win-loss racing when your metric distribution is skewed, bounded, or non-normal.** The companion function `tune_race_anova()` runs a repeated-measures ANOVA on per-resample metric values, so it leans on roughly normal residuals. Win/loss racing only needs to count which candidate beat which, so it is robust to:

- Bounded metrics near the ceiling (accuracy at 0.98 across folds, ROC AUC near 1.0).
- Heavy-tailed loss metrics where one bad fold skews ANOVA badly.
- Classification metrics that vary in chunks rather than a smooth scale.

[TIP]
**Default to ANOVA for regression, win/loss for classification.** Regression RMSE is usually well-behaved across folds, so ANOVA gets more statistical power. Classification accuracy and ROC AUC bunch near 1.0, where win/loss is more stable.

## Set up a tunable workflow

**Build the same three pieces you would for tune_grid(): spec, recipe, resamples.** Racing changes how fits are scheduled, not what they are.

```r title="Load tidymodels and finetune"
library(tidymodels)
library(finetune)
set.seed(42)

iris_bin <- iris |>
  filter(Species != "setosa") |>
  mutate(Species = factor(Species))

split <- initial_split(iris_bin, prop = 0.75, strata = Species)
train <- training(split)
folds <- vfold_cv(train, v = 10, strata = Species)
folds
#> #  10-fold cross-validation using stratification
#> # A tibble: 10 x 2
#>   splits          id
#>   <list>          <chr>
#> 1 <split [67/8]>  Fold01
#> 2 <split [67/8]>  Fold02
```

Racing methods benefit from more resamples, not fewer. Use 10 folds minimum so the win/loss tournament has enough matchups to detect losers early.

```r title="Recipe, model spec, workflow"
rec <- recipe(Species ~ ., data = train) |>
  step_normalize(all_numeric_predictors())

rf_spec <- rand_forest(
    mtry  = tune(),
    trees = tune(),
    min_n = tune()
  ) |>
  set_engine("ranger") |>
  set_mode("classification")

wf <- workflow() |>
  add_recipe(rec) |>
  add_model(rf_spec)
wf
#> == Workflow ================================================
#> Preprocessor: Recipe
#> Model: rand_forest()
```

Three tunable parameters give a candidate grid wide enough that racing actually saves work. Two-parameter grids rarely benefit, because the burn-in already covers most candidates.

## tune_race_win_loss() syntax and arguments

**The signature mirrors tune_grid() with one extra `control` knob.**

```r title="Full call signature"
tune_race_win_loss(
  object,                 # workflow or model spec
  preprocessor = NULL,    # recipe or formula if object is a spec
  resamples,              # rset (vfold_cv, bootstraps, etc.)
  ...,
  param_info = NULL,      # custom dials parameter ranges
  grid = 10,              # integer or tibble of candidate parameters
  metrics = NULL,         # metric_set(); defaults per mode
  eval_time = NULL,       # survival models only
  control = control_race()
)
```

Key arguments:

| Argument | What it controls |
|---|---|
| `grid` | Integer asks dials to build a space-filling grid; a tibble lets you pass an explicit candidate set. |
| `metrics` | A `metric_set()`; the first metric ranks candidates. |
| `control` | A `control_race()` object: `burn_in`, `alpha`, `num_ties`, `randomize`, `verbose_elim`. |
| `param_info` | Override default `dials` ranges for any `tune()` placeholder. |

[NOTE]
**control_race() differs from control_grid() in three knobs.** `burn_in` sets resamples evaluated before elimination starts, `alpha` is the p-value cutoff, and `num_ties` controls how many ties to allow before declaring a winner.

## Examples by use case

**Race a default grid with default settings first.** Get a baseline timing before tuning the control object.

```r title="Default race"
set.seed(7)
race1 <- tune_race_win_loss(
  wf,
  resamples = folds,
  grid      = 20,
  metrics   = metric_set(roc_auc, accuracy)
)
show_best(race1, metric = "roc_auc", n = 3)
#> # A tibble: 3 x 9
#>    mtry trees min_n .metric .estimator  mean     n std_err .config
#>   <int> <int> <int> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1     2  1438    14 roc_auc binary     0.952    10 0.0162  Preprocessor1_Model09
#> 2     1   821     9 roc_auc binary     0.948    10 0.0174  Preprocessor1_Model03
#> 3     3   267    21 roc_auc binary     0.946    10 0.0181  Preprocessor1_Model17
```

`show_best()` displays only the survivors. Candidates dropped during racing show fewer than 10 resamples in their `n` column when inspected with `collect_metrics()`.

```r title="Visualize the tournament"
plot_race(race1)
#> Plots one line per candidate.
#> Lines stop at the fold where the candidate was eliminated.
#> Survivors run the full length of the x-axis.
```

The `plot_race()` chart is the fastest way to see how aggressive the elimination was. A wall of short stumps means racing eliminated most candidates early; many long lines means the candidates were close in performance.

```r title="Tighter alpha drops candidates faster"
ctrl <- control_race(burn_in = 3, alpha = 0.10, verbose_elim = TRUE)
race2 <- tune_race_win_loss(
  wf,
  resamples = folds,
  grid      = 20,
  metrics   = metric_set(roc_auc),
  control   = ctrl
)
#> Racing eliminated 8 candidates at fold 04
#> Racing eliminated 4 candidates at fold 05
#> Racing eliminated 2 candidates at fold 06
collect_metrics(race2, summarize = FALSE) |>
  count(.config)
#> # A tibble: 20 x 2
#>   .config                   n
#>   <chr>                 <int>
#> 1 Preprocessor1_Model01     3
#> 2 Preprocessor1_Model02    10
```

`alpha = 0.10` is more aggressive than the default `0.05`; weaker candidates drop after the burn-in folds. The `verbose_elim` flag logs the elimination count per fold, which is helpful when debugging why racing finished too fast.

```r title="Finalize the winning workflow"
best <- select_best(race2, metric = "roc_auc")
final_wf <- finalize_workflow(wf, best)
final_fit <- last_fit(final_wf, split)
collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric  .estimator .estimate .config
#>   <chr>    <chr>          <dbl> <chr>
#> 1 accuracy binary         0.960 Preprocessor1_Model1
#> 2 roc_auc  binary         0.992 Preprocessor1_Model1
```

The end-to-end flow is identical to `tune_grid()`: select, finalize, last_fit. Only the search step changed.

## tune_race_win_loss() versus alternatives

| Function | Mechanism | Best for | Avoid when |
|---|---|---|---|
| `tune_race_win_loss()` | Pairwise win/loss tally per fold, log-rank test | Classification, bounded metrics, skewed losses | Few candidates, very similar performance |
| `tune_race_anova()` | Repeated-measures ANOVA on per-fold metric | Regression with normal residuals | Heavy-tailed or bounded metrics |
| `tune_grid()` | Score every candidate on every fold | Small grids, when you want full diagnostics | Large grids and expensive fits |
| `tune_bayes()` | Gaussian-process surrogate, iterative | Continuous params, expensive single fits | Mostly-categorical hyperparameters |
| `tune_sim_anneal()` | Simulated annealing search | Bumpy loss surfaces, slow models | Cheap fits where a grid is fine |

[KEY INSIGHT]
**Racing is grid search with early stopping.** It cannot find candidates outside the supplied grid. Use `tune_bayes()` or `tune_sim_anneal()` when you need to search continuous space, then race a fine grid around the best region.

## Common pitfalls

**Skipping the burn-in.** Setting `burn_in = 1` looks tempting but lets a single lucky fold eliminate strong candidates. Three to five burn-in folds keeps elimination decisions stable.

```r title="Bad: aggressive burn_in"
control_race(burn_in = 1, alpha = 0.20)
# Half the grid drops after one fold, often the wrong half.
```

**Treating low n_survivors as a bug.** If only two candidates remain after racing, racing did its job. Inspect with `collect_metrics(race, summarize = FALSE)` to confirm losers had clear evidence against them.

**Forgetting parallel registration.** Racing is embarrassingly parallel across folds and survivors. Without a registered backend, win/loss racing on 10 folds runs single-threaded.

```r title="Register parallel backend"
library(doParallel)
cl <- makePSOCKcluster(parallel::detectCores() - 1)
registerDoParallel(cl)
# tune_race_win_loss now uses all but one core.
```

[WARNING]
**Win/loss racing needs at least 3 candidates to start.** Two-candidate grids cannot form a tournament; the function will error or fall back to a plain comparison. Use `tune_grid()` for grids of size two.

## Try it yourself

**Try it:** Race a `decision_tree(cost_complexity = tune(), tree_depth = tune())` workflow against `iris_bin` with `grid = 15` and an aggressive `alpha = 0.10`. Save the result to `ex_race`.

```r title="Your turn: race a decision tree"
# Try it: race a decision_tree
ex_spec <- decision_tree(
    cost_complexity = tune(),
    tree_depth      = tune()
  ) |>
  set_engine("rpart") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_recipe(rec) |>
  add_model(ex_spec)

ex_race <- # your code here

show_best(ex_race, metric = "roc_auc", n = 3)
#> Expected: a tibble with 3 rows, mean roc_auc column visible
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
ex_race <- tune_race_win_loss(
  ex_wf,
  resamples = folds,
  grid      = 15,
  metrics   = metric_set(roc_auc),
  control   = control_race(burn_in = 3, alpha = 0.10)
)
show_best(ex_race, metric = "roc_auc", n = 3)
#> # A tibble: 3 x 8
#>   cost_complexity tree_depth .metric .estimator  mean     n std_err .config
#>             <dbl>      <int> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1        0.000316          5 roc_auc binary     0.943    10 0.0184  Preprocessor1_Model08
```

**Explanation:** The call mirrors the random forest race. The `decision_tree()` spec carries the two `tune()` placeholders; `grid = 15` builds a space-filling design across both, and the aggressive `alpha = 0.10` prunes losers quickly. `show_best()` returns only the survivors with their per-fold scores.

</details>

## Related tidymodels functions

- `tune_race_anova()`: ANOVA-based racing for regression and well-behaved metrics.
- `tune_grid()`: exhaustive grid search; the baseline you race against.
- `tune_bayes()`: Bayesian optimization for continuous hyperparameters.
- `control_race()`: burn-in, alpha, and tie controls for racing methods.
- `plot_race()`: visualize per-fold candidate survival.

[Official finetune racing reference](https://finetune.tidymodels.org/reference/tune_race_win_loss.html)

## FAQ

**When should I use tune_race_win_loss() instead of tune_race_anova()?**

Use win/loss when the metric is bounded, skewed, or categorical-like, classification accuracy, ROC AUC near 1.0, and Brier scores all qualify. ANOVA wants approximately normal per-resample residuals, which regression RMSE usually meets but classification accuracy rarely does. Empirically, win/loss eliminates fewer false losers when metrics cluster near a ceiling.

**Does tune_race_win_loss() need a parallel backend?**

It runs single-threaded by default. Racing scales well across cores because each fold fits independent models for each survivor. Register a backend with `doParallel::registerDoParallel()` before the call to use multiple cores. On a 10-fold race with 20 candidates, parallel typically cuts wall time by 60 to 80 percent.

**Why does plot_race() show some lines stopping mid-axis?**

Each line traces one candidate's per-fold metric. A line that stops mid-axis means racing eliminated that candidate at the corresponding fold; only survivors run the full length. The visualization is the fastest way to confirm racing eliminated candidates aggressively rather than dragging losers through every fold.

**Can I race a custom grid instead of a generated one?**

Yes. Pass a tibble of candidate values to the `grid` argument; the column names must match the `tune()` placeholders. This is useful when you have prior knowledge of a sensible parameter range and want to skip the dials space-filling design.

**Does tune_race_win_loss() support multi-metric scoring?**

It accepts a `metric_set()` with multiple metrics, but only the first metric drives elimination decisions. The remaining metrics are recorded for survivors and shown by `collect_metrics()`. Order the set deliberately, the metric you put first is the one racing optimizes.
