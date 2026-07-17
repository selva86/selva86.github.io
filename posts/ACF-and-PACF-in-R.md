---
title: "ACF and PACF in R: How to Read the Plots for ARIMA Orders"
slug: "ACF-and-PACF-in-R"
description: "The ACF gives the correlation at each lag; the PACF gives only the direct part. Learn to read both plots in R and turn them into ARIMA orders p and q."
keywords: "ACF and PACF in R, acf in R, pacf in R, autocorrelation function R, partial autocorrelation R, correlogram R, ARIMA order selection, choosing p and q, autocorrelation plot R"
auto_link_terms: "ACF|PACF|autocorrelation|autocorrelation function|partial autocorrelation|partial autocorrelation function|correlogram|ACF plot|PACF plot|autocorrelation in R|serial correlation|ACF and PACF|significance band|choosing ARIMA order"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "3.8.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ACF and PACF"
sidebar_order: 8
difficulty: "Intermediate"
---

<p class="lead">The ACF (autocorrelation function) measures how strongly each reading in a series resembles the reading some fixed number of steps before it. The PACF (partial autocorrelation function) measures the same thing, but first strips out everything the shorter lags in between already explain. Read side by side, the two plots hand you an ARIMA order: when the PACF stops dead after lag <code>p</code> while the ACF trails away, try an AR(p); when the ACF stops dead after lag <code>q</code> while the PACF trails away, try an MA(q). This post builds both functions from a plain <code>cor()</code> call, teaches you to read the plots the way a forecaster reads them, and is honest about the cases where they refuse to give a clean answer.</p>

## What do the ACF and PACF say about a real series?

The series we will use for the whole post is `lh`. It ships with R, so you already have it, and it is refreshingly concrete: 48 blood samples taken from one woman at 10-minute intervals, each measuring the level of luteinizing hormone in her blood, in international units per litre (IU/L). The first sample came in at 2.4 IU/L, the lowest at 1.4, the highest at 3.5.

The question a forecaster asks about a series like this is simple to state: **if I know the hormone level 10 minutes ago, how much do I know about the level now?** And what about 20 minutes ago, or 30? The ACF answers exactly that question, one lag at a time. The PACF answers a sharper version of it. Here is the whole thing on real data, before any explanation.

```r title="The ACF and PACF of 48 real hormone readings"
lh                      # 48 readings, one every 10 minutes, in IU/L
#> Time Series:
#> Start = 1 
#> End = 48 
#> Frequency = 1 
#>  [1] 2.4 2.4 2.4 2.2 2.1 1.5 2.3 2.3 2.5 2.0 1.9 1.7 2.2 1.8 3.2 3.2 2.7 2.2 2.2 1.9 1.9 1.8 2.7 3.0
#> [25] 2.3 2.0 2.0 2.9 2.9 2.7 2.7 2.3 2.6 2.4 1.8 1.7 1.5 1.4 2.1 3.3 3.5 3.5 3.1 2.6 2.1 3.4 3.0 2.9

acf(lh, plot = FALSE)   # correlation with itself, 1 step back, 2 steps back, ...
#> 
#> Autocorrelations of series 'lh', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10     11     12     13 
#>  1.000  0.576  0.182 -0.145 -0.175 -0.150 -0.021 -0.020 -0.004 -0.136 -0.154 -0.097  0.049  0.120 
#>     14     15     16 
#>  0.087  0.119  0.151 

pacf(lh, plot = FALSE)  # the same, minus what the shorter lags already explain
#> 
#> Partial autocorrelations of series 'lh', by lag
#> 
#>      1      2      3      4      5      6      7      8      9     10     11     12     13     14 
#>  0.576 -0.223 -0.227  0.103 -0.076  0.068 -0.104  0.012 -0.188  0.003  0.066  0.032  0.022 -0.093 
#>     15     16 
#>  0.230  0.044 
```

That `Time Series: Start = 1, End = 48, Frequency = 1` header is R telling you `lh` is not a plain vector but a `ts` object, a series that knows its own timeline. `Frequency = 1` means one reading per time unit, so lag 1 here is one sample, which is 10 minutes. Hold on to the word *frequency*; it lays a trap in a later section.

Read the ACF row first. At lag 0 the value is 1.000, which is just the series correlated with an unshifted copy of itself, so it is always exactly 1 and never carries information. At lag 1 it is **0.576**: the hormone level 10 minutes ago is strongly, positively related to the level now. At lag 2 it has already fallen to 0.182, and from lag 3 onward the numbers wander around zero with no pattern worth naming.

Now the PACF row. At lag 1 it reads 0.576, identical to the ACF. At lag 2 it is -0.223, and at lag 3, -0.227. Those two numbers are not the same as the ACF's, and understanding *why* is the whole point of having two plots instead of one.

So the short answer to the opening question: knowing the level 10 minutes ago tells you a great deal, and knowing the level 20 minutes ago adds very little on top of that. By the end of this post you will be able to read those two rows, say which ARIMA order they suggest, and know exactly how much to trust the answer given that we only have 48 readings.

Almost nobody reads these as printed numbers. The standard tool is the plot.

```r title="The two plots, side by side"
par(mfrow = c(1, 2), mar = c(4, 4, 3, 1))
acf(lh,  main = "ACF of lh")
pacf(lh, main = "PACF of lh")
par(mfrow = c(1, 1))
```

