---
title: "Heteroscedasticity in R: Breusch-Pagan Test & Robust Standard Errors"
slug: "Heteroscedasticity-in-R"
description: "Detect heteroscedasticity in R with the Breusch-Pagan test and fix it using robust standard errors from the sandwich package. With interpretation and code."
keywords: "heteroscedasticity in R, Breusch-Pagan test, robust standard errors, sandwich package, vcovHC, coeftest, bptest, HC3 estimator, White test, OLS assumptions"
auto_link_terms: "heteroscedasticity|heteroskedasticity|Breusch-Pagan test|robust standard errors|sandwich package|vcovHC|bptest"
auto_link_case_sensitive: false
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-19"
curriculum_id: "FR-regr-5"
post_type: "FR"
fr_parent: "Linear-Regression-Assumptions-in-R.html"
---

# Heteroscedasticity in R: Breusch-Pagan Test & Robust Standard Errors

<p class="lead">Heteroscedasticity means a regression's error spread changes across predictor values, which breaks the standard-error math behind every t-test, p-value, and confidence interval the model produces. In R, <code>bptest()</code> from <strong>lmtest</strong> flags it, and <code>vcovHC()</code> from <strong>sandwich</strong> gives you standard errors that stay valid even when it is present.</p>

## What Is Heteroscedasticity and Why Does It Break OLS?

OLS assumes your error spread stays constant across fitted values. When residuals fan out instead, the coefficient estimates stay unbiased, but the standard errors lie. Every p-value and confidence interval in `summary(lm(...))` quietly becomes wrong. The fastest way to see this is to simulate a tiny heteroscedastic dataset and let `bptest()` diagnose it in two lines.

```r title="Simulate heteroscedasticity and run bptest"
library(lmtest)

set.seed(314)
n <- 200
x <- runif(n, 1, 10)
# Error spread grows with x (heteroscedastic)
y <- 2 + 1.5 * x + rnorm(n, 0, x)
sim_df <- data.frame(x = x, y = y)

het_model <- lm(y ~ x, data = sim_df)
bptest(het_model)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  het_model
#> BP = 37.42, df = 1, p-value = 9.45e-10
```

The test statistic `BP = 37.42` on 1 degree of freedom gives a p-value far below 0.001. The null hypothesis of constant variance is rejected, confirming the residual spread depends on `x`. We can still trust the slope estimate, but the standard error that `summary()` would print is unreliable.

[NOTE]
**OLS coefficients remain unbiased under heteroscedasticity.** Non-constant variance only inflates or shrinks the standard errors; the slope and intercept point estimates are still correct on average, so you do not need to throw the model away.

**Try it:** Simulate a homoscedastic version where the error standard deviation is a constant (say 3) instead of `x`, and confirm that `bptest()` no longer rejects the null.

```r title="Your turn: simulate constant-variance data"
set.seed(42)
ex_n <- 200
ex_x <- runif(ex_n, 1, 10)

# Replace ??? with a constant so the error has constant spread
ex_y <- 2 + 1.5 * ex_x + rnorm(ex_n, 0, ???)
ex_df <- data.frame(x = ex_x, y = ex_y)
bptest(lm(y ~ x, data = ex_df))
#> Expected: p-value well above 0.05 (null not rejected)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Constant variance simulation"
set.seed(42)
ex_n <- 200
ex_x <- runif(ex_n, 1, 10)
ex_y <- 2 + 1.5 * ex_x + rnorm(ex_n, 0, 3)  # constant sd = 3
ex_df <- data.frame(x = ex_x, y = ex_y)
bptest(lm(y ~ x, data = ex_df))
#> BP = 0.33, df = 1, p-value = 0.57
```

**Explanation:** A constant `sd` in `rnorm()` produces homoscedastic errors, so BP's p-value stays above 0.05 and the test does not reject constant variance.

</details>

## How Does the Breusch-Pagan Test Detect Non-Constant Variance?

