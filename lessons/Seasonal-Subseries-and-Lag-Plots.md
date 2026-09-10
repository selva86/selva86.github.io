---
title: "Time Series Foundations Lesson 5: Seasonal, subseries and lag plots"
catalog_blurb: "See whether your season is stable, drifting, or hiding real dependence."
description: "Learn gg_season(), gg_subseries() and gg_lag() in R to check if a seasonal pattern is stable, spot a drifting quarter, and read a lag plot for dependence."
keywords: "gg_season, gg_subseries, gg_lag, seasonal subseries plot, lag plot in R, feasts package R, seasonal plot R, time series dependence"
post_type: "LESSON"
curriculum_id: "5.10.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ts-foundations"
course_title: "Time Series Foundations"
course_lesson: "5"
course_total: "8"
course_landing: "Time-Series-Foundations-Course.html"
course_next: "Autocorrelation-and-the-ACF.html"
course_prev: "EDA-for-Time-Series.html"
---

=== step === cover
## Seasonal, subseries and lag plots

Today let's understand three plots that check something a single line chart cannot show you: whether a season repeats the exact same way every year, whether one quarter is quietly drifting away from the rest, and whether a value depends on what came before it.

Here is the running example for the whole lesson: quarterly beer production in Australia, from 1992 Q1 to 2010 Q2, in megalitres (a megalitre is a million litres). That's 74 quarters, published by the Australian Bureau of Statistics. Here is the whole series, plotted once, in full.

::widget chart-plotter {"data":[{"x":1,"y":443},{"x":2,"y":410},{"x":3,"y":420},{"x":4,"y":532},{"x":5,"y":433},{"x":6,"y":421},{"x":7,"y":410},{"x":8,"y":512},{"x":9,"y":449},{"x":10,"y":381},{"x":11,"y":423},{"x":12,"y":531},{"x":13,"y":426},{"x":14,"y":408},{"x":15,"y":416},{"x":16,"y":520},{"x":17,"y":409},{"x":18,"y":398},{"x":19,"y":398},{"x":20,"y":507},{"x":21,"y":432},{"x":22,"y":398},{"x":23,"y":406},{"x":24,"y":526},{"x":25,"y":428},{"x":26,"y":397},{"x":27,"y":403},{"x":28,"y":517},{"x":29,"y":435},{"x":30,"y":383},{"x":31,"y":424},{"x":32,"y":521},{"x":33,"y":421},{"x":34,"y":402},{"x":35,"y":414},{"x":36,"y":500},{"x":37,"y":451},{"x":38,"y":380},{"x":39,"y":416},{"x":40,"y":492},{"x":41,"y":428},{"x":42,"y":408},{"x":43,"y":406},{"x":44,"y":506},{"x":45,"y":435},{"x":46,"y":380},{"x":47,"y":421},{"x":48,"y":490},{"x":49,"y":435},{"x":50,"y":390},{"x":51,"y":412},{"x":52,"y":454},{"x":53,"y":416},{"x":54,"y":403},{"x":55,"y":408},{"x":56,"y":482},{"x":57,"y":438},{"x":58,"y":386},{"x":59,"y":405},{"x":60,"y":491},{"x":61,"y":427},{"x":62,"y":383},{"x":63,"y":394},{"x":64,"y":473},{"x":65,"y":420},{"x":66,"y":390},{"x":67,"y":410},{"x":68,"y":488},{"x":69,"y":415},{"x":70,"y":398},{"x":71,"y":419},{"x":72,"y":488},{"x":73,"y":414},{"x":74,"y":374}],"geoms":["line"],"x":"quarter_num","y":"Beer"}

It rises and falls four times a year, every single year, for eighteen years straight. Build that same series properly, as a tsibble, and you can ask sharper questions of it. Press Run.

```r
# Build the 74-quarter beer production series as a tsibble
library(tsibble)
library(dplyr)
library(feasts)

beer <- tsibble(
  Quarter = yearquarter("1992 Q1") + 0:73,
  Beer = c(443, 410, 420, 532, 433, 421, 410, 512, 449, 381, 423, 531, 426, 408, 416, 520,
           409, 398, 398, 507, 432, 398, 406, 526, 428, 397, 403, 517, 435, 383, 424, 521,
           421, 402, 414, 500, 451, 380, 416, 492, 428, 408, 406, 506, 435, 380, 421, 490,
           435, 390, 412, 454, 416, 403, 408, 482, 438, 386, 405, 491, 427, 383, 394, 473,
           420, 390, 410, 488, 415, 398, 419, 488, 414, 374),
  index = Quarter
)

autoplot(beer, Beer)
```

