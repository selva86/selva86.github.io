---
title: "parsnip nearest_neighbor() in R: Specify a KNN Model"
slug: parsnip-nearest_neighbor-in-R
description: "parsnip nearest_neighbor() in R defines a K-nearest neighbor model for tidymodels. Covers syntax, the kknn engine, neighbors, weight_func, and dist_power."
keywords: "parsnip nearest_neighbor, nearest_neighbor function R, parsnip nearest_neighbor examples, knn tidymodels R, nearest_neighbor kknn engine, tidymodels knn model"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "nearest_neighbor()|parsnip nearest_neighbor|parsnip::nearest_neighbor()|knn in R|tidymodels knn"
auto_link_case_sensitive: true
target_keyword: "parsnip nearest_neighbor"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip nearest_neighbor() in R: Specify a KNN Model

<p class="lead">The parsnip <code>nearest_neighbor()</code> function defines a K-nearest neighbor (KNN) model for classification or regression in tidymodels. It gives you one interface that predicts each new point from its closest labeled neighbors, fitted with the kknn engine underneath.</p>

[QUICK ANSWER]
nearest_neighbor()                                # default spec, kknn engine
nearest_neighbor() |> set_mode("classification")  # classify a factor outcome
nearest_neighbor() |> set_mode("regression")      # predict a numeric outcome
nearest_neighbor(neighbors = 5)                   # set K, the neighbor count
nearest_neighbor(weight_func = "triangular")      # distance-weighted voting
nearest_neighbor(dist_power = 1)                  # Manhattan distance metric
fit(spec, Species ~ ., data = iris)               # train on a dataset

[DECISION TREE: Is nearest_neighbor() the right tool?]
- classify by closest labeled points: nearest_neighbor() |> set_mode("classification")
- predict a number from neighbors: nearest_neighbor() |> set_mode("regression")
- a tree-based ensemble instead: rand_forest() |> set_engine("ranger")
- a linear decision boundary: logistic_reg() |> set_engine("glm")
- gradient-boosted trees: boost_tree() |> set_engine("xgboost")
- tune the neighbor count K: tune_grid() with nearest_neighbor(neighbors = tune())

## What nearest_neighbor() does

**nearest_neighbor() is a model specification, not a fitted model.** It records your intent to build a KNN model and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A K-nearest neighbor model makes no assumptions about the shape of the data. To predict a new point, it finds the K training rows closest to it in feature space, then takes a majority vote for classification or an average for regression. There is no training phase in the usual sense, so KNN is called a lazy learner.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `nearest_neighbor()` code drops straight into a `workflow()` or `tune_grid()` call.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**nearest_neighbor() ships in core parsnip, but the engine does not.** The only engine is `kknn`, which needs the `kknn` package installed before you fit. Install it once with `install.packages("kknn")`, or `fit()` reports that the engine is not available.

## nearest_neighbor() syntax and arguments

**nearest_neighbor() takes three hyperparameters and two setup verbs.** The arguments control how neighbors are counted and weighted, while `set_engine()` and `set_mode()` finish the specification.

```r title="The nearest_neighbor specification skeleton"
library(tidymodels)

nearest_neighbor(
  mode = "unknown",     # set to "classification" or "regression"
  engine = "kknn",      # kknn is the only engine
  neighbors = NULL,     # K, the number of neighbors to poll
  weight_func = NULL,   # how to weight neighbors by distance
  dist_power = NULL     # Minkowski power: 1 = Manhattan, 2 = Euclidean
)
```

The `neighbors` argument sets K, the number of nearest points each prediction polls, where small K tracks local detail and large K smooths the boundary. The `weight_func` argument names a kernel that weights closer neighbors more heavily, such as `"rectangular"` for an unweighted vote or `"triangular"` for distance-weighted voting. The `dist_power` argument sets the Minkowski distance exponent, where `1` gives Manhattan distance and `2` gives Euclidean distance.

**The mode is never "unknown" at fit time.** A KNN model can predict a class or a number, so you must call `set_mode("classification")` or `set_mode("regression")` before fitting. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a KNN model: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify with the default kknn engine

**Build the specification, then fit it to data.** The kknn engine polls the five closest flowers and votes on the species.

```r title="Fit nearest_neighbor on the iris data"
knn_spec <- nearest_neighbor(neighbors = 5) |>
  set_engine("kknn") |>
  set_mode("classification")

knn_fit <- knn_spec |>
  fit(Species ~ ., data = iris)

knn_fit
#> parsnip model object
#>
#> Type of response variable: nominal
#> Minimal misclassification: 0.04
#> Best kernel: optimal
#> Best k: 5
```

The reported misclassification of 0.04 is a leave-one-out estimate the kknn engine computes while fitting. It means the model labels roughly 96% of iris flowers correctly when each row is predicted from the others.

### Example 2: Predict classes and probabilities

**predict() returns a tidy tibble with one row per input row.** Use `type = "prob"` to get per-class probabilities instead of the hard label.

```r title="Predict iris species and class probabilities"
sample_rows <- iris[c(1, 70, 130), ]

predict(knn_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica

predict(knn_fit, new_data = sample_rows, type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        1.00             0               0
#> 2        0                0.98            0.02
#> 3        0                0.01            0.99
```

The probability columns are named `.pred_<class>` and each row sums to one. They come from the weighted share of neighbors voting for each class, useful for ranking or a custom decision threshold.

### Example 3: Fit a KNN regression model on mtcars

**Switch the mode to "regression" and the same function predicts a number.** Nothing else about the call changes.

```r title="Fit a KNN regression model on mtcars"
knn_reg <- nearest_neighbor(neighbors = 5) |>
  set_engine("kknn") |>
  set_mode("regression")

knn_reg_fit <- knn_reg |>
  fit(mpg ~ ., data = mtcars)

predict(knn_reg_fit, new_data = mtcars[c(1, 15, 30), ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  20.4
#> 2  12.8
#> 3  18.1
```

