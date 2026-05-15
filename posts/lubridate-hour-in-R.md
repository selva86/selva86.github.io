---
title: "lubridate hour() in R: Extract Hour From Datetimes"
slug: "lubridate-hour-in-R"
description: "Use lubridate hour() to extract the hour 0 to 23 from a POSIXct datetime in R, replace it in place, and pair with minute() and second() for time-of-day work."
keywords: "lubridate hour, hour function R, lubridate hour examples, extract hour from datetime R, hour from POSIXct, lubridate hour minute second, R datetime hour"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "hour()|lubridate hour|lubridate::hour()|extract hour from datetime|hour component"
auto_link_case_sensitive: true
target_keyword: "lubridate hour"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate hour() in R: Extract Hour From Datetimes

<p class="lead">The <code>hour()</code> function in lubridate returns the hour of a POSIXct or POSIXlt value as an integer between 0 and 23. It is vectorised over datetime columns, supports in-place replacement, and pairs with <code>minute()</code> and <code>second()</code> for full time-of-day extraction.</p>

[QUICK ANSWER]
hour(ymd_hms("2024-07-15 14:30:00"))           # 14 (2 PM as 24-hour integer)
hour(now())                                    # hour of current datetime
hour(as.POSIXct("2024-07-15 09:15:00"))        # works on base POSIXct too
hour(c(ymd_hms("2024-07-15 09:00:00"),
       ymd_hms("2024-07-15 21:30:00")))        # vectorised
hour(x) <- 0                                   # replace hour in place
df %>% mutate(h = hour(timestamp))             # extract a column
filter(logs, between(hour(ts), 9, 16))         # business-hours filter
table(hour(events$ts))                         # hourly counts

[DECISION TREE: Is hour() the right tool?]
- pull the hour 0 to 23 from a datetime: hour(x)
- pull the minute or second of the timestamp: minute(x), second(x)
- pull the date part only: as_date(x) or floor_date(x, "day")
- bucket timestamps to the start of an hour: floor_date(x, "hour")
- compute hours between two datetimes: as.numeric(b - a, units = "hours")
- get the timezone offset: hour(with_tz(x, "America/New_York"))
- build a datetime from components: make_datetime(y, m, d, h, mn, s)
- format the time as "HH:MM": format(x, "%H:%M")

## What hour() does in one sentence

**`hour()` returns the hour-of-day component of a datetime as an integer between 0 and 23.** Pass any POSIXct or POSIXlt vector and you get a numeric vector of the same length, with midnight as 0 and 11 PM as 23.

This is the lubridate counterpart to base R's `format(x, "%H")` and `as.POSIXlt(x)$hour`. The lubridate version is shorter, vectorised, and returns an integer you can use directly in arithmetic, comparisons, or `dplyr::filter()`.

## Syntax

**`hour(x)` accepts a datetime vector and returns an integer vector of the same length.** There are no optional arguments. The replacement form `hour(x) <- value` overwrites the hour while preserving the date, minute, and second.

```r title="Load lubridate and pull an hour"
library(lubridate)

hour(ymd_hms("2024-07-15 14:30:00"))
#> [1] 14

hour(ymd_hms("2024-07-15 00:00:00"))
#> [1] 0

class(hour(ymd_hms("2024-07-15 14:30:00")))
#> [1] "integer"
```

The input must be a class lubridate recognises as a datetime: `POSIXct` or `POSIXlt`. A plain `Date` has no time component, so `hour(as.Date("2024-07-15"))` returns `0` after silent coercion to midnight UTC, which is rarely what you want. Parse strings with `ymd_hms()`, `mdy_hms()`, or `as.POSIXct()` first.

[TIP]
**Use `hour(x) <- value` to overwrite the hour in place.** This is the replacement form. It keeps the date, minute, and second untouched, so you can snap an entire column of timestamps to 9 AM with one assignment without touching the rest of the timestamp.

