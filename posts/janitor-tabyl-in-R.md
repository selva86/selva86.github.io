---
title: "janitor tabyl() in R: Frequency and Cross-Tab Tables"
slug: "janitor-tabyl-in-R"
description: "Use janitor tabyl() to build clean frequency tables and cross-tabs in R. Covers 1-way, 2-way, 3-way tables plus adorn_totals and adorn_percentages helpers."
keywords: "janitor tabyl, tabyl function R, janitor tabyl examples, R frequency table tabyl, tabyl cross tab R, adorn_totals R, adorn_percentages"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "tabyl()|janitor tabyl|janitor::tabyl()|frequency table in R|cross-tabulation in R"
auto_link_case_sensitive: true
target_keyword: "janitor tabyl"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor tabyl() in R: Frequency and Cross-Tab Tables

<p class="lead">The <code>tabyl()</code> function in janitor builds tidy frequency tables and cross-tabulations from a data frame in one call. It returns a real data frame (not a matrix), accepts one, two, or three variables, and chains with <code>adorn_*</code> helpers to add totals, percentages, and formatted labels.</p>

[QUICK ANSWER]
tabyl(mtcars, cyl)                                         # 1-way frequency
tabyl(mtcars, cyl, gear)                                   # 2-way cross-tab
mtcars |> tabyl(cyl)                                       # pipe-friendly
tabyl(mtcars, cyl) |> adorn_totals()                       # add row total
tabyl(mtcars, cyl, gear) |> adorn_percentages("row")       # row %
tabyl(mtcars$cyl, show_na = FALSE)                         # vector input
tabyl(mtcars, cyl, gear, am)                               # 3-way: list

[DECISION TREE: Is tabyl() the right tool?]
- count one or two categorical variables: tabyl(df, var) or tabyl(df, v1, v2)
- count rows in long tidy output: dplyr::count(df, var)
- base R contingency matrix: table(df$v1, df$v2)
- formula-style cross-tab: xtabs(~ v1 + v2, df)
- group summaries beyond counts: summarize(df, n = n(), .by = grp)
- format counts as percentages: tabyl() |> adorn_percentages() |> adorn_pct_formatting()
- chi-squared test on counts: chisq.test(tabyl(df, v1, v2))

## What tabyl() does in one sentence

**`tabyl()` counts how often each level (or combination of levels) appears in a column and returns the result as a data frame ready for printing or piping.** It is janitor's drop-in replacement for `base::table()`, with two upgrades: the output is tidy enough to feed to ggplot2 or kable, and the `adorn_*` family adds totals, percentages, and decorations without leaving the pipe.

The function shines for exploratory data analysis where you need a quick count of categories, a row-percent cross-tab, or a publication-ready frequency table in a report.

## Syntax

**`tabyl()` takes one to three column names from a data frame, or a single vector.** The first variable forms rows; the second forms columns; the third splits the result into a named list of 2-way tables.

```r title="Load janitor and inspect mtcars"
library(janitor)
library(dplyr)

mtcars |>
  tabyl(cyl)
#>  cyl  n percent
#>    4 11 0.34375
#>    6  7 0.21875
#>    8 14 0.43750
```

The full signature:

```
tabyl(dat, var1, var2, var3, show_na = TRUE, show_missing_levels = TRUE, ...)
```

Only `dat` (or a vector) is required. `show_na` controls whether `NA` appears as its own row; `show_missing_levels` keeps unused factor levels in the output even when their count is zero.

[TIP]
**Reach for `tabyl()` instead of `table()` whenever you need a downstream pipeline.** `table()` returns a matrix with awkward dimnames; `tabyl()` returns a data frame you can pass straight to `ggplot()`, `kable()`, or `gt()`. That single property removes a lot of `as.data.frame.matrix()` glue from EDA scripts.

## Six common patterns

### 1. One-way frequency on a single column

```r title="Count one categorical variable"
mtcars |>
  tabyl(gear)
#>  gear  n percent
#>     3 15 0.46875
#>     4 12 0.37500
#>     5  5 0.15625
```

The output has three columns: the variable, the count `n`, and the proportion `percent` (note: it is a proportion in [0, 1], not a formatted "%" string). Sort with `arrange(desc(n))` if you want the largest categories first.

### 2. Two-way cross-tabulation

```r title="Cross-tab two variables"
mtcars |>
  tabyl(cyl, gear)
#>  cyl 3 4 5
#>    4 1 8 2
#>    6 2 4 1
#>    8 12 0 2
```

