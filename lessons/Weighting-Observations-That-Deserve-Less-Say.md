---
title: "Linear Regression, Properly Lesson 5: Weighting observations that deserve less say"
catalog_blurb: "Why a precise average should outweigh a shaky one in your regression."
description: "Twenty coffee shops with unequal sample sizes show how weighted least squares beats OLS, derived by hand and with lm(), and why a guessed weight is worse."
keywords: "weighted least squares, WLS, generalized least squares, GLS, lm weights, variance of the mean, standard error, heteroskedasticity, robust regression, nlme gls, varFixed, regression weights, R"
post_type: "LESSON"
curriculum_id: "4.60.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-linear-models"
course_title: "Linear Regression, Properly"
course_lesson: "5"
course_total: "8"
course_landing: "Linear-Regression-Properly-Course.html"
course_next: "The-One-Point-Carrying-Your-Regression.html"
course_prev: "Robust-Standard-Errors-and-When-They-Are-Not-Enough.html"
---

=== step === cover
## Weighting observations that deserve less say

Today let's understand why some rows in a regression deserve less say than others, and how to give each one exactly the say it has earned.

Twenty coffee shops each report their seating capacity, from 15 seats up to 70, against their average daily revenue, from about 267 up to about 649. But these 20 numbers were not all measured with the same care. Some shops have been open and tracking their revenue for close to a year. Others opened their doors only a few weeks ago.

::widget chart-plotter {"data": [{"x":15,"y":291.44},{"x":18,"y":267.41},{"x":21,"y":329.31},{"x":24,"y":306.68},{"x":27,"y":341.11},{"x":29,"y":356.16},{"x":32,"y":369.39},{"x":35,"y":390.44},{"x":38,"y":434.39},{"x":41,"y":437.09},{"x":44,"y":461.49},{"x":47,"y":486.29},{"x":50,"y":498.53},{"x":53,"y":497.31},{"x":56,"y":533.13},{"x":58,"y":543.59},{"x":61,"y":577.19},{"x":64,"y":599.99},{"x":67,"y":605.37},{"x":70,"y":648.51}], "geoms": ["point"], "x": "seats", "y": "avg_revenue"}

Revenue climbs with seating capacity across these 20 points. But some of those points rest on many more days of data than others, and a straight line fit that ignores that difference is not treating them fairly.

=== step === concept
## Twenty shops, twenty averages of very different quality

Let's build these 20 shops in R so you can see exactly what each one is made of.

```r
# Build 20 coffee shops: seating capacity, days open, and average daily revenue
set.seed(206)
seats <- round(seq(15, 70, length.out = 20))
days_open <- sample(c(sample(12:30, 10, TRUE), sample(200:365, 10, TRUE)))
avg_revenue <- numeric(20)
for (i in 1:20) {
  avg_revenue[i] <- mean(rnorm(days_open[i], 150 + 7 * seats[i], 85))
}
shops <- data.frame(seats = seats, days_open = days_open, avg_revenue = round(avg_revenue, 2))
shops
#>    seats days_open avg_revenue
#> 1     15        26      291.44
#> 2     18       342      267.41
#> 3     21        13      329.31
#> 4     24        29      306.68
#> 5     27       251      341.11
#> 6     29        19      356.16
#> 7     32        16      369.39
#> 8     35       324      390.44
#> 9     38        27      434.39
#> 10    41        12      437.09
#> 11    44       239      461.49
#> 12    47       310      486.29
#> 13    50       287      498.53
#> 14    53        25      497.31
#> 15    56       356      533.13
#> 16    58       271      543.59
#> 17    61        19      577.19
#> 18    64       229      599.99
#> 19    67        15      605.37
#> 20    70       365      648.51
```

seats is each shop's seating capacity. avg_revenue is the mean of every daily revenue figure the shop has recorded since it opened. days_open is how many of those daily figures went into that mean, anywhere from 12 days for the newest shop to 365 days for the oldest.

