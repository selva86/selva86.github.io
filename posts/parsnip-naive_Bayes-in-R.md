---
title: "parsnip naive_Bayes() in R: Build a Naive Bayes Classifier"
slug: parsnip-naive_Bayes-in-R
description: "Learn how parsnip naive_Bayes() defines a naive Bayes classifier in R. Set the klaR or naivebayes engine, tune Laplace smoothing, and fit with examples."
keywords: "parsnip naive_Bayes, naive_Bayes function R, parsnip naive_Bayes examples, naive Bayes tidymodels R, naive_Bayes classifier R, R naive Bayes parsnip"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "naive_Bayes()|parsnip naive_Bayes|parsnip::naive_Bayes()|naive Bayes classifier|tidymodels naive Bayes"
auto_link_case_sensitive: true
target_keyword: parsnip naive_Bayes
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip naive_Bayes() in R: Build a Naive Bayes Classifier

<p class="lead">The parsnip naive_Bayes() function defines a naive Bayes classification model in R, a fast probabilistic classifier that plugs into any tidymodels engine.</p>

[QUICK ANSWER]
naive_Bayes()                                   # bare spec, classification
naive_Bayes(mode = "classification")            # set mode inline
naive_Bayes(Laplace = 1)                        # smoothing for zero counts
naive_Bayes(smoothness = 1.5)                   # kernel density bandwidth
naive_Bayes() |> set_engine("klaR")             # default klaR engine
naive_Bayes() |> set_engine("naivebayes")       # switch the fitting engine
naive_Bayes(Laplace = 1) |> fit(y ~ ., data = df)  # define and train

[DECISION TREE: Is naive_Bayes() the right tool?]
- fast probabilistic baseline classifier: naive_Bayes() |> set_engine("klaR")
- linear class boundary from group means: discrim_linear()
- curved per-class covariance boundary: discrim_quad()
- predictor interactions matter: rand_forest()
- distance-based class voting: nearest_neighbor()
- numeric outcome instead of a class: linear_reg()

## What naive_Bayes() does

**naive_Bayes() declares a classifier, it does not train one.** The function returns a model specification: an engine-agnostic description of the naive Bayes classifier you want. No data touches it until you call `fit()`. That split keeps your modeling code portable across the whole tidymodels stack.

A naive Bayes classifier applies Bayes' theorem with one simplifying assumption: every predictor is conditionally independent of the others once you know the class. For each class it multiplies the class prior by the likelihood of each feature, then picks the class with the highest score. The assumption is rarely true, yet the classifier stays accurate and trains in a single pass over the data.

[KEY INSIGHT]
**The "naive" assumption is a feature, not a bug.** Treating predictors as independent collapses a hard joint-density estimate into many easy one-dimensional ones. That is why naive Bayes trains fast, needs little data, and rarely overfits, making it a strong baseline before you reach for heavier models.

## naive_Bayes() syntax and arguments

**Two hyperparameters control how the classifier estimates probabilities.** Both arguments are optional, and any you leave out falls back to the engine default.

| Argument | What it controls | Typical value |
|---|---|---|
| `smoothness` | Kernel density bandwidth for numeric predictors | 0.5 to 2 |
| `Laplace` | Additive smoothing for zero-frequency categories | 0 to 3 |
| `mode` | Only `"classification"` is supported | `"classification"` |
| `engine` | Fitting backend, set with `set_engine()` | `"klaR"`, `"naivebayes"` |

You build a spec by piping the constructor into `set_engine()` and `set_mode()`.

```r title="Define a naive Bayes spec"
library(parsnip)
library(discrim)

nb_spec <- naive_Bayes(Laplace = 1) |>
  set_engine("klaR") |>
  set_mode("classification")

nb_spec
#> Naive Bayes Model Specification (classification)
#>
#> Main Arguments:
#>   Laplace = 1
#>
#> Computational engine: klaR
```

The printed spec shows your chosen arguments and the engine. Nothing is fitted yet, so this object is cheap to create and reuse.

## Fit a naive Bayes classifier

**Pass a formula and a data frame to fit(), then predict on new rows.** Naive Bayes handles numeric and categorical predictors and needs no scaling. Here it classifies the three species in the built-in `iris` dataset.

