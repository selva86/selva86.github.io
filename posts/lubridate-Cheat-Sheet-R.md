---
title: "lubridate Cheat Sheet: Parse, Extract, Modify, and Do Arithmetic on Dates"
slug: "lubridate-Cheat-Sheet-R"
description: "Complete lubridate reference: parsing with ymd/dmy/mdy, extracting with year/month/wday, arithmetic with durations, periods, and intervals, plus time zones."
keywords: "lubridate cheat sheet, lubridate R, R date cheat sheet, ymd() dmy() mdy(), R date parsing, R date arithmetic, lubridate duration period interval, R time zones, lubridate reference"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "CHT7"
post_type: "FR"
auto_link_terms: "lubridate cheat sheet|lubridate reference|R date cheat sheet|R date time reference|lubridate functions"
auto_link_case_sensitive: false
fr_parent: "lubridate-in-R.html"
---


# lubridate Cheat Sheet: Parse, Extract, Modify, and Do Arithmetic on Dates

<p class="lead">A quick-reference table for every parsing, extracting, rounding, arithmetic, and time-zone function in the lubridate package, with runnable R examples.</p>

## Introduction

You know lubridate can handle your date problem. But which function was it again? `ymd()` or `mdy()`? `duration()` or `period()`? This page answers that in under 10 seconds.

This cheat sheet covers every major lubridate function organized into six categories: parsing, extracting, rounding, arithmetic (durations, periods, intervals), and time zones. Each category has a reference table plus a runnable code block so you can see the function in action. For full explanations of each concept, see the [lubridate tutorial](lubridate-in-R.html).

Let's load lubridate and create the sample dates used throughout.

```r
# Load lubridate and create sample dates
library(lubridate)

sample_date <- ymd("2026-04-06")
sample_datetime <- ymd_hms("2026-04-06 14:30:45")

print(sample_date)
#> [1] "2026-04-06"
print(sample_datetime)
#> [1] "2026-04-06 14:30:45 UTC"
```

The `sample_date` and `sample_datetime` objects appear in the examples below. Every code block runs in the same session, so these variables carry forward.

## How Do You Parse Dates and Times from Strings?

lubridate's parsing functions are named after the order of date components. Year-month-day? Use `ymd()`. Day-month-year? Use `dmy()`. The function auto-detects separators.

**Date parsing functions:**

| Function | Input Order | Example Input | Result |
|---|---|---|---|
| `ymd()` | Year-Month-Day | "2026-04-06" | 2026-04-06 |
| `mdy()` | Month-Day-Year | "April 6, 2026" | 2026-04-06 |
| `dmy()` | Day-Month-Year | "06/04/2026" | 2026-04-06 |
| `ydm()` | Year-Day-Month | "2026-06-04" | 2026-04-06 |
| `myd()` | Month-Year-Day | "04.2026.06" | 2026-04-06 |
| `dym()` | Day-Year-Month | "06.2026.04" | 2026-04-06 |
| `yq()` | Year-Quarter | "2026 Q2" | 2026-04-01 |
| `my()` | Month-Year | "Apr 2026" | 2026-04-01 |
| `ym()` | Year-Month | "2026-04" | 2026-04-01 |

**Date-time parsing functions:**

| Function | Input Order | Example Input |
|---|---|---|
| `ymd_hms()` | Y-M-D H:M:S | "2026-04-06 14:30:45" |
| `ymd_hm()` | Y-M-D H:M | "2026-04-06 14:30" |
| `ymd_h()` | Y-M-D H | "2026-04-06 14" |
| `mdy_hms()` | M-D-Y H:M:S | "04/06/2026 14:30:45" |
| `dmy_hms()` | D-M-Y H:M:S | "06-04-2026 14:30:45" |

**Other parsing functions:**

| Function | Purpose | Example |
|---|---|---|
| `parse_date_time()` | Parse with custom order string | `parse_date_time("06-04-26", "dmy")` |
| `fast_strptime()` | Fast parsing with format codes | `fast_strptime("2026-04-06", "%Y-%m-%d")` |
| `date_decimal()` | Decimal year to date | `date_decimal(2026.25)` |
| `now()` | Current date-time | `now("UTC")` |
| `today()` | Current date | `today()` |

