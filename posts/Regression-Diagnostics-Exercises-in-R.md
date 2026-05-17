---
title: "Regression Diagnostics Exercises in R: 25 OLS Assumption-Check Problems"
slug: Regression-Diagnostics-Exercises-in-R
description: "25 hands-on regression diagnostics in R exercises: residual plots, normality, homoscedasticity, multicollinearity, Cook's distance, influence, and remediation."
keywords: "regression diagnostics in R exercises, OLS assumption testing R, residual analysis R practice, Cook's distance exercises, VIF multicollinearity, Breusch-Pagan test R, Durbin-Watson exercises"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Regression Diagnostics Exercises"
sidebar_order: 240
fr_parent: "Regression-Diagnostics-in-R.html"
auto_link_terms: "regression diagnostics exercises|regression diagnostics practice|ols assumption checks|cook's distance practice|residual plots in r|multicollinearity exercises"
auto_link_case_sensitive: false
target_keyword: "regression diagnostics in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Regression Diagnostics Exercises in R: 25 OLS Assumption-Check Problems

<p class="lead">Twenty-five practice problems that walk every assumption an OLS model rests on: linearity in the residuals-vs-fitted plot, normality via Q-Q and Shapiro-Wilk, homoscedasticity through Breusch-Pagan and NCV tests, multicollinearity via VIF and condition numbers, plus leverage, Cook's distance, autocorrelation, and full remediation workflows. Each exercise hides its solution so you can attempt the code before peeking.</p>

```r title="Run this once before any exercise"
library(car)
library(lmtest)
library(sandwich)
library(MASS)
library(ggplot2)   # supplies the `economics` and `diamonds` datasets used below
```

## Section 1. Residuals, fitted values, and linearity (5 problems)

### Exercise 1.1: Extract residuals and fitted values from a baseline OLS fit

**Task:** Fit a simple linear regression of `mpg` on `wt` using the built-in `mtcars` dataset, then assemble a tibble-like data frame whose columns are `fitted` (the predicted mpg) and `resid` (the raw residuals). Save the result to `ex_1_1`.

**Expected result:**

