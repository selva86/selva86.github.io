---
title: "Read PCA Output in R: What Loadings, Scores, and Variance Explained Actually Tell You"
slug: "Interpreting-PCA-Results-in-R"
description: "Confused by prcomp() output? Learn what loadings, scores, and variance explained mean in R, with runnable examples on the classic USArrests dataset."
keywords: "PCA output R, interpret loadings, PCA scores, variance explained, prcomp interpretation, principal component analysis, rotation matrix, scree plot R"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-20"
curriculum_id: "2.5.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Interpreting PCA Output"
sidebar_order: 65
auto_link_terms: "interpret PCA output|PCA loadings|PCA scores|variance explained|principal component loadings|interpreting prcomp"
auto_link_case_sensitive: false
---

# Read PCA Output in R: What Loadings, Scores, and Variance Explained Actually Tell You

<p class="lead">PCA output in R boils down to three quantities: <em>loadings</em> (how variables combine into each component), <em>scores</em> (where each observation sits on each component), and <em>variance explained</em> (how much signal each component captures). Once you can read these three, you can read any `prcomp()` result.</p>

## What does prcomp() actually return?

When you call `prcomp()` on a dataset, R hands you a list with five slots. Three of them carry all the interpretive weight: `sdev`, `rotation`, and `x`. Let's fit PCA on the built-in `USArrests` data, print a summary, and map each slot to the question it answers.

The dataset has 50 US states and four variables: `Murder`, `Assault`, `UrbanPop`, and `Rape`. We scale the variables (divide by their standard deviation) so that no variable dominates just because its numbers are larger.

```r title="Fit PCA on USArrests and print summary"
pr <- prcomp(USArrests, scale. = TRUE)
summary(pr)
#> Importance of components:
#>                           PC1    PC2     PC3     PC4
#> Standard deviation     1.5749 0.9949 0.59713 0.41645
#> Proportion of Variance 0.6201 0.2474 0.08914 0.04336
#> Cumulative Proportion  0.6201 0.8475 0.93664 1.00000
```

That one table answers the whole "how much signal is in each component" question. PC1 alone captures 62% of the variance in `USArrests`; PC1 and PC2 together capture 85%. In a four-variable dataset that is a heavy compression: two components carry most of what the four original variables told us.

Next, inspect the structure of the fitted object itself. We want to see which slot holds what.

```r title="Inspect prcomp object structure"
names(pr)
#> [1] "sdev"     "rotation" "center"   "scale"    "x"

dim(pr$rotation)   # p x p (variables x PCs)
#> [1] 4 4

dim(pr$x)          # n x p (observations x PCs)
#> [1] 50  4

length(pr$sdev)    # one sdev per PC
#> [1] 4
```

Four slots matter for interpretation. `sdev` is the per-PC standard deviation (square it to get the eigenvalues). `rotation` is a p × p matrix whose columns are the eigenvectors (sometimes called loadings). `x` is an n × p matrix of scores, the projection of every observation onto every PC. `center` and `scale` just record the preprocessing so you can reverse it if needed.

![Anatomy of prcomp() output](screenshots/Interpreting-PCA-Results-in-R-output-anatomy.webp)
*Figure 1: The five slots `prcomp()` returns and the three questions they answer.*

[NOTE]
**Prefer `prcomp()` over the older `princomp()`.** `prcomp()` computes PCA via singular value decomposition, which is numerically stable and does not require more rows than columns. `princomp()` uses the eigendecomposition of the covariance matrix and fails when `n < p`. Stick with `prcomp()` unless you have a legacy reason not to.

**Try it:** Run `prcomp()` on the first four numeric columns of `iris` with scaling on, then identify which slot holds the 150 × 4 scores matrix.

```r title="Your turn: identify the scores slot"
# Try it: fit PCA on iris numeric columns
ex_pr <- prcomp(iris[, 1:4], scale. = TRUE)

# Which slot holds the scores? Print its dimensions to verify.
# your code here

#> Expected: 150 rows, 4 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris scores slot solution"
ex_pr <- prcomp(iris[, 1:4], scale. = TRUE)
dim(ex_pr$x)
#> [1] 150   4
```

**Explanation:** `pr$x` always holds the scores (observations projected onto PCs). Its rows match the input row count; its columns match the number of PCs.

