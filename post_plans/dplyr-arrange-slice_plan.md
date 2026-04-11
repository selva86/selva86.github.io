# Plan: dplyr arrange(), slice(), and top_n()

## Frontmatter

| Field | Value |
|---|---|
| title | dplyr arrange(), slice(), and top_n(): Get Exactly the Rows You Want |
| slug | dplyr-arrange-slice |
| description | Sort rows with arrange(), pick positions with slice(), and get top-N per group with slice_max() — the modern successor to top_n() in dplyr 1.1+. |
| keywords | dplyr arrange, dplyr slice, dplyr top_n, slice_max, slice_min, slice_sample, sort rows R, top n per group R |
| auto_link_terms | dplyr arrange\|dplyr slice\|arrange()\|slice()\|slice_max()\|slice_min()\|top_n()\|sort rows in R\|top n per group |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-11 |
| curriculum_id | 1.2.6 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | dplyr arrange & slice |
| sidebar_order | 6 |

Breadcrumb: Home > Data Wrangling > dplyr Essentials > dplyr arrange(), slice(), and top_n()

## Lead sentence

In dplyr, `arrange()` sorts rows, `slice()` picks rows by position, and the `slice_*()` family grabs rows by value or at random — together they answer "give me exactly these rows, in this order."

## First H2 opening (≤80 words)

**H2: How does arrange() sort rows in dplyr?**

When you need to rank, compare, or just eyeball the biggest and smallest values, sorting is the first move. `arrange()` reorders rows by one or more columns — ascending by default, descending with `desc()`. Here's the fastest cars in `mtcars`, ranked by quarter-mile time:

## Sections

### Core (7 question-form H2):
1. **How does arrange() sort rows in dplyr?** — basic arrange, multi-column tie-breaks, desc(). Payoff block: arrange mtcars by qsec, show head. Inline exercise: sort iris by Sepal.Length desc.
2. **How do you sort by multiple columns at once?** — tie-breaking example (mtcars by cyl then desc(mpg)). TIP callout about column order mattering. Inline exercise: sort starwars by species + desc(mass).
3. **What's the difference between arrange() and base R's order()?** — side-by-side comparison, why arrange is clearer. KEY INSIGHT: dplyr verbs keep data frame shape. Inline exercise: rewrite a base R sort using arrange.
4. **How do you pick rows by position with slice()?** — slice(1:5), slice(c(1,3,5)), slice(-1). Inline exercise: slice rows 10-15 from iris.
5. **When should you use slice_head(), slice_tail(), slice_min(), slice_max()?** — the friendly variants. Diagram 1 (family flowchart). Table of variants. Inline exercise: top 5 heaviest starwars chars with slice_max.
6. **How do you get the top N rows per group?** — combine group_by + slice_max. Diagram 2 (top-n-per-group flow). WARNING about ties and with_ties argument. Inline exercise: top 2 mpg per cyl.
7. **Is top_n() still the right way to get the top rows?** — top_n() is superseded since dplyr 1.0.0. NOTE callout. Show equivalences. Inline exercise: rewrite a top_n call using slice_max.

### Tail:
- Practice Exercises (3 capstones)
- Complete Example: starwars rollup — filter, arrange, group-slice top-N
- Summary table
- References (7)
- Continue Learning

## Diagrams

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | dplyr-arrange-slice-family.webp | Figure 1 | Choosing the right slice_*() variant based on how you want to pick rows. | When should you use slice_head(), slice_tail(), slice_min(), slice_max()? |
| 2 | dplyr-arrange-slice-top-n-per-group.webp | Figure 2 | Getting the top rows within each group by combining group_by() and slice_max(). | How do you get the top N rows per group? |

## Code block master list

| # | Demonstrates | Libs | Vars introduced |
|---|---|---|---|
| 1 | arrange by qsec (payoff) | dplyr | fastest_cars |
| 2 | Multi-column arrange | — | cyl_mpg_sort |
| 3 | base R order() comparison | — | base_sorted |
| 4 | slice(1:5), slice(-1) | — | first_five |
| 5 | slice_head / slice_max example | — | heaviest_sw |
| 6 | Top N per group | — | top_by_cyl |
| 7 | top_n vs slice_max | — | old_top_n |
| 8 | Complete example | — | sw_top_mass |

Libraries only on block 1.
