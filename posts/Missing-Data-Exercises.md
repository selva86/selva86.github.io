---
title: "Missing Data in R Exercises: 10 NA Detection & Imputation Problems"
slug: "Missing-Data-Exercises"
description: "10 missing data exercises: detect NAs, count patterns, remove incomplete rows, impute with mean/median, and use coalesce. Interactive R solutions."
keywords: "missing data exercises R, NA exercises, imputation practice, is.na exercises, complete.cases practice"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.6"
post_type: "EX"
sidebar_text: "Missing Data (10 problems)"
auto_link_terms: "missing data exercises|NA exercises|imputation exercises"
auto_link_case_sensitive: false
fr_parent: "Handling-NA-in-R.html"
---

# Missing Data in R Exercises: 10 NA Detection & Imputation Problems

<p class="lead">10 exercises on handling missing values: detect with <code>is.na()</code>, count patterns, remove with <code>na.omit()</code>/<code>drop_na()</code>, impute with mean/median/group, and use <code>coalesce()</code>.</p>

### Exercise 1: Count NAs per Column

```r
df <- data.frame(a=c(1,NA,3,NA,5), b=c(NA,2,NA,4,NA), c=c(1,2,3,4,5), d=c(NA,NA,NA,4,5))
# Count NAs per column and total

```

<details><summary>Click to reveal solution</summary>

```r
df <- data.frame(a=c(1,NA,3,NA,5), b=c(NA,2,NA,4,NA), c=c(1,2,3,4,5), d=c(NA,NA,NA,4,5))
cat("Per column:\n"); print(sapply(df, function(x) sum(is.na(x))))
cat("\nTotal:", sum(is.na(df)), "\n")
cat("Complete rows:", sum(complete.cases(df)), "\n")
```
</details>

### Exercise 2: Remove Rows with Any NA

```r
df <- data.frame(x=c(1,NA,3,4,NA), y=c("a","b",NA,"d","e"))
# Keep only complete rows

```

<details><summary>Click to reveal solution</summary>

```r
df <- data.frame(x=c(1,NA,3,4,NA), y=c("a","b",NA,"d","e"), stringsAsFactors=FALSE)
na.omit(df)
```
</details>

### Exercise 3: Remove NAs in Specific Column Only

```r
library(tidyr)
df <- data.frame(name=c("A",NA,"C","D"), score=c(88,92,NA,76))
# Keep rows where score is not NA (even if name is NA)

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(name=c("A",NA,"C","D"), score=c(88,92,NA,76))
drop_na(df, score)
```
</details>

### Exercise 4: Replace NA with Mean

```r
x <- c(10, NA, 30, NA, 50, 20, NA)
# Replace NAs with the mean of non-NA values

```

<details><summary>Click to reveal solution</summary>

```r
x <- c(10, NA, 30, NA, 50, 20, NA)
x[is.na(x)] <- mean(x, na.rm = TRUE)
cat("Filled:", round(x, 1), "\n")
```
</details>

### Exercise 5: Group-Wise Imputation

```r
library(dplyr)
df <- data.frame(group=c("A","A","A","B","B","B"), value=c(10,NA,12,20,NA,22))
# Replace NAs with the group mean

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
df <- data.frame(group=c("A","A","A","B","B","B"), value=c(10,NA,12,20,NA,22))
df |> group_by(group) |> mutate(value = ifelse(is.na(value), mean(value, na.rm=TRUE), value)) |> ungroup()
```
</details>

### Exercise 6: coalesce from Multiple Sources

```r
library(dplyr)
primary <- c(NA, 2, NA, 4, NA)
backup <- c(10, NA, 30, NA, 50)
fallback <- c(100, 200, 300, 400, 500)
# Get the first non-NA from primary, then backup, then fallback

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
primary <- c(NA, 2, NA, 4, NA)
backup <- c(10, NA, 30, NA, 50)
fallback <- c(100, 200, 300, 400, 500)
coalesce(primary, backup, fallback)
```
</details>

### Exercise 7: replace_na with Different Values per Column

```r
library(tidyr)
df <- data.frame(name=c("A",NA,"C"), score=c(NA,85,NA), grade=c("B",NA,"A"))
# Replace: name→"Unknown", score→0, grade→"N/A"

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(name=c("A",NA,"C"), score=c(NA,85,NA), grade=c("B",NA,"A"), stringsAsFactors=FALSE)
replace_na(df, list(name = "Unknown", score = 0, grade = "N/A"))
```
</details>

### Exercise 8: Find Rows Where ALL Values Are NA

```r
df <- data.frame(a=c(NA,1,NA), b=c(NA,2,3), c=c(NA,NA,4))
# Find and remove rows where every column is NA

```

<details><summary>Click to reveal solution</summary>

```r
df <- data.frame(a=c(NA,1,NA), b=c(NA,2,3), c=c(NA,NA,4))
all_na <- rowSums(!is.na(df)) == 0
cat("All-NA rows:", which(all_na), "\n")
df[!all_na, ]
```
</details>

### Exercise 9: NA-Safe Calculations

```r
df <- data.frame(x=c(1,NA,3,4,NA), y=c(NA,2,3,NA,5))
# Calculate row sums and row means, ignoring NAs

```

<details><summary>Click to reveal solution</summary>

```r
df <- data.frame(x=c(1,NA,3,4,NA), y=c(NA,2,3,NA,5))
df$row_sum <- rowSums(df, na.rm = TRUE)
df$row_mean <- rowMeans(df[,1:2], na.rm = TRUE)
print(df)
```
</details>

### Exercise 10: Forward Fill (LOCF)

```r
library(tidyr)
df <- data.frame(date=1:6, value=c(10,NA,NA,20,NA,30))
# Fill NAs with the last observed value

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(date=1:6, value=c(10,NA,NA,20,NA,30))
fill(df, value, .direction = "down")
```
</details>

## What's Next?

- [Handling NA in R](/Handling-NA-in-R.html) — complete missing data guide
- [Tidy Data](/Tidy-Data-in-R.html) — structure data before cleaning
