---
title: "Spectral and Frequency Domain Analysis Lesson 5: Wavelets for non-stationary signals"
catalog_blurb: "See how a wavelet tracks a cycle length that keeps changing over time."
description: "Build a Haar wavelet decomposition by hand in base R, then read a scalogram that shows a vibration signal's cycle length shrinking from 16 to 4 samples."
keywords: "Haar wavelet, multiresolution decomposition, scalogram, non-stationary signal, wavelet transform in R, periodogram, chirp signal, WaveletComp package, dplR package, wavelets package in R"
post_type: "LESSON"
curriculum_id: "5.90.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-spectral"
course_title: "Spectral and Frequency Domain Analysis"
course_lesson: "5"
course_total: "5"
course_landing: "Spectral-and-Frequency-Domain-Analysis-Course.html"
course_next: ""
course_prev: "Detecting-Hidden-Periodicities.html"
---

=== step === cover
## Wavelets for non-stationary signals

Today let's understand wavelets for non-stationary signals, using 128 vibration readings from a conveyor motor's startup ramp as the running example.

Riverside Bearing Co. mounted a sensor on a conveyor motor and logged 128 vibration readings during a startup ramp, one reading per sample. The motor's cycle genuinely shrinks over that ramp: about 16 samples per swing near the start, about 4 samples per swing near the end. Here is the whole trace, in the order it happened.

::widget chart-plotter {"data":[{"x":0,"y":0.82},{"x":1,"y":0.82},{"x":2,"y":2.38},{"x":3,"y":3.2},{"x":4,"y":3.23},{"x":5,"y":2.56},{"x":6,"y":2.65},{"x":7,"y":0.44},{"x":8,"y":0.33},{"x":9,"y":-2.12},{"x":10,"y":-2.06},{"x":11,"y":-1.59},{"x":12,"y":-3.19},{"x":13,"y":-1.32},{"x":14,"y":0.29},{"x":15,"y":2.2},{"x":16,"y":2.61},{"x":17,"y":1.37},{"x":18,"y":0.8},{"x":19,"y":1.65},{"x":20,"y":-1.03},{"x":21,"y":-3.36},{"x":22,"y":-3.08},{"x":23,"y":-1.92},{"x":24,"y":-0.22},{"x":25,"y":0.19},{"x":26,"y":1.95},{"x":27,"y":1.91},{"x":28,"y":2.92},{"x":29,"y":0.84},{"x":30,"y":-0.46},{"x":31,"y":-1.97},{"x":32,"y":-2.38},{"x":33,"y":-2.6},{"x":34,"y":-0.1},{"x":35,"y":0.61},{"x":36,"y":2.42},{"x":37,"y":2.18},{"x":38,"y":-0.36},{"x":39,"y":-1.09},{"x":40,"y":-2.6},{"x":41,"y":-3.05},{"x":42,"y":-0.87},{"x":43,"y":0.53},{"x":44,"y":1.89},{"x":45,"y":3.07},{"x":46,"y":0.67},{"x":47,"y":-0.38},{"x":48,"y":-3.12},{"x":49,"y":-2.19},{"x":50,"y":-0.36},{"x":51,"y":1.41},{"x":52,"y":3.94},{"x":53,"y":2.35},{"x":54,"y":-0.46},{"x":55,"y":-2.47},{"x":56,"y":-2.35},{"x":57,"y":-0.68},{"x":58,"y":0.09},{"x":59,"y":3.17},{"x":60,"y":1.43},{"x":61,"y":-0.98},{"x":62,"y":-2.57},{"x":63,"y":-1.38},{"x":64,"y":0.01},{"x":65,"y":3.51},{"x":66,"y":2.73},{"x":67,"y":0.6},{"x":68,"y":-2.01},{"x":69,"y":-2.22},{"x":70,"y":-0.77},{"x":71,"y":2.47},{"x":72,"y":3.03},{"x":73,"y":-0.5},{"x":74,"y":-2.93},{"x":75,"y":-2.19},{"x":76,"y":0.72},{"x":77,"y":3.06},{"x":78,"y":1.7},{"x":79,"y":-1.49},{"x":80,"y":-2.05},{"x":81,"y":-1.52},{"x":82,"y":1.64},{"x":83,"y":2.9},{"x":84,"y":0.05},{"x":85,"y":-2.01},{"x":86,"y":-2.72},{"x":87,"y":0.36},{"x":88,"y":3.49},{"x":89,"y":2.11},{"x":90,"y":-0.99},{"x":91,"y":-3.14},{"x":92,"y":0.35},{"x":93,"y":3.67},{"x":94,"y":1.13},{"x":95,"y":-2.27},{"x":96,"y":-3.51},{"x":97,"y":-0.72},{"x":98,"y":2.97},{"x":99,"y":1.8},{"x":100,"y":-1.49},{"x":101,"y":-1.88},{"x":102,"y":0.42},{"x":103,"y":4.09},{"x":104,"y":-0.1},{"x":105,"y":-2.8},{"x":106,"y":-1.71},{"x":107,"y":2.23},{"x":108,"y":2.42},{"x":109,"y":-1.42},{"x":110,"y":-2.82},{"x":111,"y":0.68},{"x":112,"y":2.7},{"x":113,"y":-0.08},{"x":114,"y":-3.94},{"x":115,"y":-1.16},{"x":116,"y":2.43},{"x":117,"y":3.11},{"x":118,"y":-3.28},{"x":119,"y":-1.82},{"x":120,"y":1.29},{"x":121,"y":1.3},{"x":122,"y":-1.87},{"x":123,"y":-2.96},{"x":124,"y":1.77},{"x":125,"y":2.21},{"x":126,"y":-2.05},{"x":127,"y":-3.71}],"geoms":["line","point"],"x":"sample","y":"reading"}

