---
title: "Multivariate Normal Distribution in R: MASS::mvrnorm, Simulation & Plots"
slug: "Multivariate-Normal-Distribution-in-R"
description: "Simulate multivariate normal data in R with MASS::mvrnorm. Build covariance matrices, visualize bivariate contours & ellipses, check empirical moments."
keywords: "multivariate normal distribution R, MASS mvrnorm, simulate multivariate normal, covariance matrix R, bivariate normal R, mvrnorm example, multivariate simulation, dmvnorm"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-17"
curriculum_id: "FR-prob-5"
post_type: "FR"
fr_parent: "Normal-t-F-and-Chi-Squared-Distributions-in-R.html"
auto_link_terms: "multivariate normal distribution|bivariate normal distribution|MASS::mvrnorm|mvrnorm()|simulate multivariate normal|covariance matrix in R"
auto_link_case_sensitive: true
---

# Multivariate Normal Distribution in R: MASS::mvrnorm, Simulation & Plots

<p class="lead">The multivariate normal distribution generalises the familiar bell curve to two or more correlated variables at once. In R you simulate from it with <code>MASS::mvrnorm(n, mu, Sigma)</code>, supply a mean vector plus a covariance matrix and you get a matrix of correlated draws in a single line. This post walks through simulating, visualizing, and sanity-checking multivariate normal data, plus the covariance-matrix anatomy that makes everything click.</p>

## How do you simulate multivariate normal data with mvrnorm()?

The fastest way to feel the multivariate normal is to draw a handful of samples and see them lined up side by side. Pick a mean vector `mu`, pick a covariance matrix `Sigma`, and `mvrnorm()` returns a matrix where every row is one correlated observation. Everything else in this tutorial, plots, checks, higher dimensions, builds on this one call.

Let's simulate five draws from a two-dimensional normal with means at zero and a strong positive correlation of 0.7.

```r
# Load MASS and simulate 5 correlated (X1, X2) draws
library(MASS)
set.seed(42)

mu <- c(0, 0)
Sigma <- matrix(c(1.0, 0.7,
                  0.7, 1.0), nrow = 2)

sim5 <- mvrnorm(n = 5, mu = mu, Sigma = Sigma)
sim5
#>             [,1]       [,2]
#> [1,]  1.37095845  1.4898557
#> [2,] -0.56469817 -0.2357334
#> [3,]  0.36312841  1.0691417
#> [4,]  0.63286260  1.1232453
#> [5,]  0.40426832  1.0290827
```

Each row is one observation of the pair $(X_1, X_2)$. Notice how rows where `X1` is positive also tend to have a positive `X2`, that's the 0.7 correlation showing up in just five samples. The diagonal of `Sigma` sets each variable's variance to 1, and the off-diagonal sets their covariance.

Five rows is a taste. For real work you want hundreds or thousands of draws so the sample moments stabilise.

```r
# Simulate 500 draws and inspect the shape
sim <- mvrnorm(n = 500, mu = mu, Sigma = Sigma)
dim(sim)
#> [1] 500   2

head(sim, 3)
#>             [,1]       [,2]
#> [1,] -2.7334779 -2.1580570
#> [2,]  0.1160956  0.2514368
#> [3,]  1.1179754  1.6063953
```

The output is always a matrix with `n` rows and `length(mu)` columns. One row, one observation, that convention carries through to every visualisation and summary in R.

[TIP]
**Give your columns names right away.** `colnames(sim) <- c("X1", "X2")` makes every downstream call, `head()`, `ggplot()`, `cor()`, print meaningful labels instead of `[,1]` and `[,2]`.

**Try it:** Simulate 3 draws with mean vector `c(5, 10)` and a covariance matrix whose diagonal is 1 and off-diagonals are `-0.5`. The two columns should trend in opposite directions.

