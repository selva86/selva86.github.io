---
title: "ggplot2 Themes Exercises in R: 30 Practice Problems"
slug: "ggplot2-Themes-Exercises-in-R"
description: "Master ggplot2 themes with 30 practice problems: built-in themes, axis text, legend, gridlines, custom theme functions. Hidden solutions."
keywords: "ggplot2 themes exercises, ggplot2 customization practice, theme() exercises R, ggplot theme practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ggplot2 Themes Exercises"
sidebar_order: 124
fr_parent: "Complete-Ggplot2-Tutorial-Part2-Customizing-the-Look-and-Feel.html"
auto_link_terms: "ggplot2 themes exercises|ggplot2 customization practice|theme() exercises R"
auto_link_case_sensitive: false
target_keyword: "ggplot2 themes exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# ggplot2 Themes Exercises in R: 30 Practice Problems

<p class="lead">Thirty practice problems on ggplot2 themes: built-ins, axis customization, legend, gridlines, plot title, custom theme functions. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(ggplot2)
```

## Section 1. Built-in themes (6 problems)

### Exercise 1.1: theme_minimal

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_minimal()
```

</details>

### Exercise 1.2: theme_bw

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_bw()
```

</details>

### Exercise 1.3: theme_classic

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_classic()
```

</details>

### Exercise 1.4: theme_void

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_void()
```

</details>

### Exercise 1.5: theme_dark

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_dark()
```

</details>

### Exercise 1.6: Set global default

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
old <- theme_set(theme_minimal())
ggplot(mtcars, aes(wt, mpg)) + geom_point()
theme_set(old)
```

</details>

## Section 2. Title and labels (5 problems)

### Exercise 2.1: Bold title

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(title = "Demo") +
  theme(plot.title = element_text(face = "bold"))
```

</details>

### Exercise 2.2: Center the title

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(title = "Demo") +
  theme(plot.title = element_text(hjust = 0.5))
```

</details>

### Exercise 2.3: Larger axis labels

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(axis.title = element_text(size = 14))
```

</details>

### Exercise 2.4: Italic subtitle

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(subtitle = "demo") +
  theme(plot.subtitle = element_text(face = "italic"))
```

</details>

### Exercise 2.5: Right-aligned caption

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(caption = "Source: mtcars") +
  theme(plot.caption = element_text(hjust = 1))
```

</details>

## Section 3. Axis ticks and text (6 problems)

### Exercise 3.1: Rotate x labels

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(clarity)) + geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
```

</details>

### Exercise 3.2: Hide x axis text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(axis.text.x = element_blank())
```

</details>

### Exercise 3.3: Larger axis text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(axis.text = element_text(size = 12))
```

</details>

### Exercise 3.4: Bold y axis title

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(axis.title.y = element_text(face = "bold"))
```

</details>

### Exercise 3.5: Remove tick marks

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(axis.ticks = element_blank())
```

</details>

### Exercise 3.6: Custom font family

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(text = element_text(family = "serif"))
```

</details>

## Section 4. Legend (6 problems)

### Exercise 4.1: Bottom legend

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  theme(legend.position = "bottom")
```

</details>

### Exercise 4.2: No legend

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  theme(legend.position = "none")
```

</details>

### Exercise 4.3: Inside-plot legend

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  theme(legend.position = c(0.2, 0.8))
```

</details>

### Exercise 4.4: Legend title

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  labs(color = "Iris species")
```

</details>

### Exercise 4.5: Larger legend text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  theme(legend.text = element_text(size = 12))
```

</details>

### Exercise 4.6: Hide one legend with guides

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = factor(cyl), size = hp)) + geom_point() +
  guides(size = "none")
```

</details>

## Section 5. Gridlines and panel (4 problems)

### Exercise 5.1: Remove minor grid

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(panel.grid.minor = element_blank())
```

</details>

### Exercise 5.2: Remove all gridlines

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(panel.grid = element_blank())
```

</details>

### Exercise 5.3: Custom panel background

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(panel.background = element_rect(fill = "lightyellow"))
```

</details>

### Exercise 5.4: Add a panel border

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(panel.border = element_rect(color = "black", fill = NA, size = 1))
```

</details>

## Section 6. Custom theme function (3 problems)

### Exercise 6.1: Reusable function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
my_theme <- function() {
  theme_minimal() +
    theme(plot.title = element_text(face = "bold", hjust = 0.5),
          legend.position = "bottom")
}
ggplot(mtcars, aes(wt, mpg)) + geom_point() + labs(title = "demo") + my_theme()
```

</details>

### Exercise 6.2: Theme function with args

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
my_theme <- function(base_size = 12) theme_minimal(base_size = base_size)
ggplot(mtcars, aes(wt, mpg)) + geom_point() + my_theme(14)
```

</details>

### Exercise 6.3: Replace default

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
theme_replace(panel.grid.minor = element_blank())
ggplot(mtcars, aes(wt, mpg)) + geom_point()
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — broader practice.
- **ggplot2-Color-Scales-Exercises** (coming) — palettes and color theory.