</details>

## What do the loadings tell you?

Loadings answer the question: *which original variables define each principal component?* In `prcomp()`, the matrix `pr$rotation` carries this information. Each column is one PC, and each row is one original variable. The number at position (i, j) tells you how strongly variable i contributes to PC j and in which direction.

Let's look at the rotation matrix for USArrests.

```r title="Inspect the rotation matrix"
pr$rotation
#>                 PC1        PC2        PC3         PC4
#> Murder   -0.5358995  0.4181809 -0.3412327  0.64922780
#> Assault  -0.5831836  0.1879856 -0.2681484 -0.74340748
#> UrbanPop -0.2781909 -0.8728062 -0.3780158  0.13387773
#> Rape     -0.5434321 -0.1673186  0.8177779  0.08902432
```

Focus on PC1 first. The three violent-crime variables (Murder, Assault, Rape) all have large negative loadings around −0.54 to −0.58, while UrbanPop has a much smaller loading of −0.28. All four are negative and of similar-enough magnitude that PC1 reads as a roughly balanced "overall crime plus urbanization" axis, with the crime variables dominating.

Now PC2. The sign pattern changes: Murder and Assault are positive; UrbanPop and Rape are negative. UrbanPop alone has a huge loading of −0.87. PC2 is mostly "UrbanPop, versus everything else". It separates states where urbanization is high from states where it is low.

```r title="Interpret PC1 and PC2 qualitatively"
# Which variable dominates PC2?
pc2_loadings <- pr$rotation[, "PC2"]
pc2_loadings[which.max(abs(pc2_loadings))]
#> UrbanPop
#> -0.8728062
```

That one line distills the PC2 story: urbanization drives this component almost by itself. Whenever a PC has one loading much larger in absolute value than the others, that PC is essentially a rescaled version of that single variable.

[KEY INSIGHT]
**The sign of a PC is arbitrary; the relative pattern is what matters.** If every loading on PC1 flipped sign, nothing about the data would change: the axis is the same line, just pointing the other way. When interpreting, focus on which variables go together and which oppose each other within a PC, not on whether loadings are positive or negative.

**Try it:** On USArrests PC3, find the variable with the largest absolute loading and report its sign.

```r title="Your turn: largest PC3 loading"
# Try it: which variable dominates PC3?
pc3 <- pr$rotation[, "PC3"]
# your code here

#> Expected: Rape with a positive loading near 0.82
```

<details>
<summary>Click to reveal solution</summary>

```r title="Largest PC3 loading solution"
pc3 <- pr$rotation[, "PC3"]
pc3[which.max(abs(pc3))]
#> Rape
#> 0.8177779
```

**Explanation:** `which.max(abs(...))` finds the index with the largest absolute value; indexing the named vector returns the variable name with its signed loading.

</details>

## What are the scores, and what do they mean?

Scores answer the question: *where does each observation sit on each component?* The matrix `pr$x` has one row per observation and one column per PC. The value at row i, column k is the coordinate of observation i on PC k, its location along that axis.

Let's peek at the first few rows.

```r title="Inspect PC scores"
head(pr$x, 5)
#>                   PC1        PC2         PC3          PC4
#> Alabama     -0.9756604  1.1220012 -0.43980366  0.154696581
#> Alaska      -1.9305379  1.0624269  2.01950027 -0.434175454
#> Arizona     -1.7454429 -0.7384595  0.05423025 -0.826264240
#> Arkansas     0.1399989  1.1085423  0.11342217 -0.180973554
#> California  -2.4986128 -1.5274267  0.59254100 -0.338559240
```

California's PC1 score of −2.50 is the lowest here. Recall that PC1's loadings were all negative and dominated by the crime variables, so a very negative PC1 score means California is high on the crime variables. That tracks. North Dakota, meanwhile, ends up high on PC1 (check it yourself), meaning low crime.

Let's make the "high and low" story concrete.

```r title="States at PC1 extremes"
scores <- pr$x
sort(scores[, "PC1"])[1:5]       # five lowest PC1 scores
#>    California      Florida       Nevada     Maryland     Arizona
#>    -2.498613    -2.404237    -2.212701    -1.960780    -1.745443

sort(scores[, "PC1"], decreasing = TRUE)[1:5]  # five highest
#> North Dakota      Vermont        Maine      Iowa        New Hampshire
#>     2.814909     2.770315     2.377197    2.057956       2.003007
```

