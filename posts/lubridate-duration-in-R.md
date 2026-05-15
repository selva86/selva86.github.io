---
title: "lubridate duration() in R: Exact Time Spans in Seconds"
slug: "lubridate-duration-in-R"
description: "Use lubridate duration() in R to build exact second-precise time spans, add them to POSIXct, and contrast Duration with Period when daylight saving matters."
keywords: "lubridate duration, duration function R, lubridate duration examples, R time durations, ddays dhours dminutes, lubridate Duration class, period vs duration R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "duration()|lubridate duration|lubridate::duration()|Duration class|exact time span"
auto_link_case_sensitive: true
target_keyword: "lubridate duration"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate duration() in R: Exact Time Spans in Seconds

<p class="lead">The <code>duration()</code> function in lubridate builds a Duration object that stores a time span as an exact number of seconds. Use it when you need second-precise arithmetic that ignores calendar quirks like daylight saving, leap days, and variable month lengths.</p>

[QUICK ANSWER]
duration(60)                            # 60 seconds
duration("2 hours 30 mins")             # parse a friendly string
duration(num = 1, units = "days")       # one exact day = 86400s
ddays(7)                                # helper: 7 exact days
dweeks(2) + dhours(6)                   # add two durations
ymd_hms("2024-03-09 22:00", tz = "US/Eastern") + ddays(1)  # exact 86400s shift
as.duration(difftime(t2, t1))           # convert difftime to Duration
as.numeric(duration("1 week"), "hours") # 168

[DECISION TREE: Is duration() the right tool?]
- exact second-precise span, ignore calendar: duration(3600) or ddays(N)
- calendar-aware span that respects DST and months: period() or days(N), months(N)
- compute the gap between two POSIXct values: as.duration(t2 - t1)
- snap a date to month or week boundaries: floor_date(x, "month")
- check whether two intervals overlap: int_overlaps(int1, int2)
- length of an Interval in a chosen unit: time_length(int, "hours")
- parse a date or datetime string: ymd(), ymd_hms(), parse_date_time()
- format seconds as a base R difftime: as.difftime(secs, units = "secs")

## What duration() does in one sentence

**`duration()` constructs an exact, second-precise time span stored as a Duration object.** Pass a number of seconds, a string like `"2 hours 30 mins"`, or a numeric value with an explicit `units` argument and lubridate returns a Duration vector that always represents the same elapsed clock seconds.

A Duration treats one day as exactly 86,400 seconds and one year as exactly 31,557,600 seconds (365.25 days). It never asks the calendar what month or time zone you are in, which makes it the right primitive for scientific or financial calculations where exactness matters more than human readability.

## Syntax

**`duration(num = NULL, units = "seconds", ...)` accepts a numeric value plus a unit, or a single descriptive string.** When you pass a string, lubridate parses words like `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, and `years` into the corresponding second count.

```r title="Load lubridate and build a duration"
library(lubridate)

duration(90)
#> [1] "90s (~1.5 minutes)"

duration(num = 2, units = "hours")
#> [1] "7200s (~2 hours)"

duration("1 day 6 hours")
#> [1] "108000s (~1.25 days)"

class(duration(90))
#> [1] "Duration"
#> attr(,"package")
#> [1] "lubridate"
```

The print method shows the raw second count plus a human-friendly approximation. The `"s"` suffix is the visual signal that distinguishes a Duration from a Period, which prints with `"d"`, `"H"`, `"M"`, `"S"` parts.

[TIP]
**Reach for `duration()` when "the same number of seconds" is the right semantic.** Stopwatches, network timeouts, log-file deltas, and physics simulations all care about elapsed seconds, not calendar dates. Use a Period when "next month, same day of month" is what you really mean.

## Six common patterns

### 1. Build a Duration from a numeric value

```r title="Build from seconds"
duration(3600)
#> [1] "3600s (~1 hours)"

duration(0.5, units = "days")
#> [1] "43200s (~12 hours)"
```

Negative numbers are valid and represent a backward span. `duration(-3600)` subtracts one hour when added to a time stamp.

### 2. Parse a friendly string

```r title="Parse a duration string"
duration("3 weeks 4 days")
#> [1] "2160000s (~25 days)"

