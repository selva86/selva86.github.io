---
title: "data.table Exercises in R: 50 Real Practice Problems"
slug: "data.table-Exercises-in-R"
description: "Practise data.table with 50 scenario-led problems in R covering i/j/by, in-place updates, joins, reshape, special symbols and performance. Hidden solutions."
keywords: "data.table exercises, data.table practice, data.table exercises in R, learn data.table by example, data.table problems R, data.table tutorial practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "data.table Exercises"
sidebar_order: 105
fr_parent: "R-Tutorial.html"
auto_link_terms: "data.table exercises|data.table practice|data.table exercises in R|practice data.table|data.table problems"
auto_link_case_sensitive: false
target_keyword: "data.table exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# data.table Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty hands-on practice problems on data.table covering the i/j/by triple, in-place modification with `:=`, joins, reshape, the special symbols family and the performance idioms that make data.table fast. Solutions are hidden under each exercise so you can attempt first and verify after.</p>

```r title="Run this once before any exercise"
library(data.table)
library(ggplot2)

mt <- as.data.table(mtcars, keep.rownames = "car")
ir <- as.data.table(iris)
dm <- as.data.table(diamonds)
aq <- as.data.table(airquality)
```

## Section 1. The i, j, by triple (10 problems)

### Exercise 1.1: Filter fuel-efficient cars with i

**Task:** Use the `i` slot of data.table on the `mt` data.table to keep only rows where `mpg` is strictly greater than 25. Print the result and save it to `ex_1_1`.

**Expected result:**

```
#>               car  mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#>            <char> <num> ...
#> 1:      Fiat 128  32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> 2:   Honda Civic  30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> 3: Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> 4:     Fiat X1-9  27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> 5: Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> 6:   Lotus Europa 30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mt[mpg > 25]
ex_1_1
```

**Explanation:** Inside `[`, the first argument is `i` and lives entirely in the data.table's column namespace, so you write `mpg > 25` not `mt$mpg > 25`. Compared to base R's `mt[mt$mpg > 25, ]` this is shorter and avoids repeating the table name. data.table also evaluates `i` more efficiently when a key or index is set, which you'll explore later in Section 6.

</details>

### Exercise 1.2: Select two columns by name in j

**Task:** From `mt`, return only the `car` and `mpg` columns using `j` with `list()` (or its `.` alias). Keep all rows. Save the resulting two-column data.table to `ex_1_2`.

**Expected result:**

```
#>                 car   mpg
#>              <char> <num>
#>  1:       Mazda RX4  21.0
#>  2:   Mazda RX4 Wag  21.0
#>  3:      Datsun 710  22.8
#>  4:  Hornet 4 Drive  21.4
#>  ...
#> 32 rows total
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mt[, .(car, mpg)]
ex_1_2
```

**Explanation:** Writing column names inside `.()` (a shorthand for `list()`) tells data.table to return a new data.table with those columns. Without `.()`, `mt[, car]` returns a plain vector of car names because j is a single expression. The `.()` form is the idiomatic way to subset multiple columns while keeping data.table structure.

</details>

### Exercise 1.3: Compute mean mpg in j

**Task:** Compute the mean of `mpg` across all 32 rows of `mt` by writing the aggregation directly in the `j` slot. The result should be a single-row data.table with a named column called `avg_mpg`. Save it to `ex_1_3`.

**Expected result:**

```
#>     avg_mpg
#>       <num>
#> 1: 20.09062
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- mt[, .(avg_mpg = mean(mpg))]
ex_1_3
```

**Explanation:** When `j` is wrapped in `.()`, you can name the returned columns inline using `name = expression` syntax, mirroring `dplyr::summarise`. Drop the `.()` and you get a bare numeric value, which is sometimes what you want, but losing the column name makes downstream code harder to chain. Use `.()` whenever you'll bind, join or print the result.

</details>

### Exercise 1.4: Lot manager filters and selects in one step

**Task:** A used-car lot manager wants only the model name and weight of cars that achieve at least 25 mpg and have four cylinders. Combine the row filter in `i` and the column projection in `j` of `mt`. Save the two-column data.table to `ex_1_4`.

**Expected result:**

```
#>               car    wt
#>            <char> <num>
#> 1:      Fiat 128  2.200
#> 2:   Honda Civic  1.615
#> 3: Toyota Corolla 1.835
#> 4:     Fiat X1-9  1.935
#> 5:   Lotus Europa 1.513
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- mt[mpg >= 25 & cyl == 4, .(car, wt)]
ex_1_4
```

**Explanation:** `i` and `j` are independent expressions, so you can stack a logical filter and a column projection in a single bracketed call without piping. The order is fixed: rows first, then columns. Compared to base R you avoid creating an intermediate subset and avoid repeating `mt$`, which is the main ergonomic win of data.table syntax.

</details>

### Exercise 1.5: Group mean mpg by cylinder count

**Task:** Compute the mean of `mpg` for each value of `cyl` in `mt`. Use the `by` slot. Name the aggregated column `mean_mpg` and save the two-column data.table to `ex_1_5`.

**Expected result:**

```
#>      cyl mean_mpg
#>    <num>    <num>
#> 1:     6 19.74286
#> 2:     4 26.66364
#> 3:     8 15.10000
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- mt[, .(mean_mpg = mean(mpg)), by = cyl]
ex_1_5
```

**Explanation:** The `by` slot defines the grouping. data.table returns groups in the order they first appear in the source table. To get groups in sorted order without re-sorting afterwards, use `keyby = cyl` instead. `keyby` also sets a key on the result, which makes downstream joins and lookups fast.

</details>

### Exercise 1.6: Multiple aggregations per group

**Task:** For each `cyl` group in `mt`, compute three statistics in one call: mean of `mpg`, max of `hp`, and the count of rows using `.N`. Name the columns `mean_mpg`, `max_hp`, `n`. Save the result to `ex_1_6`.

**Expected result:**

```
#>      cyl mean_mpg max_hp     n
#>    <num>    <num> <num> <int>
#> 1:     6 19.74286   175     7
#> 2:     4 26.66364   113    11
#> 3:     8 15.10000   335    14
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- mt[, .(mean_mpg = mean(mpg),
                 max_hp   = max(hp),
                 n        = .N), by = cyl]
ex_1_6
```

**Explanation:** Each item inside `.()` is its own expression evaluated per group. `.N` is a special symbol holding the number of rows in the current group, so it works without referencing any column. Mixing summary functions and `.N` in one call is the standard "summary by group" pattern in data.table and avoids the multi-step `group_by + summarise` flow.

</details>

### Exercise 1.7: Marketing manager groups by two keys

**Task:** A marketing manager looking at `mt` wants the average `mpg` broken out by every combination of `cyl` and `am` (transmission). Group by both columns simultaneously using `by`. Save the result to `ex_1_7`.

**Expected result:**

```
#>      cyl    am mean_mpg
#>    <num> <num>    <num>
#> 1:     6     1 20.56667
#> 2:     4     1 28.07500
#> 3:     6     0 19.12500
#> 4:     8     0 15.05000
#> 5:     4     0 22.90000
#> 6:     8     1 15.40000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- mt[, .(mean_mpg = mean(mpg)), by = .(cyl, am)]
ex_1_7
```

