---
title: "parsnip discrim_linear() in R: Build an LDA Classifier"
slug: parsnip-discrim_linear-in-R
description: "Learn how parsnip discrim_linear() defines a linear discriminant analysis model in R. Set the MASS, mda, or sda engine, fit LDA, and predict with examples."
keywords: "parsnip discrim_linear, discrim_linear function R, parsnip discrim_linear examples, linear discriminant analysis tidymodels, discrim_linear LDA R, discrim package R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "discrim_linear()|parsnip discrim_linear|discrim::discrim_linear()|tidymodels LDA|discrim_linear LDA"
auto_link_case_sensitive: true
target_keyword: parsnip discrim_linear
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip discrim_linear() in R: Build an LDA Classifier

<p class="lead">The parsnip discrim_linear() function defines a linear discriminant analysis (LDA) model in R, a fast classifier that draws straight-line boundaries between classes and plugs into any tidymodels workflow.</p>

[QUICK ANSWER]
discrim_linear()                                   # bare spec, classification
discrim_linear(mode = "classification")            # set mode inline
discrim_linear() |> set_engine("MASS")             # default MASS::lda engine
discrim_linear(penalty = 1) |> set_engine("mda")   # regularized LDA
discrim_linear() |> set_engine("sda")              # shrinkage discriminant
discrim_linear() |> fit(y ~ ., data = df)          # define and train
predict(fit, new_data, type = "prob")              # class probabilities

[DECISION TREE: Is discrim_linear() the right tool?]
- linear boundary, shared covariance: discrim_linear() |> set_engine("MASS")
- curved boundary, per-class covariance: discrim_quad()
- flexible nonlinear discriminant: discrim_flexible()
- fast probabilistic baseline classifier: naive_Bayes()
- predictor interactions matter: rand_forest()
- numeric outcome instead of a class: linear_reg()

## What discrim_linear() does

**discrim_linear() declares a classifier, it does not train one.** The function returns a model specification: an engine-agnostic description of the LDA model you want. No data touches it until you call `fit()`. That split keeps your modeling code portable across the whole tidymodels stack, so you can swap engines or resampling schemes without rewriting the spec.

Linear discriminant analysis assumes every class follows a Gaussian distribution and that all classes share one common covariance matrix. Under that assumption the decision boundary between any two classes is a straight line (or a flat hyperplane in higher dimensions). LDA estimates each class mean and the pooled covariance, then assigns a new observation to the class whose centre is closest in that covariance-adjusted distance.

[KEY INSIGHT]
**The shared-covariance assumption is what makes the boundary linear.** Give each class its own covariance matrix and the boundary curves, which is exactly what discrim_quad() does. LDA trades that flexibility for fewer parameters, so it stays stable on small datasets and rarely overfits.

## discrim_linear() syntax and arguments

**Two optional arguments plus the engine control how LDA is estimated.** Any argument you leave out falls back to the engine default, so a bare `discrim_linear()` call is valid on its own.

| Argument | What it controls | Typical value |
|---|---|---|
| `mode` | Only `"classification"` is supported | `"classification"` |
| `engine` | Fitting backend, set with `set_engine()` | `"MASS"`, `"mda"`, `"sda"` |
| `penalty` | Amount of regularization (mda and sda engines) | 0 to 1 |
| `regularization_method` | Covariance shrinkage style for the sparsediscrim engine | `"diagonal"`, `"shrink_cov"` |

You build a spec by piping the constructor into `set_engine()` and `set_mode()`.

```r title="Define an LDA spec"
library(parsnip)
library(discrim)

lda_spec <- discrim_linear() |>
  set_engine("MASS") |>
  set_mode("classification")

lda_spec
#> Linear Discriminant Model Specification (classification)
#>
#> Computational engine: MASS
```

The printed spec shows the engine and any arguments you set. Nothing is fitted yet, so this object is cheap to create and reuse across resamples.

## Fit an LDA model

**Pass a formula and a data frame to fit(), then predict on new rows.** LDA needs numeric predictors and no scaling, since the pooled covariance handles differing variances. Here it classifies the three species in the built-in `iris` dataset.

