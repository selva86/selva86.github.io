---
title: "Spectral Analysis in R: Periodogram and Power Spectrum"
slug: "Spectral-Analysis-in-R"
description: "Learn spectral analysis in R: read a periodogram, find the dominant cycle with fft() and spec.pgram(), smooth the power spectrum, and remove a seasonal cycle."
keywords: "spectral analysis R, periodogram R, power spectrum R, spec.pgram, fft in R, frequency domain, dominant cycle, Fourier analysis R, spectral density"
auto_link_terms: "spectral analysis|spectral analysis in R|periodogram|periodograms|power spectrum|spectral density|frequency domain|Fourier frequency|Fourier frequencies|Nyquist frequency|spec.pgram|discrete Fourier transform|dominant cycle"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "FR-foun-3"
post_type: "FR"
fr_parent: "Test-Stationarity-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Spectral analysis rewrites a time series as a mix of repeating waves and measures how strong each one is. The periodogram is the chart that shows which cycle dominates, so you can spot a hidden 12-month season or an 11-year sunspot rhythm at a glance. Every example here is base R and runs right in your browser.</p>

## What does spectral analysis tell you about a time series?

A line chart shows a series wiggling up and down, but it rarely tells you how long one full up-and-down cycle takes, or whether two cycles are stacked on top of each other. Spectral analysis answers exactly that. Let us plant a cycle whose length we already know, bury it in random noise, and watch a single function recover it.

We will build 144 points made of one clean wave that repeats every 12 steps, plus a generous helping of noise. Then we hand the whole thing to `spectrum()` and ask it a simple question: which cycle length carries the most energy? The answer should come back as 12, even though the noise makes the raw series look messy.

```r title="Plant a cycle and recover it"
set.seed(101)
n <- 144
tt <- 1:n
y <- 3 * sin(2 * pi * tt / 12) + rnorm(n, sd = 2)
sp <- spectrum(y, plot = FALSE)
dominant_period <- 1 / sp$freq[which.max(sp$spec)]
dominant_period
#> [1] 12
```

Here is what each line did. We seeded the random generator so you get the same numbers, built a sine wave that completes one cycle every 12 steps, and added `rnorm()` noise so the pattern is not obvious to the eye. `spectrum()` computed how much power sits at each frequency and stored the result in `sp`, with the tested frequencies in `sp$freq` and their power in `sp$spec`. `which.max(sp$spec)` found the position of the strongest peak, and dividing 1 by the frequency at that position converted it into a period. The result is 12, the exact cycle we planted.

That is the whole promise of spectral analysis. You give it a noisy series, and it hands back the length of the strongest repeating cycle. The rest of this tutorial unpacks how that number is computed, how to read the full picture instead of just the top peak, and how to trust the result on real data.

[KEY INSIGHT]
**Any wiggly series can be rebuilt from simple sine and cosine waves added together.** Spectral analysis is the recipe card: it lists which wave lengths are in the mix and how much of each you need, so a strong cycle shows up as a tall peak no matter how much noise sits on top.

**Try it:** Change the planted cycle so it repeats every 24 steps instead of 12, then recover it the same way. You should get a period near 24.

```r title="Your turn: recover a period-24 cycle"
set.seed(7)
ex_y <- 3 * sin(2 * pi * (1:144) / 24) + rnorm(144, sd = 2)
# your code: run spectrum(ex_y, plot = FALSE),
# find the tallest peak, and convert its frequency to a period
```

<details>
<summary>Click to reveal solution</summary>

```r title="Period-24 cycle solution"
set.seed(7)
ex_y <- 3 * sin(2 * pi * (1:144) / 24) + rnorm(144, sd = 2)
ex_sp <- spectrum(ex_y, plot = FALSE)
1 / ex_sp$freq[which.max(ex_sp$spec)]
#> [1] 24
```

**Explanation:** The wave now completes one cycle every 24 steps, so the tallest peak sits at frequency 1/24, and inverting it returns 24.

</details>

## What are frequency, period, and cycles in a time series?

Before we read a single chart, we need to pin down three words that spectral analysis leans on constantly. A cycle is one full repeat of a pattern, like winter-to-winter in monthly temperatures. The period is how many time steps that one repeat takes. The frequency is how many repeats happen per single time step.

Period and frequency are two views of the same thing, and they are simple reciprocals of each other.

$$T = \frac{1}{f}$$

