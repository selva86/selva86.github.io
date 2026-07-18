---
title: "How to Choose ARIMA Order (p,d,q) in R: ACF and PACF"
slug: "How-to-Choose-ARIMA-Order-in-R"
description: "Choose ARIMA order step by step in R: find d with the ADF and KPSS tests, read p from the PACF, q from the ACF, then confirm the residuals are white noise."
keywords: "choose ARIMA order, ARIMA p d q, ACF and PACF, identify ARIMA order in R, PACF cutoff, ACF cutoff, ndiffs, ADF test, KPSS test, Box-Jenkins method"
auto_link_terms: "choose ARIMA order|choosing ARIMA order|ARIMA order selection|identify ARIMA order|select the ARIMA order|pick p and q|choosing p and q|PACF cutoff|ACF cutoff|Box-Jenkins method|identify p, d, q|reading ACF and PACF plots|order of an ARIMA model"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.11"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Choose ARIMA Order"
sidebar_order: 15
difficulty: "Intermediate"
---

<p class="lead">Choosing an ARIMA order means fixing the three integers in ARIMA(p, d, q): d is how many times you difference the series to make it stationary, p (read from the PACF plot) is the number of autoregressive terms, and q (read from the ACF plot) is the number of moving-average terms. A residual white-noise check then confirms the order is good.</p>

## What does choosing an ARIMA order actually mean?

An ARIMA model is written ARIMA(p, d, q), and those three numbers are the only thing you have to decide. Everything else, the coefficients and the forecasts, R estimates for you once the order is set. So the whole job of "fitting an ARIMA model" really comes down to picking three small integers. This tutorial gives you a repeatable procedure for picking them instead of guessing.

The quickest way to see the goal is to let R pick an order automatically, then spend the rest of the tutorial learning to reproduce and judge that choice by hand. We will use the built-in `Nile` series, the annual flow of the river Nile from 1871 to 1970. This post assumes you already know what the AR, I, and MA pieces do; if not, read [ARIMA in R](ARIMA-in-R.html) first, then come back here for the order-selection recipe.

```r title="Let R pick an order automatically"
library(forecast)
library(ggplot2)
auto.arima(Nile)
#> Series: Nile 
#> ARIMA(1,1,1) 
#> 
#> Coefficients:
#>          ar1      ma1
#>       0.2544  -0.8741
#> s.e.  0.1194   0.0605
#> 
#> sigma^2 = 20177:  log likelihood = -630.63
#> AIC=1267.25   AICc=1267.51   BIC=1275.04
```

R settled on `ARIMA(1,1,1)`. That is a fine answer, but a black-box answer. By the end of this tutorial you will be able to derive an order like it yourself, understand why each number was chosen, and know when to trust or override the automatic pick.

The whole process is four steps, always in the same order. Keep this table close; each section below is one row of it.

| Step | Question | Tool |
|---|---|---|
| 1. Find d | How many differences make it stationary? | ADF and KPSS tests, `ndiffs()` |
| 2. Find p | How many autoregressive terms? | the PACF plot |
| 3. Find q | How many moving-average terms? | the ACF plot |
| 4. Confirm | Is this order actually good? | AICc and a residual check |

The diagram below shows how those four steps flow into one another, including the loop back you take when the final check fails.

![The four-step workflow for choosing an ARIMA order](screenshots/How-to-Choose-ARIMA-Order-in-R-workflow.webp)
*Figure 1: The four-step workflow for choosing an ARIMA order.*

Before we start, here is a look at the raw numbers so you can picture the series behind that model.

```r title="Peek at the Nile series"
head(as.numeric(Nile), 10)
#>  [1] 1120 1160  963 1210 1160 1160  813 1230 1370 1140
```

The flow bounces around a high level early on, then tends to sit lower later in the record. That downward shift is a form of non-stationarity, and handling it is exactly what Step 1 is for.

[KEY INSIGHT]
**Choosing an order is identification, not guessing.** The ACF and PACF plots show patterns that are characteristic of the process that generated the data, and Box and Jenkins built a procedure to read those patterns. You are following a recipe, not flipping a coin.

**Try it:** Run an automatic fit on the `LakeHuron` series (annual lake levels) and read off its (p, d, q) from the label.

```r title="Your turn: read an ARIMA label"
# Goal: fit an automatic model to LakeHuron and read its (p, d, q).
# Swap Nile below for LakeHuron, then run.
ex_series <- Nile   # change Nile to LakeHuron
auto.arima(ex_series)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Automatic fit on LakeHuron"
auto.arima(LakeHuron)
#> Series: LakeHuron 
#> ARIMA(0,1,0) 
#> 
#> sigma^2 = 0.5588:  log likelihood = -109.11
#> AIC=220.22   AICc=220.26   BIC=222.79
```

