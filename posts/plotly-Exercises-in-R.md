---
title: "plotly Exercises in R: 20 Practice Problems"
slug: "plotly-Exercises-in-R"
description: "Master plotly in R with 20 practice problems: interactive plots, ggplotly, layouts, hover, animations. Hidden solutions."
keywords: "plotly R exercises, plotly practice R, interactive plots R, ggplotly exercises, plotly R tutorial"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "plotly Exercises"
sidebar_order: 150
fr_parent: "R-Tutorial.html"
auto_link_terms: "plotly R exercises|plotly practice R|interactive plots R|ggplotly exercises"
auto_link_case_sensitive: false
target_keyword: "plotly R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# plotly Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on plotly in R: interactive plots, ggplotly, layouts, hover info, animations, subplots. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(plotly)
library(ggplot2)
library(dplyr)
```

### Exercise 1: Scatter

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot_ly(mtcars, x = ~wt, y = ~mpg, type = "scatter", mode = "markers")
```

</details>

### Exercise 2: Lines

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot_ly(economics, x = ~date, y = ~unemploy, type = "scatter", mode = "lines")
```

</details>

### Exercise 3: Color by group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(iris, x = ~Sepal.Length, y = ~Petal.Length, color = ~Species,
        type = "scatter", mode = "markers")
```

</details>

### Exercise 4: Bar chart

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
plot_ly(counts, x = ~cut, y = ~n, type = "bar")
```

</details>

### Exercise 5: Histogram

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot_ly(diamonds, x = ~price, type = "histogram")
```

</details>

### Exercise 6: Box plot

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot_ly(iris, y = ~Sepal.Length, color = ~Species, type = "box")
```

</details>

### Exercise 7: Custom hover text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(mtcars, x = ~wt, y = ~mpg, text = ~rownames(mtcars), hoverinfo = "text+x+y")
```

</details>

### Exercise 8: Layout title and axes

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(mtcars, x = ~wt, y = ~mpg, type = "scatter", mode = "markers") |>
  layout(title = "Weight vs MPG", xaxis = list(title = "Weight"), yaxis = list(title = "MPG"))
```

</details>

### Exercise 9: ggplotly conversion

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
p <- ggplot(mtcars, aes(wt, mpg)) + geom_point()
ggplotly(p)
```

</details>

### Exercise 10: Subplots

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
p1 <- plot_ly(mtcars, x = ~wt, y = ~mpg)
p2 <- plot_ly(mtcars, x = ~hp, y = ~mpg)
subplot(p1, p2)
```

</details>

### Exercise 11: Animation by frame

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
plot_ly(iris, x = ~Sepal.Length, y = ~Petal.Length, frame = ~Species,
        type = "scatter", mode = "markers")
```

</details>

### Exercise 12: 3D scatter

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
plot_ly(mtcars, x = ~wt, y = ~mpg, z = ~hp, type = "scatter3d", mode = "markers")
```

</details>

### Exercise 13: Heatmap

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(z = ~as.matrix(cor(mtcars)), type = "heatmap")
```

</details>

### Exercise 14: Filled area

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(economics, x = ~date, y = ~unemploy,
        type = "scatter", mode = "lines", fill = "tozeroy")
```

</details>

### Exercise 15: Pie

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
counts <- diamonds |> count(cut)
plot_ly(counts, labels = ~cut, values = ~n, type = "pie")
```

</details>

### Exercise 16: Log y axis

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(diamonds, x = ~carat, y = ~price, type = "scatter", mode = "markers") |>
  layout(yaxis = list(type = "log"))
```

</details>

### Exercise 17: Range slider (time series)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
plot_ly(economics, x = ~date, y = ~unemploy, type = "scatter", mode = "lines") |>
  layout(xaxis = list(rangeslider = list()))
```

</details>

### Exercise 18: Custom color palette

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot_ly(iris, x = ~Sepal.Length, y = ~Petal.Length, color = ~Species,
        colors = c("red","blue","green"))
```

</details>

### Exercise 19: Save to HTML

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
p <- plot_ly(mtcars, x = ~wt, y = ~mpg)
htmlwidgets::saveWidget(p, "plot.html")
```

</details>

### Exercise 20: Combine with crosstalk

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
library(crosstalk)
shared <- SharedData$new(mtcars)
plot_ly(shared, x = ~wt, y = ~mpg) |>
  highlight("plotly_selected")
```

</details>

## What to do next

- **ggplot2-Exercises** (shipped) — static viz.
- **Shiny-Exercises** (shipped) — embed plotly inside apps.
