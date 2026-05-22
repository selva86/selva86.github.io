---
title: "caret safs() in R: Simulated Annealing Feature Selection"
slug: "caret-safs-in-R"
description: "Use caret safs() in R for simulated annealing feature selection. Covers safsControl, the rfSA and treebagSA backends, and a worked variable selection example."
keywords: "caret safs, safs function R, caret safs example, simulated annealing feature selection R, caret feature selection, safsControl R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "safs()|caret safs|caret::safs()|simulated annealing feature selection|safsControl()"
auto_link_case_sensitive: true
target_keyword: "caret safs"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# caret safs() in R: Simulated Annealing Feature Selection

<p class="lead">The caret <code>safs()</code> function runs simulated annealing feature selection in R: it walks a single candidate predictor subset through small mutations, accepting better neighbours always and worse ones with a cooling probability until it settles on a compact, high-scoring set of features.</p>

[QUICK ANSWER]
safs(x, y, iters = 100, safsControl = sa_ctrl)    # core call
safsControl(functions = rfSA, method = "cv")       # random forest backend
safsControl(functions = treebagSA)                 # bagged tree backend
safsControl(improve = 25)                          # restart after 25 stale iters
safs_fit$optVariables                              # the chosen variables
safs_fit$fit                                       # model on the final subset
plot(safs_fit) + theme_bw()                        # internal vs external score

[DECISION TREE: Is safs() the right tool?]
- search feature subsets with simulated annealing: safs(x, y, iters = 100)
- search with a genetic algorithm instead: gafs(x, y, iters = 10)
- rank then eliminate by resampling: rfe(x, y, sizes, rfeControl)
- filter predictors one at a time: sbf(x, y, sbfControl)
- drop near-constant columns first: nearZeroVar(df, names = TRUE)
- drop correlated predictors first: findCorrelation(cor(df))
- just rank importance, no selection: varImp(model)

## What safs() does in one sentence

**`safs()` runs simulated annealing to search for the best feature subset.** Simulated annealing starts from a single random subset and proposes a neighbouring subset by flipping one predictor in or out. It scores the neighbour with a model, accepts it outright when the score improves, and accepts a worse neighbour with a probability that shrinks as a temperature parameter cools.

That cooling rule lets the search escape early local optima while still settling on a strong solution by the final iteration. Because `safs()` evaluates one subset per iteration rather than a whole population, each step is cheap compared with `gafs()`. The trade-off is convergence speed: simulated annealing usually needs many more iterations than a genetic search to cover the same ground.

## safs() syntax and arguments

**`safs()` needs a predictor set, an outcome, an iteration count, and a control object.** The control object selects the backend model, the resampling scheme that estimates honest performance, and a restart rule for stalled searches.

```r title="Load caret and prepare data"
library(caret)

set.seed(1)
x <- mtcars[, c("cyl", "disp", "hp", "drat", "wt", "qsec", "gear", "carb")]
y <- mtcars$mpg
dim(x)
#> [1] 32  8
```

The arguments that matter most are:

- `x`: a data frame or matrix of predictors only, with the outcome removed.
- `y`: the response, numeric for regression or a factor for classification.
- `iters`: the number of simulated-annealing steps the search runs.
- `differences`: if `TRUE`, the printout reports the gap between internal and external scores.
- `safsControl`: the object returned by `safsControl()`, which sets the backend, resampling, and the `improve` restart rule.

[TIP]
**Always set a seed before `safs()`.** The starting subset is random and every neighbour proposal is stochastic, so two runs without a seed can return different features. A `set.seed()` call directly before `safs()` makes the selected subset reproducible across re-runs.

## A worked safs() example

**Build the control object first, then pass it to `safs()`.** Here `rfSA` powers the search with random forests and `method = "cv"` requests 5-fold external cross-validation. The `iters` value is kept small so the example finishes quickly; production runs typically use 100 to 500 iterations.

```r title="Run simulated annealing feature selection"
sa_ctrl <- safsControl(functions = rfSA, method = "cv", number = 5)

set.seed(1)
safs_fit <- safs(x, y, iters = 10, safsControl = sa_ctrl)
safs_fit
#> Simulated Annealing Feature Selection
#>
#> 32 samples
#> 8 predictors
#>
#> Maximum search iterations: 10
#>
#> External performance values: RMSE, Rsquared, MAE
#> External resampling method: Cross-Validated (5 fold)
#>
#> The final subset selected 5 variables (out of 8)
```

The annealing walk explored ten neighbouring subsets and settled on five predictors. The external cross-validation loop scored the best-so-far subset on held-out folds, so the reported performance reflects how the model would generalise to new data.

```r title="Extract the selected predictors"
safs_fit$optVariables
#> [1] "cyl"  "hp"   "wt"   "qsec" "carb"

length(safs_fit$optVariables)
#> [1] 5
```

[KEY INSIGHT]
**Temperature is what makes simulated annealing different from greedy search.** Early on, the acceptance probability for a worse subset is high, so the search is willing to take a step backwards if it might lead somewhere better. As temperature cools, those backward steps become unlikely and the search converges, behaving more like a greedy hill-climber by the final iterations.

## Tuning the annealing search

