---
title: "lubridate isoweek() in R: ISO 8601 Week Numbers"
slug: "lubridate-isoweek-in-R"
description: "Use lubridate isoweek() in R to extract ISO 8601 week numbers, pair with isoyear() to fix year boundary edge cases, and join international weekly reports."
keywords: "lubridate isoweek, isoweek function R, lubridate isoweek examples, ISO 8601 week R, isoyear R, R week number ISO, lubridate isoweek vs week"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "isoweek()|lubridate isoweek|lubridate::isoweek()|ISO 8601 week|ISO week number"
auto_link_case_sensitive: true
target_keyword: "lubridate isoweek"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate isoweek() in R: ISO 8601 Week Numbers

<p class="lead">The <code>isoweek()</code> function in lubridate returns the ISO 8601 week-of-year for a Date or POSIXct, an integer from 1 to 53 that follows the Thursday rule and always starts the week on Monday. It is the standards-compliant counterpart to <code>week()</code>, designed for international reports and any pipeline that has to agree with strftime <code>%V</code>.</p>

[QUICK ANSWER]
isoweek(ymd("2024-12-30"))                       # ISO week 1 of 2025
isoweek(ymd(c("2024-01-01", "2024-12-31")))      # vectorised
isoyear(ymd("2024-12-30"))                       # paired ISO year, returns 2025
df |> mutate(iw = isoweek(date))                 # ISO week column
df |> group_by(isoyear(date), isoweek(date))     # ISO-year + ISO-week rollup
format(ymd("2024-12-30"), "%G-W%V")              # ISO label "2025-W01"
isoweek(ymd("2020-12-31"))                       # 53, a 53-week ISO year
as.integer(format(date, "%V"))                   # base R equivalent

[DECISION TREE: Is isoweek() the right tool?]
- need ISO 8601 weeks (Thursday rule): isoweek(x)
- need the simple calendar week instead: week(x)
- need CDC epidemiological weeks: epiweek(x)
- need ISO year (paired with isoweek): isoyear(x)
- snap to start of ISO week as a Date: floor_date(x, "week", week_start = 1)
- build a sortable year-week label: format(x, "%G-W%V")
- pull day of ISO week (1 = Monday): wday(x, week_start = 1)
- compare against another system: as.integer(format(x, "%V"))

## What isoweek() does in one sentence

**`isoweek()` returns the ISO 8601 week number as an integer between 1 and 53.** Week 1 is the week containing the year's first Thursday, equivalently the week that contains January 4. Weeks always run Monday through Sunday. Pass any Date or POSIXct vector and you get a vector of the same length, with `NA` for `NA` input.

The Thursday rule means a late December date can belong to the next ISO year. December 30, 2024 is a Monday whose Thursday is January 2, 2025, so it is ISO week 1 of 2025, not week 53 of 2024.

## Syntax

**`isoweek(x)` takes one argument: a date or date-time vector.** No `week_start`, no `label`, no locale switch. The Monday-start rule is fixed by ISO 8601 and cannot be overridden. The output is always integer, fully vectorised.

```r title="Load lubridate and pull an ISO week"
library(lubridate)

d <- ymd("2024-02-14")
isoweek(d)
#> [1] 7

isoweek(ymd(c("2024-01-01", "2024-12-30", "2024-12-31")))
#> [1] 1 1 1

isoweek(NA)
#> [1] NA
```

February 14, 2024 sits in the seventh ISO week. December 30 and 31, 2024 share a week with Thursday January 2, 2025, so they return 1, not 53.

[TIP]
**Always pair `isoweek()` with `isoyear()`, never with `year()`.** Calendar `year()` returns 2024 for December 30, 2024, but `isoweek()` returns 1, giving you the meaningless label "2024-W01". `isoyear(d)` returns 2025 for the same date, so `paste(isoyear(d), isoweek(d))` lines up with strftime `%G-W%V`.

## Five common patterns

### 1. Get the ISO week number

```r title="ISO week of year"
d <- ymd(c("2024-01-01", "2024-02-14", "2024-07-04", "2024-12-25", "2024-12-30"))
isoweek(d)
#> [1]  1  7 27 52  1
```

The output is plain integer, ready for `%in%` and comparison. New Year's Day 2024 is a Monday so it sits in ISO week 1, and December 30 is the Monday of ISO 2025 week 1.

