---
title: "tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems — Solved Step-by-Step"
slug: "tidyr-Reshaping-Exercises"
description: "Practise tidyr reshaping with 10 pivot_longer and pivot_wider problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced."
keywords: "tidyr exercises, pivot_longer exercises, pivot_wider exercises, R reshaping practice, tidyr practice problems, wide to long exercises R, long to wide exercises R, tidyr pivot exercises"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "E2.5"
post_type: "EX"
sidebar_title: "tidyr Reshaping (10 problems)"
auto_link_terms: "tidyr reshaping exercises|pivot_longer exercises|pivot_wider exercises|tidyr pivot exercises|reshaping practice problems"
auto_link_case_sensitive: false
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
---

<nav class="breadcrumb-nav">Home &gt; Data Wrangling &gt; tidyr &gt; tidyr Reshaping Exercises</nav>

# tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems

<p class="lead">Ten hands-on exercises drill <code>pivot_longer()</code> and <code>pivot_wider()</code> from basic column stacking to advanced multi-value reshaping — run every solution in your browser.</p>

## Introduction

Reading about reshaping is one thing. Doing it under time pressure with unfamiliar column names is another. These ten problems close that gap. Each one targets a specific `pivot_longer()` or `pivot_wider()` skill that trips up real analysts.

You will start with a simple wide-to-long conversion, then work through round-trip reshaping, column-name prefixes, missing-value fills, compound column names, aggregation during pivoting, regex-based name parsing, and multi-value pivots. By Exercise 10 you will combine several techniques on a single messy table.

If `pivot_longer()` and `pivot_wider()` are new to you, read the parent [pivot_longer & pivot_wider tutorial](pivot_longer-pivot_wider-Reshape-Data-in-R.html) first. Otherwise, run the setup block and begin. All code here runs in one shared R session. Use distinct variable names like `ans1`, `ans2` in your own attempts so you do not overwrite the tutorial datasets.

## Setup: The Datasets We Will Use

Before the exercises, we build three small tables. They are tiny on purpose so you can eyeball every row and verify your answers by hand. Run this block once. Every exercise after this assumes these objects exist.

The `students` table is wide: one row per student, one column per subject. The `quarterly` table is long: one row per region-quarter combination. The `weather` table has prefixed columns (`temp_jan`, `rain_jan`) encoding both the measurement type and the month.

```r
# Setup: load libraries and create three datasets
library(tidyr)
library(dplyr)

students <- tibble(
  student = c("Ava", "Ben", "Cora"),
  math    = c(90, 78, 85),
  english = c(82, 88, 91),
  science = c(75, 92, 80)
)

quarterly <- tibble(
  region  = c("North", "North", "South", "South"),
  quarter = c("Q1", "Q2", "Q1", "Q2"),
  revenue = c(100, 120, 80, 95)
)

weather <- tibble(
  city     = c("Oslo", "Lima"),
  temp_jan = c(-4, 22),
  temp_jul = c(18, 15),
  rain_jan = c(49, 7),
  rain_jul = c(82, 1)
)

students
#> # A tibble: 3 x 4
#>   student  math english science
#>   <chr>   <dbl>   <dbl>   <dbl>
#> 1 Ava        90      82      75
#> 2 Ben        78      88      92
#> 3 Cora       85      91      80

quarterly
#> # A tibble: 4 x 3
#>   region quarter revenue
#>   <chr>  <chr>     <dbl>
#> 1 North  Q1          100
#> 2 North  Q2          120
#> 3 South  Q1           80
#> 4 South  Q2           95

weather
#> # A tibble: 2 x 5
#>   city  temp_jan temp_jul rain_jan rain_jul
#>   <chr>    <dbl>    <dbl>    <dbl>    <dbl>
#> 1 Oslo        -4       18       49       82
#> 2 Lima        22       15        7        1
```

