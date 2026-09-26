---
title: "Multivariate Time Series Lesson 1: Fitting a vector autoregression (VAR) to two related series"
slug: "Vector-Autoregression-VAR"
description: "Fit a VAR(2) to Canadian employment and unemployment in R, interpret its coefficient block, and test whether each series improves the forecast of the other."
keywords: "vector autoregression, VAR model in R, VAR(2), multivariate time series, cross-lag coefficients, rolling forecast, vars package, Canada unemployment"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-multivariate"
course_title: "Multivariate Time Series"
course_lesson: "1"
course_total: "6"
course_landing: "Multivariate-Time-Series-Course.html"
course_prev: ""
course_next: "Choosing-the-Lag-Order.html"
curriculum_id: "5.110.1"
lesson_access: "pro"
catalog_blurb: "Forecast two related series together, and check whether each one helps predict the other."
---

=== step === cover
## Fitting a vector autoregression (VAR) to two related series

Today let's learn how to forecast two related series together, using a model called a vector autoregression.

Let's say you follow the Canadian economy. For every quarter from 1980Q1 to 2000Q4 you have two numbers: the unemployment rate in percent, called U, and an employment index called e. That is 84 quarters of each.

The index e is 100 times the natural log of employment, and it climbs from 929.6 to 961.8 over these years. U starts at 7.53% in 1980Q1, peaks at 12.77% in 1982Q4 and ends at 6.87% in 2000Q4.

Now, you want to forecast U. The usual approach is to use the past of U itself. But employment moves at the same time as unemployment. So here is the question for this lesson: does the past of e add anything to a forecast of U, beyond what U's own past already gives?

::widget chart-plotter {"geoms":["line"],"x":"quarter","y":"unemployment_rate","data":[{"x":1980,"y":7.53},{"x":1980.25,"y":7.7},{"x":1980.5,"y":7.47},{"x":1980.75,"y":7.27},{"x":1981,"y":7.37},{"x":1981.25,"y":7.13},{"x":1981.5,"y":7.4},{"x":1981.75,"y":8.33},{"x":1982,"y":8.83},{"x":1982.25,"y":10.43},{"x":1982.5,"y":12.2},{"x":1982.75,"y":12.77},{"x":1983,"y":12.43},{"x":1983.25,"y":12.23},{"x":1983.5,"y":11.7},{"x":1983.75,"y":11.2},{"x":1984,"y":11.27},{"x":1984.25,"y":11.47},{"x":1984.5,"y":11.3},{"x":1984.75,"y":11.17},{"x":1985,"y":11},{"x":1985.25,"y":10.63},{"x":1985.5,"y":10.27},{"x":1985.75,"y":10.2},{"x":1986,"y":9.67},{"x":1986.25,"y":9.6},{"x":1986.5,"y":9.6},{"x":1986.75,"y":9.5},{"x":1987,"y":9.5},{"x":1987.25,"y":9.03},{"x":1987.5,"y":8.7},{"x":1987.75,"y":8.13},{"x":1988,"y":7.87},{"x":1988.25,"y":7.67},{"x":1988.5,"y":7.8},{"x":1988.75,"y":7.73},{"x":1989,"y":7.57},{"x":1989.25,"y":7.57},{"x":1989.5,"y":7.33},{"x":1989.75,"y":7.57},{"x":1990,"y":7.63},{"x":1990.25,"y":7.6},{"x":1990.5,"y":8.17},{"x":1990.75,"y":9.2},{"x":1991,"y":10.17},{"x":1991.25,"y":10.33},{"x":1991.5,"y":10.4},{"x":1991.75,"y":10.37},{"x":1992,"y":10.6},{"x":1992.25,"y":11},{"x":1992.5,"y":11.4},{"x":1992.75,"y":11.73},{"x":1993,"y":11.07},{"x":1993.25,"y":11.67},{"x":1993.5,"y":11.47},{"x":1993.75,"y":11.3},{"x":1994,"y":10.97},{"x":1994.25,"y":10.63},{"x":1994.5,"y":10.1},{"x":1994.75,"y":9.67},{"x":1995,"y":9.53},{"x":1995.25,"y":9.47},{"x":1995.5,"y":9.5},{"x":1995.75,"y":9.27},{"x":1996,"y":9.5},{"x":1996.25,"y":9.43},{"x":1996.5,"y":9.7},{"x":1996.75,"y":9.9},{"x":1997,"y":9.43},{"x":1997.25,"y":9.3},{"x":1997.5,"y":8.87},{"x":1997.75,"y":8.77},{"x":1998,"y":8.6},{"x":1998.25,"y":8.33},{"x":1998.5,"y":8.17},{"x":1998.75,"y":8.03},{"x":1999,"y":7.9},{"x":1999.25,"y":7.87},{"x":1999.5,"y":7.53},{"x":1999.75,"y":6.93},{"x":2000,"y":6.8},{"x":2000.25,"y":6.7},{"x":2000.5,"y":6.93},{"x":2000.75,"y":6.87}]}

