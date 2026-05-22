---
title: "caret varImp() in R: Rank Predictor Importance Scores"
slug: "caret-varImp-in-R"
description: "caret varImp() in R ranks predictor importance from any train object. Scaled scores, model-specific methods, plot/ggplot examples, and common pitfalls."
keywords: "caret varImp, varImp function R, caret varImp examples, R variable importance caret, caret feature importance, caret varImp plot, varImp randomForest caret"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "varImp()|caret varImp|caret::varImp()|variable importance in caret|caret feature importance"
auto_link_case_sensitive: true
target_keyword: "caret varImp"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret varImp() in R: Rank Predictor Importance Scores

<p class="lead">The <code>varImp()</code> function in caret extracts a ranked importance score for every predictor inside a fitted train object, scaling the result to 0 to 100 so models that use different raw scales become comparable. It dispatches to the model-specific importance method when available and falls back to a filter-based score otherwise.</p>

[QUICK ANSWER]
varImp(fit)                                  # scaled 0 to 100 importance
varImp(fit, scale = FALSE)                   # raw model-specific score
varImp(fit, useModel = FALSE)                # filter-based fallback score
varImp(fit)$importance                       # tidy data frame of scores
plot(varImp(fit))                            # lattice dot plot
ggplot(varImp(fit)) + theme_minimal()        # ggplot variant
varImp(fit_glm, scale = FALSE)               # raw t-statistic magnitudes

[DECISION TREE: Is varImp() the right tool?]
- rank predictors inside a fitted train object: varImp(fit)
- fit and tune the model first: train(y ~ ., data = df, method = "rf")
- score a held-out set, not rank predictors: predict(fit, newdata = test)
- compare two trained models on matched folds: resamples(list(a = fit1, b = fit2))
- need a model-agnostic permutation score: vip::vi(fit, method = "permute")
- want a stand-alone importance plot library: vip::vip(fit)

## What varImp() does in one sentence

**`varImp()` is caret's universal variable importance extractor.** You pass it a fitted `train` object and it returns a ranked, scaled importance score for every predictor that fed the model. The same call works whether the underlying method is a linear regression, a random forest, a boosted tree, or a regularized model, because caret dispatches to the method's own importance routine when one exists.

The function returns a list with two slots: `importance` (the data frame of scores) and `model` (the method name caret used). Calling `print()`, `plot()`, or `ggplot()` on the result formats the scores for inspection.

## varImp() syntax and arguments

**The signature is short, and almost every call uses two of the four arguments.**

```r title="Load caret and fit a baseline model"
library(caret)

set.seed(1)
fit_lm <- train(mpg ~ hp + wt + cyl + disp + qsec,
                data = mtcars, method = "lm")
varImp(fit_lm)
#> lm variable importance
#>
#>      Overall
#> wt   100.000
#> cyl   59.122
#> hp    27.181
#> disp  18.412
#> qsec   0.000
```

The full signature is:

```
varImp(object, useModel = TRUE, nonpara = TRUE, scale = TRUE, ...)
```

- `object`: a fitted model. Most commonly a `train` object, but `varImp()` also has methods for `randomForest`, `gbm`, `glmnet`, `rpart`, `earth`, and `mvr` objects directly.
- `useModel = TRUE`: dispatch to the model's own importance method (random forest's `MeanDecreaseGini`, glmnet's absolute coefficients, etc.). Set to `FALSE` to force a model-agnostic filter score instead.
- `nonpara = TRUE`: when the filter fallback runs and the outcome is numeric, fit a `loess` smoother per predictor; with `FALSE`, fit a linear regression per predictor.
- `scale = TRUE`: rescale all scores so the maximum is 100. Set to `FALSE` to keep the model's raw numbers (useful for cross-model comparison plots that need a real magnitude).

[NOTE]
**`useModel = TRUE` is the only sensible default for most workflows.** Filter-based importance ignores the trained model entirely and ranks predictors with a univariate test (loess or AUC). It is useful for screening before training but does not reflect what the fitted model actually used.

## varImp() examples by use case

### 1. Importance from a random forest

The random forest classifier reports `MeanDecreaseGini` (classification) or `IncNodePurity` (regression) for every predictor. caret rescales these to 0 to 100 by default.

