---
title: "Additive and Nonparametric Models Lesson 4: Estimating a density without assuming one"
catalog_blurb: "How a kernel density estimate replaces a histogram's arbitrary bin choices."
description: "Build a kernel density estimate by hand from a histogram's two arbitrary choices, sweep its one real choice, the bandwidth, and see where it leaks past zero."
keywords: "kernel density estimation, histogram bin width, bin origin, bandwidth selection, Gaussian kernel, Epanechnikov kernel, boundary bias, density(), bw.nrd0, R"
post_type: "LESSON"
curriculum_id: "4.100.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-additive"
course_title: "Additive and Nonparametric Models"
course_lesson: "4"
course_total: "6"
course_landing: "Additive-and-Nonparametric-Models-Course.html"
course_next: "Modeling-the-Median-and-the-Tails"
course_prev: "Choosing-How-Wiggly-Is-Too-Wiggly"
---

=== step === cover
## Estimating a density without assuming one

Today let's understand how to describe the shape of a set of numbers honestly, without carving them into bins first.

A support line logged how long each of 150 callers waited on hold before an agent answered, in minutes. Most of them got through in just a few minutes. A few waited much longer. And none of them waited a negative number of minutes, because that's impossible.

Here are all 150 hold times, drawn as a histogram with 1-minute bins.

::widget chart-plotter {"data":[{"x":2.2},{"x":9.5},{"x":1.3},{"x":6.2},{"x":3.8},{"x":2.9},{"x":9.8},{"x":0.8},{"x":4.1},{"x":7},{"x":1},{"x":2.9},{"x":4.6},{"x":2.8},{"x":3.1},{"x":5},{"x":1.4},{"x":2.1},{"x":3.3},{"x":1.9},{"x":3.4},{"x":1.1},{"x":1.1},{"x":4},{"x":3.8},{"x":6.2},{"x":3.5},{"x":1.8},{"x":1},{"x":3.1},{"x":5.1},{"x":0.6},{"x":4.4},{"x":2.2},{"x":3.2},{"x":1.2},{"x":2},{"x":8.2},{"x":3.4},{"x":7.8},{"x":2.4},{"x":7.9},{"x":0.1},{"x":2.4},{"x":2},{"x":2},{"x":1.7},{"x":3.3},{"x":10.1},{"x":6.8},{"x":7.4},{"x":4.4},{"x":3},{"x":6.9},{"x":14.1},{"x":1.1},{"x":0.8},{"x":4.2},{"x":4.6},{"x":4.3},{"x":10.3},{"x":1.7},{"x":1.7},{"x":2.6},{"x":4.8},{"x":1.9},{"x":2.2},{"x":4.6},{"x":3.2},{"x":3.1},{"x":4.5},{"x":0.8},{"x":6},{"x":5},{"x":11.5},{"x":0.7},{"x":5.4},{"x":1.1},{"x":2.7},{"x":5.6},{"x":3},{"x":0.7},{"x":1.6},{"x":2.7},{"x":2.5},{"x":3.1},{"x":2.8},{"x":3.7},{"x":5.9},{"x":2.2},{"x":5.2},{"x":0.4},{"x":3.4},{"x":2.5},{"x":7.5},{"x":1.1},{"x":0.9},{"x":8.9},{"x":6.1},{"x":1.1},{"x":7.2},{"x":2.5},{"x":7.7},{"x":1.3},{"x":2.4},{"x":5.1},{"x":4.7},{"x":0.3},{"x":3.9},{"x":7.5},{"x":7.8},{"x":3.9},{"x":2},{"x":2.1},{"x":3.9},{"x":1.5},{"x":0.2},{"x":1},{"x":5.9},{"x":3.4},{"x":0.8},{"x":7.4},{"x":4.3},{"x":5.1},{"x":3.9},{"x":5.8},{"x":2},{"x":2.9},{"x":2.1},{"x":7.1},{"x":2.1},{"x":5.3},{"x":5.2},{"x":5},{"x":0.9},{"x":1.2},{"x":5.4},{"x":1.8},{"x":3.4},{"x":3},{"x":1.7},{"x":0.9},{"x":0.4},{"x":8.2},{"x":3.7},{"x":4.4},{"x":3.8},{"x":3},{"x":1.1},{"x":0.6}],"geoms":["histogram"],"x":"hold_time_minutes","y":"count","code":{"histogram":"ggplot(df, aes(hold_time_minutes)) +\n  geom_histogram(binwidth = 1)"}}

