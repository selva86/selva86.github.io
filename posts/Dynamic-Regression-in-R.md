---
title: "Dynamic Regression in R: Regression with ARIMA Errors"
slug: "Dynamic-Regression-in-R"
description: "Dynamic regression in R pairs linear regression with ARIMA errors to fix spurious results and give honest standard errors. Fit and forecast with auto.arima."
keywords: "dynamic regression in R, regression with ARIMA errors, auto.arima xreg, spurious regression, time series regression, ARIMA errors, forecast package, dynamic regression model"
auto_link_terms: "dynamic regression|dynamic regression in R|dynamic regression model|dynamic regression models|spurious regression|spurious regression in R|time series regression|regression with autocorrelated errors|autocorrelated errors|differencing in regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-19"
curriculum_id: "FR-arim-2"
post_type: "FR"
fr_parent: "SARIMA-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Dynamic regression is a forecasting model that pairs an ordinary regression on outside predictors with ARIMA-modeled errors. In R you fit one by passing your predictors to the <code>xreg</code> argument of <code>auto.arima()</code> from the forecast package, which keeps your estimates honest where an ordinary regression would mislead.</p>

## Why does ordinary regression fail on a time series?

Linear regression is the first tool most people reach for when one thing might explain another. On time series data it has a serious flaw: it reports strong relationships that are not real. Before we build anything, let's see the problem for ourselves on data where we already know the right answer.

Here is the trap in eight lines. We create two series that have absolutely nothing to do with each other. Each one is a random walk: it starts at zero and takes random steps, like a coin-flip stroll. They are generated from separate random numbers, so any link between them is pure chance. Then we regress one on the other and read the result.

```r title="Regress two unrelated random walks"
library(forecast)
library(ggplot2)

set.seed(8)
n <- 200
walk_x <- cumsum(rnorm(n))
walk_y <- cumsum(rnorm(n))

ols_spurious <- lm(walk_y ~ walk_x)
round(summary(ols_spurious)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  -0.6505     0.4914 -1.3236   0.1872
#> walk_x        1.1294     0.0508 22.2360   0.0000
```

Look at the `walk_x` row. The slope is 1.13, its t value is 22.24, and the p value is 0.0000. In any statistics class, those numbers say the effect is real and "highly significant." Yet we know the truth, because we built the data. There is no relationship at all. The regression is confidently describing a link that does not exist.

The R-squared makes it worse. It tells you what fraction of the movement in one series the other appears to explain.

```r title="Check the R-squared of the spurious fit"
round(summary(ols_spurious)$r.squared, 3)
#> [1] 0.714
```

An R-squared of 0.714 says `walk_x` explains 71% of `walk_y`. That would be an excellent model in any other setting. Here it means nothing. This failure has a name, spurious regression, and it happens because both series drift over time, so they often wander in loosely similar ways and look related purely by chance.

![How autocorrelated errors let ordinary regression report spurious significance and understated standard errors](screenshots/Dynamic-Regression-in-R-why-ols-fails.webp)
*Figure 1: How autocorrelated errors let ordinary regression report spurious significance and understated standard errors.*

The root cause is the regression's errors. Ordinary regression assumes its leftover errors are independent, one observation telling you nothing about the next. In a time series that assumption is almost never true: today's value is close to yesterday's, so the errors are autocorrelated. When the errors carry that hidden time structure, the significance test counts the same information many times over and reports far more certainty than it has earned.

[KEY INSIGHT]
**Two independent series can look strongly related when both drift over time.** Ordinary regression mistakes shared wandering for a real link, then reports a tiny p value because it wrongly assumes every observation is independent.

**Try it:** A different starting seed gives a different pair of unrelated walks, and the fake relationship shows up again. Run this and read the t value.

```r title="Your turn: a second spurious pair"
set.seed(15)
ex_x <- cumsum(rnorm(200))
ex_y <- cumsum(rnorm(200))
round(summary(lm(ex_y ~ ex_x))$coefficients["ex_x", ], 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="A second spurious pair"
set.seed(15)
ex_x <- cumsum(rnorm(200))
ex_y <- cumsum(rnorm(200))
round(summary(lm(ex_y ~ ex_x))$coefficients["ex_x", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|)
#>    -0.2003     0.0544    -3.6826     0.0003
```

