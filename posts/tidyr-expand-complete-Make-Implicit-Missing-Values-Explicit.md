---
title: "tidyr expand() & complete() in R: Make Implicit Missing Values Explicit"
slug: "tidyr-expand-complete-Make-Implicit-Missing-Values-Explicit"
description: "Learn tidyr expand() and complete() in R to turn implicit missing values into explicit NAs. Fill date gaps, build panel combinations, replace with fill list."
keywords: "tidyr expand, tidyr complete, implicit missing values R, fill missing dates R, tidyr nesting, expand grid tidyr, tidyr fill argument, panel data R"
auto_link_terms: "tidyr expand and complete|implicit missing values|make missing values explicit|filling missing combinations|complete() function tidyr|expand() function tidyr"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-tidy-2"
post_type: "FR"
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
---

# tidyr expand() & complete() in R: Make Implicit Missing Values Explicit

<p class="lead">Sometimes your data hides rows that should be there but aren't — a month with zero sales, a panel subject who skipped a visit, a date with no trades. These are implicit missing values, and they break plots, models, and joins silently. tidyr's <code>expand()</code> and <code>complete()</code> drag those gaps into the open as explicit NAs you can then fill.</p>

## Why should you care about implicit missing values?

Picture a small sales table: three products, three months, but only five rows because some products didn't sell in some months. Nothing looks wrong until you plot monthly totals and a whole column is missing. Rows that should exist but don't are called implicit missing values. `complete()` turns them into real rows you can see and handle — here's the one-liner that does it.

```r
library(dplyr)
library(tidyr)

sales <- tibble(
  month   = c("Jan", "Jan", "Feb", "Mar", "Mar"),
  product = c("A",   "B",   "A",   "B",   "C"),
  units   = c(10,    5,     12,    6,     8)
)

sales |> complete(month, product)
#> # A tibble: 9 × 3
#>   month product units
#>   <chr> <chr>   <dbl>
#> 1 Feb   A          12
#> 2 Feb   B          NA
#> 3 Feb   C          NA
#> 4 Jan   A          10
#> 5 Jan   B           5
#> 6 Jan   C          NA
#> 7 Mar   A          NA
#> 8 Mar   B           6
#> 9 Mar   C           8
```

Five rows went in, nine rows came out. The four new rows carry NA in the `units` column — those are the combinations that were missing entirely from the raw data. You can now spot them, fill them, or count them. Before `complete()` they were invisible.

[KEY INSIGHT]
**Implicit and explicit missing values are both missing, but only one is visible.** An explicit NA is a row that exists with a missing value; an implicit miss is a row that doesn't exist at all — and the second kind silently corrupts every downstream calculation.

**Try it:** Build a 4-row tibble with three cities across two days (one city is missing on one day), then use `complete()` to make every city-day pair appear.

```r
# Try it: complete city × day combinations
temps <- tibble(
  city = c("Paris", "Paris", "Rome", "Tokyo"),
  day  = c("Mon",   "Tue",   "Mon",  "Tue"),
  temp = c(14,      16,      20,     22)
)

# Your code here:
temps
#> Expected: 6 rows, with NA temps for Rome/Tue and Tokyo/Mon
```

<details>
<summary>Click to reveal solution</summary>

```r
temps |> complete(city, day)
#> # A tibble: 6 × 3
#>   city  day    temp
#>   <chr> <chr> <dbl>
#> 1 Paris Mon      14
#> 2 Paris Tue      16
#> 3 Rome  Mon      20
#> 4 Rome  Tue      NA
#> 5 Tokyo Mon      NA
#> 6 Tokyo Tue      22
```

**Explanation:** `complete(city, day)` asks tidyr for every unique city crossed with every unique day, keeps existing temperatures, and fills the rest with NA.

</details>

## How does expand() build all combinations?

Before fixing implicit misses, it helps to see them. `expand()` is the inspection tool: given a data frame and a set of columns, it returns every unique combination of those columns — and *only* those columns. The row count of the result has nothing to do with the row count of the input.

```r
sales |> expand(month, product)
#> # A tibble: 9 × 2
#>   month product
#>   <chr> <chr>
#> 1 Feb   A
#> 2 Feb   B
#> 3 Feb   C
#> 4 Jan   A
#> 5 Jan   B
#> 6 Jan   C
#> 7 Mar   A
#> 8 Mar   B
#> 9 Mar   C
```

