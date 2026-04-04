---
title: "R Data Frames: Every Operation You'll Actually Need"
slug: "R-Data-Frames"
description: "Master R data frames — create, subset, filter, modify, sort, merge, and summarize. Interactive examples covering every operation you'll use daily."
keywords: "R data frames, data.frame in R, subset R, filter rows R, R data manipulation, merge data frames, aggregate in R"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.7"
post_type: "C"
auto_link_terms: "R data frames|data.frame()|R data frame|data frame in R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Data Frames"
sidebar_order: 7
---

<nav class="breadcrumb-nav">Home &gt; Learn R &gt; Fundamentals &gt; R Data Frames</nav>

# R Data Frames: Every Operation You'll Actually Need

<p class="lead">A data frame is R's built-in table — rows are observations, columns are variables, and every column is a vector of the same length. It's the workhorse of data analysis in R and the structure most packages expect as input and output.</p>

## Introduction

Think of a data frame as a spreadsheet with strict rules: each column must be a vector of a single type, and all columns must have the same length. This structure is what makes data frames efficient, predictable, and the foundation of virtually every R analysis.

This tutorial walks through every data frame operation you'll use in real work — creating, inspecting, subsetting, filtering, modifying, sorting, and merging. Every code block is live — click **Run** to execute.

By the end you'll handle data frames as confidently as you'd handle a spreadsheet, and you'll have the vocabulary to move on to dplyr and tidyverse operations.

## How do you create a data frame in R?

Use `data.frame()` with named arguments — each argument becomes a column. All columns must be the same length.

![R Data Frame Structure](screenshots/R-Data-Frames-structure.webp)
*Figure 1: A data frame is a rectangular collection of equal-length vectors.*

```r
# Create a data frame from vectors
students <- data.frame(
  name = c("Alice", "Bob", "Carol", "Dave"),
  age = c(22, 25, 23, 28),
  score = c(85, 72, 91, 68),
  passed = c(TRUE, TRUE, TRUE, FALSE)
)
students
#>    name age score passed
#> 1 Alice  22    85   TRUE
#> 2   Bob  25    72   TRUE
#> 3 Carol  23    91   TRUE
#> 4  Dave  28    68  FALSE
```

The `data.frame()` function stacks the vectors as columns. R shows row numbers on the left (1, 2, 3, 4) automatically. Each column has one type: character, double, double, logical.

[KEY INSIGHT]
**A data frame is really a list of equal-length vectors.** This is why you can access columns with `df$col` (list-style) and why most list operations work on data frames. Understanding this unlocks everything else.

R also ships with built-in data frames for practice. Use these instead of inventing data every time:

```r
# Built-in datasets
head(mtcars, 3)
#>                mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61  1  1    4    1

# Number of rows and columns
nrow(mtcars)
#> [1] 32
ncol(mtcars)
#> [1] 11
dim(mtcars)
#> [1] 32 11
```

`mtcars`, `iris`, `airquality`, `diamonds` (ggplot2), and `starwars` (dplyr) are go-to datasets for examples. `head()` shows the first 6 rows by default. `nrow()`, `ncol()`, and `dim()` report dimensions.

## How do you inspect a data frame?

Before doing any analysis, always inspect the structure. R provides several functions that give different perspectives on the same data.

```r
# Quick summary of structure
str(students)
#> 'data.frame':    4 obs. of  4 variables:
#>  $ name  : chr  "Alice" "Bob" "Carol" "Dave"
#>  $ age   : num  22 25 23 28
#>  $ score : num  85 72 91 68
#>  $ passed: logi  TRUE TRUE TRUE FALSE

# Statistical summary
summary(students)
#>      name                age            score          passed
#>  Length:4           Min.   :22.00   Min.   :68.00   Mode :logical
#>  Class :character   1st Qu.:22.75   1st Qu.:71.00   FALSE:1
#>  Mode  :character   Median :24.00   Median :78.50   TRUE :3
#>                     Mean   :24.50   Mean   :79.00

# Column names and row count
names(students)
#> [1] "name"   "age"    "score"  "passed"
nrow(students)
#> [1] 4
```

