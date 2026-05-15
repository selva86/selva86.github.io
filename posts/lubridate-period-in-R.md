---
title: "lubridate period() in R: Calendar-Aware Time Spans"
slug: "lubridate-period-in-R"
description: "Use lubridate period() in R to build calendar-aware spans, add months and years to dates safely, and pick Period over Duration when daylight saving matters."
keywords: "lubridate period, period function R, lubridate period examples, R Period class, period vs duration R, lubridate years months days, calendar arithmetic R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "period()|lubridate period|lubridate::period()|Period class|calendar-aware time span"
auto_link_case_sensitive: true
target_keyword: "lubridate period"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate period() in R: Calendar-Aware Time Spans

<p class="lead">The <code>period()</code> function in lubridate builds a Period object that stores a time span as calendar units, years, months, weeks, days, hours, minutes, and seconds. Use it when you want "same day next month" or "one year later" arithmetic that respects daylight saving and variable month lengths.</p>

[QUICK ANSWER]
period(1, units = "month")              # one calendar month
period("2 hours 30 mins")               # parse a friendly string
period(c(1, 2), c("year", "month"))     # multi-unit Period
years(1) + months(6)                    # 1.5 calendar years
ymd("2024-01-31") + months(1)           # safe-ish month math (returns NA)
ymd("2024-03-09 22:00", tz="US/Eastern") + days(1)   # DST-aware shift
period_to_seconds(period("1 week"))     # 604800
as.period(interval(t1, t2))             # difference as Period

[DECISION TREE: Is period() the right tool?]
- calendar-aware span, "same day next month": period() or months(N), years(N)
- exact second-precise span ignoring calendar: duration() or ddays(N), dhours(N)
- bounded span between two timestamps: interval(t1, t2)
- length of a Period in a chosen unit: period_to_seconds() or time_length(int, "months")
- snap a date to the nearest month or week: floor_date(x, "month")
- safely add months to month-ends (Jan 31 + 1 month): %m+% operator
- parse a date or datetime string: ymd(), ymd_hms(), parse_date_time()
- extract a unit from a date: year(), month(), day(), hour()

## What period() does in one sentence

**`period()` constructs a calendar-aware time span stored as a Period object.** You pass a numeric vector of values plus a parallel vector of unit names, or a single descriptive string, and lubridate returns a Period that records each unit separately rather than collapsing the span to a single second count.

A Period holds years, months, weeks, days, hours, minutes, and seconds in distinct slots. When you add a Period to a date or POSIXct value, lubridate consults the calendar and the time zone, so `months(1)` lands on the same day of the next month and `days(1)` advances the clock through any daylight-saving transition.

## Syntax

**`period(num = NULL, units = "second", ...)` accepts a numeric vector and a parallel units vector, or a single parsable string.** The function recognises units `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`, plus their plural forms.

```r title="Load lubridate and build a period"
library(lubridate)

period(1, units = "month")
#> [1] "1m 0d 0H 0M 0S"

period(num = c(2, 30), units = c("hour", "minute"))
#> [1] "2H 30M 0S"

period("1 year 6 months")
#> [1] "1y 6m 0d 0H 0M 0S"

class(period(1, "month"))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"
```

The print method shows each unit with a single-letter suffix: `y` for year, `m` for month, `d` for day, then `H`, `M`, `S` for clock units. The lowercase `m` for month and uppercase `M` for minute are the visual signal that distinguishes the two.

[TIP]
**Reach for `period()` when "the same calendar position" is the right semantic.** Monthly subscriptions, recurring meetings, anniversary dates, and amortisation schedules all care about landing on the same day of the next month, not on the same number of elapsed seconds. Use a Duration when "exactly N seconds from now" is what you really mean.

## Six common patterns

### 1. Build a Period from numeric value and unit

```r title="Build from numeric"
period(3, units = "day")
#> [1] "3d 0H 0M 0S"

period(c(1, 6), c("year", "month"))
#> [1] "1y 6m 0d 0H 0M 0S"
```

Pass parallel vectors when you need a multi-unit Period. The two vectors must be the same length; lubridate fills the unused unit slots with zeros.

### 2. Parse a friendly string

```r title="Parse a period string"
period("3 weeks 4 days")
#> [1] "25d 0H 0M 0S"

period("2H 30M")
#> [1] "2H 30M 0S"
```

