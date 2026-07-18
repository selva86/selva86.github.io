---
title: "ARIMA Diagnostics in R: checkresiduals() and Ljung-Box"
slug: "ARIMA-Diagnostics-in-R"
description: "A good ARIMA model leaves white noise residuals. Learn to run checkresiduals() and the Ljung-Box test in R, read every output, and fix a failing model."
keywords: "ARIMA diagnostics in R, checkresiduals, Ljung-Box test, residual diagnostics, white noise residuals, Box.test, forecast package, time series model checking"
auto_link_terms: "ARIMA diagnostics|checkresiduals()|checkresiduals|Ljung-Box test|Ljung-Box|residual diagnostics|white noise residuals|Box.test()|portmanteau test|ACF of residuals|residual autocorrelation|model adequacy"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.13"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ARIMA Diagnostics"
sidebar_order: "14"
difficulty: "Intermediate"
---

<p class="lead">ARIMA diagnostics check whether a fitted model's leftovers, called residuals, are white noise: pure randomness with no pattern left to forecast. In R, one function, <code>checkresiduals()</code>, draws a time plot, an autocorrelation plot, and a histogram of those residuals and runs the Ljung-Box test, all in a single call. A Ljung-Box p-value above 0.05 means the residuals pass. This tutorial uses base R plus the <code>forecast</code> package.</p>

## What are ARIMA residuals, and why must they be white noise?

A residual is the gap between what actually happened and what your model predicted for that same point in time. Fit an ARIMA model, ask it to predict each observation one step ahead, subtract the prediction from the truth, and the pile of errors you are left with are the residuals. If those errors still trend, cycle, or repeat every twelve months, the model missed real structure that you could have forecast. A trustworthy model leaves residuals with no usable pattern at all.

That "no usable pattern" idea has a precise name: white noise. A white noise series has four traits, and every ARIMA diagnostic is really just a test for one of them.

- **Zero mean.** The errors are not consistently high or low, so the model is not biased.
- **Constant variance.** The spread of the errors stays steady over time, not calm early and wild later.
- **No autocorrelation.** Today's error tells you nothing about tomorrow's error.
- **Roughly normal.** The errors form a bell shape. This one is a bonus: it is needed for honest prediction intervals, not for the point forecast.

Let's make this concrete. We will fit an ARIMA model to `WWWusage`, a built-in series of 100 minute-by-minute readings of users connected to a web server. The `auto.arima()` function from the forecast package searches candidate models and returns the best one, so we can focus on the diagnostics rather than the model hunt.

```r title="Fit an ARIMA model with auto.arima"
library(forecast)

fit_good <- auto.arima(WWWusage)
fit_good
#> Series: WWWusage 
#> ARIMA(1,1,1) 
#> 
#> Coefficients:
#>          ar1     ma1
#>       0.6504  0.5256
#> s.e.  0.0842  0.0896
#> 
#> sigma^2 = 9.995:  log likelihood = -254.15
#> AIC=514.3   AICc=514.55   BIC=522.08
```

The printout tells us `auto.arima()` picked an ARIMA(1,1,1): one autoregressive term, one difference, and one moving-average term. The `ar1` and `ma1` rows are the estimated coefficients, and `sigma^2` is the variance of the residuals. This is the model whose residuals we are about to inspect. The coefficients look fine, but coefficients alone never tell you whether the model is good enough. Only the residuals can do that.

[KEY INSIGHT]
**Residuals are one-step-ahead forecast errors, so any pattern in them is forecastable signal the model left behind.** If tomorrow's error is predictable from today's, the model has not squeezed all the information out of the data, and you can build a better one.

**Try it:** Pull the residuals out of `fit_good` with `residuals()` and check the first two white-noise traits: is their mean near zero and is their variance stable? Store the residuals in `ex_res` and report the mean and variance.

```r title="Your turn: residual mean and variance"
# Extract the residuals and summarise them
ex_res <- residuals(fit_good)

# Report mean and variance here:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual mean and variance solution"
ex_res <- residuals(fit_good)
c(mean = round(mean(ex_res), 4), variance = round(var(ex_res), 3))
#>     mean variance 
#>   0.3036   9.7000
```

