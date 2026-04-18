---
title: "Multicollinearity in R: Detect It With VIF Before It Corrupts Your Coefficients"
slug: Multicollinearity-in-R
description: "Correlated predictors corrupt lm() coefficients. Detect multicollinearity in R with car::vif(), interpret VIF thresholds, and fix with ridge, PCA, or removal."
keywords: "multicollinearity in R, VIF in R, variance inflation factor, car::vif, GVIF, ridge regression, PCA regression, collinearity detection, lm diagnostics"
auto_link_terms: "multicollinearity in R|variance inflation factor|VIF in R|detect multicollinearity|car::vif"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: "2.3.9"
post_type: C
sidebar_section: Regression
sidebar_title: "Multicollinearity & VIF"
sidebar_order: 7
difficulty: Intermediate
---

# Multicollinearity in R: Detect It With VIF Before It Corrupts Your Coefficients

<p class="lead">Multicollinearity happens when two or more predictors in a regression are highly correlated, which inflates standard errors and makes coefficients swing wildly between datasets. You detect it in R with the Variance Inflation Factor (VIF), and you fix it by dropping a redundant predictor, combining correlated variables into principal components, or switching to ridge regression. This tutorial uses base R and `lm()` for the live code; `car::vif()` is the production detector you would reach for in RStudio.</p>

## What does multicollinearity do to your regression?

Multicollinearity is easiest to feel before it is defined. When two predictors measure nearly the same thing, the regression cannot tell which one deserves credit, so coefficients lurch every time you add or drop a variable. Let's fit two models on `mtcars` that differ by a single predictor and watch the other coefficients move.

```r title="Coefficient swing when a correlated predictor is dropped"
# Full model: hp, wt, disp all predict mpg
model_full <- lm(mpg ~ hp + wt + disp, data = mtcars)
round(coef(model_full), 3)
#> (Intercept)          hp          wt        disp
#>      37.106      -0.031      -3.801       0.000

# Drop disp and refit on the same data
model_reduced <- lm(mpg ~ hp + wt, data = mtcars)
round(coef(model_reduced), 3)
#> (Intercept)          hp          wt
#>      37.227      -0.032      -3.878
```

Here the two fits look almost identical, which is the polite version of the problem. Even so, the `hp` coefficient moves slightly and `disp` collapses to essentially zero. In a more collinear dataset that tiny nudge becomes a sign flip, and the regression story you tell in the report changes completely.

![How correlated predictors destabilise coefficient estimates.](screenshots/Multicollinearity-in-R-why-it-hurts.webp)
*Figure 1: How correlated predictors destabilise coefficient estimates.*

The instability shows up most clearly in the confidence intervals. When two predictors share information, the regression splits that information between them and every standard error gets bigger.

```r title="Confidence intervals widen under collinearity"
ci_full <- confint(model_full)
round(ci_full, 3)
#>                   2.5 %   97.5 %
#> (Intercept)       30.296   43.915
#> hp                -0.050   -0.013
#> wt                -5.561   -2.042
#> disp              -0.013    0.013
```

The interval for `disp` crosses zero cleanly: the sign could be positive or negative depending on the sample. That is not a strong signal about displacement, it is a signal that `hp + wt + disp` carries three labels for one and a half pieces of information.

[KEY INSIGHT]
**Wide confidence intervals that cross zero are the fingerprint of multicollinearity.** When a predictor is truly informative, its interval sits confidently on one side of zero. An interval that straddles zero means the regression split too little information across too many correlated predictors.

**Try it:** Fit `lm(mpg ~ cyl + disp + hp, data = mtcars)` into `ex_model`. Then fit `ex_model_drop` after dropping `cyl`. Compare the two `coef()` outputs and report which coefficient changes the most in absolute value.

```r title="Your turn: compare coefficient swing"
ex_model <- lm(mpg ~ cyl + disp + hp, data = mtcars)
# your code here: fit ex_model_drop without cyl, then compare coef()
#> Expected: one coefficient changes by more than 1 unit.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coefficient swing solution"
ex_model <- lm(mpg ~ cyl + disp + hp, data = mtcars)
ex_model_drop <- lm(mpg ~ disp + hp, data = mtcars)

round(coef(ex_model), 3)
#> (Intercept)         cyl        disp          hp
#>      34.185      -1.227      -0.019      -0.015

round(coef(ex_model_drop), 3)
#> (Intercept)        disp          hp
#>      30.736      -0.030      -0.025
```

