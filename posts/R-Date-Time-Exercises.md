---
title: "R Date & Time Exercises: 10 lubridate Practice Problems with Solutions"
slug: "R-Date-Time-Exercises"
description: "Practice R date and time skills with 10 lubridate exercises. Parse dates, extract components, do date arithmetic, handle timezones, with full solutions."
keywords: "R date time exercises, lubridate exercises, R date practice problems, lubridate practice, R date arithmetic, R timezone exercises, ymd() practice, R date parsing exercises, lubridate solutions"
auto_link_terms: "R date exercises|lubridate exercises|date time exercises|R date practice|lubridate practice problems"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E1.8"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Date & Time (10 problems)"
fr_parent: "R-Syntax-101.html"
difficulty: "Intermediate"
---

# R Date & Time Exercises: 10 lubridate Practice Problems with Solutions

<p class="lead">These 10 exercises test your ability to parse, manipulate, and calculate with dates and times in R using the lubridate package. Each problem includes starter code with hints and a full worked solution, run them directly in your browser to check your answers.</p>

## How do you parse dates from text strings?

The exercises below progress from basic date parsing to timezone conversions and interval calculations. Each one builds on a skill you'll use constantly when cleaning real-world data. Let's load lubridate and see it in action.

```r
# Load lubridate and parse a quick example
library(lubridate)

ymd("2024-03-15")
#> [1] "2024-03-15"

mdy("July 4th, 2024")
#> [1] "2024-07-04"

dmy("25-12-2024")
#> [1] "2024-12-25"
```

The function name tells lubridate the order of components, `ymd()` expects year-month-day, `mdy()` expects month-day-year, and `dmy()` expects day-month-year. Lubridate figures out the separators and formats automatically, so you only need to pick the right function.

### Exercise 1: Parse a date with ymd()

Parse the string `"2024-03-15"` into a Date object called `my_date`. Print the result and confirm its class.

```r
# Exercise 1: Parse a date with ymd()
# Hint: use ymd() from lubridate

my_date <- ___("2024-03-15")
my_date
class(my_date)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_date <- ymd("2024-03-15")
my_date
#> [1] "2024-03-15"
class(my_date)
#> [1] "Date"
```

**Explanation:** `ymd()` parses a year-month-day string into an R Date object. The class confirms it's a proper Date, not just a character string.

</details>

### Exercise 2: Parse dates in different formats

Parse these two strings into Date objects: `"March 15, 2024"` (US format) and `"15/03/2024"` (European format). Store them as `date_us` and `date_eu`.

```r
# Exercise 2: Parse US and European date formats
# Hint: which function handles month-day-year? Which handles day-month-year?

date_us <- ___("March 15, 2024")
date_eu <- ___("15/03/2024")

date_us
date_eu
date_us == date_eu
```

<details>
<summary>Click to reveal solution</summary>

```r
date_us <- mdy("March 15, 2024")
date_eu <- dmy("15/03/2024")

date_us
#> [1] "2024-03-15"
date_eu
#> [1] "2024-03-15"
date_us == date_eu
#> [1] TRUE
```

**Explanation:** `mdy()` handles the US convention (month first), while `dmy()` handles the European convention (day first). Both produce the same Date object because they represent the same calendar date. The equality check confirms this.

</details>

[TIP]
**lubridate guesses the format from the function name, not the separator.** Whether your dates use dashes, slashes, spaces, or even no separator at all ("20240315"), just pick ymd(), mdy(), or dmy() based on the component order and lubridate handles the rest.

**Try it:** Parse the string `"07-Jan-2025"` into a Date object. Which lubridate function do you need?

```r
# Try it: parse "07-Jan-2025"
ex_date1 <- ___("07-Jan-2025")
ex_date1
#> Expected: "2025-01-07"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_date1 <- dmy("07-Jan-2025")
ex_date1
#> [1] "2025-01-07"
```

**Explanation:** The string starts with day (07), then month (Jan), then year (2025), so `dmy()` is the right choice. Lubridate handles abbreviated month names just fine.

</details>

## How do you extract and modify date components?

Once you have a Date object, you often need to pull out individual pieces, the year, month, or day of the week. Lubridate's component functions work as both getters (read a component) and setters (change a component in place).

### Exercise 3: Extract year, month, and weekday

Using `my_date` (which holds 2024-03-15), extract the year, month number, and weekday name.

```r
# Exercise 3: Extract date components
# Hint: year(), month(), and wday() with label = TRUE

year(___)
month(___)
wday(___, label = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r
year(my_date)
#> [1] 2024
month(my_date)
#> [1] 3
wday(my_date, label = TRUE)
#> [1] Fri
#> Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat
```

