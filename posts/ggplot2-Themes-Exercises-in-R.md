---
title: "ggplot2 Themes Exercises in R: 20 Practice Problems"
slug: "ggplot2-Themes-Exercises-in-R"
description: "20 ggplot2 themes exercises: built-in themes, axis text, legend, gridlines, plot.margin, theme_set, reusable corporate theme functions. Solutions hidden."
keywords: "ggplot2 themes exercises, customize ggplot theme, theme() function R, theme_minimal exercises, reusable ggplot theme"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Themes Exercises"
sidebar_order: 154
fr_parent: "ggplot2-Themes-in-R.html"
auto_link_terms: "ggplot2 themes exercises|customize ggplot theme|theme() exercises|theme_minimal practice|reusable ggplot theme"
auto_link_case_sensitive: false
target_keyword: "ggplot2 themes exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Themes Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on ggplot2 themes covering built-ins, axis text, legends, gridlines, plot titles, plot margins, and reusable theme functions. Each problem hides its solution behind a click to keep you honest.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(scales)
```

## Section 1. Built-in themes (3 problems)

### Exercise 1.1: Replace the default gray theme with theme_minimal on an mpg scatter

**Task:** A junior analyst is sharing an early exploration of fuel economy. Build a scatter plot from the built-in `mpg` dataset with `displ` on the x-axis, `hwy` on the y-axis, and apply `theme_minimal()` so the default gray background disappears. Save the result to `ex_1_1`.

**Expected result:**

```
#> Scatter plot of displ vs hwy. White panel background, light gray gridlines, no axis lines, sans-serif axis labels and tick text.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  theme_minimal()
ex_1_1
#> Scatter plot rendered with white panel, no border, faint gray gridlines.
```

**Explanation:** `theme_minimal()` is the most common drop-in replacement for the default `theme_gray()`. It removes the gray panel fill, keeps subtle gridlines, and drops axis ticks, which makes the plot read more like a publication figure. Position theme calls AFTER all geoms and scales so later additions cannot override the look you just set.

</details>

### Exercise 1.2: Style a diamonds boxplot with theme_classic for a journal figure

**Task:** A code reviewer is standardizing team chart style and recommends `theme_classic()` for print figures because it strips gridlines and leaves only the two axis lines. Build a boxplot of `diamonds` price by `cut`, apply `theme_classic()`, and save to `ex_1_2`.

**Expected result:**

```
#> Boxplot of price by cut. White panel, NO gridlines, only x and y axis lines visible (L-shape), no panel border. Looks like a base R plot but typeset cleaner.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(diamonds, aes(cut, price)) +
  geom_boxplot() +
  theme_classic()
ex_1_2
#> L-shaped axes, no grid, no border. Journal-ready.
```

**Explanation:** `theme_classic()` strips the panel border AND the gridlines, leaving just the two axis lines, which mimics journal style. The visual contrast with `theme_bw()` (which keeps the grid and adds a black border) is what makes `theme_classic()` the right default for static print figures where any gridline clutter competes with the data. For dashboards where readers need to estimate exact values, prefer `theme_bw()` or `theme_minimal()` instead.

</details>

### Exercise 1.3: Strip every non-data element with theme_void for a sparkline

**Task:** A product manager wants a tiny sparkline of `economics` unemployment to embed inside a KPI card with no axis chrome at all. Plot `unemploy` over `date` as a line, apply `theme_void()`, and save to `ex_1_3` so the resulting plot is pure ink.

**Expected result:**

```
#> Single line of unemploy over time. No axes, no ticks, no labels, no panel border, no background fill, no title.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  theme_void()
ex_1_3
#> Pure line, no chrome. Ideal as a sparkline.
```

**Explanation:** `theme_void()` is more aggressive than `theme_minimal()`: it removes EVERY non-data element, including axes, ticks, labels, and the panel background. Use it for sparklines, map insets, or composite figures where surrounding axes would compete with the data. If you only need to drop ONE element, prefer overriding it inside `theme()` rather than starting from `theme_void()` and adding everything back.

</details>

## Section 2. Text, font, and axis customization (3 problems)

### Exercise 2.1: Rotate long x-axis labels 45 degrees for a category bar chart

**Task:** A marketing analyst built a bar chart of average `cty` mileage by `manufacturer` from `mpg`, but the manufacturer labels overlap and become unreadable. Rotate the x-axis text to 45 degrees with right-justified anchoring inside `theme()` and save the corrected plot to `ex_2_1`.

**Expected result:**

```
#> Bar chart of average cty by manufacturer. x-axis labels rotated 45 degrees, top-right corner of each label sits flush against its tick.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- ggplot(mpg, aes(manufacturer, cty)) +
  stat_summary(fun = mean, geom = "col") +
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mpg, aes(manufacturer, cty)) +
  stat_summary(fun = mean, geom = "col") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_2_1
