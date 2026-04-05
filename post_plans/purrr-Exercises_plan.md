# Plan: purrr Exercises

## Frontmatter

| Field | Value |
|---|---|
| title | purrr Exercises: 10 Functional Programming Practice Problems — Solved Step-by-Step |
| slug | purrr-Exercises |
| description | Practise purrr with 10 functional programming problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced. |
| keywords | purrr exercises, purrr map exercises, functional programming R exercises, purrr practice problems, map2 pmap exercises, tidyverse iteration practice, R functional programming practice, purrr tutorial problems |
| auto_link_terms | purrr exercises\|purrr practice problems\|purrr map exercises\|functional programming exercises R\|map2 practice\|pmap practice\|map_dfr exercises |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | E2.8 |
| post_type | EX |
| sidebar_title | purrr (10 problems) |
| fr_parent | Functional-Programming-in-R.html |

## Breadcrumb
Home > Learn R > Functional Programming > purrr Exercises

## Structure

**Lead:** Ten runnable exercises to practise `purrr::map()`, `map2()`, `pmap()`, typed variants, row-wise operations, and safe iteration — each with a worked solution and explanation you can run in your browser.

**Introduction:** Opens with why practising purrr matters (reading vs fluency), the progression of the ten problems (easy map → typed variants → map2/pmap → list-columns → safely), and how to use the shared session. Reference parent tutorial on Functional Programming in R.

**Quick Reference table** of purrr functions used.

**First code block:** Load purrr + dplyr, preview datasets (mtcars, iris, starwars for NAs).

### Core sections (grouped by difficulty)

1. **Easy (1-3):** map basics — `map()`, `map_dbl()`, `map_chr()`
2. **Medium (4-7):** `map_lgl()`, `map_dfr()`, `map2()`, `pmap()`
3. **Challenging (8-10):** list-columns with `nest()`+`map()`, `safely()`, anonymous-function shortcuts with `\(x)` or `~.x`

### Exercises (10 total)

1. Compute column means with `map_dbl()` — mtcars
2. Get class of each column with `map_chr()` — iris
3. Number of unique values per column with `map_int()` — iris
4. Filter columns where all values positive using `map_lgl()`
5. Fit lm per cylinder group, return tibble with `map_dfr()`
6. Pairwise `map2()` — compute weighted averages
7. `pmap()` with 3 arguments — generate formatted strings
8. Nest-map pattern — correlation of mpg~wt per cyl group
9. `safely()` + log() — handle negative inputs gracefully
10. Anonymous function shortcut — scale each numeric column with `\(x)` lambda

### Tail sections
- Summary: table of functions practised + takeaway
- FAQ: 4 Q&As (map vs sapply, anonymous function syntax, what replaces do.call, typed variants vs map+unlist)
- References: purrr docs, Advanced R, R4DS Iteration, tidyverse blog
- What's Next: Functional Programming in R, purrr-map-Variants, R-Functional-Programming-Exercises (sibling set)

## Code block plan

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Setup | purrr, dplyr | — | — |
| 2 | Ex1 solution: map_dbl means | — | my_means | — |
| 3 | Ex2 solution: map_chr class | — | my_classes | — |
| 4 | Ex3 solution: map_int n_distinct | — | my_uniques | — |
| 5 | Ex4 solution: map_lgl all positive | — | my_positive | — |
| 6 | Ex5 solution: map_dfr per group | — | my_models | — |
| 7 | Ex6 solution: map2 weighted | — | my_wtd | — |
| 8 | Ex7 solution: pmap format strings | — | my_labels | — |
| 9 | Ex8 solution: nest+map correlations | — | my_cors | — |
| 10 | Ex9 solution: safely log | — | my_safe | — |
| 11 | Ex10 solution: lambda scaling | — | my_scaled | — |

Each exercise also has a starter block (runnable but skeleton). All user vars start with `my_`.

## Callouts (~5 for ~2500 word post)

- TIP after Ex3: typed variants return vectors not lists
- KEY INSIGHT after Ex5: map_dfr = iterate + row-bind
- WARNING after Ex6: map2 requires equal-length inputs
- TIP after Ex8: nest + map is the tidyverse answer to split-apply-combine
- KEY INSIGHT after Ex10: lambda shortcuts keep functional code compact

## No diagrams (EX post)
