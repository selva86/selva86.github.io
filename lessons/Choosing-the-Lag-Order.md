---
title: "Multivariate Time Series Lesson 2: Choosing the Lag Order"
slug: "Choosing-the-Lag-Order"
description: "Choose the lag order of a VAR on four Canadian labour-market series: see what too few and too many lags cost, read AIC, HQ and SC, and test the residuals in R."
keywords: "VAR lag order, VARselect, AIC HQ SC criteria, lag selection VAR in R, Edgerton-Shukur test, residual autocorrelation, vars package, Canada labour market"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-multivariate"
course_title: "Multivariate Time Series"
course_lesson: "2"
course_total: "6"
course_landing: "Multivariate-Time-Series-Course.html"
course_prev: "Vector-Autoregression-VAR.html"
course_next: "Granger-Causality.html"
curriculum_id: "5.110.2"
lesson_access: "pro"
catalog_blurb: "How far back a VAR should look, and how to check the choice."
---

=== step === cover
## Choosing the Lag Order

Today let's work out how far back a VAR should look, that is, how many past quarters each of its equations should use.

Take a labour-market analyst who wants to model four Canadian series together. They are employment (`e`), labour productivity (`prod`), the real wage (`rw`) and the unemployment rate (`U`, in percent), measured every quarter from 1980Q1 to 2000Q4. That is 84 quarters of OECD data, and it ships with the `vars` package as the data set `Canada`.

A vector autoregression, or VAR, gives each of the four series its own equation, and each equation predicts that series from the past values of all four. The number of past quarters an equation looks back over is called the **lag order**, written p. The analyst has to pick p before the VAR can be fitted.

::widget chart-plotter {"data":[{"x":1980,"y":7.53},{"x":1980.25,"y":7.7},{"x":1980.5,"y":7.47},{"x":1980.75,"y":7.27},{"x":1981,"y":7.37},{"x":1981.25,"y":7.13},{"x":1981.5,"y":7.4},{"x":1981.75,"y":8.33},{"x":1982,"y":8.83},{"x":1982.25,"y":10.43},{"x":1982.5,"y":12.2},{"x":1982.75,"y":12.77},{"x":1983,"y":12.43},{"x":1983.25,"y":12.23},{"x":1983.5,"y":11.7},{"x":1983.75,"y":11.2},{"x":1984,"y":11.27},{"x":1984.25,"y":11.47},{"x":1984.5,"y":11.3},{"x":1984.75,"y":11.17},{"x":1985,"y":11},{"x":1985.25,"y":10.63},{"x":1985.5,"y":10.27},{"x":1985.75,"y":10.2},{"x":1986,"y":9.67},{"x":1986.25,"y":9.6},{"x":1986.5,"y":9.6},{"x":1986.75,"y":9.5},{"x":1987,"y":9.5},{"x":1987.25,"y":9.03},{"x":1987.5,"y":8.7},{"x":1987.75,"y":8.13},{"x":1988,"y":7.87},{"x":1988.25,"y":7.67},{"x":1988.5,"y":7.8},{"x":1988.75,"y":7.73},{"x":1989,"y":7.57},{"x":1989.25,"y":7.57},{"x":1989.5,"y":7.33},{"x":1989.75,"y":7.57},{"x":1990,"y":7.63},{"x":1990.25,"y":7.6},{"x":1990.5,"y":8.17},{"x":1990.75,"y":9.2},{"x":1991,"y":10.17},{"x":1991.25,"y":10.33},{"x":1991.5,"y":10.4},{"x":1991.75,"y":10.37},{"x":1992,"y":10.6},{"x":1992.25,"y":11},{"x":1992.5,"y":11.4},{"x":1992.75,"y":11.73},{"x":1993,"y":11.07},{"x":1993.25,"y":11.67},{"x":1993.5,"y":11.47},{"x":1993.75,"y":11.3},{"x":1994,"y":10.97},{"x":1994.25,"y":10.63},{"x":1994.5,"y":10.1},{"x":1994.75,"y":9.67},{"x":1995,"y":9.53},{"x":1995.25,"y":9.47},{"x":1995.5,"y":9.5},{"x":1995.75,"y":9.27},{"x":1996,"y":9.5},{"x":1996.25,"y":9.43},{"x":1996.5,"y":9.7},{"x":1996.75,"y":9.9},{"x":1997,"y":9.43},{"x":1997.25,"y":9.3},{"x":1997.5,"y":8.87},{"x":1997.75,"y":8.77},{"x":1998,"y":8.6},{"x":1998.25,"y":8.33},{"x":1998.5,"y":8.17},{"x":1998.75,"y":8.03},{"x":1999,"y":7.9},{"x":1999.25,"y":7.87},{"x":1999.5,"y":7.53},{"x":1999.75,"y":6.93},{"x":2000,"y":6.8},{"x":2000.25,"y":6.7},{"x":2000.5,"y":6.93},{"x":2000.75,"y":6.87}],"geoms":["line","point"],"x":"year","y":"unemployment_rate"}