`str()` is your most important tool — it shows types, sample values, and structure in a few lines. `summary()` gives per-column statistics. `names()` lists column names. These three are how every R user starts every analysis.

[TIP]
**Call `str(df)` first whenever you meet a new data frame.** It answers "what types are my columns?" and "what do the values look like?" in one call — faster than trial-and-error.

## How do you access columns and rows?

R offers three main ways to pull data out: `$`, `[[ ]]`, and `[ , ]`. Each has a specific use case.

```r
# Access a column with $
students$age
#> [1] 22 25 23 28

# Access a column with [[
students[["score"]]
#> [1] 85 72 91 68

# Access by [row, column] — 2D indexing
students[1, ]           # row 1, all columns
#>    name age score passed
#> 1 Alice  22    85   TRUE

students[, "name"]      # all rows, name column
#> [1] "Alice" "Bob"   "Carol" "Dave"

students[2, "score"]    # row 2, score column
#> [1] 72
```

`$col` and `[["col"]]` both return a single column as a vector. `[row, col]` handles 2D access — leave either blank to mean "all". The rule: `[row, col]` always, with either position empty selecting everything in that dimension.

Extracting multiple columns returns a smaller data frame:

```r
# Select multiple columns
students[, c("name", "score")]
#>    name score
#> 1 Alice    85
#> 2   Bob    72
#> 3 Carol    91
#> 4  Dave    68

# Select specific rows and columns
students[c(1, 3), c("name", "passed")]
#>    name passed
#> 1 Alice   TRUE
#> 3 Carol   TRUE
```

Pass vectors of row indices and column names to subset both dimensions. The result is always a smaller data frame (or a vector when you select one column without `drop = FALSE`).

## How do you filter rows by condition?

Use logical vectors inside `[` to keep only rows where a condition is `TRUE`. This is the bread-and-butter of data analysis.

```r
# Single condition
students[students$score >= 80, ]
#>    name age score passed
#> 1 Alice  22    85   TRUE
#> 3 Carol  23    91   TRUE

# Combined conditions with & (AND) and | (OR)
students[students$score >= 70 & students$age < 25, ]
#>    name age score passed
#> 1 Alice  22    85   TRUE
#> 3 Carol  23    91   TRUE

# Negation with !
students[!students$passed, ]
#>   name age score passed
#> 4 Dave  28    68  FALSE

# Using subset() for readability (base R)
subset(students, score >= 80 & passed)
#>    name age score passed
#> 1 Alice  22    85   TRUE
#> 3 Carol  23    91   TRUE
```

Each filter condition produces a logical vector the same length as the number of rows. R keeps rows where the vector is `TRUE`. `subset()` is a convenience wrapper that lets you reference column names without `$` — useful for one-liners but avoid it in production code (non-standard evaluation can surprise you).

## How do you modify a data frame?

Adding, updating, and removing columns uses assignment. Each operation is a single line.

```r
# Add a new column
students$grade <- ifelse(students$score >= 80, "A",
                  ifelse(students$score >= 70, "B", "F"))
students
#>    name age score passed grade
#> 1 Alice  22    85   TRUE     A
#> 2   Bob  25    72   TRUE     B
#> 3 Carol  23    91   TRUE     A
#> 4  Dave  28    68  FALSE     F

# Update existing values
students$score[students$name == "Dave"] <- 72
students[students$name == "Dave", ]
#>   name age score passed grade
#> 4 Dave  28    72  FALSE     F

# Remove a column
students$grade <- NULL
names(students)
#> [1] "name"   "age"    "score"  "passed"
```

Three patterns: `df$new <- value` adds, `df$col[mask] <- value` updates selectively, `df$col <- NULL` removes. These three cover most column-level operations.

Adding rows uses `rbind()`:

```r
# Add a row
new_student <- data.frame(name = "Eve", age = 26, score = 79, passed = TRUE)
students <- rbind(students, new_student)
students
#>    name age score passed
#> 1 Alice  22    85   TRUE
#> 2   Bob  25    72   TRUE
#> 3 Carol  23    91   TRUE
#> 4  Dave  28    72  FALSE
#> 5   Eve  26    79   TRUE
```

