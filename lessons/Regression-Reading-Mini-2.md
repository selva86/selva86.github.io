---
title: "Linear regression assumptions: the 5 checks"
slug: "Regression-Reading-Mini-2"
description: "Run all five regression assumption checks in R (linearity, independence, homoscedasticity, normality, multicollinearity) on one real model, and see what breaks."
keywords: "linear regression assumptions, regression diagnostics in R, homoscedasticity test, multicollinearity VIF, Durbin-Watson test, Breusch-Pagan test, Shapiro-Wilk test, residual plots"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "2"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: "Regression-Reading-Mini-1"
course_next: ""
curriculum_id: "0.0.22"
lesson_access: "windowed"
catalog_blurb: "The five checks that tell you whether your regression's p-values can be trusted."
---

=== step === cover
## Linear regression assumptions: the 5 checks

Today let's understand what it actually takes to trust a regression model, not just look at how well it fits.

Take a regression that predicts a car's fuel economy, its mpg, from three things about the car: its horsepower (hp), its weight (wt), and its engine displacement (disp, the total volume its cylinders sweep). We will fit it on the 32 cars in R's built-in mtcars dataset and lean on it for the whole lesson.

Before fitting that full model, look at just one piece of it: how weight alone relates to mpg.

::widget chart-plotter {"data": [{"x":2.62,"y":21},{"x":2.875,"y":21},{"x":2.32,"y":22.8},{"x":3.215,"y":21.4},{"x":3.44,"y":18.7},{"x":3.46,"y":18.1},{"x":3.57,"y":14.3},{"x":3.19,"y":24.4},{"x":3.15,"y":22.8},{"x":3.44,"y":19.2},{"x":3.44,"y":17.8},{"x":4.07,"y":16.4},{"x":3.73,"y":17.3},{"x":3.78,"y":15.2},{"x":5.25,"y":10.4},{"x":5.424,"y":10.4},{"x":5.345,"y":14.7},{"x":2.2,"y":32.4},{"x":1.615,"y":30.4},{"x":1.835,"y":33.9},{"x":2.465,"y":21.5},{"x":3.52,"y":15.5},{"x":3.435,"y":15.2},{"x":3.84,"y":13.3},{"x":3.845,"y":19.2},{"x":1.935,"y":27.3},{"x":2.14,"y":26},{"x":1.513,"y":30.4},{"x":3.17,"y":15.8},{"x":2.77,"y":19.7},{"x":3.57,"y":15},{"x":2.78,"y":21.4}], "geoms": ["point"], "x": "wt", "y": "mpg"}

That's the relationship between weight and mpg on its own, and the r value in the corner already says how tight that downward scatter is. Now let's fit the real three-predictor model and find out whether "trustworthy" is really the right word for it.

=== step === concept
## Why a good R-squared does not mean a trustworthy p-value

Let's fit the real model now, the one that uses all three predictors together.

```r
# Fit the model, then look at all four diagnostic plots at once
fit <- lm(mpg ~ hp + wt + disp, data = mtcars)

par(mfrow = c(2, 2))
plot(fit)                    # four panels, three of which we walk through below: Residuals vs Fitted, Q-Q, Scale-Location

summary(fit)$r.squared
#> [1] 0.8268361
```

R-squared of 0.83 says the model explains 83% of the variation in mpg. That is a strong fit, and it is real. But R-squared only measures fit, how close the model's predictions land to the real values. It says nothing about whether the standard errors, p-values, and confidence intervals for hp, wt, and disp were computed correctly.

Those depend on five separate conditions holding, and none of them show up anywhere in the R-squared number.

::widget process-flow {"steps":[{"title":"Linearity","sub":"is the true relationship a straight line"},{"title":"Independence","sub":"does one residual leak into the next"},{"title":"Homoscedasticity","sub":"does the error spread stay constant"},{"title":"Normality","sub":"are the residuals close to a normal distribution"},{"title":"No multicollinearity","sub":"do the predictors carry separate information"}]}

Those are the five checks we run next, in that order, all on the same `fit` object above. Each one gets its own diagnostic, and its own fix for when it fails.

=== step === concept
## How do you test linearity, and what fixes it when it fails?

