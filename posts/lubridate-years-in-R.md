---
title: "lubridate years() in R: Add and Subtract Year Periods"
slug: "lubridate-years-in-R"
description: "Use lubridate years() in R to add and subtract years from dates. Covers syntax, leap-year %m+% fix, age calculation, and the years() vs year() vs dyears() trap."
keywords: "lubridate years, years function R, lubridate years examples, add years to date R, lubridate period years, years() lubridate, subtract years R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "years()|lubridate years|lubridate::years()|add years to date|year period"
auto_link_case_sensitive: true
target_keyword: "lubridate years"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate years() in R: Add and Subtract Year Periods

<p class="lead">The <code>years()</code> function in lubridate builds a Period object representing N calendar years. Add it to a Date or POSIXct to shift forward, subtract to shift backward, and pair it with <code>%m+%</code> when the start date is February 29 in a leap year.</p>

[QUICK ANSWER]
years(1)                                  # a 1-year period object
ymd("2024-01-15") + years(1)              # shift a date forward
today() - years(5)                        # five years ago
years(c(1, 5, 10))                        # vector of period lengths
ymd("2024-02-29") %m+% years(1)           # safe leap-year rollover
ymd("2024-02-29") + years(1)              # NA (no Feb 29, 2025)
df %>% mutate(anniv = start_date %m+% years(1))   # 1-year anniversary column
interval(dob, today()) %/% years(1)       # age in whole years

[DECISION TREE: Is years() the right tool?]
- shift a date by N calendar years: x %m+% years(N)
- shift by exact-second durations (365.25-day years): x + dyears(N)
- handle Feb-29 rollover safely: x %m+% years(N) or add_with_rollback()
- compute age in whole years: interval(dob, today()) %/% years(1)
- extract the year integer from a date: year(x)
- snap a date to start of year: floor_date(x, "year")
- generate an annual sequence: anchor %m+% years(0:N)
- build a date from year, month, day: make_date(y, m, d)

## What years() does in one sentence

**`years()` constructs a calendar-aware Period of N years that you can add to or subtract from a date.** Pass an integer or numeric vector and lubridate returns a Period that respects calendar boundaries on Date or POSIXct values.

This differs from a fixed 365-day shift because calendar years are 365 or 366 days long. The trade-off is the leap-year rollover problem on February 29, which `%m+%` solves cleanly.

## Syntax

**`years(x = 1)` accepts a numeric vector and returns a Period of the same length.** Default `x` is 1, so `years()` by itself is a one-year period. The result has class `Period` and prints with a `y` prefix to distinguish it from a Duration.

```r title="Load lubridate and build a year period"
library(lubridate)

years(1)
#> [1] "1y 0m 0d 0H 0M 0S"

class(years(1))
#> [1] "Period"
#> attr(,"package")
#> [1] "lubridate"

years(c(1, 5, 10))
#> [1] "1y 0m 0d 0H 0M 0S"  "5y 0m 0d 0H 0M 0S"
#> [3] "10y 0m 0d 0H 0M 0S"
```

The "y" prefix confirms a Period, not a Duration. Periods track calendar units; Durations track exact seconds. For contract terms and anniversaries, Periods are what you want.

[TIP]
**`years()` and `year()` are different functions one letter apart.** Plural `years()` builds a Period for arithmetic; singular `year()` extracts the year integer from a date. Mixing them returns plausible but wrong results, so read the function name carefully every time.

## Six common patterns

### 1. Add N years to a date

```r title="Shift a date forward"
ymd("2024-01-15") + years(1)
#> [1] "2025-01-15"

ymd("2020-06-30") + years(4)
#> [1] "2024-06-30"
```

The result is a Date that respects calendar boundaries. The same month and day appear N years later. No leap-year logic is needed for non-Feb-29 starts because the calendar handles it.

### 2. Subtract N years from a date

```r title="Shift a date backward"
anchor <- ymd("2024-07-15")
anchor - years(10)
#> [1] "2014-07-15"

anchor + years(-10)
#> [1] "2014-07-15"
```

Both forms produce the same result. Negative values inside `years()` shift backwards, which helps when the offset comes from a column or variable that can carry either sign.

### 3. The leap-year rollover problem and the %m+% fix

```r title="Plus operator vs the rollover operator"
ymd("2024-02-29") + years(1)
#> [1] NA

ymd("2024-02-29") %m+% years(1)
#> [1] "2025-02-28"

ymd("2024-02-29") %m+% years(4)
#> [1] "2028-02-29"
```

Feb 29, 2024 plus one year would land on a non-existent Feb 29, 2025, so `+` returns `NA`. The `%m+%` operator rolls back to Feb 28. Adding `years(4)` lands on the next leap year, 2028, which has Feb 29 again.

### 4. Inside a dplyr pipeline

