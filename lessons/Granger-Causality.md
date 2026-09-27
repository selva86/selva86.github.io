---
title: "Multivariate Time Series Lesson 3: Testing Granger causality between two series"
slug: "Granger-Causality"
description: "Test whether one time series helps forecast another with the Granger F test: compute it by hand, run it both ways, and see what a rejection does not prove."
keywords: "Granger causality, Granger causality test in R, grangertest, causality function, vector autoregression, VAR, time series forecasting, F test, lag order"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-multivariate"
course_title: "Multivariate Time Series"
course_lesson: "3"
course_total: "6"
course_landing: "Multivariate-Time-Series-Course.html"
course_prev: "Choosing-the-Lag-Order"
course_next: "Impulse-Response-Functions"
curriculum_id: "5.110.3"
lesson_access: "pro"
catalog_blurb: "Test whether one series helps forecast another, and what the result does not prove."
---

=== step === cover
## Testing Granger causality between two series

Today let's find out whether one time series can help forecast another, and what it does and does not mean when it can.

Our data is Canada's quarterly labour statistics from the OECD: 84 quarters, from 1980 Q1 to 2000 Q4. Two of the series are employment and the unemployment rate. We want to know whether last quarter's employment growth helps forecast this quarter's change in the unemployment rate.

The Granger test answers that with two forecasts of the change in the unemployment rate, and it compares their errors. We measure a forecast's error with SSE, the sum of squared errors: the squared gap between each actual value and its forecast, added up over all quarters. A smaller SSE means a better forecast.

::widget process-flow {"steps":[{"title":"Forecast from its own past","sub":"regress the unemployment change on its own lag, SSE 10.51"},{"title":"Add the employment change","sub":"same regression plus the employment change lag, SSE 8.73"},{"title":"Test the drop in SSE","sub":"F = 16.14, p = 0.0001"}]}

Those three boxes are the whole test, with the numbers Canada's data gives.

=== step === concept
## What does it mean for one series to Granger-cause another?

A series X **Granger-causes** a series Y if the past values of X lower the forecast error of Y, beyond what the past values of Y itself already achieve. The idea comes from the economist Clive Granger.

In our data, X is the change in employment and Y is the change in the unemployment rate. So the question becomes: given the unemployment change's own last quarter, does last quarter's employment change lower the forecast error of this quarter's unemployment change?

Two things follow from that definition.

- Only past values of X enter the test. Whatever X does in the same quarter as Y is left out.
- The claim is about forecast error. It does not say that X makes Y happen, and it is made given the series we include in the test.

Now let's set up the data. The Canada data has four series: `e` is 100 times the log of civil employment, `prod` is a measure of labour productivity, `rw` is the real wage and `U` is the unemployment rate in percent.

We work with first differences, which means this quarter's value minus last quarter's. So `d_e`, the difference of `e`, is about the quarterly employment growth in percent, and `d_U` is the change in the unemployment rate in percentage points. Differencing 84 quarters leaves 83 changes.

```r
# Load the Canada data and build the quarterly changes of each series
library(vars)
library(forecast)
data(Canada)
changes <- as.data.frame(diff(Canada))
names(changes) <- c("d_e", "d_prod", "d_rw", "d_U")
head(changes, 4)
#>         d_e     d_prod     d_rw   d_U
#> 1 0.1934707 -0.7266325 1.999650  0.17
#> 2 0.5144030 -0.8249509 2.404354 -0.23
#> 3 1.1092999  0.4008901 3.423704 -0.20
#> 4 1.2343182  0.8309404 2.800874  0.10
nrow(changes)
#> [1] 83
```

We difference `e` because it trends upward, and the F test we will run assumes each series has a stable mean. Roughly speaking, a series whose mean stays put over time, instead of drifting, is called stationary. The function `ndiffs()` from the forecast package returns the number of first differences a series needs to become stationary.

```r
# Count the first differences each series needs to have a stable mean
ndiffs(Canada[, "e"])
#> [1] 1
ndiffs(changes$d_e)
#> [1] 0
```

So `e` needs 1 difference, and `d_e` needs none. We difference `U` as well, so that both regressions in the test describe quarterly changes.

Let's plot the two changes and measure how closely they move within the same quarter.

```r
# Plot the two quarterly changes and measure how closely they move together
changes_ts <- ts(changes[, c("d_e", "d_U")], start = c(1980, 2), frequency = 4)
plot(changes_ts, main = "Canada: quarterly changes, 1980 Q2 to 2000 Q4", xlab = "Year")
round(cor(changes$d_e, changes$d_U), 3)
#> [1] -0.856
```

