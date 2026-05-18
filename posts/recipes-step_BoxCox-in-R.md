---
title: "recipes step_BoxCox() in R: Normalize Skewed Predictors"
slug: recipes-step_BoxCox-in-R
description: "recipes step_BoxCox() in R applies a Box-Cox transformation that reshapes skewed, strictly positive predictors toward normality. Syntax, examples, and pitfalls."
keywords: "recipes step_BoxCox, step_BoxCox function R, recipes step_BoxCox examples, Box-Cox transformation tidymodels R, step_BoxCox lambda, tidymodels Box-Cox"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "step_BoxCox()|recipes step_BoxCox|recipes::step_BoxCox()|Box-Cox transformation|Box-Cox transformation in R"
auto_link_case_sensitive: true
target_keyword: "recipes step_BoxCox"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_BoxCox() in R: Normalize Skewed Predictors

<p class="lead">The recipes <code>step_BoxCox()</code> function applies a Box-Cox transformation that reshapes skewed, strictly positive predictors toward a more normal distribution. It estimates the best power transform per column during <code>prep()</code> and reuses it on new data.</p>

[QUICK ANSWER]
step_BoxCox(rec, all_numeric_predictors())   # transform every numeric predictor
step_BoxCox(rec, income, latency)            # transform named columns only
step_BoxCox(rec, limits = c(-3, 3))          # narrow the lambda search range
step_BoxCox(rec, num_unique = 10)            # require 10+ unique values
prep(rec) |> tidy(number = 1)                # view the estimated lambdas
recipe(y ~ ., data = df) |> step_BoxCox(...) # add the step inside a recipe

[DECISION TREE: Is step_BoxCox() the right tool?]
- normalize skewed positive predictors: step_BoxCox(rec, all_numeric_predictors())
- data has zeros or negative values: step_YeoJohnson(rec, all_numeric_predictors())
- just compress a long right tail: step_log(rec, x, base = 10)
- center and scale to z-scores: step_normalize(rec, all_numeric_predictors())
- squeeze values into a 0 to 1 range: step_range(rec, all_numeric_predictors())
- spread a skewed outcome instead: transform y before recipe(), then back-transform

## What step_BoxCox() does

**step_BoxCox() adds a Box-Cox transformation step to a recipe.** It does not transform data on its own. The step records your intent, and the actual lambda values are estimated later when you call `prep()` on the recipe with training data.

The Box-Cox transformation raises each value to a power, lambda, chosen to make the column as close to normal as possible. A lambda near 0 acts like a log transform, lambda near 1 leaves the data almost unchanged, and values in between stretch or compress the distribution. The recipe estimates one lambda per selected column by maximizing a profile likelihood.

Because the lambda is learned from the training set and then frozen, `bake()` applies the exact same transformation to test data or new observations. That separation is what keeps a tidymodels workflow free of data leakage.

[KEY INSIGHT]
**A recipe step is a plan, not a result.** `step_BoxCox()` only schedules the transformation. `prep()` learns the lambdas from training data, and `bake()` applies them. Keeping estimation and application apart is what makes the same transform reproducible across resamples.

[WARNING]
**Box-Cox requires strictly positive data.** Every value in a selected column must be greater than zero. If a column contains zeros or negatives, `prep()` cannot estimate a lambda for it, leaves the column untransformed, and emits a warning. Use `step_YeoJohnson()` for data that includes non-positive values.

## step_BoxCox() syntax and arguments

**step_BoxCox() takes column selectors plus a few tuning arguments.** The selectors choose which columns to transform, and the remaining arguments control how the lambda search runs.

```r title="The step_BoxCox specification skeleton"
library(recipes)

step_BoxCox(
  recipe,                  # the recipe object the step is added to
  ...,                     # columns to transform (tidyselect selectors)
  role = NA,               # role for new columns; rarely changed
  trained = FALSE,         # set to TRUE internally after prep()
  lambdas = NULL,          # estimated lambdas; NULL until prep() runs
  limits = c(-5, 5),       # range searched for the lambda parameter
  num_unique = 5,          # minimum distinct values needed to transform
  skip = FALSE,            # if TRUE, skip this step when baking new data
  id = rand_id("BoxCox")   # unique step identifier
)
```

The `...` argument accepts any tidyselect selector, so `all_numeric_predictors()` or bare column names both work. The `limits` argument bounds the lambda search, and `num_unique` protects against transforming near-constant or discrete columns. You rarely set `lambdas` or `trained` by hand, because `prep()` fills them in.

