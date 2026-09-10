---
title: "Time Series Foundations Lesson 3: What a time series says before you model it"
catalog_blurb: "Read a series's level, trend, season, cycle and noise before you model it."
description: "See what a time series says before you model it: its level, trend, seasonal pattern, cycle and noise, each read off real UK quarterly gas consumption data."
keywords: "time series analysis in R, time series components, level trend seasonal cycle noise, seasonal vs cyclical pattern, UKgas dataset, time series decomposition in R"
post_type: "LESSON"
curriculum_id: "5.10.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ts-foundations"
course_title: "Time Series Foundations"
course_lesson: "3"
course_total: "8"
course_landing: "Time-Series-Foundations-Course.html"
course_next: "EDA-for-Time-Series.html"
course_prev: "Tidy-Temporal-Data-with-tsibble.html"
---

=== step === cover
## What a time series says before you model it

Today let's understand the five things worth reading off a time series before you ever try to model it.

Here is UK quarterly gas consumption, a real government series: 108 quarters, from the start of 1960 to the end of 1986, measured in millions of therms.

::widget chart-plotter {"data":[{"x":1,"y":160.1},{"x":2,"y":129.7},{"x":3,"y":84.8},{"x":4,"y":120.1},{"x":5,"y":160.1},{"x":6,"y":124.9},{"x":7,"y":84.8},{"x":8,"y":116.9},{"x":9,"y":169.7},{"x":10,"y":140.9},{"x":11,"y":89.7},{"x":12,"y":123.3},{"x":13,"y":187.3},{"x":14,"y":144.1},{"x":15,"y":92.9},{"x":16,"y":120.1},{"x":17,"y":176.1},{"x":18,"y":147.3},{"x":19,"y":89.7},{"x":20,"y":123.3},{"x":21,"y":185.7},{"x":22,"y":155.3},{"x":23,"y":99.3},{"x":24,"y":131.3},{"x":25,"y":200.1},{"x":26,"y":161.7},{"x":27,"y":102.5},{"x":28,"y":136.1},{"x":29,"y":204.9},{"x":30,"y":176.1},{"x":31,"y":112.1},{"x":32,"y":140.9},{"x":33,"y":227.3},{"x":34,"y":195.3},{"x":35,"y":115.3},{"x":36,"y":142.5},{"x":37,"y":244.9},{"x":38,"y":214.5},{"x":39,"y":118.5},{"x":40,"y":153.7},{"x":41,"y":244.9},{"x":42,"y":216.1},{"x":43,"y":188.9},{"x":44,"y":142.5},{"x":45,"y":301},{"x":46,"y":196.9},{"x":47,"y":136.1},{"x":48,"y":267.3},{"x":49,"y":317},{"x":50,"y":230.5},{"x":51,"y":152.1},{"x":52,"y":336.2},{"x":53,"y":371.4},{"x":54,"y":240.1},{"x":55,"y":158.5},{"x":56,"y":355.4},{"x":57,"y":449.9},{"x":58,"y":286.6},{"x":59,"y":179.3},{"x":60,"y":403.4},{"x":61,"y":491.5},{"x":62,"y":321.8},{"x":63,"y":177.7},{"x":64,"y":409.8},{"x":65,"y":593.9},{"x":66,"y":329.8},{"x":67,"y":176.1},{"x":68,"y":483.5},{"x":69,"y":584.3},{"x":70,"y":395.4},{"x":71,"y":187.3},{"x":72,"y":485.1},{"x":73,"y":669.2},{"x":74,"y":421},{"x":75,"y":216.1},{"x":76,"y":509.1},{"x":77,"y":827.7},{"x":78,"y":467.5},{"x":79,"y":209.7},{"x":80,"y":542.7},{"x":81,"y":840.5},{"x":82,"y":414.6},{"x":83,"y":217.7},{"x":84,"y":670.8},{"x":85,"y":848.5},{"x":86,"y":437},{"x":87,"y":209.7},{"x":88,"y":701.2},{"x":89,"y":925.3},{"x":90,"y":443.4},{"x":91,"y":214.5},{"x":92,"y":683.6},{"x":93,"y":917.3},{"x":94,"y":515.5},{"x":95,"y":224.1},{"x":96,"y":694.8},{"x":97,"y":989.4},{"x":98,"y":477.1},{"x":99,"y":233.7},{"x":100,"y":730},{"x":101,"y":1087},{"x":102,"y":534.7},{"x":103,"y":281.8},{"x":104,"y":787.6},{"x":105,"y":1163.9},{"x":106,"y":613.1},{"x":107,"y":347.4},{"x":108,"y":782.8}],"geoms":["line"],"x":"quarter","y":"consumption"}