`yearquarter("1992 Q1") + 0:73` builds all 74 quarter labels at once, starting at 1992 Q1 and counting up one quarter at a time. `autoplot()` is a shortcut that picks a sensible plot for whatever kind of object you hand it. Given a tsibble, it draws exactly the line you just saw in the widget above, time along the bottom and the value up the side.

The open question is whether that up-and-down wiggle is the exact same shape every year, or whether it drifts.

=== step === concept
## What counts as a season in this series

A season, in time series terms, is a calendar unit that repeats on a fixed clock: the same position shows up again after a fixed number of steps. A day has 24 hours that repeat every day. A week has 7 days that repeat every week. This series is recorded once every three months, four times a year, so its season is the quarter, and the number of steps in one full season, called the period, is 4.

`beer` still holds the tsibble you just built, so look at what it actually contains.

```r
# Look at the first eight quarters of the beer tsibble
head(beer, 8)
#> # A tsibble: 8 x 2 [1Q]
#>   Quarter  Beer
#>     <qtr> <dbl>
#> 1 1992 Q1   443
#> 2 1992 Q2   410
#> 3 1992 Q3   420
#> 4 1992 Q4   532
#> 5 1993 Q1   433
#> 6 1993 Q2   421
#> 7 1993 Q3   410
#> 8 1993 Q4   512
```

This `beer` object is a tsibble, short for tidy time series table: a data frame that also keeps track of which column is time and how far apart the rows are spaced. `[1Q]` is that spacing, printed right next to the row count: one quarter, with no gaps. `<qtr>` is the special type `Quarter` is stored as, so it prints as "1992 Q1" instead of a plain number.

The full series runs 74 rows, from 1992 Q1 to 2010 Q2. That's 18 full years, 1992 through 2009, plus the first two quarters of 2010: 18 years and 2 quarters. Across all of it, `Beer` ranges from 374 to 532 megalitres.

=== step === concept
## Redrawing by year and reading whether the shape holds: gg_season()

The cover's line chart packs 74 quarters into one long strip, which makes it hard to compare one year's shape against another. `gg_season()` fixes that: it keeps the quarter on the x-axis and draws one separate line for each calendar year on top of it, all lined up on the same four-point scale.

```r
# Draw one line per calendar year, with quarter on the x-axis
library(feasts)

gg_season(beer, Beer)
```

Eighteen lines appear, one per year from 1992 to 2009, plus a short one for 2010 that stops at Q2, since that's where the series ends. If those eighteen lines all rise and fall the same way, quarter to quarter, the seasonal shape is stable from year to year. If some of them cut across the others in a different order, the shape itself is changing.

One simple summary makes the shared shape concrete: the average `Beer` value for each quarter, across every year.

```r
# Average Beer production for each quarter, across all years
beer |>
  as_tibble() |>
  mutate(quarter = lubridate::quarter(Quarter)) |>
  group_by(quarter) |>
  summarise(mean_beer = round(mean(Beer)))
#> # A tibble: 4 x 2
#>   quarter mean_beer
#>     <int>     <dbl>
#> 1       1       429
#> 2       2       394
#> 3       3       411
#> 4       4       502
```

Q4 averages 502 megalitres, the highest of the four, and Q2 averages 394, the lowest. Every one of the eighteen lines in the plot above rises toward Q4 and dips at Q2 the same way, which is exactly what "a stable seasonal shape" looks like: the same up-and-down order, year after year, even while the overall level drifts a little.

=== step === concept
## One panel per season: gg_subseries()

`gg_season()` is still eighteen overlapping lines squeezed onto one small axis, which gets hard to read once you're hunting for a slow drift inside just one quarter. `gg_subseries()` solves that by giving each quarter its own panel.

```r
# One panel per quarter, each showing that quarter's values across every year
library(feasts)

gg_subseries(beer, Beer)
```

Four panels appear, one for Q1, one for Q2, one for Q3 and one for Q4. Inside each panel the x-axis is no longer quarter, it is year, running from 1992 up to 2010. The Q1 and Q2 panels each hold 19 points, one per year from 1992 to 2010. The Q3 and Q4 panels hold only 18, because the series stops at 2010 Q2, so 2010 never reaches a Q3 or a Q4.