Where:
- $T$ is the period, measured in time steps per cycle
- $f$ is the frequency, measured in cycles per time step

A slow cycle has a long period and a low frequency. A fast cycle has a short period and a high frequency. The table below makes the trade-off concrete for three frequencies.

```r title="Frequency and period side by side"
freqs <- c(0.05, 0.1, 0.25)
data.frame(freq_cycles_per_step = freqs, period_steps_per_cycle = 1 / freqs)
#>   freq_cycles_per_step period_steps_per_cycle
#> 1                 0.05                     20
#> 2                 0.10                     10
#> 3                 0.25                      4
```

Read the first row like this: a frequency of 0.05 means the wave gets through 0.05 of a cycle each step, so it needs 20 steps to finish one full cycle. A frequency of 0.25 is four times faster, so it wraps up a cycle in just 4 steps. The periodogram always reports frequency on its x-axis, so you will convert to a period constantly, and it is always the same one-over-frequency move.

[NOTE]
**A period is only meaningful in the units of your time steps.** If your data is monthly, a period of 12 means 12 months, which is one year. If it is daily, a period of 7 means one week. Always translate the number back into calendar language before you report it.

**Try it:** A wave completes 0.1 of a cycle every step. How many steps does one full cycle take?

```r title="Your turn: convert a frequency"
ex_freq <- 0.1
# your code: turn this frequency into a period (steps per cycle)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Frequency to period solution"
ex_freq <- 0.1
1 / ex_freq
#> [1] 10
```

**Explanation:** Period equals one divided by frequency, so 1 / 0.1 gives 10 steps per cycle.

</details>

## How do you read a periodogram in R?

The periodogram is the core chart of spectral analysis. Its x-axis is frequency and its y-axis is power, which you can think of as how much of the series' wiggle each frequency is responsible for. A tall spike means a strong, dominant cycle at that frequency. A flat, low region means nothing much is happening there.

When you call `spectrum(y)`, R draws this chart for you. It also stores the raw numbers in the returned object: `sp$freq` holds every frequency it tested, and `sp$spec` holds the power at each one. Instead of squinting at the plot, we can sort those numbers and print the five strongest frequencies as a table.

```r title="Read the top five peaks"
sp <- spectrum(y, plot = FALSE)
top <- order(sp$spec, decreasing = TRUE)[1:5]
data.frame(
  frequency = round(sp$freq[top], 4),
  period    = round(1 / sp$freq[top], 1),
  power     = round(sp$spec[top], 2)
)
#>   frequency period  power
#> 1    0.0833   12.0 237.74
#> 2    0.1250    8.0  16.18
#> 3    0.0972   10.3  14.20
#> 4    0.4583    2.2  14.02
#> 5    0.5000    2.0  11.95
```

Look at the power column. The top row has a power of 237.74 at a period of 12, and every other row sits below 17. That gap is the story: one cycle towers over everything else. The runner-up frequencies are not real cycles at all, they are just the noise leaving faint ripples across the chart. This is exactly how you separate signal from noise in a periodogram: hunt for the peak that stands far above its neighbours.

[NOTE]
**The plotted periodogram uses a logarithmic y-axis by default.** That compresses a huge dynamic range so both tall and short peaks are visible on one chart, but it can make a dominant peak look less extreme than it is. When you want the plain ratio of one peak to another, compare the raw `sp$spec` values as we did in the table.

**Try it:** R ships with a series called `lh` (a set of luteinizing hormone readings). Find the period of its strongest cycle.

```r title="Your turn: find the lh cycle"
ex_lh_sp <- spectrum(lh, plot = FALSE)
# your code: find the period of the tallest peak in ex_lh_sp
```

<details>
<summary>Click to reveal solution</summary>

```r title="lh dominant cycle solution"
ex_lh_sp <- spectrum(lh, plot = FALSE)
1 / ex_lh_sp$freq[which.max(ex_lh_sp$spec)]
#> [1] 8
```

**Explanation:** The tallest peak sits at frequency 1/8, so the strongest cycle in `lh` repeats about every 8 samples.

</details>

## How does the periodogram work under the hood (the FFT)?

So far `spectrum()` has been a black box. Let us open it, because the machinery is simpler than it sounds and understanding it will help you trust the output. The engine is the Fast Fourier Transform, available in base R as `fft()`. It takes your series and reports, for every frequency, how strongly a wave at that frequency matches your data.

