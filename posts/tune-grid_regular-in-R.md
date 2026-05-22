---
title: "dials grid_regular() in R: Build Regular Tuning Grids"
slug: tune-grid_regular-in-R
description: "Use dials grid_regular() in R to build a complete grid of tuning parameter values at evenly-spaced levels. See syntax, levels, ranges, and common pitfalls."
keywords: "dials grid_regular, grid_regular R, grid_regular tidymodels, grid_regular function R, regular grid tidymodels, R tuning grid, hyperparameter grid R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "grid_regular()|dials::grid_regular()|dials grid_regular|regular tuning grid|regular grid dials"
auto_link_case_sensitive: true
target_keyword: dials grid_regular
sibling_block_enabled: true
difficulty: Beginner
---

# dials grid_regular() in R: Build Regular Tuning Grids

<p class="lead">The dials grid_regular() function in R builds a complete cartesian product of tuning parameter values at evenly-spaced levels, returning a tibble you pass to tune_grid() as the candidate set for hyperparameter search.</p>

[QUICK ANSWER]
grid_regular(penalty(), levels = 5)                           # one parameter, 5 levels
grid_regular(penalty(), mixture(), levels = 3)                # two parameters, 3x3 grid
grid_regular(penalty(), mixture(), levels = c(5, 4))          # 5 and 4 levels each
grid_regular(penalty(range = c(-4, 0)), levels = 10)          # custom log10 range
grid_regular(extract_parameter_set_dials(wf), levels = 4)     # from a workflow
grid_regular(mtry(c(1, 10)), trees(c(100, 500)), levels = 5)  # tree-model knobs
grid_regular(neighbors(), weight_func(), levels = 4)          # numeric and qualitative
grid_regular(filter_params, levels = 3, original = FALSE)     # use transformed scale

[DECISION TREE: Is grid_regular() the right tool?]
- exhaustive grid at evenly-spaced levels: grid_regular(penalty(), levels = 5)
- random sample of the parameter space: grid_random(penalty(), size = 25)
- space-filling Latin hypercube: grid_latin_hypercube(penalty(), size = 25)
- max-entropy space-filling design: grid_max_entropy(penalty(), size = 25)
- a hand-picked candidate tibble: tibble(penalty = c(0.001, 0.01, 0.1))
- iterative model-based search: tune_bayes(wf, resamples = folds)
- inspect parameter ranges only: extract_parameter_set_dials(wf)

## What grid_regular() does in one sentence

**grid_regular() returns the full cartesian product of evenly-spaced values for each tuning parameter you hand it.** You pass any number of dials parameter objects (or a `parameters()` set), tell it how many levels per parameter, and it produces a tibble where every row is one candidate to evaluate. The result has one column per parameter and `prod(levels)` rows, so two parameters at 5 levels each yield 25 candidates.

The function lives in the dials package and is re-exported by tidymodels. Pair it with `tune_grid()` for systematic sweeps where reviewers can read off exactly which combinations were scored. The design is deterministic, easy to plot, and works for any spec that exposes tunable arguments through `tune()`.

## Set up a parameter set

**Every tuning grid starts from a parameter specification.** Either build it on the fly from individual dials objects or extract it from a workflow that already has `tune()` placeholders.

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

Each dials object knows its default range, scale (log10 for `penalty()`, identity for `mixture()`), and label. The transformer matters: grid_regular() spaces levels on the transformed scale by default, then back-transforms before returning, so `penalty()` candidates are evenly spaced in log10.

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
**Pass parameters, not strings.** grid_regular() expects dials parameter objects (`penalty()`) or a `parameters()` collection, never the raw argument name. The set extracted from a workflow carries identifiers and ranges in one bundle, which is the cleanest input for a real tuning script.

## grid_regular() syntax and arguments

**The signature is short and every argument earns its place.**

```r title="grid_regular generic signature"
grid_regular(
  x,                      # parameters object or one+ dials parameter objects
  ...,                    # additional parameter objects
  levels = 3,             # scalar or named integer vector
  original = TRUE,        # return values on the original scale
  filter = NULL           # quoted expression to drop rows
)
```

| Argument | Description |
|---|---|
| `x`, `...` | Parameter objects: `penalty()`, `mixture()`, `mtry()`, or a `parameters()` set. |
| `levels` | Scalar (same count for every parameter) or named vector aligned to identifiers. |
| `original` | If `TRUE`, returns natural-scale values; if `FALSE`, returns transformed-scale values for plotting. |
| `filter` | Optional `rlang` expression like `expr(penalty > 0.001)` to prune rows after the grid is built. |

