---
title: "tidyr expand() & complete() in R: Make Implicit Missing Values Explicit"
slug: "tidyr-expand-complete-Make-Implicit-Missing-Values-Explicit"
description: "Learn how tidyr expand() generates all variable combinations and complete() fills missing rows with defaults. Practical R examples with before-and-after output."
keywords: "tidyr expand, tidyr complete, expand R, complete R, implicit missing values, crossing nesting tidyr, fill missing combinations R, expand_grid tidyr, make missing values explicit R"
auto_link_terms: "expand()|complete()|crossing()|nesting()|implicit missing values|tidyr expand|tidyr complete"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-tidy-2"
post_type: "FR"
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
---

<nav class="breadcrumb-nav">Home &gt; Data Wrangling &gt; tidyr &gt; tidyr expand() and complete()</nav>

# tidyr expand() & complete() in R: Make Implicit Missing Values Explicit

<p class="lead"><code>expand()</code> generates every combination of specified variables (including combinations absent from your data), and <code>complete()</code> does the same while filling new rows with default values — turning implicit missing values into explicit ones you can see and handle.</p>

## Introduction

Missing data comes in two forms. The first is the NA value you can see in a cell. The second is a row that simply does not exist. The second kind is invisible and far more dangerous.

Imagine a sales table with three products across four quarters. If product C had zero revenue in Q2, the row for that combination might just be absent. Your group-wise mean now divides by three instead of four, and the result is silently wrong.

The tidyr package provides `expand()` and `complete()` to tackle this problem. `expand()` builds the full grid of variable combinations so you can see what should exist. `complete()` goes further — it inserts the missing rows into your data and optionally fills them with default values.

Every code block on this page runs in your browser. Click Run on the first block to load the libraries, then work through the rest top to bottom. Variables carry over between blocks.

## What are implicit vs. explicit missing values?

An explicit missing value is an NA sitting in a cell you can see. An implicit missing value is a row that should exist but doesn't appear in the data at all. Both cause problems, but implicit missingness is harder to catch because nothing flags it.

Let's create a small sales dataset with some missing product-quarter combinations.

```r
library(tidyr)
library(dplyr)

sales <- tibble(
  product = c("A", "A", "A", "B", "B", "C", "C"),
  quarter = c("Q1", "Q2", "Q3", "Q1", "Q3", "Q1", "Q4"),
  revenue = c(120, 150, 90, 200, 180, 310, 275)
)
sales
#> # A tibble: 7 x 3
#>   product quarter revenue
#>   <chr>   <chr>     <dbl>
#> 1 A       Q1          120
#> 2 A       Q2          150
#> 3 A       Q3           90
#> 4 B       Q1          200
#> 5 B       Q3          180
#> 6 C       Q1          310
#> 7 C       Q4          275
```

There are 3 products and 4 quarters, so you'd expect 12 rows. Only 7 exist. The remaining 5 are implicit missing values — no row, no NA, no trace.

Now watch how this distorts a simple summary. The mean revenue per product should include those missing quarters as zeros (or NAs), but without the rows, the averages are inflated.

```r
sales |>
  group_by(product) |>
  summarise(
    quarters_present = n(),
    mean_revenue     = mean(revenue)
  )
#> # A tibble: 3 x 3
#>   product quarters_present mean_revenue
#>   <chr>              <int>        <dbl>
#> 1 A                      3          120
#> 2 B                      2          190
#> 3 C                      2          292
```

Product B shows a mean of 190 across 2 quarters, but it should reflect all 4 quarters. The summary is technically correct for the rows present, yet misleading for business decisions.

[KEY INSIGHT]
**Implicit missing values silently inflate averages and deflate counts.** If a row doesn't exist, aggregation functions skip it entirely. You must make these gaps explicit before summarizing.

## How does expand() generate all combinations?

`expand()` builds a tibble containing every unique combination of the columns you specify. It does not modify your original data — it returns a standalone grid showing what should exist.

Let's see the full product-quarter grid for our sales data.

```r
all_combos <- sales |>
  expand(product, quarter)
all_combos
#> # A tibble: 12 x 2
#>    product quarter
#>    <chr>   <chr>  
#>  1 A       Q1     
#>  2 A       Q2     
#>  3 A       Q3     
#>  4 A       Q4     
#>  5 B       Q1     
#>  6 B       Q2     
#>  7 B       Q3     
#>  8 B       Q4     
#>  9 C       Q1     
#> 10 C       Q2     
#> 11 C       Q3     
#> 12 C       Q4
```

