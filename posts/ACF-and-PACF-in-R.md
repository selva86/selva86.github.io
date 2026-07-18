---
title: "ACF and PACF in R: How to Read the Plots for ARIMA Orders"
slug: "ACF-and-PACF-in-R"
description: "Learn to read ACF and PACF plots in R to pick ARIMA p and q orders. See how cutoff vs decay patterns reveal AR, MA, and ARMA models, with runnable code."
keywords: "ACF and PACF in R, ACF PACF plots, ARIMA order selection, identify p and q, autocorrelation function R, partial autocorrelation R, acf() pacf(), AR MA order"
auto_link_terms: "ACF and PACF|ACF plot|PACF plot|autocorrelation function|partial autocorrelation function|partial autocorrelation|correlogram|ARIMA order|ARIMA orders|acf()|pacf()|identify p and q|AR and MA order"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ACF and PACF"
sidebar_order: 8
difficulty: "Intermediate"
---

<p class="lead">The ACF (autocorrelation function) measures how strongly each value in a time series correlates with its own past at every lag. The PACF (partial autocorrelation function) measures that same correlation after stripping out the shorter lags in between. Read the two plots together and their shape hands you the <code>p</code> and <code>q</code> orders for an ARIMA model.</p>

That last sentence is the whole promise of this guide, and by the end you will be able to keep it. We will use base R plus the `forecast` package, and every plot you meet here comes from a series where we already know the true answer, so you can check the reading against reality before you trust it on your own data.

## What do the ACF and PACF actually measure?

Before you can read a single plot, you need to know what those bars stand for. Autocorrelation is nothing exotic: it is ordinary correlation applied to a series and a shifted copy of itself. We will compute one by hand on eight numbers, then let R reproduce it, so the plot later is never a black box.

Here is the idea in code. We take a short series, line it up against a copy of itself shifted back by one step, and measure how tightly the two move together.

```r title="Autocorrelation at lag 1 by hand"
library(forecast)
library(ggplot2)

x <- c(2, 4, 6, 5, 7, 9, 8, 10)
n    <- length(x)
xbar <- mean(x)

# correlation of the series with a copy of itself shifted back one step
r1 <- sum((x[2:n] - xbar) * (x[1:(n - 1)] - xbar)) / sum((x - xbar)^2)
round(r1, 3)
#> [1] 0.456
```

The value `0.456` is the lag-1 autocorrelation. It is positive and fairly large, which says that a high value tends to be followed by another high value. That is the entire concept: autocorrelation at lag `k` is how much the series at time `t` looks like the series `k` steps earlier.

You will never compute this by hand again, because R does it for every lag at once. The `acf()` function returns the whole set, from lag 0 upward.

```r title="acf() reproduces the same number"
acf(x, plot = FALSE)
#> 
#> Autocorrelations of series 'x', by lag
#> 
#>      0      1      2      3      4      5      6      7 
#>  1.000  0.456  0.232  0.072 -0.292 -0.335 -0.315 -0.318 
```

Read the lag-1 entry: `0.456`, exactly the number we built by hand. Lag 0 is always `1.000` (a series is perfectly correlated with itself), so it carries no information and the plots you meet later hide it. The autocorrelation then fades to `0.232` at lag 2 and drifts negative by lag 4.

If you like the formal version, the autocorrelation at lag $k$ is

