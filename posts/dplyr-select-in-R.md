---
title: "dplyr select() in R: Choose, Rename and Reorder Columns"
slug: "dplyr-select-in-R"
description: "Master dplyr select() in R to choose, rename, and reorder columns by name, position, type, or pattern. Includes starts_with, contains, where, and 6 examples."
keywords: "dplyr select, select columns in R, dplyr select examples, R select columns, starts_with, contains, where"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "select()|dplyr select|dplyr::select()|select columns|column selection"
auto_link_case_sensitive: true
target_keyword: "dplyr select"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr select() in R: Choose, Rename and Reorder Columns

<p class="lead">The <code>select()</code> function in dplyr returns a data frame with only the columns you ask for. You can pick columns by name, position, range, or pattern, and rename or reorder them in the same call.</p>

## What select() does in one sentence

`select()` is a column subsetter: you pass a data frame and a list of columns (or rules for choosing columns), and you get back a data frame with just those columns. Unlike base R `[, ...]`, it gives you helpers for pattern matching (`starts_with()`, `contains()`, `where()`), supports negative selection with `-`, and combines naturally with the pipe `|>`.

When you reach for `select()`, you usually have one of three goals: you want to drop the columns you do not need before further analysis, you want to bring forward the columns that matter for a plot or a join, or you want to rename and reorder columns at the same time you pick them. All three goals are first-class in `select()`, which is why almost every dplyr pipeline starts or ends with it.

## Syntax

```r title="Load dplyr and inspect the data"
library(dplyr)

# We use the built-in starwars dataset for examples
glimpse(starwars)
#> Rows: 87
#> Columns: 14
#> $ name       <chr> "Luke Skywalker", "C-3PO", "R2-D2", ...
#> $ height     <int> 172, 167, 96, 202, 150, 178, 165, ...
#> $ mass       <dbl> 77.0, 75.0, 32.0, 136.0, 49.0, 120.0, ...
#> $ hair_color <chr> "blond", NA, NA, "none", "brown", ...
#> ...
```

The full signature is:

```
select(.data, ...)
```

- `.data`: a data frame, tibble, or grouped data frame
- `...`: one or more column expressions. These can be:
  - Bare column names: `name, height, mass`
  - Negative names to exclude: `-name`
  - Ranges: `name:mass` (everything from `name` to `mass`)
  - Helper functions: `starts_with("hair")`, `contains("color")`, `where(is.numeric)`
  - Renames: `new_name = old_name`

The return value is always a data frame (or tibble) with only the chosen columns, in the order you specified.

## Six common patterns

### 1. Pick columns by name

```r title="Select three columns by name"
starwars |>
  select(name, height, mass) |>
  head(3)
#> # A tibble: 3 x 3
#>   name           height  mass
#>   <chr>           <int> <dbl>
#> 1 Luke Skywalker    172    77
#> 2 C-3PO             167    75
#> 3 R2-D2              96    32
```

### 2. Drop columns with a minus sign

```r title="Drop films, vehicles, and starships"
starwars |>
  select(-films, -vehicles, -starships) |>
  head(2)
#> # A tibble: 2 x 11
#>   name      height  mass hair_color skin_color eye_color birth_year sex   ...
#>   <chr>      <int> <dbl> <chr>      <chr>      <chr>          <dbl> <chr>
#> 1 Luke Sky.    172    77 blond      fair       blue            19   male
#> 2 C-3PO        167    75 NA         gold       yellow         112   none
```

### 3. Use ranges with the colon operator

```r title="Pick a range of contiguous columns"
starwars |>
  select(name:eye_color) |>
  head(2)
#> # A tibble: 2 x 6
#>   name           height  mass hair_color skin_color eye_color
#>   <chr>           <int> <dbl> <chr>      <chr>      <chr>
#> 1 Luke Skywalker    172    77 blond      fair       blue
#> 2 C-3PO             167    75 NA         gold       yellow
```

### 4. Pattern-matching helpers

The tidyselect helpers shine when you have many columns:

```r title="Match by prefix, substring, and type"
# Columns starting with a string
starwars |> select(starts_with("hair")) |> head(2)
#> # A tibble: 2 x 1
#>   hair_color
#>   <chr>
#> 1 blond
#> 2 NA

# Columns containing a substring
starwars |> select(contains("color")) |> head(2)
#> # A tibble: 2 x 3
#>   hair_color skin_color eye_color
#>   <chr>      <chr>      <chr>
#> 1 blond      fair       blue
#> 2 NA         gold       yellow

# Columns by type, via where()
starwars |> select(where(is.numeric)) |> head(2)
#> # A tibble: 2 x 3
#>   height  mass birth_year
#>    <int> <dbl>      <dbl>
#> 1    172    77         19
#> 2    167    75        112
```

