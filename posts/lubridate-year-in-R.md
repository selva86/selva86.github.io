---
title: "lubridate year() in R: Extract Year from Dates"
slug: "lubridate-year-in-R"
description: "Use lubridate year() to extract the year from a Date or POSIXct vector in R, replace year values in place, and contrast year() with isoyear() and epiyear()."
keywords: "lubridate year, year function R, lubridate year examples, R extract year from date, year() lubridate, isoyear epiyear, lubridate year datetime"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "year()|lubridate year|lubridate::year()|extract year from date|year component"
auto_link_case_sensitive: true
target_keyword: "lubridate year"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate year() in R: Extract Year from Dates

<p class="lead">The <code>year()</code> function in lubridate returns the year component of a Date or POSIXct value as an integer. It is vectorised, so a column of dates becomes a column of years in one call.</p>

[QUICK ANSWER]
year(ymd("2024-07-15"))                    # extract year from a Date
year(now())                                # year of current datetime
year(as.Date("2024-07-15"))                # works on base Date too
year(c(ymd("2023-01-01"), ymd("2024-06-30")))  # vectorised
year(x) <- 2025                            # replace year in place
isoyear(ymd("2024-12-30"))                 # ISO 8601 week year
epiyear(ymd("2024-12-30"))                 # epidemiological year
df %>% mutate(yr = year(order_date))       # extract a column

[DECISION TREE: Is year() the right tool?]
- pull the year from a Date or POSIXct: year(x)
- pull the month number: month(x)
- pull the day of month: day(x)
- pull the weekday name: wday(x, label = TRUE)
- pull the ISO 8601 week year: isoyear(x)
- pull the CDC/MMWR epi year: epiyear(x)
- pull hour, minute, or second: hour(x), minute(x), second(x)
- round a date to start of year: floor_date(x, "year")

## What year() does in one sentence

**`year()` returns the calendar year of a date-time as an integer.** Pass any Date, POSIXct, or POSIXlt vector and you get back a numeric vector of the same length.

This is the lubridate counterpart to base R's `format(x, "%Y")` and `as.POSIXlt(x)$year + 1900`. The lubridate version is shorter, vectorised, and returns a numeric value you can use directly in arithmetic or comparisons.

## Syntax

**`year(x)` takes one argument: a Date or date-time vector.** The return value is an integer vector of the same length.

```r title="Load lubridate and pull a year"
library(lubridate)

year(ymd("2024-07-15"))
#> [1] 2024

year(ymd_hms("2024-07-15 09:30:00"))
#> [1] 2024

class(year(ymd("2024-07-15")))
#> [1] "integer"
```

The input can be any class that lubridate recognises as a date or datetime, including base `Date`, `POSIXct`, and `POSIXlt`. Character strings are NOT accepted directly. Parse them first with `ymd()`, `mdy()`, or `as.Date()`.

[TIP]
**Use `year(x) <- value` to overwrite the year in place.** This is the assignment form (replacement function) and it edits the date without changing the month, day, or time of day. Useful for shifting a series of dates to a different year.

## Five common patterns

### 1. Extract year from a single date

```r title="Year of a parsed date"
d <- ymd("2024-07-15")
year(d)
#> [1] 2024
```

The result is integer 2024, not a string `"2024"`. Use it in arithmetic directly: `year(d) + 1` returns 2025.

### 2. Extract year from a vector of dates

```r title="Vectorised over a date column"
dates <- ymd(c("2022-03-10", "2023-08-22", "2024-12-31"))
year(dates)
#> [1] 2022 2023 2024
```

`year()` is fully vectorised. A 1-million-row date column becomes a 1-million-row integer vector in one call. No loop or `sapply()` needed.

### 3. Replace year values in place

```r title="Shift dates to a different year"
events <- ymd(c("2023-01-15", "2023-06-30", "2023-12-25"))
year(events) <- 2024
events
#> [1] "2024-01-15" "2024-06-30" "2024-12-25"
```

The replacement form keeps month, day, hour, minute, and second untouched. This is the cleanest way to "rebase" a series of dates onto a new year, for example when reusing a calendar of holidays.

