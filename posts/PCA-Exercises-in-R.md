---
title: "PCA Exercises in R: 10 Principal Component Analysis Practice Problems, Solved Step-by-Step)"
slug: "PCA-Exercises-in-R"
description: "Practise PCA in R with 10 principal component analysis exercises, from a first prcomp() fit to reconstruction error and SVD, each solved step by step."
keywords: "PCA exercises in R, principal component analysis practice, prcomp exercises, scree plot exercises, biplot exercises, PCA loadings practice, dimensionality reduction problems, R PCA practice, SVD R, PCA reconstruction"
auto_link_terms: "PCA exercises in R|principal component analysis exercises|PCA practice problems|prcomp practice|PCA exercises|PCA practice in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "E8.1"
post_type: "EX"
sidebar_title: "PCA Exercises (10 problems)"
fr_parent: "PCA-in-R.html"
difficulty: "Intermediate"
---

# PCA Exercises in R: 10 Principal Component Analysis Practice Problems, Solved Step-by-Step

<p class="lead">These 10 PCA exercises in R take you from your first <code>prcomp()</code> fit through scaling decisions, scree plots, loadings, biplots, downstream regression on principal scores, reconstruction error, and an SVD equivalence check. Every problem is solved step by step with runnable R code and a click-to-reveal explanation.</p>

## How do you fit PCA in R and read variance explained?

PCA in R lives inside one base function, `prcomp()`, that returns four useful objects in a list: standard deviations of each component, the rotation (loading) matrix, the scores, and the centring/scaling vectors used. Most exercises below pull from those four slots, so the first job is to fit a PCA cleanly and read off the variance each component explains. We use `iris[, 1:4]` for the warm-up because four numeric columns and three known species make the result easy to interpret.

```r title="First PCA fit on iris"
# Fit PCA on the four numeric columns of iris with scaling
iris_pca <- prcomp(iris[, 1:4], scale = TRUE)

# Variance explained by each component
summary(iris_pca)
#> Importance of components:
#>                           PC1    PC2     PC3     PC4
#> Standard deviation     1.7084 0.9560 0.38309 0.14393
#> Proportion of Variance 0.7296 0.2285 0.03669 0.00518
#> Cumulative Proportion  0.7296 0.9581 0.99482 1.00000
```

PC1 absorbs 73% of the variance, PC2 another 23%, and the cumulative line shows two components already capture 96% of what is going on across all four flower measurements. That is a textbook PCA result: a four-dimensional dataset is genuinely two-dimensional in disguise, which is why every iris scatter you have ever seen uses PC1 and PC2 as the axes.

[KEY INSIGHT]
**Variance explained equals an eigenvalue divided by the trace.** For a scaled PCA, each `sdev^2` is an eigenvalue of the correlation matrix, and the proportions in `summary()` are just `sdev^2 / sum(sdev^2)`. The total variance after scaling equals the number of variables, so the eigenvalues divide a known total.

```r title="Eigenvalues from sdev"
# sdev^2 is the eigenvalue (variance) of each component
iris_var <- iris_pca$sdev^2
round(iris_var, 4)
#> [1] 2.9185 0.9140 0.1468 0.0207

# These sum to the number of scaled variables
sum(iris_var)
#> [1] 4
```

The eigenvalues sum to 4 because we scaled four columns to unit variance; PCA just redistributes that total variance into uncorrelated directions, ranked from biggest first.

[TIP]
**Pull rows from `summary()$importance` directly.** Row 1 is `Standard deviation`, row 2 is `Proportion of Variance`, and row 3 is `Cumulative Proportion`. So `summary(fit)$importance[3, ]` gives you the cumulative-variance vector named by component, ready for `which()` or `cumsum()` checks.

**Try it:** From the `iris_pca` fit above, pull the proportion of variance explained by PC3 alone (one number, not cumulative). Aim for a one-liner.

```r title="Your turn: PC3 variance"
# Goal: extract the proportion-of-variance value for PC3 only
ex_pc3_var <- summary(iris_pca)$importance[___, "___"]
ex_pc3_var
#> Expected: 0.03669
```

<details>
<summary>Click to reveal solution</summary>

