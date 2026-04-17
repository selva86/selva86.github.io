---
title: "Ridgeline Plot in R: Compare Many Distributions with ggridges"
slug: "Ridgeline-Plot-in-R"
description: "Create ridgeline plots in R with the ggridges package. Learn geom_density_ridges(), gradient fills, jitter points, stat_density_ridges(), and when to use them over violin plots."
keywords: "ridgeline plot R, ggridges R, geom_density_ridges, ridgeline plot ggplot2, joy plot R, density ridges R, ggridges tutorial"
auto_link_terms: "ridgeline plot in R|ggridges|geom_density_ridges()|density ridges ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-char-2"
post_type: "C"
fr_parent: "ggplot2-Distribution-Charts.html"
sidebar_section: "Visualization"
sidebar_title: "Ridgeline Plot"
difficulty: "Intermediate"
---

# Ridgeline Plot in R: Compare Many Distributions with ggridges

<p class="lead">A ridgeline plot stacks density curves vertically, one per group, letting you compare many distributions at once without the clutter of overlapping violin plots. The <code>ggridges</code> package brings this chart type to ggplot2 with a single geom and a clean API.</p>

## Introduction

Once you have more than 5-6 groups to compare, violin plots become a wall of shapes that's hard to scan. Ridgeline plots (sometimes called joy plots) solve this by stacking the density curves vertically with slight overlap between rows, the mountain ridge shape that gives them their name.

Each curve shows the same information as a density plot, where values cluster, how spread they are, whether the distribution is symmetric or skewed, but the stacked layout lets you read down the page and compare groups naturally, the way you would scan a table.

The `ggridges` package by Claus Wilke integrates seamlessly with ggplot2. You replace `geom_density()` with `geom_density_ridges()` and add a y aesthetic that maps to your grouping variable, everything else follows the ggplot2 grammar you already know.

In this tutorial you will learn:

- How to draw a basic ridgeline plot with `geom_density_ridges()`
- How to color ridges by group or use gradient fills
- How to add quantile lines and jitter points
- How to adjust bandwidth for smoother or more detailed curves
- When ridgeline plots are the right choice over violin plots

## How Does geom_density_ridges() Stack Distributions?

`geom_density_ridges()` draws a density curve for each level of the y aesthetic, stacked vertically from bottom to top. The x aesthetic is the continuous variable whose distribution you're showing; the y aesthetic is the grouping factor.

```r
library(ggplot2)
library(ggridges)

# Basic ridgeline: highway MPG distribution by vehicle class
p_basic <- ggplot(mpg, aes(x = hwy, y = class)) +
  geom_density_ridges() +
  labs(
    title = "Highway MPG Distribution by Vehicle Class",
    x     = "Highway MPG",
    y     = "Vehicle Class"
  ) +
  theme_ridges()  # clean ggridges theme

p_basic
```

`theme_ridges()` is a minimal theme from the `ggridges` package, it removes the x-axis grid lines and adjusts spacing to complement the stacked layout. You can also use `theme_minimal()` or any ggplot2 theme.

The curves overlap slightly by default, this overlap is controlled by the `scale` parameter (not to be confused with ggplot2 scale functions). `scale = 1` means no overlap; `scale = 2` means the tallest peak of each curve reaches the baseline of the next group above it.

```r
# Adjust overlap between ridges
p_overlap <- ggplot(mpg, aes(x = hwy, y = reorder(class, hwy, FUN = median))) +
  geom_density_ridges(scale = 2, rel_min_height = 0.01) +
  labs(
    title = "Ridge overlap: scale = 2 (groups sorted by median MPG)",
    x     = "Highway MPG",
    y     = NULL
  ) +
  theme_ridges()

p_overlap
```

`reorder(class, hwy, FUN = median)` sorts the y-axis by median highway MPG, so the most fuel-efficient class sits at the top and the least efficient at the bottom. `rel_min_height = 0.01` trims the long thin tails of each ridge where the density is less than 1% of the peak height.

> **KEY INSIGHT:** Sort the y-axis by a meaningful statistic (median, mean, or range). Alphabetical order hides patterns, sorted order lets you immediately see which group is highest, which is lowest, and whether groups form natural clusters.

**Try it:** Change `FUN = median` to `FUN = mean`. Does the group ordering change significantly?

```r
# Your code here — sort the y-axis by mean instead of median
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mean_sort <- ggplot(mpg, aes(x = hwy, y = reorder(class, hwy, FUN = mean))) +
  geom_density_ridges(scale = 1.5, rel_min_height = 0.01) +
  labs(x = "Highway MPG", y = NULL) +
  theme_ridges()

ex_mean_sort
```

