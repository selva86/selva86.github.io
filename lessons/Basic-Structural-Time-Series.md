---
title: "State Space Models and the Kalman Filter Lesson 4: Level, slope, seasonal and irregular in one fitted model"
catalog_blurb: "Split a series into level, slope, season and noise, then forecast ahead."
description: "Split AirPassengers into level, slope, seasonal and irregular states with StructTS(), compare them to an STL decomposition, and forecast 24 months ahead."
keywords: "basic structural time series, StructTS, state space model, unobserved components model, level slope seasonal irregular, STL decomposition, AirPassengers R, structural time series forecast, tsSmooth"
post_type: "LESSON"
curriculum_id: "5.80.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "4"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: "Bayesian-Structural-Time-Series-bsts.html"
course_prev: "Local-Level-and-Local-Linear-Trend-Models.html"
---

=== step === cover
## Level, slope, seasonal and irregular in one fitted model

Today let's understand a basic structural time series model, using one long monthly series as the running example throughout.

The series is AirPassengers, one of R's own built-in datasets: the monthly count of international airline passengers worldwide, from January 1949 to December 1960, 144 months in total, in thousands of passengers. It opens at 112 thousand and closes, twelve years later, at 432 thousand.

A basic structural model explains a series like this by splitting it into four separately moving pieces: level, slope, seasonal and irregular. This lesson names all four, fits them in R, and uses them to forecast ahead.

Here is the whole span, plotted in the order the months actually happened.

::widget chart-plotter {"data":[{"x":1949,"y":112},{"x":1949.083,"y":118},{"x":1949.167,"y":132},{"x":1949.25,"y":129},{"x":1949.333,"y":121},{"x":1949.417,"y":135},{"x":1949.5,"y":148},{"x":1949.583,"y":148},{"x":1949.667,"y":136},{"x":1949.75,"y":119},{"x":1949.833,"y":104},{"x":1949.917,"y":118},{"x":1950,"y":115},{"x":1950.083,"y":126},{"x":1950.167,"y":141},{"x":1950.25,"y":135},{"x":1950.333,"y":125},{"x":1950.417,"y":149},{"x":1950.5,"y":170},{"x":1950.583,"y":170},{"x":1950.667,"y":158},{"x":1950.75,"y":133},{"x":1950.833,"y":114},{"x":1950.917,"y":140},{"x":1951,"y":145},{"x":1951.083,"y":150},{"x":1951.167,"y":178},{"x":1951.25,"y":163},{"x":1951.333,"y":172},{"x":1951.417,"y":178},{"x":1951.5,"y":199},{"x":1951.583,"y":199},{"x":1951.667,"y":184},{"x":1951.75,"y":162},{"x":1951.833,"y":146},{"x":1951.917,"y":166},{"x":1952,"y":171},{"x":1952.083,"y":180},{"x":1952.167,"y":193},{"x":1952.25,"y":181},{"x":1952.333,"y":183},{"x":1952.417,"y":218},{"x":1952.5,"y":230},{"x":1952.583,"y":242},{"x":1952.667,"y":209},{"x":1952.75,"y":191},{"x":1952.833,"y":172},{"x":1952.917,"y":194},{"x":1953,"y":196},{"x":1953.083,"y":196},{"x":1953.167,"y":236},{"x":1953.25,"y":235},{"x":1953.333,"y":229},{"x":1953.417,"y":243},{"x":1953.5,"y":264},{"x":1953.583,"y":272},{"x":1953.667,"y":237},{"x":1953.75,"y":211},{"x":1953.833,"y":180},{"x":1953.917,"y":201},{"x":1954,"y":204},{"x":1954.083,"y":188},{"x":1954.167,"y":235},{"x":1954.25,"y":227},{"x":1954.333,"y":234},{"x":1954.417,"y":264},{"x":1954.5,"y":302},{"x":1954.583,"y":293},{"x":1954.667,"y":259},{"x":1954.75,"y":229},{"x":1954.833,"y":203},{"x":1954.917,"y":229},{"x":1955,"y":242},{"x":1955.083,"y":233},{"x":1955.167,"y":267},{"x":1955.25,"y":269},{"x":1955.333,"y":270},{"x":1955.417,"y":315},{"x":1955.5,"y":364},{"x":1955.583,"y":347},{"x":1955.667,"y":312},{"x":1955.75,"y":274},{"x":1955.833,"y":237},{"x":1955.917,"y":278},{"x":1956,"y":284},{"x":1956.083,"y":277},{"x":1956.167,"y":317},{"x":1956.25,"y":313},{"x":1956.333,"y":318},{"x":1956.417,"y":374},{"x":1956.5,"y":413},{"x":1956.583,"y":405},{"x":1956.667,"y":355},{"x":1956.75,"y":306},{"x":1956.833,"y":271},{"x":1956.917,"y":306},{"x":1957,"y":315},{"x":1957.083,"y":301},{"x":1957.167,"y":356},{"x":1957.25,"y":348},{"x":1957.333,"y":355},{"x":1957.417,"y":422},{"x":1957.5,"y":465},{"x":1957.583,"y":467},{"x":1957.667,"y":404},{"x":1957.75,"y":347},{"x":1957.833,"y":305},{"x":1957.917,"y":336},{"x":1958,"y":340},{"x":1958.083,"y":318},{"x":1958.167,"y":362},{"x":1958.25,"y":348},{"x":1958.333,"y":363},{"x":1958.417,"y":435},{"x":1958.5,"y":491},{"x":1958.583,"y":505},{"x":1958.667,"y":404},{"x":1958.75,"y":359},{"x":1958.833,"y":310},{"x":1958.917,"y":337},{"x":1959,"y":360},{"x":1959.083,"y":342},{"x":1959.167,"y":406},{"x":1959.25,"y":396},{"x":1959.333,"y":420},{"x":1959.417,"y":472},{"x":1959.5,"y":548},{"x":1959.583,"y":559},{"x":1959.667,"y":463},{"x":1959.75,"y":407},{"x":1959.833,"y":362},{"x":1959.917,"y":405},{"x":1960,"y":417},{"x":1960.083,"y":391},{"x":1960.167,"y":419},{"x":1960.25,"y":461},{"x":1960.333,"y":472},{"x":1960.417,"y":535},{"x":1960.5,"y":622},{"x":1960.583,"y":606},{"x":1960.667,"y":508},{"x":1960.75,"y":461},{"x":1960.833,"y":390},{"x":1960.917,"y":432}],"geoms":["line"],"x":"year","y":"passengers"}

