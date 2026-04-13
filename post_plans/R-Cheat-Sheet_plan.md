# R Cheat Sheet — Post Plan

## A. Frontmatter

```yaml
title: "R Cheat Sheet: 200 Functions Across dplyr, ggplot2, Stats — Printable"
slug: "R-Cheat-Sheet"
description: "The ultimate R cheat sheet: 200 functions across dplyr, ggplot2, base R, statistics, strings, and dates with arguments and one-line examples."
keywords: "R cheat sheet, dplyr cheat sheet, ggplot2 cheat sheet, R functions reference, base R functions, R quick reference, R programming cheat sheet"
auto_link_terms: "R cheat sheet|R quick reference|R functions reference|dplyr cheat sheet|ggplot2 cheat sheet"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "CHT1"
post_type: "FR"
fr_parent: "Getting-Help-in-R.html"
```

## B. Breadcrumb (auto-generated)

`Home > Learn R > Comparisons > R Cheat Sheet`

## C. Outline

### Lead sentence (featured snippet)

"This R cheat sheet lists the 200 most-used functions across base R, dplyr, ggplot2, statistics, strings, and dates — each with a one-line description and a runnable example you can try right here in your browser."

### First H2 opening plan (≤80 words)

"You didn't come here to read — you came to look something up. So let's open with the one pattern that covers 80% of real R work: load a dataset, filter rows, compute a summary. Every function used below is listed in a table further down, but seeing them together first builds the mental model that makes the rest of this page easier to scan."

### Core H2 sections (6 question-form headings)

**H2.1: Which base R functions should I know by heart?** (~40 functions)
- Theory: Base R is the foundation — every tidyverse package is built on it.
- Tables: Vectors & sequences, Type checking & conversion, Math & logic
- Code block 1 (payoff): load mtcars, show `head()`, `summary()`, `nrow()`, `sapply()` in one demo
- Callout: [KEY INSIGHT] Vectorization > loops
- Inline exercise: use `seq_len()` + `rev()` on a vector

**H2.2: How do I manipulate data frames with dplyr?** (~40 functions)
- Theory: dplyr verbs form a grammar of data manipulation; pipes chain them
- Tables: Row operations (filter, slice, arrange, distinct), Column operations (select, mutate, rename, relocate), Grouping & aggregation (group_by, summarise, count), Joins (left_join, inner_join, etc.), Reshaping (pivot_longer, pivot_wider)
- Code block 2: filter + group_by + summarise on mtcars
- Callout: [TIP] native pipe `|>` vs magrittr `%>%`
- Inline exercise: filter airquality to hot summer days, count them

**H2.3: How do I build plots with ggplot2?** (~30 functions)
- Theory: Grammar of graphics — data + aes + geom + theme
- Tables: Geoms (geom_point, geom_line, geom_bar, geom_boxplot, geom_histogram, geom_smooth, geom_density, geom_violin, geom_tile, geom_col, geom_area, geom_jitter, geom_ribbon), Scales & labels (scale_x_*, labs, xlim, ylim), Facets (facet_wrap, facet_grid), Themes (theme_minimal, theme, element_text), Position (position_dodge, position_jitter)
- Code block 3: scatter plot of mtcars mpg vs wt with color by cyl
- Callout: [NOTE] ggplot2 requires `library(ggplot2)`
- Inline exercise: add a title and theme_minimal to a histogram

**H2.4: Which statistics functions do I use most?** (~30 functions)
- Theory: R was built for statistics — these functions have been refined since 1993
- Tables: Descriptive (mean, median, sd, var, quantile, IQR, summary), Distributions (dnorm/pnorm/qnorm/rnorm family — r/d/p/q pattern), Tests (t.test, wilcox.test, chisq.test, cor.test, shapiro.test, ks.test), Modeling (lm, glm, aov, anova, predict, residuals, coef, confint)
- Code block 4: t.test comparing 4-cyl vs 6-cyl mpg; lm on wt ~ mpg
- Callout: [KEY INSIGHT] r/d/p/q naming convention across all distributions
- Inline exercise: fit a linear model of hp ~ mpg and print coefficients

**H2.5: How do I handle strings and dates in R?** (~30 functions)
- Theory: Base R + stringr + lubridate cover 99% of text and time work
- Tables: String basics (paste, paste0, sprintf, nchar, substr, toupper, tolower, trimws), Pattern matching (grep, grepl, gsub, sub, regmatches, strsplit, startsWith, endsWith), stringr (str_detect, str_replace, str_extract, str_split, str_trim, str_to_lower), Dates (Sys.Date, as.Date, format, difftime, seq.Date, weekdays), lubridate (ymd, mdy, dmy, year, month, day, wday, hours, minutes, today, now)
- Code block 5: parse dates, compute day-of-week, extract year
- Callout: [WARNING] Base R dates vs lubridate gotchas (timezones)
- Inline exercise: extract year from a character date vector

