---
title: "Spectral Analysis in R: Periodogram and Power Spectrum"
slug: "Spectral-Analysis-in-R"
description: "Learn spectral analysis in R: read a periodogram, build the power spectrum with fft(), smooth it, and filter a cycle out. Runnable code with real output."
keywords: "spectral analysis R, periodogram R, power spectrum R, spec.pgram, fft in R, frequency domain R, Fourier analysis R, smoothing periodogram"
auto_link_terms: "spectral analysis|spectral analysis in R|periodogram|periodograms|power spectrum|spectral density|frequency domain|Fourier frequency|Fourier frequencies|Nyquist frequency|spec.pgram|discrete Fourier transform|dominant cycle"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "FR-foun-3"
post_type: "FR"
fr_parent: "Test-Stationarity-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Spectral analysis answers one question about a time series: which cycle lengths account for its ups and downs, and how strongly? The periodogram is the chart that answers it, turning a series of numbers over time into a plot of power against cycle length, where a tall spike means a strong repeating cycle. This post builds that chart in R from the ground up, checks it against a series whose cycles we planted ourselves, and then uses it on real data.</p>

## What does a periodogram tell you?

Meet the running example for this post: **Bluebird Bakery**, which has recorded how many loaves it sold every day for two years. We are going to build those 728 days of sales ourselves, out of ingredients we choose, so that we know the right answer before we start. That is the only honest way to judge a method you have not used before.

The bakery's sales have three ingredients. A baseline of about 200 loaves a day. A **weekly** rhythm: weekends are busy, Tuesdays are dead, and that pattern repeats every 7 days. A **yearly** rhythm: summer tourists lift sales for months at a time, repeating every 364 days. On top of all that, random day-to-day noise (a rainy morning, a coach party, a broken oven).

So we know, by construction, that this series contains cycles of length 7 and 364. Now watch the periodogram find the 7 without being told.

```r title="728 days of loaf sales, and the periodogram that finds the weekly cycle"
set.seed(42)
day    <- 1:728
weekly <- 40 * sin(2 * pi * day / 7)      # busy weekends: repeats every 7 days
yearly <- 25 * sin(2 * pi * day / 364)    # summer tourists: repeats every 364 days
noise  <- rnorm(728, mean = 0, sd = 12)   # rain, coach parties, broken ovens
loaves <- round(200 + weekly + yearly + noise)
bakery <- ts(loaves)

head(loaves, 14)   # the first two weeks of sales
#>  [1] 248 233 223 192 168 170 221 234 267 221 203 194 158 203

# The periodogram: how much of the variation sits at each cycle length?
pg <- spec.pgram(bakery, taper = 0, detrend = FALSE, fast = FALSE, plot = FALSE)

peak <- which.max(pg$spec)   # the frequency holding the most power
pg$freq[peak]                # measured in cycles per day
#> [1] 0.1428571
1 / pg$freq[peak]            # flip it over to get days per cycle
#> [1] 7
```

Read what just happened, because it is the whole idea of this post in one block. We handed `spec.pgram()` a bare vector of 728 daily sales counts. We did not tell it that bakeries have weekends. We did not tell it to look for a 7. It came back and said: the strongest repeating pattern in this series happens `0.1428571` times per day, which is once every **7 days**.

Line by line. `set.seed(42)` fixes the random noise so your numbers match the ones printed here exactly. `day` is just the day counter, 1 to 728. The `sin(2 * pi * day / 7)` term is the standard way to write a wave that completes one full cycle every 7 days: as `day` advances by 7, the quantity inside `sin()` advances by \(2\pi\), which is one full turn. Multiplying by 40 makes that wave swing 40 loaves either side of the baseline. The `yearly` line is the same trick with a 364-day turn and a gentler 25-loaf swing. `ts()` labels the vector as a time series.

Then the two pieces of the returned object that matter. `spec.pgram()` hands back a list, and `pg$spec` is the **power** at each frequency: a vector of 364 numbers, one per frequency the data can resolve. `pg$freq` holds the matching frequencies, in the same order. `which.max()` finds where the power is greatest, and `1 / frequency` converts a frequency back into a cycle length. That reciprocal is the single most useful reflex in spectral analysis: **frequency and period are the same fact written two ways.**

The three arguments `taper = 0`, `detrend = FALSE`, and `fast = FALSE` switch off three conveniences that `spec.pgram()` normally applies for you. They are switched off here so this first calculation is the raw, textbook definition and nothing else. Each one gets turned back on later, with a reason, in the section on those knobs. `plot = FALSE` just says "return the numbers, do not draw yet".

Now let us draw it. The picture is what makes the idea stick.

