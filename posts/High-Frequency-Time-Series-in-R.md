---
title: "High-Frequency Time Series in R: Intraday xts and quantmod"
slug: "High-Frequency-Time-Series-in-R"
description: "Work with intraday, high-frequency time series in R. Use xts and quantmod to build minute bars, slice by clock time, aggregate to OHLC, and compute returns."
keywords: "high-frequency time series R, intraday data R, xts intraday, quantmod R, to.period R, minute bars, OHLC bars R, endpoints period.apply"
auto_link_terms: "high-frequency time series|intraday time series|intraday data in R|high-frequency data|minute bars|OHLC bars|intraday returns|to.period|endpoints|period.apply|align.time|aggregate to OHLC"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-18"
curriculum_id: "FR-foun-2"
post_type: "FR"
fr_parent: "Time-Series-Objects-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">High-frequency (intraday) time series record many observations inside a single day, each stamped to the minute or second. R handles them with the <strong>xts</strong> package, a matrix indexed by real timestamps, and <strong>quantmod</strong>, a set of finance helpers built on top of xts. This tutorial builds a full trading day of minute bars from scratch, then works through slicing them by clock time and rolling them up into coarser bars. You need only base R plus xts and quantmod. The sample data is generated inline, so every block runs as you read.</p>

## What makes intraday data different from daily time series?

Daily data gives you one number per day on a tidy grid. Intraday data breaks that grid. You get dozens or thousands of stamps per day, uneven gaps at lunch and around the close, and nothing at all overnight or on weekends. A plain numeric vector cannot say *when* each value happened, so it cannot answer a simple question like "what was the price at 09:45?". The xts package fixes this by attaching a real timestamp to every value. Let us build one trading day and look at it.

The block below loads both packages, then simulates a stock's price for a standard 09:30 to 16:00 session. We create 390 one-minute timestamps (there are 390 minutes in that window), draw small random ups and downs, and add them up into a wandering price. Wrapping the price and the timestamps together with `xts()` gives us an intraday series. The `set.seed()` line just makes the random walk reproducible so your numbers match mine.

```r title="Build one trading day of minute bars"
suppressMessages(library(xts))
suppressMessages(library(quantmod))
options(xts_check_TZ = FALSE)   # quiet a harmless timezone note

set.seed(302)
bar_times <- seq(as.POSIXct("2026-03-02 09:30:00", tz = "America/New_York"),
                 by = "1 min", length.out = 390)
price <- 100 + cumsum(rnorm(390, 0, 0.05))
intraday <- xts(round(price, 2), order.by = bar_times)
colnames(intraday) <- "price"

head(intraday, 4)
periodicity(intraday)
#>                      price
#> 2026-03-02 09:30:00 100.01
#> 2026-03-02 09:31:00 100.03
#> 2026-03-02 09:32:00 100.02
#> 2026-03-02 09:33:00 100.15
#> 1 minute periodicity from 2026-03-02 09:30:00 to 2026-03-02 15:59:00
```

Here is what the code did. `seq()` produced 390 timestamps one minute apart, starting at the 09:30 open. `as.POSIXct()` is R's way of storing a full date plus a time of day, which is exactly what intraday data needs. `xts(value, order.by = timestamps)` bound each price to its moment. Printing the head shows the price stamped against each minute, and `periodicity()` read the index back to us: one-minute data running from 09:30 to 15:59.

That last line is the whole point. Because xts stores the actual clock time of every observation, it can tell you the spacing, the start, and the end without you tracking any of it by hand. A raw vector of 390 numbers knows none of that.

[KEY INSIGHT]
**xts indexes each value on a real timestamp, not a row number.** That is why irregular gaps, missing minutes, and mixed spacing are no problem for intraday data. The index carries the meaning; the values just ride along.

**Try it:** Build a small 5-row xts from the values 10, 12, 11, 13, 14, stamped one minute apart starting at 09:30, then check its periodicity.

