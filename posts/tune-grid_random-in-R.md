---
title: "dials grid_random() in R: Random Hyperparameter Grids"
slug: tune-grid_random-in-R
description: "Use dials grid_random() in R to draw random hyperparameter candidates for tune_grid(). See syntax, size, reproducibility, examples, and common pitfalls."
keywords: "dials grid_random, grid_random R, grid_random tidymodels, grid_random function R, random tuning grid R, hyperparameter random search R, tidymodels random grid"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "grid_random()|dials::grid_random()|dials grid_random|random tuning grid|random grid dials"
auto_link_case_sensitive: true
target_keyword: dials grid_random
sibling_block_enabled: true
difficulty: Beginner
---

# dials grid_random() in R: Random Hyperparameter Grids

<p class="lead">The dials grid_random() function in R draws independent uniform samples from each tuning parameter's range, returning a tibble of candidate combinations you hand to tune_grid() when an exhaustive cartesian grid is too large.</p>

[QUICK ANSWER]
grid_random(penalty(), size = 25)                              # one parameter, 25 draws
grid_random(penalty(), mixture(), size = 30)                   # two parameters
grid_random(penalty(range = c(-4, 0)), size = 20)              # custom log10 range
grid_random(extract_parameter_set_dials(wf), size = 50)        # from a workflow
grid_random(mtry(c(1, 10)), trees(c(100, 500)), size = 25)     # tree-model knobs
grid_random(neighbors(), weight_func(), size = 15)             # numeric and qualitative
grid_random(pset, size = 40, original = FALSE)                 # transformed-scale draws
set.seed(1); grid_random(penalty(), size = 10)                 # reproducible sample

[DECISION TREE: Is grid_random() the right tool?]
- random uniform sample of the parameter space: grid_random(penalty(), size = 25)
- exhaustive grid at evenly-spaced levels: grid_regular(penalty(), levels = 5)
- space-filling Latin hypercube: grid_latin_hypercube(penalty(), size = 25)
- max-entropy space-filling design: grid_max_entropy(penalty(), size = 25)
- new umbrella for random and space-filling: grid_space_filling(pset, size = 25)
- iterative model-based search: tune_bayes(wf, resamples = folds)
- a hand-picked candidate tibble: tibble(penalty = c(0.001, 0.01, 0.1))

## What grid_random() does in one sentence

**grid_random() draws size independent uniform samples from the joint parameter space and returns them as a tibble.** You pass any number of dials parameter objects (or a `parameters()` set), tell it how many rows you want, and it samples each parameter independently from its (possibly transformed) range. The result has one column per parameter and exactly `size` rows, no matter how many parameters you tune.

The function lives in the dials package and is re-exported by tidymodels. Pair it with `tune_grid()` when a regular grid's cartesian product would be too large. Random search reaches good regions quickly in higher dimensions, which is why it became the standard baseline before space-filling designs gained traction.

## Set up a parameter set

**Every random grid starts from a parameter specification.** Either build it on the fly from individual dials objects or extract it from a workflow with `tune()` placeholders.

```r title="Load tidymodels and define parameters"
library(tidymodels)

p1 <- penalty()
p1
#> Amount of Regularization (quantitative)
#> Transformer: log-10 [1e-100, Inf]
#> Range (transformed scale): [-10, 0]

p2 <- mixture()
p2
#> Proportion of Lasso Penalty (quantitative)
#> Range: [0, 1]
```

Each dials object knows its default range, scale (log10 for `penalty()`, identity for `mixture()`), and label. The transformer matters: grid_random() draws uniformly on the transformed scale by default, then back-transforms before returning, so `penalty()` samples are uniform in log10 and span the full range of magnitudes evenly.

```r title="Build a workflow with tune() placeholders"
glmnet_spec <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")

wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(glmnet_spec)

extract_parameter_set_dials(wf)
#> Collection of 2 parameters for tuning
#>  identifier    type    object
#>     penalty penalty nparam[+]
#>     mixture mixture nparam[+]
```

[NOTE]
**Pass parameters, not strings.** grid_random() expects dials parameter objects (`penalty()`) or a `parameters()` collection, never the raw argument name. The set extracted from a workflow carries identifiers and ranges in one bundle, which is the cleanest input for a real tuning script.

## grid_random() syntax and arguments

**The signature is short and every argument earns its place.**

```r title="grid_random generic signature"
grid_random(
  x,                      # parameters object or one+ dials parameter objects
  ...,                    # additional parameter objects
  size = 5,               # number of rows to draw
  original = TRUE,        # return values on the original scale
  filter = NULL           # quoted expression to drop rows
)
```

