---
title: "R Date & Time Exercises: 10 lubridate Practice Problems with Solutions"
slug: "R-Date-Time-Exercises"
description: "Practice R date and time handling with 10 lubridate exercises: parsing, arithmetic, time zones, intervals, rounding. Interactive solutions you can run in-browser."
keywords: "R date exercises, lubridate exercises, R time exercises, R date arithmetic, parse dates R, R timezone practice"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E1.8"
post_type: "EX"
auto_link_terms: "lubridate exercises|R date exercises|R time exercises|date arithmetic exercises"
auto_link_case_sensitive: false
sidebar_title: "R Date & Time (10 problems)"
fr_parent: "R-Syntax-101.html"
---

# R Date & Time Exercises: 10 lubridate Practice Problems with Solutions

<p class="lead">Practice R's date and time handling with 10 progressively harder exercises built around the <code>lubridate</code> package. Each exercise has an interactive solution you can run directly in your browser.</p>

Dates look simple until you hit your first ambiguous format, your first daylight-saving boundary, or your first "why is my difference in hours?". These 10 exercises walk you through parsing, extraction, arithmetic, time zones, intervals, and rounding — in that order. The functions compose predictably once you see the pattern.

## Quick Reference: The lubridate Functions You Will Use

`lubridate` gives every operation a short, guessable name. Rather than memorising signatures, learn the five *categories* below — every exercise maps to one of them.

| Category    | Functions                                               | What they do                           |
|-------------|---------------------------------------------------------|----------------------------------------|
| Parse       | `ymd()`, `dmy()`, `mdy()`, `ymd_hms()`                  | Convert strings into Date or POSIXct   |
| Extract     | `year()`, `month()`, `day()`, `hour()`, `wday()`        | Pull components out of a date          |
| Construct   | `make_date()`, `make_datetime()`                        | Build a date from year/month/day parts |
| Arithmetic  | `days()`, `weeks()`, `months()`, `years()`, `%m+%`      | Add or subtract calendar amounts       |
| Time zones  | `with_tz()`, `force_tz()`, `tz()`                       | Change or inspect zones safely         |

A quick warm-up so the package feels loaded and live. We parse two messy strings and ask how many days apart they are.

```r
library(lubridate)

start <- ymd("2026-01-15")
end   <- dmy("12/04/2026")

as.integer(end - start)
#> [1] 87
```

The parse functions are named after the *order* the components appear in the string: `ymd()` expects year-month-day, `dmy()` expects day-month-year, and so on. Once both strings become `Date` objects, subtraction just works and returns a `difftime` you can coerce to an integer.

[KEY INSIGHT]
**lubridate does not change what dates are — it changes how you talk to them.** Under the hood you still have `Date` and `POSIXct` objects. The package just gives you verbs that read like English so you never again type `format(as.Date(x, "%m/%d/%Y"), "%Y")`.

## Easy (1-4): Parsing and Extracting Components

The first four exercises are about getting data *in* and pulling components *out*. No arithmetic yet — just conversion.

### Exercise 1: Parse Four Different Date Formats

You have four strings in four different formats. Parse each one into a `Date` and print them all side by side.

```r
# Exercise 1: parse these four strings
library(lubridate)

s1 <- "2026-03-14"
s2 <- "14/03/2026"
s3 <- "March 14, 2026"
s4 <- "20260314"

# Use the right lubridate parser for each one.

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)

s1 <- "2026-03-14"
s2 <- "14/03/2026"
s3 <- "March 14, 2026"
s4 <- "20260314"

c(ymd(s1), dmy(s2), mdy(s3), ymd(s4))
#> [1] "2026-03-14" "2026-03-14" "2026-03-14" "2026-03-14"
```

**Key concept:** The parser name always matches the component order in the string. `ymd()` handles both `"2026-03-14"` and `"20260314"` because it strips non-digits first. Letter months are handled automatically — you don't need a format string.

</details>

### Exercise 2: Extract Year, Month, Day-of-Week

Given a single `Date`, extract the year as an integer, the month name in English, and the weekday name. `month()` and `wday()` both take a `label = TRUE` argument to return text instead of a number.

