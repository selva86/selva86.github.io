---
title: "data.table Exercises: 12 High-Performance Data Manipulation Problems — Solved Step-by-Step"
slug: "data-table-Exercises"
description: "12 data.table exercises in R with step-by-step solutions — filter, group by, join, rolling join, reshape, and update by reference. Progressive difficulty."
keywords: "data.table exercises, data.table practice, R data.table tutorial, data.table DT syntax, data.table by group, data.table join, data.table chaining, setkey, := operator, rolling join"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.7"
post_type: "EX"
sidebar_title: "data.table (12 problems)"
auto_link_terms: "data.table exercises|data.table practice|data.table problems|data.table tutorial"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
difficulty: "Intermediate"
---


# data.table Exercises: 12 High-Performance Data Manipulation Problems — Solved Step-by-Step

<p class="lead">Twelve hands-on exercises to master the <code>data.table</code> package in R — from row filtering and <code>by=</code> aggregation to chained operations, joins, rolling joins, reshaping, and update-by-reference with <code>:=</code>. Each problem has a starter block, a click-to-reveal solution, and an explanation so you can check your answer and learn the idiom.</p>

The first four exercises cover the essentials: filtering rows, picking columns, and computing summaries on a single table. The middle four use `by=` grouping, `.SD`, chaining, and update-by-reference. The last four tackle joins, rolling joins, reshaping, and group-wise windowed calculations — the moves you use in real analysis work. Write your own answer first, run it, compare with the reveal, and read the explanation.

## How do you load data.table and build the working datasets?

Every exercise below builds on two tables: `dt_cars` (the built-in `mtcars` dataset with row names promoted to a `model` column) and `dt_iris` (the classic 150-flower measurements). Run the block once — all code on this page shares one R session, so later exercises can reference both tables without reloading.

```r
# Load data.table and build two working tables from built-in datasets
library(data.table)

dt_cars <- as.data.table(mtcars, keep.rownames = "model")
dt_iris <- as.data.table(iris)

# Confirm shapes and types
dim(dt_cars)
#> [1] 32 12
dim(dt_iris)
#> [1] 150   5
class(dt_cars)
#> [1] "data.table" "data.frame"
```

`dt_cars` has 32 rows and 12 columns — the 12th column `model` was created from the row names. `dt_iris` has the classic 150 flower measurements across 5 columns. Both tables now carry the `data.table` class (plus `data.frame` for backward compatibility, which means any `data.frame` function still works on them).

[NOTE]
**data.table modifies objects in place.** Unlike base R or dplyr, operations with `:=` change the original table without assignment. If you want to preserve the original, run `copy()` first — we cover this trap in the Common Mistakes section.

## What data.table syntax do you need to know?

Here is a one-screen cheat sheet before you start. Skim it, then jump to Exercise 1.

| Task | Syntax | Example |
|---|---|---|
| Convert a data.frame | `as.data.table()` | `DT <- as.data.table(mtcars)` |
| Filter rows | `DT[i, ]` | `DT[mpg > 20]` |
| Select columns | `DT[, j]` | `DT[, .(mpg, cyl)]` |
| Compute new columns | `DT[, .(new = ...)]` | `DT[, .(avg = mean(mpg))]` |
| Group aggregation | `DT[, j, by=]` | `DT[, mean(mpg), by=cyl]` |
| Update by reference | `:=` | `DT[, kpl := mpg * 0.425]` |
| Chain operations | `DT[...][...]` | `DT[mpg > 20][, .N, by=cyl]` |
| Apply to many columns | `.SD`, `.SDcols` | `DT[, lapply(.SD, mean), .SDcols=1:3]` |
| Row count per group | `.N` | `DT[, .N, by=cyl]` |
| Fast sort | `setorder()` | `setorder(DT, -mpg)` |
| Set join keys | `setkey()` | `setkey(DT, cyl)` |
| Join | `X[Y, on=]` | `X[Y, on="id"]` |
| Reshape wide to long | `melt()` | `melt(DT, id.vars="id")` |
| Reshape long to wide | `dcast()` | `dcast(DT, id ~ var)` |

The whole package boils down to one mental model — `DT[i, j, by]`: `i` picks rows, `j` operates on columns, and `by` groups. Every exercise below exercises one corner of that triple. Use distinct names like `my_dt` and `my_result` in your answers so you do not overwrite variables from earlier blocks.

## Exercise 1: Convert and filter rows

