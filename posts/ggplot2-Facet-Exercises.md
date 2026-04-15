---
title: "ggplot2 Facet Exercises: 8 facet_wrap() & facet_grid() Practice Problems — Solved Step-by-Step"
slug: "ggplot2-Facet-Exercises"
description: "Practice ggplot2 faceting — 8 facet_wrap() and facet_grid() exercises with worked solutions. Covers layout control, free scales, custom labels, background data, and margins."
keywords: "ggplot2 facet exercises, facet_wrap exercises, facet_grid exercises, ggplot2 practice problems, facet_wrap practice R, facet_grid practice R, ggplot2 multi-panel exercises, ggplot2 faceting practice"
auto_link_terms: "ggplot2 facet exercises|facet_wrap exercises|facet_grid exercises|ggplot2 faceting practice|facet exercises R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "E3.5"
post_type: "EX"
sidebar_title: "ggplot2 Facets (8 problems)"
fr_parent: "ggplot2-Facets.html"
---

# ggplot2 Facet Exercises: 8 facet_wrap() & facet_grid() Practice Problems — Solved Step-by-Step

<p class="lead">Faceting splits one busy chart into a panel grid that makes group comparisons effortless. These 8 exercises drill every facet skill — from basic <code>facet_wrap()</code> through <code>facet_grid()</code> margins — with runnable starter code, expected output, and step-by-step solutions.</p>

## What Do Facets Do and When Do You Use Them?

Facets split a single plot into multiple panels — one per group — so patterns that hide behind overlapping colours become obvious. `facet_wrap()` handles one grouping variable and wraps panels into a flexible grid. `facet_grid()` maps two variables into a strict row-by-column matrix. Let's see both in action before you start the exercises.

```r
library(ggplot2)
library(dplyr)

# facet_wrap: one variable, flexible layout
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  facet_wrap(~class) +
  labs(title = "Highway MPG vs Engine Size by Vehicle Class",
       x = "Engine Displacement (L)", y = "Highway MPG") +
  theme_minimal()
#> 7 panels — one per vehicle class.
#> Compact/subcompact: small engines, high mpg.
#> SUVs/pickups: large engines, low mpg.
#> 2seater: large engine but decent highway efficiency.
```

Each class gets its own visual space. Without faceting, these seven groups would overlap into an unreadable cloud. Here's a quick reference for the functions you'll practice.

| Function | Purpose | Key Arguments |
|---|---|---|
| `facet_wrap(~var)` | One variable, flexible grid | `ncol`, `nrow`, `scales`, `dir`, `labeller` |
| `facet_grid(row ~ col)` | Two variables, strict matrix | `scales`, `space`, `margins`, `labeller` |
| `scales = "free"` | Independent axis range per panel | `"free_x"`, `"free_y"`, or `"free"` |
| `as_labeller(c(...))` | Custom strip labels | Named vector: data value → display text |
| `label_both` | Show variable name + value | Strips read `"cyl: 4"` instead of `"4"` |
| `margins = TRUE` | Add summary panels | Like "Total" rows in a pivot table |

[KEY INSIGHT]
**Faceting reveals patterns that colour-coding hides.** When groups overlap, colours blur. Panels give each group visual separation, making slopes, clusters, and outliers jump out instantly.

**Try it:** Create a boxplot of `hwy` grouped by `drv` (drive type), then facet it by `drv` as well. Which drive type has the highest median highway MPG?

```r
# Try it: faceted boxplot by drive type
ggplot(mpg, aes(x = drv, y = hwy)) +
  geom_boxplot() +
  # your code here: add facet_wrap(~drv)
  theme_minimal()
#> Expected: 3 panels, one boxplot each — front-wheel has highest median
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_boxplot(show.legend = FALSE) +
  facet_wrap(~drv) +
  labs(title = "Highway MPG by Drive Type", x = "Drive Type", y = "Highway MPG") +
  theme_minimal()
#> Front-wheel (f) has the highest median at ~28 mpg.
#> Rear-wheel (r) sits around 25, four-wheel (4) around 19.
```

