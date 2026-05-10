---
title: "tidyr Exercises in R: 50 Real Practice Problems"
slug: "tidyr-Exercises-in-R"
description: "Master tidyr with 50 practice problems in R: pivot, separate, fill, complete, nest, unnest. Hidden solutions, runnable code in the browser."
keywords: "tidyr exercises, tidyr practice, tidyr exercises in R, pivot in R exercises, tidyr pivot longer practice, tidyr nest unnest practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "tidyr Exercises"
sidebar_order: 110
fr_parent: "R-Tutorial.html"
auto_link_terms: "tidyr exercises|tidyr practice|tidyr exercises in R|practice tidyr"
auto_link_case_sensitive: false
target_keyword: "tidyr exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# tidyr Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on tidyr: pivot longer/wider, separate, unite, fill, complete, nest, unnest, and helpers. Hidden solutions, runnable code.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(stringr)
```

## Section 1. Pivots (10 problems)

### Exercise 1.1: Wide to long

**Difficulty:** Beginner. Pivot a wide quarterly table to long.

<details><summary>Show solution</summary>

```r
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
wide |> pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales")
```

</details>

### Exercise 1.2: Long to wide

**Difficulty:** Beginner. Pivot back to wide.

<details><summary>Show solution</summary>

```r
long <- tibble(region = c("US","US","EU","EU"),
               quarter = c("Q1","Q2","Q1","Q2"),
               sales = c(100,120,80,90))
long |> pivot_wider(names_from = quarter, values_from = sales)
```

</details>

### Exercise 1.3: pivot_longer with starts_with

**Difficulty:** Intermediate. Pivot all "Q*" columns.

<details><summary>Show solution</summary>

```r
wide <- tibble(region = "US", Q1 = 100, Q2 = 120, Q3 = 115, Q4 = 130)
wide |> pivot_longer(starts_with("Q"))
```

</details>

### Exercise 1.4: pivot_longer with names_pattern

**Difficulty:** Intermediate. Columns `revenue_2023`, `revenue_2024` -> rows with metric and year.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, revenue_2023 = c(100,200), revenue_2024 = c(110,220))
df |> pivot_longer(-id, names_to = c("metric","year"),
                   names_pattern = "(\\w+)_(\\d+)", values_to = "value")
```

</details>

### Exercise 1.5: pivot_wider with multiple values

**Difficulty:** Advanced. Pivot wide so each metric becomes <metric>_mean and <metric>_sd.

<details><summary>Show solution</summary>

```r
long <- tibble(id = c(1,1,2,2), metric = c("a","b","a","b"),
               mean = c(10,20,30,40), sd = c(1,2,3,4))
long |> pivot_wider(names_from = metric, values_from = c(mean, sd))
```

</details>

### Exercise 1.6: pivot_wider with values_fn

**Difficulty:** Advanced. Aggregate duplicates with sum during pivot.

<details><summary>Show solution</summary>

```r
df <- tibble(id = c(1,1,2), key = c("x","x","y"), value = c(10, 20, 30))
df |> pivot_wider(names_from = key, values_from = value, values_fn = sum)
```

</details>

### Exercise 1.7: names_prefix in pivot_longer

**Difficulty:** Intermediate. Strip "year_" prefix while pivoting.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, year_2023 = c(10,20), year_2024 = c(15,25))
df |> pivot_longer(-id, names_to = "year", names_prefix = "year_", values_to = "v")
```

</details>

### Exercise 1.8: Roundtrip wide-long-wide

**Difficulty:** Intermediate. Pivot long then back to wide; should equal original.

<details><summary>Show solution</summary>

```r
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
out <- wide |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales") |>
  pivot_wider(names_from = quarter, values_from = sales)
identical(wide, out)
```

</details>

### Exercise 1.9: Pivot longer with type conversion

**Difficulty:** Advanced. After pivot, convert year to integer with names_transform.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1, year_2023 = 100, year_2024 = 120)
df |> pivot_longer(-id, names_to = "year", names_prefix = "year_",
                   names_transform = list(year = as.integer))
```

</details>

### Exercise 1.10: Pivot longer dropping NAs

