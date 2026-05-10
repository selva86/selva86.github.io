---
title: "ggplot2 Exercises in R: 50 Real-World Practice Problems"
slug: "ggplot2-Exercises-in-R"
description: "Sharpen ggplot2 skills with 50 scenario-based practice problems in R: geoms, scales, facets, themes, annotations. Hidden solutions, run code in browser."
keywords: "ggplot2 exercises, ggplot2 practice problems, ggplot2 exercises in R, ggplot practice, learn ggplot2 by example, ggplot2 themes exercises, ggplot facet exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ggplot2 Exercises"
sidebar_order: 101
fr_parent: "Complete-Ggplot2-Tutorial-Part1-With-R-Code.html"
auto_link_terms: "ggplot2 exercises|ggplot2 practice|ggplot2 exercises in R|practice ggplot2|ggplot exercises"
auto_link_case_sensitive: false
target_keyword: "ggplot2 exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# ggplot2 Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty scenario-based ggplot2 exercises spanning geoms, aesthetics, scales, facets, themes, and multi-layer compositions. Solutions hidden behind reveal toggles so you actually build the plot first.</p>

| Section | Topic | Problems | Difficulty mix |
|---|---|---|---|
| 1 | Basic geoms | 8 | beginner to intermediate |
| 2 | Aesthetics & mapping | 8 | mostly intermediate |
| 3 | Scales & coordinates | 10 | mostly intermediate |
| 4 | Faceting | 6 | intermediate |
| 5 | Themes & customization | 10 | mostly intermediate |
| 6 | Annotations & publication-ready | 8 | intermediate to advanced |

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(scales)
```

## Section 1. Basic geoms (8 problems)

### Exercise 1.1: Scatter plot of weight vs mpg

**Scenario:** A car magazine wants to show the relationship between weight and fuel economy. Build a basic scatter plot of `mtcars$wt` (x) vs `mtcars$mpg` (y).

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point()

ex_1_1
```

**Explanation:** ggplot() declares data and aesthetic mapping; geom_point() draws the points. Every plot starts this way.

</details>

### Exercise 1.2: Histogram of diamond prices

**Scenario:** A jeweller wants the price distribution. Plot a histogram of `diamonds$price` with 40 bins.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 40)

ex_1_2
```

**Explanation:** geom_histogram only needs an x mapping; it counts rows per bin. `bins = 40` is a sensible default for moderate data; `binwidth =` is the alternative when you know the unit.

</details>

### Exercise 1.3: Bar chart of diamond counts by cut

**Scenario:** A merchandising team wants the inventory mix. Plot a bar chart showing the count of diamonds for each `cut` category.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar()

ex_1_3
```

**Explanation:** geom_bar counts rows per x category by default. Use geom_col when you already have the heights as a y column.

</details>

### Exercise 1.4: Boxplot of sepal length per species

**Scenario:** A botanist needs to compare sepal length distributions across the three iris species. Build a boxplot with Species on x and Sepal.Length on y.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  geom_boxplot()

ex_1_4
```

**Explanation:** geom_boxplot summarises the distribution into median, IQR, whiskers, outliers per group. Useful first comparison across categories.

</details>

### Exercise 1.5: Overlapping density curves by species

**Scenario:** A researcher wants smoothed distributions, not boxes. Plot overlapping density curves of `Sepal.Length` colored by Species, with 50% transparency.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- ggplot(iris, aes(x = Sepal.Length, fill = Species)) +
  geom_density(alpha = 0.5)

ex_1_5
```

**Explanation:** geom_density needs only x; fill maps Species to colored regions. alpha < 1 makes overlap legible. Compare to faceted densities when overlap is too much.

</details>

### Exercise 1.6: Line chart of unemployment over time

**Scenario:** An economist wants the long-term unemployment trend. From `economics`, plot a line chart of `unemploy` over `date`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line()

ex_1_6
```

**Explanation:** geom_line connects points by x order; ideal for time series. economics is a built-in monthly dataset with date already in Date format, so the x-axis formats nicely.

</details>

### Exercise 1.7: Scatter with linear smoother

**Scenario:** A data analyst presenting the wt-vs-mpg trend wants the line of best fit overlaid. Add a linear smoother to a scatter plot of `mtcars`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = TRUE)

ex_1_7
```

