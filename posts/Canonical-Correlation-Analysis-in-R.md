---
title: "Canonical Correlation Analysis in R: CCA for Two Variable Sets"
slug: "Canonical-Correlation-Analysis-in-R"
description: "Canonical correlation analysis (CCA) reveals strongest links between two variable sets. Use cancor() in R to compute canonical variates, loadings, and tests."
keywords: "canonical correlation analysis in R, CCA in R, cancor function, canonical variates, canonical loadings, multivariate analysis R, two variable sets, Wilks lambda"
auto_link_terms: "canonical correlation analysis|canonical correlation analysis in R|CCA in R|canonical variates|canonical correlations|canonical loadings|cancor function"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "FR-mult-4"
post_type: "FR"
fr_parent: "CFA-and-Structural-Equation-Modeling-in-R.html"
difficulty: "Advanced"
---

# Canonical Correlation Analysis in R: CCA for Two Variable Sets

<p class="lead">Canonical correlation analysis (CCA) finds the linear combinations of two variable sets that share the strongest possible correlation. In R, base <code>cancor()</code> returns those combinations, called canonical variates, along with their correlations, ready for interpretation.</p>

## What does canonical correlation analysis actually find?

Most correlation tools answer a one-to-one question: how does *this* variable move with *that* one? CCA answers a many-to-many question instead. Across two whole sets of variables, what is the single strongest pattern of co-movement? The technique mixes each set into one summary score per side, then asks how tightly those scores track each other. The pair of mixes is called a canonical variate pair, and their correlation is the canonical correlation.

Run it on the built-in `LifeCycleSavings` data, splitting demographic variables (`pop15`, `pop75`) on one side and economic variables (`sr`, `dpi`, `ddpi`) on the other. The whole analysis is one call.

```r title="Run cancor() on LifeCycleSavings"
X <- as.matrix(LifeCycleSavings[, c("pop15", "pop75")])
Y <- as.matrix(LifeCycleSavings[, c("sr", "dpi", "ddpi")])

cca <- cancor(X, Y)
cca$cor
#> [1] 0.8247966 0.3652762
```

Two numbers come back. The first, 0.825, is huge: it says some weighted blend of the two demographic variables tracks some weighted blend of the three economic variables almost as tightly as a clean linear relationship. The second, 0.365, is the next-strongest pattern after the first one is removed. Everything else in this tutorial is about understanding *what* those blends are and *whether* the relationship is real.

[NOTE]
**cancor() drops rows with any missing value silently.** Pre-clean both sets with `complete.cases()` before calling the function so you know exactly how many observations the analysis used. A surprise change in `n` will distort every significance test downstream.

**Try it:** Split `LifeCycleSavings` differently. Put just the savings rate (`sr`) on one side and the other four variables on the other side. How many canonical correlations do you get back, and why?

```r title="Your turn: split sr alone vs the rest"
ex_X <- as.matrix(LifeCycleSavings[, "sr", drop = FALSE])
ex_Y <- as.matrix(LifeCycleSavings[, c("pop15", "pop75", "dpi", "ddpi")])

# Run cancor and print the correlations:
ex_cca <- cancor(ex_X, ex_Y)
# your code here

#> Expected: a single canonical correlation
```

<details>
<summary>Click to reveal solution</summary>

```r title="sr-alone solution"
ex_cca$cor
#> [1] 0.8852248
```

**Explanation:** The number of canonical correlations equals `min(p, q)`, where `p` and `q` are the column counts of the two sets. With `p = 1` and `q = 4`, you get one correlation. With one variable on a side, CCA collapses to ordinary multiple correlation.

</details>

## How do I split data into two variable sets and run cancor()?

`cancor(x, y)` is happy with any two matrices (or data frames coerced to matrices) that have the same number of rows. The output is a list with five named pieces. The pieces look intimidating at first, so it pays to inspect them before using them.

```r title="Inspect cancor() output structure"
str(cca)
#> List of 5
#>  $ cor    : num [1:2] 0.825 0.365
#>  $ xcoef  : num [1:2, 1:2] -0.00946 0.15766 0.04260 0.10578
#>  $ ycoef  : num [1:3, 1:2] 0.008972 -1.9e-05 -0.021384 ...
#>  $ xcenter: Named num [1:2] 35.09 2.293
#>  $ ycenter: Named num [1:3] 9.671 1106.76 3.758
```

`xcoef` and `ycoef` are the recipes that build the canonical variates. Each column is one variate; each row is one input variable's contribution. `xcenter` and `ycenter` are the column means used to centre each set before fitting (CCA always works on centred data).