```r
# Exercise 2: component extraction
library(lubridate)
d <- ymd("2026-07-04")

# 1. year as integer
# 2. month as English label ("July")
# 3. weekday as English label ("Saturday")

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
d <- ymd("2026-07-04")

year(d)
#> [1] 2026

month(d, label = TRUE, abbr = FALSE)
#> [1] July
#> 12 Levels: January < February < March < April < May < June < ... < December

wday(d, label = TRUE, abbr = FALSE)
#> [1] Saturday
#> Levels: Sunday < Monday < Tuesday < ... < Saturday
```

**Key concept:** Extractors like `year()`, `month()`, `day()`, `hour()`, `minute()`, and `second()` are pure accessors — they return the component for any date you feed them. The `label = TRUE` / `abbr = FALSE` pair is how you get full English names.

</details>

### Exercise 3: Parse a Timestamp with Time Zone

Parse a string that contains date *and* time, and print it both in the source UTC zone and in "America/New_York". `ymd_hms()` accepts a `tz` argument on the way in, and `with_tz()` converts an existing timestamp without changing the underlying instant.

```r
# Exercise 3: UTC -> Eastern
library(lubridate)

# 1. Parse "2026-12-25 14:30:00" as UTC.
# 2. Convert it to "America/New_York".

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)

utc_time <- ymd_hms("2026-12-25 14:30:00", tz = "UTC")
utc_time
#> [1] "2026-12-25 14:30:00 UTC"

ny_time <- with_tz(utc_time, tzone = "America/New_York")
ny_time
#> [1] "2026-12-25 09:30:00 EST"
```

**Key concept:** `with_tz()` never alters the underlying instant — it only changes how the time is displayed. Christmas 14:30 UTC is the same moment as 09:30 Eastern; they just read differently. Use `force_tz()` only when you are correcting a parser that applied the wrong zone in the first place.

</details>

### Exercise 4: Build a Date from Components

Given three integer vectors — years, months, and days — build a vector of `Date` objects using `make_date()`.

```r
# Exercise 4: build dates from parts
library(lubridate)

ys <- c(2024, 2025, 2026)
ms <- c( 1,    6,   12)
ds <- c(15,   30,   25)

# Use make_date() to return a length-3 Date vector.

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)

ys <- c(2024, 2025, 2026)
ms <- c( 1,    6,   12)
ds <- c(15,   30,   25)

make_date(year = ys, month = ms, day = ds)
#> [1] "2024-01-15" "2025-06-30" "2026-12-25"
```

**Key concept:** `make_date()` is vectorised, so you can build thousands of dates in one call. It is the inverse of `year()`, `month()`, `day()` — those three functions get components out, `make_date()` puts them back together.

</details>

**Try it:** Parse the string `"31 Dec 2026"` into a `Date`, then extract its quarter using `quarter()`.

```r
library(lubridate)
# your code here
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
ex_d <- dmy("31 Dec 2026")
quarter(ex_d)
#> [1] 4
```

**Explanation:** `dmy()` handles abbreviated month names out of the box. `quarter()` returns 1-4 for any date.

</details>

## Medium (5-7): Arithmetic, Durations, and Periods

These three exercises are where lubridate pays for itself: adding "one month" to a date is ambiguous, and lubridate has two different answers depending on what you mean.

### Exercise 5: Add a Week to Every Date in a Vector

Take a vector of three dates and shift each one forward by 7 days. Use `+ days(7)` so the arithmetic is explicit and readable.

```r
# Exercise 5: shift dates forward by one week
library(lubridate)
events <- ymd(c("2026-03-01", "2026-06-15", "2026-09-30"))

# Return a vector where each event has moved forward 7 days.

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
events <- ymd(c("2026-03-01", "2026-06-15", "2026-09-30"))
events + days(7)
#> [1] "2026-03-08" "2026-06-22" "2026-10-07"
```

**Key concept:** `days()`, `weeks()`, `months()`, and `years()` create period objects that you can add or subtract from any date. They respect the calendar — adding `days(7)` always advances by exactly seven calendar days, across DST boundaries and month ends.

</details>

### Exercise 6: Months Arithmetic With the Month-End Trap

Add one month to `2026-01-31`. What happens? Now add one month using `%m+%`. Compare the two results.

