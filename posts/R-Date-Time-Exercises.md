---
title: "R Date & Time Exercises: 10 lubridate Practice Problems with Solutions"
slug: "R-Date-Time-Exercises"
description: "10 interactive lubridate exercises — parse, extract components, arithmetic, intervals, time zones and formatting. Every problem runs in the browser."
keywords: "R date exercises, lubridate exercises, R time exercises, R date arithmetic, lubridate practice problems"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.8"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Date & Time (10 problems)"
auto_link_terms: "R date exercises|lubridate exercises|R time exercises"
auto_link_case_sensitive: false
fr_parent: "R-Syntax-101.html"
---

# R Date & Time Exercises: 10 lubridate Practice Problems with Solutions

<p class="lead">Ten hands-on exercises using the <code>lubridate</code> package — parse strings into real date objects, extract components, do arithmetic, compute durations, handle time zones, and format output. Every problem runs right in the browser.</p>

Date and time code is where silent bugs live. A string that *looks* like a date is not a date — and arithmetic on the wrong type gives wrong answers without any warning. These exercises cover the small set of lubridate verbs that remove almost all of that pain.

## Setup

```r
library(lubridate)

# A few sample values we'll reuse
dates_raw <- c("2026-01-15", "2026/02/28", "15-Mar-2026", "2026.04.01")
```

## Section 1 — Parsing

### Exercise 1. Parse ISO dates

Parse `"2026-04-11"` into a real `Date` object. Confirm with `class()`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
library(lubridate)

d <- ymd("2026-04-11")
d          # "2026-04-11"
class(d)   # "Date"
```

The `ymd()` family (`ymd`, `mdy`, `dmy`, `ymd_hms`, etc.) takes the format as part of the function name. This is clearer than passing a format string.

</details>

### Exercise 2. Parse mixed formats

Use the right function to parse each of `dates_raw` into a `Date`. Do not worry about ordering — treat each call separately.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
ymd("2026-01-15")
ymd("2026/02/28")
dmy("15-Mar-2026")
ymd("2026.04.01")
```

`ymd()` is flexible about separators (`-`, `/`, `.`, or none) — you only need to match the *order* of year/month/day. `dmy()` is needed when the day comes first.

</details>

### Exercise 3. Parse a date-time

Parse `"2026-04-11 14:30:00"` and confirm the result has class `POSIXct`. Report the hour.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
dt <- ymd_hms("2026-04-11 14:30:00")
dt           # "2026-04-11 14:30:00 UTC"
class(dt)    # "POSIXct" "POSIXt"
hour(dt)     # 14
```

`ymd_hms()` gives you a `POSIXct` timestamp. In lubridate, `POSIXct` defaults to UTC unless you pass `tz = `.

</details>

## Section 2 — Extracting components

### Exercise 4. Pull apart a date

Given `d <- ymd("2026-04-11")`, extract the year, month, day, and weekday (as a label).

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
d <- ymd("2026-04-11")

year(d)     # 2026
month(d)    # 4
day(d)      # 11
wday(d, label = TRUE)   # Sat (an ordered factor)
```

`wday(x, label = TRUE)` gives the abbreviated weekday as an ordered factor. Pass `abbr = FALSE` for the full label.

</details>

### Exercise 5. Change just the year

Create `d2` that is the same date as `d` from Exercise 4 but in the year 2027. Do it without re-parsing.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
d2 <- d
year(d2) <- 2027
d2          # "2027-04-11"
```

The extractor functions (`year()`, `month()`, `day()`, `hour()`, ...) can all be assigned into. This is the cleanest way to modify one component without touching the others.

</details>

## Section 3 — Arithmetic

### Exercise 6. Add days, months, years

Starting from `d <- ymd("2026-04-11")`, compute the date 7 days later, 1 month later, and 1 year later.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
d <- ymd("2026-04-11")

d + days(7)     # "2026-04-18"
d + months(1)   # "2026-05-11"
d + years(1)    # "2027-04-11"
```

`days()`, `months()`, `years()` are *periods* — they respect the calendar, so adding one month to January 31 gives February 28 or 29, not a fixed number of days.

</details>

### Exercise 7. Difference between two dates

Compute the number of days between `"2026-04-11"` and `"2026-12-31"`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
start <- ymd("2026-04-11")
end   <- ymd("2026-12-31")

as.numeric(end - start, units = "days")  # 264
# Or explicitly:
as.integer(difftime(end, start, units = "days"))  # 264
```

Subtracting two dates returns a `difftime` object. Convert to numeric (or integer) to get a plain count.

</details>

### Exercise 8. Intervals and overlap

Create two intervals and check whether they overlap:

- Interval A: 2026-01-01 to 2026-06-30
- Interval B: 2026-05-15 to 2026-12-31

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
A <- interval(ymd("2026-01-01"), ymd("2026-06-30"))
B <- interval(ymd("2026-05-15"), ymd("2026-12-31"))

int_overlaps(A, B)   # TRUE

intersect(A, B)
# 2026-05-15 UTC--2026-06-30 UTC
```

`interval()` creates a real interval object. `int_overlaps()` returns a logical, and `intersect()` returns the overlapping interval (or `NA` if there is none).

</details>

## Section 4 — Time zones and formatting

### Exercise 9. Convert time zone

Given `ymd_hms("2026-04-11 09:00:00", tz = "America/New_York")`, compute the same instant in `"Asia/Kolkata"`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
ny <- ymd_hms("2026-04-11 09:00:00", tz = "America/New_York")
ny
# "2026-04-11 09:00:00 EDT"

with_tz(ny, "Asia/Kolkata")
# "2026-04-11 18:30:00 IST"
```

`with_tz()` changes the displayed time zone *without* changing the absolute instant. If you want to change the instant (interpret the clock time in a new zone), use `force_tz()` instead. These do different things — pick deliberately.

</details>

### Exercise 10. Format a date for display

Format `d <- ymd("2026-04-11")` as `"Saturday, 11 April 2026"`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
d <- ymd("2026-04-11")

format(d, "%A, %d %B %Y")
# "Saturday, 11 April 2026"
```

The format codes come from base R's `strftime()`: `%A` full weekday, `%a` abbreviated, `%B` full month, `%b` abbreviated, `%d` day with leading zero, `%Y` four-digit year.

</details>

## Summary

- Parse with the `ymd` / `mdy` / `dmy` family — the function name encodes the order, so you never pass a format string.
- Extract and assign components with `year()`, `month()`, `day()`, `hour()`, `wday(x, label = TRUE)`.
- Use periods (`days()`, `months()`, `years()`) for calendar-aware arithmetic.
- Intervals support overlap and intersection with `int_overlaps()` and `intersect()`.
- Time zones: `with_tz()` changes the *display*, `force_tz()` changes the *instant*.
- Format for display with `format(x, "%A, %d %B %Y")`.

## References

- [lubridate reference](https://lubridate.tidyverse.org/reference/index.html)
- [R for Data Science (2e) — Dates and times](https://r4ds.hadley.nz/datetimes.html)
- [lubridate cheat sheet](https://rstudio.github.io/cheatsheets/lubridate.pdf)

## Continue Learning

- [R Syntax 101: Write Your First Working Script in 10 Minutes](R-Syntax-101.html)
- [R String Manipulation Exercises: 10 stringr Problems](R-String-Exercises.html)
- [R Functions Exercises: 10 Problems — Write, Debug & Optimize](R-Functions-Exercises.html)