Press Run, then change that 1 to a 2 or a 4 inside the code, and watch the same 150 numbers take on a different shape each time.

=== step === concept
## A histogram's shape depends on choices, not just the data

Let's build these hold times for real, then look at them through three different bin widths at once.

```r
# Build the 150 hold times, then compare histograms at three bin widths, plus one shifted origin
set.seed(104)
hold_times <- round(rgamma(150, shape = 2, rate = 0.5), 1)

par(mfrow = c(2, 2))
hist(hold_times, breaks = seq(0, 16, by = 1), main = "1-minute bins", xlab = "minutes")
hist(hold_times, breaks = seq(0, 16, by = 2), main = "2-minute bins", xlab = "minutes")
hist(hold_times, breaks = seq(0, 16, by = 4), main = "4-minute bins", xlab = "minutes")
hist(hold_times, breaks = seq(-1, 16, by = 2), main = "2-minute bins, shifted by 1", xlab = "minutes")
```

`rgamma(150, shape = 2, rate = 0.5)` draws from a gamma distribution, one shape commonly used to generate waiting times that pile up near small values and thin out slowly toward large ones. You don't need to know anything about the gamma family to follow this lesson. It's only here to produce 150 realistic hold times, and every method from here on works on the 150 numbers themselves, never on the formula that made them.

Look at the top two panels first, 1-minute bins against 2-minute bins. The 1-minute view has a dip around 6 to 7 minutes, then rises again near 8 minutes, a small second bump in the bars. Widen the bins to 2 minutes and that bump disappears, smoothed into one steady decline from the tallest bar down to almost nothing. Nothing about the 150 hold times changed between those two panels. Only the width of the box each bar represents did.

Widen the bins again, to 4 minutes, in the panel on the bottom left, and that decline flattens further still, down to little more than two tall bars and a thin tail. Same 150 numbers, a third shape.

Now compare the two panels on the right, top and bottom. Both use 2-minute bins, so every bar is the same width in each. But the top one starts its grid at 0, so its tallest bar covers 2 to 4 minutes. The bottom one starts its grid at -1, shifting every bin by 1 minute, and now the tallest bar covers 1 to 3 minutes instead. The width never changed. Only where the grid started did.

A histogram needs you to pick both of these before it can be drawn: how wide each bin is, and where the first one starts. Neither choice comes from the data. Change either one and the same 150 hold times can look like a different distribution.

=== step === concept
## A density estimate: a curve instead of a bar chart
::prose-only the kernel density estimate is introduced here in words only; the next two steps ground it immediately in one real bump, then the full formula, both computed on the hold times

A histogram answers the bin-width problem by picking one width and living with it. A density estimate sidesteps the problem instead, by never using bins at all.

A density is a curve. At every possible value of x, it gives a height, and that height says how relatively likely values near x are. The curve never dips below zero, and the total area underneath it always adds up to 1, the same rule a histogram's bars would follow if you scaled their heights to match.

The standard way to build that curve directly from data, without binning it first, is called a kernel density estimate, or KDE. It needs no bin width and no bin origin. What it needs instead, and how it's actually built, is the next two steps.

=== step === concept
## One bump for one data point: the kernel

A kernel density estimate is built out of one simple piece, repeated once per data point. That piece is called a kernel, and it's just a small, smooth bump of weight centered on a single observation.

Take the very first hold time in the vector, 2.2 minutes. Center a bump on it using R's normal density function, `dnorm()`, which is one common choice of kernel shape.

```r
# Center one Gaussian bump on a single real hold time
x0 <- hold_times[1]
grid <- seq(x0 - 4, x0 + 4, by = 0.05)
bump <- dnorm(grid, mean = x0, sd = 1)

library(ggplot2)
ggplot(data.frame(grid, bump), aes(grid, bump)) +
  geom_line(color = "firebrick", linewidth = 1) +
  geom_vline(xintercept = x0, linetype = "dashed")
```

