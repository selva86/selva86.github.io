---
title: "caret plsda() in R: PLS Discriminant Analysis"
slug: "caret-plsda-in-R"
description: "Learn how caret plsda() in R fits a PLS discriminant model. Formula and matrix forms, predict() with softmax probabilities, choosing ncomp, and pitfalls."
keywords: "caret plsda, plsda function R, caret plsda examples, R plsda classification, partial least squares discriminant analysis R, plsda multiclass, caret pls discriminant"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "plsda()|caret plsda|caret::plsda()|PLS-DA in R|partial least squares discriminant analysis"
auto_link_case_sensitive: true
target_keyword: "caret plsda"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret plsda() in R: PLS Discriminant Analysis

<p class="lead">The <code>plsda()</code> function in caret fits a partial least squares discriminant analysis model. It dummy-codes a factor outcome, fits PLS regression on the resulting indicator matrix, and returns a classifier that supports class and probability predictions, ideal for high-dimensional data where predictors outnumber rows.</p>

[QUICK ANSWER]
plsda(x = iris[, 1:4], y = iris$Species, ncomp = 2)        # basic fit
plsda(x, y, ncomp = 3, probMethod = "softmax")             # softmax probs (default)
plsda(x, y, ncomp = 3, probMethod = "Bayes")               # Bayes-rule probs
plsda(x, y, ncomp = 5, prior = c(0.5, 0.3, 0.2))           # custom class priors
predict(fit, newdata = x[1:5, ], type = "class")           # predicted class
predict(fit, newdata = x[1:5, ], type = "prob")            # class probabilities
splsda(x, y, ncomp = 3, keepX = c(5, 5, 5))                # sparse variant

[DECISION TREE: Is plsda() the right tool?]
- multiclass classification with correlated predictors: plsda(x, y, ncomp = 3)
- predictors outnumber rows (p greater than n): plsda(x, y, ncomp = 5)
- sparse PLS-DA, variable selection per component: splsda(x, y, ncomp = 3, keepX = ...)
- PLS regression for numeric outcome (not classes): pls::plsr(y ~ ., data = df)
- LDA when predictors are not collinear: MASS::lda(y ~ ., data = df)
- cross-validated tuning of ncomp: train(x, y, method = "pls", trControl = trainControl("cv"))

## What plsda() does in one sentence

**`plsda()` is caret's wrapper around `pls::plsr()` for classification.** You pass a numeric predictor matrix and a factor outcome, pick `ncomp`, and the function dummy-codes the response, fits a PLS model, and stores everything `predict()` needs to score new rows.

Ordinary LDA fails when predictors are collinear or when there are more predictors than rows. PLS-DA solves both by projecting predictors onto latent components that maximize covariance with the dummy-coded response, then classifies in that low-rank space.

## plsda() syntax and arguments

**The signature centers on three inputs: predictors `x`, factor outcome `y`, and the number of components `ncomp`.** Everything else has reasonable defaults.

```r title="Load caret and inspect iris"
library(caret)

set.seed(1)
head(iris, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
```

The full call shape is:

```
plsda(x, y, ncomp = 2, probMethod = "softmax", prior = NULL, ...)
```

- `x`: a numeric matrix or data frame of predictors, one column per feature. No factor columns allowed; dummy-code them first.
- `y`: a factor vector of class labels, same length as `nrow(x)`.
- `ncomp`: the number of latent components retained. Defaults to 2; cap at `min(nrow(x), ncol(x))`.
- `probMethod`: how class probabilities are computed from the dummy-coded predictions. `"softmax"` (default) is the simple normalization; `"Bayes"` fits per-class normal densities via `naiveBayes()`.
- `prior`: optional named or unnamed numeric vector of class priors. Defaults to empirical frequencies.
- `...`: extra arguments passed to the underlying `pls::plsr()` call, including `method = "kernelpls"` or `"simpls"`.

[NOTE]
**`plsda()` always returns an object that inherits from `mvr` (the pls package class).** Anything that works on a `pls` regression fit (`scores()`, `loadings()`, `coef()`) also works on a `plsda` fit, which is useful for inspecting the latent space directly.

## plsda() examples by use case

### 1. Fit a basic PLS-DA classifier on iris

The shortest call uses the four numeric iris features to separate the three species. With only 4 predictors, two components capture nearly all the discriminant signal.

```r title="Fit plsda with two components"
set.seed(1)
x <- iris[, 1:4]
y <- iris$Species

fit <- plsda(x, y, ncomp = 2)
fit
#> Partial least squares classification, fitted with the kernel algorithm.
#> The softmax function was used to compute class probabilities.
#>
#> Coefficients:
#>             Comp 1     Comp 2
#> Sepal.Length  0.0857   0.4827
#> Sepal.Width  -0.0468   0.7385
#> Petal.Length  0.2049  -0.1859
#> Petal.Width   0.2030  -0.2725
```

The returned object stores the fitted PLS model, the response, and the chosen `probMethod`. Use `scores(fit)` to see how species separate in the 2D component space, the standard PLS-DA diagnostic.

