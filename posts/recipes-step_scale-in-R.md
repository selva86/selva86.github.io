---
title: "recipes step_scale() in R: Scale Predictors to Unit SD"
slug: recipes-step_scale-in-R
description: "recipes step_scale() in R divides numeric predictors by their training standard deviation, giving each column unit variance. Syntax, examples, and pitfalls."
keywords: "recipes step_scale, step_scale function R, recipes step_scale examples, R scale predictors, tidymodels step_scale, scale data recipe R, step_scale recipe"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_scale()|recipes step_scale|recipes::step_scale()|step_scale|scale numeric predictors"
auto_link_case_sensitive: true
target_keyword: recipes step_scale
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_scale() in R: Scale Predictors to Unit SD

<p class="lead">The <code>recipes</code> <code>step_scale()</code> function in R divides each numeric predictor by its training-set standard deviation, giving every column unit variance while leaving its mean untouched. You add it to a <code>recipe()</code>, estimate the spreads with <code>prep()</code>, and apply them with <code>bake()</code>.</p>

[QUICK ANSWER]
step_scale(rec, all_numeric_predictors())        # scale all numeric predictors
step_scale(rec, mpg, hp)                         # scale named columns
step_scale(rec, all_numeric())                   # scale every numeric column
step_scale(rec, contains("score"))               # scale by name pattern
step_scale(rec, all_numeric(), factor = 2)       # divide by two SDs
prep(rec) |> bake(new_data = NULL)                # estimate SDs, then apply
tidy(prep(rec), number = 1)                      # inspect the estimated SDs

[DECISION TREE: Is step_scale() the right tool?]
- rescale to unit variance, keep the mean: step_scale(rec, all_numeric_predictors())
- also shift to mean zero: step_normalize(rec, all_numeric_predictors())
- only shift, keep the spread: step_center(rec, all_numeric_predictors())
- squeeze into a 0-1 range: step_range(rec, all_numeric_predictors())
- fix skew before scaling: step_YeoJohnson(rec, all_numeric_predictors())
- drop constant columns first: step_zv(rec, all_predictors())

## What step_scale() does in R

**step_scale() divides every value in a column by that column's standard deviation.** During `prep()` it computes the standard deviation of each selected column. During `bake()` it returns `value / sd`. The transformed column ends up with a standard deviation of one, but its mean and sign are unchanged.

Scaling matters because predictors measured on wildly different units can distort models that depend on magnitude. A car's `disp` runs into the hundreds while `drat` sits near three, and any distance-based or penalized model will let `disp` dominate. `step_scale()` is the recipes way to put predictors on a comparable spread inside a modeling pipeline rather than by hand.

[KEY INSIGHT]
**The standard deviation is learned once, on training data only.** `step_scale()` stores the training standard deviations inside the prepped recipe. When you `bake()` new data, it reuses those stored values, so test rows are divided by training statistics and no information leaks across the split.

## step_scale() syntax and arguments

**step_scale() attaches a scaling operation to a recipe.** You pass the recipe first, then a set of columns selected with tidyselect helpers.

```r title="The step_scale skeleton"
library(recipes)

recipe(mpg ~ ., data = mtcars) |>
  step_scale(all_numeric_predictors())
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:    1
#> predictor: 10
#> -- Operations
#> * Scaling for: all_numeric_predictors()
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to scale, chosen with selectors like `all_numeric_predictors()`. |
| `factor` | Divisor multiplier. `1` (default) divides by one SD; `2` divides by two SDs. |
| `na_rm` | If `TRUE` (default), missing values are dropped when computing the SD. |
| `sds` | Filled in by `prep()`; holds the estimated standard deviation per column. |
| `skip` | If `TRUE`, the step is ignored when baking new data. Leave `FALSE` for scaling. |

## Scaling predictors: worked examples

**Build the recipe, prep it, then bake.** A recipe is just a plan until `prep()` estimates the statistics from data. The first example scales every numeric predictor in `mtcars`.

```r title="Scale predictors in a recipe"
rec <- recipe(mpg ~ ., data = mtcars) |>
  step_scale(all_numeric_predictors())

scaled <- prep(rec) |> bake(new_data = NULL)
round(head(scaled[c("hp", "wt", "mpg")]), 2)
#>     hp   wt  mpg
#> 1 1.60 2.68 21.0
#> 2 1.60 2.94 21.0
#> 3 1.36 2.37 22.8
#> 4 1.60 3.29 21.4
#> 5 2.55 3.52 18.7
#> 6 1.53 3.54 18.1
```

The outcome `mpg` is untouched because `all_numeric_predictors()` excludes it. Notice the scaled values stay positive: scaling changes spread, not location. To confirm the step worked, check the standard deviation of each result column.

```r title="Verify the scaled standard deviations"
sapply(scaled[c("hp", "wt", "disp")], sd)
#>   hp   wt disp
#>    1    1    1
```

Every column now has a standard deviation of exactly one. To see the actual divisors, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the estimated standard deviations"
prepped <- prep(rec)
tidy(prepped, number = 1)[1:3, ]
#> # A tibble: 3 x 3
#>   terms value id
#>   <chr> <dbl> <chr>
#> 1 cyl    1.79 scale_AbC12
#> 2 disp 124.   scale_AbC12
#> 3 hp    68.6  scale_AbC12
```

The `factor` argument changes the divisor. Setting `factor = 2` divides by two standard deviations, a convention recommended for comparing continuous predictors with binary ones on the same footing.

