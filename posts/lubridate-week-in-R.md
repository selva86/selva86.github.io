---
title: "lubridate week() in R: Week-of-Year From Dates"
slug: "lubridate-week-in-R"
description: "Use lubridate week() in R to extract the week number from a Date or POSIXct, compare with isoweek() and epiweek(), and group dates into weekly buckets."
keywords: "lubridate week, week function R, lubridate week examples, week number from date R, isoweek R, R week of year, lubridate week vs isoweek"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "week()|lubridate week|lubridate::week()|week-of-year extractor|extract week number"
auto_link_case_sensitive: true
target_keyword: "lubridate week"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate week() in R: Week-of-Year From Dates

<p class="lead">The <code>week()</code> function in lubridate returns the week-of-year number (1 to 53) for a Date or POSIXct value, computed as the number of complete seven-day periods since January 1 plus one. It is the calendar-week counterpart to <code>yday()</code>, designed for weekly aggregation, week-over-week comparisons, and time-bucketed plotting.</p>

[QUICK ANSWER]
week(ymd("2024-02-14"))                          # simple week of year
week(ymd(c("2024-01-01", "2024-12-31")))         # vectorised, returns 1 and 53
isoweek(ymd("2024-12-30"))                       # ISO 8601 week (1 of 2025)
epiweek(ymd("2024-02-14"))                       # CDC epi week (Sunday-start)
df |> mutate(wk = week(date))                    # weekly bucket column
df |> group_by(year(date), week(date)) |> summarise(...)  # weekly rollup
floor_date(x, "week")                            # snap to week start
format(x, "%V")                                  # ISO week as character

[DECISION TREE: Is week() the right tool?]
- bucket dates into 1 to 53 weekly groups: week(x)
- need ISO 8601 weeks (Thursday rule): isoweek(x)
- need CDC epidemiological weeks: epiweek(x)
- pull the day of week (1 to 7): wday(x)
- pull the day of year (1 to 366): yday(x)
- snap to start of week as a Date: floor_date(x, "week")
- get year-week character label: format(x, "%Y-W%V")
- count business days, not calendar weeks: bizdays package

## What week() does in one sentence

**`week()` returns the week-of-year as an integer between 1 and 53.** The formula is `(yday(x) - 1) %/% 7 + 1`. January 1 to January 7 are week 1, January 8 to January 14 are week 2, and so on through December. Pass any Date, POSIXct, or POSIXlt vector and you get a vector of the same length.

This is lubridate's "simple" week function. It does not implement the ISO 8601 rule, does not honour `week_start`, and does not align to Sunday. For those behaviours use `isoweek()` or `epiweek()` instead.

## Syntax

**`week(x)` takes one argument: a date or date-time vector.** No `label`, no `week_start`, no `abbr`. The output is always integer. The function is fully vectorised and returns `NA` for `NA` input.

```r title="Load lubridate and pull a week number"
library(lubridate)

d <- ymd("2024-02-14")
week(d)
#> [1] 7

week(ymd(c("2024-01-01", "2024-01-08", "2024-12-31")))
#> [1]  1  2 53

week(NA)
#> [1] NA
```

February 14, 2024 lands in week 7 because it is the 45th day of the year, and `(45 - 1) %/% 7 + 1` equals 7. The last day of the year sits in week 53.

[TIP]
**Combine week() with year() to get a unique bucket.** `week(x)` returns 1 through 53 with no year context, so week 7 of 2023 and week 7 of 2024 collide. Group by both: `group_by(yr = year(date), wk = week(date))` produces a unique row per calendar week without sticky-tape work.

## Five common patterns

### 1. Get the week number

```r title="Numeric week of year"
d <- ymd(c("2024-01-01", "2024-02-14", "2024-07-04", "2024-12-25"))
week(d)
#> [1]  1  7 27 52
```

The output is plain integer, ready for `%in%`, comparison, and arithmetic. New Year's Day is week 1, Independence Day is week 27, Christmas is week 52. No locale, no Sunday-versus-Monday switch.