#> Labels rotated, no overlap, anchored to ticks.
```

**Explanation:** `angle = 45` rotates the text counter-clockwise, but rotation alone leaves the labels centered on the tick, causing them to drift away. `hjust = 1` re-anchors the right edge of the label to the tick mark, which is the visual contract readers expect. If you rotate 90 degrees instead, use `vjust = 0.5` to recenter vertically.

</details>

### Exercise 2.2: Bold axis titles and increase base font size for a poster print

**Task:** A statistician is preparing a `ChickWeight` plot for a conference poster and needs all axis titles in bold and the overall font scaled up. Build a line plot of `weight` over `Time` colored by `Diet`, then customize `axis.title` to be bold and apply `theme_minimal(base_size = 16)`. Save to `ex_2_2`.

**Expected result:**

```
#> Line plot of weight by Time, four colored lines for Diet. All text is larger than default, axis titles "Time" and "weight" rendered in bold.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- ggplot(ChickWeight, aes(Time, weight, color = Diet, group = Chick)) +
  geom_line() +
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(ChickWeight, aes(Time, weight, color = Diet, group = Chick)) +
  geom_line() +
  theme_minimal(base_size = 16) +
  theme(axis.title = element_text(face = "bold"))
ex_2_2
#> Larger text overall, bold axis titles.
```

**Explanation:** `base_size` is a single argument that scales every text element proportionally, which is the right knob for poster vs slide vs paper figures. Applying `theme_minimal(base_size = 16)` BEFORE the `theme()` override matters: a built-in theme always wipes whatever you set previously, so customizations must come last. `face` accepts `"plain"`, `"italic"`, `"bold"`, or `"bold.italic"`.

</details>

### Exercise 2.3: Color and bold an individual axis title for emphasis

**Task:** An ops engineer building a status dashboard wants the y-axis title "Unemployed (thousands)" to render in dark red and bold to flag it as the metric of interest, while leaving the x-axis title alone. Plot `economics$unemploy` over `date` as a line and configure only `axis.title.y`. Save to `ex_2_3`.

**Expected result:**

```
#> Line plot of unemploy over date. y-axis title shown in dark red, bold face. x-axis title in default black non-bold.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  labs(x = "Date", y = "Unemployed (thousands)") +
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  labs(x = "Date", y = "Unemployed (thousands)") +
  theme(axis.title.y = element_text(color = "darkred", face = "bold"))
ex_2_3
#> y-axis title bold dark red, x-axis title untouched.
```

**Explanation:** `axis.title` is the parent element; `axis.title.x` and `axis.title.y` let you set each independently. The same hierarchical pattern applies to `axis.text.x`/`axis.text.y` and `axis.ticks.x`/`axis.ticks.y`. Override the most specific level you need; touching the parent affects both axes, which is rarely what you want when emphasizing a single metric.

</details>

## Section 3. Legend placement and styling (3 problems)

### Exercise 3.1: Move the legend to the bottom and drop its title

**Task:** A reporting analyst is squeezing a `diamonds` density plot into a narrow column and needs the legend below the panel, not on the right where it eats horizontal space. Build a `geom_density()` of `price` filled by `cut`, move the legend to the bottom, and drop the legend title via `legend.title = element_blank()`. Save to `ex_3_1`.

**Expected result:**

```
#> Density plot of price filled by cut. Legend strip sits below the x-axis. No "cut" label above the legend keys.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- ggplot(diamonds, aes(price, fill = cut)) +
  geom_density(alpha = 0.4) +
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(diamonds, aes(price, fill = cut)) +
  geom_density(alpha = 0.4) +
  theme(legend.position = "bottom",
        legend.title    = element_blank())
