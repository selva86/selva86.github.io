---
title: "High-Frequency Time Series in R: Intraday xts and quantmod"
slug: "High-Frequency-Time-Series-in-R"
description: "Handle intraday data in R with xts: build tick data from raw timestamps, slice by time of day, aggregate ticks into bars, and compute VWAP correctly."
keywords: "high-frequency time series R, intraday data R, xts intraday, quantmod R, tick data R, to.period R, VWAP in R, endpoints period.apply"
auto_link_terms: "high-frequency time series|high-frequency data|intraday data in R|intraday time series|intraday bars|tick data|trade ticks|xts intraday|to.period|VWAP|volume-weighted average price|period.apply|align.time|getSymbols|quantmod"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "FR-foun-2"
post_type: "FR"
fr_parent: "Time-Series-Objects-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">High-frequency time series data is data that arrives many times per second rather than once per day, which breaks the usual assumption that observations sit in evenly spaced slots. In R, the practical toolkit is <code>xts</code> for storing and slicing irregular timestamps, plus <code>quantmod</code> for fetching market data and pulling columns out of it. This post builds one trading session from raw trades and works through slicing, bar aggregation, VWAP, and the time-zone traps that quietly corrupt intraday results.</p>

Everything below uses one concrete session. **Meridian Freight (ticker MFT) traded on Monday 2026-03-02, from 09:30 to 16:00 New York time.** The exchange feed gives us one row per executed trade: a timestamp, a price near $48, and the number of shares. Trades land whenever a buyer and seller match, so the timestamps are irregular. That session also had a 20-minute trading halt starting at 11:00, which gives us a real gap to reason about instead of a hypothetical one.

If you have not met `xts` before, the parent post [Time Series Objects in R](Time-Series-Objects-in-R.html) introduces it alongside `ts`, `zoo`, and `tsibble`. You do not need it to follow along: the first block below builds an `xts` from scratch and explains every argument.

## What makes intraday data different from daily data?

A daily series has one slot per day, and the slots never move. That is the assumption baked into R's built-in `ts` class: give it a start date and a frequency, and it computes every timestamp by counting forward. Intraday trade data has no slots at all. A trade happens or it does not, and the gap between two trades can be a millisecond or twenty minutes.

Here is the MFT session. The code builds it from scratch so you can run every block on this page in order.

```r title="One session of Meridian Freight trades"
suppressMessages(library(xts))
options(xts_check_TZ = FALSE)   # silence a repeated note about the system time zone

set.seed(302)
session_open  <- as.POSIXct("2026-03-02 09:30:00", tz = "America/New_York")
session_close <- as.POSIXct("2026-03-02 16:00:00", tz = "America/New_York")

# Trades land when they land: draw a random gap (in seconds) before each one,
# then add the gaps up to get an arrival time for every trade.
gaps_sec <- rexp(5200, rate = 1 / 5)      # gaps averaging 5 seconds
stamps   <- session_open + cumsum(gaps_sec)
stamps   <- stamps[stamps < session_close]

# MFT was halted for 20 minutes at 11:00, so no trades printed in that window.
halt_start <- as.POSIXct("2026-03-02 11:00:00", tz = "America/New_York")
halt_end   <- as.POSIXct("2026-03-02 11:20:00", tz = "America/New_York")
stamps     <- stamps[stamps < halt_start | stamps >= halt_end]

n_trades <- length(stamps)
price    <- round(48 + cumsum(rnorm(n_trades, 0, 0.01)), 2)
size     <- sample(c(100, 200, 300, 500, 1000), n_trades, replace = TRUE)

ticks <- xts(data.frame(price = price, size = size), order.by = stamps)

head(ticks, 3)
#>                     price size
#> 2026-03-02 09:30:00 48.01  200
#> 2026-03-02 09:30:01 48.01  100
#> 2026-03-02 09:30:08 47.99  200
nrow(ticks)
#> [1] 4328
```

That is 4,328 trades in one session for one stock. Look at the first three timestamps: 09:30:00, then 09:30:01, then 09:30:08. One second, then seven seconds. Nothing about that spacing is regular, and no `frequency` argument could describe it.

A quick note on the code, since a few pieces may be unfamiliar. `rexp()` draws random waiting times from an exponential distribution, which is the standard model for "events arriving independently at some average rate"; `rate = 1/5` means the gaps average 5 seconds. `cumsum()` adds those gaps up so each trade gets an arrival time. `rnorm(n, 0, 0.01)` draws small random price changes, and `cumsum()` turns them into a wandering price. The `xts(...)` call at the end is the important one, and the next section pulls it apart.