```r title="Your turn: build a mini intraday series"
# Fill in the xts() call using ex1_times and ex1_values, then run periodicity().
ex1_times <- seq(as.POSIXct("2026-03-02 09:30:00", tz = "America/New_York"),
                 by = "1 min", length.out = 5)
ex1_values <- c(10, 12, 11, 13, 14)
# ex1_series <- xts(...)
# periodicity(ex1_series)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mini intraday series solution"
ex1_series <- xts(ex1_values, order.by = ex1_times)
nrow(ex1_series)
periodicity(ex1_series)
#> [1] 5
#> 1 minute periodicity from 2026-03-02 09:30:00 to 2026-03-02 09:34:00
```

**Explanation:** `xts()` pairs the five values with the five timestamps. `periodicity()` inspects the index and reports one-minute spacing across the short window.

</details>

## How do you slice intraday data by clock time?

With daily data you rarely care about the exact time. With intraday data you constantly do. You might want the first half hour, the lunch lull, or the final minutes before the close. xts lets you pull those windows using the timestamp itself, written as a plain string, so you never have to compute row positions.

Two styles cover almost everything. The first is a **date-and-time range**, written as `"start/end"` inside the square brackets. The second is a **time-of-day range**, written with a leading `T`, which ignores the date and matches by clock time. Let us start with a date-time range and grab the opening 30 minutes.

```r title="Slice the first 30 minutes by clock time"
first30 <- intraday["2026-03-02 09:30/2026-03-02 09:59"]
nrow(first30)
tail(first30, 3)
#> [1] 30
#>                      price
#> 2026-03-02 09:57:00  99.96
#> 2026-03-02 09:58:00  99.91
#> 2026-03-02 09:59:00 100.05
```

The string `"2026-03-02 09:30/2026-03-02 09:59"` means "every bar from 09:30 up to and including 09:59." xts read the two timestamps and returned every matching row. `nrow()` confirms 30 bars, one for each minute of the first half hour, and the tail shows the window really does stop at 09:59. You never had to know that 09:59 sits at row 30.

The `T` prefix is handy when you care about a time of day regardless of which date it falls on. It is perfect for questions like "how does this stock behave right after the open?" across many days. Here we ask for the first five minutes.

```r title="Select a time-of-day window"
open_window <- intraday["T09:30/T09:34"]
open_window
#>                      price
#> 2026-03-02 09:30:00 100.01
#> 2026-03-02 09:31:00 100.03
#> 2026-03-02 09:32:00 100.02
#> 2026-03-02 09:33:00 100.15
#> 2026-03-02 09:34:00 100.18
```

`"T09:30/T09:34"` selected every bar whose clock time is between 09:30 and 09:34, and returned all five. On a multi-day series the same string would pull those five minutes from *every* day at once. That is a big convenience once your data spans weeks.

[WARNING]
**An xts index always carries a timezone, so "09:30" is not absolute.** We built the index in "America/New_York", so `T09:30` means 09:30 in New York. If your timestamps were stored in UTC, the same string would select a different real moment. Always know the timezone of your index before slicing by clock time.

**Try it:** Select every bar between 10:00 and 10:04 using the `T` notation, then count how many bars you got.

```r title="Your turn: grab a time-of-day window"
# Use the T-notation range inside the brackets, then wrap it in nrow().
# ex2_win <- intraday["T??:??/T??:??"]
# nrow(ex2_win)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Time-of-day window solution"
ex2_win <- intraday["T10:00/T10:04"]
nrow(ex2_win)
#> [1] 5
```

**Explanation:** The range 10:00 to 10:04 spans five one-minute bars, so `nrow()` returns 5.

</details>

## How do you roll minute bars up into OHLC bars?

Minute-by-minute data is often too fine to look at directly. A common first move is to summarise it into coarser bars, say one bar every five minutes. Each bar keeps four numbers that traders live by: the **open** (first price in the window), the **high** (the peak), the **low** (the trough), and the **close** (the last price). Together they are called an OHLC bar, and they compress a busy stretch of trading into a single snapshot.

The `to.period()` function does this rollup for you. You tell it the unit (`"minutes"`) and how many of them make one bar (`k = 5`), and it returns the OHLC summary. Watch it turn our 390 one-minute bars into 5-minute bars.