The periodogram is then just the squared size of that match, scaled by the length of the series. We will do it by hand: subtract the mean so the flat "zero-frequency" part does not dominate, run `fft()`, square the magnitude with `Mod()`, divide by `n`, and keep only the first half of the frequencies (we will see why the second half is redundant in the next section).

```r title="Build the periodogram with fft"
yc <- y - mean(y)
dft <- fft(yc)
n <- length(y)
pgram <- (Mod(dft)^2) / n
freq <- (0:(n - 1)) / n
half <- 2:floor(n / 2)
peak_period <- 1 / freq[half][which.max(pgram[half])]
peak_period
#> [1] 12
```

Walk through it slowly. `yc` is the series with its average removed. `fft(yc)` returns a complex number per frequency, and `Mod()` gives the length of each of those complex numbers, which is the strength of the match. Squaring and dividing by `n` turns that into power, `freq` lists the frequencies that go with each entry, and `half` keeps the meaningful lower half. The strongest of those lands at frequency 1/12, so `peak_period` is 12, the same answer `spectrum()` gave us. The black box was never mysterious: it is just a Fourier transform, then a square and a scale.

Here is the same idea written as a formula. If you would rather not read math, skip to the next section, because the code above already told the whole story.

$$I(f_j) = \frac{1}{n}\left| \sum_{t=1}^{n} x_t \, e^{-2\pi i f_j t} \right|^2$$

Where:
- $I(f_j)$ is the periodogram value (the power) at frequency $f_j$
- $x_t$ is the series value at time $t$
- $n$ is the number of observations
- the sum inside the bars is the discrete Fourier transform, which `fft()` computes for every frequency at once

The diagram below traces that pipeline from raw series to cycle length.

![How the FFT turns a time series into a periodogram and a cycle length](screenshots/Spectral-Analysis-in-R-frequency-domain-flow.webp)

*Figure 1: How the FFT turns a time series into a periodogram and a cycle length.*

[KEY INSIGHT]
**The periodogram splits your series' total variance across frequencies.** Add up the whole periodogram and you get back the variance of the series. A tall peak therefore means that one cycle explains a large share of everything the series does, which is why the peak height is a direct measure of a cycle's importance.

**Try it:** Build a periodogram by hand for a clean cosine wave that repeats every 6 steps, and confirm the peak lands at period 6.

```r title="Your turn: hand-build a periodogram"
ex_vec <- cos(2 * pi * (1:60) / 6)
# your code: demean, run fft, square with Mod and scale by 60,
# keep the first half, and find the peak period
```

<details>
<summary>Click to reveal solution</summary>

```r title="Hand-built periodogram solution"
ex_vec <- cos(2 * pi * (1:60) / 6)
ex_p <- (Mod(fft(ex_vec - mean(ex_vec)))^2) / 60
ex_f <- (0:59) / 60
ex_half <- 2:30
1 / ex_f[ex_half][which.max(ex_p[ex_half])]
#> [1] 6
```

**Explanation:** The wave has a period of 6, so its power piles up at frequency 1/6, and inverting the peak frequency returns 6.

</details>

## Which cycles can you actually detect? Fourier frequencies and the Nyquist limit

A periodogram does not test every imaginable frequency. It tests a fixed grid called the Fourier frequencies, which are the fractions $j/n$ for $j$ running from 1 up to $n/2$. Two limits fall straight out of that grid, and knowing them keeps you from chasing cycles your data cannot possibly show.

$$f_j = \frac{j}{n}, \quad j = 1, 2, \ldots, \frac{n}{2}$$

The lowest frequency is $1/n$, which is one single cycle stretched across the entire record. You cannot detect anything slower, because a slower cycle would not even complete once in your data. The highest frequency is $1/2$, called the Nyquist frequency, which is the fastest cycle you can see: it takes two observations to define one up-and-down swing. The block below lists these limits for our 144-point series.

```r title="Fourier frequencies and the Nyquist limit"
n <- length(y)
fourier_freqs <- (1:(n / 2)) / n
data.frame(
  lowest_freq     = min(fourier_freqs),
  nyquist_freq    = max(fourier_freqs),
  n_freqs         = length(fourier_freqs),
  longest_period  = 1 / min(fourier_freqs),
  shortest_period = 1 / max(fourier_freqs)
)
#>   lowest_freq nyquist_freq n_freqs longest_period shortest_period
#> 1 0.006944444          0.5      72            144               2
```

