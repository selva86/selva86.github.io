---
title: "dplyr rename() in R: Rename Columns Without Dropping"
slug: "dplyr-rename-in-R"
description: "Rename columns in R with dplyr rename(new = old), bulk-rename with rename_with(), and avoid the classic order mistake: 6 runnable examples."
keywords: "dplyr rename, rename columns R, dplyr rename_with, R rename column, rename pattern dplyr, rename multiple columns"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rename()|dplyr rename|dplyr::rename()|rename_with()|rename columns"
auto_link_case_sensitive: true
target_keyword: "dplyr rename"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr rename() in R: Rename Columns Without Dropping

<p class="lead">The <code>rename()</code> function in dplyr changes column names while keeping every column. Unlike <code>select()</code>, which drops columns you do not list, <code>rename()</code> only changes the names you specify.</p>

[QUICK ANSWER]
rename(df, new_name = old_name)                       # rename one
rename(df, mpg_kpl = mpg, hp_watts = hp)              # rename many
rename_with(df, toupper)                              # apply fn to all names
rename_with(df, toupper, starts_with("m"))            # selected names
rename_with(df, ~ paste0("v_", .))                    # lambda
rename_with(df, ~ gsub("\\.", "_", .))                # replace chars
rename(df, "new name" = old_name)                     # quoted for spaces

[DECISION TREE: Is rename() the right tool?]
- rename a few columns: rename(df, new = old)
- rename by pattern across many: rename_with(df, ~ paste0("v_", .))
- rename and drop other columns: select(df, new = old)
- rename inside summarise/mutate output: across(.names = "{.col}_avg")
- replace whitespace in all names: rename_with(df, ~ gsub(" ", "_", .))
- snake_case all column names: rename_with(df, snakecase::to_snake_case)
- match base R names: setNames(df, new_names)

## What rename() does in one sentence

**`rename()` changes column names without dropping any column.** You write `new_name = old_name` pairs; only the listed columns are renamed, every other column passes through unchanged. The order of columns is preserved.

Unlike `select()` (which DROPS columns you do not list), `rename()` is purely a renaming operation. Use `select(df, new = old)` ONLY when you want to rename AND drop other columns.

## Syntax

**`rename()` takes a data frame plus `new = old` pairs.** Use bare names. Quote names with spaces or special characters using backticks or quotes.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

names(mtcars)
#> [1] "mpg"  "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "vs"   "am"   "gear" "carb"
```

The full signatures:

```
rename(.data, ...)
rename_with(.data, .fn, .cols = everything(), ...)
```

`rename()` for explicit pairs. `rename_with()` for function-based renaming across multiple columns (uses tidyselect for `.cols`).

[TIP]
**`rename(df, new = old)` reads "old column becomes new column".** This is the OPPOSITE direction from many languages where assignment goes left to right (`old -> new`). Mistakes here are common; if your rename does nothing, check the direction.

## Six common patterns

### 1. Rename one column

```r title="Rename mpg to mpg_kpl"
mtcars |>
  rename(mpg_kpl = mpg) |>
  names() |>
  head(4)
#> [1] "mpg_kpl" "cyl"     "disp"    "hp"
```

The new name on the left, old name on the right.

### 2. Rename multiple columns

```r title="Rename several at once"
mtcars |>
  rename(
    miles_per_gallon = mpg,
    cylinders = cyl,
    horsepower = hp
  ) |>
  names() |>
  head(5)
#> [1] "miles_per_gallon" "cylinders" "disp" "horsepower" "drat"
```

List as many `new = old` pairs as you need. Order does not matter; the result preserves the data frame's original column order.

### 3. Apply function to all column names

```r title="Uppercase all column names"
mtcars |>
  rename_with(toupper) |>
  names() |>
  head(5)
#> [1] "MPG"  "CYL"  "DISP" "HP"   "DRAT"
```

`rename_with()` applies a function to existing names. Default scope is `everything()` (all columns).

### 4. Apply function to selected columns

```r title="Uppercase only columns starting with m"
mtcars |>
  rename_with(toupper, starts_with("m")) |>
  names() |>
  head(5)
#> [1] "MPG"  "cyl"  "disp" "hp"   "drat"
```

The second argument selects columns via tidyselect. Only those names get the function applied.

### 5. Custom lambda with rename_with

```r title="Add v_ prefix to all numeric columns"
mtcars |>
  rename_with(~ paste0("v_", .), where(is.numeric)) |>
  names() |>
  head(5)
#> [1] "v_mpg"  "v_cyl"  "v_disp" "v_hp"   "v_drat"
```

The `~ paste0("v_", .)` is shorthand for `function(name) paste0("v_", name)`. The `.` is the original column name.

### 6. Replace pattern with regex

```r title="Replace dots with underscores in names"
df <- tibble(`a.b` = 1:3, `c.d` = 4:6, x = 7:9)
df |>
  rename_with(~ gsub("\\.", "_", .)) |>
  names()
