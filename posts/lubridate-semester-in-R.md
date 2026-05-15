---
title: "lubridate semester() in R: Extract Semester from Dates"
slug: "lubridate-semester-in-R"
description: "Extract the semester (1 or 2) from any date in R using lubridate semester(). Examples for Date and POSIXct objects, plus fiscal and academic use cases."
keywords: "lubridate semester, semester function R, lubridate semester examples, R date semester, get semester from date R, extract semester R, semester lubridate package"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: lubridate-functions
fr_parent: lubridate-in-R.html
auto_link_terms: "semester()|lubridate semester|lubridate::semester()|semester function|semester from date"
auto_link_case_sensitive: true
target_keyword: "lubridate semester"
sibling_block_enabled: true
difficulty: Beginner
---

# lubridate semester() in R: Extract Semester from Dates

<p class="lead">The <strong>lubridate semester()</strong> function returns the semester (1 or 2) of a date-time vector, splitting the calendar year into two six-month halves: January through June and July through December.</p>

[QUICK ANSWER]
semester(date)                              # 1 (Jan-Jun) or 2 (Jul-Dec)
semester(date, with_year = TRUE)            # 2024.1 or 2024.2 format
semester(c(d1, d2, d3))                     # vectorized over a date vector
semester(ymd_hms("2024-05-15 09:30:00"))    # works on POSIXct too
paste0(year(d), "-S", semester(d))          # "2024-S1" string label
ifelse(month(d) %in% 1:6, "H1", "H2")       # alternative H1, H2 labels

[DECISION TREE: Is semester() the right tool?]
- split year into two halves (Jan-Jun, Jul-Dec): semester(date)
- split year into four quarters: quarter(date)
- need calendar week number: week(date) or isoweek(date)
- need month number (1-12): month(date)
- need ISO 8601 year-week label: isoweek(date)
- fiscal year split (custom start month): ifelse + month()
- academic year (Sep through Jun): custom function with month()

## What semester() does in one sentence

**semester() returns an integer label for each date's half-year.** You pass a Date, POSIXct, or POSIXlt vector, and the function returns 1 for January through June, 2 for July through December. The function never returns 0, 3, or any other value for valid inputs; only missing dates propagate as NA.

This makes it the cleanest one-liner for half-yearly aggregation, biannual cohort tagging, and any reporting period that splits the calendar in half. The function lives in the `lubridate` package alongside `year()`, `month()`, `quarter()`, and `week()`, and follows the same vectorized conventions as the rest of that family.

## Syntax

**The signature has two arguments.** The first is required, the second is optional:

```r title="Function signature"
semester(x, with_year = FALSE)
```

| Argument | Type | Default | Purpose |
|---|---|---|---|
| `x` | Date / POSIXct / POSIXlt | (required) | The date-time vector to label |
| `with_year` | logical | `FALSE` | If TRUE, returns `year.semester` numeric like `2024.1` |

When `with_year = FALSE`, output is an integer vector of 1s and 2s. When `with_year = TRUE`, output is a numeric vector where the fractional part encodes the semester, which makes it directly sortable across years.

Choose the default integer mode when you only care about half-year identity within a single year, and switch to `with_year = TRUE` whenever your data spans multiple years or feeds into a sorted report. The numeric output is also safe to pass into `group_by()`, `aggregate()`, and `tapply()` without converting back to a factor or string, because R treats those values as ordinary doubles.

## Five common patterns

**Each pattern below uses real lubridate output.** Start by loading the package and creating a small date sample that crosses the semester boundary:

```r title="Load lubridate and create dates"
library(lubridate)

dates <- as.Date(c("2024-01-15", "2024-04-10", "2024-06-30",
                   "2024-07-01", "2024-09-20", "2024-12-31"))
dates
#> [1] "2024-01-15" "2024-04-10" "2024-06-30" "2024-07-01" "2024-09-20" "2024-12-31"
```

### 1. Get the semester number

```r title="Extract semester from dates"
semester(dates)
#> [1] 1 1 1 2 2 2
```

The boundary lands cleanly: June 30 returns 1, July 1 returns 2. There is no ambiguity at the month edge, and there is no need to add an offset or correction. Behind the scenes, the function uses the rule `(month(x) - 1) %/% 6 + 1`, which is the same kind of integer-division trick that powers `quarter()`. You can drop straight into a `mutate()` or base R column assignment and trust the result.

