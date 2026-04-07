# Plan: ggplot2 Bar Charts

## Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Bar Charts: geom_bar(), geom_col(), Stacked, Dodged and Ordered |
| slug | ggplot2-Bar-Charts |
| description | Master ggplot2 bar charts with geom_bar() and geom_col(). Learn to create stacked, dodged, and ordered bars, flip coordinates, and add labels with complete code examples. |
| keywords | ggplot2 bar chart, geom_bar R, geom_col ggplot2, ggplot2 stacked bar, ggplot2 grouped bar, fct_reorder bar chart, ggplot2 horizontal bar, bar chart R |
| auto_link_terms | ggplot2 bar charts\|geom_bar()\|geom_col()\|bar chart in R\|stacked bar chart ggplot2\|fct_reorder ggplot2 |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.7 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | Bar Charts |
| sidebar_order | 16 |

## Diagrams
| # | Filename | Figure N | Caption | Section |
|---|---|---|---|---|
| 1 | ggplot2-Bar-Charts-geom-decision.webp | Figure 1 | Decision guide: geom_bar() for raw data, geom_col() for pre-computed values. | What is the difference between geom_bar() and geom_col()? |
| 2 | ggplot2-Bar-Charts-position-guide.webp | Figure 2 | Position options for grouped bars: dodge, stack, and fill. | How do you create stacked and dodged bar charts? |

## Code Block Master List
| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load ggplot2 + forcats, create mpg and summary data | ggplot2, forcats | mpg_counts, mpg_avg | — |
| 2 | geom_bar() — counts from raw data | — | p_bar | mpg |
| 3 | geom_col() — heights from pre-computed values | — | p_col | mpg_avg |
| 4 | Stacked bars + dodged bars (position argument) | — | p_stack, p_dodge | mpg |
| 5 | Percent-stacked bars (position_fill) | — | p_fill | mpg |
| 6 | Reorder bars with fct_reorder | — | p_ordered | mpg_avg |
| 7 | Add labels: geom_text + geom_label | — | p_label | mpg_avg |
| 8 | Horizontal bars with coord_flip | — | p_horiz | p_ordered |
| 9 | Complete example: polished bar chart with labels | — | p_final | mpg |