The line above is U, quarter by quarter, from 7.53 in 1980Q1 through the peak of 12.77 in 1982Q4 to 6.87 in 2000Q4. This is the series we will forecast, first on its own and then with help from e.

=== step === concept
## How to predict a series from its own past with an AR(2)

Before adding employment, let's build the simplest forecast of U: one that uses only U's own past. The code below loads the Canada data from the `vars` package, keeps the two series and plots them.

```r
# Load the Canada data and plot employment and unemployment over time
library(vars)
data(Canada)
y <- Canada[, c("e", "U")]
plot(y, main = "Canada, 1980Q1 to 2000Q4")
dim(y)
#> [1] 84  2
start(y)
#> [1] 1980    1
end(y)
#> [1] 2000    4
```

`plot()` draws one panel per series, with e on top and U below. The output confirms 84 rows, from the first quarter of 1980 to the fourth quarter of 2000.

To forecast U from its own past we need its lags. A lag is the same series shifted back in time. The lag 1 of U is U one quarter earlier, and the lag 2 is U two quarters earlier.

Regressing a series on its own lags is called an autoregression, and the number of lags it uses is its order. So an AR(2) predicts U this quarter from a constant, U one quarter back and U two quarters back.

The first two quarters do not have both lags, so 2 rows are lost and 84 - 2 = 82 rows are usable. The code below builds the lag columns for both series into a data frame called `L`, then fits one AR(2) per series with `lm()`. Each row of `L` is one quarter from 1980Q3 on: `e` and `U` are that quarter, `U.l1` and `U.l2` are U one and two quarters earlier, and `e.l1` and `e.l2` are the same for e.

```r
# Build the lag columns and fit an AR(2) to each series on its own
n <- nrow(y)
L <- data.frame(
  e    = y[3:n, "e"],
  U    = y[3:n, "U"],
  e.l1 = y[2:(n - 1), "e"],
  U.l1 = y[2:(n - 1), "U"],
  e.l2 = y[1:(n - 2), "e"],
  U.l2 = y[1:(n - 2), "U"]
)
nrow(L)
#> [1] 82

ar_U <- lm(U ~ U.l1 + U.l2, data = L)
ar_e <- lm(e ~ e.l1 + e.l2, data = L)

round(coef(ar_U), 3)
#> (Intercept)        U.l1        U.l2
#>       0.515       1.542      -0.597
round(coef(ar_e), 3)
#> (Intercept)        e.l1        e.l2
#>       1.567       1.727      -0.729
round(c(U = summary(ar_U)$sigma, e = summary(ar_e)$sigma), 3)
#>     U     e
#> 0.354 0.410
```

The U fit predicts U this quarter as 0.515, plus 1.542 times last quarter's U, minus 0.597 times U from two quarters back. The e fit has the same form, with its own three coefficients.

The last line prints the residual standard error of each fit. It is the typical size of a residual, the gap between an actual quarter and its fitted value. It is in the units of the series: 0.354 for U and 0.410 for e. We will keep these two numbers as the baseline.

Each fit uses only its own series. The U fit has no e term in it, and the e fit has no U term.

=== step === widget
## How does last quarter's change in employment relate to the change in unemployment?

The AR(2) fits leave out the lags of the other series. To see whether that could matter, let's compare U with last quarter's employment.

Employment trends upward through the sample, from 929.6 in 1980Q1 to 961.8 in 2000Q4. So a correlation between the levels of e and U would reflect that trend, not quarter-to-quarter movement. To look at that movement we use changes.

Last quarter's change in e is e(t-1) minus e(t-2), and this quarter's change in U is U(t) minus U(t-1). One unit of e is about 1% employment growth, because e is 100 times a natural log.

The chart below plots the 82 pairs: last quarter's change in e on the x axis, this quarter's change in U on the y axis.