Look at the column names in `weather`. Each encodes two things: the measurement type (`temp` or `rain`) and the month (`jan` or `jul`). Exercises 4 and 6 exploit this structure.

[TIP]
**Run the setup block first, once.** Every exercise reuses `students`, `quarterly`, and `weather`. If you reset the R session, run Setup again before continuing.

## Warm-Up: Basic Reshaping (Exercises 1-3)

These three exercises each use one pivot call. If you get them right, you understand the core mechanics. Expected output shapes are given so you can verify.

### Exercise 1: Stack subject columns into long format

Use `pivot_longer()` to reshape `students` so each row holds one student-subject-score combination. Name the new columns `subject` and `score`. Save to `ans1`. Expected: **9 rows, 3 columns**.

```r
# Exercise 1: pivot_longer on students
# Hint: cols = c(math, english, science), names_to, values_to

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans1 <- students |>
  pivot_longer(
    cols      = c(math, english, science),
    names_to  = "subject",
    values_to = "score"
  )
ans1
#> # A tibble: 9 x 3
#>   student subject score
#>   <chr>   <chr>   <dbl>
#> 1 Ava     math       90
#> 2 Ava     english    82
#> 3 Ava     science    75
#> 4 Ben     math       78
#> 5 Ben     english    88
#> 6 Ben     science    92
#> 7 Cora    math       85
#> 8 Cora    english    91
#> 9 Cora    science    80
```

**Explanation:** `pivot_longer()` takes the three subject columns and stacks them into two new columns. The column names become values in `subject`. The cell values become values in `score`. The `student` column repeats for each subject, giving 3 students times 3 subjects = 9 rows.

</details>

### Exercise 2: Spread a long table to wide format

Use `pivot_wider()` to reshape `quarterly` so each region gets one row and each quarter becomes its own column. The cell values should come from `revenue`. Save to `ans2`. Expected: **2 rows, 3 columns** (region, Q1, Q2).

```r
# Exercise 2: pivot_wider on quarterly
# Hint: names_from = quarter, values_from = revenue

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans2 <- quarterly |>
  pivot_wider(
    names_from  = quarter,
    values_from = revenue
  )
ans2
#> # A tibble: 2 x 3
#>   region    Q1    Q2
#>   <chr>  <dbl> <dbl>
#> 1 North    100   120
#> 2 South     80    95
```

**Explanation:** `pivot_wider()` reads each unique value in `quarter` ("Q1", "Q2") and creates a column for it. The values in `revenue` fill the cells. The `region` column stays as the row identifier automatically because it is not named in `names_from` or `values_from`.

</details>

### Exercise 3: Round-trip reshaping

Pivot `students` to long format (same as Exercise 1), then immediately pivot back to wide. Save the long version to `ans3_long` and the recovered wide version to `ans3_wide`. Verify that `ans3_wide` matches the original `students` table. Expected: **3 rows, 4 columns** in `ans3_wide`.

```r
# Exercise 3: round-trip pivot_longer then pivot_wider
# Hint: chain two pivots in one pipe

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans3_long <- students |>
  pivot_longer(
    cols      = c(math, english, science),
    names_to  = "subject",
    values_to = "score"
  )

ans3_wide <- ans3_long |>
  pivot_wider(
    names_from  = subject,
    values_from = score
  )
ans3_wide
#> # A tibble: 3 x 4
#>   student  math english science
#>   <chr>   <dbl>   <dbl>   <dbl>
#> 1 Ava        90      82      75
#> 2 Ben        78      88      92
#> 3 Cora       85      91      80
```

**Explanation:** `pivot_longer()` and `pivot_wider()` are inverses. Going long then wide recovers the original shape. The column order may differ from the original, but the data is identical. Round-trip reshaping is a useful sanity check when you are unsure whether a pivot lost information.

</details>

[KEY INSIGHT]
**Round-trip reshaping is your debugging tool.** If pivoting long then wide does not recover the original, you have duplicate keys or missing identifiers. Fix those before continuing your analysis.