Let us measure the irregularity rather than assert it. `index(ticks)` pulls out the timestamps, and `diff()` on those timestamps gives the gap before each trade.

```r title="How far apart are consecutive trades?"
seconds_between <- as.numeric(diff(index(ticks)), units = "secs")

summary(seconds_between)
#>      Min.   1st Qu.    Median      Mean   3rd Qu.      Max.
#> 1.280e-03 1.467e+00 3.550e+00 5.407e+00 7.095e+00 1.207e+03
max(seconds_between)
#> [1] 1207.205
```

Read the summary from left to right. The shortest gap between two trades was 0.00128 seconds, roughly one millisecond. The median gap was 3.55 seconds. The longest gap was 1,207 seconds, which is 20 minutes and 7 seconds. That maximum is not noise: it is the trading halt. The feed contains no rows at all between 11:00 and 11:20, so the gap from the last trade before the halt to the first trade after it shows up as the largest number in the table.

This is the first thing to internalize about high-frequency data. **A gap is an absence of rows, not a row containing `NA`.** Nothing in the object announces the halt. It is visible only as a stretch of time with no observations, which is why you have to go looking for it.

`xts` will happily report an average spacing, and the number it gives is worth seeing precisely because of how misleading it is.

```r title="The average spacing is real, and it describes nothing"
periodicity(ticks)
#> 3.54974722862244 seconds periodicity from 2026-03-02 09:30:00.893353 to 2026-03-02 15:59:57.598862
```

`periodicity()` reports the average time between observations, here 3.55 seconds. That number is arithmetically correct and practically useless: not one trade in this session arrived exactly 3.55 seconds after the previous one, and the spacing ranges over six orders of magnitude, from a millisecond to twenty minutes. Treat `periodicity()` on tick data as a rough scale check ("am I looking at seconds or minutes?") and never as a frequency you could rebuild the index from.

> **Watch out:** Look closely at the timestamps in that output: `09:30:00.893353`. The trades carry sub-second precision, but the earlier `head(ticks, 3)` printed them as plain `09:30:00`. R's default is to hide fractional seconds when printing. The precision is in the data; it just is not on screen unless you ask.

## How do you build an xts from raw trade timestamps?

An `xts` object is two things bolted together: a matrix of data, and a time index that labels every row. The constructor takes the data as its first argument and the index as `order.by`. That is the whole idea, and it is why `xts` can hold irregular data when `ts` cannot: the timestamps are stored explicitly, one per row, instead of being computed from a start and a frequency.

Let us inspect the index we just built, this time asking R to show the fractional seconds.

```r title="The index is a real vector of instants"
options(digits.secs = 3)   # show 3 decimal places on timestamps

index(ticks)[1:3]
#> [1] "2026-03-02 09:30:00.893 EST" "2026-03-02 09:30:01.911 EST" "2026-03-02 09:30:08.250 EST"
tzone(ticks)
#> [1] "America/New_York"
class(index(ticks))
#> [1] "POSIXct" "POSIXt"
```

Three things to take from this. First, `options(digits.secs = 3)` reveals the sub-second detail that was there all along: the first trade printed at 09:30:00.893, not 09:30:00. Second, the index is a `POSIXct` vector, which is R's type for a specific instant in time, stored underneath as the number of seconds since 1970-01-01 UTC. Third, `tzone()` shows the index carries a time zone attribute, `America/New_York`, and that the timestamps display as `EST`. Hold on to that attribute: section six is about the damage it does when it is wrong.

One convenience worth knowing, because raw feeds are messier than the tidy example above: `xts` sorts by time for you. You never have to check whether your rows arrived in order.

```r title="Out-of-order input comes back sorted"
options(digits.secs = 0)

# Three timestamps deliberately out of order: 09:32, then 09:30:30, then 09:31.
out_of_order <- c(session_open + 120, session_open + 30, session_open + 60)
out_of_order
#> [1] "2026-03-02 09:32:00 EST" "2026-03-02 09:30:30 EST" "2026-03-02 09:31:00 EST"

messy <- xts(c(48.10, 48.02, 48.06), order.by = out_of_order)
messy
#>                      [,1]
#> 2026-03-02 09:30:30 48.02
#> 2026-03-02 09:31:00 48.06
#> 2026-03-02 09:32:00 48.10
```

The input vector went in as 09:32, 09:30:30, 09:31 with prices 48.10, 48.02, 48.06. The object came out in clock order, and critically, each price stayed with its own timestamp: 48.02 is still on the 09:30:30 row. `xts` sorted the index and carried the data along with it. That matters when you merge feeds from several venues, where nothing guarantees the combined rows arrive in time order.

## How do you grab one slice of the trading day?