ex_3_1
#> Bottom legend, no "cut" header.
```

**Explanation:** `legend.position` accepts `"top"`, `"bottom"`, `"left"`, `"right"`, `"none"`, or a numeric vector like `c(0.8, 0.2)` for inside-the-panel placement using normalized coordinates. `element_blank()` is the universal "delete this element" function and is preferable to setting `color = NA` because it also collapses the space the element would have occupied.

</details>

### Exercise 3.2: Tighten legend key size and add a panel-style background

**Task:** A geneticist preparing a clinical heatmap legend wants compact keys with a light gray background and a thin black border so the legend reads as its own self-contained unit. Build a scatter of `mpg$hwy` vs `displ` colored by `class`, set `legend.key.size` to 0.5 cm and configure `legend.background`. Save to `ex_3_2`.

**Expected result:**

```
#> Scatter colored by class. Legend keys ~0.5 cm tall, the legend sits in a light gray rounded-ish box with a thin black border.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- ggplot(mpg, aes(displ, hwy, color = class)) +
  geom_point() +
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(mpg, aes(displ, hwy, color = class)) +
  geom_point() +
  theme(legend.key.size   = unit(0.5, "cm"),
        legend.background = element_rect(fill = "gray95", color = "black", linewidth = 0.3))
ex_3_2
#> Compact keys, framed legend.
```

**Explanation:** `unit()` from the `grid` package controls measurement. `cm`, `in`, `mm`, `pt`, and `lines` are common units; `lines` scales with the base font size, which is the safest choice if your theme size changes. `element_rect()` is the rectangular-element constructor used for backgrounds, panels, and strips, and `linewidth` (not `size`) is the modern argument for border thickness since ggplot2 3.4.

</details>

### Exercise 3.3: Hide the legend completely when color is self-explanatory

**Task:** A scout has a `ChickWeight` plot where each `Chick` is its own line and the line color is purely decorative since chicks are unnamed. Hide the legend entirely with `legend.position = "none"` and save the cleaned-up plot to `ex_3_3`.

**Expected result:**

```
#> Spaghetti plot of weight vs Time, lines colored by Chick. No legend on the right, plot panel fills the whole figure width.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_3 <- ggplot(ChickWeight, aes(Time, weight, color = factor(Chick), group = Chick)) +
  geom_line() +
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(ChickWeight, aes(Time, weight, color = factor(Chick), group = Chick)) +
  geom_line() +
  theme(legend.position = "none")
ex_3_3
#> No legend, panel expands.
```

**Explanation:** Setting `legend.position = "none"` is the canonical way to suppress the legend for ALL aesthetics. To hide just ONE legend while keeping others, use `guides(color = "none")` instead, scoped to the specific aesthetic. The third option is `scale_color_discrete(guide = "none")` which is the most local. Pick the narrowest one that does the job.

</details>

## Section 4. Gridlines and panel customization (3 problems)

### Exercise 4.1: Drop minor gridlines and keep only major y-gridlines

**Task:** An audit team reviewing a `txhousing` median-sales line plot finds the minor gridlines distracting and wants major y-gridlines only. Drop `panel.grid.minor` entirely and remove `panel.grid.major.x` so vertical major lines also disappear, leaving horizontal majors as the only grid. Save to `ex_4_1`.

**Expected result:**

```
#> Line plot of median over date. Horizontal gridlines visible at major y-ticks. No vertical gridlines anywhere. No minor gridlines either.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- ggplot(txhousing, aes(date, median)) +
  geom_line(stat = "summary", fun = mean) +
  theme_minimal() +
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(txhousing, aes(date, median)) +
  geom_line(stat = "summary", fun = mean) +
  theme_minimal() +
  theme(panel.grid.minor   = element_blank(),
        panel.grid.major.x = element_blank())