::widget chart-plotter {"geoms":["point","histogram"],"x":"employment_change_last_quarter","y":"unemployment_change","data":[{"x":0.193,"y":-0.23},{"x":0.514,"y":-0.2},{"x":1.109,"y":0.1},{"x":1.234,"y":-0.24},{"x":0.889,"y":0.27},{"x":-0.019,"y":0.93},{"x":-0.455,"y":0.5},{"x":-0.953,"y":1.6},{"x":-1.488,"y":1.77},{"x":-1.539,"y":0.57},{"x":-0.534,"y":-0.34},{"x":0.506,"y":-0.2},{"x":1.196,"y":-0.53},{"x":1.412,"y":-0.5},{"x":0.462,"y":0.07},{"x":0.138,"y":0.2},{"x":0.556,"y":-0.17},{"x":0.901,"y":-0.13},{"x":0.444,"y":-0.17},{"x":0.416,"y":-0.37},{"x":1.014,"y":-0.36},{"x":0.904,"y":-0.07},{"x":0.909,"y":-0.53},{"x":0.996,"y":-0.07},{"x":0.583,"y":0},{"x":0.236,"y":-0.1},{"x":0.444,"y":0},{"x":0.57,"y":-0.47},{"x":1.186,"y":-0.33},{"x":0.862,"y":-0.57},{"x":1.234,"y":-0.26},{"x":0.817,"y":-0.2},{"x":0.473,"y":0.13},{"x":0.246,"y":-0.07},{"x":0.74,"y":-0.16},{"x":1.063,"y":0},{"x":0.007,"y":-0.24},{"x":0.373,"y":0.24},{"x":0.402,"y":0.06},{"x":0.533,"y":-0.03},{"x":0.165,"y":0.57},{"x":-0.317,"y":1.03},{"x":-0.926,"y":0.97},{"x":-1.027,"y":0.16},{"x":0.104,"y":0.07},{"x":0.042,"y":-0.03},{"x":-0.228,"y":0.23},{"x":-0.48,"y":0.4},{"x":-0.167,"y":0.4},{"x":-0.06,"y":0.33},{"x":0.109,"y":-0.66},{"x":0.505,"y":0.6},{"x":-0.002,"y":-0.2},{"x":0.416,"y":-0.17},{"x":0.261,"y":-0.33},{"x":0.2,"y":-0.34},{"x":0.848,"y":-0.53},{"x":0.994,"y":-0.43},{"x":0.777,"y":-0.14},{"x":0.549,"y":-0.06},{"x":-0.154,"y":0.03},{"x":0.159,"y":-0.23},{"x":0.297,"y":0.23},{"x":0.288,"y":-0.07},{"x":0.249,"y":0.27},{"x":0.082,"y":0.2},{"x":0.059,"y":-0.47},{"x":0.918,"y":-0.13},{"x":0.755,"y":-0.43},{"x":0.997,"y":-0.1},{"x":0.546,"y":-0.17},{"x":0.399,"y":-0.27},{"x":0.721,"y":-0.16},{"x":0.793,"y":-0.14},{"x":0.741,"y":-0.13},{"x":0.59,"y":-0.03},{"x":0.677,"y":-0.34},{"x":0.653,"y":-0.6},{"x":0.772,"y":-0.13},{"x":0.874,"y":-0.1},{"x":0.421,"y":0.23},{"x":0.246,"y":-0.06}],"code":{"point":"ggplot(df, aes(employment_change_last_quarter, unemployment_change)) +\n  geom_point() +\n  geom_smooth(method = \"lm\", se = FALSE)"}}

The chart shows r = -0.66, where r is the correlation between the two changes. A negative r means that when e rose more than usual last quarter, U tended to fall this quarter. The histogram button shows how last quarter's changes in e are spread.

How does that compare with what U's own past offers? The code below builds a data frame `D` of four changes. `dU` and `de` are this quarter's changes in U and e, and `dU.l1` and `de.l1` are the same changes one quarter earlier. It then correlates this quarter's change in U with the previous change in e and with the previous change in U.

```r
# Turn the lag frame into quarter-to-quarter changes, then correlate them
D <- data.frame(
  dU    = L$U - L$U.l1,
  de    = L$e - L$e.l1,
  dU.l1 = L$U.l1 - L$U.l2,
  de.l1 = L$e.l1 - L$e.l2
)

round(c(other_series = cor(D$de.l1, D$dU),
        own_series   = cor(D$dU.l1, D$dU)), 3)
#> other_series   own_series
#>       -0.660        0.566
```

The correlation with last quarter's change in e is -0.660, and with U's own last change it is 0.566. So the previous change in e tracks the change in U more closely than U's own previous change does.

=== step === widget
## How does last quarter's change in unemployment relate to the change in employment?

Now the other direction: does last quarter's change in U relate to this quarter's change in e? The chart below plots the same 82 quarters the other way around: last quarter's change in U on the x axis, this quarter's change in e on the y axis.

