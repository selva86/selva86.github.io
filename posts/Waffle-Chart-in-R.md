---
title: "Waffle Chart in R: Display Proportions as a Grid of Squares"
slug: "Waffle-Chart-in-R"
description: "Create waffle charts in R with the waffle package and geom_waffle(). Learn to encode proportions as unit squares, customize colors, create icon arrays, and use facets for comparison."
keywords: "waffle chart R, geom_waffle R, R waffle plot ggplot2, square pie chart R, waffle package R, unit chart R"
auto_link_terms: "waffle chart in R|geom_waffle()|waffle plot R|square pie chart R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-12
post_type: "C"
fr_parent: ggplot2-Bar-Charts.html
sidebar_section: "Visualization"
sidebar_title: "Waffle Chart"
difficulty: "Intermediate"
---

# Waffle Chart in R: Display Proportions as a Grid of Squares

<p class="lead">A waffle chart (also called a square pie chart) displays proportions as a grid of unit squares, each square represents one unit or one percent. In R, the <code>waffle</code> package provides <code>geom_waffle()</code> as a ggplot2 layer.</p>

## Introduction

Pie charts and bar charts communicate proportions. But both have a readability limitation: the human eye struggles to compare areas (pie) or lengths (bar) precisely when differences are small.

A waffle chart sidesteps this by making proportions *countable*. If each square represents 1%, a 37% category has exactly 37 squares, readers can verify the proportion by counting. This makes waffle charts particularly effective for general audiences who need to grasp "about 1 in 3" or "more than half" at a glance.

The tradeoff: waffle charts don't work well for many categories (a 10x10 grid divided among 8 slices becomes a confusing patchwork). They shine for 2-4 categories with meaningful proportional differences.

The `waffle` package by Bob Rudis extends ggplot2 with `geom_waffle()`, fitting naturally into the ggplot2 grammar.

## How do you create a basic waffle chart in R?

`geom_waffle()` takes counts in the `values` aesthetic and fills by a categorical variable. It arranges squares in rows across a grid.

```r title="Basic vote-share waffle chart"
library(ggplot2)
library(waffle)

# Party vote shares (in whole number percentages)
vote_df <- data.frame(
  party = c("Party A", "Party B", "Party C", "Others"),
  pct   = c(42, 31, 18, 9)
)

# Basic waffle chart: 10 squares per row, total = 100 squares
p_basic <- ggplot(vote_df, aes(fill = party, values = pct)) +
  geom_waffle(
    n_rows  = 10,       # 10 rows × 10 columns = 100 squares
    size    = 0.3,      # gap between squares
    colour  = "white",  # border color
    flip    = TRUE      # fill top-to-bottom (more intuitive)
  ) +
  coord_equal() +       # keep squares square (not rectangles)
  labs(
    title = "Election Vote Share",
    fill  = "Party"
  ) +
  theme_void() +
  theme(legend.position = "right")

p_basic
```

With `n_rows = 10` and total votes summing to 100, each square represents exactly 1%. `coord_equal()` ensures squares don't get stretched into rectangles. `theme_void()` removes axis elements that are meaningless in a grid chart.

**Try it:** Change `n_rows = 10` to `n_rows = 5`, you now have a 5×20 grid instead of 10×10. The proportions are identical, but the shape changes. Which layout reads more intuitively?

## How do you make each square represent exactly 1%?

The classic waffle chart convention: a 10×10 grid where each of the 100 squares = 1%. This requires your values to sum to exactly 100. Use `make_proportional = TRUE` to let geom_waffle rescale automatically.

