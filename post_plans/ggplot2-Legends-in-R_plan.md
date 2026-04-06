# Plan: ggplot2 Legends in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Legends in R: Position, Remove, Rename & Customize Completely |
| slug | ggplot2-Legends-in-R |
| description | Control every aspect of ggplot2 legends: move position with theme(legend.position), remove with guides(fill="none"), rename with labs(), and customize with guide_legend(). |
| keywords | ggplot2 legend, ggplot2 legend position, remove legend ggplot2, ggplot2 legend title, guide_legend, ggplot2 customize legend, R ggplot legend, legend.position |
| auto_link_terms | ggplot2 legend\|ggplot2 legends\|legend position ggplot2\|remove legend ggplot2\|guide_legend()\|legend.position |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-ggpl-1 |
| post_type | FR |
| fr_parent | ggplot2-Themes-in-R.html |

## B. Breadcrumb

Home > Visualization > The Grammar of Graphics > ggplot2 Legends in R

## C. Section Outline

### Lead paragraph
ggplot2 legends map visual aesthetics (colour, fill, shape, size) back to the data values they represent. You control legends through three levers: `theme()` for position and appearance, `labs()` or `scale_*()` for titles and labels, and `guides()` for fine-grained guide behaviour.

### Introduction (2-3 paragraphs)
- Hook: Every ggplot2 plot that maps an aesthetic generates a legend automatically — but the defaults rarely match your publication needs.
- What: This tutorial covers positioning, removing, renaming, reordering, and fully customizing ggplot2 legends.
- What you'll learn: By the end, you'll control every visual aspect of a legend — from moving it inside the plot to styling individual keys.
- Note: All code runs interactively in the browser. Uses ggplot2 and the built-in mpg dataset.

### Core H2 Sections (6 sections)

#### H2-1: How does ggplot2 decide which legends to show?
- Theory: aesthetics mapped inside aes() generate legends; those set outside don't. Multiple aesthetics → multiple legends. Same variable mapped to multiple aesthetics → merged legend.
- Code block 1: Base plot with colour mapped to class — legend appears automatically
- Code block 2: Same plot with colour set outside aes() — no legend
- Callout: KEY INSIGHT — aes() = legend, outside aes() = no legend
- Inline exercise: Create a scatter plot of mpg mapping `drv` to shape. Verify a shape legend appears.

#### H2-2: How do you change the legend position?
- Theory: theme(legend.position) accepts "top", "bottom", "left", "right", or "inside" (ggplot2 3.5+). For inside positioning, use legend.position.inside = c(x, y).
- Code block 3: Move legend to bottom
- Code block 4: Place legend inside the plot at top-right corner with white background
- Callout: TIP — Use legend.position.inside with legend.background for clean inside placement.
- Inline exercise: Place the legend at the bottom-left inside the plot area.

#### H2-3: How do you remove a legend entirely or selectively?
- Theory: Three approaches — theme(legend.position = "none") removes all, guides(colour = "none") removes one, show.legend = FALSE in a geom suppresses that layer's contribution.
- Code block 5: Remove all legends
- Code block 6: Remove only the colour legend, keep fill
- Code block 7: Suppress one layer's legend with show.legend = FALSE
- Callout: WARNING — theme(legend.position = "none") removes ALL legends, not just one.
- Inline exercise: Create a plot with both colour and size legends, then remove only the size legend.

#### H2-4: How do you rename the legend title and labels?
- Theory: labs() sets titles. scale_colour_discrete(labels=) overrides labels. factor() level reordering changes label order.
- Code block 8: Rename legend title with labs(colour = "Vehicle Class")
- Code block 9: Rename individual labels with scale_colour_discrete(labels=)
- Code block 10: Reorder labels by releveling the factor
- Callout: TIP — labs() is the quickest way to rename; scale_*() gives full control over labels and order.
- Inline exercise: Rename the fill legend title to "Drive Type" using labs().

#### H2-5: How do you customize legend appearance with theme()?
- Theory: theme() controls every visual property — legend.title, legend.text, legend.background, legend.key, legend.key.size, legend.spacing, legend.margin, legend.direction.
- Code block 11: Style the legend title (bold, larger font) and labels (italic)
- Code block 12: Change legend key background and size
- Code block 13: Make legend horizontal with legend.direction
- Callout: NOTE — ggplot2 3.5+ moved many guide-level settings into theme(). Use theme() as the primary styling tool.
- Inline exercise: Make the legend keys 1.5 cm wide and remove the grey key background.

