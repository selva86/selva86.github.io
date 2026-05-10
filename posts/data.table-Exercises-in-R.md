---
title: "data.table Exercises in R: 50 Real Practice Problems"
slug: "data.table-Exercises-in-R"
description: "Master data.table with 50 scenario-based practice problems in R: i/j/by, joins, modify in place, special symbols, performance patterns. Hidden solutions."
keywords: "data.table exercises, data.table practice, data.table exercises in R, learn data.table by example, data.table problems R, data.table tutorial practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "data.table Exercises"
sidebar_order: 105
fr_parent: "R-Tutorial.html"
auto_link_terms: "data.table exercises|data.table practice|data.table exercises in R|practice data.table|data.table problems"
auto_link_case_sensitive: false
target_keyword: "data.table exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# data.table Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on data.table: the i/j/by syntax, in-place modification with `:=`, joins, special symbols, and performance idioms. Real scenarios with hidden solutions.</p>

| Section | Topic | Problems | Difficulty mix |
|---|---|---|---|
| 1 | i, j, by basics | 8 | beginner to intermediate |
| 2 | Modify in place with := | 8 | mostly intermediate |
| 3 | Joins | 8 | intermediate |
| 4 | Special symbols & functions | 8 | intermediate to advanced |
| 5 | Performance patterns | 8 | intermediate to advanced |
| 6 | Advanced & dplyr migration | 10 | advanced |

```r title="Run this once before any exercise"
library(data.table)
mt <- as.data.table(mtcars, keep.rownames = "car")
ir <- as.data.table(iris)
dm <- as.data.table(diamonds)
```

## Section 1. i, j, by basics (8 problems)

### Exercise 1.1: Filter rows in i

**Scenario:** Return rows where mpg > 25.

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

**Explanation:** First argument inside `[` is `i` (row filter). Column names work directly without quotes or `$`.

</details>

### Exercise 1.2: Select columns in j

**Scenario:** Return car name and mpg.

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

**Explanation:** `.()` is shorthand for `list()`. Returns a data.table. To get a vector, use `mt[, mpg]`. To select with a string vector use `mt[, c("car","mpg"), with = FALSE]` or `mt[, .SD, .SDcols = c("car","mpg")]`.

</details>

### Exercise 1.3: Filter and select together

**Scenario:** Return car name and mpg for 4-cyl cars.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- mt[cyl == 4, .(car, mpg)]
ex_1_3
```

**Explanation:** i and j combine: filter then select.

</details>

### Exercise 1.4: Group with by

**Scenario:** Mean mpg per cyl group.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- mt[, .(mean_mpg = mean(mpg)), by = cyl]
ex_1_4
```

**Explanation:** Third argument is `by`. Result has one row per group.

</details>

### Exercise 1.5: Multiple stats per group

**Scenario:** Per cyl: count, mean mpg, sd mpg.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- mt[, .(n = .N, mean = mean(mpg), sd = sd(mpg)), by = cyl]
ex_1_5
```

**Explanation:** `.N` is the per-group row count. Multiple expressions in `.()` give multiple output columns.

</details>

### Exercise 1.6: Group by multiple keys

**Scenario:** Mean mpg per (cyl, gear).

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- mt[, .(mean_mpg = mean(mpg)), by = .(cyl, gear)]
ex_1_6
```

**Explanation:** `by = .(...)` accepts multiple group columns. Same syntax as j.

</details>

### Exercise 1.7: Order by multiple columns

**Scenario:** Sort cars by cyl ascending, mpg descending.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- mt[order(cyl, -mpg)]
ex_1_7
```

**Explanation:** `order()` inside i sorts. Negate for descending. data.table's order is fast (uses radix sort).

</details>

### Exercise 1.8: Chained operations

**Scenario:** Filter cyl == 6, group by gear, return mean mpg, sort descending.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- mt[cyl == 6, .(mean_mpg = mean(mpg)), by = gear][order(-mean_mpg)]
ex_1_8
```

**Explanation:** Chaining: append another `[...]` for additional steps. Avoids intermediate assignments.

</details>

## Section 2. Modify in place with := (8 problems)

### Exercise 2.1: Add a new column

