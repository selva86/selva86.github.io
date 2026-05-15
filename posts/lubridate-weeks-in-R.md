---
title: "lubridate weeks() in R: Add or Subtract Calendar Weeks"
slug: "lubridate-weeks-in-R"
description: "Use lubridate weeks() in R to add or subtract calendar-week periods from dates, build weekly cohorts, and contrast weeks() with dweeks() across DST boundaries."
keywords: "lubridate weeks, weeks function R, lubridate weeks examples, add weeks to date R, lubridate period weeks, weeks() lubridate, subtract weeks from date R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "weeks()|lubridate weeks|lubridate::weeks()|add weeks to date|week period"
auto_link_case_sensitive: true
target_keyword: "lubridate weeks"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate weeks() in R: Add or Subtract Calendar Weeks

<p class="lead">The <code>weeks()</code> function in lubridate builds a Period object representing N seven-day calendar weeks. Add it to a Date or POSIXct to shift forward by full weeks, subtract to shift backward, and rely on calendar-aware behaviour across daylight saving boundaries.</p>

[QUICK ANSWER]
weeks(2)                                 # a 2-week period object
ymd("2024-01-01") + weeks(4)             # shift a date forward
today() - weeks(1)                       # one week ago
weeks(c(1, 2, 4, 12))                    # vector of period lengths
ymd("2024-01-15") + weeks(-2)            # negative shift, same as subtract
dates + weeks(1)                         # vectorised over a date column
df %>% mutate(renewal = signup + weeks(52))  # 52-week renewal column
ymd_hms("2024-03-09 22:00", tz = "US/Eastern") + weeks(1)  # DST-safe

[DECISION TREE: Is weeks() the right tool?]
- shift a date by N calendar weeks: x + weeks(N)
- shift by exact 604,800-second units (ignore DST): x + dweeks(N)
- shift by calendar days, months, years: x + days(N), months(N), years(N)
- compute the gap between two dates in weeks: difftime(b, a, units = "weeks")
- find the week number within a year: week(x) or isoweek(x)
- snap a date to the start of its week: floor_date(x, "week")
- build a weekly sequence between two dates: seq(start, end, by = "week")
- model a range from start to end: interval(a, b)

## What weeks() does in one sentence

**`weeks()` constructs a calendar-aware Period of N weeks (seven days each) that you can add to or subtract from a date.** Pass an integer or numeric vector and lubridate returns a Period that respects the calendar when added to Date or POSIXct values, keeping the clock time fixed across daylight saving transitions.

## Syntax

**`weeks(x = 1)` accepts a numeric vector and returns a Period of the same length.** Default `x` is 1, so `weeks()` by itself is a one-week period.

```r title="Load lubridate and build a week period"
library(lubridate)

weeks(2)
#> [1] "14d 0H 0M 0S"

class(weeks(2))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

weeks(c(1, 2, 4, 12))
#> [1] "7d 0H 0M 0S"   "14d 0H 0M 0S"  "28d 0H 0M 0S"
#> [4] "84d 0H 0M 0S"
```

The print method shows weeks as days (one week = seven days), confirming a Period rather than a Duration. Both classes add to dates, but Periods track calendar units while Durations track exact seconds.

[TIP]
**Reach for `weeks()` when you want "same time, N weeks later" semantics.** A Period of one week is always seven calendar days, even when daylight saving steals or adds an hour mid-week. If you need an exact 604,800-second shift instead, use `dweeks()`.

## Six common patterns

### 1. Add N weeks to a date

```r title="Shift a date forward"
ymd("2024-01-01") + weeks(4)
#> [1] "2024-01-29"

ymd("2024-12-25") + weeks(1)
#> [1] "2025-01-01"
```

The result is a Date that respects year boundaries. Christmas plus one week rolls cleanly into the new year; no manual leap-year or month-length logic needed.

### 2. Subtract N weeks from a date

```r title="Shift a date backward"
anchor <- ymd("2024-07-15")
anchor - weeks(2)
#> [1] "2024-07-01"

anchor + weeks(-2)
#> [1] "2024-07-01"
```

Both forms produce the same result. Negative values inside `weeks()` shift backwards, which is useful when the offset comes from a column or variable that can carry either sign.

### 3. Vector of week-period lengths

```r title="Build a vector of periods"
horizons <- weeks(c(1, 2, 4, 13, 52))
ymd("2024-01-01") + horizons
#> [1] "2024-01-08" "2024-01-15" "2024-01-29" "2024-04-01"
#> [5] "2024-12-30"
```

`weeks()` is fully vectorised. Adding a 5-element period vector to a single date returns 5 shifted dates, one per offset. This is the shortest path to "1-week, 2-week, 1-month, 1-quarter, 1-year ahead" buckets from a single anchor date.

### 4. Inside a dplyr pipeline

```r title="Add a subscription-renewal column"
library(dplyr)

subs <- tibble(
  user_id = 1:4,
  signup_date = ymd(c("2024-01-15", "2024-02-29", "2024-06-30", "2024-12-25"))
)

subs %>%
  mutate(renewal_date = signup_date + weeks(52))
#> # A tibble: 4 x 3
#>   user_id signup_date renewal_date
#>     <int> <date>      <date>      
#> 1       1 2024-01-15  2025-01-13  
#> 2       2 2024-02-29  2025-02-27  
#> 3       3 2024-06-30  2025-06-29  
#> 4       4 2024-12-25  2025-12-24
```