The `disp` coefficient drops from -0.019 to -0.030 once `cyl` is removed, and `hp` almost doubles. Because `cyl`, `disp`, and `hp` all describe engine size, pulling one out forces the others to carry its weight.

</details>

## How do you compute VIF in R?

The Variance Inflation Factor gives you a number for the instability you just saw. For each predictor, VIF asks a simple question: how much of this predictor can the other predictors already explain? If the answer is "almost all of it", the regression cannot recover a clean coefficient for it.

The formula comes from an auxiliary regression:

$$\text{VIF}_j = \frac{1}{1 - R^2_j}$$

Where:

- $\text{VIF}_j$ = Variance Inflation Factor for predictor $j$
- $R^2_j$ = the R-squared you get from regressing predictor $j$ on all the *other* predictors
- $1 - R^2_j$ = the fraction of predictor $j$ that the other predictors cannot explain

When $R^2_j$ is close to zero, the predictor carries unique information and VIF is close to 1. When $R^2_j$ climbs toward 0.9, VIF shoots up past 10 and the coefficient is riding on a sliver of independent variation.

You can build VIF from first principles with a short loop of `lm()` calls.

```r title="Compute VIF manually with auxiliary regressions"
# Predictors from the full model
predictors <- c("hp", "wt", "disp")

# Regress each predictor on the others and compute 1 / (1 - R^2)
vif_values <- sapply(predictors, function(p) {
  others <- setdiff(predictors, p)
  formula_p <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  r2 <- summary(lm(formula_p, data = mtcars))$r.squared
  1 / (1 - r2)
})

round(vif_values, 2)
#>   hp   wt disp
#> 2.74 4.84 7.32
```

Three numbers, three stories. `hp` has a VIF of 2.74, a mild dose of redundancy. `wt` sits at 4.84, right on the border of the "investigate" zone. `disp` lands at 7.32, which is why its confidence interval earlier swung through zero. The model tries to attribute mpg changes to displacement, but nearly 86 percent of displacement can already be predicted from horsepower and weight.

![How to interpret a VIF value against the standard thresholds.](screenshots/Multicollinearity-in-R-vif-thresholds.webp)
*Figure 2: How to interpret a VIF value against the standard thresholds.*

[TIP]
**VIF thresholds: 1 is clean, 5 is worth a look, 10 is urgent.** A VIF of 1 means zero redundancy. Between 1 and 5 the predictor has overlap with the rest of the model but usually still earns its place. Between 5 and 10 you should ask whether the variable adds unique signal. Above 10, the coefficient estimate is essentially arbitrary and the variable should be dropped or combined.

In everyday practice you would not hand-roll the VIF loop, you would reach for the `car` package. It adds factor support and a consistent return shape, and it is what most regression books reference.

[NOTE]
**car::vif() is the production detector.** Run `library(car); vif(model_full)` in RStudio to get the same numbers. The `car` package is not pre-compiled for the browser runtime on this page, so the examples use the manual formula instead. Both approaches give identical values; the manual loop shows what the function is doing under the hood. Install once with `install.packages("car")` and the function is available for every future project.

**Try it:** Write a function `ex_manual_vif(target, predictors, data)` that returns the VIF for one variable using the auxiliary-regression formula. Test it on `ex_manual_vif("wt", c("hp", "wt", "disp", "qsec"), mtcars)` and confirm the value is above 5.

```r title="Your turn: one-shot VIF function"
ex_manual_vif <- function(target, predictors, data) {
  # your code here: regress target on the other predictors, return 1 / (1 - R^2)
}

ex_manual_vif("wt", c("hp", "wt", "disp", "qsec"), mtcars)
#> Expected: a value above 5, confirming wt is collinear with the others.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual VIF function solution"
ex_manual_vif <- function(target, predictors, data) {
  others <- setdiff(predictors, target)
  f <- as.formula(paste(target, "~", paste(others, collapse = " + ")))
  r2 <- summary(lm(f, data = data))$r.squared
  1 / (1 - r2)
}

round(ex_manual_vif("wt", c("hp", "wt", "disp", "qsec"), mtcars), 2)
#> [1] 6.74
```

A VIF of 6.74 lands `wt` firmly in the investigate zone. In this extended predictor set, weight shares enough variance with horsepower, displacement, and quarter-mile time that its coefficient is no longer stable.

</details>