```r title="Use makeproportional for raw counts"
# 10x10 grid with make_proportional: values don't need to sum to 100
survey_df <- data.frame(
  response = c("Strongly Agree", "Agree", "Neutral", "Disagree"),
  count    = c(156, 234, 87, 48)   # raw counts, not percentages
)

p_prop <- ggplot(survey_df, aes(fill = response, values = count)) +
  geom_waffle(
    n_rows           = 10,
    size             = 0.35,
    colour           = "white",
    flip             = TRUE,
    make_proportional = TRUE   # automatically rescale to 100 squares
  ) +
  scale_fill_manual(
    values = c(
      "Strongly Agree" = "#1B5E20",
      "Agree"          = "#66BB6A",
      "Neutral"        = "#FFF9C4",
      "Disagree"       = "#E53935"
    )
  ) +
  coord_equal() +
  labs(
    title    = "Survey: Product Satisfaction",
    subtitle = "Each square = 1% of respondents",
    fill     = NULL
  ) +
  theme_void() +
  theme(
    plot.title    = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(color = "grey50", hjust = 0.5),
    legend.position = "bottom"
  )

p_prop
```

`make_proportional = TRUE` internally rescales the counts so they sum to 100 (or the total grid squares defined by `n_rows`). This lets you pass raw counts instead of pre-calculated percentages.

**Try it:** Add `na.rm = FALSE` inside `geom_waffle()` to see what happens when rounding causes the total to be slightly off from 100. Then remove it and see the chart fill cleanly.

## How do you compare groups with faceted waffle charts?

A single waffle chart shows one snapshot. Facets create multiple grids side by side, one per group, making comparison across time periods or categories intuitive.

```r title="Faceted waffle by year"
# Waffle facets: smartphone OS market share across 3 years
os_df <- data.frame(
  year = rep(c("2021", "2022", "2023"), each = 3),
  os   = rep(c("Android", "iOS", "Other"), times = 3),
  pct  = c(72, 27, 1,   # 2021
           73, 26, 1,   # 2022
           72, 27, 1)   # 2023
)

p_facet <- ggplot(os_df, aes(fill = os, values = pct)) +
  geom_waffle(
    n_rows = 10, size = 0.3, colour = "white", flip = TRUE
  ) +
  facet_wrap(~ year, nrow = 1) +
  scale_fill_manual(
    values = c("Android" = "#4CAF50", "iOS" = "#2196F3", "Other" = "#BDBDBD")
  ) +
  coord_equal() +
  labs(
    title = "Smartphone OS Market Share",
    fill  = NULL
  ) +
  theme_void() +
  theme(
    strip.text      = element_text(face = "bold", size = 12),
    legend.position = "bottom",
    plot.title      = element_text(face = "bold", hjust = 0.5)
  )

p_facet
```

Each year gets its own 10×10 grid. The reader can compare Android's green area vs iOS's blue area across years. The stability of the proportions becomes immediately obvious, barely any change year over year.

**Try it:** Change the `pct` values for 2023 to `c(68, 31, 1)` (iOS gaining share) and see how the visual change in the 2023 panel immediately communicates the shift.

## How do you use the base waffle() function for quick charts?

The `waffle` package also provides a standalone `waffle()` function (no ggplot2 required) for rapid creation.

```r title="Quick chart with waffle function"
# Quick waffle with the base waffle() function
# Values are raw counts; waffle() converts them to squares proportionally
quick_waffle <- c(
  "Renewable"    = 28,
  "Natural Gas"  = 34,
  "Nuclear"      = 18,
  "Coal"         = 20
)

waffle(
  quick_waffle,
  rows    = 5,             # 5 rows
  colors  = c("#66BB6A", "#FF7043", "#42A5F5", "#607D8B"),
  title   = "US Energy Production by Source (%)",
  xlab    = "1 square = 2%",
  size    = 0.5
)
```

The base `waffle()` function takes a named vector of values (not a data frame). It's quicker for exploratory work, but offers less styling flexibility than `geom_waffle()`.

**Try it:** Change `rows = 5` to `rows = 10`. What does `xlab = "1 square = 2%"` tell the reader when `rows = 5`? Calculate: total = 100 values / 50 squares = 2 per square. For `rows = 10` (100 squares total), each square would = 1%.

## Complete Example: Polished Waffle with Annotations

