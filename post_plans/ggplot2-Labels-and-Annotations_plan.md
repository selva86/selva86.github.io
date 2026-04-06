# Plan: ggplot2 Labels and Annotations

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | ggplot2 Labels and Annotations: Add Context Without Cluttering Your Chart |
| slug | ggplot2-Labels-and-Annotations |
| description | Label your plots effectively: labs() for titles and axis labels, geom_text() and geom_label() for data labels, ggrepel for non-overlapping annotations. |
| keywords | ggplot2 labels, ggplot2 annotations, geom_text, geom_label, ggrepel, annotate ggplot2, labs ggplot2, ggplot2 titles, ggplot2 captions, geom_text_repel |
| auto_link_terms | ggplot2 labels\|ggplot2 annotations\|geom_text()\|geom_label()\|ggrepel\|annotate()\|labs()\|geom_text_repel() |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.11 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | Labels & Annotations |
| sidebar_order | 6 |

## B. Breadcrumb

Home > Visualization > The Grammar of Graphics > ggplot2 Labels and Annotations

## C. Full Section Outline

### Lead sentence
Labels and annotations turn a raw ggplot2 chart into a self-explanatory story — use labs() for titles, geom_text() for data-driven labels, ggrepel for overlap-free placement, and annotate() for custom callouts.

### Introduction (2-3 paragraphs)
- Hook: A chart without labels is like a map without street names — technically accurate but useless.
- What: ggplot2 gives you five labeling tools spanning metadata to per-point annotations.
- What you'll learn: labs(), geom_text(), geom_label(), ggrepel, annotate(), and how to combine them.
- Uses ggplot2 + ggrepel (both WebR-compatible). Base dataset: mtcars.

### Core H2 Sections (5 sections)

#### H2-1: How does labs() control titles, axes, and captions?
- Theory: labs() is the single function for all plot metadata text.
- Code: title, subtitle, caption, x/y, tag. Show theme() styling.
- Callout: TIP — Use caption for data source attribution.
- Inline exercise: Add a title, subtitle, and caption to a blank scatter.

#### H2-2: How do geom_text() and geom_label() place data-driven labels?
- Theory: Both map label aesthetic to a column. geom_label adds background box.
- Code: Basic geom_text on mtcars, then geom_label with padding/fill. Show nudge_x/nudge_y, hjust/vjust, check_overlap.
- Diagram: Decision flow (Figure 2) placed here.
- Callout: WARNING — geom_text size is in mm, not points.
- Inline exercise: Label only cars with mpg > 30 using geom_text.

#### H2-3: How does ggrepel prevent overlapping labels?
- Theory: ggrepel's physics engine pushes labels apart with connecting segments.
- Code: geom_text_repel() basic, then geom_label_repel() with styling. Show max.overlaps, box.padding, segment.color.
- Callout: KEY INSIGHT — ggrepel is deterministic with set.seed().
- Inline exercise: Use geom_text_repel to label the top-5 heaviest cars.

#### H2-4: How does annotate() add custom text, shapes, and arrows?
- Theory: annotate() is for non-data-driven marks at fixed coordinates.
- Code: annotate("text"), annotate("rect"), annotate("segment" with arrow()). Show geom_curve for curved arrows.
- Callout: TIP — Use annotate("rect") with alpha for highlighting regions.
- Inline exercise: Add an annotation arrow pointing to a specific data point.

#### H2-5: How do you style and position label text with theme()?
- Theory: theme() + element_text() controls font, size, color, alignment of all text.
- Code: theme(plot.title, axis.title, axis.text). Show hjust centering, face, family.
- Diagram: Layer stack (Figure 3) placed here.
- Callout: NOTE — hjust = 0.5 centers, 0 = left, 1 = right.
- Inline exercise: Center the title and make axis titles bold.

### Common Mistakes (3-5)
1. Forgetting that geom_text size is in mm (not ggplot2's default point scale)
2. Using geom_text on dense data instead of ggrepel (overlapping mess)
3. Putting label text in aes() when it should be a fixed string in annotate()
4. Not setting check_overlap or using ggrepel — labels pile up
5. Hardcoding annotate() coordinates that break when data range changes

### Practice Exercises (2 capstone)
1. Medium: Build a scatter of mtcars (wt vs mpg), add title/subtitle/caption with labs(), label only 6-cylinder cars with geom_text_repel.
2. Hard: Create a bar chart of mean mpg by cyl, add value labels on top of bars with geom_text, annotate a rectangle around the highest bar, and add a curved arrow with a note.

### Complete Example
End-to-end: mtcars scatter with labs(), geom_text_repel for top 5, annotate() arrow and rect, styled with theme().

### Summary
Table: Function | Purpose | Data-driven? | Key args

### FAQ (4 questions)
1. What is the difference between geom_text() and geom_label()?
2. Can I use markdown or HTML in ggplot2 labels?
3. How do I label only specific points, not all of them?
4. Why do my ggrepel labels still overlap?

### References (7 sources)
1. ggplot2 docs — labs(), geom_text()
2. ggrepel CRAN docs
3. ggplot2 Book Ch.8 Annotations
4. R Graph Gallery — text labels
5. R-Charts — text annotations
6. Wickham — ggplot2: Elegant Graphics 3e
7. tidyverse blog

### What's Next
1. ggplot2 Themes → customize the overall look
2. ggplot2 Facets → split plots by groups
3. ggplot2 Scales → control axes and legends

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | ggplot2-Labels-and-Annotations-overview-mindmap.webp | Figure 1 | Overview of ggplot2 labeling and annotation functions. | Introduction |
| 2 | ggplot2-Labels-and-Annotations-decision-flow.webp | Figure 2 | Decision guide: which labeling function fits your need. | How do geom_text() and geom_label() place data-driven labels? |
| 3 | ggplot2-Labels-and-Annotations-layer-stack.webp | Figure 3 | How annotation layers stack onto a base plot. | How do you style and position label text with theme()? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load libs + base scatter | ggplot2, ggrepel | p_base | — |
| 2 | labs() full demo | — | p_labs | p_base |
| 3 | theme() title styling | — | — | p_labs |
| 4 | Inline ex: labs() | — | ex_plot | — |
| 5 | geom_text() basic | — | p_text | — |
| 6 | geom_label() with styling | — | p_label | — |
| 7 | nudge + hjust + check_overlap | — | — | — |
| 8 | Inline ex: selective labels | — | ex_text | — |
| 9 | geom_text_repel() basic | — | p_repel | — |
| 10 | geom_label_repel() styled | — | p_lrepel | — |
| 11 | max.overlaps + box.padding | — | — | — |
| 12 | Inline ex: top-5 heavy | — | ex_repel | — |
| 13 | annotate("text") | — | p_ann | — |
| 14 | annotate("rect") + segment + arrow | — | p_shapes | — |
| 15 | Inline ex: arrow annotation | — | ex_ann | — |
| 16 | theme() text styling | — | p_styled | — |
| 17 | Inline ex: center + bold | — | ex_theme | — |
| 18 | Mistake 1: size mm vs pt | — | — | — |
| 19 | Mistake 2: dense geom_text | — | — | — |
| 20 | Mistake 3: aes vs fixed | — | — | — |
| 21 | Capstone exercise 1 starter | — | — | — |
| 22 | Capstone exercise 2 starter | — | — | — |
| 23 | Complete example | — | final_plot | — |