The chart plots the unemployment rate for all 84 quarters, one point per quarter. It is one of the four series the VAR has to look back over.

=== step === concept
## What the lag order p sets in a VAR

Let's start by loading the data and looking at its first three quarters.

```r
# Load the Canada data and look at its first three quarters
library(vars)
data(Canada)

round(Canada[1:3, ], 2)
#>           e   prod     rw    U
#> [1,] 929.61 405.37 386.14 7.53
#> [2,] 929.80 404.64 388.14 7.70
#> [3,] 930.32 403.81 390.54 7.47
```

Each row is one quarter and each column is one series. The series `e`, `prod` and `rw` are stored as 100 times the natural log of the original level, which is why they sit in the hundreds. `U` is the unemployment rate in percent.

Now let's write down the VAR itself. With p = 2, the equation for `U` uses the two most recent quarters of all four series, plus a constant and a linear trend. The trend is there because the levels of these series climb and fall over the years.

Here is that equation written out.

\[ U_t = c + \delta\, t + a_1 e_{t-1} + a_2 \mathrm{prod}_{t-1} + a_3 \mathrm{rw}_{t-1} + a_4 U_{t-1} + b_1 e_{t-2} + b_2 \mathrm{prod}_{t-2} + b_3 \mathrm{rw}_{t-2} + b_4 U_{t-2} + \varepsilon_t \]

The constant is c, and \(\delta\) multiplies the time index t. The a's multiply the four series one quarter back, the b's multiply them two quarters back, and \(\varepsilon_t\) is the error.

So this one equation has 10 coefficients. In general, an equation of a VAR(p) has 4p + 2 of them: four series times p lags, plus the constant and the trend. The system has four equations, so 4(4p + 2) coefficients in all.

Let's count them for a few orders, by fitting the VAR and counting the coefficients of the `U` equation.

```r
# Count the coefficients a VAR(p) estimates for p = 1, 2, 3 and 8
count_coefs <- function(p) {
  fit <- VAR(Canada, p = p, type = "both")
  per_equation <- length(coef(fit$varresult$U))
  data.frame(p = p, per_equation = per_equation, in_total = 4 * per_equation)
}

do.call(rbind, lapply(c(1, 2, 3, 8), count_coefs))
#>   p per_equation in_total
#> 1 1            6       24
#> 2 2           10       40
#> 3 3           14       56
#> 4 8           34      136
```

`type = "both"` adds the constant and the trend. `coef(fit$varresult$U)` returns the coefficients of the `U` equation, and `length()` counts them. At p = 2 that count is 10, the same as the equation above.

Each extra lag adds 4 coefficients to every equation, so 16 to the system. Going from p = 1 to p = 8 takes the system from 24 coefficients to 136, all estimated from the same 84 quarters.

The analyst sets p before fitting. The data do not estimate it. A p that is too small leaves useful information from the past out of the equations, and a p that is too large spends coefficients on noise.

=== step === concept
## What too few lags leaves in the residuals

Suppose p is too small. The equations leave out lags that still carry information about the series, and that information does not disappear. It stays in the residuals, which are the observed values minus the fitted values of an equation.

So a check on p is a look at the residuals. If one quarter's residual still helps predict the next quarter's, the equation has missed something from the past. The correlation of a residual series with itself, shifted back k quarters, is its autocorrelation at lag k, and `acf()` plots it for many lags at once.

The block fits VAR(1), VAR(2) and VAR(3) and plots the autocorrelation of the `U` residuals for p = 1 and p = 3.

```r
# Plot the autocorrelation of the unemployment residuals for p = 1 and p = 3
fits <- lapply(1:3, function(p) VAR(Canada, p = p, type = "both"))

res_u1 <- residuals(fits[[1]])[, "U"]
res_u3 <- residuals(fits[[3]])[, "U"]

par(mfrow = c(1, 2))
acf(res_u1, main = "U residuals, p = 1")
acf(res_u3, main = "U residuals, p = 3")
par(mfrow = c(1, 1))
```

