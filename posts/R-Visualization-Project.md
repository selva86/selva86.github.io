---
title: "R Visualization Project: 50 Real-World Chart Reproduction Exercises"
slug: "R-Visualization-Project"
description: "Reproduce 50 publication-grade chart styles in R with ggplot2: Economist, FiveThirtyEight, BBC, scientific journals, Bloomberg, NYT. Solutions hidden."
keywords: "R visualization project, reproduce charts in R, ggplot2 Economist style, FiveThirtyEight ggplot2, BBC chart R, publication-quality figures R, Bloomberg ggplot2, NYT chart R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Visualization Project"
sidebar_order: 26
fr_parent: "Publication-Quality-Figures-in-R.html"
auto_link_terms: "R visualization project|reproduce charts in R|chart reproduction in R|publication-quality charts R|recreate professional charts"
auto_link_case_sensitive: false
target_keyword: "R visualization project"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Visualization Project: 50 Real-World Chart Reproduction Exercises

<p class="lead">Fifty chart reproduction problems grouped by publication style: Economist, FiveThirtyEight, BBC News, scientific journals, Financial Times and Bloomberg, and the New York Times. Every exercise ships with a hidden full solution so you can struggle first, then verify. Built on ggplot2 with only built-in R datasets and a few small inline tibbles where domain data is needed.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(scales)
library(tidyr)
library(tibble)
```

## Section 1. Economist-style charts (8 problems)

### Exercise 1.1: Reproduce the Economist's signature engine-vs-MPG scatter

**Task:** The Economist's graphics desk needs a scatter plot of engine displacement versus highway MPG from the `mpg` dataset, colored by vehicle class, with the magazine's blue-gray (`#d5e4eb`) background, white horizontal gridlines, no vertical gridlines, and a thin x-axis line. Save the resulting ggplot to `ex_1_1`.

**Expected result:**

```
A class-colored scatter (mpg displ vs hwy) on a #d5e4eb panel
with white horizontal gridlines, no minor grid, a thin dark
x-axis line, and a bold left-aligned sans-serif title.
```

**Difficulty:** Intermediate

[HINTS]
The Economist look comes entirely from theme overrides; the data layer is just an ordinary class-colored scatter, so think about which surfaces and which gridlines you need to recolor or blank.
Map color = class in aes() with geom_point(), then in theme() set plot.background and panel.background to #d5e4eb, keep panel.grid.major.y white, blank panel.grid.major.x, and add a thin axis.line.x.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(size = 2.5, alpha = 0.85) +
  labs(title = "Engine size vs. highway fuel economy",
       subtitle = "EPA fuel-economy figures, 2008 model year",
       x = "Displacement (litres)", y = "Highway MPG",
       caption = "Source: ggplot2::mpg") +
  theme(plot.background  = element_rect(fill = "#d5e4eb", color = NA),
        panel.background = element_rect(fill = "#d5e4eb", color = NA),
        panel.grid.major.y = element_line(color = "white", linewidth = 0.5),
        panel.grid.major.x = element_blank(),
        panel.grid.minor   = element_blank(),
        axis.line.x = element_line(color = "#333", linewidth = 0.4),
        axis.ticks.y = element_blank(),
        plot.title    = element_text(face = "bold", hjust = 0),
        plot.subtitle = element_text(color = "#555", hjust = 0),
        legend.background = element_rect(fill = "#d5e4eb", color = NA),
        legend.key        = element_rect(fill = "#d5e4eb", color = NA),
        legend.title = element_blank())
ex_1_1
#> A scatter plot in Economist house style.
```

**Explanation:** Setting `plot.background` and `panel.background` to the same `#d5e4eb` makes the chart blend into its margins, the defining Economist look. White horizontal gridlines float over the panel because vertical grid is blanked. The thin `axis.line.x` plus blanked y ticks mimic the asymmetric axis treatment that pulls the eye to data, not chart frame.

</details>

### Exercise 1.2: Build an Economist-style horizontal bar of diamond counts by cut

**Task:** The Economist commissions a sale-floor inventory chart showing diamond counts by cut quality. Build a horizontal bar chart of `diamonds` grouped by `cut`, sorted from largest to smallest, using the Economist accent blue (`#01a2d9`) for all bars and the magazine's blue-gray panel background. Save the ggplot to `ex_1_2`.

**Expected result:**

```
A horizontal bar chart with 5 bars (Fair, Good, Very Good,
Premium, Ideal) sorted by descending count, all colored
#01a2d9, on a #d5e4eb panel with white gridlines.
```

**Difficulty:** Intermediate

