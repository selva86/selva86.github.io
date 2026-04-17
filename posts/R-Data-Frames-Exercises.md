---
title: "R Data Frames Exercises: 15 Practice Questions (Beginner to Advanced, Solved Step-by-Step)"
slug: "R-Data-Frames-Exercises"
description: "15 interactive R data frame exercises with worked solutions, create, subset, filter, add columns, group, merge and reshape. Runnable right in the page."
keywords: "R data frames exercises, R data frame practice, R subset exercises, R data frame filtering, R data frame practice problems"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.3"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Data Frames (15 problems)"
auto_link_terms: "R data frames exercises|R data frame practice|R subset exercises"
auto_link_case_sensitive: false
fr_parent: "R-Data-Frames.html"
difficulty: "Intermediate"
---

# R Data Frames Exercises: 15 Practice Questions (Beginner to Advanced, Solved Step-by-Step)

<p class="lead">Fifteen focused exercises that take you from creating a data frame from scratch to filtering, grouping, merging and reshaping. Every problem runs in the browser with an expandable worked solution. No downloads, no setup, just code and check.</p>

Data frames are the workhorse of R. Almost every analysis you will ever write consumes or produces one. These exercises use only base R so they work in any R session, including the one embedded in this page. Once you are fluent here, the `dplyr` version of the same operations will feel obvious.

## Setup

Every exercise uses the built-in `mtcars` and `iris` datasets, plus one small data frame we construct in the first exercise. The code blocks share state, so what you create in Exercise 1 is available in Exercise 15.

```r
data("mtcars")
data("iris")

dim(mtcars)   # 32 11
dim(iris)     # 150 5
head(mtcars, 3)
```

## Section 1, Creating and inspecting data frames

### Exercise 1. Build a data frame from vectors

Create a data frame `students` with three columns, `name` (character), `age` (integer), `score` (double), and five rows of your own made-up data. Confirm the types with `str()`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
students <- data.frame(
  name  = c("Ava", "Ben", "Cho", "Dee", "Eli"),
  age   = c(21L, 24L, 19L, 22L, 25L),
  score = c(87.5, 72.0, 91.2, 68.4, 79.9),
  stringsAsFactors = FALSE
)

str(students)
# 'data.frame': 5 obs. of  3 variables:
#  $ name : chr  "Ava" "Ben" "Cho" "Dee" "Eli"
#  $ age  : int  21 24 19 22 25
#  $ score: num  87.5 72 91.2 68.4 79.9
```

In R 4.0 and later, `stringsAsFactors = FALSE` is the default, the argument is only needed for compatibility with older code.

</details>

### Exercise 2. Inspect a data frame

Using `mtcars`, report: its dimensions, the column names, the class of every column, and a compact summary with `summary()`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
dim(mtcars)           # 32 11
names(mtcars)         # "mpg" "cyl" ... "carb"
sapply(mtcars, class) # all numeric
summary(mtcars)
```

`sapply(df, class)` is the cleanest way to see the type of every column at once. For big data frames where that is too noisy, use `str(df)` instead.

</details>

### Exercise 3. Access one column, four ways

From `students`, extract the `score` column using: `$`, `[[`, `[, "score"]`, and `[, 3]`. Confirm all four return the same numeric vector.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
students$score
students[["score"]]
students[, "score"]
students[, 3]

identical(students$score, students[["score"]])   # TRUE
identical(students$score, students[, "score"])   # TRUE
identical(students$score, students[, 3])         # TRUE
```

All four return an *atomic vector*. Note that `students["score"]` (without the comma) returns a *one-column data frame*, not a vector, a surprising but consistent rule.

</details>

## Section 2, Subsetting rows and columns

### Exercise 4. Select specific columns

From `mtcars`, return a new data frame with only `mpg`, `cyl` and `hp`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mtcars[, c("mpg", "cyl", "hp")] |> head()

# Or equivalently:
mtcars[c("mpg", "cyl", "hp")] |> head()
```

When you use character names instead of integer positions, the code keeps working even if columns are reordered or renamed.

</details>

### Exercise 5. Drop specific columns

From `mtcars`, return a data frame with everything *except* `qsec` and `vs`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mtcars[, !(names(mtcars) %in% c("qsec", "vs"))] |> head()

# Or, set those columns to NULL on a copy:
m2 <- mtcars
m2$qsec <- NULL
m2$vs   <- NULL
head(m2)
```

Both idioms are common. The first is safer inside a pipeline; the second is clearer for ad-hoc exploration.

</details>

### Exercise 6. Filter rows with one condition

Return the rows of `mtcars` where `mpg > 25`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mtcars[mtcars$mpg > 25, ]
```

Note the trailing comma, `mtcars[mtcars$mpg > 25]` (no comma) tries to index columns, not rows, and will give you something unexpected.

</details>

### Exercise 7. Filter with multiple conditions

Return the rows of `mtcars` where `mpg > 20` AND `cyl == 4`, keeping only the columns `mpg`, `cyl`, `hp`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mtcars[mtcars$mpg > 20 & mtcars$cyl == 4, c("mpg", "cyl", "hp")]
```

Combine the row filter with column selection in a single `[ , ]` call. Use `&` for element-wise AND, never `&&`.

</details>

## Section 3, Adding and transforming columns

### Exercise 8. Add a computed column

Add a column `kpl` to a copy of `mtcars` that converts `mpg` (US miles per US gallon) to kilometres per litre. The conversion is `kpl = mpg * 0.425`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mt <- mtcars
mt$kpl <- mt$mpg * 0.425
head(mt[, c("mpg", "kpl")])
```