```r title="Roll minute bars into 5-minute OHLC bars"
bars5 <- to.period(intraday, period = "minutes", k = 5, OHLC = TRUE)
head(bars5, 3)
#>                     intraday.Open intraday.High intraday.Low intraday.Close
#> 2026-03-02 09:34:00        100.01        100.18       100.01         100.18
#> 2026-03-02 09:39:00        100.23        100.27       100.17         100.17
#> 2026-03-02 09:44:00        100.20        100.20       100.00         100.00
```

Each output row now summarises five minutes of trading. The first bar, stamped 09:34, opened at 100.01, reached a high of 100.18, dipped no lower than 100.01, and closed at 100.18. That single row stands in for the five one-minute prices we saw earlier. The column names carry the object name (`intraday.Open` and so on), which is just xts labelling where the data came from.

Once you have OHLC bars you usually want one of the four columns on its own. quantmod ships accessor functions for exactly that: `Op()`, `Hi()`, `Lo()`, and `Cl()` pull the open, high, low, and close. Here we take just the closing price of each 5-minute bar.

```r title="Extract the close of each bar"
tail(Cl(bars5), 3)
#>                     intraday.Close
#> 2026-03-02 15:49:00          99.49
#> 2026-03-02 15:54:00          99.30
#> 2026-03-02 15:59:00          99.20
```

`Cl(bars5)` returned only the close column, and `tail()` showed the last three 5-minute closes of the day. Reaching for `Cl()` instead of remembering which column number holds the close keeps your code readable and hard to break.

[TIP]
**`to.period()` runs in fast compiled code.** Aggregating a whole year of minute bars into coarser bars takes a fraction of a second, so do not hand-roll the loop yourself. Change `period` to `"hours"`, `"days"`, or `"weeks"` and `k` to any count to get the bars you want.

**Try it:** Aggregate the minute data into 15-minute bars instead of 5-minute bars, then count how many bars the day produces. (Change the `k` value.)

```r title="Your turn: make 15-minute bars"
# Change k so each bar spans 15 minutes, then count the bars.
ex3_bars15 <- to.period(intraday, period = "minutes", k = 5, OHLC = TRUE)  # change 5 to 15
nrow(ex3_bars15)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fifteen-minute bars solution"
ex3_bars15 <- to.period(intraday, period = "minutes", k = 15, OHLC = TRUE)
nrow(ex3_bars15)
#> [1] 26
```

**Explanation:** A 390-minute session splits into 390 / 15 = 26 fifteen-minute bars.

</details>

## How do you summarise each period with endpoints() and period.apply()?

OHLC bars are one kind of summary, but sometimes you want your own statistic per period, like the average price every half hour or the highest print of each hour. Two xts functions team up for this. `endpoints()` finds the row where each period ends, and `period.apply()` runs any function you like over the chunks between those endpoints.

Start with `endpoints()`. You give it a unit and a count, and it hands back the row positions that close each block. Below we mark the end of every 30-minute block.

```r title="Find the last row of each 30-minute block"
ep <- endpoints(intraday, on = "minutes", k = 30)
ep
#>  [1]   0  30  60  90 120 150 180 210 240 270 300 330 360 390
```

The numbers are row positions, not times. The leading 0 is a convention that means "start before the first row," and then every 30th row closes a block: 30, 60, 90, and so on up to 390. Those cut points are all `period.apply()` needs to know where one 30-minute chunk stops and the next begins.

Now feed those endpoints to `period.apply()` along with a function. We ask for the maximum price in each 30-minute block, a quick way to see the intraday peaks.

```r title="Highest price in each 30-minute block"
period.apply(intraday$price, INDEX = ep, FUN = max)
#>                      price
#> 2026-03-02 09:59:00 100.27
#> 2026-03-02 10:29:00 100.09
#> 2026-03-02 10:59:00  99.62
#> 2026-03-02 11:29:00  99.41
#> 2026-03-02 11:59:00  99.49
#> 2026-03-02 12:29:00  99.20
#> 2026-03-02 12:59:00  99.32
#> 2026-03-02 13:29:00  99.45
#> 2026-03-02 13:59:00  99.47
#> 2026-03-02 14:29:00  99.53
#> 2026-03-02 14:59:00 100.01
#> 2026-03-02 15:29:00 100.24
#> 2026-03-02 15:59:00  99.87
```

