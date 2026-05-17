---
title: "ggplot2 Customization Exercises in R: 17 Theme & Scale Practice Problems"
slug: "ggplot2-Customization-Exercises"
description: "Practice ggplot2 customization with 17 hands-on problems on themes, scales, axes, legends, labels, and reusable house styles. Solutions and explanations included."
keywords: "ggplot2 customization exercises, ggplot2 theme exercises, ggplot2 scale exercises, theme() practice problems, ggplot2 exercises with solutions, custom ggplot2 theme practice, scale_color_manual practice, ggplot2 legend exercises"
mathjax: false
webr: true
date: "2026-05-13"
curriculum_id: "E3.3"
post_type: "EX"
sidebar_title: "ggplot2 Customization (17 problems)"
sidebar_order: 145
fr_parent: "ggplot2-Themes-in-R.html"
auto_link_terms: "ggplot2 customization exercises|ggplot2 theme exercises|ggplot2 scale exercises|theme practice problems|custom ggplot2 theme|scale_color_manual practice"
auto_link_case_sensitive: false
target_keyword: "ggplot2 customization exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Customization Exercises in R: 17 Theme & Scale Practice Problems

<p class="lead">Seventeen runnable exercises that drill the four customization layers in ggplot2: theme presets, targeted theme() element overrides, colour and axis scales, and legend or label fine-tuning. Every problem ships with a hidden solution, an expected result, and an explanation of why the chosen approach is the idiomatic one.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(scales)
library(dplyr)
```

## Section 1. Theme presets and quick swaps (3 problems)

### Exercise 1.1: Apply theme_minimal with a larger base font

**Task:** Build a scatter plot of `mpg` versus `wt` from `mtcars`, coloured by `factor(cyl)`. Apply `theme_minimal()` with a base font size of 14 so the chart reads well in a slide deck. Save the finished plot object to `ex_1_1`.

**Expected result:**

```
#> Scatter of weight vs mpg, points coloured by cylinder count.
#> White panel, no grey background, axis labels and tick text noticeably
#> larger than ggplot2's 11-point default; faint grid lines remain.
```

**Difficulty:** Beginner

[HINTS]
Themes carry a single dial that rescales every text element at once - reach for that rather than restyling axis labels one by one.
Add `theme_minimal()` to the plot and pass it `base_size = 14`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  theme_minimal(base_size = 14)

ex_1_1
#> Scatter of weight vs mpg with light minimal theme and 14pt fonts.
```

**Explanation:** `theme_minimal()` strips the grey panel and axis lines but keeps faint grid lines, which works well for slides and reports. Passing `base_size = 14` rescales every text element at once, so axis titles, tick labels, and legend text all grow proportionally; setting fonts piece by piece in `theme()` would mean four or five separate `element_text()` calls. Use `base_family` the same way to swap fonts globally.

</details>

### Exercise 1.2: Compare theme_classic and theme_bw side by side

**Task:** Create two plot objects from the `iris` dataset showing `Sepal.Length` versus `Petal.Length` coloured by `Species`. Apply `theme_classic()` to the first and `theme_bw()` to the second so a reviewer can compare line-only versus boxed presentations. Save them to `ex_1_2_classic` and `ex_1_2_bw`, then save the *list* `list(classic = ex_1_2_classic, bw = ex_1_2_bw)` to `ex_1_2`.

**Expected result:**

```
#> ex_1_2$classic: scatter with axis lines only, no panel border, no grid.
#> ex_1_2$bw:      scatter inside a black rectangular border with light grid.
#> Both share the iris colour mapping and identical data layer.
```

**Difficulty:** Beginner

[HINTS]
Build the shared data layer once so the two plots differ only in the surrounding style you add afterwards.
Save the common ggplot to a `base` object, add `theme_classic()` and `theme_bw()` to it separately, then collect both in a named `list()`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
base <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, colour = Species)) +
  geom_point(size = 2)