**Explanation:** Faceting by the same variable you're grouping by separates each boxplot into its own panel. This is helpful when you want to add per-panel annotations or trend lines later.

</details>

## How Do You Create Basic Panels with facet_wrap()? (Exercises 1–2)

These first two exercises build your muscle memory for the most common faceting pattern: `facet_wrap()` with a single grouping variable. You'll split scatter plots and bar charts into readable multi-panel displays.

### Exercise 1: Scatter Plot Faceted by Cylinder Count

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y), faceted by `cyl` (number of cylinders). Add the title "Highway MPG vs Engine Size by Cylinders" and label axes "Engine Displacement (L)" and "Highway MPG". Colour all points `"coral"`.

```r
# Exercise 1: scatter faceted by cylinder count
ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here
  theme_minimal()
#> Expected: 4 panels (4, 5, 6, 8 cylinders)
#> 4-cyl cars cluster at small engines + high mpg
#> 8-cyl cars spread across large engines + low mpg
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "coral", alpha = 0.7) +
  facet_wrap(~cyl) +
  labs(
    title = "Highway MPG vs Engine Size by Cylinders",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal()
#> 4 panels: 4-cyl (top-left) has small engines, high mpg.
#> 5-cyl has just a handful of cars.
#> 6-cyl shows moderate engines, moderate efficiency.
#> 8-cyl covers the largest engines with the lowest mpg.
```

**Explanation:** `facet_wrap(~cyl)` creates one panel per unique value in the `cyl` column. ggplot2 picks a sensible grid layout automatically (2 rows x 2 columns for 4 panels).

</details>

### Exercise 2: Faceted Bar Chart by Drive Type

**Dataset:** `mpg`

**Task:** Count the number of vehicles per `class`, then create a faceted bar chart split by `drv` (drive type). Use `coord_flip()` for horizontal bars and `scales = "free_y"` so each panel shows only its manufacturers.

```r
# Exercise 2: bar chart faceted by drive type
# Hint: count(class, drv), then ggplot + geom_col + facet_wrap + coord_flip
my_counts <- mpg |>
  count(class, drv)

ggplot(my_counts, aes(x = reorder(class, n), y = n)) +
  # your code here
  theme_minimal()
#> Expected: 3 panels (4, f, r), horizontal bars sorted by count
#> Front-wheel (f) has the most classes represented
```

<details>
<summary>Click to reveal solution</summary>

```r
my_counts <- mpg |>
  count(class, drv)

ggplot(my_counts, aes(x = reorder(class, n), y = n)) +
  geom_col(fill = "steelblue", alpha = 0.8) +
  facet_wrap(~drv, scales = "free_y") +
  coord_flip() +
  labs(
    title = "Vehicle Count by Class and Drive Type",
    x = "",
    y = "Number of Vehicles"
  ) +
  theme_minimal()
#> Three panels: f (front-wheel) has most variety — compact, midsize lead.
#> 4 (four-wheel) is dominated by SUVs.
#> r (rear-wheel) has 2seaters and subcompacts.
```

**Explanation:** `scales = "free_y"` lets each panel show only the classes that exist in that drive type (since `coord_flip()` swaps axes, `"free_y"` controls the class-name axis). `reorder(class, n)` sorts bars by count within each panel.

</details>

[TIP]
**Use coord_flip() for bar charts with long labels.** Horizontal bars avoid the angled or overlapping text that plagues vertical bar charts with many categories.

**Try it:** Facet the `diamonds` dataset by `cut`, showing a scatter of `carat` (x) vs `price` (y) with `alpha = 0.1`. Which cut has the widest carat range?

```r
# Try it: diamonds faceted by cut
set.seed(42)
ex_dia <- diamonds |> sample_n(3000)
ggplot(ex_dia, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1) +
  # your code here
  theme_minimal()
#> Expected: 5 panels (Fair, Good, Very Good, Premium, Ideal)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
ex_dia <- diamonds |> sample_n(3000)
ggplot(ex_dia, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, color = "steelblue") +
  facet_wrap(~cut) +
  labs(title = "Price vs Carat by Cut Quality", x = "Carat", y = "Price ($)") +
  theme_minimal()
#> Fair cut shows the widest carat range (up to ~5 carats).
#> Ideal cut clusters at smaller carats with steep price growth.
```

