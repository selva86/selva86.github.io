---
title: "Time Series Decomposition Lesson 1: Moving averages and classical decomposition"
catalog_blurb: "Learn how a moving average becomes the trend line inside every seasonal decomposition."
description: "Learn to compute a moving average by hand, build the 2x12-MA that centres an even season, and decompose AirPassengers into trend, season and random with feasts."
keywords: "moving average in R, centred moving average, classical decomposition, feasts classical_decomposition, trend seasonal random, 2x12 moving average, AirPassengers time series"
post_type: "LESSON"
curriculum_id: "5.20.1"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-decomposition"
course_title: "Time Series Decomposition"
course_lesson: "1"
course_total: "6"
course_landing: "Time-Series-Decomposition-Course.html"
course_next: "STL-Decomposition-in-Practice.html"
course_prev: ""
---

=== step === cover
## Moving averages and classical decomposition

Today let's understand how a time series gets pulled apart into a trend and a repeating seasonal pattern, using one real series.

AirPassengers is a classic dataset built into R: the monthly totals of international airline passengers worldwide, from January 1949 to December 1960, 144 months in all. Monthly totals range from 104 in the quietest month to 622 in the busiest.

Here is the whole series, plotted in the order the months actually happened.

::widget chart-plotter {"data":[{"x":1,"y":112},{"x":2,"y":118},{"x":3,"y":132},{"x":4,"y":129},{"x":5,"y":121},{"x":6,"y":135},{"x":7,"y":148},{"x":8,"y":148},{"x":9,"y":136},{"x":10,"y":119},{"x":11,"y":104},{"x":12,"y":118},{"x":13,"y":115},{"x":14,"y":126},{"x":15,"y":141},{"x":16,"y":135},{"x":17,"y":125},{"x":18,"y":149},{"x":19,"y":170},{"x":20,"y":170},{"x":21,"y":158},{"x":22,"y":133},{"x":23,"y":114},{"x":24,"y":140},{"x":25,"y":145},{"x":26,"y":150},{"x":27,"y":178},{"x":28,"y":163},{"x":29,"y":172},{"x":30,"y":178},{"x":31,"y":199},{"x":32,"y":199},{"x":33,"y":184},{"x":34,"y":162},{"x":35,"y":146},{"x":36,"y":166},{"x":37,"y":171},{"x":38,"y":180},{"x":39,"y":193},{"x":40,"y":181},{"x":41,"y":183},{"x":42,"y":218},{"x":43,"y":230},{"x":44,"y":242},{"x":45,"y":209},{"x":46,"y":191},{"x":47,"y":172},{"x":48,"y":194},{"x":49,"y":196},{"x":50,"y":196},{"x":51,"y":236},{"x":52,"y":235},{"x":53,"y":229},{"x":54,"y":243},{"x":55,"y":264},{"x":56,"y":272},{"x":57,"y":237},{"x":58,"y":211},{"x":59,"y":180},{"x":60,"y":201},{"x":61,"y":204},{"x":62,"y":188},{"x":63,"y":235},{"x":64,"y":227},{"x":65,"y":234},{"x":66,"y":264},{"x":67,"y":302},{"x":68,"y":293},{"x":69,"y":259},{"x":70,"y":229},{"x":71,"y":203},{"x":72,"y":229},{"x":73,"y":242},{"x":74,"y":233},{"x":75,"y":267},{"x":76,"y":269},{"x":77,"y":270},{"x":78,"y":315},{"x":79,"y":364},{"x":80,"y":347},{"x":81,"y":312},{"x":82,"y":274},{"x":83,"y":237},{"x":84,"y":278},{"x":85,"y":284},{"x":86,"y":277},{"x":87,"y":317},{"x":88,"y":313},{"x":89,"y":318},{"x":90,"y":374},{"x":91,"y":413},{"x":92,"y":405},{"x":93,"y":355},{"x":94,"y":306},{"x":95,"y":271},{"x":96,"y":306},{"x":97,"y":315},{"x":98,"y":301},{"x":99,"y":356},{"x":100,"y":348},{"x":101,"y":355},{"x":102,"y":422},{"x":103,"y":465},{"x":104,"y":467},{"x":105,"y":404},{"x":106,"y":347},{"x":107,"y":305},{"x":108,"y":336},{"x":109,"y":340},{"x":110,"y":318},{"x":111,"y":362},{"x":112,"y":348},{"x":113,"y":363},{"x":114,"y":435},{"x":115,"y":491},{"x":116,"y":505},{"x":117,"y":404},{"x":118,"y":359},{"x":119,"y":310},{"x":120,"y":337},{"x":121,"y":360},{"x":122,"y":342},{"x":123,"y":406},{"x":124,"y":396},{"x":125,"y":420},{"x":126,"y":472},{"x":127,"y":548},{"x":128,"y":559},{"x":129,"y":463},{"x":130,"y":407},{"x":131,"y":362},{"x":132,"y":405},{"x":133,"y":417},{"x":134,"y":391},{"x":135,"y":419},{"x":136,"y":461},{"x":137,"y":472},{"x":138,"y":535},{"x":139,"y":622},{"x":140,"y":606},{"x":141,"y":508},{"x":142,"y":461},{"x":143,"y":390},{"x":144,"y":432}],"geoms":["line"],"x":"month","y":"passengers"}

The line climbs across all twelve years, and every summer it rises to a peak, each one higher than the summer before. That climbing, repeating peak is the whole puzzle this lesson solves: how do you pull the steady climb apart from the repeating summer bump, so each can be looked at on its own?

=== step === concept
## What a centred moving average is, and how to compute one by hand

The trend in a series is its slow-moving overall level, with the season and the noise averaged out. The simplest way to estimate it is a moving average: replace each raw value with the average of the values around it.

A centred moving average of order m, written m-MA, averages the m raw values sitting symmetrically around a given month t. For m = 3, the 3-MA at month t averages month t-1, month t itself, and month t+1, one month on each side.

Take July 1949. Its raw value is 148. June 1949 is 135 and August 1949 is 148. Average those three and you pull the value down to about 143.67, a little below the raw 148 because June drags it lower.

Build this in R. First turn AirPassengers into a tsibble, the data structure feasts and tsibble expect, then compute the 3-MA by hand for the months around July 1949.

```r
# Compute a 3-month centred moving average by hand and compare it with the raw series
library(tsibble)
library(dplyr)

ap <- AirPassengers
air <- as_tsibble(ap) |> rename(Month = index, Passengers = value)

raw <- air$Passengers
n <- length(raw)
ma3 <- rep(NA, n)
for (t in 2:(n - 1)) {
  ma3[t] <- mean(raw[(t - 1):(t + 1)])
}
air <- air |> mutate(MA3 = round(ma3, 2))

air |> filter(Month >= yearmonth("1949 May"), Month <= yearmonth("1949 Sep"))
#> # A tsibble: 5 x 3 [1M]
#>      Month Passengers   MA3
#>      <mth>      <dbl> <dbl>
#> 1 1949 May        121  128.
#> 2 1949 Jun        135  135.
#> 3 1949 Jul        148  144.
#> 4 1949 Aug        148  144 
#> 5 1949 Sep        136  134.

air$MA3[7]
#> [1] 143.67
```

