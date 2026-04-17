---
title: "25 Best ggplot2 Extensions in R: ggrepel, ggforce, ggtext & Beyond"
slug: "25-Best-ggplot2-Extensions"
description: "Discover 25 essential ggplot2 extensions in R, from ggrepel labels to patchwork layouts to gganimate animations, with runnable code examples and tips."
keywords: "ggplot2 extensions, best ggplot2 packages, ggrepel R, ggforce R, ggtext ggplot2, patchwork R, ggplot2 add-ons, R visualization packages, ggridges R, cowplot R"
auto_link_terms: "ggplot2 extensions|ggplot extensions|best ggplot2 packages|ggplot2 add-ons|ggplot2 extension packages|R visualization extensions"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "FR-cust-4"
post_type: "FR"
fr_parent: "ggplot2-Themes-in-R.html"
difficulty: "Intermediate"
---

# 25 Best ggplot2 Extensions in R: ggrepel, ggforce, ggtext & Beyond

<p class="lead">The ggplot2 package powers most R visualizations, but over 100 extension packages expand it with better labels, new chart types, richer themes, and even animation, each one plugging in with the same <code>ggplot() + layer</code> syntax you already know.</p>

[NOTE]
**Some extensions below are marked "Local only".** These packages aren't available in the browser code runner, install them in RStudio to try the code. All other examples run directly in your browser.

## How Do You Fix Overlapping Labels and Add Rich Text?

Overlapping labels are the single most common ggplot2 frustration. You add `geom_text()` to a scatter plot and half the labels pile on top of each other. The ggrepel package fixes this with physics-based repulsion, labels push away from each other and from data points automatically.

### 1. ggrepel, Non-Overlapping Labels

Let's see ggrepel in action on a scatter plot of car data. Notice how every label is readable without manual positioning.

```r title="ggrepel labels for top mtcars"
library(ggplot2)
library(ggrepel)

# Label the 8 most fuel-efficient cars
top_cars <- mtcars[order(-mtcars$mpg)[1:8], ]
top_cars$car <- rownames(top_cars)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "grey60") +
  geom_point(data = top_cars, color = "steelblue", size = 3) +
  geom_text_repel(data = top_cars, aes(label = car),
                  size = 3.5, max.overlaps = 20) +
  labs(title = "Most Fuel-Efficient Cars",
       x = "Weight (1000 lbs)", y = "Miles per Gallon") +
  theme_minimal()
#> [scatter plot with 8 labeled points, no overlapping text]
```

Every label connects to its point with a subtle line segment. The `max.overlaps` argument controls how aggressively labels dodge, higher values allow more labels to appear in crowded regions. Use `geom_label_repel()` instead for labels with a background box.

[KEY INSIGHT]
**ggrepel uses physics-based repulsion to place labels.** Each label acts like a charged particle, pushing away from other labels and data points until it finds an open position. This means you never need to manually adjust coordinates.

### 2. ggtext, Rich Text Formatting in Plots

Standard ggplot2 titles are plain text. With ggtext, you can make individual words **bold**, <span style="color:red">colored</span>, or italic using HTML/Markdown syntax right inside your plot titles and annotations.

```r title="ggtext rich markdown titles"
library(ggtext)

ggplot(iris, aes(Sepal.Length, Sepal.Width, color = Species)) +
  geom_point(size = 2) +
  labs(title = "Sepal dimensions by <span style='color:#E41A1C'>setosa</span>,
<span style='color:#377EB8'>versicolor</span>, and
<span style='color:#4DAF4A'>virginica</span>") +
  scale_color_manual(values = c("#E41A1C", "#377EB8", "#4DAF4A")) +
  theme_minimal() +
  theme(plot.title = element_markdown(size = 14),
        legend.position = "none")
#> [scatter plot with colored species names in the title, no legend needed]
```

The key function is `element_markdown()`, use it in `theme()` for any text element (title, subtitle, axis labels, caption). For in-plot annotations, use `geom_richtext()` which supports the same HTML tags. This technique eliminates the need for a separate legend when you color-code your title.

### 3. geomtextpath, Curved Text Along Lines (Local only)

geomtextpath places text directly on lines and curves, replacing the need for a separate legend on line charts.

```r title="geomtextpath labels along lines"
library(geomtextpath)

ggplot(economics_long, aes(date, value, color = variable,
                            label = variable)) +
  geom_textline(size = 4, hjust = 0.8) +
  theme_minimal() +
  theme(legend.position = "none")
#> [line chart with variable names printed along each curve]
```

The `geom_textline()` function replaces `geom_line()` and bends the text to follow the line's path. Readers see the label right on the data, no legend lookup required.

**Try it:** Load ggrepel and create a scatter plot of `iris` using `Petal.Length` vs `Petal.Width`. Label only the 5 flowers with the largest `Petal.Length` using `geom_label_repel()`. Use `ex_top5` for your filtered data.

```r title="ggforce facet zoom diamonds"
# Try it: label the top 5 iris flowers by Petal.Length
ex_top5 <- iris[order(-iris$Petal.Length)[1:5], ]

ggplot(iris, aes(Petal.Length, Petal.Width)) +
  geom_point(color = "grey70") +
  # your code here: add highlighted points + geom_label_repel

#> Expected: scatter plot with 5 labeled points
```

<details>
<summary>Click to reveal solution</summary>

```r title="ggridges density ridgelines"
ex_top5 <- iris[order(-iris$Petal.Length)[1:5], ]

ggplot(iris, aes(Petal.Length, Petal.Width)) +
  geom_point(color = "grey70") +
  geom_point(data = ex_top5, color = "tomato", size = 3) +
  geom_label_repel(data = ex_top5,
                   aes(label = rownames(ex_top5)),
                   size = 3) +
  theme_minimal()
#> [scatter with 5 boxed labels pointing to the largest flowers]
```

