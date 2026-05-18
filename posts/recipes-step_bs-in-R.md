---
title: "recipes step_bs() in R: B-Spline Basis Expansion"
slug: recipes-step_bs-in-R
description: "Learn how recipes step_bs() in R builds a B-spline basis for a numeric predictor in a tidymodels recipe, with runnable examples for deg_free and degree."
keywords: "recipes step_bs, step_bs function R, recipes step_bs examples, B-spline basis R, tidymodels spline terms, step_bs deg_free, step_bs degree"
mathjax: false
webr: true
date: "2026-05-19"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Linear-Regression.html
auto_link_terms: "step_bs()|recipes step_bs|recipes::step_bs()|step_bs in R|B-spline basis recipe|step_bs terms"
auto_link_case_sensitive: true
target_keyword: "recipes step_bs"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_bs() in R: B-Spline Basis Expansion

<p class="lead">The recipes step_bs() function builds a B-spline basis for a numeric predictor in a tidymodels recipe, expanding one column into several that let a model fit a smooth, flexible curve. A B-spline puts no constraint on the curve beyond its outer knots, so it stays free to bend near the edges of the data.</p>

[QUICK ANSWER]
step_bs(rec, x)                              # default cubic B-spline, 3 df
step_bs(rec, x, deg_free = 5)                # 5 columns, more flexible
step_bs(rec, x, degree = 2)                  # quadratic pieces, not cubic
step_bs(rec, x, y, deg_free = 4)             # expand several predictors
step_bs(rec, x, keep_original_cols = TRUE)   # keep the input column
step_bs(rec, all_numeric_predictors())       # expand every numeric predictor

[DECISION TREE: Is step_bs() the right tool?]
- flexible B-spline curve, free edges: step_bs(x, deg_free = 5)
- spline with stable linear tails: step_ns(x, deg_free = 4)
- smooth global polynomial curve: step_poly(x, degree = 2)
- multiply two predictors together: step_interact(~ a:b)
- fix a right-skewed predictor: step_log(x)
- center and scale predictors: step_normalize(all_numeric_predictors())

## What step_bs() does

**step_bs() expands one column into a B-spline basis.** It is a recipe step from the `recipes` package that replaces a numeric predictor with several columns describing a smooth, piecewise-polynomial curve. A model fed those columns can bend its prediction without you constructing spline terms by hand.

A B-spline, short for basis spline, splits the predictor range at interior knots. On each interval the curve is a polynomial of a chosen degree, and neighbouring pieces join smoothly where they meet. Unlike a natural spline, a B-spline places no constraint on the curve beyond the outer knots, so it keeps full freedom at the edges of the data.

[KEY INSIGHT]
**Two arguments control the basis: degree and deg_free.** `degree` sets the polynomial order of each piece, cubic by default. `deg_free` sets how many columns the predictor expands into. Together they decide how flexible the fitted curve can be.

## step_bs() syntax and arguments

**Most calls only set deg_free, and sometimes degree.** You add step_bs() to a recipe pipeline after declaring variable roles with `recipe()`.

```r title="step_bs signature"
step_bs(
  recipe,
  ...,                        # selectors for numeric predictors
  role = "predictor",         # role for the new columns
  deg_free = NULL,            # number of spline columns
  degree = 3,                 # polynomial degree per piece
  options = list(),           # passed to splines::bs()
  keep_original_cols = FALSE  # drop the input column
)
```

The `...` argument takes one or more predictors, named directly or through selectors like `all_numeric_predictors()`. `deg_free` controls how many spline columns each predictor produces. When it is left at `NULL`, step_bs() falls back to the value of `degree`, so a default call yields three columns.

`degree` sets the polynomial order on each interval. The default 3 gives cubic pieces, the most common choice; lower it to 2 or 1 for stiffer, simpler segments. `options` is a list forwarded to `splines::bs()`, where you can pass `knots` to place interior knots yourself instead of at the default quantiles. `keep_original_cols` defaults to `FALSE`, so step_bs() drops the input column and keeps only the basis.