### 2. Combine year and semester

```r title="Year-semester numeric label"
semester(dates, with_year = TRUE)
#> [1] 2024.1 2024.1 2024.1 2024.2 2024.2 2024.2
```

[TIP]
**Use `with_year = TRUE` whenever you sort or group across multiple years.** The numeric `2023.2 < 2024.1` ordering matches calendar order, so a simple `sort()` or `arrange()` puts periods in sequence without parsing string labels.

### 3. Works on date-times too

```r title="Semester on POSIXct vectors"
times <- ymd_hms(c("2024-05-15 09:30:00", "2024-11-01 14:45:00"))
semester(times)
#> [1] 1 2
```

The time component is ignored; only the date portion drives the result. You can hand any timestamp column to `semester()` without first dropping the time information through `as.Date()`.

### 4. Build custom string labels

```r title="Build H1 and H2 labels"
labels <- paste0("H", semester(dates), " ", year(dates))
labels
#> [1] "H1 2024" "H1 2024" "H1 2024" "H2 2024" "H2 2024" "H2 2024"
```

Combining `semester()` with `year()` and `paste0()` produces any label format your reporting requires, including `2024-H1`, `Sem 1 FY24`, or other internal conventions.

### 5. Tag a data frame column

```r title="Vectorize over a column"
sales <- data.frame(
  date = seq.Date(as.Date("2024-01-15"), as.Date("2024-12-15"), by = "month"),
  revenue = c(120, 135, 150, 142, 168, 175, 190, 205, 198, 212, 230, 245)
)
sales$sem <- semester(sales$date, with_year = TRUE)
head(sales, 4)
#>         date revenue    sem
#> 1 2024-01-15     120 2024.1
#> 2 2024-02-15     135 2024.1
#> 3 2024-03-15     150 2024.1
#> 4 2024-04-15     142 2024.1
```

## semester() vs the alternatives

**Three other lubridate functions split a year, but only semester() splits it in half.** Pick by the granularity your report needs:

| Function | Splits year into | Output | Best for |
|---|---|---|---|
| `semester()` | 2 halves (Jan-Jun, Jul-Dec) | 1 or 2 | half-yearly reports, biannual cohorts |
| `quarter()` | 4 quarters | 1 to 4 | quarterly financials, earnings periods |
| `month()` | 12 months | 1 to 12 | monthly trends, seasonal analysis |
| `week()` or `isoweek()` | 52 or 53 weeks | 1 to 53 | weekly KPIs, ISO 8601 reporting |

For a fiscal year that does not start in January, none of these match directly. Roll your own with `ifelse()` and `month()` as shown below.

The choice between `semester()` and `quarter()` usually comes down to reporting cadence rather than data type. If your stakeholder asks for "H1 and H2" or "first half, second half", `semester()` is the natural fit. If they ask for "Q1 through Q4", reach for `quarter()` instead. Both functions accept the same input types, both are vectorized, and both have an optional `with_year` mode, so swapping one for the other costs a single token.

## Common pitfalls

**Calendar semester is not the same as academic or fiscal semester.** This is the single biggest source of confusion:

```r title="Calendar vs academic semester"
sept_date <- as.Date("2024-09-01")
semester(sept_date)
#> [1] 2

# Academic year: September through January is the "first" semester
acad_sem <- function(d) ifelse(month(d) %in% c(9:12, 1), 1, 2)
acad_sem(sept_date)
#> [1] 1
```

[WARNING]
**`semester()` always uses the calendar year, never your institution's fiscal year.** If your reporting period starts in April, July, or September, write a custom helper using `month()` and `ifelse()`. Do not assume `semester()` knows about academic calendars, fiscal years, or company-specific reporting periods.

The second pitfall is silent NA propagation:

```r title="Missing dates propagate"
mixed <- c(as.Date("2024-03-15"), NA, as.Date("2024-09-20"))
semester(mixed)
#> [1]  1 NA  2
```

NAs pass through unchanged. If you need to exclude them, filter the vector before calling `semester()` or wrap the result with `na.omit()`. The third pitfall is sorting on a string label when `with_year = FALSE`. A label like `"H1"` and a label like `"H2"` sort correctly within a year, but mixed across multiple years they produce surprising orderings such as `2023-H1, 2023-H2, 2024-H1, 2024-H2` only when the year prefix is present. Always lead with the year, or use the numeric output of `with_year = TRUE`.

