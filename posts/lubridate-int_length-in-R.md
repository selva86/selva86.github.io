---
title: "lubridate int_length() in R: Interval Length in Seconds"
slug: "lubridate-int_length-in-R"
description: "Use lubridate int_length() in R to return the length of an Interval object in seconds. Syntax, examples, edge cases, and how it differs from time_length()."
keywords: "lubridate int_length, int_length function R, lubridate int_length examples, R interval length seconds, int_length vs time_length, lubridate interval seconds, R time span seconds"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "int_length()|lubridate int_length|lubridate::int_length()|interval length in seconds|length of an Interval|int_length function"
auto_link_case_sensitive: true
target_keyword: "lubridate int_length"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate int_length() in R: Interval Length in Seconds

<p class="lead">The <code>int_length()</code> function in lubridate returns the length of an Interval object as a single numeric value in seconds. It collapses a bounded span between two timestamps to a plain number, which is the form you need for arithmetic, ratios, and comparisons against thresholds expressed in seconds, minutes, or days.</p>

[QUICK ANSWER]
int_length(int)                            # length in seconds (numeric)
int_length(t1 %--% t2)                     # works on an inline interval
int_length(int) / 60                       # length in minutes
int_length(int) / 3600                     # length in hours
int_length(int) / 86400                    # length in days (24h average)
int_length(int_vec)                        # vectorised over a vector of intervals
abs(int_length(int))                       # ignore direction when start > end

[DECISION TREE: Is int_length() the right tool?]
- length of an Interval as a number of seconds: int_length(int)
- length in a specific calendar unit (months, years): time_length(int, "month")
- convert the span to a Duration object: as.duration(int)
- convert the span to a Period (calendar arithmetic): as.period(int)
- check whether a date is inside the range: x %within% int
- detect if two ranges overlap: int_overlaps(g1, g2)
- get the start or end of the range: int_start(int) or int_end(int)
- difference between two single times: difftime(t2, t1, units = "secs")

## What int_length() does in one sentence

**`int_length()` reduces an Interval object to a single numeric value: the number of seconds between its start and its end.** The result is a plain double, not a Duration object, so you can divide, compare, sum, or feed it straight into a model the same way you would any other numeric column.

The sign of the result matches the direction of the interval. A reversed interval where the end timestamp precedes the start returns a negative value, which is useful when you need to detect ordering bugs but a common source of surprise when summing lengths across a dataset.

## Syntax

**`int_length(int)` takes one argument: an Interval object or vector of Intervals.** It returns a numeric vector of the same length. There are no other arguments and no options for unit conversion; the only unit is seconds.

```r title="Load lubridate and call int_length"
library(lubridate)

start <- ymd_hms("2024-01-15 09:00:00")
end <- ymd_hms("2024-01-15 17:30:00")
gap <- interval(start, end)

int_length(gap)
#> [1] 30600

class(int_length(gap))
#> [1] "numeric"
```

The 30,600 figure is `8.5 hours x 3600 seconds`. Because the return is plain `numeric`, you can divide it by 60 to get minutes or by 3600 to get hours without any class wrangling. Unit conversion happens in the calling code, not in the function.

[TIP]
**Reach for `int_length()` when you need a span as a number, not as a class.** If the downstream code is a comparison, an aggregation, or a column in a data frame, plain seconds are easier to handle than a Duration object. Save `as.duration()` for when you want lubridate to print the result with human readable units like "30600s (~8.5 hours)".

## Four common use cases

### 1. Length of a single span in minutes or hours

```r title="Span in different units"
shift <- interval(ymd_hms("2024-03-01 08:00:00"),
                  ymd_hms("2024-03-01 16:45:00"))

int_length(shift)            # seconds
#> [1] 31500

int_length(shift) / 60       # minutes
#> [1] 525

int_length(shift) / 3600     # hours
#> [1] 8.75
```

Divide once at the point of use. There is no need to wrap the result in `as.numeric()` because `int_length()` already returns numeric.

### 2. Vectorised across a column of intervals

```r title="Vectorised over a vector of intervals"
starts <- ymd_hms(c("2024-01-15 09:00:00",
                    "2024-01-16 10:30:00",
                    "2024-01-17 08:15:00"))
ends <- ymd_hms(c("2024-01-15 17:30:00",
                  "2024-01-16 19:00:00",
                  "2024-01-17 16:00:00"))

shifts <- interval(starts, ends)
int_length(shifts) / 3600
#> [1] 8.50 8.50 7.75
```

The function vectorises naturally, so it slots into `mutate()` or any column expression without a loop. This is the standard pattern for converting a pair of timestamp columns into a numeric duration column.

### 3. Compare against a threshold

```r title="Filter spans longer than 8 hours"
durations_hours <- int_length(shifts) / 3600
long_shifts <- shifts[durations_hours > 8]
length(long_shifts)
#> [1] 2
```

Because the result is numeric, `>`, `<`, `==`, and `%in%` all work directly. Comparing Duration objects to numeric thresholds requires extra coercion; `int_length()` skips that step.

### 4. Aggregate lengths across rows

```r title="Sum total seconds across many intervals"
total_seconds <- sum(int_length(shifts))
total_seconds / 3600
#> [1] 24.75
```

Summing 24.75 hours of work across three shifts is a one liner because the span is already a number. `sum(as.duration(shifts))` returns a Duration object, which prints differently but holds the same value; pick the form that matches what the next step needs.

[NOTE]
**`int_length()` always returns seconds, regardless of how the interval was built.** If the interval spans a daylight saving transition, the second count still reflects the real elapsed seconds. The calendar offset is absorbed in the start and end timestamps, not in the length.

## int_length() vs time_length() vs as.duration()