Every panel also carries one flat horizontal line: the mean of that quarter alone, the same four numbers, 429, 394, 411 and 502, you just read off the table in the last step. That line is a private reference for that one quarter. It answers a question `gg_season()` cannot: has this quarter's own typical level held steady over the years, or has it moved?

For this series, the answer is different from one quarter to the next. Q3's panel is the flattest of the four: 420 megalitres in 1992 and 419 in 2009, hugging its own mean line the whole way. Q4's panel is not: it opens near 532 in 1992 and closes near 488 in 2009, drifting further below its own mean line as the years go by, even while its mean of 502 is still the highest of the four quarters overall.

That is the reading skill a subseries plot gives you that a season plot does not: not just "what is this quarter's typical level", but "has that level been holding, or moving".

=== step === widget
## Turning one chart into small multiples by quarter

`gg_subseries()` does that quarter-by-quarter split automatically, but it is worth seeing the mechanic underneath it once, because it is the same mechanic ggplot2's `facet_wrap()` uses for splitting any chart by any category, not just quarters. The widget below plots the same 74 quarters, split by quarter, and lets you toggle between one combined chart and four small multiples.

::widget facet-grid {"data":[{"x":1992,"y":443,"facet":"Q1"},{"x":1992,"y":410,"facet":"Q2"},{"x":1992,"y":420,"facet":"Q3"},{"x":1992,"y":532,"facet":"Q4"},{"x":1993,"y":433,"facet":"Q1"},{"x":1993,"y":421,"facet":"Q2"},{"x":1993,"y":410,"facet":"Q3"},{"x":1993,"y":512,"facet":"Q4"},{"x":1994,"y":449,"facet":"Q1"},{"x":1994,"y":381,"facet":"Q2"},{"x":1994,"y":423,"facet":"Q3"},{"x":1994,"y":531,"facet":"Q4"},{"x":1995,"y":426,"facet":"Q1"},{"x":1995,"y":408,"facet":"Q2"},{"x":1995,"y":416,"facet":"Q3"},{"x":1995,"y":520,"facet":"Q4"},{"x":1996,"y":409,"facet":"Q1"},{"x":1996,"y":398,"facet":"Q2"},{"x":1996,"y":398,"facet":"Q3"},{"x":1996,"y":507,"facet":"Q4"},{"x":1997,"y":432,"facet":"Q1"},{"x":1997,"y":398,"facet":"Q2"},{"x":1997,"y":406,"facet":"Q3"},{"x":1997,"y":526,"facet":"Q4"},{"x":1998,"y":428,"facet":"Q1"},{"x":1998,"y":397,"facet":"Q2"},{"x":1998,"y":403,"facet":"Q3"},{"x":1998,"y":517,"facet":"Q4"},{"x":1999,"y":435,"facet":"Q1"},{"x":1999,"y":383,"facet":"Q2"},{"x":1999,"y":424,"facet":"Q3"},{"x":1999,"y":521,"facet":"Q4"},{"x":2000,"y":421,"facet":"Q1"},{"x":2000,"y":402,"facet":"Q2"},{"x":2000,"y":414,"facet":"Q3"},{"x":2000,"y":500,"facet":"Q4"},{"x":2001,"y":451,"facet":"Q1"},{"x":2001,"y":380,"facet":"Q2"},{"x":2001,"y":416,"facet":"Q3"},{"x":2001,"y":492,"facet":"Q4"},{"x":2002,"y":428,"facet":"Q1"},{"x":2002,"y":408,"facet":"Q2"},{"x":2002,"y":406,"facet":"Q3"},{"x":2002,"y":506,"facet":"Q4"},{"x":2003,"y":435,"facet":"Q1"},{"x":2003,"y":380,"facet":"Q2"},{"x":2003,"y":421,"facet":"Q3"},{"x":2003,"y":490,"facet":"Q4"},{"x":2004,"y":435,"facet":"Q1"},{"x":2004,"y":390,"facet":"Q2"},{"x":2004,"y":412,"facet":"Q3"},{"x":2004,"y":454,"facet":"Q4"},{"x":2005,"y":416,"facet":"Q1"},{"x":2005,"y":403,"facet":"Q2"},{"x":2005,"y":408,"facet":"Q3"},{"x":2005,"y":482,"facet":"Q4"},{"x":2006,"y":438,"facet":"Q1"},{"x":2006,"y":386,"facet":"Q2"},{"x":2006,"y":405,"facet":"Q3"},{"x":2006,"y":491,"facet":"Q4"},{"x":2007,"y":427,"facet":"Q1"},{"x":2007,"y":383,"facet":"Q2"},{"x":2007,"y":394,"facet":"Q3"},{"x":2007,"y":473,"facet":"Q4"},{"x":2008,"y":420,"facet":"Q1"},{"x":2008,"y":390,"facet":"Q2"},{"x":2008,"y":410,"facet":"Q3"},{"x":2008,"y":488,"facet":"Q4"},{"x":2009,"y":415,"facet":"Q1"},{"x":2009,"y":398,"facet":"Q2"},{"x":2009,"y":419,"facet":"Q3"},{"x":2009,"y":488,"facet":"Q4"},{"x":2010,"y":414,"facet":"Q1"},{"x":2010,"y":374,"facet":"Q2"}],"geom":"point","x":"Year","y":"Beer","facetVar":"Quarter"}

