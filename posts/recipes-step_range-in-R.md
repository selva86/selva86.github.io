---
title: "recipes step_range() in R: Scale Predictors to a 0-1 Range"
slug: recipes-step_range-in-R
description: "recipes step_range() in R rescales numeric predictors to a fixed interval, 0 to 1 by default. Syntax, min/max arguments, clipping, examples, and pitfalls."
keywords: "recipes step_range, step_range function R, recipes step_range examples, R rescale predictors, tidymodels step_range, min-max scaling recipe R, normalize range R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_range()|recipes step_range|recipes::step_range()|step_range|rescale numeric predictors"
auto_link_case_sensitive: true
target_keyword: recipes step_range
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_range() in R: Scale Predictors to a 0-1 Range

<p class="lead">The <code>recipes</code> <code>step_range()</code> function in R rescales each numeric predictor to a fixed interval, 0 to 1 by default, using the minimum and maximum learned from the training set. You add it to a <code>recipe()</code>, estimate the ranges with <code>prep()</code>, and apply them with <code>bake()</code>.</p>

[QUICK ANSWER]
step_range(rec, all_numeric_predictors())            # rescale all predictors to 0-1
step_range(rec, mpg, hp)                             # rescale named columns
step_range(rec, all_numeric(), min = -1, max = 1)    # custom target range
step_range(rec, contains("score"))                   # rescale by name pattern
step_range(rec, all_numeric_predictors(), clipping = FALSE)  # allow out-of-range output
prep(rec) |> bake(new_data = NULL)                   # estimate ranges, then apply
tidy(prep(rec), number = 1)                          # inspect the learned min/max

[DECISION TREE: Is step_range() the right tool?]
- squeeze predictors into a fixed 0-1 interval: step_range(rec, all_numeric_predictors())
- want mean 0 and SD 1 instead: step_normalize(rec, all_numeric_predictors())
- only divide by the standard deviation: step_scale(rec, all_numeric_predictors())
- only subtract the mean: step_center(rec, all_numeric_predictors())
- fix skew before rescaling: step_YeoJohnson(rec, all_numeric_predictors())
- drop constant columns first: step_zv(rec, all_predictors())

## What step_range() does in R

**step_range() linearly rescales a column so its smallest value becomes the target minimum and its largest becomes the target maximum.** During `prep()` it records the minimum and maximum of each selected column. During `bake()` it applies the formula `(x - min) / (max - min)`, then stretches the result to the requested interval. With the defaults, every column lands between 0 and 1.

This transformation is often called min-max scaling or normalization. It is useful when a model expects bounded inputs, when you want predictors on a common 0-to-1 footing for plotting, or when an algorithm such as a neural network trains more smoothly on a compact range. Unlike standardizing, it preserves the exact shape of the distribution and simply relabels the axis.

[KEY INSIGHT]
**The minimum and maximum are learned once, on training data only.** `step_range()` stores the training extremes inside the prepped recipe. When you `bake()` new data, it reuses those stored values, so test rows are rescaled with training statistics and no information leaks across the split.

## step_range() syntax and arguments

**step_range() attaches a rescaling operation to a recipe.** You pass the recipe first, then a set of columns selected with tidyselect helpers.

```r title="The step_range skeleton"
library(recipes)

recipe(mpg ~ ., data = mtcars) |>
  step_range(all_numeric_predictors())
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:    1
#> predictor: 10
#> -- Operations
#> * Range scaling to [0,1] for: all_numeric_predictors()
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to rescale, chosen with selectors like `all_numeric_predictors()`. |
| `min` | Lower bound of the target interval. Default `0`. |
| `max` | Upper bound of the target interval. Default `1`. |
| `clipping` | If `TRUE` (default), new data outside the training range is clamped to `[min, max]`. |
| `ranges` | Filled in by `prep()`; holds the estimated minimum and maximum per column. |
| `skip` | If `TRUE`, the step is ignored when baking new data. Leave `FALSE` for rescaling. |

## Rescaling predictors: worked examples

**Build the recipe, prep it, then bake.** A recipe is just a plan until `prep()` estimates the statistics from data. The first example rescales every numeric predictor in `mtcars` to the default 0-to-1 range.

```r title="Rescale predictors to 0-1"
rec <- recipe(mpg ~ ., data = mtcars) |>
  step_range(all_numeric_predictors())

