---
title: "parsnip bag_tree() in R: Build Bagged Tree Models"
slug: parsnip-bag_tree-in-R
description: "Learn how parsnip bag_tree() defines bagged decision tree ensembles in R. Load the baguette engine, fit models, and read aggregated variable importance."
keywords: "parsnip bag_tree, bag_tree function R, parsnip bag_tree examples, bagged decision tree R, bag_tree tidymodels, baguette bag_tree"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "bag_tree()|parsnip bag_tree|parsnip::bag_tree()|bagged decision tree|tidymodels bagged trees"
auto_link_case_sensitive: true
target_keyword: parsnip bag_tree
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip bag_tree() in R: Build Bagged Tree Models

<p class="lead">The parsnip bag_tree() function defines a bagged decision tree model in R, an ensemble that fits many trees on bootstrap samples and averages them to cut variance.</p>

[QUICK ANSWER]
bag_tree()                                    # bare spec, mode unset
bag_tree(mode = "classification")             # set mode inline
bag_tree(tree_depth = 5)                      # cap how deep each tree grows
bag_tree(min_n = 10)                          # minimum rows to split a node
bag_tree(cost_complexity = 0.01)              # pruning penalty per tree
bag_tree() |> set_engine("rpart", times = 25) # 25 bootstrap trees
bag_tree() |> set_mode("regression")          # bagged regression trees

[DECISION TREE: Is bag_tree() the right tool?]
- bagged trees to cut variance: bag_tree() |> set_engine("rpart")
- one interpretable tree: decision_tree()
- many de-correlated trees: rand_forest()
- sequential boosted trees: boost_tree()
- bagged MARS instead of trees: bag_mars()
- straight-line numeric outcome: linear_reg()

## What bag_tree() does

**bag_tree() declares a bagged ensemble, it does not train one.** The function returns a model specification: an engine-agnostic description of a bagging model. Bagging, short for bootstrap aggregating, draws many resamples of your data, fits one tree per resample, and averages their predictions. No data touches the spec until you call `fit()`.

A single decision tree is unstable, because a small change in the training rows can reshuffle every split. Bagging fixes that. By averaging dozens of trees grown on different bootstrap samples, the ensemble keeps the flexibility of trees while smoothing out the noise that makes one tree erratic.

[KEY INSIGHT]
**Bagging trades readability for stability.** One decision tree gives you if-then rules you can follow by eye. A bagged ensemble gives you a more accurate prediction but no single readable tree, only aggregated variable importance. Reach for `bag_tree()` when you want a sturdier model than one tree and do not need the rule list.

## bag_tree() syntax and arguments

**bag_tree() needs the baguette package for its engine.** The constructor lives in parsnip, but the fitting backend is registered by the baguette extension package. Load both, or the fit will fail with an engine error.

| Argument | What it controls | Typical range |
|---|---|---|
| `tree_depth` | Maximum depth each tree can grow | 1 to 15 |
| `min_n` | Minimum data points needed to split a node | 2 to 40 |
| `cost_complexity` | Penalty that prunes weak splits per tree | 0 to 0.1 |
| `class_cost` | Cost of misclassifying the minority class | 1 to 10 |
| `times` | Number of bootstrap trees, set in `set_engine()` | 11 to 100 |

You build a spec by piping the constructor into `set_engine()` and `set_mode()`. The `times` argument is engine-specific, so it goes inside `set_engine()`.

```r title="Define a bagged tree spec"
library(parsnip)
library(baguette)

bag_spec <- bag_tree(tree_depth = 5, min_n = 10) |>
  set_engine("rpart", times = 25) |>
  set_mode("classification")

bag_spec
#> Bagged Decision Tree Model Specification (classification)
#>
#> Main Arguments:
#>   tree_depth = 5
#>   min_n = 10
#>
#> Engine-Specific Arguments:
#>   times = 25
#>
#> Computational engine: rpart
```

The printed spec lists your tree controls and the bootstrap count. Nothing is fitted yet, so this object stays cheap to copy and reuse.

## Fit a bagged tree: classification and regression

**The same spec fits classification and regression by switching the mode.** Pass a formula and a data frame to `fit()`, then call `predict()` on new rows. Here is a bagged classification ensemble on the built-in `iris` dataset.

```r title="Fit a bagged classification model"
bag_fit <- bag_spec |>
  fit(Species ~ ., data = iris)

predict(bag_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

The fitted object holds all 25 trees and predicts a tidy tibble. For a numeric target, rebuild the spec in regression mode and fit against `mtcars`.

```r title="Fit a bagged regression model"
reg_spec <- bag_tree() |>
  set_engine("rpart", times = 25) |>
  set_mode("regression")

