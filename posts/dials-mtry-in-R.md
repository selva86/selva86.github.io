---
title: "dials mtry() in R: Tune Random Forest Variable Sampling"
slug: dials-mtry-in-R
description: "Use dials mtry() in R to set the variable-sampling range for random forest tuning. See finalize(), update(), mtry_prop(), examples, and common pitfalls."
keywords: "dials mtry, mtry function R, dials mtry examples, R mtry hyperparameter, tune mtry tidymodels, mtry random forest, finalize mtry"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "mtry()|dials mtry|dials::mtry()|tune mtry|finalize mtry"
auto_link_case_sensitive: true
target_keyword: dials mtry
sibling_block_enabled: true
difficulty: Beginner
---

# dials mtry() in R: Tune Random Forest Variable Sampling

<p class="lead">The dials mtry() function in R defines the integer hyperparameter for the number of predictors randomly sampled at each split in tree ensembles. It returns a parameter object with an unknown upper bound, so you almost always pair it with finalize() to fill in the maximum from your training data before tuning.</p>

[QUICK ANSWER]
mtry()                                   # default range 1L to unknown()
mtry(range = c(1L, 20L))                 # explicit integer range
finalize(mtry(), train_data)             # set upper bound from data
update(params, mtry = mtry(c(2L, 8L)))   # override range in a param set
mtry_prop()                              # proportion variant, no finalize needed
mtry_long()                              # log-scaled variant for wide data
grid_regular(mtry(c(1L, 10L)), levels = 5) # candidate grid

[DECISION TREE: Is mtry() the right tool?]
- tune predictor count for random forest or boosted trees: mtry()
- tune as a proportion of predictors instead: mtry_prop()
- finalize a tuning grid once data is in hand: finalize(params, train_x)
- set learn rate or shrinkage: learn_rate()
- set tree depth for boosted trees: tree_depth()
- set number of trees in the ensemble: trees()
- update many ranges at once on a workflow: extract_parameter_set_dials(wf) |> update(...)

## What mtry() does in one sentence

**mtry() returns a dials parameter object, not a numeric value.** It describes the hyperparameter that controls how many predictors are sampled when each split is considered in a random forest or boosted tree. The object carries a range, a label, a transformation (none, by default), and an integer flag, which is enough metadata for `grid_regular()`, `grid_space_filling()`, and `tune_grid()` to build candidate sets and rank them.

The wrinkle that sets mtry() apart from other dials parameters is the upper bound. Most parameters ship with sensible defaults baked in. mtry()'s default is `c(1L, unknown())` because the maximum sensible value equals the number of columns in your predictor matrix, which dials cannot know until you hand it data. That is why `finalize()` exists, and it is the call you forget at your peril.

## mtry() syntax and arguments

**The signature is intentionally minimal.**

```r title="mtry signature and defaults"
library(dials)
mtry(range = c(1L, unknown()), trans = NULL)
#> # Randomly Selected Predictors (quantitative)
#> Range: [1, ?]
```

| Argument | Description |
|---|---|
| `range` | Two-element integer vector. Lower default 1L; upper default `unknown()` until finalize() fills it in. |
| `trans` | A transformation from the scales package, e.g. `transform_log()`. Almost always NULL for mtry. |

The return is a `quant_param` S3 object. Print it to inspect the range, call `value_seq()` to generate values, or pass it to `grid_*()` helpers.

```r title="Inspect the parameter object"
p <- mtry(range = c(2L, 12L))
p
#> # Randomly Selected Predictors (quantitative)
#> Range: [2, 12]

value_seq(p, 4)
#> [1]  2  5  8 12
```

[NOTE]
**Integer flag matters.** dials calls `is_unknown()` and `as.integer()` when sampling, so a `range = c(1, 20)` (doubles) gets coerced. Pass `c(1L, 20L)` to be explicit and avoid surprises in custom grids.

## Examples by use case

**Start with a tunable random forest, then finalize the range, then grid the candidates.**

```r title="Tunable random forest with tune placeholders"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)

rf_spec <- rand_forest(
  mtry  = tune(),
  trees = 500,
  min_n = tune()
) |>
  set_engine("ranger") |>
  set_mode("regression")

wf <- workflow() |>
  add_formula(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood) |>
  add_model(rf_spec)
```