Let's try several parsing functions with different input formats.

```r
# Standard date orders
d1 <- ymd("2026-04-06")
d2 <- mdy("April 6, 2026")
d3 <- dmy("06/04/2026")

# Date-time parsing
d4 <- ymd_hms("2026-04-06 14:30:45")
d5 <- mdy_hm("04/06/2026 14:30")

# Year-quarter and month-year
d6 <- yq("2026.2")
d7 <- my("Apr 2026")

# Flexible parser with custom order
d8 <- parse_date_time("06-04-26", orders = "dmy")

cat("ymd:", as.character(d1), "\n")
#> ymd: 2026-04-06
cat("mdy:", as.character(d2), "\n")
#> mdy: 2026-04-06
cat("dmy:", as.character(d3), "\n")
#> dmy: 2026-04-06
cat("ymd_hms:", as.character(d4), "\n")
#> ymd_hms: 2026-04-06 14:30:45
cat("yq:", as.character(d6), "\n")
#> yq: 2026-04-01
cat("parse_date_time:", as.character(d8), "\n")
#> parse_date_time: 2026-04-06
```

All six date-only parsers produce the same `2026-04-06` from different input formats. The `yq()` call returns the first day of Q2. The `parse_date_time()` function accepts an `orders` argument when two-digit years or unusual formats need explicit guidance.

[TIP]
**lubridate ignores separators automatically.** Dashes, slashes, spaces, dots, and even no separator ("20260406") all work. Pick the function that matches the component order and let lubridate handle the rest.

## How Do You Extract and Modify Date Components?

Every accessor function in lubridate works in two directions. Call it to extract a component. Assign to it to modify that component.

**Accessor/setter functions:**

| Function | Returns | Example Output |
|---|---|---|
| `year()` | Year as integer | 2026 |
| `month()` | Month (1-12) | 4 |
| `month(x, label=TRUE)` | Month name | Apr |
| `day()` / `mday()` | Day of month | 6 |
| `wday()` | Day of week (1=Sun) | 2 |
| `wday(x, label=TRUE)` | Weekday name | Mon |
| `yday()` | Day of year | 96 |
| `qday()` | Day of quarter | 6 |
| `hour()` | Hour (0-23) | 14 |
| `minute()` | Minute (0-59) | 30 |
| `second()` | Second (0-59) | 45 |
| `week()` | Week of year | 14 |
| `isoweek()` | ISO week number | 15 |
| `quarter()` | Quarter (1-4) | 2 |
| `semester()` | Semester (1-2) | 1 |
| `tz()` | Time zone string | "UTC" |
| `dst()` | Daylight saving? | FALSE |
| `leap_year()` | Leap year? | FALSE |
| `am()` / `pm()` | Before/after noon? | FALSE / TRUE |
| `isoyear()` | ISO year | 2026 |
| `epiyear()` | Epidemiological year | 2026 |
| `epiweek()` | Epidemiological week | 15 |
| `date()` | Date part only | 2026-04-06 |

Let's extract several components from our sample date-time.

```r
# Extract components
year(sample_datetime)
#> [1] 2026
month(sample_datetime)
#> [1] 4
month(sample_datetime, label = TRUE)
#> [1] Apr
wday(sample_datetime, label = TRUE, abbr = FALSE)
#> [1] Monday
yday(sample_datetime)
#> [1] 96
quarter(sample_datetime)
#> [1] 2
leap_year(sample_date)
#> [1] FALSE
am(sample_datetime)
#> [1] FALSE
```

April 6, 2026 is a Monday, the 96th day of the year, in Q2, and not a leap year. The `label = TRUE` argument returns human-readable names instead of numbers.

[KEY INSIGHT]
**Accessor functions double as setters.** Write `year(x) <- 2030` to change the year in place. This works for every accessor: `month()`, `day()`, `hour()`, and so on.

Let's modify components using the setter syntax.

```r
# Modify components by assigning
modified_date <- sample_date
year(modified_date) <- 2030
month(modified_date) <- 12
day(modified_date) <- 25
print(modified_date)
#> [1] "2030-12-25"

# update() changes multiple components at once
updated <- update(sample_datetime, year = 2025, month = 1, hour = 9)
print(updated)
#> [1] "2025-01-06 09:30:45 UTC"
```