**Explanation:** Two brand new unrelated walks, and the slope is again "significant" at a p value of 0.0003. Spurious regression is not a one-off fluke of one seed, it is what ordinary regression does to trending series in general.

</details>

## What is dynamic regression, and how does it fix this?

Dynamic regression fixes the trap without throwing away the regression you wanted in the first place. The idea is to give the model two jobs instead of one. The regression part still estimates how the predictor affects your series. A second part, an ARIMA model, is added to soak up the leftover time structure in the errors, so the errors the regression sees are finally the independent noise it always assumed.

That is why the honest name for this model is "regression with ARIMA errors." Written out, it is an ordinary straight-line regression where the error term is not plain noise but follows its own ARIMA process.

$$y_t = \beta_0 + \beta_1 x_t + n_t$$

Where:

- $y_t$ is the value of your series at time $t$
- $\beta_0$ is the intercept, the baseline level
- $\beta_1$ is the effect of the predictor, the number you usually care about
- $x_t$ is the predictor at time $t$
- $n_t$ is the error, which follows an ARIMA model instead of being independent noise

That last line is the whole trick. In an ordinary regression, $n_t$ is assumed independent. Dynamic regression lets $n_t$ carry the autocorrelation that time series always have, so the ARIMA part explains the memory and the regression part is left with an honest effect. If the math is not your thing, skip it: the practical point is that R handles $n_t$ for you.

Let's hand the exact same two random walks to a dynamic regression and see the fake relationship disappear. We use `auto.arima()` and pass the predictor through the `xreg` argument. That single argument is what turns `auto.arima()` from a plain forecaster into a dynamic regression.

```r title="Fit a dynamic regression on the same walks"
dyn_walk <- auto.arima(walk_y, xreg = walk_x)
dyn_walk
#> Series: walk_y 
#> Regression with ARIMA(0,1,1) errors 
#> 
#> Coefficients:
#>           ma1    xreg
#>       -0.1385  0.0107
#> s.e.   0.0641  0.0639
#> 
#> sigma^2 = 0.9473:  log likelihood = -275.98
#> AIC=557.96   AICc=558.09   BIC=567.84
```

Read the `xreg` coefficient: 0.0107, with a standard error of 0.0639. The effect is smaller than its own standard error, meaning it is statistically indistinguishable from zero. The verdict flipped completely. Ordinary regression said 1.13 and "highly significant." Dynamic regression, once it accounts for the time structure, says "no reliable effect here." That is the correct answer, because we built the two series to be unrelated.

Notice the label R printed, "Regression with ARIMA(0,1,1) errors." The `(0,1,1)` is the ARIMA model chosen for the errors, and the `1` in the middle is the key. It means the errors were differenced once, which is how the model stripped out the drift that fooled ordinary regression. We will unpack that middle number shortly.

[NOTE]
**This guide assumes you know the basics of ARIMA and its xreg argument.** If AR, MA, or differencing are new, read [ARIMA in R](ARIMA-in-R.html) first. For a mechanics-focused tour of `xreg` itself, [ARIMAX in R](ARIMAX-in-R.html) is the companion to this page, which focuses on why dynamic regression matters.

**Try it:** A quick way to judge an effect is its t ratio, the coefficient divided by its standard error. A value near zero means "no signal." Compute it for the `xreg` coefficient above.

```r title="Your turn: is the effect distinguishable from zero?"
round(coef(dyn_walk)["xreg"] / sqrt(diag(vcov(dyn_walk)))["xreg"], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="The t ratio of the spurious effect"
round(coef(dyn_walk)["xreg"] / sqrt(diag(vcov(dyn_walk)))["xreg"], 3)
#>  xreg 
#> 0.168 
```

**Explanation:** A t ratio of 0.168 is nowhere near the rough threshold of 2 that signals significance. Dynamic regression correctly reports the predictor as useless, exactly the opposite of the ordinary regression's t value of 22.

</details>

## How do you fit a dynamic regression in R?

Killing false signals is only half the value. Dynamic regression also measures real effects correctly, giving you the right slope with trustworthy uncertainty. To show this, we need data where a genuine relationship exists, so let's build one on purpose.

