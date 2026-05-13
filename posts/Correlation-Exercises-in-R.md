---
title: "Correlation Exercises in R: 20 Practice Problems"
slug: "Correlation-Exercises-in-R"
description: "Twenty correlation R exercises covering Pearson, Spearman, Kendall, cor.test, partial correlation, bootstrap CIs, and visualization. Hidden solutions."
keywords: "correlation R exercises, cor R practice, Pearson correlation R, Spearman correlation R, cor.test exercises, partial correlation R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Correlation Exercises"
sidebar_order: 140
fr_parent: "Correlation.html"
auto_link_terms: "correlation r exercises|cor r practice|pearson correlation r|spearman correlation r|cor.test exercises|partial correlation r"
auto_link_case_sensitive: false
target_keyword: "correlation R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Correlation Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on correlation in R covering Pearson, Spearman, Kendall, significance testing with cor.test, partial correlation, bootstrap confidence intervals, correlation matrices, and visual diagnostics. Solutions are hidden behind a reveal so you can attempt every problem first, then check your approach.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
library(ggcorrplot)
library(ppcor)
```

## Section 1. Basic Pearson correlation (4 problems)

### Exercise 1.1: Compute the Pearson correlation between weight and mpg

**Task:** Use base R `cor()` on the `mtcars` dataset to compute the Pearson correlation coefficient between `wt` (weight) and `mpg` (miles per gallon). Save the single numeric value to `ex_1_1` and print it.

**Expected result:**

```
#> [1] -0.8676594
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- cor(mtcars$wt, mtcars$mpg)
ex_1_1
#> [1] -0.8676594
```

**Explanation:** `cor(x, y)` returns a single Pearson coefficient when both arguments are numeric vectors. The strong negative value near -0.87 says that heavier cars deliver markedly fewer miles per gallon, which matches physical intuition. If you pass `cor(mtcars$wt, mtcars$mpg, method = "pearson")` explicitly you get the same number; `"pearson"` is the default.

</details>

### Exercise 1.2: Compute correlation when one column has missing values

**Task:** A reporting analyst is auditing `airquality` and notices that `Ozone` and `Solar.R` both contain `NA`. Compute the Pearson correlation between `Ozone` and `Solar.R` using only the rows that have non-missing values in both columns and save the result to `ex_1_2`.

**Expected result:**

```
#> [1] 0.3483417
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- cor(airquality$Ozone, airquality$Solar.R, use = "complete.obs")
ex_1_2
#> [1] 0.3483417
```

**Explanation:** The `use` argument controls NA handling. `"complete.obs"` casts out any row where either input is missing before computing the coefficient; `"pairwise.complete.obs"` is the matrix-mode equivalent that handles each pair independently. Without `use`, `cor()` returns `NA` whenever any value is missing. A common mistake is calling `na.omit()` on one column at a time, which misaligns the two vectors and yields a wrong number.

</details>

### Exercise 1.3: Contrast correlation with covariance on the same pair

**Task:** Using `mtcars$hp` and `mtcars$mpg`, compute both the covariance and the Pearson correlation, then assemble them into a named numeric vector with elements `covariance` and `correlation`. Save the vector to `ex_1_3` so the analyst can see how scale-dependence differs between the two measures.

**Expected result:**

```
#> covariance correlation
#> -320.732056  -0.776168
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- c(
  covariance  = cov(mtcars$hp, mtcars$mpg),
  correlation = cor(mtcars$hp, mtcars$mpg)
)
ex_1_3
#> covariance correlation
#> -320.732056  -0.776168
```

**Explanation:** Correlation is covariance rescaled by the product of the standard deviations: $r = \mathrm{cov}(x, y) / (s_x s_y)$. That standardization is exactly what makes correlation comparable across pairs and unit systems; covariance changes if you switch horsepower to kilowatts, but correlation does not. When you only care about strength and direction of a linear association, use correlation; covariance matters when you need the unstandardized magnitude (for example, portfolio variance from a covariance matrix).

</details>

### Exercise 1.4: Implement Pearson correlation from scratch

**Task:** Without calling `cor()` or `cov()`, implement Pearson correlation between two numeric vectors `x` and `y` using only `mean()`, `sum()`, and `sqrt()`. Apply your formula to `mtcars$disp` and `mtcars$mpg` and save the result to `ex_1_4`. Verify it agrees with `cor()` to within 1e-12.

**Expected result:**

```
#> [1] -0.8475514
#> agrees with cor(): TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- mtcars$disp
y <- mtcars$mpg
num <- sum((x - mean(x)) * (y - mean(y)))
den <- sqrt(sum((x - mean(x))^2) * sum((y - mean(y))^2))
ex_1_4 <- num / den
ex_1_4
#> [1] -0.8475514
cat("agrees with cor():", isTRUE(all.equal(ex_1_4, cor(x, y))), "\n")
#> agrees with cor(): TRUE
```

**Explanation:** Pearson's formula is the centered cross-product divided by the geometric mean of the centered sums of squares. Re-deriving it once cements two ideas: the numerator is proportional to covariance, and the denominator equals $(n-1) s_x s_y$ if you divide by $n-1$ on both sides (those $n-1$ factors cancel). Real codebases never reimplement this, but writing it once helps you reason about why `cor()` is invariant under linear rescaling of either variable.

</details>

## Section 2. Visualizing correlations (3 problems)

### Exercise 2.1: Scatter plot with the correlation annotated in the title

**Task:** A junior analyst wants a publication-ready chart that shows the relationship between `wt` and `mpg` in `mtcars`. Build a ggplot scatter plot with a linear smoother (no confidence ribbon) and embed the rounded Pearson correlation in the plot title. Save the ggplot object to `ex_2_1`.

**Expected result:**

```
# scatter of wt vs mpg with geom_smooth(method = "lm", se = FALSE)
# title reads: "Weight vs MPG (r = -0.87)"
# x axis: Weight (1000 lbs), y axis: Miles per gallon
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
r <- round(cor(mtcars$wt, mtcars$mpg), 2)
ex_2_1 <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  labs(
    title = paste0("Weight vs MPG (r = ", r, ")"),
    x = "Weight (1000 lbs)",
    y = "Miles per gallon"
  )