**Difficulty:** Intermediate. Drop NA values during pivot.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, a = c(1,NA), b = c(2,3))
df |> pivot_longer(-id, values_drop_na = TRUE)
```

</details>

## Section 2. Separate & unite (8 problems)

### Exercise 2.1: separate_wider_delim

**Difficulty:** Intermediate. Split "Last, First" into two columns.

<details><summary>Show solution</summary>

```r
tibble(name = c("Smith, Alice","Jones, Bob")) |>
  separate_wider_delim(name, delim = ", ", names = c("last","first"))
```

</details>

### Exercise 2.2: separate_wider_position

**Difficulty:** Intermediate. Split fixed-width string by position.

<details><summary>Show solution</summary>

```r
tibble(code = c("ABC1234","DEF5678")) |>
  separate_wider_position(code, c(prefix = 3, num = 4))
```

</details>

### Exercise 2.3: separate_wider_regex

**Difficulty:** Advanced. Extract structured parts via regex groups.

<details><summary>Show solution</summary>

```r
tibble(addr = c("123 Main St","42 Oak Rd")) |>
  separate_wider_regex(addr,
    patterns = c(num = "\\d+", " ", street = ".+"))
```

</details>

### Exercise 2.4: unite

**Difficulty:** Beginner. Combine year, month, day into ISO string.

<details><summary>Show solution</summary>

```r
tibble(year = 2024, month = "01", day = "15") |>
  unite("date", year, month, day, sep = "-")
```

</details>

### Exercise 2.5: separate keeping original

**Difficulty:** Intermediate. separate but keep the original column.

<details><summary>Show solution</summary>

```r
tibble(name = "Smith, Alice") |>
  separate_wider_delim(name, delim = ", ", names = c("last","first"),
                       cols_remove = FALSE)
```

</details>

### Exercise 2.6: separate_longer_delim

**Difficulty:** Advanced. Split a comma-separated string into MULTIPLE ROWS.

<details><summary>Show solution</summary>

```r
tibble(id = 1, tags = "x,y,z") |>
  separate_longer_delim(tags, delim = ",")
```

</details>

### Exercise 2.7: unite with na.rm

**Difficulty:** Intermediate. Unite with NA values dropped.

<details><summary>Show solution</summary>

```r
tibble(a = c("US","EU"), b = c("X", NA), c = c("1","2")) |>
  unite("key", a, b, c, sep = "_", na.rm = TRUE)
```

</details>

### Exercise 2.8: Round-trip separate + unite

**Difficulty:** Intermediate. Round-trip name through separate then unite.

<details><summary>Show solution</summary>

```r
df <- tibble(name = "Smith, Alice")
out <- df |>
  separate_wider_delim(name, delim = ", ", names = c("last","first")) |>
  unite("name", first, last, sep = " ")
out
```

</details>

## Section 3. Missing values (6 problems)

### Exercise 3.1: drop_na

**Difficulty:** Beginner. Drop rows where Ozone is NA.

<details><summary>Show solution</summary>

```r
airquality |> drop_na(Ozone)
```

</details>

### Exercise 3.2: drop_na on all

**Difficulty:** Beginner. Drop rows with any NA.

<details><summary>Show solution</summary>

```r
airquality |> drop_na()
```

</details>

### Exercise 3.3: fill down

**Difficulty:** Intermediate. Carry forward last non-NA region.

<details><summary>Show solution</summary>

```r
tibble(region = c("US",NA,NA,"EU",NA), v = 1:5) |>
  fill(region, .direction = "down")
```

</details>

### Exercise 3.4: fill up

**Difficulty:** Intermediate. Carry backward.

<details><summary>Show solution</summary>

```r
tibble(region = c("US",NA,NA,"EU",NA), v = 1:5) |>
  fill(region, .direction = "up")
```

</details>

### Exercise 3.5: replace_na

**Difficulty:** Intermediate. Replace NA in Ozone with column mean.

<details><summary>Show solution</summary>

```r
airquality |>
  mutate(Ozone = replace_na(Ozone, mean(Ozone, na.rm = TRUE)))
```

</details>

### Exercise 3.6: complete with fill

**Difficulty:** Advanced. Complete missing region/month combos with sales = 0.

<details><summary>Show solution</summary>

```r
df <- tibble(region = c("US","EU"), month = c(1,1), sales = c(100,80))
df |> complete(region, month = 1:3, fill = list(sales = 0))
```

</details>

## Section 4. Nest & unnest (10 problems)

### Exercise 4.1: nest

**Difficulty:** Intermediate. Nest iris data per Species.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |> nest()
```

