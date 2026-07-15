---
title: "Dates and Times Drills: 15 R Problems That Trip Everyone Up"
slug: "Dates-and-Times-Drills-in-R"
description: "15 date and time practice problems in R: parse messy strings, format for reports, difftime and age arithmetic, sequences, binning, and time zone and DST traps."
keywords: "date time practice R, lubridate exercises, parse dates in R, difftime R, seq.Date, time zones in R, daylight saving R, format dates R"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Dates and Times Drills"
sidebar_order: 148
fr_parent: "Dates-and-Times-in-R.html"
auto_link_terms: "date time practice|parse dates in R|lubridate exercises|time zones in R|daylight saving"
auto_link_case_sensitive: false
target_keyword: "date time practice R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Dates and Times Drills: 15 R Problems That Trip Everyone Up

<p class="lead">The 15 date and time problems that quietly break real R scripts, each rebuilt as a runnable drill with a hidden solution: parsing inconsistent strings, formatting for reports, difftime and age arithmetic, building and binning sequences, and the time zone and daylight saving edge cases that produce wrong answers without ever throwing an error.</p>

Dates are where correct-looking code lies to you. A day-first string parses as a month, an age rounds up on the wrong side of a birthday, a timestamp shifts an hour because a clock sprang forward. Every date below is a hardcoded literal so the output is identical on every machine. Work top to bottom: each section climbs from a warm-up to a genuinely tricky trap.

```r title="Run this once before any exercise"
library(lubridate)
```

## Section 1. Parsing messy date strings (3 problems)

### Exercise 1.1: Parse day-first date strings with a format string

**Task:** A data engineer imports a spreadsheet where dates arrive as day-first strings like 15/03/2024, which R does not recognise by default. Convert the vector `c("15/03/2024", "01/12/2024", "28/02/2024")` to real Date objects by supplying the matching format, and save the result to `ex_1_1`.

**Expected result:**

```
#> [1] "2024-03-15" "2024-12-01" "2024-02-28"
```

**Difficulty:** Beginner

[HINTS]
R has no way to know whether 01/12/2024 means January 12 or December 1, so you must tell it which piece comes first.
Pass `format = "%d/%m/%Y"` to `as.Date()` so day, month, and year map to the right positions.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- as.Date(c("15/03/2024", "01/12/2024", "28/02/2024"),
                  format = "%d/%m/%Y")
ex_1_1
#> [1] "2024-03-15" "2024-12-01" "2024-02-28"
```

**Explanation:** `as.Date()` cannot guess that 15/03/2024 is day-first, so without the format argument it either returns NA or silently misreads the day as a month. The strptime tokens `%d`, `%m`, and `%Y` spell out the exact layout. When a column mixes separators or orders, this is where parsing quietly goes wrong, so always state the format explicitly for anything that is not ISO year-month-day.

</details>

### Exercise 1.2: Read month-name dates with lubridate mdy

**Task:** A marketing export writes dates as full month names, such as "March 15, 2024". Rather than hand-write a format string with a comma in it, use a lubridate helper that reads month-day-year order and parses all three of `c("March 15, 2024", "April 1, 2024", "December 25, 2024")`, saving the Date vector to `ex_1_2`.

**Expected result:**

```
#> [1] "2024-03-15" "2024-04-01" "2024-12-25"
```

**Difficulty:** Intermediate

[HINTS]
There is a family of lubridate parsers named after the order of the parts, so pick the one whose letters match month, then day, then year.
Call `mdy()` on the character vector; it tolerates the comma and the spelled-out month automatically.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mdy(c("March 15, 2024", "April 1, 2024", "December 25, 2024"))
ex_1_2
#> [1] "2024-03-15" "2024-04-01" "2024-12-25"
```

**Explanation:** Writing a format string for "March 15, 2024" is fiddly because of the comma and the full month name. lubridate's `mdy()` reads the order you name (month, day, year) and tolerates the punctuation, returning a clean Date. The sibling helpers `ymd()`, `dmy()`, and their `_hms` variants cover the other common orders. The one rule that trips people is that you still choose the order; lubridate does not detect it for you.

