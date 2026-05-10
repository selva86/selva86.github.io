---
title: "Data Visualization Exercises in R: 50 Practice Problems"
slug: "Data-Visualization-Exercises-in-R"
description: "Master data visualization in R with 50 practice problems: ggplot2 charts, customization, themes, multi-plot, publication-ready. Hidden solutions."
keywords: "data visualization exercises in R, R data viz exercises, R visualization practice, ggplot exercises, R chart exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Data Viz Exercises"
sidebar_order: 117
fr_parent: "R-Tutorial.html"
auto_link_terms: "data visualization exercises|R data viz exercises|R visualization practice"
auto_link_case_sensitive: false
target_keyword: "data visualization exercises in R"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Data Visualization Exercises in R: 50 Practice Problems

<p class="lead">Fifty practice problems on data visualization in R: chart types, customization, themes, multi-plot composition, and publication-ready output. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(scales)
library(tibble)
```

## Section 1. Chart types (12 problems)

### Exercise 1.1: Scatter plot

**Difficulty:** Beginner. mpg vs wt.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point()
```

</details>

### Exercise 1.2: Bar chart of counts

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar()
```

</details>

### Exercise 1.3: Bar with explicit heights (geom_col)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
ggplot(counts, aes(cut, n)) + geom_col()
```

</details>

### Exercise 1.4: Histogram

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(price)) + geom_histogram(bins = 30)
```

</details>

### Exercise 1.5: Density

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, fill = Species)) + geom_density(alpha = 0.5)
```

</details>

### Exercise 1.6: Box plot per group

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Species, Sepal.Length)) + geom_boxplot()
```

</details>

### Exercise 1.7: Violin

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Species, Sepal.Length)) + geom_violin()
```

</details>

### Exercise 1.8: Line chart

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(economics, aes(date, unemploy)) + geom_line()
```

</details>

### Exercise 1.9: Area chart

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(economics, aes(date, unemploy)) + geom_area(fill = "steelblue", alpha = 0.5)
```

</details>

### Exercise 1.10: Heatmap (geom_tile)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- expand.grid(x = 1:5, y = 1:5)
df$z <- runif(nrow(df))
ggplot(df, aes(x, y, fill = z)) + geom_tile()
```

</details>

### Exercise 1.11: Pie chart (via coord_polar)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes("", fill = cut)) +
  geom_bar(width = 1) + coord_polar("y")
```

</details>

### Exercise 1.12: 2D density

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_density_2d()
```

</details>

## Section 2. Aesthetics & mapping (8 problems)

### Exercise 2.1: Color by group

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point()
```

</details>

### Exercise 2.2: Size by continuous

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, size = hp)) + geom_point()
```

</details>

### Exercise 2.3: Shape by category

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, shape = Species)) + geom_point(size = 3)
```

</details>

### Exercise 2.4: Color vs fill on bars

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) + geom_bar(color = "black")
```

</details>

### Exercise 2.5: Alpha for overlap

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_point(alpha = 0.05)
```

</details>

### Exercise 2.6: Group line by id

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(ChickWeight, aes(Time, weight, group = Chick)) + geom_line(alpha = 0.4)
```

</details>

### Exercise 2.7: Multiple aesthetics

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg, color = factor(cyl), size = hp, shape = factor(am))) +
  geom_point(alpha = 0.7)
```

</details>

### Exercise 2.8: Constant outside aes

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point(color = "red", size = 3)
```

</details>

## Section 3. Customization (10 problems)

### Exercise 3.1: Title + subtitle + caption

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(title = "Weight vs MPG", subtitle = "Motor Trend 1974", caption = "Source: mtcars")
```

</details>

### Exercise 3.2: Axis labels

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
```

</details>

### Exercise 3.3: Format y as currency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_point(alpha = 0.05) +
  scale_y_continuous(labels = dollar_format())
```

</details>

### Exercise 3.4: Log axis

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_point(alpha = 0.05) +
  scale_x_log10() + scale_y_log10()
```

</details>

### Exercise 3.5: Manual color

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_manual(values = c(setosa = "red", versicolor = "blue", virginica = "green"))
```

</details>

### Exercise 3.6: ColorBrewer

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_brewer(palette = "Set2")
```

</details>

### Exercise 3.7: Viridis

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  scale_color_viridis_d()
```

</details>

