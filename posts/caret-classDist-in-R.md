---
title: "caret classDist() in R: Distance to Class Centroids"
slug: caret-classDist-in-R
description: "Learn how caret classDist() in R computes Mahalanobis distances from each sample to class centroids, turning class structure into model-ready features."
keywords: "caret classDist, classDist function R, caret classDist examples, R class distance features, Mahalanobis distance R caret, classDist predict R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: caret-functions
fr_parent: R-Tutorial.html
auto_link_terms: "classDist()|caret classDist|caret::classDist()|class distance features|Mahalanobis distance features"
auto_link_case_sensitive: true
target_keyword: "caret classDist"
sibling_block_enabled: true
difficulty: Intermediate
---

# caret classDist() in R: Distance to Class Centroids

<p class="lead">The caret classDist() function in R computes the Mahalanobis distance from every sample to each class centroid, turning the geometry of your classes into a compact set of numeric predictors you can feed straight into a model.</p>

[QUICK ANSWER]
classDist(x, y)                          # build a distance model from predictors and labels
classDist(x, y, pca = TRUE)              # decorrelate predictors with PCA first
classDist(x, y, keep = 3)                # retain only the first 3 PCA components
classDist(x, y_numeric, groups = 5)      # bin a numeric outcome into 5 pseudo-classes
predict(dist_model, newdata)             # log Mahalanobis distance to each centroid
predict(dist_model, newdata, trans = I)  # raw distance, skip the log transform

[DECISION TREE: Is classDist() the right tool?]
- add class-distance features: classDist(x, y) then predict()
- center and scale predictors: preProcess(x, method = c("center","scale"))
- reduce dimensions only: preProcess(x, method = "pca")
- drop correlated predictors: findCorrelation(cor(x))
- score one row's outlierness: mahalanobis(row, colMeans(x), cov(x))
- rank predictor importance: filterVarImp(x, y)

## What classDist() does

**classDist() is a feature-engineering helper, not a classifier.** It splits the training data by class, computes each class centroid and covariance matrix, and stores them in a small model object. The companion `predict()` method then measures how far any new row sits from each of those centroids using Mahalanobis distance.

The output is one new numeric column per class. A row that clearly belongs to a class will have a small distance to that centroid and large distances to the others. Those distances encode class structure that a linear model cannot see on its own, which is why classDist features often help logistic regression and other simple learners pick up curved class boundaries.

[KEY INSIGHT]
**Mahalanobis distance is covariance-aware.** Unlike plain Euclidean distance, it rescales each direction by the class covariance, so a sample is judged close to a centroid only if it sits inside that class's natural spread, not just near its mean.

## Syntax and arguments

**classDist() needs only predictors and labels to run.** Everything else has a sensible default. The model is built with `classDist()` and queried with `predict()`.

```r title="Function signature"
classDist(x, y, groups = 5, pca = FALSE, keep = NULL, ...)
predict(object, newdata, trans = log, ...)
```

| Argument | Belongs to | Purpose |
|----------|-----------|---------|
| `x` | `classDist` | Matrix or data frame of numeric predictors |
| `y` | `classDist` | Factor of class labels, or a numeric outcome |
| `groups` | `classDist` | Number of bins when `y` is numeric |
| `pca` | `classDist` | Apply PCA before splitting by class |
| `keep` | `classDist` | Number of PCA components to retain |
| `newdata` | `predict` | New rows to score against the stored centroids |
| `trans` | `predict` | Transform applied to each distance (`log` by default) |

## Build a distance model and predict

**Start by splitting your data, then fit on the training rows only.** The `iris` dataset gives four numeric predictors and a clean three-class factor.

```r title="Build a class distance model"
library(caret)
set.seed(1)
train_idx <- sample(1:150, 100)

dist_model <- classDist(iris[train_idx, 1:4], iris$Species[train_idx])
test_dist  <- predict(dist_model, iris[-train_idx, 1:4])
head(test_dist, 4)
#>   dist.setosa dist.versicolor dist.virginica
#> 1    1.000936        4.873514       6.046934
#> 2    1.846935        4.727342       5.882662
#> 3    1.401203        4.692118       5.910477
#> 4    1.622540        4.518900       5.745321
```

Each test row now has three numbers: its log Mahalanobis distance to the setosa, versicolor, and virginica centroids. The small `dist.setosa` values above show these first rows are setosa flowers sitting tightly inside that class.

## Use the distances as model features

**The distances make a strong nearest-centroid classifier on their own.** Assign each row to the class with the smallest distance and compare against the true labels.

```r title="Classify by nearest class centroid"
pred_class <- colnames(test_dist)[apply(test_dist, 1, which.min)]
pred_class <- sub("dist\\.", "", pred_class)

mean(pred_class == iris$Species[-train_idx])
#> [1] 0.98
```

More often you keep all three columns and pass them to a real model as engineered features, alongside or instead of the raw predictors. Because the columns are already class-aware, a plain `glm()` or `train()` call tends to converge fast and generalize well.

[TIP]
**Pair classDist() with train() for a clean workflow.** Generate the distance columns on the training fold, bind them to your predictors, and let `train()` resample over the combined frame so the new features are validated like any other.

## Decorrelate predictors with PCA

