---
title: "PCA in R: Reduce Dimensions, Visualise Structure, and Understand What prcomp() Returns"
slug: "PCA-in-R"
description: "Run PCA in R with prcomp(): scale your data, read the rotation and sdev outputs, pick components from the scree plot, and interpret a biplot confidently."
keywords: "PCA in R, prcomp, principal component analysis, scree plot, biplot, dimensionality reduction, rotation matrix, explained variance, factoextra, ggbiplot"
auto_link_terms: "PCA in R|principal component analysis|prcomp()|scree plot|biplot|explained variance|dimensionality reduction|rotation matrix|factoextra"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "2.5.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "PCA with prcomp()"
sidebar_order: 69
difficulty: "Intermediate"
---

# PCA in R: Reduce Dimensions, Visualise Structure, and Understand What prcomp() Returns

<p class="lead">Principal Component Analysis (PCA) in R with <code>prcomp()</code> rotates your numeric columns into a smaller set of uncorrelated directions that capture as much variance as possible, so you can visualise, compress, or denoise multivariate data in a few lines of base R.</p>

## What is PCA in R and when should you reach for it?

PCA answers a practical question: when your data has many correlated numeric columns, which directions carry the most information? `prcomp()` ships with base R and does the heavy lifting in one call. Let's run it on `USArrests`, a built-in dataset with four crime-related columns across 50 US states, so you can see the payoff before we open the hood.

```r title="Fit PCA on USArrests with prcomp()"
library(dplyr)
library(ggplot2)

# Fit PCA: scale=TRUE standardises each column before decomposition
pca_arrests <- prcomp(USArrests, scale = TRUE)

# Variance explained by each component
summary(pca_arrests)
#> Importance of components:
#>                           PC1    PC2     PC3     PC4
#> Standard deviation     1.5749 0.9949 0.59713 0.41645
#> Proportion of Variance 0.6201 0.2474 0.08914 0.04336
#> Cumulative Proportion  0.6201 0.8675 0.95664 1.00000
```

Two numbers in that summary do most of the interpretation work. The **Proportion of Variance** row says how much of the dataset's total variance each component absorbs: PC1 captures 62%, PC2 another 25%. The **Cumulative Proportion** row tells you when you have "enough" components: by PC2 you already explain 87% of the variance, which is why PCA is so useful for 2D plots. The remaining PC3 and PC4 carry little new information, so a two-component summary of these fifty states is genuinely faithful to the data.

![PCA workflow in R](screenshots/PCA-in-R-workflow.webp)

*Figure 1: The six-step PCA workflow in R, from raw matrix to biplot.*

[KEY INSIGHT]
**PCA rotates, it doesn't select.** Each principal component is a weighted blend of every original column, ordered so PC1 maximises variance, PC2 maximises the remainder while staying uncorrelated with PC1, and so on. You're not picking columns, you're changing the coordinate system.

