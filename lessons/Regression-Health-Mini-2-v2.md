---
title: "How to test and fix autocorrelation in residuals"
slug: "Regression-Health-Mini-2-v2"
description: "Learn to test regression residuals for autocorrelation with the Durbin-Watson statistic, see what it breaks, and fix it with Newey-West HAC standard errors."
keywords: "durbin-watson test, autocorrelation in residuals, serial correlation, newey-west standard errors, HAC standard errors, regression residuals, lmtest, sandwich package"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "2"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-1"
course_next: ""
curriculum_id: "0.0.19"
lesson_access: "windowed"
catalog_blurb: "Test whether your regression's errors are independent, and fix it when they are not."
---

=== step === cover
## How to test and fix autocorrelation in residuals

Today's lesson is about one requirement ordinary least squares makes of your residuals, one that is easy to break without ever noticing: each residual has to carry no information about the one that comes right after it.

Here is a simulated example to make that concrete. A company regresses its monthly sales on its monthly ad spend, both measured in thousands of dollars, over 60 months, five years of data. It fits the usual straight line, `sales ~ ad_spend`, using ordinary least squares, OLS for short.

```r
# Fit sales on ad spend across 60 months, ready for the rest of the lesson
set.seed(42)
ad_spend <- 20 + cumsum(rnorm(60, mean = 0.3, sd = 1.5))
ad_spend <- round(ad_spend, 2)

e <- numeric(60)
e[1] <- rnorm(1, 0, 9)
for (t in 2:60) {
  e[t] <- 0.8 * e[t - 1] + rnorm(1, 0, 5.5)
}

sales <- round(90 + 1.6 * ad_spend + e, 2)
model <- lm(sales ~ ad_spend)
```

The fit looks perfectly normal. But watch what happens when you chart the residuals, the gap between each month's actual sales and what the model predicted, against the month they belong to.

::widget chart-plotter {"data":[{"x":1,"y":-8.72},{"x":2,"y":-7.21},{"x":3,"y":-3.42},{"x":4,"y":4.29},{"x":5,"y":-1.27},{"x":6,"y":5.26},{"x":7,"y":5.94},{"x":8,"y":9.75},{"x":9,"y":13.16},{"x":10,"y":14.01},{"x":11,"y":5.65},{"x":12,"y":4.80},{"x":13,"y":6.56},{"x":14,"y":-0.30},{"x":15,"y":-3.47},{"x":16,"y":0.54},{"x":17,"y":4.43},{"x":18,"y":4.75},{"x":19,"y":-2.56},{"x":20,"y":-8.01},{"x":21,"y":1.36},{"x":22,"y":1.27},{"x":23,"y":0.85},{"x":24,"y":0.03},{"x":25,"y":-6.08},{"x":26,"y":-1.93},{"x":27,"y":-3.11},{"x":28,"y":-4.57},{"x":29,"y":1.29},{"x":30,"y":4.91},{"x":31,"y":11.42},{"x":32,"y":6.53},{"x":33,"y":9.05},{"x":34,"y":14.48},{"x":35,"y":5.56},{"x":36,"y":-1.19},{"x":37,"y":-7.77},{"x":38,"y":-14.93},{"x":39,"y":-12.99},{"x":40,"y":-7.34},{"x":41,"y":0.29},{"x":42,"y":5.32},{"x":43,"y":-1.42},{"x":44,"y":8.27},{"x":45,"y":1.83},{"x":46,"y":1.67},{"x":47,"y":-1.89},{"x":48,"y":-2.09},{"x":49,"y":-1.27},{"x":50,"y":-0.49},{"x":51,"y":-0.75},{"x":52,"y":-0.69},{"x":53,"y":-2.86},{"x":54,"y":-4.96},{"x":55,"y":-13.19},{"x":56,"y":-12.63},{"x":57,"y":-12.66},{"x":58,"y":4.81},{"x":59,"y":-5.00},{"x":60,"y":-3.32}],"geoms":["line","point"],"x":"month","y":"residual"}

Look at the shape of that line. It does not bounce up and down around zero at random. It moves in long runs instead: several months positive in a row, then several months negative in a row, before swinging back the other way.

That run of same-signed residuals sitting together, instead of scattering with no pattern, is what a broken independence assumption looks like on a page.

=== step === concept
## Why OLS needs its residuals to be independent

Ordinary least squares assumes its residuals are independent of one another. In plain terms, knowing this month's residual should tell you nothing about the sign or the size of next month's.

