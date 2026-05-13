---
title: "data.table Exercises in R: 20 Practice Problems with Solutions"
slug: "data-table-Exercises"
description: "Twenty data.table exercises in R covering DT[i, j, by], setkey, joins, .SD, chaining, melt, dcast, and update-by-reference. Solutions and explanations included."
keywords: "data.table exercises, data.table practice, R data.table problems, DT syntax, setkey, := operator, .SD .SDcols, rolling join, melt dcast"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "data.table (20 problems)"
sidebar_order: 145
fr_parent: "dplyr-filter-select.html"
auto_link_terms: "data.table exercises|data.table practice|data.table problems|update by reference|setkey"
auto_link_case_sensitive: false
target_keyword: "data.table exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# data.table Exercises in R: 20 Practice Problems with Solutions

<p class="lead">Twenty hands-on exercises that drill every part of the <code>data.table</code> mental model: row filters in <code>i</code>, column work in <code>j</code>, grouping with <code>by=</code>, update by reference with <code>:=</code>, chaining, <code>.SD</code>, keyed joins, and reshape. Each problem ships with a click-to-reveal solution and an explanation. Solutions are hidden so you can write your own answer first.</p>

```r title="Run this once before any exercise"
library(data.table)

dt_cars <- as.data.table(mtcars, keep.rownames = "model")
dt_air  <- as.data.table(airquality)
dt_iris <- as.data.table(iris)
dt_dia  <- as.data.table(diamonds)
```

`dt_cars` is `mtcars` with row names promoted to a `model` column (32 rows). `dt_air` and `dt_iris` are direct conversions of the matching base datasets. `dt_dia` is the 53,940-row `diamonds` table from ggplot2. Every exercise builds on one of these four tables, plus a few small inline tibbles you will construct as you go. All code shares one R session, so later exercises can reference earlier objects.

## Section 1. Convert and explore data tables (3 problems)

### Exercise 1.1: Convert airquality to a data.table and report its shape

**Task:** Convert the built-in `airquality` data frame to a data.table named `dt_aq`, print its dimensions, and confirm its class. Save the dimensions vector to `ex_1_1` so it can be reused later. This is the standard on-ramp move at the top of any data.table script.

**Expected result:**

```
#> [1] 153   6
#> [1] "data.table" "data.frame"
ex_1_1
#> [1] 153   6
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt_aq <- as.data.table(airquality)
ex_1_1 <- dim(dt_aq)
ex_1_1
#> [1] 153   6
class(dt_aq)
#> [1] "data.table" "data.frame"
```

**Explanation:** `as.data.table()` is the canonical converter; it keeps the column order, preserves types, and does NOT copy a `model` or row-name column unless you pass `keep.rownames=`. The returned object carries both `data.table` and `data.frame` classes, so any `data.frame` function still works on it. For an existing list of column vectors, use `setDT()` instead, which converts in place with zero copy.

</details>

### Exercise 1.2: Promote row names of mtcars into a column

**Task:** A code reviewer pulled in the base `mtcars` table and wants the car model exposed as a real column rather than living in row names. Convert `mtcars` to a data.table with row names promoted to a column called `model`, and save the resulting table to `ex_1_2`. Print the first three rows.

**Expected result:**

```
ex_1_2
#>                model  mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> 1:         Mazda RX4 21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> 2:     Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> 3:        Datsun 710 22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
head(ex_1_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- as.data.table(mtcars, keep.rownames = "model")
head(ex_1_2, 3)
#>                model  mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> 1:         Mazda RX4 21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> 2:     Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> 3:        Datsun 710 22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
```

**Explanation:** `keep.rownames=` accepts either `TRUE` (defaults the new column to `"rn"`) or a string for a custom column name. Once promoted, the column is plain character, so you can filter, join, and group on it like any other field. Forgetting this step is the most common cause of "where did my model column go" surprises when porting a base R workflow.

</details>

### Exercise 1.3: First-look summary of a data.table

