---
title: "lubridate minute() in R: Extract Minutes From Datetimes"
slug: "lubridate-minute-in-R"
description: "Use lubridate minute() to extract the 0 to 59 minute component of a POSIXct datetime in R, replace it in place, and bucket timestamps for SLA and polling work."
keywords: "lubridate minute, minute function R, lubridate minute examples, extract minute from datetime R, minute from POSIXct, lubridate hour minute second, R datetime minute"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "minute()|lubridate minute|lubridate::minute()|extract minute from datetime|minute component"
auto_link_case_sensitive: true
target_keyword: "lubridate minute"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate minute() in R: Extract Minutes From Datetimes

<p class="lead">The <code>minute()</code> function in lubridate returns the minute-of-hour component of a POSIXct or POSIXlt value as an integer between 0 and 59. It is vectorised across datetime columns, supports in-place replacement, and pairs with <code>hour()</code> and <code>second()</code> for full time-of-day work.</p>

[QUICK ANSWER]
minute(ymd_hms("2024-07-15 14:30:00"))         # 30 (the minute-of-hour)
minute(now())                                  # minute of current datetime
minute(as.POSIXct("2024-07-15 09:15:00"))      # works on base POSIXct too
minute(c(ymd_hms("2024-07-15 09:00:00"),
         ymd_hms("2024-07-15 21:45:00")))      # vectorised
minute(x) <- 0                                 # snap to top of the hour
df %>% mutate(m = minute(timestamp))           # extract a column
filter(events, minute(ts) %% 5 == 0)           # 5-minute marks only
table(minute(events$ts) %/% 15)                # 15-minute buckets

[DECISION TREE: Is minute() the right tool?]
- pull the minute 0 to 59 from a datetime: minute(x)
- pull the hour or second of the timestamp: hour(x), second(x)
- bucket timestamps to 5 or 15 minute marks: floor_date(x, "5 mins")
- compute minutes between two datetimes: as.numeric(b - a, units = "mins")
- add or subtract a minute offset: x + minutes(15)
- build a datetime from components: make_datetime(y, m, d, h, mn, s)
- get the date part only: as_date(x)
- format the time as "HH:MM": format(x, "%H:%M")

## What minute() does in one sentence

**`minute()` returns the minute-of-hour component of a datetime as an integer between 0 and 59.** Pass any POSIXct or POSIXlt vector and you get a numeric vector of the same length, with the top of the hour as 0 and the last minute before the next hour as 59.

This is the lubridate counterpart to base R's `format(x, "%M")` and `as.POSIXlt(x)$min`. The lubridate version is shorter, vectorised, and returns an integer you can use directly in arithmetic, modulo bucketing, or `dplyr::filter()`.

## Syntax

**`minute(x)` accepts a datetime vector and returns an integer vector of the same length.** There are no optional arguments. The replacement form `minute(x) <- value` overwrites the minute while preserving the date, hour, and second.

```r title="Load lubridate and pull a minute"
library(lubridate)

minute(ymd_hms("2024-07-15 14:30:00"))
#> [1] 30

minute(ymd_hms("2024-07-15 14:00:45"))
#> [1] 0

class(minute(ymd_hms("2024-07-15 14:30:00")))
#> [1] "integer"
```

The input must be a class lubridate recognises as a datetime: `POSIXct` or `POSIXlt`. A plain `Date` has no time component, so `minute(as.Date("2024-07-15"))` returns `0` after silent coercion to midnight UTC, which is rarely what you want. Parse strings with `ymd_hms()`, `mdy_hms()`, or `as.POSIXct()` first.

[TIP]
**Use `minute(x) <- value` to overwrite the minute in place.** This is the replacement form. It keeps the date, hour, and second untouched, so you can snap an entire column of timestamps to the top of the hour with one assignment without disturbing the date or hour columns.

## Six common patterns

### 1. Extract the minute from a single datetime