Most intraday questions are about a window: the opening 15 minutes, the last hour, the minutes around a news release. `xts` has a subsetting grammar built for exactly this. You pass a character string to `[`, and it parses it as a time range rather than as row numbers.

The general form is `object["from/to"]`, where both sides are dates or timestamps written largest-unit-first (year, month, day, hour, minute, second).

```r title="A window of the session, by clock time"
opening_15 <- ticks["2026-03-02 09:30/2026-03-02 09:45"]

nrow(opening_15)
#> [1] 172
head(opening_15, 2)
#>                     price size
#> 2026-03-02 09:30:00 48.01  200
#> 2026-03-02 09:30:01 48.01  100
tail(opening_15, 1)
#>                     price size
#> 2026-03-02 09:45:44 47.95  500
```

172 trades printed in the opening 15 minutes. Note what we did **not** have to do: no `which()`, no comparison operators, no converting timestamps to numbers. The string `"2026-03-02 09:30/2026-03-02 09:45"` says "from 09:30 to 09:45 on this date" and `xts` does the rest. The truncated forms are allowed too, so `ticks["2026-03-02"]` would give the whole day and `ticks["2026-03"]` the whole month.

There is a second form specifically for intraday work. Prefix a time with `T` and you select that time of day across every date in the object. Since our object holds a single session the distinction does not change the answer here, but on a multi-day object `["T09:30/T09:34"]` means "these minutes of every day", which is the natural way to ask most intraday questions.

Before you use it, learn the one rule that catches everyone: **the endpoint is inclusive down to the precision you wrote.** `T09:34` does not mean the instant 09:34:00. It means the whole 09:34 minute, right through 09:34:59. So `"T09:30/T09:34"` is the five minutes 09:30:00 to 09:34:59, and `"T09:30/T09:35"` would be *six* minutes, not five. Off-by-one-minute windows are one of the easiest ways to quietly compare the wrong things.

```r title="Time-of-day slicing, and the halt showing up as absence"
nrow(ticks["T09:30/T09:34"])    # the first five minutes, 09:30:00 to 09:34:59
#> [1] 49
nrow(ticks["T12:00/T12:04"])    # five minutes at lunch
#> [1] 50
nrow(ticks["T11:00/T11:19"])    # the halt window, 11:00:00 to 11:19:59
#> [1] 0
```

The first five minutes had 49 trades and a five-minute stretch at lunch had 50, which are comfortably similar. Notice the halt query too: the halt ran 11:00 to 11:20, and `"T11:00/T11:19"` covers exactly that, because `T11:19` runs through 11:19:59. Writing `T11:20` would have reached into the 11:20 minute and caught the first trades after the reopen.

That halt window returns **zero rows**. Not 20 rows of `NA`, not an error. The query is perfectly valid, and the honest answer is that nothing traded. This is the concrete version of the point from section one, and it is the single most common source of intraday bugs: code that assumes every window contains at least one row will divide by zero here, silently or loudly, depending on how lucky you are.

**Try it:** How many trades printed in the last 10 minutes of the session, from 15:50 to 16:00? What was the price range over that window?

<details><summary>Click to reveal solution</summary>

```r title="Closing 10 minutes solution"
closing_10 <- ticks["T15:50/T16:00"]

nrow(closing_10)
#> [1] 111
range(closing_10$price)
#> [1] 48.42 48.54
```

111 trades in the closing 10 minutes, against 49 in the opening five. Volume clustering near the close is a real market pattern, and the `T` grammar is how you go looking for it. The price wandered between $48.42 and $48.54 over that stretch, up from the $48.01 it opened at.

By the endpoint rule, `T16:00` does reach through 16:00:59, so this window is nominally 11 minutes. It does not matter here: the session closed at 16:00 and the last trade printed at 15:59:57, so there is nothing in that final minute to pick up. Worth checking rather than assuming, which is exactly the habit the rule is meant to build.

</details>

## How do you turn ticks into bars?

Almost nobody analyses raw ticks directly. 4,328 rows for one stock for one day becomes billions of rows across a real universe of names, and the tick sequence is mostly noise at that resolution. The standard move is to **aggregate ticks into bars**: chop the session into fixed windows and summarise each window with four numbers.

Those four numbers are called OHLC, and each is a summary of all the ticks inside the window:

- **Open**: the price of the first trade in the window
- **High**: the highest trade price in the window
- **Low**: the lowest trade price in the window
- **Close**: the price of the last trade in the window

![Diagram showing 49 irregular ticks inside one 5-minute window being reduced by to.period into a single bar row with Open, High, Low and Close, and a note listing what the aggregation discards](screenshots/High-Frequency-Time-Series-in-R-tick-to-bar.webp)