**Task:** Use the working `dt_iris` table created in the setup block. A junior analyst onboarding to the project asks for a one-line check that prints row count, column count, and column names. Build a list with those three pieces using a single `dt_iris[]` call and save it to `ex_1_3`.

**Expected result:**

```
$rows
[1] 150

$cols
[1] 5

$names
[1] "Sepal.Length" "Sepal.Width"  "Petal.Length" "Petal.Width"  "Species"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- dt_iris[, list(rows = .N, cols = ncol(dt_iris), names = list(names(dt_iris)))]
ex_1_3 <- list(rows = ex_1_3$rows, cols = ex_1_3$cols, names = ex_1_3$names[[1]])
ex_1_3
#> $rows
#> [1] 150
#> $cols
#> [1] 5
#> $names
#> [1] "Sepal.Length" "Sepal.Width"  "Petal.Length" "Petal.Width"  "Species"
```

**Explanation:** Inside `j`, `.N` is the row count of the current grouping (whole table when there is no `by=`). The names of the columns are not in `.SD` directly, so we wrap them in a list to keep the character vector intact. Wrapping with `list()` (or its alias `.()`) is the data.table idiom for returning multiple values from `j`. The trailing extraction step turns the one-row data.table into a plain list for friendlier printing.

</details>

## Section 2. Filter, select, compute in DT[i, j] (4 problems)

### Exercise 2.1: Filter rows with multiple conditions

**Task:** From `dt_cars`, select rows where `mpg` is above 20 AND the engine has 4 cylinders. Save the filtered data.table to `ex_2_1` and report how many rows survived. This is the bread-and-butter use of `i` in `DT[i, j]`.

**Expected result:**

```
nrow(ex_2_1)
#> [1] 11
head(ex_2_1, 2)
#>          model  mpg cyl  disp hp drat    wt  qsec vs am gear carb
#> 1:    Datsun 710 22.8   4 108.0 93 3.85 2.320 18.61  1  1    4    1
#> 2: Merc 240D    24.4   4 146.7 62 3.69 3.190 20.00  1  0    4    2
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
nrow(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- dt_cars[mpg > 20 & cyl == 4]
nrow(ex_2_1)
#> [1] 11
```

**Explanation:** Inside `i`, column names resolve directly without `$` or quotes. The expression `mpg > 20 & cyl == 4` returns a logical vector, and data.table uses it to subset rows. Note `&` for elementwise AND, not `&&`. If you need the row indices instead of the rows themselves, use `which(mpg > 20 & cyl == 4)` or call `.I` in `j`.

</details>

### Exercise 2.2: Select columns and keep the data.table class

**Task:** The audit team needs only `Wind`, `Temp`, and `Month` from `dt_air` for a downstream pipeline that expects a data.table input. Select those three columns from `dt_air` and save the result as `ex_2_2`. Make sure the result is still a data.table, not a vector.

**Expected result:**

```
class(ex_2_2)
#> [1] "data.table" "data.frame"
head(ex_2_2, 3)
#>    Wind Temp Month
#> 1:  7.4   67     5
#> 2:  8.0   72     5
#> 3: 12.6   74     5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
class(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- dt_air[, .(Wind, Temp, Month)]
class(ex_2_2)
#> [1] "data.table" "data.frame"
head(ex_2_2, 3)
#>    Wind Temp Month
#> 1:  7.4   67     5
#> 2:  8.0   72     5
#> 3: 12.6   74     5
```

**Explanation:** `.()` is shorthand for `list()` and tells data.table to return a data.table. Without it, `dt_air[, Wind]` would return a plain numeric vector, which breaks code that expects a table. Use `.SDcols` if you want to pick columns by a character vector or regex; use `.()` when the column names are known at write-time.

</details>

### Exercise 2.3: Compute a summary statistic in j

**Task:** Compute the mean ozone level from `dt_air`, ignoring the `NA` values that are scattered through that column. Wrap the answer in a named-list output so the result is a one-row data.table with the column called `mean_ozone`, and save it to `ex_2_3`.

**Expected result:**

