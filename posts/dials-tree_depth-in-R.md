---
title: "dials tree_depth() in R: Tune Decision Tree Depth"
slug: dials-tree_depth-in-R
description: "Use dials tree_depth() in R to set the depth range for decision and boosted trees in tidymodels. Defaults, engine quirks, min_n interaction, pitfalls."
keywords: "dials tree_depth, tree_depth function R, dials tree_depth examples, R tree_depth hyperparameter, tune tree depth tidymodels, dials::tree_depth, boosted tree depth"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "tree_depth()|dials tree_depth|dials::tree_depth()|tune tree depth|tree depth parameter"
auto_link_case_sensitive: true
target_keyword: dials tree_depth
sibling_block_enabled: true
difficulty: Beginner
---

# dials tree_depth() in R: Tune Decision Tree Depth

<p class="lead">The dials tree_depth() function in R defines the integer hyperparameter for the maximum depth of a single tree. It ships with a finalized range of 1 to 15 by default, so you can pipe it straight into a tuning grid without calling finalize() first.</p>

[QUICK ANSWER]
tree_depth()                                  # default range 1L to 15L
tree_depth(range = c(3L, 10L))                # explicit narrower band
tree_depth(trans = transform_log2())          # log-scaled depth search
update(params, tree_depth = tree_depth(c(2L, 8L))) # override in a param set
grid_regular(tree_depth(c(2L, 12L)), levels = 6)   # candidate depths
decision_tree(tree_depth = tune())            # tune CART depth
boost_tree(tree_depth = tune(), trees = tune()) # boosting depth + count

[DECISION TREE: Is tree_depth() the right tool?]
- tune the max depth of a single tree: tree_depth()
- tune the minimum node size that stops splitting: min_n()
- tune the cost-complexity pruning parameter: cost_complexity()
- tune the number of trees in the ensemble: trees()
- tune the boosting shrinkage per round: learn_rate()
- tune predictors sampled at each split: mtry()
- finalize a data-dependent range like mtry: finalize(params, train_x)

## What tree_depth() does in one sentence

**tree_depth() returns a dials parameter object describing the maximum levels a single tree may grow, not a numeric value.** It is the knob you tune when you mark `tree_depth = tune()` inside `decision_tree()`, `boost_tree()`, `bag_tree()`, or `bart()`. A shallow tree underfits; a deep tree overfits. The right depth depends on signal-to-noise in the predictors and on whether the tree stands alone or sits inside an ensemble.

The function sits next to `trees()`, `min_n()`, `mtry()`, and `learn_rate()` in the dials family. Its upper bound does not depend on the training data, so the default `c(1L, 15L)` is usable without finalize.

## tree_depth() syntax and arguments

**The signature is two arguments and no surprises.**

```r title="tree_depth signature and defaults"
library(dials)
tree_depth(range = c(1L, 15L), trans = NULL)
#> Tree Depth (quantitative)
#> Range: [1, 15]
```

| Argument | Description |
|---|---|
| `range` | Two-element integer vector. Default `c(1L, 15L)`. Narrow it for boosting (2 to 8 is common); widen it for a stand-alone CART you plan to prune later. |
| `trans` | Optional scales transformation. Use `transform_log2()` when you want to sweep depths 1, 2, 4, 8, 16 with even resolution. NULL by default. |

The return is a `quant_param` S3 object with class `c("quant_param", "param")`. Print it to inspect, call `value_seq()` to draw points, or pass it to a `grid_*()` helper to expand a search space.

```r title="Inspect the parameter object"
p <- tree_depth(range = c(2L, 10L))
p
#> Tree Depth (quantitative)
#> Range: [2, 10]

value_seq(p, 5)
#> [1]  2  4  6  8 10
```

[NOTE]
**Integer flag matters.** dials samples on integers and coerces doubles silently, so `range = c(2, 10)` works but `c(2.5, 10.5)` quietly truncates. Use the `L` suffix to make integer intent explicit and avoid grid drift.

## Examples by use case

**Decision trees, boosted trees, and bagged trees all take tree_depth(), but the sensible ranges differ sharply.**

A stand-alone CART benefits from depth as a structural cap that interacts with the pruning step. A wide range here is fine because cost_complexity() does the bias-variance balancing.

```r title="Tunable CART with tree_depth and cost_complexity"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)

cart_spec <- decision_tree(
  tree_depth      = tune(),
  cost_complexity = tune(),
  min_n           = tune()
) |>
  set_engine("rpart") |>
  set_mode("regression")
```

