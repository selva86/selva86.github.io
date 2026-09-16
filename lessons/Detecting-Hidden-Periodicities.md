---
title: "Spectral and Frequency Domain Analysis Lesson 4: Detecting hidden periodicities"
catalog_blurb: "Test whether a periodogram peak is real, and avoid the aliasing trap."
description: "Use Fisher's g-statistic to test whether a periodogram peak is real, dodge aliasing from sampling too slowly, and confirm cycles in sunspots and lynx counts."
keywords: "Fisher's g-statistic, periodogram significance test, hidden periodicity, aliasing in time series, Nyquist frequency, spec.pgram in R, sunspot cycle length, lynx population cycle, Fourier terms in regression, seasonal ARIMA"
post_type: "LESSON"
curriculum_id: "5.90.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-spectral"
course_title: "Spectral and Frequency Domain Analysis"
course_lesson: "4"
course_total: "5"
course_landing: "Spectral-and-Frequency-Domain-Analysis-Course.html"
course_next: "Wavelets-for-Non-Stationary-Signals.html"
course_prev: "Filtering-Low-Pass-High-Pass-and-Band-Pass.html"
---

=== step === cover
## Detecting hidden periodicities

Today let's settle the question this periodogram raises: is that tall spike a real cycle, or something pure noise could throw up on its own?

Northside Diner is the same lunch restaurant as before, seventy days of lunch covers, averaging 119.2 a day with a standard deviation of 25.4. Its periodogram has 35 ordinates, and two of them tower over the rest. The tallest sits at frequency 1/7, the exact frequency of a real weekly cycle, with an ordinate of 14,997.4. The next tallest sits at frequency 2/7, a smaller cycle repeating every 3.5 days, with an ordinate of 3,576.7.

::widget chart-plotter {"data":[{"x":0.01429,"y":175.5},{"x":0.02857,"y":34.8},{"x":0.04286,"y":49.6},{"x":0.05714,"y":140.6},{"x":0.07143,"y":334.1},{"x":0.08571,"y":172.3},{"x":0.1,"y":65},{"x":0.11429,"y":89.8},{"x":0.12857,"y":62.4},{"x":0.14286,"y":14997.4},{"x":0.15714,"y":54.4},{"x":0.17143,"y":40.4},{"x":0.18571,"y":269.2},{"x":0.2,"y":135.6},{"x":0.21429,"y":59.8},{"x":0.22857,"y":67.4},{"x":0.24286,"y":3.1},{"x":0.25714,"y":80.2},{"x":0.27143,"y":307.6},{"x":0.28571,"y":3576.7},{"x":0.3,"y":31},{"x":0.31429,"y":252},{"x":0.32857,"y":97},{"x":0.34286,"y":121.4},{"x":0.35714,"y":33.2},{"x":0.37143,"y":23.1},{"x":0.38571,"y":28.9},{"x":0.4,"y":10.8},{"x":0.41429,"y":113.3},{"x":0.42857,"y":35.9},{"x":0.44286,"y":345.8},{"x":0.45714,"y":25.9},{"x":0.47143,"y":184},{"x":0.48571,"y":149.7},{"x":0.5,"y":54.9}],"geoms":["line","point"],"x":"frequency","y":"ordinate"}

Toggle between line and point to look at that periodogram one more time. One ordinate stands forty times taller than the next one down, and the rest sit near the floor. This lesson gives you a real test for how tall is too tall to be chance, and shows what happens to a genuine cycle that runs faster than your data was ever sampled to catch.

=== step === concept
## Rebuild the data and meet Fisher's g-statistic

Start by rebuilding Northside Diner's series and its periodogram, since every number in this lesson grows out of them.

```r
# Rebuild Northside Diner's 70 days of lunch covers, then run the periodogram
set.seed(2024)
day <- 1:70
baseline <- 120
fundamental <- 30 * cos(2 * pi * (day - 5) / 7)
harmonic <- 12 * cos(4 * pi * (day - 5) / 7)
noise <- rnorm(70, 0, 10)
northside_covers <- round(baseline + fundamental + harmonic + noise)

pg <- spec.pgram(ts(northside_covers), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
total_power <- sum(pg$spec)
g_obs <- max(pg$spec) / total_power

round(total_power, 2)
round(max(pg$spec), 1)
round(g_obs, 3)
#> [1] 22223.06
#> [1] 14997.4
#> [1] 0.675
```