ex_4_1
#> Horizontal-only grid.
```

**Explanation:** Gridlines follow the parent-child hierarchy: `panel.grid` covers all four, `panel.grid.major` and `panel.grid.minor` cover the two halves, and the `.x`/`.y` suffix targets a single axis direction. When you want a horizontal-only grid (common in dashboards for reading time-series values), the combination of "kill minor entirely, kill major-x" is the cleanest path. Avoid `panel.grid.major.x = element_line(color = NA)`: the element still occupies space and can affect spacing math.

</details>

### Exercise 4.2: Switch panel background to off-white for a slide deck theme

**Task:** A growth team is recoloring a `mpg` bubble chart for a slide deck where the slide background is off-white (`#FAF7F2`) and the panel must match so the chart blends in. Set both `panel.background` and `plot.background` to that hex value, drop all gridlines, and save to `ex_4_2`.

**Expected result:**

```
#> Bubble chart of hwy vs displ sized by cty. Both inside-the-axes panel and outside-the-axes plot background are off-white #FAF7F2. No gridlines visible.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- ggplot(mpg, aes(displ, hwy, size = cty)) +
  geom_point(alpha = 0.6) +
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(mpg, aes(displ, hwy, size = cty)) +
  geom_point(alpha = 0.6) +
  theme(panel.background = element_rect(fill = "#FAF7F2", color = NA),
        plot.background  = element_rect(fill = "#FAF7F2", color = NA),
        panel.grid       = element_blank())
ex_4_2
#> Two-tone-free off-white background.
```

**Explanation:** `panel.background` is the region INSIDE the axes; `plot.background` is the region OUTSIDE the axes including the margins. Setting only one causes a visible color boundary where the panel meets the margin, which looks broken on a slide. Always set both to the same color when matching a slide template. `color = NA` removes the border line that `element_rect()` would otherwise draw at full color.

</details>

### Exercise 4.3: Replace the gray panel with a black panel border for a journal figure

**Task:** A biostatistician submitting to a journal needs a strict figure style: white panel, no gridlines, and a thin black panel border. Build a scatter of `iris$Sepal.Length` vs `Petal.Length` colored by `Species`, start from `theme_bw()`, then override `panel.grid` and `panel.border`. Save to `ex_4_3`.

**Expected result:**

```
#> Scatter of Sepal.Length vs Petal.Length, three Species colors. White panel inside a thin black rectangle. No gridlines. Axis ticks visible.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) +
  geom_point() +
  theme_bw() +
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) +
  geom_point() +
  theme_bw() +
  theme(panel.grid   = element_blank(),
        panel.border = element_rect(color = "black", fill = NA, linewidth = 0.5))
ex_4_3
#> Bordered, gridless, journal-ready.
```

**Explanation:** Starting from `theme_bw()` gives you the black border for free, but the border element it ships with is sometimes too thick or the wrong color for a target journal. Re-declaring `panel.border` with explicit `fill = NA` is critical: if you forget `fill = NA`, the panel rectangle paints OVER your data points. `fill = NA` means "no fill, only outline", which is the contract for rectangular borders in ggplot2.

</details>

## Section 5. Titles, captions, and margins (5 problems)

### Exercise 5.1: Center the plot title and set it to bold 16pt

**Task:** A finance team prep for a monthly memo wants the chart title centered and visually dominant. Build any line plot of `AirPassengers` converted to a tibble (provided), add a `labs(title = ...)`, then set `plot.title` to bold 16pt with horizontal-just 0.5 so it sits over the middle of the plot. Save to `ex_5_1`.

**Expected result:**

```
#> Line plot of AirPassengers monthly counts. Title "Monthly air passengers, 1949-1960" rendered bold and centered over the plot panel.
```

**Difficulty:** Beginner

```r title="Your turn"
ap <- data.frame(month = as.Date(time(AirPassengers)), passengers = as.numeric(AirPassengers))
ex_5_1 <- ggplot(ap, aes(month, passengers)) +
  geom_line() +
  labs(title = "Monthly air passengers, 1949-1960") +
  # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ap <- data.frame(month = as.Date(time(AirPassengers)), passengers = as.numeric(AirPassengers))
ex_5_1 <- ggplot(ap, aes(month, passengers)) +
  geom_line() +
  labs(title = "Monthly air passengers, 1949-1960") +
  theme(plot.title = element_text(face = "bold", size = 16, hjust = 0.5))
ex_5_1
#> Centered bold title.
```

