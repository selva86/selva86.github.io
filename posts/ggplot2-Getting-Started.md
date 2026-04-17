---
title: "ggplot2 for Beginners: Build 5 Real Charts in 30 Minutes, Zero Experience Needed"
slug: "ggplot2-Getting-Started"
description: "Make a scatter plot, bar chart, histogram, line chart, and boxplot in ggplot2. Every line of code explained, the fastest genuine introduction to ggplot2."
keywords: "ggplot2 getting started, ggplot2 tutorial, ggplot2 beginners, ggplot2 scatter plot, ggplot2 bar chart, ggplot2 histogram, ggplot2 line chart, ggplot2 boxplot"
auto_link_terms: "ggplot2 getting started|ggplot2 tutorial|ggplot2 basics|ggplot2 for beginners|geom_point()|geom_bar()|geom_histogram()|geom_line()|geom_boxplot()"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.2"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "ggplot2 Getting Started"
sidebar_order: 6
difficulty: "Intermediate"
---

# ggplot2 for Beginners: Build 5 Real Charts in 30 Minutes, Zero Experience Needed

<p class="lead">ggplot2 is R's most popular plotting package, it turns data frames into publication-quality charts with a consistent, layered grammar you can learn in one sitting.</p>

## Introduction

You have data in R and you want a chart. Base R's `plot()` function works, but the code gets messy the moment you need colors, labels, or facets. There is a better way.

ggplot2 is a tidyverse package that implements Leland Wilkinson's Grammar of Graphics. The core idea is simple: every chart is built from the same three ingredients, your data, a mapping of columns to visual properties, and a geometric shape that draws the result. Once you learn the pattern, you can build any chart.

In this tutorial you will build five real charts from scratch: a scatter plot, a bar chart, a histogram, a line chart, and a boxplot. Every line of code is explained, and every block runs right here in your browser. No installation needed.

![The five chart types you will build in this tutorial](screenshots/ggplot2-Getting-Started-five-charts-overview.webp)
*Figure 1: The five chart types you will build in this tutorial.*

## How Does the Grammar of Graphics Work?

Every ggplot2 chart follows the same pattern. You start with data, map columns to visual properties called aesthetics, and then pick a geometry to draw. The code looks like this: `ggplot(data, aes(...)) + geom_*()`.

Think of it as stacking layers. The first layer is your data. The second layer says "put this column on the x-axis and that column on the y-axis." The third layer draws points, bars, or lines. You can keep adding layers for labels, colors, and themes.

Let's see the pattern in action. The `mpg` dataset is built into ggplot2 and contains fuel economy data for 234 cars. We will plot engine displacement against highway mileage.

```r
# Load ggplot2 — this one library() call covers the entire tutorial
library(ggplot2)

# The ggplot2 pattern: data + aesthetics + geometry
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()
#> A scatter plot appears with engine size on the x-axis
#> and highway MPG on the y-axis
```

The `ggplot()` call sets up the data and axes. The `+` operator adds a layer. `geom_point()` draws one dot per row. That three-part pattern is the same for every chart you will build today.

![Every ggplot2 chart follows the same five-layer pattern](screenshots/ggplot2-Getting-Started-grammar-layers.webp)
*Figure 2: Every ggplot2 chart follows the same five-layer pattern.*

[KEY INSIGHT]
**Every ggplot2 chart uses the same template.** Once you know `ggplot(data, aes()) + geom_*()`, you only need to swap the geometry to get a completely different chart type.

**Try it:** Create a scatter plot of `mpg` with `cty` (city mileage) on the y-axis and `displ` on the x-axis using `geom_point()`.

```r
# Try it: scatter plot of displ vs cty
ex_plot <- ggplot(mpg, aes(x = displ, y = cty)) +
  # your code here
  NULL

ex_plot
#> Expected: a scatter plot of engine size vs city mileage
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_plot <- ggplot(mpg, aes(x = displ, y = cty)) +
  geom_point()

ex_plot
#> A scatter plot with displ on x-axis and cty on y-axis
```

**Explanation:** Replace `NULL` with `geom_point()` to draw dots. The pattern is identical to the highway mileage example.