Notice the `units` column is gone — `expand()` returns the grid alone, not your data joined to it. Use this when you want a clean scaffold you can compare against the original. Think of it as the "what should exist" blueprint.

If you want to build a grid from bare vectors — without any data frame involved — reach for `crossing()`. It's `expand()`'s standalone sibling and accepts named arguments directly.

```r
crossing(
  month   = c("Jan", "Feb", "Mar"),
  product = c("A",   "B",   "C")
)
#> # A tibble: 9 × 2
#>   month product
#>   <chr> <chr>
#> 1 Feb   A
#> 2 Feb   B
#> 3 Feb   C
#> 4 Jan   A
#> 5 Jan   B
#> 6 Jan   C
#> 7 Mar   A
#> 8 Mar   B
#> 9 Mar   C
```

Same nine rows, but `crossing()` never touches the `sales` tibble. This matters when you want the full expected universe of values regardless of what the data contains — for example, every month in a fiscal year whether or not sales were logged.

[NOTE]
**expand() reads columns from the data; crossing() takes bare vectors.** Use `expand()` when the data is authoritative ("all months that appear"); use `crossing()` when you know the universe externally ("all 12 months of the fiscal year").

**Try it:** Use `expand(sales, month, product)` together with `anti_join(sales)` to list exactly which (month, product) pairs are missing from the raw data.

```r
# Try it: find missing combinations
# Hint: expand() gives all pairs, anti_join drops the ones that already exist.

# Your code here:

#> Expected: 4 rows — (Feb, B), (Feb, C), (Jan, C), (Mar, A)
```

<details>
<summary>Click to reveal solution</summary>

```r
sales |>
  expand(month, product) |>
  anti_join(sales, by = c("month", "product"))
#> # A tibble: 4 × 2
#>   month product
#>   <chr> <chr>
#> 1 Feb   B
#> 2 Feb   C
#> 3 Jan   C
#> 4 Mar   A
```

**Explanation:** `expand()` lists every expected pair; `anti_join()` keeps only the expected pairs that don't appear in the original data.

</details>

## How does complete() fill missing combinations?

`complete()` is `expand()` plus `dplyr::full_join()` plus `tidyr::replace_na()` rolled into one call. You give it the columns to expand and it returns your original data with missing combinations inserted and optional default values filled in.

The `fill` argument takes a named list. Each name is a column; each value is what NAs in that column should become for the newly created rows.

```r
sales |> complete(month, product, fill = list(units = 0))
#> # A tibble: 9 × 3
#>   month product units
#>   <chr> <chr>   <dbl>
#> 1 Feb   A          12
#> 2 Feb   B           0
#> 3 Feb   C           0
#> 4 Jan   A          10
#> 5 Jan   B           5
#> 6 Jan   C           0
#> 7 Mar   A           0
#> 8 Mar   B           6
#> 9 Mar   C           8
```

Same nine rows as before, but now the previously-NA `units` are zero — the right default when "no sale" means "zero units sold." You can pass several columns at once: `fill = list(units = 0, revenue = 0, discount = 0)`.

What if the raw data already contains a real NA that you want to preserve — say, a genuinely unknown sale? By default `complete()` replaces it along with the new NAs. Set `explicit = FALSE` (tidyr 1.2+) and the fill list only touches the rows `complete()` just added.

```r
sales_na <- tibble(
  month   = c("Jan", "Jan", "Feb"),
  product = c("A",   "B",   "A"),
  units   = c(10,    NA,    12)   # Jan/B is a real unknown
)

sales_na |> complete(month, product, fill = list(units = 0), explicit = FALSE)
#> # A tibble: 4 × 3
#>   month product units
#>   <chr> <chr>   <dbl>
#> 1 Feb   A          12
#> 2 Feb   B           0
#> 3 Jan   A          10
#> 4 Jan   B          NA
```

Jan/B keeps its original NA because the row already existed in the data. Only Feb/B — a brand-new row — gets the default zero. This distinction matters when "we don't know" and "definitely zero" mean different things in your analysis.

[TIP]
**Default the fill value to whatever "no observation" means in your domain.** Zero for counts and revenue, previous value for prices (chain `tidyr::fill()` after `complete()`), domain mean for survey responses. The wrong default silently biases every aggregate that follows.

**Try it:** A `grades` tibble has four rows across three students and two exams but one pair is missing. Use `complete()` with `fill = list(score = 0)` so every student has every exam.

