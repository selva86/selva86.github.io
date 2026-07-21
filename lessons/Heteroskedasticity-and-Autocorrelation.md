---
title: "Regression Modeling Lesson 5: Heteroskedasticity and Autocorrelation"
catalog_blurb: "How non-constant variance and correlated errors distort standard errors, and how to correct them."
description: "Heteroskedasticity and autocorrelation leave OLS slopes unbiased but corrupt their standard errors. Detect and fix them with robust and Newey-West errors in R."
keywords: "heteroskedasticity, autocorrelation, robust standard errors, White standard errors, sandwich estimator, Breusch-Pagan test, Durbin-Watson, Newey-West, HAC standard errors, heteroscedasticity, regression, R"
post_type: "LESSON"
curriculum_id: "6.20.5"
webr: true
mathjax: true
lesson_access: "pro"
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

In Lesson 4, Priya's regression was sabotaged by two *columns* that said the same thing. This lesson is a subtler kind of trouble: the columns are fine, the slope is fine, and yet the number printed next to it is a lie.

When Priya fits `lm(cups ~ temp)`, R hands her a slope and, right beside it, a **standard error**: the "give or take" that turns into her p-value and confidence interval. That standard error is computed under two quiet promises about the errors, that they all have the **same spread** and that they **do not lean on each other**. Break either promise and the slope stays correct, but the standard error, and every p-value and interval built on it, quietly goes wrong. Usually it comes out too small, so you feel far more certain than you have any right to.

This lesson teaches you to catch both broken promises and to repair the standard error without touching the (perfectly good) slope. The fanning plot below is the first villain: watch the spread grow as you move right.

By the end of this lesson you will be able to:

- Explain which part of a regression heteroskedasticity and autocorrelation corrupt, and which part they leave alone
- Test for non-constant variance with the Breusch-Pagan test and fix it with robust (White) standard errors
- Test for correlated errors with the Durbin-Watson statistic and fix it with Newey-West (HAC) standard errors
- Choose the right correction for a given dataset

**Prerequisites:** Lessons 1 to 4 (you can fit a line with `lm()`, and read its coefficients, standard errors and p-values). Lesson 2 introduced the residual funnel and runs-in-time as *shapes*; here we make them precise, test them, and correct them. Every new term is defined as it appears.

::widget residual-plot {"start":"funnel"}

=== step === concept
::eyebrow The number under the estimate
## What a standard error is quietly assuming

Priya has expanded her cart and now has 60 trading days of records. A fresh R session starts empty, so we build that table right here.

```r
set.seed(230)
n <- 60
temp  <- round(runif(n, 15, 34), 1)                 # 60 days, each day's high in Celsius
noise <- rnorm(n, 0, 1 + 1.15 * (temp - 15))        # the miss GROWS with temperature (see the next step)
cups  <- round(9 + 1.9 * temp + noise)              # sales: a true slope of 1.9 cups per degree, plus noise
coffee <- data.frame(temp, cups)
head(coffee)
#>   temp cups
#> 1 22.7   49
#> 2 17.2   44
#> 3 25.3   68
#> 4 20.5   51
#> 5 26.9   56
#> 6 17.3   39
```

Now fit the line and read the full table, not just the slope:

```r
fit <- lm(cups ~ temp, data = coffee)
round(summary(fit)$coef, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    9.213      6.985   1.319    0.192
#> temp           1.931      0.291   6.624    0.000
```

The slope is **1.931**: each extra degree buys about two more cups, exactly the relationship Priya has trusted all course. The column that matters this lesson is **Std. Error**, the 0.291 next to the slope. It is the estimated give-or-take on that 1.931, and everything downstream, the t value of 6.6 and the tiny p-value, is just the slope divided by its standard error. Formally, for the whole vector of coefficients \(\hat\beta\),

\[ \operatorname{Var}(\hat\beta) = \sigma^2 (X^\top X)^{-1} \]

where \(X\) is the design matrix (a column of 1s and the `temp` column), \(X^\top X\) is its cross-product, and \(\sigma^2\) is **one single number**: the variance (the typical squared size) of the error on *every* day. That one-number-for-all-days assumption is the promise. When Priya's misses are the same size on cool days and hot days, a healthy flat band of residuals like the one below, the formula is right and her standard error of 0.291 is honest.

::widget residual-plot {"start":"healthy"}

=== step === concept
::eyebrow Broken promise 1
## Heteroskedasticity: when the spread grows with x