</details>

## How Do You Make a Scatter Plot with geom_point()?

Scatter plots show the relationship between two numeric variables. Each row in your data becomes one point. You can map extra columns to color, size, or shape to reveal patterns within groups.

Let's color each point by the car's `class` column. This reveals which vehicle types get better mileage.

```r
# Scatter plot colored by vehicle class
ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point()
#> Each vehicle class gets a distinct color
#> SUVs and pickups cluster at high displacement, low MPG
```

The `color = class` mapping inside `aes()` tells ggplot2 to assign a unique color to each category. The legend appears automatically.

Now let's add size mapping and proper labels. Mapping `size` to a numeric column scales each point proportionally.

```r
# Scatter with size mapped to cylinder count and custom labels
ggplot(mpg, aes(x = displ, y = hwy, color = class, size = cyl)) +
  geom_point(alpha = 0.7) +
  labs(
    title = "Engine Size vs Highway Mileage",
    x = "Engine Displacement (litres)",
    y = "Highway MPG",
    color = "Vehicle Class",
    size = "Cylinders"
  )
#> Larger dots represent 8-cylinder engines
#> Alpha = 0.7 makes overlapping points visible
```

The `alpha = 0.7` argument makes dots slightly transparent, so you can see where points stack on top of each other. The `labs()` layer adds human-readable axis labels and a title.

[TIP]
**Use alpha for overlapping points.** When hundreds of dots land on the same spot, setting `alpha` between 0.3 and 0.7 reveals the density underneath.

**Try it:** Create a scatter plot of `displ` vs `hwy`, color the points by `drv` (drive type), and add a title "Drive Type Comparison".

```r
# Try it: color by drv and add a title
ex_scatter <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  # your code here
  NULL

ex_scatter
#> Expected: colored scatter plot with a title
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_scatter <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point() +
  labs(title = "Drive Type Comparison")

ex_scatter
#> Points colored by f (front), r (rear), 4 (four-wheel)
```

**Explanation:** `color = drv` maps drive type to color. `labs(title = ...)` adds the title above the chart.

</details>

## How Do You Build a Bar Chart with geom_bar()?

Bar charts count how many rows fall into each category. They are the go-to chart for summarizing categorical data. In ggplot2, `geom_bar()` counts rows for you, just map the category to the x-axis.

Let's count how many cars belong to each `class`.

```r
# Bar chart: count of cars by class
ggplot(mpg, aes(x = class)) +
  geom_bar()
#>        class count
#>      compact   47
#>      midsize   41
#>          suv   62
#> SUVs have the most models in the dataset
```

Each bar's height equals the number of rows where `class` matches that label. You did not supply a y-axis, `geom_bar()` computed the count automatically.

To break each bar into subgroups, map a second variable to `fill`. The `position` argument controls whether bars stack or stand side by side.

```r
# Stacked vs dodged bars
# Stacked (default):
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar() +
  labs(title = "Stacked: Drive type within each class")
#> Each bar is split into colored segments for f, r, 4

# Dodged (side by side):
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  labs(title = "Dodged: Drive types side by side")
#> Separate bars for each drive type within each class
```

Stacked bars show the total per class while revealing subgroup proportions. Dodged bars make it easier to compare subgroup sizes directly.

[WARNING]
**geom_bar() counts rows; geom_col() uses a y value you provide.** If your data already has a "count" or "total" column, use `geom_col(aes(x = category, y = total))`. Using `geom_bar()` on pre-aggregated data double-counts.

**Try it:** Create a bar chart that counts how many cars have each number of cylinders (`cyl`), with bars filled by `drv`.

```r
# Try it: bar chart of cyl counts filled by drv
ex_bar <- ggplot(mpg, aes(x = factor(cyl), fill = drv)) +
  # your code here
  NULL

ex_bar
#> Expected: bars for 4, 5, 6, 8 cylinders, colored by drive type
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bar <- ggplot(mpg, aes(x = factor(cyl), fill = drv)) +
  geom_bar() +
  labs(x = "Cylinders", fill = "Drive Type")

ex_bar
#> Four bars, each split by drive type (f, r, 4)
```

