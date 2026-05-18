---
title: "parsnip multinom_reg() in R: Multinomial Logistic Regression"
slug: parsnip-multinom_reg-in-R
description: "Use parsnip multinom_reg() in R to fit multinomial logistic regression for 3+ class outcomes. Syntax, nnet and glmnet engines, predictions, and pitfalls."
keywords: "parsnip multinom_reg, multinom_reg function R, parsnip multinomial regression, multinomial logistic regression R tidymodels, multinom_reg examples, R multiclass classification"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Multinomial-Logistic-Regression-in-R.html
auto_link_terms: "multinom_reg()|parsnip multinom_reg|parsnip::multinom_reg()|multinomial logistic regression|multinomial regression in R"
auto_link_case_sensitive: true
target_keyword: "parsnip multinom_reg"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip multinom_reg() in R: Multinomial Logistic Regression

<p class="lead">The parsnip <code>multinom_reg()</code> function defines a multinomial logistic regression model for outcomes with three or more unordered classes. It gives you one consistent interface that fits with the nnet or glmnet engine underneath.</p>

[QUICK ANSWER]
multinom_reg()                                       # default spec, nnet engine
multinom_reg() |> set_engine("nnet")                 # neural-net multinomial fit
multinom_reg(penalty = 0.1) |> set_engine("glmnet")  # penalized multinomial fit
spec |> set_mode("classification")                   # only mode multinom_reg allows
fit(spec, Species ~ ., data = iris)                  # train on a 3+ class outcome
predict(fit, new_data)                               # hard class label per row
predict(fit, new_data, type = "prob")               # one probability per class

[DECISION TREE: Is multinom_reg() the right tool?]
- predict 3+ unordered classes: multinom_reg() |> set_engine("nnet")
- predict only 2 classes: logistic_reg() |> set_engine("glm")
- predict a numeric value: linear_reg() |> set_engine("lm")
- predict event counts: poisson_reg() |> set_engine("glm")
- want a tree-based multiclass model: rand_forest() or boost_tree()
- tune the penalty by resampling: tune() plus tune_grid()

## What multinom_reg() does

**multinom_reg() is a model specification, not a fitted model.** It records your intent to build a multinomial logistic regression and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

Multinomial logistic regression extends binary logistic regression to outcomes with more than two categories. Instead of one set of coefficients, it estimates a separate set for each class relative to a reference class, then converts those scores into probabilities that sum to one across all classes.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `multinom_reg()` code runs on the nnet engine or the penalized glmnet engine with only one line changed.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

## multinom_reg() syntax and arguments

**multinom_reg() takes two tuning arguments and two setup verbs.** The arguments control regularization, while `set_engine()` and `set_mode()` finish the specification.

```r title="The multinom_reg specification skeleton"
library(tidymodels)

multinom_reg(
  mode = "classification",  # the only valid mode
  engine = "nnet",          # nnet (default) or glmnet
  penalty = NULL,           # amount of regularization
  mixture = NULL            # ridge-to-lasso blend, glmnet only
)
```

The `penalty` argument sets the total amount of regularization applied to coefficients. The `mixture` argument, used only by glmnet, blends ridge (`mixture = 0`) and lasso (`mixture = 1`) penalties. The nnet engine ignores both arguments because it fits an unpenalized model.

**The mode is always classification.** Unlike `linear_reg()`, a multinomial model never predicts numbers, so `set_mode("classification")` is the only legal choice. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a multinomial model: four examples

**Every example below uses the built-in `iris` dataset.** Its `Species` column has three classes, setosa, versicolor, and virginica, which makes it a natural fit for a multinomial model.

### Example 1: Fit with the default nnet engine

**Build the specification, then fit it to data.** The nnet engine fits a multinomial model through a single-layer neural network.

```r title="Fit multinom_reg on the iris dataset"
multi_spec <- multinom_reg() |>
  set_engine("nnet") |>
  set_mode("classification")

multi_fit <- multi_spec |>
  fit(Species ~ ., data = iris)

multi_fit
#> parsnip model object
#>
#> Call:
#> multinom(formula = Species ~ ., data = data, trace = FALSE)
#>
#> Coefficients:
#>            (Intercept) Sepal.Length Sepal.Width Petal.Length Petal.Width
#> versicolor    18.69037    -5.458424   -8.707401     14.24477   -3.097684
#> virginica    -23.83628    -7.923634  -15.370769     23.65978   15.135301
#>
#> Residual Deviance: 11.9
#> AIC: 31.9
```

The fitted object reports one row of coefficients per non-reference class. Setosa is the reference, so versicolor and virginica each get a coefficient row.

### Example 2: Predict the most likely class

**predict() returns a tidy tibble with one row per input row.** The default prediction type gives the hard class label.