`expand()` found 3 unique products and 4 unique quarters and produced every combination — 12 rows. This grid is the reference for what a complete dataset looks like.

You can pair `expand()` with `anti_join()` to identify exactly which combinations your data is missing.

```r
missing_combos <- all_combos |>
  anti_join(sales, by = c("product", "quarter"))
missing_combos
#> # A tibble: 5 x 2
#>   product quarter
#>   <chr>   <chr>  
#> 1 A       Q4     
#> 2 B       Q2     
#> 3 B       Q4     
#> 4 C       Q2     
#> 5 C       Q3
```

Five combinations are missing from `sales`. This audit pattern — expand then anti_join — is one of the most practical uses of `expand()`.

[TIP]
**Use expand() with anti_join() to audit your data for gaps.** Before any analysis, run this two-step check to see exactly which rows are missing.

## How do crossing() and nesting() differ?

`crossing()` and `nesting()` are standalone helper functions that build combination grids without needing a data frame. The difference is fundamental: `crossing()` produces the full cartesian product, while `nesting()` returns only combinations that already exist together.

Let's compare them side by side using vectors pulled from our sales data.

```r
cross_result <- crossing(
  product = unique(sales$product),
  quarter = unique(sales$quarter)
)
nrow(cross_result)
#> [1] 12

nest_result <- nesting(
  product = sales$product,
  quarter = sales$quarter
)
nrow(nest_result)
#> [1] 7
```

`crossing()` gives 12 rows (all possible pairs). `nesting()` gives 7 rows (only the pairs already present in the data). Think of `crossing()` as "what could exist" and `nesting()` as "what does exist."

You can mix them inside `expand()`. This is useful when some variable relationships are fixed (should be nested) and others should be crossed.

```r
stores <- tibble(
  store   = c("NYC", "NYC", "LA", "LA"),
  region  = c("East", "East", "West", "West"),
  product = c("A", "B", "A", "C")
)

mixed_expand <- stores |>
  expand(nesting(store, region), product)
mixed_expand
#> # A tibble: 6 x 3
#>   store region product
#>   <chr> <chr>  <chr>  
#> 1 LA    West   A      
#> 2 LA    West   B      
#> 3 LA    West   C      
#> 4 NYC   East   A      
#> 5 NYC   East   B      
#> 6 NYC   East   C
```

`nesting(store, region)` preserves the real store-region pairs (NYC is always East, LA is always West). Those nested pairs are then crossed with every product. Without `nesting()`, you would get invalid combinations like NYC-West.

[KEY INSIGHT]
**nesting() preserves real relationships; crossing() generates theoretical ones.** Use nesting() for columns that belong together (store + region) and crossing() for columns that should combine freely (product x quarter).

## How does complete() fill in missing rows?

`complete()` combines three operations in one call: it expands the variable grid, joins it back to your data, and optionally replaces NAs. It is the workhorse for making implicit missing values explicit.

Let's apply it to our sales data.

```r
sales_complete <- sales |>
  complete(product, quarter)
sales_complete
#> # A tibble: 12 x 3
#>    product quarter revenue
#>    <chr>   <chr>     <dbl>
#>  1 A       Q1          120
#>  2 A       Q2          150
#>  3 A       Q3           90
#>  4 A       Q4           NA
#>  5 B       Q1          200
#>  6 B       Q2           NA
#>  7 B       Q3          180
#>  8 B       Q4           NA
#>  9 C       Q1          310
#> 10 C       Q2           NA
#> 11 C       Q3           NA
#> 12 C       Q4          275
```

Now all 12 rows exist. The 5 previously missing combinations appear with NA revenue. You can see and handle these gaps explicitly.

For many analyses, NA is not the right default. You can use the `fill` parameter to specify a default value per column.

```r
sales_filled <- sales |>
  complete(product, quarter, fill = list(revenue = 0))
sales_filled
#> # A tibble: 12 x 3
#>    product quarter revenue
#>    <chr>   <chr>     <dbl>
#>  1 A       Q1          120
#>  2 A       Q2          150
#>  3 A       Q3           90
#>  4 A       Q4            0
#>  5 B       Q1          200
#>  6 B       Q2            0
#>  7 B       Q3          180
#>  8 B       Q4            0
#>  9 C       Q1          310
#> 10 C       Q2            0
#> 11 C       Q3            0
#> 12 C       Q4          275
```

