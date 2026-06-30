---
title: "Regression Modeling Lesson 5: Heteroskedasticity and Autocorrelation"
catalog_blurb: "Why non-constant or correlated errors distort standard errors, and how to correct them."
description: "Heteroskedasticity and autocorrelation keep a regression's slope unbiased but break its standard errors. Spot, test and fix them with robust standard errors in R."
keywords: "heteroskedasticity, heteroscedasticity, autocorrelation, robust standard errors, sandwich estimator, Breusch-Pagan test, Durbin-Watson test, Newey-West, HAC standard errors, non-constant variance, regression diagnostics in R"
post_type: "LESSON"
curriculum_id: "6.20.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "5"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "Inference-and-Prediction-in-Regression.html"
course_prev: "Multicollinearity-in-Regression.html"
---

=== step === cover
::eyebrow Lesson 5 of 8
## Heteroskedasticity and Autocorrelation

In Lesson 4, two columns that secretly said the same thing (multicollinearity) made Priya's coefficients wobble. So far every fault has lived in the *predictors*: one rogue row, then two redundant columns. Now the trouble moves somewhere quieter and more dangerous, into the **errors** themselves.

Here is the unsettling part. When the errors misbehave in the two ways this lesson covers, your slope is still right. `lm()` hands you the correct number for how temperature drives sales. What it gets wrong is how *sure* it claims to be: the standard errors, t-values and p-values printed underneath. The estimate is honest; the confidence is a lie. The funnel below is the first warning sign.

By the end of this lesson you will be able to:

- Explain why non-constant variance and correlated errors leave the slope unbiased but corrupt its standard error
- Spot **heteroskedasticity** (a funnel) and **autocorrelation** (runs in time), and put a formal test on each
- Fix both with **robust standard errors** in R, and know when to correct the errors versus model the structure instead

**Prerequisites:** Lessons 1 to 4 (you can fit a line with `lm()`, read its coefficients, standard errors and p-values, and you met the residual and the four LINE assumptions in Lesson 2). You can run R. Every new term is defined as it appears.

::widget residual-plot {"start":"funnel"}

=== step === concept
::eyebrow The shared fault
## Why a broken error breaks the standard error

A standard error is a regression's claim about its own precision: "the slope is 2.0, give or take *this much*." Ordinary least squares computes that "give or take" from one tidy formula:

\[ \operatorname{Var}(\hat\beta) = \sigma^2 (X^\top X)^{-1} \]

