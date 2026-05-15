---
title: "lubridate days() in R: Add or Subtract Calendar Days"
slug: "lubridate-days-in-R"
description: "Use lubridate days() in R to add or subtract calendar-day periods from dates, vectorise across columns, and contrast days() with ddays() across DST boundaries."
keywords: "lubridate days, days function R, lubridate days examples, add days to date R, lubridate period days, days() lubridate, subtract days from date R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "days()|lubridate days|lubridate::days()|add days to date|day period"
auto_link_case_sensitive: true
target_keyword: "lubridate days"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate days() in R: Add or Subtract Calendar Days

<p class="lead">The <code>days()</code> function in lubridate builds a Period object representing N calendar days. Add it to a Date or POSIXct to shift forward, subtract to shift backward, and rely on calendar-aware behaviour across daylight saving boundaries.</p>

[QUICK ANSWER]
days(7)                                  # a 7-day period object
ymd("2024-01-01") + days(30)             # shift a date forward
today() - days(1)                        # yesterday
days(c(1, 7, 30))                        # vector of period lengths
ymd("2024-01-15") + days(-10)            # negative shift, same as subtract
dates + days(1)                          # vectorised over a date column
df %>% mutate(due = order_date + days(30))  # 30-day due date column
ymd_hms("2024-03-09 22:00", tz = "US/Eastern") + days(1)  # DST-safe

[DECISION TREE: Is days() the right tool?]
- shift a date by N calendar days: x + days(N)
- shift by exact 86,400-second units (ignore DST): x + ddays(N)
- shift by calendar weeks, months, years: x + weeks(N), months(N), years(N)
- compute the gap between two dates: difftime(b, a, units = "days")
- find the last day of the month: ceiling_date(x, "month") - days(1)
- extract the day-of-month integer: day(x)
- count working days only: bizdays::bizdays(a, b, calendar)
- build a date from year, month, day: make_date(y, m, d)

## What days() does in one sentence

**`days()` constructs a calendar-aware Period of N days that you can add to or subtract from a date.** Pass an integer or numeric vector and lubridate returns a Period that respects the calendar when added to Date or POSIXct values.

This is the lubridate counterpart to base R's `x + N` on a Date. The difference matters once time zones and daylight saving appear, because `days()` shifts the date component while leaving the clock time alone.

## Syntax

**`days(x = 1)` accepts a numeric vector and returns a Period of the same length.** Default `x` is 1, so `days()` by itself is a one-day period.

```r title="Load lubridate and build a period"
library(lubridate)

days(7)
#> [1] "7d 0H 0M 0S"

class(days(7))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

days(c(1, 7, 30))
#> [1] "1d 0H 0M 0S"  "7d 0H 0M 0S"  "30d 0H 0M 0S"
```

The "d" prefix in the print method confirms a Period, not a Duration. Both add to dates, but Periods track calendar units while Durations track exact seconds.

[TIP]
**Reach for `days()` when you want "same time, N days later" semantics.** A Period of one day is always one calendar day, even when daylight saving steals or adds an hour. If you need an exact 86,400-second shift instead, use `ddays()`.

## Six common patterns

### 1. Add N days to a date

```r title="Shift a date forward"
ymd("2024-01-01") + days(7)
#> [1] "2024-01-08"

ymd("2024-01-31") + days(1)
#> [1] "2024-02-01"
```

The result is a Date that respects month boundaries. January 31 plus one day rolls cleanly into February 1; no leap-year or month-length logic needed.

### 2. Subtract N days from a date

```r title="Shift a date backward"
today_val <- ymd("2024-07-15")
today_val - days(30)
#> [1] "2024-06-15"

today_val + days(-30)
#> [1] "2024-06-15"
```

Both forms produce the same result. Negative values inside `days()` shift backwards, which is useful when the offset comes from a column or variable that can carry either sign.

### 3. Vector of period lengths

```r title="Build a vector of periods"
shifts <- days(c(0, 1, 7, 30, 90))
ymd("2024-01-01") + shifts
#> [1] "2024-01-01" "2024-01-02" "2024-01-08" "2024-01-31" "2024-03-31"
```

`days()` is fully vectorised. Adding a 5-element period vector to a single date returns 5 shifted dates, one per offset. This is the shortest path to "1-day, 1-week, 1-month, 1-quarter ahead" buckets from a single anchor date.

### 4. Inside a dplyr pipeline

