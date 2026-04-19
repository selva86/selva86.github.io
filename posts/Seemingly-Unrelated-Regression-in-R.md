---
title: "Seemingly Unrelated Regression (SUR) in R: systemfit Package"
slug: Seemingly-Unrelated-Regression-in-R
description: "Fit seemingly unrelated regression (SUR) in R with systemfit. Estimate multiple equations jointly for efficiency gains over OLS, plus cross-equation tests."
keywords: "seemingly unrelated regression, SUR R, systemfit, multiple equation regression, Zellner SUR, FGLS, cross-equation correlation, simultaneous equations R"
auto_link_terms: "seemingly unrelated regression|SUR regression|systemfit package|Zellner SUR|cross-equation correlation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-20
post_type: FR
fr_parent: Multiple-Regression-in-R.html
difficulty: Intermediate
---

# Seemingly Unrelated Regression (SUR) in R: systemfit Package

<p class="lead">Seemingly unrelated regression (SUR) fits a system of linear equations jointly when their error terms are correlated within the same observation. In R, the <code>systemfit</code> package estimates SUR with feasible generalised least squares in one line. SUR gives you smaller standard errors than running each equation through separate <code>lm()</code> calls, and it lets you test hypotheses that span both equations.</p>

## When should you use seemingly unrelated regression?

You reach for SUR when you have two or more regression equations whose predictors may differ, but whose errors share a common shock per observation. Households, firms, and plants react to the same unobserved jolt in the same year, row, or region, so the residuals end up correlated even though the equations look independent. `systemfit()` turns that correlation into an efficiency gain. Here is the whole workflow on `iris`, with two flower-width equations sharing petal predictors.

```r title="Fit a SUR system on iris in one call"
# Load the systemfit package and the iris data
library(systemfit)
data(iris)

# Two equations that share predictors but have different outcomes
eq_sepal <- Sepal.Length ~ Petal.Length + Petal.Width
eq_petal <- Sepal.Width  ~ Petal.Length + Petal.Width

# Fit jointly with SUR
fit <- systemfit(list(eq_sepal = eq_sepal, eq_petal = eq_petal),
                 method = "SUR", data = iris)

# Residual correlation across equations is the heart of SUR
cor(residuals(fit))
#>            eq_sepal   eq_petal
#> eq_sepal  1.0000000  0.3208583
#> eq_petal  0.3208583  1.0000000
```

The off-diagonal entry, `0.32`, is the cross-equation residual correlation. That number is the licence to use SUR. When two observations land above their predicted `Sepal.Length`, they also tend to land above their predicted `Sepal.Width`. Separate `lm()` calls would ignore that pattern; SUR uses it to sharpen both equations at once. If the off-diagonal had been near zero, SUR and OLS would return essentially the same numbers and you could skip the extra machinery.

[NOTE]
**SUR is two-step feasible GLS under the hood.** `systemfit()` fits each equation by OLS, estimates the residual covariance matrix from those fits, then re-fits the whole system with generalised least squares using that covariance. You see a single `systemfit` object, but two rounds of estimation happened.

**Try it:** Fit a SUR system on `mtcars` with two equations, `mpg ~ wt + hp` and `qsec ~ wt + hp`. Save the fit to `ex_fit1` and print the coefficient of `wt` in the first equation.

```r title="Your turn: SUR on mtcars"
# Try it: fit a SUR system on mtcars
ex_eq1 <- mpg  ~ wt + hp
ex_eq2 <- qsec ~ wt + hp

ex_fit1 <- # your code here

# Extract wt coefficient from equation 1
coef(ex_fit1)["eq1_wt"]
#> Expected: a negative number near -3.88
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars SUR solution"
ex_fit1 <- systemfit(list(eq1 = ex_eq1, eq2 = ex_eq2),
                     method = "SUR", data = mtcars)
coef(ex_fit1)["eq1_wt"]
#>    eq1_wt 
#> -3.87783
```

**Explanation:** `systemfit()` takes a **named** list of formulas; the name `eq1` gets prefixed onto every coefficient from that equation, which is why we ask for `eq1_wt`.

</details>

## How do you specify a system of equations for systemfit()?