**Explanation:** LakeHuron gets `ARIMA(0,1,0)`, which reads as p = 0, d = 1, q = 0. That is a pure random walk: difference once, and no AR or MA terms are needed. Sometimes the right order really is that simple.

</details>

## Step 1: how do you find d, the order of differencing?

The AR and MA parts of an ARIMA model both assume the series is stationary, meaning its average level and its amount of wobble stay roughly constant over time, with no trend drifting up or down. The Nile flow fails that test because its level shifts down partway through the record. The fix is differencing: instead of modeling the raw values, we model the change from one year to the next.

$$y'_t = y_t - y_{t-1}$$

Here $y_t$ is this year's value, $y_{t-1}$ is the previous year's value, and $y'_t$ is the difference between them, the change from one year to the next. The `d` in ARIMA(p, d, q) is just how many times you apply that operation. Most series need d = 0 or d = 1, and only rarely d = 2. Let us first look at the raw Nile flow to confirm the trend by eye.

```r title="Plot the raw Nile series"
autoplot(Nile) + ggtitle("Annual flow of the Nile, 1871 to 1970")
```

The plot shows the level dropping around the year 1900, so the mean is not constant. Eyeballing is a start, but a formal test is more reliable. The Augmented Dickey-Fuller (ADF) test from the tseries package checks for a unit root, which is the mathematical signature of a series that needs differencing.

```r title="Run the ADF test on the levels"
suppressMessages(library(tseries))
adf.test(Nile)
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  Nile
#> Dickey-Fuller = -3.3657, Lag order = 4, p-value = 0.0642
#> alternative hypothesis: stationary
```

The ADF null hypothesis is that the series is non-stationary, and its alternative is stationary. The p-value of 0.0642 sits just above 0.05, so we cannot reject the null: the ADF test does not consider the raw Nile stationary. A second test, the KPSS test, comes at the question from the opposite direction, and running both together is good practice.

```r title="Run the KPSS test on the levels"
kpss.test(Nile)
#> 	KPSS Test for Level Stationarity
#> 
#> data:  Nile
#> KPSS Level = 0.96543, Truncation lag parameter = 4, p-value = 0.01
```

The KPSS null hypothesis is the reverse of ADF: it assumes the series IS stationary, so a small p-value is evidence AGAINST stationarity. Here the KPSS p-value is 0.01, which rejects stationarity. Both tests now agree the raw series needs differencing.

[WARNING]
**The ADF and KPSS tests point in opposite directions by design.** The ADF null is that the series is non-stationary, while the KPSS null is that it is stationary. So "difference it" looks like a large ADF p-value AND a small KPSS p-value. Reading the two tests the same way is a classic error that leads to the wrong d.

Rather than run and read the tests yourself, you can let the forecast package choose d for you. The `ndiffs()` function applies a stationarity test repeatedly and returns the number of differences required.

```r title="Ask ndiffs how many differences are needed"
ndiffs(Nile)
#> [1] 1
```

It returns 1, matching the d that `auto.arima()` chose at the top. Now let us confirm that a single difference actually does the job by re-running the ADF test on the differenced series. The `diff()` function turns levels into year-to-year changes.

```r title="Difference once and re-test"
nile_diff <- diff(Nile)
adf.test(nile_diff)
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  nile_diff
#> Dickey-Fuller = -6.5924, Lag order = 4, p-value = 0.01
#> alternative hypothesis: stationary
```

The p-value drops to 0.01, so the differenced series clears the ADF test comfortably. We have our answer: d = 1, and we will do all further reading on `nile_diff`, the differenced series stored above.

[KEY INSIGHT]
**Difference the smallest number of times that makes the series stationary, and no more.** Over-differencing injects fake negative correlation into the series and inflates the variance, which then misleads the ACF and PACF you are about to read. When `ndiffs()` says 1, resist the urge to difference again.

**Try it:** Use `ndiffs()` to find how many differences the `nhtemp` series (yearly temperatures in New Haven) needs.

```r title="Your turn: find d for nhtemp"
# Goal: use ndiffs() to see how many differences nhtemp needs.
# Replace the series below, then run.
ndiffs(Nile)   # change Nile to nhtemp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Differences needed for nhtemp"
ndiffs(nhtemp)
#> [1] 1
```

**Explanation:** `nhtemp` needs one difference to remove its slow warming trend, so d = 1. Like most real series, a single difference is enough.

</details>

## What do the ACF and PACF actually measure?