## How does VIF work for categorical predictors (GVIF)?

A factor with $k$ levels becomes $k-1$ dummy variables inside `lm()`, so a single VIF per dummy is misleading. You could get a low VIF for each dummy individually while the whole factor is collinear with something else in the model. The fix is the Generalised Variance Inflation Factor (GVIF) and its adjusted form, $\text{GVIF}^{1/(2\,\text{Df})}$, which lets you compare factors with numeric predictors on the same scale.

The adjusted GVIF is designed so that its threshold mirrors the usual VIF rule. A $\text{GVIF}^{1/(2\,\text{Df})}$ near 1 means no collinearity, and the value $\sqrt{5} \approx 2.24$ corresponds to the usual VIF threshold of 5. Readers with a stats background can think of it as the VIF you would see if the factor were collapsed back to a single numeric variable.

Let's fit a model with factor predictors on `mtcars` and inspect the regression output.

```r title="Fit a model with factor predictors"
# Convert cyl and gear to factors so lm() creates dummy variables
model_factors <- lm(mpg ~ factor(cyl) + factor(gear) + hp, data = mtcars)
summary(model_factors)$coefficients
#>                   Estimate Std. Error    t value     Pr(>|t|)
#> (Intercept)   30.32828797 3.06225317 9.90391728 2.124316e-10
#> factor(cyl)6  -4.89123188 1.78526078 -2.74001773 1.079552e-02
#> factor(cyl)8  -7.92010685 2.86512960 -2.76432611 1.021025e-02
#> factor(gear)4  1.54254482 1.49833869 1.02950234 3.125020e-01
#> factor(gear)5  2.31793751 1.95196174 1.18749964 2.457300e-01
#> hp            -0.02638925 0.01479458 -1.78369663 8.620466e-02

anova_factors <- anova(model_factors)
anova_factors
#> Analysis of Variance Table
#>
#> Response: mpg
#>               Df Sum Sq Mean Sq F value    Pr(>F)
#> factor(cyl)    2 824.78  412.39 55.1020 1.321e-09
#> factor(gear)   2  19.01    9.51  1.2700 0.2989
#> hp             1  29.82   29.82  3.9838 0.0575
#> Residuals     26 194.57    7.48
```

The tall standard errors on the `factor(gear)` dummies and their non-significant F-test are the tell: once cylinder count is already in the model, the gear levels carry little unique information. If this were a real project you would either drop `gear`, group rarely-used levels, or check whether a single cylinder-and-gear interaction explains the same signal with fewer parameters.

[TIP]
**Compare $\text{GVIF}^{1/(2\,\text{Df})}$ against the same thresholds as VIF.** An adjusted GVIF of 2.24 matches a VIF of 5; an adjusted GVIF of 3.16 matches a VIF of 10. That keeps a single rule-of-thumb in your head regardless of whether your predictor is numeric or categorical.

[NOTE]
**`car::vif()` returns three columns for factor models.** With factors in the model, `vif(model_factors)` returns a matrix with columns `GVIF`, `Df`, and `GVIF^(1/(2*Df))`. Read the third column, not the first, when you compare against the usual thresholds. Calling `vif(model_factors)` on a numeric-only model gives a plain vector, which matches the manual formula above.

**Try it:** Fit `ex_binary_model <- lm(mpg ~ factor(am) + factor(vs) + hp, data = mtcars)`. Look at `summary(ex_binary_model)` and report whether `am` and `vs` appear to carry overlapping signal (hint: check the standard errors and `cor(mtcars$am, mtcars$vs)`).

```r title="Your turn: two binary factors"
ex_binary_model <- lm(mpg ~ factor(am) + factor(vs) + hp, data = mtcars)
# your code here: inspect summary() and cor() to judge collinearity
#> Expected: cor(am, vs) is moderate (~0.17); standard errors are reasonable.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Binary factor inspection"
ex_binary_model <- lm(mpg ~ factor(am) + factor(vs) + hp, data = mtcars)
round(summary(ex_binary_model)$coefficients, 3)
#>               Estimate Std. Error t value Pr(>|t|)
#> (Intercept)     26.003      2.605  9.982    0.000
#> factor(am)1      5.277      1.080  4.885    0.000
#> factor(vs)1      2.875      1.345  2.138    0.041
#> hp              -0.051      0.012 -4.345    0.000

round(cor(mtcars$am, mtcars$vs), 3)
#> [1] 0.168
```