Look at that line. It climbs overall, from 112 up to a peak near 622 in the summer of 1960, and inside that climb, the same up-and-down wobble repeats every twelve months, a high every summer and a low every winter.

That's the shape a basic structural model is about to take apart.

=== step === concept
## Four states, and how level and slope evolve

A basic structural model writes the value observed each month as the sum of four hidden pieces, each moving by its own rule, instead of forcing the whole series through one smooth trend line.

- **Level**: roughly where the series sits right now.
- **Slope**: how fast that level is rising or falling.
- **Seasonal**: a pattern that repeats every twelve months.
- **Irregular**: whatever is left over once the other three are accounted for.

Statisticians call these four pieces states, and give each one a short symbol: level is \(\mu_t\) ("mu"), slope is \(\beta_t\) ("beta"), seasonal is \(\gamma_t\) ("gamma"), and irregular is \(\epsilon_t\) ("epsilon"). The small \(t\) just means "in month t", so \(\mu_{t-1}\) means the level one month before.

Level and slope work together the way a car's position and speed do. Next month's level is roughly this month's level plus this month's slope:

\(\mu_t = \mu_{t-1} + \beta_{t-1} + \eta_t\)

\(\eta_t\) ("eta") is a small, random nudge added fresh every month, so the level does not just move in a straight line, it bends gently as it goes. The slope itself is not fixed either. It drifts by its own small amount every month:

\(\beta_t = \beta_{t-1} + \zeta_t\)

\(\zeta_t\) ("zeta") is that month's own random nudge to the slope, separate from \(\eta_t\). A slope that can drift is allowed to speed up or slow down its own rate of climb over time, something a single, permanently fixed slope could never do.

See what a permanently fixed slope alone would look like against the real AirPassengers series.

```r
# Plot AirPassengers against a straight line from its first month to its last
library(ggplot2)

ap <- AirPassengers
ap_df <- data.frame(year = as.numeric(time(ap)), passengers = as.numeric(ap))

ggplot(ap_df, aes(x = year, y = passengers)) +
  geom_line(color = "steelblue", linewidth = 1) +
  geom_segment(
    x = ap_df$year[1], y = ap_df$passengers[1],
    xend = ap_df$year[144], yend = ap_df$passengers[144],
    color = "firebrick", linetype = "dashed"
  ) +
  labs(x = "Year", y = "Passengers (thousands)",
       title = "AirPassengers against a straight line from its first month to its last")
```

The dashed red line is what a single, permanently fixed slope would trace: a straight line from the first month to the last. The solid blue line is the real series, and for most of its length it does not sit on that straight line, pulling above it through the second half of the 1950s. A level whose slope is allowed to drift, the way the equation above allows, has a mechanism to bend toward a curve like that. A level stuck with one fixed slope forever does not.

=== step === concept
## The seasonal component: a pattern that repeats every twelve months

The third piece, seasonal, holds one effect for each calendar month: January's own nudge, February's own nudge, and so on through December. Every January in the data gets roughly the same nudge, every July gets its own, and the twelve nudges drift only slowly from year to year while staying close to cancelling out over any twelve-month stretch.

AirPassengers has a clear one. Average every January across all twelve years, then every February, and so on, and a repeating pattern shows up straight away, even before any model is fit.

::widget styled-table {"cols":["Month","Avg passengers"],"rows":[["January","241.75"],["February","235.00"],["March","270.17"],["April","267.08"],["May","271.83"],["June","311.67"],["July","351.33"],["August","351.08"],["September","302.42"],["October","266.58"],["November","232.83"],["December","261.83"]],"title":"Average AirPassengers by calendar month, 1949 to 1960","note":"July averages highest at 351.33 thousand passengers a month, November lowest at 232.83 thousand."}

July comes out highest, at 351.33 thousand passengers a month on average, and November lowest, at 232.83 thousand. That is the northern-hemisphere summer travel peak and the quiet stretch right after the autumn, both showing up clearly in twelve years of plain averages.

=== step === quiz
## Quick check: reading the seasonal table

Which calendar month has the lowest average in the table above?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- January, at 241.75 thousand ::no January is close to the middle of the table, not the lowest. Scan the Avg passengers column for the smallest number.
- February, at 235.00 thousand ::no February is low, but not the lowest in the table. Check November against it.
- November, at 232.83 thousand ::ok Right. November averages 232.83 thousand passengers, the smallest number in the Avg passengers column, the quiet stretch right after the autumn travel season ends.
- July, at 351.33 thousand ::no That is the highest month in the table, not the lowest. Scan the Avg passengers column for the smallest number instead of the largest.