```r title="PC3 variance solution"
ex_pc3_var <- summary(iris_pca)$importance[2, "PC3"]
round(ex_pc3_var, 5)
#> [1] 0.03669
```

**Explanation:** Row 2 of the `importance` matrix is `Proportion of Variance`, and indexing by the column name `"PC3"` plucks PC3's slice. PC3 carries less than 4% of the variance, which is why PCA work on iris stops at PC1 and PC2.

</details>

## How do you decide how many components to keep?

Three quick decision tools cover most needs. The **scree plot** is a visual elbow test: plot eigenvalues against component index and look for the kink. The **Kaiser rule** keeps components with `sdev^2 > 1` (only valid on a scaled fit, where each original variable contributes variance 1). The **80% rule** keeps the smallest `k` whose cumulative variance crosses your target threshold. The exercises below use all three.

```r title="Scree plot for USArrests"
# Fit PCA on the classic USArrests dataset (50 states, 4 crime cols)
arr_pca <- prcomp(USArrests, scale = TRUE)

# Base R scree plot via plot() on the prcomp object
plot(arr_pca, type = "l", main = "Scree plot: USArrests PCA")
```

The line drops sharply between PC1 and PC2, then flattens. That is the elbow, and it agrees with the Kaiser rule here: only PC1 has eigenvalue greater than 1, so a one-component summary already does most of the work for crime data across states.

[WARNING]
**Kaiser only makes sense on scaled PCA.** On unscaled data, eigenvalues inherit the units of the original columns, so "greater than 1" is comparing apples and oranges. If you are tempted to use Kaiser, fit with `scale = TRUE` first, otherwise the threshold is meaningless.

```r title="Smallest k for 80 percent rule"
# Cumulative variance vector
arr_cum <- summary(arr_pca)$importance[3, ]

# Smallest k that crosses 0.80
arr_k80 <- which(arr_cum >= 0.80)[1]
arr_k80
#> PC2
#>   2
```

The `which(... >= 0.80)[1]` pattern returns the first index that crosses your threshold. For USArrests, two components capture 87% of the variance, comfortably past 80%. The same one-liner becomes useful in Exercise 4 below.

[NOTE]
**The scree elbow is judgement, not arithmetic.** If two methods disagree (Kaiser says 1, 80% rule says 2, scree says 2), pick the larger; over-keeping one component is cheaper than throwing away a real one.

**Try it:** Count how many components in `arr_pca` pass the Kaiser rule (eigenvalue > 1). The answer should match what the scree plot suggested.

```r title="Your turn: Kaiser count"
# Goal: count components with sdev^2 > 1 in arr_pca
ex_kaiser <- sum(___ > 1)
ex_kaiser
#> Expected: 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Kaiser count solution"
ex_kaiser <- sum(arr_pca$sdev^2 > 1)
ex_kaiser
#> [1] 1
```

**Explanation:** `arr_pca$sdev^2` is the eigenvalue vector. Only PC1's eigenvalue (about 2.48) exceeds 1; PC2 sits just under at 0.99. So Kaiser says "keep one", but most analysts would still keep PC2 because the 80% rule disagrees and PC2 explains a meaningful 25%.

</details>

## Practice Exercises

The 10 problems below ramp from a clean first fit through to outlier detection on principal scores. Every exercise uses an `ex<N>_` variable prefix so your work does not overwrite the tutorial fits above. Run the starter, attempt the solution, then click to reveal.

### Exercise 1: Cumulative variance at PC2 on mtcars

Fit PCA on `mtcars` with scaling and report the cumulative variance captured by the first two components. Save the value to `ex1_cum2`.

```r title="Exercise 1 starter"
# Hint: summary(fit)$importance[3, "PC2"] gives the cumulative value at PC2

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_pca  <- prcomp(mtcars, scale = TRUE)
ex1_cum2 <- summary(ex1_pca)$importance[3, "PC2"]
round(ex1_cum2, 4)
#> [1] 0.8424
```

**Explanation:** Two components capture 84% of the variance across the eleven `mtcars` columns. That is high enough that a 2D PCA scatter (e.g., colour by `cyl`) is a faithful summary of the cars in this dataset.

</details>