The setter approach modifies the object in place. The `update()` function changes multiple components in a single call, which is cleaner when you need to adjust several fields at once.

## How Do You Round Dates to a Time Unit?

Rounding functions snap a date-time to the nearest boundary of a time unit. They are essential for aggregating timestamps into buckets.

| Function | Direction | Example (unit = "hour") |
|---|---|---|
| `floor_date()` | Round down | 14:30:45 becomes 14:00:00 |
| `round_date()` | Round to nearest | 14:30:45 becomes 15:00:00 |
| `ceiling_date()` | Round up | 14:30:45 becomes 15:00:00 |
| `rollback()` | Last day of previous month | Apr 6 becomes Mar 31 |
| `rollforward()` | First day of next month | Apr 6 becomes May 01 |

**Supported unit strings:** "second", "minute", "hour", "day", "week", "month", "bimonth", "quarter", "halfyear", "year".

Let's round our sample datetime to several units.

```r
# Round to different units
floor_date(sample_datetime, "hour")
#> [1] "2026-04-06 14:00:00 UTC"
round_date(sample_datetime, "hour")
#> [1] "2026-04-06 15:00:00 UTC"
ceiling_date(sample_datetime, "month")
#> [1] "2026-05-01 UTC"
floor_date(sample_datetime, "week")
#> [1] "2026-04-05 UTC"

# rollback and rollforward
rollback(sample_date)
#> [1] "2026-03-31"
rollforward(sample_date)
#> [1] "2026-05-01"
```

The `floor_date()` call with `"hour"` drops the minutes and seconds. The `round_date()` call rounds 14:30:45 up to 15:00 because 30 minutes is past the midpoint. The `floor_date()` with `"week"` snaps back to Sunday (the default week start).

[TIP]
**Use floor_date() for time-based aggregation.** To count events per week, add a column with `floor_date(timestamp, "week")` and then group by it. This is faster and cleaner than manual date math.

## How Do Durations, Periods, and Intervals Differ?

lubridate provides three classes for representing time spans. Each behaves differently with daylight saving time and calendar irregularities.

| Feature | Duration | Period | Interval |
|---|---|---|---|
| **Definition** | Exact number of seconds | Calendar units (months, days) | Span between two specific instants |
| **DST behavior** | Ignores DST (fixed seconds) | Respects calendar (1 day = midnight to midnight) | Exact elapsed seconds between endpoints |
| **Constructor** | `dseconds()`, `dminutes()`, etc. | `seconds()`, `minutes()`, etc. | `interval()` or `%--%` |
| **Use case** | Physical time (e.g., 3600s = 1 hour always) | Human time (e.g., "1 month from now") | Measuring elapsed time between events |

**Duration constructors:**

| Function | Creates |
|---|---|
| `dseconds(x)` | x seconds duration |
| `dminutes(x)` | x * 60 seconds |
| `dhours(x)` | x * 3600 seconds |
| `ddays(x)` | x * 86400 seconds |
| `dweeks(x)` | x * 604800 seconds |
| `dyears(x)` | x * 31557600 seconds (365.25 days) |
| `duration(num, units)` | Flexible constructor |
| `as.duration()` | Convert to duration |
| `is.duration()` | Test if duration |

**Period constructors:**

| Function | Creates |
|---|---|
| `seconds(x)` | x seconds period |
| `minutes(x)` | x minutes period |
| `hours(x)` | x hours period |
| `days(x)` | x days period |
| `weeks(x)` | x weeks period |
| `months(x)` | x months period |
| `years(x)` | x years period |
| `period(num, units)` | Flexible constructor |
| `as.period()` | Convert to period |
| `is.period()` | Test if period |
| `period_to_seconds()` | Period to seconds count |
| `seconds_to_period()` | Seconds to human-readable period |

**Interval functions:**