Each bar is the autocorrelation at one lag, and the dashed lines mark a band of about 2 / sqrt(n), where n is the number of residuals. A bar inside the band is consistent with no autocorrelation at that lag. In the left plot (p = 1), the bar at lag 1 sits far outside the band. In the right plot (p = 3), it sits inside.

Let's put numbers on this for all four equations. The table gives the lag 1 autocorrelation of each residual series for p = 1, 2 and 3, and the band for each fit.

```r
# Read the lag 1 residual autocorrelation of every equation for p = 1, 2 and 3
lag1_acf <- function(fit) {
  apply(residuals(fit), 2, function(r) acf(r, plot = FALSE)$acf[2])
}

lag1 <- t(sapply(fits, lag1_acf))
rownames(lag1) <- paste0("p = ", 1:3)
round(lag1, 2)
#>          e  prod    rw     U
#> p = 1  0.58  0.17 -0.03  0.51
#> p = 2  0.21 -0.02  0.01  0.07
#> p = 3 -0.05 -0.03 -0.06 -0.07

n_res <- sapply(fits, function(fit) nrow(residuals(fit)))
round(2 / sqrt(n_res), 2)
#> [1] 0.22 0.22 0.22
```

At p = 1, employment (0.58) and unemployment (0.51) are more than twice the band of 0.22, while productivity (0.17) and the real wage (-0.03) are inside it. At p = 2 all four are inside, with employment at 0.21 just under the limit. At p = 3 every one of them is within 0.07 of zero.

Now let's read the R-squared of each p = 1 equation.

```r
# Read the R-squared of each VAR(1) equation
round(sapply(fits[[1]]$varresult, function(eq) summary(eq)$r.squared), 4)
#>      e   prod     rw      U
#> 0.9975 0.9754 0.9989 0.9557
```

All four are above 0.95. So the p = 1 equations reproduce the levels of the series very closely, and two of their residual series are still autocorrelated.

[KEY INSIGHT]
Autocorrelation left in the residuals of a fitted VAR is a sign that p is too small. A high R-squared does not rule it out.

=== step === widget
## What autocorrelated errors do to a confidence interval

Residual autocorrelation does more than signal missing lags. When it is positive, as it is here, it also makes the standard errors too small, so the confidence intervals that come with the coefficients are too narrow.

To see how much, the widget uses a plain regression of a series on a time trend, with 60 points. The errors are autocorrelated: each one is phi times the previous error plus new noise, so phi is the correlation between neighbouring errors. At every value of phi the widget simulates 2,000 studies and reports two numbers. **Coverage** is the share of studies whose 95% interval contains the true slope, and R-squared is the fit.

The widget has its own built-in data, not the Canada series. But phi plays the role of the lag 1 residual autocorrelation we just measured, so the dial starts at phi = 0.55, between the 0.51 and 0.58 we found at p = 1.

::widget assumption-dial {"assumption": "autocorrelation", "start": 6}

Read the widget at three settings. At phi = 0, the interval covers the true slope in about 95% of the 2,000 studies, which is the coverage a 95% interval is built to have, and R-squared is about 0.50. Drag the dial to phi = 0.55 and the coverage drops to about 72%, while R-squared rises to about 0.52. At phi = 0.92, the coverage is about 32% and R-squared is about 0.64.

So as the errors become more autocorrelated, the 95% interval loses its 95%, and R-squared does not fall. It rises. The interval is too narrow because 60 autocorrelated errors carry less information than 60 independent ones, and the usual standard error formula assumes 60 independent errors.

The R block under the widget runs the same experiment, so you can change `sev` and see the coverage and R-squared for yourself.

[KEY INSIGHT]
R-squared cannot detect autocorrelated errors, because it can stay the same or rise while the interval fails. The only way to see them is to look at the residuals.

=== step === concept
## What too many lags cost

More lags are not the fix for everything. Each lag adds 4 coefficients to every equation, and all of them are estimated from the same 84 quarters. A lag also needs earlier rows to look back on, so a VAR(p) can only use 84 - p rows.

Divide the rows by the coefficients in one equation and you get the observations per coefficient. It is 13.8 at p = 1, 8.2 at p = 2 and 5.8 at p = 3. At p = 8 an equation has 34 coefficients and 76 rows, which leaves only 2.2 observations for each coefficient.

With so few observations per coefficient, each coefficient is estimated imprecisely, and the equations begin to fit the noise in the sample instead of the pattern. The cost shows up as forecast error on data the fit has not seen.