*Figure 1: How 49 irregular trades between 09:30:00 and 09:34:59 collapse into one bar. The bar keeps four prices and throws away every share size, the arrival order, and the 45 prices in between.*

`to.period()` does the aggregation. The `period` argument names the unit and `k` says how many of them make one window.

```r title="4,328 ticks become 74 five-minute bars"
bars5 <- to.period(ticks$price, period = "minutes", k = 5, OHLC = TRUE)
colnames(bars5) <- c("Open", "High", "Low", "Close")

head(bars5, 3)
#>                      Open  High   Low Close
#> 2026-03-02 09:34:55 48.01 48.01 47.93 47.97
#> 2026-03-02 09:39:51 47.96 48.00 47.90 47.91
#> 2026-03-02 09:44:58 47.91 47.93 47.84 47.93
nrow(ticks)
#> [1] 4328
nrow(bars5)
#> [1] 74
```

Check the first bar against the diagram: Open 48.01, High 48.01, Low 47.93, Close 47.97. Those four numbers summarise 49 separate trades, and those are the very same 49 trades you sliced out with `ticks["T09:30/T09:34"]` in the last section: the first bar covers 09:30:00 to 09:34:59, so the slice and the bar see exactly the same rows. Open 48.01 is the first of those trades, Close 47.97 the last. Across the session, 4,328 rows became 74, a roughly 58-fold reduction.

Now the two details that catch people.

**The bar count is not what you would guess.** A 6.5-hour session is 390 minutes, which would be 78 five-minute bars. We got 74. The missing four are the halt: `to.period()` creates a bar only where ticks exist, so the 20 dead minutes produce no rows rather than four empty ones. Aggregation does not fill gaps, it inherits them.

**The bar is stamped at its last trade, not at its window boundary.** The first bar's timestamp is 09:34:55, not 09:35:00, because 09:34:55 is when the last trade inside that window happened. This is a deliberate design choice (the stamp is a real instant that really occurred), and it is also a trap when you try to line two series up. Section six fixes it.

> **Note:** Aggregation is lossy by construction, and the loss is the point. The four OHLC numbers deliberately discard share sizes and arrival order. If your question needs volume (VWAP is the obvious case), do not compute it from bars. Compute it from the ticks, as the next section does.

**Try it:** Build one-minute bars instead of five-minute bars. How many rows do you get, and does the number make sense given the halt?

<details><summary>Click to reveal solution</summary>

```r title="One-minute bars solution"
bars1 <- to.period(ticks$price, period = "minutes", k = 1, OHLC = TRUE)

nrow(bars1)
#> [1] 370
nrow(ticks) / nrow(bars1)
#> [1] 11.6973
```

370 bars, and the arithmetic confirms the rule exactly. The session runs 390 minutes. The halt removes 20 of them, leaving 370. Every minute that contained at least one trade produced exactly one bar, and the 20 halted minutes produced none. Each bar now averages 11.7 ticks instead of 58.5.

</details>

## How do you compute VWAP over custom windows?

`to.period()` gives you OHLC, and that is all it gives you. When you need a different statistic per window, the pattern is two functions: `endpoints()` finds where each window ends, and `period.apply()` runs your function over each window.

`endpoints()` returns the **row positions** that close each window. It always starts with 0 and ends with the final row, which is what makes it safe to feed straight into `period.apply()`.

```r title="Where does each 30-minute window end?"
ep <- endpoints(ticks, on = "minutes", k = 30)

length(ep)
#> [1] 14
head(ep, 5)
#> [1]    0  338  692 1050 1160
nrow(ticks)
#> [1] 4328
```

Read those numbers carefully. `ep` has 14 entries, which bound 13 windows, and 13 half-hours is 6.5 hours: the full session. The values are row numbers, not times. The first window runs from row 1 to row 338; the second picks up at row 339 and closes at row 692. The leading 0 is a boundary marker rather than a real row.

The fourth window is worth a look: it ends at row 1160, only 110 rows after the third ended at 1050, while the others each hold roughly 350. That thin window is the half-hour containing the halt. Twenty of its thirty minutes had no trading, so it collected a third of the usual rows. The irregularity from section one is still visible this far down the pipeline.

Now the statistic. **VWAP** is the volume-weighted average price: the average price paid per share over a window, where a trade counts in proportion to how many shares it moved. Formally, for \(n\) trades in a window with prices \(p_i\) and share sizes \(q_i\):

\[
\text{VWAP} = \frac{\sum_{i=1}^{n} p_i q_i}{\sum_{i=1}^{n} q_i}
\]

