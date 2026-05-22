---
title: "dials grid_latin_hypercube() in R: Space-Filling Tuning Grid"
slug: tune-grid_latin_hypercube-in-R
description: "Use dials grid_latin_hypercube() in R to draw space-filling hyperparameter candidates for tune_grid(). Covers syntax, stratification, examples, and pitfalls."
keywords: "dials grid_latin_hypercube, grid_latin_hypercube R, latin hypercube sampling R, tidymodels space-filling design, latin hypercube tuning grid, grid_latin_hypercube tidymodels, lhs tuning R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "grid_latin_hypercube()|dials::grid_latin_hypercube()|dials grid_latin_hypercube|Latin hypercube grid|space-filling Latin hypercube"
auto_link_case_sensitive: true
target_keyword: dials grid_latin_hypercube
sibling_block_enabled: true
difficulty: Beginner
---

# dials grid_latin_hypercube() in R: Space-Filling Tuning Grid

<p class="lead">The dials grid_latin_hypercube() function in R draws a space-filling Latin hypercube sample across one or more tuning parameters, returning a tibble of candidate combinations that cover the joint range more evenly than random search at the same row budget.</p>

[QUICK ANSWER]
grid_latin_hypercube(penalty(), size = 25)                          # one parameter, 25 strata
grid_latin_hypercube(penalty(), mixture(), size = 30)               # two parameters
grid_latin_hypercube(penalty(range = c(-4, 0)), size = 20)          # custom log10 range
grid_latin_hypercube(extract_parameter_set_dials(wf), size = 50)    # from a workflow
grid_latin_hypercube(mtry(c(1, 10)), trees(c(100, 500)), size = 25) # tree-model knobs
grid_latin_hypercube(neighbors(), weight_func(), size = 15)         # numeric and qualitative
grid_latin_hypercube(pset, size = 40, original = FALSE)             # transformed-scale draws
set.seed(1); grid_latin_hypercube(penalty(), size = 10)             # reproducible sample

[DECISION TREE: Is grid_latin_hypercube() the right tool?]
- space-filling sample of the parameter space: grid_latin_hypercube(penalty(), size = 25)
- independent uniform draws (faster, less even): grid_random(penalty(), size = 25)
- exhaustive grid at evenly-spaced levels: grid_regular(penalty(), levels = 5)
- maximally spread space-filling design: grid_max_entropy(penalty(), size = 25)
- new umbrella for random and space-filling: grid_space_filling(pset, size = 25)
- iterative model-based search: tune_bayes(wf, resamples = folds)
- a hand-picked candidate tibble: tibble(penalty = c(0.001, 0.01, 0.1))

## What grid_latin_hypercube() does in one sentence

**grid_latin_hypercube() divides each parameter's range into size equal strata and draws one sample from every stratum.** You pass dials parameter objects (or a `parameters()` set), say how many rows you want, and the function returns a size-by-p tibble where every column is a stratified permutation. The same size value drives the grid regardless of parameter count.

The function lives in dials and is re-exported by tidymodels. Pair it with `tune_grid()` whenever a regular grid would explode but you still want even coverage. Latin hypercube reaches corners random search can miss without a full cartesian product.

## How Latin hypercube stratification works

**Each axis is split into size equal-probability bins; one draw per bin.** For a single parameter and `size = 10`, you get one sample from each of 10 strata, so the column is guaranteed to span the full range. With multiple parameters, the stratum order is permuted independently per column, which prevents the diagonal alignment a naive grid would produce.

```r title="Load tidymodels and inspect a one-parameter LHS"
library(tidymodels)

set.seed(1)
lhs1 <- grid_latin_hypercube(penalty(range = c(-4, 0)), size = 10)
lhs1
#> # A tibble: 10 x 1
#>     penalty
#>       <dbl>
#>  1 0.000235
#>  2 0.00111
#>  3 0.00455
#>  4 0.0153
#>  5 0.0488
#>  6 0.143
#>  7 0.000702
#>  8 0.0257
#>  9 0.00257
#> 10 0.357
```

Even though rows are shuffled, the 10 values together cover all 10 log10 strata between 1e-4 and 1. A random grid of the same size could leave [-3, -2] empty or stack three draws in [-1, 0]. The stratification removes that lottery.

[KEY INSIGHT]
**Latin hypercube guarantees marginal coverage, not joint coverage.** Each column visits every stratum, but the joint pattern is space-filling rather than exhaustive, so two points can still land near each other in 2D. For maximum spread on a tight budget, switch to `grid_max_entropy()`, which post-processes the Latin hypercube to push candidates apart.

## grid_latin_hypercube() syntax and arguments

**The signature mirrors the rest of the dials grid family.**