```r
# Try it: fill missing student-exam pairs with 0
grades <- tibble(
  student = c("Ann", "Ann", "Ben", "Cam"),
  exam    = c("E1",  "E2",  "E1",  "E2"),
  score   = c(85,    90,    72,    88)
)

# Your code here:

#> Expected: 6 rows, Ben/E2 and Cam/E1 both showing score = 0
```

<details>
<summary>Click to reveal solution</summary>

```r
grades |> complete(student, exam, fill = list(score = 0))
#> # A tibble: 6 × 3
#>   student exam  score
#>   <chr>   <chr> <dbl>
#> 1 Ann     E1       85
#> 2 Ann     E2       90
#> 3 Ben     E1       72
#> 4 Ben     E2        0
#> 5 Cam     E1        0
#> 6 Cam     E2       88
```

**Explanation:** `complete(student, exam)` builds every student-exam pair; the fill list replaces the NAs in the two newly added rows with zero.

</details>

## How do you fill missing dates in a time series?

The most common real-world use of `complete()` is filling date gaps. Your data might log daily sales, website visits, or sensor readings — but on days with no activity, no row gets written. `complete()` plus `seq.Date()` rebuilds the full calendar.

Pass the date sequence as a **named argument** to `complete()`. The name is the column; the value is the full range of values you want to see.

```r
visits <- tibble(
  visit_date  = as.Date(c("2026-03-01", "2026-03-02", "2026-03-04",
                          "2026-03-05", "2026-03-07")),
  visit_count = c(12, 15, 9, 14, 20)
)

visits |>
  complete(visit_date = seq.Date(min(visit_date), max(visit_date), by = "day"))
#> # A tibble: 7 × 2
#>   visit_date visit_count
#>   <date>           <dbl>
#> 1 2026-03-01          12
#> 2 2026-03-02          15
#> 3 2026-03-03          NA
#> 4 2026-03-04           9
#> 5 2026-03-05          14
#> 6 2026-03-06          NA
#> 7 2026-03-07          20
```

The two missing days (March 3 and March 6) now appear as proper rows with NA visit counts. A downstream plot will draw gaps where there were gaps; a forecasting model can now see that the time series is regular.

A common next step is to carry the last observation forward. `tidyr::fill()` handles that — the `.direction = "down"` argument says "copy the previous non-NA value downward."

```r
visits |>
  complete(visit_date = seq.Date(min(visit_date), max(visit_date), by = "day")) |>
  tidyr::fill(visit_count, .direction = "down")
#> # A tibble: 7 × 2
#>   visit_date visit_count
#>   <date>           <dbl>
#> 1 2026-03-01          12
#> 2 2026-03-02          15
#> 3 2026-03-03          15
#> 4 2026-03-04           9
#> 5 2026-03-05          14
#> 6 2026-03-06          14
#> 7 2026-03-07          20
```

March 3 inherits March 2's count; March 6 inherits March 5's. That's last-observation-carried-forward, the workhorse of time-series imputation when "no data" really means "no change reported."

[WARNING]
**seq.Date() needs real Date objects, not strings.** If `visit_date` is character, `complete()` will error out with a type mismatch. Wrap it with `as.Date()` first or parse it with `lubridate::ymd()`.

**Try it:** A 4-row `prices` tibble logs the closing price on four days between March 1 and March 5 (March 3 is missing). Fill the calendar so every day between the min and max appears.

```r
# Try it: complete the date range
prices <- tibble(
  date  = as.Date(c("2026-03-01", "2026-03-02", "2026-03-04", "2026-03-05")),
  price = c(100, 102, 105, 104)
)

# Your code here:

#> Expected: 5 rows, March 3 showing NA price
```

<details>
<summary>Click to reveal solution</summary>

```r
prices |>
  complete(date = seq.Date(min(date), max(date), by = "day"))
#> # A tibble: 5 × 2
#>   date       price
#>   <date>     <dbl>
#> 1 2026-03-01   100
#> 2 2026-03-02   102
#> 3 2026-03-03    NA
#> 4 2026-03-04   105
#> 5 2026-03-05   104
```

**Explanation:** Passing `date = seq.Date(...)` as a named argument tells `complete()` the exact set of dates to expand to, regardless of what the data contains.

</details>

## When should you use nesting() instead?

Sometimes two columns describe the same entity — a `patient_id` and their `diagnosis`, a `product_code` and its `category`, an `employee` and their `department`. These columns are linked, not independent, so you never want to mix one patient with another patient's diagnosis. That's exactly what raw `complete()` would do.