Two panels appear. Each is a row of vertical spikes, one per lag, with a horizontal line at zero and a pair of dashed blue lines above and below it. In the ACF panel the spike at lag 0 shoots to 1, the lag-1 spike is tall and clears the dashed line, and every spike after that sits inside the dashed band. In the PACF panel there is no lag-0 spike at all, lag 1 is the same tall spike, and everything after it stays inside the band. Each of those features means something specific, and we will take them one at a time.

## What is autocorrelation, really?

Start with the ordinary correlation you already know. Given two variables, say height and weight measured on the same people, `cor()` returns a number between -1 and 1 saying how tightly one tracks the other. Autocorrelation is that exact same calculation, with one twist: **both variables are the same series, one of them shifted in time.**

The shift is called a **lag**. A lag of 1 means "compare each reading to the one immediately before it". For the hormone data, where samples came 10 minutes apart, lag 1 means 10 minutes ago and lag 3 means 30 minutes ago.

Making the pairs is worth doing by hand once, because after that no formula in this post is mysterious. The series has 48 readings. To pair each reading with its predecessor, take readings 2 through 48 as the "now" variable, and readings 1 through 47 as the "10 minutes ago" variable. That gives 47 pairs: (2.4, 2.4), (2.4, 2.4), (2.2, 2.4), and so on. Then correlate the two columns like any other pair of variables.

```r title="Lag-1 autocorrelation, by hand, with plain cor()"
n <- length(lh)
n
#> [1] 48

# 47 pairs: each reading next to the reading 10 minutes before it
cor(lh[1:(n - 1)], lh[2:n])
#> [1] 0.5807322
```

There it is: 0.581. Nothing exotic happened. We shifted the series against itself by one step and ran the same `cor()` you would run on height and weight.

But look closely and compare that to what `acf()` reported: **0.576**, not 0.581. The two numbers are close but they are genuinely different, and if you have ever noticed this discrepancy and assumed you made an indexing error, you did not.

Here is the formalism. The autocorrelation at lag \(k\), written \(r_k\), is defined as

\[ r_k = \frac{\frac{1}{n}\sum_{t=k+1}^{n} (x_t - \bar{x})(x_{t-k} - \bar{x})}{\frac{1}{n}\sum_{t=1}^{n} (x_t - \bar{x})^2} \]

where \(x_t\) is the reading at time \(t\), \(\bar{x}\) is the mean of the whole series, \(n\) is the number of readings, and \(k\) is the lag. The numerator is the average product of paired deviations from the mean, and the denominator is the variance of the series.

Two details in that formula are exactly what separate \(r_k\) from `cor()`. First, **one shared mean** \(\bar{x}\) is subtracted from both columns, whereas `cor()` computes a separate mean for each of the two vectors you hand it. Second, the numerator divides by \(n\) (all 48), even though the sum at lag 1 only has 47 terms in it; `cor()` divides by the number of pairs. Write the formula out literally and it reproduces `acf()` to the last digit.

```r title="The formula behind acf(), typed out"
xbar <- mean(lh)

# numerator: average product of paired deviations (note the /n, not /(n-1))
c1 <- sum((lh[1:(n - 1)] - xbar) * (lh[2:n] - xbar)) / n

# denominator: the variance of the series
c0 <- sum((lh - xbar)^2) / n

c1 / c0
#> [1] 0.5755245

acf(lh, plot = FALSE)$acf[2]   # element 1 is lag 0, so element 2 is lag 1
#> [1] 0.5755245
```

Identical to seven decimal places. `acf()` is not doing anything clever; it is this formula in a loop over lags.

> **Watch out:** `acf()` does not compute `cor()` of the shifted vectors, so do not expect them to match. Dividing by \(n\) when the sum has only \(n-k\) terms deliberately shrinks the estimate toward zero, and it shrinks harder the further out you go: at lag 16 the sum has just 32 terms but is still divided by 48. That looks like a bug and is a deliberate choice. It guarantees the whole set of autocorrelations is mathematically coherent (technically, that the resulting matrix is positive definite), and it damps down the wild values that far-out lags would otherwise produce from a handful of pairs. The price is that every autocorrelation is slightly biased toward zero, which matters most on short series like this one.

## How do you read an ACF plot?

The plot has five features, and each one is worth being able to name.

**The x-axis is the lag.** For `lh` the lags print as 0, 1, 2, 3, meaning steps of one sample, which here is 10 minutes.

**The spike at lag 0 is always 1.** It is the series correlated with itself, unshifted. It carries no information and is pure furniture. Ignore it. (The PACF panel does not draw one, which is why the two plots look offset from each other.)

**The height of each spike is \(r_k\).** Spikes above the line are positive correlations, spikes below are negative.

**The dashed blue lines are the part everyone misreads.** They sit at \(\pm 1.96/\sqrt{n}\), and they answer one specific question: *if this series were pure random noise with no memory at all, how big would an autocorrelation get, just by luck?* The answer is that about 95% of the time it would land inside those lines. So a spike poking outside the band is evidence against "this series is random noise". The 1.96 is the same 1.96 from a 95% confidence interval for a normal distribution.

```r title="Where the dashed lines actually sit"
bound <- 1.96 / sqrt(n)
bound
#> [1] 0.2829016

# which lags clear it? (dropping lag 0, which is always 1)
r <- acf(lh, plot = FALSE)$acf[-1]
which(abs(r) > bound)
#> [1] 1
round(r[abs(r) > bound], 3)
#> [1] 0.576
```

