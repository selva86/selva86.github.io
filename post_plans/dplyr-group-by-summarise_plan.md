# Plan: dplyr group_by() + summarise()

## Frontmatter

| Field | Value |
|---|---|
| title | dplyr group_by() + summarise(): The Combination That Answers Most Business Questions |
| slug | dplyr-group-by-summarise |
| description | Master dplyr group_by() and summarise() to aggregate data by group in R. Learn n(), mean(), .by, multi-group rollups with 10 real-world examples. |
| keywords | dplyr group_by, dplyr summarise, R aggregate by group, split-apply-combine R, dplyr summarize, group_by summarise, R data aggregation, tidyverse group summary |
| auto_link_terms | dplyr group_by\|dplyr summarise\|group_by()\|summarise()\|group by in R\|aggregate by group in R\|split-apply-combine |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-11 |
| curriculum_id | 1.2.5 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | dplyr group_by & summarise |
| sidebar_order | 8 |
| fr_parent | (null) |

Breadcrumb (auto-built): Home > Data Wrangling > dplyr Essentials > dplyr group_by() + summarise()

## Lead sentence

`dplyr::group_by()` splits your data into groups and `summarise()` collapses each group into a single row of aggregated values — together they answer almost every "what's the average X by Y?" question analysts face.

## First H2 opening plan (≤80 words)

**H2: What does group_by() + summarise() actually do?**

Most analytical questions sound the same: *"What's the average by category?"* *"Which segment spends the most?"* *"How many orders per month?"* All of them follow one pattern — split rows into groups, apply a function, combine the results. `group_by()` marks the split and `summarise()` does the apply-and-combine in one step. Here's the payoff on `mtcars`:

## Section outline

### 1. H2: What does group_by() + summarise() actually do? (payoff)
- First code block: load dplyr, group mtcars by cyl, summarise avg mpg + n
- Prose interpretation walks through the 3-row output
- Inline diagram 1: split-apply-combine
- Inline exercise: repeat on iris by Species (mean Sepal.Length)

### 2. H2: How do you summarise multiple columns at once?
- Multiple summary functions in one summarise() call (mean, median, sd, n)
- Introduce n() specifically — it counts rows per group
- TIP callout: naming conventions (avg_mpg not mean_mpg_cyl)
- Inline exercise: add sd_mpg and min_mpg

### 3. H2: How do you group by more than one variable?
- group_by(cyl, gear) → nested summary
- Explain peeling behavior briefly here, full detail in section 5
- Inline exercise: group starwars by species + sex, count n

### 4. H2: Which summary functions work inside summarise()?
- Table of common functions: mean, median, sd, var, min, max, n, n_distinct, first, last, quantile
- Show n_distinct() example
- KEY INSIGHT callout: any function that returns length 1 works
- Inline exercise: count distinct hair_color per species in starwars

### 5. H2: What does the .groups argument do after summarise()?
- The "peeling" behavior — summarise() drops the last grouping layer
- The warning message everyone sees
- Show .groups = "drop" / "keep" / "drop_last"
- Inline diagram 2: peeling flow
- WARNING callout: forgotten groups cause silent bugs downstream
- Inline exercise: set .groups = "drop" explicitly

### 6. H2: When should you use the new .by argument instead?
- dplyr 1.1+ .by argument for inline grouping
- Pros: no group_by() + ungroup() dance; always returns ungrouped result
- Cons: doesn't persist across pipeline
- Side-by-side comparison
- NOTE callout: requires dplyr 1.1.0+
- Inline exercise: rewrite a group_by call using .by

### 7. H2: How do you filter groups after summarising?
- Common pattern: summarise → filter aggregated results
- Example: find cyl groups where mean mpg > 20
- Introduce arrange(desc()) for ranking
- Inline exercise: top-2 gear groups by mean hp

### Tail: Practice Exercises
- Exercise 1 (medium): In starwars, compute mean height and count per homeworld, filter to homeworlds with 2+ characters
- Exercise 2 (hard): In mtcars, create mpg-per-cylinder ranking — group by cyl, summarise mean mpg, arrange, add rank column
- Exercise 3 (hard): In diamonds, for each cut, compute median price and price-per-carat, then find the cut with highest price efficiency

### Tail: Complete Example
End-to-end: starwars → filter non-NA mass → group_by species → summarise n, avg_height, avg_mass → filter n >= 2 → arrange desc(avg_mass)

### Tail: Summary
Table: function | what it does | example

### Tail: References
1. dplyr reference — group_by()
2. dplyr reference — summarise()
3. dplyr 1.1.0 release notes (.by)
4. R for Data Science Ch 4: Data transformation
5. dplyr grouping vignette
6. Tidyverse blog: dplyr 1.0.0 summarise
7. Wickham: split-apply-combine paper (JSS 2011)

### Tail: Continue Learning
1. dplyr filter() and select()
2. dplyr mutate() and rename()
3. R Pipe Operator

## Diagrams

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | dplyr-group-by-summarise-split-apply-combine.webp | Figure 1 | The split-apply-combine pattern that group_by() + summarise() implements. | What does group_by() + summarise() actually do? |
| 2 | dplyr-group-by-summarise-groups-peeling.webp | Figure 2 | Each summarise() call peels off one grouping layer. | What does the .groups argument do after summarise()? |

## Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Payoff: avg mpg by cyl | dplyr | mpg_by_cyl | — |
| 2 | Multiple summary cols | — | mtcars_stats | — |
| 3 | Multi-column grouping | — | cyl_gear_stats | — |
| 4 | n_distinct example | — | sw_stats | — |
| 5 | .groups = "drop" | — | cyl_gear_dropped | — |
| 6 | .by inline grouping | — | by_cyl | — |
| 7 | summarise + filter + arrange | — | top_cyl | — |
| 8 | Complete example (starwars rollup) | — | species_summary | — |
| 9 | Inline exercise 1 (iris) scaffolded | — | ex_iris_stats | — |
| 10 | Inline exercise 2 (sd/min mpg) | — | ex_mtcars_stats | — |
| 11 | Inline exercise 3 (starwars species/sex) | — | ex_sw_counts | — |
| 12 | Inline exercise 4 (distinct hair_color) | — | ex_hair_counts | — |
| 13 | Inline exercise 5 (.groups="drop") | — | ex_drop_stats | — |
| 14 | Inline exercise 6 (.by rewrite) | — | ex_by_rewrite | — |
| 15 | Inline exercise 7 (top-2 gear) | — | ex_top_gear | — |
| 16 | Capstone 1 (homeworld) | — | my_homeworld | — |
| 17 | Capstone 2 (mpg rank) | — | my_mpg_rank | — |
| 18 | Capstone 3 (diamonds) | — | my_cut_eff | — |

Libraries only on block 1 (dplyr). diamonds comes from ggplot2 — load in block 18.
