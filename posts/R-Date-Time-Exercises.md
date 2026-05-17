---
title: "R Date & Time Exercises: 20 lubridate Practice Problems"
slug: "R-Date-Time-Exercises"
description: "Practice R dates with 20 lubridate exercises: parse formats, extract components, do period and interval arithmetic, handle timezones, with full solutions."
keywords: "R date time exercises, lubridate exercises, dates in R practice, posixct practice, R date arithmetic, R timezone exercises, parse_date_time, R interval exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Date & Time (20 problems)"
sidebar_order: 165
fr_parent: "R-Syntax-101.html"
auto_link_terms: "R date exercises|lubridate exercises|date time exercises|R date practice|lubridate practice problems"
auto_link_case_sensitive: false
target_keyword: "dates in R exercises, posixct practice"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Date & Time Exercises: 20 lubridate Practice Problems

<p class="lead">Twenty practice problems covering date parsing, component extraction, period and interval arithmetic, timezone handling, and date-driven analytics workflows in R. Each problem has a hidden, fully worked solution with an explanation, runnable directly in your browser.</p>

```r title="Run this once before any exercise"
library(lubridate)
library(dplyr)
library(tibble)
```

## Section 1. Parsing dates and times (4 problems)

### Exercise 1.1: Parse a year-month-day string with ymd

**Task:** Parse the character string `"2024-03-15"` into a proper R `Date` object using `ymd()` from lubridate. The result should print as a single date and have class `"Date"`. Save the parsed value to `ex_1_1` and inspect both the value and its class.

**Expected result:**

```
#> [1] "2024-03-15"
#> [1] "Date"
```

**Difficulty:** Beginner