Within the same quarter the two changes have a correlation of -0.856: quarters of strong employment growth are quarters where the unemployment rate falls. The Granger test does not use that link. It uses only what earlier quarters tell us about the current one.

=== step === concept
## How is the Granger test calculated by hand?

The test is two regressions and one comparison. Each regression forecasts the unemployment change in a quarter from the quarter before, so we first pair every quarter's changes with the previous quarter's.

```r
# Pair each quarter's changes with the previous quarter's changes
n <- nrow(changes)
lagged <- data.frame(
  d_U     = changes$d_U[2:n],
  d_e     = changes$d_e[2:n],
  d_U_lag = changes$d_U[1:(n - 1)],
  d_e_lag = changes$d_e[1:(n - 1)]
)
nrow(lagged)
#> [1] 82
head(lagged, 3)
#>     d_U      d_e d_U_lag   d_e_lag
#> 1 -0.23 0.514403    0.17 0.1934707
#> 2 -0.20 1.109300   -0.23 0.5144030
#> 3  0.10 1.234318   -0.20 1.1092999
```

The first row pairs the second quarter's `d_U` of -0.23 with the first quarter's `d_U` of 0.17. Losing the first quarter to the lag leaves 82 pairs.

The first regression forecasts `d_U` from its own lag alone. It is called the **restricted** regression, because it forces the coefficient on the `d_e` lag to be 0. The second regression adds the `d_e` lag, and it is called the **unrestricted** regression.

```r
# Fit d_U on its own lag, then again with the d_e lag added, and compare the SSEs
restricted   <- lm(d_U ~ d_U_lag, data = lagged)
unrestricted <- lm(d_U ~ d_U_lag + d_e_lag, data = lagged)
sse_r <- sum(resid(restricted)^2)
sse_u <- sum(resid(unrestricted)^2)
round(c(restricted = sse_r, unrestricted = sse_u), 3)
#>   restricted unrestricted
#>       10.514        8.731
```

The SSE is 10.514 for the restricted regression and 8.731 for the unrestricted one. An extra term can never raise the SSE, so some drop is guaranteed. The real question is whether this drop of 1.783 is larger than what a useless extra term would give by chance.

The F statistic answers that by comparing the drop with the typical size of a squared error.

\[
F = \frac{(\text{SSE}\ \text{restricted} - \text{SSE}\ \text{unrestricted}) / q}{\text{SSE}\ \text{unrestricted} / (N - k)}
\]

Here q = 1 is the number of terms we added, N = 82 is the number of pairs, and k = 3 is the number of coefficients in the unrestricted regression: an intercept, the `d_U` lag and the `d_e` lag. So N - k = 79, the number of pairs left after estimating those 3 coefficients. These two counts, q = 1 and N - k = 79, are the degrees of freedom of the F test.

The top of the fraction is the drop in SSE per added term. The bottom is the unrestricted regression's SSE divided by 79, its typical squared error. If the added lag does nothing, the drop should be about one typical squared error, and F lands near 1.

```r
# Compute the F statistic and its p-value from the two SSEs
df_num  <- 1                              # one term added: the d_e lag
df_den  <- df.residual(unrestricted)      # 82 rows minus 3 coefficients
F_stat  <- ((sse_r - sse_u) / df_num) / (sse_u / df_den)
p_value <- pf(F_stat, df_num, df_den, lower.tail = FALSE)
df_den
#> [1] 79
round(F_stat, 3)
#> [1] 16.136
signif(p_value, 4)
#> [1] 0.0001335
```

So F is 16.136: the drop in SSE is about 16 times a typical squared error.

The p-value is the probability, if the added lag has no effect, of getting an F at least this large. That assumption of no effect is the **null hypothesis**, written H0. Here `pf()` gives it from the F distribution with 1 and 79 degrees of freedom: 0.0001335. If the `d_e` lag did nothing, an F this large would turn up in about 1.3 of every 10,000 datasets.

With one added lag, F is also the square of the t statistic on that lag. The t statistic is the coefficient divided by its standard error, and both come from the summary of the unrestricted regression.

```r
# With one added lag, F is the square of the t statistic on that lag
lag_row <- coef(summary(unrestricted))["d_e_lag", ]
round(lag_row, 4)
#>   Estimate Std. Error    t value   Pr(>|t|)
#>    -0.4905     0.1221    -4.0170     0.0001
t_stat <- lag_row[["t value"]]
round(t_stat^2, 3)
#> [1] 16.136
```

