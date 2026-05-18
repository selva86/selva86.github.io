---
title: "recipes step_YeoJohnson() in R: Transform Skewed Data"
slug: recipes-step_YeoJohnson-in-R
description: "recipes step_YeoJohnson() in R applies a Yeo-Johnson power transformation that reshapes skewed predictors, including columns with zeros and negative values."
keywords: "recipes step_YeoJohnson, step_YeoJohnson function R, recipes step_YeoJohnson examples, Yeo-Johnson transformation R, step_YeoJohnson tidymodels, Yeo-Johnson power transform"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "step_YeoJohnson()|recipes step_YeoJohnson|recipes::step_YeoJohnson()|Yeo-Johnson transformation|Yeo-Johnson transformation in R"
auto_link_case_sensitive: true
target_keyword: "recipes step_YeoJohnson"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_YeoJohnson() in R: Transform Skewed Data

<p class="lead">The recipes <code>step_YeoJohnson()</code> function applies a Yeo-Johnson power transformation that reshapes skewed predictors toward a more normal distribution. Unlike Box-Cox, it accepts zeros and negative values, so it works on the full real line.</p>

[QUICK ANSWER]
step_YeoJohnson(rec, all_numeric_predictors())   # transform every numeric predictor
step_YeoJohnson(rec, profit, sensor)             # transform named columns only
step_YeoJohnson(rec, limits = c(-3, 3))          # narrow the lambda search range
step_YeoJohnson(rec, num_unique = 10)            # require 10+ unique values
step_YeoJohnson(rec, na_rm = TRUE)               # drop NAs before estimating lambda
prep(rec) |> tidy(number = 1)                    # view the estimated lambdas
recipe(y ~ ., data = df) |> step_YeoJohnson(...) # add the step inside a recipe

[DECISION TREE: Is step_YeoJohnson() the right tool?]
- reshape skewed data with negatives: step_YeoJohnson(rec, all_numeric_predictors())
- predictors are strictly positive: step_BoxCox(rec, all_numeric_predictors())
- just compress a long right tail: step_log(rec, x, base = 10)
- center and scale to z-scores: step_normalize(rec, all_numeric_predictors())
- squeeze values into a 0 to 1 range: step_range(rec, all_numeric_predictors())
- bin a numeric column instead: step_discretize(rec, x)

## What step_YeoJohnson() does

**step_YeoJohnson() adds a Yeo-Johnson transformation step to a recipe.** It does not change any data at the moment you call it. The step records which columns to transform, and the per-column power parameters are estimated later, when `prep()` runs on the training data.

The transformation raises each value to a power, lambda, chosen to make the column as close to normal as possible. It extends Box-Cox with a separate formula branch for values at or below zero, so one column can mix negatives, zeros, and positives and still receive a consistent transform.

Because the lambda is learned once on the training set and then frozen, `bake()` applies the exact same transformation to test data or new observations. That separation is what keeps a tidymodels workflow free of data leakage.

[KEY INSIGHT]
**Yeo-Johnson extends Box-Cox across zero.** The formula switches branches at the sign of each value, so one estimated lambda can reshape a column that holds negatives, zeros, and positives at the same time. That single property is the entire reason to reach for `step_YeoJohnson()` over `step_BoxCox()`.

## step_YeoJohnson() syntax and arguments

**step_YeoJohnson() takes column selectors plus a few tuning arguments.** The selectors decide which columns to transform, and the remaining arguments control how the lambda search behaves.

```r title="The step_YeoJohnson specification skeleton"
library(recipes)

step_YeoJohnson(
  recipe,                      # the recipe object the step is added to
  ...,                         # columns to transform (tidyselect selectors)
  role = NA,                   # role for new columns; rarely changed
  trained = FALSE,             # set to TRUE internally after prep()
  lambdas = NULL,              # estimated lambdas; NULL until prep() runs
  limits = c(-5, 5),           # range searched for the lambda parameter
  num_unique = 5,              # minimum distinct values needed to transform
  na_rm = TRUE,                # drop NAs while estimating each lambda
  skip = FALSE,                # if TRUE, skip this step when baking new data
  id = rand_id("YeoJohnson")   # unique step identifier
)
```

The `...` argument accepts any tidyselect selector, so `all_numeric_predictors()` or bare column names work. The `limits` argument bounds the lambda search, and `num_unique` guards against transforming near-constant or discrete columns. You rarely set `lambdas` or `trained` by hand, because `prep()` fills them in.

## Transform skewed data: four examples

**Every example builds its data inside the code block.** The columns are deliberately skewed and include negative values, so the Yeo-Johnson effect is easy to see.

### Example 1: Measure skew on data that has negatives