### 2. Group and summarise by week

```r title="Weekly average sales"
library(dplyr)

set.seed(1)
sales <- tibble(
  sale_date = seq(ymd("2024-01-01"), ymd("2024-03-31"), by = "day"),
  amount = round(200 + 20 * sin(2 * pi * seq_len(91) / 7) + rnorm(91, 0, 10), 1)
)

sales |>
  group_by(yr = year(sale_date), wk = week(sale_date)) |>
  summarise(avg = round(mean(amount), 1), n = dplyr::n(), .groups = "drop") |>
  head(5)
#> # A tibble: 5 x 4
#>      yr    wk   avg     n
#>   <dbl> <dbl> <dbl> <int>
#> 1  2024     1 199.      7
#> 2  2024     2 199.      7
#> 3  2024     3 196.      7
#> 4  2024     4 200.      7
#> 5  2024     5 203.      7
```

Each row collapses seven consecutive days into one bucket. Including `year()` in the grouping prevents week 1 of two different years from being merged. The `n` column confirms each week holds seven days except the last partial one.

### 3. Compare week() with isoweek() and epiweek()

```r title="Three week-of-year conventions"
edges <- ymd(c("2024-01-01", "2024-12-30", "2024-12-31", "2025-01-01"))

tibble(
  date     = edges,
  week     = week(edges),
  isoweek  = isoweek(edges),
  epiweek  = epiweek(edges)
)
#> # A tibble: 4 x 4
#>   date        week isoweek epiweek
#>   <date>     <dbl>   <dbl>   <dbl>
#> 1 2024-01-01     1       1       1
#> 2 2024-12-30    53       1      53
#> 3 2024-12-31    53       1       1
#> 4 2025-01-01     1       1       1
```

The three functions diverge at year boundaries. `week()` resets on January 1 of each calendar year. `isoweek()` follows ISO 8601: the week containing the year's first Thursday is week 1, so December 30, 2024 is already ISO week 1 of 2025. `epiweek()` is the US CDC convention used in epidemiology: Sunday-start, with week 1 containing January 4, so December 31, 2024 falls in epi week 1.

### 4. Build a year-week label

```r title="ISO year-week string for plots"
d <- ymd(c("2024-01-01", "2024-06-15", "2024-12-30"))

format(d, "%Y-W%V")
#> [1] "2024-W01" "2024-W24" "2025-W01"

paste0(year(d), "-W", sprintf("%02d", week(d)))
#> [1] "2024-W01" "2024-W24" "2024-W53"
```

`format(x, "%Y-W%V")` builds the ISO 8601 year-week label using the strftime engine, which is correct for ISO compliance. The lubridate-only route `paste0(year(d), "-W", sprintf("%02d", week(d)))` builds a calendar-year label, which matches `week()` semantics but disagrees with ISO at year boundaries. Pick the route that matches the function you used.

### 5. Snap dates to the start of the week

```r title="Floor to week start"
d <- ymd(c("2024-02-12", "2024-02-13", "2024-02-14", "2024-02-15"))

floor_date(d, "week")                       # Sunday-week default
#> [1] "2024-02-11" "2024-02-11" "2024-02-11" "2024-02-11"

floor_date(d, "week", week_start = 1)       # Monday-week
#> [1] "2024-02-12" "2024-02-12" "2024-02-12" "2024-02-12"
```

`week()` returns an integer; `floor_date(x, "week")` returns the Date at the start of the week. Use the integer for grouping when sorting matters; use the Date for joining against a weekly calendar table or for plotting on a time axis. Together they cover both shapes of weekly logic.

[KEY INSIGHT]
**week(), isoweek(), and epiweek() answer different questions.** Reach for `week()` when you want the simplest weekly bucket inside one calendar year, `isoweek()` when reports must follow ISO 8601, and `epiweek()` when the audience is public-health analysts. Mixing them silently shifts a week boundary and changes year-end totals; always confirm which one your downstream consumers expect.