```r title="Minute of a parsed datetime"
ts <- ymd_hms("2024-07-15 14:30:00")
minute(ts)
#> [1] 30
```

The result is integer 30, not the string `"30"`. Use it in arithmetic directly: `minute(ts) %% 15` returns 0, telling you the timestamp lands on a 15-minute boundary.

### 2. Extract minutes from a vector of datetimes

```r title="Vectorised over a datetime column"
events <- ymd_hms(c("2024-07-15 09:05:12",
                    "2024-07-15 09:17:48",
                    "2024-07-15 09:30:00",
                    "2024-07-15 09:59:31"))
minute(events)
#> [1]  5 17 30 59
```

`minute()` is fully vectorised. A million-row column becomes a million-row integer vector in one call. The top of the hour returns 0, the last minute returns 59.

### 3. Replace minute values in place

```r title="Snap timestamps to the top of the hour"
schedule <- ymd_hms(c("2024-07-15 14:37:22",
                      "2024-07-16 21:48:09",
                      "2024-07-17 03:11:55"))
minute(schedule) <- 0
second(schedule) <- 0
schedule
#> [1] "2024-07-15 14:00:00 UTC" "2024-07-16 21:00:00 UTC"
#> [3] "2024-07-17 03:00:00 UTC"
```

The replacement form keeps the date and hour untouched. Pairing it with `second(x) <- 0` aligns a column of timestamps to a clean hour boundary. To snap to a specific minute mark, set the value to 15, 30, or 45.

### 4. Use minute() inside a dplyr pipeline

```r title="Add minute of hour as a column"
library(dplyr)

requests <- tibble(
  ts = ymd_hms(c("2024-07-15 09:05:12", "2024-07-15 09:17:48",
                 "2024-07-15 09:30:00", "2024-07-15 09:42:33",
                 "2024-07-15 09:59:31")),
  latency_ms = c(120, 95, 410, 88, 150)
)

requests %>%
  mutate(m = minute(ts))
#> # A tibble: 5 x 3
#>   ts                  latency_ms     m
#>   <dttm>                   <dbl> <int>
#> 1 2024-07-15 09:05:12        120     5
#> 2 2024-07-15 09:17:48         95    17
#> 3 2024-07-15 09:30:00        410    30
#> 4 2024-07-15 09:42:33         88    42
#> 5 2024-07-15 09:59:31        150    59
```

`mutate(m = minute(ts))` adds a minute-of-hour column. This is the start of any analysis that asks "are latency spikes clustered around the top of the hour?" or "do polling jobs land on the same minute marks?".

### 5. Filter rows on minute marks

```r title="Keep only 15-minute boundaries"
requests %>%
  filter(minute(ts) %% 15 == 0)
#> # A tibble: 1 x 2
#>   ts                  latency_ms
#>   <dttm>                   <dbl>
#> 1 2024-07-15 09:30:00        410
```

`minute(ts) %% 15 == 0` keeps timestamps whose minute lands on a multiple of 15 (0, 15, 30, 45), the canonical filter for a quarter-hour cron job. Replace 15 with 5 or 30 to match other polling intervals.

### 6. Bucket timestamps into 15-minute windows

```r title="15-minute window counts"
requests %>%
  count(window = minute(ts) %/% 15, name = "requests") %>%
  arrange(window)
#> # A tibble: 4 x 2
#>   window requests
#>    <dbl>    <int>
#> 1      0        1
#> 2      1        1
#> 3      2        1
#> 4      3        2
```

`minute(ts) %/% 15` integer-divides by 15, producing 0, 1, 2, or 3 for the four quarter-hour windows; `count()` then collapses rows by window. The simplest SLA bucket count when scoped to a single hour. For multi-hour bucketing, prefer `floor_date(ts, "15 mins")`.

