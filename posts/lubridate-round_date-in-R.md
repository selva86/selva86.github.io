---
title: "lubridate round_date() in R: Round Dates to the Nearest Unit"
slug: lubridate-round_date-in-R
description: "Learn how to use lubridate's round_date() in R to snap dates and timestamps to the nearest hour, day, week, or custom interval, with examples and pitfalls."
keywords: "lubridate round_date, round_date function R, lubridate round_date examples, round dates in R, round_date vs floor_date, round time to nearest unit R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: lubridate-functions
fr_parent: lubridate-in-R.html
auto_link_terms: "round_date()|lubridate round_date|lubridate::round_date()|round dates|round_date function"
auto_link_case_sensitive: true
target_keyword: "lubridate round_date"
sibling_block_enabled: true
difficulty: Beginner
---

# lubridate round_date() in R

<p class="lead">The lubridate <code>round_date()</code> function rounds a date or date-time in R to the nearest time unit, such as the nearest hour, day, week, or month.</p>

[QUICK ANSWER]
round_date(x, "hour")             # nearest hour
round_date(x, "day")              # nearest day
round_date(x, "minute")           # nearest minute
round_date(x, "15 minutes")       # nearest 15-minute mark
round_date(x, "month")            # nearest month start
round_date(x, "week")             # nearest week
round_date(x, "week", week_start = 1)  # weeks start Monday

[DECISION TREE: Is round_date() the right tool?]
- snap to the nearest unit: round_date(x, "hour")
- always round down: floor_date(x, "hour")
- always round up: ceiling_date(x, "hour")
- pull out the hour number: hour(x)
- jump to the last day of a month: rollback(x)
- measure the gap between two times: interval(a, b)

## What round_date() does in one sentence

**round_date() snaps a timestamp to the closest boundary of a chosen unit.** You pass a date or date-time and a `unit` string, and it returns the same object type rounded to the nearest hour, day, week, or any other supported unit. Unlike `floor_date()` and `ceiling_date()`, which always move in one direction, `round_date()` picks whichever boundary is nearer.

```r title="Load lubridate and round a timestamp"
library(lubridate)

ts <- ymd_hms("2024-03-14 15:47:30")
round_date(ts, unit = "hour")
#> [1] "2024-03-14 16:00:00 UTC"
```

Here `15:47:30` is past the half-hour mark, so the nearest hour boundary is `16:00:00`. The result keeps the original `POSIXct` class and time zone.

## Syntax and the unit argument

**The function signature is short, but the `unit` argument carries all the flexibility.** The full form is `round_date(x, unit = "second", week_start = getOption("lubridate.week.start", 7))`.

| Argument | Purpose |
|---|---|
| `x` | A date, date-time, or vector of them |
| `unit` | A string naming the rounding unit |
| `week_start` | Day a week begins on (7 = Sunday, 1 = Monday) |