`nesting()` tells tidyr: "treat these columns as a unit — only the combinations that already appear together in the data are valid."

```r
panel <- tibble(
  patient_id = c(1,      1,      2,      2,      3),
  diagnosis  = c("flu",  "flu",  "covid","covid","flu"),
  visit      = c("V1",   "V2",   "V1",   "V2",   "V1"),
  score      = c(7,      8,      5,      6,      9)
)

# Wrong: every patient crossed with every diagnosis
panel |> complete(patient_id, diagnosis, visit)
#> # A tibble: 12 × 4
#>    patient_id diagnosis visit score
#>         <dbl> <chr>     <chr> <dbl>
#>  1          1 covid     V1       NA    <-- patient 1 never had covid!
#>  2          1 covid     V2       NA
#>  3          1 flu       V1        7
#>  # ... 9 more rows

# Right: keep (patient_id, diagnosis) pairs intact
panel |> complete(nesting(patient_id, diagnosis), visit)
#> # A tibble: 6 × 4
#>   patient_id diagnosis visit score
#>        <dbl> <chr>     <chr> <dbl>
#> 1          1 flu       V1        7
#> 2          1 flu       V2        8
#> 3          2 covid     V1        5
#> 4          2 covid     V2        6
#> 5          3 flu       V1        9
#> 6          3 flu       V2       NA
```

Raw `complete()` produced 12 nonsense rows that paired every patient with every diagnosis — including diagnoses they never had. `complete(nesting(patient_id, diagnosis), visit)` keeps each `(patient_id, diagnosis)` pair exactly as it appeared and crosses it with every visit. The only new row is patient 3's V2, which is genuinely missing.

[KEY INSIGHT]
**nesting() preserves linked variables while expanding everything else.** Any time two columns describe the same entity — id and name, product and category, subject and cohort — wrap them in `nesting()` so tidyr treats them as a single unit.

**Try it:** An `hours` tibble logs how many hours each employee worked per month. Each employee belongs to exactly one department. Use `complete(nesting(employee, department), month, fill = list(hours = 0))` so every employee has every month, without mixing departments.

```r
# Try it: panel with linked columns
hours <- tibble(
  employee   = c("Ada", "Ada", "Ben", "Cam"),
  department = c("Eng", "Eng", "Ops", "Eng"),
  month      = c("Jan", "Feb", "Jan", "Feb"),
  hours      = c(160,   150,   170,   155)
)

# Your code here:

#> Expected: 6 rows, (Ada, Eng) and (Ben, Ops) and (Cam, Eng) each × 2 months
```

<details>
<summary>Click to reveal solution</summary>

```r
hours |> complete(nesting(employee, department), month, fill = list(hours = 0))
#> # A tibble: 6 × 4
#>   employee department month hours
#>   <chr>    <chr>      <chr> <dbl>
#> 1 Ada      Eng        Feb     150
#> 2 Ada      Eng        Jan     160
#> 3 Ben      Ops        Feb       0
#> 4 Ben      Ops        Jan     170
#> 5 Cam      Eng        Feb     155
#> 6 Cam      Eng        Jan       0
```

**Explanation:** `nesting(employee, department)` keeps each employee tied to their real department. The result has the three real employees crossed with two months, and the two genuinely missing rows fill to zero.

</details>

## How do expand() and complete() work with groups?

When you apply `complete()` to a `group_by()`-ed tibble, it completes each group independently. That's exactly what you want for multi-site panels: every clinic, store, or region gets its own complete grid without cross-pollination.

```r
regional_sales <- tibble(
  region  = c("North", "North", "North", "South", "South"),
  product = c("A",     "B",     "A",     "A",     "B"),
  month   = c("Jan",   "Jan",   "Feb",   "Jan",   "Feb"),
  units   = c(10,      5,       12,      8,       6)
)

regional_sales |>
  group_by(region) |>
  complete(product, month, fill = list(units = 0)) |>
  ungroup()
#> # A tibble: 8 × 4
#>   region product month units
#>   <chr>  <chr>   <chr> <dbl>
#> 1 North  A       Feb      12
#> 2 North  A       Jan      10
#> 3 North  B       Feb       0
#> 4 North  B       Jan       5
#> 5 South  A       Feb       0
#> 6 South  A       Jan       8
#> 7 South  B       Feb       6
#> 8 South  B       Jan       0
```

