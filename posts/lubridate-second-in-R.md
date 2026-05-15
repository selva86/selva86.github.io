---
title: "lubridate second() in R: Extract Seconds From Datetimes"
slug: "lubridate-second-in-R"
description: "Use lubridate second() to extract the 0 to 59 second component of POSIXct datetimes in R, replace it in place, capture subsecond precision, and bucket events."
keywords: "lubridate second, second function R, lubridate second examples, extract second from datetime R, R datetime seconds, lubridate hour minute second, subsecond precision R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "second()|lubridate second|lubridate::second()|extract second from datetime|second component"
auto_link_case_sensitive: true
target_keyword: "lubridate second"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate second() in R: Extract Seconds From Datetimes

<p class="lead">The <code>second()</code> function in lubridate returns the second-of-minute component of a POSIXct or POSIXlt value as a numeric vector. It is the only time-component getter that can return fractional values, which makes it the right tool for log analysis, latency measurement, and any workflow that needs subsecond precision.</p>

[QUICK ANSWER]
second(ymd_hms("2024-07-15 14:30:45"))         # 45 (the second-of-minute)
second(now())                                  # second of current datetime
second(as.POSIXct("2024-07-15 09:15:30"))      # works on base POSIXct too
second(c(ymd_hms("2024-07-15 09:00:05"),
         ymd_hms("2024-07-15 21:45:59")))      # vectorised
second(x) <- 0                                 # snap to top of the minute
df %>% mutate(s = second(timestamp))           # extract a column
filter(events, second(ts) %in% 0:9)            # only first 10 seconds
table(second(events$ts) %/% 10)                # 10 second buckets

[DECISION TREE: Is second() the right tool?]
- pull the second 0 to 59 from a datetime: second(x)
- pull the hour or minute of the timestamp: hour(x), minute(x)
- bucket timestamps to 10 or 30 second marks: floor_date(x, "10 secs")
- compute seconds between two datetimes: as.numeric(b - a, units = "secs")
- add or subtract a second offset: x + seconds(30)
- build a datetime from components: make_datetime(y, m, d, h, mn, s)
- show milliseconds in printed datetimes: options(digits.secs = 3)
- get the time-of-day as text: format(x, "%H:%M:%S")

## What second() does in one sentence

**`second()` returns the second-of-minute component of a datetime as a numeric value.** Pass any POSIXct or POSIXlt vector and you get a numeric vector of the same length, ranging from 0 up to (but not including) 60, with any fractional seconds preserved.

This is the lubridate counterpart to base R's `format(x, "%S")` and `as.POSIXlt(x)$sec`. The lubridate version is shorter, vectorised, and returns a numeric you can use directly in arithmetic, modulo bucketing, or `dplyr::filter()`. It pairs naturally with `hour()` and `minute()` for full time-of-day work, and preserves the sub-second resolution that API logs, financial tick data, and IoT telemetry depend on.

## Syntax

**`second(x)` accepts a datetime vector and returns a numeric vector of the same length.** There are no optional arguments. The replacement form `second(x) <- value` overwrites the second while preserving the date, hour, and minute.

```r title="Load lubridate and pull a second"
library(lubridate)

second(ymd_hms("2024-07-15 14:30:45"))
#> [1] 45
```

`second()` is generic and dispatches on the class of `x`. It supports POSIXct (the default datetime class), POSIXlt (list-based datetimes), and Period objects. For Date objects, which have no time component, it returns 0.

```r title="Inputs second() accepts"
second(as.POSIXct("2024-07-15 14:30:45"))         # POSIXct
#> [1] 45
second(as.POSIXlt("2024-07-15 14:30:45"))         # POSIXlt
#> [1] 45
second(period("1 day 2 hours 30 minutes 45 secs")) # Period
#> [1] 45
second(as.Date("2024-07-15"))                      # Date has no time
#> [1] 0
```

[NOTE]
**`second()` always returns numeric, never integer.** This is unique among the time-component getters. `hour()` and `minute()` return integers because hours and minutes are whole units; `second()` returns numeric so it can carry fractional seconds for high-resolution timestamps.

## Six common patterns

**These six patterns cover roughly 90% of real-world `second()` usage.** Each is short, copy-paste ready, and uses POSIXct values constructed with `ymd_hms()`.

### 1. Extract the second from a single datetime

**Pass any POSIXct value and you get back the second-of-minute.** The return type is numeric so you can immediately do arithmetic on it.

```r title="Extract from a parsed string"
ts <- ymd_hms("2024-07-15 14:30:45")
second(ts)
#> [1] 45
```

