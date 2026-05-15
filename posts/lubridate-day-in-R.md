---
title: "lubridate day() in R: Extract Day of Month from Dates"
slug: "lubridate-day-in-R"
description: "Use lubridate day() to extract the day of month from a Date or POSIXct vector in R, replace day in place, and contrast day() with mday(), wday(), and yday()."
keywords: "lubridate day, day function R, lubridate day examples, day of month R, extract day from date R, day() lubridate, lubridate day of month"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "day()|lubridate day|lubridate::day()|day of month|day component"
auto_link_case_sensitive: true
target_keyword: "lubridate day"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate day() in R: Extract Day of Month from Dates

<p class="lead">The <code>day()</code> function in lubridate returns the day of the month from a Date or POSIXct value as an integer between 1 and 31. It is an alias of <code>mday()</code>, vectorised over date columns, and supports in-place replacement.</p>

[QUICK ANSWER]
day(ymd("2024-07-15"))                     # extract day of month
day(now())                                 # day of current datetime
day(as.Date("2024-07-15"))                 # works on base Date too
day(c(ymd("2024-01-31"), ymd("2024-06-15")))  # vectorised
day(x) <- 1                                # replace day in place
df %>% mutate(d = day(order_date))         # extract a column
wday(ymd("2024-07-15"))                    # day of week instead
yday(ymd("2024-07-15"))                    # day of year (1 to 366)

[DECISION TREE: Is day() the right tool?]
- pull the day of month from a Date: day(x)
- pull the weekday number or name: wday(x, label = TRUE)
- pull the day of year (1 to 366): yday(x)
- pull the day of quarter (1 to 92): qday(x)
- pull the year or month part: year(x), month(x)
- snap a date to start of month: floor_date(x, "month")
- compute days between two dates: as.numeric(b - a, units = "days")
- build a date from year, month, day: make_date(y, m, d)

## What day() does in one sentence

**`day()` returns the day-of-month component of a date-time as an integer.** Pass any Date, POSIXct, or POSIXlt vector and you get a numeric vector of the same length with values 1 through 31.

This is the lubridate counterpart to base R's `format(x, "%d")` and `as.POSIXlt(x)$mday`. The lubridate version is shorter, vectorised, and returns an integer you can use directly in arithmetic or comparisons.

## Syntax

**`day(x, label = FALSE, abbr = TRUE)` accepts a date-time vector and two optional flags.** The return value is an integer vector of the same length. The `label` and `abbr` arguments are inherited from the generic for compatibility with `wday()` but have no effect for `day()`.

```r title="Load lubridate and pull a day"
library(lubridate)

day(ymd("2024-07-15"))
#> [1] 15

day(ymd_hms("2024-07-15 09:30:00"))
#> [1] 15

class(day(ymd("2024-07-15")))
#> [1] "integer"
```

The input must be a class lubridate recognises as a date or datetime: base `Date`, `POSIXct`, or `POSIXlt`. Character strings are NOT accepted. Parse them first with `ymd()`, `mdy()`, or `as.Date()`.

[TIP]
**Use `day(x) <- value` to overwrite the day in place.** This is the replacement form. It keeps the year, month, and time of day untouched, so you can snap an entire column of dates to the first of the month with one assignment.

## Six common patterns

### 1. Extract day of month from a single date

```r title="Day of a parsed date"
d <- ymd("2024-07-15")
day(d)
#> [1] 15
```

The result is integer 15, not the string `"15"`. Use it in arithmetic directly: `day(d) + 7` returns 22 for next week's day number.

### 2. Extract day from a vector of dates

```r title="Vectorised over a date column"
dates <- ymd(c("2024-01-31", "2024-02-29", "2024-06-15", "2024-12-25"))
day(dates)
#> [1] 31 29 15 25
```

`day()` is fully vectorised. A million-row date column becomes a million-row integer vector in one call. No loop or `sapply()` needed. The result respects month length, so February 29 in a leap year returns 29 cleanly.

### 3. Replace day values in place

```r title="Snap dates to the first of the month"
events <- ymd(c("2024-01-15", "2024-06-30", "2024-12-25"))
day(events) <- 1
events
#> [1] "2024-01-01" "2024-06-01" "2024-12-01"
```

The replacement form keeps year, month, and time untouched. This is the cleanest way to bucket a series of timestamps to the start of their month without a separate `floor_date()` call.

### 4. Use day() inside a dplyr pipeline

```r title="Add day of month as a column"
library(dplyr)

orders <- tibble(
  order_date = ymd(c("2024-01-05", "2024-01-15", "2024-01-25",
                     "2024-02-01", "2024-02-14")),
  amount = c(120, 80, 200, 150, 300)
)

orders %>%
  mutate(dom = day(order_date))
#> # A tibble: 5 x 3
#>   order_date amount   dom
#>   <date>      <dbl> <int>
#> 1 2024-01-05    120     5
#> 2 2024-01-15     80    15
#> 3 2024-01-25    200    25
#> 4 2024-02-01    150     1
#> 5 2024-02-14    300    14
```