=== step === concept
## Fitting the basic structural model with StructTS()

Put all four pieces together and the model says: this month's logged passenger count equals level, plus seasonal, plus irregular.

\(y_t = \mu_t + \gamma_t + \epsilon_t\), where \(y_t\) is that month's value of log(AirPassengers)

Notice slope is not in that equation directly. It only ever acts through level, nudging it up or down each month; what you actually observe only needs level, seasonal and the irregular, \(\epsilon_t\), that month's leftover with no pattern of its own.

[NOTE]
Every number from here on, level, slope, seasonal, and the variances below, is on the log scale, not on the original passenger scale, until it is deliberately exponentiated back.

Why log at all? The size of the summer swing grows as the level rises, wider in 1960 than in 1949, and taking logs keeps that growing swing on a scale where seasonal can simply add on top of level instead of scaling with it. Fit it in R with `StructTS()`, telling it to use the basic structural model, `"BSM"`:

```r
# Fit the basic structural model on the logged AirPassengers series
ap <- AirPassengers
log_ap <- log(ap)

fit <- StructTS(log_ap, type = "BSM")
fit$coef
#>        level        slope         seas      epsilon 
#> 0.0007718511 0.0000000000 0.0013969062 0.0000000000
```

`fit$coef` returns four variances, one for each piece's own random nudge: how much level wanders on its own each month (0.00077), how much slope wanders (0), how much seasonal wanders (0.0014), and how much of the observed value is unexplained irregular noise (0).

Two of those four came out at exactly zero, slope and epsilon, and a variance of exactly zero has one specific meaning: that piece stops adapting and is carried forward unchanged at its last estimated value, instead of getting a fresh random nudge every month.

[KEY INSIGHT]
A zero-fitted variance is not a failure. It is the model reporting that a piece needs no wandering of its own: a fixed slope explains AirPassengers just as well as a drifting one would, and there is no leftover irregular noise once level and seasonal are accounted for.

For slope, that means AirPassengers is best described by one fixed rate of climb for the whole 144 months: the fitted slope settles at a constant 0.0101 a month, which on the original scale, undoing the log with `exp()`, works out to about 12.9% a year. But a real series pulling visibly above a straight-line reference, the way AirPassengers does on the original scale, does not actually need a drifting slope to produce it. A level that climbs by exactly the same 0.0101 every month on the log scale still produces upward-curving growth once you undo the log, because each month's absolute gain is a percentage of an already larger base. That is exactly why the model was fit on log(AirPassengers) in the first place: on the log scale, a steady percentage growth rate shows up as one constant slope, no drift required.

For epsilon, a variance of exactly zero means the model found nothing left over: the smoothly evolving level and seasonal alone reproduce the logged series so closely that there is no separate irregular noise to speak of.

=== step === concept
## Reading the four states back out with tsSmooth()

`fit$coef` gave four variances, one per piece. To see the pieces themselves, month by month, pull them out with `tsSmooth()`:

```r
# Read the smoothed level, slope and seasonal states back out
comp <- tsSmooth(fit)
head(comp, 3)
tail(comp, 3)
#>             level     slope         sea
#> Jan 1949 4.800202 0.0101322 -0.08170308
#> Feb 1949 4.821367 0.0101322 -0.05068270
#> Mar 1949 4.838936 0.0101322  0.04386543
#>            level     slope         sea
#> Oct 1960 6.18866 0.0101322 -0.05526171
#> Nov 1960 6.18890 0.0101322 -0.22275327
#> Dec 1960 6.19250 0.0101322 -0.12407397
```

`comp` returns one column per piece that actually evolves: level, slope and sea. Irregular is not one of its columns, since epsilon is just the logged value minus level minus seasonal, and here that comes to essentially 0 in every single month.

Read the first three rows. January 1949 starts at level 4.80 (log scale), a slope of 0.0101, and a seasonal effect of -0.082, January's own dip below the level. Read the last three rows and slope is still exactly 0.0101, the same number as twelve years earlier: once a variance fits to exactly zero, that piece is carried forward unchanged for the rest of the series.

By December 1960, level has climbed to 6.1925, reflecting twelve years of that same constant 0.0101-a-month slope compounding on the log scale.

=== step === concept
## Comparing the fit with an STL decomposition of the same series

There is another, older way to split a series into trend and seasonal: STL, short for "seasonal-trend decomposition using Loess", which smooths the series locally instead of fitting a state space model with variances at all.

```r
# Decompose the same logged series with STL and compare its trend against the structural model's level
stl_fit <- stl(log_ap, s.window = "periodic")
sw <- stl_fit$time.series
head(sw, 1)
tail(sw, 1)
#>             seasonal    trend   remainder
#> Jan 1949 -0.09164042 4.829389 -0.01924936
#>            seasonal    trend   remainder
#> Dec 1960 -0.1006363 6.204752 -0.03569052
```

Line up STL's numbers against the structural model's own, for the same two months. In January 1949, the structural model's level is 4.8002 and STL's trend is 4.8294; the structural model's seasonal is -0.0817 and STL's seasonal is -0.0916. In December 1960, the structural model's level is 6.1925 and STL's trend is 6.2048. Close, in both months, but not identical.