`rbind()` stacks data frames vertically. The new data frame must have the same column names and compatible types.

[WARNING]
**`rbind()` on large data frames in a loop is slow — it copies the whole frame each iteration.** For many row additions, collect rows in a list and use `do.call(rbind, list_of_dfs)` once at the end, or use `dplyr::bind_rows()`.

## How do you sort a data frame?

Use `order()` to sort by one or more columns. `order()` returns an integer vector of positions that, when used as indices, reorder the rows.

```r
# Sort by score (ascending)
students[order(students$score), ]
#>    name age score passed
#> 4  Dave  28    72  FALSE
#> 2   Bob  25    72   TRUE
#> 5   Eve  26    79   TRUE
#> 1 Alice  22    85   TRUE
#> 3 Carol  23    91   TRUE

# Sort by score (descending)
students[order(-students$score), ]
#>    name age score passed
#> 3 Carol  23    91   TRUE
#> 1 Alice  22    85   TRUE
#> 5   Eve  26    79   TRUE
#> 4  Dave  28    72  FALSE
#> 2   Bob  25    72   TRUE

# Sort by two columns: passed (TRUE first), then score descending
students[order(-students$passed, -students$score), ]
#>    name age score passed
#> 3 Carol  23    91   TRUE
#> 1 Alice  22    85   TRUE
#> 5   Eve  26    79   TRUE
#> 2   Bob  25    72   TRUE
#> 4  Dave  28    72  FALSE
```

Minus signs flip the sort direction. Multiple columns create a tiebreaker hierarchy — first column first, second column breaks ties. The pattern `df[order(...), ]` is the base-R sort idiom.

## How do you summarize groups in a data frame?

Use `aggregate()` to compute summary statistics per group. One function call replaces a loop.

```r
# Mean mpg by number of cylinders in mtcars
aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
#>   cyl      mpg
#> 1   4 26.66364
#> 2   6 19.74286
#> 3   8 15.10000

# Multiple statistics with summary function
aggregate(mpg ~ cyl, data = mtcars, FUN = function(x) c(mean = mean(x), sd = sd(x)))
#>   cyl   mpg.mean    mpg.sd
#> 1   4 26.663636  4.509828
#> 2   6 19.742857  1.453567
#> 3   8 15.100000  2.560048
```

The formula `mpg ~ cyl` reads "mpg by cyl" — compute the statistic on `mpg`, grouped by `cyl`. This is base R's equivalent to SQL `GROUP BY`. For heavier work, `dplyr::group_by() %>% summarise()` is more readable and faster.

## How do you merge two data frames?

Use `merge()` for SQL-style joins. It matches rows based on shared column values.

```r
# Two related data frames
orders <- data.frame(
  order_id = 1:4,
  customer_id = c(101, 102, 101, 103),
  amount = c(250, 400, 120, 890)
)

customers <- data.frame(
  customer_id = c(101, 102, 103, 104),
  name = c("Alice", "Bob", "Carol", "Dave")
)

# Inner join (default) — matches only
merge(orders, customers, by = "customer_id")
#>   customer_id order_id amount  name
#> 1         101        1    250 Alice
#> 2         101        3    120 Alice
#> 3         102        2    400   Bob
#> 4         103        4    890 Carol

# Left join — keep all orders
merge(orders, customers, by = "customer_id", all.x = TRUE)
#>   customer_id order_id amount  name
#> 1         101        1    250 Alice
#> 2         101        3    120 Alice
#> 3         102        2    400   Bob
#> 4         103        4    890 Carol
```

`merge()` matches on the `by` column. Default is an inner join (keep only matches). `all.x = TRUE` keeps all left rows (left join), `all.y = TRUE` keeps all right rows (right join), `all = TRUE` keeps both (full join). Dave has no orders, so he only appears if you use `all.y = TRUE`.

[NOTE]
**For modern R, prefer `dplyr::inner_join()`, `left_join()`, etc.** They're faster, more explicit about join direction, and part of a consistent grammar. `merge()` is still widely used in base-R codebases.

## Common Mistakes and How to Fix Them

### Mistake 1: `stringsAsFactors = TRUE` in old R versions

