---
title: "ARIMA and Seasonal ARIMA Lesson 2: Removing trend and season with differencing"
catalog_blurb: "Remove a trend and a season from a real series with two differences."
description: "Remove a trend with an ordinary difference and a season with a seasonal difference, check the count with nsdiffs and ndiffs, then undo it with cumsum."
keywords: "differencing time series, seasonal differencing, unitroot_ndiffs, unitroot_nsdiffs, tsibble difference, over-differencing, undo a difference, cumsum, AirPassengers ARIMA"
post_type: "LESSON"
curriculum_id: "5.60.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-arima"
course_title: "ARIMA and Seasonal ARIMA"
course_lesson: "2"
course_total: "7"
course_landing: "ARIMA-and-Seasonal-ARIMA-Course.html"
course_next: "Reading-the-ACF-and-PACF.html"
course_prev: "Stationarity-and-Unit-Root-Tests-KPSS.html"
---

=== step === cover
## Removing trend and season with differencing

Today let's understand differencing: how to remove a trend and a season from a time series, so that what is left behaves in a way a model can actually work with.

The running example is AirPassengers, a dataset built into R: the monthly count of international airline passengers, in thousands, from January 1949 through December 1960, 144 months in total. It was first published by Box and Jenkins, and time series teaching has used it ever since.

Here is the whole series, plotted month by month.

::widget chart-plotter {"data":[{"x":1,"y":112},{"x":2,"y":118},{"x":3,"y":132},{"x":4,"y":129},{"x":5,"y":121},{"x":6,"y":135},{"x":7,"y":148},{"x":8,"y":148},{"x":9,"y":136},{"x":10,"y":119},{"x":11,"y":104},{"x":12,"y":118},{"x":13,"y":115},{"x":14,"y":126},{"x":15,"y":141},{"x":16,"y":135},{"x":17,"y":125},{"x":18,"y":149},{"x":19,"y":170},{"x":20,"y":170},{"x":21,"y":158},{"x":22,"y":133},{"x":23,"y":114},{"x":24,"y":140},{"x":25,"y":145},{"x":26,"y":150},{"x":27,"y":178},{"x":28,"y":163},{"x":29,"y":172},{"x":30,"y":178},{"x":31,"y":199},{"x":32,"y":199},{"x":33,"y":184},{"x":34,"y":162},{"x":35,"y":146},{"x":36,"y":166},{"x":37,"y":171},{"x":38,"y":180},{"x":39,"y":193},{"x":40,"y":181},{"x":41,"y":183},{"x":42,"y":218},{"x":43,"y":230},{"x":44,"y":242},{"x":45,"y":209},{"x":46,"y":191},{"x":47,"y":172},{"x":48,"y":194},{"x":49,"y":196},{"x":50,"y":196},{"x":51,"y":236},{"x":52,"y":235},{"x":53,"y":229},{"x":54,"y":243},{"x":55,"y":264},{"x":56,"y":272},{"x":57,"y":237},{"x":58,"y":211},{"x":59,"y":180},{"x":60,"y":201},{"x":61,"y":204},{"x":62,"y":188},{"x":63,"y":235},{"x":64,"y":227},{"x":65,"y":234},{"x":66,"y":264},{"x":67,"y":302},{"x":68,"y":293},{"x":69,"y":259},{"x":70,"y":229},{"x":71,"y":203},{"x":72,"y":229},{"x":73,"y":242},{"x":74,"y":233},{"x":75,"y":267},{"x":76,"y":269},{"x":77,"y":270},{"x":78,"y":315},{"x":79,"y":364},{"x":80,"y":347},{"x":81,"y":312},{"x":82,"y":274},{"x":83,"y":237},{"x":84,"y":278},{"x":85,"y":284},{"x":86,"y":277},{"x":87,"y":317},{"x":88,"y":313},{"x":89,"y":318},{"x":90,"y":374},{"x":91,"y":413},{"x":92,"y":405},{"x":93,"y":355},{"x":94,"y":306},{"x":95,"y":271},{"x":96,"y":306},{"x":97,"y":315},{"x":98,"y":301},{"x":99,"y":356},{"x":100,"y":348},{"x":101,"y":355},{"x":102,"y":422},{"x":103,"y":465},{"x":104,"y":467},{"x":105,"y":404},{"x":106,"y":347},{"x":107,"y":305},{"x":108,"y":336},{"x":109,"y":340},{"x":110,"y":318},{"x":111,"y":362},{"x":112,"y":348},{"x":113,"y":363},{"x":114,"y":435},{"x":115,"y":491},{"x":116,"y":505},{"x":117,"y":404},{"x":118,"y":359},{"x":119,"y":310},{"x":120,"y":337},{"x":121,"y":360},{"x":122,"y":342},{"x":123,"y":406},{"x":124,"y":396},{"x":125,"y":420},{"x":126,"y":472},{"x":127,"y":548},{"x":128,"y":559},{"x":129,"y":463},{"x":130,"y":407},{"x":131,"y":362},{"x":132,"y":405},{"x":133,"y":417},{"x":134,"y":391},{"x":135,"y":419},{"x":136,"y":461},{"x":137,"y":472},{"x":138,"y":535},{"x":139,"y":622},{"x":140,"y":606},{"x":141,"y":508},{"x":142,"y":461},{"x":143,"y":390},{"x":144,"y":432}],"geoms":["line"],"x":"month","y":"passengers"}