```r title="Add an anniversary column"
library(dplyr)

employees <- tibble(
  emp_id = 1:4,
  hire_date = ymd(c("2020-01-15", "2020-02-29", "2021-06-30", "2022-12-25"))
)

employees %>%
  mutate(five_year = hire_date %m+% years(5))
#> # A tibble: 4 x 3
#>   emp_id hire_date  five_year 
#>    <int> <date>     <date>    
#> 1      1 2020-01-15 2025-01-15
#> 2      2 2020-02-29 2025-02-28
#> 3      3 2021-06-30 2026-06-30
#> 4      4 2022-12-25 2027-12-25
```

A five-year anniversary column is a textbook use of `years()`. `%m+%` survives the leap-day hire on row 2 by rolling to 2025-02-28; plain `+ years(5)` would have returned `NA` there.

### 5. Generate an annual sequence

```r title="Ten consecutive years from an anchor"
start <- ymd("2024-01-15")
start %m+% years(0:9)
#>  [1] "2024-01-15" "2025-01-15" "2026-01-15" "2027-01-15"
#>  [5] "2028-01-15" "2029-01-15" "2030-01-15" "2031-01-15"
#>  [9] "2032-01-15" "2033-01-15"
```

`years(0:9)` builds a length-10 Period vector. Paired with `%m+%`, this is the one-line way to produce annual snapshots from an anchor. Cleaner than `seq.Date(start, by = "year", length.out = 10)` for ggplot2 facets or feature engineering.

### 6. Compute age in whole years

```r title="Age from date of birth"
dob <- ymd("1990-08-22")
ref <- ymd("2024-07-15")

interval(dob, ref) %/% years(1)
#> [1] 33
```

Integer division of an interval by `years(1)` returns whole years between two dates. This is the standard lubridate idiom for age, tenure, and contract length, and it rolls down on partial years.

[KEY INSIGHT]
**The choice between `+ years()` and `%m+% years()` is the choice between failing loudly and rolling silently.** Plain `+` returns `NA` on impossible dates (February 29 plus one year), which surfaces the issue. The `%m+%` operator rolls back to February 28, which keeps pipelines running but hides the leap-year edge case. Pick the one that matches how you want to learn about Feb-29 inputs in your data.

## years() vs dyears() vs year()

**Three calls that look almost identical do very different things in R.**

| Call | Returns | One-year shift behaviour |
|---|---|---|
| `x + years(1)` (Period) | Date or POSIXct | Same calendar day next year, NA on Feb 29 |
| `x + dyears(1)` (Duration) | POSIXct | Adds 365.25 * 86400 seconds (a quarter day adrift) |
| `year(x)` (extractor) | Integer | n/a, returns the year number of the input |

`years()` is the calendar-aware Period; `dyears()` is the fixed-length Duration. The two diverge over leap years: `years(4)` lands on the same calendar date, while `dyears(4)` lands one day earlier because 365.25-day chunks fall short of four calendar years on non-leap quartets.

```r title="Period vs Duration over a leap-year window"
start <- ymd_hms("2023-03-15 12:00:00")

start + years(1)
#> [1] "2024-03-15 12:00:00 UTC"

start + dyears(1)
#> [1] "2024-03-14 18:00:00 UTC"
```

The Period stays on March 15. The Duration drifts back six hours because 2024 is a leap year and 365.25 days is shorter than the calendar gap. Prefer `years()` for human-facing dates; prefer `dyears()` for elapsed-time measurements.

## Common pitfalls

**Pitfall 1: relying on `+ years(N)` for Feb-29 dates.** `ymd("2024-02-29") + years(1)` returns `NA`. Switch to `%m+% years(N)` or `add_with_rollback()` whenever the start date might be the leap day. Build that into the pipeline by default.

**Pitfall 2: confusing `years()` with `year()`.** `years(3)` builds a Period for arithmetic; `year(x)` extracts the year integer. The names differ by one letter and a typo silently produces wrong groupings rather than an error.

**Pitfall 3: treating one year as 365 days.** `years(1)` is a calendar year, not a 365-day chunk. For literal 365-day shifts use `days(365)`; mixing the two over a decade drifts by two or three days.

[NOTE]
**Coming from Python pandas?** The equivalent of `x %m+% years(3)` is `x + pd.DateOffset(years=3)` on a Timestamp, which rolls Feb 29 back to Feb 28 in non-leap target years. The `dyears()` analogue is `x + pd.Timedelta(days=365.25 * 3)`, but pandas does not separate Period and Duration as cleanly as lubridate.

## A practical workflow with years()

**Year-level shifts show up in three places: anniversary and renewal columns, age and tenure features, and decade-level cohort buckets.**