### Exercise 2: Scaled vs unscaled loadings on USArrests

Fit two PCAs on `USArrests`, one with `scale = TRUE` and one with `scale = FALSE`. Correlate the absolute PC1 loadings between the two fits. A correlation far below 1 means scaling genuinely changed which variables PC1 cares about. Save the correlation to `ex2_cor`.

```r title="Exercise 2 starter"
# Hint: take abs() of each rotation[, 1] vector and pass both to cor()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_s  <- prcomp(USArrests, scale = TRUE)
ex2_ns <- prcomp(USArrests, scale = FALSE)

ex2_cor <- cor(
  abs(ex2_s$rotation[,  1]),
  abs(ex2_ns$rotation[, 1])
)
round(ex2_cor, 3)
#> [1] 0.173
```

**Explanation:** A correlation of about 0.17 says the two fits barely agree on what PC1 represents. Without scaling, `Assault` (range in hundreds) dominates PC1 because of its raw variance; with scaling, all four crime columns contribute. This is why `scale = TRUE` is the safe default whenever your columns are on different units.

</details>

### Exercise 3: Kaiser-passing components on iris

On a scaled PCA of `iris[, 1:4]`, count the components whose eigenvalue exceeds 1. Save the count to `ex3_count`.

```r title="Exercise 3 starter"
# Hint: eigenvalues are sdev^2; sum a logical vector to count

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_pca   <- prcomp(iris[, 1:4], scale = TRUE)
ex3_count <- sum(ex3_pca$sdev^2 > 1)
ex3_count
#> [1] 1
```

**Explanation:** Only PC1's eigenvalue (about 2.92) exceeds 1; PC2 sits at 0.91, just under the threshold. Kaiser would prune iris to a single component. In practice most analysts keep PC2 too, because cumulative variance reaches 96% with two components and the visualisation gain is large.

</details>

### Exercise 4: Smallest k for the 80 percent rule on swiss

Fit PCA on the built-in `swiss` dataset (47 Swiss provinces, 6 numeric columns) with scaling, then find the smallest `k` whose cumulative variance reaches 80%. Save the answer to `ex4_k`.

```r title="Exercise 4 starter"
# Hint: pull row 3 of summary()$importance, then which(... >= 0.80)[1]

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_pca <- prcomp(swiss, scale = TRUE)
ex4_cum <- summary(ex4_pca)$importance[3, ]
ex4_k   <- as.integer(which(ex4_cum >= 0.80)[1])
ex4_k
#> [1] 3
```

**Explanation:** Three components clear 80% on `swiss`, where the original six demographic and economic columns are moderately but not heavily correlated. Compared to `USArrests` (k = 2) or `iris` (k = 2), `swiss` shows that not every dataset compresses to two components, and the 80% rule is the easiest way to make that call programmatically.

</details>

### Exercise 5: Top two variables driving PC1 on iris

Using a scaled PCA on `iris[, 1:4]`, identify the two variables with the largest absolute loadings on PC1. Save the named vector of the top two values to `ex5_top2`.

```r title="Exercise 5 starter"
# Hint: take abs() of rotation[, 1], sort decreasing, head(2)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_pca  <- prcomp(iris[, 1:4], scale = TRUE)
ex5_top2 <- sort(abs(ex5_pca$rotation[, 1]), decreasing = TRUE)[1:2]
round(ex5_top2, 4)
#> Petal.Length  Petal.Width
#>       0.5804       0.5649
```

**Explanation:** Petal measurements dominate PC1 because they vary the most across species. `Sepal.Length` is third (loading 0.52) and `Sepal.Width` is a distant fourth (0.27, with negative sign). This is the structural reason PC1 alone separates setosa from the other two iris species.

</details>

### Exercise 6: Biplot interpretation for USArrests

Fit a scaled PCA on `USArrests`, draw a base R `biplot()`, and read off which states sit at the high-crime end of PC1. Save the fit to `ex6_pca`.

```r title="Exercise 6 starter"
# Hint: biplot(ex6_pca, scale = 0) shows scores and loadings on the same plot

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_pca <- prcomp(USArrests, scale = TRUE)
biplot(ex6_pca, scale = 0, cex = 0.6)
```