**The `functions` argument decides which model scores each candidate subset.** caret ships three ready-made simulated-annealing backends, and the right one depends on your outcome type and how nonlinear the relationships are.

| `functions` | Model used | Best for |
|---|---|---|
| `rfSA` | Random forest | Mixed predictors, nonlinear effects |
| `treebagSA` | Bagged trees | Robust search with few tuning knobs |
| `caretSA` | Any `train()` model | Custom model chosen via `method` |

Two `safsControl()` settings shape how the search behaves. The `improve` argument restarts the walk from the best-so-far subset after that many iterations without improvement, which prevents long runs of unproductive moves. The `holdout` argument carves an internal holdout slice for scoring proposals, so the internal score is less optimistic. The full backend reference lives in the [caret feature selection guide](https://topepo.github.io/caret/feature-selection-using-simulated-annealing.html).

[NOTE]
**`safs()` is a wrapper method, like `rfe()` and `gafs()`.** All three judge predictors by how a real model performs rather than by a standalone statistic. `safs()` is distinct in that it proposes one move at a time and uses temperature to control exploration, which is cheaper per iteration but slower to converge than a genetic search.

## Common pitfalls

**Three mistakes account for most disappointing `safs()` runs.** Each one has a clear symptom once you know what to look for.

- **Setting `iters` too low.** Simulated annealing needs many iterations because each step changes only one predictor. Ten or twenty iterations rarely cool the temperature enough to settle. Start around `iters = 100`, raise it if the internal score is still climbing in the final third of the run.
- **Forgetting the `improve` restart.** Without a sensible `improve` value the search can spend hundreds of iterations on a plateau. A common rule is `improve = iters / 4`, which forces a restart from the best subset after a quarter of the run with no gain.
- **Reading the internal score as the final answer.** The internal RMSE drove the search, so it is optimistic. Always inspect the external performance printed by `safs_fit`, or score the final subset on a fresh hold-out set.

[WARNING]
**`safs()` runtime grows with `iters`, not with `popSize`.** Unlike `gafs()` it fits one model per iteration, multiplied by the external resampling folds. A run with `iters = 200` and 10-fold CV trains 2,000 models. Profile on small settings before scaling up, and set `allowParallel = TRUE` in `safsControl()` when you have cores to spare.

## Try it yourself

**Try it:** Run simulated annealing feature selection on the four iris measurements to classify `Species`, using the random forest backend and 5-fold cross-validation. Save the result to `ex_safs`.

```r title="Your turn: safs on iris"
# Try it: select predictors for Species
ex_ctrl <- safsControl(functions = rfSA, method = "cv", number = 5)
ex_safs <- # your code here

ex_safs$optVariables
#> Expected: the petal measurements dominate the subset
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_ctrl <- safsControl(functions = rfSA, method = "cv", number = 5)
ex_safs <- safs(iris[, 1:4], iris$Species,
                iters = 10, safsControl = ex_ctrl)
ex_safs$optVariables
#> [1] "Petal.Length" "Petal.Width"
```

**Explanation:** The annealing search scores subsets with random forest accuracy and converges on the two petal measurements, since they separate the iris species far better than the sepal measurements.

</details>

## Related caret functions

**`safs()` is one of several feature-selection tools in caret.** Reach for a neighbour when an annealing search is not the right fit:

- `gafs()`: genetic algorithm search over feature subsets.
- `rfe()`: recursive feature elimination, ranks then drops predictors.
- `sbf()`: selection by filter, scores predictors one at a time.
- `varImp()`: ranks predictor importance without removing anything.
- `nearZeroVar()`: drops near-constant columns before any search.

## FAQ

**What is the difference between safs() and gafs()?**

Both are wrapper methods that score predictor subsets with a real model under resampling. `gafs()` evolves a whole population of subsets through crossover and mutation, exploring many combinations at once. `safs()` walks a single subset through neighbour proposals, accepting worse moves with a cooling probability. `gafs()` typically needs fewer iterations because each one tests many candidates, while `safs()` is cheaper per iteration. Use `gafs()` for breadth and `safs()` when each model fit is expensive.

**How many iterations does safs() need?**

The default is `iters = 10`, which is rarely enough. Simulated annealing changes one predictor per step, so a run usually needs 100 to 500 iterations for the temperature to cool through a useful range. Plot the internal versus external score with `plot(safs_fit)` and check whether the curve is still climbing in the final third of the run. If it is, raise `iters` and rerun with the same seed.

**What does safsControl() do?**

`safsControl()` configures everything outside the annealing operators. Its `functions` argument picks the backend model (`rfSA`, `treebagSA`, or `caretSA`), `method` and `number` set the external resampling scheme, `improve` controls the restart rule for stalled searches, and `holdout` carves an internal slice for scoring proposals. The object it returns goes into the `safsControl` argument of `safs()`, keeping search settings separate from model settings.

**Can safs() be used for classification?**

Yes. Pass a factor as `y` and the search switches to a classification backend automatically. With `rfSA` it scores subsets by accuracy or Kappa instead of RMSE, and `safs()` returns the subset of predictors that maximises classification performance across the external resampling folds. Set `metric = "Kappa"` in `safsControl()` if class balance is uneven.