States with the most negative PC1 (California, Florida, Nevada) are the high-crime states. States with the most positive PC1 (North Dakota, Vermont, Maine) are the low-crime states. PC1 has literally given us a one-number summary of how each state stands on the dominant pattern in the data.

There is no magic in how scores are produced. They are exact matrix multiplication: take the scaled data, multiply by the rotation matrix, and you get `pr$x`.

```r title="Verify scores equal scaled data times rotation"
X_scaled <- scale(USArrests)            # same scaling prcomp applied
scores_check <- X_scaled %*% pr$rotation
head(scores_check, 3) - head(pr$x, 3)   # should be ~0
#>                        PC1           PC2           PC3           PC4
#> Alabama    -2.220446e-16  4.440892e-16  0.000000e+00 -1.110223e-16
#> Alaska      2.220446e-16 -4.440892e-16 -4.440892e-16  1.110223e-16
#> Arizona    -2.220446e-16  2.220446e-16  6.938894e-17 -1.110223e-16
```

The differences are at machine precision (about 10⁻¹⁶), confirming that scores are just linear combinations of the standardised variables, weighted by the rotation matrix.

[TIP]
**Use the first few score columns as compressed features.** If you plan to cluster, regress, or plot observations in a lower-dimensional space, `pr$x[, 1:k]` is ready to use. With k = 2 on USArrests you can plot all 50 states on a 2D map where distances mean something meaningful (overall crime-urbanization pattern).

**Try it:** Pull out the five states with the highest PC2 score and store them in `ex_top_pc2`.

```r title="Your turn: top PC2 states"
# Try it: five states with the highest PC2 score
ex_top_pc2 <- NULL  # your code here

print(ex_top_pc2)
#> Expected: a named numeric vector of length 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top PC2 states solution"
ex_top_pc2 <- sort(pr$x[, "PC2"], decreasing = TRUE)[1:5]
print(ex_top_pc2)
#>  Mississippi West Virginia      Vermont        Arkansas       Alabama
#>     1.673809       1.470636       1.338939       1.108542       1.122001
```

**Explanation:** `sort(..., decreasing = TRUE)[1:5]` returns the five largest PC2 scores with state names attached. These are states low on urbanization (remember, UrbanPop loads heavily negative on PC2, so high PC2 = low UrbanPop).

</details>

## How is variance explained computed, and when is it enough?

Variance explained answers: *how much of the signal in the data does each PC capture?* The building blocks are the eigenvalues, the squared standard deviations, stored in `pr$sdev^2`. Divide each eigenvalue by the total and you get the proportion of variance for each PC. Take the running sum and you get cumulative variance.

Let's reproduce the `summary()` importance table by hand.

```r title="Compute variance explained manually"
eigenvalues <- pr$sdev^2
prop_var    <- eigenvalues / sum(eigenvalues)
cum_var     <- cumsum(prop_var)

round(rbind(Eigenvalue = eigenvalues,
            Proportion = prop_var,
            Cumulative = cum_var), 4)
#>                 [,1]   [,2]   [,3]   [,4]
#> Eigenvalue   2.4802 0.9898 0.3566 0.1734
#> Proportion   0.6201 0.2474 0.0891 0.0434
#> Cumulative   0.6201 0.8675 0.9566 1.0000
```

These numbers match the `summary()` output exactly (up to rounding). The takeaway: on USArrests, two PCs reach 87% cumulative, three reach 96%, and four reach 100% (always true for p components on p variables).

A scree plot is the standard visual for deciding how many PCs to keep. We put PC number on the x-axis and the proportion on the y-axis.

```r title="Draw the scree plot"
library(ggplot2)

scree_df <- data.frame(
  PC         = factor(seq_along(prop_var)),
  Proportion = prop_var
)

ggplot(scree_df, aes(x = PC, y = Proportion)) +
  geom_col(fill = "steelblue") +
  geom_line(aes(group = 1), linewidth = 0.6) +
  geom_point(size = 2) +
  geom_hline(yintercept = 1 / length(prop_var),
             linetype = "dashed", colour = "red") +
  labs(title = "Scree plot: USArrests",
       x = "Principal component",
       y = "Proportion of variance") +
  theme_minimal()
```