**Three lubridate functions answer "how long is this span," and they differ in unit and return type.** Picking the wrong one leads to subtle bugs around months, years, and daylight saving.

| Function | Returns | Unit | Calendar-aware? |
|---|---|---|---|
| `int_length(int)` | numeric | seconds | No, uses exact elapsed seconds |
| `time_length(int, "month")` | numeric | requested unit | Yes for "year" and "month" |
| `as.duration(int)` | Duration | seconds (printed with hint) | No, uses exact elapsed seconds |
| `as.period(int)` | Period | calendar units | Yes, "1 month" stays "1 month" |

The decision rule is simple. If you need a number in seconds, use `int_length()`. If you need a number in months or years that respects the calendar, use `time_length(int, unit)`. If you need a class that prints with units, use `as.duration()`. If you need calendar arithmetic like "1 month later," use `as.period()`.

```r title="Compare the four on the same interval"
yr <- interval(ymd("2024-01-15"), ymd("2025-01-15"))

int_length(yr)
#> [1] 31622400

time_length(yr, "year")
#> [1] 1

as.duration(yr)
#> [1] "31622400s (~1 year)"

as.period(yr)
#> [1] "1y 0m 0d 0H 0M 0S"
```

The same span returns four different shapes. `int_length()` gives you raw seconds. `time_length()` gives you "1 year" because the start and end land on the same calendar date. `as.duration()` is the second count plus a printed hint. `as.period()` preserves the calendar structure.

[KEY INSIGHT]
**`int_length()` is the gateway from class to number.** Everything else in the lubridate timespan family is a class with arithmetic rules. `int_length()` exits that system and returns a plain double you can put in a column, a model, or a comparison.

## Common pitfalls

**`int_length()` only accepts Interval objects, not Periods, Durations, or difftimes.** Passing the wrong class errors out with `Error: $ operator is invalid for atomic vectors` or `Error: int is not an Interval`. Wrap a Period or Duration in `interval()` first, or use `as.numeric()` on a Duration to get seconds directly.

```r title="Pitfall: wrong input class"
d <- duration(8.5, "hours")
int_length(d)
#> Error: int is not an Interval

# Fix: use as.numeric() on a Duration for seconds
as.numeric(d)
#> [1] 30600
```

**A reversed interval returns a negative length.** If you build `interval(end, start)` by accident, `int_length()` returns a negative number rather than throwing an error. This silently corrupts sums and means until a downstream check catches it.

```r title="Pitfall: reversed interval"
bad <- interval(ymd("2024-06-15"), ymd("2024-01-15"))
int_length(bad)
#> [1] -13219200
```

[WARNING]
**Wrap suspicious inputs in `abs()` or guard with `int_flip()` before aggregation.** `abs(int_length(int))` collapses sign issues, and `int_flip(int)` reorders the start and end so downstream code sees a forward facing interval. Sum totals that mix forward and reversed intervals without a guard are wrong.

## Try it yourself

**Try it:** Build an interval for a 7 hour 45 minute workday starting at 2024-04-10 09:00:00, then compute its length in minutes.

```r title="Your turn: int_length in minutes"
ex_shift <- # your code here
ex_minutes <- # your code here

ex_minutes
#> Expected: 465
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_shift <- interval(ymd_hms("2024-04-10 09:00:00"),
                     ymd_hms("2024-04-10 16:45:00"))
ex_minutes <- int_length(ex_shift) / 60
ex_minutes
#> [1] 465
```

**Explanation:** `int_length()` returns the span in seconds (27,900). Dividing by 60 converts to minutes (465), matching 7h 45m as `7 * 60 + 45`.

</details>

## Related lubridate functions

- [`interval()`](lubridate-interval-in-R.html) builds the Interval object that `int_length()` measures
- [`as.duration()`](lubridate-duration-in-R.html) wraps the same second count in a Duration class with printed units
- `time_length(int, "month")` returns the length in a calendar aware unit
- `int_start()` and `int_end()` retrieve the bounds of the Interval
- `int_flip(int)` reverses an interval so `int_length()` returns a positive number

## FAQ

**What unit does int_length() return in R?**

`int_length()` always returns seconds as a plain numeric vector. There is no unit argument. Divide by 60 for minutes, 3600 for hours, or 86400 for days at 24 hour resolution. For calendar aware units like months or years, use `time_length(int, "month")` instead, since the average seconds per month is not constant across years.

**Why does int_length() return a negative number?**

The interval was built with the end timestamp before the start. lubridate preserves the direction of an Interval, so a reversed range produces a negative length rather than an error. Use `abs(int_length(int))` to ignore direction, or call `int_flip(int)` to reorder the start and end. The negative is a feature for detecting ordering bugs, not a flaw.

**What is the difference between int_length() and time_length()?**

`int_length(int)` always returns seconds. `time_length(int, unit)` accepts a unit argument and returns the length in that unit, with calendar aware handling for "year" and "month". For "hour" or "minute", the two are equivalent up to a division. For "month" or "year", they disagree because `time_length()` knows that 2024 had 366 days while `int_length()` only sees raw seconds.

**Can int_length() accept a Period or a Duration?**

No. `int_length()` only works on Interval objects. Passing a Period or Duration throws `Error: int is not an Interval`. If you have a Duration, use `as.numeric(d)` to get seconds directly. If you have a Period, anchor it to a start date with `interval(start, start + p)` first, since a Period without an anchor has no defined number of seconds.

**Is int_length() vectorised?**

Yes. Pass a vector of Interval objects and `int_length()` returns a numeric vector of the same length. This makes it the standard pattern inside `mutate()`, `sapply()`, or any column expression that converts a pair of timestamp columns into a numeric duration column. No loop is needed.

For the full lubridate reference, see the [official lubridate documentation](https://lubridate.tidyverse.org/reference/int_length.html).