The line climbs across the whole twelve years, and the summer bump riding on top of it grows a little wider every year. Removing both of those, the climb and the growing bump, is exactly what differencing does.

=== step === concept
## Removing a trend with an ordinary difference

Differencing means subtracting each value in a series from the value some fixed number of steps before it. That fixed gap is called the lag. The simplest case, lag = 1, subtracts each month's value from the month right before it. That is called an ordinary difference.

Build the AirPassengers tsibble, then compute an ordinary difference and compare its mean and standard deviation against the raw series.

```r
# Build the AirPassengers tsibble and compute an ordinary difference
library(tsibble)
library(dplyr)

air <- as_tsibble(AirPassengers) |> rename(passengers = value, month = index)
mean(air$passengers)
#> [1] 280.2986
sd(air$passengers)
#> [1] 119.9663

air <- air |> mutate(d1 = difference(passengers, lag = 1))
mean(air$d1, na.rm = TRUE)
#> [1] 2.237762
sd(air$d1, na.rm = TRUE)
#> [1] 33.75428
```

The raw series averages 280.30, with a standard deviation of 119.97, both in thousands of passengers a month. `d1` holds 143 values instead of 144, since the very first month has no earlier month to subtract. Its mean is 2.24, close to zero instead of climbing steadily upward the way the raw series does. Its standard deviation, 33.75, is a different kind of number: it measures how much the series moves from one month to the next, not how spread out the raw levels are, so it is not meant to be compared directly against 119.97. What matters here is the mean collapsing toward zero.

Plot the differenced series to see the trend disappear.

```r
# Plot the once-differenced series
library(feasts)

autoplot(air, d1)
```

The line now wanders flatly around zero instead of climbing across the twelve years. That flat wandering, not an exact zero mean, is what a model needs: no more systematic drift upward or downward.

=== step === widget
## Checking with the ACF: the season one difference leaves behind

Here is a tool for reading dependence in a series: the ACF, short for autocorrelation function. Its value at lag k is the correlation between a series and its own value k steps earlier. A significance band marks how far that correlation can wander by pure chance when there really is no dependence at that lag, so anything that clears the band is a real pattern, not noise.

Compute that band and the ACF of `d1` up to lag 12, and compare its value at the yearly lag against the raw series' own.