```r title="Polished waffle with annotations"
# Polished waffle: internet access by income group
access_df <- data.frame(
  group  = c("Has Access", "No Access"),
  pct    = c(63, 37)
)

p_final <- ggplot(access_df, aes(fill = group, values = pct)) +
  geom_waffle(
    n_rows  = 10,
    size    = 0.4,
    colour  = "white",
    flip    = TRUE
  ) +
  scale_fill_manual(
    values = c("Has Access" = "#1565C0", "No Access" = "#E0E0E0"),
    guide  = guide_legend(reverse = TRUE)
  ) +
  coord_equal() +
  annotate(
    "text", x = 5.5, y = 11.5,
    label    = "63% have internet access",
    fontface = "bold", size = 4.5, color = "#1565C0"
  ) +
  annotate(
    "text", x = 5.5, y = 12.3,
    label    = "37% do not",
    fontface = "bold", size = 4, color = "grey50"
  ) +
  labs(
    title    = "Internet Access: Global Population",
    subtitle = "Each square = 1% of the global population",
    fill     = NULL
  ) +
  theme_void() +
  theme(
    plot.title    = element_text(face = "bold", hjust = 0.5, size = 14),
    plot.subtitle = element_text(color = "grey50", hjust = 0.5, size = 11),
    legend.position = "bottom",
    legend.text = element_text(size = 11)
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting coord_equal()

Without `coord_equal()`, squares get stretched into rectangles based on the plot aspect ratio. Always add it.

```r title="Common mistake: missing coordequal"
# Wrong: squares become rectangles
ggplot(...) + geom_waffle(...)

# Correct
ggplot(...) + geom_waffle(...) + coord_equal()
```

### Mistake 2: Values don't sum correctly

If you're not using `make_proportional = TRUE`, your values must sum to a multiple of `n_rows` (e.g., 100 for a 10×10 grid). Partial squares create visual artifacts.

```r title="Common mistake: values sum mismatch"
# Wrong: 47 + 35 + 20 = 102 ≠ 100
data.frame(cat = c("A","B","C"), pct = c(47, 35, 20))

# Correct: round to sum to exactly 100
data.frame(cat = c("A","B","C"), pct = c(47, 34, 19))
# Or use make_proportional = TRUE to let waffle handle rounding
```

### Mistake 3: Too many categories

```r title="Common mistake: too many categories"
# Wrong: 8 categories on a 10x10 grid = confusing patchwork
data.frame(cat = LETTERS[1:8], pct = c(15,12,14,11,13,12,14,9))
```

✅ Collapse small categories into "Other" and keep 3-4 groups maximum.

### Mistake 4: Not labeling what each square represents

Always add a subtitle or caption telling readers what one square represents: `"Each square = 1% of respondents"` or `"Each square = 100 employees"`.

### Mistake 5: Using waffle for continuous distributions

Waffle charts encode counts, not distributions. For continuous data (age distributions, measurement ranges), use histograms or density plots instead.

## Practice Exercises

### Exercise 1: Create a vote share waffle

Using the data below, create a 10×10 waffle chart. Use custom colors and add a subtitle explaining what each square represents.

| Party | Votes |
|-------|-------|
| Green | 24 |
| Blue | 38 |
| Red | 28 |
| Orange | 10 |

<details>
<summary>Show solution</summary>

```r title="Party vote waffle solution"
library(ggplot2)
library(waffle)

df <- data.frame(
  party = c("Green", "Blue", "Red", "Orange"),
  votes = c(24, 38, 28, 10)
)

ggplot(df, aes(fill = party, values = votes)) +
  geom_waffle(n_rows = 10, size = 0.3, colour = "white", flip = TRUE) +
  scale_fill_manual(
    values = c("Green" = "#4CAF50", "Blue" = "#2196F3",
               "Red" = "#E53935", "Orange" = "#FF9800")
  ) +
  coord_equal() +
  labs(
    title    = "Election Results",
    subtitle = "Each square = 1% of votes",
    fill     = NULL
  ) +
  theme_void() +
  theme(
    plot.title    = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(color = "grey50", hjust = 0.5),
    legend.position = "bottom"
  )