Look again at how we built Priya's data: `noise <- rnorm(n, 0, 1 + 1.15 * (temp - 15))`. The spread of the miss is not a constant; it grows with temperature. That is the real world talking. On a cool 16-degree morning Priya's sales are boringly predictable, so her misses are tiny. On a scorching 33-degree afternoon anything can happen, a heatwave sells her out by noon, or a thunderstorm clears the platform, so her misses are huge. The errors no longer share one spread.

That is **heteroskedasticity** (Greek for "different scatter"). Formally, the constant \(\sigma^2\) from the last step is replaced by a value that changes from day to day:

\[ \operatorname{Var}(\varepsilon_i) = \sigma_i^2 \]

where \(\varepsilon_i\) is the error on day \(i\) and the subscript on \(\sigma_i^2\) is the whole point: the variance now carries an \(i\), it is a different size for each day. Plotted as residuals-vs-fitted, that shows up as the **funnel** below: a band that hugs zero on the left and fans wide on the right. Toggle it against the healthy band.

::widget residual-plot {"start":"funnel"}

[KEY INSIGHT]
Heteroskedasticity does **not** bias the slope. OLS still puts the line in the right place: we built the data with a true slope of 1.9, and `lm()` recovered 1.931. What breaks is the formula \(\sigma^2 (X^\top X)^{-1}\), which assumes one shared \(\sigma^2\). When the real spread grows, that formula computes the wrong standard error, so the 0.291, the t of 6.6, and the p-value are all untrustworthy. The estimate is fine; its stated precision is not.

=== step === quiz
::eyebrow Check yourself
## What did the funnel break?

Priya's residuals-vs-fitted plot for `lm(cups ~ temp)` fans into a clear funnel: tiny misses on cool days, big misses on hot days. She panics that her slope of 1.93 cups per degree must now be wrong. What has the funnel actually damaged?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The slope estimate itself is biased, so 1.93 is the wrong number and must be re-estimated ::no A funnel changes the SPREAD of the misses, not where the line sits. Least squares still centers the slope correctly (here it recovered the true 1.9); what breaks is the standard error, never the estimate.
- Nothing about the slope: heteroskedasticity leaves the coefficient unbiased. It corrupts the standard error, so the p-value and confidence interval on that slope are no longer trustworthy ::ok Exactly. The line sits in the right place; only the formula for its give-or-take assumed one constant spread, so the reported precision is wrong. Fix the standard error, keep the slope.
- The model's predictions are now useless, so its forecast for any given day cannot be trusted ::no Predictions come from the fitted line, which is unbiased. Heteroskedasticity does not move the line; it only makes the reported precision of the coefficients wrong.

=== step === concept
::eyebrow Detecting it
## Putting a number on the funnel: the Breusch-Pagan test

Your eyes already flagged the funnel; a test turns that hunch into a p-value. The idea behind the **Breusch-Pagan test** is beautifully direct: if the spread of the errors grows with `temp`, then the *size* of each residual should be predictable from `temp`. So regress the **squared** residuals on the predictor and see whether it explains anything.

```r
e   <- residuals(fit)
aux <- lm(I(e^2) ~ temp, data = coffee)   # regress the SQUARED residuals on the predictor
bp  <- n * summary(aux)$r.squared          # the statistic: n times that auxiliary R-squared
round(bp, 2)
#> [1] 6.47
round(pchisq(bp, df = 1, lower.tail = FALSE), 4)   # p-value from chi-square, df = number of predictors
#> [1] 0.011
```

The statistic is \(\text{BP} = n R^2_{\text{aux}}\), where \(n\) is the sample size and \(R^2_{\text{aux}}\) is the R-squared of that auxiliary regression of squared residuals on the predictors. Under the null hypothesis of constant variance it follows a \(\chi^2\) (chi-square) distribution with degrees of freedom equal to the number of predictors, here 1. A small p-value (0.011, well below 0.05) says the squared residuals really do track `temp`: the variance is not constant. You do not compute this by hand in practice; `bptest()` does the identical calculation:

```r
library(lmtest)
bptest(fit)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 6.4689, df = 1, p-value = 0.01098
```

Same statistic (6.47), same p-value (0.011): the test agrees with the picture. Priya has heteroskedasticity.

=== step === concept
::eyebrow The fix, from scratch
## Robust (White) standard errors: a better formula