```r title="Print the canonical coefficients"
round(cca$xcoef, 4)
#>          [,1]   [,2]
#> pop15 -0.0095 0.0426
#> pop75  0.1577 0.1058

round(cca$ycoef, 6)
#>            [,1]      [,2]
#> sr     0.008972  0.025484
#> dpi   -0.000019  0.000123
#> ddpi  -0.021384  0.084060
```

Look at column 1 of `xcoef`. The two coefficients have opposite signs, so the first canonical variate on the X side contrasts old population (`pop75`, positive) against young population (`pop15`, negative). Column 1 of `ycoef` shows `sr` and `ddpi` with negative coefficients and `dpi` near zero, so the matching Y variate is mostly a "low savings, low growth" score. Already, before running any extra computation, the first canonical pair is telling a story about ageing societies and slower economies.

[TIP]
**Centre but do not scale before calling cancor().** The function centres automatically, so passing `scale(X)` only changes coefficient magnitudes, never the canonical correlations or loadings. Skip the extra step.

**Try it:** Confirm that scaling the inputs leaves the canonical correlations unchanged. Compare `cancor(scale(X), scale(Y))$cor` against `cca$cor`.

```r title="Your turn: scale invariance check"
ex_scaled <- cancor(scale(X), scale(Y))
# Compare ex_scaled$cor with cca$cor:
# your code here

#> Expected: identical correlations (within tiny numerical error)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Scale invariance solution"
all.equal(ex_scaled$cor, cca$cor)
#> [1] TRUE
```

**Explanation:** Canonical correlations are invariant under linear transformations of either set. Scaling each column to unit variance changes the coefficient values but rescales them inversely so the variates and their correlations stay identical.

</details>

## How do I compute and read canonical variates?

A canonical variate is the actual per-row score on the canonical dimension. To compute the X-side variates, centre `X` and multiply by `xcoef`. To compute the Y-side variates, do the same with `Y` and `ycoef`. The result is one column per dimension, one row per observation.

```r title="Compute canonical variates U and V"
X_c <- scale(X, center = TRUE, scale = FALSE)
Y_c <- scale(Y, center = TRUE, scale = FALSE)

U <- X_c %*% cca$xcoef
V <- Y_c %*% cca$ycoef

head(U, 3)
#>          [,1]    [,2]
#> [1,]  0.4239 -0.4621
#> [2,] -0.7822  1.0812
#> [3,]  0.7411 -0.5894

head(V, 3)
#>          [,1]    [,2]
#> [1,]  0.5132 -0.7401
#> [2,] -0.9801  0.6325
#> [3,]  1.1203 -0.4112
```

Each column of `U` (and `V`) is mean-centred and has unit variance by construction. Row 1 has positive scores on the first variate of both sides, meaning that country sits on the "positive end" of whatever the first canonical pair represents. The point of the next step is to verify that `U[, 1]` and `V[, 1]` are paired by maximum correlation.

![CCA links two variable sets through paired canonical variates whose correlation is as large as possible.](screenshots/Canonical-Correlation-Analysis-in-R-cca-concept.webp)

*Figure 1: CCA finds linear combinations of each set whose correlation is as large as possible.*

```r title="Verify the first canonical correlation"
cor(U[, 1], V[, 1])
#> [1] 0.8247966

cca$cor[1]
#> [1] 0.8247966
```

The two values match exactly, confirming that the first column of `U` and the first column of `V` are the canonical variate pair whose correlation is `cca$cor[1]`. That is the entire definition of CCA in one line of code.

[KEY INSIGHT]
**A canonical variate is just a weighted average of one side's variables.** CCA's only trick is choosing the weights so that the two sides' weighted averages line up as tightly as possible.

**Try it:** Compute the correlation between `U[, 1]` and `V[, 2]`. What value do you expect, and why?

```r title="Your turn: cross-pair correlation"
# Compute cor(U[, 1], V[, 2]):
# your code here

#> Expected: a value very close to 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cross-pair correlation solution"
cor(U[, 1], V[, 2])
#> [1] 1.387779e-17
```

**Explanation:** Canonical variates from *different* pairs are uncorrelated by construction. The optimisation in CCA forces each new dimension to be orthogonal to all earlier ones, so cross-pair correlations are zero up to floating-point error.

</details>

## What do canonical loadings tell me?

Canonical coefficients (`xcoef`, `ycoef`) are not directly comparable across variables because they sit on whatever scale each input variable uses. A coefficient of `0.0001` on `dpi` and `0.16` on `pop75` does not mean `pop75` matters 1600 times more, it just reflects the variance differences between the columns.