Look at that line. It climbs a long way over the 27 years, and once it gets going it swings up and down hard within every single year. This lesson teaches the five things behind exactly that shape: a series's level, its trend, its seasonal pattern, its cycle, and its noise.

=== step === concept
## The level: where a series sits right now

Start with the simplest of the five. A series's **level** is just its current typical value, the baseline everything else in the series is measured against.

UKgas opened with four quarters in 1960: 160.1, 129.7, 84.8 and 120.1 million therms. Average those four and you get that year's level.

```r
# The four 1960 quarters and their average: that average is the year's level
q_1960 <- c(160.1, 129.7, 84.8, 120.1)
mean(q_1960)
#> [1] 123.675
```

So 1960's level was about 123.7. That number says nothing about the up-and-down wiggle inside the year, the fact that Q1 was much higher than Q3. It is just where the series, on the whole, sat that year. Every other component in this lesson is a movement away from a level like this one.

=== step === widget
## Trend: the slow, long-run direction

A **trend** is the direction, and the rate, at which a series's level itself moves over the long run. It is a different question from the level at any one point: the level answers "where is it now", the trend answers "which way is it heading, and how fast".

Toggle the chart below between points and a connected line, using the same 108 quarters you just saw on the cover.

::widget chart-plotter {"data":[{"x":1,"y":160.1},{"x":2,"y":129.7},{"x":3,"y":84.8},{"x":4,"y":120.1},{"x":5,"y":160.1},{"x":6,"y":124.9},{"x":7,"y":84.8},{"x":8,"y":116.9},{"x":9,"y":169.7},{"x":10,"y":140.9},{"x":11,"y":89.7},{"x":12,"y":123.3},{"x":13,"y":187.3},{"x":14,"y":144.1},{"x":15,"y":92.9},{"x":16,"y":120.1},{"x":17,"y":176.1},{"x":18,"y":147.3},{"x":19,"y":89.7},{"x":20,"y":123.3},{"x":21,"y":185.7},{"x":22,"y":155.3},{"x":23,"y":99.3},{"x":24,"y":131.3},{"x":25,"y":200.1},{"x":26,"y":161.7},{"x":27,"y":102.5},{"x":28,"y":136.1},{"x":29,"y":204.9},{"x":30,"y":176.1},{"x":31,"y":112.1},{"x":32,"y":140.9},{"x":33,"y":227.3},{"x":34,"y":195.3},{"x":35,"y":115.3},{"x":36,"y":142.5},{"x":37,"y":244.9},{"x":38,"y":214.5},{"x":39,"y":118.5},{"x":40,"y":153.7},{"x":41,"y":244.9},{"x":42,"y":216.1},{"x":43,"y":188.9},{"x":44,"y":142.5},{"x":45,"y":301},{"x":46,"y":196.9},{"x":47,"y":136.1},{"x":48,"y":267.3},{"x":49,"y":317},{"x":50,"y":230.5},{"x":51,"y":152.1},{"x":52,"y":336.2},{"x":53,"y":371.4},{"x":54,"y":240.1},{"x":55,"y":158.5},{"x":56,"y":355.4},{"x":57,"y":449.9},{"x":58,"y":286.6},{"x":59,"y":179.3},{"x":60,"y":403.4},{"x":61,"y":491.5},{"x":62,"y":321.8},{"x":63,"y":177.7},{"x":64,"y":409.8},{"x":65,"y":593.9},{"x":66,"y":329.8},{"x":67,"y":176.1},{"x":68,"y":483.5},{"x":69,"y":584.3},{"x":70,"y":395.4},{"x":71,"y":187.3},{"x":72,"y":485.1},{"x":73,"y":669.2},{"x":74,"y":421},{"x":75,"y":216.1},{"x":76,"y":509.1},{"x":77,"y":827.7},{"x":78,"y":467.5},{"x":79,"y":209.7},{"x":80,"y":542.7},{"x":81,"y":840.5},{"x":82,"y":414.6},{"x":83,"y":217.7},{"x":84,"y":670.8},{"x":85,"y":848.5},{"x":86,"y":437},{"x":87,"y":209.7},{"x":88,"y":701.2},{"x":89,"y":925.3},{"x":90,"y":443.4},{"x":91,"y":214.5},{"x":92,"y":683.6},{"x":93,"y":917.3},{"x":94,"y":515.5},{"x":95,"y":224.1},{"x":96,"y":694.8},{"x":97,"y":989.4},{"x":98,"y":477.1},{"x":99,"y":233.7},{"x":100,"y":730},{"x":101,"y":1087},{"x":102,"y":534.7},{"x":103,"y":281.8},{"x":104,"y":787.6},{"x":105,"y":1163.9},{"x":106,"y":613.1},{"x":107,"y":347.4},{"x":108,"y":782.8}],"geoms":["point","line"],"x":"quarter","y":"consumption"}