| Function | Purpose |
|---|---|
| `interval(start, end)` | Create interval between two dates |
| `start %--% end` | Shorthand for `interval()` |
| `int_start()` | Get start instant |
| `int_end()` | Get end instant |
| `int_length()` | Length in seconds |
| `int_flip()` | Reverse direction |
| `int_shift()` | Shift by a duration |
| `int_overlaps()` | Do two intervals overlap? |
| `int_aligns()` | Do they share an endpoint? |
| `int_diff()` | Intervals between sorted dates |
| `x %within% interval` | Is instant inside interval? |
| `as.interval()` | Convert to interval |
| `is.interval()` | Test if interval |

Let's create all three types and compare them.

```r
# Duration: exact seconds
dur <- ddays(30)
print(dur)
#> [1] "2592000s (~4.29 weeks)"

# Period: calendar units
per <- months(1)
print(per)
#> [1] "1m 0d 0H 0M 0S"

# Interval: between two specific dates
start <- ymd("2026-01-01")
end <- ymd("2026-04-06")
intv <- start %--% end
print(intv)
#> [1] 2026-01-01 UTC--2026-04-06 UTC

# Interval length in different units
int_length(intv)
#> [1] 8208000
as.period(intv, unit = "month")
#> [1] "3m 5d 0H 0M 0S"

# Check membership
ymd("2026-02-15") %within% intv
#> [1] TRUE
```

The duration is stored as exactly 2,592,000 seconds (30 * 86,400). The period records "1 month" without converting to seconds. The interval spans from Jan 1 to Apr 6 and can tell you that Feb 15 falls inside it. Converting the interval to a period gives "3 months and 5 days".

[WARNING]
**Durations ignore daylight saving time.** Adding `ddays(1)` always adds 86,400 seconds. On a DST spring-forward day, that lands you at 1:00 AM instead of midnight. Use `days(1)` (period) when you want "same clock time tomorrow".

## How Do You Do Date Arithmetic?

Add or subtract durations and periods from dates with `+` and `-`. For month arithmetic that might overflow (e.g., Jan 31 + 1 month), use the special `%m+%` and `%m-%` operators.

**Arithmetic operations:**

| Operation | Syntax | Behavior |
|---|---|---|
| Add period | `date + months(1)` | Calendar-aware (respects month lengths) |
| Subtract period | `date - years(2)` | Calendar-aware |
| Add duration | `date + ddays(30)` | Exact seconds |
| Month-safe add | `date %m+% months(1)` | Rolls back to last valid day if overflow |
| Month-safe subtract | `date %m-% months(1)` | Rolls back to last valid day if overflow |
| Rollback add | `add_with_rollback(date, months(1))` | Same as %m+% with more options |
| Time between | `interval(a, b) / years(1)` | Fractional years between dates |
| Difference | `difftime(a, b, units = "days")` | Base R, works with lubridate dates |

Let's try several arithmetic operations.

```r
# Add and subtract periods
sample_date + months(3)
#> [1] "2026-07-06"
sample_date - years(1)
#> [1] "2025-04-06"
sample_date + days(10) + hours(5)
#> [1] "2026-04-16 05:00:00 UTC"

# Month overflow problem
jan31 <- ymd("2026-01-31")
jan31 + months(1)
#> [1] NA

# Safe month arithmetic with %m+%
jan31 %m+% months(1)
#> [1] "2026-02-28"

# Compute age in years
birth <- ymd("1990-06-15")
age <- interval(birth, today()) / years(1)
floor(age)
#> [1] 35

# Weeks between two dates
intv2 <- interval(ymd("2026-01-01"), sample_date)
intv2 / weeks(1)
#> [1] 13.57143
```

Adding `months(1)` to January 31 returns NA because February 31 does not exist. The `%m+%` operator handles this by rolling back to the last valid day (Feb 28). To compute age, divide an interval by `years(1)` to get fractional years, then floor it.

[KEY INSIGHT]
**Use %m+% and %m-% for month arithmetic on end-of-month dates.** Standard `+ months(1)` returns NA when the target month has fewer days. The month-safe operators roll back automatically.

## How Do You Handle Time Zones?

lubridate distinguishes between changing the display (clock on the wall) and changing the instant (point on the timeline).