## Core Challenges: Arguments and Edge Cases (Exercises 4-7)

Warm-up done. These four exercises use specific arguments that handle real-world messiness: column prefixes, missing value fills, compound column names, and duplicate-key aggregation.

### Exercise 4: Strip a column prefix during pivot_longer

The `weather` table has columns like `temp_jan`, `temp_jul`, `rain_jan`, `rain_jul`. Pivot only the temperature columns (`temp_jan`, `temp_jul`) to long format. Use `names_prefix` to remove the `"temp_"` prefix so the `month` column contains just `"jan"` and `"jul"`. Save to `ans4`. Expected: **4 rows**.

```r
# Exercise 4: pivot_longer with names_prefix
# Hint: cols = starts_with("temp"), names_prefix = "temp_"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans4 <- weather |>
  pivot_longer(
    cols         = starts_with("temp"),
    names_to     = "month",
    names_prefix = "temp_",
    values_to    = "temperature"
  )
ans4
#> # A tibble: 4 x 4
#>   city  rain_jan rain_jul month temperature
#>   <chr>    <dbl>    <dbl> <chr>       <dbl>
#> 1 Oslo        49       82 jan            -4
#> 2 Oslo        49       82 jul            18
#> 3 Lima         7        1 jan            22
#> 4 Lima         7        1 jul            15
```

**Explanation:** `names_prefix = "temp_"` strips the leading text from each column name before placing it in `month`. Without it, the month column would contain `"temp_jan"` instead of `"jan"`. The rain columns stay untouched because they were not included in `cols`. Use `starts_with()` to select columns by prefix cleanly.

</details>

### Exercise 5: Fill missing combinations with a default value

The `orders_long` table below has sales by product and store, but not every product sold in every store. Pivot it wider so each store becomes a column. Fill missing combinations with `0` instead of `NA`. Save to `ans5`. Expected: **3 rows, 4 columns**, no `NA` values.

```r
# Exercise 5: pivot_wider with values_fill
# Hint: values_fill = list(units = 0)

orders_long <- tibble(
  product = c("Apple", "Apple", "Banana", "Banana", "Cherry"),
  store   = c("East", "West", "East", "West", "East"),
  units   = c(30, 25, 15, 20, 10)
)
orders_long
#> # A tibble: 5 x 3
#>   product store units
#>   <chr>   <chr> <dbl>
#> 1 Apple   East     30
#> 2 Apple   West     25
#> 3 Banana  East     15
#> 4 Banana  West     20
#> 5 Cherry  East     10

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans5 <- orders_long |>
  pivot_wider(
    names_from  = store,
    values_from = units,
    values_fill = list(units = 0)
  )
ans5
#> # A tibble: 3 x 3
#>   product  East  West
#>   <chr>   <dbl> <dbl>
#> 1 Apple      30    25
#> 2 Banana     15    20
#> 3 Cherry     10     0
```

**Explanation:** Cherry was only sold in the East store. Without `values_fill`, the West column for Cherry would be `NA`. Setting `values_fill = list(units = 0)` replaces those missing cells with zero. This is essential when you need a complete matrix for plotting or modeling and zeros are meaningful.

</details>

### Exercise 6: Split compound column names with names_sep

All four measurement columns in `weather` encode two pieces of information: the measurement type and the month, separated by an underscore. Pivot all four columns to long format using `names_sep = "_"` to split them into a `measure` column and a `month` column. Save to `ans6`. Expected: **4 rows, 4 columns** (city, month, temp, rain).

Wait — that shape requires two steps. First pivot long to get `measure` and `month`, then pivot wide on `measure` to get `temp` and `rain` as separate columns. Save the final result to `ans6`.