The dashed line marks `x0`, 2.2 minutes, the one hold time the bump is centered on. The curve peaks right there and falls away smoothly on both sides, taller the closer x sits to 2.2 and shorter the further away it gets.

This bump is a density in its own right. Check its two defining properties directly: its peak height, and the area underneath it.

```r
# Check the bump's peak height and its total area
round(dnorm(0, mean = 0, sd = 1), 4)
#> [1] 0.3989
round(sum(bump) * 0.05, 4)
#> [1] 0.9999
```

The peak height, 0.3989, is `dnorm()` at its own center, the tallest the bump ever gets. Summing the bump's height across the grid and multiplying by the grid's spacing, 0.05 minutes, adds up its area in small rectangles: 0.9999, close enough to 1 that the small gap is just those rectangles not quite matching the curve's tails.

One bump, one observation, area 1. The next step does that 150 times, once per hold time, and averages the result.

=== step === concept
## The kernel density estimate: adding up one bump per observation

A kernel density estimate places one bump like that on every single hold time, then averages all 150 of them into one curve. Written as a formula, with K standing for the kernel and h for a width setting called the bandwidth:

\[ \hat{f}(x) = \frac{1}{nh} \sum_{i=1}^{n} K\left(\frac{x - x_i}{h}\right) \]

n is the sample size, 150 here. Each term K((x - x_i) / h) is one bump, shifted so it's centered on one observation x_i and scaled by h instead of staying fixed at a width of 1 the way the last step's bump was. Dividing the whole sum by n averages over the 150 bumps, and dividing by h on top of that keeps the total area under the curve at 1 no matter how wide or narrow h is.

R itself has to pick a value for h when you call `density()` without setting one. See what it picks for these hold times.

```r
# Compute the default bandwidth R itself would pick for these hold times
h <- bw.nrd0(hold_times)
round(h, 2)
#> [1] 0.81
```

About 0.81 minutes. Now build the formula by hand on the hold times, using that same h, and compare it to R's own `density()` function, which computes the identical thing.

```r
# Build the KDE by hand: average one kernel bump per observation, then compare to density()
x_grid <- seq(-3, 15, by = 0.1)

kde_by_hand <- function(x) mean(dnorm((x - hold_times) / h) / h)
f_hand <- sapply(x_grid, kde_by_hand)
f_density <- density(hold_times, bw = h, n = length(x_grid), from = min(x_grid), to = max(x_grid))$y

keep <- x_grid %in% c(0, 2, 4, 6, 8)
data.frame(x = x_grid[keep], hand = round(f_hand[keep], 3), density_fn = round(f_density[keep], 3))
#>   x  hand density_fn
#> 1 0 0.062      0.062
#> 2 2 0.170      0.170
#> 3 4 0.135      0.135
#> 4 6 0.067      0.067
#> 5 8 0.041      0.041
```

Hand-built from the formula, or returned by R's own `density()` function, the two match at every x checked. There's no hidden step inside `density()`: it's doing exactly the sum this formula describes, just faster.

=== step === widget
## Sweeping the bandwidth: the choice that decides the shape

The formula has three moving parts: the kernel K, the bandwidth h, and the sample size n. Only one of them actually controls how smooth or how spiky the fitted curve turns out. Feel that one out first on a generic example, then confirm it on the hold times themselves.

The widget below fits a different curve than the hold times, its own built-in 60-point example, using a slider labelled basis size k instead of a bandwidth. A larger k here plays the same role as a smaller bandwidth: both let the fit bend more freely around each point. So sliding the widget's k up toward 30 is the same move, in spirit, as sweeping a bandwidth down toward 0. It's shown here only to feel the underfit-to-overfit range that move covers, not to draw a density.

::widget spline-smoother {}

Drag the slider down toward 2, a small k, the same spirit as a large bandwidth. The curve goes nearly straight, missing the real bend in the points entirely. Drag it up toward 30, a large k, the same spirit as a small bandwidth, and the curve chases every point individually, bending in places the real curve never does.

A kernel density estimate's bandwidth drives that exact same trade-off directly, on a real density curve instead of this generic example. Sweep it on the hold times themselves.