The first check is linearity: does the true relationship between the predictors and mpg run in a straight line, or does it bend? You test it with the Residuals vs Fitted plot, the top-left panel from the dashboard you just saw.

If linearity holds, the residuals (the gap between each car's real mpg and the model's prediction for it) should scatter randomly around zero, with no pattern. A curve, a U-shape or a bow, means the straight line missed some real bend in the data.

```r
# Look at just the Residuals vs Fitted panel for the mtcars fit
par(mfrow = c(1, 1))
plot(fit, which = 1)     # a red smoother line traces the average residual at each fitted value
```

On this fit, the red smoother dips a little in the middle of the range and rises a little at the edges. That is a mild wobble, not a clear pattern, so linearity is not seriously broken here.

To see what a real violation looks like next to a healthy fit, toggle between the three cases below.

::widget residual-plot {}

Healthy looks like a flat, even scatter around zero. Funnel is the signature of a different check, homoscedasticity, coming up next. Curved is the signature of a missed nonlinear term, exactly what our mild dip is a faint hint of, just nowhere near severe.

When the curve really is severe, the fix is to let the model bend instead of forcing a straight line through it. Adding `poly(x, 2)` to the formula, for example `lm(mpg ~ hp + wt + poly(disp, 2), data = mtcars)`, gives that predictor's effect room to curve.

=== step === concept
## How do you check that residuals are independent?

The second check is independence: does one residual leak information into the next one? If today's error tells you something about tomorrow's, or one row's error tells you something about the row right after it, the standard errors that come out of `lm()` are wrong, even while the fitted line itself can still look fine.

The standard test is the Durbin-Watson test, from the `lmtest` package. It looks at how much each residual resembles the one right before it in the data.

```r
# Test independence: does one residual leak into the next one?
library(lmtest)

dwtest(fit)
#> 	Durbin-Watson test
#>
#> data:  fit
#> DW = 1.3673, p-value = 0.01612
#> alternative hypothesis: true autocorrelation is greater than 0
```

Durbin-Watson runs from 0 to 4. A value near 2 means no autocorrelation; well below 2 hints at positive autocorrelation, where each residual tracks the one before it; well above 2 hints at negative autocorrelation. Here DW is 1.37 with p = 0.016, which on its own looks like a violation. At the usual 0.05 cutoff you would reject independence.

But look at what `dwtest()` is actually testing: whether row order carries information. mtcars's 32 rows are just cars listed one after another, not measurements taken in any real sequence. There is nothing for one row to leak into the next, so this p-value is a false alarm. Durbin-Watson only means something when row order actually is time, space, or some other measurement sequence.

To see the real thing, simulate 100 errors where each one really does depend on the one before it, an AR(1) process with correlation 0.7 between neighbors.

```r
# Simulate 100 errors that really do depend on their own past (AR(1), correlation 0.7)
set.seed(202)
n <- 100
x_ar <- 1:n
ar_err <- as.numeric(arima.sim(model = list(ar = 0.7), n = n))
ar_y <- 2 + 0.5 * x_ar + ar_err
ar_fit <- lm(ar_y ~ x_ar)

dwtest(ar_fit)
#> 	Durbin-Watson test
#>
#> data:  ar_fit
#> DW = 0.58808, p-value = 2.302e-13
#> alternative hypothesis: true autocorrelation is greater than 0
```

DW dropped to 0.59 and the p-value is essentially zero. That is what a genuine violation looks like: not a borderline number like mtcars's 1.37, but a statistic sitting near one end of the 0 to 4 scale. The fix is to model the time structure directly: refit with `gls()` from the `nlme` package using an AR(1) error structure, use Newey-West standard errors from the `sandwich` package, or move to a proper time-series model.

There is a second way independence breaks that Durbin-Watson cannot catch at all: clustering. Students grouped in classrooms, patients grouped in hospitals, repeated measurements on the same person, none of these are time-ordered, so DW has nothing to test. But rows inside the same group still share something the model formula never captures, and that breaks independence just as badly.

Drag the dial below and watch two numbers as the correlation inside each group rises: how often the 95% interval for the slope actually contains the true value (its coverage), and R-squared.

::widget assumption-dial {"assumption": "independence"}

