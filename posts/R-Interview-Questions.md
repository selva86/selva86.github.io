---
title: "R Interview Questions: 50 Coding Problems with Solutions (2026)"
slug: "R-Interview-Questions"
description: "50 R interview coding problems with full solutions, expected output, and explanations. Covers wrangling, stats, ggplot2, apply family, and performance."
keywords: "R interview questions, R coding interview, R programming interview, R technical interview, R data science interview, R interview prep"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "R Interview Questions"
sidebar_order: 105
fr_parent: "Is-R-Worth-Learning-in-2026.html"
auto_link_terms: "R interview questions|R coding interview|R programming interview|R technical interview|R interview prep"
auto_link_case_sensitive: false
target_keyword: "R interview questions"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Interview Questions: 50 Coding Problems with Solutions

<p class="lead">Fifty live-coding problems that mirror what actually gets asked in junior, mid, and senior R interviews. Each problem ships with the exact expected output, a hidden full solution, and an explanation of why the idiomatic answer beats the obvious one. Use it as a drill sheet the week before your screen.</p>

The questions are grouped into six themes that hiring managers cycle through: fundamentals, dplyr wrangling, the apply family and functional programming, statistics, ggplot2, and performance plus advanced topics. Solutions stay hidden until you click. Edit the "Your turn" block in place, press Run, and check your answer against the expected output before you peek.

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(ggplot2)
library(purrr)
library(microbenchmark)
library(data.table)
```

## Section 1. R fundamentals and data types (9 problems)

These warm-ups cover the questions every first-round screen leads with: atomic types, vectorisation, `NA` handling, and the `<-` versus `=` debate. Most are Beginner; two stretch into Intermediate.

### Exercise 1.1: Identify the atomic type of an R object

**Task:** An interviewer hands you four objects and asks for the underlying storage type of each one. Given the values `42`, `42L`, `"42"`, and `TRUE`, use `typeof()` to inspect each and return a named character vector. Save the result to `ex_1_1`.

**Expected result:**

```
#>     double    integer  character    logical
#>   "double"  "integer" "character"  "logical"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- c(
  double    = typeof(42),
  integer   = typeof(42L),
  character = typeof("42"),
  logical   = typeof(TRUE)
)
ex_1_1
#>     double    integer  character    logical
#>   "double"  "integer" "character"  "logical"
```

**Explanation:** `42` is stored as a double even though it looks like a whole number; the `L` suffix forces integer storage. Interviewers reach for this question because beginners often answer `class(42)` (which returns `"numeric"`) and miss the deeper distinction. `typeof()` reports the C-level storage mode, which is what matters for memory and speed. Useful sibling: `is.integer()` to test cheaply.

</details>

### Exercise 1.2: Filter a vector with a logical condition

**Task:** Given the numeric vector `x <- c(10, 22, 7, 35, 18, 4, 41)`, return the elements greater than 20 using logical subsetting rather than a `for` loop. Save the filtered vector to `ex_1_2`.

**Expected result:**

```
#> [1] 22 35 41
```

**Difficulty:** Beginner

```r title="Your turn"
x <- c(10, 22, 7, 35, 18, 4, 41)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- c(10, 22, 7, 35, 18, 4, 41)
ex_1_2 <- x[x > 20]
ex_1_2
#> [1] 22 35 41
```

**Explanation:** `x > 20` returns a logical vector the same length as `x`, and bracket-indexing with a logical vector keeps positions where the condition is `TRUE`. This is the bread-and-butter vectorised filter pattern: no loop, no branching, runs in C. A common wrong answer reaches for `subset(x, x > 20)`, which works but is reserved for data frames in idiomatic style.

</details>

### Exercise 1.3: Convert a character vector to numeric safely

**Task:** A data analyst inherits the messy vector `vals <- c("12.5", "8", "NA", "abc", "17")` and needs it as numeric, with non-parseable strings turned into `NA` instead of throwing an error. Convert it and save the cleaned numeric vector to `ex_1_3`.

**Expected result:**

```
#> [1] 12.5  8.0   NA   NA  17.0
#> Warning message:
#> NAs introduced by coercion
```

**Difficulty:** Beginner

```r title="Your turn"
vals <- c("12.5", "8", "NA", "abc", "17")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vals <- c("12.5", "8", "NA", "abc", "17")
ex_1_3 <- as.numeric(vals)
ex_1_3
#> [1] 12.5  8.0   NA   NA  17.0
#> Warning message:
#> NAs introduced by coercion
```

**Explanation:** `as.numeric()` parses each string and coerces anything unparseable to `NA` with one warning. The classic wrong move is `as.numeric(as.factor(vals))`, which silently returns factor levels (1, 2, 3...) instead of the original numbers. If you genuinely want to suppress the warning, wrap in `suppressWarnings()`; if you want to flag bad values explicitly, use `readr::parse_number()` which surfaces problems via `problems()`.

</details>

### Exercise 1.4: Count missing values per column of a data frame

**Task:** Given `airquality` (a built-in dataset with `NA` values in several columns), compute the number of missing values in each column. Return a named integer vector sorted descending by count, and save it to `ex_1_4`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- sort(sapply(airquality, function(col) sum(is.na(col))), decreasing = TRUE)
ex_1_4
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** `sapply()` walks the columns (a data frame is internally a list), and `sum(is.na(col))` exploits the fact that `TRUE` coerces to `1` when summed. Sorting descending puts the worst-offender columns first, which is exactly what data quality dashboards report. A common slip is `colSums(is.na(airquality))` (correct but unsorted) or `mean(is.na(...))` if the interviewer wants proportions instead of counts.

</details>

### Exercise 1.5: Distinguish vector, list, and data frame structure

**Task:** Build three objects with three elements each: a numeric vector `v`, a heterogeneous list `l` containing a number, a string, and a logical, and a data frame `d` with columns `id` and `name`. Return a named character vector reporting `class()` of each, saved as `ex_1_5`.

**Expected result:**

```
#>          v          l          d
#>  "numeric"     "list" "data.frame"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(1, 2, 3)
l <- list(1, "two", TRUE)
d <- data.frame(id = 1:3, name = c("a", "b", "c"))
ex_1_5 <- c(v = class(v), l = class(l), d = class(d))
ex_1_5
#>          v          l          d
#>  "numeric"     "list" "data.frame"
```

**Explanation:** A vector forces every element to share one atomic type; a list relaxes that and lets you nest anything (including other lists); a data frame is a list of equal-length atomic vectors with column names. The interview trap is "is a data frame just a matrix?": no, matrices coerce every cell to one type, while data frames let columns differ. `tibble::tibble()` is the modern variant with stricter printing rules.

</details>

### Exercise 1.6: Replace a loop with a vectorised expression

**Task:** A junior wrote a `for` loop to compute the running square of `1:10` into a numeric vector. Rewrite it as a single vectorised expression that produces an integer vector of length 10. Save the result to `ex_1_6`.

**Expected result:**

```
#>  [1]   1   4   9  16  25  36  49  64  81 100
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- (1:10)^2
ex_1_6
#>  [1]   1   4   9  16  25  36  49  64  81 100
```

**Explanation:** R arithmetic operators are vectorised: `^` is applied element-wise without any loop in R code (the loop runs in C, ~50x faster). The interviewer is checking that you reach for vectorisation reflexively rather than writing `for (i in 1:10) out[i] <- i^2`. The mental model: think of operations as transformations over whole vectors, not iterations over elements. `sapply()` would also work but is overkill for a pure arithmetic op.

</details>

### Exercise 1.7: Convert a factor to numeric without losing values

**Task:** The vector `f <- factor(c("10", "20", "30", "10"))` looks numeric but is stored as a factor. Convert it to the original numeric values (10, 20, 30, 10), not the underlying integer codes (1, 2, 3, 1). Save the numeric vector to `ex_1_7`.

**Expected result:**

```
#> [1] 10 20 30 10
```

**Difficulty:** Intermediate

```r title="Your turn"
f <- factor(c("10", "20", "30", "10"))
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- factor(c("10", "20", "30", "10"))
ex_1_7 <- as.numeric(as.character(f))
ex_1_7
#> [1] 10 20 30 10
```

**Explanation:** Factors are stored as integers with a labels lookup; calling `as.numeric(f)` returns the integer codes (1, 2, 3, 1), not the labels. The two-step `as.numeric(as.character(f))` first recovers the original strings, then parses them. This is one of the most-asked R interview gotchas because it bites every analyst who imports a CSV with `stringsAsFactors = TRUE`. Modern alternative: `as.numeric(levels(f))[f]` is slightly faster on long vectors.

</details>

### Exercise 1.8: Find indices of values matching a condition

**Task:** Given `y <- c(5, 12, 8, 19, 3, 22, 14)`, return the positions (not values) where the element is greater than 10. Use `which()` and save the integer vector of positions to `ex_1_8`.

**Expected result:**

```
#> [1] 2 4 6 7
```

**Difficulty:** Beginner

```r title="Your turn"
y <- c(5, 12, 8, 19, 3, 22, 14)
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
y <- c(5, 12, 8, 19, 3, 22, 14)
ex_1_8 <- which(y > 10)
ex_1_8
#> [1] 2 4 6 7
```

**Explanation:** `which()` converts a logical vector to the positions of its `TRUE` values. Useful when downstream code needs indices rather than values, for example to look up matching rows in a paired vector. The variant `which.max(y)` and `which.min(y)` return the single position of the extremum and are common follow-ups. Avoid `seq_along(y)[y > 10]`: same answer but unnecessarily verbose.

</details>

### Exercise 1.9: Explain when to use the arrow versus equals assignment

**Task:** Demonstrate the assignment difference: use `<-` to bind the value 5 to a top-level name `a`, then call `mean()` with a named argument using `=`, computing the average of `c(1, 2, 3)`. Save the computed mean to `ex_1_9`.

**Expected result:**

```
#> [1] 2
```

**Difficulty:** Beginner

```r title="Your turn"
a <- # your code here
ex_1_9 <- # your code here
ex_1_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- 5
ex_1_9 <- mean(x = c(1, 2, 3))
ex_1_9
#> [1] 2
```

**Explanation:** The tidyverse style guide reserves `<-` for assignment and `=` for named arguments inside function calls. Both technically assign at the top level, but mixing them inside function calls causes subtle bugs: `mean(x <- c(1, 2, 3))` would create `x` in the calling environment as a side effect. Interviewers ask this to filter candidates who have read a style guide from those who write Python-style `x = 5` everywhere. Stating "they are the same" is the wrong answer.

</details>

## Section 2. Data wrangling with dplyr and tidyr (10 problems)

The wrangling round is where most candidates either shine or stall. Expect group-by summaries, joins, `case_when()`, pivoting, and a window function or two.

### Exercise 2.1: Filter mtcars by multiple conditions

**Task:** A reviewer asks you to extract from `mtcars` only the cars that are both 6-cylinder (`cyl == 6`) and have miles-per-gallon above 20 (`mpg > 20`). Return the filtered data frame and save it to `ex_2_1`.

**Expected result:**

```
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6 160.0 110 3.90 2.875 17.02  0  1    4    4
#> Hornet 4 Drive 21.4   6 258.0 110 3.08 3.215 19.44  1  0    3    1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mtcars |> filter(cyl == 6, mpg > 20)
ex_2_1
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6 160.0 110 3.90 2.875 17.02  0  1    4    4
#> Hornet 4 Drive 21.4   6 258.0 110 3.08 3.215 19.44  1  0    3    1
```

**Explanation:** Inside `filter()`, comma-separated conditions are combined with `AND`, which reads cleaner than `filter(cyl == 6 & mpg > 20)`. A common mistake is `filter(cyl = 6)`: a single `=` inside `filter()` looks like a named argument and throws a confusing error. Base R equivalent: `mtcars[mtcars$cyl == 6 & mtcars$mpg > 20, ]`. The dplyr form survives column renaming and is easier to chain.

</details>

### Exercise 2.2: Group and summarise mean mpg per cylinder count

**Task:** Compute the average `mpg` for each cylinder count in `mtcars`. Return a tibble with columns `cyl` and `mean_mpg`, sorted ascending by `cyl`. Save the tibble to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg)) |>
  arrange(cyl)
ex_2_2
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1
```

