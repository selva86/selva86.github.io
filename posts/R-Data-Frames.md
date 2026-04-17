---
title: "R Data Frames: Every Operation You'll Need, With 10 Real Examples"
slug: "R-Data-Frames"
description: "Data frames are R's spreadsheet equivalent. Learn to create, subset, add columns, filter rows, and reshape data, illustrated with 10 real-world worked examples."
keywords: "R data frames, data.frame R, subset data frame, filter rows R, add column R, aggregate R, data frame tutorial"
auto_link_terms: "R data frames|data.frame()|data frame subsetting|data frame filtering|data frame columns|aggregate() in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.1.7"
post_type: C
sidebar_section: "R Fundamentals"
sidebar_title: "R Data Frames"
sidebar_order: 7
difficulty: "Beginner"
---

# R Data Frames: Every Operation You'll Need, With 10 Real Examples

<p class="lead">A data frame in R is a table of rows and columns, like a spreadsheet or a database table, where each column can be a different type. It's the single most important data structure for real analysis work, and it powers everything from <code>lm()</code> to ggplot2.</p>

## What is an R data frame and how do you build one?

Under the hood, a data frame is just a list of equal-length vectors, with each vector being one column. That's why columns can be different types (numeric, character, logical) but a column itself must be one type. Let's build one and look at it.

```r title="Build employees with four columns"
employees <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  age = c(29, 42, 31, 55, 38),
  salary = c(65000, 82000, 70000, 95000, 78000),
  remote = c(TRUE, FALSE, TRUE, FALSE, TRUE)
)
employees
#>    name age salary remote
#> 1 Alice  29  65000   TRUE
#> 2   Bob  42  82000  FALSE
#> 3 Carol  31  70000   TRUE
#> 4 David  55  95000  FALSE
#> 5   Eve  38  78000   TRUE
```

Five rows, four columns, two types (numeric and logical plus character). That's a typical data frame in a realistic shape. You'll build many of these from scratch for demos, tests, and quick prototypes, and many more from `read.csv()` when you load real data.

![Anatomy of an R data frame](screenshots/R-Data-Frames-structure.webp)
*Figure 1: A data frame is a list of equal-length column vectors. Each column has a type; each row spans all columns.*

> [TIP]
> Older R (before 4.0) used `stringsAsFactors = TRUE` by default, which silently turned character columns into factors. That default is gone, but you'll still see tutorials setting `stringsAsFactors = FALSE` explicitly, harmless, but no longer required.

**Try it:** Build a data frame with three cities, their populations, and whether they're coastal.

```r title="Exercise: Build excities"
# your turn
ex_cities <- data.frame(
  city = c("___", "___", "___"),
  population = c(___, ___, ___),
  coastal = c(___, ___, ___)
)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Build excities solution"
ex_cities <- data.frame(
  city       = c("Mumbai", "Bengaluru", "Chennai"),
  population = c(20411000, 12765000, 11324000),
  coastal    = c(TRUE, FALSE, TRUE)
)
ex_cities
#>        city population coastal
#> 1    Mumbai   20411000    TRUE
#> 2 Bengaluru   12765000   FALSE
#> 3   Chennai   11324000    TRUE
```

Each argument to `data.frame()` becomes one column, and the three input vectors all have length 3 so the rows line up automatically. Because each column can hold a different type, character, numeric, logical, you get a small mixed-type table in one call.
</details>

## How do you inspect a data frame?

Before you touch a new data frame, you want a quick profile: how big is it, what types are the columns, what's in the first few rows? R gives you a handful of inspection functions that together answer every "what am I looking at?" question.