```r
# Compute the significance band and the ACF of the once-differenced series
n_d1 <- sum(!is.na(air$d1))
n_d1
#> [1] 143

band <- round(2 / sqrt(n_d1), 4)
band
#> [1] 0.1672

round((air |> ACF(d1, lag_max = 12))$acf, 3)
#>  [1]  0.303 -0.102 -0.241 -0.300 -0.094 -0.078 -0.092 -0.295 -0.192 -0.105
#> [11]  0.283  0.829

round((air |> ACF(passengers, lag_max = 12))$acf[12], 3)
#> [1] 0.76
```

`n_d1` is 143, so the significance band is +-0.1672: any ACF value inside that range is not distinguishable from noise. Several lags clear it (lag 1 at 0.303, lag 3 at -0.241, lag 4 at -0.300, and a few more), ordinary month-to-month dependence that one difference does not fully clean up. But lag 12 is the one that matters here: at 0.829, it is not just outside the band, it is bigger than the raw series' own value at that same lag, 0.76. One ordinary difference did nothing to shrink the yearly season. If anything, it stands out even more once the trend is out of the way.

See that pattern as a bar chart, with the bars outside the significance band marked apart from the ones inside it.

::widget chart-plotter {"data":[{"x":1,"y":0.303,"fill":"Outside band"},{"x":2,"y":-0.102,"fill":"Inside band"},{"x":3,"y":-0.241,"fill":"Outside band"},{"x":4,"y":-0.300,"fill":"Outside band"},{"x":5,"y":-0.094,"fill":"Inside band"},{"x":6,"y":-0.078,"fill":"Inside band"},{"x":7,"y":-0.092,"fill":"Inside band"},{"x":8,"y":-0.295,"fill":"Outside band"},{"x":9,"y":-0.192,"fill":"Outside band"},{"x":10,"y":-0.105,"fill":"Inside band"},{"x":11,"y":0.283,"fill":"Outside band"},{"x":12,"y":0.829,"fill":"Outside band"}],"geoms":["bar"],"x":"lag","y":"acf"}

The tallest bar by far sits at lag 12, exactly the yearly gap. That confirms the season survives an ordinary difference completely untouched, and it is going to need a difference of its own.

=== step === quiz
## Quick check: what one ordinary difference actually removed

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The mean fell from 280.30 to 2.24 and the plot flattened, so the trend is gone, but the ACF at lag 12 is still 0.829, so the season is untouched. ::ok Right. The mean collapsing and the plot flattening are both signs the trend is gone. But lag 12 sitting at 0.829, even bigger than the raw series' own 0.76 there, says the yearly season came through the ordinary difference completely intact.
- The plot no longer climbs, so both the trend and the season are gone. ::no
- The lag-12 spike in the ACF means the season moved to a new location, not that it survived. ::no The plot flattening only speaks to the trend, since a difference removes drift in the mean. The season is a separate property, autocorrelation at the yearly lag, and it did not move or shrink: at 0.829 it is larger than before differencing, so it is still fully present, not relocated.

=== step === concept
## Removing the season with a seasonal difference

An ordinary difference subtracts each value from the one step before it. A seasonal difference does the same kind of subtraction, but across a full season instead of one step. For a monthly series with a yearly season, that means subtracting each value from the same month one year earlier, a lag of 12.

Compute a seasonal difference of AirPassengers and compare its mean and standard deviation against the raw series.

```r
# Compute a seasonal difference (lag = 12) and its mean and standard deviation
air <- air |> mutate(D1 = difference(passengers, lag = 12))
sum(!is.na(air$D1))
#> [1] 132
mean(air$D1, na.rm = TRUE)
#> [1] 31.77273
sd(air$D1, na.rm = TRUE)
#> [1] 17.6547
```

132 values remain, since the first twelve months have no matching month a year earlier to subtract. `D1` no longer climbs the way the raw series does, but its mean, 31.77, is nowhere near zero: an ordinary trend still runs through it. Check what the ACF says about the season specifically.