Coverage falls well below the nominal 95%, while R-squared barely moves. That is the whole danger of a broken independence assumption: the model still looks like it fits, but the confidence interval built on top of it is understating how uncertain it really is. An ordinary robust standard error does not repair this case either, because it still assumes the rows are independent. You need clustered standard errors or a mixed-effects model instead.

=== step === quiz
## Quick check: why did mtcars fail the Durbin-Watson test?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Durbin-Watson always needs a bigger sample to be reliable. ::no
- mtcars's 32 rows are just a list of cars, not a time or measurement sequence, so there is nothing meaningful for one row's residual to leak into the next. ::ok Exactly. The test found a pattern in the row order, but the row order itself carries no real meaning here, which is exactly what makes it a false alarm.
- mtcars's mpg values really are autocorrelated. ::no A p-value below 0.05 does not settle the question by itself. Durbin-Watson only means something when the row order is itself a time, space, or measurement sequence, and in mtcars it is not, so a low p-value here is not evidence of a real violation.

=== step === concept
## How do you test for constant error variance?

The third check is homoscedasticity: does the spread of the residuals stay the same across the whole range of fitted values, or does it grow as the prediction gets bigger? The visual check is the Scale-Location plot, the bottom-left panel from the very first dashboard.

```r
# Test constant variance: the Scale-Location plot, then a formal test
plot(fit, which = 3)     # a rising smoother would hint at growing variance
```

On this fit the smoother rises slightly as predicted mpg increases. That is a hint, not a verdict, so we need a formal test. The Breusch-Pagan test, also from `lmtest`, regresses the squared residuals on the predictors and checks whether the predictors explain a meaningful share of that variance.

One sentence for the formula behind it: it counts how much of the squared-residual variance the predictors can explain.

\[BP = n \cdot R^2_{\hat{u}^2}\]

Here \(n\) is the number of observations, and \(R^2_{\hat{u}^2}\) is the R-squared from that auxiliary regression of squared residuals on the predictors. Its null hypothesis is constant variance, so a small p-value rejects it.

```r
# Breusch-Pagan test: does variance stay constant across fitted values?
bptest(fit)
#> 	studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 0.9459, df = 3, p-value = 0.8143
```

p = 0.81, nowhere near the usual 0.05 cutoff, so we fail to reject constant variance. The Scale-Location wobble was visual noise, not a real problem.

When Breusch-Pagan does reject, a common pattern is that variance grows with the mean, and the simplest fix is a `log()` transform of the response. Let's see what that does here, even though there was nothing to fix.

```r
# Refit on log(mpg) and see whether the transform changes the picture
log_fit <- lm(log(mpg) ~ hp + wt + disp, data = mtcars)
bptest(log_fit)
#> 	studentized Breusch-Pagan test
#>
#> data:  log_fit
#> BP = 4.2418, df = 3, p-value = 0.2365
```

The p-value moved, but it is still comfortably above 0.05, because homoscedasticity held in the original fit too. There was no real problem for the transform to fix. When a transform does not fully solve a genuine violation, heteroscedasticity-robust standard errors are the fallback: `vcovHC()` from the `sandwich` package builds a corrected covariance matrix, and `coeftest()` from `lmtest` reads it back into robust p-values, without changing the model formula at all.

=== step === concept
## How do you test whether residuals are normal?

The fourth check is normality: are the residuals drawn from something close to a normal distribution? This one matters for inference, the p-values and confidence intervals, not for the coefficient estimates themselves. A regression can have perfectly usable slopes even when its residuals are not perfectly normal.

The visual check is the Q-Q plot, the top-right panel. It ranks the residuals from smallest to largest and plots them against where a perfectly normal distribution would put values at each of those same ranks. If residuals are normal, the two rankings match and the points sit on the dashed line.

```r
# Q-Q plot: do the residuals sit on the line a normal distribution would produce?
plot(fit, which = 2)     # points on the line = normal; a curve at the ends = non-normal tails
```

On this fit the middle of the distribution sits right on the line, and the tails curve away a little. That is a mild sign of non-normality. Let's put a number on it with the Shapiro-Wilk test. Its null hypothesis is that the residuals are normal, so a small p-value rejects it.