```r
# Try it: flip the correlation sign
ex_mu <- c(5, 10)
ex_Sigma <- matrix(c(1, -0.5,
                     -0.5, 1), 2)

# your code here — call mvrnorm and print the result
ex_sim <- NULL

ex_sim
#> Expected: 3 rows, 2 columns; columns move in opposite directions
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(7)
ex_sim <- mvrnorm(3, ex_mu, ex_Sigma)
ex_sim
#>          [,1]      [,2]
#> [1,] 7.061467  9.321527
#> [2,] 4.233519 11.028812
#> [3,] 4.706847 10.458461
```

**Explanation:** A negative off-diagonal forces `X1` and `X2` apart, when one is above its mean, the other tends below.

</details>

## What does the covariance matrix actually control?

The covariance matrix `Sigma` is where the whole shape of a multivariate normal lives. Read it like this: the **diagonal** entries are the variances of each variable, and the **off-diagonal** entries are the covariances between them. Because covariance is symmetric, `Sigma` is always symmetric, the value at row 1, column 2 equals the value at row 2, column 1.

![Covariance-matrix anatomy](screenshots/Multivariate-Normal-Distribution-in-R-covariance-anatomy.webp)
*Figure 1: Covariance-matrix anatomy, diagonal entries hold variances, off-diagonal entries hold the shared covariance, and the matrix is symmetric.*

Covariance and correlation are close cousins. If $\sigma_i$ is the standard deviation of variable $i$ and $\rho_{ij}$ is its correlation with variable $j$, then:

$$\Sigma_{ij} = \rho_{ij}\,\sigma_i\,\sigma_j$$

Where:

- $\Sigma_{ij}$, the covariance between variables $i$ and $j$ (the matrix entry)
- $\rho_{ij}$, the correlation between the two variables, between -1 and 1
- $\sigma_i, \sigma_j$, the standard deviations of each variable

That formula lets you design `Sigma` from quantities you can actually reason about, spreads and correlations, instead of covariances that mix the two.

```r
# Build Sigma from standard deviations and a correlation
sds  <- c(2, 3)          # sd of X1 and X2
rho  <- 0.6              # correlation between them

Sigma2 <- diag(sds) %*% matrix(c(1, rho,
                                 rho, 1), 2) %*% diag(sds)
Sigma2
#>      [,1] [,2]
#> [1,]  4.0  3.6
#> [2,]  3.6  9.0

# Recover the correlation to verify
cov2cor(Sigma2)
#>      [,1] [,2]
#> [1,]  1.0  0.6
#> [2,]  0.6  1.0
```

Reading `Sigma2` left-to-right: variable 1 has variance 4 (sd = 2), variable 2 has variance 9 (sd = 3), and the covariance is `0.6 * 2 * 3 = 3.6`. `cov2cor()` divides the off-diagonal by the product of standard deviations and returns the original correlation, a handy sanity check whenever you're handed a covariance matrix and want to see the underlying correlations.

`mvrnorm()` requires `Sigma` to be **positive semi-definite**, every eigenvalue non-negative. Intuitively this rules out impossible correlations like 0.9 between A and B, 0.9 between B and C, and -0.9 between A and C.

```r
# Positive-definite check: all eigenvalues should be > 0
eigen(Sigma2)$values
#> [1] 10.744563  2.255437
```

Both eigenvalues are positive, so `Sigma2` defines a valid multivariate normal.

[WARNING]
**A non-PSD Sigma breaks mvrnorm().** You'll get an error like *"'Sigma' is not positive definite"*. Check with `eigen(Sigma)$values`, any negative value means your correlation structure is internally inconsistent.

**Try it:** Build a Sigma for variables with variances 4 and 9 and correlation -0.5. Then verify with `cov2cor()`.

```r
# Try it: negative correlation, unequal variances
ex_sds <- c(sqrt(4), sqrt(9))
ex_rho <- -0.5

# your code here — construct ex_Sigma2, then call cov2cor()
ex_Sigma2 <- NULL

cov2cor(ex_Sigma2)
#> Expected: 1.0 on diagonal, -0.5 off-diagonal
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_Sigma2 <- diag(ex_sds) %*% matrix(c(1, ex_rho,
                                       ex_rho, 1), 2) %*% diag(ex_sds)
ex_Sigma2
#>      [,1] [,2]
#> [1,]  4.0 -3.0
#> [2,] -3.0  9.0

cov2cor(ex_Sigma2)
#>      [,1] [,2]
#> [1,]  1.0 -0.5
#> [2,] -0.5  1.0
```

