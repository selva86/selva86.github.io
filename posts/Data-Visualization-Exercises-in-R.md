---
title: "Data Visualization Exercises in R: 25 Real-World Practice Problems"
slug: "Data-Visualization-Exercises-in-R"
description: "Practice data viz in R with 25 scenario-based problems: chart types, distributions, themes, facets, annotations, and publication-ready polish. Hidden solutions."
keywords: "data viz R exercises, data visualization exercises in R, ggplot2 practice problems, R visualization exercises, R chart exercises, ggplot2 exercises"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Data Viz Exercises"
sidebar_order: 118
fr_parent: "R-Tutorial.html"
auto_link_terms: "data viz R exercises|data visualization exercises|ggplot2 practice|R visualization exercises|R chart exercises"
auto_link_case_sensitive: false
target_keyword: "data viz R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Data Visualization Exercises in R: 25 Real-World Practice Problems

<p class="lead">Twenty-five scenario-based problems covering chart types, distributions, customization, facets, annotations, and publication-ready polish in R. Every exercise ships with an expected result so you can verify your answer, and solutions stay hidden until you reveal them so you actually try first.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(tidyr)
library(forcats)
library(scales)
library(tibble)
library(patchwork)
```

## Section 1. Chart-type foundations (4 problems)

### Exercise 1.1: Scatter plot of engine size against highway mileage

**Task:** Use the built-in `mpg` dataset (loaded with ggplot2) to build a scatter plot mapping `displ` on the x-axis and `hwy` on the y-axis with `geom_point()`. The plot should show all 234 observations with the default styling and no additional aesthetics. Save the result to `ex_1_1`.

**Expected result:**

```
#> A scatter plot with 234 black points.
#> x-axis 'displ' ranges roughly 1.5 to 7.0 (engine displacement in litres).
#> y-axis 'hwy' ranges 10 to 45 (highway mpg).
#> Strong negative trend: bigger engines deliver lower fuel economy.
```

**Difficulty:** Beginner

[HINTS]
Think of a plot as three pieces: the data, a mapping that says which column goes on which axis, and one layer that actually draws something.
Open the plot with `ggplot(mpg, aes(x = displ, y = hwy))` and add `geom_point()` for the visible layer.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()
ex_1_1
```

**Explanation:** `ggplot()` opens the plot with the data and the aesthetic mapping; `geom_point()` adds the visible layer. Without `color`, `size`, or `shape` the default is a small filled circle. Memorize this two-line pattern: every ggplot starts as a `data + mapping + geom` triple, and every later customization adds a layer on top of this base.

</details>

### Exercise 1.2: Color the scatter by drivetrain category

**Task:** Build on the previous scatter of `displ` against `hwy` from `mpg`, this time mapping `drv` to the `color` aesthetic inside `aes()` so each drivetrain (4, f, r) gets its own hue. ggplot2 should auto-generate the legend without any manual scale call. Save to `ex_1_2`.

**Expected result:**

```
#> Scatter with 234 points coloured by drivetrain.
#> Three colour groups: '4' (four-wheel), 'f' (front), 'r' (rear).
#> Legend on the right titled 'drv'.
#> Front-wheel cars (f) cluster at lower displacement and higher hwy mpg.
```

**Difficulty:** Intermediate

[HINTS]
The deciding question is whether the colour should respond to a data column or stay one fixed value for every point.
Add `color = drv` inside `aes()` so the hue is driven by the data, not inside `geom_point()`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point()
ex_1_2
```

**Explanation:** Mapping `color = drv` inside `aes()` ties hue to the data; ggplot2 auto-picks a discrete palette and a legend. Contrast with `geom_point(color = "blue")` outside `aes()`, which paints every point the same colour regardless of data. The "inside or outside `aes()`" rule is the single most common stumbling block for new ggplot2 users.

</details>

### Exercise 1.3: Line chart of US unemployment over time

**Task:** An ops engineer reviewing macro indicators wants a line chart of US unemployment from the `economics` dataset (loaded with ggplot2). Map `date` to x and `unemploy` to y with `geom_line()`. Add an informative y-axis label using `scale_y_continuous(labels = scales::comma)` so the thousands separator is shown. Save to `ex_1_3`.

**Expected result:**

```
#> A line chart spanning July 1967 to April 2015.
#> y-axis labelled with comma-separated thousands: e.g. 2,500, 5,000, 7,500, 10,000, 12,500, 15,000.
#> Major peaks visible during the early 1980s recession and the 2008 to 2010 downturn.
```

**Difficulty:** Intermediate

[HINTS]
A time series needs a layer that connects observations in date order, and large y-values read better with thousands separators.
Use `geom_line()` for the layer and `scale_y_continuous(labels = scales::comma)` for the formatted axis.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line() +
  scale_y_continuous(labels = scales::comma)
ex_1_3
```