### 2. Vectorise across a column

**`second()` is fully vectorised, so it works without `sapply()` or `map()`.** Pass a vector and get a vector back. An `NA` datetime in maps to `NA` in the result.

```r title="Vectorise over events"
events <- ymd_hms(c("2024-07-15 09:00:05",
                    "2024-07-15 12:15:30",
                    "2024-07-15 21:45:59"))
second(events)
#> [1]  5 30 59
```

### 3. Capture subsecond precision

**Subsecond values are stored, but only displayed if you raise `digits.secs`.** Set the option once per session and lubridate will keep the decimal in print output. Maximum useful precision is 6 digits (microseconds), beyond which floating-point rounding noise creeps in.

```r title="Subsecond values from a high-resolution timestamp"
options(digits.secs = 3)
ts <- ymd_hms("2024-07-15 14:30:45.123")
second(ts)
#> [1] 45.123
```

[KEY INSIGHT]
**The fractional value lives in the POSIXct itself, not in lubridate.** `options(digits.secs)` only controls how R prints numbers and datetimes. The underlying storage is always full-precision. If `second(ts)` returns a clean integer, the source string never had subseconds.

### 4. Replace the second in place

**Assign with `second(x) <- value` to rewrite the second while keeping the date, hour, and minute.** This is the cleanest way to snap timestamps to the top of a minute.

```r title="Snap all events to the top of the minute"
events <- ymd_hms(c("2024-07-15 09:00:13",
                    "2024-07-15 12:15:42"))
second(events) <- 0
events
#> [1] "2024-07-15 09:00:00 UTC" "2024-07-15 12:15:00 UTC"
```

### 5. Bucket timestamps by 10 second windows

**Integer-divide the second by your window size to label each event by its bucket.** This is faster than `floor_date()` when you only need the within-minute bucket index and not a new POSIXct value. Pick a divisor that evenly divides 60 (5, 10, 15, 20, 30) to keep bucket sizes equal.

```r title="10 second buckets for an event log"
log <- ymd_hms(c("2024-07-15 09:00:03",
                 "2024-07-15 09:00:14",
                 "2024-07-15 09:00:27",
                 "2024-07-15 09:00:38"))
second(log) %/% 10
#> [1] 0 1 2 3
```

### 6. Filter by seconds-of-minute inside dplyr

**Use `second()` inside `filter()` to keep rows whose timestamp falls in a given second range.** This is the standard pattern for clock-aligned sampling.

```r title="Keep rows in the first 5 seconds of each minute"
library(dplyr)
df <- tibble::tibble(
  ts = ymd_hms(c("2024-07-15 09:00:02",
                 "2024-07-15 09:00:30",
                 "2024-07-15 09:01:04"))
)
df %>% filter(second(ts) < 5)
#> # A tibble: 2 x 1
#>   ts
#>   <dttm>
#> 1 2024-07-15 09:00:02
#> 2 2024-07-15 09:01:04
```


## second() vs minute() vs hour() vs format()

**Use `second()` when you need the second component as a number you can compute on.** Use `format()` only for display strings.

| Approach | Return type | Speed (1M rows) | Subseconds | Use when |
|---|---|---|---|---|
| `second(x)` | numeric (0 up to 60) | Fast | Yes | You need the second value for math, filtering, or bucketing |
| `minute(x)` | integer (0 to 59) | Fast | No | You need the minute-of-hour |
| `hour(x)` | integer (0 to 23) | Fast | No | You need the hour-of-day |
| `format(x, "%S")` | character | Slower | No | You only need to display a time string |
| `as.POSIXlt(x)$sec` | numeric | Medium | Yes | You are avoiding the lubridate dependency |

`second()` is the only one of these that preserves subsecond precision in its return value. `format()` truncates to the displayed seconds and returns the literal string `"NA"` for missing inputs, which breaks downstream comparisons. `second()` propagates `NA` cleanly.

[TIP]
**Pick `second()` for analysis and `format()` for output.** Numeric returns flow into `filter()`, `mutate()`, `group_by()`, and arithmetic. Character returns from `format()` are for labels in plots, reports, and log lines.

## Common pitfalls

**Three issues catch people new to `second()`.** Each is easy to fix once you know to look for it.

The first is assuming integer return. `is.integer(second(ts))` returns `FALSE`. Use `as.integer(second(ts))` if a downstream function strictly requires integer type.

The second is reading the raw POSIXct and seeing whole seconds. By default R prints datetimes with no decimal. Run `options(digits.secs = 3)` to expose milliseconds; the data is unchanged, only display.