Every SUR model is a list of standard R formulas. You write each one exactly as you would for `lm()`, then bundle them into a named list. `systemfit()` stitches them into a single block-diagonal design matrix behind the scenes, but the formula API stays familiar.

```r title="Inspect equation labels and coefficient names"
# Same iris fit, but now look at the named coefficient block
names(fit$eq)
#> [1] "eq_sepal" "eq_petal"

coef(fit)
#>     eq_sepal_(Intercept)     eq_sepal_Petal.Length      eq_sepal_Petal.Width
#>                4.1905776                 0.5417769                -0.3196150
#>     eq_petal_(Intercept)     eq_petal_Petal.Length      eq_petal_Petal.Width
#>                3.5871751                -0.2487597                 0.3641267
```

Every coefficient is prefixed by its equation label. That keeps `eq_sepal_Petal.Length` clearly distinct from `eq_petal_Petal.Length` even though they come from the same predictor column. You will need the exact prefixed names later when testing cross-equation restrictions, so name your equations something short and memorable.

[TIP]
**Always name your equations.** Passing an unnamed list gives you generic labels like `eq1`, `eq2`. Name them after the outcome (`eq_wage`, `eq_hours`) and every piece of downstream output reads like a sentence.

**Try it:** Redefine the iris system so equation 2 uses `Petal.Length + Species` instead of the petal-width predictor. Fit and print the coefficient table for equation 2 only.

```r title="Your turn: add Species to equation 2"
# Try it: add Species as a predictor in equation 2
ex_eq_a <- Sepal.Length ~ Petal.Length
ex_eq_b <- Sepal.Width  ~ Petal.Length + Species

ex_fit2 <- # your code here

# Print equation 2 coefficients
summary(ex_fit2)$eq[[2]]$coefficients
#> Expected: 4 rows (Intercept, Petal.Length, Speciesversicolor, Speciesvirginica)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mixed-regressor SUR solution"
ex_fit2 <- systemfit(list(eq_a = ex_eq_a, eq_b = ex_eq_b),
                     method = "SUR", data = iris)
summary(ex_fit2)$eq[[2]]$coefficients
#>                       Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept)          1.6765470 0.23536609  7.122300 4.538057e-11
#> Petal.Length         0.3499789 0.06387929  5.479090 1.773941e-07
#> Speciesversicolor   -1.6988404 0.16472517 -10.313100 5.540775e-19
#> Speciesvirginica    -2.1119598 0.22940521 -9.206059 3.984987e-16
```

**Explanation:** R automatically one-hot encodes `Species` into two dummy columns, and each appears in its own row of the coefficient table.

</details>

## How much efficiency does SUR gain over separate OLS?

SUR is only worth the extra setup when it produces tighter standard errors than running each equation separately. Let us measure the gain directly by fitting the same iris system two ways, equation-by-equation OLS and joint SUR, then comparing their coefficient standard errors side by side.

```r title="Compare SUR standard errors to separate OLS"
# Fit the same system with both methods
fit_ols <- systemfit(list(eq_sepal = eq_sepal, eq_petal = eq_petal),
                     method = "OLS", data = iris)
fit_sur <- systemfit(list(eq_sepal = eq_sepal, eq_petal = eq_petal),
                     method = "SUR", data = iris)

# Pull standard errors from the coefficient summaries
se_ols <- coef(summary(fit_ols))[, "Std. Error"]
se_sur <- coef(summary(fit_sur))[, "Std. Error"]

# Percent reduction in SE from switching to SUR
round(100 * (se_ols - se_sur) / se_ols, 2)
#>    eq_sepal_(Intercept)   eq_sepal_Petal.Length   eq_sepal_Petal.Width
#>                    0.00                    0.00                   0.00
#>    eq_petal_(Intercept)   eq_petal_Petal.Length   eq_petal_Petal.Width
#>                    0.00                    0.00                   0.00
```

The reduction is exactly zero on this particular iris system because **both equations share an identical set of regressors**. That is the first of the two cases where SUR mathematically collapses to OLS. The cross-equation correlation exists (`0.32`, from the earlier block) but there is nothing left to squeeze out of it once the regressors match. To see a non-zero gain, you would need equations with different predictors, as the earlier "Species in equation 2 only" example had.

