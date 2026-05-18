---
title: "parsnip mars() in R: Adaptive Regression Splines"
slug: parsnip-mars-in-R
description: "parsnip mars() in R defines a multivariate adaptive regression splines model for tidymodels. Covers syntax, the earth engine, num_terms, and four examples."
keywords: "parsnip mars, mars function R, parsnip mars examples, MARS model R tidymodels, multivariate adaptive regression splines R, mars earth engine"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "mars()|parsnip mars|parsnip::mars()|MARS model in R|multivariate adaptive regression splines"
auto_link_case_sensitive: true
target_keyword: "parsnip mars"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip mars() in R: Adaptive Regression Splines

<p class="lead">The parsnip <code>mars()</code> function defines a multivariate adaptive regression splines model for tidymodels. It gives you one interface for a model that fits non-linear relationships automatically, by stitching together hinged line segments through the earth engine.</p>

[QUICK ANSWER]
mars()                                  # default spec, earth engine
mars() |> set_mode("regression")        # predict a numeric outcome
mars() |> set_mode("classification")    # classify a factor outcome
mars(num_terms = 10)                    # cap the number of model terms
mars(prod_degree = 2)                   # allow pairwise interactions
mars(prune_method = "backward")         # choose the pruning algorithm
fit(spec, mpg ~ ., data = mtcars)       # train on a dataset

[DECISION TREE: Is mars() the right tool?]
- non-linear fit with automatic hinges: mars() |> set_engine("earth")
- straight-line additive model: linear_reg() |> set_engine("lm")
- axis-aligned splits and rules: decision_tree() |> set_engine("rpart")
- many trees averaged: rand_forest() |> set_engine("ranger")
- smooth kernel boundary: svm_rbf() |> set_engine("kernlab")
- tune num_terms by grid: tune_grid() with mars()

## What mars() does

**mars() is a model specification, not a fitted model.** It records your choice of a multivariate adaptive regression splines model and its hyperparameters, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A MARS model captures curves and interactions without you naming them. It builds hinge functions, paired line segments of the form `max(0, x - knot)` and `max(0, knot - x)`, then chooses knots in a forward pass and trims weak terms in a backward pruning pass. The result is a piecewise linear surface that bends where the data bends.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, `mars()` shares the same `fit()` and `predict()` verbs used by every other parsnip model.

[KEY INSIGHT]
**Hinge functions are what let MARS bend.** A plain linear model forces one slope across the whole range of a predictor. MARS instead places knots where the slope should change and joins straight segments there, so it can model a flat region followed by a steep one. The forward pass adds these hinges greedily, and the backward pass prunes the ones that do not earn their keep.

## mars() syntax and arguments

**mars() takes three hyperparameters and two setup verbs.** The arguments shape how many spline terms the model keeps, while `set_engine()` and `set_mode()` finish the specification.

```r title="The mars specification skeleton"
library(tidymodels)

mars(
  mode = "unknown",       # set to "regression" or "classification"
  engine = "earth",       # earth is the only standard engine
  num_terms = NULL,       # maximum number of model terms to keep
  prod_degree = NULL,     # highest interaction degree (1 = additive)
  prune_method = NULL     # how earth prunes terms in the backward pass
)
```

The `num_terms` argument caps how many hinge terms survive pruning, so a smaller value gives a simpler model. The `prod_degree` argument controls interactions: `1` keeps the model additive, while `2` lets two predictors combine in a single term. The `prune_method` argument names the backward-pass algorithm, with `"backward"` as the earth default.

[NOTE]
**mars() ships in core parsnip, but its engine does not.** The standard engine is `earth`, so you need the `earth` package installed before you fit. Install it first, or R reports that the engine is not available. When `num_terms` and `prod_degree` are left `NULL`, earth picks sensible values from the data and its own defaults.

## Fit a MARS model: four examples

**Every example below uses a built-in R dataset.** The `mtcars` data drives the regression examples and `iris` drives the classification example, so the code runs anywhere with no downloads.

### Example 1: Fit a regression MARS on mtcars

**Build the specification, then fit it to data.** Leaving the hyperparameters unset lets earth choose the number of terms and the knots.

```r title="Fit mars on the mtcars data"
mars_spec <- mars() |>
  set_engine("earth") |>
  set_mode("regression")

mars_fit <- mars_spec |>
  fit(mpg ~ ., data = mtcars)

preds <- predict(mars_fit, new_data = mtcars)
cor(preds$.pred, mtcars$mpg)^2
#> [1] 0.886
```

Squaring the correlation between predicted and actual `mpg` gives a training R-squared near 0.89. MARS found the knots where fuel economy changes pace, mostly along weight and horsepower.

### Example 2: Predict mpg for new rows

**predict() returns a tidy tibble with one row per input row.** Each prediction comes from the piecewise linear surface MARS built.

```r title="Predict mpg for new rows"
sample_rows <- mtcars[c(1, 15, 30), ]

predict(mars_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.8
#> 2  11.5
#> 3  19.6
```

The `.pred` column holds the predicted miles per gallon as a number. The output keeps the same row order as the input, so you can bind it back to `sample_rows` with `bind_cols()`.

### Example 3: Allow interactions with prod_degree

**Set prod_degree to 2 and MARS may combine two predictors in one term.** An additive model misses effects that only appear when variables move together.