**Explanation:** Pass multiple grouping columns inside `.()` (or `list()`). The output has one row per unique combination. With `keyby = .(cyl, am)` instead, you'd get the same six rows but sorted by both keys, which often matters for plotting or for downstream merges that rely on a sort order.

</details>

### Exercise 1.8: Order rows in i by descending mpg

**Task:** Sort `mt` by `mpg` from highest to lowest and return only the top six rows so you can inspect the most fuel-efficient cars. Use `order(-mpg)` inside `i`. Save the six-row data.table to `ex_1_8`.

**Expected result:**

```
#>               car  mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#>            <char> <num> ...
#> 1: Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> 2:      Fiat 128  32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> 3:  Honda Civic   30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> 4: Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> 5:     Fiat X1-9  27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> 6: Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- mt[order(-mpg)][1:6]
ex_1_8
```

**Explanation:** data.table overrides `order()` internally with a fast radix-sort version when used inside `[`. The minus sign reverses direction. Chaining `[1:6]` afterwards is the idiomatic "top N" pattern. For an in-place sort that also rearranges the underlying object (no copy), use `setorder(mt, -mpg)` instead, which is slightly faster on large tables.

</details>

### Exercise 1.9: Junior analyst chains two brackets

**Task:** A junior analyst onboarding to data.table wants to compute the mean `mpg` per `cyl` using `mt`, then keep only the groups where the mean is above 18, using bracket chaining `[][]`. Save the filtered grouped result to `ex_1_9`.

**Expected result:**

```
#>      cyl mean_mpg
#>    <num>    <num>
#> 1:     6 19.74286
#> 2:     4 26.66364
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_9 <- # your code here
ex_1_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_9 <- mt[, .(mean_mpg = mean(mpg)), by = cyl][mean_mpg > 18]
ex_1_9
```

**Explanation:** Bracket chaining is data.table's answer to the pipe: the first `[]` produces an intermediate data.table and the second filters it. Because each `[]` returns a fresh data.table, you can chain arbitrarily many. The newly named `mean_mpg` column is available immediately in the next bracket since it lives in the intermediate result.

</details>

### Exercise 1.10: Group by an expression rather than a column

**Task:** Compute the mean `mpg` of cars in `mt` split into two groups defined by the logical expression `am == 1`, naming the grouping output column `is_manual`. Group by the expression directly, no helper column. Save the two-row result to `ex_1_10`.

**Expected result:**

```
#>    is_manual mean_mpg
#>       <lgcl>    <num>
#> 1:     FALSE 17.14737
#> 2:      TRUE 24.39231
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_10 <- # your code here
ex_1_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_10 <- mt[, .(mean_mpg = mean(mpg)), by = .(is_manual = am == 1)]
ex_1_10
```

**Explanation:** `by` accepts arbitrary expressions, not just column names. Naming them inside `.()` makes the output column explicit. This pattern saves you from creating a throwaway flag column before grouping. It's especially handy in interactive analysis when you want a quick "is X true vs not" cut without polluting the source table.

</details>

## Section 2. Modify in place with := (8 problems)

### Exercise 2.1: Add a kilometres-per-litre column

**Task:** On the `mt` data.table, create a new column `kpl` that converts US `mpg` to kilometres per litre using the factor 0.4251, modifying `mt` in place with the walrus operator. Then print `mt` and save it to `ex_2_1`.

**Expected result:**

```
#>               car  mpg cyl  disp  hp drat    wt  qsec vs am gear carb     kpl
#>            <char> <num>           ...                                    <num>
#> 1:     Mazda RX4 21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4   8.9271
#> 2: Mazda RX4 Wag 21.0   6 160.0 110 3.90 2.875 17.02  0  1    4    4   8.9271
#> ...
```

**Difficulty:** Beginner

```r title="Your turn"
mt[, kpl := # your code here]
ex_2_1 <- mt
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, kpl := mpg * 0.4251]
ex_2_1 <- mt
ex_2_1
```

**Explanation:** The `:=` operator modifies the data.table by reference: no new object is created and the assignment returns invisibly. That makes it extremely memory-efficient for large tables compared to `mt$kpl <- mt$mpg * 0.4251`, which would copy the whole frame. To see the modified table after a `:=`, print it explicitly or wrap the call in `[]` on the right side.

</details>

### Exercise 2.2: Compliance officer flags low-fuel-economy vehicles

**Task:** A compliance officer wants a new logical column `low_mpg` on `mt` set to `TRUE` whenever `mpg` is below 18, otherwise `FALSE`. Create the column with `:=` in a single call, then save the modified `mt` to `ex_2_2`.

**Expected result:**

```
#>               car  mpg ... low_mpg
#> 1:     Mazda RX4 21.0  ...   FALSE
#> 2: Hornet 4 Drive 21.4 ...   FALSE
#> 3:    Duster 360  14.3 ...    TRUE
#> 4:   Merc 240D   24.4  ...   FALSE
#> 5: Cadillac Fleetwood 10.4 ...    TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
mt[, low_mpg := # your code here]
ex_2_2 <- mt
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, low_mpg := mpg < 18]
ex_2_2 <- mt
ex_2_2
```

**Explanation:** A logical expression on a vector evaluates element-wise, so `mpg < 18` produces a logical vector of the right length automatically. No `ifelse` wrapper is needed when the result is already `TRUE`/`FALSE`. If you wanted "Low"/"Normal" labels instead, switch to `fifelse(mpg < 18, "Low", "Normal")`, the type-stable data.table version of `ifelse`.

</details>

### Exercise 2.3: Add two columns at once with the list form

**Task:** In a single bracketed call on `mt`, create two new columns simultaneously: `power_to_weight` defined as `hp / wt`, and `disp_per_cyl` defined as `disp / cyl`. Use the `:= list(...)` form, then save the modified `mt` to `ex_2_3`.

**Expected result:**

```
#>               car  mpg ... power_to_weight disp_per_cyl
#> 1:     Mazda RX4 21.0  ...         41.984        26.66667
#> 2: Hornet 4 Drive 21.4 ...         33.426        43.00000
#> 3:    Duster 360  14.3 ...         62.171        45.00000
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
mt[, `:=`(
  power_to_weight = # your code here,
  disp_per_cyl    = # your code here
)]
ex_2_3 <- mt
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, `:=`(
  power_to_weight = hp / wt,
  disp_per_cyl    = disp / cyl
)]
ex_2_3 <- mt
ex_2_3
```

**Explanation:** The functional form `` `:=`(name1 = expr1, name2 = expr2) `` is the cleanest way to add multiple columns in one pass. It edits the table once, scanning columns just once, which is faster than calling `:=` twice in a row. Use this whenever you have several derived columns to compute together.

</details>

### Exercise 2.4: Remove an unwanted column

**Task:** The marketing analyst no longer needs the `qsec` (quarter-mile time) column from `mt`. Remove the column in place by assigning it to `NULL` with `:=`. Then save the slimmer `mt` to `ex_2_4`.

**Expected result:**

```
#> "qsec" %in% names(ex_2_4)
#> [1] FALSE
```

**Difficulty:** Beginner

```r title="Your turn"
mt[, qsec := # your code here]
ex_2_4 <- mt
"qsec" %in% names(ex_2_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, qsec := NULL]
ex_2_4 <- mt
"qsec" %in% names(ex_2_4)
#> [1] FALSE
```