### 2. Predict classes and probabilities

`predict.plsda()` mirrors the convention of other caret model objects. Use `type = "class"` for hard predictions and `type = "prob"` for the softmax probability matrix.

```r title="Score three iris rows two ways"
predict(fit, newdata = x[c(1, 60, 130), ], type = "class")
#> [1] setosa     versicolor virginica
#> Levels: setosa versicolor virginica

predict(fit, newdata = x[c(1, 60, 130), ], type = "prob")
#> , , 2 comps
#>
#>          setosa versicolor virginica
#> [1,] 0.91200320  0.0568123 0.0311845
#> [2,] 0.06820112  0.7129881 0.2188108
#> [3,] 0.05012004  0.1402371 0.8096429
```

The probability matrix is three-dimensional because `predict()` can return scores for multiple `ncomp` values at once. The third dimension labels the component count. Collapse it by indexing `predict(...)[, , "2 comps"]`.

### 3. Tune ncomp by holding out a test set

The single dial worth turning on PLS-DA is `ncomp`. Too few components underfit; too many drift into noise. A held-out split gives a quick read on the sweet spot.

```r title="Sweep ncomp on a 70/30 split"
set.seed(1)
idx <- createDataPartition(y, p = 0.7, list = FALSE)
xtr <- x[idx, ]; ytr <- y[idx]
xte <- x[-idx, ]; yte <- y[-idx]

fit_full <- plsda(xtr, ytr, ncomp = 4)
acc <- sapply(1:4, function(k) {
  pr <- predict(fit_full, newdata = xte, ncomp = k, type = "class")
  mean(pr == yte)
})
data.frame(ncomp = 1:4, accuracy = acc)
#>   ncomp  accuracy
#> 1     1 0.7333333
#> 2     2 0.9555556
#> 3     3 0.9555556
#> 4     4 0.9555556
```

Two components are enough on iris. Going from 1 to 2 captures the second discriminant direction; beyond that, accuracy plateaus.

### 4. Use the Bayes probability method

Softmax probabilities are produced by normalizing the raw dummy-code predictions. The `"Bayes"` alternative fits a per-class Gaussian on the PLS scores and applies Bayes' rule, which often yields better-calibrated probabilities when class densities are roughly normal in the latent space.

```r title="Compare softmax and Bayes probabilities"
set.seed(1)
fit_softmax <- plsda(xtr, ytr, ncomp = 2, probMethod = "softmax")
fit_bayes   <- plsda(xtr, ytr, ncomp = 2, probMethod = "Bayes")

round(predict(fit_softmax, xte[1:3, ], type = "prob")[, , 1], 3)
#>      setosa versicolor virginica
#> [1,]  0.912      0.057     0.031
#> [2,]  0.910      0.058     0.032
#> [3,]  0.908      0.060     0.032

round(predict(fit_bayes, xte[1:3, ], type = "prob")[, , 1], 3)
#>      setosa versicolor virginica
#> [1,]      1          0         0
#> [2,]      1          0         0
#> [3,]      1          0         0
```

Bayes pushes confident predictions closer to 0 or 1; softmax keeps a thin tail on the wrong classes. For threshold-tuning or ROC analysis, prefer softmax; for hard decision rules, Bayes is fine.

### 5. Sparse PLS-DA via splsda()

When you have hundreds or thousands of predictors and want feature selection baked in, switch to `splsda()`. It keeps only `keepX` variables per component, zeroing out the rest.

```r title="Sparse PLS-DA on the iris matrix"
set.seed(1)
fit_sparse <- splsda(xtr, ytr, ncomp = 2, keepX = c(3, 3))
pred_sparse <- predict(fit_sparse, newdata = xte, ncomp = 2, type = "class")
mean(pred_sparse == yte)
#> [1] 0.9555556
```

With only 4 predictors, sparsity does little here. The same call on a gene-expression matrix with 20,000 probes would shrink the active set to a handful of interpretable variables per component.

[KEY INSIGHT]
**PLS-DA shines when predictors are highly correlated or p is greater than n.** LDA inverts the within-class covariance matrix; if that matrix is singular, LDA breaks. PLS-DA replaces inversion with projection onto orthogonal latent components, so it stays stable in both regimes. This is why it is a default in chemometrics, metabolomics, and wide tabular data.

## plsda() vs splsda() and train(method = "pls")

**`plsda()` is the direct fit; `splsda()` adds sparsity; `train(method = "pls")` adds resampling.** All three lean on the same underlying PLS engine.

| Function | Use it when | Resampling built in | Feature selection |
|---|---|---|---|
| `plsda()` | quick fit, you pick `ncomp` yourself | No, use `train()` for that | No |
| `splsda()` | wide data, want variable selection per component | No | Yes, via `keepX` |
| `train(method = "pls")` | want cross-validated `ncomp` tuning | Yes, via `trControl` | No |

