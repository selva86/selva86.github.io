---
title: "lubridate ceiling_date() in R: Snap Dates to Period End"
slug: "lubridate-ceiling_date-in-R"
description: "Use lubridate ceiling_date() in R to snap dates and times up to the next unit. Compute month-end, quarter-end, year-end, and deadline buckets cleanly."
keywords: "lubridate ceiling_date, ceiling_date function R, lubridate ceiling_date examples, round date up R, snap to month end R, last day of month R, end of quarter R, change_on_boundary"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "ceiling_date()|lubridate ceiling_date|lubridate::ceiling_date()|round date up|snap to period end"
auto_link_case_sensitive: true
target_keyword: "lubridate ceiling_date"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate ceiling_date() in R: Snap Dates to Period End

<p class="lead">The <code>ceiling_date()</code> function in lubridate rounds a Date or POSIXct value up to the start of the next time unit, such as the next day, week, month, quarter, or 15-minute slot. It is the canonical tool for computing month-end deadlines, fiscal period boundaries, and the next occurrence of a calendar event.</p>

[QUICK ANSWER]
ceiling_date(x, "day")                          # next midnight
ceiling_date(x, "week")                         # next Sunday (default)
ceiling_date(x, "week", week_start = 1)         # next Monday
ceiling_date(x, "month")                        # first day of next month
ceiling_date(x, "month") - days(1)              # last day of THIS month
ceiling_date(x, "quarter")                      # start of next quarter
ceiling_date(x, "year")                         # Jan 1 of next year
ceiling_date(x, "hour", change_on_boundary = FALSE)  # keep value if on boundary
ceiling_date(x, "15 mins")                      # next 15-minute slot

[DECISION TREE: Is ceiling_date() the right tool?]
- snap UP to the next period boundary: ceiling_date(x, "month")
- snap DOWN to the current period start: floor_date(x, "month")
- round to the NEAREST boundary: round_date(x, "hour")
- last day of THIS month, not the first of next: ceiling_date(x, "month") - days(1)
- last business day of the month: bizdays::adjust.previous(...)
- add a fixed offset, not snap to a grid: x %m+% months(1)
- count days remaining in the quarter: as.numeric(ceiling_date(x, "quarter") - x)
- generate a regular grid of period ends: seq(start, end, by = "month") - days(1)

## What ceiling_date() does in one sentence

**`ceiling_date(x, unit)` returns the smallest date or date-time at or after `x` that aligns with the chosen unit boundary.** Pass a Date or POSIXct vector and a unit string; the function snaps each value forward to the start of the next bucket. February 14, 2024 with `unit = "month"` becomes March 1, 2024. A timestamp of 14:37:22 with `unit = "15 mins"` becomes 14:45:00.

The return class follows the input. A Date in produces a Date out when the unit is "day" or larger; a POSIXct in stays POSIXct. Sub-day units force the result to POSIXct because Date cannot represent intra-day time.

## Syntax

**`ceiling_date(x, unit = "seconds", change_on_boundary = NULL, week_start = getOption("lubridate.week.start", 7))` takes four arguments.** `x` is the input vector. `unit` names the rounding unit, optionally prefixed with a positive integer multiple. `change_on_boundary` controls behaviour when the input already sits exactly on a boundary. `week_start` defines the first day of the week and only matters when `unit = "week"`.

Valid `unit` values include `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, `"bimonth"`, `"quarter"`, `"season"`, `"halfyear"`, and `"year"`. Multi-unit buckets work via integer prefix: `"15 mins"`, `"2 hours"`, `"3 days"`.

```r title="Load lubridate and snap forward"
library(lubridate)

d <- ymd("2024-02-14")
ceiling_date(d, "month")
#> [1] "2024-03-01"

t <- ymd_hms("2024-02-14 14:37:22")
ceiling_date(t, "hour")
#> [1] "2024-02-14 15:00:00 UTC"