The bars drop sharply after PC1, then again (softly) after PC2, then level off. The elbow sits at PC2–PC3. The dashed red line marks the "equal-share" threshold (1/p = 0.25): any PC above it carries more variance than a single original variable would on its own.

![Decision flow for number of components](screenshots/Interpreting-PCA-Results-in-R-component-decision.webp)
*Figure 2: Three heuristics for deciding how many principal components to retain.*

Three heuristics are in common use:

1. **Kaiser rule (λ > 1).** Keep every PC whose eigenvalue exceeds 1. Only valid when you scaled the data, because scaling sets each variable's variance to 1. A PC with λ < 1 explains less than any single standardised variable.
2. **Elbow rule.** Retain PCs up to the visible kink in the scree plot. Subjective but often agrees with the other rules.
3. **Cumulative rule.** Keep the smallest k such that cumulative variance reaches a target (commonly 80% or 90%).

On USArrests, Kaiser suggests 2 (λ values 2.48 and 0.99, so PC2 is borderline), the elbow also suggests 2, and the 80% cumulative rule suggests 2. All three agree. When rules disagree, prefer the cumulative target that matches your downstream use (visualization, compression, input to another model).

[WARNING]
**Kaiser only applies to standardized data.** If you did PCA on the raw covariance matrix (`scale. = FALSE`), variables with larger natural variance contribute larger eigenvalues by construction, and the λ = 1 cutoff is meaningless. Use the cumulative rule instead, or scale first.

**Try it:** Count how many PCs on USArrests satisfy the Kaiser rule.

```r title="Your turn: Kaiser rule count"
# Try it: how many PCs have eigenvalue > 1?
ex_kaiser <- NA  # your code here

ex_kaiser
#> Expected: 1 (borderline 2; PC2's eigenvalue is 0.9898, just under 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Kaiser rule count solution"
ex_kaiser <- sum(pr$sdev^2 > 1)
ex_kaiser
#> [1] 1
```

**Explanation:** Strictly applied, only PC1 (λ = 2.48) crosses the threshold. Because PC2's eigenvalue is 0.9898 (essentially 1), many analysts would keep PC2 as well. Kaiser is a guideline, not a hard cutoff.

</details>

## What's the difference between rotation, loadings, and eigenvectors?

This is where tutorials go sideways. Three terms get mixed up: **eigenvectors**, **rotation**, and **loadings**. Here is the clean answer.

- **Eigenvectors**: the directions, in the original variable space, along which the data has maximum variance. Unit-length vectors.
- **`pr$rotation`**: the matrix whose columns are those eigenvectors. Unit length per column.
- **Loadings (classical definition)**: eigenvector × √eigenvalue = rotation column × sdev. Loadings equal the Pearson correlations between the original variables and the principal component scores.

R's `prcomp()` returns `rotation`, not classical loadings. Many tutorials still call `rotation` "loadings", which is not wrong so much as inconsistent with the textbook definition. When you need the interpretive power of correlations, you compute loadings yourself.

Start with the unit-length check.

```r title="Verify rotation columns are unit length"
colSums(pr$rotation^2)
#> PC1 PC2 PC3 PC4
#>   1   1   1   1
```

Each column's squared entries sum to 1, which is the definition of unit length. Now compute the classical loadings.

```r title="Compute classical loadings"
loadings_true <- sweep(pr$rotation, 2, pr$sdev, FUN = "*")
round(loadings_true, 3)
#>             PC1    PC2    PC3    PC4
#> Murder   -0.844  0.416 -0.204  0.270
#> Assault  -0.918  0.187 -0.160 -0.310
#> UrbanPop -0.438 -0.868 -0.226  0.056
#> Rape     -0.856 -0.166  0.488  0.037
```

Read the PC1 column: Murder, Assault, and Rape are around −0.85 to −0.92. These are (up to sign) the Pearson correlations between those variables and PC1 scores. Let's verify.