```r title="Profile a data frame with str"
dim(employees)
#> [1] 5 4
nrow(employees)
#> [1] 5
ncol(employees)
#> [1] 4

str(employees)
#> 'data.frame':   5 obs. of  4 variables:
#>  $ name  : chr  "Alice" "Bob" "Carol" "David" ...
#>  $ age   : num  29 42 31 55 38
#>  $ salary: num  65000 82000 70000 95000 78000
#>  $ remote: logi  TRUE FALSE TRUE FALSE TRUE

head(employees, 3)
#>    name age salary remote
#> 1 Alice  29  65000   TRUE
#> 2   Bob  42  82000  FALSE
#> 3 Carol  31  70000   TRUE

summary(employees$salary)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>   65000   70000   78000   78000   82000   95000
```

`str()` is the workhorse, it tells you shape, column names, types, and a preview in one line per column. `summary()` gives five-number summaries for numeric columns and counts for factors/characters.

**Try it:** Print the names of all columns in `employees` using `names()` or `colnames()`.

```r title="Exercise: List column names"
# one line
names(employees)

```

<details>
<summary>Click to reveal solution</summary>

```r title="List column names solution"
names(employees)
#> [1] "name"   "age"    "salary" "remote"
```

`names()` returns the column names of a data frame as a character vector, which is the same thing `colnames()` gives you. Prefer `names()` in base R because it's shorter and works on lists too.
</details>

## How do you select columns?

There are four ways to pull a column out of a data frame, and you'll see all of them in real code. Let's work through them, because the differences matter, especially when one returns a vector and another returns a one-column data frame.

```r title="Four ways to select a column"
employees$salary
#> [1] 65000 82000 70000 95000 78000

employees[["salary"]]
#> [1] 65000 82000 70000 95000 78000

employees[, "salary"]
#> [1] 65000 82000 70000 95000 78000

employees[, c("name", "salary")]
#>    name salary
#> 1 Alice  65000
#> 2   Bob  82000
#> 3 Carol  70000
#> 4 David  95000
#> 5   Eve  78000
```

The first three return the column as a plain vector. The fourth, selecting multiple columns, returns a smaller data frame. That asymmetry is a classic R gotcha: `df[, "x"]` is a vector, but `df[, c("x", "y")]` is a data frame.

> [KEY INSIGHT]
> Use `df$col` for quick interactive work, `df[["col"]]` when the column name is in a variable, and `df[, cols]` (with a character vector) when you want a sub-data-frame with multiple columns.

**Try it:** Pull just the `age` column out of `employees` as a vector, then compute its mean.

```r title="Exercise: Mean of the age column"
ex_mean_age <- mean(employees$___)
ex_mean_age

```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean of the age column solution"
ex_mean_age <- mean(employees$age)
ex_mean_age
#> [1] 39
```

`employees$age` returns the `age` column as a plain numeric vector, which is exactly what `mean()` expects. The mean of `c(29, 42, 31, 55, 38)` is `195/5 = 39`.
</details>

## How do you filter rows?

Filtering rows is the operation you'll do most often. In base R, you index with a logical vector in the row position: `df[condition, ]`. The comma is critical, it says "all columns." Leave it out and R gets confused.

```r title="Filter rows with a logical index"
employees[employees$age > 35, ]
#>    name age salary remote
#> 2   Bob  42  82000  FALSE
#> 4 David  55  95000  FALSE
#> 5   Eve  38  78000   TRUE

employees[employees$remote == TRUE, ]
#>    name age salary remote
#> 1 Alice  29  65000   TRUE
#> 3 Carol  31  70000   TRUE
#> 5   Eve  38  78000   TRUE

employees[employees$salary > 70000 & employees$age < 50, ]
#>   name age salary remote
#> 2  Bob  42  82000  FALSE
#> 5  Eve  38  78000   TRUE
```

Combine conditions with `&` (and) and `|` (or). Never use `&&` or `||`, those are scalar operators for single `TRUE`/`FALSE` values, not vectors.

> [WARNING]
> `df[df$x > 5]` (without the comma) silently picks *columns* whose position matches the logical vector's `TRUE`s, not rows. Always include the comma: `df[df$x > 5, ]`.

**Try it:** Filter `employees` to rows where salary is below 75000.

```r title="Exercise: Filter by salary threshold"
# include the comma!
employees[employees$salary < 75000, ]