Extract the parameter set, see the unknown upper bound, then finalize against the training data.

```r title="Extract and finalize mtry"
params <- extract_parameter_set_dials(wf)
params
#> Collection of 2 parameters for tuning
#>  identifier  type    object
#>        mtry  mtry nparam[?]
#>       min_n min_n nparam[+]
#> Parameters needing finalization:
#>    Randomly Selected Predictors ('mtry')

params <- params |> finalize(train)
params
#> Collection of 2 parameters for tuning
#>  identifier  type    object
#>        mtry  mtry nparam[+]
#>       min_n min_n nparam[+]
```

The `nparam[?]` flips to `nparam[+]` once the upper bound is set. Now a regular grid actually has both endpoints.

```r title="Regular grid over finalized mtry"
mtry_grid <- grid_regular(params, levels = c(mtry = 4, min_n = 3))
mtry_grid
#> # A tibble: 12 x 2
#>     mtry min_n
#>    <int> <int>
#>  1     1     2
#>  2     2     2
#>  3     3     2
#>  4     4     2
#>  5     1    21
#>  ...
```

You can skip the finalize step entirely by switching to `mtry_prop()`, which lives on `[0, 1]` and does not depend on data shape.

```r title="Proportion variant avoids finalize"
rf_spec2 <- rand_forest(mtry = tune(), trees = 500) |>
  set_engine("ranger") |>
  set_mode("regression")

wf2 <- workflow(Sale_Price ~ Gr_Liv_Area + Year_Built, rf_spec2)

params2 <- extract_parameter_set_dials(wf2) |>
  update(mtry = mtry_prop(range = c(0.1, 0.9)))

grid_random(params2, size = 5)
#> # A tibble: 5 x 1
#>    mtry
#>   <dbl>
#> 1 0.231
#> 2 0.687
#> ...
```

[KEY INSIGHT]
**mtry() and mtry_prop() are interchangeable knobs into the same model argument.** Both feed `rand_forest(mtry = tune())`. The choice is whether you want to think in absolute predictor counts (mtry) or share of predictors (mtry_prop). The latter generalizes across datasets, which makes recipes that test multiple data sources feel cleaner.

## mtry() versus mtry_prop() and mtry_long()

**Pick by how you reason about the model, not by what the documentation lists first.**

| Function | Range | When to reach for it |
|---|---|---|
| `mtry()` | `[1, p]` integer, needs finalize | You think in absolute predictor counts. Sklearn-style "max_features". |
| `mtry_prop()` | `[0, 1]` numeric | You want a portable range across datasets of different widths. |
| `mtry_long()` | `[1, p]` on log2 scale | Very wide data (hundreds of predictors), where a linear sweep wastes points at the high end. |

ranger and xgboost both accept the raw integer behind the scenes; the dials variant just controls how the search space is sampled. A 100-predictor dataset with `mtry_long()` and 5 levels samples roughly at 1, 4, 10, 32, 100, which spreads coverage on the log scale.

## Common pitfalls

**Four mistakes account for most failed tune_grid() calls involving mtry.**

1. **Forgetting finalize().** `grid_regular(params)` with an unfinalized mtry returns `Error: Some parameters require finalization`. Always pipe through `finalize(train_predictors)` before constructing the grid.
2. **Passing the full data frame including the outcome.** `finalize()` counts columns. A data frame with the outcome inflates the upper bound by one, which is harmless for trees but confusing in `value_seq()`. Pass `train |> select(-Sale_Price)` or a recipe-prepped matrix for clarity.
3. **Mixing mtry() and mtry_prop() in one parameter set.** Only one can occupy the `mtry` slot of a parsnip spec. If you update from one to the other, the entire `mtry` parameter object is replaced, not merged.
4. **Treating mtry as numeric in a custom tibble grid.** A grid with `mtry = c(0.5, 0.7)` will be coerced to integer 0 and 0, silently breaking the run. Use `mtry_prop()` for fractions or stick to integer values for `mtry()`.