**Explanation:** `geom_label_repel()` works like `geom_text_repel()` but draws a filled rectangle behind each label for better readability.

</details>

## What Extensions Add Powerful New Geoms?

ggplot2 ships with about 30 geoms (points, lines, bars, etc.), but many common visualizations need specialised geometries. These four packages fill the biggest gaps.

### 4. ggforce, Zoom, Shapes, and Annotations

ggforce gives you `facet_zoom()`, a way to zoom into a region of your plot while keeping the full view visible side-by-side.

```r title="ggbeeswarm iris scatter"
library(ggforce)

ggplot(diamonds[sample(nrow(diamonds), 2000), ],
       aes(carat, price, color = cut)) +
  geom_point(alpha = 0.5, size = 1) +
  facet_zoom(x = carat < 1) +
  labs(title = "Diamond Prices: Full View + Zoom on Small Stones") +
  theme_minimal()
#> [two-panel plot: left shows all data, right zooms into carat < 1]
```

The zoomed panel links to the full view with a shaded region, so readers instantly see which portion is enlarged. ggforce also provides `geom_mark_ellipse()` for annotating clusters, `geom_arc_bar()` for donut charts, and `geom_sina()` for jittered violin-style point plots.

[TIP]
**Use facet_zoom() for crowded scatter plots.** Instead of filtering data or creating separate plots, facet_zoom gives readers both the overview and the detail in one figure, perfect for presentations where you want to highlight a specific region without losing context.

### 5. ggridges, Ridgeline Density Plots

When you need to compare distributions across many groups, ridgeline plots stack density curves vertically so every group is visible without faceting.

```r title="ggdist raincloud plot"
library(ggridges)

ggplot(diamonds[sample(nrow(diamonds), 5000), ],
       aes(x = price, y = cut, fill = cut)) +
  geom_density_ridges(alpha = 0.7, scale = 1.2) +
  labs(title = "Diamond Price Distribution by Cut Quality",
       x = "Price (USD)", y = "") +
  theme_minimal() +
  theme(legend.position = "none")
#> [5 stacked density curves, one per cut quality, showing price spread]
```

The `scale` parameter controls how much the ridges overlap, values above 1 let them overlap slightly for a compact look. Each ridge is a full density estimate, making it easy to spot bimodal distributions or outlier groups at a glance.

[TIP]
**ggridges shines when you have 5+ groups.** With fewer groups, a standard `geom_density()` with `fill` works fine. With 10+ groups, ridgelines keep everything readable where facets would need scrolling.

### 6. ggbeeswarm, Jittered Points That Don't Lie

Standard `geom_jitter()` places points randomly, which can misrepresent density. ggbeeswarm arranges points in a structured pattern so dense regions look dense and sparse regions look sparse.

```r title="patchwork combined layout"
library(ggbeeswarm)

ggplot(iris, aes(Species, Sepal.Width, color = Species)) +
  geom_beeswarm(size = 2, cex = 2) +
  labs(title = "Sepal Width by Species (Beeswarm Layout)") +
  theme_minimal() +
  theme(legend.position = "none")
#> [three columns of points arranged in bee-swarm pattern]
```

Unlike jitter, every point position is deterministic, run it twice and you get the same layout. The `cex` parameter controls point spacing. Use `geom_quasirandom()` from the same package for a softer, violin-shaped alternative.

### 7. ggdist, Distribution Visualisation and Raincloud Plots

ggdist combines density plots, dot plots, and interval summaries into single composite visualizations. Its signature output is the "raincloud plot", a half-violin plus jittered dots plus a summary interval.

```r title="cowplot inset with drawplot"
library(ggdist)

ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_halfeye(adjust = 0.5, width = 0.6, alpha = 0.7,
               .width = 0, point_colour = NA) +
  geom_boxplot(width = 0.15, outlier.shape = NA, alpha = 0.5) +
  labs(title = "Sepal Length Distribution (Raincloud Style)",
       y = "Sepal Length (cm)") +
  theme_minimal() +
  theme(legend.position = "none")
#> [half-violin shapes above narrow boxplots for each species]
```

The `stat_halfeye()` function draws a half-density shape, while the layered boxplot adds the familiar median and quartile markers. Set `.width = c(0.66, 0.95)` to show 66% and 95% credible intervals instead of a boxplot.

**Try it:** Create a ridgeline plot of `airquality$Temp` grouped by `Month` using ggridges. Use `factor(Month)` for the y-axis and add `fill = factor(Month)`. Store your data prep in `ex_aq`.

```r title="hrbrthemes ipsum theme"
# Try it: ridgeline plot of temperature by month
ex_aq <- airquality
ex_aq$Month <- factor(ex_aq$Month)

ggplot(ex_aq, aes(x = Temp, y = Month)) +
  # your code here: add geom_density_ridges with fill

#> Expected: 5 stacked density curves showing temp distribution per month
```

<details>
<summary>Click to reveal solution</summary>

```r title="ggsci Nature palette"
ex_aq <- airquality
ex_aq$Month <- factor(ex_aq$Month)

ggplot(ex_aq, aes(x = Temp, y = Month, fill = Month)) +
  geom_density_ridges(alpha = 0.6, scale = 1.3) +
  labs(title = "NYC Temperature by Month", x = "Temperature (F)") +
  theme_minimal() +
  theme(legend.position = "none")
#> [5 ridges: May (cool, tight) → September (warm, spread)]
```

**Explanation:** `geom_density_ridges()` stacks density estimates vertically. The `scale` controls overlap, and `alpha` makes overlapping regions visible.

</details>

## How Do You Combine Multiple Plots Into One Figure?