ranged <- prep(rec) |> bake(new_data = NULL)
round(head(ranged[c("hp", "wt", "mpg")]), 2)
#>     hp   wt  mpg
#> 1 0.20 0.28 21.0
#> 2 0.20 0.35 21.0
#> 3 0.14 0.21 22.8
#> 4 0.20 0.44 21.4
#> 5 0.43 0.49 18.7
#> 6 0.19 0.50 18.1
```

The outcome `mpg` is untouched because `all_numeric_predictors()` excludes it. To confirm the step worked, check the range of each result column.

```r title="Verify the rescaled ranges"
sapply(ranged[c("hp", "wt", "disp")], range)
#>      hp wt disp
#> [1,]  0  0    0
#> [2,]  1  1    1
```

Every column now runs from exactly 0 to 1. To see the learned extremes, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the learned min and max"
prepped <- prep(rec)
tidy(prepped, number = 1)[1:3, ]
#> # A tibble: 3 x 4
#>   terms   min   max id
#>   <chr> <dbl> <dbl> <chr>
#> 1 cyl     4      8   range_AbC12
#> 2 disp   71.1  472. range_AbC12
#> 3 hp     52    335  range_AbC12
```

The `min` and `max` arguments change the target interval. Setting `min = -1` and `max = 1` rescales each column into a symmetric range around zero, a layout many neural network and signal-processing pipelines prefer.

```r title="Rescale to a custom range"
rec_pm1 <- recipe(mpg ~ ., data = mtcars) |>
  step_range(all_numeric_predictors(), min = -1, max = 1)

scaled_pm1 <- prep(rec_pm1) |> bake(new_data = NULL)
round(sapply(scaled_pm1[c("hp", "wt")], range), 2)
#>      hp wt
#> [1,] -1 -1
#> [2,]  1  1
```

The fourth example shows `clipping` in action. A new observation whose `hp` exceeds the training maximum of 335 would scale above 1, but with `clipping = TRUE` the output is clamped to the interval.

```r title="Clipping keeps new data inside the range"
new_car <- mtcars[1, ]
new_car$hp <- 400        # above the training max of 335

bake(prepped, new_data = new_car)$hp
#> [1] 1
```

With `clipping = FALSE`, the same row would return about 1.23, because the linear formula is applied without a bound. Clipping is the safer default for production scoring, where stray extreme values should not push a predictor outside its trained interval.

## step_range() vs step_normalize() vs step_scale()

**Pick the step that matches the transformation you need.** Range scaling, normalizing, and scaling are related but distinct, and recipes gives each its own step.

| Step | What it does | Resulting column |
|---|---|---|
| `step_range()` | Rescales to a fixed interval | Bounded, default 0 to 1 |
| `step_normalize()` | Centers and scales together | Mean 0, SD 1, unbounded |
| `step_scale()` | Divides by the standard deviation | SD 1, original center |
| `step_center()` | Subtracts the mean | Mean 0, original spread |

Use `step_range()` when you need predictors inside hard bounds, for example before a model that assumes inputs in `[0, 1]`. Reach for `step_normalize()` instead when an algorithm cares about spread relative to the mean, such as regularized regression or principal component analysis. The two are not interchangeable: range scaling is bounded but sensitive to outliers, while normalizing is unbounded but robust to a single extreme value stretching the column.

[TIP]
**Reduce skew before you rescale.** Run `step_YeoJohnson()` or `step_BoxCox()` first when predictors are heavily skewed, then rescale. Squeezing a skewed column into 0-to-1 leaves the shape exactly as lopsided as before, with most points bunched near one edge.

## Common pitfalls with step_range()

**Watch your column selection and your outliers.** The most frequent mistakes come from rescaling the wrong columns or ignoring how a single extreme value behaves.

