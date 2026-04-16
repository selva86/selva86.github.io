---
title: "ggplot2 vs matplotlib: The Definitive Data Visualization Language Comparison: Which Is Right for You?"
slug: "ggplot2-vs-matplotlib"
description: "Compare ggplot2 and matplotlib side by side — syntax, defaults, faceting, and extensions. Runnable R examples help you choose the right visualization library."
keywords: "ggplot2 vs matplotlib, ggplot2 vs matplotlib comparison, R vs Python visualization, grammar of graphics vs matplotlib, data visualization R Python, ggplot vs matplotlib, ggplot2 matplotlib difference"
auto_link_terms: "ggplot2 vs matplotlib|ggplot vs matplotlib|ggplot2 versus matplotlib|matplotlib vs ggplot2|R vs Python visualization|grammar of graphics comparison"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "CMP6"
post_type: "FR"
fr_parent: "ggplot2-Grammar-of-Graphics.html"
difficulty: "Intermediate"
---

# ggplot2 vs matplotlib: The Definitive Data Visualization Language Comparison: Which Is Right for You?

<p class="lead">ggplot2 (R) and matplotlib (Python) are the two most widely used data visualization libraries in data science. ggplot2 uses a declarative grammar-of-graphics approach where you describe <em>what</em> to plot, while matplotlib uses an imperative style where you specify <em>how</em> to draw each element. This guide compares them side by side with runnable R code so you can see ggplot2's strengths firsthand.</p>

## What makes ggplot2 and matplotlib fundamentally different?

The split comes down to philosophy. ggplot2 descends from Leland Wilkinson's *Grammar of Graphics* — you declare mappings between your data and visual properties (position, colour, size), then add layers. matplotlib descends from MATLAB's procedural plotting model — you create a figure, call drawing commands one by one, and manually style each element.

Let's see the difference immediately. Here's a scatter plot of fuel efficiency vs horsepower, coloured by number of cylinders:

```r
library(ggplot2)

ggplot(mtcars, aes(x = hp, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "Fuel Efficiency vs Horsepower",
       x = "Horsepower", y = "Miles per Gallon",
       color = "Cylinders")
#> A scatter plot with 32 points, coloured by 4, 6, and 8 cylinders.
#> 4-cylinder cars cluster at high mpg / low hp; 8-cylinder cars at low mpg / high hp.
```