With the series made stationary, two plots do the rest of the work. They are the autocorrelation function (ACF) and the partial autocorrelation function (PACF), and together they are the heart of choosing p and q. If you want a slow, from-scratch treatment of these two plots, see the dedicated [ACF and PACF guide](ACF-and-PACF-in-R.html); here we cover just enough to use them for order selection.

The ACF at lag k measures how correlated the series is with a copy of itself shifted k steps back. The PACF at lag k measures the same correlation but strips out the influence of all the shorter lags in between, so it captures only the direct link between a value and the one k steps earlier. That "direct link only" distinction is what makes the two plots tell you different things.

Both plots come with a shaded band, usually drawn as blue dashed lines. The band marks the range where a spike is small enough to be plausibly just noise. Its width is $\pm 1.96/\sqrt{n}$ for a series of length n, so a bar that pokes past the band is a "significant" spike worth paying attention to, while bars inside the band are treated as zero.

Two words describe how a plot behaves, and you need both:

- **Cuts off:** the bars are significant up to some lag, then drop abruptly inside the band and stay there.
- **Tails off:** the bars shrink gradually toward zero over many lags, often while alternating sign, without a clean break.

The `ggtsdisplay()` helper shows the series alongside both plots in a single view, which is the fastest way to inspect them. Let us look at the differenced Nile.

```r title="Show the series with its ACF and PACF"
ggtsdisplay(nile_diff)
```

In that display, the ACF (bottom left) and PACF (bottom right) are what we will read in the next two steps. The sections that follow teach the exact rule for turning each plot into a number.

**Try it:** The Nile difference has 99 observations. Compute the width of the significance band for it.

```r title="Your turn: compute the significance band"
# Goal: compute the +/- band width 1.96 / sqrt(n) for n = 99.
# Fill in n, then run.
round(1.96 / sqrt(100), 3)   # change 100 to 99
```

<details>
<summary>Click to reveal solution</summary>

```r title="Band width for 99 observations"
round(1.96 / sqrt(99), 3)
#> [1] 0.197
```

**Explanation:** The band sits at about plus or minus 0.197, so any ACF or PACF bar larger than roughly 0.2 in size counts as a significant spike for the differenced Nile.

</details>

## Step 2: how do you read the PACF to choose p?

The rule for the autoregressive order is short: for a pure AR(p) process, the PACF cuts off sharply after lag p, while the ACF tails off gradually. So you find p by counting how many PACF spikes stick out past the band before it drops to near zero.

The cleanest way to trust that rule is to see it on data where we know the answer. Let us simulate a pure AR(2) series, whose PACF should show exactly two spikes and then nothing.

```r title="Simulate an AR(2) and plot its PACF"
set.seed(2027)
s_ar2 <- arima.sim(model = list(ar = c(0.6, -0.3)), n = 300)
ggPacf(s_ar2)
```

The plot shows two clear bars, then a drop inside the band. The numbers make it exact.

```r title="PACF values of the AR(2) series"
round(Pacf(s_ar2, plot = FALSE)$acf[1:6], 3)
#> [1]  0.474 -0.351 -0.013 -0.080  0.006 -0.026
```

For 300 points the band is about plus or minus 0.113. R's PACF output starts at lag 1 (there is no lag-0 term, unlike the ACF you will see in Step 3), so these six values are lags 1 through 6. The first two (0.474 and -0.351), the PACF at lags 1 and 2, clear the band easily, and everything from lag 3 on sits inside. Two significant spikes, then a cutoff, is the textbook AR(2) fingerprint, so p = 2. That matches the two AR coefficients we used to build the series.

Now apply the same reading to the differenced Nile. Recall its PACF from the display above; here are the numbers.

```r title="PACF values of the differenced Nile"
round(Pacf(nile_diff, plot = FALSE)$acf[1:6], 3)
#> [1] -0.402 -0.246 -0.119 -0.173 -0.155 -0.074
```

Against a band of about plus or minus 0.2, the lag-1 bar (-0.402) is clearly significant, lag 2 (-0.246) is marginal, and the rest fade slowly rather than dropping off a cliff. There is no crisp cutoff here, which is the PACF tailing off. A tailing PACF points away from a large AR order, so p is small, most likely 0. We will let the ACF make the case for an MA term instead.

[KEY INSIGHT]
**The PACF isolates the direct link at each lag, which is why an autoregressive process shows a clean cutoff.** An AR(2) value depends directly only on the two before it, so once you account for those, lag 3 and beyond add nothing, and the PACF collapses to zero right after lag 2.

**Try it:** Simulate a pure AR(1) series and read its PACF. How many spikes stick out before it cuts off?