duration("2H 30M")
#> [1] "9000s (~2.5 hours)"
```

The parser is permissive about spacing and unit abbreviations. When in doubt, pass the unit explicitly with `num=` and `units=` to avoid surprises.

### 3. Use the d-prefix helper family

```r title="d-prefix duration helpers"
dseconds(90); dminutes(5); dhours(2)
#> [1] "90s (~1.5 minutes)"
#> [1] "300s (~5 minutes)"
#> [1] "7200s (~2 hours)"

ddays(7); dweeks(2); dyears(1)
#> [1] "604800s (~1 weeks)"
#> [1] "1209600s (~2 weeks)"
#> [1] "31557600s (~1 years)"
```

The helpers are syntactic sugar that read more naturally inside expressions. `ddays(7)` is identical to `duration(7, "days")` and to `duration(7 * 86400)`.

[KEY INSIGHT]
**The leading "d" means "Duration" and signals "exact seconds".** Compare `days(7)` (a Period of 7 calendar days that respects DST) with `ddays(7)` (a Duration of exactly 7 * 86,400 seconds). The two diverge near time zone transitions and on leap seconds.

### 4. Add a Duration to a POSIXct timestamp

```r title="Shift a timestamp by a duration"
start <- ymd_hms("2024-03-09 22:00:00", tz = "US/Eastern")
start + ddays(1)
#> [1] "2024-03-11 00:00:00 EDT"

start + days(1)
#> [1] "2024-03-10 22:00:00 EDT"
```

The two results differ by one hour because the US "spring forward" jump happens that night. `ddays(1)` adds 86,400 seconds literally; `days(1)` adds one calendar day and lets the clock follow the time zone rules.

### 5. Get a Duration from the difference of two timestamps

```r title="Convert a difftime to a Duration"
t1 <- ymd_hms("2024-01-01 09:00:00")
t2 <- ymd_hms("2024-01-03 11:30:00")
gap <- t2 - t1
gap
#> Time difference of 2.104167 days

as.duration(gap)
#> [1] "181800s (~2.1 days)"
```

Subtracting two POSIXct values yields a base R difftime. Wrap it in `as.duration()` to get a lubridate Duration with consistent units.

### 6. Vectorise across a column

```r title="Vectorised duration arithmetic"
df <- data.frame(
  start = ymd_hms(c("2024-01-01 09:00", "2024-01-01 14:30")),
  end   = ymd_hms(c("2024-01-01 11:45", "2024-01-01 17:00"))
)
df$elapsed <- as.duration(df$end - df$start)
df
#>                 start                 end       elapsed
#> 1 2024-01-01 09:00:00 2024-01-01 11:45:00 9900s (~2.75 hours)
#> 2 2024-01-01 14:30:00 2024-01-01 17:00:00  9000s (~2.5 hours)
```

`as.duration()` is vectorised, so it works inside `mutate()` or any column-wise assignment without a loop.

## Duration vs Period: when exact seconds matter

**Use a Duration for elapsed clock seconds; use a Period for human calendar units.** The two classes look similar in print but answer different questions about time.

| Concept | Duration | Period |
|---|---|---|
| Stored as | Exact seconds | Calendar units (years, months, days, ...) |
| Constructor | `duration()`, `ddays()`, `dhours()` | `period()`, `days()`, `hours()` |
| One year equals | 31,557,600 s (365.25 days) | Variable (365 or 366 days) |
| DST behaviour | Adds raw seconds, clock shifts | Respects time zone rules |
| Right for | Stopwatches, log gaps, science | "Same day next month" semantics |

The rule of thumb: if you care that the answer is the same elapsed time on a stopwatch, use a Duration. If you care that the answer lands on a particular calendar date, use a Period.

[NOTE]
**Durations cannot be added to a base R `Date` value directly because Date has no time component.** Coerce the Date with `as.POSIXct()` first, or use a Period (`days(N)`) when you only need calendar-day arithmetic.

## Common pitfalls

**Assuming `dyears(1)` lands on the same calendar date next year.** It does not. A Duration year is 365.25 days, so adding `dyears(1)` to `ymd("2024-02-29")` produces `2025-03-01 06:00:00` rather than a calendar-aligned date. Use `years(1)` (a Period) when you want "same month, same day, next year".

**Treating a Duration like a number when comparing.** Comparisons between a Duration and a numeric work because lubridate coerces the number to seconds, but mixing units silently can mislead. Prefer explicit coercion: `as.numeric(d, "hours") > 24`.

**Forgetting that `duration("1 month")` is approximate.** lubridate uses 30.4375 days for one month and warns when you build a Duration from a unit that has no fixed second count. Use `months(1)` (Period) for month arithmetic on dates.

## Try it yourself

**Try it:** Build a Duration of exactly 90 minutes, add it to the POSIXct timestamp `ymd_hms("2024-06-15 08:00:00")`, and store the result in `ex_finish`.

```r title="Your turn: schedule a 90-minute session"
# Try it: build a duration and shift a timestamp
ex_start <- ymd_hms("2024-06-15 08:00:00")
ex_finish <- # your code here