**Explanation:** `group_by()` plus `summarise()` collapses every group to a single row. In dplyr 1.1+, the one-liner `summarise(mean_mpg = mean(mpg), .by = cyl)` skips the explicit grouping and avoids the persistent group attribute that bites people in downstream `mutate()` calls. Pure base R: `aggregate(mpg ~ cyl, mtcars, mean)`. The interviewer is checking that you do not forget to `arrange()` or that you avoid `ungroup()` traps.

</details>

### Exercise 2.3: Bucket diamonds into price tiers with case_when

**Task:** A jeweller preparing a quarterly sale wants `diamonds` bucketed into three tiers based on `price`: "budget" (below 1000), "mid" (1000 to 4999), and "premium" (5000 and above). Add a `tier` column with `mutate()` and `case_when()`, then return the row counts per tier. Save the count tibble to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- diamonds |>
  mutate(tier = case_when(
    price <  1000 ~ "budget",
    price <  5000 ~ "mid",
    TRUE          ~ "premium"
  )) |>
  count(tier)
ex_2_3
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Explanation:** `case_when()` evaluates conditions top-to-bottom and the first match wins, so you do not need `price >= 1000 & price < 5000` for the middle bucket. The trailing `TRUE ~ "premium"` is the catch-all default; omit it and rows above 5000 become `NA`. Cleaner than nested `if_else()` for three or more buckets. A common trap is using `<-` inside `case_when()`, which throws a parse error.

</details>

### Exercise 2.4: Per-group mutate without group_by using dplyr 1.1+

**Task:** Add a column `gear_max_mpg` to `mtcars` containing the maximum `mpg` within each `gear` value, without using `group_by()`. Use the `.by` argument introduced in dplyr 1.1. Save the resulting tibble's first six rows to `ex_2_4`.

**Expected result:**

```
#>                    mpg gear gear_max_mpg
#> Mazda RX4         21.0    4         33.9
#> Mazda RX4 Wag     21.0    4         33.9
#> Datsun 710        22.8    4         33.9
#> Hornet 4 Drive    21.4    3         21.5
#> Hornet Sportabout 18.7    3         21.5
#> Valiant           18.1    3         21.5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- mtcars |>
  mutate(gear_max_mpg = max(mpg), .by = gear) |>
  select(mpg, gear, gear_max_mpg) |>
  head()
ex_2_4
#>                    mpg gear gear_max_mpg
#> Mazda RX4         21.0    4         33.9
#> Mazda RX4 Wag     21.0    4         33.9
#> Datsun 710        22.8    4         33.9
#> Hornet 4 Drive    21.4    3         21.5
#> Hornet Sportabout 18.7    3         21.5
#> Valiant           18.1    3         21.5
```

**Explanation:** Before dplyr 1.1 the only way to do per-group mutate was `group_by(gear) |> mutate(...) |> ungroup()`. The `.by` argument scopes grouping to a single verb without leaving a persistent group attribute, which is the source of countless silent bugs. Senior interviewers love this question because it sorts who has kept up with the modern API. Same idea works for `summarise(.by = ...)` and `filter(.by = ...)`.

</details>

### Exercise 2.5: Inner-join two tibbles on a key column