**Exactly one lag clears the band: lag 1.** With 48 readings the band sits at \(\pm 0.283\), which is wide. The lag-2 ACF of 0.182 and the lag-2 PACF of -0.223 are both real numbers computed from real data, but neither is large enough to distinguish from luck at this sample size. That width is not a flaw in the data; it is the honest price of having only 48 observations. Quadruple the series to 192 readings and the band would halve to \(\pm 0.141\), and that lag-2 PACF of -0.223 would suddenly be "significant".

> **Note:** "Inside the band" does not mean "the true autocorrelation is zero". It means "this data cannot tell zero apart from what we observed". Those are very different statements, and the difference is the entire reason a short series is hard to model. Keep the sample size in mind every time you look at one of these plots.

## What does the PACF add that the ACF doesn't?

Here is the puzzle the PACF exists to solve. Suppose hormone levels drift smoothly, so each reading pulls the next one toward it. Now ask: what is the correlation between today's reading and the reading 20 minutes ago?

It will be clearly positive. But that positive number is misleading, because the reading from 20 minutes ago moved the reading from 10 minutes ago, and *that* one moved today's. The lag-2 correlation is partly just an echo of the lag-1 relationship applied twice. The ACF cannot tell the echo apart from a genuine 20-minute effect, because it looks at lag 2 with lag 1 completely ignored.

The partial autocorrelation asks the sharper question: **once I already know the reading from 10 minutes ago, does the reading from 20 minutes ago tell me anything more?**

![Diagram showing that the reading from 20 minutes ago reaches today by two routes, an indirect chain through the 10-minute reading and a direct arrow, with the ACF measuring both and the PACF measuring only the direct one](screenshots/ACF-and-PACF-in-R-partial.webp)
*Figure 1: The reading from 20 minutes ago reaches today's reading by two routes. The ACF at lag 2 adds both together. The PACF at lag 2 keeps only the direct one, holding the 10-minute reading fixed. That is why the two disagree at lag 2 (0.182 versus -0.223) and agree exactly at lag 1, where there is no intermediate reading to hold fixed.*

That picture explains the one thing you may have already noticed in the output: **at lag 1 the ACF and PACF are both 0.576, exactly.** Of course they are. At lag 1 there is no reading in between to control for, so "the total effect" and "the direct effect" are the same quantity. The two functions can only start to differ from lag 2 onward.

Now the formalism, which is more concrete than the word "partial" suggests. The partial autocorrelation at lag \(k\) is defined as **the last coefficient of an autoregressive model of order \(k\) fitted to the series.** Fit the model

\[ x_t = \phi_{k1}x_{t-1} + \phi_{k2}x_{t-2} + \cdots + \phi_{kk}x_{t-k} + \varepsilon_t \]

where each \(\phi_{kj}\) is a coefficient and \(\varepsilon_t\) is the leftover noise, and the PACF at lag \(k\) is \(\phi_{kk}\), the coefficient on the oldest term. Every other lag is in the model as a control, exactly the way you would add covariates to a regression to isolate one predictor's effect. R's `ar.yw()` fits such a model by the Yule-Walker method, which solves for the \(\phi\) coefficients directly from the autocorrelations you already have rather than by least squares. That is precisely what `pacf()` uses internally, so the two agree exactly.

```r title="PACF at lag 2 IS the last coefficient of an AR(2) fit"
# Fit an AR(2): today's reading on the last two readings.
# order.max = 2 asks for exactly two lags; aic = FALSE stops R from
# quietly picking a shorter order for us. $ar pulls out the coefficients.
ar.yw(lh, order.max = 2, aic = FALSE)$ar
#> [1]  0.7041024 -0.2234100

# The PACF at lag 2, straight from pacf()
pacf(lh, plot = FALSE)$acf[2]
#> [1] -0.22341
```

The AR(2) fit's second coefficient is -0.2234100 and `pacf()` reports -0.22341 at lag 2. Same number. The definition is not a metaphor.

It keeps working at every lag. Fit an AR(3) and its *third* coefficient is the lag-3 PACF:

```r title="And lag 3 is the last coefficient of an AR(3) fit"
ar.yw(lh, order.max = 3, aic = FALSE)$ar
#> [1]  0.65340168 -0.06362084 -0.22694020

pacf(lh, plot = FALSE)$acf[3]
#> [1] -0.2269402
```

-0.2269402 both times. Each PACF value comes from a *different* model: the lag-2 value comes from an AR(2), the lag-3 value from an AR(3). This is why the PACF is not simply "the ACF with a correction applied", and it is also why the AR(2) coefficient on lag 1 (0.704) differs from the AR(3) one (0.653). Adding a control changes the other coefficients, just as it does in ordinary regression.

If you prefer the regression intuition to the Yule-Walker machinery, you can get very close to the same number by literally regressing out the middle reading and correlating what is left over.

```r title="The same idea, done the long way with lm()"
x_t  <- lh[3:n]          # today
x_t1 <- lh[2:(n - 1)]    # 10 minutes ago
x_t2 <- lh[1:(n - 2)]    # 20 minutes ago

# Strip the lag-1 reading's influence out of BOTH ends, then correlate the remains
today_resid   <- resid(lm(x_t  ~ x_t1))
past_resid    <- resid(lm(x_t2 ~ x_t1))
cor(today_resid, past_resid)
#> [1] -0.2184654
```