## week() vs the base R alternatives

**`week()` competes with three base R routes for week extraction.** Each returns the same idea (which week is this date in?) with a different convention.

| Style | Example | Returns | Reads best when |
|---|---|---|---|
| `week(x)` | `mutate(wk = week(date))` | Integer 1 to 53 | Simple calendar weeks, fast aggregation |
| `isoweek(x)` | `isoweek(date)` | Integer 1 to 53 | ISO 8601 reports, Monday-start weeks |
| `format(x, "%V")` | `format(date, "%V")` | Character "01" to "53" | ISO weeks without lubridate, sorted strings |
| `format(x, "%U")` | `format(date, "%U")` | Character "00" to "53" | Sunday-start weeks with leading zero |

Confirm the relationship:

```r title="Compare with base R routes"
d <- ymd(c("2024-01-01", "2024-12-30", "2024-12-31"))

data.frame(
  d        = d,
  lub_week = week(d),
  iso_lub  = isoweek(d),
  iso_base = as.integer(format(d, "%V"))
)
#>            d lub_week iso_lub iso_base
#> 1 2024-01-01        1       1        1
#> 2 2024-12-30       53       1        1
#> 3 2024-12-31       53       1        1
```

`isoweek()` and `format(d, "%V")` always agree. `week()` differs at the year boundary because it resets on January 1 instead of following the Thursday rule. The base route is dependency-free; lubridate returns integer directly.

## Common pitfalls

**Pitfall 1: collapsing week 53 with next year's week 1.** `week()` resets every January 1, so `group_by(week(date))` merges late-December and early-January rows from two different years. Always group by `year(date)` alongside `week(date)`.

**Pitfall 2: assuming ISO compliance.** `week()` is not ISO 8601. December 30, 2024 returns 53 but `isoweek()` returns 1 (of 2025). External reports citing "week 1" almost always mean ISO weeks; pick `isoweek()` unless confirmed otherwise.

**Pitfall 3: passing a character.** `week("2024-02-14")` errors. Wrap with `ymd()` or `as.Date()` first.

**Pitfall 4: expecting week 53 only in leap years.** Any year whose January 1 lands late in the week can produce a week 53, leap year or not.

[WARNING]
**`week()` has no week_start argument.** Unlike `wday()` and `floor_date()`, `week()` does not honour a Sunday-versus-Monday switch and ignores `getOption("lubridate.week.start")`. If your team needs Monday-aligned weeks, use `isoweek()` (Monday-start by design) or `floor_date(x, "week", week_start = 1)` for the snap-to-week-start version. Code that mixes `week()` with `wday(x, week_start = 1)` will see weeks and weekdays disagree on where Sunday belongs.

[NOTE]
**Coming from Python pandas?** The equivalent of `week(x)` is `s.dt.isocalendar().week` from pandas 1.1 plus (ISO week, matching `isoweek()`). For the lubridate `week()` semantics (count of seven-day periods since January 1), use `(s.dt.dayofyear - 1) // 7 + 1`. Older pandas `s.dt.week` is deprecated and behaves like the ISO version.

## A practical workflow with week()

**Week-of-year appears in three places: weekly rollups, week-over-week growth, and seasonality plots.**

1. **Weekly rollups.** `group_by(yr = year(date), wk = week(date))` returns one row per calendar week without cross-year collisions.
2. **Week-over-week growth.** Compute the weekly average, then `lag()` it: `mutate(wow = (avg / lag(avg) - 1) * 100)`.
3. **Seasonality plots.** Plot `week()` on the x-axis with `facet_wrap(~ year)` to compare 52 weeks across multiple years.