**Explanation:** `geom_line()` connects observations in x-order, the right choice for a time series of monthly observations. The default y-axis prints values like `15000` which read awkwardly; `scales::comma` produces `15,000`. The `scales` package is the standard companion to ggplot2 for axis formatters: `comma`, `dollar`, `percent`, `label_log()` all live there.

</details>

### Exercise 1.4: Horizontal bar chart of diamonds by cut, sorted

**Task:** A jewellery retailer preparing an inventory dashboard wants a horizontal bar chart counting `diamonds$cut` rows, with bars sorted from longest to shortest. Use `geom_bar()`, then flip the chart with `coord_flip()` and reorder `cut` by its count using `forcats::fct_infreq()` so the longest bar sits at the top. Save to `ex_1_4`.

**Expected result:**

```
#> Horizontal bar chart with 5 bars.
#> Top to bottom: Ideal (~21,551), Premium (~13,791), Very Good (~12,082),
#>   Good (~4,906), Fair (~1,610).
#> x-axis is 'count', y-axis is 'cut'.
```

**Difficulty:** Intermediate

[HINTS]
Let the geom do the counting for you, reorder the category by how often each level appears, then turn the chart on its side.
Map `forcats::fct_infreq(cut)` to x, add `geom_bar()`, and finish with `coord_flip()`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ggplot(diamonds, aes(x = forcats::fct_infreq(cut))) +
  geom_bar() +
  coord_flip() +
  labs(x = "cut", y = "count")
ex_1_4
```

**Explanation:** `geom_bar()` does the counting for you when no y is mapped, so a single discrete x is enough. `fct_infreq()` reorders the factor by descending frequency so the bars sort themselves; `coord_flip()` then rotates the whole plot. An alternative is `geom_bar() + aes(y = forcats::fct_infreq(cut))` which avoids `coord_flip()` entirely in modern ggplot2.

</details>

## Section 2. Distributions and density (4 problems)

### Exercise 2.1: Histogram of highway mpg with fixed bin width

**Task:** Use `mpg$hwy` to draw a histogram with `geom_histogram()` and a fixed `binwidth = 2`. The plot should show the count of vehicles in each 2-mpg bin without any extra fills or facets. Save to `ex_2_1`.

**Expected result:**

```
#> Histogram of hwy with bin width 2 mpg.
#> x-axis 12 to 44, y-axis 0 to ~50.
#> Modal bin near 26 mpg; right tail extending to ~44 mpg with a few cars.
```

**Difficulty:** Beginner

[HINTS]
A count-per-interval chart needs you to decide how wide each interval should be rather than accept the default.
Map `hwy` to x and use `geom_histogram(binwidth = 2)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 2)
ex_2_1
```

**Explanation:** `geom_histogram()` chooses 30 bins by default, which is rarely the right number. Setting `binwidth` to a unit you can interpret (here, 2 mpg) makes the histogram readable. Use `binwidth` for continuous axes; for already-discrete data prefer `geom_bar()`. A common alternative is `bins = N` if you want a fixed bin count.

</details>

### Exercise 2.2: Density of ozone by month, faceted

**Task:** A climatologist preparing a seasonal report on the `airquality` dataset wants a density plot of `Ozone` faceted by `Month`. Convert `Month` to a factor first so each panel has a clean label, drop the `NA` Ozone rows with `tidyr::drop_na(Ozone)`, then use `geom_density(fill = "steelblue", alpha = 0.5)` and `facet_wrap(~ Month)`. Save to `ex_2_2`.

**Expected result:**

```
#> Five density panels, one per month (5 through 9).
#> Each panel shows the ozone distribution for that month.
#> July (7) and August (8) panels are visibly right-shifted versus May (5).
#> Fill is semi-transparent steelblue.
```

**Difficulty:** Intermediate

[HINTS]
Drop the missing values first, make the grouping variable categorical, then split the plot into one panel per group.
Chain `tidyr::drop_na(Ozone)`, `factor(Month)`, `geom_density(fill = "steelblue", alpha = 0.5)`, and `facet_wrap(~ Month)`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- airquality |>
  tidyr::drop_na(Ozone) |>
  mutate(Month = factor(Month)) |>
  ggplot(aes(x = Ozone)) +
  geom_density(fill = "steelblue", alpha = 0.5) +
  facet_wrap(~ Month)
ex_2_2
```

**Explanation:** `geom_density()` is a kernel-smoothed alternative to a histogram and works better when comparing multiple groups because the curves are continuous. `alpha = 0.5` makes overlapping fills readable when you switch to overlay (no facet) later. Faceting on a factor is essential here: leaving `Month` numeric would give a continuous gradient and break the panels.

</details>

### Exercise 2.3: Boxplot of mpg by cylinder count