Toggle between line and point and look at how tight the wobble gets by the end compared to the start. Early on, one full up and down swing takes about 16 samples. By the end, the same swing takes about 4. A single frequency cannot describe a cycle that keeps shrinking like this, and this lesson is about the tool built for exactly that problem: the wavelet.

=== step === concept
## Build the startup vibration trace, then run one periodogram over it

Before anything else, build Riverside Bearing Co.'s trace in R exactly as described, then run a periodogram over it the same way you would on any series: one pass over all 128 points, reporting how much of the trace's variation, its ordinate, sits at each frequency, with period equal to 1 divided by that frequency, in samples.

```r
# Build 128 vibration readings from a chirp that speeds up over the run, then run one periodogram over all of them
set.seed(42)
n <- 128
t <- 0:(n - 1)
f0 <- 1 / 16                                          # cycle length near 16 samples at the start
f1 <- 1 / 4                                           # cycle length near 4 samples at the end
phase <- 2 * pi * (f0 * t + (f1 - f0) / (2 * 127) * t^2)
vibration <- round(3 * sin(phase) + rnorm(128, 0, 0.6), 2)

round(mean(vibration), 3)
round(sd(vibration), 3)

pg <- spec.pgram(ts(vibration), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
top5 <- order(pg$spec, decreasing = TRUE)[1:5]
data.frame(
  freq = round(pg$freq[top5], 5),
  period = round(1 / pg$freq[top5], 2),
  ordinate = round(pg$spec[top5], 2)
)
#> [1] 0.027
#> [1] 2.138
#>      freq period ordinate
#> 1 0.22656   4.41    22.47
#> 2 0.21875   4.57    21.71
#> 3 0.18750   5.33    16.38
#> 4 0.17188   5.82    15.34
#> 5 0.12500   8.00    14.51
```

`phase` is what is called a chirp: a sine wave whose own frequency does not stay fixed but climbs steadily as `t` runs from 0 to 127, from f0 = 1/16 cycles a sample up to f1 = 1/4 cycles a sample. Adding `rnorm(128, 0, 0.6)` puts a little real sensor noise on top. `vibration` averages 0.027 with a standard deviation of 2.138, matching the running example.