The table spells out the boundaries. With 144 points you get 72 frequencies to inspect, the longest detectable cycle is 144 steps (the whole series is one cycle), and the shortest is 2 steps. Anything faster than the Nyquist limit is invisible, and worse, it appears in the spectrum as a slower cycle, an error called aliasing.

[WARNING]
**A cycle faster than two samples per repeat shows up in the spectrum as a slower one.** This is aliasing, the same effect that makes wagon wheels appear to spin backwards on film. If you suspect an important cycle is faster than your sampling can capture, you must collect data more frequently, because no amount of analysis can recover a cycle the Nyquist limit has already folded into a false low frequency.

**Try it:** Work out the lowest frequency and the Nyquist frequency for a series of 200 observations.

```r title="Your turn: frequencies for n = 200"
ex_n <- 200
# your code: build the Fourier frequencies for n = 200,
# then report the lowest and the Nyquist frequency
```

<details>
<summary>Click to reveal solution</summary>

```r title="Nyquist for n = 200 solution"
ex_n <- 200
ex_ff <- (1:(ex_n / 2)) / ex_n
c(lowest = min(ex_ff), nyquist = max(ex_ff))
#>  lowest nyquist 
#>   0.005   0.500 
```

**Explanation:** The lowest frequency is 1/200 = 0.005 (one cycle across all 200 points), and the Nyquist frequency is always 0.5, regardless of how long the series is.

</details>

## How do you find the dominant cycle in real data?

Planted signals are reassuring, but the real test is messy data with a cycle nobody wrote in. The classic example is `sunspot.year`, the yearly count of sunspots stretching back to 1700. Astronomers have long known the Sun runs on an eleven-year rhythm, and spectral analysis should rediscover it without being told. We will pull the top five peaks just as before.

```r title="Find the sunspot cycle"
sun_sp <- spectrum(sunspot.year, plot = FALSE)
sun_top <- order(sun_sp$spec, decreasing = TRUE)[1:5]
data.frame(
  freq_cycles_per_year = round(sun_sp$freq[sun_top], 4),
  period_years         = round(1 / sun_sp$freq[sun_top], 1),
  power                = round(sun_sp$spec[sun_top], 1)
)
#>   freq_cycles_per_year period_years   power
#> 1               0.0900         11.1 55821.0
#> 2               0.1000         10.0 40792.5
#> 3               0.0100        100.0 16027.5
#> 4               0.0833         12.0 11987.8
#> 5               0.0967         10.3  8170.2
```

The top row nails it: a period of 11.1 years with far more power than anything else, exactly the solar cycle physicists talk about. Notice the neighbours at 10.0 and 10.3 years, which are the same broad peak spread across adjacent frequencies, not separate cycles. The 100-year entry in row three is a slow drift in overall activity, real but weaker. Because `sunspot.year` is stored as an annual time series, R reports frequency in cycles per year, so the periods come out directly in years.

[TIP]
**Sort the spectrum and read the tallest peak, then translate it into your data's time unit.** The single line 1 / freq[which.max(spec)] gives the dominant period, but always convert it back into years, months, or days before you report it, and glance at the neighbouring peaks to confirm they are one broad hump rather than several rival cycles.

**Try it:** The `ldeaths` series records monthly lung-disease deaths in the UK. Find its dominant period. Because the series is monthly, the answer comes back in years.

```r title="Your turn: find the ldeaths cycle"
ex_ld_sp <- spectrum(ldeaths, plot = FALSE)
# your code: find the dominant period of ex_ld_sp
```

<details>
<summary>Click to reveal solution</summary>

```r title="ldeaths dominant cycle solution"
ex_ld_sp <- spectrum(ldeaths, plot = FALSE)
1 / ex_ld_sp$freq[which.max(ex_ld_sp$spec)]
#> [1] 1
```

**Explanation:** The dominant period is 1 year, which is 12 months, the winter-to-winter seasonal cycle you would expect in respiratory deaths.

</details>

## Why is the raw periodogram noisy, and how does smoothing build the power spectrum?

If you plot the raw periodogram of real data, it looks like a spiky mess even around a clear peak. That is not a display glitch, it is a genuine flaw: the raw periodogram is a noisy estimator, and its noise does not shrink as you collect more data. More points give you more frequencies, but each one stays just as jittery. The fix is to smooth neighbouring frequencies together, which trades a little precision on cycle length for a much steadier, more trustworthy estimate. That smoothed curve is what people usually mean by the power spectrum or spectral density.