**Explanation:** `factor(cyl)` treats cylinder count as a category. `fill = drv` colors the bar segments. `geom_bar()` handles the counting.

</details>

## How Do You Create a Histogram with geom_histogram()?

A histogram shows how a single numeric variable is distributed. It splits the range into bins and counts how many values fall into each bin. The shape of the histogram tells you whether the data is skewed, symmetric, or multimodal.

Let's look at the distribution of highway mileage.

```r
# Histogram of highway MPG with default bins
ggplot(mpg, aes(x = hwy)) +
  geom_histogram()
#> `stat_bin()` using `bins = 30`. Pick better value with `binwidth`.
#> The distribution is right-skewed with a peak around 26 MPG
```

ggplot2 picks 30 bins by default and prints a message telling you to choose a better `binwidth`. Always set `binwidth` explicitly so your chart tells an honest story.

Here is the same histogram with a custom bin width and fill color.

```r
# Histogram with explicit binwidth and styling
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 2, fill = "steelblue", color = "white") +
  labs(
    title = "Distribution of Highway Mileage",
    x = "Highway MPG",
    y = "Count"
  )
#> Bins are 2 MPG wide — the peak sits between 26 and 28
#> White borders separate the bars visually
```

Setting `binwidth = 2` means each bar covers a 2-MPG range. The `fill` argument colors the bars, and `color` adds a border. A narrower binwidth reveals more detail; a wider one smooths out noise.

[TIP]
**Always set binwidth explicitly.** The default 30 bins can hide real patterns or create fake ones. Start with a round number close to `(max - min) / 20` and adjust.

**Try it:** Create a histogram of `cty` (city mileage) with `binwidth = 3` and a fill color of your choice.

```r
# Try it: histogram of cty with binwidth = 3
ex_hist <- ggplot(mpg, aes(x = cty)) +
  # your code here
  NULL

ex_hist
#> Expected: a histogram with 3-MPG-wide bins
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_hist <- ggplot(mpg, aes(x = cty)) +
  geom_histogram(binwidth = 3, fill = "coral", color = "white") +
  labs(x = "City MPG", y = "Count")

ex_hist
#> Bins are 3 MPG wide, filled in coral with white borders
```

**Explanation:** `binwidth = 3` sets each bin to cover 3 MPG. Any fill color string works, try "darkgreen", "#3366CC", or other R color names.

</details>

## How Do You Plot a Line Chart with geom_line()?

Line charts show trends over an ordered variable, usually time. The `economics` dataset built into ggplot2 contains monthly US economic data from 1967 to 2015. Let's plot the unemployment count over time.

```r
# Line chart: US unemployment over time
ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line()
#> A line spanning 1967–2015 with peaks during recessions
#> The 2008–2010 spike is the highest point on the chart
```

`geom_line()` connects data points in x-order. Because `date` is already a Date column, ggplot2 formats the x-axis automatically.

Adding `geom_point()` on top highlights individual data points. This is useful when data is sparse.

```r
# Line + points with custom color and labels
ggplot(economics, aes(x = date, y = unemploy / 1000)) +
  geom_line(color = "steelblue", linewidth = 0.8) +
  geom_point(color = "steelblue", size = 0.3) +
  labs(
    title = "US Unemployment (1967–2015)",
    x = "Year",
    y = "Unemployed (thousands)"
  )
#> Dividing by 1000 converts the y-axis to thousands
#> geom_point() adds small dots at each month
```

Notice that you can stack multiple geom layers with `+`. Each layer draws on top of the previous one, so the points appear over the line.

[NOTE]
**geom_line() connects points in x-order.** If your x-axis is not sorted, the line will zigzag. Sort your data by the x column before plotting, or use `geom_path()` which connects points in row order.

**Try it:** Plot the personal savings rate (`psavert`) from the `economics` dataset over `date` as a line chart. Add a title.