**Task:** Use `mtcars` to draw a boxplot of `mpg` grouped by `cyl`, treating `cyl` as a factor so each cylinder count gets its own box. Map `fill` to the same factor so each box is coloured automatically by group. Use `geom_boxplot()`. Save the plot to `ex_2_3`.

**Expected result:**

```
#> Three boxes side by side for cyl 4, 6, 8.
#> Box for cyl 4 highest median (~26 mpg).
#> Box for cyl 8 lowest median (~15 mpg).
#> Each box filled with a distinct ggplot2 default colour.
```

**Difficulty:** Intermediate

[HINTS]
A discrete grouping stored as a number must be made categorical before it can split into separate boxes.
Wrap `cyl` in `factor()` for both the x mapping and the `fill` mapping, then add `geom_boxplot()`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(mtcars, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  geom_boxplot() +
  labs(x = "cyl", fill = "cyl")
ex_2_3
```

**Explanation:** Wrapping `cyl` in `factor()` is the canonical fix when a discrete categorical variable is stored as an integer; without it, ggplot2 treats `cyl` as continuous and draws one wide box that ignores the grouping. Mapping `fill` to the same factor is a one-line way to colour-code groups; if you mapped `fill = cyl` (continuous), you would get a colour gradient, not three distinct fills.

</details>

### Exercise 2.4: Violin plus boxplot overlay of vitamin C response

**Task:** A pharmacology team analysing the `ToothGrowth` dataset wants both a violin (showing the full distribution shape) and a narrow inner boxplot for `len` by `supp`. Use `geom_violin()` first and then `geom_boxplot(width = 0.1, fill = "white")` so the box overlays the violin. Save the plot to `ex_2_4`.

**Expected result:**

```
#> Two side-by-side violins for supp 'OJ' and 'VC'.
#> Each violin has a narrow white boxplot drawn inside.
#> OJ violin centred slightly higher (median ~22) than VC (median ~17).
#> Violins show bimodal shape for VC reflecting dose levels.
```

**Difficulty:** Intermediate

[HINTS]
Two layers tell the story together, and the order you add them decides which one sits on top.
Add `geom_violin()` first, then `geom_boxplot(width = 0.1, fill = "white")` so the narrow box overlays the violin.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ggplot(ToothGrowth, aes(x = supp, y = len)) +
  geom_violin() +
  geom_boxplot(width = 0.1, fill = "white")
ex_2_4
```

**Explanation:** The violin shows the full kernel density on each side of the centre line; the inner boxplot gives you the conventional five-number summary for context. Layer order matters here: violin first, then boxplot, so the box sits on top. Setting `width = 0.1` keeps the box thin so the violin shape stays visible behind it. Common alternative: replace the inner box with `stat_summary(fun = median, geom = "point")`.

</details>

## Section 3. Customization: labels, themes, scales (5 problems)

### Exercise 3.1: Add title, subtitle, and axis labels

**Task:** Take a scatter of `displ` against `hwy` from `mpg` and add a `labs()` call with `title = "Engine size vs highway mpg"`, `subtitle = "234 model-year vehicles, 1999 and 2008"`, `x = "Displacement (L)"`, and `y = "Highway miles per gallon"`. Save the plot to `ex_3_1`.

**Expected result:**

```
#> Scatter plot with descriptive title above and subtitle below.
#> x-axis label reads 'Displacement (L)'.
#> y-axis label reads 'Highway miles per gallon'.
#> Plot shows the same negative trend as exercise 1.1.
```

**Difficulty:** Beginner

[HINTS]
Every piece of plot text - the heading, the sub-heading, the axis names - is set through one single call.
Add `labs(title = ..., subtitle = ..., x = ..., y = ...)` to the scatter.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  labs(
    title    = "Engine size vs highway mpg",
    subtitle = "234 model-year vehicles, 1999 and 2008",
    x        = "Displacement (L)",
    y        = "Highway miles per gallon"
  )
ex_3_1
```

**Explanation:** `labs()` is the single entry point for every text label: title, subtitle, caption, tag, x, y, plus any legend titles by aesthetic name (`color =`, `fill =`). Use it instead of `ggtitle()`, `xlab()`, `ylab()` which still work but split your label setup across several calls. A complete `labs()` block makes the plot publication-ready in one line.

</details>

### Exercise 3.2: Format y-axis with dollar labels on diamond prices

**Task:** A finance reporting analyst preparing a slide on diamond inventory wants a scatter of `carat` against `price` from `diamonds` with the y-axis formatted as US dollars. Use `geom_point(alpha = 0.2)` to handle the overplot, then add `scale_y_continuous(labels = scales::dollar)`. Save to `ex_3_2`.

**Expected result:**

```
#> Scatter of 53,940 semi-transparent points (alpha 0.2 reveals density).
#> x-axis 'carat' 0 to 5.
#> y-axis tick labels formatted like '$5,000', '$10,000', '$15,000'.
#> Cone-shaped spread: prices fan upward at higher carat.
```

**Difficulty:** Intermediate

[HINTS]
Heavy overplotting calls for see-through points, and a money axis reads better with currency-formatted labels.
Use `geom_point(alpha = 0.2)` and `scale_y_continuous(labels = scales::dollar)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.2) +
  scale_y_continuous(labels = scales::dollar)
