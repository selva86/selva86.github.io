---
title: "recipes step_impute_bag() in R: Bagged Tree Imputation"
slug: recipes-step_impute_bag-in-R
description: "Learn how recipes step_impute_bag() imputes missing values in R using bagged decision trees. Syntax, airquality examples, tuning trees, and common pitfalls."
keywords: "recipes step_impute_bag, step_impute_bag function R, recipes step_impute_bag examples, bagged tree imputation R, impute missing values recipes, tidymodels imputation"
mathjax: false
webr: true
date: "2026-05-19"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Missing-Value-Treatment-With-R.html
auto_link_terms: "step_impute_bag()|recipes step_impute_bag|recipes::step_impute_bag()|bagged tree imputation|bagged imputation"
auto_link_case_sensitive: true
target_keyword: "recipes step_impute_bag"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_impute_bag() in R: Bagged Tree Imputation

<p class="lead">The recipes step_impute_bag() function fills missing values in R by training bagged decision trees on the remaining variables, making it a strong model-based choice when your data mixes numeric and categorical columns.</p>

[QUICK ANSWER]
step_impute_bag(rec, Ozone)                            # impute one column
step_impute_bag(rec, Ozone, Solar.R)                   # impute several
step_impute_bag(rec, all_numeric_predictors())         # all numeric predictors
step_impute_bag(rec, Ozone, trees = 50)                # more trees, steadier
step_impute_bag(rec, Ozone, impute_with = imp_vars(Wind, Temp))  # pick predictors
step_impute_bag(rec, Ozone, seed_val = 42)             # reproducible result

[DECISION TREE: Is step_impute_bag() the right tool?]
- impute mixed numeric and nominal: step_impute_bag(rec, vars)
- fast numeric-only imputation: step_impute_knn(rec, vars)
- simple central-tendency fill: step_impute_mean(rec, vars)
- linear-model imputation: step_impute_linear(rec, vars)
- impute factor columns by frequency: step_impute_mode(rec, vars)
- drop rows with NA instead: step_naomit(rec, vars)

## What step_impute_bag() does

**step_impute_bag() imputes missing values with an ensemble of bagged decision trees.** It is a step in the `recipes` package, the preprocessing engine behind tidymodels. For every column you select, it trains a bagged CART model that uses the other variables as predictors, then predicts the missing entries from that model.

Because trees handle both numeric and categorical predictors and capture nonlinear relationships, bagged tree imputation is more flexible than mean, median, or linear imputation. The cost is speed: each column gets its own ensemble, so the step is slower than simpler alternatives.

[KEY INSIGHT]
**Bagged tree imputation treats every gap as a prediction problem.** Instead of substituting one fixed number, it learns a model from the rows that are complete, then predicts the missing cell from each row's other values. That is why it adapts to interactions a single mean could never capture.

## Syntax and arguments

**The step takes a recipe, column selectors, and tuning arguments.** You add it to a recipe with the native pipe and tune how the trees are built.

```r title="Basic step_impute_bag signature"
step_impute_bag(
  recipe,
  ...,
  impute_with = imp_vars(all_predictors()),
  trees = 25,
  options = list(keepX = FALSE),
  seed_val = sample.int(10^4, 1)
)
```

| Argument | Purpose |
|---|---|
| `...` | Columns to impute, chosen with tidyselect helpers like `all_numeric_predictors()`. |
| `impute_with` | Predictors used to build each model, wrapped in `imp_vars()`. Defaults to all other predictors. |
| `trees` | Number of bagged trees per column. More trees give steadier imputations. |
| `options` | List passed to `ipred::bagging()`, for example `nbagg` or `keepX`. |
| `seed_val` | Integer seed so the bootstrap sampling is reproducible. |

[WARNING]
**step_impute_bag() requires the ipred package.** The step calls `ipred::bagging()` under the hood, so `prep()` fails with a "package ipred is required" message if `ipred` is not installed. Run `install.packages("ipred")` once before using the step.

## step_impute_bag() examples

**These examples use airquality, a built-in dataset with real missing values.** Its `Ozone` and `Solar.R` columns contain `NA` entries, which makes it ideal for imputation practice.

```r title="Load recipes and inspect missing data"
library(recipes)

colSums(is.na(airquality))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

Add `step_impute_bag()` to a recipe, then `prep()` learns the tree models and `bake()` applies them.

```r title="Impute Ozone and Solar.R with bagged trees"
rec <- recipe(Temp ~ ., data = airquality) |>
  step_impute_bag(Ozone, Solar.R)

prepped <- prep(rec, training = airquality)
imputed <- bake(prepped, new_data = airquality)

colSums(is.na(imputed))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0
```

Use `impute_with` and `imp_vars()` to restrict which variables build the model. This helps when some predictors are noisy or leak information.

```r title="Choose predictors and tune the tree count"
rec_tuned <- recipe(Temp ~ ., data = airquality) |>
  step_impute_bag(
    Ozone, Solar.R,
    impute_with = imp_vars(Wind, Temp, Month),
    trees = 50,
    seed_val = 42
  )