```r
# Try it: line chart of psavert over time
ex_line <- ggplot(economics, aes(x = date, y = psavert)) +
  # your code here
  NULL

ex_line
#> Expected: a line chart showing savings rate declining over decades
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_line <- ggplot(economics, aes(x = date, y = psavert)) +
  geom_line() +
  labs(title = "US Personal Savings Rate Over Time")

ex_line
#> Savings rate drops from ~12% in 1967 to ~3% around 2005
```

**Explanation:** `psavert` is a numeric column in `economics`. `geom_line()` connects the monthly observations. The savings rate clearly trends downward.

</details>

## How Do You Draw a Boxplot with geom_boxplot()?

Boxplots show the median, quartiles, and outliers of a numeric variable. They are the best chart for comparing distributions across groups because they pack five summary statistics into one shape.

The thick line in the middle is the median. The box edges are the 25th and 75th percentiles. The whiskers extend to 1.5 times the interquartile range. Points beyond the whiskers are outliers.

Let's compare highway mileage across vehicle classes.

```r
# Boxplot: highway MPG by vehicle class
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot()
#> Subcompacts and compacts have higher median MPG
#> Pickups and SUVs have lower medians with more outliers
```

Each box represents one vehicle class. You can instantly see which classes get better mileage and which have more variability.

Adding `fill` and `coord_flip()` makes the chart easier to read when category names are long.

```r
# Boxplot with fill color and horizontal layout
ggplot(mpg, aes(x = class, y = hwy, fill = class)) +
  geom_boxplot(show.legend = FALSE) +
  coord_flip() +
  labs(
    title = "Highway Mileage by Vehicle Class",
    x = "",
    y = "Highway MPG"
  )
#> coord_flip() swaps axes so class names read horizontally
#> show.legend = FALSE removes the redundant legend
```

`coord_flip()` swaps the x and y axes so the category labels display horizontally. Setting `show.legend = FALSE` removes the legend, which is redundant when the axis already labels each group.

![Pick the right chart type based on your data and goal](screenshots/ggplot2-Getting-Started-choose-chart.webp)
*Figure 3: Pick the right chart type based on your data and goal.*

[KEY INSIGHT]
**Boxplots reveal outliers that histograms hide.** A histogram might look symmetric while individual outliers are invisible in the bins. A boxplot explicitly marks every outlier as a separate point.

**Try it:** Create a boxplot of `cty` (city mileage) grouped by `drv` (drive type).

```r
# Try it: boxplot of cty by drv
ex_box <- ggplot(mpg, aes(x = drv, y = cty)) +
  # your code here
  NULL

ex_box
#> Expected: three boxes for drive types f, r, and 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_box <- ggplot(mpg, aes(x = drv, y = cty)) +
  geom_boxplot() +
  labs(x = "Drive Type", y = "City MPG")

ex_box
#> Front-wheel drive (f) has the highest median city MPG
```

**Explanation:** `x = drv` creates one box per drive type. `y = cty` is the numeric variable being summarized.

</details>

## How Do You Customize Colors, Labels, and Themes?

You know how to build five chart types. Now let's make them look professional. ggplot2 has three customization layers: `labs()` for text, `scale_*()` for colors and axes, and `theme_*()` for the overall appearance.

Let's build a polished scatter plot step by step.

```r
# Polished scatter plot with labels, color scale, and theme
ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(alpha = 0.7, size = 2.5) +
  labs(
    title = "Engine Size vs Highway Mileage",
    subtitle = "Smaller engines generally get better fuel economy",
    x = "Engine Displacement (litres)",
    y = "Highway MPG",
    color = "Vehicle Class"
  ) +
  scale_color_brewer(palette = "Set2") +
  theme_minimal()
#> scale_color_brewer() applies a ColorBrewer palette
#> theme_minimal() removes the grey background
```

`scale_color_brewer(palette = "Set2")` swaps the default colors for a palette designed for readability. `theme_minimal()` strips the grey background and gridlines to a clean white canvas.

Faceting splits one chart into multiple panels, one per group. Use `facet_wrap()` to create a grid of small multiples.

```r
# Faceted scatter plot — one panel per drive type
ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(alpha = 0.7) +
  facet_wrap(~ drv) +
  labs(
    title = "Mileage by Drive Type",
    x = "Engine Displacement",
    y = "Highway MPG"
  ) +
  theme_bw()
#> Three panels: 4 (four-wheel), f (front), r (rear)
#> Each panel shows the scatter for that drive type only
```