**Explanation:** The mean, 0.3036, sits close to zero relative to the residual spread, and the variance, 9.7, is roughly the `sigma^2` the model reported. Those are the first two boxes ticked. `checkresiduals()` will check the other two for us next.

</details>

## How do you run checkresiduals() in one line?

Checking each white-noise trait by hand would be tedious, so the forecast package bundles all of them into a single function. Pass a fitted model to `checkresiduals()` and it produces three diagnostic plots and prints a formal test of autocorrelation. It is the fastest honest answer to "is my model good enough?"

```r title="Run checkresiduals on the fitted model"
checkresiduals(fit_good)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,1,1)
#> Q* = 7.8338, df = 8, p-value = 0.4499
#> 
#> Model df: 2.   Total lags used: 10
```

Two things happen at once. A three-panel figure appears (we read it in the next section), and the text above is printed to the console. That text is the Ljung-Box test, the numerical verdict on whether the residuals still carry autocorrelation. The line that matters most is the p-value: 0.4499. Because it is comfortably above 0.05, the test finds no evidence of leftover autocorrelation, so the residuals behave like white noise and the model passes.

The `Model df: 2` and `Total lags used: 10` lines explain how the test was set up, and we unpack them when we reach the Ljung-Box section. For now, read the p-value first: high is good.

[WARNING]
**A large p-value is not proof that the model is correct, only that this one test found no leftover autocorrelation.** The Ljung-Box test can miss changing variance or a wrong functional form, so always glance at the plots too rather than trusting the p-value alone.

**Try it:** Sometimes you want the test result without redrawing the plots, for example inside a loop that fits many models. Ask `checkresiduals()` for the numbers only by setting `plot = FALSE`.

```r title="Your turn: get the test without plots"
# Print only the Ljung-Box result for fit_good

```

<details>
<summary>Click to reveal solution</summary>

```r title="Test-only output solution"
checkresiduals(fit_good, plot = FALSE)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,1,1)
#> Q* = 7.8338, df = 8, p-value = 0.4499
#> 
#> Model df: 2.   Total lags used: 10
```

**Explanation:** With `plot = FALSE` you get the exact same Ljung-Box test, just without the figure. This is handy when you are comparing dozens of models and only care about which ones pass.

</details>

## How do you read the three residual plots?

The figure `checkresiduals()` draws is where you catch problems the single p-value can hide. It stacks three views of the same residuals, and each one checks a different white-noise trait. Here is the figure for our passing model.

![The four-panel checkresiduals output for a passing model: flat residuals over time, an ACF with all spikes inside the bands, and a roughly normal histogram](screenshots/ARIMA-Diagnostics-in-R-checkresiduals-pass.png)
*Figure 1: The output of checkresiduals() for a model that passes. Flat residuals, ACF spikes inside the bands, and a roughly normal histogram.*

Read the panels like this:

- **Top: the residuals over time.** You want a formless cloud bouncing around zero with a steady width. Our top panel does exactly that, which supports the zero-mean and constant-variance traits. A funnel that widens to the right would signal changing variance.
- **Bottom left: the ACF, or autocorrelation function.** Each bar shows how strongly the residuals correlate with themselves a fixed number of steps (lags) apart. The two dashed blue lines are the "just noise" band, drawn at plus and minus $1.96/\sqrt{n}$. Bars inside the band are indistinguishable from zero. Every bar here sits inside the band, so there is no autocorrelation to worry about.
- **Bottom right: the histogram.** The bars are the residual distribution and the orange curve is a matched normal. A close match means prediction intervals will be trustworthy. Ours is roughly bell-shaped.

The ACF band is the workhorse, so let's compute it rather than eyeball it. With 100 observations, the band sits at $1.96/\sqrt{100} = 0.196$. We can count how many of the first ten autocorrelations poke outside it.

```r title="Count residual spikes outside the band"
res <- residuals(fit_good)
band <- 1.96 / sqrt(length(res))
round(band, 3)
#> [1] 0.196

acf_vals <- acf(res, lag.max = 10, plot = FALSE)$acf[-1]
sum(abs(acf_vals) > band)
#> [1] 0
```