```
ex_2_3
#>    mean_ozone
#> 1:   42.12931
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- dt_air[, .(mean_ozone = mean(Ozone, na.rm = TRUE))]
ex_2_3
#>    mean_ozone
#> 1:   42.12931
```

**Explanation:** Any expression in `j` runs in the data.table's scope, so you reference `Ozone` bare. `na.rm = TRUE` is essential here: airquality has 37 missing ozone readings, and base `mean()` returns `NA` if any single value is missing. Using `.(mean_ozone = ...)` keeps the result as a data.table; without `.()` you would get a length-1 numeric vector instead.

</details>

### Exercise 2.4: Compute a derived column in j without modifying the source

**Task:** A reporting analyst preparing a fuel-efficiency dashboard wants miles per gallon converted to kilometers per liter for every row of `dt_cars`. Return a fresh data.table with columns `model` and `kpl` (which equals `mpg * 0.425144`), and save it to `ex_2_4`. The source `dt_cars` must NOT change.

**Expected result:**

```
head(ex_2_4, 3)
#>            model      kpl
#> 1:     Mazda RX4 8.928024
#> 2: Mazda RX4 Wag 8.928024
#> 3:    Datsun 710 9.693283
"kpl" %in% names(dt_cars)
#> [1] FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
head(ex_2_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- dt_cars[, .(model, kpl = mpg * 0.425144)]
head(ex_2_4, 3)
#>            model      kpl
#> 1:     Mazda RX4 8.928024
#> 2: Mazda RX4 Wag 8.928024
#> 3:    Datsun 710 9.693283
"kpl" %in% names(dt_cars)
#> [1] FALSE
```

**Explanation:** Returning a new column with `j = .(...)` produces a separate data.table; the original is untouched. If you had used `dt_cars[, kpl := mpg * 0.425144]` instead, the new column would be added in place and `dt_cars` would carry it forward (the trap behind exercise 4.1). Pick `.()` when you want immutability, `:=` when you want efficiency at the cost of in-place mutation.

</details>

## Section 3. Group with by= and .N (4 problems)

### Exercise 3.1: Mean horsepower per cylinder count

**Task:** A car magazine editor asks for the average horsepower for each cylinder bucket in `dt_cars`. Group by `cyl` and compute the mean of `hp`, returning a tidy two-column data.table with `cyl` and `mean_hp`, sorted by ascending `cyl`. Save the result to `ex_3_1`.

**Expected result:**

```
ex_3_1
#>    cyl  mean_hp
#> 1:   4  82.6364
#> 2:   6 122.2857
#> 3:   8 209.2143
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- dt_cars[, .(mean_hp = mean(hp)), by = cyl][order(cyl)]
ex_3_1
#>    cyl  mean_hp
#> 1:   4  82.6364
#> 2:   6 122.2857
#> 3:   8 209.2143
```

**Explanation:** `by=cyl` splits the table by the distinct values of `cyl` and runs `j` once per group. The output already collapses to one row per group, and the second `[order(cyl)]` chains a sort step. Use `keyby=` instead of `by=` if you want the result sorted automatically: `dt_cars[, .(mean_hp = mean(hp)), keyby = cyl]` is the idiomatic one-liner here.

</details>

### Exercise 3.2: Multiple summaries per group in one pass

**Task:** A finance team analyst building a fleet cost model wants three numbers per cylinder class in `dt_cars`: the count of cars, the mean weight, and the median quarter-mile time. Produce a four-column data.table called `ex_3_2` with `cyl`, `n`, `mean_wt`, `median_qsec`, sorted ascending by `cyl`.

**Expected result:**

```
ex_3_2
#>    cyl  n mean_wt median_qsec
#> 1:   4 11  2.2857       18.90
#> 2:   6  7  3.1171       18.30
#> 3:   8 14  3.9992       17.18
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- dt_cars[, .(n = .N,
                      mean_wt = round(mean(wt), 4),
                      median_qsec = median(qsec)),
                  keyby = cyl]
ex_3_2
#>    cyl  n mean_wt median_qsec
#> 1:   4 11  2.2857       18.90
#> 2:   6  7  3.1171       18.30
#> 3:   8 14  3.9992       17.18
```