**Task:** A retailer maintains a small `orders` table and a `customers` table, shown inline below. Inner-join them on `customer_id` so each order row gains the customer's name. Save the joined tibble to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   customer_id name    amount
#>         <int> <chr>    <dbl>
#> 1           1 Alice     99.9
#> 2           2 Bob       45
#> 3           1 Alice    150
```

**Difficulty:** Intermediate

```r title="Your turn"
orders <- tibble::tibble(customer_id = c(1, 2, 1, 4), amount = c(99.9, 45, 150, 22))
customers <- tibble::tibble(customer_id = c(1, 2, 3), name = c("Alice", "Bob", "Carol"))
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- tibble::tibble(customer_id = c(1, 2, 1, 4), amount = c(99.9, 45, 150, 22))
customers <- tibble::tibble(customer_id = c(1, 2, 3), name = c("Alice", "Bob", "Carol"))
ex_2_5 <- inner_join(orders, customers, by = "customer_id") |>
  select(customer_id, name, amount)
ex_2_5
#> # A tibble: 3 x 3
#>   customer_id name    amount
#>         <int> <chr>    <dbl>
#> 1           1 Alice     99.9
#> 2           2 Bob       45
#> 3           1 Alice    150
```

**Explanation:** `inner_join()` returns only rows with a match in both tables. Order 4 disappears (no customer record), and customer 3 (Carol) disappears (no orders). The four join families (`inner_`, `left_`, `right_`, `full_`) plus the filtering joins (`semi_`, `anti_`) cover almost every scenario. Interviewers often follow up with "what would `left_join()` change?", expecting you to say Carol still drops out but order 4 stays with `name = NA`.

</details>

### Exercise 2.6: Pivot wide to long with pivot_longer

**Task:** A marketing analyst exports monthly revenue as a wide table with columns `id`, `jan`, `feb`, `mar`. Reshape it so each row holds one (id, month, revenue) combination. Save the long tibble to `ex_2_6`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>      id month revenue
#>   <int> <chr>   <dbl>
#> 1     1 jan       100
#> 2     1 feb       150
#> 3     1 mar       200
#> 4     2 jan        80
#> 5     2 feb        90
#> 6     2 mar       110
```

**Difficulty:** Intermediate

```r title="Your turn"
wide <- tibble::tibble(id = 1:2, jan = c(100, 80), feb = c(150, 90), mar = c(200, 110))
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
wide <- tibble::tibble(id = 1:2, jan = c(100, 80), feb = c(150, 90), mar = c(200, 110))
ex_2_6 <- wide |>
  pivot_longer(cols = jan:mar, names_to = "month", values_to = "revenue")
ex_2_6
#> # A tibble: 6 x 3
#>      id month revenue
#>   <int> <chr>   <dbl>
#> 1     1 jan       100
#> 2     1 feb       150
#> 3     1 mar       200
#> 4     2 jan        80
#> 5     2 feb        90
#> 6     2 mar       110
```

**Explanation:** Wide-to-long is the dominant reshape direction because plotting and modelling code expects "tidy" form, one observation per row. The `cols` argument uses tidy-select (here `jan:mar`); `names_to` and `values_to` rename the two new columns. The reverse `pivot_wider()` would invert this. Interviewers ask this because messy column-encoded data is the most common real-world wrangling task. Older code uses `gather()` and `spread()`: those are retired, do not mention them as the primary answer.

</details>

### Exercise 2.7: Rank within a group using row_number

**Task:** For each cylinder count in `mtcars`, rank the cars by descending `mpg` and keep only the top two per group. Return a tibble with `cyl`, `mpg`, and the rank column `rk`, sorted by `cyl` then `rk`. Save it to `ex_2_7`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>     cyl   mpg    rk
#>   <dbl> <dbl> <int>
#> 1     4  33.9     1
#> 2     4  32.4     2
#> 3     6  21.4     1
#> 4     6  21       2
#> 5     8  19.2     1
#> 6     8  18.7     2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- mtcars |>
  mutate(rk = row_number(desc(mpg)), .by = cyl) |>
  filter(rk <= 2) |>
  arrange(cyl, rk) |>
  select(cyl, mpg, rk) |>
  tibble::as_tibble()
ex_2_7
#> # A tibble: 6 x 3
#>     cyl   mpg    rk
#>   <dbl> <dbl> <int>
#> 1     4  33.9     1
#> 2     4  32.4     2
#> 3     6  21.4     1
#> 4     6  21       2
#> 5     8  19.2     1
#> 6     8  18.7     2
```

**Explanation:** `row_number()` is the simplest of dplyr's three rank functions: it assigns 1, 2, 3 with no ties broken (first occurrence wins). `min_rank()` and `dense_rank()` behave differently when ties exist. Using `.by = cyl` keeps the grouping local to one `mutate()`. A cleaner alternative for "top N per group" is `slice_max(mpg, n = 2, by = cyl)`, which is what most senior candidates reach for.

</details>

### Exercise 2.8: Pick the row with the maximum value per group

**Task:** From `mtcars`, return one row per `gear` value: the row with the maximum `hp` for that gear. Keep all columns. Save the resulting tibble (three rows total, since `gear` has three values) to `ex_2_8`.

**Expected result:**

```
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  15.5     8   318   150  2.76  3.52  16.9     0     0     3     2
#> 2  15.8     8   351   264  4.22  3.17  14.5     0     1     5     4
#> 3  17.3     8   275.  180  3.07  3.73  17.6     0     0     3     3
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- mtcars |>
  slice_max(hp, n = 1, by = gear) |>
  tibble::as_tibble()
ex_2_8
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  15.5     8   318   150  2.76  3.52  16.9     0     0     3     2
#> 2  15.8     8   351   264  4.22  3.17  14.5     0     1     5     4
#> 3  17.3     8   275.  180  3.07  3.73  17.6     0     0     3     3
```

**Explanation:** `slice_max()` is the modern replacement for the `top_n()` idiom. The `n = 1, by = gear` arguments combine "pick one per group" without a `group_by()` call. If ties exist on `hp`, all tied rows are returned unless `with_ties = FALSE`. Older interview-prep books still show `filter(hp == max(hp))` inside `group_by()`: that works but is verbose and trips on ties without an explicit guard.

</details>

### Exercise 2.9: Cumulative sum within a group

**Task:** Build the inline orders tibble (shown below), then compute the running total of `amount` within each `customer_id`, ordered by `order_id`. Add the cumulative column `running` and save the full tibble to `ex_2_9`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   order_id customer_id amount running
#>      <int>       <int>  <dbl>   <dbl>
#> 1        1           1     50      50
#> 2        2           1     30      80
#> 3        3           2    100     100
#> 4        4           1     20     100
#> 5        5           2     40     140
```

**Difficulty:** Intermediate

```r title="Your turn"
orders <- tibble::tibble(
  order_id    = 1:5,
  customer_id = c(1, 1, 2, 1, 2),
  amount      = c(50, 30, 100, 20, 40)
)
ex_2_9 <- # your code here
ex_2_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- tibble::tibble(
  order_id    = 1:5,
  customer_id = c(1, 1, 2, 1, 2),
  amount      = c(50, 30, 100, 20, 40)
)
ex_2_9 <- orders |>
  arrange(customer_id, order_id) |>
  mutate(running = cumsum(amount), .by = customer_id) |>
  arrange(order_id)
ex_2_9
#> # A tibble: 5 x 4
#>   order_id customer_id amount running
#>      <int>       <int>  <dbl>   <dbl>
#> 1        1           1     50      50
#> 2        2           1     30      80
#> 3        3           2    100     100
#> 4        4           1     20     100
#> 5        5           2     40     140
```

**Explanation:** `cumsum()` is vectorised over a group when called inside a grouped `mutate()`. The crucial step is sorting first so the running total reflects chronological order, then restoring the original sort order at the end for display. Forgetting the `.by` argument computes one giant cumulative sum across all rows, which is a very common interview slip. Variants: `cummean()`, `cummax()`, and `RcppRoll::roll_sumr()` for sliding windows.

</details>

### Exercise 2.10: Anti-join to find unmatched rows