In "One chart" mode, all 74 points sit on one Year axis, colored by quarter, which is crowded and hard to read on its own. Press `facet_wrap(~Quarter)` and the same 74 points split into four separate panels, one per quarter, each on its own small Year axis. That split, one panel per level of a variable, is exactly what `gg_subseries()` already built for you in the last step, using quarter as the splitting variable and adding each quarter's own mean line on top.

=== step === quiz
## Quick check: what does a rising subseries mean line say?

You just read Q3's panel as flat and Q4's as drifting down, below its own mean line, in the later years. Now flip that around: suppose a different quarter's panel showed its yearly values climbing further and further above its own mean line as the years went by. What would that be telling you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The whole series is trending upward, not just that one quarter. ::no
- That one quarter's typical level is rising relative to the other quarters, even if the series as a whole is flat or falling. ::ok Exactly. A subseries panel isolates one quarter and compares it only to its own mean line, so a rising line inside it is a private trend for that quarter alone.
- The values inside that quarter are getting more spread out from year to year. ::no A subseries mean line tracks one quarter's typical level over the years, not how spread out the individual years are. A climbing line says that quarter's average is rising relative to the other three; it says nothing about the whole series' trend or about year-to-year spread within the quarter.

=== step === concept
## Defining a lag: the value k quarters earlier

A lag is one of the simplest ideas in time series, once you see it written down. Lag k of a series is just its value k steps earlier: today's value paired with the value from k steps before it. This series has one step per quarter, so lag 4 means four quarters ago, a full year back.

Written with symbols, if \(y_t\) is the value at time t, then lag k of that series is \(y_{t-k}\), and a lag plot always compares \(y_t\) against \(y_{t-k}\) for one fixed k at a time.

Here is lag 1 made concrete: `Beer` next to `Beer` shifted down by one row, using `dplyr::lag()`.

```r
# Shift Beer down by one row with dplyr::lag(), first six quarters
beer |>
  mutate(lag1 = dplyr::lag(Beer)) |>
  select(Quarter, Beer, lag1) |>
  head(6)
#> # A tsibble: 6 x 3 [1Q]
#>   Quarter  Beer  lag1
#>     <qtr> <dbl> <dbl>
#> 1 1992 Q1   443    NA
#> 2 1992 Q2   410   443
#> 3 1992 Q3   420   410
#> 4 1992 Q4   532   420
#> 5 1993 Q1   433   532
#> 6 1993 Q2   421   433
```

Row 2's `lag1` is 443, which is exactly row 1's `Beer`. Row 3's `lag1` is 410, row 2's `Beer`. Every `lag1` value is just its own row's `Beer` value, moved down one position. Row 1 has no earlier row to pull from, so its `lag1` comes back `NA`.

=== step === concept
## Plotting lag against value and matching each panel to a strength: gg_lag()

A lag plot turns that idea into nine small scatterplots at once, one panel per lag from 1 to 9. Panel k plots \(y_{t-k}\) on the x-axis against \(y_t\) on the y-axis, so every point in that panel is one quarter, paired with its own value from k quarters earlier.

Here are all nine panels for this series.

```r
# Draw all nine lag panels, forcing point geometry so the shape stays visible
library(feasts)

gg_lag(beer, Beer, geom = "point", lags = 1:9)
```