To measure it, the block below fits the VAR on 1980Q1 to 1990Q4 and forecasts unemployment one quarter ahead. Then it adds the next quarter to the training data, refits and forecasts again, so the training window expands by one quarter each time. That gives 40 one-step forecasts, for 1991Q1 to 2000Q4, and the block repeats it for p = 1 to 6. It fits 240 small VARs, so give it a moment.

```r
# Forecast unemployment one quarter ahead from 40 origins and compare VAR orders 1 to 6
first_end <- 1990.75                     # the first fit uses 1980Q1 to 1990Q4
n_origins <- 40                          # forecasts for 1991Q1 to 2000Q4
u_actual  <- Canada[45:84, "U"]

rmse_for_p <- function(p) {
  errors <- numeric(n_origins)
  for (i in 1:n_origins) {
    train <- window(Canada, end = first_end + (i - 1) / 4)
    fit   <- VAR(train, p = p, type = "both")
    pred  <- predict(fit, n.ahead = 1)$fcst$U[1, "fcst"]
    errors[i] <- u_actual[i] - pred
  }
  sqrt(mean(errors^2))
}

orders <- 1:6
n_coef <- 4 * orders + 2                 # coefficients per equation
n_obs  <- 84 - orders                    # rows each order can use on the full sample

data.frame(p = orders,
           coefficients = n_coef,
           observations = n_obs,
           obs_per_coef = round(n_obs / n_coef, 1),
           rmse         = round(sapply(orders, rmse_for_p), 3))
#>   p coefficients observations obs_per_coef  rmse
#> 1 1            6           83         13.8 0.405
#> 2 2           10           82          8.2 0.378
#> 3 3           14           81          5.8 0.397
#> 4 4           18           80          4.4 0.427
#> 5 5           22           79          3.6 0.487
#> 6 6           26           78          3.0 0.561

round((84 - 8) / (4 * 8 + 2), 1)         # observations per coefficient at p = 8
#> [1] 2.2
```

RMSE is the root mean squared error of the 40 forecasts, in percentage points of unemployment. It is 0.405 at p = 1, 0.378 at p = 2 and 0.397 at p = 3, and on 40 forecasts those three differ by little. From p = 4 the error climbs: 0.427, 0.487, and 0.561 at p = 6.

So extra lags stop helping after the first few and then make the forecasts worse, while the observations per coefficient keep falling. The first fits use only 44 quarters, so early in the loop the ratio is lower than the table shows.

=== step === quiz
## Quick check: does a high R-squared show the lag order is enough?

The VAR(1) equations have R-squared of 0.9975, 0.9754, 0.9989 and 0.9557, and the lag 1 autocorrelation of the `U` residuals is 0.51. An analyst says the high R-squared shows that one lag is enough. Which reply is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The analyst is right. An R-squared this close to 1 means the equations leave nothing in the residuals. ::no
- The analyst is wrong. R-squared stays high or rises when errors are autocorrelated, and autocorrelated errors of this size leave the 95% intervals too narrow, as the dial showed at phi = 0.55. ::ok Yes. The 0.51 in the `U` residuals is the evidence that p = 1 is not enough, and no R-squared can replace a look at the residuals. In the dial, coverage fell to about 72% while R-squared rose.
- The analyst is wrong, because autocorrelated errors make the 95% intervals cover more than 95% of the time. The intervals are safe and just wasteful. ::no
- The analyst is right, and the largest order is the safest choice, because adding lags cannot make the fit worse. ::no R-squared measures how closely the equations reproduce the levels of the series. It cannot show that the errors are free of autocorrelation: in the dial, R-squared rose from about 0.50 to about 0.52 while coverage fell from 95% to 72%. And it cannot show that more lags are safer. Adding lags cannot make the in-sample fit worse, yet the forecast RMSE rose to 0.561 at p = 6, and p = 8 leaves 2.2 observations per coefficient. The residual autocorrelation, 0.51 for `U` at p = 1, is what shows p = 1 is not enough.

=== step === concept
## How an information criterion scores a lag order

So far there are two ways to get p wrong and no rule for getting it right. An information criterion is such a rule. It gives every order a score made of two parts: how well the equations fit, and a penalty for how many coefficients they use. The order with the smallest score is selected.

The fit part is the determinant of the residual covariance matrix. That matrix is 4 x 4, with the variance of each residual series on the diagonal and the covariances between the series off it. Its determinant is called the generalized variance: one number for the overall spread of the residuals, which is smaller when the equations fit more tightly. The criteria use its natural log, written ln det.

Adding lags cannot make the fit worse in the sample, so ln det falls at every order. On its own it would always select the largest order. The penalty is what stops that.