## step_bs() examples by use case

**Start with the default cubic expansion.** Load `recipes`, declare a recipe, add the step, then `prep()` and `bake()` to inspect the result.

```r title="Default B-spline expansion"
library(recipes)

rec <- recipe(mpg ~ disp, data = mtcars) |>
  step_bs(disp)

baked <- rec |> prep() |> bake(new_data = NULL)
names(baked)
#> [1] "mpg"       "disp_bs_1" "disp_bs_2" "disp_bs_3"
```

The `disp` column is gone and three new columns take its place. They are named with the predictor, a `_bs_` separator, and an index. Three columns appear because `deg_free` is `NULL` and `degree` is 3.

**Raise deg_free for a more flexible curve.** A higher value adds more spline columns and lets the fitted curve bend more often.

```r title="More degrees of freedom"
rec5 <- recipe(mpg ~ disp, data = mtcars) |>
  step_bs(disp, deg_free = 5)

names(prep(rec5) |> bake(new_data = NULL))
#> [1] "mpg"       "disp_bs_1" "disp_bs_2" "disp_bs_3" "disp_bs_4"
#> [6] "disp_bs_5"
```

Five degrees of freedom produce five columns, whatever the polynomial degree. Each extra column buys local flexibility, at the cost of more parameters for the model to estimate.

**Lower the degree for stiffer polynomial pieces.** The `degree` argument changes the shape of each segment without changing the column count, which `deg_free` still controls.

```r title="Quadratic B-spline pieces"
rec_q <- recipe(mpg ~ disp, data = mtcars) |>
  step_bs(disp, degree = 2, deg_free = 4)

names(prep(rec_q) |> bake(new_data = NULL))
#> [1] "mpg"       "disp_bs_1" "disp_bs_2" "disp_bs_3" "disp_bs_4"
```

Four columns appear because `deg_free` is 4. Setting `degree = 2` makes each piece a quadratic rather than a cubic, so the curve is a little less wiggly between knots.

**Expand several predictors in one call.** List predictors in `...` and step_bs() applies the same settings to each.

```r title="B-spline expansion of two predictors"
rec_multi <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_bs(disp, hp, deg_free = 3)

names(prep(rec_multi) |> bake(new_data = NULL))
#> [1] "mpg"       "disp_bs_1" "disp_bs_2" "disp_bs_3"
#> [5] "hp_bs_1"   "hp_bs_2"   "hp_bs_3"
```

Each predictor becomes three columns, so two predictors at three degrees of freedom yield six new features.

## step_bs() vs step_ns() and step_poly()

**Three recipe steps add a non-linear basis, and they differ in how the curve behaves at the edges.** step_bs() is the choice when you want maximum flexibility, including near the smallest and largest predictor values.

| Step | Basis | Edge behavior |
|---|---|---|
| `step_bs(x, deg_free = 5)` | B-spline | unconstrained, free to swing at the edges |
| `step_ns(x, deg_free = 4)` | natural cubic spline | linear beyond boundary knots, stable tails |
| `step_poly(x, degree = 4)` | global polynomial | one curve, high degree oscillates near min and max |
| `step_interact(~ a:b)` | product of predictors | not a curve, captures combined effects |

The practical contrast is at the boundaries. A B-spline is free to follow the data right up to the outer knots, which helps when the relationship really does curve near the extremes. A natural spline trades that freedom for a straight-line tail that extrapolates more safely. step_poly() fits a single global polynomial, simple but prone to oscillation at high degree.

[NOTE]
**Coming from Python?** The closest equivalent is `SplineTransformer` from scikit-learn, or the `bs()` B-spline term in patsy. Both build a B-spline basis you drop into a modeling pipeline, just as step_bs() feeds a tidymodels workflow.

## Common pitfalls

**Most step_bs() surprises come from the dropped column and from over-flexing the basis.** Three mistakes show up repeatedly.