ceiling_date(t, "15 mins")
#> [1] "2024-02-14 14:45:00 UTC"
```

A Date input with a whole-day unit returns a Date. A POSIXct input keeps time-of-day precision. The 15-minute bucket lands on the smallest multiple of 15 minutes at or after the timestamp.

[TIP]
**Subtract one day from ceiling_date() to get period END.** `ceiling_date(d, "month") - days(1)` gives the last calendar day of the current month. The same trick with `"quarter"`, `"year"`, or `"week"` returns the last day of any period. This pattern avoids hardcoding 28, 30, or 31 day months and handles leap years correctly.

## Five common patterns

### 1. Last day of the month

```r title="End of month with ceiling_date minus one day"
d <- ymd(c("2024-01-15", "2024-02-14", "2024-02-29", "2024-12-31"))

ceiling_date(d, "month") - days(1)
#> [1] "2024-01-31" "2024-02-29" "2024-03-31" "2024-12-31"
```

This idiom handles every edge case: 31-day months, a 29-day leap February, and the year-end roll. The helper `rollback(ceiling_date(d, "month"))` returns the same answer.

### 2. Days remaining in the quarter

```r title="Quarter-end deadline counter"
today_date <- ymd("2024-05-22")

quarter_end <- ceiling_date(today_date, "quarter") - days(1)
quarter_end
#> [1] "2024-06-30"

as.numeric(quarter_end - today_date)
#> [1] 39
```

Useful for sales dashboards and fiscal close countdowns. `ceiling_date(x, "quarter")` returns the first day of the next quarter; subtracting `days(1)` lands on the current quarter end, and subtracting `today_date` gives the days remaining.

### 3. The change_on_boundary trick

```r title="Stay on the boundary or jump forward"
d <- ymd("2024-02-01")

ceiling_date(d, "month")
#> [1] "2024-03-01"

ceiling_date(d, "month", change_on_boundary = FALSE)
#> [1] "2024-02-01"

t <- ymd_hms("2024-02-14 14:00:00")
ceiling_date(t, "hour")
#> [1] "2024-02-14 14:00:00 UTC"

ceiling_date(t, "hour", change_on_boundary = TRUE)
#> [1] "2024-02-14 15:00:00 UTC"
```

The default is `TRUE` for Date input (always advance) and `FALSE` for POSIXct (stay put on the boundary). This asymmetry surprises many users; pass the argument explicitly when edge cases matter.

### 4. Next occurrence of a calendar event

```r title="Next Monday on or after each date"
d <- ymd(c("2024-02-12", "2024-02-13", "2024-02-19"))
# 2024-02-12 is a Monday, 02-13 is Tuesday, 02-19 is the next Monday

ceiling_date(d, "week", week_start = 1, change_on_boundary = FALSE)
#> [1] "2024-02-12" "2024-02-19" "2024-02-19"
```

`week_start = 1` defines Monday-start weeks. With `change_on_boundary = FALSE`, dates already on a Monday stay put. This is the lubridate way to ask for the upcoming Monday.

### 5. Aligning two time series to common period ends

```r title="Join daily readings to period-end checkpoints"
library(dplyr)

readings <- tibble(
  ts = ymd_hms(c("2024-02-29 23:30:00", "2024-03-01 00:30:00",
                 "2024-03-31 22:00:00", "2024-04-01 02:00:00")),
  value = c(10, 20, 30, 40)
)

readings |>
  mutate(period_end = ceiling_date(ts, "month") - seconds(1)) |>
  group_by(period_end) |>
  summarise(total = sum(value), .groups = "drop")
#> # A tibble: 3 x 2
#>   period_end          total
#>   <dttm>              <dbl>
#> 1 2024-02-29 23:59:59    10
#> 2 2024-03-31 23:59:59    50
#> 3 2024-04-30 23:59:59    40
```

The 23:30 reading on Feb 29 stays in February; the 00:30 reading on March 1 lands in March. `ceiling_date(ts, "month") - seconds(1)` produces the inclusive end-of-month POSIXct for joining to a period-end calendar.

[KEY INSIGHT]
**ceiling_date() answers "deadline questions"; floor_date() answers "bucket questions".** When you need the first day of the current month for grouping, use `floor_date(x, "month")`. When you need the first day of the next month, the last day of the current month, or the time until a period closes, use `ceiling_date(x, "month")`. The two functions are complementary halves of the same idea: snap a value to a period grid, looking backwards or forwards.

## ceiling_date() vs floor_date() vs round_date()

**The three lubridate rounders differ only in which boundary they pick.** For a timestamp midway through a period, each returns a different result.

| Function | Direction | 14:37:22 with "hour" | Pick when |
|---|---|---|---|
| `floor_date()` | Backward | 14:00:00 | Grouping into period buckets |
| `ceiling_date()` | Forward | 15:00:00 | Deadlines, period-end math, next-event |
| `round_date()` | Nearest | 15:00:00 | Visual binning, half-hour rounding |

```r title="Three rounders side by side"
t <- ymd_hms(c("2024-02-14 14:10:00", "2024-02-14 14:37:22"))