```
#>     fitted        resid
#> 1 23.28261  -2.28260689
#> 2 21.91977  -0.91976886
#> 3 24.88595  -2.08595449
#> 4 20.10265   1.29734866
#> 5 18.90014  -0.20013966
#> 6 18.79325  -0.69325453
#> ... 26 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
A fitted model already knows both the predictions it made and how far each one missed; you only need to pull those two pieces out side by side.
Fit with lm(mpg ~ wt, data = mtcars), then collect fitted() and residuals() into a data.frame with columns named fitted and resid.

```r title="Your turn"
ex_1_1 <- # your code here
head(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_1 <- data.frame(fitted = fitted(fit), resid = residuals(fit))
head(ex_1_1)
#>     fitted        resid
#> 1 23.28261  -2.28260689
#> 2 21.91977  -0.91976886
#> 3 24.88595  -2.08595449
#> 4 20.10265   1.29734866
#> 5 18.90014  -0.20013966
#> 6 18.79325  -0.69325453
```

**Explanation:** `fitted()` returns y-hat (the model's in-sample predictions) and `residuals()` returns y minus y-hat. Storing both side-by-side is the canonical setup for every downstream diagnostic: residual plots, normality checks, and influence measures all consume these two vectors. `resid()` is a shorter alias if you prefer. Avoid `lm.fit()` for everyday work because it skips the formula interface and the rich `lm`-class summary slots.

</details>

### Exercise 1.2: Build the residuals-vs-fitted diagnostic plot

**Task:** Using the same `mpg ~ wt` model on `mtcars`, draw the residuals-vs-fitted scatter plot with a horizontal reference line at zero and a LOWESS smoother to reveal any systematic curvature in the residual cloud. Save the model object to `ex_1_2`.

**Expected result:**

```
# A scatter plot: fitted mpg on x-axis, residuals on y-axis.
# Horizontal dashed line at y = 0. Red LOWESS smoother bends gently
# upward at high fitted values, hinting at mild nonlinearity that a
# single-predictor model cannot capture.
```

**Difficulty:** Beginner

[HINTS]
The first standard diagnostic panel reveals whether the residual cloud has any systematic shape as predictions change.
Store the lm(mpg ~ wt, data = mtcars) object in ex_1_2; the which = 1 argument selects the residuals-vs-fitted panel.

```r title="Your turn"
ex_1_2 <- # your code here
plot(ex_1_2, which = 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- lm(mpg ~ wt, data = mtcars)
plot(ex_1_2, which = 1)
#> Scatter of residuals vs fitted with a red LOWESS curve and dashed
#> reference line at 0. The smoother dips below zero in the middle range
#> and rises at the right edge, suggesting a missing curvature term.
```

**Explanation:** Plot 1 of the four default `plot.lm()` panels is the single most important diagnostic. A flat LOWESS line near zero means the linear specification captures the conditional mean. A bowl or hump means a quadratic or log transform is warranted. Specifying `which = 1` skips drawing the other three panels (Q-Q, scale-location, leverage) so the figure stays uncluttered while you eyeball linearity alone.

</details>

### Exercise 1.3: Detect curvature and add a quadratic term

**Task:** Fit `mpg ~ disp` on `mtcars`, inspect the residuals-vs-fitted pattern, then refit with a quadratic term `I(disp^2)` to remove the bend. Store the refitted quadratic model in `ex_1_3` and compare residual standard error against the linear fit.

**Expected result:**

```
#> Linear RSE:    3.251 on 30 df
#> Quadratic RSE: 2.568 on 29 df   # ~21% reduction
#> Quadratic coef on I(disp^2): 1.255e-04 (p < 0.001)
```

**Difficulty:** Intermediate

[HINTS]
When residuals bend, the fix is to give the model a term that is itself allowed to bend.
Build the model as lm(mpg ~ disp + I(disp^2), data = mtcars); the I() wrapper keeps the squared term literal.

```r title="Your turn"
ex_1_3 <- # your code here
summary(ex_1_3)$sigma
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
linear_fit <- lm(mpg ~ disp, data = mtcars)
ex_1_3    <- lm(mpg ~ disp + I(disp^2), data = mtcars)

summary(linear_fit)$sigma
#> [1] 3.251454
summary(ex_1_3)$sigma
#> [1] 2.567563
coef(summary(ex_1_3))["I(disp^2)", ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#> 1.255411e-04 3.343651e-05 3.754673e+00 7.819763e-04
```

**Explanation:** The residual standard error drops about 21% when the curvature is modeled directly, and the `I(disp^2)` term is highly significant. The `I()` wrapper protects the squared term from formula-parsing surprises (without it, `^2` triggers interactions). For polynomials of degree three or higher, switch to `poly(disp, k)` so the orthogonal contrasts keep predictors numerically stable.

</details>

### Exercise 1.4: Run an omnibus curvature test with car::residualPlots

**Task:** Fit `mpg ~ wt + hp + disp` on `mtcars`, then use `car::residualPlots()` to get a Tukey curvature test for every predictor and for the fitted-value axis. Save the model object to `ex_1_4`.

**Expected result:**

```
#>            Test stat Pr(>|Test stat|)
#> wt           -0.5547           0.5839
#> hp            1.6189           0.1175
#> disp          1.5934           0.1233
#> Tukey test   -2.1612           0.0307   *
```

**Difficulty:** Intermediate

[HINTS]
A single omnibus curvature test can flag nonlinearity even when no individual predictor looks guilty on its own.
Store the lm(mpg ~ wt + hp + disp, data = mtcars) fit in ex_1_4; car::residualPlots() prints the per-predictor and Tukey tests.

```r title="Your turn"
ex_1_4 <- # your code here
car::residualPlots(ex_1_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- lm(mpg ~ wt + hp + disp, data = mtcars)
car::residualPlots(ex_1_4)
#>            Test stat Pr(>|Test stat|)
#> wt           -0.5547           0.5839
#> hp            1.6189           0.1175
#> disp          1.5934           0.1233
#> Tukey test   -2.1612           0.0307 *
```

**Explanation:** `residualPlots()` regresses residuals on each predictor squared and reports the t-statistic. A significant Tukey test (here p = 0.03) flags overall nonlinearity even when no individual predictor crosses 0.05. The function also draws one residual panel per predictor plus one against fitted values, so you see WHERE the curvature lives. A natural next step is `poly()` or a spline on the predictor with the largest individual t-statistic.

</details>

### Exercise 1.5: Build component-plus-residual (partial residual) plots

**Task:** Using the same three-predictor `mpg` model, draw component-plus-residual plots with `car::crPlots()` to isolate the marginal effect of each predictor after partialling out the others. Save the model to `ex_1_5` and identify which predictor shows the strongest residual curvature.

**Expected result:**

```
# Three panels: one per predictor. Pink dashed line is the partial linear
# fit; solid green line is a LOWESS through the partial residuals.
# Strongest divergence appears for hp, where the LOWESS curves downward at
# the upper tail, suggesting a log or sqrt transform on hp.
```

**Difficulty:** Intermediate

[HINTS]
To judge whether a predictor's functional form is wrong, you need its marginal effect with every other predictor partialled out.
Reuse the three-predictor lm(mpg ~ wt + hp + disp, data = mtcars) fit as ex_1_5; car::crPlots() draws one panel per predictor.

```r title="Your turn"
ex_1_5 <- # your code here
car::crPlots(ex_1_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- lm(mpg ~ wt + hp + disp, data = mtcars)
car::crPlots(ex_1_5)
#> Three CR panels; the hp panel shows the LOWESS curve dipping below the
#> linear partial fit at high hp values, suggesting a concave nonlinearity.
```

**Explanation:** A component-plus-residual plot shows `b_k * x_k + residuals` against `x_k`, so the slope you see is the predictor's estimated marginal effect plus everything the model failed to fit. When the LOWESS curves away from the linear reference, the FUNCTIONAL FORM for that predictor is wrong, not the data. Compare to `avPlots()` (added-variable) which targets influence and partial slope rather than functional form.

</details>

## Section 2. Normality of residuals (3 problems)

### Exercise 2.1: Draw a Q-Q plot of standardized residuals

**Task:** Fit `Sepal.Length ~ Sepal.Width + Petal.Length` on the `iris` data, compute the standardized residuals with `rstandard()`, then draw a Q-Q plot against the theoretical normal quantiles with a reference line. Save the standardized residual vector to `ex_2_1`.

**Expected result:**

```
# Q-Q plot of 150 standardized residuals against N(0,1) quantiles.
# Points hug the 45-degree reference line through the center, with a
# couple of mild departures at both tails. Overall pattern is consistent
# with approximate normality.
```

**Difficulty:** Beginner

[HINTS]
Comparing residuals to a normal curve is fairer once each one is rescaled onto a common, comparable spread.
Fit the Sepal.Length ~ Sepal.Width + Petal.Length model, then store rstandard(fit) in ex_2_1 for qqnorm to plot.

```r title="Your turn"
ex_2_1 <- # your code here
qqnorm(ex_2_1); qqline(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(Sepal.Length ~ Sepal.Width + Petal.Length, data = iris)
ex_2_1 <- rstandard(fit)

qqnorm(ex_2_1, main = "Q-Q plot of standardized residuals")
qqline(ex_2_1, col = "red", lwd = 2)
#> Q-Q plot with points clustering along the red reference line in the
#> middle, deviating slightly in both tails. Consistent with approximate
#> normality after accounting for sampling noise.
```

**Explanation:** Standardized residuals divide each raw residual by its estimated standard error, putting them on a common N(0,1) scale so the Q-Q plot is interpretable. Use `rstandard()` when judging normality and `rstudent()` when hunting for outliers (the latter leaves point i out when computing its own standard error, giving a more honest extremity check).

</details>

### Exercise 2.2: Run the Shapiro-Wilk test on residuals

**Task:** Using the `iris` fit from the previous exercise, run `shapiro.test()` on the raw residuals to formally test the null hypothesis that the residuals are normally distributed. Save the htest object to `ex_2_2` and report the p-value to three decimals.

**Expected result:**

```
#>
#>  Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.99465, p-value = 0.8636
```

**Difficulty:** Intermediate

[HINTS]
A formal hypothesis test can confirm or overturn what the Q-Q plot only suggested about normality.
Refit the iris model and pass residuals(fit) to shapiro.test(), keeping the returned htest object in ex_2_2.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(Sepal.Length ~ Sepal.Width + Petal.Length, data = iris)
ex_2_2 <- shapiro.test(residuals(fit))
ex_2_2
#>
#>  Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.99465, p-value = 0.8636
```

**Explanation:** Shapiro-Wilk has high power for sample sizes between 20 and 2000, making it the default normality test for typical regression contexts. A non-significant result (p = 0.86 here) means the data is consistent with normality, not that residuals ARE normal. For n > 5000 the test gets oversensitive (any tiny deviation rejects), so prefer Q-Q plots and skewness/kurtosis estimates at large sample sizes.

</details>

### Exercise 2.3: Compare studentized residuals and flag outliers

**Task:** Fit `mpg ~ wt + hp` on `mtcars`, compute studentized (leave-one-out) residuals with `MASS::studres()`, identify rows whose absolute studentized residual exceeds 2, and save a data frame of those observations to `ex_2_3` with columns `car`, `stud_resid`.

**Expected result:**

```
#>                 car stud_resid
#> 1       Fiat 128       2.624
#> 2  Toyota Corolla     2.184
#> 3  Chrysler Imperial  2.351
```

**Difficulty:** Intermediate

[HINTS]
Leave-one-out residuals give an honest extremity score because each point is judged by a model that never saw it.
Compute MASS::studres(fit) on the mpg ~ wt + hp model, find rows with which(abs(...) > 2), and collect them with columns car and stud_resid.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
sr  <- MASS::studres(fit)
idx <- which(abs(sr) > 2)
ex_2_3 <- data.frame(
  car        = rownames(mtcars)[idx],
  stud_resid = round(sr[idx], 3),
  row.names  = NULL
)
ex_2_3
#>                 car stud_resid
#> 1        Fiat 128       2.624
#> 2  Toyota Corolla      2.184
#> 3 Chrysler Imperial    2.351
```

**Explanation:** Studentized residuals follow a t-distribution with n-p-1 df under the null of no outlier, so the rule-of-thumb cutoff of |t| > 2 corresponds to roughly a 5% two-sided alpha. Unlike standardized residuals, `studres()` refits the model with row i deleted before computing residual i's standard error, which makes the test honest for the candidate outlier. For a Bonferroni-corrected test across all rows, use `car::outlierTest()`.

</details>

## Section 3. Homoscedasticity and non-constant variance (4 problems)

### Exercise 3.1: Inspect a Scale-Location plot for non-constant spread

**Task:** Fit `price ~ carat` on a 2000-row sample of `diamonds`, then draw the Scale-Location panel (plot 3) to visualize the spread of standardized residuals against fitted values. The square-root transform of |std resid| stabilizes the y-axis. Save the model to `ex_3_1`.

**Expected result:**

```
# Scale-Location: sqrt(|std residuals|) on y, fitted price on x.
# Points fan out clearly as fitted price rises and the red LOWESS smoother
# slopes steeply upward, a classic signature of heteroscedasticity.
```

**Difficulty:** Intermediate

[HINTS]
A dedicated panel shows whether the spread of residuals holds steady as the predictions grow larger.
Assign lm(price ~ carat, data = d) to ex_3_1; the which = 3 argument selects the Scale-Location panel.

```r title="Your turn"
set.seed(42)
d <- diamonds[sample(nrow(diamonds), 2000), ]
ex_3_1 <- # your code here
plot(ex_3_1, which = 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
d <- diamonds[sample(nrow(diamonds), 2000), ]
ex_3_1 <- lm(price ~ carat, data = d)
plot(ex_3_1, which = 3)
#> Scale-Location panel: sqrt(|standardized residuals|) on y axis rises
#> sharply with fitted price; LOWESS smoother is strongly upward sloping,
#> indicating heteroscedasticity.
```

**Explanation:** A flat LOWESS curve on this panel means equal spread across the range of fitted values (homoscedasticity). A rising curve means the residual variance grows with the mean, which violates OLS assumption 4 and inflates the false-positive rate of t-tests on slopes. The diamonds price/carat pair is the textbook offender. Fixes: log-transform the response, switch to weighted least squares, or use heteroscedasticity-consistent standard errors.

</details>

### Exercise 3.2: Test homoscedasticity with the Breusch-Pagan test

**Task:** Using the diamonds sample model from Exercise 3.1, run `lmtest::bptest()` to formally test the null hypothesis of constant residual variance. The statistic is `n * R^2` from regressing squared residuals on the original predictors. Save the htest result to `ex_3_2`.

**Expected result:**

```
#>
#>  studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 1083.7, df = 1, p-value < 2.2e-16
```

**Difficulty:** Intermediate

[HINTS]
A formal test turns the fanning pattern you saw into a clear yes-or-no verdict on constant variance.
Pass the fitted price ~ carat model to lmtest::bptest() and store the htest result in ex_3_2.

```r title="Your turn"
set.seed(42)
d <- diamonds[sample(nrow(diamonds), 2000), ]
fit <- lm(price ~ carat, data = d)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
d <- diamonds[sample(nrow(diamonds), 2000), ]
fit <- lm(price ~ carat, data = d)
ex_3_2 <- lmtest::bptest(fit)
ex_3_2
#>
#>  studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 1083.7, df = 1, p-value < 2.2e-16
```

**Explanation:** A near-zero p-value rejects the null of constant variance overwhelmingly. The studentized variant is the Koenker version which is robust to non-normal errors (use this one by default). Once heteroscedasticity is confirmed, refit the model with `sandwich::vcovHC()` for robust standard errors or transform the response before chasing more sophisticated remedies.

</details>

### Exercise 3.3: Run the NCV score test against fitted values

**Task:** Fit `mpg ~ wt + hp + disp` on `mtcars`, then run `car::ncvTest()` which regresses squared residuals on fitted values rather than the predictors. The score statistic uses one degree of freedom and detects variance that scales with the conditional mean. Save the test object to `ex_3_3`.

**Expected result:**

```
#> Non-constant Variance Score Test
#> Variance formula: ~ fitted.values
#> Chisquare = 5.215, Df = 1, p = 0.0224
```

**Difficulty:** Intermediate

[HINTS]
One score test asks specifically whether residual variance scales with the conditional mean of the model.
Fit lm(mpg ~ wt + hp + disp, data = mtcars), then run car::ncvTest() on it into ex_3_3.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + disp, data = mtcars)
ex_3_3 <- car::ncvTest(fit)
ex_3_3
#> Non-constant Variance Score Test
#> Variance formula: ~ fitted.values
#> Chisquare = 5.215, Df = 1, p = 0.0224
```

**Explanation:** NCV is Breusch and Pagan's original score test, scoped to a single hypothesis about HOW the variance changes. Comparing fitted values (default) vs all predictors (`~ wt + hp + disp`) reveals whether heteroscedasticity tracks the mean structure or some specific predictor. The car version is preferable to base because it reports a clean chi-square and directly accepts `lm` objects.

</details>

### Exercise 3.4: Refit with heteroscedasticity-consistent standard errors

**Task:** Using the diamonds price model from Exercise 3.1, replace the OLS standard errors with HC3 robust standard errors via `sandwich::vcovHC()` and `lmtest::coeftest()`. Compare the carat coefficient's t-statistic before and after and save the robust coefficient table to `ex_3_4`.

**Expected result:**

```
#> t-test of coefficients (HC3):
#>
#>             Estimate Std. Error  t value  Pr(>|t|)
#> (Intercept) -2256.36    101.04  -22.331 < 2.2e-16 ***
#> carat        7752.59    143.27   54.114 < 2.2e-16 ***
#>
#> Classical SE on carat: 88.6;  HC3 SE on carat: 143.3
```

**Difficulty:** Advanced

[HINTS]
When variance is not constant, the coefficients can stay but the standard errors must be rebuilt to remain trustworthy.
Call lmtest::coeftest() on the fit, passing vcov. = sandwich::vcovHC(fit, type = "HC3").

```r title="Your turn"
set.seed(42)
d <- diamonds[sample(nrow(diamonds), 2000), ]
fit <- lm(price ~ carat, data = d)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
d <- diamonds[sample(nrow(diamonds), 2000), ]
fit <- lm(price ~ carat, data = d)
ex_3_4 <- lmtest::coeftest(fit, vcov. = sandwich::vcovHC(fit, type = "HC3"))
ex_3_4
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept) -2256.36     101.04 -22.331 < 2.2e-16 ***
#> carat        7752.59     143.27  54.114 < 2.2e-16 ***
```

**Explanation:** White's HC standard errors (HC0..HC3) replace the classical `sigma^2 (X^T X)^-1` with a sandwich form that is consistent under arbitrary heteroscedasticity. HC3 inflates each squared residual by `1/(1-h_ii)^2` and is the small-sample workhorse recommended in Long and Ervin (2000). The point estimates do not move (OLS is still unbiased), but the inflated standard errors here triple, swinging some borderline tests from significant to not.

</details>

## Section 4. Multicollinearity (3 problems)

### Exercise 4.1: Compute variance inflation factors with car::vif

**Task:** Fit `mpg ~ cyl + disp + hp + wt + drat` on `mtcars`, then compute the variance inflation factor for each predictor via `car::vif()`. Flag any predictor with VIF above 5 as collinear and save the numeric VIF vector to `ex_4_1`.

**Expected result:**

```
#>      cyl     disp       hp       wt     drat
#>  6.732  11.066  4.090  4.852  2.616
#> Predictors with VIF > 5: cyl, disp
```

**Difficulty:** Intermediate

[HINTS]
Each predictor's standard error can be inflated by how well the remaining predictors explain it.
Fit the five-predictor mtcars model and pass it to car::vif(), storing the numeric vector in ex_4_1.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ cyl + disp + hp + wt + drat, data = mtcars)
ex_4_1 <- car::vif(fit)
round(ex_4_1, 3)
#>     cyl    disp      hp      wt    drat
#> 6.732  11.066   4.090   4.852   2.616
names(ex_4_1)[ex_4_1 > 5]
#> [1] "cyl"  "disp"
```

**Explanation:** VIF_k equals `1 / (1 - R^2_k)`, where `R^2_k` comes from regressing predictor k on the others. A VIF of 11 means the standard error on `disp` is `sqrt(11)` = 3.3x larger than it would be with orthogonal predictors. Rules of thumb: VIF > 5 is concerning, VIF > 10 demands action (drop the predictor, ridge it, or combine via PCA). On categorical predictors with more than two levels, use `car::vif(fit, type = "predictor")` to get GVIF^(1/(2*df)) scaled to be comparable.

</details>

### Exercise 4.2: Inspect tolerance values and the predictor correlation matrix

**Task:** Using the same five-predictor `mtcars` model, compute tolerance values (one over VIF) and inspect the correlation matrix of the predictor block. Identify the most strongly correlated pair and save a list with elements `tolerance` and `cor_matrix` to `ex_4_2`.

**Expected result:**

```
#> $tolerance
#>   cyl  disp    hp    wt  drat
#> 0.149 0.090 0.245 0.206 0.382
#>
#> $cor_matrix
#>          cyl    disp      hp      wt    drat
#> cyl    1.000  0.902  0.832  0.782  -0.700
#> disp   0.902  1.000  0.791  0.888  -0.710
#> hp     0.832  0.791  1.000  0.659  -0.449
#> wt     0.782  0.888  0.659  1.000  -0.712
#> drat  -0.700 -0.710 -0.449 -0.712  1.000
#> Strongest pair: cyl-disp (r = 0.902)
```

**Difficulty:** Intermediate

[HINTS]
The reciprocal of the inflation factor, paired with the raw pairwise correlations, together tell the collinearity story.
Compute 1 / car::vif(fit) and cor() on the predictor columns, then bundle both into a list with elements tolerance and cor_matrix.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2$tolerance
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ cyl + disp + hp + wt + drat, data = mtcars)
tol  <- 1 / car::vif(fit)
cmat <- cor(mtcars[, c("cyl", "disp", "hp", "wt", "drat")])
ex_4_2 <- list(tolerance = round(tol, 3), cor_matrix = round(cmat, 3))
ex_4_2$tolerance
#>   cyl  disp    hp    wt  drat
#> 0.149 0.090 0.245 0.206 0.382
```

**Explanation:** Tolerance below 0.1 is the conventional alarm threshold (it matches VIF > 10). The correlation matrix gives the pairwise story but misses three-way and higher dependencies, which is exactly why VIF exists (it conditions on ALL other predictors). Use both: the matrix tells you WHICH predictors to drop or combine, and VIF tells you when the model is in trouble.

</details>

### Exercise 4.3: Detect near-singularity with the condition number and remediate

**Task:** Using the same `mtcars` model, compute the condition number of the scaled `X` matrix via `kappa(model.matrix(fit), exact = TRUE)`, refit after dropping `disp` (the highest-VIF predictor), and verify the condition number drops below 30. Save the refit model to `ex_4_3`.

**Expected result:**

```
#> Condition number (full model): 196.4   # severe collinearity
#> Condition number (after dropping disp): 18.7   # acceptable
#> Refit summary: 4 predictors, all VIF < 5
```

**Difficulty:** Advanced

[HINTS]
How close the design matrix is to singular can be summarized by one ratio, and dropping the worst offender should shrink it.
Refit lm() without disp into ex_4_3, then check kappa(model.matrix(ex_4_3), exact = TRUE).

```r title="Your turn"
fit_full <- lm(mpg ~ cyl + disp + hp + wt + drat, data = mtcars)
ex_4_3   <- # your code here
kappa(model.matrix(ex_4_3), exact = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_full <- lm(mpg ~ cyl + disp + hp + wt + drat, data = mtcars)
kappa(model.matrix(fit_full), exact = TRUE)
#> [1] 196.3878

ex_4_3 <- lm(mpg ~ cyl + hp + wt + drat, data = mtcars)
kappa(model.matrix(ex_4_3), exact = TRUE)
#> [1] 18.71204
car::vif(ex_4_3)
#>    cyl     hp     wt   drat
#>  4.757  3.259  3.789  2.605
```

**Explanation:** The condition number is the ratio of the largest to smallest singular value of `X` and measures how close the design matrix is to being singular. Belsley's rule of thumb: kappa above 30 is concerning, above 100 indicates severe collinearity (numerically unstable inversion of `X^T X`). Dropping `disp` removes the worst column-space overlap, and the remaining four predictors give a numerically stable fit. The kappa drop from 196 to 19 confirms the redundancy was concentrated in `disp`.

</details>

## Section 5. Influential observations and leverage (5 problems)

### Exercise 5.1: Compute Cook's distance and flag high-influence points

**Task:** Fit `mpg ~ wt + hp` on `mtcars`, compute Cook's distance for every observation via `cooks.distance()`, and identify rows whose Cook's D exceeds the 4/n cutoff. Save a data frame of those observations to `ex_5_1` with columns `car`, `cooks_d`.

**Expected result:**

```
#>                  car cooks_d
#> 1   Chrysler Imperial   0.357
#> 2  Toyota Corolla      0.225
#> 3  Fiat 128            0.193
#> Threshold (4/n): 0.125
```

**Difficulty:** Intermediate

[HINTS]
One scalar per row captures how much every fitted value would shift if that single row were removed.
Compute cooks.distance(fit), compare it against 4 / nobs(fit), and build a data.frame with columns car and cooks_d.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
cd  <- cooks.distance(fit)
thr <- 4 / nobs(fit)
idx <- which(cd > thr)

ex_5_1 <- data.frame(
  car      = rownames(mtcars)[idx],
  cooks_d  = round(cd[idx], 3),
  row.names = NULL
)
ex_5_1
#>                 car cooks_d
#> 1 Chrysler Imperial   0.357
#> 2     Toyota Corolla  0.225
#> 3          Fiat 128   0.193
```

**Explanation:** Cook's D measures how much every fitted value would shift if observation i were removed. The 4/n cutoff is a screening rule, not a verdict: borderline cases often reflect natural extremes rather than data errors. Compare to the F(p, n-p) reference (the original Cook 1977 yardstick) for a stricter test: anything above F_{0.5} is unambiguously influential. Always inspect the flagged rows by hand before deleting; they often carry the most signal.

</details>

### Exercise 5.2: Identify high-leverage points using the hat matrix

**Task:** For the `mpg ~ wt + hp` `mtcars` model, compute leverage values via `hatvalues()` and flag rows exceeding the `2 * (p+1) / n` rule-of-thumb. Save a data frame of those rows to `ex_5_2` with columns `car`, `leverage`.

**Expected result:**

```
#>                car leverage
#> 1 Maserati Bora     0.4715
#> 2 Cadillac Fleetwood 0.2306
#> 3 Lincoln Continental 0.2243
#> Threshold (2*(p+1)/n): 0.1875
```

**Difficulty:** Intermediate

[HINTS]
Some rows sit far out in predictor space and largely dictate their own fitted value regardless of the response.
Compute hatvalues(fit), flag rows above 2 * (p + 1) / nobs(fit), and store them with columns car and leverage.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
h   <- hatvalues(fit)
p   <- length(coef(fit)) - 1
thr <- 2 * (p + 1) / nobs(fit)
idx <- which(h > thr)

ex_5_2 <- data.frame(
  car       = rownames(mtcars)[idx],
  leverage  = round(h[idx], 4),
  row.names = NULL
)
ex_5_2
#>                 car leverage
#> 1     Maserati Bora   0.4715
#> 2 Cadillac Fleetwood   0.2306
#> 3 Lincoln Continental  0.2243
```

**Explanation:** Leverage is the diagonal of the hat matrix `H = X(X^T X)^-1 X^T`, the projection that maps observed y onto fitted y-hat. A row with h_ii close to 1 fully determines its own fit (zero residual no matter what y_i is). Leverage is a property of the X-space only, so high-leverage points are not automatically influential: they ALSO need a large residual. That combination is precisely what `influencePlot()` visualizes.

</details>

### Exercise 5.3: Compute DFBETAS to find coefficient-specific influence

**Task:** Using the same `mpg ~ wt + hp` model, compute DFBETAS for each observation and each coefficient via `dfbetas()`. Identify the row that most distorts the `wt` slope when included and save the absolute-max DFBETAS-on-wt row to `ex_5_3` as a one-row data frame with columns `car`, `dfbeta_wt`.

**Expected result:**

```
#>                car  dfbeta_wt
#> 1 Chrysler Imperial    0.8147
```

**Difficulty:** Intermediate

[HINTS]
Instead of one overall influence number, you can ask which single coefficient a row tugs hardest.
Compute dfbetas(fit), use which.max(abs(db[, "wt"])) to locate the row, and save a one-row data.frame with car and dfbeta_wt.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
db  <- dfbetas(fit)
i   <- which.max(abs(db[, "wt"]))

ex_5_3 <- data.frame(
  car        = rownames(mtcars)[i],
  dfbeta_wt  = round(db[i, "wt"], 4),
  row.names  = NULL
)
ex_5_3
#>                 car dfbeta_wt
#> 1 Chrysler Imperial    0.8147
```

**Explanation:** DFBETAS_{i,k} reports how many estimated standard errors the kth coefficient moves when observation i is dropped. Belsley, Kuh & Welsch suggest `|DFBETAS| > 2/sqrt(n)` for small samples and `|DFBETAS| > 1` for any sample as warning signs. Unlike Cook's D (which collapses influence into one scalar), DFBETAS pinpoint WHICH coefficient is being pulled, which is exactly what you need before deciding whether to drop a point.

</details>

### Exercise 5.4: Build a combined influence plot with car::influencePlot

**Task:** Fit `mpg ~ wt + hp + disp` on `mtcars`, then draw `car::influencePlot()` to show studentized residuals on the y-axis, leverage on the x-axis, and Cook's D as bubble area in a single panel. Save the returned influence summary table to `ex_5_4`.

**Expected result:**

```
#>                    StudRes        Hat       CookD
#> Chrysler Imperial   2.351   0.20364    0.357
#> Maserati Bora       1.046   0.47150    0.196
#> Toyota Corolla      2.184   0.05444    0.085
```

**Difficulty:** Advanced

[HINTS]
Residual extremity, leverage, and overall influence can all be read together from a single bubble chart.
Fit lm(mpg ~ wt + hp + disp, data = mtcars), pass it to car::influencePlot(), and keep the returned summary table in ex_5_4.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + disp, data = mtcars)
ex_5_4 <- car::influencePlot(fit, id = list(method = "noteworthy"))
ex_5_4
#>                    StudRes        Hat       CookD
#> Chrysler Imperial   2.351   0.20364    0.357
#> Maserati Bora       1.046   0.47150    0.196
#> Toyota Corolla      2.184   0.05444    0.085
```

**Explanation:** `influencePlot()` collapses the three influence dimensions into one figure so you can spot the dangerous combinations at a glance. A point in the upper-right with a large bubble is the worst case: extreme y (residual), extreme x (leverage), AND a coefficient-shifting Cook's D. Pure outliers (left side, high residual) and pure leverage points (bottom-right, small residual) are typically tolerable; the upper-right is what to investigate first.

</details>

### Exercise 5.5: Refit after deleting high-influence rows and compare coefficients

**Task:** For the same three-predictor `mtcars` model, delete observations with Cook's D above 4/n, refit, and produce a side-by-side comparison of the coefficient estimates before vs after deletion. Save the comparison data frame to `ex_5_5` with columns `term`, `full`, `clean`, `pct_change`.

**Expected result:**

```
#>         term      full     clean pct_change
#> 1 (Intercept)  37.1055   34.1846       -7.9
#> 2          wt  -3.8008   -2.6321      -30.7
#> 3          hp  -0.0312   -0.0341       +9.3
#> 4        disp  -0.0009   -0.0084     +833.3
```

**Difficulty:** Advanced

[HINTS]
The real test of influence is whether your conclusions survive once the flagged rows are removed.
Subset mtcars to rows where cooks.distance() <= 4 / nobs(), refit, and compare coef() of both fits in a data.frame.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_full <- lm(mpg ~ wt + hp + disp, data = mtcars)
cd  <- cooks.distance(fit_full)
keep <- cd <= 4 / nobs(fit_full)
fit_clean <- lm(mpg ~ wt + hp + disp, data = mtcars[keep, ])

ex_5_5 <- data.frame(
  term       = names(coef(fit_full)),
  full       = round(coef(fit_full), 4),
  clean      = round(coef(fit_clean), 4),
  row.names  = NULL
)
ex_5_5$pct_change <- round(100 * (ex_5_5$clean - ex_5_5$full) / abs(ex_5_5$full), 1)
ex_5_5
#>         term      full     clean pct_change
#> 1 (Intercept) 37.1055   34.1846       -7.9
#> 2          wt -3.8008   -2.6321      -30.7
#> 3          hp -0.0312   -0.0341       +9.3
#> 4        disp -0.0009   -0.0084     +833.3
```

**Explanation:** Dropping flagged points and refitting is a sensitivity analysis, not a remedy: if conclusions hinge on a handful of rows, the model is too fragile to publish. Here the slope on `wt` moves 31% and the `disp` slope changes sign in magnitude, signalling that the regression is sensitive to a few high-Cook's-D cars. The honest report is BOTH fits, plus a discussion of why those rows are unusual.

</details>

## Section 6. Autocorrelation, specification, and linearity tests (3 problems)

### Exercise 6.1: Detect serial correlation with the Durbin-Watson test

**Task:** Coerce the `economics` data into a regression context by fitting `unemploy ~ pop + psavert` (rows are time-ordered monthly observations), then run `car::durbinWatsonTest()` to test for first-order autocorrelation in the residuals. Save the htest result to `ex_6_1`.

**Expected result:**

```
#>  lag Autocorrelation D-W Statistic p-value
#>    1       0.9879608    0.02274574       0
#>  Alternative hypothesis: rho != 0
```

**Difficulty:** Intermediate

[HINTS]
Time-ordered residuals can echo their own recent past, a dependence a constant-mean model ignores entirely.
Fit lm(unemploy ~ pop + psavert, data = ggplot2::economics) and pass it to car::durbinWatsonTest().

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(unemploy ~ pop + psavert, data = ggplot2::economics)
ex_6_1 <- car::durbinWatsonTest(fit)
ex_6_1
#>  lag Autocorrelation D-W Statistic p-value
#>    1       0.9879608    0.02274574       0
#>  Alternative hypothesis: rho != 0
```

**Explanation:** The DW statistic ranges 0 to 4 (around 2 means no autocorrelation, near 0 means positive, near 4 means negative). DW = 0.02 here screams positive serial correlation: residuals are massively dependent month-to-month, exactly what you'd expect when fitting OLS to time-series data without a lagged predictor. Fixes include adding lag terms, switching to an ARIMA model, or using Newey-West standard errors via `sandwich::NeweyWest()`.

</details>

### Exercise 6.2: Run the Ramsey RESET test for omitted nonlinearity

**Task:** Fit `mpg ~ wt + hp` on `mtcars`, then run `lmtest::resettest()` with `power = 2:3` to test whether powers of the fitted values add explanatory power (a signal of omitted nonlinearity). Save the htest object to `ex_6_2`.

**Expected result:**

```
#>
#>  RESET test
#>
#> data:  fit
#> RESET = 4.6669, df1 = 2, df2 = 27, p-value = 0.01807
```

**Difficulty:** Intermediate

[HINTS]
Feeding powers of the model's own predictions back in can expose nonlinearity the linear form missed.
Run lmtest::resettest(fit, power = 2:3, type = "fitted") on the mpg ~ wt + hp model.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_2 <- lmtest::resettest(fit, power = 2:3, type = "fitted")
ex_6_2
#>
#>  RESET test
#>
#> data:  fit
#> RESET = 4.6669, df1 = 2, df2 = 27, p-value = 0.01807
```

**Explanation:** RESET augments the model with `y_hat^2` and `y_hat^3` and runs an F-test on those auxiliary terms. A significant p-value (here 0.018) says the linear specification is missing some nonlinear pattern. RESET tells you a problem exists without naming the predictor responsible: combine with `crPlots()` from Exercise 1.5 to localize where the missing curvature lives.

</details>

### Exercise 6.3: Apply the rainbow test for global linearity

**Task:** Fit `mpg ~ wt + hp` on `mtcars` once more, then run `lmtest::raintest()` which splits the sample into a "middle" subsample and an outer pair, refits both, and compares fit quality. Save the htest object to `ex_6_3` and interpret a small p-value.

**Expected result:**

```
#>
#>  Rainbow test
#>
#> data:  fit
#> Rain = 0.5132, df1 = 16, df2 = 13, p-value = 0.9051
```

**Difficulty:** Advanced

[HINTS]
If the middle of the sample fits much better than the edges, linearity is breaking down in the tails.
Call lmtest::raintest(fit, fraction = 0.5, order.by = ~ fitted(fit)) on the mpg ~ wt + hp model.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_3 <- lmtest::raintest(fit, fraction = 0.5, order.by = ~ fitted(fit))
ex_6_3
#>
#>  Rainbow test
#>
#> data:  fit
#> Rain = 0.5132, df1 = 16, df2 = 13, p-value = 0.9051
```

**Explanation:** The rainbow test reorders observations along the fitted-value axis, refits on the middle 50% of points, and compares residual sums of squares against the full fit via F. If the central subsample fits MUCH better than the wings, residuals deviate from linearity in the tails. Here p = 0.91 means no detectable misspecification across the sample range. Rainbow complements RESET: RESET is sensitive to omitted polynomial structure, rainbow is sensitive to break-point or piecewise patterns.

</details>

## Section 7. End-to-end diagnostic workflows (2 problems)

### Exercise 7.1: Build a six-panel diagnostic dashboard for a chosen specification

**Task:** Pick `mpg ~ wt + hp + qsec` on `mtcars`, then produce a 2-by-3 grid of diagnostics: residuals-vs-fitted, Q-Q, Scale-Location, Cook's distance (`plot.lm` panels 1, 2, 3, 4) plus `crPlots(fit)` for wt and hp. Save the fitted model to `ex_7_1`.

**Expected result:**

```
# Composite 2x3 panel:
#  [1,1] residuals vs fitted with LOWESS smoother
#  [1,2] normal Q-Q of standardized residuals
#  [1,3] scale-location plot
#  [2,1] Cook's distance bar chart with row labels
#  [2,2] CR plot for wt
#  [2,3] CR plot for hp
```

**Difficulty:** Advanced

[HINTS]
One page of stacked diagnostic panels lets you reject several failure modes at a single glance.
Just assign lm(mpg ~ wt + hp + qsec, data = mtcars) to ex_7_1; the par(mfrow) grid and plot calls are already written.

```r title="Your turn"
ex_7_1 <- # your code here
par(mfrow = c(2, 3))
plot(ex_7_1, which = 1); plot(ex_7_1, which = 2)
plot(ex_7_1, which = 3); plot(ex_7_1, which = 4)
car::crPlot(ex_7_1, variable = "wt")
car::crPlot(ex_7_1, variable = "hp")
par(mfrow = c(1, 1))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- lm(mpg ~ wt + hp + qsec, data = mtcars)

par(mfrow = c(2, 3))
plot(ex_7_1, which = 1)          # linearity
plot(ex_7_1, which = 2)          # normality
plot(ex_7_1, which = 3)          # homoscedasticity
plot(ex_7_1, which = 4)          # Cook's D
car::crPlot(ex_7_1, variable = "wt")
car::crPlot(ex_7_1, variable = "hp")
par(mfrow = c(1, 1))
#> 2x3 grid showing all four standard plot.lm panels plus two
#> component-plus-residual panels for wt and hp.
```

**Explanation:** Dashboarding all diagnostics on one page is the practical answer to "is this model good?" It lets you reject six failure modes at once: nonlinearity (panel 1), non-normality (panel 2), heteroscedasticity (panel 3), high-influence rows (panel 4), and predictor-specific misspecification (CR panels). For HTML reports, replace `par(mfrow)` with `patchwork::wrap_plots()` on ggplot2 equivalents like `ggfortify::autoplot()`.

</details>

### Exercise 7.2: Diagnose, remediate, and re-diagnose a problematic regression

**Task:** Fit `price ~ carat` on a 1000-row sample of `diamonds`, confirm heteroscedasticity with Breusch-Pagan, then refit `log(price) ~ log(carat)` and re-run the BP test plus a Scale-Location plot to verify the fix. Save the log-log model object to `ex_7_2`.

**Expected result:**

```
#> BP test (price ~ carat):       BP = 538.0, p < 2.2e-16    # heteroscedastic
#> BP test (log(price) ~ log(carat)): BP = 0.034, p = 0.853  # fixed
#> Scale-Location LOWESS for log-log model is approximately flat.
```

**Difficulty:** Advanced

[HINTS]
When variance grows with the mean, moving both sides of the model onto a log scale often settles it.
After confirming the problem, fit lm(log(price) ~ log(carat), data = d) into ex_7_2 and re-run lmtest::bptest().

```r title="Your turn"
set.seed(7)
d <- diamonds[sample(nrow(diamonds), 1000), ]
ex_7_2 <- # your code here
lmtest::bptest(ex_7_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
d <- diamonds[sample(nrow(diamonds), 1000), ]

raw_fit <- lm(price ~ carat, data = d)
lmtest::bptest(raw_fit)
#>  BP = 538.04, df = 1, p-value < 2.2e-16

ex_7_2 <- lm(log(price) ~ log(carat), data = d)
lmtest::bptest(ex_7_2)
#>  BP = 0.034, df = 1, p-value = 0.8534

plot(ex_7_2, which = 3)
#> Scale-Location LOWESS is flat: variance is now constant on the log scale.
```

**Explanation:** The price/carat relationship is multiplicative (price grows roughly with carat^1.7) and the noise scales with the mean, both of which a log-log specification fixes simultaneously. Re-running the BP test confirms variance is now constant on the log scale, and the slope estimate becomes the elasticity (a one percent rise in carat raises price by roughly 1.7 percent). When a single Box-Cox transformation cleans up THREE assumptions at once (linearity, homoscedasticity, normality), reach for it before trying robust standard errors.

</details>

## What to do next

- [Regression Diagnostics in R: A Practical Guide](Regression-Diagnostics-in-R.html): the parent walkthrough with full explanations of each plot panel and test.
- [Linear Regression in R](Linear-Regression.html): fit, predict, and interpret OLS before stress-testing it here.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html): short reference card for every assumption these exercises probe.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): 50 problems on fitting, interpretation, and prediction (do these first if diagnostics feel premature).
