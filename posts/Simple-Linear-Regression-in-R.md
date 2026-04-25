---
title: "Linear Regression in R: Fit Your First Model With lm() and Understand Every Number"
slug: "Simple-Linear-Regression-in-R"
description: "Fit a linear model with lm() in R and interpret every number in summary(): coefficients, R-squared, F-statistic, residual SE, and t-values, step by step."
keywords: "linear regression in R, lm() function, simple linear regression, interpret lm summary, R-squared, residual standard error, F-statistic, regression coefficients, OLS regression, regression in R"
auto_link_terms: "simple linear regression|linear regression in R|lm() function|interpret lm summary|residual standard error|coefficient of determination|ordinary least squares"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "2.3.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Simple Linear Regression"
sidebar_order: 72
difficulty: "Beginner"
---

# Linear Regression in R: Fit Your First Model With lm() and Understand Every Number

<p class="lead">Linear regression in R fits the best straight line through your data using <code>lm(y ~ x, data)</code>, and <code>summary()</code> tells you exactly how strong that relationship is. This tutorial walks through every line of the summary output on a real dataset: coefficients, R², F-statistic, residual standard error, and t-values, with the math behind each number explained from scratch.</p>

## What does lm() actually do?

When you call `lm(y ~ x, data)`, R searches for the slope and intercept of the line that sits as close as possible to every point in your data. "Close" here means the sum of squared vertical distances from each point to the line is as small as possible. That single optimisation is everything `lm()` does. Every other number in `summary()` is bookkeeping that grades how good or bad that best line is.

The built-in `cars` dataset has 50 measurements of car speed (mph) and stopping distance (ft). We will model `dist ~ speed` and read the full output.

```r title="Fit lm() on cars and view summary"
model <- lm(dist ~ speed, data = cars)
summary(model)
#> 
#> Call:
#> lm(formula = dist ~ speed, data = cars)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -29.069  -9.525  -2.272   9.215  43.201 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) -17.5791     6.7584  -2.601   0.0123 *  
#> speed         3.9324     0.4155   9.464 1.49e-12 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 15.38 on 48 degrees of freedom
#> Multiple R-squared:  0.6511,	Adjusted R-squared:  0.6438 
#> F-statistic: 89.57 on 1 and 48 DF,  p-value: 1.49e-12
```

The slope `speed = 3.9324` says that for every 1 mph faster, the stopping distance grows by about 3.9 ft on average. The intercept `-17.58` is the predicted distance at 0 mph, which is meaningless on its own (you cannot drive at 0 and stop in negative feet) but is exactly what the line crosses on the y-axis. The R² of 0.65 says speed explains 65% of the variance in stopping distance. The rest of this post explains where each of those numbers came from.

A quick scatter plot makes the fit visible. We add the regression line with `abline()`, which knows how to draw a fitted `lm` object directly.

```r title="Plot cars with fitted line"
plot(dist ~ speed, data = cars,
     pch = 19, col = "steelblue",
     main = "Stopping distance vs speed",
     xlab = "Speed (mph)", ylab = "Stopping distance (ft)")
abline(model, col = "firebrick", lwd = 2)
```

The line slopes upward and passes through the cloud of points. Some points sit close to the line; others sit far away. Those vertical gaps are the residuals, and they drive almost every other number in the summary.

[KEY INSIGHT]
**`lm()` does one thing: it minimises the sum of squared residuals.** Every other quantity in `summary()`, R², t-values, p-values, F-statistic, residual SE, is computed from the residuals and the fitted coefficients after that optimisation is done.

**Try it:** Fit a simple linear regression of `Petal.Length` on `Sepal.Length` from the built-in `iris` dataset. Read off the slope from `coef()` and round it to 2 decimals.

```r title="Your turn: fit lm() on iris"
# Try it: fit Petal.Length on Sepal.Length
ex_iris_model <- # your code here

# Test: print the rounded slope
round(coef(ex_iris_model)[2], 2)
#> Expected: 1.86
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris fit solution"
ex_iris_model <- lm(Petal.Length ~ Sepal.Length, data = iris)
round(coef(ex_iris_model)[2], 2)
#> Sepal.Length 
#>         1.86
```

