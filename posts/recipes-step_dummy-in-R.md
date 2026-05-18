---
title: "recipes step_dummy() in R: Create Dummy Variables"
slug: recipes-step_dummy-in-R
description: "recipes step_dummy() in R turns factor and character predictors into 0/1 dummy variables. Learn the syntax, one-hot encoding, prep and bake, and pitfalls."
keywords: "recipes step_dummy, step_dummy function R, recipes step_dummy examples, R dummy variables, tidymodels step_dummy, one-hot encoding recipe R, step_dummy recipe"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Dummy-Variables-in-R.html
auto_link_terms: "step_dummy()|recipes step_dummy|recipes::step_dummy()|step_dummy|create dummy variables"
auto_link_case_sensitive: true
target_keyword: recipes step_dummy
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_dummy() in R: Create Dummy Variables

<p class="lead">The <code>recipes</code> <code>step_dummy()</code> function in R turns factor and character predictors into numeric 0/1 dummy variables so models can use them. You add it to a <code>recipe()</code>, record the factor levels with <code>prep()</code>, and apply the encoding with <code>bake()</code>.</p>

[QUICK ANSWER]
step_dummy(rec, all_nominal_predictors())        # dummy-encode every factor
step_dummy(rec, Species)                          # encode one named column
step_dummy(rec, Species, one_hot = TRUE)          # keep all levels, no reference
step_dummy(rec, all_nominal(), -all_outcomes())   # encode factors, skip the outcome
step_dummy(rec, where(is.character))              # encode character columns too
prep(rec) |> bake(new_data = NULL)                # learn levels, then apply
tidy(prep(rec), number = 1)                       # inspect the retained levels

[DECISION TREE: Is step_dummy() the right tool?]
- turn factors into 0/1 indicator columns: step_dummy(rec, all_nominal_predictors())
- collapse rare factor levels first: step_other(rec, all_nominal_predictors())
- guard against unseen levels in new data: step_novel(rec, all_nominal_predictors())
- replace missing factor values: step_unknown(rec, all_nominal_predictors())
- build interaction terms between predictors: step_interact(rec, ~ a:b)
- drop indicator columns with no variance: step_zv(rec, all_predictors())

## What step_dummy() does in R

**step_dummy() replaces a categorical column with a set of binary indicator columns.** Most R modeling engines need numeric input, so a factor like `Species` cannot be fed in directly. `step_dummy()` converts each factor into one or more 0/1 columns, where a 1 marks membership in a level and a 0 marks absence.

By default it uses treatment contrasts, the same scheme `lm()` applies behind the scenes. A factor with K levels becomes K-1 dummy columns, and the first level is held back as the reference. A car with 4, 6, or 8 cylinders therefore needs only two columns, because "not 6 and not 8" already identifies the 4-cylinder group.

[KEY INSIGHT]
**The factor levels are learned during prep(), not bake().** `step_dummy()` records every level it sees in the training data and stores them inside the prepped recipe. When you `bake()` new rows, it reuses that stored level set, so the test data gets exactly the same columns in the same order as training, even if a level happens to be absent from the new batch.

## step_dummy() syntax and arguments

**step_dummy() attaches an encoding operation to a recipe.** You pass the recipe first, then the columns to encode, chosen with tidyselect helpers like `all_nominal_predictors()`.

```r title="The step_dummy skeleton"
library(recipes)

recipe(Sepal.Length ~ ., data = iris) |>
  step_dummy(all_nominal_predictors())
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 4
#> -- Operations
#> * Dummy variables from: all_nominal_predictors()
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to encode, chosen with selectors such as `all_nominal_predictors()`. |
| `one_hot` | If `TRUE`, keep a column for every level instead of dropping a reference. Default `FALSE`. |
| `naming` | Function that builds the new column names. Default joins variable and level with an underscore. |
| `levels` | Filled in by `prep()`; stores the factor levels learned from the training data. |
| `skip` | If `TRUE`, the step is ignored when baking new data. Leave `FALSE` for encoding. |

## Creating dummy variables: worked examples

**Build the recipe, prep it, then bake.** A recipe is only a plan until `prep()` records the levels from data. This example dummy-encodes the `Species` factor in `iris` using the default treatment contrasts.

```r title="Create dummy variables for a factor"
rec <- recipe(Sepal.Length ~ ., data = iris) |>
  step_dummy(Species)