```r title="Your turn: read the PACF of an AR(1)"
# Goal: simulate an AR(1) and count the significant PACF spikes.
set.seed(11)
ex_ar1 <- arima.sim(model = list(ar = 0.7), n = 300)
round(Pacf(ex_ar1, plot = FALSE)$acf[1:6], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="PACF values of the AR(1) series"
set.seed(11)
ex_ar1 <- arima.sim(model = list(ar = 0.7), n = 300)
round(Pacf(ex_ar1, plot = FALSE)$acf[1:6], 3)
#> [1]  0.685  0.036  0.041 -0.112 -0.042 -0.017
```

**Explanation:** Only the lag-1 value (0.685) clears the band; everything after is inside it. One spike, then a cutoff, means p = 1, exactly the AR(1) we simulated.

</details>

## Step 3: how do you read the ACF to choose q?

The rule for the moving-average order mirrors Step 2, with the two plots swapped: for a pure MA(q) process, the ACF cuts off sharply after lag q, while the PACF tails off gradually. So you count how many ACF spikes stick out before it drops inside the band.

Let us confirm on a simulated MA(1), whose ACF should spike once and then cut off.

```r title="Simulate an MA(1) and plot its ACF"
set.seed(404)
s_ma1 <- arima.sim(model = list(ma = 0.7), n = 300)
ggAcf(s_ma1)
```

The plot shows a single tall bar at lag 1, then a drop into the band. Here are the numbers.

```r title="ACF values of the MA(1) series"
round(Acf(s_ma1, plot = FALSE)$acf[1:6], 3)
#> [1]  1.000  0.502  0.111  0.073  0.056 -0.055
```

The first value is always 1.000, the correlation of the series with itself at lag 0, so ignore it. The lag-1 value (0.502) is a clear spike, and from lag 2 on the bars sit at or inside the plus or minus 0.113 band. One significant spike, then a cutoff, is the MA(1) fingerprint, so q = 1.

Now read the ACF of the differenced Nile.

```r title="ACF values of the differenced Nile"
round(Acf(nile_diff, plot = FALSE)$acf[1:6], 3)
#> [1]  1.000 -0.402 -0.044  0.027 -0.088  0.001
```

Ignoring the lag-0 value of 1.000, only the lag-1 bar (-0.402) clears the band of about plus or minus 0.2; every later bar is well inside it. That is a clean cutoff after lag 1, the signature of an MA(1). Put together with the tailing PACF from Step 2, the differenced Nile reads as MA(1), which means a candidate order of ARIMA(0, 1, 1): zero AR terms, one difference, one MA term.

The table below is the full reading rule. It is worth memorizing, because it covers every case you will meet.

| ACF behavior | PACF behavior | Suggested model |
|---|---|---|
| Tails off gradually | Cuts off after lag p | AR(p) |
| Cuts off after lag q | Tails off gradually | MA(q) |
| Tails off gradually | Tails off gradually | Mixed ARMA (compare by AICc) |

The diagram below turns that table into a decision you can follow at a glance.

![How the ACF and PACF point to AR, MA, or ARMA](screenshots/How-to-Choose-ARIMA-Order-in-R-acf-pacf-rules.webp)
*Figure 2: How the ACF and PACF point to an AR, MA, or mixed ARMA model.*

[TIP]
**Real ACF and PACF plots are rarely as tidy as textbook ones.** Simulated series give crisp cutoffs; real data gives marginal spikes and slow tails. Use the plots to shortlist two or three candidate orders, then let Step 4 pick the winner. Do not agonize over whether a single borderline bar counts.

**Try it:** Simulate a pure MA(2) series and read its ACF. How many spikes clear the band?

```r title="Your turn: read the ACF of an MA(2)"
# Goal: simulate an MA(2) and count the significant ACF spikes.
set.seed(77)
ex_ma2 <- arima.sim(model = list(ma = c(0.7, 0.5)), n = 300)
round(Acf(ex_ma2, plot = FALSE)$acf[1:6], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="ACF values of the MA(2) series"
set.seed(77)
ex_ma2 <- arima.sim(model = list(ma = c(0.7, 0.5)), n = 300)
round(Acf(ex_ma2, plot = FALSE)$acf[1:6], 3)
#> [1]  1.000  0.622  0.268 -0.052 -0.051 -0.061
```

**Explanation:** Ignoring the lag-0 value, the lag-1 (0.622) and lag-2 (0.268) bars both clear the band, and everything after is inside it. Two significant spikes, then a cutoff, means q = 2.

</details>

## Step 4: how do you confirm the order with AICc and residual checks?

Reading the plots gave us a candidate, ARIMA(0, 1, 1), but a candidate is not a verdict. Step 4 tests it two ways. First, compare a shortlist of nearby orders by their AICc, a score that rewards good fit and penalizes needless complexity, where lower is better. Let us line up the ACF-suggested model against a few neighbors.