Every ordinate in a periodogram measures a slice of the series' total variation, so adding up all 35 of them, `total_power`, gives the whole amount of variation there is to explain. The tallest ordinate, 14,997.4, is one slice of that total. Divide one by the other and you get `g_obs`, 0.675: the tallest ordinate's share of everything the periodogram found. That share is called Fisher's g-statistic, named for the statistician who worked out how to test it.

If Northside Diner's series were pure noise, with no real cycle in it at all, the 35 ordinates would carry roughly equal shares of the total power, about 1/35, or 2.9%, each. `g_obs` of 0.675 is nowhere near that: one ordinate alone is carrying 67.5% of everything. So here is the real question: is 67.5% actually too much for chance, or could a single noisy ordinate occasionally get that lucky on its own?

=== step === widget
## Is g = 0.675 too big to be chance?

The honest way to answer that is to build a lot of series that are pure noise, nothing else, and see how large g gets on its own.

```r
# Build a null distribution for g by simulating 2,000 pure-noise periodograms
set.seed(99)
g_sim <- replicate(2000, {
  noise_only <- rnorm(70, 0, 10)
  p <- spec.pgram(ts(noise_only), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
  max(p$spec) / sum(p$spec)
})

round(mean(g_sim), 3)
round(max(g_sim), 3)
mean(g_sim >= g_obs)
#> [1] 0.121
#> [1] 0.362
#> [1] 0
```

Each of the 2,000 reps draws 70 fresh points of pure noise, runs the same `spec.pgram()` call, and keeps only the largest ordinate's share of the total: exactly the same g calculation from the last step, just on noise instead of Northside Diner's real series. Across all 2,000 of them, g averages 0.121, and the single largest value any of them ever reached was 0.362. Not one of the 2,000 came anywhere near `g_obs`'s 0.675, which is why `mean(g_sim >= g_obs)` comes back 0.

The chart below places `g_obs` against a bell-shaped null distribution to show the same idea a different way: a shaded tail marking how much of a distribution sits at or beyond a given value.

::widget null-distribution {"tails":1,"max":0.8,"start":0.675,"label":"the g statistic, the largest ordinate as a share of the total"}

Drag the marker down to 0.362, the largest g the simulation ever produced, and the shaded tail is already tiny. Push it up to 0.675, Northside Diner's real value, and the tail all but disappears. Fisher's g does not actually follow this bell-shaped curve; its real null distribution is the lopsided one you just built by simulation, which never got past 0.362 in 2,000 tries. But the logic the curve is showing, a smaller shaded tail meaning a rarer value, is exactly the logic behind Fisher's test.

=== step === concept
## Fisher's exact test: the formula behind the simulation

Running 2,000 simulations to test one peak works, but Fisher found a closed-form shortcut in 1929 that skips the simulation entirely. For a periodogram with q independent ordinates, the chance that the single largest one reaches a share g or more of the total works out to approximately \(P(g_{\max} \ge g) \approx q(1-g)^{q-1}\).

```r
# Compute Fisher's approximate p-value for g_obs, and the critical g at alpha = 0.05
q <- length(pg$freq)
p_approx <- q * (1 - g_obs)^(q - 1)

alpha <- 0.05
g_thresh <- 1 - (alpha / q)^(1 / (q - 1))

q
p_approx
round(g_thresh, 3)
round(g_obs / g_thresh, 2)
#> [1] 35
#> [1] 9.008299e-16
#> [1] 0.175
#> [1] 3.85
```

With q = 35 ordinates and `g_obs` = 0.675, that formula gives a p-value of about 9.0 times ten to the minus 16, a number so small it is easier to call it what it is: for all practical purposes, zero. A g this large essentially never happens by chance with 35 ordinates in play.