The correlation between `am` and `vs` is only 0.17, and both factor coefficients are significant with moderate standard errors. In this model the two binary factors behave independently enough to keep. Collinearity becomes a concern when that correlation climbs above about 0.7.

</details>

## What else signals multicollinearity beyond VIF?

VIF catches one predictor against the rest, but it can miss the case where three variables together are near-dependent even though no single pair is strongly correlated. The classic second check is the condition number of the scaled design matrix, computed with `kappa()`. It looks at the whole predictor matrix at once and flags near-singular geometry.

A condition number near 1 means the predictors span the feature space cleanly. Above 30 the matrix is nearly rank-deficient and coefficient estimates are numerically unstable. Always scale the predictors first; otherwise the value just reflects the units.

```r title="Condition number and correlation matrix"
# Scale the predictors so units don't dominate the result
X_scaled <- scale(mtcars[, c("hp", "wt", "disp", "drat", "qsec")])
kappa_val <- kappa(X_scaled)
round(kappa_val, 2)
#> [1] 6.99

# Correlation matrix for a pairwise read
cor_mat <- round(cor(mtcars[, c("hp", "wt", "disp", "drat", "qsec")]), 2)
cor_mat
#>        hp    wt  disp  drat  qsec
#> hp   1.00  0.66  0.79 -0.45 -0.71
#> wt   0.66  1.00  0.89 -0.71 -0.17
#> disp 0.79  0.89  1.00 -0.71 -0.43
#> drat -0.45 -0.71 -0.71  1.00  0.09
#> qsec -0.71 -0.17 -0.43  0.09  1.00
```

A condition number of 6.99 sits well below the 30 warning line, so the predictor block is not numerically unstable. The correlation matrix, though, shows the same story VIF told: `disp` correlates 0.89 with `wt` and 0.79 with `hp`, and `drat` is nearly a mirror of `wt`. Those high off-diagonal entries are the neighbours causing `disp`'s high VIF.

[WARNING]
**Condition numbers above 30 are a red flag even when every VIF looks fine.** Multi-way near-dependencies can hide from the pairwise VIF formula but still make the design matrix near-singular. Always compute both a condition number and the full correlation matrix; the two checks cover different failure modes.

A base R `image()` call turns the correlation matrix into a quick heatmap so you can scan the pairs visually.

```r title="Heatmap the correlation matrix"
# Reverse rows so the top-left origin matches the cor() printout
image(
  1:nrow(cor_mat), 1:ncol(cor_mat),
  t(cor_mat)[, nrow(cor_mat):1],
  col = hcl.colors(20, "RdBu"),
  zlim = c(-1, 1),
  axes = FALSE, xlab = "", ylab = "",
  main = "Correlation heatmap: mtcars predictors"
)
axis(1, at = 1:ncol(cor_mat), labels = colnames(cor_mat))
axis(2, at = 1:nrow(cor_mat), labels = rev(rownames(cor_mat)), las = 1)
```

Red cells are strong positive correlations, blue cells are strong negative. The `wt-disp` cell pops red, `drat-wt` and `drat-disp` pop blue, and you can read the collinearity pattern in one glance.

[NOTE]
**Scale the predictors before calling `kappa()`.** Without scaling, a predictor measured in thousands (like `disp`) will dominate one measured in tenths (like `drat`), and the condition number reflects the unit mismatch rather than any real collinearity. `scale()` centres each column to mean zero and standard deviation one, which is the correct input for `kappa()`.

**Try it:** Compute `ex_kappa <- kappa(scale(mtcars[, c("hp", "disp", "wt", "drat", "qsec", "cyl", "am")]))`. Does adding `cyl` and `am` push the condition number above 30? Report the value and interpret.

```r title="Your turn: wider condition-number check"
ex_kappa <- kappa(scale(mtcars[, c("hp", "disp", "wt", "drat", "qsec", "cyl", "am")]))
# your code here: round and compare against the 30 threshold
#> Expected: a value clearly above 7 but still below 30.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Condition number on seven predictors"
ex_kappa <- kappa(scale(mtcars[, c("hp", "disp", "wt", "drat", "qsec", "cyl", "am")]))
round(ex_kappa, 2)
#> [1] 13.92
```

Adding `cyl` and `am` pushes the condition number to 13.92, almost double the five-predictor value but still well below 30. The geometry is getting cramped but the design matrix is not yet singular. Watch for the number to cross 30 as you keep adding correlated engine metrics.

