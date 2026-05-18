---
title: "recipes step_center() in R: Center Numeric Predictors"
slug: recipes-step_center-in-R
description: "recipes step_center() in R centers numeric predictors by subtracting the training mean. Learn the syntax, worked examples, prep and bake, and common pitfalls."
keywords: "recipes step_center, step_center function R, recipes step_center examples, R center predictors, tidymodels step_center, center data recipe R, step_center recipe"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_center()|recipes step_center|recipes::step_center()|step_center|center numeric predictors"
auto_link_case_sensitive: true
target_keyword: recipes step_center
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_center() in R: Center Numeric Predictors

<p class="lead">The <code>recipes</code> <code>step_center()</code> function in R centers numeric predictors by subtracting each column's training-set mean, shifting every column's average to zero. You add it to a <code>recipe()</code>, estimate the means with <code>prep()</code>, and apply them with <code>bake()</code>.</p>

[QUICK ANSWER]
step_center(rec, all_numeric_predictors())       # center all numeric predictors
step_center(rec, mpg, hp)                        # center named columns
step_center(rec, all_numeric())                  # center every numeric column
step_center(rec, contains("score"))              # center by name pattern
step_center(rec, all_numeric(), na_rm = TRUE)    # ignore NA in the mean
prep(rec) |> bake(new_data = NULL)               # estimate means, then apply
tidy(prep(rec), number = 1)                      # inspect the estimated means

[DECISION TREE: Is step_center() the right tool?]
- shift predictors to mean zero: step_center(rec, all_numeric_predictors())
- also scale to unit variance: step_normalize(rec, all_numeric_predictors())
- only rescale, keep the mean: step_scale(rec, all_numeric_predictors())
- squeeze into a 0-1 range: step_range(rec, all_numeric_predictors())
- fix skew before centering: step_YeoJohnson(rec, all_numeric_predictors())
- drop constant columns first: step_zv(rec, all_predictors())

## What step_center() does in R

**step_center() subtracts the column mean from every value.** For a numeric column, it computes the mean during `prep()` and then, during `bake()`, returns `value - mean`. The transformed column has a mean of zero but keeps its original spread and units.

Centering matters because many models behave better when predictors are on a common, zero-anchored scale. Regularized regression, principal components, and gradient-based learners all converge faster and interpret intercepts more cleanly when predictors are centered. `step_center()` is the recipes way to do this inside a modeling pipeline rather than by hand.

[KEY INSIGHT]
**The mean is learned once, on training data only.** `step_center()` stores the training means inside the prepped recipe. When you `bake()` new data, it reuses those stored means, so test rows are transformed with training statistics and no information leaks across the split.

## step_center() syntax and arguments

**step_center() attaches a centering operation to a recipe.** You pass the recipe first, then a set of columns selected with tidyselect helpers.

```r title="The step_center skeleton"
library(recipes)

recipe(mpg ~ ., data = mtcars) |>
  step_center(all_numeric_predictors())
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:    1
#> predictor: 10
#> -- Operations
#> * Centering for: all_numeric_predictors()
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to center, chosen with selectors like `all_numeric_predictors()`. |
| `na_rm` | If `TRUE` (default), missing values are dropped when computing the mean. |
| `means` | Filled in by `prep()`; holds the estimated mean per column. |
| `skip` | If `TRUE`, the step is ignored when baking new data. Leave `FALSE` for centering. |

## Centering predictors: worked examples

**Build the recipe, prep it, then bake.** A recipe is just a plan until `prep()` estimates the statistics from data. The first example centers every numeric predictor in `mtcars`.

```r title="Center predictors in a recipe"
rec <- recipe(mpg ~ ., data = mtcars) |>
  step_center(all_numeric_predictors())

centered <- prep(rec) |> bake(new_data = NULL)
round(head(centered[c("hp", "wt", "mpg")]), 2)
#>      hp    wt  mpg
#> 1 -36.7 -0.60 21.0
#> 2 -36.7 -0.34 21.0
#> 3 -53.7 -0.90 22.8
#> 4 -36.7  0.00 21.4
#> 5  28.3  0.22 18.7
#> 6 -41.7  0.24 18.1
```

The outcome `mpg` is untouched because `all_numeric_predictors()` excludes it. To confirm the centering worked, check the column means of the result.

```r title="Verify the centered means"
colMeans(centered[c("hp", "wt", "disp")])
#>           hp           wt         disp
#> 7.105427e-15 1.110223e-16 4.085621e-15
```

Every mean is zero apart from floating-point dust. To see the actual values subtracted, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the estimated means"
prepped <- prep(rec)
tidy(prepped, number = 1)[1:3, ]
#> # A tibble: 3 x 3
#>   terms value id
#>   <chr> <dbl> <chr>
#> 1 cyl    6.19 center_xY1
#> 2 disp 231.   center_xY1
#> 3 hp   147.   center_xY1
```

Centering also works across a train and test split. Estimate the recipe on training rows, then bake the held-out rows.