**Explanation:** Inside one `j`, each named expression becomes a column in the output. `.N` is the row count of each group, so it skips the explicit `length()` call. `keyby` does the grouping AND sets a sorted key on `cyl`, which beats writing `by=cyl` followed by `order(cyl)` and makes future binary-search joins on `cyl` instant.

</details>

### Exercise 3.3: Count rows per group with .N

**Task:** The take-home interviewer wants candidates to count diamonds in each cut category from `dt_dia`. Group by `cut` and return the row count per group as a column called `n`, ordered from most common cut to least common. Save the resulting two-column data.table to `ex_3_3`.

**Expected result:**

```
ex_3_3
#>          cut     n
#> 1:     Ideal 21551
#> 2:   Premium 13791
#> 3: Very Good 12082
#> 4:      Good  4906
#> 5:      Fair  1610
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- dt_dia[, .(n = .N), by = cut][order(-n)]
ex_3_3
#>          cut     n
#> 1:     Ideal 21551
#> 2:   Premium 13791
#> 3: Very Good 12082
#> 4:      Good  4906
#> 5:      Fair  1610
```

**Explanation:** The shortcut `dt_dia[, .N, by = cut]` returns a column auto-named `N`. Wrapping with `.(n = .N)` renames it cleanly so downstream code does not depend on the magic name. Sorting by `-n` flips the order so the largest group lands on top; `order()` accepts a negative sign in data.table even when the column is numeric, mirroring base R's `order()` syntax.

</details>

### Exercise 3.4: Group by two columns

**Task:** Group `dt_dia` by both `cut` and `color` and compute the average price for every combination. Limit the answer to rows where the resulting `mean_price` is above 5000 to keep the table tight. Save the filtered, sorted-by-`mean_price`-descending table to `ex_3_4`.

**Expected result:**

```
head(ex_3_4, 3)
#>      cut color mean_price
#> 1:  Fair     J   6447.521
#> 2:  Fair     I   5713.205
#> 3:  Good     J   5453.811
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
head(ex_3_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- dt_dia[, .(mean_price = mean(price)), by = .(cut, color)][
  mean_price > 5000][order(-mean_price)]
head(ex_3_4, 3)
#>      cut color mean_price
#> 1:  Fair     J   6447.521
#> 2:  Fair     I   5713.205
#> 3:  Good     J   5453.811
```

**Explanation:** `by = .(cut, color)` groups on the cartesian set of the two columns. Each chain step uses square-bracket composition: aggregate, then filter by the new column, then sort. This pattern is the data.table equivalent of dplyr's `group_by |> summarise |> filter |> arrange`, but everything fits in one statement and avoids intermediate tables.

</details>

## Section 4. Update by reference with := (3 problems)

### Exercise 4.1: Add a column by reference

**Task:** A pharmacology team using `dt_cars` for a quick fuel-cost spreadsheet needs a `kpl` (kilometers per liter) column added permanently to the working table. Add `kpl = mpg * 0.425144` to `dt_cars` using update-by-reference and save the modified table to `ex_4_1`. The change MUST persist on `dt_cars`.

**Expected result:**

```
"kpl" %in% names(dt_cars)
#> [1] TRUE
head(ex_4_1[, .(model, mpg, kpl)], 2)
#>            model  mpg      kpl
#> 1:     Mazda RX4 21.0 8.928024
#> 2: Mazda RX4 Wag 21.0 8.928024
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
"kpl" %in% names(dt_cars)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt_cars[, kpl := mpg * 0.425144]
ex_4_1 <- dt_cars
"kpl" %in% names(dt_cars)
#> [1] TRUE
head(ex_4_1[, .(model, mpg, kpl)], 2)
#>            model  mpg      kpl
#> 1:     Mazda RX4 21.0 8.928024
#> 2: Mazda RX4 Wag 21.0 8.928024
```