```r title="Build a CART-friendly grid"
cart_params <- extract_parameter_set_dials(cart_spec) |>
  update(tree_depth = tree_depth(c(2L, 12L)))

grid_cart <- grid_regular(cart_params, levels = c(tree_depth = 4, cost_complexity = 3, min_n = 2))
head(grid_cart)
#> # A tibble: 6 x 3
#>   cost_complexity tree_depth min_n
#>             <dbl>      <int> <int>
#> 1    0.0000000001          2     2
#> 2    0.00000316            2     2
#> 3    0.1                   2     2
#> 4    0.0000000001          5     2
#> 5    0.00000316            5     2
#> 6    0.1                   5     2
```

Boosted trees want a much tighter range. Each tree corrects the residuals from the previous round, so shallow trees (depth 3 to 6) typically outperform deep ones. xgboost defaults to depth 6 for this reason.

```r title="Boosted tree spec with shallow depth"
xgb_spec <- boost_tree(
  tree_depth = tune(),
  trees      = tune(),
  learn_rate = tune()
) |>
  set_engine("xgboost") |>
  set_mode("regression")

xgb_params <- extract_parameter_set_dials(xgb_spec) |>
  update(
    tree_depth = tree_depth(c(2L, 8L)),
    trees      = trees(c(100L, 1000L)),
    learn_rate = learn_rate(c(-3, -1))
  )

grid_xgb <- grid_space_filling(xgb_params, size = 12)
head(grid_xgb, 3)
#> # A tibble: 3 x 3
#>   tree_depth trees learn_rate
#>        <int> <int>      <dbl>
#> 1          2   100    0.00794
#> 2          5   523    0.0501 
#> 3          8   918    0.158
```

For a stand-alone CART or a bagged ensemble where you want to scan order-of-magnitude depths, log2 spreads candidates more evenly than a linear sweep.

```r title="Log2-scaled depth range"
depth_log <- tree_depth(range = c(2L, 16L), trans = transform_log2())
value_seq(depth_log, 5)
#> [1]  2  3  6 10 16
```

The log2 schedule samples both shallow and deep candidates without burning grid points on adjacent integers.

[KEY INSIGHT]
**Shallow boosted trees, deep bagged trees.** Boosting relies on weak learners adding small corrections, so depths 3 to 6 hit the sweet spot; deeper boosted trees overfit fast. Bagging and random forests use deep, decorrelated trees averaged together, so depths 10+ are normal. The right tree_depth() range depends entirely on whether the trees are correcting each other (boosting) or voting independently (bagging).

## tree_depth() versus min_n() and cost_complexity()

**Three knobs cap how complex a single tree can get; they apply in different ways.**

| Knob | What it controls | How it caps complexity |
|---|---|---|
| `tree_depth()` | Maximum levels from root to leaf | Hard ceiling on tree height. Stops splits beyond depth N. |
| `min_n()` | Minimum samples needed to consider a split | Stops splits when a node holds too few rows to justify branching. |
| `cost_complexity()` | Penalty on tree size during pruning | Prunes back after fitting; bigger penalty = smaller final tree. |

For boosted trees, `tree_depth()` is the cleanest knob because each round produces a fresh tree from scratch. min_n() also works but ranges are engine-dependent. cost_complexity() does not apply to xgboost or lightgbm at all; it is an rpart concept.

For decision_tree() with rpart, all three cooperate: tree_depth() and min_n() cap the unpruned tree, then cost_complexity() prunes it back. Tuning depth alone with the rpart default of cost_complexity = 0.01 often gives a tree that is shorter than your tree_depth() ceiling because pruning kicks in first.

## Common pitfalls

**Four mistakes cause most tree_depth() tuning runs to settle at suboptimal values.**

1. **Using boosting depth ranges for a stand-alone CART.** A CART with `tree_depth(c(2L, 6L))` underfits unless cost_complexity does the heavy lifting. Stand-alone trees usually need depths 8 to 20.
2. **Using CART depth ranges for boosted trees.** A boosted ensemble with depths 12 to 20 overfits aggressively; deep boosted trees combine into a high-variance model. Cap boosting depth at 8.
3. **Tuning tree_depth() in random forests without checking engine support.** `ranger` exposes `tree.depth` only in recent versions; `randomForest` ignores max-depth entirely. Check `show_engines("rand_forest")` before assuming tree_depth() applies.
4. **Forgetting that depth 1 means a stump.** `tree_depth(c(1L, 15L))` includes single-split trees as a candidate. For boosting, stumps are a real strategy. For a stand-alone CART they are rarely useful; lift the lower bound to 3 or 4.

