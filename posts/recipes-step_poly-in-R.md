---
title: "recipes step_poly() in R: Add Polynomial Predictor Terms"
slug: recipes-step_poly-in-R
description: "Learn how recipes step_poly() in R adds orthogonal polynomial terms to a tidymodels recipe, with runnable examples for degree, raw powers, and naming."
keywords: "recipes step_poly, step_poly function R, recipes step_poly examples, polynomial features R recipes, tidymodels polynomial terms, orthogonal polynomial recipe R, step_poly degree"
mathjax: false
webr: true
date: "2026-05-19"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Linear-Regression.html
auto_link_terms: "step_poly()|recipes step_poly|recipes::step_poly()|step_poly in R|polynomial recipe step|step_poly terms"
auto_link_case_sensitive: true
target_keyword: "recipes step_poly"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_poly() in R: Add Polynomial Predictor Terms

<p class="lead">The recipes step_poly() function adds polynomial terms to a tidymodels preprocessing recipe, expanding one numeric predictor into several columns that let a model fit a curved relationship. By default it builds orthogonal polynomials, which stay uncorrelated and stable.</p>

[QUICK ANSWER]
step_poly(rec, x)                              # degree-2 orthogonal (default)
step_poly(rec, x, degree = 3)                  # cubic expansion
step_poly(rec, x, y, degree = 2)               # expand several predictors
step_poly(rec, x, options = list(raw = TRUE))  # raw powers x, x^2
step_poly(rec, x, keep_original_cols = TRUE)   # keep the input column
step_poly(rec, all_numeric_predictors())       # expand every numeric

[DECISION TREE: Is step_poly() the right tool?]
- add curvature to one numeric predictor: step_poly(x, degree = 2)
- flexible non-linear curves with knots: step_ns(x, deg_free = 4)
- multiply two predictors together: step_interact(~ a:b)
- log or power transform for skew: step_log(x)
- reduce many correlated columns: step_pca(all_numeric_predictors())
- center and scale before modeling: step_normalize(all_numeric_predictors())

## What step_poly() does

**step_poly() turns one column into a polynomial basis.** It is a recipe step from the `recipes` package that takes a numeric predictor and replaces it with several columns: the first captures the linear trend, the second the quadratic curve, and so on up to the requested degree.

A straight line cannot describe every relationship. Fuel economy may fall fast as engine size grows, then level off. step_poly() gives a linear model the columns it needs to bend, without you computing `x^2` and `x^3` by hand.

[KEY INSIGHT]
**A polynomial term is just an extra column, not a new model.** step_poly() engineers a basis of derived features. A plain linear model still fits straight-line coefficients, but because the inputs now include curved components, the fitted prediction can curve.

By default the step produces orthogonal polynomials. These columns are mathematically uncorrelated, so adding a quadratic term does not distort the linear coefficient. Raw powers like `x` and `x^2` are highly correlated and can make a fit unstable.

## step_poly() syntax and arguments

**The step is short to write and most calls only set the degree.** You add it to a recipe pipeline after declaring variable roles with `recipe()`.

```r title="step_poly signature"
step_poly(
  recipe,
  ...,                        # selectors for numeric predictors
  role = "predictor",         # role for the new columns
  degree = 2,                 # highest polynomial degree
  options = list(),           # passed to stats::poly()
  keep_original_cols = FALSE  # drop the input column
)
```

The `...` argument takes one or more predictors, named directly or through selectors like `all_numeric_predictors()`. `degree` sets how many polynomial columns each predictor expands into.

`options` is a list forwarded to `stats::poly()`. Pass `options = list(raw = TRUE)` to get plain powers instead of orthogonal polynomials. `keep_original_cols` defaults to `FALSE`, so step_poly() removes the input column and leaves only the expanded basis.

## step_poly() examples by use case

**Start with a degree-2 expansion.** Load `recipes`, declare a recipe, add the step, then `prep()` and `bake()` to inspect the result.