**Scenario:** Add `kpl` column = mpg * 0.425.

**Difficulty:** Beginner

```r title="Your turn"
dt <- copy(mt)
# your code here
head(dt[, .(car, mpg, kpl)])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, kpl := mpg * 0.425]
head(dt[, .(car, mpg, kpl)])
```

**Explanation:** `:=` modifies in place — no copy. The dt is changed even though we didn't reassign. Use copy() to avoid side effects on the original.

</details>

### Exercise 2.2: Update a subset of rows

**Scenario:** Set mpg = 100 for cyl == 4 rows.

**Difficulty:** Intermediate

```r title="Your turn"
dt <- copy(mt)
# your code here
dt[cyl == 4, .(car, mpg)]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[cyl == 4, mpg := 100]
dt[cyl == 4, .(car, mpg)]
```

**Explanation:** i + := updates only matching rows.

</details>

### Exercise 2.3: Add multiple columns at once

**Scenario:** Add columns `disp_l` (disp / 61.024) and `weight_kg` (wt * 453.592).

**Difficulty:** Intermediate

```r title="Your turn"
dt <- copy(mt)
# your code here
head(dt[, .(car, disp, disp_l, wt, weight_kg)])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, `:=`(disp_l = disp / 61.024,
          weight_kg = wt * 453.592)]
head(dt[, .(car, disp, disp_l, wt, weight_kg)])
```

**Explanation:** Backtick syntax `:=()` lets you assign multiple columns in one call. Equivalent: `dt[, c("disp_l","weight_kg") := list(disp / 61.024, wt * 453.592)]`.

</details>

### Exercise 2.4: Conditional update with case-like logic

**Scenario:** Add `tier` column: "small" if cyl=4, "mid" if cyl=6, "large" if cyl=8.

**Difficulty:** Intermediate

```r title="Your turn"
dt <- copy(mt)
# your code here
dt[, .(car, cyl, tier)][1:6]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, tier := fcase(
  cyl == 4, "small",
  cyl == 6, "mid",
  cyl == 8, "large"
)]
dt[, .(car, cyl, tier)][1:6]
```

**Explanation:** `fcase()` is data.table's case_when equivalent. Faster than nested ifelse.

</details>

### Exercise 2.5: Delete a column

**Scenario:** Remove the `vs` column.

**Difficulty:** Beginner

```r title="Your turn"
dt <- copy(mt)
# your code here
"vs" %in% names(dt)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, vs := NULL]
"vs" %in% names(dt)
```

**Explanation:** Assigning NULL via := deletes the column in place.

</details>

### Exercise 2.6: Per-group transform

**Scenario:** Add `mpg_z` = z-score of mpg WITHIN each cyl group.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
# your code here
head(dt[, .(car, cyl, mpg, mpg_z)])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, mpg_z := (mpg - mean(mpg)) / sd(mpg), by = cyl]
head(dt[, .(car, cyl, mpg, mpg_z)])
```

**Explanation:** := combined with by computes per-group AND fills back into the original rows. Equivalent to dplyr's group_by + mutate.

</details>

### Exercise 2.7: Replace NA with column mean

**Scenario:** A copy of airquality. Replace NA in Ozone with the column mean.

**Difficulty:** Intermediate

```r title="Your turn"
aq <- as.data.table(airquality)
# your code here
sum(is.na(aq$Ozone))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq[is.na(Ozone), Ozone := mean(aq$Ozone, na.rm = TRUE)]
sum(is.na(aq$Ozone))
```

**Explanation:** Filter rows in i, assign in j. Use `aq$Ozone` inside mean to compute on the FULL column (not just the filtered subset).

</details>

### Exercise 2.8: Update by reference (no copy)

**Scenario:** Demonstrate that := does NOT copy by checking address before/after.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
addr1 <- address(dt)
# your code here
addr2 <- address(dt)
addr1 == addr2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt <- copy(mt)
addr1 <- address(dt)
dt[, new_col := 1]
addr2 <- address(dt)
addr1 == addr2  # TRUE: same memory
```

**Explanation:** data.table's killer feature: := updates in place, avoiding the copy that `df$col <- ...` causes. Critical for working with large tables.

</details>

## Section 3. Joins (8 problems)