Here is the score, with p the lag order and T the number of quarters the fit uses.

\[ \mathrm{score}(p) = \ln\det\hat{\Sigma}(p) + c \cdot \frac{16p + 8}{T} \]

\(\hat{\Sigma}(p)\) is the residual covariance matrix of the VAR(p). The count 16p + 8 is the total number of coefficients from before, 4(4p + 2). And c is the price charged per coefficient. The three criteria differ only in c:

- AIC, the Akaike criterion: c = 2.
- HQ, the Hannan-Quinn criterion: c = 2 ln ln T, which is 2.93 for T = 76.
- SC, the Schwarz criterion (also called BIC): c = ln T, which is 4.33 for T = 76.

To compare orders fairly, every order has to be fitted on the same rows. The largest order, p = 8, loses the first 8 quarters, so all eight fits use 1982Q1 to 2000Q4. That is T = 76.

The function below scores one order by hand, and the last lines run it for p = 1 to 8.

```r
# Compute ln det, AIC, HQ and SC by hand for VAR orders 1 to 8 on one common sample
T_obs <- 76                              # 1982Q1 to 2000Q4, the same rows for every order
Y     <- Canada[9:84, ]

score_order <- function(p) {
  lagged <- lapply(1:p, function(j) Canada[(9 - j):(84 - j), ])
  X      <- cbind(do.call(cbind, lagged), trend = 9:84)
  res    <- residuals(lm(Y ~ X))         # lm adds the constant
  ln_det <- log(det(crossprod(res) / T_obs))
  n_par  <- 4 * (4 * p + 2)              # coefficients over all four equations
  c(ln_det = ln_det,
    AIC = ln_det + 2 * n_par / T_obs,
    HQ  = ln_det + 2 * log(log(T_obs)) * n_par / T_obs,
    SC  = ln_det + log(T_obs) * n_par / T_obs)
}

hand <- t(sapply(1:8, score_order))
rownames(hand) <- paste0("p = ", 1:8)
round(hand, 4)
#>        ln_det     AIC      HQ      SC
#> p = 1 -6.9042 -6.2726 -5.9784 -5.5366
#> p = 2 -7.6893 -6.6367 -6.1464 -5.4100
#> p = 3 -8.2449 -6.7712 -6.0848 -5.0538
#> p = 4 -8.5293 -6.6346 -5.7522 -4.4265
#> p = 5 -8.7139 -6.3981 -5.3196 -3.6994
#> p = 6 -9.0445 -6.3077 -5.0331 -3.1183
#> p = 7 -9.2286 -6.0707 -4.6000 -2.3906
#> p = 8 -9.6405 -6.0616 -4.3947 -1.8908
```

`Y` holds the four series for those 76 quarters. Inside the function, `lagged` shifts the series back j quarters for j = 1 to p, so that row i of every shifted matrix lines up with row i of `Y`. Then `lm()` regresses all four series on those lags and the trend. `crossprod(res)` sums the residual cross-products, and dividing by T gives the residual covariance matrix.

Read the `ln_det` column first. It starts at -6.9042 for p = 1 and falls at every order down to -9.6405 at p = 8, so on its own it would select p = 8. The AIC column behaves differently: it falls to -6.7712 at p = 3 and then rises again.

Check one AIC score by hand. At p = 3 there are 4 x 14 = 56 coefficients, so the penalty is 2 x 56 / 76 = 1.4737, and -8.2449 + 1.4737 = -6.7712.

[KEY INSIGHT]
An information criterion is a fit term plus a price per coefficient. AIC, HQ and SC use the same fit term and differ only in the price.

=== step === concept
## How to read the four criteria in VARselect

You would not compute these by hand for every model. `VARselect()` scores every order up to `lag.max` and reports four criteria. The first three are the ones we just computed. The fourth, FPE (final prediction error), multiplies the determinant by a factor that grows with the number of coefficients, so it charges for them too.

The block runs `VARselect()` on the same data, prints the order each criterion selects and its scores, and compares three of its columns with the hand scores from the previous block.

```r
# Run VARselect and check that it reproduces the scores computed by hand
vs <- VARselect(Canada, lag.max = 8, type = "both")
vs$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n)
#>      3      2      1      3

round(t(vs$criteria), 4)
#>    AIC(n)   HQ(n)   SC(n) FPE(n)
#> 1 -6.2726 -5.9784 -5.5366 0.0019
#> 2 -6.6367 -6.1464 -5.4100 0.0013
#> 3 -6.7712 -6.0848 -5.0538 0.0012
#> 4 -6.6346 -5.7522 -4.4265 0.0014
#> 5 -6.3981 -5.3196 -3.6994 0.0018
#> 6 -6.3077 -5.0331 -3.1183 0.0020
#> 7 -6.0707 -4.6000 -2.3906 0.0028
#> 8 -6.0616 -4.3947 -1.8908 0.0031

by_varselect <- t(vs$criteria)[, 1:3]    # the AIC, HQ and SC columns
max_gap <- max(abs(by_varselect - hand[, c("AIC", "HQ", "SC")]))
max_gap < 1e-9
#> [1] TRUE
```

