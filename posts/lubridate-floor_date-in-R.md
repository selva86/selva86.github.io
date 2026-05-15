---
title: "lubridate floor_date() in R: Snap Dates to Period Start"
slug: "lubridate-floor_date-in-R"
description: "Use lubridate floor_date() in R to snap dates and times down to the start of a unit: day, week, month, quarter, or 15-minute bucket for grouping and rollups."
keywords: "lubridate floor_date, floor_date function R, lubridate floor_date examples, round date down R, snap date to week R, lubridate ceiling_date vs floor_date, time bucketing R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "floor_date()|lubridate floor_date|lubridate::floor_date()|round date down|snap to period start"
auto_link_case_sensitive: true
target_keyword: "lubridate floor_date"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate floor_date() in R: Snap Dates to Period Start

<p class="lead">The <code>floor_date()</code> function in lubridate rounds a Date or POSIXct value down to the start of a chosen time unit, such as day, week, month, quarter, or a multiple like "15 mins". It is the canonical tool for grouping timestamps into period buckets, aligning time series to a regular grid, and computing the first day of the current period.</p>

[QUICK ANSWER]
floor_date(x, "day")                       # truncate time, keep date
floor_date(x, "week")                      # Sunday-start week by default
floor_date(x, "week", week_start = 1)      # Monday-start week
floor_date(x, "month")                     # first day of month
floor_date(x, "quarter")                   # start of Q1/Q2/Q3/Q4
floor_date(x, "year")                      # January 1 of the year
floor_date(x, "15 mins")                   # 15-minute bucket
floor_date(x, "2 hours")                   # 2-hour bucket
floor_date(now(), "hour")                  # top of current hour

[DECISION TREE: Is floor_date() the right tool?]
- snap a timestamp to the start of a period: floor_date(x, "month")
- snap UP to the end of a period: ceiling_date(x, "month")
- round to the NEAREST period boundary: round_date(x, "hour")
- last day of the month, not the first: rollback(ceiling_date(x, "month"))
- pull just the month or year number: month(x) or year(x)
- format a date as a year-month string: format(x, "%Y-%m")
- shift a date by a fixed period: x %m+% months(1)
- generate a regular sequence of buckets: seq(start, end, by = "month")

## What floor_date() does in one sentence

**`floor_date(x, unit)` returns the largest date or date-time at or before `x` that aligns with the chosen unit boundary.** Pass a Date or POSIXct vector and a unit string, and the function snaps each value backwards to the start of that bucket. February 14, 2024 with `unit = "month"` becomes February 1, 2024. A timestamp of 14:37:22 with `unit = "15 mins"` becomes 14:30:00.

The return class follows the input. A Date in produces a Date out when the unit is "day" or larger; a POSIXct in produces a POSIXct out at all unit sizes. Sub-day units force the result to POSIXct because Date cannot represent intra-day time.

## Syntax

**`floor_date(x, unit = "seconds", week_start = getOption("lubridate.week.start", 7))` takes three arguments.** `x` is the input date or date-time vector. `unit` is a string naming the rounding unit, optionally prefixed with a positive integer multiple. `week_start` controls which weekday starts a week and only matters when `unit = "week"`; 1 means Monday, 7 means Sunday.

Valid `unit` values include `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, `"bimonth"`, `"quarter"`, `"season"`, `"halfyear"`, and `"year"`. Plural forms ("seconds", "days") and abbreviations ("sec", "min", "mins") all work. A leading integer creates multi-unit buckets: `"15 mins"`, `"2 hours"`, `"3 days"`.

```r title="Load lubridate and snap a date"
library(lubridate)

d <- ymd("2024-02-14")
floor_date(d, "month")
#> [1] "2024-02-01"

t <- ymd_hms("2024-02-14 14:37:22")
floor_date(t, "hour")
#> [1] "2024-02-14 14:00:00 UTC"