```r title="Check loadings equal correlations with scores"
round(cor(USArrests, pr$x), 3)
#>             PC1    PC2    PC3    PC4
#> Murder   -0.844  0.416 -0.204  0.270
#> Assault  -0.918  0.187 -0.160 -0.310
#> UrbanPop -0.438 -0.868 -0.226  0.056
#> Rape     -0.856 -0.166  0.488  0.037
```

Identical. This is why classical loadings are interpretively useful: they live on the correlation scale, so a value of −0.918 means Assault and PC1 are strongly negatively correlated. Moving along PC1 by one standard deviation moves Assault by about −0.918 standard deviations.

[WARNING]
**Confusing rotation with loadings leads to wrong scale intuitions.** Rotation entries are bounded only by unit-length (so up to ~±1 in magnitude), but their values do not directly compare to correlations. If you want "how strongly is variable X tied to PC k?" report loadings (rotation × sdev), not rotation.

**Try it:** Compute the classical loading for `Murder` on PC1 via the formula, and via `cor()`. They should match.

```r title="Your turn: Murder PC1 loading two ways"
# Try it: compute Murder-PC1 loading in two ways
ex_load_formula <- NA  # via rotation * sdev
ex_load_cor     <- NA  # via cor()

c(formula = ex_load_formula, correlation = ex_load_cor)
#> Expected: both values near -0.844
```

<details>
<summary>Click to reveal solution</summary>

```r title="Murder PC1 loading solution"
ex_load_formula <- pr$rotation["Murder", "PC1"] * pr$sdev[1]
ex_load_cor     <- cor(USArrests[, "Murder"], pr$x[, "PC1"])
c(formula = ex_load_formula, correlation = ex_load_cor)
#>     formula correlation
#>  -0.8439764  -0.8439764
```

**Explanation:** Both routes produce −0.844. This identity (loading = correlation between variable and PC) holds exactly when the data is scaled; for unscaled data the analogous identity uses covariances instead.

</details>

## Why should you scale variables before PCA?

PCA finds directions of maximum variance. If one variable has a raw variance 100 times larger than another, PC1 will nearly follow that variable alone, not because it is more important, but because its units are bigger. Scaling (dividing each variable by its standard deviation) puts every variable on an equal footing before the variance maximization begins.

Let's see the effect on USArrests by fitting PCA without scaling.

```r title="PCA without scaling: Assault dominates"
pr_unscaled <- prcomp(USArrests, scale. = FALSE)
round(pr_unscaled$rotation[, 1:2], 3)
#>              PC1    PC2
#> Murder    -0.042  0.045
#> Assault   -0.995 -0.059
#> UrbanPop  -0.046  0.977
#> Rape      -0.075  0.201
```

PC1 is almost entirely Assault (loading −0.995). The reason: `Assault` in the raw data ranges from about 45 to 337, while `Murder` ranges from 0.8 to 17. Assault has by far the largest variance, so it wins the unscaled tournament. PC2 then picks up UrbanPop, the next-largest-variance variable. Neither component is about the pattern *between* variables. They are just the variables with big numbers, ranked.

Compare to the scaled version.

```r title="Side-by-side comparison of PC1 loadings"
cbind(
  unscaled = round(pr_unscaled$rotation[, "PC1"], 3),
  scaled   = round(pr$rotation[, "PC1"], 3)
)
#>          unscaled scaled
#> Murder     -0.042 -0.536
#> Assault    -0.995 -0.583
#> UrbanPop   -0.046 -0.278
#> Rape       -0.075 -0.543
```

With scaling, PC1 becomes a balanced average of the three crime variables. That is the interpretation you actually want, a latent "violent crime level", not "whichever variable happened to have the biggest raw numbers".

[TIP]
**Default to `scale. = TRUE` unless all variables share the same unit AND scale carries meaning.** Most real-world datasets mix units: dollars, percentages, counts, ratios. Scaling is almost always the right call. Keep `scale. = FALSE` only in cases like pixel intensities on a fixed scale, or when you have a specific reason to let variance differences carry signal.

**Try it:** Run PCA on `mtcars` with `scale. = FALSE`. Identify which variable dominates PC1.