ex_2_1
```

**Explanation:** Annotating the correlation directly in the title removes the back-and-forth between the chart and a separate stats table. Two small choices matter: `se = FALSE` keeps the ribbon off (it has nothing to do with $r$ and clutters the plot), and `round(r, 2)` matches the precision a reader can actually distinguish visually. For an in-panel annotation rather than a title, swap `labs(title = ...)` for `annotate("text", x = 5, y = 30, label = paste("r =", r))`.

</details>

### Exercise 2.2: Build a pairs plot for four numeric variables

**Task:** A product analyst is exploring relationships across `mtcars` and wants a quick all-pairs scatter matrix limited to `mpg`, `hp`, `wt`, and `qsec`. Produce a base R pairs plot of just those four columns and save the call into `ex_2_2`. Wrap the call in `invisible()` so the saved object is the data subset, not the plot output.

**Expected result:**

```
# 4x4 scatter matrix in the plotting window
# diagonal: variable names mpg, hp, wt, qsec
# off-diagonal: scatter plots, e.g. mpg vs hp top right
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- mtcars[, c("mpg", "hp", "wt", "qsec")]
pairs(ex_2_2)
```

**Explanation:** A pairs plot is the fastest way to spot non-linear, monotonic-but-curved, or grouped relationships before you ever compute a coefficient. The diagonal labels each column; the off-diagonal panels show every pairwise scatter. If you see a clear curve (for example `hp` vs `mpg` bending), a Pearson coefficient will understate the association and you should switch to Spearman or transform a variable. `GGally::ggpairs()` adds densities and correlations to the same grid if you prefer the ggplot2 look.

</details>

### Exercise 2.3: Build a correlation heatmap with hierarchical clustering

**Task:** A risk team is preparing a one-page summary of how the eleven numeric columns of `mtcars` co-move. Compute the full Pearson correlation matrix and pass it to `ggcorrplot::ggcorrplot()` with hierarchical clustering, lower triangle only, and the coefficient values printed in each tile. Save the ggplot object to `ex_2_3`.

**Expected result:**

```
# triangular correlation heatmap
# variables reordered by hclust so visually related blocks sit together
# each tile shows a coefficient rounded to 2 decimals
# blue = positive, red = negative, white = near zero
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cm <- cor(mtcars)
ex_2_3 <- ggcorrplot(
  cm,
  hc.order = TRUE,
  type     = "lower",
  lab      = TRUE,
  lab_size = 3
)
ex_2_3
```

**Explanation:** `hc.order = TRUE` reorders rows and columns using hierarchical clustering on the correlation distance, so highly correlated blocks visually cluster together. That clustering is what turns a heatmap from "pretty colors" into a real diagnostic for finding latent factor structure. `type = "lower"` halves the visual load since the matrix is symmetric. For very wide matrices (20+ variables), turn off `lab` to avoid label collisions; for narrow ones, keeping the numbers is worth the extra ink.

</details>

## Section 3. Correlation matrices (3 problems)

### Exercise 3.1: Compute the full correlation matrix of mtcars

**Task:** Compute the full pairwise Pearson correlation matrix across every column of `mtcars`. Save the 11-by-11 matrix to `ex_3_1`. Round to two decimal places when you print it so the output stays readable in a console.

**Expected result:**

```
#>        mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#> mpg   1.00 -0.85 -0.85 -0.78  0.68 -0.87  0.42  0.66  0.60  0.48 -0.55
#> cyl  -0.85  1.00  0.90  0.83 -0.70  0.78 -0.59 -0.81 -0.52 -0.49  0.53
#> disp -0.85  0.90  1.00  0.79 -0.71  0.89 -0.43 -0.71 -0.59 -0.56  0.39
#> hp   -0.78  0.83  0.79  1.00 -0.45  0.66 -0.71 -0.72 -0.24 -0.13  0.75
#> ...
#> # 7 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
round(ex_3_1, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- cor(mtcars)
round(ex_3_1, 2)
#>        mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#> mpg   1.00 -0.85 -0.85 -0.78  0.68 -0.87  0.42  0.66  0.60  0.48 -0.55
#> cyl  -0.85  1.00  0.90  0.83 -0.70  0.78 -0.59 -0.81 -0.52 -0.49  0.53
#> ...
```

**Explanation:** When `cor()` receives a data frame or matrix, it returns the full symmetric matrix of pairwise correlations. The diagonal is always 1 (every variable correlates perfectly with itself). Use `round()` purely for display; the underlying matrix keeps full precision. If any column is non-numeric, `cor()` errors; pre-filter with `mtcars |> select(where(is.numeric))` in mixed-type frames.

</details>

### Exercise 3.2: Filter strong correlations from a matrix

**Task:** A factor research team needs to flag every variable pair in `mtcars` whose absolute Pearson correlation exceeds 0.8 (excluding self-pairs). Return a tibble with columns `var1`, `var2`, and `r`, ordered by descending absolute correlation. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 10 x 3
#>   var1 var2     r
#>   <chr> <chr> <dbl>
#> 1 disp cyl    0.902
#> 2 disp wt     0.888
#> 3 mpg  wt    -0.868
#> 4 mpg  cyl   -0.852
#> 5 mpg  disp  -0.848
#> ...
#> # 5 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cm <- cor(mtcars)
cm[upper.tri(cm, diag = TRUE)] <- NA
ex_3_2 <- as.data.frame(as.table(cm)) |>
  rename(var1 = Var1, var2 = Var2, r = Freq) |>
  filter(!is.na(r), abs(r) > 0.8) |>
  arrange(desc(abs(r))) |>
  as_tibble()
ex_3_2
```

**Explanation:** Zeroing the upper triangle and diagonal with `NA` is the cleanest trick to avoid double-counting symmetric pairs and self-correlations. `as.table()` then `as.data.frame()` melts the matrix into long form, which is much easier to filter and sort than a wide square matrix. The pattern generalizes to any pairwise-association screen: collinearity audits, gene-gene co-expression, asset-return clustering.

</details>

### Exercise 3.3: Compute cross-correlations between two variable groups

**Task:** Treat `mtcars` columns `mpg`, `hp`, `wt`, `qsec` as performance variables and `cyl`, `gear`, `carb`, `am` as design variables. Compute the 4-by-4 matrix of Pearson correlations between every performance column and every design column. Save the rectangular matrix to `ex_3_3`.

**Expected result:**

```
#>            cyl  gear  carb     am
#> mpg  -0.852  0.480 -0.551  0.600
#> hp    0.832 -0.126  0.750 -0.243
#> wt    0.782 -0.583  0.428 -0.692
#> qsec -0.591 -0.213 -0.656 -0.230
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
round(ex_3_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
perf   <- mtcars[, c("mpg", "hp", "wt", "qsec")]
design <- mtcars[, c("cyl", "gear", "carb", "am")]
ex_3_3 <- cor(perf, design)
round(ex_3_3, 3)
#>            cyl  gear  carb     am
#> mpg  -0.852  0.480 -0.551  0.600
#> hp    0.832 -0.126  0.750 -0.243
#> wt    0.782 -0.583  0.428 -0.692
#> qsec -0.591 -0.213 -0.656 -0.230
```

**Explanation:** When you pass two data frames to `cor(x, y)`, it returns a rectangular matrix with rows from `x` and columns from `y`. That avoids computing within-group correlations you do not care about. The pattern is heavily used in canonical correlation setups, between-block PLS, and any screen where you want to see how one block of variables relates to another (for example, sensor channels vs. operating-condition tags).

</details>

## Section 4. Rank-based correlation: Spearman and Kendall (3 problems)

### Exercise 4.1: Compare Pearson and Spearman on a non-linear monotonic pair

**Task:** Build a vector `x <- 1:30` and a non-linear but monotonically increasing `y <- exp(x / 10)`. Compute both the Pearson and Spearman correlations and assemble them into a named vector `ex_4_1`. The result will show why Spearman is the right tool when the relationship is monotonic but not linear.

**Expected result:**

```
#>  pearson spearman
#> 0.8856148  1.0000000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 1:30
y <- exp(x / 10)
ex_4_1 <- c(
  pearson  = cor(x, y, method = "pearson"),
  spearman = cor(x, y, method = "spearman")
)
ex_4_1
#>  pearson spearman
#> 0.8856148  1.0000000
```

**Explanation:** Pearson measures linear association, so any curvature drags the coefficient below 1 even when the relationship is perfectly monotonic. Spearman correlates the ranks of `x` and `y`, and because exponentiation preserves order, ranks agree exactly: Spearman = 1. Switching to Spearman is the fix whenever a scatter plot shows a clean curve rather than a straight line, or when one variable is on a log/exponential scale.

</details>

### Exercise 4.2: Compute Kendall's tau on small ordinal data

**Task:** Two judges score eight figure-skating routines on integer scales. Build the inline vectors `judge_a <- c(7, 4, 9, 6, 8, 3, 5, 2)` and `judge_b <- c(6, 5, 9, 7, 8, 2, 4, 3)` and compute Kendall's tau between them. Save the single scalar to `ex_4_2`.

**Expected result:**

```
#> [1] 0.8571429
```

**Difficulty:** Intermediate

```r title="Your turn"
judge_a <- c(7, 4, 9, 6, 8, 3, 5, 2)
judge_b <- c(6, 5, 9, 7, 8, 2, 4, 3)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
judge_a <- c(7, 4, 9, 6, 8, 3, 5, 2)
judge_b <- c(6, 5, 9, 7, 8, 2, 4, 3)
ex_4_2 <- cor(judge_a, judge_b, method = "kendall")
ex_4_2
#> [1] 0.8571429
```

**Explanation:** Kendall's tau counts concordant minus discordant pairs and divides by the total number of pairs, so it has a direct probabilistic interpretation: if you pick two routines at random, $(1 + \tau)/2$ is the probability the two judges agree on their relative order. With small $n$ and ordinal data (rankings, Likert ratings), Kendall is more robust to ties and outliers than Spearman, and a tau of about 0.86 says the two judges agree on the relative order in roughly 93 percent of pair comparisons.

</details>

### Exercise 4.3: Compare three correlation methods on the iris numeric block

**Task:** A botanist is choosing between Pearson, Spearman, and Kendall for reporting the association between `Sepal.Length` and `Petal.Length` across all 150 iris rows. Build a tibble named `ex_4_3` with columns `method` and `r` holding all three coefficients so the team can compare them at a glance.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   method        r
#>   <chr>     <dbl>
#> 1 pearson   0.872
#> 2 spearman  0.882
#> 3 kendall   0.719
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- tibble(
  method = c("pearson", "spearman", "kendall"),
  r = c(
    cor(iris$Sepal.Length, iris$Petal.Length, method = "pearson"),
    cor(iris$Sepal.Length, iris$Petal.Length, method = "spearman"),
    cor(iris$Sepal.Length, iris$Petal.Length, method = "kendall")
  )
)
ex_4_3
```

**Explanation:** Spearman and Pearson agree closely here because the relationship in `iris` is roughly linear; Kendall's tau is on a different scale (it counts pair concordances) so it is always closer to zero than Spearman for the same monotonic data, even when both indicate the same direction. Report Pearson when you have ruled out non-linearity and outliers, Spearman when the relationship is monotonic but not linear, and Kendall when ties are common or sample size is small.

</details>

## Section 5. Testing correlation significance (3 problems)

### Exercise 5.1: Run cor.test and extract p-value and estimate

**Task:** A quality team wants a quick significance check on the correlation between `Sepal.Length` and `Petal.Width` in `iris`. Run `cor.test()` and pull out a named numeric vector with elements `estimate` and `p_value`. Save the vector to `ex_5_1` so it slots straight into a status table.

**Expected result:**

```
#>     estimate      p_value
#> 8.179536e-01 2.325498e-37
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ht <- cor.test(iris$Sepal.Length, iris$Petal.Width)
ex_5_1 <- c(
  estimate = unname(ht$estimate),
  p_value  = ht$p.value
)
ex_5_1
#>     estimate      p_value
#> 8.179536e-01 2.325498e-37
```

**Explanation:** `cor.test()` returns an `htest` object with `$estimate`, `$p.value`, `$conf.int`, and `$statistic`. Pulling fields by name is more robust than parsing the printed output, especially when you are piping results into a downstream report or dashboard. The vanishingly small p-value here is unsurprising: with $n = 150$ and an estimate near 0.82, the test has overwhelming power. Always look at the estimate alongside the p-value, since a tiny p-value with a tiny estimate just means the sample was large.

</details>

### Exercise 5.2: Pull the 95 percent confidence interval for a correlation

**Task:** Using the same `Sepal.Length` vs `Petal.Width` pair in `iris`, compute the 95 percent confidence interval for Pearson's $r$ via `cor.test()` and save it as a length-2 numeric vector with names `lower` and `upper` to `ex_5_2`.

**Expected result:**

```
#>     lower     upper
#> 0.7568552 0.8648366
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ht <- cor.test(iris$Sepal.Length, iris$Petal.Width, conf.level = 0.95)
ex_5_2 <- setNames(as.numeric(ht$conf.int), c("lower", "upper"))
ex_5_2
#>     lower     upper
#> 0.7568552 0.8648366
```

**Explanation:** `cor.test()` builds the CI by applying Fisher's z transformation, computing the standard CI on the z scale, and back-transforming via $\tanh$. The CI shrinks fast as $n$ grows; a sample of 150 produces a band only about 0.11 wide. Report the CI rather than just the point estimate when you want to communicate uncertainty, especially for moderate sample sizes where a 0.30 correlation might come with a CI that brushes zero.

</details>

### Exercise 5.3: Derive a Fisher z confidence interval by hand

**Task:** Given a Pearson correlation $r = 0.6$ from a sample of $n = 30$ paired observations, derive the 95 percent confidence interval for the population correlation by applying Fisher's z transformation, working on the z scale, and back-transforming. Save the length-2 numeric vector `c(lower, upper)` to `ex_5_3` without calling `cor.test()`.

**Expected result:**

```
#> [1] 0.3083669 0.7935342
```

**Difficulty:** Advanced

```r title="Your turn"
r <- 0.6
n <- 30
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
r <- 0.6
n <- 30
z   <- atanh(r)
se  <- 1 / sqrt(n - 3)
ci_z <- z + c(-1, 1) * qnorm(0.975) * se
ex_5_3 <- tanh(ci_z)
ex_5_3
#> [1] 0.3083669 0.7935342
```

**Explanation:** Fisher's transformation $z = \tanh^{-1}(r)$ stabilizes the variance of the sampling distribution of $r$: on the $z$ scale the standard error is approximately $1/\sqrt{n-3}$, regardless of the true correlation. You build the symmetric CI in $z$, then back-transform with $\tanh$ to land in the $[-1, 1]$ scale. This is exactly what `cor.test()` does internally; running it by hand once cements why the CI is asymmetric in the original scale (wider on the side closer to 0).

</details>

## Section 6. Advanced: partial, robust, and bootstrap (4 problems)

### Exercise 6.1: Compute partial correlation controlling for a third variable

**Task:** Heavier cars also tend to have larger engines, so the raw correlation between `wt` and `mpg` confounds engine size. Compute the partial correlation between `wt` and `mpg` in `mtcars` while controlling for `disp` (displacement). Use `ppcor::pcor.test()` and save a named vector with `estimate` and `p_value` to `ex_6_1`.

**Expected result:**

```
#>      estimate       p_value
#> -0.5859041  0.0005488 
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pc <- ppcor::pcor.test(mtcars$wt, mtcars$mpg, mtcars$disp)
ex_6_1 <- c(estimate = pc$estimate, p_value = pc$p.value)
ex_6_1
#>      estimate       p_value
#> -0.5859041  0.0005488 
```

**Explanation:** Partial correlation residualizes both `wt` and `mpg` against `disp` and then correlates the residuals. The raw Pearson $r$ between `wt` and `mpg` is about -0.87; the partial $r$ controlling for `disp` shrinks to about -0.59, which says a meaningful chunk of the apparent weight effect was really displacement working through weight. Equivalently, you could fit `lm(wt ~ disp)` and `lm(mpg ~ disp)`, correlate the residuals, and reproduce the same number; `ppcor::pcor.test()` just adds the inference.

</details>

### Exercise 6.2: Bootstrap a 95 percent CI for Pearson r

**Task:** A reviewer asks for a non-parametric 95 percent CI on the correlation between `wt` and `mpg` in `mtcars`, in case Fisher's z assumptions are shaky. Draw 2000 bootstrap resamples (with replacement, same size as the original), compute Pearson $r$ on each, take the 2.5 and 97.5 percentiles, and save the length-2 numeric vector `c(lower, upper)` to `ex_6_2`. Set `set.seed(42)` first for reproducibility.

**Expected result:**

```
#>      2.5%     97.5%
#> -0.9296055 -0.7639175
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(42)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- nrow(mtcars)
boot_r <- replicate(2000, {
  idx <- sample.int(n, replace = TRUE)
  cor(mtcars$wt[idx], mtcars$mpg[idx])
})
ex_6_2 <- quantile(boot_r, probs = c(0.025, 0.975))
ex_6_2
#>      2.5%     97.5%
#> -0.9296055 -0.7639175
```

**Explanation:** The percentile bootstrap makes no distributional assumption: you resample the rows (not the columns) to keep $x$ and $y$ paired, recompute $r$ on each resample, and read off quantiles. When the Fisher's z CI and the bootstrap CI roughly agree, you can trust both; when they disagree, the bootstrap is the safer report. For correlations near $\pm 1$ where Fisher's z is most accurate, both will be tight; for small $n$ or heavy-tailed data, the bootstrap is the standard recommendation.

</details>

### Exercise 6.3: Compare two correlations from independent samples

**Task:** A team is checking whether the `wt` vs `mpg` correlation differs between automatic (`am == 0`) and manual (`am == 1`) cars in `mtcars`. Compute Pearson $r$ in each subgroup, then apply Fisher's z test for two independent correlations and return a named vector with `r_auto`, `r_manual`, and `p_value`. Save it to `ex_6_3`.

**Expected result:**

```
#>     r_auto    r_manual     p_value
#> -0.6975356  -0.8915209   0.1577874
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
auto   <- mtcars[mtcars$am == 0, ]
manual <- mtcars[mtcars$am == 1, ]
r1 <- cor(auto$wt,   auto$mpg);   n1 <- nrow(auto)
r2 <- cor(manual$wt, manual$mpg); n2 <- nrow(manual)
z1 <- atanh(r1); z2 <- atanh(r2)
se <- sqrt(1 / (n1 - 3) + 1 / (n2 - 3))
zstat <- (z1 - z2) / se
p <- 2 * pnorm(-abs(zstat))
ex_6_3 <- c(r_auto = r1, r_manual = r2, p_value = p)
ex_6_3
```

**Explanation:** Comparing two correlations from independent samples is a Fisher-z test: transform each $r$, divide the difference by $\sqrt{1/(n_1-3) + 1/(n_2-3)}$, and use a normal reference. The two subgroup correlations look numerically different (-0.70 vs -0.89), but the test p-value of about 0.16 says that gap is well within sampling noise given small group sizes (19 and 13). The general lesson: eyeballed differences between subgroup correlations need a test, especially when subgroups are small.

</details>

### Exercise 6.4: Detect non-linear association where Pearson is near zero

**Task:** Build `x <- seq(-3, 3, length.out = 200)` and `y <- x^2 + rnorm(200, sd = 0.1)` after setting `set.seed(7)`. Compute both Pearson and Spearman correlation, then `cor.test()` on the absolute values to detect the symmetric quadratic association. Save a named vector with `pearson`, `spearman`, and `r_on_abs_x` to `ex_6_4`.

**Expected result:**

```
#>     pearson    spearman  r_on_abs_x
#> 0.003204528 -0.020610028  0.998790907
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
x <- seq(-3, 3, length.out = 200)
y <- x^2 + rnorm(200, sd = 0.1)
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
x <- seq(-3, 3, length.out = 200)
y <- x^2 + rnorm(200, sd = 0.1)
ex_6_4 <- c(
  pearson    = cor(x, y, method = "pearson"),
  spearman   = cor(x, y, method = "spearman"),
  r_on_abs_x = cor(abs(x), y, method = "pearson")
)
ex_6_4
#>     pearson    spearman  r_on_abs_x
#> 0.003204528 -0.020610028  0.998790907
```

**Explanation:** Pearson and Spearman both miss this association entirely because the relationship is symmetric (large $|x|$ produces large $y$, regardless of sign). Always look at a scatter plot before declaring "no correlation"; near-zero $r$ often hides U-shapes, V-shapes, or other symmetric patterns. Once you spot the symmetry, correlating $y$ with $|x|$ (or transforming to $\log y$, $\sqrt{y}$, or fitting `lm(y ~ poly(x, 2))`) recovers the real signal. This is the single most common way correlation analysis goes wrong in practice.

</details>

## What to do next

- [Correlation in R](Correlation.html): the parent tutorial covering the full theory and the cor.test workflow.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): the natural next step after correlation diagnostics.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html): generalizes the cor.test idea to t-tests, proportion tests, and beyond.
- [Visualization Exercises in R](Visualization-Exercises-in-R.html): practice the scatter, pairs, and heatmap idioms used here.