❌ **Wrong (R < 4.0):**
```r
# On R 3.x, characters were auto-converted to factors
df <- data.frame(name = c("Alice", "Bob"))
class(df$name)
#> [1] "factor"  # ← unexpected
```

**Why it is wrong:** Before R 4.0, `data.frame()` silently converted character columns to factors, surprising anyone who didn't set `stringsAsFactors = FALSE`.

✅ **Correct (R 4.0+ default):**
```r
df <- data.frame(name = c("Alice", "Bob"))
class(df$name)
#> [1] "character"
```

Modern R defaults to character — no action needed. If you see code with `stringsAsFactors = FALSE`, it's pre-R-4.0 defensive coding.

### Mistake 2: Forgetting the comma in `df[row, col]`

❌ **Wrong:**
```r
my_df <- data.frame(x = 1:3, y = 4:6)
my_df[1]   # returns a data frame with column 1, not row 1
#>   x
#> 1 1
#> 2 2
#> 3 3
```

**Why it is wrong:** Without the comma, R treats `[1]` as list-style column access (data frame is a list), not row access.

✅ **Correct:**
```r
my_df <- data.frame(x = 1:3, y = 4:6)
my_df[1, ]
#>   x y
#> 1 1 4
```

### Mistake 3: Using `==` with NA values

❌ **Wrong:**
```r
my_df <- data.frame(x = c(1, NA, 3, NA, 5))
my_df[my_df$x == NA, ]
#> [1] x
#> <0 rows> (or 0-length row.names)
```

**Why it is wrong:** `== NA` returns `NA` for every comparison, not `TRUE`. The subset returns nothing.

✅ **Correct:**
```r
my_df <- data.frame(x = c(1, NA, 3, NA, 5))
my_df[is.na(my_df$x), ]
#>    x
#> 2 NA
#> 4 NA
```

### Mistake 4: Adding rows with wrong types

❌ **Wrong:**
```r
my_df <- data.frame(x = 1:3, y = c("a", "b", "c"))
my_df <- rbind(my_df, data.frame(x = "four", y = "d"))
my_df$x
#> [1] "1"    "2"    "3"    "four"
```

**Why it is wrong:** `rbind()` with type mismatch silently coerces the entire column — here, integer `x` became character. Bug is invisible until later arithmetic fails.

✅ **Correct:**
```r
my_df <- data.frame(x = 1:3, y = c("a", "b", "c"))
my_df <- rbind(my_df, data.frame(x = 4L, y = "d"))
my_df$x
#> [1] 1 2 3 4
```

## Practice Exercises

### Exercise 1: Build a Data Frame

Create a data frame `my_products` with 4 rows and columns: `id` (1 to 4), `name` (4 product names), `price` (prices), `in_stock` (TRUE/FALSE).

```r
# Exercise: build a products data frame
# Hint: data.frame(col1 = ..., col2 = ..., ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_products <- data.frame(
  id = 1:4,
  name = c("Laptop", "Phone", "Tablet", "Headphones"),
  price = c(999, 699, 499, 149),
  in_stock = c(TRUE, TRUE, FALSE, TRUE)
)
my_products
#>   id       name price in_stock
#> 1  1     Laptop   999     TRUE
#> 2  2      Phone   699     TRUE
#> 3  3     Tablet   499    FALSE
#> 4  4 Headphones   149     TRUE
```

**Explanation:** `data.frame()` with named arguments builds columns. Each vector must be the same length (4 here).

</details>

### Exercise 2: Filter by Condition

From `mtcars`, extract cars with 6 cylinders AND more than 100 horsepower.

```r
# Exercise: filter mtcars
# Hint: combine conditions with &

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- mtcars[mtcars$cyl == 6 & mtcars$hp > 100, ]
my_result
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6 160.0 110 3.90 2.875 17.02  0  1    4    4
#> Hornet 4 Drive 21.4   6 258.0 110 3.08 3.215 19.44  1  0    3    1
#> Valiant        18.1   6 225.0 105 3.76 2.620 20.22  1  0    3    1
#> Merc 280       19.2   6 167.6 123 3.92 3.440 18.30  1  0    4    4
#> Merc 280C      17.8   6 167.6 123 3.92 3.440 18.30  1  0    4    4
#> Ferrari Dino   19.7   6 145.0 175 3.52 3.170 15.50  0  1    5    6
```