Time-ordered data breaks that assumption constantly, and the reason is simple. Something can nudge sales up, or down, for several months running: a slow shift in what customers want, a competitor's price cut that takes months to fully bite, a stretch where the sales team is short-staffed. None of that is a variable in `sales ~ ad_spend`, so it lands in the residual instead, and it tends to land there for more than one month at a time.

The widget below runs that idea as an experiment. It fits many regressions on data built with a chosen amount of month-to-month correlation between the errors, and it measures two things every time: how often the model's 95% interval actually contains the true value, called coverage, and how good the fit looks, R-squared.

::widget assumption-dial {"assumption": "autocorrelation"}

With the dial at its lowest step, the errors are independent and coverage sits close to the 95% a confidence interval is built to hit. Drag the dial up toward severe and coverage collapses, while the fit barely moves from where it started. That gap, between a model that still looks fine and an interval you can no longer trust, is the whole reason autocorrelation matters.

=== step === concept
## The Durbin-Watson statistic, worked out by hand

So there is clearly a pattern in the residuals from the last plot. But "clearly a pattern" is not something you can act on. You need a number, and a rule for reading it.

The Durbin-Watson statistic, usually written `d`, is that number. It compares each residual to the one right before it.

\[
d = \frac{\sum_{t=2}^{n} (e_t - e_{t-1})^2}{\sum_{t=1}^{n} e_t^2}
\]

Here \(e_t\) is the residual at month \(t\), and \(n\) is the number of months, 60 in this case. The numerator adds up the squared gap between each residual and the one before it. The denominator adds up the squared residuals themselves.

Think through what that ratio does. If neighbouring residuals move together, this month's error looking much like last month's, the gaps in the numerator stay small, so `d` drops toward 0. If residuals bounce back and forth instead, above zero, then below, then above again, the gaps swell and `d` climbs toward 4. If the residuals really are independent, `d` lands near 2.

Here is that computation done directly on the running example's residuals.

```r
# Compute the Durbin-Watson statistic by hand from the fitted model's residuals
res <- resid(model)
d_numerator   <- sum(diff(res)^2)
d_denominator <- sum(res^2)
d_by_hand     <- d_numerator / d_denominator

round(c(numerator = d_numerator, denominator = d_denominator, d = d_by_hand), 4)
#>   numerator denominator           d 
#>   1733.6658   2715.6340      0.6384 
```

`d` comes out to 0.6384, a long way below 2 and much closer to 0. That alone says these residuals are not behaving like independent draws.

There is a quicker way to sanity check that number. `d` is approximately \(2(1 - \hat{\rho})\), where \(\hat{\rho}\) is the correlation between each residual and the one right before it, its lag-1 correlation.

```r
# Check the by-hand d against the lag-1-correlation shortcut
rho_hat <- cor(res[-length(res)], res[-1])
round(c(rho = rho_hat, shortcut_d = 2 * (1 - rho_hat)), 3)
#>        rho shortcut_d 
#>      0.676      0.649 
```

The lag-1 correlation is 0.676, and the shortcut formula lands at 0.649, close to the 0.6384 computed directly from the definition. The two will rarely match to the decimal, since the shortcut is an approximation, but they agree on the story: these residuals are strongly and positively correlated with their own past.

=== step === concept
## Running the test with dwtest()

Working `d` out by hand is useful once, to see where the number comes from. In practice you call a function and read its p-value along with it.

```r
# Run the Durbin-Watson test on the fitted model
library(lmtest)
dwtest(model)
#> 
#>   Durbin-Watson test
#> 
#> data:  model
#> DW = 0.6384, p-value = 1.817e-10
#> alternative hypothesis: true autocorrelation is greater than 0
```

`dwtest()` reports the same 0.6384 computed by hand a moment ago. The p-value, 1.817 times ten to the minus 10, is close enough to zero that chance is not a credible explanation for a value this low. The last line names the default direction the test checks, autocorrelation greater than zero, which is by far the most common case in time-ordered data like this one.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- This is close to independent, since 0.64 is a small number compared to most test statistics you have seen. ::no
- This is strong positive autocorrelation. 0.6384 sits far below 2, the value dwtest() would report if the residuals carried no lag-1 information. ::ok Exactly right. The reference point for the Durbin-Watson statistic is 2, not 0. A value this far below 2 means each residual is a good predictor of the next one.
- The model's R-squared must be very low, since d is a small number too. ::no
- This is strong negative autocorrelation, since any value below 2 counts as negative. ::no The Durbin-Watson statistic runs from 0 to 4, with 2 meaning no lag-1 autocorrelation. Values below 2 point to positive autocorrelation, where neighbouring residuals move together, and values above 2 point to negative autocorrelation, where they alternate in sign. At 0.6384, this model shows strong positive autocorrelation, and that number says nothing about R-squared, which measures something else entirely.