```r
# Shapiro-Wilk test, plus a histogram of the residuals
shapiro.test(residuals(fit))
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.92734, p-value = 0.03305

hist(residuals(fit), breaks = 10, main = "Residuals of the mtcars fit",
     xlab = "Residual", col = "lightblue")     # a rough bell shape, slightly right skewed
```

p = 0.033. At the usual 0.05 cutoff, that rejects normality. This is the one check, out of the five, that actually fails on this fit. But look at how it fails: the Q-Q plot showed a mild tail deviation, not a dramatic break, and the histogram is still roughly bell-shaped with a bit of a right skew. This is a real but mild violation, exactly the kind normality tends to produce.

Does that mean the model's p-values are worthless now? Not necessarily. With 32 cars, the sample sits just over the usual rule-of-thumb cutoff of 30, and the Central Limit Theorem (the fact that an average taken over many values gets closer to a normal shape as you average over more of them) means the sampling distribution of a coefficient gets close to normal even when the residuals feeding into it are not, as long as the departure is mild rather than extreme. So a small but real Shapiro-Wilk rejection like this one is a nudge to double-check results, not a reason to throw the model out.

When normality fails more seriously, the standard fixes are a transform of the response, log, square root, or Box-Cox through `MASS::boxcox()`, or bootstrap confidence intervals through `car::Boot()`, which sidestep the normality assumption entirely.

=== step === concept
## How do you detect and fix multicollinearity in R?

The fifth and last check is multicollinearity: do two or more predictors carry overlapping information? Perfect multicollinearity, one predictor being an exact combination of the others, makes `lm()` fail outright. The much more common case is near multicollinearity, which does not break anything visibly, but inflates the standard errors of the correlated coefficients, so their individual t-tests and p-values stop meaning much, even while the model's overall predictions stay fine.

The standard diagnostic is the Variance Inflation Factor, one number per predictor. One sentence for what it computes: it regresses each predictor on every other predictor and turns that fit into a number.

\[VIF_j = \frac{1}{1 - R_j^2}\]

Here \(R_j^2\) is the R-squared from regressing predictor \(j\) on all the other predictors. The minimum is 1, a predictor uncorrelated with the rest. 5 is a common warning line, and 10 is the point where it is definitely a problem.

```r
# Variance Inflation Factor: how much does each predictor overlap with the others?
library(car)
vif(fit)
#>       hp       wt     disp 
#> 2.736633 4.844618 7.324517 
```

`disp` comes in at 7.32, above the warning line of 5 and closing in on 10. Engine displacement and weight move together closely in cars, bigger engines sit in heavier cars, so the model struggles to tell their individual effects apart. `hp` and `wt` are both comfortably lower.

The simplest fix is to drop the redundant predictor and see what changes.

```r
# Drop disp and see what happens to the VIFs and the standard errors
fit2 <- lm(mpg ~ hp + wt, data = mtcars)
vif(fit2)
#>       hp       wt 
#> 1.766625 1.766625 

summary(fit2)$coefficients
#>                Estimate  Std. Error   t value     Pr(>|t|)
#> (Intercept) 37.22727012 1.59878754 23.284689 2.565459e-20
#> hp          -0.03177295 0.00902971 -3.518712 1.451229e-03
#> wt          -3.87783074 0.63273349 -6.128695 1.119647e-06
```

Both VIFs drop to 1.77, and the standard errors on `hp` and `wt` shrink too, which sharpens their t-values. Dropping `disp` changes almost nothing in R-squared, fit2 rounds to the same 0.8268 as the original fit, but gives cleaner inference on the two predictors that remain.

One more thing worth remembering: multicollinearity does not bias predictions, it only widens the uncertainty around individual coefficients. If all you care about is the fitted mpg value, correlated predictors can stay. If you need to interpret `hp` and `wt` on their own, drop or combine the redundant one, or switch to ridge regression, `glmnet::glmnet(alpha = 0)`.

=== step === concept
## Matching each broken check to its fix

Five checks, five different ways to fail, and five different repairs. Here is the whole map in one table, raw or formatted.

