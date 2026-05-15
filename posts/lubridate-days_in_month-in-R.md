---
title: "lubridate days_in_month() in R: Get the Days in Any Month"
slug: lubridate-days_in_month-in-R
description: "days_in_month() in R returns how many days a date's month has (28 to 31), with leap years handled automatically. See the syntax, examples, and common pitfalls."
keywords: "lubridate days_in_month, days_in_month function R, lubridate days_in_month examples, number of days in month R, days in month lubridate, last day of month R, R days in month"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: lubridate-functions
fr_parent: lubridate-in-R.html
auto_link_terms: "days_in_month()|lubridate days_in_month|days in a month|number of days in a month|days in month"
auto_link_case_sensitive: true
target_keyword: "lubridate days_in_month"
sibling_block_enabled: true
difficulty: Beginner
---

# lubridate days_in_month() in R

<p class="lead">The lubridate days_in_month() function returns how many calendar days a date's month contains, a value from 28 to 31, with February corrected automatically for leap years.</p>

[QUICK ANSWER]
days_in_month(ymd("2024-02-10"))         # 29 (leap-year Feb)
days_in_month(ymd("2023-02-10"))         # 28 (non-leap Feb)
days_in_month(Sys.Date())                # days in the current month
days_in_month(c(d1, d2, d3))             # vectorized over many dates
unname(days_in_month(d))                 # drop the month-name label
ceiling_date(d, "month") - days(1)       # last calendar day as a Date
mday(d) == days_in_month(d)              # TRUE when d is month-end

[DECISION TREE: Is days_in_month() the right tool?]
- count days in a date's month: days_in_month(d)
- get the last calendar day: ceiling_date(d, "month") - days(1)
- check if a year is a leap year: leap_year(d)
- snap a date to the month start: floor_date(d, "month")
- add months without overflow: d %m+% months(1)
- count days between two dates: as.numeric(d2 - d1)

## What days_in_month() does in one sentence

**days_in_month() counts the calendar days in a date's month.** You pass it a Date or date-time value and it returns how many days that month holds, anywhere from 28 to 31. The function reads only the month and year of the input, never the day component, so any date inside February 2024 returns the same answer.

The return value is a named integer vector. A single date gives one number labelled with the month's three-letter abbreviation, which is why printed output shows a header like `Feb` above the count. February is the only month whose length changes, and `days_in_month()` resolves that by checking whether the input's year is a leap year.

## Syntax

**days_in_month() takes exactly one argument.** The signature is `days_in_month(x)`, where `x` is the date object whose month you want measured. There are no extra options, no `na.rm` flag, and no format string to remember.

The argument `x` accepts several date classes:

- **Date** objects, the most common input, created by `ymd()` or `as.Date()`.
- **POSIXct** and **POSIXlt** date-times, including values carrying a time zone.
- **Period** objects, where the month slot drives the result.

The output is an integer vector the same length as `x`. Each element is named with the month abbreviation of the matching input. An `NA` date propagates to an `NA` count rather than throwing an error.

[NOTE]
**Coming from Python pandas?** The equivalent of `days_in_month()` is the `Series.dt.days_in_month` accessor, which also returns a leap-year-aware integer per timestamp.

## Five common patterns

**Most real uses of days_in_month() fall into a handful of shapes.** Load lubridate first, then start with the leap-year contrast that makes the function worth calling at all.

```r title="Load lubridate and compare February"
library(lubridate)

days_in_month(ymd("2024-02-10"))
#> Feb
#>  29

days_in_month(ymd("2023-02-10"))
#> Feb
#>  28
```

Both dates sit in February, but 2024 is a leap year and 2023 is not, so the counts differ. You never hardcode 28 when `days_in_month()` already knows the rule.

The function is vectorized, so you can measure a whole sequence of months at once.

```r title="Measure a sequence of months"
months_2024 <- ymd("2024-01-01") + months(0:5)
days_in_month(months_2024)
#> Jan Feb Mar Apr May Jun
#>  31  29  31  30  31  30
```

A frequent goal is the last calendar day of a month. Build it from the first of the month plus the day count, or snap forward with `ceiling_date()`.

```r title="Find the last day of the month"
d <- ymd("2024-02-09")

floor_date(d, "month") + days(days_in_month(d) - 1)
#> [1] "2024-02-29"

ceiling_date(d, "month") - days(1)
#> [1] "2024-02-29"
```

The day count also normalizes monthly figures into daily ones, which matters for prorating rent, salary, or subscription charges.

```r title="Prorate a monthly amount to a daily rate"
monthly_rent <- 1500
billing_date <- ymd("2024-02-15")

daily_rate <- monthly_rent / days_in_month(billing_date)
round(daily_rate, 2)
#> Feb
#> 51.72
```

[KEY INSIGHT]
**days_in_month() looks at the month and year, never the day.** Every date in the same month returns the identical count, so you can pass any convenient date, the 1st or the 15th, without changing the answer.

Finally, the count gives a clean test for whether a date is the last day of its month.