The `sample()` call on the second line shuffles the days_open values on purpose, so a shop's size and a shop's age have nothing to do with each other. A new, small shop is just as likely as a new, big one, and the same goes for the old shops. That is why you see a 12-day shop (row 10, 41 seats) sitting right next to shops with hundreds of days open: size and age were deliberately kept unrelated here.

Each day's revenue was really drawn at random around 150 plus 7 times that shop's seats, with some noise added on top. So the true slope linking seats to revenue is 7. avg_revenue is just the average of however many of those daily draws a shop happened to record, which is exactly why a shop with only 12 days behind it is a shakier average than one with 365.

=== step === concept
## Why an average from more days is a more precise number

Let's turn "shakier average" into an actual number, using only the day counts, nothing else.

For any shop, the standard error of its average revenue is `SE(mean) = sigma / sqrt(days_open)`, where sigma is how much a single day's revenue varies around its true value. Take the ratio of that standard error for the shop with the fewest days, 12, against the shop with the most, 365. Sigma is the same unknown number in both, so it cancels out of the ratio completely, leaving only the two day counts.

```r
# Compare the precision of the shop with the fewest days against the one with the most
precision_ratio <- sqrt(max(shops$days_open) / min(shops$days_open))
round(precision_ratio, 2)
#> [1] 5.52
```

That ratio, 5.52, says the 365-day shop's average has a standard error about 5.52 times smaller than the 12-day shop's average. In other words, the 365-day average is roughly 5.5 times more precise, even though both numbers sit in the avg_revenue column looking like perfectly ordinary figures.

[NOTE]
Notice what you did not need: the actual value of sigma, how noisy a single day's revenue really is. Because sigma appears in both standard errors the same way, it cancels, and the day counts alone tell you how much more one average should be trusted than another.

=== step === widget
## What ordinary least squares does with these twenty points

Ordinary least squares picks the slope and intercept that make the sum of all 20 squared residuals as small as possible. Every shop's squared residual counts exactly the same in that sum, whether its average came from 12 days or 365.

Drag the sliders below and watch each shop's residual turn into a square on the plot; their total area is the sum of squares shown beside it. Every square still counts the same no matter which shop it belongs to. Press snap to least squares to see where that sum is smallest.

::widget ols-fit {"points": [{"x":15,"y":291.44},{"x":18,"y":267.41},{"x":21,"y":329.31},{"x":24,"y":306.68},{"x":27,"y":341.11},{"x":29,"y":356.16},{"x":32,"y":369.39},{"x":35,"y":390.44},{"x":38,"y":434.39},{"x":41,"y":437.09},{"x":44,"y":461.49},{"x":47,"y":486.29},{"x":50,"y":498.53},{"x":53,"y":497.31},{"x":56,"y":533.13},{"x":58,"y":543.59},{"x":61,"y":577.19},{"x":64,"y":599.99},{"x":67,"y":605.37},{"x":70,"y":648.51}]}

Put a number on that snap with R's own lm(), fitting the same 20 shops the same way, with every residual still weighted equally.

```r
# Fit the 20 shops with ordinary least squares, ignoring how many days each average came from
ols <- lm(avg_revenue ~ seats, data = shops)
summary(ols)
#> 
#> Call:
#> lm(formula = avg_revenue ~ seats, data = shops)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -21.258  -8.277  -2.240   7.785  25.578 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 166.1101     8.4029   19.77 1.18e-13 ***
#> seats         6.6501     0.1841   36.12  < 2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 13.71 on 18 degrees of freedom
#> Multiple R-squared:  0.9864,	Adjusted R-squared:  0.9856 
#> F-statistic:  1305 on 1 and 18 DF,  p-value: < 2.2e-16
```

OLS puts the slope at 6.6501 with a standard error of 0.1841. It never once looked at days_open to get there: a 12-day shop's squared residual pulled on that line exactly as hard as a 365-day shop's.

=== step === concept
## The weighted sum of squares, solved by hand

Give each shop a say in proportion to how precise its own average is, and OLS turns into weighted least squares.