```

<details>
<summary>Click to reveal solution</summary>

```r title="Filter by salary threshold solution"
employees[employees$salary < 75000, ]
#>    name age salary remote
#> 1 Alice  29  65000   TRUE
#> 3 Carol  31  70000   TRUE
```

`employees$salary < 75000` is a logical vector aligned with the rows, and using it in the row position of `[ , ]` keeps only the rows that match. Remember the trailing comma, it tells R "all columns" and is the difference between filtering rows and accidentally picking columns.
</details>

## How do you add or modify columns?

Adding a column is the same syntax as selecting one, just assign into it. This works whether the column already exists (modify) or doesn't (create). The new column can be a constant, a vector, or a vectorized computation on existing columns.

```r title="Add bonus and seniority columns"
employees$bonus <- employees$salary * 0.10
employees
#>    name age salary remote  bonus
#> 1 Alice  29  65000   TRUE   6500
#> 2   Bob  42  82000  FALSE   8200
#> 3 Carol  31  70000   TRUE   7000
#> 4 David  55  95000  FALSE   9500
#> 5   Eve  38  78000   TRUE   7800

employees$seniority <- ifelse(employees$age >= 40, "senior", "junior")
employees$seniority
#> [1] "junior" "senior" "junior" "senior" "junior"

employees$salary <- employees$salary + employees$bonus
employees$salary
#> [1] 71500 90200 77000 104500 85800
```

`ifelse()` is the vectorized counterpart to the scalar `if/else`, it applies the condition element-by-element across the vector. To drop a column, assign `NULL`: `employees$bonus <- NULL`.

**Try it:** Add a column `high_earner` that is `TRUE` when salary is above 80000.

```r title="Exercise: Flag high earners"
employees$high_earner <- employees$salary > ___
employees

```

<details>
<summary>Click to reveal solution</summary>

```r title="Flag high earners solution"
employees$high_earner <- employees$salary > 80000
employees
#>    name age salary remote high_earner
#> 1 Alice  29  65000   TRUE       FALSE
#> 2   Bob  42  82000  FALSE        TRUE
#> 3 Carol  31  70000   TRUE       FALSE
#> 4 David  55  95000  FALSE        TRUE
#> 5   Eve  38  78000   TRUE       FALSE
```

Assigning into a new name, `employees$high_earner`, appends a column because the name doesn't exist yet. The right-hand side is a vectorized comparison, so R broadcasts `> 80000` across every salary and stores the logical result as the new column.
</details>

## How do you sort and rank rows?

Sorting a data frame means reordering its rows by one or more columns. Base R uses `order()`, which returns the *positions* that would put a vector in sorted order. You then use those positions as a row index.

```r title="Sort by salary ascending and descending"
employees[order(employees$salary), ]
#>    name age salary remote bonus seniority
#> 3 Carol  31  77000   TRUE  7000    junior
#> 1 Alice  29  71500   TRUE  6500    junior
#> 5   Eve  38  85800   TRUE  7800    junior
#> 2   Bob  42  90200  FALSE  8200    senior
#> 4 David  55 104500  FALSE  9500    senior

employees[order(-employees$salary), ]
#>    name age salary remote bonus seniority
#> 4 David  55 104500  FALSE  9500    senior
#> 2   Bob  42  90200  FALSE  8200    senior
#> 5   Eve  38  85800   TRUE  7800    junior
#> 3 Carol  31  77000   TRUE  7000    junior
#> 1 Alice  29  71500   TRUE  6500    junior