## Transform skewed predictors: four examples

**Every example below uses data generated inside the code block.** No downloads are needed, and the skewed columns make the effect of the transformation easy to see.

### Example 1: Measure the skew before transforming

**Start by confirming the predictors really are skewed.** A simple skewness helper shows how far each column leans before any step runs.

```r title="Create skewed data and measure skewness"
library(recipes)

set.seed(42)
skewed_df <- data.frame(
  y       = rnorm(200),
  income  = rexp(200, rate = 0.4),
  latency = rgamma(200, shape = 2, rate = 0.1)
)

skewness <- function(x) mean((x - mean(x))^3) / sd(x)^3
sapply(skewed_df[c("income", "latency")], skewness)
#>   income  latency
#>     1.93     1.42
```

Both predictors have a strong positive skew, with long right tails. A skewness near 0 would mean a symmetric, roughly normal shape, so these columns are good candidates for a Box-Cox transformation.

### Example 2: Add step_BoxCox() to a recipe

**Build a recipe and attach the step with a selector.** The `all_numeric_predictors()` selector picks every numeric predictor, leaving the outcome `y` alone.

```r title="Add step_BoxCox to a recipe"
box_rec <- recipe(y ~ ., data = skewed_df) |>
  step_BoxCox(all_numeric_predictors())

box_rec
#> -- Recipe ----------------------------------------------------------
#>
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 2
#>
#> -- Operations
#> * Box-Cox transformation on: all_numeric_predictors()
```

The printout confirms the recipe has one outcome and two predictors, with a single Box-Cox operation queued. No lambdas exist yet, because the recipe has not been prepped.

### Example 3: Prep, bake, and check the result

**prep() estimates the lambdas and bake() applies them.** Re-measuring skewness on the baked data shows how far the transformation moved each column.

```r title="Prep, bake, and recheck skewness"
box_prep  <- prep(box_rec, training = skewed_df)
box_baked <- bake(box_prep, new_data = NULL)

sapply(box_baked[c("income", "latency")], skewness)
#>   income  latency
#>    -0.04     0.02
```

Both columns now have a skewness near 0, meaning the long right tails are gone and the distributions are close to symmetric. The `new_data = NULL` argument tells `bake()` to return the already-prepped training data.

### Example 4: Inspect the estimated lambdas

**tidy() reveals the lambda chosen for each column.** Pass the step number to pull its estimated parameters.

```r title="View the estimated Box-Cox lambdas"
tidy(box_prep, number = 1)
#> # A tibble: 2 x 3
#>   terms    value id
#>   <chr>    <dbl> <chr>
#> 1 income   0.268 BoxCox_xK29p
#> 2 latency  0.331 BoxCox_xK29p
```

Each `value` is the lambda fitted for that column. Both lie between 0 and 1, so the transformation behaves between a log transform and the identity. These frozen lambdas are what `bake()` reuses on any future data.

[TIP]
**Run step_BoxCox() before step_normalize(), not after.** Box-Cox fixes the shape of a distribution, while normalization rescales it to mean 0 and standard deviation 1. Reshaping first, then rescaling, gives downstream models well-behaved, standardized predictors.

## step_BoxCox() vs other transformation steps

**recipes ships several transformation steps that overlap with Box-Cox.** Each one suits a different data condition, so the right choice depends on your column.

| Step | What it does | Use when |
|---|---|---|
| `step_BoxCox()` | Learns the best power transform | Predictors are strictly positive and skewed |
| `step_YeoJohnson()` | Power transform that allows 0 and negatives | Data includes zeros or negative values |
| `step_log()` | Fixed log transform | You want a simple, fixed compression |
| `step_normalize()` | Centers and scales to z-scores | You need standardized, not reshaped, data |
| `step_range()` | Rescales to a fixed interval | A model needs inputs bounded in 0 to 1 |

The decision rule is short. Reach for `step_BoxCox()` when positive predictors are skewed, switch to `step_YeoJohnson()` the moment a column can be zero or negative, and use `step_normalize()` when the shape is fine but the scale is not.

## Common pitfalls

**Three mistakes catch most newcomers to step_BoxCox().** Each one below shows the problem and the fix.

The most common is feeding the step a column with non-positive values. Box-Cox is undefined at or below zero, so `prep()` fails to estimate a lambda and leaves the column as-is with a warning.