[HINTS]
Identify which calendar component the string lists first, second, and third, then pick the parser keyed to that exact order.
Hand the raw string straight to `ymd()` - no format string is required.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
class(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ymd("2024-03-15")
ex_1_1
#> [1] "2024-03-15"
class(ex_1_1)
#> [1] "Date"
```

**Explanation:** `ymd()` is a strict, fast parser keyed by component ORDER rather than separators, so `"2024/03/15"`, `"2024-03-15"`, and `"20240315"` all work. Compared to base R's `as.Date()` you do not have to pass a format string. The result is a `Date` (1 day precision); use `ymd_hms()` when you need sub-day precision.

</details>

### Exercise 1.2: Parse a CSV column with mixed date formats

**Task:** A marketing analyst received conversion logs from three vendors and concatenated them. The `raw` vector below contains mixed formats: ISO, US slash, and European dash. Use `parse_date_time()` with all three format hints so every entry parses correctly. Save the cleaned `Date` vector to `ex_1_2` and confirm none are `NA`.

```r
raw <- c("2024-03-15", "03/15/2024", "15-03-2024", "2024-04-01", "04/02/2024")
```

**Expected result:**

```
#> [1] "2024-03-15 UTC" "2024-03-15 UTC" "2024-03-15 UTC" "2024-04-01 UTC" "2024-04-02 UTC"
#> [1] 0
```

**Difficulty:** Intermediate

[HINTS]
The vector mixes three different component orderings, so you need a parser you can give several format hints to at once.
Call `parse_date_time()` with `orders = c("ymd", "mdy", "dmy")`, listing the most specific order first.

```r title="Your turn"
raw <- c("2024-03-15", "03/15/2024", "15-03-2024", "2024-04-01", "04/02/2024")
ex_1_2 <- # your code here
ex_1_2
sum(is.na(ex_1_2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c("2024-03-15", "03/15/2024", "15-03-2024", "2024-04-01", "04/02/2024")
ex_1_2 <- parse_date_time(raw, orders = c("ymd", "mdy", "dmy"))
ex_1_2
#> [1] "2024-03-15 UTC" "2024-03-15 UTC" "2024-03-15 UTC"
#> [4] "2024-04-01 UTC" "2024-04-02 UTC"
sum(is.na(ex_1_2))
#> [1] 0
```

**Explanation:** `parse_date_time()` tries each order in turn and picks the first that matches without ambiguity, so messy real-world feeds parse without writing a custom regex. Order matters: put the most specific format first; if `mdy` came before `ymd`, the string `"2024-03-15"` would still parse as ymd because ymd is unambiguous, but for ambiguous strings the first listed order wins.

</details>

### Exercise 1.3: Parse a datetime with seconds and treat it as POSIXct

**Task:** Convert the string `"2024-03-15 14:30:45"` into a `POSIXct` value using `ymd_hms()`. Save the result to `ex_1_3`. Print it and confirm via `class()` that it carries both `POSIXct` and `POSIXt` classes, which is what date-aware functions look for.

**Expected result:**

```
#> [1] "2024-03-15 14:30:45 UTC"
#> [1] "POSIXct" "POSIXt"
```

**Difficulty:** Intermediate

[HINTS]
The string carries hours, minutes, and seconds, so reach for the parser variant that captures sub-day precision.
Use `ymd_hms()` on the string; it returns a POSIXct value in UTC by default.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
class(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ymd_hms("2024-03-15 14:30:45")
ex_1_3
#> [1] "2024-03-15 14:30:45 UTC"
class(ex_1_3)
#> [1] "POSIXct" "POSIXt"
```

**Explanation:** `ymd_hms()` returns `POSIXct`, an integer number of seconds since 1970-01-01 UTC. The default timezone is UTC when no `tz` argument is given. Use `POSIXct` (not `POSIXlt`) for data frames and vectorized math; `POSIXlt` is a list-of-components structure that breaks dplyr columns. If your input lacks seconds, use `ymd_hm()` so missing seconds do not generate `NA`.

</details>

### Exercise 1.4: Truncate noisy timestamps before parsing

**Task:** An audit team received timestamps with extra text appended: `"2024-03-15 14:30:00 EST (audit log)"`. The trailing parenthetical breaks `ymd_hms()`. Use `parse_date_time()` with `truncated = 3` and an `orders` hint so the parser tolerates trailing noise. Parse the full vector and save the cleaned datetimes to `ex_1_4`.

```r
raw <- c(
  "2024-03-15 14:30:00 (audit log)",
  "2024-03-16 09:00:15 (audit log)",
  "2024-03-17 23:59:59 (audit log)"
)
```

**Expected result:**

```
#> [1] "2024-03-15 14:30:00 UTC" "2024-03-16 09:00:15 UTC"
#> [3] "2024-03-17 23:59:59 UTC"
```

**Difficulty:** Intermediate

[HINTS]
The trailing parenthetical is noise the parser can be told to tolerate rather than something you must scrub out first.
Call `parse_date_time()` with `orders = "Ymd HMS"` and `truncated = 3`.

```r title="Your turn"
raw <- c(
  "2024-03-15 14:30:00 (audit log)",
  "2024-03-16 09:00:15 (audit log)",
  "2024-03-17 23:59:59 (audit log)"
)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c(
  "2024-03-15 14:30:00 (audit log)",
  "2024-03-16 09:00:15 (audit log)",
  "2024-03-17 23:59:59 (audit log)"
)
ex_1_4 <- parse_date_time(raw, orders = "Ymd HMS", truncated = 3)
ex_1_4
#> [1] "2024-03-15 14:30:00 UTC" "2024-03-16 09:00:15 UTC"
#> [3] "2024-03-17 23:59:59 UTC"
```

**Explanation:** `parse_date_time()` ignores trailing characters once it has consumed the requested format. `truncated = N` allows up to N missing trailing components. An alternative is to pre-clean with `sub("\\s*\\(.*\\)$", "", raw)` then call `ymd_hms()`; that is more explicit when the noise pattern is regular. Prefer regex pre-cleaning when the same noise appears on every row; use `truncated` when noise is varied.

</details>

## Section 2. Extracting date components (3 problems)

### Exercise 2.1: Pull year, month, day, and hour from a POSIXct vector

**Task:** Given the POSIXct vector `stamps`, extract the year, month, day, and hour into four separate integer vectors using `year()`, `month()`, `day()`, and `hour()`. Combine them into a tibble with columns `year`, `month`, `day`, `hour` and save it to `ex_2_1`.

```r
stamps <- ymd_hms(c("2024-03-15 09:00:00", "2024-07-04 14:30:00", "2024-12-31 23:59:00"))
```

**Expected result:**

```
#> # A tibble: 3 x 4
#>    year month   day  hour
#>   <dbl> <dbl> <int> <int>
#> 1  2024     3    15     9
#> 2  2024     7     4    14
#> 3  2024    12    31    23
```

**Difficulty:** Beginner

[HINTS]
Each calendar component can be pulled out with its own dedicated accessor, one accessor per column.
Wrap `year()`, `month()`, `day()`, and `hour()` calls inside a `tibble()`.

```r title="Your turn"
stamps <- ymd_hms(c("2024-03-15 09:00:00", "2024-07-04 14:30:00", "2024-12-31 23:59:00"))
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stamps <- ymd_hms(c("2024-03-15 09:00:00", "2024-07-04 14:30:00", "2024-12-31 23:59:00"))
ex_2_1 <- tibble(
  year  = year(stamps),
  month = month(stamps),
  day   = day(stamps),
  hour  = hour(stamps)
)
ex_2_1
#> # A tibble: 3 x 4
#>    year month   day  hour
#>   <dbl> <dbl> <int> <int>
#> 1  2024     3    15     9
#> 2  2024     7     4    14
#> 3  2024    12    31    23
```

**Explanation:** Each accessor returns a numeric vector the same length as its input, so they slot directly into a tibble column. For month names instead of numbers, use `month(stamps, label = TRUE, abbr = FALSE)`. The `lubridate::wday()` companion gives weekday with a `label` flag. These accessors are vectorized over POSIXct, Date, and character (after coercion), making them the workhorse for feature engineering on datetime columns.

</details>

### Exercise 2.2: Tag a retailer's orders with weekday name and weekend flag

**Task:** A retailer wants to see whether orders skew toward weekends. Given the inline `orders` tibble of order timestamps, add two columns: `dow` (weekday name like `"Mon"`) and `is_weekend` (logical TRUE for Saturday or Sunday). Save the augmented tibble to `ex_2_2`.

```r
orders <- tibble(order_id = 1:6,
                 placed_at = ymd_hms(c(
                   "2024-03-15 10:14:00",  # Fri
                   "2024-03-16 11:30:00",  # Sat
                   "2024-03-17 19:02:00",  # Sun
                   "2024-03-18 08:45:00",  # Mon
                   "2024-03-19 14:20:00",  # Tue
                   "2024-03-23 16:00:00"   # Sat
                 )))
```

**Expected result:**

```
#> # A tibble: 6 x 4
#>   order_id placed_at           dow   is_weekend
#>      <int> <dttm>              <ord> <lgl>
#> 1        1 2024-03-15 10:14:00 Fri   FALSE
#> 2        2 2024-03-16 11:30:00 Sat   TRUE
#> 3        3 2024-03-17 19:02:00 Sun   TRUE
#> 4        4 2024-03-18 08:45:00 Mon   FALSE
#> 5        5 2024-03-19 14:20:00 Tue   FALSE
#> 6        6 2024-03-23 16:00:00 Sat   TRUE
```

**Difficulty:** Intermediate

[HINTS]
You need two derived facts about each timestamp: the weekday name and whether that weekday lands on a weekend.
In `mutate()`, use `wday(..., label = TRUE)` for the name and `wday(..., week_start = 1) >= 6` for the flag.

```r title="Your turn"
orders <- tibble(order_id = 1:6,
                 placed_at = ymd_hms(c(
                   "2024-03-15 10:14:00",
                   "2024-03-16 11:30:00",
                   "2024-03-17 19:02:00",
                   "2024-03-18 08:45:00",
                   "2024-03-19 14:20:00",
                   "2024-03-23 16:00:00"
                 )))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- tibble(order_id = 1:6,
                 placed_at = ymd_hms(c(
                   "2024-03-15 10:14:00",
                   "2024-03-16 11:30:00",
                   "2024-03-17 19:02:00",
                   "2024-03-18 08:45:00",
                   "2024-03-19 14:20:00",
                   "2024-03-23 16:00:00"
                 )))
ex_2_2 <- orders |>
  mutate(
    dow        = wday(placed_at, label = TRUE, abbr = TRUE),
    is_weekend = wday(placed_at, week_start = 1) >= 6
  )
ex_2_2
```

**Explanation:** `wday(label = TRUE)` returns an ordered factor with weekday names, which is great for axis labels and arrange(). The numeric form depends on `week_start`: the default (`1` for Monday) makes Saturday `6` and Sunday `7`, so `>= 6` cleanly tags weekends. The default in some locales is Sunday-start, which would flip the comparison; always set `week_start` explicitly for reproducible reports.

</details>

### Exercise 2.3: Compute ISO week and quarter from economics dates

**Task:** Use the built-in `economics` tibble. Take the first ten rows and add `quarter` (e.g. `"2024 Q1"`) and `iso_week` (1 to 53) columns derived from the `date` column. Save the augmented ten-row tibble to `ex_2_3` and print it.

**Expected result:**

```
#> # A tibble: 10 x 8
#>    date         pce    pop psavert uempmed unemploy quarter iso_week
#>    <date>     <dbl>  <int>   <dbl>   <dbl>    <int> <chr>      <dbl>
#>  1 1967-07-01  507. 198712    12.6     4.5     2944 1967 Q3       26
#>  2 1967-08-01  510. 198911    12.6     4.7     2945 1967 Q3       31
#>  3 1967-09-01  516. 199113    11.9     4.6     2958 1967 Q3       35
#>  4 1967-10-01  513. 199311    12.9     4.9     3143 1967 Q4       39
#> ...
#> # 6 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
One column needs the calendar quarter, the other needs the international standard week number, both derived from the date column.
In `mutate()`, combine `year()` with `quarter()` for the label and use `isoweek()` for the week.

```r title="Your turn"
ex_2_3 <- economics |>
  head(10) |>
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- economics |>
  head(10) |>
  mutate(
    quarter  = paste(year(date), paste0("Q", quarter(date))),
    iso_week = isoweek(date)
  )
ex_2_3
#> # A tibble: 10 x 8
#>    date         pce    pop psavert uempmed unemploy quarter iso_week
#>    <date>     <dbl>  <int>   <dbl>   <dbl>    <int> <chr>      <dbl>
#>  1 1967-07-01  507. 198712    12.6     4.5     2944 1967 Q3       26
#>  2 1967-08-01  510. 198911    12.6     4.7     2945 1967 Q3       31
#> ...
```

**Explanation:** `quarter()` returns the calendar quarter as an integer 1 to 4, while `isoweek()` returns the ISO 8601 week number, where week 1 is the week containing the first Thursday of the year. Use `week()` for the simpler "day-of-year / 7" definition; ISO weeks matter when aligning to international reporting standards, payroll, or sports seasons that span year boundaries.

</details>

## Section 3. Period, duration, and interval arithmetic (4 problems)

### Exercise 3.1: Add thirty days to a date

**Task:** Take the date `"2024-01-15"` and add 30 days to it using `days(30)` from lubridate. Save the resulting date to `ex_3_1` and print it. The output should be a Date that is exactly thirty calendar days later than the input, with no time component attached.

**Expected result:**

```
#> [1] "2024-02-14"
```

**Difficulty:** Beginner

[HINTS]
Adding a calendar span to a date leaves you with a date - no clock component appears.
Add `days(30)` to the value returned by `ymd("2024-01-15")`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ymd("2024-01-15") + days(30)
ex_3_1
#> [1] "2024-02-14"
```

**Explanation:** `days(30)` builds a `Period` of 30 days, which respects calendar boundaries. Compared with `ddays(30)`, which is a fixed `Duration` of `30 * 86400` seconds, periods are usually what humans expect for "30 days later". The two diverge only across DST transitions or leap seconds. For business arithmetic ("30 days from today"), prefer `days()` over `ddays()`.

</details>

### Exercise 3.2: Compute trial expiration using months vs dmonths

**Task:** A SaaS subscription team needs to mark every trial as expiring exactly one calendar month after `signup_date`. The team has tried `signup_date + dmonths(1)` and seen off-by-one bugs near month ends. Using `months(1)`, build the inline tibble's `expires_on` column and save the result to `ex_3_2`.

```r
trials <- tibble(user = c("alice", "bob", "carol"),
                 signup_date = ymd(c("2024-01-31", "2024-02-15", "2024-03-30")))
```

**Expected result:**

```
#> # A tibble: 3 x 3
#>   user  signup_date expires_on
#>   <chr> <date>      <date>
#> 1 alice 2024-01-31  2024-02-29
#> 2 bob   2024-02-15  2024-03-15
#> 3 carol 2024-03-30  2024-04-30
```

**Difficulty:** Intermediate

[HINTS]
Plain addition of a one-month span fails at month ends because the target day may not exist, so you need the operator that rolls back to the last valid day.
Combine `months(1)` with the `%m+%` operator inside `mutate()`.

```r title="Your turn"
trials <- tibble(user = c("alice", "bob", "carol"),
                 signup_date = ymd(c("2024-01-31", "2024-02-15", "2024-03-30")))
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
trials <- tibble(user = c("alice", "bob", "carol"),
                 signup_date = ymd(c("2024-01-31", "2024-02-15", "2024-03-30")))
ex_3_2 <- trials |>
  mutate(expires_on = signup_date %m+% months(1))
ex_3_2
#> # A tibble: 3 x 3
#>   user  signup_date expires_on
#>   <chr> <date>      <date>
#> 1 alice 2024-01-31  2024-02-29
#> 2 bob   2024-02-15  2024-03-15
#> 3 carol 2024-03-30  2024-04-30
```

**Explanation:** `signup_date + months(1)` returns `NA` for `2024-01-31` because there is no Feb 31. The `%m+%` operator rolls back to the last valid day of the target month, which is what billing systems want. `dmonths(1)` is a fixed 30.4375 days and drifts; never use it for calendar-month math. Pair `%m+%` with `months()` whenever you need to add or subtract calendar months safely.

</details>

### Exercise 3.3: Days between two dates as an integer

**Task:** Given the start date `"2024-01-01"` and the end date `"2024-03-15"`, compute the number of full days between them as an integer scalar. Use `interval()` and division by `days(1)`, then coerce to integer. Save the integer count to `ex_3_3` and print it along with its class.

**Expected result:**

```
#> [1] 74
#> [1] "integer"
```

**Difficulty:** Intermediate

[HINTS]
Anchor the span to a real start and end, then express its length as a count of whole days.
Divide `interval(start_d, end_d)` by `days(1)` and wrap the result in `as.integer()`.

```r title="Your turn"
start_d <- ymd("2024-01-01")
end_d   <- ymd("2024-03-15")
ex_3_3 <- # your code here
ex_3_3
class(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
start_d <- ymd("2024-01-01")
end_d   <- ymd("2024-03-15")
ex_3_3 <- as.integer(interval(start_d, end_d) / days(1))
ex_3_3
#> [1] 74
class(ex_3_3)
#> [1] "integer"
```

**Explanation:** `interval(start, end)` builds a time span anchored to a real start/end, and dividing by `days(1)` returns the number of days as a `Period` ratio. This survives DST and month-length variation. The shorter `as.integer(difftime(end_d, start_d, units = "days"))` works for plain Dates but can produce non-integer results across DST when applied to POSIXct, so the interval/period idiom is safer for mixed types.

</details>

### Exercise 3.4: Detect overlapping booking windows

**Task:** An operations team manages meeting-room reservations and needs to flag any pair of bookings whose intervals overlap. From the inline `bookings` tibble, build a tibble of all `i < j` index pairs where `int_overlaps()` returns TRUE on their intervals. Save the result to `ex_3_4` with columns `i`, `j`, and `room`.

```r
bookings <- tibble(
  id    = 1:5,
  room  = c("A", "A", "A", "B", "B"),
  start = ymd_hm(c("2024-03-15 09:00", "2024-03-15 10:30", "2024-03-15 13:00",
                   "2024-03-15 09:00", "2024-03-15 09:30")),
  end   = ymd_hm(c("2024-03-15 11:00", "2024-03-15 11:00", "2024-03-15 14:00",
                   "2024-03-15 10:00", "2024-03-15 10:30"))
)
```

**Expected result:**

```
#> # A tibble: 2 x 3
#>       i     j room
#>   <int> <int> <chr>
#> 1     1     2 A
#> 2     4     5 B
```

**Difficulty:** Advanced

[HINTS]
Compare every distinct pair of bookings in the same room to see whether their time spans intersect.
Build spans with `interval()`, generate the `i < j` index pairs, and test each pair with `int_overlaps()`.

```r title="Your turn"
bookings <- tibble(
  id    = 1:5,
  room  = c("A", "A", "A", "B", "B"),
  start = ymd_hm(c("2024-03-15 09:00", "2024-03-15 10:30", "2024-03-15 13:00",
                   "2024-03-15 09:00", "2024-03-15 09:30")),
  end   = ymd_hm(c("2024-03-15 11:00", "2024-03-15 11:00", "2024-03-15 14:00",
                   "2024-03-15 10:00", "2024-03-15 10:30"))
)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bookings <- tibble(
  id    = 1:5,
  room  = c("A", "A", "A", "B", "B"),
  start = ymd_hm(c("2024-03-15 09:00", "2024-03-15 10:30", "2024-03-15 13:00",
                   "2024-03-15 09:00", "2024-03-15 09:30")),
  end   = ymd_hm(c("2024-03-15 11:00", "2024-03-15 11:00", "2024-03-15 14:00",
                   "2024-03-15 10:00", "2024-03-15 10:30"))
)
ivs <- interval(bookings$start, bookings$end)
pairs <- expand.grid(i = seq_along(ivs), j = seq_along(ivs)) |>
  filter(i < j, bookings$room[i] == bookings$room[j])
pairs$overlap <- mapply(int_overlaps, ivs[pairs$i], ivs[pairs$j])
ex_3_4 <- pairs |>
  filter(overlap) |>
  transmute(i, j, room = bookings$room[i])
ex_3_4
#> # A tibble: 2 x 3
#>       i     j room
#>   <int> <int> <chr>
#> 1     1     2 A
#> 2     4     5 B
```

**Explanation:** `int_overlaps()` treats intervals as closed-open so a booking that ends exactly when another starts is NOT flagged as overlapping, which matches calendar app behavior. Restricting to `i < j` avoids double counting and self-pairs. For large booking tables, sort by start time and sweep once instead of comparing all pairs; the all-pairs approach here is the cleanest correct baseline, fine up to a few thousand rows.

</details>

## Section 4. Timezones and formatting (3 problems)

### Exercise 4.1: Convert a UTC log timestamp to New York exchange time

**Task:** A trading desk records all order events in UTC. Convert the UTC timestamp vector `events` to America/New_York local time without changing the underlying moment. Use `with_tz()`. Save the converted POSIXct vector to `ex_4_1` and verify the printed timezone abbreviation matches EST or EDT.

```r
events <- ymd_hms(c("2024-01-15 14:30:00", "2024-07-15 14:30:00"), tz = "UTC")
```

**Expected result:**

```
#> [1] "2024-01-15 09:30:00 EST" "2024-07-15 10:30:00 EDT"
```

**Difficulty:** Intermediate

[HINTS]
Re-express the same absolute instant under a different regional clock, without shifting the moment itself.
Call `with_tz()` with `tzone = "America/New_York"`.

```r title="Your turn"
events <- ymd_hms(c("2024-01-15 14:30:00", "2024-07-15 14:30:00"), tz = "UTC")
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- ymd_hms(c("2024-01-15 14:30:00", "2024-07-15 14:30:00"), tz = "UTC")
ex_4_1 <- with_tz(events, tzone = "America/New_York")
ex_4_1
#> [1] "2024-01-15 09:30:00 EST" "2024-07-15 10:30:00 EDT"
```

**Explanation:** `with_tz()` keeps the absolute moment fixed and re-labels it in a new zone, so the wall-clock display changes. Its sibling `force_tz()` does the opposite: it keeps the wall-clock unchanged and reinterprets it in a new zone, which shifts the absolute moment. Use `with_tz()` for display conversions, `force_tz()` to fix mislabeled raw data. Notice how DST flips the offset between January (EST, UTC-5) and July (EDT, UTC-4).

</details>

### Exercise 4.2: Format a date as `Mon, Jan 15 2024`

**Task:** Format the date `"2024-01-15"` as the human-friendly string `"Mon, Jan 15 2024"` using `format()` with the right format codes. Save the formatted character scalar to `ex_4_2` and print it. The day-of-week abbreviation comes first, then comma, then month-day-year.

**Expected result:**

```
#> [1] "Mon, Jan 15 2024"
```

**Difficulty:** Intermediate

[HINTS]
Turn the date into a display string by spelling out which pieces appear and in what order.
Pass the format string `"%a, %b %d %Y"` to `format()`.

```r title="Your turn"
d <- ymd("2024-01-15")
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- ymd("2024-01-15")
ex_4_2 <- format(d, "%a, %b %d %Y")
ex_4_2
#> [1] "Mon, Jan 15 2024"
```

**Explanation:** `format.Date` uses C-style `strftime` codes: `%a` weekday abbreviated, `%A` weekday full, `%b` month abbreviated, `%B` month full, `%d` zero-padded day, `%Y` four-digit year. For locale-independent output set `Sys.setlocale("LC_TIME", "C")` first, otherwise weekday and month names follow the user's locale. lubridate has a `stamp()` function that infers the format from an example string and can be handy for irregular outputs.

</details>

### Exercise 4.3: Detect a DST spring-forward in a timestamp sequence

**Task:** An ops engineer wants to flag the spring-forward day in a daily timestamp sequence. Build a daily sequence of POSIXct values at 02:30 local time for 2024-03-09 through 2024-03-11 in America/New_York. Compute the `dst()` flag for each. Save a tibble with columns `ts` and `is_dst` as `ex_4_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   ts                         is_dst
#>   <dttm>                     <lgl>
#> 1 2024-03-09 02:30:00        FALSE
#> 2 2024-03-10 03:30:00        TRUE
#> 3 2024-03-11 02:30:00        TRUE
```

**Difficulty:** Advanced

[HINTS]
Build the regular daily series first, then test each timestamp for whether it sits inside Daylight Saving.
Generate the sequence with `seq(..., by = "1 day")` in the New York zone, then apply `dst()` inside a `tibble()`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ts <- seq(ymd_hms("2024-03-09 02:30:00", tz = "America/New_York"),
          by = "1 day", length.out = 3)
ex_4_3 <- tibble(ts = ts, is_dst = dst(ts))
ex_4_3
#> # A tibble: 3 x 2
#>   ts                         is_dst
#>   <dttm>                     <lgl>
#> 1 2024-03-09 02:30:00        FALSE
#> 2 2024-03-10 03:30:00        TRUE
#> 3 2024-03-11 02:30:00        TRUE
```

**Explanation:** Notice that the printed clock time on March 10 jumps from 02:30 to 03:30: the hour 02:00 to 03:00 simply does not exist in America/New_York that day. `dst()` returns TRUE for moments inside Daylight Saving. This is why scheduling jobs with naive local timestamps is fragile; mission-critical schedules should run in UTC and convert to local for display. For non-DST math use `force_tz(ts, "UTC")` first.

</details>

## Section 5. Sequences, filtering, and aggregation (3 problems)

### Exercise 5.1: Generate the next seven daily dates starting today

**Task:** Build a length-7 vector of consecutive daily Dates starting on `"2024-03-15"` using `seq.Date()` or `seq()` with `by = "1 day"`. Save the vector to `ex_5_1` and print it. The result should be a clean sequence with class `Date` and length seven.

**Expected result:**

```
#> [1] "2024-03-15" "2024-03-16" "2024-03-17" "2024-03-18"
#> [5] "2024-03-19" "2024-03-20" "2024-03-21"
```

**Difficulty:** Beginner

[HINTS]
Ask for a regular run of consecutive days with a fixed start and a known count.
Call `seq()` on `ymd("2024-03-15")` with `by = "1 day"` and `length.out = 7`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- seq(ymd("2024-03-15"), by = "1 day", length.out = 7)
ex_5_1
#> [1] "2024-03-15" "2024-03-16" "2024-03-17" "2024-03-18"
#> [5] "2024-03-19" "2024-03-20" "2024-03-21"
```

**Explanation:** `seq()` dispatches to `seq.Date()` when the start is a Date. You can use `by = "1 day"`, `"1 week"`, `"1 month"`, `"1 year"`, or any duration string. Replacing `length.out = 7` with `to = ymd("2024-03-21")` gives the same result. To pull only weekdays, generate seven dates then filter with `wday(x, week_start = 1) <= 5`. For business-day calendars across holidays, the `bizdays` package is the cleaner tool.

</details>

### Exercise 5.2: Filter rows to the last 90 days relative to a fixed today

**Task:** Given the inline `events` tibble and a fixed reference date `"2024-04-01"`, return rows whose `ts` is strictly within the last 90 days, that is `ts > today - 90 days`. Use `difftime()` or interval division to keep the comparison safe. Save the filtered tibble to `ex_5_2`.

```r
events <- tibble(id = 1:6,
                 ts = ymd(c("2023-12-01", "2024-01-05", "2024-01-15",
                            "2024-02-10", "2024-03-20", "2024-04-01")))
today <- ymd("2024-04-01")
```

**Expected result:**

```
#> # A tibble: 4 x 2
#>      id ts
#>   <int> <date>
#> 1     2 2024-01-05
#> 2     3 2024-01-15
#> 3     4 2024-02-10
#> 4     5 2024-03-20
```

**Difficulty:** Intermediate

[HINTS]
Keep only rows inside a trailing window measured back from the reference date and stopping before it.
In `filter()`, compare `ts` against `today - days(90)` and against `today`.

```r title="Your turn"
events <- tibble(id = 1:6,
                 ts = ymd(c("2023-12-01", "2024-01-05", "2024-01-15",
                            "2024-02-10", "2024-03-20", "2024-04-01")))
today <- ymd("2024-04-01")
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(id = 1:6,
                 ts = ymd(c("2023-12-01", "2024-01-05", "2024-01-15",
                            "2024-02-10", "2024-03-20", "2024-04-01")))
today <- ymd("2024-04-01")
ex_5_2 <- events |>
  filter(ts > today - days(90), ts < today)
ex_5_2
#> # A tibble: 4 x 2
#>      id ts
#>   <int> <date>
#> 1     2 2024-01-05
#> 2     3 2024-01-15
#> 3     4 2024-02-10
#> 4     5 2024-03-20
```

**Explanation:** Subtracting `days(90)` from a Date returns another Date, so the comparison stays type-stable. The strict inequalities exclude rows exactly 90 days old and rows AT today, matching most "trailing window, excluding today" reports. Replacing `today - days(90)` with `today - 90` works for plain Dates but breaks if the column is POSIXct; using `days(90)` is the idiom-safe form for either type.

</details>

### Exercise 5.3: Aggregate the economics series by year

**Task:** Use the built-in `economics` tibble. Group rows by calendar year of the `date` column and compute the mean `unemploy` (in thousands) per year. Sort descending by mean unemployment. Save the resulting tibble of `year` and `mean_unemploy` to `ex_5_3` and print the top six rows.

**Expected result:**

```
#> # A tibble: 6 x 2
#>    year mean_unemploy
#>   <dbl>         <dbl>
#> 1  2010        14825.
#> 2  2011        13747.
#> 3  2012        12506.
#> 4  2009        14265.
#> 5  2013        11460.
#> 6  2014         9617.
```

**Difficulty:** Intermediate

[HINTS]
Roll the monthly series up to one row per calendar year, then order rows by the summarised value.
Add a year column with `year()`, then `group_by()`, `summarise(mean(unemploy))`, and `arrange(desc(...))`.

```r title="Your turn"
ex_5_3 <- economics |>
  # your code here
head(ex_5_3, 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- economics |>
  mutate(year = year(date)) |>
  group_by(year) |>
  summarise(mean_unemploy = mean(unemploy), .groups = "drop") |>
  arrange(desc(mean_unemploy))
head(ex_5_3, 6)
#> # A tibble: 6 x 2
#>    year mean_unemploy
#>   <dbl>         <dbl>
#> 1  2010        14825.
#> 2  2011        13747.
#> 3  2012        12506.
#> 4  2009        14265.
#> 5  2013        11460.
#> 6  2014         9617.
```

**Explanation:** Extracting `year()` then grouping is the most readable pattern for yearly rollups. The newer dplyr 1.1+ inline form `summarise(.by = year(date), ...)` also works and avoids creating a permanent column. For multi-grain aggregations (year-quarter, year-month), build all grain columns once with `mutate()` then call `summarise()` separately; recomputing inside `summarise` makes the SQL plan harder to read for collaborators.

</details>

## Section 6. Real-world workflows (3 problems)

### Exercise 6.1: Compute patient age in years at encounter date

**Task:** A healthcare analyst needs the patient's age in completed years at the time of each clinic encounter. From the inline `patients` tibble, compute `age` using interval division by `years(1)` and integer truncation so a birthday not yet reached this year rounds down. Save the augmented tibble to `ex_6_1`.

```r
patients <- tibble(
  patient_id   = c("P001", "P002", "P003", "P004"),
  date_of_birth = ymd(c("1980-06-15", "1995-12-31", "2010-03-15", "1955-07-04")),
  encounter_dt  = ymd(c("2024-03-15", "2024-03-15", "2024-03-15", "2024-03-15"))
)
```

**Expected result:**

```
#> # A tibble: 4 x 4
#>   patient_id date_of_birth encounter_dt   age
#>   <chr>      <date>        <date>       <int>
#> 1 P001       1980-06-15    2024-03-15      43
#> 2 P002       1995-12-31    2024-03-15      28
#> 3 P003       2010-03-15    2024-03-15      14
#> 4 P004       1955-07-04    2024-03-15      68
```

**Difficulty:** Advanced

[HINTS]
Measure the span as a fractional age that knows whether this year's birthday has passed, then floor it to completed years.
Divide `interval(date_of_birth, encounter_dt)` by `years(1)`, then apply `trunc()` and `as.integer()`.

```r title="Your turn"
patients <- tibble(
  patient_id   = c("P001", "P002", "P003", "P004"),
  date_of_birth = ymd(c("1980-06-15", "1995-12-31", "2010-03-15", "1955-07-04")),
  encounter_dt  = ymd(c("2024-03-15", "2024-03-15", "2024-03-15", "2024-03-15"))
)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
patients <- tibble(
  patient_id   = c("P001", "P002", "P003", "P004"),
  date_of_birth = ymd(c("1980-06-15", "1995-12-31", "2010-03-15", "1955-07-04")),
  encounter_dt  = ymd(c("2024-03-15", "2024-03-15", "2024-03-15", "2024-03-15"))
)
ex_6_1 <- patients |>
  mutate(age = as.integer(trunc(interval(date_of_birth, encounter_dt) / years(1))))
ex_6_1
#> # A tibble: 4 x 4
#>   patient_id date_of_birth encounter_dt   age
#>   <chr>      <date>        <date>       <int>
#> 1 P001       1980-06-15    2024-03-15      43
#> 2 P002       1995-12-31    2024-03-15      28
#> 3 P003       2010-03-15    2024-03-15      14
#> 4 P004       1955-07-04    2024-03-15      68
```

**Explanation:** `interval(dob, enc) / years(1)` returns a fractional age (e.g. 43.75) that correctly accounts for whether the birthday has occurred this year. `trunc()` then floors toward zero, giving completed years, the standard clinical and legal definition of age. Using `(enc - dob) / 365.25` is wrong: leap years and calendar drift make it disagree with the legal age near birthdays. Always prefer the interval-period idiom for age computations.

</details>

### Exercise 6.2: Tag invoices as on-time, due-soon, or overdue

**Task:** A finance team scans an invoice ledger and needs each row tagged. Given the inline `invoices` tibble and `today = ymd("2024-04-01")`, add a column `status` with three values: `"overdue"` if `due_date < today`, `"due_soon"` if due within 7 days, otherwise `"on_time"`. Save the tagged tibble to `ex_6_2`.

```r
invoices <- tibble(invoice_id = sprintf("INV%03d", 1:5),
                   amount   = c(1200, 850, 4500, 300, 2200),
                   due_date = ymd(c("2024-03-15", "2024-04-04",
                                    "2024-04-15", "2024-03-30", "2024-04-30")))
today <- ymd("2024-04-01")
```

**Expected result:**

```
#> # A tibble: 5 x 4
#>   invoice_id amount due_date   status
#>   <chr>       <dbl> <date>     <chr>
#> 1 INV001       1200 2024-03-15 overdue
#> 2 INV002        850 2024-04-04 due_soon
#> 3 INV003       4500 2024-04-15 on_time
#> 4 INV004        300 2024-03-30 overdue
#> 5 INV005       2200 2024-04-30 on_time
```

**Difficulty:** Intermediate

[HINTS]
Assign each row one of three labels by testing the due date against the reference date in priority order, most urgent first.
Use `case_when()` with `due_date < today` as the first branch and `due_date <= today + days(7)` as the second.

```r title="Your turn"
invoices <- tibble(invoice_id = sprintf("INV%03d", 1:5),
                   amount   = c(1200, 850, 4500, 300, 2200),
                   due_date = ymd(c("2024-03-15", "2024-04-04",
                                    "2024-04-15", "2024-03-30", "2024-04-30")))
today <- ymd("2024-04-01")
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
invoices <- tibble(invoice_id = sprintf("INV%03d", 1:5),
                   amount   = c(1200, 850, 4500, 300, 2200),
                   due_date = ymd(c("2024-03-15", "2024-04-04",
                                    "2024-04-15", "2024-03-30", "2024-04-30")))
today <- ymd("2024-04-01")
ex_6_2 <- invoices |>
  mutate(status = case_when(
    due_date <  today              ~ "overdue",
    due_date <= today + days(7)    ~ "due_soon",
    TRUE                           ~ "on_time"
  ))
ex_6_2
#> # A tibble: 5 x 4
#>   invoice_id amount due_date   status
#>   <chr>       <dbl> <date>     <chr>
#> 1 INV001       1200 2024-03-15 overdue
#> 2 INV002        850 2024-04-04 due_soon
#> 3 INV003       4500 2024-04-15 on_time
#> 4 INV004        300 2024-03-30 overdue
#> 5 INV005       2200 2024-04-30 on_time
```

**Explanation:** `case_when()` reads top-to-bottom and the first matching branch wins, so listing `overdue` first prevents an `overdue` row from being relabeled `due_soon`. Adding `days(7)` to a Date returns a Date, so the comparison stays type-stable; mixing in `dweeks(1)` (a Duration) would coerce the Date to POSIXct and surprise downstream joins. Use Periods for calendar windows in business logic.

</details>

### Exercise 6.3: Build a calendar tibble with month, quarter, and weekend flag

**Task:** Build a daily calendar tibble for every day in Q1 2024 (Jan 1 through Mar 31) with columns `date`, `month_name`, `quarter`, `iso_week`, and `is_weekend`. This is the kind of dimension table a BI team prebuilds so dashboards do not have to recompute date features. Save the result to `ex_6_3` and inspect the first six rows.

**Expected result:**

```
#> # A tibble: 91 x 5
#>   date       month_name quarter iso_week is_weekend
#>   <date>     <ord>        <int>    <dbl> <lgl>
#> 1 2024-01-01 January          1        1 FALSE
#> 2 2024-01-02 January          1        1 FALSE
#> 3 2024-01-03 January          1        1 FALSE
#> 4 2024-01-04 January          1        1 FALSE
#> 5 2024-01-05 January          1        1 FALSE
#> 6 2024-01-06 January          1        1 TRUE
#> ...
#> # 85 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
Lay down one row per day across the quarter first, then attach each date feature as its own column.
Build the date series with `seq(..., by = "1 day")`, then `mutate()` with `month()`, `quarter()`, `isoweek()`, and `wday()`.

```r title="Your turn"
ex_6_3 <- # your code here
head(ex_6_3, 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- tibble(date = seq(ymd("2024-01-01"), ymd("2024-03-31"), by = "1 day")) |>
  mutate(
    month_name = month(date, label = TRUE, abbr = FALSE),
    quarter    = quarter(date),
    iso_week   = isoweek(date),
    is_weekend = wday(date, week_start = 1) >= 6
  )
head(ex_6_3, 6)
#> # A tibble: 6 x 5
#>   date       month_name quarter iso_week is_weekend
#>   <date>     <ord>        <int>    <dbl> <lgl>
#> 1 2024-01-01 January          1        1 FALSE
#> 2 2024-01-02 January          1        1 FALSE
#> 3 2024-01-03 January          1        1 FALSE
#> 4 2024-01-04 January          1        1 FALSE
#> 5 2024-01-05 January          1        1 FALSE
#> 6 2024-01-06 January          1        1 TRUE
```

**Explanation:** A pre-built daily calendar table is the single best optimization for date-driven BI: every dashboard joins to it instead of recomputing weekday/quarter/holiday flags. In production extend this with `is_holiday`, `fiscal_year`, and a `working_day_index` column. The `tidyquant::tk_make_timeseries_signature()` helper produces a thirty-plus-column version automatically; rolling your own gives you control over the columns you actually need.

</details>

## What to do next

Now that you have practiced date and time work, here are the next stops:

- [lubridate Exercises in R](lubridate-Exercises-in-R.html) for a deeper drill on lubridate's full API.
- [R Syntax 101](R-Syntax-101.html) to revisit the foundations that the date system builds on.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) to pair date features with grouped summaries.
- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) for the vectorization patterns that complement date math.