```r title="The series on top, its periodogram underneath"
par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))

plot(bakery, main = "Bluebird Bakery: daily loaf sales",
     xlab = "day", ylab = "loaves", col = "steelblue")

plot(pg$freq, pg$spec, type = "h", log = "y", col = "steelblue",
     main = "Periodogram: power at each frequency",
     xlab = "frequency (cycles per day)", ylab = "power (log scale)")
abline(v = 1/7, col = "tomato", lty = 2)
text(1/7, max(pg$spec), "1/7 = weekly", pos = 4, col = "tomato")

par(mfrow = c(1, 1))
```

The top panel is what you would normally stare at: a thick blue band of daily sales that wobbles a lot, with a slow summer swell you can just about make out. The weekly cycle is in there, but 728 days squeezed onto one axis turns it into a solid smear. Your eye cannot pull it out.

The bottom panel is the same data with nothing added and nothing removed, just re-expressed. Almost every frequency sits near the bottom of the log scale, and one spike towers over everything at the red dashed line where frequency equals 1/7. There is a second spike jammed against the left edge, at the very lowest frequencies, which is the yearly cycle. The periodogram has taken a pattern your eye could not see and made it the tallest thing on the chart.

> **Note:** `type = "h"` draws each frequency as its own vertical spike rather than joining them into a line, which is the honest way to show a periodogram: the values at neighbouring frequencies are separate estimates, not a smooth curve. The `log = "y"` scale is near-compulsory here, because the peak is over 15,000 times taller than a typical noise frequency and a linear axis would flatten everything else to zero.

## What are frequency, period, and the Fourier grid?

We have used "frequency" and "period" loosely. Pin them down now, because every argument in this post is measured in one of those units.

The **period** of a cycle is how long one full repetition takes: 7 days for the bakery's weekly rhythm. The **frequency** is how many repetitions fit into one time unit: 1/7 of a cycle per day, or about 0.1429. They are reciprocals, \(f = 1/T\), so a long period means a low frequency and a short period means a high frequency. Spectral analysis works in frequency; humans think in periods; `1/f` is the bridge you walk back and forth across.

The frequencies you can actually estimate are not arbitrary. With \(n\) observations, the periodogram is evaluated on a fixed grid called the **Fourier frequencies**:

\[ f_j = \frac{j}{n}, \qquad j = 1, 2, \ldots, \frac{n}{2} \]

Two facts fall straight out of that formula, and both have practical bite.

```r title="The grid of frequencies your data can resolve"
length(bakery)     # n
#> [1] 728

head(pg$freq, 3)   # the first three Fourier frequencies: 1/728, 2/728, 3/728
#> [1] 0.001373626 0.002747253 0.004120879

1 / 728            # the spacing between neighbours: the resolution
#> [1] 0.001373626

max(pg$freq)       # the highest frequency: the Nyquist frequency
#> [1] 0.5

length(pg$freq)    # so there are n/2 of them
#> [1] 364
```

The first fact is **resolution**. The grid spacing is \(1/n\), so the only way to tell two nearby frequencies apart is to collect more data. With 728 days we can distinguish frequencies 0.00137 apart, and nothing finer. This is why a short series cannot separate a 30-day cycle from a 31-day one: both land on the same grid point, and they merge into a single peak.

The second fact is the **Nyquist frequency**, the 0.5 above. It is the highest frequency the grid reaches, and it means one cycle every 2 days. That is a hard physical limit, not an R quirk: you need at least two observations per cycle (one up, one down) to see a cycle at all. With daily data you can never detect a twice-daily rhythm. If the bakery has a morning rush and an afternoon lull, daily totals have thrown that away before the analysis starts. **The sampling interval decides what is knowable.** No method recovers it later.

Now that the units are clear, let us ask the periodogram for the top two peaks rather than just the winner, and check both against what we planted.

```r title="The two tallest peaks, against the two cycles we built in"
top <- order(pg$spec, decreasing = TRUE)[1:2]

data.frame(freq        = round(pg$freq[top], 6),
           period_days = round(1 / pg$freq[top], 1),
           power       = round(pg$spec[top]))
#>       freq period_days  power
#> 1 0.142857           7 285231
#> 2 0.002747         364 113919
```

Both planted cycles come back exactly: 7 days and 364 days. `order(..., decreasing = TRUE)[1:2]` grabs the positions of the two largest power values, and we print the frequency, its reciprocal, and the power side by side.

The two peaks land on exact integers here for a reason worth knowing. We chose 728 days, and 728 = 104 x 7 = 2 x 364, so both true cycles fall precisely on a Fourier frequency (104/728 and 2/728). Real series are rarely so tidy. When a true cycle falls between two grid points, its power gets split across the neighbours and smeared into the frequencies around them, an effect called **leakage**. Tapering, later in this post, is the standard defence.

Notice also that the weekly peak carries about 2.5 times the power of the yearly peak, which matches how we built the series: the weekly wave had amplitude 40, the yearly one amplitude 25, and power scales with the square of amplitude. \(40^2 / 25^2 = 2.56\). The periodogram is not just locating cycles, it is measuring how big they are.