```r title="Predict class labels for new rows"
sample_rows <- iris[c(1, 60, 120), ]

predict(multi_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

Each output column from a parsnip model starts with `.pred`, which keeps prediction columns from clashing with your original data when you bind them back together.

### Example 3: Get per-class probabilities

**Set `type = "prob"` to see the probability of every class.** This is essential when you need a confidence score, not just a label.

```r title="Predict class probabilities"
predict(multi_fit, new_data = sample_rows, type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1     1.00             0.000000        0.       
#> 2     0.0000234        0.998           0.00150  
#> 3     0.               0.00000877      1.00
```

The three probability columns sum to one in every row. A near-1.0 value, as in row 1, signals a confident prediction.

### Example 4: Fit a penalized model with glmnet

**Switch to glmnet for regularized coefficients.** The glmnet engine needs a non-NULL `penalty`, and `mixture = 1` requests a pure lasso penalty that can shrink weak predictors to zero.

```r title="Fit a penalized multinomial model"
glmnet_fit <- multinom_reg(penalty = 0.01, mixture = 1) |>
  set_engine("glmnet") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(glmnet_fit, new_data = iris[c(1, 75, 150), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[TIP]
**Tune the penalty instead of guessing it.** Set `penalty = tune()` in the specification, then pass it to `tune_grid()` with a resampling object. The framework searches a grid of penalty values and reports which one generalizes best.

## multinom_reg() vs logistic_reg() vs other models

**Pick the model by counting your outcome classes.** `multinom_reg()` handles three or more unordered classes; the alternatives below cover the other cases.

| Function | Outcome type | Default engine | Use when |
|---|---|---|---|
| `multinom_reg()` | 3+ unordered classes | nnet | Species, product category, region |
| `logistic_reg()` | exactly 2 classes | glm | Yes/no, churn, spam |
| `linear_reg()` | numeric | lm | Price, temperature, score |
| `poisson_reg()` | non-negative counts | glm | Visits, defects, calls |
| `rand_forest()` | any classification or regression | ranger | Non-linear effects, interactions |

Use `multinom_reg()` when the outcome categories have no natural order and you want interpretable coefficients. If the classes are ordered, such as low-medium-high, a multinomial model ignores that order and an ordinal model fits better.

[NOTE]
**Coming from Python scikit-learn?** The equivalent of `multinom_reg()` is `LogisticRegression(multi_class="multinomial")`. The glmnet engine with a `penalty` maps to scikit-learn's `C` parameter, which is the inverse of regularization strength.

## Common pitfalls

**Three mistakes catch most newcomers to multinom_reg().** Each one below shows the error and the fix.

Forgetting the engine for glmnet leaves `penalty` unused. The nnet engine silently ignores `penalty`, so a model you expected to be regularized is not. Always call `set_engine("glmnet")` when you pass a `penalty`.

```r title="Penalty ignored without the glmnet engine"
# Wrong: nnet ignores penalty, model is unpenalized
multinom_reg(penalty = 0.1) |> set_engine("nnet")

# Right: glmnet actually applies the penalty
multinom_reg(penalty = 0.1) |> set_engine("glmnet")
```

A character outcome column also trips people up. parsnip expects the classification outcome to be a factor. Convert it first with `mutate(y = factor(y))` or the fit fails with a type error. Finally, the glmnet engine refuses to run when `penalty` is `NULL`, so always supply a numeric value or `tune()`.

## Try it yourself

**Try it:** Fit a multinomial model on `iris` using only the two petal columns as predictors, then predict the class of the 100th row. Save the prediction to `ex_pred`.

```r title="Your turn: petal-only multinomial"
# Try it: fit with Petal.Length and Petal.Width only
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred_class = versicolor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- multinom_reg() |>
  set_engine("nnet") |>
  set_mode("classification")

ex_fit <- ex_spec |>
  fit(Species ~ Petal.Length + Petal.Width, data = iris)

ex_pred <- predict(ex_fit, new_data = iris[100, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred_class
#>   <fct>
#> 1 versicolor
```

**Explanation:** The formula `Species ~ Petal.Length + Petal.Width` restricts the model to two predictors. Row 100 of `iris` is a versicolor flower, and the petal measurements alone classify it correctly.

</details>

## Related parsnip functions

**multinom_reg() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `logistic_reg()` defines a two-class logistic regression model.
- `linear_reg()` defines a regression model for numeric outcomes.
- `rand_forest()` defines a random forest for classification or regression.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What engine does multinom_reg() use by default?**

The default engine is `nnet`, which calls `nnet::multinom()` to fit the multinomial model through a single-layer neural network. It fits an unpenalized model and ignores the `penalty` and `mixture` arguments. To apply regularization, switch to the glmnet engine with `set_engine("glmnet")` and supply a numeric `penalty`. Always confirm the active engine with `show_engines("multinom_reg")` if you are unsure.

**What is the difference between multinom_reg() and logistic_reg()?**

`logistic_reg()` models an outcome with exactly two classes, while `multinom_reg()` models an outcome with three or more classes. Internally, the multinomial model estimates a separate set of coefficients for each class against a reference class. If you pass a three-class outcome to `logistic_reg()`, the fit fails, so match the function to the number of classes in your target variable.

**Does multinom_reg() require the outcome to be a factor?**

Yes. parsnip expects the classification outcome to be a factor, not a character or numeric vector. If your outcome is stored as text, convert it first with `mutate(species = factor(species))` before calling `fit()`. The factor levels also determine the reference class, which is the first level by default and the baseline for every coefficient.

**Can I tune the penalty in multinom_reg()?**

Yes, set `penalty = tune()` in the specification and use the glmnet engine. Pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`, and the framework searches a grid of penalty values. Use `select_best()` to pick the value with the best metric, then `finalize_workflow()` to lock it in before the final fit.

**Why do my predicted probabilities not match across engines?**

The nnet and glmnet engines fit different models. nnet fits an unpenalized maximum-likelihood model, while glmnet adds an L1 or L2 penalty controlled by `penalty` and `mixture`. A non-zero penalty shrinks coefficients toward zero, which changes the predicted probabilities. This difference is expected, so compare engines with a resampled metric rather than raw probabilities.

For the full argument reference, see the [parsnip multinom_reg() documentation](https://parsnip.tidymodels.org/reference/multinom_reg.html).