[KEY INSIGHT]
**`minute()` returns the minute COMPONENT, while `minutes(n)` and `dminutes(n)` build a DURATION of n minutes.** The accessor and the constructors share a name root but do opposite things. `minute(ts)` extracts a 0-to-59 integer from a datetime; `ts + minutes(15)` adds 15 minutes to a datetime. Mixing them up corrupts feature engineering and produces silently wrong arithmetic.

## minute() vs hour() vs second() vs format()

**Three lubridate accessors split a timestamp into hour, minute, and second integers; `format()` returns the same parts as a string.**

| Function | Returns | Range | Typical use |
|---|---|---|---|
| `hour()` | Hour of day | 0 to 23 | Diurnal grouping, business-hours filters |
| `minute()` | Minute of hour | 0 to 59 | Sub-hour bucketing, SLA windows, polling marks |
| `second()` | Second of minute | 0 to 59.99 | Precision timing, log replay |
| `format(x, "%H:%M")` | "HH:MM" string | character | Display only; not numeric |

The accessors return integers you can compare and aggregate. `format()` returns characters that force an `as.numeric()` conversion if you want to compute on them. Reach for `minute()`, `hour()`, `second()` for analysis; reach for `format()` for printed output.

```r title="Three datetime accessors on the same value"
ts <- ymd_hms("2024-07-15 14:30:45")
hour(ts)
#> [1] 14
minute(ts)
#> [1] 30
second(ts)
#> [1] 45
format(ts, "%H:%M:%S")
#> [1] "14:30:45"
```

14:30:45 returns 14, 30, 45 for hour, minute, second. The three integers reconstruct the time-of-day; `format()` returns the same data as a single character string.

## Common pitfalls

**Pitfall 1: confusing `minute()` with `minutes()` or `dminutes()`.** `minute(x)` extracts the minute component (returns 0 to 59). `minutes(15)` builds a Period of 15 minutes; `dminutes(15)` builds a Duration of 900 seconds. The first reads from a timestamp, the other two add to one. `x + minute(x)` is almost always a bug; you probably meant `x + minutes(15)`.

**Pitfall 2: passing a Date instead of a POSIXct.** `minute(as.Date("2024-07-15"))` returns `0` because Date has no time component; lubridate silently coerces to midnight UTC. Parse with `ymd_hms()` or `as.POSIXct()` first so the time survives.

[WARNING]
**Modulo bucketing on `minute()` only works inside a single hour.** `minute(ts) %/% 15` gives 0, 1, 2, or 3 for one hour, but timestamps in the next hour also produce 0, 1, 2, 3, so groupings collapse across hours. For analysis that spans multiple hours or days, switch to `floor_date(ts, "15 mins")`, which preserves the full datetime so each 15-minute window remains distinct.

[NOTE]
**Coming from Python pandas?** The equivalent of `minute(x)` is `s.dt.minute` on a datetime Series. The dplyr pipeline `mutate(m = minute(ts))` mirrors `df.assign(m=df.ts.dt.minute)`. Pandas also returns a 0-to-59 integer, so the convention matches lubridate exactly.

## A practical workflow with minute()

**Minute of hour shows up in three places: filtering for polling marks, building a sub-hour feature, and bucketing log timestamps for SLA windows.**

1. **Polling marks**: `filter(minute(ts) %% 5 == 0)` keeps events on 5-minute boundaries; useful for verifying a cron job ran on schedule.
2. **Model features**: extract `minute()` alongside `hour()` and `wday()` when the response depends on sub-hour timing.
3. **SLA bucketing**: prefer `floor_date(ts, "15 mins")` for multi-hour windows; use `minute(ts) %/% 15` only inside a single hour.