baked <- prep(rec) |> bake(new_data = NULL)
baked[c(1, 51, 101), c("Species_versicolor", "Species_virginica")]
#> # A tibble: 3 x 2
#>   Species_versicolor Species_virginica
#>                <dbl>             <dbl>
#> 1                  0                 0
#> 2                  1                 0
#> 3                  0                 1
```

`Species` had three levels, so two dummy columns appear. Row 1 is `setosa`, the dropped reference, and shows 0 in both columns. The new columns are named `variable_level`, joining the original name and the factor level with an underscore.

To keep a column for every level, set `one_hot = TRUE`. This is the encoding tree-free models and neural networks usually expect.

```r title="One-hot encode with one_hot = TRUE"
rec_oh <- recipe(Sepal.Length ~ ., data = iris) |>
  step_dummy(Species, one_hot = TRUE)

oh <- prep(rec_oh) |> bake(new_data = NULL)
oh[c(1, 51, 101), c("Species_setosa", "Species_versicolor", "Species_virginica")]
#> # A tibble: 3 x 3
#>   Species_setosa Species_versicolor Species_virginica
#>            <dbl>              <dbl>             <dbl>
#> 1              1                  0                 0
#> 2              0                  1                 0
#> 3              0                  0                 1
```

To encode several factors at once, use `all_nominal_predictors()`. It selects every factor and character predictor while leaving the outcome alone.

```r title="Dummy-encode every nominal predictor"
cars <- mtcars
cars$cyl  <- factor(cars$cyl)
cars$gear <- factor(cars$gear)

rec_all <- recipe(mpg ~ cyl + gear + hp, data = cars) |>
  step_dummy(all_nominal_predictors())

names(prep(rec_all) |> bake(new_data = NULL))
#> [1] "cyl_X6"  "cyl_X8"  "hp"      "gear_X4" "gear_X5" "mpg"
```

Both factors expand to K-1 columns and the numeric `hp` passes through unchanged. The `X` prefix appears because level names that start with a digit are not valid R names, so `step_dummy()` repairs them. To see which levels each factor kept, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect retained levels with tidy()"
prepped <- prep(rec_all)
tidy(prepped, number = 1)
#> # A tibble: 4 x 3
#>   terms columns id
#>   <chr> <chr>   <chr>
#> 1 cyl   X6      dummy_aB3x9
#> 2 cyl   X8      dummy_aB3x9
#> 3 gear  X4      dummy_aB3x9
#> 4 gear  X5      dummy_aB3x9
```

## step_dummy() vs model.matrix() vs dummyVars()

**Pick the encoder that matches your workflow.** Base R and caret both create dummy variables, but they differ in how they handle the reference level and new data.

| Approach | Drops a reference level? | Where it fits |
|---|---|---|
| `step_dummy()` | Yes by default; `one_hot = TRUE` keeps all | tidymodels recipes |
| `model.matrix()` | Yes, always | base R model formulas |
| `caret::dummyVars()` | No by default | caret preprocessing |

Use `step_dummy()` when the encoding is part of a tidymodels pipeline, because it stores the factor levels and reapplies them to new data without extra code. Reach for `model.matrix()` only for a one-off design matrix outside a workflow. `caret::dummyVars()` is the right call when the surrounding model is already built with caret.

[TIP]
**Collapse rare levels before encoding.** A factor with many sparse levels produces many sparse dummy columns, which slows fitting and can break cross-validation folds. Run `step_other()` ahead of `step_dummy()` to fold infrequent levels into a single `other` category first.

## Common pitfalls with step_dummy()

**Most failures come from the column type or from unseen levels.** Watch these three traps when adding the step to a recipe.