`facet_wrap(~ drv)` creates one panel per unique value of `drv`. This is powerful for spotting patterns within subgroups that a single chart would obscure.

[TIP]
**theme_minimal() is a safe default for clean charts.** Other good options are `theme_bw()` (black-and-white borders), `theme_light()`, and `theme_classic()` (no gridlines).

**Try it:** Take any scatter plot from this tutorial, apply `theme_bw()`, and add a subtitle using `labs(subtitle = ...)`.

```r
# Try it: customize with theme_bw() and a subtitle
ex_custom <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  # your code here — add theme_bw() and a subtitle
  NULL

ex_custom
#> Expected: a scatter plot with black-and-white theme and a subtitle
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_custom <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  labs(
    title = "Engine Size vs Mileage",
    subtitle = "Data from the mpg dataset"
  ) +
  theme_bw()

ex_custom
#> Clean borders, white background, subtitle below the title
```

**Explanation:** `theme_bw()` adds clean box borders. `labs(subtitle = ...)` places smaller text directly under the title.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting the + between layers

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy))
  geom_point()
#> Error: Cannot use `geom_point()` with last_plot()
```

**Why it is wrong:** Without `+`, R treats the second line as a separate command. It tries to call `geom_point()` on its own, which fails.

✅ **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()
#> Works — the + connects the layers
```

### Mistake 2: Using geom_bar() on pre-aggregated data

❌ **Wrong:**
```r
# Data already has a count column
my_counts <- data.frame(
  fruit = c("Apple", "Banana", "Cherry"),
  count = c(30, 20, 10)
)
ggplot(my_counts, aes(x = fruit)) +
  geom_bar()
#> Each fruit gets height 1 — geom_bar() counts rows, ignoring your count column
```

**Why it is wrong:** `geom_bar()` counts the number of rows per category. Your data has one row per fruit, so every bar is height 1.

✅ **Correct:**
```r
my_counts <- data.frame(
  fruit = c("Apple", "Banana", "Cherry"),
  count = c(30, 20, 10)
)
ggplot(my_counts, aes(x = fruit, y = count)) +
  geom_col()
#> Apple = 30, Banana = 20, Cherry = 10
```

### Mistake 3: Putting aes() in the wrong place

❌ **Wrong:**
```r
ggplot(mpg) +
  geom_point(x = displ, y = hwy)
#> Error: object 'displ' not found
```

**Why it is wrong:** Column mappings must go inside `aes()`. Without `aes()`, R looks for objects named `displ` and `hwy` in your workspace instead of columns in the data frame.

✅ **Correct:**
```r
ggplot(mpg) +
  geom_point(aes(x = displ, y = hwy))
#> Works — aes() tells ggplot2 to look inside the data frame
```

### Mistake 4: Not setting binwidth in geom_histogram()

❌ **Wrong:**
```r
ggplot(mpg, aes(x = hwy)) +
  geom_histogram()
#> `stat_bin()` using `bins = 30`. Pick better value with `binwidth`.
#> The default 30 bins can distort the shape of the distribution
```

**Why it is wrong:** The default bin count splits the data into 30 equally spaced bins regardless of range. This can create misleading peaks or hide real patterns.

✅ **Correct:**
```r
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 2, fill = "steelblue", color = "white")
#> Each bin covers exactly 2 MPG — a deliberate, interpretable choice
```

## Practice Exercises

### Exercise 1: Scatter plot with facets

Build a scatter plot of `mpg` with `displ` on the x-axis and `hwy` on the y-axis. Color the points by `class`, add a title and axis labels, apply `theme_minimal()`, and facet the chart by `drv`.