Convert the built-in `airquality` dataset to a data.table called `my_aq`. Then select the rows where `Temp` is greater than 80 and `Month` equals 8. Save the filtered result to `my_result` and print its row count.

**Expected output:** a data.table with 18 rows and 6 columns.

```r
# Exercise 1: convert airquality to a data.table, then filter rows
# Hint: use as.data.table() then DT[i] with compound conditions using &

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_aq <- as.data.table(airquality)
my_result <- my_aq[Temp > 80 & Month == 8]
nrow(my_result)
#> [1] 18
head(my_result, 3)
#>    Ozone Solar.R Wind Temp Month Day
#> 1:    39      83  6.9   81     8   1
#> 2:     9      24 13.8   81     8   5
#> 3:    16      77  7.4   82     8   6
```

**Explanation:** Inside `DT[i]`, bare column names like `Temp` and `Month` are evaluated in the table's scope — you do not write `my_aq$Temp`. The `&` operator combines two row conditions, and rows where either side is `NA` are dropped automatically. August (`Month == 8`) had 18 days where the temperature exceeded 80 degrees.

</details>

## Exercise 2: Select columns and compute a new one

From `dt_cars`, create a new data.table `my_result` that contains only three columns: `model`, `mpg`, and a new column `kpl` (kilometres per litre, computed as `mpg * 0.425`). Do not modify `dt_cars`.

**Expected output:** 32 rows and 3 columns.

```r
# Exercise 2: select model and mpg, plus a computed kpl column
# Hint: inside j, use .(name = expression) to build a new table

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- dt_cars[, .(model, mpg, kpl = mpg * 0.425)]
head(my_result, 3)
#>                model  mpg    kpl
#> 1:         Mazda RX4 21.0 8.9250
#> 2:     Mazda RX4 Wag 21.0 8.9250
#> 3:        Datsun 710 22.8 9.6900
dim(my_result)
#> [1] 32  3
```

**Explanation:** `.()` is shorthand for `list()` inside `j`. When `j` returns a list, data.table builds a new table with those columns. Existing columns like `model` and `mpg` are referenced by name; new columns get a name via `=`. Because we assigned the result to `my_result`, the original `dt_cars` is untouched — no `:=` was used.

</details>

## Exercise 3: Compound conditions with precedence

From `dt_cars`, find rows where the car is a six-cylinder (`cyl == 6`) OR has a manual transmission (`am == 1`) AND has more than 100 horsepower. Then keep only the columns `model`, `cyl`, `hp`, and `am`. Save to `my_result`.

**Expected output:** 20 rows, 4 columns.

```r
# Exercise 3: OR condition combined with AND, then column selection
# Hint: parentheses matter — R evaluates & before |

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- dt_cars[(cyl == 6 | am == 1) & hp > 100, .(model, cyl, hp, am)]
my_result
#>                 model cyl  hp am
#>  1:         Mazda RX4   6 110  1
#>  2:     Mazda RX4 Wag   6 110  1
#>  3:    Hornet 4 Drive   6 110  0
#>  4: Hornet Sportabout   8 175  0
#> ...
nrow(my_result)
#> [1] 20
```

**Explanation:** R evaluates `&` before `|`, so without the parentheses your condition would become `cyl == 6 | (am == 1 & hp > 100)` — a different question entirely. Always parenthesise when mixing `|` and `&`. The column list `.(model, cyl, hp, am)` sits in `j`; because we also passed an `i` condition, this is a single filter-then-select in one call.

</details>

## Exercise 4: Group aggregation with by=

Using `dt_cars`, compute the mean `mpg` and the number of cars per cylinder count. Name the columns `avg_mpg` and `n_cars`. Save to `my_result` and sort by `cyl` ascending.

**Expected output:** 3 rows (one per cylinder count: 4, 6, 8).

```r
# Exercise 4: group-by aggregation
# Hint: use .(new1 = ..., new2 = ...) in j, and by=cyl. Use .N for row counts.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- dt_cars[, .(avg_mpg = mean(mpg), n_cars = .N), by = cyl]
setorder(my_result, cyl)
my_result
#>    cyl  avg_mpg n_cars
#> 1:   4 26.66364     11
#> 2:   6 19.74286      7
#> 3:   8 15.10000     14
```