Switch to points and the widget draws a correlation r straight onto the chart: it is measuring how strongly consumption rises together with quarter number, across all 108 quarters. Switch to line and you can see that rise as one continuous climb.

To put an actual number on that rise, fit a straight line through every quarter.

```r
# Fit a straight line through all 108 quarters, read its slope and r,
# then average the last 20 quarters (1982-1986) to see where that
# line has carried the series by the end
quarter <- 1:108
consumption <- as.numeric(UKgas)
fit <- lm(consumption ~ quarter)
round(coef(fit), 2)
#> (Intercept)     quarter 
#>       13.52        5.95 
round(cor(quarter, consumption), 3)
#> [1] 0.741
round(mean(consumption[89:108]), 2)
#> [1] 632.35
```

That slope, 5.95, says consumption rose by about 5.95 million therms every quarter, on average, across the whole 27 years. And 0.741 is the same r the widget drew on the chart: a strong, though not perfect, straight-line relationship between time and consumption. By the last five years, 1982 to 1986, the series was averaging 632.35, just over five times its 1960 level of 123.7. That is what a trend does: it moves the level itself, quarter after quarter, year after year.

=== step === concept
## Seasonal pattern: the fixed calendar rhythm

A **seasonal pattern** is a swing that repeats on a fixed, known calendar period. Gas consumption has an obvious one: everybody uses more gas for heating in winter and less in summer, every single year, without fail.

Reshape the 108 quarters into 27 years by 4 quarters, and average each quarter across all 27 years.

```r
# Reshape the 108 quarters into 27 rows (years) by 4 columns (quarters),
# then average each quarter across all 27 years
gas_matrix <- matrix(as.numeric(UKgas), ncol = 4, byrow = TRUE)
quarter_means <- colMeans(gas_matrix)
names(quarter_means) <- c("Q1", "Q2", "Q3", "Q4")
round(quarter_means, 1)
#>    Q1    Q2    Q3    Q4 
#> 501.4 301.1 166.7 381.3 
round(mean(UKgas), 1)
#> [1] 337.6
round((quarter_means - mean(UKgas)) / mean(UKgas) * 100, 1)
#>    Q1    Q2    Q3    Q4 
#>  48.5 -10.8 -50.6  12.9
```

Q1, the winter quarter, averages 501.4 across all 27 years, 48.5% above the overall mean of 337.6. Q3, the summer quarter, averages only 166.7, fully 50.6% below it. That gap between winter and summer shows up every single year, always on the same quarter. That fixed, calendar-tied repetition is exactly what makes it seasonal, rather than just a random up-and-down.

=== step === concept
## Cycle: a swing with no fixed length

A **cycle** is also a slow rise and fall, but unlike a season, its length is not fixed or known in advance. It might last two years this time and four the next, and it has no tie to the calendar at all.