The coefficient on the `d_e` lag is -0.4905 and its standard error is 0.1221, so t = -0.4905 / 0.1221 = -4.017. Squared, that is 16.136, the F we computed by hand.

Finally, `anova()` compares the two fitted regressions and prints the same F and p-value.

```r
# anova() compares the two fitted regressions and prints the same F and p-value
anova(restricted, unrestricted)
#> Analysis of Variance Table
#>
#> Model 1: d_U ~ d_U_lag
#> Model 2: d_U ~ d_U_lag + d_e_lag
#>   Res.Df     RSS Df Sum of Sq      F    Pr(>F)
#> 1     80 10.5144
#> 2     79  8.7311  1    1.7833 16.136 0.0001335 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The Sum of Sq column, 1.7833, is the drop in SSE: 10.5144 minus 8.7311.

[KEY INSIGHT]
The Granger test is an F test on the drop in SSE when the other series' lags are added to a regression of the outcome on its own lags. Every Granger result in this lesson is this calculation with different variables or more lags.

=== step === widget
## How is the p-value read from the null distribution?

The null distribution shows how a t statistic would vary if the added lag had no effect. It is a bell curve centred at 0, and the area under it is 1.

The widget draws the standard normal curve. With 79 residual degrees of freedom, the t distribution is close to it, so the p-values on the widget land close to the ones R prints. The curve is built into the widget rather than taken from our data, and it maps onto the example through the `d_e` lag's t statistic of -4.02, whose square is the F of 16.14.

::widget null-distribution {"tails": 2, "max": 5, "start": 1.0, "label": "t statistic on the added lag"}

The p-value is the shaded area: the share of t values at least as far from 0 as the slider's value. Both tails count, because the coefficient could have come out negative or positive.

Drag the slider to 4.00, close to the `d_e` lag's t statistic. The shaded tails have almost vanished and the p-value shows 0.000. R's exact t distribution gives 0.00013 for the `d_e` lag, which is also 0.000 to three decimals.

Now look for the usual 0.05 line. At 1.95 the p-value shows 0.051 and at 2.00 it shows 0.046, so p falls below 0.05 at a t statistic of about 1.96 on either side.

So a p-value is the share of t values at least this extreme if the lag adds nothing. A t of 4.02 sits far out in the tail, and that is why the p-value for the `d_e` lag is so small.

=== step === concept
## How to run the test in both directions

You do not have to build the two regressions yourself. The function `grangertest()`, from the lmtest package that vars loads, runs the whole test in one call.

The formula puts the response on the left of the `~`, and the series whose past you are testing on the right. The argument `order` sets the number of lags. So `d_U ~ d_e` asks whether the `d_e` lags help forecast `d_U`, and swapping the two sides asks the opposite question.

[WARNING]
Read `~` as "is forecast by", not as "causes". The variable on the left of the `~` is the one being forecast, and putting the two variables in the wrong order tests the wrong direction.

The code runs the test in both directions on the quarterly changes.

```r
# Test both directions: does the d_e lag help forecast d_U, and the d_U lag d_e?
grangertest(d_U ~ d_e, order = 1, data = changes)
#> Granger causality test
#>
#> Model 1: d_U ~ Lags(d_U, 1:1) + Lags(d_e, 1:1)
#> Model 2: d_U ~ Lags(d_U, 1:1)
#>   Res.Df Df      F    Pr(>F)
#> 1     79
#> 2     80 -1 16.136 0.0001335 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
grangertest(d_e ~ d_U, order = 1, data = changes)
#> Granger causality test
#>
#> Model 1: d_e ~ Lags(d_e, 1:1) + Lags(d_U, 1:1)
#> Model 2: d_e ~ Lags(d_e, 1:1)
#>   Res.Df Df      F Pr(>F)
#> 1     79
#> 2     80 -1 0.0042 0.9487
```

Model 1 is the regression with both series' lags, and Model 2 keeps only the outcome's own lag. The last row compares them.

The first call gives F = 16.136 and p = 0.0001335, the same values we computed by hand. The second gives F = 0.0042 and p = 0.9487. So the `d_e` lag improves the forecast of `d_U`, but the `d_U` lag does not improve the forecast of `d_e`. In these data the result runs in one direction only.

The second F is small for the same reason the first was large. In the reverse regression, the t statistic on the `d_U` lag is 0.0645, and its square is 0.0042.

```r
# Read the t statistic on the d_U lag in the reverse regression
reverse_unrestricted <- lm(d_e ~ d_e_lag + d_U_lag, data = lagged)
round(coef(summary(reverse_unrestricted))["d_U_lag", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|)
#>     0.0130     0.2019     0.0645     0.9487
```

On the null distribution, a t statistic of 0.06 sits almost at the centre, so nearly all of the curve lies further out. That is why the p-value is about 0.95.

=== step === widget
## How much does adding the employment lag reduce the squared error?

The two directions differ, but raw correlations do not show it. Let's correlate each lag with the outcome it would forecast.

```r
# Correlate each lag with the outcome, without removing anything
raw_cors <- c(d_e_lag_with_d_U = cor(lagged$d_e_lag, lagged$d_U),
              d_U_lag_with_d_e = cor(lagged$d_U_lag, lagged$d_e))
round(raw_cors, 3)
#> d_e_lag_with_d_U d_U_lag_with_d_e
#>           -0.660           -0.618
```

The `d_e` lag correlates with `d_U` at -0.660, and the `d_U` lag correlates with `d_e` at -0.618. Those are close, so raw correlations cannot tell the two directions apart.

What matters is what a lag adds beyond the outcome's own lag. The partial correlation measures exactly that: it is the correlation of two residual series, each with the outcome's own lag removed by a regression.

```r
# Correlate each lag with the outcome after removing the outcome's own lag
x_e_to_U <- resid(lm(d_e_lag ~ d_U_lag, data = lagged))   # d_e lag, d_U lag removed
y_e_to_U <- resid(lm(d_U ~ d_U_lag, data = lagged))       # d_U, its own lag removed
x_U_to_e <- resid(lm(d_U_lag ~ d_e_lag, data = lagged))   # d_U lag, d_e lag removed
y_U_to_e <- resid(lm(d_e ~ d_e_lag, data = lagged))       # d_e, its own lag removed
partial_cors <- c(d_e_to_d_U = cor(x_e_to_U, y_e_to_U),
                  d_U_to_d_e = cor(x_U_to_e, y_U_to_e))
round(partial_cors, 3)
#> d_e_to_d_U d_U_to_d_e
#>     -0.412      0.007
```

After removing the outcome's own lag, the `d_e` lag still correlates with `d_U` at -0.412. The `d_U` lag correlates with `d_e` at 0.007, which is almost nothing.

Next, the SSE of each regression without and with the other series' lag.

```r
# Compare each regression's SSE without and with the other series' lag
reverse_restricted <- lm(d_e ~ d_e_lag, data = lagged)
sse_table <- data.frame(
  outcome        = c("d_U", "d_e"),
  own_lag_only   = c(sse_r, sum(resid(reverse_restricted)^2)),
  with_other_lag = c(sse_u, sum(resid(reverse_unrestricted)^2))
)
sse_table$drop <- sse_table$own_lag_only - sse_table$with_other_lag
sse_table[, 2:4] <- round(sse_table[, 2:4], 3)
sse_table
#>   outcome own_lag_only with_other_lag  drop
#> 1     d_U       10.514          8.731 1.783
#> 2     d_e       13.273         13.272 0.001
```

For `d_U`, the SSE drops by 1.783, from 10.514 to 8.731. For `d_e`, it drops by 0.001, from 13.273 to 13.272.

The widget plots the 82 residual pairs from the `d_U` direction, which are the `x_e_to_U` and `y_e_to_U` residuals above, rounded to 3 decimals. The x axis is the `d_e` lag with the `d_U` lag removed, and the y axis is `d_U` with its own lag removed. The vertical gap from each point to the line is that quarter's forecast error, and each square has an area equal to its squared error.

::widget ols-fit {"points":[{"x":0.014,"y":-0.320},{"x":-0.125,"y":-0.064},{"x":0.505,"y":0.219},{"x":0.974,"y":-0.291},{"x":0.238,"y":0.412},{"x":-0.084,"y":0.783},{"x":0.239,"y":-0.019},{"x":-0.753,"y":1.323},{"x":-0.024,"y":0.872},{"x":0.120,"y":-0.424},{"x":-0.253,"y":-0.656},{"x":-0.259,"y":-0.002},{"x":0.592,"y":-0.411},{"x":0.428,"y":-0.195},{"x":-0.487,"y":0.359},{"x":-0.157,"y":0.166},{"x":0.411,"y":-0.277},{"x":0.331,"y":-0.028},{"x":-0.080,"y":-0.091},{"x":-0.154,"y":-0.268},{"x":0.214,"y":-0.145},{"x":0.116,"y":0.139},{"x":0.454,"y":-0.484},{"x":0.012,"y":0.235},{"x":0.128,"y":0.046},{"x":-0.139,"y":-0.094},{"x":-0.046,"y":0.062},{"x":0.195,"y":-0.464},{"x":0.271,"y":-0.058},{"x":0.108,"y":-0.378},{"x":0.204,"y":0.068},{"x":0.143,"y":-0.047},{"x":-0.132,"y":0.249},{"x":0.020,"y":-0.137},{"x":0.284,"y":-0.114},{"x":0.504,"y":0.096},{"x":-0.368,"y":-0.234},{"x":-0.277,"y":0.382},{"x":0.303,"y":-0.070},{"x":0.227,"y":-0.058},{"x":-0.244,"y":0.593},{"x":-0.037,"y":0.714},{"x":-0.117,"y":0.394},{"x":-0.287,"y":-0.382},{"x":-0.087,"y":-0.014},{"x":-0.252,"y":-0.064},{"x":-0.637,"y":0.253},{"x":-0.590,"y":0.276},{"x":-0.082,"y":0.180},{"x":0.025,"y":0.110},{"x":0.113,"y":-0.840},{"x":-0.628,"y":0.979},{"x":0.312,"y":-0.533},{"x":-0.189,"y":-0.051},{"x":-0.310,"y":-0.228},{"x":-0.554,"y":-0.148},{"x":0.083,"y":-0.332},{"x":0.010,"y":-0.125},{"x":-0.092,"y":0.109},{"x":0.013,"y":0.025},{"x":-0.597,"y":0.070},{"x":-0.181,"y":-0.241},{"x":-0.342,"y":0.366},{"x":0.177,"y":-0.194},{"x":-0.206,"y":0.316},{"x":0.018,"y":0.053},{"x":-0.086,"y":-0.577},{"x":0.003,"y":0.142},{"x":0.231,"y":-0.351},{"x":0.128,"y":0.149},{"x":0.056,"y":-0.108},{"x":-0.171,"y":-0.168},{"x":0.036,"y":-0.001},{"x":0.234,"y":-0.044},{"x":0.205,"y":-0.045},{"x":0.066,"y":0.049},{"x":0.268,"y":-0.317},{"x":-0.112,"y":-0.402},{"x":-0.293,"y":0.215},{"x":0.350,"y":-0.021},{"x":-0.069,"y":0.292},{"x":0.135,"y":-0.184}]}

Set the slope to 0 and the intercept to 0. A flat line at zero ignores the `d_e` lag, and the SSE shows 10.51, the SSE of the restricted regression. Then press Snap to least squares: the slope becomes -0.49 and the SSE falls to 8.73, the SSE of the unrestricted regression.

That slope is the coefficient on the `d_e` lag in the regression we ran by hand, -0.4905. The widget's points are rounded to 3 decimals, so the `lm()` line in its own code block prints a slope of about -0.4907, which differs from it only in the fourth decimal. The drop from 10.51 to 8.73 is the numerator of F.

In the other direction, the partial correlation is 0.007, so a line through those residual pairs is flat and cannot lower the SSE. That is why its SSE only moves from 13.273 to 13.272.

=== step === quiz
## Quick check: what does the reverse direction show?

Adding the `d_U` lag to the regression of `d_e` on its own lag moved the SSE from 13.273 to 13.272, with F = 0.004 and p = 0.95. What does that show?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Unemployment has no effect on employment. ::no
- The two series are unrelated. ::no
- The d_U lag adds nothing to a forecast of d_e that already uses d_e's own past. ::ok Yes. The SSE barely moved, so the extra lag did not lower the forecast error. That is all the test says: it is about forecast error, and it says nothing about what unemployment does to employment.
- The test is unreliable because the two series are correlated. ::no Each of these reads more into F = 0.004 than it says. The test compares forecast errors, so it cannot say what unemployment does to employment. It cannot say the series are unrelated either, because their same-quarter correlation is -0.856. And that correlation does not make the test unreliable, since the same test gave F = 16.14 in the other direction.

=== step === concept
## How to run the test on a fitted VAR, and does the lag order matter?

The function `grangertest()` works on one pair of series at a time. When the series sit in a vector autoregression (VAR), the function `causality()` from the vars package runs the test on the fitted system.

A VAR is one regression per series, each on p lags of every series in the system. With `d_e` and `d_U` and p = 2, there are two equations, and each one has 2 lags of `d_e`, 2 lags of `d_U` and an intercept.

First we choose p. The function `VARselect()` scores lag orders 1 to 4 with four information criteria: Akaike (AIC), Hannan-Quinn (HQ), Schwarz (SC) and final prediction error (FPE). Each criterion scores how well the regressions fit, with a penalty for every extra coefficient, and the lowest score wins.

```r
# Fit a two-series VAR and see which lag order the criteria pick
two_series <- changes[, c("d_e", "d_U")]
VARselect(two_series, lag.max = 4, type = "const")$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n)
#>      2      1      1      2
var2 <- VAR(two_series, p = 2, type = "const")
```

AIC and FPE pick 2 lags, while HQ and SC pick 1. So we fit a VAR with p = 2, where `type = "const"` adds the intercept to each equation, and we will check the other orders afterwards.

Now let's test each direction. The argument `cause = "d_e"` tests whether the `d_e` lags in the `d_U` equation are jointly zero.

```r
# Test the d_e lags in the d_U equation, and the d_U lags in the d_e equation
causality(var2, cause = "d_e")$Granger
#>
#> 	Granger causality H0: d_e do not Granger-cause d_U
#>
#> data:  VAR object var2
#> F-Test = 9.732, df1 = 2, df2 = 152, p-value = 0.0001054
#>
causality(var2, cause = "d_U")$Granger
#>
#> 	Granger causality H0: d_U do not Granger-cause d_e
#>
#> data:  VAR object var2
#> F-Test = 1.5581, df1 = 2, df2 = 152, p-value = 0.2139
#>
```

For the first test, F = 9.732 with 2 and 152 degrees of freedom and p = 0.0001054, so the `d_e` lags lower the `d_U` forecast error. For the reverse, F = 1.5581 and p = 0.2139, which is no rejection.

The function `grangertest()` at 2 lags gives the same F, but a slightly different p-value.

```r
# grangertest() at 2 lags gives the same F, with the d_U equation's own degrees of freedom
grangertest(d_U ~ d_e, order = 2, data = changes)
#> Granger causality test
#>
#> Model 1: d_U ~ Lags(d_U, 1:2) + Lags(d_e, 1:2)
#> Model 2: d_U ~ Lags(d_U, 1:2)
#>   Res.Df Df     F    Pr(>F)
#> 1     76
#> 2     78 -2 9.732 0.0001726 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