North has all four `product × month` pairs, and so does South — each region independently. The grouping column `region` isn't expanded (you can't `complete()` a grouping column; tidyr will error if you try), which is the safe default.

[NOTE]
**group_by() + complete() is ideal for multi-site panels.** Each site gets its own complete grid with no cross-pollination. Remember to `ungroup()` afterwards unless downstream steps also need grouping.

**Try it:** A `clinic_visits` tibble logs visits per clinic per date. Group by clinic and complete the date range so every clinic has every day between its min and max.

```r
# Try it: per-clinic date completion
clinic_visits <- tibble(
  clinic = c("A", "A", "A", "B", "B"),
  date   = as.Date(c("2026-03-01", "2026-03-02", "2026-03-04",
                     "2026-03-01", "2026-03-03")),
  count  = c(12, 15, 9, 20, 18)
)

# Your code here:

#> Expected: each clinic's own day-by-day range filled with NAs where missing
```

<details>
<summary>Click to reveal solution</summary>

```r
clinic_visits |>
  group_by(clinic) |>
  complete(date = seq.Date(min(date), max(date), by = "day")) |>
  ungroup()
#> # A tibble: 7 × 3
#>   clinic date       count
#>   <chr>  <date>     <dbl>
#> 1 A      2026-03-01    12
#> 2 A      2026-03-02    15
#> 3 A      2026-03-03    NA
#> 4 A      2026-03-04     9
#> 5 B      2026-03-01    20
#> 6 B      2026-03-02    NA
#> 7 B      2026-03-03    18
```

**Explanation:** Inside each group, `min(date)` and `max(date)` are computed on that group's rows only, so each clinic gets its own tightly-fit calendar.

</details>

## Practice Exercises

Two capstone problems that combine several tools from this tutorial. The variable names start with `my_` so they don't collide with the tutorial's tibbles.

### Exercise 1: Fill a stock price panel

You have daily close prices for two tickers across five business days, but a few rows are missing. Produce a filled panel where every ticker has every date and any missing closes are carried forward from the previous day.

```r
my_stocks <- tibble(
  ticker = c("AAPL", "AAPL", "AAPL", "MSFT", "MSFT", "MSFT"),
  date   = as.Date(c("2026-03-02", "2026-03-03", "2026-03-06",
                     "2026-03-02", "2026-03-04", "2026-03-05")),
  close  = c(180,    182,    185,    405,    410,    412)
)

# Write your code below:

#> Expected: 10 rows (2 tickers × 5 dates), no NAs in close after carry-forward
```

<details>
<summary>Click to reveal solution</summary>

```r
my_stocks |>
  group_by(ticker) |>
  complete(date = seq.Date(as.Date("2026-03-02"), as.Date("2026-03-06"), by = "day")) |>
  tidyr::fill(close, .direction = "down") |>
  ungroup()
#> # A tibble: 10 × 3
#>    ticker date       close
#>    <chr>  <date>     <dbl>
#>  1 AAPL   2026-03-02   180
#>  2 AAPL   2026-03-03   182
#>  3 AAPL   2026-03-04   182
#>  4 AAPL   2026-03-05   182
#>  5 AAPL   2026-03-06   185
#>  6 MSFT   2026-03-02   405
#>  7 MSFT   2026-03-03   405
#>  8 MSFT   2026-03-04   410
#>  9 MSFT   2026-03-05   412
#> 10 MSFT   2026-03-06   412
```

**Explanation:** Group by ticker so each ticker expands independently, supply an explicit five-day sequence as the target range, then chain `fill()` to copy the last observed close forward over the NAs `complete()` inserted.

</details>

### Exercise 2: Find missing student-exam pairs without adding rows

Given a grades tibble that's incomplete, return a data frame listing only the `(student, exam)` pairs where no grade exists — without touching the original.

```r
my_grades <- tibble(
  student = c("Ada", "Ada", "Ben", "Cam", "Cam"),
  exam    = c("Mid", "Fin", "Mid", "Mid", "Fin"),
  score   = c(85,    88,    72,    79,    81)
)

# Write your code below:

#> Expected: 1 row — (Ben, Fin)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_grades |>
  expand(student, exam) |>
  anti_join(my_grades, by = c("student", "exam"))
#> # A tibble: 1 × 2
#>   student exam
#>   <chr>   <chr>
#> 1 Ben     Fin
```

**Explanation:** `expand()` gives every expected student-exam pair; `anti_join()` keeps only the pairs that don't appear in the original data. No rows are added to `my_grades` itself.

