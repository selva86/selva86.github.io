---
title: "Volatility Modeling with ARCH and GARCH Lesson 4: Fitting GARCH in R"
slug: "Fitting-GARCH-in-R"
description: "Fit GARCH(1,1) to 1,859 daily DAX returns with tseries and fGarch in R, check the standardised residuals, and compare Normal and Student-t errors using AIC."
keywords: "fit GARCH in R, GARCH(1,1) in R, tseries garch, fGarch garchFit, conditional standard deviation, standardised residuals, Student-t errors, Ljung-Box test, volatility persistence"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-volatility"
course_title: "Volatility Modeling with ARCH and GARCH"
course_lesson: "4"
course_total: "6"
course_landing: "Volatility-Modeling-ARCH-and-GARCH-Course.html"
course_next: "Forecasting-Volatility-and-Value-at-Risk.html"
course_prev: "The-GARCH-Family.html"
curriculum_id: "5.100.4"
lesson_access: "pro"
catalog_blurb: "How to fit GARCH in R and test whether the model describes your data."
---

=== step === cover
## Fitting GARCH in R

Today let's fit a GARCH model to a real stock index in R, and then check how well the fit describes the data.

Our data are the daily closing prices of the German DAX index. From those prices we get 1,859 daily returns, one for each trading day from mid-1991 to 1998. A daily return is the change in the log of the closing price from one trading day to the next, written in percent. The standard deviation of the 1,859 returns is close to 1%, so on a typical day the index moves about 1% up or down.

But that 1% is an average over the whole period, and it hides something. The chart below shows the returns of trading days 1600 to 1800. From day 1600 to day 1660 the line swings widely, and the two largest moves in the window are on days 1651 and 1652, when the return was -6.01% and then +4.32%. From day 1720 to day 1780 the swings are much smaller.

::widget chart-plotter {"data":[{"x":1600,"y":0.07},{"x":1601,"y":2.66},{"x":1602,"y":1.46},{"x":1603,"y":-1.11},{"x":1604,"y":-2.76},{"x":1605,"y":-0.33},{"x":1606,"y":-2.06},{"x":1607,"y":-0.04},{"x":1608,"y":-2.4},{"x":1609,"y":0.57},{"x":1610,"y":2.07},{"x":1611,"y":3.09},{"x":1612,"y":-1.59},{"x":1613,"y":0.77},{"x":1614,"y":-0.48},{"x":1615,"y":1.4},{"x":1616,"y":-0.65},{"x":1617,"y":-1.88},{"x":1618,"y":-3.48},{"x":1619,"y":-2.44},{"x":1620,"y":1.9},{"x":1621,"y":3.21},{"x":1622,"y":-0.63},{"x":1623,"y":0.84},{"x":1624,"y":-0.53},{"x":1625,"y":2.82},{"x":1626,"y":-0.12},{"x":1627,"y":1.44},{"x":1628,"y":-1.11},{"x":1629,"y":0.73},{"x":1630,"y":-0.45},{"x":1631,"y":0.93},{"x":1632,"y":2.57},{"x":1633,"y":0.07},{"x":1634,"y":0},{"x":1635,"y":1.4},{"x":1636,"y":-0.35},{"x":1637,"y":-1.02},{"x":1638,"y":-2.07},{"x":1639,"y":-0.37},{"x":1640,"y":1.45},{"x":1641,"y":-0.24},{"x":1642,"y":-1.11},{"x":1643,"y":-0.45},{"x":1644,"y":-2.46},{"x":1645,"y":0.49},{"x":1646,"y":2.5},{"x":1647,"y":-1.15},{"x":1648,"y":-3.67},{"x":1649,"y":0.13},{"x":1650,"y":-2.8},{"x":1651,"y":-6.01},{"x":1652,"y":4.32},{"x":1653,"y":-1.53},{"x":1654,"y":0.13},{"x":1655,"y":2.48},{"x":1656,"y":-1.65},{"x":1657,"y":1.48},{"x":1658,"y":-0.72},{"x":1659,"y":-2.62},{"x":1660,"y":0.35},{"x":1661,"y":0.17},{"x":1662,"y":-1},{"x":1663,"y":0.12},{"x":1664,"y":-0.69},{"x":1665,"y":3.74},{"x":1666,"y":0.72},{"x":1667,"y":0.85},{"x":1668,"y":1.41},{"x":1669,"y":0.26},{"x":1670,"y":-2.83},{"x":1671,"y":0.47},{"x":1672,"y":1.97},{"x":1673,"y":0.89},{"x":1674,"y":0.25},{"x":1675,"y":3.8},{"x":1676,"y":-0.72},{"x":1677,"y":-0.53},{"x":1678,"y":2.07},{"x":1679,"y":0.77},{"x":1680,"y":0.39},{"x":1681,"y":-0.5},{"x":1682,"y":-1.7},{"x":1683,"y":-2.46},{"x":1684,"y":1.12},{"x":1685,"y":-0.81},{"x":1686,"y":2.96},{"x":1687,"y":0.1},{"x":1688,"y":0.2},{"x":1689,"y":-2.62},{"x":1690,"y":1.72},{"x":1691,"y":0.18},{"x":1692,"y":0},{"x":1693,"y":0},{"x":1694,"y":0},{"x":1695,"y":3.17},{"x":1696,"y":-0.98},{"x":1697,"y":0},{"x":1698,"y":0},{"x":1699,"y":3.26},{"x":1700,"y":1.2},{"x":1701,"y":-1.3},{"x":1702,"y":-0.46},{"x":1703,"y":-1.07},{"x":1704,"y":-1.31},{"x":1705,"y":-2.46},{"x":1706,"y":0.37},{"x":1707,"y":-0.11},{"x":1708,"y":-0.13},{"x":1709,"y":1.82},{"x":1710,"y":1.74},{"x":1711,"y":0.48},{"x":1712,"y":-1.41},{"x":1713,"y":-0.28},{"x":1714,"y":-0.39},{"x":1715,"y":1.04},{"x":1716,"y":1.16},{"x":1717,"y":1.59},{"x":1718,"y":1.34},{"x":1719,"y":-0.05},{"x":1720,"y":1.95},{"x":1721,"y":-0.02},{"x":1722,"y":-0.44},{"x":1723,"y":-0.32},{"x":1724,"y":0.93},{"x":1725,"y":-0.38},{"x":1726,"y":0.86},{"x":1727,"y":-0.14},{"x":1728,"y":-0.95},{"x":1729,"y":0.29},{"x":1730,"y":0.29},{"x":1731,"y":2.01},{"x":1732,"y":-0.34},{"x":1733,"y":-0.67},{"x":1734,"y":0.04},{"x":1735,"y":0.6},{"x":1736,"y":-0.13},{"x":1737,"y":2.15},{"x":1738,"y":-0.19},{"x":1739,"y":-0.04},{"x":1740,"y":1.85},{"x":1741,"y":-0.46},{"x":1742,"y":-1.46},{"x":1743,"y":-0.3},{"x":1744,"y":1.83},{"x":1745,"y":1.38},{"x":1746,"y":0.48},{"x":1747,"y":0.21},{"x":1748,"y":-0.49},{"x":1749,"y":0.69},{"x":1750,"y":0.68},{"x":1751,"y":0.82},{"x":1752,"y":-0.76},{"x":1753,"y":0.84},{"x":1754,"y":1.91},{"x":1755,"y":-0.62},{"x":1756,"y":1},{"x":1757,"y":0.98},{"x":1758,"y":-1.68},{"x":1759,"y":0.75},{"x":1760,"y":0.06},{"x":1761,"y":0.54},{"x":1762,"y":0.74},{"x":1763,"y":0.85},{"x":1764,"y":1.44},{"x":1765,"y":1.73},{"x":1766,"y":-0.68},{"x":1767,"y":-0.8},{"x":1768,"y":0.85},{"x":1769,"y":0},{"x":1770,"y":0},{"x":1771,"y":1.04},{"x":1772,"y":-0.16},{"x":1773,"y":-1.24},{"x":1774,"y":0.63},{"x":1775,"y":1.51},{"x":1776,"y":-0.63},{"x":1777,"y":-1.15},{"x":1778,"y":-0.94},{"x":1779,"y":-2.27},{"x":1780,"y":-2.79},{"x":1781,"y":2.14},{"x":1782,"y":-0.53},{"x":1783,"y":3.05},{"x":1784,"y":0},{"x":1785,"y":1.82},{"x":1786,"y":-2.11},{"x":1787,"y":0.73},{"x":1788,"y":-1.91},{"x":1789,"y":2.03},{"x":1790,"y":1.47},{"x":1791,"y":-0.77},{"x":1792,"y":1.2},{"x":1793,"y":0.04},{"x":1794,"y":0.75},{"x":1795,"y":-1.31},{"x":1796,"y":1.81},{"x":1797,"y":1.34},{"x":1798,"y":0},{"x":1799,"y":0.28},{"x":1800,"y":1.12}],"geoms":["line"],"x":"trading_day","y":"return_pct","code":{"line":"# Plot the DAX daily returns of trading days 1600 to 1800\nggplot(df, aes(trading_day, return_pct)) +\n  geom_hline(yintercept = 0, colour = \"grey60\") +\n  geom_line() +\n  labs(x = \"Trading day\", y = \"Daily return (%)\")"}}