**Explanation:** geom_smooth fits a smoother per group; method="lm" is straight-line regression. se=TRUE shows the 95% confidence ribbon. Use method="loess" for a curve.

</details>

### Exercise 1.8: Violin + boxplot combination

**Scenario:** A reviewer wants the distribution shape AND quartiles for each cylinder count. Combine a violin plot with a thin boxplot inside, showing mpg by factor(cyl).

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_violin(fill = "lightblue") +
  geom_boxplot(width = 0.15, fill = "white")

ex_1_8
```

**Explanation:** Layering geoms shows two summaries at once. Coerce cyl to factor so it is treated as discrete groups. Narrow the boxplot with width so it nests inside the violin.

</details>

## Section 2. Aesthetics and mapping (8 problems)

### Exercise 2.1: Color points by species

**Scenario:** A botanist wants the three iris species color-coded. Build a scatter plot of `Sepal.Length` vs `Petal.Length` with points colored by Species.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point()

ex_2_1
```

**Explanation:** color is mapped INSIDE aes() because it depends on the data column. ggplot picks distinct hues automatically and adds a legend.

</details>

### Exercise 2.2: Size points by horsepower

**Scenario:** Engineering wants horsepower visible at a glance. Plot mtcars wt vs mpg with point size proportional to hp.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(mtcars, aes(x = wt, y = mpg, size = hp)) +
  geom_point(alpha = 0.7)

ex_2_2
```

**Explanation:** size mapped inside aes() encodes a third numeric variable. alpha helps when bigger points overlap.

</details>

### Exercise 2.3: Distinguish categories by shape

**Scenario:** A printer who can only print grayscale needs categories distinguishable without color. Use shape (not color) for Species in the iris scatter.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, shape = Species)) +
  geom_point(size = 3)

ex_2_3
```

**Explanation:** shape maps a discrete variable to point glyph. Default ggplot has 6 distinct shapes; for 3 species this works cleanly. Pair with size for grayscale reports.

</details>

### Exercise 2.4: Use alpha to handle overplotting

**Scenario:** A scatter of `diamonds` carat vs price has 53,940 points; many overlap. Use alpha = 0.05 so density becomes visible.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05)

ex_2_4
```

**Explanation:** alpha is set OUTSIDE aes() because it is a fixed value, not a data mapping. With heavy overlap, low alpha turns density into shading. For really dense data, prefer geom_hex or geom_bin2d.

</details>

### Exercise 2.5: Group lines by panel id

**Scenario:** Plot weight trajectories for each chick in `ChickWeight`. Use Time on x, weight on y, and one line per chick.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- ggplot(ChickWeight, aes(x = Time, y = weight, group = Chick)) +
  geom_line(alpha = 0.4)

ex_2_5
```

**Explanation:** Without `group = Chick`, geom_line connects across chicks in time order, drawing zigzags. The group aesthetic tells ggplot which observations belong to the same line.

</details>

### Exercise 2.6: Color vs fill on a bar chart

**Scenario:** A bar chart with bordered bars. Make a bar chart of diamonds cut where the bar BORDER is black and the bar INTERIOR is colored by clarity.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(color = "black")

ex_2_6
```

**Explanation:** color is the outline of a polygon-like geom (bar, point, etc.); fill is the interior. Mapping fill inside aes() splits the bars by clarity (stacked by default). Setting color outside makes a fixed border.

</details>

### Exercise 2.7: Multiple aesthetics combined

**Scenario:** An analyst wants weight, mpg, hp, and cylinder count visible all at once. Build a scatter where x = wt, y = mpg, color = factor(cyl), size = hp.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl), size = hp)) +
  geom_point(alpha = 0.7)

ex_2_7
```

**Explanation:** Four aesthetics encode four variables. color and size each generate their own legend automatically. factor(cyl) treats cyl as discrete (3 colors instead of a gradient).

</details>

### Exercise 2.8: Fixed value vs mapped (the gotcha)