Scientific papers and reports almost always need multi-panel figures. Two packages dominate this space, and both work with any ggplot object.

### 8. patchwork, Combine Plots With Math Operators

patchwork is the most intuitive way to arrange plots. Use `+` to place plots side by side, `/` to stack vertically, and `|` for explicit horizontal layout.

```r title="paletteer unified palette access"
library(patchwork)

p1 <- ggplot(mtcars, aes(mpg)) +
  geom_histogram(bins = 10, fill = "steelblue") +
  labs(title = "MPG Distribution") + theme_minimal()

p2 <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(title = "Weight vs MPG") + theme_minimal()

p3 <- ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_boxplot(fill = "coral") +
  labs(title = "MPG by Cylinders") + theme_minimal()

(p1 | p2) / p3 +
  plot_annotation(title = "Motor Trend Car Analysis",
                  tag_levels = "A")
#> [2 plots on top row, 1 spanning bottom, labeled A/B/C]
```

The parentheses control grouping: `(p1 | p2) / p3` puts plots 1 and 2 on the top row and plot 3 spanning the full width below. The `tag_levels = "A"` argument auto-labels each panel as (A), (B), (C), exactly what journals expect.

[WARNING]
**patchwork collects themes from each plot independently.** If your panels use different themes, the combined figure can look inconsistent. Apply the same `theme_*()` to all plots before combining, or use `& theme_minimal()` after the patchwork expression to apply a theme to every panel at once.

[KEY INSIGHT]
**patchwork uses math operators for layout.** `+` and `|` place plots horizontally, `/` stacks vertically, and parentheses group sub-layouts. This reads like a formula: `(A | B) / C` is a 2-over-1 layout.

### 9. cowplot, Publication-Ready Multi-Panel Layouts

cowplot predates patchwork and offers similar functionality via `plot_grid()`, plus the ability to add inset plots with `draw_plot()`.

```r title="ggnewscale second colour scale"
library(cowplot)

p_main <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 2) +
  theme_minimal_grid()

p_inset <- ggplot(mtcars, aes(factor(cyl))) +
  geom_bar(fill = "steelblue") +
  labs(x = "Cylinders", y = "Count") +
  theme_minimal_hgrid(font_size = 9)

ggdraw(p_main) +
  draw_plot(p_inset, x = 0.6, y = 0.6, width = 0.35, height = 0.35)
#> [scatter plot with a small bar chart inset in the top-right corner]
```

The `ggdraw()` + `draw_plot()` pattern places one plot inside another at exact coordinates (0-1 range). This is perfect for overview + detail views. cowplot also provides `theme_cowplot()` and `theme_minimal_grid()`, clean themes designed for multi-panel figures.

**Try it:** Create three plots from `iris` (histogram of `Sepal.Length`, scatter of `Sepal.Length` vs `Petal.Length`, boxplot of `Sepal.Width` by Species). Combine them into a 1-row layout with patchwork using `|` and add panel tags with `plot_annotation(tag_levels = "A")`.

```r title="gghighlight filter high mileage"
# Try it: 3-panel iris figure with patchwork
ex_p1 <- ggplot(iris, aes(Sepal.Length)) +
  geom_histogram(bins = 15, fill = "steelblue") + theme_minimal()
ex_p2 <- ggplot(iris, aes(Sepal.Length, Petal.Length)) +
  geom_point() + theme_minimal()
# your code here: create ex_p3 (boxplot) and combine all three

#> Expected: 3 plots side by side, tagged A/B/C
```

<details>
<summary>Click to reveal solution</summary>

```r title="ggpubr compare means annotation"
ex_p1 <- ggplot(iris, aes(Sepal.Length)) +
  geom_histogram(bins = 15, fill = "steelblue") + theme_minimal()
ex_p2 <- ggplot(iris, aes(Sepal.Length, Petal.Length)) +
  geom_point() + theme_minimal()
ex_p3 <- ggplot(iris, aes(Species, Sepal.Width, fill = Species)) +
  geom_boxplot() + theme_minimal() + theme(legend.position = "none")

(ex_p1 | ex_p2 | ex_p3) +
  plot_annotation(tag_levels = "A")
#> [three iris plots side by side, tagged (A), (B), (C)]
```

**Explanation:** The `|` operator arranges plots horizontally. `plot_annotation(tag_levels = "A")` adds sequential letter labels to each panel.

</details>

## Which Extensions Offer the Best Themes and Color Palettes?

ggplot2 ships with `theme_gray()`, `theme_minimal()`, and a handful of others. These five packages give you hundreds of ready-made themes and thousands of color palettes.

### 10. ggthemes, Ready-Made Publication Themes

ggthemes replicates the visual style of well-known publications and data visualization experts.

```r title="ggcorrplot circle correlation matrix"
library(ggthemes)

p_base <- ggplot(iris, aes(Sepal.Length, Sepal.Width, color = Species)) +
  geom_point(size = 2)

p_base + theme_economist() +
  scale_color_economist() +
  labs(title = "The Economist Style")
#> [scatter plot with blue background, Economist-style axes and fonts]
```

Other popular options include `theme_fivethirtyeight()` (bold, minimal), `theme_tufte()` (maximum data-ink ratio), and `theme_wsj()` (Wall Street Journal). Each theme comes with a matching `scale_color_*()` function.

### 11. hrbrthemes, Typography-First Themes

If you want clean, modern-looking plots with excellent font choices, hrbrthemes delivers with `theme_ipsum()`.

```r title="GGally pair plot of iris"
library(hrbrthemes)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "steelblue", size = 2) +
  labs(title = "Weight vs Fuel Efficiency",
       subtitle = "Motor Trend Car Road Tests, 1974",
       x = "Weight (1000 lbs)", y = "Miles per Gallon") +
  theme_ipsum()
#> [clean plot with Arial Narrow/Roboto Condensed fonts, subtle gridlines]
```