**Explanation:** The outer `diag(sds)` calls rescale a correlation matrix into a covariance matrix, preserving the sign.

</details>

## How do you visualize a bivariate normal distribution?

A scatter plot alone is a fine start, but two extras make the shape pop: **density contours** (lines of equal probability density, like elevation lines on a topographic map) and **confidence ellipses** (regions that contain a chosen fraction of the distribution).

Let's bring the 500-row `sim` from earlier into a data frame and layer all three.

```r
# Scatter + 2-D density contours
library(ggplot2)

df <- as.data.frame(sim)
colnames(df) <- c("x", "y")

ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.3, color = "steelblue") +
  geom_density_2d(color = "firebrick") +
  coord_equal() +
  labs(title = "Bivariate normal: rho = 0.7",
       x = "X1", y = "X2") +
  theme_minimal()
```

`geom_density_2d()` estimates the joint density from the points and draws contour lines. The contours of a bivariate normal are ellipses tilted along the direction of correlation, here, a positive slope because `rho = 0.7`.

The 95% confidence ellipse is the most common visual summary. `stat_ellipse()` draws it directly from the data, assuming a normal distribution.

```r
# Add 95% and 68% confidence ellipses
ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.3, color = "steelblue") +
  stat_ellipse(level = 0.95, color = "firebrick",    linewidth = 1) +
  stat_ellipse(level = 0.68, color = "darkorange",   linewidth = 1, linetype = 2) +
  coord_equal() +
  labs(title = "Confidence ellipses: 68% and 95%",
       x = "X1", y = "X2") +
  theme_minimal()
```

Roughly 95% of the draws should sit inside the solid red ellipse and 68% inside the dashed orange one, the bivariate analogues of the familiar one- and two-sigma bands on a single variable.

[KEY INSIGHT]
**The tilt of the ellipse is the off-diagonal of Sigma in disguise.** A positive covariance tilts the axes up-right, a negative one tilts them down-right, and zero gives axis-aligned ellipses. Change the off-diagonal and the picture rotates.

**Try it:** Swap the ellipse level to a single `stat_ellipse(level = 0.50)`, the region that contains half of the distribution.

```r
# Try it: 50% ellipse
# your code here — start from the base ggplot and add one stat_ellipse

ex_plot <- ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.3, color = "steelblue") +
  coord_equal() +
  theme_minimal()

ex_plot
#> Expected: a single ellipse enclosing roughly half the points
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_plot <- ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.3, color = "steelblue") +
  stat_ellipse(level = 0.5, color = "darkgreen", linewidth = 1) +
  coord_equal() +
  theme_minimal()
ex_plot
```

**Explanation:** `stat_ellipse()` accepts any `level` between 0 and 1; 0.5 gives the median ellipse, half of the probability mass lives inside.

</details>

## How do you verify simulated data matches the specification?

Simulations are easy to trust and easy to get wrong, so always check that the draws actually match the inputs. Three summaries cover it: sample mean (should approach `mu`), sample covariance (should approach `Sigma`), and sample correlation (should approach `cov2cor(Sigma)`).

```r
# Sample moments vs. population inputs
round(colMeans(sim), 2)
#> [1] 0.05 0.03

round(var(sim), 2)
#>      [,1] [,2]
#> [1,] 0.97 0.67
#> [2,] 0.67 1.03

round(cor(sim), 2)
#>      [,1] [,2]
#> [1,] 1.00 0.67
#> [2,] 0.67 1.00
```

With 500 draws the sample means land near 0, the sample variances near 1, and the sample correlation near 0.67, close to the true 0.7 but not exact. That gap is sampling noise; draw 50,000 samples and it will shrink.

When you want an exact match for teaching or reproducible demos, pass `empirical = TRUE`.

