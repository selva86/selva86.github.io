---
title: "dials min_n() in R: Tune Minimum Node Size for Tree Models"
slug: dials-min_n-in-R
description: "Use dials min_n() in R to set the minimum-node-size search range for tidymodels tree models. Defaults, engine mappings, regression vs classification tips."
keywords: "dials min_n, min_n function R, dials min_n examples, tidymodels min_n hyperparameter, tune min_n random forest, min_n decision tree R, dials min_n range"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "min_n()|dials min_n|dials::min_n()|minimum node size|tune min_n"
auto_link_case_sensitive: true
target_keyword: dials min_n
sibling_block_enabled: true
difficulty: Beginner
---

# dials min_n() in R: Tune Minimum Node Size for Tree Models

<p class="lead">The dials min_n() function in R defines the integer hyperparameter for the minimum number of data points a node must hold before it can be split further. It ships finalized with a default range of 2 to 40, so you can drop it straight into a tuning grid without calling finalize() first.</p>

[QUICK ANSWER]
min_n()                                       # default range 2L to 40L
min_n(range = c(5L, 50L))                     # explicit wider band
min_n(trans = transform_log2())               # log-scaled node-size search
update(params, min_n = min_n(c(2L, 25L)))     # override in a param set
grid_regular(min_n(c(2L, 30L)), levels = 6)   # candidate node sizes
rand_forest(min_n = tune(), mtry = tune())    # tune RF leaf size and mtry
boost_tree(min_n = tune(), tree_depth = tune()) # boost: depth + node size

[DECISION TREE: Is min_n() the right tool?]
- tune the minimum node size that stops splitting: min_n()
- tune the maximum depth of a single tree: tree_depth()
- tune the cost-complexity pruning parameter: cost_complexity()
- tune predictors sampled at each split in a forest: mtry()
- tune the number of trees in the ensemble: trees()
- tune the boosting shrinkage per round: learn_rate()
- finalize a data-dependent range like mtry: finalize(params, train_x)

## What min_n() does in one sentence

**min_n() returns a dials parameter object describing the minimum sample count a node must hold to remain splittable, not a numeric value.** It is the knob you tune when you mark `min_n = tune()` inside `rand_forest()`, `decision_tree()`, `boost_tree()`, `bag_tree()`, or `bart()`. Small min_n grows tall trees that fit training noise; large min_n prunes splits early and biases toward simpler trees.

The function sits next to `trees()`, `tree_depth()`, `mtry()`, and `learn_rate()` in the dials family. Its upper bound does not depend on training data, so the default `c(2L, 40L)` is usable without finalize.

## min_n() syntax and arguments

**The signature is two arguments and no surprises.**

```r title="min_n signature and defaults"
library(dials)
min_n(range = c(2L, 40L), trans = NULL)
#> Minimal Node Size (quantitative)
#> Range: [2, 40]
```

| Argument | Description |
|---|---|
| `range` | Two-element integer vector. Default `c(2L, 40L)`. Widen for noisy data, narrow for clean signal. Use larger ranges on big datasets where deeper trees stay stable. |
| `trans` | Optional scales transformation. Use `transform_log2()` to sweep node sizes 2, 4, 8, 16, 32 with even resolution rather than burning grid points on adjacent integers. |

The return is a `quant_param` S3 object with class `c("quant_param", "param")`. Print it to inspect, call `value_seq()` to draw points, or pass it to a `grid_*()` helper to expand a search space.

```r title="Inspect the parameter object"
p <- min_n(range = c(2L, 30L))
p
#> Minimal Node Size (quantitative)
#> Range: [2, 30]

value_seq(p, 5)
#> [1]  2  9 16 23 30
```

[NOTE]
**Integer flag matters.** dials samples on integers and coerces doubles silently, so `range = c(2, 30)` works but `c(2.5, 30.5)` quietly truncates. The `L` suffix makes integer intent explicit and prevents grid drift on engines that error on doubles.

## Examples by use case

**Random forests, boosted trees, and stand-alone CARTs all take min_n(), but the sensible ranges differ sharply.**

Random forests treat min_n as the primary complexity knob. The classic Breiman defaults are 1 for classification and 5 for regression, encouraging fully grown trees. tidymodels widens this for tuning because optimal node size depends on dataset size.