[HINTS]
You need a count per cut before plotting, and the y-axis factor has to be ordered by that count so the longest bar lands on top.
Pipe diamonds through count(cut), map y = reorder(cut, n), draw geom_col(fill = "#01a2d9"), and recolor the panel via theme().

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- diamonds |>
  count(cut) |>
  ggplot(aes(x = n, y = reorder(cut, n))) +
  geom_col(fill = "#01a2d9") +
  scale_x_continuous(labels = comma) +
  labs(title = "Diamonds on the sale floor, by cut",
       x = NULL, y = NULL, caption = "Source: ggplot2::diamonds") +
  theme(plot.background  = element_rect(fill = "#d5e4eb", color = NA),
        panel.background = element_rect(fill = "#d5e4eb", color = NA),
        panel.grid.major.x = element_line(color = "white"),
        panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold", hjust = 0))
ex_1_2
#> Horizontal bar chart, Economist accent-blue bars on blue-gray panel.
```

**Explanation:** `reorder(cut, n)` sorts the y-axis factor by count so the longest bar sits on top, which reads more naturally than alphabetical order. Using a single accent color rather than per-bar coloring avoids the "rainbow bar chart" pitfall: when categories are not ordered by hue meaning, color adds noise, not signal.

</details>

### Exercise 1.3: Apply the Economist multi-line palette to a three-series economics chart

**Task:** Using `economics_long` from ggplot2, filter to `unemploy`, `psavert`, and `pop`, normalize each variable to a 0-1 range within its own series, then plot all three as colored lines using the Economist palette (`#01a2d9`, `#76c0c1`, `#c23b22`). Save the ggplot to `ex_1_3`.

**Expected result:**

```
A three-line time series on a #d5e4eb panel:
  pop      line in #01a2d9 (rising)
  psavert  line in #76c0c1 (volatile)
  unemploy line in #c23b22 (rising late)
All normalized to [0,1] within their own series for shape comparison.
```

**Difficulty:** Intermediate

[HINTS]
Series with different units cannot share a y-axis until each is rescaled against its own minimum and maximum, which means grouping before you rescale.
After filter(variable %in% ...), group_by(variable) then mutate() a min-max rescale, plot geom_line() with color = variable, and assign hex codes with scale_color_manual().

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- economics_long |>
  filter(variable %in% c("unemploy", "psavert", "pop")) |>
  group_by(variable) |>
  mutate(value_n = (value - min(value)) / (max(value) - min(value))) |>
  ungroup() |>
  ggplot(aes(x = date, y = value_n, color = variable)) +
  geom_line(linewidth = 0.8) +
  scale_color_manual(values = c(pop = "#01a2d9", psavert = "#76c0c1", unemploy = "#c23b22")) +
  labs(title = "Three US macro series, normalized",
       x = NULL, y = "Normalized [0, 1]") +
  theme(plot.background  = element_rect(fill = "#d5e4eb", color = NA),
        panel.background = element_rect(fill = "#d5e4eb", color = NA),
        panel.grid.major = element_line(color = "white"),
        panel.grid.minor = element_blank(),
        legend.background = element_rect(fill = "#d5e4eb", color = NA),
        legend.key = element_rect(fill = "#d5e4eb", color = NA),
        legend.title = element_blank())
ex_1_3
#> Three colored lines, Economist palette, normalized [0,1].
```

**Explanation:** Series with very different units (people, percent, count) cannot share a y-axis until normalized. The min-max rescale lets you compare *shape* rather than level, which is what the Economist usually wants: did unemployment peak before or after savings? `group_by(variable)` ensures each series is rescaled against its own range.

</details>

### Exercise 1.4: Add the iconic Economist red title-bar marker

**Task:** Take the chart from Exercise 1.1 and prepend the title with a small red rectangle the height of the title text, using `ggtext::element_markdown` is not allowed here, so instead use `annotation_custom()` with a `grid::rectGrob()` or a leading bold red Unicode block to mimic the signature red title flag. Save the ggplot to `ex_1_4`.

**Expected result:**

```
The Exercise 1.1 scatter, now with a leading bold red square block
character before the title text, evoking the Economist's red bar.
```

**Difficulty:** Beginner

[HINTS]
With base ggplot2 you cannot recolor part of a title, so the cheap trick is to put a colored block character at the front of the title string itself.
Build on ex_1_1, paste a solid square glyph in front of the title text inside labs(title = ...), and keep plot.title bold and left-aligned.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
red_flag <- "■"  # solid square; appears in default text color
ex_1_4 <- ex_1_1 +
  labs(title = paste0(red_flag, "  Engine size vs. highway fuel economy")) +
  theme(plot.title = element_text(face = "bold", color = "#222", hjust = 0))
ex_1_4
#> Same scatter, title now leads with a solid square flag character.
```

**Explanation:** The Economist's red title bar is a brand cue: a tiny color block in the top-left tells readers "this is our reporting". With base ggplot2 you can fake it cheaply by prepending a Unicode block to the title string. For production work, swap in a markdown-aware title element so the square can be recolored independently of the rest of the title text.

</details>

### Exercise 1.5: Customize the legend on an Economist-style chart

**Task:** Take `ex_1_1` and move its legend below the plot in a single row, remove the legend title, set the legend background to match the panel, and use larger key boxes so colors are readable in print. Save the modified ggplot to `ex_1_5`.

**Expected result:**

```
The Exercise 1.1 scatter, legend now sits below the panel in
one horizontal row with 7 class labels, larger color squares,
and a #d5e4eb background that blends with the panel.
```

**Difficulty:** Intermediate

[HINTS]
A legend below the panel widens the data area, and you can enlarge the swatches without touching the actual points.
Add ex_1_1 plus guides(color = guide_legend(nrow = 1, override.aes = list(size = 4))), and set legend.position = "bottom" with legend.key.size in theme().

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- ex_1_1 +
  guides(color = guide_legend(nrow = 1, override.aes = list(size = 4))) +
  theme(legend.position   = "bottom",
        legend.direction  = "horizontal",
        legend.title      = element_blank(),
        legend.background = element_rect(fill = "#d5e4eb", color = NA),
        legend.key        = element_rect(fill = "#d5e4eb", color = NA),
        legend.key.size   = unit(0.9, "lines"))
ex_1_5
#> Same scatter; legend now sits below the panel in one row.
```

**Explanation:** Moving the legend below the panel widens the data area, useful when you have wide categorical legends. `override.aes = list(size = 4)` enlarges the legend glyphs without changing the points themselves, so the legend stays readable even when the points are small. Matching the legend background to the panel removes a visual seam.

</details>

### Exercise 1.6: Build an Economist-style stacked bar of Titanic survival by class

**Task:** Convert the `Titanic` array to a tibble, group survival counts by passenger class, then build a stacked bar chart showing survived versus perished within each class using the Economist palette (`#76c0c1` survived, `#c23b22` perished). Save the ggplot to `ex_1_6`.

**Expected result:**

```
4 stacked bars (1st, 2nd, 3rd, Crew). Each bar split into
green-teal survived (#76c0c1) and red perished (#c23b22)
on a #d5e4eb panel. Survival rate clearly higher in 1st class.
```

**Difficulty:** Intermediate

[HINTS]
The Titanic data is an array of frequencies, so convert it to a data frame and aggregate counts before any plotting happens.
Run as.data.frame(Titanic), group_by(Class, Survived) and summarise(sum(Freq)), then geom_col() with fill = Survived and scale_fill_manual().

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- as.data.frame(Titanic) |>
  group_by(Class, Survived) |>
  summarise(n = sum(Freq), .groups = "drop") |>
  ggplot(aes(x = Class, y = n, fill = Survived)) +
  geom_col() +
  scale_fill_manual(values = c(No = "#c23b22", Yes = "#76c0c1")) +
  labs(title = "Titanic survival by class",
       x = NULL, y = "Passengers", fill = NULL) +
  theme(plot.background  = element_rect(fill = "#d5e4eb", color = NA),
        panel.background = element_rect(fill = "#d5e4eb", color = NA),
        panel.grid.major.y = element_line(color = "white"),
        panel.grid.major.x = element_blank(),
        panel.grid.minor = element_blank(),
        legend.background = element_rect(fill = "#d5e4eb", color = NA),
        legend.key = element_rect(fill = "#d5e4eb", color = NA),
        plot.title = element_text(face = "bold"))
ex_1_6
#> Stacked Economist-palette bars by class.
```

**Explanation:** `geom_col()` plots y as-is rather than counting like `geom_bar()`, which fits when you have already summarised counts. Stacking by `Survived` directly compares within-class proportions. A diverging-style red-and-teal pair (rather than rainbow) communicates the survived-versus-perished contrast immediately to a reader skimming the page.

</details>

### Exercise 1.7: Reproduce the Economist's GDP scatter with country annotations

**Task:** Build an inline tibble of 8 countries with `gdp_per_capita` (USD) and `life_expectancy` (years), then plot a scatter where each point is labeled with its country name to the right of the dot, using the Economist palette and a single accent color. Save the ggplot to `ex_1_7`.

**Expected result:**

```
8 labeled points showing gdp_per_capita vs life_expectancy.
Country names sit to the right of each point in dark gray.
All points colored #01a2d9 on a #d5e4eb panel with white
horizontal gridlines and bold left-aligned title.
```

**Difficulty:** Advanced

[HINTS]
Direct labels remove the legend lookup, but you must leave room on the right so the rightmost label is not clipped.
Plot geom_point(), add geom_text(aes(label = country), hjust = -0.15), and extend the x-range with expand_limits().

```r title="Your turn"
gdp_life <- tibble::tibble(
  country = c("USA", "UK", "Germany", "Japan", "India", "Brazil", "Nigeria", "Norway"),
  gdp_per_capita = c(70000, 47000, 52000, 40000, 2400, 8900, 2100, 92000),
  life_expectancy = c(78.5, 81.3, 81.0, 84.6, 70.2, 76.8, 54.7, 83.2)
)
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
gdp_life <- tibble::tibble(
  country = c("USA", "UK", "Germany", "Japan", "India", "Brazil", "Nigeria", "Norway"),
  gdp_per_capita = c(70000, 47000, 52000, 40000, 2400, 8900, 2100, 92000),
  life_expectancy = c(78.5, 81.3, 81.0, 84.6, 70.2, 76.8, 54.7, 83.2)
)
ex_1_7 <- ggplot(gdp_life, aes(x = gdp_per_capita, y = life_expectancy)) +
  geom_point(color = "#01a2d9", size = 3.5) +
  geom_text(aes(label = country), hjust = -0.15, color = "#333", size = 3.3) +
  scale_x_continuous(labels = dollar) +
  expand_limits(x = max(gdp_life$gdp_per_capita) * 1.15) +
  labs(title = "GDP per capita vs. life expectancy",
       subtitle = "Eight illustrative economies",
       x = "GDP per capita (USD)", y = "Life expectancy (years)") +
  theme(plot.background  = element_rect(fill = "#d5e4eb", color = NA),
        panel.background = element_rect(fill = "#d5e4eb", color = NA),
        panel.grid.major.y = element_line(color = "white"),
        panel.grid.major.x = element_blank(),
        panel.grid.minor = element_blank(),
        axis.line.x = element_line(color = "#333"),
        plot.title = element_text(face = "bold", hjust = 0),
        plot.subtitle = element_text(color = "#555", hjust = 0))
ex_1_7
#> Scatter of 8 labeled countries, Economist styling.
```

**Explanation:** Direct labels remove the legend lookup tax: a reader maps point to country in one glance instead of two. `hjust = -0.15` pushes the label slightly right of each dot, and `expand_limits()` adds room on the right so the rightmost country (Norway) does not get clipped. For overlapping labels, swap `geom_text` for `ggrepel::geom_text_repel`.

</details>

### Exercise 1.8: Save an Economist chart at print specifications

**Task:** Take `ex_1_1` and save it to disk as a 1200-pixel-wide PNG at 300 DPI using `ggsave()`, writing to a temp path. Confirm the file size and dimensions match a print-ready spec. Save the file path returned by `ggsave()` (after wrapping in a list) to `ex_1_8`.

**Expected result:**

```
$path
[1] "/tmp/economist-scatter.png"  # path varies by session
$width_in
[1] 4
$dpi
[1] 300
```

**Difficulty:** Beginner

[HINTS]
Print specs are inches at a target DPI; 1200 pixels wide is simply 4 inches at 300 DPI.
Use tempfile() for the path, call ggsave() with width = 4, dpi = 300, units = "in", then wrap path, width, and dpi in a list().

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
out_path <- tempfile(pattern = "economist-scatter", fileext = ".png")
ggsave(out_path, ex_1_1, width = 4, height = 3, dpi = 300, units = "in")
ex_1_8 <- list(path = out_path, width_in = 4, dpi = 300)
ex_1_8
#> $path
#> [1] "/tmp/economist-scatter<...>.png"
#> $width_in
#> [1] 4
#> $dpi
#> [1] 300
```

**Explanation:** Print specs are measured in inches at a target DPI: 4 inches wide at 300 DPI is 1200 pixels. `ggsave()` infers format from the file extension. For two-column journal layouts, target 6.5-7 inches wide; for full-page newspaper figures, 9-10 inches. Save raster (PNG) for web and vector (PDF, SVG) for print typesetting.

</details>

## Section 2. FiveThirtyEight-style charts (8 problems)

### Exercise 2.1: Apply a FiveThirtyEight-style theme to an unemployment line chart

**Task:** Plot `economics$unemploy` versus `economics$date` as a single line, then style it like FiveThirtyEight: light gray panel (`#f0f0f0`), white plot background, bold sans-serif title, no axis titles, and removed minor gridlines. Save the ggplot to `ex_2_1`.

**Expected result:**

```
A single dark line of US unemployment from 1967 to 2015 on a
#f0f0f0 panel with white surrounding background, bold title
"US unemployment", no axis labels.
```

**Difficulty:** Intermediate

[HINTS]
FiveThirtyEight layers a warm gray panel inside a white plot area, the reverse of the Economist, so think about which background is which.
Draw geom_line(), then in theme() set panel.background to #f0f0f0, plot.background to white, white panel.grid.major, and blank panel.grid.minor.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line(color = "#222222", linewidth = 0.8) +
  scale_y_continuous(labels = comma) +
  labs(title = "US unemployment", subtitle = "Thousands of persons, 1967-2015",
       x = NULL, y = NULL) +
  theme(plot.background  = element_rect(fill = "white", color = NA),
        panel.background = element_rect(fill = "#f0f0f0", color = NA),
        panel.grid.major = element_line(color = "white"),
        panel.grid.minor = element_blank(),
        plot.title    = element_text(face = "bold", size = 14, hjust = 0),
        plot.subtitle = element_text(color = "#555", hjust = 0))
ex_2_1
#> FiveThirtyEight-style unemployment line.
```

**Explanation:** FiveThirtyEight's signature is the warm gray panel (`#f0f0f0`) inside a white plot area, the opposite layering from the Economist. White gridlines on gray contribute to the "clean newspaper" feel: visible enough to read values, invisible enough not to compete with the data line. The bold sans-serif title with a smaller gray subtitle is the canonical header pattern.

</details>

### Exercise 2.2: Match the FiveThirtyEight signature gray background color exactly

**Task:** Take a default `ggplot(mtcars, aes(wt, mpg)) + geom_point()` and apply only the panel background recolor to `#f0f0f0` without touching any other theme element. Save the styled ggplot to `ex_2_2`.

**Expected result:**

```
A default-looking ggplot2 scatter of mtcars wt vs mpg with
black points, but the panel background is now #f0f0f0 instead
of the default gray-90. Everything else (gridlines, axes) unchanged.
```

**Difficulty:** Beginner

[HINTS]
Change exactly one surface and nothing else, so you need the element that sits directly behind the data points.
Add a single theme(panel.background = element_rect(fill = "#f0f0f0", color = NA)) to the default geom_point() plot.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  theme(panel.background = element_rect(fill = "#f0f0f0", color = NA))
ex_2_2
#> Default scatter with #f0f0f0 panel.
```

**Explanation:** The minimal-change recolor proves you understand which theme element controls which surface: `panel.background` is the rectangle behind the data, distinct from `plot.background` (the rectangle behind everything including margins). Setting `color = NA` removes the panel border that ggplot2 draws by default.

</details>

### Exercise 2.3: Build a 538-style horizontal bar of cars by MPG

**Task:** Take `mtcars`, move row names into a `car` column, sort by `mpg` descending, then build a horizontal bar chart with one accent color (`#fc4f30`, the FiveThirtyEight red), 538-style gray panel, no axis title, and the car name on the y-axis. Save to `ex_2_3`.

**Expected result:**

```
32 horizontal bars, one per car, sorted from highest MPG
(Toyota Corolla) at top to lowest (Cadillac Fleetwood) at
bottom, all #fc4f30, on a #f0f0f0 panel with white gridlines.
```

**Difficulty:** Intermediate

[HINTS]
Car names live in the row names, not a column, so they must be lifted into a real column before they can be an aesthetic.
Use tibble::rownames_to_column("car"), map y = reorder(car, mpg), draw geom_col(fill = "#fc4f30"), and show only x-gridlines.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mtcars |>
  tibble::rownames_to_column("car") |>
  ggplot(aes(x = mpg, y = reorder(car, mpg))) +
  geom_col(fill = "#fc4f30") +
  labs(title = "Fuel economy by car (1974)",
       x = NULL, y = NULL) +
  theme(plot.background  = element_rect(fill = "white", color = NA),
        panel.background = element_rect(fill = "#f0f0f0", color = NA),
        panel.grid.major.x = element_line(color = "white"),
        panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold", hjust = 0))
ex_2_3
#> 32 sorted horizontal bars, 538 red on gray.
```

**Explanation:** `tibble::rownames_to_column()` lifts row names into a proper column so they can be mapped to an aesthetic. Hiding y-grid (because the y-axis is categorical) and showing only x-grid (the continuous scale) matches the 538 rule of thumb: gridlines belong only on the continuous axis where reading numeric values matters.

</details>

### Exercise 2.4: Add a 538-style overline header and bold left-aligned title

**Task:** Take `ex_2_1` and add a small all-caps overline label "ECONOMY" above the title in muted gray, plus tighten the subtitle to a one-sentence story. Use `labs()` and `theme()` only. Save the modified ggplot to `ex_2_4`.

**Expected result:**

```
The unemployment line chart, now with an all-caps gray "ECONOMY"
above the bold title and a one-sentence subtitle below it
("Joblessness peaked in 2009 and has fallen since").
```

**Difficulty:** Intermediate

[HINTS]
ggplot2 has a spare label slot normally used for figure tags that you can repurpose as a kicker line and position by hand.
Add labs(tag = "ECONOMY", ...) to ex_2_1 and place it with plot.tag.position plus a styled plot.tag in theme().

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ex_2_1 +
  labs(tag = "ECONOMY",
       title = "US unemployment",
       subtitle = "Joblessness peaked in 2009 and has fallen since") +
  theme(plot.tag.position = c(0.02, 0.97),
        plot.tag = element_text(face = "bold", size = 9, color = "#777", hjust = 0))
ex_2_4
#> Same line, now with ECONOMY overline + tighter subtitle.
```

**Explanation:** `plot.tag` is normally used for figure labels like "(a)" but can be repurposed as a kicker line, positioned manually with `plot.tag.position` in normalized plot coordinates. The kicker doubles as a topic tag and signals editorial context, a 538 convention borrowed from print journalism layouts.

</details>

### Exercise 2.5: Plot a 538 multi-series line with categorical color groups

**Task:** Use `economics_long` filtered to `unemploy` and `psavert`, then plot both as lines colored from the 538 palette (`#008fd5`, `#fc4f30`) on a 538-style gray panel. Suppress the legend title and use a top-aligned horizontal legend just above the panel. Save the ggplot to `ex_2_5`.

**Expected result:**

```
Two lines: psavert blue (#008fd5) and unemploy red (#fc4f30)
on a #f0f0f0 panel. Legend sits above the panel, horizontal,
no legend title. Bold left-aligned title.
```

**Difficulty:** Advanced

[HINTS]
A legend aligned to the top-left sits flush with the title and avoids the visual jitter a bottom legend introduces.
After normalizing each series with group_by()/mutate(), plot geom_line(), name colors via scale_color_manual(), and set legend.position = "top" with legend.justification = "left".

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- economics_long |>
  filter(variable %in% c("unemploy", "psavert")) |>
  group_by(variable) |>
  mutate(v = (value - min(value)) / (max(value) - min(value))) |>
  ggplot(aes(x = date, y = v, color = variable)) +
  geom_line(linewidth = 0.9) +
  scale_color_manual(values = c(unemploy = "#fc4f30", psavert = "#008fd5")) +
  labs(title = "Unemployment vs. personal savings rate",
       subtitle = "Normalized [0,1] for shape comparison",
       x = NULL, y = NULL, color = NULL) +
  theme(plot.background  = element_rect(fill = "white", color = NA),
        panel.background = element_rect(fill = "#f0f0f0", color = NA),
        panel.grid.major = element_line(color = "white"),
        panel.grid.minor = element_blank(),
        legend.position  = "top",
        legend.justification = "left",
        legend.background = element_rect(fill = "white", color = NA),
        plot.title = element_text(face = "bold"))
ex_2_5
#> Two-series 538 line chart, legend top-left.
```

**Explanation:** Putting the legend `"top"` and justifying `"left"` aligns it with the title, removing visual jitter that bottom legends introduce. `scale_color_manual` with a named vector explicitly maps factor levels to hex codes, which beats default ggplot2 hues for editorial consistency: you guarantee the same series gets the same color across every chart in a series.

</details>

### Exercise 2.6: Add 538-style end-of-line direct labels

**Task:** Take `ex_2_5` and replace the legend with direct labels at the right end of each line, using `geom_text()` and the latest date in the data. Remove the legend entirely with `guides()`. Save the ggplot to `ex_2_6`.

**Expected result:**

```
Same two normalized lines, but legend is gone. Each line now
ends with its variable name in matching color just to the
right of the final data point.
```

**Difficulty:** Advanced

[HINTS]
To label a line at its end you only need the single last point of each series, fed as a separate small dataset.
Filter to date == max(date) per group, add geom_text() on that data, drop the legend with guides(color = "none"), and pad the x-range with expand_limits().

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
label_dat <- economics_long |>
  filter(variable %in% c("unemploy", "psavert")) |>
  group_by(variable) |>
  mutate(v = (value - min(value)) / (max(value) - min(value))) |>
  filter(date == max(date)) |>
  ungroup()

ex_2_6 <- ex_2_5 +
  geom_text(data = label_dat,
            aes(x = date, y = v, label = variable, color = variable),
            hjust = -0.1, fontface = "bold", show.legend = FALSE) +
  expand_limits(x = max(label_dat$date) + 365 * 3) +
  guides(color = "none")
ex_2_6
#> Same lines, legend removed, names labeled at endpoints.
```

**Explanation:** Direct labels save a glance: readers do not have to look up at a legend then back down. The trick is to feed `geom_text` a tiny dataset of just the last points per group, `hjust = -0.1` to push the label slightly right of the line, and `expand_limits()` so the label is not clipped by the panel.

</details>

### Exercise 2.7: Build a 538 small-multiples panel grid with facet_wrap

**Task:** Using `mpg`, build a small-multiples grid of `hwy` versus `displ` faceted by `class` (one panel per class), with 538 gray panels, white gridlines, and a single accent color (`#008fd5`) for points. Save the ggplot to `ex_2_7`.

**Expected result:**

```
A 3x3 (or 4x2) grid of mini scatter plots, one per vehicle class,
each on a #f0f0f0 panel with #008fd5 points. Strip labels above
each panel name the class; bold left-aligned overall title.
```

**Difficulty:** Intermediate

[HINTS]
Comparing groups is cleaner when each group gets its own mini panel sharing the same scales.
Add facet_wrap(~ class) to a geom_point() scatter and style the strips and panels in theme().

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "#008fd5", alpha = 0.7) +
  facet_wrap(~ class) +
  labs(title = "Engine size vs. highway MPG, by class",
       x = "Displacement (l)", y = "Highway MPG") +
  theme(plot.background  = element_rect(fill = "white", color = NA),
        panel.background = element_rect(fill = "#f0f0f0", color = NA),
        panel.grid.major = element_line(color = "white"),
        panel.grid.minor = element_blank(),
        strip.background = element_rect(fill = "white", color = NA),
        strip.text = element_text(face = "bold"),
        plot.title = element_text(face = "bold"))
ex_2_7
#> 7-panel small-multiples grid in 538 styling.
```

**Explanation:** Small multiples beat one busy chart for comparing groups because each panel shares scales, so visual position is the comparison. `facet_wrap` packs panels into rows automatically; if you wanted a strict row-column layout (say, one row per class), `facet_grid(class ~ .)` would be the call.

</details>

### Exercise 2.8: Reproduce a 538 win-probability-style filled area chart

**Task:** Build an inline tibble of 50 game minutes with a smoothed win probability for the home team (0-1), then plot it as a filled area chart with 538 red (`#fc4f30`) below 0.5 and 538 blue (`#008fd5`) above 0.5, with a horizontal reference line at 0.5. Save the ggplot to `ex_2_8`.

**Expected result:**

```
A smooth area from minute 1 to 50, fill alternating red below
and blue above a 0.5 horizontal reference line. Bold title
"Win probability over the game".
```

**Difficulty:** Advanced

[HINTS]
The two-color fill is really two area layers, each clipped to one side of the 0.5 line.
Draw two geom_area() layers using pmax(win_prob, 0.5) and pmin(win_prob, 0.5), add a geom_hline(yintercept = 0.5), and format the y-axis with percent.

```r title="Your turn"
set.seed(1)
wp <- tibble::tibble(
  minute = 1:50,
  win_prob = pmin(pmax(0.5 + cumsum(rnorm(50, 0, 0.04)), 0), 1)
)
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
wp <- tibble::tibble(
  minute = 1:50,
  win_prob = pmin(pmax(0.5 + cumsum(rnorm(50, 0, 0.04)), 0), 1)
)
ex_2_8 <- ggplot(wp, aes(x = minute, y = win_prob)) +
  geom_area(aes(y = pmax(win_prob, 0.5)), fill = "#008fd5", alpha = 0.75) +
  geom_area(aes(y = pmin(win_prob, 0.5)), fill = "#fc4f30", alpha = 0.75) +
  geom_hline(yintercept = 0.5, color = "#222", linewidth = 0.4) +
  scale_y_continuous(limits = c(0, 1), labels = percent) +
  labs(title = "Win probability over the game",
       subtitle = "Home team, simulated", x = "Minute", y = NULL) +
  theme(plot.background  = element_rect(fill = "white", color = NA),
        panel.background = element_rect(fill = "#f0f0f0", color = NA),
        panel.grid.major = element_line(color = "white"),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_2_8
#> 538 win-probability area chart.
```

**Explanation:** Two `geom_area` layers, each clipped to one side of 0.5 by `pmax`/`pmin`, build the bicolored fill. The 0.5 hline is the rhetorical anchor: anything above means the home team is favored, below means they are not. The `percent` formatter on the y-axis lets readers parse "63%" instead of "0.63".

</details>

## Section 3. BBC News-style charts (7 problems)

### Exercise 3.1: Apply BBC News-style theme to a Titanic survival bar chart

**Task:** Summarise `Titanic` by class and survival, then build a BBC News-style horizontal grouped bar chart with BBC blue (`#1380A1`) for survived and BBC red (`#990000`) for perished, white background, no gridlines on the y-axis, and bold left-aligned title. Save the ggplot to `ex_3_1`.

**Expected result:**

```
4 grouped horizontal bar pairs (1st, 2nd, 3rd, Crew). Survived
bars in #1380A1, perished bars in #990000. White background,
horizontal x-axis gridlines only. Bold left-aligned title.
```

**Difficulty:** Intermediate

[HINTS]
Grouped bars place survived and perished side by side so the reader compares the pair directly instead of reading a stack.
After summarising, draw geom_col(position = position_dodge2(reverse = TRUE)), set colors with scale_fill_manual(), and base the look on theme_minimal().

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- as.data.frame(Titanic) |>
  group_by(Class, Survived) |>
  summarise(n = sum(Freq), .groups = "drop") |>
  ggplot(aes(x = n, y = Class, fill = Survived)) +
  geom_col(position = position_dodge2(reverse = TRUE)) +
  scale_fill_manual(values = c(Yes = "#1380A1", No = "#990000"),
                    labels = c("Perished", "Survived")) +
  labs(title = "Titanic survival by class",
       x = NULL, y = NULL, fill = NULL) +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.major.y = element_blank(),
        panel.grid.minor   = element_blank(),
        plot.title = element_text(face = "bold", size = 14, hjust = 0),
        legend.position = "top", legend.justification = "left")
