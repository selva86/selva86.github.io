---
title: "UpSet Plot in R: Visualize Set Intersections Beyond Venn Diagrams"
slug: "UpSet-Plot-in-R"
description: "Create UpSet plots in R with the UpSetR package. Learn to visualize set intersections for many groups, read the intersection matrix, sort by frequency, and when UpSet beats Venn diagrams."
keywords: "UpSet plot R, UpSetR package, R set intersections visualization, UpSet plot ggplot2, Venn diagram alternative R, set intersection chart R"
auto_link_terms: "UpSet plot in R|UpSetR|set intersections R|UpSet visualization"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-11
post_type: FR
fr_parent: ggplot2-Bar-Charts.html
---

# UpSet Plot in R: Visualize Set Intersections Beyond Venn Diagrams

<p class="lead">An UpSet plot replaces Venn diagrams for data with more than 3 sets — it shows every intersection as a bar chart, with a matrix below marking which sets belong to each intersection. In R, the <code>UpSetR</code> package creates them with a single <code>upset()</code> call.</p>

## Introduction

Venn diagrams work beautifully for 2-3 sets. Beyond that, the overlapping circles become unreadable — try drawing a 6-set Venn diagram and you'll see why researchers needed an alternative.

UpSet plots solve this systematically. Instead of overlapping circles, they use:
1. **A bar chart (top)** — each bar is an intersection, sized by how many elements belong to it.
2. **A matrix (bottom)** — dots and lines show which sets are included in each intersection.
3. **Set size bars (left)** — total size of each individual set.

The result is a precise, readable display of every intersection between any number of sets — 4, 8, even 20 sets become manageable.

Common use cases: gene ontology overlaps in bioinformatics, survey respondents who chose multiple answers, product features selected by customers, or any analysis where elements can belong to multiple groups simultaneously.

## How do you read an UpSet plot?

Before building one, let's understand the layout. An UpSet plot has three panels:

- **Top bar chart**: Each bar = one intersection. The tallest bar = most common intersection.
- **Matrix grid**: Each column = one intersection. Filled dots show which sets are in that intersection. A single dot = elements only in that set. Connected dots = elements in all connected sets simultaneously.
- **Left bar chart**: Total elements in each set (regardless of intersections).

For example, if you have movies that can be Drama, Comedy, or Action:
- A bar with only the Drama dot filled = movies that are **only** Drama (not Comedy, not Action).
- A bar with Drama and Comedy dots connected = movies that are **both** Drama AND Comedy.

## How do you create a basic UpSet plot in R?

`UpSetR` uses `upset()` which takes a data frame in binary format — one column per set, values 0/1.

```r
library(UpSetR)

# Built-in movies dataset from UpSetR
# Each row is a movie, columns are genres (0/1 membership)
data(movies)

# Basic UpSet plot
upset(
  movies,
  sets = c("Action", "Comedy", "Drama", "Romance", "Thriller"),
  mb.ratio = c(0.55, 0.45)   # ratio of bar chart to matrix panel height
)
```

`movies` is a built-in dataset in UpSetR — 3,000+ movies with binary genre columns. `sets` specifies which sets to include and their order (bottom-to-top in the matrix). `mb.ratio` controls the vertical split between the bar chart and matrix.

**Try it:** Remove the `sets` argument to include all columns automatically. Then change `mb.ratio = c(0.7, 0.3)` to give more space to the bar chart.

## How do you sort intersections by size?

By default, intersections are sorted by degree (number of sets in the intersection). Sorting by frequency (size) puts the most common intersections first — usually more useful.

```r
# Sort by frequency (most common intersections first)
upset(
  movies,
  sets        = c("Action", "Comedy", "Drama", "Romance", "Thriller"),
  order.by    = "freq",           # sort by intersection size
  decreasing  = TRUE,             # largest first
  nsets       = 5,                # include 5 sets
  nintersects = 15,               # show top 15 intersections
  mb.ratio    = c(0.55, 0.45)
)
```

`order.by = "freq"` sorts bars by size. `nintersects = 15` limits to the 15 largest intersections — helpful when many possible intersections exist but most are tiny.

**Try it:** Change `order.by = "freq"` to `order.by = "degree"` (default) — the bars are now sorted by how many sets each intersection spans. Is this more or less useful than frequency sorting for this dataset?

## How do you customize colors in an UpSet plot?

`UpSetR` has limited ggplot2-style styling, but it does support bar color customization with `main.bar.color`, `sets.bar.color`, and `matrix.color`.