`period.apply()` split the price series at the endpoints and ran `max()` on each 30-minute slice, returning 13 values. Each result is stamped with the *last* timestamp of its block, so the first peak of 100.27 belongs to the 09:30 to 09:59 window. Swap `max` for `mean`, `min`, `sd`, or any function of your own, and you get that statistic per period.

There is one cosmetic wrinkle: the results are stamped at 09:59, 10:29, and so on, one minute shy of the round boundary. `align.time()` snaps those stamps forward to the clean 30-minute mark, which reads better and lines up neatly with other series. The `n = 1800` argument is the boundary in seconds (30 minutes is 1800 seconds).

```r title="Snap timestamps to clean 30-minute marks"
block_max <- period.apply(intraday$price, INDEX = ep, FUN = max)
align.time(block_max, n = 1800)
#>                      price
#> 2026-03-02 10:00:00 100.27
#> 2026-03-02 10:30:00 100.09
#> 2026-03-02 11:00:00  99.62
#> 2026-03-02 11:30:00  99.41
#> 2026-03-02 12:00:00  99.49
#> 2026-03-02 12:30:00  99.20
#> 2026-03-02 13:00:00  99.32
#> 2026-03-02 13:30:00  99.45
#> 2026-03-02 14:00:00  99.47
#> 2026-03-02 14:30:00  99.53
#> 2026-03-02 15:00:00 100.01
#> 2026-03-02 15:30:00 100.24
#> 2026-03-02 16:00:00  99.87
```

Same 13 values, but now stamped at 10:00, 10:30, and so on. `align.time()` did not change the numbers, only rounded each timestamp up to the next clean boundary. Aligned stamps make two series with different raw times easy to merge and compare later.

**Try it:** Compute the *mean* price in each 60-minute block. (Change `k` to 60 and use `mean`.)

```r title="Your turn: mean price per hour"
# Change k to 60, then use FUN = function(x) mean(x).
ex4_ep <- endpoints(intraday, on = "minutes", k = 30)  # change 30 to 60
period.apply(intraday$price, INDEX = ex4_ep, FUN = function(x) mean(x))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean price per hour solution"
ex4_ep <- endpoints(intraday, on = "minutes", k = 60)
period.apply(intraday$price, INDEX = ex4_ep, FUN = function(x) mean(x))
#>                         price
#> 2026-03-02 09:59:00 100.04900
#> 2026-03-02 10:59:00  99.60233
#> 2026-03-02 11:59:00  99.31550
#> 2026-03-02 12:59:00  99.10717
#> 2026-03-02 13:59:00  99.32100
#> 2026-03-02 14:59:00  99.57150
#> 2026-03-02 15:59:00  99.81183
```

**Explanation:** Sixty-minute endpoints cut the day into seven hourly blocks (the last one is short), and `mean()` reports the average price in each. Using `FUN = function(x) mean(x)` sidesteps a helper message that `FUN = mean` prints.

</details>

## How do you compute intraday returns safely?

A price level tells you where the stock is; a **return** tells you how much it moved from one bar to the next. Returns are the raw material for volatility, risk, and most trading signals, so getting them right matters. The safe, idiomatic way to get bar-to-bar returns from an xts is quantmod's `Delt()` function, which computes the percentage change for you.

```r title="Compute one-minute returns with Delt()"
rets <- Delt(intraday$price)
head(rets, 4)
round(sd(rets, na.rm = TRUE), 5)
#>                     Delt.1.arithmetic
#> 2026-03-02 09:30:00                NA
#> 2026-03-02 09:31:00      1.999800e-04
#> 2026-03-02 09:32:00     -9.997001e-05
#> 2026-03-02 09:33:00      1.299740e-03
#> [1] 0.00048
```

`Delt()` returned the fractional change from each bar to the one before it. The first value is `NA` because there is no earlier bar to compare against, which is correct rather than a bug. The numbers print in scientific notation because they are small: `1.999800e-04` means about +0.0002, or roughly +0.02%. That tiny scale is normal for one-minute returns. The final line, `sd()` of the returns, is a plain measure of how bumpy the minute-to-minute moves were: about 0.00048.