`theme_ipsum()` uses a condensed sans-serif font with generous spacing. The result looks professional without any manual theme tweaking. Variants include `theme_ipsum_rc()` (Roboto Condensed) and `theme_ipsum_tw()` (Titillium Web).

### 12. ggsci, Journal and Sci-Fi Color Palettes

ggsci provides color palettes inspired by scientific journals (Lancet, Nature, JAMA), sci-fi franchises, and data tools.

```r title="ggstatsplot between-group test"
library(ggsci)

ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) +
  geom_point(size = 2) +
  scale_color_npg() +
  labs(title = "Nature Publishing Group Palette") +
  theme_minimal()
#> [scatter with NPG's distinctive red, blue, green palette]
```

Other palettes include `scale_color_lancet()`, `scale_color_jama()`, `scale_color_d3()` (D3.js colors), and `scale_color_startrek()`. Each comes in both `scale_color_*()` and `scale_fill_*()` variants.

### 13. paletteer, One Package, 2,500+ Palettes

Instead of installing 10 palette packages, paletteer gives you unified access to all of them through a single interface.

```r title="gganimate transition by year"
library(paletteer)

ggplot(diamonds[sample(nrow(diamonds), 1000), ],
       aes(carat, price, color = cut)) +
  geom_point(alpha = 0.7) +
  scale_color_paletteer_d("ggsci::nrc_npg") +
  labs(title = "Accessing NPG Palette via paletteer") +
  theme_minimal()
#> [scatter with NPG colors, accessed through paletteer's unified syntax]
```

The naming convention is `"package::palette_name"`. Use `paletteer_d()` for discrete palettes, `paletteer_c()` for continuous, and `paletteer_dynamic()` for palettes that adapt to the number of categories. Run `palettes_d_names` to browse all 2,500+ available palettes.

[TIP]
**paletteer is the meta-package for palettes.** One install gives you access to ggsci, viridis, RColorBrewer, wesanderson, and dozens more, all through a consistent syntax.

### 14. ggnewscale, Two Color Scales in One Plot

By default, ggplot2 only allows one `color` scale and one `fill` scale per plot. ggnewscale breaks this limit so you can map different variables to different color scales.

```r title="plotly ggplotly interactive scatter"
library(ggnewscale)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point(aes(color = hp), size = 3) +
  scale_color_gradient(low = "lightblue", high = "darkblue",
                       name = "Horsepower") +
  new_scale_color() +
  geom_point(data = mtcars[mtcars$mpg > 25, ],
             aes(color = factor(cyl)), size = 4, shape = 17) +
  scale_color_manual(values = c("4" = "red", "6" = "orange"),
                     name = "Cylinders\n(efficient cars)") +
  theme_minimal()
#> [scatter with blue gradient for hp, plus red/orange triangles for efficient cars]
```

The `new_scale_color()` call resets the color aesthetic so you can assign a fresh scale. Place it between two sets of geom + scale layers. The same pattern works with `new_scale_fill()`.

**Try it:** Create a scatter plot of `mtcars` (wt vs mpg) and apply `theme_solarized()` from ggthemes with `scale_color_jama()` from ggsci, coloring by `factor(cyl)`. Store your result in `ex_themed`.

```r title="treemapify treemap chart"
# Try it: combine ggthemes + ggsci
ex_themed <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3)
  # your code here: add theme_solarized() and scale_color_jama()

#> Expected: scatter plot with Solarized background and JAMA journal colors
```

<details>
<summary>Click to reveal solution</summary>

```r title="waffle chart of proportions"
ex_themed <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_jama() +
  theme_solarized() +
  labs(title = "Solarized Theme + JAMA Colors", color = "Cylinders")
ex_themed
#> [scatter on light yellow Solarized background with JAMA blue/red/green]
```

**Explanation:** ggplot2 themes and color scales are independent layers, you can freely mix packages. `theme_solarized()` controls the background and grid; `scale_color_jama()` controls the point colors.

</details>

## How Can You Highlight, Annotate, and Add Statistics?

Sometimes you need to draw the reader's eye to specific data points, add statistical test results, or display correlation patterns. These five extensions handle those needs.

### 15. gghighlight, Conditional Data Highlighting (Local only)

gghighlight lets you emphasise a subset of data while graying out the rest, no manual filtering needed.

```r title="ggiraph interactive points"
library(gghighlight)

ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  gghighlight(mpg > 25) +
  labs(title = "Highlighting Fuel-Efficient Cars (MPG > 25)") +
  theme_minimal()
#> [all points visible, but only mpg > 25 points are colored; rest are grey]
```

The `gghighlight()` function works with any geom, scatter, line, bar. It accepts any logical condition and automatically fades non-matching data to grey. Use `label_key = car_name` to auto-label the highlighted points.

### 16. ggpubr, Publication-Ready Plots With Statistical Tests

ggpubr wraps common plot types in convenience functions and adds built-in statistical comparisons.

```r title="ggalluvial titanic flows"
library(ggpubr)

ggboxplot(iris, x = "Species", y = "Sepal.Length",
          color = "Species", palette = "jco",
          add = "jitter", shape = "Species") +
  stat_compare_means(comparisons = list(
    c("setosa", "versicolor"),
    c("versicolor", "virginica"),
    c("setosa", "virginica")),
    method = "t.test")
#> [boxplots with jittered points and p-value brackets between groups]
```

The `stat_compare_means()` function runs statistical tests (t-test, Wilcoxon, ANOVA, Kruskal-Wallis) and displays the p-value directly on the plot. The `comparisons` argument specifies which pairs to test. The `palette = "jco"` uses Journal of Clinical Oncology colors.