In this chart the large returns come in a group, and so do the small ones.

=== step === concept
## The DAX daily returns and a check for ARCH effects

Before we fit anything, let's build the returns and check that their variance really does change over time.

The prices come from `EuStockMarkets`, a dataset that ships with R. It holds the daily closing prices of four European stock indices, and we take the `DAX` column. The prices are sampled in business time: weekends and holidays are left out and there are no calendar dates, so from here on we count trading days.

We work with log returns. The return on day t is the log of that day's price minus the log of the previous day's price, which is what `diff(log(price))` computes. For small moves it is close to the percentage change, and unlike the percentage change it adds up across days. The first price has no day before it, so 1,860 prices give 1,859 returns, and we call the t-th return day t.

The first block builds the returns `r`, summarises them in percent and prints their variance.

```r
# Build the DAX daily log returns and summarise them
dax_price <- EuStockMarkets[, "DAX"]
r <- as.numeric(diff(log(dax_price)))

length(r)
#> [1] 1859

round(c(mean = 100 * mean(r), sd = 100 * sd(r), min = 100 * min(r), max = 100 * max(r)), 3)
#>   mean     sd    min    max
#>  0.065  1.030 -9.628  5.076

var(r)
#> [1] 0.0001061072
```

The mean return is 0.065% a day and the standard deviation is 1.03%. The worst day was -9.63% and the best was +5.08%. The variance of `r` is 0.000106, which is a small number because the returns are small decimals.

What we want to know is whether that spread is the same on every day. The tool for it is the autocorrelation function (ACF): the correlation of a series with itself k days back, where k is the lag. At lag 1 it is the correlation of today's value with yesterday's, at lag 2 with the value two days back, and so on.

Here is the idea. If the variance changes in stretches, then the size of a return is related to the size of the returns just before it: a big move, up or down, tends to be followed by another big move. The size of a return shows up in its square. So we check for autocorrelation in `r^2`. The returns `r` themselves can stay uncorrelated, because the direction of the moves does not have to follow a pattern.