```r title="varImp on a random forest classifier"
data(iris)
set.seed(1)
fit_rf <- train(Species ~ ., data = iris, method = "rf",
                trControl = trainControl(method = "none"))
varImp(fit_rf)
#> rf variable importance
#>
#>              Overall
#> Petal.Width  100.000
#> Petal.Length  92.476
#> Sepal.Length  21.358
#> Sepal.Width    0.000
```

`Petal.Width` lands at 100 because it is the most discriminative feature for separating the three iris species. `Sepal.Width` at zero means the forest never split on it usefully.

### 2. Raw scores with scale = FALSE

For cross-model comparisons or when you want to plot real magnitudes, drop the rescaling step.

```r title="Raw randomForest importance scores"
varImp(fit_rf, scale = FALSE)
#> rf variable importance
#>
#>              Overall
#> Petal.Width   42.371
#> Petal.Length  39.198
#> Sepal.Length  10.250
#> Sepal.Width    1.118
```

The relative ranking is identical; only the units changed. Use `scale = FALSE` when you want to combine two `varImp()` outputs on one plot and need the original axis.

### 3. Importance from a linear model

For `lm` and `glm`, caret reports the absolute value of the `t` statistic per coefficient (or the absolute `z` for logistic). Predictors with smaller `p` values rank higher.

```r title="Importance from a fitted glm classifier"
set.seed(1)
fit_glm <- train(Species ~ ., data = subset(iris, Species != "setosa"),
                 method = "glm", family = "binomial")
varImp(fit_glm)
#> glm variable importance
#>
#>              Overall
#> Petal.Length 100.000
#> Sepal.Width   31.840
#> Petal.Width    8.142
#> Sepal.Length   0.000
```

This is conceptually the same as reading `summary(fit_glm$finalModel)` and ranking by `|t|`. The benefit of `varImp()` is the consistent interface; you can swap `method = "glm"` for `method = "rf"` without changing downstream code.

### 4. Plot the scores

The returned object has `plot()` and `ggplot()` methods so you do not have to extract `$importance` manually.

```r title="Plot varImp with ggplot"
library(ggplot2)
ggplot(varImp(fit_rf)) +
  labs(title = "Variable importance from random forest",
       x = "Predictor", y = "Importance (0 to 100)") +
  theme_minimal()
```

`plot(varImp(fit_rf))` produces the equivalent lattice dot plot in one line. Both honor the `top` argument: `plot(varImp(fit), top = 10)` shows only the strongest ten predictors when you have a wide design matrix.

### 5. Filter-based importance (useModel = FALSE)

When the underlying model has no built-in importance routine, or when you want a model-independent baseline, set `useModel = FALSE`. caret then runs a per-predictor filter: AUC for classification, loess R-squared for regression.

```r title="Filter-based importance ignores the fitted model"
varImp(fit_glm, useModel = FALSE)
#> ROC curve variable importance
#>
#>              versicolor virginica
#> Petal.Length    100.000   100.000
#> Petal.Width      96.296    96.296
#> Sepal.Length     93.519    93.519
#> Sepal.Width      11.111    11.111
```

[KEY INSIGHT]
**The `useModel` toggle separates "what the model learned" from "what the data alone says".** With `useModel = TRUE`, you see the importance caret read out of the trained object. With `FALSE`, you see a univariate filter that does not know the model existed. The two ranks often disagree and the disagreement is informative.

## varImp() vs vip and model-specific functions

**`varImp()` is the caret-native API; `vip` is the modern stand-alone package; model-specific functions give the raw numbers.** Each has a place.

| Tool | Best for | Permutation importance | Active development |
|---|---|---|---|
| `varImp()` (caret) | One-line ranking from any caret train object | No | Maintenance mode |
| `vip::vi()` / `vip::vip()` | Cross-model importance with ggplot output; permutation, SHAP, and model-specific methods | Yes, via `method = "permute"` | Yes |
| `randomForest::importance()` | Raw forest scores with both Gini and accuracy measures | No (use `permimp` or `vip`) | Stable |
| `xgboost::xgb.importance()` | Booster-native gain, cover, and frequency | No directly | Yes |