[WARNING]
**Default upper bound after finalize includes prepped predictors, not raw columns.** If your recipe uses `step_dummy()`, one categorical column with five levels expands to four predictor columns. Finalize the parameter set AFTER the recipe is part of the workflow so the upper bound reflects the post-prep predictor count, not the raw frame.

## Try it yourself

**Try it:** Build a tunable random forest on iris (3-class classification), finalize a parameter set so mtry has a real upper bound, and produce a 6-point regular grid over mtry and min_n. Print the grid.

```r title="Your turn: finalize mtry on iris"
# Try it: finalize mtry on iris
library(tidymodels)

ex_spec <- rand_forest(mtry = tune(), trees = 200, min_n = tune()) |>
  set_engine("ranger") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_spec)

ex_params <- # your code here

ex_grid <- # your code here

ex_grid
#> Expected: a 6-row tibble with columns mtry and min_n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_wf) |>
  finalize(iris |> select(-Species))

ex_grid <- grid_regular(ex_params, levels = c(mtry = 3, min_n = 2))

ex_grid
#> # A tibble: 6 x 2
#>    mtry min_n
#>   <int> <int>
#> 1     1     2
#> 2     2     2
#> 3     4     2
#> 4     1    40
#> 5     2    40
#> 6     4    40
```

**Explanation:** iris has four predictors after dropping Species, so finalize() sets the mtry upper bound to 4. The regular grid then spreads three points across mtry and two across min_n, producing the 3 by 2 grid.

</details>

## Related tidymodels functions

**mtry() rarely flies solo; the typical call lives inside a short pipeline.**

- `finalize()` to substitute the unknown upper bound with the training data column count.
- `mtry_prop()` and `mtry_long()` for proportion-based and log-scaled variants of the same knob.
- `extract_parameter_set_dials()` to pull every tunable parameter from a workflow at once.
- `update()` to override one parameter range inside a parameter set without rebuilding the spec.
- `grid_regular()`, `grid_random()`, `grid_space_filling()` to turn the parameter set into candidate tibbles.
- `tune_grid()` to actually fit each candidate across resamples.

External reference: the official dials documentation at [dials.tidymodels.org](https://dials.tidymodels.org/reference/trees.html).

## FAQ

**What is mtry in a random forest?**

mtry is the number of predictor variables randomly sampled as candidates at each split point during tree construction. It is the single most important hyperparameter for random forests because it controls the correlation between trees in the ensemble. Lower mtry produces more diverse trees and stronger variance reduction; higher mtry produces stronger individual trees but more correlation. The classic defaults are `sqrt(p)` for classification and `p/3` for regression, where p is the number of predictors.

**Why does mtry() have an unknown upper bound by default?**

Because dials parameter objects are defined before the data is seen. The maximum sensible value for mtry is the number of predictor columns, which depends on the data and any recipe steps that change the column count (`step_dummy()`, `step_pca()`, `step_zv()`). Leaving the upper bound as `unknown()` forces an explicit `finalize()` call, which makes the dependency on data shape visible in the code rather than hidden behind a constant.

**How is mtry() different from mtry_prop()?**

mtry() lives on the integer range `[1, p]` and tunes the absolute count of sampled predictors. mtry_prop() lives on the numeric range `[0, 1]` and tunes the proportion. Internally, ranger or xgboost still receives an integer count at fit time, computed as `ceiling(mtry_prop * p)`. Use mtry_prop() when you want the search space to be portable across datasets of different widths, or when you find proportions easier to reason about than counts.

**Do I need to call finalize() if I pass an explicit range to mtry()?**

No. `mtry(range = c(2L, 10L))` is a fully specified parameter object; `is_unknown()` returns FALSE on both endpoints, and `grid_regular()` can sample it directly. Use this form when you want to bound the search tighter than the data permits, for example to prevent the model from sampling all predictors and degenerating into a bagged tree ensemble.

**Can I tune mtry alongside recipe steps in the same workflow?**

Yes. Mark the recipe step with `tune()` (for example, `step_pca(num_comp = tune())`) and `rand_forest(mtry = tune())` in the model spec. `extract_parameter_set_dials(wf) |> finalize(train)` collects both. Finalize after adding the recipe to the workflow so the mtry upper bound reflects the post-recipe column count, not the raw frame.