A regression KNN averages the `mpg` of the five closest cars instead of voting. The single `.pred` column holds those averaged predictions, one per input row.

[TIP]
**Tune K with cross-validation rather than guessing.** The best `neighbors` value depends on the dataset, so set `neighbors = tune()` and let `tune_grid()` score a range of values on resamples. A common starting grid is the odd numbers from 3 to 25.

### Example 4: Weight neighbors by distance

**Pass weight_func to make closer neighbors count more.** The default `"rectangular"` kernel weights every neighbor equally, while `"triangular"` fades the weight with distance.

```r title="Fit a distance-weighted KNN model"
knn_weighted <- nearest_neighbor(
    neighbors = 10,
    weight_func = "triangular"
  ) |>
  set_engine("kknn") |>
  set_mode("classification")

knn_weighted_fit <- knn_weighted |>
  fit(Species ~ ., data = iris)

predict(knn_weighted_fit, new_data = iris[c(71, 84), ])
#> # A tibble: 2 x 1
#>   .pred_class
#>   <fct>
#> 1 versicolor
#> 2 versicolor
```

Distance weighting helps most when K is large. With a weighted kernel you can raise `neighbors` for stability without letting distant points blur the boundary.

## Compare nearest_neighbor() weight functions

**The weight_func argument changes how neighbor votes are combined.** All kernels run on the same kknn engine, so you swap them with one argument and keep the rest of the specification.

| weight_func | Voting behavior | Use when |
|---|---|---|
| `rectangular` | Every neighbor counts equally | You want plain, classic KNN |
| `triangular` | Weight fades linearly with distance | K is large and you want smoothing |
| `epanechnikov` | Smooth quadratic distance decay | A balanced default for weighting |
| `gaussian` | Weight decays on a bell curve | Distant neighbors should still count a little |
| `inv` | Weight is the inverse of distance | Very close neighbors should dominate |

The decision rule is simple. Start with `rectangular` for an interpretable baseline, switch to `triangular` or `epanechnikov` when a large K needs smoothing, and tune `weight_func` when accuracy matters most.

## Common pitfalls

**Three mistakes catch most newcomers to nearest_neighbor().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A KNN model can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
nearest_neighbor(neighbors = 5) |>
  set_engine("kknn") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
nearest_neighbor(neighbors = 5) |>
  set_engine("kknn") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is leaving predictors on different scales, since KNN measures distance and a wide-range column dominates the neighbor search. The kknn engine standardizes predictors by default, but a recipe-based workflow should still add `step_normalize()`. The third is setting `neighbors` too high, since a K near the row count washes out every local pattern.

[WARNING]
**An even K can produce tie votes in binary classification.** With `neighbors = 4` and two classes, a 2-2 split has no clear winner and the engine must break the tie arbitrarily. Prefer odd values of `neighbors` so a majority class always exists.

## Try it yourself

**Try it:** Fit a classification KNN model on `iris` with 7 neighbors, then predict the class for the 120th row. Save the prediction to `ex_pred`.

```r title="Your turn: classify iris with nearest_neighbor"
# Try it: fit a 7-neighbor KNN model, then predict row 120
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred_class = virginica
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- nearest_neighbor(neighbors = 7) |>
  set_engine("kknn") |>
  set_mode("classification")

ex_fit <- ex_spec |>
  fit(Species ~ ., data = iris)

ex_pred <- predict(ex_fit, new_data = iris[120, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred_class
#>   <fct>
#> 1 virginica
```

**Explanation:** The `neighbors` argument sets K to 7, and `set_mode("classification")` tells parsnip to predict the `Species` factor. Row 120 of iris is a virginica flower, so the seven closest neighbors vote that class.

</details>

## Related parsnip functions

**nearest_neighbor() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `rand_forest()` defines a random forest ensemble of decision trees.
- `decision_tree()` defines a single classification or regression tree.
- `logistic_reg()` defines a logistic regression classifier.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is nearest_neighbor() in?**

`nearest_neighbor()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function itself only describes the model, though, and the actual fitting happens in an engine package. The single supported engine is `kknn`, so you must install the `kknn` package before you call `fit()` on a KNN specification.

**What is the default engine for nearest_neighbor()?**

The default and only engine is `kknn`, which implements weighted K-nearest neighbors in R. Name it explicitly with `set_engine("kknn")` for clarity, and `show_engines("nearest_neighbor")` confirms it is the lone registered option. Because there is one engine, swapping backends is never a concern here.

**How do I choose the number of neighbors in nearest_neighbor()?**

Treat `neighbors` as a hyperparameter to tune. A small K like 3 captures local detail but reacts to noise, while a large K smooths the boundary and can underfit. Set `neighbors = tune()`, pass it to `tune_grid()` with a resampling object such as `vfold_cv()`, and let cross-validation pick the best value.

**Does nearest_neighbor() scale the predictors automatically?**

The kknn engine standardizes predictors by default before measuring distance, so raw `iris` or `mtcars` columns work without manual scaling. In a `workflow()` built from a recipe, it is still good practice to add `step_normalize()` so the preprocessing is explicit and portable. Scaling matters because KNN distance is dominated by whichever column has the widest range.

**How do I tune neighbors and weight_func together?**

Set both arguments to `tune()`, as in `nearest_neighbor(neighbors = tune(), weight_func = tune())`, then pass the specification to `tune_grid()` with a grid and a resampling object. The framework searches every combination and scores each with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

For the full argument reference, see the [parsnip nearest_neighbor() documentation](https://parsnip.tidymodels.org/reference/nearest_neighbor.html).
