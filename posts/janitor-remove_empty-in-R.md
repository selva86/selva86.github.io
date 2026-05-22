---
title: "janitor remove_empty() in R: Drop Blank Rows and Columns"
slug: "janitor-remove_empty-in-R"
description: "Use janitor remove_empty() to drop entirely blank rows and columns in R. Covers cutoff thresholds, the which argument, quiet output, and remove_constant()."
keywords: "janitor remove_empty, remove_empty function R, janitor remove_empty examples, R drop empty rows columns, remove blank columns R, remove_empty cutoff"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "remove_empty()|janitor remove_empty|janitor::remove_empty()|remove_constant()|drop empty rows and columns"
auto_link_case_sensitive: true
target_keyword: "janitor remove_empty"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor remove_empty() in R: Drop Blank Rows and Columns

<p class="lead">The <code>remove_empty()</code> function in janitor deletes rows and columns of a data frame that are entirely NA in a single call. It accepts a cutoff to drop near-empty cases, handles rows and columns in one pass, and slots cleanly between data import and analysis.</p>

[QUICK ANSWER]
remove_empty(df)                                   # drop fully empty rows AND cols
remove_empty(df, which = "rows")                   # rows only
remove_empty(df, which = "cols")                   # columns only
remove_empty(df, which = c("rows", "cols"))        # both, explicit
remove_empty(df, cutoff = 0.5)                     # drop if >=50% NA
remove_empty(df, quiet = FALSE)                    # print removed counts
df |> janitor::remove_empty()                      # pipe-friendly
remove_constant(df)                                # drop single-value cols

[DECISION TREE: Is remove_empty() the right tool?]
- drop fully blank rows and cols: remove_empty(df)
- drop rows missing a specific column: tidyr::drop_na(df, x)
- drop columns where every value is identical: remove_constant(df)
- filter rows by an NA condition: filter(df, !is.na(x))
- drop columns by name or position: select(df, -bad_col)
- impute NA values instead of dropping: tidyr::replace_na(df, list(x = 0))
- find duplicate rows before pruning: get_dupes(df)

## What remove_empty() does in one sentence

**`remove_empty()` strips rows and columns from a data frame when every value in them is NA, returning a smaller data frame with the same column types.** It pairs naturally with `clean_names()` as the second step in an import recipe, removing the empty header rows and trailing blank columns that spreadsheets often add.

The function is most useful immediately after reading data from Excel, where shape often does not match content. A 50-row sheet can ship with 200 blank rows and 5 padding columns; `remove_empty()` collapses it back to the real data without manual indexing.

## Syntax

**`remove_empty()` takes a data frame plus `which`, `cutoff`, and `quiet` arguments.** Defaults remove fully empty rows and columns silently.

```r title="Load janitor and a padded data frame"
library(janitor)
library(dplyr)

padded <- data.frame(
  id    = c(1, 2, NA, NA),
  name  = c("Ann", "Bob", NA, NA),
  notes = c(NA, NA, NA, NA),
  blank = c(NA, NA, NA, NA)
)
padded
#>   id name notes blank
#> 1  1  Ann    NA    NA
#> 2  2  Bob    NA    NA
#> 3 NA <NA>    NA    NA
#> 4 NA <NA>    NA    NA
```

The full signature:

```
remove_empty(dat, which = c("rows", "cols"), cutoff = 1, quiet = TRUE)
```

Only `dat` is required. The default `which = c("rows", "cols")` prunes both axes; `cutoff = 1` requires a row or column to be 100% NA before it is dropped.

[TIP]
**Chain `remove_empty()` after `clean_names()` in every import pipeline.** The pair `read_excel("file.xlsx") |> clean_names() |> remove_empty()` handles two common spreadsheet pain points in one breath: messy headers and trailing blank rows or columns. Standardizing this at import keeps later select() and filter() calls free of NA-only ghosts.

## Six common patterns

### 1. Drop fully empty rows and columns

```r title="Default both-axes cleanup"
padded |>
  remove_empty()
#>   id name
#> 1  1  Ann
#> 2  2  Bob
```

With no arguments, `remove_empty()` walks rows first, then columns, removing anything that is entirely NA. The `notes`, `blank` columns and the two trailing NA rows are gone in one call.

### 2. Rows only