**Explanation:** By default ggplot2 left-aligns titles, which is a deliberate choice for editorial style: the title aligns with the first axis tick. `hjust = 0.5` centers the title over the entire plot area (not the panel) but it is a strong convention in business reports and slides. Use `hjust = 0` for newsletter style or `hjust = 1` to right-align under the legend.

</details>

### Exercise 5.2: Style title, subtitle, and caption together for a publication

**Task:** A climatologist publishing a `co2` trend chart needs the title bold size 14, subtitle in italic gray, and the caption in small light gray right-aligned. Build the chart with all three labels via `labs()`, then customize all three corresponding theme elements. Save to `ex_5_2`.

**Expected result:**

```
#> Line plot of co2 over time. Bold title at top. Italic gray subtitle just below. Small light gray caption "Source: Mauna Loa" right-aligned at the bottom.
```

**Difficulty:** Intermediate

```r title="Your turn"
co2_df <- data.frame(month = as.Date(time(co2)), ppm = as.numeric(co2))
ex_5_2 <- ggplot(co2_df, aes(month, ppm)) +
  geom_line(color = "steelblue") +
  labs(title = "Atmospheric CO2 concentration",
       subtitle = "Monthly mean, Mauna Loa Observatory",
       caption = "Source: Mauna Loa") +
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
co2_df <- data.frame(month = as.Date(time(co2)), ppm = as.numeric(co2))
ex_5_2 <- ggplot(co2_df, aes(month, ppm)) +
  geom_line(color = "steelblue") +
  labs(title = "Atmospheric CO2 concentration",
       subtitle = "Monthly mean, Mauna Loa Observatory",
       caption = "Source: Mauna Loa") +
  theme(plot.title    = element_text(face = "bold", size = 14),
        plot.subtitle = element_text(face = "italic", color = "gray40"),
        plot.caption  = element_text(size = 8, color = "gray50", hjust = 1))
ex_5_2
#> Three-tier label hierarchy.
```

**Explanation:** `plot.title`, `plot.subtitle`, and `plot.caption` are siblings under the `plot.*` namespace and each can be customized independently. A consistent typographic hierarchy (bold title, italic subtitle, small caption) is what separates dashboard-quality figures from script output. The caption is right-aligned by convention in journalism (think NYT charts), left-aligned in academic style.

</details>

### Exercise 5.3: Tighten plot.margin for a dense dashboard layout

**Task:** A SRE building a Grafana-style ops dashboard needs to pack multiple `mpg` charts into one row with minimal whitespace. Override `plot.margin` to 2 mm on all four sides instead of the default 5.5 pt and save the resulting compact scatter to `ex_5_3`.

**Expected result:**

```
#> Scatter plot of hwy vs displ. The visible white space between the figure edge and the axis labels is noticeably tighter than default, ~2 mm on every side.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  theme_minimal() +
  # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  theme_minimal() +
  theme(plot.margin = margin(2, 2, 2, 2, "mm"))
ex_5_3
#> Tighter margins, denser dashboard tile.
```

**Explanation:** `margin()` takes top, right, bottom, left, unit in that order, mirroring CSS. The default is `margin(5.5, 5.5, 5.5, 5.5, "pt")`. Shrinking to 2 mm gains real estate in dashboard tiles where every pixel counts, but be careful: tight margins can cut off rotated axis labels or long y-axis titles. For dashboard composition, also consider `patchwork::wrap_plots()` which handles margin coordination across panels.

</details>

### Exercise 5.4: Apply a project-wide theme via theme_set then restore the default

**Task:** A platform engineer wants every subsequent chart in a notebook to use `theme_minimal(base_size = 13)` without retyping it on each plot. Use `theme_set()` to install that as the global default, build a quick `iris` scatter to confirm, capture it as `ex_5_4`, then reset with `theme_set(theme_gray())` so other code is unaffected.