```r
# Exercise 6: pivot_longer with names_sep, then pivot_wider
# Hint: names_sep = "_" creates two name columns
# Then pivot_wider on the measure column

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans6 <- weather |>
  pivot_longer(
    cols      = -city,
    names_to  = c("measure", "month"),
    names_sep = "_"
  ) |>
  pivot_wider(
    names_from  = measure,
    values_from = value
  )
ans6
#> # A tibble: 4 x 4
#>   city  month  temp  rain
#>   <chr> <chr> <dbl> <dbl>
#> 1 Oslo  jan      -4    49
#> 2 Oslo  jul      18    82
#> 3 Lima  jan      22     7
#> 4 Lima  jul      15     1
```

**Explanation:** `names_sep = "_"` splits each column name at the underscore. `"temp_jan"` becomes `measure = "temp"` and `month = "jan"`. The intermediate long table has 8 rows with columns city, measure, month, and value. The second pivot spreads `measure` back into separate `temp` and `rain` columns. This two-step reshape is the standard pattern for compound column names.

</details>

[TIP]
**Use names_sep for delimited names, names_pattern for regex.** If the separator is consistent (like an underscore), `names_sep` is simpler. If the structure is irregular, reach for `names_pattern` (see Exercise 8).

### Exercise 7: Aggregate duplicates during pivot_wider

The `survey` table below has duplicate entries: the same person answered the same question twice. Pivot it wider so each question becomes a column. Use `values_fn = list(answer = mean)` to average duplicate answers. Save to `ans7`. Expected: **2 rows, 3 columns**, no warnings.

```r
# Exercise 7: pivot_wider with values_fn to handle duplicates

survey <- tibble(
  person   = c("Ali", "Ali", "Ali", "Bo", "Bo", "Bo"),
  question = c("Q1", "Q1", "Q2", "Q1", "Q2", "Q2"),
  answer   = c(4, 6, 8, 7, 3, 5)
)
survey
#> # A tibble: 6 x 3
#>   person question answer
#>   <chr>  <chr>     <dbl>
#> 1 Ali    Q1            4
#> 2 Ali    Q1            6
#> 3 Ali    Q2            8
#> 4 Bo     Q1            7
#> 5 Bo     Q2            3
#> 6 Bo     Q2            5

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans7 <- survey |>
  pivot_wider(
    names_from  = question,
    values_from = answer,
    values_fn   = list(answer = mean)
  )
ans7
#> # A tibble: 2 x 3
#>   person    Q1    Q2
#>   <chr>  <dbl> <dbl>
#> 1 Ali        5     8
#> 2 Bo         7     4
```

**Explanation:** Ali answered Q1 twice (4 and 6). Without `values_fn`, `pivot_wider()` would produce a list-column and warn you. Setting `values_fn = list(answer = mean)` averages the duplicates: (4 + 6) / 2 = 5. Bo answered Q2 twice (3 and 5), averaged to 4. Use `values_fn` whenever your data has duplicate key combinations and you want a scalar, not a list.

</details>

## Advanced Problems: Real-World Reshaping (Exercises 8-10)

The last three exercises push further. You will parse structured column names with regex, pivot multiple value columns at once, and combine several techniques on a single messy table.

### Exercise 8: Extract structured names with names_pattern

The `clinic` table below has columns like `bp_sys_baseline` and `bp_dia_week4`. Each column name encodes three pieces: a prefix (`bp`), a measure (`sys` or `dia`), and a timepoint (`baseline` or `week4`). The prefix is constant and useless. Use `pivot_longer()` with `names_pattern` to extract `measure` and `timepoint` while discarding the prefix. Save to `ans8`. Expected: **8 rows, 4 columns** (patient, measure, timepoint, value).

