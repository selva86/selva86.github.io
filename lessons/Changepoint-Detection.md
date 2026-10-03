---
title: "Intervention, Causal Impact, and Anomaly Detection Lesson 3: Finding changepoints when the date is unknown"
catalog_blurb: "Find exactly when a series changed, even without a known date."
description: "Compare binary segmentation and PELT for finding changepoints, fix the default penalty's biggest trap, and tell a change in mean from a change in variance."
keywords: "changepoint detection, changepoint package R, cpt.mean, cpt.var, cpt.meanvar, binary segmentation, PELT algorithm, MBIC penalty, BIC, AIC, structural break, time series"
post_type: "LESSON"
curriculum_id: "5.140.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-intervention"
course_title: "Intervention, Causal Impact, and Anomaly Detection"
course_lesson: "3"
course_total: "5"
course_landing: "Intervention-Causal-Impact-and-Anomaly-Detection-Course.html"
course_next: "Anomaly-and-Outlier-Detection.html"
course_prev: "Causal-Impact-of-an-Event.html"
---

=== step === cover
## Finding changepoints when the date is unknown

Today let's work out exactly when a series changed, without anyone telling us the date first.

Line 4 of a juice-bottling plant fills 500 ml bottles, and its target fill weight is 500 ml. Every production day, one bottle is sampled and weighed. Here are 150 days of those readings.

::widget chart-plotter {"data":[{"x":1,"y":498.96},{"x":2,"y":501.88},{"x":3,"y":501.93},{"x":4,"y":499.06},{"x":5,"y":503.17},{"x":6,"y":500.96},{"x":7,"y":499.82},{"x":8,"y":504.34},{"x":9,"y":501.75},{"x":10,"y":498.37},{"x":11,"y":502.79},{"x":12,"y":499.2},{"x":13,"y":501.68},{"x":14,"y":499.48},{"x":15,"y":499.52},{"x":16,"y":499.25},{"x":17,"y":503.57},{"x":18,"y":495.07},{"x":19,"y":496.39},{"x":20,"y":498.39},{"x":21,"y":498.35},{"x":22,"y":499.56},{"x":23,"y":498.44},{"x":24,"y":495.31},{"x":25,"y":502.57},{"x":26,"y":497.99},{"x":27,"y":496.45},{"x":28,"y":502.42},{"x":29,"y":496.14},{"x":30,"y":499.13},{"x":31,"y":503.91},{"x":32,"y":496.86},{"x":33,"y":498.11},{"x":34,"y":499.57},{"x":35,"y":501.78},{"x":36,"y":499.79},{"x":37,"y":498.13},{"x":38,"y":501.04},{"x":39,"y":503.34},{"x":40,"y":497.57},{"x":41,"y":498.85},{"x":42,"y":503.47},{"x":43,"y":496.94},{"x":44,"y":502.94},{"x":45,"y":500.43},{"x":46,"y":497.17},{"x":47,"y":497.19},{"x":48,"y":502.71},{"x":49,"y":501.11},{"x":50,"y":500.94},{"x":51,"y":503.25},{"x":52,"y":500.62},{"x":53,"y":498.34},{"x":54,"y":501.07},{"x":55,"y":504.9},{"x":56,"y":500.06},{"x":57,"y":502.27},{"x":58,"y":495.92},{"x":59,"y":498.17},{"x":60,"y":499.36},{"x":61,"y":497.96},{"x":62,"y":500.2},{"x":63,"y":497.27},{"x":64,"y":500.9},{"x":65,"y":497.79},{"x":66,"y":504.81},{"x":67,"y":500.51},{"x":68,"y":504.48},{"x":69,"y":499.26},{"x":70,"y":503.32},{"x":71,"y":502.43},{"x":72,"y":499.22},{"x":73,"y":499.22},{"x":74,"y":502.96},{"x":75,"y":500.32},{"x":76,"y":500.64},{"x":77,"y":497.43},{"x":78,"y":498.6},{"x":79,"y":504.66},{"x":80,"y":500.55},{"x":81,"y":500.3},{"x":82,"y":506.12},{"x":83,"y":503.69},{"x":84,"y":504.2},{"x":85,"y":492.72},{"x":86,"y":497.78},{"x":87,"y":502.23},{"x":88,"y":497.43},{"x":89,"y":498.86},{"x":90,"y":502.49},{"x":91,"y":503.81},{"x":92,"y":495.39},{"x":93,"y":498.15},{"x":94,"y":499.35},{"x":95,"y":500.76},{"x":96,"y":494.05},{"x":97,"y":496.82},{"x":98,"y":490.44},{"x":99,"y":501.2},{"x":100,"y":493.97},{"x":101,"y":494.9},{"x":102,"y":490.49},{"x":103,"y":496.42},{"x":104,"y":498.25},{"x":105,"y":492.21},{"x":106,"y":497.43},{"x":107,"y":496.26},{"x":108,"y":495.99},{"x":109,"y":492.42},{"x":110,"y":494.13},{"x":111,"y":499.51},{"x":112,"y":495.77},{"x":113,"y":494.26},{"x":114,"y":494.07},{"x":115,"y":495.68},{"x":116,"y":490.44},{"x":117,"y":497.35},{"x":118,"y":499.7},{"x":119,"y":496.58},{"x":120,"y":493.49},{"x":121,"y":488.46},{"x":122,"y":496.55},{"x":123,"y":491.07},{"x":124,"y":495},{"x":125,"y":492.89},{"x":126,"y":496.73},{"x":127,"y":493.98},{"x":128,"y":491.08},{"x":129,"y":499.63},{"x":130,"y":492},{"x":131,"y":487.62},{"x":132,"y":494.49},{"x":133,"y":493.36},{"x":134,"y":492.21},{"x":135,"y":498.94},{"x":136,"y":494.22},{"x":137,"y":494.83},{"x":138,"y":496.97},{"x":139,"y":492.99},{"x":140,"y":489.15},{"x":141,"y":492.41},{"x":142,"y":491.6},{"x":143,"y":494.47},{"x":144,"y":493.38},{"x":145,"y":499.44},{"x":146,"y":491.43},{"x":147,"y":492.91},{"x":148,"y":490.6},{"x":149,"y":495.57},{"x":150,"y":492.95}],"geoms":["line"],"x":"day","y":"fill_ml","code":{"line":"ggplot(fill_df, aes(day, fill_ml)) +\n  geom_line()"}}