`$selection` names the order each criterion selects: AIC 3, HQ 2, SC 1 and FPE 3. `$criteria` holds the scores, and `t()` turns them so each row is one order. The last three lines show that the largest gap between the `VARselect()` scores and our hand scores is below 1e-9, so they are the same numbers computed two ways.

The table below sets the same scores side by side. Read down each column to its smallest value: AIC is smallest at p = 3 (-6.771), HQ at p = 2 (-6.146) and SC at p = 1 (-5.537).

::widget styled-table {"cols":["lag","AIC","HQ","SC","FPE"],"rows":[[1,"-6.273","-5.978","-5.537","0.00189"],[2,"-6.637","-6.146","-5.410","0.00132"],[3,"-6.771","-6.085","-5.054","0.00117"],[4,"-6.635","-5.752","-4.427","0.00136"],[5,"-6.398","-5.320","-3.699","0.00178"],[6,"-6.308","-5.033","-3.118","0.00204"],[7,"-6.071","-4.600","-2.391","0.00277"],[8,"-6.062","-4.395","-1.891","0.00306"],["selected",3,2,1,3]],"formats":{},"title":"Information criteria for VAR orders 1 to 8","note":"The smallest value in each column marks the order that criterion selects."}

One data set gives three different orders: 3, 2 and 1.

=== step === concept
## Why do AIC, HQ and SC select different lag orders?

The three criteria share the fit term, ln det. They differ only in c, the price per coefficient. One more lag adds 16 coefficients to the system, 4 in each equation, so a criterion charges 16c / T for it.

A lag lowers the score when the fall in ln det is bigger than that penalty. The block computes the three penalties for T = 76, then the fall in ln det from each added lag, and asks for each criterion whether that lag lowers its score.

```r
# Compare the fall in ln det from each added lag with the penalty each criterion charges
T_obs   <- 76
penalty <- 16 * c(AIC = 2, HQ = 2 * log(log(T_obs)), SC = log(T_obs)) / T_obs
round(penalty, 3)
#>   AIC    HQ    SC
#> 0.421 0.617 0.912

fall <- unname(-diff(hand[, "ln_det"]))  # fall in ln det from p - 1 to p, for p = 2 to 8

data.frame(p = 2:8,
           fall = round(fall, 3),
           lowers_AIC = ifelse(fall > penalty["AIC"], "yes", "no"),
           lowers_HQ  = ifelse(fall > penalty["HQ"], "yes", "no"),
           lowers_SC  = ifelse(fall > penalty["SC"], "yes", "no"))
#>   p  fall lowers_AIC lowers_HQ lowers_SC
#> 1 2 0.785        yes       yes        no
#> 2 3 0.556        yes        no        no
#> 3 4 0.284         no        no        no
#> 4 5 0.185         no        no        no
#> 5 6 0.331         no        no        no
#> 6 7 0.184         no        no        no
#> 7 8 0.412         no        no        no
```

Here is how each criterion reads that table.

- AIC charges 0.421 per added lag. The falls from lag 2 (0.785) and lag 3 (0.556) are above it, so both lags lower the AIC. The fall from lag 4 is 0.284, below the price, and the falls from lags 5 to 8 (0.184 to 0.412) stay below it as well. So AIC is smallest at p = 3.
- HQ charges 0.617. Lag 2 pays for itself (0.785) but lag 3 does not (0.556), so HQ selects 2.
- SC charges 0.912. Even lag 2 falls short (0.785), so SC selects 1.

The higher the price, the smaller the selected order. In large samples SC and HQ are consistent, which means they select the true order, if there is one, with a probability that goes to 1. AIC and FPE are not consistent, and they can keep selecting an order that is too large.

When there are at least 16 observations, the SC order is never above the HQ order, and the HQ order is never above the AIC order. That is the 1, 2, 3 we have here.

So the three orders are candidates, not answers. Which one leaves residuals without autocorrelation is a separate check.

=== step === concept
## How to settle the lag order with a serial correlation test