A 52-week annual renewal column is one of the most common business uses of `weeks()`. The expression `signup_date + weeks(52)` is vectorised, type-stable, and survives leap years correctly. The same template fits 13-week quarters, 4-week sprints, or any custom multi-week window.

### 5. Generate a weekly date sequence

```r title="Six consecutive Mondays from an anchor"
start <- ymd("2024-07-01")
start + weeks(0:5)
#> [1] "2024-07-01" "2024-07-08" "2024-07-15" "2024-07-22"
#> [5] "2024-07-29" "2024-08-05"
```

`weeks(0:5)` produces a Period vector of length 6. Adding it to a single date returns the six-week window starting at the anchor. For weekly reporting cadences or sprint schedules, this is shorter than `seq.Date(start, by = "week", length.out = 6)`.

### 6. Build weekly cohort buckets

```r title="Cohort week from signup date"
events <- tibble(
  user_id = c(1, 2, 3, 4, 5),
  signup = ymd(c("2024-07-01", "2024-07-03",
                 "2024-07-09", "2024-07-15",
                 "2024-07-22"))
)

events %>%
  mutate(
    cohort_start = floor_date(signup, "week", week_start = 1),
    week_4_end   = cohort_start + weeks(4)
  )
#> # A tibble: 5 x 4
#>   user_id signup     cohort_start week_4_end
#>     <int> <date>     <date>       <date>    
#> 1       1 2024-07-01 2024-07-01   2024-07-29
#> 2       2 2024-07-03 2024-07-01   2024-07-29
#> 3       3 2024-07-09 2024-07-08   2024-08-05
#> 4       4 2024-07-15 2024-07-15   2024-08-12
#> 5       5 2024-07-22 2024-07-22   2024-08-19
```

`floor_date(signup, "week", week_start = 1)` snaps each user to the Monday of their signup week, and `+ weeks(4)` defines the four-week retention window. This template powers weekly active user cohorts.

[KEY INSIGHT]
**Periods are calendar-aware; Durations are not. Pick the one that matches your domain.** A Period of 1 week stays seven calendar days, even if a daylight saving transition makes one of those days 23 or 25 hours. A Duration of 1 week is always exactly 604,800 seconds. For business rules (sprints, billing weeks, retention windows), use Periods. For physics-style elapsed time, use Durations.

## weeks() vs dweeks() vs base date arithmetic

**Three ways to shift a date by "one week" exist in R, and they answer different questions.**

| Approach | Class returned | DST behaviour | Best for |
|---|---|---|---|
| `x + weeks(1)` | Period | Keeps clock time | Calendar-week business logic |
| `x + dweeks(1)` | Duration | Adds exactly 604,800 s | Elapsed time, physics |
| `x + 7` (base, on Date) | Date | No time, no DST | Plain dates only |

The DST contrast is the real test. Here is what happens when the one-week shift crosses the spring-forward transition in the US Eastern zone:

```r title="Period vs Duration across DST"
t1 <- ymd_hms("2024-03-08 22:00:00", tz = "America/New_York")

t1 + weeks(1)
#> [1] "2024-03-15 22:00:00 EDT"

t1 + dweeks(1)
#> [1] "2024-03-15 23:00:00 EDT"
```

Daylight saving began at 02:00 on 2024-03-10 in the Eastern zone. `weeks(1)` preserves the 22:00 clock reading seven days later, so elapsed real time is 167 hours. `dweeks(1)` adds exactly 168 hours, landing at 23:00. Pick the one that matches what a business user means by "the same time next week".

For plain Date values, the choice does not matter: `x + 7`, `x + weeks(1)`, and `x + dweeks(1)` all return the next-week calendar date.

## Common pitfalls

**Pitfall 1: confusing `weeks()` with `week()`.** `weeks(2)` builds a Period for date arithmetic. `week(x)` extracts the week-of-year integer (1 to 53) from a date. The names differ by one letter and the results have entirely different classes. Read the function name carefully when writing pipelines.

**Pitfall 2: adding `weeks()` to a character string.** `"2024-01-01" + weeks(1)` errors with a non-numeric argument message. Parse the string first: `ymd("2024-01-01") + weeks(1)` returns a Date. The same rule applies to slash-separated or US-format strings; use `mdy()` or `dmy()` to parse before adding.

[WARNING]
**`weeks()` does not align to a particular weekday.** Adding `weeks(1)` to a Tuesday returns the next Tuesday, not the next Monday. If you need to snap to a fixed weekday (Monday-start reporting weeks, payroll Fridays), combine `floor_date(x, "week", week_start = 1)` with `+ weeks(N)` instead of using `weeks()` alone.

[NOTE]
**Coming from Python pandas?** The equivalent of `x + weeks(1)` is `x + pd.Timedelta(weeks=1)` for clock-aware shifts on a Timestamp, or `x + pd.offsets.Week(1)` for the calendar-aware version. Pandas does not separate Period and Duration as cleanly as lubridate; the `DateOffset` family is the closest analogue to lubridate's Period constructors.