The real difference sits in what each method leaves over. STL's remainder in January 1949 is -0.0192, not zero, and its remainder in December 1960 is -0.0357, also not zero. The structural model's irregular, across the whole series, fit to exactly zero. STL always leaves some leftover smoothing residual behind, because it is a local smoother, not a fitted model. The structural model's level and seasonal states, estimated together with enough freedom, accounted for the entire logged series here, leaving nothing for irregular to explain.

See it across the full 144 months, not just the two months read off above.

::widget chart-plotter {"data":[{"x":1949,"y":4.8,"fill":"BSM level"},{"x":1949.083,"y":4.821,"fill":"BSM level"},{"x":1949.167,"y":4.839,"fill":"BSM level"},{"x":1949.25,"y":4.851,"fill":"BSM level"},{"x":1949.333,"y":4.863,"fill":"BSM level"},{"x":1949.417,"y":4.888,"fill":"BSM level"},{"x":1949.5,"y":4.908,"fill":"BSM level"},{"x":1949.583,"y":4.901,"fill":"BSM level"},{"x":1949.667,"y":4.861,"fill":"BSM level"},{"x":1949.75,"y":4.81,"fill":"BSM level"},{"x":1949.833,"y":4.776,"fill":"BSM level"},{"x":1949.917,"y":4.782,"fill":"BSM level"},{"x":1950,"y":4.816,"fill":"BSM level"},{"x":1950.083,"y":4.859,"fill":"BSM level"},{"x":1950.167,"y":4.887,"fill":"BSM level"},{"x":1950.25,"y":4.906,"fill":"BSM level"},{"x":1950.333,"y":4.923,"fill":"BSM level"},{"x":1950.417,"y":4.966,"fill":"BSM level"},{"x":1950.5,"y":4.999,"fill":"BSM level"},{"x":1950.583,"y":5.004,"fill":"BSM level"},{"x":1950.667,"y":4.984,"fill":"BSM level"},{"x":1950.75,"y":4.951,"fill":"BSM level"},{"x":1950.833,"y":4.94,"fill":"BSM level"},{"x":1950.917,"y":4.972,"fill":"BSM level"},{"x":1951,"y":5.019,"fill":"BSM level"},{"x":1951.083,"y":5.062,"fill":"BSM level"},{"x":1951.167,"y":5.107,"fill":"BSM level"},{"x":1951.25,"y":5.137,"fill":"BSM level"},{"x":1951.333,"y":5.16,"fill":"BSM level"},{"x":1951.417,"y":5.151,"fill":"BSM level"},{"x":1951.5,"y":5.147,"fill":"BSM level"},{"x":1951.583,"y":5.145,"fill":"BSM level"},{"x":1951.667,"y":5.149,"fill":"BSM level"},{"x":1951.75,"y":5.155,"fill":"BSM level"},{"x":1951.833,"y":5.167,"fill":"BSM level"},{"x":1951.917,"y":5.181,"fill":"BSM level"},{"x":1952,"y":5.205,"fill":"BSM level"},{"x":1952.083,"y":5.225,"fill":"BSM level"},{"x":1952.167,"y":5.222,"fill":"BSM level"},{"x":1952.25,"y":5.227,"fill":"BSM level"},{"x":1952.333,"y":5.25,"fill":"BSM level"},{"x":1952.417,"y":5.287,"fill":"BSM level"},{"x":1952.5,"y":5.299,"fill":"BSM level"},{"x":1952.583,"y":5.305,"fill":"BSM level"},{"x":1952.667,"y":5.305,"fill":"BSM level"},{"x":1952.75,"y":5.314,"fill":"BSM level"},{"x":1952.833,"y":5.328,"fill":"BSM level"},{"x":1952.917,"y":5.338,"fill":"BSM level"},{"x":1953,"y":5.352,"fill":"BSM level"},{"x":1953.083,"y":5.38,"fill":"BSM level"},{"x":1953.167,"y":5.419,"fill":"BSM level"},{"x":1953.25,"y":5.448,"fill":"BSM level"},{"x":1953.333,"y":5.445,"fill":"BSM level"},{"x":1953.417,"y":5.425,"fill":"BSM level"},{"x":1953.5,"y":5.415,"fill":"BSM level"},{"x":1953.583,"y":5.417,"fill":"BSM level"},{"x":1953.667,"y":5.416,"fill":"BSM level"},{"x":1953.75,"y":5.409,"fill":"BSM level"},{"x":1953.833,"y":5.394,"fill":"BSM level"},{"x":1953.917,"y":5.383,"fill":"BSM level"},{"x":1954,"y":5.377,"fill":"BSM level"},{"x":1954.083,"y":5.38,"fill":"BSM level"},{"x":1954.167,"y":5.408,"fill":"BSM level"},{"x":1954.25,"y":5.435,"fill":"BSM level"},{"x":1954.333,"y":5.465,"fill":"BSM level"},{"x":1954.417,"y":5.487,"fill":"BSM level"},{"x":1954.5,"y":5.5,"fill":"BSM level"},{"x":1954.583,"y":5.501,"fill":"BSM level"},{"x":1954.667,"y":5.501,"fill":"BSM level"},{"x":1954.75,"y":5.505,"fill":"BSM level"},{"x":1954.833,"y":5.516,"fill":"BSM level"},{"x":1954.917,"y":5.529,"fill":"BSM level"},{"x":1955,"y":5.549,"fill":"BSM level"},{"x":1955.083,"y":5.567,"fill":"BSM level"},{"x":1955.167,"y":5.579,"fill":"BSM level"},{"x":1955.25,"y":5.6,"fill":"BSM level"},{"x":1955.333,"y":5.621,"fill":"BSM level"},{"x":1955.417,"y":5.644,"fill":"BSM level"},{"x":1955.5,"y":5.663,"fill":"BSM level"},{"x":1955.583,"y":5.67,"fill":"BSM level"},{"x":1955.667,"y":5.678,"fill":"BSM level"},{"x":1955.75,"y":5.685,"fill":"BSM level"},{"x":1955.833,"y":5.693,"fill":"BSM level"},{"x":1955.917,"y":5.71,"fill":"BSM level"},{"x":1956,"y":5.725,"fill":"BSM level"},{"x":1956.083,"y":5.741,"fill":"BSM level"},{"x":1956.167,"y":5.754,"fill":"BSM level"},{"x":1956.25,"y":5.768,"fill":"BSM level"},{"x":1956.333,"y":5.783,"fill":"BSM level"},{"x":1956.417,"y":5.793,"fill":"BSM level"},{"x":1956.5,"y":5.798,"fill":"BSM level"},{"x":1956.583,"y":5.802,"fill":"BSM level"},{"x":1956.667,"y":5.804,"fill":"BSM level"},{"x":1956.75,"y":5.807,"fill":"BSM level"},{"x":1956.833,"y":5.813,"fill":"BSM level"},{"x":1956.917,"y":5.819,"fill":"BSM level"},{"x":1957,"y":5.829,"fill":"BSM level"},{"x":1957.083,"y":5.844,"fill":"BSM level"},{"x":1957.167,"y":5.864,"fill":"BSM level"},{"x":1957.25,"y":5.881,"fill":"BSM level"},{"x":1957.333,"y":5.895,"fill":"BSM level"},{"x":1957.417,"y":5.906,"fill":"BSM level"},{"x":1957.5,"y":5.915,"fill":"BSM level"},{"x":1957.583,"y":5.924,"fill":"BSM level"},{"x":1957.667,"y":5.933,"fill":"BSM level"},{"x":1957.75,"y":5.933,"fill":"BSM level"},{"x":1957.833,"y":5.929,"fill":"BSM level"},{"x":1957.917,"y":5.921,"fill":"BSM level"},{"x":1958,"y":5.908,"fill":"BSM level"},{"x":1958.083,"y":5.898,"fill":"BSM level"},{"x":1958.167,"y":5.891,"fill":"BSM level"},{"x":1958.25,"y":5.894,"fill":"BSM level"},{"x":1958.333,"y":5.912,"fill":"BSM level"},{"x":1958.417,"y":5.939,"fill":"BSM level"},{"x":1958.5,"y":5.959,"fill":"BSM level"},{"x":1958.583,"y":5.968,"fill":"BSM level"},{"x":1958.667,"y":5.96,"fill":"BSM level"},{"x":1958.75,"y":5.954,"fill":"BSM level"},{"x":1958.833,"y":5.945,"fill":"BSM level"},{"x":1958.917,"y":5.943,"fill":"BSM level"},{"x":1959,"y":5.959,"fill":"BSM level"},{"x":1959.083,"y":5.982,"fill":"BSM level"},{"x":1959.167,"y":6.009,"fill":"BSM level"},{"x":1959.25,"y":6.02,"fill":"BSM level"},{"x":1959.333,"y":6.033,"fill":"BSM level"},{"x":1959.417,"y":6.043,"fill":"BSM level"},{"x":1959.5,"y":6.059,"fill":"BSM level"},{"x":1959.583,"y":6.075,"fill":"BSM level"},{"x":1959.667,"y":6.085,"fill":"BSM level"},{"x":1959.75,"y":6.091,"fill":"BSM level"},{"x":1959.833,"y":6.103,"fill":"BSM level"},{"x":1959.917,"y":6.11,"fill":"BSM level"},{"x":1960,"y":6.106,"fill":"BSM level"},{"x":1960.083,"y":6.103,"fill":"BSM level"},{"x":1960.167,"y":6.107,"fill":"BSM level"},{"x":1960.25,"y":6.131,"fill":"BSM level"},{"x":1960.333,"y":6.15,"fill":"BSM level"},{"x":1960.417,"y":6.164,"fill":"BSM level"},{"x":1960.5,"y":6.173,"fill":"BSM level"},{"x":1960.583,"y":6.176,"fill":"BSM level"},{"x":1960.667,"y":6.182,"fill":"BSM level"},{"x":1960.75,"y":6.189,"fill":"BSM level"},{"x":1960.833,"y":6.189,"fill":"BSM level"},{"x":1960.917,"y":6.192,"fill":"BSM level"},{"x":1949,"y":4.829,"fill":"STL trend"},{"x":1949.083,"y":4.83,"fill":"STL trend"},{"x":1949.167,"y":4.831,"fill":"STL trend"},{"x":1949.25,"y":4.833,"fill":"STL trend"},{"x":1949.333,"y":4.835,"fill":"STL trend"},{"x":1949.417,"y":4.838,"fill":"STL trend"},{"x":1949.5,"y":4.841,"fill":"STL trend"},{"x":1949.583,"y":4.843,"fill":"STL trend"},{"x":1949.667,"y":4.846,"fill":"STL trend"},{"x":1949.75,"y":4.851,"fill":"STL trend"},{"x":1949.833,"y":4.856,"fill":"STL trend"},{"x":1949.917,"y":4.865,"fill":"STL trend"},{"x":1950,"y":4.873,"fill":"STL trend"},{"x":1950.083,"y":4.883,"fill":"STL trend"},{"x":1950.167,"y":4.893,"fill":"STL trend"},{"x":1950.25,"y":4.903,"fill":"STL trend"},{"x":1950.333,"y":4.913,"fill":"STL trend"},{"x":1950.417,"y":4.925,"fill":"STL trend"},{"x":1950.5,"y":4.938,"fill":"STL trend"},{"x":1950.583,"y":4.954,"fill":"STL trend"},{"x":1950.667,"y":4.971,"fill":"STL trend"},{"x":1950.75,"y":4.992,"fill":"STL trend"},{"x":1950.833,"y":5.012,"fill":"STL trend"},{"x":1950.917,"y":5.031,"fill":"STL trend"},{"x":1951,"y":5.05,"fill":"STL trend"},{"x":1951.083,"y":5.065,"fill":"STL trend"},{"x":1951.167,"y":5.08,"fill":"STL trend"},{"x":1951.25,"y":5.094,"fill":"STL trend"},{"x":1951.333,"y":5.108,"fill":"STL trend"},{"x":1951.417,"y":5.121,"fill":"STL trend"},{"x":1951.5,"y":5.134,"fill":"STL trend"},{"x":1951.583,"y":5.146,"fill":"STL trend"},{"x":1951.667,"y":5.158,"fill":"STL trend"},{"x":1951.75,"y":5.17,"fill":"STL trend"},{"x":1951.833,"y":5.182,"fill":"STL trend"},{"x":1951.917,"y":5.195,"fill":"STL trend"},{"x":1952,"y":5.208,"fill":"STL trend"},{"x":1952.083,"y":5.22,"fill":"STL trend"},{"x":1952.167,"y":5.233,"fill":"STL trend"},{"x":1952.25,"y":5.244,"fill":"STL trend"},{"x":1952.333,"y":5.256,"fill":"STL trend"},{"x":1952.417,"y":5.267,"fill":"STL trend"},{"x":1952.5,"y":5.278,"fill":"STL trend"},{"x":1952.583,"y":5.292,"fill":"STL trend"},{"x":1952.667,"y":5.306,"fill":"STL trend"},{"x":1952.75,"y":5.323,"fill":"STL trend"},{"x":1952.833,"y":5.34,"fill":"STL trend"},{"x":1952.917,"y":5.356,"fill":"STL trend"},{"x":1953,"y":5.371,"fill":"STL trend"},{"x":1953.083,"y":5.382,"fill":"STL trend"},{"x":1953.167,"y":5.392,"fill":"STL trend"},{"x":1953.25,"y":5.398,"fill":"STL trend"},{"x":1953.333,"y":5.405,"fill":"STL trend"},{"x":1953.417,"y":5.407,"fill":"STL trend"},{"x":1953.5,"y":5.409,"fill":"STL trend"},{"x":1953.583,"y":5.408,"fill":"STL trend"},{"x":1953.667,"y":5.407,"fill":"STL trend"},{"x":1953.75,"y":5.407,"fill":"STL trend"},{"x":1953.833,"y":5.407,"fill":"STL trend"},{"x":1953.917,"y":5.413,"fill":"STL trend"},{"x":1954,"y":5.418,"fill":"STL trend"},{"x":1954.083,"y":5.426,"fill":"STL trend"},{"x":1954.167,"y":5.434,"fill":"STL trend"},{"x":1954.25,"y":5.443,"fill":"STL trend"},{"x":1954.333,"y":5.452,"fill":"STL trend"},{"x":1954.417,"y":5.464,"fill":"STL trend"},{"x":1954.5,"y":5.475,"fill":"STL trend"},{"x":1954.583,"y":5.489,"fill":"STL trend"},{"x":1954.667,"y":5.502,"fill":"STL trend"},{"x":1954.75,"y":5.516,"fill":"STL trend"},{"x":1954.833,"y":5.529,"fill":"STL trend"},{"x":1954.917,"y":5.543,"fill":"STL trend"},{"x":1955,"y":5.557,"fill":"STL trend"},{"x":1955.083,"y":5.573,"fill":"STL trend"},{"x":1955.167,"y":5.588,"fill":"STL trend"},{"x":1955.25,"y":5.603,"fill":"STL trend"},{"x":1955.333,"y":5.617,"fill":"STL trend"},{"x":1955.417,"y":5.632,"fill":"STL trend"},{"x":1955.5,"y":5.646,"fill":"STL trend"},{"x":1955.583,"y":5.66,"fill":"STL trend"},{"x":1955.667,"y":5.674,"fill":"STL trend"},{"x":1955.75,"y":5.687,"fill":"STL trend"},{"x":1955.833,"y":5.701,"fill":"STL trend"},{"x":1955.917,"y":5.714,"fill":"STL trend"},{"x":1956,"y":5.727,"fill":"STL trend"},{"x":1956.083,"y":5.739,"fill":"STL trend"},{"x":1956.167,"y":5.751,"fill":"STL trend"},{"x":1956.25,"y":5.761,"fill":"STL trend"},{"x":1956.333,"y":5.772,"fill":"STL trend"},{"x":1956.417,"y":5.781,"fill":"STL trend"},{"x":1956.5,"y":5.789,"fill":"STL trend"},{"x":1956.583,"y":5.797,"fill":"STL trend"},{"x":1956.667,"y":5.805,"fill":"STL trend"},{"x":1956.75,"y":5.814,"fill":"STL trend"},{"x":1956.833,"y":5.822,"fill":"STL trend"},{"x":1956.917,"y":5.832,"fill":"STL trend"},{"x":1957,"y":5.841,"fill":"STL trend"},{"x":1957.083,"y":5.853,"fill":"STL trend"},{"x":1957.167,"y":5.864,"fill":"STL trend"},{"x":1957.25,"y":5.875,"fill":"STL trend"},{"x":1957.333,"y":5.886,"fill":"STL trend"},{"x":1957.417,"y":5.895,"fill":"STL trend"},{"x":1957.5,"y":5.903,"fill":"STL trend"},{"x":1957.583,"y":5.908,"fill":"STL trend"},{"x":1957.667,"y":5.912,"fill":"STL trend"},{"x":1957.75,"y":5.913,"fill":"STL trend"},{"x":1957.833,"y":5.914,"fill":"STL trend"},{"x":1957.917,"y":5.915,"fill":"STL trend"},{"x":1958,"y":5.916,"fill":"STL trend"},{"x":1958.083,"y":5.919,"fill":"STL trend"},{"x":1958.167,"y":5.921,"fill":"STL trend"},{"x":1958.25,"y":5.925,"fill":"STL trend"},{"x":1958.333,"y":5.928,"fill":"STL trend"},{"x":1958.417,"y":5.933,"fill":"STL trend"},{"x":1958.5,"y":5.937,"fill":"STL trend"},{"x":1958.583,"y":5.943,"fill":"STL trend"},{"x":1958.667,"y":5.95,"fill":"STL trend"},{"x":1958.75,"y":5.957,"fill":"STL trend"},{"x":1958.833,"y":5.965,"fill":"STL trend"},{"x":1958.917,"y":5.973,"fill":"STL trend"},{"x":1959,"y":5.982,"fill":"STL trend"},{"x":1959.083,"y":5.992,"fill":"STL trend"},{"x":1959.167,"y":6.003,"fill":"STL trend"},{"x":1959.25,"y":6.016,"fill":"STL trend"},{"x":1959.333,"y":6.029,"fill":"STL trend"},{"x":1959.417,"y":6.042,"fill":"STL trend"},{"x":1959.5,"y":6.056,"fill":"STL trend"},{"x":1959.583,"y":6.066,"fill":"STL trend"},{"x":1959.667,"y":6.076,"fill":"STL trend"},{"x":1959.75,"y":6.084,"fill":"STL trend"},{"x":1959.833,"y":6.092,"fill":"STL trend"},{"x":1959.917,"y":6.101,"fill":"STL trend"},{"x":1960,"y":6.109,"fill":"STL trend"},{"x":1960.083,"y":6.118,"fill":"STL trend"},{"x":1960.167,"y":6.127,"fill":"STL trend"},{"x":1960.25,"y":6.136,"fill":"STL trend"},{"x":1960.333,"y":6.145,"fill":"STL trend"},{"x":1960.417,"y":6.153,"fill":"STL trend"},{"x":1960.5,"y":6.161,"fill":"STL trend"},{"x":1960.583,"y":6.17,"fill":"STL trend"},{"x":1960.667,"y":6.179,"fill":"STL trend"},{"x":1960.75,"y":6.188,"fill":"STL trend"},{"x":1960.833,"y":6.196,"fill":"STL trend"},{"x":1960.917,"y":6.205,"fill":"STL trend"}],"geoms":["line"],"x":"year","y":"level or trend (log scale)"}