The fix is **canonical loadings**, also called structure correlations. A loading is the plain Pearson correlation between an original variable and a canonical variate. Loadings are scale-free, so signs and magnitudes can be compared directly.

```r title="Compute canonical loadings"
xloadings <- cor(X, U)
yloadings <- cor(Y, V)

round(xloadings, 3)
#>          [,1]   [,2]
#> pop15   0.978  0.211
#> pop75  -0.940 -0.342

round(yloadings, 3)
#>         [,1]   [,2]
#> sr     -0.738  0.430
#> dpi     0.397  0.882
#> ddpi   -0.155  0.876
```

The first column tells the story. On the X side, `pop15` loads strongly positive (0.978) and `pop75` strongly negative (-0.940), so the first canonical variate is a "young population" axis. On the Y side, `sr` loads strongly negative (-0.738) and `dpi` modestly positive (0.397), so the matching Y variate is a "low savings, somewhat higher income" axis. Together, the first canonical pair describes a coherent demographic-economic gradient, countries with younger populations also save less.

[TIP]
**Treat absolute loadings above 0.30 as practically meaningful.** This rule of thumb, borrowed from factor analysis, gives a quick filter when a loading matrix has many small entries. Anything below 0.30 is usually too weak to lean on for interpretation.

Cross-loadings, the correlations between an original variable and the *other* set's variate, give the same story from a slightly different angle. They are the easiest way to see how much each input variable speaks to the opposite side.

```r title="Compute cross-loadings"
xcross <- cor(X, V)
ycross <- cor(Y, U)

round(xcross, 3)
#>          [,1]   [,2]
#> pop15   0.807  0.077
#> pop75  -0.776 -0.125

round(ycross, 3)
#>         [,1]   [,2]
#> sr     -0.609  0.157
#> dpi     0.327  0.322
#> ddpi   -0.128  0.320
```

Notice that each cross-loading equals the corresponding loading multiplied by the canonical correlation: `0.978 * 0.825 = 0.807`. This is not a coincidence, it is how cross-loadings are mathematically constructed.

[WARNING]
**Canonical coefficients can flip sign arbitrarily across software.** Two R sessions on platforms with different LAPACK builds can return mirror-image signs for the same data. Interpret the *pattern* of signs within each variate, never compare raw signs across packages or runs.

**Try it:** On the X side, which variable loads most heavily on the first canonical variate (in absolute value)?

```r title="Your turn: dominant X loading"
# Use which.max() with abs() on the first column of xloadings:
# your code here

#> Expected: the row name of the variable with the largest absolute loading
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dominant X loading solution"
rownames(xloadings)[which.max(abs(xloadings[, 1]))]
#> [1] "pop15"
```

**Explanation:** `pop15` has the largest absolute loading (0.978) on the first canonical variate. The variable that loads most strongly is the one that the canonical variate most closely resembles.

</details>

## How do I test if the canonical correlations are significant?

A canonical correlation of 0.825 looks impressive, but with only 50 observations and several variables, some sample noise is inevitable. The standard test is **Wilks' lambda**, which checks the joint hypothesis that the i-th canonical correlation and all later ones are zero.

The lambda statistic combines the squared canonical correlations into a single number between 0 and 1. Smaller lambda means stronger evidence that the canonical relationship is real.

$$\Lambda_i = \prod_{j=i}^{k}(1 - \rho_j^2)$$

Bartlett's chi-square approximation turns lambda into a p-value:

$$\chi^2 = -\left(n - 1 - \frac{p+q+1}{2}\right)\ln\Lambda_i,\quad \text{df} = (p-i+1)(q-i+1)$$

Where:

- $\rho_j$ = the j-th canonical correlation
- $n$ = sample size, $p$ = ncol(X), $q$ = ncol(Y)
- $k$ = `min(p, q)` = number of canonical correlations
- $i$ = the dimension being tested

The whole test is short enough to write as a small R function. It returns one row per dimension with lambda, the chi-square, the degrees of freedom, and the p-value.

```r title="Wilks lambda significance test"
wilks_test <- function(rho, n, p, q) {
  k <- length(rho)
  out <- data.frame(dim = integer(), lambda = numeric(),
                    chi_sq = numeric(), df = numeric(), p_value = numeric())
  for (i in seq_len(k)) {
    lam <- prod(1 - rho[i:k]^2)
    chi <- -(n - 1 - (p + q + 1) / 2) * log(lam)
    deg <- (p - i + 1) * (q - i + 1)
    out[i, ] <- list(i, lam, chi, deg, pchisq(chi, deg, lower.tail = FALSE))
  }
  out
}

wilks_test(cca$cor, n = 50, p = 2, q = 3)
#>   dim    lambda    chi_sq df      p_value
#> 1   1 0.2758940 59.157395  6 6.797e-11
#> 2   2 0.8665733  6.572881  2 3.736e-02
```

