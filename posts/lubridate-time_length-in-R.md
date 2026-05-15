---
title: "lubridate time_length() in R: Span Length in Any Unit"
slug: "lubridate-time_length-in-R"
description: "Use lubridate time_length() in R to convert intervals, durations, and periods into years, months, weeks, days, hours, or seconds with calendar-aware precision."
keywords: "lubridate time_length, time_length function R, lubridate time_length examples, R duration in years, calculate age in R, time difference R units, lubridate interval length"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "time_length()|lubridate time_length|lubridate::time_length()|time span length|calendar-aware length"
auto_link_case_sensitive: true
target_keyword: "lubridate time_length"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate time_length() in R: Span Length in Any Unit

<p class="lead">The <code>time_length()</code> function in lubridate converts a time span (Interval, Period, Duration, or difftime) into a numeric in the unit you request: seconds, minutes, hours, days, weeks, months, or years. For an Interval it walks the real calendar; for a Period or Duration it divides by the unit's constant.</p>

[QUICK ANSWER]
time_length(span, "second")                # default unit
time_length(span, "day")                   # days in the span
time_length(span, "week")                  # weeks as a double
time_length(gap, "month")                  # calendar-aware months
time_length(gap, "year")                   # exact years between dates
time_length(birthday %--% today(), "year") # age in years
time_length(as.duration(span), "hour")     # hours from a Duration
floor(time_length(gap, "year"))            # integer age

[DECISION TREE: Is time_length() the right tool?]
- length of an Interval in a named unit: time_length(gap, "month")
- length of a Duration or Period as a number: time_length(d, "day")
- compute age in whole years: floor(time_length(dob %--% today(), "year"))
- raw seconds only, no unit conversion: int_length(gap)
- pretty print "1y 3m 5d": as.period(gap)
- difference between two POSIXct as a Duration: as.duration(t2 - t1)
- round a date to the start of a month: floor_date(x, "month")
- shift a date by exactly 3 calendar months: x + months(3)

## What time_length() does in one sentence

**`time_length()` returns the length of a time span as a numeric in the unit you name.** You pass any span object plus a unit string ("second" through "year") and lubridate returns a `double`: the count of that unit fitting inside the span. It is the bridge between time-span objects and ordinary numbers you can sort, average, or pass to ggplot.

The behaviour splits at the input class. For an Interval, lubridate walks the real calendar between start and end. For a Period or Duration, lubridate divides by a fixed seconds-per-unit constant, since neither class is anchored to real dates.

## Syntax

**`time_length(x, unit = "second")` accepts any time span and a unit string.** The first argument is an Interval, Period, Duration, difftime, or a numeric of seconds. The unit argument names the result unit and accepts: "second", "minute", "hour", "day", "week", "month", "year".

```r title="Load lubridate and call time_length"
library(lubridate)

gap <- ymd("2024-01-15") %--% ymd("2024-04-20")
time_length(gap)
#> [1] 8294400

time_length(gap, "day")
#> [1] 96

time_length(gap, "month")
#> [1] 3.16129
```

The default unit is "second", matching the underlying storage of every span class. Returning a `double` (not an integer) is deliberate: months and years rarely divide evenly, and rounding belongs in the caller.

[TIP]
**Reach for `time_length()` whenever you need a span as a plain number.** `int_length()` only returns seconds and only accepts Intervals. `as.numeric(span, "unit")` works but is less explicit. `time_length()` accepts every span class and every common unit, so it always reads correctly in code review.

## Six common patterns

### 1. Days between two dates

```r title="Days between two dates"
start <- ymd("2024-03-01")
end   <- ymd("2024-04-15")
gap <- start %--% end

time_length(gap, "day")
#> [1] 45
```

Building the Interval with `%--%` and asking for "day" returns the exact day count between the timestamps. Day is a fixed 86,400 seconds, so the answer is an integer-valued double when no daylight-saving transition falls inside the span.

### 2. Calendar-aware months and years

```r title="Months between two dates, calendar-aware"
gap <- ymd("2023-01-31") %--% ymd("2024-02-29")

time_length(gap, "month")
#> [1] 13

time_length(gap, "year")
#> [1] 1.083333
```

For an Interval, `time_length()` walks the real calendar: 2023-01-31 to 2024-02-29 is exactly 13 months even though February 2024 has 29 days. The "year" answer factors in the leap day. A fixed-average calculation will not match.