The parser collapses weeks into days because the Period class has no separate week slot internally. `weeks(1)` is sugar for `days(7)` when stored in a Period.

### 3. Use the unit-name helper family

```r title="Helper functions for each unit"
years(1); months(6); weeks(2)
#> [1] "1y 0m 0d 0H 0M 0S"
#> [1] "6m 0d 0H 0M 0S"
#> [1] "14d 0H 0M 0S"

days(7); hours(3); minutes(45); seconds(30)
#> [1] "7d 0H 0M 0S"
#> [1] "3H 0M 0S"
#> [1] "45M 0S"
#> [1] "30S"
```

The helpers read more naturally inside expressions. `months(6)` is identical to `period(6, "month")`, and you can add them: `years(1) + months(6)` produces a 1.5 calendar year Period.

[KEY INSIGHT]
**The unit-name helpers (no `d` prefix) build Periods, the `d`-prefixed helpers build Durations.** Compare `days(7)` (a Period of 7 calendar days that respects DST) with `ddays(7)` (a Duration of exactly 7 times 86,400 seconds). The two diverge near time zone transitions and on leap days.

### 4. Add a Period to a POSIXct timestamp across a DST boundary

```r title="DST-aware shift with a Period"
start <- ymd_hms("2024-03-09 22:00:00", tz = "US/Eastern")
start + days(1)
#> [1] "2024-03-10 22:00:00 EDT"

start + ddays(1)
#> [1] "2024-03-11 00:00:00 EDT"
```

The two results differ by one hour because the US "spring forward" jump happens that night. `days(1)` adds one calendar day and lets the clock follow the time zone rule. `ddays(1)` adds 86,400 raw seconds and the clock lands one hour past midnight.

### 5. Get a Period from an Interval

```r title="Convert an Interval to a Period"
t1 <- ymd("2024-01-15")
t2 <- ymd("2025-04-20")
gap <- interval(t1, t2)
gap
#> [1] 2024-01-15 UTC--2025-04-20 UTC

as.period(gap)
#> [1] "1y 3m 5d 0H 0M 0S"
```

`as.period()` breaks the elapsed time into the largest whole calendar units that fit, walking from years down to seconds. The result is readable for humans and stable across leap years.

### 6. Vectorise across a column

```r title="Vectorised period arithmetic"
df <- data.frame(
  start = ymd(c("2024-01-15", "2024-03-31")),
  add_months = c(2, 1)
)
df$due <- df$start + months(df$add_months)
df
#>        start add_months        due
#> 1 2024-01-15          2 2024-03-15
#> 2 2024-03-31          1       <NA>
```

`months()` is vectorised, so it works inside `mutate()` or any column-wise assignment without a loop. The second row returns `NA` because April has no 31st day, which is the canonical Period pitfall covered below.

## Period vs Duration: when the calendar matters

**Use a Period for human calendar units; use a Duration for elapsed clock seconds.** The two classes look similar in print but answer different questions about time.

| Concept | Period | Duration |
|---|---|---|
| Stored as | Calendar units (years, months, days, hours, ...) | Exact seconds |
| Constructor | `period()`, `years()`, `months()`, `days()` | `duration()`, `dyears()`, `ddays()` |
| One month equals | One calendar month (28-31 days) | 30.4375 days fixed |
| DST behaviour | Respects time zone rules | Adds raw seconds, clock shifts |
| Right for | Anniversaries, billing cycles, due dates | Stopwatches, timeouts, science |

The rule of thumb: if you care that the answer lands on a particular calendar date, use a Period. If you care that the answer is the same elapsed time on a stopwatch, use a Duration. See the companion guide [lubridate duration() in R](lubridate-duration-in-R.html) for the Duration-first view.

[NOTE]
**A Period plus a `Date` returns a `Date`; a Period plus a `POSIXct` returns a `POSIXct`.** lubridate preserves the input class so date-only arithmetic stays date-only and you do not silently grow a time component you did not ask for.

## Common pitfalls

**Adding a month to a month-end date can return `NA`.** `ymd("2024-01-31") + months(1)` returns `NA` because February has no 31st day and lubridate refuses to silently roll forward. Use the safe addition operator `%m+%` if you want lubridate to clamp the result to the last day of the target month: `ymd("2024-01-31") %m+% months(1)` returns `"2024-02-29"`.

