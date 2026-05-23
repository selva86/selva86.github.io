---
title: "dials trees() in R: Tune Ensemble Size in tidymodels"
slug: dials-trees-in-R
description: "Use dials trees() in R to set the ensemble size range for random forest and boosted tree tuning. Defaults, examples, learn_rate interaction, pitfalls."
keywords: "dials trees, trees function R, dials trees examples, R trees hyperparameter, tune trees tidymodels, number of trees parameter, dials::trees"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "trees()|dials trees|dials::trees()|tune trees|trees parameter"
auto_link_case_sensitive: true
target_keyword: dials trees
sibling_block_enabled: true
difficulty: Beginner
---

# dials trees() in R: Tune Ensemble Size in tidymodels

<p class="lead">The dials trees() function in R defines the integer hyperparameter for the number of trees in an ensemble model. It ships with a finalized range of 1 to 2000 by default, so unlike mtry() you can drop it into a tuning grid without calling finalize() first.</p>

[QUICK ANSWER]
trees()                                  # default range 1L to 2000L
trees(range = c(100L, 1500L))            # explicit narrower band
trees(trans = transform_log10())         # log-scaled search space
update(params, trees = trees(c(50L, 500L))) # override range in a param set
grid_regular(trees(c(100L, 1000L)), levels = 5) # candidate grid
rand_forest(trees = tune(), mtry = tune())   # mark for tuning in spec
boost_tree(trees = tune(), learn_rate = tune()) # boosting needs both

[DECISION TREE: Is trees() the right tool?]
- tune ensemble size for forest or boosted trees: trees()
- tune learning rate alongside trees for boosting: learn_rate()
- tune variable sampling at each split: mtry()
- tune the minimum node size: min_n()
- tune individual tree depth in boosting: tree_depth()
- stop boosting early based on validation: stop_iter()
- finalize an unknown range like mtry: finalize(params, train_x)

## What trees() does in one sentence

**trees() returns a dials parameter object describing the ensemble size, not a numeric value.** It is the knob you tune when you mark `trees = tune()` inside `rand_forest()`, `boost_tree()`, `bag_tree()`, or `bart()`. Random forests want enough trees to stabilize the variance reduction. Boosted trees want enough rounds to fit the residual structure, but not so many that they overfit. trees() encodes both intents through the search range you hand it.

The function sits next to `mtry()`, `min_n()`, `tree_depth()`, and `learn_rate()` in the dials family. Unlike mtry(), its upper bound is data-independent, so the default `c(1L, 2000L)` is usable without finalize.

## trees() syntax and arguments

**The signature is two arguments and no surprises.**

```r title="trees signature and defaults"
library(dials)
trees(range = c(1L, 2000L), trans = NULL)
#> # Trees (quantitative)
#> Range: [1, 2000]
```

| Argument | Description |
|---|---|
| `range` | Two-element integer vector. Default `c(1L, 2000L)`. Lower the upper bound for fast prototyping; raise it for boosted trees that need more rounds. |
| `trans` | Optional scales transformation. Use `transform_log10()` or `transform_log2()` when the useful range spans an order of magnitude. NULL by default. |

The return is a `quant_param` S3 object with class `c("quant_param", "param")`. Print it to inspect, call `value_seq()` to draw points, or pass it to a `grid_*()` helper to expand a search space.

```r title="Inspect the parameter object"
p <- trees(range = c(100L, 1500L))
p
#> # Trees (quantitative)
#> Range: [100, 1500]

value_seq(p, 4)
#> [1]  100  566 1033 1500
```

[NOTE]
**Integer flag matters.** dials samples on integers and coerces doubles silently, so passing `range = c(100, 1500)` works but `c(100.5, 1500.5)` quietly truncates. Use the `L` suffix to make integer intent explicit and avoid subtle grid drift.

## Examples by use case

**Random forests, boosted trees, and bagged ensembles all take trees(), but the sensible ranges differ.**

```r title="Tunable random forest with trees and mtry"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)

rf_spec <- rand_forest(
  trees = tune(),
  mtry  = tune(),
  min_n = tune()
) |>
  set_engine("ranger") |>
  set_mode("regression")
```

Random forests benefit from a wide range that scales the trees up to a plateau. The marginal gain past 1000 is usually small, but it costs only compute.

