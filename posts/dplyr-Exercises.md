---
title: "dplyr Exercises: 15 Data Manipulation Practice Problems (With Solutions)"
slug: "dplyr-Exercises"
description: "15 dplyr exercises covering filter, select, mutate, group_by, summarise, arrange, joins, and across. Interactive solutions with mtcars and iris."
keywords: "dplyr exercises, dplyr practice, data manipulation exercises R, tidyverse exercises, dplyr problems"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.1"
post_type: "EX"
sidebar_text: "dplyr (15 problems)"
auto_link_terms: "dplyr exercises|dplyr practice problems|data manipulation exercises"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
---

# dplyr Exercises: 15 Data Manipulation Practice Problems

<p class="lead">Practice all core dplyr verbs with 15 exercises: filter, select, mutate, group_by, summarise, arrange, joins, and across. Each has an interactive solution you can run.</p>

## Easy (1-5)

### Exercise 1: Filter and Select
Find all 4-cylinder cars with mpg > 25. Show mpg, cyl, hp, wt.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(cyl == 4, mpg > 25) |> select(mpg, cyl, hp, wt)
```
</details>

### Exercise 2: Mutate and Arrange
Add a power-to-weight column (hp/wt), sort descending.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> mutate(pwr = round(hp/wt, 1)) |> arrange(desc(pwr)) |> select(mpg, hp, wt, pwr) |> head(8)
```
</details>

### Exercise 3: Group and Summarise
Mean mpg, mean hp, and count per cylinder group.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> group_by(cyl) |> summarise(n=n(), avg_mpg=round(mean(mpg),1), avg_hp=round(mean(hp),0), .groups="drop")
```
</details>

### Exercise 4: Count with Proportion
Count iris flowers per Species, add percentage.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> count(Species) |> mutate(pct = round(n/sum(n)*100, 1))
```
</details>

### Exercise 5: Rename to snake_case
Convert iris column names to snake_case, move Species first.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> rename_with(~ tolower(gsub("\\.", "_", .x))) |> select(species, everything()) |> head(4)
```
</details>

## Medium (6-10)

### Exercise 6: Above-Average Filter
Cars with above-average mpg AND below-average weight.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(mpg > mean(mpg), wt < mean(wt)) |> select(mpg, hp, wt) |> arrange(desc(mpg))
```
</details>

### Exercise 7: Grouped Ranking
Rank cars by mpg within each cyl group (best = 1). Show top 3 per group.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> mutate(car=rownames(mtcars)) |> group_by(cyl) |> mutate(rank=rank(-mpg)) |> filter(rank<=3) |> select(car,cyl,mpg,rank) |> arrange(cyl,rank) |> ungroup()
```
</details>

### Exercise 8: across() Summary
Per Species: mean and sd of all numeric columns.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> group_by(Species) |> summarise(across(where(is.numeric), list(mean=~round(mean(.x),2), sd=~round(sd(.x),2)), .names="{.col}_{.fn}"), .groups="drop")
```
</details>

### Exercise 9: case_when Categories
Label cars: mpg>25 "Economy", 15-25 "Standard", <15 "Gas Guzzler".

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> mutate(type=case_when(mpg>25~"Economy", mpg>=15~"Standard", TRUE~"Gas Guzzler")) |> count(type, sort=TRUE)
```
</details>

### Exercise 10: Join Two Tables
Join employees with departments. Find unassigned employees.

```r
library(dplyr)
employees <- data.frame(name=c("Alice","Bob","Carol","David"), dept=c("Eng","Mkt","Eng","HR"))
departments <- data.frame(dept=c("Eng","Mkt","Sales"), budget=c(500,300,200))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
employees <- data.frame(name=c("Alice","Bob","Carol","David"), dept=c("Eng","Mkt","Eng","HR"))
departments <- data.frame(dept=c("Eng","Mkt","Sales"), budget=c(500,300,200))

cat("All employees + budgets:\n")
left_join(employees, departments, by="dept")
cat("\nUnassigned:\n")
anti_join(employees, departments, by="dept")
```
</details>

## Hard (11-15)

### Exercise 11: Top N Per Group
2 heaviest cars per cylinder group.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> mutate(car=rownames(mtcars)) |> group_by(cyl) |> slice_max(wt, n=2) |> select(car,cyl,wt,mpg) |> ungroup()
```
</details>

### Exercise 12: Percentage of Group Total
Each car's hp as % of its cyl group's total hp.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> mutate(car=rownames(mtcars)) |> group_by(cyl) |> mutate(hp_pct=round(hp/sum(hp)*100,1)) |> select(car,cyl,hp,hp_pct) |> arrange(cyl,desc(hp_pct)) |> ungroup() |> head(10)
```
</details>

### Exercise 13: Multi-Step Pipeline
Manual cars → add kpl → group by cyl → mean kpl → sort desc.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(am==1) |> mutate(kpl=round(mpg*0.425,2)) |> group_by(cyl) |> summarise(n=n(), avg_kpl=round(mean(kpl),2), .groups="drop") |> arrange(desc(avg_kpl))
```
</details>

### Exercise 14: Conditional Summary
Per iris Species: count, flag if mean Sepal.Length > 6.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> group_by(Species) |> summarise(n=n(), avg_sl=round(mean(Sepal.Length),2), long=mean(Sepal.Length)>6, .groups="drop")
```
</details>

### Exercise 15: Stratified 30% Sample
Random 30% from each Species. Count per group.

```r
library(dplyr)
set.seed(42)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
set.seed(42)
iris |> group_by(Species) |> slice_sample(prop=0.3) |> ungroup() |> count(Species)
```
</details>

## What's Next?

- [dplyr filter & select](/dplyr-filter-select.html) — review fundamentals
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — grouped operations
- [R Joins](/R-Joins.html) — combining data frames