</details>

## How do you fix multicollinearity in R?

Once you have confirmed collinearity, you have three clean options: drop a redundant predictor, combine correlated predictors into a smaller set of composite features, or switch to a regression that expects correlated inputs. Pick based on context, not reflex.

![Four remedies for a collinear regression, with when to use each.](screenshots/Multicollinearity-in-R-remedy-toolkit.webp)
*Figure 3: Four remedies for a collinear regression, with when to use each.*

### Remedy 1: drop the redundant predictor

The fastest fix is also the most common. If `disp` duplicates information that `hp + wt` already carry, remove it and watch the VIFs fall.

```r title="Drop disp, refit, and recompute VIFs"
model_drop <- lm(mpg ~ hp + wt, data = mtcars)

# Recompute VIFs manually on the reduced model
predictors_drop <- c("hp", "wt")
vif_drop <- sapply(predictors_drop, function(p) {
  others <- setdiff(predictors_drop, p)
  f <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  1 / (1 - summary(lm(f, data = mtcars))$r.squared)
})
round(vif_drop, 2)
#>   hp   wt
#> 1.77 1.77

round(coef(model_drop), 3)
#> (Intercept)          hp          wt
#>      37.227      -0.032      -3.878
```

Both VIFs drop to 1.77, well inside the safe zone. The coefficients for `hp` and `wt` are now stable and the model has lost nothing meaningful, because `disp` was restating what they already said.

[TIP]
**Drop the predictor your domain expert cares least about, not the one with the highest VIF.** When two variables carry the same information, the regression does not care which one you keep; you do. Choose the one easier to measure, cheaper to collect, or better-understood by stakeholders. The math stays the same.

### Remedy 2: combine predictors with PCA

When every correlated predictor is genuinely meaningful, summarise them into a smaller set of composite features with Principal Component Analysis (PCA). The first component captures the shared signal; regressing on components sidesteps collinearity entirely because the components are orthogonal by construction.

```r title="Principal Components Regression on mtcars"
# Scale the correlated block before PCA
pca <- prcomp(mtcars[, c("hp", "wt", "disp")], scale. = TRUE)
round(pca$sdev^2 / sum(pca$sdev^2), 3)
#> [1] 0.873 0.090 0.037

# First two PCs as new predictors
mtcars_pcs <- data.frame(mpg = mtcars$mpg, PC1 = pca$x[, 1], PC2 = pca$x[, 2])
model_pca <- lm(mpg ~ PC1 + PC2, data = mtcars_pcs)
round(coef(model_pca), 3)
#> (Intercept)         PC1         PC2
#>      20.091      -2.600      -1.170
```

The first component alone absorbs 87 percent of the variance in the three correlated predictors, and regressing `mpg` on `PC1` and `PC2` gives stable coefficients with no possible collinearity between them. The tradeoff is interpretability: PC1 is a linear combination of `hp`, `wt`, and `disp`, not any one of them. You get stability and lose the per-variable coefficient story.

### Remedy 3: shrink coefficients with ridge regression

Ridge regression adds a small penalty $\lambda$ to the sum of squared coefficients. That penalty trades a tiny bit of bias for a large drop in coefficient variance, which is exactly what collinearity makes worse. You can code the closed-form solution from scratch with base R matrix operations:

$$\hat{\beta}_{\text{ridge}} = (X^TX + \lambda I)^{-1} X^T y$$

Where:

- $X$ = the design matrix of centred and scaled predictors
- $y$ = the centred response vector
- $\lambda$ = the ridge penalty (larger values shrink coefficients harder)
- $I$ = the identity matrix

```r title="Ridge regression from first principles"
# Centre and scale predictors, centre response
X_mat <- scale(as.matrix(mtcars[, c("hp", "wt", "disp")]))
y_vec <- mtcars$mpg - mean(mtcars$mpg)

# Closed-form ridge with lambda = 1
lambda <- 1
I_mat <- diag(ncol(X_mat))
beta_ridge <- solve(t(X_mat) %*% X_mat + lambda * I_mat) %*% t(X_mat) %*% y_vec
round(beta_ridge, 3)
#>         [,1]
#> hp    -1.480
#> wt    -2.089
#> disp  -1.107

# Compare with OLS (lambda = 0)
beta_ols <- solve(t(X_mat) %*% X_mat) %*% t(X_mat) %*% y_vec
round(beta_ols, 3)
#>         [,1]
#> hp    -1.005
#> wt    -2.880
#> disp  -0.181
```