</details>

### Exercise 4.2: unnest

**Difficulty:** Intermediate. Unnest a nested tibble back.

<details><summary>Show solution</summary>

```r
nested <- iris |> group_by(Species) |> nest()
nested |> unnest(data)
```

</details>

### Exercise 4.3: nest specific columns

**Difficulty:** Intermediate. Nest only Sepal.* columns.

<details><summary>Show solution</summary>

```r
iris |> nest(sepal = starts_with("Sepal"))
```

</details>

### Exercise 4.4: unnest_longer (vector list-col)

**Difficulty:** Advanced. Expand list-column of vectors into rows.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, vals = list(c(10,20), c(30,40,50)))
df |> unnest_longer(vals)
```

</details>

### Exercise 4.5: unnest_wider (named list)

**Difficulty:** Advanced. Expand list-column of named lists into columns.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, payload = list(list(a=1,b=2), list(a=10,b=20)))
df |> unnest_wider(payload)
```

</details>

### Exercise 4.6: hoist

**Difficulty:** Advanced. Pull specific named fields out of a list-column.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, payload = list(list(a=1,b=2,c=3), list(a=10,b=20,c=30)))
df |> hoist(payload, val_a = "a", val_c = "c")
```

</details>

### Exercise 4.7: pack columns

**Difficulty:** Advanced. Pack multiple columns into a single tibble-column.

<details><summary>Show solution</summary>

```r
iris |> pack(sepal = starts_with("Sepal"), petal = starts_with("Petal"))
```

</details>

### Exercise 4.8: unpack

**Difficulty:** Advanced. Reverse pack.

<details><summary>Show solution</summary>

```r
packed <- iris |> pack(sepal = starts_with("Sepal"))
packed |> unpack(sepal)
```

</details>

### Exercise 4.9: Many models with nest

**Difficulty:** Advanced. Fit lm per Species with nest + map.

<details><summary>Show solution</summary>

```r
library(purrr)
iris |>
  group_by(Species) |>
  nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)))
```

</details>

### Exercise 4.10: Extract coefficients via broom

**Difficulty:** Advanced. From the nested models, extract slopes.

<details><summary>Show solution</summary>

```r
library(purrr); library(broom)
iris |>
  group_by(Species) |>
  nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)),
         tidy = map(model, tidy)) |>
  unnest(tidy) |>
  filter(term == "Petal.Length")
```

</details>

## Section 5. Helper functions (8 problems)

### Exercise 5.1: expand

**Difficulty:** Intermediate. All combinations of unique cyl and gear from mtcars.

<details><summary>Show solution</summary>

```r
mtcars |> expand(cyl, gear)
```

</details>

### Exercise 5.2: expand_grid

**Difficulty:** Beginner. All region x quarter combos.

<details><summary>Show solution</summary>

```r
expand_grid(region = c("US","EU"), quarter = c("Q1","Q2"))
```

</details>

### Exercise 5.3: crossing (deduplicates)

**Difficulty:** Intermediate. Unique combos with crossing.

<details><summary>Show solution</summary>

```r
crossing(a = c(1,1,2), b = c("x","y"))
```

</details>

### Exercise 5.4: nesting

**Difficulty:** Advanced. expand keeping co-occurring rows.

<details><summary>Show solution</summary>

```r
df <- tibble(region = c("US","EU"), zone = c("E","W"))
df |> expand(nesting(region, zone))
```

</details>

### Exercise 5.5: uncount

**Difficulty:** Intermediate. Replicate rows by a count column.

<details><summary>Show solution</summary>

```r
tibble(item = c("a","b"), n = c(2,3)) |> uncount(n)
```

</details>

### Exercise 5.6: chop

**Difficulty:** Advanced. Collapse rows of a column into a list-column.

<details><summary>Show solution</summary>

```r
df <- tibble(id = c(1,1,2,2), v = 1:4)
df |> chop(v)
```

</details>

### Exercise 5.7: unchop

**Difficulty:** Advanced. Reverse chop: explode list-column to rows.

<details><summary>Show solution</summary>

```r
chopped <- tibble(id = 1:2, v = list(1:2, 3:4))
chopped |> unchop(v)
```

</details>

### Exercise 5.8: extract with regex groups

**Difficulty:** Advanced. Pull regex groups into multiple columns.

<details><summary>Show solution</summary>

```r
tibble(text = c("a-1","b-2","c-10")) |>
  extract(text, into = c("letter","num"),
          regex = "([a-z])-(\\d+)")