1. **Passing a numeric or character column you forgot to convert.** `step_dummy()` expects a factor. A plain character column is coerced, but a numeric column triggers an error, so convert categorical numbers with `factor()` first or use `step_num2factor()`.
2. **Unseen levels in new data.** If `bake()` meets a factor level that was absent during `prep()`, the dummy columns for that row come back as `NA`. Add `step_novel()` before `step_dummy()` so unknown levels land in a dedicated column instead.
3. **Encoding the outcome.** `all_nominal()` includes a categorical response variable. Use `all_nominal_predictors()`, or subtract the outcome with `-all_outcomes()`, so the target stays a factor for classification.

[WARNING]
**Ordered factors do not become 0/1 columns.** When the input is an ordered factor, `step_dummy()` applies polynomial contrasts by default, producing linear and quadratic terms rather than plain indicators. Convert to an unordered factor first if you want simple 0/1 dummy variables.

## Try it yourself

**Try it:** Convert `cyl` in `mtcars` to a factor and one-hot encode it in a recipe. Save the baked result to `ex_dummies`.

```r title="Your turn: one-hot encode cyl"
# Try it: one-hot encode cyl
ex_cars <- mtcars
ex_cars$cyl <- factor(ex_cars$cyl)

ex_rec <- recipe(mpg ~ cyl, data = ex_cars) |>
  step_dummy(# your code here)

ex_dummies <- # your code here
names(ex_dummies)
#> Expected: cyl_X4, cyl_X6, cyl_X8, mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ cyl, data = ex_cars) |>
  step_dummy(cyl, one_hot = TRUE)

ex_dummies <- prep(ex_rec) |> bake(new_data = NULL)
names(ex_dummies)
#> [1] "cyl_X4" "cyl_X6" "cyl_X8" "mpg"
```

**Explanation:** Setting `one_hot = TRUE` keeps an indicator column for every level, so all three cylinder counts get a column instead of dropping one as a reference. The `X` prefix is added because the level names begin with digits.

</details>

## Related recipes steps

**step_dummy() is one of several recipes steps for categorical data.** These pair naturally with it in a tidymodels workflow:

- [step_other()](recipes-step_other-in-R.html) folds rare factor levels into a single `other` group.
- [step_novel()](recipes-step_novel-in-R.html) reserves a level for values unseen during training.
- [step_unknown()](recipes-step_unknown-in-R.html) assigns missing factor values to their own level.
- [step_interact()](recipes-step_interact-in-R.html) builds interaction terms from the dummy columns.
- [step_zv()](recipes-step_zv-in-R.html) drops indicator columns that hold a single value.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_dummy()` is `pd.get_dummies(df)`, or scikit-learn's `OneHotEncoder()`. The recipes version differs by learning the factor levels on training data and reapplying the exact same columns to new data automatically.

## FAQ

**What does step_dummy() do in R?**

`step_dummy()` is a recipes step that converts factor or character predictors into numeric 0/1 dummy variables. During `prep()` it records every level present in the training data. During `bake()` it creates an indicator column for each level, so a model that needs numeric input can use the categorical information. By default it drops one level as a reference, matching the contrast scheme `lm()` uses internally.

**What is the difference between step_dummy() and one-hot encoding?**

Plain `step_dummy()` uses treatment contrasts: a factor with K levels becomes K-1 columns, with the first level held back as a reference. True one-hot encoding keeps a column for every level. To get one-hot output, set `step_dummy(rec, cols, one_hot = TRUE)`. Use K-1 dummies for linear and penalized regression to avoid collinearity, and one-hot for tree ensembles or neural networks.

**Why are my dummy column names prefixed with X?**

`step_dummy()` builds new column names by joining the variable name and the level with an underscore. When a level name starts with a digit, such as `4` or `6`, that is not a syntactically valid R name, so `step_dummy()` repairs it by adding an `X` prefix. A `cyl` factor with level `6` becomes the column `cyl_X6`. You can override this by supplying a custom function to the `naming` argument.

**Do I need to prep() before step_dummy() works?**

Yes. A recipe with `step_dummy()` is just a plan until `prep()` runs. `prep()` scans the training data, records the factor levels, and stores them in the step. Only then can `bake()` produce the dummy columns. Calling `bake()` on an unprepped recipe throws an error because the levels have not been learned yet.