```r
# Sweep the bandwidth directly on the real hold times: three settings, same data
library(ggplot2)
h_default <- round(bw.nrd0(hold_times), 2)

d_small <- density(hold_times, bw = 0.3)
d_mid   <- density(hold_times, bw = bw.nrd0(hold_times))
d_big   <- density(hold_times, bw = 4)

ggplot() +
  geom_line(aes(d_small$x, d_small$y, color = "h = 0.3")) +
  geom_line(aes(d_mid$x, d_mid$y, color = paste0("h = ", h_default))) +
  geom_line(aes(d_big$x, d_big$y, color = "h = 4")) +
  labs(x = "minutes", y = "density", color = "bandwidth")
```

At h = 0.3, the curve is a mess of individual spikes, roughly one for every lone hold time: undersmoothed, tracking noise instead of shape. At h = 4, it's a single smooth hump with no trace of the real shape left in it: oversmoothed, erasing structure that was really there. At the default bandwidth, about 0.81 minutes, it threads a path between those two extremes.

Now hold the bandwidth fixed and swap only the kernel's own shape.

```r
# Compare two kernel shapes at the SAME bandwidth
d_gauss <- density(hold_times, bw = bw.nrd0(hold_times), kernel = "gaussian")
d_epan  <- density(hold_times, bw = bw.nrd0(hold_times), kernel = "epanechnikov")

round(max(abs(d_gauss$y - d_epan$y)), 4)
#> [1] 0.0068
```

Swapping the kernel's shape, gaussian's smooth bell for epanechnikov's bounded dome, at that same bandwidth, moves the fitted curve by at most 0.0068 in density anywhere on the grid. That's barely a dent. Of the formula's three moving parts, only the bandwidth, not the kernel, decides whether the fitted curve tracks noise or erases the real shape.

=== step === quiz
## Quick check: what the bandwidth controls

You just swept the bandwidth across a wide range and watched the curve go from spiky to flat, then swapped the kernel at one fixed bandwidth and watched almost nothing move. Which part of a kernel density estimate's formula is actually setting how smooth or how spiky the fitted curve turns out?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The kernel K, since swapping its shape is what changed the fitted curve the most. ::no
- The bandwidth h, since a small h tracks every bump in the data and a large h washes the real shape away, while swapping the kernel at a fixed h barely moved the curve. ::ok Right. The sweep moved the curve from spiky to flat using nothing but h. Swapping the kernel at a fixed h barely moved it at all, by at most 0.0068 in density, so h is the choice doing the real work.
- The sample size n, since more hold times would make any kernel density estimate smoother on its own. ::no
- All three matter equally, since the formula divides by n times h and multiplies by K. ::no Appearing in a formula is not the same as controlling its shape. The sweep changed only h and the curve went from spiky to flat. Swapping K at a fixed h barely moved it. n stayed fixed at 150 throughout and was never the lever being pulled.

=== step === widget
## The boundary problem: when the estimate leaks below zero

Every hold time in this lesson is 0 minutes or more. Nobody waits a negative amount of time on hold. Check what a kernel density estimate does with that fact, using its default bandwidth on the real 150 hold times.