-0.218 against `pacf()`'s -0.223. Close, not identical, and the gap is instructive rather than an error: this hand-rolled version throws away the first two readings and estimates means from the trimmed vectors, while Yule-Walker uses the whole series through the ACF. The two definitions converge as the series gets longer. Use it as intuition, and let `pacf()` do the real work.

## What do AR and MA processes look like in these plots?

Everything so far has been description. Now comes the payoff the title promises, and it rests on a genuinely remarkable fact: **the two plots leave different fingerprints for the two basic kinds of time series model.** Learn the two fingerprints and you can read a model order off a picture.

Two model families matter here, and both are simpler than their names.

An **AR(p)**, or autoregressive model of order \(p\), says today's value is a weighted sum of the last \(p\) values plus fresh noise:

\[ x_t = \phi_1 x_{t-1} + \cdots + \phi_p x_{t-p} + \varepsilon_t \]

An **MA(q)**, or moving average model of order \(q\), says today's value is fresh noise plus a weighted sum of the last \(q\) *noise shocks*:

\[ x_t = \varepsilon_t + \theta_1 \varepsilon_{t-1} + \cdots + \theta_q \varepsilon_{t-q} \]

In an ARIMA(p, d, q), those are the `p` and the `q`. (The `d` in the middle is the number of differences, which the [stationarity post](Test-Stationarity-in-R.html) covers and the next section revisits.)

The cleanest way to learn a fingerprint is to look at a series whose true answer you already know, so let us build one. `arima.sim()` simulates from a model you specify. We will ask for an AR(2) with coefficients 0.6 and -0.35, 400 observations long. Since we *built* it as an AR(2), the correct answer is p = 2, and we can check whether the plots actually say so.

```r title="A simulated AR(2): we know the true answer is p = 2"
set.seed(42)
ar2 <- arima.sim(model = list(ar = c(0.6, -0.35)), n = 400)

round(acf(ar2,  lag.max = 6, plot = FALSE)$acf[2:7], 3)   # lags 1 to 6
#> [1]  0.396 -0.194 -0.258 -0.053  0.037 -0.010
round(pacf(ar2, lag.max = 6, plot = FALSE)$acf[1:6], 3)   # lags 1 to 6
#> [1]  0.396 -0.417  0.024  0.002 -0.058 -0.035

1.96 / sqrt(400)     # the band is much narrower with 400 observations
#> [1] 0.098
```

Look at the PACF: 0.396, -0.417, and then **0.024, 0.002, -0.058, -0.035**. After lag 2 it falls off a cliff and stays flat, well inside the 0.098 band. That abrupt stop is called a **cutoff**, and it lands exactly at lag 2, the true order. Meanwhile the ACF (0.396, -0.194, -0.258, -0.053) fades away gradually without ever stopping dead. That gradual fade is called **decay** or **tailing off**.

That is the AR fingerprint, and it follows directly from the definition of the PACF you just learned. The PACF at lag 3 is the third coefficient of an AR(3) fit. But the series really is an AR(2), so there is no genuine lag-3 effect to find, and that coefficient is estimated as approximately zero. The same holds for every lag past 2. **The PACF of an AR(p) must cut off after lag p, because past lag p there is no direct effect left to measure.**

Now the mirror image. Simulate an MA(1) with coefficient 0.8, where the true answer is q = 1.

```r title="A simulated MA(1): we know the true answer is q = 1"
set.seed(7)
ma1 <- arima.sim(model = list(ma = 0.8), n = 400)

round(acf(ma1,  lag.max = 6, plot = FALSE)$acf[2:7], 3)   # lags 1 to 6
#> [1] 0.532 0.055 0.022 0.024 0.018 -0.032
round(pacf(ma1, lag.max = 6, plot = FALSE)$acf[1:6], 3)   # lags 1 to 6
#> [1]  0.532 -0.317  0.236 -0.152  0.121 -0.158
```

The pattern has flipped. Now the **ACF** cuts off: 0.532 at lag 1, then 0.055, 0.022, 0.024, all crushed inside the band. And the **PACF** decays, alternating sign as it shrinks: 0.532, -0.317, 0.236, -0.152, 0.121.

The reason is the mirror of the AR argument. An MA(1) is built from only the current and previous noise shock, so readings two steps apart share no shock at all and their correlation is genuinely zero. The ACF has no choice but to cut off after lag 1.

There is even a closed form to check the height of that surviving spike against. For an MA(1) with coefficient \(\theta\), theory says \(\rho_1 = \theta/(1 + \theta^2)\). With \(\theta = 0.8\) that is \(0.8/1.64 = 0.488\), and we observed 0.532 in a sample of 400. Close, and the gap is ordinary sampling noise.

![Decision flowchart mapping which plot cuts off and which decays onto an ARIMA order: PACF cuts off at p gives AR(p), ACF cuts off at q gives MA(q), both decaying gives a mixed ARMA, and neither spiking means white noise](screenshots/ACF-and-PACF-in-R-signature.webp)
*Figure 2: The whole reading rule on one page. Find which plot stops dead and which one fades, and the order follows. The "both decay" branch is the common real-data case, and the last section explains what to do when you land there.*

Here is the same rule as a table, which is the version worth keeping next to your keyboard.

