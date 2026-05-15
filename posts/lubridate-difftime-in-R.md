---
title: "lubridate difftime in R: Build, Inspect, and Convert Spans"
slug: "lubridate-difftime-in-R"
description: "Use lubridate make_difftime(), as.difftime(), and is.difftime() to build, check, and convert difftime spans across seconds, hours, days, and weeks in R."
keywords: "lubridate difftime, make_difftime R, as.difftime lubridate, is.difftime R, difftime to numeric R, time difference R units, lubridate time difference"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "make_difftime()|as.difftime()|is.difftime()|lubridate difftime|difftime object"
auto_link_case_sensitive: true
target_keyword: "lubridate difftime"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate difftime in R: Build, Inspect, and Convert Spans

<p class="lead">A <code>difftime</code> object in R is a numeric time span with a units attribute, the class returned every time you subtract one POSIXct or Date value from another. lubridate adds <code>make_difftime()</code>, <code>as.difftime()</code>, and <code>is.difftime()</code> so you can build, test, and convert these spans without juggling base R's unit gymnastics.</p>

[QUICK ANSWER]
t2 - t1                                  # base R returns a difftime
make_difftime(seconds = 3600)            # build from seconds
make_difftime(hour = 1, minute = 30)     # build from named components
make_difftime(86400, units = "days")     # build with explicit units
as.difftime(90, units = "mins")          # promote a numeric
is.difftime(x)                           # TRUE if x is difftime
as.numeric(d, units = "hours")           # strip class, get a number
time_length(d, "day")                    # lubridate, unit-flexible

[DECISION TREE: Is difftime the right tool?]
- raw span between two POSIXct or Date values: t2 - t1
- build a span from named components (h, m, s): make_difftime(hour = 1, minute = 30)
- test whether an object is a difftime: is.difftime(x)
- exact-second span for arithmetic, ignores DST: duration(3600)
- calendar-unit span (months, years): period(months = 3)
- start-and-end-anchored span on real calendar: start %--% end
- length of a span in a named unit: time_length(span, "day")
- pretty print "1h 30m 0s": as.period(d)

## What lubridate difftime means

**A `difftime` is base R's native time-span class, and lubridate gives it three companion helpers.** You meet a difftime the first time you subtract two timestamps: it prints as a number plus a unit (`Time difference of 5.5 hours`) and stores a `double` with a `units` attribute R picks based on the span's magnitude.

lubridate does not replace this class. It exposes `make_difftime()` to construct one from named components, `as.difftime()` to promote a numeric, and `is.difftime()` to test the class. The other lubridate span tools (`Duration`, `Period`, `Interval`) sit alongside difftime and convert into it cleanly.

## How to create a difftime

**Three paths produce a difftime: subtraction, `make_difftime()`, and `as.difftime()`.** Pick by what you have: timestamps to subtract, named components to combine, or a plain numeric to label with a unit.

```r title="Three ways to create a difftime"
library(lubridate)

t1 <- ymd_hms("2026-05-15 09:00:00")
t2 <- ymd_hms("2026-05-15 14:30:00")
d1 <- t2 - t1
d1
#> Time difference of 5.5 hours

d2 <- make_difftime(hour = 1, minute = 30)
d2
#> Time difference of 1.5 hours

d3 <- as.difftime(90, units = "mins")
d3
#> Time difference of 90 mins
```

Subtraction picks the units automatically. `make_difftime()` accepts `second`, `minute`, `hour`, `day`, and `week` as named arguments and sums them. `as.difftime()` is the explicit cast for a plain numeric, useful when reading a duration column from CSV.

[TIP]
**Reach for `make_difftime()` when you want a span without the `Duration` print prefix.** `duration()` returns `"5400s (~1.5 hours)"`. `make_difftime()` returns the base R `difftime` class that ggplot and most data frames already expect.

## Syntax

**`make_difftime(x, units = "auto", ..., second, minute, hour, day, week)` builds a difftime from components.** The first positional argument is a numeric count of seconds. Named arguments sum into seconds. `units` controls the printed unit: `"auto"` lets R pick, the named units force a specific one.

```r title="make_difftime argument forms"
make_difftime(3600)
#> Time difference of 1 hours

make_difftime(3600, units = "secs")
#> Time difference of 3600 secs

make_difftime(day = 1, hour = 12)
#> Time difference of 1.5 days

make_difftime(week = 2, day = 3)
#> Time difference of 2.428571 weeks
```

The unit choice only affects printing. Storage is always seconds, so two difftimes that print differently can still be equal. Stick to one unit per pipeline.

## Six common patterns

### 1. Time elapsed between two events

```r title="Elapsed time between two events"
start <- ymd_hms("2026-05-15 09:15:00")
end   <- ymd_hms("2026-05-15 17:45:30")

elapsed <- end - start
elapsed
#> Time difference of 8.508333 hours
class(elapsed)
#> [1] "difftime"
```