::widget chart-plotter {"data":[{"x":2.2},{"x":9.5},{"x":1.3},{"x":6.2},{"x":3.8},{"x":2.9},{"x":9.8},{"x":0.8},{"x":4.1},{"x":7},{"x":1},{"x":2.9},{"x":4.6},{"x":2.8},{"x":3.1},{"x":5},{"x":1.4},{"x":2.1},{"x":3.3},{"x":1.9},{"x":3.4},{"x":1.1},{"x":1.1},{"x":4},{"x":3.8},{"x":6.2},{"x":3.5},{"x":1.8},{"x":1},{"x":3.1},{"x":5.1},{"x":0.6},{"x":4.4},{"x":2.2},{"x":3.2},{"x":1.2},{"x":2},{"x":8.2},{"x":3.4},{"x":7.8},{"x":2.4},{"x":7.9},{"x":0.1},{"x":2.4},{"x":2},{"x":2},{"x":1.7},{"x":3.3},{"x":10.1},{"x":6.8},{"x":7.4},{"x":4.4},{"x":3},{"x":6.9},{"x":14.1},{"x":1.1},{"x":0.8},{"x":4.2},{"x":4.6},{"x":4.3},{"x":10.3},{"x":1.7},{"x":1.7},{"x":2.6},{"x":4.8},{"x":1.9},{"x":2.2},{"x":4.6},{"x":3.2},{"x":3.1},{"x":4.5},{"x":0.8},{"x":6},{"x":5},{"x":11.5},{"x":0.7},{"x":5.4},{"x":1.1},{"x":2.7},{"x":5.6},{"x":3},{"x":0.7},{"x":1.6},{"x":2.7},{"x":2.5},{"x":3.1},{"x":2.8},{"x":3.7},{"x":5.9},{"x":2.2},{"x":5.2},{"x":0.4},{"x":3.4},{"x":2.5},{"x":7.5},{"x":1.1},{"x":0.9},{"x":8.9},{"x":6.1},{"x":1.1},{"x":7.2},{"x":2.5},{"x":7.7},{"x":1.3},{"x":2.4},{"x":5.1},{"x":4.7},{"x":0.3},{"x":3.9},{"x":7.5},{"x":7.8},{"x":3.9},{"x":2},{"x":2.1},{"x":3.9},{"x":1.5},{"x":0.2},{"x":1},{"x":5.9},{"x":3.4},{"x":0.8},{"x":7.4},{"x":4.3},{"x":5.1},{"x":3.9},{"x":5.8},{"x":2},{"x":2.9},{"x":2.1},{"x":7.1},{"x":2.1},{"x":5.3},{"x":5.2},{"x":5},{"x":0.9},{"x":1.2},{"x":5.4},{"x":1.8},{"x":3.4},{"x":3},{"x":1.7},{"x":0.9},{"x":0.4},{"x":8.2},{"x":3.7},{"x":4.4},{"x":3.8},{"x":3},{"x":1.1},{"x":0.6}],"geoms":["histogram"],"x":"hold_time_minutes","y":"count","code":{"histogram":"ggplot(df, aes(hold_time_minutes)) +\n  geom_histogram(aes(y = after_stat(density)), binwidth = 1) +\n  geom_density(color = \"firebrick\", linewidth = 1) +\n  geom_vline(xintercept = 0, linetype = \"dashed\")"}}

The dashed line marks zero minutes. To its left is impossible: no caller waited a negative number of minutes. But the red curve, R's default kernel density estimate on these hold times, is clearly positive out there anyway.

Here's why. Every single bump in the sum is a full, two-sided Gaussian curve, even the bumps centered on hold times sitting right near zero. Each one of those spreads some of its weight to the left of its own center, into negative territory, because a Gaussian bump has no idea the real quantity it's approximating cannot go below zero. Add up 150 of them, and some of that leaked weight survives into the final curve.

This is called the boundary problem. It shows up whenever the true quantity has a hard edge, a count that cannot go below 0, a proportion that cannot exceed 1, a wait that cannot be negative, but the kernel placed at each point does not know that edge exists.

=== step === quiz
## Quick check: histograms, kernels and the choices behind them

Picture two histograms of these same 150 hold times. Both use 2-minute bins, so every bar in each one is exactly 2 minutes wide. But in the first, the tallest bar covers 2 to 4 minutes. In the second, the tallest bar covers 1 to 3 minutes instead. Which single choice explains that difference?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Bin origin, the point a histogram's grid of bins starts counting from. ::ok Right. Both histograms used the same 2-minute width. Only where the grid started moved, from 0 to a point 1 minute earlier, and that alone pulled the tallest bar from the 2-to-4 window into the 1-to-3 window.
- Bandwidth h, the width setting inside a kernel density estimate's formula. ::no
- Kernel K, the shape of bump a kernel density estimate places on each observation. ::no
- Sample size n, the number of hold times the histogram was built from. ::no Bandwidth and kernel belong to a kernel density estimate, not a histogram, and neither one was even in play here. The sample size never changed either. What moved was the histogram's own bin origin, the point its grid starts counting bins from, which is exactly what shifted the tallest bar from one window to another.

=== step === tryit
## Your turn: how much of the estimate falls below zero

