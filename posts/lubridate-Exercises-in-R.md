---
title: "lubridate Exercises in R: 50 Real Practice Problems"
slug: "lubridate-Exercises-in-R"
description: "Master lubridate with 50 practice problems in R: parsing, components, arithmetic, intervals, time zones. Hidden solutions, runnable code."
keywords: "lubridate exercises, lubridate practice, lubridate exercises in R, dates in R exercises, R date manipulation practice, datetime in R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "lubridate Exercises"
sidebar_order: 112
fr_parent: "R-Tutorial.html"
auto_link_terms: "lubridate exercises|lubridate practice|dates in R exercises|R date manipulation"
auto_link_case_sensitive: false
target_keyword: "lubridate exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# lubridate Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on lubridate: parse, extract components, do date arithmetic, work with intervals and time zones. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(lubridate)
library(dplyr)
library(tibble)
```

## Section 1. Parsing dates (8 problems)

### Exercise 1.1: ymd

**Difficulty:** Beginner. Parse "2024-01-15".

<details><summary>Show solution</summary>

```r
ymd("2024-01-15")
```

</details>

### Exercise 1.2: mdy

**Difficulty:** Beginner. Parse "01/15/2024".

<details><summary>Show solution</summary>

```r
mdy("01/15/2024")
```

</details>

### Exercise 1.3: dmy

**Difficulty:** Beginner. Parse "15-01-2024".

<details><summary>Show solution</summary>

```r
dmy("15-01-2024")
```

</details>

### Exercise 1.4: ymd_hms

**Difficulty:** Intermediate. Parse "2024-01-15 14:30:00".

<details><summary>Show solution</summary>

```r
ymd_hms("2024-01-15 14:30:00")
```

</details>

### Exercise 1.5: parse_date_time multi-format

**Difficulty:** Intermediate. Parse a vector with mixed formats.

<details><summary>Show solution</summary>

```r
parse_date_time(c("2024-01-15","01/15/2024","Jan 15, 2024"),
                orders = c("ymd","mdy","mdY"))
```

</details>

### Exercise 1.6: From milliseconds since epoch

**Difficulty:** Advanced. Convert 1705305600 to POSIXct.

<details><summary>Show solution</summary>

```r
as_datetime(1705305600)
```

</details>

### Exercise 1.7: Parse with timezone

**Difficulty:** Advanced. Parse and set NY timezone.

<details><summary>Show solution</summary>

```r
ymd_hms("2024-01-15 09:00:00", tz = "America/New_York")
```

</details>

### Exercise 1.8: From a numeric like 20240115

**Difficulty:** Intermediate. Parse 20240115 as a date.

<details><summary>Show solution</summary>

```r
ymd(20240115)
```

</details>

## Section 2. Extract components (8 problems)

### Exercise 2.1: Year

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
year(ymd("2024-04-15"))
```

</details>

### Exercise 2.2: Month with label

**Difficulty:** Intermediate. Full month name.

<details><summary>Show solution</summary>

```r
month(ymd("2024-04-15"), label = TRUE, abbr = FALSE)
```

</details>

### Exercise 2.3: Day of month

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
day(ymd("2024-04-15"))
```

</details>

### Exercise 2.4: Day of week

**Difficulty:** Intermediate. With Monday-first abbreviated label.

<details><summary>Show solution</summary>

```r
wday(ymd("2024-04-15"), label = TRUE, week_start = 1)
```

</details>

### Exercise 2.5: Day of year (julian)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
yday(ymd("2024-04-15"))
```

</details>

### Exercise 2.6: Quarter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
quarter(ymd("2024-04-15"))
```

</details>

### Exercise 2.7: Week of year

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
week(ymd("2024-04-15"))
```

</details>