Turn the same formula around and it hands you a critical value directly, the smallest g that still counts as real at a chosen significance level alpha: \(g^{*} = 1 - (\alpha/q)^{1/(q-1)}\). Solving it for alpha = 0.05 and q = 35 gives g* = 0.175. Any g above 0.175 counts as real at the 5% level, and Northside Diner's 0.675 clears it by nearly four times over, not by a hair.

=== step === quiz
## Quick check: reading Fisher's g-statistic

A different series has q = 50 candidate frequencies, and its largest ordinate carries g = 0.14 of the total power. Is that peak real, or still consistent with noise?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Noise-consistent: g = 0.14 is far smaller than Northside Diner's g = 0.675, so it does not look like a real cycle. ::no Comparing two g values straight across two different series does not work, because the critical value itself depends on q, the number of ordinates. A series with 50 ordinates and one with 35 do not share the same bar for "real."
- Real: g = 0.14 is comfortably above alpha = 0.05, so the peak is significant. ::no g is not a p-value, and alpha is not a threshold for g. Comparing g directly to alpha skips the actual test, which is computing g* from q and alpha, then comparing g to g*.
- Real: g* for q = 50 at alpha = 0.05 works out to 0.1315, using g* = 1 - (alpha/q)^(1/(q-1)), and 0.14 sits just above it. ::ok Right. Recomputed for the new q, the critical value is 0.1315, and 0.14 clears it, though only barely, nothing like Northside Diner's g = 0.675 sitting nearly four times over its own threshold of 0.175.
- Noise-consistent: 0.14 is below Northside Diner's own critical value of 0.175. ::no The critical value 0.175 belongs to Northside Diner's own q = 35. A series with 50 ordinates needs its own critical value recomputed from its own q, which comes out lower, at 0.1315, not higher.

=== step === concept
## The Nyquist frequency: the fastest cycle you can ever see

Every periodogram in this lesson so far has stopped at frequency 0.5 and never gone past it. That's not a coincidence, and it has a name.

A series sampled once a day has a sampling interval of 1 day, the gap between one reading and the next. The fastest cycle that sampling rate can ever pin down is called the Nyquist frequency, equal to 1 divided by twice the sampling interval. For Northside Diner, that's 1 / (2 x 1) = 0.5 cycles a day, a period of exactly 2 days: the fastest a wave can complete and still be seen by daily readings.

```r
# Confirm the Nyquist frequency spec.pgram() has been enforcing all along
max(pg$freq)
#> [1] 0.5
```

A cycle faster than that, completing in less than 2 days, needs at least two readings inside every repeat to be pinned down, and a daily sample only ever gives one. `spec.pgram()` never even bothers checking frequencies past 0.5, because with data this coarse, nothing past that point can be told apart from something slower. Does a cycle like that just disappear, or does something else happen instead?

=== step === widget
## The aliasing trap: sample too slowly, disguise a cycle

It does not disappear. It shows up at a different frequency altogether, one you did not build and would have no reason to expect. That's called aliasing, and it's the single biggest danger in reading a periodogram from data you did not sample fast enough.

To see it happen, build a new series with one true cycle, faster than anything in Northside Diner's data: a wave repeating every 2.5 days, sampled once a day for 90 days.

```r
# Build 90 days with a real 2.5-day cycle, sampled once a day
set.seed(7)
t_days <- 1:90
fast_signal <- 10 * cos(2 * pi * t_days / 2.5) + rnorm(90, 0, 1)
pg_fast <- spec.pgram(ts(fast_signal), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)

pg_fast$freq[which.max(pg_fast$spec)]
max(pg_fast$freq)
#> [1] 0.4
#> [1] 0.5
```

A 2.5-day cycle repeats at frequency 1/2.5 = 0.4 cycles a day, and that's exactly where the periodogram finds it, safely under the daily data's Nyquist frequency of 0.5. Sampled fast enough, the true cycle comes back correctly, no surprises.

Now do the one thing that breaks it: keep only every 3rd day's reading, 30 points instead of 90, as if a sensor without the budget to check daily could only afford a reading every three days.

