---
title: "lubridate seconds() in R: Create Second-Based Time Periods"
slug: "lubridate-seconds-in-R"
description: "Use lubridate seconds() in R to build second-based periods. Add or subtract seconds from datetimes and write clean time-interval arithmetic with examples now."
keywords: "lubridate seconds, seconds function R, lubridate seconds examples, R seconds period, add seconds to datetime R, lubridate second vs seconds, create seconds R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "seconds()|lubridate seconds|lubridate::seconds()|seconds period|second-based period"
auto_link_case_sensitive: true
target_keyword: "lubridate seconds"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate seconds() in R: Create Second-Based Time Periods

<p class="lead">The <code>seconds()</code> function in lubridate builds a second-based <code>Period</code> object you can add to or subtract from a datetime. It is vectorised, plays nicely with <code>POSIXct</code> arithmetic, and lets you shift timestamps by N seconds without manual unit conversion.</p>

[QUICK ANSWER]
ymd_hms("2024-07-15 09:00:00") + seconds(45)     # add 45 seconds
ymd_hms("2024-07-15 09:00:00") - seconds(30)     # subtract 30 seconds
now() + seconds(c(15, 30, 60))                   # vectorised shifts
minutes(1) + seconds(30)                         # combine components
class(seconds(10))                               # "Period" object
as.numeric(seconds(120), "minutes")              # 2 minutes
ymd_hms("2024-07-15 09:00:45") + seconds(20)     # cross-minute shift
df %>% mutate(stop = start + seconds(elapsed))   # use in dplyr

[DECISION TREE: Is seconds() the right tool?]
- shift a datetime by N seconds: ts + seconds(N)
- extract the second-of-minute from a timestamp: second(ts)
- shift by exact-second steps (Duration class): ts + dseconds(N)
- build a multi-component period: minutes(1) + seconds(30)
- find seconds between two datetimes: as.numeric(b - a, units = "secs")
- round timestamps to 10-second boundary: floor_date(ts, "10 secs")
- generate per-second sequences: seq(ts, by = "1 sec", length.out = 60)
- parse "HH:MM:SS" strings: hms("01:30:45") returns a Period

## What seconds() does in one sentence

**`seconds(n)` returns a `Period` object representing `n` seconds of clock time.** Pass an integer or numeric vector and you get a period whose second slot equals the input, ready to add to a `POSIXct` or `Date` value.

This is a constructor, not an accessor. It builds time spans you can do arithmetic with. If you want to read the second component out of an existing datetime, you want `second()` (singular), covered in [lubridate second() in R](lubridate-second-in-R.html).

## Syntax

**`seconds(x = 1)` takes a numeric vector and returns a `Period` of the same length.** There is one argument and one return type. The output prints as `"45S"` and behaves like a clock offset in datetime arithmetic.

```r title="Load lubridate and inspect seconds"
library(lubridate)

seconds(45)
#> [1] "45S"

class(seconds(45))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

seconds(c(10, 30, 90))
#> [1] "10S" "30S" "90S"
```

The period stores the input value in its seconds slot without normalising into minutes. You can mix it with other constructors like `minutes()` and `hours()` to build richer spans that print with each component.

[NOTE]
**`Period` and `Duration` agree at the second level.** A `Period` from `seconds()` adds wall-clock seconds, whereas a `Duration` from `dseconds()` adds physical seconds. The two are numerically identical for seconds; the divergence appears at coarser units like `days()` vs `ddays()` where DST transitions matter.

## Six common patterns with seconds()

### 1. Add seconds to a single datetime

**Use `+ seconds(n)` to push a timestamp forward by `n` seconds.** The result is a `POSIXct` value with the same timezone as the input.

```r title="Shift a datetime forward"
start <- ymd_hms("2024-07-15 09:00:00")

start + seconds(45)
#> [1] "2024-07-15 09:00:45 UTC"

start + seconds(150)
#> [1] "2024-07-15 09:02:30 UTC"

start - seconds(20)
#> [1] "2024-07-15 08:59:40 UTC"
```

Negative inputs work too: `seconds(-10)` is equivalent to `-seconds(10)`. The arithmetic is exact because `Period` carries seconds as a separate slot rather than rolling them through other units.

### 2. Vectorised second arithmetic

**Both sides of the `+` operator can be vectors.** This makes batch event-offset calculation a single expression.

```r title="Vectorised period addition"
start <- ymd_hms("2024-07-15 09:00:00")
offsets <- c(5, 15, 30, 90)

start + seconds(offsets)
#> [1] "2024-07-15 09:00:05 UTC" "2024-07-15 09:00:15 UTC"
#> [3] "2024-07-15 09:00:30 UTC" "2024-07-15 09:01:30 UTC"
```

The result is the same length as the longer of the two operands. R recycles the shorter vector when their lengths are compatible.

### 3. Cross-minute and cross-hour shifts

**`seconds()` rolls into the next minute (and hour) cleanly.** You do not need a separate `minutes()` call for shifts of 60 or more seconds.