The Ljung-Box test looks at all the autocorrelations up to a chosen lag at once. Its null hypothesis is that there is no autocorrelation up to that lag, and a small p-value rejects it. The block runs it at lag 10 on `r` and on `r^2`.

```r
# Test the returns and the squared returns for autocorrelation up to lag 10
Box.test(r, lag = 10, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  r
#> X-squared = 6.3656, df = 10, p-value = 0.7837

Box.test(r^2, lag = 10, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  r^2
#> X-squared = 110.75, df = 10, p-value < 2.2e-16
```

On `r`, the statistic Q is 6.37 and p is 0.784. Under the null hypothesis Q follows a chi-squared distribution with 10 degrees of freedom, which has a mean of 10, so 6.37 is nothing unusual. There is no evidence of autocorrelation in the returns, and that is why the mean equation can be a constant. On `r^2`, Q is 110.75 and p is below 2.2e-16, so the null hypothesis is clearly rejected.

The table below puts the autocorrelations of `r` and `r^2` at lags 1 to 5 side by side.

```r
# Compare the autocorrelation of the returns and of the squared returns at lags 1 to 5
acf_r  <- acf(r, lag.max = 5, plot = FALSE)$acf[-1]
acf_r2 <- acf(r^2, lag.max = 5, plot = FALSE)$acf[-1]

acf_table <- round(rbind(returns = acf_r, squared_returns = acf_r2), 3)
colnames(acf_table) <- paste("lag", 1:5)
acf_table
#>                 lag 1  lag 2  lag 3 lag 4  lag 5
#> returns         0.000 -0.027 -0.010 0.000 -0.032
#> squared_returns 0.079  0.171  0.074 0.078  0.053
```

The autocorrelations of the returns are all within 0.032 of zero. Those of the squared returns are 0.079, 0.171, 0.074, 0.078 and 0.053, all positive.

[KEY INSIGHT]
The returns are not correlated with their own past, but their squares are. So large moves of either sign follow large moves, and small moves follow small ones. This is called volatility clustering, and it means the variance of the returns changes over time. The dependence of the variance on past squared returns is called an ARCH effect, and a GARCH model is built to describe it.

=== step === concept
## The GARCH(1,1) model, coefficient by coefficient

A model with one constant variance cannot describe calm stretches and violent stretches. GARCH lets the variance change from day to day, using two equations: one for the return and one for its variance. The first says the return is a constant mean plus a shock:

\[ r_t = \mu + \varepsilon_t \]

Here \(r_t\) is the return on day t, \(\mu\) is the mean return, and \(\varepsilon_t\) is the shock, the part of the return that the mean does not explain. The shock carries the changing variance, through this equation:

\[ \varepsilon_t = \sigma_t z_t \]

\(\sigma_t\) is the standard deviation on day t, and \(z_t\) is a random draw with mean 0 and variance 1, independent from one day to the next. To begin with, \(z_t\) is Normal. The square \(\sigma_t^2\) is the conditional variance of the return: its variance given all the returns up to day t-1. The second equation builds it:

\[ \sigma_t^2 = \omega + \alpha_1 \varepsilon_{t-1}^2 + \beta_1 \sigma_{t-1}^2 \]

So today's variance is a constant, plus a share of yesterday's squared shock, plus a share of yesterday's variance. The two 1s in GARCH(1,1) count the lags: one lag of the squared shock and one lag of the variance. The table says what each coefficient controls.

| Coefficient | What it controls | Constraint |
|---|---|---|
| omega | The constant part of the variance, the same on every day | Positive |
| alpha1 | How much yesterday's squared shock adds to today's variance | Not negative |
| beta1 | How much of yesterday's variance carries over to today | Not negative |
| alpha1 + beta1 | The persistence: how slowly a jump in the variance dies out | Less than 1 |

The constraints keep the variance positive and give it a long-run level, the value it averages out to over many days:

\[ \bar{\sigma}^2 = \frac{\omega}{1 - \alpha_1 - \beta_1} \]

If alpha1 + beta1 reached 1, this formula would divide by 0, so there would be no finite long-run variance. That is the reason for the last constraint. The formula also explains the size of omega. It equals the long-run variance times (1 - alpha1 - beta1), and the variance of returns written as decimals is tiny (0.000106 for `r`). So omega comes out as a very small number.

Now to persistence. After a large shock the variance jumps above its long-run level. On each day after that, the gap between the expected variance and the long-run variance is multiplied by alpha1 + beta1, so a persistence near 1 means the gap closes slowly. The half-life is the number of days the gap takes to halve:

\[ \text{half-life} = \frac{\log 0.5}{\log(\alpha_1 + \beta_1)} \]

A persistence of 0.90 gives a half-life of 6.6 days, and a persistence of 0.99 gives 69 days.

=== step === concept
## How to fit GARCH(1,1) with tseries::garch()

The `tseries` package fits the model with `garch()`. It estimates omega, alpha1 and beta1 by maximum likelihood: it searches for the parameter values under which the observed returns are most probable, that is, have the highest likelihood, assuming Normal errors. The function has no mean term, so we pass it the returns with their mean removed, `r - mean(r)`.

The argument `order = c(1, 1)` gives the orders of the model. The first number is the GARCH order (lags of the variance) and the second is the ARCH order (lags of the squared shock). `trace = FALSE` switches off the optimiser's printout. The block fits the model and prints its coefficient table.

```r
# Fit GARCH(1,1) with tseries::garch() and print its coefficient table
suppressMessages(library(tseries))

fit_ts <- garch(r - mean(r), order = c(1, 1), trace = FALSE)
summary(fit_ts)$coef
#>        Estimate   Std. Error   t value     Pr(>|t|)
#> a0 4.745923e-06 7.788348e-07  6.093619 1.103859e-09
#> a1 6.837046e-02 1.111316e-02  6.152204 7.641334e-10
#> b1 8.877458e-01 1.666803e-02 53.260383 0.000000e+00
```