**Explanation:** `.N` is a special symbol that holds the number of rows in each group. Combined with `by = cyl`, data.table splits the table into cylinder groups, computes `mean(mpg)` and `.N` per group, and returns a 3-row summary. `setorder()` sorts the result in place — faster than `order()` because no copy is made. Four-cylinder cars average 26.7 mpg; eight-cylinder cars only 15.1.

</details>

## Exercise 5: Multi-column aggregation with .SD

Compute the mean of all four numeric columns (`Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`) in `dt_iris`, grouped by `Species`. Save to `my_result`.

**Expected output:** 3 rows (one per species), 5 columns.

```r
# Exercise 5: apply mean() to many columns at once
# Hint: use lapply(.SD, mean) with .SDcols to target numeric columns

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- dt_iris[, lapply(.SD, mean), by = Species,
                     .SDcols = c("Sepal.Length", "Sepal.Width",
                                 "Petal.Length", "Petal.Width")]
my_result
#>       Species Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1:     setosa        5.006       3.428        1.462       0.246
#> 2: versicolor        5.939       2.770        4.260       1.326
#> 3:  virginica        6.588       2.974        5.552       2.026
```

**Explanation:** `.SD` stands for "Subset of Data" — it is a data.table containing the current group's rows for the columns listed in `.SDcols`. `lapply(.SD, mean)` applies `mean()` to each column of that subset. Without `.SDcols`, `.SD` would include every non-grouping column. Virginica irises have petals roughly 3.8x longer than setosa.

</details>

## Exercise 6: Chain operations with DT[...][...]

Using `dt_cars`, find the top 3 cars (by `hp`) among automatic transmissions (`am == 0`), then keep only `model`, `hp`, and `mpg`. Solve it in one expression using chaining. Save to `my_result`.

**Expected output:** 3 rows, 3 columns.

```r
# Exercise 6: filter, sort, head, select — all chained
# Hint: DT[i][order()][1:3][, j] stacks four operations left-to-right

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- dt_cars[am == 0][order(-hp)][1:3, .(model, hp, mpg)]
my_result
#>                 model  hp  mpg
#> 1: Cadillac Fleetwood 205 10.4
#> 2:Lincoln Continental 215 10.4
#> 3:         Camaro Z28 245 13.3
```

**Explanation:** Each `[]` consumes the table returned by the previous step, so you can read chains left to right: "take automatics, sort by horsepower descending, take the first three, keep these columns." The minus sign in `order(-hp)` sorts descending. This is equivalent to piping in dplyr — one operation per bracket keeps each step readable.

</details>

[KEY INSIGHT]
**Chaining lets you build a pipeline without temporary variables.** Each `[]` returns a fresh data.table that becomes the input for the next bracket. This keeps memory usage low and reads almost like English — filter, then sort, then slice, then pick columns.

## Exercise 7: Update by reference with :=

Add two new columns to `dt_cars` in place: `kpl` (kilometres per litre = `mpg * 0.425`) and `power_weight` (`hp / wt`). Use the multi-column `:=` form. Then print the first 3 rows of the updated table.

**Expected output:** `dt_cars` now has 14 columns (was 12).

```r
# Exercise 7: add two columns in place
# Hint: DT[, c("a", "b") := .(expr1, expr2)]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
dt_cars[, c("kpl", "power_weight") := .(mpg * 0.425, hp / wt)]
ncol(dt_cars)
#> [1] 14
head(dt_cars[, .(model, mpg, kpl, hp, power_weight)], 3)
#>            model  mpg    kpl  hp power_weight
#> 1:     Mazda RX4 21.0 8.9250 110     41.98473
#> 2: Mazda RX4 Wag 21.0 8.9250 110     38.46154
#> 3:    Datsun 710 22.8 9.6900  93     40.08621
```

**Explanation:** The `:=` operator modifies `dt_cars` in place — no assignment needed on the left. The multi-column form uses a character vector of names on the left and a list of expressions on the right. Because the update happens in place, it is memory-efficient: data.table does not copy the whole table to add two columns.

</details>

[WARNING]
**:= changes the original table, even without assignment.** If you run `dt_cars[, kpl := mpg * 0.425]`, the column sticks. If you need an untouched copy for later, run `safe <- copy(dt_cars)` BEFORE the update.

## Exercise 8: Sort with setorder and setkey

Sort `dt_cars` in place by `cyl` ascending and `mpg` descending using `setorder()`. Then set `cyl` as the key using `setkey()` for fast filtering. Verify the sort order and the key.

**Expected output:** `key(dt_cars)` returns `"cyl"`, and the first row is a 4-cylinder with the highest mpg.