</details>

### Exercise 1.3: Rescue a column of inconsistent date formats

**Task:** A messy join left one date column with three different formats mixed together: ISO, US slash style, and a written-out month. Parse the vector `raw` so every element becomes the same date, trying year-month-day, month-day-year, and month-name orders in turn, and save the parsed result to `ex_1_3`.

**Expected result:**

```
#> [1] "2024-03-15 UTC" "2024-03-15 UTC" "2024-03-15 UTC"
```

**Difficulty:** Intermediate

[HINTS]
One parser can accept a list of candidate orders and, element by element, keep whichever order succeeds first.
Use `parse_date_time(raw, orders = c("ymd", "mdy", "B d Y"))`, where `B` stands for the full month name.

```r title="Your turn"
raw <- c("2024-03-15", "03/15/2024", "March 15 2024")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c("2024-03-15", "03/15/2024", "March 15 2024")
ex_1_3 <- parse_date_time(raw, orders = c("ymd", "mdy", "B d Y"))
ex_1_3
#> [1] "2024-03-15 UTC" "2024-03-15 UTC" "2024-03-15 UTC"
```

**Explanation:** `parse_date_time()` tries each order in turn and keeps the first that succeeds for every element, which is exactly what a column of inconsistent formats needs. Here the ISO, slash, and month-name strings all resolve to the same date. It returns POSIXct in UTC, so wrap the result with `as.Date()` if you only want the calendar date. A common mistake is forgetting that a genuinely unparseable value becomes NA with a warning rather than stopping with an error.

</details>

## Section 2. Formatting dates for reports (2 problems)

### Exercise 2.1: Format a date for a human-readable report

**Task:** A weekly report needs dates printed the way a reader expects, like "Mar 15, 2024", not the ISO storage format. Take the date `as.Date("2024-03-15")` and format it as an abbreviated month name, day, and four-digit year, saving the resulting character string to `ex_2_1`.

**Expected result:**

```
#> [1] "Mar 15, 2024"
```

**Difficulty:** Beginner

[HINTS]
Turning a Date into display text is the reverse of parsing: you supply a template of the same strptime tokens you would use to read it.
Call `format()` on the date with the pattern `"%b %d, %Y"`, where `%b` is the abbreviated month.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- format(as.Date("2024-03-15"), "%b %d, %Y")
ex_2_1
#> [1] "Mar 15, 2024"
```

**Explanation:** `format()` turns a Date into text using strptime tokens: `%b` is the abbreviated month, `%d` the zero-padded day, and `%Y` the four-digit year. The output is a character string, no longer a Date, so do any formatting last, after all sorting and arithmetic. Month and weekday names follow the session locale, so `%b` prints "Mar" in an English locale but something else elsewhere; set the locale explicitly if a report must be language-stable.

</details>

### Exercise 2.2: Label each date with its calendar quarter

**Task:** A finance dashboard groups activity by calendar quarter. Given the dates in `dts`, build a label for each one that combines the quarter number with the year, producing values like "Q1-2024", and save the resulting character vector to `ex_2_2`.

**Expected result:**

```
#> [1] "Q1-2024" "Q2-2024" "Q3-2024" "Q4-2024"
```

**Difficulty:** Intermediate

[HINTS]
Two small helpers pull the quarter and the year out of a date; the label is just those two numbers glued together with a prefix.
Use `quarter()` and `year()` inside `paste0("Q", quarter(dts), "-", year(dts))`.

```r title="Your turn"
dts <- as.Date(c("2024-01-10", "2024-04-22", "2024-07-01", "2024-11-30"))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dts <- as.Date(c("2024-01-10", "2024-04-22", "2024-07-01", "2024-11-30"))
ex_2_2 <- paste0("Q", quarter(dts), "-", year(dts))
ex_2_2
#> [1] "Q1-2024" "Q2-2024" "Q3-2024" "Q4-2024"
```

**Explanation:** `quarter()` maps any date to 1 through 4, and `year()` pulls the calendar year, so pasting them builds a compact grouping key. Because the result is character, it sorts alphabetically, which happens to match chronological order only while the years stay four digits and the quarter stays a single digit. For grouping that is usually enough, but for axis labels prefer a factor with explicit level order so the sort is guaranteed correct.

</details>

## Section 3. Date and time arithmetic (3 problems)

### Exercise 3.1: Measure a gap between dates in weeks

**Task:** A project manager wants the elapsed time between the kickoff on 2024-01-01 and the deadline on 2024-12-31 reported in weeks, not the days R gives by default. Compute that difference with the units set explicitly to weeks, and save the difftime result to `ex_3_1`.

**Expected result:**

```
#> Time difference of 52.14286 weeks
```

**Difficulty:** Intermediate

[HINTS]
Subtracting two dates gives you a difference object measured in days; there is a dedicated function that lets you request a different unit directly.
Call `difftime()` with the later date first, the earlier second, and `units = "weeks"`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- difftime(as.Date("2024-12-31"), as.Date("2024-01-01"),
                   units = "weeks")
ex_3_1
#> Time difference of 52.14286 weeks
```