```r
# Now keep only every 3rd day, 30 points instead of 90, and run the periodogram again
undersampled <- fast_signal[seq(1, 90, by = 3)]
length(undersampled)

pg_under <- spec.pgram(ts(undersampled), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
peak_per_sample <- pg_under$freq[which.max(pg_under$spec)]
peak_per_sample
round(peak_per_sample / 3, 3)
3 / peak_per_sample
#> [1] 30
#> [1] 0.2
#> [1] 0.067
#> [1] 15
```

With only 30 points 3 days apart, `spec.pgram()` now treats each step as one unit, so `peak_per_sample`, 0.2, is in cycles per sample, not cycles per day. Divide by 3 to put it back on a cycles-per-day footing, and the periodogram is reporting a cycle at 0.067 cycles a day, a period of 15 days. Fifteen days is six times the real 2.5-day period, and it is not a rounding error: it is the real cycle wearing a completely different, wrong, slower frequency.

See both periodograms side by side on the same cycles-per-day axis, and the disappearance is obvious.

::widget chart-plotter {"data":[{"x":0.01111,"y":0.45,"fill":"sampled daily"},{"x":0.02222,"y":4.03,"fill":"sampled daily"},{"x":0.03333,"y":0.4,"fill":"sampled daily"},{"x":0.04444,"y":0.24,"fill":"sampled daily"},{"x":0.05556,"y":3.3,"fill":"sampled daily"},{"x":0.06667,"y":2.35,"fill":"sampled daily"},{"x":0.07778,"y":1.91,"fill":"sampled daily"},{"x":0.08889,"y":3.4,"fill":"sampled daily"},{"x":0.1,"y":1.85,"fill":"sampled daily"},{"x":0.11111,"y":0.17,"fill":"sampled daily"},{"x":0.12222,"y":0.52,"fill":"sampled daily"},{"x":0.13333,"y":0.3,"fill":"sampled daily"},{"x":0.14444,"y":1.48,"fill":"sampled daily"},{"x":0.15556,"y":1.58,"fill":"sampled daily"},{"x":0.16667,"y":0.31,"fill":"sampled daily"},{"x":0.17778,"y":0.18,"fill":"sampled daily"},{"x":0.18889,"y":1.48,"fill":"sampled daily"},{"x":0.2,"y":0.37,"fill":"sampled daily"},{"x":0.21111,"y":0.09,"fill":"sampled daily"},{"x":0.22222,"y":0.7,"fill":"sampled daily"},{"x":0.23333,"y":0.27,"fill":"sampled daily"},{"x":0.24444,"y":0.28,"fill":"sampled daily"},{"x":0.25556,"y":0.34,"fill":"sampled daily"},{"x":0.26667,"y":0.11,"fill":"sampled daily"},{"x":0.27778,"y":2.37,"fill":"sampled daily"},{"x":0.28889,"y":0.09,"fill":"sampled daily"},{"x":0.3,"y":0.63,"fill":"sampled daily"},{"x":0.31111,"y":0.44,"fill":"sampled daily"},{"x":0.32222,"y":1.15,"fill":"sampled daily"},{"x":0.33333,"y":0.87,"fill":"sampled daily"},{"x":0.34444,"y":0.9,"fill":"sampled daily"},{"x":0.35556,"y":0.51,"fill":"sampled daily"},{"x":0.36667,"y":1.52,"fill":"sampled daily"},{"x":0.37778,"y":0.01,"fill":"sampled daily"},{"x":0.38889,"y":0.49,"fill":"sampled daily"},{"x":0.4,"y":2337.42,"fill":"sampled daily"},{"x":0.41111,"y":1.75,"fill":"sampled daily"},{"x":0.42222,"y":0.17,"fill":"sampled daily"},{"x":0.43333,"y":0.03,"fill":"sampled daily"},{"x":0.44444,"y":0.93,"fill":"sampled daily"},{"x":0.45556,"y":1.45,"fill":"sampled daily"},{"x":0.46667,"y":0.34,"fill":"sampled daily"},{"x":0.47778,"y":0.09,"fill":"sampled daily"},{"x":0.48889,"y":0.47,"fill":"sampled daily"},{"x":0.5,"y":0.02,"fill":"sampled daily"},{"x":0.01111,"y":1.2,"fill":"sampled every 3rd day"},{"x":0.02222,"y":2.3,"fill":"sampled every 3rd day"},{"x":0.03333,"y":0.75,"fill":"sampled every 3rd day"},{"x":0.04444,"y":0.03,"fill":"sampled every 3rd day"},{"x":0.05556,"y":0.06,"fill":"sampled every 3rd day"},{"x":0.06667,"y":807.39,"fill":"sampled every 3rd day"},{"x":0.07778,"y":1.67,"fill":"sampled every 3rd day"},{"x":0.08889,"y":2.1,"fill":"sampled every 3rd day"},{"x":0.1,"y":0.38,"fill":"sampled every 3rd day"},{"x":0.11111,"y":0.78,"fill":"sampled every 3rd day"},{"x":0.12222,"y":0.1,"fill":"sampled every 3rd day"},{"x":0.13333,"y":0.02,"fill":"sampled every 3rd day"},{"x":0.14444,"y":0.42,"fill":"sampled every 3rd day"},{"x":0.15556,"y":0.16,"fill":"sampled every 3rd day"},{"x":0.16667,"y":0.33,"fill":"sampled every 3rd day"}],"geoms":["line","point"],"x":"frequency","y":"ordinate","code":{"line":"ggplot(alias_pgrams, aes(frequency, ordinate, colour = group)) +\n  geom_line(linewidth = 1)","point":"ggplot(alias_pgrams, aes(frequency, ordinate, colour = group)) +\n  geom_point()"}}

