# Plan: ggplot2 Scatter Plots

## Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Scatter Plots: Map Color, Size, Shape and Add Trend Lines |
| slug | ggplot2-Scatter-Plots |
| description | Master ggplot2 scatter plots with geom_point(). Map aesthetics like color, size, and shape to variables, add trend lines with geom_smooth(), and avoid overplotting. |
| keywords | ggplot2 scatter plot, geom_point R, ggplot2 geom_point, scatter plot R, ggplot2 color mapping, geom_smooth R, overplotting ggplot2, ggplot2 scatter plot color |
| auto_link_terms | ggplot2 scatter plots\|geom_point()\|geom_smooth()\|scatter plot in R\|ggplot2 scatter plot color\|overplotting in R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.5 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | Scatter Plots |
| sidebar_order | 14 |

## Lead
A scatter plot maps two continuous variables to x and y position, revealing correlation, clusters, and outliers. In ggplot2, `geom_point()` is the core layer — and additional aesthetics and layers transform it into a powerful analytical tool.

## Diagrams
| # | Filename | Figure N | Caption | Section |
|---|---|---|---|---|
| 1 | ggplot2-Scatter-Plots-aesthetics-map.webp | Figure 1 | How data variables map to visual aesthetics in geom_point(). | How do you map color, size, and shape? |
| 2 | ggplot2-Scatter-Plots-overplotting-guide.webp | Figure 2 | Decision guide for fixing overplotting in scatter plots. | How do you handle overplotting? |

## Code Block Master List
| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load ggplot2, create mpg subset | ggplot2 | mpg_sm | — |
| 2 | Basic geom_point() scatter plot | — | p_basic | mpg_sm |
| 3 | Map color + size + shape to variables | — | p_aes | mpg_sm |
| 4 | geom_smooth() with lm and loess methods | — | p_smooth | mpg_sm |
| 5 | Fix overplotting: alpha + jitter + geom_bin2d | — | p_jitter, p_bin | mpg_sm |
| 6 | Label points with geom_text + ggrepel | ggrepel | p_label | mpg_sm |
| 7 | Complete example: faceted scatter with trend line | — | p_final | mpg_sm |