Now the missing quarters show 0 revenue instead of NA. This is appropriate when absence means "no sales" rather than "unknown."

There is an important subtlety: by default, `fill` replaces both new (implicit) and pre-existing (explicit) NAs. If your original data already has NA values that mean "unknown" and you only want to fill the newly created rows, set `explicit = FALSE`.

```r
sales_with_na <- tibble(
  product = c("A", "A", "B"),
  quarter = c("Q1", "Q2", "Q1"),
  revenue = c(120, NA, 200)
)

sales_explicit <- sales_with_na |>
  complete(product, quarter, fill = list(revenue = 0), explicit = FALSE)
sales_explicit
#> # A tibble: 4 x 3
#>   product quarter revenue
#>   <chr>   <chr>     <dbl>
#> 1 A       Q1          120
#> 2 A       Q2           NA
#> 3 B       Q1          200
#> 4 B       Q2            0
```

Product A in Q2 already had an explicit NA, so it stays NA. Product B in Q2 was an implicit missing row, so it gets filled with 0. The `explicit = FALSE` flag protects your original missing values.

[WARNING]
**By default, fill replaces ALL NAs — both new and pre-existing.** If your original NAs mean "unknown" (not "zero"), set `explicit = FALSE`. That fills only the newly created rows.

## How do you complete time series with full_seq()?

When your data has dates or continuous numeric values, `expand()` and `complete()` only use the values already present. If dates 2026-01-01 and 2026-01-05 exist, the three days in between won't appear. The `full_seq()` helper generates a regular sequence from the min to the max.

Let's create a dataset with daily measurements that has gaps.

```r
daily_data <- tibble(
  date    = as.Date(c("2026-01-01", "2026-01-03", "2026-01-06", "2026-01-07")),
  reading = c(10.2, 11.5, 9.8, 12.1)
)

daily_complete <- daily_data |>
  complete(date = full_seq(date, period = 1))
daily_complete
#> # A tibble: 7 x 2
#>   date       reading
#>   <date>       <dbl>
#> 1 2026-01-01    10.2
#> 2 2026-01-02    NA  
#> 3 2026-01-03    11.5
#> 4 2026-01-04    NA  
#> 5 2026-01-05    NA  
#> 6 2026-01-06     9.8
#> 7 2026-01-07    12.1
```

`full_seq(date, period = 1)` generates every date from Jan 1 to Jan 7 with a 1-day step. The three missing dates now appear with NA readings.

For time series, you often want to carry forward the last known value instead of filling with a constant. Pair `complete()` with `fill()` to propagate values downward.

```r
daily_filled <- daily_data |>
  complete(date = full_seq(date, period = 1)) |>
  fill(reading, .direction = "down")
daily_filled
#> # A tibble: 7 x 2
#>   date       reading
#>   <date>       <dbl>
#> 1 2026-01-01    10.2
#> 2 2026-01-02    10.2
#> 3 2026-01-03    11.5
#> 4 2026-01-04    11.5
#> 5 2026-01-05    11.5
#> 6 2026-01-06     9.8
#> 7 2026-01-07    12.1
```

Jan 2 carries forward Jan 1's reading (10.2). Jan 4 and Jan 5 carry forward Jan 3's reading (11.5). This last-observation-carried-forward pattern is standard in time series work.

[TIP]
**Pair complete() with full_seq() and fill() for time series gap-filling.** Use `full_seq()` for the date grid, `complete()` to insert rows, and `fill()` to propagate last known values.

## How does complete() work with grouped data?

When you apply `complete()` to a grouped data frame (created with `group_by()`), it operates within each group independently. Each group gets its own set of completed combinations.

Let's say two stores carry different products. You want each store's data completed with all products that store carries.

```r
store_sales <- tibble(
  store   = c("NYC", "NYC", "NYC", "LA", "LA"),
  product = c("A", "B", "C", "A", "C"),
  quarter = c("Q1", "Q1", "Q1", "Q1", "Q1"),
  revenue = c(100, 150, 200, 300, 250)
)

store_complete <- store_sales |>
  group_by(store) |>
  complete(product, quarter = c("Q1", "Q2")) |>
  ungroup()
store_complete
#> # A tibble: 10 x 4
#>    store product quarter revenue
#>    <chr> <chr>   <chr>     <dbl>
#>  1 LA    A       Q1          300
#>  2 LA    A       Q2           NA
#>  3 LA    C       Q1          250
#>  4 LA    C       Q2           NA
#>  5 NYC   A       Q1          100
#>  6 NYC   A       Q2           NA
#>  7 NYC   B       Q1          150
#>  8 NYC   B       Q2           NA
#>  9 NYC   C       Q1          200
#> 10 NYC   C       Q2           NA
```