**Start by confirming the predictors are skewed and dip below zero.** A small skewness helper and `range()` together show why Box-Cox is not an option here.

```r title="Create skewed data with negatives"
library(recipes)

set.seed(42)
skewed_df <- data.frame(
  y      = rnorm(200),
  profit = rgamma(200, shape = 2, rate = 0.3) - 4,   # right-skewed, has negatives
  sensor = rexp(200, rate = 0.5) - 1                 # right-skewed, has negatives
)

skewness <- function(x) mean((x - mean(x))^3) / sd(x)^3
sapply(skewed_df[c("profit", "sensor")], skewness)
#>   profit   sensor
#>     1.41     2.06

range(skewed_df$profit)
#> [1] -3.92 21.74
```

Both predictors have a strong positive skew, and `profit` runs well into negative territory. A Box-Cox transformation cannot touch a column with negative values, which makes this a natural job for `step_YeoJohnson()`.

### Example 2: Add step_YeoJohnson() to a recipe

**Build a recipe and attach the step with a selector.** The `all_numeric_predictors()` selector picks every numeric predictor and leaves the outcome `y` untouched.

```r title="Add step_YeoJohnson to a recipe"
yj_rec <- recipe(y ~ ., data = skewed_df) |>
  step_YeoJohnson(all_numeric_predictors())

yj_rec
#> -- Recipe ----------------------------------------------------------
#>
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 2
#>
#> -- Operations
#> * Yeo-Johnson transformation on: all_numeric_predictors()
```

The printout confirms one outcome and two predictors, with a single Yeo-Johnson operation queued. No lambdas exist yet, because the recipe has not been prepped.

### Example 3: Prep, bake, and recheck the skew

**prep() estimates the lambdas and bake() applies them.** Re-measuring skewness on the baked data shows how far the transformation moved each column.

```r title="Prep bake and recheck skewness"
yj_prep  <- prep(yj_rec, training = skewed_df)
yj_baked <- bake(yj_prep, new_data = NULL)

sapply(yj_baked[c("profit", "sensor")], skewness)
#>   profit   sensor
#>    -0.03     0.05
```

Both columns now have a skewness near 0, meaning the long right tails are gone and the distributions are close to symmetric. The `new_data = NULL` argument tells `bake()` to return the already-prepped training data.

### Example 4: Inspect the estimated lambdas

**tidy() reveals the lambda chosen for each column.** Pass the step number to pull its estimated parameters.

```r title="View the estimated lambdas"
tidy(yj_prep, number = 1)
#> # A tibble: 2 x 3
#>   terms   value id
#>   <chr>   <dbl> <chr>
#> 1 profit  0.512 YeoJohnson_q3Lm8
#> 2 sensor  0.244 YeoJohnson_q3Lm8
```

Each `value` is the lambda fitted for that column. Both lie below 1, so the transformation compresses the long right tail rather than stretching it. These frozen lambdas are exactly what `bake()` reuses on any future data.

[TIP]
**Run step_YeoJohnson() before step_normalize(), not after.** Yeo-Johnson fixes the shape of a distribution, while normalization rescales it to mean 0 and standard deviation 1. Reshaping first, then rescaling, hands downstream models well-behaved, standardized predictors.

## step_YeoJohnson() vs other transformation steps

**recipes ships several transformation steps that overlap with Yeo-Johnson.** Each one suits a different data condition, so the right choice depends on the column in front of you.

| Step | What it does | Use when |
|---|---|---|
| `step_YeoJohnson()` | Power transform across the full real line | Skewed data with zeros or negatives |
| `step_BoxCox()` | Power transform for positive data only | Predictors are strictly positive and skewed |
| `step_log()` | Fixed log transform | A simple, fixed compression is enough |
| `step_sqrt()` | Fixed square-root transform | Mild right skew in non-negative counts |
| `step_normalize()` | Centers and scales to z-scores | The shape is fine but the scale is not |

The decision rule is short. Use `step_YeoJohnson()` when a skewed column can be zero or negative, `step_BoxCox()` when every value is strictly positive, and `step_normalize()` when only the scale needs fixing.

[NOTE]
**Coming from Python scikit-learn?** The equivalent of `step_YeoJohnson()` is `PowerTransformer(method="yeo-johnson")`. Both estimate one lambda per feature by maximum likelihood and both default to the Yeo-Johnson family, so a recipe step ports across the two ecosystems with almost no change in behavior.

## Common pitfalls

**Three mistakes catch most newcomers to step_YeoJohnson().** Each one below shows the problem and the fix.

The most common is selecting a non-numeric column. Yeo-Johnson is a numeric transformation, so a factor or character column passed to the step makes `prep()` fail rather than silently skip.

