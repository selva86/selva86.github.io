---
title: "dials grid_max_entropy() in R: Maximally Spread Tuning Grid"
slug: tune-grid_max_entropy-in-R
description: "Use dials grid_max_entropy() in R to build maximally spread hyperparameter grids for tune_grid(). Covers syntax, joint coverage, examples, and pitfalls."
keywords: "dials grid_max_entropy, grid_max_entropy R, maximum entropy sampling R, max entropy tuning grid, grid_max_entropy tidymodels, space-filling tuning grid R, joint coverage tuning"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "grid_max_entropy()|dials::grid_max_entropy()|dials grid_max_entropy|maximum entropy grid|max-entropy tuning grid"
auto_link_case_sensitive: true
target_keyword: dials grid_max_entropy
sibling_block_enabled: true
difficulty: Beginner
---

# dials grid_max_entropy() in R: Maximally Spread Tuning Grid

<p class="lead">The dials grid_max_entropy() function in R draws a space-filling hyperparameter sample that maximises the minimum distance between candidates, returning a tibble of tuning combinations whose joint coverage exceeds Latin hypercube and random search at the same row budget.</p>

[QUICK ANSWER]
grid_max_entropy(penalty(), size = 25)                          # one parameter, 25 candidates
grid_max_entropy(penalty(), mixture(), size = 30)               # two parameters
grid_max_entropy(penalty(range = c(-4, 0)), size = 20)          # custom log10 range
grid_max_entropy(extract_parameter_set_dials(wf), size = 50)    # from a workflow
grid_max_entropy(mtry(c(1, 10)), trees(c(100, 500)), size = 25) # tree-model knobs
grid_max_entropy(pset, size = 40, variogram_range = 0.6)        # tune the spread
grid_max_entropy(pset, size = 40, original = FALSE)             # transformed-scale draws
set.seed(1); grid_max_entropy(penalty(), size = 10)             # reproducible sample

[DECISION TREE: Is grid_max_entropy() the right tool?]
- maximally spread design for expensive fits: grid_max_entropy(penalty(), size = 25)
- one-per-stratum coverage at lower cost: grid_latin_hypercube(penalty(), size = 25)
- independent uniform draws (fastest, least even): grid_random(penalty(), size = 25)
- exhaustive grid at evenly-spaced levels: grid_regular(penalty(), levels = 5)
- new umbrella for space-filling designs: grid_space_filling(pset, size = 25)
- iterative model-based search: tune_bayes(wf, resamples = folds)
- a hand-picked candidate tibble: tibble(penalty = c(0.001, 0.01, 0.1))

## What grid_max_entropy() does in one sentence

**grid_max_entropy() picks candidates that maximise the minimum pairwise distance in the parameter space.** You pass dials parameter objects (or a `parameters()` set), say how many rows you want, and the function returns a size-by-p tibble whose points are pushed as far apart as the bounding box allows. The same `size` value drives the grid regardless of parameter count.

It lives in dials and is re-exported by tidymodels. Reach for it whenever every model fit is expensive enough that a near-duplicate candidate would hurt. The trade-off versus `grid_latin_hypercube()` is a few seconds of design work for tighter joint spread.

## How maximum-entropy sampling works

**The algorithm draws an oversample, then keeps a subset whose pairwise distances are maximised.** Internally dials samples a Latin hypercube pool, then picks points that maximise an entropy criterion based on the determinant of the spatial correlation matrix. The result is `size` points whose Voronoi cells are as equal as the box permits.

```r title="Load tidymodels and inspect a two-parameter max-entropy grid"
library(tidymodels)

set.seed(1)
me1 <- grid_max_entropy(
  penalty(range = c(-4, 0)),
  mixture(range = c(0, 1)),
  size = 12
)
me1
#> # A tibble: 12 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#>  1 0.000124   0.961
#>  2 0.872      0.119
#>  3 0.0146     0.512
#>  4 0.000489   0.0291
#>  5 0.226      0.768
#>  6 0.00188    0.355
#>  7 0.0560     0.0768
#>  8 0.000358   0.683
#>  9 0.137      0.456
#> 10 0.00736    0.836
#> 11 0.358      0.262
#> 12 0.0298     0.196
```

Compared to `grid_latin_hypercube()` at the same `size`, the design has fewer near-collisions and more even spacing. The improvement is modest in 2D and grows with parameter count.

[KEY INSIGHT]
**Maximum entropy buys joint coverage that Latin hypercube only approximates.** LHS guarantees marginal uniformity but lets the joint pattern cluster. Max entropy adds a design-time optimisation step so the minimum pairwise distance is as large as possible. Right trade when each fit costs minutes and the budget is tight.

## grid_max_entropy() syntax and arguments

**The signature follows the rest of the dials grid family with one extra knob.**