**Explanation:** `year()` returns the four-digit year, `month()` returns the month as an integer (1-12), and `wday()` with `label = TRUE` returns the abbreviated weekday name. March 15, 2024 was a Friday.

</details>

### Exercise 4: Change a date component in place

Change the month of `my_date` to December (12) and print the result. What date do you get?

```r
# Exercise 4: Modify a date component
# Hint: use month() on the left side of <-

month(my_date) <- ___
my_date
```

<details>
<summary>Click to reveal solution</summary>

```r
month(my_date) <- 12
my_date
#> [1] "2024-12-15"
```

**Explanation:** Assigning to `month(my_date)` changes the month in place while keeping the year and day unchanged. The date moves from March 15 to December 15, 2024. This is one of lubridate's most convenient features, the same function works as both a getter and a setter.

</details>

[KEY INSIGHT]
**Component functions are both getters and setters.** Call `month(x)` to read the month, or `month(x) <- 6` to change it to June. The same pattern works for year(), day(), hour(), minute(), and second().

**Try it:** Use `quarter()` to find which quarter of the year today's date falls in.

```r
# Try it: which quarter is today in?
ex_q <- quarter(___)
ex_q
#> Expected: a number 1-4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_q <- quarter(today())
ex_q
#> [1] 2
```

**Explanation:** `quarter()` returns 1-4 depending on which three-month block the date falls in. April 2026 is in Q2 (April-June).

</details>

## How do you do arithmetic with dates?

Date arithmetic is where lubridate really shines. You can add or subtract periods like `days()`, `months()`, and `years()` directly to Date objects. But watch out, adding months can produce surprising results when the starting day doesn't exist in the target month.

### Exercise 5: Add days vs. months, compare the results

Starting from `"2024-01-31"`, add 90 days and separately add 1 month. Store the results as `result_days` and `result_months`. Are they the same?

```r
# Exercise 5: days() vs months() arithmetic
# Hint: create the base date, then add days(90) and months(1)

base_date <- ymd("2024-01-31")
result_days <- base_date + days(___)
result_months <- base_date + months(___)

result_days
result_months
result_days == result_months
```

<details>
<summary>Click to reveal solution</summary>

```r
base_date <- ymd("2024-01-31")
result_days <- base_date + days(90)
result_months <- base_date + months(1)

result_days
#> [1] "2024-04-20"
result_months
#> [1] NA
result_days == result_months
#> [1] NA
```

**Explanation:** Adding 90 days to January 31 lands on April 20. But adding 1 month to January 31 produces `NA` because February 31 doesn't exist. Lubridate returns `NA` rather than guessing. Use `base_date %m+% months(1)` if you want it to roll back to the last valid day of February (Feb 29, since 2024 is a leap year).

</details>

[WARNING]
**Adding months() to the 31st can produce NA.** Months like February, April, June, September, and November have fewer than 31 days. Use the `%m+%` operator instead of `+` if you want lubridate to roll back to the last valid day of the month.

### Exercise 6: Calculate the number of days between two dates

How many days are there between January 1, 2024 and December 31, 2024? Store the answer as `diff_days`.

```r
# Exercise 6: Date difference in days
# Hint: subtract two dates and convert to numeric

diff_days <- as.numeric(___ - ___)
diff_days
```

<details>
<summary>Click to reveal solution</summary>

```r
diff_days <- as.numeric(ymd("2024-12-31") - ymd("2024-01-01"))
diff_days
#> [1] 365
```

**Explanation:** Subtracting two Date objects gives a difftime object. Wrapping it in `as.numeric()` extracts the number of days as a plain integer. 2024 is a leap year (366 days total), but the difference from Jan 1 to Dec 31 is 365 because the subtraction doesn't count the start date.

</details>

**Try it:** What date is 100 days from today?

```r
# Try it: 100 days from today
ex_future <- today() + days(___)
ex_future
#> Expected: a date ~100 days in the future
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_future <- today() + days(100)
ex_future
#> [1] "2026-07-21"
```

**Explanation:** `today()` gives the current date, and `days(100)` creates a period of 100 days. Adding them together gives the date 100 days from now.

</details>

## How do you work with date-time objects and timezones?

Real-world data often includes timestamps with hours, minutes, and seconds, plus timezones that can trip you up if you're not careful. Lubridate has two key timezone functions: `with_tz()` converts the display to a different timezone (same instant), while `force_tz()` reinterprets the clock time as a different timezone (different instant).

### Exercise 7: Parse a datetime and convert timezones