In R, you smooth by passing the `spans` argument to `spec.pgram()`. It averages each frequency with its neighbours using a gentle weighting (the modified Daniell kernel). Below we compare the raw estimate against a smoothed one for the sunspot series, printing each one's peak period, bandwidth and degrees of freedom.

```r title="Smooth the periodogram"
raw    <- spec.pgram(sunspot.year, taper = 0, detrend = TRUE, plot = FALSE)
smooth <- spec.pgram(sunspot.year, spans = c(5, 5), taper = 0.1, plot = FALSE)
data.frame(
  which_spectrum = c("raw", "smoothed"),
  peak_period    = c(round(1 / raw$freq[which.max(raw$spec)], 2),
                     round(1 / smooth$freq[which.max(smooth$spec)], 2)),
  bandwidth      = c(round(raw$bandwidth, 4), round(smooth$bandwidth, 4)),
  df             = c(round(raw$df, 2), round(smooth$df, 2))
)
#>   which_spectrum peak_period bandwidth    df
#> 1            raw       11.11    0.0010  1.93
#> 2       smoothed       10.71    0.0059 10.94
```

Read the two rows against each other. Smoothing barely moved the peak, from 11.11 to 10.71 years, so the eleven-year cycle survives, which is the reassurance you want. The bandwidth grew from 0.001 to 0.006, meaning the estimate now blurs each frequency over a wider window, and the degrees of freedom jumped from about 2 to about 11, which is why the smoothed curve is so much steadier. The default `spectrum()` plot draws a small cross showing this bandwidth and a confidence interval, so you can judge whether a peak is tall enough to be believed.

[TIP]
**Use odd numbers in spans, and widen them for a smoother curve.** A value like spans = c(3, 3) smooths lightly, while spans = c(9, 9) smooths heavily; wider spans give a calmer spectrum but blur close cycles together, so start narrow and widen only until the noise settles without erasing the peak you care about.

**Try it:** Re-run the smoothed spectrum of `sunspot.year` with a narrower window, `spans = c(3, 3)`, and report both the peak period and the bandwidth.

```r title="Your turn: smooth with narrower spans"
ex_sm <- spec.pgram(sunspot.year, spans = c(3, 3), taper = 0.1, plot = FALSE)
# your code: report the peak period and the bandwidth of ex_sm
```

<details>
<summary>Click to reveal solution</summary>

```r title="Narrower spans solution"
ex_sm <- spec.pgram(sunspot.year, spans = c(3, 3), taper = 0.1, plot = FALSE)
c(peak_period = round(1 / ex_sm$freq[which.max(ex_sm$spec)], 2),
  bandwidth   = round(ex_sm$bandwidth, 4))
#> peak_period   bandwidth 
#>     11.1100      0.0035 
```

**Explanation:** The narrower window keeps the peak at 11.11 years and gives a smaller bandwidth (0.0035) than the wider c(5, 5) window, so it smooths less and stays closer to the raw estimate.

</details>

## How do trends and leakage distort the spectrum, and how do you fix them?

Real series often drift upward or downward over time, and that trend wrecks a naive periodogram. A steady climb looks, to the Fourier transform, like the first slow half of an enormous low-frequency cycle, so it puts most of the power at the lowest frequencies and buries every real cycle underneath. The famous `AirPassengers` series, monthly airline totals from 1949 to 1960, climbs steeply and shows the problem clearly. We compute its spectrum twice, once without removing the trend and once with `detrend = TRUE`.

```r title="Detrend before you read peaks"
ap_raw <- spec.pgram(AirPassengers, detrend = FALSE, taper = 0, plot = FALSE)
ap_det <- spec.pgram(AirPassengers, detrend = TRUE,  taper = 0.1, plot = FALSE)
c(raw_peak_years      = round(1 / ap_raw$freq[which.max(ap_raw$spec)], 2),
  detrend_peak_years  = round(1 / ap_det$freq[which.max(ap_det$spec)], 2),
  detrend_peak_months = round(12 / ap_det$freq[which.max(ap_det$spec)], 2))
#>      raw_peak_years  detrend_peak_years detrend_peak_months 
#>                  12                   1                  12 
```

