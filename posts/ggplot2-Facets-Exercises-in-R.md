---
title: "ggplot2 Facets Exercises in R: 25 Practice Problems"
slug: "ggplot2-Facets-Exercises-in-R"
description: "Master ggplot2 facets with 25 practice problems: facet_wrap, facet_grid, free scales, custom labels. Hidden solutions."
keywords: "ggplot2 facets exercises, facet_wrap exercises, facet_grid R practice, ggplot facet practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ggplot2 Facets Exercises"
sidebar_order: 125
fr_parent: "Complete-Ggplot2-Tutorial-Part2-Customizing-the-Look-and-Feel.html"
auto_link_terms: "ggplot2 facets exercises|facet_wrap exercises|facet_grid R practice"
auto_link_case_sensitive: false
target_keyword: "ggplot2 facets exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# ggplot2 Facets Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on ggplot2 facets: facet_wrap, facet_grid, scales, labels, strip styling. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
```

## Section 1. facet_wrap (8 problems)

### Exercise 1.1: facet_wrap by Species

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length)) + geom_point() + facet_wrap(~ Species)
```

</details>

### Exercise 1.2: ncol

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(price)) + geom_histogram(bins = 30) + facet_wrap(~ cut, ncol = 5)
```

</details>

### Exercise 1.3: nrow

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(price)) + geom_histogram(bins = 30) + facet_wrap(~ cut, nrow = 1)
```

</details>

### Exercise 1.4: facet_wrap by two variables

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + facet_wrap(cyl ~ am)
```

</details>

### Exercise 1.5: free_y

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() + facet_wrap(~ drv, scales = "free_y")
```

</details>

### Exercise 1.6: free both

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() + facet_wrap(~ drv, scales = "free")
```

</details>

### Exercise 1.7: facet_wrap with as.table FALSE

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length)) + geom_point() +
  facet_wrap(~ Species, as.table = FALSE)
```

</details>

### Exercise 1.8: drop = FALSE keeps empty levels

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- iris |> filter(Species != "virginica")
ggplot(df, aes(Sepal.Length, Petal.Length)) + geom_point() +
  facet_wrap(~ Species, drop = FALSE)
```

</details>

## Section 2. facet_grid (6 problems)

### Exercise 2.1: rows ~ cols

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_point(alpha = 0.1) +
  facet_grid(cut ~ clarity)
```

</details>

### Exercise 2.2: Rows only

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + facet_grid(cyl ~ .)
```

</details>

### Exercise 2.3: Cols only

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + facet_grid(. ~ cyl)
```

</details>

### Exercise 2.4: facet_grid with vars()

**Difficulty:** Intermediate. Modern syntax.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  facet_grid(rows = vars(cyl), cols = vars(am))
```

</details>

### Exercise 2.5: free_y in grid

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() +
  facet_grid(drv ~ class, scales = "free_y")
```

</details>

### Exercise 2.6: space = "free"

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(class)) + geom_bar() +
  facet_grid(. ~ drv, space = "free", scales = "free_x")
```

</details>

## Section 3. Strip labels (5 problems)

### Exercise 3.1: Custom label vector

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
labs <- c(`4` = "4-cyl", `6` = "6-cyl", `8` = "8-cyl")
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  facet_wrap(~ cyl, labeller = labeller(cyl = labs))
```

</details>

### Exercise 3.2: as_labeller with function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  facet_wrap(~ cyl, labeller = as_labeller(\(x) paste0(x, " cyl")))
```

</details>

### Exercise 3.3: Strip background color

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length)) + geom_point() +
  facet_wrap(~ Species) +
  theme(strip.background = element_rect(fill = "lightblue"))
```

</details>

### Exercise 3.4: Bold strip text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length)) + geom_point() +
  facet_wrap(~ Species) +
  theme(strip.text = element_text(face = "bold"))
```

</details>

### Exercise 3.5: Position strip on bottom

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length)) + geom_point() +
  facet_wrap(~ Species, strip.position = "bottom")
```

</details>

## Section 4. Per-facet annotation (3 problems)

### Exercise 4.1: Per-facet text

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
counts <- mtcars |> count(cyl) |> mutate(label = paste("n =", n))
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  geom_text(data = counts, aes(x = 5, y = 32, label = label), hjust = 1, color = "red") +
  facet_wrap(~ cyl)
```

</details>

### Exercise 4.2: Per-facet smoother

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() +
  geom_smooth(method = "lm") + facet_wrap(~ drv)
```

</details>

### Exercise 4.3: Per-facet vline

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
medians <- iris |> group_by(Species) |>
  summarise(med = median(Sepal.Length), .groups = "drop")
ggplot(iris, aes(Sepal.Length)) + geom_density() +
  geom_vline(data = medians, aes(xintercept = med), linetype = "dashed") +
  facet_wrap(~ Species)
```

</details>

## Section 5. Real workflows (3 problems)

### Exercise 5.1: Compare distributions across drv

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(hwy, fill = drv)) + geom_histogram(bins = 20) +
  facet_wrap(~ drv, ncol = 1)
```

</details>

### Exercise 5.2: Yearly small multiples

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- economics |> mutate(year = format(date, "%Y"))
ggplot(df |> filter(as.integer(year) >= 2010),
       aes(date, unemploy)) + geom_line() + facet_wrap(~ year, scales = "free_x")
```

</details>

### Exercise 5.3: Two-way grid summary

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_point(alpha = 0.05) +
  facet_grid(cut ~ color) +
  theme(strip.text = element_text(size = 8))
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — broader practice.
- **ggplot2-Themes-Exercises** (shipped) — theme-only drills.