## How is the periodogram actually computed?

So far `spec.pgram()` has been a black box that returns the right answer. Open it. The whole calculation is three lines of base R, and understanding them means you will never be confused by a spectral argument again.

The tool underneath is the **discrete Fourier transform** (DFT). The DFT compares your series against a pure wave at each Fourier frequency and reports how strongly the two match. For frequency \(f_j\), it computes

\[ X_j = \sum_{t=1}^{n} x_t \, e^{-2\pi i f_j t} \]

where \(x_t\) is the observation at time \(t\), \(n\) is the series length, and \(i\) is the imaginary unit, the number whose square is -1. If that exponential is unfamiliar, here is all you need: \(e^{-2\pi i f_j t}\) is a compact way of writing a sine and cosine wave at frequency \(f_j\) at the same time, and the sum measures how much of that wave is present in your data. Each \(X_j\) is a complex number holding two facts: how strongly the wave is present, and where its peaks sit in time.

The periodogram throws away the second fact and keeps the first, squared:

\[ I(f_j) = \frac{1}{n} \left| X_j \right|^2 \]

The vertical bars mean the **modulus**: the size of the complex number, which R computes with `Mod()`. Squaring it turns "how strongly present" into power, and dividing by \(n\) keeps the scale comparable across series of different lengths. That is the entire definition.

![Flowchart of the periodogram calculation from 728 daily loaf counts through centring, fft, and Mod squared over n, to the peak at 7 days](screenshots/Spectral-Analysis-in-R-dft.webp)
*Figure 1: The periodogram in four steps. Centre the series, transform it with `fft()`, square the size of each complex number, and read off the frequency with the tallest bar. The transform moves the same information from the time domain to the frequency domain; it does not add or remove anything.*

Now build it by hand and check it against R's version.

```r title="The periodogram in three lines, matched against spec.pgram"
n       <- length(bakery)
centred <- bakery - mean(bakery)   # remove the 200-loaf baseline
X       <- fft(centred)            # one complex number per frequency
power   <- Mod(X)^2 / n            # size squared, scaled by n

# fft() returns n values; the second half mirrors the first, so keep n/2
manual <- power[2:(n/2 + 1)]

head(round(manual, 2), 3)     # our hand-built version
#> [1]     18.61 113918.63     50.56
head(round(pg$spec, 2), 3)    # R's spec.pgram
#> [1]     18.61 113918.63     50.56

all.equal(manual, as.numeric(pg$spec))
#> [1] TRUE
```

Every number agrees. `all.equal()` compares two numeric vectors allowing for tiny floating-point differences, and it returned `TRUE`, meaning our three lines reproduced `spec.pgram()` across all 364 frequencies.

Walk the four steps. We subtract the mean first, because a series sitting at 200 is mostly a constant, and a constant is a cycle of infinite length that would otherwise dominate the low frequencies and drown out real structure. `fft()` is R's fast Fourier transform: it computes every \(X_j\) at once, and "fast" refers to the algorithm being clever about it, not to any approximation. The result is exact. `Mod(X)^2 / n` applies the definition above verbatim. Finally we keep elements 2 through `n/2 + 1`: element 1 is frequency zero (the mean, which we already removed), and the second half of an `fft()` result on real data is a mirror image of the first, carrying no new information.

The limit worth knowing: the periodogram is only the whole story for a series built from fixed sine waves plus noise, which is exactly what we constructed. For series whose "cycles" drift in length or amplitude (most economic and biological data), a peak is a summary rather than a law, and it can move if you rerun on a different window of the same process. That is not a flaw in the computation, it is a statement about what the model assumes.

## Why is the raw periodogram so noisy?

Look again at the bottom panel of the periodogram we drew in the first section. Away from the two towers, the values scatter wildly from one frequency to the next. It is tempting to assume more data would tidy that up. It will not, and the reason is the single most important fact about the raw periodogram.

Here is the demonstration. Take pure random noise, which by definition has **no** cycles, so its true spectrum is a flat horizontal line. Compute the periodogram at two very different sample sizes and measure how jagged each one is, using the ratio of the standard deviation of the values to their mean.

```r title="Ten times more data, exactly as jagged"
set.seed(1)
wn200  <- spec.pgram(ts(rnorm(200)),  taper = 0, detrend = FALSE, fast = FALSE, plot = FALSE)
wn2000 <- spec.pgram(ts(rnorm(2000)), taper = 0, detrend = FALSE, fast = FALSE, plot = FALSE)

round(sd(wn200$spec)  / mean(wn200$spec),  3)    # n = 200
#> [1] 1.005
round(sd(wn2000$spec) / mean(wn2000$spec), 3)    # n = 2000
#> [1] 1.018
```

