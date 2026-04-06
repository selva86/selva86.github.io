# Plan: ggplot2's Grammar of Graphics

## A. Frontmatter

| Field | Value |
|---|---|
| title | ggplot2's Grammar of Graphics: The Mental Model That Makes Everything Click |
| slug | ggplot2-Grammar-of-Graphics |
| description | ggplot2 is built on Wilkinson's Grammar of Graphics -- data, aesthetics, geometries, scales, facets, and themes as separable layers. Master this model. |
| keywords | grammar of graphics, ggplot2, layered grammar, ggplot2 layers, aesthetics ggplot2, geom ggplot2, ggplot2 scales, ggplot2 facets, ggplot2 themes, data visualization R |
| auto_link_terms | grammar of graphics\|layered grammar\|ggplot2 layers\|ggplot2 grammar\|ggplot2 aesthetics\|aes()\|geom_point()\|geom_bar()\|facet_wrap() |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.1 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | Grammar of Graphics |
| sidebar_order | 6 |

## B. Breadcrumb

Home > Visualization > The Grammar of Graphics > ggplot2's Grammar of Graphics

## C. Full Section Outline

### Lead sentence
ggplot2's grammar of graphics decomposes every chart into seven independent layers -- data, aesthetics, geometries, statistics, scales, coordinates, and themes -- so you build plots by assembling parts rather than memorizing function calls.

### Introduction (## Introduction)
- Hook: Most people learn ggplot2 by copying recipes. That works until you hit a chart that isn't in any tutorial. The grammar of graphics is the mental model that lets you construct *any* chart from first principles.
- What: Leland Wilkinson proposed the Grammar of Graphics in 1999. Hadley Wickham adapted it into ggplot2's "layered grammar" in 2010.
- Why it matters: Once you see ggplot2 as a sentence made of grammatical parts, you stop guessing which function to call and start *composing* plots logically.
- What you'll learn: The 7 layers, how they combine, and when to change each one.
- Package note: ggplot2 is part of the tidyverse. All code runs in the browser.
- Place Figure 1 (layer model diagram) here.

### Core H2 sections (5 sections):

#### H2-1: What Are the Seven Layers of the Grammar?
- Theory: List and explain each layer briefly: data, aesthetics, geometries, statistics, scales, coordinates, facets/themes
- Code: Minimal complete ggplot2 call showing all layers explicitly
- Callout: KEY INSIGHT -- Every ggplot2 call uses all 7 layers. Most are just set to sensible defaults.
- Inline exercise: Add a `labs()` call to customize axis labels on a basic scatterplot.

#### H2-2: How Do Aesthetics Connect Data to Visuals?
- Theory: aes() maps data columns to visual properties (position, colour, size, shape, alpha)
- Code block 1: Basic aes(x, y) scatterplot with mtcars
- Code block 2: Add colour and size mapped to data columns
- Place Figure 2 (aes mapping diagram) here
- Callout: TIP -- Put aes() in ggplot() for global mappings, in geom_*() for layer-specific ones.
- Inline exercise: Map the `cyl` column to the `shape` aesthetic.

#### H2-3: How Do Geometries Turn Mapped Data into Shapes?
- Theory: geom_*() functions define the visual mark (points, bars, lines, boxplots, etc.)
- Code block 1: Same data, different geoms (point vs line vs col)
- Code block 2: Layer two geoms on one plot (points + smooth)
- Place Figure 3 (geom decision diagram) here
- Callout: WARNING -- Mixing incompatible geoms (e.g. geom_bar on continuous y without stat="identity") is the #1 ggplot2 beginner error.
- Inline exercise: Replace geom_point() with geom_boxplot() and adjust the aesthetics.

#### H2-4: What Do Scales, Coordinates, and Facets Control?
- Theory: Scales control how data values map to aesthetic ranges. Coordinates control the axis system. Facets split data into panels.
- Code block 1: scale_colour_brewer() + scale_y_log10()
- Code block 2: facet_wrap(~cyl) to create small multiples
- Callout: NOTE -- coord_flip() swaps axes. Useful for horizontal bar charts.
- Inline exercise: Use facet_grid(drv ~ cyl) to create a 2D panel grid.

#### H2-5: How Do Themes and Labels Polish a Plot?
- Theory: Themes control non-data elements (fonts, backgrounds, gridlines). labs() sets titles and axis names.
- Code block 1: Apply theme_minimal() and theme_classic() side by side
- Code block 2: Customize with theme() -- change font sizes, remove gridlines
- Callout: TIP -- Start with a built-in theme, then override specific elements with theme().
- Inline exercise: Change the legend position to "bottom" using theme(legend.position = "bottom").