**Task:** An audit team has two tibbles, `expected` (every customer who should appear) and `actual` (the customers who did appear). Use `anti_join()` to find rows in `expected` that have no match in `actual` by `customer_id`. Save the missing customers tibble to `ex_2_10`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   customer_id name
#>         <int> <chr>
#> 1           3 Carol
#> 2           5 Eve
```

**Difficulty:** Advanced

```r title="Your turn"
expected <- tibble::tibble(customer_id = 1:5, name = c("Alice", "Bob", "Carol", "Dan", "Eve"))
actual <- tibble::tibble(customer_id = c(1, 2, 4), visited = TRUE)
ex_2_10 <- # your code here
ex_2_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
expected <- tibble::tibble(customer_id = 1:5, name = c("Alice", "Bob", "Carol", "Dan", "Eve"))
actual <- tibble::tibble(customer_id = c(1, 2, 4), visited = TRUE)
ex_2_10 <- anti_join(expected, actual, by = "customer_id")
ex_2_10
#> # A tibble: 2 x 2
#>   customer_id name
#>         <int> <chr>
#> 1           3 Carol
#> 2           5 Eve
```

**Explanation:** `anti_join()` is a filtering join: it keeps every row in the left table that has no match in the right, and brings no columns from the right. It is the cleanest way to express "what is in A but not in B". A naive equivalent is `filter(expected, !customer_id %in% actual$customer_id)`, which works for single-key joins but breaks down for multi-column keys. Audit and reconciliation workflows live on `anti_join()` plus `semi_join()`.

</details>

## Section 3. Apply family and functional programming (8 problems)

Mid-level R interviewers love this section because it splits candidates by comfort with higher-order functions. Expect `sapply` versus `lapply` versus `vapply`, closures, and a `Reduce()` curveball.

### Exercise 3.1: Compute column means with sapply

**Task:** Use `sapply()` to compute the mean of every column of the built-in `mtcars` dataset (all 11 columns are numeric). The result should simplify to a named numeric vector. Save it to `ex_3_1`.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- sapply(mtcars, mean)
ex_3_1
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Explanation:** A data frame is a list of columns, so `sapply()` walks each column and applies the function. Because every column is numeric and returns one value, the result simplifies from a list to a named numeric vector. If any column were non-numeric, `mean()` would silently produce `NA` and a warning. For type stability, `vapply(mtcars, mean, numeric(1))` enforces a one-element numeric return on every column.

</details>

### Exercise 3.2: lapply over a list of vectors

**Task:** Given the list `nums <- list(a = 1:3, b = 4:6, c = 7:9)`, use `lapply()` to compute the sum of each element and return a list (not simplified to a vector). Save the list to `ex_3_2`.

**Expected result:**

```
#> $a
#> [1] 6
#>
#> $b
#> [1] 15
#>
#> $c
#> [1] 24
```

**Difficulty:** Intermediate

```r title="Your turn"
nums <- list(a = 1:3, b = 4:6, c = 7:9)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nums <- list(a = 1:3, b = 4:6, c = 7:9)
ex_3_2 <- lapply(nums, sum)
ex_3_2
#> $a
#> [1] 6
#>
#> $b
#> [1] 15
#>
#> $c
#> [1] 24
```

**Explanation:** `lapply()` always returns a list of the same length as its input, regardless of what the function returns. `sapply()` would simplify this same call to a named numeric vector. Use `lapply()` when you need predictable structural output (downstream code expects a list) and `sapply()` when you want the nicest printable form. The naming convention worth memorising: the first letter is the return type ("l" for list, "s" for simplify, "v" for vector).

</details>

### Exercise 3.3: Use vapply for type-stable iteration

**Task:** A senior engineer requires type-stable code in production. Convert this fragile call, `sapply(mtcars, mean)`, to a `vapply()` form that returns exactly a length-11 numeric vector, throwing an error if any column did not produce a single number. Save the resulting vector to `ex_3_3`.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- vapply(mtcars, mean, FUN.VALUE = numeric(1))
ex_3_3
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Explanation:** `vapply()` takes a `FUN.VALUE` argument that asserts the per-element return shape: `numeric(1)` here means exactly one numeric value. If a column produces a different shape or type, R raises an error immediately rather than silently producing surprising output. This is why production code prefers `vapply()` to `sapply()`: the latter "helpfully" returns a list when shapes vary, breaking downstream code. The `purrr::map_*()` family follows the same philosophy with `map_dbl()`, `map_chr()`, etc.

</details>

### Exercise 3.4: Apply a two-argument function with mapply

**Task:** Given two numeric vectors of equal length, `a <- c(1, 2, 3, 4)` and `b <- c(10, 20, 30, 40)`, compute `a^b` element-wise using `mapply()` rather than direct vectorisation. Save the resulting vector to `ex_3_4`.

**Expected result:**

```
#> [1] 1e+00 1e+06 2.058911e+14 1.208926e+24
```

**Difficulty:** Intermediate

```r title="Your turn"
a <- c(1, 2, 3, 4)
b <- c(10, 20, 30, 40)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- c(1, 2, 3, 4)
b <- c(10, 20, 30, 40)
ex_3_4 <- mapply(function(x, y) x^y, a, b)
ex_3_4
#> [1] 1.000000e+00 1.048576e+06 2.058911e+14 1.208926e+24
```

**Explanation:** `mapply()` is the multivariate `sapply()`: it walks two (or more) vectors in parallel and applies the function. The direct `a^b` is faster here, but `mapply()` shines when the function takes more than one argument and is not natively vectorised. The `purrr::map2_dbl()` form is the modern equivalent with stricter type checking. A common interview follow-up is "what is the difference between `Map()` and `mapply()`?": `Map()` is `mapply(..., SIMPLIFY = FALSE)`, always returning a list.

</details>

### Exercise 3.5: Use purrr::map_dbl for tidy iteration

**Task:** A code reviewer flags the `sapply()` call in the codebase and asks for the `purrr` equivalent. Use `map_dbl()` to compute the median of every column of `mtcars`. Save the named numeric vector to `ex_3_5`.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#>   19.200    6.000  196.300  123.000    3.695    3.325   17.710    0.000    0.000    4.000    2.000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- map_dbl(mtcars, median)
ex_3_5
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#>   19.200    6.000  196.300  123.000    3.695    3.325   17.710    0.000    0.000    4.000    2.000
```

**Explanation:** `map_dbl()` is the type-stable purrr cousin of `sapply()` plus `vapply()`: it asserts every element returns one double and throws an error otherwise. The function-suffix convention (`_dbl`, `_int`, `_chr`, `_lgl`, `_df`) means you never have to inspect the output type to know what you got back. Tidyverse codebases standardise on this family because it composes cleanly with pipes and produces predictable column shapes downstream.

</details>

### Exercise 3.6: Combine a list of data frames with Reduce

