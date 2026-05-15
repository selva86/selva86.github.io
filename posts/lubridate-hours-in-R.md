---
title: "lubridate hours() in R: Create Hour-Based Time Periods"
slug: "lubridate-hours-in-R"
description: "Use lubridate hours() in R to create hour-based periods. Add or subtract hours from datetimes and build clean time interval arithmetic with examples now."
keywords: "lubridate hours, hours function R, lubridate hours examples, R hours period, lubridate time periods, lubridate hour vs hours, create hours R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "hours()|lubridate hours|lubridate::hours()|hours period|hour-based period"
auto_link_case_sensitive: true
target_keyword: "lubridate hours"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate hours() in R: Create Hour-Based Time Periods

<p class="lead">The <code>hours()</code> function in lubridate builds an hour-based <code>Period</code> object you can add to or subtract from a datetime. It is vectorised, calendar-aware, and lets you shift timestamps by N hours without writing seconds arithmetic by hand.</p>

[QUICK ANSWER]
ymd_hms("2024-07-15 09:00:00") + hours(3)      # add 3 hours
ymd_hms("2024-07-15 09:00:00") - hours(2)      # subtract 2 hours
now() + hours(c(1, 6, 24))                     # vectorised shifts
hours(1) + minutes(30)                         # combine components
class(hours(5))                                # "Period" object
as.numeric(hours(2), "seconds")                # 7200 seconds
ymd("2024-07-15") + hours(36)                  # cross-day shift
df %>% mutate(eta = start + hours(duration_h)) # use in dplyr

[DECISION TREE: Is hours() the right tool?]
- shift a datetime by N hours: ts + hours(N)
- extract the hour-of-day from a timestamp: hour(ts)
- shift by exact 3600-second steps across DST: ts + dhours(N)
- build a multi-component period: hours(2) + minutes(30)
- find hours between two datetimes: as.numeric(b - a, units = "hours")
- round timestamps to hour boundary: floor_date(ts, "hour")
- generate hourly sequences: seq(ts, by = "1 hour", length.out = 24)
- parse "HH:MM:SS" strings: hms("02:30:00")

## What hours() does in one sentence

**`hours(n)` returns a `Period` object representing `n` hours of clock time.** Pass an integer or numeric vector and you get a period whose hour slot equals the input, ready to add to a `POSIXct` or `Date` value.

This is a constructor, not an accessor. It builds time spans you can do arithmetic with. If you want to read the hour component out of an existing datetime, you want `hour()` (singular), covered in [lubridate hour() in R](lubridate-hour-in-R.html).

## Syntax

**`hours(x = 1)` takes a numeric vector and returns a `Period` of the same length.** There is one argument and one return type. The output prints as `"3H 0M 0S"` and behaves like a number in datetime arithmetic.

```r title="Load lubridate and inspect hours()"
library(lubridate)

hours(3)
#> [1] "3H 0M 0S"

class(hours(3))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

hours(c(1, 2, 5))
#> [1] "1H 0M 0S" "2H 0M 0S" "5H 0M 0S"
```

The period prints with all four components (hour, minute, second, and a hidden day) but only the hour slot is populated. You can mix it with other constructors like `minutes()` and `seconds()` to build richer spans.

[NOTE]
**`Period` is calendar-aware.** A `Period` adds clock units (1 hour = 1 hour on the wall), whereas a `Duration` from `dhours()` adds physical seconds. The two differ around daylight-saving transitions.

## Six common patterns with hours()

### 1. Add hours to a single datetime

**Use `+ hours(n)` to push a timestamp forward by `n` hours.** The result is a `POSIXct` value with the same timezone as the input.

```r title="Shift a datetime forward"
start <- ymd_hms("2024-07-15 09:00:00")

start + hours(3)
#> [1] "2024-07-15 12:00:00 UTC"

start + hours(8)
#> [1] "2024-07-15 17:00:00 UTC"

start - hours(1)
#> [1] "2024-07-15 08:00:00 UTC"
```

Negative inputs work too: `hours(-2)` is equivalent to `-hours(2)`. The arithmetic is exact because `Period` carries hours as a separate slot rather than reducing them to seconds.

### 2. Vectorised hour arithmetic

**Both sides of the `+` operator can be vectors.** This makes batch shifts a single expression.

```r title="Vectorised period addition"
start <- ymd_hms("2024-07-15 09:00:00")
shifts <- c(1, 6, 12, 24)

start + hours(shifts)
#> [1] "2024-07-15 10:00:00 UTC" "2024-07-15 15:00:00 UTC"
#> [3] "2024-07-15 21:00:00 UTC" "2024-07-16 09:00:00 UTC"
```

The result is the same length as the longer of the two operands. R recycles the shorter vector if their lengths differ and emit a warning when lengths are incompatible.

### 3. Cross-day shifts