The table rounds its display to fit the column, so July's exact value shows up as 144. Pull that one number out on its own and the full figure comes back: 143.67. The loop above only runs from month 2 to month 143, one short of each end, because month 1 has no month before it to average with, and month 144 has no month after.

=== step === widget
## How much smoothing is too much?

A longer window pulls in more neighbouring months, so it smooths harder. But it also needs more real months on each side to compute, so it leaves more months without a value at either end of the series.

Compute the 7-month centred average at the same July 1949 point, and compare all three numbers side by side.

```r
# Compute a 7-month centred moving average at July 1949 and compare window widths
ma7_july <- mean(raw[4:10])
round(ma7_july, 2)
#> [1] 133.71

c(raw_july = raw[7], ma3_july = air$MA3[7], ma7_july = round(ma7_july, 2))
#> raw_july ma3_july ma7_july 
#>   148.00   143.67   133.71
```

The 7-MA pulls July down to 133.71, further from the raw 148 than the 3-MA's 143.67, because it now reaches three months out on each side instead of one. That is more smoothing. The cost sits at the edges: the 3-MA above only loses 1 month at the start and 1 at the end (it runs from month 2 to month 143 out of 144), while a 7-MA would lose 3 months at each end, because it needs 3 real months on each side to compute.

Window length in a moving average works exactly like the smoothness setting in another common smoothing tool, a spline. The widget below is a different, generic example, not AirPassengers itself, but it carries exactly the same trade-off you just computed by hand: too small a smoothing setting chases every wiggle in the data, too large a one flattens out the real bends underneath.

::widget spline-smoother {}

Move the slider from one end to the other. At the stiff end the fitted curve barely bends, the way a very long moving-average window would flatten a real turn in AirPassengers' level. At the flexible end it chases every wiggle, the way too short a window would. Somewhere in between it settles close to the true curve, the same middle ground a well-chosen window length gives a moving average.

=== step === concept
## Why an even order needs a second pass: the 2x12-MA

AirPassengers repeats its shape every 12 months, so the natural window for its trend is a 12-month average. But 12 is even, and that creates a problem odd windows like 3 and 7 never had.

Average months 1 through 12, all of 1949, and the result sits at time 6.5, halfway between June and July. It is not attached to any real month at all.

```r
# Average the first 12 months and see where the result actually sits
ma12_1 <- mean(raw[1:12])
round(ma12_1, 3)
#> [1] 126.667
```

Slide the window forward by one month, months 2 through 13, and you get a second 12-month average, this one sitting at time 7.5, halfway between July and August.

```r
# Slide the window one month forward
ma12_2 <- mean(raw[2:13])
round(ma12_2, 3)
#> [1] 126.917
```

Neither average lands on July. But average those two 12-month averages together, and the two half-months cancel out: 6.5 and 7.5 average to exactly 7, July itself.

```r
# Average the two 12-month averages to recentre the result on July
trend_july <- (ma12_1 + ma12_2) / 2
round(trend_july, 3)
#> [1] 126.792
```

This two-pass average is called a 2x12-MA: a 12-month average, taken twice and averaged together. It is the standard way to estimate a trend whenever the season repeats over an even number of periods, 12 months here (you would see a 2x4-MA for quarterly data, where the season repeats every 4 quarters).

The same 126.792 comes out of one 13-month weighted average instead, with the two end months getting half the weight of every month in between them.

\[
trend_t = \frac{1}{24}y_{t-6} + \frac{1}{12}\left(y_{t-5} + y_{t-4} + \cdots + y_{t+5}\right) + \frac{1}{24}y_{t+6}
\]

```r
# Confirm the same number as one 13-month weighted average
w <- c(1 / 24, rep(1 / 12, 11), 1 / 24)
sum(w * raw[1:13])
#> [1] 126.7917
```

And this is not just a coincidence of arithmetic. It is exactly what base R's own `decompose()` function computes for a trend.

```r
# Compare with base R's own decompose() trend at July 1949
decompose(ap)$trend[7]
#> [1] 126.7917
```

Same number, to four decimal places. Whatever computes a classical trend, `feasts` included, is doing this same two-pass average underneath.

=== step === quiz
## Quick check: why average two 12-month averages instead of one?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It smooths the series more thoroughly than a single 12-month average would. ::no
- A single 12-month average lands between two real months, and averaging two of them shifts the result onto one real month. ::ok Right. mean(raw[1:12]) sits at time 6.5, between June and July; mean(raw[2:13]) sits at time 7.5, between July and August. Average those two and the half-months cancel, landing exactly on July.
- feasts requires two passes before it will accept an even-length window. ::no
- It corrects for months of different lengths, since February is shorter than July. ::no None of these explain why 12 needs two passes. A single 12-month average always lands on a half-month, between two real months, because 12 is even. Averaging two consecutive 12-month averages is what shifts the result back onto one actual month, nothing about smoothing, package requirements or day counts.

=== step === concept
## Running classical_decomposition() and reading trend, seasonal and random

That two-pass average is exactly what `feasts`' `classical_decomposition()` computes for you, along with the season and whatever is left over. Fit it on the tsibble you already built, with `type = "additive"` telling it to assume the season adds a fixed number of passengers to the trend every month, rather than scaling it.

```r
# Fit the classical additive decomposition and inspect the first months
library(feasts)
library(fabletools)

fit_add <- air |> model(classical_decomposition(Passengers, type = "additive"))

comp_add <- fit_add |> components() |>
  as_tibble() |>
  select(Month, Passengers, trend, seasonal, random, season_adjust) |>
  mutate(across(trend:season_adjust, ~ round(.x, 1)))

comp_add
#> # A tibble: 144 x 6
#>       Month Passengers trend seasonal random season_adjust
#>       <mth>      <dbl> <dbl>    <dbl>  <dbl>         <dbl>
#>  1 1949 Jan        112   NA     -24.7   NA           137. 
#>  2 1949 Feb        118   NA     -36.2   NA           154. 
#>  3 1949 Mar        132   NA      -2.2   NA           134. 
#>  4 1949 Apr        129   NA      -8     NA           137  
#>  5 1949 May        121   NA      -4.5   NA           126. 
#>  6 1949 Jun        135   NA      35.4   NA            99.6
#>  7 1949 Jul        148  127.     63.8  -42.6          84.2
#>  8 1949 Aug        148  127.     62.8  -42.1          85.2
#>  9 1949 Sep        136  128      16.5   -8.5         120. 
#> 10 1949 Oct        119  129.    -20.6   11.1         140. 
#> # i 134 more rows
```