Somewhere past the two-thirds mark of the chart, the line visibly settles lower than where it started. Nobody flagged a change on any particular day. There was no maintenance log entry, no alert, nothing to say "this is where it happened".

That is the problem this lesson solves: finding the day a series changed, when the only evidence is the series itself.

=== step === concept
## What a changepoint is, and the two kinds of change behind it

A **changepoint** is the last observation of a segment before a series' statistics move to a new, constant value. A **segment** is just a stretch of the series where those statistics, its mean or its spread, stay constant. Before the changepoint you have one segment; after it, a new one begins.

A segment's statistics can differ from the next segment's in two distinct ways. Its **mean** can shift, so the series settles at a new average level. Or its **variance** can shift, so the series keeps the same average but gets noisier or quieter around it. A real change can involve either one, or both at once.

Since this data was simulated, we actually know where the true change sits: day 95. In practice you never get told that. But seeing it once, with the real numbers on each side, is what makes every method in this lesson easy to judge afterwards.

```r
# Simulate 150 days of fill-weight readings for Line 4, with a true but hidden change at day 95
set.seed(104)
fill_ml <- c(rnorm(95, 500, 3), rnorm(55, 494, 3))
day <- 1:150

round(mean(fill_ml[1:95]), 2)
#> [1] 500.14
round(sd(fill_ml[1:95]), 2)
#> [1] 2.65
round(mean(fill_ml[96:150]), 2)
#> [1] 494.34
round(sd(fill_ml[96:150]), 2)
#> [1] 3.02
```

Days 1 to 95 average 500.14 ml with a standard deviation of 2.65. Days 96 to 150 average 494.34 ml with a standard deviation of 3.02. The mean dropped by almost 6 ml. The spread barely moved, so whatever happened here, it looks like a change in mean, not in variance.

From here on, pretend you do not know day 95. Every method in this lesson has to find it on its own.

=== step === concept
## Binary segmentation and PELT: two ways to search for the split

The `changepoint` package gives you two ways to search for where a series splits into segments: **binary segmentation** and **PELT**.

Binary segmentation works the way you might naturally attack the problem by hand. It finds the single best place to split the whole series in two, the point that most improves the fit if you treat the data on each side as its own segment. It checks whether that split is worth it against a penalty, and if it is, it keeps the split and repeats the exact same search separately inside each new half. It stops once a half has no split left that clears the penalty.

**PELT** stands for Pruned Exact Linear Time. It takes a different approach entirely. It scores every possible way of segmenting the whole series directly, using dynamic programming, but it prunes out candidate starting points that could never end up part of the best segmentation. That pruning is what keeps the whole search running in time proportional to the length of the series, instead of exploding as you add more candidate changepoints. Because it never commits to one split before deciding whether to look elsewhere, PELT finds the exact best segmentation for a given penalty. Binary segmentation, by contrast, is an approximate, greedy search: it can lock in an early split that blocks it from ever finding a better one later. PELT has been the package's default search method since version 2.3; before that, the default was AMOC, which only ever looks for a single changepoint.

On a series, the `cpt.mean()` function assumes the data's spread is already standardized to a standard deviation of 1. So before running it, divide the series by a robust estimate of its own spread: the median absolute deviation of its successive differences, divided by the square root of 2. `mad()` is a robust alternative to `sd()`: it is far less swayed by a handful of extreme values. Taking it on the differences between consecutive days, rather than on the raw series, matters here because the change in level itself would otherwise inflate a plain `sd(fill_ml)`. And dividing by the square root of 2 corrects for a basic fact about differences: subtracting one independent noisy value from another doubles the variance, so its spread comes out √2 times too large unless you scale it back down.