```

</details>

### Exercise 2: Faceted comparison

Extend Exercise 1 to show the same data for three election years with different results. Create a faceted waffle with `facet_wrap(~ year)`.

<details>
<summary>Show solution</summary>

```r title="Faceted election waffle solution"
library(ggplot2)
library(waffle)

df <- data.frame(
  year  = rep(c("2015", "2019", "2023"), each = 4),
  party = rep(c("Green", "Blue", "Red", "Orange"), 3),
  votes = c(
    24, 38, 28, 10,   # 2015
    20, 35, 32, 13,   # 2019
    18, 31, 36, 15    # 2023
  )
)

ggplot(df, aes(fill = party, values = votes)) +
  geom_waffle(n_rows = 10, size = 0.3, colour = "white", flip = TRUE) +
  facet_wrap(~ year, nrow = 1) +
  scale_fill_manual(
    values = c("Green" = "#4CAF50", "Blue" = "#2196F3",
               "Red" = "#E53935", "Orange" = "#FF9800")
  ) +
  coord_equal() +
  labs(title = "Election Results Comparison", fill = NULL) +
  theme_void() +
  theme(strip.text = element_text(face = "bold"),
        legend.position = "bottom")
```

</details>

## Summary

| Task | Code |
|---|---|
| Basic waffle | `geom_waffle(n_rows = 10, size = 0.3, colour = "white")` |
| Square grid | `+ coord_equal()` (always required) |
| Auto-scale to 100 | `make_proportional = TRUE` |
| Faceted comparison | `+ facet_wrap(~ group)` |
| Clean background | `+ theme_void()` |
| Quick base version | `waffle(c(A = 40, B = 60), rows = 10)` |

**When waffle charts work well:**
- 2-4 categories with clear proportional differences
- Audience needs to count or verify proportions
- "1 in 3" or "more than half" narratives
- Comparing two time periods side by side (facets)

**When to use other charts:**
- More than 4-5 categories (too many small squares)
- Continuous distributions (use histogram or density plot)
- Precise comparisons needed (use bar chart)
- Very small proportions (< 2-3%), too few squares to see

## FAQ

**What is the difference between the waffle package and ggwaffle?**
`waffle` (by hrbrmstr) is the original package with both a standalone `waffle()` function and `geom_waffle()`. `ggwaffle` (by liamgilbey) is a closer ggplot2-idiomatic alternative. Both work well; `waffle` is more widely used.

**How do I make each square represent a specific unit (e.g., 1,000 employees)?**
Keep your values as multiples of the unit. If n = 10,000 employees and you want 1 square = 100 employees, divide all values by 100 before plotting. Add `xlab = "1 square = 100 employees"` to the plot.

**Can I use icons instead of squares?**
Yes, the `waffle` package supports Font Awesome icons via `geom_pictogram()`. Install font-awesome fonts and use `geom_pictogram(aes(label = icon_name))` to replace squares with people icons, cars, etc.

**How do I remove the gap between squares?**
Set `size = 0` inside `geom_waffle()`, this removes the gap entirely. Squares touch each other, creating a solid block. A small gap (`size = 0.3`) usually reads better.

**Why are my squares rectangular instead of square?**
You forgot `coord_equal()`. Add `+ coord_equal()` to the plot.

## References

- waffle package: github.com/hrbrmstr/waffle
- R Graph Gallery, Waffle chart: r-graph-gallery.com/waffle.html
- Wilke C. (2019). *Fundamentals of Data Visualization*, Chapter 10: Visualizing proportions
- r-charts.com, Waffle chart in ggplot2

## Continue Learning

- **ggplot2 Bar Charts**, precise comparisons for categorical data
- **Pie Chart and Donut Chart in R**, classic proportional charts for 3-5 categories
- **Treemap in R**, hierarchical proportions for many categories