## Six common patterns

### 1. Extract hour from a single datetime

```r title="Hour of a parsed datetime"
ts <- ymd_hms("2024-07-15 14:30:00")
hour(ts)
#> [1] 14
```

The result is integer 14, not the string `"14"`. Use it in arithmetic directly: `hour(ts) - 12` returns 2, the same hour expressed in PM.

### 2. Extract hour from a vector of datetimes

```r title="Vectorised over a datetime column"
events <- ymd_hms(c("2024-07-15 09:15:00",
                    "2024-07-15 14:30:00",
                    "2024-07-15 21:45:00",
                    "2024-07-15 23:59:00"))
hour(events)
#> [1]  9 14 21 23
```

`hour()` is fully vectorised. A million-row timestamp column becomes a million-row integer vector in one call. No loop or `sapply()` needed. Midnight returns 0, 11 PM returns 23, and the values are always integer.

### 3. Replace hour values in place

```r title="Snap timestamps to 9 AM"
schedule <- ymd_hms(c("2024-07-15 14:30:00",
                      "2024-07-16 21:45:00",
                      "2024-07-17 03:10:00"))
hour(schedule) <- 9
minute(schedule) <- 0
second(schedule) <- 0
schedule
#> [1] "2024-07-15 09:00:00 UTC" "2024-07-16 09:00:00 UTC"
#> [3] "2024-07-17 09:00:00 UTC"
```

The replacement form keeps the date untouched. Pairing it with `minute(x) <- 0` and `second(x) <- 0` is the cleanest way to align a column of arbitrary timestamps to a fixed time-of-day without leaving the original date class.

### 4. Use hour() inside a dplyr pipeline

```r title="Add hour of day as a column"
library(dplyr)

logs <- tibble(
  ts = ymd_hms(c("2024-07-15 09:15:00", "2024-07-15 11:42:00",
                 "2024-07-15 14:08:00", "2024-07-15 18:55:00",
                 "2024-07-15 23:11:00")),
  endpoint = c("/login", "/search", "/cart", "/checkout", "/login")
)

logs %>%
  mutate(h = hour(ts))
#> # A tibble: 5 x 3
#>   ts                  endpoint     h
#>   <dttm>              <chr>    <int>
#> 1 2024-07-15 09:15:00 /login       9
#> 2 2024-07-15 11:42:00 /search     11
#> 3 2024-07-15 14:08:00 /cart       14
#> 4 2024-07-15 18:55:00 /checkout   18
#> 5 2024-07-15 23:11:00 /login      23
```

`mutate(h = hour(ts))` adds an hour-of-day column. This is the start of any analysis that asks "when in the day do users hit the checkout flow?" or "what hour has the highest error rate?".

### 5. Filter rows by business hours

```r title="Keep only 9-to-5 records"
logs %>%
  filter(hour(ts) >= 9, hour(ts) < 17)
#> # A tibble: 3 x 2
#>   ts                  endpoint
#>   <dttm>              <chr>
#> 1 2024-07-15 09:15:00 /login
#> 2 2024-07-15 11:42:00 /search
#> 3 2024-07-15 14:08:00 /cart
```

`hour(ts) >= 9, hour(ts) < 17` evaluates row by row and keeps timestamps inside the 9 AM to 5 PM window. The upper bound is exclusive, which matches the business-hours convention of "9 to 5" meaning the workday ends as the clock strikes 5 PM.

### 6. Group counts by hour of day

```r title="Hourly request counts"
logs %>%
  count(h = hour(ts), name = "requests") %>%
  arrange(h)
#> # A tibble: 5 x 2
#>       h requests
#>   <int>    <int>
#> 1     9        1
#> 2    11        1
#> 3    14        1
#> 4    18        1
#> 5    23        1
```

`count(h = hour(ts))` produces a tidy hour-by-count table. Feed it straight into `ggplot2::geom_col()` for a 24-bar diurnal-pattern chart. Real datasets quickly reveal lunch-hour dips, end-of-day spikes, and overnight quiet periods.