ex_1_2_classic <- base + theme_classic()
ex_1_2_bw      <- base + theme_bw()
ex_1_2 <- list(classic = ex_1_2_classic, bw = ex_1_2_bw)
ex_1_2
#> $classic and $bw plots, identical data, different surrounds.
```

**Explanation:** Saving the shared layer to `base` and adding the theme afterwards is the cleanest way to compare presets without retyping the geom. `theme_classic()` removes the panel border and gridlines for a publication look; `theme_bw()` keeps the black border plus a soft grid, which suits exploratory work where you still need to read off values. Both inherit from `theme_grey()` and override only the elements they change.

</details>

### Exercise 1.3: Set a base font family and base line size globally

**Task:** Take the same `mpg` scatter from Exercise 1.1 and apply `theme_light()` with `base_size = 12`, `base_family = "sans"`, and `base_line_size = 0.4`. The thinner baseline width should make axis lines and ticks visibly lighter than the default. Save the finished plot to `ex_1_3`.

**Expected result:**

```
#> Light grey panel scatter with thinner-than-default axis ticks and
#> sans-family text. No code-level errors and no warning about missing fonts.
```

**Difficulty:** Intermediate

[HINTS]
Every built-in theme exposes proportional dials for fonts, lines, and rectangles, so thinner ticks come from a line dial rather than from styling ticks directly.
Call `theme_light()` with `base_size = 12`, `base_family = "sans"`, and `base_line_size = 0.4`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  theme_light(base_size = 12, base_family = "sans", base_line_size = 0.4)

ex_1_3
#> theme_light scatter with thinner ticks, sans font.
```

**Explanation:** Every built-in theme accepts `base_line_size` and `base_rect_size`, which scale all line and rectangle elements proportionally. This is the right knob when you want every axis tick, panel border, and grid line uniformly thinner; reaching for individual `element_line(linewidth = 0.4)` calls is verbose and forgets to update grid lines. `"sans"` always resolves on Windows, macOS, and Linux, so it is a safer default than naming Helvetica or Arial directly.

</details>

## Section 2. Targeted theme() element overrides (3 problems)

### Exercise 2.1: Rotate x-axis tick labels for crowded categorical axes

**Task:** A retailer compiled price-class counts from the `diamonds` dataset by cut and clarity, and the long clarity labels overlap when plotted unrotated. Build a bar chart of `count(diamonds, clarity)` with `clarity` on x and `n` on y, then rotate the x-axis tick labels 45 degrees with right-justified anchoring. Save to `ex_2_1`.

**Expected result:**

```
#> Bar chart, 8 bars (I1, SI2, SI1, VS2, VS1, VVS2, VVS1, IF) on x.
#> Tick labels printed at 45 degrees, ending flush against the tick.
#> Counts on y range from roughly 700 to 13000.
```

**Difficulty:** Intermediate

[HINTS]
Rotated tick text pivots around its anchor point, so the angle alone is not enough - you also need to control where the text is justified.
Inside `theme()`, set `axis.text.x = element_text(angle = 45, hjust = 1)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clarity_counts <- count(diamonds, clarity)
ex_2_1 <- ggplot(clarity_counts, aes(x = clarity, y = n)) +
  geom_col(fill = "steelblue") +
  theme_minimal(base_size = 12) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ex_2_1
#> Bar chart of clarity counts with rotated x labels.
```

**Explanation:** `axis.text.x` inherits from `axis.text`, so overriding it touches only the bottom axis and leaves y tick text alone. `hjust = 1` is the trick people miss: rotated text rotates around its anchor, and without right-justification the labels float away from their ticks. For more than ten categories or words longer than six characters, prefer `coord_flip()` or `scale_x_discrete(guide = guide_axis(n.dodge = 2))` rather than steeper angles.

</details>

### Exercise 2.2: Move the legend, restyle the legend background, and add a panel border

**Task:** Style a `geom_point()` of `mpg` versus `wt` from `mtcars`, coloured by `factor(cyl)`. Move the legend to the bottom of the plot, give the legend background a pale grey fill with no border, and draw a thin black border around the panel. Save the finished plot to `ex_2_2`.

**Expected result:**

```
#> Scatter inside a thin black panel border. Legend sits below the plot,
#> oriented horizontally, on a pale grey rectangular background with no
#> visible legend border.
```

**Difficulty:** Intermediate