**`hours()` rolls into the next day cleanly.** You do not need a separate `days()` call for shifts of 24 or more hours.

```r title="Shifts that cross midnight"
start <- ymd("2024-07-15")

start + hours(36)
#> [1] "2024-07-16 12:00:00 UTC"

start + hours(24 * 7)
#> [1] "2024-07-22 UTC"
```

Adding `hours()` to a bare `Date` automatically promotes the result to `POSIXct`, since a `Date` has no time component to attach hours to.

### 4. Build multi-component periods

**Add period constructors together to express compound spans.** `hours(2) + minutes(30)` reads like English and prints as `"2H 30M 0S"`.

```r title="Combine hours minutes and seconds"
total <- hours(2) + minutes(30) + seconds(15)
total
#> [1] "2H 30M 15S"

ymd_hms("2024-07-15 09:00:00") + total
#> [1] "2024-07-15 11:30:15 UTC"
```

This composes well with user input or schedule definitions where the shift is not a clean integer number of hours.

### 5. Use hours() inside dplyr pipelines

**`hours()` plugs into `mutate()` for row-wise schedule arithmetic.** Pair it with a numeric column to compute estimated completion timestamps.

```r title="Compute ETAs in a dplyr pipeline"
library(dplyr)

jobs <- tibble(
  job = c("A", "B", "C"),
  start = ymd_hms(c("2024-07-15 09:00:00",
                    "2024-07-15 09:30:00",
                    "2024-07-15 10:15:00")),
  duration_h = c(2, 4.5, 1)
)

jobs %>% mutate(eta = start + hours(duration_h))
#> # A tibble: 3 x 4
#>   job   start               duration_h eta
#>   <chr> <dttm>                   <dbl> <dttm>
#> 1 A     2024-07-15 09:00:00        2   2024-07-15 11:00:00
#> 2 B     2024-07-15 09:30:00        4.5 2024-07-15 14:00:00
#> 3 C     2024-07-15 10:15:00        1   2024-07-15 11:15:00
```

Fractional inputs like `4.5` are accepted and stored as a fractional hour slot. The result is exact for displaying ETAs in business workflows.

### 6. Convert hours() to other units

**Coerce a period to seconds with `as.numeric(period, "seconds")` when an API expects raw seconds.** This is the standard bridge between lubridate periods and base R offsets.

```r title="Convert periods to seconds and minutes"
as.numeric(hours(2), "seconds")
#> [1] 7200

as.numeric(hours(3), "minutes")
#> [1] 180

period_to_seconds(hours(5))
#> [1] 18000
```

`period_to_seconds()` is the explicit helper if you prefer named verbs over `as.numeric()` coercion. Both return the same value.

## hours() vs dhours(): period vs duration

**`hours()` adds clock-time hours; `dhours()` adds exactly 3600 seconds.** The two functions agree most of the time and diverge across daylight-saving transitions.

```r title="Period vs duration around DST"
spring <- ymd_hms("2024-03-10 01:30:00", tz = "America/New_York")

spring + hours(2)         # period: 1:30 -> 3:30 wall time
#> [1] "2024-03-10 03:30:00 EDT"

spring + dhours(2)        # duration: 1:30 + 7200 seconds
#> [1] "2024-03-10 04:30:00 EDT"
```

The 1-hour gap is the spring-forward DST jump. Periods preserve the local wall clock; durations preserve the seconds elapsed.

| Aspect | `hours()` (Period) | `dhours()` (Duration) |
|---|---|---|
| Unit | Clock hours | Physical seconds |
| DST behaviour | Adds 1 wall hour | Adds exactly 3600 seconds |
| Print form | `"2H 0M 0S"` | `"7200s (~2 hours)"` |
| Use when | Schedules, recurring events | Elapsed time, scientific timing |
| Class | `Period` | `Duration` |

[KEY INSIGHT]
**Pick `hours()` for human schedules, `dhours()` for stopwatch math.** A meeting that runs "2 hours" should use `hours(2)` so it lands at the same wall-clock time after a DST flip. A reactor that ran "2 hours" should use `dhours(2)` so the elapsed seconds match the physical clock.

## hours() vs hour(): constructor vs accessor

**`hours()` builds a span; `hour()` reads a component.** They are independent functions and a common source of confusion for newcomers.

```r title="Different functions for different jobs"
ts <- ymd_hms("2024-07-15 14:30:00")

hour(ts)        # read: returns 14
#> [1] 14

hours(2)        # build: returns a Period
#> [1] "2H 0M 0S"

ts + hours(2)   # use the builder
#> [1] "2024-07-15 16:30:00 UTC"
```

If you find yourself writing `ts + hour(2)` (singular), you almost certainly meant `ts + hours(2)`. The singular form returns an integer, not a period, and the addition silently treats it as seconds.

## Common pitfalls