### 17. ggcorrplot, Correlation Matrix Heatmaps

ggcorrplot turns a correlation matrix into a publication-ready heatmap with one function call.

```r title="Exercise: ggrepel and ridges combination"
library(ggcorrplot)

cor_mat <- round(cor(mtcars[, c("mpg", "cyl", "disp", "hp",
                                 "drat", "wt", "qsec")]), 2)

ggcorrplot(cor_mat, method = "circle", type = "lower",
           lab = TRUE, lab_size = 3,
           colors = c("#6D9EC1", "white", "#E46726")) +
  labs(title = "Motor Trend Cars: Variable Correlations")
#> [lower-triangle correlation matrix with circles sized by correlation strength]
```

The `method = "circle"` uses circle size to encode correlation strength (large circle = strong correlation). Set `type = "lower"` to show only the lower triangle, avoiding redundancy. The `lab = TRUE` overlays the actual correlation values.

[KEY INSIGHT]
**Correlation heatmaps reveal multicollinearity at a glance.** When building regression models, look for variable pairs with correlations above 0.8, including both in a model inflates standard errors and makes coefficients unreliable.

### 18. GGally, Scatter Plot Matrices and More

GGally's `ggpairs()` creates comprehensive scatter-plot matrices showing correlations, distributions, and scatter plots for every variable pair.

```r title="Exercise solution: Top five labelled ridgeline"
library(GGally)

ggpairs(iris, columns = 1:4, aes(color = Species, alpha = 0.5),
        upper = list(continuous = wrap("cor", size = 3)),
        lower = list(continuous = wrap("points", size = 0.5)),
        diag = list(continuous = wrap("densityDiag", alpha = 0.5))) +
  theme_minimal() +
  labs(title = "Iris: All Pairwise Relationships")
#> [4x4 matrix: correlations above diagonal, scatters below, densities on diagonal]
```

The upper triangle shows correlation coefficients, the lower triangle shows scatter plots, and the diagonal shows density distributions, all colored by Species. This single chart replaces six separate scatter plots and gives you a complete overview of multivariate relationships.

### 19. ggstatsplot, Automated Statistical Visualisations (Local only)

ggstatsplot creates publication-ready plots with statistical test results embedded directly in the subtitle.

```r title="Exercise: ggcorrplot with rich title"
library(ggstatsplot)

ggbetweenstats(iris, x = Species, y = Sepal.Length,
               type = "parametric",
               pairwise.display = "significant")
#> [violin + box + jitter plot with ANOVA F-statistic, p-value,
#>  effect size, and pairwise comparisons all printed on the plot]
```

One function call runs the appropriate test, computes effect sizes, performs pairwise comparisons, and displays everything on the plot. Other variants include `ggscatterstats()` (correlation), `gghistostats()` (distribution tests), and `ggcorrmat()` (correlation matrices with p-values).

[WARNING]
**ggstatsplot auto-selects tests based on your data.** It chooses between parametric and non-parametric tests, but always verify the chosen test matches your assumptions. Set `type = "parametric"` or `type = "nonparametric"` explicitly when you know which is appropriate.

**Try it:** Use `ggcorrplot()` to create a correlation heatmap of `airquality` (columns: Ozone, Solar.R, Wind, Temp). Use `method = "circle"`, `type = "lower"`, and add labels. Store the correlation matrix in `ex_cor`.

```r title="Exercise solution: Correlation plot with markdown title"
# Try it: airquality correlation heatmap
ex_aq_clean <- na.omit(airquality[, c("Ozone", "Solar.R", "Wind", "Temp")])
ex_cor <- round(cor(ex_aq_clean), 2)
# your code here: call ggcorrplot with circle method, lower triangle, labels

#> Expected: lower-triangle circle heatmap with correlation values
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise: ggforce zoom with d3 palette"
ex_aq_clean <- na.omit(airquality[, c("Ozone", "Solar.R", "Wind", "Temp")])
ex_cor <- round(cor(ex_aq_clean), 2)

ggcorrplot(ex_cor, method = "circle", type = "lower",
           lab = TRUE, lab_size = 3.5,
           colors = c("#6D9EC1", "white", "#E46726")) +
  labs(title = "Air Quality: Variable Correlations")
#> [lower-triangle heatmap: Ozone-Temp strongly positive, Wind-Temp negative]
```

**Explanation:** `na.omit()` removes rows with missing values before computing correlations. The circle sizes immediately show that Ozone and Temp have the strongest positive correlation.

</details>

## How Do You Make ggplot2 Charts Interactive, Animated, or Specialised?

The final group covers extensions that take ggplot2 beyond static PNG output, plus three packages for niche chart types you can't build with base geoms.

### 20. gganimate, Animated Plots (Local only)

gganimate adds a time dimension to any ggplot by treating "frame" as an aesthetic. It requires the gifski package for rendering GIFs, install both with `install.packages(c("gganimate", "gifski"))`.

```r title="Exercise solution: Small-diamond facet zoom"
library(gganimate)

ggplot(gapminder::gapminder, aes(gdpPercap, lifeExp,
                                  size = pop, color = continent)) +
  geom_point(alpha = 0.7) +
  scale_x_log10() +
  transition_time(year) +
  labs(title = "Year: {frame_time}",
       x = "GDP per Capita (log)", y = "Life Expectancy") +
  theme_minimal()
#> [animated scatter plot cycling through years 1952-2007]
```

Key transition functions: `transition_time()` for temporal data, `transition_states()` for categorical groups, and `transition_reveal()` for cumulative line charts. Use `shadow_wake()` to leave trails behind moving points.

### 21. plotly, Interactive HTML Charts With ggplotly() (Local only)

