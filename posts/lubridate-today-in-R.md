---
title: "lubridate today() in R: Current Date as a Date Object"
slug: "lubridate-today-in-R"
description: "Use lubridate today() to return the current date in R as a Date object, with optional time zones. Six examples plus today() vs Sys.Date() and now() compared."
keywords: "lubridate today, today function R, lubridate today examples, R current date, today() R example, lubridate today timezone, today vs Sys.Date"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "today()|lubridate today|lubridate::today()|current date in R|get today's date"
auto_link_case_sensitive: true
target_keyword: "lubridate today"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate today() in R: Current Date as a Date Object

<p class="lead">The <code>today()</code> function in lubridate returns the current calendar date in R as a <code>Date</code> object. Pass a time zone like <code>today("UTC")</code> when the calendar boundary matters across regions.</p>

[QUICK ANSWER]
today()                                # current date, local tz
today("UTC")                           # date in UTC
today("Asia/Tokyo")                    # date in Tokyo
today() + days(7)                      # one week from now
today() - days(30)                     # thirty days ago
format(today(), "%A %d %B %Y")         # weekday day month year
as.numeric(today() - ymd("2024-01-01"))   # days since 2024-01-01
wday(today(), label = TRUE)            # weekday name

[DECISION TREE: Is today() the right tool?]
- need today's date only: today()
- need current date AND time: now()
- need a fixed reference date: ymd("2024-01-15")
- parsing a string into Date: ymd(x) or as.Date(x)
- need yesterday or tomorrow: today() +/- days(1)
- want first or last day of month: floor_date(today(), "month")
- need year, month, or day number: year(today()), month(today())
- comparing dates without time noise: stay in Date class

## What today() does in one sentence

**`today()` returns the current calendar date as a `Date` object.** No time component, no seconds, just the year, month, and day in your session's time zone.

`Date` objects are stored internally as the number of days since 1970-01-01. This makes `today()` ideal for deadlines, age calculations, day counts, and anything where the time of day is noise rather than signal.

## Syntax

**`today(tzone = "")` takes one optional argument: the time zone string.**

```r title="Get the current date"
library(lubridate)

today()
#> [1] "2026-05-15"

class(today())
#> [1] "Date"
```

The default `tzone = ""` uses your session zone returned by `Sys.timezone()`. Pass any IANA zone name like `"UTC"` or `"Pacific/Auckland"` to read the calendar date in that location instead.

[TIP]
**Use `today()` when the time of day is irrelevant.** Date objects are smaller, sort cleanly, and avoid the timezone surprises that POSIXct values can produce around midnight boundaries.

## Six common patterns

### 1. Today in the local zone

```r title="Default reads the session timezone"
today()
#> [1] "2026-05-15"
```

The output is a single `Date` value formatted as `YYYY-MM-DD`. There is no time component to print.

### 2. Today in a different region

```r title="Override with an IANA zone"
today("UTC")
#> [1] "2026-05-15"

today("Pacific/Auckland")
#> [1] "2026-05-16"
```

Around midnight UTC, regions east of the date line can already be on tomorrow's date while the US is still on yesterday's. This matters for daily reports that aggregate by calendar day.

### 3. Date arithmetic with periods

```r title="Add or subtract days, weeks, months"
today() + days(7)
#> [1] "2026-05-22"

today() - weeks(2)
#> [1] "2026-05-01"

today() %m+% months(1)
#> [1] "2026-06-15"
```

`days()`, `weeks()`, `months()`, and `years()` are period constructors. The `%m+%` operator handles end-of-month edge cases (Jan 31 + 1 month = Feb 28 instead of an invalid date).

### 4. Days between two dates

```r title="Count days between today and another date"
launch <- ymd("2026-12-01")
days_until <- as.numeric(launch - today())
days_until
#> [1] 200
```

Subtracting two `Date` values returns a `difftime` measured in days. Coerce with `as.numeric()` to get a plain integer for downstream math.

### 5. Extract date parts

```r title="Year, month, day, weekday"
year(today())
#> [1] 2026

month(today(), label = TRUE)
#> [1] May
#> 12 Levels: Jan < Feb < Mar < Apr < May < Jun < ... < Dec

wday(today(), label = TRUE, abbr = FALSE)
#> [1] Friday
#> 7 Levels: Sunday < Monday < Tuesday < ... < Saturday
```

`year()`, `month()`, `day()`, `wday()`, `quarter()`, and `week()` work on any Date or POSIXct value. Use `label = TRUE` for the named version when displaying month or weekday.

### 6. Round to month, week, or year

```r title="floor_date and ceiling_date"
floor_date(today(), "month")
#> [1] "2026-05-01"

ceiling_date(today(), "month")
#> [1] "2026-06-01"

floor_date(today(), "week", week_start = 1)
#> [1] "2026-05-11"
```