```r
# Exercise 8: in-place sort, then set a key
# Hint: setorder(DT, col1, -col2) sorts; setkey(DT, col) indexes

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
setorder(dt_cars, cyl, -mpg)
setkey(dt_cars, cyl)
key(dt_cars)
#> [1] "cyl"
head(dt_cars[, .(model, cyl, mpg)], 3)
#>             model cyl  mpg
#> 1: Toyota Corolla   4 33.9
#> 2:  Fiat 128       4 32.4
#> 3: Honda Civic     4 30.4
```

**Explanation:** `setorder()` sorts a data.table in place (no copy), using a fast radix algorithm. Prefix a column with `-` to sort it descending. `setkey()` tells data.table to keep the table indexed on `cyl`, which makes future filters like `dt_cars[.(4)]` or joins on `cyl` much faster. Note that `setkey()` also physically reorders rows — `setorder()` and `setkey()` are related but distinct.

</details>

## Exercise 9: Join two data.tables

Build two small tables from `starwars`-style data. Join them on `planet_id` to see each person's planet name. Keep all rows from the people table (left join).

```r
# Starter data — run this first
people <- data.table(id = c(1, 2, 3, 4),
                     name = c("Luke", "Leia", "Han", "Chewie"),
                     planet_id = c(10, 10, 20, 30))
planets <- data.table(planet_id = c(10, 20),
                      planet = c("Tatooine", "Corellia"))
```

Join `people` with `planets` on `planet_id` so every person keeps their row even if no planet matches. Save to `my_result`.

**Expected output:** 4 rows — Chewie's planet is `NA` because planet 30 is not in `planets`.

```r
# Exercise 9: left join
# Hint: X[Y, on=] returns rows from Y joined with matches from X.
# For a left join keeping all of people, write planets[people, on="planet_id"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- planets[people, on = "planet_id"]
my_result
#>    planet_id   planet id   name
#> 1:        10 Tatooine  1   Luke
#> 2:        10 Tatooine  2   Leia
#> 3:        20 Corellia  3    Han
#> 4:        30     <NA>  4 Chewie
```

**Explanation:** In data.table's join syntax `X[Y, on=]`, the outer table `X` is joined onto the rows of `Y`. So `planets[people, on="planet_id"]` returns all four people rows with matched planet columns attached. Chewie's row has `NA` for `planet` because no planet with id 30 exists. This is equivalent to `dplyr::left_join(people, planets, by="planet_id")`.

</details>

## Exercise 10: Rolling join

You have sensor readings and need to match each event to the most recent sensor reading BEFORE the event time. This is a rolling join.

```r
# Starter data
readings <- data.table(t = c(1, 3, 7, 10), value = c(10, 30, 70, 100))
events   <- data.table(t = c(2, 5, 9))
setkey(readings, t)
setkey(events, t)
```

Roll the `value` from `readings` forward onto each event, so each event gets the most recent prior reading. Save to `my_result`.

**Expected output:** 3 rows — event times `2, 5, 9` get values `10, 30, 70`.

```r
# Exercise 10: rolling join
# Hint: readings[events, roll = TRUE] rolls the prior value forward

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- readings[events, roll = TRUE]
my_result
#>    t value
#> 1: 2    10
#> 2: 5    30
#> 3: 9    70
```

**Explanation:** With `roll = TRUE`, when an event time does not match a reading time exactly, data.table carries the last prior reading forward. Event at `t=2` has no exact reading, so the reading at `t=1` (value 10) is used. Event at `t=5` gets the reading at `t=3` (value 30). This is the standard pattern for matching time-stamped events to price ticks, sensor states, or version history.

</details>

## Exercise 11: Reshape wide to long with melt

Reshape `dt_iris` so that the four numeric measurements collapse into two columns: `measurement` (holding names like "Sepal.Length") and `value` (holding the number). Keep `Species` as the id column. Save to `my_long`.

**Expected output:** 600 rows (150 flowers x 4 measurements), 3 columns.

```r
# Exercise 11: wide to long
# Hint: melt(DT, id.vars=, variable.name=, value.name=)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_long <- melt(dt_iris,
                id.vars = "Species",
                variable.name = "measurement",
                value.name = "value")
dim(my_long)
#> [1] 600   3
head(my_long, 3)
#>    Species  measurement value
#> 1:  setosa Sepal.Length   5.1
#> 2:  setosa Sepal.Length   4.9
#> 3:  setosa Sepal.Length   4.7
tail(my_long, 3)
#>      Species measurement value
#> 1: virginica Petal.Width   2.3
#> 2: virginica Petal.Width   1.8
#> 3: virginica Petal.Width   1.8
```