```r
# empirical = TRUE makes sample moments exactly equal the inputs
sim_emp <- mvrnorm(n = 500, mu = mu, Sigma = Sigma, empirical = TRUE)

round(colMeans(sim_emp), 6)
#> [1] 0 0

round(cor(sim_emp), 6)
#>      [,1] [,2]
#> [1,]  1.0  0.7
#> [2,]  0.7  1.0
```

The sample mean is exactly zero and the sample correlation is exactly 0.7. `mvrnorm()` rescaled and recentered the draws so their sample moments hit the specification on the nose.

[NOTE]
**`empirical = TRUE` gives you a reproducible demo, not a true random sample.** The rescaled draws no longer have the sampling variability a real sample would. Use it when you want textbook-clean plots or deterministic tests; leave it off for anything downstream that relies on genuine randomness (bootstrap, power simulation, MCMC).

**Try it:** Simulate 50 draws from the same `mu` and `Sigma` **without** `empirical = TRUE` and print the sample correlation. How close is it to 0.7?

```r
# Try it: small-sample noise
# your code here — simulate 50 draws and print cor()

ex_small <- NULL

cor(ex_small)
#> Expected: a 2x2 matrix with off-diagonal near — but not equal to — 0.7
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(123)
ex_small <- mvrnorm(50, mu, Sigma)
round(cor(ex_small), 2)
#>      [,1] [,2]
#> [1,] 1.00 0.77
#> [2,] 0.77 1.00
```

**Explanation:** With only 50 draws the sample correlation wanders several hundredths away from the true 0.7. This is exactly the scenario `empirical = TRUE` short-circuits.

</details>

## How do you scale mvrnorm() to higher dimensions?

The API stays the same for any number of variables: give `mvrnorm()` a k-length mean vector and a k-by-k covariance matrix. Only your Sigma bookkeeping gets more involved.

![mvrnorm simulation workflow](screenshots/Multivariate-Normal-Distribution-in-R-simulation-workflow.webp)
*Figure 2: The mvrnorm() workflow, build mu and Sigma, draw samples, then check moments and visualize.*

Suppose you want to simulate three test scores (math, reading, writing) with means 60, 70, 75, standard deviations 10, 8, 9, and a moderate correlation structure.

```r
# Three correlated variables
set.seed(2026)

mu3 <- c(math = 60, reading = 70, writing = 75)
sds3 <- c(10, 8, 9)
cor3 <- matrix(c(1.0, 0.5, 0.4,
                 0.5, 1.0, 0.6,
                 0.4, 0.6, 1.0), nrow = 3)

Sigma3 <- diag(sds3) %*% cor3 %*% diag(sds3)

sim3 <- mvrnorm(n = 500, mu = mu3, Sigma = Sigma3)
head(sim3, 3)
#>          math  reading  writing
#> [1,] 52.18021 63.39116 69.82014
#> [2,] 73.52844 77.49103 84.31255
#> [3,] 67.11472 70.02233 78.45109
```

Column names flow through from `mu3` because we gave it a named vector, a small touch that pays off every time you print or plot the matrix.

`pairs()` is the quickest way to eyeball a three- or four-variable simulation. It draws a grid of scatter plots, one per pair.

```r
# Scatter grid for all variable pairs
pairs(sim3,
      pch = 19,
      col = adjustcolor("steelblue", alpha.f = 0.3),
      main = "Simulated test scores")

# Recover the sample correlation structure
round(cor(sim3), 2)
#>           math reading writing
#> math      1.00    0.52    0.39
#> reading   0.52    1.00    0.60
#> writing   0.39    0.60    1.00
```

The off-diagonal entries of `cor(sim3)` land close to the 0.5 / 0.4 / 0.6 you specified, the k-variable case works exactly like the 2-D case, just with more bookkeeping for `Sigma`.

**Try it:** Extend to four variables, add a "science" score with mean 65, sd 11, and correlations 0.3, 0.55, 0.5 with math, reading, writing (in that order). Simulate 200 draws and run `pairs()`.