```r title="grid_max_entropy generic signature"
grid_max_entropy(
  x,                       # parameters object or one+ dials parameter objects
  ...,                     # additional parameter objects
  size = 3,                # number of candidates returned
  original = TRUE,         # return values on the original scale
  variogram_range = 0.5    # spatial correlation range, 0 to 1
)
```

| Argument | Description |
|---|---|
| `x`, `...` | Parameter objects: `penalty()`, `mixture()`, `mtry()`, or a `parameters()` set. |
| `size` | How many candidates to draw. Each is selected from an internal oversample to maximise pairwise spread. |
| `original` | If `TRUE`, returns natural-scale values; if `FALSE`, returns transformed-scale values useful for plotting the design geometry. |
| `variogram_range` | Controls the spatial correlation length used by the entropy criterion. Lower values push points further apart; the default 0.5 works for most designs. |

Max entropy has no `filter` argument because dropping rows would undo the optimised spacing. Set parameter ranges first and let the algorithm fill them.

## Examples by use case

**Start with a small two-parameter grid where the spread is visible.** A 16-row max-entropy design covers the `[10^-4, 1] x [0, 1]` box without the diagonal clustering Latin hypercube sometimes produces.

```r title="Two-parameter max-entropy grid for elastic net"
set.seed(2)
me2 <- grid_max_entropy(
  penalty(range = c(-4, 0)),
  mixture(range = c(0, 1)),
  size = 16
)
head(me2, 4)
#> # A tibble: 4 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#> 1 0.000133   0.948
#> 2 0.776      0.0521
#> 3 0.0123     0.612
#> 4 0.0883     0.219
```

The 16 candidates cover the rectangle with a larger minimum pairwise distance than a Latin hypercube of the same size. Worth the optimisation overhead when each elastic-net fit takes a minute.

Reading from a workflow keeps parameter identifiers in sync with the model spec.

```r title="Build a max-entropy grid from a workflow parameter set"
glmnet_spec <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")

wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(glmnet_spec)

pset <- extract_parameter_set_dials(wf) |>
  update(penalty = penalty(range = c(-4, -1)))

set.seed(3)
me_wf <- grid_max_entropy(pset, size = 25)
nrow(me_wf)
#> [1] 25
```

Pass the tibble straight to `tune_grid()`; only the geometry differs from a random or LHS call.

```r title="Use the max-entropy grid inside tune_grid"
set.seed(4)
folds <- vfold_cv(mtcars, v = 5)

res <- tune_grid(
  wf,
  resamples = folds,
  grid      = me_wf,
  metrics   = metric_set(rmse)
)
show_best(res, metric = "rmse", n = 3)
#> # A tibble: 3 x 8
#>     penalty mixture .metric .estimator  mean     n std_err .config
#>       <dbl>   <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1 0.0421    0.354   rmse    standard    2.63     5   0.371 Preprocessor1_Model09
#> 2 0.0179    0.668   rmse    standard    2.65     5   0.380 Preprocessor1_Model14
#> 3 0.0958    0.182   rmse    standard    2.67     5   0.389 Preprocessor1_Model05
```

The payoff shows up in higher-dimensional sweeps. With six knobs a `levels = 4` regular grid hits 4,096 candidates; a 60-row max-entropy design covers the same box with 68x fewer fits while keeping the minimum distance large.

```r title="Six-parameter max-entropy grid for boosted trees"
set.seed(5)
bt_grid <- grid_max_entropy(
  trees(range = c(100, 800)),
  tree_depth(range = c(2, 12)),
  learn_rate(range = c(-3, -1)),
  min_n(range = c(2, 40)),
  loss_reduction(range = c(-10, 1.5)),
  sample_size(range = c(0.5, 1)),
  size = 60
)
dim(bt_grid)
#> [1] 60  6
```

## grid_max_entropy() vs grid_latin_hypercube() vs grid_random()

**Choose by how badly clustered candidates would hurt, not by what sounds rigorous.**

| Function | Coverage style | When to reach for it |
|---|---|---|
| `grid_random()` | Independent uniform draws | Quick prototyping, very high dimensions, no concern about clustering. |
| `grid_latin_hypercube()` | Stratified, one sample per axis bin | Sensible default for 3 to 6 continuous knobs when fits are cheap. |
| `grid_max_entropy()` | Post-optimised for maximum joint spread | Expensive fits where every candidate must be far from the others. |
| `grid_regular()` | Exhaustive cartesian product | Two-parameter sweeps you intend to plot as a heatmap. |

Pick max entropy when the cost of a wasted candidate exceeds the cost of running the optimiser. Elastic-net or k-NN sweeps that fit in seconds rarely need it; boosted trees on a million rows where each fit takes five minutes benefit many times over.

## Common pitfalls

**Three traps account for most max-entropy surprises.**