### 4. Use year() inside a dplyr pipeline

```r title="Aggregate sales by year"
library(dplyr)

orders <- tibble(
  order_date = ymd(c("2022-01-15", "2022-08-22",
                     "2023-03-10", "2023-11-05",
                     "2024-06-30")),
  amount = c(120, 80, 200, 150, 300)
)

orders %>%
  mutate(yr = year(order_date)) %>%
  group_by(yr) %>%
  summarise(total = sum(amount))
#> # A tibble: 3 x 2
#>      yr total
#>   <int> <dbl>
#> 1  2022   200
#> 2  2023   350
#> 3  2024   300
```

`mutate(yr = year(order_date))` adds a year column. `group_by(yr)` then `summarise()` rolls up the amounts. This is the canonical pattern for time-bucketed analysis.

### 5. Filter rows by year

```r title="Keep only one year of records"
orders %>%
  filter(year(order_date) == 2023)
#> # A tibble: 2 x 2
#>   order_date amount
#>   <date>      <dbl>
#> 1 2023-03-10    200
#> 2 2023-11-05    150
```

`year(order_date) == 2023` evaluates the expression row by row and keeps only matching dates. Combine with `between()` to get a year range: `filter(between(year(order_date), 2022, 2023))`. To filter to the current year, swap the literal for `year(today())`.

[KEY INSIGHT]
**Calling `year()` on a column is faster than `format(x, "%Y")` on the same column.** lubridate operates on the underlying numeric representation directly. `format()` allocates a string for every row, then you parse it back. On a million-row column the difference is roughly 5x.

## year() vs isoyear() vs epiyear()

**Three functions return a "year", but each uses a different calendar definition.**

| Function | Calendar | When does the year start? | Use case |
|---|---|---|---|
| `year()` | Gregorian | January 1 | Default for almost all analysis |
| `isoyear()` | ISO 8601 | Week 1 contains Jan 4 | Weekly reports, fiscal weeks |
| `epiyear()` | CDC/MMWR | Week 1 contains Jan 4 (Sun start) | Public health, surveillance |

The three usually agree, but they disagree at the year boundary. December 30, 2024 is Monday of an ISO week that contains January 1, 2025. So `year()` says 2024, but `isoyear()` says 2025.

```r title="Year boundary disagreement"
d <- ymd("2024-12-30")
year(d)
#> [1] 2024
isoyear(d)
#> [1] 2025
epiyear(d)
#> [1] 2024
```

If you are aggregating by `isoweek()`, pair it with `isoyear()` to keep weeks and years consistent. Mixing `year()` with `isoweek()` produces off-by-one errors at year boundaries.

## Common pitfalls

**Pitfall 1: passing a character string.** `year("2024-07-15")` errors because lubridate does not auto-parse strings inside `year()`. Wrap with `ymd()` first: `year(ymd("2024-07-15"))`. The same applies to slash-separated and other formats: parse, then extract.

**Pitfall 2: using `year()` with `isoweek()`.** Combining Gregorian year with ISO week causes off-by-one errors at the December/January boundary. If you call `isoweek()`, also call `isoyear()`. The same pairing rule holds for `epiweek()` and `epiyear()`.

[WARNING]
**Replacement on an invalid date silently shifts.** `year(ymd("2024-02-29")) <- 2023` returns `"2023-03-01"` because 2023 is not a leap year and February 29 does not exist. Lubridate rolls forward instead of erroring. Check leap-day inputs explicitly before reassigning the year.

[NOTE]
**Coming from Python pandas?** The equivalent of `year(x)` is `s.dt.year` on a datetime Series. The dplyr pipeline `mutate(yr = year(order_date))` mirrors `df.assign(yr=df.order_date.dt.year)`.

## A practical workflow with year()

**The three places `year()` shows up most often: filtering, grouping, and feature engineering for models.**

The patterns:

1. **Filter to a year of interest**: `filter(year(date) == 2024)` to keep only this year's rows.
2. **Group and summarise**: add a `yr` column with `mutate()`, then `group_by(yr)` for annual roll-ups.
3. **Build features for a model**: extract `year()`, `month()`, `day()`, `wday()` as predictors when the date itself is too granular.

For long time series, prefer `floor_date(x, "year")` over `year()` when you want a Date column to plot on. `year()` returns an integer, which is fine for grouping but loses the date class needed by `scale_x_date()` in ggplot2.

```r title="Year as a model feature"
orders %>%
  mutate(
    yr = year(order_date),
    mo = month(order_date),
    weekday = wday(order_date, label = TRUE)
  )
#> # A tibble: 5 x 4
#>   order_date amount    yr    mo weekday
#>   <date>      <dbl> <int> <dbl> <ord>
#> 1 2022-01-15    120  2022     1 Sat
#> 2 2022-08-22     80  2022     8 Mon
#> 3 2023-03-10    200  2023     3 Fri
#> 4 2023-11-05    150  2023    11 Sun
#> 5 2024-06-30    300  2024     6 Sun
```

## Try it yourself

**Try it:** Take the `orders` tibble above and compute total amount per year using `year()` inside `group_by()` directly (no `mutate()` step). Save the result to `ex_yearly`.

```r title="Your turn: year-grouped totals"
# Try it: group_by year() directly
ex_yearly <- # your code here

ex_yearly
#> Expected: 3 rows, columns yr and total
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_yearly <- orders %>%
  group_by(yr = year(order_date)) %>%
  summarise(total = sum(amount))

ex_yearly
#> # A tibble: 3 x 2
#>      yr total
#>   <int> <dbl>
#> 1  2022   200
#> 2  2023   350
#> 3  2024   300
```

**Explanation:** dplyr lets you compute the grouping column inline: `group_by(yr = year(order_date))`. This skips a separate `mutate()` step and gives the new column a clean name in one go.

</details>

## Related lubridate functions

After mastering year(), look at:

- `month()`, `day()`, `wday()`, `qday()`, `yday()`: extract other date parts
- `hour()`, `minute()`, `second()`: extract time-of-day components
- `isoyear()`, `epiyear()`: year using ISO 8601 or epi-week calendars
- `floor_date()`, `ceiling_date()`: round a date to year, quarter, month, week
- `make_date()`, `make_datetime()`: construct dates from year, month, day integers
- `ymd()`, `mdy()`, `dmy()`, `ymd_hms()`: parse strings into dates first

For the official reference, see the [lubridate year() documentation](https://lubridate.tidyverse.org/reference/year.html).

## FAQ

**How do I extract just the year from a date in R?**

Use `lubridate::year(x)` where `x` is a Date or POSIXct. The result is an integer like 2024. Base R alternatives are `format(x, "%Y")` (returns string) or `as.POSIXlt(x)$year + 1900` (returns integer with a 1900 offset). The lubridate version is the shortest and works on vectors directly.

**How do I get the current year in R?**

Combine `year()` with `today()` or `now()`: `year(today())`. This returns the current calendar year as an integer in your session's time zone. For a UTC year boundary use `year(today("UTC"))`.

**What package is year() in R?**

The `year()` function is exported by the lubridate package, part of the tidyverse. Load it with `library(lubridate)` or call it namespaced as `lubridate::year(x)`. Base R has no `year()` function. The closest base equivalents are `format(x, "%Y")` and `as.POSIXlt(x)$year + 1900`.

**What is the difference between year() and isoyear()?**

`year()` uses the Gregorian calendar starting January 1. `isoyear()` uses the ISO 8601 calendar where week 1 is the week containing January 4. They disagree on the few days at the December and January boundary. Use `isoyear()` only when paired with `isoweek()` for weekly reporting.

**Can I change the year of a date in R?**

Yes, with the replacement form: `year(x) <- 2025`. This sets the year while keeping month, day, and time. It is vectorised, so `year(date_vector) <- 2025` updates an entire column. Be careful with February 29 inputs: the assignment rolls forward to March 1 in non-leap years rather than erroring.