Imagine a business tracking daily signups against how much it spends on ads. We make signups genuinely depend on ad spend: each unit of spend truly adds 1.5 signups, and we bury that signal under autocorrelated noise so it behaves like a real, sticky series. Because we set the true effect ourselves, we know a good model should recover a slope near 1.5.

```r title="Build a series where the predictor truly matters"
set.seed(42)
m <- 180
ad_spend <- 20 + 6 * sin(2 * pi * (1:m) / 20) + rnorm(m, 0, 2)
signups  <- 50 + 1.5 * ad_spend + as.numeric(arima.sim(model = list(ar = 0.7), n = m, sd = 4))

ols_naive <- lm(signups ~ ad_spend)
round(summary(ols_naive)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  49.0546     1.4344 34.1981        0
#> ad_spend      1.5335     0.0699 21.9313        0
```

Ordinary regression estimates the slope at 1.5335, close to the true 1.5. So the point estimate is fine. The problem hides in the `Std. Error` column, 0.0699. Because the errors here are autocorrelated, that standard error is too small, and every conclusion about significance built on it is overconfident. Now fit the dynamic regression on the same data and watch the standard error tell the truth.

```r title="Fit the dynamic regression with xreg"
dyn_fit <- auto.arima(signups, xreg = cbind(ad_spend = ad_spend))
dyn_fit
#> Series: signups 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept  ad_spend
#>       0.5588    47.6455    1.6057
#> s.e.  0.0631     1.8896    0.0893
#> 
#> sigma^2 = 14.17:  log likelihood = -492.67
#> AIC=993.34   AICc=993.57   BIC=1006.11
```

The slope is 1.6057, again near the true 1.5. The model also found `ar1` of 0.56, which is the autocorrelation in the errors that ordinary regression ignored. The interesting comparison is the two standard errors side by side.

[TIP]
**Name your xreg columns with cbind for readable output.** Passing `cbind(ad_spend = ad_spend)` instead of a bare vector labels the coefficient `ad_spend` in the printout rather than the generic `xreg`, which pays off once you have several predictors to tell apart.

```r title="Compare the two standard errors"
round(c(OLS     = summary(ols_naive)$coefficients["ad_spend", "Std. Error"],
        Dynamic = unname(sqrt(diag(vcov(dyn_fit)))["ad_spend"])), 4)
#>     OLS Dynamic 
#>  0.0699  0.0893 
```

The dynamic-regression standard error, 0.0893, is about 28% wider than the ordinary 0.0699. Both models agree the effect is near 1.5, but they disagree about how sure we should be. Ordinary regression treated 180 autocorrelated points as if they carried more independent evidence than they really do, so it understated the uncertainty. The dynamic regression gives the same slope with an honest margin around it.

You do not have to let `auto.arima()` pick the error structure. When you want a specific ARIMA order, `Arima()` takes an `order` argument and the same `xreg`. Fitting the `(1, 0, 0)` structure by hand reproduces the automatic model exactly.

```r title="Fit the same model with a chosen order"
Arima(signups, order = c(1, 0, 0), xreg = cbind(ad_spend = ad_spend))
#> Series: signups 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept  ad_spend
#>       0.5588    47.6455    1.6057
#> s.e.  0.0631     1.8896    0.0893
#> 
#> sigma^2 = 14.17:  log likelihood = -492.67
#> AIC=993.34   AICc=993.57   BIC=1006.11
```

[WARNING]
**Your xreg rows must line up with the series and contain no gaps.** Row 1 of `xreg` must be the predictor at the same time as the first value of your series, and missing values will break or bias the fit. Align by date and fill or drop `NA` values before fitting.

The output is identical, which confirms `auto.arima()` chose `(1, 0, 0)` for us. In practice, let it choose unless you have a reason not to.

**Try it:** Pull the honest standard error of the `ad_spend` effect straight from the fitted model. This is the number you would report.

```r title="Your turn: read the honest standard error"
round(sqrt(diag(vcov(dyn_fit)))["ad_spend"], 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="The honest standard error"
round(sqrt(diag(vcov(dyn_fit)))["ad_spend"], 4)
#> ad_spend 
#>   0.0893 
```

