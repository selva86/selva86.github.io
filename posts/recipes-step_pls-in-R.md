---
title: "recipes step_pls() in R: PLS Feature Extraction"
slug: recipes-step_pls-in-R
description: "Use recipes step_pls() in R to add supervised PLS feature extraction to a tidymodels recipe. Covers syntax, examples, tuning num_comp, and common pitfalls."
keywords: "recipes step_pls, step_pls function R, recipes step_pls examples, R PLS recipe step, partial least squares recipes R, step_pls tidymodels, step_pls num_comp"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_pls()|recipes step_pls|recipes::step_pls()|partial least squares|PLS feature extraction"
auto_link_case_sensitive: true
target_keyword: "recipes step_pls"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_pls() in R: PLS Feature Extraction

<p class="lead">The recipes <code>step_pls()</code> function adds a supervised partial least squares (PLS) feature extraction step to a tidymodels recipe, replacing many correlated predictors with a few components built to predict your outcome.</p>

[QUICK ANSWER]
step_pls(rec, all_numeric_predictors(), outcome = "mpg")               # 2 comps (default)
step_pls(rec, all_numeric_predictors(), outcome = "mpg", num_comp = 5) # n components
step_pls(rec, disp, hp, wt, outcome = "mpg")                           # name predictors
step_pls(rec, all_numeric_predictors(), outcome = "mpg", predictor_prop = 0.5)  # sparse
step_pls(rec, all_numeric_predictors(), outcome = "mpg", num_comp = tune())      # tunable
rec |> prep() |> tidy(number = 1)                                      # inspect loadings

[DECISION TREE: Is step_pls() the right tool?]
- reduce predictors using the outcome: step_pls(rec, ..., outcome = "y")
- reduce predictors ignoring the outcome: step_pca(rec, all_numeric_predictors())
- drop near-zero-variance columns: step_nzv(rec, all_predictors())
- drop highly correlated columns: step_corr(rec, all_numeric_predictors())
- nonlinear dimension reduction: step_kpca(rec, all_numeric_predictors())
- find independent source signals: step_ica(rec, all_numeric_predictors())

## What step_pls() does

**step_pls() turns many predictors into a few outcome-aware components.** Partial least squares is a supervised cousin of principal component analysis. Where PCA finds directions of maximum *predictor* variance, PLS finds directions that are maximally correlated with the *outcome* you supply. Inside a recipe, `step_pls()` removes the selected predictor columns and writes `num_comp` new columns named `PLS1`, `PLS2`, and so on.

Because the components are steered toward the response, a model usually needs fewer PLS components than PCA components to reach the same accuracy. That makes `step_pls()` a strong choice when predictors are numerous, correlated, or collinear and you still want a compact, predictive feature set.

[KEY INSIGHT]
**PLS is PCA that has seen the answer key.** `step_pca()` compresses predictors blindly; `step_pls()` compresses them toward the outcome. If your reduced features will feed a predictive model, the supervised version almost always carries more signal per component.

## step_pls() syntax and arguments

**The function takes a recipe, a set of predictors, and the outcome to align against.** Its signature is `step_pls(recipe, ..., role = "predictor", outcome = NULL, num_comp = 2, predictor_prop = 1, options = list(predictor_scaling = TRUE), skip = FALSE, id = ...)`. The arguments you tune most often are below.

| Argument | Default | Purpose |
|---|---|---|
| `...` | none | Predictor columns fed into PLS, set with selectors like `all_numeric_predictors()`. |
| `outcome` | `NULL` | The response variable. Components are built to predict it. Required. |
| `num_comp` | `2` | Number of PLS components retained as new columns. |
| `predictor_prop` | `~1` | Maximum proportion of predictors allowed nonzero per component (sparse PLS). |
| `options` | `list(...)` | Passed to the underlying `mixOmics` fitter, including `predictor_scaling`. |
| `skip` | `FALSE` | If `TRUE`, the step is skipped when `bake()` runs on new data. |

[WARNING]
**step_pls() depends on the mixOmics Bioconductor package.** It is not a CRAN dependency of recipes, so a fresh install will error at `prep()`. Install it once with `BiocManager::install("mixOmics")` before building any recipe that uses this step.

## step_pls() examples

**These examples use `mtcars`, predicting `mpg` from the other numeric columns.** Each block builds on the recipe object from the first.

Start by declaring the recipe and adding the PLS step. Nothing is computed yet, the recipe only records the plan.

