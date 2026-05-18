---
title: "recipes step_interact() in R: Add Interaction Terms"
slug: recipes-step_interact-in-R
description: "Learn how recipes step_interact() in R adds interaction terms to a tidymodels preprocessing recipe, with runnable examples for numeric and dummy variables."
keywords: "recipes step_interact, step_interact function R, recipes step_interact examples, R interaction terms recipe, tidymodels interaction terms, step_interact tidymodels, add interaction terms recipe R"
mathjax: false
webr: true
date: "2026-05-19"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Linear-Regression.html
auto_link_terms: "step_interact()|recipes step_interact|recipes::step_interact()|step_interact in R|recipes interaction step|step_interact terms"
auto_link_case_sensitive: true
target_keyword: "recipes step_interact"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_interact() in R: Add Interaction Terms

<p class="lead">The recipes step_interact() function adds interaction terms to a tidymodels preprocessing recipe, multiplying two or more predictors into new model-ready columns. It lets a recipe capture combined effects without writing interactions by hand.</p>

[QUICK ANSWER]
step_interact(~ disp:hp)                      # two-way numeric interaction
step_interact(~ disp:hp:wt)                   # three-way interaction
step_interact(~ (disp + hp + wt)^2)           # all pairwise interactions
step_interact(~ disp:starts_with("cyl_"))     # numeric x dummy columns
step_interact(~ disp:hp, sep = ".x.")         # custom name separator
step_interact(~ disp:hp, keep_original_cols = FALSE)  # drop originals

[DECISION TREE: Is step_interact() the right tool?]
- build interaction terms between predictors: step_interact(~ a:b)
- convert factors to dummy columns: step_dummy(all_nominal_predictors())
- add squared or polynomial terms: step_poly(x, degree = 2)
- create ratios or custom math: step_mutate(ratio = a / b)
- center and scale predictors: step_normalize(all_numeric_predictors())
- spline basis expansion for curves: step_ns(x, deg_free = 4)

## What step_interact() does

**step_interact() multiplies predictors into new columns.** It is a recipe step from the `recipes` package that takes a one-sided formula of interaction terms and appends one product column per term. The new columns become predictors a model can use to learn combined effects.

An interaction means the effect of one predictor depends on the value of another. A car's horsepower may matter more for heavy cars than light ones. step_interact() encodes that as `wt * hp` so a linear model can fit a single coefficient for the combination.

[KEY INSIGHT]
**An interaction term is just a product column.** step_interact() does not change your model. It engineers a feature equal to the elementwise product of its inputs, so a plain linear model can fit a coefficient for the joint effect.

## step_interact() syntax and arguments

**The function signature is short but the formula carries the work.** You call it inside a recipe pipeline after defining roles with `recipe()`.

```r title="step_interact signature"
step_interact(
  recipe,
  terms,                      # one-sided formula of interactions
  role = "predictor",         # role assigned to new columns
  sep = "_x_",                # separator in new column names
  keep_original_cols = TRUE   # keep the input columns
)
```

The `terms` argument is the only one you must set. It is a one-sided formula such as `~ disp:hp`, where the colon `:` marks an interaction. You can list several interactions separated by `+`, and you can use selector functions like `starts_with()` on the right-hand side.

`sep` controls how the new column is named. With the default, `disp` interacted with `hp` becomes `disp_x_hp`. `keep_original_cols` keeps the input predictors alongside the new product, which you almost always want.

## step_interact() examples by use case

**Start with a two-way numeric interaction.** Load `recipes`, declare a recipe, add the step, then `prep()` and `bake()` to see the result.

```r title="Two-way numeric interaction"
library(recipes)

rec <- recipe(mpg ~ disp + hp + wt, data = mtcars) |>
  step_interact(terms = ~ disp:hp)

baked <- rec |> prep() |> bake(new_data = NULL)
names(baked)
#> [1] "disp"      "hp"        "wt"        "mpg"       "disp_x_hp"
head(baked$disp_x_hp, 3)
#> [1] 17600 17600 10044
```

The new `disp_x_hp` column equals `disp` times `hp` for every row. The first car has `disp = 160` and `hp = 110`, so its interaction value is `17600`.

**Use the `^2` shortcut for all pairwise interactions.** Wrapping a sum of predictors in `(...)^2` expands to every two-way pair without listing them.

```r title="All pairwise interactions"
rec_all <- recipe(mpg ~ disp + hp + wt, data = mtcars) |>
  step_interact(terms = ~ (disp + hp + wt)^2)

names(prep(rec_all) |> bake(new_data = NULL))
#> [1] "disp"      "hp"        "wt"        "mpg"
#> [5] "disp_x_hp" "disp_x_wt" "hp_x_wt"
```

**Interact a numeric predictor with dummy variables.** Categorical columns must be turned into dummies first with `step_dummy()`, then referenced with a selector because their names change.

```r title="Numeric x dummy interaction"
cars <- transform(mtcars, cyl = factor(cyl))

rec_dummy <- recipe(mpg ~ disp + cyl, data = cars) |>
  step_dummy(cyl) |>
  step_interact(terms = ~ disp:starts_with("cyl_"))

names(prep(rec_dummy) |> bake(new_data = NULL))
#> [1] "disp"          "cyl_X6"        "cyl_X8"        "mpg"
#> [5] "disp_x_cyl_X6" "disp_x_cyl_X8"
```