ex_3_2
```

**Explanation:** `alpha = 0.2` is the standard workaround when you have 50,000+ overlapping points: each individual point is barely visible but stacked points darken into the visible structure of the cloud. `scales::dollar` returns a formatter function that ggplot2 calls per tick; you can swap in `percent`, `comma`, or `unit_format` without changing the rest of the call.

</details>

### Exercise 3.3: Apply theme_minimal and rotate x labels 45 degrees

**Task:** Take a count bar chart of `diamonds$cut` (use `geom_bar()`) and clean it up with `theme_minimal()`. Then rotate the x-axis text 45 degrees and right-justify it using `theme(axis.text.x = element_text(angle = 45, hjust = 1))`. Save the plot to `ex_3_3`.

**Expected result:**

```
#> Five vertical bars: Fair, Good, Very Good, Premium, Ideal.
#> Background is white with light grey gridlines (theme_minimal).
#> x-axis labels rotated 45 degrees and end-aligned at each tick.
```

**Difficulty:** Intermediate

[HINTS]
Apply the overall look first, then make the fine-grained adjustment to the tick text - order matters here.
Add `theme_minimal()` and then `theme(axis.text.x = element_text(angle = 45, hjust = 1))`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar() +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_3_3
```

**Explanation:** `theme_minimal()` is one of about ten built-in themes; pick from `theme_bw()`, `theme_classic()`, `theme_void()` to match the look you want. Always apply the global theme BEFORE adding fine-grained `theme()` tweaks: if you call `theme()` first and `theme_minimal()` second, the minimal theme overwrites your tweaks. `hjust = 1` right-anchors the rotated text so the tail of the label points at the tick.

</details>

### Exercise 3.4: Continuous viridis color for clarity-graded scatter

**Task:** A jeweller exploring how clarity grade affects price-per-carat wants a scatter of `carat` against `price` from `diamonds` coloured by `depth` (a continuous variable). Map `color = depth` and apply the colour-blind-friendly continuous viridis palette via `scale_color_viridis_c()`. Save the plot to `ex_3_4`.

**Expected result:**

```
#> Scatter of 53,940 points coloured along the viridis (yellow to dark purple) gradient.
#> Legend on right titled 'depth' with a continuous colour bar.
#> Most points sit in the green-to-teal mid-range (depth around 61 to 62).
```

**Difficulty:** Intermediate

[HINTS]
A numeric colour variable needs a continuous palette, and there is a colour-blind-safe one built in.
Map `color = depth` and add `scale_color_viridis_c()`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ggplot(diamonds, aes(x = carat, y = price, color = depth)) +
  geom_point(alpha = 0.3) +
  scale_color_viridis_c()
ex_3_4
```

**Explanation:** Use `_c` for continuous data (gradient bar legend) and `_d` for discrete (one colour per category). Viridis is the default modern recommendation because it stays perceptually uniform under colour-blind simulation and prints well in grayscale. If your data is highly skewed, pair it with `trans = "log10"` to spread the colour resolution across the bulk of the range.

</details>

### Exercise 3.5: Custom manual palette with three named colors

**Task:** Use `mtcars` to draw a scatter of `wt` against `mpg` with `color = factor(cyl)`, then override the default ggplot2 palette with three hand-picked hex colours via `scale_color_manual(values = c("4" = "#1b9e77", "6" = "#d95f02", "8" = "#7570b3"))`. Save the plot to `ex_3_5`.

**Expected result:**

```
#> Scatter of 32 points coloured by cyl.
#> 4-cylinder cars in teal (#1b9e77).
#> 6-cylinder cars in burnt orange (#d95f02).
#> 8-cylinder cars in muted purple (#7570b3).
#> Legend on right titled 'factor(cyl)'.
```

**Difficulty:** Advanced

[HINTS]
You can replace the automatic colours with your own, keyed so each category always maps to the same hue.
Add `scale_color_manual(values = c("4" = "#1b9e77", "6" = "#d95f02", "8" = "#7570b3"))`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_manual(values = c("4" = "#1b9e77", "6" = "#d95f02", "8" = "#7570b3"))
ex_3_5
```

**Explanation:** Named-vector palettes give you full control and stay stable even if the data order changes. The three hex codes above come from the ColorBrewer "Dark2" qualitative palette, which is colour-blind friendly. If you don't care which level gets which colour, pass an unnamed vector: `c("#1b9e77", "#d95f02", "#7570b3")`. For larger sets, prefer `scale_color_brewer(palette = "Dark2")` so you don't enumerate by hand.