```r title="Check whether a date is month-end"
dates <- ymd(c("2024-02-29", "2024-03-30", "2024-04-30"))
mday(dates) == days_in_month(dates)
#>  Feb  Mar  Apr
#> TRUE FALSE  TRUE
```

## days_in_month() vs the alternatives

**days_in_month() is the shortest leap-year-aware way to count a month's days.** You can reach the same number with date arithmetic or base R, but those routes carry more code and more chances to forget February.

| Method | Code | Leap-aware | Best for |
|---|---|---|---|
| `days_in_month()` | `days_in_month(d)` | Yes | the day count itself |
| Boundary difference | `ceiling_date(d, "month") - floor_date(d, "month")` | Yes | when you also need the start and end dates |
| Base R | `format()` on a constructed month-end Date | Manual | scripts that avoid package dependencies |

The decision rule is simple. If you only need the number, call `days_in_month()`. If you are already computing the month's first and last dates, the boundary difference reuses that work. Reach for base R only when adding lubridate as a dependency is not an option.

## Common pitfalls

**Three mistakes account for most days_in_month() confusion.** Each has a quick fix.

First, feed `days_in_month()` a parsed date, not a raw string. A non-ISO string like `"02/10/2024"` cannot be coerced and returns `NA`, so always wrap text in `ymd()` first.

```r title="Pitfall: passing an unparsed string"
days_in_month("02/10/2024")
#> [1] NA

days_in_month(ymd("2024-02-10"))
#> Feb
#>  29
```

Second, the result is a *named* vector. When you assign it into a data frame column or compare it, the `Feb` style names can show up in unexpected places. Strip them with `unname()`.

```r title="Pitfall: stray names on the result"
unname(days_in_month(ymd("2024-02-10")))
#> [1] 29
```

[WARNING]
**Do not confuse days_in_month() with days().** `days_in_month()` returns an integer count, while `days()` builds a period object for date arithmetic. Using one where the other is expected silently produces wrong dates instead of an error.

Third, remember the function ignores the day. `days_in_month(ymd("2024-02-29"))` and `days_in_month(ymd("2024-02-01"))` both return 29 because only the month and year are read.

## Try it yourself

**Try it:** Compute the last calendar day of the month for the date 2024-02-20 and store it in `ex_last_day`.

```r title="Your turn: last day of the month"
# Try it: build the month-end date
ex_date <- ymd("2024-02-20")
ex_last_day <- # your code here

ex_last_day
#> Expected: 2024-02-29
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_date <- ymd("2024-02-20")
ex_last_day <- floor_date(ex_date, "month") +
  days(days_in_month(ex_date) - 1)
ex_last_day
#> [1] "2024-02-29"
```

**Explanation:** `floor_date()` snaps the date to the 1st of the month, then adding `days_in_month() - 1` days lands on the final calendar day. Because 2024 is a leap year, February ends on the 29th.

</details>

## Related lubridate functions

**days_in_month() works alongside the rest of lubridate's date toolkit.** These functions cover the adjacent tasks:

- [leap_year()](lubridate-leap_year-in-R.html) tests whether a year has 366 days, the rule behind February's count.
- [floor_date()](lubridate-floor_date-in-R.html) snaps a date down to the start of its month.
- [ceiling_date()](lubridate-ceiling_date-in-R.html) snaps a date up to the next month boundary.
- [rollback()](lubridate-rollback-in-R.html) returns the last day of the previous month.
- [mday()](lubridate-mday-in-R.html) extracts the day-of-month number for comparisons.

## FAQ

**Does days_in_month() account for leap years?**

Yes. When the input date falls in February, `days_in_month()` checks whether that year is a leap year and returns 29 for leap years and 28 otherwise. It uses the full Gregorian rule, so century years like 1900 return 28 while 2000 returns 29. You never need to apply the leap-year formula yourself.

**What does days_in_month() return for February?**

It returns 28 or 29 depending on the year. For example, `days_in_month(ymd("2024-02-15"))` returns 29 because 2024 is a leap year, while `days_in_month(ymd("2023-02-15"))` returns 28. Every other month returns a fixed value of 30 or 31.

**Can days_in_month() handle a vector of dates?**

Yes, the function is fully vectorized. Pass a vector of Date or POSIXct values and it returns one integer per element, each named with that date's month abbreviation. This makes it convenient inside `mutate()` or any column-wise operation on a data frame of dates.

**Why does the output have a name like "Feb"?**

`days_in_month()` returns a named integer vector, and the names are the three-letter month abbreviations of the input dates. The names are purely informational. If they interfere with a comparison or a data frame column, wrap the call in `unname()` to get a plain integer vector.

**How do I get the last day of the month with days_in_month()?**

Add `days_in_month(d) - 1` days to the first of the month: `floor_date(d, "month") + days(days_in_month(d) - 1)`. An equivalent route is `ceiling_date(d, "month") - days(1)`, which steps to the next month start and subtracts one day.