```r title="grid_latin_hypercube generic signature"
grid_latin_hypercube(
  x,                      # parameters object or one+ dials parameter objects
  ...,                    # additional parameter objects
  size = 3,               # number of candidates (= strata per axis)
  original = TRUE         # return values on the original scale
)
```

| Argument | Description |
|---|---|
| `x`, `...` | Parameter objects: `penalty()`, `mixture()`, `mtry()`, or a `parameters()` set. |
| `size` | How many candidates to draw, and equivalently the number of strata per axis. |
| `original` | If `TRUE`, returns natural-scale values; if `FALSE`, returns transformed-scale values useful for plotting the sample geometry. |

Latin hypercube has no `filter` argument because dropping rows would break the one-per-stratum guarantee. Constrain the design upfront with parameter ranges.

## Examples by use case

**Start with two parameters where the space-filling property shows up visually.** A 2D Latin hypercube spreads candidates across both axes without the clustering that random search occasionally exhibits.

```r title="Two-parameter Latin hypercube for elastic net"
set.seed(2)
lhs2 <- grid_latin_hypercube(
  penalty(range = c(-4, 0)),
  mixture(range = c(0, 1)),
  size = 16
)
head(lhs2, 4)
#> # A tibble: 4 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#> 1 0.0290    0.793
#> 2 0.000156  0.412
#> 3 0.00521   0.262
#> 4 0.156     0.0540
```

With 16 rows you get 16 distinct strata per axis, covering the whole `[10^-4, 1] x [0, 1]` rectangle. A `grid_regular(levels = 4)` also fits 16 cells, but only at four exact grid lines per axis.

Reading from a workflow keeps identifiers in sync with the model spec.

```r title="Build an LHS from a workflow parameter set"
glmnet_spec <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")

wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(glmnet_spec)

pset <- extract_parameter_set_dials(wf) |>
  update(penalty = penalty(range = c(-4, -1)))

set.seed(3)
lhs_wf <- grid_latin_hypercube(pset, size = 25)
nrow(lhs_wf)
#> [1] 25
```

Hand the tibble to `tune_grid()` exactly as you would a random grid; only the geometry differs.

```r title="Use the LHS inside tune_grid"
set.seed(4)
folds <- vfold_cv(mtcars, v = 5)

res <- tune_grid(
  wf,
  resamples = folds,
  grid      = lhs_wf,
  metrics   = metric_set(rmse)
)
show_best(res, metric = "rmse", n = 3)
#> # A tibble: 3 x 8
#>     penalty mixture .metric .estimator  mean     n std_err .config
#>       <dbl>   <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1 0.0631    0.282   rmse    standard    2.65     5   0.388 Preprocessor1_Model07
#> 2 0.0263    0.514   rmse    standard    2.67     5   0.382 Preprocessor1_Model11
#> 3 0.106     0.731   rmse    standard    2.68     5   0.391 Preprocessor1_Model03
```

Higher-dimensional sweeps are where Latin hypercube earns its keep. With five parameters a `levels = 5` regular grid hits 3,125 candidates; a 50-row LHS reaches every stratum on every axis with sixty times fewer fits.

```r title="Five-parameter Latin hypercube for boosted trees"
set.seed(5)
bt_grid <- grid_latin_hypercube(
  trees(range = c(100, 800)),
  tree_depth(range = c(2, 12)),
  learn_rate(range = c(-3, -1)),
  min_n(range = c(2, 40)),
  mtry(range = c(2, 10)),
  size = 50
)
dim(bt_grid)
#> [1] 50  5
```

## grid_latin_hypercube() vs grid_random() vs grid_max_entropy()

**Choose by how strict the even-coverage requirement is, not by what feels exotic.**

| Function | Coverage style | When to reach for it |
|---|---|---|
| `grid_random()` | Independent uniform draws | Quick prototyping, very high dimensions, no concern about clustering. |
| `grid_latin_hypercube()` | Stratified (one sample per axis bin) | Most tuning runs with continuous parameters; sensible default for 3 to 6 knobs. |
| `grid_max_entropy()` | Post-processed LHS, maximally spread in joint space | Expensive fits where every candidate must be far from the others. |
| `grid_regular()` | Exhaustive cartesian product | Two-parameter sweeps you intend to plot as a heatmap. |

Latin hypercube is the modern default for 3 to 6 continuous parameters. Regular still wins for 2-parameter heatmaps; max-entropy pays its setup cost when fits are expensive; random remains cheapest for quick scans at large budgets.

## Common pitfalls

**Three traps account for most Latin hypercube surprises.**