Ten times as much data, and the scatter is identical. This surprises nearly everyone, because every other estimator you have met gets more precise as \(n\) grows. The periodogram does not. In the language of statistics it is **inconsistent**: its variance does not shrink towards zero as the sample grows.

The reason is a counting argument. When you add more observations, you do not get more precise estimates at the frequencies you already had. You get **more frequencies**, each still estimated from effectively the same tiny amount of information: one sine and one cosine coefficient. Two numbers, forever, no matter how long the series.

"Two numbers" has a formal name, and R will tell you it outright.

```r title="Two degrees of freedom, and what that costs you"
pg$df          # degrees of freedom behind each estimate
#> [1] 2

pg$bandwidth   # the frequency width each estimate represents
#> [1] 0.0003965318

# A 95% interval for the true power, as a multiple of the estimate
round(pg$df / qchisq(c(0.975, 0.025), pg$df), 4)
#> [1]  0.2711 39.4979
```

Read that last line slowly, because it is alarming and it is correct. Each periodogram value follows a chi-squared distribution with **2 degrees of freedom**, scaled by the true power. Inverting that gives a 95% confidence interval running from **0.27 times** the estimate to **39.5 times** it. If a raw periodogram shows a value of 100, the truth is somewhere between 27 and 3,950.

That is a factor of 145 from end to end, and it does not improve with more data. So the raw periodogram is an unbiased but hopelessly imprecise estimate of the spectrum at any single frequency. It found the bakery's weekly cycle only because that peak is more than 15,000 times the surrounding noise, which is far too big for even a 39x interval to explain away. For anything subtler, a raw periodogram will happily show you a "peak" that is pure chance.

> **Watch out:** Never read a bump in a raw periodogram as a real cycle. With 364 frequencies, each carrying a 39x upper interval, some of them will look impressive for no reason at all. Smooth first, then interpret.

## How do you smooth the periodogram?

If the problem is that each estimate rests on 2 degrees of freedom, the fix follows directly: pool neighbouring frequencies. Averaging \(k\) adjacent values gives roughly \(2k\) degrees of freedom instead of 2, and the estimate steadies.

You buy that precision with resolution. Pooling neighbours means you can no longer tell them apart, so peaks get wider and two close cycles can blur into one. This is the central trade of spectral estimation, and there is no way around it: **variance down, resolution down, together.** Your job is to pick where on that line to sit.

In R the knob is `spans`, which sets the width of a modified Daniell smoother (a moving average across frequencies, with half-weight at its two end points). Passing two values applies the smoother twice, which is standard practice because it gives a gentler shape than one wide pass.

```r title="Smoothing: trade resolution for a steadier estimate"
sm <- spec.pgram(bakery, spans = c(5, 5), taper = 0, detrend = FALSE,
                 fast = FALSE, plot = FALSE)

sm$df           # degrees of freedom: was 2
#> [1] 12.68111

sm$bandwidth    # frequency width: was 0.0003965318
#> [1] 0.002412009

# The 95% interval, now as a multiple of the estimate
round(sm$df / qchisq(c(0.975, 0.025), sm$df), 4)
#> [1] 0.5220 2.6341

round(1 / sm$freq[which.max(sm$spec)], 2)   # is the weekly peak still there?
#> [1] 7
```

That is the trade, priced exactly. Degrees of freedom rose from 2 to **12.7**, and the 95% interval shrank from `[0.27x, 39.5x]` to `[0.52x, 2.63x]`. A factor of 145 became a factor of 5. In exchange, the bandwidth grew about six-fold, from 0.0004 to 0.0024, so each estimate now speaks for a wider slice of frequency and genuinely close cycles would merge. The weekly peak survives at exactly 7 days, because a spike that dominant is not going anywhere.

```r title="Raw against smoothed, same data"
par(mfrow = c(1, 2), mar = c(4, 4, 3, 1))

plot(pg$freq, pg$spec, type = "h", log = "y", col = "grey60",
     main = "Raw (df = 2)", xlab = "frequency", ylab = "power")

plot(sm$freq, sm$spec, type = "l", log = "y", col = "steelblue", lwd = 1.5,
     main = "Smoothed, spans = c(5, 5)", xlab = "frequency", ylab = "power")

par(mfrow = c(1, 1))
```

Side by side the difference is obvious. The raw panel is a dense grey thicket of spikes with two towers in it. The smoothed panel is a readable curve: a broad hump at the low-frequency end for the yearly cycle, a clean peak at 1/7, and an otherwise flat noise floor. The flat floor is the real prize, because now a bump that rises above it means something.

**Try it:** Run the smoothing again with `spans = c(3, 3)` and with `spans = c(15, 15)`, and compare `sm$df` and `sm$bandwidth` each time. You are watching the trade move in one direction and then the other.

<details><summary>Click to reveal what you should see</summary>