**Explanation:** The `vcov()` function returns the model's variance-covariance matrix; the square root of its diagonal gives each coefficient's standard error. For `ad_spend` that is 0.0893, the trustworthy figure to quote rather than the ordinary regression's 0.0699.

</details>

## Why must the ARIMA errors be stationary?

You may have noticed the two models chose different middle numbers. The random-walk model differenced its errors, ARIMA(0,**1**,1), while the signups model did not, ARIMA(1,**0**,0). That middle number, the number of differences, is where dynamic regression does its most important work, so it is worth understanding.

Differencing means replacing each value with the change from the previous value. It exists to make a series stationary, meaning its behaviour, its average level and its swings, stays steady over time instead of drifting. Dynamic regression needs the ARIMA error to be stationary. When your series trends, the leftover error trends too, so `auto.arima()` differences it away by choosing a middle number of 1. That single step removes the shared drift that caused the spurious result in the first place.

R has a helper that reports how many differences a series needs. Run it on the random walk from the start of this tutorial.

```r title="Ask how many differences the walk needs"
ndiffs(walk_y)
#> [1] 1
```

The answer is 1, which is exactly the middle number the dynamic regression chose for that series. This is not a coincidence: `auto.arima()` runs this same check internally and differences the errors accordingly. To see that differencing is what defused the spurious link, we can do it by hand. Regressing the change in one walk on the change in the other should show no relationship.

```r title="Regress the changes instead of the levels"
round(summary(lm(diff(walk_y) ~ diff(walk_x)))$coefficients, 4)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   -0.0829     0.0696 -1.1915   0.2349
#> diff(walk_x)  -0.0020     0.0649 -0.0310   0.9753
```

The slope is now -0.0020 with a p value of 0.9753, as unrelated as it should be. Differencing by hand reached the same honest verdict that dynamic regression reached automatically. The lesson is that the drift, not any true link, drove the original 1.13 slope, and removing the drift removes the illusion.

[KEY INSIGHT]
**Differencing strips out the shared trend, and that is the engine under dynamic regression.** You never difference the predictors by hand for `auto.arima()`; it detects the need, differences the series and its errors together, and reports the middle number so you can see it happened.

**Try it:** The honest signups series was built to be stationary, so it should need no differencing at all. Confirm it.

```r title="Your turn: does the honest series need differencing?"
ndiffs(signups)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Differences needed by the stationary series"
ndiffs(signups)
#> [1] 0
```

**Explanation:** The answer is 0, so no differencing is needed, which matches the ARIMA(1,0,0) the model chose. A stationary series keeps its middle number at 0; a drifting one gets differenced. Dynamic regression adapts to whichever you have.

</details>

## How do you check the model and forecast?

Two jobs remain before you trust a dynamic regression: confirm the model is adequate, then forecast with it. Both are quick, and both have a catch worth knowing.

Checking the model means confirming the errors are finally white noise, plain random static with no leftover pattern. If any structure remains, the ARIMA part did not fully do its job. The `checkresiduals()` function runs a Ljung-Box test, where a p value above 0.05 means the residuals look like clean noise.

```r title="Check the residuals of the fit"
checkresiduals(dyn_fit)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from Regression with ARIMA(1,0,0) errors
#> Q* = 7.4867, df = 9, p-value = 0.5866
#> 
#> Model df: 1.   Total lags used: 10
```

The p value is 0.5866, comfortably above 0.05, so the residuals pass. The autocorrelation the ordinary regression left behind has been absorbed by the ARIMA part, and what remains is the independent noise the regression needs. This diagnostic is your proof that the standard errors can be trusted.

Now forecasting, and here is the catch. A dynamic regression cannot forecast on its own, because it needs the future values of its predictors. To predict signups next month, you must first tell the model what ad spend will be next month. You pass those future values through the same `xreg` argument, and the horizon is simply however many rows you supply.