The ordering barely shifts, median and mean track closely here because most vehicle-class distributions are only mildly skewed. Differences appear only when a class has an extreme outlier that pulls its mean away from its median (pickup, for instance, has a couple of high-efficiency trucks that nudge the mean up). As a rule, use median when distributions are skewed or have outliers, and mean when they're roughly symmetric.
</details>

## How Do You Color Ridges by Group or Apply Gradient Fills?

The simplest coloring strategy maps the grouping variable to `fill`, each ridge gets a distinct color:

```r
p_fill <- ggplot(mpg,
    aes(x = hwy, y = reorder(class, hwy, FUN = median),
        fill = class)) +
  geom_density_ridges(alpha = 0.8, color = "white", scale = 1.5,
                       rel_min_height = 0.01) +
  scale_fill_brewer(palette = "Set2") +
  labs(
    title = "Ridgeline with per-group color fill",
    x     = "Highway MPG",
    y     = NULL
  ) +
  theme_ridges() +
  theme(legend.position = "none")  # y-axis labels identify groups already

p_fill
```

For a more sophisticated look, use a **gradient fill** where the color within each ridge encodes the x-value magnitude. The `ggridges` fill aesthetic supports this with `fill = after_stat(x)`, colors shift from cool to warm as x increases:

```r
p_gradient <- ggplot(mpg,
    aes(x = hwy, y = reorder(class, hwy, FUN = median),
        fill = after_stat(x))) +
  geom_density_ridges_gradient(
    scale           = 1.5,
    rel_min_height  = 0.01,
    gradient_lwd    = 0.5
  ) +
  scale_fill_viridis_c(option = "plasma", name = "Hwy MPG") +
  labs(
    title    = "Gradient fill: color encodes MPG value within each ridge",
    subtitle = "Warm = high MPG, cool = low MPG",
    x        = "Highway MPG",
    y        = NULL
  ) +
  theme_ridges() +
  theme(legend.position = "right")

p_gradient
```

`geom_density_ridges_gradient()` is a variant of `geom_density_ridges()` specifically designed for gradient fills, it splits each ridge into many thin vertical slices, each colored by its x-position. `after_stat(x)` maps the computed x value (from the density estimation) to the fill aesthetic.

> **TIP:** Gradient fills are visually striking but encode the x-variable twice, once on the horizontal axis and again as color. This is redundant but it draws attention to the distribution shape and makes the chart more memorable. Use it when the chart is standalone (a report cover, a presentation slide) rather than in dense analytical dashboards.

**Try it:** Change `option = "plasma"` to `option = "magma"` in `scale_fill_viridis_c()`. How does the color temperature change?

```r
# Your code here — swap the gradient to option = "magma"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_magma_ridges <- ggplot(mpg,
    aes(x = hwy, y = reorder(class, hwy, FUN = median),
        fill = after_stat(x))) +
  geom_density_ridges_gradient(scale = 1.5, rel_min_height = 0.01) +
  scale_fill_viridis_c(option = "magma", name = "Hwy MPG") +
  theme_ridges()

ex_magma_ridges
```

`magma` runs from near-black at the low end through deep purple and red to pale yellow at the top, moodier and warmer overall than `plasma`'s blue-to-yellow ramp. The visual contrast is slightly lower because magma spends more of its range in dark hues, which can be an advantage for print where dark colors reproduce more consistently. Both are perceptually uniform and colorblind-safe, so the choice is mostly aesthetic.
</details>

## How Do You Add Quantile Lines and Jitter Points?

`stat_density_ridges()` is the underlying stat for ridgeline density computation. It accepts a `quantile_lines = TRUE` argument that draws vertical lines at specified quantiles across each ridge, a quick way to show where the median and quartiles fall without an embedded boxplot.

```r
# Quantile lines at 25th, 50th, 75th percentiles
p_quantile <- ggplot(mpg,
    aes(x = hwy, y = reorder(class, hwy, FUN = median))) +
  stat_density_ridges(
    aes(fill = factor(stat(quantile))),
    geom           = "density_ridges_gradient",
    calc_ecdf      = TRUE,
    quantiles      = c(0.25, 0.75),
    quantile_lines = TRUE,
    scale          = 1.5,
    rel_min_height = 0.01
  ) +
  scale_fill_manual(
    values = c("#E0F3DB", "#A8DDB5", "#43A2CA"),
    labels = c("Bottom 25%", "Middle 50%", "Top 25%"),
    name   = "Quantile"
  ) +
  labs(
    title = "Ridgeline with quantile shading and lines",
    x     = "Highway MPG",
    y     = NULL
  ) +
  theme_ridges()

p_quantile
```