</details>

## Section 4. Multi-plot composition and facets (4 problems)

### Exercise 4.1: Facet a scatter by vehicle class

**Task:** Use `mpg` to build a scatter of `displ` against `hwy`, then split it into one panel per `class` using `facet_wrap(~ class)`. Allow ggplot2 to pick the panel layout (it defaults to roughly square). Save the plot to `ex_4_1`.

**Expected result:**

```
#> Seven panels, one per vehicle class:
#> 2seater, compact, midsize, minivan, pickup, subcompact, suv.
#> Each panel shows the displ vs hwy scatter for that class only.
#> Layout is 3 columns, 3 rows with one empty cell.
```

**Difficulty:** Beginner

[HINTS]
Split the plot into one small panel per category of a single variable, wrapped into a grid.
Add `facet_wrap(~ class)` to the scatter.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class)
ex_4_1
```

**Explanation:** `facet_wrap()` lays out one panel per level of the faceting variable and wraps them into rows. Control the grid with `nrow =` or `ncol =`; let scales vary with `scales = "free"`, `"free_x"`, or `"free_y"` when class-specific ranges drown out detail. Use `facet_grid()` instead when you have two faceting variables and want a true row-by-column matrix.

</details>

### Exercise 4.2: Facet grid by drivetrain and year

**Task:** Continuing on `mpg`, build a scatter of `displ` against `hwy` then split with `facet_grid(drv ~ year)` so rows correspond to drivetrain (4, f, r) and columns to year (1999, 2008). This puts every drv-year cell side by side for easy cross-comparison. Save to `ex_4_2`.

**Expected result:**

```
#> Six-cell grid: 3 rows (drv: 4, f, r) by 2 columns (year: 1999, 2008).
#> Each cell shows the displ vs hwy scatter for that drv-year combo.
#> Strip labels: row strips on the right show '4', 'f', 'r'; column strips on top show '1999', '2008'.
```

**Difficulty:** Intermediate

[HINTS]
Splitting on two variables at once means a true rows-by-columns matrix of panels, not a wrapped strip.
Add `facet_grid(drv ~ year)` so drivetrain forms the rows and year the columns.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(drv ~ year)
ex_4_2
```

**Explanation:** The formula `rows ~ cols` in `facet_grid()` is the easiest way to compare two factor variables jointly. Unlike `facet_wrap()`, the grid forces every row-column combination to appear even if it's empty, so visual gaps tell a story. Add `scales = "free_y"` when one row's range dwarfs another; otherwise the shared axis is helpful for cross-cell comparison.

</details>

### Exercise 4.3: Side-by-side composition with patchwork

**Task:** A reporting analyst building a one-page dashboard wants three plots laid out side by side: a `mpg$hwy` histogram, a `mpg$displ` vs `mpg$hwy` scatter, and a count bar chart of `mpg$class`. Build each plot individually as `p1`, `p2`, `p3`, then combine them on a single row using the patchwork `+` operator. Save the combined object to `ex_4_3`.

**Expected result:**

```
#> Three panels arranged in a single row.
#> Left panel: histogram of hwy with default bins.
#> Centre panel: scatter of displ vs hwy.
#> Right panel: vertical bar chart counting classes.
```

**Difficulty:** Advanced

[HINTS]
Build each chart as its own independent object first, then join the finished objects into a single row.
Make `p1`, `p2`, `p3` separately and combine them with `p1 + p2 + p3`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p1 <- ggplot(mpg, aes(hwy)) + geom_histogram(binwidth = 2)
p2 <- ggplot(mpg, aes(displ, hwy)) + geom_point()
p3 <- ggplot(mpg, aes(class)) + geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ex_4_3 <- p1 + p2 + p3
ex_4_3
```

**Explanation:** patchwork overloads `+` to put plots side by side, `/` to stack them vertically, and `|` for an explicit row. Wrap groups in parentheses: `(p1 + p2) / p3` puts two plots on top and one underneath. Use `plot_layout(ncol = 2)` to force a specific grid. patchwork respects each plot's own theme, scales, and legend, so build each piece independently and compose at the end.

</details>

### Exercise 4.4: Free-scale facets on long-running housing series

**Task:** A housing analyst exploring `txhousing` wants a small-multiples line chart of median price over time for the five cities Austin, Dallas, Houston, San Antonio, and Fort Worth. Build a `year + month/12` proxy for time, then facet by `city` with `scales = "free_y"` so each city uses its own y-range. Save to `ex_4_4`.

**Expected result:**

```
#> Five line panels, one per city.
#> x-axis 'time' spans roughly 2000 to 2015.
#> Each y-axis scales independently (free_y), so Houston's high prices don't flatten San Antonio.
#> Every line trends upward with a visible 2008 to 2010 dip.
```

**Difficulty:** Advanced

[HINTS]
When panels differ wildly in absolute level, each one should get its own y-range so the shape of the trend stays readable.
Filter to the five cities, build a `year + month / 12` time column, and facet with `facet_wrap(~ city, scales = "free_y")`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- txhousing |>
  filter(city %in% c("Austin", "Dallas", "Houston", "San Antonio", "Fort Worth")) |>
  mutate(time = year + month / 12) |>
  ggplot(aes(x = time, y = median)) +
  geom_line() +
  facet_wrap(~ city, scales = "free_y")
ex_4_4
```

