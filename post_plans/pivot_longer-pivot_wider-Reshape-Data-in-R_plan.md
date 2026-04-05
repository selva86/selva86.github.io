# Plan: pivot_longer() and pivot_wider()

## Frontmatter

| Field | Value |
|---|---|
| title | pivot_longer() and pivot_wider(): Reshape Data in R Without Losing Your Mind |
| slug | pivot_longer-pivot_wider-Reshape-Data-in-R |
| description | Reshaping wide-to-long and long-to-wide is a daily task in R. pivot_longer() and pivot_wider() from tidyr handle it cleanly with simple arguments. |
| keywords | pivot_longer, pivot_wider, tidyr, reshape data R, wide to long R, long to wide R, names_to, values_to, names_from, values_from |
| auto_link_terms | pivot_longer()\|pivot_wider()\|pivot longer\|pivot wider\|reshape data in R\|wide to long format\|long to wide format |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.2.8 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | pivot_longer & pivot_wider |
| sidebar_order | 9 |
| fr_parent | (none) |

## Breadcrumb

Home > Data Wrangling > tidyr > pivot_longer() and pivot_wider()

## Lead sentence

pivot_longer() stacks multiple columns into a single key-value pair (wide -> long). pivot_wider() spreads one column's values across new columns (long -> wide). They are inverses.

## Introduction

Hook: reshaping data is one of those skills that feels hard until you see it once, then it clicks forever. Most messy datasets arrive wide when analysis needs them long (or vice versa).

Explain: tidyr ships pivot_longer() and pivot_wider() as the modern replacements for gather() and spread(). They use clearer argument names and handle edge cases that broke the old functions. Code runs in the browser; no install needed.

## Core H2 sections (question-form)

1. What is the difference between wide and long format? — visual with diagram 1, simple example.
2. How does pivot_longer() turn wide data into long? — anatomy with diagram 2, relig_income-style example.
3. How does pivot_wider() turn long data into wide? — anatomy with diagram 3, reverse example.
4. How do you pivot multiple value columns at once? — names_sep / names_pattern with billboard-style names.
5. How do you control the pivot with names_prefix, names_sep, and values_fill? — nuance example.

## Tail sections

6. Common Mistakes and How to Fix Them (4 mistakes)
7. Practice Exercises (4 exercises)
8. Complete Example (scores wide -> long -> wider averages)
9. Summary (table)
10. FAQ (4 Qs)
11. References
12. What's Next

## Diagrams

| # | Filename | Figure | Caption | Placed in |
|---|---|---|---|---|
| 1 | pivot_longer-pivot_wider-wide-vs-long.webp | Figure 1 | Wide and long are two shapes for the same data. | What is the difference between wide and long format? |
| 2 | pivot_longer-pivot_wider-longer-anatomy.webp | Figure 2 | pivot_longer() needs three answers: which columns, a name column, a value column. | How does pivot_longer() turn wide data into long? |
| 3 | pivot_longer-pivot_wider-wider-anatomy.webp | Figure 3 | pivot_wider() needs to know the identifier, the name source, and the value source. | How does pivot_wider() turn long data into wide? |

## Code blocks master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Create wide + load tidyr | tidyr, dplyr | wide_scores | — |
| 2 | First pivot_longer | — | long_scores | wide_scores |
| 3 | cols selection helpers | — | — | wide_scores |
| 4 | pivot_wider back | — | wide_again | long_scores |
| 5 | Multi-column names_sep | — | billboard_long | billboard |
| 6 | names_prefix + values_fill | — | sales_wide | sales_long |
| 7 | Complete example | — | class_scores, summary_tbl | — |
| 8 | Exercise 1 solution | — | my_long | — |
| 9 | Exercise 2 solution | — | my_wide | — |
| 10 | Exercise 3 solution | — | my_clean | — |
| 11 | Exercise 4 solution | — | my_summary | — |

## Callouts planned

- TIP: starts_with(), ends_with(), matches() inside cols
- WARNING: pivot_wider collapses duplicate keys by making list-columns
- NOTE: gather() and spread() are retired, don't teach them
- KEY INSIGHT: long format is what ggplot2 and group_by expect
- TIP: values_fill closes holes in sparse panel data