```r title="Fit a naive Bayes model"
nb_fit <- nb_spec |>
  fit(Species ~ ., data = iris)

predict(nb_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

The fitted object wraps the trained engine model and predicts a tidy tibble. Because naive Bayes is probabilistic, you can also ask for the class probabilities behind each label.

```r title="Get class probabilities"
predict(nb_fit, iris[c(1, 60, 130), ], type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1     1.00            1.31e-15        7.94e-23
#> 2     2.27e-69        0.999           7.41e-04
#> 3     1.51e-216       1.05e-05        1.00
```

The `type = "prob"` argument returns one `.pred_<class>` column per class, and the values in each row sum to 1. These probabilities feed straight into yardstick metrics like `roc_auc()`.

## Choosing an engine: klaR vs naivebayes

**The engine decides the algorithm behind a shared interface.** The default `klaR` engine wraps `klaR::NaiveBayes` and supports both `smoothness` and `Laplace`. The `naivebayes` engine wraps `naivebayes::naive_bayes`, runs faster, and has a lighter dependency footprint.

```r title="Switch to the naivebayes engine"
nb2_fit <- naive_Bayes() |>
  set_engine("naivebayes") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(nb2_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[NOTE]
**Each engine lives in its own package.** The `klaR` engine needs the klaR package installed, and `naivebayes` needs the naivebayes package. Run `show_engines("naive_Bayes")` to list every engine and the modes it supports.

## Common pitfalls

**Most naive_Bayes() errors trace back to a missing package.** The function is exported by the discrim package, not parsnip core, so loading parsnip alone is not enough.

```r title="Naive Bayes needs the discrim package"
library(parsnip)

naive_Bayes()
#> Error in naive_Bayes(): could not find function "naive_Bayes"
```

Adding `library(discrim)` registers the model and the spec builds cleanly. Two more traps to watch:

- Naive Bayes has no regression mode. Calling `set_mode("regression")` errors because the algorithm only predicts class labels, never a continuous number.
- A categorical level never seen with a class gets a likelihood of zero, which wipes out the whole product. Set `Laplace` to a small positive number to add pseudo-counts and avoid that collapse.

[WARNING]
**The independence assumption distorts predicted probabilities.** When predictors are strongly correlated, naive Bayes still picks the right class often, but its probabilities skew hard toward 0 and 1. Trust the class label more than the raw probability when features overlap.

## Try it yourself

**Try it:** Build a naive Bayes spec with `Laplace = 0.5`, fit it to classify `Species` from all columns of `iris`, and save the fitted model to `ex_nb_fit`.

```r title="Your turn: fit a naive Bayes model"
# Try it: build and fit a naive Bayes classifier
ex_nb_fit <- # your code here

ex_nb_fit
#> Expected: a parsnip model fit object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_nb_fit <- naive_Bayes(Laplace = 0.5) |>
  set_engine("klaR") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

class(ex_nb_fit)
#> [1] "_NaiveBayes" "model_fit"
```

**Explanation:** The spec sets `Laplace` smoothing and the mode, `set_engine("klaR")` picks the backend, and `fit()` trains the classifier on `iris`. The result is a parsnip `model_fit` wrapping the underlying `NaiveBayes` object.

</details>

## Related parsnip functions

**naive_Bayes() is one classifier in a family of parsnip specifications.** When the independence assumption is too strong, these neighbors share the same `set_engine()` and `fit()` workflow:

- `discrim_linear()` fits linear discriminant analysis for a linear class boundary.
- `discrim_quad()` fits quadratic discriminant analysis with a per-class covariance.
- `rand_forest()` averages many trees when predictor interactions matter.
- `nearest_neighbor()` classifies by distance-based voting.
- `set_engine()` chooses the computational backend for any spec.

See the [tidymodels parsnip reference](https://parsnip.tidymodels.org/reference/naive_Bayes.html) for the full list of supported engines.

## FAQ

**What package is naive_Bayes() in?**
The `naive_Bayes()` function is exported by the discrim package, a parsnip extension for discriminant and Bayesian classifiers. Loading parsnip alone throws a "could not find function" error. Always run `library(discrim)` (or `library(tidymodels)` plus `library(discrim)`) before defining the spec. The discrim package also registers the klaR, naivebayes, and h2o engines.

**Does naive_Bayes() support regression?**
No. Naive Bayes is a classification-only algorithm, so the spec accepts `set_mode("classification")` and nothing else. Calling `set_mode("regression")` raises an error stating that regression is not a known mode. For a numeric outcome, use `linear_reg()` or another regression model spec instead.

**What does the Laplace argument do?**
`Laplace` adds a small constant to every feature-class count before estimating probabilities. Without it, a categorical level that never appears with a class gets a probability of zero, and that zero wipes out the entire product for that class. Setting `Laplace = 1` (add-one smoothing) is a common safe default that keeps every class in contention.

**Should I use the klaR or naivebayes engine?**
Use the default `klaR` engine for general work; it is well tested and supports both `smoothness` and `Laplace`. Choose the `naivebayes` engine when you want faster fitting and a lighter dependency, especially on larger datasets. Both share the same parsnip interface, so switching engines is a one-line change to `set_engine()`.

**How do I tune the smoothness parameter?**
Mark the argument for tuning by setting it to `tune()`, as in `naive_Bayes(smoothness = tune())`. Then build a grid with the dials package and pass it to `tune_grid()` along with a resampling object. The tuning step searches the candidate values and reports the bandwidth that scores best on your chosen metric.