**Task:** Given a list of three single-column tibbles that share an `id` column (shown inline), reduce them into one tibble by full-joining on `id`. Use `Reduce()` with `full_join()` as the binary operator. Save the merged tibble to `ex_3_6`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>      id     a     b     c
#>   <int> <dbl> <dbl> <dbl>
#> 1     1    10    NA   100
#> 2     2    20    50    NA
#> 3     3    NA    60   200
#> 4     4    NA    NA   300
```

**Difficulty:** Advanced

```r title="Your turn"
dfs <- list(
  tibble::tibble(id = c(1, 2),    a = c(10, 20)),
  tibble::tibble(id = c(2, 3),    b = c(50, 60)),
  tibble::tibble(id = c(1, 3, 4), c = c(100, 200, 300))
)
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dfs <- list(
  tibble::tibble(id = c(1, 2),    a = c(10, 20)),
  tibble::tibble(id = c(2, 3),    b = c(50, 60)),
  tibble::tibble(id = c(1, 3, 4), c = c(100, 200, 300))
)
ex_3_6 <- Reduce(function(x, y) full_join(x, y, by = "id"), dfs)
ex_3_6
#> # A tibble: 4 x 4
#>      id     a     b     c
#>   <int> <dbl> <dbl> <dbl>
#> 1     1    10    NA   100
#> 2     2    20    50    NA
#> 3     3    NA    60   200
#> 4     4    NA    NA   300
```

**Explanation:** `Reduce()` repeatedly applies a binary function across a list, threading the accumulator forward: `f(f(f(d1, d2), d3), d4)`. With `full_join()` as the operator you fold an arbitrarily long list of tibbles into one wide tibble in a single expression. The purrr equivalent is `purrr::reduce(dfs, full_join, by = "id")`, slightly cleaner. Senior interviewers ask this question because it tests whether you can express iteration declaratively rather than with a growing-vector loop.

</details>

### Exercise 3.7: Write a closure that counts calls

**Task:** Build a function `make_counter()` that returns a new function with no arguments. Each time the returned function is called, it increments a private counter and returns the new value. Demonstrate by creating two independent counters, calling each three times, and saving the second counter's final value to `ex_3_7`.

**Expected result:**

```
#> [1] 3
```

**Difficulty:** Advanced

```r title="Your turn"
make_counter <- function() {
  # your code here
}
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_counter <- function() {
  n <- 0
  function() {
    n <<- n + 1
    n
  }
}
c1 <- make_counter()
c2 <- make_counter()
c1(); c1(); c1()
c2(); c2(); ex_3_7 <- c2()
ex_3_7
#> [1] 3
```

**Explanation:** A closure is a function bundled with the environment in which it was defined. The inner anonymous function "captures" `n` from the enclosing `make_counter` frame, and `<<-` writes back to that captured frame rather than the local one. Each call to `make_counter()` creates a fresh environment, which is why `c1` and `c2` count independently. Closures power things like memoisation, configuration wrappers, and stateful generators. Interviewers ask this to test understanding of lexical scoping.

</details>

### Exercise 3.8: Build a function factory for power transforms

**Task:** Write a function `power_of(n)` that returns a new function which raises its input to the `n`th power. Use it to build `square` (n = 2) and `cube` (n = 3), apply each to the vector `1:4`, and save the concatenation `c(square(1:4), cube(1:4))` to `ex_3_8`.

**Expected result:**

```
#> [1]  1  4  9 16  1  8 27 64
```

**Difficulty:** Advanced

```r title="Your turn"
power_of <- function(n) {
  # your code here
}
square <- # your code here
cube <- # your code here
ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
power_of <- function(n) {
  force(n)
  function(x) x^n
}
square <- power_of(2)
cube   <- power_of(3)
ex_3_8 <- c(square(1:4), cube(1:4))
ex_3_8
#> [1]  1  4  9 16  1  8 27 64
```

**Explanation:** A function factory is a closure that returns a specialised function based on its arguments. The `force(n)` call is critical: R uses lazy evaluation, so without forcing, `n` would not be evaluated until the returned function runs. If `power_of()` were called in a loop or with a mutating argument, the captured `n` could end up wrong. Forcing pins the value at construction time. This pattern shows up in `purrr::partial()`, `memoise::memoise()`, and many `ggplot2` scales.

</details>

## Section 4. Statistics and inference (8 problems)

Stats-track interviewers cycle through summary stats, regression interpretation, hypothesis tests, and one bootstrap or simulation question. Most candidates lose marks not on the code but on naming the test or interpreting the coefficient.

### Exercise 4.1: Compute mean, median, and standard deviation

**Task:** Compute the mean, median, and standard deviation of `mtcars$mpg` and return them as a named numeric vector of length three. Save the result to `ex_4_1`.

**Expected result:**

```
#>      mean    median        sd
#> 20.090625 19.200000  6.026948
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- c(
  mean   = mean(mtcars$mpg),
  median = median(mtcars$mpg),
  sd     = sd(mtcars$mpg)
)
ex_4_1
#>      mean    median        sd
#> 20.090625 19.200000  6.026948
```

**Explanation:** `mean()`, `median()`, and `sd()` are the holy trinity of one-variable summary stats. R's `sd()` uses the n minus 1 denominator (sample standard deviation), not n; if the interviewer wants the population sd, multiply by `sqrt((n - 1) / n)`. Mean and median diverge when the distribution is skewed (the mean drifts toward the long tail), which is the follow-up they often ask after this question.

</details>

### Exercise 4.2: Pearson correlation matrix for numeric columns

**Task:** Compute the Pearson correlation matrix of the numeric columns in `mtcars` and round to two decimal places. Return the rounded matrix (it should be 11 by 11). Save it to `ex_4_2`.

**Expected result:**

```
#>        mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#> mpg   1.00 -0.85 -0.85 -0.78  0.68 -0.87  0.42  0.66  0.60  0.48 -0.55
#> cyl  -0.85  1.00  0.90  0.83 -0.70  0.78 -0.59 -0.81 -0.52 -0.49  0.53
#> ...
#> # 9 more rows
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- round(cor(mtcars), 2)
ex_4_2
#>        mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#> mpg   1.00 -0.85 -0.85 -0.78  0.68 -0.87  0.42  0.66  0.60  0.48 -0.55
#> cyl  -0.85  1.00  0.90  0.83 -0.70  0.78 -0.59 -0.81 -0.52 -0.49  0.53
#> ...
```

**Explanation:** `cor()` defaults to Pearson and operates on the whole matrix or data frame at once. Pearson measures linear association; if any pair has a strong non-linear relationship, the coefficient understates it. Switch to `cor(mtcars, method = "spearman")` for rank-based association. If columns contain `NA`, add `use = "pairwise.complete.obs"`. Visualisation follow-up: `corrplot::corrplot()` or `ggcorrplot::ggcorrplot()`.

</details>

### Exercise 4.3: Fit a linear regression and pull a coefficient

**Task:** Fit a linear regression of `mpg` on `wt` using `mtcars`, then extract the slope coefficient (the second element of `coef()`). Round it to four decimal places. Save the single numeric value to `ex_4_3`.

**Expected result:**

```
#> [1] -5.3445
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_4_3 <- round(coef(fit)[["wt"]], 4)
ex_4_3
#> [1] -5.3445
```

**Explanation:** The slope of `-5.34` says that for every additional 1000-pound increase in weight, predicted `mpg` drops by 5.34 (the units come from the data; `wt` in `mtcars` is in thousands of pounds). The bracket form `[["wt"]]` is preferred over `[2]` because it survives column reordering. The full model output also gives standard errors via `summary(fit)$coefficients` and confidence intervals via `confint(fit)`. Interviewers ask this to check that you interpret coefficients in original units.

</details>

### Exercise 4.4: Run a two-sample t-test on automatic versus manual cars

**Task:** Use `t.test()` to compare `mpg` between automatic (`am == 0`) and manual (`am == 1`) cars in `mtcars`. Extract and round the p-value to five decimal places. Save the single numeric p-value to `ex_4_4`.

**Expected result:**

```
#> [1] 0.00137
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tt <- t.test(mpg ~ am, data = mtcars)
ex_4_4 <- round(tt$p.value, 5)
ex_4_4
#> [1] 0.00137
```

**Explanation:** The formula interface `mpg ~ am` automatically splits by the grouping variable. R defaults to Welch's t-test (unequal variances), which is the right default in almost every realistic case; explicitly setting `var.equal = TRUE` only makes sense after a Levene test confirms equal variance. The p-value of 0.00137 rejects the null of equal mean mpg at any standard alpha. Interviewers love this because they can pivot to "would you trust this on 32 rows?", expecting a discussion of small-sample power.

</details>

### Exercise 4.5: Chi-squared test on a contingency table

**Task:** Build a 2x2 contingency table from `mtcars` cross-tabulating `am` (automatic vs manual) and `vs` (engine shape). Run `chisq.test()` on the table and round the p-value to four decimal places. Save the p-value to `ex_4_5`.

**Expected result:**

```
#> [1] 0.3409
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tab <- table(mtcars$am, mtcars$vs)
ex_4_5 <- round(chisq.test(tab)$p.value, 4)
ex_4_5
#> [1] 0.3409
```

**Explanation:** `chisq.test()` tests independence of two categorical variables: under the null, the row and column factors are unrelated. With only 32 observations and small expected cell counts, R warns about chi-squared approximation; the interviewer will probe whether you would switch to `fisher.test()` for small samples (yes, for 2x2 with low counts). A p-value of 0.34 here does not reject independence, so there is no evidence that transmission and engine shape are linked.

</details>

### Exercise 4.6: Bootstrap a 95 percent confidence interval for the mean

**Task:** Use a simple bootstrap (1000 resamples with replacement) to estimate the 95 percent confidence interval for the mean of `mtcars$mpg`. Set `set.seed(42)` for reproducibility. Return the lower and upper bounds as a length-two numeric vector and save it to `ex_4_6`.

**Expected result:**

```
#>     2.5%    97.5%
#> 17.97969 22.10781
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(42)
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
boots <- replicate(1000, mean(sample(mtcars$mpg, replace = TRUE)))
ex_4_6 <- quantile(boots, probs = c(0.025, 0.975))
ex_4_6
#>     2.5%    97.5%
#> 17.97969 22.10781
```

**Explanation:** The non-parametric bootstrap resamples the data with replacement, computes the statistic on each resample, and takes the empirical quantiles of the resulting distribution. It makes no normality assumption, which matters when the data are skewed or when you cannot derive a closed-form standard error. The `boot` package wraps this with bias correction (BCa intervals); for an interview, the hand-rolled `replicate()` plus `quantile()` form is enough. Common mistake: forgetting `replace = TRUE` in `sample()`.

</details>

### Exercise 4.7: Fit a logistic regression and predict a probability

**Task:** Using `mtcars`, fit a logistic regression of `am` (binary) on `mpg` and `wt`. Predict the probability that a car with `mpg = 25` and `wt = 2.5` is a manual transmission. Round to four decimal places and save the single probability to `ex_4_7`.

**Expected result:**

```
#> [1] 0.971
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt, data = mtcars, family = binomial)
new_car <- data.frame(mpg = 25, wt = 2.5)
ex_4_7 <- round(predict(fit, new_car, type = "response"), 4)
names(ex_4_7) <- NULL
ex_4_7
#> [1] 0.971
```

**Explanation:** `glm()` with `family = binomial` fits logistic regression. The `type = "response"` argument on `predict()` returns probabilities (the inverse logit of the linear predictor); without it, you get the log-odds. A common slip is fitting `lm()` on a 0/1 outcome (the linear probability model), which can predict probabilities outside [0, 1]. Interviewers also probe whether you can convert the coefficient to an odds ratio: `exp(coef(fit))`.

</details>

### Exercise 4.8: Predict with confidence intervals on new data

**Task:** Refit `lm(mpg ~ wt, data = mtcars)`, then predict `mpg` for three new cars with weights 2.0, 3.0, and 4.0 thousand pounds, including 95 percent confidence intervals. Save the resulting matrix (three rows, three columns: `fit`, `lwr`, `upr`) to `ex_4_8`.

**Expected result:**

```
#>        fit      lwr      upr
#> 1 26.97992 25.45674 28.50311
#> 2 21.63540 20.55812 22.71269
#> 3 16.29088 14.83020 17.75157
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
newdata <- data.frame(wt = c(2.0, 3.0, 4.0))
ex_4_8 <- predict(fit, newdata, interval = "confidence")
ex_4_8
#>        fit      lwr      upr
#> 1 26.97992 25.45674 28.50311
#> 2 21.63540 20.55812 22.71269
#> 3 16.29088 14.83020 17.75157
```

**Explanation:** The `interval` argument has two relevant settings: `"confidence"` reflects uncertainty about the mean response at each point (narrow), while `"prediction"` reflects uncertainty about a new individual observation (much wider, includes residual noise). Interviewers love asking the difference because junior candidates confuse them. The 95 percent default comes from `level = 0.95`, override-able for 90 or 99 percent bands. `broom::augment()` gives the same output in tidy form.

</details>

## Section 5. Data visualization with ggplot2 (8 problems)

Visualisation rounds rarely ask you to design a perfect chart; they ask whether you remember the grammar. The questions below cover the most common aesthetic mappings, faceting, and reorder tricks.

### Exercise 5.1: Scatter plot of mpg versus wt with a smooth line

**Task:** A scout looking at fuel efficiency wants a scatter plot of `mtcars` with `wt` on the x-axis, `mpg` on the y-axis, and a `loess` smoothing line overlaid. Build the ggplot object and save it to `ex_5_1`.

**Expected result:**

```
# A ggplot scatter of mpg vs wt with a blue loess smooth line and grey confidence band.
# Aesthetics: aes(x = wt, y = mpg); geoms: geom_point() + geom_smooth(method = "loess")
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "loess", formula = y ~ x)
ex_5_1
#> # A ggplot object: scatter of mpg vs wt with loess smooth.
```

**Explanation:** ggplot2 separates data, aesthetic mappings, and geometric layers. `geom_point()` draws the raw observations; `geom_smooth(method = "loess")` overlays a locally-weighted regression with a 95 percent confidence ribbon. Interviewers probe whether you specify `formula = y ~ x` explicitly to suppress the routine message ggplot2 emits when it picks a smoother. Use `method = "lm"` for a straight line, `"gam"` for splines on large data.

</details>

### Exercise 5.2: Boxplot of mpg by cylinder count

**Task:** Build a boxplot of `mpg` grouped by `cyl` in `mtcars`. The interviewer wants `cyl` treated as a discrete category, not a continuous numeric. Save the ggplot object to `ex_5_2`.

**Expected result:**

```
# A ggplot boxplot with cyl (factor) on x and mpg on y, three boxes for 4/6/8 cyl.
# aes(x = factor(cyl), y = mpg); geom_boxplot()
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot()
ex_5_2
#> # A ggplot object: boxplot of mpg by cyl factor.
```

**Explanation:** `cyl` is stored as numeric (4, 6, 8) but is conceptually a categorical bucket. Without `factor(cyl)`, ggplot2 would treat the x-axis as continuous and squash all three boxes onto one column. Forgetting this conversion is the most common ggplot2 slip in interviews. Aesthetic side note: `geom_violin()` or `geom_jitter()` overlays carry more information about distribution and are common follow-up asks.

</details>

### Exercise 5.3: Faceted scatter plot by cylinder

**Task:** Build a scatter plot of `mpg` vs `wt` in `mtcars`, faceted into one panel per `cyl` value (one row, three columns). Save the ggplot object to `ex_5_3`.

**Expected result:**

```
# A ggplot scatter of mpg vs wt, faceted into 3 columns by cyl (4, 6, 8).
# aes(x = wt, y = mpg); geom_point(); facet_wrap(~ cyl, nrow = 1)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  facet_wrap(~ cyl, nrow = 1)
ex_5_3
#> # A ggplot object: scatter of mpg vs wt, faceted by cyl.
```

**Explanation:** `facet_wrap()` is for one faceting variable; `facet_grid()` is for two. The `nrow = 1` forces a single row, which is right for three groups but breaks down for many categories (use the default and let ggplot2 wrap). A subtle interview probe: by default each panel shares axes, which is usually what you want for comparison; pass `scales = "free_y"` only if the y-ranges differ enormously between panels.

</details>

### Exercise 5.4: Bar chart with reordered categories

**Task:** Take `mpg` from the `ggplot2` package (the fuel-economy tibble, different from `mtcars$mpg`), count cars per `class`, and build a bar chart with bars ordered descending by count. Save the ggplot object to `ex_5_4`.

**Expected result:**

```
# A horizontal-feel bar chart with `class` reordered by count: suv tallest, then compact, etc.
# aes(x = reorder(class, -count), y = count); geom_col()
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
class_counts <- mpg |> count(class, name = "count")
ex_5_4 <- ggplot(class_counts, aes(x = reorder(class, -count), y = count)) +
  geom_col() +
  labs(x = "class")