```r title="Compare candidate orders by AICc"
c("ARIMA(0,1,1)" = Arima(Nile, order = c(0,1,1))$aicc,
  "ARIMA(1,1,1)" = Arima(Nile, order = c(1,1,1))$aicc,
  "ARIMA(1,1,0)" = Arima(Nile, order = c(1,1,0))$aicc,
  "ARIMA(2,1,1)" = Arima(Nile, order = c(2,1,1))$aicc)
#> ARIMA(0,1,1) ARIMA(1,1,1) ARIMA(1,1,0) ARIMA(2,1,1) 
#>     1269.216     1267.507     1281.605     1269.322 
```

The lowest score belongs to `ARIMA(1,1,1)` at 1267.51, the same model `auto.arima()` picked. Our hand-read `ARIMA(0,1,1)` comes in at 1269.22, higher by only 1.71. A widely used rule of thumb says that when two models are within about 2 AICc points, they are essentially indistinguishable, so the tie-breaker is simplicity. The `ARIMA(0,1,1)` uses one coefficient instead of two, so the parsimonious choice is to keep the model our ACF identified.

[WARNING]
**Only compare AICc between models that share the same d.** Differencing changes the data the model is fit to, so the AICc of an ARIMA(0, 1, 1) and an ARIMA(2, 0, 0) are measured on different scales and cannot be compared. Decide d first, then compare orders within that fixed d.

The second test is the decisive one. A good model leaves behind residuals, the leftover one-step errors, that look like pure random noise. If a pattern remains, the model missed something. The `checkresiduals()` function runs a Ljung-Box test and draws the diagnostic plots in one call.

```r title="Fit ARIMA(0,1,1) and check its residuals"
nile_fit <- Arima(Nile, order = c(0,1,1))
nile_fit
#> Series: Nile 
#> ARIMA(0,1,1) 
#> 
#> Coefficients:
#>           ma1
#>       -0.7329
#> s.e.   0.1143
#> 
#> sigma^2 = 20810:  log likelihood = -632.55
#> AIC=1269.09   AICc=1269.22   BIC=1274.28
```

```r title="Run the residual diagnostic"
checkresiduals(nile_fit)
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)
#> Q* = 13.387, df = 9, p-value = 0.1458
#> 
#> Model df: 1.   Total lags used: 10
```

The Ljung-Box null hypothesis is that the residuals are just noise, so here we WANT a large p-value. At 0.1458 we cannot find leftover structure, which means the residuals pass as white noise and the order is confirmed. The plots it draws, a residual series with its own ACF and a histogram, should show no obvious pattern to back that up.

[KEY INSIGHT]
**The residual white-noise check is the real judge of an order.** The ACF and PACF only nominate candidates. A model whose residuals still carry structure is wrong no matter how good its AICc looks, and a model whose residuals are clean is trustworthy even if a rival scores a hair lower.

**Try it:** Fit the `ARIMA(1,1,1)` that `auto.arima()` preferred and read its AICc. How far below the 1269.22 of `ARIMA(0,1,1)` does it really sit?

```r title="Your turn: check the rival AICc"
# Goal: fit ARIMA(1,1,1) to Nile and read its AICc.
# Change the order below, then run.
ex_alt <- Arima(Nile, order = c(0,1,1))   # change c(0,1,1) to c(1,1,1)
ex_alt$aicc
```

<details>
<summary>Click to reveal solution</summary>

```r title="AICc of the rival ARIMA(1,1,1)"
ex_alt <- Arima(Nile, order = c(1,1,1))
ex_alt$aicc
#> [1] 1267.507
```

**Explanation:** The rival scores 1267.51 against 1269.22, a gap of 1.71. That is inside the 2-point rule of thumb, so the two models are practically tied and the simpler ARIMA(0,1,1) is the better everyday choice.

</details>

## Complete Example: choosing an order for BJsales end to end

Let us run the full four-step procedure once more on a fresh series, this time landing on a different shape of model. The built-in `BJsales` series is a sales record from Box and Jenkins themselves, the statisticians who created this whole method. First, plot it.

```r title="Plot the BJsales series"
autoplot(BJsales) + ggtitle("BJsales: a Box and Jenkins sales series")
```

The series climbs steadily, a clear trend, so Step 1 will call for differencing. Let `ndiffs()` decide.

```r title="Step 1: find d for BJsales"
ndiffs(BJsales)
#> [1] 1
```

One difference. Now inspect the differenced series with the combined display, then read the two plots.

```r title="Step 2 and 3: display the differenced series"
bj_diff <- diff(BJsales)
ggtsdisplay(bj_diff)
```

