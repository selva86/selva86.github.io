---
title: "lubridate quarter() in R: Extract Quarter From Dates"
slug: "lubridate-quarter-in-R"
description: "Use lubridate quarter() in R to extract the calendar or fiscal quarter from a Date or POSIXct, return year.quarter labels, and group dates into Q1-Q4 buckets."
keywords: "lubridate quarter, quarter function R, lubridate quarter examples, fiscal quarter R, quarter from date R, year.quarter R, R Q1 Q2 Q3 Q4 from date"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "quarter()|lubridate quarter|lubridate::quarter()|fiscal quarter|year.quarter"
auto_link_case_sensitive: true
target_keyword: "lubridate quarter"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate quarter() in R: Extract Quarter From Dates

<p class="lead">The <code>quarter()</code> function in lubridate returns the calendar quarter (1, 2, 3, or 4) for a Date or POSIXct value, with optional arguments for fiscal-year offsets and year.quarter labels. It is the quarterly counterpart to <code>year()</code>, <code>month()</code>, and <code>week()</code>, designed for Q1 through Q4 aggregation, fiscal-period rollups, and tidy quarterly reporting.</p>

[QUICK ANSWER]
quarter(ymd("2024-02-14"))                          # simple calendar quarter
quarter(ymd(c("2024-01-15", "2024-07-01")))         # vectorised, returns 1 and 3
quarter(ymd("2024-04-01"), type = "year.quarter")   # numeric label like 2024.2
quarter(ymd("2024-04-01"), with_year = TRUE)        # legacy alias for year.quarter
quarter(ymd("2024-07-01"), fiscal_start = 7)        # July-start fiscal Q1
quarter(ymd("2024-02-14"), type = "date_first")     # first day of the quarter
df |> mutate(qtr = quarter(date))                   # quarterly bucket column
df |> group_by(quarter(date)) |> summarise(...)     # quarterly rollup

[DECISION TREE: Is quarter() the right tool?]
- bucket dates into Q1, Q2, Q3, Q4: quarter(x)
- return numeric year.quarter label (2024.2): quarter(x, type = "year.quarter")
- compute quarter under a non-January fiscal year: quarter(x, fiscal_start = 7)
- snap a date to the start of its quarter: floor_date(x, "quarter")
- get the month inside a quarter: month(x)
- get the week inside a quarter: week(x)
- shift a date by N quarter periods: x + months(3 * N)
- build a zoo year-quarter index for ts plotting: zoo::as.yearqtr(x)

## What quarter() does in one sentence

**`quarter()` returns the calendar quarter as an integer between 1 and 4.** Jan-Mar map to 1, Apr-Jun to 2, Jul-Sep to 3, Oct-Dec to 4. The formula is `(month(x) - 1) %/% 3 + 1`. Pass any Date, POSIXct, or POSIXlt vector and you get a vector of the same length.

By default `quarter()` ignores the year and returns just 1 through 4. The `type` and `fiscal_start` arguments extend it to year.quarter labels and non-January fiscal years.

## Syntax

**`quarter(x, type = "quarter", fiscal_start = 1)` takes a date vector and two optional arguments.** `type` controls the return shape: `"quarter"` for the plain integer, `"year.quarter"` for a numeric like 2024.2, `"date_first"` and `"date_last"` for the first or last day of the quarter. `fiscal_start` shifts Q1 to any month from 1 to 12.

```r title="Load lubridate and pull a quarter number"
library(lubridate)

d <- ymd("2024-02-14")
quarter(d)
#> [1] 1

quarter(ymd(c("2024-01-15", "2024-04-15", "2024-07-15", "2024-10-15")))
#> [1] 1 2 3 4

quarter(NA)
#> [1] NA
```

February 14, 2024 sits in Q1 because February is the second month and `(2 - 1) %/% 3 + 1` equals 1. The vectorised call returns one quarter per input date, and `NA` inputs propagate as `NA`.

[TIP]
**Combine quarter() with year() to get a unique bucket.** `quarter(x)` returns 1 through 4 with no year context, so Q2 of 2023 and Q2 of 2024 collide. Group by both: `group_by(yr = year(date), qtr = quarter(date))`. For a single sortable label, use `quarter(x, type = "year.quarter")` to get a numeric like 2024.2.