If you want the raw price *change* rather than a percentage, subtract each price from the one before it. Running `diff()` directly on an xts object can be fragile, so the reliable habit is to pull out the plain numbers with `as.numeric()`, difference those, then wrap the result back into an xts. The leading `NA` keeps the length correct.

```r title="Price change per minute from the numeric vector"
chg <- xts(c(NA, diff(as.numeric(intraday$price))), order.by = index(intraday))
colnames(chg) <- "change"
head(chg, 4)
#>                     change
#> 2026-03-02 09:30:00     NA
#> 2026-03-02 09:31:00   0.02
#> 2026-03-02 09:32:00  -0.01
#> 2026-03-02 09:33:00   0.13
```

`as.numeric(intraday$price)` dropped the timestamps and gave a plain vector. `diff()` on that vector produced the minute-to-minute price changes, and we glued a leading `NA` on the front so it lines up with the original 390 rows. Re-wrapping in `xts()` with `index(intraday)` restored the timestamps. The price rose 0.02 in the first minute, slipped 0.01 in the next, and jumped 0.13 after that.

[KEY INSIGHT]
**The first return of any series is always NA, and per-bar intraday returns are tiny.** Both facts are features, not errors. The `NA` marks the missing "previous bar," and the small magnitudes reflect how little price moves in a single minute. Aggregate returns over longer windows if you need bigger, more legible numbers.

**Try it:** Compute *log returns* (the difference of the logged prices) using the same numeric-vector pattern, and show the first four.

```r title="Your turn: log returns"
# Take diff() of log(as.numeric(intraday$price)) with a leading NA, wrap in xts().
# ex5_logret <- xts(c(NA, diff(log(as.numeric(intraday$price)))), order.by = index(intraday))
# head(ex5_logret, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Log returns solution"
ex5_logret <- xts(c(NA, diff(log(as.numeric(intraday$price)))), order.by = index(intraday))
colnames(ex5_logret) <- "log_return"
head(ex5_logret, 4)
#>                        log_return
#> 2026-03-02 09:30:00            NA
#> 2026-03-02 09:31:00  1.999600e-04
#> 2026-03-02 09:32:00 -9.997501e-05
#> 2026-03-02 09:33:00  1.298896e-03
```

**Explanation:** Logging first, then differencing, gives log returns, which add up nicely across time. For tiny moves they are almost identical to the simple returns from `Delt()`.

</details>

## How do you fill gaps and missing bars?

Real intraday feeds are rarely complete. If no trade happens in some minute, that bar is simply absent, so your series has holes. Before you compute returns or aggregate, you usually want a bar for every minute, with missing ones filled sensibly. Let us first create some gaps by dropping a handful of minutes.

```r title="Create a series with missing minutes"
gappy <- intraday[-c(5, 6, 7, 20, 21)]
nrow(gappy)
#> [1] 385
```

We removed five rows, so `gappy` has 385 bars instead of 390. Now minutes 5, 6, 7, 20, and 21 are gone. The task is to put those minutes back as empty slots, then fill them.

The trick is to `merge()` the gappy series onto a complete grid of every minute, which inserts `NA` wherever a bar is missing. Then `na.locf()` (last observation carried forward) fills each hole with the most recent known price, which is the standard assumption for a no-trade minute: the price simply held. We build the full grid as an empty xts that has the complete index but no data.

```r title="Fill gaps by carrying the last price forward"
grid <- xts(, order.by = index(intraday))
filled <- na.locf(merge(gappy, grid))
nrow(filled)
sum(is.na(filled))
#> [1] 390
#> [1] 0
```

`merge(gappy, grid)` re-indexed the gappy series onto all 390 timestamps, inserting `NA` at the five missing minutes. `na.locf()` then carried the last real price forward into each gap. The result has all 390 rows and zero remaining `NA` values, so the series is whole again and ready for analysis.