### 2. Build the canonical year-week label

```r title="ISO year-week string with isoyear()"
library(dplyr)

d <- ymd(c("2024-01-01", "2024-06-15", "2024-12-30"))

tibble(
  date    = d,
  iso_yr  = isoyear(d),
  iso_wk  = isoweek(d),
  label   = sprintf("%d-W%02d", isoyear(d), isoweek(d))
)
#> # A tibble: 3 x 4
#>   date       iso_yr iso_wk label
#>   <date>      <dbl>  <dbl> <chr>
#> 1 2024-01-01   2024      1 2024-W01
#> 2 2024-06-15   2024     24 2024-W24
#> 3 2024-12-30   2025      1 2025-W01
```

`sprintf("%d-W%02d", isoyear(d), isoweek(d))` produces the same label as `format(d, "%G-W%V")`. The leading zero keeps strings sortable alphabetically, which matters when joining against external systems.

### 3. Group and summarise by ISO week

```r title="ISO weekly average sales"
set.seed(1)
sales <- tibble(
  sale_date = seq(ymd("2024-12-23"), ymd("2025-01-19"), by = "day"),
  amount    = round(200 + rnorm(28, 0, 12), 1)
)

sales |>
  group_by(iso_yr = isoyear(sale_date), iso_wk = isoweek(sale_date)) |>
  summarise(avg = round(mean(amount), 1), n = dplyr::n(), .groups = "drop")
#> # A tibble: 4 x 4
#>   iso_yr iso_wk   avg     n
#>    <dbl>  <dbl> <dbl> <int>
#> 1   2024     52  200.     7
#> 2   2025      1  208.     7
#> 3   2025      2  201.     7
#> 4   2025      3  198.     7
```

The grouping crosses a calendar year cleanly. ISO week 1 of 2025 holds December 30 through January 5; using `group_by(year(date), isoweek(date))` would have split that week across two rows, since `year()` returns 2024 for December 30 and 2025 for January 5.

### 4. Snap dates to the start of the ISO week

```r title="Floor to Monday-start week"
d <- ymd(c("2024-12-29", "2024-12-30", "2024-12-31", "2025-01-01", "2025-01-05"))

floor_date(d, "week", week_start = 1)
#> [1] "2024-12-23" "2024-12-30" "2024-12-30" "2024-12-30" "2024-12-30"

tibble(date = d, iso_wk = isoweek(d), week_start = floor_date(d, "week", week_start = 1))
#> # A tibble: 5 x 3
#>   date       iso_wk week_start
#>   <date>      <dbl> <date>
#> 1 2024-12-29     52 2024-12-23
#> 2 2024-12-30      1 2024-12-30
#> 3 2024-12-31      1 2024-12-30
#> 4 2025-01-01      1 2024-12-30
#> 5 2025-01-05      1 2024-12-30
```

`isoweek()` returns an integer; `floor_date(x, "week", week_start = 1)` returns the Monday that begins the ISO week. Use the integer for grouping, the Date for joining against a weekly calendar or plotting on a time axis.

### 5. Spot a 53-week ISO year

```r title="Years with 53 ISO weeks"
year_ends <- ymd(c("2015-12-31", "2020-12-31", "2026-12-31", "2027-12-31"))

tibble(
  date    = year_ends,
  iso_wk  = isoweek(year_ends),
  iso_yr  = isoyear(year_ends)
)
#> # A tibble: 4 x 3
#>   date       iso_wk iso_yr
#>   <date>      <dbl>  <dbl>
#> 1 2015-12-31     53   2015
#> 2 2020-12-31     53   2020
#> 3 2026-12-31     53   2026
#> 4 2027-12-31     52   2027
```

A 53-week ISO year occurs every 5 or 6 years, when January 1 is a Thursday or, in a leap year, a Wednesday. Dashboard code that hard-codes a 52-bucket axis silently drops week 53 in those years; testing on a 53-week year exposes the bug.

[KEY INSIGHT]
**ISO week is a 3-part date, not a 2-part date.** A calendar date has year + month + day; an ISO week date has isoyear + isoweek + isoweekday. Drop any of the three and you create ambiguity at year boundaries. Always carry `isoyear()` next to `isoweek()`, and reach for `wday(x, week_start = 1)` when you need the day-of-ISO-week.