```r
# Compute the ACF of the seasonally differenced series up to lag 12
round((air |> ACF(D1, lag_max = 12))$acf, 3)
#>  [1]  0.746  0.647  0.505  0.406  0.355  0.283  0.216  0.175  0.165  0.057
#> [11]  0.019 -0.044
```

Lag 12 is -0.044, right on top of zero: the seasonal difference did exactly what it was built to do, and the yearly repeat is gone. But look at lag 1 through lag 4: 0.746, 0.647, 0.505, 0.406, decaying slowly instead of dropping off quickly. That slow decay is the signature of a trend-like structure still running through `D1`, the same kind of leftover an ordinary difference is built to remove.

See that shape as a plot.

```r
# Plot the ACF of the seasonally differenced series
air |> ACF(D1, lag_max = 12) |> autoplot()
```

=== step === concept
## How many differences are needed, and does the order matter?

Two questions remain. How many times do you actually need to difference AirPassengers, one ordinary and one seasonal, or more? And does it matter which one you do first?

The feasts package answers the first question directly. `unitroot_nsdiffs()` counts how many seasonal differences a series needs, and `unitroot_ndiffs()` counts how many ordinary differences are still needed once any seasonal differencing is done.

Run both checks on AirPassengers.

```r
# Count how many seasonal and ordinary differences AirPassengers needs
air |> features(passengers, unitroot_nsdiffs)
#> # A tibble: 1 × 1
#>   nsdiffs
#>     <int>
#> 1       1

air |> features(D1, unitroot_ndiffs)
#> # A tibble: 1 × 1
#>   ndiffs
#>    <int>
#> 1       1
```

`unitroot_nsdiffs()` on the raw series reads 1: exactly one seasonal difference is needed. Run `unitroot_ndiffs()` on `D1`, the series after that seasonal difference, and it also reads 1: one more, ordinary, difference is still needed on top of it. Together, that is one seasonal difference and one ordinary difference, no more.

Does it matter which comes first? Difference AirPassengers the other way around, ordinary first and then seasonal, and compare the two results.

```r
# Compare seasonal-then-ordinary against ordinary-then-seasonal
seasonal_first <- air |> mutate(D1d1 = difference(D1, lag = 1))
ordinary_first <- air |> mutate(d1D1 = difference(d1, lag = 12))

max(abs(seasonal_first$D1d1 - ordinary_first$d1D1), na.rm = TRUE)
#> [1] 0
```

Zero. Applying the seasonal difference first and the ordinary difference second lands on the exact same 131 numbers as doing it the other way around. Differencing is just subtraction, so the order does not change the arithmetic. The seasonal-first convention used above, and almost everywhere else, keeps the workflow simple to follow. It is not something the arithmetic demands.

=== step === widget
## Putting both differences together

Apply both differences to AirPassengers: one seasonal, lag 12, then one ordinary, lag 1, on top of it. Call the result `D1d1`.

Compute `D1d1`, its mean, its standard deviation, its significance band, and its ACF.

```r
# Apply both differences and check the mean, standard deviation and ACF
air <- air |> mutate(D1d1 = difference(D1, lag = 1))
n_D1d1 <- sum(!is.na(air$D1d1))
n_D1d1
#> [1] 131
mean(air$D1d1, na.rm = TRUE)
#> [1] 0.1832061
sd(air$D1d1, na.rm = TRUE)
#> [1] 12.35675

round(2 / sqrt(n_D1d1), 4)
#> [1] 0.1747

round((air |> ACF(D1d1, lag_max = 12))$acf, 3)
#>  [1] -0.310  0.095 -0.097 -0.099  0.061  0.000 -0.056 -0.061  0.176 -0.140
#> [11]  0.070 -0.134
```