We stored the residuals in `res`, computed the band width, and then pulled the autocorrelations straight from `acf()`, dropping the lag-0 value (which is always 1) with `[-1]`. The final line counts how many exceed the band. The answer is 0, which matches what the eye saw in Figure 1: every spike is inside the lines.

[KEY INSIGHT]
**The ACF panel is the one that decides adequacy, because it is the direct picture of leftover autocorrelation.** The time plot and histogram catch variance and normality problems, but the whole point of an ARIMA model is to remove autocorrelation, so a clean ACF is the headline result.

**Try it:** Ten lags is the default, but longer series can hide autocorrelation further out. Re-count the exceedances using the first 20 lags instead. Use `ex_band` and `ex_acf` so you do not overwrite `res`.

```r title="Your turn: recount at 20 lags"
ex_band <- 1.96 / sqrt(length(res))
# Count how many of the first 20 autocorrelations exceed ex_band

```

<details>
<summary>Click to reveal solution</summary>

```r title="Recount at 20 lags solution"
ex_band <- 1.96 / sqrt(length(res))
ex_acf <- acf(res, lag.max = 20, plot = FALSE)$acf[-1]
sum(abs(ex_acf) > ex_band)
#> [1] 0
```

**Explanation:** Even out to 20 lags, zero autocorrelations break the band. The residuals are clean at both short and long horizons, which is exactly what a white-noise series should look like.

</details>

## What is the Ljung-Box test and how do you read its p-value?

Eyeballing an ACF is fine for one model, but you need a single objective number when you compare models or automate the check. That number is the Ljung-Box test. Instead of judging each lag separately, it asks one combined question: taken together, are the first several autocorrelations all close enough to zero to be pure chance? Because it pools many lags into one statistic, it is called a portmanteau test.

The test is a hypothesis test, so it starts from a null hypothesis and tries to reject it.

- **Null hypothesis:** the residuals are white noise (no autocorrelation up to lag $h$).
- **A large p-value** (above 0.05) means you cannot reject the null, so the residuals look like white noise. This is the outcome you want.
- **A small p-value** (0.05 or below) means you reject the null, so autocorrelation remains and the model needs work.

![A flowchart turning a Ljung-Box p-value into a keep-or-revise decision](screenshots/ARIMA-Diagnostics-in-R-ljung-box-verdict.webp)
*Figure 2: How to turn a Ljung-Box p-value into a keep-or-revise decision.*

Notice the logic runs opposite to most tests you have seen: here a small p-value is bad news. That is because the null you are hoping to keep is the good outcome. If you want the formula behind the statistic, here it is. If not, skip to the next section, the code is all you need.

The test squares each autocorrelation, weights it, and adds the pieces up into a single statistic $Q^*$:

$$Q^* = n(n+2) \sum_{k=1}^{h} \frac{\hat{\rho}_k^{2}}{n-k}$$

Where:

- $n$ = the number of residuals
- $h$ = how many lags you test (labelled "Total lags used" in the output)
- $\hat{\rho}_k$ = the residual autocorrelation at lag $k$
- $Q^*$ = the pooled statistic, compared against a chi-squared distribution to get the p-value

The one subtlety is the degrees of freedom. You did not know the true model, you estimated it, and each estimated ARIMA term uses up a little of the data's freedom to wiggle. So the test subtracts the number of fitted terms from the lag count: $df = h - (p + q)$. In our WWWusage model that is $10 - 2 = 8$, which is the `df = 8` the output showed. That is also why the output printed `Model df: 2`: it is reminding you it already subtracted the two ARIMA coefficients.

To see the test behave, let's run it on a series we know is white noise, because we generate it from scratch with `rnorm()`.

```r title="Ljung-Box test on genuine white noise"
set.seed(2026)
wn <- ts(rnorm(120))
Box.test(wn, lag = 10, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  wn
#> X-squared = 10.463, df = 10, p-value = 0.4008
```

We drew 120 independent normal values, which are white noise by construction, and tested them. The p-value, 0.4008, is well above 0.05, so the test correctly declines to reject the null. This is the behaviour you want to see from residuals of a good model.

[NOTE]
**checkresiduals() subtracts the model's degrees of freedom for you, but a plain Box.test() on a raw series does not.** In the block above we tested a raw series with no model, so `df` equals the full 10 lags. When you test model residuals by hand, you must set that adjustment yourself, which is the next section.