Ridge does not zero out `disp` the way drop-the-variable does. Instead it shrinks every coefficient toward zero, with the biggest shrinkage on whichever predictor the OLS estimate had least confidence in. The `disp` coefficient moves from -0.181 (tiny and uncertain) to -1.107 (a moderated share of the collinear block), and `wt` eases from -2.880 to -2.089.

[KEY INSIGHT]
**Ridge trades a tiny bit of bias for a big drop in coefficient variance.** Under multicollinearity, OLS estimates are unbiased but wildly variable. Ridge biases them slightly toward zero, but the shrinkage kills the variance explosion so predictions on new data are more accurate. Use ridge when all correlated predictors matter and you care more about prediction than causal coefficient interpretation.

In real projects you do not hand-pick $\lambda$ from a single number either. You cross-validate over a grid of penalties and let the data choose the one that minimises prediction error, and that is what the `glmnet` package is built to do.

[NOTE]
**`glmnet` is the production ridge path.** Use `library(glmnet)` and `cv.glmnet(X, y, alpha = 0)` in RStudio to cross-validate the penalty and get the regularisation path for many lambdas at once. The `glmnet` package is not available in this page's browser runtime, so the examples use base R matrix ops. Install once with `install.packages("glmnet")` and the function is available for every future project.

**Try it:** Drop `disp` from a three-predictor model and refit, then confirm both VIFs land below 5. Fit `ex_model_fixed <- lm(mpg ~ hp + wt, data = mtcars)` and compute VIFs manually.

```r title="Your turn: confirm the remedy"
ex_predictors <- c("hp", "wt")
ex_model_fixed <- lm(mpg ~ hp + wt, data = mtcars)
# your code here: compute manual VIFs and round to 2 dp
#> Expected: both VIFs under 2.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Remedy verification solution"
ex_predictors <- c("hp", "wt")
ex_vifs_fixed <- sapply(ex_predictors, function(p) {
  others <- setdiff(ex_predictors, p)
  f <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  1 / (1 - summary(lm(f, data = mtcars))$r.squared)
})
round(ex_vifs_fixed, 2)
#>   hp   wt
#> 1.77 1.77
```

Both VIFs are 1.77, identical and safely below 5. Dropping the redundant predictor is often the simplest and most communicable remedy.

</details>

## Practice Exercises

### Exercise 1: Simulate collinearity

Generate two near-identical predictors and confirm that even when the true data-generating coefficients are different, the regression cannot recover them. Set the seed to 2026 for reproducibility. Save the fitted model to `my_sim_model`.

```r title="Exercise 1: simulate collinearity"
set.seed(2026)
my_x1 <- rnorm(200)
# your code here: create my_x2 = my_x1 + small noise, my_y = 2*my_x1 + 3*my_x2 + noise
# fit my_sim_model <- lm(my_y ~ my_x1 + my_x2)
# compute manual VIF and compare coefficients to true values (2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simulated collinearity solution"
set.seed(2026)
my_x1 <- rnorm(200)
my_x2 <- my_x1 + 0.05 * rnorm(200)
my_y <- 2 * my_x1 + 3 * my_x2 + rnorm(200)

my_sim_model <- lm(my_y ~ my_x1 + my_x2)
round(coef(my_sim_model), 3)
#> (Intercept)       my_x1       my_x2
#>       0.018       1.857       3.136

# Manual VIF for the two predictors
r2_x1 <- summary(lm(my_x1 ~ my_x2))$r.squared
r2_x2 <- summary(lm(my_x2 ~ my_x1))$r.squared
round(c(x1 = 1 / (1 - r2_x1), x2 = 1 / (1 - r2_x2)), 1)
#>    x1    x2
#> 401.0 401.0
```

VIFs of 401 tell you the predictors carry the same information. The coefficients come out close to 1.86 and 3.14, which happen to land near the true (2, 3) because the sample size is large and the noise is small. Try reducing `n` to 20 and you will see the two coefficients swing far from the truth despite the data being generated cleanly.

</details>

### Exercise 2: Full diagnostic pipeline

On `mtcars`, fit the five-predictor model `mpg ~ hp + disp + wt + drat + qsec`. Compute manual VIFs for each predictor, the `kappa()` condition number on the scaled predictors, and the correlation matrix. Decide which variable to drop based on the highest VIF. Save the refit model to `my_cleaned_model` and print its VIFs.