**Explanation:** Setting a column to `NULL` via `:=` deletes it by reference, in constant time, regardless of table size. This is the data.table equivalent of `df$qsec <- NULL` but it does not copy the whole table. To drop multiple columns at once use `mt[, c("col1", "col2") := NULL]`.

</details>

### Exercise 2.5: Audit team patches values in a subset

**Task:** An audit team on `mt` wants to clamp implausibly high gear values: for any row where `gear` is greater than 4, set `gear` to exactly 4. Combine an `i` filter with a `j` update via `:=`. Save the modified `mt` to `ex_2_5`.

**Expected result:**

```
#> ex_2_5[, max(gear)]
#> [1] 4
```

**Difficulty:** Intermediate

```r title="Your turn"
mt[# your i filter, gear := # your replacement value]
ex_2_5 <- mt
ex_2_5[, max(gear)]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[gear > 4, gear := 4]
ex_2_5 <- mt
ex_2_5[, max(gear)]
#> [1] 4
```

**Explanation:** When `:=` is combined with an `i` filter, the assignment only touches the matched rows, leaving all others untouched. This is the canonical "patch a subset" idiom: cheap, in place, no copy. Equivalent base R code, `mt$gear[mt$gear > 4] <- 4`, works but is slower on wide tables because it triggers a copy of the whole frame in some R versions.

</details>

### Exercise 2.6: Sports scout ranks players within position

**Task:** Treat `cyl` as a "position" and `hp` as a "performance score" on `mt`. A sports scout wants a new column `hp_rank` giving the descending rank of `hp` within each `cyl` group. Compute it with `:=` and `by`. Save the modified `mt` to `ex_2_6`.

**Expected result:**

```
#> ex_2_6[order(cyl, hp_rank), .(car, cyl, hp, hp_rank)][1:6]
#>                car   cyl   hp hp_rank
#> 1:    Lotus Europa     4 113       1
#> 2:    Honda Civic     4  52       11
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
mt[, hp_rank := # your code here, by = cyl]
ex_2_6 <- mt
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, hp_rank := frank(-hp, ties.method = "min"), by = cyl]
ex_2_6 <- mt
ex_2_6[order(cyl, hp_rank), .(car, cyl, hp, hp_rank)][1:6]
```

**Explanation:** `frank` is data.table's fast equivalent of base `rank`. Combined with `:=` and `by`, it produces a within-group rank in one pass without splitting and recombining. Negating `hp` reverses the order so higher horsepower gets rank 1. The `ties.method = "min"` choice gives the smallest of the tied ranks to all tied values, a common choice for leaderboards.

</details>

### Exercise 2.7: Rename two columns in place

**Task:** Rename the `disp` column of `mt` to `displacement` and the `wt` column to `weight_klb` using `setnames()` in a single call with vector arguments. This modifies `mt` in place. Save the renamed table to `ex_2_7`.

**Expected result:**

```
#> all(c("displacement", "weight_klb") %in% names(ex_2_7))
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
setnames(mt, old = # your old names, new = # your new names)
ex_2_7 <- mt
all(c("displacement", "weight_klb") %in% names(ex_2_7))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setnames(mt, old = c("disp", "wt"), new = c("displacement", "weight_klb"))
ex_2_7 <- mt
all(c("displacement", "weight_klb") %in% names(ex_2_7))
#> [1] TRUE
```

**Explanation:** `setnames` renames columns by reference, never copying the table. The `old`/`new` vector form lets you rename many at once and is order-sensitive: position 1 in `old` maps to position 1 in `new`. To rename by position, pass integer indices in `old`. After this exercise, remember the table is permanently changed for downstream exercises in your session.

</details>

### Exercise 2.8: Functional := over many columns programmatically

**Task:** Convert all numeric columns of `ir` (sepal and petal measurements) from centimetres to millimetres by multiplying each by 10, in place, using `:=` with column vectors selected via `.SDcols`. Save the modified `ir` to `ex_2_8`.

**Expected result:**

```
#> ex_2_8[1:3]
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>           <num>       <num>        <num>       <num>  <fctr>
#> 1:           51          35           14           2  setosa
#> 2:           49          30           14           2  setosa
#> 3:           47          32           13           2  setosa
```

**Difficulty:** Advanced

```r title="Your turn"
num_cols <- # column names to convert
ir[, (num_cols) := # your code here]
ex_2_8 <- ir
ex_2_8[1:3]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
num_cols <- names(ir)[sapply(ir, is.numeric)]
ir[, (num_cols) := lapply(.SD, function(x) x * 10), .SDcols = num_cols]
ex_2_8 <- ir
ex_2_8[1:3]
```

**Explanation:** The `(num_cols)` syntax on the left of `:=` unquotes the variable so the names come from the character vector, not literally. `.SD` is the subset of data, restricted to `.SDcols`, and `lapply` iterates a function over each column. This idiom scales: change `.SDcols` and the function, and the same shape works for hundreds of columns.

</details>

## Section 3. Special symbols and helpers (8 problems)

### Exercise 3.1: Count rows per cylinder group with .N

**Task:** Use the `.N` special symbol on `mt` to compute the number of rows in each `cyl` group. Return a two-column data.table with `cyl` and `n`. Save the result to `ex_3_1`.

**Expected result:**

```
#>      cyl     n
#>    <num> <int>
#> 1:     6     7
#> 2:     4    11
#> 3:     8    14
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mt[, .(n = .N), by = cyl]
ex_3_1
```

**Explanation:** `.N` is the row count of the current `i`-filtered, `by`-grouped frame. It is an integer scalar inside each group, so wrapping it with `.()` gives you a named output column. This is the data.table equivalent of `dplyr::count(cyl)` and the most-used idiom in real-world data.table code.

</details>

### Exercise 3.2: Total rows in the table with .N

**Task:** Without using `nrow()`, count the total number of rows in `mt` by referencing `.N` from the `j` slot without a `by` argument. Return a single-row data.table named `total_rows`. Save the result to `ex_3_2`.

**Expected result:**

```
#>    total_rows
#>         <int>
#> 1:         32
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mt[, .(total_rows = .N)]
ex_3_2
```

**Explanation:** With no `by`, `.N` refers to the whole table (after any `i` filter). This is the convenient way to express a row count plus other summary stats in the same call. Note that `mt[, .N]` (without the `.()` wrapper) returns a bare integer instead of a single-row data.table, which is fine for printing but harder to bind into a result table.

</details>

### Exercise 3.3: Inspect the structure of .SD

**Task:** Inside `j`, return `.SD` itself for the first row of each `cyl` group of `mt`. This shows that `.SD` is the data.table of all non-`by` columns for the current group. Use `head(.SD, 1)` and group by `cyl`. Save the result to `ex_3_3`.

**Expected result:**

```
#>     cyl            car   mpg displacement  hp drat weight_klb vs am gear carb kpl low_mpg power_to_weight disp_per_cyl hp_rank
#>   <num>         <char> <num>        <num> ...                                              
#> 1:    6      Mazda RX4 21.0        160.0 110 3.90      2.620  0  1    4    4 ...
#> 2:    4     Datsun 710 22.8        108.0  93 3.85      2.320  1  1    4    1 ...
#> 3:    8 Hornet Sportabout 18.7    360.0 175 3.15      3.440  0  0    3    2 ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mt[, head(.SD, 1), by = cyl]
ex_3_3
```