**Explanation:** `difftime()` returns a special object that carries its unit, so printing it shows "Time difference of 52.14286 weeks" rather than a bare number. Subtracting two Dates gives the same thing in days by default, so the `units` argument is what lets you ask for weeks, hours, or minutes directly. To use the value in later arithmetic, strip the wrapper with `as.numeric()`, which also lets you pin the unit in a single step.

</details>

### Exercise 3.2: Compute exact age in complete years

**Task:** A KYC check needs a customer's age in complete years, and the naive trick of dividing elapsed days by 365.25 quietly rounds people up on the wrong side of their birthday. For a date of birth of 1990-06-15 evaluated on the reference date 2024-03-15, compute the exact completed-year age and save the named result to `ex_3_2`.

**Expected result:**

```
#> age_years 
#>        33 
```

**Difficulty:** Advanced

[HINTS]
Age in whole years is how many complete years fit inside the span between the two dates, which is integer division of a time span by a one-year unit.
Build the span with `interval(ymd("1990-06-15"), ymd("2024-03-15"))` and divide it by `years(1)` using `%/%`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- c(age_years = interval(ymd("1990-06-15"), ymd("2024-03-15")) %/% years(1))
ex_3_2
#> age_years 
#>        33 
```

**Explanation:** Dividing elapsed days by 365.25 ignores leap years unevenly and can push someone to the wrong age right around their birthday. Building an interval and taking integer division by `years(1)` counts only fully completed years, which is what legal and KYC definitions of age actually mean. Because 2024-03-15 falls before the June birthday, the answer is 33, not 34. The same `%/%` trick works with `months(1)` or `weeks(1)` for other completed-unit counts.

</details>

### Exercise 3.3: Count the weekdays between two dates

**Task:** An operations analyst needs the number of working weekdays in March 2024 for a staffing plan, excluding Saturdays and Sundays. Using the day sequence `days` already built for that month, count how many of those dates fall on a weekday and save the named count to `ex_3_3`.

**Expected result:**

```
#> weekdays 
#>       21 
```

**Difficulty:** Advanced

[HINTS]
Turn each date into a weekday number, then keep only those that are not the two weekend positions; counting is summing a logical vector.
`wday()` returns 1 for Sunday through 7 for Saturday, so test `!wday(days) %in% c(1, 7)` and take the `sum()`.

```r title="Your turn"
days <- seq(as.Date("2024-03-01"), as.Date("2024-03-31"), by = "day")
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
days <- seq(as.Date("2024-03-01"), as.Date("2024-03-31"), by = "day")
ex_3_3 <- c(weekdays = sum(!wday(days) %in% c(1, 7)))
ex_3_3
#> weekdays 
#>       21 
```

**Explanation:** Enumerating every day with `seq()` and testing `wday()` is the dependable way to count business days, because `wday()` returns 1 for Sunday through 7 for Saturday regardless of locale, unlike the text from `weekdays()`. Excluding positions 1 and 7 leaves the weekdays, giving 21 for March 2024. This does not remove public holidays; for that, also subtract a known holiday vector, which is how most real business-day calendars are built.

</details>

## Section 4. Sequences and binning dates (3 problems)

### Exercise 4.1: Build a first-of-month sequence for the year

**Task:** A reporting job needs one row per month, anchored to the first day of each month across all of 2024. Generate the twelve first-of-month dates as a proper Date sequence rather than pasting strings together, and save the vector to `ex_4_1`.

**Expected result:**

```
#>  [1] "2024-01-01" "2024-02-01" "2024-03-01" "2024-04-01" "2024-05-01"
#>  [6] "2024-06-01" "2024-07-01" "2024-08-01" "2024-09-01" "2024-10-01"
#> [11] "2024-11-01" "2024-12-01"
```

**Difficulty:** Intermediate

[HINTS]
A date sequence can step by a calendar unit, not just by days, and it keeps the same day-of-month as the start value.
Call `seq()` from `as.Date("2024-01-01")` to `as.Date("2024-12-01")` with `by = "month"`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- seq(as.Date("2024-01-01"), as.Date("2024-12-01"), by = "month")
ex_4_1
#>  [1] "2024-01-01" "2024-02-01" "2024-03-01" "2024-04-01" "2024-05-01"
#>  [6] "2024-06-01" "2024-07-01" "2024-08-01" "2024-09-01" "2024-10-01"
#> [11] "2024-11-01" "2024-12-01"
```