131 values remain, and the mean is 0.18, about as close to zero as AirPassengers gets. Every ACF value except lag 1 (-0.310) and lag 9 (0.176) sits inside the +-0.1747 band for a series this length, well within noise. Confirm there is nothing left to remove.

```r
# Confirm no further differencing is needed
air |> features(D1d1, unitroot_nsdiffs)
#> # A tibble: 1 × 1
#>   nsdiffs
#>     <int>
#> 1       0

air |> features(D1d1, unitroot_ndiffs)
#> # A tibble: 1 × 1
#>   ndiffs
#>    <int>
#> 1       0
```

Both read 0. AirPassengers needed exactly one seasonal and one ordinary difference, and `D1d1` is the finished result. See that result as a plot.

::widget chart-plotter {"data":[{"x":1,"y":5},{"x":2,"y":1},{"x":3,"y":-3},{"x":4,"y":-2},{"x":5,"y":10},{"x":6,"y":8},{"x":7,"y":0},{"x":8,"y":0},{"x":9,"y":-8},{"x":10,"y":-4},{"x":11,"y":12},{"x":12,"y":8},{"x":13,"y":-6},{"x":14,"y":13},{"x":15,"y":-9},{"x":16,"y":19},{"x":17,"y":-18},{"x":18,"y":0},{"x":19,"y":0},{"x":20,"y":-3},{"x":21,"y":3},{"x":22,"y":3},{"x":23,"y":-6},{"x":24,"y":0},{"x":25,"y":4},{"x":26,"y":-15},{"x":27,"y":3},{"x":28,"y":-7},{"x":29,"y":29},{"x":30,"y":-9},{"x":31,"y":12},{"x":32,"y":-18},{"x":33,"y":4},{"x":34,"y":-3},{"x":35,"y":2},{"x":36,"y":-3},{"x":37,"y":-9},{"x":38,"y":27},{"x":39,"y":11},{"x":40,"y":-8},{"x":41,"y":-21},{"x":42,"y":9},{"x":43,"y":-4},{"x":44,"y":-2},{"x":45,"y":-8},{"x":46,"y":-12},{"x":47,"y":-1},{"x":48,"y":1},{"x":49,"y":-16},{"x":50,"y":7},{"x":51,"y":-7},{"x":52,"y":13},{"x":53,"y":16},{"x":54,"y":17},{"x":55,"y":-17},{"x":56,"y":1},{"x":57,"y":-4},{"x":58,"y":5},{"x":59,"y":5},{"x":60,"y":10},{"x":61,"y":7},{"x":62,"y":-13},{"x":63,"y":10},{"x":64,"y":-6},{"x":65,"y":15},{"x":66,"y":11},{"x":67,"y":-8},{"x":68,"y":-1},{"x":69,"y":-8},{"x":70,"y":-11},{"x":71,"y":15},{"x":72,"y":-7},{"x":73,"y":2},{"x":74,"y":6},{"x":75,"y":-6},{"x":76,"y":4},{"x":77,"y":11},{"x":78,"y":-10},{"x":79,"y":9},{"x":80,"y":-15},{"x":81,"y":-11},{"x":82,"y":2},{"x":83,"y":-6},{"x":84,"y":3},{"x":85,"y":-7},{"x":86,"y":15},{"x":87,"y":-4},{"x":88,"y":2},{"x":89,"y":11},{"x":90,"y":4},{"x":91,"y":10},{"x":92,"y":-13},{"x":93,"y":-8},{"x":94,"y":-7},{"x":95,"y":-4},{"x":96,"y":-5},{"x":97,"y":-8},{"x":98,"y":-11},{"x":99,"y":-6},{"x":100,"y":8},{"x":101,"y":5},{"x":102,"y":13},{"x":103,"y":12},{"x":104,"y":-38},{"x":105,"y":12},{"x":106,"y":-7},{"x":107,"y":-4},{"x":108,"y":19},{"x":109,"y":4},{"x":110,"y":20},{"x":111,"y":4},{"x":112,"y":9},{"x":113,"y":-20},{"x":114,"y":20},{"x":115,"y":-3},{"x":116,"y":5},{"x":117,"y":-11},{"x":118,"y":4},{"x":119,"y":16},{"x":120,"y":-11},{"x":121,"y":-8},{"x":122,"y":-36},{"x":123,"y":52},{"x":124,"y":-13},{"x":125,"y":11},{"x":126,"y":11},{"x":127,"y":-27},{"x":128,"y":-2},{"x":129,"y":9},{"x":130,"y":-26},{"x":131,"y":-1}],"geoms":["line"],"x":"index","y":"value"}