`components()` hands back four columns beyond the ones you already have. `trend` and `seasonal` you have just built by hand. `random` is whatever is left once trend and seasonal are taken out of the observed value. `season_adjust` is the observed series with only the seasonal part removed, trend and random still inside it.

Row 7, July 1949: trend reads 127 (rounded to one decimal for display; it is the same 126.792 you computed by hand). Its seasonal value is 63.8. Add trend and seasonal and subtract the small random leftover, 127 + 63.8 - 42.6, and you land back close to the raw 148.

Notice the first six rows show `NA` for trend and random. The 2x12-MA needs 6 real months on each side of a point to compute (it is really a 13-month window), so the first month it can reach is July 1949, row 7. The same thing happens at the other end of the series, on its last 6 months.

=== step === concept
## Choosing additive or multiplicative from how the season behaves

The additive decomposition you just ran assumes the summer bump adds a fixed number of passengers to the trend every year. Check whether that is actually true by comparing each year's range, its tallest month minus its shortest, against its average level.

```r
# Compare each year's range (max minus min) against its mean level
yr <- rep(1949:1960, each = 12)
yearly_range <- tapply(raw, yr, function(x) max(x) - min(x))
yearly_mean  <- tapply(raw, yr, mean)

round(c(range_1949 = unname(yearly_range["1949"]), range_1960 = unname(yearly_range["1960"]),
        mean_1949  = unname(yearly_mean["1949"]),  mean_1960  = unname(yearly_mean["1960"])))
#> range_1949 range_1960  mean_1949  mean_1960 
#>         44        232        127        476
```

In 1949 the range between the busiest and quietest month was 44, against a mean level of 127. By 1960 the mean level had grown to 476, and the range had grown right along with it, to 232. The summer bump is not a fixed number of extra passengers. It scales with however big the series has grown: about a third of the mean level in 1949, and closing in on half of it by 1960.

That is the sign to use a multiplicative decomposition instead: Passengers = trend x seasonal x random, where the seasonal term scales the trend rather than adding to it. Refit with `type = "multiplicative"` and compare July's seasonal value against the additive one you already have.

```r
# Refit with type = "multiplicative" and compare July's seasonal value both ways
fit_mul <- air |> model(classical_decomposition(Passengers, type = "multiplicative"))
comp_mul <- fit_mul |> components() |> as_tibble() |>
  mutate(across(trend:season_adjust, ~ round(.x, 3)))

comp_add$seasonal[7]
#> [1] 63.8

comp_mul$seasonal[7]
#> [1] 1.227
```

Read those two numbers in their own terms. The additive value, 63.8, says July adds 63.8 to the trend, every year, no matter how big the trend has grown. The multiplicative value, 1.227, says July multiplies the trend by 1.227, a 22.7% lift, and that lift applies whether the trend is 127 or 476. For a series whose seasonal swings grow with its level, the multiplicative number is the one that stays true from 1949 to 1960; the additive number would understate the swing in 1960 and overstate it in 1949.

=== step === widget
## Seeing the four components side by side

Passengers, trend, seasonal and random are the same four columns you have just been reading one row at a time. Seeing all 144 months of each one at once, side by side, makes clear what each is actually doing.

The widget below plots the multiplicative fit's four columns, either combined onto one chart or split into four small multiples, one panel per component.