`spans = c(3, 3)` gives fewer degrees of freedom than `c(5, 5)` and a narrower bandwidth: less smoothing, a jumpier curve, sharper peaks. `spans = c(15, 15)` gives many more degrees of freedom and a much wider bandwidth: a very smooth curve, but the weekly peak is now a broad hill rather than a spike, and the yearly peak has been smeared into the low-frequency corner. Both are correct spectra. They answer the same question at different resolutions, which is why `spans` is a choice you make rather than a value you look up.

</details>

## What do detrend, taper, and fast actually do?

Time to turn back on the three conveniences we disabled in the very first block. Each defends against a specific failure, and you now know enough for each to make sense.

**`detrend = TRUE` (the R default)** fits a straight line through the series and subtracts it before transforming. Why it matters: a trend is a piece of a cycle so long that the data never sees it repeat. The transform has no category for "goes up forever", so it does the best it can by dumping enormous power into the lowest frequencies, which then leaks sideways and can bury real peaks. The bakery has no trend, which is why leaving it off changed nothing. Real data usually does. The next section shows exactly how bad this gets.

**`taper = 0.1` (the R default)** gently fades the first and last 10% of the series towards its mean before transforming. Why it matters: the DFT implicitly assumes your series wraps around, with the last day sitting next to the first. If the two ends do not match, that artificial jump is a sharp discontinuity, and a sharp edge is broadband: it sprays power across every frequency. This is the **leakage** mentioned earlier. Fading the ends removes the jump. The cost is that you have slightly softened your data, so the effective sample is a touch smaller.

**`fast = TRUE` (the R default)** pads the series with zeros up to a length that factorises into small primes, because the FFT algorithm runs much faster on such lengths. Why it matters: padding changes \(n\), which changes the frequency grid \(j/n\), which moves where your peaks land.

```r title="What padding does to the answer"
nextn(728)   # the length spec.pgram pads 728 up to
#> [1] 729

# The default call, with padding switched back on
pgt <- spec.pgram(bakery, taper = 0, detrend = FALSE, plot = FALSE)
round(1 / pgt$freq[which.max(pgt$spec)], 3)
#> [1] 7.01
```

There it is. With padding on, the weekly peak reads **7.01 days** instead of 7. Nothing is broken, and nothing is being hidden: 728 is not a nice FFT length, so R pads it to 729, the grid becomes \(j/729\) instead of \(j/728\), and the exact weekly frequency no longer has a grid point sitting precisely on it. The nearest one is at 7.01.

This is why the first block used `fast = FALSE`: it kept the arithmetic honest so the peak could read exactly 7. In everyday work leave `fast = TRUE` on and remember that a periodogram peak is always "the nearest grid point to the truth", never the truth itself. If a peak position matters to you, read it as \(7.01 \pm\) half a grid step rather than as a precise measurement.

> **Note:** A useful habit for real work is `spec.pgram(x, spans = c(5, 5))` and nothing else: that keeps the sensible defaults for `detrend`, `taper`, and `fast`, and adds the smoothing that the defaults do not give you. The explicit `taper = 0, detrend = FALSE, fast = FALSE` in this post is a teaching setting, not a recommendation. And if you have met `spectrum(x)` in a textbook, that is this same calculation wearing a different name: `spectrum()` is a thin wrapper that calls `spec.pgram()` and returns identical numbers. Its one extra trick is `method = "ar"`, which fits an autoregressive model and draws that model's smooth spectrum instead of estimating each frequency separately.

## Does this work on real data?

The bakery was built to be found. Real data is the actual test, so use `AirPassengers`, the monthly total of international airline passengers from 1949 to 1960 that ships with R. It has a strong upward trend and an obvious yearly holiday cycle, and it is the same series used in [Test Stationarity in R](Test-Stationarity-in-R.html), so you may already know its shape.

First, a unit trap that catches everyone exactly once.

```r title="A ts object carries its own frequency, and spec.pgram uses it"
frequency(AirPassengers)   # 12 observations per year
#> [1] 12

# Detrending OFF, to see what the trend does to the answer
ap_no <- spec.pgram(AirPassengers, taper = 0, detrend = FALSE,
                    fast = FALSE, plot = FALSE)

i <- which.max(ap_no$spec)
round(ap_no$freq[i], 4)      # cycles per YEAR, not per month
#> [1] 0.0833
round(12 / ap_no$freq[i], 1) # months per cycle
#> [1] 144
```

Two lessons in six lines. The first is units: because `AirPassengers` is a `ts` with `frequency = 12`, `spec.pgram()` reports frequency in **cycles per year**, not per month. So `1/f` gives years, and you multiply by 12 for months. The bakery was `frequency = 1`, so its frequencies were per day and `1/f` was already days. Whenever a spectral answer looks off by a factor of 12 or 365, this is why. Check `frequency()` first.