| Function | What It Does | Clock Changes? | Instant Changes? |
|---|---|---|---|
| `with_tz(x, tz)` | Show same instant in new zone | Yes | No |
| `force_tz(x, tz)` | Stamp new zone on same clock reading | No | Yes |
| `OlsonNames()` | List all valid time zone names | — | — |
| `Sys.timezone()` | Your system's time zone | — | — |
| `tz(x)` | Get time zone of a date-time | — | — |

Let's convert and force time zones.

```r
# Create a UTC time
utc_time <- ymd_hms("2026-04-06 14:30:00", tz = "UTC")

# with_tz: same instant, different clock
ny_time <- with_tz(utc_time, "America/New_York")
print(ny_time)
#> [1] "2026-04-06 10:30:00 EDT"

# force_tz: same clock, different instant
forced <- force_tz(utc_time, "America/New_York")
print(forced)
#> [1] "2026-04-06 14:30:00 EDT"

# Check: with_tz preserves the instant
utc_time == ny_time
#> [1] TRUE

# force_tz creates a different instant
utc_time == forced
#> [1] FALSE

# List some time zones
head(OlsonNames(), 10)
#> [1] "Africa/Abidjan"     "Africa/Accra"       "Africa/Addis_Ababa"
#> [4] "Africa/Algiers"     "Africa/Bangui"      "Africa/Banjul"
#> [7] "Africa/Bissau"      "Africa/Blantyre"    "Africa/Brazzaville"
#> [10] "Africa/Bujumbura"
```

The `with_tz()` call changed the display from 14:30 UTC to 10:30 EDT, but the underlying instant is identical (the `==` test is TRUE). The `force_tz()` call kept the clock reading as 14:30 but stamped it as EDT, creating a different instant (the `==` test is FALSE). Use `with_tz()` when converting for display. Use `force_tz()` when your data was recorded without a time zone and you need to assign one.

[WARNING]
**force_tz() changes the instant on the timeline.** If your timestamp was already correct and you just want to see it in another city's clock, use `with_tz()`. Using `force_tz()` by mistake shifts the actual time by the UTC offset difference.

## Common Mistakes and How to Fix Them

### Mistake 1: Using force_tz() when you mean with_tz()

This is the most common lubridate time-zone bug. It shifts the actual moment in time instead of just changing the display.

**Why it is wrong:** `force_tz()` rewrites the instant. If your UTC timestamp is correct and you "force" it to EST, you lose 5 hours of real time.

```r
# Wrong: force_tz changes the instant
correct_utc <- ymd_hms("2026-04-06 18:00:00", tz = "UTC")
wrong <- force_tz(correct_utc, "America/New_York")
as.numeric(correct_utc - wrong)
#> [1] 14400
```

The difference is 14,400 seconds (4 hours, EDT offset). The instant shifted.

```r
# Correct: with_tz preserves the instant
right <- with_tz(correct_utc, "America/New_York")
print(right)
#> [1] "2026-04-06 14:00:00 EDT"
correct_utc == right
#> [1] TRUE
```

### Mistake 2: Adding months() to month-end dates without %m+%

Adding `months(1)` to January 31 returns NA because February 31 does not exist. This silently poisons downstream calculations.

```r
# Wrong: NA from invalid date
jan31 <- ymd("2026-01-31")
jan31 + months(1)
#> [1] NA
```

**Why it is wrong:** lubridate cannot create Feb 31, so it returns NA. Any arithmetic on NA propagates the problem.

```r
# Correct: %m+% rolls back to last valid day
jan31 %m+% months(1)
#> [1] "2026-02-28"
```

### Mistake 3: Comparing durations and periods as if they were equal

A duration of 365 days and a period of 1 year are not the same object. Comparing them directly can mislead.

```r
# These look similar but represent different things
dur_year <- dyears(1)
per_year <- years(1)

# Duration is exactly 365.25 * 86400 seconds
print(dur_year)
#> [1] "31557600s (~1 years)"

# Period is "1 year" in calendar terms
print(per_year)
#> [1] "1y 0m 0d 0H 0M 0S"

# Adding to a date gives different results in leap years
leap_date <- ymd("2024-01-01")
leap_date + dur_year
#> [1] "2024-12-31 06:00:00 UTC"
leap_date + per_year
#> [1] "2025-01-01"
```