floor_date(t, "15 mins")
#> [1] "2024-02-14 14:30:00 UTC"
```

The Date input returns a Date because `unit = "month"` is whole-day. The POSIXct input keeps time-of-day precision, and the 15-minute bucket lands on the largest multiple of 15 minutes at or before the timestamp.

[TIP]
**Use floor_date() for grouping, not period(x) arithmetic.** `floor_date(date, "month")` returns a single Date per month, perfect as a `group_by()` key for monthly rollups. Mixing `year() + month()` works but produces two columns; floor_date returns one Date that sorts correctly and joins cleanly against a calendar table.

## Five common patterns

### 1. Monthly rollup of a daily series

```r title="Group daily sales into monthly buckets"
library(dplyr)

set.seed(1)
sales <- tibble(
  sale_date = seq(ymd("2024-01-01"), ymd("2024-06-30"), by = "day"),
  amount = round(runif(182, 80, 220), 1)
)

sales |>
  group_by(month_start = floor_date(sale_date, "month")) |>
  summarise(total = round(sum(amount), 1), n = dplyr::n(), .groups = "drop")
#> # A tibble: 6 x 3
#>   month_start total     n
#>   <date>      <dbl> <int>
#> 1 2024-01-01  4615.    31
#> 2 2024-02-01  4326.    29
#> 3 2024-03-01  4733.    31
#> 4 2024-04-01  4341.    30
#> 5 2024-05-01  4810.    31
#> 6 2024-06-01  4424.    30
```

One Date column per month, ready to plot on a continuous time axis. `floor_date(x, "month")` returns the first day of the month, which sorts correctly and labels axes naturally.

### 2. Snap a timestamp to a 15-minute bucket

```r title="Bin POSIXct timestamps into 15-minute slots"
events <- ymd_hms(c(
  "2024-02-14 09:03:11",
  "2024-02-14 09:14:59",
  "2024-02-14 09:15:00",
  "2024-02-14 09:47:30"
))

floor_date(events, "15 mins")
#> [1] "2024-02-14 09:00:00 UTC" "2024-02-14 09:00:00 UTC"
#> [3] "2024-02-14 09:15:00 UTC" "2024-02-14 09:45:00 UTC"
```

The third event lands exactly on the 09:15 boundary and stays there because `floor_date()` is inclusive on the left edge. The fourth event snaps to 09:45 rather than rounding up to 10:00.

### 3. Week starts on Monday, not Sunday

```r title="Switch the week boundary"
d <- ymd(c("2024-02-12", "2024-02-13", "2024-02-14", "2024-02-15"))

floor_date(d, "week")
#> [1] "2024-02-11" "2024-02-11" "2024-02-11" "2024-02-11"

floor_date(d, "week", week_start = 1)
#> [1] "2024-02-12" "2024-02-12" "2024-02-12" "2024-02-12"
```

The default `week_start = 7` snaps to Sunday. Pass `week_start = 1` for Monday-start weeks, matching ISO 8601 and most European business calendars. Set `options(lubridate.week.start = 1)` once at the top of a script to make Monday the default for all calls.

### 4. First day of the current quarter

```r title="Find the start of the current quarter"
today_date <- ymd("2024-05-22")

floor_date(today_date, "quarter")
#> [1] "2024-04-01"

floor_date(today_date, "bimonth")
#> [1] "2024-05-01"

floor_date(today_date, "halfyear")
#> [1] "2024-01-01"
```

`"quarter"` snaps to January, April, July, or October. `"bimonth"` snaps to odd-numbered months (Jan, Mar, May, Jul, Sep, Nov). `"halfyear"` snaps to January or July. These are pre-baked aggregation buckets for fiscal reporting without writing custom logic.

### 5. floor_date() vs ceiling_date() vs round_date()

```r title="Three rounding directions side by side"
t <- ymd_hms("2024-02-14 14:37:22")

floor_date(t, "hour")
#> [1] "2024-02-14 14:00:00 UTC"

ceiling_date(t, "hour")
#> [1] "2024-02-14 15:00:00 UTC"