A plain periodogram assumes each frequency it checks runs the same way for the whole series it is given. That assumption is false here, since the true cycle length is moving the entire time.

Look at the top 5 ordinates: they sit at periods running from 8.00 samples down to 4.41 samples, five different periods bunched close together, with no single ordinate towering over the rest the way a fixed, unchanging cycle would. The periodogram cannot settle on one period because there is no one period to settle on. Its output spreads across a moving target instead of landing on it.

=== step === widget
## Split the series in half: does the frequency actually move?

One direct way to check whether the frequency really is moving is to cut the series into two pieces and run a periodogram on each piece separately.

```r
# Split the 128-point trace into its first and second halves, then run a periodogram on each half
first_half <- vibration[1:64]
second_half <- vibration[65:128]

pg1 <- spec.pgram(ts(first_half), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
pg2 <- spec.pgram(ts(second_half), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)

pg1$freq[which.max(pg1$spec)]
round(1 / pg1$freq[which.max(pg1$spec)], 2)
round(max(pg1$spec), 2)

pg2$freq[which.max(pg2$spec)]
round(1 / pg2$freq[which.max(pg2$spec)], 2)
round(max(pg2$spec), 2)
#> [1] 0.125
#> [1] 8
#> [1] 26.58
#> [1] 0.21875
#> [1] 4.57
#> [1] 42.86
```

The first half's tallest ordinate sits at period 8 samples, with an ordinate of 26.58. The second half's tallest ordinate sits at period 4.57 samples, with an ordinate of 42.86, taller still. The cycle length roughly halved between the first 64 points and the last 64, exactly the kind of change one whole-series periodogram, built to report a single description of the whole thing, could never show on its own.

See both halves' periodograms plotted together, on the same frequency axis.

::widget chart-plotter {"data":[{"x":0.0156,"y":2.303,"fill":"first half"},{"x":0.0313,"y":1.164,"fill":"first half"},{"x":0.0469,"y":3.415,"fill":"first half"},{"x":0.0625,"y":4.588,"fill":"first half"},{"x":0.0781,"y":15.184,"fill":"first half"},{"x":0.0938,"y":24.847,"fill":"first half"},{"x":0.1094,"y":17.393,"fill":"first half"},{"x":0.125,"y":26.577,"fill":"first half"},{"x":0.1406,"y":16.137,"fill":"first half"},{"x":0.1563,"y":3.832,"fill":"first half"},{"x":0.1719,"y":1.707,"fill":"first half"},{"x":0.1875,"y":0.453,"fill":"first half"},{"x":0.2031,"y":0.802,"fill":"first half"},{"x":0.2188,"y":0.924,"fill":"first half"},{"x":0.2344,"y":0.333,"fill":"first half"},{"x":0.25,"y":1.418,"fill":"first half"},{"x":0.2656,"y":0.82,"fill":"first half"},{"x":0.2813,"y":0.173,"fill":"first half"},{"x":0.2969,"y":0.456,"fill":"first half"},{"x":0.3125,"y":0.017,"fill":"first half"},{"x":0.3281,"y":0.051,"fill":"first half"},{"x":0.3438,"y":0.357,"fill":"first half"},{"x":0.3594,"y":0.696,"fill":"first half"},{"x":0.375,"y":0.277,"fill":"first half"},{"x":0.3906,"y":1.203,"fill":"first half"},{"x":0.4063,"y":0.318,"fill":"first half"},{"x":0.4219,"y":0.202,"fill":"first half"},{"x":0.4375,"y":0.319,"fill":"first half"},{"x":0.4531,"y":0.644,"fill":"first half"},{"x":0.4688,"y":0.516,"fill":"first half"},{"x":0.4844,"y":0.227,"fill":"first half"},{"x":0.5,"y":0.051,"fill":"first half"},{"x":0.0156,"y":0.307,"fill":"second half"},{"x":0.0313,"y":0.177,"fill":"second half"},{"x":0.0469,"y":0.332,"fill":"second half"},{"x":0.0625,"y":0.199,"fill":"second half"},{"x":0.0781,"y":0.994,"fill":"second half"},{"x":0.0938,"y":0.424,"fill":"second half"},{"x":0.1094,"y":0.745,"fill":"second half"},{"x":0.125,"y":0.088,"fill":"second half"},{"x":0.1406,"y":0.946,"fill":"second half"},{"x":0.1563,"y":4.615,"fill":"second half"},{"x":0.1719,"y":22.461,"fill":"second half"},{"x":0.1875,"y":39.371,"fill":"second half"},{"x":0.2031,"y":16.453,"fill":"second half"},{"x":0.2188,"y":42.858,"fill":"second half"},{"x":0.2344,"y":18.357,"fill":"second half"},{"x":0.25,"y":8.673,"fill":"second half"},{"x":0.2656,"y":1.113,"fill":"second half"},{"x":0.2813,"y":0.825,"fill":"second half"},{"x":0.2969,"y":0.037,"fill":"second half"},{"x":0.3125,"y":0.082,"fill":"second half"},{"x":0.3281,"y":0.073,"fill":"second half"},{"x":0.3438,"y":0.003,"fill":"second half"},{"x":0.3594,"y":0.139,"fill":"second half"},{"x":0.375,"y":0.824,"fill":"second half"},{"x":0.3906,"y":0.36,"fill":"second half"},{"x":0.4063,"y":0.441,"fill":"second half"},{"x":0.4219,"y":0.361,"fill":"second half"},{"x":0.4375,"y":0.697,"fill":"second half"},{"x":0.4531,"y":0.031,"fill":"second half"},{"x":0.4688,"y":0.041,"fill":"second half"},{"x":0.4844,"y":0.356,"fill":"second half"},{"x":0.5,"y":0.49,"fill":"second half"}],"geoms":["line","point"],"x":"frequency","y":"ordinate","code":{"line":"ggplot(half_pgrams, aes(frequency, ordinate, colour = half)) +\n  geom_line(linewidth = 1)","point":"ggplot(half_pgrams, aes(frequency, ordinate, colour = half)) +\n  geom_point()"}}