`mutate(dom = day(order_date))` adds a day-of-month column. This is the start of any analysis that asks "do sales spike on payday?" or "are mid-month days different from month-end days?".

### 5. Filter rows by day of month

```r title="Keep only month-start records"
orders %>%
  filter(day(order_date) <= 5)
#> # A tibble: 2 x 2
#>   order_date amount
#>   <date>      <dbl>
#> 1 2024-01-05    120
#> 2 2024-02-01    150
```

`day(order_date) <= 5` evaluates row by row and keeps dates in the first five days of any month. Combine with `between()` for mid-month windows: `filter(between(day(order_date), 10, 20))`.

### 6. Build month-end and payday flags

```r title="Flag month-end and payday rows"
orders %>%
  mutate(
    dom = day(order_date),
    is_month_end = dom == days_in_month(order_date),
    is_payday = dom %in% c(1, 15)
  )
#> # A tibble: 5 x 5
#>   order_date amount   dom is_month_end is_payday
#>   <date>      <dbl> <int> <lgl>        <lgl>
#> 1 2024-01-05    120     5 FALSE        FALSE
#> 2 2024-01-15     80    15 FALSE        TRUE
#> 3 2024-01-25    200    25 FALSE        FALSE
#> 4 2024-02-01    150     1 FALSE        TRUE
#> 5 2024-02-14    300    14 FALSE        FALSE
```

`days_in_month()` returns the last valid day for each month (28, 29, 30, or 31), which beats hard-coding 31 and getting wrong answers for February. Pairing it with `day()` is the safe way to flag month-end rows.

[KEY INSIGHT]
**Day-of-month and day-of-week are different questions; `day()` only answers the first.** A common bug is reaching for `day()` when you wanted Monday/Tuesday/etc. For weekday use `wday(x, label = TRUE)`. For day-of-year use `yday()`. The four day-family extractors do not overlap, so picking the wrong one returns plausible but wrong numbers.

## day() vs mday() vs wday() vs yday() vs qday()

**Five extractors return a "day" number, each measuring a different calendar position.**

| Function | Returns | Range | Typical use |
|---|---|---|---|
| `day()` | Day of month | 1 to 31 | Default; same as mday() |
| `mday()` | Day of month | 1 to 31 | Alias of day(); explicit name |
| `wday()` | Day of week | 1 to 7 (or label) | Weekday analysis |
| `yday()` | Day of year | 1 to 366 | Seasonality, julian day |
| `qday()` | Day of quarter | 1 to 92 | Fiscal quarter cadence |

`day()` and `mday()` are exactly the same function under different names. Use `mday()` in code that reads alongside `wday()` and `yday()`, because the three-letter prefixes line up and the intent is obvious. Use `day()` when the context already makes the month-day meaning clear.

```r title="Five day extractors on the same date"
d <- ymd("2024-07-15")
day(d)
#> [1] 15
mday(d)
#> [1] 15
wday(d)
#> [1] 2
wday(d, label = TRUE)
#> [1] Mon
#> Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat
yday(d)
#> [1] 197
qday(d)
#> [1] 15
```

July 15, 2024 is the 15th day of the month, the second day of the ISO week (Monday), the 197th day of the year, and the 15th day of Q3 (which starts July 1). All five are correct answers to different questions.

## Common pitfalls

**Pitfall 1: passing a character string.** `day("2024-07-15")` errors because lubridate does not auto-parse strings inside `day()`. Wrap with `ymd()` first: `day(ymd("2024-07-15"))`. The same applies to slash-separated formats: parse, then extract.

**Pitfall 2: assigning day = 31 to a 30-day month.** `day(ymd("2024-04-15")) <- 31` returns `"2024-05-01"` because April has only 30 days. Lubridate rolls forward instead of erroring. If you want a fail-fast behavior, cap the value with `pmin(target_day, days_in_month(x))` before assigning.

[WARNING]
**Confusing `day()` with `wday()` is the most common bug.** `day(ymd("2024-07-15"))` returns `15` (day of month). `wday(ymd("2024-07-15"))` returns `2` (Monday as day-of-week). The two look interchangeable in code review but produce silently wrong group-by results. Always read the function name carefully.

[NOTE]
**Coming from Python pandas?** The equivalent of `day(x)` is `s.dt.day` on a datetime Series. The dplyr pipeline `mutate(dom = day(order_date))` mirrors `df.assign(dom=df.order_date.dt.day)`. Pandas calls weekday `s.dt.dayofweek`, which corresponds to lubridate's `wday()`.