Reach for `varImp()` when you have a caret workflow and want a single interface across methods. Reach for `vip` when you need permutation importance, partial dependence plots alongside importance, or a pipe-friendly API. See the caret reference at [topepo.github.io/caret/variable-importance.html](https://topepo.github.io/caret/variable-importance.html) for the full list of supported methods.

## Common pitfalls

**Pitfall 1: comparing scaled scores across models.** With `scale = TRUE`, every model's top predictor is 100 by definition, so a glmnet importance of 90 and a random forest importance of 90 carry no shared meaning. For cross-model plots, set `scale = FALSE` and use the raw numbers.

**Pitfall 2: assuming high importance implies a causal driver.** `varImp()` reports how much the model used a predictor, not whether the relationship is causal. Two correlated predictors will often split the importance between them, and dropping one can move the other up sharply.

**Pitfall 3: confusing dummy variables for the original factor.** When caret one-hot encodes a factor with five levels, you get four dummy columns in the importance table, not one row for the factor. To rank the original factor as a whole, sum the dummy rows or fit a tree-based method that handles factors natively.

[WARNING]
**`varImp()` returns NA for predictors the model never saw.** If a column was dropped during preprocessing (zero variance, perfect collinearity), it will not appear in the output at all. Always cross-check the row count of `varImp(fit)$importance` against the original predictor count.

## Try it yourself

**Try it:** Fit a random forest on `iris` predicting `Species`, then extract the raw (unscaled) variable importance and save it to `ex_imp`. Print the top row.

```r title="Your turn: raw rf importance"
# Try it: extract unscaled importance
ex_imp <- # your code here

head(ex_imp$importance, 1)
#> Expected: a single row for the most important predictor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_fit <- train(Species ~ ., data = iris, method = "rf",
                trControl = trainControl(method = "none"))
ex_imp <- varImp(ex_fit, scale = FALSE)
head(ex_imp$importance, 1)
#>             Overall
#> Petal.Width 42.371
```

**Explanation:** `scale = FALSE` returns the raw MeanDecreaseGini from the underlying randomForest object, preserving the magnitude needed for cross-model comparisons.

</details>

## Related caret functions

These caret functions complete a typical variable-importance workflow:

- `train()`: fits and tunes the model whose importance `varImp()` reads
- `predict.train()`: scores new data using the same fitted object
- `filterVarImp()`: model-free filter scores (what `useModel = FALSE` calls internally)
- `rfe()`: recursive feature elimination, which uses `varImp()` to rank predictors at each step
- `sbf()`: selection by filtering, a univariate alternative to `rfe()`

## FAQ

**What is the difference between varImp() and importance() from the randomForest package?**

`importance()` is the raw routine inside the randomForest package; `varImp()` is caret's wrapper that calls it (or its equivalent in gbm, glmnet, etc.) and rescales the output to 0 to 100. If you want the raw MeanDecreaseGini and MeanDecreaseAccuracy columns for a forest, call `randomForest::importance(fit$finalModel)`; if you want the same number that works for any caret model, call `varImp(fit)`.

**How does caret varImp() handle classification with more than two classes?**

For binary classification, `varImp()` returns one `Overall` column. For multi-class problems, the default filter score (`useModel = FALSE`) returns one column per class, ranking predictors by their pairwise AUC. With `useModel = TRUE`, the behaviour depends on the model: random forest reports a single Gini-based score per predictor across all classes, while glmnet returns one column per class because the coefficients are class-specific.

**Why are some of my varImp() scores exactly zero?**

A zero score with `scale = TRUE` means the predictor was the worst in the model (it gets rescaled to zero by definition). A zero score with `scale = FALSE` means the model never used the predictor at all: it was never selected for a split (tree-based) or its coefficient was driven to zero (glmnet at high lambda). The two cases look identical in the output, so check `scale` before drawing conclusions.

**Does varImp() support permutation importance?**

Not directly. caret's `varImp()` uses model-internal scores (Gini, t-statistic, coefficient magnitude) rather than permuting features. For permutation importance with a caret-fit model, use the vip package: `vip::vi(fit, method = "permute", target = "Species", metric = "accuracy", pred_wrapper = predict)`.

**Can I use varImp() on a model not trained with caret::train()?**

Yes, for a handful of model classes. caret provides direct methods for `randomForest`, `gbm`, `glmnet`, `rpart`, `earth`, and `mvr` objects, so `varImp(fit_rf)` works on the output of `randomForest::randomForest()` without going through `train()`. For other models, wrap the fit in `train(..., trControl = trainControl(method = "none"))` to get a train object, then call `varImp()` on it.