## A practical workflow with semester()

**Half-yearly revenue summary in one pipe.** Combine `semester()` with dplyr to aggregate any time-stamped data into two rows per year:

```r title="Aggregate revenue by half-year"
library(dplyr)

sales |>
  mutate(period = semester(date, with_year = TRUE)) |>
  group_by(period) |>
  summarise(total = sum(revenue), months = n())
#> # A tibble: 2 x 3
#>    period total months
#>     <dbl> <dbl>  <int>
#> 1  2024.1   890      6
#> 2  2024.2  1280      6
```

[KEY INSIGHT]
**Treat `semester()` as a date-aware factor builder, not a math function.** Once you read it as "give me the half-year tag for this row", combining it with `group_by()`, `aggregate()`, or `tapply()` becomes obvious. The numeric output from `with_year = TRUE` is sortable, so reports stay in calendar order without extra ordering logic.

## Try it yourself

**Try it:** Extract the semester for four sample dates that cross the June-July boundary. Use `with_year = TRUE` so the result is sortable across years.

```r title="Your turn: tag a date vector"
ex_dates <- as.Date(c("2025-02-14", "2025-06-30", "2025-07-01", "2025-11-30"))
ex_sem <- # your code here

ex_sem
#> Expected: 2025.1 2025.1 2025.2 2025.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sem <- semester(ex_dates, with_year = TRUE)
ex_sem
#> [1] 2025.1 2025.1 2025.2 2025.2
```

**Explanation:** June 30 returns 1 because June is the last month of the first semester. July 1 flips to 2. The `with_year = TRUE` argument concatenates the year and the semester into a single sortable numeric value.

</details>

## Related lubridate functions

- [`quarter()`](lubridate-quarter-in-R.html) splits the year into four quarters instead of two halves.
- [`month()`](lubridate-month-in-R.html) returns the month number (1 to 12) or full month name.
- [`year()`](lubridate-year-in-R.html) extracts the four-digit year, ideal for pairing with `semester()`.
- [`week()`](lubridate-week-in-R.html) and [`isoweek()`](lubridate-isoweek-in-R.html) give week numbers for finer granularity.

For the full date-component family, see the [lubridate package guide](lubridate-in-R.html). External reference: the [lubridate documentation on dates and times](https://lubridate.tidyverse.org/reference/semester.html) covers the underlying algorithm.

Pair `semester()` with `floor_date(date, "halfyear")` when you need the start date of each semester rather than the integer label. One gives you the period identifier for grouping; the other gives you a date you can plot on a timeline or join to a calendar table.

## FAQ

**What does semester() return for January 1?**

January 1 returns 1, because January is the first month of the first semester. The function partitions the year so that months 1 through 6 map to semester 1 and months 7 through 12 map to semester 2. The boundary between semesters falls between June 30 (still semester 1) and July 1 (semester 2). There is no overlap and no off-by-one ambiguity at year boundaries.

**Can semester() handle a fiscal year that starts in April?**

Not directly. The function is hardcoded to the calendar year, so April through September always spans both semesters. Build a custom helper such as `fiscal_sem <- function(d) ifelse(month(d) %in% 4:9, 1, 2)` and apply it across your date vector. For more complex fiscal calendars with shifted year starts, combine `month()` and `year()` arithmetic to define your own period boundaries explicitly.

**Why does semester(x, with_year = TRUE) return a numeric, not a string?**

The numeric encoding (`2024.1`, `2024.2`) is intentional: it sorts in calendar order without any parsing, so `sort()` and `arrange()` work correctly across years. If you need a string label like `"2024-H1"` for display, wrap the call with `paste0()` or `sprintf()` and assemble the format yourself from `year()` and `semester()` separately.

**Is semester() vectorized over a column?**

Yes. The function accepts a Date or POSIXct vector of any length and returns a vector of the same length. This means you can pass an entire data frame column directly to `mutate()` or `transform()` without `sapply()` or `Map()`. The vectorized path is the recommended approach: it is faster than row-wise loops and works inside `dplyr` and `data.table` pipelines.

**Does semester() work on character date strings?**

No. The input must already be a Date, POSIXct, or POSIXlt object. If your data is stored as character, parse it first with `ymd()`, `mdy()`, `dmy()`, or `as.Date()`. Passing a raw character vector raises an error because lubridate refuses to guess the format. Explicit parsing is safer than silent type coercion in any production pipeline.