### Exercise 2.8: Hour, minute, second

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ts <- ymd_hms("2024-04-15 14:30:45")
c(h = hour(ts), m = minute(ts), s = second(ts))
```

</details>

## Section 3. Arithmetic (8 problems)

### Exercise 3.1: Add days

**Difficulty:** Beginner. Add 7 days.

<details><summary>Show solution</summary>

```r
ymd("2024-01-15") + days(7)
```

</details>

### Exercise 3.2: Add weeks

**Difficulty:** Beginner. Add 4 weeks.

<details><summary>Show solution</summary>

```r
ymd("2024-01-15") + weeks(4)
```

</details>

### Exercise 3.3: Add months

**Difficulty:** Intermediate. Add 3 months. Note period vs duration.

<details><summary>Show solution</summary>

```r
ymd("2024-01-15") + months(3)
```

</details>

### Exercise 3.4: Subtract years

**Difficulty:** Intermediate. 5 years ago today.

<details><summary>Show solution</summary>

```r
today() - years(5)
```

</details>

### Exercise 3.5: Difference in days

**Difficulty:** Intermediate. Days between two dates.

<details><summary>Show solution</summary>

```r
as.integer(ymd("2024-04-15") - ymd("2024-01-01"))
```

</details>

### Exercise 3.6: Age in years

**Difficulty:** Intermediate. Age from birth date.

<details><summary>Show solution</summary>

```r
as.integer(interval(ymd("1990-05-20"), today()) / years(1))
```

</details>

### Exercise 3.7: Add business days (approximation)

**Difficulty:** Advanced. Add 10 weekdays.

<details><summary>Show solution</summary>

```r
add_with_rollback(ymd("2024-01-15"), days(14))   # rough; for true business days, bizdays pkg
```

</details>

### Exercise 3.8: Roll to month end

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ceiling_date(ymd("2024-02-10"), "month") - days(1)
```

</details>

## Section 4. Intervals and durations (8 problems)

### Exercise 4.1: Interval object

**Difficulty:** Intermediate. Build an interval Jan 1 to Apr 30.

<details><summary>Show solution</summary>

```r
interval(ymd("2024-01-01"), ymd("2024-04-30"))
```

</details>

### Exercise 4.2: Duration in days

**Difficulty:** Intermediate. Same span as days.

<details><summary>Show solution</summary>

```r
as.duration(interval(ymd("2024-01-01"), ymd("2024-04-30"))) / ddays(1)
```

</details>

### Exercise 4.3: Check overlap

**Difficulty:** Advanced. Do two intervals overlap?

<details><summary>Show solution</summary>

```r
i1 <- interval(ymd("2024-01-01"), ymd("2024-04-30"))
i2 <- interval(ymd("2024-04-15"), ymd("2024-06-30"))
int_overlaps(i1, i2)
```

</details>

### Exercise 4.4: Period vs duration

**Difficulty:** Advanced. Show difference using months().

<details><summary>Show solution</summary>

```r
ymd("2024-01-31") + months(1)   # period: Feb 29 (leap-aware)
ymd("2024-01-31") + dmonths(1)  # duration: ~Mar 2 (fixed seconds)
```

</details>

### Exercise 4.5: Check if date in interval

**Difficulty:** Intermediate. Is "2024-03-15" inside Jan-Apr?

<details><summary>Show solution</summary>

```r
ymd("2024-03-15") %within% interval(ymd("2024-01-01"), ymd("2024-04-30"))
```

</details>

### Exercise 4.6: Length in months

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
i <- interval(ymd("2024-01-15"), ymd("2024-07-31"))
i %/% months(1)
```

</details>

### Exercise 4.7: Sum durations

**Difficulty:** Intermediate. Add 2 hours and 30 minutes.

<details><summary>Show solution</summary>

```r
hours(2) + minutes(30)
```

</details>

### Exercise 4.8: Days remaining in month

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- ymd("2024-04-15")
as.integer(ceiling_date(d, "month") - 1 - d)
```

</details>

## Section 5. Floor and round (8 problems)

### Exercise 5.1: Floor to month

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
floor_date(ymd("2024-04-15"), "month")
```

</details>

### Exercise 5.2: Floor to week (Mon start)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
floor_date(ymd("2024-04-15"), "week", week_start = 1)
```

</details>

### Exercise 5.3: Ceiling to month

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ceiling_date(ymd("2024-04-15"), "month")
```

</details>

### Exercise 5.4: Round to nearest hour

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
round_date(ymd_hms("2024-04-15 14:35:00"), "hour")
```

