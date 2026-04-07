# Plan: geom_smooth in R

## Frontmatter

| Field | Value |
|---|---|
| title | geom_smooth in R: Add Trend Lines and Confidence Bands to Plots |
| slug | geom_smooth-in-R |
| description | Master geom_smooth() in ggplot2. Learn LOESS vs. linear vs. polynomial smooths, adjust span, control confidence bands, and add custom smooths with formula and method arguments. |
| keywords | geom_smooth R, ggplot2 trend line, loess R ggplot2, geom_smooth method lm, confidence band ggplot2, R smooth line scatter plot |
| auto_link_terms | geom_smooth()\|ggplot2 trend line\|loess smooth R\|regression line ggplot2 |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-07 |
| curriculum_id | FR-char-8 |
| post_type | FR |
| fr_parent | ggplot2-Scatter-Plots.html |

## Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Default geom_smooth (LOESS) | ggplot2 | p_loess | — |
| 2 | Linear smooth method = "lm" | — | p_lm | — |
| 3 | Polynomial smooth with formula | — | p_poly | — |
| 4 | Customize CI: se, level, fill | — | p_ci | — |
| 5 | Per-group smooths with color | — | p_group | — |
| 6 | Complete polished example | — | p_final | — |