**Explanation:** `mtcars$cyl == 6` and `mtcars$hp > 100` each produce logical vectors; `&` combines them element-wise.

</details>

### Exercise 3: Add Computed Column

Add a column `value_score` to `mtcars` defined as `mpg / wt` (miles per gallon per ton). Show the top 3 cars by value_score.

```r
# Exercise: add computed column, find top 3
# Hint: order() for sorting, head() for top N

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_cars <- mtcars
my_cars$value_score <- my_cars$mpg / my_cars$wt
head(my_cars[order(-my_cars$value_score), c("mpg", "wt", "value_score")], 3)
#>                 mpg    wt value_score
#> Toyota Corolla 33.9 1.835    18.47411
#> Lotus Europa   30.4 1.513    20.09253
#> Fiat 128       32.4 2.200    14.72727
```

**Explanation:** Division is vectorized. `order(-x)` sorts descending. `head(, 3)` takes the top 3.

</details>

### Exercise 4: Summarize by Group

Compute mean horsepower by number of cylinders from `mtcars` using `aggregate()`.

```r
# Exercise: mean hp by cylinder count
# Hint: aggregate(y ~ x, data = ..., FUN = mean)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_hp_by_cyl <- aggregate(hp ~ cyl, data = mtcars, FUN = mean)
my_hp_by_cyl
#>   cyl        hp
#> 1   4  82.63636
#> 2   6 122.28571
#> 3   8 209.21429
```

**Explanation:** `hp ~ cyl` means "compute on hp, grouped by cyl". `FUN = mean` applies to each group.

</details>

### Exercise 5: Join Two Data Frames

Create two small data frames and inner-join them on a shared column.

```r
# Exercise: merge two data frames
# Hint: merge(df1, df2, by = "shared_col")

my_sales <- data.frame(product_id = c(1, 2, 3, 1), amount = c(100, 200, 150, 80))
my_products <- data.frame(product_id = c(1, 2, 3, 4), name = c("A", "B", "C", "D"))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_sales <- data.frame(product_id = c(1, 2, 3, 1), amount = c(100, 200, 150, 80))
my_products <- data.frame(product_id = c(1, 2, 3, 4), name = c("A", "B", "C", "D"))
my_merged <- merge(my_sales, my_products, by = "product_id")
my_merged
#>   product_id amount name
#> 1          1    100    A
#> 2          1     80    A
#> 3          2    200    B
#> 4          3    150    C
```

**Explanation:** `merge()` matches rows by `product_id`. Product D (id=4) has no sales, so it's dropped in the default inner join.

</details>

## Complete Example: Analyzing Airline Data

Here's a full analysis using the built-in `airquality` dataset.

```r
# --- Air Quality Analysis ---

# Step 1: Inspect the data
str(airquality)
#> 'data.frame':    153 obs. of  6 variables:
#>  $ Ozone  : int  41 36 12 18 NA 28 23 19 8 NA ...
#>  $ Solar.R: int  190 118 149 313 NA NA 299 99 19 194 ...
#>  $ Wind   : num  7.4 8 12.6 11.5 14.3 14.9 8.6 13.8 20.1 8.6 ...
#>  $ Temp   : int  67 72 74 62 56 66 65 59 61 69 ...
#>  $ Month  : int  5 5 5 5 5 5 5 5 5 5 ...
#>  $ Day    : int  1 2 3 4 5 5 5 5 5 5 ...

# Step 2: Remove rows with missing Ozone
clean_air <- airquality[!is.na(airquality$Ozone), ]
cat("Removed", nrow(airquality) - nrow(clean_air), "rows with missing Ozone\n")
#> Removed 37 rows with missing Ozone

# Step 3: Find hot, polluted days
bad_days <- clean_air[clean_air$Temp > 80 & clean_air$Ozone > 80, ]
nrow(bad_days)
#> [1] 17

# Step 4: Monthly averages
monthly_avg <- aggregate(Ozone ~ Month, data = clean_air, FUN = mean)
monthly_avg$Ozone <- round(monthly_avg$Ozone, 1)
monthly_avg
#>   Month Ozone
#> 1     5  23.6
#> 2     6  29.4
#> 3     7  59.1
#> 4     8  60.0
#> 5     9  31.4

# Step 5: Sort months by pollution level
monthly_avg[order(-monthly_avg$Ozone), ]
#>   Month Ozone
#> 4     8  60.0
#> 3     7  59.1
#> 5     9  31.4
#> 2     6  29.4
#> 1     5  23.6
```

