---
title: "Generalized Linear Models Lesson 1: Logistic regression, from the odds up"
catalog_blurb: "Why a straight line can't model a yes-or-no outcome, and what actually does."
description: "See why a straight line fails a yes/no outcome, then build logistic regression from odds to log odds to a fitted odds ratio you can read in plain words."
keywords: "logistic regression, odds, log odds, odds ratio, glm, binomial regression, logit, probability, coefficient, R"
post_type: "LESSON"
curriculum_id: "4.80.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "1"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: ""
course_prev: ""
---

=== step === cover
## Logistic regression, from the odds up

Today let's understand logistic regression very clearly, built up one step at a time starting from a plain pass-or-fail outcome.

A coding bootcamp runs a certification test at the end of its course. 40 students took it: 10 of them after just 1 hour of exam prep, another 10 after 2 hours, another 10 after 3 hours, and the last 10 after 4 hours. Out of each group of 10, 2, 5, 8 and 9 students passed.

Turn those counts into a pass rate for each group and you get 0.2, 0.5, 0.8 and 0.9. One in five passed after 1 hour of prep. Nine in ten passed after 4.

Here is that climb.

::widget chart-plotter {"data":[{"x":1,"y":0.2},{"x":2,"y":0.5},{"x":3,"y":0.8},{"x":4,"y":0.9}],"geoms":["bar"],"x":"hours","y":"pass_rate"}

The bars climb steadily as prep hours go up. The whole question ahead is what rule turns an hours number like these into a passing chance like these.

=== step === widget
## From pass rate to odds to log odds

Go back to the bootcamp's four pass rates: 0.2, 0.5, 0.8 and 0.9, one for each hours-of-prep group. Rebuild the full table behind those four numbers and let R count the passes itself.

```r
# Rebuild the bootcamp table from counts, then confirm the pass counts per group
hours <- rep(1:4, each = 10)
pass <- c(1,1,0,0,0,0,0,0,0,0,
          1,1,1,1,1,0,0,0,0,0,
          1,1,1,1,1,1,1,1,0,0,
          1,1,1,1,1,1,1,1,1,0)
bootcamp <- data.frame(hours = hours, pass = pass)

table(hours = bootcamp$hours, pass = bootcamp$pass)
#>      pass
#> hours 0 1
#>     1 8 2
#>     2 5 5
#>     3 2 8
#>     4 1 9
```

That is the same 2, 5, 8 and 9 passes out of 10 at each hours value, now counted straight from the 40 rows of data.

A pass rate is easy to read, but it is not the scale the model to come is actually built on. The first step toward that scale is odds. Odds compare the chance something happens to the chance it does not: for a pass rate `p`, the odds are `p / (1 - p)`.

Compute the odds for each group, then take the next step and compute the log of each: the log odds.

```r
# Compute each group's pass rate, its odds, and the log of the odds
p <- tapply(bootcamp$pass, bootcamp$hours, mean)
odds <- p / (1 - p)
logodds <- log(odds)
round(rbind(p = p, odds = odds, logodds = logodds), 4)
#>               1   2      3      4
#> p        0.2000 0.5 0.8000 0.9000
#> odds     0.2500 1.0 4.0000 9.0000
#> logodds -1.3863 0.0 1.3863 2.1972
```

Read the odds row first.

- At 1 hour, the odds are 0.25: 1-to-4 against passing.
- At 2 hours, the odds are 1: even odds.
- At 3 hours, the odds are 4: 4-to-1 in favor.
- At 4 hours, the odds are 9: 9-to-1 in favor.

Odds and pass rate carry exactly the same information. They are just stated as a ratio instead of a fraction.

Now look at the logodds row, and specifically at how much it moves from one column to the next.

```r
# The size of the step in log odds from one hours group to the next
round(diff(logodds), 4)
#>      2      3      4 
#> 1.3863 1.3863 0.8109 
```