```r title="Forecast ahead with future ad spend"
set.seed(7)
future_ad <- 20 + 6 * sin(2 * pi * ((m + 1):(m + 12)) / 20) + rnorm(12, 0, 2)
sign_fc <- forecast(dyn_fit, xreg = cbind(ad_spend = future_ad))
sign_fc
#>     Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 181       87.52832 82.70458 92.35206 80.15105 94.90559
#> 182       80.15196 74.62616 85.67775 71.70098 88.60293
#> 183       84.52641 78.79899 90.25383 75.76708 93.28574
#> 184       87.15217 81.36323 92.94111 78.29875 96.00559
#> 185       86.02709 80.21907 91.83511 77.14449 94.90969
#> 186       85.74052 79.92656 91.55449 76.84883 94.63221
#> 187       89.87808 84.06227 95.69390 80.98356 98.77261
#> 188       85.00289 79.18649 90.81928 76.10747 93.89830
#> 189       83.20220 77.38562 89.01878 74.30651 92.09789
#> 190       86.77839 80.96175 92.59502 77.88261 95.67416
#> 191       77.92087 72.10422 83.73753 69.02507 86.81668
#> 192       82.81660 76.99995 88.63326 73.92079 91.71241
```

Each row is one future month. The Point Forecast is the single best guess, and the interval columns give ranges: the model is 80% sure the value falls between Lo 80 and Hi 80, and 95% sure between Lo 95 and Hi 95. The forecasts rise and fall because the future ad spend we supplied rises and falls, and the slope of 1.6 carries that pattern into signups. A picture makes it clearer, and `autoplot()` draws the history and forecast together.

```r title="Plot the dynamic regression forecast"
autoplot(sign_fc) + ggtitle("Signups forecast driven by future ad spend")
```

[WARNING]
**A dynamic regression forecast is only as good as the future predictors you feed it.** If you supply wrong future ad spend, the signups forecast will be wrong no matter how well the model fits. Use it freely when the future predictor is known (a scheduled budget, a holiday flag) and with care when it must itself be forecast.

**Try it:** Forecast a shorter horizon by supplying only 6 future values. The horizon follows the number of rows you pass.

```r title="Your turn: forecast six periods"
set.seed(31)
ex_future <- 20 + 6 * sin(2 * pi * ((m + 1):(m + 6)) / 20) + rnorm(6, 0, 2)
forecast(dyn_fit, xreg = cbind(ad_spend = ex_future))
```

<details>
<summary>Click to reveal solution</summary>

```r title="A six-period forecast"
set.seed(31)
ex_future <- 20 + 6 * sin(2 * pi * ((m + 1):(m + 6)) / 20) + rnorm(6, 0, 2)
forecast(dyn_fit, xreg = cbind(ad_spend = ex_future))
#>     Point Forecast    Lo 80    Hi 80    Lo 95     Hi 95
#> 181       80.36160 75.53786 85.18534 72.98433  87.73887
#> 182       83.40357 77.87777 88.92936 74.95259  91.85454
#> 183       91.88060 86.15318 97.60802 83.12127 100.63993
#> 184       91.57463 85.78569 97.36357 82.72121 100.42805
#> 185       93.98144 88.17342 99.78946 85.09884 102.86404
#> 186       87.35441 81.54045 93.16838 78.46272  96.24610
```

**Explanation:** Six future values means a six-row forecast. There is no separate horizon setting to remember; the number of rows in `xreg` is the horizon.

</details>

## Complete Example: A real relationship that survives

The random walks were rigged to show a fake relationship collapse. Real economic data is more interesting: sometimes the relationship is genuine, and dynamic regression confirms it while ordinary regression exaggerates it. Let's test a real question on real numbers. Does the personal savings rate move consumer spending? Common sense says when people save a larger share of income, they spend a smaller one, so we expect a negative link.

The built-in `economics` dataset carries decades of monthly US figures, including `pce` (personal consumption expenditure, in billions of dollars) and `psavert` (the personal savings rate, in percent). We start with the naive approach, an ordinary regression of spending on the savings rate, and then inspect its residuals.

```r title="Fit a naive regression on real macro data"
econ <- economics
ols_econ <- lm(pce ~ psavert, data = econ)
round(summary(ols_econ)$coefficients, 3)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 12970.705    277.154  46.800        0
#> psavert      -951.369     30.575 -31.116        0
```