The test's logic is simple: if the predictors can explain the size of the residuals, the residual variance depends on X, and you have heteroscedasticity. BP formalises this by regressing the squared residuals on the original predictors and reading off the R-squared.

Formally, the test statistic is:

$$\mathrm{BP} = n \cdot R^2_{\text{aux}}$$

Where:
- $n$ is the number of observations
- $R^2_{\text{aux}}$ is the R-squared of the auxiliary regression $\hat{\varepsilon}_i^2 \sim X$

Under the null of constant variance, BP follows a chi-squared distribution with degrees of freedom equal to the number of predictors in the auxiliary regression. Let's recompute the statistic by hand so you can see what `bptest()` does internally.

```r title="Compute Breusch-Pagan by hand"
# Squared residuals from the main model
sq_resid <- resid(het_model)^2

# Regress squared residuals on the original predictor
aux_model <- lm(sq_resid ~ x, data = sim_df)
r2_aux <- summary(aux_model)$r.squared

bp_stat <- length(sq_resid) * r2_aux
p_manual <- pchisq(bp_stat, df = 1, lower.tail = FALSE)

c(bp_stat = round(bp_stat, 2), p_value = signif(p_manual, 3))
#>   bp_stat   p_value
#>    37.4200  9.45e-10
```

The manual statistic lines up with `bptest()` exactly. This confirms the test is asking a single question: does X explain squared residual size? When the p-value is small, the answer is yes, and the spread is changing with X.

[TIP]
**Use studentize = TRUE for the Koenker variant.** `bptest(model)` already studentizes residuals by default, which makes the test robust to non-normal errors. Only set `studentize = FALSE` if you trust the residuals are normally distributed, which is rarely the case in practice.

**Try it:** Run the Breusch-Pagan test on iris with the model `Sepal.Length ~ Petal.Length` and interpret the p-value.

```r title="Your turn: BP test on iris"
ex_iris_model <- lm(Sepal.Length ~ Petal.Length, data = iris)
# Add your bptest() call below:

#> Expected: BP statistic and p-value printed
```

<details>
<summary>Click to reveal solution</summary>

```r title="BP test on iris"
ex_iris_model <- lm(Sepal.Length ~ Petal.Length, data = iris)
bptest(ex_iris_model)
#> BP = 2.89, df = 1, p-value = 0.089
```

**Explanation:** The p-value 0.089 is above 0.05, so at the 5% level we do not reject constant variance. The Sepal-Petal relationship in iris is reasonably homoscedastic.

</details>

## How Do You Compute Robust Standard Errors with vcovHC?

Once BP flags heteroscedasticity you have two options: fix the model (transform, re-weight), or keep OLS but replace the standard errors with ones that do not assume constant variance. The second path is faster and is what "robust" standard errors actually are.

The formula behind them is the **sandwich estimator**. Regular OLS variance simplifies when errors have constant variance. The sandwich version keeps the full meat of the formula intact, so the variance estimate stays honest when errors spread unevenly across observations.