### 3. Compute age in whole years

```r title="Age in whole years from a birth date"
dob <- ymd("1990-06-15")
today_date <- ymd("2026-05-15")

time_length(dob %--% today_date, "year")
#> [1] 35.91667

floor(time_length(dob %--% today_date, "year"))
#> [1] 35
```

Age is the canonical use case. Build an Interval from birth date to today, ask for "year", and floor the result. Leap years are counted correctly, so a person born on 2000-02-29 increments their age on March 1 in non-leap years.

### 4. Convert a Duration to hours or days

```r title="Duration in named units"
d <- duration(7, "days") + dhours(6)
d
#> [1] "626400s (~1.03 weeks)"

time_length(d, "hour")
#> [1] 174

time_length(d, "day")
#> [1] 7.25
```

For a Duration, `time_length()` divides the stored seconds by the unit's fixed constant (3,600 for hour, 86,400 for day, 2,629,800 for month). The result is a clean numeric without the "X seconds (~Y weeks)" string Duration prints by default.

### 5. Convert a difftime without unit gymnastics

```r title="difftime to a clean number"
t1 <- ymd_hms("2024-01-15 09:00:00")
t2 <- ymd_hms("2024-01-15 17:30:00")
diff <- t2 - t1
diff
#> Time difference of 8.5 hours

time_length(diff, "minute")
#> [1] 510

time_length(diff, "hour")
#> [1] 8.5
```

Subtracting two POSIXct values returns a `difftime` whose unit attribute depends on the magnitude (R picks the largest sensible unit). `time_length()` ignores that attribute and returns the count in whatever unit you ask for, so downstream code never has to check `units(diff)`.

[KEY INSIGHT]
**`time_length()` is calendar-aware only when the input is an Interval.** Periods and Durations carry no anchor date, so `time_length(months(3), "day")` returns 91.31 (3 times the average month). `time_length(start %--% (start + months(3)), "day")` returns the actual day count for those three specific months. Pick the right input class first; the function then does the math correctly.

### 6. Vectorise across a column of intervals

```r title="Compute lengths across a data frame"
events <- data.frame(
  start = ymd(c("2024-01-01", "2024-04-10", "2024-08-15")),
  end   = ymd(c("2024-03-31", "2024-05-20", "2024-12-31"))
)
events$span    <- events$start %--% events$end
events$days    <- time_length(events$span, "day")
events$months  <- round(time_length(events$span, "month"), 2)
events
#>        start        end                       span days months
#> 1 2024-01-01 2024-03-31 2024-01-01 UTC--2024-03-31   90   2.97
#> 2 2024-04-10 2024-05-20 2024-04-10 UTC--2024-05-20   40   1.32
#> 3 2024-08-15 2024-12-31 2024-08-15 UTC--2024-12-31  138   4.55
```

`time_length()` is vectorised end to end. Build a column of Intervals with `%--%`, call `time_length()` per unit, and you get clean numeric columns ready for ggplot or arithmetic without a loop.

## time_length() vs int_length() vs as.numeric()

**The three functions overlap but have different scope.** Pick by what kinds of inputs you need to accept and what units you need to return.

| Function | Accepts | Units | Returns |
|---|---|---|---|
| `time_length()` | Interval, Period, Duration, difftime | any of 7 named units | numeric in named unit |
| `int_length()` | Interval only | seconds only | numeric in seconds |
| `as.numeric(x, "unit")` | Period, Duration, difftime | any of 7 named units | numeric in named unit |

`int_length()` is the fastest path for seconds from an Interval. `as.numeric()` covers non-Interval classes but not Intervals. `time_length()` accepts every span class, which is why it is the default recommendation in newer lubridate docs.

[NOTE]
**Older code uses `as.numeric(span, "unit")`; both still work.** lubridate added `time_length()` to give one consistent function across all span classes. Existing code with `as.numeric()` does not need migration, but new code reads more clearly with `time_length()` since the function name says what it returns.

## Common pitfalls

**"month" on a Period or Duration uses an average month length.** `time_length(months(3), "day")` returns 91.31 because lubridate divides by an average-day-per-month constant. For the real day count in three specific months, anchor to a start date: `time_length(start %--% (start + months(3)), "day")` returns the actual count.