Subtraction is the everyday path. R returns a difftime with the unit chosen for readability, so an 8.5-hour gap prints in hours rather than 30,630 seconds.

### 2. Build a span from named components

```r title="Build a span from named pieces"
shift <- make_difftime(hour = 7, minute = 30)
shift
#> Time difference of 7.5 hours

travel <- make_difftime(day = 2, hour = 6)
travel
#> Time difference of 2.25 days

sla <- make_difftime(minute = 90)
sla
#> Time difference of 1.5 hours
```

`make_difftime()` is the cleanest way to encode a known span: a 90-minute SLA, a 7.5-hour shift, a 2-day-6-hour transit. It is more readable than `as.difftime(90 * 60, units = "secs")` and survives code review without a comment.

### 3. Check whether a column is difftime

```r title="Test the class of a column"
events <- data.frame(
  task = c("build", "test", "deploy"),
  start = ymd_hms(c("2026-05-15 09:00:00",
                    "2026-05-15 10:30:00",
                    "2026-05-15 11:45:00")),
  end   = ymd_hms(c("2026-05-15 10:25:00",
                    "2026-05-15 11:40:00",
                    "2026-05-15 12:05:00"))
)
events$duration <- events$end - events$start

is.difftime(events$duration)
#> [1] TRUE
is.difftime(events$start)
#> [1] FALSE
```

`is.difftime()` returns a single `TRUE` or `FALSE`. Use it inside a function before calling `as.numeric(x, units = "hours")` to fail fast on a misnamed column. It is a thin wrapper around `inherits(x, "difftime")` that reads cleaner in pipelines.

### 4. Promote a numeric column to difftime

```r title="Cast a numeric duration column"
minutes <- c(15, 45, 90, 120)
spans <- as.difftime(minutes, units = "mins")
spans
#> Time differences in mins
#> [1]  15  45  90 120

mean(spans)
#> Time difference of 67.5 mins
```

CSV columns often store durations as plain numbers ("minutes_active", "seconds_elapsed"). `as.difftime()` labels the column with a unit so `mean()`, `sum()`, and arithmetic carry the unit through. Without the cast, R treats the column as bare numerics and the unit story is lost.

### 5. Convert a difftime to a clean numeric

```r title="Strip the class for math"
d <- make_difftime(hour = 8, minute = 30)

as.numeric(d, units = "hours")
#> [1] 8.5

as.numeric(d, units = "mins")
#> [1] 510

time_length(d, "second")
#> [1] 30600
```

Two equivalent paths: base R's `as.numeric(d, units = "...")` and lubridate's `time_length(d, "...")`. Both strip the class and return a plain `double`. lubridate accepts seven singular-form units; base R accepts the plurals `secs`, `mins`, `hours`, `days`, `weeks`.

[KEY INSIGHT]
**The `units` attribute is cosmetic; storage is always seconds.** Two difftimes with the same elapsed time print differently only because their `units` attribute differs. `as.numeric(d)` without `units = ...` returns the stored seconds. `units(d) <- "hours"` re-prints the same span without changing its value.

### 6. Convert difftime to lubridate spans

```r title="Difftime to Duration, Period, Interval"
d <- make_difftime(day = 1, hour = 6)

as.duration(d)
#> [1] "108000s (~1.25 days)"

as.period(d)
#> [1] "1d 6H 0M 0S"

start <- ymd_hms("2026-05-15 09:00:00")
start + d
#> [1] "2026-05-16 15:00:00 UTC"
```

`as.duration()` converts to a fixed-second `Duration` for DST-safe math. `as.period()` converts to a calendar-unit `Period` for day-and-hour printing. Adding a difftime to a POSIXct just works because base R adds the stored seconds to the timestamp.

## difftime vs Duration vs Period

**lubridate's three span classes overlap with difftime but optimise for different goals.** Pick by what you need: a base R class everyone understands, exact seconds for math, or calendar units for printing.

| Class | Built by | Stores | Best for |
|---|---|---|---|
| difftime | base R subtraction, `make_difftime()` | seconds with a units attribute | drop-in base R, ggplot, data frames |
| Duration | `duration()`, `dhours()`, etc. | exact seconds | DST-safe arithmetic, ignoring calendar |
| Period | `period()`, `months()`, `years()` | calendar units (m, y) | adding "1 month" with calendar truth |

difftime is the lingua franca: any package that takes a numeric duration accepts it. Duration is for second-counted math where 1 day always equals 86,400 seconds. Period is for "the same day of next month", whose answer depends on the start date.

[NOTE]
**`make_difftime()` is not the only path in lubridate.** `dhours(3)` returns a `Duration`, and `as.difftime(dhours(3), units = "hours")` round-trips. For one-step construction, `make_difftime()` is shorter; for arithmetic that may cross DST, keep a `Duration` and convert only at the output step.