**Scenario:** A trainee writes `aes(color = "red")` and is confused why all points are pink, with a "red" legend. Diagnose and fix.

**Difficulty:** Advanced

```r title="Your turn"
# WRONG: color is mapped to a constant string "red"
wrong <- ggplot(mtcars, aes(x = wt, y = mpg, color = "red")) + geom_point()

# fix it: make every point actually red, no legend
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(color = "red")

ex_2_8
```

**Explanation:** When you put `color = "red"` INSIDE aes(), ggplot maps every row to the literal value "red" and assigns it the first hue from the palette (pink), with a legend. To set a fixed color, put it OUTSIDE aes() in the geom layer.

</details>

## Section 3. Scales and coordinates (10 problems)

### Exercise 3.1: Set axis limits

**Scenario:** Zoom the mtcars scatter to mpg between 15 and 30. Use scale_y_continuous limits.

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  scale_y_continuous(limits = c(15, 30))

ex_3_1
```

**Explanation:** scale_y_continuous(limits = c(lo, hi)) clips the data and removes points outside. To zoom WITHOUT removing data, use coord_cartesian(ylim = ...).

</details>

### Exercise 3.2: Format y-axis as currency

**Scenario:** A finance team needs the y-axis in dollar format with thousands separators. Plot diamonds carat vs price and label y as "$1,000", "$5,000", etc.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05) +
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05) +
  scale_y_continuous(labels = scales::dollar_format())

ex_3_2
```

**Explanation:** The scales package provides label formatters: dollar_format(), comma_format(), percent_format(). Pass to the labels argument of any continuous scale.

</details>

### Exercise 3.3: Log10 axis for skewed data

**Scenario:** Diamond carat is right-skewed, making the linear plot crowded near zero. Apply log10 to the x-axis.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05) +
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05) +
  scale_x_log10()

ex_3_3
```

**Explanation:** scale_x_log10() transforms before plotting and labels axis ticks at 0.1, 1, 10, etc. Equivalent to scale_x_continuous(trans = "log10").

</details>

### Exercise 3.4: Manual color palette

**Scenario:** Marketing requires brand colors: green for setosa, navy for versicolor, gold for virginica. Apply these via scale_color_manual.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 2) +
  # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 2) +
  scale_color_manual(values = c(setosa = "darkgreen",
                                versicolor = "navy",
                                virginica = "goldenrod"))

ex_3_4
```

**Explanation:** Named vector in `values =` maps each level to a specific color. Order in the vector does not matter when names are used.

</details>

### Exercise 3.5: ColorBrewer palette

**Scenario:** A scientific publication style guide requires the ColorBrewer "Set2" palette for categorical data. Apply it to the iris scatter.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 2) +
  # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 2) +
  scale_color_brewer(palette = "Set2")

ex_3_5
```

**Explanation:** scale_color_brewer takes a palette name. "Set1"/"Set2"/"Set3" are qualitative; "Blues"/"Reds" are sequential; "RdBu" is diverging. Use scale_fill_brewer for fill aesthetic.

</details>

### Exercise 3.6: Viridis perceptually-uniform palette

**Scenario:** An accessibility-conscious team wants a palette that works in greyscale and for color-blind viewers. Apply scale_color_viridis_d() to the iris scatter.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_6 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 2) +
  # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 2) +
  scale_color_viridis_d()

ex_3_6
```

**Explanation:** viridis is the gold-standard palette for accessibility. _d suffix is the discrete variant; _c for continuous. Default option "D" (viridis); also "A" (magma), "B" (inferno), "C" (plasma).

</details>

### Exercise 3.7: Reorder bars by frequency

**Scenario:** A bar chart of diamonds cut should be sorted with the most-frequent cut on the LEFT, not in factor level order. Use forcats::fct_infreq.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- ggplot(diamonds, aes(x = forcats::fct_infreq(cut))) +
  geom_bar() +
  labs(x = "cut")

ex_3_7
```

**Explanation:** Bar charts respect factor level order. fct_infreq sorts levels by frequency (descending). For a custom order use fct_relevel; for ascending use fct_rev(fct_infreq()).

</details>

### Exercise 3.8: Reverse the y-axis

**Scenario:** A medical chart needs lower values at the top (e.g., cancer staging). Reverse the y-axis with scale_y_reverse().

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_8 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  scale_y_reverse()

ex_3_8
```

