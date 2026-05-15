---
title: "lubridate rollback() in R: Roll Dates to Previous Month-End"
slug: "lubridate-rollback-in-R"
description: "Use lubridate rollback() to roll a date back to the previous month-end or the first of the current month in R. Compare with rollforward() and floor_date()."
keywords: "lubridate rollback, rollback function R, lubridate rollback examples, rollback date R, roll_to_first lubridate, rollbackward R, lubridate rollforward"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "rollback()|lubridate rollback|lubridate::rollback()|rollbackward()|roll a date back"
auto_link_case_sensitive: true
target_keyword: "lubridate rollback"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate rollback() in R: Roll Dates to Previous Month-End

<p class="lead">The <code>rollback()</code> function in lubridate rolls a Date or POSIXct value back to the last day of the previous month, or to the first day of the current month when <code>roll_to_first = TRUE</code>. It is vectorised, preserves the time-of-day by default, and pairs with <code>rollforward()</code> for end-of-month snapping.</p>

[QUICK ANSWER]
rollback(ymd("2024-07-15"))                       # 2024-06-30 (prev month-end)
rollback(ymd("2024-07-15"), roll_to_first = TRUE) # 2024-07-01 (current month-start)
rollback(c(ymd("2024-07-15"), ymd("2024-08-03"))) # vectorised over a column
rollback(ymd_hms("2024-07-15 09:30:00"))          # 2024-06-30 09:30:00 (HMS kept)
rollback(ymd_hms("2024-07-15 09:30:00"), preserve_hms = FALSE)  # midnight
rollbackward(ymd("2024-07-15"))                   # alias of rollback()
rollforward(ymd("2024-07-15"))                    # 2024-07-31 (current month-end)
df %>% mutate(month_end = rollforward(order_date)) # snap a column to month-end

[DECISION TREE: Is rollback() the right tool?]
- snap a date to previous month-end: rollback(x)
- snap a date to current month-start: rollback(x, roll_to_first = TRUE)
- snap a date to current month-end: rollforward(x)
- snap a date to next month-start: rollforward(x, roll_to_first = TRUE)
- snap to start of any unit (week, year): floor_date(x, "week")
- snap to end of any unit (week, year): ceiling_date(x, "week") - 1
- subtract a calendar month exactly: x %m-% months(1)
- get last valid day of a month: days_in_month(x)

## What rollback() does in one sentence

**`rollback()` rolls a date to the last day of the previous month, or to the first of the current month with `roll_to_first = TRUE`.** Pass any Date, POSIXct, or POSIXlt vector and you get back the same class anchored to a month boundary, with the time-of-day intact.

The function pairs with `rollforward()` and the alias `rollbackward()`. It is the cleanest way to compute "the last close of the previous reporting period" without ad-hoc date arithmetic.

## Syntax

**`rollback(dates, roll_to_first = FALSE, preserve_hms = TRUE)` takes one required argument and two flags.** The return value is the same class as the input. The flags control which month boundary you land on and whether a POSIXct's hour, minute, and second survive the roll.

```r title="Load lubridate and run rollback"
library(lubridate)

rollback(ymd("2024-07-15"))
#> [1] "2024-06-30"

rollback(ymd("2024-07-15"), roll_to_first = TRUE)
#> [1] "2024-07-01"

class(rollback(ymd("2024-07-15")))
#> [1] "Date"
```

The input must be a recognised date class: `Date`, `POSIXct`, or `POSIXlt`. Character strings error; parse them with `ymd()`, `mdy()`, or `as.Date()` first. The output class matches the input.

[TIP]
**Use `roll_to_first = TRUE` instead of subtracting `day(x) - 1` from a Date.** The flag handles month length and leap years automatically. The manual subtraction works for most dates but rolls into the wrong month when the source day is 1, because `x - (1 - 1) = x` and you stay put instead of landing on the first.

## Six common patterns

### 1. Roll a single date back to previous month-end

```r title="Default rollback to previous month-end"
d <- ymd("2024-07-15")
rollback(d)
#> [1] "2024-06-30"
```

The default output is the last day of the month before the input. The function respects each month's actual length, so a March input rolls to February 28 in a normal year and February 29 in a leap year.

### 2. Roll to the first day of the current month

```r title="Roll to current month-start"
rollback(ymd("2024-07-15"), roll_to_first = TRUE)
#> [1] "2024-07-01"
```

With `roll_to_first = TRUE`, the function snaps to the first of the input's own month rather than crossing the boundary. For Date inputs this matches `floor_date(x, "month")`. The two differ on POSIXct: see Pattern 4.

### 3. Vectorise over a date column

```r title="Rollback applied to a vector"
dates <- ymd(c("2024-01-31", "2024-02-29", "2024-06-15", "2024-12-25"))
rollback(dates)
#> [1] "2023-12-31" "2024-01-31" "2024-05-31" "2024-11-30"
```