The pass rate's own steps are 0.3, then 0.3, then 0.1: not constant. The odds' steps jump from 0.25 to 1, then 1 to 4, then 4 to 9: nowhere close to constant either. But the log odds step by 1.3863, then 1.3863, then 0.8109: close to the same amount each time one more hour of prep is added.

[KEY INSIGHT]
On the log odds scale, one more hour of prep adds close to a fixed amount to the chance of passing. That near-constant, additive behavior is exactly what a straight line produces, which is why the model this lesson builds is written on the log odds scale rather than directly on the probability or the odds.

Here are those same four log odds, plotted against hours of prep.

::widget chart-plotter {"data":[{"x":1,"y":-1.3863},{"x":2,"y":0},{"x":3,"y":1.3863},{"x":4,"y":2.1972}],"geoms":["point","line"],"x":"hours","y":"log_odds"}

Switch to the line view and the four points sit almost exactly on a straight line. That straight line is the next thing to actually fit.

=== step === widget
## Why an ordinary straight line can't model a yes/no outcome

The four log odds almost lined up. Try fitting a line to the four pass rates themselves instead, the numbers a non-specialist would actually want reported, and see what happens.

Drag the slope and intercept below until the line fits the four points as closely as you can, then press Snap to least squares to see the best line R would find.

::widget ols-fit {"points":[{"x":1,"y":0.2},{"x":2,"y":0.5},{"x":3,"y":0.8},{"x":4,"y":0.9}]}

Snap to least squares lands on an intercept of 0 and a slope of 0.24. Fit that same line in R, then predict at two hours values nobody in the data has: -1 hour, and 6 hours.

```r
# Fit a straight line to the four pass rates, then predict at two hours values outside the data
rates <- aggregate(pass ~ hours, data = bootcamp, FUN = mean)
rates
#>   hours pass
#> 1     1  0.2
#> 2     2  0.5
#> 3     3  0.8
#> 4     4  0.9

line_fit <- lm(pass ~ hours, data = rates)
round(coef(line_fit), 4)
#> (Intercept)       hours 
#>        0.00        0.24 

preds <- predict(line_fit, newdata = data.frame(hours = c(-1, 6)))
names(preds) <- c(-1, 6)
round(preds, 4)
#>    -1     6 
#> -0.24  1.44 
```

At -1 hour the line predicts a pass rate of -0.24. At 6 hours it predicts 1.44. Neither one is a valid probability: a fraction of students passing cannot be negative, and it cannot be bigger than 1.

The problem is not the data or the sample size. An ordinary straight line is built to run from negative infinity to positive infinity in both directions, and nothing in its equation stops it at 0 or at 1. Ask it for a prediction far enough from the data it was fit on, and it will hand back a number outside the range a probability is allowed to take.

=== step === widget
## The logistic curve: bounded between 0 and 1 by construction

A straight line fails because nothing in its equation stops it at 0 or at 1. The fix is a curve whose equation cannot do that by its own construction, no matter how far out you push it.

Here is that curve's formula, written the way you would type it in R:

`p = 1 / (1 + exp(-(b0 + b1 * x)))`

`b0 + b1 * x` is the exact same straight-line expression as before, an intercept plus a slope times x. The difference is that this straight line is never reported directly. It is first passed through `1 / (1 + exp(-...))`.

- When `b0 + b1 * x` runs very negative, `exp(-(b0 + b1 * x))` becomes a huge number, so 1 divided by a huge number lands close to 0.
- When `b0 + b1 * x` runs very positive, `exp(-(b0 + b1 * x))` shrinks toward 0, so 1 divided by something close to 1 lands close to 1.

For any finite value of `x`, the result sits strictly between 0 and 1. That S-shaped curve is what people call the logistic curve.

The widget below uses its own 12 illustrative points, not the bootcamp table, so you can see the curve and the threshold clearly. The same shape is what gets fitted to the bootcamp data in the next step.