**Explanation:** `alpha = 0.1` prevents overplotting in dense datasets. Fair diamonds tend to be larger (higher carat) but cheaper per carat, while Ideal diamonds are smaller but command higher prices.

</details>

## How Do You Control Layout and Orientation? (Exercises 3–4)

Layout arguments — `ncol`, `nrow`, and `dir` — give you precise control over how panels arrange. `facet_grid()` goes further, mapping two variables into a fixed row-by-column matrix.

### Exercise 3: Force a Custom Layout with ncol and dir

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y), faceted by `class` (7 levels). Force a 2-column layout with vertical wrapping (`dir = "v"`). Add the title "7 Classes in 2 Columns (vertical fill)".

```r
# Exercise 3: custom layout
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "darkgreen", alpha = 0.7) +
  # your code here: facet_wrap with ncol=2, dir="v"
  theme_minimal()
#> Expected: 2 columns, 4 rows, panels fill top-to-bottom
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "darkgreen", alpha = 0.7) +
  facet_wrap(~class, ncol = 2, dir = "v") +
  labs(
    title = "7 Classes in 2 Columns (vertical fill)",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal()
#> Column 1 (top-to-bottom): 2seater, compact, midsize, minivan.
#> Column 2: pickup, subcompact, suv.
#> Vertical fill puts alphabetically adjacent classes in the same column.
```

**Explanation:** `dir = "v"` fills panels top-to-bottom within each column, then moves to the next column — like reading a newspaper. The default `dir = "h"` fills left-to-right across rows. Use `"v"` when column proximity matters more than row proximity.

</details>

### Exercise 4: Two-Variable Matrix with facet_grid()

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y). Use `facet_grid(drv ~ cyl)` to create a drive-type-by-cylinder matrix. Add a linear trend line (`geom_smooth(method = "lm", se = FALSE)`) coloured `"tomato"` to each panel.

```r
# Exercise 4: facet_grid matrix with trend lines
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  # your code here: geom_smooth + facet_grid(drv ~ cyl)
  theme_minimal()
#> Expected: 3 rows (4, f, r) x 4 columns (4, 5, 6, 8)
#> Some cells empty (no rear-wheel 4-cylinder cars)
#> Trend lines show per-cell relationships
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm", se = FALSE, color = "tomato", linewidth = 0.8) +
  facet_grid(drv ~ cyl) +
  labs(
    title = "Highway MPG: Drive Type × Cylinders",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal()
#> 12-cell matrix. Empty cells: no 5-cyl four-wheel or rear-wheel cars.
#> Row "f" (front-wheel): 4-cyl and 6-cyl show clear negative slopes.
#> Row "4" (four-wheel): 6-cyl and 8-cyl panels have enough data for trends.
#> Trend lines only appear in cells with 2+ data points.
```

**Explanation:** `facet_grid(drv ~ cyl)` places drive types on rows and cylinder counts on columns. Every combination gets a cell — even empty ones. This fixed matrix structure lets you read across a row (compare cylinders within a drive type) or down a column (compare drive types within a cylinder count).

</details>

[WARNING]
**Empty cells in facet_grid() are expected, not errors.** They tell you that combination doesn't exist in the data. Don't filter them out — the gap itself is informative (e.g., no rear-wheel 4-cylinder vehicles in this dataset).

**Try it:** Create a single-row horizontal strip with `facet_wrap(~drv, nrow = 1)` showing `displ` vs `hwy`. When does a filmstrip layout work well?

```r
# Try it: single-row strip
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.7) +
  # your code here
  theme_minimal()
#> Expected: 3 narrow panels in one horizontal row
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "purple", alpha = 0.7) +
  facet_wrap(~drv, nrow = 1) +
  labs(title = "Drive Types in a Filmstrip Layout") +
  theme_minimal()
#> 3 panels side by side. Works well with few groups (2-4)
#> when you want to compare vertical patterns (y-axis) at a glance.
```