floor_date(t, "hour")
#> [1] "2024-02-14 14:00:00 UTC" "2024-02-14 14:00:00 UTC"

ceiling_date(t, "hour")
#> [1] "2024-02-14 15:00:00 UTC" "2024-02-14 15:00:00 UTC"

round_date(t, "hour")
#> [1] "2024-02-14 14:00:00 UTC" "2024-02-14 15:00:00 UTC"
```

`floor_date()` always rounds down and `ceiling_date()` always rounds up. `round_date()` picks whichever boundary is closer: the 14:10 timestamp rounds down to 14:00, and 14:37 rounds up to 15:00.

## Common pitfalls

**Pitfall 1: passing a character.** `ceiling_date("2024-02-14", "month")` errors. Wrap the input with `ymd()`, `as.Date()`, or `ymd_hms()` first.

**Pitfall 2: forgetting the change_on_boundary asymmetry.** A Date already on the boundary advances by default; a POSIXct already on the boundary does not. Set the argument explicitly when correctness on boundary inputs matters.

**Pitfall 3: confusing month-end with ceiling_date().** `ceiling_date(ymd("2024-02-14"), "month")` returns March 1, not February 29. For the last day of the input month, subtract one day: `ceiling_date(d, "month") - days(1)` or call `rollback(ceiling_date(d, "month"))`.

**Pitfall 4: multi-unit buckets anchor on the Unix epoch.** `ceiling_date(x, "2 weeks")` snaps to a 2-week grid aligned to 1970-01-01, not a custom start date. Use `floor_date(x, "week") + weeks(2)` for a data-anchored alignment.

[WARNING]
**Sub-day units force POSIXct output even from Date input.** `ceiling_date(as.Date("2024-02-14"), "hour")` returns a POSIXct at UTC midnight of the next day, not a Date. The class change can silently break joins, ggplot scales, or `as.Date()` round trips. Keep the input as POSIXct from the start, or stick to whole-day units (day, week, month, quarter, year) when the output must remain a Date.

[NOTE]
**Coming from Python pandas?** The equivalent of `ceiling_date(x, "month")` is `s.dt.to_period("M").dt.to_timestamp() + pd.offsets.MonthBegin(1)` or `s + pd.offsets.MonthEnd(0) + pd.Timedelta(days=1)`. For sub-day units, pandas exposes `s.dt.ceil("15min")`, mirroring `ceiling_date(x, "15 mins")`. The lubridate version handles week, quarter, bimonth, and halfyear in one call.

## A practical workflow with ceiling_date()

**Period-end math appears in three places: deadlines, billing cycles, and event scheduling.** Deadlines count days until a fiscal close. Billing cycles snap a service-start date to the next invoice anniversary. Scheduling finds the next standup or review on or after a date.

```r title="Subscription end dates from start dates"
subs <- tibble(
  customer = c("A", "B", "C"),
  start    = ymd(c("2024-01-15", "2024-02-29", "2024-12-20"))
)

subs |>
  mutate(
    first_full_month = ceiling_date(start, "month"),
    annual_renewal   = ceiling_date(start, "year"),
    days_until_renew = as.numeric(annual_renewal - start)
  )