A shop's precision, the reciprocal of its variance, is proportional to its own days_open, more days meaning a smaller variance and so a higher precision, exactly what the standard error ratio showed. Give each shop a weight proportional to its own precision, and days_open itself is a weight that works, because multiplying every weight by the same constant never changes which line minimizes the sum below. The unknown sigma that sits underneath every shop's variance cancels out and never needs to be found.

Minimize this weighted sum of squared residuals instead of the plain one OLS uses.

\[ \sum_{i=1}^{20} w_i (y_i - a - b x_i)^2 \]

Here \(y_i\) is shop \(i\)'s average revenue, \(x_i\) is its seating capacity, and \(w_i\) is the weight you give it, proportional to its own days_open.

Solving that minimization the same way as ordinary least squares, but with every term in the sum carrying its own weight, gives the weighted normal equations.

\[ \hat{\beta} = (X^\top W X)^{-1} X^\top W y \]

\(X\) is the matrix of predictors, a column of ones for the intercept and then seats, \(y\) is the column of average revenues, and \(W\) is a 20 by 20 diagonal matrix with shop \(i\)'s weight \(w_i\) on the diagonal and zero everywhere else.

Solve that matrix equation directly in R, using days_open as the weight on each shop.

```r
# Solve the weighted normal equations by hand: beta_hat = inverse(X'WX) times X'Wy
X_mat <- cbind(1, shops$seats)
W_mat <- diag(shops$days_open)
y_vec <- shops$avg_revenue
beta_hand <- solve(t(X_mat) %*% W_mat %*% X_mat) %*% t(X_mat) %*% W_mat %*% y_vec
beta_hand
#>            [,1]
#> [1,] 145.901745
#> [2,]   7.065099
```

Solved by hand, the weighted intercept is 145.90 and the weighted slope is 7.065, noticeably closer to the true slope of 7 than OLS's 6.6501 was.

=== step === concept
## Confirming the hand solution with lm(weights=), and the efficiency gain over OLS

Check the hand solution against R's built-in weighted regression, which takes the weights as an argument instead of a matrix you build yourself.

```r
# Fit the same weighted regression with lm(), using days_open as the weights
wls <- lm(avg_revenue ~ seats, data = shops, weights = days_open)
summary(wls)
#> 
#> Call:
#> lm(formula = avg_revenue ~ seats, data = shops, weights = days_open)
#> 
#> Weighted Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -198.986  -50.445    3.323   80.772  201.726 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 145.9017     5.9594   24.48 2.86e-15 ***
#> seats         7.0651     0.1215   58.15  < 2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 110.9 on 18 degrees of freedom
#> Multiple R-squared:  0.9947,	Adjusted R-squared:  0.9944 
#> F-statistic: 3381 on 1 and 18 DF,  p-value: < 2.2e-16
```

lm(weights = days_open) lands on 145.9017 and 7.0651, matching the hand solve to four decimals. But look at the slope's standard error: 0.1215, down from OLS's 0.1841. That is about a third tighter, and the slope itself, 7.0651, sits much closer to the true value of 7 than OLS's 6.6501 did.

[KEY INSIGHT]
Both OLS and WLS are unbiased for the true slope: run either one again on a fresh batch of 20 shops and both would average out to 7 over many repeats. What weighting correctly buys you is not a different thing to estimate, it is a tighter standard error, because the precisely measured shops now carry more say in the fit than the shaky ones.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Weighting always shrinks the standard error mechanically, regardless of whether the weights are right. ::no
- WLS lets the precisely measured, high-days_open shops dominate the fit, which shrinks how much the slope would wobble from one batch of shops to the next. ::ok Right. The weighted sum of squares lets the 365-day shop and the other high-days_open shops pull the line toward them far more than a 12-day shop can, because their squared residuals count for more. That is exactly what shrinks the slope's standard error.
- WLS used more data than OLS did. ::no
- WLS dropped the noisy, low-days_open shops from the fit. ::no None of these hold up. Weighting does not shrink the standard error automatically: a wrong guess can make it worse, not better. WLS and OLS fit the exact same 20 shops, nothing was added or dropped. What actually shrinks the standard error is that the correct weights let the already precise, high-days_open shops carry more say in the fit, so the slope wobbles less from one sample of shops to the next.