```r title="PACF values of the differenced BJsales"
round(Pacf(bj_diff, plot = FALSE)$acf[1:8], 3)
#> [1]  0.312  0.200  0.109  0.138 -0.003  0.010 -0.048  0.071
```

```r title="ACF values of the differenced BJsales"
round(Acf(bj_diff, plot = FALSE)$acf[1:8], 3)
#> [1] 1.000 0.312 0.278 0.226 0.252 0.150 0.134 0.063
```

The band here is about plus or minus 0.16. The PACF has two bars above it (0.312 and 0.200) and then drops inside, which looks like a cutoff after lag 2. The ACF, ignoring lag 0, stays positive and fades slowly, which is a tail. A PACF cutoff with a tailing ACF points to AR(2), so our shortlist starts with ARIMA(2, 1, 0). Let us compare it against a few neighbors by AICc.

```r title="Step 4: compare candidate orders"
c("ARIMA(2,1,0)" = Arima(BJsales, order = c(2,1,0))$aicc,
  "ARIMA(1,1,1)" = Arima(BJsales, order = c(1,1,1))$aicc,
  "ARIMA(1,1,0)" = Arima(BJsales, order = c(1,1,0))$aicc,
  "ARIMA(0,1,1)" = Arima(BJsales, order = c(0,1,1))$aicc)
#> ARIMA(2,1,0) ARIMA(1,1,1) ARIMA(1,1,0) ARIMA(0,1,1) 
#>     520.0883     514.9016     526.2086     533.3479 
```

Here the numbers overrule the eyeball read. The AR(2) we shortlisted scores 520.09, but the mixed `ARIMA(1,1,1)` scores 514.90, better by more than 5 points, well past the 2-point rule. When a plot suggests one thing and AICc strongly prefers another, follow the data: revise the choice to ARIMA(1, 1, 1). Confirm it with a residual check.

```r title="Confirm the revised model"
bj_fit <- Arima(BJsales, order = c(1,1,1))
checkresiduals(bj_fit)
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,1,1)
#> Q* = 5.8814, df = 8, p-value = 0.6605
#> 
#> Model df: 2.   Total lags used: 10
```

The Ljung-Box p-value of 0.6605 is comfortably large, so the residuals are white noise and ARIMA(1, 1, 1) is confirmed. With the order settled, forecasting is one call.

```r title="Forecast the next eight periods"
forecast(bj_fit, h = 8)
#>     Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 151       262.8620 261.1427 264.5814 260.2325 265.4915
#> 152       263.0046 260.2677 265.7415 258.8189 267.1903
#> 153       263.1301 259.4297 266.8304 257.4709 268.7893
#> 154       263.2405 258.5953 267.8857 256.1363 270.3447
#> 155       263.3377 257.7600 268.9153 254.8074 271.8680
#> 156       263.4232 256.9253 269.9211 253.4855 273.3608
#> 157       263.4984 256.0941 270.9028 252.1744 274.8224
#> 158       263.5647 255.2691 271.8602 250.8778 276.2516
```

The point forecasts drift gently upward, continuing the trend, and the intervals widen further out as uncertainty compounds. This example carries the most important lesson of the whole tutorial: the ACF and PACF give you a smart starting shortlist, but AICc and the residual check make the final call.

## Frequently Asked Questions

**Do I read the ACF for p or for q?** The ACF gives you q, the moving-average order, because an MA(q) process has an ACF that cuts off after lag q. The PACF gives you p, the autoregressive order. An easy way to remember it: the Partial ACF pairs with the p term.

**How do I know when an ACF or PACF spike is significant?** Compare it to the shaded band, which sits at plus or minus $1.96/\sqrt{n}$. A bar that pokes past the band is significant; a bar inside the band is treated as zero. For 100 observations the band is about plus or minus 0.2.

**What if both the ACF and PACF tail off gradually?** That is the signature of a mixed ARMA process, where neither plot gives a clean cutoff. In that case the plots cannot pin down the order alone, so fit a small grid of candidates and pick by AICc, which is exactly what `auto.arima()` automates.

**Should I read the plots on the raw series or the differenced one?** Always on the differenced, stationary series. The AR and MA parts only make sense once the trend is removed, so reading the ACF and PACF of a trending raw series will mislead you.

**If auto.arima() picks the order for me, why learn to read the plots?** Because `auto.arima()` can be wrong, and you need to judge it. Reading the plots and residuals lets you sanity-check its answer, override it when domain knowledge or a residual failure demands, and understand what the model is actually doing.