::widget chart-plotter {"geoms":["point","histogram"],"x":"unemployment_change_last_quarter","y":"employment_change","data":[{"x":0.17,"y":0.514},{"x":-0.23,"y":1.109},{"x":-0.2,"y":1.234},{"x":0.1,"y":0.889},{"x":-0.24,"y":-0.019},{"x":0.27,"y":-0.455},{"x":0.93,"y":-0.953},{"x":0.5,"y":-1.488},{"x":1.6,"y":-1.539},{"x":1.77,"y":-0.534},{"x":0.57,"y":0.506},{"x":-0.34,"y":1.196},{"x":-0.2,"y":1.412},{"x":-0.53,"y":0.462},{"x":-0.5,"y":0.138},{"x":0.07,"y":0.556},{"x":0.2,"y":0.901},{"x":-0.17,"y":0.444},{"x":-0.13,"y":0.416},{"x":-0.17,"y":1.014},{"x":-0.37,"y":0.904},{"x":-0.36,"y":0.909},{"x":-0.07,"y":0.996},{"x":-0.53,"y":0.583},{"x":-0.07,"y":0.236},{"x":0,"y":0.444},{"x":-0.1,"y":0.57},{"x":0,"y":1.186},{"x":-0.47,"y":0.862},{"x":-0.33,"y":1.234},{"x":-0.57,"y":0.817},{"x":-0.26,"y":0.473},{"x":-0.2,"y":0.246},{"x":0.13,"y":0.74},{"x":-0.07,"y":1.063},{"x":-0.16,"y":0.007},{"x":0,"y":0.373},{"x":-0.24,"y":0.402},{"x":0.24,"y":0.533},{"x":0.06,"y":0.165},{"x":-0.03,"y":-0.317},{"x":0.57,"y":-0.926},{"x":1.03,"y":-1.027},{"x":0.97,"y":0.104},{"x":0.16,"y":0.042},{"x":0.07,"y":-0.228},{"x":-0.03,"y":-0.48},{"x":0.23,"y":-0.167},{"x":0.4,"y":-0.06},{"x":0.4,"y":0.109},{"x":0.33,"y":0.505},{"x":-0.66,"y":-0.002},{"x":0.6,"y":0.416},{"x":-0.2,"y":0.261},{"x":-0.17,"y":0.2},{"x":-0.33,"y":0.848},{"x":-0.34,"y":0.994},{"x":-0.53,"y":0.777},{"x":-0.43,"y":0.549},{"x":-0.14,"y":-0.154},{"x":-0.06,"y":0.159},{"x":0.03,"y":0.297},{"x":-0.23,"y":0.288},{"x":0.23,"y":0.249},{"x":-0.07,"y":0.082},{"x":0.27,"y":0.059},{"x":0.2,"y":0.918},{"x":-0.47,"y":0.755},{"x":-0.13,"y":0.997},{"x":-0.43,"y":0.546},{"x":-0.1,"y":0.399},{"x":-0.17,"y":0.721},{"x":-0.27,"y":0.793},{"x":-0.16,"y":0.741},{"x":-0.14,"y":0.59},{"x":-0.13,"y":0.677},{"x":-0.03,"y":0.653},{"x":-0.34,"y":0.772},{"x":-0.6,"y":0.874},{"x":-0.13,"y":0.421},{"x":-0.1,"y":0.246},{"x":0.23,"y":0.737}],"code":{"point":"ggplot(df, aes(unemployment_change_last_quarter, employment_change)) +\n  geom_point() +\n  geom_smooth(method = \"lm\", se = FALSE)"}}

The chart shows r = -0.62, which is -0.618 to 3 decimals. The code below prints that correlation next to two more. One is the change in e against its own previous change, and the other is the two changes within the same quarter.

```r
# Correlate the change in e with the previous change in U and with its own previous change
round(c(other_series = cor(D$dU.l1, D$de),
        own_series   = cor(D$de.l1, D$de),
        same_quarter = cor(D$dU.l1, D$de.l1)), 3)
#> other_series   own_series same_quarter
#>       -0.618        0.725       -0.857
```

The change in e correlates -0.618 with U's previous change and 0.725 with e's own previous change. So e's own past is the closer of the two, but both correlations are large. Whether the past of U adds anything once e's own lags are in the equation is a different question, and the coefficients of the fitted VAR show it.

The third number, -0.857, is the correlation between the changes in U and in e within the same quarter. When employment growth is high, unemployment tends to fall in that same quarter. We will need this number again when we interpret the fitted coefficients.

=== step === quiz
## Quick check: what does an AR(2) for unemployment not use?

Think about which series the AR(2) for U has as predictors.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The constant. An AR(2) is fitted without an intercept. ::no
- The past of employment. The AR(2) uses U.l1 and U.l2 only, and it has no e term, although last quarter's change in e correlates -0.66 with the change in U. ::ok Yes. The lags of e are information the AR(2) never uses, and that correlation is the reason to test whether they help. The VAR adds them.
- Anything from employment, because the two lags of U already hold all of it. ::no
- This quarter's employment, which a VAR would add as a third predictor. ::no The AR(2) does include a constant (the 0.515 in the fit), and a forecast can only use quarters that have already happened, so this quarter's e is not available. What the AR(2) leaves out is the lags of the other series. Whether U's own lags make up for that is not something the AR(2) can show, and it is exactly what a VAR tests.

=== step === concept
## A VAR(2) as one regression per series on the lags of every series

The two series move together, so a vector autoregression gives each series its own equation. Every equation has the lags of both series in it. It is called a vector autoregression because, in each quarter, the two values are stacked into one vector, (e, U). The system is a regression of that vector on its own past.

A VAR(p) for k series regresses every series on p lags of all k series, plus a constant. Every series is endogenous: it is explained inside the system, as the outcome of its own equation. None is treated as a fixed input. For our 2 series with 2 lags that gives two equations, one for e and one for U:

\[ e_t = c_1 + a_{11} e_{t-1} + a_{12} U_{t-1} + b_{11} e_{t-2} + b_{12} U_{t-2} + \varepsilon_{1,t} \]

\[ U_t = c_2 + a_{21} e_{t-1} + a_{22} U_{t-1} + b_{21} e_{t-2} + b_{22} U_{t-2} + \varepsilon_{2,t} \]

