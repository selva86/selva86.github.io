---
title: "lubridate Exercises in R: 28 Real Practice Problems"
slug: "lubridate-Exercises-in-R"
description: "lubridate exercises in R: 28 hands-on problems on parsing, components, arithmetic, intervals, rounding, and time zones. Hidden solutions, runnable code."
keywords: "lubridate exercises, dates in R, lubridate practice, parse_date_time, ymd, interval, with_tz, floor_date, R datetime exercises"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "lubridate Exercises"
sidebar_order: 112
fr_parent: "lubridate-in-R.html"
auto_link_terms: "lubridate exercises|dates in R exercises|parse dates in R|lubridate practice|R datetime exercises"
auto_link_case_sensitive: false
target_keyword: "lubridate exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# lubridate Exercises in R: 28 Real Practice Problems

<p class="lead">Twenty-eight practice problems covering the full lubridate workflow: parsing messy strings, pulling out components, arithmetic with periods and durations, intervals, rounding, time zones, and end-to-end date-column workflows. Each problem ships with a hidden solution and an explanation of why that approach wins.</p>

```r title="Run this once before any exercise"
library(lubridate)
library(dplyr)
library(tibble)
library(tidyr)
```

## Section 1. Parsing dates and datetimes (5 problems)

### Exercise 1.1: Parse a vector of ISO date strings with ymd

**Task:** A junior analyst receives a column of dates as character strings in ISO format ("2024-01-15", "2024-03-02", "2024-11-30"). Use `ymd()` to convert the three strings into a Date vector that R can sort and subtract. Save the result to `ex_1_1`.

**Expected result:**

```
#> [1] "2024-01-15" "2024-03-02" "2024-11-30"
```

**Difficulty:** Beginner

[HINTS]
Think about which component comes first in an ISO string and let a parser infer the rest from a clean year-month-day order.
Pass the character vector straight into `ymd()` and assign the result to `ex_1_1`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ymd(c("2024-01-15", "2024-03-02", "2024-11-30"))
ex_1_1
#> [1] "2024-01-15" "2024-03-02" "2024-11-30"
class(ex_1_1)
#> [1] "Date"
```

**Explanation:** `ymd()` is the right helper because the input is year-month-day. The same vector parsed with `as.Date()` would also work for this exact shape, but lubridate's parsers tolerate separators ("2024/01/15", "2024.01.15", "20240115") interchangeably without a format string. Sister functions: `mdy()`, `dmy()`, `ydm()`, `myd()`, `dym()` cover every component ordering.

</details>

### Exercise 1.2: Parse US-style dates with mdy

**Task:** A spreadsheet from a US partner ships dates as "07/04/2024", "12/25/2024", and "09/11/2024". Convert the three strings into proper Date objects using the appropriate lubridate parser, and save the resulting Date vector to `ex_1_2`.

**Expected result:**

```
#> [1] "2024-07-04" "2024-12-25" "2024-09-11"
```

**Difficulty:** Beginner

[HINTS]
US partners write the month before the day, so pick the parser whose component order matches that convention.
Use `mdy()` on the three-string vector to get ISO-normalized Date objects.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mdy(c("07/04/2024", "12/25/2024", "09/11/2024"))
ex_1_2
#> [1] "2024-07-04" "2024-12-25" "2024-09-11"
```

**Explanation:** US partners almost always send month-first dates, so `mdy()` is the natural choice. The output is normalized to ISO format regardless of the input pattern, which is what makes lubridate parsers safe in pipelines: downstream code sees `Date` objects, not strings. A common mistake is to use `ymd()` here: it will silently return `NA` because "07" is not a valid year prefix in that context.

</details>

### Exercise 1.3: Parse mixed-format timestamps with parse_date_time

**Task:** The audit team exports a log file where timestamps arrive in three different shapes: "2024-01-15 09:30:00", "01/15/2024 09:30", and "Jan 15, 2024 9:30 AM". Use `parse_date_time()` with multiple `orders` to coerce all three into a single `POSIXct` vector. Save it to `ex_1_3`.

**Expected result:**

```
#> [1] "2024-01-15 09:30:00 UTC" "2024-01-15 09:30:00 UTC" "2024-01-15 09:30:00 UTC"
```

**Difficulty:** Intermediate

[HINTS]
When inputs arrive in several shapes, you need one parser that can try multiple layouts against each value.
Call `parse_date_time()` with an `orders` vector such as `c("Ymd HMS", "mdy HM", "b d, Y I:M p")`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c("2024-01-15 09:30:00", "01/15/2024 09:30", "Jan 15, 2024 9:30 AM")
ex_1_3 <- parse_date_time(raw, orders = c("Ymd HMS", "mdy HM", "b d, Y I:M p"))
ex_1_3
#> [1] "2024-01-15 09:30:00 UTC" "2024-01-15 09:30:00 UTC" "2024-01-15 09:30:00 UTC"
```

**Explanation:** `parse_date_time()` tries each format string in `orders` against each input until one parses cleanly. The format tokens are lubridate's own (Y = 4-digit year, b = abbreviated month, I = 12-hour, p = AM/PM marker), not strptime tokens. The result is always UTC unless you pass `tz=`. When inputs are heterogeneous this is the only parser that scales; calling `ymd_hms()` on the whole vector would return `NA` for two of three rows.

</details>

### Exercise 1.4: Parse a datetime column inside a tibble

**Task:** A product analytics team ships a tibble where `event_ts` is character. Build the tibble inline below, then use `mutate()` plus `ymd_hms()` to coerce `event_ts` into a `POSIXct` column. Save the new tibble to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   event_id event_ts
#>      <int> <dttm>
#> 1        1 2024-04-10 08:15:00
#> 2        2 2024-04-10 09:42:30
#> 3        3 2024-04-10 11:05:15
```

**Difficulty:** Intermediate

[HINTS]
Coerce the column where it lives so its type flips from character to datetime without leaving the tibble.
Inside `mutate()`, reassign `event_ts` with `ymd_hms()`.