```r
# Custom bar colors
upset(
  movies,
  sets        = c("Action", "Comedy", "Drama", "Romance", "Thriller"),
  order.by    = "freq",
  nintersects = 12,
  mb.ratio    = c(0.55, 0.45),
  main.bar.color = "#1565C0",    # intersection bar color
  sets.bar.color = "#E53935",    # set size bar color (left panel)
  matrix.color   = "#1565C0",    # dot color in matrix
  shade.color    = "#EEF2FF",    # shade alternating rows
  text.scale     = c(1.5, 1.3, 1, 1, 1.5, 1.2)  # text scaling per panel
)
```

`text.scale` controls font size for 6 elements in this order: intersection size labels, intersection axis label, set size labels, set axis labels, set names, numbers above dots.

**Try it:** Change `main.bar.color = "#2E7D32"` (green) and `sets.bar.color = "#F57C00"` (orange). Also try removing `shade.color` to remove the alternating row shading.

## How do you highlight a specific intersection?

`query` lets you highlight specific intersections — useful for calling out the most important pattern in a presentation.

```r
# Highlight the Drama-only intersection
upset(
  movies,
  sets     = c("Action", "Comedy", "Drama", "Romance", "Thriller"),
  order.by = "freq",
  nintersects = 12,
  mb.ratio    = c(0.55, 0.45),
  queries = list(
    list(
      query  = intersects,
      params = list("Drama"),      # only Drama (no other sets)
      color  = "#E53935",          # highlight color
      active = TRUE,               # fill the bar
      query.name = "Drama Only"
    )
  )
)
```

`intersects` is a built-in query function in UpSetR. `params = list("Drama")` selects the intersection where only Drama is active. `active = TRUE` fills the bar; `active = FALSE` draws an outline only.

**Try it:** Change `params = list("Drama")` to `params = list("Action", "Drama")` to highlight the Action + Drama co-occurrence intersection.

## How do you create an UpSet plot from a binary matrix?

If your data isn't already in the UpSetR built-in format, convert it from a list of sets or a binary membership matrix.

```r
# Create binary data from scratch: survey responses
# Each row = one respondent, each column = a feature they use
set.seed(42)
n <- 200

bin_df <- data.frame(
  Email     = sample(0:1, n, replace = TRUE, prob = c(0.2, 0.8)),
  Dashboard = sample(0:1, n, replace = TRUE, prob = c(0.3, 0.7)),
  Reports   = sample(0:1, n, replace = TRUE, prob = c(0.4, 0.6)),
  API       = sample(0:1, n, replace = TRUE, prob = c(0.7, 0.3)),
  Mobile    = sample(0:1, n, replace = TRUE, prob = c(0.5, 0.5))
)

upset(
  bin_df,
  sets        = c("Email", "Dashboard", "Reports", "API", "Mobile"),
  order.by    = "freq",
  nintersects = 15,
  mb.ratio    = c(0.6, 0.4),
  main.bar.color = "#1565C0",
  sets.bar.color = "#43A047"
)
```

The data frame just needs columns with 0/1 values — one row per element, one column per set.

**Try it:** Add `keep.order = TRUE` inside `upset()` to keep the set order as specified in `sets` instead of automatically sorting by set size.

## Common Mistakes and How to Fix Them

### Mistake 1: Data not in binary format

`upset()` requires 0/1 binary columns. Lists of members need conversion first.

```r
# Convert list of sets to binary matrix
set_list <- list(
  SetA = c("gene1", "gene2", "gene3"),
  SetB = c("gene2", "gene4", "gene5"),
  SetC = c("gene1", "gene5", "gene6")
)

all_elements <- unique(unlist(set_list))
bin_mat <- data.frame(
  lapply(set_list, function(s) as.integer(all_elements %in% s)),
  row.names = all_elements
)
```

### Mistake 2: Including too many intersections

With 6+ sets, there are 2^6 = 64 possible intersections. Use `nintersects` to show only the most common ones.

```r
upset(df, nintersects = 20, order.by = "freq")
```

### Mistake 3: Confusing "set size" with "intersection size"

The left bar chart shows *total set membership* (including overlap). The top bar chart shows *exclusive intersection size*. These are different: the Drama bar on the left is all drama movies; the Drama bar on top is only movies that are *exclusively* Drama.

### Mistake 4: Using Venn diagrams for > 3 sets

With 4+ sets, Venn diagrams become overlapping circles that are nearly impossible to read. Switch to UpSet plots for any dataset with 4+ groups.

### Mistake 5: Not labeling axes clearly

UpSetR's defaults have minimal labeling. Add `ylab = "Intersection Size"` and use `text.scale` to increase font sizes for readability.

