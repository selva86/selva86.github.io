---
title: "parsnip rand_forest() in R: Specify Random Forest Models"
slug: parsnip-rand_forest-in-R
description: "parsnip rand_forest() in R defines random forest models for tidymodels. Covers syntax, the ranger and randomForest engines, classification, and regression."
keywords: "parsnip rand_forest, rand_forest function R, parsnip rand_forest examples, random forest tidymodels R, rand_forest ranger engine, tidymodels random forest"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "rand_forest()|parsnip rand_forest|parsnip::rand_forest()|random forest in R|tidymodels random forest"
auto_link_case_sensitive: true
target_keyword: "parsnip rand_forest"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip rand_forest() in R: Specify Random Forest Models

<p class="lead">The parsnip <code>rand_forest()</code> function defines a random forest model, an ensemble of many decision trees, for classification or regression in tidymodels. It gives you one interface that fits with the ranger, randomForest, or h2o engine underneath.</p>

[QUICK ANSWER]
rand_forest()                                  # default spec, ranger engine
rand_forest() |> set_mode("classification")    # classify a factor outcome
rand_forest() |> set_mode("regression")        # predict a numeric outcome
rand_forest(trees = 1000)                      # set the number of trees
rand_forest(mtry = 3, min_n = 5)               # set split count and leaf size
rand_forest() |> set_engine("randomForest")    # swap the backend engine
fit(spec, Species ~ ., data = iris)            # train on a dataset

[DECISION TREE: Is rand_forest() the right tool?]
- bagged trees with random splits: rand_forest() |> set_engine("ranger")
- one interpretable tree: decision_tree() |> set_engine("rpart")
- gradient-boosted trees: boost_tree() |> set_engine("xgboost")
- a plain linear model: linear_reg() |> set_engine("lm")
- bagged trees, no feature sampling: bag_tree() |> set_engine("rpart")
- tune mtry and min_n by grid: tune_grid() with rand_forest()

## What rand_forest() does

**rand_forest() is a model specification, not a fitted model.** It records your intent to build a random forest and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A random forest grows hundreds of decision trees on bootstrap samples of the data, and at each split it considers only a random subset of predictors. Predictions average the trees for regression or take a majority vote for classification. The randomness decorrelates the trees, which lowers variance and usually beats a single tree.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `rand_forest()` code runs on the fast ranger engine or the classic randomForest engine with only one line changed.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**rand_forest() ships in core parsnip, but the engines do not.** The default `ranger` engine needs the `ranger` package installed, and `set_engine("randomForest")` needs the `randomForest` package. Install the engine package before you fit, or R reports that the engine is not available.

## rand_forest() syntax and arguments

**rand_forest() takes three hyperparameters and two setup verbs.** The arguments control how each tree is grown, while `set_engine()` and `set_mode()` finish the specification.

```r title="The rand_forest specification skeleton"
library(tidymodels)

rand_forest(
  mode = "unknown",   # set to "classification" or "regression"
  engine = "ranger",  # ranger (default), randomForest, h2o, aorsf, spark
  mtry = NULL,        # predictors sampled at each split
  trees = NULL,       # number of trees in the forest
  min_n = NULL        # minimum rows in a node before a split
)
```

The `mtry` argument sets how many predictors are sampled as split candidates at each node, the main source of forest randomness. The `trees` argument sets the number of trees, where more trees stabilize predictions at a higher compute cost. The `min_n` argument sets the smallest node size allowed before a split, which controls how deep each tree grows.

**The mode is never "unknown" at fit time.** A random forest can predict a class or a number, so you must call `set_mode("classification")` or `set_mode("regression")` before fitting. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a random forest: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify with the default ranger engine

**Build the specification, then fit it to data.** The ranger engine grows the forest quickly and is the parsnip default.

```r title="Fit rand_forest on the iris data"
rf_spec <- rand_forest(trees = 500) |>
  set_engine("ranger") |>
  set_mode("classification")

rf_fit <- rf_spec |>
  fit(Species ~ ., data = iris)

rf_fit
#> parsnip model object
#>
#> Ranger result
#>
#> Type:                             Classification
#> Number of trees:                  500
#> Sample size:                      150
#> Number of independent variables:  4
#> Mtry:                             2
#> Target node size:                 1
#> OOB prediction error:             4.00 %
```

The out-of-bag (OOB) error estimates accuracy on rows each tree never saw during training, so it works like built-in cross-validation. Here an OOB error of 4% means the forest classifies roughly 96% of iris flowers correctly.

### Example 2: Predict classes and probabilities

**predict() returns a tidy tibble with one row per input row.** Use `type = "prob"` to get per-class probabilities instead of the hard label.

```r title="Predict iris species and class probabilities"
sample_rows <- iris[c(1, 70, 130), ]

predict(rf_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica

predict(rf_fit, new_data = sample_rows, type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        1.00             0               0
#> 2        0                0.97            0.03
#> 3        0                0.02            0.98
```

The probability columns are named `.pred_<class>` and each row sums to one. Probabilities are the share of trees that voted for each class, which makes them useful for ranking or for a custom decision threshold.

### Example 3: Fit a regression forest on mtcars

**Switch the mode to "regression" and the same function predicts a number.** Nothing else about the call changes.

```r title="Fit a regression forest on mtcars"
rf_reg <- rand_forest(trees = 500, min_n = 5) |>
  set_engine("ranger") |>
  set_mode("regression")

rf_reg_fit <- rf_reg |>
  fit(mpg ~ ., data = mtcars)

rf_reg_fit
#> parsnip model object
#>
#> Ranger result
#>
#> Type:                             Regression
#> Number of trees:                  500
#> Sample size:                      32
#> Number of independent variables:  10
#> Mtry:                             3
#> OOB prediction error (MSE):       5.83
#> R squared (OOB):                  0.834
```