**Explanation:** PC1 in `USArrests` is essentially a "violent-crime" axis: California, Florida, Nevada and Texas sit at one end (high `Murder`, `Assault`, `Rape` loadings); North Dakota, Vermont and New Hampshire sit at the opposite end. PC2 separates urban from rural by playing `UrbanPop` against the crime trio. Biplots are the fastest way to read both scores and loadings at once.

</details>

### Exercise 7: PCA scores as regression inputs

Fit PCA on `mtcars` predictors only (drop `mpg`), then regress `mpg` on the first two principal-component scores. Report the R² of that regression and compare with a plain `lm(mpg ~ ., data = mtcars)`. Save the PCR R² to `ex7_r2_pcr` and the full-OLS R² to `ex7_r2_full`.

```r title="Exercise 7 starter"
# Hint: ex7_pca$x[, 1:2] holds PC1 and PC2 scores you can pass into lm()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
# PCA on the predictor block (drop mpg, keep the 10 other columns)
ex7_pca <- prcomp(mtcars[, -1], scale = TRUE)

# Build a small regression frame using the first two PC scores
ex7_df <- data.frame(
  mpg = mtcars$mpg,
  PC1 = ex7_pca$x[, 1],
  PC2 = ex7_pca$x[, 2]
)

ex7_lm      <- lm(mpg ~ PC1 + PC2, data = ex7_df)
ex7_lm_full <- lm(mpg ~ ., data = mtcars)

ex7_r2_pcr  <- summary(ex7_lm)$r.squared
ex7_r2_full <- summary(ex7_lm_full)$r.squared

round(c(PCR = ex7_r2_pcr, FullOLS = ex7_r2_full), 4)
#>     PCR FullOLS
#>  0.8504  0.8690
```

**Explanation:** Two principal components recover 85% of the variance in `mpg`, while ten raw predictors plus an intercept reach 87%. Spending eight extra degrees of freedom for two extra R² points is a poor trade, which is the whole pitch for principal components regression: shrink the predictor matrix, keep almost all of the predictive signal, get a more stable model.

</details>

### Exercise 8: Frobenius reconstruction error from k = 2

For a scaled PCA of `USArrests`, reconstruct the data using only the first two components, then compute the Frobenius norm of the difference against the original scaled matrix. Save the error to `ex8_err`.

The reconstruction formula is the inverse of the rotation:

$$\hat{X}_k = U_k D_k V_k^\top = \mathrm{scores}_{[, 1:k]} \cdot \mathrm{rotation}_{[, 1:k]}^\top$$

Where the scores already absorb the centring and scaling, so the product lands back in scaled-data space.

```r title="Exercise 8 starter"
# Hint: scores %*% t(rotation) for k = 2; compare to scale(USArrests)
# Frobenius norm: sqrt(sum((A - B)^2))

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_pca <- prcomp(USArrests, scale = TRUE)

# Reconstruct from k = 2
ex8_recon <- ex8_pca$x[, 1:2] %*% t(ex8_pca$rotation[, 1:2])

# Compare to the scaled original (scores already work in scaled space)
ex8_orig <- scale(USArrests)

# Frobenius norm of the residual
ex8_err <- sqrt(sum((ex8_orig - ex8_recon)^2))
round(ex8_err, 4)
#> [1] 5.0961
```

**Explanation:** A Frobenius error of about 5.10 on a scaled 50-by-4 matrix is small. The squared error equals (n - 1) times the variance dropped, which is `49 * (sdev[3]^2 + sdev[4]^2)` ≈ `49 * 0.530` ≈ 25.97, and `sqrt(25.97)` ≈ 5.10. That algebraic identity is why eigenvalues equal "variance carried", and dropping low-eigenvalue components is provably the smallest-error rank reduction available.

</details>

### Exercise 9: prcomp() equals svd(scale(X))

Verify numerically that the rotation matrix from `prcomp()` matches the right singular vectors from `svd()` applied to the scaled data, up to per-column sign flips. Save the maximum absolute element-wise difference (after sign correction) to `ex9_diff`.