ex_5_4
#> # A ggplot object: bar chart of class counts, descending by count.
```

**Explanation:** The default alphabetical order of factor levels is rarely the right order for a bar chart. `reorder(class, -count)` re-levels the factor by the count column descending; flipping the sign gives ascending. The modern alternative is `forcats::fct_reorder(class, count, .desc = TRUE)`, which is cleaner and composes with the rest of the tidyverse. Senior follow-up: `coord_flip()` or swap `x` and `y` in `aes()` for a horizontal bar layout.

</details>

### Exercise 5.5: Add a title, subtitle, and axis labels

**Task:** Take any scatter of `mpg` vs `wt` in `mtcars` and annotate it: title "Fuel economy versus weight", subtitle "mtcars data, 1974 Motor Trend", x-label "Weight (1000 lbs)", y-label "Miles per gallon". Save the labelled ggplot object to `ex_5_5`.

**Expected result:**

```
# Scatter with full labelling: title, subtitle, custom axis labels.
# labs(title = ..., subtitle = ..., x = ..., y = ...)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(
    title    = "Fuel economy versus weight",
    subtitle = "mtcars data, 1974 Motor Trend",
    x        = "Weight (1000 lbs)",
    y        = "Miles per gallon"
  )
ex_5_5
#> # A ggplot object: scatter with title, subtitle, axis labels.
```

**Explanation:** `labs()` is the one-stop shop for every text annotation: title, subtitle, x, y, caption, tag, plus aesthetic legend labels. Older code used `ggtitle()`, `xlab()`, `ylab()` separately; that still works but is verbose. Interviewers ask this to check you do not hand-edit titles in Photoshop. For headline-grade graphics, follow up with `theme(plot.title = element_text(face = "bold", size = 14))`.

</details>

### Exercise 5.6: Histogram with a chosen binwidth

**Task:** Build a histogram of `mtcars$mpg` with a fixed `binwidth` of 2. Save the ggplot object to `ex_5_6`.

**Expected result:**

```
# Histogram of mpg with bars of width 2 mpg.
# aes(x = mpg); geom_histogram(binwidth = 2)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(binwidth = 2)
ex_5_6
#> # A ggplot object: histogram of mpg with binwidth 2.
```

**Explanation:** ggplot2 chooses 30 bins by default with a warning that prompts you to pick `binwidth` or `bins` yourself. Specifying `binwidth = 2` pins each bar to a 2-unit wide range, which is interpretable in the data's units. `bins = 10` is the alternative if you care more about total bar count than width. For density-like comparisons across distributions, switch to `geom_density()` or set `aes(y = after_stat(density))`.

</details>

### Exercise 5.7: Custom discrete colour scale

**Task:** Build a scatter of `mpg` vs `wt` in `mtcars`, coloured by `factor(cyl)`, using a manual three-colour palette: red for 4-cyl, green for 6-cyl, blue for 8-cyl. Save the ggplot object to `ex_5_7`.

**Expected result:**

```
# Scatter with three colour groups, mapped via scale_colour_manual.
# aes(colour = factor(cyl)); scale_colour_manual(values = c("4"="red","6"="green","8"="blue"))
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  scale_colour_manual(values = c("4" = "red", "6" = "green", "8" = "blue")) +
  labs(colour = "cyl")