=== step === widget
## Robust regression: weighting by how wrong a point looks, not how it was measured

The same move, weighting some points more than others inside a sum of squares, shows up again in robust regression, but for a completely different reason.

The widget below runs on its own small built-in dataset, 14 ordinary points plus one outlier, not on the coffee shops. Think of that one outlier as a single bad day folded into a shop's own average, the kind of problem WLS was never built to catch, rather than an unequal count of days.

::widget robust-weights {}

All three settings, OLS, Huber and Tukey, solve the same weighted normal equations as the coffee shops' weighted fit: minimize a weighted sum of squared residuals and solve for \(\hat{\beta}\). The difference is where each weight \(w_i\) comes from. In WLS, you already knew \(w_i\) before you fit anything, it was proportional to days_open. Here, the weight is recomputed from the size of each point's own residual, the line is refit, the residuals change, and the weight is recomputed again, a cycle called iteratively reweighted least squares, until the weights stop changing.

Drag the toggle to Huber or Tukey and watch the outlier's weight drop and the line snap back toward the 14 honest points.

=== step === concept
## Weighting by a guess, and why it does worse than OLS

It is tempting to weight by something that merely sounds plausible instead of the real, known source of unequal precision. Seating capacity itself looks like a candidate here, maybe bigger shops are noisier for some reason. Weight by 1/seats and see what that guess actually does to the fit.

```r
# Compare OLS, the correctly weighted fit, and a fit weighted by a guess (1/seats)
wrong <- lm(avg_revenue ~ seats, data = shops, weights = 1 / seats)

data.frame(
  model = c("OLS", "WLS (days_open)", "WLS (1/seats, a guess)"),
  slope = round(c(coef(ols)[2], coef(wls)[2], coef(wrong)[2]), 4),
  se    = round(c(summary(ols)$coefficients[2, 2],
                  summary(wls)$coefficients[2, 2],
                  summary(wrong)$coefficients[2, 2]), 4)
)
#>                    model  slope     se
#> 1                    OLS 6.6501 0.1841
#> 2        WLS (days_open) 7.0651 0.1215
#> 3 WLS (1/seats, a guess) 6.5290 0.2194
```

The 1/seats weighting lands the slope at 6.5290, farther from the true slope of 7 than OLS's own 6.6501. And its standard error, 0.2194, is larger than OLS's 0.1841, not smaller. An invented weight made both the estimate and its reported precision worse, not merely unhelpful.

[WARNING]
A weight is only as good as the reason behind it. days_open is a real, known, named source of unequal precision: it is literally how many numbers went into each average. 1/seats is just a guess wearing the same syntax. lm() has no way to tell the two apart, so the only thing that can is checking, before you trust the result, whether the weight actually traces back to a real reason some rows are noisier than others.

=== step === concept
## Generalized least squares: the same move for correlated errors

Weighted least squares assumed each shop's error was independent of every other shop's, differing only in how much it varied. Generalized least squares drops that assumption and widens the diagonal weight matrix into a full covariance matrix.

\[ \hat{\beta} = (X^\top \Sigma^{-1} X)^{-1} X^\top \Sigma^{-1} y \]

\(\Sigma\), capital sigma, is the covariance matrix of the 20 errors, one row and one column for every shop. When every shop's error is independent of every other shop's, and only their variances differ, \(\Sigma\) is diagonal, zero everywhere except shop \(i\)'s own variance on the diagonal, and this equation is exactly the weighted least squares you solved by hand, with \(W\) proportional to the inverse of that diagonal. GLS keeps the off-diagonal entries too, so it can also handle shops whose errors move together for some other reason, not just shops whose errors merely differ in size.

Confirm that agreement directly: fit the same model with nlme's gls(), telling it that each shop's variance is proportional to 1/days_open.