1. **Rescaling the outcome.** `all_numeric()` includes the response variable. Use `all_numeric_predictors()` so the model still trains and predicts on the original target scale.
2. **Forgetting to prep.** Calling `bake()` on a recipe that was never prepped throws an error, because the minimum and maximum have not been estimated yet.
3. **Outlier domination.** One extreme value sets the maximum, so every other observation gets squashed near 0. Range scaling has no defense against outliers the way standardizing partly does; inspect or cap extremes first.

[WARNING]
**Never compute the minimum and maximum on the full dataset before splitting.** Rescaling with extremes that saw the test rows leaks information and inflates your performance estimate. Always wrap range scaling in a recipe and let `prep()` use training data only.

## Try it yourself

**Try it:** Rescale only the `hp` and `wt` columns of `mtcars` to a 0-to-1 range in a recipe, prep it, and save the baked result to `ex_ranged`.

```r title="Your turn: rescale two columns"
# Try it: rescale hp and wt only
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_range(# your code here)

ex_ranged <- # your code here

round(range(ex_ranged$hp), 6)
#> Expected: 0 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_range(hp, wt)

ex_ranged <- prep(ex_rec) |> bake(new_data = NULL)
round(range(ex_ranged$hp), 6)
#> [1] 0 1
```

**Explanation:** Passing bare column names to `step_range()` limits the step to just `hp` and `wt`. After `prep()` learns their training minimum and maximum and `bake()` applies the linear formula, the `hp` column runs from 0 to 1.

</details>

## Related recipes steps

**step_range() is one of several recipes preprocessing steps.** These pair naturally with it in a tidymodels workflow:

- [step_normalize()](recipes-step_normalize-in-R.html) centers and scales to mean 0 and SD 1.
- [step_scale()](recipes-step_scale-in-R.html) divides each column by its standard deviation.
- [step_center()](recipes-step_center-in-R.html) subtracts the mean only.
- [step_YeoJohnson()](recipes-step_YeoJohnson-in-R.html) reduces skew before rescaling.
- [step_zv()](recipes-step_zv-in-R.html) drops zero-variance columns that cannot be rescaled.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_range()` is scikit-learn's `MinMaxScaler`, or `(df - df.min()) / (df.max() - df.min())`. The recipes version differs by learning the extremes on training data and reapplying them automatically, with optional clipping for new data.

## FAQ

**What is the difference between step_range() and step_normalize()?**

`step_range()` rescales a column to a fixed interval, 0 to 1 by default, using the training minimum and maximum. The result is bounded but sensitive to outliers, since one extreme value sets an endpoint. `step_normalize()` instead subtracts the mean and divides by the standard deviation, leaving the column with mean 0 and SD 1. Its output is unbounded but more robust to a single extreme value. Choose `step_range()` for hard bounds and `step_normalize()` when spread relative to the mean matters.

**What does the clipping argument do in step_range()?**

The `clipping` argument controls what happens when new data falls outside the range learned from training. With `clipping = TRUE`, the default, any baked value below `min` or above `max` is clamped to that bound, so a predictor never leaves its trained interval. With `clipping = FALSE`, the linear formula is applied without limits, so out-of-range inputs can produce values below 0 or above 1. Keep clipping on for production scoring, where stray extreme values should not escape the interval.

**What range does step_range() scale to by default?**

By default `step_range()` rescales each selected column to the interval from 0 to 1, because `min = 0` and `max = 1`. You can change the target interval by passing different values, for example `min = -1, max = 1` for a symmetric range around zero. The transformation is linear: the column minimum maps to `min`, the column maximum maps to `max`, and every value in between is placed proportionally.

**When should I use step_range() instead of step_scale()?**

Use `step_range()` when a model or downstream step needs inputs inside hard bounds, such as a neural network expecting values in `[0, 1]` or a plot that compares predictors on a common axis. Use `step_scale()` when you want unit variance while keeping each column's original mean, which suits distance-based and penalized models. Range scaling fixes the endpoints; scaling fixes the spread. They answer different needs and should not be swapped casually.
