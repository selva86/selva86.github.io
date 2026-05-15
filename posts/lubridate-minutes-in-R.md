---
title: "lubridate minutes() in R: Create Minute-Based Time Periods"
slug: "lubridate-minutes-in-R"
description: "Use lubridate minutes() in R to build minute-based periods. Add or subtract minutes from datetimes and write clean time-interval arithmetic with examples now."
keywords: "lubridate minutes, minutes function R, lubridate minutes examples, R minutes period, add minutes to datetime R, lubridate minute vs minutes, create minutes R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "minutes()|lubridate minutes|lubridate::minutes()|minutes period|minute-based period"
auto_link_case_sensitive: true
target_keyword: "lubridate minutes"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate minutes() in R: Create Minute-Based Time Periods

<p class="lead">The <code>minutes()</code> function in lubridate builds a minute-based <code>Period</code> object you can add to or subtract from a datetime. It is vectorised, calendar-aware, and lets you shift timestamps by N minutes without hand-rolling seconds arithmetic.</p>

[QUICK ANSWER]
ymd_hms("2024-07-15 09:00:00") + minutes(30)     # add 30 minutes
ymd_hms("2024-07-15 09:00:00") - minutes(15)     # subtract 15 minutes
now() + minutes(c(5, 15, 60))                    # vectorised shifts
hours(1) + minutes(30)                           # combine components
class(minutes(5))                                # "Period" object
as.numeric(minutes(90), "seconds")               # 5400 seconds
ymd_hms("2024-07-15 23:50:00") + minutes(20)     # cross-hour shift
df %>% mutate(eta = start + minutes(wait_min))   # use in dplyr

[DECISION TREE: Is minutes() the right tool?]
- shift a datetime by N minutes: ts + minutes(N)
- extract the minute-of-hour from a timestamp: minute(ts)
- shift by exact 60-second steps across DST: ts + dminutes(N)
- build a multi-component period: hours(1) + minutes(30)
- find minutes between two datetimes: as.numeric(b - a, units = "mins")
- round timestamps to 5-minute boundary: floor_date(ts, "5 mins")
- generate per-minute sequences: seq(ts, by = "1 min", length.out = 60)
- parse "MM:SS" or "HH:MM" strings: ms("05:30") or hm("14:30")

## What minutes() does in one sentence

**`minutes(n)` returns a `Period` object representing `n` minutes of clock time.** Pass an integer or numeric vector and you get a period whose minute slot equals the input, ready to add to a `POSIXct` or `Date` value.

This is a constructor, not an accessor. It builds time spans you can do arithmetic with. If you want to read the minute component out of an existing datetime, you want `minute()` (singular), covered in [lubridate minute() in R](lubridate-minute-in-R.html).

## Syntax

**`minutes(x = 1)` takes a numeric vector and returns a `Period` of the same length.** There is one argument and one return type. The output prints as `"30M 0S"` and behaves like a clock offset in datetime arithmetic.

```r title="Load lubridate and inspect minutes"
library(lubridate)

minutes(30)
#> [1] "30M 0S"

class(minutes(30))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

minutes(c(5, 15, 45))
#> [1] "5M 0S"  "15M 0S" "45M 0S"
```

The period prints with the minute and second components populated and the larger units hidden. You can mix it with other constructors like `hours()` and `seconds()` to build richer spans.

[NOTE]
**`Period` is calendar-aware.** A `Period` from `minutes()` adds wall-clock minutes, whereas a `Duration` from `dminutes()` adds physical seconds. The two agree except across daylight-saving transitions where their hour boundaries diverge.

## Six common patterns with minutes()

### 1. Add minutes to a single datetime

**Use `+ minutes(n)` to push a timestamp forward by `n` minutes.** The result is a `POSIXct` value with the same timezone as the input.

```r title="Shift a datetime forward"
start <- ymd_hms("2024-07-15 09:00:00")

start + minutes(30)
#> [1] "2024-07-15 09:30:00 UTC"

start + minutes(90)
#> [1] "2024-07-15 10:30:00 UTC"

start - minutes(15)
#> [1] "2024-07-15 08:45:00 UTC"
```

Negative inputs work too: `minutes(-10)` is equivalent to `-minutes(10)`. The arithmetic is exact because `Period` carries minutes as a separate slot rather than reducing them to seconds.

### 2. Vectorised minute arithmetic

**Both sides of the `+` operator can be vectors.** This makes batch reminder offsets a single expression.

```r title="Vectorised period addition"
start <- ymd_hms("2024-07-15 09:00:00")
offsets <- c(5, 15, 30, 60)

start + minutes(offsets)
#> [1] "2024-07-15 09:05:00 UTC" "2024-07-15 09:15:00 UTC"
#> [3] "2024-07-15 09:30:00 UTC" "2024-07-15 10:00:00 UTC"
```

The result is the same length as the longer of the two operands. R recycles the shorter vector when their lengths are compatible.

### 3. Cross-hour shifts

**`minutes()` rolls into the next hour cleanly.** You do not need a separate `hours()` call for shifts of 60 or more minutes.

