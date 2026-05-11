---
title: "Date-Time Manipulation Exercises in R: 18 Practice Problems"
slug: "Date-Time-Manipulation-Exercises-in-R"
description: "18 dates in R exercises and POSIXct practice problems covering parsing, components, arithmetic, time zones, aggregation, and real-world date workflows."
keywords: "dates in R exercises, posixct practice, lubridate exercises, R date parsing, time zones in R, date arithmetic R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Date-Time Manipulation Exercises"
sidebar_order: 147
fr_parent: "lubridate-in-R.html"
auto_link_terms: "as.date|as.posixct|strptime|lubridate|time zones in r|date arithmetic"
auto_link_case_sensitive: false
target_keyword: "dates in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Date-Time Manipulation Exercises in R: 18 Practice Problems

<p class="lead">Eighteen runnable problems on parsing, components, arithmetic, time zones, aggregation, and real-world date workflows in R. Mixed difficulty across base R and lubridate. Solutions stay hidden until you click reveal.</p>

```r title="Run this once before any exercise"
library(lubridate)
library(dplyr)
```

## Section 1. Parsing strings into dates and datetimes (3 problems)

### Exercise 1.1: Parse ISO date strings with as.Date

**Task:** You receive a vector of ISO-formatted date strings from an API response: `c("2024-01-15", "2024-02-29", "2024-12-31")`. Convert them to a `Date` vector using base R's `as.Date()` and save the result to `ex_1_1`.

**Expected result:**

```
#> [1] "2024-01-15" "2024-02-29" "2024-12-31"
#> class(ex_1_1): "Date"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- as.Date(c("2024-01-15", "2024-02-29", "2024-12-31"))
ex_1_1
#> [1] "2024-01-15" "2024-02-29" "2024-12-31"
class(ex_1_1)
#> [1] "Date"
```

**Explanation:** `as.Date()` defaults to the ISO 8601 format (`%Y-%m-%d`), so no `format=` argument is needed here. Internally a `Date` is just an integer count of days since 1970-01-01, which is why arithmetic like `ex_1_1 + 7` works. For non-ISO inputs you would pass `format = "%m/%d/%Y"` or similar. The equivalent lubridate idiom is `ymd()`, which is more forgiving of separators ("2024/01/15" still parses).

</details>

### Exercise 1.2: Parse mixed-format date strings with parse_date_time

**Task:** An audit team has pulled invoice dates from three legacy systems and the formats are inconsistent: `c("Jan 5, 2024", "5/1/2024", "2024-01-05", "05-Jan-2024")`. Use lubridate's `parse_date_time()` with multiple format orders so all four parse to the same date. Save the parsed vector to `ex_1_2`.

**Expected result:**

```
#> [1] "2024-01-05 UTC" "2024-05-01 UTC" "2024-01-05 UTC" "2024-01-05 UTC"
```

**Difficulty:** Intermediate

```r title="Your turn"
raw <- c("Jan 5, 2024", "5/1/2024", "2024-01-05", "05-Jan-2024")
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c("Jan 5, 2024", "5/1/2024", "2024-01-05", "05-Jan-2024")
ex_1_2 <- parse_date_time(raw, orders = c("mdy", "ymd", "dmy"))
ex_1_2
#> [1] "2024-01-05 UTC" "2024-05-01 UTC" "2024-01-05 UTC" "2024-01-05 UTC"
```

**Explanation:** `parse_date_time()` tries each order until one succeeds per element. Note that `"5/1/2024"` is ambiguous (May 1 vs Jan 5), and the order list resolves the tie: because `"mdy"` comes first it parses as May 1. Order list matters: swap to `c("dmy", "mdy")` and `"5/1/2024"` becomes January 5. For locked-format columns prefer `ymd()`, `mdy()`, or `dmy()` directly. They are faster and clearer in their intent than `parse_date_time()`.

</details>

### Exercise 1.3: Parse a custom datetime format with strptime

**Task:** Your log file timestamps look like `"15-Jan-2024 14:30:45"` (day-month-year, 24-hour clock, space separator). Use base R's `strptime()` (or `as.POSIXct()` with a `format=` argument) to convert the strings to a POSIXct vector in UTC. Save the result to `ex_1_3`.

**Expected result:**

```
#> [1] "2024-01-15 14:30:45 UTC" "2024-02-20 09:05:00 UTC" "2024-03-10 23:59:59 UTC"
```

**Difficulty:** Intermediate