If you are comfortable skipping the math, jump to the next section, the practical code above is all you need. Otherwise, the SUR estimator is:

$$\hat{\beta}_{\text{SUR}} = \left(X^\top (\hat{\Sigma}^{-1} \otimes I_n) X\right)^{-1} X^\top (\hat{\Sigma}^{-1} \otimes I_n) y$$

Where:
- $\hat{\beta}_{\text{SUR}}$ is the stacked coefficient vector across all equations
- $\hat{\Sigma}$ is the estimated cross-equation residual covariance matrix
- $\otimes$ is the Kronecker product, which expands $\hat{\Sigma}$ to act on every observation
- $n$ is the number of observations per equation
- $X$ is the block-diagonal matrix of regressors

When $\hat{\Sigma}$ is diagonal (no cross-equation correlation) or every block of $X$ is identical, the sandwich collapses and the formula reduces to the usual OLS normal equations.

[KEY INSIGHT]
**SUR collapses to OLS in two specific cases, and knowing them saves hours.** First, when the residual correlation matrix is essentially diagonal, there is nothing joint estimation can exploit. Second, when every equation has the same set of regressors, the system's block structure absorbs all the cross-equation information. That second case is why most SUR applications deliberately let equations use different predictors, it is the only way to earn the efficiency premium.

**Try it:** Fit the iris SUR model with identical regressors in both equations (as in the payoff code) and confirm that the SUR coefficients equal the OLS coefficients to 10 decimal places.

```r title="Your turn: SUR equals OLS when regressors match"
# Try it: verify SUR and OLS return identical coefficients
ex_fit3_sur <- systemfit(list(eq_sepal = eq_sepal, eq_petal = eq_petal),
                         method = "SUR", data = iris)
ex_fit3_ols <- systemfit(list(eq_sepal = eq_sepal, eq_petal = eq_petal),
                         method = "OLS", data = iris)

# Difference between the two coefficient vectors
max(abs(coef(ex_fit3_sur) - coef(ex_fit3_ols)))
#> Expected: a number smaller than 1e-10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Identical-regressor equivalence"
max(abs(coef(ex_fit3_sur) - coef(ex_fit3_ols)))
#> [1] 3.552714e-15
```

**Explanation:** The `3.55e-15` is floating-point noise; mathematically the two vectors are identical because the identical-regressors condition forces SUR to reduce to OLS.

</details>

## How do you test hypotheses across SUR equations?

A large reason to fit the two equations jointly, rather than separately, is to test whether a predictor has the same effect in both. The `car::linearHypothesis()` function reads a `systemfit` object directly, so you write the restriction as a string and R does the rest.

```r title="Test a cross-equation restriction"
# Load car for linearHypothesis()
library(car)

# Is the Petal.Length slope the same in both iris equations?
test_slope <- linearHypothesis(
  fit,
  "eq_sepal_Petal.Length - eq_petal_Petal.Length = 0",
  test = "Chisq"
)
test_slope
#> Linear hypothesis test (Chi-squared)
#>
#> Hypothesis:
#> eq_sepal_Petal.Length - eq_petal_Petal.Length = 0
#>
#>   Res.Df Df  Chisq Pr(>Chisq)
#> 1    295
#> 2    294  1 121.17  < 2.2e-16 ***
```

The chi-square statistic is huge (`121.17`) and the p-value is effectively zero, so we reject the null that `Petal.Length` has the same slope in both equations. That makes biological sense: petal length positively predicts sepal length but negatively predicts sepal width. The cross-equation test gives you one clean p-value for that difference, which is exactly the thing two separate `lm()` fits cannot do.

[WARNING]
**Copy coefficient names from `names(coef(fit))` when you write restrictions.** A typo in the restriction string does not throw an error, it silently tests a different hypothesis. `linearHypothesis()` treats any unrecognised string as a fresh coefficient name and may report a meaningless result.

**Try it:** Test whether the two iris intercepts are equal. Save the test object to `ex_test1` and print the chi-square statistic.

```r title="Your turn: test intercept equality"
# Try it: test whether the two intercepts are equal
ex_test1 <- # your code here

# Extract the chi-square statistic
ex_test1$Chisq[2]
#> Expected: a large positive number
```