Parse `"2024-07-04 14:30:00"` as a datetime in UTC. Then convert it to `"America/New_York"` time. Store the results as `dt_utc` and `dt_ny`.

```r
# Exercise 7: Parse datetime and convert timezone
# Hint: ymd_hms() with tz argument, then with_tz()

dt_utc <- ymd_hms("2024-07-04 14:30:00", tz = "___")
dt_ny <- with_tz(dt_utc, tzone = "___")

dt_utc
dt_ny
```

<details>
<summary>Click to reveal solution</summary>

```r
dt_utc <- ymd_hms("2024-07-04 14:30:00", tz = "UTC")
dt_ny <- with_tz(dt_utc, tzone = "America/New_York")

dt_utc
#> [1] "2024-07-04 14:30:00 UTC"
dt_ny
#> [1] "2024-07-04 10:30:00 EDT"
```

**Explanation:** `ymd_hms()` parses a full timestamp with hours, minutes, and seconds. The `tz` argument sets the timezone. `with_tz()` then converts the same moment in time to how it would appear on a clock in New York, 4 hours earlier in July (Eastern Daylight Time, UTC-4).

</details>

### Exercise 8: Extract the hour in different timezones

Using `dt_utc` and `dt_ny` from Exercise 7, extract the hour from each. What's the difference?

```r
# Exercise 8: Extract hour from different timezones
# Hint: use hour() on both datetime objects

hour_utc <- hour(___)
hour_ny <- hour(___)

hour_utc
hour_ny
hour_utc - hour_ny
```

<details>
<summary>Click to reveal solution</summary>

```r
hour_utc <- hour(dt_utc)
hour_ny <- hour(dt_ny)

hour_utc
#> [1] 14
hour_ny
#> [1] 10
hour_utc - hour_ny
#> [1] 4
```

**Explanation:** The UTC time is 14:30 and the New York time is 10:30, a 4-hour difference. This matches the EDT (Eastern Daylight Time) offset of UTC-4 that applies in July. In winter, New York uses EST (UTC-5), so the difference would be 5 hours.

</details>

[KEY INSIGHT]
**with_tz() changes the display, force_tz() changes the instant.** Use with_tz() when you know the correct UTC instant and want to see it in another timezone. Use force_tz() when the clock time is correct but was tagged with the wrong timezone.

**Try it:** Use `force_tz()` to reinterpret `dt_utc` as if it were recorded in `"Asia/Tokyo"` time. Compare the result to `dt_utc`, is it the same instant?

```r
# Try it: force_tz() vs with_tz()
ex_tokyo <- force_tz(dt_utc, tzone = "Asia/Tokyo")
ex_tokyo
dt_utc
ex_tokyo == dt_utc
#> Expected: FALSE (different instants!)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_tokyo <- force_tz(dt_utc, tzone = "Asia/Tokyo")
ex_tokyo
#> [1] "2024-07-04 14:30:00 JST"
dt_utc
#> [1] "2024-07-04 14:30:00 UTC"
ex_tokyo == dt_utc
#> [1] FALSE
```

**Explanation:** `force_tz()` keeps the clock reading (14:30) but changes the timezone label to Tokyo. Since Tokyo is UTC+9, this now represents a completely different moment, 9 hours earlier in UTC terms. That's why `==` returns FALSE. Use `force_tz()` only when you need to correct a mislabeled timezone.

</details>

## How do you calculate intervals and durations?

Lubridate distinguishes between three ways to measure time spans: **durations** (exact seconds), **periods** (human units like "1 month"), and **intervals** (a specific start-to-end span). Intervals are especially useful when you need to check if a date falls within a range or calculate an exact age.

### Exercise 9: Create an interval and test membership

Create an interval from `"2024-01-01"` to `"2024-06-30"`. Then check whether `"2024-03-15"` falls within that interval.

```r
# Exercise 9: Intervals and %within%
# Hint: use %--% to create an interval, then %within% to test

int_half <- ymd("2024-01-01") ___ ymd("2024-06-30")
check_date <- ymd("2024-03-15")

check_date ___ int_half
```

<details>
<summary>Click to reveal solution</summary>

```r
int_half <- ymd("2024-01-01") %--% ymd("2024-06-30")
check_date <- ymd("2024-03-15")

check_date %within% int_half
#> [1] TRUE
```

**Explanation:** The `%--%` operator creates an interval between two dates. The `%within%` operator then tests whether a date falls inside that interval. March 15 is between January 1 and June 30, so the result is TRUE. This is much cleaner than writing `check_date >= start & check_date <= end`.

</details>

### Exercise 10: Calculate exact age in years