A criterion ranks orders by fit and cost. It never looks at whether the residuals of an order are still autocorrelated. A serial correlation test does. Serial correlation is another name for the autocorrelation we read off the residuals earlier, and the test gives a p-value we can read against the usual 5% level.

The Edgerton-Shukur test (ES) has the null hypothesis that there is no residual serial correlation up to lag h. It regresses the residuals on the original regressors plus h lagged residuals, and tests with an F test whether those lagged residuals add anything, with a correction for small samples. A small p-value rejects the null: the residuals are still autocorrelated, so the order is too small.

The lagged residuals in that regression come from all four equations. So the test can reject even when no single lag 1 autocorrelation in the earlier table crossed its band.

The block runs the ES test on the residuals of VAR(1) to VAR(5), for h = 1 to 5, and stores the 25 p-values in a matrix with p in the rows and h in the columns.

```r
# Run the Edgerton-Shukur test on the residuals of VAR(1) to VAR(5) at test lags 1 to 5
es_grid <- matrix(NA, nrow = 5, ncol = 5, dimnames = list(p = 1:5, h = 1:5))

for (p in 1:5) {
  fit <- VAR(Canada, p = p, type = "both")
  for (h in 1:5) {
    es_grid[p, h] <- serial.test(fit, lags.bg = h, type = "ES")$serial$p.value
  }
}

round(es_grid, 4)
#>    h
#> p        1      2      3      4      5
#>   1 0.0000 0.0000 0.0000 0.0002 0.0008
#>   2 0.0013 0.0038 0.0280 0.0820 0.1570
#>   3 0.4025 0.6877 0.3873 0.4851 0.5072
#>   4 0.7262 0.3506 0.3574 0.3152 0.1052
#>   5 0.3724 0.5651 0.3066 0.3463 0.0708
```

Read one row at a time.

- At p = 1, every p-value is below 0.001. The null is rejected at every h.
- At p = 2, the null is rejected at h = 1, 2 and 3 (0.0013, 0.0038, 0.028) and not at h = 4 and 5 (0.082, 0.157).
- At p = 3, it is rejected at no h. The p-values run from 0.387 to 0.688.

The rule is to take the smallest order whose residuals pass at every tested lag. That is p = 3, which is also the order AIC and FPE selected. Orders 4 and 5 pass as well, but they add coefficients the residuals do not need.

`serial.test()` offers another check, the asymptotic portmanteau test. It adds up the autocorrelations of all four residual series over 16 lags and compares the total with a chi-squared distribution. Here it runs on the p = 1 fit, which we know has autocorrelation at lag 1.

```r
# Run the asymptotic portmanteau test on the VAR(1) residuals
fit1 <- VAR(Canada, p = 1, type = "both")
portmanteau <- serial.test(fit1, lags.pt = 16, type = "PT.asymptotic")$serial

round(unname(portmanteau$p.value), 3)
#> [1] 0.606

portmanteau$parameter
#>  df
#> 240
```

The p-value is 0.606, on 240 degrees of freedom, so this test does not reject a VAR(1) whose residuals the ES test rejects at every h. It pools 16 lags into one total and compares it with 240 degrees of freedom, so autocorrelation that sits mostly at lag 1 has little effect on it. That is why the test at several small values of h is the more useful check here.

[KEY INSIGHT]
A criterion ranks orders. It does not check whether an order is enough. The residual test does, and it settles p = 3.

=== step === tryit
## Your turn: which order does the two-series system need?

Take a smaller system, `y2`, that holds only employment `e` and unemployment `U`. Read the orders VARselect selects for it, fit a VAR at the SC order and one at the AIC order, and run the Edgerton-Shukur test on each with 4 test lags. The function is `serial.test()`, and its `lags.bg` argument sets the number of residual lags tested. Then decide which order to keep.