The contrast is stark. Without detrending, the tallest peak sits at a 12-year period, which is simply the full length of the record: the trend dominates the spectrum and shows up as one giant cycle. After detrending, the peak snaps to a 1-year period, which is 12 months, the genuine annual travel season everyone expects. This is why `spectrum()` and `spec.pgram()` detrend by default, and it is the single most common mistake beginners make when they turn that default off.

The `taper` argument fixes a subtler problem called leakage. Because your record is finite, it usually chops a cycle off partway through, and that abrupt edge smears a strong peak's energy into nearby frequencies. Tapering gently fades the two ends of the series toward its mean before the transform, which softens the edges and sharpens the peak. The default of `taper = 0.1` fades the first and last ten percent, which is a sensible starting point.

[WARNING]
**Always detrend or demean before reading a periodogram.** A trend appears as the biggest low-frequency cycle in the chart and hides every real signal beneath it, so leaving detrending off (as we did above only to expose the failure) is almost never what you want on trending data.

**Try it:** Confirm the trap for yourself. Run `spec.pgram()` on `AirPassengers` with `detrend = FALSE` and see what period the tallest peak reports.

```r title="Your turn: skip detrending"
ex_ap <- spec.pgram(AirPassengers, detrend = FALSE, taper = 0, plot = FALSE)
# your code: find the period of the tallest peak in ex_ap
```

<details>
<summary>Click to reveal solution</summary>

```r title="No-detrend artifact solution"
ex_ap <- spec.pgram(AirPassengers, detrend = FALSE, taper = 0, plot = FALSE)
1 / ex_ap$freq[which.max(ex_ap$spec)]
#> [1] 12
```

**Explanation:** With no detrending the peak lands at 12 years, the whole span of the data, because the upward trend dominates the spectrum. It is an artifact, not a real cycle.

</details>

## Complete Example

Let us put every step together on a fresh series and finish with something practical: finding a cycle, then filtering it out. The `nottem` dataset holds monthly average temperatures at Nottingham Castle from 1920 to 1939. It has an obvious yearly rhythm, so it is the perfect series to find a cycle in and then remove.

First we locate the dominant cycle exactly as before. Because `nottem` is monthly, we convert the period into months by multiplying by 12.

```r title="Find the annual cycle in nottem"
nt_sp <- spectrum(nottem, plot = FALSE)
nt_period_years  <- 1 / nt_sp$freq[which.max(nt_sp$spec)]
nt_period_months <- nt_period_years * frequency(nottem)
c(period_years = round(nt_period_years, 3),
  period_months = round(nt_period_months, 2))
#>  period_years period_months 
#>             1            12 
```

The dominant cycle is one year, or 12 months, the summer-to-summer temperature swing. Now for the useful part. Once you know a cycle's length, you can subtract it out and study whatever is left. We fit a sine and a cosine at the annual frequency with `lm()`, a technique called harmonic regression, and keep the residuals. Removing the annual wave should slash the variance and shift the dominant peak of what remains.

```r title="Remove the annual cycle"
yrs <- as.numeric(time(nottem))
fit <- lm(nottem ~ sin(2 * pi * yrs) + cos(2 * pi * yrs))
resid_series <- residuals(fit)
res_sp <- spectrum(resid_series, plot = FALSE)
res_peak_months <- (1 / res_sp$freq[which.max(res_sp$spec)]) * frequency(nottem)
c(before_months = round(nt_period_months, 2),
  after_months  = round(res_peak_months, 2),
  var_before    = round(var(nottem), 2),
  var_after     = round(var(resid_series), 2))
#> before_months  after_months    var_before     var_after 
#>         12.00         72.00         73.48          6.42 
```

The numbers tell a clean story. Before filtering, the series had a variance of 73.48 dominated by a 12-month cycle. After subtracting the annual wave, the variance collapsed to 6.42, meaning the yearly season alone accounted for about 91 percent of all the movement. The dominant cycle of the leftovers jumped from 12 months to 72 months, a slow six-year drift that was completely hidden under the seasonal swing. That is spectral analysis earning its keep: it found the cycle, and using its frequency we filtered it away to reveal a second, subtler pattern underneath.

## Practice Exercises

These combine several ideas from the tutorial. Try each one before opening the solution. The variables use a `my_` prefix so they will not clash with anything above.

### Exercise 1: Recover two hidden cycles at once