F is 9.732 in both. The p-values differ, 0.00017 here against 0.0001054 above, because `causality()` uses 2 x 76 = 152 denominator degrees of freedom, 76 for each of the 2 equations, while `grangertest()` uses the 76 of the `d_U` equation alone.

Last, we repeat both tests at lag orders 1 to 4. In the table, `F_e_to_U` tests the `d_e` lags in the `d_U` forecast, and `F_U_to_e` tests the reverse.

```r
# Repeat the test in both directions at lag orders 1 to 4
orders  <- 1:4
results <- data.frame(order = orders, F_e_to_U = NA, p_e_to_U = NA,
                      F_U_to_e = NA, p_U_to_e = NA)
for (k in orders) {
  e_to_U <- grangertest(d_U ~ d_e, order = k, data = changes)
  U_to_e <- grangertest(d_e ~ d_U, order = k, data = changes)
  results$F_e_to_U[k] <- round(e_to_U$F[2], 3)
  results$p_e_to_U[k] <- sprintf("%.4f", e_to_U[["Pr(>F)"]][2])
  results$F_U_to_e[k] <- round(U_to_e$F[2], 3)
  results$p_U_to_e[k] <- sprintf("%.4f", U_to_e[["Pr(>F)"]][2])
}
results
#>   order F_e_to_U p_e_to_U F_U_to_e p_U_to_e
#> 1     1   16.136   0.0001    0.004   0.9487
#> 2     2    9.732   0.0002    1.558   0.2172
#> 3     3    6.927   0.0004    1.112   0.3499
#> 4     4    5.739   0.0005    0.814   0.5205
```