`rollback()` is fully vectorised. A million-row date column becomes a million-row Date vector in one call, with no loop or `sapply()` needed.

### 4. Keep or drop hours, minutes, and seconds

```r title="preserve_hms behavior on POSIXct"
ts <- ymd_hms("2024-07-15 09:30:45", tz = "UTC")

rollback(ts)
#> [1] "2024-06-30 09:30:45 UTC"

rollback(ts, preserve_hms = FALSE)
#> [1] "2024-06-30 UTC"
```

`preserve_hms = TRUE` (the default) keeps the time-of-day intact. Set the flag to `FALSE` to zero out the clock and land on midnight of the target day. The latter matters when bucketing event timestamps into calendar months and you want a stable boundary value.

### 5. Compute month-end inside a dplyr pipeline

```r title="Add a prev_month_end column"
library(dplyr)

orders <- tibble(
  order_date = ymd(c("2024-01-05", "2024-01-31", "2024-02-15",
                     "2024-03-01", "2024-12-25")),
  amount = c(120, 80, 200, 150, 300)
)

orders %>%
  mutate(prev_month_end = rollback(order_date))
#> # A tibble: 5 x 3
#>   order_date amount prev_month_end
#>   <date>      <dbl> <date>
#> 1 2024-01-05    120 2023-12-31
#> 2 2024-01-31     80 2023-12-31
#> 3 2024-02-15    200 2024-01-31
#> 4 2024-03-01    150 2024-02-29
#> 5 2024-12-25    300 2024-11-30
```

`mutate(prev_month_end = rollback(order_date))` adds a column with each row's previous month-end. Note row 4: March 1 rolls to February 29 because 2024 is a leap year. Hard-coded `last_date - days(28)` would land on the wrong day.

### 6. Build a month-bucket key

```r title="Roll forward to current month-end"
orders %>%
  mutate(
    period_start = rollback(order_date, roll_to_first = TRUE),
    period_end   = rollforward(order_date)
  )
#> # A tibble: 5 x 4
#>   order_date amount period_start period_end
#>   <date>      <dbl> <date>       <date>
#> 1 2024-01-05    120 2024-01-01   2024-01-31
#> 2 2024-01-31     80 2024-01-01   2024-01-31
#> 3 2024-02-15    200 2024-02-01   2024-02-29
#> 4 2024-03-01    150 2024-03-01   2024-03-31
#> 5 2024-12-25    300 2024-12-01   2024-12-31
```

Pairing `rollback(x, roll_to_first = TRUE)` with `rollforward(x)` gives every row its own calendar-month window, ready for a `group_by(period_start) %>% summarise()` step with no manual February-29 logic.

[KEY INSIGHT]
**`rollback()` and `rollforward()` operate on calendar months, not 30-day windows.** Subtracting `days(30)` from a March 31 date lands on March 1, not February 29. The roll family knows the real length of each month and adapts to leap years automatically, so reports stay correct in February without any conditional logic in your pipeline.

## rollback() vs rollforward() vs floor_date() vs %m-% months()

**Four lubridate idioms can land on a month boundary; each chooses a different one.**

| Idiom | What it returns for `ymd("2024-07-15")` | Best for |
|---|---|---|
| `rollback(x)` | 2024-06-30 | Last day of the previous month |
| `rollback(x, roll_to_first = TRUE)` | 2024-07-01 | First day of the current month |
| `rollforward(x)` | 2024-07-31 | Last day of the current month |
| `rollforward(x, roll_to_first = TRUE)` | 2024-08-01 | First day of the next month |
| `floor_date(x, "month")` | 2024-07-01 | Same as rollback with roll_to_first |
| `ceiling_date(x, "month")` | 2024-08-01 | Same as rollforward with roll_to_first |
| `x %m-% months(1)` | 2024-06-15 | Subtract one calendar month, keep day |

`floor_date()` and `ceiling_date()` are more general because they accept any unit (`"week"`, `"quarter"`, `"year"`). Use them when the unit varies. Reach for `rollback()` and `rollforward()` when you specifically want month-end semantics; the names read as intent in financial code.

```r title="Four ways to land on a month boundary"
d <- ymd("2024-07-15")

rollback(d)
#> [1] "2024-06-30"
rollforward(d)
#> [1] "2024-07-31"
floor_date(d, "month")
#> [1] "2024-07-01"
ceiling_date(d, "month") - days(1)
#> [1] "2024-07-31"
```

The `ceiling_date() - days(1)` idiom is a common substitute for `rollforward()`. Both produce the same answer for Date inputs, but `rollforward()` is one call.

## Common pitfalls