```

</details>

## Section 6. Real workflows (8 problems)

### Exercise 6.1: Reshape and join

**Difficulty:** Intermediate. Pivot a wide sales table long, then join with region info.

<details><summary>Show solution</summary>

```r
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
info <- tibble(region = c("US","EU"), continent = c("NA","EU"))

wide |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales") |>
  left_join(info, by = "region")
```

</details>

### Exercise 6.2: Summarise then pivot

**Difficulty:** Intermediate. Mean mpg per cyl in long, pivot wider with row id.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  summarise(mean = mean(mpg), sd = sd(mpg)) |>
  pivot_longer(c(mean, sd), names_to = "stat")
```

</details>

### Exercise 6.3: Multi-pivot pipeline

**Difficulty:** Advanced. Multi-stat across, then pivot to tidy two-column-per-stat.

<details><summary>Show solution</summary>

```r
iris |>
  summarise(across(where(is.numeric),
                   list(mean = mean, sd = sd),
                   .names = "{.col}_{.fn}")) |>
  pivot_longer(everything(),
               names_to = c("variable","stat"),
               names_sep = "_(?=mean$|sd$)")
```

</details>

### Exercise 6.4: Wide ETL

**Difficulty:** Advanced. From `q1_2023`, `q2_2023`, etc. to `region`, `quarter`, `year`, `sales`.

<details><summary>Show solution</summary>

```r
df <- tibble(region = c("US","EU"),
             q1_2023 = c(100,80), q2_2023 = c(120,90),
             q1_2024 = c(110,85), q2_2024 = c(130,95))
df |>
  pivot_longer(-region, names_to = c("quarter","year"),
               names_pattern = "q(\\d)_(\\d{4})", values_to = "sales") |>
  mutate(year = as.integer(year), quarter = as.integer(quarter))
```

</details>

### Exercise 6.5: Nest + iterate models

**Difficulty:** Advanced. Per Species fit lm, return slope p-value.

<details><summary>Show solution</summary>

```r
library(purrr); library(broom)
iris |>
  group_by(Species) |>
  nest() |>
  mutate(p = map_dbl(data, ~ tidy(lm(Sepal.Length ~ Petal.Length, .x))$p.value[2]))
```

</details>

### Exercise 6.6: Complete a calendar

**Difficulty:** Advanced. From sparse daily logs, complete with all dates in range.

<details><summary>Show solution</summary>

```r
df <- tibble(date = as.Date(c("2024-01-01","2024-01-03","2024-01-05")),
             count = c(2, 5, 3))
df |>
  complete(date = seq.Date(min(date), max(date), by = "day"),
           fill = list(count = 0))
```

</details>

### Exercise 6.7: Long-to-wide for reporting

**Difficulty:** Intermediate. Mean mpg per (cyl, gear) reshape to a 3x3 table.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl, gear) |>
  summarise(mean_mpg = round(mean(mpg), 1), .groups = "drop") |>
  pivot_wider(names_from = gear, values_from = mean_mpg, names_prefix = "gear_")
```

</details>

### Exercise 6.8: End-to-end ETL with tidyr

**Difficulty:** Advanced. Fill, complete, separate, pivot in one pipeline.

<details><summary>Show solution</summary>

```r
df <- tibble(region_q = c("US:Q1","US:Q2","EU:Q1","EU:Q2"),
             sales = c(100, 120, 80, 90))
df |>
  separate_wider_delim(region_q, delim = ":", names = c("region","quarter")) |>
  pivot_wider(names_from = quarter, values_from = sales)
```

</details>

## What to do next

After 50 tidyr exercises the pivot/nest/separate vocabulary should feel native. Natural follow-ups:

- **dplyr-Exercises** (shipped) — wrangle once tidied.
- **tidyverse-Exercises** (shipped) — multi-package pipelines.
- **Data-Wrangling-Exercises** (shipped) — the broader cleaning + reshape lifecycle.