## Common pitfalls

**Subtracting a Date and a POSIXct picks an unexpected unit.** `ymd_hms("2026-05-15 09:00:00") - ymd("2026-05-14")` returns the gap in days, not hours, because R picks the larger unit on a mixed-class subtraction. Convert both sides explicitly (`as.POSIXct(my_date)`) for a predictable unit.

**`as.numeric(d)` without `units = ...` returns seconds, not the printed unit.** A difftime that prints `5.5 hours` returns `19800` from `as.numeric(d)`. Always pass `units = "hours"` (or `time_length(d, "hour")`) when you want the printed number, not raw storage.

**Plural unit names for base R, singular for lubridate.** `as.difftime(x, units = "min")` errors; `units = "mins"` works. `time_length(d, "mins")` errors; `time_length(d, "minute")` works. Plural in base R, singular in lubridate, no exceptions.

## Try it yourself

**Try it:** Build a difftime of 3 hours 45 minutes with `make_difftime()` and store it in `ex_span`. Then convert it to a plain number of minutes and store it in `ex_minutes`.

```r title="Your turn: build and convert a difftime"
# Try it: build a difftime, then convert to minutes
ex_span <- # your code here
ex_minutes <- # your code here

ex_span
ex_minutes
#> Expected: ex_span prints 3.75 hours, ex_minutes is 225
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_span <- make_difftime(hour = 3, minute = 45)
ex_minutes <- as.numeric(ex_span, units = "mins")

ex_span
#> Time difference of 3.75 hours
ex_minutes
#> [1] 225
```

**Explanation:** `make_difftime()` sums named components into seconds and lets R pick "hours" for the print unit. `as.numeric(ex_span, units = "mins")` strips the class and returns the count in the unit you ask for, regardless of how it printed.

</details>

## Related lubridate functions

- `time_length()` converts a difftime, Duration, Period, or Interval into a number in any named unit (see [lubridate time_length() in R](lubridate-time_length-in-R.html)).
- `duration()` and the `d*()` helpers (`dhours`, `dminutes`) build exact-second spans (see [lubridate duration() in R](lubridate-duration-in-R.html)).
- `period()` and the unhelpered family (`hours`, `minutes`) build calendar-unit spans (see [lubridate period() in R](lubridate-period-in-R.html)).
- `interval()` and `%--%` build start-end-anchored spans on the real calendar (see [lubridate interval() in R](lubridate-interval-in-R.html)).
- `int_length()` returns the length of an Interval in seconds (faster than `time_length(..., "second")` for that one case).

For the full reference, see the [tidyverse make_difftime() documentation](https://lubridate.tidyverse.org/reference/make_difftime.html).

## FAQ

**What is a difftime object in R?**

A `difftime` is base R's class for a numeric time span. It carries the elapsed seconds plus a `units` attribute that controls how the value prints ("secs", "mins", "hours", "days", "weeks"). Subtraction between two POSIXct or Date values returns one automatically. lubridate adds `make_difftime()`, `as.difftime()`, and `is.difftime()` to build, cast, and test the class, but the class itself is base R.

**How do I convert difftime to a number of hours in R?**

Use `as.numeric(d, units = "hours")` from base R or `time_length(d, "hour")` from lubridate. Both return a plain `double` in hours, including the fractional part. Base R uses plural forms ("hours", "mins"); lubridate uses singular ("hour", "minute"). Calling `as.numeric(d)` without a `units` argument returns the stored seconds, not the printed unit, a common source of off-by-3600 bugs.

**What is the difference between difftime, Duration, and Period?**

`difftime` is base R's span class with a units attribute; it stores seconds and prints in whatever unit fits. `Duration` is lubridate's exact-seconds class and ignores the calendar, so 1 day always equals 86,400 seconds even across DST. `Period` stores calendar units (months, years) and walks the real calendar when added to a date. Pick difftime for base R, Duration for second-counted math, Period for calendar logic.

**Why does difftime sometimes print in days and sometimes in seconds?**

When R creates a difftime through subtraction, it picks the largest unit where the magnitude is at least 1 to keep the print readable. Two timestamps 30 seconds apart print in seconds; 4 hours apart print in hours; 60 days apart print in days. The stored seconds are unchanged. Force a fixed unit with `units(d) <- "hours"` for consistent printing across a column.

**Can I add a difftime to a POSIXct or Date?**

Yes. Base R defines `+` between POSIXct and difftime so `ymd_hms("2026-05-15 09:00:00") + make_difftime(hour = 1)` returns the timestamp one hour later. Addition uses the stored seconds and ignores the units attribute. For DST-safe math, convert to `Duration` first; for calendar-aware addition (months, years), use `Period`, since difftime has no concept of variable-length units.