**Explanation:** `seq()` with `by = "month"` steps one month at a time and lands on the same day-of-month as the start, so beginning on the first keeps every result on a first. Pasting strings like `"2024-"`, the month, and `"-01"` looks simpler but breaks the moment you need to filter or iterate, because the values stay character. A real Date sequence sorts, compares, and joins correctly, which is worth the extra call.

</details>

### Exercise 4.2: Bin transaction dates into quarterly buckets

**Task:** A retailer wants transaction counts per calendar quarter for a summary table. Take the transaction dates in `txn`, cut them into quarterly bins, tabulate how many fall in each quarter, and save the resulting table to `ex_4_2`.

**Expected result:**

```
#> 
#> 2024-01-01 2024-04-01 2024-07-01 2024-10-01 
#>          2          2          1          1 
```

**Difficulty:** Intermediate

[HINTS]
There is a cutting function that understands calendar periods as break points, so you do not have to compute the quarter boundaries yourself.
Wrap `cut(txn, breaks = "quarter")` inside `table()` to count the members of each bin.

```r title="Your turn"
txn <- as.Date(c("2024-01-15", "2024-02-20", "2024-04-10",
                 "2024-04-25", "2024-09-05", "2024-12-31"))
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
txn <- as.Date(c("2024-01-15", "2024-02-20", "2024-04-10",
                 "2024-04-25", "2024-09-05", "2024-12-31"))
ex_4_2 <- table(cut(txn, breaks = "quarter"))
ex_4_2
#> 
#> 2024-01-01 2024-04-01 2024-07-01 2024-10-01 
#>          2          2          1          1 
```

**Explanation:** `cut()` with `breaks = "quarter"` assigns each date to the quarter it falls in and labels the bin with that quarter's first day, so wrapping it in `table()` gives counts per quarter. The labels are an ordered factor, which keeps the columns in calendar order even when the data is shuffled. The shortcuts `"month"`, `"week"`, and `"year"` work the same way, and you can pass explicit break dates for custom periods such as fiscal quarters.

</details>

### Exercise 4.3: Find each account's month-end billing date