```r title="Minute-of-hour as a model feature"
requests %>%
  mutate(
    h = hour(ts),
    m = minute(ts),
    on_quarter_hour = m %% 15 == 0,
    bucket_15 = m %/% 15
  )
#> # A tibble: 5 x 6
#>   ts                  latency_ms     h     m on_quarter_hour bucket_15
#>   <dttm>                   <dbl> <int> <int> <lgl>               <dbl>
#> 1 2024-07-15 09:05:12        120     9     5 FALSE                   0
#> 2 2024-07-15 09:17:48         95     9    17 FALSE                   1
#> 3 2024-07-15 09:30:00        410     9    30 TRUE                    2
#> 4 2024-07-15 09:42:33         88     9    42 FALSE                   2
#> 5 2024-07-15 09:59:31        150     9    59 FALSE                   3
```

## Try it yourself

**Try it:** Use the `requests` tibble above and filter to rows where the minute is between 15 and 45 inclusive. Save the result to `ex_midhour`.

```r title="Your turn: keep mid-hour rows"
# Try it: filter mid-hour rows
ex_midhour <- # your code here

ex_midhour
#> Expected: 3 rows, minutes 17, 30, 42
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_midhour <- requests %>%
  filter(between(minute(ts), 15, 45))

ex_midhour
#> # A tibble: 3 x 2
#>   ts                  latency_ms
#>   <dttm>                   <dbl>
#> 1 2024-07-15 09:17:48         95
#> 2 2024-07-15 09:30:00        410
#> 3 2024-07-15 09:42:33         88
```

**Explanation:** `between(minute(ts), 15, 45)` is shorthand for `minute(ts) >= 15 & minute(ts) <= 45`. The result keeps the 17, 30, and 42 minute rows, which fall inside the inclusive 15-to-45 window.

</details>

## Related lubridate functions

After mastering minute(), look at:

- `hour()`, `second()`: extract the other time-of-day components
- `day()`, `month()`, `year()`: extract the date components
- `wday()`, `yday()`, `qday()`: extract day-position numbers
- `floor_date()`, `ceiling_date()`: round a datetime to 5, 15, or 30 minute marks
- `minutes()`, `dminutes()`: build Period or Duration objects to add or subtract
- `make_datetime()`: build a datetime from year, month, day, hour, minute, second integers
- `with_tz()`, `force_tz()`: shift or set the timezone before extracting parts

For the official reference, see the [lubridate minute() documentation](https://lubridate.tidyverse.org/reference/hour.html).

## FAQ

**How do I extract the minute from a datetime in R?**

Use `lubridate::minute(x)` where `x` is a POSIXct or POSIXlt value. The result is an integer 0 to 59. Base R alternatives are `format(x, "%M")` (returns a string) or `as.POSIXlt(x)$min` (returns an integer). The lubridate version is shortest, fully vectorised, and slots straight into dplyr pipelines like `mutate(m = minute(ts))`.

**What is the difference between minute() and minutes() in R?**

`minute()` is an accessor that reads the minute out of a datetime, returning a 0-to-59 integer. `minutes(n)` builds a Period of `n` minutes you add to a datetime, like `now() + minutes(15)`. The names look alike, the behaviour is opposite. `dminutes(n)` builds a fixed Duration in seconds for cases where daylight-saving boundaries should not stretch the offset.

**Why does minute() return 0 for a Date object?**

A `Date` has no time component, so lubridate silently coerces it to midnight UTC and returns 0. The zero is a coercion artifact, not real data. To get an actual minute value, parse the source with `ymd_hms()` or `as.POSIXct()` first so the time survives.

**How do I change the minute of a datetime in R?**

Use the replacement form: `minute(x) <- 0`. This sets the minute while keeping the date, hour, and second untouched. It is vectorised, so `minute(timestamps) <- 0` snaps an entire column to the top of the hour. Pair with `second(x) <- 0` for a clean hour boundary, or set 15, 30, 45 for quarter-hour marks.

**How do I bucket timestamps into 15 minute windows?**

Inside a single hour, `minute(ts) %/% 15` returns 0, 1, 2, or 3. Across multiple hours, prefer `floor_date(ts, "15 mins")`, which truncates the full datetime to the nearest 15-minute mark and keeps each window distinct across days.