**Explanation:** Free scales (`scales = "free_y"`) are the right answer whenever absolute levels differ wildly across panels but the shape of the trend is the question of interest. The trade-off is that a casual reader may misread the panels as similarly priced; always annotate the y-axis carefully in this case. For coordinated zoom across all panels, use `scales = "fixed"` (the default) and consider z-scoring or indexing each city to 100 at a baseline date.

</details>

## Section 5. Annotations and statistical layers (4 problems)

### Exercise 5.1: Add a linear smoother to a scatter plot

**Task:** Use `mpg` to draw a scatter of `displ` against `hwy`, then overlay a linear regression line with `geom_smooth(method = "lm", se = TRUE)` so the 95 percent confidence band is shown around the fit line. Save the plot to `ex_5_1`.

**Expected result:**

```
#> Scatter of 234 points (as in exercise 1.1).
#> A downward-sloping straight line overlaid (linear fit).
#> Grey ribbon around the line marking the 95% confidence interval.
#> Slope is clearly negative, roughly -3.5 mpg per litre of displacement.
```

**Difficulty:** Intermediate

[HINTS]
Add a second layer on top of the points that summarises the relationship with a fitted straight line and a confidence band.
Add `geom_smooth(method = "lm", se = TRUE)`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  geom_smooth(method = "lm", se = TRUE)
ex_5_1
```

**Explanation:** `geom_smooth(method = "lm")` fits an OLS line per group; without a `color` mapping, you get one global fit. Drop `method = "lm"` and `geom_smooth()` picks `loess` for small samples and `gam` for large ones; explicit is better than implicit. The grey ribbon is the confidence interval on the mean fit (turn off with `se = FALSE`), not the prediction interval for new points.

</details>

### Exercise 5.2: Bar chart with count labels above each bar

**Task:** A sales analyst building a quarterly slide wants a count bar chart of `mpg$class` with the exact count printed above each bar. Use `geom_bar()` and add `geom_text(stat = "count", aes(label = after_stat(count)), vjust = -0.5)` so the label is anchored just above the bar top. Save the plot to `ex_5_2`.

**Expected result:**

```
#> Seven vertical bars (one per class) with the exact integer count drawn just above each bar.
#> Example labels above bars: '5' (2seater), '47' (compact), '41' (midsize), '11' (minivan),
#>   '33' (pickup), '35' (subcompact), '62' (suv).
```

**Difficulty:** Intermediate

[HINTS]
The numbers you want printed are the bar heights, which are computed by the bar layer rather than present in the raw data.
Add `geom_text(stat = "count", aes(label = after_stat(count)), vjust = -0.5)`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mpg, aes(x = class)) +
  geom_bar() +
  geom_text(stat = "count", aes(label = after_stat(count)), vjust = -0.5)
ex_5_2
```

**Explanation:** `geom_text()` needs `stat = "count"` here because the y values (the bar heights) are computed by ggplot2 inside the bar layer, not present in the raw data. `after_stat(count)` exposes the computed stat to the label aesthetic; the older `..count..` syntax still works but is deprecated. `vjust = -0.5` lifts the text above the bar; positive `vjust` pushes it inside the bar.

</details>

### Exercise 5.3: Mean and standard-error bars with stat_summary

**Task:** A pharmacology analyst comparing OJ and VC supplements in `ToothGrowth` wants a clean summary chart: one point per `supp` at the group mean of `len`, with an error bar spanning plus and minus one standard error. Use `stat_summary(fun = mean, geom = "point", size = 3)` and `stat_summary(fun.data = mean_se, geom = "errorbar", width = 0.2)`. Save to `ex_5_3`.

**Expected result:**

```
#> Two points (one for 'OJ', one for 'VC') on the x-axis.
#> Each point has a vertical error bar of width 0.2 centred on the mean.
#> OJ mean roughly 20.7, error bar half-width about 1.3.
#> VC mean roughly 17.0, error bar half-width about 1.4.
```

**Difficulty:** Advanced

[HINTS]
You can put summary statistics directly on the plot without computing them in a separate step beforehand.
Use two `stat_summary()` calls - one with `fun = mean, geom = "point"` and one with `fun.data = mean_se, geom = "errorbar"`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(ToothGrowth, aes(x = supp, y = len)) +
  stat_summary(fun = mean, geom = "point", size = 3) +
  stat_summary(fun.data = mean_se, geom = "errorbar", width = 0.2)