The `unit` string accepts `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, `"bimonth"`, `"quarter"`, `"halfyear"`, and `"year"`. You can also prefix a number to round to a multiple, such as `"15 minutes"` or `"2 hours"`.

```r title="Round to different units"
round_date(ts, unit = "minute")
#> [1] "2024-03-14 15:48:00 UTC"
round_date(ts, unit = "day")
#> [1] "2024-03-15 UTC"
round_date(ts, unit = "month")
#> [1] "2024-03-01 UTC"
```

The `"day"` result lands on March 15 because `15:47` is past noon. The `"month"` result rounds back to March 1 because the 14th sits in the first half of the month.

[KEY INSIGHT]
**Rounding is symmetric, direction is not.** `round_date()` measures the distance to the boundary below and the boundary above, then returns the closer one. That single rule explains every result, including the surprising ones.

## Rounding to a multiple of a unit

**Prefix the unit with a number to round to custom intervals.** This is the feature people reach for when bucketing sensor data, log timestamps, or appointment slots into regular blocks.

```r title="Round to a multiple of a unit"
round_date(ts, unit = "15 minutes")
#> [1] "2024-03-14 15:45:00 UTC"
round_date(ts, unit = "10 minutes")
#> [1] "2024-03-14 15:50:00 UTC"
```

At `15:47:30`, the nearest 15-minute mark is `15:45` (only 2.5 minutes away versus 12.5 to the next). The nearest 10-minute mark is `15:50`. Multiples make `round_date()` a one-line replacement for hand-written modulo arithmetic.

## round_date() vs floor_date() vs ceiling_date()

**All three share the same `unit` argument but differ in rounding direction.** `floor_date()` always moves down, `ceiling_date()` always moves up, and `round_date()` moves to whichever is closer.

```r title="Compare the three rounding functions"
floor_date(ts,   unit = "hour")   # always down
#> [1] "2024-03-14 15:00:00 UTC"
ceiling_date(ts, unit = "hour")   # always up
#> [1] "2024-03-14 16:00:00 UTC"
round_date(ts,   unit = "hour")   # nearest
#> [1] "2024-03-14 16:00:00 UTC"
```

| Function | Direction | Typical use |
|---|---|---|
| `floor_date()` | Down to start of unit | Group rows into completed periods |
| `ceiling_date()` | Up to next boundary | Deadlines, next billing date |
| `round_date()` | Nearest boundary | Snap noisy timestamps to a clean grid |

Use `round_date()` when the timestamp is approximate and you want the closest tidy value. Use `floor_date()` or `ceiling_date()` when the direction matters for correctness.

## Common pitfalls

**Three mistakes account for most confusing `round_date()` results.**

```r title="Exact ties round up to the later boundary"
half <- ymd_hms("2024-06-10 12:00:00")
round_date(half, unit = "day")
#> [1] "2024-06-11 UTC"
```

Noon is exactly halfway through the day, so the result is a tie. `round_date()` resolves ties by rounding up to the later boundary, which surprises people expecting the earlier one.

The second pitfall is forgetting `week_start`. Rounding to `"week"` uses Sunday as the default first day. Pass `week_start = 1` for ISO Monday-based weeks.

The third is assuming the time zone changes. It does not. `round_date()` rounds the clock time in the existing zone and never converts it.

[WARNING]
**A multiple that does not divide its unit evenly drifts.** Units like `"7 minutes"` do not tile an hour cleanly, so boundaries reset each hour and rounding near the top of the hour can look uneven. Stick to divisors such as 5, 10, 15, or 30 minutes.

[TIP]
**Round before grouping, not after.** When bucketing time-series rows, apply `round_date()` to create the grouping key, then summarise. Rounding the aggregated output instead produces misaligned buckets.

## Try it yourself

**Try it:** Round the timestamp `ymd_hms("2025-01-20 08:40:00")` to the nearest 30 minutes. Save the result to `ex_rounded`.

```r title="Your turn: round to 30 minutes"
# Try it: round to the nearest 30 minutes
ex_rounded <- # your code here

ex_rounded
#> Expected: 2025-01-20 08:30:00 UTC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rounded <- round_date(ymd_hms("2025-01-20 08:40:00"), unit = "30 minutes")
ex_rounded
#> [1] "2025-01-20 08:30:00 UTC"
```

**Explanation:** `08:40:00` is 10 minutes past the `08:30` mark and 20 minutes before `09:00`, so the nearest 30-minute boundary is `08:30:00`.

</details>

## Related lubridate functions

These functions pair well with `round_date()` for date-time work in R:

- `floor_date()` rounds a timestamp down to the start of a unit.
- `ceiling_date()` rounds a timestamp up to the next boundary.
- `rollback()` jumps to the last moment of the previous month.
- `ymd_hms()` parses a character string into a date-time.
- `hour()` and `day()` extract a single component from a timestamp.

## FAQ

**What is the difference between round_date and floor_date in R?**

`floor_date()` always rounds a timestamp down to the start of the chosen unit, while `round_date()` rounds to whichever boundary is closer. For `15:47:30` rounded to the hour, `floor_date()` returns `15:00` but `round_date()` returns `16:00` because the time is past the half-hour mark. Use `floor_date()` when you specifically need the period start, and `round_date()` when you want the nearest clean value.

**How does round_date handle exact halfway times?**

When a timestamp falls exactly on the midpoint between two boundaries, `round_date()` rounds up to the later one. Noon rounded to the nearest day returns the next day, and `30` seconds rounded to the nearest minute returns the next minute. If you need ties to break downward, use `floor_date()` instead, or shift the input slightly before rounding.

**Can round_date round to 15 minutes or other multiples?**

Yes. Prefix the unit string with a number, such as `"15 minutes"`, `"2 hours"`, or `"10 seconds"`. `round_date()` then snaps the timestamp to the nearest multiple of that interval. For predictable results, choose multiples that divide their parent unit evenly, like 5, 10, 15, or 30 minutes within an hour.

**Does round_date change the time zone of a date?**

No. `round_date()` rounds the clock time within the existing time zone and returns the same zone it received. If you need a different zone, convert it first with `with_tz()` or `force_tz()`, then round. The class of the object, such as `POSIXct` or `Date`, is also preserved.

**How do I round a date to the nearest week starting on Monday?**

Pass `week_start = 1` along with `unit = "week"`. By default `round_date()` treats Sunday as the first day of the week (`week_start = 7`). Setting `week_start = 1` switches to ISO-style Monday-based weeks, which matches most business reporting calendars.