```r
# Try it: 4-D simulation
ex_mu4  <- c(60, 70, 75, 65)
ex_sds4 <- c(10, 8, 9, 11)
ex_cor4 <- matrix(c(1.00, 0.50, 0.40, 0.30,
                    0.50, 1.00, 0.60, 0.55,
                    0.40, 0.60, 1.00, 0.50,
                    0.30, 0.55, 0.50, 1.00), nrow = 4)

# your code here — build ex_Sigma4 and ex_sim4
ex_Sigma4 <- NULL
ex_sim4   <- NULL

pairs(ex_sim4, pch = 19, col = adjustcolor("steelblue", 0.3))
#> Expected: 4x4 grid of scatter plots
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_Sigma4 <- diag(ex_sds4) %*% ex_cor4 %*% diag(ex_sds4)
set.seed(55)
ex_sim4 <- mvrnorm(200, ex_mu4, ex_Sigma4)
pairs(ex_sim4, pch = 19, col = adjustcolor("steelblue", 0.3))
round(cor(ex_sim4), 2)
#>      [,1] [,2] [,3] [,4]
#> [1,] 1.00 0.47 0.41 0.28
#> [2,] 0.47 1.00 0.58 0.56
#> [3,] 0.41 0.58 1.00 0.49
#> [4,] 0.28 0.56 0.49 1.00
```

**Explanation:** The exact same build pattern, `diag(sds) %*% cor %*% diag(sds)`, scales to any dimension. `pairs()` handles the visualisation.

</details>

## Practice Exercises

### Exercise 1: Correlated test scores with a ggplot summary

Simulate 300 students with mean math score 75 and reading score 65, variance 100 for each, and correlation 0.5. Put the result in a data frame with columns `math` and `reading`, then make a `ggplot` scatter with 95% and 68% confidence ellipses. Compute and print the sample correlation.

```r
# Exercise 1: correlated scores + ellipses
# Hint: build Sigma from sqrt(100) = 10 on each axis

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(1)
my_mu    <- c(math = 75, reading = 65)
my_Sigma <- diag(c(10, 10)) %*% matrix(c(1, 0.5,
                                         0.5, 1), 2) %*% diag(c(10, 10))

my_scores <- mvrnorm(300, my_mu, my_Sigma)
my_df     <- as.data.frame(my_scores)

round(cor(my_scores), 2)
#>         math reading
#> math    1.00    0.50
#> reading 0.50    1.00

ggplot(my_df, aes(math, reading)) +
  geom_point(alpha = 0.4, color = "steelblue") +
  stat_ellipse(level = 0.95, color = "firebrick",  linewidth = 1) +
  stat_ellipse(level = 0.68, color = "darkorange", linewidth = 1, linetype = 2) +
  coord_equal() +
  theme_minimal()
```

**Explanation:** Variance 100 means sd = 10 for both scores. The 0.5 correlation shows as a visible tilt in the scatter and a tilted pair of ellipses.

</details>

### Exercise 2: Negative correlation and the sign of the ellipse

Simulate 200 draws with means `c(10, 20)`, variances `c(4, 9)`, and correlation `-0.6`. Print the sample correlation and plot a 90% ellipse. In one line, explain why the ellipse tilts the opposite way from Exercise 1.

```r
# Exercise 2: negative-correlation ellipse
# Hint: reuse the diag() %*% cor %*% diag() pattern with rho = -0.6

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2)
my_mu2    <- c(10, 20)
my_sds2   <- c(sqrt(4), sqrt(9))
my_Sigma2 <- diag(my_sds2) %*% matrix(c(1, -0.6,
                                        -0.6, 1), 2) %*% diag(my_sds2)

my_neg <- mvrnorm(200, my_mu2, my_Sigma2)
round(cor(my_neg), 2)
#>       [,1]  [,2]
#> [1,]  1.00 -0.61
#> [2,] -0.61  1.00

my_neg_df <- as.data.frame(my_neg)
colnames(my_neg_df) <- c("x", "y")

ggplot(my_neg_df, aes(x, y)) +
  geom_point(alpha = 0.4, color = "steelblue") +
  stat_ellipse(level = 0.90, color = "firebrick", linewidth = 1) +
  theme_minimal()
```

**Explanation:** Positive covariance tilts the ellipse up-right (both variables move together); negative covariance tilts it down-right (one goes up as the other goes down).