| Series is a... | ACF does this | PACF does this | You read off |
|---|---|---|---|
| AR(p) | decays gradually | **cuts off after lag p** | p, and set q = 0 |
| MA(q) | **cuts off after lag q** | decays gradually | q, and set p = 0 |
| Mixed ARMA(p, q) | decays gradually | decays gradually | neither; compare models by AIC |
| White noise | no spikes clear the band | no spikes clear the band | nothing left to model |

The memory hook that survives contact with real work: **the plot that cuts off is the plot that names its order.** PACF cuts off, the PACF's letter is p. ACF cuts off, and the other letter, q, is yours.

## So what order does the hormone series need?

Back to the 48 hormone readings, now with the fingerprints in hand.

One thing must happen first, and skipping it is the most common way to get a nonsense answer: **both plots are only readable on a stationary series**, one whose behaviour does not depend on when you look at it. If a series trends upward, every reading is close to its neighbour simply because both are near the same point on the trend, and the ACF measures the trend rather than any memory in the series. The next section shows exactly what that wreckage looks like. Let us confirm `lh` is safe.

```r title="Stationarity check before reading anything"
suppressMessages(library(tseries))

adf.test(lh)    # null hypothesis: the series HAS a unit root (is non-stationary)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  lh
#> Dickey-Fuller = -3.558, Lag order = 3, p-value = 0.04624
#> alternative hypothesis: stationary

kpss.test(lh)   # null hypothesis: the series IS stationary
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  lh
#> KPSS Level = 0.29382, Truncation lag parameter = 3, p-value = 0.1
```

Both tests agree, which is a small mercy. ADF returned p = 0.046, below 0.05, so we reject its null of a unit root and conclude the series looks stationary. KPSS returned p = 0.1, above 0.05, so we fail to reject its null of stationarity. The two tests have opposite null hypotheses, so agreement looks like disagreement until you have read [Test Stationarity in R](Test-Stationarity-in-R.html); here, both point the same way. No differencing needed, so **d = 0**.

Now read the plots. The ACF was 0.576, 0.182, -0.145, and the PACF was 0.576, -0.223, -0.227, with a band at \(\pm 0.283\). Only lag 1 clears the band, in either plot.

Read that honestly and the two fingerprints do not separate. Exactly one spike clears in the ACF, and exactly one spike clears in the PACF. "The PACF cuts off after lag 1 while the ACF decays" reads AR(1). But "the ACF cuts off after lag 1 while the PACF decays" reads MA(1), and the same two rows support that story just as well. At 48 readings the band is wide enough to swallow both tails, so the picture genuinely cannot tell the two apart. You have not misread anything, and this is not a trick: the plots have handed you a shortlist of two, which is the job they are actually good at. Fit both and let the fit choose.

```r title="Candidate 1: the AR(1)"
fit1 <- arima(lh, order = c(1, 0, 0))
fit1
#> 
#> Call:
#> arima(x = lh, order = c(1, 0, 0))
#> 
#> Coefficients:
#>          ar1  intercept
#>       0.5739     2.4133
#> s.e.  0.1161     0.1466
#> 
#> sigma^2 estimated as 0.1975:  log likelihood = -29.38,  aic = 64.76
```

The fitted `ar1` coefficient is 0.5739, with a standard error of 0.1161. The coefficient is about five times its standard error, so it is comfortably real. The `intercept` of 2.4133 is the long-run mean hormone level in IU/L, which matches the eyeball average of the raw readings. In words, the model says: each reading sits about 57% of the way from the long-run mean of 2.41 toward the previous reading, plus noise.

Now the other name on the shortlist. `arima()` takes the MA order as the third number, so an MA(1) is `order = c(0, 0, 1)`.

```r title="Candidate 2: the MA(1), and the comparison the plots could not make"
fitma <- arima(lh, order = c(0, 0, 1))
fitma
#> 
#> Call:
#> arima(x = lh, order = c(0, 0, 1))
#> 
#> Coefficients:
#>          ma1  intercept
#>       0.4810     2.4051
#> s.e.  0.0944     0.0979
#> 
#> sigma^2 estimated as 0.2123:  log likelihood = -31.05,  aic = 68.1

c(AR1 = AIC(fit1), MA1 = AIC(fitma))
#>      AR1      MA1 
#> 64.75832 68.10389
```

AIC scores a model by how well it fits, minus a penalty for every coefficient it spends; lower is better, and only differences between models on the same data mean anything. The AR(1) scores 64.76 and the MA(1) scores 68.10, so the AR(1) wins by 3.3. A common rule of thumb is that AIC gaps under about 2 are not meaningful evidence either way, so 3.3 is a real preference, if not a landslide. The plots could not separate these two candidates; one line of fitting could. That is the workflow in one move: **read the plots to get a shortlist, then fit the shortlist.**

There is one more twist, and it is the one worth carrying out of this post. Ask R to pick the AR order by AIC instead of by eye, and it disagrees with us.

```r title="What happens when we let AIC choose instead"
ar(lh)          # picks the AR order by AIC, without asking our opinion
#> 
#> Call:
#> ar(x = lh)
#> 
#> Coefficients:
#>       1        2        3  
#>  0.6534  -0.0636  -0.2269  
#> 
#> Order selected 3  sigma^2 estimated as  0.1959

fit3 <- arima(lh, order = c(3, 0, 0))
c(AR1 = AIC(fit1), AR3 = AIC(fit3))
#>      AR1      AR3 
#> 64.75832 64.18482
```