Toggle to point view and compare the two curves directly. The first half's curve peaks around frequency 0.125, period 8. The second half's curve peaks further right, around frequency 0.219, period 4.57, and reaches higher too.

Splitting the series in two was already enough to catch the drift the whole-series periodogram blurred away. But cutting in half is a blunt tool: it can only say the cycle moved somewhere between the two 64-point windows, not how it moved sample by sample. A wavelet is the tool built to see that finer picture.

=== step === concept
## The Haar wavelet by hand

The simplest wavelet, the Haar wavelet, does just two things to every neighboring pair of points in a series: average them, and take half their difference.

For a pair \\(x_{2i-1}, x_{2i}\\), the average and detail are:

\\(a_i = \\dfrac{x_{2i-1} + x_{2i}}{2}\\)

\\(d_i = \\dfrac{x_{2i-1} - x_{2i}}{2}\\)

Run that pairing on a small 8-number toy vector to see exactly what it produces.

```r
# Define haar_step(), then run it once on a small 8-number toy vector
haar_step <- function(x) {
  odd <- x[seq(1, length(x), by = 2)]
  even <- x[seq(2, length(x), by = 2)]
  avg <- (odd + even) / 2
  detail <- (odd - even) / 2
  list(avg = avg, detail = detail)
}

toy <- c(4, 6, 10, 12, 8, 8, 2, 4)
level1 <- haar_step(toy)
level1$avg
level1$detail
#> [1]  5 11  8  3
#> [1] -1 -1  0 -1
```

`haar_step()` pairs up neighbors, (4,6), (10,12), (8,8), (2,4), and turns each pair into one average and one detail. The pair (4,6) becomes average 5, detail -1. The pair (2,4) becomes average 3, detail -1. The pair (8,8) becomes average 8, detail 0, and a detail of exactly 0 has a plain meaning: that pair did not change at all between its two points.

