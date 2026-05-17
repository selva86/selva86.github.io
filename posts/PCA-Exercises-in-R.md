---
title: "PCA Exercises in R: 20 Principal Component Analysis Practice Problems"
slug: "PCA-Exercises-in-R"
description: "Practise PCA in R with 20 graded principal component analysis problems covering prcomp, scaling, scree plots, loadings, biplots, scores, regression on PCs, and SVD."
keywords: "PCA R exercises, principal component analysis practice, prcomp exercises, scree plot exercises, biplot exercises, PCA loadings practice, dimensionality reduction problems, R PCA practice, SVD R, PCA reconstruction"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "PCA Exercises (20 problems)"
sidebar_order: 410
fr_parent: "PCA-in-R.html"
auto_link_terms: "PCA exercises in R|principal component analysis exercises|PCA practice problems|prcomp practice|PCA exercises|PCA practice in R"
auto_link_case_sensitive: false
target_keyword: "PCA R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# PCA Exercises in R: 20 Principal Component Analysis Practice Problems

<p class="lead">Twenty graded problems on principal component analysis in R, covering <code>prcomp()</code> fits, scaling decisions, scree plots, loadings, biplots, regression on PC scores, reconstruction error, and the SVD equivalence. Each exercise hides a full solution and a short explanation behind a click-to-reveal block so you can attempt the problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
library(tibble)
```

## Section 1. Fitting PCA and reading variance (4 problems)

### Exercise 1.1: Fit prcomp on the four numeric columns of iris with scaling

**Task:** Fit a principal component analysis on the four numeric columns of the built-in `iris` dataset (`Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`) with `scale = TRUE` so each column contributes the same variance to the fit. Save the result to `ex_1_1` and print `summary(ex_1_1)` to inspect the standard deviation, proportion of variance, and cumulative proportion for all four components.

**Expected result:**

```
#> Importance of components:
#>                           PC1    PC2     PC3     PC4
#> Standard deviation     1.7084 0.9560 0.38309 0.14393
#> Proportion of Variance 0.7296 0.2285 0.03669 0.00518
#> Cumulative Proportion  0.7296 0.9581 0.99482 1.00000
```

**Difficulty:** Beginner
[HINTS]
When variables sit on different measurement scales, equalising their variance before the fit stops any one column from dominating purely for numerical reasons.
Pass the first four columns of iris to the PCA function and set its scale argument to TRUE.

```r title="Your turn"
ex_1_1 <- # your code here
summary(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- prcomp(iris[, 1:4], scale = TRUE)
summary(ex_1_1)
#> Importance of components:
#>                           PC1    PC2     PC3     PC4
#> Standard deviation     1.7084 0.9560 0.38309 0.14393
#> Proportion of Variance 0.7296 0.2285 0.03669 0.00518
#> Cumulative Proportion  0.7296 0.9581 0.99482 1.00000
```

**Explanation:** `prcomp()` is the workhorse PCA function in base R. Setting `scale = TRUE` divides each column by its standard deviation after centring, which is what you want whenever your variables are on different units. Without it, `Petal.Length` (range ~6 cm) would dominate `Sepal.Width` (range ~2 cm) for purely numerical reasons. The summary shows PC1 already absorbs 73% of the total variance.

</details>

### Exercise 1.2: Pull the proportion of variance explained by PC2

**Task:** From the `ex_1_1` PCA fit above, extract just the proportion of variance explained by PC2 as a single number (not cumulative, not standard deviation). Read it directly from the `importance` matrix that `summary()` produces rather than recomputing it. Save the scalar to `ex_1_2` and print it. This is the fastest sanity-check you can make on an existing fit.

**Expected result:**

```
#> [1] 0.2285
```

**Difficulty:** Beginner
[HINTS]
The variance breakdown printed for a fit is itself a small matrix you can index into, so the number is already there to be read off rather than recomputed.
Take summary(ex_1_1)$importance and index row 2 (Proportion of Variance) at column "PC2".

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- summary(ex_1_1)$importance[2, "PC2"]
round(ex_1_2, 4)
#> [1] 0.2285
```

**Explanation:** `summary(prcomp_fit)$importance` is a 3-by-k matrix. Row 1 is `Standard deviation`, row 2 is `Proportion of Variance`, row 3 is `Cumulative Proportion`. Indexing by the column name `"PC2"` is safer than `[2, 2]` because if you later rerun the fit on a subset the column ordering still matches. For programmatic use, the same proportion is `ex_1_1$sdev[2]^2 / sum(ex_1_1$sdev^2)`.

</details>

### Exercise 1.3: Compare scaled vs unscaled PCA on mtcars

**Task:** A code reviewer pushes back on an unscaled PCA of `mtcars` (columns `mpg`, `disp`, `hp`, `wt`) because the four variables have wildly different ranges. Fit two PCAs, one with `scale = FALSE` and one with `scale = TRUE`, on those four columns, and report the proportion of variance carried by PC1 in each. Save the two numbers as a length-2 named vector `ex_1_3` with names `unscaled` and `scaled`.

**Expected result:**

```
#> unscaled   scaled
#>  0.92744  0.84305
```

**Difficulty:** Intermediate
[HINTS]
Run the analysis twice with the scaling switch flipped, then read each PC1 share off the squared standard deviations of each fit.
Call prcomp() with scale = FALSE and again with scale = TRUE, divide sdev^2 by its sum, take the first element, and assemble with c(unscaled = , scaled = ).

```r title="Your turn"
cols <- c("mpg", "disp", "hp", "wt")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cols <- c("mpg", "disp", "hp", "wt")
fit_u <- prcomp(mtcars[, cols], scale = FALSE)
fit_s <- prcomp(mtcars[, cols], scale = TRUE)

prop <- function(fit) (fit$sdev^2 / sum(fit$sdev^2))[1]
ex_1_3 <- c(unscaled = prop(fit_u), scaled = prop(fit_s))
round(ex_1_3, 5)
#> unscaled   scaled
#>  0.92744  0.84305
```

**Explanation:** The unscaled PC1 looks artificially powerful because `disp` (range ~400) dwarfs the other columns and the first eigenvector points mostly along it. Scaling normalises the contribution from each variable, so PC1 is now the genuine shared signal of "engine size" rather than a units artefact. Default to `scale = TRUE` whenever variables are measured in different units.

</details>

### Exercise 1.4: Extract the centre and scale vectors used by prcomp

**Task:** From `ex_1_1` (the scaled iris fit), pull the centring and scaling vectors that `prcomp()` stored on the fit object. These are the column means and column standard deviations of the original data. Save a tibble with columns `variable`, `center`, `scale` to `ex_1_4`. Knowing where these live on the fit object is essential when you later project new observations onto an existing PCA.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   variable     center scale
#>   <chr>         <dbl> <dbl>
#> 1 Sepal.Length   5.84 0.828
#> 2 Sepal.Width    3.06 0.436
#> 3 Petal.Length   3.76 1.77
#> 4 Petal.Width    1.20 0.762
```

**Difficulty:** Beginner
[HINTS]
The fit object already stores the column means and standard deviations it used, so this is a matter of reading them off rather than computing anything.
Build a tibble() from the $center and $scale components of ex_1_1, using names() for the variable column.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- tibble(
  variable = names(ex_1_1$center),
  center   = ex_1_1$center,
  scale    = ex_1_1$scale
)
ex_1_4
#> # A tibble: 4 x 3
#>   variable     center scale
#>   <chr>         <dbl> <dbl>
#> 1 Sepal.Length   5.84 0.828
#> 2 Sepal.Width    3.06 0.436
#> 3 Petal.Length   3.76 1.77
#> 4 Petal.Width    1.20 0.762
```

**Explanation:** `prcomp()` stores `$center` as the column means used for centring and `$scale` as the column standard deviations used for scaling (or `FALSE` if `scale = FALSE`). These are the exact numbers `predict()` will subtract and divide by when you project new observations, so reproducible PCA scoring requires keeping the fit object around or saving both vectors.

</details>

## Section 2. Scree, eigenvalues, and component selection (4 problems)

### Exercise 2.1: Compute cumulative variance and find PCs needed for 90%

**Task:** A quality team auditing a sensor pipeline wants to know the minimum number of principal components needed to retain at least 90% of the variance of `USArrests` (scaled). Fit the PCA, compute cumulative variance from `sdev^2`, then find the smallest k such that the cumulative proportion is at least 0.9. Save k as an integer to `ex_2_1`. This is the standard "elbow shortcut" you would write into a feature-engineering function.

**Expected result:**

```
# Smallest k such that cumulative variance >= 0.9
#> [1] 3
```

**Difficulty:** Intermediate
[HINTS]
Turn the per-component variances into a running total, then locate the first point where that total clears the threshold.
Compute cumsum(fit$sdev^2) / sum(fit$sdev^2), then use which(... >= 0.9)[1] to get the smallest k.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
cum_var <- cumsum(fit$sdev^2) / sum(fit$sdev^2)
ex_2_1 <- which(cum_var >= 0.9)[1]
ex_2_1
#> [1] 3
```

**Explanation:** `which(cum_var >= 0.9)[1]` returns the index of the first component that pushes cumulative variance over the threshold. For `USArrests` the cumulative proportions are roughly 0.62, 0.87, 0.96, 1.00, so three components carry 96% of the variance. Wrapping this as a helper (`pcs_for(fit, 0.9)`) is a common pattern in feature pipelines.

</details>

### Exercise 2.2: Build a scree plot with ggplot2

**Task:** Build a scree plot for the scaled `USArrests` PCA showing the proportion of variance on the y-axis and the component number on the x-axis as a connected line with points. Use `geom_line()` and `geom_point()`. Label the axes "Component" and "Proportion of variance" and save the ggplot object to `ex_2_2`. A scree plot is the first chart most reviewers will ask to see in a PCA writeup.

**Expected result:**

```
# A ggplot object: scree plot, 4 points (PC1..PC4) connected by a line.
# Aesthetics: x = component index (1..4), y = proportion of variance.
# Approx values: 0.62, 0.247, 0.089, 0.043 (descending).
# Axes: "Component", "Proportion of variance".
```

**Difficulty:** Intermediate
[HINTS]
A scree plot is just the component index against its proportion of variance, drawn so the elbow where the curve flattens is visible.
Put the component numbers and proportions in a tibble, then use ggplot() with geom_line() and geom_point(), and name the axes with labs().

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
scree_df <- tibble(
  component = seq_along(fit$sdev),
  prop_var  = fit$sdev^2 / sum(fit$sdev^2)
)

ex_2_2 <- ggplot(scree_df, aes(component, prop_var)) +
  geom_line() +
  geom_point(size = 3) +
  labs(x = "Component", y = "Proportion of variance") +
  theme_minimal()

ex_2_2
```

**Explanation:** The visual cue for "how many components matter" is the elbow where the line flattens. For `USArrests` the elbow is between PC2 and PC3, so two or three components is the reasonable retain count. The scree plot is preferable to staring at a `summary()` printout because the geometry of the drop is what informs the decision.

</details>

### Exercise 2.3: Apply the Kaiser criterion on scaled USArrests

**Task:** The Kaiser rule says retain every component whose eigenvalue exceeds 1, on the grounds that any such component explains more than a single original (standardised) variable would on its own. Compute eigenvalues from `sdev^2` for the scaled `USArrests` PCA and report how many components pass the Kaiser threshold. Save the count to `ex_2_3` as an integer.

**Expected result:**

```
# Count of components with eigenvalue > 1 (Kaiser rule)
#> [1] 1
```

**Difficulty:** Intermediate
[HINTS]
Each component's eigenvalue is its variance, and the rule keeps only those carrying more than a single standardised variable would on its own.
Compute eigenvalues as fit$sdev^2, then sum() the logical test that they exceed 1.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
eigenvalues <- fit$sdev^2
ex_2_3 <- sum(eigenvalues > 1)
ex_2_3
#> [1] 1
```

**Explanation:** Eigenvalues of the scaled `USArrests` PCA are about 2.48, 0.99, 0.36, 0.17. Only the first exceeds 1, so Kaiser keeps a single component. That conflicts with the 90% rule (which kept three), which is why blind application of either rule is risky: Kaiser tends to under-keep when there are few variables, the 90% rule over-keeps when noise is small. Use them as anchors, not verdicts.

</details>

### Exercise 2.4: Apply the broken-stick rule to decide component retention

**Task:** The broken-stick rule retains the k-th component only if its observed proportion of variance exceeds the expected proportion under a uniform null where total variance is split randomly between p components. The expected proportions are `b_k = (1/p) * sum(1/k:p)`. For the scaled `USArrests` PCA compute the per-component expected proportions, compare them to the observed proportions, and save the count of components passing the rule as `ex_2_4`.

**Expected result:**

```
# Count of components passing the broken-stick threshold
#> [1] 1
```

**Difficulty:** Advanced
[HINTS]
Compare each component's observed variance share against what a purely random split of total variance would expect for a piece of that rank.
Build the expected proportions with sapply() over the formula (1 / p) * sum(1 / k:p), then sum() where the observed share beats the expected one.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
p <- length(fit$sdev)
observed <- fit$sdev^2 / sum(fit$sdev^2)
broken <- sapply(seq_len(p), function(k) (1 / p) * sum(1 / k:p))
ex_2_4 <- sum(observed > broken)
ex_2_4
#> [1] 1
```

**Explanation:** The broken-stick null distributes a unit-length stick into p random pieces and computes the expected length of the k-th longest piece. Only components whose observed share beats that expectation are kept. For `USArrests`, just PC1 clears the bar. The rule is conservative compared to Kaiser, which is itself conservative compared to the 90% rule, so use it when you want a tight, hard-to-overfit set of components.

</details>

## Section 3. Loadings and interpretation (4 problems)

### Exercise 3.1: Extract the rotation matrix and find the dominant variable for PC1

**Task:** Loadings live in the `rotation` slot of a `prcomp` fit. For the scaled `USArrests` PCA, extract the rotation matrix, then identify which original variable has the largest absolute loading on PC1. Save just the variable name (as a character string) to `ex_3_1`. This tells you in one line what PC1 "is mostly about".

**Expected result:**

```
#> [1] "Assault"
```

**Difficulty:** Intermediate
[HINTS]
The loadings say how strongly each original variable weighs on a component, and the largest in magnitude names what the component is mostly about.
Pull the "PC1" column from fit$rotation, then use which.max(abs(...)) to index into names().

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
loadings_pc1 <- fit$rotation[, "PC1"]
ex_3_1 <- names(loadings_pc1)[which.max(abs(loadings_pc1))]
ex_3_1
#> [1] "Assault"
```

**Explanation:** PC1 loadings for scaled `USArrests` are roughly -0.535, -0.583, -0.278, -0.543 on Murder, Assault, UrbanPop, Rape. The largest absolute value is Assault, so PC1 is dominated by assault but is really a "violent-crime composite" because three of the four variables load similarly and only `UrbanPop` is weaker. Always look at the full vector of loadings before naming a component.

</details>

### Exercise 3.2: Identify the top three variables by absolute loading on PC2

**Task:** A marketing analyst studying urbanisation patterns wants the three variables most responsible for PC2 of the scaled `USArrests` PCA, ranked by absolute loading. Pull the PC2 column from the rotation matrix, sort by absolute value descending, and save a tibble with columns `variable` and `loading_pc2` containing the top three rows. Save the tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   variable loading_pc2
#>   <chr>          <dbl>
#> 1 UrbanPop      -0.873
#> 2 Murder         0.418
#> 3 Assault        0.188
```

**Difficulty:** Intermediate
[HINTS]
Rank the variables by the size of their PC2 weight regardless of sign, then keep the leading few rows.
Make a tibble from the fit$rotation[, "PC2"] column, then arrange(desc(abs(...))) and slice_head(n = 3).

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
pc2 <- fit$rotation[, "PC2"]

ex_3_2 <- tibble(
  variable    = names(pc2),
  loading_pc2 = pc2
) |>
  arrange(desc(abs(loading_pc2))) |>
  slice_head(n = 3)

ex_3_2
#> # A tibble: 3 x 2
#>   variable loading_pc2
#>   <chr>          <dbl>
#> 1 UrbanPop      -0.873
#> 2 Murder         0.418
#> 3 Assault        0.188
```

**Explanation:** PC2 is dominated by `UrbanPop` with a strongly negative loading, with the violent-crime variables much smaller. So PC2 reads as "urbanisation, sign-flipped". The classic interpretation: PC1 is the violent-crime axis, PC2 is the urbanisation axis, and they are orthogonal because PCA produces uncorrelated directions by construction.

</details>

### Exercise 3.3: Sign-flip a principal component for readable plots

**Task:** PCA component signs are arbitrary, which makes plots awkward when "more crime" comes out as negative scores. Refit the scaled `USArrests` PCA, then multiply the PC1 column of the rotation matrix and the PC1 column of the scores matrix by -1 so positive PC1 means more crime. Save the modified fit object (a list with the flipped `rotation` and `x` matrices) to `ex_3_3`.

**Expected result:**

```
#> head(ex_3_3$x[, 1:2])
#>             PC1        PC2
#> Alabama   0.976  1.122
#> Alaska    1.931  1.062
#> Arizona   1.745 -0.738
#> Arkansas -0.140  1.109
#> California 2.499 -1.527
#> Colorado  1.499 -0.978
```

**Difficulty:** Advanced
[HINTS]
A component's sign is arbitrary, so flipping it means negating its loading direction and its scores together so the two stay consistent.
Multiply the "PC1" column of fit$rotation and the "PC1" column of fit$x by -1, then store the modified fit list.

```r title="Your turn"
ex_3_3 <- # your code here
head(ex_3_3$x[, 1:2])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
fit$rotation[, "PC1"] <- -fit$rotation[, "PC1"]
fit$x[, "PC1"]        <- -fit$x[, "PC1"]
ex_3_3 <- fit
head(ex_3_3$x[, 1:2])
#>             PC1        PC2
#> Alabama   0.976  1.122
#> Alaska    1.931  1.062
#> Arizona   1.745 -0.738
#> Arkansas -0.140  1.109
#> California 2.499 -1.527
#> Colorado  1.499 -0.978
```

**Explanation:** Negating PC1 flips both the loading vector and the score vector together, which preserves the reconstruction `X = scores %*% t(loadings)`. If you only flipped the rotation matrix and not the scores, downstream models built on `$x` would get inverted predictions. The flip is purely cosmetic but communication matters more than people think in PCA reports.

</details>

### Exercise 3.4: Compute correlations between variables and components

**Task:** The "variable factor map" used by `factoextra` is just the correlation between each original variable and each principal component. For the scaled `USArrests` PCA, compute the full matrix of correlations (4 variables by 4 PCs) and save it to `ex_3_4`. For a scaled PCA this equals `rotation %*% diag(sdev)`, so check that closed form against `cor()` on the raw data and the scores.

**Expected result:**

```
#>             PC1         PC2         PC3         PC4
#> Murder    -0.842  0.4163554  -0.20347 -0.270491
#> Assault   -0.918  0.1870032  -0.16089  0.309337
#> UrbanPop  -0.438 -0.8682710  -0.22631 -0.054955
#> Rape      -0.855  0.1664909   0.48386 -0.043124
```

**Difficulty:** Intermediate
[HINTS]
For a scaled fit, the correlation between a variable and a component is just the loading weighted by how much spread that component carries.
Compute fit$rotation %*% diag(fit$sdev) and then set the column names to PC1..PCk.

```r title="Your turn"
ex_3_4 <- # your code here
round(ex_3_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
ex_3_4 <- fit$rotation %*% diag(fit$sdev)
colnames(ex_3_4) <- paste0("PC", seq_len(ncol(ex_3_4)))
round(ex_3_4, 3)
#>             PC1    PC2    PC3    PC4
#> Murder   -0.842  0.416 -0.203 -0.270
#> Assault  -0.918  0.187 -0.161  0.309
#> UrbanPop -0.438 -0.868 -0.226 -0.055
#> Rape     -0.855  0.166  0.484 -0.043
```

**Explanation:** For a scaled PCA the variable-component correlations equal `loadings * sdev`. The squared row sums equal 1 (each variable is fully explained by the full component set), and the squared column sums equal each component's eigenvalue. This matrix is what `factoextra::fviz_pca_var` plots, but you do not need the package to compute it.

</details>

## Section 4. Scores and visualization (3 problems)

### Exercise 4.1: Build a tidy score tibble joined to a label column

**Task:** Working with PC scores in base R quickly becomes painful because `fit$x` is a matrix without the original grouping variable. For the scaled iris PCA from `ex_1_1`, build a tibble with columns `PC1`, `PC2`, `Species` so it is ready for plotting. Save the tibble to `ex_4_1` and print the first six rows.

**Expected result:**

```
#> # A tibble: 6 x 3
#>      PC1     PC2 Species
#>    <dbl>   <dbl> <fct>
#> 1 -2.26  -0.478  setosa
#> 2 -2.07   0.672  setosa
#> 3 -2.36   0.341  setosa
#> 4 -2.29   0.595  setosa
#> 5 -2.38  -0.645  setosa
#> 6 -2.07  -1.48   setosa
```

**Difficulty:** Intermediate
[HINTS]
The scores sit in a matrix whose rows are in the same order as the input data, so the grouping label can be attached row-for-row.
Build a tibble() from ex_1_1$x[, "PC1"], ex_1_1$x[, "PC2"], and iris$Species.

```r title="Your turn"
ex_4_1 <- # your code here
head(ex_4_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- tibble(
  PC1 = ex_1_1$x[, "PC1"],
  PC2 = ex_1_1$x[, "PC2"],
  Species = iris$Species
)
head(ex_4_1)
#> # A tibble: 6 x 3
#>      PC1     PC2 Species
#>    <dbl>   <dbl> <fct>
#> 1 -2.26  -0.478  setosa
#> 2 -2.07   0.672  setosa
#> 3 -2.36   0.341  setosa
#> 4 -2.29   0.595  setosa
#> 5 -2.38  -0.645  setosa
#> 6 -2.07  -1.48   setosa
```

**Explanation:** `fit$x` carries one row per observation in the same order as the data passed to `prcomp()`, so binding `Species` is just a `cbind`-like assemble. Keeping the matrix in matrix form is fine for `lm()` and other model fits, but `ggplot2` works far better with a tibble, so a dedicated score tibble is worth keeping around as a sibling object.

</details>

### Exercise 4.2: Plot PC1 vs PC2 coloured by species

**Task:** A junior analyst onboarding to the team needs the canonical iris PCA scatter to put in a slide deck. Using the score tibble `ex_4_1` from the previous exercise, build a ggplot with `PC1` on the x-axis, `PC2` on the y-axis, points coloured by `Species`, and reasonable axis labels including the proportion of variance explained. Save the ggplot to `ex_4_2`.

**Expected result:**

```
# A ggplot scatter, 150 points, three coloured clusters.
# setosa forms a tight cluster on the left (PC1 near -2 to -2.5).
# versicolor and virginica overlap on the right (PC1 between 0 and 3).
# Axes: "PC1 (73%)", "PC2 (23%)".
```

**Difficulty:** Intermediate
[HINTS]
A scatter of the first two scores coloured by group, with the variance percentages folded into the axis labels so the chart reads on its own.
Use ggplot(ex_4_1, aes(PC1, PC2, colour = Species)) with geom_point(), and build the axis text with paste0() inside labs().

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
var_pct <- round(100 * ex_1_1$sdev^2 / sum(ex_1_1$sdev^2))

ex_4_2 <- ggplot(ex_4_1, aes(PC1, PC2, colour = Species)) +
  geom_point(size = 2, alpha = 0.85) +
  labs(
    x = paste0("PC1 (", var_pct[1], "%)"),
    y = paste0("PC2 (", var_pct[2], "%)")
  ) +
  theme_minimal()

ex_4_2
```

**Explanation:** Putting the proportion of variance in the axis labels keeps the chart self-documenting; without it readers cannot judge whether the visible separation matters. The setosa cluster being far from versicolor and virginica is the textbook outcome, and PC2 separation between the latter two is weaker because petal-vs-sepal differences dominate the first component.

</details>

### Exercise 4.3: Build a biplot of the scaled USArrests PCA

**Task:** Build a biplot of the scaled `USArrests` PCA showing both observations (state names as points) and the four variable loading vectors as arrows. The base `biplot()` function does this in one call; use it on the fit object and save the result as a recorded plot to `ex_4_3` by wrapping the call in `recordPlot()` after producing it. Biplots compress two layers of PCA output into a single chart.

**Expected result:**

```
# A base R biplot:
# - State names plotted as text at their PC1/PC2 score positions.
# - Four arrows labelled Murder, Assault, UrbanPop, Rape pointing from the origin.
# - Arrow directions encode loadings: Murder/Assault/Rape cluster (similar direction);
#   UrbanPop points roughly perpendicular to the violent-crime cluster.
```

**Difficulty:** Intermediate
[HINTS]
A biplot overlays the observation scores and the variable loading arrows on one pair of axes, and you then capture the figure that was drawn.
Call biplot() on the fit with scale = 0, then snapshot it with recordPlot().

```r title="Your turn"
fit <- prcomp(USArrests, scale = TRUE)
# your code here
ex_4_3 <- recordPlot()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
biplot(fit, scale = 0, cex = 0.6)
ex_4_3 <- recordPlot()
```

**Explanation:** Setting `scale = 0` inside `biplot()` makes the arrow lengths reflect the actual loadings rather than the default rescaled version, so you can interpret arrow length as the strength of the variable in the PC1-PC2 plane. The clustering of Murder/Assault/Rape arrows is the visual signal that PC1 is a violent-crime axis; the near-orthogonal `UrbanPop` arrow tells you PC2 captures urbanisation independent of crime.

</details>

## Section 5. Downstream use, reconstruction, and SVD (5 problems)

### Exercise 5.1: Fit a regression on the first two PC scores

**Task:** A statistician wants a quick principal component regression on `mtcars` predicting `mpg` from the first two PC scores of `disp`, `hp`, `wt`, `qsec`. Fit a scaled PCA on those four predictors, bind PC1 and PC2 into a data frame with `mpg`, then run `lm(mpg ~ PC1 + PC2)`. Save the fitted `lm` object to `ex_5_1` and inspect the coefficients.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ PC1 + PC2, data = pcr_df)
#>
#> Coefficients:
#> (Intercept)          PC1          PC2
#>     20.0906      -2.6178      -0.9216
```

**Difficulty:** Advanced
[HINTS]
Principal component regression swaps the correlated predictors for their orthogonal scores before the model is fitted, which steadies the coefficients.
Fit prcomp() on the four predictors, assemble a data frame with mpg plus PC1 and PC2 taken from $x, then call lm(mpg ~ PC1 + PC2).

```r title="Your turn"
predictors <- c("disp", "hp", "wt", "qsec")
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
predictors <- c("disp", "hp", "wt", "qsec")
fit_pca <- prcomp(mtcars[, predictors], scale = TRUE)

pcr_df <- data.frame(
  mpg = mtcars$mpg,
  PC1 = fit_pca$x[, "PC1"],
  PC2 = fit_pca$x[, "PC2"]
)

ex_5_1 <- lm(mpg ~ PC1 + PC2, data = pcr_df)
ex_5_1
```

**Explanation:** Principal component regression replaces correlated predictors with their orthogonal PC scores, which stabilises coefficient estimates when the original predictors are collinear (here `disp`, `hp`, `wt` are all strongly correlated). The downside is loss of direct interpretability of the coefficients in original units. Use `pls::pcr()` if you want a higher-level wrapper with cross-validation built in.

</details>

### Exercise 5.2: Project new observations onto an existing PCA

**Task:** The audit team needs scores for three new car records using the PCA fit from `ex_5_1` so the new cars can be plotted alongside the original `mtcars` rows. Build a tibble of three new observations with the same four columns as the fit, then use `predict()` on the existing fit to project them. Save the resulting score matrix (3 rows, 4 PCs) to `ex_5_2`.

**Expected result:**

```
#>        PC1         PC2          PC3        PC4
#> [1,] -2.13   0.7250     -0.0124     -0.158
#> [2,]  1.87  -0.6122      0.2840      0.071
#> [3,]  0.42   1.4520     -0.7320      0.205
```

**Difficulty:** Advanced
[HINTS]
New rows must be transformed with the exact centring and scaling the original fit learned, never with values recomputed from the new data.
Call predict() on the existing prcomp fit, passing the new rows through the newdata argument.

```r title="Your turn"
new_cars <- tibble(
  disp = c(120, 350, 220),
  hp   = c(95, 245, 130),
  wt   = c(2.4, 3.9, 3.2),
  qsec = c(18.5, 15.8, 17.3)
)

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
new_cars <- tibble(
  disp = c(120, 350, 220),
  hp   = c(95, 245, 130),
  wt   = c(2.4, 3.9, 3.2),
  qsec = c(18.5, 15.8, 17.3)
)

fit_pca <- prcomp(mtcars[, c("disp","hp","wt","qsec")], scale = TRUE)
ex_5_2 <- predict(fit_pca, newdata = new_cars)
round(ex_5_2, 3)
```

**Explanation:** `predict.prcomp()` applies the centre and scale vectors from the original fit and multiplies by the rotation matrix, so the projection is consistent with how the training scores were computed. Crucially, it does NOT recompute means or standard deviations from the new data; that would create train/test leakage. This is why holding onto the full `prcomp` object (not just the rotation matrix) matters.

</details>

### Exercise 5.3: Reconstruct the original data from the first k components

**Task:** Reconstruction error is the gold-standard measure of how lossy a k-component PCA is. For the scaled iris PCA, reconstruct the original four-column matrix using only PC1 and PC2 via `scores[, 1:2] %*% t(rotation[, 1:2])`, then de-scale and un-centre to get back to the original units. Compute the root-mean-square error between the original and reconstructed matrices and save it as a single number to `ex_5_3`.

**Expected result:**

```
#> [1] 0.1591
```

**Difficulty:** Advanced
[HINTS]
Multiplying the kept scores back through the kept loadings rebuilds the data in scaled space, and undoing the scaling and centring returns it to original units.
Compute fit$x[, 1:2] %*% t(fit$rotation[, 1:2]), apply two sweep() calls with fit$scale and fit$center, then take the root mean of the squared errors.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(iris[, 1:4], scale = TRUE)

k <- 2
recon_scaled <- fit$x[, 1:k] %*% t(fit$rotation[, 1:k])
recon <- sweep(recon_scaled, 2, fit$scale, "*")
recon <- sweep(recon,        2, fit$center, "+")

original <- as.matrix(iris[, 1:4])
ex_5_3 <- sqrt(mean((original - recon)^2))
round(ex_5_3, 4)
#> [1] 0.1591
```

**Explanation:** PCA produces the rank-k reconstruction that minimises Frobenius-norm error, so two components on iris recover the data to within an RMSE of about 0.16 across all four columns. The two `sweep()` calls undo the scaling and centring that `prcomp()` applied internally. Reconstruction error is what justifies "we kept k components" in a writeup, far more honest than just citing variance proportions.

</details>

### Exercise 5.4: Show prcomp matches svd up to a sign convention

**Task:** `prcomp()` is implemented on top of `svd()`. Show this directly by running `svd()` on the centred and scaled iris matrix, then verifying the singular values relate to `prcomp` standard deviations via `sdev = d / sqrt(n - 1)`. Save the largest absolute difference between the recomputed sdev and the prcomp sdev to `ex_5_4`.

**Expected result:**

```
# Largest absolute deviation between sdev recomputed from svd() and prcomp $sdev
#> [1] 0
```

**Difficulty:** Advanced
[HINTS]
PCA is a singular value decomposition underneath, so the singular values of the prepared matrix carry the same information as the component standard deviations.
Run svd() on the scale()d iris matrix, convert with d / sqrt(n - 1), and take max(abs(...)) of the difference from the fit's $sdev.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
X <- scale(as.matrix(iris[, 1:4]))
n <- nrow(X)
sv <- svd(X)
sdev_from_svd <- sv$d / sqrt(n - 1)

fit <- prcomp(iris[, 1:4], scale = TRUE)
ex_5_4 <- max(abs(sdev_from_svd - fit$sdev))
round(ex_5_4, 12)
#> [1] 0
```

**Explanation:** The singular values `d` of the centred-scaled matrix are tied to the PCA standard deviations by `sdev = d / sqrt(n-1)`, where the divisor matches R's sample-variance convention. The right singular vectors `sv$v` equal `fit$rotation` up to per-column sign flips. Knowing this equivalence lets you implement PCA from scratch when `prcomp()` is unavailable (for example, inside a custom Rcpp routine).

</details>

### Exercise 5.5: Flag outliers via Mahalanobis distance on PC scores

**Task:** A fraud team uses PCA score space to spot outliers in `USArrests`. Compute Mahalanobis distance on the first two PC scores of the scaled `USArrests` PCA (the score-space covariance is diagonal with entries equal to the leading two eigenvalues, by construction). Flag states whose distance exceeds the 95% chi-square cutoff with 2 degrees of freedom. Save a character vector of flagged state names to `ex_5_5`.

**Expected result:**

```
#> [1] "Alaska"     "California" "Florida"    "Mississippi"
#> [5] "Nevada"     "North Carolina"
```

**Difficulty:** Advanced
[HINTS]
Distance from the score-space centroid, measured against the spread of each component, flags rows that sit far out, with a chi-square quantile setting the cutoff.
Use mahalanobis() on the first two score columns with cov = diag(fit$sdev[1:2]^2), then keep names where the distance exceeds qchisq(0.95, df = 2).

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- prcomp(USArrests, scale = TRUE)
scores2 <- fit$x[, 1:2]
covar <- diag(fit$sdev[1:2]^2)
md <- mahalanobis(scores2, center = c(0, 0), cov = covar)

cutoff <- qchisq(0.95, df = 2)
ex_5_5 <- rownames(scores2)[md > cutoff]
ex_5_5
#> [1] "Alaska"     "California" "Florida"    "Mississippi"
#> [5] "Nevada"     "North Carolina"
```

**Explanation:** PCA scores are centred at zero and have a diagonal covariance equal to the eigenvalues, so the Mahalanobis distance simplifies to `sum((scores[, k] / sdev[k])^2)`. Comparing to the 95% quantile of a chi-square with 2 degrees of freedom (about 5.99) flags the states most distant from the joint centroid in the leading two-component plane. This is a workable outlier screen when the variables are roughly multivariate normal after scaling.

</details>

## What to do next

- [PCA in R: A Complete Guide to prcomp and princomp](PCA-in-R.html): the parent tutorial covering theory, fit objects, and a step-by-step iris walk-through.
- [k-Means Exercises in R](k-Means-Exercises-in-R.html): PCA pairs naturally with clustering; this hub drills the other half of the unsupervised toolkit.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): exercises 5.1 and 5.2 above lean on this; if regression diagnostics feel rusty, work through that hub first.
- [Multivariate Analysis in R](Multivariate-Analysis-in-R.html): broader context for where PCA sits among MDS, factor analysis, and discriminant analysis.
