---
title: "ggplot2 Heatmap Exercises in R: 20 Practice Problems"
slug: "ggplot2-Heatmap-Exercises-in-R"
description: "Master ggplot2 heatmaps with 20 practice problems: geom_tile, geom_raster, color scales, ordering, annotations. Hidden solutions."
keywords: "ggplot2 heatmap exercises, geom_tile R exercises, R heatmap practice, ggplot heatmap tutorial"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ggplot2 Heatmap Exercises"
sidebar_order: 128
fr_parent: "Top50-Ggplot2-Visualizations-MasterList-R-Code.html"
auto_link_terms: "ggplot2 heatmap exercises|geom_tile R exercises|R heatmap practice"
auto_link_case_sensitive: false
target_keyword: "ggplot2 heatmap exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# ggplot2 Heatmap Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on heatmaps in ggplot2: geom_tile, geom_raster, color scales, reordering, labels, correlation matrices.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(tidyr)
```

### Exercise 1: Basic geom_tile

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5)
df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile()
```

</details>

### Exercise 2: geom_raster (faster)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:50, y = 1:50)
df$z <- runif(nrow(df))
ggplot(df, aes(x, y, fill = z)) + geom_raster()
```

</details>

### Exercise 3: Two-color gradient

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  scale_fill_gradient(low = "white", high = "red")
```

</details>

### Exercise 4: Diverging gradient

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- df$x - df$y
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0)
```

</details>

### Exercise 5: Viridis fill

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() + scale_fill_viridis_c()
```

</details>

### Exercise 6: Correlation matrix heatmap

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
cor_mat <- cor(mtcars)
cor_df <- as.data.frame(cor_mat) |>
  tibble::rownames_to_column("v1") |>
  pivot_longer(-v1, names_to = "v2", values_to = "cor")
ggplot(cor_df, aes(v1, v2, fill = cor)) + geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0)
```

</details>

### Exercise 7: Add cell value labels

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:3, y = 1:3); df$z <- 1:9
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  geom_text(aes(label = z), color = "white")
```

</details>

### Exercise 8: Reverse y axis

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() + scale_y_reverse()
```

</details>

### Exercise 9: Square aspect ratio

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() + coord_equal()
```

</details>

### Exercise 10: Order rows/cols by hierarchical clustering

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
m <- cor(mtcars)
order <- hclust(dist(m))$order
m_ord <- m[order, order]
m_long <- as.data.frame(m_ord) |>
  tibble::rownames_to_column("v1") |>
  pivot_longer(-v1, names_to = "v2", values_to = "cor") |>
  mutate(v1 = factor(v1, levels = rownames(m_ord)),
         v2 = factor(v2, levels = colnames(m_ord)))
ggplot(m_long, aes(v1, v2, fill = cor)) + geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red")
```

</details>

### Exercise 11: Tile with white grid

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile(color = "white", linewidth = 1)
```

</details>

### Exercise 12: Tile from a count table

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diamonds |>
  count(cut, color) |>
  ggplot(aes(cut, color, fill = n)) + geom_tile() +
  scale_fill_viridis_c()
```

</details>

### Exercise 13: Mask diagonal

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
m <- cor(mtcars[, 1:5])
m[lower.tri(m, diag = FALSE)] <- NA
df <- as.data.frame(m) |>
  tibble::rownames_to_column("v1") |>
  pivot_longer(-v1, names_to = "v2", values_to = "cor") |>
  na.omit()
ggplot(df, aes(v1, v2, fill = cor)) + geom_tile() +
  scale_fill_gradient2(low = "blue", high = "red")
```

</details>

### Exercise 14: Limit color range

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  scale_fill_gradient(low = "white", high = "red", limits = c(0, 1))
```

</details>

### Exercise 15: Annotate cells with formatted numbers

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
m <- cor(mtcars[, 1:5])
df <- as.data.frame(m) |>
  tibble::rownames_to_column("v1") |>
  pivot_longer(-v1, names_to = "v2", values_to = "cor")
ggplot(df, aes(v1, v2, fill = cor)) + geom_tile() +
  geom_text(aes(label = sprintf("%.2f", cor)), color = "black", size = 3) +
  scale_fill_gradient2(low = "blue", high = "red")
```

</details>

### Exercise 16: Faceted heatmap

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:3, y = 1:3, group = c("A","B"))
df$z <- runif(nrow(df))
ggplot(df, aes(x, y, fill = z)) + geom_tile() + facet_wrap(~ group)
```

</details>

### Exercise 17: Time-vs-day calendar heatmap

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(day = 1:7, hour = 0:23)
df$count <- sample(0:50, nrow(df), replace = TRUE)
ggplot(df, aes(hour, day, fill = count)) + geom_tile() +
  scale_fill_viridis_c() +
  scale_y_reverse()
```

</details>

### Exercise 18: Theme cleanup

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  theme_minimal() + theme(panel.grid = element_blank())
```

</details>

### Exercise 19: Combine with text and color

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- data.frame(team = rep(c("A","B","C"), each = 3),
                 metric = rep(c("M1","M2","M3"), 3),
                 val = round(runif(9), 2))
ggplot(df, aes(metric, team, fill = val)) + geom_tile(color = "white") +
  geom_text(aes(label = val), color = "black") +
  scale_fill_viridis_c() + theme_minimal()
```

</details>

### Exercise 20: Custom legend position

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5); df$z <- runif(25)
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  theme(legend.position = "top")
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — broader practice.
- **ggplot2-Color-Scales-Exercises** (shipped) — palette focus.