For small datasets, showing individual data points on top of the ridgeline gives readers raw data context. Set `jittered_points = TRUE` directly in `geom_density_ridges()`:

```r
# Ridgeline + jittered raw data points
p_jitter <- ggplot(iris,
    aes(x = Sepal.Length, y = Species, fill = Species)) +
  geom_density_ridges(
    jittered_points  = TRUE,
    scale            = 0.95,
    rel_min_height   = 0.01,
    alpha            = 0.7,
    point_size       = 1.5,
    point_alpha      = 0.6,
    position         = position_raincloud(width = 0.05, height = 0.1)
  ) +
  scale_fill_brewer(palette = "Set2") +
  labs(
    title = "Ridgeline + jitter: shape and raw data together",
    x     = "Sepal Length (cm)",
    y     = "Species"
  ) +
  theme_ridges() +
  theme(legend.position = "none")

p_jitter
```

`position_raincloud()` places jitter points below the density ridge rather than inside it, the "raincloud" layout that shows both the cloud (density) and the rain (data points) in a compact arrangement.

> **WARNING:** `jittered_points = TRUE` works well only for small to medium datasets (under ~200 points per group). With large datasets, the points form dense bands that obscure the density curve they're supposed to annotate. For large data, use the density ridge alone.

**Try it:** Remove `position = position_raincloud(...)` from `p_jitter`. How does the position of the jitter points change?

```r
# Your code here — drop position_raincloud() and see where points land
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_no_raincloud <- ggplot(iris,
    aes(x = Sepal.Length, y = Species, fill = Species)) +
  geom_density_ridges(
    jittered_points = TRUE,
    scale = 0.95, alpha = 0.7,
    point_size = 1.5, point_alpha = 0.6
  ) +
  scale_fill_brewer(palette = "Set2") +
  theme_ridges() + theme(legend.position = "none")

ex_no_raincloud
```

Without `position_raincloud()`, the jittered points sit on the *baseline* of each ridge, right under the density curve, rather than in a separate band below it. That's fine when you have a small amount of data like `iris`, but on denser groups the points get hidden behind the filled curve. The raincloud layout trades a little extra vertical space for a cleaner separation between "the distribution" and "the raw observations."
</details>

## When Should You Use a Ridgeline Plot Instead of a Violin Plot?

This is the most practical question about ridgeline plots. Both show distribution shape, so the choice comes down to number of groups and the direction of comparison.

| Situation | Best Choice | Reason |
|---|---|---|
| 2-5 groups | Violin plot | Side-by-side violins are easier to compare at low count |
| 6-15 groups | Ridgeline plot | Stacked layout avoids a wide, cluttered chart |
| 15+ groups | Ridgeline plot (or faceted density) | Violins become unreadable at this scale |
| Comparing across time (months, years) | Ridgeline plot | Temporal ordering reads naturally top-to-bottom |
| Showing bimodal distributions clearly | Either, but ridgeline may show peaks more clearly | More horizontal space per curve in ridgeline |
| Embedding in a dashboard or tight layout | Violin plot | More compact width for a few groups |

The built-in `lincoln_weather` dataset from `ggridges` is a classic ridgeline example, 12 months of temperature data, where the stacked layout makes seasonal progression immediately readable:

```r
# Lincoln, Nebraska temperature by month - a classic ridgeline use case
p_final <- ggplot(lincoln_weather,
    aes(x = `Mean Temperature [F]`,
        y = Month,
        fill = after_stat(x))) +
  geom_density_ridges_gradient(
    scale           = 3,
    rel_min_height  = 0.01,
    gradient_lwd    = 0.5,
    color           = "white"
  ) +
  scale_y_discrete(limits = rev) +  # Jan at top, Dec at bottom
  scale_fill_viridis_c(
    option = "plasma",
    name   = "Temp (°F)"
  ) +
  labs(
    title    = "Monthly Temperature Distribution in Lincoln, NE",
    subtitle = "Gradient color encodes temperature within each monthly ridge",
    x        = "Mean Temperature (°F)",
    y        = NULL,
    caption  = "Source: ggridges::lincoln_weather"
  ) +
  theme_ridges(grid = FALSE) +
  theme(
    plot.title    = element_text(face = "bold"),
    axis.text.y   = element_text(size = 10),
    legend.position = "right"
  )

p_final
```

The seasonal pattern jumps out immediately: cold, narrow distributions in winter months (tight cluster of low values); warm, wider distributions in summer (broader spread of higher values). A violin plot of 12 groups would be a visual mess.