If the trouble is that \(\sigma^2 (X^\top X)^{-1}\) assumed one shared spread, the fix is a formula that lets every day carry its **own** spread. That formula is the **heteroskedasticity-consistent** (or White, or "sandwich") estimator:

\[ \widehat{\operatorname{Var}}(\hat\beta) = (X^\top X)^{-1} \left( \sum_{i=1}^{n} e_i^2\, x_i x_i^\top \right) (X^\top X)^{-1} \]

Read it as a sandwich. The two \((X^\top X)^{-1}\) pieces are the **bread**; the middle sum is the **meat**. In the meat, \(x_i\) is day \(i\)'s row of the design matrix and \(e_i^2\) is that day's squared residual, so each day is weighted by *its own* miss instead of by one shared \(\sigma^2\). Volatile hot days, with big \(e_i^2\), get to inflate the variance the way they should. It is only a few lines in R:

```r
X <- model.matrix(fit)               # the design matrix: a column of 1s and the temp column
e <- residuals(fit)
bread <- solve(t(X) %*% X)           # (X'X)^-1
meat  <- t(X) %*% diag(e^2) %*% X     # each row weighted by its OWN squared residual
V_robust <- bread %*% meat %*% bread  # the sandwich
round(rbind(naive  = sqrt(diag(vcov(fit))),
            robust = sqrt(diag(V_robust))), 3)
#>        (Intercept)  temp
#> naive        6.985 0.291
#> robust       8.813 0.420
```

There it is. The naive standard error on the slope was **0.291**; the honest, robust one is **0.420**, about 44% larger. The naive formula was making Priya feel more certain than the fanning data justified.

=== step === concept
::eyebrow The fix, in practice
## The same correction in one line

You will never assemble the sandwich by hand at work; the `sandwich` package builds that exact matrix, and `coeftest()` re-runs the coefficient table with it. First, confirm the one-liner matches what we just computed:

```r
library(sandwich)
round(sqrt(diag(vcovHC(fit, type = "HC0"))), 3)   # the same White estimator, one call
#> (Intercept)        temp
#>       8.813       0.420
```

Identical to our by-hand `robust` row. Now the payoff, the corrected inference for Priya's slope:

```r
coeftest(fit, vcov = vcovHC(fit, type = "HC1"))   # robust t-tests; HC1 adds a small-sample bump
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)  9.21334    8.96375  1.0278    0.3083
#> temp         1.93056    0.42738  4.5172 3.13e-05 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The slope is **unchanged** at 1.931, exactly as promised. But its t value has dropped from the naive **6.62** (Lesson step 2) to an honest **4.52**. Priya's slope is still convincingly non-zero, just less spectacularly certain than OLS pretended.

[NOTE]
The `type` argument picks the small-sample flavour. `HC0` is White's original. `HC1` multiplies it by \(n/(n-k)\) (a degrees-of-freedom bump, the default in Stata). `HC3` is the most conservative and the usual recommendation for small samples. They agree in large samples; for a modest \(n\), reach for `HC3`.

=== step === tryit
::eyebrow Your turn
## Report a robust standard error

Priya wants the heteroskedasticity-robust test of her slope. Complete the call: which function builds the robust (White) covariance matrix that `coeftest()` should use?

```r
# Re-test Priya's slope with heteroskedasticity-robust standard errors.
coeftest(fit, vcov = ____(fit, type = "HC1"))
```
::check {"regex":"vcovHC\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. vcovHC() builds the heteroskedasticity-consistent (White) covariance matrix; handing it to coeftest() re-runs the coefficient table with robust standard errors, giving the honest t of 4.52.","no":"Use vcovHC(fit, type = \"HC1\"). That is the sandwich (White) covariance matrix; coeftest() reads it to produce the robust standard errors and t-values."}
::solution
```r
coeftest(fit, vcov = vcovHC(fit, type = "HC1"))
```

=== step === concept
::eyebrow Broken promise 2
## Autocorrelation: errors that march in step

The second promise was **independence**: one day's miss tells you nothing about the next day's. That one holds fine for a scatter of unrelated customers, but it breaks the moment your rows are in **time order**, because the world has momentum. To see it, we switch to Priya's other log: 30 *consecutive* days, where the weather comes in spells rather than jumping around at random.

```r
set.seed(267)
days <- 30
temp <- round(24 + cumsum(rnorm(days, 0, 1.1)), 1)   # a wandering warm spell, day to day
temp <- pmin(pmax(temp, 15), 34)                     # keep it in a sane range
err <- numeric(days)
err[1] <- rnorm(1, 0, 4)
for (i in 2:days) err[i] <- 0.75 * err[i - 1] + rnorm(1, 0, 3)   # today's miss carries into tomorrow
cups <- round(9 + 1.9 * temp + err)
sales <- data.frame(day = 1:days, temp, cups)
head(sales)
#>   day temp cups
#> 1   1 23.1   52
#> 2   2 23.1   54
#> 3   3 22.4   48
#> 4   4 21.8   50
#> 5   5 24.6   58
#> 6   6 25.9   62
```

The line `err[i] <- 0.75 * err[i - 1] + ...` is the engine of the trouble: today's error is 75% of yesterday's plus a fresh shock. That is an **AR(1)** (first-order autoregressive) error, and it means the misses no longer flip sign at random, they persist. Formally, independence said every pair of distinct errors had zero covariance; now

\[ \operatorname{Cov}(\varepsilon_t, \varepsilon_{t-1}) \neq 0 \]

where \(\operatorname{Cov}\) measures how two things move together and the subscripts \(t\) and \(t-1\) are today and yesterday. Fit the same simple line and plot the residuals in day order: instead of a random zig-zag they come in **runs**, a stretch above zero, then a stretch below, like slow waves.

```r
fit2 <- lm(cups ~ temp, data = sales)
round(coef(fit2), 3)
#> (Intercept)        temp
#>       8.622       1.903
```

::widget chart-plotter {"data":[{"x":1,"y":-1},{"x":2,"y":1},{"x":3,"y":-3},{"x":4,"y":0},{"x":5,"y":3},{"x":6,"y":4},{"x":7,"y":2},{"x":8,"y":1},{"x":9,"y":-3},{"x":10,"y":-2},{"x":11,"y":-5},{"x":12,"y":0},{"x":13,"y":2},{"x":14,"y":-2},{"x":15,"y":1},{"x":16,"y":-3},{"x":17,"y":-4},{"x":18,"y":3},{"x":19,"y":-1},{"x":20,"y":1},{"x":21,"y":3},{"x":22,"y":5},{"x":23,"y":7},{"x":24,"y":4},{"x":25,"y":3},{"x":26,"y":0},{"x":27,"y":0},{"x":28,"y":-5},{"x":29,"y":-5},{"x":30,"y":-4}],"geoms":["line"],"x":"day","y":"residual"}

The slope is again unbiased (1.903, essentially the true 1.9). But look at those runs: days 21 to 25 are all positive, days 28 to 30 all negative. A random, independent series would flip sign far more often. Priya's errors are autocorrelated.

=== step === concept
::eyebrow Measuring it
## Lag correlation and the Durbin-Watson statistic

"Runs" is a feeling; here are two numbers for it. The most direct is to line each day's residual up against the **previous** day's and correlate them. If the misses persist, that lag-1 correlation is clearly positive.

::widget chart-plotter {"data":[{"x":-1,"y":1},{"x":1,"y":-3},{"x":-3,"y":0},{"x":0,"y":3},{"x":3,"y":4},{"x":4,"y":2},{"x":2,"y":1},{"x":1,"y":-3},{"x":-3,"y":-2},{"x":-2,"y":-5},{"x":-5,"y":0},{"x":0,"y":2},{"x":2,"y":-2},{"x":-2,"y":1},{"x":1,"y":-3},{"x":-3,"y":-4},{"x":-4,"y":3},{"x":3,"y":-1},{"x":-1,"y":1},{"x":1,"y":3},{"x":3,"y":5},{"x":5,"y":7},{"x":7,"y":4},{"x":4,"y":3},{"x":3,"y":0},{"x":0,"y":0},{"x":0,"y":-5},{"x":-5,"y":-5},{"x":-5,"y":-4}],"geoms":["point"],"x":"prev_residual","y":"residual"}

Each dot is one day: yesterday's miss across, today's miss up. The upward tilt (the widget reports the Pearson \(r\)) is autocorrelation you can see. Now the two numbers:

```r
e2 <- residuals(fit2)
round(cor(e2[-1], e2[-length(e2)]), 3)   # correlation of each miss with the previous day's
#> [1] 0.558
dw <- sum(diff(e2)^2) / sum(e2^2)         # the Durbin-Watson statistic
round(dw, 3)
#> [1] 0.858
```

The **Durbin-Watson statistic** is the standard summary of lag-1 autocorrelation:

\[ DW = \frac{\sum_{t=2}^{n} (e_t - e_{t-1})^2}{\sum_{t=1}^{n} e_t^2} \]

where \(e_t\) is the residual on day \(t\). It runs from 0 to 4. A value near **2** means no autocorrelation; **below 2** means positive autocorrelation (consecutive misses alike); above 2 means negative. In fact \(DW \approx 2(1 - r_1)\), where \(r_1\) is that lag-1 correlation, so the two numbers are one idea:

```r
2 * (1 - 0.558)   # the quick link: DW is about 2(1 - lag-1 correlation)
#> [1] 0.884
```

That 0.884 is almost exactly the 0.858 the full formula gave (the small gap is the endpoint terms). Priya's DW of 0.86 is far below 2. The formal test attaches a p-value:

```r
dwtest(fit2)
#>
#> 	Durbin-Watson test
#>
#> data:  fit2
#> DW = 0.85814, p-value = 0.0001106
#> alternative hypothesis: true autocorrelation is greater than 0
```

A p-value of 0.0001: the positive autocorrelation is real, not a fluke of 30 days.

=== step === quiz
::eyebrow Check yourself
## Reading a Durbin-Watson value

On Priya's 30 consecutive days the residuals come in long runs of the same sign, and the Durbin-Watson statistic is 0.86 with a test p-value of 0.0001. What does that tell you, and what is the danger for her regression?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Positive autocorrelation: consecutive misses are correlated (DW well below 2). The slope is still unbiased, but OLS treats 30 correlated days as 30 independent ones, so it understates the standard error and the result looks more certain than it is ::ok Exactly. Autocorrelation is a disease of the error structure, not the estimate. Because the days are not independent, OLS double-counts information and reports a standard error that is too small, the classic false confidence.
- A DW below 2 means the slope estimate is biased downward and must be corrected before it can be used ::no DW diagnoses the error structure, not the estimate. The slope stays unbiased under autocorrelation; what gets corrupted is the standard error, typically making it too small.
- A DW of 0.86 is close enough to 2 to conclude the errors are independent ::no The scale runs 0 to 4 with 2 meaning no autocorrelation, so 0.86 is far below 2, and the test's p-value of 0.0001 confirms it. This is strong positive autocorrelation, not independence.

=== step === concept
::eyebrow The fix
## Newey-West (HAC) standard errors

The repair mirrors the heteroskedasticity fix exactly, because it is the *same sandwich* with a wider filling. For a funnel, the meat weighted each day by its own squared residual. For autocorrelation, the meat must also add in the **products of nearby errors**, \(e_t e_{t-1}\), \(e_t e_{t-2}\), and so on, because those neighbouring misses are exactly the correlation we need to account for. That estimator is **HAC**: Heteroskedasticity- and Autocorrelation-Consistent, better known as **Newey-West**. It corrects for both broken promises at once, and `sandwich` supplies it:

```r
coeftest(fit2, vcov = NeweyWest(fit2, lag = 3, prewhite = FALSE))   # HAC standard errors
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)   8.6218     6.7447  1.2783    0.2116
#> temp          1.9025     0.2664  7.1416 9.018e-08 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The slope is untouched at **1.903**. But its standard error has risen from the naive **0.161** to **0.266**, and its t value has fallen from a giddy **11.8** to a still-strong **7.1**. The `lag` argument sets how many neighbours the meat counts (how far the correlation reaches); `prewhite = FALSE` keeps the estimator to the plain kernel form. Autocorrelation had tricked OLS into treating dependent days as independent evidence; Newey-West puts the honest, wider give-or-take back on the slope.

