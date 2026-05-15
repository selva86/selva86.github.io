---
title: "lubridate mday() in R: Day of Month Extractor for Dates"
slug: "lubridate-mday-in-R"
description: "Use lubridate mday() in R to pull the day of month from a Date or POSIXct vector, write replacement assignments, and pair it with wday(), yday(), and qday()."
keywords: "lubridate mday, mday function R, lubridate mday examples, mday vs day lubridate, day of month R, extract day from date R, mday() lubridate"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "mday()|lubridate mday|lubridate::mday()|day of month component|day-of-month extractor"
auto_link_case_sensitive: true
target_keyword: "lubridate mday"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate mday() in R: Day of Month Extractor for Dates

<p class="lead">The <code>mday()</code> function in lubridate returns the day of the month from a Date or POSIXct value as an integer between 1 and 31. It is the explicit-prefix counterpart to <code>day()</code>, designed to line up visually with <code>wday()</code>, <code>yday()</code>, and <code>qday()</code> in mixed extractor code.</p>

[QUICK ANSWER]
mday(ymd("2024-07-15"))                       # extract day of month
mday(ymd_hms("2024-07-15 09:30:00"))          # works on POSIXct too
mday(c(ymd("2024-01-31"), ymd("2024-06-15"))) # vectorised
mday(x) <- 1                                  # replace day in place
df |> mutate(dom = mday(invoice_date))        # extract a column
mday(x) == days_in_month(x)                   # safe month-end test
mday(x)                                       # same as day(x)
identical(mday(x), day(x))                    # TRUE for any date input

[DECISION TREE: Is mday() the right tool?]
- pull the day of month (1 to 31): mday(x)
- pull the day of week number or name: wday(x, label = TRUE)
- pull the day of year (1 to 366): yday(x)
- pull the day of quarter (1 to 92): qday(x)
- pull the hour, minute, or second: hour(x), minute(x), second(x)
- snap a date to the first of the month: floor_date(x, "month")
- count days between two dates: as.numeric(b - a, units = "days")
- build a date from year, month, day: make_date(y, m, d)

## What mday() does in one sentence

**`mday()` returns the day-of-month component of a date-time as an integer.** Pass any Date, POSIXct, or POSIXlt vector and you get a numeric vector of the same length with values 1 through 31.

The "m" prefix stands for "month". It is the lubridate counterpart to base R's `as.POSIXlt(x)$mday`, but returns an integer you can use directly in arithmetic and comparisons.

## Syntax

**`mday(x)` accepts a single argument: a date-time vector.** It returns an integer vector with values 1 to 31. Unlike `wday()`, there are no `label` or `week_start` arguments because day-of-month numbers are unambiguous.

```r title="Load lubridate and pull a day"
library(lubridate)

mday(ymd("2024-07-15"))
#> [1] 15

mday(ymd_hms("2024-07-15 09:30:00"))
#> [1] 15

class(mday(ymd("2024-07-15")))
#> [1] "integer"
```

The input must be a `Date`, `POSIXct`, or `POSIXlt` value. Character strings are NOT accepted; parse them first with `ymd()`, `mdy()`, or `as.Date()`.

[TIP]
**Reach for `mday()` when the same function reads `wday(date)` two lines later.** The three-letter prefixes line up visually so a code reviewer can scan the column of extractors and immediately see "month-day, weekday, year-day". Mixed `day()` plus `wday()` plus `yday()` reads as a typo even when the code is correct.

## Six common patterns

### 1. Extract day of month from a single date

```r title="Day of a parsed date"
d <- ymd("2024-07-15")
mday(d)
#> [1] 15
```

The result is integer 15, not the string `"15"`. Use it in arithmetic directly: `mday(d) + 7` returns 22.

### 2. Extract day from a vector of dates

```r title="Vectorised over a date column"
dates <- ymd(c("2024-01-31", "2024-02-29", "2024-06-15", "2024-12-25"))
mday(dates)
#> [1] 31 29 15 25
```

`mday()` is fully vectorised: a million-row date column becomes a million-row integer vector in one call. The result respects each month's length, so February 29 in a leap year returns 29 cleanly.

### 3. Pair mday() with wday(), yday(), and qday() in one pipeline

```r title="Build a date feature frame"
library(dplyr)

invoices <- tibble(
  invoice_date = ymd(c("2024-01-31", "2024-02-29", "2024-04-15",
                       "2024-07-04", "2024-12-25")),
  amount = c(420, 180, 95, 310, 540)
)

invoices |>
  mutate(
    dom    = mday(invoice_date),
    dow    = wday(invoice_date, label = TRUE),
    doy    = yday(invoice_date),
    doq    = qday(invoice_date)
  )
#> # A tibble: 5 x 5
#>   invoice_date amount   dom dow     doy   doq
#>   <date>        <dbl> <int> <ord> <int> <int>
#> 1 2024-01-31      420    31 Wed      31    31
#> 2 2024-02-29      180    29 Thu      60    60
#> 3 2024-04-15       95    15 Mon     106    15
#> 4 2024-07-04      310     4 Thu     186     4
#> 5 2024-12-25      540    25 Wed     360    86
```