**Try it:** Now run the test on a series that is obviously not white noise: the raw `AirPassengers` data, which trends upward and repeats every year. Predict the p-value before you run it.

```r title="Your turn: test a non-random series"
# Run a Ljung-Box test on the raw AirPassengers series at lag 10

```

<details>
<summary>Click to reveal solution</summary>

```r title="Non-random series solution"
Box.test(AirPassengers, lag = 10, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  AirPassengers
#> X-squared = 857.07, df = 10, p-value < 2.2e-16
```

**Explanation:** The statistic is very large and the p-value is essentially zero, so the test firmly rejects white noise. A raw seasonal, trending series carries strong autocorrelation at many lags, which is exactly the structure a good ARIMA model is supposed to remove from the residuals.

</details>

## How do you run the Ljung-Box test yourself with Box.test()?

`checkresiduals()` is the convenient front door, but under the hood it calls base R's `Box.test()`. Running `Box.test()` directly is useful when you want to choose your own lag, when you are not using forecast package objects, or when you simply want to understand what the wrapper is doing. The catch is that you have to supply the degrees-of-freedom adjustment yourself, through the `fitdf` argument.

Our WWWusage model is an ARIMA(1,1,1), so $p + q = 1 + 1 = 2$. We pass `fitdf = 2` to tell the test that two coefficients were estimated. Let's confirm it reproduces the `checkresiduals()` output exactly.

```r title="Reproduce checkresiduals with Box.test"
Box.test(residuals(fit_good), lag = 10, type = "Ljung-Box", fitdf = 2)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(fit_good)
#> X-squared = 7.8338, df = 8, p-value = 0.4499
```

The statistic 7.8338 and the p-value 0.4499 are identical to what `checkresiduals()` reported earlier. The one cosmetic difference is that `Box.test()` labels the statistic `X-squared` while `checkresiduals()` labels it `Q*`; they are the same number. Two rules make `Box.test()` match the wrapper:

- **Lag.** The wrapper's default is 10 lags for a non-seasonal series and twice the seasonal period for a seasonal one. We passed `lag = 10` to match.
- **fitdf.** Set it to the number of AR and MA terms, that is $p + q$ (plus seasonal $P + Q$ if present). Do not count the mean, drift, or intercept: those are not autoregressive or moving-average terms.

[TIP]
**Let checkresiduals() pick the lag and degrees of freedom, and reach for Box.test() only when you need to override them.** The wrapper knows your model's order and seasonal period, so it sets `fitdf` and `lag` correctly on its own, which removes the most common source of a wrong p-value.

**Try it:** See what happens when you forget the adjustment. Rerun the test on `fit_good` with `fitdf = 0` and compare the `df` and p-value to the correct version above.

```r title="Your turn: forget the fitdf adjustment"
# Rerun the test with fitdf = 0 and compare

```

<details>
<summary>Click to reveal solution</summary>

```r title="Wrong fitdf solution"
Box.test(residuals(fit_good), lag = 10, type = "Ljung-Box", fitdf = 0)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(fit_good)
#> X-squared = 7.8338, df = 10, p-value = 0.6451
```

**Explanation:** The statistic is unchanged, but `df` is now 10 instead of 8, and the p-value drifts to 0.6451. Forgetting `fitdf` makes the test too lenient, so a shaky model can slip through. The statistic stays the same; only the yardstick you compare it against moves.

</details>

## What should you do when a diagnostic fails?

A failing diagnostic is a to-do list, not a dead end. The residual plots tell you which white-noise trait broke, and each broken trait points to a specific fix. Let's manufacture a failure on purpose. `AirPassengers` has a strong yearly cycle, so if we fit a non-seasonal model with `Arima()`, it cannot capture the seasonality and the leftover pattern will show up in the residuals.

```r title="Fit a model that ignores seasonality"
fit_bad <- Arima(AirPassengers, order = c(2, 1, 1))
checkresiduals(fit_bad)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(2,1,1)
#> Q* = 216.35, df = 21, p-value < 2.2e-16
#> 
#> Model df: 3.   Total lags used: 24
```