**Expected result:**

```
#> Scatter of iris Sepal.Length vs Petal.Length with the minimal theme applied automatically (no theme_minimal() in the plot call). Base size visibly larger than default.
```

**Difficulty:** Advanced

```r title="Your turn"
# install global theme, then build plot, then restore
ex_5_4 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
old_theme <- theme_set(theme_minimal(base_size = 13))

ex_5_4 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) +
  geom_point()
ex_5_4

theme_set(old_theme)  # restore previous default
#> Plot rendered with minimal theme at base_size=13 without any theme() call in its construction.
```

**Explanation:** `theme_set()` mutates global state and RETURNS the previous theme, which is the idiomatic R pattern for reversible configuration (same shape as `par()`). Always capture the return value so you can restore on exit, especially in shared notebooks or package code. For a strict restore guarantee, wrap the body in `on.exit(theme_set(old_theme))` inside a function. The companion functions are `theme_update()` (modify the current default in place) and `theme_replace()` (replace specific elements only).

</details>

### Exercise 5.5: Add a tag label in the top-left corner for figure numbering

**Task:** A pharmacology team submitting a multi-panel manuscript figure needs a bold "A" tag in the top-left corner of one panel to identify it as Panel A in the figure caption. Build a `ToothGrowth` boxplot, add `labs(tag = "A")`, then style `plot.tag` to be bold and slightly larger. Save to `ex_5_5`.

**Expected result:**

```
#> Boxplot of len by dose. Bold letter "A" rendered in the top-left corner outside the plot panel, larger than body text.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- ggplot(ToothGrowth, aes(factor(dose), len)) +
  geom_boxplot() +
  labs(tag = "A") +
  # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- ggplot(ToothGrowth, aes(factor(dose), len)) +
  geom_boxplot() +
  labs(tag = "A") +
  theme(plot.tag = element_text(face = "bold", size = 14))
ex_5_5
#> Bold "A" tag in top-left.
```

**Explanation:** `plot.tag` is a less-known theme element designed exactly for multi-panel figure labels in scientific publishing. Its default position is the top-left corner via `plot.tag.position = "topleft"`. You can also pass a numeric `c(x, y)` in normalized panel coordinates for fine-grained control. Composing with `patchwork` is a more powerful path when you have many panels: the `plot_annotation(tag_levels = "A")` argument auto-generates A, B, C, ...

</details>

## Section 6. Reusable custom themes (3 problems)

### Exercise 6.1: Modify theme_minimal in place with %+replace% for a quick rebrand

**Task:** A reporting analyst inherits a `mpg` chart styled with `theme_minimal()` but the brand now requires a serif font everywhere and no panel gridlines. Use the `%+replace%` operator to create a new theme that starts from `theme_minimal()` and overrides text family and gridlines in one expression. Save the styled plot to `ex_6_1`.

**Expected result:**

```
#> Scatter of hwy vs displ. All text rendered in serif font. No gridlines on the panel. Otherwise looks like theme_minimal.
```

**Difficulty:** Intermediate

```r title="Your turn"
brand_minimal <- theme_minimal() %+replace% theme(
  # your code here
)
ex_6_1 <- ggplot(mpg, aes(displ, hwy)) + geom_point() + brand_minimal
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
brand_minimal <- theme_minimal() %+replace% theme(
  text       = element_text(family = "serif"),
  panel.grid = element_blank()
)
ex_6_1 <- ggplot(mpg, aes(displ, hwy)) + geom_point() + brand_minimal
ex_6_1
#> Serif text everywhere, no grid.
```

**Explanation:** The `%+replace%` operator REPLACES specified elements wholesale, where `+` only MERGES the changed properties into the existing element. Pick `%+replace%` when you want a clean slate per element (no leftover italic/bold from the parent theme); pick `+` when you only want to tweak a property like color without losing the size or face that the parent theme defined. Both operators build up reusable theme objects you can `+` onto any plot.

</details>

### Exercise 6.2: Wrap a corporate color palette into a reusable theme function

