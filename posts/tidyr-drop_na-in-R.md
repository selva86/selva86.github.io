---
title: "tidyr drop_na() in R: Remove Rows With NA Values"
slug: "tidyr-drop_na-in-R"
description: "Use tidyr drop_na() to remove rows containing NA values in R. Covers all-column drop, specific columns, comparison with na.omit, and 5 worked examples."
keywords: "tidyr drop_na, R remove NA rows, drop_na specific column, na.omit alternative, R complete cases dplyr, drop NA in pipeline"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "drop_na()|tidyr drop_na|tidyr::drop_na()|remove NA rows|complete cases"
auto_link_case_sensitive: true
target_keyword: "tidyr drop_na"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr drop_na() in R: Remove Rows With NA Values

<p class="lead">The <code>drop_na()</code> function in tidyr removes rows with any NA values. Specify columns to limit which NAs trigger row removal. It is the pipeline-friendly alternative to base R <code>na.omit()</code> and <code>complete.cases()</code>.</p>

[QUICK ANSWER]
drop_na(df)                              # remove rows with ANY NA
drop_na(df, x)                           # remove rows where x is NA
drop_na(df, x, y)                        # remove rows where x OR y is NA
drop_na(df, where(is.numeric))           # NA in any numeric column
drop_na(df, starts_with("score"))        # NA in score-prefixed cols
filter(df, complete.cases(df))           # equivalent base R
filter(df, !is.na(x))                    # one column, base-style condition

[DECISION TREE: Is drop_na() the right tool?]
- remove rows with any NA: drop_na()
- remove rows where specific col is NA: drop_na(col)
- replace NA with a value: replace_na()
- impute NA with mean/median: dplyr::mutate + ifelse or mice package
- count NAs first: summarise(n_na = sum(is.na(col)))
- detect NA pattern: VIM::aggr or naniar package
- ignore NAs in computation: na.rm = TRUE in mean/sum/etc.

## What drop_na() does in one sentence

**`drop_na()` returns a data frame with rows removed wherever specified columns contain NA.** Without arguments, it drops rows with NA in ANY column; with column names, it drops rows where those specific columns have NA.

This is one of the most-used data cleaning steps. Use it whenever an analysis cannot tolerate missing values and you have decided that complete-case analysis is acceptable.

## Syntax

**`drop_na(data, ...)` is the form. The `...` argument selects columns to check for NA.**

```r title="Build a small data frame with NAs"
library(tidyr)

library(dplyr)
library(tibble)
df <- tibble::tibble(
  id = 1:5,
  x = c(1, NA, 3, 4, NA),
  y = c("a", "b", NA, "d", "e")
)

df |> drop_na()
#> # A tibble: 2 x 3
#>      id     x y
#>   <int> <dbl> <chr>
#> 1     1     1 a
#> 2     4     4 d
```

[TIP]
**`drop_na()` without arguments is conservative.** It removes a row if ANY column has NA. For a more permissive drop ("only when these columns are NA"), name the columns: `drop_na(df, x, y)` ignores NAs in other columns.

## Five common patterns

### 1. Drop rows with any NA

```r title="Strict: keep only fully complete rows"
df |> drop_na()
```

The most aggressive form. Equivalent to base R `na.omit(df)` or `df[complete.cases(df), ]`.

### 2. Drop rows where one column is NA

```r title="Only require x to be non-NA"
df |> drop_na(x)
#> # A tibble: 3 x 3
#>      id     x y
#>   <int> <dbl> <chr>
#> 1     1     1 a
#> 2     3     3 NA
#> 3     4     4 d
```

NAs in column y are KEPT; only rows with NA in x are dropped. Useful when only specific columns are required for the next step.

### 3. Drop based on multiple columns

```r title="Both x and y must be non-NA"
df |> drop_na(x, y)
#> # A tibble: 2 x 3
#>      id     x y
#>   <int> <dbl> <chr>
#> 1     1     1 a
#> 2     4     4 d
```

`drop_na(x, y)` removes rows where x OR y is NA.

### 4. Drop based on column predicate

```r title="Drop rows with NA in any numeric column"
df |> drop_na(where(is.numeric))
```

Tidyselect helpers like `where()`, `starts_with()`, `matches()` work inside drop_na for flexible column selection.

### 5. Drop in a pipeline