::widget styled-table {"cols": ["check","what breaks","fix"], "rows": [["Linearity","the prediction itself","poly() or a transform"],["Independence","the standard error","gls(), Newey-West, or clustered standard errors"],["Homoscedasticity","the standard error","a transform or vcovHC()"],["Normality","small-sample inference (mildest)","a transform or bootstrap confidence intervals"],["Multicollinearity","precision, not bias","drop, combine, or ridge regression"]], "title": "The five checks and their fixes", "note": "From the fit used above: mpg ~ hp + wt + disp."}

Notice where each fix lands. Linearity is the only one that biases the fitted line itself. Everything else leaves the fit alone and inflates the standard error or reduces the precision around it, which is exactly why a good R-squared can sit right next to invalid p-values.

=== step === quiz
## Closing quiz: the fit looks fine, so can you trust the p-values?

Here is a scenario that puts the big idea to the test. Suppose a different regression comes back with R-squared = 0.91 and all four `plot(fit)` panels show no pattern at all. But a Breusch-Pagan test on that same model gives p = 0.002.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes, because an R-squared that high means the p-values are trustworthy regardless of what any diagnostic test says. ::no
- No. The small Breusch-Pagan p-value means homoscedasticity failed, so the standard errors and p-values may be wrong even though R-squared and the fit look good. ::ok Exactly the core idea here: R-squared measures fit, the five checks measure whether you can trust what is built on top of that fit, and those are two different questions.
- No, because the coefficient estimates themselves are now biased. ::no A violated homoscedasticity assumption inflates or shrinks the standard errors around the coefficients; it does not bias the coefficients themselves. The estimates are still fine. What you cannot trust anymore is the p-value and the confidence interval built from their standard errors.

=== step === tryit
## Closing exercise: run two checks on a four-predictor model

This last exercise combines two checks on a new model built from the same cars.

```r
# fit3 is already defined below; add vif(fit3) and dwtest(fit3)
fit3 <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)

```
::check {"regex": "(?=[\\s\\S]*vif[(]fit3[)])(?=[\\s\\S]*dwtest[(]fit3[)])", "gate": true, "difficulty": "intermediate", "ok": "Right. disp comes out worst (VIF just over 10, the definitely-a-problem line) once cyl joins the model, and dwtest still does not reject independence at the usual 0.05 cutoff, the same false alarm as before, just on a bigger model.", "no": "Add two lines: vif(fit3) to check multicollinearity, and dwtest(fit3) to check independence."}
::solution
```r
# Check multicollinearity and independence on the bigger model
fit3 <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)
vif(fit3)
#>        hp        wt      disp       cyl 
#>  3.405983  4.848016 10.373286  6.737707 

dwtest(fit3)
#> 	Durbin-Watson test
#>
#> data:  fit3
#> DW = 1.685, p-value = 0.09982
#> alternative hypothesis: true autocorrelation is greater than 0
```

=== step === concept
## References

- [An R Companion to Applied Regression, 3rd Edition](https://www.john-fox.ca/Companion/index.html) - Fox and Weisberg (2019), Sage. The book behind the car package and vif().
- [A Simple Test for Heteroscedasticity and Random Coefficient Variation](https://doi.org/10.2307/1911963) - Breusch and Pagan (1979), Econometrica, 47(5), 1287 to 1294.
- [Testing for Serial Correlation in Least Squares Regression I](https://doi.org/10.1093/biomet/37.3-4.409) - Durbin and Watson (1950), Biometrika, 37(3 to 4), 409 to 428.
- [Linear Models with R](https://julianfaraway.github.io/faraway/LMR/) - Faraway, Chapman and Hall/CRC, Chapter 6, Diagnostics.
- [Plot Diagnostics for an lm Object](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html) - R Core Team, the documentation for plot.lm().

=== step === complete
## What you can now do with the five checks

You can now run all five checks on any regression you fit yourself: read the four `plot(fit)` panels for a first pass, then confirm with `dwtest()`, `bptest()`, `shapiro.test()`, and `vif()`.

You know how to tell a false alarm, mtcars's own Durbin-Watson result, from a real one, the AR(1) series, or the one real violation we found: a mildly non-normal residual, caught cleanly by Shapiro-Wilk. And for each of the five checks, you know exactly what breaks when it fails and which fix to reach for.

Nice work getting through all five.