[HINTS]
Legend placement, the legend's rectangular backdrop, and the panel frame are three independent settings, each targeting a different region of the plot.
In `theme()`, set `legend.position = "bottom"`, `legend.background = element_rect(fill = "grey95", colour = NA)`, and `panel.border = element_rect(fill = NA, colour = "black")`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  theme_minimal(base_size = 12) +
  theme(
    legend.position   = "bottom",
    legend.background = element_rect(fill = "grey95", colour = NA),
    panel.border      = element_rect(fill = NA, colour = "black", linewidth = 0.5)
  )

ex_2_2
#> Bottom-legend scatter with grey legend strip and bordered panel.
```

**Explanation:** `element_rect()` is the right element for any rectangular region: legend background, panel border, plot background, facet strips. `fill = NA` is the only way to keep the panel border line without filling the panel itself; passing `fill = "white"` would override your colour scale's defaults. Setting `colour = NA` on the legend background suppresses its outline cleanly without resorting to `element_blank()`, which would also remove the fill.

</details>

### Exercise 2.3: Hide the minor grid lines and lighten the major grid

**Task:** Build a line chart of `economics$unemploy` over `economics$date`. Hide all minor grid lines using `element_blank()`, and recolour the major grid lines to a very light grey (`grey90`) with `linewidth = 0.3`. Save the plot to `ex_2_3`.

**Expected result:**

```
#> Time-series line of US unemployment, 1967-2015.
#> No minor grid lines visible.
#> Major grid lines present but barely visible, in pale grey.
```

**Difficulty:** Intermediate

[HINTS]
Major and minor grid lines are separate leaf-level settings, so you can erase one while only recolouring the other.
In `theme()`, set `panel.grid.minor = element_blank()` and `panel.grid.major = element_line(colour = "grey90", linewidth = 0.3)`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line(colour = "steelblue") +
  theme_minimal(base_size = 12) +
  theme(
    panel.grid.minor = element_blank(),
    panel.grid.major = element_line(colour = "grey90", linewidth = 0.3)
  )

ex_2_3
#> Unemployment line with hidden minor grid and pale major grid.
```

**Explanation:** `panel.grid.minor` and `panel.grid.major` inherit from `panel.grid`, so overriding them at the leaf level lets you keep major grid hints while killing the minor ones. `element_blank()` is the canonical "remove this" element; setting `colour = NA` would leave an invisible line that still consumes layout space. Pale major grid lines are a common journal style: they orient the eye without competing with the data layer.

</details>

## Section 3. Colour and fill scales (3 problems)

### Exercise 3.1: Apply a manual three-colour palette to a categorical fill

**Task:** Plot the `count(diamonds, cut)` distribution as a bar chart with `cut` on x and `n` on y, filling by `cut`. Apply a manual five-colour palette using `scale_fill_manual()` with the values `c("Fair" = "#7f7f7f", "Good" = "#bcbd22", "Very Good" = "#17becf", "Premium" = "#e377c2", "Ideal" = "#1f77b4")`. Save to `ex_3_1`.

**Expected result:**

```
#> Five vertical bars labelled Fair, Good, Very Good, Premium, Ideal.
#> Bars filled with grey, olive, teal, pink, blue in that left-to-right order.
#> Y axis spans 0 to ~22000.
```

**Difficulty:** Intermediate

[HINTS]
A manual palette is safest when each colour is tied to a named level rather than left to positional order.
Use `scale_fill_manual(values = ...)` with a vector named by each cut level.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cut_counts <- count(diamonds, cut)
ex_3_1 <- ggplot(cut_counts, aes(x = cut, y = n, fill = cut)) +
  geom_col() +
  scale_fill_manual(values = c(
    "Fair"      = "#7f7f7f",
    "Good"      = "#bcbd22",
    "Very Good" = "#17becf",
    "Premium"   = "#e377c2",
    "Ideal"     = "#1f77b4"
  )) +
  theme_minimal(base_size = 12)

