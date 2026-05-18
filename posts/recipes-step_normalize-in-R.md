---
title: "recipes step_normalize() in R: Center and Scale Predictors"
slug: recipes-step_normalize-in-R
description: "recipes step_normalize() in R centers and scales numeric predictors to mean zero and unit variance using training statistics. Syntax, examples, and pitfalls."
keywords: "recipes step_normalize, step_normalize function R, recipes step_normalize examples, R normalize predictors, tidymodels step_normalize, normalize data recipe R, step_normalize recipe"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_normalize()|recipes step_normalize|recipes::step_normalize()|step_normalize|normalize numeric predictors"
auto_link_case_sensitive: true
target_keyword: recipes step_normalize
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_normalize() in R: Center and Scale Predictors

<p class="lead">The <code>recipes</code> <code>step_normalize()</code> function in R centers and scales numeric predictors in one step, leaving each column with a mean of zero and a standard deviation of one. You add it to a <code>recipe()</code>, learn the statistics with <code>prep()</code>, and apply them with <code>bake()</code>.</p>

[QUICK ANSWER]
step_normalize(rec, all_numeric_predictors())     # normalize all numeric predictors
step_normalize(rec, mpg, hp)                      # normalize named columns
step_normalize(rec, all_numeric())                # normalize every numeric column
step_normalize(rec, contains("score"))            # normalize by name pattern
step_normalize(rec, -all_outcomes())              # normalize all but the outcome
prep(rec) |> bake(new_data = NULL)                # estimate stats, then apply
tidy(prep(rec), number = 1)                       # inspect the means and SDs

[DECISION TREE: Is step_normalize() the right tool?]
- center and scale to mean 0, SD 1: step_normalize(rec, all_numeric_predictors())
- only divide by the SD: step_scale(rec, all_numeric_predictors())
- only subtract the mean: step_center(rec, all_numeric_predictors())
- squeeze into a 0-1 range: step_range(rec, all_numeric_predictors())
- fix skew before normalizing: step_YeoJohnson(rec, all_numeric_predictors())
- drop constant columns first: step_zv(rec, all_predictors())

## What step_normalize() does in R

**step_normalize() converts each predictor into a z-score.** During `prep()` it computes the mean and standard deviation of every selected column. During `bake()` it returns `(value - mean) / sd`. The result is a column centered at zero with unit variance, which is exactly the transformation that `step_center()` followed by `step_scale()` would produce.

Normalization matters because many models compare predictors by magnitude. A car's `disp` runs into the hundreds while `drat` sits near three, so distance-based and penalized models let `disp` dominate the fit. `step_normalize()` puts every predictor on the same footing inside a modeling pipeline rather than by hand, and it keeps the transformation reproducible on new data.

[KEY INSIGHT]
**The mean and SD are learned once, on training data only.** `step_normalize()` stores both statistics inside the prepped recipe. When you `bake()` new rows, it reuses those stored values, so test data is normalized with training statistics and no information leaks across the split.

## step_normalize() syntax and arguments

**step_normalize() attaches a centering-and-scaling operation to a recipe.** You pass the recipe first, then the columns to transform, selected with tidyselect helpers.

```r title="The step_normalize skeleton"
library(recipes)

recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors())
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:    1
#> predictor: 10
#> -- Operations
#> * Centering and scaling for: all_numeric_predictors()
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to normalize, chosen with selectors like `all_numeric_predictors()`. |
| `na_rm` | If `TRUE` (default), missing values are dropped when computing the mean and SD. |
| `means` | Filled in by `prep()`; holds the estimated mean per column. |
| `sds` | Filled in by `prep()`; holds the estimated standard deviation per column. |
| `skip` | If `TRUE`, the step is ignored when baking new data. Leave `FALSE` for normalization. |

## Normalizing predictors: worked examples

**Build the recipe, prep it, then bake.** A recipe is only a plan until `prep()` estimates the statistics from data. This first example normalizes every numeric predictor in `mtcars`.

```r title="Normalize predictors in a recipe"
rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors())

normalized <- prep(rec) |> bake(new_data = NULL)
round(head(normalized[c("hp", "wt", "mpg")]), 2)
#>      hp    wt  mpg
#> 1 -0.54 -0.61 21.0
#> 2 -0.54 -0.35 21.0
#> 3 -0.78 -0.92 22.8
#> 4 -0.54  0.00 21.4
#> 5  0.41  0.23 18.7
#> 6 -0.61  0.25 18.1
```

The outcome `mpg` is untouched because `all_numeric_predictors()` excludes it. Values now sit around zero, with negative numbers for below-average cars and positive numbers for above-average ones. To confirm the step worked, check the mean and standard deviation of each result column.

```r title="Verify the normalized statistics"
round(colMeans(normalized[c("hp", "wt", "disp")]), 2)
#>   hp   wt disp
#>    0    0    0
sapply(normalized[c("hp", "wt", "disp")], sd)
#>   hp   wt disp
#>    1    1    1
```

Every column now has a mean of zero and a standard deviation of one. To see the actual statistics the recipe learned, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the learned means and SDs"
prepped <- prep(rec)
tidy(prepped, number = 1) |> subset(terms %in% c("hp", "wt"))
#> # A tibble: 4 x 4
#>   terms statistic  value id
#>   <chr> <chr>      <dbl> <chr>
#> 1 hp    mean     147.    normalize_AbC12
#> 2 wt    mean       3.22  normalize_AbC12
#> 3 hp    sd        68.6   normalize_AbC12
#> 4 wt    sd         0.978 normalize_AbC12
```

