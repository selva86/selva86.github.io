---
title: "lubridate months() in R: Add and Subtract Calendar Months"
slug: "lubridate-months-in-R"
description: "Use lubridate months() in R to add and subtract calendar months from dates. Covers syntax, %m+% rollover fix, and the base R months() collision pitfall."
keywords: "lubridate months, months function R, lubridate months examples, add months to date R, lubridate period months, months() lubridate, subtract months R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "months()|lubridate months|lubridate::months()|add months to date|month period"
auto_link_case_sensitive: true
target_keyword: "lubridate months"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate months() in R: Add and Subtract Calendar Months

<p class="lead">The <code>months()</code> function in lubridate builds a Period object representing N calendar months. Add it to a Date or POSIXct to shift forward, subtract to shift backward, and pair it with <code>%m+%</code> when the start date is a month-end value like January 31.</p>

[QUICK ANSWER]
months(3)                                 # a 3-month period object
ymd("2024-01-15") + months(3)             # shift a date forward
today() - months(1)                       # one month ago
months(c(1, 3, 6, 12))                    # vector of period lengths
ymd("2024-01-31") %m+% months(1)          # safe rollover (Jan 31 -> Feb 29)
ymd("2024-01-31") + months(1)             # NA (Feb 31 does not exist)
df %>% mutate(renewal = start_date %m+% months(12))  # 12-month renewal column
add_with_rollback(ymd("2024-01-31"), months(1))      # explicit roll behaviour

[DECISION TREE: Is months() the right tool?]
- shift a date by N calendar months: x %m+% months(N)
- shift by 30-day chunks instead of calendar months: x + days(30 * N)
- shift by exact-second durations: x + dmonths(N)
- handle month-end rollover safely: x %m+% months(N) or add_with_rollback()
- extract the month integer from a date: month(x)
- get the month name from a Date (base R): base::months(x)
- compute the gap in months between two dates: interval(a, b) %/% months(1)
- snap a date to the first or last day of its month: floor_date(x, "month"), ceiling_date(x, "month") - days(1)

## What months() does in one sentence

**`months()` constructs a calendar-aware Period of N months that you can add to or subtract from a date.** Pass an integer or numeric vector and lubridate returns a Period that respects month boundaries on Date or POSIXct values.

This differs from a fixed 30-day shift because calendar months are 28, 29, 30, or 31 days long. The trade-off is the month-end rollover problem, which `%m+%` solves cleanly.

## Syntax

**`months(x = 1, abbreviate = TRUE)` accepts a numeric vector and returns a Period of the same length.** Default `x` is 1, so `months()` by itself is a one-month period. The `abbreviate` argument controls the print method only; it does not affect arithmetic.

```r title="Load lubridate and build a period"
library(lubridate)

months(3)
#> [1] "3m 0d 0H 0M 0S"

class(months(3))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

months(c(1, 3, 6, 12))
#> [1] "1m 0d 0H 0M 0S"  "3m 0d 0H 0M 0S"
#> [3] "6m 0d 0H 0M 0S"  "12m 0d 0H 0M 0S"
```

The "m" prefix confirms a Period of months, not a Duration. Periods track calendar units; Durations track exact seconds. For monthly business rules, Periods are usually what you want.

[WARNING]
**`lubridate::months()` clashes with `base::months()` in the name space.** Base R's `months()` returns the month name from a date object, while lubridate's `months()` returns a Period. Whichever package loads last wins. After `library(lubridate)`, calling `months(1)` returns a Period; to get the base behaviour, qualify as `base::months(your_date)`.

## Six common patterns

### 1. Add N months to a date

```r title="Shift a date forward"
ymd("2024-01-15") + months(3)
#> [1] "2024-04-15"

ymd("2024-06-30") + months(6)
#> [1] "2024-12-30"
```

The result is a Date that respects month boundaries. January 15 plus three months returns April 15; June 30 plus six months returns December 30. No leap year or month length logic is needed because the calendar handles it.

### 2. Subtract N months from a date

```r title="Shift a date backward"
anchor <- ymd("2024-07-15")
anchor - months(6)
#> [1] "2024-01-15"

anchor + months(-6)
#> [1] "2024-01-15"
```

Both forms produce the same result. Negative values inside `months()` shift backwards, which helps when the offset comes from a column or variable that can carry either sign.

### 3. The month-end rollover problem and the %m+% fix

```r title="Plus operator vs the rollover operator"
ymd("2024-01-31") + months(1)
#> [1] NA

ymd("2024-01-31") %m+% months(1)
#> [1] "2024-02-29"

ymd("2024-01-31") %m+% months(13)
#> [1] "2025-02-28"
```

