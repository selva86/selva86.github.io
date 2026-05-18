---
title: "recipes step_impute_linear() in R: Linear Model Imputation"
slug: recipes-step_impute_linear-in-R
description: "Learn how recipes step_impute_linear() imputes missing numeric values with a linear regression model in R. Covers impute_with, examples, and common pitfalls."
keywords: "recipes step_impute_linear, step_impute_linear function R, recipes step_impute_linear examples, R linear imputation recipes, tidymodels linear imputation, step_impute_linear tidymodels"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Missing-Value-Treatment-With-R.html
auto_link_terms: "step_impute_linear()|recipes step_impute_linear|recipes::step_impute_linear()|linear imputation|step_impute_linear tidymodels"
auto_link_case_sensitive: true
target_keyword: "recipes step_impute_linear"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_impute_linear() in R: Linear Model Imputation

<p class="lead">recipes step_impute_linear() imputes missing numeric values in R by fitting a linear regression model that predicts each incomplete column from the others. The model is learned during prep() and applied during bake().</p>

[QUICK ANSWER]
step_impute_linear(rec, Ozone)                          # impute one numeric column
step_impute_linear(rec, Ozone, Solar.R)                 # impute several columns
step_impute_linear(rec, all_numeric_predictors())       # all numeric predictors
step_impute_linear(rec, Ozone, impute_with = imp_vars(Wind, Temp))  # set model predictors
prep(rec) |> bake(new_data = NULL)                      # fit lm models, then apply

[DECISION TREE: Is step_impute_linear() the right tool?]
- impute numeric NAs from a linear model: step_impute_linear(rec, x)
- impute numeric NAs with the mean: step_impute_mean(rec, x)
- impute numeric NAs with the median: step_impute_median(rec, x)
- impute categorical NAs with the mode: step_impute_mode(rec, grp)
- impute from similar rows (mixed types): step_impute_knn(rec, all_predictors())
- impute with a nonlinear model: step_impute_bag(rec, x)
- drop rows with NA entirely: step_naomit(rec, all_predictors())

## What step_impute_linear() does