UKgas does not really carry a clean cycle of its own. Its swings are dominated by the trend and the season you have already seen. So look at a different series instead: a simulated 60-month demand index, built with a slow rise-and-fall rhythm but no season and almost no trend.

```r
# Simulate a 60-month demand index with a cycle but no season: a slow
# rise and fall on a fixed 40-month rhythm, no calendar tie, plus a
# little noise
set.seed(7)
month <- 1:60
demand_index <- round(100 + 18 * sin(2 * pi * month / 40) + rnorm(60, 0, 4), 1)
plot(month, demand_index, type = "l", xlab = "month", ylab = "demand index")
demand_index[c(1, 12, 29, 50)]
#> [1] 112.0 128.0  78.3 121.7
```

The index opens at 112, climbs to a high of 128 by month 12, falls all the way to a low of 78.3 by month 29, and is not back up near a similarly high value, 121.7, until month 50. That is 38 months between the two highs, not the 12 or 4 months a calendar season would give you, and there is no reason to expect the next high to land exactly 38 months after that one either. A slow rise and fall with no fixed length and no calendar tie: that is a cycle.

=== step === concept
## Telling seasonal and cycle apart

Season and cycle can look alike on a chart: both are slow rises and falls. The test that tells them apart is simple: does the swing repeat on a fixed, known length? If yes, it is seasonal. If the length varies and is not known ahead of time, it is a cycle.

Apply that test to the two series already on this page.

| Series | Repeats on a fixed, known length? | What that makes it |
|---|---|---|
| UKgas | Yes, every 4 quarters, tied to the calendar | Seasonal pattern |
| Demand index | No, about 38 months this time, not tied to the calendar | Cycle |

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A fixed, known calendar length is seasonal. A variable, unknown length is a cycle. ::ok Exactly right. UKgas repeats on exactly 4 quarters every year, so it is seasonal. The demand index rises and falls on no fixed clock, so it is a cycle.
- A cycle is just a season that happens to run longer than a year. ::no A season can run longer than a year too (an election cycle tied to a fixed term would still be seasonal). What actually separates them is whether the length is fixed and known in advance, not how long it is.
- A cycle only shows up once you have removed the trend from a series. ::no Trend, season and cycle sit alongside each other in a series; none of them has to be removed before another one can appear. The demand index has almost no trend at all, and its cycle is still there.
- Noise and a cycle are the same thing, since both look irregular on a chart. ::no A cycle is a real, slow rise and fall you could trace by eye on the demand index chart. Noise is what is left over once level, trend, season and cycle are all accounted for, the part with no shape at all. They can look messy together, but only one of them has a shape.

=== step === concept
## Noise: what is left over

**Noise** is whatever is left in a series once its level, trend, season and cycle are all accounted for. It has no shape of its own, and it can be large enough to hide a real pattern underneath it.

Build a third series to see this clearly: 84 days (12 weeks) of a website's daily visit count, with a real day-of-week rhythm built in on purpose.

```r
# Simulate 12 weeks (84 days) of website visits: a slow rise, a real
# weekday rhythm, and noise large enough to make both hard to see
set.seed(42)
day <- 1:84
day_of_week <- ((day - 1) %% 7) + 1
weekday_effect <- c(10, 8, 8, 12, 30, -30, -40)[day_of_week]
site_visits <- round(500 + 2.5 * day + weekday_effect + rnorm(84, 0, 90))
round(c(mean = mean(site_visits), sd = sd(site_visits)), 1)
#>  mean    sd 
#> 609.5 113.9
```

`weekday_effect` is the true rhythm this data was built with: Friday runs 30 above the trend, Sunday runs 40 below it, a real swing of 70 between the busiest and quietest day. But the random noise added on top has a standard deviation of 90, larger than that whole swing. So on any single day, noise alone can easily hide which day of the week it even was.

```r
# Average site visits by day of week: does the raw data still show
# a weekly rhythm, even with that much noise on top?
day_names <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
visits_by_day <- tapply(site_visits, day_of_week, mean)
names(visits_by_day) <- day_names
round(visits_by_day, 1)
#>   Mon   Tue   Wed   Thu   Fri   Sat   Sun 
#> 616.5 597.8 585.4 638.2 647.0 599.8 582.2
```

