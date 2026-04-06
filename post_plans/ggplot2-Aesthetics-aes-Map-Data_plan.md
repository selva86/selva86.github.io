# Plan: ggplot2 aes() — Map Any Variable to Any Visual Property

## A. Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 aes(): Map Any Variable to Any Visual Property — The Complete Reference |
| slug | ggplot2-Aesthetics-aes-Map-Data |
| description | aes() maps data columns to visual properties: colour, fill, size, shape, alpha, linetype. Learn which aesthetics each geom supports, how to set vs map, and how to override scales. |
| keywords | ggplot2 aesthetics, aes() in ggplot2, ggplot2 colour mapping, ggplot2 fill, ggplot2 shape, ggplot2 size, ggplot2 alpha, ggplot2 linetype, set vs map aesthetics, ggplot2 scale override |
| auto_link_terms | ggplot2 aesthetics\|aes() in ggplot2\|ggplot2 aes\|aesthetic mapping\|colour mapping in ggplot2\|fill aesthetic\|shape aesthetic |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.3 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | ggplot2 Aesthetics (aes) |
| sidebar_order | 6 |
| fr_parent | (none — this is a C post) |

## B. Breadcrumb

Home > Visualization > ggplot2 Foundations > ggplot2 aes(): Map Any Variable to Any Visual Property — The Complete Reference

## C. Full Section Outline

### Lead sentence
`aes()` maps columns in your data to visual properties — colour, fill, size, shape, alpha, and linetype — so ggplot2 automatically varies those properties across data values and generates a matching legend.

### Introduction (2-3 paragraphs)
- Hook: Every ggplot2 plot starts with `aes()` but most tutorials only show `aes(x, y)`. The function can map ANY variable to ANY visual property.
- What: `aes()` is the bridge between your data frame and visual encoding. It tells ggplot2 which columns drive which visual channels.
- What you'll learn: all major aesthetics, when to map vs set, how layers inherit aesthetics, how to override scales.
- Diagram: Figure 1 — overview of all aesthetics.

### Core H2 Sections (5 sections)

#### H2 1: What does aes() actually do?
- Theory: aes() creates a mapping object that links column names to visual properties. It doesn't draw anything — it just describes intent.
- Code: Basic `ggplot(mpg, aes(x = displ, y = hwy))` with `geom_point()`, then add `colour = class`
- Callout: [KEY INSIGHT] aes() describes intent, geoms draw it
- Inline exercise: Add `size = cyl` to the existing scatter plot

#### H2 2: How do you map colour and fill to data?
- Theory: `colour` controls outlines/points, `fill` controls interiors. Discrete vs continuous variables produce different scales.
- Code block 1: `colour = class` on scatter plot
- Code block 2: `fill = drv` on bar chart
- Code block 3: `colour` on continuous variable (gradient)
- Callout: [TIP] Use `colour` for points/lines, `fill` for bars/areas/polygons
- Inline exercise: Create a boxplot of hwy by class, fill by drv

#### H2 3: How do shape, size, and alpha encode additional variables?
- Theory: shape for categorical (max 6 default), size for continuous, alpha for overplotting
- Code block 1: `shape = drv` on scatter
- Code block 2: `size = cyl` on scatter
- Code block 3: `alpha = hwy` to reveal density
- Table: Which aesthetics work best with which data types (categorical vs continuous)
- Callout: [WARNING] shape only supports 6 discrete values by default
- Inline exercise: Map alpha to a continuous variable on the mpg scatter

#### H2 4: What is the difference between setting and mapping an aesthetic?
- Diagram: Figure 2 — set vs map decision flow
- Theory: Inside aes() = mapped to data, Outside aes() = fixed constant. The #1 ggplot2 beginner mistake.
- Code block 1: `aes(colour = class)` — mapped, legend appears
- Code block 2: `colour = "steelblue"` outside aes — fixed, no legend
- Code block 3: Common mistake: `aes(colour = "red")` — creates a category!
- Callout: [WARNING] Putting a constant inside aes() creates a one-level category, not the colour you expect
- Inline exercise: Fix a broken plot where `colour = "blue"` is inside aes()

#### H2 5: How do aesthetics inherit across layers?
- Diagram: Figure 3 — layer inheritance
- Theory: aes() in ggplot() passes to all layers. Layer-specific aes() overrides or extends.
- Code block 1: Global aes, two geoms inherit
- Code block 2: Override colour in one layer
- Code block 3: Add a layer-specific aesthetic
- Callout: [TIP] Put shared mappings in ggplot(), layer-specific in the geom
- Inline exercise: Add a geom_smooth that ignores the colour grouping