**Pitfall 1: passing a character string.** `rollback("2024-07-15")` errors because the input is not a recognised date class. Parse first: `rollback(ymd("2024-07-15"))`. The same parsing step applies to slash-separated and dotted formats.

**Pitfall 2: expecting rollback to subtract one month.** `rollback(ymd("2024-07-15"))` returns 2024-06-30, not 2024-06-15. The function snaps to a month boundary, it does not preserve the day-of-month. If you want to subtract a calendar month and keep the day, use `x %m-% months(1)`.

[WARNING]
**`rollback()` of a date already on the first of the month still goes to the previous month-end.** `rollback(ymd("2024-07-01"))` returns 2024-06-30, not 2024-07-01. The function never returns its input unchanged in default mode. If you want a no-op when the date is already on the first, gate the call with `if (day(x) > 1) rollback(x) else x` or use `floor_date(x, "month")` instead.

[NOTE]
**Coming from Python pandas?** The equivalent of `rollback(x)` is `x - pd.offsets.MonthEnd(1)` on a datetime Series. The dplyr pipeline `mutate(prev_month_end = rollback(order_date))` mirrors `df.assign(prev_month_end=df.order_date - pd.offsets.MonthEnd(1))`. Pandas separates `MonthEnd` and `MonthBegin` as distinct offset classes; lubridate uses one function with a flag.

## Try it yourself

**Try it:** Use the `orders` tibble above and add two columns: `month_start` (first day of each order's month) and `month_end` (last day of each order's month). Save the result to `ex_periods`.

```r title="Your turn: add month_start and month_end"
# Try it: build calendar-month windows
ex_periods <- # your code here

ex_periods
#> Expected: 5 rows with month_start and month_end columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_periods <- orders %>%
  mutate(
    month_start = rollback(order_date, roll_to_first = TRUE),
    month_end   = rollforward(order_date)
  )

ex_periods
#> # A tibble: 5 x 4
#>   order_date amount month_start month_end
#>   <date>      <dbl> <date>      <date>
#> 1 2024-01-05    120 2024-01-01  2024-01-31
#> 2 2024-01-31     80 2024-01-01  2024-01-31
#> 3 2024-02-15    200 2024-02-01  2024-02-29
#> 4 2024-03-01    150 2024-03-01  2024-03-31
#> 5 2024-12-25    300 2024-12-01  2024-12-31
```

**Explanation:** `rollback(x, roll_to_first = TRUE)` snaps each date to the first of its own month. `rollforward(x)` snaps to the last day of that same month. The pair gives every row a full calendar-month window keyed off the order date.

</details>

## Related lubridate functions

After mastering rollback(), look at:

- `rollforward()`, `rollbackward()`: forward roll and rollback alias
- `floor_date()`, `ceiling_date()`: snap to any unit (week, quarter, year)
- `days_in_month()`: return the last valid day of any month as an integer
- `%m-%`, `%m+%`: subtract or add calendar months with day preservation
- `month()`, `year()`: extract calendar parts as integers
- `make_date()`, `make_datetime()`: build a date from year, month, day pieces
- `ymd()`, `mdy()`, `dmy()`, `ymd_hms()`: parse strings into dates first

For the official reference, see the [lubridate rollback() documentation](https://lubridate.tidyverse.org/reference/rollbackward.html).

## FAQ

**What does rollback() do in lubridate?**

`rollback()` rolls a Date or POSIXct value back to the last day of the previous month. With `roll_to_first = TRUE`, it snaps to the first of the input's own month instead. The function is vectorised, preserves time-of-day by default, and returns the same class it received. Use it for period-end calculations and calendar-month bucket keys.

**What is the difference between rollback() and rollforward()?**

`rollback()` returns the last day of the previous month; `rollforward()` returns the last day of the current month. For July 15, 2024, rollback gives June 30 and rollforward gives July 31. Both accept `roll_to_first = TRUE`, returning the first of the current month and the first of the next month respectively. The pair covers all four month boundaries.

**Is rollback() the same as floor_date(x, "month")?**

Only when `roll_to_first = TRUE`. The default `rollback(x)` returns the previous month-end, while `floor_date(x, "month")` returns the first of the input's own month. For POSIXct input, `floor_date()` zeroes the time-of-day while `rollback()` preserves it by default.

**Does rollback() preserve hours, minutes, and seconds?**

Yes, when the input is POSIXct and `preserve_hms = TRUE` (the default). Set `preserve_hms = FALSE` to zero out the clock and land on midnight of the target day. For Date inputs the flag is moot because Date has no time component.

**How do I subtract one calendar month from a date in R?**

Use the `%m-%` operator: `ymd("2024-07-15") %m-% months(1)` returns 2024-06-15. This subtracts one full calendar month and keeps the day where possible. When the source day does not exist in the target month, `%m-%` snaps to the last valid day. `rollback()` is the wrong tool here because it always lands on a month boundary.