**Explanation:** `nrow = 1` forces all panels into one row. This filmstrip layout works best with 2-4 panels. With more, individual panels get too narrow to read.

</details>

## When Should You Free the Scales? (Exercise 5)

Fixed scales (the default) make cross-panel comparison easy — the same position means the same value everywhere. But when groups have wildly different ranges, some panels get squashed. The `scales` argument controls this trade-off.

### Exercise 5: Free Scales for Economic Indicators

**Dataset:** `economics_long`

**Task:** Create a line chart of `date` (x) vs `value` (y), faceted by `variable`. Stack the panels vertically (`ncol = 1`) with `scales = "free_y"`. Add custom strip labels: "pce" → "Personal Consumption", "pop" → "Population", "psavert" → "Savings Rate (%)", "uempmed" → "Median Unemployment (wks)", "unemploy" → "Total Unemployed".

```r
# Exercise 5: free scales + custom labels for economic data
# Hint: as_labeller for strip labels, facet_wrap with ncol=1 and scales="free_y"

my_econ_labels <- as_labeller(c(
  # your label mapping here
))

ggplot(economics_long, aes(x = date, y = value)) +
  geom_line(color = "steelblue") +
  # your code here
  theme_minimal()
#> Expected: 5 stacked panels, each with its own y-range
#> Savings Rate would be invisible without free_y
```

<details>
<summary>Click to reveal solution</summary>

```r
my_econ_labels <- as_labeller(c(
  "pce" = "Personal Consumption",
  "pop" = "Population",
  "psavert" = "Savings Rate (%)",
  "uempmed" = "Median Unemployment (wks)",
  "unemploy" = "Total Unemployed"
))

ggplot(economics_long, aes(x = date, y = value)) +
  geom_line(color = "steelblue", linewidth = 0.5) +
  facet_wrap(~variable, ncol = 1, scales = "free_y",
             labeller = my_econ_labels) +
  labs(
    title = "US Economic Indicators (1967–2015)",
    x = "", y = ""
  ) +
  theme_minimal()
#> 5 stacked panels with descriptive labels.
#> Personal Consumption rises steadily to ~12,000.
#> Savings Rate (0-17%) is now fully visible — impossible with fixed scales.
#> Unemployment spikes during the 2008 recession.
```

**Explanation:** `scales = "free_y"` gives each panel its own y-axis range. Without it, Savings Rate (0–17%) would be an invisible flat line next to Personal Consumption (0–12,000). `ncol = 1` stacks panels vertically — the natural layout for time series where you want aligned x-axes.

</details>

[NOTE]
**Free scales prevent cross-panel value comparison.** A bar at the same height means different values in different panels. Use free scales when ranges genuinely differ (like dollars vs percentages). Keep fixed scales when same-position comparison is the point.

**Try it:** Plot histograms of `hwy` from `mpg`, faceted by `drv`, with `scales = "free"`. Then re-run with `scales = "fixed"`. Which makes it easier to compare distributions?

```r
# Try it: free vs fixed histogram comparison
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(bins = 15, fill = "tomato", alpha = 0.7) +
  facet_wrap(~drv, scales = "free") +
  labs(title = "Free scales") +
  theme_minimal()
#> Expected: each panel zooms to fit its own data
#> Rear-wheel shape visible but counts not comparable
```

<details>
<summary>Click to reveal solution</summary>

```r
# Free scales
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(bins = 15, fill = "tomato", alpha = 0.7) +
  facet_wrap(~drv, scales = "free") +
  labs(title = "Free Scales — shape visible, counts not comparable") +
  theme_minimal()
#> Each panel fills its space. Rear-wheel shape is clear.

# Fixed scales (default)
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(bins = 15, fill = "steelblue", alpha = 0.7) +
  facet_wrap(~drv, scales = "fixed") +
  labs(title = "Fixed Scales — counts comparable, rear-wheel squashed") +
  theme_minimal()
#> Front-wheel dominates (tallest bars). Rear-wheel bars are tiny.
```