In a coefficient such as \(a_{12}\), the first subscript says which equation it belongs to (1 is e, 2 is U). The second says which series the lag belongs to. The a's multiply the lag 1 values and the b's the lag 2 values. The error term is written with epsilon because e already names employment.

Stacking the two equations gives the compact form of a VAR(2). Here \(\mathbf{y}_t\) holds \(e_t\) and \(U_t\), \(\mathbf{c}\) holds the two constants, \(A_1\) holds the a coefficients and \(A_2\) holds the b coefficients:

\[ \mathbf{y}_t = \mathbf{c} + A_1 \mathbf{y}_{t-1} + A_2 \mathbf{y}_{t-2} + \boldsymbol{\varepsilon}_t \]

Each equation has 5 coefficients: a constant, and 2 lags of each of the 2 series. So the two equations have 10 coefficients between them, which in general is k(kp + 1) for k series and p lags.

That count grows quickly: 4 series with 2 lags have 36 coefficients, and 4 series with 4 lags have 68. Here, each equation's 5 coefficients are estimated from 82 rows.

Each equation is fitted by ordinary least squares (OLS), the same method `lm()` uses, one equation at a time. The code below fits the VAR(2) with `VAR()` from the `vars` package, then pulls out the coefficients of the U equation. Here `type = "const"` puts a constant in each equation.

```r
# Fit a VAR(2) to e and U and extract the coefficients of the U equation
fit <- VAR(y, p = 2, type = "const")

var_U <- coef(fit)$U[, "Estimate"]
round(var_U, 3)
#>   e.l1   U.l1   e.l2   U.l2  const
#> -0.644  0.741  0.632  0.153 12.581
```

`coef(fit)$U` is a table with one row per coefficient, and we keep its `Estimate` column. The five numbers are the coefficients of the U equation: 12.581 for the constant, -0.644 on `e.l1`, 0.741 on `U.l1`, 0.632 on `e.l2` and 0.153 on `U.l2`. The names match the columns of `L`.

To check that each equation is an ordinary regression, the code below refits both equations with `lm()` on the same five regressors. It then compares the coefficients.

```r
# Refit both equations with lm() and compare the coefficients
var_e <- coef(fit)$e[, "Estimate"]

lm_U <- coef(lm(U ~ e.l1 + U.l1 + e.l2 + U.l2, data = L))
lm_e <- coef(lm(e ~ e.l1 + U.l1 + e.l2 + U.l2, data = L))
names(lm_U)[1] <- "const"      # lm() calls the constant "(Intercept)"
names(lm_e)[1] <- "const"

c(U = max(abs(var_U - lm_U[names(var_U)])),
  e = max(abs(var_e - lm_e[names(var_e)]))) < 1e-10
#>    U    e
#> TRUE TRUE
```

For both equations the largest difference between the two sets of coefficients is below 1e-10, which is numerical noise. So a VAR needs no new estimation method: it is two regressions, each with the lags of both series as predictors.

=== step === concept
## How a fitted VAR(2) produces a forecast one or several quarters ahead

With the coefficients in hand, a forecast is arithmetic. To forecast 2001Q1, we put the last two observed quarters into each equation. 2000Q4 (e 961.766, U 6.87) is lag 1 and 2000Q3 (e 961.029, U 6.93) is lag 2.

The code below does that by hand for the e equation with a small function. It then compares the result with `predict()` from the `vars` package.

```r
# Forecast 2001Q1 by hand from the e equation and compare with predict()
b_e <- coef(fit)$e[, "Estimate"]

forecast_e <- function(lag1, lag2) {
  b_e["const"] + b_e["e.l1"] * lag1["e"] + b_e["U.l1"] * lag1["U"] +
    b_e["e.l2"] * lag2["e"] + b_e["U.l2"] * lag2["U"]
}

round(y[n, ], 3)
#>       e       U
#> 961.766   6.870
round(y[n - 1, ], 3)
#>       e       U
#> 961.029   6.930
round(unname(forecast_e(lag1 = y[n, ], lag2 = y[n - 1, ])), 3)
#> [1] 962.333

fc   <- predict(fit, n.ahead = 4)
fc_e <- fc$fcst$e[, "fcst"]
fc_U <- fc$fcst$U[, "fcst"]
round(fc_e[1], 3)
#> [1] 962.333
```

Both routes give 962.333 for e in 2001Q1. The function uses the stored coefficients, not the rounded ones we print. A coefficient rounded to 3 decimals can be off by 0.0005. Multiplied by an e near 960, that is an error of up to 0.48 for each coefficient.

The horizon h is the number of quarters ahead. A forecast for h = 2 needs e and U for 2001Q1, but those are not observed. So the 2001Q1 forecasts of both series replace the observed row as lag 1, and 2000Q4 moves to lag 2.

The code below forecasts e for 2001Q2 that way. It takes the 2001Q1 forecasts of e and U from `predict()`, then prints the four-quarter forecasts for both series.