ex_5_7
#> # A ggplot object: scatter coloured by cyl with custom palette.
```

**Explanation:** `scale_colour_manual()` takes a named vector mapping factor levels to colours, which avoids relying on alphabetical order. For colour-blind safe palettes, prefer `scale_colour_brewer(palette = "Set2")` or `scale_colour_viridis_d()`. Interview probe: the British spelling `colour` and American `color` both work, and ggplot2 maps them transparently. For continuous variables use `scale_colour_gradient()` or `scale_colour_viridis_c()`.

</details>

### Exercise 5.8: Save a ggplot to a PNG file

**Task:** Build any scatter of `mpg` vs `wt`, then save it to a temporary PNG file with width 6 inches and height 4 inches at 150 DPI. Capture the file path returned by `tempfile()` and save it (the character string) to `ex_5_8`. (The grader only checks that `ex_5_8` is a length-one character path.)

**Expected result:**

```
#> [1] "/tmp/RtmpXXXXXX/file-XXXXXXXX.png"
```

**Difficulty:** Intermediate

```r title="Your turn"
p <- ggplot(mtcars, aes(x = wt, y = mpg)) + geom_point()
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mtcars, aes(x = wt, y = mpg)) + geom_point()
path <- tempfile(fileext = ".png")
ggsave(path, plot = p, width = 6, height = 4, dpi = 150)
ex_5_8 <- path
ex_5_8
#> [1] "/tmp/RtmpXXXXXX/file-XXXXXXXX.png"
```

**Explanation:** `ggsave()` infers the device from the file extension and accepts dimensions in inches plus a DPI for raster outputs. Default dimensions are the current plotting device, which is rarely what you want for a publication. For vector output suitable for print, use `.pdf` or `.svg` and skip DPI. Common interview slip: omitting `plot = p`, which makes `ggsave()` save whatever was last plotted (the "last_plot" trap).

</details>

## Section 6. Performance, debugging, and advanced topics (7 problems)

The final round at senior interviews. Microbenchmarking, profiling, error handling with `tryCatch()`, environments, S3 dispatch, and `data.table` speed.

### Exercise 6.1: Benchmark two ways to compute column sums

**Task:** Use `microbenchmark()` to compare `colSums(mtcars)` against `sapply(mtcars, sum)` over 100 evaluations each. Extract the median timing (in microseconds) for each expression. Save a named numeric vector of length two to `ex_6_1`.

**Expected result:**

```
#> colSums(mtcars)   sapply(mtcars, sum)
#>            15.5                  87.0
#> # Exact numbers will vary by machine; colSums should be much faster.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bm <- microbenchmark(
  colSums(mtcars),
  sapply(mtcars, sum),
  times = 100,
  unit  = "us"
)
ex_6_1 <- summary(bm)$median
names(ex_6_1) <- as.character(summary(bm)$expr)
ex_6_1
#> colSums(mtcars)   sapply(mtcars, sum)
#>            15.5                  87.0
```

**Explanation:** `colSums()` is implemented in C and walks columns once; `sapply()` is an R-level wrapper that dispatches `sum()` per column. The difference is small on a 32-row dataset but grows linearly with rows. `microbenchmark` (rather than `system.time()`) is the right tool for sub-millisecond differences because it runs many iterations and reports a distribution. The variant `bench::mark()` adds memory allocation tracking, which is often more useful than raw time.

</details>

### Exercise 6.2: Profile a slow function with Rprof

**Task:** A slow function `slow_sum()` (defined inline below) builds a result by appending to a vector inside a loop. Run `Rprof()` around a call and read the profiling output. Then write a fixed version `fast_sum()` that preallocates. Save the integer vector `c(slow = slow_sum(1000), fast = fast_sum(1000))` to `ex_6_2`. (Both should return the same value: 500500.)

**Expected result:**

```
#>   slow   fast
#> 500500 500500
```

**Difficulty:** Advanced

```r title="Your turn"
slow_sum <- function(n) {
  out <- c()
  for (i in seq_len(n)) out <- c(out, i)
  sum(out)
}
fast_sum <- function(n) {
  # your code here
}
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
slow_sum <- function(n) {
  out <- c()
  for (i in seq_len(n)) out <- c(out, i)
  sum(out)
}
fast_sum <- function(n) {
  out <- integer(n)
  for (i in seq_len(n)) out[i] <- i
  sum(out)
}
ex_6_2 <- c(slow = slow_sum(1000), fast = fast_sum(1000))
ex_6_2
#>   slow   fast
#> 500500 500500
```

**Explanation:** The slow version reallocates the entire `out` vector every iteration (O(n^2) total work), which is the most common R performance bug and what `Rprof()` would surface as time spent in `c()`. Preallocating with `integer(n)` is O(n). The fully vectorised version `sum(seq_len(n))` is faster still. The "preallocate, then assign" pattern is the lowest-hanging fruit in any slow R loop. Senior interviewers expect you to spot the antipattern visually within seconds.

</details>

### Exercise 6.3: Handle errors with tryCatch

**Task:** A fraud team parses messy date strings and needs the code to never crash on a bad input. Write a wrapper `safe_as_date(x)` that returns `as.Date(x)` if it succeeds and `NA` (of class Date) if it errors. Apply it to the vector `c("2024-01-01", "not a date", "2024-12-31")` and save the resulting Date vector to `ex_6_3`.

**Expected result:**

```
#> [1] "2024-01-01" NA           "2024-12-31"
```

**Difficulty:** Advanced

```r title="Your turn"
safe_as_date <- function(x) {
  # your code here
}
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_as_date <- function(x) {
  tryCatch(as.Date(x), error = function(e) as.Date(NA))
}
ex_6_3 <- do.call(c, lapply(c("2024-01-01", "not a date", "2024-12-31"), safe_as_date))
ex_6_3
#> [1] "2024-01-01" NA           "2024-12-31"
```

**Explanation:** `tryCatch()` lets you map an R condition (error, warning, message) to a handler that returns a fallback value, so the calling code never sees the exception. Returning `as.Date(NA)` rather than plain `NA` keeps the result type stable as Date, which matters because `c(Date, NA)` would coerce to a list under strict typing. The `purrr::possibly()` adapter wraps this same pattern more concisely: `purrr::possibly(as.Date, otherwise = as.Date(NA))`. Senior follow-up: `withCallingHandlers()` versus `tryCatch()`.

</details>

### Exercise 6.4: S3 method dispatch on a custom class

**Task:** Define an S3 class `money` that wraps a numeric value and a currency string, with a print method that formats as `"<amount> <currency>"`. Construct two objects (`x` with 100 USD and `y` with 200 EUR), then capture the printed output of both using `capture.output()`. Save the length-two character vector to `ex_6_4`.

**Expected result:**

```
#> [1] "100 USD" "200 EUR"
```

**Difficulty:** Advanced

```r title="Your turn"
money <- function(amount, currency) {
  # your code here
}
print.money <- function(x, ...) {
  # your code here
}
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
money <- function(amount, currency) {
  obj <- list(amount = amount, currency = currency)
  class(obj) <- "money"
  obj
}
print.money <- function(x, ...) {
  cat(x$amount, x$currency, "\n")
  invisible(x)
}
x <- money(100, "USD")
y <- money(200, "EUR")
ex_6_4 <- trimws(capture.output(print(x), print(y)))
ex_6_4
#> [1] "100 USD" "200 EUR"
```

**Explanation:** S3 is R's lightweight class system: you attach a class string to an object, and generic functions like `print()` dispatch to `print.<class>()`. The convention is to return `invisible(x)` from print methods so `x <- print(obj)` does not double-print. S4 and R6 are more rigorous alternatives used for complex object hierarchies. Interview probe: "what is method dispatch?" expects you to mention `UseMethod("print")` inside the generic and the class-attribute lookup.

</details>

### Exercise 6.5: Group sum with data.table on a large frame

**Task:** Build an inline data.table with one million rows: `id` sampled from 1 to 100 and `value` from a uniform distribution. Compute the sum of `value` by `id` using data.table syntax. Set `set.seed(1)` so the result is reproducible. Save the resulting data.table (100 rows, two columns: `id`, `total`) to `ex_6_5`.

**Expected result:**

```
#>      id    total
#>   <int>    <num>
#> 1     1 4985.232
#> 2     2 5043.118
#> 3     3 4977.456
#> # 97 more rows
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
dt <- data.table(
  id    = sample(1:100, 1e6, replace = TRUE),
  value = runif(1e6)
)
ex_6_5 <- dt[, .(total = sum(value)), by = id][order(id)]
ex_6_5
#>      id    total
#>   <int>    <num>
#> 1     1 4985.232
#> 2     2 5043.118
#> 3     3 4977.456
#> # 97 more rows
```

**Explanation:** data.table's `dt[i, j, by]` syntax is the fastest in-memory group-by available in R, often 5x to 50x faster than dplyr on large frames. The `.()` is shorthand for `list()`, and the second bracket chains a sort. For data over a million rows, data.table or DuckDB (via `duckdb::duckdb()` plus dbplyr) is the standard senior-level answer. Interviewers ask this question to filter who has touched large-scale R workloads from who has only worked with toy data.

</details>

### Exercise 6.6: Use tryCatch with a finally clause

**Task:** Write a function `read_with_cleanup(path)` that opens a temporary connection to `path`, reads it with `readLines()`, and always closes the connection (even on error) using `tryCatch()`'s `finally` argument. Demonstrate by writing two lines `"hello"` and `"world"` to a tempfile, reading them back, and saving the resulting character vector to `ex_6_6`.

**Expected result:**

```
#> [1] "hello" "world"
```

**Difficulty:** Intermediate

```r title="Your turn"
read_with_cleanup <- function(path) {
  # your code here
}
tmp <- tempfile()
writeLines(c("hello", "world"), tmp)
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
read_with_cleanup <- function(path) {
  con <- file(path, "r")
  tryCatch(
    readLines(con),
    finally = close(con)
  )
}
tmp <- tempfile()
writeLines(c("hello", "world"), tmp)
ex_6_6 <- read_with_cleanup(tmp)
ex_6_6
#> [1] "hello" "world"
```

**Explanation:** The `finally` block runs whether the protected expression succeeds or throws, which is the right place to close file connections, release locks, or restore options. Without it, an error mid-read would leak a file handle until the next garbage collection. The modern `withr::with_connection()` or `local({ on.exit(close(con)); ... })` patterns wrap this cleanly. Senior interviewers expect you to know that `on.exit(..., add = TRUE)` is the function-scope equivalent.

</details>

### Exercise 6.7: Memoise an expensive function

**Task:** Write a memoised version of `slow_double <- function(x) { Sys.sleep(0); x * 2 }` using a closure that caches results in an environment keyed by the argument. Demonstrate by calling the memoised function with `c(5, 5, 7)` and saving the integer vector of results to `ex_6_7`. (The grader does not check timing.)

**Expected result:**

```
#> [1] 10 10 14
```

**Difficulty:** Advanced

```r title="Your turn"
memoise <- function(f) {
  # your code here
}
slow_double <- function(x) { Sys.sleep(0); x * 2 }
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
memoise <- function(f) {
  cache <- new.env(hash = TRUE)
  function(x) {
    key <- as.character(x)
    if (!exists(key, envir = cache, inherits = FALSE)) {
      assign(key, f(x), envir = cache)
    }
    get(key, envir = cache, inherits = FALSE)
  }
}
slow_double <- function(x) { Sys.sleep(0); x * 2 }
fast_double <- memoise(slow_double)
ex_6_7 <- vapply(c(5, 5, 7), fast_double, numeric(1))
ex_6_7
#> [1] 10 10 14
```

**Explanation:** Memoisation caches the result of pure functions by argument so repeated calls with the same input return instantly. The implementation uses an environment (hashed, mutable, scoped to the closure) keyed by the stringified argument. The CRAN `memoise` package does this with proper hashing, TTLs, and disk backends; the hand-rolled version is enough for interviews. Memoisation only works for deterministic functions; never memoise something that touches the filesystem, network, or random number generator.

</details>

## What to do next

These fifty drills cover the floor of what mid- and senior-level R interviews ask. Once they feel routine, layer in more focused practice:

- For deeper data wrangling reps, work through [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- For the apply family and functional idioms, the [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) hub goes harder on `vapply`, `Map`, and `Reduce`.
- For ggplot2 muscle memory, run the [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) set end to end.
- For real-world data wrangling at scale, the [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) hub mixes dplyr, tidyr, and data.table problems.