The third is overflow during replacement. Setting `second(x) <- 90` does not error. lubridate rolls the value over, so the minute and possibly the hour increment. If you want to clamp instead of roll, use `pmin(60, value)` before assignment.

Timezone is a non-issue: `second()` returns the same value regardless of the tz of `x`.

[WARNING]
**`second()` is masked by `data.table::second()` if you load data.table after lubridate.** The data.table version returns integer seconds and silently drops subseconds. Call it with `lubridate::second()` if both packages are loaded.

## A practical workflow with second()

**A common task: count events by 10 second window across a busy minute of a log.** This pattern shows up in API latency monitoring and IoT sensor work.

```r title="Bucket a one-minute log slice"
library(dplyr)
library(lubridate)
library(tibble)

set.seed(42)
log <- tibble(
  event = paste0("e", 1:200),
  ts    = ymd_hms("2024-07-15 14:30:00") + seconds(runif(200, 0, 60))
)

log %>%
  mutate(bucket = paste0(second(ts) %/% 10 * 10, "s")) %>%
  count(bucket, name = "events")
#> # A tibble: 6 x 2
#>   bucket events
#>   <chr>   <int>
#> 1 0s         33
#> 2 10s        37
#> 3 20s        30
#> 4 30s        36
#> 5 40s        32
#> 6 50s        32
```

Six buckets, each labelled by its lower bound. To extend the technique across an hour, combine with `minute()`: grouping by `(minute_of_hour, second_bucket)` gives a deterministic integer label cheaper to join on than a full POSIXct truncation.

## Try it yourself

**Try it:** From the vector `times` below, keep only entries in the second half of any minute (second 30 or later), then return their seconds as an integer vector. Save the result to `ex_secs`.

```r title="Your turn: filter and extract seconds"
times <- ymd_hms(c("2024-07-15 09:00:12",
                   "2024-07-15 09:00:45",
                   "2024-07-15 09:01:05",
                   "2024-07-15 09:01:55"))

ex_secs <- # your code here

ex_secs
#> Expected: 45 55
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_secs <- as.integer(second(times[second(times) >= 30]))
ex_secs
#> [1] 45 55
```

**Explanation:** `second(times) >= 30` builds a logical mask for the second half of any minute. Subsetting `times` with that mask keeps two values. A second call to `second()` extracts the second component, and `as.integer()` returns a plain integer vector.

</details>

## Related lubridate functions

- [`hour()`](lubridate-hour-in-R.html) returns hour-of-day (0 to 23) as an integer.
- [`minute()`](lubridate-minute-in-R.html) returns minute-of-hour (0 to 59) as an integer.
- [`floor_date()`](https://lubridate.tidyverse.org/reference/round_date.html) rounds a datetime down to a unit, returning a POSIXct rather than a bucket index.
- [`seconds()`](https://lubridate.tidyverse.org/reference/seconds.html) (plural) builds a Period of N seconds to add or subtract.
- [`make_datetime()`](https://lubridate.tidyverse.org/reference/make_datetime.html) builds a POSIXct from year, month, day, hour, minute, second.

## FAQ

**Does lubridate second() return an integer or a numeric?**

`second()` always returns numeric, never integer. Seconds can have a fractional component (milliseconds, microseconds) and an integer return would silently drop it. Wrap in `as.integer()` if a downstream API requires integer type; equality comparisons against integer literals like `30L` still work because R coerces automatically.

**Why does second() print as a whole number when my timestamp has milliseconds?**

R hides subseconds in printed output by default. The fractional value is stored correctly in the POSIXct; only the print method truncates it. Run `options(digits.secs = 3)` once at the top of your session (or set it in `.Rprofile`) and you will see three decimal places. Maximum precision is six digits.

**Can I use second() on a Date object?**

Yes, and it returns 0. Date objects have no time component, so lubridate treats them as midnight. This is convenient for code that mixes Date and POSIXct inputs, but it can hide bugs if you expected a real second value. Convert to POSIXct first with `as.POSIXct()` if you want to be explicit.

**What is the difference between second() and seconds()?**

`second()` (singular) is a getter: pass a datetime, get the second component as numeric. `seconds()` (plural) is a constructor: pass a number, get a Period object representing that many seconds. So `second(x)` reads, and `x + seconds(30)` writes by offset.

**How fast is second() on large columns?**

Very fast. On a 1 million row POSIXct column, `second(x)` runs in well under a second. If a script feels slow, the bottleneck is almost never `second()`; profile parsing or join steps first.
