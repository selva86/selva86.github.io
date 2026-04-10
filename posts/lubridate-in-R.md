---
title: "lubridate in R: Parse Dates Once, Stop Fighting Time Zones Forever"
slug: "lubridate-in-R"
description: "lubridate parses dates from any format, extracts components like month() and wday(), and handles durations and intervals. Replace base R date handling."
keywords: "lubridate, lubridate in R, R date parsing, ymd(), mdy(), dmy(), R time zones, duration vs period R, date arithmetic R, lubridate tutorial"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.2.11"
post_type: "C"
auto_link_terms: "lubridate|lubridate in R|ymd()|mdy()|dmy()|date parsing in R|R date arithmetic|duration vs period"
auto_link_case_sensitive: false
sidebar_section: "Data Wrangling"
sidebar_title: "lubridate"
sidebar_order: 12
---


# lubridate in R: Parse Dates Once, Stop Fighting Time Zones Forever

<p class="lead">lubridate is a tidyverse package that parses date strings from any format, extracts components like year, month, and weekday, and performs arithmetic with durations, periods, and intervals.</p>

## Introduction

Dates in R are painful. Base R parsing with `as.Date()` and `strptime()` requires memorizing cryptic format codes like `%Y-%m-%d` and `%d/%b/%Y`. One wrong `%` code and you get NA with no explanation.

lubridate fixes this. Instead of format codes, you pick a function whose name matches the order of your date components. Year-month-day? Use `ymd()`. Month-day-year? Use `mdy()`. That is the entire mental model.

Beyond parsing, lubridate gives you accessor functions like `year()`, `month()`, and `wday()` that extract and modify date components. It also provides three time-span classes — durations, periods, and intervals — that handle date arithmetic correctly, even across leap years and daylight saving boundaries.

In this tutorial, you will learn how to parse any date format, extract and modify components, round dates, compute time differences, and handle time zones. Every code block runs directly in your browser, so you can experiment as you read.

![lubridate parsing functions](screenshots/lubridate-in-R-parsing-family.webp)

*Figure 1: How lubridate parsing functions map date component order to the right function.*

## How Does lubridate Parse Dates from Any Format?

The key insight behind lubridate parsing is simple: the function name tells R the order of your date components. If your date reads year-month-day, use `ymd()`. If it reads month-day-year, use `mdy()`. If it reads day-month-year, use `dmy()`.

lubridate auto-detects separators. Dashes, slashes, spaces, or no separator at all — it handles them without extra arguments.

Let's load lubridate and parse dates in three different formats.

```r
# Load lubridate
library(lubridate)

# Year-Month-Day formats
date1 <- ymd("2026-04-06")
print(date1)
#> [1] "2026-04-06"

# Month-Day-Year formats
date2 <- mdy("April 6, 2026")
print(date2)
#> [1] "2026-04-06"

# Day-Month-Year formats
date3 <- dmy("06/04/2026")
print(date3)
#> [1] "2026-04-06"
```

All three functions returned the same date object. `ymd()` parsed the ISO format, `mdy()` handled the spelled-out month, and `dmy()` interpreted slashes in European order. No format codes needed.

When your data includes time information, append `_hms` or `_hm` to the function name. The pattern stays the same: the name describes what appears in the string.

```r
# Parse date-time with hours, minutes, seconds
dt1 <- ymd_hms("2026-04-06 14:30:45")
print(dt1)
#> [1] "2026-04-06 14:30:45 UTC"

# Parse date-time with hours and minutes only
dt2 <- mdy_hm("04/06/2026 2:30 PM")
print(dt2)
#> [1] "2026-04-06 14:30:00 UTC"
```

`ymd_hms()` parsed the 24-hour time. `mdy_hm()` handled 12-hour AM/PM notation. Both return POSIXct objects in UTC by default.

Sometimes real data contains dates in inconsistent formats. A single column might have "2026-04-06", "04/06/2026", and "April 6, 2026" mixed together. `parse_date_time()` handles this by accepting multiple format orders.

```r
# Mixed-format dates in one vector
mixed_dates <- c("2026-04-06", "04/06/2026", "6-Apr-2026")
parsed <- parse_date_time(mixed_dates, orders = c("ymd", "mdy", "dmy"))
print(parsed)
#> [1] "2026-04-06 UTC" "2026-04-06 UTC" "2026-04-06 UTC"
```