**Explanation:** Fixed scales make counts directly comparable (same bar height = same count). Free scales reveal within-group distribution shapes. Choose based on your story: are you comparing group sizes or group patterns?

</details>

## How Do You Customize Strip Labels? (Exercise 6)

Strip labels are the grey text bars above each panel. By default, they show raw data values — often cryptic abbreviations that force your audience to guess. Custom labellers and theme styling make panels publication-ready.

### Exercise 6: Custom Labels + Styled Strips

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y), faceted by `cyl`. Use `as_labeller()` to rename strips: "4" → "4 Cylinders", "5" → "5 Cylinders", "6" → "6 Cylinders", "8" → "8 Cylinders". Style strip text as bold white (`size = 11`) on a `"#2c3e50"` (dark blue) background. Add `panel.spacing = unit(1, "lines")` for breathing room.

```r
# Exercise 6: custom labels + styled strips
my_cyl_labels <- as_labeller(c(
  # your code here
))

ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  facet_wrap(~cyl, labeller = my_cyl_labels) +
  theme_minimal() +
  theme(
    # your strip styling here
  ) +
  labs(title = "Highway MPG by Cylinder Count", x = "Engine Displacement (L)", y = "Highway MPG")
#> Expected: 4 panels with dark blue strip bars and white bold text
```

<details>
<summary>Click to reveal solution</summary>

```r
my_cyl_labels <- as_labeller(c(
  "4" = "4 Cylinders",
  "5" = "5 Cylinders",
  "6" = "6 Cylinders",
  "8" = "8 Cylinders"
))

ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  facet_wrap(~cyl, labeller = my_cyl_labels) +
  labs(
    title = "Highway MPG by Cylinder Count",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal() +
  theme(
    strip.text = element_text(face = "bold", size = 11, color = "white"),
    strip.background = element_rect(fill = "#2c3e50", color = NA),
    panel.spacing = unit(1, "lines")
  )
#> 4 panels with bold white labels on dark blue strip backgrounds.
#> "4 Cylinders", "5 Cylinders", etc. — much clearer than bare numbers.
#> Panel spacing gives visual separation between panels.
```

**Explanation:** `as_labeller()` takes a named character vector: names are the raw data values, values are the display labels. `strip.text` controls the font, and `strip.background` controls the rectangle behind it. Always put `theme()` customizations after the base theme to override defaults.

</details>

[TIP]
**Always relabel strips for publication.** Raw values like "f", "4", or "suv" force readers to decode abbreviations. Spending 30 seconds on `as_labeller()` saves every future reader that mental overhead.

**Try it:** Use `label_both` as the labeller on a `facet_grid(drv ~ cyl)` plot. How does the output differ from default labels?

```r
# Try it: label_both in facet_grid
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.6) +
  facet_grid(drv ~ cyl, labeller = label_both) +
  # your code here
  theme_minimal()
#> Expected: strips read "drv: 4", "cyl: 6" etc.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.6) +
  facet_grid(drv ~ cyl, labeller = label_both) +
  labs(title = "facet_grid with label_both") +
  theme_minimal()
#> Row strips: "drv: 4", "drv: f", "drv: r"
#> Column strips: "cyl: 4", "cyl: 5", "cyl: 6", "cyl: 8"
#> Both variable name and value shown — no ambiguity.
```

**Explanation:** `label_both` adds the variable name before each value. It's a quick way to make facet_grid panels self-documenting without writing a custom labeller.

</details>

## How Do You Layer Background Data and References? (Exercises 7–8)

The most powerful faceting techniques combine panels with layered geoms. Background data gives each panel context, reference lines provide benchmarks, and `facet_grid()` margins add summary panels.

### Exercise 7: Background Data Technique

**Dataset:** `mpg`

**Task:** Create a faceted scatter plot by `class`. Show all vehicles as a grey background layer (`color = "grey85"`, `alpha = 0.3`), the current class's vehicles in `"steelblue"`, and add a `geom_smooth(method = "lm")` trend line per panel. Remove the legend.