Averaging over all 12 weeks does recover most of the shape: Friday comes out highest at 647.0 and Sunday lowest at 582.2, a swing of about 65, close to the 70 built into the design. But look at the order in the middle.

Saturday, a weekend day, edges out Tuesday and Wednesday, two ordinary weekdays, for third-from-bottom. And Sunday and Wednesday, 48 apart by design, end up only 3.2 apart in the data. Noise this size does not erase the weekly rhythm, but it blurs its edges enough that you cannot always trust the exact order it hands you.

```r
# Plot all 84 days of site visits, in the order they happened
plot(site_visits, type = "l", xlab = "day", ylab = "site visits")
```

=== step === widget
## Smoothing to see the signal through the noise

If a raw series is too noisy to read by eye, smoothing can help: average each point together with its near neighbours, and the day-to-day bumps cancel out while a real, slower pattern underneath survives. But smoothing has two ways to go wrong. Too little of it, and you are still just looking at noise. Too much, and it can average away the real pattern along with the noise.

See both failure modes on the site-visits series itself, using a short 3-day averaging window and a long 7-day window, exactly one full week.

```r
# Smooth the daily series two ways: a short 3-day window and a longer
# 7-day window (exactly one week), then average the smoothed values
# back up by day of week to see if the weekly wave survives
smooth_3 <- as.numeric(stats::filter(site_visits, rep(1 / 3, 3), sides = 2))
smooth_7 <- as.numeric(stats::filter(site_visits, rep(1 / 7, 7), sides = 2))
range_3 <- diff(range(tapply(smooth_3, day_of_week, mean, na.rm = TRUE)))
range_7 <- diff(range(tapply(smooth_7, day_of_week, mean, na.rm = TRUE)))
round(c(three_day = range_3, seven_day = range_7), 1)
#> three_day seven_day 
#>      34.3      11.5
```

The 3-day window still leaves a real weekly wave: a swing of 34.3 between the highest and lowest weekday, roughly half the true 70, but clearly still a wave. The 7-day window all but erases it, down to a swing of just 11.5. That makes sense: averaging over exactly one full week means every week contributes one Monday, one Tuesday, and so on in equal measure, so the weekday differences cancel out by construction. Too much smoothing did not just quiet the noise, it quieted the real pattern along with it.

The widget below is a different, generic example, not the site-visits count itself. But it shows exactly the same three-way trade-off: too little smoothing chases every noisy wiggle, too much flattens out the real curve underneath, and a middle setting recovers something close to the truth.

::widget spline-smoother {}

Move the slider from one end to the other and read the label under the chart at each stop. At the stiff end the label reads underfit: the curve chases nothing and misses the bend in the true curve. At the flexible end the label reads overfit: the curve chases every noisy point instead of the shape underneath.

In between, it settles on a fit close to the dashed true curve. That is the same choice you just made on the site-visits data with a 3-day window instead of a 7-day one.

=== step === concept
## Reading a series in one accurate sentence

Put the five components together and a series is just their sum: its level, plus how much its trend has moved it, plus its seasonal swing, plus its cyclical swing, plus whatever noise is left over.

\[ y_t = L + T_t + S_t + C_t + N_t \]

Here \(y_t\) is the series' value at time \(t\), \(L\) is its baseline level, \(T_t\) is how far the trend has carried it by time \(t\), \(S_t\) is the seasonal swing at that point in the calendar, \(C_t\) is the cyclical swing, and \(N_t\) is the noise left over once the other four are accounted for.

Put that into words for the two series you have already built:

UKgas grew to just over five times its 1960 level over 27 years, and swings 48.5% above its overall mean every winter and 50.6% below it every summer, with little noise left around that pattern.

The site-visits count averages 609.5 a day, rises slowly at about 2.5 a day, and runs highest on Friday and lowest on Sunday, but carries so much noise that only smoothing reveals the weekly rhythm underneath it.

Each sentence names the same five things: where the series sits, which way it is moving, what repeats on the calendar, what rises and falls without one, and how much is simply left over.

=== step === quiz
## Quiz: reading the five components together