```r title="Your turn: mtcars unscaled PC1"
# Try it: without scaling, which mtcars variable dominates PC1?
ex_mt <- prcomp(mtcars, scale. = FALSE)
# your code here: find the loading with the largest absolute value

#> Expected: disp dominates PC1 (its raw variance is ~15,000, by far the largest)
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars unscaled PC1 solution"
ex_mt <- prcomp(mtcars, scale. = FALSE)
pc1 <- ex_mt$rotation[, "PC1"]
pc1[which.max(abs(pc1))]
#>        disp
#> -0.8998119
```

**Explanation:** `disp` (engine displacement, cubic inches) has the largest raw variance among `mtcars` columns, so unscaled PC1 is almost entirely `disp`. With `scale. = TRUE`, PC1 becomes the familiar "big cars vs efficient cars" axis spread across several variables.

</details>

## Practice Exercises

### Exercise 1: Find the smallest k that reaches 90% cumulative variance

Fit scaled PCA on `iris[, 1:4]`, compute the cumulative proportion of variance, and find the smallest number of PCs that reaches at least 90%. Save the answer to `my_k`.

```r title="Exercise 1 starter: 90% cumulative threshold"
# Exercise 1
# Hint: cumsum() on the proportions, then which() with the threshold

my_iris_pr <- prcomp(iris[, 1:4], scale. = TRUE)
my_k <- NA  # your code here

my_k
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_iris_pr <- prcomp(iris[, 1:4], scale. = TRUE)
prop <- my_iris_pr$sdev^2 / sum(my_iris_pr$sdev^2)
cum  <- cumsum(prop)
my_k <- which(cum >= 0.9)[1]
my_k
#> [1] 2
```

**Explanation:** iris's PC1 captures 73% and PC2 adds 23%, hitting 96% at k = 2. `which(... >= 0.9)[1]` returns the first index that crosses the threshold.

</details>

### Exercise 2: Which USArrests state is highest on PC2?

Build a data frame called `my_scores_df` with columns `state`, `PC1`, and `PC2` from the USArrests PCA. Then find the state with the highest PC2 score and store the state name (character) in `my_top_state`.

```r title="Exercise 2 starter: top PC2 state"
# Exercise 2
# Hint: data.frame() + rownames(); use which.max() for indexing

my_scores_df <- NULL  # your code here
my_top_state <- NA    # your code here

my_top_state
#> Expected: "Mississippi"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_scores_df <- data.frame(
  state = rownames(pr$x),
  PC1   = pr$x[, "PC1"],
  PC2   = pr$x[, "PC2"]
)
my_top_state <- my_scores_df$state[which.max(my_scores_df$PC2)]
my_top_state
#> [1] "Mississippi"
```

**Explanation:** Mississippi sits at the top of PC2. Because PC2's biggest loading is UrbanPop with a negative sign, high PC2 means low UrbanPop. Mississippi has one of the lowest urbanization rates in the dataset, which lines up.

</details>

### Exercise 3: Verify loadings equal correlations

Compute the classical loadings matrix for USArrests as `my_loadings = rotation × sdev`. Then compute `cor(USArrests, pr$x)` and confirm the two matrices are equal up to rounding error.

```r title="Exercise 3 starter: loadings = correlations"
# Exercise 3
# Hint: sweep() scales columns; all.equal() tolerates floating-point noise

my_loadings <- NULL  # your code here
my_cors     <- NULL  # your code here

identical_up_to_precision <- NA  # compare them
identical_up_to_precision
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_loadings <- sweep(pr$rotation, 2, pr$sdev, FUN = "*")
my_cors     <- cor(USArrests, pr$x)
identical_up_to_precision <- isTRUE(all.equal(my_loadings, my_cors,
                                              check.attributes = FALSE))
identical_up_to_precision
#> [1] TRUE
```

**Explanation:** `sweep()` multiplies each column of `pr$rotation` by the corresponding entry in `pr$sdev`, producing classical loadings. These are mathematically identical to the Pearson correlations between each original variable and each PC score column (for scaled PCA).

</details>

## Complete Example

Putting the six sections together on `iris[, 1:4]`: fit scaled PCA, read variance explained, interpret loadings per PC, extract scores for downstream use.