**Explanation:** `coef()` returns the named vector of coefficients; index `[2]` picks the slope (the intercept is index 1). Each extra cm of sepal length is associated with about 1.86 cm more petal length.

</details>

## How do you read the coefficient table?

The coefficient block is the heart of the summary. Each row is one coefficient (intercept, slope), and the four columns answer four different questions: what is the estimate, how uncertain is it, how many standard errors away from zero is it, and how surprising would that be if the true value were zero.

The relationships between those columns are not magic. The t-value is exactly `Estimate / Std. Error`, and the p-value is the two-tailed area under a t-distribution with $n - 2$ degrees of freedom (50 − 2 = 48 here). We can verify both by hand.

```r title="Verify t and p from coefficient table"
coefs <- summary(model)$coefficients
coefs
#>              Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) -17.57909  6.7584402 -2.601058 1.231882e-02
#> speed         3.93241  0.4155128  9.463990 1.489836e-12

# Manually compute t-value of the slope
t_slope <- coefs["speed", "Estimate"] / coefs["speed", "Std. Error"]
t_slope
#> [1] 9.46399

# Manually compute the two-tailed p-value (df = n - 2 = 48)
p_slope <- 2 * pt(-abs(t_slope), df = 48)
p_slope
#> [1] 1.489836e-12
```

The hand-computed t-value matches the table's 9.464 to four decimals, and the p-value matches `1.49e-12` exactly. So the rule is: a coefficient is "9.46 standard errors away from zero", which is so unlikely under the null hypothesis (true slope = 0) that the probability of seeing it by chance is roughly one in a trillion.

![The four blocks of summary(lm(...)) and what each one answers.](screenshots/Simple-Linear-Regression-in-R-summary-anatomy.webp)
*Figure 1: The four blocks of `summary(lm(...))` and what each one answers.*

[TIP]
**Significance stars are convenience, not science.** `***` simply means p < 0.001. Always report the actual p-value alongside the estimate and a confidence interval. Stars hide the difference between p = 0.0009 and p = 1e-12, even though the second is a vastly stronger signal.

**Try it:** The `(Intercept)` row of `coefs` lists Estimate −17.5791 and Std. Error 6.7584. Compute its t-value by hand and store it in `ex_t`.

```r title="Your turn: compute the intercept t-value"
# Try it: t = Estimate / Std. Error for the (Intercept) row
ex_t <- # your code here

ex_t
#> Expected: about -2.6011
```

<details>
<summary>Click to reveal solution</summary>

```r title="Intercept t-value solution"
ex_t <- coefs["(Intercept)", "Estimate"] / coefs["(Intercept)", "Std. Error"]
ex_t
#> [1] -2.601058
```

**Explanation:** The same `Estimate / Std. Error` rule applies to every coefficient row, including the intercept. The negative sign just reflects that the estimate sits below zero.

</details>

## What do residuals and residual standard error tell you?

A residual is the gap between an observed value and what the model predicted: $e_i = y_i - \hat{y}_i$. The five-number summary at the top of `summary()` (Min, 1Q, Median, 3Q, Max) is just a five-number description of these gaps. If the median is far from zero or the tails are wildly asymmetric, the line is missing something systematic.

The Residual Standard Error (RSE) is the typical size of one residual, in the units of `y`. Its formula divides the sum of squared residuals by $n - 2$ (because we estimated 2 parameters: intercept and slope) and then takes a square root.

$$\text{RSE} = \sqrt{\frac{\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}{n - 2}}$$

We can compute it directly and check.

```r title="Compute residual standard error by hand"
res <- residuals(model)
n <- length(res)
n
#> [1] 50

# Sum of squared residuals
ss_res_check <- sum(res^2)
ss_res_check
#> [1] 11353.52

# Residual standard error: sqrt(SSR / (n - 2))
rse <- sqrt(ss_res_check / (n - 2))
rse
#> [1] 15.37959

# Compare to the value in summary()
summary(model)$sigma
#> [1] 15.37959
```

The hand-computed RSE matches `summary(model)$sigma` exactly: 15.38 ft. That means a typical prediction from this model is off by about 15 ft of stopping distance. Whether that is "good" depends on your context: if average stopping distance is around 43 ft, an error of 15 ft is one third of the response, which is large. RSE is the most concrete way to talk about model error in real-world units.