where \(\hat\beta\) is the vector of estimated coefficients, \(X\) is the design matrix (a column of 1s plus Priya's temperatures), and \(\sigma^2\) is **one single error variance**, the typical squared size of a miss, assumed identical for every day. That formula, and every standard error and p-value built from it, is trustworthy only if two promises from Lesson 2 hold: the error variance is the same for every observation (**equal variance**), and the errors do not lean on each other (**independence**).

[KEY INSIGHT]
Break either promise and least squares still centers the line correctly: the slope estimate \(\hat\beta\) stays unbiased. What breaks is the variance formula above. So the slope is fine, but its standard error, and the t-value and p-value that depend on it, are wrong. This single fact is the spine of the whole lesson.

Let us give Priya a real season of data so we can watch it happen. Lessons 1 to 4 used a tidy 12-day sample; now she has logged a full 90-day summer. A fresh R session starts empty, so we build it here.

```r
set.seed(56)
n <- 90
day  <- 1:n
temp <- round(23 + 11 * sin(2 * pi * day / 40) + rnorm(n, 0, 1.2), 1)  # daily high (C), wandering over the summer
sigma <- 0.022 * temp^2                       # the error's spread GROWS with temperature
u <- numeric(n)
u[1] <- rnorm(1, 0, sigma[1])
for (i in 2:n) u[i] <- 0.45 * u[i - 1] + rnorm(1, 0, sigma[i])   # today's miss leaks into tomorrow's
cups <- round(11 + 2.0 * temp + u)
coffee <- data.frame(day, temp, cups)
head(coffee)
#>   day temp cups
#> 1   1 24.4   38
#> 2   2 25.8   60
#> 3   3 27.5   62
#> 4   4 28.5   83
#> 5   5 31.4   82
#> 6   6 33.7   25
```

We built two faults into that data on purpose (you will detect both before we are done): the error spread grows with temperature, and each day's miss leaks into the next. Now fit the plain line and look at what `lm()` claims.

```r
fit <- lm(cups ~ temp, data = coffee)
round(summary(fit)$coef, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    7.370      6.833   1.079    0.284
#> temp           2.008      0.272   7.379    0.000
```

Each warmer degree buys about **2.0** more cups, with a standard error of **0.272** and a p-value rounded to zero. That estimate is genuinely good. Hold on to the standard error **0.272** though, because by the end of the lesson we will show it is far too small.

=== step === concept
::eyebrow Villain one
## Heteroskedasticity: the funnel

**Heteroskedasticity** (also spelled heteroscedasticity) is a long word for a simple picture: the errors are not all the same size. Formally, the equal-variance promise

\[ \operatorname{Var}(\varepsilon_i) = \sigma^2 \quad\text{(the same for every day)} \]

is replaced by

\[ \operatorname{Var}(\varepsilon_i) = \sigma_i^2 \]

where \(\varepsilon_i\) is the error on day \(i\), the part of that day's sales no straight line could capture. The little subscript \(i\) on \(\sigma_i^2\) is the entire problem: the variance now carries a day index, so it can be tiny on one day and enormous on another.

Picture Priya's summer. On a mild 18-degree day demand is boringly predictable, so her misses are small. On a scorching 33-degree day anything can happen: a heatwave sells her out by noon, or a sudden thunderstorm clears the platform and she sells almost nothing. Big swings on hot days, small swings on cool ones. Plot the residuals against the fitted values and the band fans out from left to right, the classic **funnel**. Toggle the widget between a healthy fit and that funnel.

::widget residual-plot {"start":"funnel"}

[NOTE]
A funnel does not bend the line, it only changes the *spread* of the misses along it. That is why heteroskedasticity leaves the slope unbiased and damages only its standard error, exactly the split from the previous step.

=== step === concept
::eyebrow Detecting villain one
## Put a number on it: the Breusch-Pagan test

Eyeballing a funnel is a fine first move, but you want a test that decides for you. Start by looking at Priya's actual residuals, then formalize what you see.

```r
plot(fit, which = 1)   # Priya's residuals vs fitted: a band that fans open to the right
```

The idea behind the **Breusch-Pagan test** is delightfully direct. If the spread of the errors really does depend on temperature, then the *size* of each miss should be predictable from temperature. So regress the squared residuals (a stand-in for each miss's size) on the predictor, and check whether that auxiliary regression explains anything.

\[ \text{LM} = n \cdot R^2_{\text{aux}} \;\sim\; \chi^2_{k} \]

where \(n\) is the number of days, \(R^2_{\text{aux}}\) is the R-squared from regressing the squared residuals on the predictors, \(k\) is the number of predictors allowed to explain the variance (here 1, temperature), and \(\chi^2_k\) is the chi-square distribution the statistic follows *if the variance is actually constant* (the null hypothesis). A large LM, and the small p-value it gives, means the size of the miss genuinely tracks temperature.

```r
e   <- residuals(fit)
aux <- lm(I(e^2) ~ temp, data = coffee)   # does the SIZE of the miss depend on temperature?
LM  <- n * summary(aux)$r.squared          # the Breusch-Pagan statistic: n times the auxiliary R-squared
round(LM, 2)
#> [1] 26.76
signif(pchisq(LM, df = 1, lower.tail = FALSE), 3)   # p-value from chi-square with 1 df
#> [1] 2.3e-07
```

A p-value of 0.0000002 is decisive: the variance is not constant. In everyday work you would not assemble the statistic by hand, of course. The `lmtest` package wraps it in one line, and its default is exactly the `n * R-squared` you just built:

```r-static
library(lmtest)
bptest(fit)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 26.759, df = 1, p-value = 2.304e-07
```

=== step === quiz
::eyebrow Check yourself
## What do you do about it?

Priya's Breusch-Pagan test is significant (p far below 0.05), so there is real heteroskedasticity in her model. What is the correct response?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Refit the model: heteroskedasticity biases the coefficient estimates, so the slope of 2.0 must be corrected before you can trust it ::no Heteroskedasticity does not bias the slope. Least squares still centers the line correctly; the estimate of 2.0 cups per degree stands. What is unreliable is its standard error, not the coefficient itself.
- Keep the least-squares estimates, but report heteroskedasticity-robust standard errors so the p-values and intervals are trustworthy ::ok Exactly. The fix targets the standard errors, not the coefficients. You leave the slope where it is and swap the naive standard errors for robust ones, which is precisely what the next step builds.
- Delete the high-variance hot days so the spread becomes constant again ::no Dropping the most informative days to flatter an assumption throws away real data and hides the very behavior you should report. Heteroskedasticity is corrected at the standard-error stage, never by deleting rows.

=== step === concept
::eyebrow Fixing villain one
## Robust standard errors

The naive variance formula failed because it forced one shared \(\sigma^2\) onto every day. The fix refuses to assume that. Instead of trusting a single error variance, let **each day's own squared residual estimate that day's own error size**. That gives the famous **sandwich** estimator:

\[ \widehat{\operatorname{Var}}(\hat\beta) = \underbrace{(X^\top X)^{-1}}_{\text{bread}} \; \underbrace{\Big(\textstyle\sum_i \mathbf{x}_i \mathbf{x}_i^\top \, e_i^2\Big)}_{\text{meat}} \; \underbrace{(X^\top X)^{-1}}_{\text{bread}} \]

Read it literally, like a sandwich. The two slices of **bread**, \((X^\top X)^{-1}\), are the same matrix least squares already uses. The **meat** in the middle is the new idea: rather than one \(\sigma^2\), it weights each day's row of predictors \(\mathbf{x}_i\) by that day's own squared residual \(e_i^2\), so erratic hot days contribute the large variance they actually have. This is the White, or **heteroskedasticity-consistent (HC)**, estimator, and you can build it from scratch in five lines.

```r
X     <- model.matrix(fit)          # design matrix: a column of 1s and the temperatures
bread <- solve(t(X) %*% X)          # the (X'X)^-1 slices
meat  <- t(X) %*% diag(e^2) %*% X   # each row weighted by its own squared residual
V_rob <- bread %*% meat %*% bread   # the sandwich: the robust covariance matrix
round(rbind(estimate  = coef(fit),
            se_naive  = sqrt(diag(vcov(fit))),
            se_robust = sqrt(diag(V_rob))), 3)
#>           (Intercept)  temp
#> estimate        7.370 2.008
#> se_naive        6.833 0.272
#> se_robust       5.738 0.314
```

The slope estimate has not moved (still 2.008, exactly as promised). Its standard error, however, rises from **0.272** to **0.314**, about 15% larger: `lm()` was overstating how precisely it knew the slope. In practice the one-liner is `sandwich::vcovHC()` fed to `lmtest::coeftest()`, which prints the corrected test directly (the small difference, 0.318, is just a finite-sample tweak called HC1):

```r-static
library(sandwich); library(lmtest)
coeftest(fit, vcov = vcovHC(fit, type = "HC1"))
#>
#> t test of coefficients:
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)  7.36982    5.80252  1.2701    0.2074
#> temp         2.00836    0.31805  6.3146 1.072e-08 ***
```

[NOTE]
Robust standard errors fix your *inference*, not your *efficiency*. If you actually know how the variance grows, weighted least squares (`lm(..., weights = ...)`) or a log transform of the response can give tighter, better estimates. But robust errors are the low-effort default: keep the OLS slope, report the honest standard error. One caveat, which sets up the rest of the lesson: the HC sandwich corrects for non-constant variance only. It still assumes the errors are independent.

=== step === tryit
::eyebrow Your turn
## Build the Breusch-Pagan statistic

The one trick in the Breusch-Pagan recipe is what you regress on the predictor. It is not the residuals, and it is certainly not `cups`: it is the **squared** residuals, the stand-in for the size of each miss. Fill in the blank with the right response for the auxiliary regression.

```r
e   <- residuals(fit)
aux <- lm(____ ~ temp, data = coffee)   # BP regresses the SIZE of the miss on the predictor
round(n * summary(aux)$r.squared, 2)    # the LM statistic
```
::check {"regex":"e\\s*\\^\\s*2","gate":true,"difficulty":"intermediate","ok":"Right. The Breusch-Pagan test regresses the SQUARED residuals on the predictors, written I(e^2) so R actually squares them instead of reading the ^ as a formula operator; n times that auxiliary R-squared is the LM statistic, 26.76 here. Squaring is what turns a residual into a measure of its size.","no":"Use the squared residuals: lm(I(e^2) ~ temp). Plain residuals average to zero and would explain nothing; cups is the original response, not a measure of the miss. Wrap the square in I() so the formula squares e rather than treating ^ as a crossing operator."}
::solution
```r
e   <- residuals(fit)
aux <- lm(I(e^2) ~ temp, data = coffee)
round(n * summary(aux)$r.squared, 2)
#> [1] 26.76
```

=== step === concept
::eyebrow Villain two
## Autocorrelation: errors that march in step

The second promise was **independence**: one day's miss tells you nothing about the next day's. Formally,

\[ \operatorname{Cov}(\varepsilon_i, \varepsilon_j) \neq 0 \quad\text{for some } i \neq j \]

breaks it, where \(\operatorname{Cov}\) (covariance) measures whether two errors move together; independence needs it to be zero for every pair of different days. In time-ordered data the usual culprit is a **first-order autoregressive**, or **AR(1)**, error:

\[ \varepsilon_t = \rho\,\varepsilon_{t-1} + \nu_t \]

read as: today's error \(\varepsilon_t\) is a fraction \(\rho\) (the **autocorrelation**, between \(-1\) and \(1\)) of yesterday's error \(\varepsilon_{t-1}\), plus a fresh, independent shock \(\nu_t\). When \(\rho\) is positive, a day above the line tends to be followed by another above the line, so the misses arrive in **runs** rather than random flips.

This is exactly what summer weather does to Priya: a heatwave is not one hot day, it is a five-day spell. If her line under-predicts on the first hot day, it under-predicts the next few too. Here are her residuals in calendar order. Notice they do not zig-zag randomly around zero; they drift in streaks above and below it.

::widget chart-plotter {"data":[{"x":1,"y":-18.4},{"x":2,"y":0.8},{"x":3,"y":-0.6},{"x":4,"y":18.4},{"x":5,"y":11.6},{"x":6,"y":-50.1},{"x":7,"y":-26.4},{"x":8,"y":-46.3},{"x":9,"y":34.9},{"x":10,"y":9.3},{"x":11,"y":36.3},{"x":12,"y":34.3},{"x":13,"y":11.8},{"x":14,"y":33.8},{"x":15,"y":21.6},{"x":16,"y":8.6},{"x":17,"y":9.0},{"x":18,"y":14.0},{"x":19,"y":23.8},{"x":20,"y":3.6},{"x":21,"y":-16.8},{"x":22,"y":-0.1},{"x":23,"y":5.3},{"x":24,"y":-6.3}],"geoms":["line"],"x":"day","y":"residual"}

=== step === concept
::eyebrow Detecting and fixing villain two
## The Durbin-Watson test, and a sandwich for both

The standard test for autocorrelation is the **Durbin-Watson** statistic, which compares each day's residual to the one before it:

\[ \text{DW} = \frac{\sum_{t=2}^{n}(e_t - e_{t-1})^2}{\sum_{t=1}^{n} e_t^2} \approx 2\,(1 - \hat\rho) \]

where \(e_t\) is the residual for day \(t\) and \(\hat\rho\) is the estimated lag-1 autocorrelation. Read the approximation on the right: with no autocorrelation \(\hat\rho \approx 0\) and DW sits near **2**; strong positive autocorrelation drives \(\hat\rho\) toward 1 and DW toward **0**; negative autocorrelation pushes DW toward 4.

```r
e <- residuals(fit)
DW <- sum(diff(e)^2) / sum(e^2)            # squared day-to-day changes over squared residuals
round(DW, 3)
#> [1] 0.754
round(sum(e[-1] * e[-n]) / sum(e^2), 2)    # the lag-1 autocorrelation rho-hat that DW summarizes
#> [1] 0.56
round(acf(e, plot = FALSE)$acf[2:4], 3)    # autocorrelation at lags 1, 2, 3
#> [1]  0.564  0.279 -0.015
```

DW of **0.75** (far below 2) and a lag-1 autocorrelation of **0.56** confirm strong positive autocorrelation. The `lmtest::dwtest()` function adds the p-value, which needs a special distribution:

```r-static
library(lmtest)
dwtest(fit)
#>
#> 	Durbin-Watson test
#>
#> data:  fit
#> DW = 0.7541, p-value = 6.056e-12
#> alternative hypothesis: true autocorrelation is greater than 0
```

Now the fix, and here is the satisfying part: it is the **same sandwich**. The bread is unchanged; the meat simply grows to also include the products of nearby days' residuals (\(e_t e_{t-l}\)), down-weighted as the days drift apart. That is the **Newey-West**, or **heteroskedasticity- and autocorrelation-consistent (HAC)**, estimator, and it corrects for *both* villains at once.

```r-static
library(sandwich); library(lmtest)
coeftest(fit, vcov = NeweyWest(fit))
#>
#> t test of coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  7.36982   15.56561  0.4735  0.63705
#> temp         2.00836    0.83412  2.4078  0.01814 *
```

Look at the temperature standard error now. It has gone from a naive **0.272**, to a heteroskedasticity-robust **0.318**, to a HAC value of **0.834**, three times the original. The t-value collapses from 7.4 to 2.4. The slope is still 2.0, but treating 90 correlated days as 90 independent ones had Priya believing she knew that slope far more precisely than she really did. The temperature effect survives as significant, but the swagger is gone.

[NOTE]
HAC standard errors *correct your inference* given autocorrelation. If the time structure is the real story (forecasting tomorrow's sales), you should *model* it instead, with generalized least squares or a proper time-series model, which you will meet in the Time Series track. Diagnose first; then decide whether to correct the errors or model the structure.

=== step === quiz
::eyebrow Check yourself
## The danger of positive autocorrelation

Priya's residuals show strong positive autocorrelation (DW of 0.75). Her naive `lm()` output reported a temperature p-value rounded to zero, looking rock solid. What is the specific danger?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Positive autocorrelation biases the slope upward, so the true effect of temperature is smaller than 2.0 ::no The slope stays unbiased under autocorrelation, just as under heteroskedasticity. The 2.0 estimate is fine. The damage is to the standard error, not the coefficient.
- The naive standard errors are too small, so the p-values look more significant than they really are: false confidence ::ok Exactly. Positively correlated days repeat information rather than adding fresh evidence, so the 90 days are worth fewer truly independent observations. Least squares does not know this and reports a standard error that is too small, overstating significance, which the HAC correction repairs.
- Autocorrelation cannot matter here because the predictor is already so significant ::no A tiny p-value computed from a wrong (too-small) standard error is exactly the trap. Correcting for the autocorrelation tripled the standard error and cut the t-value from 7.4 to 2.4, so the apparent strength was partly an illusion.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take robust inference further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the "Potential Problems" section covers non-constant variance and correlated errors, the two faults you tested here.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/) - free, worked lessons on detecting and remedying heteroskedasticity and autocorrelation.
- [sandwich: robust covariance matrix estimators (CRAN)](https://cran.r-project.org/package=sandwich) - the package behind `vcovHC` (White / HC) and `NeweyWest` (HAC); its vignette derives both sandwiches you built by hand.
- [lmtest: testing linear regression models (CRAN)](https://cran.r-project.org/package=lmtest) - `bptest` (Breusch-Pagan) and `dwtest` (Durbin-Watson), the two formal tests used in this lesson.

=== step === complete
## Lesson 5 complete

You can now handle the two ways a regression's *errors* misbehave. **Heteroskedasticity** is non-constant variance (the funnel): spot it with residuals-vs-fitted, test it with Breusch-Pagan, and correct it with heteroskedasticity-robust (HC) standard errors. **Autocorrelation** is errors that move together over time (runs): spot it with residuals in time order, test it with Durbin-Watson, and correct it with HAC (Newey-West) standard errors, the same sandwich extended to handle both faults at once. The thread tying them together is the one fact worth memorizing: both leave the slope unbiased and break only the standard error, so the cure is to correct the standard error (or model the structure directly), never to distrust the coefficient.

Next, Lesson 6: Inference and Prediction in Regression. Now that you can trust a standard error, you will use it properly, separating a confidence interval (how sure are we about the average) from a prediction interval (where will the next day actually land), and seeing why explaining a relationship and predicting the next value are two different jobs.