ex_finish
#> Expected: "2024-06-15 09:30:00 UTC"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_start <- ymd_hms("2024-06-15 08:00:00")
ex_finish <- ex_start + dminutes(90)
ex_finish
#> [1] "2024-06-15 09:30:00 UTC"
```

**Explanation:** `dminutes(90)` builds a Duration of 5,400 seconds, and adding it to a POSIXct value advances the clock by exactly that many seconds. `duration(90, "minutes")` produces the same result.

</details>

## Related lubridate functions

- `period()` and `days()`, `months()`, `years()` build calendar-aware Periods (see [lubridate days() in R](lubridate-days-in-R.html)).
- `interval()` builds an Interval bounded by two timestamps; convert to a Duration with `as.duration()`.
- `time_length()` returns a numeric length of an Interval in any unit.
- `as.difftime()` converts a Duration's seconds back to a base R difftime.
- `make_difftime()` builds a difftime directly from numeric seconds.

For the full lubridate reference, see the [tidyverse lubridate documentation](https://lubridate.tidyverse.org/reference/duration.html).

## FAQ

**What is the difference between duration() and period() in lubridate?**

`duration()` returns a Duration that stores time as an exact second count, while `period()` returns a Period that stores time as calendar units (years, months, days, etc.). A Duration of one day is always 86,400 seconds. A Period of one day is one calendar day, which can equal 23, 24, or 25 hours when daylight saving begins or ends. Pick Duration for elapsed time; pick Period for date arithmetic.

**How do I convert a difftime to a lubridate Duration?**

Wrap the difftime in `as.duration()`. For example, `as.duration(difftime(t2, t1, units = "secs"))` returns a Duration with the same elapsed seconds. The reverse conversion, Duration to difftime, uses `as.difftime(d, units = "secs")` and yields the base R class.

**Can I add a Duration to a Date object?**

Not directly, because a Date has no time component. Coerce the Date to POSIXct first with `as.POSIXct(d)` and then add the Duration, or use a Period (`days(N)`) when calendar-day arithmetic is enough. Adding a Duration to a POSIXct returns a POSIXct shifted by the exact number of seconds in the Duration.

**Why does dyears(1) not land on the same calendar date one year later?**

Because a Duration year is fixed at 365.25 days (31,557,600 seconds), and that number does not align with real calendar years that are either 365 or 366 days long. Adding `dyears(1)` to a date frequently produces a result six hours into the next day. For "same calendar date next year" semantics, use the Period helper `years(1)`.

**How do I get the length of a Duration in hours or days?**

Coerce with `as.numeric()` and pass the target unit: `as.numeric(duration("1 week"), "hours")` returns 168. Supported units include `"seconds"`, `"minutes"`, `"hours"`, `"days"`, `"weeks"`, `"months"`, and `"years"`. The conversion uses fixed second counts, so the result is exact for time units and approximate for months and years.