Both dimensions are significant at the conventional 5 percent level. Only the first dimension survives a stricter 1 percent test, which is the safer cut to use when the data set is small and the second canonical correlation is moderate.

[NOTE]
**The CCA and CCP packages provide cc() and p.asym() as convenience wrappers for the workflow above.** They add tidy graphical output and additional test variants (Pillai, Hotelling-Lawley, Roy). Neither package ships in the WebR repository, so the base-R recipes shown here are the portable choice.

A few assumptions deserve a quick check before you trust the test:

- **Sample size:** a common rule of thumb is `n` ≥ 20 times the number of variables in the larger set. Here, `20 * 3 = 60`, and the data has only `n = 50`, so the test is borderline-underpowered.
- **No multicollinearity within either set:** check `cor(X)` and `cor(Y)` for any pair near 0.95.
- **Multivariate normality:** strictly required only for the Bartlett chi-square approximation, not for the canonical correlations themselves.

**Try it:** From the test result, which canonical dimensions are significant at α = 0.05?

```r title="Your turn: count significant dimensions"
# Filter the result frame for p_value < 0.05:
# your code here

#> Expected: a numeric vector of dimension numbers
```

<details>
<summary>Click to reveal solution</summary>

```r title="Significance count solution"
res <- wilks_test(cca$cor, n = 50, p = 2, q = 3)
res$dim[res$p_value < 0.05]
#> [1] 1 2
```

**Explanation:** Both rows have p-values below 0.05, so both canonical dimensions are statistically significant at the 5 percent level.

</details>

## Practice Exercises

### Exercise 1: CCA on state.x77 socioeconomic vs quality-of-life

Using the built-in `state.x77` matrix, run a canonical correlation analysis with `Income`, `Illiteracy`, and `HS Grad` (socioeconomic) on one side and `Life Exp`, `Murder`, and `Frost` (quality-of-life) on the other. Save the canonical correlations as `my_cors` and the X-side loadings on the first dimension as `my_xload`.

```r title="Exercise: state.x77 CCA"
# Hint: state.x77 is a matrix; index columns by name with state.x77[, c("Income", ...)]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="state.x77 CCA solution"
my_X <- state.x77[, c("Income", "Illiteracy", "HS Grad")]
my_Y <- state.x77[, c("Life Exp", "Murder", "Frost")]
my_cca <- cancor(my_X, my_Y)
my_cors <- my_cca$cor

my_X_c <- scale(my_X, center = TRUE, scale = FALSE)
my_U <- my_X_c %*% my_cca$xcoef
my_xload <- cor(my_X, my_U)[, 1]

round(my_cors, 3)
#> [1] 0.926 0.503 0.105
round(my_xload, 3)
#>     Income Illiteracy    HS Grad
#>     -0.490      0.852     -0.703
```

**Explanation:** Three canonical correlations come back because both sides have three variables. The first dimension contrasts illiterate, low-income, low-education states against the inverse, and the second dimension picks up a weaker secondary pattern.

</details>

### Exercise 2: Significance test on the state.x77 CCA

Using `my_cca` from Exercise 1, run the Wilks lambda significance test (reuse the `wilks_test()` function from earlier). Count how many canonical dimensions are significant at α = 0.01 and save the count as `my_sig_count`.

```r title="Exercise: significance count"
# Hint: state.x77 has n = 50 rows and both sides have 3 variables

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Significance count solution"
my_wilks <- wilks_test(my_cca$cor, n = 50, p = 3, q = 3)
my_sig_count <- sum(my_wilks$p_value < 0.01)

print(my_wilks)
#>   dim     lambda     chi_sq df      p_value
#> 1   1 0.10256935 102.832611  9 < 1e-15
#> 2   2 0.74038500  13.376829  4 9.594e-03
#> 3   3 0.98905569   0.501301  1 4.789e-01

my_sig_count
#> [1] 2
```

**Explanation:** The first two canonical dimensions are highly significant; the third is essentially noise. With three pairs available, two carry real signal.

</details>

## Complete Example: End-to-end CCA on state.x77

The script below packages the full workflow into one block so you can lift and reuse it. It splits `state.x77` into socioeconomic and quality-of-life sets, runs `cancor()`, computes loadings, runs the Wilks lambda test, and prints a summary of the first canonical pair.