One footnote on the numbers here. This hand version scales each term by 1/2. The orthonormal Haar wavelet used inside R's wavelet packages scales both terms by \\(\\dfrac{1}{\\sqrt{2}}\\) instead of 1/2, so that the squared size of the average and the detail together exactly equals the squared size of the original pair. The pairing idea, average one term and difference the other, is exactly the same either way; only the scaling differs.

=== step === concept
## A multiresolution decomposition: repeat the averaging, then run it on 128 points

`level1` above shrank an 8-number vector down to 4 averages and 4 details. Do the same averaging again, on those 4 averages, and a coarser level appears. Repeating that step is what turns one averaging pass into a multiresolution decomposition: several levels, each one twice as coarse as the last, each holding a detail vector that says how much changed at that particular scale.

```r
# Repeat haar_step() on the toy vector's own averages, twice more, down to a single number
level2 <- haar_step(level1$avg)
level2$avg
level2$detail

level3 <- haar_step(level2$avg)
level3$avg
level3$detail
#> [1] 8.0 5.5
#> [1] -3.0  2.5
#> [1] 6.75
#> [1] 1.25
```

`level2` pairs `level1`'s four averages, (5,11) and (8,3), into two coarser averages, 8 and 5.5, with details -3 and 2.5. `level3` pairs those two averages into one final average, 6.75, which is exactly the toy vector's own mean, along with one final detail, 1.25, that summarizes everything separating the two halves of the whole toy vector.

Each level also stands for a specific cycle length. Level 1 pairs immediate neighbors, two samples apart, so its details react to a roughly 2-sample cycle. Level 2 pairs level 1's own averages, and each of those already blends 2 original samples, so a level 2 detail reacts to roughly 4 samples. Doubling again at every level gives cycle lengths of 2, 4, 8, 16 and 32 samples for five levels.

Now run the same function, five times over, on the real 128-point vibration trace, going from 128 samples down to 64, 32, 16, 8 and 4 averages, keeping every level's detail vector along the way.

```r
# Run haar_step() five times on the vibration trace, keeping every level's detail vector
current <- vibration
levels <- list()
for (level in 1:5) {
  step_result <- haar_step(current)
  levels[[level]] <- step_result
  current <- step_result$avg
}

sapply(levels, function(lv) length(lv$detail))
sapply(levels, function(lv) round(sqrt(mean(lv$detail^2)), 3))
#> [1] 64 32 16  8  4
#> [1] 1.020 1.540 0.826 0.595 0.145
```

The five detail vectors run 64, 32, 16, 8 and 4 numbers long, one level for each of the cycle lengths 2, 4, 8, 16 and 32 samples. The second line squares every detail value in a level, averages the squares, and takes the square root: that is a level's RMS, root mean square, energy, one number, in the same units as the original readings, that says how much that level's scale wiggled across the whole trace. Level 2, the 4-sample cycle, carries the most energy overall at 1.540. Level 5, the 32-sample cycle, carries the least at 0.145, since a cycle that slow barely completes even once in a 128-point trace.

=== step === widget
## Reading a scalogram: where each scale's energy sits in time

An overall RMS per level says how much a scale wiggled across the whole trace, but not when. Split each level's detail values into a first half and a second half, take the RMS of each half separately, and you get exactly that: a picture of which cycle length was active early and which was active late. That kind of picture, energy by scale, split across time, is called a scalogram.

::widget facet-grid {"data":[{"x":2,"y":0.745,"facet":"first half"},{"x":2,"y":1.236,"facet":"second half"},{"x":4,"y":1.3,"facet":"first half"},{"x":4,"y":1.747,"facet":"second half"},{"x":8,"y":1.015,"facet":"first half"},{"x":8,"y":0.579,"facet":"second half"},{"x":16,"y":0.782,"facet":"first half"},{"x":16,"y":0.311,"facet":"second half"},{"x":32,"y":0.15,"facet":"first half"},{"x":32,"y":0.14,"facet":"second half"}],"geom":"bar","x":"cycle length (samples)","y":"RMS energy","facetVar":"half"}

