---
title: "lubridate leap_year() in R: Test if a Date Is a Leap Year"
slug: "lubridate-leap_year-in-R"
description: "Use lubridate leap_year() to test whether a year or Date falls in a leap year in R. Covers vectorised checks, dplyr filtering, and the century-year rule."
keywords: "lubridate leap_year, leap_year function R, lubridate leap_year examples, R check leap year, is leap year R, leap year function lubridate, detect leap year R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "leap_year()|lubridate leap_year|lubridate::leap_year()|leap year|is leap year"
auto_link_case_sensitive: true
target_keyword: "lubridate leap_year"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate leap_year() in R: Test if a Date Is a Leap Year

<p class="lead">The <code>leap_year()</code> function in lubridate returns <code>TRUE</code> when a year or Date falls in a leap year and <code>FALSE</code> otherwise. It accepts either a numeric year or a Date vector and is fully vectorised.</p>

[QUICK ANSWER]
leap_year(2024)                          # test a year integer
leap_year(2023)                          # FALSE, not a leap year
leap_year(ymd("2024-02-29"))             # test a Date directly
leap_year(c(2020, 2021, 2024))           # vectorised over years
leap_year(now())                         # is the current year a leap year
sum(leap_year(2000:2099))                # count leap years in a range
leap_year(1900)                          # FALSE, century-year rule

[DECISION TREE: Is leap_year() the right tool?]
- test if a year or date is a leap year: leap_year(x)
- count the days in a given month: days_in_month(x)
- get the ordinal day of year (1-366): yday(x)
- extract the year number from a date: year(x)
- round a date down to January 1: floor_date(x, "year")
- build a date from year, month, day: make_date(y, m, d)

## What leap_year() does in one sentence

**`leap_year()` reports whether a date-time or year is a leap year.** Pass a numeric year, a Date, a POSIXct, or a vector of any of these, and you get back a logical vector of the same length.

A leap year has 366 days instead of 365, with February 29 added. The rule is not simply "divisible by 4": century years must also be divisible by 400. `leap_year()` applies that full rule for you, so 1900 returns `FALSE` while 2000 returns `TRUE`.

## Syntax

**`leap_year(date)` takes one argument and returns a logical vector.** The argument is a Date, a date-time, or a numeric year. The output has the same length as the input.

```r title="Load lubridate and test a year"
library(lubridate)

leap_year(2024)
#> [1] TRUE

leap_year(ymd("2023-06-15"))
#> [1] FALSE

class(leap_year(2024))
#> [1] "logical"
```

When you pass a number, lubridate treats it as a calendar year. When you pass a Date or POSIXct, it extracts the year first, then tests it. The return class is always `logical`, so you can use the result directly in `if()`, `sum()`, `filter()`, or `ifelse()`.

[TIP]
**`leap_year()` accepts a bare year, so you do not need a full date.** `leap_year(2024)` works without constructing `ymd("2024-01-01")`. This makes it convenient for validating year inputs from a form or a config file before building dates.

## Five common patterns

### 1. Test a single year

```r title="Year as a plain integer"
leap_year(2024)
#> [1] TRUE

leap_year(2025)
#> [1] FALSE
```

The input is a number, not a string. `leap_year(2024)` returns `TRUE` because 2024 is divisible by 4 and is not a century year.

### 2. Test a Date value

```r title="Leap year of a parsed date"
leap_year(ymd("2024-07-01"))
#> [1] TRUE
```

`leap_year()` extracts the year from the Date, then tests it. Note the result reflects the whole year: July 1, 2024 returns `TRUE` because 2024 is a leap year, even though July 1 is not February 29.

### 3. Test a vector of years

```r title="Vectorised over a range"
years <- 2020:2025
leap_year(years)
#> [1]  TRUE FALSE FALSE FALSE  TRUE FALSE
```

`leap_year()` is fully vectorised. A column of a million years or dates becomes a logical vector in one call, with no loop or `sapply()` needed.

### 4. Flag leap years inside a dplyr pipeline

```r title="Add a leap-year column"
library(dplyr)

orders <- tibble(
  order_date = ymd(c("2020-02-29", "2021-07-10",
                     "2024-11-05", "2023-03-01"))
)

orders %>%
  mutate(is_leap = leap_year(order_date))
#> # A tibble: 4 x 2
#>   order_date is_leap
#>   <date>     <lgl>  
#> 1 2020-02-29 TRUE   
#> 2 2021-07-10 FALSE  
#> 3 2024-11-05 TRUE   
#> 4 2023-03-01 FALSE  
```

`mutate(is_leap = leap_year(order_date))` adds a logical column. You can then `filter(is_leap)` to keep only leap-year rows, or `group_by(is_leap)` to compare the two groups.

### 5. Count leap years in a range

```r title="Sum a logical vector"
sum(leap_year(2000:2099))
#> [1] 25
```