ex_3_1
#> Five-bar chart with the named manual palette.
```

**Explanation:** Naming the palette vector by level (rather than passing an unnamed vector of five colours) is defensive: the colour for "Ideal" stays correct even if the factor levels get reordered upstream. `scale_fill_manual()` overrides the default discrete hue cycle and triggers an automatic legend keyed off the same names. If a level is missing from `values`, ggplot2 will raise a clear error instead of silently recycling a colour.

</details>

### Exercise 3.2: Use scale_color_brewer with a sequential palette for an ordered factor

**Task:** Plot `price` versus `carat` from `diamonds`, coloured by `clarity`. Because `clarity` is an ordered factor running from worst (I1) to best (IF), pick `scale_colour_brewer(palette = "YlOrRd", direction = -1)` so the worst clarity reads as deep red and the best as pale yellow. Save the finished plot to `ex_3_2`.

**Expected result:**

```
#> Scatter of carat (x) vs price (y) on a busy plot.
#> Eight colours from deep red (I1) to pale yellow (IF) along the legend,
#> reflecting the ordered nature of clarity from worst to best.
```

**Difficulty:** Intermediate

[HINTS]
An ordered factor calls for a ramp that encodes magnitude, and the ramp can be flipped instead of hunting for a reversed palette name.
Use `scale_colour_brewer(palette = "YlOrRd", direction = -1)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(diamonds, aes(x = carat, y = price, colour = clarity)) +
  geom_point(alpha = 0.4, size = 0.6) +
  scale_colour_brewer(palette = "YlOrRd", direction = -1) +
  theme_minimal(base_size = 12)

ex_3_2
#> Carat vs price scatter, eight-step red-yellow legend.
```

**Explanation:** `direction = -1` flips a ColorBrewer ramp without you having to look up the reversed palette name. Sequential ramps like YlOrRd encode magnitude order, which matches an ordered factor like `clarity`; using `Set1` (a qualitative palette) would imply the categories are unordered and waste the hue information. `alpha = 0.4` is essential here because there are 53,940 points; without it the lower clarities completely overplot the higher ones.

</details>

### Exercise 3.3: Map a continuous variable to scale_fill_viridis_c with reversed direction

**Task:** Compute the count of diamonds per (cut, color) combination using `count(diamonds, cut, color)`, then draw a heatmap with `cut` on x, `color` on y, and the count `n` mapped to `fill`. Apply `scale_fill_viridis_c(option = "magma", direction = -1)` so the highest counts read as bright yellow and the lowest as deep purple. Save the plot to `ex_3_3`.

**Expected result:**

```
#> 5 x 7 tile grid (5 cuts on x, 7 colors D-J on y).
#> Tiles coloured on the magma ramp, brightest yellow tiles in the
#> Ideal column for mid-range colors (E, F, G), darkest purple in
#> Fair-color-J corner.
```

**Difficulty:** Intermediate

[HINTS]
A continuous fill needs the continuous variant of the palette function, and the bright end of the ramp can be flipped onto the high values.
Apply `scale_fill_viridis_c(option = "magma", direction = -1)` to a `geom_tile()`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
combo_counts <- count(diamonds, cut, color)
ex_3_3 <- ggplot(combo_counts, aes(x = cut, y = color, fill = n)) +
  geom_tile() +
  scale_fill_viridis_c(option = "magma", direction = -1) +
  theme_minimal(base_size = 12)

ex_3_3
#> Magma heatmap of cut by color counts.
```

**Explanation:** The `_c` suffix marks viridis as the continuous variant; `_d` would expect a discrete fill and error here. Magma works well on either light or dark backgrounds and is colour-blind safe like all viridis options. `direction = -1` makes the brightest end of the ramp encode the largest values, which inverts the default and matches the convention that "more = lighter" in heatmaps used in printed reports.

</details>

## Section 4. Continuous and discrete axes (3 problems)

### Exercise 4.1: Format y-axis tick labels as US dollars with thousand separators

**Task:** A finance team wants the `price` axis on a `diamonds` carat-vs-price scatter to read as currency. Plot `price` versus `carat` and apply `scale_y_continuous(labels = label_dollar())` from the scales package so a tick at 5000 prints as `$5,000`. Save the plot to `ex_4_1`.

**Expected result:**