### Common Mistakes (3-5)
1. Putting a fixed colour inside aes() — gets treated as a category
2. Using fill on geom_point() — only shapes 21-25 support fill
3. Mapping a continuous variable to shape — ggplot2 refuses with error
4. Forgetting that aes() strings create factor levels, not literal values
5. Overloading a single plot with too many aesthetics

### Practice Exercises (3 capstone)
1. Medium: Build a scatter of displ vs hwy, map colour to class and size to cyl, set alpha to 0.7
2. Hard: Create a layered plot with geom_point and geom_smooth where points show colour by class but the smoother ignores grouping
3. Hard: Build a bar chart with fill mapped to a variable, then override the default palette with scale_fill_brewer()

### Complete Example
End-to-end: load mpg, build a multi-aesthetic scatter plot, customize scales, add labels.

### Summary
Table: aesthetic | what it controls | best for | example

### FAQ (5)
1. Why use `<-` instead of `=` inside aes()? (Answer: `=` works fine inside aes(); `<-` is for assignment outside)
2. What's the difference between colour and color? (Both work — ggplot2 auto-converts)
3. Can I use computed columns inside aes()? (Yes — aes(x = log(displ)))
4. How many shapes does ggplot2 support? (26 built-in, 0-25)
5. Why does my legend show "red" as a label instead of red colour? (Constant inside aes)

### References (7)
1. Wickham, H. — ggplot2: Elegant Graphics for Data Analysis, 3rd ed. Springer (2024). [Link](https://ggplot2-book.org/)
2. ggplot2 reference — aes(). [Link](https://ggplot2.tidyverse.org/reference/aes.html)
3. ggplot2 reference — Aesthetic specifications. [Link](https://ggplot2.tidyverse.org/articles/ggplot2-specs.html)
4. ggplot2 reference — Colour aesthetics. [Link](https://ggplot2.tidyverse.org/reference/aes_colour_fill_alpha.html)
5. ggplot2 reference — Shape/size/linetype aesthetics. [Link](https://ggplot2.tidyverse.org/reference/aes_linetype_size_shape.html)
6. Wilkinson, L. — The Grammar of Graphics, 2nd ed. Springer (2005).
7. R for Data Science, 2nd ed. — Data visualization chapter. [Link](https://r4ds.hadley.nz/data-visualize.html)

### What's Next
1. ggplot2 Scales — control how mapped aesthetics translate to visual values
2. ggplot2 Themes — customize non-data elements
3. Top 50 ggplot2 Visualizations — gallery of chart types

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | ggplot2-Aesthetics-aes-Map-Data-overview.webp | Figure 1 | The six families of aesthetics available in aes(). | Introduction |
| 2 | ggplot2-Aesthetics-aes-Map-Data-set-vs-map.webp | Figure 2 | Deciding whether to set or map an aesthetic. | What is the difference between setting and mapping an aesthetic? |
| 3 | ggplot2-Aesthetics-aes-Map-Data-layer-inheritance.webp | Figure 3 | How layers inherit aesthetics from the global ggplot() call. | How do aesthetics inherit across layers? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Basic scatter with aes(x, y) | ggplot2 | — | — |
| 2 | Add colour = class | — | — | — |
| 3 | Inline ex: add size = cyl | — | — | — |
| 4 | colour = class scatter | — | — | — |
| 5 | fill = drv bar chart | — | — | — |
| 6 | Continuous colour gradient | — | — | — |
| 7 | Inline ex: boxplot with fill | — | — | — |
| 8 | shape = drv | — | — | — |
| 9 | size = cyl | — | — | — |
| 10 | alpha = hwy | — | — | — |
| 11 | Inline ex: alpha mapping | — | — | — |
| 12 | Mapped colour | — | — | — |
| 13 | Set colour (fixed) | — | — | — |
| 14 | Mistake: constant inside aes | — | — | — |
| 15 | Inline ex: fix broken plot | — | — | — |
| 16 | Global aes, two geoms | — | — | — |
| 17 | Override in one layer | — | — | — |
| 18 | Layer-specific aesthetic | — | — | — |
| 19 | Inline ex: geom_smooth ignore group | — | — | — |
| 20-24 | Mistakes ❌/✅ | — | — | — |
| 25-27 | Capstone exercises | — | — | — |
| 28 | Complete example | — | — | — |

Estimated word count: ~4500
