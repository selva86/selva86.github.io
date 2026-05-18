---
title: "recipes recipe() in R: Build a Preprocessing Blueprint"
slug: recipes-recipe-in-R
description: "Learn how recipes recipe() in R builds reusable tidymodels preprocessing pipelines. Covers the formula interface, roles, steps, prep, and bake with examples."
keywords: "recipes recipe, recipe function R, recipes recipe examples, R recipe preprocessing, tidymodels recipe, recipe tidymodels, create recipe R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "recipe()|recipes recipe|recipes::recipe()|preprocessing recipe|tidymodels recipe"
auto_link_case_sensitive: true
target_keyword: "recipes recipe"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes recipe() in R: Build a Preprocessing Blueprint

<p class="lead">The recipes recipe() function in R defines a preprocessing blueprint: a reusable plan for turning raw data into model-ready features. It records which columns are outcomes and predictors, then collects the transformation steps you apply later.</p>

[QUICK ANSWER]
recipe(y ~ ., data = train)                      # formula interface
recipe(train)                                    # bare data, roles assigned later
rec |> update_role(id, new_role = "ID")          # tag a non-predictor
rec |> step_normalize(all_numeric_predictors())  # add a step
rec |> step_dummy(all_nominal_predictors())      # encode factors
prep(rec, training = train)                      # estimate from training data
bake(prepped, new_data = NULL)                   # get processed training set

[DECISION TREE: Is recipe() the right tool?]
- build a reusable preprocessing blueprint: recipe(y ~ ., data = train)
- apply a quick one-off transform: dplyr::mutate() or scale()
- bundle preprocessing with a model: workflow() then add_recipe()
- add a single transformation: step_*() functions
- estimate parameters from training data: prep(rec, training = train)
- apply a trained recipe to new data: bake(prepped, new_data = test)

## What recipe() does

**recipe() declares structure, not transformations.** When you call `recipe()`, R does not change a single value in your data. It builds a recipe object that records each column name, its data type, and its role: outcome, predictor, or something custom. The actual transformations come later, as `step_*()` functions chained onto the recipe.

That separation is the core idea. A recipe is a plan estimated on training data and then applied identically to new data, which stops information from the test set leaking into preprocessing.

[KEY INSIGHT]
**A recipe is a blueprint, not a result.** recipe() plus step_*() defines what to do; prep() learns the parameters from training data; bake() carries them out. Applying the same prepped recipe to test data guarantees identical transformations.

## recipe() syntax and arguments

**recipe() accepts a formula or a bare data frame.** The most common call passes a formula and the training data. The left side of the formula is the outcome; the right side lists predictors, with `.` meaning "all remaining columns".

```r title="The recipe function signature"
# Formula interface (most common)
recipe(formula, data, ...)

# Data-frame interface (assign roles afterwards)
recipe(x, ...)
```

Key arguments:

- `formula`: a model formula such as `Species ~ .`. The outcome goes left, predictors right.
- `data` / `x`: a data frame or tibble. Only column names and types are read, so a zero-row slice works fine.
- `vars`: an optional character vector of column names, used instead of a formula.
- `roles`: an optional character vector assigning a role to each entry in `vars`.