Read the two panels side by side. The 8-sample cycle (level 3) carries more energy in the first half, 1.015 against 0.579 in the second half. The 16-sample cycle (level 4) shows the same pattern, 0.782 against 0.311.

Now flip to the faster end: the 4-sample cycle (level 2) carries more energy in the second half, 1.747 against 1.3 in the first, and the 2-sample cycle (level 1) does too, 1.236 against 0.745. The 32-sample cycle (level 5) barely moves between the two panels, 0.15 against 0.14, because a cycle that slow never really shows up in a 128-point trace either way.

That is the payoff of the whole decomposition. The energetic scale slides from roughly an 8-sample cycle early in the run to roughly a 4-sample cycle late in the run, matching almost exactly what splitting the plain periodogram in half had already shown: a period of 8 samples in the first half, 4.57 in the second. But this time the shift showed up from one decomposition of the whole series, level by level, rather than from cutting the series in half and comparing two separate periodograms by hand.

=== step === concept
## The wavelet packages worth knowing

`haar_step()`, run by hand above, is exactly what dedicated wavelet packages in R do, at full resolution and with wavelet shapes smoother than a plain Haar pair.

```r-static
# Run the same idea with dedicated wavelet packages, shown but not run on this page
library(wavelets)
haar_full <- dwt(vibration, filter = "haar", n.levels = 5)   # the same pyramid, wrapped in one call

library(WaveletComp)
wc <- analyze.wavelet(data.frame(x = vibration), "x")
wt.image(wc)                                                 # draws a scalogram directly, with a significance contour

library(dplR)
cwt_out <- morlet(vibration, dj = 0.1)                        # a continuous wavelet transform, standard in tree-ring analysis
```

The **wavelets** package's `dwt()`, with `filter = "haar"` and `n.levels = 5`, is exactly the five rounds of `haar_step()` run earlier, packaged into one call. It also offers smoother filters, `"d4"`, `"la8"` and others, that average more than two neighbors at a time for a gentler decomposition. Its `modwt()` does the same job without chopping the series into hard, non-overlapping pairs, so its detail levels line up with the original time axis exactly, unlike the plain `dwt()` pyramid built above.

**WaveletComp**'s `analyze.wavelet()` and `wt.image()` compute a continuous wavelet transform: instead of only doubling scales, 2, 4, 8, 16, 32 samples, it checks every scale in between, and `wt.image()` draws the resulting scalogram directly, with a shaded contour marking which regions are unlikely under pure red noise, noise that is itself autocorrelated from one sample to the next, unlike the independent noise added to `vibration` earlier.

**dplR**'s `morlet()` runs the same kind of continuous wavelet transform and is the standard tool in dendrochronology, the study of tree-ring width records, for finding growth cycles like those linked to the sunspot cycle.

=== step === quiz
## Closing quiz: from a blurred periodogram to a real scalogram reading

A different vibration series produces a scalogram where the 16-sample-cycle level's energy is strong in the first half of the series and weak in the second half, while the 4-sample-cycle level's energy is weak in the first half and strong in the second half. What does that scalogram say about the series, and could a single periodogram run over the whole series have shown it directly?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The cycle length shrinks from about 16 samples to about 4 samples as the series runs, and no, a single periodogram over the whole trace could not have shown that directly: it only reports one blurred spread of ordinates, with nothing that says which scale was active early versus late. ::ok Exactly. A scalogram is built by splitting each scale's energy across time, which is exactly what a single whole-series periodogram cannot do. A periodogram is built to summarize the whole series at once, and a summary cannot also say what changed partway through.
- The series holds two separate, simultaneous cycles the whole time, one 16 samples long and one 4 samples long, and a whole-series periodogram would have shown both peaks clearly. ::no
- The scalogram cannot be trusted here. Only a periodogram computed over the full series settles what the true cycle length really is. ::no
- The cycle length grows from about 4 samples to about 16 samples as the series runs. ::no Read the direction the other way. The coarse, slow scale's energy is the one fading, and the fine, fast scale's energy is the one growing, so the true cycle length is shrinking over the run, not growing, the same direction seen when this lesson's own vibration trace was split into two halves and its second half turned out faster than its first. And a periodogram computed once over the whole series could not have shown this at all: it hands back one static picture, with no way to say which frequency was active at which point in time.