Drag the decision threshold and watch how the points above and below it get called positive or negative.

::widget logistic-curve {}

Lower the threshold and the curve calls more points positive. That catches more of the real 1s, but it also mislabels more of the real 0s as positive: a false positive.

Raise the threshold and it goes the other way: fewer false positives, more false negatives, points that were really 1 but got called 0. The S-curve itself never changes shape, only where you choose to cut it.

=== step === quiz
## Quick check: why a curve instead of a line

A straight line fitted to pass-or-fail data predicts a probability of 1.44 for a student who studies 6 hours. Which statement reads that correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Collecting more students for the experiment would have kept that 1.44 inside the valid 0-to-1 range. ::no
- A predicted value of 1.44 is not a real problem, because probability is only one of several numbers a fitted model can report. ::no
- An ordinary straight line has no mechanism that keeps its output between 0 and 1, so it can report numbers that are not valid probabilities at all. ::ok Right. A straight line's equation runs from negative infinity to positive infinity by construction. Nothing in it stops at 0 or 1, so 1.44 is exactly the kind of number you should expect once x moves far enough from the data.
- Six hours is too large a value to plug into a fitted line in the first place. ::no A line accepts any x you give it; the trouble is never the input, only the output. More students would not fix this either, since the issue is the shape of the model, not the size of the sample, and a probability above 1 is never valid no matter what else the model happens to compute.

=== step === concept
## Fitting the logistic model to the bootcamp data

The logistic curve from a moment ago had two made-up numbers, b0 and b1, just to show the shape. Fit the real model and R works out the best values of those two numbers for the bootcamp data itself.

Fit the logistic model on the full 40-student table with `glm()`, told `family = binomial` because the outcome being modeled is a plain 0 or 1, and look at its summary.

```r
# Fit the logistic model: pass as a function of hours, on the full 40-student table
m <- glm(pass ~ hours, data = bootcamp, family = binomial)
summary(m)
#>
#> Call:
#> glm(formula = pass ~ hours, family = binomial, data = bootcamp)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)   
#> (Intercept)  -2.5451     0.9887  -2.574  0.01005 * 
#> hours         1.2540     0.4087   3.068  0.00215 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for binomial family taken to be 1)
#>
#>     Null deviance: 53.841  on 39  degrees of freedom
#> Residual deviance: 40.509  on 38  degrees of freedom
#> AIC: 44.509
#>
#> Number of Fisher Scoring iterations: 4

round(coef(m), 4)
#> (Intercept)       hours 
#>     -2.5451      1.2540 
```

The `Estimate` column holds the two numbers this lesson needs: -2.5451 for the intercept, 1.2540 for hours. The other columns, the standard error and the significance test for each one, say how precisely each was estimated, but they are not this lesson's subject.

Both of those two numbers live on the log odds scale from a few steps back. In R's own notation: `log odds = -2.5451 + 1.2540 * hours`. That is a straight line, the same ordinary kind that broke down a moment ago, except it lives on the log odds scale instead of the probability scale. Pass it through `1 / (1 + exp(-...))` and you get back the S-curve: bounded, and never outside 0 and 1.

=== step === concept
## Reading the coefficient as a log odds ratio

Look again at the hours coefficient, 1.2540. It lives on the log odds scale, the same scale where adding one hour of prep added a close-to-constant amount a few steps back. That is exactly what this coefficient is: 1.2540 is the amount one more hour of prep adds to the log odds of passing, whatever the log odds happened to be before.

Nobody reports a log odds number out loud, though. Undo the logarithm and you get something that can actually be said in plain words.

Exponentiate the hours coefficient to undo the log and get that number back.

```r
# Exponentiate the hours coefficient: that turns a log odds ratio into an odds ratio
round(exp(coef(m)), 4)
#> (Intercept)       hours 
#>      0.0785      3.5043 
```