Calculate the exact age in complete years from the birthdate `"1995-08-22"` to today's date. Store the result as `my_age`.

```r
# Exercise 10: Calculate age in complete years
# Hint: create an interval with %--%, then integer-divide by years(1)

birth <- ymd("1995-08-22")
my_age <- (birth ___ today()) ___ years(1)
my_age
```

<details>
<summary>Click to reveal solution</summary>

```r
birth <- ymd("1995-08-22")
my_age <- (birth %--% today()) %/% years(1)
my_age
#> [1] 30
```

**Explanation:** The `%--%` operator creates an interval from the birthdate to today. Dividing by `years(1)` with the integer division operator `%/%` gives the number of complete years, the person's age. This handles leap years and varying month lengths correctly, which makes it more reliable than dividing a day count by 365.25.

</details>

[TIP]
**The %--% operator creates an interval; divide by years(1) or months(1) with %/% to get whole units.** This is the most reliable way to calculate ages or durations in human-friendly units, because it respects calendar irregularities that simple day-counting misses.

**Try it:** How many complete months are in the interval from `"2024-03-01"` to `"2024-11-15"`?

```r
# Try it: complete months in an interval
ex_months <- (ymd("2024-03-01") %--% ymd("2024-11-15")) %/% months(___)
ex_months
#> Expected: 8
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_months <- (ymd("2024-03-01") %--% ymd("2024-11-15")) %/% months(1)
ex_months
#> [1] 8
```