This is the feature-engineering use case: four day-position numbers from one date column. `mday()` reads cleanly alongside `wday()`, `yday()`, and `qday()` because all four share a one-letter calendar prefix.

### 4. Replace mday values in place

```r title="Snap dates to the first of the month"
events <- ymd(c("2024-01-15", "2024-06-30", "2024-12-25"))
mday(events) <- 1
events
#> [1] "2024-01-01" "2024-06-01" "2024-12-01"
```

The replacement form keeps year, month, and time-of-day untouched. This buckets timestamps to the start of their month without a `floor_date(x, "month")` call.

### 5. Filter rows by day of month

```r title="Keep month-end invoices only"
invoices |>
  filter(mday(invoice_date) >= 25)
#> # A tibble: 3 x 2
#>   invoice_date amount
#>   <date>        <dbl>
#> 1 2024-01-31      420
#> 2 2024-02-29      180
#> 3 2024-12-25      540
```

`mday(invoice_date) >= 25` keeps dates in the last week of any month, regardless of month length. Combine with `between()` for windows: `filter(between(mday(invoice_date), 10, 20))` keeps mid-month rows.

### 6. Safe month-end test with days_in_month()

```r title="Flag true month-end rows"
invoices |>
  mutate(
    dom = mday(invoice_date),
    last_day = days_in_month(invoice_date),
    is_month_end = dom == last_day
  )
#> # A tibble: 5 x 5
#>   invoice_date amount   dom last_day is_month_end
#>   <date>        <dbl> <int>    <int> <lgl>
#> 1 2024-01-31      420    31       31 TRUE
#> 2 2024-02-29      180    29       29 TRUE
#> 3 2024-04-15       95    15       30 FALSE
#> 4 2024-07-04      310     4       31 FALSE
#> 5 2024-12-25      540    25       31 FALSE
```

`days_in_month()` returns the last valid day for each month (28, 29, 30, or 31) and respects leap years. `mday(x) == days_in_month(x)` is the only correct month-end flag; hard-coding `mday(x) == 31` silently drops every February, every 30-day month, and breaks on leap years.

[KEY INSIGHT]
**The day-prefix family answers four different questions; pick the wrong one and you get a plausible but silently wrong column.** `mday()` returns the position within the month, `wday()` the position within the week, `yday()` the position within the year, `qday()` the position within the calendar quarter. The four extractors return integers in overlapping ranges, so a group-by on the wrong column compiles, runs, and produces meaningless numbers.

## mday() vs day(): when to write which

**`mday()` and `day()` are exact aliases; both return the day-of-month integer.** The choice is a readability concern, not a behavioural one.

| Style | Example | Reads best when |
|---|---|---|
| `mday(x)` | `mutate(dom = mday(date))` | The next line also calls `wday()`, `yday()`, or `qday()` |
| `day(x)` | `mutate(dom = day(date))` | Standalone day-of-month extraction, no other day-family calls nearby |
| `day(x) <- 1` | replacement form | Visually highlights the assignment |

Verify the equivalence in one line:

```r title="Confirm mday() and day() are aliases"
d <- ymd(c("2024-01-15", "2024-06-30", "2024-12-25"))

identical(mday(d), day(d))
#> [1] TRUE

identical(mday(d), as.integer(format(d, "%d")))
#> [1] TRUE
```

Both lubridate functions agree with the base R `format(x, "%d")` string, cast to integer. There is no version, time zone, or class on which `mday()` and `day()` diverge.

## Common pitfalls

**Pitfall 1: passing a character string.** `mday("2024-07-15")` errors because lubridate does not auto-parse strings inside extractors. Wrap with `ymd()` first: `mday(ymd("2024-07-15"))`. The same applies to slash-separated and US-style strings; parse, then extract.

**Pitfall 2: assigning 31 to a 30-day month.** `mday(ymd("2024-04-15")) <- 31` returns `"2024-05-01"` because April has 30 days and lubridate rolls forward instead of erroring. Cap with `pmin(target_day, days_in_month(x))` for fail-fast behaviour.

**Pitfall 3: hard-coding 31 as "the last day".** `mday(x) == 31` drops every February row and every 30-day month-end. Pair with `days_in_month(x)` instead.

[WARNING]
**Reading `mday()` as "month and day" is the most common rookie mistake.** The prefix means "month-day", as in "the day position within the month". It does not return a `MM-DD` string; it returns a single integer 1 to 31. To get a `MM-DD` label, use `format(x, "%m-%d")` instead.

[NOTE]
**Coming from Python pandas?** The equivalent of `mday(x)` is `s.dt.day` on a datetime Series. The dplyr pipeline `mutate(dom = mday(invoice_date))` mirrors `df.assign(dom=df.invoice_date.dt.day)`. Pandas calls weekday `s.dt.dayofweek` (0 to 6 starting Monday), which corresponds to lubridate's `wday()` with `week_start = 1` minus one.

## A practical workflow with mday()