</details>

## Complete Example: Correlated Exam Scores End-to-End

Tying every step together: you're simulating 400 students' math, reading, and writing scores with realistic correlations for a teaching demo. You want sample moments that match the specification, a pairs plot for the visual, and a sanity-check summary of each score.

```r
# End-to-end: simulate, verify, visualize
set.seed(99)

# 1. Spec
score_mu    <- c(math = 62, reading = 71, writing = 74)
score_sds   <- c(9, 8, 10)
score_cor   <- matrix(c(1.0, 0.55, 0.45,
                        0.55, 1.0, 0.65,
                        0.45, 0.65, 1.0), nrow = 3)
score_Sigma <- diag(score_sds) %*% score_cor %*% diag(score_sds)

# 2. Simulate
scores <- mvrnorm(n = 400, mu = score_mu, Sigma = score_Sigma)

# 3. Verify
round(colMeans(scores), 1)
#>    math reading writing
#>    61.8    71.3    73.7

round(cor(scores), 2)
#>          math reading writing
#> math     1.00    0.54    0.43
#> reading  0.54    1.00    0.64
#> writing  0.43    0.64    1.00

# 4. Visualize
pairs(scores,
      pch = 19,
      col = adjustcolor("steelblue", alpha.f = 0.3),
      main = "Simulated student scores (n = 400)")

# 5. Quick summary per subject
apply(scores, 2, summary)
#>             math  reading  writing
#> Min.     32.4320  45.5810  40.1050
#> 1st Qu.  55.8120  66.4360  66.9240
#> Median   61.9750  71.4670  73.5800
#> Mean     61.8260  71.3120  73.7370
#> 3rd Qu.  67.9610  76.8330  80.6400
#> Max.     90.0040  94.3330 104.8950
```

Every sample statistic lands within sampling noise of the spec: means within a point of 62, 71, 74 and correlations within two hundredths of 0.55 / 0.45 / 0.65. That combination, design Sigma, simulate, verify, visualise, is the full workflow you'll reuse whenever you need realistic synthetic data for testing, teaching, or power analysis.

## Summary

| Step | Function | What it does |
|---|---|---|
| Define the center | `c()` | the mean vector `mu` |
| Define the spread | `matrix()` or `diag(sds) %*% cor %*% diag(sds)` | the covariance matrix `Sigma` |
| Draw samples | `MASS::mvrnorm(n, mu, Sigma)` | returns `n` by `length(mu)` matrix of draws |
| Check the specification | `colMeans()`, `var()`, `cor()` | sample moments should match `mu` and `Sigma` |
| Lock moments exactly | `mvrnorm(..., empirical = TRUE)` | sample moments equal inputs (teaching mode) |
| Visualize (2-D) | `geom_density_2d()`, `stat_ellipse()` | density contours and confidence ellipses |
| Visualize (k-D) | `pairs()` | scatter grid across every variable pair |

## References

1. Venables, W. N. & Ripley, B. D., *Modern Applied Statistics with S*, 4th ed. Springer (2002). [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
2. MASS package, `mvrnorm()` reference page, R-project documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/mvrnorm.html)
3. Genz, A. & Bretz, F., *Computation of Multivariate Normal and t Probabilities*. Lecture Notes in Statistics, Springer (2009). [Link](https://link.springer.com/book/10.1007/978-3-642-01689-9)
4. `mvtnorm` package, *Multivariate Normal and t Distributions*, CRAN. [Link](https://cran.r-project.org/web/packages/mvtnorm/mvtnorm.pdf)
5. Wasserman, L., *All of Statistics: A Concise Course in Statistical Inference*. Springer (2004). Chapter 2: Random Variables.
6. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd ed. [Link](https://ggplot2-book.org/)

## Continue Learning

- [Normal, t, F & Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html), the univariate foundations this post builds on.
- [Correlation Analysis in R](Correlation-Analysis-in-R.html), compute, interpret, and test correlations between variables.
- [Sampling Distributions in R](Sampling-Distributions-in-R.html), how simulated means and variances behave across repeated samples.