[KEY INSIGHT]
**Hour values are 0-indexed, but day-of-month and month are 1-indexed; mixing them up corrupts feature engineering.** `hour()` returns 0 for midnight, but `day()` returns 1 for the first of the month and `month()` returns 1 for January. When you build numeric features for a model, a `0` in the hour column is real data, not a missing value. Treat zero hour with the same care as any other valid level.

## hour() vs minute() vs second() vs format()

**Three lubridate accessors split a timestamp into hour, minute, and second integers; `format()` returns the same parts as a string.**

| Function | Returns | Range | Typical use |
|---|---|---|---|
| `hour()` | Hour of day | 0 to 23 | Diurnal grouping, business-hours filters |
| `minute()` | Minute of hour | 0 to 59 | Sub-hour bucketing, latency analysis |
| `second()` | Second of minute | 0 to 59.99 | Precision timing, log replay |
| `format(x, "%H:%M")` | "HH:MM" string | character | Display only; not numeric |

The lubridate accessors return integers you can compare and aggregate. `format()` returns characters that look right in a report but force a `as.numeric()` conversion if you want to compute on them. Reach for `hour()`, `minute()`, `second()` for analysis; reach for `format()` for printed output.

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

July 15, 2024 at 14:30:45 returns 14 for the hour, 30 for the minute, and 45 for the second. The three integers together reconstruct the time-of-day; `format()` produces the same information as a single character string.

## Common pitfalls

**Pitfall 1: passing a Date instead of a POSIXct.** `hour(as.Date("2024-07-15"))` returns `0` because Date has no time component and lubridate silently coerces to midnight UTC. The result is technically correct but rarely useful. If you need hour-of-day, parse with `ymd_hms()` or `as.POSIXct()` so the time is preserved.

**Pitfall 2: forgetting timezone shifts.** `hour(ymd_hms("2024-07-15 14:00:00", tz = "America/New_York"))` returns 14, but `hour(with_tz(x, "UTC"))` returns 18 for the same instant. Always pin the timezone explicitly when extracting the hour from data that crosses zones; otherwise `Sys.timezone()` decides for you.

[WARNING]
**Comparing hours across timezones gives silently wrong group-by results.** A timestamp stored as `2024-07-15 14:00:00` in `America/New_York` is the same instant as `2024-07-15 18:00:00` in `UTC`. `hour()` returns whatever the underlying tzone of the vector says. Convert with `with_tz()` BEFORE calling `hour()` if you want hour values in a specific zone.

[NOTE]
**Coming from Python pandas?** The equivalent of `hour(x)` is `s.dt.hour` on a datetime Series. The dplyr pipeline `mutate(h = hour(ts))` mirrors `df.assign(h=df.ts.dt.hour)`. Pandas also returns a 0-to-23 integer, so the convention matches lubridate exactly.

## A practical workflow with hour()

**Hour of day shows up in three places: filtering to a window, building a diurnal feature for a model, and bucketing timestamps for hourly aggregation.**

The patterns:

1. **Filter to a within-day window**: `filter(between(hour(ts), 9, 16))` keeps business hours.
2. **Build features for a model**: extract `hour()` alongside `wday()`, `month()`, and `is_weekend` when daily and weekly seasonality matter.
3. **Hourly aggregation**: prefer `floor_date(ts, "hour")` for a datetime axis that spans multiple days; use `hour(ts)` to collapse across days into a 0-to-23 distribution.