**Explanation:** `melt()` pivots wide tables into long (tidy) format. `id.vars` is the column to keep intact (repeated for each measurement). The four measurement columns become the values of `measurement`, and their numbers become the values of `value`. The row count multiplies by the number of melted columns: 150 x 4 = 600. This long shape is what `ggplot2` expects for facetting.

</details>

## Exercise 12: Lag and cumulative sum by group

Using `dt_iris`, create a new data.table `my_result` that for each `Species` has:
- `row` = row number within species
- `length` = `Sepal.Length`
- `prev_length` = the previous row's `Sepal.Length` within the same species
- `cum_length` = running total of `Sepal.Length` within the same species

Keep only species `setosa` and the first 5 rows for brevity.

**Expected output:** 5 rows showing lag and cumulative sum.

```r
# Exercise 12: window-style calculations within groups
# Hint: shift() gives lag; cumsum() gives running total. Both work inside j with by=.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- dt_iris[, .(row = seq_len(.N),
                         length = Sepal.Length,
                         prev_length = shift(Sepal.Length),
                         cum_length = cumsum(Sepal.Length)),
                     by = Species]
my_result[Species == "setosa"][1:5]
#>    Species row length prev_length cum_length
#> 1:  setosa   1    5.1          NA        5.1
#> 2:  setosa   2    4.9         5.1       10.0
#> 3:  setosa   3    4.7         4.9       14.7
#> 4:  setosa   4    4.6         4.7       19.3
#> 5:  setosa   5    5.0         4.6       24.3
```

**Explanation:** `shift()` is data.table's lag/lead function — by default it shifts values down by 1, so row i receives row i-1's value. The first row of each group has `NA` because there is no prior value. `cumsum()` runs a cumulative sum, resetting at each group boundary because of `by = Species`. These two are the most common window functions in practice.

</details>

[TIP]
**Use shift() with type="lead" to look ahead.** Pass `type = "lead"` for the opposite direction: row i receives row i+1's value. The last row of each group becomes `NA`.

## What are the most common data.table mistakes?

Four traps catch almost everyone the first week. Walk through each wrong/right pair so you can spot the pattern when you hit it in your own code.

### Mistake 1: Modifying a data.table inside a function without copy()

Functions that use `:=` will silently change the caller's table.

Wrong:
```r
add_kpl <- function(dt) {
  dt[, kpl := mpg * 0.425]
  dt
}
safe <- data.table(mpg = c(20, 25))
result <- add_kpl(safe)
# safe is now modified too — it grew a kpl column
```

**Why it is wrong:** data.table passes tables by reference, and `:=` mutates. The caller did not ask for `safe` to change.

Correct:
```r
add_kpl <- function(dt) {
  out <- copy(dt)
  out[, kpl := mpg * 0.425]
  out
}
```

Call `copy()` at the top of any function that uses `:=` on its argument.

### Mistake 2: Forgetting the leading comma in DT[, j]

If you want to select columns only, you must keep the comma.

Wrong:
```r
dt_cars[.(mpg, cyl)]   # data.table thinks you are doing a key-based lookup
```

**Why it is wrong:** `DT[.(...)]` with no comma is interpreted as a join/key-lookup. With a leading comma `DT[, .(mpg, cyl)]`, the expression is read as `j`.

Correct:
```r
dt_cars[, .(mpg, cyl)]   # the comma says: no row filter, select these columns
```

### Mistake 3: Assigning a chain that starts with :=

`:=` returns the table invisibly — assigning it creates confusion.

Wrong:
```r
result <- dt_cars[, kpl := mpg * 0.425]
# result and dt_cars now point to the SAME object
```

**Why it is wrong:** `:=` mutates and returns the original table. The new `result` is not a copy; any later edit to one affects the other.

Correct:
```r
dt_cars[, kpl := mpg * 0.425]     # just update in place
result <- copy(dt_cars)           # then explicitly copy if needed
```

### Mistake 4: Grouping inside j instead of using by=

Using `tapply()` or manual subsetting inside `j` defeats the optimiser.

Wrong:
```r
dt_cars[, tapply(mpg, cyl, mean)]   # works but slow and returns a named vector
```