#> [1] "a_b" "c_d" "x"
```

`gsub()` inside the lambda performs a regex replace on each column name. Useful for mass cleanup of imported data with dots, spaces, or punctuation in column names.

[KEY INSIGHT]
**`rename()` is a pure metadata operation; the data does NOT change.** Renaming a column is just relabeling. The vector of values, types, and order are all preserved. This is why `rename()` is essentially free in performance terms compared to `mutate()` (which evaluates expressions per row).

## rename() vs select() vs base R

**Both `rename()` and `select()` can rename. The difference is whether other columns are kept.**

| Task | `rename()` | `select()` | Base R |
|---|---|---|---|
| Rename one, keep rest | `rename(df, new = old)` | (cannot do this directly) | `names(df)[k] <- "new"` |
| Rename + drop others | (does not drop) | `select(df, new = old)` | `df[, "old", drop=FALSE]` then rename |
| Rename by function | `rename_with(df, fn)` | (no equivalent) | `names(df) <- fn(names(df))` |
| Rename many | `rename(df, n1=o1, n2=o2)` | `select(df, n1=o1, n2=o2)` | `names(df)[match(c("o1","o2"), names(df))] <- c("n1","n2")` |

When to use which:

- Use `rename()` when you only want to change names, keep all columns.
- Use `select()` when you want to change names AND drop other columns.
- Use `rename_with()` for pattern-based renaming across many columns.

## Common pitfalls

**Pitfall 1: direction confusion.** `rename(df, mpg = mpg_old)` renames `mpg_old` to `mpg`, not the other way. New name on the LEFT, old name on the RIGHT.

**Pitfall 2: names with spaces or special chars.** If the column is named `"1st value"` or `"my var"`, you must quote: `rename(df, new_name = \`1st value\`)` (backticks) or `rename(df, "new" = "1st value")` (strings).

[WARNING]
**`rename()` errors if the OLD name does not exist.** `rename(mtcars, x = mpg_typo)` errors because `mpg_typo` is not a column. To rename quietly when a column may or may not exist, use `rename_with(df, ~ "x", any_of("mpg_typo"))`. `any_of()` ignores missing names.

**Pitfall 3: rename_with applies to ALL selected columns by default.** `rename_with(df, toupper)` uppercases EVERY column name. To restrict, pass a tidyselect helper as the third argument: `rename_with(df, toupper, where(is.numeric))`.

## Try it yourself

**Try it:** Take `iris` and use `rename_with()` to replace all dots in column names with underscores. Save to `ex_iris` and print the new names.

```r title="Your turn: rename Sepal.Length to Sepal_Length etc."
# Try it: replace dots with underscores
ex_iris <- iris |>
  rename_with(# your code here)

names(ex_iris)
#> Expected: c("Sepal_Length", "Sepal_Width", "Petal_Length", "Petal_Width", "Species")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_iris <- iris |>
  rename_with(~ gsub("\\.", "_", .))

names(ex_iris)
#> [1] "Sepal_Length" "Sepal_Width"  "Petal_Length" "Petal_Width"  "Species"
```

**Explanation:** `~ gsub("\\.", "_", .)` is a lambda that runs `gsub()` on each column name. The first argument is the regex pattern (a literal dot, escaped as `\\.`); the second is the replacement; the third is the input (each name in turn).

</details>

## Related dplyr functions

After mastering `rename()`, look at:

- `select()` with `new = old`: rename AND drop other columns
- `rename_with()`: function-based bulk renaming
- `relocate()`: change column order without renaming
- `setNames()` (base R): replace all names at once with a character vector
- `janitor::clean_names()`: opinionated cleanup of messy names (snake_case, no special chars)

For datasets with many columns named with weird patterns from external sources (Excel, SAS), reach for `janitor::clean_names()` first, then `rename_with()` for fine-tuning.

## FAQ

**What is the difference between rename and select in dplyr?**

`rename(df, new = old)` keeps every column and only changes the listed names. `select(df, new = old)` keeps ONLY the columns you list (dropping all others) and renames them at the same time. Use `rename()` when you want to keep all columns; use `select()` when you also want to drop columns.

**How do I rename multiple columns at once in dplyr?**

Two options. List explicit pairs: `rename(df, n1 = o1, n2 = o2, n3 = o3)`. Or use `rename_with()` with a function that maps old names to new: `rename_with(df, ~ gsub("\\.", "_", .))` replaces all dots with underscores in every column name.

**How do I rename columns with names that contain spaces?**

Use backticks for column names with spaces: `rename(df, new_name = \`old name\`)`. Or use strings: `rename(df, "new_name" = "old name")`. Either works; backticks are more idiomatic.

**Can I rename a column conditionally in dplyr?**

Use `rename_with()` with a tidyselect helper: `rename_with(df, toupper, where(is.numeric))` uppercases only numeric column names. To rename only when a column exists, combine with `any_of()`: `rename_with(df, ~ "new", any_of("maybe_old_name"))`.

**Why does rename error with "column not found"?**

The OLD column name in `rename(df, new = old)` must exist in the data frame. If you typo the old name or the data has different names than you expect, rename errors. Use `rename_with(df, ~ "new", any_of("old"))` for the silent version that ignores missing names.