**Explanation:** scale_y_reverse() flips the y-axis without changing data. Use scale_x_reverse() for x.

</details>

### Exercise 3.9: Horizontal bar chart with coord_flip

**Scenario:** A long list of categories cramped on the x-axis becomes readable when bars are horizontal. Make the diamonds cut bar chart horizontal using coord_flip.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_9 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar() +
  # your code here
ex_3_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_9 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar() +
  coord_flip()

ex_3_9
```

**Explanation:** coord_flip swaps x and y after the geom is computed. Modern ggplot2 also accepts `aes(y = cut)` directly with geom_bar; coord_flip remains useful when the geom is defined with x and you don't want to rewrite the call.

</details>

### Exercise 3.10: Zoom without filtering

**Scenario:** A boxplot of mtcars mpg by cyl loses the IQR detail because outliers stretch the y-axis. Zoom y to 10-30 WITHOUT removing the outlier rows.

**Difficulty:** Advanced

```r title="Your turn"
ex_3_10 <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot() +
  # your code here
ex_3_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_10 <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot() +
  coord_cartesian(ylim = c(10, 30))

ex_3_10
```

**Explanation:** coord_cartesian(ylim) zooms the visible region without dropping data; the boxplot whiskers and outliers are still computed from full data. scale_y_continuous(limits) would drop outside points and recompute statistics.

</details>

## Section 4. Faceting (6 problems)

### Exercise 4.1: facet_wrap by Species

**Scenario:** A researcher wants three side-by-side scatter plots, one per iris species. Use facet_wrap.

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  geom_point() +
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  geom_point() +
  facet_wrap(~ Species)

ex_4_1
```

**Explanation:** facet_wrap takes a one-sided formula. Each species gets its own panel; same axes by default.

</details>

### Exercise 4.2: facet_wrap with custom number of columns

**Scenario:** With 5 levels of cut in diamonds, the default 3x2 layout is awkward. Lay out a faceted price histogram with `ncol = 5` (one row).

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 30) +
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 30) +
  facet_wrap(~ cut, ncol = 5)

ex_4_2
```

**Explanation:** ncol forces the layout. Use nrow for the other axis. Strip headers show the level name automatically.

</details>

### Exercise 4.3: facet_grid with two variables

**Scenario:** An analyst wants a grid of scatter plots: rows by cut, columns by clarity. Use facet_grid.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1) +
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1) +
  facet_grid(cut ~ clarity)

ex_4_3
```

**Explanation:** facet_grid takes rows ~ cols. Result is a matrix of panels, useful for two-way comparisons. facet_wrap drops empty cells; facet_grid keeps them.

</details>

### Exercise 4.4: Free y-axis scales per facet

**Scenario:** Faceting by drv on `mpg` dataset (cars) creates panels where the y-range varies a lot. Allow each panel its own y scale.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ drv, scales = "free_y")

ex_4_4
```

**Explanation:** scales = "free_y" lets each facet pick its own y-range. Options: "fixed" (default), "free_x", "free_y", "free". Use sparingly; readers easily miss that scales differ.

</details>

### Exercise 4.5: Custom facet labels with labeller

**Scenario:** Default strip labels show factor levels (4, 6, 8). The exec reading the chart prefers "4-cyl", "6-cyl", "8-cyl". Customize with labeller.

**Difficulty:** Advanced

```r title="Your turn"
ex_4_5 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl_labels <- c("4" = "4-cyl", "6" = "6-cyl", "8" = "8-cyl")

ex_4_5 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  facet_wrap(~ cyl, labeller = labeller(cyl = cyl_labels))

ex_4_5
```

**Explanation:** labeller() takes a named vector mapping levels to display labels. For multiple facets you can pass several mappings: labeller(cyl = ..., gear = ...). Use as_labeller() for function-based transforms.

</details>

### Exercise 4.6: Per-facet annotation

**Scenario:** Add a panel-specific text label inside each facet showing the count of cars in that cylinder group.

**Difficulty:** Advanced

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
counts <- mtcars |>
  count(cyl) |>
  mutate(label = paste("n =", n))

ex_4_6 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_text(data = counts, aes(x = 5, y = 32, label = label),
            hjust = 1, color = "red") +
  facet_wrap(~ cyl)

ex_4_6
```