### Exercise 3.8: Reorder x by frequency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(forcats::fct_infreq(cut))) + geom_bar()
```

</details>

### Exercise 3.9: Coord flip

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar() + coord_flip()
```

</details>

### Exercise 3.10: Zoom without filtering

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  coord_cartesian(ylim = c(15, 30))
```

</details>

## Section 4. Themes (8 problems)

### Exercise 4.1: theme_minimal

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_minimal()
```

</details>

### Exercise 4.2: theme_bw

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() + theme_bw()
```

</details>

### Exercise 4.3: Rotate x text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(clarity)) + geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
```

</details>

### Exercise 4.4: Bottom legend

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  theme(legend.position = "bottom")
```

</details>

### Exercise 4.5: Remove legend

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() +
  theme(legend.position = "none")
```

</details>

### Exercise 4.6: Bold centered title

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  labs(title = "Title") +
  theme(plot.title = element_text(face = "bold", hjust = 0.5))
```

</details>

### Exercise 4.7: Remove minor gridlines

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  theme(panel.grid.minor = element_blank())
```

</details>

### Exercise 4.8: Custom theme function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
my_theme <- function() theme_minimal() + theme(plot.title = element_text(face = "bold"))
ggplot(mtcars, aes(wt, mpg)) + geom_point() + labs(title = "Demo") + my_theme()
```

</details>

## Section 5. Multi-plot & faceting (6 problems)

### Exercise 5.1: facet_wrap

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, Petal.Length)) + geom_point() + facet_wrap(~ Species)
```

</details>

### Exercise 5.2: facet_grid

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat, price)) + geom_point(alpha = 0.1) + facet_grid(cut ~ clarity)
```

</details>

### Exercise 5.3: Free scales

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() + facet_wrap(~ drv, scales = "free_y")
```

</details>

### Exercise 5.4: patchwork side by side

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
library(patchwork)
p1 <- ggplot(mtcars, aes(wt, mpg)) + geom_point()
p2 <- ggplot(mtcars, aes(hp, mpg)) + geom_point()
p1 | p2
```

</details>

### Exercise 5.5: patchwork two-by-two

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
library(patchwork)
p1 <- ggplot(mtcars, aes(wt, mpg)) + geom_point()
p2 <- ggplot(mtcars, aes(hp, mpg)) + geom_point()
p3 <- ggplot(mtcars, aes(disp, mpg)) + geom_point()
p4 <- ggplot(mtcars, aes(qsec, mpg)) + geom_point()
(p1 | p2) / (p3 | p4)
```

</details>

### Exercise 5.6: Custom facet labels

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  facet_wrap(~ cyl, labeller = labeller(cyl = c(`4` = "4-cyl", `6` = "6-cyl", `8` = "8-cyl")))
```

</details>

## Section 6. Publication & save (6 problems)

### Exercise 6.1: ggsave PNG

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
p <- ggplot(mtcars, aes(wt, mpg)) + geom_point()
ggsave("plot.png", p, width = 6, height = 4, dpi = 300)
```

</details>

### Exercise 6.2: ggsave PDF

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
p <- ggplot(mtcars, aes(wt, mpg)) + geom_point()
ggsave("plot.pdf", p, width = 6, height = 4)
```

</details>

### Exercise 6.3: Annotate threshold line

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  geom_hline(yintercept = mean(mtcars$mpg), linetype = "dashed", color = "red")
```

</details>

### Exercise 6.4: Annotate text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) + geom_point() +
  annotate("text", x = 4, y = 30, label = "Outlier zone", color = "red")
```

</details>

### Exercise 6.5: Highlight region

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) +
  annotate("rect", xmin = -Inf, xmax = Inf, ymin = 25, ymax = Inf,
           fill = "lightgreen", alpha = 0.3) +
  geom_point()
```

</details>

### Exercise 6.6: Publication-ready ensemble

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot(diamonds |> sample_n(2000), aes(carat, price, color = cut)) +
  geom_point(alpha = 0.6) +
  scale_y_continuous(labels = dollar_format()) +
  scale_color_brewer(palette = "Set2") +
  labs(title = "Diamond price vs carat", subtitle = "Sample of 2000",
       x = "Carat", y = "Price", color = "Cut") +
  theme_minimal() +
  theme(plot.title = element_text(face = "bold"), legend.position = "bottom")
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — depth on every geom and scale.
- **EDA-Exercises** (shipped) — viz inside the analysis loop.