With two variables, `tabyl()` returns a wide data frame: rows are levels of `cyl`, columns are levels of `gear`, and cells hold the joint count. The first column is the row label, not row names, so you can pipe the result without losing the grouping variable.

### 3. Three-way table as a named list

```r title="Three-way split returns a list"
res <- mtcars |>
  tabyl(cyl, gear, am)

names(res)
#> [1] "0" "1"

res[["0"]]
#>  cyl 3 4 5
#>    4 1 2 0
#>    6 2 2 0
#>    8 12 0 0
```

A third variable produces one 2-way table per level of that variable, returned as a named list. Index by level (`res[["1"]]`) or apply a function across all slices with `purrr::map()` or `lapply()`.

### 4. Add totals with adorn_totals()

```r title="Append a row total, column total, or both"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_totals(c("row", "col"))
#>    cyl  3  4 5 Total
#>      4  1  8 2    11
#>      6  2  4 1     7
#>      8 12  0 2    14
#>  Total 15 12 5    32
```

`adorn_totals()` accepts `"row"`, `"col"`, `"both"`, or `c("row", "col")`. The label of the total row defaults to "Total"; pass `name = "Sum"` to change it. Totals respect existing decorations, so you can layer them with percentages without re-counting.

### 5. Convert counts to percentages

```r title="Row percentages, formatted"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_percentages("row") |>
  adorn_pct_formatting(digits = 1)
#>  cyl     3     4    5
#>    4  9.1% 72.7% 18.2%
#>    6 28.6% 57.1% 14.3%
#>    8 85.7%  0.0% 14.3%
```

The chain replaces every count with its proportion within the chosen denominator (`"row"`, `"col"`, or `"all"`), then `adorn_pct_formatting()` rounds and appends the percent sign. Stop after `adorn_percentages()` if you want numeric proportions for further math; continue to `adorn_pct_formatting()` for display.

### 6. Pair counts with percentages using adorn_ns()

```r title="Show counts alongside percentages"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_percentages("row") |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns()
#>  cyl         3         4        5
#>    4  9.1% (1) 72.7% (8) 18.2% (2)
#>    6 28.6% (2) 57.1% (4) 14.3% (1)
#>    8 85.7% (12) 0.0% (0) 14.3% (2)
```

`adorn_ns()` glues the raw count back into each cell in parentheses. This is the standard format for academic tables and clinical reports, where reviewers want to see both the rate and the underlying sample size in a single cell.

[KEY INSIGHT]
**The adorn chain is order-sensitive.** Run `adorn_totals()` BEFORE `adorn_percentages()` so the totals get counted as raw numbers, not as proportions of themselves. Run `adorn_pct_formatting()` AFTER `adorn_percentages()` so the formatter sees decimals, not characters. Mixing the order silently produces wrong numbers without throwing an error.

## tabyl() vs table() vs dplyr::count()

**Three idioms produce the same counts; the differences are output shape and chain ergonomics.**

| Task | `tabyl()` | `table()` | `dplyr::count()` |
|---|---|---|---|
| Output type | data frame | matrix or array | tibble |
| 1-way table | `tabyl(df, x)` | `table(df$x)` | `count(df, x)` |
| 2-way cross-tab | `tabyl(df, x, y)` | `table(df$x, df$y)` | `count(df, x, y)` (long) |
| Add row totals | `adorn_totals("row")` | `addmargins(t, 1)` | manual `summarise` |
| Row percentages | `adorn_percentages("row")` | `prop.table(t, 1)` | manual `mutate(p = n/sum(n))` |
| Pipe-friendly | yes | partial | yes |

When to use which:

- Use `tabyl()` when the goal is a printed or formatted table (report, knitr, dashboard).
- Use `dplyr::count()` when the result feeds another transformation (`group_by`, `join`, `ggplot`).
- Use `table()` only when interoperating with base R functions like `chisq.test()` or `prop.table()` that expect a matrix.

[NOTE]
**Coming from Python pandas?** The equivalent of `tabyl(df, x, y)` is `pd.crosstab(df.x, df.y)`. The decoration helpers map roughly to `pd.crosstab(..., margins=True, normalize="index").round(3).mul(100).astype(str).add("%")`, which is exactly the kind of one-liner janitor's `adorn_*` chain replaces with named verbs.

## Common pitfalls