```
#> Carat vs price scatter.
#> Y-axis tick labels read as $0, $5,000, $10,000, $15,000 (or similar).
#> No errors about missing labels, no warning about formatter.
```

**Difficulty:** Intermediate

[HINTS]
Axis tick text is reformatted by handing the scale a formatting function rather than editing label strings by hand.
Pass `labels = label_dollar()` to `scale_y_continuous()`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.3, size = 0.6) +
  scale_y_continuous(labels = label_dollar()) +
  theme_minimal(base_size = 12)

ex_4_1
#> Scatter with y-axis tick labels formatted as $X,XXX.
```

**Explanation:** `label_dollar()` is the modern replacement for the old `dollar_format()` and ships with sensible defaults: dollar prefix, comma thousands separator, no decimal places. Passing it as `labels = label_dollar()` (with parens) is intentional, the scale needs the formatting function, not its name. For other currencies, swap in `prefix = "EUR "` or `suffix = " kr"`; for percentages, the analogous helper is `label_percent()`.

</details>

### Exercise 4.2: Set custom breaks, limits, and a log10 transformation on the x-axis

**Task:** A pricing analyst wants to inspect the long tail of diamond prices on a log scale. Plot `price` (x) versus `carat` (y) from `diamonds`, applying `scale_x_log10(limits = c(300, 20000), breaks = c(500, 1000, 2500, 5000, 10000), labels = label_dollar())` so the x-axis reads as currency on a log10 grid with the listed break values. Save to `ex_4_2`.

**Expected result:**

```
#> Scatter with log-spaced x-axis showing $500, $1,000, $2,500, $5,000, $10,000.
#> Points span from carat ~0.2 (low) to ~5 (high) on the y-axis.
#> A few points outside the [300, 20000] price window are dropped (with
#> a warning about removed rows).
```

**Difficulty:** Advanced

[HINTS]
A transform, the visible break values, and the data window can all be configured inside the single scale that governs that axis.
Use `scale_x_log10()` with `limits`, `breaks`, and `labels = label_dollar()` arguments.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(diamonds, aes(x = price, y = carat)) +
  geom_point(alpha = 0.3, size = 0.6) +
  scale_x_log10(
    limits = c(300, 20000),
    breaks = c(500, 1000, 2500, 5000, 10000),
    labels = label_dollar()
  ) +
  theme_minimal(base_size = 12)

ex_4_2
#> Log10 carat-vs-price scatter, custom dollar breaks.
```

**Explanation:** Combining `breaks`, `labels`, and a transform inside one `scale_x_log10()` call is cleaner than chaining separate scale functions, which would conflict. `limits` here clips data, so a few extreme rows drop and ggplot warns; if you only want to zoom the view without dropping data, use `coord_cartesian(xlim = ...)` instead. `label_dollar()` operates on the original units, not the log-transformed ones, which is exactly what readers expect.

</details>

### Exercise 4.3: Reorder a discrete x-axis by the median y value

**Task:** Plot a boxplot of `mpg` per `class` from the `mpg` dataset, but reorder the x-axis so classes are sorted by ascending median highway mileage rather than alphabetically. Use `aes(x = reorder(class, hwy, FUN = median), y = hwy)`, then relabel the x-axis as `"Vehicle class (sorted by median highway mpg)"` via `labs()`. Save to `ex_4_3`.

**Expected result:**

```
#> Boxplot per vehicle class, x ordered left-to-right from lowest to
#> highest median hwy (e.g. pickup, suv, minivan, midsize, ..., compact, subcompact).
#> X-axis title reads "Vehicle class (sorted by median highway mpg)".
```

**Difficulty:** Advanced

[HINTS]
A discrete axis follows its factor's level order, so the sorting must happen on the variable mapped to x, driven by a summary of y.
Map x with `reorder(class, hwy, FUN = median)` and rename the axis with `labs()`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(mpg, aes(x = reorder(class, hwy, FUN = median), y = hwy)) +
  geom_boxplot(fill = "lightsteelblue") +
  labs(x = "Vehicle class (sorted by median highway mpg)", y = "Highway mpg") +
  theme_minimal(base_size = 12)