```r title="End-to-end PCA interpretation on iris"
iris_pr <- prcomp(iris[, 1:4], scale. = TRUE)

# 1. Variance explained
round(summary(iris_pr)$importance, 4)
#>                            PC1    PC2    PC3    PC4
#> Standard deviation     1.7084 0.9560 0.3831 0.1439
#> Proportion of Variance 0.7296 0.2285 0.0367 0.0052
#> Cumulative Proportion  0.7296 0.9581 0.9948 1.0000

# 2. Loadings (classical)
iris_load <- sweep(iris_pr$rotation, 2, iris_pr$sdev, FUN = "*")
round(iris_load, 3)
#>                 PC1    PC2    PC3    PC4
#> Sepal.Length  0.891  0.361 -0.276  0.038
#> Sepal.Width  -0.460  0.883  0.094 -0.018
#> Petal.Length  0.992  0.023  0.054 -0.108
#> Petal.Width   0.965  0.064  0.243  0.076

# 3. Top-loading variable per PC
apply(iris_load, 2, function(col) names(col)[which.max(abs(col))])
#>           PC1            PC2            PC3            PC4
#> "Petal.Length"  "Sepal.Width" "Sepal.Length"  "Petal.Length"

# 4. First two scores, ready for plotting or clustering
head(iris_pr$x[, 1:2], 3)
#>            PC1        PC2
#> 1   -2.257141 -0.4784238
#> 2   -2.074013  0.6718827
#> 3   -2.356335  0.3407664
```

Reading the output top-to-bottom: iris compresses extremely well, with 73% of the variance on PC1 and 96% on the first two. PC1 is an overall flower-size axis, dominated by Petal.Length and Petal.Width (plus Sepal.Length on the positive side). PC2 is mostly Sepal.Width. The first two scores are all you need to visualize or cluster the 150 flowers.

## Summary

`prcomp()` gives you three answers, one per core quantity.

| Quantity | Slot | Question | How to read |
|---|---|---|---|
| Variance explained | `pr$sdev^2`, `summary(pr)` | How much signal does each PC capture? | Proportions sum to 1; cumulative tells you compression power. |
| Rotation (eigenvectors) | `pr$rotation` | Which original variables define each PC, and how? | Unit-length columns. Sign is arbitrary; within-column pattern is the interpretation. |
| Classical loadings | `sweep(rotation, 2, sdev, *)` | What is the correlation between each variable and each PC? | Values on the correlation scale (−1 to 1). Larger magnitude = stronger tie. |
| Scores | `pr$x` | Where does each observation sit on each PC? | Coordinates in the new basis; ready for plotting, clustering, or regression. |

![Three quantities, three questions](screenshots/Interpreting-PCA-Results-in-R-three-quantities.webp)
*Figure 3: The three core PCA quantities and the interpretive question each one answers.*

Three working rules to take away:

1. Always scale unless you have a reason not to.
2. Read rotation patterns (not individual signs) to label each PC.
3. Use classical loadings (not rotation entries) when you want interpretive, correlation-scale numbers.

## References

1. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, 2nd Edition. Chapter 12: Unsupervised Learning (PCA). [Link](https://www.statlearning.com/)
2. Jolliffe, I. T. *Principal Component Analysis*, 2nd Edition. Springer Series in Statistics. [Link](https://link.springer.com/book/10.1007/b98835)
3. R Documentation: `?prcomp`. Part of the base `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html)
4. Jolliffe, I. T., Cadima, J. "Principal component analysis: a review and recent developments." *Philosophical Transactions of the Royal Society A* (2016). [Link](https://royalsocietypublishing.org/doi/10.1098/rsta.2015.0202)
5. Wickham, H., Grolemund, G. *R for Data Science*. Chapter on exploratory techniques. [Link](https://r4ds.hadley.nz/)
6. tidymodels / recipes: `step_pca()` reference. [Link](https://recipes.tidymodels.org/reference/step_pca.html)
7. factoextra package documentation: PCA visualization helpers built on `prcomp()`. [Link](https://rpkgs.datanovia.com/factoextra/)

## Continue Learning

- **[PCA with prcomp() in R](PCA-in-R.html)**: the companion "how to run PCA" tutorial; pair with this one for full coverage.
- **[Multivariate Distances and Hotelling's T²](Multivariate-Statistics-in-R.html)**: the broader family of multivariate techniques PCA belongs to.
- **[Multi-Dimensional Scaling in R](Multi-Dimensional-Scaling-With-R.html)**: a related dimension-reduction method based on pairwise distances instead of variance.