Every symbol there: \(p_i\) is the price of trade \(i\), \(q_i\) is the number of shares in trade \(i\), \(n\) is the number of trades in the window, and \(\sum\) means "add up over all the trades". The numerator is total dollars traded and the denominator is total shares traded, so the ratio is dollars per share. Contrast that with a plain average of the prices, \(\frac{1}{n}\sum p_i\), which counts a 100-share trade and a 40,000-share trade equally.

```r title="VWAP per 30-minute window, against a plain average"
vwap_of <- function(window) {
  sum(window$price * window$size) / sum(window$size)
}

vwap30  <- period.apply(ticks, INDEX = ep, FUN = vwap_of)
plain30 <- period.apply(ticks$price, INDEX = ep, FUN = function(x) mean(x))

compare <- merge(round(vwap30, 4), round(plain30, 4))
colnames(compare) <- c("vwap", "plain_mean")
head(compare, 4)
#>                        vwap plain_mean
#> 2026-03-02 09:59:54 47.9508    47.9501
#> 2026-03-02 10:29:54 48.0655    48.0651
#> 2026-03-02 10:59:58 48.0361    48.0414
#> 2026-03-02 11:29:56 48.1040    48.1032
```

`period.apply()` called `vwap_of()` once per window, handing it the rows in that window as a small `xts` object. Inside the function, `window$price * window$size` is the dollars in each trade, `sum()` of that is total dollars, and dividing by total shares gives VWAP.

And the two columns are nearly identical. 47.9508 against 47.9501 is a difference of seven hundredths of a cent. This is worth being honest about rather than glossing over: **in this simulated session, VWAP tells you almost nothing a plain average would not.** The reason is in how the data was built. Back in section one, `size` was drawn with `sample()` completely independently of `price`. When trade size carries no relationship to price, weighting by size changes nothing on average, so the two converge.

Real markets are not like that, and one trade is enough to show why. Suppose a pension fund dumps 40,000 shares at 47.80 at 09:47, in a window where everything else traded near 47.95.

```r title="One institutional block, and the two averages part company"
block_trade <- xts(data.frame(price = 47.80, size = 40000),
                   order.by = as.POSIXct("2026-03-02 09:47:00", tz = "America/New_York"))
ticks_blk <- rbind(ticks, block_trade)

ep_blk    <- endpoints(ticks_blk, on = "minutes", k = 30)
vwap_blk  <- period.apply(ticks_blk, INDEX = ep_blk, FUN = vwap_of)
plain_blk <- period.apply(ticks_blk$price, INDEX = ep_blk, FUN = function(x) mean(x))

after <- merge(round(vwap_blk, 4), round(plain_blk, 4))
colnames(after) <- c("vwap", "plain_mean")

head(after, 1)     # with the block trade
#>                        vwap plain_mean
#> 2026-03-02 09:59:54 47.9158    47.9496
head(compare, 1)   # without it
#>                        vwap plain_mean
#> 2026-03-02 09:59:54 47.9508    47.9501
```

One extra row out of 339 moved VWAP from 47.9508 to 47.9158, a drop of 3.5 cents, while the plain mean moved from 47.9501 to 47.9496, half of one hundredth of a cent. The reason is the weights. That half hour traded 172,500 shares in total, and the block alone was 40,000 of them, so it deserves a little under a quarter of the say in the average price paid per share. VWAP gives it exactly that. The plain mean treats it as 1 of 339 trades, worth 0.3% of the answer, and effectively ignores it.

That is the whole case for VWAP, and it is also its limit. VWAP is the price the market actually transacted at, which is why it is the standard benchmark for execution quality. It is not a robust average: a single large print moves it, by design. If you want a summary that shrugs off one big trade, VWAP is the wrong tool and you want a median or a trimmed mean instead.

## Why do time zones and bar stamps bite intraday data?

Two traps in this section, and both are quiet. Neither raises an error. They just give you wrong answers.

**The time zone trap.** A `POSIXct` is an absolute instant, stored as seconds since 1970 in UTC. The `tzone` attribute does not change which instant it is, only how it is displayed and how a time-of-day query is interpreted.

```r title="One instant, three ways of saying it"
first_trade <- index(ticks)[1]

format(first_trade, tz = "America/New_York", usetz = TRUE)
#> [1] "2026-03-02 09:30:00 EST"
format(first_trade, tz = "UTC", usetz = TRUE)
#> [1] "2026-03-02 14:30:00 UTC"
format(first_trade, tz = "Asia/Kolkata", usetz = TRUE)
#> [1] "2026-03-02 20:00:00 IST"
```

The same trade, the same instant, three labels: 09:30 in New York, 14:30 in UTC, 20:00 in Kolkata. Nothing about the data changed. Now watch what happens when a time-of-day query meets the wrong zone.