**Three patterns trip up most users.** Knowing them up front saves debugging later.

[WARNING]
**Adding a bare integer treats it as seconds, not hours.** `start + 3` advances by 3 seconds, not 3 hours. Always wrap the number in `hours()` to get the unit you expect.

```r title="The seconds vs hours trap"
start <- ymd_hms("2024-07-15 09:00:00")

start + 3            # wrong: adds 3 seconds
#> [1] "2024-07-15 09:00:03 UTC"

start + hours(3)     # right: adds 3 hours
#> [1] "2024-07-15 12:00:00 UTC"
```

The second pitfall is timezone drift. If your input is naive (no `tz`), lubridate assumes UTC and your "9 AM" may print as 4 AM after a `with_tz()` conversion. Set `tz = "America/New_York"` (or your locale) at parse time.

The third pitfall is mixing periods and durations in one expression. `hours(1) + dhours(1)` works but the result is a `Period` coerced from the duration. Stick to one family per calculation to avoid surprises.

## Try it yourself

**Try it:** Build a tibble of three job start times. Add a `duration_h` column with values `1.5`, `2`, and `4`. Compute the ETA for each job using `hours()`. Save the tibble to `ex_eta`.

```r title="Your turn: compute job ETAs"
library(dplyr)
library(lubridate)

ex_eta <- tibble(
  job = c("X", "Y", "Z"),
  start = ymd_hms(c("2024-07-15 08:00:00",
                    "2024-07-15 10:00:00",
                    "2024-07-15 13:00:00")),
  duration_h = c(1.5, 2, 4)
)

ex_eta <- ex_eta %>% # your code here

ex_eta
#> Expected: a tibble with an eta column showing 09:30, 12:00, 17:00
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_eta <- ex_eta %>% mutate(eta = start + hours(duration_h))
ex_eta
#> # A tibble: 3 x 4
#>   job   start               duration_h eta
#>   <chr> <dttm>                   <dbl> <dttm>
#> 1 X     2024-07-15 08:00:00        1.5 2024-07-15 09:30:00
#> 2 Y     2024-07-15 10:00:00        2   2024-07-15 12:00:00
#> 3 Z     2024-07-15 13:00:00        4   2024-07-15 17:00:00
```

**Explanation:** `mutate()` evaluates `start + hours(duration_h)` row-wise, building a `Period` from each numeric duration and adding it to the matching start timestamp.

</details>

## Related lubridate functions

**A handful of neighbouring constructors round out hour arithmetic.** Reach for these when `hours()` is not the right shape.

- `minutes()` and `seconds()`: smaller-grain period constructors. Combine with `hours()` for compound spans.
- `days()`, `weeks()`, `months()`, `years()`: larger-grain period constructors. Same arithmetic model.
- `dhours()`, `dminutes()`, `dseconds()`: duration siblings. Use when you need exact second counts across DST.
- [hour()](lubridate-hour-in-R.html): the accessor that reads the hour-of-day from a datetime.
- `hms()` and `hm()`: parse `"HH:MM:SS"` and `"HH:MM"` strings into `Period` objects.
- `period()`: generic period constructor with named arguments, e.g., `period(2, "hours")`.

For the full lubridate reference, see the [official lubridate docs](https://lubridate.tidyverse.org/reference/index.html).

## FAQ

**What does `hours()` do in R?**

`hours(n)` from the lubridate package returns a `Period` object representing `n` hours of clock time. You add or subtract it from a `POSIXct` or `Date` value to shift the timestamp by that many hours. The result respects daylight-saving transitions, since periods track wall-clock hours rather than raw seconds.

**What is the difference between `hour()` and `hours()` in lubridate?**

`hour()` is an accessor: it reads the hour-of-day (0 to 23) out of a datetime and returns an integer. `hours()` is a constructor: it builds a `Period` you can add to a datetime to shift it forward or backward. The plural form is for arithmetic, the singular form is for inspection.

**How do I add hours to a date in R?**

Use `your_datetime + hours(n)`. For example, `ymd_hms("2024-07-15 09:00:00") + hours(3)` returns `"2024-07-15 12:00:00 UTC"`. The `+` operator is overloaded to recognise lubridate `Period` objects, so the arithmetic reads like plain math.

**What is the difference between Period and Duration in lubridate?**

A `Period` (from `hours()`, `days()`, etc.) tracks clock units and preserves wall-clock time across daylight-saving transitions. A `Duration` (from `dhours()`, `ddays()`, etc.) tracks physical seconds and stays exact across DST. Use periods for human schedules and durations for elapsed-time calculations.

**Can I use fractional hours with `hours()`?**

Yes. `hours(2.5)` returns a period with a fractional hour slot, which adds 2 hours and 30 minutes when applied to a datetime. This is useful for schedule columns where job durations are stored as decimal hours rather than separate hour and minute fields.