The p-value is essentially zero, a decisive fail. The residuals still hold autocorrelation, which means real structure escaped the model. The plot shows exactly where.

![A failing checkresiduals output with tall ACF spikes at the seasonal lags](screenshots/ARIMA-Diagnostics-in-R-checkresiduals-fail.png)
*Figure 3: A failing diagnostic. The ACF shows tall spikes at the seasonal lags, so the model missed the yearly cycle.*

Look at the ACF panel: the bars at lag 12 and lag 24 rise far outside the band. Because the data is monthly, spikes at multiples of 12 mean the residuals still repeat every year. The model never learned the season. The fix is to add seasonal terms and, because the yearly swings in `AirPassengers` grow over time, to stabilise the variance with a log transform (`lambda = 0`).

```r title="Add seasonal terms and a log transform"
fit_seasonal <- Arima(AirPassengers, order = c(0, 1, 1),
                      seasonal = c(0, 1, 1), lambda = 0)
checkresiduals(fit_seasonal)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 26.446, df = 22, p-value = 0.233
#> 
#> Model df: 2.   Total lags used: 24
```

The p-value jumps from near zero to 0.233. By adding a seasonal moving-average term and a seasonal difference, and by taming the growing variance with the log transform, the residuals now pass. The seasonal spikes are gone. This is the whole loop in miniature: read the failure, change the matching part of the model, re-check.

Figure 4 maps the most common failures to their fixes.

![A decision guide matching each kind of diagnostic failure to a model change](screenshots/ARIMA-Diagnostics-in-R-fix-guide.webp)
*Figure 4: Which model change to try for each kind of diagnostic failure.*

[WARNING]
**Non-constant variance can pass the Ljung-Box test yet still ruin your prediction intervals, so never skip the time plot.** The test only looks for autocorrelation. A funnel shape in the top panel calls for a log or Box-Cox transform even when the p-value looks fine.

[TIP]
**If a hand-built fix still will not pass, let auto.arima() search harder with stepwise = FALSE and approximation = FALSE.** The default search is fast but greedy, and turning off those shortcuts makes it evaluate far more candidate models, which often finds an order your manual guess missed.

**Try it:** Confirm the repaired model really passes by printing just its Ljung-Box result.

```r title="Your turn: confirm the fix passes"
# Print the test-only result for fit_seasonal

```

<details>
<summary>Click to reveal solution</summary>

```r title="Confirm the fix solution"
checkresiduals(fit_seasonal, plot = FALSE)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 26.446, df = 22, p-value = 0.233
#> 
#> Model df: 2.   Total lags used: 24
```

**Explanation:** The p-value of 0.233 clears the 0.05 bar, so the seasonal model's residuals are white noise. The fix worked, and you can trust this model's forecasts.

</details>

## Complete Example: diagnose an ARIMA model end to end

Let's put every step together on a fresh series. `USAccDeaths` records monthly accidental deaths in the United States and has a clear yearly cycle. We will fit a model, diagnose it, and forecast only after it passes.

First, fit the model with `auto.arima()` and read what it chose.

```r title="Fit the model for the full workflow"
final_fit <- auto.arima(USAccDeaths)
final_fit
#> Series: USAccDeaths 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4303  -0.5528
#> s.e.   0.1228   0.1784
#> 
#> sigma^2 = 102860:  log likelihood = -425.44
#> AIC=856.88   AICc=857.32   BIC=863.11
```

The search landed on a seasonal model, ARIMA(0,1,1)(0,1,1)[12], which already accounts for the yearly pattern. Before we trust it, we diagnose the residuals.

```r title="Diagnose the fitted model"
checkresiduals(final_fit)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 13.467, df = 12, p-value = 0.336
#> 
#> Model df: 2.   Total lags used: 14
```

The p-value is 0.336, so the residuals pass the Ljung-Box test and the accompanying plots (which you will see when you run this) show no leftover pattern. The model has captured the structure in the series. Now, and only now, is it safe to forecast.