```r title="Build a recipe with step_pls"
library(recipes)

pls_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_pls(all_numeric_predictors(), outcome = "mpg", num_comp = 3)

pls_rec
#> -- Recipe ----------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 10
#> -- Operations
#> * PLS feature extraction with: all_numeric_predictors()
```

Call `prep()` to estimate the PLS rotation on the training data, then `bake()` to apply it. The 10 predictors collapse into 3 component columns.

```r title="Prep and bake the recipe"
pls_prep <- prep(pls_rec, training = mtcars)
pls_data <- bake(pls_prep, new_data = NULL)

head(pls_data, 4)
#> # A tibble: 4 x 4
#>     mpg   PLS1   PLS2    PLS3
#>   <dbl>  <dbl>  <dbl>   <dbl>
#> 1  21   -0.847  0.394  0.143
#> 2  21   -0.722  0.281 -0.0651
#> 3  22.8 -1.62   0.660  0.230
#> 4  21.4 -0.220 -1.30   0.0432
```

To see how each original predictor contributes to a component, call `tidy()` on the prepped recipe. The `value` column is the loading.

```r title="Inspect the PLS loadings"
tidy(pls_prep, number = 1) |> head(6)
#> # A tibble: 6 x 4
#>   terms value component id
#>   <chr> <dbl> <chr>     <chr>
#> 1 cyl   0.131 PLS1      pls_a1B2
#> 2 disp  0.139 PLS1      pls_a1B2
#> 3 hp    0.128 PLS1      pls_a1B2
#> 4 drat -0.118 PLS1      pls_a1B2
#> 5 wt    0.137 PLS1      pls_a1B2
#> 6 qsec -0.094 PLS1      pls_a1B2
```

The `num_comp` argument controls how many components you keep. Use a single component for a strong baseline, or more when one direction is not enough.

```r title="Set the number of components"
recipe(mpg ~ ., data = mtcars) |>
  step_pls(all_numeric_predictors(), outcome = "mpg", num_comp = 1) |>
  prep() |>
  bake(new_data = NULL) |>
  head(3)
#> # A tibble: 3 x 2
#>     mpg   PLS1
#>   <dbl>  <dbl>
#> 1  21   -0.847
#> 2  21   -0.722
#> 3  22.8 -1.62
```

[TIP]
**Tune num_comp instead of guessing it.** Pass `num_comp = tune()` and let `tune_grid()` pick the value that minimizes cross-validated error. A common range is 1 to the number of predictors, capped well below it.

Setting `predictor_prop` below 1 switches to sparse PLS, which forces some loadings to exactly zero. That yields components built from a subset of predictors, which is easier to interpret.

```r title="Fit sparse PLS with predictor_prop"
recipe(mpg ~ ., data = mtcars) |>
  step_pls(all_numeric_predictors(), outcome = "mpg",
           num_comp = 2, predictor_prop = 0.5) |>
  prep() |>
  tidy(number = 1) |>
  head(4)
#> # A tibble: 4 x 4
#>   terms value component id
#>   <chr> <dbl> <chr>     <chr>
#> 1 cyl   0     PLS1      pls_Xy9z
#> 2 disp  0.181 PLS1      pls_Xy9z
#> 3 hp    0.166 PLS1      pls_Xy9z
#> 4 drat  0     PLS1      pls_Xy9z
```

## step_pls() vs step_pca() and other reduction steps

**Pick step_pls() when the reduced features will feed a predictive model.** The other reduction steps ignore the outcome, so they optimize a different objective. The table compares the four most common choices.

| Step | Uses the outcome? | Best for | Component basis |
|---|---|---|---|
| `step_pls()` | Yes (supervised) | Predictive features from correlated predictors | Outcome-aligned directions |
| `step_pca()` | No (unsupervised) | Variance compression, exploratory analysis | Maximum predictor variance |
| `step_kpca()` | No | Nonlinear structure in predictors | Kernel-mapped variance |
| `step_ica()` | No | Separating independent source signals | Statistical independence |

The decision rule is simple. If you have a target variable and you want fewer, stronger features, reach for `step_pls()`. If you only want to compress predictors or explore them, `step_pca()` is the lighter, dependency-free option.

[NOTE]
**Coming from Python scikit-learn?** The equivalent of `step_pls()` is `sklearn.cross_decomposition.PLSRegression`, applied inside a `Pipeline` before the estimator.