```r title="Week-over-week growth"
weekly <- sales |>
  group_by(yr = year(sale_date), wk = week(sale_date)) |>
  summarise(avg = round(mean(amount), 1), .groups = "drop") |>
  arrange(yr, wk) |>
  mutate(wow_pct = round((avg / lag(avg) - 1) * 100, 1))

head(weekly, 5)
#> # A tibble: 5 x 4
#>      yr    wk   avg wow_pct
#>   <dbl> <dbl> <dbl>   <dbl>
#> 1  2024     1 199.    NA
#> 2  2024     2 199.    -0.3
#> 3  2024     3 196.    -1.4
#> 4  2024     4 200.     1.9
#> 5  2024     5 203.     1.7
```

Five lines turn a daily series into a weekly trend table. The `wow_pct` column carries the percent change versus the prior week; `lag()` naturally returns `NA` for week 1 because there is no prior. Plot this directly or feed it into an alerting rule.

## Try it yourself

**Try it:** Build a tibble with 21 daily sales rows starting on 2024-06-01, then compute the weekly sum using `week()`. Save the result to `ex_weekly_sum`.

```r title="Your turn: weekly totals"
# Try it: aggregate 21 daily rows into weekly totals
ex_sales <- tibble(
  sale_date = seq(ymd("2024-06-01"), by = "day", length.out = 21),
  amount = seq(100, 120, length.out = 21)
)

ex_weekly_sum <- # your code here

ex_weekly_sum
#> Expected: 3 rows, one per week, with summed amount
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_weekly_sum <- ex_sales |>
  group_by(yr = year(sale_date), wk = week(sale_date)) |>
  summarise(total = round(sum(amount), 1), n = dplyr::n(), .groups = "drop")

ex_weekly_sum
#> # A tibble: 3 x 4
#>      yr    wk total     n
#>   <dbl> <dbl> <dbl> <int>
#> 1  2024    22 217.      2
#> 2  2024    23 770.      7
#> 3  2024    24 826.      7
```

**Explanation:** `group_by(year(date), week(date))` produces one row per calendar week. June 1, 2024 lands in week 22, so the first bucket only holds two days; the next two buckets are full seven-day weeks.

</details>

## Related lubridate functions

After mastering week(), look at:

- `isoweek()`, `epiweek()`: ISO 8601 and CDC week conventions
- `year()`, `month()`, `quarter()`: other calendar-part extractors
- `yday()`, `mday()`, `wday()`: day-prefix family
- `floor_date()`, `ceiling_date()`: snap to week start or end
- `make_date()`, `weeks()`: rebuild dates and shift by weekly periods
- `with_tz()`: when the week boundary changes because of time zone

See the [lubridate week documentation](https://lubridate.tidyverse.org/reference/week.html) for the official reference.

## FAQ

**What does week() return in R?**

`week()` returns the week-of-year as an integer between 1 and 53. The formula is `(yday(x) - 1) %/% 7 + 1`, so January 1 to January 7 are week 1, January 8 to January 14 are week 2, and the count continues through December. The function is fully vectorised and returns `NA` for `NA` input, matching the rest of the lubridate extractor family.

**What is the difference between week() and isoweek() in R?**

`week()` resets every January 1 and counts seven-day periods from there. `isoweek()` follows ISO 8601: the week containing the year's first Thursday is week 1, which means late December dates can already be week 1 of the next year. For example, December 30, 2024 returns `week(d) = 53` but `isoweek(d) = 1`. Pick `isoweek()` for ISO-compliant reporting; pick `week()` for simple calendar buckets.

**How do I get the week number from a date in R?**

The lubridate route is `week(date)`, which returns integer 1 through 53. The base R route is `as.integer(format(date, "%V"))` for ISO weeks or `as.integer(format(date, "%U"))` for Sunday-start weeks. The lubridate version returns integer directly, while the base version returns character and needs casting. Both are vectorised.

**Why does week() return 53 for December 30 but isoweek() returns 1?**

`week()` resets on January 1 and counts forward, so any date close to the year end lands in week 53 of that calendar year. `isoweek()` shifts the week 1 boundary to the week containing the year's first Thursday, which often means the last week of December belongs to the next ISO year. Both conventions are valid; they answer different questions.