A single `tidy()` call returns both the means and the standard deviations, tagged in the `statistic` column. This is the practical advantage of `step_normalize()` over chaining two separate steps: one step, one summary, both statistics.

## step_normalize() vs step_center() vs step_scale()

**Pick the step that matches the transformation you need.** Centering, scaling, and normalizing are related but distinct, and recipes gives each its own step.

| Step | What it does | Resulting column |
|---|---|---|
| `step_normalize()` | Centers and scales together | Mean 0, SD 1 |
| `step_center()` | Subtracts the mean | Mean 0, original spread |
| `step_scale()` | Divides by the standard deviation | SD 1, original center |
| `step_range()` | Rescales to a fixed interval | Bounded, default 0 to 1 |

If you want both mean zero and unit variance, reach for `step_normalize()` instead of adding `step_center()` and `step_scale()` separately. It is shorter to write, the `tidy()` output covers both statistics, and there is no risk of accidentally selecting different columns in each step. Use a bare `step_center()` or `step_scale()` only when you specifically want to preserve one of the two original properties.

[TIP]
**Reduce skew before you normalize.** Run `step_YeoJohnson()` or `step_BoxCox()` first when predictors are heavily skewed, then normalize. Subtracting the mean and dividing by the SD shifts and shrinks the numbers but leaves the shape of the distribution exactly as lopsided as before.

## Common pitfalls with step_normalize()

**Watch which columns you select and when the step runs.** The most frequent mistakes come from normalizing the wrong columns or placing the step at the wrong point in the recipe.

1. **Normalizing the outcome.** `all_numeric()` includes the response variable. Use `all_numeric_predictors()` so the model still trains and predicts on the original target scale.
2. **Normalizing dummy variables.** If `step_dummy()` runs before `step_normalize()`, the 0/1 indicator columns get centered and scaled too, which makes them harder to interpret. Normalize before creating dummies, or select numeric columns explicitly.
3. **Forgetting to prep.** Calling `bake()` on a recipe that was never prepped throws an error, because the means and SDs have not been estimated yet.

[WARNING]
**Never compute the mean and SD on the full dataset before splitting.** Normalizing with statistics that saw the test rows leaks information and inflates your performance estimate. Always wrap normalization in a recipe and let `prep()` use training data only.

## Try it yourself

**Try it:** Normalize only the `hp` and `wt` columns of `mtcars` in a recipe, prep it, and save the baked result to `ex_norm`.

```r title="Your turn: normalize two columns"
# Try it: normalize hp and wt only
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(# your code here)

ex_norm <- # your code here

round(c(mean = mean(ex_norm$hp), sd = sd(ex_norm$hp)), 6)
#> Expected: mean 0, sd 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(hp, wt)

ex_norm <- prep(ex_rec) |> bake(new_data = NULL)
round(c(mean = mean(ex_norm$hp), sd = sd(ex_norm$hp)), 6)
#> mean   sd
#>    0    1
```

**Explanation:** Passing bare column names to `step_normalize()` limits the step to just `hp` and `wt`. After `prep()` estimates their means and SDs and `bake()` applies the z-score, the `hp` column has a mean of zero and a standard deviation of one.

</details>

## Related recipes steps

**step_normalize() is one of several recipes preprocessing steps.** These pair naturally with it in a tidymodels workflow:

- [step_center()](recipes-step_center-in-R.html) subtracts the mean without touching the spread.
- [step_scale()](recipes-step_scale-in-R.html) divides by the SD without shifting the center.
- [step_range()](recipes-step_range-in-R.html) rescales predictors to a fixed interval.
- [step_YeoJohnson()](recipes-step_YeoJohnson-in-R.html) reduces skew before normalizing.
- [step_zv()](recipes-step_zv-in-R.html) drops zero-variance columns that cannot be normalized.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_normalize()` is `(df - df.mean()) / df.std()`, or scikit-learn's `StandardScaler()`. The recipes version differs by learning the mean and SD on training data and reapplying them automatically to new data.

## FAQ

**What does step_normalize() do in R?**

`step_normalize()` is a recipes step that centers and scales numeric predictors at the same time. During `prep()` it learns each column's mean and standard deviation from the training data. During `bake()` it applies the z-score transformation `(value - mean) / sd`, so every selected column ends with a mean of zero and a standard deviation of one. It is the recipes equivalent of standardizing data before modeling.

**What is the difference between step_normalize() and step_scale()?**

`step_scale()` only divides each column by its standard deviation, so the column keeps its original mean. `step_normalize()` does two things: it subtracts the mean and then divides by the SD, leaving the column with mean zero and SD one. Use `step_normalize()` when a model needs both, such as regularized regression or principal component analysis. Use `step_scale()` alone when the original center carries meaning you want to keep.

**Do I need step_normalize() before every model?**

No. Tree-based models such as random forests and boosted trees are invariant to monotonic rescaling, so normalization adds nothing. Normalization matters for distance-based and penalized methods: k-nearest neighbors, support vector machines, principal component analysis, and lasso or ridge regression all let large-magnitude predictors dominate unless predictors share a common scale.

**What does tidy() show for a step_normalize() step?**

Calling `tidy()` on a prepped recipe with the step number returns a tibble with one row per statistic per column. The `statistic` column reads either `mean` or `sd`, the `value` column holds the learned number, and `terms` names the predictor. This lets you audit exactly which means and standard deviations the recipe will reuse when baking new data.