NYC gets combinations for products A, B, C (its products). LA gets combinations for products A and C (its products). The grouping keeps each store's product list separate.

[NOTE]
**You cannot complete a grouping column itself.** If `store` is the grouping variable, it cannot also appear inside `complete()`. Move it outside the group or use `ungroup()` first if you need to cross it with other columns.

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting that fill replaces existing NAs too

❌ **Wrong:**
```r
# Original data has NA meaning "unknown"
df <- tibble(x = c("a", "b"), y = c(1, NA))
df |> complete(x, fill = list(y = 0))
#> Both the unknown NA and the new row get filled with 0
```

**Why it is wrong:** The pre-existing NA in row 2 meant "we don't know this value," but `fill` overwrites it with 0. You lose the distinction between "missing" and "zero."

✅ **Correct:**
```r
df <- tibble(x = c("a", "b"), y = c(1, NA))
df |> complete(x, fill = list(y = 0), explicit = FALSE)
#> Only newly created rows get 0; original NA stays NA
```

### Mistake 2: Using expand() when you meant complete()

❌ **Wrong:**
```r
# Trying to fill gaps in your data
result <- sales |> expand(product, quarter)
# result has NO revenue column — just the grid
```

**Why it is wrong:** `expand()` returns only the combination grid. It does not bring along your data columns. You lose the revenue values entirely.

✅ **Correct:**
```r
result <- sales |> complete(product, quarter)
# result has all 12 rows WITH revenue (NA for missing combos)
```

### Mistake 3: Not using full_seq() for date gaps

❌ **Wrong:**
```r
# Dates: Jan 1 and Jan 5
date_data <- tibble(date = as.Date(c("2026-01-01", "2026-01-05")), val = c(10, 20))
date_data |> complete(date)
#> Only 2 rows — Jan 2, 3, 4 are still missing
```

**Why it is wrong:** `complete(date)` only uses the dates already present. It doesn't know about the gap between Jan 1 and Jan 5.

✅ **Correct:**
```r
date_data |> complete(date = full_seq(date, period = 1))
#> 5 rows — Jan 1 through Jan 5
```

### Mistake 4: Combinatorial explosion with high-cardinality columns

❌ **Wrong:**
```r
# 1000 customers x 500 products x 12 months = 6 million rows
big_data |> complete(customer_id, product_id, month)
```

**Why it is wrong:** Crossing three high-cardinality columns creates millions of rows, most of which are meaningless. Your R session may run out of memory.

✅ **Correct:**
```r
# Only complete within meaningful groups
big_data |>
  group_by(customer_id) |>
  complete(product_id, month)
```

## Practice Exercises

### Exercise 1: Find missing combinations with expand()

A school tracks test scores for 3 students across 4 subjects. Some student-subject combinations are missing. Use `expand()` and `anti_join()` to find which combinations are absent.

```r
# Exercise data
scores <- tibble(
  student = c("Ali", "Ali", "Ali", "Bo", "Bo", "Cal", "Cal", "Cal"),
  subject = c("Math", "English", "Science", "Math", "Science", "Math", "English", "History"),
  score   = c(85, 90, 78, 92, 88, 76, 82, 91)
)

# Find missing student-subject combinations
# Hint: pipe scores into expand(), then use anti_join()

```

<details>
<summary>Click to reveal solution</summary>

```r
all_expected <- scores |> expand(student, subject)
missing_scores <- all_expected |> anti_join(scores, by = c("student", "subject"))
missing_scores
#> # A tibble: 4 x 2
#>   student subject
#>   <chr>   <chr>  
#> 1 Ali     History
#> 2 Bo      English
#> 3 Bo      History
#> 4 Cal     Science
```

**Explanation:** `expand()` creates all 12 student-subject pairs (3 x 4). `anti_join()` filters to only those pairs not present in the original data, revealing the 4 missing combinations.

</details>

### Exercise 2: Complete with fill defaults

Using the `scores` data from Exercise 1, use `complete()` with `fill` to add the missing student-subject rows with a default score of 0.

```r
# Complete scores and fill missing with 0
# Hint: complete(student, subject, fill = list(...))

```

<details>
<summary>Click to reveal solution</summary>

