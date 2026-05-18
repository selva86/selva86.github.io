---
title: "caret gafs() in R: Genetic Algorithm Feature Selection"
slug: "caret-gafs-in-R"
description: "Use caret gafs() in R for genetic algorithm feature selection. Covers gafsControl, the rfGA and treebagGA backends, and a worked variable selection example."
keywords: "caret gafs, gafs function R, caret gafs example, genetic algorithm feature selection R, caret feature selection, gafsControl R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "gafs()|caret gafs|caret::gafs()|genetic algorithm feature selection|gafsControl()"
auto_link_case_sensitive: true
target_keyword: "caret gafs"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# caret gafs() in R: Genetic Algorithm Feature Selection

<p class="lead">The caret <code>gafs()</code> function runs genetic algorithm feature selection in R: it evolves a population of candidate predictor subsets across generations, breeding the best performers until it converges on a compact, high-scoring set of features.</p>

[QUICK ANSWER]
gafs(x, y, iters = 10, gafsControl = ga_ctrl)   # core call
gafsControl(functions = rfGA, method = "cv")     # random forest backend
gafsControl(functions = treebagGA)               # bagged tree backend
gafs(x, y, popSize = 20, pmutation = 0.1)        # tune the search
gafs_fit$optVariables                            # the chosen variables
gafs_fit$fit                                     # model on the final subset
plot(gafs_fit) + theme_bw()                      # fitness across generations

[DECISION TREE: Is gafs() the right tool?]
- search feature subsets with a GA: gafs(x, y, iters = 10)
- search with simulated annealing instead: safs(x, y, iters = 100)
- rank then eliminate by resampling: rfe(x, y, sizes, rfeControl)
- filter predictors one at a time: sbf(x, y, sbfControl)
- drop near-constant columns first: nearZeroVar(df, names = TRUE)
- drop correlated predictors first: findCorrelation(cor(df))
- just rank importance, no selection: varImp(model)

## What gafs() does in one sentence

**`gafs()` runs a genetic algorithm to search for the best feature subset.** A genetic algorithm treats each candidate subset as a chromosome, a binary string where a 1 keeps a predictor and a 0 drops it. It starts from a random population of subsets, scores each one by fitting a model, then breeds the strongest performers through crossover and mutation to seed the next generation.

Over successive generations the population drifts toward subsets that score well on resampled data. Because the search explores combinations rather than judging predictors one at a time, `gafs()` can keep variables that only help when paired with others, an interaction that a filter method cannot see. The trade-off is cost: every chromosome in every generation needs a model fit, so `gafs()` runs far slower than `rfe()` or `sbf()`.

## gafs() syntax and arguments

**`gafs()` needs a predictor set, an outcome, an iteration count, and a control object.** The control object decides which model scores each subset and how external resampling estimates honest performance.

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
- `iters`: the number of generations the genetic algorithm runs.
- `popSize`: how many candidate subsets live in each generation.
- `pcrossover` and `pmutation`: probabilities that control how offspring subsets are bred.
- `gafsControl`: the object returned by `gafsControl()`, which sets the backend model and resampling.

[TIP]
**Always set a seed before `gafs()`.** The genetic algorithm seeds its first population at random and mutates subsets stochastically, so two runs can return different features. A `set.seed()` call directly before `gafs()` makes the selected subset reproducible.

## A worked gafs() example

**Build the control object first, then pass it to `gafs()`.** Here `rfGA` powers the search with random forests and `method = "cv"` requests 5-fold external cross-validation. The `iters` and `popSize` values are kept small so the example finishes quickly.

```r title="Run genetic algorithm feature selection"
ga_ctrl <- gafsControl(functions = rfGA, method = "cv", number = 5)

set.seed(1)
gafs_fit <- gafs(x, y, iters = 5, popSize = 10, gafsControl = ga_ctrl)
gafs_fit
#> Genetic Algorithm Feature Selection
#>
#> 32 samples
#> 8 predictors
#>
#> Maximum generations: 5
#> Population per generation: 10
#> Crossover probability: 0.8
#> Mutation probability: 0.1
#>
#> External performance values: RMSE, Rsquared, MAE
#> External resampling method: Cross-Validated (5 fold)
#>
#> The final subset selected 4 variables (out of 8)
```

The genetic algorithm explored subsets for five generations and converged on four predictors. The external cross-validation loop scored each generation's best subset on held-out folds, so the reported performance reflects how the model would generalize.

```r title="Extract the selected predictors"
gafs_fit$optVariables
#> [1] "cyl"  "hp"   "wt"   "qsec"

length(gafs_fit$optVariables)
#> [1] 4
```

[KEY INSIGHT]
**`gafs()` runs two nested resampling loops.** The inner loop scores chromosomes to drive the genetic search, while the outer loop holds back folds to estimate true performance of the whole selection process. Reading the outer score keeps you honest, because the inner score is optimistic by design.

## Tuning the genetic search