=== step === tryit
## Your turn: decompose a new trace by hand

Here is a new 8-number trace to decompose on your own.

```r
# Here is a new trace, toy2, another 8-number vector to decompose by hand
toy2 <- c(10, 14, 22, 18, 6, 10, 26, 30)
toy2
#> [1] 10 14 22 18  6 10 26 30
```

`haar_step()` is still the function defined earlier on this page. Run it on `toy2`, twice in a row, and print every average and detail along the way.

```r
# Run haar_step() on toy2 to get level 1's average and detail.
# Then run haar_step() again on level 1's average to get level 2's
# average and detail. Print all four results.
# Four lines. Press Check when you have them.
```
::check {"regex": "haar_step[(]\\s*toy2[)][\\s\\S]*haar_step[(][^)]*avg", "gate": true, "difficulty": "beginner", "ok": "Right: level 1 gives averages 12, 20, 8, 28 and details -2, 2, -2, -2. Level 2, run on those four averages, gives averages 16, 18 and details -4, -10.", "no": "Call level1 <- haar_step(toy2) first, then level2 <- haar_step(level1$avg). Print level1$avg, level1$detail, level2$avg and level2$detail."}
::solution
```r
# Run haar_step() twice on toy2 to reach two levels of averages and details
level1 <- haar_step(toy2)
level1$avg
level1$detail

level2 <- haar_step(level1$avg)
level2$avg
level2$detail
#> [1] 12 20  8 28
#> [1] -2  2 -2 -2
#> [1] 16 18
#> [1]  -4 -10
```

One more pass, `haar_step(level2$avg)`, would land on 17, the mean of the whole `toy2` vector, with a single final detail of -1, the same pattern seen with the earlier toy vector's own mean of 6.75.

=== step === concept
## References

- [Haar, A. (1910), "Zur Theorie der orthogonalen Funktionensysteme," Mathematische Annalen, 69(3)](https://doi.org/10.1007/BF01456804). The original paper defining the Haar system, the simplest wavelet.
- Percival, D.B. and Walden, A.T. (2000), Wavelet Methods for Time Series Analysis, Cambridge University Press. The standard reference for the pyramid algorithm and multiresolution decomposition used in this lesson.
- [Bunn, A.G. (2008), "A dendrochronology program library in R (dplR)," Dendrochronologia, 26(2)](https://doi.org/10.1016/j.dendro.2008.01.002). The dplR package paper, a real-world use of wavelet scalograms in tree-ring analysis.
- [Rösch, A. and Schmidbauer, H. (2018), WaveletComp: Computational Wavelet Analysis, CRAN package vignette](https://cran.r-project.org/package=WaveletComp). The continuous wavelet transform and scalogram significance testing.

=== step === complete
## Quick recap

You can now look at a signal whose cycle keeps changing and know exactly how to take it apart, scale by scale. To summarize:

- A periodogram computed once over a whole series blurs a frequency that changes partway through into a spread of ordinates, no single peak the way a fixed cycle would give, exactly what happened with Riverside Bearing Co.'s own vibration trace.
- The Haar wavelet does one simple thing to every neighboring pair: average them, and take half their difference. Repeating that averaging step on its own output builds a multiresolution decomposition, one coarser level after another, entirely out of base R arithmetic.
- Splitting each level's detail into a first half and a second half, and comparing their RMS energy, turns the decomposition into a scalogram: a picture of which cycle length is active early in a series and which is active late. Here, the energy slid from roughly an 8-sample cycle early on to roughly a 4-sample cycle late, matching what splitting the plain periodogram in half had already hinted at.