```r title="Drop empty rows, keep all columns"
padded |>
  remove_empty(which = "rows")
#>   id name notes blank
#> 1  1  Ann    NA    NA
#> 2  2  Bob    NA    NA
```

Pass `which = "rows"` to skip column pruning. Useful when the column layout is fixed (e.g., a survey export) but trailing rows must go.

### 3. Columns only

```r title="Drop empty columns, keep all rows"
padded |>
  remove_empty(which = "cols")
#>   id name
#> 1  1  Ann
#> 2  2  Bob
#> 3 NA <NA>
#> 4 NA <NA>
```

The mirror case: pass `which = "cols"` to prune unused fields while keeping every row, even partially missing ones. Common when you want to inspect row-level patterns before deciding which rows to discard.

### 4. Cutoff for near-empty data

```r title="Drop columns where 50% or more values are NA"
sparse <- data.frame(
  a = c(1, 2, 3, 4),
  b = c(NA, NA, 3, NA),
  c = c(NA, NA, NA, 4)
)

sparse |> remove_empty(which = "cols", cutoff = 0.5)
#>   a
#> 1 1
#> 2 2
#> 3 3
#> 4 4
```

`cutoff` is a fraction between 0 and 1. A value of `0.5` drops columns (or rows) where 50% or more of values are NA. Use this when "real" data demands some minimum density.

### 5. Verbose mode with quiet = FALSE

```r title="Print how many rows and cols were removed"
padded |>
  remove_empty(quiet = FALSE)
#> Removing 2 empty rows of 4 (50%).
#> Removing 2 empty columns of 4 (50%).
#>   id name
#> 1  1  Ann
#> 2  2  Bob
```

`quiet = FALSE` prints a message before each removal step. Helpful in interactive cleanup; turn it off in scripts that should run silently.

### 6. Remove constant columns with a sibling helper

```r title="Drop columns with a single repeated value"
flat <- data.frame(
  id     = c(1, 2, 3),
  status = c("ok", "ok", "ok"),
  score  = c(10, 20, 30)
)

flat |> remove_constant()
#>   id score
#> 1  1    10
#> 2  2    20
#> 3  3    30
```

`remove_constant()` is the companion function for columns that are not NA but carry zero information because every value is identical. Often paired with `remove_empty()` for full uninformative-column cleanup.

[KEY INSIGHT]
**`remove_empty()` operates on shape, not on meaning.** It cannot tell that a row of zeros, blank strings, or sentinel codes like `-99` is logically empty. Convert sentinels to `NA` first (e.g., `na_if(x, -99)`), then `remove_empty()` will catch them. Without that step, the function only sees `NA` and leaves disguised blanks behind.

## remove_empty() vs drop_na() vs filter()

**Three tools sit in this space; the choice depends on whether you target shape, a specific column, or a condition.**

| Task | `remove_empty()` | `tidyr::drop_na()` | `dplyr::filter()` |
|---|---|---|---|
| Drop rows that are 100% NA | `remove_empty(df, "rows")` | `drop_na(df)` removes any-NA rows | `filter(df, !if_all(everything(), is.na))` |
| Drop rows missing one column | not supported | `drop_na(df, x)` | `filter(df, !is.na(x))` |
| Drop fully empty columns | `remove_empty(df, "cols")` | not supported | not supported (column op) |
| Use a density threshold | `cutoff = 0.5` | not supported | manual `mean(is.na(.))` |
| Verbose count | `quiet = FALSE` | silent | silent |

When to use which:

- Use `remove_empty()` for shape cleanup right after import (rows AND columns).
- Use `drop_na()` when you need rows that are complete on a specific subset of columns.
- Use `filter()` when missingness logic is conditional on one column's value or a derived expression.

[NOTE]
**Coming from Python pandas?** The closest analog is `df.dropna(how="all")` for rows and `df.dropna(how="all", axis=1)` for columns; combine them or run twice. There is no single pandas call that handles both axes with a density cutoff, which is what makes `remove_empty()` convenient in R.

## Common pitfalls

**Pitfall 1: forgetting to assign the result.** `remove_empty(df)` returns a new data frame, it does not modify `df` in place. Capture the output: `df <- remove_empty(df)` or chain it inside a pipeline.