```r
# Exercise 8: pivot_longer with names_pattern (regex)
# Hint: names_pattern = "bp_(sys|dia)_(.*)"

clinic <- tibble(
  patient          = c("P1", "P2"),
  bp_sys_baseline  = c(130, 145),
  bp_dia_baseline  = c(85, 92),
  bp_sys_week4     = c(122, 138),
  bp_dia_week4     = c(80, 88)
)
clinic
#> # A tibble: 2 x 5
#>   patient bp_sys_baseline bp_dia_baseline bp_sys_week4 bp_dia_week4
#>   <chr>             <dbl>           <dbl>        <dbl>        <dbl>
#> 1 P1                  130              85          122           80
#> 2 P2                  145              92          138           88

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans8 <- clinic |>
  pivot_longer(
    cols          = -patient,
    names_to      = c("measure", "timepoint"),
    names_pattern = "bp_(\\w+)_(\\w+)",
    values_to     = "value"
  )
ans8
#> # A tibble: 8 x 4
#>   patient measure timepoint value
#>   <chr>   <chr>   <chr>     <dbl>
#> 1 P1      sys     baseline    130
#> 2 P1      dia     baseline     85
#> 3 P1      sys     week4       122
#> 4 P1      dia     week4        80
#> 5 P2      sys     baseline    145
#> 6 P2      dia     baseline     92
#> 7 P2      sys     week4       138
#> 8 P2      dia     week4        88
```

**Explanation:** `names_pattern` takes a regex with one capture group per entry in `names_to`. The pattern `"bp_(\\w+)_(\\w+)"` matches `bp_`, then captures everything up to the next underscore as `measure`, then captures the rest as `timepoint`. The `bp_` prefix is consumed but not captured, so it disappears from the result. This is more powerful than `names_sep` because you control exactly which parts to keep.

</details>

[WARNING]
**Regex capture groups must match names_to length.** If `names_to` has two entries, your regex needs exactly two capture groups `(...)`. A mismatch throws an error that does not always explain the cause clearly.

### Exercise 9: Pivot wider with multiple value columns

The `results_long` table below stores both a `score` and a `grade` for each student-subject combination. Pivot it wider so each subject becomes two columns: `math_score`, `math_grade`, `sci_score`, `sci_grade`. Save to `ans9`. Expected: **2 rows, 5 columns**.

```r
# Exercise 9: pivot_wider with multiple values_from columns
# Hint: values_from = c(score, grade)

results_long <- tibble(
  student = c("Jo", "Jo", "Lee", "Lee"),
  subject = c("math", "sci", "math", "sci"),
  score   = c(88, 76, 92, 81),
  grade   = c("B+", "C+", "A-", "B")
)
results_long
#> # A tibble: 4 x 4
#>   student subject score grade
#>   <chr>   <chr>   <dbl> <chr>
#> 1 Jo      math       88 B+
#> 2 Jo      sci        76 C+
#> 3 Lee     math       92 A-
#> 4 Lee     sci        81 B

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans9 <- results_long |>
  pivot_wider(
    names_from  = subject,
    values_from = c(score, grade)
  )
ans9
#> # A tibble: 2 x 5
#>   student score_math score_sci grade_math grade_sci
#>   <chr>        <dbl>     <dbl> <chr>      <chr>
#> 1 Jo              88        76 B+         C+
#> 2 Lee             92        81 A-         B
```

**Explanation:** When you pass multiple columns to `values_from`, `pivot_wider()` creates one set of new columns per value column. The naming pattern is `{value}_{name}` by default. You get `score_math`, `score_sci`, `grade_math`, `grade_sci`. To reverse the naming to `math_score`, pass `names_glue = "{subject}_{.value}"`.

</details>

### Exercise 10: Reshape a messy table with combined techniques

The `messy` table below came from a spreadsheet. Column names mix a year and a metric (`sales_2024`, `sales_2025`, `cost_2024`, `cost_2025`). Your goal: produce a tidy table with columns `region`, `year`, `sales`, and `cost`. Use `pivot_longer()` with `names_sep` to split the columns, then `pivot_wider()` to separate sales and cost. Save to `ans10`. Expected: **4 rows, 4 columns**.

