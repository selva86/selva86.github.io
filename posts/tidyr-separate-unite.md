---
title: "tidyr separate() & unite(): Split & Combine Character Columns"
slug: "tidyr-separate-unite"
description: "Split one column into many with tidyr separate() and combine multiple columns into one with unite(). Handle dates, names, and coded values."
keywords: "tidyr separate, tidyr unite, split column R, combine columns R, separate_wider_delim"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-tidy-1"
post_type: "FR"
auto_link_terms: "tidyr separate|separate()|unite()|split column"
auto_link_case_sensitive: false
fr_parent: "Tidy-Data-in-R.html"
---

# tidyr separate() & unite(): Split & Combine Character Columns

<p class="lead"><code>separate()</code> splits one column into multiple columns by a delimiter. <code>unite()</code> does the reverse — pastes columns together. Essential for cleaning messy text data.</p>

## separate(): One Column to Many

```r
library(tidyr)
df <- data.frame(patient=c("A","B","C"), bp=c("120/80","130/85","118/76"))
separate(df, bp, into = c("systolic", "diastolic"), sep = "/", convert = TRUE)
```

```r
library(tidyr)
df <- data.frame(id=1:3, full_name=c("Alice Smith","Bob Jones","Carol Lee"))
separate(df, full_name, into = c("first", "last"), sep = " ")
```

## unite(): Many Columns to One

```r
library(tidyr)
df <- data.frame(year=c(2026,2026), month=c(3,4), day=c(15,20))
unite(df, "date", year, month, day, sep = "-")
```

## separate_wider_delim (tidyr 1.3+)

```r
library(tidyr)
df <- tibble(x = c("a-1-x", "b-2-y", "c-3-z"))
separate_wider_delim(df, x, delim = "-", names = c("letter", "number", "code"))
```

## Practice Exercises

### Exercise 1: Parse Date Strings

Split "2026-03-30" into year, month, day columns.

```r
library(tidyr)
df <- data.frame(id=1:3, date=c("2026-03-30","2026-04-15","2026-05-01"))

```

<details><summary>Click to reveal solution</summary>

```r
library(tidyr)
df <- data.frame(id=1:3, date=c("2026-03-30","2026-04-15","2026-05-01"))
separate(df, date, into = c("year","month","day"), sep = "-", convert = TRUE)
```
</details>

## FAQ

### What if the number of pieces varies?

Use `extra = "merge"` to keep extra pieces in the last column, or `extra = "drop"` to discard them. Use `fill = "right"` to fill missing pieces with NA.

## What's Next?

- [Tidy Data](/Tidy-Data-in-R.html) — the parent tutorial
- [pivot_longer & wider](/pivot-longer-wider.html) — reshaping data
- [stringr Tutorial](/stringr-Tutorial.html) — more string operations