January 31 plus one month would land on a non-existent February 31, so `+` returns `NA`. The `%m+%` operator rolls back to the last valid day of the target month, which is February 29 in a leap year and February 28 otherwise. Use `%m+%` whenever the start date is a month-end value and you cannot guarantee the target month has 31 days.

### 4. Inside a dplyr pipeline

```r title="Add a renewal-date column"
library(dplyr)

subs <- tibble(
  sub_id = 1:4,
  start_date = ymd(c("2024-01-15", "2024-01-31", "2024-02-29", "2024-12-25"))
)

subs %>%
  mutate(renewal_date = start_date %m+% months(12))
#> # A tibble: 4 x 3
#>   sub_id start_date renewal_date
#>    <int> <date>     <date>      
#> 1      1 2024-01-15 2025-01-15  
#> 2      2 2024-01-31 2025-01-31  
#> 3      3 2024-02-29 2025-02-28  
#> 4      4 2024-12-25 2025-12-25
```

A 12-month renewal column is the most common use of `months()`. `%m+%` survives the leap day on row 3 by rolling 2025-02-29 back to 2025-02-28; plain `+ months(12)` would have returned `NA` there.

### 5. Generate a monthly sequence

```r title="Twelve consecutive months from an anchor"
start <- ymd("2024-01-15")
start %m+% months(0:11)
#>  [1] "2024-01-15" "2024-02-15" "2024-03-15" "2024-04-15"
#>  [5] "2024-05-15" "2024-06-15" "2024-07-15" "2024-08-15"
#>  [9] "2024-09-15" "2024-10-15" "2024-11-15" "2024-12-15"
```

`months(0:11)` builds a length-12 Period vector. Combined with `%m+%`, this is the one-line way to produce monthly snapshots from a single anchor. For ggplot2 facet variables or feature engineering, it is cleaner than `seq.Date(start, by = "month", length.out = 12)`.

### 6. Compute the gap in months between two dates

```r title="Tenure in whole months"
start <- ymd("2022-03-15")
end   <- ymd("2024-09-10")

interval(start, end) %/% months(1)
#> [1] 29
```

Integer division of an interval by `months(1)` returns the number of whole calendar months between the two dates. This handles tenure, age-in-months, and contract-length calculations without rounding ambiguity.

[KEY INSIGHT]
**The choice between `+ months()` and `%m+% months()` is the choice between failing loudly and rolling silently.** Plain `+` returns `NA` on impossible dates (January 31 plus one month), which fails fast and surfaces the issue. The `%m+%` operator rolls back to the last valid day, which keeps pipelines running but hides edge cases. Pick the one that matches how you want to learn about month-end inputs.

## months() vs %m+% months() vs base::months()

**Three calls that look almost identical do very different things in R.**

| Call | Returns | Behaviour on Jan 31 + 1 month |
|---|---|---|
| `x + months(1)` (lubridate Period) | Date or POSIXct | `NA` |
| `x %m+% months(1)` (lubridate operator) | Date or POSIXct | Last valid day of next month |
| `base::months(x)` | Character (month name) | n/a, returns name of input date |

The name collision is the single most confusing thing about `months()` in R. After `library(lubridate)`, the unqualified `months()` always refers to the lubridate Period constructor.

```r title="Name collision in action"
base::months(ymd("2024-03-15"))
#> [1] "March"

lubridate::months(3)
#> [1] "3m 0d 0H 0M 0S"

months(3)
#> [1] "3m 0d 0H 0M 0S"
```

Use the `base::` and `lubridate::` qualifiers in shared scripts to make intent explicit and avoid load-order bugs.

## Common pitfalls

**Pitfall 1: relying on `+ months(N)` for month-end dates.** `ymd("2024-01-31") + months(1)` returns `NA`. Switch to `%m+% months(N)` or `add_with_rollback()` whenever the start date might be the 29th, 30th, or 31st. Build that into the pipeline by default, not as a post-hoc fix.

**Pitfall 2: confusing `months()` with `month()`.** `months(3)` builds a Period for date arithmetic. `month(x)` extracts the month integer (or label) from a date. The names differ by one letter and the results have entirely different classes. Read the function name carefully before adding or chaining.

**Pitfall 3: treating one month as 30 days.** `months(1)` is a calendar month, not a 30-day chunk. For literal 30-day shifts use `days(30)`; mixing the two on long horizons drifts by several days per year.

[NOTE]
**Coming from Python pandas?** The equivalent of `x %m+% months(3)` is `x + pd.DateOffset(months=3)` on a Timestamp, which rolls month-end dates back to the last valid day in the target month. Pandas does not separate Period and Duration as cleanly as lubridate; the `DateOffset` family is the closest analogue to lubridate's Period constructors.

## A practical workflow with months()

**Calendar-month shifts show up in three places: renewal-date columns, cohort buckets for time-series joins, and trailing-window filters for monthly metrics.**