[NOTE]
**Forward fill cannot fix a gap at the very start.** If the first bars are missing, there is no earlier value to carry forward, so they stay `NA`. In that case add `na.locf(x, fromLast = TRUE)` to backfill from the next known value instead. The exercise below shows this exact situation.

**Try it:** Drop the first two bars, reindex onto the full grid, forward-fill, then count how many `NA` values remain. Think about why forward fill leaves some behind.

```r title="Your turn: fill a series missing its opening bars"
# Drop bars 1 and 2, merge onto the full grid, na.locf(), then sum(is.na(...)).
# ex6_gappy <- intraday[-c(1, 2)]
# ex6_filled <- na.locf(merge(ex6_gappy, xts(, order.by = index(intraday))))
# sum(is.na(ex6_filled))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Leading-gap solution"
ex6_gappy <- intraday[-c(1, 2)]
ex6_filled <- na.locf(merge(ex6_gappy, xts(, order.by = index(intraday))))
sum(is.na(ex6_filled))
#> [1] 2
```

**Explanation:** The first two minutes have no earlier price to carry forward, so forward fill leaves them `NA`. Adding `fromLast = TRUE` would backfill those two from the third bar.

</details>

## How do you load real intraday data with quantmod?

So far we generated data inline so everything runs in the browser. In your own work you will pull real data instead, and quantmod's `getSymbols()` is the usual door. It downloads a symbol's history from a provider such as Yahoo Finance and hands you back an xts object, ready for every technique above. Because it needs a live internet connection, run the block below in your own R session rather than expecting it to run here.

[NOTE]
**`getSymbols()` needs a live connection, so it belongs in your local R session.** Free sources like Yahoo mainly serve daily bars; true minute or tick data usually comes from a paid feed or a specialist package. The good news is that once the data is an xts, everything in this tutorial applies without change.

```r-static title="Load real daily prices with getSymbols() (run locally)"
library(quantmod)
getSymbols("AAPL", src = "yahoo", from = "2026-06-01", to = "2026-06-07", auto.assign = TRUE)
periodicity(AAPL)
tail(Cl(AAPL), 3)
#> [1] "AAPL"
#> Daily periodicity from 2026-06-01 to 2026-06-05
#>            AAPL.Close
#> 2026-06-03     310.26
#> 2026-06-04     311.23
#> 2026-06-05     307.34
```

`getSymbols("AAPL", ...)` fetched Apple's prices and stored them in an xts object named `AAPL`, returning the symbol name. `periodicity()` confirms daily bars, and `Cl(AAPL)` pulls the closing price, the same accessor we used on our own bars. From here you could aggregate to weekly bars with `to.period()`, slice a date range with the bracket notation, or compute returns with `Delt()`, all exactly as you did above.

To see how aggregation carries over, here is a live exercise on our own minute data.

**Try it:** Collapse the whole 390-minute session into a single daily OHLC bar using `to.period()` with `period = "days"`.

```r title="Your turn: collapse the session into one daily bar"
# Set period to "days" so all 390 minute bars roll into one OHLC bar.
# ex7_daily <- to.period(intraday, period = "days", OHLC = TRUE)
# ex7_daily
```

<details>
<summary>Click to reveal solution</summary>

```r title="Daily bar solution"
ex7_daily <- to.period(intraday, period = "days", OHLC = TRUE)
ex7_daily
#>                     intraday.Open intraday.High intraday.Low intraday.Close
#> 2026-03-02 15:59:00        100.01        100.27        98.88           99.2
```

**Explanation:** With `period = "days"` the entire session becomes one bar: it opened at 100.01, peaked at 100.27, bottomed at 98.88, and closed at 99.2. This is exactly what a daily feed would report for the day.

</details>

## Practice Exercises

These combine several ideas from the tutorial. Each solution uses fresh variable names (prefixed `my_`) so it will not clash with the objects built above. Try each one before opening the solution.

### Exercise 1: First-hour 10-minute bars

From the first hour of trading (09:30 to 10:29), build 10-minute OHLC bars, then report how many bars you get and the highest high across them.

