---
title: "data.table Exercises: 12 High-Performance Data Manipulation Problems"
slug: "data-table-Exercises"
description: "12 data.table exercises covering DT[i,j,by] syntax, := assignment, .SD, keys, joins, and reshaping. Interactive solutions for fast R data work."
keywords: "data.table exercises, data.table practice, DT syntax exercises, R data.table problems"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.7"
post_type: "EX"
sidebar_text: "data.table (12 problems)"
auto_link_terms: "data.table exercises|DT syntax exercises"
auto_link_case_sensitive: false
fr_parent: "data-table-vs-dplyr.html"
---

# data.table Exercises: 12 High-Performance Data Manipulation Problems

<p class="lead">12 exercises on data.table's <code>DT[i, j, by]</code> syntax: filtering, column operations, <code>:=</code> assignment, <code>.SD</code>, grouping, keys, and joins.</p>

### Exercise 1: Filter Rows

Get all 6-cylinder cars from mtcars using data.table syntax.

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")
dt[cyl == 6, .(car, mpg, hp)]
```

</details>

### Exercise 2: Select and Compute

Calculate kpl (mpg * 0.425) for cars with mpg > 20.

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")
dt[mpg > 20, .(car, mpg, kpl = round(mpg * 0.425, 2))]
```

</details>

### Exercise 3: Group By

Average mpg and hp per cylinder group.

```r
library(data.table)
dt <- as.data.table(mtcars)

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars)
dt[, .(avg_mpg = round(mean(mpg), 1), avg_hp = round(mean(hp), 0), n = .N), by = cyl][order(cyl)]
```

</details>

### Exercise 4: := Assignment

Add a column "efficiency" (mpg/wt) to the data.table in place.

```r
library(data.table)
dt <- as.data.table(mtcars)

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars)
dt[, efficiency := round(mpg / wt, 2)]
head(dt[, .(mpg, wt, efficiency)])
```

</details>

### Exercise 5: Chained Operations

Filter to 4-cyl, compute mean mpg by gear, sort descending.

```r
library(data.table)
dt <- as.data.table(mtcars)

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars)
dt[cyl == 4, .(avg_mpg = round(mean(mpg), 1)), by = gear][order(-avg_mpg)]
```

</details>

### Exercise 6: .SD (Subset of Data)

Apply mean to all numeric columns by cyl group.

```r
library(data.table)
dt <- as.data.table(mtcars)

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars)
dt[, lapply(.SD, mean), by = cyl, .SDcols = c("mpg", "hp", "wt")][, lapply(.SD, round, 1)]
```

</details>

### Exercise 7: Count and Proportion

Count per (cyl, am) and add percentage.

```r
library(data.table)
dt <- as.data.table(mtcars)

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars)
result <- dt[, .N, by = .(cyl, am)]
result[, pct := round(N / sum(N) * 100, 1)]
print(result[order(cyl, am)])
```

</details>

### Exercise 8: Top N Per Group

Top 2 most fuel-efficient cars per cyl group.

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")
dt[order(-mpg), head(.SD, 2), by = cyl][, .(car, cyl, mpg)]
```

</details>

### Exercise 9: data.table Join

Join employees with departments.

```r
library(data.table)
emp <- data.table(name=c("Alice","Bob","Carol","David"), dept_id=c(1,2,1,3))
dept <- data.table(dept_id=c(1,2,4), dept_name=c("Eng","Mkt","Sales"))

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
emp <- data.table(name=c("Alice","Bob","Carol","David"), dept_id=c(1,2,1,3))
dept <- data.table(dept_id=c(1,2,4), dept_name=c("Eng","Mkt","Sales"))
dept[emp, on = "dept_id"]  # Right join (all employees)
```

</details>

### Exercise 10: Multiple := in One Step

Add rank_mpg and z_mpg columns in a single operation.

```r
library(data.table)
dt <- as.data.table(mtcars)

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars)
dt[, c("rank_mpg", "z_mpg") := .(rank(-mpg), round((mpg - mean(mpg)) / sd(mpg), 2))]
head(dt[order(rank_mpg), .(mpg, rank_mpg, z_mpg)])
```

</details>

### Exercise 11: Conditional Update

Set hp to NA for cars with mpg > 30.

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")
dt[mpg > 30, hp := NA]
dt[mpg > 25, .(car, mpg, hp)]
```

</details>

### Exercise 12: Reshape Wide to Long

Pivot mtcars columns mpg, hp, wt to long format.

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")

```

<details><summary>Click to reveal solution</summary>

```r
library(data.table)
dt <- as.data.table(mtcars, keep.rownames = "car")
long <- melt(dt, id.vars = "car", measure.vars = c("mpg", "hp", "wt"), variable.name = "metric", value.name = "value")
head(long, 9)
```

</details>

## What's Next?

- [data.table vs dplyr](/data-table-vs-dplyr.html) — syntax and performance comparison
- [dplyr Exercises](/dplyr-Exercises.html) — equivalent exercises in dplyr