#> # A tibble: 3 x 5
#>   customer start      first_full_month annual_renewal days_until_renew
#>   <chr>    <date>     <date>           <date>                    <dbl>
#> 1 A        2024-01-15 2024-02-01       2025-01-01                  352
#> 2 B        2024-02-29 2024-03-01       2025-01-01                  308
#> 3 C        2024-12-20 2025-01-01       2025-01-01                   12
```

Each row gets its first full billing month, the next January 1 renewal, and a countdown. The leap-day customer (B) snaps cleanly to March 1.

## Try it yourself

**Try it:** Take the `airquality` dataset, build a Date column from Month and Day (year 1973), then compute the month-end date and the days remaining until month-end for each row. Save the result to `ex_air_with_end`.

```r title="Your turn: month-end countdown"
# Try it: compute month-end and days-remaining for each row
ex_air <- airquality |>
  mutate(date = make_date(1973, Month, Day))

ex_air_with_end <- # your code here

head(ex_air_with_end[, c("date", "month_end", "days_left")], 5)
#> Expected: month_end is last day of each row's month, days_left is non-negative
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_air_with_end <- ex_air |>
  mutate(
    month_end = ceiling_date(date, "month") - days(1),
    days_left = as.numeric(month_end - date)
  )

head(ex_air_with_end[, c("date", "month_end", "days_left")], 5)
#>         date  month_end days_left
#> 1 1973-05-01 1973-05-31        30
#> 2 1973-05-02 1973-05-31        29
#> 3 1973-05-03 1973-05-31        28
#> 4 1973-05-04 1973-05-31        27
#> 5 1973-05-05 1973-05-31        26
```

**Explanation:** `ceiling_date(date, "month") - days(1)` returns the last day of each row's month, handling 30 versus 31 day months automatically. Subtracting `date` gives the integer count of days remaining until month-end, which is a useful feature for time-decay models and end-of-period reporting.

</details>

## Related lubridate functions

After mastering ceiling_date(), look at:

- `floor_date()`, `round_date()`: snap down or to nearest period
- `rollback()`, `rollforward()`: jump to the last or first day of an adjacent month
- `year()`, `month()`, `quarter()`: extract calendar parts as integers
- `make_date()`, `make_datetime()`: build Dates from components
- `with_tz()`, `force_tz()`: align time zone before rounding
- `days()`, `weeks()`, `months()`, `years()`: build offset periods for arithmetic

See the [lubridate round_date documentation](https://lubridate.tidyverse.org/reference/round_date.html) for the official reference covering all three rounders.

## FAQ

**What does ceiling_date() do in R?**

`ceiling_date(x, unit)` rounds a Date or POSIXct value up to the smallest unit boundary at or after `x`. With `unit = "month"`, February 14 becomes March 1. With `unit = "15 mins"`, 14:37:22 becomes 14:45:00. The function is vectorised and returns the same class as the input, except sub-day units which return POSIXct.

**How do I get the last day of the month in R?**

Subtract one day from `ceiling_date()` with `unit = "month"`: `ceiling_date(d, "month") - days(1)`. This handles 28, 29, 30, and 31 day months correctly, including leap years. The helper `rollback(ceiling_date(d, "month"))` returns the same answer. Both work for vectors of dates and POSIXct timestamps.

**What is the difference between ceiling_date() and floor_date()?**

`ceiling_date()` rounds up to the boundary at or after `x`; `floor_date()` rounds down to the boundary at or before `x`. For 2024-02-14 with `unit = "month"`, ceiling returns 2024-03-01 and floor returns 2024-02-01. Pick ceiling for deadlines, period-end math, and next-event calculations; pick floor for grouping into period buckets.

**What does change_on_boundary do in ceiling_date()?**

`change_on_boundary` controls behaviour when `x` already sits exactly on a unit boundary. `TRUE` always advances by one period; `FALSE` keeps `x` unchanged. The default is `TRUE` for Date input and `FALSE` for POSIXct input. Pass it explicitly when boundary correctness matters, especially in scheduling code where a midnight timestamp should or should not advance to the next day.

**Does ceiling_date() respect time zones?**

Yes, but only the time zone of `x`. `ceiling_date(t, "day")` snaps to midnight in `tz(t)`, which may differ from your local midnight if `t` is UTC. Call `with_tz(t, "America/Los_Angeles")` before rounding when the local calendar boundary matters.