**Explanation:** `.SD` is "Subset of Data" and represents the per-group slice of the table without the grouping columns. Returning `head(.SD, 1)` per group is the data.table equivalent of `dplyr::slice_head(n = 1)`. Because `.SD` includes all non-group columns by default, this is also useful for sampling, lagging, or any per-group operation that needs the full row, not just an aggregate.

</details>

### Exercise 3.4: Auditor summarises a column subset

**Task:** An auditor wants the mean of only the `mpg`, `hp` and `weight_klb` columns of `mt`, by `cyl`. Use `.SD` with `.SDcols` to restrict the columns considered, then apply `lapply(.SD, mean)`. Save the four-column result to `ex_3_4`.

**Expected result:**

```
#>      cyl      mpg        hp weight_klb
#>    <num>    <num>     <num>      <num>
#> 1:     6 19.74286 122.28571   3.117143
#> 2:     4 26.66364  82.63636   2.285727
#> 3:     8 15.10000 209.21429   3.999214
```

**Difficulty:** Intermediate

```r title="Your turn"
audit_cols <- # column names
ex_3_4 <- mt[, # your j expression, by = cyl, .SDcols = audit_cols]
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
audit_cols <- c("mpg", "hp", "weight_klb")
ex_3_4 <- mt[, lapply(.SD, mean), by = cyl, .SDcols = audit_cols]
ex_3_4
```

**Explanation:** `.SDcols` controls which columns end up in `.SD`. Combined with `lapply(.SD, FUN)` it's the standard pattern for "apply this function to many columns at once". Pass a character vector, an integer range, or a function predicate like `is.numeric` to choose columns dynamically. The output has one row per group with one summary column per `.SDcols` entry.

</details>

### Exercise 3.5: Performance reviewer keeps top per group

**Task:** A performance reviewer wants the two heaviest cars within each `cyl` group of `mt`, returning the full row for each. Use `.SD` with `head` after ordering, all in one bracketed call using `order` in `i` per group. Save the resulting data.table to `ex_3_5`.

**Expected result:**

```
#>      cyl                  car weight_klb ...
#>    <num>               <char>      <num>
#> 1:     6        Valiant         3.460
#> 2:     6         Merc 280C    3.440
#> 3:     4   Toyota Corona      2.465
#> 4:     4      Volvo 142E     2.780
#> 5:     8 Lincoln Continental    5.424
#> 6:     8 Cadillac Fleetwood    5.250
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- mt[order(-weight_klb), # your code here, by = cyl]
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- mt[order(-weight_klb), head(.SD, 2), by = cyl]
ex_3_5
```

**Explanation:** When `i` sorts globally and `by` groups afterwards, data.table preserves the sorted order within each group. Calling `head(.SD, 2)` per group then takes the top two heaviest rows. This "sort then per-group head" trick is the cleanest top-N idiom in data.table and is much faster than splitting by group and applying `head` separately.

</details>

### Exercise 3.6: Tag groups with a sequential ID using .GRP

**Task:** Add a column `grp_id` to `mt` containing a sequential integer that increments per `cyl` group, using the `.GRP` special symbol. Cars in the same cylinder bucket share an id. Save the modified `mt` to `ex_3_6`.

**Expected result:**

```
#> ex_3_6[, .(car, cyl, grp_id)][1:4]
#>               car   cyl grp_id
#> 1:     Mazda RX4     6      1
#> 2: Mazda RX4 Wag    6      1
#> 3:    Datsun 710    4      2
#> 4: Hornet 4 Drive   6      1
```

**Difficulty:** Advanced

```r title="Your turn"
mt[, grp_id := # your code here, by = cyl]
ex_3_6 <- mt
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, grp_id := .GRP, by = cyl]
ex_3_6 <- mt
ex_3_6[, .(car, cyl, grp_id)][1:4]
```

**Explanation:** `.GRP` is an integer that uniquely tags each group, assigned in the order the groups are encountered. It is useful for tracing which rows belong together after a complex pipeline, for joining a per-group lookup back, or as a compact factor replacement. Note: the numbering follows the order groups appear in the source, not the sorted order; use `keyby` to align the two.

</details>

### Exercise 3.7: Reporting analyst captures original row indices

**Task:** A reporting analyst wants the original row position of the maximum-`hp` car within each `cyl` group of `mt`, using the `.I` special symbol that holds row indices. Return a two-column table of `cyl` and `row_idx`. Save it to `ex_3_7`.

**Expected result:**

```
#>      cyl row_idx
#>    <num>   <int>
#> 1:     6      31
#> 2:     4      28
#> 3:     8      31
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_7 <- mt[, .(row_idx = # your code here), by = cyl]
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- mt[, .(row_idx = .I[which.max(hp)]), by = cyl]
ex_3_7
```

**Explanation:** `.I` is the vector of row indices in the original table for the current group. `which.max(hp)` returns the position of the maximum inside the group, and `.I[]` translates that group-relative position into the original row number. This is the standard idiom when you need the index back into the source frame, for example to update those rows or to extract them by `mt[idx_vector]`.

</details>

### Exercise 3.8: Inspect group metadata with .BY

**Task:** Apply a function inside `j` that returns the current group's values along with a per-group computed statistic on `mt`. Use `.BY` to inspect the grouping values inside the expression and pair it with the group's mean `mpg`. Save the resulting data.table to `ex_3_8`.

**Expected result:**

```
#>      cyl mean_mpg cyl_label
#>    <num>    <num>    <char>
#> 1:     6 19.74286 cyl=6
#> 2:     4 26.66364 cyl=4
#> 3:     8 15.10000 cyl=8
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_8 <- mt[, .(mean_mpg = mean(mpg),
                 cyl_label = # your code here), by = cyl]
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- mt[, .(mean_mpg = mean(mpg),
                 cyl_label = paste0("cyl=", .BY$cyl)), by = cyl]
ex_3_8
```

**Explanation:** `.BY` is a named list of the grouping column values inside the current group, even when the group is defined by an anonymous expression. It's most useful inside custom functions called from `j`, where the function body doesn't see the surrounding `by` argument. Use it to build descriptive labels, write group-specific log lines, or branch logic based on which group is currently being processed.

</details>

## Section 4. Joins (8 problems)

These problems use small inline data.tables that we construct first.

```r title="Inline join data"
customers <- data.table(
  cust_id = 1:5,
  name    = c("Anya", "Bilal", "Chen", "Devi", "Eli"),
  city    = c("Mumbai", "Lagos", "Shanghai", "Delhi", "Cairo")
)

orders <- data.table(
  order_id = 101:108,
  cust_id  = c(1, 1, 2, 3, 3, 3, 6, 6),
  amount   = c(120, 45, 230, 75, 60, 410, 50, 30)
)

price_bands <- data.table(
  band_lo = c(0, 1000, 5000),
  band_hi = c(999, 4999, Inf),
  band    = c("budget", "mid", "premium")
)

rates <- data.table(
  date = as.IDate(c("2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01")),
  rate = c(7.50, 7.65, 7.40, 7.30)
)

trades <- data.table(
  trade_id = 1:5,
  date     = as.IDate(c("2026-01-15", "2026-02-20", "2026-02-28", "2026-03-10", "2026-04-25"))
)
```

### Exercise 4.1: E-commerce analyst left-joins orders to customers

**Task:** An e-commerce analyst wants every `orders` row enriched with the customer's `name` and `city`. Use the `X[Y, on=]` idiom where the right-hand side is `customers` to perform a left join keeping all order rows. Save the merged data.table to `ex_4_1`.