**H2.6: What about I/O, control flow, and functional programming?** (~30 functions)
- Theory: The glue that holds scripts together
- Tables: I/O (read.csv, readr::read_csv, write.csv, readRDS, saveRDS, readLines, file.exists, dir), Control flow (if/else, for, while, repeat, break, next, switch, stopifnot), Apply family (apply, lapply, sapply, vapply, mapply, tapply, Map, Reduce, Filter, Find, Position), purrr (map, map_dbl, map_chr, map_df, walk, keep, discard, reduce), Error handling (tryCatch, try, withCallingHandlers)
- Code block 6: sapply over mtcars columns to compute means; tryCatch on log(-1)
- Callout: [TIP] purrr's typed map functions guarantee return type
- Inline exercise: use `sapply()` to compute class of each column in iris

### Tail sections

**Practice Exercises** (2 capstone — harder, multi-concept):
- Exercise 1 (medium): Filter mtcars to cars with mpg > 20, group by cyl, summarise mean hp, then arrange by mean hp descending. Combines filter + group_by + summarise + arrange (dplyr).
- Exercise 2 (hard): Build a plot showing the relationship between mpg and wt from mtcars, colored by factor(cyl), with a linear trend line per group and a minimal theme. Combines ggplot2 aes + geom_point + geom_smooth + scale_color + theme.

**Complete Example** — End-to-end mini analysis of airquality: load, clean NAs, pivot long, group by month, compute mean ozone, plot a bar chart. Demonstrates ~15 functions from different categories in one 20-line pipeline.

**Summary** — "Function lookup by task" table: one row per task ("filter rows", "sort rows", "reshape wide→long", "fit model", "parse date", etc.) mapped to the go-to function.

**References**:
1. R Core Team — *An Introduction to R* manual — https://cran.r-project.org/doc/manuals/r-release/R-intro.html
2. Wickham, H. & Grolemund, G. — *R for Data Science* 2e — https://r4ds.hadley.nz/
3. dplyr function reference — https://dplyr.tidyverse.org/reference/
4. ggplot2 function reference — https://ggplot2.tidyverse.org/reference/
5. stringr reference — https://stringr.tidyverse.org/reference/
6. lubridate reference — https://lubridate.tidyverse.org/reference/
7. purrr reference — https://purrr.tidyverse.org/reference/
8. Posit cheatsheets collection — https://posit.co/resources/cheatsheets/
9. R Language Definition — https://cran.r-project.org/doc/manuals/r-release/R-lang.html

**Continue Learning** (2 related posts):
- `Getting-Help-in-R.html` — How to search R's help system when a function isn't here
- `R-for-Excel-Users.html` — Mapping Excel formulas to R functions

## D. Diagrams

Skipping diagrams entirely. An FR cheat sheet is reference content; a mindmap would duplicate the Summary table and push the first code block below the fold.

## E. Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Base R snapshot of mtcars — payoff | — | `fast_cars` | — |
| 2 | dplyr filter → group_by → summarise | `dplyr` | `mpg_by_cyl` | `mtcars` (builtin) |
| 3 | ggplot2 scatter + smooth + color | `ggplot2` | `p1` | `mtcars` (builtin) |
| 4 | t.test + lm + coef | — | `tt`, `fit` | `mtcars` (builtin) |
| 5 | Strings and dates | — | `dates`, `years` | — |
| 6 | sapply + tryCatch | — | `col_means` | `mtcars` (builtin) |
| Inline exercises (6) | one per core H2 | — | `ex_*` vars | — |
| Capstone (2) | dplyr pipeline + ggplot2 plot | — | `my_result`, `my_plot` | `mtcars` (builtin) |
| Complete example (1) | end-to-end airquality analysis | `tidyr` | `aq_clean`, `aq_monthly` | `airquality` (builtin) |

Rules honored: library calls are additive (dplyr in Block 2, ggplot2 in Block 3, tidyr only in Complete Example). Block 1 is pure base R so it's the fastest path to a visible payoff.

## F. Word count estimate

- Lead + first H2 opening: ~130 words
- 6 core H2 sections × ~450 words prose+tables: ~2700 words
- Practice Exercises: ~350 words
- Complete Example: ~300 words
- Summary + References + Continue Learning: ~400 words
- **Total: ~3900 words** (appropriate for a reference page with 200 entries)