Ordinary regression reports a slope of -951, meaning each extra percentage point of savings rate is tied to $951 billion less spending, with a t value of -31. That is enormous and, taken at face value, decisive. But we have learned to be suspicious, so we check whether the residuals are autocorrelated, which would sink those standard errors.

```r title="Inspect the residual autocorrelation"
round(Acf(residuals(ols_econ), plot = FALSE)$acf[1:4], 3)
#> [1] 1.000 0.940 0.905 0.880
```

The first value is always 1, the residual's correlation with itself, so ignore it. The next values, 0.940 and 0.905, are enormous. The residuals are almost perfectly autocorrelated, which is a strong warning that the -951 slope is inflated by the shared trend of the two series, not a clean relationship. This is the same spurious regression from the opening, now inside real data, and dynamic regression fixes it here too.

```r title="Fit the dynamic regression on the real data"
dyn_econ <- auto.arima(econ$pce, xreg = econ$psavert)
dyn_econ
#> Series: econ$pce 
#> Regression with ARIMA(1,1,2) errors 
#> 
#> Coefficients:
#>          ar1      ma1     ma2    drift      xreg
#>       0.9569  -0.9475  0.1154  20.3088  -11.6365
#> s.e.  0.0245   0.0467  0.0442   3.6251    1.2455
#> 
#> sigma^2 = 532.4:  log likelihood = -2609.27
#> AIC=5230.55   AICc=5230.7   BIC=5256.65
```

The model chose ARIMA(1,1,2) errors, so it differenced once to remove the shared trend. The honest `xreg` coefficient is -11.64, with a standard error of 1.25, giving a t value near -9. The relationship is real and clearly significant, but it is roughly 80 times smaller than the -951 ordinary regression claimed. Most of that giant number was the trend both series happened to share, not a true effect of saving on spending. Before quoting the number, confirm the residuals are clean.

```r title="Check the residuals of the real-data model"
checkresiduals(dyn_econ)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from Regression with ARIMA(1,1,2) errors
#> Q* = 9.9629, df = 7, p-value = 0.1907
#> 
#> Model df: 3.   Total lags used: 10
```

The Ljung-Box p value is 0.1907, above 0.05, so the residuals pass as white noise and the standard error can be trusted. Finally, pull the coefficient out for reporting.

```r title="Extract the honest savings-rate effect"
round(coef(dyn_econ)["xreg"], 2)
#>   xreg 
#> -11.64 
```

[WARNING]
**Report the honest coefficient, not the inflated one.** Ordinary regression on trending series routinely produces effects that are too large and too significant. When a naive regression gives a huge slope and its residuals are strongly autocorrelated, treat the number as a warning sign, not a finding, and refit with dynamic regression.

The pairing tells the whole story of this tutorial. A fake relationship, the two random walks, collapses to nothing under dynamic regression. A real relationship, savings against spending, survives but shrinks to its honest size. Ordinary regression cannot tell those two situations apart. Dynamic regression can.

## Frequently Asked Questions

**What is dynamic regression in one sentence?** It is a linear regression whose error term is modeled as an ARIMA process, so the regression measures a predictor's effect while the ARIMA part absorbs the time structure that would otherwise corrupt the result.

**How is it different from ARIMAX or "ARIMA with xreg"?** In R's forecast package they use the same machinery: you pass predictors to `xreg` in `Arima()` or `auto.arima()`. "ARIMAX" usually emphasizes the mechanics of adding regressors to a forecaster, which [ARIMAX in R](ARIMAX-in-R.html) covers in depth. This page emphasizes the why: dynamic regression is the principled framework that keeps regression honest on time series. R prints what it actually fits as "Regression with ARIMA errors."

**Why not just use ordinary regression?** Because ordinary regression assumes independent errors, and time series errors are autocorrelated. That assumption failure produces spurious significance and standard errors that are too small, as the random-walk example showed. Dynamic regression repairs both problems.

**Do I need future values of the predictors to forecast?** Yes, and this is the main practical catch. To forecast ahead you must supply the predictors' future values through `xreg`. If they are known in advance (a budget, a calendar effect) you are safe; if not, you must forecast the predictor first, and its uncertainty flows into your final forecast.