ex_4_3
#> Boxplots ordered by ascending median hwy.
```

**Explanation:** `reorder(x, y, FUN)` is the base R way to make a factor whose level order is driven by a summary of another variable; ggplot2 reads that order off the factor and uses it for the discrete axis. The forcats package offers `fct_reorder()` with the same semantics if you prefer the tidyverse spelling. Without `reorder()`, the x-axis sorts factor levels alphabetically, which is rarely what a reader wants for ordinal comparisons.

</details>

## Section 5. Legends, labels, and annotations (3 problems)

### Exercise 5.1: Override the colour legend title and remove the size legend

**Task:** Plot a `geom_point()` of `mpg` versus `wt` from `mtcars`, mapping `colour = factor(cyl)` and `size = hp`. Use `labs(colour = "Cylinders")` to rename the colour legend, and use `guides(size = "none")` to suppress the `hp` size legend so the chart only shows one legend entry. Save the final plot to `ex_5_1`.

**Expected result:**

```
#> Scatter with point sizes that vary by hp (visible) but only one legend
#> on the right titled "Cylinders" with three entries (4, 6, 8).
#> No "hp" or "size" legend block visible.
```

**Difficulty:** Intermediate

[HINTS]
Renaming a legend and hiding a different one are separate jobs - one touches a title, the other turns a guide off without unmapping the aesthetic.
Use `labs(colour = "Cylinders")` to rename and `guides(size = "none")` to suppress the size legend.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl), size = hp)) +
  geom_point(alpha = 0.8) +
  labs(colour = "Cylinders") +
  guides(size = "none") +
  theme_minimal(base_size = 12)

ex_5_1
#> Scatter with hp-sized points and only the cylinders colour legend.
```

**Explanation:** `labs()` is the convenience wrapper for axis and legend titles, and renaming the legend is just `labs(colour = "...")` matched to whichever aesthetic you mapped. `guides(size = "none")` is the canonical way to hide a single legend without disabling the underlying mapping; setting `theme(legend.position = "none")` would hide every legend on the plot. Use `guide_legend(override.aes = list(size = 4))` when you need to keep a legend but want consistent symbol sizes.

</details>

### Exercise 5.2: Add a styled title, subtitle, and caption with custom typography

**Task:** Build a `geom_point()` of `mpg` versus `wt` from `mtcars`. Use `labs()` to set a title, subtitle, and caption, then style them inside `theme()`: title bold and 16pt, subtitle italic and grey40, caption right-aligned and 9pt. Save the plot to `ex_5_2`.

**Expected result:**

```
#> Scatter with three text rows above and below the panel.
#> Title in bold 16pt, subtitle in italic grey, caption right-aligned in
#> small grey text below the panel. The plot itself is unchanged.
```

**Difficulty:** Advanced

[HINTS]
Title, subtitle, and caption are three independent text elements, so each one is styled on its own to build the typographic hierarchy.
Set the text with `labs()`, then style `plot.title`, `plot.subtitle`, and `plot.caption` using `element_text()` inside `theme()`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "steelblue") +
  labs(
    title    = "Fuel efficiency vs vehicle weight",
    subtitle = "1974 Motor Trend road tests, n = 32",
    caption  = "Source: built-in mtcars dataset"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title    = element_text(face = "bold", size = 16),
    plot.subtitle = element_text(face = "italic", colour = "grey40"),
    plot.caption  = element_text(hjust = 1, colour = "grey40", size = 9)
  )

