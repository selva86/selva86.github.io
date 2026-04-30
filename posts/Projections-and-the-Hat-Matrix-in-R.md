---
title: "Projections & the Hat Matrix in R: OLS Geometry Explained Visually"
slug: Projections-and-the-Hat-Matrix-in-R
description: "Learn the hat matrix and OLS projection in R. Compute H from scratch, verify idempotency, and see fitted values, residuals, and leverage geometrically."
keywords: hat matrix, projection matrix, OLS, ordinary least squares, leverage, idempotent matrix, R linear regression, fitted values, residuals, column space
auto_link_terms: hat matrix|projection matrix|OLS projection|leverage values|residual maker matrix|column space of X|orthogonal projection
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: "2.9.5"
post_type: C
sidebar_section: Statistics
sidebar_title: Projections & the Hat Matrix
sidebar_order: 100
difficulty: Advanced
---

# Projections & the Hat Matrix in R: OLS Geometry Explained Visually

<p class="lead">In ordinary least-squares regression, the <strong>hat matrix</strong> $H = X(X^\top X)^{-1} X^\top$ is the projection matrix that turns observed responses $y$ into fitted values $\hat{y} = Hy$. Geometrically, $H$ projects $y$ orthogonally onto the column space of the design matrix $X$. Fitted values are the closest point in that subspace, residuals are perpendicular to it, and every common diagnostic (leverage, Cook's distance, residual degrees of freedom) flows from the geometry of that projection.</p>

## How does OLS become a geometric projection?

Linear regression has two faces. Algebraically, OLS minimises the sum of squared residuals. Geometrically, it projects your response vector onto the subspace spanned by your predictors, and the **hat matrix** is the operator that performs that projection. Let's build it for `mtcars` and confirm it produces the same fitted values as `lm()`. We will use base R only, so the numerical recipe stays transparent.

The recipe has three steps. First, assemble the design matrix $X$ (intercept column plus one column per predictor). Second, compute $H = X(X^\top X)^{-1} X^\top$. Third, multiply: $\hat{y} = Hy$.

```r title="Build H and recover fitted values"
y <- mtcars$mpg
X <- cbind(Intercept = 1, wt = mtcars$wt, hp = mtcars$hp)
H <- X %*% solve(t(X) %*% X) %*% t(X)
y_hat <- H %*% y

model <- lm(mpg ~ wt + hp, data = mtcars)

head(y_hat, 5)
#>                       [,1]
#> Mazda RX4         23.57233
#> Mazda RX4 Wag     22.58348
#> Datsun 710        25.27582
#> Hornet 4 Drive    21.26502
#> Hornet Sportabout 18.32727

all.equal(as.vector(y_hat), unname(fitted(model)))
#> [1] TRUE
```

The 32-by-32 hat matrix consumed `mpg` and produced the exact same fitted values as the textbook function `lm()`. The all-equal check confirms equality at numerical precision. We never wrote a single `solve()` for $\beta$, the projection formulation skipped coefficients entirely and went straight to predictions.

[KEY INSIGHT]
**The hat matrix replaces algebra with geometry.** Instead of solving the normal equations for $\beta$ and then multiplying $X\beta$, you can think of OLS as a single geometric act: project $y$ onto $\text{col}(X)$. The matrix that performs that projection *is* the hat matrix.

**Try it:** Build the hat matrix for the simpler model `mpg ~ wt` (one predictor only) and check that the first three fitted values match `lm(mpg ~ wt, data = mtcars)`. Use distinct names so we don't overwrite `H`.

```r title="Your turn: H for mpg ~ wt"
ex_X1 <- cbind(1, mtcars$wt)
# your code here: build ex_H1 and ex_yhat1
ex_H1 <- # ...
ex_yhat1 <- # ...

# Test:
head(ex_yhat1, 3)
#> Expected: 23.28 21.92 24.89 (approximately)
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-predictor hat matrix solution"
ex_X1 <- cbind(1, mtcars$wt)
ex_H1 <- ex_X1 %*% solve(t(ex_X1) %*% ex_X1) %*% t(ex_X1)
ex_yhat1 <- ex_H1 %*% mtcars$mpg

head(ex_yhat1, 3)
#>                  [,1]
#> Mazda RX4     23.28261
#> Mazda RX4 Wag 21.91977
#> Datsun 710    24.88595

all.equal(as.vector(ex_yhat1), unname(fitted(lm(mpg ~ wt, data = mtcars))))
#> [1] TRUE
```

**Explanation:** The recipe is identical, only $X$ shrinks to two columns. The projection still works.

</details>

## What properties make the hat matrix special?

Three algebraic facts about $H$ do all the heavy lifting in regression theory.

1. **Symmetric.** $H^\top = H$. The projection looks the same from either side.
2. **Idempotent.** $H \cdot H = H$. Once you have projected onto $\text{col}(X)$, projecting again does nothing because you are already there.
3. **Trace equals $p$.** $\text{tr}(H) = p$, the number of columns of $X$ (predictors + intercept). The trace counts the dimension of the subspace you project onto.

These three properties are the algebraic fingerprint of a projection operator. Let's verify all three on the matrix we just built.

```r title="Verify H is symmetric, idempotent, trace = p"
is_sym <- all.equal(H, t(H))
H_sq   <- H %*% H
is_idem <- all.equal(H_sq, H)
tr_H   <- sum(diag(H))

list(symmetric = is_sym, idempotent = is_idem, trace = tr_H, ncol_X = ncol(X))
#> $symmetric
#> [1] TRUE
#>
#> $idempotent
#> [1] TRUE
#>
#> $trace
#> [1] 3
#>
#> $ncol_X
#> [1] 3
```

All three checks pass. Symmetry and idempotency hold to machine precision. The trace equals 3 because $X$ has 3 columns (intercept, `wt`, `hp`). That number, 3, is the **effective dimension of the fitted-value space**, and it shows up everywhere: in the residual degrees of freedom, in adjusted $R^2$, in AIC.

[NOTE]
**Idempotency is the geometric statement that you cannot project past the subspace.** Pick any vector $v$, hit it with $H$, and you land in $\text{col}(X)$. Hit it with $H$ again, and you do not move, you are already there. Algebraically, $H(Hv) = H^2 v = Hv$.

**Try it:** A symmetric idempotent matrix has eigenvalues that are exactly 0 or 1, and the count of 1s equals the rank of the projection. Compute the eigenvalues of `H` and count how many are essentially 1.

```r title="Your turn: count eigenvalues equal to one"
ex_eig <- # eigen(H)$values
# count how many are within 1e-8 of 1

#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Eigenvalue count solution"
ex_eig <- eigen(H)$values
sum(abs(ex_eig - 1) < 1e-8)
#> [1] 3
```

**Explanation:** A rank-$p$ orthogonal projection has $p$ eigenvalues equal to 1 (directions inside $\text{col}(X)$) and $n-p$ eigenvalues equal to 0 (directions in the orthogonal complement). Here $p = 3$, so three eigenvalues are 1 and twenty-nine are 0.

</details>

## How does the geometry of projection look in 2D?

The 32-dimensional projection above is hard to picture. The smallest case that still shows the geometry is a single response vector $y$ in $\mathbb{R}^2$ projected onto a one-dimensional subspace (one predictor through the origin). That fits on a piece of paper, so let's draw it.

We will pick a tilted direction for the column space, place a $y$ vector that is *not* on that line, and watch the hat matrix push $y$ onto the line. The residual will jump out as a perpendicular segment.

```r title="Visualise projection of y onto col(X) in 2D"
library(ggplot2)

geom_X    <- matrix(c(1, 0.4), ncol = 1)   # one predictor, 1-D column space
geom_H    <- geom_X %*% solve(t(geom_X) %*% geom_X) %*% t(geom_X)
geom_y    <- c(2, 3.5)
geom_yhat <- as.vector(geom_H %*% geom_y)
geom_e    <- geom_y - geom_yhat

geom_yhat
#> [1] 2.9310 1.1724
geom_e
#> [1] -0.9310  2.3276
sum(geom_yhat * geom_e)
#> [1] -1.110223e-16

t_line <- seq(-1, 5, by = 0.1)
line_df <- data.frame(x = t_line * geom_X[1], y = t_line * geom_X[2])

proj_plot <- ggplot() +
  geom_line(data = line_df, aes(x, y), colour = "grey50", linewidth = 0.6) +
  geom_segment(aes(x = 0, y = 0, xend = geom_y[1], yend = geom_y[2]),
               arrow = arrow(length = unit(0.18, "cm")), colour = "#3a3a8a", linewidth = 0.9) +
  geom_segment(aes(x = 0, y = 0, xend = geom_yhat[1], yend = geom_yhat[2]),
               arrow = arrow(length = unit(0.18, "cm")), colour = "#1f8a3a", linewidth = 0.9) +
  geom_segment(aes(x = geom_yhat[1], y = geom_yhat[2], xend = geom_y[1], yend = geom_y[2]),
               linetype = "dashed", colour = "#b03030", linewidth = 0.9) +
  annotate("text", x = geom_y[1] + 0.1, y = geom_y[2] + 0.15, label = "y") +
  annotate("text", x = geom_yhat[1] + 0.25, y = geom_yhat[2] - 0.2, label = "y_hat") +
  annotate("text", x = (geom_y[1] + geom_yhat[1]) / 2 + 0.25,
           y = (geom_y[2] + geom_yhat[2]) / 2, label = "e", colour = "#b03030") +
  annotate("text", x = 4, y = 4 * 0.4 + 0.25, label = "col(X)", colour = "grey30") +
  coord_fixed(xlim = c(-0.5, 4.5), ylim = c(-0.5, 4.5)) +
  labs(title = "OLS as orthogonal projection in R^2",
       x = NULL, y = NULL) +
  theme_minimal()

proj_plot
```

The blue arrow is the original response $y$. The green arrow is the fitted value $\hat{y}$, sitting on the line $\text{col}(X)$. The red dashed segment is the residual $e = y - \hat{y}$, and it meets the line at a right angle. Numerically, $\hat{y}^\top e \approx 10^{-16}$, orthogonality holds to machine precision.

[TIP]
**The right angle between $\hat{y}$ and $e$ is not approximate, it is exact.** It is the *defining* property of the OLS solution. Any other point on $\text{col}(X)$ would produce a longer residual segment, by the Pythagorean theorem.

**Try it:** Pick a $y$ that already lies on the column-space line, for example $y = (3, 1.2)$ which is exactly $3 \cdot (1, 0.4)$. Project it and confirm the residual is essentially zero.

```r title="Your turn: project an on-line vector"
ex_y_on <- c(3, 1.2)
# compute ex_res_on = ex_y_on - geom_H %*% ex_y_on

#> Expected: residual close to (0, 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="On-line projection solution"
ex_y_on  <- c(3, 1.2)
ex_res_on <- ex_y_on - as.vector(geom_H %*% ex_y_on)
ex_res_on
#> [1] 4.440892e-16 0.000000e+00
```

**Explanation:** A vector that already lies in $\text{col}(X)$ is its own projection. The residual is zero up to floating-point noise.

</details>

## What does the diagonal of H tell us about leverage?

The off-diagonal entries of $H$ describe how much each observation pulls the others. The diagonal entries describe how much each observation pulls *itself*. That self-influence has a name: **leverage**.

Three facts about leverage are worth memorising. (1) Each $h_{ii}$ lies in $[0, 1]$. (2) The mean leverage is $p/n$, because $\text{tr}(H) = p$. (3) A common rule of thumb flags any observation with $h_{ii} > 2p/n$ as high leverage. Let's compute leverage from `H`, compare with R's built-in `hatvalues()`, and find the high-leverage cars.

```r title="Leverage values from diag(H) match hatvalues()"
h_diag <- diag(H)
hat_r  <- hatvalues(model)

all.equal(unname(h_diag), unname(hat_r))
#> [1] TRUE

n <- nrow(X); p <- ncol(X)
lev_threshold <- 2 * p / n
c(mean_h = mean(h_diag), threshold = lev_threshold)
#>    mean_h threshold
#>   0.09375   0.18750

high_rows <- which(h_diag > lev_threshold)
data.frame(car = rownames(mtcars)[high_rows], leverage = round(h_diag[high_rows], 3))
#>                  car leverage
#> 1     Toyota Corona    0.218
#> 2 Lincoln Continental    0.198
#> 3     Maserati Bora    0.466
```

Three cars exceed the $2p/n = 0.1875$ threshold. The Maserati Bora is the standout: leverage $0.47$ means it sits in a corner of predictor space all by itself (extreme `wt` and `hp` combination), so the fitted line bends to accommodate it. The mean leverage is exactly $3/32 = 0.09375$, matching $\text{tr}(H)/n$.

[WARNING]
**High leverage alone is not bad.** Leverage measures distance in predictor space, not whether a point distorts the fit. A high-leverage point with a small residual is harmless. The danger is leverage *combined* with a large residual, which is what Cook's distance and `dffits` capture. Do not delete points just because their leverage is high.

**Try it:** Print the row names from `mtcars` whose leverage exceeds $3p/n$ (a stricter threshold). Use `h_diag` and the `n`, `p` values already in scope.

```r title="Your turn: stricter leverage threshold"
ex_high_lev <- # rownames where h_diag > 3 * p / n

#> Expected: a single car (the most extreme one)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stricter threshold solution"
ex_high_lev <- rownames(mtcars)[h_diag > 3 * p / n]
ex_high_lev
#> [1] "Maserati Bora"
```

**Explanation:** Tightening the multiplier from 2 to 3 isolates the single most extreme observation. Many practitioners use $2p/n$ as a screen and $3p/n$ as a serious flag.

</details>

## How does I − H deliver the residuals?

If $H$ projects $y$ onto $\text{col}(X)$, then $I - H$ projects $y$ onto the **orthogonal complement**, the subspace of residuals. That gives us a clean second matrix called the **residual maker**:

$$M = I - H, \quad e = My$$

$M$ inherits both projection properties: it is symmetric and idempotent. Its trace, however, is $n - p$, because $\text{tr}(I - H) = n - \text{tr}(H) = n - p$. That number is exactly the **residual degrees of freedom** that R reports for any `lm()` model. The figure below summarises how $H$ and $M$ split $y$.

![How H and (I − H) split y into orthogonal pieces](screenshots/Projections-and-the-Hat-Matrix-in-R-projection-split.webp)
*Figure 1: The hat matrix splits y into orthogonal pieces, fitted values Hy and residuals (I − H)y.*

```r title="Residual maker M: residuals and degrees of freedom"
M <- diag(nrow(X)) - H
e_proj <- M %*% y

all.equal(as.vector(e_proj), unname(residuals(model)))
#> [1] TRUE

orth_check <- as.numeric(t(y_hat) %*% e_proj)
tr_M       <- sum(diag(M))

c(orth = orth_check, trace_M = tr_M, n_minus_p = nrow(X) - ncol(X))
#>          orth      trace_M    n_minus_p
#> -1.421085e-14 2.900000e+01 2.900000e+01
```

Three things to read off this output. First, `e_proj` matches `residuals(model)` exactly, the residual maker reproduces R's residual vector. Second, the inner product of fitted values and residuals is essentially zero (orthogonality). Third, $\text{tr}(M) = 29 = 32 - 3$ matches `df.residual(model)`.

[KEY INSIGHT]
**The denominator $n - p$ in $\hat{\sigma}^2 = \text{RSS}/(n-p)$ is exactly $\text{tr}(M)$.** It is not a degrees-of-freedom heuristic, it is the dimension of the subspace your residuals live in. You "spent" $p$ dimensions fitting the model, and what remains is $n - p$ dimensions for residual variation.

**Try it:** Confirm directly that `sum(diag(I - H))` for our 32-by-32 example equals `nrow(X) - ncol(X)`. Reuse `M` and `X`.

```r title="Your turn: trace of I minus H"
ex_tr_M <- # sum(diag(M))
# compare with nrow(X) - ncol(X)

#> Expected: 29 == 29
```

<details>
<summary>Click to reveal solution</summary>

```r title="Trace identity solution"
ex_tr_M <- sum(diag(M))
c(trace = ex_tr_M, n_minus_p = nrow(X) - ncol(X))
#>     trace n_minus_p
#>        29        29
```

**Explanation:** $\text{tr}(I_n - H) = n - \text{tr}(H) = n - p$. The residual subspace has dimension $n - p$, which is what R calls `df.residual`.

</details>

## Practice Exercises

These two capstones combine the ideas above. Each exercise uses a fresh prefix (`my_`) so it does not overwrite the variables from the tutorial.

### Exercise 1: Prediction variance from the hat matrix

For the model `mpg ~ wt + hp + cyl` on `mtcars`, build the hat matrix from scratch and compute the prediction variance for a *new* observation with design row $x_* = (1, 3.0, 110, 6)$. The formula is

$$\widehat{\text{Var}}(\hat{y}_*) = \hat{\sigma}^2 \left( 1 + x_*^\top (X^\top X)^{-1} x_* \right)$$

Save the result to `my_pred_var`.

```r title="Exercise 1: prediction variance"
# Hint: build X with cbind(1, ...), compute (X'X)^{-1}, then
# multiply x_star %*% inv %*% x_star, finally scale by sigma_hat^2 * (1 + ...).

my_X <- # ...
my_xtxinv <- # ...
my_xstar <- c(1, 3.0, 110, 6)
my_sigma2 <- # residual variance from M y or sigma(model)^2
my_pred_var <- # final scalar

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_y       <- mtcars$mpg
my_X       <- cbind(1, mtcars$wt, mtcars$hp, mtcars$cyl)
my_xtxinv  <- solve(t(my_X) %*% my_X)
my_H       <- my_X %*% my_xtxinv %*% t(my_X)
my_resid   <- (diag(nrow(my_X)) - my_H) %*% my_y
my_sigma2  <- sum(my_resid^2) / (nrow(my_X) - ncol(my_X))
my_xstar   <- c(1, 3.0, 110, 6)
my_pred_var <- as.numeric(my_sigma2 * (1 + t(my_xstar) %*% my_xtxinv %*% my_xstar))
my_pred_var
#> [1] 6.519
```

**Explanation:** `(X'X)^{-1}` falls out of the hat-matrix formula. The inner $x_*^\top (X^\top X)^{-1} x_*$ measures how far $x_*$ is from the centre of predictor space, far points have larger prediction variance. Adding the $1$ accounts for the irreducible noise in a fresh observation.

</details>

### Exercise 2: H depends only on the column space, not the columns

Show numerically that adding a redundant column to $X$ (a linear combination of existing columns) leaves the column space, and therefore $H$, unchanged. Build two design matrices: `X1` with two columns, and `X2` that adds a redundant third column equal to the sum of the first two. Compute both hat matrices (use `MASS::ginv()` for the rank-deficient $X_2$) and confirm `all.equal(H1, H2)`.

```r title="Exercise 2: H is column-space invariant"
# Hint: H_full_rank = X1 %*% solve(t(X1) %*% X1) %*% t(X1)
# For X2, use the Moore-Penrose pseudoinverse via MASS::ginv to handle rank deficiency.
# Compare with all.equal().

my_X1 <- # cbind of two non-collinear columns, e.g., 1 and mtcars$wt
my_X2 <- # cbind(my_X1, my_X1[,1] + my_X1[,2])  -- redundant column
# my_H1 <- ...
# my_H2 <- ...
# all.equal(my_H1, my_H2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
library(MASS)
my_X1 <- cbind(1, mtcars$wt)
my_X2 <- cbind(my_X1, my_X1[, 1] + my_X1[, 2])

my_H1 <- my_X1 %*% solve(t(my_X1) %*% my_X1) %*% t(my_X1)
my_H2 <- my_X2 %*% ginv(t(my_X2) %*% my_X2) %*% t(my_X2)

all.equal(my_H1, my_H2)
#> [1] TRUE
```

**Explanation:** $H$ depends only on $\text{col}(X)$, not on which spanning set you pick. Adding a redundant column does not enlarge the column space, so the projection is identical. The pseudo-inverse `ginv()` is needed because $X_2^\top X_2$ is singular when $X_2$ has redundant columns.

</details>

## Complete Example: From scratch to lm() diagnostics

Let's walk a single `mtcars` analysis end-to-end, computing every piece by hand from the hat matrix and confirming each one against R's built-ins. This is the workflow you would use on real data to cross-check `lm()` output.

```r title="End-to-end hat-matrix analysis"
ce_y    <- mtcars$mpg
ce_X    <- cbind(1, mtcars$wt, mtcars$hp, mtcars$qsec)
ce_n    <- nrow(ce_X); ce_p <- ncol(ce_X)
ce_H    <- ce_X %*% solve(t(ce_X) %*% ce_X) %*% t(ce_X)

ce_yhat <- as.vector(ce_H %*% ce_y)
ce_resid <- ce_y - ce_yhat
ce_h     <- diag(ce_H)
ce_sigma2 <- sum(ce_resid^2) / (ce_n - ce_p)
ce_cook  <- (ce_h / (1 - ce_h)) * (ce_resid^2 / (ce_p * ce_sigma2))

ce_model <- lm(mpg ~ wt + hp + qsec, data = mtcars)

# Cross-checks
all.equal(ce_yhat,  unname(fitted(ce_model)))
#> [1] TRUE
all.equal(ce_resid, unname(residuals(ce_model)))
#> [1] TRUE
all.equal(ce_h,     unname(hatvalues(ce_model)))
#> [1] TRUE
all.equal(ce_cook,  unname(cooks.distance(ce_model)))
#> [1] TRUE

# Top three high-leverage cars
top_lev <- order(ce_h, decreasing = TRUE)[1:3]
data.frame(car = rownames(mtcars)[top_lev],
           leverage = round(ce_h[top_lev], 3),
           cooks_d  = round(ce_cook[top_lev], 3))
#>                  car leverage cooks_d
#> 1      Maserati Bora    0.498   0.222
#> 2 Lincoln Continental    0.214   0.005
#> 3   Cadillac Fleetwood   0.198   0.024
```

Every quantity matches R's built-in functions to machine precision, fitted values, residuals, hat values, and Cook's distance. The Maserati Bora keeps the leverage crown even with `qsec` added; combined with a moderate residual, it has the highest Cook's distance. Lincoln Continental is high-leverage but well-fit, so its Cook's distance is tiny, exactly the leverage-without-influence pattern called out earlier.

## Summary

The hat matrix is the operator that performs the OLS projection. Once you see that, every regression diagnostic looks like a simple geometric measurement.

![Hat matrix at a glance](screenshots/Projections-and-the-Hat-Matrix-in-R-properties-mindmap.webp)
*Figure 2: The hat matrix at a glance, definition, algebra, geometry, diagnostics.*

| Quantity | Formula | What it measures |
|---|---|---|
| Fitted values | $\hat{y} = Hy$ | Projection of $y$ onto $\text{col}(X)$ |
| Residuals | $e = (I - H)y$ | Component of $y$ orthogonal to $\text{col}(X)$ |
| Leverage | $h_{ii} = (H)_{ii}$ | Self-influence of observation $i$ |
| Mean leverage | $p/n = \text{tr}(H)/n$ | Average self-influence |
| Residual d.f. | $n - p = \text{tr}(I - H)$ | Dimension of the residual subspace |
| Cook's distance | $\frac{h_{ii}}{1 - h_{ii}} \cdot \frac{e_i^2}{p \hat\sigma^2}$ | Combined leverage and residual influence |

Three properties drive everything: $H$ is **symmetric**, **idempotent**, and has **trace $p$**. That is the algebraic signature of an orthogonal projection. Once you accept that signature, residuals, leverage, and degrees of freedom stop being separate formulas and become facets of one geometric picture.

## References

1. Hastie, T., Tibshirani, R., Friedman, J., *The Elements of Statistical Learning*, 2nd Edition. Springer (2009). Chapter 3: Linear Methods for Regression. [Link](https://hastie.su.domains/ElemStatLearn/)
2. Wikipedia, Projection matrix. [Link](https://en.wikipedia.org/wiki/Projection_matrix)
3. Strang, G., *Introduction to Linear Algebra*, 5th Edition. Wellesley-Cambridge Press (2016). Chapter 4: Orthogonality.
4. R Core Team, `?hatvalues` and `?influence.measures`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html)
5. Faraway, J., *Linear Models with R*, 2nd Edition. CRC Press (2014). Chapter 6: Diagnostics.
6. MIT OpenCourseWare, 18.06 Linear Algebra, Lecture 16: Projection matrices and least squares. [Link](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-16-projection-matrices-and-least-squares/)
7. Belsley, D. A., Kuh, E., Welsch, R. E., *Regression Diagnostics: Identifying Influential Data and Sources of Collinearity*. Wiley (1980).

## Continue Learning

- **[Linear Regression in R](Linear-Regression.html)**, the practical `lm()` workflow, coefficient interpretation, and `summary.lm()` output.
- **[Outlier Treatment in R](Outlier-Treatment-With-R.html)**, Cook's distance, leverage thresholds, and how to handle influential points.
- **[Singular Value Decomposition in R](Singular-Value-Decomposition-in-R.html)**, what to do when $X^\top X$ is singular and the standard hat-matrix formula breaks down.