```r
# Exercise 10: combine pivot_longer + pivot_wider on messy data
# Hint: names_sep = "_" then pivot_wider on metric

messy <- tibble(
  region     = c("East", "West"),
  sales_2024 = c(500, 620),
  sales_2025 = c(540, 680),
  cost_2024  = c(300, 400),
  cost_2025  = c(310, 420)
)
messy
#> # A tibble: 2 x 5
#>   region sales_2024 sales_2025 cost_2024 cost_2025
#>   <chr>       <dbl>      <dbl>     <dbl>     <dbl>
#> 1 East          500        540       300       310
#> 2 West          620        680       400       420

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans10 <- messy |>
  pivot_longer(
    cols      = -region,
    names_to  = c("metric", "year"),
    names_sep = "_"
  ) |>
  pivot_wider(
    names_from  = metric,
    values_from = value
  )
ans10
#> # A tibble: 4 x 4
#>   region year  sales  cost
#>   <chr>  <chr> <dbl> <dbl>
#> 1 East   2024    500   300
#> 2 East   2025    540   310
#> 3 West   2024    620   400
#> 4 West   2025    680   420
```

**Explanation:** The first pivot splits `"sales_2024"` into `metric = "sales"` and `year = "2024"`, producing an 8-row intermediate table with columns region, metric, year, and value. The second pivot spreads `metric` back into separate `sales` and `cost` columns. This long-then-wide pattern is the universal fix for spreadsheet tables that encode two variables in the column header.

</details>

[KEY INSIGHT]
**The pivot_longer-then-pivot_wider pattern solves most messy tables.** When column names encode multiple variables, go long first to separate them, then go wide to put each variable in its own column.

## Common Mistakes and How to Fix Them

### Mistake 1: Including the ID column in cols

Accidentally including the identifier column in `cols` drops it from the output and merges all rows together.

Bad:
```r
# Wrong: pivoting ALL columns, including student
students |> pivot_longer(cols = everything(), names_to = "key", values_to = "val")
#> # A tibble: 12 x 2
#>   key     val
#>   <chr>   <chr>
#> 1 student Ava
#> 2 math    90
#> ...
```

Good:
```r
# Correct: exclude the ID column
students |> pivot_longer(cols = -student, names_to = "subject", values_to = "score")
#> # A tibble: 9 x 3
#>   student subject score
#>   <chr>   <chr>   <dbl>
#> 1 Ava     math       90
#> ...
```

Always exclude identifier columns with `-col_name` or name the value columns explicitly with `c(col1, col2)`.

### Mistake 2: Duplicate keys create list-columns in pivot_wider

If the combination of identifier + name is not unique, `pivot_wider()` produces list-columns instead of scalars and prints a warning.

```r
# Duplicate: Ali answered Q1 twice
survey |> pivot_wider(names_from = question, values_from = answer)
#> Warning: Values from `answer` are not uniquely identified...
#> # A tibble: 2 x 3
#>   person Q1        Q2
#>   <chr>  <list>    <list>
#> 1 Ali    <dbl [2]> <dbl [1]>
#> 2 Bo     <dbl [1]> <dbl [2]>
```

Fix: either deduplicate before pivoting with `distinct()` or `slice_max()`, or use `values_fn` to aggregate (like Exercise 7).

### Mistake 3: Numeric values become character after pivot_longer

When you pivot columns of mixed types (numeric and character) together, R coerces everything to character. Check that all columns in `cols` share the same type.

```r
# Mixed types: one column is character, others are numeric
mixed <- tibble(id = 1, score = 90, grade = "A")
mixed |> pivot_longer(cols = -id, names_to = "var", values_to = "val")
#> # A tibble: 2 x 3
#>      id var   val
#>   <dbl> <chr> <chr>
#> 1     1 score 90
#> 2     1 grade A
```

The `score` value `90` became character `"90"`. Fix: pivot only columns of the same type, or use `values_transform = list(val = as.numeric)` when you know all values should be numeric.