### 5. Rename inside select()

```r title="Rename character height to character_height"
starwars |>
  select(character = name, character_height = height) |>
  head(2)
#> # A tibble: 2 x 2
#>   character      character_height
#>   <chr>                     <int>
#> 1 Luke Skywalker              172
#> 2 C-3PO                       167
```

If you only want to rename without dropping other columns, use `rename()` instead.

### 6. Reorder by listing in the order you want

```r title="Move name to front, mass before height"
starwars |>
  select(name, mass, height, everything()) |>
  head(2)
#> # A tibble: 2 x 14
#>   name            mass height hair_color skin_color eye_color ...
#>   <chr>          <dbl>  <int> <chr>      <chr>      <chr>
#> 1 Luke Skywalker    77    172 blond      fair       blue
#> 2 C-3PO             75    167 NA         gold       yellow
```

`everything()` fills in the remaining columns, preserving their original order.

## select() vs base R column subsetting

| Task | dplyr | Base R |
|---|---|---|
| Pick by name | `select(df, a, b)` | `df[, c("a", "b")]` |
| Drop by name | `select(df, -a)` | `df[, !names(df) %in% "a"]` |
| Pick by pattern | `select(df, starts_with("x"))` | `df[, grep("^x", names(df))]` |
| Pick by type | `select(df, where(is.numeric))` | `df[, sapply(df, is.numeric)]` |
| Rename + select | `select(df, new = old)` | two steps |

When to use which:
- Use `select()` for readable pipelines and pattern matching.
- Use base R `[, ...]` when you have no other tidyverse code in the project, or when you want zero package dependencies.

## Common pitfalls

**Pitfall 1: forgetting parentheses on helpers.** Helpers are functions, not bare names.

```r title="Wrong: starts_with without parentheses errors"
# starwars |> select(starts_with) wouldn't run
# Correct:
starwars |> select(starts_with("hair")) |> head(1)
#> # A tibble: 1 x 1
#>   hair_color
#>   <chr>
#> 1 blond
```

**Pitfall 2: confusing `select()` with `filter()`.** `select()` picks columns; `filter()` picks rows. New users sometimes try `select(starwars, height > 100)`, which errors. For row selection by condition, use `filter()`.

**Pitfall 3: `.data` quoting in functions.** Inside your own function, refer to columns with `.data[[col]]` or `{{ col }}` to avoid name lookup surprises. This is the tidy-evaluation rabbit hole; for one-off scripts, the bare-name form is fine.

## Related dplyr functions

After mastering `select()`, look at:

- `rename()`: rename columns without dropping any
- `relocate()`: move columns to a specific position
- `pull()`: extract one column as a vector instead of a data frame
- `mutate()`: create or transform columns
- `everything()`, `last_col()`, `any_of()`, `all_of()`: more tidyselect helpers

`any_of()` and `all_of()` deserve a special note. Both take a character vector of column names. `all_of()` errors if any name is missing, while `any_of()` silently keeps only the names that exist. Use `all_of()` when missing columns indicate a real bug; use `any_of()` when columns may legitimately appear in some inputs and not others, for example across different export versions of the same source.

## FAQ

**How do I select multiple columns by index in dplyr?**

Use a vector of positions: `select(starwars, c(1, 3, 5))` returns the first, third, and fifth columns. You can also use a range: `select(starwars, 1:5)` returns the first five columns.

**What is the difference between select() and pull() in dplyr?**

`select()` returns a data frame even if you ask for a single column. `pull()` extracts one column and returns it as a plain vector. Use `select(df, x)` when downstream code expects a data frame; use `pull(df, x)` when you want to feed the column to a function that takes a vector.

**Can I select columns conditionally?**

Yes, with `where()` for type-based selection: `select(starwars, where(is.numeric))`. For more complex predicates: `select(starwars, where(~ mean(.x, na.rm = TRUE) > 100))` keeps numeric columns whose mean exceeds 100.

**How do I rename a column without dropping the others?**

Use `rename()`: `starwars |> rename(character = name)`. `rename()` keeps every column and only changes the names you specify. `select()` with renaming would drop columns you didn't list.

**Does dplyr select() work with grouped data frames?**

Yes. Grouping variables are always retained, even if you don't list them. `starwars |> group_by(species) |> select(name)` returns `species` and `name`.