```r
my_complete_scores <- scores |>
  complete(student, subject, fill = list(score = 0))
my_complete_scores
#> # A tibble: 12 x 3
#>    student subject score
#>    <chr>   <chr>   <dbl>
#>  1 Ali     English    90
#>  2 Ali     History     0
#>  3 Ali     Math       85
#>  4 Ali     Science    78
#>  5 Bo      English     0
#>  6 Bo      History     0
#>  7 Bo      Math       92
#>  8 Bo      Science    88
#>  9 Cal     English    82
#> 10 Cal     History    91
#> 11 Cal     Math       76
#> 12 Cal     Science     0
```

**Explanation:** `complete()` expands the grid to all 12 combinations and `fill = list(score = 0)` sets the missing scores to 0 instead of NA.

</details>

### Exercise 3: Use nesting() to preserve relationships

A dataset tracks employees within departments. Use `nesting()` inside `complete()` so that employee-department pairs stay intact, while crossing them with all months.

```r
my_work <- tibble(
  dept     = c("Sales", "Sales", "Engineering", "Engineering"),
  employee = c("Dana", "Dana", "Eve", "Eve"),
  month    = c("Jan", "Mar", "Jan", "Feb"),
  hours    = c(160, 155, 170, 165)
)

# Complete so each employee has all 3 months, but don't create
# invalid dept-employee combos (e.g., Dana in Engineering)
# Hint: use nesting(dept, employee) inside complete()

```

<details>
<summary>Click to reveal solution</summary>

```r
my_work_complete <- my_work |>
  complete(nesting(dept, employee), month = c("Jan", "Feb", "Mar"), fill = list(hours = 0))
my_work_complete
#> # A tibble: 6 x 4
#>   dept        employee month hours
#>   <chr>       <chr>    <chr> <dbl>
#> 1 Engineering Eve      Jan     170
#> 2 Engineering Eve      Feb     165
#> 3 Engineering Eve      Mar       0
#> 4 Sales       Dana     Jan     160
#> 5 Sales       Dana     Feb       0
#> 6 Sales       Dana     Mar     155
```

**Explanation:** `nesting(dept, employee)` keeps the real pairs (Sales-Dana, Engineering-Eve). Those pairs are crossed with all 3 months. Without `nesting()`, you would get 12 rows including invalid combos like Sales-Eve.

</details>

### Exercise 4: Complete a date-gapped dataset

Daily temperature readings have gaps. Fill in the missing dates and carry forward the last known temperature.

```r
my_temps <- tibble(
  date = as.Date(c("2026-03-01", "2026-03-03", "2026-03-07")),
  temp = c(15.2, 16.8, 14.5)
)

# 1. Complete with full_seq() to fill date gaps
# 2. Use fill() to carry forward the last known temp
# Hint: pipe complete() into fill()

```

<details>
<summary>Click to reveal solution</summary>

```r
my_temps_filled <- my_temps |>
  complete(date = full_seq(date, period = 1)) |>
  fill(temp, .direction = "down")
my_temps_filled
#> # A tibble: 7 x 2
#>   date        temp
#>   <date>     <dbl>
#> 1 2026-03-01  15.2
#> 2 2026-03-02  15.2
#> 3 2026-03-03  16.8
#> 4 2026-03-04  16.8
#> 5 2026-03-05  16.8
#> 6 2026-03-06  16.8
#> 7 2026-03-07  14.5
```

**Explanation:** `full_seq(date, period = 1)` generates every date from Mar 1 to Mar 7. `complete()` adds the 4 missing dates with NA temps. `fill(.direction = "down")` carries the last known temperature forward into the gaps.

</details>

## Putting It All Together

Let's walk through a realistic scenario from start to finish. You have messy quarterly sales data with gaps, and you need accurate per-product summaries.