```r title="The same query, the same data, a different answer"
ticks_utc <- ticks
tzone(ticks_utc) <- "UTC"    # relabel the index; the instants are untouched

nrow(ticks["T09:30/T09:34"])         # NY-stamped object, NY market open
#> [1] 49
nrow(ticks_utc["T09:30/T09:34"])     # UTC-stamped object, same query
#> [1] 0
nrow(ticks_utc["T14:30/T14:34"])     # UTC-stamped object, UTC market open
#> [1] 49
```

This is the trap in three lines. Asking for the first five minutes of the session gives 49 trades when the object is stamped `America/New_York`. The identical query against the identical trades gives **zero** once the index is relabelled `UTC`, because 09:30 UTC is 04:30 in New York, hours before the bell. Ask for 14:30 UTC instead and the 49 trades reappear.

Nothing errored. If you had wrapped that in an opening-range strategy, it would have returned an empty result and you might have concluded the stock did not trade. The lesson: `tzone` is not cosmetic. Set it to the exchange's zone when you build the object, and check it whenever data arrives from somewhere else. Feeds very commonly ship UTC timestamps for a market that opens at 09:30 local.

> **Watch out:** Trading sessions are defined in local wall-clock time, so a market opening at 09:30 New York is 13:30 UTC in summer and 14:30 UTC in winter. Storing intraday data in UTC and slicing it with fixed UTC times will silently shift your windows by an hour on daylight-saving changeovers. Keep the exchange's zone on the index and let R handle the offsets.

**The stamp alignment trap.** Recall that `to.period()` stamps each bar at its last trade. That is honest but awkward: two stocks bar-aggregated over the same window get different stamps, because their last trades happened at different moments, so merging them lines nothing up. `align.time()` fixes this by rounding each stamp up to the end of its window. The `n` argument is the window length in seconds, so a 5-minute window is `n = 300`.

```r title="Snapping bar stamps to the window boundary"
head(index(bars5), 3)
#> [1] "2026-03-02 09:34:55 EST" "2026-03-02 09:39:51 EST" "2026-03-02 09:44:58 EST"

bars5_aligned <- align.time(bars5, n = 300)
head(index(bars5_aligned), 3)
#> [1] "2026-03-02 09:35:00 EST" "2026-03-02 09:40:00 EST" "2026-03-02 09:45:00 EST"
```

The ragged stamps 09:34:55, 09:39:51, 09:44:58 became the clean grid 09:35:00, 09:40:00, 09:45:00. Now a second stock aggregated the same way lands on the same stamps and `merge()` pairs the bars correctly. The prices are untouched; only the labels moved.

Be clear-eyed about what you traded away: the aligned stamp is a label for a window, not an instant when anything happened. No trade occurred at 09:35:00. That is fine for merging and plotting, and it is wrong if you feed those stamps to something that assumes each row marks a real event.

## Where does quantmod actually fit?

`quantmod` is the package most people reach for first, and it is worth being precise about what it does, because it is easy to assume it is the intraday engine. It is not. **`quantmod` is a data-access and convenience layer that sits on top of `xts`.** Everything in the sections above was `xts` doing the work. What `quantmod` adds is a way to get market data in, and some accessors for getting columns out.

The headline function is `getSymbols()`, which fetches from Yahoo Finance and other sources. Note the ticker change here: Meridian Freight is a stock we invented and simulated, so no real feed has ever heard of it. To show a live fetch we have to ask for a stock that actually exists, so this one block steps away from MFT and uses Apple. `getSymbols()` also needs a network connection, so it will not run in your browser. Copy it into a local R session to try it.

```r-static title="getSymbols fetches daily bars (run this locally)"
suppressMessages(library(quantmod))

aapl_daily <- getSymbols("AAPL", src = "yahoo", auto.assign = FALSE,
                         from = "2026-01-02", to = "2026-01-08")

head(aapl_daily[, 1:5], 3)
#>            AAPL.Open AAPL.High AAPL.Low AAPL.Close AAPL.Volume
#> 2026-01-02    272.26    277.84   269.00     271.01    37838100
#> 2026-01-05    270.64    271.51   266.14     267.26    45647200
#> 2026-01-06    267.00    267.55   262.12     262.36    52352100
colnames(aapl_daily)
#> [1] "AAPL.Open"     "AAPL.High"     "AAPL.Low"      "AAPL.Close"    "AAPL.Volume"   "AAPL.Adjusted"
```

Two things to notice. `auto.assign = FALSE` makes `getSymbols()` return the object instead of silently creating a variable named `AAPL` in your workspace, which is the older default and a common surprise. And the returned object's class is `xts`. Every technique in this post applies to it directly.

