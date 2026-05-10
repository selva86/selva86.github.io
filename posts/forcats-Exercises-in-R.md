---
title: "forcats Exercises in R: 40 Real Practice Problems"
slug: "forcats-Exercises-in-R"
description: "Master forcats with 40 practice problems in R: factor reordering, recoding, lumping, releveling. Hidden solutions, runnable code in the browser."
keywords: "forcats exercises, factors in R exercises, forcats practice, R factor manipulation practice, fct_reorder exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "forcats Exercises"
sidebar_order: 114
fr_parent: "R-Tutorial.html"
auto_link_terms: "forcats exercises|factors in R exercises|forcats practice|fct_reorder"
auto_link_case_sensitive: false
target_keyword: "forcats exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# forcats Exercises in R: 40 Real Practice Problems

<p class="lead">Forty practice problems on forcats: ordering, reordering, recoding, lumping, releveling, dropping unused levels. Hidden solutions, runnable code.</p>

```r title="Run this once before any exercise"
library(forcats)
library(dplyr)
library(ggplot2)
library(tibble)
```

## Section 1. Creating and inspecting (6 problems)

### Exercise 1.1: Create a factor

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
factor(c("low","high","med","low"), levels = c("low","med","high"))
```

</details>

### Exercise 1.2: Inspect levels

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
levels(iris$Species)
```

</details>

### Exercise 1.3: Count by level

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
fct_count(iris$Species)
```

</details>

### Exercise 1.4: Unique levels (factor)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
fct_unique(iris$Species)
```

</details>

### Exercise 1.5: Identify unused levels

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
f <- factor(c("a","b"), levels = c("a","b","c"))
levels(f)[!(levels(f) %in% f)]
```

</details>

### Exercise 1.6: Check factor type

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
is.factor(iris$Species)
```

</details>

## Section 2. Reordering (10 problems)

### Exercise 2.1: fct_relevel — explicit order

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
fct_relevel(factor(c("a","b","c","a")), "c","a","b")
```

</details>

### Exercise 2.2: fct_relevel — move to first

**Difficulty:** Intermediate. Move "virginica" first.

<details><summary>Show solution</summary>

```r
fct_relevel(iris$Species, "virginica") |> levels()
```

</details>

### Exercise 2.3: fct_relevel — move to last

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fct_relevel(iris$Species, "setosa", after = Inf) |> levels()
```

</details>

### Exercise 2.4: fct_infreq — by frequency

**Difficulty:** Intermediate. Reorder diamonds$cut by descending frequency.

<details><summary>Show solution</summary>

```r
fct_infreq(diamonds$cut) |> levels()
```

</details>

### Exercise 2.5: fct_inorder — by appearance

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fct_inorder(c("a","c","b","a")) |> levels()
```

</details>

### Exercise 2.6: fct_reorder — by another variable

**Difficulty:** Intermediate. Reorder by mean.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(fct_reorder(cut, price), price)) + geom_boxplot()
```

</details>

### Exercise 2.7: fct_reorder2 for line plots

**Difficulty:** Advanced. Reorder by last value of y.

<details><summary>Show solution</summary>

```r
df <- tibble(time = rep(1:3, 2), grp = rep(c("A","B"), each = 3), val = c(1,2,5, 3,4,2))
ggplot(df, aes(time, val, color = fct_reorder2(grp, time, val))) + geom_line()
```

</details>

### Exercise 2.8: fct_rev

**Difficulty:** Beginner. Reverse level order.

<details><summary>Show solution</summary>

```r
fct_rev(iris$Species) |> levels()
```

</details>

### Exercise 2.9: fct_shift

**Difficulty:** Intermediate. Shift levels cyclically by 1.

<details><summary>Show solution</summary>

```r
fct_shift(factor(c("a","b","c","d"))) |> levels()
```

</details>

### Exercise 2.10: fct_shuffle

**Difficulty:** Intermediate. Random level order.

<details><summary>Show solution</summary>

```r
set.seed(1)
fct_shuffle(iris$Species) |> levels()
```

</details>

## Section 3. Recoding and grouping (8 problems)

### Exercise 3.1: fct_recode

**Difficulty:** Intermediate. Rename "setosa" -> "S".

<details><summary>Show solution</summary>

```r
fct_recode(iris$Species, S = "setosa", V = "versicolor", VG = "virginica") |> levels()
```

</details>

### Exercise 3.2: fct_collapse — multi to one

**Difficulty:** Intermediate. Lump levels.

<details><summary>Show solution</summary>