```r
# Exercise 1: scatter plot with color, labels, theme, and facets
# Hint: chain geom_point() + labs() + scale_color_brewer() + theme_minimal() + facet_wrap()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_scatter <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(alpha = 0.7) +
  labs(
    title = "Engine Size vs Highway Mileage by Drive Type",
    x = "Engine Displacement (litres)",
    y = "Highway MPG",
    color = "Vehicle Class"
  ) +
  scale_color_brewer(palette = "Set2") +
  theme_minimal() +
  facet_wrap(~ drv)

my_scatter
#> Three panels (4, f, r), each showing the scatter by class
```

**Explanation:** This combines five concepts: geom_point for the scatter, labs for text, scale_color_brewer for the palette, theme_minimal for styling, and facet_wrap for panels.

</details>

### Exercise 2: Dodged bar chart with the diamonds dataset

Using the `diamonds` dataset (built into ggplot2), create a bar chart that counts how many diamonds exist in each `cut` category. Fill the bars by `color` (diamond color grade). Use `position = "dodge"` to place bars side by side. Add labels and apply `theme_bw()`.

```r
# Exercise 2: dodged bar chart from diamonds
# Hint: aes(x = cut, fill = color) + geom_bar(position = "dodge")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_bars <- ggplot(diamonds, aes(x = cut, fill = color)) +
  geom_bar(position = "dodge") +
  labs(
    title = "Diamond Count by Cut and Color",
    x = "Cut Quality",
    y = "Count",
    fill = "Color Grade"
  ) +
  theme_bw()

my_bars
#> Five groups of bars (Fair to Ideal), each with 7 color grades side by side
```

**Explanation:** `position = "dodge"` prevents stacking. The diamonds dataset has 53,940 rows, so the counts are large. `theme_bw()` gives clean borders.

</details>

### Exercise 3: Histogram and boxplot for the same variable

Create two separate charts for the `hwy` column from `mpg`. First, build a histogram with `binwidth = 2` and steelblue fill. Second, build a horizontal boxplot of `hwy` (no grouping, use `y = hwy` with an empty string for x). Use consistent colors in both charts.

```r
# Exercise 3: histogram + boxplot pair
# Hint: For the boxplot, try aes(x = "", y = hwy) + coord_flip()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Histogram
my_hist <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 2, fill = "steelblue", color = "white") +
  labs(title = "Highway MPG Distribution", x = "Highway MPG", y = "Count") +
  theme_minimal()

my_hist

# Boxplot
my_box <- ggplot(mpg, aes(x = "", y = hwy)) +
  geom_boxplot(fill = "steelblue", alpha = 0.5) +
  coord_flip() +
  labs(title = "Highway MPG Boxplot", x = "", y = "Highway MPG") +
  theme_minimal()

my_box
#> The histogram shows the shape; the boxplot highlights the median and outliers
```

**Explanation:** Using `aes(x = "", y = hwy)` with `coord_flip()` creates a single horizontal boxplot. Both charts use steelblue for visual consistency.

</details>

## Putting It All Together

Let's build one polished chart from scratch that uses everything you learned. We will load the data, explore it, and create a publication-ready scatter plot.

```r
# Complete example: from raw data to polished chart

# Step 1: Explore the data
str(mpg)
#> 234 obs. of 11 variables
#> displ: engine displacement (litres)
#> hwy: highway miles per gallon
#> class: type of car (compact, midsize, suv, etc.)

# Step 2: Build the chart layer by layer
p <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(alpha = 0.7, size = 2.5) +
  geom_smooth(method = "lm", se = FALSE, color = "grey40", linetype = "dashed") +
  labs(
    title = "Does Engine Size Predict Fuel Economy?",
    subtitle = "234 car models from 1999 and 2008",
    x = "Engine Displacement (litres)",
    y = "Highway Miles per Gallon",
    color = "Vehicle Class",
    caption = "Source: EPA fuel economy data (ggplot2::mpg)"
  ) +
  scale_color_brewer(palette = "Dark2") +
  theme_minimal() +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    plot.subtitle = element_text(color = "grey40")
  )

# Step 3: Display
p
#> A polished scatter with a dashed trend line
#> Larger engines clearly correlate with lower highway MPG
#> The 2seater class (sports cars) sits above the trend line
```

This chart combines six concepts: `geom_point()` for the scatter, `geom_smooth()` for a trend line, `labs()` for text, `scale_color_brewer()` for colors, `theme_minimal()` for layout, and `theme()` for fine-tuning text styles.