```r title="Random forest with min_n and mtry tuned"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)

rf_spec <- rand_forest(
  mtry  = tune(),
  min_n = tune(),
  trees = 500
) |>
  set_engine("ranger") |>
  set_mode("regression")
```

```r title="Build a forest-friendly grid"
rf_params <- extract_parameter_set_dials(rf_spec) |>
  update(
    mtry  = mtry(c(5L, 25L)),
    min_n = min_n(c(2L, 40L))
  )

set.seed(1)
grid_rf <- grid_space_filling(rf_params, size = 8)
head(grid_rf)
#> # A tibble: 6 x 2
#>    mtry min_n
#>   <int> <int>
#> 1     5    34
#> 2     8     7
#> 3    11    23
#> 4    14    12
#> 5    17    40
#> 6    20    18
```

Boosted trees use min_n to slow down each round. xgboost calls it `min_child_weight`; lightgbm calls it `min_data_in_leaf`. tidymodels translates min_n to whichever name the engine expects.

```r title="Boosted tree spec with min_n and tree_depth"
xgb_spec <- boost_tree(
  min_n      = tune(),
  tree_depth = tune(),
  trees      = 500,
  learn_rate = 0.05
) |>
  set_engine("xgboost") |>
  set_mode("regression")

xgb_params <- extract_parameter_set_dials(xgb_spec) |>
  update(
    min_n      = min_n(c(5L, 50L)),
    tree_depth = tree_depth(c(3L, 8L))
  )

grid_xgb <- grid_regular(xgb_params, levels = c(min_n = 4, tree_depth = 3))
head(grid_xgb, 3)
#> # A tibble: 3 x 2
#>   min_n tree_depth
#>   <int>      <int>
#> 1     5          3
#> 2    20          3
#> 3    35          3
```

[KEY INSIGHT]
**min_n is the load-bearing knob for random forests.** In forests, tree_depth() is usually redundant because individual trees are grown deep on purpose; what controls fit is how aggressively each tree subdivides. min_n caps that. In boosted trees the roles flip: tree_depth() leads and min_n() backs it up. Picking the right knob to tune first saves grid-search budget.

## min_n() versus tree_depth() and cost_complexity()

**Three knobs cap how complex a single tree can get; they apply in different ways.**

| Knob | What it controls | How it caps complexity |
|---|---|---|
| `min_n()` | Minimum samples needed to consider a split | Stops splits when a node holds too few rows to justify branching. Engine-portable. |
| `tree_depth()` | Maximum levels from root to leaf | Hard ceiling on tree height. Stops splits beyond depth N. |
| `cost_complexity()` | Penalty on tree size during pruning | Prunes back after fitting; bigger penalty = smaller final tree. rpart-only. |

For random forests, min_n() does almost all the work: each tree grows until splits run out of qualifying nodes, so the leaf-size floor sets the bias-variance tradeoff directly. For boosted trees, tree_depth() and min_n() cooperate, capping height and partition size in parallel. For decision_tree() with rpart, all three matter: tree_depth() and min_n() cap the unpruned tree, then cost_complexity() prunes it back.

## Common pitfalls

**Four mistakes account for most surprising min_n() tuning outcomes.**

1. **Using min_n = 1 in random forests on noisy data.** A node-size floor of 1 lets each tree memorize training rows. The forest still generalizes through bagging, but variance stays high. Lift the lower bound to 5 or 10 when out-of-fold scores are unstable.
2. **Treating min_n as engine-agnostic when it is not.** rpart has TWO related arguments (`minsplit` and `minbucket`); ranger has `min.node.size`; randomForest has `nodesize`. tidymodels maps min_n to the dominant one per engine, but the EFFECTIVE behavior differs slightly. Check `parsnip::translate()` to see the actual mapping.
3. **Tuning min_n() without scaling the range to dataset size.** A min_n of 40 on a 200-row dataset wipes out splits; on a 200,000-row dataset it is barely a constraint. Set the upper bound to roughly 1 to 5 percent of training rows.
4. **Forgetting that classification and regression have different sensible floors.** Classification can split down to 1 because pure leaves still vote correctly. Regression with min_n = 1 produces leaves whose prediction is a single observation, inflating variance. Lift the regression floor to 5 or higher.