```r title="Exercise 2: full diagnostic pipeline"
my_full <- lm(mpg ~ hp + disp + wt + drat + qsec, data = mtcars)
# your code here: compute VIFs, kappa(), cor(), pick one to drop, refit
```

<details>
<summary>Click to reveal solution</summary>

```r title="Full diagnostic pipeline solution"
my_full <- lm(mpg ~ hp + disp + wt + drat + qsec, data = mtcars)

my_vars <- c("hp", "disp", "wt", "drat", "qsec")
my_vifs <- sapply(my_vars, function(p) {
  others <- setdiff(my_vars, p)
  f <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  1 / (1 - summary(lm(f, data = mtcars))$r.squared)
})
round(my_vifs, 2)
#>    hp  disp    wt  drat  qsec
#>  5.31 10.39  8.63  2.97  6.11

round(kappa(scale(mtcars[, my_vars])), 2)
#> [1] 9.17

# disp has the highest VIF, so drop it
my_cleaned_model <- lm(mpg ~ hp + wt + drat + qsec, data = mtcars)
my_new_vars <- c("hp", "wt", "drat", "qsec")
my_new_vifs <- sapply(my_new_vars, function(p) {
  others <- setdiff(my_new_vars, p)
  f <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  1 / (1 - summary(lm(f, data = mtcars))$r.squared)
})
round(my_new_vifs, 2)
#>    hp    wt  drat  qsec
#>  3.35  4.84  2.78  2.43
```

Dropping `disp` brings every remaining VIF below 5, which is the clean result the model was asking for.

</details>

### Exercise 3: PCA remedy

Take the same five predictors from exercise 2. Run `prcomp()` on them (with scaling), keep the first two principal components, and fit `my_pc_model <- lm(mpg ~ PC1 + PC2, data = ...)`. Compare the R-squared of `my_pc_model` with that of `my_full` from exercise 2.

```r title="Exercise 3: PCA remedy"
my_vars <- c("hp", "disp", "wt", "drat", "qsec")
# your code here: prcomp with scale. = TRUE, build a data frame with mpg + PC1 + PC2, fit my_pc_model
```

<details>
<summary>Click to reveal solution</summary>

```r title="PCA remedy solution"
my_vars <- c("hp", "disp", "wt", "drat", "qsec")
my_pca <- prcomp(mtcars[, my_vars], scale. = TRUE)
round(my_pca$sdev^2 / sum(my_pca$sdev^2), 3)
#> [1] 0.734 0.180 0.052 0.020 0.014

my_pc_df <- data.frame(mpg = mtcars$mpg,
                       PC1 = my_pca$x[, 1],
                       PC2 = my_pca$x[, 2])
my_pc_model <- lm(mpg ~ PC1 + PC2, data = my_pc_df)

round(summary(my_pc_model)$r.squared, 3)
#> [1] 0.825

my_full <- lm(mpg ~ hp + disp + wt + drat + qsec, data = mtcars)
round(summary(my_full)$r.squared, 3)
#> [1] 0.851
```

Two principal components capture 91 percent of the predictor variance and explain 82.5 percent of `mpg` variance. The five-predictor model explains 85.1 percent, barely better. The PC model is more stable and barely less accurate, which is usually the right trade when collinearity is high.

</details>

## Complete Example

The `longley` dataset is a small economic time series from 1947 to 1962 and is the textbook example of multicollinearity. Let's run the full pipeline end to end.