$$r_k = \frac{\sum_{t=k+1}^{n} (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^{n} (y_t - \bar{y})^2}$$

Where $y_t$ is the series, $\bar{y}$ is its mean, and $k$ is the lag. That is the exact recipe our by-hand code followed. If formulas are not your thing, skip it: the code above is all you need.

The PACF answers a subtler question. The lag-2 autocorrelation is partly secondhand: `y_t` relates to `y_{t-1}`, and `y_{t-1}` relates to `y_{t-2}`, so some of the lag-2 link is just the lag-1 link passed down the chain. Think of the height correlation between grandparents and grandchildren, much of which runs through the parents. The partial autocorrelation at lag 2 strips out that middle-man effect and reports only the direct grandparent-to-grandchild link. That distinction is exactly what separates AR order from MA order later.

**Try it:** Measure the direct-plus-indirect link at lag 2 on the same eight numbers. Pair `ex_x[3:8]` with `ex_x[1:6]` (both centred by their mean) and confirm you get the lag-2 value from the `acf()` table above.

```r title="Your turn: autocorrelation at lag 2"
# Goal: measure how the series at time t relates to two steps earlier.
ex_x <- c(2, 4, 6, 5, 7, 9, 8, 10)
ex_m <- mean(ex_x)
# Fill in the numerator, then divide by sum((ex_x - ex_m)^2):
# ex_r2 <- sum( ________ ) / sum((ex_x - ex_m)^2)
# round(ex_r2, 3)      # target: the lag-2 value 0.232
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lag-2 autocorrelation solution"
ex_r2 <- sum((ex_x[3:8] - ex_m) * (ex_x[1:6] - ex_m)) / sum((ex_x - ex_m)^2)
round(ex_r2, 3)
#> [1] 0.232
```

**Explanation:** Shifting by two steps pairs the 3rd-through-8th values with the 1st-through-6th. The result, `0.232`, matches the lag-2 entry from `acf()`, which is the reassuring point: the function is just doing this arithmetic for you.

</details>

## How do you plot the ACF and PACF in R, and what are the blue dashed lines?

Numbers in a table are hard to scan, so in practice you read pictures. R gives you two base functions, `acf()` and `pacf()`, and the `forecast` package adds prettier, gg-style versions: `Acf()`, `Pacf()`, and the all-in-one `ggtsdisplay()`, which stacks the series, its ACF, and its PACF in a single frame.

Let's generate a series whose true order we know so we have a benchmark. We simulate 200 points from an autoregressive process where each value leans 0.7 on the one before it, then display all three panels at once.

```r title="Plot a series with its ACF and PACF"
set.seed(101)
ar1 <- arima.sim(model = list(ar = 0.7), n = 200)
ggtsdisplay(ar1, main = "AR(1) series, phi = 0.7")
```

The top panel is the wandering series. The bottom-left panel is the ACF, and the bottom-right is the PACF. Each bar is a correlation at that lag. The pair of blue dashed lines is the part everyone squints at, so let's pin down exactly what they are.

The dashed lines mark the range where a bar is "basically zero", meaning indistinguishable from the wiggles you would see in pure noise. They sit at

$$\pm \frac{1.96}{\sqrt{n}}$$

Where $n$ is the number of observations. A bar poking outside the band is a genuine signal; a bar inside is noise you should ignore. For our 200-point series the band is:

```r title="Compute the significance band"
1.96 / sqrt(length(ar1))
#> [1] 0.1385929
```

So any bar taller than about `0.139` (or lower than `-0.139`) counts. That single number turns plot-reading from guesswork into a rule: compare each bar against the band and ask, in or out?

[NOTE]
**The forecast functions drop lag 0, base R keeps it.** Both `Acf()` and `Pacf()` from the forecast package start their tables at lag 1 because the lag-0 bar is always 1 and only squashes the interesting bars. Base `acf()` includes lag 0. Nothing else differs, so use whichever reads more clearly.

**Try it:** The built-in `lh` series (luteinizing hormone, 48 samples) is shorter than our simulated one. Work out where its dashed band would sit.

```r title="Your turn: the band for the lh series"
# The band is 1.96 / sqrt(n), and lh has length(lh) observations.
# ex_band <- 1.96 / sqrt(length(lh))
# round(ex_band, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Significance band solution"
ex_band <- 1.96 / sqrt(length(lh))
round(ex_band, 3)
#> [1] 0.283
```

**Explanation:** With only 48 points the band widens to `0.283`, more than double the band for our 200-point series. Fewer observations means more uncertainty, so bars must be taller to count. Always read a plot against its own band, never a remembered number.

</details>

## What do "cutoff" and "tail off" mean on these plots?

Two words carry the entire method, so let's make them concrete. A plot **cuts off** when its bars drop abruptly inside the band after some lag and stay there. A plot **tails off** when its bars shrink gradually, lag after lag, sometimes decaying smoothly and sometimes oscillating as they fade.

Our `ar1` series shows one of each. Look at its ACF as numbers first.

```r title="The ACF of ar1 tails off"
Acf(ar1, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'ar1', by lag
#> 
#>     0     1     2     3     4     5     6     7     8 
#> 1.000 0.666 0.407 0.177 0.067 0.056 0.052 0.085 0.108 
```

The bars shrink smoothly: `0.666`, then `0.407`, then `0.177`, each roughly 0.6 times the last. That gradual fade is a textbook tail-off. Nothing cuts; it just decays toward the band.

Now the PACF of the very same series.

```r title="The PACF of ar1 cuts off"
Pacf(ar1, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'ar1', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.666 -0.067 -0.122  0.029  0.080 -0.011  0.059  0.041 
```

Completely different shape. One tall bar at lag 1 (`0.666`, well outside the `0.139` band), then everything collapses inside the band and stays there. That abrupt drop after lag 1 is a cutoff. One plot tails off, the other cuts off, from identical data. That contrast is the fingerprint you will read for the rest of this guide.

Here is the map you are about to fill in. Over the next three sections we work through each of these four fingerprints and the model it points to.

![Four ACF and PACF fingerprints and the model each one indicates](screenshots/ACF-and-PACF-in-R-signatures.webp)
*Figure 1: The four ACF/PACF fingerprints and the model each one points to.*

[KEY INSIGHT]
**The ACF and PACF are a two-plot fingerprint, not two separate readings.** Neither plot means much alone. It is the pairing, one cutting off while the other tails off, that names the process. Always read them side by side.

**Try it:** Print just the first five partial autocorrelations of `ar1` and name the lag where the plot cuts off.

```r title="Your turn: find the PACF cutoff for ar1"
# The band for ar1 is about +/- 0.139.
# Which is the last lag clearly outside it?
# Pacf(ar1, plot = FALSE, lag.max = 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="PACF cutoff solution"
Pacf(ar1, plot = FALSE, lag.max = 5)
#> 
#> Partial autocorrelations of series 'ar1', by lag
#> 
#>      1      2      3      4      5 
#>  0.666 -0.067 -0.122  0.029  0.080 
```

**Explanation:** Only lag 1 (`0.666`) clears the band. Lags 2 through 5 all sit inside it, so the PACF cuts off after lag 1. In the next section you will see that a PACF cutting off at lag 1 is the signature of an AR(1) process, which is exactly how we built this series.

</details>

## How do you read the AR order (p) from the PACF?

An autoregressive process of order `p`, written AR(p), predicts each value from its own previous `p` values. Its fingerprint is fixed and reliable: **the ACF tails off, and the PACF cuts off at lag `p`.** So to find `p`, you look at the PACF and count how many bars stand outside the band before it collapses.

Let's prove it on a series we build to be AR(2), where each value depends on the two before it.

```r title="Simulate and display an AR(2) series"
set.seed(202)
ar2 <- arima.sim(model = list(ar = c(0.5, 0.3)), n = 300)
ggtsdisplay(ar2, main = "AR(2): PACF cuts off after lag 2")
```

The ACF panel tails off gradually, as it did for AR(1). The PACF panel is where you read the order. Let's see it as numbers.

```r title="Read p from the PACF of ar2"
Pacf(ar2, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'ar2', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.767  0.299 -0.103  0.011  0.061 -0.016  0.146 -0.016 
```

With 300 points the band is about `0.113`. Lags 1 (`0.767`) and 2 (`0.299`) clear it comfortably; lag 3 (`-0.103`) falls just inside; everything after is noise. The PACF cuts off after lag 2, so you read `p = 2`, which matches the process we simulated. The rule is simply: the last PACF bar outside the band is your `p`.

**Try it:** Simulate a series that depends on its previous three values (an AR(3)) and read `p` from the PACF.

```r title="Your turn: read p for an AR(3)"
# set.seed(210)
# ex_ar3 <- arima.sim(model = list(ar = c(0.3, 0.2, 0.3)), n = 400)
# Pacf(ex_ar3, plot = FALSE, lag.max = 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AR(3) PACF solution"
set.seed(210)
ex_ar3 <- arima.sim(model = list(ar = c(0.3, 0.2, 0.3)), n = 400)
Pacf(ex_ar3, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'ex_ar3', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.554  0.303  0.250  0.039 -0.016  0.010  0.105 -0.015 
```

**Explanation:** With 400 points the band is about `0.098`. Lags 1, 2, and 3 (`0.554`, `0.303`, `0.250`) all clear it, then lag 4 drops inside, so the cutoff is at lag 3 and `p = 3`. Notice lag 7 (`0.105`) pokes a hair outside the band too. That is a chance spike, not a real order-7 term: with many lags, roughly 1 in 20 will cross the band by luck, so ignore isolated bars far from the others.

</details>

## How do you read the MA order (q) from the ACF?

A moving-average process of order `q`, written MA(q), builds each value from the last `q` random shocks rather than the last `q` values. Its fingerprint is the mirror image of the AR case: **the ACF cuts off at lag `q`, and the PACF tails off.** So for `q` you read the ACF, not the PACF.

Let's watch it happen on a series built to be MA(1).

```r title="Simulate and display an MA(1) series"
set.seed(303)
ma1 <- arima.sim(model = list(ma = 0.8), n = 300)
ggtsdisplay(ma1, main = "MA(1): ACF cuts off after lag 1")
```

This time the roles swap: the PACF panel decays gradually while the ACF panel has one spike and then nothing. Read the ACF as numbers to confirm.

```r title="Read q from the ACF of ma1"
Acf(ma1, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'ma1', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000  0.459 -0.064 -0.080 -0.023  0.093  0.071  0.000  0.043 
```

Lag 1 (`0.459`) clears the `0.113` band; lag 2 (`-0.064`) is already inside; the rest is noise. The ACF cuts off after lag 1, so `q = 1`, exactly the process we simulated.

[WARNING]
**Do not read the order off the wrong plot.** AR order lives in the PACF, MA order lives in the ACF. Because the two signatures are mirror images, it is easy to glance at the tailing-off plot and start counting bars on it. Always pair the cutting-off plot with the order you are after: PACF for p, ACF for q.

**Try it:** Simulate an MA(2), where each value carries two shocks, and read `q` from its ACF.

```r title="Your turn: read q for an MA(2)"
# set.seed(311)
# ex_ma2 <- arima.sim(model = list(ma = c(0.7, 0.5)), n = 400)
# Acf(ex_ma2, plot = FALSE, lag.max = 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="MA(2) ACF solution"
set.seed(311)
ex_ma2 <- arima.sim(model = list(ma = c(0.7, 0.5)), n = 400)
Acf(ex_ma2, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'ex_ma2', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000  0.601  0.270  0.019 -0.016 -0.025  0.009  0.045  0.068 
```

**Explanation:** Lags 1 (`0.601`) and 2 (`0.270`) sit outside the `0.098` band, then lag 3 (`0.019`) drops inside. The ACF cuts off after lag 2, so `q = 2`, the order we built.

</details>

## What if both plots tail off? Reading a mixed ARMA

Real data is rarely as tidy as a pure AR or pure MA. When a process has both autoregressive and moving-average parts, an ARMA(p, q), neither plot gives you a clean cutoff. **Both the ACF and the PACF tail off.** That is itself a signature: gradual decay in both plots tells you that you need both kinds of term.

Let's simulate an ARMA(1,1) and look.

```r title="Simulate and display an ARMA(1,1) series"
set.seed(404)
arma11 <- arima.sim(model = list(ar = 0.6, ma = 0.4), n = 400)
ggtsdisplay(arma11, main = "ARMA(1,1): both plots tail off")
```

Neither panel snaps to zero after a lag or two; both fade out. When you see this, stop trying to count bars, because the exact `p` and `q` are not visible in the plots. Instead you fit a few small candidate models and let an information criterion pick the best trade-off between fit and simplicity. The `auto.arima()` function does exactly that search.

```r title="Let auto.arima search small orders"
auto.arima(arma11, seasonal = FALSE, stepwise = FALSE, approximation = FALSE)
#> Series: arma11 
#> ARIMA(2,0,0) with zero mean 
#> 
#> Coefficients:
#>          ar1      ar2
#>       0.9742  -0.2620
#> s.e.  0.0482   0.0483
#> 
#> sigma^2 = 0.9192:  log likelihood = -550.25
#> AIC=1106.49   AICc=1106.55   BIC=1118.47
```

Interesting result worth pausing on. We simulated an ARMA(1,1), but the search picked ARIMA(2,0,0), a pure AR(2). That is not a bug. An ARMA(1,1) can be closely mimicked by an AR(2), and here the simpler AR(2) scored a lower AICc, so it won. This is the honest reality of mixed processes: several orders fit almost equally well, which is precisely why the plots alone cannot settle it and why you confirm your choice later with residual checks.

[TIP]
**When both plots tail off, start near ARIMA(1,0,1) and compare neighbours by AICc.** Fit a small grid of candidates such as (1,0,1), (2,0,0), and (0,0,2), then keep the lowest AICc. The AICc rewards fit but penalises extra parameters, so it naturally prefers the simplest model that explains the data.

**Try it:** Compare the AICc of an AR(2) and an ARMA(1,1) fit to `arma11` and see which the criterion prefers.

```r title="Your turn: let AICc choose"
# fit_ar2  <- Arima(arma11, order = c(2, 0, 0))
# fit_arma <- Arima(arma11, order = c(1, 0, 1))
# round(c(AR2 = fit_ar2$aicc, ARMA11 = fit_arma$aicc), 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AICc comparison solution"
fit_ar2  <- Arima(arma11, order = c(2, 0, 0))
fit_arma <- Arima(arma11, order = c(1, 0, 1))
round(c(AR2 = fit_ar2$aicc, ARMA11 = fit_arma$aicc), 2)
#>     AR2  ARMA11 
#> 1108.59 1112.66 
```

**Explanation:** The AR(2) scores `1108.59` against the ARMA(1,1) at `1112.66`. Lower is better, so AICc prefers the AR(2), which is why `auto.arima()` chose it. When the plots are ambiguous, this numeric comparison is your tie-breaker.

</details>

## How does the ACF tell you when to difference (the d in ARIMA)?

Everything so far assumed the series is stationary, meaning its mean and variance do not drift over time. If a series trends or wanders, the ACF and PACF rules break down, and the ACF itself is what warns you. **A non-stationary series shows an ACF that stays high and decays very slowly, almost in a straight line, across many lags.**

The `d` in ARIMA is the number of times you difference the series (subtract each value from the next) to remove that drift. Let's build a random walk, the classic non-stationary series, and look at its ACF.

```r title="A non-stationary series and its slow ACF"
set.seed(505)
rw <- ts(cumsum(rnorm(300)))
ggtsdisplay(rw, main = "Random walk: ACF decays very slowly")
```

The series clearly wanders with no fixed level. Its ACF tells the same story in numbers.

```r title="The ACF of a random walk barely decays"
Acf(rw, plot = FALSE, lag.max = 6)
#> 
#> Autocorrelations of series 'rw', by lag
#> 
#>     0     1     2     3     4     5     6 
#> 1.000 0.920 0.850 0.792 0.734 0.668 0.597 
```

That is the tell-tale sign: `0.920`, `0.850`, `0.792`, a long, slow, nearly linear slide. The series does not tend back toward a fixed level, so distant values stay strongly correlated. The fix is to difference once and re-check.

```r title="After one difference, the ACF collapses"
Acf(diff(rw), plot = FALSE, lag.max = 6)
#> 
#> Autocorrelations of series 'diff(rw)', by lag
#> 
#>      0      1      2      3      4      5      6 
#>  1.000 -0.047 -0.036  0.020  0.062  0.046  0.021 
```

One difference and the slow decay is gone: every bar from lag 1 on sits inside the band. The differenced series is white noise, which for a random walk is exactly right, and it tells you `d = 1`. The workflow is always this: if the ACF decays slowly, difference the series, then read the ACF and PACF of the differenced version for `p` and `q`. (If you want the formal stationarity tests that back up this visual check, see [Test for Stationarity in R](Test-Stationarity-in-R.html).)

[WARNING]
**Stop differencing as soon as the slow decay disappears, or you will over-difference.** If you difference a series that is already stationary, the lag-1 autocorrelation turns strongly negative, often near -0.5. That negative spike is the signal to undo the last difference. More differencing is not safer; it adds noise instead of removing it.

**Try it:** Difference the random walk one time too many and watch the over-differencing signature appear at lag 1.

```r title="Your turn: what over-differencing looks like"
# Difference twice, then inspect lag 1 of the ACF.
# Acf(diff(diff(rw)), plot = FALSE, lag.max = 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Over-differencing solution"
Acf(diff(diff(rw)), plot = FALSE, lag.max = 3)
#> 
#> Autocorrelations of series 'diff(diff(rw))', by lag
#> 
#>      0      1      2      3 
#>  1.000 -0.507 -0.020  0.008 
```

**Explanation:** One difference already made the random walk stationary. The second difference over-does it, and the lag-1 autocorrelation drops to `-0.507`, the classic strong-negative signal of an over-differenced series. Lesson: difference the minimum number of times that removes the slow decay, and no more.

</details>

## How do you handle seasonal spikes in the ACF and PACF?

Many real series repeat on a calendar: monthly sales peak every December, temperatures cycle every 12 months. Seasonality leaves an unmistakable mark: **the ACF shows spikes at multiples of the seasonal period**, for example at lags 12, 24, and 36 for monthly data.

The built-in `AirPassengers` series counts monthly airline passengers and has both a rising trend and a yearly cycle. We difference once to strip the trend so the seasonal pattern stands out cleanly, then plot the ACF out to 36 lags.

```r title="Seasonal spikes in a monthly series"
ggAcf(diff(AirPassengers), lag.max = 36) +
  ggtitle("Differenced airline passengers: spikes every 12 lags")
```

The bars rise sharply at lags 12, 24, and 36, one big spike per year. Read those same lags as numbers to see the size of the seasonal correlation.

```r title="Read the seasonal lag from the ACF"
Acf(diff(AirPassengers), plot = FALSE, lag.max = 13)
#> 
#> Autocorrelations of series 'diff(AirPassengers)', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10     11     12     13 
#>  1.000  0.303 -0.102 -0.241 -0.300 -0.094 -0.078 -0.092 -0.295 -0.192 -0.105  0.283  0.829  0.285 
```

Lag 12 stands at `0.829`, far above its neighbours. That single dominant spike at the seasonal period is your cue to add a seasonal term, which in a full model means moving from ARIMA to seasonal ARIMA (SARIMA). The same cutoff-versus-tail-off reading then applies again, but at the seasonal lags 12, 24, 36 instead of 1, 2, 3.

**Try it:** Apply a seasonal difference (lag 12) on top of the regular difference and check whether the giant lag-12 spike has collapsed.

```r title="Your turn: remove the seasonal spike"
# A seasonal difference subtracts the value 12 months earlier.
# Acf(diff(diff(AirPassengers), lag = 12), plot = FALSE, lag.max = 13)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal differencing solution"
Acf(diff(diff(AirPassengers), lag = 12), plot = FALSE, lag.max = 13)
#> 
#> Autocorrelations of series 'diff(diff(AirPassengers), lag = 12)', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10     11     12     13 
#>  1.000 -0.310  0.095 -0.097 -0.099  0.061  0.000 -0.056 -0.061  0.176 -0.140  0.070 -0.134  0.087 
```

**Explanation:** After the seasonal difference the lag-12 autocorrelation falls from `0.829` all the way to `-0.134`, inside the band. The yearly spike is gone, which tells you a seasonal difference (a seasonal `d` of 1) was the right move. What remains at the low lags is the ordinary, non-seasonal structure you read as before.

</details>

## Complete example: choose and confirm an ARIMA order

You now have every piece. Let's run the whole workflow end to end on a real dataset you have not seen, following the loop below from raw series to a confirmed model.

![The order identification loop from raw series to a confirmed model](screenshots/ACF-and-PACF-in-R-workflow.webp)
*Figure 2: The order-identification loop from raw series to a confirmed model.*

The `LakeHuron` series records the water level of Lake Huron in feet, once a year from 1875 to 1972. First, look at it.

```r title="Plot the Lake Huron series"
autoplot(LakeHuron) +
  ggtitle("Lake Huron water level, 1875 to 1972")
```

The level drifts around a stable range without a strong trend, so it looks stationary enough to read directly, meaning we can try `d = 0`. Next, the two diagnostic plots.

```r title="ACF and PACF of Lake Huron"
ggtsdisplay(LakeHuron, main = "Lake Huron: ACF tails off, PACF cuts off")
```

The ACF tails off gradually and the PACF cuts off early. That is the AR signature, so we read `p` from the PACF.

```r title="Read p from the Lake Huron PACF"
Pacf(LakeHuron, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'LakeHuron', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.832 -0.267  0.131  0.034  0.062 -0.021  0.092  0.045 
```

With 98 observations the band is about `0.198`. Lag 1 (`0.832`) and lag 2 (`-0.267`) clear it; lag 3 (`0.131`) sits inside. The PACF cuts off after lag 2, so our candidate is ARIMA(2, 0, 0). The three numbers in that order are always `(p, d, q)`: here `p = 2` (the AR order we just read from the PACF), `d = 0` (no differencing, since the series is already stationary), and `q = 0` (no MA term). The `Arima()` function takes exactly that vector as its `order` argument. Now fit it.

```r title="Fit the candidate ARIMA(2,0,0)"
fit <- Arima(LakeHuron, order = c(2, 0, 0))
fit
#> Series: LakeHuron 
#> ARIMA(2,0,0) with non-zero mean 
#> 
#> Coefficients:
#>          ar1      ar2      mean
#>       1.0436  -0.2495  579.0473
#> s.e.  0.0983   0.1008    0.3319
#> 
#> sigma^2 = 0.4939:  log likelihood = -103.63
#> AIC=215.27   AICc=215.7   BIC=225.61
```

Both AR coefficients are several standard errors from zero, which is a good sign the order is real. But a model that fits is not yet a model you trust. The final check is the residuals: if the model captured all the structure, what is left over should be white noise, with an ACF that stays inside the band. The `checkresiduals()` function plots that residual ACF and runs the Ljung-Box test, which asks a single question, are the residual autocorrelations jointly indistinguishable from zero?

```r title="Confirm the order with residual diagnostics"
checkresiduals(fit)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(2,0,0) with non-zero mean
#> Q* = 5.9457, df = 8, p-value = 0.6533
#> 
#> Model df: 2.   Total lags used: 10
```

The Ljung-Box p-value is `0.6533`, comfortably above 0.05. A high p-value here is the good outcome: it means we cannot reject the idea that the residuals are white noise, so no autocorrelation is left unexplained. Our ARIMA(2, 0, 0), read straight off the PACF, is confirmed.

[KEY INSIGHT]
**Read a candidate order from the plots, then confirm it with the residuals.** ACF and PACF reading gives you a strong candidate quickly, but it is a starting point, not a verdict. Always fit the model and confirm that its residuals are white noise. If the residual ACF still has bars outside the band or the Ljung-Box p-value is small, raise `p` or `q` and refit.

## Practice Exercises

These combine several steps. Try each before opening the solution, and note the distinct variable names so your work does not clash with the tutorial's series.

### Exercise 1: Identify a moving-average order

Simulate a series with two moving-average terms and read its order. Decide first which plot carries the answer, then read `q` from it.

```r title="Your turn: identify the MA order"
# set.seed(700)
# my_ma <- arima.sim(model = list(ma = c(0.6, -0.3)), n = 400)
# Acf(my_ma, plot = FALSE, lag.max = 8)   # read q from the ACF, not the PACF
```

<details>
<summary>Click to reveal solution</summary>

```r title="MA(2) identification solution"
set.seed(700)
my_ma <- arima.sim(model = list(ma = c(0.6, -0.3)), n = 400)
Acf(my_ma, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'my_ma', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000  0.342 -0.127  0.048  0.013 -0.108 -0.058  0.065  0.010 
```

**Explanation:** This is a moving-average process, so the order lives in the ACF. Lags 1 (`0.342`) and 2 (`-0.127`) clear the `0.098` band, then lag 3 (`0.048`) drops inside. The ACF cuts off after lag 2, so `q = 2`, which matches the two MA terms we simulated.

</details>

### Exercise 2: Run the full workflow on real data

The built-in `lh` series has 48 samples of luteinizing hormone. Run the complete loop: inspect the ACF and PACF, pick an order, fit it, and confirm with the Ljung-Box test.

```r title="Your turn: the full workflow on lh"
# ggtsdisplay(lh, main = "lh: which signature is this?")
# Pacf(lh, plot = FALSE, lag.max = 8)
# my_fit <- Arima(lh, order = c(1, 0, 0))   # use the p you read
# checkresiduals(my_fit)
```

<details>
<summary>Click to reveal solution</summary>

```r title="lh workflow solution"
Pacf(lh, plot = FALSE, lag.max = 8)
my_fit <- Arima(lh, order = c(1, 0, 0))
my_fit
checkresiduals(my_fit)
#> 
#> Partial autocorrelations of series 'lh', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.576 -0.223 -0.227  0.103 -0.076  0.068 -0.104  0.012 
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

**Explanation:** The band for 48 points is `0.283`. Only lag 1 of the PACF (`0.576`) clears it, so the PACF cuts off after lag 1 and `p = 1`. The series has no slow-decaying ACF, so `d = 0`. Fitting ARIMA(1, 0, 0) gives a Ljung-Box p-value of `0.405`, well above 0.05, so the residuals are white noise and the order is confirmed.

</details>

### Exercise 3: Tell AR(1) from MA(1)

Here are two mystery series simulated for you. One is AR(1), the other is MA(1). Use the cutoff-versus-tail-off fingerprint to decide which is which.

```r title="Your turn: AR(1) or MA(1)?"
# set.seed(808)
# mystery_a <- arima.sim(model = list(ar = 0.8), n = 300)
# mystery_b <- arima.sim(model = list(ma = 0.8), n = 300)
# Compare each series' ACF and PACF and match it to a signature.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two mystery series solution"
set.seed(808)
mystery_a <- arima.sim(model = list(ar = 0.8), n = 300)
mystery_b <- arima.sim(model = list(ma = 0.8), n = 300)
Acf(mystery_a,  plot = FALSE, lag.max = 6)
Pacf(mystery_a, plot = FALSE, lag.max = 6)
Acf(mystery_b,  plot = FALSE, lag.max = 6)
Pacf(mystery_b, plot = FALSE, lag.max = 6)
#> 
#> Autocorrelations of series 'mystery_a', by lag
#> 
#>     0     1     2     3     4     5     6 
#> 1.000 0.846 0.700 0.563 0.454 0.376 0.300 
#> 
#> Partial autocorrelations of series 'mystery_a', by lag
#> 
#>      1      2      3      4      5      6 
#>  0.846 -0.054 -0.056  0.014  0.035 -0.047 
#> 
#> Autocorrelations of series 'mystery_b', by lag
#> 
#>      0      1      2      3      4      5      6 
#>  1.000  0.389 -0.064  0.063  0.019  0.009  0.011 
#> 
#> Partial autocorrelations of series 'mystery_b', by lag
#> 
#>      1      2      3      4      5      6 
#>  0.389 -0.253  0.242 -0.178  0.161 -0.129 
```

**Explanation:** Series A has an ACF that tails off smoothly (`0.846`, `0.700`, `0.563`) while its PACF cuts off after lag 1. That is the AR signature, so A is AR(1). Series B is the mirror image: its ACF cuts off after lag 1 (`0.389`, then inside the band) while its PACF tails off with an oscillating decay. That is the MA signature, so B is MA(1). Same fingerprint logic, opposite plots.

</details>

## Summary

Reading the ACF and PACF comes down to spotting which plot cuts off and which tails off, then matching that pair to a model. The table collects every signature in one place.

| ACF pattern | PACF pattern | Model | Where you read the order |
|---|---|---|---|
| Tails off | Cuts off after lag p | AR(p) | PACF |
| Cuts off after lag q | Tails off | MA(q) | ACF |
| Tails off | Tails off | ARMA(p, q) | Fit + AICc |
| Decays very slowly | Stays high | Non-stationary | Difference, then re-read |
| Spike at lag 12, 24 | Spike at lag 12, 24 | Seasonal (SARIMA) | Seasonal lags |

A few rules make the reading reliable: compare every bar against that series' own `1.96/sqrt(n)` band; the last bar outside the band on the cutting-off plot is your order; slow ACF decay means difference before you read; and whatever order you pick, confirm it by checking the model's residuals are white noise. The mind map ties the whole method together.

![How the ACF, PACF, signatures, and confirmation steps fit together](screenshots/ACF-and-PACF-in-R-mindmap.webp)
*Figure 3: How the ACF, PACF, signatures, and confirmation steps fit together.*

## Frequently Asked Questions

**Do I read the AR order from the ACF or the PACF?** From the PACF. The PACF cuts off at the AR order `p`, while the ACF tails off. For the MA order `q` it is the other way around: read the ACF, which cuts off at `q`, while the PACF tails off. A handy mnemonic is "PACF for p, ACF for q".

**What do the blue dashed lines on an ACF or PACF plot mean?** They mark the significance band at plus or minus `1.96/sqrt(n)`, where `n` is the number of observations. A bar that stays inside the band is statistically indistinguishable from zero, so treat it as noise. Only bars that poke outside the band count as real correlation.

**What does it mean when both the ACF and the PACF tail off?** That is the signature of a mixed ARMA process, which needs both AR and MA terms. The plots cannot hand you exact orders in this case, so fit a few small candidates (start near ARIMA(1,0,1)) and pick the one with the lowest AICc, then confirm with a residual check.

**How do I know whether to difference the series first?** Look at the ACF: if it stays high and decays very slowly, almost in a straight line across many lags, the series is non-stationary and you should difference it once, then re-plot. If a single difference leaves the lag-1 autocorrelation strongly negative (near -0.5), you have over-differenced and should step back.

**Is `acf()` the same as `Acf()`?** The math is identical. Base R's `acf()` includes the lag-0 bar (always 1) and uses base graphics, while `Acf()` from the forecast package drops the lag-0 bar and draws a cleaner ggplot-style chart. Use whichever is easier to read; the correlation values are the same.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Section 9.5, Non-seasonal ARIMA models (ACF/PACF order selection). [Link](https://otexts.com/fpp3/non-seasonal-arima.html)
2. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Section 2.8, Autocorrelation. [Link](https://otexts.com/fpp3/acf.html)
3. Nau, R. - *Identifying the orders of AR and MA terms in an ARIMA model*. Duke University. [Link](https://people.duke.edu/~rnau/411arim3.htm)
4. R Core Team - `acf` and `pacf`, the stats package reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html)
5. Hyndman, R.J. - the forecast package reference (`Acf`, `Pacf`, `ggtsdisplay`, `checkresiduals`). [Link](https://pkg.robjhyndman.com/forecast/)
6. Shumway, R.H., & Stoffer, D.S. - *Time Series Analysis and Its Applications*, 4th ed. Springer (2017). Chapter 3, ARIMA models. [Link](https://link.springer.com/book/10.1007/978-3-319-52452-8)
7. Box, G.E.P., Jenkins, G.M., Reinsel, G.C., & Ljung, G.M. - *Time Series Analysis: Forecasting and Control*, 5th ed. Wiley (2015). [Link](https://www.wiley.com/en-us/Time+Series+Analysis%3A+Forecasting+and+Control%2C+5th+Edition-p-9781118675021)

## Continue Learning

- [Test for Stationarity in R](Test-Stationarity-in-R.html) - the formal tests that confirm what a slowly decaying ACF is hinting, so you know exactly when to difference.
- [Time Series Objects in R](Time-Series-Objects-in-R.html) - how to build the ts objects that `acf()` and `pacf()` expect, including setting the seasonal frequency.
- [Time Series Forecasting With R](Time-Series-Forecasting-With-R.html) - take the p, d, and q you identified here and turn them into a full ARIMA forecast.