The table calls the coefficients `a0`, `a1` and `b1`, which are omega, alpha1 and beta1. The standard error says how precisely each one is estimated, and the t value is the estimate divided by its standard error. All three t values are above 6, so all three coefficients are clearly different from 0.

Alpha1 is 0.0684, so a squared shock adds 6.84% of its size to the next day's variance. Beta1 is 0.8877, so 88.77% of yesterday's variance carries over to today. The next block computes the persistence, the half-life and the long-run standard deviation from the coefficients.

```r
# Compute persistence, half-life and long-run standard deviation from the coefficients
cf <- coef(fit_ts)
persistence <- unname(cf["a1"] + cf["b1"])
half_life <- log(0.5) / log(persistence)
long_run_sd <- sqrt(unname(cf["a0"]) / (1 - persistence))

round(c(persistence = persistence, half_life_days = half_life), 4)
#>    persistence half_life_days
#>         0.9561        15.4459
round(100 * c(long_run_sd = long_run_sd, sample_sd = sd(r)), 3)
#> long_run_sd   sample_sd
#>        1.04        1.03
```

The persistence is 0.9561, so after a shock the gap between the variance and its long-run level shrinks by a factor of 0.9561 each day, and the half-life is 15.4 days. The long-run standard deviation is 1.04% a day, close to the 1.03% sample standard deviation of the returns.

=== step === concept
## The fitted conditional standard deviation

The fitted conditional standard deviation \(\sigma_t\) is what the model produces for every day. Calling `fitted()` on a `garch` fit returns two columns, plus and minus \(\sigma_t\), so we take the first. Its first value is `NA`, since the variance equation needs a previous day. The block extracts \(\sigma_t\) and looks at its range.

```r
# Extract the fitted conditional standard deviation and look at its range
sigma_ts <- fitted(fit_ts)[, 1]

round(100 * range(sigma_ts, na.rm = TRUE), 2)
#> [1] 0.70 2.73
round(100 * median(sigma_ts, na.rm = TRUE), 2)
#> [1] 0.93
```

\(\sigma_t\) ranges from 0.70% to 2.73% a day, with a median of 0.93%. It is computed from the returns up to day t-1, so it is the standard deviation the model gives day t without using that day's return. The next block prints the returns and \(\sigma_t\) around the -9.63% return of day 35, and then for day 45 and day 65.

```r
# Show the returns and the fitted standard deviation around the day-35 shock
days_shown <- c(34:38, 45, 65)
data.frame(
  day        = days_shown,
  return_pct = round(100 * r[days_shown], 2),
  sigma_pct  = round(100 * sigma_ts[days_shown], 2)
)
#>   day return_pct sigma_pct
#> 1  34      -0.03      0.80
#> 2  35      -9.63      0.79
#> 3  36       1.48      2.65
#> 4  37       5.08      2.53
#> 5  38       1.17      2.73
#> 6  45       0.22      1.90
#> 7  65      -0.46      0.91
```

On day 35 the return was -9.63%, yet \(\sigma_{35}\) was only 0.79%. The model's standard deviation for that day was low, because the days before it were quiet. On day 36, \(\sigma_{36}\) jumped to 2.65%, since it is computed from the day-35 shock, and on day 37 it eased to 2.53%.

Then the return on day 37 was +5.08%, the largest positive return in the sample, and it lifted \(\sigma_{38}\) to 2.73%, the highest value in the whole series. After that \(\sigma_t\) decays: it is 1.90% on day 45 and back to 0.91% on day 65. A fall and a rise both push \(\sigma_t\) up, because the variance equation reacts to the size of a shock and not to its sign.

To see where these numbers come from, the next block recomputes \(\sigma_{36}\) from the variance equation, using the day-35 shock and \(\sigma_{35}\).

```r
# Recompute sigma on day 36 from the variance equation and compare it with the fit
e_35 <- r[35] - mean(r)
sigma_36 <- sqrt(cf["a0"] + cf["a1"] * e_35^2 + cf["b1"] * sigma_ts[35]^2)

round(100 * c(by_hand = unname(sigma_36), fitted = sigma_ts[36]), 3)
#> by_hand  fitted
#>   2.649   2.649
```

The variance equation reproduces the fitted value, 2.649%. So \(\sigma_t\) is nothing more than that equation applied day after day.

The plot below shows the returns of days 1 to 200 with lines at plus and minus 2 \(\sigma_t\).

```r
# Plot days 1 to 200 with plus and minus 2 fitted standard deviations
first_200 <- 1:200
band <- 2 * 100 * sigma_ts[first_200]

plot(first_200, 100 * r[first_200], type = "l", col = "grey40",
     xlab = "Trading day", ylab = "Daily return (%)")
lines(first_200, band, col = "red")
lines(first_200, -band, col = "red")
```

The red lines open up right after day 35, to about 5.3% on each side on day 36, and then narrow again over the next 30 days or so, to about 1.8% by day 65. A model with a constant variance cannot draw a band like this.

=== step === concept
## The same fit with fGarch::garchFit()

The `fGarch` package fits the same model with `garchFit()`, and its output is richer. The formula `~ garch(1, 1)` sets the variance equation, `cond.dist = "norm"` sets Normal errors, and `trace = FALSE` turns off the optimiser's printout. Unlike `garch()`, it estimates the mean `mu` together with the other coefficients, so we pass it `r` itself.

The coefficient matrix sits in the `matcoef` element of the fit's `fit` slot, and `@` is how R reads a slot of the object that `garchFit()` returns. The block fits the model and prints that matrix.