::widget facet-grid {"data":[{"x":1,"y":112,"facet":"Observed"},{"x":2,"y":118,"facet":"Observed"},{"x":3,"y":132,"facet":"Observed"},{"x":4,"y":129,"facet":"Observed"},{"x":5,"y":121,"facet":"Observed"},{"x":6,"y":135,"facet":"Observed"},{"x":7,"y":148,"facet":"Observed"},{"x":8,"y":148,"facet":"Observed"},{"x":9,"y":136,"facet":"Observed"},{"x":10,"y":119,"facet":"Observed"},{"x":11,"y":104,"facet":"Observed"},{"x":12,"y":118,"facet":"Observed"},{"x":13,"y":115,"facet":"Observed"},{"x":14,"y":126,"facet":"Observed"},{"x":15,"y":141,"facet":"Observed"},{"x":16,"y":135,"facet":"Observed"},{"x":17,"y":125,"facet":"Observed"},{"x":18,"y":149,"facet":"Observed"},{"x":19,"y":170,"facet":"Observed"},{"x":20,"y":170,"facet":"Observed"},{"x":21,"y":158,"facet":"Observed"},{"x":22,"y":133,"facet":"Observed"},{"x":23,"y":114,"facet":"Observed"},{"x":24,"y":140,"facet":"Observed"},{"x":25,"y":145,"facet":"Observed"},{"x":26,"y":150,"facet":"Observed"},{"x":27,"y":178,"facet":"Observed"},{"x":28,"y":163,"facet":"Observed"},{"x":29,"y":172,"facet":"Observed"},{"x":30,"y":178,"facet":"Observed"},{"x":31,"y":199,"facet":"Observed"},{"x":32,"y":199,"facet":"Observed"},{"x":33,"y":184,"facet":"Observed"},{"x":34,"y":162,"facet":"Observed"},{"x":35,"y":146,"facet":"Observed"},{"x":36,"y":166,"facet":"Observed"},{"x":37,"y":171,"facet":"Observed"},{"x":38,"y":180,"facet":"Observed"},{"x":39,"y":193,"facet":"Observed"},{"x":40,"y":181,"facet":"Observed"},{"x":41,"y":183,"facet":"Observed"},{"x":42,"y":218,"facet":"Observed"},{"x":43,"y":230,"facet":"Observed"},{"x":44,"y":242,"facet":"Observed"},{"x":45,"y":209,"facet":"Observed"},{"x":46,"y":191,"facet":"Observed"},{"x":47,"y":172,"facet":"Observed"},{"x":48,"y":194,"facet":"Observed"},{"x":49,"y":196,"facet":"Observed"},{"x":50,"y":196,"facet":"Observed"},{"x":51,"y":236,"facet":"Observed"},{"x":52,"y":235,"facet":"Observed"},{"x":53,"y":229,"facet":"Observed"},{"x":54,"y":243,"facet":"Observed"},{"x":55,"y":264,"facet":"Observed"},{"x":56,"y":272,"facet":"Observed"},{"x":57,"y":237,"facet":"Observed"},{"x":58,"y":211,"facet":"Observed"},{"x":59,"y":180,"facet":"Observed"},{"x":60,"y":201,"facet":"Observed"},{"x":61,"y":204,"facet":"Observed"},{"x":62,"y":188,"facet":"Observed"},{"x":63,"y":235,"facet":"Observed"},{"x":64,"y":227,"facet":"Observed"},{"x":65,"y":234,"facet":"Observed"},{"x":66,"y":264,"facet":"Observed"},{"x":67,"y":302,"facet":"Observed"},{"x":68,"y":293,"facet":"Observed"},{"x":69,"y":259,"facet":"Observed"},{"x":70,"y":229,"facet":"Observed"},{"x":71,"y":203,"facet":"Observed"},{"x":72,"y":229,"facet":"Observed"},{"x":73,"y":242,"facet":"Observed"},{"x":74,"y":233,"facet":"Observed"},{"x":75,"y":267,"facet":"Observed"},{"x":76,"y":269,"facet":"Observed"},{"x":77,"y":270,"facet":"Observed"},{"x":78,"y":315,"facet":"Observed"},{"x":79,"y":364,"facet":"Observed"},{"x":80,"y":347,"facet":"Observed"},{"x":81,"y":312,"facet":"Observed"},{"x":82,"y":274,"facet":"Observed"},{"x":83,"y":237,"facet":"Observed"},{"x":84,"y":278,"facet":"Observed"},{"x":85,"y":284,"facet":"Observed"},{"x":86,"y":277,"facet":"Observed"},{"x":87,"y":317,"facet":"Observed"},{"x":88,"y":313,"facet":"Observed"},{"x":89,"y":318,"facet":"Observed"},{"x":90,"y":374,"facet":"Observed"},{"x":91,"y":413,"facet":"Observed"},{"x":92,"y":405,"facet":"Observed"},{"x":93,"y":355,"facet":"Observed"},{"x":94,"y":306,"facet":"Observed"},{"x":95,"y":271,"facet":"Observed"},{"x":96,"y":306,"facet":"Observed"},{"x":97,"y":315,"facet":"Observed"},{"x":98,"y":301,"facet":"Observed"},{"x":99,"y":356,"facet":"Observed"},{"x":100,"y":348,"facet":"Observed"},{"x":101,"y":355,"facet":"Observed"},{"x":102,"y":422,"facet":"Observed"},{"x":103,"y":465,"facet":"Observed"},{"x":104,"y":467,"facet":"Observed"},{"x":105,"y":404,"facet":"Observed"},{"x":106,"y":347,"facet":"Observed"},{"x":107,"y":305,"facet":"Observed"},{"x":108,"y":336,"facet":"Observed"},{"x":109,"y":340,"facet":"Observed"},{"x":110,"y":318,"facet":"Observed"},{"x":111,"y":362,"facet":"Observed"},{"x":112,"y":348,"facet":"Observed"},{"x":113,"y":363,"facet":"Observed"},{"x":114,"y":435,"facet":"Observed"},{"x":115,"y":491,"facet":"Observed"},{"x":116,"y":505,"facet":"Observed"},{"x":117,"y":404,"facet":"Observed"},{"x":118,"y":359,"facet":"Observed"},{"x":119,"y":310,"facet":"Observed"},{"x":120,"y":337,"facet":"Observed"},{"x":121,"y":360,"facet":"Observed"},{"x":122,"y":342,"facet":"Observed"},{"x":123,"y":406,"facet":"Observed"},{"x":124,"y":396,"facet":"Observed"},{"x":125,"y":420,"facet":"Observed"},{"x":126,"y":472,"facet":"Observed"},{"x":127,"y":548,"facet":"Observed"},{"x":128,"y":559,"facet":"Observed"},{"x":129,"y":463,"facet":"Observed"},{"x":130,"y":407,"facet":"Observed"},{"x":131,"y":362,"facet":"Observed"},{"x":132,"y":405,"facet":"Observed"},{"x":133,"y":417,"facet":"Observed"},{"x":134,"y":391,"facet":"Observed"},{"x":135,"y":419,"facet":"Observed"},{"x":136,"y":461,"facet":"Observed"},{"x":137,"y":472,"facet":"Observed"},{"x":138,"y":535,"facet":"Observed"},{"x":139,"y":622,"facet":"Observed"},{"x":140,"y":606,"facet":"Observed"},{"x":141,"y":508,"facet":"Observed"},{"x":142,"y":461,"facet":"Observed"},{"x":143,"y":390,"facet":"Observed"},{"x":144,"y":432,"facet":"Observed"},{"x":7,"y":126.792,"facet":"Trend"},{"x":8,"y":127.25,"facet":"Trend"},{"x":9,"y":127.958,"facet":"Trend"},{"x":10,"y":128.583,"facet":"Trend"},{"x":11,"y":129,"facet":"Trend"},{"x":12,"y":129.75,"facet":"Trend"},{"x":13,"y":131.25,"facet":"Trend"},{"x":14,"y":133.083,"facet":"Trend"},{"x":15,"y":134.917,"facet":"Trend"},{"x":16,"y":136.417,"facet":"Trend"},{"x":17,"y":137.417,"facet":"Trend"},{"x":18,"y":138.75,"facet":"Trend"},{"x":19,"y":140.917,"facet":"Trend"},{"x":20,"y":143.167,"facet":"Trend"},{"x":21,"y":145.708,"facet":"Trend"},{"x":22,"y":148.417,"facet":"Trend"},{"x":23,"y":151.542,"facet":"Trend"},{"x":24,"y":154.708,"facet":"Trend"},{"x":25,"y":157.125,"facet":"Trend"},{"x":26,"y":159.542,"facet":"Trend"},{"x":27,"y":161.833,"facet":"Trend"},{"x":28,"y":164.125,"facet":"Trend"},{"x":29,"y":166.667,"facet":"Trend"},{"x":30,"y":169.083,"facet":"Trend"},{"x":31,"y":171.25,"facet":"Trend"},{"x":32,"y":173.583,"facet":"Trend"},{"x":33,"y":175.458,"facet":"Trend"},{"x":34,"y":176.833,"facet":"Trend"},{"x":35,"y":178.042,"facet":"Trend"},{"x":36,"y":180.167,"facet":"Trend"},{"x":37,"y":183.125,"facet":"Trend"},{"x":38,"y":186.208,"facet":"Trend"},{"x":39,"y":189.042,"facet":"Trend"},{"x":40,"y":191.292,"facet":"Trend"},{"x":41,"y":193.583,"facet":"Trend"},{"x":42,"y":195.833,"facet":"Trend"},{"x":43,"y":198.042,"facet":"Trend"},{"x":44,"y":199.75,"facet":"Trend"},{"x":45,"y":202.208,"facet":"Trend"},{"x":46,"y":206.25,"facet":"Trend"},{"x":47,"y":210.417,"facet":"Trend"},{"x":48,"y":213.375,"facet":"Trend"},{"x":49,"y":215.833,"facet":"Trend"},{"x":50,"y":218.5,"facet":"Trend"},{"x":51,"y":220.917,"facet":"Trend"},{"x":52,"y":222.917,"facet":"Trend"},{"x":53,"y":224.083,"facet":"Trend"},{"x":54,"y":224.708,"facet":"Trend"},{"x":55,"y":225.333,"facet":"Trend"},{"x":56,"y":225.333,"facet":"Trend"},{"x":57,"y":224.958,"facet":"Trend"},{"x":58,"y":224.583,"facet":"Trend"},{"x":59,"y":224.458,"facet":"Trend"},{"x":60,"y":225.542,"facet":"Trend"},{"x":61,"y":228,"facet":"Trend"},{"x":62,"y":230.458,"facet":"Trend"},{"x":63,"y":232.25,"facet":"Trend"},{"x":64,"y":233.917,"facet":"Trend"},{"x":65,"y":235.625,"facet":"Trend"},{"x":66,"y":237.75,"facet":"Trend"},{"x":67,"y":240.5,"facet":"Trend"},{"x":68,"y":243.958,"facet":"Trend"},{"x":69,"y":247.167,"facet":"Trend"},{"x":70,"y":250.25,"facet":"Trend"},{"x":71,"y":253.5,"facet":"Trend"},{"x":72,"y":257.125,"facet":"Trend"},{"x":73,"y":261.833,"facet":"Trend"},{"x":74,"y":266.667,"facet":"Trend"},{"x":75,"y":271.125,"facet":"Trend"},{"x":76,"y":275.208,"facet":"Trend"},{"x":77,"y":278.5,"facet":"Trend"},{"x":78,"y":281.958,"facet":"Trend"},{"x":79,"y":285.75,"facet":"Trend"},{"x":80,"y":289.333,"facet":"Trend"},{"x":81,"y":293.25,"facet":"Trend"},{"x":82,"y":297.167,"facet":"Trend"},{"x":83,"y":301,"facet":"Trend"},{"x":84,"y":305.458,"facet":"Trend"},{"x":85,"y":309.958,"facet":"Trend"},{"x":86,"y":314.417,"facet":"Trend"},{"x":87,"y":318.625,"facet":"Trend"},{"x":88,"y":321.75,"facet":"Trend"},{"x":89,"y":324.5,"facet":"Trend"},{"x":90,"y":327.083,"facet":"Trend"},{"x":91,"y":329.542,"facet":"Trend"},{"x":92,"y":331.833,"facet":"Trend"},{"x":93,"y":334.458,"facet":"Trend"},{"x":94,"y":337.542,"facet":"Trend"},{"x":95,"y":340.542,"facet":"Trend"},{"x":96,"y":344.083,"facet":"Trend"},{"x":97,"y":348.25,"facet":"Trend"},{"x":98,"y":353,"facet":"Trend"},{"x":99,"y":357.625,"facet":"Trend"},{"x":100,"y":361.375,"facet":"Trend"},{"x":101,"y":364.5,"facet":"Trend"},{"x":102,"y":367.167,"facet":"Trend"},{"x":103,"y":369.458,"facet":"Trend"},{"x":104,"y":371.208,"facet":"Trend"},{"x":105,"y":372.167,"facet":"Trend"},{"x":106,"y":372.417,"facet":"Trend"},{"x":107,"y":372.75,"facet":"Trend"},{"x":108,"y":373.625,"facet":"Trend"},{"x":109,"y":375.25,"facet":"Trend"},{"x":110,"y":377.917,"facet":"Trend"},{"x":111,"y":379.5,"facet":"Trend"},{"x":112,"y":380,"facet":"Trend"},{"x":113,"y":380.708,"facet":"Trend"},{"x":114,"y":380.958,"facet":"Trend"},{"x":115,"y":381.833,"facet":"Trend"},{"x":116,"y":383.667,"facet":"Trend"},{"x":117,"y":386.5,"facet":"Trend"},{"x":118,"y":390.333,"facet":"Trend"},{"x":119,"y":394.708,"facet":"Trend"},{"x":120,"y":398.625,"facet":"Trend"},{"x":121,"y":402.542,"facet":"Trend"},{"x":122,"y":407.167,"facet":"Trend"},{"x":123,"y":411.875,"facet":"Trend"},{"x":124,"y":416.333,"facet":"Trend"},{"x":125,"y":420.5,"facet":"Trend"},{"x":126,"y":425.5,"facet":"Trend"},{"x":127,"y":430.708,"facet":"Trend"},{"x":128,"y":435.125,"facet":"Trend"},{"x":129,"y":437.708,"facet":"Trend"},{"x":130,"y":440.958,"facet":"Trend"},{"x":131,"y":445.833,"facet":"Trend"},{"x":132,"y":450.625,"facet":"Trend"},{"x":133,"y":456.333,"facet":"Trend"},{"x":134,"y":461.375,"facet":"Trend"},{"x":135,"y":465.208,"facet":"Trend"},{"x":136,"y":469.333,"facet":"Trend"},{"x":137,"y":472.75,"facet":"Trend"},{"x":138,"y":475.042,"facet":"Trend"},{"x":1,"y":0.91,"facet":"Seasonal"},{"x":2,"y":0.884,"facet":"Seasonal"},{"x":3,"y":1.007,"facet":"Seasonal"},{"x":4,"y":0.976,"facet":"Seasonal"},{"x":5,"y":0.981,"facet":"Seasonal"},{"x":6,"y":1.113,"facet":"Seasonal"},{"x":7,"y":1.227,"facet":"Seasonal"},{"x":8,"y":1.22,"facet":"Seasonal"},{"x":9,"y":1.06,"facet":"Seasonal"},{"x":10,"y":0.922,"facet":"Seasonal"},{"x":11,"y":0.801,"facet":"Seasonal"},{"x":12,"y":0.899,"facet":"Seasonal"},{"x":13,"y":0.91,"facet":"Seasonal"},{"x":14,"y":0.884,"facet":"Seasonal"},{"x":15,"y":1.007,"facet":"Seasonal"},{"x":16,"y":0.976,"facet":"Seasonal"},{"x":17,"y":0.981,"facet":"Seasonal"},{"x":18,"y":1.113,"facet":"Seasonal"},{"x":19,"y":1.227,"facet":"Seasonal"},{"x":20,"y":1.22,"facet":"Seasonal"},{"x":21,"y":1.06,"facet":"Seasonal"},{"x":22,"y":0.922,"facet":"Seasonal"},{"x":23,"y":0.801,"facet":"Seasonal"},{"x":24,"y":0.899,"facet":"Seasonal"},{"x":25,"y":0.91,"facet":"Seasonal"},{"x":26,"y":0.884,"facet":"Seasonal"},{"x":27,"y":1.007,"facet":"Seasonal"},{"x":28,"y":0.976,"facet":"Seasonal"},{"x":29,"y":0.981,"facet":"Seasonal"},{"x":30,"y":1.113,"facet":"Seasonal"},{"x":31,"y":1.227,"facet":"Seasonal"},{"x":32,"y":1.22,"facet":"Seasonal"},{"x":33,"y":1.06,"facet":"Seasonal"},{"x":34,"y":0.922,"facet":"Seasonal"},{"x":35,"y":0.801,"facet":"Seasonal"},{"x":36,"y":0.899,"facet":"Seasonal"},{"x":37,"y":0.91,"facet":"Seasonal"},{"x":38,"y":0.884,"facet":"Seasonal"},{"x":39,"y":1.007,"facet":"Seasonal"},{"x":40,"y":0.976,"facet":"Seasonal"},{"x":41,"y":0.981,"facet":"Seasonal"},{"x":42,"y":1.113,"facet":"Seasonal"},{"x":43,"y":1.227,"facet":"Seasonal"},{"x":44,"y":1.22,"facet":"Seasonal"},{"x":45,"y":1.06,"facet":"Seasonal"},{"x":46,"y":0.922,"facet":"Seasonal"},{"x":47,"y":0.801,"facet":"Seasonal"},{"x":48,"y":0.899,"facet":"Seasonal"},{"x":49,"y":0.91,"facet":"Seasonal"},{"x":50,"y":0.884,"facet":"Seasonal"},{"x":51,"y":1.007,"facet":"Seasonal"},{"x":52,"y":0.976,"facet":"Seasonal"},{"x":53,"y":0.981,"facet":"Seasonal"},{"x":54,"y":1.113,"facet":"Seasonal"},{"x":55,"y":1.227,"facet":"Seasonal"},{"x":56,"y":1.22,"facet":"Seasonal"},{"x":57,"y":1.06,"facet":"Seasonal"},{"x":58,"y":0.922,"facet":"Seasonal"},{"x":59,"y":0.801,"facet":"Seasonal"},{"x":60,"y":0.899,"facet":"Seasonal"},{"x":61,"y":0.91,"facet":"Seasonal"},{"x":62,"y":0.884,"facet":"Seasonal"},{"x":63,"y":1.007,"facet":"Seasonal"},{"x":64,"y":0.976,"facet":"Seasonal"},{"x":65,"y":0.981,"facet":"Seasonal"},{"x":66,"y":1.113,"facet":"Seasonal"},{"x":67,"y":1.227,"facet":"Seasonal"},{"x":68,"y":1.22,"facet":"Seasonal"},{"x":69,"y":1.06,"facet":"Seasonal"},{"x":70,"y":0.922,"facet":"Seasonal"},{"x":71,"y":0.801,"facet":"Seasonal"},{"x":72,"y":0.899,"facet":"Seasonal"},{"x":73,"y":0.91,"facet":"Seasonal"},{"x":74,"y":0.884,"facet":"Seasonal"},{"x":75,"y":1.007,"facet":"Seasonal"},{"x":76,"y":0.976,"facet":"Seasonal"},{"x":77,"y":0.981,"facet":"Seasonal"},{"x":78,"y":1.113,"facet":"Seasonal"},{"x":79,"y":1.227,"facet":"Seasonal"},{"x":80,"y":1.22,"facet":"Seasonal"},{"x":81,"y":1.06,"facet":"Seasonal"},{"x":82,"y":0.922,"facet":"Seasonal"},{"x":83,"y":0.801,"facet":"Seasonal"},{"x":84,"y":0.899,"facet":"Seasonal"},{"x":85,"y":0.91,"facet":"Seasonal"},{"x":86,"y":0.884,"facet":"Seasonal"},{"x":87,"y":1.007,"facet":"Seasonal"},{"x":88,"y":0.976,"facet":"Seasonal"},{"x":89,"y":0.981,"facet":"Seasonal"},{"x":90,"y":1.113,"facet":"Seasonal"},{"x":91,"y":1.227,"facet":"Seasonal"},{"x":92,"y":1.22,"facet":"Seasonal"},{"x":93,"y":1.06,"facet":"Seasonal"},{"x":94,"y":0.922,"facet":"Seasonal"},{"x":95,"y":0.801,"facet":"Seasonal"},{"x":96,"y":0.899,"facet":"Seasonal"},{"x":97,"y":0.91,"facet":"Seasonal"},{"x":98,"y":0.884,"facet":"Seasonal"},{"x":99,"y":1.007,"facet":"Seasonal"},{"x":100,"y":0.976,"facet":"Seasonal"},{"x":101,"y":0.981,"facet":"Seasonal"},{"x":102,"y":1.113,"facet":"Seasonal"},{"x":103,"y":1.227,"facet":"Seasonal"},{"x":104,"y":1.22,"facet":"Seasonal"},{"x":105,"y":1.06,"facet":"Seasonal"},{"x":106,"y":0.922,"facet":"Seasonal"},{"x":107,"y":0.801,"facet":"Seasonal"},{"x":108,"y":0.899,"facet":"Seasonal"},{"x":109,"y":0.91,"facet":"Seasonal"},{"x":110,"y":0.884,"facet":"Seasonal"},{"x":111,"y":1.007,"facet":"Seasonal"},{"x":112,"y":0.976,"facet":"Seasonal"},{"x":113,"y":0.981,"facet":"Seasonal"},{"x":114,"y":1.113,"facet":"Seasonal"},{"x":115,"y":1.227,"facet":"Seasonal"},{"x":116,"y":1.22,"facet":"Seasonal"},{"x":117,"y":1.06,"facet":"Seasonal"},{"x":118,"y":0.922,"facet":"Seasonal"},{"x":119,"y":0.801,"facet":"Seasonal"},{"x":120,"y":0.899,"facet":"Seasonal"},{"x":121,"y":0.91,"facet":"Seasonal"},{"x":122,"y":0.884,"facet":"Seasonal"},{"x":123,"y":1.007,"facet":"Seasonal"},{"x":124,"y":0.976,"facet":"Seasonal"},{"x":125,"y":0.981,"facet":"Seasonal"},{"x":126,"y":1.113,"facet":"Seasonal"},{"x":127,"y":1.227,"facet":"Seasonal"},{"x":128,"y":1.22,"facet":"Seasonal"},{"x":129,"y":1.06,"facet":"Seasonal"},{"x":130,"y":0.922,"facet":"Seasonal"},{"x":131,"y":0.801,"facet":"Seasonal"},{"x":132,"y":0.899,"facet":"Seasonal"},{"x":133,"y":0.91,"facet":"Seasonal"},{"x":134,"y":0.884,"facet":"Seasonal"},{"x":135,"y":1.007,"facet":"Seasonal"},{"x":136,"y":0.976,"facet":"Seasonal"},{"x":137,"y":0.981,"facet":"Seasonal"},{"x":138,"y":1.113,"facet":"Seasonal"},{"x":139,"y":1.227,"facet":"Seasonal"},{"x":140,"y":1.22,"facet":"Seasonal"},{"x":141,"y":1.06,"facet":"Seasonal"},{"x":142,"y":0.922,"facet":"Seasonal"},{"x":143,"y":0.801,"facet":"Seasonal"},{"x":144,"y":0.899,"facet":"Seasonal"},{"x":7,"y":0.952,"facet":"Random"},{"x":8,"y":0.953,"facet":"Random"},{"x":9,"y":1.002,"facet":"Random"},{"x":10,"y":1.004,"facet":"Random"},{"x":11,"y":1.006,"facet":"Random"},{"x":12,"y":1.012,"facet":"Random"},{"x":13,"y":0.963,"facet":"Random"},{"x":14,"y":1.071,"facet":"Random"},{"x":15,"y":1.037,"facet":"Random"},{"x":16,"y":1.014,"facet":"Random"},{"x":17,"y":0.927,"facet":"Random"},{"x":18,"y":0.965,"facet":"Random"},{"x":19,"y":0.984,"facet":"Random"},{"x":20,"y":0.973,"facet":"Random"},{"x":21,"y":1.023,"facet":"Random"},{"x":22,"y":0.972,"facet":"Random"},{"x":23,"y":0.939,"facet":"Random"},{"x":24,"y":1.007,"facet":"Random"},{"x":25,"y":1.014,"facet":"Random"},{"x":26,"y":1.064,"facet":"Random"},{"x":27,"y":1.092,"facet":"Random"},{"x":28,"y":1.018,"facet":"Random"},{"x":29,"y":1.052,"facet":"Random"},{"x":30,"y":0.946,"facet":"Random"},{"x":31,"y":0.947,"facet":"Random"},{"x":32,"y":0.94,"facet":"Random"},{"x":33,"y":0.989,"facet":"Random"},{"x":34,"y":0.994,"facet":"Random"},{"x":35,"y":1.024,"facet":"Random"},{"x":36,"y":1.025,"facet":"Random"},{"x":37,"y":1.026,"facet":"Random"},{"x":38,"y":1.094,"facet":"Random"},{"x":39,"y":1.013,"facet":"Random"},{"x":40,"y":0.97,"facet":"Random"},{"x":41,"y":0.963,"facet":"Random"},{"x":42,"y":1,"facet":"Random"},{"x":43,"y":0.947,"facet":"Random"},{"x":44,"y":0.993,"facet":"Random"},{"x":45,"y":0.975,"facet":"Random"},{"x":46,"y":1.005,"facet":"Random"},{"x":47,"y":1.02,"facet":"Random"},{"x":48,"y":1.012,"facet":"Random"},{"x":49,"y":0.998,"facet":"Random"},{"x":50,"y":1.015,"facet":"Random"},{"x":51,"y":1.06,"facet":"Random"},{"x":52,"y":1.08,"facet":"Random"},{"x":53,"y":1.041,"facet":"Random"},{"x":54,"y":0.972,"facet":"Random"},{"x":55,"y":0.955,"facet":"Random"},{"x":56,"y":0.989,"facet":"Random"},{"x":57,"y":0.993,"facet":"Random"},{"x":58,"y":1.019,"facet":"Random"},{"x":59,"y":1.001,"facet":"Random"},{"x":60,"y":0.992,"facet":"Random"},{"x":61,"y":0.983,"facet":"Random"},{"x":62,"y":0.923,"facet":"Random"},{"x":63,"y":1.004,"facet":"Random"},{"x":64,"y":0.994,"facet":"Random"},{"x":65,"y":1.012,"facet":"Random"},{"x":66,"y":0.998,"facet":"Random"},{"x":67,"y":1.024,"facet":"Random"},{"x":68,"y":0.985,"facet":"Random"},{"x":69,"y":0.988,"facet":"Random"},{"x":70,"y":0.993,"facet":"Random"},{"x":71,"y":1,"facet":"Random"},{"x":72,"y":0.991,"facet":"Random"},{"x":73,"y":1.015,"facet":"Random"},{"x":74,"y":0.989,"facet":"Random"},{"x":75,"y":0.978,"facet":"Random"},{"x":76,"y":1.002,"facet":"Random"},{"x":77,"y":0.988,"facet":"Random"},{"x":78,"y":1.004,"facet":"Random"},{"x":79,"y":1.039,"facet":"Random"},{"x":80,"y":0.983,"facet":"Random"},{"x":81,"y":1.003,"facet":"Random"},{"x":82,"y":1,"facet":"Random"},{"x":83,"y":0.983,"facet":"Random"},{"x":84,"y":1.013,"facet":"Random"},{"x":85,"y":1.007,"facet":"Random"},{"x":86,"y":0.997,"facet":"Random"},{"x":87,"y":0.988,"facet":"Random"},{"x":88,"y":0.997,"facet":"Random"},{"x":89,"y":0.999,"facet":"Random"},{"x":90,"y":1.028,"facet":"Random"},{"x":91,"y":1.022,"facet":"Random"},{"x":92,"y":1,"facet":"Random"},{"x":93,"y":1.001,"facet":"Random"},{"x":94,"y":0.984,"facet":"Random"},{"x":95,"y":0.993,"facet":"Random"},{"x":96,"y":0.989,"facet":"Random"},{"x":97,"y":0.994,"facet":"Random"},{"x":98,"y":0.965,"facet":"Random"},{"x":99,"y":0.988,"facet":"Random"},{"x":100,"y":0.987,"facet":"Random"},{"x":101,"y":0.992,"facet":"Random"},{"x":102,"y":1.033,"facet":"Random"},{"x":103,"y":1.026,"facet":"Random"},{"x":104,"y":1.031,"facet":"Random"},{"x":105,"y":1.024,"facet":"Random"},{"x":106,"y":1.011,"facet":"Random"},{"x":107,"y":1.021,"facet":"Random"},{"x":108,"y":1.001,"facet":"Random"},{"x":109,"y":0.995,"facet":"Random"},{"x":110,"y":0.952,"facet":"Random"},{"x":111,"y":0.947,"facet":"Random"},{"x":112,"y":0.938,"facet":"Random"},{"x":113,"y":0.972,"facet":"Random"},{"x":114,"y":1.026,"facet":"Random"},{"x":115,"y":1.048,"facet":"Random"},{"x":116,"y":1.079,"facet":"Random"},{"x":117,"y":0.986,"facet":"Random"},{"x":118,"y":0.998,"facet":"Random"},{"x":119,"y":0.98,"facet":"Random"},{"x":120,"y":0.941,"facet":"Random"},{"x":121,"y":0.983,"facet":"Random"},{"x":122,"y":0.951,"facet":"Random"},{"x":123,"y":0.979,"facet":"Random"},{"x":124,"y":0.975,"facet":"Random"},{"x":125,"y":1.018,"facet":"Random"},{"x":126,"y":0.997,"facet":"Random"},{"x":127,"y":1.037,"facet":"Random"},{"x":128,"y":1.053,"facet":"Random"},{"x":129,"y":0.997,"facet":"Random"},{"x":130,"y":1.001,"facet":"Random"},{"x":131,"y":1.013,"facet":"Random"},{"x":132,"y":1,"facet":"Random"},{"x":133,"y":1.004,"facet":"Random"},{"x":134,"y":0.959,"facet":"Random"},{"x":135,"y":0.894,"facet":"Random"},{"x":136,"y":1.006,"facet":"Random"},{"x":137,"y":1.017,"facet":"Random"},{"x":138,"y":1.012,"facet":"Random"}],"geom":"line","x":"Month","y":"Value","facetVar":"Component"}