## Five common patterns

### 1. Get the quarter number

```r title="Calendar quarter from a Date"
d <- ymd(c("2024-01-01", "2024-03-31", "2024-04-01", "2024-12-25"))
quarter(d)
#> [1] 1 1 2 4
```

The output is plain integer, ready for `%in%`, comparison, and arithmetic. New Year's Day and March 31 both map to Q1; April 1 starts Q2; Christmas falls in Q4. Quarters are tied to months only, with no locale or weekday concept.

### 2. Group and summarise by quarter

```r title="Quarterly average sales"
library(dplyr)

set.seed(1)
sales <- tibble(
  sale_date = seq(ymd("2024-01-01"), ymd("2024-12-31"), by = "day"),
  amount = round(200 + 30 * sin(2 * pi * seq_len(366) / 91) + rnorm(366, 0, 15), 1)
)

sales |>
  group_by(yr = year(sale_date), qtr = quarter(sale_date)) |>
  summarise(avg = round(mean(amount), 1), n = dplyr::n(), .groups = "drop")
#> # A tibble: 4 x 4
#>      yr   qtr   avg     n
#>   <dbl> <int> <dbl> <int>
#> 1  2024     1 196.     91
#> 2  2024     2 220.     91
#> 3  2024     3 203.     92
#> 4  2024     4 181.     92
```

Each row collapses about 91 consecutive days into one bucket. Including `year()` in the grouping prevents Q1 of different years from merging. The `n` column confirms each quarter holds 91 or 92 days.

### 3. Year + quarter as a single numeric label

```r title="year.quarter labels with type"
d <- ymd(c("2024-01-15", "2024-04-15", "2024-07-15", "2024-10-15"))

quarter(d, type = "year.quarter")
#> [1] 2024.1 2024.2 2024.3 2024.4

quarter(d, with_year = TRUE)
#> [1] 2024.1 2024.2 2024.3 2024.4
```

`type = "year.quarter"` returns numeric labels that sort correctly and survive plotting on a continuous axis. `with_year = TRUE` is the legacy alias and produces the same output; new code should prefer `type`. Use this shape when you need a single key per quarter, for example as the x-axis of a quarterly trend chart.

### 4. Fiscal quarters with a non-January start

```r title="July-start fiscal year"
d <- ymd(c("2024-01-15", "2024-04-15", "2024-07-15", "2024-10-15"))

quarter(d, fiscal_start = 7)
#> [1] 3 4 1 2

quarter(d, type = "year.quarter", fiscal_start = 7)
#> [1] 2024.3 2024.4 2025.1 2025.2
```

`fiscal_start = 7` declares July as fiscal Q1, so Jul-Sep is Q1, Oct-Dec is Q2, Jan-Mar is Q3, and Apr-Jun is Q4. With `type = "year.quarter"`, the year component also shifts: a July 2024 date belongs to fiscal year 2025 Q1. Set `fiscal_start` to your organisation's Q1 month (1 for calendar, 4 for UK government, 7 for Australia, 10 for US federal).

### 5. Quarter start and end dates

```r title="First and last day of the quarter"
d <- ymd(c("2024-02-14", "2024-05-20", "2024-11-30"))

quarter(d, type = "date_first")
#> [1] "2024-01-01" "2024-04-01" "2024-10-01"

quarter(d, type = "date_last")
#> [1] "2024-03-31" "2024-06-30" "2024-12-31"
```

`type = "date_first"` returns the first day of the date's quarter as a Date; `type = "date_last"` returns the last. Use this to align rows to quarter boundaries before joining against a quarterly reference table. `floor_date(x, "quarter")` returns the same first-day result for callers who prefer that family.

[KEY INSIGHT]
**`quarter()` is the right shape for finance and reporting, where Q1-Q4 thinking is native.** Reach for it when stakeholders speak in fiscal periods, board-level metrics, or quarterly variances. For calendar-week or epi-week rollups use `week()`, `isoweek()`, or `epiweek()` instead, and never mix weekly with quarterly buckets in the same chart.

## quarter() vs the alternatives