employees[order(employees$seniority, -employees$salary), ]
#>    name age salary remote bonus seniority
#> 5   Eve  38  85800   TRUE  7800    junior
#> 3 Carol  31  77000   TRUE  7000    junior
#> 1 Alice  29  71500   TRUE  6500    junior
#> 4 David  55 104500  FALSE  9500    senior
#> 2   Bob  42  90200  FALSE  8200    senior
```

A negative sign in front of a numeric column reverses that column's sort order. For character/factor columns, wrap them in `order(..., decreasing = TRUE)` instead.

**Try it:** Sort `employees` by `age` ascending.

```r title="Exercise: Sort employees by age"
employees[order(employees$___), ]

```

<details>
<summary>Click to reveal solution</summary>

```r title="Sort employees by age solution"
employees[order(employees$age), ]
#>    name age salary remote
#> 1 Alice  29  65000   TRUE
#> 3 Carol  31  70000   TRUE
#> 5   Eve  38  78000   TRUE
#> 2   Bob  42  82000  FALSE
#> 4 David  55  95000  FALSE
```

`order(employees$age)` returns the row positions that would sort `age` ascending, `c(1, 3, 5, 2, 4)`, and indexing with them reorders the data frame. Notice the row numbers on the left: they carry over from the original, which is how you can tell sorting rearranged rows rather than rebuilding the data frame.
</details>

## How do you summarize by group with `aggregate()`?

The "split-apply-combine" pattern, group rows by a column, compute something on each group, combine the results, is the core of most analyses. Base R's `aggregate()` does it in one call.

```r title="Aggregate salary by seniority"
aggregate(salary ~ seniority, data = employees, FUN = mean)
#>   seniority salary
#> 1    junior  78100
#> 2    senior  97350

aggregate(cbind(salary, age) ~ seniority, data = employees, FUN = mean)
#>   seniority salary  age
#> 1    junior  78100 32.67
#> 2    senior  97350 48.50

aggregate(salary ~ remote, data = employees, FUN = function(x) c(mean = mean(x), n = length(x)))
#>   remote salary.mean salary.n
#> 1  FALSE    97350.00     2.00
#> 2   TRUE    78100.00     3.00
```

The `~` is formula syntax: "compute this on the left, grouped by that on the right." You can supply any function, `sum`, `median`, `sd`, or a custom one. For heavier aggregation work you'll eventually reach for `dplyr::group_by()` + `summarise()`, but `aggregate()` is perfect when you want zero dependencies.

> [NOTE]
> `aggregate()` drops rows where the grouping column is `NA`. If you need to keep them, convert `NA` to a sentinel string first.

**Try it:** Compute the maximum salary grouped by `remote`.

```r title="Exercise: Max salary by remote"
aggregate(salary ~ remote, data = employees, FUN = ___)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Max salary by remote solution"
aggregate(salary ~ remote, data = employees, FUN = max)
#>   remote salary
#> 1  FALSE  95000
#> 2   TRUE  78000
```

The formula `salary ~ remote` says "compute on salary, split by remote", and passing `max` as `FUN` applies it to each group. David (non-remote) has the highest overall salary at 95000, while Eve tops the remote group at 78000.
</details>

## Practice Exercises

### Exercise 1: Top earners by department

Build a data frame of 8 employees across 3 departments, then return the top earner in each.

```r title="Exercise: Top earner per department"
df <- data.frame(
  name = c("A","B","C","D","E","F","G","H"),
  dept = c("eng","eng","sales","sales","sales","hr","hr","eng"),
  pay  = c(90, 110, 75, 82, 68, 72, 78, 120)
)
# return top earner per dept
```

<details>
<summary>Show solution</summary>

```r title="Top earner per department solution"
top <- do.call(rbind, by(df, df$dept, function(g) g[which.max(g$pay), ]))
top
#>       name  dept pay
#> eng      H   eng 120
#> hr       G    hr  78
#> sales    B sales  82
```
</details>

### Exercise 2: Filter and summarize

From `mtcars`, return the mean `mpg` for 4-cylinder cars weighing under 2.5.

<details>
<summary>Show solution</summary>

```r title="Mean mpg for light 4-cyl cars"
mean(mtcars[mtcars$cyl == 4 & mtcars$wt < 2.5, "mpg"])
#> [1] 28.01429
```
</details>

### Exercise 3: Add a categorical column

Add a column `mpg_class` to `mtcars`: "low" if mpg < 18, "mid" if 18-25, "high" if > 25. Then count the rows in each class.

<details>
<summary>Show solution</summary>

```r title="Bin mpg into classes with cut"
mtcars$mpg_class <- cut(mtcars$mpg,
                        breaks = c(-Inf, 18, 25, Inf),
                        labels = c("low", "mid", "high"))