```r
# Confirm the WLS numbers with nlme's more general gls(), which also allows correlated errors
library(nlme)
gls_fit <- gls(avg_revenue ~ seats, data = shops, weights = varFixed(~ 1 / days_open))
summary(gls_fit)
#> Generalized least squares fit by REML
#>   Model: avg_revenue ~ seats 
#>   Data: shops 
#>        AIC      BIC    logLik
#>   161.8904 164.5615 -77.94521
#> 
#> Variance function:
#>  Structure: fixed weights
#>  Formula: ~1/days_open 
#> 
#> Coefficients:
#>                Value Std.Error  t-value p-value
#> (Intercept) 145.9017   5.95941 24.48258       0
#> seats         7.0651   0.12150 58.14888       0
#> 
#>  Correlation: 
#>       (Intr)
#> seats -0.944
#> 
#> Standardized residuals:
#>         Min          Q1         Med          Q3         Max 
#> -1.79495622 -0.45504340  0.02997152  0.72860309  1.81967806 
#> 
#> Residual standard error: 110.8582 
#> Degrees of freedom: 20 total; 18 residual
```

Compare that to the lm(weights=) fit, to six decimals rather than the four summary() rounds to.

```r
# Compare GLS's coefficients and slope standard error against lm(weights=), to six decimals
round(coef(gls_fit), 6)
#> (Intercept)       seats 
#>  145.901745    7.065099 
round(coef(wls), 6)
#> (Intercept)       seats 
#>  145.901745    7.065099 
gls_se <- unname(sqrt(diag(vcov(gls_fit)))["seats"])
wls_se <- unname(summary(wls)$coefficients["seats", "Std. Error"])
round(c(gls_slope_se = gls_se, wls_slope_se = wls_se), 6)
#> gls_slope_se wls_slope_se 
#>       0.1215       0.1215 
```

The coefficients and the slope's standard error match exactly. GLS with a diagonal, fixed-weights covariance structure is simply weighted least squares wearing a more general name.

=== step === quiz
## Quick check: reading a weighted fit honestly

A colleague fits a regression with invented weights and reports a smaller standard error than OLS's. What should you check before calling it an improvement?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Nothing. Any standard error smaller than OLS's confirms the weights helped. ::no
- Whether the weights were entered through lm(weights=) rather than computed by hand first, since only lm()'s own argument counts as valid weighting. ::no
- Whether the weights are actually proportional to the real, known source of unequal precision, since a wrong guess, like the 1/seats weighting on these same shops, can shrink or inflate the reported standard error without being a real improvement. ::ok Right. The 1/seats guess did exactly the opposite of helping: it left the standard error larger than OLS's own 0.1841, while also pulling the slope further from the true value of 7. A smaller reported standard error proves nothing until you have checked where the weights actually came from.
- Whether the standard error is smaller, since a smaller standard error always means the weights were well chosen. ::no
- Whether some data-driven rule produced the weights, the way the robust-weights widget's residual-based reweighting did, even without a known source of unequal precision. ::no None of these hold up. A smaller standard error proves nothing by itself, the 1/seats guess made the standard error larger, not smaller. Hand-solving the weights gave the identical estimator lm(weights=) gave, so how the weight is entered is not what makes it valid. What makes it valid is tracing back to a known, named source of unequal precision, and a residual's own size, the basis robust regression uses for a different problem, is not that.

=== step === tryit
## Your turn: building a weight from a reported standard error

Not every shop will hand you a day count. Sometimes precision is reported directly, as a standard error.

Four more shops report their own average revenue and the standard error of that average, instead of a day count.

```r
# Four more shops report their average revenue and the standard error of that average directly
newshops <- data.frame(
  seats       = c(20, 33, 52, 65),
  avg_revenue = c(320.27, 370.52, 513.31, 613.78),
  se          = c(22.72, 6.34, 18.12, 4.91)
)
newshops
#>   seats avg_revenue    se
#> 1    20      320.27 22.72
#> 2    33      370.52  6.34
#> 3    52      513.31 18.12
#> 4    65      613.78  4.91
```