Sampled daily, the tall ordinate sits at 0.4, right where the true cycle is. Sampled every 3rd day, that same tall ordinate has moved all the way over to 0.067, and it is now the tallest thing on an axis that only reaches up to 0.167, the new, lower Nyquist frequency that comes from tripling the sampling interval. The true 0.4 cycle was never wrong, it was simply faster than 30 points spaced 3 days apart could ever resolve, so the periodogram folded it down onto the one slower frequency it could still see.

There is no way to tell, from a single undersampled periodogram alone, whether a peak is a real slow cycle or a fast one in disguise. The only real check is to resample faster and see whether the peak's frequency holds still. A genuine 15-day cycle would stay at 0.067 no matter how often you sampled it. This one moved the instant the sampling rate changed, which is exactly what gives an alias away.

=== step === concept
## Finding the sunspot cycle

Northside Diner's cycle was built to order, so finding it proves the method works, not that it is useful. A series nobody built, one you have never seen the inside of, is the real test.

R ships `sunspot.year`, base R's own record of the average number of sunspots observed each year, 289 years of it, from 1700 to 1988.

```r
# Run the same Fisher's-test method on a real astronomical series
length(sunspot.year)
round(mean(sunspot.year), 1)
round(sd(sunspot.year), 1)

pg_sun <- spec.pgram(sunspot.year, taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
q_sun <- length(pg_sun$freq)
g_sun <- max(pg_sun$spec) / sum(pg_sun$spec)
q_sun
round(g_sun, 4)
#> [1] 289
#> [1] 48.6
#> [1] 39.5
#> [1] 144
#> [1] 0.2505
```

289 years of counts average 48.6 sunspots a year, swinging by a standard deviation of 39.5, itself a hint of some regular rise and fall rather than pure randomness. `spec.pgram()` checks 144 candidate frequencies this time, since q always works out to about n/2. The tallest ordinate carries `g_sun` = 0.2505 of the total, smaller than Northside Diner's 0.675, but the critical value for a series this size is smaller too.

Read off the top 5 ordinates directly, by frequency, period and size.

```r
# List the five tallest ordinates by frequency, period and size
top5 <- order(pg_sun$spec, decreasing = TRUE)[1:5]
data.frame(
  frequency = round(pg_sun$freq[top5], 5),
  period = round(1 / pg_sun$freq[top5], 2),
  ordinate = round(pg_sun$spec[top5], 1)
)
#>   frequency period ordinate
#> 1   0.08997  11.12  56207.7
#> 2   0.10035   9.97  37120.6
#> 3   0.01038  96.33  23099.7
#> 4   0.08304  12.04  18026.1
#> 5   0.09343  10.70   8852.9
```