Assigning to `mt$kpl` creates the column if it does not exist, otherwise overwrites it.

</details>

### Exercise 9. Conditional column with ifelse

Add a column `efficiency` to `mt` with value `"high"` when `mpg > 25`, `"medium"` when `mpg` is between 15 and 25 inclusive, and `"low"` otherwise.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mt$efficiency <- ifelse(mt$mpg > 25, "high",
                 ifelse(mt$mpg >= 15, "medium", "low"))

table(mt$efficiency)
#  high   low medium
#     6     3    23
```

`ifelse()` is vectorised, it walks the condition element by element. Nest calls to build more than two branches, or switch to `dplyr::case_when()` for many branches.

</details>

### Exercise 10. Rename a column

Rename the column `wt` to `weight_1000lbs` in `mt`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
names(mt)[names(mt) == "wt"] <- "weight_1000lbs"
head(mt)
```

You assign into `names(mt)` at the position where the current name matches. This leaves every other column name untouched.

</details>

## Section 4, Aggregation, merging and reshaping

### Exercise 11. Group and summarise with aggregate

Use `aggregate()` on `mtcars` to compute the mean `mpg` for each number of cylinders.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
#   cyl      mpg
# 1   4 26.66364
# 2   6 19.74286
# 3   8 15.10000
```

The formula syntax `mpg ~ cyl` reads as "mpg by cyl". You can group by multiple variables with `mpg ~ cyl + gear`.

</details>

### Exercise 12. Count rows per group

Count how many cars in `mtcars` have each combination of `cyl` and `gear`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
table(mtcars$cyl, mtcars$gear)
#      3  4  5
#   4  1  8  2
#   6  2  4  1
#   8 12  0  2

# Or as a data frame:
as.data.frame(table(cyl = mtcars$cyl, gear = mtcars$gear))
```

`table()` returns a contingency table. Wrapping in `as.data.frame()` gives you a tidy long-format version with one row per combination.

</details>

### Exercise 13. Merge two data frames

Create a small data frame `cyl_info` with columns `cyl` (4, 6, 8) and `fuel_type` ("economy", "mid", "performance"). Merge it onto `mtcars` so every car gets a `fuel_type` label.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
cyl_info <- data.frame(
  cyl       = c(4, 6, 8),
  fuel_type = c("economy", "mid", "performance")
)

m3 <- merge(mtcars, cyl_info, by = "cyl")
head(m3[, c("mpg", "cyl", "fuel_type")])
```

`merge()` is base R's SQL-like join. By default it does an inner join on the common column(s). Use `all.x = TRUE` for a left join, `all.y = TRUE` for right, and `all = TRUE` for a full outer join.

</details>

### Exercise 14. Wide to long with stack

Create a small wide data frame of quarterly sales and reshape it to long format with one row per (quarter, sales) combination.

```r
wide <- data.frame(q1 = 100, q2 = 150, q3 = 200, q4 = 175)
```

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
wide <- data.frame(q1 = 100, q2 = 150, q3 = 200, q4 = 175)

long <- stack(wide)
names(long) <- c("sales", "quarter")
long <- long[, c("quarter", "sales")]
long
#   quarter sales
# 1      q1   100
# 2      q2   150
# 3      q3   200
# 4      q4   175
```

`stack()` is base R's minimal reshape tool. For anything bigger than this, reach for `tidyr::pivot_longer()`, but `stack()` is fine for toy examples and quick work.

</details>

### Exercise 15. Sort by multiple columns

Sort `mtcars` by `cyl` ascending and then by `mpg` descending within each cylinder group. Return the first 10 rows.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
mtcars[order(mtcars$cyl, -mtcars$mpg), ][1:10, ]
```

`order()` accepts multiple keys and returns the row indices. A minus sign in front of a numeric column reverses the sort direction for that column only.

</details>

## Summary

- Build data frames with `data.frame()` and inspect with `dim()`, `str()`, `summary()`, `head()`.
- Subset with `df[row_condition, column_selector]`. Always include the comma.
- Add columns by assigning into `df$new_col`, vectorised arithmetic applies automatically.
- Conditional columns: `ifelse()` for binary, nested `ifelse()` or `dplyr::case_when()` for more branches.
- Aggregation: `aggregate(y ~ g, data, FUN)`. Counts: `table()`. Joins: `merge()`.
- Sorting: `df[order(...), ]`, a minus sign reverses a numeric column.

## References

- [R Language Definition, data frames](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Data-frames)
- [Advanced R, Data frames and tibbles](https://adv-r.hadley.nz/vectors-chap.html#tibble)
- [R for Data Science (2e)](https://r4ds.hadley.nz/)

## Continue Learning

- [R Data Frames: The Data Structure You'll Use in Every Analysis](R-Data-Frames.html)
- [R Vectors Exercises: 12 Hands-On Problems](R-Vectors-Exercises.html)
- [R Lists Exercises: 10 Practice Problems with Full Solutions](R-Lists-Exercises.html)