1. **Renewal columns**: `mutate(renewal = start_date %m+% months(12))` produces annual renewal dates that survive leap years.
2. **Cohort buckets**: `mutate(cohort = floor_date(signup_date, "month"))` collapses signups into the first-of-month for monthly cohorts.
3. **Trailing windows**: `filter(event_date >= today() %m+% months(-3))` keeps the trailing three months of activity.

```r title="A 6-month rolling activity flag"
events <- tibble(
  user_id = c(1, 1, 2, 3),
  event_time = ymd(c("2024-01-10", "2024-06-20",
                     "2024-07-05", "2023-12-30"))
)

cutoff <- ymd("2024-07-15") %m+% months(-6)

events %>%
  mutate(is_recent = event_time >= cutoff)
#> # A tibble: 4 x 3
#>   user_id event_time is_recent
#>     <dbl> <date>     <lgl>    
#> 1       1 2024-01-10 FALSE    
#> 2       1 2024-06-20 TRUE     
#> 3       2 2024-07-05 TRUE     
#> 4       3 2023-12-30 FALSE
```

`cutoff` is a Date six months before the anchor. The `is_recent` flag covers "active in last 3 months", "renewed in last year", and any other fixed-month-window metric.

## Try it yourself

**Try it:** Take the `subs` tibble from pattern 4 and add a `mid_cycle_check` column that is 6 calendar months after `start_date`. Save the result to `ex_mid_cycle`.

```r title="Your turn: add a 6-month check column"
# Try it: add 6-month check column
ex_mid_cycle <- # your code here

ex_mid_cycle
#> Expected: 4 rows with mid_cycle_check 6 months after start_date
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mid_cycle <- subs %>%
  mutate(mid_cycle_check = start_date %m+% months(6))

ex_mid_cycle
#> # A tibble: 4 x 3
#>   sub_id start_date mid_cycle_check
#>    <int> <date>     <date>         
#> 1      1 2024-01-15 2024-07-15     
#> 2      2 2024-01-31 2024-07-31     
#> 3      3 2024-02-29 2024-08-29     
#> 4      4 2024-12-25 2025-06-25
```

**Explanation:** `start_date %m+% months(6)` shifts each date forward six months and rolls back to the last valid day when the target month is shorter. Row 2 lands on 2024-07-31 cleanly; rollover only triggers when the target month has fewer days than the start day.

</details>

## Related lubridate functions

After mastering months(), look at:

- `days()`, `weeks()`, `years()`: build Periods for other calendar units
- `dmonths()`: same N-month shift, but as an exact-seconds Duration
- `%m+%`, `%m-%`, `add_with_rollback()`: month-end safe arithmetic
- `month()`: extract the month integer or label from a date
- `floor_date()`, `ceiling_date()`, `rollback()`: snap a date to a month boundary
- `interval()`, `%within%`: model a span from start to end, not an offset
- `today()`, `now()`: anchor expressions like `today() %m+% months(-1)` for trailing windows

For the official reference, see the [lubridate period documentation](https://lubridate.tidyverse.org/reference/period.html).

## FAQ

**How do I add months to a date in R?**

Use `lubridate::months()` with the `%m+%` operator: `ymd("2024-01-15") %m+% months(3)` returns `"2024-04-15"`. Plain `+ months(3)` works for most dates, but returns `NA` on month-end inputs like January 31 because February 31 does not exist. Defaulting to `%m+%` makes pipelines robust without changing the result on safe dates.

**Why does ymd("2024-01-31") + months(1) return NA in R?**

`months(1)` shifts the date forward one calendar month, which lands on February 31, a non-existent date. The plus operator returns `NA` rather than silently rolling to the last valid day. To roll back to February 29 (leap year) or February 28, use the `%m+%` operator: `ymd("2024-01-31") %m+% months(1)` returns `"2024-02-29"`.

**What is the difference between lubridate months() and base R months()?**

`lubridate::months()` builds a Period object for date arithmetic; `base::months(x)` returns the month name from a date as a character string. After `library(lubridate)`, the unqualified call `months(3)` is the lubridate version. To get the month name explicitly, qualify the call as `base::months(your_date)` to avoid the namespace collision.

**How do I subtract months from a date in R?**

Use the `%m-%` operator for safety: `ymd("2024-07-31") %m-% months(1)` returns `"2024-06-30"`. The minus operator (without `%m...%`) also works, but returns `NA` if the target month does not have a matching day. A negative argument works too: `ymd("2024-07-15") %m+% months(-3)` returns `"2024-04-15"`.

**Can months() take a vector of values?**

Yes, months() is fully vectorised. `months(c(1, 3, 6, 12))` returns a length-4 Period vector. Adding it to a single date returns four shifted dates; adding it to a same-length date vector pairs them element by element. Pair with `%m+%` instead of `+` to keep the output safe across month-end starts.