### Exercise 3.1: Inner join with X[Y, on=]

**Scenario:** Two data.tables: products and orders. Join on product_id.

**Difficulty:** Beginner

```r title="Your turn"
products <- data.table(product_id = 1:3, name = c("X","Y","Z"))
orders   <- data.table(order_id = 101:103, product_id = c(1,2,4), qty = c(2,1,3))

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- orders[products, on = "product_id", nomatch = 0]
ex_3_1
```

**Explanation:** `X[Y, on=]` syntax. nomatch = 0 makes it inner. Default (nomatch = NA) is right-outer when looking from Y's side.

</details>

### Exercise 3.2: Left join

**Scenario:** All orders, augmented with product info if available.

**Difficulty:** Intermediate

```r title="Your turn"
products <- data.table(product_id = 1:3, name = c("X","Y","Z"))
orders   <- data.table(order_id = 101:103, product_id = c(1,2,4), qty = c(2,1,3))

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- products[orders, on = "product_id"]
ex_3_2
```

**Explanation:** `products[orders, on=...]` keeps all rows of orders (the right side becomes the driver). Behaves like left-join orders -> products.

</details>

### Exercise 3.3: Anti-join

**Scenario:** Find orders with no matching product.

**Difficulty:** Intermediate

```r title="Your turn"
products <- data.table(product_id = 1:3, name = c("X","Y","Z"))
orders   <- data.table(order_id = 101:103, product_id = c(1,2,4), qty = c(2,1,3))

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- orders[!products, on = "product_id"]
ex_3_3
```

**Explanation:** `!` before the right side performs anti-join. Returns rows of x not in y.

</details>

### Exercise 3.4: Multi-column join key

**Scenario:** Join on (region, product).

**Difficulty:** Intermediate

```r title="Your turn"
sales <- data.table(region = c("US","EU"), product = c("X","X"), qty = c(100,50))
prices <- data.table(region = c("US","EU"), product = c("X","X"), price = c(10,12))

ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- sales[prices, on = c("region","product")]
ex_3_4
```

**Explanation:** Vector in `on=` for multiple keys. Both data.tables must have those column names.

</details>

### Exercise 3.5: Update by join

**Scenario:** Add price column to sales by lookup, in place.

**Difficulty:** Advanced

```r title="Your turn"
sales <- data.table(region = c("US","EU","ASIA"), product = c("X","X","X"), qty = c(100,50,30))
prices <- data.table(region = c("US","EU"), product = c("X","X"), price = c(10,12))

# your code here
sales
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales[prices, price := i.price, on = c("region","product")]
sales
```

**Explanation:** Update by reference using a join. `i.price` refers to the price column from the joined table (the i side). ASIA gets NA because no match. Powerful for "lookup-and-augment" with no copy.

</details>

### Exercise 3.6: Rolling join

**Scenario:** Match each transaction time to the most-recent price snapshot at or before it.

**Difficulty:** Advanced

```r title="Your turn"
prices <- data.table(time = as.POSIXct(c("2024-01-01 09:00","2024-01-01 10:00","2024-01-01 11:00")),
                     price = c(100, 102, 105))
txns   <- data.table(time = as.POSIXct(c("2024-01-01 09:30","2024-01-01 10:30","2024-01-01 11:30")))
setkey(prices, time)

ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- prices[txns, on = "time", roll = TRUE]
ex_3_6
```

**Explanation:** `roll = TRUE` is a "rolling forward" join: when no exact match, use the most-recent prior row. roll = -Inf rolls backward; roll = N rolls within N units only.

</details>

### Exercise 3.7: Non-equi join

**Scenario:** Match each transaction amount to a tier whose min_amount <= amount.

**Difficulty:** Advanced

```r title="Your turn"
txns <- data.table(id = 1:4, amount = c(50, 200, 1500, 9000))
tiers <- data.table(min_amount = c(0, 100, 1000, 5000),
                    tier = c("micro","small","medium","large"))

ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- tiers[txns, on = .(min_amount <= amount),
                .(id, amount, tier),
                mult = "last"]
ex_3_7
```

**Explanation:** `on = .(col1 <= col2)` does an inequality join. `mult = "last"` picks the highest matching threshold; default (all) returns all matches.