ex_5_2
#> Scatter with styled title, subtitle, and right-aligned caption.
```

**Explanation:** `plot.title`, `plot.subtitle`, and `plot.caption` are independent elements; styling each separately gives the bold/italic/small typographic hierarchy expected in a published chart. The caption defaults to right alignment in newer ggplot2, but setting `hjust = 1` makes the intent explicit and survives a future default change. Use `theme(plot.title.position = "plot")` if you want titles to align with the full plot edge rather than the panel edge.

</details>

### Exercise 5.3: Annotate a single highlighted point with an arrow and label

**Task:** A code reviewer wants the most fuel-efficient car in `mtcars` flagged on a scatter of `mpg` versus `wt`. Identify the row with the maximum `mpg` (Toyota Corolla, mpg = 33.9, wt = 1.835), then build a scatter that adds an `annotate("text", ...)` label reading the car's name and an `annotate("segment", ...)` arrow pointing to the row. Save the plot to `ex_5_3`.

**Expected result:**

```
#> Scatter of wt (x) vs mpg (y).
#> A short arrow ends near the top-left point; the text "Toyota Corolla"
#> sits above-and-right of the arrow's start.
```

**Difficulty:** Advanced

[HINTS]
Marking one fixed observation calls for layers whose coordinates are constants, not values pulled from the plotted data frame.
Add `annotate("segment", ..., arrow = arrow(...))` for the arrow and `annotate("text", ..., label = ...)` for the label.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
top_car <- mtcars[which.max(mtcars$mpg), ]

ex_5_3 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "grey60") +
  annotate(
    "segment",
    x = 2.6, y = 32, xend = top_car$wt + 0.05, yend = top_car$mpg,
    arrow = arrow(length = unit(0.2, "cm")),
    colour = "firebrick"
  ) +
  annotate(
    "text",
    x = 2.7, y = 32.5, label = "Toyota Corolla",
    hjust = 0, colour = "firebrick", fontface = "bold"
  ) +
  theme_minimal(base_size = 12)

ex_5_3
#> Scatter with red arrow and label flagging Toyota Corolla.
```

**Explanation:** `annotate()` adds geoms whose values are constants, not pulled from a data frame, so they do not pollute the colour or fill scale. `arrow(length = unit(0.2, "cm"))` from the grid package controls arrowhead size, and unit() is loaded by ggplot2 itself. For label collision avoidance with many highlighted points, switch to `ggrepel::geom_text_repel()`, but `annotate()` is the cleanest tool when you want to flag exactly one observation.

</details>

## Section 6. Composing a reusable house style (3 problems)

### Exercise 6.1: Define a custom theme function and apply it to two different plots

**Task:** A reporting team wants every chart in their weekly digest to share the same look. Write a function `theme_digest()` that wraps `theme_minimal(base_size = 12)` and then layers a `theme()` block setting bold 14pt title, grey40 axis text, and `panel.grid.minor = element_blank()`. Apply it to a scatter of `mpg` versus `wt` from `mtcars` (save as `p_scatter`) and to a column chart of `count(diamonds, cut)` (save as `p_bar`). Save `list(scatter = p_scatter, bar = p_bar)` to `ex_6_1`.

**Expected result:**

```
#> ex_6_1$scatter and ex_6_1$bar render with identical typography:
#>   bold 14pt title, grey40 axis text, no minor grid.
#> Both inherit theme_minimal otherwise. Function reusable on any plot.
```

**Difficulty:** Advanced

[HINTS]
Bundling repeated styling into one reusable definition keeps the house look in a single place to update.
Write a function that returns `theme_minimal(base_size = 12) + theme(...)`, then add `theme_digest()` to both plots.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
theme_digest <- function(base_size = 12) {
  theme_minimal(base_size = base_size) +
    theme(
      plot.title       = element_text(face = "bold", size = 14),
      axis.text        = element_text(colour = "grey40"),
      panel.grid.minor = element_blank()
    )
}

p_scatter <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "steelblue") +
  labs(title = "Fuel efficiency by weight") +
  theme_digest()

p_bar <- ggplot(count(diamonds, cut), aes(x = cut, y = n)) +
  geom_col(fill = "steelblue") +
  labs(title = "Diamond cut distribution") +
  theme_digest()