The second lesson is the serious one. With detrending off, the dominant "cycle" is **144 months**, which is 12 years, which is the entire length of the series. That is not a cycle. Nobody has ever observed it repeat. It is the upward trend, which the transform can only express as a very long wave, and it has taken over the spectrum. This is the failure `detrend = TRUE` exists to prevent.

Turn the defaults back on and ask again.

```r title="AirPassengers with the defaults doing their job"
ap <- spec.pgram(AirPassengers, taper = 0.1, detrend = TRUE,
                 fast = FALSE, plot = FALSE)

t3 <- order(ap$spec, decreasing = TRUE)[1:3]
data.frame(cycles_per_year = round(ap$freq[t3], 3),
           period_months   = round(12 / ap$freq[t3], 2),
           power           = round(ap$spec[t3], 1))
#>   cycles_per_year period_months  power
#> 1           1.000         12.00 5666.8
#> 2           2.000          6.00 1550.7
#> 3           0.917         13.09  829.9
```

Now it is right, and it is interesting. The top peak is at exactly 1 cycle per year: a **12-month** cycle, the holiday season, which is what anyone who has looked at this series would expect. The bogus 144-month peak is gone, removed by subtracting the trend line.

The second peak, at **6 months**, is worth a paragraph because beginners routinely misread it. It is not a separate half-yearly business cycle. It is a **harmonic**. The DFT builds everything out of pure sine waves, but the real yearly pattern is not a pure sine: it has a sharp summer spike and a flatter winter, and reproducing that lopsided shape requires the 12-month wave plus a smaller 6-month wave to sharpen the peak. Any non-sinusoidal repeating pattern produces harmonics at 1/2, 1/3, and so on of its period. Seeing a peak at exactly half your main period is evidence about the **shape** of the yearly cycle, not evidence of a second cycle. The third peak, at 13.09 months, is just leakage from the dominant 12-month spike into its neighbour.

```r title="See it: the AirPassengers spectrum"
ap_sm <- spec.pgram(AirPassengers, spans = c(3, 3), plot = FALSE)

plot(ap_sm$freq, ap_sm$spec, type = "l", log = "y", col = "steelblue", lwd = 1.5,
     main = "AirPassengers spectrum: yearly cycle and its harmonics",
     xlab = "frequency (cycles per year)", ylab = "power (log scale)")
abline(v = 1:3, col = "tomato", lty = 2)
text(1, max(ap_sm$spec), "12 months", pos = 4, col = "tomato")
```

The plot shows a tall peak at 1 cycle per year with the red guide line through it, a clearly smaller but unmistakable peak at 2 cycles per year (the 6-month harmonic), and a hint of a third at 3 cycles per year (a 4-month harmonic, sharpening the shape further). The descending ladder of harmonics is the fingerprint of a repeating pattern that is not a simple sine wave. Note this call uses R's defaults for everything except `spans`, which is the recommended everyday setting from the previous section.

## How do you filter a cycle out?

Finding a cycle is half the job. Often you want to **remove** one: strip the weekly rhythm out of the bakery's sales so you can look at whether the underlying business is growing, without weekends shouting over the answer.

The classic tool is a **moving average filter**. To kill a 7-day cycle, average each day with the 3 days before and the 3 days after. Every full week contributes each weekday exactly once to every average, so the weekly wave cancels itself out while slower movements survive nearly untouched. This is the same machinery covered in [Moving Averages in R](Moving-Averages-in-R.html) and used inside [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html); here we get to verify it in the frequency domain, which is where the proof is cleanest.

```r title="Filter out the weekly cycle, then check the spectrum"
# A centred 7-day moving average: each day averaged with 3 before and 3 after
ma7      <- stats::filter(bakery, rep(1/7, 7), sides = 2)
smoothed <- ts(na.omit(as.numeric(ma7)))   # drop the 3 NAs at each end

length(smoothed)
#> [1] 722

pgf <- spec.pgram(smoothed, taper = 0, detrend = FALSE, fast = FALSE, plot = FALSE)

# Power at the weekly frequency, before and after
round(max(pg$spec[abs(pg$freq   - 1/7) < 0.002]))        # before
#> [1] 285231
round(max(pgf$spec[abs(pgf$freq - 1/7) < 0.002]), 3)     # after
#> [1] 0.054

round(1 / pgf$freq[which.max(pgf$spec)], 1)   # what dominates now?
#> [1] 361
```

The weekly cycle is gone, and "gone" is not an overstatement. Power at the weekly frequency fell from **285,231 to 0.054**, a reduction of about five million times. The dominant cycle in the filtered series is now **361 days**: the yearly rhythm, which was always there in second place and has simply inherited the top spot. (It reads 361 rather than 364 because the filter shortened the series to 722 days, which moves the frequency grid, exactly as padding did in the earlier section.)