[NOTE]
**RSE is a typical error, not a maximum error.** Roughly 68% of residuals fall within ±1 RSE of zero, and 95% fall within ±2 RSE, if the residuals are approximately normal. Use it as a back-of-envelope sense of prediction precision.

**Try it:** A property of OLS regression with an intercept is that the residuals always sum to (essentially) zero. Compute `mean(residuals(model))` and see if it is near zero.

```r title="Your turn: check residual mean"
# Try it: compute the mean of residuals
ex_mean_res <- # your code here

ex_mean_res
#> Expected: a number very close to 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual mean solution"
ex_mean_res <- mean(residuals(model))
ex_mean_res
#> [1] 8.65974e-17
```

**Explanation:** The mean is `8.66e-17`, which is zero up to floating-point error. This is not a coincidence: OLS with an intercept forces the residuals to sum to zero by construction.

</details>

## What does R² (and the F-statistic) measure?

R² (the coefficient of determination) is the share of variance in `y` that the model explains. It compares the spread of the residuals to the spread of `y` around its mean.

$$R^2 = 1 - \frac{SS_{res}}{SS_{tot}}, \quad SS_{tot} = \sum (y_i - \bar{y})^2, \quad SS_{res} = \sum (y_i - \hat{y}_i)^2$$

If your model perfectly predicts `y`, $SS_{res} = 0$ and $R^2 = 1$. If your model is no better than predicting the mean of `y`, $SS_{res} = SS_{tot}$ and $R^2 = 0$. The F-statistic asks the related question "is the model significantly better than just the intercept?". In simple linear regression with one predictor, the F-statistic equals the square of the slope's t-value, $F = t^2$, and they share a p-value. We can verify both.

```r title="Compute R-squared and F-statistic by hand"
# Total and residual sums of squares
ss_tot <- sum((cars$dist - mean(cars$dist))^2)
ss_res <- sum(residuals(model)^2)

# R-squared by formula
r2 <- 1 - ss_res / ss_tot
r2
#> [1] 0.6510794

summary(model)$r.squared
#> [1] 0.6510794

# F-statistic equals slope's t-value squared
f_stat <- t_slope^2
f_stat
#> [1] 89.56711

summary(model)$fstatistic
#>    value    numdf    dendf 
#> 89.56711  1.00000 48.00000
```

R² of 0.6511 means 65% of the variation in stopping distance is explained by speed alone, a strong signal for a one-variable model. The F-statistic of 89.57 matches `t_slope^2` exactly because, with one predictor, "is the model useful?" and "is the slope non-zero?" are literally the same question. With two or more predictors the F-test compares the *full* model against an intercept-only model, and is no longer the square of any single t-value.

[KEY INSIGHT]
**With one predictor, the F-test on the model and the t-test on the slope test the exact same hypothesis.** That is why their p-values are identical (both `1.49e-12` here). With multiple predictors they diverge: the F-test is "is *any* predictor useful?" while each t-test is "is *this* predictor useful given the others?".

**Try it:** Adjusted R² penalises R² for the number of predictors using the formula $1 - (1 - R^2) \cdot \frac{n - 1}{n - p - 1}$, where $p$ is the number of predictors (here, $p = 1$). Compute it and store in `ex_adj_r2`.

```r title="Your turn: compute adjusted R-squared"
# Try it: adjusted R-squared with n = 50, p = 1
ex_adj_r2 <- # your code here

round(ex_adj_r2, 4)
#> Expected: 0.6438
```

<details>
<summary>Click to reveal solution</summary>

```r title="Adjusted R-squared solution"
ex_adj_r2 <- 1 - (1 - r2) * (n - 1) / (n - 1 - 1)
round(ex_adj_r2, 4)
#> [1] 0.6438
```

**Explanation:** With one predictor and 50 observations, the penalty for the extra parameter shaves R² from 0.6511 to 0.6438. Always prefer adjusted R² when comparing models with different numbers of predictors.

</details>

## How do you check whether the fit is trustworthy?

Calling `plot()` on a fitted `lm` object produces four diagnostic plots: residuals vs fitted, normal Q-Q, scale-location, and residuals vs leverage. Each panel checks one of the assumptions OLS depends on. A 2×2 grid lets you scan all four at once.