```r title="Forecast six months ahead"
forecast(final_fit, h = 6)
#>          Point Forecast    Lo 80     Hi 80    Lo 95     Hi 95
#> Jan 1979       8336.061 7924.712  8747.410 7706.957  8965.166
#> Feb 1979       7531.829 7058.464  8005.194 6807.880  8255.778
#> Mar 1979       8314.644 7786.496  8842.792 7506.911  9122.377
#> Apr 1979       8616.869 8039.109  9194.629 7733.261  9500.477
#> May 1979       9488.913 8865.476 10112.349 8535.449 10442.376
#> Jun 1979       9859.757 9193.770 10525.745 8841.218 10878.297
```

Each row is a future month with a point forecast and 80% and 95% prediction intervals. Those intervals are only believable because the residuals passed the diagnostics first. Diagnose, then forecast, in that order, every time.

[KEY INSIGHT]
**Once the residuals are white noise, you have extracted all the predictable structure, so both the point forecasts and the intervals are trustworthy.** Skipping the diagnostic step means you never learn whether the intervals are honest or wishful.

## Practice Exercises

These exercises combine the steps above. Use distinct variable names so you do not overwrite the tutorial's objects.

### Exercise 1: Fit and diagnose a new model

Fit an ARIMA model to the built-in `lh` series (48 readings of a luteinizing hormone level) with `auto.arima()`, run `checkresiduals()`, and decide whether the residuals pass. State the p-value and your verdict.

```r title="Exercise 1 starter"
# Fit auto.arima on lh, then run checkresiduals
# Hint: store the model in lh_fit

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
lh_fit <- auto.arima(lh)
lh_fit
checkresiduals(lh_fit, plot = FALSE)
#> Series: lh 
#> ARIMA(1,0,0) with non-zero mean 
#> 
#> Coefficients:
#>          ar1    mean
#>       0.5739  2.4133
#> s.e.  0.1161  0.1466
#> 
#> sigma^2 = 0.2061:  log likelihood = -29.38
#> AIC=64.76   AICc=65.3   BIC=70.37
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,0,0) with non-zero mean
#> Q* = 9.3564, df = 9, p-value = 0.405
#> 
#> Model df: 1.   Total lags used: 10
```

**Explanation:** `auto.arima()` chose an ARIMA(1,0,0) with a non-zero mean. The Ljung-Box p-value of 0.405 is above 0.05, so the residuals are white noise and the model passes.

</details>

### Exercise 2: Match the p-value with Box.test()

Reproduce the exact Ljung-Box p-value from Exercise 1 using `Box.test()` on `residuals(lh_fit)`. The trap: the model has a mean term. Work out the correct `fitdf` so your `df` matches the 9 that `checkresiduals()` reported.

```r title="Exercise 2 starter"
# Call Box.test on residuals(lh_fit) with the right lag and fitdf
# Hint: fitdf counts AR and MA terms only, not the mean

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
Box.test(residuals(lh_fit), lag = 10, type = "Ljung-Box", fitdf = 1)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(lh_fit)
#> X-squared = 9.3564, df = 9, p-value = 0.405
```

**Explanation:** The model is ARIMA(1,0,0), so $p + q = 1$: only the single AR term counts. The mean is not an AR or MA term, so it is excluded from `fitdf`. Passing `fitdf = 1` gives `df = 10 - 1 = 9` and the p-value 0.405, matching `checkresiduals()` exactly. If you had counted the mean and used `fitdf = 2`, the `df` would drop to 8 and the p-value would change.

</details>

### Exercise 3: Repair a failing model

The `fit_bad` model from earlier failed its diagnostics on `AirPassengers`. Build a repaired model, store it in `my_fix`, and show that its Ljung-Box test now passes. Let `auto.arima()` do the work, but stabilise the variance with a log transform.

```r title="Exercise 3 starter"
# Fit a better AirPassengers model into my_fix and diagnose it
# Hint: auto.arima has a lambda argument for transforms

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_fix <- auto.arima(AirPassengers, lambda = 0)
my_fix
checkresiduals(my_fix, plot = FALSE)
#> Series: AirPassengers 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> Box Cox transformation: lambda= 0 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#> 
#> sigma^2 = 0.001371:  log likelihood = 244.7
#> AIC=-483.4   AICc=-483.21   BIC=-474.77
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 26.446, df = 22, p-value = 0.233
#> 
#> Model df: 2.   Total lags used: 24
```