| Argument | Description |
|---|---|
| `x`, `...` | Parameter objects: `penalty()`, `mixture()`, `mtry()`, or a `parameters()` set. |
| `size` | How many random candidates to draw. Same scalar regardless of parameter count. |
| `original` | If `TRUE`, returns natural-scale values; if `FALSE`, returns transformed-scale values for plotting or diagnostics. |
| `filter` | Optional `rlang` expression like `expr(penalty > 0.001)` to prune rows after sampling. |

[KEY INSIGHT]
**Set a seed before every grid_random() call.** The grid is stochastic, so two runs return different tibbles by default. `set.seed(1); grid_random(penalty(), size = 25)` makes the candidate set reproducible across sessions, which matters for reviewers who need to rerun your tuning script and get the same numbers.

## Examples by use case

**Begin with one parameter, add a second, then read from a workflow.** The same call shape scales from a quick prototype to a higher-dimensional sweep where regular grids would explode.

```r title="One-parameter random grid for a lasso sweep"
set.seed(1)
lasso_grid <- grid_random(penalty(range = c(-4, 0)), size = 8)
lasso_grid
#> # A tibble: 8 x 1
#>     penalty
#>       <dbl>
#> 1 0.0476
#> 2 0.000683
#> 3 0.00302
#> 4 0.330
#> 5 0.00141
#> 6 0.0832
#> 7 0.000118
#> 8 0.0259
```

A two-parameter random grid stays the same length even as parameters multiply. With three or four tunables, random search reaches every corner of the joint space with roughly the same total fits a regular grid would need for one parameter.

```r title="Two-parameter random grid"
set.seed(2)
rand_grid <- grid_random(
  penalty(range = c(-4, 0)),
  mixture(range = c(0, 1)),
  size = 20
)
nrow(rand_grid)
#> [1] 20

head(rand_grid, 4)
#> # A tibble: 4 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#> 1 0.00159   0.184
#> 2 0.000257  0.703
#> 3 0.0392    0.573
#> 4 0.0102    0.168
```

Reading from a workflow keeps identifiers in sync with the spec. If you rename a tuned argument with `tune("my_lambda")`, the grid column auto-updates because the parameter set is the source of truth.

```r title="Build a random grid from a workflow parameter set"
pset <- extract_parameter_set_dials(wf) |>
  update(penalty = penalty(range = c(-4, -1)))

set.seed(3)
rand_grid <- grid_random(pset, size = 25)
rand_grid
#> # A tibble: 25 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#> 1 0.0166    0.213
#> 2 0.00118   0.660
#> 3 0.00451   0.501
#> 4 0.000169  0.781
#> 5 0.0316    0.0917
```

Hand the grid to `tune_grid()` and downstream helpers behave exactly as they would for an integer `grid = 25`, but with full control over the seed.

```r title="Use the random grid inside tune_grid"
set.seed(4)
folds <- vfold_cv(mtcars, v = 5)

res <- tune_grid(
  wf,
  resamples = folds,
  grid      = rand_grid,
  metrics   = metric_set(rmse)
)
show_best(res, metric = "rmse", n = 3)
#> # A tibble: 3 x 8
#>     penalty mixture .metric .estimator  mean     n std_err .config
#>       <dbl>   <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1 0.0166    0.213   rmse    standard    2.66     5   0.390 Preprocessor1_Model01
#> 2 0.00451   0.501   rmse    standard    2.68     5   0.385 Preprocessor1_Model03
#> 3 0.00118   0.660   rmse    standard    2.71     5   0.383 Preprocessor1_Model02
```

## grid_random() vs grid_regular() vs space-filling designs

**Pick by how the parameter space should be covered, not by what feels modern.**

| Function | Coverage style | When to reach for it |
|---|---|---|
| `grid_random()` | Independent uniform samples | Higher-dimensional spaces, quick prototyping, no need for a plot-friendly regular surface. |
| `grid_regular()` | Exhaustive cartesian product | Two or three parameters, reviewers want every combination scored, results plot on a regular axis. |
| `grid_latin_hypercube()` | Space-filling, one sample per axis stratum | Continuous parameters, fewer evaluations than regular, no clustered candidates. |
| `grid_max_entropy()` | Space-filling, maximally spread | Expensive fits where each candidate must be far from the others. |

Random grids win at 4+ parameters on a fixed budget. Space-filling designs beat random on even coverage at the same dimension count. Regular grids stay best for 2-parameter sweeps you intend to plot as a heatmap.

## Common pitfalls

**Three mistakes account for most random-grid surprises.**