```r title="End-to-end CCA on state.x77"
ex_state_X <- state.x77[, c("Income", "Illiteracy", "HS Grad")]
ex_state_Y <- state.x77[, c("Life Exp", "Murder", "Frost")]

ex_state_cca <- cancor(ex_state_X, ex_state_Y)
ex_state_X_c <- scale(ex_state_X, center = TRUE, scale = FALSE)
ex_state_Y_c <- scale(ex_state_Y, center = TRUE, scale = FALSE)
ex_state_U   <- ex_state_X_c %*% ex_state_cca$xcoef
ex_state_V   <- ex_state_Y_c %*% ex_state_cca$ycoef

ex_state_load_X <- cor(ex_state_X, ex_state_U)
ex_state_load_Y <- cor(ex_state_Y, ex_state_V)
ex_state_sig    <- wilks_test(ex_state_cca$cor, n = nrow(ex_state_X),
                              p = ncol(ex_state_X), q = ncol(ex_state_Y))

cat("Canonical correlations:\n")
print(round(ex_state_cca$cor, 3))
cat("\nFirst-pair X loadings:\n")
print(round(ex_state_load_X[, 1], 3))
cat("\nFirst-pair Y loadings:\n")
print(round(ex_state_load_Y[, 1], 3))
cat("\nSignificance test:\n")
print(ex_state_sig)
#> Canonical correlations:
#> [1] 0.926 0.503 0.105
#>
#> First-pair X loadings:
#>     Income Illiteracy    HS Grad
#>     -0.490      0.852     -0.703
#>
#> First-pair Y loadings:
#>   Life Exp     Murder      Frost
#>     -0.611      0.901     -0.404
```

The first canonical pair captures a coherent "deprivation gradient": states with high illiteracy and low education align with lower life expectancy, higher murder rates, and warmer climates. That whole story comes from one number (the canonical correlation, 0.926) and two interpretable loading vectors.

## Summary

![End-to-end CCA workflow: split, fit, extract variates and loadings, test significance, interpret.](screenshots/Canonical-Correlation-Analysis-in-R-workflow.webp)

*Figure 2: The full CCA workflow: split, fit, extract variates and loadings, test significance, interpret.*

| Concept | Key takeaway |
|---|---|
| Number of correlations | `min(p, q)` where `p` and `q` are the column counts of each set |
| Coefficients vs loadings | Loadings (correlations with original variables) are scale-free and interpretable; coefficients are not |
| First correlation | The largest possible correlation between any two linear combinations of the sets |
| Significance | Wilks' lambda turned into a Bartlett chi-square, tested sequentially per dimension |
| Sample size rule of thumb | `n` ≥ 20 times the number of variables in the larger set |
| Sign convention | Canonical signs are arbitrary, interpret patterns within a variate, not absolute signs across runs |

CCA is the right tool whenever you need to summarise the relationship between two blocks of variables instead of one variable at a time. A single regression collapses everything on one side into the question "how do these predictors affect that outcome?" CCA keeps both sides intact and asks "what is the strongest pattern that links them?"

## References

1. R Core Team. `cancor` documentation, R Stats package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cancor.html)
2. UCLA OARC. *Canonical Correlation Analysis | R Data Analysis Examples*. [Link](https://stats.oarc.ucla.edu/r/dae/canonical-correlation-analysis/)
3. Hotelling, H. (1936). "Relations between two sets of variates." *Biometrika*, 28(3-4), 321-377. The original CCA paper.
4. Helwig, N. E. *Canonical Correlation Analysis*, lecture notes, University of Minnesota. [Link](http://users.stat.umn.edu/~helwig/notes/CanonicalCorrelationAnalysis.pdf)
5. Härdle, W. and Simar, L. (2015). *Applied Multivariate Statistical Analysis* (4th ed.), Chapter 14. Springer.
6. PSU Stat 505. *Lesson 13: Canonical Correlation Analysis*. [Link](https://online.stat.psu.edu/stat505/book/export/html/682)
7. Belsley, D. A., Kuh, E., and Welsch, R. E. (1980). *Regression Diagnostics*, Wiley. The source of the `LifeCycleSavings` dataset.

## Continue Learning

- [PCA in R](PCA-in-R.html), single-set dimension reduction. CCA generalises this idea to two sets.
- [Multivariate Statistics in R](Multivariate-Statistics-in-R.html), the broader context of distance and correlation across many variables.
- [Linear Discriminant Analysis in R](Linear-Discriminant-Analysis-in-R.html), CCA's classification cousin, where one of the two sets is a group-membership indicator.