```r
# Fit GARCH(1,1) with fGarch::garchFit() and print its coefficient matrix
suppressMessages(library(fGarch))

fit_norm <- garchFit(~ garch(1, 1), data = r, cond.dist = "norm", trace = FALSE)
fit_norm@fit$matcoef
#>            Estimate   Std. Error   t value     Pr(>|t|)
#> mu     6.535079e-04 2.157584e-04  3.028887 2.454565e-03
#> omega  4.754313e-06 1.264427e-06  3.760054 1.698770e-04
#> alpha1 6.841653e-02 1.477706e-02  4.629917 3.658128e-06
#> beta1  8.876111e-01 2.355855e-02 37.676814 0.000000e+00
```

The matrix has the same columns as before. Mu is 0.000654 (t value 3.03), alpha1 is 0.0684 (standard error 0.0148, t value 4.63) and beta1 is 0.8876 (standard error 0.0236, t value 37.68). The next block puts the two fits side by side, with the estimates rounded to 4 significant digits and the standard errors to 3.

```r
# Put the tseries and fGarch estimates and standard errors side by side
params <- c("omega", "alpha1", "beta1")

side_by_side <- data.frame(
  parameter   = params,
  tseries_est = signif(unname(coef(fit_ts)), 4),
  fgarch_est  = signif(unname(coef(fit_norm)[params]), 4),
  tseries_se  = signif(unname(summary(fit_ts)$coef[, 2]), 3),
  fgarch_se   = signif(unname(fit_norm@fit$matcoef[params, 2]), 3)
)
side_by_side
#>   parameter tseries_est fgarch_est tseries_se fgarch_se
#> 1     omega   4.746e-06  4.754e-06   7.79e-07  1.26e-06
#> 2    alpha1   6.837e-02  6.842e-02   1.11e-02  1.48e-02
#> 3     beta1   8.877e-01  8.876e-01   1.67e-02  2.36e-02
```

The estimates agree. Alpha1 is 0.0684 in both, beta1 is 0.8877 and 0.8876, and omega is 4.75e-06 in both once rounded to 3 digits. The standard errors do not agree, and fGarch's are larger: 0.0148 against 0.0111 for alpha1, and 0.0236 against 0.0167 for beta1.

The two packages calculate the standard errors differently. `tseries` uses the outer product of the gradient, and `fGarch` uses the Hessian of the log-likelihood. The Hessian is the matrix of second derivatives, and it measures how sharply the log-likelihood curves around its maximum. In both packages every t value is above 3, so the conclusion is the same.

Both packages fit the model by maximising the log-likelihood, and `fGarch` reports its value. The log-likelihood is the sum, over the 1,859 days, of the log of the density the fitted model gives to that day's return. A higher value means the observed returns are more probable under the model.

The fit stores the negative of it in its `value` element, because that is the number the optimiser minimises. The block flips the sign and checks it against a direct sum of Normal log densities.

```r
# Check the log-likelihood: the sum over days of the log Normal density of each return
mu_hat <- coef(fit_norm)["mu"]
sigma_norm <- fit_norm@sigma.t

loglik_norm <- unname(-fit_norm@fit$value)
by_hand <- sum(dnorm(r, mean = mu_hat, sd = sigma_norm, log = TRUE))

round(c(from_fit = loglik_norm, by_hand = by_hand), 2)
#> from_fit  by_hand
#>  5966.21  5966.21
```

Both come to 5966.21. The last block compares \(\sigma_t\) from the two fits, in percent, on the same days.

```r
# Compare sigma from the two fits on the same days, in percent
sigma_compare <- round(100 * rbind(tseries = sigma_ts[days_shown], fGarch = sigma_norm[days_shown]), 3)
colnames(sigma_compare) <- paste("day", days_shown)
sigma_compare
#>         day 34 day 35 day 36 day 37 day 38 day 45 day 65
#> tseries  0.801  0.786  2.649  2.533  2.731  1.895  0.911
#> fGarch   0.801  0.786  2.650  2.534  2.732  1.895  0.910

round(100 * max(abs(sigma_ts - sigma_norm), na.rm = TRUE), 4)
#> [1] 0.0086
```

The two \(\sigma_t\) paths agree to the second decimal, for example 0.786 and 0.786 on day 35, and 2.649 and 2.650 on day 36. Over all days the largest gap is 0.0086 percentage points. From here on we use the `fGarch` fit, because it returns the standardised residuals directly and lets us change the error distribution.

=== step === widget
## What should a plot of the standardised residuals look like?

If the variance equation captures the clustering, dividing each shock by its \(\sigma_t\) should leave values with the same spread on every day. Those values are the standardised residuals:

\[ z_t = \frac{r_t - \hat{\mu}}{\hat{\sigma}_t} \]

The hats mark fitted values. A plot of \(z_t\) against time should look like a flat band. A funnel, wide in some stretches and narrow in others, would say that the fitted \(\sigma_t\) has not removed all the changes in variance.

The widget below carries its own small regression example, not the DAX returns. Its Funnel setting shows a spread that changes, which is the pattern we do not want in \(z_t\), and its Healthy setting shows the constant spread that \(z_t\) should have. Switch between the two.

::widget residual-plot {"start": "funnel"}

In the Funnel setting the points fan out as the fitted value grows, so the spread is not constant. In the Healthy setting they stay in an even band around zero.

Now let's check the DAX. The block computes \(z_t\) by hand and with `residuals()`, confirms that they match, prints the standard deviation of \(z_t\) and plots it against the trading day.