ex_5_3
```

**Explanation:** `stat_summary()` lets you put summary statistics on a plot without pre-computing them. `fun =` returns a single y for a point or line; `fun.data =` returns a data frame with `y`, `ymin`, `ymax` for error bars. Built-in summary helpers include `mean_se`, `mean_cl_normal`, `mean_cl_boot`, and `median_hilow`. Pair with `geom_jitter(alpha = 0.3)` underneath to show the raw points behind the summary.

</details>

### Exercise 5.4: Reference lines and a focal annotation

**Task:** A trading-desk analyst reviewing the `economics` series wants the unemployment line annotated. Draw the line as before, add a horizontal reference line at `yintercept = 10000` (10 million unemployed) with `geom_hline(color = "red", linetype = "dashed")`, and label one focal peak in 2009 with `annotate("text", x = as.Date("2009-10-01"), y = 15500, label = "Great Recession peak")`. Save to `ex_5_4`.

**Expected result:**

```
#> Line chart of unemployment vs date.
#> A dashed red horizontal line crosses the chart at y = 10,000.
#> A single text annotation 'Great Recession peak' sits above the 2009 spike.
```

**Difficulty:** Advanced

[HINTS]
A fixed horizontal marker and a single piece of placed text both annotate the chart without depending on the data rows.
Add `geom_hline(yintercept = 10000, color = "red", linetype = "dashed")` and `annotate("text", x = ..., y = 15500, label = ...)`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line() +
  geom_hline(yintercept = 10000, color = "red", linetype = "dashed") +
  annotate("text",
           x = as.Date("2009-10-01"), y = 15500,
           label = "Great Recession peak") +
  scale_y_continuous(labels = scales::comma)
ex_5_4
```

**Explanation:** Prefer `annotate()` over `geom_text()` when you want exactly one label at a known position: `geom_text()` requires a data frame and emits one label per row, which is the right tool only for labelling many data points. `geom_hline()` and `geom_vline()` (and `geom_abline()`) are similar one-line annotators for reference lines that don't depend on the data.

</details>

## Section 6. Publication-ready polish (4 problems)

### Exercise 6.1: theme_classic with bold title and caption

**Task:** Take the `mpg` displ-vs-hwy scatter, apply `theme_classic()` for a Tufte-style spare look, then bold the title with `theme(plot.title = element_text(face = "bold", size = 14))`. Add a caption "Source: EPA fueleconomy.gov" via `labs(caption = ...)`. Save to `ex_6_1`.

**Expected result:**

```
#> Spare black-and-white look (theme_classic): only x and y axis lines, no panel grid.
#> Title rendered in bold, size 14.
#> Caption 'Source: EPA fueleconomy.gov' anchored at bottom right.
```

**Difficulty:** Intermediate

[HINTS]
Pick the spare overall look first, then make one text element bold and add a source line at the bottom.
Use `theme_classic()`, `theme(plot.title = element_text(face = "bold", size = 14))`, and `labs(caption = ...)`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  labs(
    title   = "Engine size vs highway mpg",
    caption = "Source: EPA fueleconomy.gov"
  ) +
  theme_classic() +
  theme(plot.title = element_text(face = "bold", size = 14))
ex_6_1
```

**Explanation:** `theme_classic()` strips the panel grid and box for a Tufte-style minimal look that prints well in PDFs and slides. Always layer your custom `theme()` AFTER the named theme function so it overrides rather than gets overridden. Captions live at the bottom right by default; move them with `theme(plot.caption = element_text(hjust = 0))` for left alignment.

</details>

### Exercise 6.2: Save a 1200x800 PNG at 300 dpi

**Task:** Build any plot of your choice from `mpg` then save it to disk as `mpg_report.png` at 1200 pixels wide, 800 pixels tall, 300 dpi resolution, using `ggsave()`. Pass the plot object explicitly via the `plot =` argument so the call does not depend on a previous `last_plot()`. Save the plot object you built to `ex_6_2`.

**Expected result:**

```
#> A PNG file 'mpg_report.png' written to the working directory.
#> Image dimensions 1200 pixels by 800 pixels at 300 dpi.
#> ggsave prints a confirmation: 'Saving 4 x 2.67 in image' (approx, depends on width/height units).
```

**Difficulty:** Advanced

[HINTS]
Writing a plot to an image file is a single call where you state the file name, the dimensions, and the resolution.
Call `ggsave(filename = "mpg_report.png", plot = ex_6_2, width = 1200, height = 800, units = "px", dpi = 300)`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  labs(title = "MPG report")

ggsave(
  filename = "mpg_report.png",
  plot     = ex_6_2,
  width    = 1200,
  height   = 800,
  units    = "px",
  dpi      = 300
)
ex_6_2
```