**Explanation:** Build a per-facet summary tibble; pass it to a NEW geom_text layer with its own data. The layer inherits the facet variable from the main aes if it has the same column. Standard pattern for in-panel annotations.

</details>

## Section 5. Themes and customization (10 problems)

### Exercise 5.1: Add title, subtitle, caption

**Scenario:** A presentation chart needs a clear title, descriptive subtitle, and source citation. Add all three using labs() to the mtcars scatter.

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title    = "Heavier cars consume more fuel",
       subtitle = "1974 Motor Trend US data, 32 cars",
       caption  = "Source: mtcars (built-in R dataset)")

ex_5_1
```

**Explanation:** labs() handles title, subtitle, caption, x, y, color, fill, etc. in one call. Cleaner than separate ggtitle()/xlab()/ylab() calls.

</details>

### Exercise 5.2: Custom axis labels

**Scenario:** Default axis labels are the variable names (`wt`, `mpg`). Replace with "Weight (1000 lbs)" and "Miles per gallon".

**Difficulty:** Beginner

```r title="Your turn"
ex_5_2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")

ex_5_2
```

**Explanation:** x and y inside labs() override the auto-generated axis titles. For multi-line labels use "Line 1\nLine 2".

</details>

### Exercise 5.3: Apply theme_minimal

**Scenario:** A clean, gridline-light look matches your report style. Apply theme_minimal() to the iris scatter.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +
  # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +
  theme_minimal()

ex_5_3
```

**Explanation:** Built-in themes include theme_gray (default), theme_bw, theme_minimal, theme_classic, theme_void, theme_dark. Add at the end of the plot to override the global theme.

</details>

### Exercise 5.4: Rotate x-axis labels 45 degrees

**Scenario:** Long category names on the x-axis overlap. Rotate them 45 degrees and right-justify.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- ggplot(diamonds, aes(x = clarity)) +
  geom_bar() +
  # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- ggplot(diamonds, aes(x = clarity)) +
  geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ex_5_4
```

**Explanation:** axis.text.x targets the x tick labels; element_text() configures text properties. hjust = 1 anchors labels to their right edge so they line up with the tick.

</details>

### Exercise 5.5: Move legend to the bottom

**Scenario:** The default right-side legend wastes vertical space in a wide chart. Move it to the bottom.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +
  # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +
  theme(legend.position = "bottom")

ex_5_5
```

**Explanation:** legend.position takes "left", "right" (default), "top", "bottom", "none", or a numeric c(x, y) pair in [0, 1] for inside-plot placement.

</details>

### Exercise 5.6: Remove the legend entirely

**Scenario:** When the color encoding is self-explanatory (e.g., Species names labelled directly), the legend is redundant. Remove it.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_6 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +
  # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +
  theme(legend.position = "none")

ex_5_6
```

**Explanation:** "none" hides legends globally. To hide only one legend (e.g., color but keep size), use guides(color = "none").

</details>

### Exercise 5.7: Bold, centered, larger title

**Scenario:** A magazine cover-style chart needs a 16pt bold centered title. Customize plot.title with element_text.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_7 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Fuel economy vs vehicle weight") +
  # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Fuel economy vs vehicle weight") +
  theme(plot.title = element_text(size = 16, face = "bold", hjust = 0.5))

ex_5_7
```

**Explanation:** plot.title is the theme element for the main title. face = "bold" / "italic" / "bold.italic". hjust = 0.5 centers; 0 left-aligns; 1 right-aligns.

</details>

### Exercise 5.8: Remove minor gridlines

**Scenario:** A minimalist style requires only major gridlines. Remove minor gridlines on both axes.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_8 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  theme(panel.grid.minor = element_blank())