</details>

### Exercise 3.8: Cross-join (cartesian)

**Scenario:** Build all combinations of region (3 values) and product (4 values).

**Difficulty:** Intermediate

```r title="Your turn"
regions <- c("US","EU","ASIA")
products <- c("X","Y","Z","W")

ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- CJ(region = regions, product = products)
ex_3_8
```

**Explanation:** `CJ()` (cross-join) returns all combinations as a data.table. Useful for completing missing combos before a left-join.

</details>

## Section 4. Special symbols and functions (8 problems)

### Exercise 4.1: .N — group size

**Scenario:** Return the count of cars per cyl using `.N`.

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mt[, .N, by = cyl]
ex_4_1
```

**Explanation:** `.N` is the row count. Inside by-context: per-group count. Without by: total rows.

</details>

### Exercise 4.2: .SD — subset of data

**Scenario:** Compute mean of all numeric columns per cyl group.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
num_cols <- names(mt)[sapply(mt, is.numeric)]
ex_4_2 <- mt[, lapply(.SD, mean), by = cyl, .SDcols = num_cols]
ex_4_2
```

**Explanation:** `.SD` ("Subset of Data") is each group's data frame in the j-context. lapply applies a function across columns. .SDcols restricts to selected columns.

</details>

### Exercise 4.3: .SDcols with patterns

**Scenario:** Compute mean of every column starting with "Sepal" per Species in iris.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ir[, lapply(.SD, mean), by = Species,
             .SDcols = patterns("^Sepal")]
ex_4_3
```

**Explanation:** `patterns()` accepts regex; selects matching columns for .SDcols.

</details>

### Exercise 4.4: .I — row indices

**Scenario:** Get row indices of all 4-cyl cars.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- mt[, .I[cyl == 4]]
ex_4_4
```

**Explanation:** `.I` is the integer vector of row positions. With logical condition, returns indices where TRUE.

</details>

### Exercise 4.5: First/last row per group

**Scenario:** First row per cyl using head.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- mt[, head(.SD, 1), by = cyl]
ex_4_5
```

**Explanation:** head(.SD, 1) takes the first row of each group's subset. Tail for last.

</details>

### Exercise 4.6: Top N per group

**Scenario:** Top 2 highest-mpg cars per cyl.

**Difficulty:** Advanced

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- mt[order(-mpg)][, head(.SD, 2), by = cyl][, .(car, cyl, mpg)]
ex_4_6
```

**Explanation:** Sort first, then head per group. Or: `mt[, .SD[order(-mpg)][1:2], by = cyl]` does it in one step.

</details>

### Exercise 4.7: .GRP — group counter

**Scenario:** Add a column `group_id` numbering each cyl group sequentially.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
# your code here
dt[, .(car, cyl, group_id)][1:6]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, group_id := .GRP, by = cyl]
dt[, .(car, cyl, group_id)][1:6]
```

**Explanation:** `.GRP` is the group counter (1, 2, 3, ...). Useful to label groups numerically without dealing with factor levels.

</details>

### Exercise 4.8: Group-wise rolling computation with .SD

**Scenario:** Per cyl, compute lag of mpg.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
# your code here
dt[, .(car, cyl, mpg, mpg_lag)][1:8]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, mpg_lag := shift(mpg), by = cyl]
dt[, .(car, cyl, mpg, mpg_lag)][1:8]
```

**Explanation:** data.table::shift returns a lagged or leading vector. With by, computes per group. Equivalent to dplyr's lag.

</details>

## Section 5. Performance patterns (8 problems)

### Exercise 5.1: Set a key for fast lookup

**Scenario:** Set `cyl` as a key on mt and verify with key().

**Difficulty:** Intermediate

```r title="Your turn"
dt <- copy(mt)
# your code here
key(dt)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setkey(dt, cyl)
key(dt)
```

**Explanation:** setkey sorts the table by the key columns AND records the key. Subsequent `dt["4"]` is a binary search (much faster than a scan).

</details>

### Exercise 5.2: Multi-column key

**Scenario:** Set keys on (cyl, gear).

**Difficulty:** Intermediate

