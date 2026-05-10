---
title: "ggplot2 Bar Chart Exercises in R: 25 Practice Problems"
slug: "ggplot2-Bar-Chart-Exercises-in-R"
description: "Master ggplot2 bar charts with 25 practice problems: count bars, geom_col, stacked, dodged, percentage, ordered. Hidden solutions."
keywords: "ggplot2 bar chart exercises, geom_bar exercises R, geom_col practice, stacked bar R exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ggplot2 Bar Chart Exercises"
sidebar_order: 127
fr_parent: "Top50-Ggplot2-Visualizations-MasterList-R-Code.html"
auto_link_terms: "ggplot2 bar chart exercises|geom_bar exercises|geom_col practice|stacked bar R"
auto_link_case_sensitive: false
target_keyword: "ggplot2 bar chart exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# ggplot2 Bar Chart Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on ggplot2 bar charts: count, explicit heights, stacked, dodged, filled, ordered, with labels. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
```

## Section 1. Basic bars (8 problems)

### Exercise 1.1: Count bars

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar()
```

</details>

### Exercise 1.2: geom_col with explicit heights

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col()
```

</details>

### Exercise 1.3: Horizontal bars (coord_flip)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar() + coord_flip()
```

</details>

### Exercise 1.4: Horizontal via aes(y)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(y = cut)) + geom_bar()
```

</details>

### Exercise 1.5: Order by frequency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(forcats::fct_infreq(cut))) + geom_bar()
```

</details>

### Exercise 1.6: Order by another variable

**Difficulty:** Advanced. Order cut by mean price.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(forcats::fct_reorder(cut, price), price)) +
  geom_col(stat = "summary", fun = mean)
```

</details>

### Exercise 1.7: Custom width

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar(width = 0.5)
```

</details>

### Exercise 1.8: Solid color bars

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar(fill = "steelblue")
```

</details>

## Section 2. Grouped (stacked, dodge, fill) (6 problems)

### Exercise 2.1: Stacked

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) + geom_bar()
```

</details>

### Exercise 2.2: Dodge

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) + geom_bar(position = "dodge")
```

</details>

### Exercise 2.3: Fill (100%)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) + geom_bar(position = "fill")
```

</details>

### Exercise 2.4: Identity stack with geom_col

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut, clarity)
ggplot(counts, aes(cut, n, fill = clarity)) + geom_col()
```

</details>

### Exercise 2.5: Reverse stack order

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) +
  geom_bar(position = position_stack(reverse = TRUE))
```

</details>

### Exercise 2.6: Adjust dodge spacing

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) +
  geom_bar(position = position_dodge(width = 0.9))
```

</details>

## Section 3. Labels and annotations (6 problems)

### Exercise 3.1: Value labels above bars

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col() +
  geom_text(aes(label = n), vjust = -0.3)
```

</details>

### Exercise 3.2: Comma-formatted labels

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col() +
  geom_text(aes(label = scales::comma(n)), vjust = -0.3)
```

</details>

### Exercise 3.3: Headroom for labels

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col() +
  geom_text(aes(label = n), vjust = -0.3) +
  scale_y_continuous(expand = expansion(mult = c(0, 0.1)))
```

</details>

### Exercise 3.4: Percent labels on stacked

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  count(cut, clarity) |>
  group_by(cut) |>
  mutate(pct = n / sum(n)) |>
  ggplot(aes(cut, pct, fill = clarity)) + geom_col() +
  scale_y_continuous(labels = scales::percent_format())
```

</details>

### Exercise 3.5: Inline labels inside bars

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col() +
  geom_text(aes(label = n), vjust = 1.5, color = "white")
```

</details>

### Exercise 3.6: Add reference line

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col() +
  geom_hline(yintercept = mean(counts$n), linetype = "dashed", color = "red")
```

</details>

## Section 4. Real workflows (5 problems)

### Exercise 4.1: Mean per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg)) |>
  ggplot(aes(factor(cyl), mean_mpg)) + geom_col()
```

</details>

### Exercise 4.2: Percent per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  count(cut) |>
  mutate(pct = n / sum(n)) |>
  ggplot(aes(cut, pct)) + geom_col() +
  scale_y_continuous(labels = scales::percent_format())
```

</details>

### Exercise 4.3: Highlight top bar

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
counts$top <- counts$n == max(counts$n)
ggplot(counts, aes(cut, n, fill = top)) + geom_col() +
  scale_fill_manual(values = c("gray70","tomato"))
```

</details>

### Exercise 4.4: Bar with error bars

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  summarise(m = mean(mpg), s = sd(mpg)) |>
  ggplot(aes(factor(cyl), m)) +
  geom_col() +
  geom_errorbar(aes(ymin = m - s, ymax = m + s), width = 0.2)
```

</details>

### Exercise 4.5: Side-by-side comparison

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- data.frame(group = rep(c("A","B","C"), 2),
                 metric = rep(c("Q1","Q2"), each = 3),
                 val = c(10, 20, 30, 15, 25, 28))
ggplot(df, aes(group, val, fill = metric)) +
  geom_col(position = "dodge")
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — broader practice.
- **ggplot2-Themes-Exercises** (shipped) — theme polish.