`parse_date_time()` tried each format order and picked the one that worked for each string. This is invaluable when you inherit messy spreadsheet data.

[TIP]
**Use parse_date_time() when a column contains dates in multiple formats.** Pass a vector of format orders like `c("ymd", "mdy", "dmy")` and lubridate tries each one until it finds a match. This saves you from splitting and parsing subsets manually.

## How Do You Extract and Modify Date Components?

Once you have a parsed date, you often need to pull out a specific piece — the year for grouping, the month for seasonal analysis, or the weekday for scheduling patterns. lubridate provides accessor functions that read like English.

![Date-time component extraction](screenshots/lubridate-in-R-component-extraction.webp)

*Figure 2: Extracting individual components from a date-time object.*

Each accessor function matches the component it extracts: `year()`, `month()`, `day()`, `hour()`, `minute()`, `second()`, `wday()` (weekday), and `yday()` (day of year).

```r
# Create a date-time to examine
today <- ymd_hms("2026-04-06 14:30:45")

# Extract components
year(today)
#> [1] 2026

month(today)
#> [1] 4

day(today)
#> [1] 6

wday(today)
#> [1] 2

hour(today)
#> [1] 14
```

`year()` returned 2026, `month()` returned 4 (April), `day()` returned 6, and `wday()` returned 2. By default, `wday()` uses 1 for Sunday and 7 for Saturday, so 2 means Monday.

The numeric values are useful for computation, but sometimes you want the name. Add `label = TRUE` to get ordered factor labels.

```r
# Get month and weekday names
month(today, label = TRUE)
#> [1] Apr
#> 12 Levels: Jan < Feb < Mar < Apr < May < Jun < Jul < Aug < ... < Dec

wday(today, label = TRUE)
#> [1] Mon
#> 7 Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat

# Week of the year and day of the year
week(today)
#> [1] 14

yday(today)
#> [1] 96
```

`month(today, label = TRUE)` returned "Apr" as an ordered factor. `wday(today, label = TRUE)` returned "Mon". These ordered factors sort correctly in plots and tables.

[KEY INSIGHT]
**lubridate accessor functions are both getters and setters.** Call `month(date)` to read the month. Call `month(date) <- 12` to change it. This two-way design means you can modify date components in place without rebuilding the entire date from scratch.

Here is the setter in action.

```r
# Modify a component in place
my_date <- ymd("2026-04-06")
print(my_date)
#> [1] "2026-04-06"

# Change the month to December
month(my_date) <- 12
print(my_date)
#> [1] "2026-12-06"

# Change the year to 2025
year(my_date) <- 2025
print(my_date)
#> [1] "2025-12-06"
```

After setting `month(my_date) <- 12`, the date jumped from April to December. Then `year(my_date) <- 2025` moved it back one year. The day stayed at 6 throughout.

## How Do You Round Dates to Useful Boundaries?

When you aggregate data — monthly sales, weekly active users, quarterly revenue — you need to snap each date to the start of its time period. lubridate provides three rounding functions: `floor_date()` rounds down, `ceiling_date()` rounds up, and `round_date()` rounds to the nearest unit.

```r
# Create sample timestamps
timestamps <- ymd_hms(c(
  "2026-03-15 09:45:00",
  "2026-03-22 14:20:00",
  "2026-04-03 08:10:00",
  "2026-04-18 17:55:00"
))

# Round down to month
floor_date(timestamps, "month")
#> [1] "2026-03-01 UTC" "2026-03-01 UTC" "2026-04-01 UTC" "2026-04-01 UTC"

# Round down to week (starts Monday)
floor_date(timestamps, "week", week_start = 1)
#> [1] "2026-03-09 UTC" "2026-03-16 UTC" "2026-03-30 UTC" "2026-04-13 UTC"

# Round to nearest quarter
round_date(timestamps, "quarter")
#> [1] "2026-04-01 UTC" "2026-04-01 UTC" "2026-04-01 UTC" "2026-04-01 UTC"
```

`floor_date(timestamps, "month")` snapped every date to the first of its month. The two March dates became March 1, and the two April dates became April 1. This is exactly what you need for monthly grouping.

Let's combine rounding with dplyr for a practical aggregation.