```r
# Exercise 6: what is January 31 + 1 month?
library(lubridate)
d <- ymd("2026-01-31")

# 1. d + months(1)
# 2. d %m+% months(1)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
d <- ymd("2026-01-31")

d + months(1)
#> [1] NA

d %m+% months(1)
#> [1] "2026-02-28"
```

**Key concept:** `d + months(1)` tries to return `2026-02-31`, which does not exist, so you get `NA`. `%m+%` (and its sibling `%m-%`) rolls back to the last valid day of the target month. Use `%m+%` any time you are doing month arithmetic on data that might include end-of-month dates.

</details>

[WARNING]
**months(1) silently returns NA on invalid dates.** If you use `+ months(1)` in a pipeline, a single January 31 will quietly become `NA` and leak into your next calculation. Default to `%m+%` for month arithmetic unless you have a reason not to.

### Exercise 7: Duration vs Period Across a DST Boundary

One of the most common bugs in R date code is confusing *durations* (exact seconds) with *periods* (calendar amounts). Use `dhours(24)` and `hours(24)` on a timestamp that straddles the US spring-forward boundary and compare.

```r
# Exercise 7: duration vs period across DST
library(lubridate)

t0 <- ymd_hms("2026-03-08 01:30:00", tz = "America/New_York")

# 1. Add dhours(24) (a duration — 24 * 3600 seconds)
# 2. Add hours(24)  (a period — 24 wall-clock hours)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
t0 <- ymd_hms("2026-03-08 01:30:00", tz = "America/New_York")

t0 + dhours(24)
#> [1] "2026-03-09 02:30:00 EDT"

t0 + hours(24)
#> [1] "2026-03-09 01:30:00 EDT"
```

**Key concept:** A duration adds literal elapsed seconds — 86,400 seconds after 01:30 Standard time is 02:30 Daylight time because the clock jumped forward. A period adds "24 wall-clock hours" and lands on 01:30 the next day regardless of DST. Pick based on what you actually mean: "how long did it run" → duration; "same time tomorrow" → period.

</details>

**Try it:** Starting from `ymd("2025-01-31")`, use `%m+%` to produce the last day of the next 6 consecutive months.

```r
library(lubridate)
# your code here
#> Expected: 6 dates, each the last day of Feb-Jul 2025
```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
ymd("2025-01-31") %m+% months(1:6)
#> [1] "2025-02-28" "2025-03-31" "2025-04-30" "2025-05-31" "2025-06-30" "2025-07-31"
```

**Explanation:** `months(1:6)` is a vectorised period, so `%m+%` produces one shifted date per element, each rolled back to the last valid day.

</details>

## Hard (8-10): Intervals, Rounding, and Grouping

The last three exercises cover the tools you reach for in real analysis code: testing whether a date falls inside a range, snapping timestamps to boundaries, and grouping rows by time windows.

### Exercise 8: Test Whether Dates Fall Inside an Interval

An interval is a pair of timestamps treated as a half-open range. Build an interval for Q1 2026 and test which of five dates fall inside it using `%within%`.

```r
# Exercise 8: which dates are inside Q1 2026?
library(lubridate)

q1 <- interval(ymd("2026-01-01"), ymd("2026-03-31"))
dates <- ymd(c("2025-12-31", "2026-01-15", "2026-03-30",
               "2026-04-01", "2026-02-28"))

# Return a logical vector of length 5.

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)

q1 <- interval(ymd("2026-01-01"), ymd("2026-03-31"))
dates <- ymd(c("2025-12-31", "2026-01-15", "2026-03-30",
               "2026-04-01", "2026-02-28"))

dates %within% q1
#> [1] FALSE  TRUE  TRUE FALSE  TRUE
```

**Key concept:** `%within%` is vectorised on its left-hand side, so you can check a whole vector of dates against one interval in a single call. An interval is inclusive on both ends.

</details>

### Exercise 9: Round Timestamps to the Hour and Floor to the Day

Given a vector of messy timestamps, use `round_date()` to snap each to the nearest hour and `floor_date()` to snap each to the start of its day.

```r
# Exercise 9: round and floor
library(lubridate)

logs <- ymd_hms(c("2026-04-12 08:29:33",
                  "2026-04-12 08:31:05",
                  "2026-04-12 23:59:59"))