The more important thing is what that block is **not**. Those are daily bars, one row per trading day. Free public sources do not serve years of tick data, and `getSymbols()` intraday coverage is limited to recent days at coarse resolution where it exists at all. Genuine high-frequency history comes from paid vendors or your broker's feed, and it arrives as CSV or a database extract that you load and wrap in `xts()` yourself, exactly as the first block of this post did.

What `quantmod` genuinely gives you day to day are accessors. `Cl()` pulls the close column, with `Op()`, `Hi()`, `Lo()`, and `Vo()` doing the obvious equivalents, and they find the right column by name so you do not hard-code positions. `Delt()` computes period-over-period returns.

```r title="quantmod accessors, working on our own bars"
suppressMessages(library(quantmod))

head(Cl(bars5), 3)
#>                     Close
#> 2026-03-02 09:34:55 47.97
#> 2026-03-02 09:39:51 47.91
#> 2026-03-02 09:44:58 47.93
head(Delt(Cl(bars5)), 3)
#>                     Delt.1.arithmetic
#> 2026-03-02 09:34:55                NA
#> 2026-03-02 09:39:51     -0.0012507817
#> 2026-03-02 09:44:58      0.0004174494
```

`Cl(bars5)` found the `Close` column by name. `Delt()` returned bar-over-bar returns: the first is `NA` because there is no prior bar to compare against, then -0.00125 (the close fell from 47.97 to 47.91, about a 0.13% drop) and +0.00042. That `NA` in row one is correct and expected; every differencing operation costs you the first observation.

For a tick-level change, build it explicitly from the numeric prices rather than differencing the `xts` object.

```r title="Tick-to-tick price change, built explicitly"
tick_change <- xts(c(NA, diff(as.numeric(ticks$price))), order.by = index(ticks))
colnames(tick_change) <- "change"

head(tick_change, 4)
#>                     change
#> 2026-03-02 09:30:00     NA
#> 2026-03-02 09:30:01   0.00
#> 2026-03-02 09:30:08  -0.02
#> 2026-03-02 09:30:08   0.00
sum(tick_change$change != 0, na.rm = TRUE)
#> [1] 2726
```

Read the pattern from the inside out. `as.numeric(ticks$price)` drops to a plain numeric vector, `diff()` gives the 4,327 changes between consecutive prices, `c(NA, ...)` puts an `NA` in front so the result is 4,328 long again and each change sits on the trade it belongs to, and `xts(...)` re-attaches the original index. The result: of the 4,327 trades that had a previous trade to compare against, 2,726 moved the price at all, so roughly 37% printed at exactly the price before them. Long runs at the same price are utterly normal in tick data and worth expecting.

> **Note:** Building the change vector explicitly, as above, is the portable choice: `diff()` and `lag()` applied directly to an `xts` object are known to misbehave in some runtimes, including the in-browser one that powers the runnable blocks on this page. Working on the numeric vector and re-wrapping costs one extra line. It reads more plainly, and it behaves the same everywhere.

## FAQ

**Can I use `getSymbols()` to download real intraday tick data?**
Not in any serious quantity. Free public sources serve daily bars reliably; intraday coverage through `getSymbols()` is limited to recent days at coarse resolution, and true tick history is a paid product. In practice you buy the data or pull it from your broker, then load the CSV and wrap it with `xts()` yourself. The upside is that everything in this post works identically on data you loaded, because `getSymbols()` returns a plain `xts` object anyway.

**Why does my 6.5-hour session not produce 78 five-minute bars?**
Because `to.period()` creates a bar only for windows that actually contain trades. Our session produced 74 rather than 78, and the four missing bars are the 20-minute halt. This is the correct behavior, but it means you cannot assume a fixed row count per day, and code that indexes bars by position will drift the moment a halt or a thin period appears. Index by time, never by row number.

**Should I use `xts` or `data.table` for high-frequency work?**
Both are used seriously. `xts` is the better fit when your work is time-indexed by nature: the date-string subsetting, `to.period()`, `endpoints()`, and `align.time()` are all built around a time index and have no clean equivalent elsewhere. `data.table` wins on raw scale, since it handles tens of millions of rows more comfortably and its `roll` joins are excellent for matching trades to quotes. A common pattern is `data.table` for heavy loading and joining, then `xts` for the time-series operations.

**How do I handle multiple trades with the same timestamp?**
`xts` permits duplicate index values, so nothing breaks, but functions differ in how they treat them. If your feed reports whole seconds, several trades will genuinely share a stamp. The two honest options are to aggregate them into one row per stamp (sum the sizes, take a volume-weighted price) or to keep them and accept the duplicates. What you should not do is silently drop them: each one is a real trade, and dropping them corrupts any volume-based statistic including VWAP.