**Why it is wrong:** data.table has a fast `by=` optimiser that skips R-level overhead. Using `tapply()` inside `j` bypasses it.

Correct:
```r
dt_cars[, .(avg = mean(mpg)), by = cyl]   # optimised group-by, returns a data.table
```

## Complete Example

Now let's stitch several exercises together into a realistic mini-analysis. Imagine you want to answer the question: *"Which transmission type is more fuel-efficient, and how does the answer change by cylinder count?"* The pipeline below filters, aggregates, joins a label table, sorts, and reshapes for plotting — all in one readable flow.

```r
# 1. Drop the very worst gas guzzlers so the summary is meaningful
eff_cars <- dt_cars[mpg > 15]

# 2. Mean mpg and car count by cylinder and transmission
agg <- eff_cars[, .(mean_mpg = round(mean(mpg), 1), n = .N),
                by = .(cyl, am)]

# 3. Small reference table mapping am codes to readable labels
grades <- data.table(am = c(0, 1), transmission = c("Automatic", "Manual"))

# 4. Left join the label onto the aggregate
joined <- grades[agg, on = "am"]

# 5. Sort by cyl ascending, then mean_mpg descending
setorder(joined, cyl, -mean_mpg)
joined
#>    am transmission cyl mean_mpg n
#> 1:  1       Manual   4     28.8 8
#> 2:  0   Automatic   4     22.9 3
#> 3:  1       Manual   6     20.6 3
#> 4:  0   Automatic   6     19.1 4
#> 5:  0   Automatic   8     15.1 9

# 6. Reshape wide: one column per transmission, one row per cylinder count
wide <- dcast(joined, cyl ~ transmission, value.var = "mean_mpg")
wide
#>    cyl Automatic Manual
#> 1:   4      22.9   28.8
#> 2:   6      19.1   20.6
#> 3:   8      15.1     NA
```

Manuals beat automatics in every cylinder class where both appear — by 6 mpg for 4-cylinder cars and 1.5 mpg for 6-cylinder. The 8-cylinder cars above 15 mpg are all automatics, so the `Manual` column is `NA` there. The final `wide` table is plot-ready: one row per x-axis category, one column per bar group. This filter → aggregate → join → reshape pattern is the 80% workflow of real `data.table` analysis.

## Summary

| Concept | Key syntax | Exercises |
|---|---|---|
| Filter rows | `DT[i]` | 1, 3 |
| Select/compute columns | `DT[, .(...)]` | 2, 3 |
| Group aggregate | `DT[, j, by=]` | 4, 5 |
| Multi-column ops | `.SD`, `.SDcols` | 5 |
| Chain operations | `DT[...][...][...]` | 6 |
| Update in place | `:=` | 7 |
| Sort / key | `setorder()`, `setkey()` | 8 |
| Join | `X[Y, on=]` | 9, 10 |
| Reshape | `melt()`, `dcast()` | 11 |
| Window / group-wise | `shift()`, `cumsum()` with `by=` | 12 |

If you solved all 12 without peeking, you can handle 90% of real-world data.table tasks. If a few stumped you, revisit the relevant exercise and the Common Mistakes section — the traps caught you for a reason, and the second attempt is where the syntax sticks.

## References

1. Dowle, M., Srinivasan, A. — data.table package documentation. CRAN. [Link](https://cran.r-project.org/package=data.table)
2. data.table GitHub repository — Rdatatable/data.table. [Link](https://github.com/Rdatatable/data.table)
3. data.table vignettes — Introduction, Reference semantics, Keys and fast binary search. [Link](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-intro.html)
4. Atrebas — data.table cheat sheet. [Link](https://atrebas.github.io/post/2020-06-14-datatable-introduction/)
5. Wickham, H., Grolemund, G. — *R for Data Science*, 2nd edition. [Link](https://r4ds.hadley.nz/)
6. Dowle, M. — data.table FAQ vignette. [Link](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-faq.html)

## Continue Learning

- [dplyr filter() and select() Exercises](dplyr-filter-select-Exercises.html) — practise the tidyverse equivalent of Exercises 1-3 above.
- [dplyr group_by() and summarise() Exercises](dplyr-group-by-summarise-Exercises.html) — contrast Exercises 4-5 with the dplyr aggregation pattern.
- [R Joins Tutorial](R-Joins.html) — deeper dive into inner, left, right, full, and rolling joins.