**How do I know if I need to difference?** You usually do not decide by hand. `auto.arima()` runs unit-root tests and differences the errors when needed, reporting the choice as the middle number of the ARIMA order. The `ndiffs()` function shows the same recommendation for a single series if you want to check yourself.

## Practice Exercises

These combine ideas from across the tutorial. Each starter block runs as-is, so write your solution and then reveal ours to compare. The exercises use their own variable names so they will not clash with the code above.

### Exercise 1: Expose and fix a spurious link

Build two independent random walks of length 250 with `set.seed(303)`. First show that ordinary regression finds a "significant" slope between them, then show that a dynamic regression with `xreg` neutralizes it.

```r title="Your turn: expose then fix a spurious link"
# 1. set.seed(303); build ex1_x and ex1_y as random walks of length 250.
# 2. Fit lm(ex1_y ~ ex1_x) and read the slope's significance.
# 3. Fit auto.arima(ex1_y, xreg = ex1_x) and read the xreg coefficient and its SE.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Ordinary regression finds a fake slope"
set.seed(303)
ex1_x <- cumsum(rnorm(250))
ex1_y <- cumsum(rnorm(250))
round(summary(lm(ex1_y ~ ex1_x))$coefficients, 4)
#>             Estimate Std. Error  t value Pr(>|t|)
#> (Intercept)  10.9767     0.5174  21.2147        0
#> ex1_x        -1.3679     0.1115 -12.2634        0
```

```r title="Dynamic regression neutralizes it"
ex1_dyn <- auto.arima(ex1_y, xreg = ex1_x)
round(c(coef = coef(ex1_dyn)["xreg"], se = sqrt(diag(vcov(ex1_dyn)))["xreg"]), 4)
#> coef.xreg   se.xreg 
#>   -0.1140    0.0649 
```

**Explanation:** Ordinary regression reports a slope of -1.37 with a t value of -12, apparently rock solid. Dynamic regression shrinks the coefficient to -0.11 against a standard error of 0.06, so it is barely more than one standard error from zero. The "strong" relationship was an artifact of two shared drifts.

</details>

### Exercise 2: Recover a known effect and prove the model is adequate

Build a series `my_y` that truly depends on a predictor `my_x` with a slope of 0.8, plus autocorrelated noise, using `set.seed(101)` and length 300. Fit a dynamic regression, confirm it recovers the 0.8, and check that the residuals are white noise.

```r title="Your turn: recover an effect and validate it"
# Build my_x, then my_y = 100 + 0.8 * my_x + AR(1) noise (use ar = 0.85, sd = 4).
# Hint: arima.sim(model = list(ar = 0.85), n = 300, sd = 4) makes the noise.
# Fit auto.arima with xreg, read the my_x coefficient, then run checkresiduals().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Fit and recover the known slope"
set.seed(101)
mm <- 300
my_x <- 15 + 4 * sin(2 * pi * (1:mm) / 18) + rnorm(mm, 0, 2)
my_y <- 100 + 0.8 * my_x + as.numeric(arima.sim(model = list(ar = 0.85), n = mm, sd = 4))
my_dyn <- auto.arima(my_y, xreg = cbind(my_x = my_x))
round(coef(my_dyn)["my_x"], 3)
#>  my_x 
#> 0.833 
```

```r title="Confirm the residuals are white noise"
checkresiduals(my_dyn)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from Regression with ARIMA(1,0,1) errors
#> Q* = 8.9535, df = 8, p-value = 0.3462
#> 
#> Model df: 2.   Total lags used: 10
```

**Explanation:** The dynamic regression recovers a slope of 0.833, right on top of the true 0.8, and the Ljung-Box p value of 0.3462 confirms the residuals are clean noise. A recovered effect plus a passing residual check is exactly the evidence that your model is trustworthy.

</details>

### Exercise 3: Earn a second predictor with AICc

Using the `economics` data, fit a dynamic regression of `pce` on both `psavert` and `pop` (population). Compare its AICc to the single-predictor model `dyn_econ` from the Complete Example, then read the coefficients. Lower AICc is better.