**Task:** A subscription service bills on the last calendar day of each signup month. For the signup dates in `signups`, compute each account's first billing date as the final day of its month, correctly handling February in a leap year, and save the vector to `ex_4_3`.

**Expected result:**

```
#> [1] "2024-01-31" "2024-02-29" "2024-11-30"
```

**Difficulty:** Advanced

[HINTS]
Snapping a date up to the start of the next month and then stepping back one day lands on the true month end, whatever its length.
Compute `ceiling_date(signups, "month") - days(1)`.

```r title="Your turn"
signups <- ymd(c("2024-01-05", "2024-02-15", "2024-11-30"))
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
signups <- ymd(c("2024-01-05", "2024-02-15", "2024-11-30"))
ex_4_3 <- ceiling_date(signups, "month") - days(1)
ex_4_3
#> [1] "2024-01-31" "2024-02-29" "2024-11-30"
```

**Explanation:** `ceiling_date()` snaps a date up to the start of the next month, and subtracting one day lands on the true month end, so February resolves to the 29th in the leap year 2024 with no special case. Hard-coding 28, 30, or 31 is the classic bug this avoids. The mirror operation, `floor_date()`, snaps down to the first of the month, and together they bracket any billing or reporting period cleanly.

</details>

## Section 5. Time zones and daylight saving traps (4 problems)

### Exercise 5.1: Relabel a mistagged timestamp and convert to UTC

**Task:** A logging bug stamped an event as 2024-03-15 09:00:00 UTC when the clock was actually New York local time. Relabel the timestamp `t51` to the correct zone without shifting the displayed clock, then convert that corrected instant to UTC, and save the result to `ex_5_1`.

**Expected result:**

```
#> [1] "2024-03-15 13:00:00 UTC"
```

**Difficulty:** Intermediate

[HINTS]
One function fixes a wrong label while keeping the clock reading, and a different one keeps the instant while changing the clock; you need them in that order.
Wrap `force_tz(t51, "America/New_York")` in `with_tz(..., "UTC")`.

```r title="Your turn"
t51 <- ymd_hms("2024-03-15 09:00:00", tz = "UTC")
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t51 <- ymd_hms("2024-03-15 09:00:00", tz = "UTC")
ex_5_1 <- with_tz(force_tz(t51, "America/New_York"), "UTC")
ex_5_1
#> [1] "2024-03-15 13:00:00 UTC"
```

**Explanation:** `force_tz()` keeps the clock reading and changes only the label, which is how you fix a timestamp tagged with the wrong zone. `with_tz()` does the opposite: it keeps the same physical instant and re-expresses it in another zone, so the clock changes. Confusing the two is the single most common time zone bug. Here the corrected New York 09:00 becomes 13:00 UTC, because mid-March is already on daylight time at four hours behind UTC.

</details>

### Exercise 5.2: Show one instant across two time zones

**Task:** A global team schedules a call for 2024-06-01 15:00:00 UTC and needs the local wall-clock time in Tokyo and Los Angeles. Convert the instant `t52` to each zone, format each as year-month-day hour:minute, and save the named character vector to `ex_5_2`.

**Expected result:**

```
#>              tokyo                 la 
#> "2024-06-02 00:00" "2024-06-01 08:00" 
```

**Difficulty:** Intermediate

[HINTS]
Converting the same instant to another zone changes only how it displays, so the two cities can read different clocks and even different dates.
Apply `with_tz(t52, "Asia/Tokyo")` and `with_tz(t52, "America/Los_Angeles")`, then `format()` each and name the two elements.

```r title="Your turn"
t52 <- ymd_hms("2024-06-01 15:00:00", tz = "UTC")
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t52 <- ymd_hms("2024-06-01 15:00:00", tz = "UTC")
ex_5_2 <- c(tokyo = format(with_tz(t52, "Asia/Tokyo"), "%Y-%m-%d %H:%M"),
            la    = format(with_tz(t52, "America/Los_Angeles"), "%Y-%m-%d %H:%M"))
ex_5_2
#>              tokyo                 la 
#> "2024-06-02 00:00" "2024-06-01 08:00" 
```