**Explanation:** `:=` mutates the table in place with zero copy, which is why data.table can append a column to a 100M-row table in milliseconds. Note that `:=` returns invisibly, so `dt[, x := ...]` does NOT print. If you want to print AND mutate, end the statement with `[]`: `dt_cars[, kpl := mpg * 0.425144][]`. To guard against accidental mutation, copy first with `copy(dt_cars)`.

</details>

### Exercise 4.2: Conditional update for specific rows

**Task:** A compliance officer reviewing fuel-economy bins wants `dt_cars` to carry an `efficiency` label of `"high"` for rows where `mpg > 25`, `"low"` otherwise. Add the column using update-by-reference with two separate updates (one for each value) so you practice the row-targeted `i` plus `j :=` pattern. Save the table to `ex_4_2`.

**Expected result:**

```
ex_4_2[, .N, by = efficiency]
#>    efficiency  N
#> 1:        low 26
#> 2:       high  6
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2[, .N, by = efficiency]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt_cars[, efficiency := "low"]
dt_cars[mpg > 25, efficiency := "high"]
ex_4_2 <- dt_cars
ex_4_2[, .N, by = efficiency]
#>    efficiency  N
#> 1:        low 26
#> 2:       high  6
```

**Explanation:** The two-step pattern (default value, then targeted overwrite) is more readable than nesting `fifelse()` when there are two outcomes. The targeted form `dt[i, col := value]` ONLY touches rows where `i` is true; other rows keep their existing value. With three or more buckets switch to `fcase()` or `fifelse()` in a single `:=`. Either way, the mutation persists on `dt_cars` because `:=` is by reference.

</details>

### Exercise 4.3: Drop multiple columns by reference

**Task:** After the bookkeeping in 4.1 and 4.2 you want to clean up: remove the helper columns `kpl` and `efficiency` from `dt_cars` so it goes back to a tidy state. Drop both columns in a single update-by-reference call (the `c("col1", "col2") := NULL` form) and save the result to `ex_4_3`.

**Expected result:**

```
"kpl" %in% names(ex_4_3)
#> [1] FALSE
"efficiency" %in% names(ex_4_3)
#> [1] FALSE
ncol(ex_4_3)
#> [1] 12
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ncol(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt_cars[, c("kpl", "efficiency") := NULL]
ex_4_3 <- dt_cars
ncol(ex_4_3)
#> [1] 12
```

**Explanation:** The `c(...) := NULL` form deletes a vector of columns in one shot. The single-column equivalent is `dt[, col := NULL]`. Dropping by reference is much cheaper than `dt[, !c("kpl", "efficiency")]` for large tables because data.table does not rebuild the rest of the table; it just unlinks the dropped columns from the internal column list.

</details>

## Section 5. Chaining and .SD power tools (3 problems)

### Exercise 5.1: Chain filter, group, sort in one expression

**Task:** A growth team analyst wants the top three diamond cuts by mean price, looking only at diamonds where `carat` is above 1. Build a single chained expression on `dt_dia` that filters, groups, summarizes, sorts descending by mean price, and keeps the top three rows. Save the three-row data.table to `ex_5_1`.

**Expected result:**

```
ex_5_1
#>          cut mean_price
#> 1:      Fair   7177.856
#> 2:      Good   7320.708
#> 3: Very Good   8348.717
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- dt_dia[carat > 1][
  , .(mean_price = mean(price)), by = cut][
  order(mean_price)][1:3]
ex_5_1
#>          cut mean_price
#> 1:      Fair   7177.856
#> 2:      Good   7320.708
#> 3: Very Good   8348.717
```

**Explanation:** Each pair of brackets is a stage. The first filters, the second aggregates, the third sorts ascending, and the fourth slices the top three. Notice that there is no intermediate variable; data.table evaluates lazily across the chain. The same pattern in dplyr would be `dia |> filter(...) |> group_by(...) |> summarise(...) |> arrange(...) |> head(3)`: same number of stages, just different glue.

</details>

### Exercise 5.2: Mean of every numeric column with .SD

