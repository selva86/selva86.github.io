---
title: "recipes step_log() in R: Log-Transform Skewed Predictors"
slug: recipes-step_log-in-R
description: "recipes step_log() in R applies a log transformation to numeric predictors. Syntax, base and offset arguments, signed logs, examples, and common pitfalls."
keywords: "recipes step_log, step_log function R, recipes step_log examples, log transformation recipe R, step_log tidymodels, recipe log transform predictors, R log transform skew"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_log()|recipes step_log|recipes::step_log()|step_log|log transformation recipe"
auto_link_case_sensitive: true
target_keyword: recipes step_log
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_log() in R: Log-Transform Skewed Predictors

<p class="lead">The <code>recipes</code> <code>step_log()</code> function in R applies a log transformation to numeric predictors, compressing right-skewed columns so a model sees a more symmetric spread. You add it to a <code>recipe()</code>, finalize it with <code>prep()</code>, and apply it with <code>bake()</code>.</p>

[QUICK ANSWER]
step_log(rec, all_numeric_predictors())              # natural log of all predictors
step_log(rec, disp, hp)                              # log named columns
step_log(rec, all_numeric_predictors(), base = 10)   # log base 10
step_log(rec, all_numeric_predictors(), base = 2)    # log base 2
step_log(rec, units, offset = 1)                     # add 1 first, handles zeros
step_log(rec, amt, signed = TRUE)                    # signed log, handles negatives
prep(rec) |> bake(new_data = NULL)                   # apply the transform

[DECISION TREE: Is step_log() the right tool?]
- compress a right-skewed predictor: step_log(rec, all_numeric_predictors())
- find the best power transform automatically: step_BoxCox(rec, all_numeric_predictors())
- transform columns with zeros or negatives: step_YeoJohnson(rec, all_numeric_predictors())
- take the square root instead: step_sqrt(rec, all_numeric_predictors())
- rescale to mean 0 and SD 1: step_normalize(rec, all_numeric_predictors())
- apply any custom expression: step_mutate(rec, x = log1p(x))

## What step_log() does in R

**step_log() replaces each selected column with its logarithm.** During `bake()` it applies `log(x, base)` to every value, optionally adding an `offset` first. The default base is the natural constant `e`, so a plain `step_log()` call produces natural logs. The outcome variable is left alone when you select columns with `all_numeric_predictors()`.

Logging is the standard fix for a right-skewed predictor, where most values cluster low and a long tail stretches high. The transformation pulls that tail in, turning multiplicative spacing into additive spacing. Counts, prices, incomes, and population sizes are common candidates. Models that assume roughly symmetric inputs, such as linear regression, often fit better once a heavy tail is logged.

[KEY INSIGHT]
**step_log() is a static transformation, not a learned one.** Unlike `step_normalize()` or `step_BoxCox()`, it estimates nothing from the training set. The formula `log(x, base)` is fixed, so `prep()` only records which columns to touch. That makes the step fast and perfectly reproducible, but it also means a zero or negative value in new data will silently produce `-Inf` or `NaN`.

## step_log() syntax and arguments

**step_log() attaches a logarithm operation to a recipe.** You pass the recipe first, then the columns to transform, chosen with tidyselect helpers or bare names.

```r title="The step_log skeleton"
library(recipes)
library(tibble)

recipe(mpg ~ ., data = mtcars) |>
  step_log(all_numeric_predictors())
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:    1
#> predictor: 10
#> -- Operations
#> * Log transformation on: all_numeric_predictors()
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to transform, chosen with selectors or bare names. |
| `base` | Base of the logarithm. Default `exp(1)`, the natural log. |
| `offset` | Constant added to each value before the log. Default `0`. |
| `signed` | If `TRUE`, uses `sign(x) * log(abs(x))`; values in `(-1, 1)` map to `0`. |
| `columns` | Filled in by `prep()`; the resolved column names. |
| `skip` | If `TRUE`, the step is ignored when baking new data. Leave `FALSE`. |

## Log-transforming predictors: worked examples

**Build the recipe, prep it, then bake.** A recipe is a plan until `prep()` finalizes it. The first example takes the natural log of every numeric predictor in `mtcars`.

```r title="Log-transform numeric predictors"
rec <- recipe(mpg ~ ., data = mtcars) |>
  step_log(all_numeric_predictors())