3.5043 is the odds ratio for hours. It says: for one more hour of prep, the odds of passing get multiplied by about 3.5043, whatever those odds were before. Multiplied, not added.

Check that multiplying claim directly against the model's own fitted odds: compute the fitted probability at 2 hours and at 3 hours, turn each into odds, then divide one by the other.

```r
# Get the model's own fitted odds at 2 and 3 hours, then divide one by the other
p2 <- unname(predict(m, newdata = data.frame(hours = 2), type = "response"))
p3 <- unname(predict(m, newdata = data.frame(hours = 3), type = "response"))
odds2 <- p2 / (1 - p2)
odds3 <- p3 / (1 - p3)
round(c(odds2 = odds2, odds3 = odds3, ratio = odds3 / odds2), 4)
#>  odds2  odds3  ratio 
#> 0.9636 3.3767 3.5043 
```

At 2 hours the fitted odds are 0.9636. At 3 hours they are 3.3767. Divide the second by the first and you get 3.5043, the exact same number `exp()` handed back from the coefficient alone.

That match is not a coincidence. It is what "the hours coefficient is a log odds ratio" means, worked out two different ways on the same model.

=== step === concept
## From an odds ratio to a probability you can actually use

3.5043 is a clean number on the odds scale, but say it out loud to someone outside statistics and it does not land. What a non-specialist actually wants to know is simpler: how many more students pass?

Get the model's fitted passing probability at each of 1 through 5 hours of prep.

```r
# Get the fitted probability of passing at each of 1 through 5 hours
fitted_p <- predict(m, newdata = data.frame(hours = 1:5), type = "response")
names(fitted_p) <- 1:5
round(fitted_p, 4)
#>      1      2      3      4      5 
#> 0.2157 0.4907 0.7715 0.9221 0.9765 
```

The fitted probability climbs from 0.2157 at 1 hour to 0.9765 at 5 hours. Take the difference between each pair of neighbouring hours to see exactly how much each extra hour buys.

```r
# The rise in probability from one hour of prep to the next
round(diff(fitted_p), 4)
#>      2      3      4      5 
#> 0.2751 0.2808 0.1506 0.0544 
```

Going from 2 to 3 hours of prep raises the passing probability by 0.2808, 28 percentage points. Going from 4 to 5 hours, under the exact same odds ratio of 3.5043, it raises the probability by only 0.0544, barely 5.4 points.

The odds ratio itself never changes: it is fixed at 3.5043 no matter which hour you start from. But the S-curve from a few steps back is steepest in the middle and flattest near 0 and near 1. A fixed multiplicative push on the odds turns into a big jump in probability where the curve is steep, and a tiny jump where the curve is flat.

That is why the honest way to report a fitted coefficient to someone outside statistics names a probability change at a stated hours value, like "28 points more likely to pass going from 2 to 3 hours," rather than the odds ratio alone. The odds ratio stays fixed. What it buys you in probability does not.

=== step === quiz
## Quiz: reading a fitted logistic model

A fitted logistic model reports an hours coefficient of 1.2540, and `exp(1.2540)` works out to 3.5043. Which statement correctly describes what that 3.5043 measures?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The probability of passing rises by 3.5043 for every additional hour of prep. ::no
- It is the odds ratio for one more hour of prep: the odds of passing get multiplied by about 3.5043 for each extra hour. ::ok Right. Exponentiating a log odds coefficient turns an added amount on the log odds scale into a multiplier on the odds scale, for one more unit of the predictor.
- 3.5043 is the number of extra students expected to pass for each additional hour of prep. ::no
- 1.2540 itself, not its exponent, is the odds ratio. ::no 1.2540 is the log odds ratio, the amount added to the log odds for one more hour. Exponentiating it is what turns that addition into a multiplication on the odds scale, which is what 3.5043 actually is. Probability does not rise by a fixed amount per hour either, as the fitted values a few steps back showed, and an odds ratio says nothing about a count of students, only how the odds themselves scale.