ex_3_1
#> BBC-style grouped bar chart.
```

**Explanation:** BBC's `bbplot` package builds this exact style; the recipe is a white background, grid only on the value axis, sans-serif bold title, and a top-left legend with no title. `position_dodge2` separates the survived/perished bars within each class so a reader compares the pair directly rather than reading proportions from a stack.

</details>

### Exercise 3.2: Apply BBC blue to a single-line BBC News-style chart

**Task:** Plot `economics$pce` versus `economics$date` as a single line in BBC blue (`#1380A1`) on a white background with `theme_minimal()` and a bold left-aligned title only. Save the ggplot to `ex_3_2`.

**Expected result:**

```
A single BBC-blue (#1380A1) line of US personal consumption
expenditure from 1967 to 2015, white background, bold title
"US consumer spending".
```

**Difficulty:** Beginner

[HINTS]
Start from a stripped-down theme and add back only the title and value-axis gridlines.
Draw geom_line(color = "#1380A1"), apply theme_minimal(), and bold the title via plot.title in theme().

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(economics, aes(x = date, y = pce)) +
  geom_line(color = "#1380A1", linewidth = 1) +
  labs(title = "US consumer spending",
       subtitle = "Billions of dollars, 1967-2015",
       x = NULL, y = NULL) +
  scale_y_continuous(labels = comma) +
  theme_minimal(base_family = "sans") +
  theme(plot.title = element_text(face = "bold", size = 14, hjust = 0),
        panel.grid.minor = element_blank())
ex_3_2
#> Single BBC-blue line, white background.
```

**Explanation:** `theme_minimal()` strips most chart furniture, then you re-add only what you want: title, gridlines on the value axis, axis labels. BBC's house color (`#1380A1`) is a calm teal-blue chosen for high contrast against white and against red flags. One color, one line, one title is the minimal news graphic.

</details>

### Exercise 3.3: Strip axis titles and use BBC's "title only" convention

**Task:** Take `ex_3_2` and remove the axis titles entirely, expand the title to do double duty as the explanation ("US consumer spending nearly tripled from 1990 to 2015"), and add a small caption with the data source. Save the ggplot to `ex_3_3`.

**Expected result:**

```
Same BBC-blue line as 3.2, but title now reads "US consumer
spending nearly tripled from 1990 to 2015". No x or y axis
title; caption "Source: ggplot2::economics" bottom-left.
```

**Difficulty:** Intermediate

[HINTS]
BBC writes titles as one-sentence findings, not topic labels, and pushes the source down to a caption.
On ex_3_2, set the narrative title and a caption in labs(), and blank axis.title in theme().

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ex_3_2 +
  labs(title = "US consumer spending nearly tripled from 1990 to 2015",
       subtitle = NULL,
       caption = "Source: ggplot2::economics") +
  theme(axis.title = element_blank(),
        plot.caption = element_text(hjust = 0, color = "#555"))
ex_3_3
#> Same chart, narrative title instead of label.
```

**Explanation:** BBC's data team writes titles as one-sentence findings, not topic labels. "US consumer spending" tells you what; "US consumer spending nearly tripled from 1990 to 2015" tells you what to take away. Removing axis titles and pushing the source to a caption is the rest of the BBC recipe.

</details>

### Exercise 3.4: Build a BBC horizontal grouped bar chart of diamonds by cut and color

**Task:** Aggregate `diamonds` to mean `price` by `cut` and `color`, then build a BBC-style grouped horizontal bar chart with one bar per (cut, color) pair, dodged by `color`, using the BBC palette (`#1380A1`, `#FAAB18`, `#990000`, `#588300`, `#dddddd`, `#999999`, `#222222`). Save the ggplot to `ex_3_4`.

**Expected result:**

```
A horizontal grouped bar chart: 5 cut categories on the y-axis,
each split into 7 color sub-bars showing mean price.
BBC palette, white background, x-axis gridlines only.
```

**Difficulty:** Advanced

[HINTS]
Aggregate to one value per cut-and-color pair first, then let the sub-category split the bars within each cut.
group_by(cut, color) and summarise(mean(price)), then geom_col(position = position_dodge()) with fill = color and a manual palette.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bbc_pal <- c("#1380A1","#FAAB18","#990000","#588300","#dddddd","#999999","#222222")
ex_3_4 <- diamonds |>
  group_by(cut, color) |>
  summarise(mean_price = mean(price), .groups = "drop") |>
  ggplot(aes(x = mean_price, y = cut, fill = color)) +
  geom_col(position = position_dodge(width = 0.85)) +
  scale_fill_manual(values = bbc_pal) +
  scale_x_continuous(labels = dollar) +
  labs(title = "Mean diamond price by cut and color",
       x = NULL, y = NULL, fill = "Color") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"),
        legend.position = "top", legend.justification = "left")