```r title="Degree-2 polynomial expansion"
library(recipes)

rec <- recipe(mpg ~ disp, data = mtcars) |>
  step_poly(disp, degree = 2)

baked <- rec |> prep() |> bake(new_data = NULL)
names(baked)
#> [1] "mpg"         "disp_poly_1" "disp_poly_2"
```

The `disp` column is gone and two new columns take its place. `disp_poly_1` holds the linear component and `disp_poly_2` the quadratic one. Because they are orthogonal, their correlation is zero.

```r title="Orthogonal columns are uncorrelated"
round(cor(baked$disp_poly_1, baked$disp_poly_2), 8)
#> [1] 0
```

**Raise the degree and expand several predictors at once.** List predictors in `...` and step_poly() applies the same degree to each.

```r title="Cubic expansion of two predictors"
rec_multi <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_poly(disp, hp, degree = 3)

names(prep(rec_multi) |> bake(new_data = NULL))
#> [1] "mpg"         "disp_poly_1" "disp_poly_2" "disp_poly_3"
#> [5] "hp_poly_1"   "hp_poly_2"   "hp_poly_3"
```

Each predictor becomes three columns, so two predictors at degree 3 yield six new features named with a `_poly_` suffix.

**Switch to raw polynomials when you need plain powers.** Pass `raw = TRUE` through `options` and the first column equals the predictor itself.

```r title="Raw polynomial powers"
rec_raw <- recipe(mpg ~ disp, data = mtcars) |>
  step_poly(disp, degree = 2, options = list(raw = TRUE))

baked_raw <- prep(rec_raw) |> bake(new_data = NULL)
identical(baked_raw$disp_poly_1, mtcars$disp)
#> [1] TRUE
```

Here `disp_poly_1` is the original `disp` and `disp_poly_2` is `disp^2`. Raw powers are easier to interpret but less numerically stable than the orthogonal default.

**Keep the original column when later steps still need it.** Set `keep_original_cols = TRUE` so the input survives alongside the basis.

```r title="Keep the input column"
rec_keep <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_poly(disp, degree = 2, keep_original_cols = TRUE)

names(prep(rec_keep) |> bake(new_data = NULL))
#> [1] "disp"        "hp"          "mpg"         "disp_poly_1" "disp_poly_2"
```

The `disp` column stays in place and the two polynomial columns are appended after the outcome.

## step_poly() vs other ways to add curvature

**Several tools add non-linear terms, and they trade interpretability against flexibility.** step_poly() is the recipe-native choice for smooth global curves.

| Approach | Where it runs | Best for |
|---|---|---|
| `step_poly(x, degree = 2)` | recipe, before fitting | smooth curvature in one predictor, tidymodels workflows |
| `step_ns(x, deg_free = 4)` | recipe | flexible local curves using natural splines |
| `lm(y ~ poly(x, 2))` | model formula | a quick base R polynomial fit, no recipe |
| `step_mutate(x2 = x^2)` | recipe | one hand-picked power term |

Use step_poly() when you build a tidymodels workflow and want a clean polynomial basis bundled with the model. Reach for `step_ns()` when a single global polynomial bends too much at the edges of the data.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `PolynomialFeatures` inside a `Pipeline`. Note that `PolynomialFeatures` produces raw powers, matching `step_poly(options = list(raw = TRUE))` rather than the orthogonal default.

## Common pitfalls

**Most step_poly() surprises come from the dropped column and an over-high degree.** Three mistakes show up repeatedly.

First, expecting the original predictor to remain. Because `keep_original_cols` defaults to `FALSE`, a later step that references `disp` by name fails after step_poly() runs. Set `keep_original_cols = TRUE` or reorder the recipe so dependent steps run first.

Second, setting the degree too high. A degree of 5 or more chases noise and produces a wiggly fit that generalizes poorly. Start at degree 2, raise it only if validation error improves, and consider `step_ns()` for very flexible shapes.