```r
# Load the changepoint package, then standardize the fill series by a robust spread estimate
library(changepoint)

robust_sd <- mad(diff(fill_ml)) / sqrt(2)
round(robust_sd, 2)
#> [1] 3.14

fill_std <- fill_ml / robust_sd

bs_fit <- cpt.mean(fill_std, method = "BinSeg", Q = 5)
cpts(bs_fit)
#> [1] 95

pelt_fit <- cpt.mean(fill_std, method = "PELT")
cpts(pelt_fit)
#> [1] 95
```

The robust spread estimate comes out to 3.14, close to the 3 ml noise level the data was actually simulated with. Once the series is divided by it, both methods land on exactly the same answer: day 95. (The `Q = 5` argument on `cpt.mean()` caps how many changepoints binary segmentation is allowed to search for; 5 happens to be the function's own default, so this just makes that ceiling explicit.) When there is one clean, large change to find, binary segmentation and PELT usually agree.

=== step === concept
## Where binary segmentation misses what PELT catches

Build a series designed to trip up the single whole-series split that binary segmentation relies on: 120 points where the first 60 sit around a mean of 0, the next 5 jump up to a mean of 6, and the last 55 drop straight back to a mean of 0. The noise level is a standard deviation of 1 throughout.

```r
# Build a 120-point series with a brief 5-point bump and compare both methods
set.seed(9)
blip <- c(rnorm(60, 0, 1), rnorm(5, 6, 1), rnorm(55, 0, 1))

cpts(cpt.mean(blip, method = "PELT"))
#> [1] 60 65
cpts(cpt.mean(blip, method = "BinSeg"))
#> numeric(0)
```

PELT finds both edges of the bump, 60 and 65, exactly where it starts and ends. Binary segmentation finds nothing at all: `numeric(0)` means an empty result, not even one changepoint.

Here is why. Binary segmentation's first move is to ask: what is the single best place to split this entire 120-point series in two? The bump is only 5 points wide, so wherever you cut the series, most of the data on both sides of that cut still looks like plain noise around 0. The best whole-series split never clears the penalty, so binary segmentation's very first search comes back empty. And because it never earns that first split, it never gets to recurse inside and look for the bump on its own terms. PELT never relies on a single whole-series comparison like that. It scores every candidate segmentation directly, so a brief regime that would get buried in one big comparison still turns up when it is tested in its own right.

```r
# Plot the blip series with its true bump marked
library(ggplot2)

blip_df <- data.frame(t = 1:120, value = blip)
ggplot(blip_df, aes(t, value)) +
  geom_line() +
  geom_vline(xintercept = c(60, 65), linetype = "dashed")
```

One run only shows you one outcome, so repeat the same shape over 40 different seeds and count how often each method catches the bump.

```r
# Repeat the same shape over 40 seeds and count how often each method catches the bump
detect_pelt <- 0
detect_bs <- 0
for (s in 1001:1040) {
  set.seed(s)
  x <- c(rnorm(60, 0, 1), rnorm(5, 6, 1), rnorm(55, 0, 1))
  cp_pelt <- cpts(cpt.mean(x, method = "PELT"))
  cp_bs <- cpts(cpt.mean(x, method = "BinSeg"))
  detect_pelt <- detect_pelt + any(cp_pelt >= 58 & cp_pelt <= 67)
  detect_bs <- detect_bs + any(cp_bs >= 58 & cp_bs <= 67)
}
detect_pelt
#> [1] 40
detect_bs
#> [1] 5
```

PELT catches the bump in all 40 of 40 replicates. Binary segmentation catches it in only 5 of 40. That gap is not a quirk of one unlucky seed. It is the direct, repeated consequence of binary segmentation's first search being a single, whole-series comparison that a short regime can slip straight through.

=== step === quiz
## Quick check: binary segmentation or PELT?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- PELT, because it scores every candidate segmentation exactly and does not stop after one failed whole-series split. ::ok Right. A short regime can lose a single whole-series comparison and still be real, and PELT is the search that does not throw it away on that basis.
- Binary segmentation, because it is the older, more established method. ::no Being older is true but it is not a reason to trust it with a short regime; the 40-replicate result ran the other way.
- Binary segmentation, because it also checks every possible split, the same as PELT. ::no Binary segmentation does not check every split. It finds one best whole-series split, then recurses only inside the halves that split produced.
- Either method works, because they agreed on day 95 earlier in this lesson. ::no They agreed on the fill series because that change was large and sat inside one obvious segment. The bump here is short enough that binary segmentation's first search can miss it entirely, which is exactly what the 5-of-40 result showed.

=== step === concept
## The penalty: what it costs to call one more point a changepoint

Every extra changepoint a method reports has to buy its way past a cost, called the **penalty**. A bigger penalty means a candidate split has to improve the fit by more before it is allowed to count, so you get fewer, more conservative changepoints. A smaller penalty lets more splits through.

`cpt.mean()` offers several built-in penalty choices. The default is **MBIC** (a modified Bayes Information Criterion), and two others worth comparing are **BIC** and **AIC**. Run all three on the standardized fill series and read off both the actual penalty value each one uses and the changepoints it returns.

```r
# Compare the penalty value each criterion uses at n = 150, and what each returns
mbic_fit <- cpt.mean(fill_std, method = "PELT", penalty = "MBIC")
bic_fit  <- cpt.mean(fill_std, method = "PELT", penalty = "BIC")
aic_fit  <- cpt.mean(fill_std, method = "PELT", penalty = "AIC")

round(pen.value(mbic_fit), 2)
#> [1] 15.03
round(pen.value(bic_fit), 2)
#> [1] 10.02
round(pen.value(aic_fit), 2)
#> [1] 4

cpts(mbic_fit)
#> [1] 95
cpts(bic_fit)
#> [1] 95
cpts(aic_fit)
#> [1]  81  84  85  95 119
```

At 150 days, MBIC's penalty value is 15.03, BIC's is 10.02, and AIC's is 4. You might expect BIC to be the textbook log(n), which here would be 5.01, and AIC to be a flat 2. They come out higher than that because the `changepoint` package counts the proposed changepoint itself as one of the parameters a method has to justify, not just the segment means on either side of it.

MBIC and BIC both still return exactly day 95, the true change. AIC, with a penalty less than half of BIC's, returns 5 changepoints instead of 1: days 81, 84, 85, 95, and 119. AIC is letting ordinary day-to-day noise clear its much lower bar.

=== step === concept
## Why the default can get it badly wrong

`cpt.mean()`'s cost function has a hidden assumption: it assumes the data's variance is already 1. It does not estimate the variance at all, it just assumes it. That is exactly why standardizing the series by a robust spread estimate matters: it rescales the series so that assumption is actually true.

Watch what happens if you skip it and run `cpt.mean()` directly on the raw fill series, whose real noise level is a standard deviation of about 3, not 1.

```r
# Run cpt.mean on the RAW fill series, then on the series divided by the robust spread estimate
raw_fit <- cpt.mean(fill_ml)
length(cpts(raw_fit))
#> [1] 23
cpts(raw_fit)
#>  [1]  17  24  47  57  65  68  81  84  85  89  91  97  98  99 115 116 119 128 129
#> [20] 131 138 144 145

std_fit <- cpt.mean(fill_ml / robust_sd)
cpts(std_fit)
#> [1] 95
```

On the raw series, `cpt.mean()` reports 23 changepoints. That is not the method finding 23 real breaks. It is the cost function mistaking a spread of about 3 for a spread of 1, so ordinary noise keeps looking big enough to "justify" another changepoint. Divide the exact same series by the robust spread estimate first, and the method recovers the single true changepoint at day 95 exactly.

This is the single most important thing to remember about `cpt.mean()`: it is only honest on data whose spread is already close to 1. On anything else, standardize first.

=== step === concept
## cpt.meanvar: fitting the mean and the variance together

Standardizing by hand works, but there is a function that solves the same problem a different way: `cpt.meanvar()` fits both a mean and a variance for each segment directly, instead of assuming the variance is 1. Because it estimates the variance itself, it needs no manual standardizing at all.

```r
# Fit cpt.meanvar directly on the RAW fill series: no manual standardizing needed
mv_fit <- cpt.meanvar(fill_ml, method = "PELT")
cpts(mv_fit)
#> [1] 95
round(param.est(mv_fit)$mean, 2)
#> [1] 500.14 494.34
round(param.est(mv_fit)$variance, 2)
#> [1] 6.95 8.97
```

Run directly on the raw fill series, with no standardizing step at all, `cpt.meanvar()` returns day 95 straight away. `param.est()` also hands back the fitted mean and variance for each segment: means of 500.14 and 494.34, variances of 6.95 and 8.97.

Those two variances are close to each other. That closeness is itself useful evidence: it tells you the change you found is a change in level, not a change in spread.

=== step === widget
## A change in spread, not in level

Line 7 is a second bottling line at the same plant. Its fill weight stays close to the 500 ml target for the whole 150 days, so there is no change in mean to find. But its spread widens sharply after an unannounced regulator fault: a sample standard deviation of about 2.84 ml for days 1 to 80, climbing to about 9.90 ml for days 81 to 150.

`cpt.var()` is the counterpart to `cpt.mean()`: instead of searching for a change in mean, it searches for a change in variance.

```r
# Simulate Line 7: mean stays near 500 throughout, but the spread widens after day 80
set.seed(211)
line7_ml <- c(rnorm(80, 500, 3), rnorm(70, 500, 10))

round(sd(line7_ml[1:80]), 2)
#> [1] 2.84
round(sd(line7_ml[81:150]), 2)
#> [1] 9.9

var_fit <- cpt.var(line7_ml, method = "PELT")
cpts(var_fit)
#> [1] 79
round(param.est(var_fit)$variance, 2)
#> [1]  7.85 95.73
```

`cpt.var()` places the change at day 79, close to the true day 80, with fitted variances of 7.85 before it and 95.73 after. That is a roughly twelve-fold jump in variance.

Now see what `cpt.mean()`, the wrong tool for this job, does with the same raw series.

```r
# cpt.mean on raw Line7 badly overfits, and cpt.meanvar reads both mean and variance correctly
mean_fit <- cpt.mean(line7_ml)
length(cpts(mean_fit))
#> [1] 69

meanvar_fit <- cpt.meanvar(line7_ml, method = "PELT")
cpts(meanvar_fit)
#> [1] 80
round(param.est(meanvar_fit)$mean, 2)
#> [1] 500.38 499.10
round(param.est(meanvar_fit)$variance, 2)
#> [1]  7.97 96.68
```

`cpt.mean()` on the raw series reports 69 changepoints. It is still blind to the real signal here, the widening spread, and the variance-1 assumption from two steps back makes it even worse. `cpt.meanvar()`, fitting both statistics at once, places the change at day 80 with fitted means of 500.38 and 499.10, barely different, against fitted variances of 7.97 and 96.68, nearly twelve-fold apart. Reading the mean and the variance side by side like this is how you tell the two kinds of change apart: here the mean says nothing happened, and the variance says everything did.

The chart below shows Line 7 as a line, and switches to a boxplot grouped at day 80, close to where both `cpt.var()` and `cpt.meanvar()` placed the change.

::widget chart-plotter {"x":"day","y":"fill_ml","geoms":["line","boxplot"],"data":[{"x":1,"y":497.83,"fill":"Before"},{"x":2,"y":505.63,"fill":"Before"},{"x":3,"y":498.12,"fill":"Before"},{"x":4,"y":494.13,"fill":"Before"},{"x":5,"y":502.61,"fill":"Before"},{"x":6,"y":497.32,"fill":"Before"},{"x":7,"y":501.71,"fill":"Before"},{"x":8,"y":498.28,"fill":"Before"},{"x":9,"y":502.01,"fill":"Before"},{"x":10,"y":502.37,"fill":"Before"},{"x":11,"y":499.87,"fill":"Before"},{"x":12,"y":502.11,"fill":"Before"},{"x":13,"y":498.9,"fill":"Before"},{"x":14,"y":500.23,"fill":"Before"},{"x":15,"y":498.72,"fill":"Before"},{"x":16,"y":501.76,"fill":"Before"},{"x":17,"y":495.66,"fill":"Before"},{"x":18,"y":502.48,"fill":"Before"},{"x":19,"y":498.38,"fill":"Before"},{"x":20,"y":494.1,"fill":"Before"},{"x":21,"y":499.92,"fill":"Before"},{"x":22,"y":495.25,"fill":"Before"},{"x":23,"y":501.7,"fill":"Before"},{"x":24,"y":500.94,"fill":"Before"},{"x":25,"y":505.36,"fill":"Before"},{"x":26,"y":508.09,"fill":"Before"},{"x":27,"y":498.9,"fill":"Before"},{"x":28,"y":498.59,"fill":"Before"},{"x":29,"y":499.19,"fill":"Before"},{"x":30,"y":503.13,"fill":"Before"},{"x":31,"y":505.65,"fill":"Before"},{"x":32,"y":501.45,"fill":"Before"},{"x":33,"y":501.76,"fill":"Before"},{"x":34,"y":498.79,"fill":"Before"},{"x":35,"y":497.56,"fill":"Before"},{"x":36,"y":498.01,"fill":"Before"},{"x":37,"y":501.5,"fill":"Before"},{"x":38,"y":502.06,"fill":"Before"},{"x":39,"y":496.29,"fill":"Before"},{"x":40,"y":502.82,"fill":"Before"},{"x":41,"y":502.69,"fill":"Before"},{"x":42,"y":506.11,"fill":"Before"},{"x":43,"y":497.76,"fill":"Before"},{"x":44,"y":499.78,"fill":"Before"},{"x":45,"y":501.01,"fill":"Before"},{"x":46,"y":502.87,"fill":"Before"},{"x":47,"y":498.48,"fill":"Before"},{"x":48,"y":499.5,"fill":"Before"},{"x":49,"y":499.21,"fill":"Before"},{"x":50,"y":498.36,"fill":"Before"},{"x":51,"y":502.58,"fill":"Before"},{"x":52,"y":498.37,"fill":"Before"},{"x":53,"y":500.42,"fill":"Before"},{"x":54,"y":499.15,"fill":"Before"},{"x":55,"y":496.82,"fill":"Before"},{"x":56,"y":500.31,"fill":"Before"},{"x":57,"y":504.04,"fill":"Before"},{"x":58,"y":500.56,"fill":"Before"},{"x":59,"y":496.43,"fill":"Before"},{"x":60,"y":505.59,"fill":"Before"},{"x":61,"y":501.71,"fill":"Before"},{"x":62,"y":503.88,"fill":"Before"},{"x":63,"y":501.78,"fill":"Before"},{"x":64,"y":501.03,"fill":"Before"},{"x":65,"y":497.02,"fill":"Before"},{"x":66,"y":500.75,"fill":"Before"},{"x":67,"y":503.17,"fill":"Before"},{"x":68,"y":496.61,"fill":"Before"},{"x":69,"y":499.56,"fill":"Before"},{"x":70,"y":498.46,"fill":"Before"},{"x":71,"y":501.44,"fill":"Before"},{"x":72,"y":495.95,"fill":"Before"},{"x":73,"y":498.75,"fill":"Before"},{"x":74,"y":499.54,"fill":"Before"},{"x":75,"y":498.73,"fill":"Before"},{"x":76,"y":501.72,"fill":"Before"},{"x":77,"y":501.45,"fill":"Before"},{"x":78,"y":503.13,"fill":"Before"},{"x":79,"y":501.67,"fill":"Before"},{"x":80,"y":504.53,"fill":"Before"},{"x":81,"y":489.79,"fill":"After"},{"x":82,"y":493.68,"fill":"After"},{"x":83,"y":497,"fill":"After"},{"x":84,"y":508.66,"fill":"After"},{"x":85,"y":495.57,"fill":"After"},{"x":86,"y":511.08,"fill":"After"},{"x":87,"y":505.75,"fill":"After"},{"x":88,"y":503.85,"fill":"After"},{"x":89,"y":494.65,"fill":"After"},{"x":90,"y":507.47,"fill":"After"},{"x":91,"y":509.39,"fill":"After"},{"x":92,"y":501.43,"fill":"After"},{"x":93,"y":478.01,"fill":"After"},{"x":94,"y":523.74,"fill":"After"},{"x":95,"y":488.04,"fill":"After"},{"x":96,"y":478.88,"fill":"After"},{"x":97,"y":497.78,"fill":"After"},{"x":98,"y":510.39,"fill":"After"},{"x":99,"y":518.34,"fill":"After"},{"x":100,"y":510.31,"fill":"After"},{"x":101,"y":496.59,"fill":"After"},{"x":102,"y":487.37,"fill":"After"},{"x":103,"y":515.04,"fill":"After"},{"x":104,"y":487.95,"fill":"After"},{"x":105,"y":496.87,"fill":"After"},{"x":106,"y":500.07,"fill":"After"},{"x":107,"y":494.58,"fill":"After"},{"x":108,"y":496.42,"fill":"After"},{"x":109,"y":501.68,"fill":"After"},{"x":110,"y":507.25,"fill":"After"},{"x":111,"y":486.17,"fill":"After"},{"x":112,"y":494.68,"fill":"After"},{"x":113,"y":495.7,"fill":"After"},{"x":114,"y":506.06,"fill":"After"},{"x":115,"y":485.26,"fill":"After"},{"x":116,"y":500.75,"fill":"After"},{"x":117,"y":504.06,"fill":"After"},{"x":118,"y":495.97,"fill":"After"},{"x":119,"y":516.34,"fill":"After"},{"x":120,"y":496.01,"fill":"After"},{"x":121,"y":487.17,"fill":"After"},{"x":122,"y":497.86,"fill":"After"},{"x":123,"y":500.05,"fill":"After"},{"x":124,"y":505.91,"fill":"After"},{"x":125,"y":482.31,"fill":"After"},{"x":126,"y":495.41,"fill":"After"},{"x":127,"y":489.73,"fill":"After"},{"x":128,"y":499.11,"fill":"After"},{"x":129,"y":494.71,"fill":"After"},{"x":130,"y":506.86,"fill":"After"},{"x":131,"y":496.32,"fill":"After"},{"x":132,"y":489.57,"fill":"After"},{"x":133,"y":492.46,"fill":"After"},{"x":134,"y":495.16,"fill":"After"},{"x":135,"y":520.73,"fill":"After"},{"x":136,"y":489.65,"fill":"After"},{"x":137,"y":504.45,"fill":"After"},{"x":138,"y":496.82,"fill":"After"},{"x":139,"y":502.9,"fill":"After"},{"x":140,"y":511.62,"fill":"After"},{"x":141,"y":499.88,"fill":"After"},{"x":142,"y":503.41,"fill":"After"},{"x":143,"y":485.98,"fill":"After"},{"x":144,"y":512.45,"fill":"After"},{"x":145,"y":501.62,"fill":"After"},{"x":146,"y":485.38,"fill":"After"},{"x":147,"y":515.39,"fill":"After"},{"x":148,"y":488.83,"fill":"After"},{"x":149,"y":497.24,"fill":"After"},{"x":150,"y":499.45,"fill":"After"}],"code":{"line":"ggplot(line7_df, aes(day, fill_ml)) +\n  geom_line()","boxplot":"ggplot(line7_df, aes(fill, fill_ml)) +\n  geom_boxplot()"}}

In the line view, the series looks like it keeps the same center but the swings around it clearly get wider after day 80. In the boxplot view, the "Before" box and the "After" box sit at almost the same height, but the "After" box is far taller, which is exactly a change in spread with no change in level.

=== step === concept
## How often these methods find a break that is not there

A changepoint search does not run one test. It tests every candidate split in the series and reports the best one it finds, and that changes the odds completely.

Comparing just the two halves of a series for a difference in mean, under the assumption there was no real change, behaves like a draw from a standard normal statistic. The usual one-tailed cutoff for a 5% false-alarm rate sits at about 1.64 standard deviations out. But a changepoint search over a 150-point series does not make one such comparison, it tests all 149 candidate splits and keeps only the best-looking one. Picking the best of 149 comparisons, instead of making one, is why a changepoint search needs a stiffer bar than a single 5% cutoff would give you.

The curve below is the same standard normal statistic as a single two-halves comparison would use. The slider starts at 1.64, the one-tailed 5% cutoff for that single comparison.

::widget null-distribution {"tails": 1, "max": 4, "start": 1.64, "label": "two-halves mean-difference statistic"}

That curve describes one comparison, not a changepoint search over every possible split. To see what the search itself does, simulate 1,000 series of 150 points of pure noise, with no real change in them at all, and run `cpt.mean()` on each one under the three penalties already compared: MBIC, BIC, and AIC.

```r
# Simulate 1000 pure-noise series and see how often each penalty wrongly reports a changepoint
flag_mbic <- 0
flag_bic <- 0
flag_aic <- 0
total_aic_cpts <- 0
for (s in 5001:6000) {
  set.seed(s)
  x <- rnorm(150, 0, 1)
  flag_mbic <- flag_mbic + (length(cpts(cpt.mean(x, method = "PELT", penalty = "MBIC"))) > 0)
  flag_bic  <- flag_bic  + (length(cpts(cpt.mean(x, method = "PELT", penalty = "BIC"))) > 0)
  n_aic <- length(cpts(cpt.mean(x, method = "PELT", penalty = "AIC")))
  flag_aic <- flag_aic + (n_aic > 0)
  total_aic_cpts <- total_aic_cpts + n_aic
}
flag_mbic / 1000 * 100
#> [1] 0.2
flag_bic / 1000 * 100
#> [1] 5.6
flag_aic / 1000 * 100
#> [1] 96
round(total_aic_cpts / 1000, 2)
#> [1] 6.15
```

The default MBIC penalty wrongly reports a changepoint in only 0.2% of these pure-noise series. BIC, with its smaller penalty, does it 5.6% of the time. AIC does it 96% of the time, and when it does, it averages 6.15 fake changepoints per series, not just one.

That gap is the direct cost of AIC's penalty being too small for a search over every possible split. And the scale mismatch in `cpt.mean()`'s variance-1 assumption makes it even worse: repeat the same check with the series left at its natural scale, standard deviation 3, not standardized to 1.

```r
# Repeat the MBIC check with the series left at its natural scale (sd = 3, not standardized)
flag_mbic_raw <- 0
for (s in 5001:5200) {
  set.seed(s)
  x <- rnorm(150, 0, 3)
  flag_mbic_raw <- flag_mbic_raw + (length(cpts(cpt.mean(x, method = "PELT", penalty = "MBIC"))) > 0)
}
flag_mbic_raw / 200 * 100
#> [1] 100
```

Even the default MBIC penalty, which wrongly flagged almost nothing on the standardized noise, now reports a changepoint on every single one of these 200 unstandardized series. The scale mismatch between a series' real spread and `cpt.mean()`'s assumed variance of 1 is not a small issue. Left unfixed, it can turn even the most conservative penalty into one that always cries wolf.

=== step === quiz
## Quick check: reading penalty, scale and variance together

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- cpt.mean()'s cost function assumes variance 1, so a raw, unstandardized series needs scaling first (or cpt.meanvar(), which estimates the variance itself) before the penalty choice even matters. ::ok Right. The 23-versus-1 result came entirely from the missing standardizing step, not from the penalty, and cpt.meanvar() sidesteps the whole problem by fitting the variance directly.
- The default MBIC penalty is too lenient here; switching to a stricter manual penalty would bring the changepoint count down to the honest total. ::no That blames the penalty for a problem the penalty did not cause. The raw series returned 23 changepoints because its cost function wrongly assumed variance 1, not because MBIC was too permissive; standardizing fixed it without touching the penalty at all.
- A wide fitted variance on one side of a changepoint always means the method missed a real changepoint hiding inside it, so you should rerun with a shorter minimum segment length. ::no A wide variance is a result to read, not evidence of a missed split. On Line 7, cpt.meanvar()'s fitted variances of 7.97 and 96.68 were the correct signal of a real change in spread, not a sign that still more changepoints were hiding inside either segment.
- AIC flagging a changepoint in 96% of pure-noise series proves AIC is a broken penalty that should never be used. ::no AIC is not broken, its penalty value is just much smaller than MBIC's or BIC's, so it clears on far more ordinary noise. That is an undersized penalty for a search over every possible split, not a bug in the method.

=== step === tryit
## Your turn: detect the right kind of change

Here is a short, 60-point series. Work out what kind of change it has, and call the right `cpt.*` function to find it.

```r
# A short series: the mean barely moves but the spread widens partway through
x <- c(48.9, 52.18, 51.28, 52.09, 50.34, 52.28, 48.06, 49.74, 50.29, 52.88,
       44.12, 49.51, 49.72, 49.93, 50.56, 51.18, 52.05, 54.21, 50.31, 51.83,
       49.49, 53.04, 53.56, 48.24, 46.94, 50.27, 48.58, 47.18, 53.66, 52.58,
       31.1, 45.59, 47.56, 44, 51.15, 45.6, 51.28, 49.3, 50.65, 57.19,
       50.02, 45.75, 44.32, 47.67, 57.08, 48.77, 42.37, 55.34, 53.11, 54.39,
       39.56, 57.1, 68.69, 54.03, 31.86, 33.75, 48.9, 42.38, 62.62, 40.02)
library(changepoint)

# YOUR CODE: call the right cpt.* function to find where the spread changes

```
::check {"regex": "cpt[.](var|meanvar)[(]", "gate": true, "difficulty": "intermediate", "ok": "Right tool. cpt.var() (or cpt.meanvar()) finds the break at day 30, where the spread jumps from a variance of about 4.96 to about 69.11, while the mean barely moves.", "no": "The mean barely moves in this series, only the spread does partway through, so cpt.mean() is the wrong tool and will badly overfit it. Call cpt.var(x, method = \"PELT\") or cpt.meanvar(x, method = \"PELT\") instead."}
::solution
```r
# Fit cpt.var to find where the spread changes
fit <- cpt.var(x, method = "PELT")
cpts(fit)
#> [1] 30
round(param.est(fit)$variance, 2)
#> [1]  4.96 69.11
```

=== step === concept
## References

- [Optimal detection of changepoints with a linear computational cost](https://doi.org/10.1080/01621459.2012.737745) - Killick, Fearnhead, and Eckley (2012), Journal of the American Statistical Association, 107(500), 1590-1598. The PELT algorithm this lesson runs.
- [A cluster analysis method for grouping means in the analysis of variance](https://doi.org/10.2307/2529204) - Scott and Knott (1974), Biometrics, 30(3), 507-512. The binary segmentation method this lesson compares PELT against.
- [changepoint: An R package for changepoint analysis](https://doi.org/10.18637/jss.v058.i03) - Killick and Eckley (2014), Journal of Statistical Software, 58(3), 1-19. The paper behind the cpt.mean(), cpt.var(), and cpt.meanvar() functions used throughout.
- [Inference about the change-point in a sequence of random variables](https://doi.org/10.1093/biomet/57.1.1) - Hinkley (1970), Biometrika, 57(1), 1-17. The original single-changepoint inference problem these methods extend.
- [changepoint package reference manual](https://cran.r-project.org/web/packages/changepoint/changepoint.pdf) - Rebecca Killick, maintainer, CRAN. The full documentation for cpt.mean(), cpt.var(), cpt.meanvar(), and every penalty and method option.

=== step === complete
## What you can do now

You can now find a changepoint when nobody tells you the date it happened. Specifically:

- Choose between binary segmentation and PELT, and defend the choice: PELT caught the five-point bump in 40 of 40 replicates, binary segmentation in only 5 of 40, because binary segmentation's first search can lose a short regime in one whole-series comparison.
- Read a penalty's actual value and what it trades off: at 150 days, MBIC's 15.03 and BIC's 10.02 both still found day 95, while AIC's much smaller 4 let through 5 changepoints where there was one.
- Standardize a raw series, or use cpt.meanvar(), before trusting cpt.mean()'s default: on the raw fill series it reported 23 changepoints, and dividing by a robust spread estimate brought it back to the one true changepoint at day 95.
- Tell a change in mean from a change in variance by reading the fitted statistics side by side: Line 7's fitted means of 500.38 and 499.10 said nothing moved, its fitted variances of 7.97 and 96.68 said the spread nearly twelvefolded.

That is the whole toolkit: pick the right search, scale the series honestly, and read what came out against both the mean and the variance before you decide a changepoint is real.