**Expected result:**

```
#>    order_id cust_id amount   name     city
#>       <int>   <num>  <num> <char>   <char>
#> 1:      101       1    120   Anya   Mumbai
#> 2:      102       1     45   Anya   Mumbai
#> 3:      103       2    230  Bilal    Lagos
#> 4:      104       3     75   Chen Shanghai
#> 5:      105       3     60   Chen Shanghai
#> 6:      106       3    410   Chen Shanghai
#> 7:      107       6     50   <NA>     <NA>
#> 8:      108       6     30   <NA>     <NA>
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- customers[orders, on = "cust_id"]
ex_4_1
```

**Explanation:** Reading `customers[orders, on = "cust_id"]` aloud as "for every row of `orders`, look up the matching row in `customers`" gives you the mental model: the right-hand table is the driver, the bracketed table is the lookup. Rows from `orders` with no match get `NA` for the lookup columns. This is data.table's idiomatic left join and works without setting a key.

</details>

### Exercise 4.2: Inner join keeping only matched rows

**Task:** Repeat the previous join but drop unmatched order rows entirely, returning only the orders whose `cust_id` exists in `customers`. Use the `nomatch = NULL` argument inside the same bracketed join call. Save the resulting six-row data.table to `ex_4_2`.

**Expected result:**

```
#>    order_id cust_id amount   name     city
#>       <int>   <num>  <num> <char>   <char>
#> 1:      101       1    120   Anya   Mumbai
#> 2:      102       1     45   Anya   Mumbai
#> 3:      103       2    230  Bilal    Lagos
#> 4:      104       3     75   Chen Shanghai
#> 5:      105       3     60   Chen Shanghai
#> 6:      106       3    410   Chen Shanghai
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- customers[orders, on = "cust_id", nomatch = NULL]
ex_4_2
```

**Explanation:** The `nomatch = NULL` flag tells data.table to discard rows where the lookup fails, producing an inner join. The default `nomatch = NA` keeps unmatched rows with NAs (a left join). Memorising this single flag is enough to flip between left and inner joins without changing the rest of the syntax.

</details>

### Exercise 4.3: Full outer join with merge()

**Task:** Build the full outer join of `customers` and `orders` on `cust_id` so unmatched rows from both sides appear. Use `merge.data.table` with `all = TRUE`. Save the result to `ex_4_3`.

**Expected result:**

```
#>    cust_id   name     city order_id amount
#>      <num> <char>   <char>    <int>  <num>
#> 1:       1   Anya   Mumbai      101    120
#> 2:       1   Anya   Mumbai      102     45
#> 3:       2  Bilal    Lagos      103    230
#> 4:       3   Chen Shanghai      104     75
#> 5:       3   Chen Shanghai      105     60
#> 6:       3   Chen Shanghai      106    410
#> 7:       4   Devi    Delhi       NA     NA
#> 8:       5    Eli    Cairo       NA     NA
#> 9:       6   <NA>     <NA>      107     50
#>10:       6   <NA>     <NA>      108     30
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- merge(customers, orders, by = "cust_id", all = TRUE)
ex_4_3
```

**Explanation:** `merge` with `all = TRUE` returns every row from both tables, filling unmatched cells with NA. The bracket syntax `X[Y]` cannot express a full outer join directly, so `merge` is the right tool here. `all.x = TRUE` and `all.y = TRUE` give left and right outer joins respectively, completing the four standard join variants in a single function.

</details>

### Exercise 4.4: Fraud team finds anti-join orphans

**Task:** A fraud team wants the `orders` rows whose `cust_id` is unknown, that is rows that do NOT match anything in `customers`. Use the anti-join pattern with `!customers[orders, on = "cust_id", which = TRUE]` indexing on the order table. Save the orphan rows to `ex_4_4`.

**Expected result:**

```
#>    order_id cust_id amount
#>       <int>   <num>  <num>
#> 1:      107       6     50
#> 2:      108       6     30
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- orders[!customers, on = "cust_id"]
ex_4_4
```

**Explanation:** Prefixing the right-hand table with `!` flips the semantics from "keep matches" to "keep non-matches". This anti-join pattern reads naturally: "give me orders not in customers". It's the idiomatic way to find orphans, missing references, or recently churned IDs without writing an explicit `is.na` filter afterwards.

</details>

### Exercise 4.5: Risk team updates a column during the join

**Task:** A risk team wants to enrich `orders` in place with the customer's `city`, leaving unmatched orders with a `city` value of `"unknown"`. Use the update-on-join idiom `orders[customers, city := ..., on = "cust_id"]` then patch missing cities afterwards. Save the modified `orders` to `ex_4_5`.

**Expected result:**

```
#>    order_id cust_id amount     city
#>       <int>   <num>  <num>   <char>
#> 1:      101       1    120   Mumbai
#> 2:      102       1     45   Mumbai
#> 3:      103       2    230    Lagos
#> 4:      104       3     75 Shanghai
#> 5:      105       3     60 Shanghai
#> 6:      106       3    410 Shanghai
#> 7:      107       6     50  unknown
#> 8:      108       6     30  unknown
```

**Difficulty:** Advanced

```r title="Your turn"
orders[customers, city := # your code here, on = "cust_id"]
orders[is.na(city), city := "unknown"]
ex_4_5 <- orders
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders[customers, city := i.city, on = "cust_id"]
orders[is.na(city), city := "unknown"]
ex_4_5 <- orders
ex_4_5
```

**Explanation:** Inside an update-on-join, the right-hand table's columns are referenced with the `i.` prefix to disambiguate from the left-hand columns. `i.city` is the city column from `customers`. Update-on-join writes the new column directly into the left-hand table by reference, never creating a copy, which is the most memory-efficient way to enrich a large fact table with dimensional attributes.

</details>

### Exercise 4.6: Jeweller buckets prices with a non-equi join

**Task:** A jeweller has price bands in `price_bands` and a 100-row sample `dm_sample` of `diamonds`. Use a non-equi join on `price >= band_lo AND price <= band_hi` to label every diamond with its band. Save the labelled data.table to `ex_4_6`.

**Expected result:**

```
#>    price    band
#>    <int>  <char>
#> 1:   326  budget
#> 2:   326  budget
#> 3:   327  budget
#> 4:  2757     mid
#> 5: 18000 premium
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
dm_sample <- dm[1:100]
ex_4_6 <- # your code here
ex_4_6[1:5]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dm_sample <- dm[1:100]
ex_4_6 <- dm_sample[price_bands,
                    on = .(price >= band_lo, price <= band_hi),
                    .(price = x.price, band = i.band)]
ex_4_6[1:5]
```

**Explanation:** Non-equi joins use inequality operators inside `on = .()`. They are the data.table answer to "lookup by range", which would otherwise require a cross join plus filter. The `x.` prefix disambiguates the left-hand `price` column when the same name appears in the join condition. Non-equi joins also support `<`, `>` and combinations, and are dramatically faster than the SQL equivalent on large tables.

</details>

### Exercise 4.7: Trading desk uses a rolling join

**Task:** A trading desk has `trades` dated rows and `rates` dated reference rows. For each trade, attach the most recent rate as of the trade `date` using a rolling join with `roll = TRUE`. Save the joined data.table with `trade_id`, `date` and `rate` to `ex_4_7`.