Because the result is logical, `sum()` counts the `TRUE` values. The 21st century has 25 leap years: 2000 qualifies under the divisible-by-400 rule, while 2100 does not.

[KEY INSIGHT]
**A logical vector is a number in disguise.** `TRUE` counts as 1 and `FALSE` as 0, so `sum(leap_year(x))` counts leap years and `mean(leap_year(x))` gives the proportion. This is why `leap_year()` slots cleanly into `filter()`, `summarise()`, and `ifelse()` without conversion.

## leap_year() vs the manual modulo rule

**A common shortcut tests `year %% 4 == 0`, but that misses the century rule.** Years divisible by 100 are leap years only if also divisible by 400. The naive check gets 1900 and 2100 wrong.

| Year | `year %% 4 == 0` | `leap_year()` | Correct? |
|---|---|---|---|
| 2024 | TRUE | TRUE | Both right |
| 2023 | FALSE | FALSE | Both right |
| 1900 | TRUE | FALSE | Only `leap_year()` |
| 2000 | TRUE | TRUE | Both right |
| 2100 | TRUE | FALSE | Only `leap_year()` |

```r title="Modulo rule fails on century years"
naive_leap <- function(y) y %% 4 == 0

naive_leap(1900)
#> [1] TRUE

leap_year(1900)
#> [1] FALSE

leap_year(2000)
#> [1] TRUE
```

The modulo rule looks correct for any year between 1901 and 2099, which is why the bug often hides. Use `leap_year()` and the century cases are handled for you.

## Common pitfalls

**Pitfall 1: confusing the year with the date.** `leap_year()` tells you whether the *year* is a leap year, not whether a date is February 29. `leap_year(ymd("2024-08-15"))` returns `TRUE` because 2024 is a leap year. To check for the leap day itself, test the month and day directly.

**Pitfall 2: passing a character string.** `leap_year("2024")` does not work reliably because a string is neither numeric nor a Date. Convert first: use `as.integer("2024")` for a year, or `ymd("2024-02-29")` for a date string.

[WARNING]
**Building February 29 in a non-leap year does not error.** `ymd("2023-02-29")` returns `NA` rather than stopping. Always run `leap_year()` on the year before constructing a February 29 date, or you will get silent `NA` values flowing through your pipeline.

[NOTE]
**Coming from Python pandas?** There is no direct one-liner. The closest is `pd.Timestamp(year, 1, 1).is_leap_year`, applied per element. The vectorised `leap_year(date_column)` in R replaces a `.apply()` loop.

## Try it yourself

**Try it:** Count how many leap years fall between the years 2000 and 2050 inclusive. Save the count to `ex_leaps`.

```r title="Your turn: count leap years"
# Try it: count leap years in 2000-2050
ex_leaps <- # your code here

ex_leaps
#> Expected: 13
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_leaps <- sum(leap_year(2000:2050))

ex_leaps
#> [1] 13
```

**Explanation:** `2000:2050` builds the year sequence, `leap_year()` returns a logical vector, and `sum()` counts the `TRUE` values. The range holds 13 leap years, including 2000 itself.

</details>

## Related lubridate functions

After mastering leap_year(), look at:

- `year()`, `month()`, `day()`: extract individual date components
- `yday()`: the ordinal day of year, which reaches 366 only in leap years
- `days_in_month()`: returns 29 for February in a leap year, 28 otherwise
- `make_date()`, `make_datetime()`: construct dates from year, month, and day integers
- `floor_date()`, `ceiling_date()`: round a date to the start or end of a year
- `ymd()`, `mdy()`, `dmy()`: parse strings into Date objects before testing

For the official reference, see the [lubridate leap_year() documentation](https://lubridate.tidyverse.org/reference/leap_year.html).

## FAQ

**How do I check if a year is a leap year in R?**

Call `lubridate::leap_year(x)` where `x` is a numeric year such as `2024`. It returns `TRUE` or `FALSE`. The function applies the full Gregorian rule, so it handles century years like 1900 and 2000 correctly. Load lubridate first with `library(lubridate)`, or call it namespaced without attaching the package.

**Does leap_year() work on dates or only on years?**

It works on both. Pass a numeric year and it tests that year directly. Pass a Date or POSIXct value and it extracts the year first, then tests it. The result describes the whole year, so any date in 2024 returns `TRUE`, not just February 29.

**What is the difference between leap_year() and the modulo 4 rule?**

`year %% 4 == 0` is incomplete. A century year is a leap year only if it is also divisible by 400. The modulo rule wrongly flags 1900 and 2100 as leap years. `leap_year()` applies the divisible-by-400 exception, so it returns the correct answer for every year.

**How do I count leap years in a range of years in R?**

Pass the range to `leap_year()` and sum the result: `sum(leap_year(2000:2099))`. Because a logical vector treats `TRUE` as 1, `sum()` returns the count of leap years. Use `mean()` instead of `sum()` to get the proportion of leap years in the range.