```r
# Forecast 2001Q2 by hand: the 2001Q1 forecasts become lag 1, and 2000Q4 becomes lag 2
fc_2001Q1 <- c(e = fc_e[1], U = fc_U[1])
round(unname(forecast_e(lag1 = fc_2001Q1, lag2 = y[n, ])), 3)
#> [1] 962.743

round(data.frame(e = fc_e, U = fc_U, row.names = paste0("2001Q", 1:4)), 3)
#>              e     U
#> 2001Q1 962.333 6.698
#> 2001Q2 962.743 6.662
#> 2001Q3 963.035 6.703
#> 2001Q4 963.240 6.800
```

The hand value, 962.743, is the second e forecast from `predict()`. So `predict()` feeds each forecast back in as a lag, one quarter at a time, until it reaches the horizon you ask for.

An AR(2) forecast is the same computation with one series: its own two lags in one equation.

=== step === widget
## How to read the coefficient block: own-lag and cross-lag coefficients

The table below is the coefficient block: the coefficients of both equations side by side, with the t value of each.

::widget styled-table {"title":"VAR(2) coefficients for e and U","cols":["term","e equation","e t value","U equation","U t value"],"rows":[["e.l1","1.821","11.726","-0.644","-5.569"],["U.l1","0.156","0.727","0.741","4.638"],["e.l2","-0.817","-5.305","0.632","5.512"],["U.l2","-0.084","-0.410","0.153","0.995"],["const","-4.478","-0.800","12.581","3.015"]],"formats":{},"note":"Canada, 1980Q1 to 2000Q4, 82 rows per equation. A t value is the estimate divided by its standard error."}

The code below builds the same table from the fitted VAR, so you can reproduce it.

```r
# Print the coefficient block of both equations side by side
coef_e <- coef(fit)$e
coef_U <- coef(fit)$U

coef_block <- data.frame(
  term       = rownames(coef_e),
  e_equation = coef_e[, "Estimate"],
  e_t        = coef_e[, "t value"],
  U_equation = coef_U[, "Estimate"],
  U_t        = coef_U[, "t value"]
)
coef_block[, -1] <- round(coef_block[, -1], 3)
print(coef_block, row.names = FALSE)
#>   term e_equation    e_t U_equation    U_t
#>   e.l1      1.821 11.726     -0.644 -5.569
#>   U.l1      0.156  0.727      0.741  4.638
#>   e.l2     -0.817 -5.305      0.632  5.512
#>   U.l2     -0.084 -0.410      0.153  0.995
#>  const     -4.478 -0.800     12.581  3.015
```

1. An own-lag coefficient multiplies a lag of the equation's own series: U.l1 and U.l2 in the U equation, e.l1 and e.l2 in the e equation. A cross-lag coefficient multiplies a lag of the other series: e.l1 and e.l2 in the U equation, U.l1 and U.l2 in the e equation.
2. A t value is the estimate divided by its standard error, which measures how much the estimate would vary from sample to sample. When its size is above about 2, the estimate can be told apart from 0.
3. The two lags of a series belong together, so we interpret them as a pair.

Start with the U equation. The cross-lag coefficients on e are -0.644 and 0.632, with t values of -5.57 and 5.51. Both are far above 2 in size. Their sum is -0.012.

So raising both e lags by 1 moves the U forecast by almost nothing, while raising only last quarter's e by 1 moves it by -0.644. This is because `-0.644 * e.l1 + 0.632 * e.l2` equals `-0.644 * (e.l1 - e.l2) - 0.012 * e.l2`. The U forecast therefore changes by about -0.64 points for each unit of employment growth e(t-1) - e(t-2), with e(t-2) held fixed. One unit is about 1%.

The own-lag coefficients of U changed too. In the AR(2) they were 1.542 and -0.597, and in the VAR they are 0.741 and 0.153. So U's own lags have smaller coefficients once the lags of e are in the equation.

Now the e equation. The cross-lag coefficients on U are 0.156 and -0.084, with t values of 0.73 and -0.41, both below 1 in size. So the U lags give no measurable gain to the e equation.

The e equation depends on e's own lags, 1.821 and -0.817 (t = 11.73 and -5.30). They add up to 1.004, so raising both e lags by 1 raises the e forecast by 1.004.

But the correlation of -0.618 from earlier showed that U's previous change is strongly related to e's change. Here the U lags have no measurable effect. Why? The code below splits that correlation into two.

```r
# Split r = -0.618 into the two correlations that multiply to about the same number
r_same_quarter <- cor(D$dU.l1, D$de.l1)
r_own_previous <- cor(D$de.l1, D$de)
round(c(same_quarter = r_same_quarter,
        own_previous = r_own_previous,
        product      = r_same_quarter * r_own_previous), 3)
#> same_quarter own_previous      product
#>       -0.857        0.725       -0.621
```

If U's previous change mattered for e only through e's own previous change, the correlation would be the product of these two, -0.621. The actual value is -0.618, very close to it. So e's own previous change accounts for the raw correlation. Once e's own lags are in the equation, the U lags add nothing measurable.