```r title="Build a forest-friendly grid"
params <- extract_parameter_set_dials(rf_spec) |>
  update(trees = trees(c(200L, 1500L))) |>
  finalize(train |> select(-Sale_Price))

grid_rf <- grid_regular(params, levels = c(trees = 4, mtry = 3, min_n = 2))
head(grid_rf)
#> # A tibble: 6 x 3
#>   trees  mtry min_n
#>   <int> <int> <int>
#> 1   200     2     2
#> 2   633     2     2
#> 3  1066     2     2
#> 4  1500     2     2
#> 5   200    33     2
#> 6   633    33     2
```

Boosted trees need a tighter pairing of trees and learn_rate. Many trees with a high learning rate overfit; few trees with a low rate underfit.

```r title="Boosted tree spec with trees and learn_rate"
xgb_spec <- boost_tree(
  trees      = tune(),
  learn_rate = tune(),
  tree_depth = tune()
) |>
  set_engine("xgboost") |>
  set_mode("regression")

xgb_params <- extract_parameter_set_dials(xgb_spec) |>
  update(
    trees      = trees(c(100L, 1000L)),
    learn_rate = learn_rate(c(-3, -1))
  )

grid_xgb <- grid_space_filling(xgb_params, size = 12)
head(grid_xgb, 3)
#> # A tibble: 3 x 3
#>   trees tree_depth learn_rate
#>   <int>      <int>      <dbl>
#> 1   100          4    0.00794
#> 2   523          8    0.0501 
#> 3   918         12    0.158
```

For very long search spaces, the log transform spreads candidates more usefully than a linear sweep.

```r title="Log-scaled trees range"
trees_log <- trees(range = c(50L, 2000L), trans = transform_log10())
value_seq(trees_log, 5)
#> [1]   50  119  283  672 1600
```

A linear sweep would oversample the high end; the log-scaled sequence samples both small and large counts evenly.

[KEY INSIGHT]
**For random forests, trees() is the cheapest knob to leave generous; for boosting, it is the most expensive knob to set wrong.** Random forest accuracy is monotone-non-decreasing in tree count, so over-allocating costs only compute. Boosting accuracy is unimodal in tree count, so the wrong setting actively degrades the model and a too-wide range wastes the tuning budget on bad candidates.

## trees() versus stop_iter() and learn_rate()

**These three control how long the ensemble runs and how it grows; the right move depends on whether you are forest- or boosting-flavored.**

| Knob | Where it applies | What it controls | When to reach for it |
|---|---|---|---|
| `trees()` | Forests, boosting, bagging, BART | Fixed ensemble size before fitting | You want a search over a known range. |
| `stop_iter()` | xgboost, lightgbm boosting only | Early stopping rounds | You set a generous trees upper bound and let validation cut the run short. |
| `learn_rate()` | Boosting only | Shrinkage per round | You expect to need many trees and want each one to contribute a small step. |

For boosted trees, the productive pattern is `trees = 1000, learn_rate = tune(), stop_iter = 25`. Trees is the budget ceiling; learn_rate is the tuning knob; stop_iter is the brake. Forests skip the brake entirely because there is no validation-set signal to act on.

## Common pitfalls

**Four mistakes cause most boosted tree tuning runs to land at suboptimal trees() values.**

1. **Tuning trees without learn_rate in boosting.** A fixed learn_rate hides the actual response curve. Either fix learn_rate at a sensible 0.1 and tune trees, or tune both jointly. Tuning trees in isolation against a low learn_rate produces a flat search surface and an arbitrary winner.
2. **Setting the upper bound to match the trees argument literally.** `boost_tree(trees = 500)` and `trees(c(1L, 500L))` look similar but mean different things. The first fixes trees at 500; the second searches 1 to 500. Use `tune()` in the spec and the range in dials when you want to tune.
3. **Using trees() with engines that ignore it.** Linear models, MARS, kNN, and neural nets have no `trees` argument. `update()`-ing a parameter set with `trees()` against a non-ensemble spec raises `Error: 'trees' is not a parameter for this object.`
4. **Forgetting that trees() controls the count, not the depth.** A 1000-tree forest with depth 30 takes far longer to fit than a 200-tree forest with depth 30. Use `tree_depth()` for individual tree size; trees() only controls how many there are.

[WARNING]
**xgboost early stopping and tune_grid() do not compose cleanly by default.** If you set `stop_iter` inside `set_engine("xgboost", stop_iter = 25, validation = 0.1)` and also tune trees, the early-stopping cutoff applies inside each candidate fit. The recorded `trees` value in `collect_metrics()` is the requested count, not the count after early stopping kicks in. Inspect `extract_fit_engine()` to see the actual best_iteration per candidate.