1. **Treating size as a free parameter.** The optimiser scales with `size^2`, so a `size = 1000` request takes minutes to design. For 3 to 6 parameters, keep `size` between 25 and 100.
2. **Unfinalized data-dependent parameters.** `mtry()` has no default upper bound; pass an explicit range or call `finalize(mtry(), train)` before sampling, or the function errors.
3. **Confusing variogram_range with parameter range.** `variogram_range` is the spatial correlation length, not the parameter bounds. Lower values push points apart more aggressively; values outside `[0.1, 0.9]` destabilise the design.

[WARNING]
**Set a seed before every grid_max_entropy() call.** The internal oversample is stochastic, so two runs return different tibbles even though the optimisation criterion is deterministic. Pair `set.seed()` with the grid call in the same chunk so reviewers can reproduce the candidate set.

[NOTE]
**Use grid_space_filling() for new code.** dials 1.2+ introduced `grid_space_filling(pset, size = N, type = "max_entropy")` as an umbrella that dispatches to max entropy, Latin hypercube, or random. The direct `grid_max_entropy()` still works and reads more clearly when the design was chosen upfront.

## Try it yourself

**Try it:** Build a max-entropy grid for an elastic-net workflow with `penalty` on the log10 range `[-3, 0]` and `mixture` on `[0, 1]`, drawing 15 candidates with `set.seed(7)`. The result should have 15 rows and 2 columns.

```r title="Your turn: build a 15-row max-entropy grid"
# Try it: build a max-entropy grid for elastic net
library(tidymodels)

set.seed(7)
ex_me <- # your code here

nrow(ex_me)
#> Expected: 15

ncol(ex_me)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_me <- grid_max_entropy(
  penalty(range = c(-3, 0)),
  mixture(range = c(0, 1)),
  size = 15
)
nrow(ex_me)
#> [1] 15

ncol(ex_me)
#> [1] 2
```

**Explanation:** grid_max_entropy() takes one `size` regardless of parameter count, so 15 rows of two columns means the optimiser picked 15 points whose pairwise minimum distance in the `[-3, 0] x [0, 1]` box is as large as the entropy criterion allows. The seed pins the oversample and the selection so the tibble is identical across sessions.

</details>

## Related dials functions

**grid_max_entropy() sits inside a family; reach for the right neighbour when maximal spread is the wrong objective.**

- `grid_latin_hypercube()` when stratified one-per-axis coverage is enough and design time matters.
- `grid_random()` when the budget is large and clustering is acceptable.
- `grid_regular()` for an exhaustive cartesian product on 2 or 3 parameters you plan to plot.
- `grid_space_filling()` as the new umbrella in dials 1.2+, with a `type` argument that selects max entropy, Latin hypercube, or random.
- `parameters()` and `extract_parameter_set_dials()` to assemble a tuning specification from a workflow.
- `finalize()` to pin data-dependent ranges such as `mtry()` against a training set before grid construction.
- `update()` to override one parameter's range inside an existing parameter set without rebuilding it.

External reference: the official dials package documentation at [dials.tidymodels.org/reference/grid_max_entropy.html](https://dials.tidymodels.org/reference/grid_max_entropy.html).

## FAQ

**What does "maximum entropy" mean in plain terms?**

Entropy here measures how spread out a set of points is. A maximum-entropy grid is the configuration that makes the points as informative as possible about the response surface, given the budget. Dials maximises the determinant of the spatial correlation matrix; intuitively, this pushes candidates apart so no two carry redundant information about the same neighbourhood.

**How is grid_max_entropy() different from grid_latin_hypercube()?**

Both return a `size`-by-p tibble for `tune_grid()`. Latin hypercube guarantees one sample per axis stratum but lets the joint pattern cluster. Max entropy starts from a Latin hypercube oversample and picks a subset whose pairwise distances are maximised. Use max entropy when each fit is expensive; Latin hypercube when fits are cheap.

**How many candidates should I draw with grid_max_entropy()?**

The optimiser scales roughly with `size^2`, so design time grows fast above `size = 200`. For 2 to 3 parameters, 20 to 30 is plenty. For 4 to 6 parameters, 50 to 100. Above that, switch to `tune_bayes()` because model-based search recycles earlier fits more efficiently than any one-shot grid.

**Can I tune qualitative parameters with grid_max_entropy()?**

Yes, with caveats. Qualitative parameters such as `weight_func()` enter the entropy calculation through integer encoding, so the design treats them as ordinal. If the levels are unordered, the spread guarantee weakens. A practical fix is to tune qualitative parameters separately with `grid_regular()` and use max entropy only for the continuous knobs.

**Should I prefer grid_max_entropy() or grid_space_filling()?**

Both produce the same sample when `grid_space_filling(type = "max_entropy")` is used; the umbrella lets one call switch designs by changing an argument. New code comparing designs benefits from the umbrella; code that picked max entropy upfront reads more clearly with the direct call.