**Why is my VWAP different from my broker's?**
Usually the trade filter, not the arithmetic. Exchanges publish condition codes that mark trades as out-of-sequence, late-reported, or auction prints, and the standard VWAP benchmark excludes several of these. Opening and closing auction volume is a common point of disagreement. Compare the total share count in your window against theirs first; if the denominators differ, the filter is the culprit rather than the formula.

**Do I need `align.time()` if I only work with one stock?**
No. It matters when you merge, because two series bar-aggregated over the same windows carry different last-trade stamps and will not line up. For a single series, the ragged stamps are actually more informative, since each one is a real instant a trade occurred. Align when you need a shared grid; leave it alone when you do not.

## Summary

| Task | Function | Watch out for |
|---|---|---|
| Store irregular trades | `xts(data, order.by = timestamps)` | `order.by` must be `POSIXct` with the exchange's `tzone` |
| See sub-second detail | `options(digits.secs = 3)` | Precision is stored but hidden by default |
| Measure spacing | `periodicity()`, `diff(index(x))` | The average spacing describes no actual trade |
| Slice a window | `x["2026-03-02 09:30/09:45"]` | Largest unit first |
| Slice a time of day | `x["T09:30/T09:34"]` | The endpoint is inclusive: `T09:34` runs through 09:34:59. Interpreted in the index's `tzone` |
| Aggregate to bars | `to.period(x, "minutes", k = 5)` | Gaps produce no bar; stamps land on the last trade |
| Custom per-window stat | `endpoints()` + `period.apply()` | `endpoints()` returns row positions, not times |
| Volume-weighted price | `sum(p * q) / sum(q)` on ticks | Compute from ticks; bars have thrown volume away |
| Line up bar stamps | `align.time(x, n = 300)` | The aligned stamp is a label, not a real event |
| Fetch market data | `quantmod::getSymbols()` | Daily bars; needs network; true tick data is a paid feed |

The through-line: intraday data is a list of events, not a grid of slots. Gaps are missing rows rather than `NA` values, the time zone on the index changes what your queries mean, and every aggregation step throws something away that you may need later. `xts` gives you the time index and the tools to slice and aggregate it; `quantmod` gets data in and columns out. Our MFT session started as 4,328 irregular trades and ended as 74 bars, a VWAP per half hour, and a clean 5-minute grid, with the 11:00 halt visible at every stage as an absence rather than an error.

## References

1. Ryan, J. A. & Ulrich, J. M. *xts: eXtensible Time Series*. The package's own introductory vignette covers construction, subsetting, and the `to.period()` family. [cran.r-project.org/package=xts](https://cran.r-project.org/package=xts)
2. *xts FAQ* vignette. Short answers to the questions that bite in practice, including duplicate index values and time-zone handling. [cran.r-project.org/web/packages/xts/vignettes/xts-faq.pdf](https://cran.r-project.org/web/packages/xts/vignettes/xts-faq.pdf)
3. Ulrich, J. M. *quantmod: Quantitative Financial Modelling Framework*. Reference for `getSymbols()` sources and the `Op`/`Hi`/`Lo`/`Cl`/`Vo` accessors. [cran.r-project.org/package=quantmod](https://cran.r-project.org/package=quantmod)
4. Zeileis, A. & Grothendieck, G. *zoo: S3 Infrastructure for Regular and Irregular Time Series*. `xts` extends `zoo`, so this is the layer underneath the index. [cran.r-project.org/package=zoo](https://cran.r-project.org/package=zoo)
5. R Core Team. *Time Zones in R*. The authoritative note on how `POSIXct` stores instants and what the `tzone` attribute actually controls. [stat.ethz.ch/R-manual/R-devel/library/base/html/timezones.html](https://stat.ethz.ch/R-manual/R-devel/library/base/html/timezones.html)
6. R Core Team. *Date-Time Classes*. Definitive on `POSIXct` versus `POSIXlt`, and on `digits.secs` for sub-second printing. [stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html](https://stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html)
7. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed. The standard modern reference for what comes after the data-handling stage. [otexts.com/fpp3](https://otexts.com/fpp3/)

## Continue Learning

- [Time Series Objects in R](Time-Series-Objects-in-R.html), the parent post, which places `xts` next to `ts`, `zoo`, and `tsibble` and explains when each class is the right container.
- [Visualize Time Series in R](Visualize-Time-Series-in-R.html), for plotting the bars you just built, including seasonal and lag plots.
- [Moving Averages in R](Moving-Averages-in-R.html), the natural next step once you have a bar series: `rollapply()` and friends work on any `xts` object, including the 5-minute bars from this page.