ex_3_4
#> Grouped horizontal bar chart, BBC palette.
```

**Explanation:** Grouped bars (`position_dodge`) work when you want to compare members of a sub-group within a top category. With 5 cuts and 7 colors that is 35 bars: any more grouping levels and it stops being readable. `scale_x_continuous(labels = dollar)` formats the price axis as `$1,000` rather than `1000`, a small detail that signals editorial polish.

</details>

### Exercise 3.5: Stack survival proportions with BBC styling

**Task:** Take the Titanic data, build a 100%-stacked BBC-style bar chart showing the *proportion* (not count) of survived versus perished within each class, using BBC blue and red. Add percent-formatted x-axis labels. Save the ggplot to `ex_3_5`.

**Expected result:**

```
4 horizontal 100%-stacked bars (1st, 2nd, 3rd, Crew).
Each bar is split into BBC-blue survived and BBC-red perished
proportions adding to 100%. X-axis labels formatted as percent.
```

**Difficulty:** Intermediate

[HINTS]
A 100% stack needs proportions, not counts, computed within each class so every bar fills the same width.
After summarising counts, group_by(Class) and mutate(prop = n / sum(n)), plot geom_col() on prop, and format the x-axis with percent.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- as.data.frame(Titanic) |>
  group_by(Class, Survived) |>
  summarise(n = sum(Freq), .groups = "drop") |>
  group_by(Class) |>
  mutate(prop = n / sum(n)) |>
  ggplot(aes(x = prop, y = Class, fill = Survived)) +
  geom_col() +
  scale_fill_manual(values = c(Yes = "#1380A1", No = "#990000"),
                    labels = c("Perished", "Survived")) +
  scale_x_continuous(labels = percent) +
  labs(title = "Share who survived the Titanic, by class",
       x = NULL, y = NULL, fill = NULL) +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"),
        legend.position = "top", legend.justification = "left")
ex_3_5
#> BBC-style 100%-stacked survival chart.
```

**Explanation:** Stacking *proportions* rather than counts puts every class on the same x-axis scale (0-100%), which is the right rhetorical frame for "share who survived". `group_by(Class) |> mutate(prop = n / sum(n))` computes per-class proportions; `scale_x_continuous(labels = percent)` displays them as 62% rather than 0.62.

</details>

### Exercise 3.6: Add a bold left-aligned BBC title with subtitle and source caption

**Task:** Take `ex_3_5` and add the BBC News title hierarchy: bold sans-serif title (size 16), italic gray subtitle below ("First class passengers survived at three times the rate of crew"), and a small bottom-left caption naming the source. Save the ggplot to `ex_3_6`.

**Expected result:**

```
Same 100%-stacked Titanic chart, now with bold size-16 title,
italic gray subtitle, and bottom-left "Source: datasets::Titanic"
caption, all left-aligned.
```

**Difficulty:** Intermediate

[HINTS]
The BBC title block sets rank with size and style: bold finding, italic elaboration, faded source.
On ex_3_5, add title, subtitle, and caption in labs(), and style plot.title, plot.subtitle, and plot.caption in theme().

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- ex_3_5 +
  labs(title = "Share who survived the Titanic, by class",
       subtitle = "First-class passengers survived at three times the rate of crew",
       caption = "Source: datasets::Titanic") +
  theme(plot.title    = element_text(face = "bold", size = 16, hjust = 0),
        plot.subtitle = element_text(face = "italic", color = "#555", hjust = 0, size = 11),
        plot.caption  = element_text(hjust = 0, color = "#777", size = 8))
ex_3_6
#> Same chart with full BBC title block.
```

**Explanation:** The BBC News title hierarchy uses size and italic to set rank: bold title is the finding, italic subtitle is the elaboration, faded caption is the source. `hjust = 0` aligns all three to the left margin of the panel, which keeps the eye moving down the left column rather than zig-zagging across the figure.

</details>

### Exercise 3.7: Build a BBC-style annotated line with event labels

**Task:** Plot `economics$unemploy` from 2005 onwards in BBC blue, then add two vertical reference lines at the 2008 and 2020 financial events with `geom_vline()` plus `annotate("text", ...)` labels. Save the ggplot to `ex_3_7`.

**Expected result:**

```
BBC-blue line of unemployment from 2005 onward. Two vertical
gray dashed lines mark Sep 2008 and Mar 2020, each annotated
with a small italic text label at the top of the panel.
```

**Difficulty:** Advanced

[HINTS]
Event markers turn a line into a narrative; the labels should stick to the top of the panel so resizing does not move them.
Add geom_vline() for the event dates and geom_text() with y = Inf and a small vjust to park labels at the panel top.

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- data.frame(
  date  = as.Date(c("2008-09-15", "2020-03-15")),
  label = c("Lehman", "COVID lockdowns")
)
ex_3_7 <- economics |>
  filter(date >= as.Date("2005-01-01")) |>
  ggplot(aes(x = date, y = unemploy)) +
  geom_line(color = "#1380A1", linewidth = 1) +
  geom_vline(data = events, aes(xintercept = date),
             color = "#555", linetype = "dashed", linewidth = 0.4) +
  geom_text(data = events, aes(x = date, y = Inf, label = label),
            vjust = 1.3, hjust = -0.05, color = "#555",
            fontface = "italic", size = 3.2) +
  labs(title = "US unemployment around two shocks",
       x = NULL, y = NULL) +
  scale_y_continuous(labels = comma) +
  theme_minimal(base_family = "sans") +
  theme(plot.title = element_text(face = "bold", size = 14, hjust = 0),
        panel.grid.minor = element_blank())
ex_3_7
#> BBC-blue annotated unemployment line.
```

**Explanation:** Event annotations turn a line chart into a narrative: instead of "look at this curve", the chart says "look how the curve responded to Lehman, then to COVID". `geom_text(... y = Inf, vjust = 1.3)` parks labels at the top of the panel regardless of the data range, so resizing the plot does not knock them off-screen.

</details>

## Section 4. Scientific journal figures (8 problems)

### Exercise 4.1: Publication-ready ToothGrowth scatter with error bars

**Task:** Summarise `ToothGrowth` by `supp` and `dose` to mean tooth length and 95% confidence intervals via the t-distribution, then plot mean points colored by `supp` with `geom_errorbar()` at each dose. Use a colorblind-safe palette and minimal theme. Save the ggplot to `ex_4_1`.

**Expected result:**

```
6 points (2 supps x 3 doses) with vertical 95% CI error bars,
on a minimal white panel. Supps colored with colorblind-safe
palette. X-axis is dose, y-axis is mean tooth length.
```

**Difficulty:** Advanced

[HINTS]
A small-sample confidence interval uses the t-distribution, not a fixed 1.96 multiplier, and the multiplier depends on each cell's sample size.
Summarise mean and standard error, compute the half-width with qt(0.975, n - 1) * se, then layer geom_errorbar() and geom_point() with position_dodge().

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ToothGrowth |>
  group_by(supp, dose) |>
  summarise(mean = mean(len),
            se   = sd(len) / sqrt(n()),
            n    = n(),
            ci   = qt(0.975, n - 1) * se, .groups = "drop") |>
  ggplot(aes(x = factor(dose), y = mean, color = supp, group = supp)) +
  geom_errorbar(aes(ymin = mean - ci, ymax = mean + ci), width = 0.15,
                position = position_dodge(width = 0.25)) +
  geom_point(size = 3, position = position_dodge(width = 0.25)) +
  scale_color_manual(values = c(OJ = "#E69F00", VC = "#0072B2")) +
  labs(title = "Tooth growth response by supplement and dose",
       x = "Dose (mg/day)", y = "Mean tooth length (mm)", color = "Supplement") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_4_1
#> 6 mean points with t-95% CI bars, colorblind-safe palette.
```

**Explanation:** A 95% confidence interval is `mean +/- t * se`, not `mean +/- 1.96 * se`, when sample sizes are small. `qt(0.975, n - 1)` returns the right multiplier for each sample-size cell. `position_dodge` separates the two supplement series at each dose so error bars do not overlap, which is the journal-figure default.

</details>

### Exercise 4.2: Nature-style box-plus-jitter plot of ChickWeight

**Task:** Build a Nature-style figure of `ChickWeight$weight` versus `ChickWeight$Diet`, with `geom_boxplot()` underneath and `geom_jitter()` overlaid. Use grayscale fills, monochrome black points with alpha, no panel border, and bold sans-serif text. Save the ggplot to `ex_4_2`.

**Expected result:**

```
4 grouped distributions (Diet 1-4) of chick weight as boxplots
filled in light gray with black-outlined jittered points
overlaid. White background, no panel border, bold title.
```

**Difficulty:** Intermediate

[HINTS]
Showing the raw observations on top of the boxes means you must avoid drawing the outliers twice.
Draw geom_boxplot(outlier.shape = NA) first, overlay geom_jitter() with low alpha, and use theme_minimal().

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(ChickWeight, aes(x = factor(Diet), y = weight)) +
  geom_boxplot(fill = "#dddddd", color = "#222222", outlier.shape = NA, width = 0.5) +
  geom_jitter(width = 0.18, height = 0, alpha = 0.35, color = "#222222", size = 1.2) +
  labs(title = "Chick weight by diet (all timepoints)",
       x = "Diet", y = "Weight (g)") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.major.x = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_4_2
#> Box-plus-jitter, monochrome.
```

**Explanation:** Journals like Nature increasingly expect the underlying observations on top of summary statistics: a boxplot alone hides the sample size and distribution shape. Hiding `outlier.shape = NA` prevents double-drawing outliers as both box outliers and jitter dots. Monochrome design is intentional: many journals reproduce figures in grayscale for print supplements.

</details>

### Exercise 4.3: Add significance brackets between PlantGrowth groups

**Task:** Run a `pairwise.t.test()` on `PlantGrowth$weight` by `PlantGrowth$group`, then plot a boxplot of weight by group and overlay a manual significance bracket (segment + text) between the two groups with the smallest p-value, labeled with that p-value to two decimals. Save the ggplot to `ex_4_3`.

**Expected result:**

```
3 monochrome boxplots (ctrl, trt1, trt2). A horizontal segment
joins the boxplot pair with smallest pairwise p-value, with a
small "p = 0.0X" label above it. Bold sans-serif title.
```

**Difficulty:** Advanced

[HINTS]
Run the pairwise test first, find the pair with the smallest p-value, then draw the bracket just above the tallest box.
Use pairwise.t.test(), pull the minimum p-value, and place the bracket with annotate("segment", ...) and annotate("text", ...).

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pw <- pairwise.t.test(PlantGrowth$weight, PlantGrowth$group, p.adjust.method = "none")
pvals <- as.data.frame(as.table(pw$p.value)) |> filter(!is.na(Freq))
smallest <- pvals[which.min(pvals$Freq), ]
g1 <- as.character(smallest$Var1); g2 <- as.character(smallest$Var2)
pv <- formatC(smallest$Freq, format = "f", digits = 2)
y_top <- max(PlantGrowth$weight) + 0.4

ex_4_3 <- ggplot(PlantGrowth, aes(x = group, y = weight)) +
  geom_boxplot(fill = "#dddddd", color = "#222") +
  annotate("segment", x = g1, xend = g2, y = y_top, yend = y_top, color = "#222") +
  annotate("text",    x = g2, y = y_top + 0.15,
           label = paste0("p = ", pv), size = 3.5, hjust = 1) +
  labs(title = "PlantGrowth weight by group",
       x = NULL, y = "Weight") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_4_3
#> Boxplots with significance bracket on smallest-p pair.
```

**Explanation:** Significance brackets compress a pairwise test into a visual annotation: you do not need a separate stats table. Computing the smallest p-value first and parking the bracket at `max(weight) + 0.4` keeps the annotation just above the highest box. Use `p.adjust.method = "bonferroni"` for multiple-comparison correction when reporting in a paper.

</details>

### Exercise 4.4: Build a multi-panel Nature figure with facets

**Task:** Build a four-panel figure: scatter `mpg` vs `wt`, box `mpg` by `cyl`, density of `mpg`, and barplot of `cyl` counts, then arrange them in a 2x2 grid using `patchwork` semantics in pure ggplot2 via `facet_wrap(~panel, scales = "free")` after stacking the four datasets. Save the final ggplot to `ex_4_4`.

**Expected result:**

```
A 2x2 grid of four mini panels labeled (a) scatter, (b) box,
(c) density, (d) bar. Each panel has its own scales and titles.
Monochrome black-and-gray styling, bold panel labels.
```

**Difficulty:** Advanced

[HINTS]
Without a layout package you can fake a multi-panel figure by tagging each dataset with a panel column and faceting.
Give each geom's data a panel column via transform(), then facet_wrap(~ panel, scales = "free", ncol = 2).

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |> mutate(cyl = factor(cyl))

ex_4_4 <- ggplot() +
  geom_point(data = transform(mt, panel = "(a) wt vs mpg"),
             aes(x = wt, y = mpg), color = "#222") +
  geom_boxplot(data = transform(mt, panel = "(b) mpg by cyl"),
               aes(x = cyl, y = mpg), fill = "#dddddd", color = "#222") +
  geom_density(data = transform(mt, panel = "(c) mpg density"),
               aes(x = mpg), fill = "#cccccc", color = "#222") +
  geom_bar(data = transform(mt, panel = "(d) cyl count"),
           aes(x = cyl), fill = "#999999", color = "#222") +
  facet_wrap(~ panel, scales = "free", ncol = 2) +
  labs(title = "mtcars summary figure", x = NULL, y = NULL) +
  theme_minimal(base_family = "sans") +
  theme(strip.text = element_text(face = "bold"),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_4_4
#> 2x2 multi-panel summary figure.
```