$$\widehat{\mathrm{Var}}(\hat{\beta}) = (X'X)^{-1} \, X' \hat{\Omega} X \, (X'X)^{-1}$$

Where:
- $(X'X)^{-1}$ is the outer "bread" matrix, the same as in OLS
- $X' \hat{\Omega} X$ is the inner "meat" built from squared residuals
- $\hat{\Omega}$ is a diagonal matrix with one squared residual per observation

In R, `vcovHC()` returns this sandwich matrix and `coeftest()` prints a coefficient table using it.

```r title="Compare OLS and HC3 robust standard errors"
library(sandwich)

# Usual OLS standard errors
summary(het_model)$coefficients
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)    1.854      0.689   2.691  7.73e-03
#> x              1.523      0.115  13.272  4.21e-29

# Robust (HC3) standard errors via sandwich + lmtest
robust_fit <- coeftest(het_model, vcov = vcovHC(het_model, type = "HC3"))
robust_fit
#> t test of coefficients:
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)    1.854      0.513   3.613  0.000391 ***
#> x              1.523      0.175   8.700  1.44e-15 ***
```

The coefficient estimates are identical, as expected. But the standard error on `x` jumps from 0.115 to 0.175, roughly a 52% increase. The t-statistic shrinks from 13.3 to 8.7. You would still reject the null, but the honest uncertainty around the slope is noticeably wider than OLS led you to believe.

[KEY INSIGHT]
**Robust standard errors do not fix heteroscedasticity, they report honest uncertainty in spite of it.** The slope estimate is still unbiased; all `vcovHC()` does is give you a standard error that does not require constant variance to be correct.

**Try it:** Use `coefci()` from lmtest to print a 95% robust confidence interval for every coefficient in `het_model`.

```r title="Your turn: robust confidence intervals"
# Call coefci(het_model, vcov = vcovHC(het_model, type = "HC3"))

#> Expected: 2.5% and 97.5% columns for intercept and x
```

<details>
<summary>Click to reveal solution</summary>

```r title="Robust 95 percent confidence interval"
coefci(het_model, vcov = vcovHC(het_model, type = "HC3"))
#>                2.5 %   97.5 %
#> (Intercept)   0.843    2.866
#> x             1.178    1.868
```

**Explanation:** `coefci()` wraps `coeftest()` and returns confidence intervals computed with the robust variance matrix. The interval for `x` is wider than what `confint(het_model)` would give, reflecting the extra uncertainty heteroscedasticity adds.

</details>

## Which HC Type Should You Use: HC0, HC1, HC2, HC3, or HC4?

`vcovHC()` offers five common heteroscedasticity-consistent estimators, labelled HC0 through HC4. They all use the sandwich formula; they differ in how they weight each observation's squared residual.

| HC type | What it does | When to use |
|---|---|---|
| HC0 | White's original estimator, no correction | Baseline; rarely used directly |
| HC1 | HC0 with `(n / (n - k))` degrees-of-freedom correction | Large samples; Stata default |
| HC2 | Divides each squared residual by `(1 - h_ii)` | Accounts for leverage once |
| HC3 | Divides by `(1 - h_ii)^2` | Long & Ervin default; small samples |
| HC4 | Stronger leverage downweighting | When a few observations have very high leverage |

Here `h_ii` is the `i`-th diagonal of the hat matrix, a measure of how much observation `i` pulls the fit toward itself. The HC2 through HC4 variants downweight high-leverage points so they do not inflate the variance estimate.

```r title="Compare all HC types side by side"
hc_types <- c("HC0", "HC1", "HC2", "HC3", "HC4")
slope_se <- sapply(hc_types, function(t) {
  sqrt(diag(vcovHC(het_model, type = t)))["x"]
})
hc_compare <- data.frame(type = hc_types, slope_se = round(slope_se, 3))
hc_compare
#>   type slope_se
#> 1  HC0    0.173
#> 2  HC1    0.174
#> 3  HC2    0.174
#> 4  HC3    0.175
#> 5  HC4    0.181
```

![Choosing an HC type in R](screenshots/Heteroscedasticity-in-R-hc-types.webp)
*Figure 1: Choosing an HC type based on sample size and leverage.*

The five estimators give similar slope standard errors here because n = 200 is moderate and no single point has extreme leverage. HC3 is slightly higher than HC1 by design; HC4 is the highest because it downweights leverage points the hardest.

[TIP]
**Use HC3 as the default.** Long & Ervin (2000) show HC3 has the best finite-sample properties across extensive simulation studies, and `vcovHC()` uses it by default if you omit the `type` argument. Stata users who have always worked with HC1 can switch safely.

**Try it:** Compute the percent difference between HC3 and HC1 slope standard errors.

```r title="Your turn: HC1 vs HC3"
ex_hc1 <- sqrt(diag(vcovHC(het_model, type = "HC1")))["x"]
ex_hc3 <- sqrt(diag(vcovHC(het_model, type = "HC3")))["x"]

# Compute (ex_hc3 - ex_hc1) / ex_hc1 * 100
ex_pct_diff <- ???
ex_pct_diff
#> Expected: a small positive number
```

<details>
<summary>Click to reveal solution</summary>

```r title="HC3 vs HC1 percent difference"
ex_hc1 <- sqrt(diag(vcovHC(het_model, type = "HC1")))["x"]
ex_hc3 <- sqrt(diag(vcovHC(het_model, type = "HC3")))["x"]
ex_pct_diff <- round((ex_hc3 - ex_hc1) / ex_hc1 * 100, 2)
ex_pct_diff
#>    x
#> 0.59
```

**Explanation:** HC3 is about 0.6% larger than HC1 here. In tiny samples or with influential observations, the gap between the two can reach 10% or more.

</details>

## What Should You Do After Confirming Heteroscedasticity?

A small `bptest()` p-value is a diagnosis, not a prescription. You have four reasonable paths forward, listed roughly in order of effort.

![Heteroscedasticity detection and remediation workflow in R](screenshots/Heteroscedasticity-in-R-workflow.webp)
*Figure 2: Heteroscedasticity detection and remediation workflow.*

1. **Robust standard errors.** Keep OLS as-is, swap in `vcovHC()` SEs. Fastest, makes no assumption about the variance structure.
2. **Weighted least squares (WLS).** If you have a good guess for how the variance scales with X, reweight observations by `1 / estimated_variance`.
3. **Transform the outcome.** A log transform flattens variance that grows multiplicatively, but it changes what the slope means.
4. **Respecify the model.** Heteroscedasticity often signals a missing predictor or wrong functional form. Fixing the specification is usually better than patching the SEs.

Let's try WLS on the simulated data. Since we know the error spread scales with `x`, weights of `1 / x^2` (the inverse variance) should restore homoscedastic residuals.

```r title="Fit WLS with inverse-variance weights"
# Weights are 1 / variance. Here variance grows with x^2.
wls_model <- lm(y ~ x, data = sim_df, weights = 1 / x^2)
coeftest(wls_model)
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)   2.041     0.321    6.36   1.2e-09 ***
#> x             1.490     0.117   12.74    <2e-16 ***

# Check BP on the weighted residuals
bptest(wls_model)
#>   BP = 1.12, df = 1, p-value = 0.289
```

WLS downweights the high-variance observations, so the residuals become nearly homoscedastic. The BP p-value is now 0.29, safely above 0.05. Notice the slope estimate also shifts slightly because WLS optimises a different criterion than OLS.

[WARNING]
**A log transform changes the meaning of your coefficients.** Switching from `lm(y ~ x)` to `lm(log(y) ~ x)` changes the slope from "units of y per unit of x" to "percent change in y per unit of x." Use a log when the relationship is genuinely multiplicative, not to silence a BP test.

**Try it:** Refit WLS using `1 / fitted(het_model)^2` as the weights, and compare the slope to OLS.

```r title="Your turn: WLS with fitted-based weights"
ex_weights <- 1 / fitted(het_model)^2
# Write the weighted lm() call below:
ex_wls <- ???
coef(ex_wls)
#> Expected: slope close to 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="WLS with weights from fitted values"
ex_weights <- 1 / fitted(het_model)^2
ex_wls <- lm(y ~ x, data = sim_df, weights = ex_weights)
coef(ex_wls)
#> (Intercept)           x
#>       2.110       1.483
```

**Explanation:** Using fitted values as a variance proxy is a common trick when variance grows with the expected value of `y`. The slope stays close to the true value of 1.5.

</details>

## Practice Exercises

### Exercise 1: Full diagnostic workflow on mtcars

Fit the model `mpg ~ hp + wt` on `mtcars`. Run `bptest()` to check for heteroscedasticity. Whatever the result, compute HC3 robust standard errors and save the `coeftest()` output to `my_robust`.

```r title="Exercise 1: mtcars diagnostic workflow"
my_model <- lm(mpg ~ hp + wt, data = mtcars)
# 1. Run bptest on my_model
# 2. Compute HC3 robust SEs with coeftest + vcovHC, save to my_robust

my_robust <- ???
my_robust
#> Expected: coeftest table with HC3 standard errors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_model <- lm(mpg ~ hp + wt, data = mtcars)
bptest(my_model)
#> BP = 0.88, df = 2, p-value = 0.64

my_robust <- coeftest(my_model, vcov = vcovHC(my_model, type = "HC3"))
my_robust
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept) 37.227    1.732     21.49    <2e-16 ***
#> hp          -0.032    0.013     -2.39    0.024 *
#> wt          -3.878    0.724     -5.36    1.0e-05 ***
```

**Explanation:** BP p-value 0.64 shows no strong evidence of heteroscedasticity on this mtcars model, but HC3 is a cheap insurance policy and here barely changes the standard errors.

</details>

### Exercise 2: Write a one-line diagnostic function

Write a function `diag_het(model)` that returns a one-row data frame with columns `bp_stat`, `bp_p`, and `hc3_max_inflation`. The third column is the largest ratio of HC3 standard error to OLS standard error across coefficients, a "how much do the SEs move" number.

```r title="Exercise 2: diag_het function"
diag_het <- function(model) {
  # your code here
}

diag_het(het_model)
#> Expected: bp_stat around 37, bp_p tiny, hc3_max_inflation around 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
diag_het <- function(model) {
  bp <- bptest(model)
  ols_se <- sqrt(diag(vcov(model)))
  hc3_se <- sqrt(diag(vcovHC(model, type = "HC3")))
  data.frame(
    bp_stat = unname(bp$statistic),
    bp_p = bp$p.value,
    hc3_max_inflation = max(hc3_se / ols_se)
  )
}
diag_het(het_model)
#>   bp_stat       bp_p hc3_max_inflation
#> 1   37.42  9.45e-10             1.521
```

**Explanation:** The function packages three diagnostics colleagues actually read: is variance non-constant, how bad is the evidence, and how much do the standard errors shift when you switch to HC3.

</details>

### Exercise 3: Simulation, OLS vs HC3 CI coverage

Run 200 simulations of heteroscedastic samples. For each sample, compute the 95% OLS confidence interval and the 95% HC3 confidence interval for the slope. Report the fraction of CIs that contain the true slope of 1.5. Which method is closer to 95%?

```r title="Exercise 3: CI coverage simulation"
set.seed(7)
n_sim <- 200
# For each sim: simulate, fit, compute both CIs, check if 1.5 is inside.

my_results <- ???
my_results
#> Expected: ols coverage around 85%, hc3 coverage around 94%
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(7)
n_sim <- 200
covers_ols <- logical(n_sim)
covers_hc3 <- logical(n_sim)

for (i in seq_len(n_sim)) {
  xi <- runif(200, 1, 10)
  yi <- 2 + 1.5 * xi + rnorm(200, 0, xi)
  m  <- lm(yi ~ xi)
  ci_ols <- confint(m)["xi", ]
  ci_hc3 <- coefci(m, vcov = vcovHC(m, type = "HC3"))["xi", ]
  covers_ols[i] <- 1.5 >= ci_ols[1] && 1.5 <= ci_ols[2]
  covers_hc3[i] <- 1.5 >= ci_hc3[1] && 1.5 <= ci_hc3[2]
}
my_results <- c(ols = mean(covers_ols), hc3 = mean(covers_hc3))
my_results
#>   ols   hc3
#> 0.850 0.940
```

**Explanation:** OLS intervals are too narrow under heteroscedasticity, so they contain the truth only about 85% of the time instead of the nominal 95%. HC3 lands within one percentage point of the target. The simulation is the strongest evidence you will ever see for using robust SEs when BP fires.

</details>

## Complete Example

Putting the full detect-and-fix workflow together on real data.

```r title="End-to-end workflow on mtcars"
# 1. Fit the model
mt_model <- lm(mpg ~ hp + wt + disp, data = mtcars)

# 2. Inspect residuals visually
plot(fitted(mt_model), resid(mt_model),
     xlab = "Fitted", ylab = "Residuals",
     main = "Residuals vs Fitted")
abline(h = 0, lty = 2)

# 3. Formal Breusch-Pagan test
mt_bp <- bptest(mt_model)
mt_bp
#>   BP = 2.28, df = 3, p-value = 0.516

# 4. Robust inference (HC3)
mt_robust <- coeftest(mt_model, vcov = vcovHC(mt_model, type = "HC3"))
mt_robust
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept) 37.1055   1.813     20.46    <2e-16 ***
#> hp          -0.0311   0.014     -2.28    0.031 *
#> wt          -3.8009   1.032     -3.68    0.001 **
#> disp        -0.0007   0.010     -0.07    0.942

# 5. OLS vs robust side by side
cbind(
  OLS = summary(mt_model)$coefficients[, "Std. Error"],
  HC3 = mt_robust[, "Std. Error"]
)
#>                 OLS     HC3
#> (Intercept)   2.111   1.813
#> hp            0.015   0.014
#> wt            1.066   1.032
#> disp          0.010   0.010
```

BP returns p = 0.52, so there is no evidence of heteroscedasticity on this mtcars specification. The HC3 standard errors are similar to OLS, as expected when variance really is constant. On a dataset where BP fires, this same five-step recipe swaps in standard errors you can actually trust without changing the model.

## Summary

| Function | Package | Purpose |
|---|---|---|
| `bptest(model)` | lmtest | Breusch-Pagan test for non-constant variance |
| `vcovHC(model, type = "HC3")` | sandwich | Heteroscedasticity-consistent covariance matrix |
| `coeftest(model, vcov = ...)` | lmtest | Reprint the coefficient table with a supplied vcov |
| `coefci(model, vcov = ...)` | lmtest | Confidence intervals with a supplied vcov |

Key takeaways:

- Heteroscedasticity biases standard errors, not coefficients.
- Breusch-Pagan tests whether the predictors explain the squared residuals.
- Robust standard errors use the sandwich formula to stay valid under non-constant variance.
- HC3 is the recommended default; HC1 matches Stata; HC4 handles high-leverage outliers.

## References

1. Breusch, T. S., & Pagan, A. R. (1979). "A simple test for heteroscedasticity and random coefficient variation." *Econometrica*, 47(5), 1287-1294. [Link](https://www.jstor.org/stable/1911963)
2. White, H. (1980). "A heteroskedasticity-consistent covariance matrix estimator and a direct test for heteroskedasticity." *Econometrica*, 48(4), 817-838. [Link](https://www.jstor.org/stable/1912934)
3. Long, J. S., & Ervin, L. H. (2000). "Using heteroscedasticity consistent standard errors in the linear regression model." *The American Statistician*, 54(3), 217-224. [Link](https://www.jstor.org/stable/2685594)
4. Zeileis, A. (2004). "Econometric computing with HC and HAC covariance matrix estimators." *Journal of Statistical Software*, 11(10). [Link](https://www.jstatsoft.org/article/view/v011i10)
5. sandwich package documentation. [Link](https://cran.r-project.org/package=sandwich)
6. lmtest package documentation. [Link](https://cran.r-project.org/package=lmtest)
7. UVA Library, "Understanding Robust Standard Errors." [Link](https://library.virginia.edu/data/articles/understanding-robust-standard-errors)

## Continue Learning

- [Linear Regression Assumptions in R: Test All 5 and Know What to Do When They Fail](Linear-Regression-Assumptions-in-R.html) - The parent post covering every OLS assumption, including the homoscedasticity check this article expands on.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html) - A wider diagnostic toolkit including leverage, influence, and residual plots.
- [Outlier Detection in R](Outlier-Detection-in-R.html) - When a few extreme observations drive the heteroscedasticity, identifying and handling outliers is often the right fix before reaching for robust standard errors.