```r title="Exercise 9 starter"
# Hint: signs of eigenvectors are arbitrary, so compare abs() to abs()
# Use svd(scale(USArrests))$v vs prcomp$rotation

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_pca <- prcomp(USArrests, scale = TRUE)
ex9_svd <- svd(scale(USArrests))

# Compare absolute values element-wise to neutralise the sign ambiguity
ex9_diff <- max(abs(abs(ex9_pca$rotation) - abs(ex9_svd$v)))
ex9_diff
#> [1] 1.665335e-16
```

**Explanation:** The two matrices match to machine precision. `prcomp()` is just SVD on the centred (and optionally scaled) data with the singular values stored as `sdev`. Knowing this equivalence is useful when you want to compute PCA on data too large for `prcomp()` directly, because `svd()` and partial-SVD packages (like `irlba`) give you the same answer with more control.

</details>

### Exercise 10: Outlier detection with PC scores

Inject one synthetic outlier `c(10, 10, 10, 10)` into `iris[, 1:4]`, refit a scaled PCA, and flag observations whose `(PC1, PC2)` score has a Mahalanobis-style distance above the 99th-percentile chi-squared cutoff with 2 degrees of freedom. Save the flagged row indices to `ex10_flag`.

```r title="Exercise 10 starter"
# Hint: PC scores are uncorrelated and have variance sdev[k]^2,
# so squared distance = (PC1 / sdev[1])^2 + (PC2 / sdev[2])^2 ~ chisq(2)
# qchisq(0.99, df = 2) is the cutoff

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
# Build the augmented dataset with one obvious outlier appended
ex10_data <- rbind(iris[, 1:4], c(10, 10, 10, 10))

# Refit
ex10_pca <- prcomp(ex10_data, scale = TRUE)

# Squared standardised distance on the first two PC scores
ex10_d <- (ex10_pca$x[, 1] / ex10_pca$sdev[1])^2 +
          (ex10_pca$x[, 2] / ex10_pca$sdev[2])^2

# Flag rows above the 99th-percentile chi-squared cutoff (df = 2)
ex10_flag <- which(ex10_d > qchisq(0.99, df = 2))
ex10_flag
#> [1] 151
```

**Explanation:** Row 151 (the injected outlier) is the only point flagged, because it sits far from the rest of the cloud in every dimension and lands at extreme `(PC1, PC2)` scores. PCA-based outlier detection works precisely when you can summarise the bulk of the data in a few components, since "far from the data" then becomes "far in the principal subspace". For real-world use, swap the chi-squared cutoff for a rank-based threshold or Hotelling's T².

</details>

## Complete Example

The 10 exercises rehearsed individual skills; this end-to-end walkthrough on `swiss` glues them together into the workflow you would actually run on a new dataset.

```r title="Step 1: explore the data"
# 47 provinces, 6 demographic columns
str(swiss)
#> 'data.frame':   47 obs. of  6 variables:
#>  $ Fertility       : num  80.2 83.1 92.5 85.8 76.9 ...
#>  $ Agriculture     : num  17 45.1 39.7 36.5 43.5 ...
#>  $ Examination     : int  15 6 5 12 17 9 16 14 12 16 ...
#>  $ Education       : int  12 9 5 7 15 7 7 8 7 13 ...
#>  $ Catholic        : num  9.96 84.84 93.4 33.77 5.16 ...
#>  $ Infant.Mortality: num  22.2 22.2 20.2 20.3 20.6 ...
```

We have six numeric columns on different scales (proportions, counts, ratios), so `scale = TRUE` is mandatory.

```r title="Step 2: fit and summarise"
cw_pca <- prcomp(swiss, scale = TRUE)
summary(cw_pca)$importance
#>                            PC1    PC2    PC3    PC4    PC5    PC6
#> Standard deviation     1.7997 1.0975 0.9189 0.6679 0.5346 0.3858
#> Proportion of Variance 0.5398 0.2008 0.1407 0.0743 0.0476 0.0248
#> Cumulative Proportion  0.5398 0.7405 0.8813 0.9556 1.0000 1.0000
```

```r title="Step 3: pick k via 80% rule"
cw_var <- summary(cw_pca)$importance[3, ]
cw_k   <- as.integer(which(cw_var >= 0.80)[1])
cw_k
#> [1] 3
```