**Explanation:** Without patchwork installed, you can fake a multi-panel figure by stacking four geom layers, tagging each with a `panel` column, and faceting. `scales = "free"` lets each panel set its own x and y limits, which matters here because the boxplot's x is categorical while the scatter's x is continuous. The trade-off: shared scales are blocked.

</details>

### Exercise 4.5: Apply Okabe-Ito colorblind-safe palette to a sleepstudy plot

**Task:** Plot `sleepstudy$Reaction` versus `sleepstudy$Days` colored by `Subject`, using the Okabe-Ito 8-color palette (`#000000`, `#E69F00`, `#56B4E9`, `#009E73`, `#F0E442`, `#0072B2`, `#D55E00`, `#CC79A7`) cycled across the 18 subjects, then add a `geom_smooth()` on top. Save the ggplot to `ex_4_5`.

**Expected result:**

```
18 colored lines (subjects), reaction time rising with sleep
deprivation days, colored by cycled Okabe-Ito palette. Black
smooth trend line overlaid. White background, no minor grid.
```

**Difficulty:** Intermediate

[HINTS]
The colorblind-safe palette has only 8 colors, so it must be recycled to cover all 18 subjects, and a single trend line overlays the lot.
Build the palette vector, repeat it with rep(..., length.out = ...) inside scale_color_manual(), and add geom_smooth(aes(group = 1), se = FALSE).

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
okabe <- c("#000000","#E69F00","#56B4E9","#009E73","#F0E442",
           "#0072B2","#D55E00","#CC79A7")
ex_4_5 <- ggplot(sleepstudy, aes(x = Days, y = Reaction, color = Subject)) +
  geom_line(alpha = 0.6) +
  geom_smooth(aes(group = 1), color = "#222", linewidth = 1, se = FALSE) +
  scale_color_manual(values = rep(okabe, length.out = length(unique(sleepstudy$Subject)))) +
  labs(title = "Reaction time by days of sleep restriction",
       x = "Days of sleep restriction", y = "Reaction time (ms)") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"),
        legend.position = "none")
ex_4_5
#> 18 colored subject lines plus black trend overlay.
```

**Explanation:** The Okabe-Ito palette was designed to be distinguishable by readers with the most common forms of color vision deficiency, which is why journals like Nature recommend it. With 18 subjects you cycle the 8-color palette twice; suppressing the legend (`legend.position = "none"`) avoids a 18-row legend that would dominate the chart.

</details>

### Exercise 4.6: Journal-style line with shaded confidence band

**Task:** Take `Loblolly` (tree heights), summarise mean height and 95% CI per `age`, then plot a line of mean height with a `geom_ribbon()` confidence band underneath in light gray. Use a minimal black-and-gray theme. Save the ggplot to `ex_4_6`.

**Expected result:**

```
A black mean line rising with age (3-25 years) with a light-gray
ribbon shading the 95% confidence interval beneath. White panel,
bold title "Loblolly pine growth".
```

**Difficulty:** Advanced

[HINTS]
Show the central estimate with its uncertainty by drawing the band first so it sits behind the line.
Summarise mean and a qt()-based CI per age, draw geom_ribbon(aes(ymin = ..., ymax = ...)) then geom_line() on top.

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- Loblolly |>
  group_by(age) |>
  summarise(mean = mean(height),
            se   = sd(height) / sqrt(n()),
            ci   = qt(0.975, n() - 1) * se, .groups = "drop") |>
  ggplot(aes(x = age, y = mean)) +
  geom_ribbon(aes(ymin = mean - ci, ymax = mean + ci),
              fill = "#cccccc", alpha = 0.6) +
  geom_line(color = "#222", linewidth = 1) +
  labs(title = "Loblolly pine growth",
       x = "Tree age (years)", y = "Mean height (ft)") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_4_6
#> Black mean line with gray 95% CI ribbon.
```

**Explanation:** The ribbon-plus-line idiom is the standard journal way to show a central estimate with its uncertainty: ribbon below (drawn first so it sits behind), line on top. Light gray fill at moderate alpha keeps the band visible without competing with the line. For per-group uncertainty bands, add a `fill` aesthetic and `group_by(... , category)`.

</details>

### Exercise 4.7: Build a publication-style heatmap of mtcars correlations

**Task:** Compute the correlation matrix of `mtcars`, pivot it to long form, then build a heatmap with `geom_tile()` using a diverging blue-white-red palette, correlation values printed inside each cell rounded to 2 decimals. Save the ggplot to `ex_4_7`.

**Expected result:**

```
11x11 heatmap of mtcars correlations. Diverging palette: dark
blue strong negative, white near 0, dark red strong positive.
Each cell shows the rounded correlation in black text.
```

**Difficulty:** Advanced

[HINTS]
A correlation matrix has to be reshaped to long form before it can be tiled, and 0 is a meaningful midpoint for the color scale.
Run cor(mtcars), pivot_longer() it, draw geom_tile() with geom_text() labels, and color with scale_fill_gradient2(midpoint = 0).

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
corr_long <- as.data.frame(cor(mtcars)) |>
  tibble::rownames_to_column("var1") |>
  pivot_longer(-var1, names_to = "var2", values_to = "r")

ex_4_7 <- ggplot(corr_long, aes(x = var1, y = var2, fill = r)) +
  geom_tile() +
  geom_text(aes(label = sprintf("%.2f", r)), size = 2.7, color = "black") +
  scale_fill_gradient2(low = "#2166ac", mid = "white", high = "#b2182b",
                       midpoint = 0, limits = c(-1, 1)) +
  labs(title = "mtcars correlation matrix",
       x = NULL, y = NULL, fill = "r") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid = element_blank(),
        axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))
ex_4_7
#> Diverging heatmap with in-cell r values.
```

**Explanation:** A diverging palette (`scale_fill_gradient2`) is the right choice when 0 has meaning: blue means anti-correlated, red means correlated, white means independent. Fixing `limits = c(-1, 1)` keeps the color scale comparable across panels if you later facet. Printing the correlation value inside each tile saves the reader from having to estimate from color alone.

</details>

### Exercise 4.8: Save a journal figure at 600 DPI print specs

**Task:** Take `ex_4_2` and save it as a 1800x1200 pixel PNG at 600 DPI using `ggsave()` to a temp file. Print the saved file path along with the calculated width and height in inches as a named list. Save that list to `ex_4_8`.

**Expected result:**

```
$path
[1] "<temp>/chickweight-fig.png"
$width_in
[1] 3
$height_in
[1] 2
$dpi
[1] 600
```

**Difficulty:** Intermediate

[HINTS]
Render at the exact target dimensions so font sizes stay legible; 1800x1200 pixels at 600 DPI is just 3 by 2 inches.
Call ggsave() with width = 3, height = 2, dpi = 600, units = "in" to a tempfile(), then collect path and specs in a list().

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
out_path <- tempfile(pattern = "chickweight-fig", fileext = ".png")
ggsave(out_path, ex_4_2, width = 3, height = 2, dpi = 600, units = "in")
ex_4_8 <- list(path = out_path, width_in = 3, height_in = 2, dpi = 600)
ex_4_8
#> $path
#> [1] "<temp>/chickweight-fig<...>.png"
#> $width_in
#> [1] 3
#> $height_in
#> [1] 2
#> $dpi
#> [1] 600
```

**Explanation:** 600 DPI is the print standard for biology and chemistry journals (some require 1200 DPI for line art). 3 inches wide is a single-column figure; 7 inches is a full-page two-column figure. Always render to the target dimensions, not a larger size scaled down, so font sizes stay legible. Vector formats (PDF, EPS) sidestep DPI entirely.

</details>

## Section 5. Financial Times and Bloomberg-style charts (8 problems)

### Exercise 5.1: Build a Financial Times pink-themed EuStockMarkets line

**Task:** Convert `EuStockMarkets` to a long tibble of date and four series (DAX, SMI, CAC, FTSE), then plot all four as colored lines on the FT salmon-pink background (`#fff1e0`) with a thin black baseline at the bottom. Save the ggplot to `ex_5_1`.

**Expected result:**

```
Four colored lines on a salmon-pink (#fff1e0) panel showing
DAX, SMI, CAC, FTSE indices from 1991 to 1999.
Bold left-aligned title "European stock indices".
```

**Difficulty:** Intermediate

[HINTS]
The matrix needs a date column and a reshape to long form before four series can be drawn from it.
Convert with as.data.frame(), add a date sequence, pivot_longer(), draw geom_line() with color = index, and set the pink backgrounds in theme().

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
eu_df <- as.data.frame(EuStockMarkets) |>
  tibble::as_tibble() |>
  mutate(date = as.Date("1991-01-01") + (seq_len(nrow(.)) - 1) * 1.5) |>
  pivot_longer(-date, names_to = "index", values_to = "level")

ex_5_1 <- ggplot(eu_df, aes(x = date, y = level, color = index)) +
  geom_line(linewidth = 0.7) +
  scale_color_manual(values = c(DAX = "#0f5499", SMI = "#990f3d",
                                CAC = "#0d7680", FTSE = "#262a33")) +
  labs(title = "European stock indices",
       subtitle = "1991-1999, daily closes",
       x = NULL, y = NULL, color = NULL) +
  theme(plot.background  = element_rect(fill = "#fff1e0", color = NA),
        panel.background = element_rect(fill = "#fff1e0", color = NA),
        panel.grid.major.y = element_line(color = "#e7d8c6"),
        panel.grid.major.x = element_blank(),
        panel.grid.minor = element_blank(),
        axis.line.x = element_line(color = "#222"),
        legend.background = element_rect(fill = "#fff1e0", color = NA),
        legend.key = element_rect(fill = "#fff1e0", color = NA),
        plot.title = element_text(face = "bold"))
ex_5_1
#> FT-pink four-line chart.
```

**Explanation:** FT's house pink (`#fff1e0`) is a calmer alternative to the Economist's blue-gray, but the design grammar is the same: solid background, restrained palette for series, thin axis line at the bottom. The four index colors are pulled from the FT visual style guide: blue for DAX, claret for SMI, teal for CAC, dark gray for FTSE.

</details>

### Exercise 5.2: Reproduce the Bloomberg terminal dark background

**Task:** Plot `economics$pce` versus `economics$date` on a Bloomberg-style dark background (panel `#0a0a0a`, plot `#0a0a0a`), with line color `#ff9900` (Bloomberg amber), gridlines in dark gray `#222`, and white text for title and axis labels. Save the ggplot to `ex_5_2`.

**Expected result:**

```
A bright amber (#ff9900) line of US PCE on a near-black
(#0a0a0a) panel. Faint dark-gray gridlines, white title and
axis text. Looks like a Bloomberg terminal screen.
```

**Difficulty:** Intermediate

[HINTS]
A dark theme means every text element must be recolored explicitly, because each has its own color slot.
Draw geom_line(color = "#ff9900"), set both backgrounds to #0a0a0a, and give axis.text, axis.title, and plot.title a white color in theme().

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(economics, aes(x = date, y = pce)) +
  geom_line(color = "#ff9900", linewidth = 0.8) +
  scale_y_continuous(labels = comma) +
  labs(title = "US personal consumption expenditure",
       x = NULL, y = NULL) +
  theme(plot.background  = element_rect(fill = "#0a0a0a", color = NA),
        panel.background = element_rect(fill = "#0a0a0a", color = NA),
        panel.grid.major = element_line(color = "#222"),
        panel.grid.minor = element_blank(),
        axis.text  = element_text(color = "white"),
        axis.title = element_text(color = "white"),
        plot.title = element_text(color = "white", face = "bold"))