`step_dummy()` creates `cyl_X6` and `cyl_X8`, so `starts_with("cyl_")` catches both and produces one interaction per dummy.

**Rename the output with `sep`.** A custom separator helps when downstream code expects formula-style names.

```r title="Custom separator for column names"
rec_sep <- recipe(mpg ~ disp + hp, data = mtcars) |>
  step_interact(terms = ~ disp:hp, sep = ":")

names(prep(rec_sep) |> bake(new_data = NULL))
#> [1] "disp"    "hp"      "mpg"     "disp:hp"
```

## step_interact() vs other ways to build interactions

**A model formula and step_interact() reach the same place by different routes.** The recipe approach keeps preprocessing reproducible and portable across model engines.

| Approach | Where it runs | Best for |
|---|---|---|
| `step_interact(~ a:b)` | recipe, before fitting | tidymodels workflows, reusable preprocessing |
| `lm(y ~ a*b)` | model formula | quick base R models, no recipe |
| `step_mutate(ab = a*b)` | recipe | custom math beyond plain products |
| `step_poly(x, degree = 2)` | recipe | curvature in a single predictor |

Use step_interact() when you build a tidymodels workflow and want preprocessing bundled with the model. Reach for a model formula only for one-off base R fits.

[NOTE]
**Coming from Python scikit-learn?** The equivalent of step_interact() is `PolynomialFeatures(interaction_only=True)` inside a `Pipeline`, which also generates product columns before the estimator sees the data.

## Common pitfalls

**Ordering and naming cause most step_interact() errors.** Three mistakes show up repeatedly.

First, placing `step_interact()` before `step_dummy()`. A factor cannot be multiplied, so the recipe fails at `prep()`. Always dummy-encode categorical predictors first.

Second, referencing a factor by its original name. After `step_dummy(cyl)` the column `cyl` no longer exists, so `~ disp:cyl` finds nothing. Use `starts_with("cyl_")` to target the dummies.

[WARNING]
**A misspelled term silently drops the interaction.** If the right-hand side of `terms` names a column that does not exist at that point in the recipe, no error is raised and no interaction column appears. Check `names()` of the baked data to confirm the column is there.

Third, using `*` instead of `:`. In `step_interact()` the colon means interaction; a bare variable name adds no product. Stick to `:` for pairs and `^2` for full pairwise expansion.

## Try it yourself

**Try it:** Build a recipe on mtcars predicting mpg from hp and wt, then add the interaction between hp and wt. Save the baked data to ex_baked.

```r title="Your turn: interact hp and wt"
# Try it: add the hp-by-wt interaction
ex_baked <- # your code here

names(ex_baked)
#> Expected: includes "hp_x_wt"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_baked <- recipe(mpg ~ hp + wt, data = mtcars) |>
  step_interact(terms = ~ hp:wt) |>
  prep() |>
  bake(new_data = NULL)
names(ex_baked)
#> [1] "hp"      "wt"      "mpg"     "hp_x_wt"
```

**Explanation:** The colon in `~ hp:wt` marks the interaction, and `step_interact()` appends the product column `hp_x_wt`. Calling `prep()` then `bake()` evaluates the recipe and returns the engineered data frame.

</details>

## Related recipes functions

These steps pair naturally with step_interact() in a preprocessing recipe:

- `step_dummy()` converts factors to dummy columns, a required precursor for categorical interactions.
- `step_poly()` adds polynomial terms to capture curvature in one predictor.
- `step_normalize()` centers and scales predictors, often run after interactions.
- `step_mutate()` builds arbitrary derived columns when a plain product is not enough.
- `recipe()` defines the variable roles every step operates on.

See the official [step_interact() reference](https://recipes.tidymodels.org/reference/step_interact.html) for the full argument list.

## FAQ

**What is the difference between `:` and `*` in step_interact()?**

In the `terms` formula, the colon `:` creates the interaction term only, which is what step_interact() exists to do. The `(a + b)^2` form expands to all main pairs. Unlike a model formula, you do not use `*` here, because the original predictors are already kept by `keep_original_cols`. Stick with `:` for explicit pairs and `^2` for full pairwise expansion.

**Do I need step_dummy() before step_interact()?**

Yes, for any categorical predictor. step_interact() multiplies columns, and a factor cannot be multiplied. Run `step_dummy()` first to turn the factor into numeric 0/1 dummy columns, then interact those dummies with other predictors. Numeric-only interactions need no dummy step.

**How are the new interaction columns named?**

By default the names join the input columns with `_x_`, so `disp` and `hp` produce `disp_x_hp`. Change this with the `sep` argument, for example `sep = ":"` gives `disp:hp`. Consistent naming matters when downstream code selects columns by pattern.

**Can step_interact() create three-way interactions?**

Yes. Write `~ disp:hp:wt` to multiply all three predictors into a single column. You can also combine terms, such as `~ disp:hp + disp:wt`, to add several interactions in one step. Each distinct term on the right-hand side becomes its own new column.

**Does step_interact() keep the original predictors?**

Yes, because `keep_original_cols` defaults to `TRUE`. The recipe returns both the input columns and the new product columns, which is what most models need. Set `keep_original_cols = FALSE` only when you want the interaction column to replace its inputs entirely.