=== step === tryit
## Your turn: predict, then convert to odds

The model `m` is still fitted from a few steps back. Use it to answer a question nobody asked it directly yet: what is the passing probability at 2.5 hours of prep, halfway between two of the original groups, and what odds go with that probability?

```r
# Predict the passing probability at 2.5 hours of prep, then convert it to odds
p_hat <- unname(predict(m, newdata = data.frame(hours = ____), type = "response"))
odds_hat <- ____
round(c(p_hat = p_hat, odds_hat = odds_hat), 4)
```
::check {"regex": "(?=[\\s\\S]*hours\\s*=\\s*2\\.5)(?=[\\s\\S]*type\\s*=\\s*\"response\")(?=[\\s\\S]*p_hat\\s*/\\s*[(]\\s*1\\s*-\\s*p_hat\\s*[)])", "gate": true, "difficulty": "intermediate", "ok": "Right: p_hat comes out at 0.6433 and odds_hat at 1.8038. Odds above 1 means passing is now more likely than not at 2.5 hours, which fits right between the 0.5 pass rate at 2 hours and the 0.8 at 3.", "no": "Two things are needed: predict() with hours = 2.5 and type = \"response\" inside newdata, and odds_hat computed as p_hat divided by (1 - p_hat), the same odds formula from a few steps back."}
::solution
```r
# Predict the passing probability at 2.5 hours of prep, then convert it to odds
p_hat <- unname(predict(m, newdata = data.frame(hours = 2.5), type = "response"))
odds_hat <- p_hat / (1 - p_hat)
round(c(p_hat = p_hat, odds_hat = odds_hat), 4)
#>    p_hat odds_hat 
#>   0.6433   1.8038 
```

=== step === concept
## References
::prose-only a list of citations carries no visualizable concept

- Cox, D.R. (1958). [The Regression Analysis of Binary Sequences](https://doi.org/10.1111/j.2517-6161.1958.tb00292.x). Journal of the Royal Statistical Society, Series B. The paper that first worked out logistic regression for binary outcomes.
- Hosmer, D.W., Lemeshow, S. & Sturdivant, R.X. (2013). [Applied Logistic Regression, 3rd edition](https://doi.org/10.1002/9781118548387). Wiley.
- Agresti, A. (2013). Categorical Data Analysis, 3rd edition. Wiley, ISBN 978-0-470-46363-5. Chapter 5 covers logistic regression in depth.
- Harrell, F.E. (2015). [Regression Modeling Strategies, 2nd edition](https://doi.org/10.1007/978-3-319-19425-7). Springer. Chapter 10 covers binary logistic models and their extensions.

=== step === complete
## The whole chain: probability to odds to a usable number
::prose-only closing recap of numbers already computed earlier in the lesson

Walk the whole chain back from the start, this time with every number already on the page.

- The bootcamp's four pass rates ran from 0.2 to 0.9 across the four hours groups.
- Turned into odds, those same four rates ran from 0.25 to 9.
- Turned into log odds, they ran from -1.3863 to 2.1972, rising by a near-constant 1.3863 and then 0.8109 per extra hour.
- An ordinary straight line fit to the four pass rates broke down outside the data, predicting -0.24 at -1 hour and 1.44 at 6 hours.
- The logistic fit's hours coefficient, 1.2540, is a log odds ratio. Exponentiated, it becomes an odds ratio of 3.5043.
- That same 3.5043 odds ratio reads as a 28-point rise in passing probability from 2 to 3 hours of prep, but only a 5.4-point rise from 4 to 5.

That is the full path: a probability, turned into odds, turned into log odds so a straight line can model it honestly, then a fitted coefficient turned back into an odds ratio and finally into a probability change you can actually report.

The logistic curve is only one shape that can model a yes-or-no outcome. The next lesson looks at two other shapes and when the choice between them actually matters.
