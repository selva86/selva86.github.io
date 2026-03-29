---
title: "tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems"
slug: "tidyr-Reshaping-Exercises"
description: "10 tidyr exercises on pivot_longer, pivot_wider, separate, unite, and complete. Practice reshaping wide/long data with interactive solutions."
keywords: "tidyr exercises, pivot_longer exercises, pivot_wider practice, reshape exercises R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.5"
post_type: "EX"
sidebar_text: "tidyr Reshaping (10 problems)"
auto_link_terms: "tidyr exercises|reshaping exercises|pivot exercises"
auto_link_case_sensitive: false
fr_parent: "Tidy-Data-in-R.html"
---

# tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems

<p class="lead">10 exercises on <code>pivot_longer()</code>, <code>pivot_wider()</code>, <code>separate()</code>, <code>unite()</code>, and <code>complete()</code>. Practice reshaping data between wide and long formats.</p>

### Exercise 1: Basic pivot_longer
Reshape this grades table from wide to long.

```r
library(tidyr)
grades <- data.frame(student=c("Alice","Bob"), math=c(92,76), english=c(88,82), science=c(95,79))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
grades <- data.frame(student=c("Alice","Bob"), math=c(92,76), english=c(88,82), science=c(95,79))
pivot_longer(grades, cols = -student, names_to = "subject", values_to = "score")
```
</details>

### Exercise 2: Basic pivot_wider
Convert this long format to wide.

```r
library(tidyr)
sales <- data.frame(product=rep(c("A","B"),each=3), quarter=rep(c("Q1","Q2","Q3"),2), revenue=c(100,120,110,200,220,180))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
sales <- data.frame(product=rep(c("A","B"),each=3), quarter=rep(c("Q1","Q2","Q3"),2), revenue=c(100,120,110,200,220,180))
pivot_wider(sales, names_from = quarter, values_from = revenue)
```
</details>

### Exercise 3: separate a Column
Split "first_last" into two columns.

```r
library(tidyr)
df <- data.frame(id=1:3, name=c("Alice_Smith","Bob_Jones","Carol_Lee"))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(id=1:3, name=c("Alice_Smith","Bob_Jones","Carol_Lee"))
separate(df, name, into = c("first","last"), sep = "_")
```
</details>

### Exercise 4: unite Columns
Combine year, month, day into a date string.

```r
library(tidyr)
df <- data.frame(year=c(2026,2026), month=c(3,4), day=c(15,20))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(year=c(2026,2026), month=c(3,4), day=c(15,20))
unite(df, "date", year, month, day, sep = "-")
```
</details>

### Exercise 5: complete Missing Combinations
Fill in missing month-product combinations.

```r
library(tidyr)
sales <- data.frame(product=c("A","A","B"), month=c(1,2,1), qty=c(50,60,70))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
sales <- data.frame(product=c("A","A","B"), month=c(1,2,1), qty=c(50,60,70))
complete(sales, product, month, fill = list(qty = 0))
```
</details>

### Exercise 6: pivot_longer with names_prefix

```r
library(tidyr)
df <- data.frame(id=1:2, score_2020=c(80,85), score_2021=c(82,88), score_2022=c(85,90))
# Remove "score_" prefix and make year numeric

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(id=1:2, score_2020=c(80,85), score_2021=c(82,88), score_2022=c(85,90))
pivot_longer(df, cols=-id, names_to="year", values_to="score", names_prefix="score_", names_transform=list(year=as.integer))
```
</details>

### Exercise 7: pivot_wider with Multiple Values

```r
library(tidyr)
df <- data.frame(name=rep(c("A","B"),each=2), stat=rep(c("mean","sd"),2), value=c(10,2,20,3))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(name=rep(c("A","B"),each=2), stat=rep(c("mean","sd"),2), value=c(10,2,20,3))
pivot_wider(df, names_from = stat, values_from = value)
```
</details>

### Exercise 8: Round-Trip Reshape

Pivot mtcars to long, then back to wide. Verify it matches the original.

```r
library(tidyr)
library(dplyr)
df <- mtcars[1:3, 1:3]
df$car <- rownames(mtcars)[1:3]

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr); library(dplyr)
df <- mtcars[1:3, 1:3]; df$car <- rownames(mtcars)[1:3]
long <- pivot_longer(df, cols = -car, names_to = "metric", values_to = "value")
wide <- pivot_wider(long, names_from = metric, values_from = value)
cat("Round-trip matches:", all.equal(df[,c("car","mpg","cyl","disp")], wide[,c("car","mpg","cyl","disp")]), "\n")
print(wide)
```
</details>

### Exercise 9: separate + pivot

Split a "year-quarter" column, then pivot quarters wide.

```r
library(tidyr)
df <- data.frame(period=c("2025-Q1","2025-Q2","2026-Q1","2026-Q2"), sales=c(100,120,130,150))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(period=c("2025-Q1","2025-Q2","2026-Q1","2026-Q2"), sales=c(100,120,130,150))
df |> separate(period, into=c("year","quarter"), sep="-") |> pivot_wider(names_from=quarter, values_from=sales)
```
</details>

### Exercise 10: Complete + Fill

Complete a time series and fill NAs with the previous value.

```r
library(tidyr)
df <- data.frame(date=as.Date(c("2026-03-01","2026-03-03","2026-03-06")), value=c(10,20,30))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(date=as.Date(c("2026-03-01","2026-03-03","2026-03-06")), value=c(10,20,30))
df |> complete(date = seq(min(date), max(date), by="day")) |> fill(value, .direction="down")
```
</details>

## What's Next?

- [Tidy Data](/Tidy-Data-in-R.html) — tidy data principles
- [pivot_longer & wider](/pivot-longer-wider.html) — in-depth reshaping guide