**Comparing two Periods by length is undefined when months are involved.** `months(1) > days(28)` warns because one month can be 28 to 31 days. Convert to a Duration with `as.duration()` or anchor the comparison to a specific date with an Interval.

**Confusing the lowercase `m` for month with uppercase `M` for minute in the print method.** A Period printed as `"1m 0d 0H 0M 0S"` is one month plus zero days, zero hours, zero minutes, and zero seconds. The uppercase `M` only ever means minutes.

## Try it yourself

**Try it:** Build a Period of 2 months and 15 days, add it to `ymd("2024-01-31")`, and store the result in `ex_due`. Then add the same Period to the same date with `%m+%` and store the result in `ex_due_safe`. Compare the two.

```r title="Your turn: schedule a billing date"
# Try it: build a period and add it safely to a month-end date
ex_start <- ymd("2024-01-31")
ex_due <- # your code here
ex_due_safe <- # your code here

ex_due
ex_due_safe
#> Expected: ex_due is NA, ex_due_safe is "2024-04-15"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_start <- ymd("2024-01-31")
ex_due <- ex_start + period(c(2, 15), c("month", "day"))
ex_due_safe <- ex_start %m+% period(c(2, 15), c("month", "day"))

ex_due
#> [1] NA
ex_due_safe
#> [1] "2024-04-15"
```

**Explanation:** Adding 2 months to January 31 lands on February 31, which does not exist, so `+` returns `NA`. The safe operator `%m+%` clamps to the last valid day of the target month before adding the 15 extra days, giving a sensible billing date.

</details>

## Related lubridate functions

- `duration()` and `ddays()`, `dhours()`, `dyears()` build exact-second Durations (see [lubridate duration() in R](lubridate-duration-in-R.html)).
- `interval()` builds an Interval bounded by two timestamps; convert to a Period with `as.period()`.
- `%m+%` and `%m-%` are safe month-aware addition operators that clamp invalid dates.
- `time_length()` returns a numeric length of an Interval in any unit, including months and years.
- `period_to_seconds()` collapses a Period to a single second count using fixed conversion factors.

For the full lubridate reference, see the [tidyverse lubridate documentation](https://lubridate.tidyverse.org/reference/period.html).

## FAQ

**What is the difference between period() and duration() in lubridate?**

`period()` returns a Period that stores time as calendar units (years, months, days, hours, minutes, seconds), while `duration()` returns a Duration that stores time as an exact second count. A Period of one month is one calendar month, which can be 28 to 31 days. A Duration of one month is fixed at 30.4375 days (2,629,800 seconds). Pick Period for date arithmetic that should respect the calendar; pick Duration for elapsed time on a stopwatch.

**How do I add months to a date in R without getting NA?**

Use the safe addition operator `%m+%` from lubridate. The expression `ymd("2024-01-31") %m+% months(1)` returns `"2024-02-29"` by clamping the result to the last valid day of the target month, while `ymd("2024-01-31") + months(1)` returns `NA` because February has no 31st day. The `%m-%` operator does the same for subtraction.

**Can I add a Period to a base R Date object?**

Yes. Adding a Period to a Date returns a Date, and adding a Period to a POSIXct returns a POSIXct. lubridate preserves the input class. If the Period contains time-of-day units (hours, minutes, seconds) and you add it to a Date, lubridate ignores the sub-day part and returns a Date rather than silently promoting the result to POSIXct.

**Why does months(1) sometimes change the displayed clock time on a POSIXct?**

It does not change the wall-clock reading, but daylight saving shifts the time zone label. Adding `months(1)` to `ymd_hms("2024-02-15 12:00", tz = "US/Eastern")` returns `"2024-03-15 12:00 EDT"`. The noon reading is preserved even though March is in EDT and February in EST, because Period arithmetic respects the zone.

**How do I get the length of a Period in days?**

Use `period_to_seconds()` divided by 86,400, or call `time_length()` on an anchored Interval. `period_to_seconds(period("1 month")) / 86400` returns 30.4375 (lubridate's fixed conversion). For a calendar-correct count, build an Interval first: `time_length(interval(start, start + months(1)), "days")`.