```r
raw_sales <- tibble(
  product = c("Widget", "Widget", "Widget", "Gadget", "Gadget", "Gizmo", "Gizmo", "Gizmo"),
  quarter = c("Q1", "Q2", "Q4", "Q1", "Q3", "Q1", "Q2", "Q3"),
  revenue = c(5000, 6200, 4800, 8100, 7500, 3200, 3800, 4100)
)

# Step 1: Audit — what's missing?
audit <- raw_sales |>
  expand(product, quarter) |>
  anti_join(raw_sales, by = c("product", "quarter"))
cat("Missing combinations:\n")
print(audit)
#> Missing combinations:
#> # A tibble: 4 x 2
#>   product quarter
#>   <chr>   <chr>  
#> 1 Gadget  Q2     
#> 2 Gadget  Q4     
#> 3 Gizmo   Q4     
#> 4 Widget  Q3

# Step 2: Fill gaps with zero revenue
clean_sales <- raw_sales |>
  complete(product, quarter, fill = list(revenue = 0))

# Step 3: Summarize correctly
summary_correct <- clean_sales |>
  group_by(product) |>
  summarise(
    total_revenue = sum(revenue),
    mean_revenue  = mean(revenue),
    quarters_sold = sum(revenue > 0)
  )
summary_correct
#> # A tibble: 3 x 4
#>   product total_revenue mean_revenue quarters_sold
#>   <chr>           <dbl>        <dbl>         <int>
#> 1 Gadget          15600        3900.             2
#> 2 Gizmo           11100        2775.             3
#> 3 Widget          16000        4000.             3
```

The audit reveals 4 missing combinations. After completing the data with zero-revenue rows, the mean revenue per product accounts for all 4 quarters. Gadget's mean drops from 7800 (2 quarters) to 3900 (4 quarters) — a significant correction.

## Summary

| Function | What it does | Returns | When to use |
|---|---|---|---|
| `expand()` | Generates all unique combinations of columns | Grid only (no data columns) | Auditing: "what combos should exist?" |
| `complete()` | Expands grid AND fills missing rows into your data | Full data frame with NAs or defaults | Fixing: "add the missing rows" |
| `crossing()` | Cartesian product of vectors (standalone) | Grid of all combos | Building reference grids outside a data frame |
| `nesting()` | Only combos already present (standalone) | Grid of existing combos | Preserving real relationships inside expand/complete |
| `full_seq()` | Regular sequence from min to max | Numeric or date vector | Filling gaps in dates or continuous values |

**Key takeaways:**

- Implicit missing values are rows that don't exist. They silently distort summaries.
- `expand()` shows you the full grid. Pair with `anti_join()` to audit.
- `complete()` inserts missing rows. Use `fill` for default values.
- Set `explicit = FALSE` to protect pre-existing NAs from being overwritten.
- Use `full_seq()` inside `complete()` for date and numeric gaps.
- Group with `group_by()` to complete within each group independently.

## FAQ

### What is the difference between expand() and complete()?

`expand()` returns only the combination grid — a tibble of variable combinations with no data columns attached. `complete()` returns your original data with missing rows added and optionally filled. Use `expand()` for auditing and `complete()` for fixing.

### Can I use complete() with dates?

Yes. Wrap the date column in `full_seq(date, period = 1)` inside the `complete()` call. This generates every date between the min and max. Without `full_seq()`, `complete()` only uses the dates already present in your data.

### Does complete() work with grouped data frames?

Yes. When the data frame is grouped with `group_by()`, `complete()` operates within each group independently. One restriction: you cannot complete a grouping column — it must stay outside the `complete()` call.

### How do I avoid filling pre-existing NAs?

Set `explicit = FALSE` inside `complete()`. By default, the `fill` parameter replaces all NAs (both new and pre-existing). With `explicit = FALSE`, only newly created rows get the fill value, and your original NAs remain untouched.

## References

1. Wickham, H. — tidyr `complete()` reference documentation. [Link](https://tidyr.tidyverse.org/reference/complete.html)
2. Wickham, H. — tidyr `expand()` reference documentation. [Link](https://tidyr.tidyverse.org/reference/expand.html)
3. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 18: Missing Values. [Link](https://r4ds.hadley.nz/missing-values)
4. tidyr CRAN package documentation (v1.3.2). [Link](https://cran.r-project.org/web/packages/tidyr/tidyr.pdf)
5. Nagraj, V.P. — Expand and Complete with tidyr. [Link](https://www.nagraj.net/notes/expand-and-complete/)
6. Verde Arregoitia, L.D. — You tidyr::complete() me. [Link](https://luisdva.github.io/rstats/complete/)
7. tidyr GitHub source — complete.R. [Link](https://github.com/tidyverse/tidyr/blob/main/R/complete.R)

## What's Next?

- **[Reshape Data with pivot_longer and pivot_wider](pivot_longer-pivot_wider-Reshape-Data-in-R.html)** — Convert between wide and long formats, the other essential tidyr skill.
- **[Split and Combine Columns with separate and unite](tidyr-separate-unite-Split-Combine-Columns-in-R.html)** — Break apart and reassemble character columns using tidyr's modern splitting functions.