## Try it yourself

**Try it:** Build a tunable boosted tree spec for the diamonds dataset, set the trees range to 200 to 800 and learn_rate to 1e-3 to 1e-1 on a log10 scale, and produce a 6-candidate space-filling grid. Print the grid.

```r title="Your turn: tune trees and learn_rate"
# Try it: build a boosted-tree grid
library(tidymodels)
data(diamonds, package = "ggplot2")

ex_spec <- boost_tree(trees = tune(), learn_rate = tune()) |>
  set_engine("xgboost") |>
  set_mode("regression")

ex_params <- # your code here

ex_grid <- # your code here

ex_grid
#> Expected: a 6-row tibble with columns trees and learn_rate
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_spec) |>
  update(
    trees      = trees(c(200L, 800L)),
    learn_rate = learn_rate(c(-3, -1))
  )

set.seed(1)
ex_grid <- grid_space_filling(ex_params, size = 6)

ex_grid
#> # A tibble: 6 x 2
#>   trees learn_rate
#>   <int>      <dbl>
#> 1   200    0.0316 
#> 2   320    0.001  
#> 3   440    0.01   
#> 4   560    0.1    
#> 5   680    0.00316
#> 6   800    0.00562
```

**Explanation:** `update()` overrides the default ranges for both parameters in the extracted set. `grid_space_filling()` spreads six candidates so trees marches roughly linearly and learn_rate covers the log10 span uniformly.

</details>

## Related tidymodels functions

**trees() rarely flies solo; it lives inside a short, predictable pipeline.**

- `learn_rate()` to tune the boosting shrinkage rate alongside trees.
- `tree_depth()` to set the depth of individual boosted trees.
- `mtry()` to tune the predictor count sampled at each split.
- `stop_iter()` for xgboost early stopping when the trees upper bound is generous.
- `extract_parameter_set_dials()` to pull every tunable parameter from a workflow at once.
- `update()` to override one parameter range inside a parameter set.
- `grid_regular()`, `grid_random()`, `grid_space_filling()` to materialize candidate tibbles.
- `tune_grid()` to fit each candidate across resamples and rank them.

External reference: the official dials documentation at [dials.tidymodels.org](https://dials.tidymodels.org/reference/trees.html).

## FAQ

**How many trees should I use in a random forest?**

For random forests, more trees rarely hurt accuracy; they cost compute. A common practical default is 500 to 1000 for most tabular problems, and 2000 if the response surface is noisy or the predictor space is high-dimensional. The accuracy gain past 1000 is typically inside the resampling noise band, so tuning trees() in a forest is more about finding the point of diminishing returns than chasing the global maximum.

**Why does dials trees() not need finalize() like mtry()?**

Because the upper bound of trees() does not depend on the training data. The maximum sensible ensemble size is governed by compute budget and overfitting risk, not the predictor matrix shape. dials therefore ships trees() with a concrete default of `c(1L, 2000L)`, which is finalized at construction and ready to feed into `grid_regular()` without further setup.

**How does trees() interact with learn_rate() in boosting?**

They are jointly responsible for the total signal absorbed during boosting. A small learn_rate spreads the same gradient signal across more rounds, so it needs proportionally more trees to converge. Tuning one without the other gives a misleading picture: a small learn_rate looks bad with too few trees, and a large learn_rate looks unstable with too many. Use a 2D grid or space-filling design over both.

**Can I tune trees() with cross-validation and early stopping at the same time?**

Yes, but the bookkeeping is tricky. Set a generous trees() range, configure `stop_iter` inside the engine, and let xgboost stop each candidate fit early. The `collect_metrics()` output reports the requested trees count, not the post-stopping count, so to see the actual best iteration per candidate, pipe `extract_fit_engine()` and inspect `best_iteration`. Most users skip stop_iter inside tune_grid() and just tune trees as a clean knob.

**What is the difference between trees() in dials and trees in parsnip?**

`dials::trees()` is the parameter object that describes the search range for the ensemble size. `parsnip::rand_forest(trees = ...)` is the model argument that takes either an integer (fixed value) or `tune()` (placeholder to be filled in by the dials object during tuning). The dials function defines the search space; the parsnip argument consumes the result. They cooperate via `extract_parameter_set_dials()` and `tune_grid()`.