In the combined view, Passengers sits in the hundreds while Seasonal sits between about 0.8 and 1.23, so the two are hard to read against each other on one scale. Switch to facet_wrap(~Component) and each gets its own panel with its own scale. Trend climbs smoothly with no summer bumps left in it, because the moving average already averaged them away. Seasonal repeats the identical 12-month shape every single year, in effect one flat curve traced twelve times over. Random sits close to 1 the whole way through, the small multiplicative leftover once trend and seasonal are divided back out of Passengers.

=== step === concept
## What each component means, and where classical decomposition falls short
::prose-only ties every components() column and its NA edges, already computed and plotted in the previous steps, to its name and its real limitation; no new computation

Put a name to each of the four columns you have now computed, plotted and compared.

- **Trend** is the smoothed level of the series, with season and noise averaged away by the 2x12-MA. It has no value for the first 6 or the last 6 months of any series, because the 2x12-MA needs 6 real months on each side of a point to compute.
- **Seasonal** is the repeating calendar effect. For AirPassengers it comes out to the exact same number every July, the exact same number every August, and so on, unchanged from 1949 all the way to 1960.
- **Random** is whatever trend and seasonal cannot explain, whatever is left over once both are divided (or subtracted) out.
- **season_adjust** is the observed series with only the seasonal part taken out, trend and random still inside it.