## A practical workflow with weeks()

**Calendar-week shifts show up in three places: retention cohorts, sprint and pay-period scheduling, and recent-activity filters with a weekly cadence.**

1. **Retention cohorts**: `mutate(week_4 = cohort_start + weeks(4))` defines fixed retention windows.
2. **Sprint planning**: `seq(sprint_start, by = "2 weeks", length.out = 6)` schedules six two-week iterations.
3. **Weekly trailing filter**: `filter(event_date >= today() - weeks(8))` keeps the last eight weeks of events.

```r title="A trailing 8-week active flag"
events <- tibble(
  user_id = c(1, 1, 2, 3),
  event_time = ymd(c("2024-05-01", "2024-07-10",
                     "2024-07-12", "2024-03-20"))
)

cutoff <- ymd("2024-07-15") - weeks(8)

events %>%
  mutate(is_recent = event_time >= cutoff)
#> # A tibble: 4 x 3
#>   user_id event_time is_recent
#>     <dbl> <date>     <lgl>    
#> 1       1 2024-05-01 FALSE    
#> 2       1 2024-07-10 TRUE     
#> 3       2 2024-07-12 TRUE     
#> 4       3 2024-03-20 FALSE
```

`cutoff` is a Date eight weeks before the anchor. The `is_recent` flag captures "active in the last eight weeks" or any other fixed-window weekly metric.

## Try it yourself

**Try it:** Take the `subs` tibble from pattern 4 and add a `trial_end_date` column that is 2 weeks after `signup_date`. Save the result to `ex_trials`.

```r title="Your turn: add a 2-week trial-end column"
# Try it: add trial-end column
ex_trials <- # your code here

ex_trials
#> Expected: 4 rows with trial_end_date 14 days after signup_date
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_trials <- subs %>%
  mutate(trial_end_date = signup_date + weeks(2))

ex_trials
#> # A tibble: 4 x 3
#>   user_id signup_date trial_end_date
#>     <int> <date>      <date>        
#> 1       1 2024-01-15  2024-01-29    
#> 2       2 2024-02-29  2024-03-14    
#> 3       3 2024-06-30  2024-07-14    
#> 4       4 2024-12-25  2025-01-08
```

**Explanation:** `signup_date + weeks(2)` returns a Date column shifted 14 calendar days forward. The expression is vectorised, survives the February leap day on row 2, and crosses the year boundary on row 4 without manual handling.

</details>

## Related lubridate functions

After mastering weeks(), look at:

- `dweeks()`: same N-week shift, but as an exact-seconds Duration
- `days()`, `months()`, `years()`: build Periods for other calendar units
- `hours()`, `minutes()`, `seconds()`: build Periods for time-of-day shifts
- `period()`, `duration()`: build mixed-unit Periods and Durations
- `interval()`, `%within%`: model a range from start to end, not an offset
- `floor_date()`, `ceiling_date()`: snap a date to the start or end of a week
- `week()`, `isoweek()`: extract the week-of-year integer for grouping
- `today()`, `now()`: anchor expressions like `today() - weeks(8)` for recency windows

For the official reference, see the [lubridate period documentation](https://lubridate.tidyverse.org/reference/period.html).

## FAQ

**How do I add weeks to a date in R?**

Use `lubridate::weeks()` with the `+` operator: `ymd("2024-01-01") + weeks(4)` returns `"2024-01-29"`. The function builds a Period that respects calendar boundaries, so adding `weeks(1)` to December 25 returns January 1. On POSIXct datetimes, `weeks()` also preserves clock time across DST boundaries.

**What is the difference between weeks() and dweeks() in lubridate?**

`weeks(1)` is a Period of seven calendar days; `dweeks(1)` is a Duration of exactly 604,800 seconds. They return identical results on a plain Date, but differ across DST on a POSIXct value. `weeks(1)` keeps the clock time the same seven days later; `dweeks(1)` adds exactly 168 hours, which can land on a different clock time after a DST transition mid-week.

**How do I subtract weeks from a date in R?**

Use the `-` operator: `ymd("2024-07-15") - weeks(2)` returns `"2024-07-01"`. A negative value works too: `ymd("2024-07-15") + weeks(-2)` gives the same result. The negative form is useful when the offset comes from a column that can carry either sign, such as a "weeks_before_or_after_anchor" column.

**Can weeks() take a vector of values?**

Yes, `weeks()` is fully vectorised. `weeks(c(1, 2, 4, 12))` returns a length-4 Period vector. Adding it to a single date returns four shifted dates; against a same-length date vector it pairs element by element. This is the shortest path to multi-horizon retention windows or staggered renewals in a dplyr pipeline.

**How do I snap a date to a Monday before adding weeks?**

Combine `floor_date()` with `weeks()`: `floor_date(x, "week", week_start = 1) + weeks(N)` snaps to the Monday of the week containing x, then shifts forward N weeks. This pattern yields aligned reporting weeks and retention cohorts that always begin on the same weekday.