```r
# Standardise the residuals by hand and with residuals(), then check their spread
z_norm <- residuals(fit_norm, standardize = TRUE)
z_hand <- (r - coef(fit_norm)["mu"]) / fit_norm@sigma.t

all.equal(as.numeric(z_hand), as.numeric(z_norm))
#> [1] TRUE
round(sd(z_norm), 4)
#> [1] 0.9999

plot(z_norm, type = "l", col = "grey40", xlab = "Trading day", ylab = "Standardised residual")
```

The two computations agree, and the standard deviation of \(z_t\) is 0.9999, very close to the 1 that the model assumes for it. The plot shows a band of roughly constant height across all 1,859 days, with one spike down at day 35, where \(z_t\) is about -12.

The last block compares the autocorrelation of `r^2` with that of the squared standardised residuals at lags 1 to 5.

```r
# Compare the autocorrelation of the squared returns and the squared standardised residuals
acf_r2 <- acf(r^2, lag.max = 5, plot = FALSE)$acf[-1]
acf_z2 <- acf(z_norm^2, lag.max = 5, plot = FALSE)$acf[-1]

squared_table <- round(rbind(r_squared = acf_r2, z_squared = acf_z2), 3)
colnames(squared_table) <- paste("lag", 1:5)
squared_table
#>            lag 1 lag 2  lag 3 lag 4  lag 5
#> r_squared  0.079 0.171  0.074 0.078  0.053
#> z_squared -0.008 0.006 -0.003 0.013 -0.008
```

For `r^2` the autocorrelations were 0.079, 0.171, 0.074, 0.078 and 0.053. For the squared standardised residuals they fall to -0.008, 0.006, -0.003, 0.013 and -0.008, all within 0.013 of zero. So dividing by the fitted \(\sigma_t\) has removed the correlation between the sizes of the moves.

=== step === concept
## Testing the standardised residuals: autocorrelation and tails

The plots suggest that the variance equation works, so now let's test it. There are two questions. Is any autocorrelation left in \(z_t\) or in \(z_t^2\)? And does \(z_t\) look like a Normal draw, which is what the model assumed? We start with autocorrelation, using the Ljung-Box test at lag 10 as before.

```r
# Test the standardised residuals and their squares for autocorrelation up to lag 10
Box.test(z_norm, lag = 10, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  z_norm
#> X-squared = 3.1958, df = 10, p-value = 0.9764

Box.test(z_norm^2, lag = 10, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  z_norm^2
#> X-squared = 0.89327, df = 10, p-value = 0.9999
```

The null hypothesis is that there is no autocorrelation up to lag 10, so a high p-value means there is no evidence of any left. For \(z_t\), p is 0.976. For \(z_t^2\), p is 0.9999, and that is the one that matters most: no autocorrelation is left in the squared standardised residuals, so no volatility clustering remains. The tests give no evidence against the GARCH(1,1) variance equation.

The second question is about the tails. If \(z_t\) were Normal, the share of values beyond 3 in size (above 3 or below -3) would be 0.27%, which is 5.0 values out of 1,859. Beyond 4 it would be 0.0063%, which is 0.12 values. The block counts the actual values and compares them with those numbers.

```r
# Count the standardised residuals beyond 3 and 4 in size, against a Normal
n <- length(z_norm)
cutoffs <- c(3, 4)

data.frame(
  beyond   = cutoffs,
  observed = sapply(cutoffs, function(cut) sum(abs(z_norm) > cut)),
  expected = round(n * 2 * pnorm(-cutoffs), 2)
)
#>   beyond observed expected
#> 1      3       12     5.02
#> 2      4        3     0.12

which.min(z_norm)
#> [1] 35
round(min(z_norm), 2)
#> [1] -12.34
```

There are 12 values beyond 3 against 5.0 expected, and 3 beyond 4 against 0.12. The smallest value is -12.34, on day 35: the -9.63% fall on a day when \(\sigma_{35}\) was only 0.79%. A Normal would almost never produce a value that far out.

A QQ plot shows the same thing for the whole distribution. It plots the sorted values of \(z_t\) against the quantiles of a Normal, and if \(z_t\) is Normal the points fall on the line.

```r
# Draw the Normal QQ plot of the standardised residuals
qqnorm(z_norm, main = "Standardised residuals against Normal quantiles")
qqline(z_norm, col = "red")
```

The points follow the line through the middle. But in both tails they bend away from it: the lowest values sit below the line and the highest sit above it, and the point at -12.34 is far from it. Those are heavy tails, meaning more extreme values than a Normal allows.

[KEY INSIGHT]
Autocorrelation left in the squared standardised residuals would point at the variance equation. Tails heavier than a Normal point at the error distribution. Here no autocorrelation is left and the tails show a clear excess, so the variance equation stays and the error distribution needs work.

=== step === quiz
## Quick check: what do the residual tests say about the Normal fit?

On the Normal fit, the Ljung-Box test on the squared standardised residuals gave p = 0.9999, and 12 standardised residuals fell beyond 3 in size against 5.0 expected under a Normal. What do the two results say together?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A p-value near 1 means ARCH effects remain in the residuals, so the variance equation needs more terms. ::no
- The 12 large values show that the GARCH order is too low, so the model should be refit as GARCH(2,2). ::no
- No autocorrelation is left in the squared standardised residuals, so the variance equation is not rejected, but the excess of large values means the errors have heavier tails than a Normal. ::ok Yes. A p-value of 0.9999 means there is no autocorrelation left in the squared standardised residuals, which is the constant spread we saw in the residual plot. The tail counts and the QQ plot are a separate question, and they say a Normal is too thin in the tails.
- The mean equation needs ARMA terms, because the large values show that the returns can be predicted from their past. ::no A high p-value means no autocorrelation is left, so nothing points to a bigger variance equation or to a different mean equation. The large values are about the shape of the error distribution: 12 beyond 3 against 5.0 expected is a tail problem, and it needs a different distribution, not more lags.