**Why it matters:** In the 2024 leap year, `dyears(1)` adds 365.25 days (landing on Dec 31 at 6 AM), while `years(1)` adds exactly one calendar year (landing on Jan 1, 2025). Use periods for calendar-aware math and durations for physical time.

## Practice Exercises

### Exercise 1: Parse and extract weekday names

Given three date strings in different formats, parse each one and extract the full weekday name.

```r
# Exercise: parse these dates and print their weekday names
# Hint: use the right ymd/mdy/dmy function, then wday(x, label=TRUE, abbr=FALSE)

date_a <- "March 15, 2026"
date_b <- "15-03-2026"
date_c <- "2026/03/15"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
parsed_a <- mdy(date_a)
parsed_b <- dmy(date_b)
parsed_c <- ymd(date_c)

wday(parsed_a, label = TRUE, abbr = FALSE)
#> [1] Sunday
wday(parsed_b, label = TRUE, abbr = FALSE)
#> [1] Sunday
wday(parsed_c, label = TRUE, abbr = FALSE)
#> [1] Sunday
```

**Explanation:** All three strings represent the same date (March 15, 2026), so they all return Sunday. The key is matching the function name to the component order of the input.

</details>

### Exercise 2: Compute weeks between two dates using an interval

Create an interval from January 1, 2026 to today. Compute the number of whole weeks in that interval.

```r
# Exercise: compute whole weeks between Jan 1 2026 and today
# Hint: create an interval with %--%, divide by weeks(1), then floor()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_interval <- ymd("2026-01-01") %--% today()
my_weeks <- my_interval / weeks(1)
floor(my_weeks)
#> [1] 13
```

**Explanation:** The `%--%` operator creates an interval. Dividing by `weeks(1)` converts it to fractional weeks. The `floor()` call gives whole weeks. The exact number depends on today's date.

</details>

### Exercise 3: Round timestamps and count events per hour

Given a vector of timestamps, round each down to the nearest hour and count how many events fall in each hour.

```r
# Exercise: round timestamps and count per hour
# Hint: use floor_date(x, "hour") then table()

my_timestamps <- ymd_hms(c(
  "2026-04-06 09:15:00", "2026-04-06 09:45:00",
  "2026-04-06 10:05:00", "2026-04-06 10:30:00",
  "2026-04-06 10:55:00", "2026-04-06 11:20:00"
))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_timestamps <- ymd_hms(c(
  "2026-04-06 09:15:00", "2026-04-06 09:45:00",
  "2026-04-06 10:05:00", "2026-04-06 10:30:00",
  "2026-04-06 10:55:00", "2026-04-06 11:20:00"
))

my_hours <- floor_date(my_timestamps, "hour")
table(my_hours)
#> my_hours
#> 2026-04-06 09:00:00 2026-04-06 10:00:00 2026-04-06 11:00:00
#>                   2                   3                   1
```

**Explanation:** `floor_date()` snaps each timestamp down to the hour boundary. The `table()` call then counts how many timestamps landed in each hour bucket: 2 events at 9 AM, 3 at 10 AM, 1 at 11 AM.

</details>

## Putting It All Together

Let's walk through a complete workflow: parse mixed-format dates, extract components, compute ages, and aggregate by month.

```r
# A messy vector of birthdates in different formats
raw_dates <- c("1990-06-15", "03/22/1985", "15-11-1992",
               "1988/01/30", "July 4, 1995")

# Parse each with the right function
birthdates <- c(
  ymd(raw_dates[1]),
  mdy(raw_dates[2]),
  dmy(raw_dates[3]),
  ymd(raw_dates[4]),
  mdy(raw_dates[5])
)

# Extract birth month names
birth_months <- month(birthdates, label = TRUE)
print(birth_months)
#> [1] Jun Mar Nov Jan Jul
#> Levels: Jan < Feb < Mar < Apr < May < Jun < Jul < Aug < Sep < Oct < Nov < Dec

# Compute ages in whole years
ages <- floor(interval(birthdates, today()) / years(1))
print(ages)
#> [1] 35 41 33 38 30

# Build a summary data frame
summary_df <- data.frame(
  birthdate = birthdates,
  birth_month = birth_months,
  age = ages
)
print(summary_df)
#>    birthdate birth_month age
#> 1 1990-06-15         Jun  35
#> 2 1985-03-22         Mar  41
#> 3 1992-11-15         Nov  33
#> 4 1988-01-30         Jan  38
#> 5 1995-07-04         Jul  30

# Count births per quarter
summary_df$quarter <- quarter(summary_df$birthdate)
table(summary_df$quarter)
#>
#> 1 2 3 4
#> 2 1 1 1
```