=== step === concept
::eyebrow Choosing
## Which correction, when

Both villains corrupt only the standard error, and both are repaired by swapping the covariance matrix, never by touching the slope. The choice between them comes down to whether your rows have a time order:

| What you see | What you likely have | Test | Correction |
|---|---|---|---|
| Cross-section (customers, stores), residual **funnel** | Heteroskedasticity | Breusch-Pagan | HC robust SE (`vcovHC`) |
| Time-ordered data (days, months), residual **runs** | Autocorrelation, often with heteroskedasticity too | Durbin-Watson | HAC / Newey-West SE |
| Time-ordered, and unsure which | Possibly both | BP **and** DW | HAC / Newey-West (covers both) |
| A clear **curve** in residuals-vs-fitted | A wrong mean model, not just bad errors | residuals-vs-fitted | Fix the MODEL (transform, add a term), not the SE |

[KEY INSIGHT]
Robust and HAC standard errors are cheap insurance: when the assumptions actually hold they barely change your answer, and when they break they rescue your inference. What they do **not** do is fix a biased slope. If the residuals show a curve (a missed nonlinearity from Lesson 2) or you have left out an important variable, the *estimate* is wrong, and no covariance trick can repair that, you must fix the model itself. Robust errors correct the give-or-take, never the line.