**Set `pca = TRUE` when predictors are strongly correlated.** Mahalanobis distance inverts each class covariance matrix, and that inversion is unstable when columns are nearly collinear. Rotating the data to principal components first removes the correlation and stabilizes the calculation.

```r title="Decorrelate predictors with PCA"
pca_model <- classDist(iris[train_idx, 1:4], iris$Species[train_idx],
                       pca = TRUE, keep = 3)
pca_dist  <- predict(pca_model, iris[-train_idx, 1:4])
head(pca_dist, 3)
#>   dist.setosa dist.versicolor dist.virginica
#> 1    1.118402        4.402915       5.713088
#> 2    1.905117        4.281640       5.560224
#> 3    1.520338        4.260771       5.598110
```

The `keep` argument caps how many components feed the distance, which is a quick guard against high-dimensional, low-sample data where the covariance matrix would otherwise be singular.

## Tune the transform and handle numeric outcomes

**The default `trans = log` compresses the long right tail of raw distances.** Pass `trans = I` to keep raw Mahalanobis values, or any function you like.

```r title="Raw distances and a numeric outcome"
raw_dist <- predict(dist_model, iris[-train_idx, 1:4], trans = I)
round(head(raw_dist, 2), 2)
#>   dist.setosa dist.versicolor dist.virginica
#> 1        2.72          130.85         422.94
#> 2        6.34          113.05         358.71

num_model <- classDist(mtcars[, c("hp", "wt", "disp")], mtcars$mpg,
                        groups = 3)
num_model$classes
#> [1] "1" "2" "3"
```

When `y` is numeric, classDist() bins it into `groups` roughly equal-sized classes and treats each bin as a pseudo-class, so the same distance machinery works for regression problems too.

## classDist() vs other distance approaches

**classDist() is the only option here that produces per-class features.** The alternatives solve narrower problems.

| Approach | Output | Best for |
|----------|--------|----------|
| `classDist()` | One distance column per class | Class-aware features for any model |
| `mahalanobis()` | One distance per row | Outlier scoring against a single centroid |
| `preProcess(method = "pca")` | Rotated components | Dimension reduction without class labels |
| `knn3()` | Class predictions | Direct classification, not features |

Reach for `classDist()` when you want the class structure available as ordinary numeric columns; reach for `mahalanobis()` when you only need a single distance and have no class split.

## Common pitfalls

**Three mistakes account for most classDist() errors.** Each has a direct fix.

- **Too few rows per class.** Each class needs more rows than predictors, or its covariance matrix is singular and the inversion fails. Set `pca = TRUE` with a small `keep` value to shrink the dimension.
- **Non-numeric columns in `x`.** classDist() expects numeric predictors only. Run categorical columns through `dummyVars()` first, or drop them.
- **Fitting on the full dataset.** Building the model on rows you later score leaks information. Always fit on a training split and `predict()` on held-out rows.

[WARNING]
**A singular covariance matrix throws a hard error.** If `classDist()` stops with a "system is computationally singular" message, you have collinear predictors or too few rows in a class. PCA with `keep` set low is the standard cure.

## Try it yourself

**Try it:** Build a classDist() model on the first 100 rows of `iris`, predict distances for the last 50 rows, and save the result to `ex_dist`.

```r title="Your turn: build a distance model"
# Try it: classDist on iris
ex_model <- # your code here
ex_dist  <- # your code here

dim(ex_dist)
#> Expected: 50 rows, 3 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_model <- classDist(iris[1:100, 1:4], iris$Species[1:100])
ex_dist  <- predict(ex_model, iris[101:150, 1:4])
dim(ex_dist)
#> [1] 50  3
```

**Explanation:** classDist() fits on the first 100 rows and stores three class centroids. predict() then returns one log-distance column per class for the 50 held-out rows.

</details>

## Related caret functions

Build a full feature-engineering pipeline by combining classDist() with these caret helpers:

- `preProcess()` to center, scale, and PCA-transform predictors
- `dummyVars()` to convert factors into numeric columns classDist() can use
- `findCorrelation()` to drop redundant predictors before fitting
- `nearZeroVar()` to remove low-variance columns
- `train()` to resample and validate the engineered features

## FAQ

**What does caret classDist() actually return?**
`classDist()` returns a small model object holding each class centroid, its covariance matrix, and an optional PCA rotation. It does not return distances directly. You get the distances by calling `predict()` on the object with new data, which produces one numeric column per class.

**Why are the distances logged by default?**
Raw Mahalanobis distances have a long right tail because far-away points produce very large values. The default `trans = log` compresses that tail so the columns behave better as model inputs. Pass `trans = I` if you want the raw distances instead.

**When should I set pca = TRUE?**
Use `pca = TRUE` when your predictors are strongly correlated or when some classes have fewer rows than predictors. PCA rotates the data so the covariance matrix is easier to invert, and the `keep` argument lets you cap the number of components to avoid a singular matrix.

**Can classDist() handle a numeric outcome?**
Yes. When `y` is numeric, classDist() splits it into `groups` roughly equal-sized bins and treats each bin as a class. The distance features then describe which part of the outcome range a row resembles, which can help regression models.

**Is classDist() a classifier?**
No. classDist() is a feature-engineering tool. It produces distance columns you feed into a separate model. You can build a quick nearest-centroid classifier by picking the smallest distance per row, but that is a side use, not its purpose.