```r title="Add a due-date column"
library(dplyr)

orders <- tibble(
  order_id = 1:4,
  order_date = ymd(c("2024-01-15", "2024-02-29", "2024-06-30", "2024-12-25"))
)

orders %>%
  mutate(due_date = order_date + days(30))
#> # A tibble: 4 x 3
#>   order_id order_date due_date  
#>      <int> <date>     <date>    
#> 1        1 2024-01-15 2024-02-14
#> 2        2 2024-02-29 2024-03-30
#> 3        3 2024-06-30 2024-07-30
#> 4        4 2024-12-25 2025-01-24
```

A 30-day due date column is the most common business use of `days()`. The expression `order_date + days(30)` is vectorised, type-stable, and survives leap years and year boundaries correctly. The same pattern fits net-15, net-60, or any custom payment window.

### 5. Generate a date sequence

```r title="Seven consecutive days from an anchor"
start <- ymd("2024-07-01")
start + days(0:6)
#> [1] "2024-07-01" "2024-07-02" "2024-07-03" "2024-07-04"
#> [5] "2024-07-05" "2024-07-06" "2024-07-07"
```

`days(0:6)` produces a Period vector of length 7. Adding it to a single date returns the seven-day window starting at the anchor. For ggplot2 axes or feature engineering, this is one line shorter than `seq.Date(start, by = "day", length.out = 7)`.

### 6. Subtract one day to find month-end

```r title="Last day of any month"
ceiling_date(ymd("2024-02-15"), "month") - days(1)
#> [1] "2024-02-29"

ceiling_date(ymd("2024-04-15"), "month") - days(1)
#> [1] "2024-04-30"
```

`ceiling_date(x, "month")` returns the first day of the next month. Subtracting `days(1)` lands on the last day of the current month. This pattern beats hard-coding 31 because it handles February in leap and non-leap years, plus 30-day months, with one expression.

[KEY INSIGHT]
**Periods are calendar-aware; Durations are not. Pick the one that matches your domain.** A Period of 1 day stays a calendar day, even if daylight saving makes that day 23 or 25 hours. A Duration of 1 day is always exactly 86,400 seconds. For business rules (rents, billing, due dates), use Periods. For physics-style elapsed time, use Durations.

## days() vs ddays() vs base date arithmetic

**Three ways to shift a date by "one day" exist in R, and they answer different questions.**

| Approach | Class returned | DST behaviour | Best for |
|---|---|---|---|
| `x + days(1)` | Period | Keeps clock time | Calendar-day business logic |
| `x + ddays(1)` | Duration | Adds exactly 86,400 s | Elapsed time, physics |
| `x + 1` (base, on Date) | Date | No time, no DST | Plain dates only |

The DST contrast is the real test. Here is what happens on the spring-forward transition in the US Eastern zone:

```r title="Period vs Duration across DST"
t1 <- ymd_hms("2024-03-09 22:00:00", tz = "America/New_York")

t1 + days(1)
#> [1] "2024-03-10 22:00:00 EDT"

t1 + ddays(1)
#> [1] "2024-03-10 23:00:00 EDT"
```

Daylight saving began at 02:00 on 2024-03-10 in the Eastern zone. `days(1)` preserves the 22:00 clock reading, so elapsed real time is 23 hours. `ddays(1)` adds exactly 24 hours, landing at 23:00. Pick the one that matches what a business user means by "the next day".

For plain Date values, the choice does not matter: `x + 1`, `x + days(1)`, and `x + ddays(1)` all return the next calendar date.

## Common pitfalls

**Pitfall 1: confusing `days()` with `day()`.** `days(7)` builds a Period for date arithmetic. `day(x)` extracts the day-of-month integer from a date. The names differ by one letter and the results have entirely different classes. Read the function name carefully when writing pipelines.

**Pitfall 2: adding `days()` to a character string.** `"2024-01-01" + days(7)` errors with a non-numeric argument message. Parse the string first: `ymd("2024-01-01") + days(7)` returns a Date. The same rule applies to slash-separated or US-format strings; use `mdy()` or `dmy()` to parse before adding.

[WARNING]
**`months(1)` and `years(1)` can return `NA` on month-end dates.** `ymd("2024-01-31") + months(1)` returns `NA` because February 31 does not exist. `days(1)` never has this problem because the calendar always has a next day. If you reach for the month or year Period constructors after `days()`, switch to `%m+%` or `add_with_rollback()` for safe rollover.

[NOTE]
**Coming from Python pandas?** The equivalent of `x + days(7)` is `x + pd.Timedelta(days=7)` for clock-aware shifts on a Timestamp, or `x + pd.offsets.Day(7)` for the calendar-aware version. Pandas does not separate Period and Duration as cleanly as lubridate; the `DateOffset` family is the closest analogue to lubridate's Period constructors.

## A practical workflow with days()