**Task:** A statistician auditing `dt_iris` wants the column-wise mean of every numeric column. Use `.SD` and `.SDcols` to compute the mean of all columns whose name does NOT equal `"Species"`, then save the one-row data.table of means to `ex_5_2`. This is the canonical `.SD` move.

**Expected result:**

```
ex_5_2
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1:     5.843333    3.057333        3.758    1.199333
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- dt_iris[, lapply(.SD, mean), .SDcols = is.numeric]
ex_5_2
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1:     5.843333    3.057333        3.758    1.199333
```

**Explanation:** `.SD` is the data.table that data.table builds inside each group for use in `j`; `.SDcols` decides which columns it carries. Passing `is.numeric` as `.SDcols` is a tidy trick: data.table evaluates the predicate against each column and keeps only those that return `TRUE`. The result of `lapply(.SD, mean)` is a list with one value per `.SD` column, which becomes a one-row data.table.

</details>

### Exercise 5.3: Top N rows per group with .SD

**Task:** A scout reviewing the `dt_dia` table wants the two highest-price diamonds inside each cut tier. Use `.SD` with `order(-price)` and `head()` to pull the top two rows per `cut`, keeping only the columns `cut`, `carat`, `price`. Save the result to `ex_5_3`.

**Expected result:**

```
ex_5_3
#>          cut carat price
#>  1:     Fair  2.01 18574
#>  2:     Fair  2.02 18565
#>  3:     Good  2.80 18788
#>  4:     Good  2.74 18707
#>  5:    Ideal  3.01 18806
#>  6:    Ideal  1.51 18797
#>  7:  Premium  2.29 18823
#>  8:  Premium  2.04 18820
#>  9: Very Good 2.00 18818
#> 10: Very Good 2.00 18802
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- dt_dia[order(-price),
                 head(.SD, 2),
                 by = cut,
                 .SDcols = c("carat", "price")]
ex_5_3
#>          cut carat price
#>  1:     Fair  2.01 18574
#>  2:     Fair  2.02 18565
#>  3:     Good  2.80 18788
#>  4:     Good  2.74 18707
#>  5:    Ideal  3.01 18806
#>  6:    Ideal  1.51 18797
#>  7:  Premium  2.29 18823
#>  8:  Premium  2.04 18820
#>  9: Very Good 2.00 18818
#> 10: Very Good 2.00 18802
```

**Explanation:** The trick is the global pre-sort `order(-price)` in `i`. After that pre-sort, `.SD` inside each `by=cut` group is already in price-descending order, so `head(.SD, 2)` just slices the first two rows. The alternative `dt_dia[, .SD[order(-price)][1:2], by = cut]` works but sorts every group independently, which is slower. `.SDcols` controls which columns appear in `.SD`, trimming memory and output.

</details>

## Section 6. Keys, joins, and reshape (3 problems)

### Exercise 6.1: Set a key and inner-join two tables

**Task:** Build two inline data.tables: `dt_orders` with columns `customer_id` (1, 2, 3, 4) and `amount` (100, 250, 175, 60), and `dt_customers` with `customer_id` (1, 2, 3) and `region` ("NA", "EU", "APAC"). Set the key on both tables to `customer_id`, then inner-join orders to customers so only matching customers survive. Save the joined table to `ex_6_1`.

**Expected result:**

```
ex_6_1
#>    customer_id amount region
#> 1:           1    100     NA
#> 2:           2    250     EU
#> 3:           3    175   APAC
```

**Difficulty:** Advanced

```r title="Your turn"
dt_orders <- data.table(customer_id = c(1, 2, 3, 4), amount = c(100, 250, 175, 60))
dt_customers <- data.table(customer_id = c(1, 2, 3), region = c("NA", "EU", "APAC"))
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt_orders <- data.table(customer_id = c(1, 2, 3, 4), amount = c(100, 250, 175, 60))
dt_customers <- data.table(customer_id = c(1, 2, 3), region = c("NA", "EU", "APAC"))
setkey(dt_orders, customer_id)
setkey(dt_customers, customer_id)
ex_6_1 <- dt_orders[dt_customers, nomatch = NULL]
ex_6_1
#>    customer_id amount region
#> 1:           1    100     NA
#> 2:           2    250     EU
#> 3:           3    175   APAC
```