```r title="Fit an LDA model"
lda_fit <- lda_spec |>
  fit(Species ~ ., data = iris)

predict(lda_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

The fitted object wraps the trained `MASS::lda` model and predicts a tidy tibble. Because LDA produces posterior probabilities, you can also ask for the class probabilities behind each label.

```r title="Get class probabilities"
predict(lda_fit, iris[c(1, 60, 130), ], type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1     1.00            5.05e-22        2.59e-42
#> 2     2.84e-16        1.00            8.30e-08
#> 3     2.55e-43        1.20e-05        1.00
```

The `type = "prob"` argument returns one `.pred_<class>` column per class, and the values in each row sum to 1. These probabilities feed straight into yardstick metrics such as `roc_auc()`.

## Choosing an engine: MASS, mda, and sda

**The engine decides the algorithm behind a shared interface.** The default `MASS` engine wraps `MASS::lda()` and gives you textbook LDA with no tuning parameters. The other engines add regularization, which helps when you have many predictors relative to rows.

| Engine | Backend | Best for |
|---|---|---|
| `MASS` | `MASS::lda()` | Standard LDA, the default, no tuning |
| `mda` | `mda::fda()` | Penalized LDA via a ridge penalty |
| `sda` | `sda::sda()` | Shrinkage estimates for wide data |
| `sparsediscrim` | sparsediscrim methods | Regularized covariance, high dimensions |

The `penalty` argument is ignored by the `MASS` engine but active on `mda` and `sda`. Switching engines is a one-line change.

```r title="Regularized LDA with the mda engine"
ridge_fit <- discrim_linear(penalty = 1) |>
  set_engine("mda") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(ridge_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[NOTE]
**Each engine lives in its own package.** The `mda` engine needs the mda package installed, `sda` needs sda, and `sparsediscrim` needs sparsediscrim. Run `show_engines("discrim_linear")` to list every engine and the modes it supports.

## Common pitfalls

**Most discrim_linear() errors trace back to a missing package.** The function is exported by the discrim package, a parsnip extension, so loading parsnip alone is not enough to register the model.

```r title="discrim_linear needs the discrim package"
library(parsnip)

discrim_linear()
#> Error in discrim_linear(): could not find function "discrim_linear"
```

Adding `library(discrim)` registers the model and the spec builds cleanly. Two more traps to watch:

- LDA has no regression mode. Calling `set_mode("regression")` errors because discriminant analysis only predicts class labels, never a continuous number.
- LDA fails when a predictor is constant within a class or when two predictors are perfectly collinear, because the pooled covariance matrix becomes singular. Drop or combine those columns before fitting.

[WARNING]
**LDA assumes equal covariance across classes, and that assumption can mislead.** When one class is far more spread out than another, the linear boundary sits in the wrong place. Compare against discrim_quad(), which fits a separate covariance per class, before trusting an LDA result on heteroscedastic data.

## Try it yourself

**Try it:** Build an LDA spec with the MASS engine, fit it to classify `Species` from all columns of `iris`, and save the fitted model to `ex_lda_fit`.

```r title="Your turn: fit an LDA model"
# Try it: build and fit an LDA classifier
ex_lda_fit <- # your code here

ex_lda_fit
#> Expected: a parsnip model fit object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_lda_fit <- discrim_linear() |>
  set_engine("MASS") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

class(ex_lda_fit)
#> [1] "_lda"      "model_fit"
```

**Explanation:** The bare `discrim_linear()` constructor builds the spec, `set_engine("MASS")` picks the backend, and `fit()` trains the classifier on `iris`. The result is a parsnip `model_fit` wrapping the underlying `lda` object.

</details>

## Related parsnip functions

**discrim_linear() is one classifier in a family of parsnip specifications.** When the linear boundary is too rigid or the problem is not classification, these neighbors share the same `set_engine()` and `fit()` workflow:

- `discrim_quad()` fits quadratic discriminant analysis with a per-class covariance for curved boundaries.
- `discrim_flexible()` fits flexible discriminant analysis for nonlinear decision regions.
- `naive_Bayes()` is a fast probabilistic classifier that assumes feature independence.
- `multinom_reg()` fits multinomial logistic regression as a linear alternative.
- `set_engine()` chooses the computational backend for any spec.

See the [discrim package reference](https://discrim.tidymodels.org/reference/discrim_linear.html) for the full list of supported engines.

## FAQ

**What package is discrim_linear() in?**
The `discrim_linear()` function is exported by the discrim package, a parsnip extension for discriminant analysis models. Loading parsnip alone throws a "could not find function" error. Always run `library(discrim)` (or `library(tidymodels)` plus `library(discrim)`) before defining the spec. The discrim package registers the MASS, mda, sda, and sparsediscrim engines.

**What is the difference between discrim_linear() and discrim_quad()?**
Both fit discriminant analysis classifiers, but they differ in the covariance assumption. `discrim_linear()` assumes every class shares one covariance matrix, which produces a straight-line decision boundary. `discrim_quad()` gives each class its own covariance, which produces a curved boundary and adds flexibility at the cost of more parameters. Use LDA on small or noisy data and QDA when classes clearly differ in spread.

**Does discrim_linear() support regression?**
No. Linear discriminant analysis is a classification-only algorithm, so the spec accepts `set_mode("classification")` and nothing else. Calling `set_mode("regression")` raises an error stating that regression is not a known mode. For a numeric outcome, use `linear_reg()` or another regression model spec instead.

**How do I tune discrim_linear()?**
Mark the `penalty` argument for tuning by setting it to `tune()`, as in `discrim_linear(penalty = tune())`, and pick the `mda` or `sda` engine since the `MASS` engine has no tunable parameter. Build a grid with the dials package and pass it to `tune_grid()` with a resampling object. The tuning step reports the penalty that scores best on your chosen metric.

**What engines does discrim_linear() support?**
The default `MASS` engine fits classic LDA with `MASS::lda()`. The `mda` engine adds a ridge `penalty`, `sda` applies shrinkage estimates for wide datasets, and `sparsediscrim` exposes the `regularization_method` argument for high-dimensional covariance shrinkage. Call `show_engines("discrim_linear")` to see every registered engine and its supported mode.