```r title="Apply training means to new data"
train <- mtcars[1:24, ]
test  <- mtcars[25:32, ]

rec2 <- recipe(mpg ~ ., data = train) |>
  step_center(all_numeric_predictors()) |>
  prep()

baked_test <- bake(rec2, new_data = test)
round(mean(baked_test$hp), 2)
#> [1] -17.83
```

The test mean is not zero, and that is correct. The held-out rows are shifted by the training mean, so their average reflects the genuine difference between the two samples.

## step_center() vs step_scale() vs step_normalize()

**Pick the step that matches the transformation you need.** Centering, scaling, and normalizing are related but distinct, and recipes gives each its own step.

| Step | What it does | Resulting column |
|---|---|---|
| `step_center()` | Subtracts the mean | Mean 0, original spread |
| `step_scale()` | Divides by the standard deviation | SD 1, original center |
| `step_normalize()` | Centers and scales together | Mean 0, SD 1 |
| `step_range()` | Rescales to a fixed interval | Bounded, default 0 to 1 |

If you want both mean zero and unit variance, use `step_normalize()` rather than chaining `step_center()` and `step_scale()`. It is shorter, and one `tidy()` call returns both statistics.

[TIP]
**Order your steps before centering.** Run `step_YeoJohnson()` or `step_BoxCox()` first when predictors are skewed, then center. Centering a skewed column does not fix the skew, it only relocates it.

## Common pitfalls with step_center()

**Watch what you select.** The most frequent mistakes come from choosing the wrong columns or skipping `prep()`.

1. **Centering the outcome.** `all_numeric()` includes the response variable. Use `all_numeric_predictors()` so the model still trains on the original target scale.
2. **Forgetting to prep.** Calling `bake()` on a recipe that was never prepped throws an error, because the means have not been estimated yet.
3. **Centering categorical dummies after the fact.** If `step_dummy()` runs before `step_center()`, the 0/1 indicator columns get centered too, which is rarely what you want.

[WARNING]
**Never compute the mean on the full dataset before splitting.** Centering with a mean that saw the test rows leaks information and inflates your performance estimate. Always wrap centering in a recipe and let `prep()` use training data only.

## Try it yourself

**Try it:** Center only the `hp` and `wt` columns of `mtcars` in a recipe, prep it, and save the baked result to `ex_centered`.

```r title="Your turn: center two columns"
# Try it: center hp and wt only
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_center(# your code here)

ex_centered <- # your code here

round(mean(ex_centered$hp), 6)
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_center(hp, wt)

ex_centered <- prep(ex_rec) |> bake(new_data = NULL)
round(mean(ex_centered$hp), 6)
#> [1] 0
```

**Explanation:** Passing bare column names to `step_center()` limits the step to just `hp` and `wt`. After `prep()` estimates their means and `bake()` applies them, the `hp` column averages to zero.

</details>

## Related recipes steps

**step_center() is one of several recipes preprocessing steps.** These pair naturally with it in a tidymodels workflow:

- [step_scale()](recipes-step_scale-in-R.html) divides predictors by their standard deviation.
- [step_normalize()](recipes-step_normalize-in-R.html) centers and scales in a single step.
- [step_range()](recipes-step_range-in-R.html) rescales predictors to a fixed interval.
- [step_YeoJohnson()](recipes-step_YeoJohnson-in-R.html) reduces skew before centering.
- [step_zv()](recipes-step_zv-in-R.html) drops zero-variance columns that cannot be centered meaningfully.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_center()` is `df - df.mean()`, or scikit-learn's `StandardScaler(with_std=False)`. The recipes version differs by learning the mean on training data and reapplying it automatically to new data.

## FAQ

**Does step_center() change the outcome variable?**

Not when you select columns with `all_numeric_predictors()`, which is the recommended selector. That helper excludes the variable on the left of your recipe formula. If you instead use `all_numeric()`, the outcome is included and gets centered, which shifts your target away from its real scale. For almost all modeling work, keep the outcome on its original units and center predictors only.

**What is the difference between step_center() and scale() in R?**

Base R's `scale()` centers and, by default, also divides by the standard deviation, returning a matrix with attributes. `step_center()` only subtracts the mean, returns a data frame, and crucially stores the training mean inside a recipe. That means the same transformation is reapplied to new data automatically, which `scale()` cannot do on its own.

**Do I need to center predictors before every model?**

No. Tree-based models such as random forests and boosted trees are invariant to centering, so the step adds nothing. Centering helps regularized regression, principal component analysis, k-nearest neighbors, and neural networks, where predictor location and scale affect the fit. Add `step_center()` when your model is distance-based or penalized.

**How does step_center() handle missing values?**

By default `na_rm = TRUE`, so missing values are ignored when the mean is computed during `prep()`. The mean reflects only the observed values in each column. The `NA` cells themselves remain `NA` after baking, because centering shifts existing numbers but cannot invent a value. Impute first with a step such as `step_impute_mean()` if you need complete columns.