## isoweek() vs week() and format("%V")

**`isoweek()` competes with three other routes for week extraction.** Each returns a week number, but only `isoweek()` and `format("%V")` follow ISO 8601.

| Route | Example | Returns | Reads best when |
|---|---|---|---|
| `isoweek(x)` | `mutate(iw = isoweek(date))` | Integer 1 to 53 | ISO 8601 reports, Monday-start weeks |
| `week(x)` | `mutate(wk = week(date))` | Integer 1 to 53 | Simple calendar weeks, fast aggregation |
| `format(x, "%V")` | `format(date, "%V")` | Character "01" to "53" | ISO weeks without lubridate, sorted strings |
| `epiweek(x)` | `epiweek(date)` | Integer 1 to 53 | CDC epidemiological weeks, Sunday-start |

Confirm the relationship:

```r title="Compare isoweek with siblings"
d <- ymd(c("2024-01-01", "2024-12-30", "2024-12-31", "2025-01-01"))

data.frame(
  d       = d,
  iso_lub = isoweek(d),
  iso_bse = as.integer(format(d, "%V")),
  cal_wk  = week(d),
  epi_wk  = epiweek(d)
)
#>            d iso_lub iso_bse cal_wk epi_wk
#> 1 2024-01-01       1       1      1      1
#> 2 2024-12-30       1       1     53     53
#> 3 2024-12-31       1       1     53      1
#> 4 2025-01-01       1       1      1      1
```

`isoweek()` and `as.integer(format(d, "%V"))` always agree. `week()` resets on January 1, so it diverges from `isoweek()` at year boundaries. `epiweek()` is Sunday-start, which shifts the boundary by one day.

## Common pitfalls

**Pitfall 1: pairing isoweek() with year().** Using `paste(year(date), isoweek(date))` mis-labels late December dates: December 30, 2024 becomes "2024-W01" instead of the correct "2025-W01". Always reach for `isoyear()` in the same expression.

**Pitfall 2: assuming a 52-week axis.** Plot code with `scale_x_continuous(breaks = 1:52)` silently drops week 53 in ISO years like 2015, 2020, and 2026. Build the axis from `seq_len(max(isoweek(date)))` instead.

**Pitfall 3: forgetting week_start when flooring.** `floor_date(x, "week")` defaults to Sunday-start, which contradicts ISO 8601. Pass `week_start = 1` whenever you snap to the start of an ISO week.

[WARNING]
**`year()` and `isoyear()` disagree on December 29 to 31 every year and on January 1 to 3 some years.** A dashboard that mixes `year(date)` for filtering and `isoweek(date)` for grouping will drop or double-count rows around the year boundary. Either use ISO everywhere (`isoyear` plus `isoweek`) or calendar everywhere (`year` plus `week`); never mix.

[NOTE]
**Coming from Python pandas?** The equivalent of `isoweek(x)` is `s.dt.isocalendar().week` (pandas 1.1 and later), which returns the ISO week. Pair with `s.dt.isocalendar().year` for the ISO year. The older `s.dt.week` attribute is deprecated and behaves like the ISO version.

## A practical workflow with isoweek()

**ISO weeks show up in international reporting, finance close calendars, and SLA accounting.** European partners send weekly figures labelled "2025-W12"; match the key with `sprintf("%d-W%02d", isoyear(date), isoweek(date))` and the rows line up cleanly. Retail 52/53-week calendars approximate ISO weeks, and `wday(x, week_start = 1)` returns 1 for Monday through 7 for Sunday so weekday filters stay self-consistent.

```r title="Production-ready ISO week summary"
weekly <- sales |>
  mutate(
    iso_yr = isoyear(sale_date),
    iso_wk = isoweek(sale_date),
    label  = sprintf("%d-W%02d", iso_yr, iso_wk)
  ) |>
  group_by(label, iso_yr, iso_wk) |>
  summarise(total = round(sum(amount), 1), n = dplyr::n(), .groups = "drop") |>
  arrange(iso_yr, iso_wk)

head(weekly, 4)
#> # A tibble: 4 x 4
#>   label    iso_yr iso_wk total
#>   <chr>     <dbl>  <dbl> <dbl>
#> 1 2024-W52   2024     52 1404.
#> 2 2025-W01   2025      1 1458.
#> 3 2025-W02   2025      2 1410.
#> 4 2025-W03   2025      3 1387.
```