The dashed trend line (`method = "lm"`) fits a linear regression through all points. It confirms what the scatter suggests: bigger engines get worse mileage. The 2-seater class (sports cars) bucks the trend because they are lightweight despite large engines.

## Summary

Here is a quick-reference table for the five chart types you learned.

| Chart Type | Geometry | Use Case | Key Aesthetic | One-Line Code |
|---|---|---|---|---|
| Scatter plot | `geom_point()` | Relationship between two numbers | `color`, `size` | `ggplot(df, aes(x, y)) + geom_point()` |
| Bar chart | `geom_bar()` | Count categories | `fill` | `ggplot(df, aes(x)) + geom_bar()` |
| Histogram | `geom_histogram()` | Distribution of one number | `binwidth` | `ggplot(df, aes(x)) + geom_histogram(binwidth=N)` |
| Line chart | `geom_line()` | Trends over time | `color`, `linewidth` | `ggplot(df, aes(x, y)) + geom_line()` |
| Boxplot | `geom_boxplot()` | Compare group distributions | `fill` | `ggplot(df, aes(x, y)) + geom_boxplot()` |

Every chart follows the same pattern: `ggplot(data, aes(...)) + geom_*()`. Add `labs()` for text, `scale_*()` for colors, and `theme_*()` for styling.

## FAQ

**What is the difference between geom_bar() and geom_col()?**

`geom_bar()` counts rows automatically, you only map x. `geom_col()` uses a y value you provide, you map both x and y. Use `geom_bar()` for raw data and `geom_col()` for pre-aggregated summaries.

**How do I save a ggplot chart to a file?**

Use `ggsave()`. After creating your plot, call `ggsave("my_chart.png", width = 8, height = 5, dpi = 300)`. It saves the last displayed plot by default, or you can pass the plot object: `ggsave("my_chart.png", plot = p)`.

**Can I combine multiple chart types in one plot?**

Yes. Just add multiple geom layers with `+`. For example, `geom_point() + geom_smooth()` overlays a trend line on a scatter plot. Each geom can have its own aesthetics if you put `aes()` inside the geom call.

**How do I change the font size in ggplot2?**

Use the `theme()` layer. For example: `theme(axis.text = element_text(size = 12), plot.title = element_text(size = 16))`. Each text element (title, subtitle, axis labels, legend text) can be sized independently.

**What is the difference between color and fill?**

`color` controls the outline of shapes (points, lines, bar borders). `fill` controls the interior of filled shapes (bars, boxes, areas). For `geom_point()`, use `color`. For `geom_bar()` and `geom_boxplot()`, use `fill` for the main color and `color` for the border.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). [Link](https://ggplot2-book.org/)
2. ggplot2 documentation, tidyverse.org. [Link](https://ggplot2.tidyverse.org/)
3. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 2: Data Visualization. [Link](https://r4ds.hadley.nz/data-visualize)
4. RStudio, Data Visualization with ggplot2 Cheat Sheet. [Link](https://rstudio.github.io/cheatsheets/html/data-visualization.html)
5. Wilkinson, L., *The Grammar of Graphics*. Springer (2005).
6. R Graph Gallery, ggplot2 section. [Link](https://r-graph-gallery.com/)
7. Scherer, C., A ggplot2 Tutorial for Beautiful Plotting in R (2019). [Link](https://www.cedricscherer.com/2019/08/05/a-ggplot2-tutorial-for-beautiful-plotting-in-r/)

## Continue Learning

Now that you can build five chart types, here are your next steps on r-statistics.co:

- **[ggplot2 Tutorial 2 - Customizing Themes](Complete-Ggplot2-Tutorial-Part2-Customizing-Theme-With-R-Code.html)**, Master the `theme()` function, build custom themes from scratch, and control every visual detail of your charts.
- **[Top 50 ggplot2 Visualizations](Top50-Ggplot2-Visualizations-MasterList-R-Code.html)**, Explore 50 chart types with complete code: area plots, density plots, bubble charts, waffle charts, and more.