round_date(t, "hour")
#> [1] "2024-02-14 15:00:00 UTC"
```

`floor_date()` always rounds down (toward the earlier boundary). `ceiling_date()` always rounds up. `round_date()` picks whichever boundary is closer, breaking ties to the even one. For grouping into period buckets, pick `floor_date()` so timestamps in 14:00 to 14:59 collapse to the 14:00 bucket consistently.

[KEY INSIGHT]
**floor_date() is the inverse of period arithmetic, not the same.** `floor_date(x, "month")` collapses many dates to one (the period start). Operators like `x %m+% months(1)` shift one date by one period and keep the day-of-month. They answer opposite questions: "which bucket?" versus "one period later". Mixing the two pulls dates onto unintended grids; choose `floor_date()` whenever the goal is to align values onto a regular time grid.

## floor_date() vs the base R alternatives

**`floor_date()` competes with `cut()` and `as.Date(format(...))` for time bucketing.** Each base route produces a different output class.

| Style | Example | Returns | Reads best when |
|---|---|---|---|
| `floor_date()` | `floor_date(x, "month")` | Date or POSIXct | Bucketing for group_by, time-axis plots |
| `cut()` | `cut(x, breaks = "month")` | Factor | Histograms, ordered categorical analysis |
| `as.Date(format())` | `as.Date(format(x, "%Y-%m-01"))` | Date | Base R only, simple month bucket |

```r title="Compare floor_date with base alternatives"
d <- ymd(c("2024-02-14", "2024-03-31", "2024-12-25"))

data.frame(
  d         = d,
  lub_floor = floor_date(d, "month"),
  base_cut  = as.Date(cut(d, breaks = "month"))
)
#>            d  lub_floor   base_cut
#> 1 2024-02-14 2024-02-01 2024-02-01
#> 2 2024-03-31 2024-03-01 2024-03-01
#> 3 2024-12-25 2024-12-01 2024-12-01
```

Both return first-of-month Dates. `floor_date()` wins on readability, handles non-month units (week, quarter, "15 mins") in one call, and accepts multi-unit prefixes that base routes cannot.

## Common pitfalls

**Pitfall 1: passing a character.** `floor_date("2024-02-14", "month")` errors with a class mismatch. Wrap the input with `ymd()`, `as.Date()`, or `ymd_hms()` first.

**Pitfall 2: forgetting that the week default is Sunday.** `floor_date(d, "week")` returns the prior Sunday, not Monday. Pass `week_start = 1` or set `options(lubridate.week.start = 1)` for ISO-aligned weeks.

**Pitfall 3: time zone shifts at midnight.** `floor_date(t, "day")` uses `tz(t)`. If `t` is UTC and you live in Pacific, midnight UTC is 16:00 the prior day locally; the floored value crosses a calendar day. Call `with_tz(t, "America/Los_Angeles")` first when local-day buckets matter.

**Pitfall 4: multi-unit buckets anchor on the Unix epoch.** `"2 weeks"` aligns to 1970-01-01, not `min(x)`. The first boundary may not match the start of your data.

[WARNING]
**Sub-day units force POSIXct, not Date.** `floor_date(as.Date("2024-02-14"), "hour")` returns a POSIXct at UTC midnight, not a Date. The implicit class change can break downstream code that expects a Date column (joins, ggplot scales). Either keep the input as POSIXct from the start, or stick to whole-day units like "day", "week", "month", "quarter", "year".

[NOTE]
**Coming from Python pandas?** The equivalent of `floor_date(x, "month")` is `s.dt.to_period("M").dt.to_timestamp()` or `s.dt.floor("D")` for the day case. For arbitrary frequencies, pandas uses `s.dt.floor("15min")` which mirrors `floor_date(x, "15 mins")`. The lubridate version handles week, quarter, bimonth, and halfyear in one call; pandas requires `to_period()` with an offset alias.

## A practical workflow with floor_date()

**Time bucketing appears in three places: rollups, calendar joins, and event alignment.** Rollups use `group_by(period = floor_date(date, "week"))` for one row per period. Calendar joins build a `seq(start, end, by = "month")` and left-join to fill missing periods. Event alignment floors two streams to the same bucket before joining.

```r title="Weekly trend with explicit gap filling"
weekly <- sales |>
  group_by(week_start = floor_date(sale_date, "week", week_start = 1)) |>
  summarise(total = round(sum(amount), 1), .groups = "drop")

calendar <- tibble(
  week_start = seq(floor_date(min(sales$sale_date), "week", week_start = 1),
                   floor_date(max(sales$sale_date), "week", week_start = 1),
                   by = "week")
)