[WARNING]
**xgboost ignores tree_depth() when grow_policy is "lossguide".** xgboost has two tree-growth policies. Under the default `"depthwise"`, the `max_depth` parameter (set by tree_depth()) caps tree height as expected. Under `"lossguide"`, xgboost grows leaf-wise and uses `max_leaves` instead; max_depth is set to 0 internally and tree_depth() has no effect. If you switch grow_policy, tune `max_leaves` via a custom parameter object, not tree_depth().

## Try it yourself

**Try it:** Build a tunable boosted tree spec for the diamonds dataset, set the tree_depth range to 3 to 8 and trees to 200 to 800, and produce a 6-candidate space-filling grid. Print the grid.

```r title="Your turn: tune tree_depth and trees"
# Try it: build a boosted-tree grid
library(tidymodels)
data(diamonds, package = "ggplot2")

ex_spec <- boost_tree(tree_depth = tune(), trees = tune()) |>
  set_engine("xgboost") |>
  set_mode("regression")

ex_params <- # your code here

ex_grid <- # your code here

ex_grid
#> Expected: a 6-row tibble with columns tree_depth and trees
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_spec) |>
  update(
    tree_depth = tree_depth(c(3L, 8L)),
    trees      = trees(c(200L, 800L))
  )

set.seed(1)
ex_grid <- grid_space_filling(ex_params, size = 6)

ex_grid
#> # A tibble: 6 x 2
#>   tree_depth trees
#>        <int> <int>
#> 1          3   320
#> 2          4   680
#> 3          5   440
#> 4          6   200
#> 5          7   800
#> 6          8   560
```

**Explanation:** `update()` overrides the default ranges for both parameters in the extracted set. `grid_space_filling()` spreads six candidates so tree_depth steps through integer levels and trees fills the count range with maximum spread.

</details>

## Related tidymodels functions

**tree_depth() rarely flies solo; it lives inside a short, predictable pipeline.**

- `trees()` to tune the ensemble size alongside individual tree depth.
- `min_n()` to set the minimum samples that still trigger a split.
- `cost_complexity()` to tune rpart pruning after the depth cap is hit.
- `learn_rate()` to tune the boosting shrinkage when each tree is shallow.
- `mtry()` to tune predictor sampling at each split inside a forest.
- `extract_parameter_set_dials()` to pull every tunable parameter from a workflow at once.
- `update()` to override one parameter range inside a parameter set.
- `grid_regular()`, `grid_random()`, `grid_space_filling()` to materialize candidate tibbles.
- `tune_grid()` to fit each candidate across resamples and rank them.

External reference: the official dials documentation at [dials.tidymodels.org](https://dials.tidymodels.org/reference/tree_depth.html).

## FAQ

**What is a good tree_depth for xgboost?**

For xgboost on tabular data, depths 4 to 8 cover the great majority of well-tuned models. Kaggle-winning solutions cluster around depth 6, matching xgboost's library default. Going beyond 8 rarely improves out-of-fold accuracy and inflates training time. If you tune learn_rate jointly, shrinkage can compensate for slightly deeper trees, but the canonical safe range is `tree_depth(c(3L, 8L))`.

**How does tree_depth() differ from max_depth in xgboost?**

`dials::tree_depth()` is the parameter object describing the search range for the depth hyperparameter. `xgboost::xgb.train(params = list(max_depth = 6))` is the engine-level setting that consumes a single value at fit time. tidymodels translates `tree_depth = tune()` in `boost_tree()` to repeated `max_depth = N` calls inside xgboost, one per candidate. The dials function defines the space; the engine argument consumes one point at a time.

**Why does dials tree_depth() not need finalize() like mtry()?**

Because the maximum sensible depth does not depend on the training data shape. Even with a million rows, depth 20 is more than enough to fit pure noise. dials therefore ships tree_depth() with a concrete default of `c(1L, 15L)`, which is finalized at construction and ready to feed into `grid_regular()` without further setup.

**Can I tune tree_depth() in a random forest?**

Sometimes. The `ranger` engine added `max.depth` support in version 0.12, so `rand_forest(tree_depth = tune())` works there but is ignored by older builds. The `randomForest` engine has no max-depth argument and ignores tree_depth() silently. In practice, mtry() and min_n() are the load-bearing knobs for forests; tree_depth() is a secondary target you reach for only if an unconstrained forest overfits on small training sets.

**Should I tune tree_depth() and min_n() together?**

Yes for boosted trees, often no for random forests. In boosting, depth and min_n jointly cap each round's complexity and can compensate for each other, so tuning both helps the search find the right knob mix. In forests, min_n is the primary complexity knob and tree_depth() is usually redundant; tuning both burns budget on combinations that fit nearly identical trees.