The two lines track each other closely for almost the entire span, drifting apart by only a few thousandths at any point, which is what "close but not identical" looks like on a chart instead of in two single months' numbers.

=== step === concept
## Forecasting from the structural model

A structural model does something STL cannot: because it is a real fitted model with its own equations for how each piece evolves, it can run those equations forward past the last observed month and produce a genuine forecast, not just a decomposition of the past.

Forecast 24 months ahead with `predict()`:

```r
# Forecast 24 months ahead from the fitted structural model
fc <- predict(fit, n.ahead = 24)
future_time <- as.numeric(time(ap)[144]) + (1:24) / 12

forecast_df <- data.frame(
  year  = future_time,
  point = as.numeric(exp(fc$pred)),
  lower = as.numeric(exp(fc$pred - 1.96 * fc$se)),
  upper = as.numeric(exp(fc$pred + 1.96 * fc$se))
)
round(forecast_df[c(1, 24), ], 2)
#>       year  point  lower  upper
#> 1  1961.00 464.71 401.86 537.39
#> 24 1962.92 550.92 401.07 756.78
```

`predict()` returns `fc$pred` and `fc$se`, a point forecast and its standard error, for every one of the 24 months ahead, all still on the log scale the model was fit on. Exponentiating undoes the log: `point` is the forecast in real passengers, and `lower`/`upper`, built from `pred` plus or minus 1.96 times `se`, is the 95% interval around it.