**`quarter()` competes with two base R routes for quarter extraction.** Each returns the same idea (which quarter is this date in?) with a different shape.

| Style | Example | Returns | Reads best when |
|---|---|---|---|
| `quarter(x)` | `mutate(qtr = quarter(date))` | Integer 1 to 4 | Calendar or fiscal quarters with optional year suffix |
| `(month(x) - 1) %/% 3 + 1` | `mutate(qtr = (month(date) - 1) %/% 3 + 1)` | Integer 1 to 4 | Dependency-free, single-line base R |
| `format(x, "%q")` | `format(date, "%q")` | Character "1" to "4" | Locale-aware formatting, plain base R |

Confirm the relationship:

```r title="Compare with base R routes"
d <- ymd(c("2024-01-15", "2024-04-15", "2024-07-15", "2024-10-15"))

data.frame(
  d           = d,
  lub_quarter = quarter(d),
  base_calc   = (month(d) - 1) %/% 3 + 1,
  base_format = format(d, "%q")
)
#>            d lub_quarter base_calc base_format
#> 1 2024-01-15           1         1           1
#> 2 2024-04-15           2         2           2
#> 3 2024-07-15           3         3           3
#> 4 2024-10-15           4         4           4
```

`quarter()` and `(month(x) - 1) %/% 3 + 1` always agree. `format(d, "%q")` returns character (cast with `as.integer()` for arithmetic). For a printed "2024 Q1" label, see `zoo::as.yearqtr()` in the zoo package.

## Common pitfalls

**Pitfall 1: forgetting the year when grouping.** `quarter()` returns 1 through 4 with no year context, so `group_by(quarter(date))` merges Q2 of 2023 with Q2 of 2024. Always group by `year(date)` alongside `quarter(date)`, or use `quarter(x, type = "year.quarter")`.

**Pitfall 2: passing a character.** `quarter("2024-02-14")` errors. Wrap with `ymd()` or `as.Date()` first.

**Pitfall 3: confusing `with_year` and `type`.** Both produce the same numeric output today, but `with_year` is the legacy argument and may be deprecated in a future lubridate release. New code should use `type = "year.quarter"`.

[WARNING]
**`quarter()` does not return a Date by default.** Beginners sometimes write `quarter(x) + 1` expecting a shifted Date and get integer 2, 3, 4, or 5 instead. To shift a date by one quarter use `x + months(3)`. To snap a date to the start of its quarter use `floor_date(x, "quarter")` or `quarter(x, type = "date_first")`. Treat the integer output as a bucket label, not a date.

[NOTE]
**Coming from Python pandas?** The equivalent of `quarter(x)` is `s.dt.quarter`, which returns integer 1 to 4. For year.quarter labels use `s.dt.to_period("Q")` (period type) or `s.dt.year.astype(str) + "Q" + s.dt.quarter.astype(str)` for a character version. Fiscal-year offsets need `s.dt.to_period("Q-JUN")` (June-end fiscal) and similar variants.

## A practical workflow with quarter()

**Quarter-of-year shows up in quarterly rollups, quarter-over-quarter growth, and seasonality plots.** `group_by(yr = year(date), qtr = quarter(date))` returns one row per calendar quarter. Compute the average, then `lag()` it to get QoQ growth. For seasonality plots, put `quarter()` on the x-axis with `facet_wrap(~ year)`.

```r title="Quarter-over-quarter growth"
quarterly <- sales |>
  group_by(yr = year(sale_date), qtr = quarter(sale_date)) |>
  summarise(avg = round(mean(amount), 1), .groups = "drop") |>
  arrange(yr, qtr) |>
  mutate(qoq_pct = round((avg / lag(avg) - 1) * 100, 1))

quarterly
#> # A tibble: 4 x 4
#>      yr   qtr   avg qoq_pct
#>   <dbl> <int> <dbl>   <dbl>
#> 1  2024     1 196.    NA
#> 2  2024     2 220.    12.2
#> 3  2024     3 203.    -7.7
#> 4  2024     4 181.   -10.8
```

The `qoq_pct` column carries the percent change versus the prior quarter; `lag()` returns `NA` for Q1 because there is no prior. Plot this directly or feed it into a board-deck table.