`ar()` selects order **3**, not 1. Its third coefficient, -0.2269, is that lag-3 PACF value we saw sitting just inside the significance band. AIC judges it worth keeping; the eyeball rule threw it away. And the AIC difference is 64.76 against 64.18, a gap of **0.57**, which by the rule of thumb just above is nothing at all. Note how different that is from the 3.3 that ruled out the MA(1): AIC separated *that* pair and refuses to separate this one.

So which is right? Both readings are defensible, and that is the real lesson. With 48 observations the data genuinely cannot separate an AR(1) from an AR(3). This is not a failure of your plot-reading; it is what a short series looks like when you are honest about it. Notice that the two procedures did not even disagree about the numbers, only about how much evidence a coefficient needs before it earns a place: the eyeball rule demands that a spike clear the band, and AIC only asks that adding the term improve the fit by more than its cost.

The right posture: **the ACF and PACF nominate candidates; they do not deliver verdicts.** Read the plots to get a shortlist of two or three orders, fit all of them, and choose with AIC and residual checks. Anyone who tells you the plots hand you a single unambiguous answer has been working with simulated data.

## What if the series has a trend?

`lh` was stationary, so we walked straight in. Most real series are not, and it is worth seeing exactly how badly the plots break so that you recognise it instantly.

`AirPassengers` is the classic offender: 144 monthly totals of international airline passengers, in thousands, from January 1949 to December 1960. It climbs from about 112 to about 432 over those twelve years and has a strong yearly cycle. Here is its raw ACF.

```r title="The ACF of a trending series, which tells you nothing"
acf(AirPassengers, lag.max = 24, plot = FALSE)
#> 
#> Autocorrelations of series 'AirPassengers', by lag
#> 
#> 0.0000 0.0833 0.1667 0.2500 0.3333 0.4167 0.5000 0.5833 0.6667 0.7500 0.8333 0.9167 1.0000 1.0833 
#>  1.000  0.948  0.876  0.807  0.753  0.714  0.682  0.663  0.656  0.671  0.703  0.743  0.760  0.713 
#> 1.1667 1.2500 1.3333 1.4167 1.5000 1.5833 1.6667 1.7500 1.8333 1.9167 2.0000 
#>  0.646  0.586  0.538  0.500  0.469  0.450  0.442  0.457  0.482  0.517  0.532 

1.96 / sqrt(144)
#> [1] 0.1633333
```

Every single value is enormous: 0.948, 0.876, 0.807, still 0.532 two years out, against a band of only 0.163. A beginner reads this as "incredibly strong memory at every lag". It is nothing of the sort. It is a **trend**. Because the series marches upward, any two months from the same era are both high or both low together, and that shared position on the trend line produces a large correlation at every lag without any real month-to-month memory behind it. A decaying-but-never-dying ACF like this is the classic signature of non-stationarity, not of a high-order AR.

Notice the second trap while you are here: **the lag axis reads 0.0833, 0.1667, 1.0000 instead of 1, 2, 12.** `AirPassengers` is a `ts` with `frequency = 12`, so `acf()` measures lag in *years*, and 0.0833 is one month (1/12). The lag labelled 1.0000 is twelve months. This catches everyone once. When you want integer lags, either check the frequency first or pass a plain vector.

The fix is to difference: model the change from month to month rather than the level. Taking logs first stabilises the growing seasonal swings.

```r title="After differencing, the real structure appears"
d_ap <- diff(log(AirPassengers))   # month-over-month growth rate
round(acf(d_ap, lag.max = 13, plot = FALSE)$acf[2:14], 3)   # lags 1 to 13 (months)
#> [1]  0.200 -0.120 -0.151 -0.322 -0.084  0.026 -0.111 -0.337 -0.116 -0.109  0.206  0.841  0.215
```

That is a completely different picture, and now it is readable. The wall of large positive values is gone. Most lags are small. And one value dominates everything: **lag 12 is 0.841.** Twelve months is a year. The differenced series is dominated by a yearly seasonal cycle, which is a real, interpretable structure that the raw ACF completely hid behind the trend. This is what people mean when they say the ACF is an exploratory tool: on the right series it points straight at the thing you need to model.

> **Watch out:** always check stationarity before reading either plot. A slowly decaying ACF whose spikes stay large for dozens of lags is not telling you about model order at all; it is telling you the series has a trend and you have not differenced yet. A huge spike at the seasonal lag (12 for monthly data, 4 for quarterly) after differencing means you need a seasonal term, which is where SARIMA comes in.

## When do the ACF and PACF mislead you?

You now know the rule and the workflow. This section is about the four ways the plots lie to you, because knowing them separates people who use these plots well from people who over-read them.

**1. The band's null hypothesis is white noise, so spikes appear by pure chance.** The dashed lines are drawn at the 5% level *per lag*. Look at 20 lags and you are running 20 tests, so about one false spike per plot is the expected outcome even when there is nothing there at all. Do not take that on faith; measure it.

```r title="How many false spikes does pure noise produce?"
set.seed(2026)
false_spikes <- replicate(1000, {
  wn <- rnorm(200)                                    # 200 draws of pure noise: no memory at all
  a  <- acf(wn, lag.max = 20, plot = FALSE)$acf[2:21] # its 20 autocorrelations
  sum(abs(a) > 1.96 / sqrt(200))                      # how many escape the band?
})

mean(false_spikes)          # average number of "significant" lags per plot
#> [1] 0.881
mean(false_spikes >= 1)     # share of plots with at least one false spike
#> [1] 0.578
table(false_spikes)
#> false_spikes
#>   0   1   2   3   4 
#> 422 366 135  63  14 
```