January 1961, one month ahead, forecasts 464.71 thousand passengers, with a 95% interval of about 402 to 537. December 1962, 24 months ahead, forecasts 550.92 thousand, with a much wider interval, about 401 to 757. Notice the lower bound barely moved, 401.86 down to 401.07, while the upper bound climbed a lot, 537.39 up to 756.78: the interval is not just wider, it is lopsided, because exponentiating a symmetric interval on the log scale stretches the top of the range further than the bottom.

Plot the forecast against the history to see the same widening interval as a shape instead of four numbers.

```r
# Plot the forecast against the historical series with its interval band
ggplot() +
  geom_line(data = ap_df, aes(x = year, y = passengers)) +
  geom_ribbon(data = forecast_df, aes(x = year, ymin = lower, ymax = upper),
              alpha = 0.2, fill = "steelblue") +
  geom_line(data = forecast_df, aes(x = year, y = point), color = "steelblue") +
  labs(x = "Year", y = "Passengers (thousands)",
       title = "AirPassengers with a 24-month forecast and its 95% interval")
```

The shaded band sits narrow right where the forecast starts and fans out steadily as the horizon stretches further from the last real observation. Its midline still rises and falls within each forecasted year, the same within-year wobble the seasonal state carries forward. That widening fan is what growing uncertainty looks like: the further out a month sits, the wider the range of values the interval still has to allow for.

