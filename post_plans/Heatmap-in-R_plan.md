# Plan: Heatmap in R

## Frontmatter

| Field | Value |
|---|---|
| title | Heatmap in R: Build and Customize with ggplot2 geom_tile() |
| slug | Heatmap-in-R |
| description | Create heatmaps in R with ggplot2's geom_tile(). Learn to reshape data, apply color scales, add text labels, cluster rows and columns, and avoid common heatmap mistakes. |
| keywords | heatmap in R, geom_tile ggplot2, ggplot2 heatmap, correlation heatmap R, R heatmap color scale, pivot_longer heatmap R |
| auto_link_terms | heatmap in R\|geom_tile()\|ggplot2 heatmap\|correlation heatmap R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-char-3 |
| post_type | FR |
| fr_parent | ggplot2-Scatter-Plots.html |

## Code Block Master List
| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load libs + basic geom_tile heatmap | ggplot2, tidyr | p_basic | — |
| 2 | Wide-to-long reshape with pivot_longer | — | air_long | — |
| 3 | Sequential color: scale_fill_viridis_c | — | p_seq | air_long |
| 4 | Diverging color: correlation heatmap | — | cor_long, p_corr | — |
| 5 | Text labels inside tiles: geom_text | — | p_label | cor_long |
| 6 | Remove grid lines + clean theme | — | p_clean | p_label |
| 7 | Complete example: polished correlation heatmap | — | p_final | cor_long |