**Explanation:** `units = "px"` was added in ggplot2 3.3 and is the cleanest way to specify pixel-exact output for web or slide deck use; the older `units = "in"` (inches) is still common in print workflows. `ggsave()` infers the file format from the extension; PNG, PDF, SVG, JPEG, and TIFF are all supported. For vector output that scales cleanly in slides, prefer `.svg` or `.pdf` over `.png`.

</details>

### Exercise 6.3: Combined log-y, dollar labels, and custom palette

**Task:** A jewellery analytics team wants a publication-ready scatter of `carat` against `price` from `diamonds`, coloured by `cut`. Use a log10 y-axis with `scale_y_log10(labels = scales::dollar)`, set the colour palette via `scale_color_brewer(palette = "Set2")`, and apply `theme_minimal()`. Save the plot to `ex_6_3`.

**Expected result:**

```
#> Scatter of 53,940 points coloured by cut (five categories).
#> y-axis on a log10 scale with dollar-formatted tick labels: '$500', '$1,000', '$2,000', '$5,000', '$10,000'.
#> Colour-blind safe Set2 palette (soft greens, oranges, pinks, blues).
#> Background white with light grey gridlines.
```

**Difficulty:** Advanced

[HINTS]
Three independent adjustments stack on the same plot - a compressed y-axis, money-formatted labels, and a chosen palette.
Add `scale_y_log10(labels = scales::dollar)`, `scale_color_brewer(palette = "Set2")`, and `theme_minimal()`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ggplot(diamonds, aes(x = carat, y = price, color = cut)) +
  geom_point(alpha = 0.3) +
  scale_y_log10(labels = scales::dollar) +
  scale_color_brewer(palette = "Set2") +
  theme_minimal()
ex_6_3
```

**Explanation:** Combining `scale_y_log10()` with a dollar formatter is the standard pattern for any right-skewed monetary scale: the log axis unstacks the bulk of the data while the formatter keeps tick labels human-readable. `scale_color_brewer()` picks from the ColorBrewer palettes; `"Set2"` is qualitative and colour-blind safe. For sequential or diverging palettes (ordered factors, residuals), see `"Blues"`, `"YlGnBu"`, or `"RdBu"`.

</details>

### Exercise 6.4: Flipped bar with value labels for a top-N report

**Task:** An HR analyst preparing a headcount report wants a horizontal bar chart of `mpg` class counts where each bar is labelled with its exact count at the bar tip. Use `aes(y = forcats::fct_infreq(class))` for the y-axis, `geom_bar()`, `geom_text(stat = "count", aes(label = after_stat(count)), hjust = -0.2)`, and stretch the x-axis with `scale_x_continuous(expand = expansion(mult = c(0, 0.1)))` so the labels are not clipped. Save to `ex_6_4`.

**Expected result:**

```
#> Horizontal bars, longest at top: suv, compact, midsize, subcompact, pickup, minivan, 2seater.
#> Each bar has its count printed just past the bar tip (e.g. '62' next to the suv bar).
#> x-axis padded on the right so labels are not cut off.
```

**Difficulty:** Intermediate

[HINTS]
Map the category to the vertical axis, sort it by frequency, label each bar tip, and pad the value axis so labels are not clipped.
Use `aes(y = forcats::fct_infreq(class))`, `geom_text(stat = "count", aes(label = after_stat(count)), hjust = -0.2)`, and `scale_x_continuous(expand = expansion(mult = c(0, 0.1)))`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- ggplot(mpg, aes(y = forcats::fct_infreq(class))) +
  geom_bar() +
  geom_text(stat = "count",
            aes(label = after_stat(count)),
            hjust = -0.2) +
  scale_x_continuous(expand = expansion(mult = c(0, 0.1))) +
  labs(y = "class", x = "count")
ex_6_4
```

**Explanation:** Mapping the discrete variable to `y` instead of `x` skips the older `coord_flip()` workaround and keeps the data flow clean. `expansion(mult = c(0, 0.1))` adds zero padding on the left (so bars start at exactly zero) and 10 percent on the right (so the labels fit); the older `expand_scale()` is the same thing renamed. `hjust = -0.2` positions the label just past the bar tip.

</details>

## What to do next

You are ready for deeper, geom-specific drills. Three good next stops:

- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) for thirty more problems centred specifically on the grammar of graphics.
- [ggplot2 Themes Exercises in R](ggplot2-Themes-Exercises-in-R.html) for full theme customization and brand-styling work.
- [ggplot2 Facets Exercises in R](ggplot2-Facets-Exercises-in-R.html) for the small-multiples patterns that power any dashboard.
- [EDA Exercises in R](EDA-Exercises-in-R.html) to put these chart-types to work on raw data discovery.