reg_fit <- reg_spec |> fit(mpg ~ ., data = mtcars)
predict(reg_fit, mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.3
#> 2  21.1
#> 3  25.0
```

Regression bags return `.pred` instead of `.pred_class`. Each prediction is the average across the 25 bootstrap trees, which is why the numbers are smoother than a single tree would give.

## Read aggregated variable importance

**baguette aggregates variable importance across every tree.** Because no single tree is readable, the fitted object stores a combined importance table. Pull it from the engine fit to see which predictors drive the ensemble.

```r title="Read aggregated variable importance"
bag_fit$fit$imp
#> # A tibble: 4 x 4
#>   term          value std.error  used
#>   <chr>         <dbl>     <dbl> <int>
#> 1 Petal.Width    55.8      2.14    25
#> 2 Petal.Length   54.1      2.31    25
#> 3 Sepal.Length   18.7      1.62    25
#> 4 Sepal.Width    11.2      1.05    25
```

The `value` column ranks predictors, and `std.error` shows how stable that ranking is across resamples. A low standard error means the ensemble agrees on that variable's role.

[TIP]
**Use importance to prune predictors.** Variables with near-zero `value` and a large `std.error` contribute little. Dropping them often keeps accuracy while speeding up every future fit.

## bag_tree() vs decision_tree() vs rand_forest()

**All three are tree models, but they manage variance differently.** A single tree is the simplest and the most readable. A bagged ensemble averages many trees. A random forest adds random feature selection on top of bagging.

| Model | How it builds trees | Variance | Interpretability |
|---|---|---|---|
| `decision_tree()` | One tree on the full data | High | Reads as if-then rules |
| `bag_tree()` | Many trees on bootstrap samples, averaged | Low | Aggregated importance only |
| `rand_forest()` | Bagged trees plus random predictor subsets | Lowest | Aggregated importance only |

The decision rule is short. Use `decision_tree()` when you must explain the model as rules. Use `bag_tree()` when you want a stabler version of trees. Use `rand_forest()` when you also want the trees de-correlated for the best accuracy.

[NOTE]
**A random forest is bagging plus one extra step.** Both resample the rows, but `rand_forest()` also samples a random subset of predictors at each split. That extra randomness usually beats plain bagging, so try it once `bag_tree()` works.

## Common pitfalls

**Most bag_tree() errors trace back to the missing baguette package.** The constructor is in parsnip, but the engine is not. Calling `fit()` without `library(baguette)` raises an engine error.

```r title="Fitting without baguette loaded fails"
library(parsnip)

bag_tree() |>
  set_engine("rpart") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
#> Error: parsnip could not locate an implementation for `bag_tree`
#> classification model specifications using the `rpart` engine.
#> The parsnip extension package baguette implements support for
#> this specification. Please install (if needed) and load.
```

Load baguette and the fit succeeds. Two more traps to watch:

- Setting `times` too low gives an unstable ensemble. Fewer than 11 trees barely beats one tree, so keep `times` at 25 or more.
- A regression target stored as a factor throws a type error. Convert it with `as.numeric()` before fitting.

[WARNING]
**Bagging does not fix a biased tree.** It only cuts variance. If every tree underfits because `tree_depth` is set very low, averaging them keeps the same bias. Let each tree grow reasonably deep, then let bagging smooth the noise.

## Try it yourself

**Try it:** Build a bagged regression model with 25 trees, fit it to predict `hp` from all columns of `mtcars`, and save the fitted model to `ex_bag_fit`.

```r title="Your turn: fit a bagged regression model"
# Try it: build and fit a bagged regression model
ex_bag_fit <- # your code here

ex_bag_fit
#> Expected: a parsnip bagged model fit object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bag_fit <- bag_tree() |>
  set_engine("rpart", times = 25) |>
  set_mode("regression") |>
  fit(hp ~ ., data = mtcars)

class(ex_bag_fit)
#> [1] "_bagger"  "model_fit"
```

**Explanation:** The spec sets the mode, `set_engine("rpart", times = 25)` picks the backend and the bootstrap count, and `fit()` trains all 25 trees on `mtcars`. The result is a parsnip `model_fit` wrapping a baguette `bagger` object.

</details>

## Related parsnip functions

**bag_tree() is one model in a family of parsnip specifications.** When a bagged tree is not the right fit, these neighbors share the same `set_engine()` and `fit()` workflow:

- `decision_tree()` builds one interpretable tree.
- `rand_forest()` adds random feature selection to bagging.
- `boost_tree()` builds trees sequentially for higher accuracy.
- `bag_mars()` bags MARS models instead of trees.
- `set_engine()` chooses the computational backend for any spec.

See the [tidymodels bag_tree reference](https://parsnip.tidymodels.org/reference/bag_tree.html) for the full list of supported engines.

## FAQ

**What package provides bag_tree() in R?**
The `bag_tree()` constructor is exported by the parsnip package, but its fitting engines are registered by the baguette package. You need both loaded: parsnip defines the model spec, and baguette implements the `rpart` and `C5.0` bagging backends. Loading `library(tidymodels)` plus `library(baguette)` covers every case, since baguette is not part of the core tidymodels attach list.

**How is bag_tree() different from rand_forest()?**
Both fit many trees on bootstrap resamples of the data and average them. The difference is feature sampling. `rand_forest()` also picks a random subset of predictors at each split, which de-correlates the trees and usually improves accuracy. `bag_tree()` uses every predictor at every split, so its trees look more alike. Bagging is the simpler baseline; a random forest is the tuned upgrade.

**How many trees should I set with times?**
The `times` argument controls how many bootstrap trees the ensemble fits. Values below 11 barely beat a single tree, because there are too few trees to average out noise. A setting of 25 to 50 is a solid default for most datasets. Going past 100 rarely improves accuracy and just costs more fitting time, so stop once the validation score flattens.

**Can bag_tree() report variable importance?**
Yes. baguette aggregates importance scores across every tree in the ensemble and stores them in the fitted object. Access the table with `your_fit$fit$imp`, which lists each predictor's mean importance `value` and a `std.error` showing how consistent that score is. This aggregated table is the closest a bagged model gets to the readable rule list of a single decision tree.