**Expected result:**

```
#>    trade_id       date  rate
#>       <int>     <IDate> <num>
#> 1:        1 2026-01-15  7.50
#> 2:        2 2026-02-20  7.65
#> 3:        3 2026-02-28  7.65
#> 4:        4 2026-03-10  7.40
#> 5:        5 2026-04-25  7.30
```

**Difficulty:** Advanced

```r title="Your turn"
setkey(rates, date)
setkey(trades, date)
ex_4_7 <- rates[trades, # your code here, roll = TRUE]
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setkey(rates, date)
setkey(trades, date)
ex_4_7 <- rates[trades, .(trade_id, date, rate), roll = TRUE]
ex_4_7
```

**Explanation:** `roll = TRUE` carries the last observed value forward to fill gaps in the join. It's designed for time-series and reference data: as-of pricing, currency rates, last-known location. The keyed columns become the join columns automatically, so `setkey` on `date` for both tables is mandatory. Use `roll = -Inf` to carry the next value backward instead.

</details>

### Exercise 4.8: Multi-key join between two transactional tables

**Task:** Build two tables, `sales` and `targets`, each keyed on `region` and `quarter`, and join them on both columns simultaneously. The output should show every sales row with the matched target. Save the multi-key joined result to `ex_4_8`.

**Expected result:**

```
#>     region quarter  sales target
#>     <char>  <char>  <num>  <num>
#> 1:   North      Q1   1200   1000
#> 2:   North      Q2   1500   1400
#> 3:   South      Q1    900    800
#> 4:   South      Q2    980    900
```

**Difficulty:** Intermediate

```r title="Your turn"
sales <- data.table(
  region  = c("North", "North", "South", "South"),
  quarter = c("Q1", "Q2", "Q1", "Q2"),
  sales   = c(1200, 1500, 900, 980)
)
targets <- data.table(
  region  = c("North", "North", "South", "South"),
  quarter = c("Q1", "Q2", "Q1", "Q2"),
  target  = c(1000, 1400, 800, 900)
)
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- data.table(
  region  = c("North", "North", "South", "South"),
  quarter = c("Q1", "Q2", "Q1", "Q2"),
  sales   = c(1200, 1500, 900, 980)
)
targets <- data.table(
  region  = c("North", "North", "South", "South"),
  quarter = c("Q1", "Q2", "Q1", "Q2"),
  target  = c(1000, 1400, 800, 900)
)
ex_4_8 <- sales[targets, on = c("region", "quarter")]
ex_4_8
```

**Explanation:** Pass a character vector to `on =` to join on multiple columns. The match must align on every column, otherwise the row is unmatched. This is the workhorse pattern when fact tables and dimensions share a composite key. For the most common case where both tables already have an identical key set via `setkey`, you can omit `on =` entirely and data.table will use the shared key automatically.

</details>

## Section 5. Reshape with melt and dcast (6 problems)

### Exercise 5.1: Marketing analyst melts a wide table to long

**Task:** A marketing analyst has the wide table `iris` and wants a long version where each row holds one measurement value. Use `melt` on `ir` with `Species` as the id column to produce columns `variable` and `value`. Save the long data.table to `ex_5_1`.

**Expected result:**

```
#>     Species     variable value
#>      <fctr>       <fctr> <num>
#> 1:   setosa Sepal.Length    51
#> 2:   setosa Sepal.Length    49
#> ...
#> 600 rows total
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1[1:2]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- melt(ir, id.vars = "Species")
ex_5_1[1:2]
```

**Explanation:** `melt` converts wide to long. Columns listed in `id.vars` are preserved as identifiers; every other column becomes a stacked `variable`/`value` pair. The result has rows equal to `nrow(input) * (ncol - id_count)`. This is the input shape expected by `ggplot2`'s facetting and most modelling pipelines that want one observation per row.

</details>

### Exercise 5.2: Cast a long table back to wide

**Task:** Take `ex_5_1` from the previous problem and pivot it back to a wide table with one column per measurement variable, using `dcast`. The formula is `Species ~ variable`. Aggregate with `mean` since each Species has multiple measurements. Save the wide data.table to `ex_5_2`.

**Expected result:**

```
#>      Species Sepal.Length Sepal.Width Petal.Length Petal.Width
#>       <fctr>        <num>       <num>        <num>       <num>
#> 1:    setosa        50.06       34.28        14.62        2.46
#> 2: versicolor       59.36       27.70        42.60       13.26
#> 3:  virginica       65.88       29.74        55.52       20.26
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- dcast(ex_5_1, Species ~ variable, value.var = "value", fun.aggregate = mean)
ex_5_2
```

**Explanation:** `dcast` reverses `melt`. The formula has id columns on the left and the column that holds variable names on the right. When multiple rows share an id-variable pair, `fun.aggregate` collapses them; omitting it produces an error when duplicates exist. `value.var` names the column whose values fill the resulting cells.

</details>

### Exercise 5.3: Climatologist melts with multiple measure groups

**Task:** A climatologist has the `airquality` data.table `aq` and wants two measurement groups side by side: temperature/wind and ozone/solar.R per `Month` and `Day`. Use `melt` with the `measure.vars` argument as a list of two character vectors. Save the long data.table to `ex_5_3`.

**Expected result:**

```
#>    Month   Day variable1  value1 variable2 value2
#>    <int> <int>    <fctr>   <num>    <fctr>  <num>
#> 1:     5     1      Temp    67.0     Ozone     41
#> 2:     5     2      Temp    72.0     Ozone     36
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- melt(aq,
               id.vars      = c("Month", "Day"),
               measure.vars = list(c("Temp", "Wind"), c("Ozone", "Solar.R")))
ex_5_3[1:2]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- melt(aq,
               id.vars      = c("Month", "Day"),
               measure.vars = list(c("Temp", "Wind"), c("Ozone", "Solar.R")))
ex_5_3[1:2]
```

**Explanation:** Passing `measure.vars` as a list of vectors creates one melted group per list element, producing paired `variable1`/`value1`, `variable2`/`value2` columns. The two groups are aligned by position within each vector. This is the data.table-only shortcut for "melt multiple variable families at once" without running `melt` twice and joining the results.

</details>

### Exercise 5.4: Aggregate during dcast

**Task:** Cast `mt` to wide with rows by `cyl` and columns by `gear`, with each cell containing the count of cars in that combination. Use `dcast` with `fun.aggregate = length` and any column as `value.var`. Save the wide count table to `ex_5_4`.

**Expected result:**

```
#>      cyl   `3`   `4`   `5`
#>    <num> <int> <int> <int>
#> 1:     4     1     8     2
#> 2:     6     2     4     1
#> 3:     8    12     0     2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- dcast(mt, cyl ~ gear, value.var = "car", fun.aggregate = # your code here)
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- dcast(mt, cyl ~ gear, value.var = "car", fun.aggregate = length)
ex_5_4
```

**Explanation:** Setting `fun.aggregate = length` turns `dcast` into a fast cross-tabulation, faster than `table()` because it runs on the underlying data.table engine. Empty combinations become `0` rather than `NA` because the missing-cell fill default is `0` when `fun.aggregate` returns counts. Use `fill = NA` to override.

</details>

### Exercise 5.5: Ecologist dcasts multiple value columns