Three lines of plotting code, and ggplot2 handled the axes, legend, colours, and spacing automatically. The equivalent in matplotlib would look something like this (shown as comments since we're running R):

```r
# matplotlib equivalent (Python) — for comparison only:
# fig, ax = plt.subplots()
# for cyl, group in df.groupby('cyl'):
#     ax.scatter(group['hp'], group['mpg'], label=str(cyl), s=50)
# ax.set_xlabel('Horsepower')
# ax.set_ylabel('Miles per Gallon')
# ax.set_title('Fuel Efficiency vs Horsepower')
# ax.legend(title='Cylinders')
# plt.show()
#
# Notice: matplotlib requires a manual loop to colour by group,
# explicit axis labels, and a separate legend call.
# ggplot2 does all of this from a single aesthetic mapping: color = factor(cyl)
```

The core difference is this: in ggplot2, you say "map `cyl` to colour" and the library figures out the rest. In matplotlib, you loop through groups, plot each one, and set the legend yourself.

[KEY INSIGHT]
**ggplot2 separates what to show from how to show it.** Change `geom_point()` to `geom_boxplot()` and the same aesthetic mappings produce a completely different chart — no rewriting required. In matplotlib, switching chart types usually means rewriting the entire plot.

**Try it:** Modify the scatter plot to also map `wt` (weight) to point size. Add `size = wt` inside the `aes()` call and see how ggplot2 automatically creates a size legend.

```r
# Try it: add size aesthetic
ggplot(mtcars, aes(x = hp, y = mpg, color = factor(cyl), size = wt)) +
  geom_point() +
  labs(title = "MPG vs HP (size = weight)",
       x = "Horsepower", y = "MPG",
       color = "Cylinders")
#> Expected: same scatter but heavier cars have larger points, with a size legend added
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mtcars, aes(x = hp, y = mpg, color = factor(cyl), size = wt)) +
  geom_point() +
  labs(title = "MPG vs HP (size = weight)",
       x = "Horsepower", y = "MPG",
       color = "Cylinders", size = "Weight (1000 lbs)")
#> Points now vary in size. Heavy 8-cylinder cars appear as large dots
#> in the lower-right; light 4-cylinder cars are small dots in the upper-left.
```

**Explanation:** Adding `size = wt` inside `aes()` maps the weight variable to point size. ggplot2 automatically scales the sizes and adds a legend — no extra code needed.

</details>

## How does the syntax compare for common chart types?

One of ggplot2's biggest advantages is consistency. Every chart follows the same pattern: `ggplot(data, aes(...)) + geom_*()`. Switching from a scatter plot to a bar chart means changing one word. In matplotlib, each chart type has its own function with different parameters.

Let's walk through three common chart types — bar, histogram, and line — all using the same ggplot2 pattern.

A bar chart counting how many cars have 4, 6, or 8 cylinders:

```r
p_bar <- ggplot(mtcars, aes(x = factor(cyl), fill = factor(cyl))) +
  geom_bar() +
  labs(title = "Cars by Cylinder Count",
       x = "Cylinders", y = "Count") +
  theme(legend.position = "none")
p_bar
#> Bar chart: 4-cyl = 11 cars, 6-cyl = 7 cars, 8-cyl = 14 cars.
#> Each bar is automatically coloured by cylinder group.
```

Notice that `geom_bar()` counts the observations for you — you don't need to pre-compute frequencies. In matplotlib, you would call `value_counts()` first, then pass the result to `plt.bar()`.

Now a histogram of fuel efficiency:

```r
p_hist <- ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(bins = 10, fill = "steelblue", color = "white") +
  labs(title = "Distribution of MPG", x = "Miles per Gallon", y = "Count")
p_hist
#> Histogram showing mpg distribution centered around 15-20 mpg,
#> with a right tail extending to 33 mpg.
```

And a line chart showing daily temperature over time using the airquality dataset:

```r
aq <- airquality[complete.cases(airquality), ]
aq$Date <- as.Date(paste("1973", aq$Month, aq$Day, sep = "-"))

p_line <- ggplot(aq, aes(x = Date, y = Temp)) +
  geom_line(color = "coral") +
  geom_smooth(method = "loess", se = FALSE, color = "darkred", linewidth = 1.2) +
  labs(title = "Daily Temperature (New York, 1973)",
       x = "Date", y = "Temperature (°F)")
p_line
#> Line chart with raw daily temps (coral) and a smooth trend (dark red).
#> Temperature peaks in July-August around 90°F.
```

All three charts used the exact same ggplot2 structure. The only thing that changed was the geom function.

[TIP]
**Switching chart types in ggplot2 means changing one word — the geom.** Replace `geom_histogram()` with `geom_density()` and you get a density curve. Replace `geom_bar()` with `geom_col()` for pre-computed values. In matplotlib, each chart type often means learning a different API.

**Try it:** Create a boxplot showing mpg grouped by cyl. Use `geom_boxplot()` with `x = factor(cyl)` and `y = mpg`.

```r
# Try it: create a boxplot
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  # your code here
  labs(title = "MPG by Cylinder Count", x = "Cylinders", y = "MPG")
#> Expected: three side-by-side boxplots showing that 4-cyl cars have the highest mpg
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mtcars, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  geom_boxplot() +
  labs(title = "MPG by Cylinder Count", x = "Cylinders", y = "MPG") +
  theme(legend.position = "none")
#> Three boxplots: 4-cyl median ~26 mpg, 6-cyl ~20 mpg, 8-cyl ~15 mpg.
#> The spread decreases as cylinder count increases.
```

**Explanation:** `geom_boxplot()` automatically computes the median, quartiles, and outliers. Adding `fill = factor(cyl)` colours each box.

</details>

## How do defaults and themes compare?

matplotlib's default plots are functional but plain — gray backgrounds, small fonts, and generic colour palettes. Getting a publication-ready matplotlib chart requires 10-20 lines of style configuration. ggplot2 ships with polished defaults out of the box, and its theme system lets you swap the entire look with a single function call.

Here's the same scatter plot with three different built-in themes:

```r
base_plot <- ggplot(mtcars, aes(x = hp, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  labs(x = "Horsepower", y = "MPG", color = "Cylinders")

p1 <- base_plot + ggtitle("theme_gray (default)") + theme_gray()
p2 <- base_plot + ggtitle("theme_minimal") + theme_minimal()
p3 <- base_plot + ggtitle("theme_classic") + theme_classic()

p2
#> Clean, minimalist chart with no background fill and light grid lines.
#> Looks publication-ready without any customisation.
```

The theme system is composable — you start with a complete theme and layer adjustments on top. Want `theme_minimal()` but with a larger title and the legend at the bottom? One line:

```r
p_custom <- base_plot +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    legend.position = "bottom",
    axis.text = element_text(size = 11)
  ) +
  ggtitle("Custom Theme")
p_custom
#> Minimal theme with bold title (16pt), legend below the chart,
#> and larger axis labels. Clean and professional.
```

In matplotlib, the equivalent requires setting `plt.rcParams` globally or calling `ax.set_*` for each property individually. There's no concept of layering style changes on top of a base theme.

[KEY INSIGHT]
**ggplot2 themes are composable — start from a base theme and override only what you need.** This means you never start from scratch. In matplotlib, style sheets exist but they're all-or-nothing: you can't easily layer `ggplot-style` + `bigger-title` + `bottom-legend` the way ggplot2 does.

**Try it:** Apply `theme_classic()` to the base plot and move the legend to `"top"` using the `theme()` function.

```r
# Try it: classic theme + top legend
ex_themed <- base_plot +
  theme_classic() +
  theme(
    # your code here: move legend to top
  ) +
  ggtitle("Classic + Top Legend")
#> Expected: classic theme (white background, axis lines, no grid) with legend at top
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_themed <- base_plot +
  theme_classic() +
  theme(legend.position = "top") +
  ggtitle("Classic + Top Legend")
ex_themed
#> White background with clean axis lines (no grid).
#> Legend sits at the top of the chart instead of the right side.
```

**Explanation:** `theme_classic()` gives you a white background with axis lines only. Adding `theme(legend.position = "top")` overrides just the legend placement without affecting anything else.

</details>

## Why is faceting ggplot2's killer feature?

Faceting — splitting a single chart into multiple panels by a categorical variable — is where ggplot2 leaves matplotlib far behind. In ggplot2, it's one line: `facet_wrap(~variable)`. In matplotlib, you need to create a grid of subplots, loop through groups, plot each one separately, and manage shared axes. That's typically 10-15 lines of boilerplate.

Here's faceting in action. Let's split our scatter plot by cylinder count:

```r
ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point(size = 2, color = "steelblue") +
  facet_wrap(~cyl, labeller = label_both) +
  labs(title = "MPG vs HP by Cylinder Count",
       x = "Horsepower", y = "MPG") +
  theme_minimal()
#> Three panels side by side: cyl = 4, cyl = 6, cyl = 8.
#> Each panel shows only its group's data with shared axes.
#> 4-cylinder cars: low hp, high mpg. 8-cylinder: high hp, low mpg.
```

One line — `facet_wrap(~cyl)` — created three coordinated panels with shared axes, automatic labels, and consistent styling. For a two-dimensional grid, use `facet_grid()`:

```r
ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point(size = 2) +
  facet_grid(gear ~ cyl, labeller = label_both) +
  labs(title = "MPG vs HP: Gear × Cylinder Grid",
       x = "Horsepower", y = "MPG") +
  theme_bw()
#> A 3×3 grid (3 gear types × 3 cyl counts).
#> Rows are gear (3, 4, 5); columns are cyl (4, 6, 8).
#> Some panels have few or no points (e.g., 5-gear × 8-cyl).
```

This grid layout would require creating a `fig, axes = plt.subplots(3, 3)` in matplotlib, then looping through each combination, filtering data, plotting, setting titles, and synchronising axis limits — easily 20+ lines of code.

[WARNING]
**In matplotlib, creating equivalent small multiples requires a manual loop over subplots with axis management — 15-20 lines vs 1 line in ggplot2.** Even with seaborn's `FacetGrid`, the syntax is more verbose and less flexible than ggplot2's `facet_wrap()`.

**Try it:** Create a faceted histogram showing the distribution of mpg, split by `gear`. Use `facet_wrap(~gear)` with `geom_histogram()`.

```r
# Try it: faceted histogram
ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(bins = 8, fill = "steelblue", color = "white") +
  # your code here: add facet_wrap by gear
  labs(title = "MPG Distribution by Gear", x = "MPG", y = "Count") +
  theme_minimal()
#> Expected: three panels (gear 3, 4, 5) each showing an mpg histogram
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(bins = 8, fill = "steelblue", color = "white") +
  facet_wrap(~gear, labeller = label_both) +
  labs(title = "MPG Distribution by Gear", x = "MPG", y = "Count") +
  theme_minimal()
#> Three panels: gear=3 cars cluster at 15-20 mpg,
#> gear=4 spread from 20-35 mpg, gear=5 are sparse but high-mpg.
```

**Explanation:** `facet_wrap(~gear)` splits the histogram into one panel per gear value. Each panel inherits the same bins, x-axis, and styling — ggplot2 handles the coordination automatically.

</details>

## What about extensions and the ecosystem?

Both libraries have rich extension ecosystems, but they work very differently. ggplot2 extensions follow the grammar — they add new geoms, scales, or themes that compose naturally with everything else. matplotlib extensions (like seaborn) often create their own API on top.

The `patchwork` package lets you combine multiple ggplot2 plots with simple arithmetic operators:

```r
library(patchwork)

combined <- p_bar + p_hist +
  plot_annotation(title = "Two Charts Side by Side")
combined
#> Bar chart (left) and histogram (right) displayed in a single row.
#> Shared title at the top.
```

That's it — `+` places plots side by side, `/` stacks them vertically. In matplotlib, you would use `fig.add_subplot()` or `plt.subplots()` with manual positioning.

The `ggrepel` package solves another common pain point — overlapping text labels:

```r
library(ggrepel)

top_cars <- mtcars[mtcars$mpg > 25 | mtcars$hp > 250, ]

ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point(color = "gray60") +
  geom_point(data = top_cars, color = "steelblue", size = 3) +
  geom_text_repel(data = top_cars, aes(label = rownames(top_cars)),
                  size = 3, max.overlaps = 20) +
  labs(title = "Notable Cars: High MPG or High HP",
       x = "Horsepower", y = "MPG") +
  theme_minimal()
#> Scatter plot with labeled outliers. Labels automatically
#> positioned to avoid overlapping each other and the points.
#> Cars like "Toyota Corolla" (high mpg) and "Maserati Bora" (high hp) stand out.
```

`ggrepel` automatically positions labels so they don't overlap — a problem that matplotlib users solve with manual `annotate()` calls or trial-and-error offsets.

[NOTE]
**seaborn is Python's answer to ggplot2's defaults — it wraps matplotlib with better aesthetics and simpler syntax.** But seaborn still lacks ggplot2's composable grammar. You can't add a ggrepel-style layer or a patchwork-style composition — each feature is its own API.

**Try it:** Use patchwork to stack `p_bar` and `p_hist` vertically instead of side by side. Replace `+` with `/`.

```r
# Try it: stack plots vertically
ex_stacked <- p_bar / p_hist
#> Expected: bar chart on top, histogram on bottom
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_stacked <- p_bar / p_hist +
  plot_annotation(title = "Stacked Layout with Patchwork")
ex_stacked
#> Bar chart sits on top, histogram below.
#> The / operator stacks vertically; + places side by side.
```

**Explanation:** In patchwork, `/` means "stack vertically" and `+` means "place side by side." You can combine them: `(p1 + p2) / p3` puts two plots on top and one below.

</details>

## Practice Exercises

### Exercise 1: Diamonds scatter with facets and themes

Create a scatter plot of the `diamonds` dataset (built into ggplot2) with `carat` on the x-axis, `price` on the y-axis, coloured by `cut`. Facet by `clarity` using `facet_wrap()`. Apply `theme_minimal()` and add proper axis labels and a title.

```r
# Exercise 1: diamonds scatter + facets + theme
# Hint: use diamonds dataset, aes(carat, price, color = cut), facet_wrap(~clarity)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_diamond_plot <- ggplot(diamonds, aes(x = carat, y = price, color = cut)) +
  geom_point(alpha = 0.3, size = 0.8) +
  facet_wrap(~clarity, nrow = 2) +
  labs(title = "Diamond Price vs Carat by Clarity",
       x = "Carat", y = "Price (USD)", color = "Cut Quality") +
  theme_minimal() +
  theme(legend.position = "bottom")
my_diamond_plot
#> 8 panels (I1 through IF), each showing carat vs price.
#> Higher clarity diamonds (IF, VVS1) show tighter price clusters.
#> Ideal cut (purple) appears at all price points across all clarity levels.
```

**Explanation:** This exercise combines three skills: aesthetic mapping (`color = cut`), faceting (`facet_wrap(~clarity)`), and theme customisation (`theme_minimal()` + `legend.position`). The `alpha = 0.3` prevents overplotting with 50K+ points.

</details>

### Exercise 2: Multi-panel dashboard with patchwork

Build a two-panel dashboard of mtcars: (a) a bar chart showing mean mpg by cylinder count, and (b) a scatter plot of wt vs mpg with a linear trend line (`geom_smooth(method = "lm")`). Combine them side by side with patchwork and add a shared title using `plot_annotation()`.

```r
# Exercise 2: two-panel dashboard
# Hint: for the bar chart, use stat_summary(fun = mean, geom = "bar")
# For the trend line, use geom_smooth(method = "lm")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_bar <- ggplot(mtcars, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  stat_summary(fun = mean, geom = "bar") +
  labs(x = "Cylinders", y = "Mean MPG") +
  theme_minimal() +
  theme(legend.position = "none")

my_scatter <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(color = "steelblue", size = 2) +
  geom_smooth(method = "lm", se = TRUE, color = "darkred") +
  labs(x = "Weight (1000 lbs)", y = "MPG") +
  theme_minimal()

my_dashboard <- my_bar + my_scatter +
  plot_annotation(title = "mtcars Dashboard: MPG by Cylinders and Weight")
my_dashboard
#> Left panel: bar chart with mean mpg decreasing from 4-cyl (~26) to 8-cyl (~15).
#> Right panel: scatter with a downward trend line — heavier cars get worse mileage.
```

**Explanation:** `stat_summary(fun = mean, geom = "bar")` computes the mean mpg per group and draws bars. `geom_smooth(method = "lm")` adds a linear regression line with a confidence band. Patchwork's `+` combines them horizontally.

</details>

## Putting It All Together

Let's build a complete 4-panel dashboard from the `airquality` dataset, demonstrating everything we've covered: multiple geoms, themes, faceting concepts, and patchwork composition.

```r
aq_scatter <- ggplot(aq, aes(x = Temp, y = Ozone)) +
  geom_point(alpha = 0.6, color = "coral") +
  geom_smooth(method = "loess", se = FALSE, color = "darkred") +
  labs(title = "Ozone vs Temperature", x = "Temp (°F)", y = "Ozone (ppb)") +
  theme_minimal()

aq_line <- ggplot(aq, aes(x = Date, y = Wind)) +
  geom_line(color = "steelblue") +
  labs(title = "Daily Wind Speed", x = "Date", y = "Wind (mph)") +
  theme_minimal()

aq_hist <- ggplot(aq, aes(x = Solar.R)) +
  geom_histogram(bins = 15, fill = "goldenrod", color = "white") +
  labs(title = "Solar Radiation Distribution", x = "Solar Radiation", y = "Count") +
  theme_minimal()

aq_box <- ggplot(aq, aes(x = factor(Month), y = Temp, fill = factor(Month))) +
  geom_boxplot() +
  labs(title = "Temperature by Month", x = "Month", y = "Temp (°F)") +
  theme_minimal() +
  theme(legend.position = "none")

aq_dashboard <- (aq_scatter + aq_line) / (aq_hist + aq_box) +
  plot_annotation(
    title = "New York Air Quality Dashboard (1973)",
    subtitle = "Four views of the airquality dataset",
    theme = theme(plot.title = element_text(size = 16, face = "bold"))
  )
aq_dashboard
#> 2×2 grid:
#> Top-left: scatter showing ozone rises with temperature (exponential pattern).
#> Top-right: line chart of wind speed fluctuating between 5-20 mph.
#> Bottom-left: solar radiation roughly uniform with a peak around 250.
#> Bottom-right: boxplots showing July-August are hottest (median ~80-85°F).
```

This entire dashboard — four chart types, consistent themes, proper labels, and a composed layout — took about 30 lines of ggplot2 code. The matplotlib equivalent would be 80-100 lines, with manual subplot management, axis formatting, and style duplication across panels.

![Declarative vs Imperative](screenshots/ggplot2-vs-matplotlib-philosophy-flow.webp)

*Figure 1: Declarative vs imperative: ggplot2 describes what to show, matplotlib describes how to draw.*

## Summary

Here's a head-to-head comparison of every dimension that matters when choosing between ggplot2 and matplotlib:

| Feature | ggplot2 (R) | matplotlib (Python) |
|---------|-------------|---------------------|
| Philosophy | Declarative — describe what to plot | Imperative — specify how to draw |
| Default aesthetics | Publication-ready out of the box | Functional but plain; needs styling |
| Syntax consistency | Same pattern for every chart type | Different API per chart type |
| Chart type switching | Change the geom (1 word) | Rewrite the plot call |
| Colour by group | `color = var` in aes() | Manual loop + legend |
| Faceting | 1 line: `facet_wrap()` / `facet_grid()` | 10-20 lines: subplot loop |
| Theme system | Composable layers | Global rcParams or style sheets |
| Extensions | Grammar-compatible (patchwork, ggrepel, gganimate) | Wrapper libraries (seaborn, plotly) |
| Statistical layers | Built-in: `geom_smooth()`, `stat_summary()` | Manual: compute + plot separately |
| Learning curve | Moderate — learn the grammar, then everything clicks | Steep — many unrelated APIs to memorize |
| Best for | Statistical visualization, EDA, publications | Low-level control, custom animations, ML pipelines |
| Community size | Smaller but focused (R ecosystem) | Larger (Python ecosystem) |

The bottom line: if you work in R, ggplot2 is the clear choice — it's more concise, more consistent, and produces better-looking charts with less effort. If you work in Python, matplotlib is your foundation, but consider seaborn for statistical plots. If you use both languages, ggplot2's grammar-of-graphics approach will make you a better data visualizer regardless of which language you ultimately choose.

![Decision Tree](screenshots/ggplot2-vs-matplotlib-decision-tree.webp)

*Figure 2: Decision tree: which visualization library fits your workflow?*

## References

1. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). [Link](https://ggplot2-book.org/)
2. Wilkinson, L. — *The Grammar of Graphics*, 2nd Edition. Springer (2005).
3. ggplot2 documentation — Function reference. [Link](https://ggplot2.tidyverse.org/reference/)
4. matplotlib documentation — Tutorials and API reference. [Link](https://matplotlib.org/stable/tutorials/index.html)
5. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
6. seaborn documentation — Statistical data visualization. [Link](https://seaborn.pydata.org/)
7. Pedersen, T.L. — patchwork: The Composer of Plots. [Link](https://patchwork.data-imaginist.com/)
8. Hunter, J.D. — "Matplotlib: A 2D Graphics Environment." *Computing in Science & Engineering* 9(3), 90-95 (2007).

## Continue Learning

1. [ggplot2's Grammar of Graphics](ggplot2-Grammar-of-Graphics.html) — Understand the layered mental model behind every ggplot2 chart.
2. [ggplot2 Getting Started](ggplot2-Getting-Started.html) — Build your first ggplot2 charts with hands-on runnable code.
3. [ggplot2 Themes](ggplot2-Themes-in-R.html) — Master the theme system for publication-ready, presentation-quality plots.