#### H2-6: How do you use guides() and guide_legend() for advanced control?
- Theory: guides() assigns a guide type to each aesthetic. guide_legend() controls nrow/ncol, key glyph, override.aes (icon size, shape, alpha). guide_colorbar() for continuous scales.
- Code block 14: Use guide_legend(nrow = 2) to layout legend in 2 rows
- Code block 15: Override point size in legend with override.aes
- Code block 16: Use guide_colorbar() for a continuous colour scale with custom width/height
- Callout: KEY INSIGHT — override.aes is the tool when your plot uses tiny points but you need readable legend keys.
- Inline exercise: Create a colour legend laid out in 3 columns using guide_legend(ncol = 3).

### Tail Sections

#### Common Mistakes (4 mistakes)
1. Setting colour outside aes() then wondering why there's no legend
2. Using theme(legend.position = "none") when you only want to remove one legend (use guides() instead)
3. Trying to rename labels with labs() (labs() sets the title, scale_*_discrete(labels=) sets labels)
4. Forgetting to relevel the factor when reordering legend items (scale order follows factor levels)

#### Practice Exercises (2 capstone)
1. Exercise 1 (medium): Build a scatter plot of mpg with colour = class and size = displ. Move the legend inside the plot, rename both titles, and make the colour legend horizontal with 2 rows.
2. Exercise 2 (hard): Create a bar chart of mpg count by class filled by drv. Remove the fill legend title, reorder fill labels to "4WD", "Front", "Rear", make keys square (1cm x 1cm), and place the legend at the bottom.

#### Complete Example
End-to-end publication-ready scatter plot with fully customized legend: inside position, custom title, reordered labels, styled keys, horizontal 2-row layout, white background with border.

#### Summary
Table of tasks vs functions: Position → theme(legend.position), Remove → guides(aes = "none"), Title → labs(), Labels → scale_*_discrete(labels=), Style → theme(legend.*), Layout → guide_legend()

#### FAQ (4 questions)
1. How do I merge two legends into one? — Map the same variable to both aesthetics and use the same title with labs().
2. What is the difference between guide_legend() and guide_colorbar()? — guide_legend() for discrete scales, guide_colorbar() for continuous colour/fill scales.
3. How do I change just the legend key shape? — Use the key_glyph argument inside the geom, e.g., geom_point(key_glyph = draw_key_rect).
4. Why does my legend show "a" inside the keys? — This happens with geom_text(). Use show.legend = FALSE on the text layer or override.aes to set alpha = 0.

#### References (6 sources)
1. ggplot2 documentation — guides() reference. [Link](https://ggplot2.tidyverse.org/reference/guides.html)
2. ggplot2 documentation — guide_legend() reference. [Link](https://ggplot2.tidyverse.org/reference/guide_legend.html)
3. ggplot2 documentation — theme() reference. [Link](https://ggplot2.tidyverse.org/reference/theme.html)
4. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). Chapter 11: Scales and Guides. [Link](https://ggplot2-book.org/scales-guides.html)
5. Tidyverse Blog — ggplot2 3.5.0: Legends. [Link](https://tidyverse.org/blog/2024/02/ggplot2-3-5-0-legends/)
6. R-Charts — Legends in ggplot2. [Link](https://r-charts.com/ggplot2/legend/)

#### What's Next?
1. ggplot2 Themes — Master theme_minimal(), theme_classic(), and build your own custom theme.
2. ggplot2 Colour Scales — Control colours with scale_colour_manual(), viridis, and brewer palettes.

## D. Diagram List

Diagrams are optional for FR posts. Skipping — the topic is best taught through code examples rather than flowcharts.

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Base plot with colour legend | ggplot2 | p_base | — |
| 2 | Colour outside aes — no legend | — | p_no_legend | — |
| 3 | Legend at bottom | — | — | p_base |
| 4 | Legend inside plot | — | — | p_base |
| 5 | Remove all legends | — | — | p_base |
| 6 | Remove one legend (colour only) | — | p_two | — |
| 7 | show.legend = FALSE on a layer | — | — | — |
| 8 | Rename title with labs() | — | — | p_base |
| 9 | Rename labels with scale_colour_discrete | — | — | p_base |
| 10 | Reorder labels with factor levels | — | — | — |
| 11 | Style legend title and text | — | — | p_base |
| 12 | Change key background and size | — | — | p_base |
| 13 | Horizontal legend direction | — | — | p_base |
| 14 | guide_legend(nrow = 2) | — | — | p_base |
| 15 | override.aes for point size | — | — | p_base |
| 16 | guide_colorbar for continuous | — | p_cont | — |

Estimated word count: ~3500 words