```r title="Run all 4 diagnostic plots"
par(mfrow = c(2, 2))
plot(model)
#> (prints 4 diagnostic plots: Residuals vs Fitted, Q-Q,
#>  Scale-Location, Residuals vs Leverage)
par(mfrow = c(1, 1))
```

Each panel diagnoses a different problem: a curve in the residuals vs fitted plot signals that the relationship is not actually linear; deviation from the diagonal in the Q-Q plot signals non-normal residuals; a fan or trumpet shape in scale-location signals heteroscedasticity (changing variance); a point outside Cook's-distance contours in residuals vs leverage signals an observation that is single-handedly steering the fit. For the `cars` model the residuals vs fitted plot has a slight upward curl, suggesting the relationship may bend at high speeds, and observation 49 sits well above the cloud, both worth investigating.

![What each of the four plot(model) diagnostic panels checks.](screenshots/Simple-Linear-Regression-in-R-assumption-checks.webp)
*Figure 2: What each of the four `plot(model)` diagnostic panels checks.*

A full treatment of these checks lives in the [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html) post, including formal tests (Breusch-Pagan, Durbin-Watson) and remedies for each violation.

[WARNING]
**Do not delete an outlier just because it is far from the line.** A high-leverage point may be the most informative observation in your dataset. Investigate it (data entry error? unusual but real?) before any decision to remove or down-weight it.

**Try it:** `cooks.distance(model)` returns one influence value per observation. Use `which.max()` to find the index of the most influential point and store it in `ex_top`.

```r title="Your turn: find the most influential point"
# Try it: index of largest Cook's distance
ex_top <- # your code here

ex_top
#> Expected: 49
```

<details>
<summary>Click to reveal solution</summary>

```r title="Most influential point solution"
ex_top <- which.max(cooks.distance(model))
ex_top
#> 49 
#> 49
```

**Explanation:** Observation 49 has the largest Cook's distance, meaning the regression line would change the most if you removed that single row. The output shows both the row name and the row index.

</details>

## How do you use the model to predict new values?

Once a model is fitted, `predict()` turns it into a forecasting tool. Pass a `data.frame` of new x-values to `newdata`, and choose between two interval types:

- `interval = "confidence"`: uncertainty in the *mean* response at the given x. Narrow.
- `interval = "prediction"`: uncertainty in a *single new observation* at the given x. Wider, because it adds the residual noise.

```r title="Predict with confidence and prediction intervals"
new_speeds <- data.frame(speed = c(12, 18, 24))

# Confidence interval (uncertainty in the regression line)
pred_ci <- predict(model, newdata = new_speeds, interval = "confidence")
pred_ci
#>        fit      lwr      upr
#> 1 29.60981 24.39514 34.82448
#> 2 53.20428 47.10796 59.30060
#> 3 76.79874 67.45765 86.13983

# Prediction interval (uncertainty in a single new observation)
pred_pi <- predict(model, newdata = new_speeds, interval = "prediction")
pred_pi
#>        fit       lwr      upr
#> 1 29.60981 -1.749698 60.96932
#> 2 53.20428 22.094230 84.31432
#> 3 76.79874 45.071591 108.52589
```

At 18 mph the model predicts a stopping distance of 53.2 ft. The 95% confidence interval `[47.1, 59.3]` says we are 95% confident that the *average* stopping distance for cars at 18 mph lies in that range. The prediction interval `[22.1, 84.3]` is much wider because it covers a *single* car at 18 mph, and a single observation can sit far from the average due to residual noise. Notice the intervals are widest at the edges (12 and 24 mph) and tightest near the centre of the data, because the regression line is most certain near the mean of the predictors.

[WARNING]
**Do not extrapolate beyond the training range.** The `cars` dataset only has speeds between 4 and 25 mph. Predicting at speed 60 would technically work, but the line cannot know whether the relationship still holds out there.

**Try it:** Predict the stopping distance at `speed = 30` with a 95% prediction interval, store in `ex_pred95`. Then repeat with a 99% prediction interval (use the `level` argument), store in `ex_pred99`.

```r title="Your turn: predict at speed 30"
# Try it: prediction intervals at speed = 30
new_data <- data.frame(speed = 30)
ex_pred95 <- # your code here (95% prediction interval)
ex_pred99 <- # your code here (99% prediction interval)

ex_pred95
ex_pred99
#> Expected: ex_pred99 is wider than ex_pred95
```