**The `functions` argument decides which model scores each candidate subset.** caret ships three ready-made genetic-algorithm backends, and the right one depends on your outcome type and how nonlinear the relationships are.

| `functions` | Model used | Best for |
|---|---|---|
| `rfGA` | Random forest | Mixed predictors, nonlinear effects |
| `treebagGA` | Bagged trees | Robust search with few tuning knobs |
| `caretGA` | Any `train()` model | Custom model chosen via `method` |

The genetic operators control how aggressively the search explores. A larger `popSize` covers more subsets per generation, more `iters` gives the population longer to converge, and a higher `pmutation` injects diversity that helps escape a local optimum. The full backend reference lives in the [caret feature selection guide](https://topepo.github.io/caret/feature-selection-using-genetic-algorithms.html).

[NOTE]
**`gafs()` is a wrapper method, like `rfe()`.** Both judge predictors by how a real model performs rather than by a standalone statistic. `gafs()` differs by searching combinations through evolution instead of stepwise elimination, which makes it slower but better at uncovering predictor interactions.

## Common pitfalls

**Three mistakes account for most disappointing `gafs()` runs.** Each one has a clear symptom once you know what to look for.

- **Setting `iters` and `popSize` too low.** A genetic algorithm needs a reasonable population and enough generations to evolve. Tiny values converge on a near-random subset. Start around `popSize = 20` and `iters = 10`, then raise them if the fitness curve is still climbing.
- **Leaving the outcome inside `x`.** If the response column stays in the predictor matrix, every model fits it perfectly and `gafs()` keeps only that column. Always build `x` and `y` as separate objects.
- **Trusting the internal score as a final result.** The internal RMSE drove the search, so it is optimistic. Read `gafs_fit` external performance, or score the final subset on a fresh hold-out set.

[WARNING]
**`gafs()` is computationally expensive.** It fits one model per chromosome per generation, multiplied by every external resampling fold. A run with `popSize = 50`, `iters = 20`, and 10-fold CV trains 10,000 models. Profile on small settings before scaling up, and consider `allowParallel = TRUE` in `gafsControl()`.

## Try it yourself

**Try it:** Run genetic algorithm feature selection on the four iris measurements to classify `Species`, using the random forest backend and 5-fold cross-validation. Save the result to `ex_gafs`.

```r title="Your turn: gafs on iris"
# Try it: select predictors for Species
ex_ctrl <- gafsControl(functions = rfGA, method = "cv", number = 5)
ex_gafs <- # your code here

ex_gafs$optVariables
#> Expected: the petal measurements dominate the subset
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_ctrl <- gafsControl(functions = rfGA, method = "cv", number = 5)
ex_gafs <- gafs(iris[, 1:4], iris$Species,
                iters = 5, popSize = 10, gafsControl = ex_ctrl)
ex_gafs$optVariables
#> [1] "Petal.Length" "Petal.Width"
```

**Explanation:** The genetic algorithm scores subsets with random forest accuracy and evolves toward the two petal measurements, since they separate the iris species far better than the sepal measurements.

</details>

## Related caret functions

**`gafs()` is one of several feature-selection tools in caret.** Reach for a neighbour when an evolutionary search is not the right fit:

- `safs()`: simulated annealing search over feature subsets.
- `rfe()`: recursive feature elimination, ranks then drops predictors.
- `sbf()`: selection by filter, scores predictors one at a time.
- `varImp()`: ranks predictor importance without removing anything.
- `nearZeroVar()`: drops near-constant columns before any search.

## FAQ

**What is the difference between gafs() and rfe()?**

Both are wrapper methods that judge predictors by model performance under resampling. `rfe()` ranks predictors and removes the weakest in a fixed stepwise order, so it follows one path. `gafs()` evolves a whole population of subsets through crossover and mutation, exploring many combinations at once. `gafs()` is slower but can find predictor interactions that a stepwise search walks past. Use `rfe()` for speed and `gafs()` when combinations matter.

**How long does gafs() take to run?**

`gafs()` fits one model for every chromosome in every generation, then multiplies that by each external resampling fold. A run with `popSize = 50`, `iters = 20`, and 10-fold cross-validation trains roughly 10,000 models. Runtime grows with all three settings and the cost of the backend model. Start small, watch the fitness curve, and enable `allowParallel = TRUE` in `gafsControl()` before scaling up.

**What does gafsControl() do?**

`gafsControl()` configures everything outside the genetic operators. Its `functions` argument picks the backend model (`rfGA`, `treebagGA`, or `caretGA`), `method` and `number` set the external resampling scheme, and `metric` chooses the score used to compare generations. The object it returns is passed to the `gafsControl` argument of `gafs()`, keeping search settings separate from evolution settings.

**Can gafs() be used for classification?**

Yes. Pass a factor as `y` and the genetic algorithm switches to a classification backend automatically. With `rfGA` it scores subsets by accuracy or Kappa instead of RMSE, and `gafs()` reports the subset of predictors that maximizes classification performance across the external resampling folds.