```r title="Shifts that cross the hour boundary"
start <- ymd_hms("2024-07-15 09:50:00")

start + minutes(20)
#> [1] "2024-07-15 10:10:00 UTC"

start + minutes(75)
#> [1] "2024-07-15 11:05:00 UTC"
```

Large minute counts (`minutes(180)`) work as well, though `hours(3)` reads more clearly for human consumers. Pick the unit that matches how the input is stored.

### 4. Build multi-component periods

**Add period constructors together to express compound spans.** `hours(1) + minutes(30)` reads like English and prints as `"1H 30M 0S"`.

```r title="Combine hours minutes and seconds"
total <- hours(1) + minutes(30) + seconds(45)
total
#> [1] "1H 30M 45S"

ymd_hms("2024-07-15 09:00:00") + total
#> [1] "2024-07-15 10:30:45 UTC"
```

This composes well when the offset comes from a schedule string or user form that supplies hours and minutes separately.

### 5. Use minutes() inside dplyr pipelines

**`minutes()` plugs into `mutate()` for row-wise schedule arithmetic.** Pair it with a numeric wait-time column to compute reminder or ETA timestamps.

```r title="Compute reminders in a dplyr pipeline"
library(dplyr)

bookings <- tibble(
  client = c("A", "B", "C"),
  start = ymd_hms(c("2024-07-15 09:00:00",
                    "2024-07-15 09:30:00",
                    "2024-07-15 10:15:00")),
  wait_min = c(10, 25, 5)
)

bookings %>% mutate(reminder = start + minutes(wait_min))
#> # A tibble: 3 x 4
#>   client start               wait_min reminder
#>   <chr>  <dttm>                 <dbl> <dttm>
#> 1 A      2024-07-15 09:00:00       10 2024-07-15 09:10:00
#> 2 B      2024-07-15 09:30:00       25 2024-07-15 09:55:00
#> 3 C      2024-07-15 10:15:00        5 2024-07-15 10:20:00
```

Integer inputs are preferred. Lubridate treats fractional minutes as exact when stored in the period but some downstream printers may round, so for sub-minute precision combine `minutes()` with `seconds()` explicitly.

### 6. Convert minutes() to other units

**Coerce a period to seconds with `as.numeric(period, "seconds")` when an API expects raw seconds.** This is the standard bridge between lubridate periods and base R offsets.

```r title="Convert periods to seconds and hours"
as.numeric(minutes(90), "seconds")
#> [1] 5400

as.numeric(minutes(120), "hours")
#> [1] 2

period_to_seconds(minutes(45))
#> [1] 2700
```

`period_to_seconds()` is the explicit helper if you prefer named verbs over `as.numeric()` coercion. Both return the same value.

## minutes() vs dminutes(): period vs duration

**`minutes()` adds clock-time minutes; `dminutes()` adds exactly 60 seconds per unit.** The two functions agree almost everywhere and diverge only across daylight-saving transitions when a minute window straddles the jump.

```r title="Period vs duration semantics"
ts <- ymd_hms("2024-07-15 09:00:00")

ts + minutes(90)            # period: 90 wall-clock minutes
#> [1] "2024-07-15 10:30:00 UTC"

ts + dminutes(90)           # duration: 5400 seconds
#> [1] "2024-07-15 10:30:00 UTC"
```

Outside DST the two are identical. Inside a spring-forward hour, `dminutes()` keeps elapsed seconds exact while `minutes()` keeps the wall clock honest. Pick the one that matches your mental model.

| Aspect | `minutes()` (Period) | `dminutes()` (Duration) |
|---|---|---|
| Unit | Clock minutes | Physical seconds |
| DST behaviour | Adds wall minutes | Adds exactly 60 s per unit |
| Print form | `"30M 0S"` | `"1800s (~30 minutes)"` |
| Use when | Human schedules, reminders | Elapsed timing, stopwatch math |
| Class | `Period` | `Duration` |

[KEY INSIGHT]
**Pick `minutes()` for human reminders, `dminutes()` for stopwatch math.** A reminder set "30 minutes from now" should use `minutes(30)` so it fires at the same wall-clock minute after a DST flip. A reactor that ran "90 minutes" should use `dminutes(90)` so the elapsed seconds match the physical clock.

## minutes() vs minute(): constructor vs accessor

**`minutes()` builds a span; `minute()` reads a component.** They are independent functions and a frequent source of confusion for newcomers.

```r title="Different functions for different jobs"
ts <- ymd_hms("2024-07-15 14:30:00")

minute(ts)        # read: returns 30
#> [1] 30

minutes(15)       # build: returns a Period
#> [1] "15M 0S"

ts + minutes(15)  # use the builder
#> [1] "2024-07-15 14:45:00 UTC"
```

If you write `ts + minute(15)` (singular) you almost certainly meant `ts + minutes(15)`. The singular form returns an integer, not a period, and the addition silently treats it as seconds.

## Common pitfalls

**Three patterns trip up most users.** Knowing them up front saves debugging later.

