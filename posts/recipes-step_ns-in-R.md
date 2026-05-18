---
title: "recipes step_ns() in R: Add Natural Spline Predictor Terms"
slug: recipes-step_ns-in-R
description: "Learn how recipes step_ns() in R adds natural spline terms to a tidymodels recipe, with runnable examples for deg_free, knots, multiple predictors, and naming."
keywords: "recipes step_ns, step_ns function R, recipes step_ns examples, natural splines R recipes, tidymodels spline terms, step_ns deg_free, natural spline recipe R"
mathjax: false
webr: true
date: "2026-05-19"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Linear-Regression.html
auto_link_terms: "step_ns()|recipes step_ns|recipes::step_ns()|step_ns in R|natural spline recipe step|step_ns terms"
auto_link_case_sensitive: true
target_keyword: "recipes step_ns"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_ns() in R: Add Natural Spline Predictor Terms

<p class="lead">The recipes step_ns() function adds natural spline terms to a tidymodels preprocessing recipe, expanding one numeric predictor into several columns that let a model fit a smooth, flexible curve. Because the spline stays linear beyond its outer knots, the fitted curve behaves well at the edges of the data.</p>

[QUICK ANSWER]
step_ns(rec, x)                              # default 2 df natural spline
step_ns(rec, x, deg_free = 4)                # 4 columns, more flexible
step_ns(rec, x, y, deg_free = 3)             # expand several predictors
step_ns(rec, x, keep_original_cols = TRUE)   # keep the input column
step_ns(rec, all_numeric_predictors())       # expand every numeric predictor
step_ns(rec, starts_with("hp"))              # select predictors by pattern

[DECISION TREE: Is step_ns() the right tool?]
- flexible curve with stable tails: step_ns(x, deg_free = 4)
- B-spline basis, free at edges: step_bs(x, deg_free = 4)
- smooth global polynomial curve: step_poly(x, degree = 2)
- multiply two predictors together: step_interact(~ a:b)
- fix a right-skewed predictor: step_log(x)
- center and scale predictors: step_normalize(all_numeric_predictors())

## What step_ns() does

**step_ns() expands one column into a natural spline basis.** It is a recipe step from the `recipes` package that takes a numeric predictor and replaces it with several columns describing a smooth, piecewise curve. A model fed those columns can bend its prediction without you building spline terms by hand.

A natural cubic spline splits the predictor range at interior knots. Between knots the curve is a cubic polynomial, and the pieces join smoothly where they meet. Beyond the outer knots the curve is forced to be a straight line, which keeps the tails from swinging wildly.

[KEY INSIGHT]
**A spline term is just a set of extra columns, not a new model.** step_ns() engineers a basis of derived features. A plain linear model still fits straight-line coefficients, but because the inputs now encode a flexible curve, the fitted prediction can follow a non-linear shape.

That edge constraint is the main reason to prefer step_ns() over a high-degree polynomial. A polynomial can wave dramatically near the smallest and largest values, while a natural spline stays linear there and extrapolates more sensibly.

## step_ns() syntax and arguments

**The step is short to write, and most calls only set deg_free.** You add it to a recipe pipeline after declaring variable roles with `recipe()`.

```r title="step_ns signature"
step_ns(
  recipe,
  ...,                        # selectors for numeric predictors
  role = "predictor",         # role for the new columns
  deg_free = 2,               # spline degrees of freedom
  options = list(),           # passed to splines::ns()
  keep_original_cols = FALSE  # drop the input column
)
```

The `...` argument takes one or more predictors, named directly or through selectors like `all_numeric_predictors()`. `deg_free` sets how many spline columns each predictor expands into, so a larger value allows a more flexible curve.

`options` is a list forwarded to `splines::ns()`. Pass `options = list(knots = ...)` to place interior knots yourself instead of at the default quantiles. `keep_original_cols` defaults to `FALSE`, so step_ns() removes the input column and leaves only the spline basis.

## step_ns() examples by use case

**Start with the default two-degree expansion.** Load `recipes`, declare a recipe, add the step, then `prep()` and `bake()` to inspect the result.

```r title="Default natural spline expansion"
library(recipes)

rec <- recipe(mpg ~ disp, data = mtcars) |>
  step_ns(disp, deg_free = 2)

baked <- rec |> prep() |> bake(new_data = NULL)
names(baked)
#> [1] "mpg"       "disp_ns_1" "disp_ns_2"
```

The `disp` column is gone and two new columns take its place. They are named with the predictor, a `_ns_` separator, and an index.

**Raise deg_free for a more flexible curve.** A higher value adds more spline columns and lets the fitted curve bend more often.

```r title="More degrees of freedom"
rec4 <- recipe(mpg ~ disp, data = mtcars) |>
  step_ns(disp, deg_free = 4)

names(prep(rec4) |> bake(new_data = NULL))
#> [1] "mpg"       "disp_ns_1" "disp_ns_2" "disp_ns_3" "disp_ns_4"
```

Four degrees of freedom produce four columns. Each extra column buys local flexibility, at the cost of more parameters for the model to estimate.

**Expand several predictors in one call.** List predictors in `...` and step_ns() applies the same deg_free to each.

```r title="Spline expansion of two predictors"
rec_multi <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_ns(disp, hp, deg_free = 3)

names(prep(rec_multi) |> bake(new_data = NULL))
#> [1] "mpg"       "disp_ns_1" "disp_ns_2" "disp_ns_3"
#> [5] "hp_ns_1"   "hp_ns_2"   "hp_ns_3"
```

Each predictor becomes three columns, so two predictors at three degrees of freedom yield six new features.

**Keep the original column when later steps still need it.** Set `keep_original_cols = TRUE` so the input survives alongside the basis.