From the `d_e` lags to `d_U`, F is 16.14, 9.73, 6.93 and 5.74, and p stays below 0.001 at every order. In the other direction F is 0.004, 1.56, 1.11 and 0.81, and p stays above 0.2 at every order. So the rejection does not depend on which lag order between 1 and 4 we pick.

=== step === concept
## How does a third series change a Granger result?

So far the answer has come from real data, where we cannot check it against the truth. So let's simulate beach data where we do know the truth.

Over 200 days, the temperature follows an AR(1) process: each day's value is 0.7 times the previous day's value plus random noise. Ice cream sales are 0.8 times the temperature one day back, plus noise with a standard deviation of 0.6. Lifeguard rescues are 0.8 times the temperature two days back, plus the same kind of noise.

By construction, ice cream sales have no effect on rescues, because rescues are built from temperature alone. All three series are deviations from their usual levels, so they can be negative.

```r
# Simulate 200 days: temperature drives ice cream sales and rescues, ice cream does nothing
set.seed(2026)
n_days    <- 200
temp_full <- as.numeric(arima.sim(list(ar = 0.7), n = n_days + 2))
day       <- 3:(n_days + 2)
ice       <- 0.8 * temp_full[day - 1] + rnorm(n_days, sd = 0.6)   # temperature 1 day back
rescues   <- 0.8 * temp_full[day - 2] + rnorm(n_days, sd = 0.6)   # temperature 2 days back
beach <- data.frame(temp = temp_full[day], ice = ice, rescues = rescues)
round(head(beach, 3), 3)
#>     temp    ice rescues
#> 1 -0.201  0.188  -0.017
#> 2 -0.305 -1.682   0.267
#> 3 -1.606 -0.569   0.708
```