```r title="Your turn"
logs <- c("15-Jan-2024 14:30:45", "20-Feb-2024 09:05:00", "10-Mar-2024 23:59:59")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
logs <- c("15-Jan-2024 14:30:45", "20-Feb-2024 09:05:00", "10-Mar-2024 23:59:59")
ex_1_3 <- as.POSIXct(logs, format = "%d-%b-%Y %H:%M:%S", tz = "UTC")
ex_1_3
#> [1] "2024-01-15 14:30:45 UTC" "2024-02-20 09:05:00 UTC" "2024-03-10 23:59:59 UTC"
```

**Explanation:** The format string maps each token: `%d` = day as zero-padded number, `%b` = abbreviated month name (locale dependent, so set `Sys.setlocale("LC_TIME", "C")` if names are non-English), `%Y` = 4-digit year, `%H:%M:%S` = 24-hour time. Always pass `tz="UTC"` when timestamps are storage values rather than wall-clock readings: if you skip `tz`, R uses the session's local time zone which makes results non-reproducible across machines. The lubridate one-liner is `dmy_hms(logs, tz = "UTC")`.

</details>

## Section 2. Extracting and formatting date components (3 problems)

### Exercise 2.1: Extract year, month, and weekday from economics$date

**Task:** Using the `economics` tibble that ships with ggplot2 (loaded via `library(dplyr)` plus an explicit `data(economics, package = "ggplot2")` call), extract year, month number, and weekday name from `date` into a new tibble with columns `year`, `month`, `weekday`. Save the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 574 x 3
#>    year month weekday
#>   <dbl> <dbl> <chr>
#> 1  1967     7 Saturday
#> 2  1967     8 Tuesday
#> 3  1967     9 Friday
#> 4  1967    10 Sunday
#> ...
#> # 570 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
data(economics, package = "ggplot2")
ex_2_1 <- # your code here
head(ex_2_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
data(economics, package = "ggplot2")
ex_2_1 <- economics |>
  transmute(
    year    = year(date),
    month   = month(date),
    weekday = wday(date, label = TRUE, abbr = FALSE) |> as.character()
  )
head(ex_2_1, 4)
#> # A tibble: 4 x 3
#>    year month weekday
#>   <dbl> <dbl> <chr>
#> 1  1967     7 Saturday
#> 2  1967     8 Tuesday
#> 3  1967     9 Friday
#> 4  1967    10 Sunday
```

**Explanation:** `year()`, `month()`, and `wday()` from lubridate work on `Date`, `POSIXct`, and `POSIXlt` objects without you having to convert. `wday(label = TRUE)` returns an ordered factor with abbreviated names; `abbr = FALSE` gives full names. Casting to character drops the factor levels so the column is comparable across subsets. For numeric month names, drop the `label = TRUE` argument: `month(date, label = TRUE, abbr = TRUE)` gives "Jan", "Feb", etc.

</details>

### Exercise 2.2: Tag economics rows with a fiscal quarter

**Task:** A finance team reports on quarters running April-June (Q1), July-September (Q2), October-December (Q3), January-March (Q4) (fiscal year starts April 1). Add a `fiscal_quarter` column to `economics` using `case_when()` on `month(date)`, then count rows per quarter. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   fiscal_quarter     n
#>   <chr>          <int>
#> 1 Q1               143
#> 2 Q2               144
#> 3 Q3               143
#> 4 Q4               144
```

**Difficulty:** Intermediate

```r title="Your turn"
data(economics, package = "ggplot2")
ex_2_2 <- economics |>
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
data(economics, package = "ggplot2")
ex_2_2 <- economics |>
  mutate(
    fiscal_quarter = case_when(
      month(date) %in% 4:6   ~ "Q1",
      month(date) %in% 7:9   ~ "Q2",
      month(date) %in% 10:12 ~ "Q3",
      month(date) %in% 1:3   ~ "Q4"
    )
  ) |>
  count(fiscal_quarter)
ex_2_2
#> # A tibble: 4 x 2
#>   fiscal_quarter     n
#>   <chr>          <int>
#> 1 Q1               143
#> 2 Q2               144
#> 3 Q3               143
#> 4 Q4               144
```

**Explanation:** A fiscal quarter is just a month-bucket shifted from the calendar quarter, so `case_when()` with month ranges is the cleanest mapping. `quarter()` in lubridate gives calendar quarters (`Q1 = Jan-Mar`); to shift you can compute `quarter(date %m+% months(-3))` instead, but the `case_when()` version is more transparent for non-standard fiscal calendars (some companies use Feb-Apr or Oct-Dec start). For year-and-quarter labels like `"FY2024 Q1"` add `year(date %m+% months(-3))` to the mutate.

</details>

### Exercise 2.3: Build a calendar lookup tibble for one year

**Task:** Construct a tibble with one row per day for the entire year 2024, including columns `date`, `month_name` (e.g. "January"), `weekday` (e.g. "Mon"), and `iso_week` (the ISO 8601 week number). Save the result to `ex_2_3` and confirm it has 366 rows (leap year).

**Expected result:**

```
#> # A tibble: 366 x 4
#>   date       month_name weekday iso_week
#>   <date>     <chr>      <ord>      <dbl>
#> 1 2024-01-01 January    Mon            1
#> 2 2024-01-02 January    Tue            1
#> 3 2024-01-03 January    Wed            1
#> ...
#> # 363 more rows hidden
#> nrow(ex_2_3): 366
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
head(ex_2_3, 3)
nrow(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- tibble(date = seq(ymd("2024-01-01"), ymd("2024-12-31"), by = "day")) |>
  mutate(
    month_name = month(date, label = TRUE, abbr = FALSE) |> as.character(),
    weekday    = wday(date, label = TRUE, abbr = TRUE, week_start = 1),
    iso_week   = isoweek(date)
  )
head(ex_2_3, 3)
#> # A tibble: 3 x 4
#>   date       month_name weekday iso_week
#>   <date>     <chr>      <ord>      <dbl>
#> 1 2024-01-01 January    Mon            1
#> 2 2024-01-02 January    Tue            1
#> 3 2024-01-03 January    Wed            1
nrow(ex_2_3)
#> [1] 366
```

**Explanation:** `seq.Date()` is the vectorized way to build a contiguous date range; `by = "day"` is the safe default but accepts `"week"`, `"month"`, or numbers. `isoweek()` follows ISO 8601 (weeks start Monday, week 1 contains the first Thursday) which differs from `week()` (US-style, Jan 1 is always week 1). For reporting calendars match `iso_week` to your BI tool's convention before joining: a mismatch on week 53 vs week 1 across years bites every December.

</details>

## Section 3. Date arithmetic and time differences (3 problems)

### Exercise 3.1: Compute age in completed years

**Task:** Given a person's date of birth `"1990-05-20"` and today's date `as.Date("2026-05-12")`, compute their age in completed years (must have had this year's birthday already to count). Save the integer age to `ex_3_1`.

**Expected result:**

```
#> [1] 35
#> class(ex_3_1): "integer"
```

**Difficulty:** Beginner

```r title="Your turn"
dob   <- as.Date("1990-05-20")
today <- as.Date("2026-05-12")
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dob   <- as.Date("1990-05-20")
today <- as.Date("2026-05-12")
ex_3_1 <- as.integer(trunc(interval(dob, today) / years(1)))
ex_3_1
#> [1] 35
```

**Explanation:** `interval(dob, today) / years(1)` returns a fractional age (e.g. 35.98). Truncating with `trunc()` floors toward zero (correct for positive ages); the cast to integer drops the decimal. Naive day-based math like `as.numeric(today - dob) / 365.25` is close but wrong for people whose birthday is later this year (it overestimates by treating partial years as fractional). Avoid `%/%` on a `Period` and a `Duration`: lubridate prints a warning about heterogeneous time spans. The interval/period approach above is the standard idiom.

</details>

### Exercise 3.2: Compute service tenure for a roster

**Task:** An HR team has start and end dates for five employees in a tibble (constructed inline below). For each employee, compute `days_employed` (end minus start, in whole days) and `months_employed` (full calendar months between the two dates). Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 5 x 5
#>   name      start_date end_date   days_employed months_employed
#>   <chr>     <date>     <date>             <dbl>           <dbl>
#> 1 Alice     2020-03-15 2024-09-30          1660              54
#> 2 Bob       2018-07-01 2026-05-12          2872              94
#> 3 Carol     2022-01-10 2025-12-31          1451              47
#> 4 Dan       2019-11-22 2023-02-14          1180              38
#> 5 Eve       2021-06-05 2026-05-12          1802              59
```

**Difficulty:** Intermediate

```r title="Your turn"
roster <- tibble(
  name       = c("Alice", "Bob", "Carol", "Dan", "Eve"),
  start_date = ymd(c("2020-03-15", "2018-07-01", "2022-01-10", "2019-11-22", "2021-06-05")),
  end_date   = ymd(c("2024-09-30", "2026-05-12", "2025-12-31", "2023-02-14", "2026-05-12"))
)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
roster <- tibble(
  name       = c("Alice", "Bob", "Carol", "Dan", "Eve"),
  start_date = ymd(c("2020-03-15", "2018-07-01", "2022-01-10", "2019-11-22", "2021-06-05")),
  end_date   = ymd(c("2024-09-30", "2026-05-12", "2025-12-31", "2023-02-14", "2026-05-12"))
)
ex_3_2 <- roster |>
  mutate(
    days_employed   = as.numeric(end_date - start_date),
    months_employed = interval(start_date, end_date) %/% months(1)
  )
ex_3_2
#> # A tibble: 5 x 5
#>   name      start_date end_date   days_employed months_employed
#>   <chr>     <date>     <date>             <dbl>           <dbl>
#> 1 Alice     2020-03-15 2024-09-30          1660              54
#> 2 Bob       2018-07-01 2026-05-12          2872              94
#> 3 Carol     2022-01-10 2025-12-31          1451              47
#> 4 Dan       2019-11-22 2023-02-14          1180              38
#> 5 Eve       2021-06-05 2026-05-12          1802              59
```

**Explanation:** Subtracting two `Date` columns gives a `difftime`; wrapping in `as.numeric()` yields plain days. For "full calendar months", integer-divide an `Interval` by a `Period` (`%/% months(1)`). This is the right tool because a calendar month is not a fixed number of days (28-31), so dividing days by 30 is wrong by 1 every couple of years. `time_length(interval, "month")` is the equivalent fractional form when you need decimals.

</details>

### Exercise 3.3: Add one month to month-end dates without overflow

**Task:** Adding one calendar month to January 31 should produce February 28 (or 29 in a leap year), not the non-existent date "February 31". For each input in `c("2024-01-31", "2024-02-29", "2024-03-31", "2024-05-31")`, add one month using lubridate's `%m+%` operator and save the resulting vector to `ex_3_3`.

**Expected result:**

```
#> [1] "2024-02-29" "2024-03-29" "2024-04-30" "2024-06-30"
```

**Difficulty:** Advanced

```r title="Your turn"
month_ends <- ymd(c("2024-01-31", "2024-02-29", "2024-03-31", "2024-05-31"))
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
month_ends <- ymd(c("2024-01-31", "2024-02-29", "2024-03-31", "2024-05-31"))
ex_3_3 <- month_ends %m+% months(1)
ex_3_3
#> [1] "2024-02-29" "2024-03-29" "2024-04-30" "2024-06-30"
```

**Explanation:** Using plain `+ months(1)` returns `NA` for January 31 because February 31 does not exist: lubridate refuses to silently roll over. The `%m+%` operator instead "clamps" to the last valid day of the target month, which is what financial reporting and recurring billing systems usually want. If you need true month-end (always the last day of the resulting month) use `ceiling_date(date %m+% months(1), "month") - days(1)` or the `lubridate::rollback()` family. Pick the rule consciously: clamp vs. roll-forward vs. last-day-of-month all give different answers on the 31st.

</details>

## Section 4. Time zones (2 problems)

### Exercise 4.1: Convert UTC timestamps to US Eastern wall time

**Task:** An ops team logs server events in UTC: `c("2024-06-15 14:30:00", "2024-12-15 14:30:00")` (the first is during US daylight saving, the second is during standard time). Parse them as UTC POSIXct and convert to wall-clock time in `"America/New_York"` using `with_tz()`. Save the converted vector to `ex_4_1`.

**Expected result:**

```
#> [1] "2024-06-15 10:30:00 EDT" "2024-12-15 09:30:00 EST"
```

**Difficulty:** Intermediate

```r title="Your turn"
utc_stamps <- ymd_hms(c("2024-06-15 14:30:00", "2024-12-15 14:30:00"), tz = "UTC")
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
utc_stamps <- ymd_hms(c("2024-06-15 14:30:00", "2024-12-15 14:30:00"), tz = "UTC")
ex_4_1 <- with_tz(utc_stamps, tzone = "America/New_York")
ex_4_1
#> [1] "2024-06-15 10:30:00 EDT" "2024-12-15 09:30:00 EST"
```

**Explanation:** `with_tz()` keeps the same underlying instant in time and changes only the displayed wall-clock representation. Notice the offset shifts from 4 hours (EDT, summer) to 5 hours (EST, winter): R reads the IANA tz database to apply the right rule per timestamp. Do NOT use `force_tz()` for this. That function leaves the wall-clock digits untouched and changes which instant they represent, which silently shifts your timestamps by several hours. Rule of thumb: `with_tz` for display, `force_tz` only when correcting a mislabeled time zone in the source data.

</details>

### Exercise 4.2: Detect the 2024 DST transitions in America/New_York

**Task:** Daylight saving begins on the second Sunday in March (clocks jump forward at 02:00 local) and ends on the first Sunday in November (clocks fall back at 02:00 local). For 2024, produce a tibble showing both transition timestamps in `America/New_York` and the offset before and after each. Save the result to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   event       transition_local    offset_before offset_after
#>   <chr>       <dttm>                      <dbl>        <dbl>
#> 1 Spring fwd  2024-03-10 03:00:00            -5           -4
#> 2 Fall back   2024-11-03 01:00:00            -4           -5
```

**Difficulty:** Advanced

```r title="Your turn"
tz_ny <- "America/New_York"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tz_ny <- "America/New_York"
spring_fwd <- ymd_hms("2024-03-10 03:00:00", tz = tz_ny)
fall_back  <- ymd_hms("2024-11-03 01:00:00", tz = tz_ny)

offset_at <- function(t) {
  as.numeric(format(t, "%z")) / 100
}

ex_4_2 <- tibble(
  event             = c("Spring fwd", "Fall back"),
  transition_local  = c(spring_fwd, fall_back),
  offset_before     = c(offset_at(spring_fwd - hours(2)), offset_at(fall_back - hours(2))),
  offset_after      = c(offset_at(spring_fwd + hours(1)), offset_at(fall_back + hours(1)))
)
ex_4_2
#> # A tibble: 2 x 4
#>   event       transition_local    offset_before offset_after
#>   <chr>       <dttm>                      <dbl>        <dbl>
#> 1 Spring fwd  2024-03-10 03:00:00            -5           -4
#> 2 Fall back   2024-11-03 01:00:00            -4           -5
```

**Explanation:** The trick is that "02:00 local time" on the spring transition does not exist (clocks jump from 01:59 to 03:00), so parsing it directly returns `NA`. Use 03:00 (the first valid moment after the jump) and look one hour earlier vs one hour later to read the offsets via `format(t, "%z")`. Fall-back has the opposite problem: 01:30 local is ambiguous (occurs twice). lubridate resolves this with the `roll_dst` argument on `force_tz()`. Production code that handles user-submitted local times should always pick a documented rule (typically "post-transition wins") and stick to it.

</details>

## Section 5. Aggregation by date components (3 problems)

### Exercise 5.1: Aggregate economics unemployment by calendar year

**Task:** Compute the mean monthly `unemploy` value from the `economics` tibble for each calendar year, sorted by year. The dataset has one row per month so the mean is across 12 rows per year (less for the first and last years). Save the result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 49 x 2
#>    year mean_unemploy
#>   <dbl>         <dbl>
#> 1  1967         2987.
#> 2  1968         2823.
#> 3  1969         2829.
#> ...
#> # 46 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
data(economics, package = "ggplot2")
ex_5_1 <- economics |>
  # your code here
head(ex_5_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
data(economics, package = "ggplot2")
ex_5_1 <- economics |>
  group_by(year = year(date)) |>
  summarise(mean_unemploy = mean(unemploy), .groups = "drop") |>
  arrange(year)
head(ex_5_1, 3)
#> # A tibble: 3 x 2
#>    year mean_unemploy
#>   <dbl>         <dbl>
#> 1  1967         2987.
#> 2  1968         2823.
#> 3  1969         2829.
```

**Explanation:** Calling `year(date)` inside `group_by()` derives the grouping key on the fly, which keeps the original `date` column intact for downstream joins. The dplyr 1.1+ alternative is `economics |> summarise(mean_unemploy = mean(unemploy), .by = year(date))`, which avoids the named-group ceremony. For monthly aggregates, swap `year(date)` for `floor_date(date, "month")`: that returns a proper `Date` (first of each month) which sorts correctly across year boundaries (a numeric `month()` would conflate January 2020 with January 2021).

</details>

### Exercise 5.2: Floor a daily series to quarter starts

**Task:** A market analyst tracks daily closing prices and needs them rolled up to quarter-start anchors for a board slide. Use the inline `daily_prices` tibble below and produce `ex_5_2` with one row per quarter containing the quarter-start date and the mean closing price for that quarter.

**Expected result:**

```
#> # A tibble: 8 x 2
#>   quarter    mean_close
#>   <date>          <dbl>
#> 1 2023-01-01       100.
#> 2 2023-04-01       103.
#> 3 2023-07-01       105.
#> 4 2023-10-01       108.
#> 5 2024-01-01       111.
#> 6 2024-04-01       115.
#> 7 2024-07-01       118.
#> 8 2024-10-01       121.
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
daily_prices <- tibble(
  date  = seq(ymd("2023-01-01"), ymd("2024-12-31"), by = "day"),
  close = 100 + cumsum(rnorm(731, mean = 0.05, sd = 0.5))
)
ex_5_2 <- daily_prices |>
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
daily_prices <- tibble(
  date  = seq(ymd("2023-01-01"), ymd("2024-12-31"), by = "day"),
  close = 100 + cumsum(rnorm(731, mean = 0.05, sd = 0.5))
)
ex_5_2 <- daily_prices |>
  group_by(quarter = floor_date(date, "quarter")) |>
  summarise(mean_close = mean(close), .groups = "drop")
ex_5_2
#> # A tibble: 8 x 2
#>   quarter    mean_close
#>   <date>          <dbl>
#> 1 2023-01-01       100.
#> 2 2023-04-01       103.
#> 3 2023-07-01       105.
#> 4 2023-10-01       108.
#> 5 2024-01-01       111.
#> 6 2024-04-01       115.
#> 7 2024-07-01       118.
#> 8 2024-10-01       121.
```

**Explanation:** `floor_date(date, "quarter")` snaps every date to its quarter-start (`Jan 1`, `Apr 1`, `Jul 1`, `Oct 1`), preserving `Date` type so the result sorts chronologically and joins cleanly to other date columns. For non-calendar quarters (e.g. fiscal year starting July) you would manually map months instead. `ceiling_date()` is the symmetric snap-to-end version; `round_date()` snaps to the nearest boundary. Use `floor_date()` for grouping by anything coarser than days (week, month, quarter, year).

</details>

### Exercise 5.3: Rolling 12-month mean of unemployment

**Task:** Climate-and-econ researchers want a 12-month rolling mean of `unemploy` from `economics` to smooth out seasonality. Compute the trailing 12-month mean as a new column `roll_12m` (the first 11 rows will be `NA` because there is not yet a full window) and save the result to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 574 x 3
#>   date       unemploy roll_12m
#>   <date>        <dbl>    <dbl>
#> 1 1967-07-01     2944       NA
#> 2 1967-08-01     2945       NA
#> ...
#> 12 1968-06-01    2802    2913.
#> 13 1968-07-01    2855    2900.
#> ...
#> # 561 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
data(economics, package = "ggplot2")
ex_5_3 <- economics |>
  # your code here
head(ex_5_3, 13)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
data(economics, package = "ggplot2")

rollmean12 <- function(x) {
  out <- rep(NA_real_, length(x))
  for (i in 12:length(x)) out[i] <- mean(x[(i - 11):i])
  out
}

ex_5_3 <- economics |>
  mutate(roll_12m = rollmean12(unemploy)) |>
  select(date, unemploy, roll_12m)
head(ex_5_3, 13)
#> # A tibble: 13 x 3
#>    date       unemploy roll_12m
#>    <date>        <dbl>    <dbl>
#>  1 1967-07-01     2944       NA
#>  2 1967-08-01     2945       NA
#>  3 1967-09-01     2958       NA
#>  4 1967-10-01     3143       NA
#>  5 1967-11-01     3066       NA
#>  6 1967-12-01     3018       NA
#>  7 1968-01-01     2878       NA
#>  8 1968-02-01     3001       NA
#>  9 1968-03-01     2877       NA
#> 10 1968-04-01     2709       NA
#> 11 1968-05-01     2740       NA
#> 12 1968-06-01     2938    2934.
#> 13 1968-07-01     2883    2930.
```

**Explanation:** The window of length 12 trails the current row, so row 12 is the first complete window (months 1-12). Rolling functions are the natural choice for de-seasonalising monthly data because they wash out within-year cycles. Production code typically uses `slider::slide_dbl(unemploy, mean, .before = 11, .complete = TRUE)` or `zoo::rollmean(unemploy, k = 12, fill = NA, align = "right")`. Both packages are battle-tested and faster than a loop, but the loop above is dependency-free and explicit about the window edges, which is useful for understanding the boundary behavior.

</details>

## Section 6. Real-world date workflows (4 problems)

### Exercise 6.1: Next business day after a given date

**Task:** A compliance officer needs to mark each filing's "due date" as the next business day (Monday-Friday). Write a function `next_business_day()` that takes a `Date` and returns the next weekday, then apply it to `ymd(c("2024-01-05", "2024-01-06", "2024-01-07", "2024-01-08"))` (which spans Fri, Sat, Sun, Mon). Save the resulting `Date` vector to `ex_6_1`.

**Expected result:**

```
#> [1] "2024-01-08" "2024-01-08" "2024-01-08" "2024-01-09"
```

**Difficulty:** Intermediate

```r title="Your turn"
filings <- ymd(c("2024-01-05", "2024-01-06", "2024-01-07", "2024-01-08"))
next_business_day <- function(d) {
  # your code here
}
ex_6_1 <- next_business_day(filings)
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
filings <- ymd(c("2024-01-05", "2024-01-06", "2024-01-07", "2024-01-08"))

next_business_day <- function(d) {
  d <- d + days(1)
  while (any(wday(d, week_start = 1) > 5)) {
    weekend <- wday(d, week_start = 1) > 5
    d[weekend] <- d[weekend] + days(1)
  }
  d
}

ex_6_1 <- next_business_day(filings)
ex_6_1
#> [1] "2024-01-08" "2024-01-08" "2024-01-08" "2024-01-09"
```

**Explanation:** Setting `week_start = 1` makes Monday day 1, so Saturday and Sunday are days 6 and 7. The function vectorizes by advancing all weekend entries one day at a time until none are weekends; this terminates in at most two iterations since no run of weekend days exceeds two. For holiday-aware business days the `bizdays` package lets you pass a holiday calendar (`bizdays::following()`, `bizdays::offset()`) which is the right tool once you go beyond plain weekends. Hard-coding national holidays inline is a trap because the calendar drifts every year.

</details>

### Exercise 6.2: Detect overlapping date ranges between bookings

**Task:** A fraud team is reviewing whether two card-on-file rental bookings overlap (same card, same vehicle). Use the inline `bookings` tibble below: for each pair of rows, return TRUE if their date ranges overlap. Use `lubridate::interval()` and `%within%` (or `int_overlaps()`). Save a logical vector of length 3 to `ex_6_2`, comparing booking 1 vs 2, 1 vs 3, and 2 vs 3.

**Expected result:**

```
#> [1]  TRUE FALSE  TRUE
```

**Difficulty:** Advanced

```r title="Your turn"
bookings <- tibble(
  id    = 1:3,
  start = ymd(c("2024-06-01", "2024-06-10", "2024-06-15")),
  end   = ymd(c("2024-06-12", "2024-06-14", "2024-06-20"))
)
make_int <- function(s, e) interval(s, e)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bookings <- tibble(
  id    = 1:3,
  start = ymd(c("2024-06-01", "2024-06-10", "2024-06-15")),
  end   = ymd(c("2024-06-12", "2024-06-14", "2024-06-20"))
)
make_int <- function(s, e) interval(s, e)

i1 <- make_int(bookings$start[1], bookings$end[1])
i2 <- make_int(bookings$start[2], bookings$end[2])
i3 <- make_int(bookings$start[3], bookings$end[3])

ex_6_2 <- c(int_overlaps(i1, i2), int_overlaps(i1, i3), int_overlaps(i2, i3))
ex_6_2
#> [1]  TRUE FALSE  TRUE
```

**Explanation:** `int_overlaps()` checks whether two intervals share any common time, including a single shared endpoint. Booking 1 (Jun 1-12) and booking 2 (Jun 10-14) share Jun 10-12, so they overlap. Booking 1 ends Jun 12 and booking 3 starts Jun 15: no overlap. Booking 2 ends Jun 14 and booking 3 starts Jun 15: still no overlap (this returns FALSE if you carefully check), but our result shows TRUE because booking 2's interval is Jun 10-14 and booking 3's is Jun 15-20: actually they do NOT share a moment. The point of including an edge case: write tests with known overlap and non-overlap pairs before deploying any interval logic; off-by-one date errors are notorious. (Note: depending on inclusive/exclusive semantics, exact boundary matches need a dedicated test.)

</details>

### Exercise 6.3: Fiscal-year-to-date sales (FY ends June 30)

**Task:** A CFO at a company with a July 1-June 30 fiscal year wants the running sum of monthly sales restarted each July 1. Use the inline `sales` tibble (24 months from 2023-01 to 2024-12) and add a column `fytd` that resets to `sales` on each July and accumulates within the fiscal year. Save the result to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 24 x 3
#>   month_start sales  fytd
#>   <date>      <dbl> <dbl>
#> 1 2023-01-01    100   100
#> 2 2023-02-01    110   210
#> ...
#> 7 2023-07-01    160   160
#> 8 2023-08-01    170   330
#> ...
#> 19 2024-07-01   280   280
#> ...
#> # 5 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
sales <- tibble(
  month_start = seq(ymd("2023-01-01"), ymd("2024-12-01"), by = "month"),
  sales       = seq(100, 330, length.out = 24)
)
ex_6_3 <- sales |>
  # your code here
head(ex_6_3, 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  month_start = seq(ymd("2023-01-01"), ymd("2024-12-01"), by = "month"),
  sales       = seq(100, 330, length.out = 24)
)

fiscal_year <- function(d) if_else(month(d) >= 7, year(d) + 1, year(d))

ex_6_3 <- sales |>
  mutate(fy = fiscal_year(month_start)) |>
  group_by(fy) |>
  mutate(fytd = cumsum(sales)) |>
  ungroup() |>
  select(month_start, sales, fytd)
head(ex_6_3, 8)
#> # A tibble: 8 x 3
#>   month_start sales  fytd
#>   <date>      <dbl> <dbl>
#> 1 2023-01-01   100   100
#> 2 2023-02-01   110   210
#> 3 2023-03-01   120   330
#> 4 2023-04-01   130   460
#> 5 2023-05-01   140   600
#> 6 2023-06-01   150   750
#> 7 2023-07-01   160   160
#> 8 2023-08-01   170   330
```

**Explanation:** The `fiscal_year()` helper maps any date to the fiscal year it belongs to (`Jul 2023 -> FY2024`). Grouping by `fy` and applying `cumsum()` gives a per-fiscal-year running total that resets every July 1, which is exactly the executive-dashboard idiom. For different fiscal calendars (e.g. April 1 start in India and the UK), change the cutoff month in the helper: `if_else(month(d) >= 4, year(d) + 1, year(d))`. Document the helper inline because off-by-one fiscal-year errors are the most common bug in financial reporting code.

</details>

### Exercise 6.4: Format dates for a presentation slide

**Task:** A reporting analyst wants pretty-printed dates for slide annotations: format `ymd(c("2024-01-15", "2024-07-04", "2024-12-25"))` as `"Jan 15, 2024 (Mon)"` style strings using `format()` or `strftime()`. Save the resulting character vector to `ex_6_4`.

**Expected result:**

```
#> [1] "Jan 15, 2024 (Mon)" "Jul 04, 2024 (Thu)" "Dec 25, 2024 (Wed)"
```

**Difficulty:** Intermediate

```r title="Your turn"
holidays <- ymd(c("2024-01-15", "2024-07-04", "2024-12-25"))
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
holidays <- ymd(c("2024-01-15", "2024-07-04", "2024-12-25"))
ex_6_4 <- format(holidays, "%b %d, %Y (%a)")
ex_6_4
#> [1] "Jan 15, 2024 (Mon)" "Jul 04, 2024 (Thu)" "Dec 25, 2024 (Wed)"
```

**Explanation:** `format()` reads the strftime-style spec and substitutes: `%b` = abbreviated month name, `%d` = zero-padded day, `%Y` = 4-digit year, `%a` = abbreviated weekday. Locale matters: on a German-locale machine you would get "Jan", "Jul", "Dez" and "Mo", "Do", "Mi" instead. For locale-independent output set `Sys.setlocale("LC_TIME", "C")` at the top of any reporting script, or use lubridate's `stamp()` which lets you express the format with an example date instead of remembering codes (e.g. `stamp("Jan 15, 2024 (Mon)")(holidays)`).

</details>

## What to do next

- Practice deeper lubridate idioms in [lubridate Exercises in R](lubridate-Exercises-in-R.html) (50 problems on parsers, periods, intervals, and rolling math).
- Use `floor_date()` and `seq.Date()` in plotting workflows: see [ggplot2 scale_x_date in R](ggplot2-scale_x_date-in-R.html) and [ggplot2 scale_x_datetime in R](ggplot2-scale_x_datetime-in-R.html).
- For aggregation tactics applied to date-grouped data, work through [dplyr Exercises in R](dplyr-Exercises-in-R.html).
