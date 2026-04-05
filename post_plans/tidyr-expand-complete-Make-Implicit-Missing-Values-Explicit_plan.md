# Plan: tidyr expand() & complete() in R

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | tidyr expand() & complete() in R: Make Implicit Missing Values Explicit |
| slug | tidyr-expand-complete-Make-Implicit-Missing-Values-Explicit |
| description | Learn how tidyr expand() generates all combinations of variables and complete() fills in missing rows with defaults. Practical R examples with before-and-after output. |
| keywords | tidyr expand, tidyr complete, expand R, complete R, implicit missing values, crossing nesting tidyr, fill missing combinations R, expand_grid tidyr, make missing values explicit R |
| auto_link_terms | expand()\|complete()\|crossing()\|nesting()\|implicit missing values\|tidyr expand\|tidyr complete |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-tidy-2 |
| post_type | FR |
| fr_parent | pivot_longer-pivot_wider-Reshape-Data-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > tidyr > tidyr expand() and complete()

## C. Full Section Outline

### Lead sentence
`expand()` generates every combination of specified variables (including combinations not in your data), and `complete()` does the same while filling the new rows with default values — turning implicit missing values into explicit ones you can see and handle.

### Introduction (2-3 paragraphs)
- **Hook:** Missing data comes in two forms — NA values you can see, and rows that simply don't exist. The second kind is invisible and more dangerous.
- **What/why:** expand() and complete() from tidyr tackle invisible missing data by generating every combination of your variables, surfacing gaps in your data.
- **What you'll learn:** expand() for generating combinations, complete() for filling gaps with defaults, crossing() and nesting() helpers, full_seq() for continuous ranges, and grouped completion.
- **Inline note:** All code runs in the browser. tidyr and dplyr loaded in the first block.

### Core Content Sections

#### H2: What are implicit vs. explicit missing values? (Section 1)
- Theory: Explicit = NA you can see. Implicit = row that doesn't exist at all. Example: sales data where a product had zero sales in Q3 — the row is just absent.
- Code block 1: Load tidyr + dplyr, create a small sales tibble with 3 products x 4 quarters but some combos missing.
- Code block 2: Show how summary stats (mean, count) are wrong when rows are missing vs. when they're NA.
- Callout: KEY INSIGHT — implicit missing values silently distort summaries.

#### H2: How does expand() generate all combinations? (Section 2)
- Theory: expand() creates a tibble of every unique combination of the columns you specify. It doesn't modify your data — it just shows what SHOULD exist.
- Code block 3: Use expand(sales, product, quarter) to see the full grid.
- Code block 4: Compare with anti_join() to find which combos are missing.
- Callout: TIP — use expand() with anti_join() to audit data for missing combos.

#### H2: How do crossing() and nesting() differ? (Section 3)
- Theory: crossing() = all combos (cartesian product), nesting() = only combos already in data. They're standalone helpers you can use outside of expand().
- Code block 5: crossing(product, quarter) vs. nesting(product, quarter) side by side.
- Code block 6: Mix crossing and nesting inside expand() — expand(df, nesting(store, region), quarter).
- Callout: KEY INSIGHT — nesting() preserves real relationships, crossing() generates theoretical ones.

#### H2: How does complete() fill in missing rows? (Section 4)
- Theory: complete() = expand() + left_join() + replace_na() in one step. It keeps your existing data and adds new rows for missing combos.
- Code block 7: complete(sales, product, quarter) — show before/after.
- Code block 8: complete() with fill parameter to set defaults (e.g., revenue = 0 instead of NA).
- Code block 9: The explicit parameter — fill only new rows (explicit = FALSE) vs. all NAs.
- Callout: WARNING — by default fill replaces BOTH implicit and explicit NAs. Use explicit = FALSE to only fill new rows.

#### H2: How do you complete time series with full_seq()? (Section 5)
- Theory: For dates or continuous values, you need full_seq() to generate a regular sequence, not just unique existing values.
- Code block 10: Create a date-based dataset with gaps, use complete() with full_seq(date, period = 1).
- Code block 11: Combine full_seq with fill to carry forward last-known values using tidyr::fill().
- Callout: TIP — pair complete() + full_seq() + fill() for time series gap-filling.

#### H2: How does complete() work with grouped data? (Section 6)
- Theory: With group_by(), complete() operates within each group independently. Useful when different groups should have different complete sets.
- Code block 12: Group by store, complete product x quarter within each store.
- Callout: NOTE — you cannot complete a grouping column itself.

### Common Mistakes (3-5)
1. Forgetting that fill replaces existing NAs too (use explicit = FALSE)
2. Using expand() when you meant complete() — expand returns only the grid, not your data
3. Completing grouped data without realizing grouping columns can't be completed
4. Not using full_seq() for dates — unique dates miss the gaps
5. Creating a combinatorial explosion with too many high-cardinality columns

### Practice Exercises (4)
1. Easy: Use expand() to find all product-quarter combos in a dataset
2. Medium: Use complete() with fill to add zero-revenue rows
3. Medium: Use nesting() inside complete() to preserve store-region pairs
4. Challenging: Complete a date-gapped dataset with full_seq() and fill()

### Complete Example
End-to-end: Load messy sales data → audit missing combos with expand + anti_join → fill with complete → summarize correctly.

### Summary
Table of function comparisons: expand() vs. complete() vs. crossing() vs. nesting() — what each does, when to use it, key arguments.

### FAQ (4 questions)
1. What is the difference between expand() and complete()?
2. Can I use complete() with dates?
3. Does complete() work with grouped data frames?
4. How do I avoid filling pre-existing NAs?

### References (7)
1. tidyr complete() docs — tidyverse.org
2. tidyr expand() docs — tidyverse.org
3. Wickham, H. — R for Data Science, 2nd Ed. Ch. 18 Missing Values
4. tidyr CRAN package PDF (v1.3.2)
5. VP Nagraj — Expand and Complete with tidyr
6. Luis D. Verde — You tidyr::complete() me
7. tidyr GitHub source — complete.R

### What's Next
1. pivot_longer-pivot_wider-Reshape-Data-in-R.html — reshape wide/long data
2. tidyr-separate-unite-Split-Combine-Columns-in-R.html — split and combine columns

## D. Diagram List

No diagrams for this FR post. Before/after code output tables serve as the primary visuals.

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load libraries + create sales data | tidyr, dplyr | sales | — |
| 2 | Show distorted summaries from missing rows | — | sales_summary | sales |
| 3 | expand() to see full grid | — | all_combos | sales |
| 4 | anti_join to find missing combos | — | missing_combos | sales, all_combos |
| 5 | crossing() vs nesting() | — | cross_result, nest_result | sales |
| 6 | Mixed crossing/nesting in expand() | — | stores, mixed_expand | — |
| 7 | complete() basic usage | — | sales_complete | sales |
| 8 | complete() with fill parameter | — | sales_filled | sales |
| 9 | complete() with explicit = FALSE | — | sales_explicit | sales |
| 10 | full_seq() with dates | — | daily_data, daily_complete | — |
| 11 | full_seq + fill for carry-forward | — | daily_filled | daily_data |
| 12 | Grouped complete | — | store_sales, store_complete | — |
| 13 | Complete example end-to-end | — | raw_sales, audit, clean_sales, summary_correct | — |

## Plan Summary

- **Sections:** 14 H2 total (1 Intro + 6 core + 7 tail)
- **Question-form H2s:** 6 core
- **Code blocks:** 13 interactive R blocks + exercise starter blocks
- **Diagrams:** 0
- **Exercises:** 4
- **Estimated word count:** ~2800-3200 words