<details>
<summary>Click to reveal solution</summary>

```r title="Intercept equality solution"
ex_test1 <- linearHypothesis(
  fit,
  "eq_sepal_(Intercept) - eq_petal_(Intercept) = 0",
  test = "Chisq"
)
ex_test1$Chisq[2]
#> [1] 17.37961
```

**Explanation:** The backtick-free name inside the restriction string has to match `names(coef(fit))` exactly, including the `(Intercept)` parentheses.

</details>

## What assumptions and diagnostics should you check?

SUR inherits every OLS assumption and adds one more: errors may be correlated across equations within the same observation, but must be independent across observations. If you suspect endogenous regressors, SUR will not save you, the estimates are biased for the same reasons OLS is.

1. Errors are independent across observations (no serial correlation, no clustering).
2. Errors within an observation may be correlated across equations.
3. Regressors are exogenous and not correlated with the error term.
4. Each equation is correctly specified, with a linear functional form and no omitted confounders.

The first two assumptions you check with the residual correlation matrix; the other two you check with the same diagnostics you would run on any `lm()` fit (residual plots, VIF, reset tests).

```r title="Residual correlation diagnostic"
# Cross-equation correlation of residuals
res_cor <- cor(residuals(fit))
res_cor
#>            eq_sepal   eq_petal
#> eq_sepal  1.0000000  0.3208583
#> eq_petal  0.3208583  1.0000000

# Off-diagonal element is the one that matters
off_diag <- res_cor[1, 2]
off_diag
#> [1] 0.3208583
```

An off-diagonal of `0.32` is a middling correlation, meaningful but not dominant. That is enough to make SUR worth running when your regressors differ across equations. If this value had come back near zero (say `|r| < 0.05`), you could safely fall back on separate `lm()` calls and lose nothing. If it came back near one, you should also check whether the two outcomes are really measuring different things or just renamed copies of each other.

**Try it:** Compute the residual correlation matrix for the iris SUR fit and extract only the off-diagonal value.

```r title="Your turn: extract the off-diagonal cor"
# Try it: grab the cross-equation residual correlation
ex_cor <- # your code here

ex_cor
#> Expected: a single number near 0.32
```

<details>
<summary>Click to reveal solution</summary>

```r title="Off-diagonal extraction"
ex_cor <- cor(residuals(fit))[1, 2]
ex_cor
#> [1] 0.3208583
```

**Explanation:** Subscripting `[1, 2]` pulls the row-1 column-2 entry, which on a symmetric 2x2 correlation matrix is the only unique off-diagonal cell.

</details>

## Practice Exercises

### Exercise 1: Fit a SUR system on mtcars with different regressors per equation

Build a SUR system on `mtcars` where equation 1 is `mpg ~ wt + hp` and equation 2 is `qsec ~ wt + hp + cyl`. Save the fit to `my_fit` and print the residual correlation between the two equations.

```r title="Capstone 1: mtcars SUR with mixed regressors"
# Exercise: mtcars SUR with different predictors per equation
# Hint: equation 2 has cyl, equation 1 does not

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
my_eq1 <- mpg  ~ wt + hp
my_eq2 <- qsec ~ wt + hp + cyl

my_fit <- systemfit(list(mpg_eq = my_eq1, qsec_eq = my_eq2),
                    method = "SUR", data = mtcars)

# Cross-equation residual correlation
cor(residuals(my_fit))[1, 2]
#> [1] -0.2012091
```

**Explanation:** The residual correlation is `-0.20`, a moderate negative dependence. Cars whose fuel efficiency overshoots the model tend to undershoot on quarter-mile time, which the two equations capture jointly via SUR.

</details>

### Exercise 2: Test whether wt has the same effect in both mtcars equations

Using the `my_fit` object from Exercise 1, test $H_0:\ \beta_{\text{wt, mpg\_eq}} = \beta_{\text{wt, qsec\_eq}}$. Save the test to `my_test` and print the chi-square statistic plus p-value.