[KEY INSIGHT]
**The grid size grows multiplicatively.** Five parameters at three levels each create 243 candidates. Six at four levels balloons to 4,096. Always start with two or three parameters and 3 to 5 levels; expand only when timing data shows you can afford it.

## Examples by use case

**Begin with one parameter, then add a second, then read from a workflow.** The same call shape scales from a quick prototype to a production sweep.

```r title="One-parameter grid for a lasso sweep"
lasso_grid <- grid_regular(penalty(range = c(-4, 0)), levels = 8)
lasso_grid
#> # A tibble: 8 x 1
#>     penalty
#>       <dbl>
#> 1 0.0001
#> 2 0.000373
#> 3 0.00139
#> 4 0.00518
#> 5 0.0193
#> 6 0.0720
#> 7 0.268
#> 8 1
```

A two-parameter grid lets you script the levels per knob. Use a named vector when the parameters need different resolutions, for example finer penalty sweeps with a coarser mixture sweep.

```r title="Two-parameter grid with mixed levels"
two_grid <- grid_regular(
  penalty(range = c(-4, 0)),
  mixture(range = c(0, 1)),
  levels = c(penalty = 8, mixture = 4)
)
nrow(two_grid)
#> [1] 32

head(two_grid, 4)
#> # A tibble: 4 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#> 1 0.0001         0
#> 2 0.000373       0
#> 3 0.00139        0
#> 4 0.00518        0
```

Reading from a workflow keeps identifiers in sync with the spec. If you rename a tuned argument with `tune("my_lambda")`, the grid column auto-updates because the parameter set is the source of truth.

```r title="Build a grid from a workflow parameter set"
pset <- extract_parameter_set_dials(wf) |>
  update(penalty = penalty(range = c(-4, -1)))

reg_grid <- grid_regular(pset, levels = 5)
reg_grid
#> # A tibble: 25 x 2
#>     penalty mixture
#>       <dbl>   <dbl>
#> 1 0.0001       0
#> 2 0.000562     0
#> 3 0.00316      0
#> 4 0.0178       0
#> 5 0.1          0
```

Hand the grid to `tune_grid()` and downstream helpers behave exactly as they would for an integer `grid = 25`.

```r title="Use the regular grid inside tune_grid"
set.seed(1)
folds <- vfold_cv(mtcars, v = 5)

res <- tune_grid(
  wf,
  resamples = folds,
  grid      = reg_grid,
  metrics   = metric_set(rmse)
)
show_best(res, metric = "rmse", n = 3)
#> # A tibble: 3 x 8
#>     penalty mixture .metric .estimator  mean     n std_err .config
#>       <dbl>   <dbl> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1 0.000562       0  rmse    standard    2.69     5   0.382 Preprocessor1_Model02
#> 2 0.0001         0  rmse    standard    2.70     5   0.384 Preprocessor1_Model01
#> 3 0.00316        0  rmse    standard    2.71     5   0.381 Preprocessor1_Model03
```

## grid_regular() vs grid_random() vs space-filling designs

**Pick by how the parameter space should be covered, not by what feels modern.**

| Function | Coverage style | When to reach for it |
|---|---|---|
| `grid_regular()` | Exhaustive cartesian product | You want every combination scored, results are plottable on a regular surface, reviewers ask "what was tried". |
| `grid_random()` | Independent uniform samples | Quick prototyping, no need for plot-friendly axes, parameter count is high. |
| `grid_latin_hypercube()` | Space-filling, one sample per axis stratum | Continuous parameters, fewer evaluations than regular, no clustered candidates. |
| `grid_max_entropy()` | Space-filling, maximally spread | Expensive fits where each candidate must be far from the others. |

Regular grids win when the parameter count is 2 or 3 and the surface should be plotted. Space-filling designs win when you have 5+ parameters; the cartesian explosion makes a regular grid impractical past three dimensions.

## Common pitfalls

**Three mistakes account for most grid-construction errors.**

1. **Levels too high.** `levels = 10` across four parameters is 10,000 candidates; multiply by 10 folds and 4 metrics and the run is overnight. Start at 3 to 5 levels per knob and grow only when timing allows.
2. **Default range on `mtry()` and similar data-dependent parameters.** `mtry()` has no default upper bound because it depends on column count. Either supply a range explicitly (`mtry(c(1, 10))`) or finalize it against the data with `finalize(mtry(), train)`.
3. **Identifier mismatch.** If the spec uses `tune("lambda")`, the grid column must be `lambda`, not `penalty`. Always extract the parameter set from the workflow rather than constructing parameters by hand when the tunable arguments have custom IDs.