ex_5_2
#> Bloomberg-terminal-style amber line on near-black.
```

**Explanation:** The Bloomberg terminal's amber-on-black aesthetic exists because amber phosphor monitors were the standard finance hardware of the 1980s. Reproducing it for a chart signals "trading desk context". The key is to recolor every text element explicitly: `axis.text`, `axis.title`, `plot.title` each have their own color slot.

</details>

### Exercise 5.3: Add a Bloomberg-style ticker label at the line endpoint

**Task:** Take `ex_5_2` and add a Bloomberg-style amber "PCE" ticker label at the right end of the line: a small amber rectangle behind a white bold ticker label positioned at the most recent data point. Use `annotate()` calls. Save the ggplot to `ex_5_3`.

**Expected result:**

```
Same amber-on-black PCE line, now with a small amber rectangle
just right of the last point, containing white bold text "PCE"
mimicking a Bloomberg ticker tag.
```

**Difficulty:** Advanced

[HINTS]
A ticker tag is a colored tile with text centered on top, both placed at the last data point.
Take the last row of the data, add annotate("rect", ...) for the amber tile and annotate("text", ...) for "PCE", then expand_limits() so it is not clipped.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
last_pt <- tail(economics, 1)
ex_5_3 <- ex_5_2 +
  annotate("rect",
           xmin = last_pt$date,
           xmax = last_pt$date + 365 * 2,
           ymin = last_pt$pce * 0.97, ymax = last_pt$pce * 1.03,
           fill = "#ff9900") +
  annotate("text", x = last_pt$date + 365, y = last_pt$pce,
           label = "PCE", color = "white", fontface = "bold", size = 3.5) +
  expand_limits(x = last_pt$date + 365 * 3)
ex_5_3
#> Same chart with PCE ticker tag at line end.
```

**Explanation:** Two annotation layers do the work: a `rect` for the amber background tile, sized in date units (2 years wide) and price units (a thin band around the last value), then a `text` annotation centered inside it. `expand_limits()` extends the x-axis so the tile is not clipped at the panel edge.

</details>

### Exercise 5.4: Build an FT-style monochrome bar chart with sparse gridlines

**Task:** Summarise `txhousing` to median sales per city (top 10 cities by total sales), then build a horizontal bar chart in FT monochrome navy (`#262a33`) on FT pink, with only x-axis gridlines visible and no panel border. Save the ggplot to `ex_5_4`.

**Expected result:**

```
Top 10 Texas cities by median home sales, navy horizontal bars
on a salmon-pink panel, sparse white x-gridlines only.
Bold left-aligned title.
```

**Difficulty:** Intermediate

[HINTS]
Pick the top cities by total sales, but order the bars by the median value you actually display.
Summarise per city, slice_max(total, n = 10), map y = reorder(city, med), draw geom_col(fill = "#262a33"), and show only x-gridlines.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- txhousing |>
  filter(!is.na(sales)) |>
  group_by(city) |>
  summarise(total = sum(sales), med = median(sales), .groups = "drop") |>
  slice_max(total, n = 10) |>
  ggplot(aes(x = med, y = reorder(city, med))) +
  geom_col(fill = "#262a33") +
  scale_x_continuous(labels = comma) +
  labs(title = "Top Texas markets by median monthly sales",
       x = NULL, y = NULL) +
  theme(plot.background  = element_rect(fill = "#fff1e0", color = NA),
        panel.background = element_rect(fill = "#fff1e0", color = NA),
        panel.grid.major.x = element_line(color = "white"),
        panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_5_4
#> 10 navy bars on FT-pink panel.
```

**Explanation:** Sparse-grid layouts force the reader to anchor on the bar tip rather than gridline crossings, which is the FT preference for headline summaries. `slice_max(total, n = 10)` picks the top ten by total sales; reordering by `med` then sorts the bars by the value actually displayed, not the cut criterion.

</details>

### Exercise 5.5: Reproduce a Bloomberg candlestick-style OHLC chart

**Task:** Build an inline 30-row tibble of daily OHLC bars with `date`, `open`, `high`, `low`, `close`. Plot each day as a vertical wick (low to high) with a wider body (open to close), colored green when `close > open` and red when `close < open`. Save the ggplot to `ex_5_5`.

**Expected result:**

```
30 candlestick bars on a near-black panel. Up days have green
bodies, down days have red bodies. Thin vertical wick lines run
through each body from daily low to daily high.
```

**Difficulty:** Advanced

[HINTS]
Each candle is two stacked shapes: a thin range line and a wider body between open and close.
Draw geom_segment() for the low-to-high wick and geom_rect() for the open-to-close body, colored by direction with scale_fill_manual().

```r title="Your turn"
set.seed(42)
ohlc <- tibble::tibble(
  date  = seq.Date(as.Date("2024-01-02"), by = "day", length.out = 30),
  open  = 100 + cumsum(rnorm(30, 0, 0.7)),
  close = 100 + cumsum(rnorm(30, 0, 0.7))
) |> dplyr::mutate(
  high = pmax(open, close) + abs(rnorm(30, 0, 0.5)),
  low  = pmin(open, close) - abs(rnorm(30, 0, 0.5)),
  dir  = ifelse(close >= open, "up", "down")
)
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ohlc <- tibble::tibble(
  date  = seq.Date(as.Date("2024-01-02"), by = "day", length.out = 30),
  open  = 100 + cumsum(rnorm(30, 0, 0.7)),
  close = 100 + cumsum(rnorm(30, 0, 0.7))
) |> mutate(
  high = pmax(open, close) + abs(rnorm(30, 0, 0.5)),
  low  = pmin(open, close) - abs(rnorm(30, 0, 0.5)),
  dir  = ifelse(close >= open, "up", "down")
)

ex_5_5 <- ggplot(ohlc, aes(x = date)) +
  geom_segment(aes(xend = date, y = low, yend = high), color = "white") +
  geom_rect(aes(xmin = date - 0.35, xmax = date + 0.35,
                ymin = pmin(open, close), ymax = pmax(open, close),
                fill = dir), color = NA) +
  scale_fill_manual(values = c(up = "#00c853", down = "#d50000")) +
  labs(title = "Daily OHLC bars",
       x = NULL, y = "Price", fill = NULL) +
  theme(plot.background  = element_rect(fill = "#0a0a0a", color = NA),
        panel.background = element_rect(fill = "#0a0a0a", color = NA),
        panel.grid = element_line(color = "#222"),
        panel.grid.minor = element_blank(),
        axis.text  = element_text(color = "white"),
        axis.title = element_text(color = "white"),
        plot.title = element_text(color = "white", face = "bold"),
        legend.background = element_rect(fill = "#0a0a0a", color = NA),
        legend.text = element_text(color = "white"),
        legend.key  = element_rect(fill = "#0a0a0a"))
ex_5_5
#> 30 colored candlesticks on a Bloomberg dark panel.
```

**Explanation:** A candlestick is two glyphs stacked: a thin segment (wick) showing the day's range and a thicker rectangle (body) showing where the day opened and closed. `geom_rect` is the right primitive for the body because it gives independent control of x-width (`+/- 0.35` days) and y-extent. Green-up and red-down is the US convention; the rest of the world often uses the inverse.

</details>

### Exercise 5.6: Build an FT-style time series with shaded recession bars

**Task:** Plot `economics$unemploy` over time as an FT-navy line on the FT pink panel, then shade two known US recession periods (2001 and 2008-2009) as light-gray translucent rectangles behind the line. Save the ggplot to `ex_5_6`.

**Expected result:**

```
Navy line of US unemployment on a #fff1e0 panel.
Two pale-gray vertical recession bands (2001 and 2008-2009) sit
behind the line. Bold title "US unemployment".
```

**Difficulty:** Advanced

[HINTS]
The recession bands are drawn from a separate dataset and must stretch the full panel height regardless of the data range.
Add geom_rect() with inherit.aes = FALSE, ymin = -Inf, ymax = Inf for the bands, drawn before the geom_line().

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
recessions <- data.frame(
  start = as.Date(c("2001-03-01", "2007-12-01")),
  end   = as.Date(c("2001-11-01", "2009-06-01"))
)

ex_5_6 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_rect(data = recessions, inherit.aes = FALSE,
            aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
            fill = "#999999", alpha = 0.3) +
  geom_line(color = "#262a33", linewidth = 0.8) +
  scale_y_continuous(labels = comma) +
  labs(title = "US unemployment with recession bars",
       x = NULL, y = NULL) +
  theme(plot.background  = element_rect(fill = "#fff1e0", color = NA),
        panel.background = element_rect(fill = "#fff1e0", color = NA),
        panel.grid.major.y = element_line(color = "#e7d8c6"),
        panel.grid.major.x = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_5_6
#> Navy line with gray recession bands.
```

**Explanation:** Recession bands are a finance convention for showing that "this dip happened during X". The trick is `inherit.aes = FALSE` on `geom_rect`, otherwise it tries to inherit the line's x/y mapping. `ymin = -Inf, ymax = Inf` makes the band stretch the full panel height regardless of data range.

</details>

### Exercise 5.7: Add FT-style data source caveat caption

**Task:** Take `ex_5_6` and add a small italic bottom-left caption noting the data source and a one-line caveat ("Shaded areas: NBER-dated US recessions"). Move it just below the panel using `plot.caption` theme controls. Save to `ex_5_7`.

**Expected result:**

```
Same unemployment chart, now with italic dark-gray caption at
the bottom-left: "Source: ggplot2::economics. Shaded areas:
NBER-dated US recessions."
```

**Difficulty:** Beginner

[HINTS]
A source caveat is editorial table stakes, left-aligned with the rest of the title block.
Add a caption in labs() on ex_5_6 and style plot.caption italic with hjust = 0 in theme().

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- ex_5_6 +
  labs(caption = "Source: ggplot2::economics. Shaded areas: NBER-dated US recessions.") +
  theme(plot.caption = element_text(face = "italic", hjust = 0,
                                    color = "#555", size = 8))
ex_5_7
#> Same chart with FT-style source caption.
```

**Explanation:** A source caveat is editorial table stakes for any finance chart: readers need to know who reported the data and what the shaded regions mean. `hjust = 0` left-aligns the caption with the rest of the title block, which is the FT convention; right-aligned captions look detached on wide charts.

</details>

### Exercise 5.8: Bloomberg-style screener tile grid for indices

**Task:** Take the four EuStockMarkets indices and their daily percent change tibble, summarise the last-week mean return per index, then build a 1x4 tile grid: one square per index, colored green if positive and red if negative, with the index code in white bold text in the center of each tile. Save the ggplot to `ex_5_8`.

**Expected result:**

```
A 1x4 grid of square tiles, one per index (DAX, SMI, CAC, FTSE).
Each tile is green or red based on whether the last-week mean
return is positive or negative. White bold ticker text centered.
```

**Difficulty:** Advanced

[HINTS]
A screener compresses each series into a colored tile, where color carries direction and position carries identity.
Compute last-week mean return per index, draw geom_tile() with geom_text() labels, force squares with coord_equal(), and strip everything with theme_void().

```r title="Your turn"
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
eu_df <- as.data.frame(EuStockMarkets) |>
  tibble::as_tibble() |>
  mutate(t = seq_len(n())) |>
  pivot_longer(-t, names_to = "index", values_to = "level") |>
  group_by(index) |>
  mutate(ret = (level - lag(level)) / lag(level)) |>
  ungroup() |>
  filter(t > max(t) - 5) |>
  group_by(index) |>
  summarise(mean_ret = mean(ret, na.rm = TRUE), .groups = "drop") |>
  mutate(dir = ifelse(mean_ret >= 0, "up", "down"),
         x = seq_along(index), y = 1)

ex_5_8 <- ggplot(eu_df, aes(x = x, y = y)) +
  geom_tile(aes(fill = dir), width = 0.9, height = 0.9) +
  geom_text(aes(label = index), color = "white", fontface = "bold", size = 5) +
  scale_fill_manual(values = c(up = "#00c853", down = "#d50000")) +
  coord_equal() +
  labs(title = "Weekly screener", x = NULL, y = NULL) +
  theme_void(base_family = "sans") +
  theme(plot.background = element_rect(fill = "#0a0a0a", color = NA),
        plot.title = element_text(color = "white", face = "bold", hjust = 0),
        legend.position = "none")
ex_5_8
#> 1x4 screener tile grid, green/red by direction.
```

**Explanation:** Screener tiles compress many series into a single eye-sweep: color carries direction, position carries identity. `coord_equal()` forces tiles to render as squares regardless of plot dimensions. `theme_void()` strips axes and panel altogether, then you add back only the title and a black plot background to evoke the Bloomberg terminal grid.

</details>

## Section 6. New York Times-style annotated charts (6 problems)

### Exercise 6.1: Build an NYT-style line chart with inline annotations

**Task:** Plot `economics$unemploy` over time as a thin black line on white, then add an inline italic annotation at the 2009 peak labeling "Great Recession peak" with a short connector segment from the label to the line. Save the ggplot to `ex_6_1`.

**Expected result:**

```
Thin black line of US unemployment on white. A small italic
gray label "Great Recession peak" sits near the 2009 high
point, with a short angled segment connecting label to line.
```

**Difficulty:** Intermediate

[HINTS]
NYT annotations live inside the panel, so the label position is computed relative to the data point it describes.
Find the peak with slice_max(), add annotate("text", ...) for the label and annotate("segment", ...) for the connector.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
peak <- economics |> slice_max(unemploy, n = 1)
label_xy <- list(x = peak$date - 365 * 3, y = peak$unemploy + 1000)

ex_6_1 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line(color = "#222", linewidth = 0.6) +
  annotate("text", x = label_xy$x, y = label_xy$y,
           label = "Great Recession peak",
           fontface = "italic", color = "#555", size = 3.3, hjust = 1) +
  annotate("segment",
           x = label_xy$x + 60, xend = peak$date - 100,
           y = label_xy$y - 100, yend = peak$unemploy,
           color = "#555", linewidth = 0.3) +
  scale_y_continuous(labels = comma) +
  labs(title = "US unemployment", x = NULL, y = NULL) +
  theme_minimal(base_family = "serif") +
  theme(plot.title = element_text(face = "bold", size = 14, hjust = 0),
        panel.grid.minor = element_blank())
ex_6_1
#> Thin line with inline 2009 peak annotation.
```

**Explanation:** NYT charts use annotations as captions placed *in* the panel rather than below it: the eye finds the highlighted point first, then the line context. The trick is computing the label position relative to the data point (`peak$date - 3 years`) so the connector segment lands cleanly. Serif typography on a minimal theme is the rest of the NYT recipe.

</details>

### Exercise 6.2: Apply NYT serif typography and caption block

**Task:** Take `ex_6_1` and replace the default sans-serif theme with a serif `base_family`, set the title to medium weight (not bold), and add a caption with source and methodology. Save the modified ggplot to `ex_6_2`.

**Expected result:**

```
Same unemployment chart, but title and labels are now serif.
Title is regular-weight italic-styled; small italic gray
caption "Source: ggplot2::economics" sits bottom-left.
```

**Difficulty:** Intermediate

[HINTS]
Serif type makes a chart read like reporting rather than an advertisement, and an NYT title leans on size, not bold weight.
On ex_6_1, set text = element_text(family = "serif") and plot.title to face = "plain" in theme(), plus a caption in labs().

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- ex_6_1 +
  labs(caption = "Source: ggplot2::economics. Monthly thousands of persons, 1967-2015.") +
  theme(text = element_text(family = "serif"),
        plot.title = element_text(face = "plain", size = 16, hjust = 0),
        plot.caption = element_text(face = "italic", color = "#777",
                                    hjust = 0, size = 8))
ex_6_2
#> Same chart, serif typography, NYT caption block.
```

**Explanation:** Serif typography aligns the chart with NYT body text: in a printed paper, charts in sans-serif feel like advertisements, charts in serif feel like reporting. Setting `face = "plain"` on the title (rather than bold) is part of the same instinct: NYT headlines lean on size and weight only when shouting; default charts whisper.

</details>

### Exercise 6.3: Replace the legend with NYT-style direct labels

**Task:** Take a multi-line plot of `economics_long` filtered to `pce`, `psavert`, `unemploy` (each normalized), and replace the legend with direct labels at the right end of each line in matching colors. Use the NYT serif theme from 6.2. Save the ggplot to `ex_6_3`.

**Expected result:**

```
Three normalized lines (pce, psavert, unemploy) on a white
serif theme. Each line ends with its name labeled directly
in matching color at the right end, no legend block.
```

**Difficulty:** Intermediate

[HINTS]
Replacing a legend with end labels means feeding a label layer just the final point of each series.
Normalize each series, take date == max(date) per group, add geom_text() on that subset, and drop the legend with guides(color = "none").

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dat <- economics_long |>
  filter(variable %in% c("pce", "psavert", "unemploy")) |>
  group_by(variable) |>
  mutate(v = (value - min(value)) / (max(value) - min(value))) |>
  ungroup()

end_dat <- dat |> group_by(variable) |> filter(date == max(date)) |> ungroup()

ex_6_3 <- ggplot(dat, aes(x = date, y = v, color = variable)) +
  geom_line(linewidth = 0.7) +
  geom_text(data = end_dat,
            aes(label = variable),
            hjust = -0.1, fontface = "italic", show.legend = FALSE) +
  scale_color_manual(values = c(pce = "#003f5c", psavert = "#7a5195", unemploy = "#bc5090")) +
  expand_limits(x = max(end_dat$date) + 365 * 3) +
  guides(color = "none") +
  labs(title = "Three US macro series, normalized", x = NULL, y = NULL) +
  theme_minimal(base_family = "serif") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "plain", size = 16))
ex_6_3
#> Three lines with end-labels, no legend.
```

**Explanation:** Direct labels cut a step out of reading a multi-series chart: instead of glance-line-glance-legend-glance-back, the reader's eye lands on the line tip and reads. NYT does this almost universally for time-series with 3-5 lines; beyond five, a legend becomes unavoidable. Italic labels echo the serif body text below the chart.

</details>

### Exercise 6.4: NYT-style highlight chart with one bold line, rest faded

**Task:** Take an `mpg` scatter of `hwy` versus `displ` colored by `class`, then highlight only `suv` rows in a bold dark color and render every other class in a faded light gray. Add a centered label "SUVs cluster at high displacement, low MPG". Save the ggplot to `ex_6_4`.

**Expected result:**

```
A mpg scatter where SUV points stand out in dark blue
(#003f5c) and all other class points are pale gray (#cccccc).
An italic text label above the SUV cluster names the pattern.
```

**Difficulty:** Advanced

[HINTS]
A highlight chart splits the data into figure and ground, so you need a flag separating the highlighted subset from everything else.
Add an is_suv flag, map it to both color and alpha, set scale_color_manual() and scale_alpha_manual() with TRUE/FALSE values, and add an annotate("text", ...) kicker.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_high <- mpg |> mutate(is_suv = class == "suv")

ex_6_4 <- ggplot(mpg_high, aes(x = displ, y = hwy, color = is_suv)) +
  geom_point(aes(alpha = is_suv), size = 2.5) +
  scale_color_manual(values = c(`TRUE` = "#003f5c", `FALSE` = "#cccccc")) +
  scale_alpha_manual(values = c(`TRUE` = 1, `FALSE` = 0.5)) +
  annotate("text", x = 6.5, y = 28,
           label = "SUVs cluster at high\ndisplacement, low MPG",
           hjust = 1, fontface = "italic", size = 3.5, color = "#003f5c") +
  labs(title = "SUVs stand out in fuel-economy data",
       x = "Displacement (l)", y = "Highway MPG") +
  guides(color = "none", alpha = "none") +
  theme_minimal(base_family = "serif") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "plain", size = 16))
