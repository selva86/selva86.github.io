---
title: "Data Wrangling Exercises in R: 50 Practice Problems"
slug: "Data-Wrangling-Exercises-in-R"
description: "Fifty data wrangling exercises in R covering import, clean, reshape, join, aggregate. Built-in datasets, hidden solutions, runnable code, real scenarios."
keywords: "data wrangling in R exercises, data wrangling exercises, R data manipulation exercises, dplyr tidyr practice, R data cleaning exercises, data wrangling problems R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Data Wrangling Exercises"
sidebar_order: 104
fr_parent: "R-Tutorial.html"
auto_link_terms: "data wrangling in R exercises|data wrangling exercises|data wrangling practice|data manipulation exercises R|data cleaning exercises R"
auto_link_case_sensitive: false
target_keyword: "data wrangling in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Data Wrangling Exercises in R: 50 Practice Problems

<p class="lead">Fifty hands-on data wrangling exercises in R covering the full pipeline: inspecting data, selecting and filtering rows, mutating columns, reshaping with pivots, joining tables, grouped aggregation, cleaning missing values, and end-to-end ETL flows. Every problem uses a built-in dataset or inline tibble, ships with a hidden solution, and saves output to a named variable so you can verify against the expected result.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(lubridate)
library(tibble)
library(ggplot2)   # diamonds, mpg, economics, txhousing
```

## Section 1. Import and inspection (7 problems)

### Exercise 1.1: Take a first look at mtcars with head and str

**Task:** Run a quick inspection of the built-in `mtcars` dataset by combining the number of rows, number of columns, and the first three rows into a single named list. Save the list to `ex_1_1` so a reviewer can confirm the shape and a sample at a glance.

**Expected result:**

```
#> $rows
#> [1] 32
#>
#> $cols
#> [1] 11
#>
#> $head
#>                 mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710     22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
```

**Difficulty:** Beginner

[HINTS]
Think about how to bundle three separate facts about the data - its height, its width, and a small preview - into one container that keeps each piece labelled.
Build a named `list()` whose elements come from `nrow()`, `ncol()`, and `head(mtcars, 3)`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- list(
  rows = nrow(mtcars),
  cols = ncol(mtcars),
  head = head(mtcars, 3)
)
ex_1_1
#> $rows
#> [1] 32
#> $cols
#> [1] 11
#> $head
#>                 mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710     22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
```

**Explanation:** Wrapping shape and a sample in a named list keeps the artefact reproducible: a downstream notebook or test can introspect it without re-reading `mtcars`. Prefer `nrow()`/`ncol()` over `dim()` when you want the parts separately; `head(df, 3)` is more deterministic than `df[1:3, ]` because it survives row reordering.

</details>

### Exercise 1.2: Glimpse the diamonds frame to map column types

**Task:** Use `dplyr::glimpse()` on the `diamonds` dataset to get a typed listing of every column. Capture the printed output into a character vector with `capture.output()` and save the result to `ex_1_2`. This lets you grep for a particular column type later.

**Expected result:**

```
#> [1] "Rows: 53,940"
#> [2] "Columns: 10"
#> [3] "$ carat   <dbl> 0.23, 0.21, 0.23, 0.29, 0.31, 0.24, 0.24, 0.26, ..."
#> [4] "$ cut     <ord> Ideal, Premium, Good, Premium, Good, Very Good, ..."
#> # 8 more lines
```

**Difficulty:** Beginner

[HINTS]
You need the printed type-listing kept as text you can search later, not just something shown on screen once.
Wrap `glimpse(diamonds)` inside `capture.output()` so the console lines become a character vector.

```r title="Your turn"
ex_1_2 <- # your code here
head(ex_1_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- capture.output(glimpse(diamonds))
head(ex_1_2, 4)
#> [1] "Rows: 53,940"
#> [2] "Columns: 10"
#> [3] "$ carat   <dbl> 0.23, 0.21, 0.23, 0.29, 0.31, 0.24, 0.24, 0.26, ..."
#> [4] "$ cut     <ord> Ideal, Premium, Good, Premium, Good, Very Good, ..."
```

**Explanation:** `glimpse()` is the analyst-friendly counterpart to `str()`: one row per column with type and head values. Capturing its console output gives you a programmable artefact, which is handy for snapshot tests or for posting an overview to a chat channel. `str()` is older and prints class hierarchies, useful for S4 objects but noisier for flat data frames.

</details>

### Exercise 1.3: Audit airquality for missing-value hot spots

**Task:** An analyst onboarding to an air-quality dataset wants to know which columns of `airquality` have missing values and how many. Produce a sorted named integer vector (descending) of NA counts per column, restricted to columns with at least one NA. Save to `ex_1_3`.

**Expected result:**

```
#>   Ozone Solar.R 
#>      37       7
```

**Difficulty:** Intermediate

[HINTS]
First measure how much is missing in each column, then keep only the offending columns and order them worst-first.
Combine `is.na()` with `colSums()` for per-column counts, subset to counts above zero, and `sort()` with `decreasing = TRUE`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
na_counts <- colSums(is.na(airquality))
ex_1_3 <- sort(na_counts[na_counts > 0], decreasing = TRUE)
ex_1_3
#>   Ozone Solar.R 
#>      37       7
```

**Explanation:** `is.na()` returns a logical matrix the same shape as the data; `colSums()` collapses it to per-column counts. Filtering with `na_counts > 0` removes clean columns so the report stays compact. The same idiom generalises to other quality checks: replace `is.na` with `is.infinite` or a custom predicate for similar audits.

</details>

### Exercise 1.4: Build a typed schema from iris

**Task:** Build a tibble that lists every column of `iris` alongside its class and a sample value drawn from row 1. The tibble should have columns `column`, `class`, `sample` and exactly 5 rows. Save to `ex_1_4` so you can attach it to a data dictionary.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   column       class   sample
#>   <chr>        <chr>   <chr> 
#> 1 Sepal.Length numeric 5.1   
#> 2 Sepal.Width  numeric 3.5   
#> 3 Petal.Length numeric 1.4   
#> 4 Petal.Width  numeric 0.2   
#> 5 Species      factor  setosa
```

**Difficulty:** Intermediate

[HINTS]
You are describing the data itself - one row per column, recording each column's name, its type, and an example value.
Build a `tibble()` from `names(iris)`, `sapply(iris, class)`, and `sapply()` over `iris[1, ]` coerced with `as.character`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- tibble(
  column = names(iris),
  class  = sapply(iris, class),
  sample = sapply(iris[1, ], as.character)
)
ex_1_4
#> # A tibble: 5 x 3
#>   column       class   sample
#>   <chr>        <chr>   <chr> 
#> 1 Sepal.Length numeric 5.1   
#> 2 Sepal.Width  numeric 3.5   
#> 3 Petal.Length numeric 1.4   
#> 4 Petal.Width  numeric 0.2   
#> 5 Species      factor  setosa
```

**Explanation:** A typed schema is the foundation of every data dictionary. `sapply(iris, class)` walks columns and returns a named character vector. Coercing the first row to character with `as.character` keeps mixed types in one vector. For richer audits, swap `sapply` with `vapply(iris, class, character(1))` for stricter type safety.

</details>

### Exercise 1.5: Spot constant and near-constant columns

**Task:** A junior analyst wants to flag low-information columns before modelling. From `mtcars`, return a named numeric vector giving the number of distinct values per column, sorted ascending. Save the result to `ex_1_5`; anything with 2 or 3 unique values is a candidate for treatment as categorical.

**Expected result:**

```
#>   vs   am gear carb  cyl gear drat  qsec  hp  disp  wt  mpg
#>    2    2    3    6    3    3   22    30  22    27  29   25
#> # actual values vary; key signal is vs/am have 2 levels
```

**Difficulty:** Intermediate

[HINTS]
A low-information column is one that takes very few different values, so count the variety in each column and surface the smallest first.
Apply a function returning `length(unique(x))` to every column with `sapply()`, then `sort()` the result ascending.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- sort(sapply(mtcars, function(x) length(unique(x))))
ex_1_5
#>   vs   am  gear  cyl carb gear drat qsec   hp disp   wt  mpg
#>    2    2     3    3    6    3   22   30   22   27   29   25
```

**Explanation:** Counting distinct values per column is the cheapest way to find binary flags (`vs`, `am`) and small-domain categoricals (`cyl`, `gear`). Sorting ascending makes the suspects appear first. For very wide tables, prefer `dplyr::summarise(across(everything(), n_distinct))` so the result stays a tibble you can join back to a feature catalogue.

</details>

### Exercise 1.6: Summarise numeric ranges in one tibble

**Task:** Produce a tibble of min, median, max, and mean for every numeric column of `mtcars`. Rows should be the column names, and the tibble should have columns `variable`, `min`, `median`, `max`, `mean`. Save to `ex_1_6`. Round numeric stats to 2 decimal places.

**Expected result:**