## Summary

Here is a quick reference for the key arguments you practised across all ten exercises.

| Argument | Function | What it does | Exercise |
|---|---|---|---|
| `cols` | `pivot_longer()` | Which columns to stack | 1, 3, 4, 6, 8, 10 |
| `names_to` | `pivot_longer()` | Name of the new key column | 1, 3, 4, 6, 8, 10 |
| `values_to` | `pivot_longer()` | Name of the new value column | 1, 3, 4, 8, 10 |
| `names_prefix` | `pivot_longer()` | Strip a prefix from column names | 4 |
| `names_sep` | `pivot_longer()` | Split column names at a delimiter | 6, 10 |
| `names_pattern` | `pivot_longer()` | Extract parts of column names via regex | 8 |
| `names_from` | `pivot_wider()` | Column whose values become new column names | 2, 3, 6, 7, 9, 10 |
| `values_from` | `pivot_wider()` | Column(s) whose values fill the new columns | 2, 3, 6, 7, 9, 10 |
| `values_fill` | `pivot_wider()` | Default value for missing combinations | 5 |
| `values_fn` | `pivot_wider()` | Aggregation function for duplicate keys | 7 |

## FAQ

### When should I use pivot_longer versus pivot_wider?

Use `pivot_longer()` when your column names contain data (like years, subjects, or measurement types) and you want them as values in a single column. Use `pivot_wider()` when a single column contains variable names and you want each one as a separate column. Most raw datasets need `pivot_longer()` first.

### How do I pivot only some columns?

Use tidy-select helpers inside `cols`: `starts_with("temp")`, `ends_with("_score")`, `matches("^Q\\d")`, or just name them `c(col1, col2)`. To exclude columns, use `-col_name` or `!col_name`.

### What replaced gather() and spread()?

`pivot_longer()` replaced `gather()` and `pivot_wider()` replaced `spread()`. The tidyr team introduced the pivot functions in 2019 because the argument names (`key`, `value`) in `gather/spread` were confusing. The pivot versions have clearer names (`names_to`, `values_from`) and support advanced features like `names_sep` and `values_fn`.

### Can I pivot multiple value columns at once?

Yes. Pass a vector to `values_from` in `pivot_wider()`, like `values_from = c(score, grade)`. Each value column generates its own set of new columns. See Exercise 9 for a worked example.

## References

1. Wickham, H., Vaughan, D., & Girlich, M. — tidyr: Tidy Messy Data. tidyr pivot vignette. [Link](https://tidyr.tidyverse.org/articles/pivot.html)
2. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 5: Data Tidying. [Link](https://r4ds.hadley.nz/data-tidy.html)
3. tidyr documentation — pivot_longer() reference. [Link](https://tidyr.tidyverse.org/reference/pivot_longer.html)
4. tidyr documentation — pivot_wider() reference. [Link](https://tidyr.tidyverse.org/reference/pivot_wider.html)
5. Stanford Data Challenge Lab — Advanced Pivoting. [Link](https://dcl-wrangle.stanford.edu/pivot-advanced.html)
6. Data Carpentry — R for Social Scientists: Data Wrangling with tidyr. [Link](https://datacarpentry.github.io/r-socialsci/04-tidyr.html)
7. Arnold, J. — R for Data Science Exercise Solutions: Tidy Data. [Link](https://jrnold.github.io/r4ds-exercise-solutions/tidy-data.html)

## What's Next?

Now that you can reshape data confidently, explore these related tutorials:

- [Missing Values in R: Detect, Count, Remove & Impute NA](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) — cleaned data often needs NA handling next
- [dplyr Exercises (15 problems)](dplyr-Exercises.html) — practise filtering, grouping, and joining after reshaping
- [pivot_longer & pivot_wider Tutorial](pivot_longer-pivot_wider-Reshape-Data-in-R.html) — review the parent tutorial if any exercise stumped you