prepped_tuned <- prep(rec_tuned, training = airquality)
sum(is.na(bake(prepped_tuned, new_data = airquality)$Ozone))
#> [1] 0
```

Call `tidy()` on the prepped recipe to confirm which columns were imputed.

```r title="Inspect the fitted imputation models"
tidy(prepped, number = 1)
#> # A tibble: 2 x 3
#>   terms   model       id
#>   <chr>   <list>      <chr>
#> 1 Ozone   <classbagg> impute_bag_a1b2c
#> 2 Solar.R <classbagg> impute_bag_a1b2c
```

## step_impute_bag() vs other imputation steps

**Choose the step that matches your data types and speed budget.** Bagged trees are the most general option, but simpler steps win when relationships are linear or you only need a fast baseline.

| Step | Method | Handles | Speed | Best for |
|---|---|---|---|---|
| `step_impute_bag()` | Bagged CART trees | Numeric + nominal | Slow | Mixed types, nonlinear patterns |
| `step_impute_knn()` | K nearest neighbors | Numeric + nominal | Medium | Local similarity between rows |
| `step_impute_linear()` | Linear regression | Numeric only | Fast | Strong linear relationships |
| `step_impute_mean()` | Column mean | Numeric only | Fastest | Quick numeric baseline |
| `step_impute_mode()` | Most frequent value | Nominal only | Fastest | Quick categorical baseline |

**Decision rule:** reach for `step_impute_bag()` when columns interact in nonlinear ways or you must impute factors and numbers in one step. If every column is numeric and you need speed, `step_impute_knn()` or `step_impute_linear()` are lighter.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `IterativeImputer` with a tree estimator, or `sklearn.ensemble`-based imputation. Both predict each missing column from the others rather than filling a constant.

## Common pitfalls

**Three mistakes account for most step_impute_bag() trouble.** Each has a clear fix.

1. **Missing the ipred dependency.** `prep()` aborts with `package "ipred" is required` when the package is absent. Install it once with `install.packages("ipred")`.
2. **Imputing the outcome variable.** Selecting your response column leaks model targets into preprocessing. Restrict selectors to predictors, for example `step_impute_bag(all_numeric_predictors())`, so the outcome is never touched.
3. **Expecting it to be fast.** Twenty-five trees per column is heavy on wide or large data. Lower `trees`, narrow `impute_with`, or switch to `step_impute_knn()` if `prep()` runs too long.

## Try it yourself

**Try it:** Impute only the `Ozone` column of `airquality` using `Wind` and `Temp` as predictors, with 30 trees. Save the baked result to `ex_imputed`.

```r title="Your turn: impute Ozone with bagged trees"
# Try it: impute Ozone only
ex_rec <- # your code here

ex_imputed <- # prep then bake
sum(is.na(ex_imputed$Ozone))
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(Temp ~ ., data = airquality) |>
  step_impute_bag(Ozone, impute_with = imp_vars(Wind, Temp), trees = 30)

ex_imputed <- bake(prep(ex_rec, training = airquality), new_data = airquality)
sum(is.na(ex_imputed$Ozone))
#> [1] 0
```

**Explanation:** `imp_vars()` limits the predictors to `Wind` and `Temp`, `trees = 30` sets the ensemble size, and `prep()` then `bake()` learns and applies the imputation models.

</details>

## Related recipes steps

**These steps pair naturally with bagged tree imputation in a recipe.**

- [step_impute_knn()](recipes-step_impute_knn-in-R.html) for distance-based imputation of mixed columns.
- [step_impute_linear()](recipes-step_impute_linear-in-R.html) for fast linear-model imputation of numeric columns.
- [step_impute_mean()](recipes-step_impute_mean-in-R.html) for a quick numeric baseline fill.
- [step_impute_median()](recipes-step_impute_median-in-R.html) for a skew-resistant central-tendency fill.
- [step_impute_mode()](recipes-step_impute_mode-in-R.html) for imputing categorical columns by frequency.

## FAQ

**How does step_impute_bag() handle missing values?**
For each selected column, the step trains a bagged ensemble of decision trees using the other predictors as inputs and the complete rows as training data. It then predicts the missing cells from each row's observed values. Because the model learns from the data, the imputed values reflect relationships between variables rather than a single constant.

**Does step_impute_bag() work on categorical variables?**
Yes. Bagged CART trees handle both numeric and nominal outcomes, so the step can impute factor columns as well as numeric ones. This is its main advantage over `step_impute_linear()` and `step_impute_mean()`, which are numeric-only. The same `imp_vars()` predictors can mix numeric and categorical inputs.

**How many trees should I use in step_impute_bag()?**
The default of 25 trees is a reasonable starting point. More trees produce steadier, lower-variance imputations but increase `prep()` time roughly linearly. For large datasets, start low and raise `trees` only if imputed values look unstable across runs. Set `seed_val` so results are reproducible while you compare settings.

**Why do I get a "package ipred is required" error?**
`step_impute_bag()` builds its trees with `ipred::bagging()`, so the `ipred` package must be installed. Run `install.packages("ipred")` once, then re-run `prep()`. Unlike mean or median imputation, the bagged step has this extra dependency because it fits a real model.

**Is step_impute_bag() better than mean imputation?**
It is usually more accurate because it conditions on other variables instead of using one fixed number, which preserves relationships in the data. The trade-off is speed and an extra dependency. For exploratory work or very large data, `step_impute_mean()` is faster; for modeling pipelines where imputation quality matters, bagged trees are the stronger default.