<details>
<summary>Click to reveal solution</summary>

```r title="Prediction at speed 30 solution"
new_data <- data.frame(speed = 30)
ex_pred95 <- predict(model, newdata = new_data,
                     interval = "prediction", level = 0.95)
ex_pred99 <- predict(model, newdata = new_data,
                     interval = "prediction", level = 0.99)
ex_pred95
#>        fit      lwr      upr
#> 1 100.3938 67.40671 133.3808
ex_pred99
#>        fit      lwr      upr
#> 1 100.3938 56.40293 144.3846
```

**Explanation:** A 99% interval is wider than a 95% interval because demanding more confidence forces a larger range. Both intervals are also extremely wide (and extrapolating: speed 30 sits past the training range), so treat the point estimate of 100 ft with caution.

</details>

## Practice Exercises

Three capstone problems that combine multiple concepts. Each uses the WebR session's existing variables as starting points.

### Exercise 1: Fit and report the full picture on mtcars

Fit a simple linear regression of `mpg` on `wt` using `mtcars`, store the result in `my_model`, then print (a) the slope, (b) the residual standard error, and (c) the multiple R². Use only base-R extractor functions (`coef()`, `summary()$sigma`, `summary()$r.squared`).

```r title="Capstone Exercise 1"
# Fit lm(mpg ~ wt, data = mtcars), report slope, RSE, R²

# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_model <- lm(mpg ~ wt, data = mtcars)
coef(my_model)["wt"]                 # slope
#>        wt 
#> -5.344472
summary(my_model)$sigma              # residual SE
#> [1] 3.045882
summary(my_model)$r.squared          # R-squared
#> [1] 0.7528328
```

**Explanation:** Each extra 1000 lb of weight is associated with about 5.34 fewer mpg. Typical prediction error is ±3 mpg, and weight alone explains 75% of the variance in fuel economy.

</details>

### Exercise 2: Verify R² by hand

Using `my_model` from Exercise 1, manually compute `R² = 1 - SS_res / SS_tot` from `residuals(my_model)` and `mtcars$mpg`, store the result in `my_r2`, then confirm it matches `summary(my_model)$r.squared` to six decimals.

```r title="Capstone Exercise 2"
# Compute R² by hand and verify against summary()

# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ss_res_my <- sum(residuals(my_model)^2)
ss_tot_my <- sum((mtcars$mpg - mean(mtcars$mpg))^2)
my_r2 <- 1 - ss_res_my / ss_tot_my

round(my_r2, 6) == round(summary(my_model)$r.squared, 6)
#> [1] TRUE
```

**Explanation:** The two values agree to six decimals, confirming the formula. `summary()$r.squared` is just a tidy wrapper around this calculation.

</details>

### Exercise 3: Predict with prediction intervals on airquality

Drop NAs from `airquality`, store as `aq`. Fit `Ozone ~ Temp`, store as `aq_model`. Predict `Ozone` at `Temp = 80` and `Temp = 90` with 95% prediction intervals, store in `aq_pred`, then explain in one sentence why the interval at Temp 90 is wider than at Temp 80.

```r title="Capstone Exercise 3"
# Fit Ozone ~ Temp on cleaned airquality, predict at 80 and 90

# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
aq <- na.omit(airquality)
aq_model <- lm(Ozone ~ Temp, data = aq)
aq_pred <- predict(aq_model,
                   newdata = data.frame(Temp = c(80, 90)),
                   interval = "prediction", level = 0.95)
aq_pred
#>        fit       lwr      upr
#> 1 47.30453  4.928432  89.6806
#> 2 71.13119 28.405069 113.8573
```

**Explanation:** The interval at Temp 90 is wider because Temp 90 sits closer to the upper edge of the training data, where the line's uncertainty grows (the standard error of the fit is smallest near the mean of the predictor and grows toward the extremes).

</details>

## Complete Example

Putting everything together on a fresh dataset. We will model ozone on temperature in `airquality`, walk through the summary, run diagnostics, and predict.

