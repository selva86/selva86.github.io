---
title: "ACF and PACF: how to read the plots for ARIMA orders"
slug: "ARIMA-Mini-2"
description: "See how the ACF and PACF plots reveal a time series' AR and MA orders, using three real coffee shop order series to learn the cutoff versus tail off rule."
keywords: "ACF and PACF, ACF plot, PACF plot, autocorrelation function, partial autocorrelation, ARIMA order selection, AR order, MA order, R time series"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "2"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-1"
course_next: "ARIMA-Mini-3"
curriculum_id: "0.0.10"
lesson_access: "windowed"
catalog_blurb: "Read ACF and PACF plots to find a series' AR and MA orders."
---

=== step === cover
## ACF and PACF: how to read the plots for ARIMA orders

Today let's learn to read the following plots: the ACF and the PACF, and use that to determing the AR and MA orders a given time series needs.

Location A is a coffee shop chain's flagship store. It has been logging its daily order count for 200 days running. Here are the most recent three weeks of it.

::widget chart-plotter {"data": [{"x":1,"y":212},{"x":2,"y":223},{"x":3,"y":221},{"x":4,"y":213},{"x":5,"y":258},{"x":6,"y":255},{"x":7,"y":263},{"x":8,"y":263},{"x":9,"y":253},{"x":10,"y":237},{"x":11,"y":195},{"x":12,"y":186},{"x":13,"y":145},{"x":14,"y":195},{"x":15,"y":202},{"x":16,"y":230},{"x":17,"y":212},{"x":18,"y":201},{"x":19,"y":206},{"x":20,"y":194},{"x":21,"y":201}], "geoms": ["line"], "x": "day", "y": "orders"}

Look at that line for a second. 

Busy runs seem to sit next to busy runs, and quiet runs sit next to quiet runs, days 11 through 14 for instance. That pattern raises the real question: how many days back does a busy day's influence actually carry, and how do you read that off a plot instead of guessing at it?

=== step === concept
## What the ACF actually measures

Autocorrelation is not some exotic new idea. It is ordinary correlation, applied to a series and a copy of itself shifted back by one step. Line a value up against the value right before it, and however tightly the two move together is the lag-1 autocorrelation.

Take eight days from Location A's order count and do it by hand.

```r
# Compute the lag-1 autocorrelation of an 8-day order count by hand
x8 <- c(165, 178, 190, 182, 205, 196, 214, 208)
n <- length(x8)
xbar <- mean(x8)

r1 <- sum((x8[2:n] - xbar) * (x8[1:(n - 1)] - xbar)) / sum((x8 - xbar)^2)
round(r1, 3)
#> [1] 0.402
```

Pair each value with the one before it, centre both by the mean, and divide by the total spread of the series. The result, 0.402, is positive and fairly large, which says a high day tends to be followed by another high day.

You will never have to do that arithmetic by hand again. R's `acf()` function returns the autocorrelation at every lag in one call, and it reproduces the same 0.402 at lag 1.

```r
# Let acf() compute every lag at once, for comparison against the hand result
acf(x8, plot = FALSE)
#> 
#> Autocorrelations of series 'x8', by lag
#> 
#>      0      1      2      3      4      5      6      7 
#>  1.000  0.402  0.244  0.034 -0.313 -0.229 -0.418 -0.220 
```

Lag 0 is always 1.000, since a series always correlates perfectly with itself, so it carries no information. The rest of that table is noisy because eight days is a tiny sample, but lag 1 matches your hand computation exactly.

If you want the general recipe, here it is for any lag $k$:

$$r_k = \frac{\sum_{t=k+1}^{n} (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^{n} (y_t - \bar{y})^2}$$

Where $y_t$ is the series, $\bar{y}$ is its mean, and $k$ is how many steps back you shift. That is exactly what the code above did for $k = 1$.

You will meet the ACF as a bar plot far more often than as a table, so take a first look at what those same eight numbers look like as bars.

```r
# Draw the ACF of x8 as a bar plot instead of a table
acf(x8, plot = TRUE)
```

Each bar is one lag's autocorrelation. From here on, reading the ACF means reading bars, not scanning a table.

=== step === widget
## Autocorrelation as an ordinary scatter plot

There is another way to see exactly what that number is doing, and it makes the idea concrete for good. Pair every day in Location A's 200-day series with the day right before it. That gives 199 points, and the ordinary Pearson correlation between the two columns is the lag-1 autocorrelation.

Here is that pairing, plotted.

::widget chart-plotter {"data": [{"x":200,"y":184},{"x":184,"y":133},{"x":133,"y":183},{"x":183,"y":131},{"x":131,"y":114},{"x":114,"y":142},{"x":142,"y":151},{"x":151,"y":172},{"x":172,"y":142},{"x":142,"y":129},{"x":129,"y":160},{"x":160,"y":146},{"x":146,"y":190},{"x":190,"y":184},{"x":184,"y":192},{"x":192,"y":158},{"x":158,"y":149},{"x":149,"y":132},{"x":132,"y":137},{"x":137,"y":150},{"x":150,"y":129},{"x":129,"y":129},{"x":129,"y":139},{"x":139,"y":127},{"x":127,"y":122},{"x":122,"y":174},{"x":174,"y":141},{"x":141,"y":178},{"x":178,"y":192},{"x":192,"y":190},{"x":190,"y":188},{"x":188,"y":208},{"x":208,"y":159},{"x":159,"y":175},{"x":175,"y":200},{"x":200,"y":200},{"x":200,"y":233},{"x":233,"y":226},{"x":226,"y":213},{"x":213,"y":186},{"x":186,"y":189},{"x":189,"y":170},{"x":170,"y":154},{"x":154,"y":166},{"x":166,"y":187},{"x":187,"y":146},{"x":146,"y":169},{"x":169,"y":170},{"x":170,"y":148},{"x":148,"y":181},{"x":181,"y":155},{"x":155,"y":179},{"x":179,"y":222},{"x":222,"y":255},{"x":255,"y":239},{"x":239,"y":244},{"x":244,"y":243},{"x":243,"y":251},{"x":251,"y":199},{"x":199,"y":177},{"x":177,"y":136},{"x":136,"y":110},{"x":110,"y":112},{"x":112,"y":116},{"x":116,"y":132},{"x":132,"y":143},{"x":143,"y":217},{"x":217,"y":242},{"x":242,"y":206},{"x":206,"y":134},{"x":134,"y":149},{"x":149,"y":187},{"x":187,"y":139},{"x":139,"y":136},{"x":136,"y":190},{"x":190,"y":166},{"x":166,"y":197},{"x":197,"y":172},{"x":172,"y":156},{"x":156,"y":134},{"x":134,"y":155},{"x":155,"y":152},{"x":152,"y":153},{"x":153,"y":167},{"x":167,"y":131},{"x":131,"y":121},{"x":121,"y":103},{"x":103,"y":148},{"x":148,"y":166},{"x":166,"y":178},{"x":178,"y":185},{"x":185,"y":198},{"x":198,"y":188},{"x":188,"y":214},{"x":214,"y":173},{"x":173,"y":147},{"x":147,"y":121},{"x":121,"y":180},{"x":180,"y":181},{"x":181,"y":206},{"x":206,"y":232},{"x":232,"y":209},{"x":209,"y":143},{"x":143,"y":153},{"x":153,"y":162},{"x":162,"y":195},{"x":195,"y":163},{"x":163,"y":152},{"x":152,"y":180},{"x":180,"y":209},{"x":209,"y":188},{"x":188,"y":185},{"x":185,"y":158},{"x":158,"y":183},{"x":183,"y":194},{"x":194,"y":187},{"x":187,"y":236},{"x":236,"y":298},{"x":298,"y":227},{"x":227,"y":224},{"x":224,"y":195},{"x":195,"y":205},{"x":205,"y":172},{"x":172,"y":162},{"x":162,"y":184},{"x":184,"y":142},{"x":142,"y":152},{"x":152,"y":194},{"x":194,"y":183},{"x":183,"y":153},{"x":153,"y":143},{"x":143,"y":158},{"x":158,"y":173},{"x":173,"y":194},{"x":194,"y":176},{"x":176,"y":153},{"x":153,"y":149},{"x":149,"y":134},{"x":134,"y":115},{"x":115,"y":108},{"x":108,"y":94},{"x":94,"y":107},{"x":107,"y":120},{"x":120,"y":102},{"x":102,"y":99},{"x":99,"y":126},{"x":126,"y":145},{"x":145,"y":134},{"x":134,"y":165},{"x":165,"y":144},{"x":144,"y":154},{"x":154,"y":136},{"x":136,"y":136},{"x":136,"y":121},{"x":121,"y":163},{"x":163,"y":226},{"x":226,"y":247},{"x":247,"y":189},{"x":189,"y":158},{"x":158,"y":182},{"x":182,"y":201},{"x":201,"y":172},{"x":172,"y":160},{"x":160,"y":169},{"x":169,"y":192},{"x":192,"y":194},{"x":194,"y":170},{"x":170,"y":141},{"x":141,"y":132},{"x":132,"y":161},{"x":161,"y":166},{"x":166,"y":150},{"x":150,"y":186},{"x":186,"y":174},{"x":174,"y":205},{"x":205,"y":202},{"x":202,"y":213},{"x":213,"y":230},{"x":230,"y":212},{"x":212,"y":223},{"x":223,"y":221},{"x":221,"y":213},{"x":213,"y":258},{"x":258,"y":255},{"x":255,"y":263},{"x":263,"y":263},{"x":263,"y":253},{"x":253,"y":237},{"x":237,"y":195},{"x":195,"y":186},{"x":186,"y":145},{"x":145,"y":195},{"x":195,"y":202},{"x":202,"y":230},{"x":230,"y":212},{"x":212,"y":201},{"x":201,"y":206},{"x":206,"y":194},{"x":194,"y":201}], "geoms": ["point"], "x": "prior day orders", "y": "same day orders"}

Press Run and you get a Pearson correlation of about 0.749, right beside the ACF's own 0.748 for the same lag. The tiny gap between the two is not a mistake: `acf()` weighs its sum slightly differently near the two ends of the series, while `cor()` here is an ordinary correlation on 199 complete pairs. Both numbers are saying the exact same thing: yesterday's count is a genuinely good predictor of today's.

=== step === concept
## What the PACF strips out

The lag-2 autocorrelation is not as clean as lag 1, though. Some of it is real: today's count really can depend directly on the count two days back. But some of it is indirect, carried through yesterday. If today depends on yesterday, and yesterday depends on the day before, then today ends up looking correlated with two days back even without any direct link between them at all.

The partial autocorrelation function, the PACF, is built to separate the two. At each lag it reports only the direct relationship, after removing whatever passes through the lags sitting in between. Lag 1 is unaffected, since there is nothing in between to remove. From lag 2 onward, the ACF and the PACF can look very different.

```r
# Simulate Location A's 200-day order count and compare its ACF and PACF
library(forecast)
set.seed(706)
a_orders <- round(180 + 25 * arima.sim(model = list(ar = 0.7), n = 200))

Acf(a_orders, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'a_orders', by lag
#> 
#>     0     1     2     3     4     5     6     7     8 
#> 1.000 0.748 0.536 0.385 0.278 0.188 0.137 0.120 0.142 

Pacf(a_orders, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'a_orders', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.748 -0.052  0.004  0.003 -0.030  0.028  0.043  0.085 
```

[NOTE]
Notice `Acf()` and `Pacf()`, from the forecast package, start their tables at lag 1, while base `acf()` keeps lag 0. Nothing else differs between the two, so use whichever reads more clearly.

Read lag 2 across both tables. The ACF still shows 0.536, a fairly strong number. The PACF shows -0.052, essentially nothing. Once the direct lag-1 link is accounted for, there is no meaningful direct lag-2 relationship left in Location A's orders. Whatever showed up at lag 2 in the ACF came only from lag 1, not from any direct relationship at that lag.

=== step === widget
## Is a bar real signal or just noise?

Every ACF or PACF bar is computed from a finite sample, and even a series with no real autocorrelation at all will show small nonzero bars from sampling noise alone. So before reading anything into a bar, you need a rule for telling real signal from noise.

That rule is a two-tailed hypothesis test, run separately at every lag. The null hypothesis is that the true autocorrelation at that lag is zero. Standardize a bar under that null hypothesis and it turns into a z-score, one you can compare against the usual boundary for a 5% test:

$$\pm \frac{1.96}{\sqrt{n}}$$

For Location A's 200 days, PACF lag 1 was 0.748. Standardized, that is 0.748 times the square root of 200, about 10.6, way past 1.96. Lag 2 was -0.052, which standardizes to about -0.7, comfortably inside the boundary. Drag the slider below and place lag 1's value on the same curve every other standardized bar sits on.

::widget null-distribution {"tails": 2, "max": 12, "start": 10.6, "label": "lag 1 autocorrelation, standardized"}

At z equal to 10.6 the shaded tail area is practically nothing, which is exactly what "way outside the band" looks like as a probability. Now imagine dragging it back to -0.7: the shaded area grows to ordinary, unremarkable size, which is what a noise bar looks like.

In practice you almost never standardize a bar yourself. The ACF and PACF plots draw the band directly, at plus-or-minus 1.96 over the square root of n, so any bar crossing those dashed lines has already cleared this same test. For Location A that boundary works out to 1.96 divided by the square root of 200, about 0.139.

=== step === quiz
## Quick check: signal or noise

Location A's PACF gave a standardized value of z = 10.6 at lag 1 and z = -0.7 at lag 2.

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Lag 1, because its standardized value sits far outside the plus-or-minus 1.96 boundary. ::ok Right. 10.6 is nowhere near the boundary, it is deep in the rejection region, so lag 1 is a real, unmistakable signal. Lag 2's -0.7 sits well inside plus-or-minus 1.96, so it reads as noise.
- Lag 2, because its raw autocorrelation of -0.052 is a negative number, and negative bars are more surprising than positive ones. ::no
- Both, since every bar on a plotted ACF or PACF looks about the same height. ::no
- Neither, since you cannot tell signal from noise without also seeing the p-value printed next to the plot. ::no A standardized value past plus-or-minus 1.96 is already the test result; there is nothing extra to look up. Judge each bar by its own z-score against that fixed boundary, never by how tall it happens to look, and never by its sign alone.

=== step === concept
## Cutoff versus tail off

Two words carry the entire reading method from here on, so make them concrete. A plot **cuts off** when its bars drop inside the band after some lag and stay there. A plot **tails off** when its bars shrink gradually, lag after lag, sometimes fading smoothly and sometimes flipping sign as they go.

Location A shows one of each.

```r
# Plot Location A's ACF and PACF side by side
Acf(a_orders, plot = TRUE, lag.max = 8)
Pacf(a_orders, plot = TRUE, lag.max = 8)
```

The ACF shrinks gradually across all eight lags, from 0.748 down to 0.142, never dropping cleanly to nothing. That gradual fade is a tail off. The PACF does something completely different: 0.748 at lag 1, then every lag after it, -0.052 up to 0.085, sits inside the 0.139 band and stays there. That abrupt drop after lag 1, followed by nothing, is a cutoff.

=== step === concept
## Reading the AR order p from the PACF
::prose-only reads the same ACF and PACF plots already shown in the previous step, this time counting bars instead of naming their shape

An autoregressive process of order $p$, an AR(p), predicts each value from its own previous $p$ values. Its pattern is fixed: **the ACF tails off, and the PACF cuts off at lag $p$.** So to find $p$, count how many PACF bars clear the band before it drops in and stays.

For Location A, only lag 1 clears the 0.139 band; every lag after it sits inside. So $p = 1$. That matches exactly how Location A's series was built: each day's count depends on the one day before it, not on the one before that. One clean cutoff, one real AR term.

=== step === concept
## Reading the MA order q from the ACF

A moving-average process of order $q$, an MA(q), builds each value from the last $q$ random shocks rather than its own past values. Its pattern mirrors the AR case exactly: **the ACF cuts off at lag $q$, and the PACF tails off.** So for $q$ you read the ACF, not the PACF.

Location B is the mall kiosk in the same chain, and it runs a promo email that spikes orders for exactly one day before fading out. 250 days of its order count were logged.

```r
# Simulate Location B's 250-day order count as an MA(1) process
set.seed(807)
b_orders <- round(140 + 20 * arima.sim(model = list(ma = 0.8), n = 250))

Acf(b_orders, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'b_orders', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000  0.456 -0.001  0.052  0.019  0.016  0.060  0.068 -0.014 

Pacf(b_orders, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'b_orders', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.456 -0.265  0.236 -0.176  0.161 -0.056  0.103 -0.141 
```

For 250 days the band is 1.96 divided by the square root of 250, about 0.124. The ACF clears it at lag 1 (0.456), then drops inside at lag 2 (-0.001) and stays there: a clean cutoff after lag 1, so $q = 1$. The PACF does the opposite. It never cuts off; it tails off instead, and it flips sign lag after lag: 0.456, -0.265, 0.236, -0.176, and on. That oscillating fade is exactly the PACF shape an MA process produces.

[WARNING]
The single most common mistake at this point is reading the order off the wrong plot: counting PACF bars for q, or ACF bars for p. The rule never changes. AR order is read from the PACF. MA order is read from the ACF. Whichever plot is doing the cutting off names the order you are reading.

=== step === concept
## When both plots tail off: comparing candidates with AICc

Real data rarely sorts itself into a pure AR or a pure MA process. Location C is where the chain runs both effects together: loyal regulars who tend to keep visiting on the days they already visit, plus its own promo email. 300 days of its order count were logged.

```r
# Simulate Location C's 300-day order count as an ARMA(1,1) process
set.seed(902)
c_orders <- round(160 + 22 * arima.sim(model = list(ar = 0.6, ma = 0.4), n = 300))
ggtsdisplay(c_orders)
```

Read the ACF and PACF as numbers to see exactly what "neither one cuts off" looks like.

```r
# Read Location C's ACF and PACF as numbers
Acf(c_orders, plot = FALSE, lag.max = 8)
#> 
#> Autocorrelations of series 'c_orders', by lag
#> 
#>     0     1     2     3     4     5     6     7     8 
#> 1.000 0.735 0.432 0.278 0.194 0.165 0.134 0.094 0.031 

Pacf(c_orders, plot = FALSE, lag.max = 8)
#> 
#> Partial autocorrelations of series 'c_orders', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.735 -0.236  0.136 -0.028  0.082 -0.038  0.004 -0.080 
```

With 300 days the band is about 0.113. Both tables shrink gradually rather than dropping cleanly: the ACF fades 0.735 down to 0.031, the PACF fades and flips sign, 0.735, -0.236, 0.136, -0.028, and on. Neither plot gives you a single clean cutoff lag, so neither $p$ nor $q$ is directly readable here. Both plots tailing off is itself the pattern: it says you need both kinds of term, but not exactly how many of each.

When counting bars stops working, fit a short list of small candidate models instead and compare them by AICc. AICc measures how well a model fits the data, then subtracts a penalty for every extra parameter the fit used, correcting further for how much data you actually have. The model with the lowest AICc wins, the fit that explains the data without spending parameters it did not need.

```r
# Let auto.arima search small candidate orders
auto.arima(c_orders, seasonal = FALSE, stepwise = FALSE, approximation = FALSE)
#> Series: c_orders 
#> ARIMA(1,0,1) with non-zero mean 
#> 
#> Coefficients:
#>          ar1     ma1      mean
#>       0.5618  0.3993  153.3911
#> s.e.  0.0639  0.0762    4.2888
#> 
#> sigma^2 = 552.4:  log likelihood = -1371.78
#> AIC=2751.57   AICc=2751.7   BIC=2766.38
```

`auto.arima()` selected ARIMA(1,0,1), an ARMA(1,1), and recovered ar = 0.56 and ma = 0.40, close to the true 0.6 and 0.4 the series was built with. Compare its AICc directly against a nearby candidate, an AR(2), to see the penalty actually make a difference.

```r
# Compare the AICc of ARMA(1,1) against AR(2) directly
fit_arma11 <- Arima(c_orders, order = c(1, 0, 1))
fit_ar2    <- Arima(c_orders, order = c(2, 0, 0))
round(c(ARMA11 = fit_arma11$aicc, AR2 = fit_ar2$aicc), 1)
#> ARMA11    AR2 
#> 2751.7 2757.4 
```

ARMA(1,1) scores 2751.7 against AR(2)'s 2757.4. Lower wins, so ARMA(1,1) is preferred, and it is the correct structure here. That will not always happen; sometimes a nearby candidate scores just as well or better even though it is not how the data was actually built. AICc is a fallback for when the plots stop giving you a direct answer, not a guarantee of the one true model.

[TIP]
When both plots tail off, start near ARIMA(1,0,1) and fit a small grid of nearby candidates, an AR(2), an MA(2), and so on, then keep whichever has the lowest AICc.

=== step === quiz
## Quick check: matching the fingerprint

Suppose a series' PACF clears the band at lags 1 and 2, then drops inside and stays there, while its ACF fades gradually across many lags without ever cutting off cleanly.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Read p from the PACF cutoff: it clears the band through lag 2, so p = 2. ::ok Exactly. The PACF is the one cutting off here, at lag 2, and the ACF is the one tailing off, which is the textbook AR(2) pattern. Read p from whichever plot cuts off, never from the one that is fading.
- Read q from the ACF: since it never cuts off cleanly, q = 0. ::no
- Both plots are behaving like an ARMA process here, so fall back to comparing candidates by AICc. ::no
- Count the ACF's gradual fade as the order: it takes many lags to disappear, so p is roughly that many lags. ::no A tailing-off plot never gives you an order by counting how long it takes to fade; that count is not a parameter of anything. The fallback to AICc is for when BOTH plots tail off. Here the PACF gives a clean, direct cutoff, so read p straight from it.

=== step === tryit
## Your turn: read q for Location B

`b_orders` still holds Location B's 250-day order count. Compute its significance band, then use it to read q from the ACF.

```r
# b_orders holds Location B's 250-day order count.
# Compute its significance band: 1.96 divided by the square root
# of the number of days.
# band_b <- 1.96 / sqrt(___)
# Then compare Acf(b_orders, plot = FALSE, lag.max = 6) against it
# and read where the bars cut off.
```
::check {"regex": "1\\.96\\s*/\\s*sqrt[(]", "gate": true, "difficulty": "intermediate", "ok": "band_b comes out to 0.124. Only lag 1 (0.456) clears it; lag 2 (-0.001) already sits inside and everything after stays there. So Location B's ACF cuts off after lag 1, and q = 1, exactly the promo-email effect it was built to have.", "no": "The band formula is 1.96 divided by the square root of the number of days: 1.96 / sqrt(250). Once you have that number, compare each bar in Acf(b_orders, plot = FALSE, lag.max = 6) against it."}
::solution
```r
# Compute Location B's significance band, then read q from its ACF
band_b <- 1.96 / sqrt(250)
round(band_b, 3)
#> [1] 0.124

Acf(b_orders, plot = FALSE, lag.max = 6)
#> 
#> Autocorrelations of series 'b_orders', by lag
#> 
#>      0      1      2      3      4      5      6 
#>  1.000  0.456 -0.001  0.052  0.019  0.016  0.060 
```

=== step === concept
## References

- [Time Series Analysis: Forecasting and Control](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118619193) - Box, Jenkins, Reinsel and Ljung, the book that defined the Box-Jenkins identification method behind the cutoff and tail-off rules for reading ACF and PACF plots.
- [Forecasting: Principles and Practice, the ARIMA chapter](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos. A free, thorough walkthrough of ACF, PACF and order selection, with more worked examples.
- [Introduction to Time Series and Forecasting](https://doi.org/10.1007/978-3-319-29854-2) - Brockwell and Davis, for the full derivation of why the partial autocorrelation strips out the intermediate lags.
- [R documentation: stats::acf](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - the base R functions the hand computation matches.
- [The forecast package](https://pkg.robjhyndman.com/forecast/) - Hyndman's reference for `Acf()`, `Pacf()` and `auto.arima()`.

=== step === complete
## Quick recap

You read three patterns across three coffee shops, and each one turned into an exact order.

- Location A: the ACF tailed off, the PACF cut off after lag 1. That is an AR(1), p = 1.
- Location B: the ACF cut off after lag 1, the PACF tailed off, flipping sign as it faded. That is an MA(1), q = 1.
- Location C: both plots tailed off. No direct cutoff meant no direct answer, so a small set of candidates got compared by AICc, and ARMA(1,1) won at 2751.7 against AR(2)'s 2757.4.

Whatever series you meet next, the same two questions apply. Does the PACF cut off? Read p from it. Does the ACF cut off instead? Read q from it. Do both tail off? Stop counting bars and compare a few small candidates by AICc.