```r title="Scale by two standard deviations"
rec_f2 <- recipe(mpg ~ ., data = mtcars) |>
  step_scale(all_numeric_predictors(), factor = 2)

scaled_f2 <- prep(rec_f2) |> bake(new_data = NULL)
round(sapply(scaled_f2[c("hp", "wt")], sd), 2)
#>  hp  wt
#> 0.5 0.5
```

Dividing by two SDs halves the resulting spread, so each column lands at a standard deviation of 0.5. With `factor = 1` the columns would each read 1.

## step_scale() vs step_center() vs step_normalize()

**Pick the step that matches the transformation you need.** Scaling, centering, and normalizing are related but distinct, and recipes gives each its own step.

| Step | What it does | Resulting column |
|---|---|---|
| `step_scale()` | Divides by the standard deviation | SD 1, original center |
| `step_center()` | Subtracts the mean | Mean 0, original spread |
| `step_normalize()` | Centers and scales together | Mean 0, SD 1 |
| `step_range()` | Rescales to a fixed interval | Bounded, default 0 to 1 |

If you want both unit variance and mean zero, use `step_normalize()` rather than chaining `step_center()` and `step_scale()`. It is shorter, and one `tidy()` call returns both statistics. Reach for a bare `step_scale()` only when you specifically want to preserve each column's original mean and sign.

[TIP]
**Reduce skew before you scale.** Run `step_YeoJohnson()` or `step_BoxCox()` first when predictors are heavily skewed, then scale. Dividing a skewed column by its SD shrinks the numbers but leaves the shape of the distribution exactly as lopsided as before.

## Common pitfalls with step_scale()

**Watch what you select and when you scale.** The most frequent mistakes come from choosing the wrong columns or scaling at the wrong point in the recipe.

1. **Scaling the outcome.** `all_numeric()` includes the response variable. Use `all_numeric_predictors()` so the model still trains and predicts on the original target scale.
2. **Forgetting to prep.** Calling `bake()` on a recipe that was never prepped throws an error, because the standard deviations have not been estimated yet.
3. **Scaling dummy variables.** If `step_dummy()` runs before `step_scale()`, the 0/1 indicator columns get divided by their SD too, which distorts their interpretation. Scale before creating dummies, or select numeric columns explicitly.

[WARNING]
**Never compute the standard deviation on the full dataset before splitting.** Scaling with an SD that saw the test rows leaks information and inflates your performance estimate. Always wrap scaling in a recipe and let `prep()` use training data only.

## Try it yourself

**Try it:** Scale only the `hp` and `wt` columns of `mtcars` in a recipe, prep it, and save the baked result to `ex_scaled`.

```r title="Your turn: scale two columns"
# Try it: scale hp and wt only
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_scale(# your code here)

ex_scaled <- # your code here

round(sd(ex_scaled$hp), 6)
#> Expected: 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_scale(hp, wt)

ex_scaled <- prep(ex_rec) |> bake(new_data = NULL)
round(sd(ex_scaled$hp), 6)
#> [1] 1
```

**Explanation:** Passing bare column names to `step_scale()` limits the step to just `hp` and `wt`. After `prep()` estimates their standard deviations and `bake()` divides by them, the `hp` column has a standard deviation of one.

</details>

## Related recipes steps

**step_scale() is one of several recipes preprocessing steps.** These pair naturally with it in a tidymodels workflow:

- [step_center()](recipes-step_center-in-R.html) subtracts the mean instead of dividing by the SD.
- [step_normalize()](recipes-step_normalize-in-R.html) centers and scales in a single step.
- [step_range()](recipes-step_range-in-R.html) rescales predictors to a fixed interval.
- [step_YeoJohnson()](recipes-step_YeoJohnson-in-R.html) reduces skew before scaling.
- [step_zv()](recipes-step_zv-in-R.html) drops zero-variance columns that cannot be scaled.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_scale()` is `df / df.std()`, or scikit-learn's `StandardScaler(with_mean=False)`. The recipes version differs by learning the standard deviation on training data and reapplying it automatically to new data.

## FAQ

**What is the difference between step_scale() and step_normalize()?**

`step_scale()` only divides each column by its standard deviation, so the column ends with unit variance but keeps its original mean. `step_normalize()` does two things: it subtracts the mean and divides by the SD, leaving the column with mean zero and SD one. Use `step_normalize()` when a model needs both, such as regularized regression or principal component analysis. Use `step_scale()` alone when the original center carries meaning you want to keep.

**Does step_scale() center the data?**

No. `step_scale()` is a pure division step. It changes the spread of a column but never shifts its location, so a column of positive values stays positive after scaling. If you need the mean shifted to zero as well, add `step_center()` to the recipe or use `step_normalize()`, which combines both operations into one step and one `tidy()` summary.

**What is the factor argument in step_scale()?**

The `factor` argument controls how many standard deviations the divisor represents. With the default `factor = 1`, each value is divided by one SD and the result has unit variance. With `factor = 2`, values are divided by two SDs, which is a convention from Andrew Gelman for putting continuous predictors on a scale comparable to centered binary predictors. Only `1` and `2` are accepted.

**Should I scale predictors before every model?**

No. Tree-based models such as random forests and boosted trees are invariant to scaling, so the step adds nothing. Scaling matters for distance-based and penalized methods: k-nearest neighbors, support vector machines, principal component analysis, and regularized regression all let large-magnitude predictors dominate unless you put columns on a common spread first.