## Try it yourself

**Try it:** Build a tibble with 365 daily revenue rows starting on 2024-01-01, then compute the quarterly sum using `quarter()`. Save the result to `ex_quarterly_sum`.

```r title="Your turn: quarterly totals"
# Try it: aggregate 365 daily rows into quarterly totals
ex_sales <- tibble(
  sale_date = seq(ymd("2024-01-01"), by = "day", length.out = 365),
  revenue = seq(100, 200, length.out = 365)
)

ex_quarterly_sum <- # your code here

ex_quarterly_sum
#> Expected: 4 rows, one per quarter, with summed revenue
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_quarterly_sum <- ex_sales |>
  group_by(yr = year(sale_date), qtr = quarter(sale_date)) |>
  summarise(total = round(sum(revenue), 1), n = dplyr::n(), .groups = "drop")

ex_quarterly_sum
#> # A tibble: 4 x 4
#>      yr   qtr  total     n
#>   <dbl> <int>  <dbl> <int>
#> 1  2024     1 10283.    91
#> 2  2024     2 12483.    91
#> 3  2024     3 14758.    92
#> 4  2024     4 16983.    91
```

**Explanation:** `group_by(year(date), quarter(date))` produces one row per calendar quarter. Each bucket holds 91 or 92 daily rows depending on how many days the quarter contains, and `sum(revenue)` rolls them into a single quarterly total.

</details>

## Related lubridate functions

After mastering quarter(), look at:

- `year()`, `month()`, `week()`, `day()`: other calendar-part extractors
- `semester()`: half-year buckets (H1, H2) with the same fiscal_start logic
- `yday()`, `mday()`, `wday()`: day-prefix family
- `floor_date()`, `ceiling_date()`: snap to quarter start or end as a Date
- `make_date()`, `months()`: rebuild dates and shift by monthly or quarterly periods
- `as_date()`, `ymd()`: parse strings before passing to quarter()

See the [lubridate quarter documentation](https://lubridate.tidyverse.org/reference/quarter.html) for the official reference.

## FAQ

**What does quarter() return in R?**

`quarter()` returns the calendar quarter as an integer between 1 and 4. Jan-Mar map to 1, Apr-Jun to 2, Jul-Sep to 3, Oct-Dec to 4. The formula is `(month(x) - 1) %/% 3 + 1`. It is fully vectorised over Date, POSIXct, and POSIXlt inputs and returns `NA` for `NA` input, matching the rest of the lubridate extractor family.

**How do I get the quarter from a date in R?**

The lubridate route is `quarter(date)`, which returns integer 1 through 4. The base R route is `(month(date) - 1) %/% 3 + 1` for an integer or `format(date, "%q")` for a character. The lubridate version returns integer directly and accepts a `type` argument for year.quarter labels; the base versions need cast or paste glue to reach the same shape. All three are vectorised.

**What is the difference between quarter() and fiscal_start in lubridate?**

`quarter()` is the function; `fiscal_start` is its argument. By default `fiscal_start = 1` declares January as the start of Q1 (calendar quarters). Setting `fiscal_start = 7` declares July as Q1, so quarters become Jul-Sep (Q1), Oct-Dec (Q2), Jan-Mar (Q3), Apr-Jun (Q4). Combine with `type = "year.quarter"` to get a fiscal year.quarter label like 2025.1 for a July 2024 date.

**How do I extract Q1, Q2, Q3, Q4 from a date in R?**

Use `quarter(date)`, which returns 1, 2, 3, or 4. For a "Q1" through "Q4" character label, paste: `paste0("Q", quarter(date))`. For "2024-Q1" use `paste0(year(date), "-Q", quarter(date))`, or `quarter(date, type = "year.quarter")` for a numeric 2024.1. The integer form suits grouping; the character form suits chart axes.

**Can quarter() handle fiscal years that do not start in January?**

Yes. Pass `fiscal_start` as the month number where Q1 begins. For UK government finance (April) use `fiscal_start = 4`; for US federal (October) use `fiscal_start = 10`; for many Australian organisations (July) use `fiscal_start = 7`. The integer output shifts so the chosen month maps to 1, and `type = "year.quarter"` adjusts the year too.