1. **No seed before the call.** Without `set.seed()`, two runs of `grid_random()` produce different candidates, which breaks reproducibility for the entire downstream tuning result. Set the seed in the same chunk as the grid call so reviewers see the link.
2. **Default range on `mtry()` and similar data-dependent parameters.** `mtry()` has no default upper bound because it depends on column count. Either supply a range explicitly (`mtry(c(1, 10))`) or finalize it against the data with `finalize(mtry(), train)` before sampling.
3. **Too few draws for the dimension.** A size of 10 across 5 parameters leaves most of the joint space empty. Rule of thumb: 20 to 30 draws for 2 to 3 parameters, 50 to 100 for 4 to 6. If the run is fast enough, scale up further.

[WARNING]
**Random sampling can cluster candidates.** With size = 10 and two parameters, you may draw three points within the same small corner and miss another corner entirely. If even coverage matters, switch to `grid_latin_hypercube()` or `grid_space_filling()`. Random search shines on budget, not on guaranteed spread.

## Try it yourself

**Try it:** Build a random grid for an elastic-net workflow with `penalty` on the log10 range `[-3, 0]` and `mixture` on `[0, 1]`, drawing 12 candidates with `set.seed(7)`. The result should have 12 rows and 2 columns.

```r title="Your turn: build a 12-row random grid"
# Try it: build a random grid for elastic net
library(tidymodels)

set.seed(7)
ex_grid <- # your code here

nrow(ex_grid)
#> Expected: 12

ncol(ex_grid)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_grid <- grid_random(
  penalty(range = c(-3, 0)),
  mixture(range = c(0, 1)),
  size = 12
)
nrow(ex_grid)
#> [1] 12

ncol(ex_grid)
#> [1] 2
```

**Explanation:** grid_random() takes one `size` regardless of parameter count, so 12 rows of two columns means 12 independent draws, each pairing a log10-uniform penalty with a uniform mixture. The seed pins the sample so the tibble is identical across sessions.

</details>

## Related dials functions

**grid_random() is one of a family; reach for the right neighbor when random sampling is wrong.**

- `grid_regular()` for an exhaustive cartesian product when reviewers need a plot-friendly surface.
- `grid_latin_hypercube()` and `grid_max_entropy()` for space-filling designs that beat random on even coverage.
- `grid_space_filling()` as the new umbrella in dials 1.2+, with a `type` argument that selects random, Latin hypercube, or max entropy.
- `parameters()` and `extract_parameter_set_dials()` to assemble a tuning specification from a workflow.
- `finalize()` to pin data-dependent ranges such as `mtry()` against a training set before grid construction.
- `update()` to override one parameter's range inside an existing parameter set without rebuilding it.

External reference: the official dials package documentation at [dials.tidymodels.org/reference/grid_random.html](https://dials.tidymodels.org/reference/grid_random.html).

## FAQ

**How do I make grid_random() reproducible?**

Call `set.seed()` immediately before grid_random(). The function uses base R's RNG state, so any preceding random call shifts the result. Pair the seed with the grid call in one chunk: `set.seed(1); rand_grid <- grid_random(pset, size = 25)`. For a full tuning pipeline, also seed `vfold_cv()` and `tune_grid()` separately, since each draws independently for folds and (with racing methods) sub-models.

**How many candidates should I draw with grid_random()?**

For 2 parameters, 20 to 30 beats a 5x5 regular grid on cost and matches on quality. For 4 to 6 parameters, draw 50 to 100. Above that, switch to a space-filling design or `tune_bayes()`, because the marginal value of each extra random candidate drops fast in high dimensions. Random search degrades gracefully when the budget is smaller than ideal.

**What is the difference between grid_random() and grid_space_filling(type = "random")?**

They produce statistically equivalent draws. `grid_space_filling()` is the newer umbrella introduced in dials 1.2 that dispatches to `grid_random()`, `grid_latin_hypercube()`, or `grid_max_entropy()` via its `type` argument. New code can use either; the tidymodels team kept `grid_random()` callable for backward compatibility and because the direct form reads more clearly when the design is decided upfront.

**Can I mix qualitative and quantitative parameters in one random grid?**

Yes. `grid_random(neighbors(), weight_func(), size = 15)` samples 15 rows where the `neighbors` column is a random integer in the parameter's range and the `weight_func` column is a random factor level. Qualitative columns become factors with uniform probability across levels; numeric columns are doubles. tune_grid() handles the mix without extra work because the parameter set carries each column's type.

**How do I tune a recipe step parameter with grid_random()?**

Mark the recipe step with `tune()` (for example, `step_pca(num_comp = tune())`) and extract the combined parameter set with `extract_parameter_set_dials(wf)`. Pass that set to grid_random() and the resulting tibble carries one column per tuned argument. Use `update(num_comp = num_comp(c(2, 10)))` to override the default range, then sample. tune_grid() scores every candidate against every fold, recipe knobs included.