That flat, structureless line is the target this whole lesson has been working toward: a version of AirPassengers with the trend and the season both gone, ready for a model that assumes a stable mean and a stable autocorrelation structure.

=== step === concept
## The cost of over-differencing

It is tempting to think that if one difference helped, one more can only help further. It does not. Difference `D1d1` one more time, a third and unneeded difference, and see what happens.

Take one more difference of `D1d1` and compare its standard deviation and ACF against `D1d1` itself.

```r
# Difference D1d1 once more and compare standard deviation and ACF
air <- air |> mutate(over = difference(D1d1, lag = 1))
sd(air$D1d1, na.rm = TRUE)
#> [1] 12.35675
sd(air$over, na.rm = TRUE)
#> [1] 20.0723

round((air |> ACF(over, lag_max = 6))$acf, 3)
#> [1] -0.655  0.229 -0.073 -0.064  0.086 -0.001
```

The standard deviation rose, from 12.36 to 20.07, instead of dropping further. And the ACF at lag 1 is -0.655, a large negative spike where `D1d1` had almost nothing. Both are the signature of over-differencing: subtracting a difference the series did not need adds noise back in rather than removing any. The rule of thumb follows directly from this: stop differencing once `unitroot_nsdiffs()` and `unitroot_ndiffs()` both read 0, exactly the point `D1d1` reached in the last step.

See that ACF as a plot.

```r
# Plot the ACF of the over-differenced series
air |> ACF(over, lag_max = 6) |> autoplot()
```

=== step === concept
## How a differenced forecast is undone

Differencing is reversible. Undoing it, called integrating, is what turns a forecast made on a differenced scale back into real passenger counts, so it is worth seeing exactly how that works.

Undoing an ordinary difference is a running sum: start at the real first value, then add each difference back on top, one at a time. R's `cumsum()` does exactly that.

Reconstruct AirPassengers from `d1` and the real first value, then compare it against the original series.

```r
# Reconstruct AirPassengers from its ordinary difference and the real first value
reconstructed <- cumsum(c(air$passengers[1], air$d1[-1]))
length(reconstructed)
#> [1] 144
max(abs(reconstructed - air$passengers))
#> [1] 0

head(reconstructed, 5)
#> [1] 112 118 132 129 121
head(air$passengers, 5)
#> [1] 112 118 132 129 121
```

Every one of the 144 reconstructed values matches the original AirPassengers series exactly, maximum difference zero. That is what integrating means in practice: whatever a model forecasts on the differenced scale, summing those forecasts back onto a real starting value returns them to the original units, thousands of passengers a month.

=== step === quiz
## Quick check: reading three ACF signatures

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A towering spike at the seasonal lag, like `d1`'s 0.829 at lag 12, means under-differenced. Small values at every lag, like `D1d1`, mean correctly differenced. A large negative spike at lag 1 together with a rising standard deviation, like `over`'s -0.655 and 20.07, means over-differenced. ::ok Exactly. Each signature ties back to a specific cause: an untouched season stays a tall spike at the seasonal lag, a correctly differenced series has nothing left for the ACF to report, and over-differencing shows up as both a large negative lag-1 spike and a standard deviation that rose instead of fell.
- A large negative lag-1 spike together with a rising standard deviation means correctly differenced, and small values everywhere mean over-differenced. ::no
- Any ACF value outside the significance band, no matter which lag, means the series needs one more difference. ::no Which lag matters, not just whether a bar clears the band. A spike at the seasonal lag calls for a seasonal difference, small values throughout mean you are done, and a large negative lag-1 spike with a rising standard deviation means you already went one difference too far, so one more would make it worse, not better.