```r
# Practical: monthly sales summary
library(dplyr)

sales <- tibble(
  date = ymd(c("2026-01-05", "2026-01-22", "2026-02-10",
               "2026-02-18", "2026-03-03", "2026-03-25")),
  amount = c(150, 230, 180, 310, 275, 190)
)

monthly_sales <- sales |>
  mutate(month = floor_date(date, "month")) |>
  group_by(month) |>
  summarise(total = sum(amount), n_orders = n())

print(monthly_sales)
#> # A tibble: 3 x 3
#>   month      total n_orders
#>   <date>     <dbl>    <int>
#> 1 2026-01-01   380        2
#> 2 2026-02-01   490        2
#> 3 2026-03-01   465        2
```

`floor_date(date, "month")` created a grouping column that `group_by()` could use. January's two orders totaled 380, February's totaled 490, and March's totaled 465.

[TIP]
**Combine floor_date() with dplyr's group_by() for instant time-based aggregation.** This pattern works for any granularity: replace "month" with "week", "quarter", "year", or even "2 weeks" for biweekly grouping.

## What Is the Difference Between Durations, Periods, and Intervals?

This is the most important conceptual distinction in lubridate. When you say "one year from now," do you mean exactly 365 days (31,536,000 seconds) or the same calendar date next year? The answer depends on which time-span class you use.

![Duration vs Period vs Interval](screenshots/lubridate-in-R-duration-period-interval.webp)

*Figure 3: Duration measures exact seconds, Period tracks clock units, Interval bounds a specific span.*

**Durations** measure exact physical time in seconds. One duration year always equals exactly 365 days (31,536,000 seconds), regardless of leap years.

```r
# Create durations (exact seconds)
dur1 <- dyears(1)
print(dur1)
#> [1] "31536000s (~365 days)"

dur2 <- ddays(30) + dhours(6)
print(dur2)
#> [1] "2613600s (~30.25 days)"

# Duration in seconds
as.numeric(dur1)
#> [1] 31536000
```

`dyears(1)` created a duration of exactly 31,536,000 seconds. `ddays(30) + dhours(6)` combined 30 days and 6 hours into a single duration. Durations always store their value in seconds internally.

**Periods** measure human clock time. One period year means "same date next year," which could be 365 or 366 days depending on leap years.

```r
# Create periods (clock time)
per1 <- years(1)
print(per1)
#> [1] "1y 0m 0d 0H 0M 0S"

per2 <- months(3) + days(15)
print(per2)
#> [1] "3m 15d 0H 0M 0S"
```

`years(1)` created a period of 1 year. Unlike durations, periods don't convert to seconds — they track the calendar units directly. `months(3) + days(15)` means "3 months and 15 days," which varies in actual seconds depending on which months.

The difference matters when you cross a leap year boundary.

```r
# Duration vs Period across a leap year
leap_date <- ymd("2024-03-01")

# Add 1 duration year (exactly 365 days)
dur_result <- leap_date + dyears(1)
print(dur_result)
#> [1] "2025-02-28 06:00:00 UTC"

# Add 1 period year (same calendar date next year)
per_result <- leap_date + years(1)
print(per_result)
#> [1] "2025-03-01"
```

