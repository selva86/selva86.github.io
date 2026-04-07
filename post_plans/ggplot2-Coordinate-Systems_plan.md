# Plan: ggplot2 Coordinate Systems in R

## A. Frontmatter

| Field | Value |
|---|---|
| `title` | ggplot2 Coordinate Systems in R: coord_flip(), coord_polar() & coord_fixed() |
| `slug` | ggplot2-Coordinate-Systems |
| `description` | Learn ggplot2 coordinate systems in R: coord_flip(), coord_polar() & coord_fixed() with practical examples, inline output, and clear explanations for every use case. |
| `keywords` | ggplot2 coordinate systems, coord_flip R, coord_polar ggplot2, coord_fixed ggplot2, ggplot2 horizontal bar chart, ggplot2 pie chart, ggplot2 axis flip, R visualization |
| `auto_link_terms` | ggplot2 coordinate systems\|coord_flip()\|coord_polar()\|coord_fixed()\|ggplot2 coord_flip\|ggplot2 coord_polar\|polar coordinates ggplot2\|horizontal bar chart ggplot2 |
| `auto_link_case_sensitive` | false |
| `mathjax` | false |
| `webr` | true |
| `date` | 2026-04-06 |
| `curriculum_id` | FR-ggpl-4 |
| `post_type` | FR |
| `fr_parent` | ggplot2-Scales.html |

## B. Breadcrumb

Home > Visualization > ggplot2 Foundations > ggplot2 Coordinate Systems

## C. Full Section Outline

### Lead sentence
In ggplot2, coordinate systems control how x and y values are mapped to the physical position on the plot — letting you flip axes, create polar/circular charts, and fix aspect ratios without changing your data.

### Introduction (2-3 paragraphs)
- Hook: most ggplot2 users know geoms and aesthetics, but coordinate systems unlock a surprising amount of chart types
- What coord functions do (transform the plot space *after* geoms are drawn)
- What the reader will learn: coord_flip, coord_polar, coord_fixed, coord_cartesian

### Core H2 Sections

#### 1. How Does coord_flip() Work to Make Horizontal Charts?
- Theory: swaps x and y axes after the plot is built — handy for long category labels
- Use cases: horizontal bar charts, horizontal boxplots
- Code blocks:
  - Block 1: library + create df_bar, draw vertical bar chart
  - Block 2: apply coord_flip() → horizontal bar
  - Block 3: coord_flip() with geom_boxplot (mpg dataset)
- Callout: TIP — "coord_flip() is not needed for geom_bar + aes(y=…) in ggplot2 3.3+, but it's still widely used"
- Inline exercise: Flip a bar chart of diamond cuts

#### 2. How Does coord_polar() Create Pie Charts and Radial Plots?
- Theory: maps x/y to angle and radius — how a bar chart becomes a pie chart
- theta="y" for pie, theta="x" for wind rose
- Code blocks:
  - Block 4: coord_polar(theta="y") to make pie chart from stacked bar
  - Block 5: coord_polar() for wind/coxcomb rose chart
- Callout: KEY INSIGHT — polar coords are just bar charts in disguise
- Callout: WARNING — pie charts are often misleading; prefer bar charts for comparison
- Inline exercise: Turn a simple bar chart into a coxcomb chart

#### 3. How Does coord_fixed() Control Aspect Ratios?
- Theory: forces a fixed ratio between x-unit and y-unit lengths
- Default ratio=1 (equal scales); custom ratio for maps, geometric shapes
- Code blocks:
  - Block 6: scatter plot without coord_fixed (distorted aspect)
  - Block 7: same scatter with coord_fixed(ratio=1)
  - Block 8: coord_fixed with custom ratio=2
- Callout: TIP — use coord_fixed for geographic-style data or anytime units are the same on both axes
- Inline exercise: Create a fixed-aspect scatter of iris sepal dimensions

#### 4. How Does coord_cartesian() Zoom In Without Dropping Data?
- Theory: xlim/ylim on coord_cartesian clip the *view*, not the data → stats computed on full data
- vs. scale_x_continuous(limits=…) which drops data first
- Code blocks:
  - Block 9: scale limits vs coord_cartesian zoom — show how smoothing line differs
  - Block 10: practical zoom to highlight a region
- Callout: WARNING — using scale limits instead of coord_cartesian can silently change your smooth/boxplot
- Inline exercise: Zoom into a scatter plot using coord_cartesian

### Common Mistakes (3-5)
1. Using scale limits to zoom (drops data → wrong stats)
2. Forgetting theta="y" for pie charts with coord_polar
3. coord_flip + facets interaction (labels can get crowded)
4. Using coord_fixed when axes have different units (makes chart unreadable)
5. Expecting coord_polar to make a "proper" radar/spider chart (it's approximate)

### Practice Exercises (2-3 capstone)
- Ex 1: Build a horizontal grouped bar chart from scratch using coord_flip
- Ex 2: Convert a stacked bar chart to a pie chart with proper labels
- Ex 3: Create a zoomed scatter plot that shows a trend invisible in the full view

### Complete Example
End-to-end: start with raw data → vertical bar → flip → add coord_cartesian zoom panel → arrange side by side commentary

### Summary
Table of all 4 coord functions: function, purpose, key argument, best use case

### FAQ (3-5 Q&As)
1. When should I use coord_flip vs just switching aes(x, y)?
2. Can I combine coord_flip and facets?
3. Why does my pie chart look wrong with coord_polar?
4. What is the difference between coord_cartesian and xlim()?
5. Can I use coord_fixed with maps?

### References (5-10)
- ggplot2 tidyverse reference pages for each coord function
- ggplot2 book chapter 15
- Wickham's ggplot2 textbook
- R Charts tutorial

### What's Next
- ggplot2 Scales
- ggplot2 Themes
- ggplot2 Legends

## D. Diagram List

FR post — diagrams optional. No diagrams planned (topic is better served with code output examples).

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load ggplot2, create df_bar, draw base bar | ggplot2, dplyr | df_bar, p_base | — |
| 2 | coord_flip() on bar chart | — | p_flipped | df_bar |
| 3 | coord_flip() with boxplot (mpg) | — | p_box_flipped | — |
| 4 | coord_polar(theta="y") — pie from stacked bar | — | df_pie, p_pie | df_bar |
| 5 | coord_polar() — coxcomb/rose chart | — | p_rose | df_bar |
| 6 | scatter without coord_fixed | — | p_scatter | — |
| 7 | coord_fixed(ratio=1) | — | p_fixed | — |
| 8 | coord_fixed(ratio=2) | — | — | — |
| 9 | coord_cartesian vs scale limits | — | p_zoom_scale, p_zoom_coord | — |
| 10 | coord_cartesian practical zoom | — | p_zoom | — |
| 11 | Common mistake: scale limits on smooth | — | — | — |
| 12 | Common mistake: coord_polar theta wrong | — | — | — |
| 13 | Capstone exercise 1 starter | — | my_bar | — |
| 14 | Capstone exercise 2 starter | — | my_pie | — |
| 15 | Capstone exercise 3 starter | — | my_zoom | — |
| 16 | Complete example end-to-end | — | final_df, final_plot | — |