**Explanation:** Setting `lambda = 0` applies a log transform, and `auto.arima()` then finds a seasonal model on its own. The Ljung-Box p-value of 0.233 clears 0.05, so the repaired model passes where `fit_bad` failed.

</details>

## Frequently Asked Questions

### What counts as a good p-value for the Ljung-Box test?

Any p-value above 0.05 passes: it means the test cannot reject the null that the residuals are white noise, so no leftover autocorrelation was found. Read it the opposite way round to most tests, where a small p-value is the interesting result. A high p-value is not a score of overall model quality, only a sign that this one test found no autocorrelation.

### Why does checkresiduals() report a different p-value than Box.test()?

`checkresiduals()` subtracts your model's estimated terms through the degrees-of-freedom adjustment and picks the lag for you, while a bare `Box.test()` does neither. If you call `Box.test()` with `fitdf = 0`, the `df` is too high and the p-value comes out larger. Set `fitdf` to the number of AR and MA terms ($p + q$, plus seasonal $P + Q$) and use the same lag, and the two match exactly.

### How many lags should I test?

`checkresiduals()` uses 10 lags for a non-seasonal model and twice the seasonal period for a seasonal one, and those defaults are sensible starting points. Testing too few lags can miss autocorrelation that sits further out; testing too many spreads the statistic thin and weakens the test. When in doubt, let `checkresiduals()` choose.

### My residuals pass Ljung-Box but the forecasts still look off. Why?

The Ljung-Box test only looks for autocorrelation. It says nothing about changing variance or a wrong transform, and either of those can pass the test yet make the prediction intervals too narrow or too wide. Always read the residual time plot for a funnel shape and the histogram for skew, not just the p-value.

### Do I count the intercept, mean, or drift in fitdf?

No. `fitdf` counts only the autoregressive and moving-average terms, that is $p + q$ (and seasonal $P + Q$ if present). A mean, drift, or intercept term is not an AR or MA term, so it is excluded, which is the trap in Exercise 2 above.

## Summary

ARIMA diagnostics come down to one question asked four ways: are the residuals white noise? Here is the whole workflow at a glance.

![A mindmap of the ARIMA diagnostics workflow: good residual traits, the checkresiduals panels, the Ljung-Box test, and fixes to try](screenshots/ARIMA-Diagnostics-in-R-overview-mindmap.webp)
*Figure 5: The full ARIMA diagnostics workflow at a glance.*

The key takeaways:

| Check | Tool | Pass looks like |
|---|---|---|
| No autocorrelation | ACF panel, Ljung-Box test | Spikes inside the bands; p-value above 0.05 |
| Zero mean and steady variance | Residual time plot | A flat, even-width cloud around zero |
| Normal errors | Histogram panel | Bars matching the overlaid normal curve |
| Reproduce the test by hand | `Box.test(..., fitdf = p + q)` | Same statistic and p-value as the wrapper |

Three rules to carry forward. First, read the Ljung-Box p-value the opposite way to most tests: high means the model is good. Second, when you call `Box.test()` yourself, set `fitdf` to the count of AR and MA terms, never the mean or drift. Third, always diagnose before you forecast, because a prediction interval is only honest if the residuals that produced it are white noise.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd Edition. Section 3.3, Residual diagnostics. [Link](https://otexts.com/fpp3/diagnostics.html)
2. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd Edition. Section 9.7, ARIMA modelling in R. [Link](https://otexts.com/fpp3/arima-r.html)
3. forecast package - `checkresiduals()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/checkresiduals.html)
4. R Core Team - `Box.test()` documentation (stats package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/box.test.html)
5. Ljung, G.M., & Box, G.E.P. - "On a measure of lack of fit in time series models." *Biometrika* 65(2), 297-303 (1978). [Link](https://doi.org/10.1093/biomet/65.2.297)
6. R Core Team - *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [ARIMA in R](ARIMA-in-R.html): build ARIMA models from the ground up, the step before you diagnose them.
- [How to Choose ARIMA Order in R](How-to-Choose-ARIMA-Order-in-R.html): pick the p, d, and q values that give you white-noise residuals in the first place.
- [ETS vs ARIMA in R](ETS-vs-ARIMA-in-R.html): compare ARIMA with exponential smoothing and learn when each one wins.