plotly's `ggplotly()` function converts any ggplot into an interactive chart with zoom, pan, and hover tooltips. Install locally with `install.packages("plotly")`.

```r title="Mistake: Loading extensions too late"
library(plotly)

p <- ggplot(iris, aes(Sepal.Length, Petal.Length,
                       color = Species, text = paste("Width:", Sepal.Width))) +
  geom_point(size = 2) +
  theme_minimal()

ggplotly(p, tooltip = c("text", "x", "y"))
#> [interactive scatter: hover shows species, dimensions; scroll to zoom]
```

The `tooltip` argument controls what appears on hover. Map extra information to the `text` aesthetic and include it in `tooltip` for rich hover cards. For dashboards, combine with Shiny or save standalone HTML with `htmlwidgets::saveWidget()`.

### 22. treemapify, Treemap Charts

treemapify turns hierarchical or proportional data into space-filling rectangles.

```r title="Correct: Load extensions before ggplot"
library(treemapify)
library(dplyr)

tree_data <- mtcars |>
  mutate(car = rownames(mtcars), cyl = factor(cyl)) |>
  group_by(cyl) |>
  summarise(count = n(), avg_mpg = mean(mpg), .groups = "drop")

ggplot(tree_data, aes(area = count, fill = avg_mpg, label = paste0(cyl, " cyl\n", count, " cars"))) +
  geom_treemap() +
  geom_treemap_text(place = "centre", size = 12) +
  scale_fill_gradient(low = "#E46726", high = "#6D9EC1", name = "Avg MPG") +
  labs(title = "Cars by Cylinder Count (sized by count, colored by efficiency)") +
  theme_minimal()
#> [three rectangles: 8-cyl largest (14 cars), 4-cyl (11), 6-cyl (7)]
```

Map `area` to the variable that controls rectangle size, and `fill` to a second variable for color encoding. Use `geom_treemap_text()` to label each rectangle. For hierarchical treemaps, add `subgroup` aesthetics.

### 23. waffle, Waffle Charts (Square Pie Charts)

Waffle charts display proportions as grids of squares, a more readable alternative to pie charts.

```r title="Mistake: Stacking conflicting scales"
library(waffle)

parts <- c("4 cyl" = 11, "6 cyl" = 7, "8 cyl" = 14)

ggplot(data.frame(category = names(parts), count = parts),
       aes(fill = category, values = count)) +
  geom_waffle(n_rows = 4, size = 0.5, color = "white") +
  scale_fill_manual(values = c("#4DAF4A", "#377EB8", "#E41A1C")) +
  coord_equal() +
  labs(title = "Cars by Cylinder Count") +
  theme_void() +
  theme(legend.position = "bottom")
#> [grid of colored squares: 11 green, 7 blue, 14 red, in rows of 4]
```

Each square represents one unit. The `n_rows` parameter sets how many rows tall the grid is, and `coord_equal()` keeps the squares square. Waffle charts work best when your total count is under 100, otherwise each square is too small to see.

[TIP]
**Waffle charts beat pie charts for comparing proportions.** Human brains estimate area in rectangles more accurately than in circle slices. Use waffle charts whenever you'd reach for a pie chart, your readers will thank you.

### 24. ggiraph, Interactive SVG Graphics (Local only)

ggiraph makes ggplot elements interactive, hover for tooltips, click to select, and link data across plots.

```r title="Correct: Use ggnewscale between scales"
library(ggiraph)

p <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point_interactive(aes(tooltip = rownames(mtcars),
                              data_id = rownames(mtcars)),
                          size = 3, color = "steelblue") +
  theme_minimal()

girafe(ggobj = p)
#> [scatter plot where hovering shows car name, clicking highlights the point]
```

Replace standard geoms with `_interactive` versions (`geom_point_interactive`, `geom_bar_interactive`, etc.) and map `tooltip` and `data_id` aesthetics. The `data_id` enables linked brushing, clicking a point in one chart highlights the same observation in another.

### 25. ggalluvial, Alluvial and Sankey Diagrams (Local only)

ggalluvial visualises flow between categorical variables, tracking how observations move across stages.

```r title="Mistake: Too many labels with geomtext"
library(ggalluvial)

titanic_data <- as.data.frame(Titanic)

ggplot(titanic_data, aes(axis1 = Class, axis2 = Sex, axis3 = Survived,
                          y = Freq)) +
  geom_alluvium(aes(fill = Survived), width = 1/3) +
  geom_stratum(width = 1/3) +
  geom_text(stat = "stratum", aes(label = after_stat(stratum)), size = 3) +
  scale_fill_manual(values = c("No" = "#E41A1C", "Yes" = "#4DAF4A")) +
  labs(title = "Titanic Survival by Class and Sex") +
  theme_void()
#> [flowing ribbons showing how passengers in each class/sex survived or not]
```

The `geom_alluvium()` draws flowing ribbons between strata, and `geom_stratum()` draws the category blocks. This chart type works best for 3-5 categorical variables with limited categories each (under 6 per axis).

**Try it:** Create a treemap of the `diamonds` dataset showing proportions by `cut`. Group by `cut`, count the rows in each group, and map `area = n` and `fill = cut`. Use `geom_treemap()` and `geom_treemap_text()`.

```r title="Correct: Use ggrepel for readable labels"
# Try it: diamonds treemap by cut
ex_cuts <- diamonds |>
  group_by(cut) |>
  summarise(n = n(), .groups = "drop")

# your code here: ggplot + geom_treemap + geom_treemap_text

#> Expected: 5 rectangles sized by diamond count, labeled with cut names
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mistake: Raw markdown without ggtext"
ex_cuts <- diamonds |>
  group_by(cut) |>
  summarise(n = n(), .groups = "drop")

ggplot(ex_cuts, aes(area = n, fill = cut,
                     label = paste0(cut, "\n", n))) +
  geom_treemap() +
  geom_treemap_text(place = "centre", size = 11) +
  labs(title = "Diamonds by Cut Quality") +
  theme_minimal() +
  theme(legend.position = "none")
#> [Ideal largest rectangle (21,551), then Premium, Very Good, Good, Fair]
```