This example combines parsing (three different formats), extracting (`month()`, `quarter()`), and arithmetic (`interval() / years(1)` for age). The result is a tidy data frame ready for analysis, with 2 births in Q1, and 1 each in Q2-Q4.

## Summary

| Category | Key Functions | When to Use |
|---|---|---|
| Parse dates | `ymd()`, `mdy()`, `dmy()`, `ymd_hms()` | Converting strings to Date/POSIXct objects |
| Parse flexible | `parse_date_time()`, `fast_strptime()` | Custom or inconsistent formats |
| Extract components | `year()`, `month()`, `wday()`, `hour()` | Pulling parts from a date for analysis |
| Modify components | `year(x) <- val`, `update()` | Changing date fields in place |
| Round dates | `floor_date()`, `ceiling_date()`, `round_date()` | Aggregating timestamps into buckets |
| Durations | `dseconds()`, `dhours()`, `ddays()`, `dyears()` | Exact elapsed-seconds math |
| Periods | `seconds()`, `hours()`, `days()`, `months()`, `years()` | Calendar-aware arithmetic |
| Intervals | `interval()`, `%--%`, `%within%` | Measuring spans between specific dates |
| Safe month math | `%m+%`, `%m-%` | Adding months to end-of-month dates |
| Time zones | `with_tz()`, `force_tz()` | Converting display vs. reassigning zone |

## FAQ

### What is the difference between a duration and a period?

A duration is a fixed number of seconds. `ddays(1)` is always 86,400 seconds regardless of DST. A period is a calendar concept. `days(1)` means "same clock time tomorrow," which might be 23 or 25 hours on DST transition days. Use durations for physical time and periods for human calendar time.

### How do I parse dates with inconsistent formats in one vector?

Use `parse_date_time()` with multiple orders. For example, `parse_date_time(x, orders = c("ymd", "mdy", "dmy"))` tries each format in sequence. lubridate picks the first order that produces a valid date for each element.

### Why does adding months(1) to January 31 return NA?

February 31 does not exist. lubridate returns NA rather than guess which day you meant. To get February 28 (or 29 in a leap year), use `%m+%` instead of `+`. The `%m+%` operator rolls back to the last valid day of the target month.

### How do I list all available time zones in R?

Call `OlsonNames()` to get a character vector of all valid time zone strings. There are over 600 entries. Filter with `grep()` to find your zone: `grep("New_York", OlsonNames(), value = TRUE)` returns "America/New_York".

## References

1. Grolemund, G. & Wickham, H. — *Dates and Times Made Easy with lubridate*. Journal of Statistical Software, 40(3), 1-25 (2011). [Link](https://www.jstatsoft.org/article/view/v040i03)
2. lubridate documentation — tidyverse.org. [Link](https://lubridate.tidyverse.org/)
3. lubridate CRAN vignette — *Do more with dates and times in R*. [Link](https://cran.r-project.org/web/packages/lubridate/vignettes/lubridate.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, Chapter 16: Dates and Times. [Link](https://r4ds.had.co.nz/dates-and-times.html)
5. RStudio — *Dates and Times with lubridate Cheatsheet*. [Link](https://rstudio.github.io/cheatsheets/html/lubridate.html)
6. lubridate GitHub repository. [Link](https://github.com/tidyverse/lubridate)

## What's Next?

- [lubridate in R: Parse Dates Once, Stop Fighting Time Zones Forever](lubridate-in-R.html) — The full lubridate tutorial with in-depth explanations of every concept in this cheat sheet.
- [stringr in R](stringr-in-R.html) — Master string manipulation, the other half of the strings-and-dates toolkit.