=== step === concept
## What this actually breaks: coefficients vs. standard errors

The residuals in this model are autocorrelated. So what does that actually cost you?

Start with what it does not touch: the ad_spend coefficient. Fitting `sales ~ ad_spend` by OLS gives 1.29, the estimated slope of sales on ad spend, whether or not the residuals are autocorrelated. Autocorrelation does not bias a coefficient.

What it does touch is the standard error, the number that says how much that 1.29 would move around if you refit the model on a fresh set of 60 months. OLS computes that number by assuming each month's residual is independent of the others. When they are not, as here, that assumption is false, and the standard error comes out smaller than it should. A standard error that is too small drags the t-statistic up and the p-value down, so ad_spend ends up looking like a more significant predictor than it really is.

The `assumption-dial` widget you saw earlier shows exactly this split. Here it is again, this time turned to the running example's own severity.

::widget assumption-dial {"assumption": "autocorrelation", "levels": 20, "start": 14}

At phi = 0.68, close to this model's own lag-1 correlation of 0.676, coverage collapses well below the 95% a confidence interval is built to hit, while the fit line barely moves from where it started. That is the coefficient-versus-standard-error split from a moment ago, drawn as one picture: the model still looks fine, and the interval around it, computed the naive way, is narrower than it should be.

=== step === concept
## Fixing it with Newey-West (HAC) standard errors

The coefficient is fine. The standard error is not. So the fix should touch only the standard error, and leave the coefficient alone.

That is exactly what a Newey-West correction does. It is one member of a family called HAC standard errors, short for heteroskedasticity and autocorrelation consistent. Instead of assuming independent residuals, it builds a corrected covariance matrix that allows for the correlation the Durbin-Watson test just found, and `lmtest::coeftest()` uses that corrected matrix to redo the inference.

```r
# Compare naive OLS standard errors with Newey-West HAC standard errors
library(sandwich)

naive <- summary(model)$coefficients
naive
#>               Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) 102.389468  7.1851310 14.250188 1.331769e-20
#> ad_spend      1.287885  0.2226371  5.784681 3.078094e-07

coeftest(model, vcov = NeweyWest(model, prewhite = FALSE))
#> 
#> t test of coefficients:
#> 
#>              Estimate Std. Error t value  Pr(>|t|)    
#> (Intercept) 102.38947   10.13873 10.0988 2.153e-14 ***
#> ad_spend      1.28788    0.32301  3.9871 0.0001896 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Look at the ad_spend row in both tables. The coefficient, 1.29, is identical in both. The standard error widens from 0.223 to 0.323, about 1.45 times over. That pushes the t-statistic down from 5.78 to 3.99, and the p-value up from 3.08 times ten to the minus 7 to 0.00019. Still a real effect, since 0.00019 is well under any usual threshold, but far less certain than the naive p-value made it look.

`prewhite = FALSE` tells `NeweyWest()` to build the correction directly from the residuals, without first fitting an extra autoregressive model to them. It is a reasonable default here since the autocorrelation is already strong and well characterised by the Durbin-Watson test.

HAC standard errors are not the only fix, and they are not always enough. When the autocorrelation is this strong, or when the goal is also to forecast the series, three other approaches model the dependence directly rather than only correcting its standard error: adding lagged predictors to the regression, fitting the model with `nlme::gls(correlation = corAR1())`, or building an ARIMA-errors regression with `forecast::Arima()`. Each of those changes what the model estimates, not just how its uncertainty is reported.

=== step === complete
## The full workflow, start to finish

Here is the entire pipeline in one place: fit the model, test its residuals, and correct the inference if the test rejects independence.

```r
# The full workflow: fit, test for autocorrelation, then correct the standard errors
model <- lm(sales ~ ad_spend)

dwtest(model)
#> 
#>   Durbin-Watson test
#> 
#> data:  model
#> DW = 0.6384, p-value = 1.817e-10
#> alternative hypothesis: true autocorrelation is greater than 0

coeftest(model, vcov = NeweyWest(model, prewhite = FALSE))
#> 
#> t test of coefficients:
#> 
#>              Estimate Std. Error t value  Pr(>|t|)    
#> (Intercept) 102.38947   10.13873 10.0988 2.153e-14 ***
#> ad_spend      1.28788    0.32301  3.9871 0.0001896 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The whole workflow is three calls, one decision path. Fit the model the usual way. Test the residuals with `dwtest()`. If that test rejects independence the way it just did here, recompute the standard errors with `NeweyWest()` and `coeftest()` before you trust any p-value in the plain summary.