```r title="Exercise 1 starter"
# 1) Slice 09:30 to 10:29 with the bracket notation.
# 2) to.period(..., period = "minutes", k = 10, OHLC = TRUE).
# 3) nrow() and max(Hi(...)).

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_firsthour <- intraday["2026-03-02 09:30/2026-03-02 10:29"]
my_bars10 <- to.period(my_firsthour, period = "minutes", k = 10, OHLC = TRUE)
nrow(my_bars10)
max(Hi(my_bars10))
#> [1] 6
#> [1] 100.27
```

**Explanation:** The first hour holds 60 one-minute bars, which roll into six 10-minute bars. `Hi()` pulls the high of each bar, and `max()` finds the peak price of the hour, 100.27.

</details>

### Exercise 2: An intraday volatility profile

Volatility often changes through the day. Build a simple profile: the average *absolute* one-minute return within each 30-minute block. Bigger numbers mean choppier trading.

```r title="Exercise 2 starter"
# 1) my_ret <- Delt(intraday$price)
# 2) my_ep <- endpoints(intraday, on = "minutes", k = 30)
# 3) period.apply over abs(my_ret) with mean (na.rm = TRUE), then round.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_ret <- Delt(intraday$price)
my_ep <- endpoints(intraday, on = "minutes", k = 30)
my_absret <- period.apply(abs(my_ret), INDEX = my_ep, FUN = function(v) mean(v, na.rm = TRUE))
round(my_absret, 6)
#>                     Delt.1.arithmetic
#> 2026-03-02 09:59:00          0.000427
#> 2026-03-02 10:29:00          0.000414
#> 2026-03-02 10:59:00          0.000362
#> 2026-03-02 11:29:00          0.000423
#> 2026-03-02 11:59:00          0.000346
#> 2026-03-02 12:29:00          0.000421
#> 2026-03-02 12:59:00          0.000319
#> 2026-03-02 13:29:00          0.000366
#> 2026-03-02 13:59:00          0.000352
#> 2026-03-02 14:29:00          0.000319
#> 2026-03-02 14:59:00          0.000435
#> 2026-03-02 15:29:00          0.000330
#> 2026-03-02 15:59:00          0.000395
```

**Explanation:** `abs(my_ret)` measures the size of each minute's move regardless of direction. `period.apply()` averages those sizes inside each 30-minute block, giving one volatility number per half hour. The `na.rm = TRUE` ignores the leading `NA` return.

</details>

### Exercise 3: A clean 5-minute close series, end to end

Put the whole workflow together. Starting from the minute series, remove a few bars to mimic missing trades, fill the gaps, aggregate to 5-minute bars, then show the last three 5-minute closes.

```r title="Exercise 3 starter"
# 1) Drop a few rows to create gaps.
# 2) merge onto the full grid + na.locf() to fill.
# 3) to.period(..., k = 5) then tail(Cl(...), 3).

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_raw <- intraday[-c(50, 51, 100)]
my_full <- na.locf(merge(my_raw, xts(, order.by = index(intraday))))
my_bars <- to.period(my_full, period = "minutes", k = 5, OHLC = TRUE)
tail(Cl(my_bars), 3)
#>                     my_full.Close
#> 2026-03-02 15:49:00         99.49
#> 2026-03-02 15:54:00         99.30
#> 2026-03-02 15:59:00         99.20
```

**Explanation:** This chains four steps into one clean pipeline: create gaps, fill them by carrying prices forward, aggregate to 5-minute OHLC bars, and pull the closes. The result is a tidy, gap-free 5-minute close series ready for charting or modelling.

</details>

## FAQ

**When should I use xts instead of the base ts class for intraday data?** Use xts whenever timestamps carry a time of day or the spacing is irregular, which is almost always true intraday. The base `ts` class assumes evenly spaced observations described by a single frequency, so it cannot represent 09:31 versus 09:33 or an overnight gap. xts stores each real timestamp, which is exactly what minute and tick data need.

**Why not just keep intraday data in a data.frame?** A data.frame can hold a timestamp column, but it will not slice by clock time or aggregate to OHLC bars for you, and filling gaps on a grid stays manual. xts builds all of that on top of the timestamp index, so `intraday["T09:30/T10:00"]` and `to.period()` just work. You get less code and fewer chances to line up the wrong rows.