Back on the smoothing widget, three settings were on offer: a slider slid all the way to the stiff end, all the way to the flexible end, or a moderate setting in between.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- No smoothing at all, since the rawest line is the most honest one. ::no The raw line is honest about every point, but it is also honest about every bit of noise. On the site-visits data, a swing that size just looks like static: no visible weekly rhythm at all.
- Enough smoothing to flatten the day-to-day bumps, but not so much that the week-to-week shape disappears. ::ok Exactly. That was the 3-day window on the site-visits data: it thinned the daily noise while leaving a real swing of 34.3 between the busiest and quietest weekday, still recognisably a weekly wave.
- As much smoothing as the window allows, since a flatter line is always more reliable. ::no The 7-day window proved the opposite: it collapsed the weekly swing from 70 down to 11.5, essentially flat, because averaging over exactly one full week cancels the weekday differences by construction. Flatter is not automatically truer.
- A smoothing setting so flexible that it touches every single data point exactly, since a perfect fit must be the truest curve. ::no A curve that touches every point exactly is not smoothed at all, it is just the raw data traced back to itself, noise included. A perfect fit to noisy data is not the same thing as a fit to the real pattern underneath it.

=== step === tryit
## Your turn: describe the demand index in one sentence

`demand_index`, from earlier in this lesson, still holds its 60 simulated months: no trend, no season, and a cycle roughly 38 months apart. Assign each fact to its own variable, the same way you would if you were writing up any other series.

```r
# demand_index already holds the 60-month simulated series from earlier.
# Does it have a trend? A season? What is its cycle length in months?
has_trend <- NA      # TRUE or FALSE
has_season <- NA     # TRUE or FALSE
cycle_months <- NA   # a number of months
# Three lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*has_trend\\s*<-\\s*FALSE)(?=[\\s\\S]*has_season\\s*<-\\s*FALSE)(?=[\\s\\S]*cycle_months\\s*<-\\s*38)", "gate": true, "difficulty": "beginner", "ok": "Right: no trend, no season, and a cycle of about 38 months. That is the same read-off you just did for UKgas and the site-visits count, applied to a series you had not written up yet.", "no": "The demand index climbed from 112 to a high of 128 and back down to a low of 78.3 with no calendar tie, and the two highs sat 38 months apart. Set has_trend <- FALSE, has_season <- FALSE, and cycle_months <- 38."}
::solution
```r
# demand_index: no trend, no season, a cycle of about 38 months
has_trend <- FALSE
has_season <- FALSE
cycle_months <- 38
```

Put in words: the demand index carries no trend and no seasonal pattern, just a cycle of about 38 months between its highs, with a little noise layered on top.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.), Chapter 2](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos. The trend, seasonal, and cyclic definitions this lesson builds on.
- [NIST/SEMATECH e-Handbook of Statistical Methods, section 6.4](https://www.itl.nist.gov/div898/handbook/) - Introduction to Time Series Analysis, covering level, trend, and seasonal components.
- [R documentation: datasets::UKgas](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/UKgas.html) - the UK Quarterly Gas Consumption dataset, the source of every UKgas number in this lesson.
- Cleveland, W.S., Cleveland, E., McRae, J.E. and Terpenning, I. (1990), "STL: A Seasonal-Trend Decomposition Procedure Based on Loess," Journal of Official Statistics, 6(1). The method behind splitting a series into trend, season, and remainder automatically.

=== step === complete
## What you can read off a series now

Five things, and a real number from this lesson for each one.

- **Level:** UKgas opened at 123.7 in 1960, its baseline for everything that followed.
- **Trend:** that level rose to 632.35 by 1982 to 1986, just over five times higher, at about 5.95 a quarter.
- **Seasonal pattern:** winter runs 48.5% above the 27-year mean and summer 50.6% below it, on the same quarter every year without fail.
- **Cycle:** the demand index rose and fell on a rhythm about 38 months long, with no calendar tie and no reason to expect it to repeat at exactly that length again.
- **Noise:** large enough, on the site-visits count, to hide a real weekday rhythm until you smoothed it.

Put together, those five numbers are what let you describe any series honestly in one sentence, before you ever try to fit a model to it.
