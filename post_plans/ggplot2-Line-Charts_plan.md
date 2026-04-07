# Plan: ggplot2 Line Charts

## Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Line Charts: Connect Points, Group by Variable, and Style Lines |
| slug | ggplot2-Line-Charts |
| description | Create ggplot2 line charts with geom_line(). Learn to group lines by variable, change line types and colors, add points, and handle time series data step by step. |
| keywords | ggplot2 line chart, geom_line R, ggplot2 geom_line, line plot R, ggplot2 multiple lines, ggplot2 time series, geom_step R, ggplot2 group aesthetic |
| auto_link_terms | ggplot2 line charts\|geom_line()\|geom_step()\|line chart in R\|ggplot2 multiple lines\|group aesthetic ggplot2 |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.6 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | Line Charts |
| sidebar_order | 15 |

## Diagrams
| # | Filename | Figure N | Caption | Section |
|---|---|---|---|---|
| 1 | ggplot2-Line-Charts-geom-choice.webp | Figure 1 | Decision guide: geom_line(), geom_path(), or geom_step()? | When should you use geom_step() or geom_path()? |
| 2 | ggplot2-Line-Charts-group-aesthetic.webp | Figure 2 | How the group aesthetic controls one-line-per-category behavior. | How do you draw multiple lines by group? |

## Code Block Master List
| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load ggplot2, create economics_sm subset | ggplot2 | econ_sm | — |
| 2 | Basic geom_line() plot | — | p_basic | econ_sm |
| 3 | Add geom_point() markers on top | — | p_points | econ_sm |
| 4 | Multi-line with group + color | — | p_multi | — (uses built-in Orange data) |
| 5 | Style lines: linetype, linewidth, color | — | p_style | p_multi |
| 6 | Dates on x-axis: scale_x_date + breaks | — | p_dates | econ_sm |
| 7 | geom_step() for staircase lines | — | p_step | — (uses Orange data) |
| 8 | Complete example: economics faceted by metric | — | p_final | econ_sm |