Read the panels left to right, top to bottom: lag 1, lag 2, and on up to lag 9. Some panels are a loose, round cloud with barely any visible shape. Others are a tight diagonal band, rising from bottom left to top right. The tighter and more diagonal a panel looks, the stronger the relationship between a value and the value that many quarters earlier.

You do not have to judge tightness by eye. Correlate `Beer` against `Beer` shifted back by 1, 2, 4 and 8 quarters, and the same story shows up as numbers.

```r
# Correlate Beer against Beer shifted back by 1, 2, 4 and 8 quarters
lag_cors <- sapply(c(1, 2, 4, 8), function(k) {
  shifted <- dplyr::lag(beer$Beer, k)
  round(cor(beer$Beer, shifted, use = "complete.obs"), 2)
})
names(lag_cors) <- paste0("lag", c(1, 2, 4, 8))
lag_cors
#>  lag1  lag2  lag4  lag8 
#> -0.10 -0.67  0.93  0.94 
```

Lag 1 is close to zero, -0.10: one quarter's value tells you almost nothing about the next quarter's value. Lag 2 is a strong -0.67: two quarters apart lands you on close to opposite sides of the yearly pattern, so a high value tends to pair with a low one. Lag 4 and lag 8 are the strong positive ones, 0.93 and 0.94: four quarters is a full year and eight is two full years, so the same quarter of the pattern lines up with itself, and the values track each other closely.

That interpretation only works because this code passed `geom = "point"`. `gg_lag()`'s own default is not "point", it is "path": draw a line through the points in the order the quarters actually occurred, then scatter them on top of it. Two quarters that sit right next to each other in time are not necessarily anywhere near each other on this plot, so that default line tends to bury the exact diagonal shapes you just read. The next step shows you exactly that.

=== step === widget
## Point cloud versus connected path at lag 4

See it on the tightest pair you found, lag 4, r about 0.93: the same 70 pairs of \(y_{t-4}\) against \(y_t\) that fed into the correlation table above.

::widget chart-plotter {"data":[{"x":443,"y":433},{"x":410,"y":421},{"x":420,"y":410},{"x":532,"y":512},{"x":433,"y":449},{"x":421,"y":381},{"x":410,"y":423},{"x":512,"y":531},{"x":449,"y":426},{"x":381,"y":408},{"x":423,"y":416},{"x":531,"y":520},{"x":426,"y":409},{"x":408,"y":398},{"x":416,"y":398},{"x":520,"y":507},{"x":409,"y":432},{"x":398,"y":398},{"x":398,"y":406},{"x":507,"y":526},{"x":432,"y":428},{"x":398,"y":397},{"x":406,"y":403},{"x":526,"y":517},{"x":428,"y":435},{"x":397,"y":383},{"x":403,"y":424},{"x":517,"y":521},{"x":435,"y":421},{"x":383,"y":402},{"x":424,"y":414},{"x":521,"y":500},{"x":421,"y":451},{"x":402,"y":380},{"x":414,"y":416},{"x":500,"y":492},{"x":451,"y":428},{"x":380,"y":408},{"x":416,"y":406},{"x":492,"y":506},{"x":428,"y":435},{"x":408,"y":380},{"x":406,"y":421},{"x":506,"y":490},{"x":435,"y":435},{"x":380,"y":390},{"x":421,"y":412},{"x":490,"y":454},{"x":435,"y":416},{"x":390,"y":403},{"x":412,"y":408},{"x":454,"y":482},{"x":416,"y":438},{"x":403,"y":386},{"x":408,"y":405},{"x":482,"y":491},{"x":438,"y":427},{"x":386,"y":383},{"x":405,"y":394},{"x":491,"y":473},{"x":427,"y":420},{"x":383,"y":390},{"x":394,"y":410},{"x":473,"y":488},{"x":420,"y":415},{"x":390,"y":398},{"x":410,"y":419},{"x":488,"y":488},{"x":415,"y":414},{"x":398,"y":374}],"geoms":["point","line"],"x":"Beer_lag4","y":"Beer"}

In point mode, the widget draws those same 70 pairs and computes the same Pearson r you already read off the table: about 0.93, a tight, rising cloud. Switch to line, and the same 70 points connect to their nearest neighbour along the x-axis instead of standing alone. The segments cross back and forth across the whole cloud, and the clean diagonal shape you could read a moment ago disappears under them.

