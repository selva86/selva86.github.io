---
title: "lubridate Tutorial: Parse, Extract & Compute Dates & Times in R"
slug: "lubridate-Tutorial"
description: "Master lubridate for dates in R: parse with ymd/mdy, extract year/month/day, compute intervals and durations, handle timezones. 15 examples."
keywords: "lubridate tutorial, R dates, ymd, mdy, date parsing R, date arithmetic R, timezone R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.11"
post_type: "C"
sidebar_text: "lubridate Tutorial"
curriculum_path: "/data-wrangling/strings-dates/"
auto_link_terms: "lubridate|date parsing|ymd|mdy|date arithmetic"
auto_link_case_sensitive: false
---

# lubridate Tutorial: Parse, Extract & Compute Dates & Times in R

<p class="lead"><code>lubridate</code> makes date-time handling in R painless. Parse any date format with <code>ymd()</code>/<code>mdy()</code>, extract components, compute intervals, and handle timezones — all without memorizing strptime codes.</p>

## Parsing Dates

```r
library(lubridate)

# lubridate guesses the format from the function name
ymd("2026-03-30")
mdy("03/30/2026")
dmy("30-March-2026")

# With times
ymd_hms("2026-03-30 14:30:00")
mdy_hm("03/30/2026 2:30 PM")
```

```r
library(lubridate)

# Parse a vector of dates
dates <- c("2026-01-15", "2026-02-20", "2026-03-30")
parsed <- ymd(dates)
cat("Class:", class(parsed), "\n")
print(parsed)
```

## Extracting Components

```r
library(lubridate)

dt <- ymd_hms("2026-03-30 14:30:45")

cat("Year:  ", year(dt), "\n")
cat("Month: ", month(dt), "\n")
cat("Day:   ", day(dt), "\n")
cat("Hour:  ", hour(dt), "\n")
cat("Minute:", minute(dt), "\n")
cat("Weekday:", wday(dt, label = TRUE), "\n")
cat("Day of year:", yday(dt), "\n")
cat("Quarter:", quarter(dt), "\n")
```

## Date Arithmetic

```r
library(lubridate)

today <- ymd("2026-03-30")

# Add/subtract days, months, years
cat("Tomorrow:", as.character(today + days(1)), "\n")
cat("Next week:", as.character(today + weeks(1)), "\n")
cat("Next month:", as.character(today + months(1)), "\n")
cat("Next year:", as.character(today + years(1)), "\n")
```

```r
library(lubridate)

# Difference between dates
start <- ymd("2026-01-01")
end <- ymd("2026-03-30")

diff <- end - start
cat("Difference:", diff, "days\n")

# Using interval
cat("Months between:", interval(start, end) %/% months(1), "\n")
cat("Weeks between:", interval(start, end) %/% weeks(1), "\n")
```

## Durations vs Periods

```r
library(lubridate)

# Duration: exact seconds (physical time)
duration(60, "seconds")
ddays(1)   # Exactly 86400 seconds

# Period: human units (calendar time)
days(1)     # "1 day" — handles DST
months(1)   # "1 month" — handles varying month lengths

# The difference matters around DST changes
cat("Duration 1 day:", as.character(ymd("2026-03-08") + ddays(1)), "\n")
cat("Period 1 day:  ", as.character(ymd("2026-03-08") + days(1)), "\n")
```

## Floor, Ceiling, Round

```r
library(lubridate)

dt <- ymd_hms("2026-03-30 14:37:22")

cat("Floor (hour): ", as.character(floor_date(dt, "hour")), "\n")
cat("Ceiling (hour):", as.character(ceiling_date(dt, "hour")), "\n")
cat("Round (hour):  ", as.character(round_date(dt, "hour")), "\n")
cat("Floor (month): ", as.character(floor_date(dt, "month")), "\n")
```

## Real-World Examples

```r
library(lubridate)
library(dplyr)

# Create sample time series data
sales <- data.frame(
  date = ymd("2026-01-01") + days(0:89),
  revenue = round(runif(90, 100, 500), 0)
)

# Monthly summary
sales |>
  mutate(month = floor_date(date, "month")) |>
  group_by(month) |>
  summarise(total = sum(revenue), avg = round(mean(revenue)), .groups = "drop")
```

## Practice Exercises

### Exercise 1: Parse Mixed Formats

Parse these dates into proper Date objects.

```r
library(lubridate)

dates <- c("2026-03-30", "03/30/2026", "30-Mar-2026", "March 30, 2026")
# Parse each one

```

<details><summary>Click to reveal solution</summary>

```r
library(lubridate)
d1 <- ymd("2026-03-30")
d2 <- mdy("03/30/2026")
d3 <- dmy("30-Mar-2026")
d4 <- mdy("March 30, 2026")
cat("All equal:", all(c(d1,d2,d3,d4) == d1), "\n")
print(c(d1, d2, d3, d4))
```
</details>

### Exercise 2: Age Calculator

Calculate age in years from a birthdate.

```r
library(lubridate)
birthdate <- ymd("1995-06-15")
# Calculate age as of today (2026-03-30)

```

<details><summary>Click to reveal solution</summary>

```r
library(lubridate)
birthdate <- ymd("1995-06-15")
today <- ymd("2026-03-30")
age <- interval(birthdate, today) %/% years(1)
cat("Age:", age, "years\n")
```
</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `ymd()` | Parse YYYY-MM-DD | `ymd("2026-03-30")` |
| `mdy()` | Parse MM/DD/YYYY | `mdy("03/30/2026")` |
| `year()/month()/day()` | Extract component | `year(date)` |
| `wday(label=TRUE)` | Day of week | `wday(date, label=TRUE)` |
| `days()/months()/years()` | Period arithmetic | `date + months(3)` |
| `interval() %/% months(1)` | Months between dates | `interval(a, b) %/% months(1)` |
| `floor_date(unit)` | Round down | `floor_date(dt, "month")` |

## FAQ

### What's the difference between Date and POSIXct?

`Date` stores calendar dates only (no time). `POSIXct` stores date + time as seconds since 1970. Use `Date` when you don't need time; `POSIXct` when you do.

### Why does adding months(1) to Jan 31 give NA?

Because Feb 31 doesn't exist. Use `%m+%` for "rollback" behavior: `ymd("2026-01-31") %m+% months(1)` gives Feb 28.

## What's Next?

- [stringr Tutorial](/stringr-Tutorial.html) — clean date strings before parsing
- [R Regular Expressions](/R-Regular-Expressions.html) — extract dates from text
- [dplyr mutate & rename](/dplyr-mutate-rename.html) — use lubridate inside mutate