```r title="Shifts that cross minute and hour boundaries"
start <- ymd_hms("2024-07-15 09:59:50")

start + seconds(20)
#> [1] "2024-07-15 10:00:10 UTC"

start + seconds(75)
#> [1] "2024-07-15 10:01:05 UTC"
```

Large second counts (`seconds(3600)`) work as well, though `hours(1)` reads more clearly for human consumers. Pick the unit that matches how the input is stored.

### 4. Build multi-component periods

**Add period constructors together to express compound spans.** `minutes(1) + seconds(30)` reads like English and prints as `"1M 30S"`.

```r title="Combine hours minutes and seconds"
total <- hours(1) + minutes(30) + seconds(45)
total
#> [1] "1H 30M 45S"

ymd_hms("2024-07-15 09:00:00") + total
#> [1] "2024-07-15 10:30:45 UTC"
```

This composes well when the offset comes from a stopwatch reading or log entry that supplies hours, minutes, and seconds separately.

### 5. Use seconds() inside dplyr pipelines

**`seconds()` plugs into `mutate()` for row-wise event arithmetic.** Pair it with a numeric duration column to compute end timestamps.

```r title="Compute event end times in a dplyr pipeline"
library(dplyr)

events <- tibble(
  task = c("A", "B", "C"),
  start = ymd_hms(c("2024-07-15 09:00:00",
                    "2024-07-15 09:00:30",
                    "2024-07-15 09:01:15")),
  elapsed_sec = c(20, 45, 10)
)

events %>% mutate(stop = start + seconds(elapsed_sec))
#> # A tibble: 3 x 4
#>   task  start               elapsed_sec stop
#>   <chr> <dttm>                    <dbl> <dttm>
#> 1 A     2024-07-15 09:00:00          20 2024-07-15 09:00:20
#> 2 B     2024-07-15 09:00:30          45 2024-07-15 09:01:15
#> 3 C     2024-07-15 09:01:15          10 2024-07-15 09:01:25
```

Integer inputs are preferred. Lubridate accepts fractional seconds, but the printed form depends on `options(digits.secs)`, so for sub-second precision either set that option or scale to milliseconds and divide back later.

### 6. Convert seconds() to other units

**Coerce a period to minutes or hours with `as.numeric(period, "minutes")` when downstream code expects a different unit.** This is the standard bridge between lubridate periods and numeric offsets.

```r title="Convert periods to minutes and hours"
as.numeric(seconds(120), "minutes")
#> [1] 2

as.numeric(seconds(3600), "hours")
#> [1] 1

period_to_seconds(seconds(45))
#> [1] 45
```

`period_to_seconds()` is the explicit helper if you prefer named verbs over `as.numeric()` coercion. Since the unit is already seconds, the result is the input value unchanged.

## seconds() vs dseconds(): period vs duration

**`seconds()` returns a `Period`; `dseconds()` returns a `Duration`.** At the second level the two are numerically identical, but their classes differ and that propagates through the rest of your pipeline.

```r title="Period vs duration semantics at second granularity"
ts <- ymd_hms("2024-07-15 09:00:00")

ts + seconds(90)
#> [1] "2024-07-15 09:01:30 UTC"

ts + dseconds(90)
#> [1] "2024-07-15 09:01:30 UTC"

class(seconds(90))
#> [1] "Period"

class(dseconds(90))
#> [1] "Duration"
```

The values match because seconds are atomic; DST flips happen on hour boundaries, never inside a second. The class divergence matters when you mix them with larger units (`minutes()`, `hours()`, `days()`) where wall-clock and elapsed semantics start to diverge.

| Aspect | `seconds()` (Period) | `dseconds()` (Duration) |
|---|---|---|
| Unit | Clock seconds | Physical seconds |
| Result at second level | Identical to dseconds | Identical to seconds |
| Print form | `"45S"` | `"45s (~45 seconds)"` |
| Use when | Composing with periods (`minutes()`, `hours()`) | Composing with durations or stopwatch math |
| Class | `Period` | `Duration` |

[KEY INSIGHT]
**Pick `seconds()` to compose with other period constructors, `dseconds()` to compose with durations.** The choice is about which family the rest of your expression lives in. Mixing families forces a coercion that tends to surprise readers; pick one and stay consistent.

## seconds() vs second(): constructor vs accessor

**`seconds()` builds a span; `second()` reads a component.** They are independent functions and a frequent source of confusion for newcomers.

```r title="Different functions for different jobs"
ts <- ymd_hms("2024-07-15 14:30:45")

second(ts)
#> [1] 45

seconds(15)
#> [1] "15S"

ts + seconds(15)
#> [1] "2024-07-15 14:31:00 UTC"
```

If you write `ts + second(15)` (singular) you almost certainly meant `ts + seconds(15)`. The singular form returns a numeric, not a period, and the addition silently treats it as raw seconds anyway, so the bug hides until you swap in a different unit's accessor.

## Common pitfalls

**Three patterns trip up most users.** Knowing them up front saves debugging later.