**Task:** An ecologist has `aq` and wants a wide table with rows by `Month`, columns by `Day`, and two value matrices side by side: mean `Temp` and mean `Wind`. Use `dcast` with `value.var = c("Temp", "Wind")`. Save the resulting wide data.table to `ex_5_5`.

**Expected result:**

```
#>    Month Temp_1 Temp_2 ... Wind_1 Wind_2 ...
#>    <int>  <num>  <num>      <num>  <num>
#> 1:     5     67     72         7.4    8.0
#> 2:     6     78     74         8.6    9.7
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_5 <- dcast(aq, Month ~ Day, value.var = # your code here, fun.aggregate = mean, na.rm = TRUE)
ex_5_5[, 1:5]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- dcast(aq, Month ~ Day,
                value.var = c("Temp", "Wind"),
                fun.aggregate = mean, na.rm = TRUE)
ex_5_5[, 1:5]
```

**Explanation:** Passing a character vector to `value.var` produces one set of wide columns per value variable, prefixed with the variable name. This is the easiest way to lay several measurement series next to each other for visual inspection without running `dcast` repeatedly. `na.rm = TRUE` is forwarded to `mean` so missing readings are ignored per cell.

</details>

### Exercise 5.6: Round-trip melt and dcast as a pivot pipeline

**Task:** Starting from `mt`, build a pipeline that melts the numeric columns `mpg`, `hp` and `weight_klb` to long form keyed on `car`, then immediately casts back with `dcast` to recover the original wide shape. Verify it round-trips. Save the wide reconstruction to `ex_5_6`.

**Expected result:**

```
#> identical(setcolorder(ex_5_6, c("car", "mpg", "hp", "weight_klb"))[order(car)], 
#>           mt[, .(car, mpg, hp, weight_klb)][order(car)])
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
long <- # your melt call
ex_5_6 <- # your dcast call
identical(
  setcolorder(ex_5_6, c("car", "mpg", "hp", "weight_klb"))[order(car)],
  mt[, .(car, mpg, hp, weight_klb)][order(car)]
)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long   <- melt(mt[, .(car, mpg, hp, weight_klb)], id.vars = "car")
ex_5_6 <- dcast(long, car ~ variable, value.var = "value")
identical(
  setcolorder(ex_5_6, c("car", "mpg", "hp", "weight_klb"))[order(car)],
  mt[, .(car, mpg, hp, weight_klb)][order(car)]
)
#> [1] TRUE
```

**Explanation:** `melt` then `dcast` is data.table's pivot pipeline. Round-tripping is a useful sanity check that no information was lost: the recovered table has the same rows and column types as the original. The pattern is also how you reshape via an intermediate long form when neither pure melt nor pure dcast is enough on its own.

</details>

## Section 6. Performance and idioms (10 problems)

### Exercise 6.1: Set a key and lookup by binary search

**Task:** Set `car` as the key on `mt` so lookups become binary searches rather than linear scans. Then retrieve the row for `"Honda Civic"` using `mt["Honda Civic"]`. Save the single-row result to `ex_6_1`.

**Expected result:**

```
#>            car   mpg cyl displacement  hp drat weight_klb vs am gear carb     kpl low_mpg power_to_weight disp_per_cyl hp_rank grp_id
#>         <char> <num>           ...
#> 1: Honda Civic 304.0 ...
```

**Difficulty:** Intermediate

```r title="Your turn"
setkey(mt, # your column)
ex_6_1 <- mt["Honda Civic"]
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setkey(mt, car)
ex_6_1 <- mt["Honda Civic"]
ex_6_1
```

**Explanation:** `setkey` sorts the table by reference and marks the column as the key, enabling O(log n) lookups via the `mt[value]` shorthand. Without a key, the same lookup is O(n) and you'd have to write `mt[car == "Honda Civic"]`. For batch lookups, pass a vector: `mt[c("Honda Civic", "Lotus Europa")]`. Keys are persistent: once set, they survive subset operations.

</details>

### Exercise 6.2: setorder mutates in place, order copies

**Task:** Sort `mt` by descending `hp` using `setorder` which modifies in place, and compare the runtime cost with `mt[order(-hp)]` which returns a copy, by capturing only the result of the in-place sort. Save the sorted `mt` to `ex_6_2`.

**Expected result:**

```
#> ex_6_2[1, .(car, hp)]
#>                  car    hp
#>               <char> <num>
#> 1: Maserati Bora       335
```

**Difficulty:** Intermediate

```r title="Your turn"
setorder(mt, # your sort spec)
ex_6_2 <- mt
ex_6_2[1, .(car, hp)]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setorder(mt, -hp)
ex_6_2 <- mt
ex_6_2[1, .(car, hp)]
```

**Explanation:** `setorder` reorders the rows of the table by reference, no copy, no key set, no return value. It's faster than `mt[order(-hp)]` because the latter materialises a copy. The minus sign in front of a column reverses sort direction. For sorting plus key setting in one call, use `setkey` which always sorts ascending; for sorting without keying, prefer `setorder`.

</details>

### Exercise 6.3: SRE adds a secondary index for fast filters

**Task:** An SRE wants repeated filters on `cyl` in `mt` to use an index without changing the table order. Set a secondary index on `cyl` using `setindex` and then filter with `mt[.(4), on = "cyl"]`. Save the four-cylinder rows to `ex_6_3`.

**Expected result:**

```
#> nrow(ex_6_3)
#> [1] 11
```

**Difficulty:** Advanced

```r title="Your turn"
setindex(mt, # your index column)
ex_6_3 <- mt[.(4), on = "cyl"]
nrow(ex_6_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setindex(mt, cyl)
ex_6_3 <- mt[.(4), on = "cyl"]
nrow(ex_6_3)
#> [1] 11
```

**Explanation:** A secondary index gives you the speed of binary search on a non-key column without reordering the table. data.table also auto-creates indexes when you filter with `==` on a column repeatedly: this is called "auto-indexing". You can inspect indexes with `indices(mt)` and remove them with `setindex(mt, NULL)`. Multiple indexes can coexist on different columns.

</details>

### Exercise 6.4: Use fcase for vectorised multi-branch logic

**Task:** Replace nested `ifelse` calls on `mt` by using `fcase` to label each car as `"low"`, `"mid"` or `"high"` based on whether `mpg` is below 18, between 18 and 25, or above 25 respectively. Add the label as a column `mpg_band`. Save the modified `mt` to `ex_6_4`.

**Expected result:**

```
#> ex_6_4[order(mpg), .(car, mpg, mpg_band)][1:3]
#>                car   mpg mpg_band
#>             <char> <num>   <char>
#> 1: Cadillac Fleetwood 10.4    low
#> 2: Lincoln Continental 10.4   low
#> 3:  Camaro Z28          13.3  low
```

**Difficulty:** Advanced

```r title="Your turn"
mt[, mpg_band := # your code here]
ex_6_4 <- mt
ex_6_4[order(mpg), .(car, mpg, mpg_band)][1:3]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, mpg_band := fcase(
  mpg < 18,             "low",
  mpg >= 18 & mpg <= 25, "mid",
  mpg > 25,             "high"
)]
ex_6_4 <- mt
ex_6_4[order(mpg), .(car, mpg, mpg_band)][1:3]
```