=== step === tryit
::eyebrow Your turn
## Correct for both at once

Priya's daily `sales` are a time series: the errors are autocorrelated, not just heteroskedastic. Complete the call with the covariance that corrects for **both** heteroskedasticity and autocorrelation.

```r
# Autocorrelation-robust test of the slope on the time-ordered sales data.
coeftest(fit2, vcov = ____(fit2, lag = 3, prewhite = FALSE))
```
::check {"regex":"NeweyWest\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. NeweyWest() builds the HAC (heteroskedasticity- and autocorrelation-consistent) covariance matrix, so coeftest() reports the honest standard error, 0.266 and t = 7.1 on the slope.","no":"Use NeweyWest(fit2, lag = 3, prewhite = FALSE). That is the HAC estimator; vcovHC would fix only the variance, not the correlation across days."}
::solution
```r
coeftest(fit2, vcov = NeweyWest(fit2, lag = 3, prewhite = FALSE))
```

=== step === quiz
::eyebrow Check yourself
## Pick the right tool

A colleague has cross-sectional data, 400 customers with no time order, and finds a clear funnel in the residuals but (of course) no autocorrelation, since there is no time axis to correlate along. Which correction should they reach for?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Newey-West (HAC) standard errors, because they are the most general and therefore always the safest choice ::no HAC corrects for autocorrelation along an ordering this data does not have. On a pure cross-section it would impose a time structure that is not there; the right tool is plain heteroskedasticity-robust errors.
- No correction: with 400 rows the sample is large enough that heteroskedasticity stops mattering ::no Sample size does not cure heteroskedasticity. The funnel corrupts the standard errors at any n, so robust errors are still needed.
- Heteroskedasticity-consistent (HC / White) robust standard errors via vcovHC: they fix the funnel, and there is no autocorrelation to correct ::ok Exactly. A funnel with no time ordering is pure heteroskedasticity, so HC robust standard errors are the match. Newey-West would assume a time structure the data does not have.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take robust and HAC standard errors further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the "Potential Problems" section covers non-constant variance and correlated errors with the same residual plots you used here.
- [Econometric Computing with HC and HAC Covariance Matrix Estimators (Zeileis, 2004, JSS)](https://www.jstatsoft.org/article/view/v011i10) - the paper behind `vcovHC` and `NeweyWest`, with the sandwich math laid out in full.
- [sandwich: Robust Covariance Matrix Estimators (CRAN)](https://cran.r-project.org/package=sandwich) - the package reference and vignettes for every HC and HAC option, with worked examples.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/) - free, worked lessons on detecting and correcting non-constant variance and correlated errors.

=== step === complete
## Lesson 5 complete

You can now handle the third and fourth ways a regression misleads you, and both live in the *errors*, not the coefficients. **Heteroskedasticity** (the funnel: \(\operatorname{Var}(\varepsilon_i) = \sigma_i^2\)) and **autocorrelation** (the runs: \(\operatorname{Cov}(\varepsilon_t, \varepsilon_{t-1}) \neq 0\)) leave the slope unbiased but corrupt its standard error, usually making you overconfident. You detect them with the **Breusch-Pagan** test and the **Durbin-Watson** statistic, and you repair the standard error, never the slope, by swapping in a robust covariance: **HC / White** (`vcovHC`) for a funnel, **HAC / Newey-West** (`NeweyWest`) for correlated errors over time. Across the whole lesson the estimate never moved; only its honesty about precision did.

Next, Lesson 6: Inference and Prediction in Regression. Now that you can produce a *trustworthy* standard error, you will put it to work: turning it into confidence intervals for the slope and prediction intervals for a new day, testing coefficients properly, and seeing why explaining a relationship and predicting a new value are two different jobs with two different intervals.