Adding `dyears(1)` to March 1, 2024, moved exactly 365 days forward — landing on February 28 at 6 AM (because 2024 was a leap year with 366 days, so 365 days from March 1 doesn't reach March 1). Adding `years(1)` landed on March 1, 2025, which is what most people mean by "one year later."

[WARNING]
**Duration arithmetic can shift your dates unexpectedly across leap years and DST boundaries.** Use periods (`years()`, `months()`, `days()`) when you want calendar-intuitive results. Use durations (`dyears()`, `ddays()`) when you need exact elapsed time for scientific or financial calculations.

**Intervals** represent a specific span of time with a defined start and end point. They retain the full context of exactly when the span occurred.

```r
# Create an interval
start <- ymd("2026-01-01")
end <- ymd("2026-06-30")
my_interval <- start %--% end

print(my_interval)
#> [1] 2026-01-01 UTC--2026-06-30 UTC

# Check if a date falls within the interval
check_date <- ymd("2026-04-15")
check_date %within% my_interval
#> [1] TRUE

# Get interval length in seconds
int_length(my_interval)
#> [1] 15552000

# Convert to periods or durations
as.period(my_interval)
#> [1] "5m 29d 0H 0M 0S"
```

The `%--%` operator created an interval from January 1 to June 30. `%within%` confirmed that April 15 falls inside it. `int_length()` returned the exact seconds, and `as.period()` converted it to 5 months and 29 days.

[KEY INSIGHT]
**Choose your time-span class based on your question.** Need exact elapsed seconds? Use durations. Need "same date next month"? Use periods. Need to check if events overlap or if a date falls in a range? Use intervals.

## How Do You Handle Time Zones Without Losing Your Mind?

Time zones trip up even experienced programmers. lubridate provides two functions that do opposite things, and confusing them is one of the most common date-handling bugs.

`with_tz()` changes the **display** of a moment. The underlying instant stays the same — you are just looking at the same clock from a different city.

```r
# Create a time in UTC
utc_time <- ymd_hms("2026-04-06 14:30:00", tz = "UTC")

# View the same moment in New York and Tokyo
ny_time <- with_tz(utc_time, "America/New_York")
tokyo_time <- with_tz(utc_time, "Asia/Tokyo")

print(utc_time)
#> [1] "2026-04-06 14:30:00 UTC"

print(ny_time)
#> [1] "2026-04-06 10:30:00 EDT"

print(tokyo_time)
#> [1] "2026-04-06 23:30:00 JST"
```

All three variables represent the same instant in time. When it is 14:30 in UTC, it is 10:30 in New York (EDT, UTC-4) and 23:30 in Tokyo (JST, UTC+9). `with_tz()` never changes the moment — only the label.

`force_tz()` does the opposite. It keeps the clock reading the same but changes which time zone that reading belongs to. This changes the actual moment in time.

```r
# A time recorded without timezone info (assumed UTC)
local_time <- ymd_hms("2026-04-06 09:00:00")
print(local_time)
#> [1] "2026-04-06 09:00:00 UTC"

# The data was actually recorded in Chicago — fix the label
forced <- force_tz(local_time, "America/Chicago")
print(forced)
#> [1] "2026-04-06 09:00:00 CDT"

# These are now different moments
with_tz(forced, "UTC")
#> [1] "2026-04-06 14:00:00 UTC"
```

The original time said 9:00 AM UTC. After `force_tz()`, it says 9:00 AM Chicago time — which is actually 2:00 PM UTC. The clock reading stayed at 9:00, but the moment shifted by 5 hours.

[WARNING]
**force_tz() changes the actual moment in time, not just the display.** Use it only when you know the original time zone label was wrong. Use `with_tz()` when you want to see the same moment from a different city.

[NOTE]
**Use OlsonNames() to find valid time zone strings.** R accepts IANA time zone names like "America/New_York" and "Europe/London". Run `OlsonNames()` to see all 600+ valid options, or `grep("America", OlsonNames(), value = TRUE)` to filter by region.

## Common Mistakes and How to Fix Them

### Mistake 1: Using strptime format codes with lubridate

❌ **Wrong:**
```r
ymd("2026-04-06", format = "%Y-%m-%d")
#> Error or unexpected behavior
```

**Why it is wrong:** lubridate's `ymd()` family does not accept `format` arguments. The function name IS the format specification. Adding `format = "%Y-%m-%d"` either gets silently ignored or causes an error.

✅ **Correct:**
```r
# Just use ymd() — no format argument needed
ymd("2026-04-06")
#> [1] "2026-04-06"
```

### Mistake 2: Confusing with_tz() and force_tz()

❌ **Wrong:**
```r
# You have a UTC time and want to display it in London
utc_event <- ymd_hms("2026-06-15 18:00:00", tz = "UTC")
force_tz(utc_event, "Europe/London")
#> [1] "2026-06-15 18:00:00 BST"
# This changed the moment! 18:00 BST != 18:00 UTC
```

**Why it is wrong:** `force_tz()` relabels the clock reading to a new zone, changing the underlying instant. You wanted to display the same moment in London time, which requires `with_tz()`.

✅ **Correct:**
```r
utc_event <- ymd_hms("2026-06-15 18:00:00", tz = "UTC")
with_tz(utc_event, "Europe/London")
#> [1] "2026-06-15 19:00:00 BST"
# Same moment, displayed as London time (UTC+1 in summer)
```

### Mistake 3: Using durations for calendar arithmetic

❌ **Wrong:**
```r
# Add "one month" using duration
start_date <- ymd("2026-01-31")
start_date + ddays(30)
#> [1] "2026-03-02"
# Wanted February 28, got March 2
```

**Why it is wrong:** `ddays(30)` adds exactly 30 days. But "one month from January 31" should be February 28 (or 27 in non-leap years). Durations don't understand calendar months.

✅ **Correct:**
```r
start_date <- ymd("2026-01-31")
start_date + months(1)
#> [1] NA
# months(1) returns NA because Feb 31 doesn't exist!
# Use %m+% for safe month arithmetic
start_date %m+% months(1)
#> [1] "2026-02-28"
```

### Mistake 4: Expecting month() to return a name instead of a number

❌ **Wrong:**
```r
my_date <- ymd("2026-04-06")
month(my_date)
#> [1] 4
# Expected "April" but got 4
```

**Why it is wrong:** By default, `month()` returns an integer. You need the `label` argument to get the name.

✅ **Correct:**
```r
my_date <- ymd("2026-04-06")
month(my_date, label = TRUE, abbr = FALSE)
#> [1] April
#> 12 Levels: January < February < March < ... < December
```

## Practice Exercises

### Exercise 1: Parse three date formats

Parse the following three strings into R date objects: "2026-12-25", "July 4, 2026", and "15/08/2026". Print all three.

```r
# Exercise: parse these three dates
# Hint: match the function name to the order of year, month, day

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex1_a <- ymd("2026-12-25")
ex1_b <- mdy("July 4, 2026")
ex1_c <- dmy("15/08/2026")

print(ex1_a)
#> [1] "2026-12-25"
print(ex1_b)
#> [1] "2026-07-04"
print(ex1_c)
#> [1] "2026-08-15"
```

**Explanation:** "2026-12-25" is year-month-day, so `ymd()`. "July 4, 2026" is month-day-year, so `mdy()`. "15/08/2026" is day-month-year, so `dmy()`.

</details>

### Exercise 2: Extract weekday and month names

Get today's date using `today()`, then extract the full weekday name and the full month name. Print both.

```r
# Exercise: extract weekday and month names from today's date
# Hint: use label = TRUE and abbr = FALSE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex2_date <- today()
ex2_weekday <- wday(ex2_date, label = TRUE, abbr = FALSE)
ex2_month <- month(ex2_date, label = TRUE, abbr = FALSE)

print(ex2_weekday)
#> [1] Monday
#> 7 Levels: Sunday < Monday < Tuesday < ... < Saturday

print(ex2_month)
#> [1] April
#> 12 Levels: January < February < March < ... < December
```

**Explanation:** `wday()` with `label = TRUE, abbr = FALSE` returns the full weekday name. `month()` with the same arguments returns the full month name. Both return ordered factors.

</details>

### Exercise 3: Calculate age from a birthdate

Given the birthdate "1990-07-15", calculate the person's age in complete years as of today using an interval.

```r
# Exercise: calculate age in years from a birthdate
# Hint: create an interval with %--%, then divide by years(1)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex3_birth <- ymd("1990-07-15")
ex3_today <- today()
ex3_age <- as.numeric(as.period(ex3_birth %--% ex3_today)$year)

print(ex3_age)
#> [1] 35
```

**Explanation:** `ex3_birth %--% ex3_today` creates an interval from birth to today. `as.period()` converts it to years, months, and days. Extracting `$year` gives the complete years. Alternatively, use `interval(ex3_birth, ex3_today) %/% years(1)`.

</details>

### Exercise 4: Floor timestamps and count by hour

Given the vector of timestamps below, floor each to the nearest hour and count how many events occurred in each hour.

```r
# Exercise: group timestamps by hour
# Hint: use floor_date() with "hour", then table()

ex4_times <- ymd_hms(c(
  "2026-04-06 09:15:00", "2026-04-06 09:45:00",
  "2026-04-06 10:05:00", "2026-04-06 10:30:00",
  "2026-04-06 10:55:00", "2026-04-06 11:20:00"
))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex4_times <- ymd_hms(c(
  "2026-04-06 09:15:00", "2026-04-06 09:45:00",
  "2026-04-06 10:05:00", "2026-04-06 10:30:00",
  "2026-04-06 10:55:00", "2026-04-06 11:20:00"
))

ex4_hourly <- floor_date(ex4_times, "hour")
ex4_counts <- table(ex4_hourly)
print(ex4_counts)
#> ex4_hourly
#> 2026-04-06 09:00:00 2026-04-06 10:00:00 2026-04-06 11:00:00
#>                   2                   3                   1
```

**Explanation:** `floor_date(ex4_times, "hour")` snapped each timestamp to the start of its hour. `table()` counted how many timestamps fell in each hour: 2 in the 9 AM hour, 3 in the 10 AM hour, and 1 in the 11 AM hour.

</details>

### Exercise 5: Compare duration vs period across a leap year

Start with "2024-02-29" (a leap year date). Add `years(1)` and `dyears(1)` separately. Print both results and explain why they differ.

```r
# Exercise: duration vs period across a leap year
# Hint: 2024 is a leap year, 2025 is not

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex5_leap <- ymd("2024-02-29")

# Period: "same date next year" — but Feb 29 doesn't exist in 2025
ex5_period <- ex5_leap + years(1)
print(ex5_period)
#> [1] NA

# Duration: exactly 365 days of seconds
ex5_duration <- ex5_leap + dyears(1)
print(ex5_duration)
#> [1] "2025-02-28 06:00:00 UTC"

# Safe month arithmetic with %m+%
ex5_safe <- ex5_leap %m+% years(1)
print(ex5_safe)
#> [1] "2025-02-28"
```

**Explanation:** `years(1)` tried to create February 29, 2025, which does not exist, so it returned NA. `dyears(1)` added exactly 365 days of seconds (365 * 86400 = 31,536,000), landing on February 28 at 6 AM. The `%m+%` operator handles this gracefully by rolling back to the last valid day of the month.

</details>

## Putting It All Together

Let's work through a complete real-world scenario. You receive a character vector of event timestamps in mixed formats. You need to parse them, extract components, compute durations, and summarize by month.

```r
# Raw event data with inconsistent date formats
raw_dates <- c(
  "2026-01-15 08:30:00",
  "02/20/2026 14:00",
  "15-Mar-2026 09:45:00",
  "2026-04-01 16:20:00",
  "05/10/2026 11:00",
  "20-Jun-2026 13:30:00"
)

# Step 1: Parse all dates with parse_date_time()
clean_dates <- parse_date_time(raw_dates, orders = c("ymd HMS", "mdy HM", "dmy HMS"))
print(clean_dates)
#> [1] "2026-01-15 08:30:00 UTC" "2026-02-20 14:00:00 UTC"
#> [3] "2026-03-15 09:45:00 UTC" "2026-04-01 16:20:00 UTC"
#> [5] "2026-05-10 11:00:00 UTC" "2026-06-20 13:30:00 UTC"

# Step 2: Build a data frame with extracted components
clean_df <- tibble(
  timestamp = clean_dates,
  year = year(clean_dates),
  month_name = month(clean_dates, label = TRUE),
  weekday = wday(clean_dates, label = TRUE),
  hour = hour(clean_dates)
)
print(clean_df)
#> # A tibble: 6 x 5
#>   timestamp            year month_name weekday  hour
#>   <dttm>              <dbl> <ord>      <ord>   <int>
#> 1 2026-01-15 08:30:00  2026 Jan        Thu         8
#> 2 2026-02-20 14:00:00  2026 Feb        Fri        14
#> 3 2026-03-15 09:45:00  2026 Mar        Sun         9
#> 4 2026-04-01 16:20:00  2026 Apr        Wed        16
#> 5 2026-05-10 11:00:00  2026 May        Sun        11
#> 6 2026-06-20 13:30:00  2026 Jun        Sat        13

# Step 3: Time elapsed since the first event
first_event <- min(clean_dates)
elapsed <- as.period(first_event %--% max(clean_dates))
print(elapsed)
#> [1] "5m 5d 5H 0M 0S"

# Step 4: Monthly event counts
monthly_counts <- clean_df |>
  mutate(month_start = floor_date(timestamp, "month")) |>
  count(month_start)
print(monthly_counts)
#> # A tibble: 6 x 2
#>   month_start             n
#>   <dttm>              <int>
#> 1 2026-01-01 00:00:00     1
#> 2 2026-02-01 00:00:00     1
#> 3 2026-03-01 00:00:00     1
#> 4 2026-04-01 00:00:00     1
#> 5 2026-05-01 00:00:00     1
#> 6 2026-06-01 00:00:00     1
```

This example demonstrates the full lubridate workflow: parse messy strings with `parse_date_time()`, extract components for analysis, compute time spans with intervals and periods, and aggregate with `floor_date()`.

## Summary

| Task | Function(s) | Example |
|------|-------------|---------|
| Parse year-month-day | `ymd()`, `ymd_hms()` | `ymd("2026-04-06")` |
| Parse month-day-year | `mdy()`, `mdy_hm()` | `mdy("April 6, 2026")` |
| Parse day-month-year | `dmy()`, `dmy_hms()` | `dmy("06/04/2026")` |
| Parse mixed formats | `parse_date_time()` | `parse_date_time(x, orders = c("ymd", "mdy"))` |
| Extract components | `year()`, `month()`, `day()`, `wday()` | `month(date, label = TRUE)` |
| Modify components | `year()<-`, `month()<-`, `day()<-` | `month(date) <- 12` |
| Round dates | `floor_date()`, `ceiling_date()`, `round_date()` | `floor_date(date, "month")` |
| Exact elapsed time | `dyears()`, `ddays()`, `dhours()` | `ddays(30) + dhours(6)` |
| Calendar arithmetic | `years()`, `months()`, `days()` | `date + months(3)` |
| Safe month addition | `%m+%`, `%m-%` | `date %m+% months(1)` |
| Bounded time span | `%--%`, `%within%` | `start %--% end` |
| Display in new zone | `with_tz()` | `with_tz(time, "America/New_York")` |
| Fix zone label | `force_tz()` | `force_tz(time, "America/Chicago")` |

## FAQ

**Is lubridate part of the tidyverse?**

Yes, lubridate is a tidyverse package, but it is not loaded by `library(tidyverse)`. You need to call `library(lubridate)` explicitly. This is because date manipulation is not needed in every analysis.

**Can lubridate handle dates before 1970?**

Yes. lubridate uses POSIXct internally, which stores dates as seconds since 1970-01-01 UTC. Dates before 1970 are stored as negative numbers. `ymd("1900-01-01")` works without issue.

**When should I use base R as.Date() instead of lubridate?**

Use `as.Date()` when your dates are already in ISO 8601 format ("YYYY-MM-DD") and you only need date-only objects without time components. For anything more complex — multiple formats, time zones, date arithmetic — lubridate is the better choice.

**How do I parse dates with non-English month names?**

Use `parse_date_time()` with the `locale` argument. For example, `parse_date_time("15 avril 2026", "dmy", locale = "fr_FR.UTF-8")` parses a French date. The locale must be installed on your system.

**What is the difference between mday() and day()?**

They are aliases that do exactly the same thing. Both return the day of the month. `mday()` is more explicit (month-day), while `day()` is shorter. Use whichever you find more readable.

## References

1. Grolemund, G. & Wickham, H. — Dates and Times Made Easy with lubridate. *Journal of Statistical Software*, 40(3), 1-25 (2011). [Link](https://www.jstatsoft.org/article/view/v040i03)
2. lubridate documentation — tidyverse.org. [Link](https://lubridate.tidyverse.org/)
3. CRAN vignette — Do more with dates and times in R. [Link](https://cran.r-project.org/web/packages/lubridate/vignettes/lubridate.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd ed. Chapter 17: Dates and Times. [Link](https://r4ds.hadley.nz/datetimes)
5. R Core Team — DateTimeClasses documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html)
6. RStudio — lubridate Cheatsheet. [Link](https://rstudio.github.io/cheatsheets/html/lubridate.html)
7. Spinu, V., Grolemund, G., & Wickham, H. — lubridate: Make Dealing with Dates a Little Easier. CRAN. [Link](https://cran.r-project.org/package=lubridate)

## Continue Learning

Now that you can handle dates and times confidently, here are related tutorials to continue your learning:

1. **[stringr in R](/stringr-in-R.html)** — Learn consistent, pipe-friendly string manipulation with the same tidyverse philosophy lubridate follows.
2. **[dplyr filter & select](/dplyr-filter-select.html)** — Combine date extraction with filtering to subset your data by date ranges, weekdays, or time windows.
3. **[Tidy Data in R](/Tidy-Data-in-R.html)** — Reshape messy date columns into analysis-ready long or wide format using pivot_longer and pivot_wider.