**Explanation:** `fcase` is data.table's vectorised, type-stable multi-branch conditional. It evaluates conditions top to bottom and returns the value for the first match. Unlike `dplyr::case_when`, it never silently coerces types, raising an error if branches mix incompatible types. Pass `default = "other"` to handle the catch-all rather than writing an explicit final `TRUE` row.

</details>

### Exercise 6.5: fwrite a table to a temporary file and read it back

**Task:** Write `mt` out to a temporary CSV file with `fwrite`, then read it back into a new data.table with `fread`. Save the round-tripped data.table to `ex_6_5`. This demonstrates the fast IO functions on the same session.

**Expected result:**

```
#> nrow(ex_6_5) == nrow(mt)
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
tmp <- tempfile(fileext = ".csv")
fwrite(mt, tmp)
ex_6_5 <- fread(tmp)
nrow(ex_6_5) == nrow(mt)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tmp <- tempfile(fileext = ".csv")
fwrite(mt, tmp)
ex_6_5 <- fread(tmp)
nrow(ex_6_5) == nrow(mt)
#> [1] TRUE
```

**Explanation:** `fread` and `fwrite` are typically 10x to 100x faster than base `read.csv`/`write.csv`, thanks to a multi-threaded C implementation. `fread` also auto-detects types, column separators and headers. For very large files, pass `nrows` to read a subset, `select` to keep only a few columns, or `cmd` to pipe through `gzip`/`grep` before reading.

</details>

### Exercise 6.6: setDT converts a data.frame without copying

**Task:** Start from a base R `data.frame` copy of `mtcars` and turn it into a data.table by reference using `setDT`. Demonstrate that the resulting object inherits `data.table` class. Save the converted table to `ex_6_6`.

**Expected result:**

```
#> inherits(ex_6_6, "data.table")
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
df <- as.data.frame(mtcars)
setDT(df, # your argument)
ex_6_6 <- df
inherits(ex_6_6, "data.table")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- as.data.frame(mtcars)
setDT(df, keep.rownames = "car")
ex_6_6 <- df
inherits(ex_6_6, "data.table")
#> [1] TRUE
```

**Explanation:** `setDT` upgrades a `data.frame` to a `data.table` in place, with zero copy. `as.data.table` does the same job but returns a new object, doubling memory transiently. `keep.rownames = "car"` preserves rownames as a column rather than dropping them, useful for `mtcars`-like datasets where the rowname is informative.

</details>

### Exercise 6.7: Code reviewer catches a copy() pitfall

**Task:** A code reviewer wants to demonstrate that assigning a data.table with `<-` does NOT copy. Create `dt_a <- mt`, modify `dt_a` with `:=`, then prove the original `mt` was also modified because they share memory. Use `copy()` to fix the bug and save the safely independent copy to `ex_6_7`.

**Expected result:**

```
#> ex_6_7[1, mpg] != mt[1, mpg]
#> [1] TRUE
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_7 <- copy(mt)
ex_6_7[, mpg := mpg * 2]
ex_6_7[1, mpg] != mt[1, mpg]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- copy(mt)
ex_6_7[, mpg := mpg * 2]
ex_6_7[1, mpg] != mt[1, mpg]
#> [1] TRUE
```

**Explanation:** Because `:=` mutates by reference, two variable names pointing at the same data.table will both see the change. `copy()` performs a deep copy so the new object is independent. This is the single most common source of subtle bugs in data.table code. The general rule: if a function accepts a data.table and mutates it with `:=` or `set*`, document it loudly or call `copy()` defensively at the top.

</details>

### Exercise 6.8: Chained := updates in a single pass

**Task:** Add three derived columns to `mt` in a single bracketed call to amortise overhead: `mpg_band_n` (1, 2, 3 for low/mid/high), `weight_t` (`weight_klb / 1000`), and `power_idx` (`hp * 0.001`). Use the functional `` `:=`(...) `` form. Save the modified `mt` to `ex_6_8`.

**Expected result:**

```
#> all(c("mpg_band_n", "weight_t", "power_idx") %in% names(ex_6_8))
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
mt[, `:=`(
  mpg_band_n = # your code,
  weight_t   = # your code,
  power_idx  = # your code
)]
ex_6_8 <- mt
all(c("mpg_band_n", "weight_t", "power_idx") %in% names(ex_6_8))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt[, `:=`(
  mpg_band_n = fmatch(mpg_band, c("low", "mid", "high")),
  weight_t   = weight_klb / 1000,
  power_idx  = hp * 0.001
)]
ex_6_8 <- mt
all(c("mpg_band_n", "weight_t", "power_idx") %in% names(ex_6_8))
#> [1] TRUE
```

**Explanation:** A single `` `:=`(...) `` call is faster than three back-to-back `:=` calls because the data.table dispatcher and column-name lookup happens once. The trade-off is readability: too many simultaneous updates start to obscure intent. Three to five is a common sweet spot. `fmatch` is data.table's fast `match` used here to translate a character band into a numeric index.

</details>

### Exercise 6.9: Geneticist counts distinct values with uniqueN

**Task:** A geneticist wants the count of distinct `gear` values per `cyl` group in `mt`. Use `uniqueN` inside `j` as a per-group expression. Return a two-column data.table of `cyl` and `n_gears`. Save the result to `ex_6_9`.

**Expected result:**

```
#>      cyl n_gears
#>    <num>   <int>
#> 1:     4       3
#> 2:     6       3
#> 3:     8       2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_9 <- mt[, .(n_gears = # your code here), by = cyl]
ex_6_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_9 <- mt[, .(n_gears = uniqueN(gear)), by = cyl]
ex_6_9
```

**Explanation:** `uniqueN` is data.table's fast distinct-count, equivalent to `length(unique(x))` but implemented in C and several times faster. It also accepts a data.table argument, in which case it counts distinct rows across all columns. Pair it with `by` for "cardinality per group" reports, a frequent metric in audits, churn dashboards and feature-engineering.

</details>

### Exercise 6.10: setcolorder rearranges columns by reference

**Task:** Rearrange the columns of `mt` so that `car`, `cyl` and `mpg` appear first in that order, followed by everything else in their current order. Use `setcolorder` which operates in place without copying. Save the rearranged `mt` to `ex_6_10`.

**Expected result:**

```
#> names(ex_6_10)[1:3]
#> [1] "car" "cyl" "mpg"
```

**Difficulty:** Beginner

```r title="Your turn"
setcolorder(mt, # your column order)
ex_6_10 <- mt
names(ex_6_10)[1:3]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setcolorder(mt, c("car", "cyl", "mpg"))
ex_6_10 <- mt
names(ex_6_10)[1:3]
#> [1] "car" "cyl" "mpg"
```

**Explanation:** `setcolorder` moves the listed columns to the front, in the order given, and leaves the rest in their original order. It mutates by reference, so no copy is made even on a very wide table. Use it to put key columns at the start of a printed table for readability, or to align column order across multiple tables before a `rbindlist`.

</details>

## What to do next

- Walk through the syntax fundamentals in the [dplyr Exercises](dplyr-Exercises-in-R.html) hub for an alternative grammar.
- Practise wider data-wrangling patterns in [Data Wrangling Exercises](Data-Wrangling-Exercises-in-R.html).
- Drill the `*apply` and functional patterns in [Apply Family Exercises](Apply-Family-Exercises-in-R.html).
- Sharpen statistical modelling with [Linear Regression Exercises](Linear-Regression-Exercises-in-R.html).