1. **Anniversary columns**: `mutate(anniv = hire_date %m+% years(5))` produces five-year service dates that survive Feb 29 hires.
2. **Age and tenure**: `mutate(age = interval(dob, today()) %/% years(1))` is the canonical age formula in tidyverse pipelines.
3. **Decade buckets**: `mutate(decade = floor_date(event_date, "10 years"))` collapses dates into their decade for long-horizon comparisons.

```r title="Age and decade features in one pipeline"
people <- tibble(
  person_id = 1:4,
  dob = ymd(c("1985-03-12", "1990-08-22", "1976-11-30", "2001-01-05"))
)

people %>%
  mutate(
    age = interval(dob, ymd("2024-07-15")) %/% years(1),
    decade_born = floor_date(dob, "10 years")
  )
#> # A tibble: 4 x 4
#>   person_id dob          age decade_born
#>       <int> <date>     <int> <date>     
#> 1         1 1985-03-12    39 1980-01-01 
#> 2         2 1990-08-22    33 1990-01-01 
#> 3         3 1976-11-30    47 1970-01-01 
#> 4         4 2001-01-05    23 2000-01-01
```

`age` returns whole years rounded down. `decade_born` snaps the birth date to the start of its decade, the right granularity for cohort analysis.

## Try it yourself

**Try it:** Take the `employees` tibble from pattern 4 and add a `ten_year` column that is 10 calendar years after `hire_date`. Save the result to `ex_ten_year`.

```r title="Your turn: add a 10-year anniversary column"
# Try it: add 10-year anniversary
ex_ten_year <- # your code here

ex_ten_year
#> Expected: 4 rows with ten_year 10 years after hire_date
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ten_year <- employees %>%
  mutate(ten_year = hire_date %m+% years(10))

ex_ten_year
#> # A tibble: 4 x 3
#>   emp_id hire_date  ten_year  
#>    <int> <date>     <date>    
#> 1      1 2020-01-15 2030-01-15
#> 2      2 2020-02-29 2030-02-28
#> 3      3 2021-06-30 2031-06-30
#> 4      4 2022-12-25 2032-12-25
```

**Explanation:** `hire_date %m+% years(10)` shifts each date forward ten calendar years and rolls back to February 28 when the target year is not a leap year. Row 2 lands on 2030-02-28 because 2030 is not a leap year; rollover only triggers on Feb 29 starts.

</details>

## Related lubridate functions

After mastering years(), look at:

- `days()`, `weeks()`, `months()`: build Periods for other calendar units
- `dyears()`, `dweeks()`, `ddays()`: same N-unit shifts as exact-seconds Durations
- `%m+%`, `%m-%`, `add_with_rollback()`: Feb-29 safe arithmetic
- `year()`: extract the year integer from a date
- `floor_date()`, `ceiling_date()`: snap a date to a year, decade, or century boundary
- `interval()`, `%within%`: model a span from start to end, not an offset
- `today()`, `now()`: anchor expressions like `today() %m+% years(-1)` for trailing windows

For the official reference, see the [lubridate period documentation](https://lubridate.tidyverse.org/reference/period.html).

## FAQ

**How do I add years to a date in R?**

Use `lubridate::years()` with the `%m+%` operator: `ymd("2024-01-15") %m+% years(5)` returns `"2029-01-15"`. Plain `+ years(5)` works for most dates, but returns `NA` on February 29 inputs because the target year may not have a Feb 29. Defaulting to `%m+%` makes pipelines robust without changing the result on safe dates.

**Why does ymd("2024-02-29") + years(1) return NA in R?**

`years(1)` shifts the date forward one calendar year, which lands on February 29, 2025, a non-existent date. The plus operator returns `NA` rather than silently rolling to February 28. To roll back to the last valid day of February in the target year, use the `%m+%` operator: `ymd("2024-02-29") %m+% years(1)` returns `"2025-02-28"`.

**What is the difference between years() and dyears() in lubridate?**

`years()` builds a Period of N calendar years; `dyears()` builds a Duration of N * 365.25 * 86400 seconds. Periods track calendar units, so `x + years(1)` lands on the same month and day next year. Durations track exact seconds, so `x + dyears(1)` drifts by a quarter day around leap years. Use `years()` for human-facing dates and `dyears()` for elapsed-time calculations.

**How do I calculate age in years from date of birth in R?**

Use the interval-and-divide idiom: `interval(dob, today()) %/% years(1)`. This returns the number of whole calendar years between the date of birth and today, rounded down. The integer division is critical; `interval(dob, today()) / years(1)` returns a fractional year, which is rarely what age formulas want.

**How do I subtract years from a date in R?**

Use the `%m-%` operator for safety: `ymd("2024-02-29") %m-% years(1)` returns `"2023-02-28"`. The minus operator (without `%m...%`) also works, but returns `NA` on Feb 29 starts when the target year has no Feb 29. A negative argument works too: `ymd("2024-07-15") %m+% years(-3)` returns `"2021-07-15"`.