## A practical workflow with day()

**Day-of-month shows up in three places: filtering to a window, building features for a model, and pairing with `days_in_month()` for safe month-end logic.**

The patterns:

1. **Filter to a within-month window**: `filter(day(date) <= 7)` keeps the first week; `filter(day(date) >= 25)` keeps the last week.
2. **Build features for a model**: extract `day()` alongside `month()`, `year()`, and `wday()` when daily seasonality matters.
3. **Safe month-end checks**: combine `day(x) == days_in_month(x)` rather than hard-coding `day(x) == 31`.

For ggplot2 time series, prefer `floor_date(x, "day")` over `day()` when you need a Date axis. `day()` returns an integer 1-31 that loses month and year context. `floor_date()` keeps the full Date class.

```r title="Day as a model feature"
orders %>%
  mutate(
    yr = year(order_date),
    mo = month(order_date),
    dom = day(order_date),
    weekday = wday(order_date, label = TRUE)
  )
#> # A tibble: 5 x 6
#>   order_date amount    yr    mo   dom weekday
#>   <date>      <dbl> <int> <dbl> <int> <ord>
#> 1 2024-01-05    120  2024     1     5 Fri
#> 2 2024-01-15     80  2024     1    15 Mon
#> 3 2024-01-25    200  2024     1    25 Thu
#> 4 2024-02-01    150  2024     2     1 Thu
#> 5 2024-02-14    300  2024     2    14 Wed
```

## Try it yourself

**Try it:** Use the `orders` tibble above and filter to rows where the day of month is between 10 and 20 inclusive. Save the result to `ex_mid_month`.

```r title="Your turn: keep mid-month rows"
# Try it: filter mid-month rows
ex_mid_month <- # your code here

ex_mid_month
#> Expected: 2 rows, days 15 and 14
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mid_month <- orders %>%
  filter(between(day(order_date), 10, 20))

ex_mid_month
#> # A tibble: 2 x 2
#>   order_date amount
#>   <date>      <dbl>
#> 1 2024-01-15     80
#> 2 2024-02-14    300
```

**Explanation:** `between(day(order_date), 10, 20)` is shorthand for `day(...) >= 10 & day(...) <= 20`. The result keeps January 15 and February 14, which fall inside the inclusive 10-to-20 window.

</details>

## Related lubridate functions

After mastering day(), look at:

- `mday()`, `wday()`, `yday()`, `qday()`: extract other day-position numbers
- `year()`, `month()`: extract the other date parts
- `hour()`, `minute()`, `second()`: extract time-of-day components
- `days_in_month()`: get the last valid day for any month
- `floor_date()`, `ceiling_date()`: round a date to day, week, month, or year
- `make_date()`, `make_datetime()`: build a date from year, month, day integers
- `ymd()`, `mdy()`, `dmy()`, `ymd_hms()`: parse strings into dates first

For the official reference, see the [lubridate day() documentation](https://lubridate.tidyverse.org/reference/day.html).

## FAQ

**How do I extract the day of the month from a date in R?**

Use `lubridate::day(x)` where `x` is a Date or POSIXct value. The result is an integer between 1 and 31. Base R alternatives are `format(x, "%d")`, which returns a string, or `as.POSIXlt(x)$mday`, which returns an integer. The lubridate version is the shortest, fully vectorised, and works directly inside dplyr pipelines.

**What is the difference between day() and mday() in lubridate?**

There is no functional difference. `mday()` is an alias of `day()`, and both return the day of the month. Use `mday()` when the surrounding code also uses `wday()` and `yday()`, because the three-letter prefixes line up visually. Use `day()` in standalone code where the meaning is already clear from context.

**How do I get the day of the week from a date in R?**

Reach for `wday()`, not `day()`. `wday(x)` returns an integer 1 to 7 with Sunday as 1 by default. Pass `label = TRUE` to get an ordered factor of weekday names like Mon, Tue, Wed. To start the week on Monday, set `week_start = 1`: `wday(x, label = TRUE, week_start = 1)`.

**Can I change the day of a date in R?**

Yes, with the replacement form: `day(x) <- 1`. This sets the day while keeping year, month, and time untouched. It is vectorised, so `day(date_vector) <- 1` snaps an entire column to the first of the month. Be careful with values above the month's length: `day(ymd("2024-04-15")) <- 31` rolls forward to May 1 because April has only 30 days.

**How do I get the day of the year (Julian day) in R?**

Use `yday()` from lubridate: `yday(ymd("2024-07-15"))` returns 197. The range is 1 to 365 in normal years and 1 to 366 in leap years. This is the standard "ordinal date" used in time-series and seasonality work. The base R equivalent is `as.POSIXlt(x)$yday + 1` (lubridate is one-indexed; POSIXlt is zero-indexed).