=== step === widget
## Student-t errors: refit and compare with the Normal fit

A Student-t distribution has heavier tails than a Normal, which is the feature the tail counts pointed to. It has one parameter, the shape, also called the degrees of freedom and written \(\nu\). A small shape means heavy tails, and as the shape grows the Student-t gets closer to the Normal.

In `garchFit()`, `cond.dist = "std"` gives a Student-t scaled to have variance 1, so \(z_t\) keeps its mean 0 and variance 1 and \(\sigma_t\) keeps its meaning. The block refits the model and prints the coefficient matrix.

```r
# Refit with Student-t errors and print the coefficient matrix
fit_std <- garchFit(~ garch(1, 1), data = r, cond.dist = "std", trace = FALSE)
fit_std@fit$matcoef
#>            Estimate   Std. Error   t value    Pr(>|t|)
#> mu     7.640502e-04 1.888625e-04  4.045537 5.22034e-05
#> omega  2.163043e-06 8.620199e-07  2.509273 1.20980e-02
#> alpha1 7.902217e-02 1.617481e-02  4.885507 1.03163e-06
#> beta1  9.035853e-01 2.010193e-02 44.950182 0.00000e+00
#> shape  6.038375e+00 8.140557e-01  7.417643 1.19238e-13
```

The shape is estimated at 6.04 with a standard error of 0.81, so the estimated tails are much heavier than a Normal's. The other coefficients move as well: alpha1 is 0.0790 (0.0684 before) and beta1 is 0.9036 (0.8876 before).

Now we compare the two fits. Both log-likelihoods are computed on the same 1,859 returns, so they can be compared, and the higher one fits better. But the Student-t model has one more parameter, so we also use two criteria that charge for the number of parameters k:

\[ \text{AIC} = -2 \log L + 2k \qquad \text{BIC} = -2 \log L + k \log n \]

Here \(\log L\) is the log-likelihood and n = 1,859 is the number of returns. Lower is better for both. The block computes them by hand.

```r
# Compare the two fits by log-likelihood, AIC and BIC
n <- length(r)
loglik <- c(normal = loglik_norm, student_t = unname(-fit_std@fit$value))
k <- c(normal = length(coef(fit_norm)), student_t = length(coef(fit_std)))

aic <- -2 * loglik + 2 * k
bic <- -2 * loglik + k * log(n)

round(rbind(loglik = loglik, aic = aic, bic = bic), 1)
#>          normal student_t
#> loglik   5966.2    6065.7
#> aic    -11924.4  -12121.5
#> bic    -11902.3  -12093.8
```

The Student-t log-likelihood is higher, 6065.7 against 5966.2. AIC is lower by 197, from -11924.4 to -12121.5, even after charging for the extra parameter. BIC charges 7.5 per parameter where AIC charges 2, and it is still lower by 191.5, from -11902.3 to -12093.8. Both criteria are lower for the Student-t fit, so it is the better fit.

The error distribution also moves the persistence. The next block compares the persistence and the half-life under the two fits.

```r
# Compare persistence and half-life under the two error distributions
persistence_by_fit <- c(
  normal    = unname(coef(fit_norm)["alpha1"] + coef(fit_norm)["beta1"]),
  student_t = unname(coef(fit_std)["alpha1"] + coef(fit_std)["beta1"])
)
half_life_by_fit <- log(0.5) / log(persistence_by_fit)

round(persistence_by_fit, 4)
#>    normal student_t
#>    0.9560    0.9826
round(half_life_by_fit, 1)
#>    normal student_t
#>      15.4      39.5
```

With Normal errors the persistence is 0.9560 and the half-life is 15.4 days. With Student-t errors the persistence rises to 0.9826 and the half-life to 39.5 days. So the error distribution changes the half-life of a shock's effect: about 15 days under the Normal and about 40 under the Student-t.

Finally we check the tails against the fitted Student-t, using tail probabilities from `pstd()`.

```r
# Count the Student-t standardised residuals beyond 3 and 4, against the fitted t
z_std <- residuals(fit_std, standardize = TRUE)
nu <- unname(coef(fit_std)["shape"])

data.frame(
  beyond   = cutoffs,
  observed = sapply(cutoffs, function(cut) sum(abs(z_std) > cut)),
  expected = round(n * 2 * pstd(-cutoffs, nu = nu), 2)
)
#>   beyond observed expected
#> 1      3       17    19.25
#> 2      4        4     4.99
```

The fitted Student-t expects 19.25 values beyond 3 in size and 4.99 beyond 4, and the data have 17 and 4. That is close, unlike the Normal fit, which expected 5.02 and 0.12 against 12 and 3 observed. The QQ plot below uses Student-t quantiles from `qstd()`, at the shape we estimated.

```r
# Draw the QQ plot of the standardised residuals against Student-t quantiles
qqplot(qstd(ppoints(n), nu = nu), z_std,
       xlab = "Student-t quantiles", ylab = "Standardised residuals")
abline(0, 1, col = "red")
```

The points now follow the line much more closely in both tails. The one exception is the lowest point, the -9.63% day, which is still far below the line.

The table below collects the two fits, and its toggle switches between a raw print and a report table.

::widget styled-table {"cols":["statistic","Normal","Student-t"],"rows":[["mu","0.000654","0.000764"],["omega","4.75e-06","2.16e-06"],["alpha1","0.0684","0.0790"],["beta1","0.8876","0.9036"],["shape","not applicable","6.04"],["persistence","0.9560","0.9826"],["half-life (days)","15.4","39.5"],["log-likelihood","5966.21","6065.74"],["AIC","-11924.4","-12121.5"],["BIC","-11902.3","-12093.8"]],"formats":{},"title":"GARCH(1,1) on DAX daily returns","note":"garchFit(), 1,859 daily returns"}