```r title="Keep the input column"
rec_keep <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_ns(disp, deg_free = 2, keep_original_cols = TRUE)

names(prep(rec_keep) |> bake(new_data = NULL))
#> [1] "disp"      "hp"        "mpg"       "disp_ns_1" "disp_ns_2"
```

The `disp` column stays in place and the two spline columns are appended after the outcome.

## step_ns() vs step_poly() and step_bs()

**Three recipe steps add a non-linear basis, and they differ in how the curve behaves.** step_ns() is the choice when stable behavior at the edges of the data matters.

| Step | Basis | Edge behavior |
|---|---|---|
| `step_ns(x, deg_free = 4)` | natural cubic spline | linear beyond boundary knots, stable tails |
| `step_bs(x, deg_free = 4)` | B-spline | unconstrained, can swing at the edges |
| `step_poly(x, degree = 4)` | global polynomial | high degree oscillates near min and max |
| `step_interact(~ a:b)` | product of predictors | not a curve, captures combined effects |

Choose step_ns() for a flexible curve that extrapolates sensibly. Reach for step_bs() when you want the extra edge freedom of a B-spline, and step_poly() for a simple, smooth global bend.

[NOTE]
**Coming from Python?** The closest equivalent is `SplineTransformer` from scikit-learn, or the `cr()` natural-spline term in patsy. Both produce a spline basis you drop into a modeling pipeline, just as step_ns() feeds a tidymodels workflow.

## Common pitfalls

**Most step_ns() surprises come from the dropped column and the choice of deg_free.** Three mistakes show up repeatedly.

First, expecting the original predictor to remain. Because `keep_original_cols` defaults to `FALSE`, a later step that references `disp` by name fails after step_ns() runs. Set `keep_original_cols = TRUE` or reorder the recipe so dependent steps run first.

Second, setting deg_free too high. Many degrees of freedom chase noise and produce a wiggly fit that generalizes poorly. Start at 2 or 3, raise it only if validation error improves, and tune it as a hyperparameter when accuracy matters.

[WARNING]
**A spline cannot extrapolate a trend it never saw.** Beyond the boundary knots a natural spline is linear, so predictions for new data far outside the training range follow a straight line, not the curve. Make sure the training data covers the range you will predict on.

Third, applying step_ns() to a predictor with very few unique values. `splines::ns()` cannot place interior knots when a column takes only two or three distinct values, and `prep()` raises an error. Check the number of distinct values before choosing deg_free.

## Try it yourself

**Try it:** Build a recipe on mtcars predicting mpg from hp, expand hp into a natural spline with three degrees of freedom, and bake the data. Save the result to ex_baked.

```r title="Your turn: natural spline on hp"
# Try it: 3 df natural spline on hp
ex_baked <- # your code here

names(ex_baked)
#> Expected: includes "hp_ns_1", "hp_ns_2", "hp_ns_3"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_baked <- recipe(mpg ~ hp, data = mtcars) |>
  step_ns(hp, deg_free = 3) |>
  prep() |>
  bake(new_data = NULL)
names(ex_baked)
#> [1] "mpg"     "hp_ns_1" "hp_ns_2" "hp_ns_3"
```

**Explanation:** A deg_free of 3 expands `hp` into three natural spline columns. step_ns() drops the original `hp` column because `keep_original_cols` defaults to `FALSE`.

</details>

## Related recipes functions

**These steps pair naturally with step_ns() in a preprocessing recipe.** Each one handles a different feature-engineering need:

- `step_poly()` adds polynomial terms, a smoother global alternative to splines.
- `step_bs()` builds a B-spline basis when you want unconstrained edge behavior.
- `step_interact()` multiplies predictors into interaction terms when combined effects matter.
- `step_normalize()` centers and scales predictors, useful before other transformations.
- `recipe()` defines the variable roles every step operates on.

See the official [step_ns() reference](https://recipes.tidymodels.org/reference/step_ns.html) for the full argument list.

## FAQ

**What does step_ns() do in a recipes pipeline?**

step_ns() replaces a numeric predictor with a natural spline basis: several columns that together describe a smooth, piecewise curve. A model that receives those columns can fit a non-linear relationship while still estimating ordinary linear coefficients. The step drops the original predictor by default and appends the new columns after the outcome variable in the baked data.

**What is the difference between step_ns() and step_poly()?**

step_poly() builds a single global polynomial, so one set of coefficients describes the whole curve. step_ns() builds a piecewise cubic spline with knots, so the curve can bend locally without affecting distant regions. The big practical difference is the edges: a high-degree polynomial oscillates near the smallest and largest values, while a natural spline stays linear beyond its boundary knots and extrapolates more sensibly.

**How does step_ns() name its new columns?**

step_ns() names each output column with the predictor name, a `_ns_` separator, and an index. Expanding `disp` with `deg_free = 2` produces `disp_ns_1` and `disp_ns_2`. The index runs from 1 up to the deg_free value, so four degrees of freedom add `disp_ns_3` and `disp_ns_4` as well. Consistent naming lets downstream steps select the basis with patterns like `starts_with("disp_ns_")`.

**What value of deg_free should I use with step_ns()?**

Start with 2 or 3, which captures gentle curvature, and raise it only when cross-validation shows a real improvement. Each extra degree of freedom adds a column and a chance to overfit. When accuracy matters, treat deg_free as a tunable hyperparameter and let a resampling search pick it, rather than fixing the value by eye.

**Does step_ns() keep the original predictor column?**

No, not by default. `keep_original_cols` defaults to `FALSE`, so step_ns() removes the input column once it has built the spline basis. Set `keep_original_cols = TRUE` when a later recipe step or the model still needs the raw predictor. Otherwise the baked data returns only the expanded spline columns and the original is gone.