**Explanation:** `geom_treemap()` sizes rectangles proportionally by the `area` aesthetic. Ideal cut dominates because it has the most diamonds in the dataset.

</details>

## Practice Exercises

### Exercise 1: Multi-Panel Figure With Labels and Ridgelines

Create a two-panel figure using patchwork: (A) a scatter plot of `mtcars` (wt vs mpg) with the 5 most fuel-efficient cars labeled using ggrepel, and (B) a ridgeline plot of mpg by `factor(cyl)` using ggridges. Apply `theme_minimal()` to both and add panel tags.

```r title="Correct: elementmarkdown renders formatting"
# Exercise 1: combine ggrepel + ggridges + patchwork
# Hint: create two separate ggplot objects, then use | and plot_annotation()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise one: Labelled mtcars ridgeline panel"
my_top5 <- mtcars[order(-mtcars$mpg)[1:5], ]
my_top5$car <- rownames(my_top5)

my_p1 <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "grey60") +
  geom_point(data = my_top5, color = "steelblue", size = 3) +
  geom_text_repel(data = my_top5, aes(label = car), size = 3) +
  labs(title = "Weight vs MPG", x = "Weight", y = "MPG") +
  theme_minimal()

my_p2 <- ggplot(mtcars, aes(x = mpg, y = factor(cyl), fill = factor(cyl))) +
  geom_density_ridges(alpha = 0.6) +
  labs(title = "MPG by Cylinders", x = "MPG", y = "Cylinders") +
  theme_minimal() +
  theme(legend.position = "none")

(my_p1 | my_p2) + plot_annotation(tag_levels = "A")
#> [two-panel figure: (A) labeled scatter, (B) ridgeline densities]
```

**Explanation:** Each plot is built independently with its own extension, then combined with `|` for side-by-side layout. `plot_annotation(tag_levels = "A")` labels them (A) and (B).

</details>

### Exercise 2: Styled Correlation Matrix

Build a correlation matrix of `mtcars` columns (mpg, hp, wt, qsec, drat) using ggcorrplot. Use `method = "square"` and `type = "upper"`. Apply a Nature Publishing Group (`scale_fill_npg()` won't work here, use custom colors from ggsci's NPG palette). Add a ggtext-styled title where "positive" is blue and "negative" is red.

```r title="Exercise one solution: Top five labelled ridges"
# Exercise 2: ggcorrplot + ggsci-inspired colors + ggtext title
# Hint: use ggcorrplot's colors argument for custom palette
# Hint: use labs(title = ...) with HTML spans, then element_markdown()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise two: Correlation plot with styled title"
my_cor <- round(cor(mtcars[, c("mpg", "hp", "wt", "qsec", "drat")]), 2)

ggcorrplot(my_cor, method = "square", type = "upper",
           lab = TRUE, lab_size = 4,
           colors = c("#3C5488", "white", "#E64B35")) +
  labs(title = "<span style='color:#3C5488'>Positive</span> and
<span style='color:#E64B35'>negative</span> correlations in mtcars") +
  theme(plot.title = element_markdown(size = 13))
#> [upper-triangle square heatmap with NPG-inspired blue/red colors
#>  and a title with colored words]
```

**Explanation:** ggcorrplot's `colors` argument takes three values (low, mid, high). The NPG blue (#3C5488) and red (#E64B35) are from ggsci's palette. `element_markdown()` from ggtext renders the HTML spans in the title.

</details>

### Exercise 3: Zoom + Rich Labels + Custom Palette

Create a scatter plot of `diamonds` (carat vs price, colored by clarity, sampled to 2000 rows) with: (1) `facet_zoom(x = carat < 0.5)` from ggforce to zoom into small diamonds, (2) a ggtext-styled subtitle that highlights the word "small" in bold red, and (3) a ggsci `scale_color_d3()` palette. Save as `my_zoom_plot`.

```r title="Exercise two solution: Styled correlation heatmap"
# Exercise 3: ggforce + ggtext + ggsci
# Hint: use element_markdown() for the subtitle
# Hint: sample diamonds first for speed

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise three: Diamond facet zoom with palette"
set.seed(99)
my_diamonds <- diamonds[sample(nrow(diamonds), 2000), ]

my_zoom_plot <- ggplot(my_diamonds, aes(carat, price, color = clarity)) +
  geom_point(alpha = 0.5, size = 1.5) +
  facet_zoom(x = carat < 0.5) +
  scale_color_d3() +
  labs(title = "Diamond Prices by Clarity",
       subtitle = "Zooming into <span style='color:#E41A1C;font-weight:bold'>small</span> stones (< 0.5 carat)") +
  theme_minimal() +
  theme(plot.subtitle = element_markdown())
my_zoom_plot
#> [two-panel zoom: left = all data with D3 colors, right = carat < 0.5 zoomed]
```

**Explanation:** `facet_zoom()` creates a linked zoom panel. The ggtext subtitle uses HTML to make "small" bold and red. `scale_color_d3()` provides a distinctive 10-color palette from the D3.js library.

</details>

## Putting It All Together

Let's build a polished multi-panel analysis of `mtcars` that combines five extensions in one figure: ggrepel for labels, ggtext for a rich title, ggsci for a professional palette, ggcorrplot for correlations, and patchwork to combine everything.