ex_6_4
#> Highlight chart: SUVs dark, rest faded gray.
```

**Explanation:** Highlight charts answer one question loudly: "where does this subset sit relative to the rest?" Two scales do the work: `scale_color_manual` for the figure-vs-ground split, `scale_alpha_manual` to push the background even further back. The inline italic label is the rhetorical kicker: it tells the reader what they are supposed to notice.

</details>

### Exercise 6.5: NYT small-multiples sleep-deprivation panels per subject

**Task:** Build a small-multiples grid from `sleepstudy`, one panel per `Subject`, each showing the per-subject regression line of `Reaction` versus `Days` in dark navy on a minimal serif theme. Strip backgrounds white, faceted with `facet_wrap`. Save the ggplot to `ex_6_5`.

**Expected result:**

```
A 6x3 grid (or similar) of mini line plots, one per subject,
each showing reaction time rising with days of sleep restriction
plus a faint regression line. Serif text, subtle gridlines.
```

**Difficulty:** Advanced

[HINTS]
When slopes vary across subjects, one panel per subject preserves each slope better than an overplotted multi-line chart.
Add facet_wrap(~ Subject) and geom_smooth(method = "lm", se = FALSE) so each panel fits its own regression.

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- ggplot(sleepstudy, aes(x = Days, y = Reaction)) +
  geom_point(size = 0.8, color = "#003f5c") +
  geom_smooth(method = "lm", se = FALSE, color = "#003f5c", linewidth = 0.5) +
  facet_wrap(~ Subject, ncol = 6) +
  labs(title = "Sleep restriction: each subject's reaction-time slope",
       x = "Days of sleep restriction", y = "Reaction time (ms)") +
  theme_minimal(base_family = "serif") +
  theme(panel.grid.minor = element_blank(),
        strip.background = element_rect(fill = "white", color = NA),
        strip.text = element_text(face = "italic", size = 8),
        plot.title = element_text(face = "plain", size = 14))
ex_6_5
#> Per-subject small-multiples sleep-deprivation grid.
```

**Explanation:** Small multiples beat a single multi-line chart when slopes vary: each panel preserves the subject-level slope cleanly, whereas an 18-line overplot becomes unreadable. `method = "lm"` fits a per-panel linear regression because `facet_wrap` partitions the data before `geom_smooth` runs. Italic strip labels feel like editor captions rather than chart labels.

</details>

### Exercise 6.6: Add NYT overlay annotations with tooltip-like text boxes

**Task:** Take `ex_6_1` and add a second annotation: a light-gray rectangle behind italic text noting "Unemployment fell below 4% in 2018, the lowest in 49 years" at the right of the plot. Use `annotate("rect", ...)` and `annotate("text", ...)`. Save to `ex_6_6`.

**Expected result:**

```
Same unemployment chart, now with a second annotation: a pale
gray box near the late-2010s portion of the line containing
italic text about the 2018 low. The first 2009 annotation stays.
```

**Difficulty:** Intermediate

[HINTS]
A pale backing rectangle keeps overlay text readable where it crosses gridlines or the data line.
On ex_6_1, add annotate("rect", ...) first then annotate("text", ...) on top, both in date and count units.

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- ex_6_1 +
  annotate("rect",
           xmin = as.Date("2014-01-01"), xmax = as.Date("2018-06-01"),
           ymin = 9500, ymax = 10500,
           fill = "#eeeeee", color = NA, alpha = 0.7) +
  annotate("text",
           x = as.Date("2016-04-01"), y = 10000,
           label = "Lowest jobless rate\nin nearly 50 years",
           fontface = "italic", color = "#333", size = 3, hjust = 0.5)
ex_6_6
#> Same chart with a second tooltip-style annotation.
```

**Explanation:** Tooltip-style overlay annotations are an NYT staple for online charts: a pale rectangle backs the text so it stays readable when it crosses a gridline or the line itself. The trick is layering rect first (so it sits behind text) and text second, both with `annotate()` so they live outside any data mapping.

</details>

## Section 7. End-to-end visualization projects (5 multi-step problems)

### Exercise 7.1: Build a complete air-quality dashboard from airquality

**Task:** Build a 4-panel dashboard from `airquality` showing: (1) ozone time series over `Day`, (2) ozone-temperature scatter, (3) ozone density histogram, (4) monthly mean ozone bar chart. Combine the panels via `facet_wrap(~ panel, scales = "free")` after stacking. Save the final ggplot to `ex_7_1`.

**Expected result:**

```
A 2x2 dashboard with four panels:
(a) ozone vs day line
(b) ozone vs temp scatter
(c) ozone histogram
(d) monthly mean ozone bar
Each on its own free scale, monochrome blue theme, bold title.
```

**Difficulty:** Advanced

[HINTS]
A dashboard packs trends, associations, distributions, and aggregates onto one screen, each panel needing its own scales.
Tag each dataset with a panel column, bind_rows() them, and facet_wrap(~ panel, scales = "free", ncol = 2) over line, point, histogram, and column geoms.

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- airquality |> filter(!is.na(Ozone))

monthly <- aq |> group_by(Month) |>
  summarise(mean_o = mean(Ozone), .groups = "drop")

panels <- bind_rows(
  transform(aq,      panel = "(a) Ozone over days",  x = Day,   y = Ozone),
  transform(aq,      panel = "(b) Ozone vs Temp",    x = Temp,  y = Ozone),
  transform(aq,      panel = "(c) Ozone density",    x = Ozone, y = 0),
  transform(monthly, panel = "(d) Monthly mean ozone", x = Month, y = mean_o)
)

ex_7_1 <- ggplot() +
  geom_line(data = subset(panels, panel == "(a) Ozone over days"),
            aes(x = x, y = y), color = "#1d4e89") +
  geom_point(data = subset(panels, panel == "(b) Ozone vs Temp"),
             aes(x = x, y = y), color = "#1d4e89", alpha = 0.6) +
  geom_histogram(data = subset(panels, panel == "(c) Ozone density"),
                 aes(x = x), bins = 20, fill = "#1d4e89") +
  geom_col(data = subset(panels, panel == "(d) Monthly mean ozone"),
           aes(x = factor(x), y = y), fill = "#1d4e89") +
  facet_wrap(~ panel, scales = "free", ncol = 2) +
  labs(title = "Air-quality dashboard, May-September 1973",
       x = NULL, y = NULL) +
  theme_minimal(base_family = "sans") +
  theme(strip.text = element_text(face = "bold"),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_7_1
#> 2x2 dashboard, monochrome navy on white.
```