logged <- prep(rec) |> bake(new_data = NULL)
round(head(logged[c("hp", "wt", "disp")]), 2)
#>     hp   wt disp
#> 1 4.70 0.96 5.08
#> 2 4.70 1.06 5.08
#> 3 4.53 0.84 4.68
#> 4 4.70 1.17 5.55
#> 5 5.16 1.24 5.89
#> 6 4.65 1.24 5.42
```

The outcome `mpg` keeps its original scale because `all_numeric_predictors()` excludes it. To log specific columns in a different base, name them and set `base`. Base 10 maps each order of magnitude to one unit, which many readers find easier to interpret.

```r title="Log base 10 instead of natural log"
rec10 <- recipe(mpg ~ ., data = mtcars) |>
  step_log(disp, hp, base = 10)

baked10 <- prep(rec10) |> bake(new_data = NULL)
round(head(baked10[c("disp", "hp")]), 3)
#>    disp    hp
#> 1 2.204 2.041
#> 2 2.204 2.041
#> 3 2.033 1.968
#> 4 2.412 2.041
#> 5 2.556 2.243
#> 6 2.352 2.021
```

The `offset` argument adds a constant before the log, the standard trick for columns that contain zeros. The log of zero is undefined, so `step_log(offset = 1)` behaves like the `log1p()` function and keeps every row finite.

```r title="Use offset to handle zeros"
sales <- tibble(units = c(0, 1, 5, 20, 100))

rec_off <- recipe(~ units, data = sales) |>
  step_log(units, offset = 1)

prep(rec_off) |> bake(new_data = NULL)
#> # A tibble: 5 x 1
#>   units
#>   <dbl>
#> 1 0
#> 2 0.693
#> 3 1.79
#> 4 3.04
#> 5 4.62
```

For columns that also hold negative values, set `signed = TRUE`. The signed log takes `sign(x) * log(abs(x))` and maps any value between -1 and 1 to 0, so the result stays finite across the whole real line.

```r title="Signed log for negative values"
balance <- tibble(amt = c(-100, -1, 0, 1, 100))

rec_signed <- recipe(~ amt, data = balance) |>
  step_log(amt, signed = TRUE)