```r title="Your turn"
dt <- copy(mt)
# your code here
key(dt)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setkey(dt, cyl, gear)
key(dt)
```

**Explanation:** Multiple key columns enable fast lookup on prefixes. dt[.(4, 3)] would binary-search to cyl=4 AND gear=3.

</details>

### Exercise 5.3: Set indexes for ad-hoc queries

**Scenario:** Add an index on `am` without resorting the table.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
# your code here
indices(dt)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setindex(dt, am)
indices(dt)
```

**Explanation:** Indexes are like keys but don't reorder rows. Cheaper to maintain; subsequent filters on `am` use the index automatically.

</details>

### Exercise 5.4: fread for fast import

**Scenario:** A CSV with 100K rows. Read it with fread; observe speed advantage.

**Difficulty:** Intermediate

```r title="Your turn"
fwrite(mt, "demo.csv")

ex_5_4 <- # your code here
nrow(ex_5_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- fread("demo.csv")
nrow(ex_5_4)
```

**Explanation:** fread is the fastest CSV reader in R. Auto-detects separator, types, header. Returns a data.table directly.

</details>

### Exercise 5.5: fwrite for fast export

**Scenario:** Write mt to a CSV using fwrite.

**Difficulty:** Beginner

```r title="Your turn"
# your code here
file.exists("out.csv")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fwrite(mt, "out.csv")
file.exists("out.csv")
```

**Explanation:** fwrite is parallelized, multi-threaded write. Faster than write.csv on large files.

</details>

### Exercise 5.6: Avoid implicit copies

**Scenario:** Demonstrate the difference between `dt[, x := x*2]` (in place) and `dt$x <- dt$x * 2` (copies).

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
addr_before <- address(dt)
# your code here
addr_after <- address(dt)
addr_before == addr_after
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, mpg := mpg * 2]
# vs dt$mpg <- dt$mpg * 2 (would change address)

addr_after <- address(dt)
addr_before == addr_after  # TRUE
```

**Explanation:** := updates in place; `$<-` shallow-copies. For large tables, the difference is dramatic.

</details>

### Exercise 5.7: Group-by-reference loop pattern

**Scenario:** For each cyl, compute mean mpg and ASSIGN it back as a column on the original (so each row gets its group mean).

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
# your code here
head(dt[, .(car, cyl, mpg, mean_cyl)])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, mean_cyl := mean(mpg), by = cyl]
head(dt[, .(car, cyl, mpg, mean_cyl)])
```

**Explanation:** := + by computes per-group AND broadcasts back to all rows of that group. dplyr equivalent: group_by + mutate.

</details>

### Exercise 5.8: Memory-efficient column ops

**Scenario:** Multiply 5 numeric columns by 1000 in place, in a single call.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
cols <- c("mpg","disp","hp","wt","qsec")
# your code here
head(dt[, .SD, .SDcols = cols])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, (cols) := lapply(.SD, function(x) x * 1000), .SDcols = cols]
head(dt[, .SD, .SDcols = cols])
```

**Explanation:** `(cols)` evaluates the variable, assigning to the named columns. lapply over .SD applies the operation to each. One pass, no copies.

</details>

## Section 6. Advanced and dplyr migration (10 problems)

### Exercise 6.1: dplyr filter -> data.table

**Scenario:** Translate `mtcars |> filter(cyl == 6, mpg > 20)` to data.table.

**Difficulty:** Beginner

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- mt[cyl == 6 & mpg > 20]
ex_6_1
```

**Explanation:** Conditions in i. Comma in i is OR? No: comma is the position separator; `&` for AND.

</details>

### Exercise 6.2: dplyr mutate -> data.table

**Scenario:** Translate `mutate(kpl = mpg * 0.425)` to data.table.

**Difficulty:** Beginner

```r title="Your turn"
dt <- copy(mt)
# your code here
head(dt[, .(car, mpg, kpl)])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[, kpl := mpg * 0.425]
head(dt[, .(car, mpg, kpl)])
```

**Explanation:** := for assignment.

</details>

### Exercise 6.3: dplyr summarise -> data.table

**Scenario:** Translate `group_by(cyl) |> summarise(n = n(), mpg = mean(mpg))`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- mt[, .(n = .N, mpg = mean(mpg)), by = cyl]
ex_6_3
```