```
#> # A tibble: 11 x 5
#>   variable    min median    max   mean
#>   <chr>     <dbl>  <dbl>  <dbl>  <dbl>
#> 1 mpg       10.4   19.2   33.9   20.1 
#> 2 cyl        4      6      8      6.19
#> 3 disp      71.1  196.   472    231.  
#> # 8 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Compute four summary statistics for every numeric column, then reshape so each column becomes a row and each statistic its own column.
Use `summarise(across(...))` with a named list of `min`, `median`, `max`, `mean` and a `.names` pattern, then `pivot_longer()` with a `.value` token in `names_to`.

```r title="Your turn"
ex_1_6 <- # your code here
head(ex_1_6, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- mtcars |>
  summarise(across(everything(),
                   list(min = min, median = median, max = max, mean = mean),
                   .names = "{.col}__{.fn}")) |>
  pivot_longer(everything(), names_to = c("variable", ".value"),
               names_sep = "__") |>
  mutate(across(c(min, median, max, mean), round, 2))
head(ex_1_6, 3)
#> # A tibble: 3 x 5
#>   variable    min median    max   mean
#>   <chr>     <dbl>  <dbl>  <dbl>  <dbl>
#> 1 mpg       10.4   19.2   33.9   20.1 
#> 2 cyl        4      6      8      6.19
#> 3 disp      71.1  196    472    231.
```

**Explanation:** `across()` plus a named list of functions builds wide stat columns; `.names = "{.col}__{.fn}"` encodes both pieces so `pivot_longer()` can split them apart. The `.value` token in `names_to` makes the stat names become column headers instead of values. Rounding at the end keeps the table presentable without losing precision in intermediate computations.

</details>

### Exercise 1.7: Fingerprint a frame by column name and type

**Task:** A data engineer wants a one-line fingerprint of `diamonds` to detect schema drift between runs. Build a single character string of the form `"col:type | col:type | ..."` listing every column and its class. Save the fingerprint to `ex_1_7`.

**Expected result:**

```
#> [1] "carat:numeric | cut:ordered | color:ordered | clarity:ordered | depth:numeric | table:numeric | price:integer | x:numeric | y:numeric | z:numeric"
```

**Difficulty:** Advanced

[HINTS]
You want one flat string that pairs every column name with its type, joined by a separator.
`paste()` `names(diamonds)` against `sapply(diamonds, function(x) class(x)[1])` with `sep = ":"`, then `paste()` again with `collapse = " | "`.

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- paste(
  paste(names(diamonds),
        sapply(diamonds, function(x) class(x)[1]),
        sep = ":"),
  collapse = " | "
)
ex_1_7
#> [1] "carat:numeric | cut:ordered | color:ordered | clarity:ordered | depth:numeric | table:numeric | price:integer | x:numeric | y:numeric | z:numeric"
```

**Explanation:** Taking `class(x)[1]` keeps the fingerprint stable when a column has multiple classes (an ordered factor reports `c("ordered","factor")`). Comparing two fingerprints with `identical()` gives you a fast schema-drift check between pipeline runs. For deeper drift detection, hash the fingerprint plus row counts, which catches both schema and volume changes.

</details>

## Section 2. Selecting and filtering (8 problems)

### Exercise 2.1: Select three columns from mpg with a tidy pipe

**Task:** Use `select()` to keep only `manufacturer`, `model`, and `cty` from the `mpg` dataset. Pipe the result into `head(5)` so the output is compact. Save the final 5-row tibble to `ex_2_1` so a reviewer can verify the projection.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   manufacturer model        cty
#>   <chr>        <chr>      <int>
#> 1 audi         a4            18
#> 2 audi         a4            21
#> 3 audi         a4            20
#> 4 audi         a4            21
#> 5 audi         a4            16
```

**Difficulty:** Beginner

[HINTS]
Keep only the three columns asked for, then trim the rows down to a short preview.
Pipe `mpg` through `select(manufacturer, model, cty)` into `head(5)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mpg |>
  select(manufacturer, model, cty) |>
  head(5)
ex_2_1
#> # A tibble: 5 x 3
#>   manufacturer model   cty
#>   <chr>        <chr> <int>
#> 1 audi         a4       18
#> 2 audi         a4       21
#> 3 audi         a4       20
#> 4 audi         a4       21
#> 5 audi         a4       16
```

**Explanation:** `select()` keeps columns in the order you name them, which differs from `subset()` and `[, c(...)]` only in that it preserves the tibble class. Piping into `head(5)` after selection is cheaper than slicing first because the projection runs only on the kept columns. For programmatic column lists, use `all_of(my_cols)` to avoid the data-mask warning.

</details>

### Exercise 2.2: Filter the fuel-efficient cars in mtcars

**Task:** An analyst pulling data for an EV-comparison blog post wants every row of `mtcars` where `mpg` is greater than 25. Return the matching rows with all columns and save the filtered tibble to `ex_2_2`. The result should keep the original row names so the car model is readable.

**Expected result:**

```
#>                 mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4 78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4 75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4 71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4 79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3 91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4 95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Difficulty:** Beginner

[HINTS]
Keep only the rows that clear a numeric threshold while preserving the model names attached to each row.
Use base-R bracket subsetting `mtcars[mtcars$mpg > 25, ]` - the trailing comma keeps every column.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- mtcars[mtcars$mpg > 25, ]
ex_2_2
#>                 mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4 78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4 75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4 71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4 79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3 91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4 95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Explanation:** Base-R subsetting with `[row, col]` is the right tool here because `mtcars` is a data frame whose row names carry the model. `dplyr::filter()` would drop those row names since tibbles do not support them. The trailing comma after the row condition is required: omit it and you ask R for columns, which throws a confusing error.

</details>

### Exercise 2.3: Filter and project diamonds in one chain

**Task:** From `diamonds`, keep rows where `cut == "Ideal"` and `carat >= 1`, then select `carat`, `cut`, `color`, `price`. Limit the result to the first 5 rows. Save the tibble to `ex_2_3` so a downstream report can pull the cleanest Ideal-cut, full-carat stones.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   carat cut   color price
#>   <dbl> <ord> <ord> <int>
#> 1  1.01 Ideal I      2844
#> 2  1.01 Ideal I      2853
#> 3  1.01 Ideal J      2862
#> 4  1.01 Ideal I      2873
#> 5  1    Ideal H      2895
```

**Difficulty:** Intermediate

[HINTS]
Narrow the rows by two conditions, then narrow the columns, then cut to a short preview.
Chain `filter(cut == "Ideal", carat >= 1)`, `select(carat, cut, color, price)`, and `head(5)`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- diamonds |>
  filter(cut == "Ideal", carat >= 1) |>
  select(carat, cut, color, price) |>
  head(5)
ex_2_3
#> # A tibble: 5 x 4
#>   carat cut   color price
#>   <dbl> <ord> <ord> <int>
#> 1  1.01 Ideal I      2844
#> 2  1.01 Ideal I      2853
#> 3  1.01 Ideal J      2862
#> 4  1.01 Ideal I      2873
#> 5  1    Ideal H      2895
```

**Explanation:** Multiple conditions inside `filter()` are joined with logical AND, the same as `filter(cut == "Ideal" & carat >= 1)` but slightly more readable. Putting `filter` before `select` keeps the column count high only while it matters, but the optimiser fuses the two steps regardless. For complex multi-clause predicates, `if_all()` and `if_any()` make the intent explicit.

</details>

### Exercise 2.4: Hunt for under-priced premium diamonds

**Task:** A jeweller wants to flag possible pricing errors: stones with `carat > 2` that still sell for under 10,000 USD. From `diamonds`, return all such rows arranged by `price` ascending and save the result to `ex_2_4`. Keep all original columns intact for downstream review.

**Expected result:**

```
#> # A tibble: 71 x 10
#>   carat cut     color clarity depth table price     x     y     z
#>   <dbl> <ord>   <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.06 Premium H     SI2      61.2    59  5203  8.1   8.07  4.95
#> 2  2.14 Fair    J     I1       69.4    57  5405  7.74  7.7   5.36
#> 3  2.15 Fair    J     I1       65.5    57  5430  8.01  7.95  5.23
#> ...
#> # 68 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Keep the rows matching two thresholds, then order the survivors from cheapest upward.
Use `filter(carat > 2, price < 10000)` then `arrange(price)`.

```r title="Your turn"
ex_2_4 <- # your code here
head(ex_2_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- diamonds |>
  filter(carat > 2, price < 10000) |>
  arrange(price)
head(ex_2_4, 3)
#> # A tibble: 3 x 10
#>   carat cut     color clarity depth table price     x     y     z
#>   <dbl> <ord>   <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.06 Premium H     SI2      61.2    59  5203  8.1   8.07  4.95
#> 2  2.14 Fair    J     I1       69.4    57  5405  7.74  7.7   5.36
#> 3  2.15 Fair    J     I1       65.5    57  5430  8.01  7.95  5.23
```

**Explanation:** Sorting after filtering is the conventional order: the optimiser will not push `arrange` ahead of `filter` because that would sort more rows than necessary. The 71 rows surfaced are mostly Fair-cut J-color stones, hinting that price anomalies cluster in low-quality grade combinations rather than being random data errors.

</details>

### Exercise 2.5: Pull the five most expensive diamonds

**Task:** Return the 5 most expensive rows from `diamonds`, keeping all columns, using `slice_max()`. Sort by `price` descending and break ties by `carat` (also descending) so the ordering is deterministic. Save to `ex_2_5` for an inventory snapshot.

**Expected result:**

```
#> # A tibble: 5 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 2  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> 3  1.51 Ideal     G     IF       61.7    55 18806  7.37  7.41  4.56
#> 4  2.07 Ideal     G     SI2      62.5    55 18804  8.2   8.13  5.11
#> 5  2.29 Premium   I     SI1      61.8    59 18797  8.52  8.45  5.24
```

**Difficulty:** Intermediate

[HINTS]
Pull the highest-priced rows, using carat only to settle ties so the ordering is reproducible.
Use `slice_max()` with `n = 5` and pass `tibble(price, carat)` to its `order_by` argument.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- diamonds |>
  slice_max(order_by = tibble(price, carat), n = 5)
ex_2_5
#> # A tibble: 5 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 2  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> 3  1.51 Ideal     G     IF       61.7    55 18806  7.37  7.41  4.56
#> 4  2.07 Ideal     G     SI2      62.5    55 18804  8.2   8.13  5.11
#> 5  2.29 Premium   I     SI1      61.8    59 18797  8.52  8.45  5.24
```

**Explanation:** `slice_max()` is a tidy alternative to `arrange(desc(price)) |> head(5)` and supports multi-column ordering by passing a tibble to `order_by`. Without `with_ties = FALSE` (the default in 1.1+), tied rows beyond `n` are dropped silently; if you need to keep every tie, set `with_ties = TRUE`.

</details>

### Exercise 2.6: List the unique manufacturers in mpg

**Task:** An ops engineer building a dropdown filter wants the distinct manufacturers from the `mpg` dataset, sorted alphabetically. Return a tibble with a single `manufacturer` column. Save the tibble to `ex_2_6` so it can be cached and reused by the dashboard.

**Expected result:**

```
#> # A tibble: 15 x 1
#>   manufacturer
#>   <chr>       
#> 1 audi        
#> 2 chevrolet   
#> 3 dodge       
#> 4 ford        
#> # 11 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Reduce the column to its unique values, then put them in alphabetical order.
Use `distinct(manufacturer)` followed by `arrange(manufacturer)`.

```r title="Your turn"
ex_2_6 <- # your code here
head(ex_2_6, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- mpg |>
  distinct(manufacturer) |>
  arrange(manufacturer)
head(ex_2_6, 4)
#> # A tibble: 4 x 1
#>   manufacturer
#>   <chr>       
#> 1 audi        
#> 2 chevrolet   
#> 3 dodge       
#> 4 ford
```

**Explanation:** `distinct()` keeps the columns you name; without an `arrange()` the order is whichever rows appeared first in the source. For dashboards, sorting before caching avoids an O(n log n) sort on every page render. If you need the unique combinations of two columns (manufacturer plus model), pass both to `distinct()` and the deduplication considers the pair.

</details>

### Exercise 2.7: Order diamonds by quality then price

**Task:** Sort the first 10 rows of `diamonds` by `cut` ascending and then by `price` descending within `cut`. Keep only `cut`, `color`, `carat`, `price`. Save the resulting 10-row tibble to `ex_2_7` for use in a price-ladder visualisation.

**Expected result:**

```
#> # A tibble: 10 x 4
#>   cut       color carat price
#>   <ord>     <ord> <dbl> <int>
#> 1 Fair      H      0.96  2503
#> 2 Good      E      0.23   327
#> 3 Very Good H      0.26   336
#> 4 Premium   E      0.21   326
#> # 6 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Take a slice of rows first, then sort within quality groups by descending price, then keep four columns.
Chain `head(10)`, `arrange(cut, desc(price))`, and `select(cut, color, carat, price)`.

```r title="Your turn"
ex_2_7 <- # your code here
head(ex_2_7, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- diamonds |>
  head(10) |>
  arrange(cut, desc(price)) |>
  select(cut, color, carat, price)
head(ex_2_7, 4)
#> # A tibble: 4 x 4
#>   cut       color carat price
#>   <ord>     <ord> <dbl> <int>
#> 1 Fair      H     0.96   2503
#> 2 Good      E     0.23    327
#> 3 Very Good H     0.26    336
#> 4 Premium   E     0.21    326
```

**Explanation:** `cut` is an ordered factor so `arrange(cut)` follows the factor levels (Fair < Good < Very Good < Premium < Ideal) rather than alphabetical order. Mixing ascending and descending in one `arrange` is just a matter of wrapping the descending key with `desc()`. The trick generalises to any number of keys with mixed directions.

</details>

### Exercise 2.8: Find rows where any numeric value exceeds the column mean

**Task:** From `mtcars`, return rows where at least one of `mpg`, `hp`, or `wt` is greater than its own column mean. Use `if_any()` with `across()` for the predicate. Save the filtered tibble to `ex_2_8`. The expected count is far less than the full 32 cars because the conditions overlap.

**Expected result:**

```
#> # A tibble: 28 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6  160    110  3.9   2.62 16.5      0     1     4     4
#> 2  21       6  160    110  3.9   2.88 17.0      0     1     4     4
#> ...
#> # 26 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
Keep a row when at least one of three chosen columns sits above that column's own average.
Use `filter()` with `if_any(c(mpg, hp, wt), ~ .x > mean(.x))`.

```r title="Your turn"
ex_2_8 <- # your code here
nrow(ex_2_8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- as_tibble(mtcars) |>
  filter(if_any(c(mpg, hp, wt), ~ .x > mean(.x)))
nrow(ex_2_8)
#> [1] 28
```

**Explanation:** `if_any()` returns TRUE when at least one of the selected columns satisfies the predicate; the lambda `~ .x > mean(.x)` is evaluated per column so each comparison uses that column's own mean. Use `if_all()` when you want every selected column to pass. Combined with `across()` over `where(is.numeric)`, this pattern scales to wide tables without rewriting the predicate.

</details>

## Section 3. Mutating and transforming (8 problems)

### Exercise 3.1: Add a horsepower-per-cylinder column

**Task:** Add a new column `hp_per_cyl` to `mtcars` (rounded to 1 decimal) computed as horsepower divided by cylinders. Keep all original columns. Save the augmented tibble to `ex_3_1`. The first 3 rows should match the expected output below.

**Expected result:**

```
#> # A tibble: 3 x 12
#>     mpg   cyl  disp    hp ... hp_per_cyl
#>   <dbl> <dbl> <dbl> <dbl>        <dbl>
#> 1  21       6   160   110         18.3
#> 2  21       6   160   110         18.3
#> 3  22.8     4   108    93         23.2
```

**Difficulty:** Beginner

[HINTS]
Add one derived column built from the ratio of two existing columns, rounded for display.
Use `mutate(hp_per_cyl = round(hp / cyl, 1))`.

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1[, c("mpg", "cyl", "hp", "hp_per_cyl")], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  mutate(hp_per_cyl = round(hp / cyl, 1))
head(ex_3_1[, c("mpg", "cyl", "hp", "hp_per_cyl")], 3)
#>                mpg cyl  hp hp_per_cyl
#> Mazda RX4     21.0   6 110       18.3
#> Mazda RX4 Wag 21.0   6 110       18.3
#> Datsun 710    22.8   4  93       23.2
```

**Explanation:** `mutate()` appends new columns to the right while keeping every existing column. Wrapping the calculation in `round(.., 1)` keeps the display tidy without losing usable precision: downstream models will round implicitly if they care. To replace `hp` in place rather than adding a new column, write `mutate(hp = round(hp / cyl, 1))`.

</details>

### Exercise 3.2: Bucket diamonds into price tiers with case_when

**Task:** A jeweller preparing a quarterly catalogue wants to tag every diamond in `diamonds` with a `tier` of `"budget"` (price < 1000), `"mid"` (1000-4999), or `"premium"` (>= 5000). Use `case_when()` to add the column and save the tibble to `ex_3_2`. Verify with a `count()` summary.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14499
#> 2 mid     28907
#> 3 premium 10534
```

**Difficulty:** Intermediate

[HINTS]
Assign each row one of three labels depending on which price band it falls into.
Add a `tier` column inside `mutate()` using `case_when()`, ordering the branches `price < 1000`, `price < 5000`, and a `TRUE` catch-all.

```r title="Your turn"
ex_3_2 <- # your code here
count(ex_3_2, tier)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- diamonds |>
  mutate(tier = case_when(
    price < 1000  ~ "budget",
    price < 5000  ~ "mid",
    TRUE          ~ "premium"
  ))
count(ex_3_2, tier)
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14499
#> 2 mid     28907
#> 3 premium 10534
```

**Explanation:** `case_when()` reads top-to-bottom, so the second branch implicitly handles 1000-4999. The trailing `TRUE ~ "premium"` is the catch-all default; without it, prices above 5000 would become `NA`. For three or more buckets, `case_when()` is cleaner than nested `if_else()` and clearer than `findInterval()` because the labels are visible inline.

</details>

### Exercise 3.3: Flag iris flowers with large petals

**Task:** Add a logical `large_petal` column to `iris` that is TRUE when `Petal.Length > 5`. Use `if_else()` rather than `case_when()`. Save the augmented tibble to `ex_3_3`. Counting TRUE versus FALSE values should match the expected output below.

**Expected result:**

```
#> 
#> FALSE  TRUE 
#>   108    42
```

**Difficulty:** Intermediate

[HINTS]
Add a TRUE/FALSE column driven by whether one measurement crosses a threshold.
Use `mutate(large_petal = if_else(Petal.Length > 5, TRUE, FALSE))`.

```r title="Your turn"
ex_3_3 <- # your code here
table(ex_3_3$large_petal)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- iris |>
  mutate(large_petal = if_else(Petal.Length > 5, TRUE, FALSE))
table(ex_3_3$large_petal)
#> 
#> FALSE  TRUE 
#>   108    42
```

**Explanation:** `if_else()` is the tidyverse equivalent of base `ifelse()` but strict about return types: a numeric branch cannot pair with a character branch without coercion. `Petal.Length > 5` already evaluates to a logical, so you could skip `if_else()` entirely and write `large_petal = Petal.Length > 5`. The explicit form documents the intent for a reader who is new to vectorised logic.

</details>

### Exercise 3.4: Z-score a numeric column for outlier detection

**Task:** A trading desk reviewing returns wants standardised mileage. Add a `mpg_z` column to `mtcars` that is the z-score of `mpg` (subtract the mean, divide by the standard deviation). Keep only `mpg`, `mpg_z` for the result, rounded to 2 decimals. Save the 32-row tibble to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>     mpg mpg_z
#>   <dbl> <dbl>
#> 1  21    0.15
#> 2  21    0.15
#> 3  22.8  0.45
#> 4  21.4  0.22
```

**Difficulty:** Intermediate

[HINTS]
Standardise one column by recentring it on its average and rescaling by its spread, then keep just the before-and-after columns.
In `mutate()` write `round((mpg - mean(mpg)) / sd(mpg), 2)`, then `select(mpg, mpg_z)`.

```r title="Your turn"
ex_3_4 <- # your code here
head(ex_3_4, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- mtcars |>
  mutate(mpg_z = round((mpg - mean(mpg)) / sd(mpg), 2)) |>
  select(mpg, mpg_z) |>
  as_tibble()
head(ex_3_4, 4)
#> # A tibble: 4 x 2
#>     mpg mpg_z
#>   <dbl> <dbl>
#> 1  21    0.15
#> 2  21    0.15
#> 3  22.8  0.45
#> 4  21.4  0.22
```

**Explanation:** A z-score expresses how many standard deviations a value sits from the mean. Implementing it by hand makes the formula transparent; `scale(mpg)` from base R does the same but returns a matrix with attributes that often surprise people downstream. Standardising before clustering, PCA, or distance-based models prevents columns with large absolute ranges from dominating.

</details>

### Exercise 3.5: Standardise every numeric column in mtcars

**Task:** Standardise every numeric column of `mtcars` to mean 0 and standard deviation 1 in one shot. Use `mutate(across(...))` with `where(is.numeric)`. Round each standardised value to 2 decimals. Save the resulting tibble to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  0.15 -0.1  -0.57 -0.54  0.57 -0.61 -0.78 -0.87  1.19  0.42  0.74
#> 2  0.15 -0.1  -0.57 -0.54  0.57 -0.35 -0.46 -0.87  1.19  0.42  0.74
#> 3  0.45 -1.22 -0.99 -0.78  0.48 -0.92  0.43  1.12  1.19  0.42 -1.12
```

**Difficulty:** Intermediate

[HINTS]
Apply the same standardising formula to every numeric column without naming any of them.
Use `mutate(across(where(is.numeric), ~ round((.x - mean(.x)) / sd(.x), 2)))`.

```r title="Your turn"
ex_3_5 <- # your code here
head(ex_3_5, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- as_tibble(mtcars) |>
  mutate(across(where(is.numeric),
                ~ round((.x - mean(.x)) / sd(.x), 2)))
head(ex_3_5, 3)
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  0.15 -0.1  -0.57 -0.54  0.57 -0.61 -0.78 -0.87  1.19  0.42  0.74
#> 2  0.15 -0.1  -0.57 -0.54  0.57 -0.35 -0.46 -0.87  1.19  0.42  0.74
#> 3  0.45 -1.22 -0.99 -0.78  0.48 -0.92  0.43  1.12  1.19  0.42 -1.12
```

**Explanation:** `across(where(is.numeric), ...)` applies the same transformation to every column matching a predicate, which scales to tables of any width without naming columns. The tilde-and-dot syntax (`~ ... .x ...`) is the dplyr shorthand for an anonymous function. After `dplyr 1.1`, you can also write `\(x) round((x - mean(x))/sd(x), 2)` using the base-R lambda.

</details>

### Exercise 3.6: Recode mpg drive types to readable labels

**Task:** In `mpg`, the `drv` column uses single-letter codes (`"f"`, `"r"`, `"4"`). Recode them to `"Front-wheel"`, `"Rear-wheel"`, `"Four-wheel"` using `case_when()`. Keep only `manufacturer`, `model`, `drv` after recoding. Save to `ex_3_6` and inspect the first 5 rows.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   manufacturer model drv        
#>   <chr>        <chr> <chr>      
#> 1 audi         a4    Front-wheel
#> 2 audi         a4    Front-wheel
#> 3 audi         a4    Front-wheel
#> 4 audi         a4    Front-wheel
#> 5 audi         a4    Front-wheel
```

**Difficulty:** Intermediate

[HINTS]
Translate the short codes into readable labels, then keep only the identifying columns.
Recode `drv` inside `mutate()` with `case_when()` mapping each code, then `select(manufacturer, model, drv)`.

```r title="Your turn"
ex_3_6 <- # your code here
head(ex_3_6, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- mpg |>
  mutate(drv = case_when(
    drv == "f" ~ "Front-wheel",
    drv == "r" ~ "Rear-wheel",
    drv == "4" ~ "Four-wheel"
  )) |>
  select(manufacturer, model, drv)
head(ex_3_6, 5)
#> # A tibble: 5 x 3
#>   manufacturer model drv        
#>   <chr>        <chr> <chr>      
#> 1 audi         a4    Front-wheel
#> 2 audi         a4    Front-wheel
#> 3 audi         a4    Front-wheel
#> 4 audi         a4    Front-wheel
#> 5 audi         a4    Front-wheel
```

**Explanation:** With three exhaustive branches and no `TRUE ~` default, any unexpected code becomes `NA`, which is the desirable behaviour during data validation. If `mpg` later gains a new code (say `"e"` for electric), you would see NAs surface in downstream counts. `dplyr::recode()` does the same job in fewer characters but is being soft-deprecated in favour of `case_when()`.

</details>

### Exercise 3.7: Compute a 7-day rolling mean of Ozone

**Task:** A climatologist wants a smoother view of ozone trends in `airquality`. Add a `Ozone_7d` column that is the 7-day right-aligned rolling mean of `Ozone`, ignoring NAs within each window. Use base R only. Save the augmented tibble to `ex_3_7`.

**Expected result:**

```
#> # A tibble: 8 x 3
#>   Ozone Day Ozone_7d
#>   <int> <int>    <dbl>
#> 1    41     1    NA   
#> 2    36     2    NA   
#> 3    12     3    NA   
#> 4    18     4    NA   
#> 5    NA     5    NA   
#> 6    28     6    NA   
#> 7    23     7    26.3 
#> 8    19     8    22.7
```

**Difficulty:** Advanced

[HINTS]
For each row, average the current value with the six values before it, skipping missing days, so the first six rows have no answer.
Write a helper that loops with `seq_along()` and calls `mean(x[(i - 6):i], na.rm = TRUE)` when `i >= 7`, then add it via `mutate()`.

```r title="Your turn"
ex_3_7 <- # your code here
head(ex_3_7[, c("Ozone", "Day", "Ozone_7d")], 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
roll7 <- function(x) {
  out <- rep(NA_real_, length(x))
  for (i in seq_along(x)) {
    if (i >= 7) out[i] <- mean(x[(i - 6):i], na.rm = TRUE)
  }
  round(out, 1)
}
ex_3_7 <- as_tibble(airquality) |>
  mutate(Ozone_7d = roll7(Ozone))
head(ex_3_7[, c("Ozone", "Day", "Ozone_7d")], 8)
#> # A tibble: 8 x 3
#>   Ozone   Day Ozone_7d
#>   <int> <int>    <dbl>
#> 1    41     1     NA  
#> 2    36     2     NA  
#> 3    12     3     NA  
#> 4    18     4     NA  
#> 5    NA     5     NA  
#> 6    28     6     NA  
#> 7    23     7     26.3
#> 8    19     8     22.7
```

**Explanation:** A right-aligned rolling window of size 7 needs the previous 6 rows, so the first valid value lands on row 7. The `na.rm = TRUE` inside `mean()` lets one missing day not blank out the entire window. Production code typically uses `slider::slide_dbl()` or `zoo::rollmean()`, but rolling your own is a useful sanity check for window semantics.

</details>

### Exercise 3.8: Engineer three features on diamonds in one mutate

**Task:** An ML engineer prepping `diamonds` for a regression model wants three new features added in a single `mutate`: `log_price` (natural log of price), `price_per_carat` (price divided by carat, rounded to integer), and `is_ideal` (logical: `cut == "Ideal"`). Keep all existing columns. Save to `ex_3_8`.

**Expected result:**

```
#> # A tibble: 3 x 13
#>   carat cut     ... log_price price_per_carat is_ideal
#>   <dbl> <ord>      <dbl>       <int>    <lgl>
#> 1  0.23 Ideal    5.79        1417     TRUE 
#> 2  0.21 Premium  5.79        1552     FALSE
#> 3  0.23 Good     5.79        1421     FALSE
```

**Difficulty:** Advanced

[HINTS]
Add three derived columns in a single transformation step - a log, a ratio, and a logical flag.
Use one `mutate()` with `log(price)`, `as.integer(round(price / carat))`, and `cut == "Ideal"`.

```r title="Your turn"
ex_3_8 <- # your code here
head(ex_3_8[, c("carat", "cut", "log_price", "price_per_carat", "is_ideal")], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- diamonds |>
  mutate(
    log_price       = round(log(price), 2),
    price_per_carat = as.integer(round(price / carat)),
    is_ideal        = cut == "Ideal"
  )
head(ex_3_8[, c("carat", "cut", "log_price", "price_per_carat", "is_ideal")], 3)
#> # A tibble: 3 x 5
#>   carat cut     log_price price_per_carat is_ideal
#>   <dbl> <ord>       <dbl>           <int> <lgl>   
#> 1  0.23 Ideal        5.79            1417 TRUE    
#> 2  0.21 Premium      5.79            1552 FALSE   
#> 3  0.23 Good         5.79            1421 FALSE
```

**Explanation:** Feature engineering in one `mutate()` keeps the intermediate state out of memory and reads as a single transform. Log-pricing tames the heavy right tail of `price`, which is the variable a linear regression benefits from most. `price_per_carat` normalises across stone sizes so two diamonds of different carats are comparable. Storing the indicator as logical (not character) keeps it model-ready.

</details>

## Section 4. Reshaping and joining (9 problems)

### Exercise 4.1: Pivot a wide quarterly tibble to long form

**Task:** Build the inline tibble shown in the solution: three regions with sales in Q1, Q2, Q3, Q4 columns. Pivot it to long form with `quarter` and `sales` columns. Save the 12-row long tibble to `ex_4_1`. The expected result preserves the quarter ordering.

**Expected result:**

```
#> # A tibble: 12 x 3
#>   region quarter sales
#>   <chr>  <chr>   <dbl>
#> 1 East   Q1        120
#> 2 East   Q2        135
#> 3 East   Q3        150
#> 4 East   Q4        160
#> # 8 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
Collapse the four quarter columns into one column holding the labels and one column holding the values.
Use `pivot_longer(cols = Q1:Q4, names_to = "quarter", values_to = "sales")`.

```r title="Your turn"
wide <- tibble(
  region = c("East", "West", "North"),
  Q1 = c(120, 90, 80), Q2 = c(135, 105, 92),
  Q3 = c(150, 110, 98), Q4 = c(160, 120, 105)
)
ex_4_1 <- # your code here
head(ex_4_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
wide <- tibble(
  region = c("East", "West", "North"),
  Q1 = c(120, 90, 80), Q2 = c(135, 105, 92),
  Q3 = c(150, 110, 98), Q4 = c(160, 120, 105)
)
ex_4_1 <- wide |>
  pivot_longer(cols = Q1:Q4, names_to = "quarter", values_to = "sales")
head(ex_4_1, 4)
#> # A tibble: 4 x 3
#>   region quarter sales
#>   <chr>  <chr>   <dbl>
#> 1 East   Q1        120
#> 2 East   Q2        135
#> 3 East   Q3        150
#> 4 East   Q4        160
```

**Explanation:** Long form is the canonical shape for ggplot2 and most modelling functions because each variable lives in its own column. `pivot_longer(cols = Q1:Q4)` selects the columns to stack; `names_to` gives the destination column for the old column names. The output keeps the within-row order of original columns, so Q1 < Q2 < Q3 < Q4 holds naturally.

</details>

### Exercise 4.2: Pivot a campaign report from long to wide

**Task:** A marketing analyst has a long tibble of campaign metrics (channel, metric, value) shown in the solution. Pivot it wide so each `metric` becomes a column. The result should have one row per channel and three numeric columns: `impressions`, `clicks`, `revenue`. Save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   channel impressions clicks revenue
#>   <chr>         <dbl>  <dbl>   <dbl>
#> 1 email          5000    250     800
#> 2 social        12000    600    1500
```

**Difficulty:** Intermediate

[HINTS]
Spread the single metric column out so each distinct metric value becomes its own column.
Use `pivot_wider(names_from = metric, values_from = value)`.

```r title="Your turn"
long <- tibble(
  channel = c("email","email","email","social","social","social"),
  metric  = c("impressions","clicks","revenue","impressions","clicks","revenue"),
  value   = c(5000, 250, 800, 12000, 600, 1500)
)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long <- tibble(
  channel = c("email","email","email","social","social","social"),
  metric  = c("impressions","clicks","revenue","impressions","clicks","revenue"),
  value   = c(5000, 250, 800, 12000, 600, 1500)
)
ex_4_2 <- long |>
  pivot_wider(names_from = metric, values_from = value)
ex_4_2
#> # A tibble: 2 x 4
#>   channel impressions clicks revenue
#>   <chr>         <dbl>  <dbl>   <dbl>
#> 1 email          5000    250     800
#> 2 social        12000    600    1500
```

**Explanation:** `pivot_wider()` is the inverse of `pivot_longer()`: it spreads a key column into multiple new columns. The `names_from` argument supplies the new column names; `values_from` supplies the cells. If duplicate (channel, metric) pairs existed, you would need `values_fn = sum` (or `mean`, etc.) to disambiguate; otherwise the values would land in list-columns.

</details>

### Exercise 4.3: Reshape iris from wide to long for plotting

**Task:** Pivot `iris` so the four measurement columns become two columns (`measurement` and `value`), while `Species` stays put. Limit the result to the first 3 species rows (15 measurements) only via `head(15)`. Save to `ex_4_3` for a faceted boxplot.

**Expected result:**

```
#> # A tibble: 15 x 3
#>   Species measurement  value
#>   <fct>   <chr>        <dbl>
#> 1 setosa  Sepal.Length   5.1
#> 2 setosa  Sepal.Width    3.5
#> 3 setosa  Petal.Length   1.4
#> 4 setosa  Petal.Width    0.2
#> # 11 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Stack the four measurement columns into one name column and one value column while leaving the grouping column in place, then preview.
Use `pivot_longer(cols = -Species, names_to = "measurement", values_to = "value")` then `head(15)`.

```r title="Your turn"
ex_4_3 <- # your code here
head(ex_4_3, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- iris |>
  pivot_longer(cols = -Species,
               names_to = "measurement", values_to = "value") |>
  head(15)
head(ex_4_3, 4)
#> # A tibble: 4 x 3
#>   Species measurement  value
#>   <fct>   <chr>        <dbl>
#> 1 setosa  Sepal.Length   5.1
#> 2 setosa  Sepal.Width    3.5
#> 3 setosa  Petal.Length   1.4
#> 4 setosa  Petal.Width    0.2
```

**Explanation:** `cols = -Species` is the negative-selector shortcut for "every column except Species". The resulting long shape is ideal for ggplot2 faceting on `measurement` to compare distributions side by side. Pivoting at the very end of a wrangling pipeline (not in the middle) keeps your operations on the more efficient wide form for as long as possible.

</details>

### Exercise 4.4: Left-join customers with their latest order

**Task:** A retailer wants every customer enriched with their order info, even customers who have not yet ordered. Use `left_join()` on the inline tibbles below by `customer_id`. Save the joined tibble (3 rows) to `ex_4_4`. Unmatched customers should show `NA` in order columns.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   customer_id name     order_id amount
#>         <dbl> <chr>       <dbl>  <dbl>
#> 1           1 Anya         1001    250
#> 2           2 Borja          NA     NA
#> 3           3 Camille      1002    410
```

**Difficulty:** Intermediate

[HINTS]
Keep every customer even those with no order, filling blanks wherever order data is missing.
Use `left_join(orders, by = "customer_id")` with the customers table on the left.

```r title="Your turn"
customers <- tibble(customer_id = 1:3, name = c("Anya","Borja","Camille"))
orders <- tibble(customer_id = c(1, 3), order_id = c(1001, 1002), amount = c(250, 410))
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(customer_id = 1:3, name = c("Anya","Borja","Camille"))
orders <- tibble(customer_id = c(1, 3), order_id = c(1001, 1002), amount = c(250, 410))
ex_4_4 <- customers |>
  left_join(orders, by = "customer_id")
ex_4_4
#> # A tibble: 3 x 4
#>   customer_id name     order_id amount
#>         <int> <chr>       <dbl>  <dbl>
#> 1           1 Anya         1001    250
#> 2           2 Borja          NA     NA
#> 3           3 Camille      1002    410
```

**Explanation:** `left_join()` preserves every row of the left table and fills NAs for unmatched keys. Pick the left side deliberately: it should be the table whose row count you want to keep. If a customer has multiple orders, the row count grows on the left because each match duplicates the customer row. Use `multiple = "first"` or `"last"` in dplyr 1.1+ to control that behaviour.

</details>

### Exercise 4.5: Inner-join products to their categories

**Task:** Inner-join the `products` and `categories` inline tibbles below on `cat_id`. The result should keep only products whose category exists. Drop the `cat_id` column from the joined output and save the resulting tibble to `ex_4_5`. Expected row count is 3.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   product price category  
#>   <chr>   <dbl> <chr>     
#> 1 Pen      1.5  Stationery
#> 2 Mug      6    Kitchen   
#> 3 Notebook 4    Stationery
```

**Difficulty:** Intermediate

[HINTS]
Keep only the products whose category exists in the lookup table, then drop the join key.
Use `inner_join(categories, by = "cat_id")` then `select(-cat_id)`.

```r title="Your turn"
products <- tibble(
  product = c("Pen","Mug","Notebook","Mystery"),
  price = c(1.5, 6, 4, 99),
  cat_id = c(1, 2, 1, 9)
)
categories <- tibble(cat_id = c(1, 2), category = c("Stationery","Kitchen"))
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
products <- tibble(
  product = c("Pen","Mug","Notebook","Mystery"),
  price = c(1.5, 6, 4, 99),
  cat_id = c(1, 2, 1, 9)
)
categories <- tibble(cat_id = c(1, 2), category = c("Stationery","Kitchen"))
ex_4_5 <- products |>
  inner_join(categories, by = "cat_id") |>
  select(-cat_id)
ex_4_5
#> # A tibble: 3 x 3
#>   product  price category  
#>   <chr>    <dbl> <chr>     
#> 1 Pen        1.5 Stationery
#> 2 Mug        6   Kitchen   
#> 3 Notebook   4   Stationery
```

**Explanation:** `inner_join()` drops rows whose key has no match on either side. The "Mystery" product with cat_id 9 disappears because there is no matching category row. This is the right join when you only care about rows that exist in both tables, but be aware it silently filters: print row counts before and after to catch unintended data loss.

</details>

### Exercise 4.6: Use anti_join to find orphaned orders

**Task:** An audit team wants every order whose customer is missing from the customers table. Use `anti_join()` on the inline tibbles below to return only those orphan orders. Save to `ex_4_6`. The expected result has one row, the order for customer 9.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   customer_id order_id amount
#>         <dbl>    <dbl>  <dbl>
#> 1           9     5003    450
```

**Difficulty:** Intermediate

[HINTS]
Return only the orders whose customer is absent from the customers table.
Use `anti_join(customers, by = "customer_id")` with the orders table on the left.

```r title="Your turn"
customers <- tibble(customer_id = 1:3)
orders <- tibble(customer_id = c(1, 2, 9), order_id = c(5001, 5002, 5003), amount = c(120, 200, 450))
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(customer_id = 1:3)
orders <- tibble(customer_id = c(1, 2, 9), order_id = c(5001, 5002, 5003), amount = c(120, 200, 450))
ex_4_6 <- orders |>
  anti_join(customers, by = "customer_id")
ex_4_6
#> # A tibble: 1 x 3
#>   customer_id order_id amount
#>         <dbl>    <dbl>  <dbl>
#> 1           9     5003    450
```

**Explanation:** `anti_join()` keeps rows in the left table whose key does NOT appear in the right table, and it never adds columns from the right side. It is the cleanest way to find referential-integrity violations. The mirror operation, `semi_join()`, keeps only rows that DO have a match without adding columns either. Both are filtering joins, useful for boolean lookups.

</details>

### Exercise 4.7: Stack two daily activity logs with bind_rows

**Task:** Two days of activity logs arrive as separate tibbles (see solution). Stack them into a single tibble with `bind_rows()` and add a `.id` column called `source_day` that records which input tibble each row came from. Save to `ex_4_7`. The result should have 4 rows and 3 columns.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   source_day user_id   action
#>   <chr>        <dbl>   <chr> 
#> 1 day1            11   login 
#> 2 day1            12   click 
#> 3 day2            11   logout
#> 4 day2            13   click
```

**Difficulty:** Intermediate

[HINTS]
Stack the two logs into one table while recording which day each row originally came from.
Use `bind_rows()` with the inputs passed as named arguments and `.id = "source_day"`.

```r title="Your turn"
day1 <- tibble(user_id = c(11, 12), action = c("login","click"))
day2 <- tibble(user_id = c(11, 13), action = c("logout","click"))
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
day1 <- tibble(user_id = c(11, 12), action = c("login","click"))
day2 <- tibble(user_id = c(11, 13), action = c("logout","click"))
ex_4_7 <- bind_rows(day1 = day1, day2 = day2, .id = "source_day")
ex_4_7
#> # A tibble: 4 x 3
#>   source_day user_id action
#>   <chr>        <dbl> <chr> 
#> 1 day1            11 login 
#> 2 day1            12 click 
#> 3 day2            11 logout
#> 4 day2            13 click
```

**Explanation:** `bind_rows()` matches columns by name, not position, which is safer than `rbind()` when column orders differ. Passing the inputs as named arguments and setting `.id = "source_day"` adds a provenance column free of charge. This is the canonical pattern for stacking partition files (one CSV per day) into a single analysis-ready frame.

</details>

### Exercise 4.8: Join across mismatched key names

**Task:** A data engineer receives two tibbles whose join key is named differently on each side: `sales` has `prod_code`, `lookup` has `code`. Use `inner_join()` with `by = c("prod_code" = "code")` to attach the product name. Save to `ex_4_8`. The expected result has 2 rows and 3 columns.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   prod_code revenue product
#>   <chr>       <dbl> <chr>  
#> 1 A001          300 Apple  
#> 2 B002          450 Banana
```

**Difficulty:** Advanced

[HINTS]
Join two tables whose key column carries a different name on each side.
Use `inner_join(lookup, by = c("prod_code" = "code"))`.

```r title="Your turn"
sales  <- tibble(prod_code = c("A001","B002","Z999"), revenue = c(300, 450, 200))
lookup <- tibble(code = c("A001","B002"), product = c("Apple","Banana"))
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales  <- tibble(prod_code = c("A001","B002","Z999"), revenue = c(300, 450, 200))
lookup <- tibble(code = c("A001","B002"), product = c("Apple","Banana"))
ex_4_8 <- sales |>
  inner_join(lookup, by = c("prod_code" = "code"))
ex_4_8
#> # A tibble: 2 x 3
#>   prod_code revenue product
#>   <chr>       <dbl> <chr>  
#> 1 A001          300 Apple  
#> 2 B002          450 Banana
```

**Explanation:** The named-vector form `c("left_col" = "right_col")` tells dplyr how to map keys without renaming columns ahead of time. The result keeps the left-side column name. For multi-column joins, extend the vector: `by = c("a" = "x", "b" = "y")`. In dplyr 1.1+, the new `join_by(prod_code == code)` syntax is the preferred long-form replacement.

</details>

### Exercise 4.9: Separate a combined column into parts

**Task:** A reporting analyst received a tibble where dates are stored as `"2026-Q1"` strings in a single column. Use `separate_wider_delim()` to split the column on `"-"` into `year` and `quarter`. Save the resulting tibble to `ex_4_9`. The expected output has 4 rows and 3 columns.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   year  quarter revenue
#>   <chr> <chr>     <dbl>
#> 1 2025  Q4         1200
#> 2 2026  Q1         1500
#> 3 2026  Q2         1700
#> 4 2026  Q3         1850
```

**Difficulty:** Advanced

[HINTS]
Split the combined string column into two separate columns at its delimiter.
Use `separate_wider_delim(period, delim = "-", names = c("year", "quarter"))`.

```r title="Your turn"
sales <- tibble(
  period  = c("2025-Q4","2026-Q1","2026-Q2","2026-Q3"),
  revenue = c(1200, 1500, 1700, 1850)
)
ex_4_9 <- # your code here
ex_4_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  period  = c("2025-Q4","2026-Q1","2026-Q2","2026-Q3"),
  revenue = c(1200, 1500, 1700, 1850)
)
ex_4_9 <- sales |>
  separate_wider_delim(period, delim = "-", names = c("year","quarter"))
ex_4_9
#> # A tibble: 4 x 3
#>   year  quarter revenue
#>   <chr> <chr>     <dbl>
#> 1 2025  Q4         1200
#> 2 2026  Q1         1500
#> 3 2026  Q2         1700
#> 4 2026  Q3         1850
```

**Explanation:** `separate_wider_delim()` (tidyr 1.3+) is the modern replacement for `separate()`, with strict handling of unexpected row shapes via `too_few` and `too_many` arguments. If a row had more than one dash, the default behaviour throws an error rather than silently truncating. For regex-based splits, use `separate_wider_regex()` with a named character vector of capture groups.

</details>

## Section 5. Grouping and aggregating (8 problems)

### Exercise 5.1: Mean mpg per cylinder count in mtcars

**Task:** Group `mtcars` by `cyl` and compute the mean of `mpg` per group. Round to 2 decimals. Return a 3-row tibble with columns `cyl` and `mean_mpg`. Save to `ex_5_1`. The output gives a first signal of how fuel economy degrades with engine size.

**Expected result:**

```
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4    26.7 
#> 2     6    19.7 
#> 3     8    15.1
```

**Difficulty:** Beginner

[HINTS]
Partition the rows by engine size, then collapse each partition down to a single average.
Use `group_by(cyl)` then `summarise(mean_mpg = round(mean(mpg), 2))`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- as_tibble(mtcars) |>
  group_by(cyl) |>
  summarise(mean_mpg = round(mean(mpg), 2))
ex_5_1
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4    26.7 
#> 2     6    19.7 
#> 3     8    15.1
```

**Explanation:** `group_by()` partitions the data, `summarise()` collapses each partition to a single row per group. In dplyr 1.1+, you can skip the explicit `group_by` with `summarise(.by = cyl, mean_mpg = mean(mpg))`, which returns ungrouped output by default and avoids a common foot-gun where downstream code still sees the data as grouped.

</details>

### Exercise 5.2: Chick weight statistics per diet

**Task:** Group `ChickWeight` by `Diet` and compute count, mean weight, and standard deviation of weight (rounded to 1 decimal). Return a 4-row tibble with columns `Diet`, `n`, `mean_w`, `sd_w`. Save to `ex_5_2` so a sports nutrition team can compare diet effects.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   Diet      n mean_w  sd_w
#>   <fct> <int>  <dbl> <dbl>
#> 1 1       220   102.   56.7
#> 2 2       120   123.   71.6
#> 3 3       120   143.   84.5
#> 4 4       118   135.   68.8
```

**Difficulty:** Intermediate

[HINTS]
Split the rows by diet, then collapse each group into a count and two summary statistics.
Use `group_by(Diet)` then `summarise()` with `n()`, `round(mean(weight), 1)`, and `round(sd(weight), 1)`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ChickWeight |>
  as_tibble() |>
  group_by(Diet) |>
  summarise(
    n      = n(),
    mean_w = round(mean(weight), 1),
    sd_w   = round(sd(weight), 1)
  )
ex_5_2
#> # A tibble: 4 x 4
#>   Diet      n mean_w  sd_w
#>   <fct> <int>  <dbl> <dbl>
#> 1 1       220  102.   56.7
#> 2 2       120  123.   71.6
#> 3 3       120  143.   84.5
#> 4 4       118  135.   68.8
```

**Explanation:** `n()` is a special dplyr helper that returns the row count of the current group; it only works inside dplyr verbs. Reporting `n` alongside means and sds is a habit worth keeping: a group of size 5 with a low standard deviation tells a very different story than a group of size 500 with the same value. Reviewers can ignore noisy small groups easily.

</details>

### Exercise 5.3: Mean price and count per diamond cut

**Task:** A jeweller wants a single table showing the count and mean price (integer) per `cut` of `diamonds`. Order the rows by mean price descending. Save the 5-row tibble to `ex_5_3` and inspect with `print()`. The expected output shows Premium tops mean price even ahead of Ideal.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   cut           n mean_price
#>   <ord>     <int>      <int>
#> 1 Premium   13791       4584
#> 2 Fair       1610       4359
#> 3 Very Good 12082       3982
#> 4 Good       4906       3929
#> 5 Ideal     21551       3458
```

**Difficulty:** Intermediate

[HINTS]
Aggregate the count and average price for each cut, then order the result by price.
Use `group_by(cut)`, `summarise(n = n(), mean_price = as.integer(mean(price)))`, then `arrange(desc(mean_price))`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- diamonds |>
  group_by(cut) |>
  summarise(n = n(), mean_price = as.integer(mean(price))) |>
  arrange(desc(mean_price))
ex_5_3
#> # A tibble: 5 x 3
#>   cut           n mean_price
#>   <ord>     <int>      <int>
#> 1 Premium   13791       4584
#> 2 Fair       1610       4359
#> 3 Very Good 12082       3982
#> 4 Good       4906       3929
#> 5 Ideal     21551       3458
```

**Explanation:** Premium cuts costing more on average than Ideal cuts is a classic Simpson's paradox setup: bigger stones tend to receive Premium rather than Ideal grading, and size dominates the price. Reporting both `n` and `mean_price` is what lets a reader spot that the lower-priced groups are also numerically dominant.

</details>

### Exercise 5.4: Top colors by frequency in diamonds

**Task:** Count diamonds by `color` and sort descending. Use `count()` (which is the shortcut for `group_by + summarise(n=n())`). Save the resulting 7-row tibble to `ex_5_4`. The expected result shows G is the most common color, an unintuitive finding worth flagging.

**Expected result:**

```
#> # A tibble: 7 x 2
#>   color     n
#>   <ord> <int>
#> 1 G     11292
#> 2 E      9797
#> 3 F      9542
#> 4 H      8304
#> 5 D      6775
#> 6 I      5422
#> 7 J      2808
```

**Difficulty:** Intermediate

[HINTS]
Produce a frequency table of one column ordered from most to least common.
Use `count(color, sort = TRUE)`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- diamonds |>
  count(color, sort = TRUE)
ex_5_4
#> # A tibble: 7 x 2
#>   color     n
#>   <ord> <int>
#> 1 G     11292
#> 2 E      9797
#> 3 F      9542
#> 4 H      8304
#> 5 D      6775
#> 6 I      5422
#> 7 J      2808
```

**Explanation:** `count(x, sort = TRUE)` is the most concise way to produce a frequency table sorted descending. The output column is always named `n`, and the input columns are preserved as the grouping keys. For weighted counts (sum of a numeric column rather than row count), pass `wt = some_column`; this is handy when each row already carries a frequency.

</details>

### Exercise 5.5: Top two cars per cylinder count by mpg

**Task:** An analyst running a within-class comparison wants the two most fuel-efficient cars per cylinder group in `mtcars`. Group by `cyl`, then keep the top 2 rows by `mpg` within each group. Return a tibble with row name as `model`, plus `cyl` and `mpg`. Save to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   model            cyl   mpg
#>   <chr>          <dbl> <dbl>
#> 1 Toyota Corolla     4  33.9
#> 2 Fiat 128           4  32.4
#> 3 Hornet 4 Drive     6  21.4
#> 4 Mazda RX4          6  21  
#> 5 Pontiac Firebird   8  19.2
#> 6 Hornet Sportabout  8  18.7
```

**Difficulty:** Intermediate

[HINTS]
Move the model names into a real column, then keep the two best rows within each cylinder group.
Use `tibble::rownames_to_column("model")`, `group_by(cyl)`, and `slice_max(mpg, n = 2, with_ties = FALSE)`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- mtcars |>
  tibble::rownames_to_column("model") |>
  group_by(cyl) |>
  slice_max(mpg, n = 2, with_ties = FALSE) |>
  ungroup() |>
  select(model, cyl, mpg)
ex_5_5
#> # A tibble: 6 x 3
#>   model              cyl   mpg
#>   <chr>            <dbl> <dbl>
#> 1 Toyota Corolla       4  33.9
#> 2 Fiat 128             4  32.4
#> 3 Hornet 4 Drive       6  21.4
#> 4 Mazda RX4            6  21  
#> 5 Pontiac Firebird     8  19.2
#> 6 Hornet Sportabout    8  18.7
```

**Explanation:** `slice_max()` after `group_by()` produces a within-group top-N rather than an overall top-N. Setting `with_ties = FALSE` keeps the row count deterministic at exactly 2 per group, which matters for reporting. Forgetting to `ungroup()` is a common pitfall: downstream mutates will quietly run per-group, sometimes giving surprising results.

</details>

### Exercise 5.6: Summarise every numeric column at once

**Task:** Compute the mean of every numeric column of `iris`, grouped by `Species`. Use `summarise(across(...))` to avoid naming columns. Round to 2 decimals. Return a 3-row tibble (one per species). Save to `ex_5_6` for a per-species feature summary.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   Species    Sepal.Length Sepal.Width Petal.Length Petal.Width
#>   <fct>             <dbl>       <dbl>        <dbl>       <dbl>
#> 1 setosa             5.01        3.43         1.46        0.25
#> 2 versicolor         5.94        2.77         4.26        1.33
#> 3 virginica          6.59        2.97         5.55        2.03
```

**Difficulty:** Intermediate

[HINTS]
For each species, average every numeric column at once without listing them by name.
Use `group_by(Species)` then `summarise(across(where(is.numeric), ~ round(mean(.x), 2)))`.

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), ~ round(mean(.x), 2)))
ex_5_6
#> # A tibble: 3 x 5
#>   Species    Sepal.Length Sepal.Width Petal.Length Petal.Width
#>   <fct>             <dbl>       <dbl>        <dbl>       <dbl>
#> 1 setosa             5.01        3.43         1.46        0.25
#> 2 versicolor         5.94        2.77         4.26        1.33
#> 3 virginica          6.59        2.97         5.55        2.03
```

**Explanation:** `across(where(is.numeric), fn)` is the wide-summary idiom: it touches every column matching the predicate without naming any of them. For multiple summary functions, pass a named list: `across(where(is.numeric), list(mean = mean, sd = sd))`, which produces columns like `Sepal.Length_mean`, `Sepal.Length_sd`, and so on.

</details>

### Exercise 5.7: Cumulative deposits per account month

**Task:** A finance team monitoring inflows wants a running total of deposits per account. Group the inline tibble by `account`, arrange by `month`, then add a `cum_amount` column using `cumsum()` per group. Save the 6-row tibble to `ex_5_7` for the next standup.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   account month amount cum_amount
#>   <chr>   <int>  <dbl>      <dbl>
#> 1 A           1    100        100
#> 2 A           2    150        250
#> 3 A           3    200        450
#> 4 B           1     50         50
#> 5 B           2     75        125
#> 6 B           3    100        225
```

**Difficulty:** Advanced

[HINTS]
Within each account, order by month and build a running total that restarts for every account.
Use `group_by(account)`, `arrange(month, .by_group = TRUE)`, and `mutate(cum_amount = cumsum(amount))`.

```r title="Your turn"
deposits <- tibble(
  account = c("A","A","A","B","B","B"),
  month   = c(1,2,3,1,2,3),
  amount  = c(100,150,200,50,75,100)
)
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deposits <- tibble(
  account = c("A","A","A","B","B","B"),
  month   = c(1,2,3,1,2,3),
  amount  = c(100,150,200,50,75,100)
)
ex_5_7 <- deposits |>
  group_by(account) |>
  arrange(month, .by_group = TRUE) |>
  mutate(cum_amount = cumsum(amount)) |>
  ungroup()
ex_5_7
#> # A tibble: 6 x 4
#>   account month amount cum_amount
#>   <chr>   <dbl>  <dbl>      <dbl>
#> 1 A           1    100        100
#> 2 A           2    150        250
#> 3 A           3    200        450
#> 4 B           1     50         50
#> 5 B           2     75        125
#> 6 B           3    100        225
```

**Explanation:** `mutate()` inside `group_by()` runs the calculation per group, which is what makes `cumsum()` restart at each account. The `.by_group = TRUE` flag on `arrange()` is essential: without it, `arrange` reorders the whole frame and the cumulative sum will follow the wrong order within accounts. Always remember to `ungroup()` afterward.

</details>

### Exercise 5.8: Compute share of total within each cut

**Task:** Compute the share each color contributes to the count of diamonds within its `cut`. Return a tibble with `cut`, `color`, `n`, and `share` (rounded to 3 decimals). Save to `ex_5_8`. Within each cut, shares should sum to 1.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   cut   color     n share
#>   <ord> <ord> <int> <dbl>
#> 1 Fair  D       163 0.101
#> 2 Fair  E       224 0.139
#> 3 Fair  F       312 0.194
#> 4 Fair  G       314 0.195
#> 5 Fair  H       303 0.188
#> 6 Fair  I       175 0.109
```

**Difficulty:** Advanced

[HINTS]
Count each cut-and-color pair, then express each count as its fraction of that cut's total.
Use `count(cut, color)`, then `group_by(cut)` and `mutate(share = round(n / sum(n), 3))`.

```r title="Your turn"
ex_5_8 <- # your code here
head(ex_5_8, 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- diamonds |>
  count(cut, color) |>
  group_by(cut) |>
  mutate(share = round(n / sum(n), 3)) |>
  ungroup()
head(ex_5_8, 6)
#> # A tibble: 6 x 4
#>   cut   color     n share
#>   <ord> <ord> <int> <dbl>
#> 1 Fair  D       163 0.101
#> 2 Fair  E       224 0.139
#> 3 Fair  F       312 0.194
#> 4 Fair  G       314 0.195
#> 5 Fair  H       303 0.188
#> 6 Fair  I       175 0.109
```

**Explanation:** The pattern `count() |> group_by() |> mutate(share = n / sum(n))` is the canonical way to express "what fraction of each group does this subgroup represent". Because `mutate()` is grouped, `sum(n)` resolves to the within-group total, not the global total. Drop the `group_by()` if you want global shares instead.

</details>

## Section 6. Cleaning, strings, and dates (6 problems)

### Exercise 6.1: Drop rows with any missing values

**Task:** Drop every row of `airquality` that has at least one missing value across any column. Return the cleaned tibble and save to `ex_6_1`. Inspect the row count: expect 111 (down from 153) once you keep only complete cases.

**Expected result:**

```
#> [1] 111
```

**Difficulty:** Beginner

[HINTS]
Keep only the rows that are complete across every single column.
Use `tidyr::drop_na()` with no arguments.

```r title="Your turn"
ex_6_1 <- # your code here
nrow(ex_6_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- airquality |>
  tidyr::drop_na()
nrow(ex_6_1)
#> [1] 111
```

**Explanation:** `drop_na()` with no arguments drops rows where any column is NA; pass column names to restrict the check. Base R equivalent is `na.omit()` or `df[complete.cases(df), ]`. Always print the row count before and after dropping so you know how much data you spent: losing 42 rows out of 153 is significant and might warrant imputation instead.

</details>

### Exercise 6.2: Fill missing Ozone with the column median

**Task:** A junior analyst wants to fill missing `Ozone` values in `airquality` with the median of the observed values, rather than dropping the rows. Replace NAs in `Ozone` only, leave every other column untouched. Save the imputed tibble to `ex_6_2`.

**Expected result:**

```
#> [1] 0
#> [1] 31.5
```

**Difficulty:** Intermediate

[HINTS]
Replace only the missing values in one column with a central value computed from the observed values.
In `mutate()`, use `if_else(is.na(Ozone), median(Ozone, na.rm = TRUE), as.numeric(Ozone))`.

```r title="Your turn"
ex_6_2 <- # your code here
sum(is.na(ex_6_2$Ozone))
median(ex_6_2$Ozone)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- airquality |>
  mutate(Ozone = if_else(is.na(Ozone), median(Ozone, na.rm = TRUE), as.numeric(Ozone)))
sum(is.na(ex_6_2$Ozone))
#> [1] 0
median(ex_6_2$Ozone)
#> [1] 31.5
```

**Explanation:** Median imputation is robust to outliers but biases distributions: it inflates the median frequency. The `as.numeric(Ozone)` cast guards against `if_else`'s strict type matching, since `Ozone` is integer but the median is numeric. For modelling, prefer multiple imputation (`mice` package) over single-value imputation when more than a few percent of rows are missing.

</details>

### Exercise 6.3: Normalise messy product names

**Task:** A retail dataset arrived with inconsistent product capitalisation and trailing whitespace. Take the inline tibble below and clean the `product` column by trimming whitespace and converting to title case. Save the cleaned 3-row tibble to `ex_6_3`. The expected output shows clean, comparable strings.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   product     price
#>   <chr>       <dbl>
#> 1 Red Apple     1.5
#> 2 Green Apple   1.7
#> 3 Banana        0.6
```

**Difficulty:** Intermediate

[HINTS]
Make the text comparable by stripping stray surrounding spaces and standardising the capitalisation.
In `mutate()`, combine `str_trim()` with `str_to_title()` on the `product` column.

```r title="Your turn"
messy <- tibble(
  product = c("  red apple ", "GREEN APPLE", "banana  "),
  price = c(1.5, 1.7, 0.6)
)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
messy <- tibble(
  product = c("  red apple ", "GREEN APPLE", "banana  "),
  price = c(1.5, 1.7, 0.6)
)
ex_6_3 <- messy |>
  mutate(product = str_to_title(str_trim(product)))
ex_6_3
#> # A tibble: 3 x 2
#>   product     price
#>   <chr>       <dbl>
#> 1 Red Apple     1.5
#> 2 Green Apple   1.7
#> 3 Banana        0.6
```

**Explanation:** `str_trim()` removes leading and trailing whitespace, and `str_to_title()` capitalises the first letter of each word. Doing both in one step is essential before deduplication or joins: `"  red apple "` and `"Red Apple"` are different strings to R until they are normalised. For locale-aware casing (Turkish, German), supply the `locale` argument.

</details>

### Exercise 6.4: Flag campaigns with a target keyword

**Task:** A marketing analyst auditing campaign names wants to flag every row whose `campaign` contains the substring `"holiday"` (case-insensitive). Use `str_detect()` to add a logical `is_holiday` column. Save the 4-row tibble to `ex_6_4`. The expected result shows two TRUE rows.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   campaign            spend is_holiday
#>   <chr>               <dbl> <lgl>     
#> 1 Holiday Email Q4     1200 TRUE      
#> 2 Spring Sale           800 FALSE     
#> 3 holiday flash promo   500 TRUE      
#> 4 New Product Launch    900 FALSE
```

**Difficulty:** Intermediate

[HINTS]
Add a logical column that records whether a keyword appears, regardless of letter case.
In `mutate()`, use `str_detect(campaign, regex("holiday", ignore_case = TRUE))`.

```r title="Your turn"
campaigns <- tibble(
  campaign = c("Holiday Email Q4","Spring Sale","holiday flash promo","New Product Launch"),
  spend = c(1200, 800, 500, 900)
)
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
campaigns <- tibble(
  campaign = c("Holiday Email Q4","Spring Sale","holiday flash promo","New Product Launch"),
  spend = c(1200, 800, 500, 900)
)
ex_6_4 <- campaigns |>
  mutate(is_holiday = str_detect(campaign, regex("holiday", ignore_case = TRUE)))
ex_6_4
#> # A tibble: 4 x 3
#>   campaign            spend is_holiday
#>   <chr>               <dbl> <lgl>     
#> 1 Holiday Email Q4     1200 TRUE      
#> 2 Spring Sale           800 FALSE     
#> 3 holiday flash promo   500 TRUE      
#> 4 New Product Launch    900 FALSE
```

**Explanation:** Wrapping the pattern in `regex(..., ignore_case = TRUE)` handles mixed capitalisation without lower-casing the source column, which would lose information. For exact-match (non-regex) substring search, `fixed("holiday")` is much faster and avoids regex pitfalls with metacharacters like `.` and `*`. Save the regex flag at the pattern, not the column.

</details>

### Exercise 6.5: Parse character dates and extract year and month

**Task:** An analyst received a tibble where the `date` column is stored as character strings in `"YYYY-MM-DD"` format. Parse them with `as.Date()`, then add `year` and `month` columns using `lubridate::year()` and `lubridate::month()`. Save the 4-row tibble to `ex_6_5`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   date       sales  year month
#>   <date>     <dbl> <dbl> <dbl>
#> 1 2026-01-15   200  2026     1
#> 2 2026-02-10   180  2026     2
#> 3 2026-03-22   210  2026     3
#> 4 2026-04-05   250  2026     4
```

**Difficulty:** Intermediate

[HINTS]
Convert the text dates into real date values, then pull the year and month parts out of them.
Use one `mutate()` with `as.Date(date)`, `year(date)`, and `month(date)`.

```r title="Your turn"
raw <- tibble(
  date = c("2026-01-15","2026-02-10","2026-03-22","2026-04-05"),
  sales = c(200, 180, 210, 250)
)
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- tibble(
  date = c("2026-01-15","2026-02-10","2026-03-22","2026-04-05"),
  sales = c(200, 180, 210, 250)
)
ex_6_5 <- raw |>
  mutate(
    date  = as.Date(date),
    year  = year(date),
    month = month(date)
  )
ex_6_5
#> # A tibble: 4 x 4
#>   date       sales  year month
#>   <date>     <dbl> <dbl> <dbl>
#> 1 2026-01-15   200  2026     1
#> 2 2026-02-10   180  2026     2
#> 3 2026-03-22   210  2026     3
#> 4 2026-04-05   250  2026     4
```

**Explanation:** Parsing dates eagerly (right after import) prevents string-comparison bugs where `"2026-01-15"` is "less than" `"2026-9-1"` lexicographically. `lubridate::ymd()` is a more forgiving alternative to `as.Date()` because it can auto-detect minor format variations like `"20260115"`. Once you have a Date object, every part-extraction function (`year`, `month`, `wday`, `yday`) just works.

</details>

### Exercise 6.6: Split a name column into first and last

**Task:** Take the inline tibble with a single `full_name` column and split it into `first` and `last` columns at the space delimiter using `separate_wider_delim()`. Save the result to `ex_6_6`. The expected result has 3 rows and 2 columns.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   first  last    
#>   <chr>  <chr>   
#> 1 Anya   Petrova 
#> 2 Borja  Sanchez 
#> 3 Camille Dubois
```

**Difficulty:** Advanced

[HINTS]
Split the single name column into two columns at the space between the words.
Use `separate_wider_delim(full_name, delim = " ", names = c("first", "last"))`.

```r title="Your turn"
people <- tibble(full_name = c("Anya Petrova","Borja Sanchez","Camille Dubois"))
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
people <- tibble(full_name = c("Anya Petrova","Borja Sanchez","Camille Dubois"))
ex_6_6 <- people |>
  separate_wider_delim(full_name, delim = " ", names = c("first","last"))
ex_6_6
#> # A tibble: 3 x 2
#>   first   last   
#>   <chr>   <chr>  
#> 1 Anya    Petrova
#> 2 Borja   Sanchez
#> 3 Camille Dubois
```

**Explanation:** `separate_wider_delim()` is strict: a row with no space, or with more than one space, would error by default. Control that with `too_few = "align_start"` or `too_many = "merge"`. For multi-part names (`"Mary Jane Smith"`), prefer regex with `separate_wider_regex()` to keep the middle part with the first or last name based on a rule.

</details>

## Section 7. End-to-end pipelines (4 problems)

### Exercise 7.1: Clean, filter, and pivot a sales report

**Task:** A compliance officer hands you the messy inline tibble in the solution. Trim whitespace from `region`, drop rows with NA in `sales`, then pivot wider so each region becomes its own column with month as rows. Save the result to `ex_7_1`. The expected output is a 3-row, 3-column tibble.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   month   East  West
#>   <chr>  <dbl> <dbl>
#> 1 Jan      100    80
#> 2 Feb      120    90
#> 3 Mar      130    95
```

**Difficulty:** Intermediate

[HINTS]
Clean the region text and drop the incomplete rows before reshaping, or the spread will fragment into stray columns.
Chain `mutate(region = str_trim(region))`, `drop_na(sales)`, then `pivot_wider(names_from = region, values_from = sales)`.

```r title="Your turn"
raw <- tibble(
  region = c(" East ","East ","East","West","West","West"," East "),
  month  = c("Jan","Feb","Mar","Jan","Feb","Mar","Apr"),
  sales  = c(100, 120, 130, 80, 90, 95, NA)
)
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- tibble(
  region = c(" East ","East ","East","West","West","West"," East "),
  month  = c("Jan","Feb","Mar","Jan","Feb","Mar","Apr"),
  sales  = c(100, 120, 130, 80, 90, 95, NA)
)
ex_7_1 <- raw |>
  mutate(region = str_trim(region)) |>
  drop_na(sales) |>
  pivot_wider(names_from = region, values_from = sales)
ex_7_1
#> # A tibble: 3 x 3
#>   month   East  West
#>   <chr>  <dbl> <dbl>
#> 1 Jan      100    80
#> 2 Feb      120    90
#> 3 Mar      130    95
```

**Explanation:** Cleaning before pivoting matters: if you pivot first, `"East "` and `"East"` become two separate columns. The `drop_na(sales)` step removes the unmatched April row that had no value; otherwise `pivot_wider` would emit an extra row of NAs. Stacking small transformations in a clear order is the heart of every reliable wrangling pipeline.

</details>

### Exercise 7.2: Engineer diamonds features then aggregate by tier

**Task:** Build a feature-then-aggregate pipeline on `diamonds`: bin price into 3 tiers (budget < 1000, mid < 5000, premium), add `log_price`, then per tier return count and median `carat` (2 decimals) and median `log_price` (2 decimals). Save the 3-row tibble to `ex_7_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   tier        n med_carat med_log_price
#>   <chr>   <int>     <dbl>         <dbl>
#> 1 budget  14499      0.32          6.49
#> 2 mid     28907      0.79          7.74
#> 3 premium 10534      1.51          8.83
```

**Difficulty:** Advanced

[HINTS]
Engineer a tier label and a log column first, then collapse to one row per tier carrying a count and two medians.
In `mutate()` build a `case_when()` tier and `log(price)`, then `group_by(tier)` and `summarise()` with `n()` and `median()`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- diamonds |>
  mutate(
    tier      = case_when(
      price < 1000 ~ "budget",
      price < 5000 ~ "mid",
      TRUE         ~ "premium"
    ),
    log_price = log(price)
  ) |>
  group_by(tier) |>
  summarise(
    n             = n(),
    med_carat     = round(median(carat), 2),
    med_log_price = round(median(log_price), 2)
  ) |>
  arrange(med_log_price)
ex_7_2
#> # A tibble: 3 x 4
#>   tier        n med_carat med_log_price
#>   <chr>   <int>     <dbl>         <dbl>
#> 1 budget  14499      0.32          6.49
#> 2 mid     28907      0.79          7.74
#> 3 premium 10534      1.51          8.83
```

**Explanation:** Feature engineering then aggregation is the bread-and-butter analyst pipeline. Median values are reported instead of means because price distributions are right-skewed; the median resists outliers. `arrange(med_log_price)` keeps tiers in price order regardless of the (alphabetical) tier labels, which makes the output unambiguous.

</details>

### Exercise 7.3: Top-selling product per region

**Task:** A retailer wants the single best-selling product (by revenue) within each region. Join the inline `sales` and `products` tibbles, sum revenue per (region, product), then keep only the top row per region. Save the 2-row tibble to `ex_7_3`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   region product revenue
#>   <chr>  <chr>     <dbl>
#> 1 East   Mug         600
#> 2 West   Pen         450
```

**Difficulty:** Advanced

[HINTS]
Attach the product names, total the revenue for each region-and-product pair, then keep only the single best pair per region.
Use `inner_join(products, by = "prod_id")`, a grouped `summarise(revenue = sum(revenue))`, then `slice_max(revenue, n = 1)` grouped by region.

```r title="Your turn"
sales <- tibble(
  region = c("East","East","East","West","West","West"),
  prod_id = c(1,2,2,1,2,1),
  revenue = c(200, 300, 300, 450, 100, 200)
)
products <- tibble(prod_id = c(1,2), product = c("Pen","Mug"))
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  region = c("East","East","East","West","West","West"),
  prod_id = c(1,2,2,1,2,1),
  revenue = c(200, 300, 300, 450, 100, 200)
)
products <- tibble(prod_id = c(1,2), product = c("Pen","Mug"))
ex_7_3 <- sales |>
  inner_join(products, by = "prod_id") |>
  group_by(region, product) |>
  summarise(revenue = sum(revenue), .groups = "drop") |>
  group_by(region) |>
  slice_max(revenue, n = 1, with_ties = FALSE) |>
  ungroup()
ex_7_3
#> # A tibble: 2 x 3
#>   region product revenue
#>   <chr>  <chr>     <dbl>
#> 1 East   Mug         600
#> 2 West   Pen         450
```

**Explanation:** This is the classic "top-N per group" idiom: aggregate to the level you care about, then `slice_max()` within group. The double `group_by()` is intentional: the first groups for the sum, the second isolates each region before ranking. `.groups = "drop"` is good hygiene; it ungroups before the next operation so you do not have to remember.

</details>

### Exercise 7.4: Reshape, aggregate, and rank a long activity log

**Task:** Reshape the inline long activity log into one row per user with action counts as columns, then add a `total` column (sum of all action counts) and rank users descending by total using `dense_rank()`. Save the resulting 3-row tibble to `ex_7_4`. The expected output has columns: `user`, `click`, `login`, `total`, `rank`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   user  click login total  rank
#>   <chr> <int> <int> <int> <int>
#> 1 alice     3     1     4     1
#> 2 carol     2     1     3     2
#> 3 bob       1     1     2     3
```

**Difficulty:** Advanced

[HINTS]
Turn the long log into one row per user with action counts as columns, then add a total and a rank.
Use `count()` then `pivot_wider()` with `values_fill = 0`, and `mutate()` a `total` plus `dense_rank(desc(total))`.

```r title="Your turn"
log <- tibble(
  user = c("alice","alice","alice","alice","bob","bob","carol","carol","carol"),
  action = c("click","click","login","click","login","click","click","login","click")
)
ex_7_4 <- # your code here
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log <- tibble(
  user = c("alice","alice","alice","alice","bob","bob","carol","carol","carol"),
  action = c("click","click","login","click","login","click","click","login","click")
)
ex_7_4 <- log |>
  count(user, action) |>
  pivot_wider(names_from = action, values_from = n, values_fill = 0) |>
  mutate(total = click + login,
         rank  = dense_rank(desc(total))) |>
  arrange(rank)
ex_7_4
#> # A tibble: 3 x 5
#>   user  click login total  rank
#>   <chr> <int> <int> <int> <int>
#> 1 alice     3     1     4     1
#> 2 carol     2     1     3     2
#> 3 bob       1     1     2     3
```

**Explanation:** `count() |> pivot_wider()` is the idiom for turning a long event log into a wide feature matrix. `values_fill = 0` ensures missing combinations become 0 rather than NA, which matters when you add columns afterwards. `dense_rank(desc(total))` ranks descending without gaps in tie cases; switch to `min_rank()` if you want ties to skip ranks.

</details>

## What to do next

Now that you have worked through 50 wrangling problems, deepen each pillar with a focused practice hub:

- [dplyr Exercises in R](dplyr-Exercises-in-R.html): forty more drills on `filter`, `mutate`, `summarise`, joins, and `across()`.
- [tidyverse Exercises in R](tidyverse-Exercises-in-R.html): cross-package practice that mixes dplyr, tidyr, stringr, and lubridate.
- [data.table Exercises in R](data.table-Exercises-in-R.html): the same operations expressed in the fast `[i, j, by]` idiom.
- [EDA Exercises in R](EDA-Exercises-in-R.html): take wrangled data into exploratory summaries and visual diagnostics.