We simulate 202 temperatures so that the first of the 200 days has two earlier days to draw on. Now let's test ice cream sales and rescues on their own, in both directions, at 2 lags.

```r
# With only ice cream sales and rescues, test both directions at 2 lags
grangertest(rescues ~ ice, order = 2, data = beach)
#> Granger causality test
#>
#> Model 1: rescues ~ Lags(rescues, 1:2) + Lags(ice, 1:2)
#> Model 2: rescues ~ Lags(rescues, 1:2)
#>   Res.Df Df      F    Pr(>F)
#> 1    193
#> 2    195 -2 79.268 < 2.2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
grangertest(ice ~ rescues, order = 2, data = beach)
#> Granger causality test
#>
#> Model 1: ice ~ Lags(ice, 1:2) + Lags(rescues, 1:2)
#> Model 2: ice ~ Lags(ice, 1:2)
#>   Res.Df Df      F Pr(>F)
#> 1    193
#> 2    195 -2 0.2371 0.7892
```

Ice cream sales Granger-cause rescues: F = 79.27 and p is below 2.2e-16. The reverse gives F = 0.237 and p = 0.789. Yet ice cream sales have no effect on rescues in these data.

The test is not wrong. Ice cream sales one day back are a noisy measure of the temperature two days back, and that temperature is what drives rescues. So the past of ice cream sales does lower the forecast error of rescues, even though ice cream has no effect.