The `label` column is a stable join key, the `iso_yr` and `iso_wk` columns sort chronologically, and `n` confirms every bucket holds seven days. One query, two consumers: hand the label to a partner system and the integers to a chart.

## Try it yourself

**Try it:** Build a tibble with 14 daily rows starting on 2024-12-23, then compute the ISO weekly sum, carrying both `isoyear()` and `isoweek()` in the grouping. Save the result to `ex_iso_weekly`.

```r title="Your turn: ISO weekly totals"
# Try it: aggregate 14 daily rows into ISO weekly totals
ex_sales <- tibble(
  sale_date = seq(ymd("2024-12-23"), by = "day", length.out = 14),
  amount    = seq(100, 113, length.out = 14)
)

ex_iso_weekly <- # your code here

ex_iso_weekly
#> Expected: 2 rows, one per ISO week, with summed amount
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_iso_weekly <- ex_sales |>
  group_by(iso_yr = isoyear(sale_date), iso_wk = isoweek(sale_date)) |>
  summarise(total = round(sum(amount), 1), n = dplyr::n(), .groups = "drop")

ex_iso_weekly
#> # A tibble: 2 x 4
#>   iso_yr iso_wk total     n
#>    <dbl>  <dbl> <dbl> <int>
#> 1   2024     52  728      7
#> 2   2025      1  763      7
```

**Explanation:** December 30 to January 5 is ISO week 1 of 2025. Grouping by `isoyear()` alongside `isoweek()` keeps that week in a single row; a plain `year()` + `isoweek()` pairing would split it.

</details>

## Related lubridate functions

After mastering isoweek(), look at:

- `isoyear()`, `epiyear()`: the year functions that pair with `isoweek()` and `epiweek()`
- `week()`, `epiweek()`: other week conventions for calendar and CDC use
- `wday()`, `mday()`, `yday()`: day-prefix family, with `week_start = 1` for ISO weekdays
- `floor_date()`, `ceiling_date()`: snap to Monday-start week boundaries
- `make_date()`, `weeks()`: rebuild dates and shift by weekly periods
- `with_tz()`: when the week boundary changes because of time zone

See the [lubridate week documentation](https://lubridate.tidyverse.org/reference/week.html) for the official reference.

## FAQ

**What does isoweek() return in R?**

`isoweek()` returns the ISO 8601 week-of-year as an integer between 1 and 53. Week 1 is the week containing the year's first Thursday, equivalently the week containing January 4, and weeks always run Monday through Sunday. The function is fully vectorised and returns `NA` for `NA` input. It matches `format(x, "%V")` cast to integer and pairs with `isoyear()` for a full ISO date.

**What is the difference between isoweek() and week() in R?**

`isoweek()` follows ISO 8601: weeks start on Monday, and week 1 is the week with the year's first Thursday. `week()` resets every January 1, ignoring the Thursday rule. The functions agree mid-year and diverge at year boundaries: December 30, 2024 returns `week(d) = 53` but `isoweek(d) = 1`. Pick `isoweek()` for ISO-compliant reporting and `week()` for plain calendar buckets.

**How do I get the ISO week number from a date in R?**

The lubridate route is `isoweek(date)`, which returns integer 1 through 53. The base R route is `as.integer(format(date, "%V"))`, which returns the same value via strftime. For the matching ISO year, use `isoyear(date)` or `as.integer(format(date, "%G"))`; the calendar `year()` will mis-label late December dates.

**Why does isoweek() return 1 for December 30, 2024?**

The ISO 8601 rule says a week belongs to the year that contains its Thursday. December 30, 2024 is a Monday, and the Thursday of that week is January 2, 2025, so the week belongs to ISO year 2025 and is week 1. This is why `isoyear()` returns 2025 for the same date while `year()` returns 2024.

**Which ISO years have 53 weeks?**

An ISO year has 53 weeks when its January 1 is a Thursday, or when a leap year's January 1 is a Wednesday. In the 21st century, the 53-week years include 2004, 2009, 2015, 2020, 2026, 2032, and 2037. Code that hard-codes a 52-week axis will silently drop the extra week in those years; build the axis from `max(isoweek(date))` instead.