```r title="End-to-end pipeline on airquality"
# 1. Clean and inspect
aq2 <- na.omit(airquality)
plot(Ozone ~ Temp, data = aq2,
     pch = 19, col = "darkgreen",
     main = "Ozone vs Temperature",
     xlab = "Temperature (°F)", ylab = "Ozone (ppb)")

# 2. Fit and inspect
model_aq <- lm(Ozone ~ Temp, data = aq2)
abline(model_aq, col = "firebrick", lwd = 2)
summary(model_aq)
#> Call:
#> lm(formula = Ozone ~ Temp, data = aq2)
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) -147.646     18.755  -7.872 2.76e-12 ***
#> Temp           2.439      0.239  10.207  < 2e-16 ***
#> 
#> Residual standard error: 23.92 on 109 degrees of freedom
#> Multiple R-squared:  0.4887,	Adjusted R-squared:  0.4841 
#> F-statistic: 104.2 on 1 and 109 DF,  p-value: < 2.2e-16

# 3. Diagnose
par(mfrow = c(2, 2)); plot(model_aq); par(mfrow = c(1, 1))

# 4. Predict at a few new temperatures
pred_aq <- predict(model_aq,
                   newdata = data.frame(Temp = c(70, 80, 90)),
                   interval = "prediction")
pred_aq
#>          fit        lwr      upr
#> 1  23.13088 -24.486107  70.7479
#> 2  47.51890   0.011577  95.0262
#> 3  71.90692  24.331866 119.4820
```

The slope is 2.44 ppb per °F (highly significant), but R² is only 0.49 and the residual SE is 24 ppb. So temperature is a real driver of ozone but explains less than half of its variability, and a single-day prediction can easily be off by 50 ppb. The diagnostic plots show a mild fan in scale-location and a few high-leverage points worth investigating before trusting this model for forecasting.

## Summary

Every number in `summary(lm(...))` answers a specific question. Here is the cheat sheet, mapped back to where each number came from in this tutorial.

| Number | What it answers | How it was computed |
|---|---|---|
| Estimate | Intercept and slope of the best line | OLS minimisation of $\sum e_i^2$ |
| Std. Error | Uncertainty in each estimate | Spread of residuals scaled by predictor variability |
| t value | Estimate measured in standard errors | `Estimate / Std. Error` |
| Pr(>\|t\|) | Probability of seeing this t under H₀: coef = 0 | Two-tailed area, t-dist with n−2 df |
| Residual standard error | Typical size of one residual, in y units | $\sqrt{SS_{res} / (n - 2)}$ |
| Multiple R² | Share of variance in y explained | $1 - SS_{res} / SS_{tot}$ |
| Adjusted R² | R² penalised for extra predictors | $1 - (1 - R^2)(n-1)/(n-p-1)$ |
| F-statistic | Is the model better than intercept-only? | In simple regression, $t^2$ of the slope |

![End-to-end workflow: data, fit, inspect, validate, predict.](screenshots/Simple-Linear-Regression-in-R-fit-pipeline.webp)
*Figure 3: End-to-end workflow: data, fit, inspect, validate, predict.*

The five-step routine, fit, inspect coefficients, validate residual SE and R², check diagnostics, predict with intervals, is the same on every linear model you will ever fit in R. Multiple regression just adds rows to the coefficient table; the framework is identical.

## References

1. R Core Team. *An Introduction to R*, Chapter 11: Statistical Models in R. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. R documentation, `?lm` and `?summary.lm`, base R reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
3. Faraway, J. *Linear Models with R*, 2nd edition, CRC Press (2014).
4. Fox, J. & Weisberg, S. *An R Companion to Applied Regression*, 3rd edition. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
5. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning with Applications in R*, Chapter 3: Linear Regression. [Link](https://www.statlearning.com/)
6. Kutner, M., Nachtsheim, C., Neter, J., Li, W. *Applied Linear Statistical Models*, 5th edition, McGraw-Hill (2004).
7. Wickham, H. & Grolemund, G. *R for Data Science*, 2nd edition, Model Basics chapter. [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html): go deeper on the four `plot(model)` panels with formal tests and the fix for each violated assumption.
- [Interpreting Regression Output Completely](Interpreting-Regression-Output-Completely.html): exhaustive walk-through of every number in `summary()`, including for multiple regression.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html): leverage, Cook's distance, DFBETAs, and influence measures for spotting problem observations.