```r title="A factor column breaks the step"
bad_df <- data.frame(y = rnorm(60), grp = factor(sample(c("a", "b"), 60, TRUE)))

# Wrong: all_predictors() also grabs the factor column grp
recipe(y ~ ., data = bad_df) |>
  step_YeoJohnson(all_predictors()) |>
  prep()
#> Error in `step_YeoJohnson()`:
#> ! All columns selected for the step should be double or integer.

# Right: all_numeric_predictors() excludes the factor automatically
recipe(y ~ ., data = bad_df) |>
  step_YeoJohnson(all_numeric_predictors()) |>
  prep()
```

The second pitfall is forgetting to `prep()` before `bake()`. A recipe holding a raw, unprepped `step_YeoJohnson()` has no lambdas, so `bake()` has nothing to apply. The third is treating the output as interpretable: the transformed column sits on a power scale, not its original units, so report model results on a back-transformed scale.

[WARNING]
**Yeo-Johnson is not an outlier fix.** The transformation reshapes the bulk of a distribution toward normality, but an extreme outlier stays extreme after transforming. If a column has genuine outliers, handle them with a dedicated step such as `step_mutate()` or filtering before you reach for `step_YeoJohnson()`.

## Try it yourself

**Try it:** Build a recipe for a data frame `ex_df` whose `score` column contains negative values. Add `step_YeoJohnson()` to transform `score`, prep it, and read back the estimated lambda. Save the prepped recipe to `ex_prep`.

```r title="Your turn Yeo-Johnson with negatives"
ex_df <- data.frame(y = rnorm(80), score = rgamma(80, shape = 2, rate = 0.5) - 5)

# Try it: transform score with step_YeoJohnson, then prep
ex_rec  <- # your code here
ex_prep <- # your code here

tidy(ex_prep, number = 1)
#> Expected: a 1-row tibble with the lambda for score
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(y ~ ., data = ex_df) |>
  step_YeoJohnson(score)

ex_prep <- prep(ex_rec, training = ex_df)

tidy(ex_prep, number = 1)
#> # A tibble: 1 x 3
#>   terms value id
#>   <chr> <dbl> <chr>
#> 1 score 0.508 YeoJohnson_8xK2p
```

**Explanation:** The `score` column includes negative values, so Box-Cox could not transform it. Yeo-Johnson estimates a single lambda that reshapes the column across zero, and `tidy()` reads that lambda back as a tibble.

</details>

## Related recipes functions

**step_YeoJohnson() works alongside the rest of the recipes preprocessing family.** These steps cover the neighboring tasks in a feature-engineering pipeline.

- `step_BoxCox()` applies a power transform for strictly positive predictors.
- `step_log()` applies a fixed log transform without estimating a parameter.
- `step_normalize()` centers and scales numeric predictors to z-scores.
- `step_range()` rescales numeric predictors into a fixed interval.
- `prep()` estimates every step's parameters from training data.

## FAQ

**Can step_YeoJohnson() handle negative and zero values?**

Yes, and that is its defining feature. The Yeo-Johnson transformation uses an extended formula with a separate branch for values at or below zero, so a column can mix negative, zero, and positive numbers and still receive one consistent power transform. This is the key difference from `step_BoxCox()`, which is undefined for any value that is not strictly positive. For predictors like profit or temperature that routinely dip below zero, `step_YeoJohnson()` is the safe default.

**What is the difference between step_YeoJohnson() and step_BoxCox()?**

Both estimate a power transformation that reshapes a skewed column toward normality, and for strictly positive data they behave almost identically. The difference is the input range they accept. `step_BoxCox()` requires every value to be greater than zero, while `step_YeoJohnson()` works across the full real line. If you are unsure whether a column will ever contain zeros or negatives, choosing Yeo-Johnson avoids a silent skipped transformation later.

**Should step_YeoJohnson() run before or after step_normalize()?**

Run `step_YeoJohnson()` first. Yeo-Johnson reshapes a skewed distribution, and `step_normalize()` then centers and scales the reshaped values to mean 0 and standard deviation 1. Normalizing first would only shift and scale the original skewed shape, leaving the long tail intact, so the order matters for any model that assumes well-behaved predictors.

**How do I reverse a Yeo-Johnson transformation?**

recipes does not ship a built-in inverse for `step_YeoJohnson()`, because the step is meant for predictors that feed a model rather than values you report directly. You rarely need to invert a predictor. If you transformed an outcome variable and need predictions on the original scale, apply the inverse Yeo-Johnson formula by hand using the lambda from `tidy()`, or keep the outcome untransformed and let the model handle the skew.

For the full argument reference, see the [step_YeoJohnson() documentation](https://recipes.tidymodels.org/reference/step_YeoJohnson.html).
