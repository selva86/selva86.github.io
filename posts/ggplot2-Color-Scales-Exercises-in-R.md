---
title: "ggplot2 Color Scales Exercises in R: 25 Practice Problems"
slug: "ggplot2-Color-Scales-Exercises-in-R"
description: "Master ggplot2 color scales with 25 practice problems: manual, brewer, viridis, gradient, hue. Hidden solutions."
keywords: "ggplot2 color scales exercises, ggplot color palette practice, scale_color_manual exercises, viridis R practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ggplot2 Color Scales Exercises"
sidebar_order: 126
fr_parent: "Complete-Ggplot2-Tutorial-Part2-Customizing-the-Look-and-Feel.html"
auto_link_terms: "ggplot2 color scales exercises|ggplot color palette practice|scale_color_manual exercises|viridis R practice"
auto_link_case_sensitive: false
target_keyword: "ggplot2 color scales exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# ggplot2 Color Scales Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on ggplot2 color and fill scales: manual, brewer, viridis, gradient, hue, custom palettes. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(ggplot2)
```

## Section 1. Manual scales (5 problems)

### Exercise 1.1: scale_color_manual

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_manual(values = c("red","blue","green"))
```

</details>

### Exercise 1.2: Named colors

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_manual(values = c(setosa = "red", versicolor = "blue", virginica = "green"))
```

</details>

### Exercise 1.3: scale_fill_manual on bars

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = cut)) + geom_bar() +
  scale_fill_manual(values = c("#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd"))
```

</details>

### Exercise 1.4: Hex color values

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_manual(values = c("#e41a1c","#377eb8","#4daf4a"))
```

</details>

### Exercise 1.5: Reorder legend

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_manual(values = c("red","blue","green"),
                     breaks = c("virginica","versicolor","setosa"))
```

</details>

## Section 2. ColorBrewer (5 problems)

### Exercise 2.1: scale_color_brewer Set1

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_brewer(palette = "Set1")
```

</details>

### Exercise 2.2: Set2 (qualitative)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_brewer(palette = "Set2")
```

</details>

### Exercise 2.3: Sequential

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = cut)) + geom_bar() +
  scale_fill_brewer(palette = "Blues")
```

</details>

### Exercise 2.4: Diverging RdBu

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:10, y = 1:10)
df$z <- df$x - df$y
ggplot(df, aes(x, y, fill = z)) + geom_tile() +
  scale_fill_distiller(palette = "RdBu")
```

</details>

### Exercise 2.5: Reverse direction

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = cut)) + geom_bar() +
  scale_fill_brewer(palette = "Blues", direction = -1)
```

</details>

## Section 3. Viridis (5 problems)

### Exercise 3.1: viridis_d

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_viridis_d()
```

</details>

### Exercise 3.2: viridis_c (continuous)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_viridis_c()
```

</details>

### Exercise 3.3: option = "magma"

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_viridis_c(option = "magma")
```

</details>

### Exercise 3.4: option = "inferno"

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_viridis_c(option = "inferno")
```

</details>

### Exercise 3.5: viridis on a heatmap

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:10, y = 1:10); df$z <- runif(100)
ggplot(df, aes(x, y, fill = z)) + geom_tile() + scale_fill_viridis_c()
```

</details>

## Section 4. Gradient (5 problems)

### Exercise 4.1: Two-color gradient

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_gradient(low = "blue", high = "red")
```

</details>

### Exercise 4.2: Three-color (diverging)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- data.frame(x = -5:5, y = -5:5, z = -5:5)
ggplot(df, aes(x, y, color = z)) + geom_point(size = 5) +
  scale_color_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0)
```

</details>

### Exercise 4.3: gradientn n-color

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_gradientn(colors = c("blue","yellow","red"))
```

</details>

### Exercise 4.4: Limits on gradient

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_gradient(low = "blue", high = "red", limits = c(50, 250))
```

</details>

### Exercise 4.5: Custom labels on legend

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_gradient(low = "blue", high = "red",
                       breaks = c(100, 200), labels = c("low","high"))
```

</details>

## Section 5. Hue and others (5 problems)

### Exercise 5.1: scale_color_hue (default)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_hue()
```

</details>

### Exercise 5.2: Hue starting position

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_hue(h.start = 90)
```

</details>

### Exercise 5.3: scale_color_grey

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_grey()
```

</details>

### Exercise 5.4: Reverse the legend keys

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  guides(color = guide_legend(reverse = TRUE))
```

</details>

### Exercise 5.5: Show fewer breaks on continuous color

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = hp)) + geom_point() +
  scale_color_gradient(low = "blue", high = "red", breaks = c(100, 200))
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — broader practice.
- **ggplot2-Themes-Exercises** (shipped) — theme drilling.