```r
# Exercise 7: background data technique
# Hint: create a background df without the faceting variable (select(-class))
# Layer: grey background points → coloured foreground points → trend line

my_mpg_bg <- mpg |> select(-class)

ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here: 3 layers + facet_wrap(~class)
  theme_minimal()
#> Expected: grey dots = all vehicles, blue dots = current class
#> Compact cars cluster top-left; SUVs sit bottom-right
```

<details>
<summary>Click to reveal solution</summary>

```r
my_mpg_bg <- mpg |> select(-class)

ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(data = my_mpg_bg, color = "grey85", alpha = 0.3, size = 1.5) +
  geom_point(color = "steelblue", alpha = 0.8, size = 2) +
  geom_smooth(method = "lm", se = FALSE, color = "black", linewidth = 0.8) +
  facet_wrap(~class) +
  labs(
    title = "Each Class Highlighted Against All Vehicles",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal() +
  theme(legend.position = "none")
#> Grey background shows all 234 vehicles in every panel.
#> Blue foreground highlights just the current class.
#> Compact cars sit in the top-left (small engine, high mpg).
#> SUVs cluster bottom-right. 2seaters stand out: large engines, decent mpg.
#> Trend lines show the slope differs by class.
```

**Explanation:** Removing the faceting variable (`class`) from the background data frame makes those grey points appear in every panel — ggplot2 doesn't know which panel they belong to, so it draws them in all panels. The coloured points and trend line use the original data, which still has `class`, so they only appear in their matching panel.

</details>

[KEY INSIGHT]
**Background data is the most powerful faceting technique for storytelling.** Each panel shows both the group's pattern and how it sits within the overall distribution. Readers instantly see whether a group is typical or an outlier.

### Exercise 8: facet_grid() Margins + Publication-Quality Output

**Dataset:** `mpg`

**Task:** Build a publication-quality faceted plot: `facet_grid(drv ~ cyl, margins = TRUE)`. Include:
- Scatter points (`alpha = 0.5`)
- Linear trend lines (`"tomato"`, no confidence band)
- Custom labels: drive types → "Front-Wheel", "Rear-Wheel", "4WD"; cylinders → "4 Cyl", "5 Cyl", "6 Cyl", "8 Cyl"
- Styled strips: bold text, `"grey95"` background
- Legend at bottom, title "Drive Type × Cylinders with Margins"

```r
# Exercise 8: facet_grid margins + polished output
# Hint: custom labeller for both row and column variables
#   Use labeller = labeller(drv = drv_map, cyl = cyl_map)

my_drv_map <- c("4" = "4WD", "f" = "Front-Wheel", "r" = "Rear-Wheel", "(all)" = "All Drives")
my_cyl_map <- c("4" = "4 Cyl", "5" = "5 Cyl", "6" = "6 Cyl", "8" = "8 Cyl", "(all)" = "All Cyl")

ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here
  theme_minimal()
#> Expected: 3x4 grid + margin row and column labelled "(all)"
#> Trend lines in every cell including margins
```

<details>
<summary>Click to reveal solution</summary>

```r
my_drv_map <- c("4" = "4WD", "f" = "Front-Wheel", "r" = "Rear-Wheel", "(all)" = "All Drives")
my_cyl_map <- c("4" = "4 Cyl", "5" = "5 Cyl", "6" = "6 Cyl", "8" = "8 Cyl", "(all)" = "All Cyl")

ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm", se = FALSE, color = "tomato", linewidth = 0.8) +
  facet_grid(drv ~ cyl, margins = TRUE,
             labeller = labeller(drv = my_drv_map, cyl = my_cyl_map)) +
  labs(
    title = "Drive Type x Cylinders with Margins",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal() +
  theme(
    strip.text = element_text(face = "bold", size = 10),
    strip.background = element_rect(fill = "grey95", color = NA),
    panel.spacing = unit(0.5, "lines")
  )
#> 5 rows x 5 columns (3 drive types + All Drives) x (4 cyl counts + All Cyl).
#> "All Drives" row: trend for each cylinder count across all drive types.
#> "All Cyl" column: trend for each drive type across all cylinders.
#> Bottom-right cell: overall dataset trend.
#> Margins act like "Total" rows/columns in a pivot table.
```