</details>

### Exercise 5.5: Floor to quarter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
floor_date(ymd("2024-04-15"), "quarter")
```

</details>

### Exercise 5.6: Group by month

**Difficulty:** Intermediate. Aggregate counts per month.

<details><summary>Show solution</summary>

```r
df <- tibble(date = as.Date(c("2024-01-05","2024-01-20","2024-02-10")),
             n = c(1, 2, 3))
df |> mutate(m = floor_date(date, "month")) |>
      group_by(m) |> summarise(n = sum(n))
```

</details>

### Exercise 5.7: Floor to 15-minute bucket

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
floor_date(ymd_hms("2024-04-15 14:37:21"), "15 mins")
```

</details>

### Exercise 5.8: Round to nearest day

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
round_date(ymd_hms("2024-04-15 13:00:00"), "day")
```

</details>

## Section 6. Time zones (5 problems)

### Exercise 6.1: Set time zone

**Difficulty:** Intermediate. Force NY timezone.

<details><summary>Show solution</summary>

```r
force_tz(ymd_hms("2024-04-15 09:00:00"), "America/New_York")
```

</details>

### Exercise 6.2: Convert time zone

**Difficulty:** Advanced. NY -> Tokyo.

<details><summary>Show solution</summary>

```r
ts <- ymd_hms("2024-04-15 09:00:00", tz = "America/New_York")
with_tz(ts, "Asia/Tokyo")
```

</details>

### Exercise 6.3: List available zones

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
head(OlsonNames(), 10)
```

</details>

### Exercise 6.4: Daylight saving check

**Difficulty:** Advanced. Is "2024-07-01 NY" in DST?

<details><summary>Show solution</summary>

```r
dst(ymd_hms("2024-07-01 12:00:00", tz = "America/New_York"))
```

</details>

### Exercise 6.5: Convert to UTC

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
with_tz(ymd_hms("2024-04-15 09:00:00", tz = "America/New_York"), "UTC")
```

</details>

## Section 7. Real workflows (5 problems)

### Exercise 7.1: Compute days between events

**Difficulty:** Intermediate. Per user, days from first to last event.

<details><summary>Show solution</summary>

```r
events <- tibble(user = c("a","a","b","b"),
                 date = ymd(c("2024-01-05","2024-03-10","2024-02-01","2024-04-15")))
events |>
  group_by(user) |>
  summarise(days = as.integer(max(date) - min(date)))
```

</details>

### Exercise 7.2: Build a daily calendar

**Difficulty:** Intermediate. All dates in Q1 2024.

<details><summary>Show solution</summary>

```r
seq.Date(ymd("2024-01-01"), ymd("2024-03-31"), by = "day")
```

</details>

### Exercise 7.3: Detect weekends

**Difficulty:** Beginner. Flag a date as weekend.

<details><summary>Show solution</summary>

```r
wday(ymd("2024-04-13"), week_start = 1) %in% c(6, 7)
```

</details>

### Exercise 7.4: Group transactions by month-end

**Difficulty:** Advanced. Tag each row with its month-end.

<details><summary>Show solution</summary>

```r
df <- tibble(date = ymd(c("2024-01-15","2024-02-20","2024-03-05")), amt = c(50,80,30))
df |> mutate(month_end = ceiling_date(date, "month") - 1)
```

</details>

### Exercise 7.5: Time-of-day buckets

**Difficulty:** Intermediate. Tag hour as morning/afternoon/evening.

<details><summary>Show solution</summary>

```r
ts <- ymd_hms(c("2024-04-15 08:30:00","2024-04-15 14:00:00","2024-04-15 21:00:00"))
case_when(hour(ts) < 12 ~ "morning",
          hour(ts) < 18 ~ "afternoon",
          TRUE          ~ "evening")
```

</details>

## What to do next

- **Date-Time-Manipulation-Exercises** (coming) — broader date workflows.
- **tidyverse-Exercises** (shipped) — dates inside data pipelines.
- **Time-Series-Exercises** (coming) — date-indexed analysis.