```r title="Allow pairwise interactions with prod_degree"
mars_int <- mars(prod_degree = 2) |>
  set_engine("earth") |>
  set_mode("regression")

mars_int_fit <- mars_int |>
  fit(mpg ~ ., data = mtcars)

predict(mars_int_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.3
#> 2  21.1
#> 3  26.0
```

With `prod_degree = 2`, earth can build a hinge on weight that also depends on horsepower. Keep this value low to avoid overfitting.

### Example 4: Classify iris species with mars

**Switch the mode to "classification" and the same function predicts a factor.** earth fits one MARS surface per class and picks the highest score.

```r title="Classify iris species with mars"
mars_cls <- mars() |>
  set_engine("earth") |>
  set_mode("classification")

mars_cls_fit <- mars_cls |>
  fit(Species ~ ., data = iris)

cls_preds <- predict(mars_cls_fit, new_data = iris)
mean(cls_preds$.pred_class == iris$Species)
#> [1] 0.973
```

Comparing the predicted labels to the true species gives a training accuracy near 97%. The hinge functions bend the class boundary where petal measurements separate versicolor from virginica.

[TIP]
**Reach for prod_degree before you reach for a bigger model.** If a MARS fit underperforms, raising `prod_degree` from 1 to 2 often recovers more signal than switching algorithms. It lets the model express interactions it could not see as a purely additive surface, at a small and controllable cost in complexity.

## mars() vs linear_reg() vs decision_tree()

**parsnip ships several ways to fit a non-linear or linear surface.** They share the same verbs, so swapping between them is a one-line change.

| Function | Shape it fits | Handles interactions | Use when |
|---|---|---|---|
| `linear_reg()` | One straight slope per predictor | Only if you add terms by hand | The relationship is close to linear |
| `mars()` | Piecewise linear hinges | Automatically, via `prod_degree` | Curves and interactions are unknown |
| `decision_tree()` | Axis-aligned step regions | Automatically, through splits | The surface has sharp jumps |

Start with `linear_reg()` when a straight line is plausible, reach for `mars()` when the relationship curves but stays smooth, and use `decision_tree()` when the response jumps in steps.

## Common pitfalls

**Three mistakes catch most newcomers to mars().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A MARS model can predict a number or a class, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
mars() |>
  set_engine("earth") |>
  fit(mpg ~ ., data = mtcars)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
mars() |>
  set_engine("earth") |>
  set_mode("regression") |>
  fit(mpg ~ ., data = mtcars)
```

The second pitfall is pushing `prod_degree` too high. A degree of 3 or more lets the model build deep interactions that memorize noise instead of signal. The third is treating `num_terms` as a target rather than a cap, since earth still prunes below it whenever the extra terms do not help.

[WARNING]
**A large prod_degree overfits fast.** Each step up multiplies the number of candidate hinge terms, giving the model room to fit random wiggles in the training data. Leave `prod_degree` at `1` or `2` for most problems, and tune it across resampling folds rather than trusting training accuracy.

## Try it yourself

**Try it:** Fit an additive regression MARS on `mtcars` with `prod_degree = 1`, then predict `mpg` for the first row. Save the prediction to `ex_pred`.

```r title="Your turn: additive MARS on mtcars"
# Try it: fit a prod_degree = 1 regression MARS, then predict row 1
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with one .pred value near 22
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- mars(prod_degree = 1) |>
  set_engine("earth") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(mpg ~ ., data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[1, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  21.8
```

**Explanation:** Setting `prod_degree = 1` keeps the model additive, so each predictor contributes its own hinge terms with no cross-products. Row 1 of mtcars is the Mazda RX4, whose true mpg is 21, so the MARS surface lands close.

</details>

## Related parsnip functions

**mars() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `linear_reg()` defines a linear regression model with one slope per predictor.
- `decision_tree()` defines a single tree of axis-aligned splits.
- `bag_mars()` defines a bagged ensemble of MARS models for steadier predictions.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is mars() in?**

`mars()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function only describes the model; the actual fitting happens in an engine package. The standard registered engine is `earth`, which implements the MARS algorithm, so install the `earth` package separately before you call `fit()`.

**What is the difference between mars() and linear_reg()?**

`linear_reg()` fits one straight slope for each predictor across its whole range. `mars()` places knots where the slope should change and joins straight segments at those knots, so it can model curves that a linear model cannot. MARS also adds interactions on its own when `prod_degree` is above 1. Choose `linear_reg()` when a straight line is plausible and `mars()` when the relationship clearly bends.

**What does prod_degree control in mars()?**

The `prod_degree` argument sets the highest interaction degree the model may build. A value of `1` keeps the model additive, so each term involves a single predictor. A value of `2` lets earth multiply two hinge functions, capturing effects that appear only when two variables move together. Higher values are rarely worth the overfitting risk, so `1` and `2` cover almost every practical case.

**Does mars() work for classification?**

Yes. Call `set_mode("classification")` and the earth engine fits a MARS surface for each class, then predicts the class with the highest score. `predict()` returns a `.pred_class` column, and `predict(fit, type = "prob")` returns one `.pred_<class>` probability column per class. MARS classification works best when the class boundary curves smoothly rather than jumping in steps.

**How do I tune mars() hyperparameters?**

Mark the arguments with `tune()`, as in `mars(num_terms = tune(), prod_degree = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework scores a grid of term counts and interaction degrees with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

For the full argument reference, see the [parsnip mars() documentation](https://parsnip.tidymodels.org/reference/mars.html).
