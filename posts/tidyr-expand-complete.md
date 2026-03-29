---
title: "tidyr expand() & complete(): Make Implicit Missing Values Explicit"
slug: "tidyr-expand-complete"
description: "Use tidyr complete() to fill in missing combinations and expand() to generate all possible value combinations. Handle implicit NAs in panel data."
keywords: "tidyr complete, tidyr expand, implicit missing values, fill missing combinations R, panel data R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-tidy-2"
post_type: "FR"
auto_link_terms: "tidyr complete|tidyr expand|implicit missing values|complete()"
auto_link_case_sensitive: false
fr_parent: "Tidy-Data-in-R.html"
---

# tidyr expand() & complete(): Make Implicit Missing Values Explicit

<p class="lead"><code>complete()</code> turns implicit missing values into explicit <code>NA</code> rows. <code>expand()</code> generates all combinations of specified variables. Essential for panel data and time series.</p>

## The Problem: Implicit Missing Values

```r
library(tidyr)
# Sales data — March is missing for Product B
sales <- data.frame(
  product = c("A","A","A","B","B"),
  month = c("Jan","Feb","Mar","Jan","Mar"),
  revenue = c(100,120,110,200,180)
)
print(sales)
cat("\nProduct B has no Feb row — it's implicitly missing\n")
```

## complete(): Fill Missing Combinations

```r
library(tidyr)
sales <- data.frame(
  product = c("A","A","A","B","B"),
  month = c("Jan","Feb","Mar","Jan","Mar"),
  revenue = c(100,120,110,200,180)
)

# Make the missing B-Feb combination explicit
complete(sales, product, month, fill = list(revenue = 0))
```

## expand(): All Combinations

```r
library(tidyr)

# Generate all product-month combinations (no data needed)
expand(data.frame(), product = c("A","B"), month = c("Jan","Feb","Mar"))
```

## nesting(): Only Observed Combinations

```r
library(tidyr)
df <- data.frame(group=c("A","A","B"), x=c(1,2,3), y=c(10,20,30))

# expand with nesting keeps only combinations that exist
expand(df, nesting(group, x), y = 1:2)
```

## Practice Exercises

### Exercise 1: Complete Time Series

Fill in missing dates with 0 sales.

```r
library(tidyr)
daily <- data.frame(date=as.Date(c("2026-03-01","2026-03-03","2026-03-05")), sales=c(50,70,60))
# Add rows for Mar 02 and Mar 04 with sales = 0

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
daily <- data.frame(date=as.Date(c("2026-03-01","2026-03-03","2026-03-05")), sales=c(50,70,60))
complete(daily, date = seq(as.Date("2026-03-01"), as.Date("2026-03-05"), by = "day"), fill = list(sales = 0))
```
</details>

## FAQ

### When should I use complete() vs expand()?

`complete()` adds missing rows to an existing data frame. `expand()` generates combinations from scratch (useful for creating lookup tables or grids).

## What's Next?

- [Tidy Data](/Tidy-Data-in-R.html) — parent tutorial on tidy principles
- [Handling NA](/Handling-NA-in-R.html) — work with the NAs that complete() creates