## Common pitfalls

**Three mistakes cause most step_pls() failures.** Each one below shows the error and the fix.

Omitting `outcome` is the most frequent. PLS is supervised, so the step cannot run without a response.

```r title="Calling step_pls without an outcome"
recipe(mpg ~ ., data = mtcars) |>
  step_pls(all_numeric_predictors()) |>
  prep()
#> Error in `step_pls()`:
#> ! `outcome` should be a single character value, not `NULL`.
```

The second is the missing Bioconductor dependency. Install `mixOmics` once and the step works for every recipe afterward.

```r title="Missing mixOmics package"
# If mixOmics is not installed, prep() stops with:
#> Error: The mixOmics package is required for `step_pls()`.
#> Install it with: BiocManager::install("mixOmics")
```

The third is data leakage. PLS components are estimated using the outcome, so calling `prep()` on the full dataset lets test-set responses shape your features. Always `prep()` on training data only.

```r title="Prepping on the full dataset"
# WRONG: prep() sees every row, including the test set
bad_prep <- prep(pls_rec, training = mtcars)

# RIGHT: split first, then prep on the training rows only
train <- mtcars[1:24, ]
good_prep <- prep(pls_rec, training = train)
```

## Try it yourself

**Try it:** Build a recipe on `mtcars` that extracts 2 PLS components for `mpg`, then count the columns the baked data has. Save the result to `ex_pls`.

```r title="Your turn extract PLS components"
# Try it: extract 2 PLS components for mpg
ex_pls <- # your code here

ncol(ex_pls)
#> Expected: 3 (mpg + PLS1 + PLS2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pls <- recipe(mpg ~ ., data = mtcars) |>
  step_pls(all_numeric_predictors(), outcome = "mpg", num_comp = 2) |>
  prep() |>
  bake(new_data = NULL)

ncol(ex_pls)
#> [1] 3
```

**Explanation:** `step_pls()` replaces the 10 numeric predictors with `num_comp = 2` component columns. The baked tibble keeps the `mpg` outcome plus `PLS1` and `PLS2`, which is 3 columns total.

</details>

## Related recipes functions

These steps pair naturally with `step_pls()` in a preprocessing pipeline:

- [step_pca()](recipes-step_pca-in-R.html) for unsupervised variance-based dimension reduction.
- [step_kpca()](recipes-step_kpca-in-R.html) for nonlinear, kernel-based reduction.
- [step_ica()](recipes-step_ica-in-R.html) to separate independent source signals.
- [step_normalize()](recipes-step_normalize-in-R.html) to center and scale predictors before PLS.
- [step_corr()](recipes-step_corr-in-R.html) to drop highly correlated predictors as a lighter alternative.

See the official [recipes step_pls() reference](https://recipes.tidymodels.org/reference/step_pls.html) for the full argument list.

## FAQ

**What package does step_pls() need?**
`step_pls()` relies on the `mixOmics` package, which lives on Bioconductor rather than CRAN. Installing recipes alone is not enough. Run `BiocManager::install("mixOmics")` once, and every recipe that uses `step_pls()` will then prep without error. If you skip this, `prep()` stops with a message naming the missing package, so the fix is always clear.

**What is the difference between step_pls() and step_pca()?**
Both reduce many predictors into a few components, but `step_pca()` is unsupervised and `step_pls()` is supervised. PCA finds directions of maximum predictor variance, ignoring the outcome. PLS finds directions that best predict the outcome you pass through the `outcome` argument. For modeling, PLS components usually carry more predictive signal per component, so you need fewer of them.

**How many components should I use in step_pls()?**
Start with the default of 2 and tune from there. Set `num_comp = tune()` and use `tune_grid()` with cross-validation to pick the value that minimizes prediction error. The useful range runs from 1 up to the number of predictors, but the optimum is usually small because each PLS component is outcome-aligned and information-dense.

**Can step_pls() be used for classification?**
Yes. When the `outcome` is a factor, `step_pls()` performs PLS discriminant analysis (PLS-DA) under the hood, producing components that separate the classes. The recipe syntax is identical, you just point `outcome` at a categorical column instead of a numeric one.

**Does step_pls() scale the predictors automatically?**
Yes. By default the `options` argument sets `predictor_scaling = TRUE`, so predictors are centered and scaled before the PLS fit. This prevents large-range variables from dominating the components. You can still add `step_normalize()` earlier if other steps in your recipe need scaled inputs too.