```r title="Non-positive data breaks Box-Cox"
bad_df <- data.frame(y = rnorm(60), z = rnorm(60))  # z has negatives

# Wrong: z contains negative values, lambda cannot be estimated
recipe(y ~ ., data = bad_df) |>
  step_BoxCox(all_numeric_predictors()) |>
  prep()
#> Warning: Box-Cox estimation failed for: z

# Right: Yeo-Johnson handles zeros and negatives
recipe(y ~ ., data = bad_df) |>
  step_YeoJohnson(all_numeric_predictors()) |>
  prep()
```

The second pitfall is forgetting to `prep()` before `bake()`. A recipe with a raw, unprepped `step_BoxCox()` has no lambdas, so `bake()` has nothing to apply. The third is selecting discrete or near-constant columns: if a column has fewer distinct values than `num_unique`, the step quietly skips it rather than fitting an unstable lambda.

[NOTE]
**step_BoxCox() lives in core recipes.** A plain `library(recipes)` call makes it available, and `library(tidymodels)` loads it too. Unlike modeling steps, it needs no extra engine package, because the lambda search runs inside recipes itself.

## Try it yourself

**Try it:** Add `step_BoxCox()` to a recipe for the `mtcars` data, transforming only the `disp` and `hp` columns, then prep it. Save the prepped recipe to `ex_prep`.

```r title="Your turn: Box-Cox on mtcars"
# Try it: transform disp and hp with step_BoxCox, then prep
ex_rec  <- # your code here
ex_prep <- # your code here

tidy(ex_prep, number = 1)
#> Expected: a 2-row tibble with lambdas for disp and hp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_BoxCox(disp, hp)

ex_prep <- prep(ex_rec, training = mtcars)

tidy(ex_prep, number = 1)
#> # A tibble: 2 x 3
#>   terms   value id
#>   <chr>   <dbl> <chr>
#> 1 disp    0.105 BoxCox_p7Lm3
#> 2 hp     -0.219 BoxCox_p7Lm3
```

**Explanation:** Naming `disp` and `hp` in `step_BoxCox()` limits the transformation to those two predictors. `prep()` estimates one lambda per column on the `mtcars` training data, and `tidy()` reads them back as a tibble.

</details>

## Related recipes functions

**step_BoxCox() works alongside the rest of the recipes preprocessing family.** These steps cover the neighboring tasks in a feature-engineering pipeline.

- `step_YeoJohnson()` applies a power transform that allows zero and negative values.
- `step_log()` applies a fixed log transform without estimating a parameter.
- `step_normalize()` centers and scales numeric predictors to z-scores.
- `step_range()` rescales numeric predictors into a fixed interval.
- `prep()` estimates every step's parameters from training data.

## FAQ

**What is the difference between step_BoxCox() and step_YeoJohnson()?**

Both estimate a power transformation that reshapes a skewed column toward normality. The difference is the input range they accept. `step_BoxCox()` requires every value to be strictly positive, because the Box-Cox formula is undefined at or below zero. `step_YeoJohnson()` uses an extended formula that handles zeros and negative values, so it is the safer default when a column can dip below zero, such as a profit or temperature measurement.

**Does step_BoxCox() work with negative values?**

No. A Box-Cox transformation is only defined for strictly positive data. If a selected column contains a zero or a negative number, `prep()` cannot estimate a lambda for it, leaves that column untransformed, and prints a warning. Either filter or shift the column so all values are positive, or switch to `step_YeoJohnson()`, which is built to accept the full real line.

**How do I see the lambda values step_BoxCox() chose?**

Call `tidy()` on the prepped recipe and pass the step number, as in `tidy(prepped_recipe, number = 1)`. The result is a tibble with one row per transformed column, where the `value` column holds the estimated lambda. A lambda near 0 means the transform behaves like a log, while a lambda near 1 means the column was barely changed.

**Should step_BoxCox() run before or after step_normalize()?**

Run `step_BoxCox()` first. Box-Cox reshapes a skewed distribution, and `step_normalize()` then centers and scales the reshaped values to mean 0 and standard deviation 1. Normalizing first would only shift and scale the original skewed shape, leaving the long tail in place, so the ordering matters for models that assume well-behaved predictors.

For the full argument reference, see the [recipes step_BoxCox() documentation](https://recipes.tidymodels.org/reference/step_BoxCox.html).