The mechanics, line by line. `stats::filter()` applies a linear filter to a series; `rep(1/7, 7)` is the vector of weights `1/7, 1/7, ...` seven times, which is what makes it an average rather than a sum; `sides = 2` centres the window on each point instead of using only the past. We write `stats::filter` explicitly because `dplyr` also defines a `filter()` and the wrong one produces a baffling error. The filter cannot compute an average for the first and last 3 days (there is no data beyond the ends), so it returns `NA` there, and `na.omit()` drops them: 728 - 6 = 722.

Why does a 7-day average annihilate a 7-day cycle so completely? Because a full cycle of a sine wave sums to zero. Averaging over exactly one period adds up every phase of the wave, the positive half cancels the negative half, and what is left is whatever the series was doing more slowly. The cancellation is this clean because two things line up exactly: our weekly wave sits at exactly 1/7, and the averaging window is exactly 7 days wide. The leftover 0.054 is not the wave hanging on. It is floating-point rounding plus the sliver of random noise that happened to land at that frequency.

That exactness is also the catch. The window kills the cycle whose period it matches; it only dents a cycle it does not match. A 7-day average on a true 7.3-day rhythm would shrink it, not remove it, so match the window to the period you are aiming at.

> **Watch out:** A moving average is a low-pass filter: it removes the weekly cycle **and** everything faster than it, not just the 7-day component. That is fine when you want a trend, and wrong when you wanted to remove only the weekly rhythm while keeping shorter movements. Check the whole spectrum after filtering, not just the frequency you aimed at.

**Try it:** Filter the bakery series with a 30-day moving average instead (`rep(1/30, 30)`), then find the dominant cycle in the result. What happened to the weekly peak, and what is left?

<details><summary>Click to reveal what you should see</summary>

A 30-day average is a much heavier low-pass filter. The weekly peak is gone (30 days spans more than four full weekly cycles, so they cancel), and so is essentially everything else fast. What survives is the yearly cycle, which now dominates completely, and the series looks like a slow summer swell with the daily texture wiped away. This is the trade-off in the callout above made concrete: you asked to remove one cycle and removed every fast movement in the data.

</details>

## FAQ

**Is a periodogram the same thing as a power spectrum?**
Nearly, and the distinction matters. The **power spectrum** (or spectral density) is the true, unknown quantity: how the variance of the process is distributed across frequencies. The **periodogram** is one estimate of it, computed from your finite sample. As we saw, it is an unbiased but very noisy estimate with only 2 degrees of freedom, which is why a smoothed periodogram is a better estimate of the spectrum than the raw one, even though the raw one is the more direct calculation.

**Why does my peak not land on a round number?**
Three reasons, all covered above. The frequency grid is discrete, so a peak can only ever land on \(j/n\); `fast = TRUE` pads the series and shifts that grid; and any filtering or trimming changes \(n\) too. A peak at 7.01 or 361 is the grid's nearest available answer, not a measurement to four significant figures. Read peaks as approximate unless your series length is an exact multiple of the cycle you care about.

**How do I know whether a peak is statistically real?**
Start with the degrees of freedom. Ask R for `pg$df`, turn it into an interval with `df / qchisq(c(0.975, 0.025), df)`, and see whether the peak clears the surrounding noise floor by more than that interval. Raw periodograms (2 df, a 39x upper interval) essentially cannot establish a modest peak, so smooth first. R will also draw the interval for you: call `spec.pgram()` with `plot = TRUE` and it puts a small blue crosshair in the top right corner whose vertical bar is the 95% interval on the log scale. If a peak is not taller than that bar, it is not evidence.

**When should I use spectral analysis instead of the ACF?**
They are the same information in different coordinates (the spectrum is the Fourier transform of the autocovariance), so it is a question of what is easier to read. Reach for the periodogram when you suspect **periodic** structure and want to know its length: cycles show as isolated peaks, and multiple overlapping cycles separate cleanly, which they never do in a correlogram. Reach for [ACF and PACF](ACF-and-PACF-in-R.html) when you are identifying an ARIMA model, where the decay pattern at short lags is the thing you need. Many workflows use both.

**Does my series need to be stationary first?**
Yes, in the sense that matters: a trend will hijack the low frequencies and can swamp everything real, as `AirPassengers` demonstrated with its bogus 144-month peak. But you do not usually need to difference the series. `detrend = TRUE` removes a linear trend, which handles most cases, and it is on by default. For a strong curved trend, difference the series or subtract a fitted curve first, then run the periodogram on the residuals. Seasonality itself is not a problem to remove here: it is the thing you are trying to measure.

**Why is my spectrum symmetric, and what happened to the second half?**
`fft()` on a real-valued series returns \(n\) complex numbers whose second half is the mirror image of the first, carrying no extra information. That is why we kept only elements 2 through \(n/2 + 1\), and why `spec.pgram()` returns 364 frequencies for 728 observations. It is also another way to see the Nyquist limit: half your observations buy you frequencies, and that is all there is.