```r
# Choose the order for the two-series system of employment and unemployment.
# 1. Run the order selection on y2 with lags up to 8 and a constant and trend,
#    then read the SC order and the AIC order from the result.
# 2. Fit a VAR at each of those two orders.
# 3. Run the Edgerton-Shukur test on each fit with 4 test lags and compare the p-values.
y2 <- Canada[, c("e", "U")]
```
::check {"regex": "(?=[\\s\\S]*VARselect[(]y2)(?=[\\s\\S]*lags[.]bg\\s*=\\s*4)(?=[\\s\\S]*type\\s*=\\s*.ES)(?=[\\s\\S]*\\bVAR[(])(?=[\\s\\S]*serial[.]test[(])", "gate": true, "difficulty": "intermediate", "ok": "Right: SC selects 2 and AIC selects 3, the test rejects the order of 2 (p-value 0.0368) and passes the order of 3 (0.6127), so keep 3. The residuals, not the criterion, made the decision.", "no": "Start with `VARselect(y2, lag.max = 8, type = \"both\")` and read the selection it returns. Then fit `VAR(y2, p = ..., type = \"both\")` at the SC order and at the AIC order, and call `serial.test(fit, lags.bg = 4, type = \"ES\")` on each fit."}
::solution
```r
# Select, fit and test the two candidate orders for the two-series system
y2  <- Canada[, c("e", "U")]
vs2 <- VARselect(y2, lag.max = 8, type = "both")
vs2$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n)
#>      3      3      2      3

fit2 <- VAR(y2, p = 2, type = "both")    # the SC order
fit3 <- VAR(y2, p = 3, type = "both")    # the AIC, HQ and FPE order

round(serial.test(fit2, lags.bg = 4, type = "ES")$serial$p.value, 4)
#> [1] 0.0368
round(serial.test(fit3, lags.bg = 4, type = "ES")$serial$p.value, 4)
#> [1] 0.6127
```

For this system SC selects 2, and AIC, HQ and FPE select 3. The ES test at 4 lags rejects the order of 2 (0.0368) and passes the order of 3 (0.6127), so 3 is the order to keep.

=== step === quiz
## Quick check: is the order SC selects enough?

A colleague fits the SC order, p = 1, on the four Canada series and does not test the residuals, because SC is consistent. Which reply is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- SC is not valid for a VAR, so its order should never be used. ::no
- Consistency is a large-sample property. SC charges the highest price per added lag (0.912), so in 76 quarters it gives the smallest order, and the ES test rejects p = 1 at every test lag from 1 to 5. ::ok Yes. The same happened in the two-series system: SC gave 2, and the ES test rejected it (0.0368) while it passed the order of 3. The criterion supplies a candidate, and the residual test decides whether the candidate is enough.
- SC tends to select too many lags, so p = 1 is a safe minimum. ::no
- The test only matters when AIC and SC disagree. ::no SC is a valid criterion for a VAR, and it does not select too many lags: its price of 0.912 per added lag makes it select the smallest of the three orders. Consistency is a statement about very large samples, and here the residuals decide. The ES test rejects p = 1 at every h, with p-values below 0.001, and in the two-series system it rejects the SC order of 2 (0.0368). The test matters whichever criterion supplied the order.

=== step === concept
## References
::prose-only a list of sources, nothing to draw

- [New Introduction to Multiple Time Series Analysis](https://doi.org/10.1007/978-3-540-27752-1) - Lütkepohl (2005), Springer. Chapter 4 covers order selection and checking the residuals of a VAR.
- [VAR, SVAR and SVEC Models: Implementation Within R Package vars](https://doi.org/10.18637/jss.v027.i04) - Pfaff (2008), Journal of Statistical Software 27(4). The vars package used in this lesson, with `VARselect()` and `serial.test()`.
- Testing autocorrelation in a system perspective - Edgerton and Shukur (1999), Econometric Reviews 18(4), 343-386. The small-sample corrected test behind `serial.test(type = "ES")`.
- The determination of the order of an autoregression - Hannan and Quinn (1979), Journal of the Royal Statistical Society B 41(2), 190-195. The source of the HQ criterion.
- [The vars package on CRAN](https://cran.r-project.org/package=vars) - the documentation for `VARselect()` and `serial.test()`.

=== step === complete
## Quick recap

You chose the lag order of a VAR on four Canadian series, and you saw why each way of getting it wrong shows up in a different place. To summarize:

- The lag order p is the number of past quarters of all four series in each equation. Each added lag adds 4 coefficients to every equation, 16 to the system.
- Too few lags leave residual autocorrelation: 0.58 for employment and 0.51 for unemployment at p = 1. R-squared does not detect it, and the 95% interval covers only about 72% of the time at phi = 0.55.
- Too many lags leave fewer observations per coefficient and raise forecast error: the unemployment RMSE goes from 0.378 at p = 2 to 0.561 at p = 6.
- An information criterion is ln det plus a price per coefficient. AIC, HQ and SC charge 0.421, 0.617 and 0.912 per added lag, and select 3, 2 and 1.
- The Edgerton-Shukur test rejects p = 1 and p = 2 and rejects nothing at p = 3. So the workflow is to take the candidates from `VARselect()`, then keep the smallest order whose residuals pass.

The next part covers Granger causality, which asks whether one series improves the forecast of another.