The regression forest reports mean squared error and an OOB R-squared instead of a classification error rate. An R-squared of 0.83 means the forest explains most of the variation in fuel economy.

[TIP]
**Set a seed before fitting when you need repeatable results.** A random forest draws bootstrap samples and random split candidates, so two fits differ slightly unless you call `set.seed()` first. Seeding also makes OOB error and importance scores stable across runs.

### Example 4: Rank predictors by importance

**Pass engine-specific arguments through set_engine() to unlock variable importance.** The ranger engine computes importance only when you ask for it.

```r title="Rank iris predictors by importance"
rf_imp <- rand_forest(trees = 500) |>
  set_engine("ranger", importance = "impurity") |>
  set_mode("classification")

imp_fit <- rf_imp |>
  fit(Species ~ ., data = iris)

sort(imp_fit$fit$variable.importance, decreasing = TRUE)
#>  Petal.Width Petal.Length Sepal.Length  Sepal.Width
#>         43.9         43.1          9.4          2.3
```

Petal width and petal length dominate, which matches the known biology of the iris dataset. The `importance = "impurity"` value passes straight through `set_engine()` to `ranger::ranger()` without parsnip needing its own argument.

## Compare rand_forest() engines

**rand_forest() runs on several engines that share the same code.** You swap engines with one `set_engine()` call, and parsnip translates `mtry`, `trees`, and `min_n` to each backend.

| Engine | Package | Strengths | Use when |
|---|---|---|---|
| `ranger` | ranger | Fast, parallel, default | Almost always; the standard choice |
| `randomForest` | randomForest | Classic Breiman implementation | You need results matching older code |
| `aorsf` | aorsf | Oblique splits on linear combinations | Predictors interact strongly |
| `h2o` | h2o, agua | Scales beyond memory | Data is too large for one machine |
| `partykit` | partykit | Unbiased conditional inference trees | Predictors differ in scale or type |

The decision rule is simple. Use `ranger` unless you have a specific reason not to, switch to `randomForest` for parity with legacy scripts, and reach for `h2o` only when the data outgrows local memory.

## Common pitfalls

**Three mistakes catch most newcomers to rand_forest().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A random forest can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
rand_forest(trees = 500) |>
  set_engine("ranger") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
rand_forest(trees = 500) |>
  set_engine("ranger") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is an `mtry` larger than the predictor count. If you set `mtry = 10` on the four-column iris data, the ranger engine stops with an error because it cannot sample more predictors than exist. The third is expecting identical results without a seed, since the forest is random by design.

[WARNING]
**An mtry value above the number of predictors errors at fit time.** The ranger engine reports `mtry can not be larger than number of variables in data`. Either lower `mtry` or set `mtry = tune()` and let `tune_grid()` search only valid values for your dataset.

## Try it yourself

**Try it:** Fit a classification forest on `iris` with 300 trees and `min_n = 10`, then predict the class for the 100th row. Save the prediction to `ex_pred`.

```r title="Your turn: classify iris with rand_forest"
# Try it: fit a 300-tree forest, then predict row 100
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred_class = versicolor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- rand_forest(trees = 300, min_n = 10) |>
  set_engine("ranger") |>
  set_mode("classification")

ex_fit <- ex_spec |>
  fit(Species ~ ., data = iris)

ex_pred <- predict(ex_fit, new_data = iris[100, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred_class
#>   <fct>
#> 1 versicolor
```

**Explanation:** The `trees` and `min_n` arguments tune the forest, while `set_mode("classification")` tells parsnip to predict the `Species` factor. Row 100 of iris is a versicolor flower, so the trained forest votes that class.

</details>

## Related parsnip functions

**rand_forest() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `decision_tree()` defines a single classification or regression tree.
- `boost_tree()` defines a gradient-boosted tree ensemble such as xgboost.
- `bag_tree()` defines a bagged tree ensemble without feature sampling.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is rand_forest() in?**

`rand_forest()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function itself only describes the model, though, and the actual fitting happens in an engine package. The default `ranger` engine needs the `ranger` package, and `set_engine("randomForest")` needs the `randomForest` package installed separately.

**What is the difference between rand_forest() and randomForest()?**

`rand_forest()` is the parsnip specification, a model-agnostic description of a random forest. `randomForest()` is one concrete engine that actually fits the model. When you call `set_engine("randomForest")`, parsnip translates your `mtry`, `trees`, and `min_n` settings into a `randomForest()` call. The parsnip layer lets you switch to ranger or h2o without rewriting code.

**What engine does rand_forest() use by default?**

The default engine is `ranger`, a fast C++ implementation that supports parallel tree growing. You can confirm or change it with `set_engine()`, and `show_engines("rand_forest")` lists every registered option. Most projects keep ranger because it is quick and well maintained, switching only for legacy parity or out-of-memory scaling.

**How do I tune mtry and trees in rand_forest()?**

Set the arguments to `tune()`, as in `rand_forest(mtry = tune(), min_n = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework searches a grid of values and scores each with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

**How do I get variable importance from rand_forest()?**

Importance is an engine argument, not a parsnip one. For the ranger engine, add `importance = "impurity"` or `importance = "permutation"` inside `set_engine()`, then read the scores from `fit$fit$variable.importance`. The `vip` package turns those scores into a ranked plot directly from the parsnip fit object.

For the full argument reference, see the [parsnip rand_forest() documentation](https://parsnip.tidymodels.org/reference/rand_forest.html).