calendar |>
  left_join(weekly, by = "week_start") |>
  mutate(total = ifelse(is.na(total), 0, total)) |>
  head(5)
#> # A tibble: 5 x 2
#>   week_start total
#>   <date>     <dbl>
#> 1 2024-01-01  909.
#> 2 2024-01-08 1018.
#> 3 2024-01-15 1015.
#> 4 2024-01-22 1015.
#> 5 2024-01-29 1184.
```

The pattern guarantees every week in the range appears in the output, even weeks with zero sales. Without the calendar join, missing weeks silently drop from plots and bias every weekly metric downward.

## Try it yourself

**Try it:** Take the `airquality` dataset, build a Date column from Month and Day (year 1973), then compute the monthly average Ozone using `floor_date()`. Save the result to `ex_monthly_ozone`.

```r title="Your turn: monthly Ozone averages"
# Try it: monthly Ozone rollup with floor_date()
ex_air <- airquality |>
  mutate(date = make_date(1973, Month, Day))

ex_monthly_ozone <- # your code here

ex_monthly_ozone
#> Expected: 5 rows (May to September), one per month
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_monthly_ozone <- ex_air |>
  group_by(month_start = floor_date(date, "month")) |>
  summarise(avg_ozone = round(mean(Ozone, na.rm = TRUE), 1), .groups = "drop")

ex_monthly_ozone
#> # A tibble: 5 x 2
#>   month_start avg_ozone
#>   <date>          <dbl>
#> 1 1973-05-01       23.6
#> 2 1973-06-01       29.4
#> 3 1973-07-01       59.1
#> 4 1973-08-01       60  
#> 5 1973-09-01       31.4
```

**Explanation:** `floor_date(date, "month")` collapses the 153 daily rows into one Date per month (May 1, June 1, ...). Grouping by that Date and calling `mean(Ozone, na.rm = TRUE)` produces the monthly average Ozone, peaking in July and August as expected.

</details>

## Related lubridate functions

After mastering floor_date(), look at:

- `ceiling_date()`, `round_date()`: round up or to nearest period
- `rollback()`, `rollforward()`: snap to previous or next month end
- `year()`, `month()`, `quarter()`: extract calendar parts as integers
- `week()`, `isoweek()`, `epiweek()`: extract week-of-year
- `make_date()`, `make_datetime()`: build Dates from components
- `with_tz()`, `force_tz()`: align time zone before flooring

See the [lubridate floor_date documentation](https://lubridate.tidyverse.org/reference/round_date.html) for the official reference.

## FAQ

**What does floor_date() do in R?**

`floor_date(x, unit)` rounds a Date or POSIXct down to the largest unit boundary at or before `x`. With `unit = "month"`, February 14 becomes February 1. With `unit = "15 mins"`, 14:37:22 becomes 14:30:00. The function is vectorised and returns the same class as the input, except sub-day units which return POSIXct.

**How do I round a date to the nearest week in R?**

For week snapping, call `floor_date(date, "week")` for the prior Sunday or `floor_date(date, "week", week_start = 1)` for the prior Monday. To round to the nearest week boundary instead, use `round_date(date, "week")`. To snap forward, use `ceiling_date(date, "week")`. All three accept `week_start`.

**What is the difference between floor_date() and ceiling_date()?**

`floor_date()` rounds down to the boundary at or before `x`; `ceiling_date()` rounds up to the boundary at or after `x`. For 2024-02-14 with `unit = "month"`, floor returns 2024-02-01 and ceiling returns 2024-03-01. Pick floor for grouping into period buckets, ceiling for deadlines or month-end math.

**Can floor_date() handle 15-minute buckets?**

Yes. Pass a unit string with an integer prefix: `floor_date(x, "15 mins")`, `floor_date(x, "30 mins")`, or `floor_date(x, "2 hours")`. Any integer multiple of seconds, minutes, hours, days, or weeks works. Boundaries anchor on the Unix epoch, so verify the first bucket if exact calendar alignment matters.

**Does floor_date() respect time zones?**

Yes, but only the time zone of `x`. `floor_date(t, "day")` snaps to midnight in `tz(t)`, which may differ from local midnight if `t` is stored in UTC. Call `with_tz(t, "America/Los_Angeles")` before flooring when the local calendar day matters.