The full argument list lives in the [recipes reference documentation](https://recipes.tidymodels.org/reference/recipe.html).

## recipe() examples

**Start with the formula interface on a built-in dataset.** Passing `Species ~ .` marks `Species` as the outcome and the four measurement columns as predictors.

```r title="Create a recipe with a formula"
library(recipes)

rec <- recipe(Species ~ ., data = iris)
rec
#> -- Recipe ------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 4
```

**Chain step_*() functions to add transformations.** Each step is recorded in order. Here two steps center-and-scale the numeric predictors and convert any factor predictors to dummy variables.

```r title="Add preprocessing steps"
rec <- recipe(Species ~ ., data = iris) |>
  step_normalize(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())
rec
#> -- Operations
#> * Centering and scaling for: all_numeric_predictors()
#> * Dummy variables from: all_nominal_predictors()
```

**Call prep() then bake() to run the recipe.** `prep()` estimates each step's parameters, here the mean and standard deviation, from the training data. `bake(new_data = NULL)` returns the processed training set.

```r title="Prepare and bake the recipe"
prepped <- prep(rec, training = iris)
baked   <- bake(prepped, new_data = NULL)
head(baked, 3)
#> # A tibble: 3 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>
#> 1       -0.898      1.02          -1.34       -1.31 setosa
#> 2       -1.14      -0.131         -1.34       -1.31 setosa
#> 3       -1.39       0.328         -1.39       -1.31 setosa
```

**Use the data-frame interface when there is no clean formula.** Passing the data alone leaves every column undeclared; `update_role()` then tags outcomes and predictors explicitly.

```r title="Assign roles without a formula"
rec_roles <- recipe(mtcars) |>
  update_role(mpg, new_role = "outcome") |>
  update_role(-mpg, new_role = "predictor")
summary(rec_roles)
#> # A tibble: 11 x 4
#>   variable type      role      source  
#>   <chr>    <list>    <chr>     <chr>   
#> 1 mpg      <chr [2]> outcome   original
#> 2 cyl      <chr [2]> predictor original
#> 3 disp     <chr [2]> predictor original
```

## recipe() vs other preprocessing tools

**recipe() wins when preprocessing must be reproducible across datasets.** Base R and dplyr transform data in place, which is fine for exploration but risks applying different parameters to training and test sets.

| Tool | Best for | Reusable on new data |
|---|---|---|
| `recipe()` + steps | Model preprocessing pipelines | Yes, via prep() and bake() |
| `dplyr::mutate()` | One-off, exploratory transforms | No, recomputed each time |
| `model.matrix()` | Quick design matrix for `lm()` | Partly, no stored parameters |
| `caret::preProcess()` | Older caret workflows | Yes, but caret-only |

The decision rule is simple. If a transformation must use the same parameters on training and test data, use a recipe. For a throwaway column tweak, reach for `mutate()`.

[NOTE]
**Coming from Python scikit-learn?** A recipe is the R counterpart of a `Pipeline` built from `ColumnTransformer` steps. prep() maps to `fit()` and bake() maps to `transform()`.

## Common pitfalls

**A bare recipe transforms nothing until it is prepped.** Three mistakes cause most early confusion.

1. **Skipping prep().** A recipe object on its own is inert. Calling `bake()` on an un-prepped recipe errors. Always run `prep()` first to estimate the steps.
2. **Selecting the outcome by accident.** `all_numeric()` includes a numeric outcome, so a step can transform your target. Use `all_numeric_predictors()` to exclude outcomes.
3. **Prepping on the full dataset.** Calling `prep()` on combined train-and-test data learns means and standard deviations from test rows too, leaking information. Prep on the training split only.

[WARNING]
**all_numeric() is not all_numeric_predictors().** The first selector grabs every numeric column, including the outcome. Normalizing or imputing the outcome silently corrupts the model. Prefer the `_predictors()` selectors inside steps.

## Try it yourself

**Try it:** Build a recipe on `mtcars` predicting `mpg`, add a step that normalizes all numeric predictors, then prep and bake it. Save the baked training data to `ex_baked`.

```r title="Your turn: build a recipe"
# Try it: recipe on mtcars
ex_rec <- # your code here
ex_baked <- # your code here

head(ex_baked, 3)
#> Expected: 3 rows of normalized predictors plus mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors())
ex_baked <- prep(ex_rec, training = mtcars) |>
  bake(new_data = NULL)
head(ex_baked, 3)
#> # A tibble: 3 x 11
#>      cyl   disp     hp ...   mpg
#>    <dbl>  <dbl>  <dbl> ... <dbl>
#> 1 -0.105 -0.571 -0.535 ...    21
```

**Explanation:** recipe() declares mpg as the outcome, step_normalize() centers and scales every numeric predictor, and prep() plus bake(new_data = NULL) returns the transformed training set. The outcome mpg stays untouched because the selector targets predictors only.

</details>

## Related recipes functions

**recipe() is the entry point to a family of preprocessing functions.** These pair with it most often:

- `step_normalize()`: center and scale numeric predictors to mean 0, standard deviation 1.
- `step_dummy()`: convert factor predictors into indicator columns.
- `prep()`: estimate step parameters from training data.
- `bake()`: apply a prepped recipe to any dataset.
- `workflow()` and `add_recipe()`: bundle a recipe with a model for one-call fitting.

## FAQ

**What is a recipe in R?**
A recipe is an object created by the recipes package that describes how to preprocess a dataset before modeling. It stores variable roles and an ordered list of transformation steps. The recipe itself holds no transformed data; it is a plan that prep() estimates and bake() executes. Recipes are part of the tidymodels framework and make preprocessing reproducible across training and test sets.

**What is the difference between prep() and bake()?**
prep() estimates the parameters each step needs, such as column means for centering, using the training data. bake() applies those estimated parameters to produce transformed data. You prep once and bake many times: bake(new_data = NULL) returns the processed training set, while bake(new_data = test) applies the identical transformation to new data without re-estimating anything.

**Do I have to use recipe() with workflows?**
No. A recipe works on its own through prep() and bake(). Pairing it with a workflow is still recommended, because workflow() plus add_recipe() bundles preprocessing and the model together, so a single fit() call handles both and predictions automatically apply the recipe to new data.

**What is the difference between recipe() and a formula in lm()?**
A formula in lm() both selects variables and applies inline transformations at fit time, recomputed for every dataset. recipe() separates the plan from execution: it records steps once, estimates them on training data with prep(), and reuses the stored parameters. This prevents test data from influencing preprocessing.

**Can I use recipe() without the full tidymodels?**
Yes. Install and load only the recipes package; it does not require parsnip, workflows, or the rest of tidymodels. You can prep() and bake() a recipe and feed the result into any modeling function, including base R lm() or glm().