**Pitfall 2: blank strings are not NA.** A column of `""` (empty character strings) is NOT considered empty by `remove_empty()`. Convert with `df[df == ""] <- NA` first, or use `readr::read_csv(..., na = c("", "NA"))` at import time.

[WARNING]
**`cutoff = 1` is "all NA", not "any NA".** The argument is the FRACTION of NA values required to trigger removal, so `cutoff = 1` means 100% NA. New users sometimes read it as "drop if at least 1 NA"; that is what `drop_na()` does on a specific column, not what `remove_empty()` does on the whole row or column.

**Pitfall 3: order matters when you run both axes manually.** Calling `remove_empty(df, "rows")` then `remove_empty(df, "cols")` can give a different result than running both at once, because the first call may turn a near-empty column into a fully empty one. Use the default `which = c("rows", "cols")` when you want consistent behavior.

## Try it yourself

**Try it:** Add a row of all NAs and a column of all NAs to `mtcars`, then use `remove_empty()` to clean it back. Save the result to `ex_mtcars` and check that it has the original 32 rows and 11 columns.

```r title="Your turn: clean up padded mtcars"
# Try it: pad mtcars, then strip the empty row and column
ex_padded <- mtcars
ex_padded$blank_col <- NA
ex_padded["blank_row", ] <- NA

ex_mtcars <- # your code here

dim(ex_mtcars)
#> Expected: 32 rows and 11 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_padded <- mtcars
ex_padded$blank_col <- NA
ex_padded["blank_row", ] <- NA

ex_mtcars <- ex_padded |> remove_empty()

dim(ex_mtcars)
#> [1] 32 11
```

**Explanation:** With no arguments, `remove_empty()` prunes both the all-NA row labeled `"blank_row"` and the all-NA column named `blank_col`, restoring the data frame to mtcars' original shape.

</details>

## Related janitor functions

After mastering `remove_empty()`, look at:

- `remove_constant()`: drop columns where every value is identical (zero information)
- `clean_names()`: rewrite column names to clean snake_case, usually run just before
- `get_dupes()`: surface duplicated rows by one or more columns
- `compare_df_cols()`: spot column type or name mismatches across two data frames
- `tidyr::drop_na()`: drop rows missing values in a specific column or subset

For a fuller tour of the package, see the [janitor package guide](janitor-Package-in-R.html). The package's official reference lives at [sfirke.github.io/janitor](https://sfirke.github.io/janitor/).

## FAQ

**What does janitor remove_empty() do?**

`remove_empty()` deletes rows and columns from a data frame that contain only NA values. By default it prunes both axes in a single call, returning a smaller data frame with the same types and column order. It is most useful right after reading data from Excel or CSV files where trailing blank rows and unused columns are common, and pairs naturally with `clean_names()` as the second step of a tidy import pipeline.

**How do I drop only rows or only columns with remove_empty()?**

Pass the `which` argument: `remove_empty(df, which = "rows")` prunes rows only, `remove_empty(df, which = "cols")` prunes columns only, and `which = c("rows", "cols")` (the default) prunes both. The argument accepts a single string or a character vector, and the order does not matter; janitor always cleans rows before columns under the hood for consistent results.

**Can remove_empty() drop rows or columns that are mostly but not fully empty?**

Yes. Use the `cutoff` argument, a fraction between 0 and 1. `cutoff = 0.5` drops any row or column where at least 50% of values are NA. The default `cutoff = 1` requires 100% NA (fully empty). Lower the cutoff when you want to prune sparse columns that contribute little signal, but inspect the result first to confirm meaningful data is not lost.

**Does remove_empty() treat empty strings as missing?**

No. `remove_empty()` only checks for `NA` values; empty strings `""` and sentinel codes like `-99` are treated as real data. Convert them to NA first, for example with `df[df == ""] <- NA` or `na_if(x, -99)`, before calling `remove_empty()`. Many R analysts handle this at import time by passing `na = c("", "NA", "-99")` to `readr::read_csv()` so the cleanup is automatic.

**What is the difference between remove_empty() and remove_constant()?**

`remove_empty()` drops rows or columns where every value is `NA`; `remove_constant()` drops columns where every value is identical (whether NA, zero, or any repeated literal). The two solve different problems: empty data has no information because it is missing, constant data has no information because it does not vary. Run `remove_empty()` first to clear true blanks, then `remove_constant()` to strip uninformative single-value columns.