=== step === quiz
## Practice: the structural model against STL

Compare the structural model's irregular against STL's remainder, both computed on the same logged AirPassengers series.

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- STL is more accurate, since it never approximates the series the way a fitted model does. ::no STL is a smoother, not a more accurate method by default; it leaves its own leftover remainder in every month, which is the opposite of a perfect fit.
- The structural model failed to capture the seasonal pattern, which is why its irregular came out at zero. ::no The structural model's own seasonal state carried the seasonal pattern; a zero irregular means nothing was left unexplained, not that seasonality was missed.
- STL's remainder is never exactly zero, since it always leaves a leftover smoothing residual behind; the structural model's level and seasonal states, estimated with enough freedom, accounted for the whole series here, leaving nothing for irregular to explain. ::ok Exactly. STL is a local smoother, not a fitted model, so it always has some remainder left over, -0.0192 in January 1949 for example. The structural model is under no such obligation: here its irregular fit to exactly zero.
- STL and the structural model's leftover terms are identical, both zero. ::no STL's remainder was -0.0192 in January 1949 and -0.0357 in December 1960, never zero. Only the structural model's irregular fit to zero here.

=== step === tryit
## Your turn: how much wider is the two-year forecast?

The forecast already fit a 95% interval for the first month ahead and for the 24th. Use those four bounds to see how much the interval widens over those two years.