One thousand series of pure, memoryless noise. On average **0.881** lags per series poked outside the band, right in line with the 20 x 0.05 = 1 you would predict. **57.8% of these plots show at least one "significant" spike**, and 14 of the 1000 showed four. If you find a lone spike at lag 13 and invent a story about why 13 matters, this simulation is what actually produced it. Trust spikes at low lags and at seasonal lags; be deeply suspicious of an isolated spike in the middle of nowhere.

**2. Mixed ARMA models have no fingerprint at all.** The clean cutoff-versus-decay rule works when a series is purely AR or purely MA. When it is both, both plots decay and neither names an order.

```r title="An ARMA(1,1): both plots decay, neither cuts off"
set.seed(99)
arma11 <- arima.sim(model = list(ar = 0.7, ma = 0.6), n = 400)

round(acf(arma11,  lag.max = 6, plot = FALSE)$acf[2:7], 3)
#> [1] 0.847 0.592 0.416 0.306 0.223 0.161
round(pacf(arma11, lag.max = 6, plot = FALSE)$acf[1:6], 3)
#> [1]  0.847 -0.441  0.292 -0.145  0.057 -0.021
```

We built this series as an ARMA(1,1), so the truth is p = 1 and q = 1. The ACF slides down gently with no cutoff. The PACF also fades, alternating in sign. Neither stops dead anywhere. Try to read p and q off these plots and you will guess wrong, because **the information is not in the picture.** This is the "both decay" branch of Figure 2, it is extremely common on real data, and the answer is to stop squinting and compare candidate models by AIC instead.

**3. The bands get the wrong width once the series is not noise.** The \(\pm 1.96/\sqrt{n}\) band assumes white noise. Once you accept there is real autocorrelation at lag 1, the correct band for lag 2 and beyond is *wider* than the one R draws by default. So the band is mildly too generous for the later lags, which biases you toward over-reading. Another reason to be conservative about far-out spikes.

**4. The ACF is blind to anything that is not linear correlation.** Two series can have the same ACF and behave completely differently, because \(r_k\) only measures straight-line association between pairs of readings. Volatility clustering, where calm periods follow calm and wild follows wild, is the classic example: it can leave almost no trace in the ACF of the series while dominating the ACF of the *squared* series. Always plot the series itself before believing any summary of it.

Once you have fitted a model, the formal replacement for eyeballing bands is the Ljung-Box test. It fixes failure 1 head on: instead of running a separate 5% test at every lag and collecting false spikes, it asks one question about a whole *group* of lags at once. Is this batch of autocorrelations jointly indistinguishable from noise? Run it on the residuals of the AR(1) we fitted to `lh` earlier.

```r title="Ljung-Box: the formal version of squinting at a residual ACF"
# resid(fit1) is what the AR(1) could not explain. If the model captured the
# structure, what is left should be noise, with no autocorrelation anywhere.
# fitdf = 1 tells the test we spent one degree of freedom estimating ar1.
Box.test(resid(fit1), lag = 10, type = "Ljung-Box", fitdf = 1)
#> 
#> 	Box-Ljung test
#> 
#> data:  resid(fit1)
#> X-squared = 9.3564, df = 9, p-value = 0.405
```

The null hypothesis here is "the first 10 residual autocorrelations are all zero", and p = 0.405 is far above 0.05, so we have no reason to reject it. The AR(1) left nothing obvious behind. Mind the direction of that logic, because it is the same trap as the significance band: this is not proof the model is right, only an absence of evidence that it is wrong. On 48 readings, that is the most you should expect to get.

## FAQ

**What is the difference between ACF and PACF in simple terms?**
The ACF at lag k is the total correlation between a reading and the reading k steps earlier, including everything that travelled through the readings in between. The PACF at lag k is only the direct part, with all the shorter lags held fixed. They are identical at lag 1, because there is nothing in between to hold fixed, and they can differ from lag 2 onward.

**How do I choose p and q from ACF and PACF plots?**
Make the series stationary first. Then: if the PACF cuts off after lag p while the ACF decays, use AR(p), meaning order (p, d, 0). If the ACF cuts off after lag q while the PACF decays, use MA(q), meaning order (0, d, q). If both decay, the plots cannot tell you; fit a few candidates and compare AIC. Treat the reading as a shortlist to test, never as a final answer.

**Why is the ACF at lag 0 always 1?**
Because it is the correlation of the series with an unshifted copy of itself, and any variable correlates perfectly with itself. It carries no information and exists only as a reference height. `pacf()` does not print or plot it at all, which is why the two plots look shifted by one position.

**What do the blue dashed lines on an ACF plot mean?**
They sit at \(\pm 1.96/\sqrt{n}\) and mark where autocorrelations would fall about 95% of the time *if the series were pure white noise*. A spike outside is evidence against pure noise. Because it is a 5% test at every lag, roughly one spike in twenty crosses by chance, so an isolated spike far out is usually luck rather than signal.

**Why don't acf() and cor() give the same answer?**
`acf()` subtracts one shared mean from both ends rather than a separate mean for each, and it divides by \(n\) even though the lag-k sum has only \(n-k\) terms. That shrinks estimates toward zero, and more so at longer lags. The choice keeps the full set of autocorrelations mathematically coherent. On a long series the difference is negligible; on 48 readings it shows up in the third decimal.

