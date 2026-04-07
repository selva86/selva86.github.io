# Plan: ggplot2 Distribution Charts

## Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Distribution Charts: Histograms, Density, Boxplots — When to Use Each |
| slug | ggplot2-Distribution-Charts |
| description | Master ggplot2 distribution charts: histogram, density, boxplot, and violin — with guidance on bin widths, bandwidth tuning, and when each type misleads. |
| keywords | ggplot2 histogram, ggplot2 density plot, ggplot2 boxplot, geom_histogram, geom_density, geom_boxplot, geom_violin, distribution plot R, ggplot2 distribution |
| auto_link_terms | ggplot2 distribution charts\|geom_histogram()\|geom_density()\|geom_boxplot()\|geom_violin()\|histogram in R\|density plot ggplot2 |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-07 |
| curriculum_id | 1.3.4 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | Distribution Charts |
| sidebar_order | 13 |

## Lead
Distribution charts show how your data is spread — where values cluster, where they thin out, and whether there are outliers. ggplot2 offers four main types: histograms, density plots, boxplots, and violin plots.

## Diagrams
| # | Filename | Figure N | Caption | Section |
|---|---|---|---|---|
| 1 | ggplot2-Distribution-Charts-chart-decision.webp | Figure 1 | Decision guide: which distribution chart fits your situation. | Introduction |
| 2 | ggplot2-Distribution-Charts-chart-anatomy.webp | Figure 2 | Anatomy of a boxplot — each element and what it represents. | How do boxplots summarise a distribution? |

## Code Block Master List
| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load ggplot2, create diamonds subset | ggplot2 | diamonds_sm | — |
| 2 | geom_histogram basic + binwidth | — | p_hist | diamonds_sm |
| 3 | geom_density basic + adjust | — | p_density | diamonds_sm |
| 4 | geom_histogram + geom_density overlay | — | p_overlay | diamonds_sm |
| 5 | geom_boxplot single + grouped | — | p_box | diamonds_sm |
| 6 | geom_violin + embedded boxplot | — | p_violin | diamonds_sm |
| 7 | Complete example: all 4 in patchwork | patchwork | combined | p_hist, p_density, p_box, p_violin |