```r title="Drop NAs as part of analysis chain"
result <- mtcars |>
  dplyr::mutate(mpg = ifelse(mpg > 30, NA, mpg)) |>
  drop_na(mpg) |>
  dplyr::summarise(avg = mean(mpg))

result
#>        avg
#> 1 18.79615
```

`drop_na()` integrates cleanly into dplyr pipelines, unlike `na.omit()` which can break flow.

[KEY INSIGHT]
**Dropping rows with NA is one tool among many for missing data.** It is appropriate when missing data is a small fraction of rows AND the missingness is "completely at random". For systematic missingness, dropping introduces BIAS. Consider imputation (mean, median, model-based) or analysis methods that handle NA directly (some regression libraries) instead.

## drop_na() vs na.omit() vs complete.cases()

| Function | Source | Pipeline-friendly | Column-specific |
|---|---|---|---|
| `drop_na()` | tidyr | Yes | Yes |
| `na.omit()` | base R | Awkward | No (all columns only) |
| `complete.cases()` | base R | Used inside filter() | Yes (specify columns in subset) |

When to use which:

- Use `drop_na()` in dplyr/tidyverse pipelines.
- Use `na.omit()` for one-line scripts on the whole data frame.
- Use `complete.cases(df[, c("x", "y")])` inside `filter()` for very specific column subsets.

## Common pitfalls

**Pitfall 1: dropping more rows than expected.** `drop_na()` without arguments removes rows with NA in ANY column. With many columns, this can drop most of your data. Always check `nrow(df)` before and after.

**Pitfall 2: hiding the missingness pattern.** Silently dropping rows with NA can make patterns invisible. Before dropping, summarize: `summarise(across(everything(), ~ sum(is.na(.))))` shows how many NAs per column.

[WARNING]
**Dropping NA introduces bias when missingness is NOT random.** If older respondents skip an income question, dropping their rows leaves a younger sample with different characteristics. Consider methods like multiple imputation (`mice` package) when missingness is systematic.

## Try it yourself

**Try it:** From `airquality` (built-in dataset), drop rows where `Ozone` is NA. Save to `ex_clean` and report row count.

```r title="Your turn: drop NA Ozone"
# Try it: keep only complete Ozone rows
ex_clean <- # your code here

nrow(ex_clean)
#> Expected: 116 (out of 153)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- tidyr::drop_na(airquality, Ozone)
nrow(ex_clean)
#> [1] 116
```

**Explanation:** `drop_na(airquality, Ozone)` keeps rows where Ozone is non-NA. Other columns may still have NAs (e.g., Solar.R) but those rows are kept. Result: 116 rows of 153 original.

</details>

## Related tidyr / dplyr functions

After mastering drop_na, look at:

- `replace_na()`: replace NA with a specific value
- `fill()`: forward/backward-fill missing values
- `coalesce()`: take first non-NA across columns
- `complete()`: fill in implicit missing combinations
- `naniar::miss_var_summary()`: NA summary by column
- `mice::mice()`: multiple imputation for missing data

For "carry forward last observation" patterns common in time series, `tidyr::fill()` is the right tool, not `drop_na()`.

## FAQ

**How do I remove rows with NA in R?**

Use `tidyr::drop_na(df)` to remove rows with NA in ANY column. Use `drop_na(df, x)` to remove rows where only column x is NA. Base R alternatives: `na.omit(df)` (whole data frame) or `df[complete.cases(df), ]`.

**What is the difference between drop_na and na.omit?**

`drop_na()` is from tidyr and works inside pipelines. It accepts column arguments to limit which NAs trigger row removal. `na.omit()` is base R, always drops rows with NA in any column, and is harder to chain in pipelines.

**How do I drop NA rows for specific columns only?**

Pass column names to `drop_na`: `drop_na(df, x, y)` removes rows where x OR y is NA. NAs in other columns are kept.

**Should I drop NA rows or impute them?**

Drop when missingness is small and completely random. Impute when missingness is systematic and you cannot afford to lose rows. For complex missingness, multiple imputation via `mice` package is the gold standard.

**Can I use drop_na with tidyselect helpers?**

Yes. `drop_na(df, where(is.numeric))` drops rows where any numeric column is NA. `drop_na(df, starts_with("score"))` checks score-prefixed columns. All standard tidyselect helpers work.