```r title="Capstone: Multi-extension composite panel"
# Panel A: Scatter with labeled outliers
top_efficient <- mtcars[order(-mtcars$mpg)[1:5], ]
top_efficient$car <- rownames(top_efficient)

panel_a <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 2.5) +
  geom_text_repel(data = top_efficient, aes(label = car),
                  color = "black", size = 3, max.overlaps = 10) +
  scale_color_npg(name = "Cylinders") +
  labs(x = "Weight (1000 lbs)", y = "MPG") +
  theme_minimal()

# Panel B: Correlation matrix
cor_vars <- round(cor(mtcars[, c("mpg", "hp", "wt", "disp", "drat")]), 2)

panel_b <- ggcorrplot(cor_vars, method = "circle", type = "lower",
                       lab = TRUE, lab_size = 3,
                       colors = c("#3C5488", "white", "#E64B35"))

# Combine with patchwork
(panel_a | panel_b) +
  plot_annotation(
    title = "Motor Trend Cars: <span style='color:#3C5488'>Performance</span> vs <span style='color:#E64B35'>Efficiency</span>",
    tag_levels = "A",
    theme = theme(plot.title = element_markdown(size = 15))
  )
#> [A: scatter with NPG colors and ggrepel labels | B: correlation circles]
#> [Overall title with blue "Performance" and red "Efficiency"]
```

This figure tells a complete story: Panel A reveals the weight-efficiency trade-off with standout cars labeled, while Panel B quantifies how each variable relates to the others. The NPG colors and ggtext title make it publication-ready. Five extensions, one unified figure, that's the power of the ggplot2 ecosystem.

## Summary

Here's every extension covered in this article, with its category, key function, and whether it runs in the browser code blocks.

| # | Package | Category | Key Function | Browser? |
|---|---------|----------|-------------|----------|
| 1 | ggrepel | Labels | `geom_text_repel()` | Yes |
| 2 | ggtext | Labels | `element_markdown()` | Yes |
| 3 | geomtextpath | Labels | `geom_textline()` | No |
| 4 | ggforce | Geoms | `facet_zoom()` | Yes |
| 5 | ggridges | Geoms | `geom_density_ridges()` | Yes |
| 6 | ggbeeswarm | Geoms | `geom_beeswarm()` | Yes |
| 7 | ggdist | Geoms | `stat_halfeye()` | Yes |
| 8 | patchwork | Composition | `+`, `/`, `|` operators | Yes |
| 9 | cowplot | Composition | `plot_grid()`, `draw_plot()` | Yes |
| 10 | ggthemes | Themes | `theme_economist()` | Yes |
| 11 | hrbrthemes | Themes | `theme_ipsum()` | Yes |
| 12 | ggsci | Palettes | `scale_color_npg()` | Yes |
| 13 | paletteer | Palettes | `scale_color_paletteer_d()` | Yes |
| 14 | ggnewscale | Palettes | `new_scale_color()` | Yes |
| 15 | gghighlight | Annotation | `gghighlight()` | No |
| 16 | ggpubr | Statistics | `stat_compare_means()` | Yes |
| 17 | ggcorrplot | Statistics | `ggcorrplot()` | Yes |
| 18 | GGally | Statistics | `ggpairs()` | Yes |
| 19 | ggstatsplot | Statistics | `ggbetweenstats()` | No |
| 20 | gganimate | Animation | `transition_time()` | No |
| 21 | plotly | Interactive | `ggplotly()` | No |
| 22 | treemapify | Specialised | `geom_treemap()` | Yes |
| 23 | waffle | Specialised | `geom_waffle()` | Yes |
| 24 | ggiraph | Interactive | `geom_point_interactive()` | No |
| 25 | ggalluvial | Specialised | `geom_alluvium()` | No |

Every extension follows the same pattern: install the package, load it with `library()`, and add its geoms, themes, or scales to your existing ggplot code. Start with the ones that solve your most pressing pain point, for most people, that's ggrepel (labels) and patchwork (multi-panel figures).

## References

1. Official ggplot2 Extensions Gallery, curated list of 100+ community packages. [Link](https://exts.ggplot2.tidyverse.org/gallery/)
2. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). [Link](https://ggplot2-book.org/)
3. Slowkowski, K., ggrepel documentation: repulsive text and label geoms. [Link](https://ggrepel.slowkow.com/)
4. Pedersen, T.L., patchwork: the composer of plots. [Link](https://patchwork.data-imaginist.com/)
5. Pedersen, T.L., ggforce: accelerating ggplot2. [Link](https://ggforce.data-imaginist.com/)
6. Wilke, C.O., ggtext: improved text rendering for ggplot2. [Link](https://wilkelab.org/ggtext/)
7. Hvitfeldt, E., paletteer: comprehensive collection of colour palettes. [Link](https://emilhvitfeldt.github.io/paletteer/)
8. Pedersen, T.L. & Robinson, D., gganimate: a grammar of animated graphics. [Link](https://gganimate.com/)
9. Kassambara, A., ggpubr: publication-ready plots. [Link](https://rpkgs.datanovia.com/ggpubr/)
10. Patil, I., ggstatsplot: ggplot2-based plots with statistical details. [Link](https://indrajeetpatil.github.io/ggstatsplot/)

## Continue Learning

1. [ggforce Package in R](ggforce-Package.html), Deep dive into facet_zoom, mark ellipses, arc bars, sina plots, and 30+ advanced ggplot2 geoms
2. [patchwork in R](patchwork-Package.html), Master multi-panel figures with aligned axes, shared legends, and complex nested layouts
3. [ggdist Package in R](ggdist-Package-in-R.html), Raincloud plots, half-eye plots, uncertainty bands, and distribution visualisation with stat_halfeye and stat_dots