First, expecting the original predictor to remain. Because `keep_original_cols` defaults to `FALSE`, a later step that references `disp` by name fails after step_bs() runs. Set `keep_original_cols = TRUE` or reorder the recipe so dependent steps run first.

```r title="Keep the input column"
rec_keep <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_bs(disp, deg_free = 2, keep_original_cols = TRUE)

names(prep(rec_keep) |> bake(new_data = NULL))
#> [1] "disp"      "hp"        "mpg"       "disp_bs_1" "disp_bs_2"
```

Second, setting deg_free too high. A B-spline has no edge constraint, so a large deg_free can swing wildly near the extremes and chase noise. Start at 3 or 4 and raise it only if validation error improves.

[WARNING]
**A B-spline cannot extrapolate beyond its outer knots safely.** Predictions for new data outside the training range rely on an unconstrained polynomial tail and can be wildly off. Make sure the training data covers the range you will predict on.

Third, applying step_bs() to a predictor with very few unique values. `splines::bs()` cannot place interior knots when a column takes only two or three distinct values, and `prep()` raises an error. Check the distinct count before choosing deg_free.

## Try it yourself

**Try it:** Build a recipe on mtcars predicting mpg from hp, expand hp into a B-spline with five degrees of freedom, and bake the data. Save the result to ex_baked.

```r title="Your turn: B-spline on hp"
# Try it: 5 df B-spline on hp
ex_baked <- # your code here

names(ex_baked)
#> Expected: includes "hp_bs_1" through "hp_bs_5"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_baked <- recipe(mpg ~ hp, data = mtcars) |>
  step_bs(hp, deg_free = 5) |>
  prep() |>
  bake(new_data = NULL)
names(ex_baked)
#> [1] "mpg"     "hp_bs_1" "hp_bs_2" "hp_bs_3" "hp_bs_4"
#> [6] "hp_bs_5"
```

**Explanation:** A deg_free of 5 expands `hp` into five B-spline columns. step_bs() drops the original `hp` column because `keep_original_cols` defaults to `FALSE`.

</details>

## Related recipes functions

**These steps pair naturally with step_bs() in a preprocessing recipe.** Each one handles a different feature-engineering need:

- `step_ns()` builds a natural spline basis when you want stable, linear tails.
- `step_poly()` adds polynomial terms, a smoother global alternative to splines.
- `step_interact()` multiplies predictors into interaction terms when combined effects matter.
- `step_normalize()` centers and scales predictors, useful before other transformations.
- `recipe()` defines the variable roles every step operates on.

See the official [step_bs() reference](https://recipes.tidymodels.org/reference/step_bs.html) for the full argument list.

## FAQ

**What does step_bs() do in a recipes pipeline?**

step_bs() replaces a numeric predictor with a B-spline basis: several columns that together describe a smooth, piecewise-polynomial curve. A model that receives those columns can fit a non-linear relationship while still estimating ordinary linear coefficients. The step drops the original predictor by default and appends the new columns after the outcome variable in the baked data.

**What is the difference between step_bs() and step_ns()?**

Both expand a predictor into a spline basis, but they differ at the edges. step_bs() builds an unconstrained B-spline that is free to curve right up to the outer knots. step_ns() builds a natural spline that is forced to be linear beyond its boundary knots. Use step_bs() when the relationship genuinely bends near the extremes, and step_ns() when you want safer, more stable extrapolation.

**How many columns does step_bs() create?**

The column count equals `deg_free`. When `deg_free` is left at its `NULL` default, step_bs() falls back to the value of `degree`, so a plain `step_bs(x)` call produces three columns. Setting `deg_free = 5` always yields five columns, whatever the `degree`. The new columns are named with the predictor, a `_bs_` separator, and an index running from 1.

**What value of deg_free should I use with step_bs()?**

Start with 3 or 4, which captures gentle curvature, and raise it only when cross-validation shows a real improvement. A B-spline has no edge constraint, so a large deg_free can overfit and swing near the extremes. When accuracy matters, treat deg_free as a tunable hyperparameter and let a resampling search pick it rather than fixing the value by eye.