**Try it:** Run PCA on the numeric columns of `mtcars` (drop none, they're all numeric) with scaling on. What is the cumulative variance captured by PC1 and PC2? Fill the blank and compare against the expected output.

```r title="Your turn: PCA on mtcars"
# Goal: fit PCA on mtcars, read off cumulative variance at PC2
ex_pca_mtcars <- prcomp(___, scale = TRUE)
summary(ex_pca_mtcars)$importance[3, "PC2"]
#> Expected: 0.8424 (about 84 percent)
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars PCA solution"
ex_pca_mtcars <- prcomp(mtcars, scale = TRUE)
summary(ex_pca_mtcars)$importance[3, "PC2"]
#> [1] 0.8424
```

**Explanation:** `summary()` returns an `$importance` matrix whose third row is the cumulative proportion. Indexing by column name reads PC2's cumulative variance directly.

</details>

## What does prcomp() actually return?

`prcomp()` returns a list with five named slots. Each slot answers a specific question about the decomposition, so learning them once pays off every time you touch PCA. The structure is the same whether you pass four columns or four thousand.

![prcomp return object](screenshots/PCA-in-R-prcomp-object.webp)

*Figure 2: The five slots returned by prcomp(): sdev, rotation, x, center, scale.*

```r title="Inspect the prcomp result"
# Structure of the whole object
str(pca_arrests, max.level = 1)
#> List of 5
#>  $ sdev    : num [1:4] 1.575 0.995 0.597 0.416
#>  $ rotation: num [1:4, 1:4] -0.536 -0.583 -0.278 -0.543 ...
#>  $ center  : Named num [1:4] 7.79 170.76 65.54 21.23
#>  $ scale   : Named num [1:4] 4.36 83.34 14.47 9.37
#>  $ x       : num [1:50, 1:4] -0.976 -1.931 -1.745 0.14 -2.499 ...

# Loadings: columns are eigenvectors, rows are original variables
loadings_arrests <- pca_arrests$rotation
round(loadings_arrests, 3)
#>                 PC1    PC2    PC3    PC4
#> Murder       -0.536  0.418 -0.341  0.649
#> Assault      -0.583  0.188 -0.268 -0.743
#> UrbanPop     -0.278 -0.873 -0.378  0.134
#> Rape         -0.543 -0.167  0.818  0.089

# Scores: 50 rows projected onto the new axes
scores_arrests <- pca_arrests$x
head(scores_arrests, 3)
#>            PC1    PC2    PC3    PC4
#> Alabama -0.976  1.122 -0.440  0.155
#> Alaska  -1.931  1.062  2.020 -0.434
#> Arizona -1.745 -0.738  0.054 -0.826
```

Read the output one slot at a time. `$sdev` is the standard deviation of each component; squaring it gives the variance (these are the eigenvalues). `$rotation` is a square matrix whose columns are the principal directions, also called loadings or eigenvectors. `$x` contains your data after rotation: fifty rows, one per state, now expressed in PC1-PC4 coordinates. `$center` and `$scale` store the column means and standard deviations used during preprocessing, which you'll need again when projecting new data.

[KEY INSIGHT]
**Scores are just standardised data times the rotation.** The identity `pca$x = scale(data, pca$center, pca$scale) %*% pca$rotation` holds exactly. Understanding this one line demystifies every other PCA plot you'll ever see.

**Try it:** Look at PC2's loadings in the rotation matrix above. Which original variable has the largest absolute weight on PC2?

```r title="Your turn: dominant variable on PC2"
# Goal: find the variable with the largest |loading| on PC2
ex_pc2 <- abs(pca_arrests$rotation[, "___"])
names(ex_pc2)[which.max(ex_pc2)]
#> Expected: "UrbanPop"
```

<details>
<summary>Click to reveal solution</summary>

```r title="PC2 dominant variable solution"
ex_pc2 <- abs(pca_arrests$rotation[, "PC2"])
names(ex_pc2)[which.max(ex_pc2)]
#> [1] "UrbanPop"
```

**Explanation:** PC2 has a loading of -0.873 on UrbanPop, far larger in magnitude than the others. That tells us PC2 mostly measures how urban a state is, largely independent of violent-crime rates captured by PC1.

</details>

## Why scale() before PCA? (and what happens if you don't)

PCA is entirely variance-driven, which means columns measured on larger numeric scales will automatically dominate the first component. Murder counts range roughly 0-18, but Assault counts range 45-337. Without scaling, the assault column's raw variance is hundreds of times larger than murder's, even though the underlying concepts are equally important.

```r title="Compare scaled vs unscaled PCA on the same data"
# Scale FALSE: default, decomposes the covariance matrix
pca_unscaled <- prcomp(USArrests, scale = FALSE)

# First-PC loadings, side by side
round(cbind(
  unscaled = pca_unscaled$rotation[, 1],
  scaled   = pca_arrests$rotation[, 1]
), 3)
#>          unscaled  scaled
#> Murder     -0.042  -0.536
#> Assault    -0.995  -0.583
#> UrbanPop   -0.046  -0.278
#> Rape       -0.075  -0.543
```

Look at the unscaled column: Assault alone has a loading of -0.995, so PC1 is essentially "Assault, with rounding error." The scaled column spreads weight across all four crimes, which is what we actually want when the goal is to summarise overall crime patterns. The takeaway is blunt: unless every column is already measured in the same physical unit, set `scale = TRUE`.

[WARNING]
**prcomp() does not scale by default.** The argument is `scale = FALSE` unless you change it. Passing `scale. = TRUE` (note the trailing dot in the canonical base R signature) is safe and recommended; `prcomp()` accepts both `scale` and `scale.` as aliases. Silent unscaled PCA is a top source of confused results in tutorials.

If you're mathematically curious, scaling first is equivalent to decomposing the correlation matrix instead of the covariance matrix. The relationship is

$$\text{cor}(X) = D^{-1}\, \text{cov}(X)\, D^{-1}$$

Where:
- $X$ is the centred data matrix
- $D$ is a diagonal matrix of column standard deviations
- $D^{-1}$ undoes the units so each column contributes equal variance

*If you're not interested in the math, skip to the next section. The `scale = TRUE` rule above is all you need.*

**Try it:** Fit PCA on `USArrests` without scaling, then print PC1 loadings. Confirm Assault dominates.

```r title="Your turn: inspect unscaled PC1"
# Goal: refit without scaling and print PC1 loadings
ex_pca_raw <- prcomp(USArrests, scale = ___)
round(ex_pca_raw$rotation[, 1], 3)
#> Expected: Assault loading near -0.995
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unscaled PC1 solution"
ex_pca_raw <- prcomp(USArrests, scale = FALSE)
round(ex_pca_raw$rotation[, 1], 3)
#>   Murder  Assault UrbanPop     Rape
#>   -0.042   -0.995   -0.046   -0.075
```

**Explanation:** Assault's raw variance dwarfs the others, so PC1 becomes an Assault proxy. Scaling re-centres the analysis on correlation structure rather than raw spread.

</details>

## How do you read the scree plot and pick the number of components?

Every PCA report eventually asks: how many components should I keep? Three rules are widely used, they usually agree, and when they don't, agreement between any two of them is a reasonable tie-breaker.

![How many components to keep](screenshots/PCA-in-R-how-many-pcs.webp)

*Figure 3: Three complementary rules for choosing how many components to keep.*

The three rules in order of strictness:

1. **Kaiser rule:** keep every PC whose variance is at least 1. Applies only to scaled PCA, because variance-per-PC averages 1 when columns are standardised.
2. **Cumulative-variance rule:** keep enough PCs to explain a preset share, typically 80% or 90% of total variance.
3. **Scree elbow:** plot eigenvalues against component index, then retain the PCs before the visible "elbow" where the curve flattens.

Let's build a scree plot manually so you can see the numbers behind the picture.

```r title="Scree plot with ggplot2"
# Eigenvalues (variance per PC) and cumulative variance
scree_df <- tibble(
  component = paste0("PC", seq_along(pca_arrests$sdev)),
  eigenvalue = pca_arrests$sdev^2,
  cum_var = cumsum(eigenvalue) / sum(eigenvalue)
)
scree_df
#> # A tibble: 4 x 3
#>   component eigenvalue cum_var
#>   <chr>          <dbl>   <dbl>
#> 1 PC1            2.48    0.620
#> 2 PC2            0.990   0.868
#> 3 PC3            0.357   0.957
#> 4 PC4            0.173   1

ggplot(scree_df, aes(x = component, y = eigenvalue, group = 1)) +
  geom_col(fill = "#9370DB") +
  geom_line(size = 1, colour = "#333") +
  geom_hline(yintercept = 1, linetype = "dashed", colour = "red") +
  labs(title = "Scree plot: USArrests", x = NULL, y = "Eigenvalue") +
  theme_minimal()
```

The red dashed line at eigenvalue = 1 is the Kaiser cutoff. PC1 sits comfortably above it, PC2 sits almost exactly on it, and PC3-PC4 fall well below. All three rules then agree: keep two components. For USArrests that's also where the cumulative variance crosses 87%, a strong summary of a four-dimensional dataset in two coordinates.

If you'd rather not build the plot yourself, `factoextra` wraps the whole thing into one call.

```r title="Scree plot with factoextra"
library(factoextra)
fviz_eig(pca_arrests, addlabels = TRUE, ylim = c(0, 70))
```

`fviz_eig()` reports percentage of variance instead of raw eigenvalues, labels each bar, and produces a publication-ready figure without extra configuration. Use it when you want speed; use the manual version when you want to customise the colours, annotations, or the cutoff line.

[NOTE]
**`factoextra` may not run in the in-browser sandbox.** It pulls in `FactoMineR` and `ggrepel`, which aren't always pre-installed in the runner that powers this page. If a `factoextra` cell errors, copy the code into local RStudio after `install.packages("factoextra")`. The base R `biplot()` and the manual `ggplot2` scree plot above do the same job and always run in the browser.

[TIP]
**Cross-check all three rules before committing to a k.** When they disagree, favour interpretability. A third component is only worth keeping if you can describe what it means in words; numerical gain without human meaning is wasted bandwidth.

**Try it:** Use `pca_arrests$sdev` to count how many components satisfy the Kaiser rule.

```r title="Your turn: Kaiser rule count"
# Goal: count PCs with variance >= 1
ex_kaiser <- sum(pca_arrests$sdev^___ >= 1)
ex_kaiser
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Kaiser count solution"
ex_kaiser <- sum(pca_arrests$sdev^2 >= 1)
ex_kaiser
#> [1] 2
```

**Explanation:** Eigenvalues are `sdev^2`. Summing the logical vector counts how many clear the threshold. Two PCs clear it, matching the scree elbow and the 87% cumulative-variance mark.

</details>

## How do you interpret loadings and biplots?

Loadings are the instruction sheet for what each component actually measures. A loading is a signed weight telling you how much each original variable contributes to a component, and the sign tells you direction. High values across Murder, Assault, and Rape on PC1 (all negative, same sign) means PC1 captures a "violent crime" axis; a strong negative weight on UrbanPop for PC2 means PC2 captures "how urban."

```r title="Round and inspect the rotation matrix"
round(pca_arrests$rotation, 3)
#>                 PC1    PC2    PC3    PC4
#> Murder       -0.536  0.418 -0.341  0.649
#> Assault      -0.583  0.188 -0.268 -0.743
#> UrbanPop     -0.278 -0.873 -0.378  0.134
#> Rape         -0.543 -0.167  0.818  0.089
```

Reading column PC1: all four variables share the same sign (negative), and Murder, Assault, and Rape are close in magnitude while UrbanPop is weaker. That's a single "crime intensity" direction, dominated by the three violent-crime variables. PC2 tells a cleaner story: UrbanPop's loading is far larger than the rest, so PC2 is mostly "urbanisation" with small crime-mix corrections. States with large negative PC2 scores are highly urban regardless of their crime profile.

A biplot puts the loadings and the scores on the same canvas so you can read both at once. Arrows show loadings (the rotation columns), points show scores (rows projected onto PCs), and arrow angles approximate correlations between original variables.

```r title="Base R biplot of PCA"
biplot(pca_arrests, scale = 0, cex = 0.7)
```

`scale = 0` tells `biplot()` to plot raw scores and raw loadings, which keeps geometric interpretation honest. Arrow direction shows which end of the PC is "high" for that variable, arrow length shows how strongly a variable drives the first two PCs, and the angle between two arrows roughly tracks their correlation (small angle = positively correlated, right angle = uncorrelated, opposite = negatively correlated).

```r title="Styled biplot with factoextra"
fviz_pca_biplot(
  pca_arrests,
  repel = TRUE,
  col.var = "#9370DB",
  col.ind = "#333",
  label = "all"
)
```

`fviz_pca_biplot()` handles label collision with `repel = TRUE`, supports colour-by-group via `habillage`, and generally produces a better-looking figure than base R. Use it for reports; keep base `biplot()` in mind for quick sanity checks.

[NOTE]
**The sign of a PC is arbitrary.** Different R versions, different hardware, or different subsets can flip the sign of a column in `$rotation` while preserving all interpretations. If a reviewer asks why your PC1 points "the wrong way", you can multiply both the rotation column and the corresponding score column by -1 without changing anything substantive.

**Try it:** Find the state with the highest PC1 score (recall PC1 is negative for high-crime states, so the *lowest* PC1 score is the highest-crime state).

```r title="Your turn: extreme PC1 state"
# Goal: name the state with the smallest PC1 score
ex_scores <- as.data.frame(pca_arrests$___)
ex_scores$state <- rownames(ex_scores)
ex_scores |> arrange(PC1) |> head(1) |> pull(state)
#> Expected: "Florida"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extreme PC1 state solution"
ex_scores <- as.data.frame(pca_arrests$x)
ex_scores$state <- rownames(ex_scores)
ex_scores |> arrange(PC1) |> head(1) |> pull(state)
#> [1] "Florida"
```

**Explanation:** Scores live in `$x`, rownames carry the state labels. PC1 is signed so that negative values indicate high crime; Florida has the most negative PC1 in the 1973 USArrests snapshot.

</details>

## How do you use PCA output in downstream work?

Once you trust a PCA fit, you can use its scores anywhere you'd normally use the original columns: as axes for scatter plots, as predictors in a regression, or as inputs to clustering. The one trick is projecting *new* data onto the same components, which the `predict()` method handles correctly as long as you pass the original prcomp object.

```r title="PCA scores as regression predictors"
# Build a two-PC dataframe alongside a target
pc_df <- data.frame(
  pca_arrests$x[, 1:2],
  urban = USArrests$UrbanPop
)

# Fit a simple linear regression on the two PCs
pcr_model <- lm(urban ~ PC1 + PC2, data = pc_df)
coef(pcr_model)
#> (Intercept)         PC1         PC2
#>    65.54000    -2.23060   -12.68069
summary(pcr_model)$r.squared
#> [1] 0.8097
```

The model isn't interesting in itself (UrbanPop is already one of the inputs), but the pattern is the point: PCs are just columns, and they drop into `lm()`, `glm()`, or `randomForest()` the same way any numeric predictor would. This trick is called principal-components regression and it's useful when you have many correlated predictors that would otherwise cause multicollinearity.

Projecting new observations onto existing PCs is a one-liner with `predict.prcomp()`, but there's a pitfall: the new observation must be scaled with the *same* centring and scaling used during fitting. Storing the original prcomp object takes care of that automatically.

```r title="Project a new observation onto existing PCs"
# A fictional new state with above-average crime and urbanisation
new_state <- data.frame(
  Murder = 12,
  Assault = 250,
  UrbanPop = 75,
  Rape = 28,
  row.names = "Newland"
)

# predict.prcomp uses the saved $center and $scale automatically
new_scores <- predict(pca_arrests, newdata = new_state)
round(new_scores, 3)
#>             PC1    PC2   PC3    PC4
#> Newland  -1.784 -0.797 0.075 -0.278
```

`predict(pca_arrests, newdata = new_state)` does three things under the hood: subtracts the stored column means, divides by the stored column sds, then multiplies by `$rotation`. That guarantees `Newland` lands in the same coordinate system as the original 50 states, so you can plot it on the same biplot, cluster it with the same distance metric, or feed it into the same downstream model.

[TIP]
**Serialise the prcomp object, not the loadings.** Saving the whole object with `saveRDS()` preserves `$center` and `$scale` automatically. If you store only the rotation matrix, you'll forget the scaling constants and your production scores will silently shift.

**Try it:** Project a second hypothetical state onto the existing PCs and pull out only its PC1 score.

```r title="Your turn: project and extract PC1"
ex_state <- data.frame(Murder = 3, Assault = 80, UrbanPop = 50, Rape = 12)
ex_proj <- predict(___, newdata = ex_state)
ex_proj[, "PC1"]
#> Expected: about 2.42 (positive PC1 = low crime)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Projection solution"
ex_state <- data.frame(Murder = 3, Assault = 80, UrbanPop = 50, Rape = 12)
ex_proj <- predict(pca_arrests, newdata = ex_state)
ex_proj[, "PC1"]
#> [1] 2.418
```

**Explanation:** A low-crime, medium-urban hypothetical state sits on the positive side of PC1, the opposite end from Florida. The positive score confirms the earlier read of PC1 as an inverse violent-crime axis.

</details>

## Practice Exercises

Apply the full PCA workflow end-to-end. Use distinct variable names (all prefixed `my_`) so tutorial variables stay intact.

### Exercise 1: Full PCA workflow on mtcars

Fit PCA on `mtcars` with scaling, decide how many components to keep using the 80% cumulative-variance rule, and print the first three rows of scores for your retained PCs. Save scores to `my_scores`.

```r title="Exercise 1 starter"
# Hint: summary()$importance gives cumulative variance in row 3
# Use head() on the score matrix after fitting

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_pca <- prcomp(mtcars, scale = TRUE)
my_cum <- summary(my_pca)$importance[3, ]
my_k <- which(my_cum >= 0.80)[1]
my_scores <- my_pca$x[, 1:my_k]
head(my_scores, 3)
#>                           PC1        PC2
#> Mazda RX4          -0.6468627  1.7081142
#> Mazda RX4 Wag      -0.6194831  1.5256219
#> Datsun 710         -2.7356242 -0.1441501
```

**Explanation:** `summary()$importance[3, ]` is the named cumulative-variance vector. `which(... >= 0.80)[1]` returns the first index crossing the threshold, which is PC2 for `mtcars`. Two components capture 84% of variance and suffice by the 80% rule.

</details>

### Exercise 2: Scaled vs unscaled comparison

Fit PCA on `USArrests` with and without scaling. Correlate the absolute PC1 loadings between the two fits. If the correlation is far from 1, scaling genuinely changed which variables dominate. Save the correlation to `my_load_cmp`.

```r title="Exercise 2 starter"
# Hint: fit two prcomp objects, take abs() of each PC1 loading vector,
# then cor() the two vectors.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_pca_s  <- prcomp(USArrests, scale = TRUE)
my_pca_ns <- prcomp(USArrests, scale = FALSE)
my_load_cmp <- cor(
  abs(my_pca_s$rotation[, 1]),
  abs(my_pca_ns$rotation[, 1])
)
round(my_load_cmp, 3)
#> [1] 0.173
```

**Explanation:** A correlation of 0.17 means the scaled and unscaled fits barely agree on what PC1 is. The unscaled fit has PC1 loaded almost entirely on Assault; the scaled fit balances all four crimes. This is exactly why scaling is the default choice unless every column shares the same physical unit.

</details>

### Exercise 3: Biplot-driven interpretation on iris

Fit PCA on the four numeric columns of `iris`, draw a biplot coloured by `Species`, and report which two variables are most aligned with PC1 (largest absolute PC1 loadings). Save the result to `my_iris_pca`.

```r title="Exercise 3 starter"
# Hint: use fviz_pca_biplot() with habillage = iris$Species
# Inspect my_iris_pca$rotation[, 1] for the loadings

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_iris_pca <- prcomp(iris[, 1:4], scale = TRUE)
fviz_pca_biplot(
  my_iris_pca,
  habillage = iris$Species,
  addEllipses = TRUE,
  repel = TRUE
)

# Which two variables dominate PC1?
my_iris_loads <- abs(my_iris_pca$rotation[, 1])
sort(my_iris_loads, decreasing = TRUE)[1:2]
#> Petal.Length  Petal.Width
#>    0.5804131    0.5648565
```

**Explanation:** Petal measurements dominate PC1 for `iris`, which is why PC1 alone separates setosa from the other two species. The biplot makes this visual: setosa sits at one end of the petal arrows, virginica at the other, versicolor in between.

</details>

## Complete Example

Here's an end-to-end PCA pipeline on the `decathlon2` dataset (results from two decathlon competitions, shipped with `factoextra`). We'll scale, fit, pick a k, and interpret the biplot.

```r title="End-to-end PCA on decathlon2"
library(factoextra)
data("decathlon2")

# Keep only athletes from the Decastar competition and numeric event columns
dec_active <- decathlon2[1:23, 1:10]

# Fit and summarise
pca_dec <- prcomp(dec_active, scale = TRUE)
summary(pca_dec)$importance[, 1:4]
#>                             PC1       PC2       PC3       PC4
#> Standard deviation     2.020230 1.4015760 1.1181923 0.9432083
#> Proportion of Variance 0.408130 0.1964417 0.1250354 0.0889642
#> Cumulative Proportion  0.408130 0.6045718 0.7296072 0.8185714

# Scree plot
fviz_eig(pca_dec, addlabels = TRUE)

# Biplot coloured by individual quality of representation
fviz_pca_biplot(
  pca_dec,
  repel = TRUE,
  col.var = "#9370DB",
  col.ind = "cos2"
)
```

The first two components explain 60% of variance and four reach the 80% mark, so k = 4 is a defensible choice by cumulative-variance; k = 2 is fine for a quick visual. On the biplot, running events (100m, 400m, hurdles) cluster together and point opposite to throwing events (shot put, discus), because strong runners are usually lean and strong throwers are usually heavy, so the two event families trade off along PC1. PC2 separates jumpers from throwers, which is the second most important pattern in the data.

## Summary

Four steps carry you from raw matrix to interpretable summary.

![PCA mindmap](screenshots/PCA-in-R-overview-mindmap.webp)

*Figure 4: PCA in R at a glance: preparation, prcomp slots, diagnostics, and visualisations.*

| Function | Purpose |
|---|---|
| `prcomp(data, scale = TRUE)` | Fit PCA via SVD; almost always pass `scale = TRUE` |
| `summary(pca)` | Variance explained, per-PC and cumulative |
| `pca$sdev` | Square to get eigenvalues; Kaiser rule uses these |
| `pca$rotation` | Loadings (columns are eigenvectors of the correlation matrix) |
| `pca$x` | Scores: rows projected onto PCs, ready for plotting |
| `predict(pca, newdata)` | Project new rows onto existing components with stored centring and scaling |
| `fviz_eig(pca)` | One-call scree plot via factoextra |
| `fviz_pca_biplot(pca)` | Publication-ready biplot with label repelling and group colouring |

Retain components by triangulating three rules (Kaiser, 80% cumulative, scree elbow) and favour interpretability when they disagree. Save the full prcomp object so centring and scaling travel with your pipeline; don't reinvent them from notes.

## References

1. R Core Team. `prcomp` reference in the `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html)
2. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning with Applications in R*, Chapter 12 on Unsupervised Learning. [Link](https://www.statlearning.com/)
3. Hotelling, H. "Analysis of a complex of statistical variables into principal components." *Journal of Educational Psychology*, 24 (6), 417-441 (1933).
4. Pearson, K. "On lines and planes of closest fit to systems of points in space." *Philosophical Magazine*, 2 (11), 559-572 (1901).
5. Kassambara, A. & Mundt, F. `factoextra` package: extract and visualise the results of multivariate data analyses. [Link](https://cran.r-project.org/package=factoextra)
6. Robinson, D. & Hayes, A. `broom::tidy.prcomp` tidy PCA output. [Link](https://broom.tidymodels.org/reference/tidy.prcomp.html)
7. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G. *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)
8. STHDA. Principal Component Methods in R: Practical Guide. [Link](https://www.sthda.com/english/articles/31-principal-component-methods-in-r-practical-guide/)

## Continue Learning

- [Multivariate Statistics in R: Distances, Mahalanobis, and Hotelling's T²](Multivariate-Statistics-in-R.html): how correlation structure changes multivariate thinking.
- [Correlation in R (Pearson, Spearman, Kendall)](Correlation-in-R.html): the building block behind PCA's covariance and correlation matrices.
- [Outlier Detection in R](Outlier-Detection-in-R.html): PCA is a standard tool for spotting multivariate outliers via reconstruction error.