**Task:** A platform engineer rolling out a company style guide needs a `theme_corporate()` function that takes a `base_size` argument and returns a theme with a light gray panel, navy axis titles, no minor gridlines, and serif font. Write the function, then apply it to a `diamonds` boxplot at `base_size = 12` and save to `ex_6_2`.

**Expected result:**

```
#> Boxplot of diamonds price by cut. Light gray panel inside the axes. Axis titles "cut" and "price" rendered in navy serif font. Only major gridlines visible.
```

**Difficulty:** Advanced

```r title="Your turn"
theme_corporate <- function(base_size = 11) {
  # your code here
}
ex_6_2 <- ggplot(diamonds, aes(cut, price)) + geom_boxplot() + theme_corporate(base_size = 12)
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
theme_corporate <- function(base_size = 11) {
  theme_minimal(base_size = base_size) %+replace%
    theme(
      panel.background = element_rect(fill = "gray95", color = NA),
      axis.title       = element_text(color = "navy", family = "serif"),
      panel.grid.minor = element_blank(),
      text             = element_text(family = "serif")
    )
}
ex_6_2 <- ggplot(diamonds, aes(cut, price)) +
  geom_boxplot() +
  theme_corporate(base_size = 12)
ex_6_2
#> Navy serif titles, light gray panel.
```

**Explanation:** Wrapping theme customization in a function gives you a single source of truth: change `theme_corporate()` once and every chart that uses it updates. Always pass `base_size` through to the underlying base theme (`theme_minimal()` here) so callers can scale text for slides vs print without rewriting. Production teams often expose `base_family` and `accent_color` as additional arguments for further parameterization.

</details>

### Exercise 6.3: Build a dark-mode theme for embedded slide backgrounds

**Task:** A presentation designer wants a dark theme: near-black panel and plot backgrounds, light gray text, and white gridlines at 10 percent opacity. Wrap the customization in a function called `theme_dark_slide()`, apply it to a `faithful` density plot, and save to `ex_6_3`.

**Expected result:**

```
#> Density plot of eruptions duration. Dark near-black background covering both panel and plot regions. Light gray axis text and titles. Faint white gridlines visible against the dark backdrop.
```

**Difficulty:** Advanced

```r title="Your turn"
theme_dark_slide <- function() {
  # your code here
}
ex_6_3 <- ggplot(faithful, aes(eruptions)) +
  geom_density(fill = "tomato", alpha = 0.5) +
  theme_dark_slide()
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
theme_dark_slide <- function() {
  theme_minimal(base_size = 13) %+replace%
    theme(
      plot.background  = element_rect(fill = "gray10", color = NA),
      panel.background = element_rect(fill = "gray10", color = NA),
      text             = element_text(color = "gray85"),
      axis.text        = element_text(color = "gray85"),
      panel.grid       = element_line(color = alpha("white", 0.1))
    )
}
ex_6_3 <- ggplot(faithful, aes(eruptions)) +
  geom_density(fill = "tomato", alpha = 0.5) +
  theme_dark_slide()
ex_6_3
#> Dark panel, light text, faint white grid.
```

**Explanation:** Dark themes need careful contrast: pure black (`#000000`) is harsh on screen, so `gray10` reads softer while still feeling dark. The `alpha()` helper from `scales` ranges 0 to 1; gridlines at 0.1 alpha give a "ghost grid" effect that orients the eye without competing with data. Always recolor `text` AND `axis.text` separately: `text` is the parent for `axis.title` and labels but ggplot2 quirks mean `axis.text` sometimes needs its own override to fully invert.

</details>

## What to do next

- Re-style any of these plots with [ggplot2 Customization Exercises](ggplot2-Customization-Exercises.html) covering color, scales, and annotations.
- Practice axis ranges and breaks with [ggplot2 Axes Exercises in R](ggplot2-Axes-Exercises-in-R.html).
- Pair theme styling with multi-panel layouts in [ggplot2 Facets Exercises in R](ggplot2-Facets-Exercises-in-R.html).
- Reread the parent walkthrough at [ggplot2 Themes in R](ggplot2-Themes-in-R.html) to revisit the theme element hierarchy.