=== step === quiz
## Quick check: which error distribution fits the DAX returns better?

The table gives the two fits of the DAX returns. Which error distribution fits better, and what changes in the persistence?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The Normal, because it has one fewer parameter and so is the simpler model. ::no
- The Student-t: its AIC is lower by 197 even after paying for one extra parameter, and the persistence rises from 0.9560 to 0.9826. ::ok Yes. Both fits are log-likelihoods of the same 1,859 returns, so they can be compared, and AIC already charges for the extra shape parameter. The half-life of a shock also lengthens, from 15.4 days to 39.5.
- Neither is better: alpha1 and beta1 barely move, so the two fits are equal. ::no
- There is no way to say, because likelihoods from different error distributions cannot be compared. ::no The two fits model the same returns, so their log-likelihoods, AIC and BIC can be compared directly. The Student-t fit is better on all three, by 197 in AIC. It changes the persistence too: alpha1 and beta1 look close, but their sum moves from 0.9560 to 0.9826, which more than doubles the half-life.

=== step === tryit
## Your turn: what changes when the returns are in percent?

Returns are often quoted in percent instead of decimals. Refit the Student-t model on the returns multiplied by 100, with the same `garchFit()` call as before, and print the coefficients. Before you run it, predict which of mu, omega, alpha1, beta1 and shape change, and by what factor. `fit_std` still holds the Student-t fit on the decimal returns, so you can compare.

```r
# Refit the model on returns in percent and print its coefficients.
# r holds the decimal returns and fit_std holds the Student-t fit on them.
# Predict the change in each coefficient, then press Check.
```
::check {"regex": "^(?=[\\s\\S]*garchFit)(?=[\\s\\S]*cond[.]dist\\s*=\\s*.std.)(?=[\\s\\S]*(100\\s*[*]\\s*r|r\\s*[*]\\s*100))", "gate": true, "difficulty": "intermediate", "ok": "Right: mu is 100 times larger and omega is 10,000 times larger, while alpha1, beta1 and shape do not change. Omega is measured in squared return units, and alpha1 and beta1 multiply squared shocks and variances that are scaled together, so the scale cancels.", "no": "Multiply the returns by 100 first, for example `r_pct <- 100 * r`, then call `garchFit()` on `r_pct` with the same formula as before, the Student-t error distribution and `trace = FALSE`."}
::solution
```r
# Refit the Student-t model on returns in percent and compare with the first fit
r_pct <- 100 * r
fit_pct <- garchFit(~ garch(1, 1), data = r_pct, cond.dist = "std", trace = FALSE)

round(coef(fit_pct), 4)
#>     mu  omega alpha1  beta1  shape
#> 0.0764 0.0216 0.0790 0.9036 6.0384
round(coef(fit_pct) / coef(fit_std), 4)
#>     mu  omega alpha1  beta1  shape
#>    100  10000      1      1      1
```

Mu is 100 times larger and omega is 10,000 times larger, because omega is in squared return units and 100 squared is 10,000. Alpha1 and beta1 multiply squared shocks and variances, which are both scaled by 10,000, so the scale cancels. The shape describes the tails of \(z_t\), which has no units, so it does not change either.

=== step === concept
## References

- [Generalized autoregressive conditional heteroskedasticity](https://doi.org/10.1016/0304-4076(86)90063-1) - Bollerslev (1986), Journal of Econometrics 31(3), 307-327. The paper that introduced the GARCH model.
- [A conditionally heteroskedastic time series model for speculative prices and rates of return](https://doi.org/10.2307/1925546) - Bollerslev (1987), Review of Economics and Statistics 69(3), 542-547. GARCH with Student-t errors.
- [A forecast comparison of volatility models: does anything beat a GARCH(1,1)?](https://doi.org/10.1002/jae.800) - Hansen and Lunde (2005), Journal of Applied Econometrics 20(7), 873-889.
- [fGarch: Rmetrics, Autoregressive Conditional Heteroskedastic Modelling](https://cran.r-project.org/package=fGarch) - Wuertz, Setz and Chalabi, CRAN package documentation for `garchFit()`.
- [tseries: Time Series Analysis and Computational Finance](https://cran.r-project.org/package=tseries) - Trapletti and Hornik, CRAN package documentation for `garch()`.

=== step === complete
## Quick recap

You fitted GARCH(1,1) to 1,859 daily DAX returns with two packages, checked the fit, and compared two error distributions. To summarize:

- The Ljung-Box test gave p = 0.784 on the returns and p below 2.2e-16 on the squared returns, so the mean is constant and the variance changes over time.
- `tseries::garch()` and `fGarch::garchFit()` agree on alpha1 (0.0684) and beta1 (0.888). Their sum, 0.956, is the persistence, and it gives a half-life of 15.4 days.
- The fitted conditional standard deviation was 0.79% on day 35, the day of the -9.63% return, then 2.65% on day 36, and it was back to 0.91% by day 65.
- On the standardised residuals, p = 0.9999 for the squares shows no clustering left, but 12 values beyond 3 against 5.0 expected show heavier tails than a Normal.
- Student-t errors with a shape of 6.04 lowered AIC by 197 and moved alpha1 to 0.079 and beta1 to 0.904. That raises the persistence to 0.9826 and the half-life to 39.5 days.

The workflow is the same for any returns series: test for ARCH effects, fit, extract \(\sigma_t\), check the standardised residuals, and compare error distributions. The next part forecasts volatility several days ahead and turns a forecast into a one-day Value at Risk.