**Explanation:** by in third arg of [], j as the summary list.

</details>

### Exercise 6.4: dplyr slice_max -> data.table

**Scenario:** Top 3 highest-mpg cars overall (no grouping).

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- mt[order(-mpg)][1:3, .(car, mpg)]
ex_6_4
```

**Explanation:** Sort then slice. data.table doesn't have a slice_max equivalent but order + head is concise.

</details>

### Exercise 6.5: dplyr left_join -> data.table

**Scenario:** Translate `left_join(orders, products, by = "product_id")`.

**Difficulty:** Intermediate

```r title="Your turn"
products <- data.table(product_id = 1:3, name = c("X","Y","Z"))
orders   <- data.table(order_id = 101:103, product_id = c(1,2,4), qty = c(2,1,3))

ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- products[orders, on = "product_id"]
ex_6_5
```

**Explanation:** Reverse the order: in `X[Y, on=]` think of Y as the driver. `products[orders, ...]` means "for each row of orders, look up products" -> left-join orders -> products.

</details>

### Exercise 6.6: dplyr count -> data.table

**Scenario:** count(diamonds, cut) equivalent.

**Difficulty:** Beginner

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- dm[, .N, by = cut]
ex_6_6
```

**Explanation:** .N + by = canonical count. Shorter than dplyr's count.

</details>

### Exercise 6.7: Multiple summaries with names

**Scenario:** Per cyl: mean and sd of mpg, hp.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- mt[, .(mpg_mean = mean(mpg), mpg_sd = sd(mpg),
                 hp_mean  = mean(hp),  hp_sd  = sd(hp)),
             by = cyl]
ex_6_7
```

**Explanation:** Spell out each summary in j. For programmatic: lapply over .SD with .SDcols.

</details>

### Exercise 6.8: Conditional update on multiple columns

**Scenario:** For all 4-cyl rows, multiply mpg by 1.05 AND set kpl = mpg * 0.425.

**Difficulty:** Advanced

```r title="Your turn"
dt <- copy(mt)
# your code here
dt[cyl == 4, .(car, mpg, kpl)]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt[cyl == 4, `:=`(mpg = mpg * 1.05,
                  kpl = mpg * 0.425)]
dt[cyl == 4, .(car, mpg, kpl)]
```

**Explanation:** Combine i + multi-column := in one call. Note: kpl uses the UPDATED mpg (data.table evaluates left-to-right within :=()).

</details>

### Exercise 6.9: Pivot to wide

**Scenario:** From long table (region, quarter, sales), pivot to wide.

**Difficulty:** Advanced

```r title="Your turn"
long <- data.table(region = rep(c("US","EU"), each = 4),
                   quarter = rep(c("Q1","Q2","Q3","Q4"), 2),
                   sales = c(100,120,115,130, 80,90,95,100))

ex_6_9 <- # your code here
ex_6_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_9 <- dcast(long, region ~ quarter, value.var = "sales")
ex_6_9
```

**Explanation:** data.table::dcast is the wide-pivot. Formula syntax: rows ~ cols. value.var holds the cell values.

</details>

### Exercise 6.10: Pivot to long

**Scenario:** Reverse the pivot from 6.9.

**Difficulty:** Advanced

```r title="Your turn"
wide <- data.table(region = c("US","EU"),
                   Q1 = c(100,80), Q2 = c(120,90),
                   Q3 = c(115,95), Q4 = c(130,100))

ex_6_10 <- # your code here
ex_6_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_10 <- melt(wide, id.vars = "region",
                variable.name = "quarter", value.name = "sales")
ex_6_10
```

**Explanation:** data.table::melt is the long-pivot counterpart. id.vars are kept as-is; the rest are stacked into name/value pairs.

</details>

## What to do next

After 50 exercises, the i/j/by mental model should feel native and := should be your default for any large-table mutation. Natural follow-ups:

- **dplyr-Exercises** (shipped) for comparison and dplyr-equivalents of every pattern here.
- **Data-Wrangling-Exercises** (shipped) for cross-package wrangling.
- **Performance-Optimization-Exercises** (coming) covers profiling, parallel, and memory tricks beyond data.table.