prep(rec_signed) |> bake(new_data = NULL)
#> # A tibble: 5 x 1
#>     amt
#>   <dbl>
#> 1 -4.61
#> 2  0
#> 3  0
#> 4  0
#> 5  4.61
```

## step_log() vs step_BoxCox() vs step_YeoJohnson()

**Pick the step that matches your data and your goal.** All three reduce skew, but they differ in how much they estimate and what input values they tolerate.

| Step | What it does | Handles zeros or negatives |
|---|---|---|
| `step_log()` | Applies a fixed `log(x, base)` | Only with `offset` or `signed` |
| `step_BoxCox()` | Estimates the best power transform | No, needs strictly positive data |
| `step_YeoJohnson()` | Estimates a power transform | Yes, defined for all real values |
| `step_sqrt()` | Applies a fixed square root | Needs non-negative data |

Use `step_log()` when you already know a log makes sense and you want a transformation that is fast, fixed, and easy to explain. Reach for `step_BoxCox()` or `step_YeoJohnson()` when you would rather let the data choose the exponent, and `step_YeoJohnson()` specifically when the column has zeros or negatives. The estimated steps are more flexible but harder to communicate, since the fitted power is rarely a round number.

[TIP]
**Choose the base for interpretability, not just habit.** Base 2 turns each unit of the logged column into a doubling, which suits engagement counts and biological growth. Base 10 lines up with orders of magnitude, handy for prices and populations. The natural log is the default and is fine for modeling, since base only rescales the column by a constant.

## Common pitfalls with step_log()

**Most step_log() bugs trace back to invalid inputs or the wrong column set.** Because the transformation is static, recipes will not warn you before producing a broken column.

1. **Zeros and negatives.** `log(0)` is `-Inf` and `log(-1)` is `NaN`. A predictor with either value needs `offset` to shift it positive or `signed = TRUE` to use the signed variant.
2. **Transforming the outcome by accident.** `all_numeric()` includes the response variable. Use `all_numeric_predictors()` so the model still trains and predicts on the untransformed target.
3. **New data with unexpected values.** Training data may be all positive while a later batch contains a zero. `step_log()` will not error; it will quietly emit `-Inf` and corrupt the prediction. Validate new data or build the offset in from the start.

[WARNING]
**A logged column with `-Inf` will not stop the pipeline.** `bake()` returns the infinite value, the model receives it, and the failure surfaces far downstream as an unexplained `NA` prediction. Inspect the range of every logged predictor right after `prep()`.

## Try it yourself

**Try it:** Log-transform the `disp` column of `mtcars` using base 10 in a recipe, prep it, and save the baked result to `ex_logged`.

```r title="Your turn: log base 10"
# Try it: log10 transform disp
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_log(# your code here)

ex_logged <- # your code here

round(head(ex_logged$disp, 3), 3)
#> Expected: first values near 2.204
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_log(disp, base = 10)

ex_logged <- prep(ex_rec) |> bake(new_data = NULL)
round(head(ex_logged$disp, 3), 3)
#> [1] 2.204 2.204 2.033
```

**Explanation:** Passing `disp` and `base = 10` limits the step to one column and switches the logarithm base. After `prep()` and `bake()`, the `disp` values are replaced by their base-10 logs, so the first entry of 160 becomes about 2.204.

</details>

## Related recipes steps

**step_log() is one of several recipes transformation steps.** These pair naturally with it in a tidymodels workflow:

- [step_BoxCox()](recipes-step_BoxCox-in-R.html) estimates the best power transform for positive data.
- [step_YeoJohnson()](recipes-step_YeoJohnson-in-R.html) estimates a power transform that allows zeros and negatives.
- [step_sqrt()](recipes-step_sqrt-in-R.html) applies a fixed square-root transform.
- [step_normalize()](recipes-step_normalize-in-R.html) centers and scales to mean 0 and SD 1.
- [recipe()](recipes-recipe-in-R.html) creates the preprocessing object every step attaches to.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_log()` is `np.log(df)`, or `np.log1p(df)` when the column contains zeros. The recipes version differs by attaching the transform to a reusable recipe, so the same logic runs on training and new data without copy-pasting.

## FAQ

**What does step_log() do in the recipes package?**

`step_log()` adds a log transformation to a recipe. When you `bake()` the prepped recipe, every value in the selected columns is replaced by `log(x, base)`, optionally after adding an `offset`. The default base is `e`, the natural log. It is most often used to compress right-skewed numeric predictors so models that assume symmetric inputs fit more reliably. Because it is a static transform, it estimates nothing from the data and runs identically on training and new rows.

**How do I take a log transform of zeros with step_log()?**

The log of zero is `-Inf`, so a column with zeros needs the `offset` argument. Setting `step_log(units, offset = 1)` adds 1 to every value before the log, exactly like the `log1p()` function, which keeps zero rows finite at `log(1) = 0`. If the column also has negative values, use `signed = TRUE` instead, which applies `sign(x) * log(abs(x))` and maps values between -1 and 1 to 0.

**Should I use step_log() or step_BoxCox()?**

Use `step_log()` when you already know a log is appropriate and want a fixed, transparent transformation that is easy to explain to others. Use `step_BoxCox()` when you would rather let the data choose the exponent automatically. Box-Cox estimates a power that best symmetrizes each column, which can fit better but produces a non-round exponent that is harder to communicate. Box-Cox also requires strictly positive data, while `step_log()` can handle zeros and negatives through `offset` and `signed`.

**Does step_log() transform the outcome variable?**

Not if you select columns with `all_numeric_predictors()`, which excludes the response. If you use `all_numeric()` instead, the outcome is included and gets logged too, which is rarely what you want. To log the response on purpose, name it explicitly and remember that predictions then come back on the log scale and must be exponentiated to return to the original units.
</content>
</invoke>