```r title="Hour-of-day as a model feature"
logs %>%
  mutate(
    h = hour(ts),
    weekday = wday(ts, label = TRUE),
    is_business_hour = h >= 9 & h < 17
  )
#> # A tibble: 5 x 5
#>   ts                  endpoint     h weekday is_business_hour
#>   <dttm>              <chr>    <int> <ord>   <lgl>
#> 1 2024-07-15 09:15:00 /login       9 Mon     TRUE
#> 2 2024-07-15 11:42:00 /search     11 Mon     TRUE
#> 3 2024-07-15 14:08:00 /cart       14 Mon     TRUE
#> 4 2024-07-15 18:55:00 /checkout   18 Mon     FALSE
#> 5 2024-07-15 23:11:00 /login      23 Mon     FALSE
```

## Try it yourself

**Try it:** Use the `logs` tibble above and filter to rows where the hour is between 10 and 18 inclusive. Save the result to `ex_daytime`.

```r title="Your turn: keep daytime rows"
# Try it: filter daytime rows
ex_daytime <- # your code here

ex_daytime
#> Expected: 3 rows, hours 11, 14, 18
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_daytime <- logs %>%
  filter(between(hour(ts), 10, 18))

ex_daytime
#> # A tibble: 3 x 2
#>   ts                  endpoint
#>   <dttm>              <chr>
#> 1 2024-07-15 11:42:00 /search
#> 2 2024-07-15 14:08:00 /cart
#> 3 2024-07-15 18:55:00 /checkout
```

**Explanation:** `between(hour(ts), 10, 18)` is shorthand for `hour(ts) >= 10 & hour(ts) <= 18`. The result keeps the 11, 14, and 18 hour rows, which fall inside the inclusive 10-to-18 window.

</details>

## Related lubridate functions

After mastering hour(), look at:

- `minute()`, `second()`: extract the other time-of-day components
- `day()`, `month()`, `year()`: extract the date components
- `wday()`, `yday()`, `qday()`: extract day-position numbers
- `floor_date()`, `ceiling_date()`: round a datetime to hour, day, week, or month
- `make_datetime()`: build a datetime from year, month, day, hour, minute, second integers
- `with_tz()`, `force_tz()`: shift or set the timezone before extracting parts
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: parse strings into datetimes first

For the official reference, see the [lubridate hour() documentation](https://lubridate.tidyverse.org/reference/hour.html).

## FAQ

**How do I extract the hour from a datetime in R?**

Use `lubridate::hour(x)` where `x` is a POSIXct or POSIXlt value. The result is an integer 0 to 23. Base R alternatives are `format(x, "%H")` (returns a string) or `as.POSIXlt(x)$hour` (returns an integer). The lubridate version is shortest, fully vectorised, and slots straight into dplyr pipelines like `mutate(h = hour(ts))`.

**What is the difference between hour() and format(x, "%H") in R?**

`hour()` returns an integer 0 to 23 ready for arithmetic and comparison. `format(x, "%H")` returns a two-character string like "09" or "23" suited for display. Use `hour()` when you plan to filter, group, or feed the value into a model. Use `format()` when you want zero-padded text for a report or label. Converting between them costs an `as.integer()` or `sprintf("%02d", h)` call.

**Why does hour() return 0 for a Date object?**

A `Date` has no time component, so lubridate silently coerces it to midnight UTC and returns 0. The zero is a coercion artifact, not real data. To get an actual hour, parse the source with `ymd_hms()` or `as.POSIXct()` first so the time survives.

**How do I change the hour of a datetime in R?**

Use the replacement form: `hour(x) <- 9`. This sets the hour while keeping the date, minute, and second untouched. It is vectorised, so `hour(timestamp_vector) <- 9` snaps an entire column to 9 AM. Pair it with `minute(x) <- 0` and `second(x) <- 0` to align timestamps to a clean hour boundary.

**How do I extract the hour in a specific timezone?**

Convert the datetime first with `with_tz()`, then call `hour()`: `hour(with_tz(x, "America/New_York"))`. `hour()` returns the hour as the underlying tzone reads it, so a UTC-stored timestamp shows UTC hours unless you shift first. Pin the timezone whenever your data crosses zones; otherwise `Sys.timezone()` decides and the answer becomes machine-dependent.