**Explanation:** `with_tz()` never changes the underlying instant; it only changes how that instant is displayed, so one moment reads as different wall-clock times in different cities. Tokyo, nine hours ahead, is already on the next calendar day, while Los Angeles in June is on daylight time at seven hours behind. Storing timestamps in UTC and converting only for display is the discipline that keeps this correct, and formatting to text should always be the last step.

</details>

### Exercise 5.3: Handle a wall-clock time that never happened

**Task:** On 2024-03-10 United States clocks jump straight from 02:00 to 03:00, so 02:30 never happens that night. Try to build the timestamp 2024-03-10 02:30:00 in America/New_York and observe what lubridate returns for a time that does not exist, saving the result to `ex_5_3`.

**Expected result:**

```
#> Warning message:
#>  1 failed to parse.
#> [1] NA
```

**Difficulty:** Advanced

[HINTS]
A moment that the local calendar skips over cannot be represented, so a careful parser refuses to invent one and warns you instead.
Call `ymd_hms("2024-03-10 02:30:00", tz = "America/New_York")` and inspect the value and the warning it prints.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ymd_hms("2024-03-10 02:30:00", tz = "America/New_York")
#> Warning message:
#>  1 failed to parse.
ex_5_3
#> [1] NA
```

**Explanation:** Because the local clock skips from 02:00 to 03:00 on the spring-forward night, 02:30 is not a real instant, and lubridate returns NA with a "failed to parse" warning rather than inventing a value. Code that assumes parsing always succeeds will silently propagate that NA into everything downstream. The defensive move is to store and construct timestamps in UTC, where no gaps or repeats exist, and convert to local time only for display.

</details>

### Exercise 5.4: Separate a period from a duration across DST

**Task:** Starting from 2024-03-09 12:00:00 in New York, the day before the spring-forward, add one calendar day as a period and separately as a fixed 24-hour duration. The two land on different wall-clock times because a daylight-saving hour disappears; compute both and save them to `ex_5_4`.

**Expected result:**

```
#>                period              duration 
#> "2024-03-10 12:00:00" "2024-03-10 13:00:00" 
```

**Difficulty:** Advanced

[HINTS]
One kind of time span is measured in calendar units and honours the clock, while the other is a fixed count of seconds that ignores the clock.
Add `days(1)` for the period and `ddays(1)` for the 24-hour duration, then `format()` both into a named vector.

```r title="Your turn"
start <- ymd_hms("2024-03-09 12:00:00", tz = "America/New_York")
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
start <- ymd_hms("2024-03-09 12:00:00", tz = "America/New_York")
ex_5_4 <- c(period   = format(start + days(1)),
            duration = format(start + ddays(1)))
ex_5_4
#>                period              duration 
#> "2024-03-10 12:00:00" "2024-03-10 13:00:00" 
```

**Explanation:** A period like `days(1)` is calendar arithmetic: it advances the wall clock to the same time the next day, so noon stays noon even though only 23 real hours passed across the spring-forward. A duration like `ddays(1)` is exactly 86400 seconds of physical time, so it lands an hour later on the clock. Reach for periods when humans care about the clock reading, and durations when you need true elapsed time.

</details>

## What to do next

Keep sharpening the date-time skills these drills exposed with the related practice hubs:

- [lubridate Exercises in R](lubridate-Exercises-in-R.html) for a deeper run through parsing, components, intervals, and rounding.
- [Date-Time Manipulation Exercises in R](Date-Time-Manipulation-Exercises-in-R.html) for more POSIXct, aggregation, and real-world date workflows.
- [Time Series Exercises in R](Time-Series-Exercises-in-R.html) to put dates to work as an index for trends and forecasts.
- [stringr Exercises in R](stringr-Exercises-in-R.html) to master the string cleanup that so often comes just before date parsing.