[WARNING]
**Do not read an orthogonal polynomial column as a plain power.** `disp_poly_2` is not `disp` squared. Its values are a rescaled, recentered basis, so coefficients on orthogonal columns are not comparable to coefficients you would get from raw powers. Use `options = list(raw = TRUE)` if you need interpretable powers.

Third, applying step_poly() to a predictor with very few unique values. `poly()` cannot build a degree-3 basis from a column that takes only two values, and `prep()` raises an error. Check the number of distinct values before choosing a degree.

## Try it yourself

**Try it:** Build a recipe on mtcars predicting mpg from hp, expand hp into a degree-3 polynomial, and bake the data. Save the result to ex_baked.

```r title="Your turn: cubic expansion of hp"
# Try it: degree-3 polynomial on hp
ex_baked <- # your code here

names(ex_baked)
#> Expected: includes "hp_poly_1", "hp_poly_2", "hp_poly_3"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_baked <- recipe(mpg ~ hp, data = mtcars) |>
  step_poly(hp, degree = 3) |>
  prep() |>
  bake(new_data = NULL)
names(ex_baked)
#> [1] "mpg"       "hp_poly_1" "hp_poly_2" "hp_poly_3"
```

**Explanation:** A degree of 3 expands `hp` into three orthogonal columns: linear, quadratic, and cubic. step_poly() drops the original `hp` column because `keep_original_cols` defaults to `FALSE`.

</details>

## Related recipes functions

These steps pair naturally with step_poly() in a preprocessing recipe:

- `step_ns()` builds natural spline columns, a more flexible alternative for non-linear shapes.
- `step_interact()` multiplies predictors into interaction terms when combined effects matter.
- `step_normalize()` centers and scales predictors, useful before raw polynomial expansion.
- `step_mutate()` creates a single derived column when a full basis is more than you need.
- `recipe()` defines the variable roles every step operates on.

See the official [step_poly() reference](https://recipes.tidymodels.org/reference/step_poly.html) for the full argument list.

## FAQ

**What is the difference between orthogonal and raw polynomials in step_poly()?**

Orthogonal polynomials, the default, are rescaled so the columns are mathematically uncorrelated. This keeps a linear model's coefficients stable when you add higher-degree terms. Raw polynomials, set with `options = list(raw = TRUE)`, are the plain powers `x`, `x^2`, and so on. Raw powers are easier to interpret but highly correlated, which can make the fit numerically unstable. Predictions from the two forms are identical; only the coefficients differ.

**How does step_poly() name its new columns?**

step_poly() names each output column with the predictor name, a `_poly_` separator, and the degree index. Expanding `disp` at degree 2 produces `disp_poly_1` and `disp_poly_2`. The index runs from 1 up to the `degree` argument, so a degree-3 expansion adds `disp_poly_3` as well. Consistent naming lets downstream steps select the basis with patterns like `starts_with("disp_poly_")`.

**Does step_poly() keep the original predictor column?**

No, not by default. `keep_original_cols` defaults to `FALSE`, so step_poly() removes the input column once it has built the polynomial basis. Set `keep_original_cols = TRUE` when a later recipe step or the model still needs the raw predictor. Otherwise the recipe returns only the expanded columns and the original is gone from the baked data.

**What degree should I use with step_poly()?**

Start with degree 2, which captures simple curvature, and raise it only when cross-validation shows a real improvement. Degrees of 4 or higher tend to overfit, fitting noise rather than signal, especially near the edges of the predictor range. If you need a flexible curve, `step_ns()` with natural splines usually generalizes better than a high-degree polynomial. You can also tune the degree as a model hyperparameter.

**Can step_poly() expand multiple predictors at once?**

Yes. List several predictors in the `...` argument, or use a selector such as `all_numeric_predictors()`, and step_poly() applies the same degree to each one. Each predictor expands into its own set of `_poly_` columns. If different predictors need different degrees, add separate step_poly() calls, one per group of predictors.
</content>
</invoke>