**Explanation:** From March 1 to November 15 spans 8 complete months (March 1 to November 1 is exactly 8 months, and the remaining 15 days don't complete a 9th month). The `%/%` operator floors to the nearest whole number.

</details>

## Practice Exercises

These capstone exercises combine multiple concepts from the problems above. They're harder than the individual exercises, take your time and refer back to earlier solutions if needed.

### Exercise 1: Parse mixed-format dates and find the span

You have a vector of 5 date strings in different formats. Parse all of them into Date objects, sort them chronologically, and calculate the number of days between the earliest and latest dates.

```r
# Capstone 1: Parse mixed formats and find the date span
# Hint: use different lubridate parse functions for each format,
# then combine into a vector, sort, and subtract

dates_raw <- c("2024-01-15", "March 3, 2024", "15/06/2024",
               "2024-09-01", "01-Dec-2024")

# Parse each one:

# Sort and find the span:

```

<details>
<summary>Click to reveal solution</summary>

```r
dates_raw <- c("2024-01-15", "March 3, 2024", "15/06/2024",
               "2024-09-01", "01-Dec-2024")

dates_parsed <- c(
  ymd(dates_raw[1]),
  mdy(dates_raw[2]),
  dmy(dates_raw[3]),
  ymd(dates_raw[4]),
  dmy(dates_raw[5])
)

dates_sorted <- sort(dates_parsed)
dates_sorted
#> [1] "2024-01-15" "2024-03-03" "2024-06-15" "2024-09-01" "2024-12-01"

span <- as.numeric(max(dates_sorted) - min(dates_sorted))
span
#> [1] 321
```

**Explanation:** Each date string requires a different parsing function because the component order varies. After parsing, `sort()` arranges them chronologically. The span is the difference between the latest (Dec 1) and earliest (Jan 15) dates, 321 days. In real data pipelines, you'd often detect the format programmatically, but knowing which function to use for each format is the fundamental skill.

</details>

### Exercise 2: Compute exact age as years, months, and days

Given a birthdate of `"1990-05-17"` and a target date of `"2026-04-12"`, compute the exact age as "X years, Y months, Z days" using lubridate's interval and period functions.

```r
# Capstone 2: Exact age breakdown
# Hint: create an interval, convert to period with as.period(),
# then extract year, month, day components

bday <- ymd("1990-05-17")
target <- ymd("2026-04-12")

# Create interval and convert to period:

# Extract and print "X years, Y months, Z days":

```

<details>
<summary>Click to reveal solution</summary>

```r
bday <- ymd("1990-05-17")
target <- ymd("2026-04-12")

age_period <- as.period(bday %--% target)
age_period
#> [1] "35y 10m 26d 0H 0M 0S"

paste(year(age_period), "years,",
      month(age_period), "months,",
      day(age_period), "days")
#> [1] "35 years, 10 months, 26 days"
```

**Explanation:** `as.period()` converts an interval into human-readable components. You can then extract the year, month, and day parts individually using the same component functions you use on dates. This approach correctly handles varying month lengths and leap years, much more reliable than dividing total days by 365.25 and 30.44.

</details>

## Complete Example

Let's tie everything together with a practical scenario. You're planning a conference on October 15, 2024. You need to compute key deadlines, show them in multiple timezones for international attendees, and track how many days remain.

```r
# Event Planning Timeline
library(lubridate)

# 1. Set the event date and time
event_date <- ymd_hms("2024-10-15 09:00:00", tz = "America/Chicago")
event_date
#> [1] "2024-10-15 09:00:00 CDT"

# 2. Compute registration deadlines
reg_open <- event_date - months(3)
reg_close <- event_date - days(7)
early_bird <- event_date - months(1)

cat("Registration opens:", as.character(reg_open), "\n")
#> Registration opens: 2024-07-15 09:00:00
cat("Early bird ends:   ", as.character(early_bird), "\n")
#> Early bird ends:    2024-09-15 09:00:00
cat("Registration closes:", as.character(reg_close), "\n")
#> Registration closes: 2024-10-08 09:00:00

# 3. Show the event time in multiple timezones
cat("\nEvent start times around the world:\n")
cat("Chicago:  ", as.character(event_date), "\n")
#> Chicago:   2024-10-15 09:00:00
cat("London:   ", as.character(with_tz(event_date, "Europe/London")), "\n")
#> London:    2024-10-15 15:00:00
cat("Tokyo:    ", as.character(with_tz(event_date, "Asia/Tokyo")), "\n")
#> Tokyo:     2024-10-15 23:00:00
cat("Sydney:   ", as.character(with_tz(event_date, "Australia/Sydney")), "\n")
#> Sydney:    2024-10-16 01:00:00

# 4. Days remaining from today
days_left <- as.numeric(as.Date(event_date) - today())
cat("\nDays until event:", days_left, "\n")
#> Days until event: -914

# 5. Is today within the registration window?
reg_window <- as.Date(reg_open) %--% as.Date(reg_close)
today() %within% reg_window
#> [1] FALSE
```

This example combines date parsing (`ymd_hms()`), period arithmetic (`months()`, `days()`), timezone conversion (`with_tz()`), date subtraction, and interval testing (`%--%`, `%within%`), all the skills from the 10 exercises above. In your own projects, you'll use exactly these patterns whenever you work with scheduling, logging, or any time-stamped data.

## Summary

| Exercise | Skill Tested | Key Function(s) |
|---|---|---|
| 1 | Parse date from string | `ymd()` |
| 2 | Parse multiple formats | `mdy()`, `dmy()` |
| 3 | Extract date components | `year()`, `month()`, `wday()` |
| 4 | Modify date components | `month(x) <- value` |
| 5 | Date arithmetic with periods | `days()`, `months()`, `%m+%` |
| 6 | Calculate date difference | Date subtraction + `as.numeric()` |
| 7 | Parse datetime + timezone conversion | `ymd_hms()`, `with_tz()` |
| 8 | Extract components across timezones | `hour()` |
| 9 | Interval creation + membership test | `%--%`, `%within%` |
| 10 | Calculate age in complete years | `%--%`, `%/%`, `years()` |

**Key takeaways:**

- The parse function name matches the component order: `ymd()`, `mdy()`, `dmy()`, lubridate handles separators automatically
- Component functions (`year()`, `month()`, `day()`) work as both getters and setters
- `months()` adds calendar months (which can produce NA on invalid dates); `days()` always adds exact days
- `with_tz()` converts display (same instant), `force_tz()` changes the instant (same clock reading)
- `%--%` creates intervals, `%within%` tests membership, and `%/%` with `years(1)` or `months(1)` gives whole units

## References

1. Spinu, V., Grolemund, G., & Wickham, H., "Dates and Times Made Easy with lubridate." *Journal of Statistical Software*, 40(3), 2011. [Link](https://www.jstatsoft.org/article/view/v040i03)
2. lubridate documentation, CRAN reference manual. [Link](https://cran.r-project.org/web/packages/lubridate/lubridate.pdf)
3. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 17: Dates and Times. [Link](https://r4ds.hadley.nz/datetimes.html)
4. lubridate tidyverse documentation, Function reference and vignettes. [Link](https://lubridate.tidyverse.org/)
5. R Core Team, `?DateTimeClasses`, Base R documentation for POSIXct and POSIXlt classes. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html)

## Continue Learning

- [lubridate in R](lubridate-in-R.html), Full lubridate tutorial covering every function used in these exercises, with detailed explanations and more examples
- [R String Exercises](R-String-Exercises.html), Practice R string manipulation with 10 stringr problems, similar format to this exercise set
- [R Syntax 101](R-Syntax-101.html), Foundational R syntax covering assignment, operators, and basic data types if you need a refresher