**Day-of-month shows up in three places: feature engineering, window filters, and safe end-of-month checks.**

The patterns:

1. **Feature engineering for models.** Pair `mday()` with `wday()`, `yday()`, and `qday()` so the four columns read as parallel calendar positions. Use the three-letter form for all four to keep the code grid-aligned.
2. **Within-month windows.** `filter(mday(date) <= 7)` keeps the first week of every month; `filter(mday(date) >= 25)` keeps the last week. Combine with `month(date)` if you need a specific month and the last week.
3. **Robust month-end logic.** `mday(x) == days_in_month(x)` is the only filter that respects February, 30-day months, and leap years. Use it instead of `mday(x) == 31`.

For charts, prefer `floor_date(x, "day")` over `mday()` when you need a real date axis. `mday()` collapses three years of January 15th into the integer 15, losing year and month context.

```r title="Aggregate sales by day of month"
set.seed(1)
sales <- tibble(
  sale_date = ymd("2024-01-01") + sample(0:365, 200, replace = TRUE),
  amount = round(runif(200, 50, 500), 2)
)

sales |>
  mutate(dom = mday(sale_date)) |>
  group_by(dom) |>
  summarise(daily_avg = round(mean(amount), 2), n = dplyr::n()) |>
  arrange(desc(daily_avg)) |>
  head(5)
#> # A tibble: 5 x 3
#>     dom daily_avg     n
#>   <int>     <dbl> <int>
#> 1     5      382.     5
#> 2    12      341.     7
#> 3    27      330.     8
#> 4    19      327.    11
#> 5     1      316.     9
```

Aggregating by `mday()` collapses a year of sales into 31 buckets, one per calendar day. The result answers "are payday days higher on average?" without committing to a specific month or year.

## Try it yourself

**Try it:** Use the `invoices` tibble above and keep only rows where the day of month is between 10 and 25 inclusive. Save the result to `ex_mid`.

```r title="Your turn: keep mid-month invoices"
# Try it: filter mid-month invoices
ex_mid <- # your code here

ex_mid
#> Expected: 2 rows, days 15 and 25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mid <- invoices |>
  filter(between(mday(invoice_date), 10, 25))

ex_mid
#> # A tibble: 2 x 2
#>   invoice_date amount
#>   <date>        <dbl>
#> 1 2024-04-15       95
#> 2 2024-12-25      540
```

**Explanation:** `between(mday(invoice_date), 10, 25)` is shorthand for `mday(...) >= 10 & mday(...) <= 25`. The result keeps April 15 and December 25, which fall inside the inclusive 10-to-25 window.

</details>

## Related lubridate functions

After mastering mday(), look at:

- `day()`: identical alias for day of month; use whichever reads best
- `wday()`, `yday()`, `qday()`: the rest of the day-prefix family
- `year()`, `month()`: extract the other calendar parts
- `hour()`, `minute()`, `second()`: extract time-of-day components
- `days_in_month()`: get the last valid day for any month
- `floor_date()`, `ceiling_date()`: round a date to day, week, month, or year
- `make_date()`, `make_datetime()`: build a date from year, month, day integers

For the official reference, see the [lubridate day() documentation](https://lubridate.tidyverse.org/reference/day.html), which covers `mday()` alongside the rest of the family.

## FAQ

**What does mday() return in R?**

`mday()` returns the day of the month as an integer between 1 and 31. Input is a Date, POSIXct, or POSIXlt vector; output is an integer vector of the same length. The function is fully vectorised, so it works on a single date or a million-row time-series without a loop. Character strings are not accepted; parse them with `ymd()`, `mdy()`, or `as.Date()` first.

**Is mday() the same as day() in lubridate?**

Yes, `mday()` and `day()` are exact aliases. Both return the day-of-month integer and `identical(mday(x), day(x))` is `TRUE` for any valid input. The two names exist for readability: `mday()` lines up with `wday()`, `yday()`, and `qday()` in mixed-extractor code, while `day()` reads cleaner standalone.

**How do I get the last day of the month in R?**

Use `days_in_month(x)` to get the integer 28, 29, 30, or 31 for any date, then compare with `mday(x)`. For example, `mday(x) == days_in_month(x)` flags true month-end rows and correctly handles February, 30-day months, and leap years. Hard-coding `mday(x) == 31` silently drops every February row and every short-month month-end.

**Can I change the day of a date with mday()?**

Yes, use the replacement form: `mday(x) <- 1`. This sets the day while keeping year, month, and time-of-day untouched. The form is vectorised, so `mday(date_column) <- 1` snaps every row to the first of its month. Values above the month's length roll forward (`mday(ymd("2024-04-15")) <- 31` becomes May 1), so cap with `pmin(value, days_in_month(x))` for fail-fast behaviour.

**What is the difference between mday() and wday() in R?**

`mday()` returns the position of a date within its month (1 to 31); `wday()` returns the position within the week (1 to 7, with Sunday as 1 by default). Both return small integers, but they answer different questions. Use `mday()` for calendar-day analysis (paydays, billing cycles) and `wday(x, label = TRUE)` for weekday analysis.