ex_5_8
```

**Explanation:** element_blank() removes a theme element. Other targets: panel.grid.major, panel.grid.major.x, panel.grid.minor.y, etc. theme_minimal already minimises gridlines if you want a softer touch.

</details>

### Exercise 5.9: Custom font family

**Scenario:** A brand-aligned chart uses serif typography. Apply font family "serif" globally.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_9 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Fuel economy vs weight") +
  # your code here
ex_5_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_9 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Fuel economy vs weight") +
  theme(text = element_text(family = "serif"))

ex_5_9
```

**Explanation:** The text theme element is the parent for all text. Setting family there cascades to title, axis text, legend, etc. For specific overrides, target plot.title etc. individually.

</details>

### Exercise 5.10: Build a reusable custom theme

**Scenario:** You want every chart in your report to share the same look. Build a function `my_theme()` that returns theme_minimal + bold centered titles + bottom legend, then apply it to two charts.

**Difficulty:** Advanced

```r title="Your turn"
my_theme <- function() {
  # your code here
}

p1 <- ggplot(mtcars, aes(wt, mpg)) + geom_point() + my_theme()
p2 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() + my_theme()

list(p1 = p1, p2 = p2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
my_theme <- function() {
  theme_minimal() +
    theme(plot.title      = element_text(face = "bold", hjust = 0.5),
          legend.position = "bottom")
}

p1 <- ggplot(mtcars, aes(wt, mpg)) + geom_point() + my_theme()
p2 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) + geom_point() + my_theme()
```

**Explanation:** Wrapping theme code in a function gives you single-source-of-truth styling. theme_minimal() + theme(...) chains compose because theme objects support `+`. Reuse across all your reports for consistency.

</details>

## Section 6. Annotations and publication-ready (8 problems)

### Exercise 6.1: Add a horizontal reference line

**Scenario:** Mark the average mpg on a scatter as a dashed horizontal line. Use geom_hline.

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_hline(yintercept = mean(mtcars$mpg), linetype = "dashed", color = "red")

ex_6_1
```

**Explanation:** geom_hline draws a horizontal line at yintercept; geom_vline at xintercept; geom_abline takes slope and intercept. linetype options: "solid", "dashed", "dotted", "dotdash", "longdash", "twodash".

</details>

### Exercise 6.2: Annotate a specific point

**Scenario:** Highlight the most fuel-efficient car with a text label and arrow. Use annotate.

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("point", x = 1.835, y = 33.9, color = "red", size = 4) +
  annotate("text", x = 2.5, y = 33.9, label = "Toyota Corolla\nbest mpg", hjust = 0)

ex_6_2
```

**Explanation:** annotate() draws ONE element with fixed coordinates, not a layer driven by data. Use it for callouts, arrows, and one-off labels. Pass arrow = grid::arrow() to a "segment" annotation for arrows.

</details>

### Exercise 6.3: Highlight a region with geom_rect

**Scenario:** Shade the "high efficiency" region (mpg > 25) on a scatter. Add a translucent green rectangle.

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  annotate("rect", xmin = -Inf, xmax = Inf, ymin = 25, ymax = Inf,
           fill = "lightgreen", alpha = 0.3) +
  geom_point()

ex_6_3
```

**Explanation:** annotate("rect", ...) with -Inf/Inf extends the rectangle to plot edges. Place the rect BEFORE the points so points draw on top. Standard pattern for highlighting threshold zones.

</details>

### Exercise 6.4: Label specific points with geom_text

**Scenario:** Label each car name on the scatter, but only those above 25 mpg. Filter inside the geom layer.

**Difficulty:** Intermediate

```r title="Your turn"
mt <- mtcars |> tibble::rownames_to_column("car")

ex_6_4 <- ggplot(mt, aes(x = wt, y = mpg)) +
  geom_point() +
  # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |> tibble::rownames_to_column("car")