</details>

## Complete Example

Here is an end-to-end pipeline that ties everything together. The raw `regional_sales_raw` tibble has gaps across regions, products, and months. The goal is per-region monthly totals — and those totals will be wrong unless every region has a row for every product in every month.

```r
regional_sales_raw <- tibble(
  region  = c("North","North","North","North","South","South","South"),
  month   = c("Jan",  "Jan",  "Feb",  "Mar",  "Jan",  "Feb",  "Mar"),
  product = c("A",    "B",    "A",    "B",    "A",    "B",    "A"),
  units   = c(10,     5,      12,     6,      8,      9,      7)
)

regional_sales_full <- regional_sales_raw |>
  group_by(region) |>
  complete(product, month, fill = list(units = 0)) |>
  ungroup()

regional_sales_full |>
  group_by(region, month) |>
  summarise(total_units = sum(units), .groups = "drop")
#> # A tibble: 6 × 3
#>   region month total_units
#>   <chr>  <chr>       <dbl>
#> 1 North  Feb            12
#> 2 North  Jan            15
#> 3 North  Mar             6
#> 4 South  Feb             9
#> 5 South  Jan             8
#> 6 South  Mar             7
```

Without the `complete()` step, North's March total would count only product B (six units) and omit product A entirely — even though the "correct" interpretation is that A sold zero units. After completion, the totals are consistent across regions, months, and products, and a downstream plot will show all three months for both regions without gaps in the x-axis.

## Summary

| Function | What it returns | When to use |
|---|---|---|
| `expand(df, x, y)` | Grid of all x × y combinations only | Inspect the full combination space or build a scaffold |
| `complete(df, x, y)` | Original rows + missing combos with NA | Turn implicit missing into explicit missing |
| `complete(..., fill = list())` | As above, NAs replaced with defaults | Fill with domain-appropriate defaults |
| `complete(nesting(x, y), z)` | Only existing `(x, y)` pairs × z | Panel data with linked columns |
| `crossing(x, y)` | Grid from vectors (no data frame) | Build a scaffold from scratch |
| `full_seq(x, period)` | Full numeric sequence | Fill numeric gaps |

Key takeaways:

- Tidy data has a row for every combination that should exist — even if the measurement is NA.
- `complete()` equals `expand()` plus `dplyr::full_join()` plus `tidyr::replace_na()` in a single call.
- Use `nesting()` for columns that describe the same entity; pass raw arguments for genuinely independent columns.
- Pass sequences by name for dates (`seq.Date`) and numerics (`full_seq`) to expand to a known universe.
- `group_by() |> complete()` gives each group its own independent grid — ideal for multi-site panels.

![From raw data with gaps, expand() builds the full grid, complete() fills in explicit NAs, and a fill list replaces them with sensible defaults.](screenshots/tidyr-expand-complete-Make-Implicit-Missing-Values-Explicit-progression.webp)

*Figure 1: From raw data with gaps, expand() builds the full grid, complete() fills in explicit NAs, and a fill list replaces them with sensible defaults.*

## References

1. tidyr documentation — `complete()`. [Link](https://tidyr.tidyverse.org/reference/complete.html)
2. tidyr documentation — `expand()` and `crossing()`. [Link](https://tidyr.tidyverse.org/reference/expand.html)
3. tidyr documentation — `full_seq()`. [Link](https://tidyr.tidyverse.org/reference/full_seq.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science (2e)*, Chapter 18: Missing values. [Link](https://r4ds.hadley.nz/missing-values.html)
5. tidyr 1.2.0 release notes — introduces the `explicit` argument. [Link](https://www.tidyverse.org/blog/2022/02/tidyr-1-2-0/)
6. tidyr documentation — `fill()` for carry-forward imputation. [Link](https://tidyr.tidyverse.org/reference/fill.html)

## Continue Learning

- [pivot_longer() and pivot_wider(): Reshape Data in R Without Losing Your Mind](pivot_longer-pivot_wider-Reshape-Data-in-R.html) — the parent reshaping guide that sets up why long data so often needs completing.
- [Missing Values in R: Detect, Count, Remove, and Impute NA](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) — once gaps are explicit NAs, learn how to count, visualise, and impute them.
- [tidyr separate() & unite() in R: Split & Combine Character Columns](tidyr-separate-unite-Split-Combine-Columns-in-R.html) — the sibling tidyr helper pair for splitting and rejoining character columns.