```r
# The structural model's forecast already gave these 95% interval bounds, in thousands of passengers
lower_1  <- 401.86
upper_1  <- 537.39
lower_24 <- 401.07
upper_24 <- 756.78

# Compute the width of each interval, then how many times wider the 24-month one is than the 1-month one:
# width_1  <- upper_1 - lower_1
# width_24 <- upper_24 - lower_24
# width_24 / width_1
# Two lines, then print the ratio. Press Check when you have it.
```
::check {"regex": "\\b2\\.[0-9]", "gate": true, "difficulty": "intermediate", "ok": "Right, about 2.62. The 24-month interval is more than two and a half times as wide as the 1-month one, growing on top of the same fixed 0.0101-a-month slope, not a slope that is itself slowing down.", "no": "Subtract each interval's lower bound from its upper bound to get its width, then divide the 24-month width by the 1-month width: width_24 <- upper_24 - lower_24, width_1 <- upper_1 - lower_1, then width_24 / width_1."}
::solution
```r
# Compute the width of each 95% interval, then how many times wider the 24-month-ahead one is
width_1  <- upper_1 - lower_1
width_24 <- upper_24 - lower_24
round(width_24 / width_1, 2)
#> [1] 2.62
```

=== step === concept
## References

- Harvey, A.C. (1989), *Forecasting, Structural Time Series Models and the Kalman Filter*, Cambridge University Press. The standard reference for the basic structural model fit throughout this lesson.
- [R documentation for `StructTS()`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/StructTS.html) (stats package). The fitting function used throughout this lesson.
- [R documentation for `stl()`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/stl.html) (stats package). The STL decomposition used for comparison.
- Cleveland, R.B., Cleveland, W.S., McRae, J.E., and Terpenning, I. (1990), "STL: A Seasonal-Trend Decomposition Procedure Based on Loess", *Journal of Official Statistics* 6(1), 3-73. The original STL paper.
- [R documentation for the `AirPassengers` dataset](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/AirPassengers.html) (datasets package). Confirms the 1949-1960 span and its origin in Box and Jenkins's classic airline data (1976).

=== step === complete
## When a basic structural model is worth fitting

A basic structural model splits an observed series into level, slope, seasonal and irregular, four pieces that each move by their own rule instead of forcing the whole series through one smooth trend.

Fit to AirPassengers, two of those four pieces, slope and irregular, turned out to need no wandering of their own at all: slope settled at a fixed 12.9% a year, and irregular fit to exactly zero, meaning level and seasonal alone reproduced the logged series.

Compared against STL, a plain decomposition of the same series, the structural model's numbers landed close but not identical, and it has one real edge STL does not: because it is a fitted model with its own equations, it can run those equations forward and produce a genuine forecast, with a 95% interval that widens the further out it runs, not just a decomposition of months already observed.

That is when a basic structural model earns its cost over a simpler decomposition or a single trend line: whenever forecasting ahead, with an interval that widens with the horizon, matters as much as explaining what already happened.