[WARNING]
**The filter argument runs after expansion.** `grid_regular(p1, p2, levels = 10, filter = expr(p1 > p2))` first builds 100 rows, then drops the ones that fail the predicate. The work to build the full grid still happens, so a tight filter cannot rescue an explosive `levels` choice.

## Try it yourself

**Try it:** Build a regular grid for an elastic-net workflow with `penalty` on the log10 range `[-3, 0]` at 6 levels and `mixture` on `[0, 1]` at 4 levels. The result should have 24 rows.

```r title="Your turn: build a 6x4 elastic-net grid"
# Try it: build a regular grid for elastic net
library(tidymodels)

ex_grid <- # your code here

nrow(ex_grid)
#> Expected: 24

head(ex_grid, 3)
#> Expected: the first 3 rows with penalty and mixture columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- grid_regular(
  penalty(range = c(-3, 0)),
  mixture(range = c(0, 1)),
  levels = c(penalty = 6, mixture = 4)
)
nrow(ex_grid)
#> [1] 24

head(ex_grid, 3)
#> # A tibble: 3 x 2
#>    penalty mixture
#>      <dbl>   <dbl>
#> 1 0.001          0
#> 2 0.00398        0
#> 3 0.0158         0
```

**Explanation:** Named vector `c(penalty = 6, mixture = 4)` assigns levels per identifier. `penalty()` spaces values on log10, so the eight candidates here go from 0.001 to 1 in even log-steps, then the second column cycles through four mixture values for every penalty row.

</details>

## Related dials functions

**grid_regular() is one of a family; reach for the right neighbor when the cartesian product is wrong.**

- `grid_random()` for uniform random sampling when reviewers do not need a regular surface.
- `grid_latin_hypercube()` and `grid_max_entropy()` for space-filling designs in higher-dimensional spaces.
- `grid_space_filling()` as the new umbrella, with a `type` argument selecting the underlying design.
- `parameters()` and `extract_parameter_set_dials()` to assemble a tuning specification from a workflow.
- `finalize()` to pin data-dependent ranges such as `mtry()` against a training set before grid construction.
- `update()` to override one parameter's range inside an existing parameter set without rebuilding it.

External reference: the official dials package documentation at [dials.tidymodels.org/reference/grid_regular.html](https://dials.tidymodels.org/reference/grid_regular.html).

## FAQ

**How do I see the transformed-scale values instead of the natural scale?**

Pass `original = FALSE`. `grid_regular(penalty(), levels = 5, original = FALSE)` returns log10-spaced numbers like `-10, -7.5, -5, -2.5, 0` instead of `1e-10, ..., 1`. This is useful when you want to plot the grid on the same axis you use during diagnostics, since most tuning visualizations use the transformed scale to keep candidates evenly spaced. Switch back to `TRUE` before passing the grid to `tune_grid()`; the tune engine expects natural-scale values.

**Why does grid_regular() ignore my levels for one parameter?**

Two causes. First, a qualitative parameter like `weight_func()` has a fixed set of values, so `levels` caps at the number of available options regardless of what you ask for. Second, a parameter whose range collapsed to a single point (for example after `update(penalty = penalty(range = c(0, 0)))`) returns one value no matter the level count. Inspect the parameter object before building the grid to see its range and type.

**Can I mix qualitative and quantitative parameters in one regular grid?**

Yes. `grid_regular(neighbors(), weight_func(), levels = 4)` returns the cartesian product of four numeric neighbor values and four qualitative weight functions, for 16 rows total. Qualitative columns become factors; numeric columns are doubles. tune_grid() handles the mix without extra work because the parameter set carries each column's type.

**What is the difference between grid_regular() and grid_space_filling(type = "grid_max_entropy")?**

grid_regular() builds a deterministic lattice; the same call always returns the same tibble. Space-filling designs are stochastic (set a seed for reproducibility) and place candidates to maximize coverage of the joint space. Use grid_regular() when you want plottable, reviewable runs in 2 or 3 dimensions, and a space-filling design when you have more parameters than a cartesian product can handle without overrunning the time budget.

**How do I tune a recipe step parameter with grid_regular()?**

Mark the recipe step with `tune()` (for example, `step_pca(num_comp = tune())`) and extract the combined parameter set with `extract_parameter_set_dials(wf)`. Pass that set to grid_regular() and the resulting tibble carries one column per tuned argument, recipe and model both. Use `update(num_comp = num_comp(c(2, 10)))` to override the default range, then build the grid. tune_grid() will score every candidate against every fold, recipe-side knobs included.
