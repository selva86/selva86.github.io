# Plan: Error Bars in R

## Frontmatter

| Field | Value |
|---|---|
| title | Error Bars in R with ggplot2: SD, SE, and Confidence Intervals |
| slug | Error-Bars-in-R |
| description | Add error bars to ggplot2 plots in R using geom_errorbar(), geom_pointrange(), and geom_linerange(). Learn when to use SD vs SE vs 95% CI and how to compute them with dplyr. |
| keywords | error bars R, geom_errorbar ggplot2, ggplot2 error bars, confidence interval R ggplot2, standard error R plot, geom_pointrange R |
| auto_link_terms | error bars in R\|geom_errorbar()\|geom_pointrange()\|confidence interval plot R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-07 |
| curriculum_id | FR-char-7 |
| post_type | FR |
| fr_parent | ggplot2-Scatter-Plots.html |

## Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load libs + compute summary stats | ggplot2, dplyr | summary_df | — |
| 2 | geom_errorbar on point plot | — | p_errbar | summary_df |
| 3 | geom_pointrange (dot + interval in one) | — | p_pointrange | summary_df |
| 4 | Error bars on bar chart | — | p_bar | summary_df |
| 5 | Horizontal error bars geom_errorbarh | — | p_horiz | — |
| 6 | Complete polished example with CI | — | p_final | summary_df |