=== step === tryit
## Your turn: check the difference count, then undo it

`d1`, the once-differenced AirPassengers from a few steps back, is still sitting in your session. Run `unitroot_nsdiffs()` and `unitroot_ndiffs()` on it to see how many further differences it still needs. Then reconstruct the original series from `d1` to confirm the difference is reversible.

```r
# d1 is already in your session. Check how many more differences it needs
# with unitroot_nsdiffs() and unitroot_ndiffs(), then reconstruct the
# original series from d1 with cumsum(). Press Check when you have them.

```
::check {"regex": "(?=[\\s\\S]*unitroot_nsdiffs)(?=[\\s\\S]*unitroot_ndiffs)(?=[\\s\\S]*cumsum)(?=[\\s\\S]*features[(])", "gate": true, "difficulty": "intermediate", "ok": "Right: d1 still needs one seasonal difference (unitroot_nsdiffs reads 1) but no further ordinary difference (unitroot_ndiffs reads 0), and cumsum(c(air$passengers[1], air$d1[-1])) reconstructs all 144 original AirPassengers values exactly.", "no": "Call features() on d1 twice, once with unitroot_nsdiffs and once with unitroot_ndiffs, then reconstruct with cumsum(c(air$passengers[1], air$d1[-1]))."}
::solution
```r
# Check how many differences d1 still needs, then reconstruct the original series
air |> features(d1, unitroot_nsdiffs)
#> # A tibble: 1 × 1
#>   nsdiffs
#>     <int>
#> 1       1

air |> features(d1, unitroot_ndiffs)
#> # A tibble: 1 × 1
#>   ndiffs
#>    <int>
#> 1       0

reconstructed_from_d1 <- cumsum(c(air$passengers[1], air$d1[-1]))
max(abs(reconstructed_from_d1 - air$passengers))
#> [1] 0
```

`d1` already removed the trend, but the season is still there, which is exactly what `unitroot_nsdiffs()` reading 1 says: it still needs a seasonal difference, the same workflow this lesson used from the start. And an ordinary difference is exactly reversible: summing `d1` back onto the real first value recovers the original series exactly, the same integrating step from a couple of steps back.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/), section 9.1-9.2, Differencing - Hyndman and Athanasopoulos, the free online textbook and the source for the differencing and nsdiffs/ndiffs workflow taught here.
- [tsibble package reference](https://cran.r-project.org/package=tsibble) - documentation for `difference()`.
- [feasts package reference](https://pkg.robjhyndman.com/feasts/) - documentation for `unitroot_ndiffs()` and `unitroot_nsdiffs()`.
- R's AirPassengers dataset documentation (datasets package) - originally published in Box and Jenkins, "Time Series Analysis: Forecasting and Control" (1976).

=== step === complete
## What you can do now

You now have the whole chain, start to finish. Remove a trend with an ordinary difference, `difference(y, lag = 1)`. Remove a season the same way but at the seasonal lag, `difference(y, lag = 12)` for a monthly series. Check how many of each a series needs with `unitroot_nsdiffs()` and `unitroot_ndiffs()`, and confirm the result by eye with the ACF: a towering spike at the seasonal lag means more seasonal differencing is needed, small values everywhere means you are done, and a large negative spike at lag 1 with a rising standard deviation means you went one difference too far. And undo any of it by summing the differences back onto a real starting value.

Next, you will read the ACF together with a second plot, the PACF, and turn the shape of both straight into the AR and MA orders a model needs.