Now let's add temperature to the system. In a VAR with three series, `causality()` tests the named series against all the other series at once. So `cause = "ice"` tests the ice cream lags in the equations for temperature and rescues together, which is 2 lags x 2 equations = 4 degrees of freedom.

```r
# Add temperature to the system and test ice cream sales and temperature
beach_var <- VAR(beach, p = 2, type = "const")
causality(beach_var, cause = "ice")$Granger
#>
#> 	Granger causality H0: ice do not Granger-cause temp rescues
#>
#> data:  VAR object beach_var
#> F-Test = 0.89887, df1 = 4, df2 = 573, p-value = 0.4643
#>
causality(beach_var, cause = "temp")$Granger
#>
#> 	Granger causality H0: temp do not Granger-cause ice rescues
#>
#> data:  VAR object beach_var
#> F-Test = 118.22, df1 = 4, df2 = 573, p-value < 2.2e-16
#>
```

With temperature in the system, the test of ice cream sales gives F = 0.899 and p = 0.464, so there is no rejection. The test of temperature gives F = 118.2 and p below 2.2e-16. The rejection for ice cream sales has disappeared, and temperature is the series that rejects.

[KEY INSIGHT]
A Granger result is relative to the series included: given these series and this lag order, the past of X lowers the forecast error of Y. Add or remove a series and the result can change, as it did here for ice cream sales.

That is why the definition says the claim is made given the series we include. Three limits follow from it.

- **Omitted series.** A series that drives both X and Y, and that we leave out, can produce a rejection like the one for ice cream sales.
- **Lag order.** The result comes from a regression with a chosen number of lags, which is why we checked orders 1 to 4 on the Canada data.
- **Non-stationarity.** The F test assumes stationary series, which is why we worked with quarterly changes.

=== step === tryit
## Your turn: does productivity help forecast employment?