This pipeline uses every major operation: `str()` for inspection, logical filtering for NA removal, multi-condition filtering for problem days, `aggregate()` for group summaries, and `order()` for ranking. August and July are the worst months for ozone — that's the kind of insight you can extract in 5 lines of R.

## Summary

| Operation | Syntax | Example |
|---|---|---|
| Create | `data.frame(col = vec, ...)` | `data.frame(x = 1:3, y = 4:6)` |
| Inspect | `str()`, `summary()`, `head()` | `str(mtcars)` |
| Column access | `df$col` or `df[["col"]]` | `mtcars$mpg` |
| Row/col access | `df[row, col]` | `mtcars[1, "mpg"]` |
| Filter rows | `df[condition, ]` | `mtcars[mtcars$cyl==4, ]` |
| Add column | `df$new <- value` | `df$total <- df$a + df$b` |
| Remove column | `df$col <- NULL` | `df$extra <- NULL` |
| Sort | `df[order(df$col), ]` | `df[order(-df$x), ]` |
| Aggregate | `aggregate(y ~ x, data, FUN)` | `aggregate(mpg ~ cyl, mtcars, mean)` |
| Merge | `merge(df1, df2, by)` | `merge(a, b, by = "id")` |

## FAQ

### What's the difference between a data frame and a tibble?

A tibble (`tibble::tibble()` or `dplyr::tibble()`) is a modern data frame with stricter printing and fewer surprises — it won't convert strings to factors, won't partial-match column names, and prints only the first 10 rows by default. Under the hood it's still a data frame; everything you learn about data frames applies to tibbles.

### When should I use `df$col` vs `df[["col"]]`?

Both return a single column as a vector. Use `df$col` for interactive exploration (shorter to type) and `df[["col"]]` when the column name is stored in a variable: `df[[colname]]`. Never use `df[colname]` (single brackets) — that returns a one-column data frame, not a vector.

### Why do some data frame operations return a data frame and others return a vector?

Single-column selection with `[ , col]` returns a vector by default (`drop = TRUE`). Multi-column selection always returns a data frame. To keep single-column selection as a data frame, use `[ , col, drop = FALSE]`.

### How do I rename a column?

Assign to `names(df)`: `names(df)[names(df) == "old"] <- "new"`. Or use `colnames(df)` which is identical. For many renames, `dplyr::rename()` is cleaner.

### How do I find the number of unique values in a column?

`length(unique(df$col))` gives the count. For a frequency table, use `table(df$col)` which returns counts per unique value.

## References

1. R Core Team — *An Introduction to R*, Chapter 6 (Lists and data frames). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 3.5 (Data frames and tibbles). [Link](https://adv-r.hadley.nz/vectors-chap.html#tibble)
3. R manual — `data.frame()` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/data.frame.html)
4. R manual — `merge()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/merge.html)
5. R manual — `aggregate()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aggregate.html)
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 5 (Data transformation with dplyr). [Link](https://r4ds.hadley.nz/data-transform.html)
7. R Core — Changes in R 4.0 (stringsAsFactors default change). [Link](https://cran.r-project.org/doc/manuals/r-devel/NEWS.html)

## What's Next?

- **[R Lists](R-Lists.html)** — the flexible cousin of data frames, for heterogeneous collections.
- **[dplyr filter() and select()](dplyr-filter-select.html)** — the modern, readable way to subset data frames.
- **[dplyr group_by() and summarise()](dplyr-group-by-summarise.html)** — tidyverse's aggregation grammar.