```r title="Your turn"
events <- tibble(
  event_id = 1:3,
  event_ts = c("2024-04-10 08:15:00", "2024-04-10 09:42:30", "2024-04-10 11:05:15")
)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(
  event_id = 1:3,
  event_ts = c("2024-04-10 08:15:00", "2024-04-10 09:42:30", "2024-04-10 11:05:15")
)
ex_1_4 <- events |> mutate(event_ts = ymd_hms(event_ts))
ex_1_4
#> # A tibble: 3 x 2
#>   event_id event_ts
#>      <int> <dttm>
#> 1        1 2024-04-10 08:15:00
#> 2        2 2024-04-10 09:42:30
#> 3        3 2024-04-10 11:05:15
```

**Explanation:** Coercing inside `mutate()` is the canonical tidy pattern: the column type changes from `<chr>` to `<dttm>` and every downstream date function (filters, groupings, joins) starts working without further coercion. `ymd_hms()` is strict by default: anything that does not match returns `NA` with a warning. Pass `quiet = TRUE` to silence the warning when you have already verified the input shape.

</details>

### Exercise 1.5: Convert an Excel serial date to a real Date

**Task:** A finance team forwards an export where dates arrived as integers (Excel's serial format counting days since 1899-12-30). Given the vector `c(45298, 45299, 45300)`, convert it to proper Date objects using `as_date()` with the right `origin`. Save the Date vector to `ex_1_5`.

**Expected result:**

```
#> [1] "2024-01-12" "2024-01-13" "2024-01-14"
```

**Difficulty:** Intermediate

[HINTS]
Excel counts days from a fixed baseline date, so the conversion needs that baseline supplied explicitly.
Call `as_date()` with `origin = "1899-12-30"` on the serial vector.

```r title="Your turn"
serial <- c(45298, 45299, 45300)
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
serial <- c(45298, 45299, 45300)
ex_1_5 <- as_date(serial, origin = "1899-12-30")
ex_1_5
#> [1] "2024-01-12" "2024-01-13" "2024-01-14"
```

**Explanation:** Excel counts days from 1899-12-30 (not 1900-01-01) because of a quirky leap-year bug Microsoft preserved for compatibility. Passing the wrong origin is the single most common reason finance data looks two days off. `as_date()` is the lubridate cousin of base `as.Date()` and accepts both character inputs and numeric serials. For Excel datetimes (with fractional days for the time portion) use `as_datetime(x * 86400, origin = "1899-12-30")`.

</details>

## Section 2. Extracting and modifying components (5 problems)

### Exercise 2.1: Pull year, month, and day into separate columns

**Task:** Given a tibble of three dates, build a new tibble with three additional columns named `yr`, `mo`, and `dy` containing the year, month, and day extracted with the obvious lubridate accessor functions. Save the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   dt            yr    mo    dy
#>   <date>     <dbl> <dbl> <int>
#> 1 2024-01-15  2024     1    15
#> 2 2024-06-30  2024     6    30
#> 3 2024-12-31  2024    12    31
```

**Difficulty:** Beginner

[HINTS]
Each calendar part has its own accessor that returns one number per row, and they all vectorize over a column.
In `mutate()`, set `yr = year(dt)`, `mo = month(dt)`, and `dy = day(dt)`.

```r title="Your turn"
dates_tbl <- tibble(dt = ymd(c("2024-01-15", "2024-06-30", "2024-12-31")))
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dates_tbl <- tibble(dt = ymd(c("2024-01-15", "2024-06-30", "2024-12-31")))
ex_2_1 <- dates_tbl |>
  mutate(yr = year(dt), mo = month(dt), dy = day(dt))
ex_2_1
#> # A tibble: 3 x 4
#>   dt            yr    mo    dy
#>   <date>     <dbl> <dbl> <int>
#> 1 2024-01-15  2024     1    15
#> 2 2024-06-30  2024     6    30
#> 3 2024-12-31  2024    12    31
```

**Explanation:** `year()`, `month()`, and `day()` each return a numeric vector the same length as the input. They are vectorized, so they work inside `mutate()` over an entire column with no loop. Pass `label = TRUE` to `month()` for ordered factors ("Jan", "Feb"). The numeric form is what you want for joins, sorting, and arithmetic; the labelled form is what you want for plots and tables.

</details>

### Exercise 2.2: Bucket transactions by day-of-week label

**Task:** A retailer wants to know which weekday each transaction happened on for staffing analysis. Given a Date column, add a `weekday` column with abbreviated three-letter labels ("Mon", "Tue", ...) using `wday(label = TRUE, abbr = TRUE)` and `week_start = 1`. Save the tibble to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   txn_dt     weekday
#>   <date>     <ord>
#> 1 2024-04-08 Mon
#> 2 2024-04-09 Tue
#> 3 2024-04-10 Wed
#> 4 2024-04-13 Sat
#> 5 2024-04-14 Sun
```

**Difficulty:** Beginner

[HINTS]
You need the weekday name rather than a number, and you also control which day the week begins on.
Use `wday()` with `label = TRUE`, `abbr = TRUE`, and `week_start = 1`.

```r title="Your turn"
txns <- tibble(txn_dt = ymd(c("2024-04-08", "2024-04-09", "2024-04-10", "2024-04-13", "2024-04-14")))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
txns <- tibble(txn_dt = ymd(c("2024-04-08", "2024-04-09", "2024-04-10", "2024-04-13", "2024-04-14")))
ex_2_2 <- txns |>
  mutate(weekday = wday(txn_dt, label = TRUE, abbr = TRUE, week_start = 1))
ex_2_2
#> # A tibble: 5 x 2
#>   txn_dt     weekday
#>   <date>     <ord>
#> 1 2024-04-08 Mon
#> 2 2024-04-09 Tue
#> 3 2024-04-10 Wed
#> 4 2024-04-13 Sat
#> 5 2024-04-14 Sun
```

**Explanation:** `wday()` defaults to Sunday as day 1 (US convention). Most international and business contexts start the week on Monday: setting `week_start = 1` keeps "Sat" and "Sun" together at the end, which matches how staffing schedules read. The `label = TRUE` flag returns an ordered factor, so plots and tables render in weekday order rather than alphabetical order.

</details>

### Exercise 2.3: Compute ISO week and ISO year for a weekly report

**Task:** The finance team publishes a weekly KPI rollup keyed by ISO week (week 1 contains the first Thursday of the year). Given a Date column, add `iso_yr` (the ISO 8601 year) and `iso_wk` (the ISO 8601 week number) using `isoyear()` and `isoweek()`. Save the tibble to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   dt         iso_yr iso_wk
#>   <date>      <dbl>  <dbl>
#> 1 2023-01-01   2022     52
#> 2 2024-01-01   2024      1
#> 3 2024-12-30   2025      1
#> 4 2024-12-31   2025      1
```

**Difficulty:** Intermediate

[HINTS]
Week numbering near year boundaries follows a separate calendar, so pull both the week and the year that belongs to it.
Add `iso_yr = isoyear(dt)` and `iso_wk = isoweek(dt)` inside `mutate()`.

```r title="Your turn"
wk_tbl <- tibble(dt = ymd(c("2023-01-01", "2024-01-01", "2024-12-30", "2024-12-31")))
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
wk_tbl <- tibble(dt = ymd(c("2023-01-01", "2024-01-01", "2024-12-30", "2024-12-31")))
ex_2_3 <- wk_tbl |>
  mutate(iso_yr = isoyear(dt), iso_wk = isoweek(dt))
ex_2_3
#> # A tibble: 4 x 3
#>   dt         iso_yr iso_wk
#>   <date>      <dbl>  <dbl>
#> 1 2023-01-01   2022     52
#> 2 2024-01-01   2024      1
#> 3 2024-12-30   2025      1
#> 4 2024-12-31   2025      1
```

**Explanation:** ISO weeks live on a different calendar than wall-clock years near boundaries: the last days of December 2024 belong to ISO week 1 of 2025 because that week contains the first Thursday of 2025. Always pair `isoweek()` with `isoyear()`; if you group by `isoweek()` alone you will merge week 52 of two different years. The base `format(x, "%V")` returns the same number but as character.

</details>

### Exercise 2.4: Build a fiscal quarter offset by three months

**Task:** A finance team runs a fiscal year that starts April 1 (so Apr-Jun is fiscal Q1). Given a Date column, compute `fiscal_q` (1 through 4) using `quarter()` with the `fiscal_start` argument. Save the tibble to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   dt         fiscal_q
#>   <date>        <int>
#> 1 2024-04-15        1
#> 2 2024-07-20        2
#> 3 2024-10-05        3
#> 4 2025-02-28        4
```

**Difficulty:** Intermediate

[HINTS]
Shifting where the year begins also moves where each quarter starts, so the function needs to know the first month.
Call `quarter()` with `fiscal_start = 4`.

```r title="Your turn"
fq <- tibble(dt = ymd(c("2024-04-15", "2024-07-20", "2024-10-05", "2025-02-28")))
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fq <- tibble(dt = ymd(c("2024-04-15", "2024-07-20", "2024-10-05", "2025-02-28")))
ex_2_4 <- fq |>
  mutate(fiscal_q = quarter(dt, fiscal_start = 4))
ex_2_4
#> # A tibble: 4 x 2
#>   dt         fiscal_q
#>   <date>        <int>
#> 1 2024-04-15        1
#> 2 2024-07-20        2
#> 3 2024-10-05        3
#> 4 2025-02-28        4
```

**Explanation:** `fiscal_start` shifts the quarter boundaries so that the named month becomes the first month of Q1. Without it, lubridate returns calendar quarters (Jan-Mar = Q1). Pass `with_year = TRUE` to get a "2025.1" style label that encodes both the fiscal year and quarter. A common mistake is to hand-roll this with `month() %/% 3`, which silently breaks across year boundaries.

</details>

### Exercise 2.5: Replace just the year on a date

**Task:** Use the assignment form of `year()` on a copy of a Date vector to roll three dates forward by one year, keeping the same month and day on each row. Operate on `ymd(c("2024-01-15", "2024-06-30", "2024-12-31"))` and save the modified Date vector to `ex_2_5`.

**Expected result:**

```
#> [1] "2025-01-15" "2025-06-30" "2025-12-31"
```

**Difficulty:** Intermediate

[HINTS]
Some component accessors can be written to, not just read from, mutating the date in place.
Copy the vector, then assign into `year(ex_2_5) <- year(ex_2_5) + 1`.

```r title="Your turn"
dts <- ymd(c("2024-01-15", "2024-06-30", "2024-12-31"))
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dts <- ymd(c("2024-01-15", "2024-06-30", "2024-12-31"))
ex_2_5 <- dts
year(ex_2_5) <- year(ex_2_5) + 1
ex_2_5
#> [1] "2025-01-15" "2025-06-30" "2025-12-31"
```

**Explanation:** The component accessors (`year()`, `month()`, `day()`, `hour()`, etc.) all have a replacement form that mutates in place. This is one of the few cases in R where assignment into a function call is idiomatic. The replacement is element-wise, so the operation vectorizes. A trap: rolling Feb 29 forward by one year produces March 1 because Feb 29 does not exist in non-leap years; use `add_with_rollback()` to control that behavior explicitly.

</details>

## Section 3. Date arithmetic with periods and durations (5 problems)

### Exercise 3.1: Compare adding 30 days versus adding one month

**Task:** Take the date "2024-01-31" and produce two results: one by adding `days(30)` and another by adding `months(1)`. Both come out different. Return a length-2 named list called `ex_3_1` with elements `plus_30_days` and `plus_one_month` showing both Date results so you can see the difference.

**Expected result:**

```
#> $plus_30_days
#> [1] "2024-03-01"
#>
#> $plus_one_month
#> [1] NA
```

**Difficulty:** Intermediate

[HINTS]
A fixed count of days and a calendar month are not the same length of time, so they land on different dates.
Build a named list adding `days(30)` and `months(1)` to `start_dt`.

```r title="Your turn"
start_dt <- ymd("2024-01-31")
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
start_dt <- ymd("2024-01-31")
ex_3_1 <- list(
  plus_30_days   = start_dt + days(30),
  plus_one_month = start_dt + months(1)
)
ex_3_1
#> $plus_30_days
#> [1] "2024-03-01"
#>
#> $plus_one_month
#> [1] NA
```

**Explanation:** `days(30)` is a fixed-length period (always 30 actual days, so Jan 31 plus 30 days is March 1 in 2024 because February has 29 days). `months(1)` tries to land on Feb 31, which does not exist, so it returns `NA`. This trip-up costs analysts hours every year. Use `%m+%` (next exercise) to make the month addition safe by clamping to the last valid day.

</details>

### Exercise 3.2: Safely add months across short-month boundaries

**Task:** Take "2024-01-31" and add one month using the `%m+%` operator (which rolls back to the last valid day of the target month), then add three more months using the same operator. Save a length-2 Date vector of the two answers to `ex_3_2`.

**Expected result:**

```
#> [1] "2024-02-29" "2024-04-30"
```

**Difficulty:** Intermediate

[HINTS]
There is an operator that clamps an invalid landing date back to the last real day of the target month.
Use `%m+% months(1)` and `%m+% months(4)` on `start_dt`.

```r title="Your turn"
start_dt <- ymd("2024-01-31")
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
start_dt <- ymd("2024-01-31")
ex_3_2 <- c(start_dt %m+% months(1), start_dt %m+% months(4))
ex_3_2
#> [1] "2024-02-29" "2024-04-30"
```

**Explanation:** `%m+%` rolls invalid landing dates back to the last day of the target month: Jan 31 + 1 month becomes Feb 29 (or Feb 28 in non-leap years), Jan 31 + 4 months becomes April 30 because April has only 30 days. The companion `%m-%` does the same for subtraction. Always use these operators when computing month-end series, billing dates, or fiscal anchors.

</details>

### Exercise 3.3: Compute age in years from birthdate to a fixed reference date

**Task:** An HR analyst needs every employee's age in completed years as of "2026-05-12". Given a vector of three birthdates, compute the age by dividing the `interval()` from birthdate to the reference date by `years(1)` and flooring to whole years. Save the integer ages to `ex_3_3`.

**Expected result:**

```
#> [1] 34 41 29
```

**Difficulty:** Intermediate

[HINTS]
Dividing a span of time by a one-year unit yields a leap-year-correct fractional age you can then truncate.
Compute `interval(birthdates, ref_dt) / years(1)`, then apply `floor()` and `as.integer()`.

```r title="Your turn"
birthdates <- ymd(c("1991-08-12", "1985-02-03", "1997-06-15"))
ref_dt <- ymd("2026-05-12")
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
birthdates <- ymd(c("1991-08-12", "1985-02-03", "1997-06-15"))
ref_dt <- ymd("2026-05-12")
ex_3_3 <- as.integer(floor(interval(birthdates, ref_dt) / years(1)))
ex_3_3
#> [1] 34 41 29
```

**Explanation:** Dividing an `interval` by `years(1)` gives a fractional age that respects leap years correctly (each year in the interval is 365 or 366 days depending on which calendar years it spans). Naively dividing days by 365.25 is off-by-one for some birthdates near year boundaries. `floor()` then `as.integer()` produces the "completed years" most legal and HR contexts require. For age at a vector of reference dates, both inputs vectorize.

</details>

### Exercise 3.4: Count business days between two dates

**Task:** A settlements team needs to know how many business days (Mon-Fri) fall in a half-open interval from "2024-04-01" inclusive to "2024-04-15" exclusive. Generate the date sequence, drop weekends with `wday()`, then count. Save the integer count to `ex_3_4`.

**Expected result:**

```
#> [1] 10
#> (14 calendar days minus 4 weekend days = 10 business days)
```

**Difficulty:** Advanced

[HINTS]
Build every day in the half-open range first, then keep only the ones that are not weekend days.
Use `seq()` up to `end_dt - days(1)`, then `sum(wday(all_days, week_start = 1) <= 5)`.

```r title="Your turn"
start_dt <- ymd("2024-04-01")
end_dt   <- ymd("2024-04-15")
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
start_dt <- ymd("2024-04-01")
end_dt   <- ymd("2024-04-15")
all_days <- seq(start_dt, end_dt - days(1), by = "day")
ex_3_4 <- sum(wday(all_days, week_start = 1) <= 5)
ex_3_4
#> [1] 10
```

**Explanation:** `seq.Date()` from `start` to `end - days(1)` produces the half-open range (14 days). Filtering by `wday() <= 5` keeps Monday through Friday when `week_start = 1`. April 2024 starts on a Monday, so the 14 days include two full Mon-Fri weeks and contribute 10 business days. For holiday-aware business days use `bizdays::bizdays()` or `RQuantLib::businessDaysBetween()`, both of which read a holiday calendar.

</details>

### Exercise 3.5: Convert a duration into decimal weeks

**Task:** Given two timestamps "2024-03-01 09:00:00" and "2024-04-15 17:30:00" parsed as UTC, compute the elapsed `duration` between them and convert it to a decimal number of weeks. Save the numeric value (rounded to three decimal places) to `ex_3_5`.

**Expected result:**

```
#> [1] 6.512
```

**Difficulty:** Intermediate

[HINTS]
Force the elapsed time into a fixed-seconds representation so dividing it by one week is deterministic.
Use `as.duration(t2 - t1) / dweeks(1)` and wrap it in `round(..., 3)`.

```r title="Your turn"
t1 <- ymd_hms("2024-03-01 09:00:00")
t2 <- ymd_hms("2024-04-15 17:30:00")
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t1 <- ymd_hms("2024-03-01 09:00:00")
t2 <- ymd_hms("2024-04-15 17:30:00")
ex_3_5 <- round(as.duration(t2 - t1) / dweeks(1), 3)
ex_3_5
#> [1] 6.512
```

**Explanation:** Subtracting two `POSIXct` values gives a `difftime` whose units depend on magnitude; coercing to `as.duration()` forces a fixed-seconds representation so the division by `dweeks(1)` (one week of seconds = 604800) is deterministic. Use `dweeks()` not `weeks()`: the former is a duration (exact seconds), the latter is a period (variable seconds across DST). For human-readable durations, `as.period(t2 - t1)` reports months/days/hours/etc.

</details>

## Section 4. Intervals and overlaps (4 problems)

### Exercise 4.1: Test whether dates fall inside a campaign window

**Task:** A marketing campaign ran from "2024-06-01" through "2024-06-30" inclusive. Given a vector of three event dates, build an `interval()` for the campaign window and use `%within%` to return a logical vector of length three indicating which events fell inside. Save the logical vector to `ex_4_1`.

**Expected result:**

```
#> [1] FALSE  TRUE  TRUE
```

**Difficulty:** Intermediate

[HINTS]
You are testing membership of each date inside a single time span, which produces one logical per date.
Apply the `%within%` operator: `event_dts %within% campaign`.

```r title="Your turn"
event_dts <- ymd(c("2024-05-31", "2024-06-15", "2024-06-30"))
campaign <- interval(ymd("2024-06-01"), ymd("2024-06-30"))
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
event_dts <- ymd(c("2024-05-31", "2024-06-15", "2024-06-30"))
campaign <- interval(ymd("2024-06-01"), ymd("2024-06-30"))
ex_4_1 <- event_dts %within% campaign
ex_4_1
#> [1] FALSE  TRUE  TRUE
```

**Explanation:** `%within%` is inclusive on both endpoints, so June 30 returns `TRUE`. The left operand vectorizes: you can test a long event column against a single campaign interval or against a vector of intervals (one campaign per row). For half-open semantics use `event_dts >= int_start(campaign) & event_dts < int_end(campaign)` instead.

</details>

### Exercise 4.2: Detect overlapping appointments

**Task:** A scheduling coordinator built two appointment intervals and needs to flag whether they overlap before double-booking a conference room. Use `int_overlaps()` on the two intervals defined inline below and save the single logical result to `ex_4_2`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
You need to know whether two spans share any moment in time, returning a single logical.
Call `int_overlaps()` on `appt_a` and `appt_b`.

```r title="Your turn"
appt_a <- interval(ymd_hms("2024-04-10 09:00:00"), ymd_hms("2024-04-10 10:30:00"))
appt_b <- interval(ymd_hms("2024-04-10 10:00:00"), ymd_hms("2024-04-10 11:00:00"))
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
appt_a <- interval(ymd_hms("2024-04-10 09:00:00"), ymd_hms("2024-04-10 10:30:00"))
appt_b <- interval(ymd_hms("2024-04-10 10:00:00"), ymd_hms("2024-04-10 11:00:00"))
ex_4_2 <- int_overlaps(appt_a, appt_b)
ex_4_2
#> [1] TRUE
```

**Explanation:** `int_overlaps()` returns `TRUE` when two intervals share any point in time, including touching endpoints. Both arguments vectorize, so you can compare every appointment in a calendar against every other appointment by passing column vectors. For finding the overlapping subinterval itself use `intersect(appt_a, appt_b)`, which returns the shared `Interval` or `NA` if disjoint.

</details>

### Exercise 4.3: Sum overlap days against a target window

**Task:** A resource utilization analyst has three project intervals and needs the total number of days each project overlaps with a target reporting window of "2024-04-01" to "2024-04-30". For each project, intersect with the target window then divide by `days(1)`. Save a length-3 numeric vector to `ex_4_3` (treat negative or `NA` results as 0).

**Expected result:**

```
#> [1] 10  9 30
```

**Difficulty:** Advanced

[HINTS]
Find the shared span for each project, measure it in days, and treat any disjoint case as zero.
Use `intersect(projects, target)`, divide by `days(1)`, then clamp with `pmax(0, ..., na.rm = TRUE)`.

```r title="Your turn"
target <- interval(ymd("2024-04-01"), ymd("2024-04-30"))
projects <- c(
  interval(ymd("2024-03-22"), ymd("2024-04-10")),
  interval(ymd("2024-04-22"), ymd("2024-05-30")),
  interval(ymd("2024-03-01"), ymd("2024-06-15"))
)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
target <- interval(ymd("2024-04-01"), ymd("2024-04-30"))
projects <- c(
  interval(ymd("2024-03-22"), ymd("2024-04-10")),
  interval(ymd("2024-04-22"), ymd("2024-05-30")),
  interval(ymd("2024-03-01"), ymd("2024-06-15"))
)
overlap <- intersect(projects, target)
ex_4_3 <- pmax(0, as.numeric(overlap / days(1)), na.rm = TRUE)
ex_4_3
#> [1] 10  9 30
```

**Explanation:** `intersect()` vectorized over two `Interval` vectors returns a vector of intersection intervals (or `NA` when disjoint). Dividing by `days(1)` converts each to a numeric day count. `pmax(0, ..., na.rm = TRUE)` clamps any `NA` (disjoint) to zero so the resulting vector is always non-negative and finite. This pattern generalizes to billable-hour tracking, contract-coverage audits, and any overlap-quantification problem.

</details>

### Exercise 4.4: Filter a tibble rows whose timestamp falls inside an interval

**Task:** Given a tibble of five events with timestamps, retain only the rows whose `ts` falls inside the interval starting at "2024-04-10 09:00:00" and ending at "2024-04-10 12:00:00". Use `filter()` with `%within%`. Save the filtered tibble to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>      id ts
#>   <int> <dttm>
#> 1     2 2024-04-10 09:30:00
#> 2     3 2024-04-10 10:45:00
#> 3     4 2024-04-10 12:00:00
```

**Difficulty:** Intermediate

[HINTS]
Keep only the rows whose timestamp sits inside the given time span.
Inside `filter()`, test `ts %within% win`.

```r title="Your turn"
events <- tibble(
  id = 1:5,
  ts = ymd_hms(c("2024-04-10 08:30:00", "2024-04-10 09:30:00",
                 "2024-04-10 10:45:00", "2024-04-10 12:00:00",
                 "2024-04-10 13:15:00"))
)
win <- interval(ymd_hms("2024-04-10 09:00:00"), ymd_hms("2024-04-10 12:00:00"))
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(
  id = 1:5,
  ts = ymd_hms(c("2024-04-10 08:30:00", "2024-04-10 09:30:00",
                 "2024-04-10 10:45:00", "2024-04-10 12:00:00",
                 "2024-04-10 13:15:00"))
)
win <- interval(ymd_hms("2024-04-10 09:00:00"), ymd_hms("2024-04-10 12:00:00"))
ex_4_4 <- events |> filter(ts %within% win)
ex_4_4
#> # A tibble: 3 x 2
#>      id ts
#>   <int> <dttm>
#> 1     2 2024-04-10 09:30:00
#> 2     3 2024-04-10 10:45:00
#> 3     4 2024-04-10 12:00:00
```

**Explanation:** Using `%within%` inside `filter()` is the cleanest way to apply a closed time window because it reads like English and the inclusive-on-both-sides semantics match how non-technical stakeholders describe windows. The row at 12:00:00 sharp is kept because the interval is closed. If the requirement were exclusive on the right, use `filter(ts >= int_start(win), ts < int_end(win))`.

</details>

## Section 5. Rounding and flooring (3 problems)

### Exercise 5.1: Floor every transaction date to the first of its month

**Task:** A reporting analyst needs a monthly cohort key from a daily transaction date. Given a tibble with five dates spanning two months, add a `cohort_month` column that is each date floored to the first of its month using `floor_date(..., unit = "month")`. Save the result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   txn_dt     cohort_month
#>   <date>     <date>
#> 1 2024-03-04 2024-03-01
#> 2 2024-03-22 2024-03-01
#> 3 2024-03-31 2024-03-01
#> 4 2024-04-01 2024-04-01
#> 5 2024-04-15 2024-04-01
```

**Difficulty:** Beginner

[HINTS]
Snap each date backward to the start of its month so every date in a month shares one key.
In `mutate()`, set `cohort_month = floor_date(txn_dt, unit = "month")`.

```r title="Your turn"
txns <- tibble(txn_dt = ymd(c("2024-03-04", "2024-03-22", "2024-03-31", "2024-04-01", "2024-04-15")))
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
txns <- tibble(txn_dt = ymd(c("2024-03-04", "2024-03-22", "2024-03-31", "2024-04-01", "2024-04-15")))
ex_5_1 <- txns |>
  mutate(cohort_month = floor_date(txn_dt, unit = "month"))
ex_5_1
#> # A tibble: 5 x 2
#>   txn_dt     cohort_month
#>   <date>     <date>
#> 1 2024-03-04 2024-03-01
#> 2 2024-03-22 2024-03-01
#> 3 2024-03-31 2024-03-01
#> 4 2024-04-01 2024-04-01
#> 5 2024-04-15 2024-04-01
```

**Explanation:** `floor_date()` always rounds toward the past, so it is the right choice for cohort and reporting-period keys (every date in March maps to "2024-03-01"). Group-bys keyed on this column produce monthly aggregates without any manual `format()` string handling. The complementary `ceiling_date()` rounds forward; `round_date()` rounds to the nearest boundary.

</details>

### Exercise 5.2: Bucket events into Monday-starting weeks

**Task:** An ops team's weekly metrics start on Monday, not Sunday. Given a tibble of five event dates, add a `week_start` column that is each date floored to the most recent Monday using `floor_date()` with `week_start = 1`. Save the result to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   event_dt   week_start
#>   <date>     <date>
#> 1 2024-04-08 2024-04-08
#> 2 2024-04-10 2024-04-08
#> 3 2024-04-14 2024-04-08
#> 4 2024-04-15 2024-04-15
#> 5 2024-04-21 2024-04-15
```

**Difficulty:** Intermediate

[HINTS]
Round each date back to the most recent week start, where you decide which weekday opens the week.
Use `floor_date()` with `unit = "week"` and `week_start = 1`.

```r title="Your turn"
events <- tibble(event_dt = ymd(c("2024-04-08", "2024-04-10", "2024-04-14", "2024-04-15", "2024-04-21")))
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(event_dt = ymd(c("2024-04-08", "2024-04-10", "2024-04-14", "2024-04-15", "2024-04-21")))
ex_5_2 <- events |>
  mutate(week_start = floor_date(event_dt, unit = "week", week_start = 1))
ex_5_2
#> # A tibble: 5 x 2
#>   event_dt   week_start
#>   <date>     <date>
#> 1 2024-04-08 2024-04-08
#> 2 2024-04-10 2024-04-08
#> 3 2024-04-14 2024-04-08
#> 4 2024-04-15 2024-04-15
#> 5 2024-04-21 2024-04-15
```

**Explanation:** Without `week_start = 1`, lubridate floors to the previous Sunday (US default), which is rarely what business users want outside the United States. April 14, 2024 is a Sunday: the Monday-starting week containing it begins April 8. The `unit` argument also accepts "2 weeks", "10 minutes", or any multiple, so the same idiom buckets streaming events into arbitrary fixed windows.

</details>

### Exercise 5.3: Round noisy timestamps to the nearest 15-minute bucket

**Task:** A platform engineer wants to align 5 noisy event timestamps to the nearest 15-minute boundary for dashboard aggregation. Use `round_date()` with `unit = "15 minutes"` on the inline vector below. Save the rounded timestamps to `ex_5_3`.

**Expected result:**

```
#> [1] "2024-04-10 09:00:00 UTC" "2024-04-10 09:15:00 UTC" "2024-04-10 09:30:00 UTC"
#> [4] "2024-04-10 09:45:00 UTC" "2024-04-10 10:00:00 UTC"
```

**Difficulty:** Advanced

[HINTS]
Snap each timestamp to its nearest fixed-size time bucket rather than always rounding one direction.
Call `round_date()` with `unit = "15 minutes"`.

```r title="Your turn"
ts <- ymd_hms(c("2024-04-10 08:57:12", "2024-04-10 09:14:50",
                "2024-04-10 09:23:30", "2024-04-10 09:51:00",
                "2024-04-10 10:02:00"))
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ts <- ymd_hms(c("2024-04-10 08:57:12", "2024-04-10 09:14:50",
                "2024-04-10 09:23:30", "2024-04-10 09:51:00",
                "2024-04-10 10:02:00"))
ex_5_3 <- round_date(ts, unit = "15 minutes")
ex_5_3
#> [1] "2024-04-10 09:00:00 UTC" "2024-04-10 09:15:00 UTC" "2024-04-10 09:30:00 UTC"
#> [4] "2024-04-10 09:45:00 UTC" "2024-04-10 10:00:00 UTC"
```

**Explanation:** `round_date()` rounds to the nearest boundary (so 09:23:30 lands on 09:15 because it is 8:30 minutes past, less than half a bucket). The `unit` argument is a string that lubridate parses, so "5 minutes", "15 minutes", "30 secs", and "2 hours" all work. For deterministic half-bucket behavior (always rounding 09:22:30 down or always up) use `floor_date()` or `ceiling_date()` instead.

</details>

## Section 6. Time zones (3 problems)

### Exercise 6.1: Convert UTC server timestamps to local exchange time

**Task:** A trading desk runs servers in UTC but reviews fills in "America/New_York" local time. Given a UTC `POSIXct` vector, use `with_tz()` to display the same physical instants in New York local time. Save the converted vector to `ex_6_1`.

**Expected result:**

```
#> [1] "2024-04-10 05:30:00 EDT" "2024-04-10 09:45:00 EDT" "2024-04-10 14:15:00 EDT"
```

**Difficulty:** Intermediate

[HINTS]
Keep the physical instant fixed and change only the clock the audience reads it on.
Use `with_tz()` with `tzone = "America/New_York"`.

```r title="Your turn"
utc_ts <- ymd_hms(c("2024-04-10 09:30:00", "2024-04-10 13:45:00", "2024-04-10 18:15:00"), tz = "UTC")
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
utc_ts <- ymd_hms(c("2024-04-10 09:30:00", "2024-04-10 13:45:00", "2024-04-10 18:15:00"), tz = "UTC")
ex_6_1 <- with_tz(utc_ts, tzone = "America/New_York")
ex_6_1
#> [1] "2024-04-10 05:30:00 EDT" "2024-04-10 09:45:00 EDT" "2024-04-10 14:15:00 EDT"
```

**Explanation:** `with_tz()` keeps the absolute instant fixed and changes only the displayed wall-clock string and the printed zone abbreviation. The underlying numeric POSIXct value (seconds since 1970-01-01 UTC) does not change. Use it any time the physical event is the same but the audience reads a different clock: NYC trading desk reviewing UTC server logs, mobile analytics rolling up to user local time, audit teams reconciling logs across data centers.

</details>

### Exercise 6.2: Distinguish with_tz from force_tz on the same input

**Task:** Take the timestamp "2024-04-10 09:00:00 UTC" and produce two outputs side by side: one converted to "Asia/Kolkata" with `with_tz()` (same instant, different clock) and one re-stamped as if the wall clock 09:00 had always been in Kolkata using `force_tz()`. Save both as a length-2 named list to `ex_6_2`.

**Expected result:**

```
#> $with_tz
#> [1] "2024-04-10 14:30:00 IST"
#>
#> $force_tz
#> [1] "2024-04-10 09:00:00 IST"
```

**Difficulty:** Intermediate

[HINTS]
One operation keeps the instant and moves the clock; the other keeps the clock and moves the instant.
Build a named list with `with_tz(t0, tzone = "Asia/Kolkata")` and `force_tz(t0, tzone = "Asia/Kolkata")`.

```r title="Your turn"
t0 <- ymd_hms("2024-04-10 09:00:00", tz = "UTC")
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t0 <- ymd_hms("2024-04-10 09:00:00", tz = "UTC")
ex_6_2 <- list(
  with_tz  = with_tz(t0, tzone = "Asia/Kolkata"),
  force_tz = force_tz(t0, tzone = "Asia/Kolkata")
)
ex_6_2
#> $with_tz
#> [1] "2024-04-10 14:30:00 IST"
#>
#> $force_tz
#> [1] "2024-04-10 09:00:00 IST"
```

**Explanation:** `with_tz()` keeps the instant constant (09:00 UTC is 14:30 in Kolkata because Kolkata is UTC+5:30) and adjusts the displayed clock. `force_tz()` keeps the displayed clock constant and changes the underlying instant: the same "09:00" is now interpreted as Kolkata local, which is a different real-world moment. Choose `force_tz()` when a system stamped the wall clock incorrectly as UTC; choose `with_tz()` when the UTC was correct and you want a local view.

</details>

### Exercise 6.3: Subtract one hour across the spring-forward DST gap

**Task:** On 2024-03-10 at 02:00 local in "America/New_York", clocks jumped to 03:00 (the 02:00-03:00 hour does not exist). Take the timestamp "2024-03-10 03:30:00" in NY local time and subtract one hour using `hours(1)` versus `dhours(1)`. Compare the two results in a length-2 named list saved to `ex_6_3`.

**Expected result:**

```
#> $minus_period
#> [1] "2024-03-10 02:30:00 EST"
#>
#> $minus_duration
#> [1] "2024-03-10 01:30:00 EST"
```

**Difficulty:** Advanced

[HINTS]
One unit means the same wall clock an hour earlier; the other means exactly 3600 seconds of real time earlier.
Subtract `hours(1)` and `dhours(1)` from `local_ts` into a named list.

```r title="Your turn"
local_ts <- ymd_hms("2024-03-10 03:30:00", tz = "America/New_York")
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
local_ts <- ymd_hms("2024-03-10 03:30:00", tz = "America/New_York")
ex_6_3 <- list(
  minus_period   = local_ts - hours(1),
  minus_duration = local_ts - dhours(1)
)
ex_6_3
#> $minus_period
#> [1] "2024-03-10 02:30:00 EST"
#>
#> $minus_duration
#> [1] "2024-03-10 01:30:00 EST"
```

**Explanation:** A period (`hours(1)`) is a calendar concept: "the same wall-clock time one hour earlier", so it lands on 02:30, which during a spring-forward day did not actually happen in NYC and lubridate represents as a synthetic EST moment. A duration (`dhours(1)`) is exactly 3600 seconds of physical time, which on this day actually skips back across the missing 02:00-03:00 hour and lands at 01:30. Always reach for durations when you mean "exactly N seconds" and periods when you mean "the wall clock one hour earlier".

</details>

## Section 7. End-to-end date-column workflows (3 problems)

### Exercise 7.1: Compute month-over-month change from daily transactions

**Task:** A finance team wants the month-over-month percentage change in total daily revenue from a six-month transaction tibble. Aggregate to monthly totals using `floor_date()`, compute the MoM change with `lag()`, and save the resulting tibble (with columns `month`, `revenue`, `mom_pct`) to `ex_7_1`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   month      revenue mom_pct
#>   <date>       <dbl>   <dbl>
#> 1 2024-01-01   12500   NA
#> 2 2024-02-01   13750    0.1
#> 3 2024-03-01   15125    0.1
#> 4 2024-04-01   16638    0.1
#> 5 2024-05-01   18301    0.1
#> 6 2024-06-01   20132    0.1
```

**Difficulty:** Advanced

[HINTS]
Aggregate to a monthly anchor first, then compare each month against the one immediately before it.
Use `floor_date(txn_dt, "month")` for the key, `group_by()`/`summarise()` to total, then `lag()` for `mom_pct`.

```r title="Your turn"
txns <- tibble(
  txn_dt  = rep(seq(ymd("2024-01-15"), ymd("2024-06-15"), by = "month"), each = 1),
  revenue = c(12500, 13750, 15125, 16638, 18301, 20132)
)
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
txns <- tibble(
  txn_dt  = rep(seq(ymd("2024-01-15"), ymd("2024-06-15"), by = "month"), each = 1),
  revenue = c(12500, 13750, 15125, 16638, 18301, 20132)
)
ex_7_1 <- txns |>
  mutate(month = floor_date(txn_dt, "month")) |>
  group_by(month) |>
  summarise(revenue = sum(revenue), .groups = "drop") |>
  arrange(month) |>
  mutate(mom_pct = round((revenue / lag(revenue)) - 1, 3))
ex_7_1
#> # A tibble: 6 x 3
#>   month      revenue mom_pct
#>   <date>       <dbl>   <dbl>
#> 1 2024-01-01   12500   NA
#> 2 2024-02-01   13750    0.1
#> 3 2024-03-01   15125    0.1
#> 4 2024-04-01   16638    0.1
#> 5 2024-05-01   18301    0.1
#> 6 2024-06-01   20132    0.1
```

**Explanation:** The three-step pipe is the standard MoM idiom: floor to a month-anchor for grouping, sum the metric, then `lag()` the sorted result to access the prior period. `lag()` returns `NA` for the first row, which is the correct behavior because there is no prior period. For year-over-year change, swap `floor_date(..., "year")` and the same pipe works unchanged.

</details>

### Exercise 7.2: Fill gaps in a daily series with a full date sequence

**Task:** A reporting analyst notices that a transaction log has gaps on days with no activity. Given an irregular tibble of three days within an April week, generate the full daily sequence from the min to the max date, then `left_join()` the original counts so missing days appear with `NA` revenue. Save the gap-filled tibble to `ex_7_2`.

**Expected result:**

```
#> # A tibble: 7 x 2
#>   dt         revenue
#>   <date>       <dbl>
#> 1 2024-04-08    1200
#> 2 2024-04-09      NA
#> 3 2024-04-10      NA
#> 4 2024-04-11    1450
#> 5 2024-04-12      NA
#> 6 2024-04-13      NA
#> 7 2024-04-14    1320
```

**Difficulty:** Advanced

[HINTS]
Build a complete spine of every day in range, then attach the sparse values onto it so gaps surface as missing.
Use `seq()` from `min` to `max` by `"day"`, then `left_join()` the sparse tibble onto that spine.

```r title="Your turn"
sparse <- tibble(
  dt      = ymd(c("2024-04-08", "2024-04-11", "2024-04-14")),
  revenue = c(1200, 1450, 1320)
)
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sparse <- tibble(
  dt      = ymd(c("2024-04-08", "2024-04-11", "2024-04-14")),
  revenue = c(1200, 1450, 1320)
)
full_seq <- tibble(dt = seq(min(sparse$dt), max(sparse$dt), by = "day"))
ex_7_2 <- full_seq |> left_join(sparse, by = "dt")
ex_7_2
#> # A tibble: 7 x 2
#>   dt         revenue
#>   <date>       <dbl>
#> 1 2024-04-08    1200
#> 2 2024-04-09      NA
#> 3 2024-04-10      NA
#> 4 2024-04-11    1450
#> 5 2024-04-12      NA
#> 6 2024-04-13      NA
#> 7 2024-04-14    1320
```

**Explanation:** `seq.Date(min, max, by = "day")` builds the spine of every day in range, and the `left_join()` keeps every spine row while attaching matching revenue. Gaps surface as `NA`, which downstream code can treat as zero (`replace_na(list(revenue = 0))`) or leave as missing depending on intent. For multi-key gap filling (e.g., date crossed with product), `tidyr::complete(dt, product)` is the one-liner version.

</details>

### Exercise 7.3: Tag events as weekday or weekend and count each

**Task:** An ops engineer wants to compare on-call ticket load between weekdays and weekends from an inline tibble of six event dates. Add a `day_type` column ("weekday" or "weekend") using `wday()` with `week_start = 1`, then summarise the counts by `day_type`. Save the summary tibble (columns `day_type`, `n`) to `ex_7_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   day_type     n
#>   <chr>    <int>
#> 1 weekday      4
#> 2 weekend      2
```

**Difficulty:** Intermediate

[HINTS]
Classify each date by whether it falls Monday through Friday, then tally the two groups.
Test `wday(event_dt, week_start = 1) <= 5` inside `if_else()`, then summarise with `count()`.

```r title="Your turn"
oncall <- tibble(event_dt = ymd(c("2024-04-08", "2024-04-09", "2024-04-12", "2024-04-13", "2024-04-14", "2024-04-15")))
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
oncall <- tibble(event_dt = ymd(c("2024-04-08", "2024-04-09", "2024-04-12", "2024-04-13", "2024-04-14", "2024-04-15")))
ex_7_3 <- oncall |>
  mutate(day_type = if_else(wday(event_dt, week_start = 1) <= 5, "weekday", "weekend")) |>
  count(day_type)
ex_7_3
#> # A tibble: 2 x 2
#>   day_type     n
#>   <chr>    <int>
#> 1 weekday      4
#> 2 weekend      2
```

**Explanation:** With `week_start = 1`, Monday is 1 and Sunday is 7, so the test `<= 5` returns `TRUE` for Mon-Fri. `if_else()` (typed) is preferred over base `ifelse()` because it preserves the column type and errors on a type mismatch instead of silently coercing. `count()` is the one-liner for `group_by() |> summarise(n = n()) |> ungroup()`, so the final pipe is three readable lines.

</details>

## What to do next

- Brush up on the underlying concepts in [Working with Dates and Times in R with lubridate](lubridate-in-R.html), the parent tutorial.
- Drill the related verbs in [dplyr Exercises in R](dplyr-Exercises-in-R.html) for grouping and joining.
- Practice broader date-column work in [Date Time Manipulation Exercises in R](Date-Time-Manipulation-Exercises-in-R.html).
- Reach for the [lubridate Cheat Sheet](lubridate-Cheat-Sheet-R.html) when you want a one-page reference.