ex_6_4 <- ggplot(mt, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_text(data = subset(mt, mpg > 25), aes(label = car),
            hjust = -0.1, size = 3)

ex_6_4
```

**Explanation:** Pass a filtered data argument to a layer to override the inherited data. geom_text needs a label aesthetic. For non-overlapping labels use ggrepel::geom_text_repel.

</details>

### Exercise 6.5: Smooth lines per facet group

**Scenario:** A faceted scatter of mpg dataset by drv with a per-facet linear smoother. Combine facet_wrap + geom_smooth.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm", se = FALSE) +
  facet_wrap(~ drv) +
  labs(title = "Fuel economy vs engine size, by drivetrain",
       x = "Engine displacement (L)", y = "Highway mpg") +
  theme_minimal()

ex_6_5
```

**Explanation:** geom_smooth fits per-facet automatically because facet acts as an implicit grouping. Adding labs and theme_minimal completes a publication-ready look.

</details>

### Exercise 6.6: Publication-ready chart with all the polish

**Scenario:** A final-form chart for a journal: titled, captioned, custom palette, theme_minimal, legend at bottom, dollar y-axis. Make it from diamonds carat vs price colored by cut.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- ggplot(diamonds |> sample_n(2000),
                 aes(x = carat, y = price, color = cut)) +
  geom_point(alpha = 0.6) +
  scale_y_continuous(labels = scales::dollar_format()) +
  scale_color_brewer(palette = "Set2") +
  labs(title    = "Diamond price increases steeply with carat",
       subtitle = "Sample of 2,000 diamonds, colored by cut quality",
       caption  = "Source: ggplot2::diamonds",
       x = "Carat", y = "Price", color = "Cut") +
  theme_minimal() +
  theme(plot.title      = element_text(face = "bold"),
        legend.position = "bottom")

ex_6_6
```

**Explanation:** Sample reduces overplot. Build up: scales for axis format and palette, labs for text, theme for the look. This template adapts to most reports with two changes.

</details>

### Exercise 6.7: Bar chart with value labels

**Scenario:** A finance summary bar chart needs value labels above each bar. Compute cut counts, plot, label.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
counts <- diamonds |> count(cut)

ex_6_7 <- ggplot(counts, aes(x = cut, y = n)) +
  geom_col(fill = "steelblue") +
  geom_text(aes(label = scales::comma(n)), vjust = -0.5, size = 3.5) +
  scale_y_continuous(labels = scales::comma_format(),
                     expand = expansion(mult = c(0, 0.1))) +
  labs(title = "Diamond inventory by cut quality", y = "Count", x = "Cut") +
  theme_minimal()

ex_6_7
```

**Explanation:** geom_col uses precomputed heights (vs geom_bar which counts). Labels above bars: vjust = -0.5. expansion(mult = c(0, 0.1)) adds 10% headroom on top so labels are not clipped.

</details>

### Exercise 6.8: Before/after comparison via faceting

**Scenario:** Compare mpg distributions for automatic vs manual transmission cars. Build a violin + boxplot with two facets, custom labels, and a clear theme.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |>
  mutate(transmission = if_else(am == 0, "Automatic", "Manual"))

ex_6_8 <- ggplot(mt, aes(x = transmission, y = mpg, fill = transmission)) +
  geom_violin(alpha = 0.5) +
  geom_boxplot(width = 0.15, fill = "white") +
  scale_fill_manual(values = c(Automatic = "tomato", Manual = "steelblue")) +
  labs(title = "Manual transmissions show higher mpg",
       subtitle = "1974 Motor Trend, 32 cars",
       x = NULL, y = "Miles per gallon") +
  theme_minimal() +
  theme(legend.position = "none",
        plot.title      = element_text(face = "bold"))

ex_6_8
```

**Explanation:** Decode am to readable labels first (analyst-friendly axis). Layer violin + narrow boxplot for distribution + summary. legend.position none removes redundant fill legend (x-axis already labels). x = NULL drops the x-axis title.

</details>

## What to do next

After 50 exercises, you should be composing publication-ready ggplot2 charts from memory. Natural follow-ups:

- **ggplot2 function-deep posts** in this site: geom_point, geom_bar, geom_line, scale_color_brewer, scale_y_continuous, theme, facet_wrap, and more. Each covers one function's full API.
- **Topic sub-hubs** (coming): ggplot2-Themes-Exercises, ggplot2-Facets-Exercises, ggplot2-Color-Scales-Exercises for targeted drilling.
- **Combine with dplyr**: most production charts start with dplyr summaries; the dplyr exercises hub drills the upstream pipeline.