**Explanation:** A four-panel dashboard reproduces what an EDA notebook would show on one screen: trends over time, pairwise associations, marginal distributions, group aggregates. Stacking all four datasets with a `panel` column lets one `facet_wrap` produce the layout without an extra package. Free scales are essential because each panel has different x and y units.

</details>

### Exercise 7.2: Reproduce a Pew Research-style report figure

**Task:** Build a 2-panel Pew-style figure from `txhousing`: top panel is total sales across all cities over time, bottom panel is median listings. Use Pew dark blue (`#0085a1`), small caps section headers, and a thin horizontal line separator between panels via faceting. Save the final ggplot to `ex_7_2`.

**Expected result:**

```
Two stacked panels: total sales (top), median listings (bottom),
both colored #0085a1. Bold caps panel headers, white background,
horizontal-only gridlines.
```

**Difficulty:** Advanced

[HINTS]
A stacked-panel report shows one finding per panel sharing the x-axis but needing separate y-scales.
Aggregate the two measures, stack with a panel column, draw geom_line(), and facet_wrap(~ panel, scales = "free_y", ncol = 1).

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
agg <- txhousing |>
  group_by(year, month) |>
  summarise(total_sales = sum(sales, na.rm = TRUE),
            median_listings = median(listings, na.rm = TRUE),
            .groups = "drop") |>
  mutate(date = as.Date(paste(year, month, "01", sep = "-")))

dat <- bind_rows(
  transform(agg, panel = "TOTAL SALES",     v = total_sales),
  transform(agg, panel = "MEDIAN LISTINGS", v = median_listings)
)

ex_7_2 <- ggplot(dat, aes(x = date, y = v)) +
  geom_line(color = "#0085a1", linewidth = 0.8) +
  facet_wrap(~ panel, scales = "free_y", ncol = 1) +
  scale_y_continuous(labels = comma) +
  labs(title = "Texas housing trends", x = NULL, y = NULL,
       caption = "Source: ggplot2::txhousing") +
  theme_minimal(base_family = "sans") +
  theme(strip.background = element_rect(fill = "#f5f5f5", color = NA),
        strip.text = element_text(face = "bold", color = "#333"),
        panel.grid.major.x = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"),
        plot.caption = element_text(hjust = 0, color = "#555", size = 8))
ex_7_2
#> Two stacked Pew-style panels.
```

**Explanation:** Stacked-panel reports are the workhorse of think-tank publications: one finding per panel, shared x-axis (year), separate y-scales for unit differences. `scales = "free_y"` is essential here, otherwise the panels would share a y-range that fits neither well. The all-caps strip labels echo Pew's section-header convention.

</details>

### Exercise 7.3: Static Gapminder-style bubble snapshot

**Task:** Build an inline tibble of 10 countries with `gdp_per_capita`, `life_expectancy`, `population`, and `continent`. Plot a bubble chart with `geom_point()`: x is log-scaled GDP, y is life expectancy, size is population, color is continent. Save the ggplot to `ex_7_3`.

**Expected result:**

```
10 country bubbles on a log10 GDP x-axis vs life expectancy
y-axis. Bubble size scales with population, color by continent
(Africa, Asia, Europe, Americas). White background, bold title.
```

**Difficulty:** Advanced

[HINTS]
A bubble chart encodes four variables per point, and GDP spanning orders of magnitude calls for a logarithmic axis.
Map size = population and color = continent in geom_point(), use scale_x_log10(), and bound bubble sizes with scale_size_continuous(range = ...).

```r title="Your turn"
countries <- tibble::tibble(
  country = c("USA","Brazil","Germany","UK","India","China","Nigeria","Japan","Norway","Kenya"),
  gdp_per_capita  = c(70000, 8900, 52000, 47000, 2400, 12500, 2100, 40000, 92000, 1800),
  life_expectancy = c(78.5, 76.8, 81.0, 81.3, 70.2, 78.2, 54.7, 84.6, 83.2, 66.7),
  population      = c(331e6, 213e6, 83e6, 67e6, 1390e6, 1410e6, 213e6, 125e6, 5.4e6, 54e6),
  continent       = c("Americas","Americas","Europe","Europe","Asia","Asia","Africa","Asia","Europe","Africa")
)
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
countries <- tibble::tibble(
  country = c("USA","Brazil","Germany","UK","India","China","Nigeria","Japan","Norway","Kenya"),
  gdp_per_capita  = c(70000, 8900, 52000, 47000, 2400, 12500, 2100, 40000, 92000, 1800),
  life_expectancy = c(78.5, 76.8, 81.0, 81.3, 70.2, 78.2, 54.7, 84.6, 83.2, 66.7),
  population      = c(331e6, 213e6, 83e6, 67e6, 1390e6, 1410e6, 213e6, 125e6, 5.4e6, 54e6),
  continent       = c("Americas","Americas","Europe","Europe","Asia","Asia","Africa","Asia","Europe","Africa")
)
ex_7_3 <- ggplot(countries,
                 aes(x = gdp_per_capita, y = life_expectancy,
                     size = population, color = continent)) +
  geom_point(alpha = 0.75) +
  geom_text(aes(label = country), color = "#333", size = 3,
            vjust = -1.6, show.legend = FALSE) +
  scale_x_log10(labels = dollar) +
  scale_size_continuous(range = c(2, 18), labels = comma) +
  scale_color_manual(values = c(Africa = "#E69F00", Americas = "#56B4E9",
                                Asia = "#009E73", Europe = "#0072B2")) +
  labs(title = "Wealth versus life expectancy",
       x = "GDP per capita (USD, log scale)", y = "Life expectancy (years)") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"))
ex_7_3
#> Gapminder-style static bubble snapshot.
```

**Explanation:** The Gapminder format encodes four variables per point: position (x, y), size, and color. A log10 x-axis is non-negotiable when GDP per capita spans two orders of magnitude. `scale_size_continuous(range = c(2, 18))` controls the smallest and largest bubbles so a small country is still visible and a large one does not swallow the panel.

</details>

### Exercise 7.4: Cases-vs-deaths comparison chart with dual scale

**Task:** Build an inline 60-day tibble with `date`, `cases`, `deaths`. Plot cases as a faded area and deaths as a bold dark line, with a secondary y-axis on the right scaled appropriately so both series fit. Save the ggplot to `ex_7_4`.

**Expected result:**

```
A 60-day chart: a pale red area showing daily cases (left axis),
and a dark navy line showing deaths (right axis, scaled).
Bold title naming the comparison.
```

**Difficulty:** Advanced

[HINTS]
Two series on very different scales can share a panel if one is rescaled to the other's range and the second axis undoes the transform.
Compute a scale_factor, plot deaths times that factor, and add the right axis with sec_axis(~ . / scale_factor) inside scale_y_continuous().

```r title="Your turn"
set.seed(7)
epi <- tibble::tibble(
  date = seq.Date(as.Date("2024-01-01"), by = "day", length.out = 60),
  cases  = round(abs(800 + cumsum(rnorm(60, 0, 80)))),
  deaths = round(abs(20 + cumsum(rnorm(60, 0, 4))))
)
ex_7_4 <- # your code here
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
epi <- tibble::tibble(
  date = seq.Date(as.Date("2024-01-01"), by = "day", length.out = 60),
  cases  = round(abs(800 + cumsum(rnorm(60, 0, 80)))),
  deaths = round(abs(20 + cumsum(rnorm(60, 0, 4))))
)
scale_factor <- max(epi$cases) / max(epi$deaths)

ex_7_4 <- ggplot(epi, aes(x = date)) +
  geom_area(aes(y = cases), fill = "#fdbcb4", alpha = 0.85) +
  geom_line(aes(y = deaths * scale_factor), color = "#003f5c", linewidth = 1) +
  scale_y_continuous(name = "Daily cases",
                     sec.axis = sec_axis(~ . / scale_factor, name = "Daily deaths")) +
  labs(title = "Daily cases and deaths over a 60-day window",
       x = NULL, caption = "Pale red = cases (left). Navy line = deaths (right).") +
  theme_minimal(base_family = "sans") +
  theme(panel.grid.minor = element_blank(),
        plot.title = element_text(face = "bold"),
        plot.caption = element_text(hjust = 0, color = "#555"))
ex_7_4
#> Pale-red cases area with dark deaths overlay.
```

**Explanation:** Dual y-axes are sometimes the right tool when two series share an x-axis but live on different scales: cases in thousands, deaths in tens. The `sec_axis(~ . / scale_factor)` argument supplies the inverse transform so the right axis labels read in death units even though the line is drawn in case units. Use sparingly: dual axes can mislead when the scaling implies a relationship that does not exist.

</details>

### Exercise 7.5: Reproduce an NHK-style monochrome news graphic

**Task:** Build an NHK-style monochrome bar chart of `mpg` mean highway MPG by `class`, with a dark navy header bar above the panel containing a white bold title, no panel border, and one accent color (`#cf4647`) for the longest bar only. Save the final ggplot to `ex_7_5`.

**Expected result:**

```
Horizontal bars of mean hwy MPG by class. All bars dark gray
except the longest one, which is colored #cf4647 as an accent.
A solid dark-navy header bar with white bold title sits above.
```

**Difficulty:** Advanced

[HINTS]
The header-bar effect comes from coloring the plot-level background dark while the panel itself stays white, so the title picks up the dark fill.
Flag the longest bar, color it via scale_fill_manual() with TRUE/FALSE, set plot.background to navy and panel.background to white, and push the title with plot.title.position = "plot".

```r title="Your turn"
ex_7_5 <- # your code here
ex_7_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
agg <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy), .groups = "drop") |>
  mutate(is_top = mean_hwy == max(mean_hwy))

ex_7_5 <- ggplot(agg, aes(x = mean_hwy, y = reorder(class, mean_hwy), fill = is_top)) +
  geom_col() +
  geom_text(aes(label = round(mean_hwy, 1)),
            hjust = -0.2, size = 3.2, color = "#222") +
  scale_fill_manual(values = c(`TRUE` = "#cf4647", `FALSE` = "#444444")) +
  expand_limits(x = max(agg$mean_hwy) * 1.1) +
  labs(title = "Mean highway MPG by vehicle class",
       x = NULL, y = NULL) +
  theme_minimal(base_family = "sans") +
  theme(legend.position = "none",
        panel.grid.major.y = element_blank(),
        panel.grid.minor = element_blank(),
        plot.title = element_text(color = "white", face = "bold", size = 14,
                                  hjust = 0,
                                  margin = margin(8, 8, 8, 8)),
        plot.title.position = "plot",
        plot.background = element_rect(fill = "white", color = NA),
        plot.margin = margin(0, 10, 10, 10),
        panel.background = element_rect(fill = "white", color = NA)) +
  theme(plot.title = element_text(color = "white", face = "bold",
                                  margin = margin(10, 0, 10, 12)),
        plot.title.position = "plot") +
  theme(plot.background = element_rect(fill = "#1a2a44", color = NA),
        panel.background = element_rect(fill = "white", color = NA))
ex_7_5
#> NHK-style: white panel with accent bar inside dark-navy frame.
```

**Explanation:** The header-bar look is built by setting `plot.background` to the dark navy and letting `panel.background` stay white: the title sits on the plot-level area outside the panel, so it picks up the navy fill while the panel itself reads as a white card. `plot.title.position = "plot"` is the modern way to push the title flush to the plot edge rather than the panel edge.

</details>

## What to do next

- Practice the underlying chart types one at a time in [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html), which drills `geom_point`, `geom_col`, faceting, and theme tuning in isolation.
- Lock in the data prep that feeds these charts with [dplyr Exercises in R](dplyr-Exercises-in-R.html), especially `group_by`, `summarise`, `pivot_longer`, and `reorder`.
- Master color and theme reuse with the patterns in [Publication-Quality Figures in R](Publication-Quality-Figures-in-R.html), the parent tutorial.
- For visualization on real data instead of styled reproductions, try [Data Visualization Exercises in R](Data-Visualization-Exercises-in-R.html), which focuses on choosing the right chart type for the question.