table(mtcars$mpg_class)
#> 
#>  low  mid high 
#>   12   14    6
```
</details>

## Putting It All Together

A complete mini-analysis on `iris`, load it, inspect, filter, add a derived column, sort, and summarize by species.

```r title="End-to-end iris analysis pipeline"
data(iris)
str(iris)
#> 'data.frame':   150 obs. of  5 variables:
#>  $ Sepal.Length: num  5.1 4.9 4.7 4.6 5 5.4 4.6 5 4.4 4.9 ...
#>  $ Sepal.Width : num  3.5 3 3.2 3.1 3.6 3.9 3.4 3.4 2.9 3.1 ...
#>  $ Petal.Length: num  1.4 1.4 1.3 1.5 1.4 1.7 1.4 1.5 1.4 1.5 ...
#>  $ Petal.Width : num  0.2 0.2 0.2 0.2 0.2 0.4 0.2 0.2 0.2 0.1 ...
#>  $ Species     : Factor w/ 3 levels "setosa","versicolor",..: 1 1 1 1 1 1 1 1 1 1

big <- iris[iris$Sepal.Length > 6, ]
nrow(big)
#> [1] 61

big$petal_ratio <- big$Petal.Length / big$Petal.Width
aggregate(petal_ratio ~ Species, data = big, FUN = mean)
#>      Species petal_ratio
#> 1 versicolor    3.242105
#> 2  virginica    2.782927

head(big[order(-big$petal_ratio), c("Species", "petal_ratio")], 3)
#>       Species petal_ratio
#> 58 versicolor    4.071429
#> 80 versicolor    3.846154
#> 91 versicolor    3.818182
```

Five operations, five lines, and every single one is a base-R idiom you'll reach for daily.

## Summary

| Operation | Syntax |
|-----------|--------|
| Create | `data.frame(col1 = ..., col2 = ...)` |
| Inspect | `str()`, `dim()`, `head()`, `summary()` |
| Select column | `df$col`, `df[["col"]]`, `df[, "col"]` |
| Filter rows | `df[df$col > 5, ]`, don't forget the comma |
| Add column | `df$new <- ...` |
| Drop column | `df$col <- NULL` |
| Sort | `df[order(df$col), ]` |
| Group summary | `aggregate(y ~ g, data = df, FUN = mean)` |

## References

1. [R Language Definition, Data Frames](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Data-frame-objects)
2. [Advanced R, Data Frames](https://adv-r.hadley.nz/vectors-chap.html#tibble) by Hadley Wickham
3. [R for Data Science](https://r4ds.hadley.nz/), modern tidyverse perspective on tables
4. [Base R Cheat Sheet (RStudio)](https://rstudio.github.io/cheatsheets/base-r.pdf)
5. [An Introduction to R, Chapter 6: Lists and data frames](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Lists-and-data-frames)

## Continue Learning

- [R Lists: When Data Frames Aren't Flexible Enough](R-Lists.html), the more flexible cousin of data frames.
- [R Vectors: The Foundation of Everything in R](R-Vectors.html), understand the columns that data frames are built from.
- [R Data Types: Which Type Is Your Variable?](R-Data-Types.html), know the types each column can hold.