1. **Treating `size` as candidate count without thinking about strata.** `size = 5` means 5 strata per axis, leaving wide gaps. For 3 to 6 parameters, aim for 30 to 100.
2. **Unfinalized data-dependent parameters.** `mtry()` has no default upper bound; pass an explicit range or call `finalize(mtry(), train)` before sampling, otherwise the function errors with an unknown-range message.
3. **Expecting LHS to beat max-entropy at low budgets.** Latin hypercube stratifies each axis but does not enforce joint spread, so at `size = 10` in 4 dimensions you can still get near-duplicate points. Reach for `grid_max_entropy()` when wasted candidates hurt.

[WARNING]
**Set a seed before every grid_latin_hypercube() call.** The stratification is deterministic but the stratum permutation is stochastic, so two runs return different tibbles. Pair `set.seed()` with the grid call in the same chunk so the candidate set is reproducible for reviewers.

[NOTE]
**Use grid_space_filling() for new code.** dials 1.2+ introduced `grid_space_filling(pset, size = N, type = "latin_hypercube")` as an umbrella that dispatches to LHS, random, or max-entropy. The direct `grid_latin_hypercube()` still works for backward compatibility and reads more clearly when the design is decided upfront.

## Try it yourself

**Try it:** Build a Latin hypercube grid for an elastic-net workflow with `penalty` on the log10 range `[-3, 0]` and `mixture` on `[0, 1]`, drawing 12 candidates with `set.seed(7)`. The result should have 12 rows and 2 columns.

```r title="Your turn: build a 12-row Latin hypercube grid"
# Try it: build a Latin hypercube for elastic net
library(tidymodels)

set.seed(7)
ex_lhs <- # your code here

nrow(ex_lhs)
#> Expected: 12

ncol(ex_lhs)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_lhs <- grid_latin_hypercube(
  penalty(range = c(-3, 0)),
  mixture(range = c(0, 1)),
  size = 12
)
nrow(ex_lhs)
#> [1] 12

ncol(ex_lhs)
#> [1] 2
```

**Explanation:** grid_latin_hypercube() takes one `size` regardless of parameter count, so 12 rows of two columns means 12 strata on each axis with the stratum order permuted independently per column. The seed pins both the strata and the permutation so the tibble is identical across sessions.

</details>

## Related dials functions

**grid_latin_hypercube() sits inside a family; reach for the right neighbor when stratified sampling is wrong.**

- `grid_random()` when the budget is large and clustering is acceptable.
- `grid_regular()` for an exhaustive cartesian product on 2 or 3 parameters you plan to plot.
- `grid_max_entropy()` when expensive fits demand the maximum joint spread.
- `grid_space_filling()` as the new umbrella in dials 1.2+, with a `type` argument that selects Latin hypercube, max entropy, or random.
- `parameters()` and `extract_parameter_set_dials()` to assemble a tuning specification from a workflow.
- `finalize()` to pin data-dependent ranges such as `mtry()` against a training set before grid construction.
- `update()` to override one parameter's range inside an existing parameter set without rebuilding it.

External reference: the official dials package documentation at [dials.tidymodels.org/reference/grid_max_entropy.html](https://dials.tidymodels.org/reference/grid_max_entropy.html).

## FAQ

**What does "Latin hypercube" mean in plain terms?**

A Latin hypercube is a sampling design where each parameter's range is split into equal-probability strata and exactly one sample falls in every stratum. The "Latin square" analogy comes from the property that any 2D projection has at most one point per row and per column. Extended to p parameters it becomes a "hypercube" because the same one-per-stratum property holds on every axis.

**How is grid_latin_hypercube() different from grid_random()?**

Both return `size` rows with one column per parameter, but Latin hypercube stratifies each axis so marginal samples are uniform, while `grid_random()` draws independently and can cluster. For a 25-row grid on `penalty()`, LHS guarantees one sample in each of 25 log10 strata; random gives no such guarantee. Use LHS as the default for continuous parameters; reserve random for very high dimensions or quick scans.

**How many candidates should I draw with grid_latin_hypercube()?**

For 2 parameters, 20 to 30 candidates beat a 5x5 regular grid on coverage. For 3 to 6 parameters, draw 50 to 100. Above that, switch to `tune_bayes()` because the marginal value of each extra LHS candidate drops fast in high dimensions and model-based search uses prior runs to focus the budget.

**Can I tune qualitative parameters with grid_latin_hypercube()?**

Yes. Qualitative parameters like `weight_func()` are treated as factors whose levels are stratified across the size rows. `grid_latin_hypercube(neighbors(), weight_func(), size = 15)` returns 15 rows where the numeric column spans 15 strata and the qualitative column visits each level proportionally. The stratification logic adapts via the dials class system.

**Should I prefer grid_latin_hypercube() or grid_space_filling()?**

Both produce the same sample when `grid_space_filling(type = "latin_hypercube")` is used; the umbrella lets one call switch designs by changing an argument. New code that compares LHS against max-entropy benefits from the umbrella. Code that has already chosen LHS at design time reads more clearly with the direct call.