**step_impute_linear() fills missing numeric values with predictions from a linear regression model.** It is part of the [recipes](https://recipes.tidymodels.org/) package, the preprocessing engine of tidymodels. For each column you name, recipes fits an `lm()` that predicts that column from the other predictors, then uses the fitted model to estimate every missing entry from the complete values in the same row.

Like every recipe step, it runs in two phases. When you call `prep()`, the step fits one linear model per imputed column on the training data. When you call `bake()`, it scores the rows that hold an `NA` and writes the fitted value back into the gap.

[KEY INSIGHT]
**Linear imputation is multivariate and directional.** Mean and median imputation fill every gap with one constant. step_impute_linear() reads the other columns in each row, so a hot, low-wind day gets a higher ozone estimate than a cool, windy one. The fill follows the regression surface rather than a flat average.

## Syntax and arguments

**One argument does the real work: impute_with.** Here is the call with its defaults:

```r title="step_impute_linear signature"
step_impute_linear(
  recipe,
  ...,
  role = NA,
  trained = FALSE,
  impute_with = imp_vars(all_predictors()),
  models = NULL,
  skip = FALSE,
  id = rand_id("impute_linear")
)
```

The arguments you will actually set:

- `recipe`: the recipe object you are adding the step to.
- `...`: one or more selectors naming the numeric columns to impute.
- `impute_with`: an `imp_vars()` selector listing the predictors fed into each linear model. Defaults to all predictors.
- `skip`: leave it `FALSE` for imputation so the step also runs on new data.

The `models` argument is filled automatically during `prep()` and you should not set it by hand.

## step_impute_linear() examples

**The airquality dataset has gaps in two numeric columns, which makes a clean test case.** Start by counting the missing values.

```r title="Load recipes and check missing values"
library(recipes)

colSums(is.na(airquality))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

`Ozone` has 37 missing values. Build a recipe that predicts `Ozone` from two columns that are themselves complete.

```r title="Build and prep a linear imputation recipe"
rec <- recipe(Temp ~ ., data = airquality) |>
  step_impute_linear(Ozone, impute_with = imp_vars(Wind, Temp))

prepped <- prep(rec, training = airquality)
imputed <- bake(prepped, new_data = airquality)

sum(is.na(imputed$Ozone))
#> [1] 0
```

Every gap is filled. Because `Wind` and `Temp` have no missing values, the linear model can score all 37 incomplete rows. The value of a model-based fill shows up against a flat mean.

```r title="Linear fills vary row by row"
gaps <- which(is.na(airquality$Ozone))
round(imputed$Ozone[gaps][1:6], 1)
#> [1] 27.5 11.4 23.9 18.8 -2.1 34.6

mean(airquality$Ozone, na.rm = TRUE)
#> [1] 42.13
```

Mean imputation would write `42.13` into every gap. The linear model instead gives each row its own estimate from that day's wind and temperature, so the imputed column keeps realistic variation.

You can impute several columns in one step, and each gets its own model.

```r title="Impute several columns at once"
rec_multi <- recipe(Temp ~ ., data = airquality) |>
  step_impute_linear(Ozone, Solar.R, impute_with = imp_vars(Wind, Temp, Month)) |>
  prep()

colSums(is.na(bake(rec_multi, new_data = NULL)))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0
```

`Ozone` and `Solar.R` are each predicted from `Wind`, `Temp`, and `Month`. Those three predictors are complete, so no gaps survive in either imputed column.

[TIP]
**You do not need to scale predictors first.** Linear regression coefficients adapt to each predictor's scale, so adding `step_normalize()` before step_impute_linear() does not change the imputed values. Order normalization after imputation if you need scaled columns downstream.

## step_impute_linear() vs other imputation steps

**Linear imputation is the middle ground between a constant fill and a full model.** Each step in the recipes imputation family suits a different data shape and compute budget.

| Step | Approach | Speed | Mixed types |
|---|---|---|---|
| `step_impute_mean()` | Column mean | Fastest | No |
| `step_impute_median()` | Column median | Fastest | No |
| `step_impute_linear()` | Linear regression model | Medium | No |
| `step_impute_knn()` | Average of k neighbours | Slow | Yes |
| `step_impute_bag()` | Bagged tree model | Slowest | Yes |

Decision rule: use `step_impute_mean()` or `step_impute_median()` for a quick baseline. Reach for `step_impute_linear()` when the missing column has a roughly linear relationship with complete predictors. Switch to `step_impute_knn()` or `step_impute_bag()` when that relationship is nonlinear or the gaps sit in categorical columns.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `IterativeImputer` with a linear estimator. Both predict each missing column from the others with a regression model, though IterativeImputer cycles over columns iteratively while step_impute_linear() fits one model per column in a single pass.

## Common pitfalls

**A linear model can predict values the column could never take.** `Ozone` is non-negative, but a regression line extended to a cold, windy day can return a negative estimate, as the `-2.1` in the earlier example shows.

```r title="Pitfall: predictions outside the valid range"
rec_bad <- recipe(Temp ~ ., data = airquality) |>
  step_impute_linear(Ozone, impute_with = imp_vars(Wind, Temp)) |>
  prep()

baked_bad <- bake(rec_bad, new_data = NULL)
min(baked_bad$Ozone)
#> [1] -2.1
```

A negative ozone reading is impossible. Add a `step_mutate()` afterward to clamp the column, or switch to a step whose fills stay inside the observed range.

Two more traps to avoid:

- **Predictors with their own NAs.** Columns named in `impute_with` must be complete for a row to be scored. If a predictor still holds missing values, rows that share those gaps stay `NA`. Impute the predictors first, or list only complete columns.
- **Imputing categorical columns.** step_impute_linear() handles numeric columns only. For factor or character gaps, use `step_impute_mode()` or `step_impute_knn()` instead.

[WARNING]
**step_impute_linear() does not add residual noise.** Every fill lands exactly on the regression line, so the imputed column has artificially low variance. That biases later standard errors downward. When the goal is statistical inference rather than prediction, prefer multiple imputation.

## Try it yourself

**Try it:** Build a recipe on `airquality` that imputes `Ozone` with `step_impute_linear()` using `Wind` and `Temp` as the model predictors, then confirm no missing values remain. Save the baked data to `ex_imputed`.

```r title="Your turn: linear-impute Ozone"
# Try it: impute Ozone from a linear model
ex_imputed <- # your code here

sum(is.na(ex_imputed$Ozone))
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_imputed <- recipe(Temp ~ ., data = airquality) |>
  step_impute_linear(Ozone, impute_with = imp_vars(Wind, Temp)) |>
  prep() |>
  bake(new_data = NULL)

sum(is.na(ex_imputed$Ozone))
#> [1] 0
```

**Explanation:** `prep()` fits a linear model of `Ozone` on `Wind` and `Temp` from the training rows, and `bake(new_data = NULL)` replaces each missing `Ozone` value with that model's prediction.

</details>

## Related recipes steps

**These steps pair naturally with linear imputation in a preprocessing pipeline.**

- `step_impute_mean()`: fast mean fill for a quick numeric baseline.
- `step_impute_median()`: median fill, robust to skew and outliers.
- `step_impute_knn()`: neighbour-based fill that also handles categorical columns.
- `step_impute_bag()`: bagged-tree imputation for nonlinear relationships.
- `step_normalize()`: centre and scale numeric columns after imputing.

## FAQ

**What types of columns can step_impute_linear() impute?**

step_impute_linear() imputes numeric columns only. The imputed column becomes the response of a linear regression model, so it must hold numbers. Factor and character columns cannot be the target of this step. For categorical gaps, use `step_impute_mode()` for a most-frequent-level fill or `step_impute_knn()`, which supports mixed data types through Gower distance. The predictors named in `impute_with` can include factors, since regression handles them as dummy variables.

**Does step_impute_linear() cause data leakage?**

Not when used correctly. `prep()` fits the linear models on the training data only and stores them in the recipe. When you `bake()` validation or test rows, recipes applies those stored models without refitting, so test outcomes never influence the imputation. Leakage happens only if you prep the recipe on the full dataset before splitting, so always split your data first and prep on the training portion.

**Why does step_impute_linear() leave some values missing?**

The most common cause is incomplete predictors. A linear model can only score a row when every predictor in `impute_with` has a value for that row. If a predictor column has its own `NA` entries, rows sharing those gaps cannot be predicted and stay missing. Fix this by imputing the predictor columns earlier in the recipe, or by restricting `impute_with` to columns you know are complete.

**How is step_impute_linear() different from step_impute_knn()?**

step_impute_linear() fits a global linear regression model and assumes a roughly linear relationship between the gap column and its predictors. step_impute_knn() makes no such assumption: it fills each gap from the k most similar complete rows, which captures nonlinear and local patterns. KNN also handles categorical columns, while linear imputation is numeric only. Linear imputation is usually faster and easier to interpret when the relationship really is linear.