### Tail sections:

#### Common Mistakes (3-5)
1. Forgetting `+` between layers (Error: Cannot add ggproto objects together)
2. Putting aes() outside ggplot()/geom and losing mappings
3. Using geom_bar() when you need geom_col() (stat="count" vs stat="identity")
4. Mapping a continuous variable to shape (only works for discrete)

#### Practice Exercises (2-3 capstone)
1. Medium: Build a faceted scatterplot of mpg dataset with colour by class, facet by drv, and a custom theme.
2. Hard: Layer geom_point + geom_smooth + geom_text to annotate outliers on a scatter plot of diamonds price vs carat.

#### Complete Example
End-to-end: Load data, map aesthetics, choose geom, add facets, customize scales, apply theme, add labels. Using mpg dataset.

#### Summary
Table: Layer | ggplot2 function | Controls
data | ggplot(data) | what to plot
aesthetics | aes() | how to map
geometries | geom_*() | what shape
statistics | stat_*() | data transforms
scales | scale_*() | value ranges
coordinates | coord_*() | axis system
facets | facet_*() | panel splits
themes | theme() | styling

#### FAQ (5)
1. What is the difference between aes() inside ggplot() vs inside geom_*()?
2. Why does ggplot2 use + instead of |> to add layers?
3. Can I mix base R graphics with ggplot2?
4. How many geom layers can I stack on one plot?
5. When should I use stat_*() instead of geom_*()?

#### References (7)
1. Wickham, H. -- "A Layered Grammar of Graphics" (2010). Journal of Computational and Graphical Statistics.
2. Wilkinson, L. -- *The Grammar of Graphics*, 2nd ed. Springer (2005).
3. Wickham, H. -- *ggplot2: Elegant Graphics for Data Analysis*, 3rd ed. [Link](https://ggplot2-book.org/)
4. ggplot2 official documentation. [Link](https://ggplot2.tidyverse.org/)
5. Wickham, H. & Grolemund, G. -- *R for Data Science*, 2nd ed. Chapter: Data Visualization. [Link](https://r4ds.hadley.nz/data-visualize)
6. RStudio ggplot2 cheat sheet. [Link](https://rstudio.github.io/cheatsheets/data-visualization.pdf)
7. Wilke, C. -- *Fundamentals of Data Visualization*. [Link](https://clauswilke.com/dataviz/)

#### What's Next
1. ggplot2 Getting Started: Build Your First 5 Charts -- hands-on chart building
2. ggplot2 Tutorial (existing on site) -- deeper examples

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | ggplot2-Grammar-of-Graphics-layer-model.webp | Figure 1 | The seven layers of ggplot2's grammar, from raw data to finished plot. | Introduction |
| 2 | ggplot2-Grammar-of-Graphics-aes-mapping.webp | Figure 2 | Aesthetics map data variables to visual properties like position, colour, and size. | How Do Aesthetics Connect Data to Visuals? |
| 3 | ggplot2-Grammar-of-Graphics-geom-decision.webp | Figure 3 | Choosing the right geom based on your data types. | How Do Geometries Turn Mapped Data into Shapes? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load ggplot2 + basic complete call | ggplot2 | p_basic | -- |
| 2 | Inline ex: add labs() | -- | -- | -- |
| 3 | aes(x, y) scatter | -- | p_aes | -- |
| 4 | aes colour + size | -- | p_aes2 | -- |
| 5 | Inline ex: map shape | -- | -- | -- |
| 6 | Same data, different geoms | -- | p_geom1, p_geom2 | -- |
| 7 | Layer two geoms | -- | p_layer | -- |
| 8 | Inline ex: boxplot | -- | -- | -- |
| 9 | Scales: colour brewer + log | -- | p_scales | -- |
| 10 | Facets: facet_wrap | -- | p_facet | -- |
| 11 | Inline ex: facet_grid | -- | -- | -- |
| 12 | Theme comparison | -- | p_theme1, p_theme2 | -- |
| 13 | Custom theme() tweaks | -- | p_custom | -- |
| 14 | Inline ex: legend position | -- | -- | -- |
| 15 | Mistake 1: missing + | -- | -- | -- |
| 16 | Mistake 2: aes outside | -- | -- | -- |
| 17 | Mistake 3: geom_bar vs geom_col | -- | -- | -- |
| 18 | Mistake 4: continuous to shape | -- | -- | -- |
| 19 | Capstone exercise 1 starter | -- | -- | -- |
| 20 | Capstone exercise 2 starter | -- | -- | -- |
| 21 | Complete example | -- | final_plot | -- |