# 1. Nearest hour
# 2. Start of day

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)

logs <- ymd_hms(c("2026-04-12 08:29:33",
                  "2026-04-12 08:31:05",
                  "2026-04-12 23:59:59"))

round_date(logs, unit = "hour")
#> [1] "2026-04-12 08:00:00 UTC" "2026-04-12 09:00:00 UTC" "2026-04-13 00:00:00 UTC"

floor_date(logs, unit = "day")
#> [1] "2026-04-12 UTC" "2026-04-12 UTC" "2026-04-12 UTC"
```

**Key concept:** `round_date()` uses banker's rounding at the mid-point, `floor_date()` always goes down, and `ceiling_date()` always goes up. The `unit` argument accepts `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, `"year"`, or multiples like `"15 minutes"`.

</details>

### Exercise 10: Group Rows by ISO Week

You have 15 daily observations and want the sum *per ISO week*. Combine `floor_date()` with a `tapply()` call.

```r
# Exercise 10: weekly totals
library(lubridate)

set.seed(7)
obs <- data.frame(
  date  = ymd("2026-01-01") + days(0:14),
  value = sample(1:100, 15)
)

# Compute total value per ISO week.

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)

set.seed(7)
obs <- data.frame(
  date  = ymd("2026-01-01") + days(0:14),
  value = sample(1:100, 15)
)

obs$week <- floor_date(obs$date, unit = "week", week_start = 1)
tapply(obs$value, obs$week, sum)
```

**Key concept:** `floor_date(..., unit = "week", week_start = 1)` snaps every date to the preceding Monday — an ISO week. Once every date has become the same label within each week, any grouping tool (`tapply()`, `aggregate()`, dplyr `group_by`) can do the sum.

</details>

**Try it:** Using the same `obs` data, compute the *count* of days in each ISO week.

```r
# your code here
#> Expected: week -> day count
```

<details>
<summary>Click to reveal solution</summary>

```r
library(lubridate)
tapply(obs$value, obs$week, length)
```

**Explanation:** `tapply()` with `length` counts rows per group. The counts depend on which weekday `2026-01-01` falls on.

</details>

## Summary

| Exercise | Function             | One-line rule                                             |
|----------|----------------------|-----------------------------------------------------------|
| 1        | `ymd` / `dmy` / `mdy`| Name the parser after the string's component order.      |
| 2        | `year` / `month` / `wday` | Extractors are pure accessors — pass `label = TRUE` for text. |
| 3        | `with_tz`            | Changes display, not the underlying instant.              |
| 4        | `make_date`          | Build a date vector from year/month/day integer vectors.  |
| 5        | `days()`             | `date + days(n)` is the safest way to shift by n days.    |
| 6        | `%m+%`               | Month arithmetic on end-of-month dates needs `%m+%`.      |
| 7        | `dhours` vs `hours`  | Duration = exact seconds; period = calendar wall-clock.   |
| 8        | `%within%`           | Test membership in an interval.                           |
| 9        | `round_date`, `floor_date` | Snap timestamps to a unit boundary.                  |
| 10       | `floor_date` + group | Any weekly/monthly aggregation = floor then group.        |

## References

1. Grolemund, G. and Wickham, H. — *Dates and Times Made Easy with lubridate*, Journal of Statistical Software. [Link](https://www.jstatsoft.org/article/view/v040i03)
2. lubridate package documentation. [Link](https://lubridate.tidyverse.org/)
3. Wickham, H. & Grolemund, G. — *R for Data Science*, Chapter 17: Dates and Times. [Link](https://r4ds.hadley.nz/datetimes.html)
4. R Core Team — `?DateTimeClasses` — base R Date and POSIXct reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html)
5. IANA Time Zone Database — canonical zone names used by `with_tz()`. [Link](https://www.iana.org/time-zones)

## Continue Learning

- [R Syntax 101](R-Syntax-101.html) — the assignment, pipe, and function syntax every exercise in this list relies on.
- [R String Exercises](R-String-Exercises.html) — practice parsing and formatting the text you will later feed into the date parsers.
- [R Control Flow Exercises](R-Control-Flow-Exercises.html) — loops and conditionals for when date arithmetic alone is not enough.