**Can I over-difference a series?** Yes, and it hurts. Differencing more than needed injects artificial negative autocorrelation at lag 1 and inflates the variance, which corrupts the ACF and PACF. Trust `ndiffs()` and stop as soon as the series is stationary.

## Practice Exercises

These combine the four steps into fuller challenges. Each starter block runs as-is so you can experiment; write your own solution, then reveal ours to compare. The exercises use their own variable names so they will not clash with the code above.

### Exercise 1: Identify the order for lh

The `lh` series records luteinizing hormone levels in blood samples. Work through all four steps: find d with `ndiffs()`, read the ACF and PACF, then compare a shortlist by AICc. What does a thorough `auto.arima()` settle on, and does it match your read?

```r title="Your turn: full workflow on lh"
# Steps: ndiffs(lh); read Pacf(lh) and Acf(lh); compare AICc of a few
# same-d candidates; then run auto.arima(lh, stepwise = FALSE, approximation = FALSE).

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Find d and read the plots for lh"
ndiffs(lh)
#> [1] 0
round(Pacf(lh, plot = FALSE)$acf[1:6], 3)
#> [1]  0.576 -0.223 -0.227  0.103 -0.076  0.068
round(Acf(lh, plot = FALSE)$acf[1:6], 3)
#> [1]  1.000  0.576  0.182 -0.145 -0.175 -0.150
```

```r title="Compare same-d candidates and let auto.arima decide"
c("ARIMA(1,0,0)" = Arima(lh, order = c(1,0,0))$aicc,
  "ARIMA(0,0,1)" = Arima(lh, order = c(0,0,1))$aicc,
  "ARIMA(0,0,2)" = Arima(lh, order = c(0,0,2))$aicc)
#> ARIMA(1,0,0) ARIMA(0,0,1) ARIMA(0,0,2) 
#>     65.30378     68.64934     63.99079 
auto.arima(lh, stepwise = FALSE, approximation = FALSE)
#> Series: lh 
#> ARIMA(0,0,2) with non-zero mean 
#> 
#> Coefficients:
#>          ma1     ma2    mean
#>       0.6732  0.3753  2.4016
#> s.e.  0.1326  0.1291  0.1244
#> 
#> sigma^2 = 0.1943:  log likelihood = -27.53
#> AIC=63.06   AICc=63.99   BIC=70.55
```

**Explanation:** The tests give d = 0, so no differencing. The plots are ambiguous: both the PACF and ACF have a strong lag-1 spike and then borderline values, so the eye cannot cleanly separate AR from MA. This is the "both tail off" case, so AICc breaks the tie. Among the candidates, ARIMA(0,0,2) scores lowest at 63.99, and the thorough `auto.arima()` agrees, landing on a pure MA(2).

</details>

### Exercise 2: Identify a mystery series

Run the setup below to build a series without peeking at how it was made, then use the full workflow to recover its (p, d, q). Confirm your answer with a residual check.

```r title="Your turn: identify the mystery order"
# The setup builds cap_series. Treat its order as unknown.
set.seed(88)
cap_series <- arima.sim(model = list(ar = c(0.5, -0.35)), n = 350)

# Now: find d with ndiffs(); read Pacf and Acf; compare AICc; check residuals.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Find d and read the plots"
set.seed(88)
cap_series <- arima.sim(model = list(ar = c(0.5, -0.35)), n = 350)
ndiffs(cap_series)
#> [1] 0
round(Pacf(cap_series, plot = FALSE)$acf[1:6], 3)
#> [1]  0.453 -0.357 -0.009 -0.095  0.022  0.073
round(Acf(cap_series, plot = FALSE)$acf[1:6], 3)
#> [1]  1.000  0.453 -0.079 -0.216 -0.174 -0.055
```

```r title="Compare candidates and confirm the residuals"
c("ARIMA(1,0,0)" = Arima(cap_series, order = c(1,0,0))$aicc,
  "ARIMA(2,0,0)" = Arima(cap_series, order = c(2,0,0))$aicc,
  "ARIMA(2,0,1)" = Arima(cap_series, order = c(2,0,1))$aicc)
#> ARIMA(1,0,0) ARIMA(2,0,0) ARIMA(2,0,1) 
#>    1009.9340     962.6533     964.7075 
checkresiduals(Arima(cap_series, order = c(2,0,0)))
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(2,0,0) with non-zero mean
#> Q* = 7.1404, df = 8, p-value = 0.5216
#> 
#> Model df: 2.   Total lags used: 10
```

**Explanation:** `ndiffs()` gives d = 0. The PACF has two significant spikes (0.453 and -0.357) then cuts off, while the ACF tails off, the classic AR(2) fingerprint, so the read is ARIMA(2, 0, 0). AICc confirms it (962.65 beats both neighbors), and the Ljung-Box p-value of 0.5216 says the residuals are white noise. The order is ARIMA(2, 0, 0), which is exactly the process the setup simulated.