**Calendar-day shifts show up in three places: due-date columns, sliding windows for time-series joins, and last-N-days filters for recent activity.**

1. **Due-date columns**: `mutate(due = order_date + days(30))` produces net-30 windows that survive leap years.
2. **Sliding windows**: `filter(event_date >= today() - days(7))` keeps the last seven days of events.
3. **Backfill ranges**: `seq(today() - days(89), today(), by = "day")` builds a 90-day anchor sequence.

```r title="A 30-day rolling activity flag"
events <- tibble(
  user_id = c(1, 1, 2, 3),
  event_time = ymd(c("2024-06-01", "2024-07-10",
                     "2024-07-12", "2024-04-20"))
)

cutoff <- ymd("2024-07-15") - days(30)

events %>%
  mutate(is_recent = event_time >= cutoff)
#> # A tibble: 4 x 3
#>   user_id event_time is_recent
#>     <dbl> <date>     <lgl>    
#> 1       1 2024-06-01 FALSE    
#> 2       1 2024-07-10 TRUE     
#> 3       2 2024-07-12 TRUE     
#> 4       3 2024-04-20 FALSE
```

`cutoff` is a Date 30 calendar days before the anchor. The `is_recent` flag handles "active in last 7 days", "renewals due in 14 days", and any other fixed-window business metric with the same template.

## Try it yourself

**Try it:** Take the `orders` tibble from pattern 4 and add a `reminder_date` column that is 25 days after `order_date`. Save the result to `ex_reminders`.

```r title="Your turn: add a 25-day reminder column"
# Try it: add reminder column
ex_reminders <- # your code here

ex_reminders
#> Expected: 4 rows with reminder_date 25 days after order_date
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_reminders <- orders %>%
  mutate(reminder_date = order_date + days(25))

ex_reminders
#> # A tibble: 4 x 3
#>   order_id order_date reminder_date
#>      <int> <date>     <date>       
#> 1        1 2024-01-15 2024-02-09   
#> 2        2 2024-02-29 2024-03-25   
#> 3        3 2024-06-30 2024-07-25   
#> 4        4 2024-12-25 2025-01-19
```

**Explanation:** `order_date + days(25)` returns a Date column shifted 25 calendar days forward. The expression is vectorised, survives the February leap day on row 2, and crosses the year boundary on row 4 without manual handling.

</details>

## Related lubridate functions

After mastering days(), look at:

- `ddays()`: same N-day shift, but as an exact-seconds Duration
- `weeks()`, `months()`, `years()`: build Periods for larger calendar units
- `hours()`, `minutes()`, `seconds()`: build Periods for time-of-day shifts
- `period()`, `duration()`: build mixed-unit Periods and Durations
- `interval()`, `%within%`: model a range from start to end, not an offset
- `floor_date()`, `ceiling_date()`, `rollback()`: snap a date to a calendar boundary
- `today()`, `now()`: anchor expressions like `today() - days(7)` for recency windows

For the official reference, see the [lubridate period documentation](https://lubridate.tidyverse.org/reference/period.html).

## FAQ

**How do I add days to a date in R?**

Use `lubridate::days()` and the `+` operator: `ymd("2024-01-01") + days(7)` returns `"2024-01-08"`. The function builds a Period object that respects calendar boundaries, so January 31 plus `days(1)` correctly returns February 1. The same pattern works on POSIXct datetimes, where `days()` preserves the clock time across day boundaries.

**What is the difference between days() and ddays() in lubridate?**

`days(1)` is a Period of one calendar day; `ddays(1)` is a Duration of exactly 86,400 seconds. They return identical results on a plain Date, but differ across DST on a POSIXct value. `days(1)` keeps the clock time the same the next day; `ddays(1)` adds exact 24 hours, which can land on a different clock time after a DST transition.

**How do I subtract days from a date in R?**

Use the `-` operator: `ymd("2024-07-15") - days(30)` returns `"2024-06-15"`. A negative value works too: `ymd("2024-07-15") + days(-30)` gives the same result. The negative form is useful when the offset comes from a column that can carry either sign.

**Can days() take a vector of values?**

Yes, days() is fully vectorised. `days(c(1, 7, 30))` returns a length-3 Period vector. Adding it to a single date returns three shifted dates; adding it to a same-length date vector pairs them up element by element. This is the shortest path to multi-window comparisons in a dplyr pipeline.

**Why does ymd("2024-01-31") + months(1) return NA but + days(31) works?**

`months(1)` refuses to invent a February 31, which does not exist. `days(31)` just adds 31 calendar days and lands somewhere valid. For safe month-end arithmetic, use `%m+% months(1)` or `add_with_rollback()`. For day-count shifts, `days()` is always safe.
