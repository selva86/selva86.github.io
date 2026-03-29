---
title: "Handling NA in R: Detect, Count, Remove & Impute Missing Values"
slug: "Handling-NA-in-R"
description: "Complete guide to missing values in R: detect NAs with is.na(), count, remove with na.omit/drop_na, impute with mean/median, and visualize patterns."
keywords: "NA in R, missing values R, is.na, na.omit, drop_na, impute missing values, na.rm, complete.cases"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.9"
post_type: "C"
sidebar_text: "Handling NA"
curriculum_path: "/data-wrangling/tidyr/"
auto_link_terms: "handling NA|missing values|is.na|na.omit|drop_na|impute missing"
auto_link_case_sensitive: false
---

# Handling NA in R: Detect, Count, Remove & Impute Missing Values

<p class="lead">Missing values (<code>NA</code>) break calculations, distort plots, and crash models. This tutorial covers every tool for detecting, counting, removing, and imputing NAs in R.</p>

## Detect: is.na()

```r
x <- c(1, NA, 3, NA, 5)
is.na(x)
cat("Any NA?", anyNA(x), "\n")
cat("Which positions?", which(is.na(x)), "\n")
```

## Count NAs

```r
df <- data.frame(a = c(1,NA,3,NA,5), b = c(NA,2,NA,4,5), c = c(1,2,3,4,5))

cat("Per column:\n")
sapply(df, function(x) sum(is.na(x)))

cat("\nTotal NAs:", sum(is.na(df)), "\n")
cat("Complete rows:", sum(complete.cases(df)), "of", nrow(df), "\n")
```

## Remove NAs

```r
# Vector: remove NAs
x <- c(1, NA, 3, NA, 5)
cat("na.omit:", na.omit(x), "\n")
cat("x[!is.na(x)]:", x[!is.na(x)], "\n")
```

```r
# Data frame: remove rows with ANY NA
df <- data.frame(a=c(1,NA,3,NA,5), b=c(NA,2,NA,4,5))

cat("na.omit (drop rows with any NA):\n")
print(na.omit(df))

cat("\ncomplete.cases:\n")
print(df[complete.cases(df), ])
```

```r
# tidyr::drop_na — more flexible
library(tidyr)
df <- data.frame(a=c(1,NA,3,NA,5), b=c(NA,2,NA,4,5), c=c(1,2,3,4,5))

cat("Drop rows with NA in column 'a' only:\n")
drop_na(df, a)
```

## na.rm in Functions

```r
x <- c(10, NA, 30, NA, 50)
cat("mean(x):", mean(x), "\n")           # NA
cat("mean(x, na.rm=TRUE):", mean(x, na.rm = TRUE), "\n")  # 30
cat("sum(x, na.rm=TRUE):", sum(x, na.rm = TRUE), "\n")    # 90
```

## Replace and Impute

```r
# Replace NA with a fixed value
x <- c(1, NA, 3, NA, 5)
x[is.na(x)] <- 0
cat("Replaced with 0:", x, "\n")

# Replace with mean
x <- c(10, NA, 30, NA, 50)
x[is.na(x)] <- mean(x, na.rm = TRUE)
cat("Replaced with mean:", x, "\n")
```

```r
# tidyr::replace_na
library(tidyr)
df <- data.frame(a=c(1,NA,3), b=c(NA,"x","y"))
replace_na(df, list(a = 0, b = "unknown"))
```

```r
# dplyr: conditional imputation per group
library(dplyr)
df <- data.frame(group=c("A","A","B","B"), value=c(10,NA,20,NA))

df |>
  group_by(group) |>
  mutate(value_filled = ifelse(is.na(value), mean(value, na.rm=TRUE), value)) |>
  ungroup()
```

## Coalesce: First Non-NA

```r
library(dplyr)
x <- c(NA, NA, 3, NA, 5)
y <- c(10, NA, 30, 40, NA)
z <- c(100, 200, 300, 400, 500)

coalesce(x, y, z)
```

## Practice Exercises

### Exercise 1: Clean a Messy Dataset

Count NAs, impute numeric columns with median, fill character columns with "Unknown".

```r
df <- data.frame(name=c("Alice",NA,"Carol","David",NA), score=c(88,NA,92,NA,76), grade=c("A",NA,"A","B",NA))

```

<details><summary>Click to reveal solution</summary>

```r
df <- data.frame(name=c("Alice",NA,"Carol","David",NA), score=c(88,NA,92,NA,76),
                 grade=c("A",NA,"A","B",NA), stringsAsFactors=FALSE)

cat("NAs per column:", sapply(df, function(x) sum(is.na(x))), "\n\n")

df$score[is.na(df$score)] <- median(df$score, na.rm = TRUE)
df$name[is.na(df$name)] <- "Unknown"
df$grade[is.na(df$grade)] <- "Unknown"
print(df)
```
</details>

## Summary

| Task | Function |
|------|----------|
| Detect | `is.na(x)`, `anyNA(x)`, `which(is.na(x))` |
| Count | `sum(is.na(x))`, `complete.cases(df)` |
| Remove | `na.omit(df)`, `drop_na(df, col)` |
| Replace | `x[is.na(x)] <- value`, `replace_na(df, list(...))` |
| Ignore in functions | `mean(x, na.rm = TRUE)` |
| First non-NA | `coalesce(x, y, z)` |

## FAQ

### Why does mean(c(1, NA, 3)) return NA?

By design — NA means "unknown". The mean of 1, unknown, and 3 is unknown. Add `na.rm = TRUE` to exclude NAs from the calculation.

### What's the difference between NA, NULL, and NaN?

`NA` = missing value (placeholder). `NULL` = absence of a value (empty). `NaN` = result of undefined math (0/0). Each behaves differently in functions and subsetting.

## What's Next?

- [Tidy Data](/Tidy-Data-in-R.html) — reshape before cleaning
- [pivot_longer & wider](/pivot-longer-wider.html) — reshaping often reveals hidden NAs
- [dplyr filter & select](/dplyr-filter-select.html) — filter out incomplete rows