The `changes` data frame also holds `d_prod`, the quarterly change in productivity. Test whether the `d_prod` lags help forecast `d_e` at 2 lags. The call below runs the test in the wrong direction, so change it to test `d_prod` as the predictor of `d_e`.

```r
# Test whether the d_prod lags help forecast d_e, using 2 lags
grangertest(d_prod ~ d_e, order = 2, data = changes)
```
::check {"regex": "^(?=[\\s\\S]*d_e\\s*~\\s*d_prod)(?=[\\s\\S]*order\\s*=\\s*2)", "gate": true, "difficulty": "intermediate", "ok": "Yes. With d_e on the left of the ~, the test asks whether the d_prod lags lower the d_e forecast error: F = 6.22 and p = 0.0032 at 2 lags, so they do.", "no": "The response goes on the left of the ~. The starter call tests whether the d_e lags help forecast d_prod, which gives F = 2.00 and p = 0.142. Put d_e on the left, d_prod on the right, and keep order = 2."}
::solution
```r
# The response d_e goes on the left of the ~, the d_prod lags on the right
grangertest(d_e ~ d_prod, order = 2, data = changes)
#> Granger causality test
#>
#> Model 1: d_e ~ Lags(d_e, 1:2) + Lags(d_prod, 1:2)
#> Model 2: d_e ~ Lags(d_e, 1:2)
#>   Res.Df Df      F   Pr(>F)
#> 1     76
#> 2     78 -2 6.2195 0.003151 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The `d_prod` lags lower the `d_e` forecast error: F = 6.2195 and p = 0.003151. The starter tested the other direction, where the `d_e` lags did not lower the `d_prod` forecast error (F = 2.00, p = 0.142).

=== step === quiz
## Quick check: what does a Granger result support?

For Canada, adding the `d_e` lag to the `d_U` regression gave F = 16.14 and p = 0.0001, and the reverse direction showed no rejection. Which statement does that support?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Employment growth causes the fall in unemployment. ::no
- Given d_U's own past and only these two series, the d_e lag lowers the d_U forecast error. ::ok Yes. That is what the test measures: a lower forecast error, given the series and the lag order included. Nothing in it says how employment growth acts on unemployment.
- A p-value of 0.0001 means the d_e lag has a large effect on d_U. ::no
- Adding a third series, such as productivity, could not change the result. ::no Each of these goes beyond what the test measures. A rejection is about forecast error, not about mechanism. A p-value is a probability under the null hypothesis, not the size of an effect. And the result is relative to the series included: on the beach data, adding temperature removed the rejection for ice cream sales.

=== step === concept
## References

- [Investigating causal relations by econometric models and cross-spectral methods](https://doi.org/10.2307/1912791) - Granger (1969), Econometrica 37(3), 424-438. The paper that defines Granger causality.
- Hamilton, J. D. (1994). Time Series Analysis. Princeton University Press. Chapter 11 covers vector autoregressions and Granger causality tests.
- Lutkepohl, H. (2005). New Introduction to Multiple Time Series Analysis. Springer. A full treatment of VAR models and the tests run on them.
- [VAR, SVAR and SVEC Models: Implementation Within R Package vars](https://doi.org/10.18637/jss.v027.i04) - Pfaff (2008), Journal of Statistical Software 27(4). Documents the vars package, including `causality()`.
- [Diagnostic Checking in Regression Relationships](https://CRAN.R-project.org/doc/Rnews/Rnews_2002-3.pdf) - Zeileis and Hothorn (2002), R News 2(3), 7-10. Describes the lmtest package, which supplies `grangertest()`.

=== step === complete
## Quick recap

You computed the Granger test by hand, ran it in both directions and tested what changes when a third series joins the system. To summarize:

- Granger causality means the past of X lowers the forecast error of Y, beyond Y's own past. It is a claim about forecast error, not about mechanism.
- The test is two regressions and an F statistic. For Canada, adding the `d_e` lag cut the SSE of `d_U` from 10.514 to 8.731, which gives F = 16.136 and p = 0.0001335.
- The answer depends on the direction. The `d_e` lag improved the `d_U` forecast, while the `d_U` lag barely changed the `d_e` SSE, from 13.273 to 13.272.
- A result belongs to the series included and the lag order. The rejection held at lags 1 to 4 on the Canada data, but on the beach data ice cream sales went from F = 79.27 to p = 0.464 once temperature joined the system.

So, whenever someone says that X Granger-causes Y, you can ask: given which series, and at how many lags?

The next lesson traces what one shock to a series does to the system over the following quarters.