That fixed, repeating seasonal number is also the method's real limit. AirPassengers' summer bump keeping exactly the same shape for twelve straight years is a convenient property of a textbook series. A real series's season can drift, a slightly earlier peak one year, a slightly later one the next, and classical decomposition has no way to show that drift, because it assumes one fixed repeating shape for the whole series. And because the 2x12-MA needs 6 months on each side to compute, classical decomposition can never estimate a trend at either end of any series, however long that series runs.

=== step === quiz
## Quick check: additive or multiplicative, and what each component says

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Additive, because the range is still measured in raw passenger counts in both years. ::no
- Multiplicative, because the range grows in step with the mean rather than staying fixed; random is whatever trend and seasonal do not explain. ::ok Right. The range went from 44 (a mean of 127) to 232 (a mean of 476), growing from about a third of the mean to close to half of it, so the season scales with the level rather than staying fixed. That is the multiplicative case, and random is always whatever is left over once trend and seasonal are accounted for.
- Multiplicative, but random is the repeating July-to-July seasonal pattern itself. ::no
- Additive, because trend and seasonal already explain the growing range on their own. ::no Multiplicative is right, the range grew in step with the mean rather than staying fixed. But random is never the seasonal pattern; seasonal already is the repeating calendar effect. Random is whatever trend and seasonal leave unexplained.