**Can getSymbols() pull minute or tick data?** Not from the free Yahoo source, which mainly serves daily bars. For genuine intraday history you generally need a paid data provider, an API key with a source like Alpha Vantage, or a dataset from a specialist package. Whatever the source, once the result is an xts object, every technique in this tutorial applies unchanged.

**How do I handle timezones so my clock-time slicing is correct?** Build the index with an explicit `tz` argument in `as.POSIXct()`, and confirm it with `tzone(x)`. Time-of-day slices like `T09:30` are interpreted in that timezone, so a mismatch silently shifts your window. When you merge two intraday series, make sure both share the same timezone first.

**Is there a package built specifically for high-frequency data?** Yes. The `highfrequency` package adds tools aimed at tick and second-level data, including cleaning routines and realized-volatility estimators, and it works with xts objects. For the everyday tasks of slicing, aggregating, and summarising, plain xts plus quantmod is usually all you need.

## Summary

This tutorial built a full day of one-minute bars from scratch and worked through the core intraday toolkit in xts and quantmod. The table maps each task to the function that does it.

| Task | Function | What it gives you |
|------|----------|-------------------|
| Store timestamped values | `xts()` | A time-indexed series |
| Check the spacing | `periodicity()` | The detected frequency and range |
| Slice by date and time | `x["start/end"]` | The bars in a window |
| Slice by time of day | `x["T09:30/T10:00"]` | The same clock window across days |
| Roll up to OHLC bars | `to.period()` | Open, high, low, close per period |
| Pull one OHLC column | `Op()` `Hi()` `Lo()` `Cl()` | A single price series |
| Mark period boundaries | `endpoints()` | Row positions that end each block |
| Summarise per period | `period.apply()` | Any statistic per block |
| Tidy the stamps | `align.time()` | Timestamps snapped to clean marks |
| Bar-to-bar returns | `Delt()` | Percentage change per bar |
| Fill missing bars | `merge()` + `na.locf()` | A gap-free series on a full grid |
| Download real prices | `getSymbols()` | Market data as an xts (run locally) |

The through-line is simple: xts indexes everything on real time, so once your data is an xts, slicing, aggregating, and analysing intraday series all follow the same few verbs.

## References

1. xts on CRAN. [Link](https://cran.r-project.org/package=xts) - the package home, with install notes and the changelog.
2. xts reference manual (PDF). [Link](https://cran.r-project.org/web/packages/xts/xts.pdf) - the full function reference for `to.period`, `endpoints`, `period.apply`, and `align.time`.
3. xts documentation site, Ryan and Ulrich. [Link](https://joshuaulrich.github.io/xts/) - worked vignettes on subsetting by time and aggregating a series.
4. quantmod on CRAN. [Link](https://cran.r-project.org/package=quantmod) - the package home for the finance helpers used here.
5. quantmod reference manual (PDF). [Link](https://cran.r-project.org/web/packages/quantmod/quantmod.pdf) - the reference pages for `Delt`, `Cl`, and `getSymbols`.
6. quantmod project site. [Link](https://www.quantmod.com/) - examples and charting galleries built on xts.
7. R base DateTimeClasses (POSIXct and POSIXlt). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html) - how R stores a date plus a time of day, which is what the xts index is built on.
8. highfrequency package on CRAN. [Link](https://cran.r-project.org/web/packages/highfrequency/index.html) - tools aimed at tick and second-level data, including realized-volatility estimators.
9. Wickham, Cetinkaya-Rundel and Grolemund, R for Data Science, Dates and times. [Link](https://r4ds.hadley.nz/datetimes) - a gentle introduction to handling dates and times in R.

## Continue Learning

- [Time Series Objects in R: ts vs xts vs zoo vs tsibble](Time-Series-Objects-in-R.html) - the parent tutorial that compares the four time series classes and shows when each one fits.
- [Time Series Analysis With R](Time-Series-Analysis-With-R.html) - the full analysis workflow once your data lives in an xts object.
- [Time Series Forecasting With R](Time-Series-Forecasting-With-R.html) - take an aggregated series and forecast where it goes next.