```r
fct_collapse(iris$Species, big = c("versicolor","virginica")) |> levels()
```

</details>

### Exercise 3.3: fct_lump_n — keep top N

**Difficulty:** Intermediate. Keep top 3 cut categories, lump rest into "Other".

<details><summary>Show solution</summary>

```r
fct_lump_n(diamonds$cut, n = 3) |> levels()
```

</details>

### Exercise 3.4: fct_lump_prop — by proportion

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fct_lump_prop(diamonds$cut, prop = 0.1) |> levels()
```

</details>

### Exercise 3.5: fct_lump_min — by min count

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fct_lump_min(diamonds$clarity, min = 1000) |> levels()
```

</details>

### Exercise 3.6: fct_other — keep specific

**Difficulty:** Intermediate. Keep "Ideal", others lump.

<details><summary>Show solution</summary>

```r
fct_other(diamonds$cut, keep = "Ideal") |> levels()
```

</details>

### Exercise 3.7: fct_drop — remove unused

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
f <- factor(c("a","b"), levels = c("a","b","c"))
fct_drop(f) |> levels()
```

</details>

### Exercise 3.8: fct_expand — add new levels

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fct_expand(iris$Species, "newone") |> levels()
```

</details>

## Section 4. Conversion and applying (6 problems)

### Exercise 4.1: as_factor (preserves order of appearance)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
as_factor(c("c","a","b","a")) |> levels()
```

</details>

### Exercise 4.2: factor() vs as.factor() vs as_factor()

**Difficulty:** Advanced. Compare ordering.

<details><summary>Show solution</summary>

```r
v <- c("c","a","b")
list(base = factor(v), as_factor = as_factor(v))
```

</details>

### Exercise 4.3: To character

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
as.character(iris$Species) |> head()
```

</details>

### Exercise 4.4: Numeric from factor

**Difficulty:** Advanced. Pitfall: as.numeric returns level codes.

<details><summary>Show solution</summary>

```r
f <- factor(c("10","20","30"))
as.numeric(as.character(f))   # right way
as.numeric(f)                 # WRONG: returns 1, 2, 3
```

</details>

### Exercise 4.5: Reorder by aggregate function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  mutate(cut2 = fct_reorder(cut, price, .fun = median)) |>
  count(cut2)
```

</details>

### Exercise 4.6: Apply ordering to a ggplot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(fct_infreq(cut))) + geom_bar()
```

</details>

## Section 5. Real workflows (10 problems)

### Exercise 5.1: Bar chart ordered by frequency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(fct_infreq(cut))) + geom_bar() +
  labs(x = "cut")
```

</details>

### Exercise 5.2: Bar chart with rare lumped

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  mutate(cut_l = fct_lump_n(cut, 3)) |>
  ggplot(aes(cut_l)) + geom_bar()
```

</details>

### Exercise 5.3: Boxplot ordered by median

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(fct_reorder(cut, price, median), price)) + geom_boxplot()
```

</details>

### Exercise 5.4: Combine recode + lump

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  mutate(cut2 = fct_recode(cut, Best = "Ideal", Worst = "Fair") |>
                fct_lump_n(3)) |>
  count(cut2)
```

</details>

### Exercise 5.5: Drop unused after filter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- iris |> filter(Species != "setosa") |>
  mutate(Species = fct_drop(Species))
levels(df$Species)
```

</details>

### Exercise 5.6: Reorder by sum with .fun

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  mutate(cut2 = fct_reorder(cut, price, .fun = sum)) |>
  count(cut2)
```

</details>

### Exercise 5.7: Manual interleave of two factors

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fct_cross(factor(c("a","b")), factor(c("1","2","3"))) |> levels()
```

</details>

### Exercise 5.8: Map to ordinal

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
factor(c("low","high","med"),
       levels = c("low","med","high"),
       ordered = TRUE) |> levels()
```

</details>

### Exercise 5.9: Visual reorder for ggplot dotplot

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |>
  tibble::rownames_to_column("car") |>
  mutate(car = fct_reorder(car, mpg)) |>
  ggplot(aes(mpg, car)) + geom_point()
```

</details>

### Exercise 5.10: Stable lump with explicit "Other" position

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  mutate(cut2 = fct_lump_n(cut, 3) |> fct_relevel("Other", after = Inf)) |>
  count(cut2)
```

</details>

## What to do next

- **dplyr-Exercises** (shipped) — factors in larger wrangling pipelines.
- **ggplot2-Exercises** (shipped) — factor ordering and viz.