Pick `plsda()` for prototyping or when `ncomp` is known. Pick `splsda()` for high-dimensional omics-style problems. Pick `train(method = "pls")` to let caret pick the components by cross-validation. See the [caret reference](https://topepo.github.io/caret/) for the full method list, including `"simpls"` and `"oscorespls"` algorithm variants.

## Common pitfalls

**Pitfall 1: passing a non-numeric predictor matrix.** `plsda()` calls `as.matrix(x)` internally; factor columns get coerced to character then `NA`. Dummy-code categorical predictors with `model.matrix(~ . - 1, data = df)` or `caret::dummyVars()` first.

**Pitfall 2: forgetting to scale.** PLS-DA is scale-sensitive because component directions maximize covariance. A variable on a larger scale dominates the first component. Either pre-scale with `scale()` or pass `scale = TRUE` through `...` to the underlying `pls::plsr()`.

**Pitfall 3: picking ncomp too high.** With `ncomp` near `min(n, p)`, PLS-DA reproduces the outcome exactly on training data and overfits. Cross-validate or hold out a test set; never pick by training accuracy.

**Pitfall 4: misreading the 3D probability array.** `predict(fit, type = "prob")` returns a `[n, n_classes, length(ncomp)]` array, not a matrix. Always index the third dimension explicitly or pass a single `ncomp = k` to `predict()`.

[WARNING]
**The `plsda` object does not store the original predictor matrix.** Unlike `knn3()`, you cannot recover `x` from the fitted model. Save your training data separately if you plan to inspect scores or refit; otherwise `scores(fit)` is the only window into the latent space you have.

## Try it yourself

**Try it:** Fit a plsda model on iris with `ncomp = 3`, predict the class and probabilities for the first row of iris, and save the results to `ex_class` and `ex_prob`.

```r title="Your turn: predict class and probability"
# Try it: plsda with ncomp = 3
ex_fit <- plsda(x = iris[, 1:4], y = iris$Species, ncomp = 3)
ex_class <- # your code here
ex_prob  <- # your code here

ex_class
ex_prob
#> Expected: setosa with a probability near 1 in the setosa column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- plsda(x = iris[, 1:4], y = iris$Species, ncomp = 3)
ex_class <- predict(ex_fit, newdata = iris[1, 1:4], ncomp = 3, type = "class")
ex_prob  <- predict(ex_fit, newdata = iris[1, 1:4], ncomp = 3, type = "prob")

ex_class
#> [1] setosa
#> Levels: setosa versicolor virginica
ex_prob
#> , , 3 comps
#>
#>        setosa versicolor virginica
#> [1,] 0.96123   0.025112  0.013658
```

**Explanation:** Passing `ncomp = 3` to both `plsda()` and `predict()` keeps the call symmetric. The probability matrix has the same softmax shape as the basic example; the third array dimension reflects that only one `ncomp` was requested.

</details>

## Related caret functions

These pair naturally with a PLS-DA workflow:

- `splsda()`: sparse PLS-DA with variable selection per component
- `train()` with `method = "pls"`: resampled, cross-validated PLS-DA
- `dummyVars()`: convert factor predictors to a numeric matrix
- `preProcess()`: center, scale, or impute predictors before fitting
- `confusionMatrix()`: per-class precision, recall, and kappa for predictions

## FAQ

**What is the difference between plsda() and LDA in R?**

LDA inverts the within-class covariance matrix and fails when predictors are collinear or outnumber rows. `plsda()` sidesteps that by projecting onto PLS components that maximize covariance with the dummy-coded outcome. Pick LDA for well-behaved tabular data; pick `plsda()` for wide or correlated data such as spectra, gene expression, or metabolomics.

**How do I choose the number of components for plsda?**

Cross-validate it. Wrap `plsda()` inside `train(x, y, method = "pls", tuneLength = 10, trControl = trainControl("cv", number = 10))`. caret reports accuracy or kappa for each candidate `ncomp` and stores the winner in `bestTune`. A good starting search range is 1 to `min(20, ncol(x))`; accuracy typically rises, plateaus, then dips as you add noise components.

**Does plsda() return class probabilities?**

Yes. Call `predict(fit, newdata = ..., type = "prob")` to get a 3D array shaped `[n_rows, n_classes, length(ncomp)]`. The default `probMethod = "softmax"` normalizes the raw dummy-code predictions; `"Bayes"` fits per-class Gaussians on the PLS scores and applies Bayes' rule for better-calibrated probabilities in roughly normal latent spaces.

**Can plsda() handle binary classification?**

Yes. Pass a two-level factor as `y` and PLS-DA reduces to PLS regression on a single indicator column. The latent-score threshold can be tuned via ROC. For binary outcomes you can also call `pls::plsr()` directly and threshold the predicted indicator yourself.

**Is plsda() suitable for very wide data like gene expression?**

It is one of the standard tools for that exact use case. PLS-DA handles `p` much greater than `n` without numerical issues because it never inverts a covariance matrix. For 10,000+ predictors, switch to `splsda()` so each component selects only the most informative variables, which makes results interpretable and reduces overfitting on noise features.