```r title="Longley: detect and fix multicollinearity"
# Full model: six highly correlated predictors
long_model <- lm(Employed ~ GNP.deflator + GNP + Unemployed + Armed.Forces +
                   Population + Year, data = longley)
round(summary(long_model)$coefficients, 3)
#>               Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  -3482.259   890.420  -3.911    0.004
#> GNP.deflator     0.015     0.085   0.177    0.863
#> GNP             -0.036     0.033  -1.070    0.313
#> Unemployed      -0.020     0.005  -4.136    0.003
#> Armed.Forces    -0.010     0.002  -4.822    0.001
#> Population      -0.051     0.226  -0.226    0.826
#> Year             1.829     0.455   4.016    0.003

# Manual VIFs
long_vars <- c("GNP.deflator", "GNP", "Unemployed", "Armed.Forces", "Population", "Year")
long_vifs <- sapply(long_vars, function(p) {
  others <- setdiff(long_vars, p)
  f <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  1 / (1 - summary(lm(f, data = longley))$r.squared)
})
round(long_vifs, 1)
#> GNP.deflator          GNP   Unemployed Armed.Forces   Population         Year
#>        135.5       1788.5         33.6          3.6        399.2        758.9

# Condition number on scaled predictors
round(kappa(scale(longley[, long_vars])), 1)
#> [1] 43.3

# Drop GNP (highest VIF at 1788) and refit
long_fixed <- lm(Employed ~ GNP.deflator + Unemployed + Armed.Forces +
                   Population + Year, data = longley)
long_vars_fixed <- c("GNP.deflator", "Unemployed", "Armed.Forces", "Population", "Year")
long_vifs_fixed <- sapply(long_vars_fixed, function(p) {
  others <- setdiff(long_vars_fixed, p)
  f <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  1 / (1 - summary(lm(f, data = longley))$r.squared)
})
round(long_vifs_fixed, 1)
#> GNP.deflator   Unemployed Armed.Forces   Population         Year
#>        101.2          8.0          3.5        297.5        378.4
```

Every VIF in the full model is in the three-digit or four-digit range, and the condition number of 43.3 confirms a near-singular design. Dropping the worst offender, `GNP`, barely helps: `Year` and `Population` still have VIFs in the hundreds because the dataset is a tight economic time series where everything trends together.

The right answer for `longley` is not a single drop. You would keep one time-series indicator (usually `Year`), combine the economic variables into an index or principal component, and accept that six nearly-identical trend variables cannot be separated even by the most careful regression. This is the lesson the dataset was built to teach.

## Summary

| Step | What to run | What it tells you |
|---|---|---|
| Detect instability | `lm()` full vs reduced + `confint()` | Coefficients that swing or cross zero signal collinearity |
| Quantify | Manual VIF loop or `car::vif(model)` | VIF > 5 is worth investigating, > 10 is urgent |
| Confirm with a second lens | `kappa(scale(X))` and `cor(X)` | Condition number > 30 is collinear even with low VIFs |
| Factors | `car::vif(model)` and read GVIF^(1/(2 Df)) | Compare to VIF thresholds via the adjusted column |
| Fix | Drop / PCA / ridge | Drop for clarity, PCA to combine, ridge for prediction |

The short version: run `lm()`, read the VIFs, confirm with `kappa()` and `cor()`, then pick the remedy that matches what you need from the model. Causal interpretation of a single coefficient means drop or combine. Accurate prediction with every predictor kept means ridge.

## References

1. Fox, J. & Weisberg, S., *An R Companion to Applied Regression*, 3rd edition. Sage (2019). Chapter on regression diagnostics and the `car` package. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
2. Kutner, M. H., Nachtsheim, C. J., Neter, J. & Li, W., *Applied Linear Statistical Models*, 5th edition. McGraw-Hill (2005). Chapter 10: Multicollinearity and its effects.
3. Hoerl, A. E. & Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. *Technometrics*, 12(1), 55-67. [Link](https://www.jstor.org/stable/1267351)
4. Belsley, D. A., Kuh, E. & Welsch, R. E., *Regression Diagnostics: Identifying Influential Data and Sources of Collinearity*. Wiley (1980). The condition-number reference.
5. James, G., Witten, D., Hastie, T. & Tibshirani, R., *An Introduction to Statistical Learning with Applications in R*, 2nd edition. Springer (2021). Chapter 3: Linear Regression. [Link](https://www.statlearning.com/)
6. CRAN, `car::vif()` reference page. [Link](https://cran.r-project.org/web/packages/car/car.pdf)
7. Longley, J. W. (1967). An Appraisal of Least Squares Programs for the Electronic Computer from the Point of View of the User. *Journal of the American Statistical Association*, 62(319), 819-841.

## Continue Learning

1. [Linear Regression](Linear-Regression.html), the full `lm()` workflow from fitting to interpretation, for when you want to make sure the base model is solid before reaching for diagnostics.
2. [Variable Selection and Importance With R](Variable-Selection-and-Importance-With-R.html), a broader look at feature selection methods beyond VIF, including stepwise selection and importance metrics.
3. [Outlier Treatment With R](Outlier-Treatment-With-R.html), another core regression diagnostic; collinearity and outliers often interact and are best handled together.