The boundary leak from two steps back can be measured directly: what share of a kernel density estimate's total area sits on the impossible side of zero? Try it at a narrow bandwidth first.

```r
# The share of the estimate's area that falls below zero, at a narrow bandwidth
h <- 0.5
d <- density(hold_times, bw = h, n = 1024)
dx <- diff(d$x)[1]
area_below_zero <- sum(d$y[d$x < 0]) * dx
total_area <- sum(d$y) * dx
round(area_below_zero / total_area, 4)
#> [1] 0.0161
```

At h = 0.5, about 1.6% of the curve's area sits below zero. Narrow bumps centered near zero barely reach across the boundary.

Now widen the bandwidth and run the same computation. Replace the blank below with 3, then press Run.

```r
# See what happens to that same share at a much wider bandwidth
h <- ____
d <- density(hold_times, bw = h, n = 1024)
dx <- diff(d$x)[1]
area_below_zero <- sum(d$y[d$x < 0]) * dx
total_area <- sum(d$y) * dx
round(area_below_zero / total_area, 4)
```
::check {"regex":"h\\s*<-\\s*[2-5]\\b","gate":true,"difficulty":"intermediate","ok":"Right: at h = 3 about 17% of the area sits below zero, more than ten times the share at h = 0.5. A wider bandwidth spreads every bump further, so more of its weight crosses the boundary.","no":"Replace the blank with 3: h <- 3. A bigger bandwidth spreads each bump wider, pushing more of its weight across zero."}
::solution
```r
# Compute the same share at h = 3
h <- 3
d <- density(hold_times, bw = h, n = 1024)
dx <- diff(d$x)[1]
area_below_zero <- sum(d$y[d$x < 0]) * dx
total_area <- sum(d$y) * dx
round(area_below_zero / total_area, 4)
#> [1] 0.1721
```

=== step === concept
## References

- [Density Estimation for Statistics and Data Analysis](https://www.routledge.com/Density-Estimation-for-Statistics-and-Data-Analysis-1st-Edition/Silverman-Cox-Reid-Isham-Tibshirani-Louis-Tong-Keiding/p/book/9780412246203) - Silverman, B.W. (1986), Chapman and Hall. The standard reference for kernel density estimation and how to choose a bandwidth.
- [Kernel Smoothing](https://www.routledge.com/Kernel-Smoothing/Wand-Jones/p/book/9780412552700) - Wand, M.P. and Jones, M.C. (1995), Chapman and Hall. A fuller treatment of kernel choice, bandwidth selection, and the boundary bias shown in this lesson.
- Scott, D.W. (2015). Multivariate Density Estimation: Theory, Practice, and Visualization (2nd ed.). Wiley. Histogram bin choice and smoothing, covered more broadly than this one lesson's example.
- [Simple boundary correction for kernel density estimation](https://doi.org/10.1007/BF00147776) - Jones, M.C. (1993), Statistics and Computing, 3(3), 135-146. A correction for exactly the boundary leak shown in this lesson.
- [density: Kernel Density Estimation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/density.html) - R Core Team, the documentation for density(), including the kernel and bandwidth arguments used throughout this lesson, and the default bw.nrd0 rule it falls back on.

=== step === complete
## What a density estimate replaces, and what choice remains

A histogram asked you to pick two things before it could be drawn: how wide each bin is, and where its grid starts. Neither one came from the 150 hold times themselves, and changing either one changed the apparent shape.

A kernel density estimate replaces both choices with one formula: average one kernel bump per observation, scaled by a bandwidth h. There is no bin width left to pick, and no bin origin either.

One choice survives, though. The bandwidth still has to be set, and it still decides everything about how the fitted curve looks: a small h tracks every bump in the data, a large h erases the real shape, and swapping the kernel's shape at a fixed h barely moves the curve at all. That is why this lesson gave the bandwidth, and not the kernel, the careful look.

And the hold times carried one more lesson of their own. Bounded at zero, they showed that even the right bandwidth cannot stop a kernel density estimate from leaking a little probability past a boundary the data itself can never cross.

The next lesson in this course turns from the shape of one variable to how its tenth, fiftieth and ninetieth percentiles each move with a predictor, estimated directly instead of assumed.