**My ACF stays high for 20 lags and barely decays. What does that mean?**
That the series is not stationary, almost always a trend. The ACF is measuring the trend, not memory. Difference the series, or de-trend it, and read the ACF of the result. Do not interpret it as a very high-order AR.

**Do I still need ACF and PACF if auto.arima() picks the order for me?**
Yes, for two reasons. `auto.arima()` searches a restricted space and can miss things, especially seasonal structure, so the plots are how you sanity-check its choice and spot when to override it. And after fitting any model, the ACF of the residuals is the standard diagnostic: leftover spikes mean the model missed something.

## Summary

| Thing | What to remember |
|---|---|
| ACF at lag \(k\) | Total correlation with the reading \(k\) steps back, echoes through shorter lags included |
| PACF at lag \(k\) | The direct part only. Equals \(\phi_{kk}\), the last coefficient of an AR(\(k\)) fit |
| Lag 0 | Always 1, always meaningless. PACF omits it |
| Lag 1 | ACF and PACF always agree exactly: no intermediate lag to control for |
| The dashed band | \(\pm 1.96/\sqrt{n}\). Null hypothesis is white noise, tested at 5% per lag |
| AR(p) fingerprint | ACF decays, **PACF cuts off after lag p** |
| MA(q) fingerprint | **ACF cuts off after lag q**, PACF decays |
| Both decay | Mixed ARMA. The plots cannot read p and q; use AIC |
| Before reading either | Check stationarity. A slowly decaying ACF over many lags means "difference me", not "high-order AR" |
| Big spike at lag 12 | Yearly seasonality in monthly data. You need a seasonal term |
| `acf()` vs `cor()` | Different by design: one shared mean, and division by \(n\) not \(n-k\) |
| Sample size | The band is \(\pm 0.283\) at n = 48 but \(\pm 0.098\) at n = 400. Short series cannot resolve small effects |
| One spike in both plots | The fingerprints have not separated. That is a shortlist of AR(1) and MA(1), not an answer. Fit both |
| Residual check | `Box.test(resid(fit), lag = 10, type = "Ljung-Box")`. One joint test beats squinting at 20 bands |
| The honest rule | The plots nominate candidates. AIC and residual checks decide |

We opened by asking how much one hormone reading tells you about the next. The answer, from 48 real readings: the level 10 minutes ago carries a correlation of 0.576 with the level now, and nothing further back clears the significance band at this sample size. One spike in each plot nominates an AR(1) and an MA(1) without separating them, and fitting both settles it: the AR(1) wins by 3.3 AIC, with a coefficient of 0.5739. But `ar()` then prefers an AR(3) over that AR(1) by an AIC margin of 0.57, which is to say by nothing at all. Both answers are defensible, and knowing that the data cannot choose between them is a more useful thing to walk away with than a false certainty either way.

## References

1. [Forecasting: Principles and Practice, "Autocorrelation"](https://otexts.com/fpp3/acf.html) - Hyndman and Athanasopoulos. The canonical free treatment, with the trending and seasonal ACF examples worked in full.
2. [Forecasting: Principles and Practice, "Non-seasonal ARIMA models"](https://otexts.com/fpp3/non-seasonal-arima.html) - the same book on turning ACF and PACF into p and q. Its "ACF and PACF plots" section states the last-coefficient-of-an-AR(k)-fit definition that this post verified against `ar.yw()`, and is explicit that the rule only works for pure AR or pure MA.
3. [acf() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - the definitive statement of what R computes, including the \(1/n\) denominator convention that makes `acf()` differ from `cor()`.
4. [NIST/SEMATECH e-Handbook: Autocorrelation Plot](https://www.itl.nist.gov/div898/handbook/eda/section3/autocopl.htm) - a careful, example-driven account of reading the plot and the significance bands.
5. [NIST/SEMATECH e-Handbook: Partial Autocorrelation Plot](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc4463.htm) - the Box-Jenkins identification view of the PACF, and the crisp statement of the AR fingerprint: the partial autocorrelation of an AR(p) process is zero at lag p+1 and beyond.
6. [Box, Jenkins, Reinsel and Ljung, *Time Series Analysis: Forecasting and Control*](https://www.wiley.com/en-us/Time+Series+Analysis%3A+Forecasting+and+Control%2C+5th+Edition-p-9781118675021) - the origin of the identification method this whole post describes, still the reference for the theory behind the fingerprints.
7. [R documentation for the `lh` dataset](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/lh.html) - provenance for this post's running example: 48 luteinizing hormone samples at 10-minute intervals, from Diggle's *Time Series: A Biostatistical Introduction* (1991), Table A.1, series 3.
8. [CRAN Task View: Time Series Analysis](https://cran.r-project.org/view=TimeSeries) - the maintained map of the R time series ecosystem, including the packages that take over once you outgrow base `acf()`.

## Continue Learning

- [Test Stationarity in R](Test-Stationarity-in-R.html) covers the ADF and KPSS tests this post ran before reading the plots, plus how to pick the number of differences. It is the step that has to come first.
- [Time Series Objects in R](Time-Series-Objects-in-R.html) explains the `ts` class whose `frequency` attribute is why `acf(AirPassengers)` labelled its lag axis in years rather than months.
- [Visualize Time Series in R](Visualize-Time-Series-in-R.html) goes deeper on the plot-it-first habit, including the lag plots that show the same autocorrelation as a scatter rather than a spike.