That is what connecting a lag plot's points does to it, even sorted along one axis. `gg_lag()`'s real default, "path", is worse still, because it connects the points in the order the quarters occurred rather than in order along an axis, so the line jumps around even more. That is the whole reason the code a moment ago overrode the default and asked for `geom = "point"` instead.

=== step === quiz
## Quick check: which plot answers which question?

Suppose you are handed a new series and asked: "is Q3 alone pulling away from the other quarters?" Which of the three plots from this lesson answers that directly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- gg_lag(), because it shows how each quarter depends on the quarters before it. ::no
- gg_subseries(), because it puts each quarter in its own panel with its own mean line, so one quarter's drift shows up on its own. ::ok Right. gg_season() is for the whole seasonal shape, and gg_lag() is for dependence on past values. Only gg_subseries() isolates a single quarter the way this question needs.
- gg_season(), because it overlays one line per year so you can compare the whole shape at once. ::no gg_season() is for checking whether the whole seasonal shape holds from year to year, and gg_lag() is for checking dependence on past values. Neither isolates a single quarter's drift the way gg_subseries() does, by giving that one quarter its own panel and its own mean line.

=== step === tryit
## Your turn: predict and compute the lag-2 correlation

Before you compute anything, predict the sign. Look back at the quarter pattern you read earlier: production troughs at Q2, 394 megalitres, and peaks at Q4, 502 megalitres, two quarters apart. Two quarters back from any point in this series lands you close to the opposite side of that same up-and-down pattern, so a high value tends to pair with a low value two quarters earlier, and a low value pairs with a high one. That alone should push the lag-2 correlation negative, before you run a single line of code.

`beer` still holds the 74 quarters of `Beer` production from before. Compute the lag-2 correlation the same way the last step did, one lag at a time: shift `Beer` back two quarters with `dplyr::lag()`, then correlate it against `Beer` with `cor()`.

```r
# beer still holds the 74 quarters of Beer production from before.
# 1. Shift Beer back two quarters.
# 2. Correlate the shifted values against Beer, dropping the rows
#    that have no earlier value to pair with.
# Press Check when you have both.
```
::check {"regex": "(?=[\\s\\S]*\\blag\\s*[(])(?=[\\s\\S]*\\bcor\\s*[(])[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Right: about -0.67, the same number the correlation table two steps back already showed for lag 2. The swing between the Q2 trough and the Q4 peak, two quarters apart, is what drives that negative number.", "no": "Shift Beer back two quarters first: dplyr::lag(Beer, 2). Then correlate that shifted column against Beer with cor(..., use = \"complete.obs\") to drop the rows with no earlier value to pair with."}
::solution
```r
# Shift Beer back two quarters, then correlate it against Beer
beer_lag2 <- beer |>
  mutate(lag2 = dplyr::lag(Beer, 2))

cor(beer_lag2$Beer, beer_lag2$lag2, use = "complete.obs")
#> [1] -0.6682
```

That matches the prediction: negative, and close to the -0.67 you already saw two steps back. The seasonal swing between a trough quarter and a peak quarter, two steps away, is strong enough to show up clearly in a single correlation number.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos, the free online textbook. Chapter 2 covers seasonal plots, subseries plots and lag plots in the same order used in this lesson.
- [feasts package reference](https://pkg.robjhyndman.com/feasts/) - documentation for gg_season(), gg_subseries() and gg_lag().
- Cleveland, W.S., "Visualizing Data" (Hobart Press, 1993) - the book that introduced the seasonal subseries plot.
- Australian Bureau of Statistics, catalogue 8301.0.55.001, table 1 - the source of the beer production series used throughout this lesson.
- [tsibbledata package reference](https://cran.r-project.org/package=tsibbledata) - documentation for the aus_production dataset.

=== step === complete
## Quick recap

- gg_season() checks whether the whole seasonal shape holds from year to year: quarter on the x-axis, one line per year.
- gg_subseries() checks whether one season is drifting apart from the rest: one panel per quarter, each with its own mean line.
- gg_lag() plots \(y_t\) against \(y_{t-k}\) for a range of lags, a first visual look at dependence, before any formal statistic measures it.
- On this series, Q4's mean line drifted down while Q3's stayed flat, and lag 4 and lag 8 showed the strongest positive correlations, 0.93 and 0.94, because a full year and two full years both land you back on the same quarter.
