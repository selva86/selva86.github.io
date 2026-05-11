---
title: "gt Tables Exercises in R: 15 Practice Problems"
slug: "gt-Tables-Exercises-in-R"
description: "Master gt tables in R with 15 practice problems: formatting, titles, footnotes, color, summary rows. Hidden solutions."
keywords: "gt tables R exercises, gt package practice, R formatted tables, gt examples R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "gt Tables Exercises"
sidebar_order: 152
fr_parent: "R-Tutorial.html"
auto_link_terms: "gt tables R exercises|gt package practice|R formatted tables|gt examples R"
auto_link_case_sensitive: false
target_keyword: "gt tables R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# gt Tables Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on `gt` tables: formatting numbers, headers, footnotes, colors, summary rows. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(gt)
library(dplyr)
```

### Exercise 1: Basic gt

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
head(mtcars, 5) |> gt()
```

</details>

### Exercise 2: Title and subtitle

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
head(mtcars, 5) |> gt() |>
  tab_header(title = "Cars", subtitle = "Top 5")
```

</details>

### Exercise 3: Format numeric column

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
head(mtcars, 5) |> gt() |> fmt_number(mpg, decimals = 1)
```

</details>

### Exercise 4: Format as currency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
diamonds |> head(5) |> gt() |> fmt_currency(price)
```

</details>

### Exercise 5: Format percent

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(rate = c(0.05, 0.10, 0.25)) |> gt() |> fmt_percent(rate)
```

</details>

### Exercise 6: Color cells by value

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
head(mtcars, 5) |> gt() |>
  data_color(columns = mpg,
             colors = scales::col_numeric("Blues", domain = NULL))
```

</details>

### Exercise 7: Footnote

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
head(mtcars, 3) |> gt() |>
  tab_footnote(footnote = "Source: mtcars", locations = cells_title("title"))
```

</details>

### Exercise 8: Column groups (spanners)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
head(mtcars, 3) |> gt() |>
  tab_spanner(label = "Engine", columns = c(cyl, disp, hp))
```

</details>

### Exercise 9: Hide a column

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
head(mtcars, 3) |> gt() |> cols_hide(carb)
```

</details>

### Exercise 10: Rename columns

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
head(mtcars, 3) |> gt() |> cols_label(mpg = "MPG", cyl = "Cyl")
```

</details>

### Exercise 11: Summary row (grouped)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> head(10) |> group_by(cyl) |> gt() |>
  summary_rows(groups = TRUE, columns = mpg, fns = list(mean = ~ mean(.x)))
```

</details>

### Exercise 12: Add row groups

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> head(10) |> mutate(grp = ifelse(mpg > 20, "Hi","Lo")) |>
  gt(rowname_col = NULL, groupname_col = "grp")
```

</details>

### Exercise 13: tab_style bold

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
head(mtcars, 5) |> gt() |>
  tab_style(style = cell_text(weight = "bold"),
            locations = cells_body(columns = mpg, rows = mpg > 25))
```

</details>

### Exercise 14: Save to HTML/PNG

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- head(mtcars, 5) |> gt()
gtsave(g, "out.html")
```

</details>

### Exercise 15: Compact theme

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
head(mtcars, 5) |> gt() |> opt_table_lines("none")
```

</details>

## What to do next

- **Data-Visualization-Exercises** (shipped) — broader viz.
- **R-Markdown-Exercises** (shipped) — tables in reports.