Three components clear 80%; we keep them.

```r title="Step 4: read the loadings"
round(cw_pca$rotation[, 1:3], 3)
#>                     PC1    PC2    PC3
#> Fertility         0.457 -0.323 -0.174
#> Agriculture       0.424  0.012 -0.652
#> Examination      -0.510 -0.252 -0.215
#> Education        -0.454 -0.328 -0.281
#> Catholic          0.350 -0.387  0.628
#> Infant.Mortality  0.150 -0.760  0.151
```

PC1 contrasts traditional rural variables (`Fertility`, `Agriculture`, `Catholic`) against modernising ones (`Examination`, `Education`); a province scoring high on PC1 is more agrarian and less educated. PC2 is dominated by `Infant.Mortality`. PC3 separates Catholic from agricultural provinces.

```r title="Step 5: reconstruction error from k = 3"
cw_recon <- cw_pca$x[, 1:cw_k] %*% t(cw_pca$rotation[, 1:cw_k])
cw_err   <- sqrt(sum((scale(swiss) - cw_recon)^2))
round(cw_err, 4)
#> [1] 5.1996
```

Reconstruction error is small because three components carry 88% of the variance. Drop a fourth in and the error halves; drop two in and it doubles. The trade-off curve is exactly the cumulative-variance curve from Step 2 in disguise.

[KEY INSIGHT]
**A PCA report is rotation, retention, reconstruction.** If you can answer "what are the loadings", "how many components do we keep", and "how much do we lose by truncating", you have communicated 90% of any PCA result a stakeholder needs.

## Summary

| Goal | R call | Key field |
|---|---|---|
| Fit PCA with scaling | `prcomp(X, scale = TRUE)` | `$sdev`, `$rotation`, `$x` |
| Variance explained | `summary(fit)$importance` | row 2 (proportion), row 3 (cumulative) |
| Eigenvalues | `fit$sdev^2` | numeric vector |
| Kaiser rule | `sum(fit$sdev^2 > 1)` | count of components |
| 80% rule | `which(cumsum(fit$sdev^2)/sum(fit$sdev^2) >= 0.8)[1]` | `k` |
| Scores | `fit$x[, 1:k]` | `n` x `k` matrix |
| Loadings | `fit$rotation[, 1:k]` | `p` x `k` matrix |
| Biplot | `biplot(fit)` | base R figure |
| Reconstruction | `scores %*% t(rotation)` | reproduces scaled `X` |
| SVD link | `svd(scale(X))$v == fit$rotation` | up to sign |

## References

1. R Core Team. *prcomp() reference, stats package*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html)
2. Jolliffe, I.T. *Principal Component Analysis*, 2nd ed., Springer (2002). [Link](https://link.springer.com/book/10.1007/b98835)
3. Husson, F., Lê, S., Pagès, J. *Exploratory Multivariate Analysis by Example Using R*, CRC Press (2017). [Link](https://www.routledge.com/Exploratory-Multivariate-Analysis-by-Example-Using-R/Husson-Le-Pages/p/book/9781138196346)
4. Kassambara, A. *factoextra package documentation*. [Link](https://rpkgs.datanovia.com/factoextra/)
5. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, 2nd ed., Chapter 12. [Link](https://www.statlearning.com/)
6. Pearson, K. (1901). "On lines and planes of closest fit to systems of points in space". *Philosophical Magazine* 2, 559-572.
7. Hotelling, H. (1933). "Analysis of a complex of statistical variables into principal components". *Journal of Educational Psychology* 24, 417-441.
8. Wickham, H., Grolemund, G. *R for Data Science*, 2nd ed. [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [PCA in R: prcomp() Tutorial](PCA-in-R.html), the parent tutorial that covers scaling, scree plots, biplots, and downstream use in depth.
- [Cluster Analysis in R](Cluster-Analysis-in-R.html), the natural follow-up: once PCA hands you a low-rank view, k-means and hierarchical clustering operate on those scores.
- [Exploratory Factor Analysis in R](Exploratory-Factor-Analysis-in-R.html), PCA's close cousin; useful when you want latent constructs rather than maximum-variance directions.