=== step === quiz
## Quick check: reading a Durbin-Watson result
::prose-only the question is the content; the numbers stand in for a fresh model the reader has not seen coded

A different monthly regression reports DW = 0.35 and a naive p-value of 0.002 for its key predictor. Which reading is correct?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The coefficient is biased, and the model should be refit from scratch. ::no
- DW = 0.35 means no autocorrelation, since it sits below the midpoint of the 0 to 4 scale. ::no
- The coefficient is probably still reasonable, but the naive p-value of 0.002 is likely too small, and should be re-checked with Newey-West HAC standard errors. ::ok Right. Autocorrelation does not touch the coefficient, only the standard error used to judge it, so refitting the model would not fix anything on its own. The naive p-value comes from a standard error that ignores the correlation in the residuals, and recomputing it with NeweyWest() and coeftest() is the correct next step.
- Since 0.002 is well below 0.05, the naive result can be trusted as it stands. ::no A DW of 0.35 is far below 2, the value that would mean no lag-1 autocorrelation, so this residual series is strongly autocorrelated, not independent. That does not bias the coefficient, but it does mean the naive standard error, and the p-value built from it, understate the real uncertainty. The right move is to keep the coefficient and recompute its standard error with Newey-West, not to refit the model or accept the naive p-value as it stands.

=== step === tryit
## Your turn: compare naive and HAC standard errors on both coefficients

The `model` object is still the one fitted earlier, `sales ~ ad_spend` on the same 60 months. You already used `dwtest()` a few steps back, and `NeweyWest()` together with `coeftest()` right after that. This time, put them to work without being shown the exact call.

```r
# naive holds the vanilla OLS coefficients table for `model`.
# Compute the HAC standard errors with NeweyWest() and coeftest(),
# then divide each HAC standard error by the matching naive one,
# for both the intercept and the ad_spend slope.
naive <- summary(model)$coefficients
# your code here
```
::check {"regex": "(?=[\\s\\S]*NeweyWest)(?=[\\s\\S]*coeftest)", "gate": true, "difficulty": "intermediate", "ok": "Right: the ad_spend slope's standard error widened about 1.45 times over, from 0.223 to 0.323, and the intercept's widened about 1.41 times over. Both were understated before, and the slope moved a touch more.", "no": "Call sandwich::NeweyWest(model, prewhite = FALSE) to build the corrected covariance matrix, pass it to lmtest::coeftest(model, vcov = ...), then divide each row's HAC standard error by the matching row in naive."}
::solution
```r
# Compute HAC standard errors and compare them against the naive ones
naive <- summary(model)$coefficients
hac   <- coeftest(model, vcov = NeweyWest(model, prewhite = FALSE))
round(hac[, "Std. Error"] / naive[, "Std. Error"], 2)
#> (Intercept)    ad_spend 
#>        1.41        1.45 
```

The ad_spend slope's standard error moved a little more than the intercept's, 1.45 times over against 1.41 times over, though both widened by a similar amount. Either way, the naive standard errors overstated how certain both coefficients looked, the intercept as well as the ad_spend slope you had been tracking.

=== step === concept
## References

- Durbin, J. & Watson, G. S. (1950). [Testing for Serial Correlation in Least Squares Regression I](https://www.jstor.org/stable/2332391). Biometrika 37(3-4), 409-428. The original paper behind the test and the statistic you computed by hand.
- Newey, W. K. & West, K. D. (1987). A Simple, Positive Semi-Definite, Heteroskedasticity and Autocorrelation Consistent Covariance Matrix. Econometrica 55(3), 703-708. The paper behind the HAC standard errors computed here with NeweyWest().
- Zeileis, A. & Hothorn, T. (2002). [Diagnostic Checking in Regression Relationships](https://cran.r-project.org/package=lmtest). R News 2(3), 7-10. Documents the lmtest package, home of dwtest() and coeftest().
- Zeileis, A. (2004). [Econometric Computing with HC and HAC Covariance Matrix Estimators](https://cran.r-project.org/package=sandwich). Journal of Statistical Software 11(10). Documents the sandwich package, home of NeweyWest().
- Fox, J. & Weisberg, S. (2019). [An R Companion to Applied Regression](https://socialsciences.mcmaster.ca/jfox/Books/Companion/), 3rd ed. Sage. A broader treatment of regression diagnostics, including serial correlation.