**Explanation:** `margins = TRUE` adds an "(all)" row and column that aggregate across each dimension. The `labeller()` function maps both row and column variables — note you must include `"(all)"` in both maps since the margin panels use that level. This creates a dashboard-style view where each group panel sits next to its summary.

</details>

**Try it:** Add a horizontal dashed reference line at `mean(mpg$hwy)` to a `facet_wrap(~class)` scatter plot. Does the line appear in every panel?

```r
# Try it: reference line across panels
my_mean_hwy <- mean(mpg$hwy)
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.7) +
  # your code here: geom_hline + facet_wrap
  theme_minimal()
#> Expected: dashed line at ~23.4 in every panel
```

<details>
<summary>Click to reveal solution</summary>

```r
my_mean_hwy <- mean(mpg$hwy)
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  geom_hline(yintercept = my_mean_hwy, linetype = "dashed",
             color = "tomato", linewidth = 0.6) +
  facet_wrap(~class) +
  labs(title = "Each Class vs Overall Mean Highway MPG") +
  theme_minimal()
#> The dashed red line at ~23.4 appears in every panel.
#> Compact and subcompact sit above the line.
#> Pickups and SUVs sit below.
```

**Explanation:** `geom_hline()` doesn't depend on the faceting variable, so it draws the same line in every panel. It's a simple way to add a constant benchmark for visual comparison across groups.

</details>

## Summary

Here's what each exercise tested and the key functions you practiced.

| Exercise | Concept | Key Functions |
|---|---|---|
| 1 | Basic facet_wrap | `facet_wrap(~var)` |
| 2 | Faceted bar chart + free scales | `facet_wrap(scales = "free_y")`, `coord_flip()` |
| 3 | Layout control | `ncol`, `dir = "v"` |
| 4 | Two-variable matrix | `facet_grid(row ~ col)`, `geom_smooth()` |
| 5 | Free scales + custom labels | `scales = "free_y"`, `as_labeller()` |
| 6 | Styled strips | `as_labeller()`, `theme(strip.text, strip.background)` |
| 7 | Background data technique | `select(-var)` for background, layered `geom_point()` |
| 8 | Margins + publication quality | `facet_grid(margins = TRUE)`, `labeller()` |

Key takeaways:

1. **Start with facet_wrap()** for single-variable faceting — it handles 80% of use cases
2. **Use facet_grid()** when the row-by-column matrix structure adds analytical value
3. **Free scales** reveal within-panel patterns; fixed scales enable cross-panel comparison
4. **Always relabel strips** — raw data values are cryptic to your audience
5. **Background data** is the most powerful storytelling technique for faceted plots
6. **Margins** in facet_grid() add "Total" panels like a pivot table

## References

1. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Chapter 16: Faceting. [Link](https://ggplot2-book.org/facet.html)
2. ggplot2 reference — facet_wrap() documentation. [Link](https://ggplot2.tidyverse.org/reference/facet_wrap.html)
3. ggplot2 reference — facet_grid() documentation. [Link](https://ggplot2.tidyverse.org/reference/facet_grid.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 2: Data Visualization. [Link](https://r4ds.hadley.nz/data-visualize)
5. Wilke, C. — *Fundamentals of Data Visualization*. Chapter 21: Multi-panel Figures. [Link](https://clauswilke.com/dataviz/multi-panel-figures.html)
6. R-Charts — Facets in ggplot2. [Link](https://r-charts.com/ggplot2/facets/)

## Continue Learning

- [ggplot2 Facets](ggplot2-Facets.html) — Full tutorial on facet_wrap() and facet_grid() with theory, examples, and visual guides
- [ggplot2 Customization Exercises](ggplot2-Customization-Exercises.html) — 10 theme and scale practice problems to polish your faceted plots
- [ggplot2 Geom Exercises](ggplot2-Geom-Exercises.html) — 12 geom practice problems covering scatter, bar, line, and more