[WARNING]
**Adding a bare integer treats it as seconds, not minutes.** `start + 30` advances by 30 seconds, not 30 minutes. Always wrap the number in `minutes()` to get the unit you expect.

```r title="The seconds vs minutes trap"
start <- ymd_hms("2024-07-15 09:00:00")

start + 30              # wrong: adds 30 seconds
#> [1] "2024-07-15 09:00:30 UTC"

start + minutes(30)     # right: adds 30 minutes
#> [1] "2024-07-15 09:30:00 UTC"
```

The second pitfall is mixing periods and durations in one expression. `minutes(1) + dminutes(1)` works but the result coerces the duration into a period. Stick to one family per calculation to avoid surprises around DST.

The third pitfall is naive timezones. If your input has no `tz`, lubridate assumes UTC and your "9 AM" may print as 4 AM after a `with_tz()` conversion. Set `tz = "America/New_York"` (or your locale) at parse time so the minute arithmetic lands where you expect.

## Try it yourself

**Try it:** Build a tibble of three meeting start times. Add a `wait_min` column with values `10`, `15`, and `45`. Compute the reminder timestamp for each meeting using `minutes()`. Save the tibble to `ex_reminders`.

```r title="Your turn: compute meeting reminders"
library(dplyr)
library(lubridate)

ex_reminders <- tibble(
  meeting = c("X", "Y", "Z"),
  start = ymd_hms(c("2024-07-15 10:00:00",
                    "2024-07-15 11:30:00",
                    "2024-07-15 14:00:00")),
  wait_min = c(10, 15, 45)
)

ex_reminders <- ex_reminders %>% # your code here

ex_reminders
#> Expected: a tibble with a reminder column showing 10:10, 11:45, 14:45
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_reminders <- ex_reminders %>% mutate(reminder = start + minutes(wait_min))
ex_reminders
#> # A tibble: 3 x 4
#>   meeting start               wait_min reminder
#>   <chr>   <dttm>                 <dbl> <dttm>
#> 1 X       2024-07-15 10:00:00       10 2024-07-15 10:10:00
#> 2 Y       2024-07-15 11:30:00       15 2024-07-15 11:45:00
#> 3 Z       2024-07-15 14:00:00       45 2024-07-15 14:45:00
```

**Explanation:** `mutate()` evaluates `start + minutes(wait_min)` row-wise, building a `Period` from each numeric wait time and adding it to the matching start timestamp.

</details>

## Related lubridate functions

**A handful of neighbouring constructors round out minute arithmetic.** Reach for these when `minutes()` is not the right shape.

- [hours()](lubridate-hours-in-R.html) and `seconds()`: larger and smaller period constructors. Combine with `minutes()` for compound spans.
- `days()`, `weeks()`, `months()`, `years()`: calendar-grain period constructors. Same arithmetic model.
- `dminutes()`, `dhours()`, `dseconds()`: duration siblings. Use when you need exact second counts across DST.
- [minute()](lubridate-minute-in-R.html): the accessor that reads the minute-of-hour from a datetime.
- `hms()`, `hm()`, and `ms()`: parse `"HH:MM:SS"`, `"HH:MM"`, and `"MM:SS"` strings into `Period` objects.
- `period()`: generic period constructor with named arguments, e.g., `period(30, "minutes")`.

For the full lubridate reference, see the [official lubridate docs](https://lubridate.tidyverse.org/reference/index.html).

## FAQ

**What does `minutes()` do in R?**

`minutes(n)` from the lubridate package returns a `Period` object representing `n` minutes of clock time. You add or subtract it from a `POSIXct` or `Date` value to shift the timestamp by that many minutes. The result respects daylight-saving boundaries because periods track wall-clock minutes rather than raw elapsed seconds.

**What is the difference between `minute()` and `minutes()` in lubridate?**

`minute()` is an accessor: it reads the minute-of-hour (0 to 59) out of a datetime and returns an integer. `minutes()` is a constructor: it builds a `Period` you can add to a datetime to shift it forward or backward. The plural form is for arithmetic; the singular form is for inspection.

**How do I add minutes to a datetime in R?**

Use `your_datetime + minutes(n)`. For example, `ymd_hms("2024-07-15 09:00:00") + minutes(30)` returns `"2024-07-15 09:30:00 UTC"`. The `+` operator is overloaded to recognise lubridate `Period` objects, so the arithmetic reads like plain math without manual second conversion.

**What is the difference between Period and Duration in lubridate?**

A `Period` (from `minutes()`, `hours()`, `days()`) tracks clock units and preserves wall-clock time across daylight-saving transitions. A `Duration` (from `dminutes()`, `dhours()`, `ddays()`) tracks physical seconds and stays exact across DST. Use periods for human schedules and durations for elapsed-time calculations.

**Can I use fractional minutes with `minutes()`?**

Fractional inputs like `minutes(2.5)` are accepted but for sub-minute precision the readable pattern is `minutes(2) + seconds(30)`. Splitting the components keeps the period's printed form predictable and avoids edge cases where downstream code rounds fractional minute slots.