Plot those top 5 ordinates by period, and one of them clearly leads the rest.

::widget chart-plotter {"data":[{"x":11.12,"y":56207.7},{"x":9.97,"y":37120.6},{"x":96.33,"y":23099.7},{"x":12.04,"y":18026.1},{"x":10.7,"y":8852.9}],"geoms":["bar","point"],"x":"period (years)","y":"ordinate"}

```r
# Compute Fisher's approximate p-value for the sunspot series
p_sun <- q_sun * (1 - g_sun)^(q_sun - 1)
p_sun
#> [1] 1.78103e-16
```

Fisher's formula gives `p_sun` = 1.78 times ten to the minus 16 for that ordinate, just as decisively non-random as Northside Diner's own result. The period behind it, 11.12 years, lands almost exactly on the roughly 11-year solar cycle that astronomers have tracked in sunspot counts for over two centuries. Fisher's g found a real astronomical cycle in a series with no built-in answer key.

=== step === concept
## What to do once a period is confirmed

Confirming a period with Fisher's test is not the end of the analysis, it is the start of the next one. Once you know a cycle is real, and at what frequency, there are two standard ways to put that number to work.

- Add it to a regression as a Fourier pair: two new columns, one a sine wave and one a cosine wave, both running at the confirmed frequency. Together they let a linear model fit any phase and any amplitude of that cycle.
- Fit a seasonal ARIMA at that period: tell the model its seasonal length m equals the period you found, and let it model the cycle directly instead of through two extra regression columns.

Either way, Fisher's test is what supplied the number these methods actually need. For Northside Diner's confirmed 7-day cycle, that means a Fourier pair at frequency 1/7, or a seasonal ARIMA with m = 7.

```r
# Build the Fourier pair for Northside Diner's confirmed 7-day cycle
fourier_sin <- sin(2 * pi * day / 7)
fourier_cos <- cos(2 * pi * day / 7)

round(cor(northside_covers, fourier_sin), 3)
round(cor(northside_covers, fourier_cos), 3)
#> [1] -0.813
#> [1] -0.118
```

`fourier_sin` alone already correlates with `northside_covers` at -0.813, a strong relationship for a single column built purely from the calendar, with no lunch counts in it at all. That correlation is exactly why the pair earns a place in a regression: it carries real information about the 7-day cycle, the same cycle Fisher's test just spent three steps confirming was not noise.

=== step === quiz
## Closing quiz: from a periodogram peak to a decision

Put the whole method together.

A series sampled once every 2 hours has q = 60 candidate frequencies, and its largest ordinate carries g = 0.30 of the total power, at frequency 0.24 cycles an hour, close to that sampling rate's own Nyquist frequency of 0.25. Alpha is 0.05. What should you conclude, and what should you check before trusting it?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- g* for q = 60 at alpha = 0.05 works out to 0.113, so g = 0.30 is comfortably real, not noise. But 0.24 sits right against the Nyquist frequency of 0.25, so before trusting the roughly 4.17-hour period, resample twice as fast and check that the same frequency holds. Only after that would a Fourier pair or a seasonal ARIMA at that period be worth fitting. ::ok Exactly right. The g-statistic and the Nyquist check answer two different questions, and a peak needs to pass both before you act on it: real by Fisher's test, and stable when you sample faster.
- g = 0.30 is comfortably above the threshold, so the period is confirmed at 4.17 hours: add it straight into a regression as a Fourier pair. ::no The g-statistic only says this is not noise. It says nothing about whether 0.24 is the cycle's true frequency or an alias of something faster folded down by undersampling, which a peak sitting this close to Nyquist should make you check.
- Since g = 0.30 is far bigger than alpha = 0.05, the peak is definitely real at exactly the frequency reported, no further check needed. ::no g is not a p-value and is never compared to alpha directly. The actual test is g against g*, the critical value computed from q and alpha, and even a peak that clears it can still be an alias if it sits near Nyquist.
- A peak this close to the Nyquist frequency is always an artifact of undersampling and should be dropped, regardless of its g-statistic. ::no Sitting near Nyquist is a reason to double-check by resampling faster, not an automatic disqualification. A real cycle just below Nyquist looks exactly the same as an alias until you actually test it at a faster rate, which is why the check, not a blanket rule, is what settles it.