Build a 240-point series that hides two cycles, one with a period of 8 and one with a period of 20, plus light noise. Then recover both by reading the top two periodogram peaks. Expected output: the two periods 8 and 20.

```r title="Two hidden cycles"
# Build the series with two hidden cycles plus noise:
set.seed(2024)
my_n <- 240
my_t <- 1:my_n
my_y <- 2 * sin(2 * pi * my_t / 8) + 3 * sin(2 * pi * my_t / 20) + rnorm(my_n, sd = 1)
# your code: take the top 2 peaks of spectrum(my_y) and convert them to periods
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two hidden cycles solution"
set.seed(2024)
my_n <- 240
my_t <- 1:my_n
my_y <- 2 * sin(2 * pi * my_t / 8) + 3 * sin(2 * pi * my_t / 20) + rnorm(my_n, sd = 1)
my_sp <- spectrum(my_y, plot = FALSE)
my_top2 <- order(my_sp$spec, decreasing = TRUE)[1:2]
sort(round(1 / my_sp$freq[my_top2], 1))
#> [1]  8 20
```

**Explanation:** Each planted wave creates its own peak, so the two strongest frequencies invert to periods of 8 and 20, recovering both cycles. Sorting just puts them in ascending order for easy reading.

</details>

### Exercise 2: Compare a raw and a smoothed spectrum on real data

Using `nottem`, find the dominant period (in months) from the raw spectrum and from a smoothed spectrum with `spans = c(3, 3)`, and report the smoothed bandwidth. Confirm the annual peak survives smoothing.

```r title="Raw versus smoothed spectrum"
# your code: compute the raw and smoothed spectra of nottem,
# report both peak periods in months and the smoothed bandwidth
```

<details>
<summary>Click to reveal solution</summary>

```r title="Raw versus smoothed solution"
my_raw <- spectrum(nottem, plot = FALSE)
my_smooth <- spec.pgram(nottem, spans = c(3, 3), taper = 0.1, plot = FALSE)
c(raw_period_months    = round((1 / my_raw$freq[which.max(my_raw$spec)]) * 12, 2),
  smooth_period_months = round((1 / my_smooth$freq[which.max(my_smooth$spec)]) * 12, 2),
  smooth_bandwidth     = round(my_smooth$bandwidth, 4))
#>    raw_period_months smooth_period_months     smooth_bandwidth 
#>               12.000               12.000                0.052 
```

**Explanation:** Both the raw and smoothed spectra peak at 12 months, so the annual cycle survives smoothing. Smoothing only widens the bandwidth to about 0.052, steadying the estimate without moving the peak.

</details>

### Exercise 3: Prove that fft() and spectrum() agree

Generate a cosine wave with a period of 25 plus noise, then find the dominant period two ways: by hand with `fft()`, and with `spectrum()`. Show that both return the same period.

```r title="Match fft and spectrum"
# Build the signal first:
set.seed(99)
my_sig <- 4 * cos(2 * pi * (1:100) / 25) + rnorm(100, sd = 1.5)
# your code: compute the peak period with fft(), then with spectrum(), and compare
```

<details>
<summary>Click to reveal solution</summary>

```r title="fft versus spectrum solution"
set.seed(99)
my_sig <- 4 * cos(2 * pi * (1:100) / 25) + rnorm(100, sd = 1.5)
my_fft_p <- (Mod(fft(my_sig - mean(my_sig)))^2) / 100
my_f <- (0:99) / 100
my_h <- 2:50
fft_period <- 1 / my_f[my_h][which.max(my_fft_p[my_h])]
spec_sp <- spectrum(my_sig, plot = FALSE)
spec_period <- 1 / spec_sp$freq[which.max(spec_sp$spec)]
c(fft_period = round(fft_period, 2), spectrum_period = round(spec_period, 2))
#>      fft_period spectrum_period 
#>              25              25 
```

**Explanation:** The hand-built periodogram and the built-in `spectrum()` both pick out a period of 25, confirming that `spectrum()` is just a polished wrapper around the same Fourier machinery you coded yourself.

</details>

## Frequently Asked Questions

### What is the difference between a periodogram and a power spectrum?

The periodogram is the raw estimate: the squared, scaled output of the Fourier transform at every frequency. It is spiky and noisy. The power spectrum (or spectral density) is the smoothed version you get after averaging neighbouring frequencies with `spans`. In everyday use people treat the smoothed curve as the thing worth reading, because the raw periodogram's noise never settles down no matter how much data you have.