[WARNING]
**Adding a bare integer also adds seconds, but bypasses the period system.** `start + 30` and `start + seconds(30)` both advance by 30 seconds, but the bare integer skips the `Period` machinery. The instant you swap units (e.g., to minutes), the bare-integer code keeps adding seconds while the wrapped form fails loudly so you notice.

```r title="Why wrapping in seconds() matters"
start <- ymd_hms("2024-07-15 09:00:00")

start + 30
#> [1] "2024-07-15 09:00:30 UTC"

start + seconds(30)
#> [1] "2024-07-15 09:00:30 UTC"

start + minutes(30)
#> [1] "2024-07-15 09:30:00 UTC"
```

The second pitfall is mixing periods and durations in one expression. `seconds(1) + dseconds(1)` works at the second level but coerces silently. Stick to one family per calculation to avoid surprises when you scale up to larger units.

The third pitfall is fractional seconds. `seconds(2.5)` is accepted, but the printed form depends on `options(digits.secs)`. Set the option or work in integer milliseconds if sub-second precision matters for your output.

## Try it yourself

**Try it:** Build a tibble of three race start times. Add an `elapsed_sec` column with values `12`, `45`, and `90`. Compute the finish timestamp for each runner using `seconds()`. Save the tibble to `ex_finishes`.

```r title="Your turn: compute race finish times"
library(dplyr)
library(lubridate)

ex_finishes <- tibble(
  runner = c("A", "B", "C"),
  start = ymd_hms(c("2024-07-15 10:00:00",
                    "2024-07-15 10:00:00",
                    "2024-07-15 10:00:00")),
  elapsed_sec = c(12, 45, 90)
)

ex_finishes <- ex_finishes %>% # your code here

ex_finishes
#> Expected: a tibble with a finish column showing 10:00:12, 10:00:45, 10:01:30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_finishes <- ex_finishes %>% mutate(finish = start + seconds(elapsed_sec))
ex_finishes
#> # A tibble: 3 x 4
#>   runner start               elapsed_sec finish
#>   <chr>  <dttm>                    <dbl> <dttm>
#> 1 A      2024-07-15 10:00:00          12 2024-07-15 10:00:12
#> 2 B      2024-07-15 10:00:00          45 2024-07-15 10:00:45
#> 3 C      2024-07-15 10:00:00          90 2024-07-15 10:01:30
```

**Explanation:** `mutate()` evaluates `start + seconds(elapsed_sec)` row-wise, building a `Period` from each numeric elapsed time and adding it to the matching start timestamp.

</details>

## Related lubridate functions

**A handful of neighbouring constructors round out second arithmetic.** Reach for these when `seconds()` is not the right shape.

- [minutes()](lubridate-minutes-in-R.html) and [hours()](lubridate-hours-in-R.html): larger period constructors. Combine with `seconds()` for compound spans.
- `days()`, `weeks()`, `months()`, `years()`: calendar-grain period constructors. Same arithmetic model.
- `dseconds()`, `dminutes()`, `dhours()`: duration siblings. Use when the rest of the expression is a duration.
- [second()](lubridate-second-in-R.html): the accessor that reads the second-of-minute from a datetime.
- `hms()`, `hm()`, and `ms()`: parse `"HH:MM:SS"`, `"HH:MM"`, and `"MM:SS"` strings into `Period` objects.
- `period()`: generic period constructor with named arguments, e.g., `period(45, "seconds")`.

For the full lubridate reference, see the [official lubridate docs](https://lubridate.tidyverse.org/reference/index.html).

## FAQ

**What does `seconds()` do in R?**

`seconds(n)` from the lubridate package returns a `Period` object representing `n` seconds of clock time. You add or subtract it from a `POSIXct` or `Date` value to shift the timestamp by that many seconds. The result is a normal `POSIXct` you can pass to plotting, formatting, or further arithmetic without unwrapping anything.

**What is the difference between `second()` and `seconds()` in lubridate?**

`second()` is an accessor: it reads the second-of-minute (0 to 59) out of a datetime and returns a numeric. `seconds()` is a constructor: it builds a `Period` you can add to a datetime to shift it forward or backward. The plural form is for arithmetic; the singular form is for inspection.

**How do I add seconds to a datetime in R?**

Use `your_datetime + seconds(n)`. For example, `ymd_hms("2024-07-15 09:00:00") + seconds(45)` returns `"2024-07-15 09:00:45 UTC"`. The `+` operator is overloaded to recognise lubridate `Period` objects, so the arithmetic reads like plain math without manual unit conversion.

**What is the difference between `seconds()` and `dseconds()`?**

`seconds()` returns a `Period` and `dseconds()` returns a `Duration`. At the second level the two add the same number of physical seconds, so the resulting timestamps are identical. The classes differ, which matters when you compose with larger units like `minutes()` vs `dminutes()` where wall-clock and elapsed semantics diverge.

**Can I use fractional seconds with `seconds()`?**

Fractional inputs like `seconds(2.5)` are accepted, but the printed form depends on `options(digits.secs)`. For reliable sub-second precision, set `options(digits.secs = 3)` or scale to integer milliseconds and divide back later. For most use cases integer seconds are simpler and avoid floating-point surprises.