> **KEY INSIGHT:** Ridgeline plots shine when the order of groups carries meaning, time series (months, years), ranked categories (score bands), or any sequence where reading top-to-bottom tells a story. When groups are unordered, violin plots or boxplots are usually better.

**Try it:** Replace `scale_y_discrete(limits = rev)` with its removal (delete the line). Does January or December now appear at the top?

```r
# Your code here — drop scale_y_discrete(limits = rev) and see what happens
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_no_rev <- ggplot(lincoln_weather,
    aes(x = `Mean Temperature [F]`, y = Month,
        fill = after_stat(x))) +
  geom_density_ridges_gradient(scale = 3, rel_min_height = 0.01) +
  scale_fill_viridis_c(option = "plasma") +
  theme_ridges()

ex_no_rev
```

Without the reversal, ggplot2 draws discrete factor levels bottom-up by default, so January lands at the **bottom** and December at the top. That feels backwards for a calendar view because humans read top-to-bottom and expect the earliest month first. `scale_y_discrete(limits = rev)` flips the order so January appears at the top, matching the left-to-right reading flow on a standard calendar page.
</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using ridgeline plots with too few groups

❌ A ridgeline plot with 2-3 groups wastes vertical space and is harder to compare than side-by-side violin plots or faceted density plots.

✅ Use ridgeline plots when you have at least 5-6 groups. For fewer groups, `geom_violin()` or `geom_density()` with `facet_wrap()` is cleaner.

### Mistake 2: Leaving groups in alphabetical or arbitrary order

❌ Alphabetical group ordering hides any meaningful ranking and forces readers to mentally reorder the data.

✅ Sort by a meaningful statistic: `reorder(group, x, FUN = median)` sorts by median. For time-ordered groups (months, years), use `factor(month, levels = month.name)` to fix the calendar order.

### Mistake 3: Setting scale too high, ridges cover earlier ones

❌ `scale = 5` makes tall peaks from one row cover the labels or curves of the row above, creating overlapping spaghetti.

✅ Start with `scale = 1` (no overlap) and increase gradually. For most datasets, `scale = 1.5` to `2` looks clean without excessive overlap.

### Mistake 4: Using gradient fill with too many groups

❌ `geom_density_ridges_gradient()` with 15+ groups renders slowly and can produce a visually overwhelming chart.

✅ For large group counts, use a single color with `fill = group` and `scale_fill_viridis_d()` for discrete colorblind-safe colors.

### Mistake 5: Forgetting rel_min_height trims long tails

❌ Without `rel_min_height`, density curves extend into very long thin tails that visually suggest data exists far outside the actual range.

✅ Set `rel_min_height = 0.01` to trim any part of the density curve that falls below 1% of the peak, this keeps the plot clean without losing meaningful information.

## Practice Exercises

### Exercise 1: Monthly airline passenger distributions

Using the built-in `AirPassengers` dataset, convert it to a data frame with `month` and `passengers` columns. Create a ridgeline plot of passenger count by month (sorted January at top to December at bottom). Use a gradient fill with `scale_fill_viridis_c(option = "viridis")`.

```r
# Convert AirPassengers time series to data frame
ap_df <- data.frame(
  month      = factor(rep(month.name, times = 12),
                      levels = rev(month.name)),
  year       = rep(1949:1960, each = 12),
  passengers = as.numeric(AirPassengers)
)

# Your ridgeline code here:
# ggplot(ap_df, aes(x = passengers, y = month, fill = after_stat(x))) +
#   geom_density_ridges_gradient(...) +
#   scale_fill_viridis_c(option = "viridis")
```

### Exercise 2: Compare ridgeline vs violin for diamonds data

Using `diamonds`, create both a ridgeline plot and a violin plot of `price` by `cut`. Then compare: which chart makes it easier to see that "Premium" cut has a very wide price range while "Ideal" cut clusters more tightly? Which layout is more compact?

```r
# Ridgeline version
# ggplot(diamonds, aes(x = price, y = cut, fill = cut)) +
#   geom_density_ridges(scale = 1.5, rel_min_height = 0.01, alpha = 0.8) +
#   scale_fill_brewer(palette = "Set2") + theme_ridges()

# Violin version for comparison
# ggplot(diamonds, aes(x = cut, y = price, fill = cut)) +
#   geom_violin() + scale_fill_brewer(palette = "Set2")
```

## Complete Example

The `lincoln_weather` dataset from `ggridges` (already shown in the comparison section) is the canonical ridgeline example. Here's a fully polished version with annotation:

```r
# Fully polished Lincoln weather ridgeline
month_order <- rev(c("January","February","March","April","May","June",
                      "July","August","September","October","November","December"))

p_complete <- ggplot(lincoln_weather,
    aes(x     = `Mean Temperature [F]`,
        y     = factor(Month, levels = month_order),
        fill  = after_stat(x))) +
  geom_density_ridges_gradient(
    scale          = 2.5,
    rel_min_height = 0.01,
    gradient_lwd   = 0.5,
    color          = "white"
  ) +
  scale_fill_viridis_c(
    option = "plasma",
    name   = "Temp (°F)",
    breaks = c(0, 20, 40, 60, 80)
  ) +
  scale_x_continuous(
    breaks = seq(-10, 90, by = 20),
    labels = function(x) paste0(x, "°F")
  ) +
  labs(
    title    = "Lincoln, Nebraska: Temperature Distribution by Month",
    subtitle = "Each ridge = one month of daily mean temperatures (2016)",
    x        = NULL,
    y        = NULL,
    caption  = "Source: ggridges::lincoln_weather"
  ) +
  theme_ridges(grid = FALSE) +
  theme(
    plot.title      = element_text(face = "bold", size = 14),
    plot.subtitle   = element_text(color = "grey50", size = 10),
    legend.position = "bottom",
    legend.key.width = unit(2, "cm")
  )

p_complete
```

## Summary

| Task | Code |
|---|---|
| Basic ridgeline | `geom_density_ridges()` |
| Control overlap | `geom_density_ridges(scale = 1.5)` |
| Trim long tails | `geom_density_ridges(rel_min_height = 0.01)` |
| Fill by group | `aes(fill = group)` + `scale_fill_brewer()` |
| Gradient fill | `geom_density_ridges_gradient()` + `aes(fill = after_stat(x))` |
| Quantile lines | `stat_density_ridges(quantile_lines = TRUE, quantiles = c(0.25, 0.75))` |
| Jitter points | `geom_density_ridges(jittered_points = TRUE)` |
| Raincloud layout | `position = position_raincloud()` |
| Sort by median | `y = reorder(group, x, FUN = median)` |
| Clean theme | `theme_ridges()` |

When to use ridgelines:
- **5+ groups**, ridgeline is more readable than side-by-side violins
- **Time-ordered groups**, months, years, age bands read naturally top-to-bottom
- **Showing distributional shift across categories**, each ridge's shape and position tells the story at a glance

## FAQ

**Does ggridges need to be installed separately from ggplot2?**

Yes. Install once with `install.packages("ggridges")`, then load in each session with `library(ggridges)`. The `ggridges` package is on CRAN and maintained by Claus Wilke.

**What is the difference between scale and bandwidth in geom_density_ridges()?**

`scale` controls the height/overlap between ridges, how much each ridge extends into the row above it. `bandwidth` (set via the `bw` argument) controls the smoothness of the kernel density estimate within each ridge, similar to `adjust` in `geom_violin()`. These are independent settings.

**How do I draw a ridgeline plot with a discrete x-axis?**

`geom_density_ridges()` is designed for continuous x. For discrete x (counts per category per group), use a heatmap (`geom_tile()`) or a faceted bar chart instead.

**Can I use a cyclic y-axis (e.g., months wrapping from December back to January)?**

Not natively in ggridges. The y-axis is a standard discrete scale. For cyclical time data, use `factor(month, levels = month.name)` to set calendar order, then let the year wrap at the chart boundary.

**How do I make ridgelines fill to the baseline (no transparency below the curve)?**

By default, ridgeline density curves are filled above the x-axis. Set `alpha = 1` and `color = "white"` for fully opaque fills with visible edges between ridges.

## References

1. Wilke, C. O. ggridges package documentation. https://wilkelab.org/ggridges/
2. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 9: Visualizing Many Distributions. https://clauswilke.com/dataviz/
3. ggridges CRAN page and vignettes. https://cran.r-project.org/package=ggridges
4. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer. https://ggplot2-book.org/
5. R Graph Gallery, Ridgeline Charts. https://r-graph-gallery.com/ridgeline-plot.html

## Continue Learning

- **ggplot2 Distribution Charts**, the complete guide to histograms, density plots, boxplots, and violin plots, the foundation that ridgeline plots extend.
- **Violin Plot in R**, similar distribution visualization with a different emphasis; better for 2-5 groups with embedded boxplots.
- **R Color Theory**, apply gradient fills and colorblind-safe palettes (like viridis) to ridgeline and other charts.