[WARNING]
**rpart minsplit defaults to 20, NOT 2.** When you fit `decision_tree() |> set_engine("rpart")` without tuning min_n, rpart applies its own default of `minsplit = 20`, meaning nodes with fewer than 20 rows are never split. If your training set is small (say 200 rows), this default alone caps tree depth even when tree_depth() permits more. Either set min_n explicitly via `set_args(min_n = 2)` or include min_n() in your tuning grid.

## Try it yourself

**Try it:** Build a tunable random forest spec for the diamonds dataset, set the min_n range to 5 to 50 and mtry range to 3 to 8, then produce a 6-candidate space-filling grid. Print the grid.

```r title="Your turn: tune min_n and mtry"
# Try it: build a random-forest grid
library(tidymodels)
data(diamonds, package = "ggplot2")

ex_spec <- rand_forest(min_n = tune(), mtry = tune(), trees = 300) |>
  set_engine("ranger") |>
  set_mode("regression")

ex_params <- # your code here

ex_grid <- # your code here

ex_grid
#> Expected: a 6-row tibble with columns mtry and min_n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_spec) |>
  update(
    mtry  = mtry(c(3L, 8L)),
    min_n = min_n(c(5L, 50L))
  )

set.seed(1)
ex_grid <- grid_space_filling(ex_params, size = 6)

ex_grid
#> # A tibble: 6 x 2
#>    mtry min_n
#>   <int> <int>
#> 1     3    41
#> 2     4    14
#> 3     5    27
#> 4     6     5
#> 5     7    50
#> 6     8    23
```

**Explanation:** `update()` overrides the default ranges for both parameters in the extracted set. `grid_space_filling()` spreads six candidates so mtry steps through integer levels and min_n fills the range with maximum spread between adjacent candidates.

</details>

## Related tidymodels functions

**min_n() rarely flies solo; it lives inside a short, predictable pipeline.**

- `mtry()` to tune the predictors sampled per split in a forest.
- `tree_depth()` to set the maximum depth of a single tree.
- `trees()` to tune the ensemble size alongside per-tree complexity.
- `cost_complexity()` to tune rpart pruning after min_n caps splitting.
- `learn_rate()` to tune the boosting shrinkage when each tree is shallow.
- `extract_parameter_set_dials()` to pull every tunable parameter from a workflow at once.
- `update()` to override one parameter range inside a parameter set.
- `grid_regular()`, `grid_random()`, `grid_space_filling()` to materialize candidate tibbles.
- `tune_grid()` to fit each candidate across resamples and rank them.
- `parsnip::translate()` to inspect how min_n maps to the engine-level argument.

External reference: the official dials documentation at [dials.tidymodels.org](https://dials.tidymodels.org/reference/min_n.html).

## FAQ

**What is a good min_n for a random forest?**

For random forests on tabular data, a min_n range of 5 to 25 covers most well-tuned models. The classic Breiman defaults of 1 (classification) and 5 (regression) are baselines, not optima; tuning typically lands between 5 and 20 once dataset noise is accounted for. On large datasets (100k+ rows), candidates up to 50 or 100 become reasonable because deeper trees on richer data still generalize. Always pair min_n tuning with mtry tuning, as the two interact strongly.

**How does min_n() differ from min_child_weight in xgboost?**

`dials::min_n()` is the parameter object describing the search range for the minimum-node-size hyperparameter. `xgboost`'s `min_child_weight` is the engine-level setting that consumes a single numeric value at fit time and represents the minimum sum of instance hessians per child rather than a raw row count. tidymodels translates `min_n = tune()` in `boost_tree()` to repeated `min_child_weight = N` calls inside xgboost. The values are close but not identical when xgboost uses non-default loss weighting.

**Why does dials min_n() not need finalize() like mtry()?**

Because the upper end of a sensible node-size range does not depend on the training data shape. Even with millions of rows, min_n = 40 is rarely a binding constraint. dials therefore ships min_n() with a concrete default of `c(2L, 40L)`, which is finalized at construction and ready to feed into `grid_regular()` without further setup. mtry() differs because its upper bound is the number of predictors, which is dataset-dependent.

**Should I tune min_n() and tree_depth() together?**

Yes for boosted trees; usually no for random forests. In boosting, depth and min_n jointly cap each round's complexity, so tuning both helps the search find the right knob mix. In forests, min_n is load-bearing and tree_depth is usually redundant; tuning both burns budget on combinations that fit nearly identical trees. Tune min_n with mtry in forests, and min_n with tree_depth in boosted ensembles.