</details>

### Exercise 3: When d itself is in doubt

`LakeHuron` is a famous puzzle. Its `ndiffs()` says difference once, yet the PACF of the raw levels shows a clean AR(2) shape. Read the PACF of the levels, note what `ndiffs()` says, then fit `ARIMA(2,0,0)` on the levels and check its residuals. Why can you NOT settle this by comparing the AICc of the two models?

```r title="Your turn: the LakeHuron dilemma"
# Read Pacf(LakeHuron); check ndiffs(LakeHuron); fit Arima(LakeHuron, c(2,0,0))
# and run checkresiduals on it.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Read the levels and the differencing suggestion"
round(Pacf(LakeHuron, plot = FALSE)$acf[1:6], 3)
#> [1]  0.832 -0.267  0.131  0.034  0.062 -0.021
ndiffs(LakeHuron)
#> [1] 1
```

```r title="Fit AR(2) on the levels and check residuals"
lake_fit <- Arima(LakeHuron, order = c(2,0,0))
checkresiduals(lake_fit)
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(2,0,0) with non-zero mean
#> Q* = 5.9457, df = 8, p-value = 0.6533
#> 
#> Model df: 2.   Total lags used: 10
```

**Explanation:** The PACF of the levels cuts off after lag 2 (0.832 and -0.267 are significant), pointing to AR(2) with no differencing, while `ndiffs()` leans toward one difference. Both are defensible: this is the trend-stationary versus difference-stationary judgment call. You cannot decide it by AICc, because ARIMA(2,0,0) is fit to the levels and a differenced model is fit to the changes, so their AICc values are on different scales. Instead you judge by residual diagnostics and context. Here the AR(2) on the levels passes cleanly (Ljung-Box p = 0.6533), which is why it is the textbook model for this series.

</details>

## Summary

Choosing an ARIMA order is a four-step routine you can run on any series: find how much differencing makes it stationary, read the PACF for the AR order, read the ACF for the MA order, then confirm with AICc and a residual check. The plots nominate; the diagnostics decide.

![Overview of the whole order-selection process](screenshots/How-to-Choose-ARIMA-Order-in-R-overview.webp)
*Figure 3: Overview of the whole order-selection process, from differencing to confirmation.*

| Step | What you decide | Key function | Reading rule |
|---|---|---|---|
| Find d | Order of differencing | `ndiffs()`, `adf.test()`, `kpss.test()` | Difference until stationary |
| Find p | AR order | `Pacf()` | PACF cuts off after lag p |
| Find q | MA order | `Acf()` | ACF cuts off after lag q |
| Confirm | Whether the order is good | `Arima()`, `checkresiduals()` | Lowest AICc plus white-noise residuals |

Keep these takeaways close:

- **The PACF gives p, the ACF gives q.** A sharp cutoff after lag k in the PACF means p = k; a sharp cutoff in the ACF means q = k. When both tail off, it is a mixed model and AICc decides.
- **Always read the plots on the stationary, differenced series.** Decide d first with `ndiffs()`, and only compare AICc between models that share that d.
- **A significant spike pokes past the plus or minus $1.96/\sqrt{n}$ band.** Bars inside the band are noise.
- **The residual check is the final word.** No order is confirmed until `checkresiduals()` shows white noise, and a small AICc gap between two passing models breaks in favor of the simpler one.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 9.5: Non-seasonal ARIMA models and order selection. [Link](https://otexts.com/fpp3/non-seasonal-arima.html)
2. Hyndman, R.J., & Khandakar, Y. - "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software*, 27(3), 2008. [Link](https://www.jstatsoft.org/article/view/v027i03)
3. Box, G.E.P., Jenkins, G.M., Reinsel, G.C., & Ljung, G.M. - *Time Series Analysis: Forecasting and Control*, 5th edition. Wiley (2015). Chapter 6: Model identification.
4. forecast package - `ndiffs()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/ndiffs.html)
5. forecast package - `Arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/Arima.html)
6. R Core Team - `acf()` and `pacf()` documentation, *An Introduction to R*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html)

## Continue Learning

- [ARIMA in R](ARIMA-in-R.html) - the companion guide on what AR, I, and MA mean and how to fit and forecast an ARIMA model.
- [ACF and PACF in R](ACF-and-PACF-in-R.html) - a from-scratch look at the two plots at the center of this workflow.
- [Test Stationarity in R](Test-Stationarity-in-R.html) - the full set of unit-root and stationarity tests behind the differencing step.
