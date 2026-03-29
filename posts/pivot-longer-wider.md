---
title: "pivot_longer & pivot_wider in R: Reshape Wide to Long Format (+ Examples)"
slug: "pivot-longer-wider"
description: "Master tidyr pivot_longer() and pivot_wider() to reshape R data frames between wide and long formats. 10 real examples with names_to and values_to."
keywords: "pivot_longer, pivot_wider, reshape R, wide to long R, tidyr reshape, gather spread R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.8"
post_type: "C"
sidebar_text: "pivot_longer & wider"
curriculum_path: "/data-wrangling/tidyr/"
auto_link_terms: "pivot_longer|pivot_wider|reshape|wide to long|long to wide"
auto_link_case_sensitive: false
---

# pivot_longer & pivot_wider in R: Reshape Wide to Long Format

<p class="lead"><code>pivot_longer()</code> stacks columns into rows (wide → long). <code>pivot_wider()</code> spreads rows into columns (long → wide). These are the two most important tidyr functions for reshaping data.</p>

## pivot_longer: Wide to Long

```r
library(tidyr)
wide <- data.frame(name=c("Alice","Bob","Carol"), jan=c(100,120,90), feb=c(110,130,95), mar=c(105,125,100))
cat("Wide:\n"); print(wide)

long <- pivot_longer(wide, cols = jan:mar, names_to = "month", values_to = "sales")
cat("\nLong:\n"); print(long)
```

### Advanced: names_prefix and names_transform

```r
library(tidyr)
df <- data.frame(id=1:3, score_2020=c(80,85,90), score_2021=c(82,88,92), score_2022=c(85,90,95))

pivot_longer(df, cols = -id, names_to = "year", values_to = "score",
             names_prefix = "score_", names_transform = list(year = as.integer))
```

### Multiple Value Columns

```r
library(tidyr)
df <- data.frame(id=1:2, x_min=c(1,5), x_max=c(10,15), y_min=c(2,6), y_max=c(20,25))

pivot_longer(df, cols = -id, names_to = c("axis", ".value"), names_sep = "_")
```

## pivot_wider: Long to Wide

```r
library(tidyr)
long <- data.frame(student=rep(c("Alice","Bob"),each=3), subject=rep(c("Math","Eng","Sci"),2),
                   score=c(92,88,95,76,82,79))

pivot_wider(long, names_from = subject, values_from = score)
```

### Multiple Value Columns

```r
library(tidyr)
df <- data.frame(name=rep(c("A","B"),each=2), metric=rep(c("height","weight"),2),
                 value=c(170,65,180,80), unit=c("cm","kg","cm","kg"))

pivot_wider(df, names_from = metric, values_from = c(value, unit))
```

## Practice Exercises

### Exercise 1: Quarterly Data

Reshape this wide quarterly data to long format.

```r
library(tidyr)
revenue <- data.frame(product=c("X","Y"), Q1=c(500,300), Q2=c(550,320), Q3=c(600,350), Q4=c(700,400))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
revenue <- data.frame(product=c("X","Y"), Q1=c(500,300), Q2=c(550,320), Q3=c(600,350), Q4=c(700,400))
pivot_longer(revenue, cols = -product, names_to = "quarter", values_to = "revenue")
```
</details>

### Exercise 2: Survey to Wide

Convert this tidy survey data to a wide crosstab.

```r
library(tidyr)
survey <- data.frame(person=rep(c("A","B","C"),each=2), question=rep(c("Q1","Q2"),3), answer=c(5,4,3,5,4,3))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
survey <- data.frame(person=rep(c("A","B","C"),each=2), question=rep(c("Q1","Q2"),3), answer=c(5,4,3,5,4,3))
pivot_wider(survey, names_from = question, values_from = answer)
```
</details>

## Summary

| Function | Direction | Key Arguments |
|----------|-----------|---------------|
| `pivot_longer()` | Wide → Long | `cols`, `names_to`, `values_to` |
| `pivot_wider()` | Long → Wide | `names_from`, `values_from` |

## FAQ

### What replaced gather() and spread()?
`pivot_longer()` replaced `gather()`. `pivot_wider()` replaced `spread()`. The new functions have a clearer API and handle more edge cases.

### Can I pivot multiple value columns at once?
Yes. Use `names_to = c(".value", "group")` with `names_sep` or `names_pattern` to split column names into the value identifier and a grouping variable.

## What's Next?

- [Tidy Data](/Tidy-Data-in-R.html) — understand why reshaping matters
- [Handling NA in R](/Handling-NA-in-R.html) — deal with missing values after reshaping
- [tidyr separate & unite](/tidyr-separate-unite.html) — split and combine columns