ex_6_1 <- list(scatter = p_scatter, bar = p_bar)
ex_6_1
#> Two plots sharing the digest typography.
```

**Explanation:** Wrapping the boilerplate in a function gives a single place to update the house style; revising the title size touches one definition rather than every plot. `theme_minimal() + theme(...)` returns a single theme object, which is what `+` adds to the plot. The `base_size` parameter lets the same function produce slide-deck-sized variants without duplicating code, and you can extend the pattern with `scale_*` defaults via `scale_colour_discrete()` overrides.

</details>

### Exercise 6.2: Combine a custom theme with a custom default colour scale

**Task:** Extend Exercise 6.1 by writing a second helper, `digest_palette`, that returns a named character vector of three brand colours: navy `"#1f3b73"`, gold `"#d4a017"`, and crimson `"#a23b3b"`. Build a `geom_point()` of `mpg` versus `wt` from `mtcars` coloured by `factor(cyl)` and apply both `theme_digest()` and `scale_colour_manual(values = digest_palette)`. Save the finished plot to `ex_6_2`.

**Expected result:**

```
#> Scatter with three colours, navy / gold / crimson, mapped to cyl 4, 6, 8.
#> Same typography as ex_6_1 (bold title, grey40 axis text, no minor grid).
#> Legend titled "factor(cyl)" with three swatches in brand colours.
```

**Difficulty:** Advanced

[HINTS]
Typography and brand colour are separate concerns, so keep the theme helper and the palette as two distinct objects.
Define `digest_palette` as a vector named by cyl level, then add `scale_colour_manual(values = digest_palette)` alongside `theme_digest()`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
digest_palette <- c("4" = "#1f3b73", "6" = "#d4a017", "8" = "#a23b3b")

ex_6_2 <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "Fuel efficiency by weight, brand colours") +
  scale_colour_manual(values = digest_palette) +
  theme_digest()

ex_6_2
#> Scatter in brand navy/gold/crimson with digest typography.
```

**Explanation:** Naming the palette by factor level (`"4"`, `"6"`, `"8"`) locks the mapping so cylinder 4 always renders navy regardless of factor sort order. Splitting palette and theme into two separate helpers keeps each concern focused: typography lives in `theme_digest()`, colour lives in `digest_palette`. For full brand kits, expose a `scale_colour_digest()` convenience function that wraps `scale_colour_manual(values = digest_palette, ...)` so analysts never type the palette name directly.

</details>

### Exercise 6.3: Save a plot to disk at a specific size and resolution for print

**Task:** Take the `ex_6_2` plot from Exercise 6.2 and save it to disk as `digest_chart.png` at 6 inches wide, 4 inches tall, and 300 dpi using `ggsave()`. Capture the absolute file path returned by `normalizePath("digest_chart.png")` (after saving) and store it in `ex_6_3`. The check is whether the saved file exists at that path with non-zero size.

**Expected result:**

```
#> ex_6_3 contains an absolute path string ending in "digest_chart.png".
#> file.exists(ex_6_3) is TRUE.
#> file.info(ex_6_3)$size is greater than 1000 bytes (a real PNG, not empty).
```

**Difficulty:** Intermediate

[HINTS]
Reproducible output size comes from stating dimensions and resolution explicitly rather than relying on the current graphics device.
Call `ggsave()` with `width = 6`, `height = 4`, `units = "in"`, and `dpi = 300`, then capture the path with `normalizePath()`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ggsave(
  filename = "digest_chart.png",
  plot     = ex_6_2,
  width    = 6, height = 4, units = "in",
  dpi      = 300
)
ex_6_3 <- normalizePath("digest_chart.png")
ex_6_3
#> e.g. "/tmp/Rtmpxyz/digest_chart.png" (varies by environment)

file.exists(ex_6_3)
#> [1] TRUE
```

**Explanation:** `ggsave()` infers the output device from the file extension, so `.png` triggers PNG, `.pdf` triggers PDF, no extra arguments needed. Specifying `width`, `height`, and `units = "in"` together with `dpi = 300` produces a 1800x1200 raster suitable for print; the default device size is whatever your current graphics window happens to be, which is rarely reproducible. For vector output, switch to `.pdf` or `.svg` and drop the `dpi` argument since vectors are resolution-independent.

</details>

## What to do next

- Drill the foundational theme grammar in [ggplot2 Themes in R](ggplot2-Themes-in-R.html), the parent post for this hub.
- Practice the colour scales side of customization with [ggplot2 Color Scales Exercises in R](ggplot2-Color-Scales-Exercises-in-R.html).
- Build out the underlying chart skills first via [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html).
- Step into multi-panel layout work with [ggplot2 Facets Exercises in R](ggplot2-Facets-Exercises-in-R.html).