```r
upset(df, ylab = "Intersection Size", text.scale = c(1.5, 1.3, 1.2, 1, 1.5, 1))
```

## Practice Exercises

### Exercise 1: Build your own binary matrix

Create a data frame of 100 customers who purchased different product categories (Electronics, Books, Clothing, Food, Sports — each with random 0/1 membership). Create an UpSet plot sorted by frequency showing the top 10 intersections.

<details>
<summary>Show solution</summary>

```r
library(UpSetR)

set.seed(99)
n <- 100
df <- data.frame(
  Electronics = rbinom(n, 1, 0.4),
  Books       = rbinom(n, 1, 0.5),
  Clothing    = rbinom(n, 1, 0.35),
  Food        = rbinom(n, 1, 0.6),
  Sports      = rbinom(n, 1, 0.25)
)

upset(
  df,
  sets        = c("Electronics", "Books", "Clothing", "Food", "Sports"),
  order.by    = "freq",
  nintersects = 10,
  mb.ratio    = c(0.6, 0.4),
  main.bar.color = "#1565C0"
)
```

</details>

### Exercise 2: Using the built-in movies dataset

Using `data(movies)` from UpSetR, create an UpSet plot for these 6 genres: Action, Comedy, Drama, Romance, Documentary, Animation. Highlight the Comedy-only intersection in red.

<details>
<summary>Show solution</summary>

```r
library(UpSetR)
data(movies)

upset(
  movies,
  sets        = c("Action", "Comedy", "Drama", "Romance", "Documentary", "Animation"),
  order.by    = "freq",
  nintersects = 15,
  mb.ratio    = c(0.55, 0.45),
  queries     = list(
    list(
      query      = intersects,
      params     = list("Comedy"),
      color      = "#E53935",
      active     = TRUE,
      query.name = "Comedy Only"
    )
  )
)
```

</details>

## Summary

| Argument | Effect |
|---|---|
| `sets` | Which sets to include (columns in data frame) |
| `order.by = "freq"` | Sort intersections by size (most common first) |
| `order.by = "degree"` | Sort by number of sets in each intersection |
| `nintersects` | Limit to top N intersections |
| `nsets` | Limit to top N sets |
| `mb.ratio` | Panel height ratio (bar chart vs matrix) |
| `main.bar.color` | Intersection bar color |
| `sets.bar.color` | Set size bar color (left panel) |
| `queries` | Highlight specific intersections |
| `text.scale` | Font size control for each panel |

**When to use UpSet plots:**
- 4+ sets where Venn diagrams are unreadable
- You need exact counts for every intersection
- The most common intersections are the key finding

**When to use Venn diagrams:**
- 2-3 sets only
- Your audience is unfamiliar with UpSet plots
- Proportional area matters more than exact counts (Euler diagrams)

## FAQ

**What is the difference between UpSetR and ComplexUpset?**
`UpSetR` is the original package — simple, fast, single function call. `ComplexUpset` rebuilds UpSet plots in ggplot2, giving full ggplot2 theme and layer control but with more complex syntax. Start with UpSetR; move to ComplexUpset if you need ggplot2 integration.

**How do I convert a list of set members to binary format?**
Use `fromList()` from UpSetR: `upset(fromList(list(SetA = c("a","b"), SetB = c("b","c"))), ...)`. This converts a list of members into the binary matrix format automatically.

**Can I make interactive UpSet plots in R?**
Yes — the `upsetjs` package creates interactive UpSet plots for R Markdown and Shiny. The `ComplexUpset` package also supports some interactivity via plotly.

**Why does my UpSet plot not show some intersections?**
By default `nintersects = 40`. If you have few observations, some intersections may have 0 members and are hidden. Increase `nintersects` or check your data for empty categories.

**How do I export an UpSet plot to a file?**
Wrap in `pdf()` / `dev.off()` or use `png()`: `png("upset.png", width=10, height=6, units="in", res=150); upset(df, ...); dev.off()`.

## References

- UpSetR CRAN package: github.com/hms-dbmi/UpSetR
- Lex A., et al. (2014). UpSet: Visualization of Intersecting Sets. *IEEE TVCG*.
- Conway J.R., et al. (2017). UpSetR: an R package for the visualization of intersecting sets. *Bioinformatics*.
- upset.app — Official UpSet visualization website

## What's Next?

- **R Waffle Chart** — visualize counts as grids of unit squares
- **Heatmap in R** — encode a matrix of values as a color grid
- **R Correlation Matrix Plot** — visualize pairwise correlations across many variables