A weight should be proportional to precision, the reciprocal of variance. A standard error is the square root of a variance, so the variance itself is se squared, and the weight you want is its reciprocal. Fill in the blank below in place of `____` and press Check.

```r
# Fit newshops, weighting each row by its own precision
lm(avg_revenue ~ seats, data = newshops, weights = ____)
```

::check {"regex": "weights\\s*=\\s*(1\\s*/\\s*se\\s*(\\^|\\*\\*)\\s*2|se\\s*(\\^|\\*\\*)\\s*-\\s*2)", "gate": true, "difficulty": "intermediate", "ok": "Right: 1/se^2 is proportional to each shop's own precision, the reciprocal of its variance.", "no": "The weight should be proportional to precision, the reciprocal of variance. A standard error squared, se^2, is the variance, so the weight you want is its reciprocal, 1/se^2 (equivalently se^-2), not se alone and not se^2 on its own."}
::solution
```r
# Fit newshops with weights proportional to each shop's own precision, 1/se^2
lm(avg_revenue ~ seats, data = newshops, weights = 1 / se^2)
#> 
#> Call:
#> lm(formula = avg_revenue ~ seats, data = newshops, weights = 1/se^2)
#> 
#> Weighted Residuals:
#>       1       2       3       4 
#>  1.8461 -0.7017 -0.1603  0.1879 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)   
#> (Intercept)  129.645     18.069   7.175  0.01888 * 
#> seats          7.434      0.332  22.394  0.00199 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 1.407 on 2 degrees of freedom
#> Multiple R-squared:  0.996,	Adjusted R-squared:  0.994 
#> F-statistic: 501.5 on 1 and 2 DF,  p-value: 0.001988
```

Weighted by 1/se^2, the slope comes out at 7.434 with a standard error of 0.332, built from only four shops but still anchored by exactly the same logic as the 20-shop fit: let the precisely measured rows carry more say.

=== step === concept
## References

- [Fitting linear models: the weights argument](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html) - R's own documentation for lm(), the weights argument this lesson builds by hand first.
- [nlme: Linear and Nonlinear Mixed Effects Models](https://cran.r-project.org/web/packages/nlme/nlme.pdf) - the package reference manual for gls() and varFixed(), used for the generalized least squares confirmation.
- [vcov() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/vcov.html) - R Core Team. Extracts the variance-covariance matrix this lesson reads the GLS slope's standard error from.
- Carroll, R.J. and Ruppert, D. (1988). Transformation and Weighting in Regression. Chapman and Hall. The standard reference on what a misspecified weight function costs an otherwise correctly weighted fit, the basis for this lesson's warning about invented weights.
- Draper, N.R. and Smith, H. Applied Regression Analysis (3rd ed.). Wiley. The weighted least squares and generalized least squares chapters this lesson's derivation follows.

=== step === complete
## The decision rule for weighting a regression

- Ordinary least squares treats every shop's squared residual as equally informative, no matter how many days that shop's average was built from.
- Weighted least squares weights each squared residual by a known, named source of unequal precision, days_open here. Solving its normal equations by hand or fitting it with lm(weights=) lands on the identical slope, 7.065.
- Both OLS and WLS are unbiased for the true slope. The gain from weighting correctly is a tighter standard error, not a different quantity to estimate, because the correctly weighted fit lets the precisely measured shops carry more say in the line.
- Weighting by a guess instead of the real source of imprecision, 1/seats here, left both the estimate and its standard error worse than plain OLS.
- Generalized least squares is the same move widened to a full covariance matrix, so it can also handle errors that move together across rows, not just errors with unequal variance.

So, whenever a regression's rows were not all measured with the same care, the decision is the same every time: find the real, named reason some rows are noisier than others, weight by it, and check that the standard error actually shrank before calling it an improvement.

The next lesson turns to a different kind of unequal say in a regression: a single point whose own position gives it outsized leverage over the fit.