The residual standard errors show the same pattern. The code below puts the AR(2) and VAR(2) values next to each other.

```r
# Compare residual standard errors of the AR(2) and VAR(2) fits
sigma_ar  <- c(e = summary(ar_e)$sigma, U = summary(ar_U)$sigma)
sigma_var <- sapply(summary(fit)$varresult, function(m) m$sigma)
round(rbind(AR2 = sigma_ar, VAR2 = sigma_var), 3)
#>          e     U
#> AR2  0.410 0.354
#> VAR2 0.402 0.300
```

For U the residual standard error falls from 0.354 to 0.300 once the e lags are added. For e it falls only from 0.410 to 0.402.

One caution: e trends upward through the sample, so the usual t distribution is only an approximation here. Treat the t values as a guide to which coefficients matter, not as exact tests.

=== step === concept
## Does a VAR forecast better than one AR(2) per series?

A better fit inside the sample does not guarantee a better forecast. So we test the forecasts on quarters that were not used to fit them, with a rolling-origin comparison.

We pick a target quarter, fit the models on the rows up to the forecast origin, forecast the target and record the error. The origin is h quarters before the target, so every forecast uses only earlier rows. We repeat this for the 24 target quarters from 1995Q1 to 2000Q4. At every origin we refit the VAR(2) and, for each series, an AR(2).

The AR(2) is fitted with `ar.ols()`, using `aic = FALSE` and `order.max = 2`. It gives the same forecasts as the `lm()` regression on lags we built earlier.

The errors are summarised by the RMSE, the root mean squared error. Square each forecast error, average the squares over the 24 targets and take the square root. It is in the units of the series, and lower is better. The function below returns the RMSE by model and series for a given horizon.

```r
# Roll the forecast origin through 1995Q1 to 2000Q4 and score VAR(2) against AR(2) by RMSE
roll_errors <- function(h) {
  targets <- 61:84
  errors  <- matrix(NA, nrow = length(targets), ncol = 4,
                    dimnames = list(NULL, c("VAR.e", "VAR.U", "AR.e", "AR.U")))
  for (i in seq_along(targets)) {
    target <- targets[i]
    train  <- window(y, end = time(y)[target - h])
    var_fc <- predict(VAR(train, p = 2, type = "const"), n.ahead = h)$fcst
    ar_e   <- ar.ols(train[, "e"], aic = FALSE, order.max = 2)
    ar_U   <- ar.ols(train[, "U"], aic = FALSE, order.max = 2)
    forecasts <- c(var_fc$e[h, "fcst"], var_fc$U[h, "fcst"],
                   predict(ar_e, n.ahead = h)$pred[h],
                   predict(ar_U, n.ahead = h)$pred[h])
    actual <- y[target, c("e", "U", "e", "U")]
    errors[i, ] <- actual - forecasts
  }
  rmse <- sqrt(colMeans(errors^2))
  data.frame(model = c("VAR(2)", "AR(2)"),
             e = round(rmse[c("VAR.e", "AR.e")], 3),
             U = round(rmse[c("VAR.U", "AR.U")], 3),
             row.names = NULL)
}

roll_errors(1)
#>    model     e     U
#> 1 VAR(2) 0.320 0.226
#> 2  AR(2) 0.305 0.263
roll_errors(4)
#>    model     e     U
#> 1 VAR(2) 1.444 0.704
#> 2  AR(2) 1.375 0.910
```

Inside the loop, `train` holds the rows up to the origin. `predict()` returns forecasts for horizons 1 to h, with earlier forecasts fed back in as lags, as we did by hand. We keep the h-th one.

For U the VAR has the lower RMSE at both horizons: 0.226 against 0.263 one quarter ahead, and 0.704 against 0.910 four quarters ahead. For e it is a little higher: 0.320 against 0.305, and 1.444 against 1.375. Both models make larger errors four quarters ahead than one quarter ahead, since forecasting further out is harder.

These numbers support a narrow claim. Against an AR(2) on the same levels, in this one 24-quarter window, the VAR forecasts U better and e slightly worse. It is not a claim that a VAR beats every single-series model. We compared it with one AR(2) per series and nothing else.

=== step === quiz
## Quick check: why is the VAR forecast better for unemployment than for employment?

The RMSE table shows a lower error for U and a higher one for e. Which statement accounts for that?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A VAR must beat an AR on every series, so the higher RMSE for e means the VAR was fitted wrongly. ::no
- The correlation of -0.618 between U's previous change and the change in e proves that U's past helps forecast e. ::no
- The U equation gets e lags with t values above 5 in size, so its extra coefficients add information. The e equation gets U lags with t values below 1, so it estimates 2 more coefficients with no measurable gain. ::ok Yes. That matches the RMSE table: U goes from 0.263 to 0.226 one quarter ahead, while e goes from 0.305 to 0.320. It is one 24-quarter window, so this is evidence for this sample, not a rule.
- Putting both series in one system biases the estimates in every equation, so the forecast for e came out worse. ::no A VAR does not have to beat an AR on every series. It helps when the lags of the other series carry information, and here they do for U but not for e. The raw correlation of -0.618 disappears in the e equation once e's own lags are there, with t values of 0.73 and -0.41. And sharing a system does not change any estimate: each equation gives the same coefficients as `lm()` on the same regressors, as the comparison showed.