**Pitfall 1: forgetting that percent is a proportion.** The default `percent` column holds values in [0, 1] (for example `0.34375`), not `"34.4%"`. If a downstream tool needs strings with a percent sign, call `adorn_percentages()` then `adorn_pct_formatting()` to convert. Misreading the column as already formatted shows up as "34" axis labels in a chart.

**Pitfall 2: applying adorn_percentages without first deciding on a denominator.** `adorn_percentages()` defaults to `"row"`. If you wanted column percentages, you must pass `"col"`; for the grand-total denominator, pass `"all"`. The wrong choice silently produces a plausible-looking table that answers a different question.

[WARNING]
**`show_na = TRUE` is the default and changes your totals.** If `cyl` has 30 non-NA values and 2 NAs, the percent column on `tabyl(df, cyl)` divides by 32, not 30. Pass `show_na = FALSE` when you want percentages out of the non-missing population, or filter out NAs before tabulating. Forgetting this is a frequent source of "my percents don't sum to what I expected" bug reports.

**Pitfall 3: assuming numeric levels stay numeric.** `tabyl()` converts the grouping variable to character for display. If you arrange or filter the result expecting numeric ordering, sort levels explicitly with `factor(cyl, levels = c("4","6","8"))` before tabulating, or coerce after with `as.numeric()`.

## Try it yourself

**Try it:** Take `mtcars`, build a 2-way `tabyl()` of `gear` by `am`, then add row totals AND row percentages formatted to one decimal. Save the result to `ex_tab`.

```r title="Your turn: gear by am, with totals and row %"
# Try it: build a tabyl with totals and row percentages
ex_tab <- mtcars |>
  tabyl(# your code here)

ex_tab
#> Expected: row percents per gear level + Total column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_tab <- mtcars |>
  tabyl(gear, am) |>
  adorn_totals("col") |>
  adorn_percentages("row") |>
  adorn_pct_formatting(digits = 1)

ex_tab
#>  gear     0     1 Total
#>     3 100.0%  0.0% 100.0%
#>     4  33.3% 66.7% 100.0%
#>     5   0.0% 100.0% 100.0%
```

**Explanation:** `adorn_totals("col")` adds a Total column BEFORE percentages, so each row's totals are computed against the right denominator. Reversing the order would percent-format the totals as 1.000 then re-divide, producing nonsense.

</details>

## Related janitor functions

After mastering `tabyl()`, look at:

- `adorn_totals()`: append row, column, or both totals to a tabyl or any data frame
- `adorn_percentages()`: convert counts to proportions using row, column, or grand-total denominators
- `adorn_pct_formatting()`: round proportions and append the percent sign for display
- `adorn_ns()`: glue raw counts in parentheses next to formatted percentages
- `adorn_title()`: add a pretty top-row title to a 2-way tabyl for printed reports

For a fuller tour of the janitor package, see the [janitor package guide](janitor-Package-in-R.html). The package's official reference site is [sfirke.github.io/janitor](https://sfirke.github.io/janitor/).

## FAQ

**What does janitor tabyl() do?**

`tabyl()` produces a tidy frequency table from one or more columns of a data frame. With a single variable it returns counts and proportions; with two variables it returns a wide cross-tab; with three it returns a named list of 2-way tables, one per level of the third variable. The output is always a regular data frame, so it pipes cleanly into ggplot, kable, or further dplyr verbs.

**How is tabyl() different from base R table()?**

`table()` returns a matrix with dim names, which is awkward to print, awkward to subset, and breaks pipes. `tabyl()` returns a data frame with the grouping variable as a real column, ready for the rest of a tidyverse workflow. The numbers are identical; the shape and ergonomics differ.

**How do I get percentages from tabyl()?**

Pipe the result into `adorn_percentages()`, then optionally `adorn_pct_formatting()` for the percent sign. Use `"row"`, `"col"`, or `"all"` as the denominator argument. To show both percent and count, chain `adorn_ns()` after `adorn_pct_formatting()`.

**Can tabyl() handle missing values?**

Yes. By default `show_na = TRUE` keeps `NA` as its own row in 1-way tables and as its own row/column in 2-way tables. The percent denominator includes the NA count, so set `show_na = FALSE` if you want proportions out of the non-missing population only.

**Does tabyl() work on a vector?**

Yes. `tabyl(mtcars$cyl)` produces the same 1-way table as `tabyl(mtcars, cyl)`. The vector form is handy inside ad-hoc EDA where you have not yet assigned the data to a frame, or when working with a single column extracted from a list.