## Summary

Spectral analysis re-expresses a time series as power against frequency. Nothing is added or lost; a pattern your eye cannot pull out of 728 wobbling days becomes the tallest spike on a chart.

| Idea | What to remember | In R |
|---|---|---|
| Period and frequency | Reciprocals. Humans think in periods, the maths works in frequency | `1 / pg$freq[i]` |
| Fourier grid | Only \(j/n\) is estimable; resolution is \(1/n\) | `pg$freq` |
| Nyquist frequency | Max 0.5 cycles per observation: you need 2 points per cycle | `max(pg$freq)` |
| The periodogram | Size of the DFT, squared, over `n` | `Mod(fft(x))^2 / n` |
| It is inconsistent | 2 df always; a 95% interval of `[0.27x, 39.5x]` that more data will not fix | `pg$df` |
| Smoothing | Pool neighbours: df up, resolution down. Always a trade | `spans = c(5, 5)` |
| `detrend = TRUE` | A trend becomes a fake giant low-frequency peak. Leave it on | default |
| `taper = 0.1` | Fades the ends so the wrap-around jump does not leak power | default |
| `fast = TRUE` | Pads `n`, shifting the grid. Peaks read 7.01, not 7 | default |
| `ts` frequency | Sets the units of `pg$freq`. Check it before reading any answer | `frequency(x)` |
| Harmonics | A peak at half your main period means a non-sinusoidal shape, not a second cycle | - |
| Filtering | A `k`-length moving average kills the `k`-period cycle and everything faster | `stats::filter()` |

For everyday work, the honest default is `spec.pgram(x, spans = c(5, 5))`: keep R's sensible `detrend`, `taper`, and `fast` settings, and add the smoothing the defaults leave out. Then read peaks as approximate, check `frequency()` before converting to periods, and treat any bump that does not clear the confidence bar as noise.

We opened with a bakery whose weekly and yearly rhythms we planted ourselves. The periodogram found both, to the day, without being told they existed, and a 7-day moving average removed the weekly one so completely that its power fell by a factor of five million. That is the loop worth carrying away: **build a series you understand, confirm the method recovers what you put in, then point it at data you do not understand.**

## References

1. R Core Team. **`spec.pgram()` reference manual.** [stat.ethz.ch/R-manual/R-devel/library/stats/html/spec.pgram.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/spec.pgram.html). The authoritative definition of every argument used here, including the exact `taper`, `detrend`, and `spans` behaviour.
2. R Core Team. **`fft()` reference manual.** [stat.ethz.ch/R-manual/R-devel/library/stats/html/fft.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/fft.html). Confirms the ordering and mirroring of the transform's output, which is why we kept elements 2 to n/2 + 1.
3. R Core Team. **`filter()` reference manual.** [stat.ethz.ch/R-manual/R-devel/library/stats/html/filter.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/filter.html). The `sides` and `NA` padding behaviour behind the moving-average filter in the last section.
4. Shumway, R. H. & Stoffer, D. S. **Time Series Analysis and Its Applications, code and data.** [github.com/nickpoison/tsa4](https://github.com/nickpoison/tsa4). Chapter 4 is the standard graduate treatment of spectral analysis, with the R code that goes with it.
5. NIST/SEMATECH. **e-Handbook of Statistical Methods: Spectral Plot.** [itl.nist.gov/div898/handbook/eda/section3/eda35g.htm](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35g.htm). A short, practical account of reading a spectral plot for cycle detection.
6. Bartlett, P. **Spectral analysis lecture notes, UC Berkeley Stat 153.** [stat.berkeley.edu/~bartlett/courses/153-fall2010/lectures/14.pdf](https://www.stat.berkeley.edu/~bartlett/courses/153-fall2010/lectures/14.pdf). Derives the chi-squared 2-df result and the smoothing trade-off that this post demonstrates empirically.
7. Wikipedia. **Spectral density estimation.** [en.wikipedia.org/wiki/Spectral_density_estimation](https://en.wikipedia.org/wiki/Spectral_density_estimation). A good map of where the periodogram sits among the other estimators (Welch, multitaper, parametric).

## Continue Learning

- [Test Stationarity in R](Test-Stationarity-in-R.html), the parent of this post. A trend wrecks a periodogram before you start, and that page shows how to detect and remove one properly.
- [Time Series Objects in R](Time-Series-Objects-in-R.html), where the `ts` `frequency` attribute comes from. It silently sets the units of every frequency in this post.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), the time-domain counterpart. Decomposition splits a series into trend, season, and remainder; the periodogram measures the same seasonality in frequency instead.
- [ACF and PACF in R](ACF-and-PACF-in-R.html), the same information in the other coordinate system, and the tool to reach for when identifying an ARIMA model.