=== step === tryit
## Your turn: test the lynx population cycle

`lynx` is another base R dataset: 114 annual counts of lynx pelts trapped in the Mackenzie River district of Canada, 1821 to 1934, a series famous in ecology for its own repeating boom-and-bust cycle. Run the same Fisher's-test method on it, start to finish.

```r
# lynx already holds 114 annual pelt counts, 1821-1934.
# Run spec.pgram() on it the same way as Northside Diner and the sunspots
# (taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE), call the
# result pg_lynx, then compute g_lynx as its largest ordinate divided by
# the sum of all its ordinates.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*spec[.]pgram[(]\\s*lynx)(?=[\\s\\S]*g_lynx\\s*<-\\s*max[(])(?=[\\s\\S]*sum[(])", "gate": true, "difficulty": "beginner", "ok": "Right: g_lynx comes out to 0.5196, comfortably real for q = 57. The peak sits at frequency 0.1053, a period of 9.5 years, close to the well-documented decade-long lynx cycle.", "no": "Call spec.pgram(lynx, taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE), store it as pg_lynx, then compute g_lynx <- max(pg_lynx$spec) / sum(pg_lynx$spec)."}
::solution
```r
# Run Fisher's test on the lynx population cycle
pg_lynx <- spec.pgram(lynx, taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
g_lynx <- max(pg_lynx$spec) / sum(pg_lynx$spec)
round(g_lynx, 4)
pg_lynx$freq[which.max(pg_lynx$spec)]
1 / pg_lynx$freq[which.max(pg_lynx$spec)]
#> [1] 0.5196
#> [1] 0.1052632
#> [1] 9.5
```

`g_lynx` = 0.5196 with q = 57 clears its own critical value easily, and the 9.5-year period it points to matches the lynx population cycle recorded in trapping records for well over a century.

=== step === concept
## References

- [Fisher, R.A. (1929), "Tests of Significance in Harmonic Analysis," Proceedings of the Royal Society of London A, 125(796)](https://doi.org/10.1098/rspa.1929.0151) - the original closed-form test for a periodogram's largest ordinate, the g-statistic used throughout this lesson.
- [Shumway, R.H. & Stoffer, D.S. (2017), Time Series Analysis and Its Applications (4th ed.)](https://www.stat.pitt.edu/stoffer/tsa4/) - Springer, Ch. 4 "Spectral Analysis and Filtering": the periodogram's sampling distribution and tests for hidden periodicities.
- [Chatfield, C. (2003), The Analysis of Time Series: An Introduction (6th ed.)](https://www.routledge.com/The-Analysis-of-Time-Series-An-Introduction-with-R/Chatfield-Xing/p/book/9781498706954) - Chapman & Hall/CRC, Ch. 7 "Spectral Analysis": tests for hidden periodicity and the aliasing problem in sampled data.
- [R documentation, stats::spec.pgram()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/spec.pgram.html)

=== step === complete
## Quick recap

You can now look at any periodogram peak and know exactly what to do with it. To summarize:

- Fisher's g, the largest ordinate's share of the total power, tests whether a peak is too big to be chance: compare it against g* = 1 - (alpha/q)^(1/(q-1)), or simulate a null distribution directly, the way a 2,000-rep pure-noise simulation did earlier in this lesson.
- A cycle faster than the Nyquist frequency, 1 over twice the sampling interval, does not vanish when it is undersampled. It reappears at a different, slower, wrong frequency, an alias, and the only way to catch one is to resample faster and see whether the peak holds still.
- Once a period is confirmed, it feeds straight into a Fourier pair in a regression or a seasonal ARIMA with that period as m. Fisher's test is what earns you the number those methods need.