=== step === tryit
## Your turn: decompose the series and read one value

`air` still holds the AirPassengers tsibble, with columns `Month` and `Passengers`. Fit a multiplicative decomposition on it yourself, the same way you did two steps ago, then pull its components out and read off the trend value at row 7, July 1949. Check it against the 126.792 you already worked out by hand.

```r
# air already holds the AirPassengers tsibble with columns Month and Passengers.
# 1. Fit model(air, classical_decomposition(Passengers, type = "multiplicative")).
# 2. Pull out components() from that fit.
# Press Check when you have both.
```
::check {"regex": "(?=[\\s\\S]*classical_decomposition[(])(?=[\\s\\S]*components[(])[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Right: components()$trend at row 7 reads 126.7917, the same 2x12-MA you worked out by hand, and components()$seasonal at row 7 reads about 1.227, a 22.7% July lift.", "no": "Two calls: model(air, classical_decomposition(Passengers, type = \"multiplicative\")) to fit it, then components() on that fit to pull out trend, seasonal, random and season_adjust."}
::solution
```r
# Fit the multiplicative decomposition and read off trend and seasonal at July 1949
fit_check <- air |> model(classical_decomposition(Passengers, type = "multiplicative"))
comp_check <- fit_check |> components()

comp_check$trend[7]
#> [1] 126.7917
comp_check$seasonal[7]
#> [1] 1.226556
```

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.), section 3.4 "Classical decomposition"](https://otexts.com/fpp3/classical-decomposition.html) - Hyndman, R.J. & Athanasopoulos, G., OTexts. The textbook treatment of the two-pass moving average this lesson builds by hand.
- [stats::decompose() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/decompose.html) - R Core Team, base R. The function this lesson's hand computation was checked against.
- [feasts::classical_decomposition() reference](https://feasts.tidyverts.org/reference/classical_decomposition.html) - the feasts package documentation for the function fit throughout this lesson.
- Box, G.E.P., Jenkins, G.M. & Reinsel, G.C., "Time Series Analysis: Forecasting and Control" - the source of the AirPassengers series used throughout this lesson.
- [tsibble::as_tsibble() documentation](https://tsibble.tidyverts.org/reference/as-tsibble.html) - the tsibble package documentation for converting a ts object to a tsibble.

=== step === complete
## Quick recap

You pulled AirPassengers apart into a trend, a season and a random leftover, and you know exactly how each number in that decomposition came to be.

- A centred moving average replaces each value with the average of its neighbours; a longer window smooths harder but loses more months at each end.
- An even season, 12 months here, needs two passes: two 12-month averages, themselves averaged, to land the result back on a real month. That 2x12-MA is exactly what `decompose()` and `classical_decomposition()` compute for a trend.
- Additive assumes the season adds a fixed number every year; multiplicative assumes it scales the trend by a fixed proportion. AirPassengers' seasonal swing grew from 44 to 232 right alongside its mean, so multiplicative was the right call, a 22.7% July lift that held from 1949 to 1960.
- `trend`, `seasonal`, `random` and `season_adjust` are the four columns `components()` returns, and you can now name what each one measures.
- Classical decomposition's season never changes shape year to year, and it cannot estimate a trend at either end of a series. The next part covers STL, which relaxes both of those limits.