Useful for grouping daily records into months, computing first-of-next-month billing cycles, or aligning reports to ISO week boundaries (Monday start).

[KEY INSIGHT]
**A `Date` is just a count of days since 1970-01-01.** That is why subtracting two dates gives a plain difftime in days, and why `today() + 7` adds seven days without any timezone math. POSIXct, by contrast, carries a time and a zone, which is where most date-time bugs originate.

## today() vs Sys.Date() vs now()

**Three functions for current-time work, each returning a different type.**

| Function | Package | Returns | Time component | Time zone arg |
|---|---|---|---|---|
| `today()` | lubridate | Date | No | Yes |
| `Sys.Date()` | base R | Date | No | No (session zone) |
| `now()` | lubridate | POSIXct | Yes | Yes |

Reach for `today()` when the calendar date is what matters and you want explicit zone control. `Sys.Date()` is the zero-dependency base R equivalent. Use `now()` when seconds, minutes, or hours are part of the answer.

## Common pitfalls

**Pitfall 1: comparing dates against POSIXct.** Mixing `today() == Sys.time()` returns `FALSE` because R coerces the Date to a POSIXct at midnight, which almost never equals the current instant. Compare like with like: `today() == as.Date(Sys.time())`.

**Pitfall 2: assuming `today()` is stable within a session.** Like `now()`, `today()` reads the system clock at call time. If your script runs across midnight, the value changes mid-execution. Capture it once: `today_run <- today()`.

[WARNING]
**Time zone choice changes the date near midnight.** A user in Auckland and a user in Los Angeles can call `today()` at the same wall-clock instant and get different results. For shared logs and reports, prefer `today("UTC")` so the calendar boundary is unambiguous.

[NOTE]
**Coming from Python?** `today()` corresponds to `datetime.date.today()`. Both ignore the time of day and return a date object that supports arithmetic in days.

## Try it yourself

**Try it:** Compute how many days remain until the next New Year's Day. Save the result to `ex_days_left`.

```r title="Your turn: days until New Year"
# Try it: days until next 1 Jan
next_year <- year(today()) + 1
new_year <- ymd(paste0(next_year, "-01-01"))

ex_days_left <- # your code here

ex_days_left
#> Expected: a positive integer under 366
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
next_year <- year(today()) + 1
new_year <- ymd(paste0(next_year, "-01-01"))
ex_days_left <- as.numeric(new_year - today())
ex_days_left
#> [1] 230
```

**Explanation:** `year(today()) + 1` gives next year, and `ymd()` parses the date string. Subtracting two Date values yields a difftime in days; `as.numeric()` converts it to a plain integer.

</details>

## Related lubridate functions

After mastering today(), look at:

- `now()`: current POSIXct datetime, with time and zone
- `Sys.Date()`, `Sys.time()`: base R equivalents
- `ymd()`, `mdy()`, `dmy()`: parse date strings into Date objects
- `floor_date()`, `ceiling_date()`, `round_date()`: align dates to month, week, or year
- `year()`, `month()`, `day()`, `wday()`: extract components from a Date
- `interval()`, `as.duration()`: durations and intervals between two dates

For the official package documentation, see the [lubridate reference site](https://lubridate.tidyverse.org/).

## FAQ

**What is the difference between today() and Sys.Date() in R?**

Both return the current calendar date as a `Date` object. `today()` accepts a time zone argument: `today("UTC")` returns the calendar date in UTC, which can differ from your session zone near midnight. `Sys.Date()` always uses the session zone and has no time zone parameter, so you would need to set the system zone first.

**How do I get yesterday's date in R with lubridate?**

Subtract one day: `today() - days(1)`. The `days()` constructor returns a period of one calendar day; subtracting it from any Date gives you the previous day. For tomorrow, use `today() + days(1)`. Both expressions return a `Date` object you can pass to any function that accepts a Date.

**Why does today() return a different date in different time zones?**

Calendar dates change at midnight in each region. When New York is on May 15 at 10pm, Auckland is already on May 16 at 2pm. `today("Pacific/Auckland")` reads the current instant and returns the date in that zone, which can be one day ahead or behind your session date.

**How do I check if today is a weekend?**

Use `wday(today(), week_start = 1) >= 6`. With `week_start = 1` (Monday), Saturday is 6 and Sunday is 7, so the comparison flags weekend days. Alternatively, `wday(today(), label = TRUE) %in% c("Sat", "Sun")` reads more clearly.

**How do I get the first day of the current month?**

Call `floor_date(today(), "month")`. It rounds the date down to the start of its month, returning a `Date` for the first day. Use `ceiling_date(today(), "month")` for the first day of next month, useful for billing cycles or end-of-period reporting.