```r title="Your turn: does a second predictor earn its place?"
# Build a two-column xreg from econ[, c("psavert", "pop")].
# Fit auto.arima(econ$pce, xreg = that matrix), call it dyn_two.
# Compare c(one = dyn_econ$aicc, two = dyn_two$aicc), then read both coefficients.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare one predictor against two by AICc"
X2 <- as.matrix(econ[, c("psavert", "pop")])
dyn_two <- auto.arima(econ$pce, xreg = X2)
c(one = dyn_econ$aicc, two = dyn_two$aicc)
#>      one      two 
#> 5230.696 5216.135
```

```r title="Read the two coefficients"
round(coef(dyn_two)[c("psavert", "pop")], 4)
#>  psavert      pop 
#> -11.9310  -0.0358
```

**Explanation:** Adding population lowers AICc from 5230.7 to 5216.1, a drop of about 15, so the second predictor earns its place. The savings-rate effect holds steady near -12, while the population coefficient is a small partial effect you should not over-read on its own. Comparing AICc with and without a predictor is how you decide whether to keep it.

</details>

## Summary

Dynamic regression is ordinary regression made safe for time series. You keep the regression that estimates your predictor's effect, and you add an ARIMA model for the errors so that autocorrelation and trend cannot corrupt the result. In R, one `xreg` argument turns `auto.arima()` into exactly this model.

![The dynamic regression workflow, from fitting with xreg to forecasting with future predictors](screenshots/Dynamic-Regression-in-R-workflow.webp)
*Figure 2: The dynamic regression workflow, from fitting with xreg to forecasting with future predictors.*

| Task | How | Key point |
|---|---|---|
| Fit | `auto.arima(y, xreg = X)` | The `xreg` argument makes it a dynamic regression |
| Control the order | `Arima(y, order, xreg = X)` | Set the ARIMA order for the errors by hand |
| Handle trend | Nothing extra | `auto.arima()` differences the errors for you |
| Check | `checkresiduals(fit)` | Ljung-Box p above 0.05 means the errors are clean |
| Forecast | `forecast(fit, xreg = future_X)` | You must supply future predictor values |
| Read the effect | `coef(fit)["xreg"]` | An honest slope with a trustworthy standard error |

Keep these takeaways close:

- **Ordinary regression lies on time series.** Autocorrelated errors produce spurious significance and standard errors that are far too small.
- **Dynamic regression splits the work in two.** A regression captures the predictor's effect, and an ARIMA model soaks up the leftover time structure.
- **Differencing removes the shared trend.** `auto.arima()` decides how much to difference and applies it to the series and its errors together, so you never difference predictors by hand.
- **Always check the residuals.** A passing Ljung-Box test is your proof that the standard errors, and therefore your conclusions, can be trusted.
- **Forecasting needs future predictors.** Unlike a plain ARIMA, a dynamic regression cannot project its own inputs forward.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 10: Dynamic regression models. [Link](https://otexts.com/fpp3/dynamic.html)
2. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 2nd edition. Section 9.2: Regression with ARIMA errors in R. [Link](https://otexts.com/fpp2/regarima.html)
3. Hyndman, R.J., & Khandakar, Y. - "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software*, 27(3), 2008. [Link](https://www.jstatsoft.org/article/view/v027i03)
4. Granger, C.W.J., & Newbold, P. - "Spurious regressions in econometrics." *Journal of Econometrics*, 2(2), 1974. [Link](https://doi.org/10.1016/0304-4076(74)90034-7)
5. forecast package - `auto.arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/auto.arima.html)
6. forecast package - `Arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/Arima.html)
7. ggplot2 - `economics` dataset reference. [Link](https://ggplot2.tidyverse.org/reference/economics.html)

## Continue Learning

- [ARIMAX in R](ARIMAX-in-R.html) - the companion page, covering the mechanics of the `xreg` argument in depth.
- [ARIMA in R](ARIMA-in-R.html) - the foundation this model builds on, covering what AR, I, and MA mean.
- [SARIMA in R](SARIMA-in-R.html) - the seasonal extension for series with a repeating yearly or weekly pattern.
- [ARIMA Diagnostics in R](ARIMA-Diagnostics-in-R.html) - go deeper on residual checks and the Ljung-Box test used here.
- [ACF and PACF in R](ACF-and-PACF-in-R.html) - the autocorrelation plots behind the residual diagnostics in this tutorial.