### Should I use spectrum() or spec.pgram()?

Use `spectrum()` for a quick look; it is a friendly wrapper that detrends and tapers the series before plotting it with sensible defaults. Reach for `spec.pgram()` when you want direct control over the arguments, especially `spans` for smoothing, `taper` for leakage, and `detrend` for trend removal. They share the same engine, so the peak you find will agree.

### Why is my biggest peak stuck at the lowest frequency?

That is almost always an untreated trend. A series drifting up or down looks like the slow start of one giant cycle, so it piles power at the lowest frequencies. Detrend the series first (it is the default in `spectrum()`), and the real cycles will surface, exactly as they did for `AirPassengers` above.

### How much data do I need to detect a cycle?

You need at least two full repeats of the cycle just to register it, and several more to trust the peak. A yearly cycle in monthly data (period 12) needs a bare minimum of 24 months, but two or three years give a far cleaner signal. The longer your record, the finer the frequency grid, so longer series also separate close cycles more clearly.

### Can I run spectral analysis on unevenly spaced data?

Not with `fft()`, `spectrum()`, or `spec.pgram()`, which all assume evenly spaced observations. For irregular timestamps or missing points, the standard tool is the Lomb-Scargle periodogram, available in the `lomb` package, which estimates the spectrum directly from the time-value pairs without requiring a fixed sampling interval.

## Summary

Spectral analysis turns a confusing time plot into a clear ranking of cycles. You compute a periodogram, read its tallest peak, and invert the peak's frequency to get the dominant cycle length. The workflow below captures the five moves you will repeat every time.

![The five-step spectral analysis workflow, from detrending to reading the peak](screenshots/Spectral-Analysis-in-R-workflow.webp)

*Figure 2: The five-step spectral analysis workflow, from detrending to reading the peak.*

| Idea | What to remember |
|---|---|
| Periodogram | A chart of power versus frequency; a tall peak is a strong cycle |
| Period and frequency | Reciprocals: period = 1 / frequency, in your data's time units |
| `spectrum()` and `spec.pgram()` | The base R workhorses; both detrend and taper by default |
| `fft()` | The engine underneath; periodogram = squared magnitude, scaled by n |
| Nyquist limit | Fastest detectable cycle is 2 samples per repeat (frequency 0.5) |
| Smoothing with `spans` | Averages neighbours into a steadier power spectrum; wider blurs more |
| Detrending | Mandatory on trending data, or the trend fakes a huge low-frequency cycle |

Keep the flow in Figure 2 close: detrend, compute the periodogram, smooth it, read the peak, and convert the frequency to a period. With those five steps you can uncover a hidden season, confirm a known rhythm, or filter a cycle out to see what lies beneath.

## References

1. R Core Team. *spec.pgram: Estimate Spectral Density of a Time Series by a Smoothed Periodogram.* R stats package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/spec.pgram.html)
2. R Core Team. *spectrum: Spectral Density Estimation.* R stats package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/spectrum.html)
3. Shumway, R. H., & Stoffer, D. S. *Time Series Analysis and Its Applications: With R Examples*, 4th Edition. Springer (2017). Chapter 4: Spectral Analysis and Filtering. [Link](https://link.springer.com/book/10.1007/978-3-319-52452-8)
4. Cryer, J. D., & Chan, K.-S. *Time Series Analysis: With Applications in R*, 2nd Edition. Springer (2008). Chapter 13: Introduction to Spectral Analysis. [Link](https://link.springer.com/book/10.1007/978-0-387-75959-3)
5. PennState STAT 510. *Lesson 6: The Periodogram.* Applied Time Series Analysis. [Link](https://online.stat.psu.edu/stat510/Lesson06)
6. R Core Team and contributors. *CRAN Task View: Time Series Analysis* (see the Frequency Analysis section). [Link](https://cran.r-project.org/web/views/TimeSeries.html)

## Continue Learning

- [Test for Stationarity in R](Test-Stationarity-in-R.html): Spectral analysis assumes a stable series, so check stationarity with the ADF and KPSS tests before you trust the peaks.
- [ACF and PACF in R](ACF-and-PACF-in-R.html): The time-domain cousin of the periodogram; autocorrelation finds repeating structure by comparing a series with lagged copies of itself.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html): Once you know the dominant cycle, split the series into trend, seasonal, and remainder components to model each piece on its own.