**Explanation:** `setkey()` sorts the table by the key column and marks it for binary-search lookups; subsequent joins are O(log n) per probe. `X[Y]` does a right join on the shared key by default, returning every row of `Y` plus matching columns from `X`. Passing `nomatch = NULL` drops rows of `Y` that have no match in `X`, turning a right outer join into an inner join. Customer 4 has no region row so it disappears.

</details>

### Exercise 6.2: Update-join to add a column from a lookup table

**Task:** Using the `dt_orders` and `dt_customers` tables from exercise 6.1 (still keyed), add a `region` column to `dt_orders` itself with one update-by-reference call. Rows that have no match must end up with `NA`. Save the modified `dt_orders` to `ex_6_2`. This is the update-join, the highest-leverage move in data.table.

**Expected result:**

```
ex_6_2
#>    customer_id amount region
#> 1:           1    100     NA
#> 2:           2    250     EU
#> 3:           3    175   APAC
#> 4:           4     60   <NA>
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt_orders[dt_customers, region := i.region]
ex_6_2 <- dt_orders
ex_6_2
#>    customer_id amount region
#> 1:           1    100     NA
#> 2:           2    250     EU
#> 3:           3    175   APAC
#> 4:           4     60   <NA>
```

**Explanation:** The update-join syntax `X[Y, col := i.col]` joins `Y` onto `X` and writes a column from `Y` into `X` by reference in one pass. `i.` is the prefix that refers to the right-hand table's columns when names collide or you want to be explicit. This pattern replaces the classic SQL `UPDATE ... FROM` and is dramatically faster than `merge()` followed by reassignment, especially for wide tables.

</details>

### Exercise 6.3: Wide-to-long reshape with melt

**Task:** A reporting analyst building a tidy chart needs the four numeric columns of `dt_iris` stacked into a single `value` column with a `measurement` indicator. Use `melt()` to reshape from wide to long, keeping `Species` as the id variable, naming the measurement column `measurement` and the value column `value`. Save the long-form data.table to `ex_6_3`.

**Expected result:**

```
head(ex_6_3, 3)
#>    Species measurement value
#> 1:  setosa Sepal.Length   5.1
#> 2:  setosa Sepal.Length   4.9
#> 3:  setosa Sepal.Length   4.7
nrow(ex_6_3)
#> [1] 600
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
nrow(ex_6_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- melt(dt_iris,
               id.vars = "Species",
               measure.vars = c("Sepal.Length", "Sepal.Width",
                                "Petal.Length", "Petal.Width"),
               variable.name = "measurement",
               value.name = "value")
head(ex_6_3, 3)
#>    Species measurement value
#> 1:  setosa Sepal.Length   5.1
#> 2:  setosa Sepal.Length   4.9
#> 3:  setosa Sepal.Length   4.7
nrow(ex_6_3)
#> [1] 600
```

**Explanation:** `melt()` from data.table is the wide-to-long workhorse and accepts a data.table directly. `id.vars` are the columns that stay as-is (one per output row); `measure.vars` are the columns that get stacked into the `value` column. Each input row becomes `length(measure.vars)` output rows, so 150 iris rows times four measurements equals 600 rows. The inverse operation is `dcast()`, which is exactly the next exercise's pattern in reverse.

</details>

## What to do next

Pair this hub with the conceptual references to lock in the idioms.

- The dplyr counterpart drills are in [dplyr Exercises in R](dplyr-Exercises-in-R.html). Solving the same problem in both packages is the fastest way to see the trade-offs.
- For more group-by patterns, work through [dplyr group_by Exercises in R](dplyr-group_by-Exercises-in-R.html).
- For reshaping moves beyond `melt()` and `dcast()`, see [tidyr Exercises in R](tidyr-Exercises-in-R.html).