=== step === tryit
## Your turn: rebuild the 2001Q1 forecast of unemployment from its equation

The `predict()` value for U in 2001Q1 was 6.698. Let's rebuild it from the U equation, the same computation we did by hand for e.

The code below refits the VAR and stores `b_U`, the five coefficients of the U equation. Their names are `const`, `e.l1`, `U.l1`, `e.l2` and `U.l2`. It also stores the last two observed quarters: `e_lag1` and `U_lag1` for 2000Q4, and `e_lag2` and `U_lag2` for 2000Q3. Replace the `NA` with the forecast, using each coefficient by name, then run the block.

```r
# Rebuild the 2001Q1 forecast of unemployment from the five coefficients of its equation
library(vars)
data(Canada)
y <- Canada[, c("e", "U")]
fit <- VAR(y, p = 2)
b_U <- coef(fit)$U[, "Estimate"]

n <- nrow(y)
e_lag1 <- y[n, "e"]
U_lag1 <- y[n, "U"]
e_lag2 <- y[n - 1, "e"]
U_lag2 <- y[n - 1, "U"]

forecast_U <- NA
forecast_U
```
::check {"regex": "^(?=[\\s\\S]*const)(?=[\\s\\S]*e[.]l1)(?=[\\s\\S]*U[.]l1)(?=[\\s\\S]*e[.]l2)(?=[\\s\\S]*U[.]l2)", "gate": true, "difficulty": "intermediate", "ok": "Yes: 6.698, the same as predict(). Each coefficient multiplies the value of its own lag, and the constant has no lag to multiply.", "no": "Write the forecast from b_U by name, one term per coefficient: the constant, then e.l1 times e_lag1, U.l1 times U_lag1, e.l2 times e_lag2 and U.l2 times U_lag2, all added together."}
::solution
```r
# Multiply each coefficient by its lag value and add the constant
forecast_U <- b_U["const"] + b_U["e.l1"] * e_lag1 + b_U["U.l1"] * U_lag1 +
  b_U["e.l2"] * e_lag2 + b_U["U.l2"] * U_lag2
round(unname(forecast_U), 3)
#> [1] 6.698
round(predict(fit, n.ahead = 1)$fcst$U[1, "fcst"], 3)
#> [1] 6.698
```

The forecast for 2001Q1 is 6.698, a fall of about 0.17 points from the 6.87 of 2000Q4. It matches `predict()`.

=== step === concept
## References

- [VAR, SVAR and SVEC Models: Implementation Within R Package vars](https://doi.org/10.18637/jss.v027.i04) - Pfaff (2008), Journal of Statistical Software 27(4). The paper behind the `vars` package used in this lesson, covering `VAR()`, `predict()` and the other tools built around them.
- New Introduction to Multiple Time Series Analysis - Luetkepohl (2005), Springer. The standard textbook treatment of VAR estimation, forecasting and inference.
- [Macroeconomics and Reality](https://doi.org/10.2307/1912017) - Sims (1980), Econometrica 48(1), 1-48. The paper that brought the VAR into empirical macroeconomics.
- [Forecasting: Principles and Practice, vector autoregressions](https://otexts.com/fpp3/VAR.html) - Hyndman and Athanasopoulos, 3rd edition, OTexts. A short introduction to VAR forecasting with worked examples.
- Applied Time Series Econometrics - Luetkepohl and Kraetzig (2004), Cambridge University Press. The source of the Canada data used here.

=== step === complete
## Quick recap

You fitted a vector autoregression to Canada's employment and unemployment, interpreted its coefficient block, and tested its forecasts. To summarize:

- A VAR(p) is k regressions, one per series, each on p lags of all k series plus a constant. Ours has 2 equations with 5 coefficients each, fitted by ordinary least squares, and their coefficients match `lm()` to numerical precision.
- An own-lag coefficient multiplies a lag of the equation's own series, and a cross-lag coefficient multiplies a lag of the other series. In the U equation the e lags are -0.644 and 0.632 (t = -5.57 and 5.51). In the e equation the U lags are 0.156 and -0.084 (t = 0.73 and -0.41).
- A forecast puts the last p rows into each equation. A multi-quarter forecast feeds the earlier forecasts back in as lags.
- Over the 24 quarters from 1995Q1 to 2000Q4, the one-quarter-ahead RMSE for U was 0.226 with the VAR against 0.263 with the AR(2), and for e it was 0.320 against 0.305. That is one window and one comparison, so it does not say a VAR always wins.

So whenever someone asks what a VAR adds, here is the answer. It lets the past of each series enter the forecast of the others, and the coefficient block shows whether that helps. In this sample it helped for unemployment and not for employment.