**The unit must be singular, not plural.** `time_length(gap, "days")` errors with `Invalid units`. lubridate accepts "second", "minute", "hour", "day", "week", "month", "year" only. Stick to the singular form, lowercase, in quotes.

**Negative spans return negative numbers silently.** Reverse the Interval bounds (`later %--% earlier`) and `time_length()` returns a negative double rather than its absolute value. Use `abs(time_length(...))` or wrap the input with `int_standardize()` when direction does not matter.

## Try it yourself

**Try it:** Build an Interval from `ymd("2020-03-15")` to `ymd("2026-05-15")` and store it in `ex_span`. Then compute the length in whole years and store the integer result in `ex_years`.

```r title="Your turn: span length in whole years"
# Try it: compute length in years
ex_span <- # your code here
ex_years <- # your code here

ex_span
ex_years
#> Expected: ex_span prints "2020-03-15 UTC--2026-05-15 UTC", ex_years is 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_span <- ymd("2020-03-15") %--% ymd("2026-05-15")
ex_years <- floor(time_length(ex_span, "year"))

ex_span
#> [1] 2020-03-15 UTC--2026-05-15 UTC
ex_years
#> [1] 6
```

**Explanation:** `%--%` builds the Interval. `time_length(ex_span, "year")` returns 6.166... and `floor()` strips the fractional part to give the whole-year count, the same pattern used for age calculations.

</details>

## Related lubridate functions

- `interval()` and the `%--%` infix build the Interval objects that `time_length()` measures (see [lubridate interval() in R](lubridate-interval-in-R.html)).
- `period()` builds calendar-unit spans without anchors (see [lubridate period() in R](lubridate-period-in-R.html)).
- `duration()` builds exact-second spans (see [lubridate duration() in R](lubridate-duration-in-R.html)).
- `int_length()` returns the length of an Interval in seconds only, slightly faster than `time_length(..., "second")`.
- `as.duration()`, `as.period()`, `as.numeric()` convert between span representations and plain numbers.

For the full lubridate reference, see the [tidyverse time_length() documentation](https://lubridate.tidyverse.org/reference/time_length.html).

## FAQ

**What does time_length() return in lubridate?**

`time_length()` returns a numeric (`double`) representing the count of a named unit inside the span. The unit defaults to "second" and accepts "minute", "hour", "day", "week", "month", or "year". The result is fractional when the unit does not divide evenly, so months and years often come back as 3.16, 1.083, and similar values. Wrap the call in `floor()`, `round()`, or `as.integer()` when you need a whole number.

**How do I calculate age in years using lubridate?**

Build an Interval from the date of birth to today, then call `time_length()` with `"year"` and floor the result: `floor(time_length(dob %--% today(), "year"))`. The Interval input makes the calculation calendar-aware, so leap years count correctly and a person born on February 29 in a leap year increments their age on March 1 in non-leap years. The pattern works on vectors, so the same line handles a column of birth dates.

**What is the difference between time_length() and int_length()?**

`int_length()` only accepts an Interval and only returns seconds. `time_length()` accepts an Interval, Period, Duration, or difftime and returns the result in any of 7 named units. They agree on `time_length(gap, "second")` equals `int_length(gap)`, but `time_length()` covers every span class lubridate exposes. New code should prefer `time_length()` for the wider input surface; `int_length()` remains useful when you specifically have an Interval and only need seconds.

**Can time_length() return negative values?**

Yes. If you build the span with the later timestamp first (`later %--% earlier`), `time_length()` returns a negative number. The sign tells you the direction of the span, which is useful when comparing a column of events to a reference date and you want to know which fell before. Wrap the result with `abs()` when the direction is irrelevant, or call `int_standardize()` on the Interval to flip negative spans back to positive before measuring.

**Why does time_length() give different answers for an Interval and a Period of the same nominal length?**

An Interval stores a real start and end, so `time_length(interval(ymd("2024-01-31"), ymd("2024-02-29")), "day")` returns 29. A Period stores `months(1)` as an abstract unit and converts to days using an average (about 30.44), so `time_length(months(1), "day")` returns 30.44. The Interval answer uses actual calendar days; the Period answer uses a constant. Choose by whether your downstream calculation needs calendar truth or a single typical value.