```r title="Capstone 2: cross-equation wt slope test"
# Exercise: test whether wt has the same effect in both equations
# Hint: use linearHypothesis() with the prefixed coefficient names

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
my_test <- linearHypothesis(
  my_fit,
  "mpg_eq_wt - qsec_eq_wt = 0",
  test = "Chisq"
)
c(chisq = my_test$Chisq[2], p_value = my_test$`Pr(>Chisq)`[2])
#>        chisq      p_value
#> 4.093624e+01 1.538420e-10
```

**Explanation:** The chi-square of `40.9` rejects the null at any reasonable significance level. Weight has substantially different effects on fuel efficiency and quarter-mile time, which is exactly the cross-equation story separate `lm()` fits cannot quantify.

</details>

## Complete Example

Here is the full SUR workflow from start to finish on a fresh iris fit, so you can copy it as a template.

```r title="End-to-end SUR workflow on iris"
# 1. Load packages and data
library(systemfit)
library(car)
data(iris)

# 2. Define equations with overlapping but non-identical regressors
final_eq1 <- Sepal.Length ~ Petal.Length + Petal.Width
final_eq2 <- Sepal.Width  ~ Petal.Length + Species

# 3. Fit jointly with SUR
final_fit <- systemfit(list(sepal_len = final_eq1, sepal_wid = final_eq2),
                       method = "SUR", data = iris)

# 4. Inspect residual correlation
cor(residuals(final_fit))[1, 2]
#> [1] 0.3842812

# 5. Cross-equation test: is Petal.Length's slope the same in both equations?
final_test <- linearHypothesis(
  final_fit,
  "sepal_len_Petal.Length - sepal_wid_Petal.Length = 0",
  test = "Chisq"
)
final_test$Chisq[2]
#> [1] 70.47821

# 6. Read the joint residual correlation for this model
cor(residuals(final_fit))
#>            sepal_len  sepal_wid
#> sepal_len  1.0000000  0.3842812
#> sepal_wid  0.3842812  1.0000000
```

Residual correlation of `0.38` says there is real cross-equation dependence worth exploiting. The chi-square of `70.5` tells you the petal-length slopes differ strongly between the two equations. Together, those two numbers justify joint estimation and answer a scientific question that separate `lm()` calls could not reach in one step.

## Summary

| Question | Answer |
|---|---|
| When does SUR help over OLS? | Errors correlated across equations **and** regressors differ across equations |
| When does SUR collapse to OLS? | Residual correlation near zero, or identical regressors in every equation |
| Main function | `systemfit(formula = list(eq1, eq2), method = "SUR", data = df)` |
| Cross-equation tests | `car::linearHypothesis(fit, "eq1_x - eq2_x = 0", test = "Chisq")` |
| Key diagnostic | `cor(residuals(fit))`, off-diagonal element is the signal |
| Extra assumption vs OLS | Errors independent across observations; correlated within observations |

## References

1. Zellner, A. (1962). *An Efficient Method of Estimating Seemingly Unrelated Regressions and Tests for Aggregation Bias.* Journal of the American Statistical Association, 57(298), 348-368. [Link](https://www.jstor.org/stable/2281644)
2. Henningsen, A., and Hamann, J. D. (2007). *systemfit: A Package for Estimating Systems of Simultaneous Equations in R.* Journal of Statistical Software, 23(4). [Link](https://www.jstatsoft.org/v23/i04/)
3. systemfit CRAN vignette. [Link](https://cran.r-project.org/web/packages/systemfit/vignettes/systemfit.pdf)
4. UCLA OARC Statistical Consulting. *How can I perform seemingly unrelated regression in R?* [Link](https://stats.oarc.ucla.edu/r/faq/how-can-i-perform-seemingly-unrelated-regression-in-r/)
5. Greene, W. H. (2018). *Econometric Analysis* (8th ed.), Chapter 10. Pearson.
6. Wikipedia. *Seemingly unrelated regressions.* [Link](https://en.wikipedia.org/wiki/Seemingly_unrelated_regressions)

## Continue Learning

- [Multiple Regression in R](Multiple-Regression-in-R.html), the parent post covering single-equation multiple regression, the natural starting point before moving to systems.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), every assumption SUR inherits from OLS, plus how to diagnose violations.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html), residual plots, leverage, influence measures that apply equation-by-equation inside a SUR fit.
