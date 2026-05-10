---
title: "tidyr unite() in R: Combine Columns Into One"
slug: "tidyr-unite-in-R"
description: "Use tidyr unite() to combine multiple columns into a single column in R. Covers sep, remove, na.rm, custom separators, and 5 worked examples for unite."
keywords: "tidyr unite, R combine columns, unite columns R, tidyr concatenate columns, paste columns R, R join columns"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "unite()|tidyr unite|tidyr::unite()|combine columns|paste columns"
auto_link_case_sensitive: true
target_keyword: "tidyr unite"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr unite() in R: Combine Columns Into One

<p class="lead">The <code>unite()</code> function in tidyr combines multiple columns into a single column with a separator. It is the inverse of <code>separate()</code> and the most direct way to build composite identifiers like dates or full names.</p>

[QUICK ANSWER]
unite(df, "full_name", first, last, sep = " ")              # combine 2 cols
unite(df, "id", year, month, day, sep = "-")                # 3 cols with dash
unite(df, "label", year, month, sep = "_", remove = FALSE)  # keep originals
unite(df, "date", -id, sep = "-")                           # all except id
unite(df, "tag", a, b, sep = "_", na.rm = TRUE)             # skip NAs
df |> mutate(full = paste(first, last, sep = " "))          # base R alternative

[DECISION TREE: Is unite() the right tool?]
- combine 2+ columns into one: unite()
- combine but keep originals: unite(remove = FALSE)
- skip NA values: unite(na.rm = TRUE)
- combine with paste: mutate(new = paste(a, b, sep = ...))
- separate one into many: separate()
- split by regex: separate_wider_regex()
- glue-style template: glue::glue()

## What unite() does in one sentence

**`unite()` takes multiple columns and concatenates their values into a single new column with a separator.** By default, the original columns are removed; set `remove = FALSE` to keep them.

This is the simplest tool for building composite keys (e.g., date from y/m/d), full names, or any concatenated identifier.

## Syntax

**`unite(data, col, ..., sep, remove, na.rm)`. `col` is the new column name; `...` lists columns to combine; `sep` is the separator string.**

```r title="Combine first and last name"
library(tidyr)

df <- tibble::tribble(
  ~first, ~last, ~age,
  "Alice", "Smith", 30,
  "Bob", "Jones", 25
)

df |> unite("full_name", first, last, sep = " ")
#> # A tibble: 2 x 2
#>   full_name     age
#>   <chr>       <dbl>
#> 1 Alice Smith    30
#> 2 Bob Jones      25
```

[TIP]
**Default `sep = "_"` is rarely what you want for human-readable text.** Always specify `sep` explicitly: `" "` for names, `"-"` for dates, etc. The default underscore is more for machine identifiers.

## Five common patterns

### 1. Two columns into one

```r title="First + last to full"
df |> unite("full", first, last, sep = " ")
```

The simplest case: two columns become one with a space.

### 2. Keep originals with remove = FALSE

```r title="Add a derived column, keep components"
df |> unite("full", first, last, sep = " ", remove = FALSE)
#> # A tibble: 2 x 4
#>   full         first last    age
#>   <chr>        <chr> <chr> <dbl>
#> 1 Alice Smith  Alice Smith    30
#> 2 Bob Jones    Bob   Jones    25
```

`remove = FALSE` adds the new column without dropping the originals.

### 3. Build a date from components

```r title="Year, month, day to ISO date"
df_date <- tibble::tribble(
  ~y,    ~m, ~d,
  2024,  1,  15,
  2024,  3,  20
)

df_date |> unite("date", y, m, d, sep = "-")
#> # A tibble: 2 x 1
#>   date
#>   <chr>
#> 1 2024-1-15
#> 2 2024-3-20
```

For zero-padded months/days, format first: `mutate(m = sprintf("%02d", m), d = sprintf("%02d", d))`.

### 4. Skip NAs

```r title="na.rm = TRUE removes NA pieces"
df_na <- tibble::tribble(
  ~a, ~b, ~c,
  "x", "y", "z",
  "x", NA, "z"
)

df_na |> unite("combo", a, b, c, sep = "-", na.rm = TRUE)
#> # A tibble: 2 x 1
#>   combo
#>   <chr>
#> 1 x-y-z
#> 2 x-z
```

`na.rm = TRUE` skips NA values, joining only the non-missing pieces.

### 5. Tidyselect for many columns

```r title="Combine all columns except id"
df_multi <- tibble::tibble(
  id = 1:2, a = c("x","y"), b = c("p","q"), c = c("1","2")
)

df_multi |> unite("combo", -id, sep = "_")
#> # A tibble: 2 x 2
#>      id combo
#>   <int> <chr>
#> 1     1 x_p_1
#> 2     2 y_q_2
```

`-id` selects all columns except `id`. Tidyselect helpers like `starts_with()` work too.

[KEY INSIGHT]
**`unite()` is just `paste()` with a clean dplyr-friendly interface.** The base R equivalent is `mutate(new = paste(a, b, c, sep = "_"))`. Use unite when working in tidyr/dplyr pipelines; use paste when not.

## Common pitfalls

**Pitfall 1: forgetting `remove = FALSE`.** Default removes the original columns. If you want to keep them, set `remove = FALSE` explicitly.

**Pitfall 2: numeric inputs converted to strings.** `unite()` always returns a character column. Numeric inputs (like year) become "2024", which is a string. Convert back if needed: `mutate(date = as.Date(date))`.

[WARNING]
**`na.rm = FALSE` (default) propagates "NA" as a string in the result.** With NA in any input column, the output is something like "Alice-NA-Smith". Always set `na.rm = TRUE` if NAs should be skipped, or fill NAs before unite.

## Try it yourself

**Try it:** Combine `iris$Species` and a new "year" column (2024) into a single "tag" column like "setosa_2024". Save to `ex_tagged`.

```r title="Your turn: build a tag column"
ex_tagged <- iris |>
  dplyr::mutate(year = 2024) |>
  # your code here

head(ex_tagged, 2)
#> Expected: tag column showing "setosa_2024"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_tagged <- iris |>
  dplyr::mutate(year = 2024) |>
  tidyr::unite("tag", Species, year, sep = "_", remove = FALSE)

head(ex_tagged, 2)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width tag         Species year
#> 1          5.1         3.5          1.4         0.2 setosa_2024 setosa  2024
#> 2          4.9         3.0          1.4         0.2 setosa_2024 setosa  2024
```

**Explanation:** `unite("tag", Species, year, sep = "_")` combines the Species and year columns into "tag". `remove = FALSE` keeps the originals. Each row's tag is the species name plus year, joined with an underscore.

</details>

## Related tidyr functions

After mastering unite, look at:

- `separate()`: split one column into many (inverse)
- `paste()`, `paste0()`: base R column concatenation
- `glue::glue()`: template-based string interpolation
- `stringr::str_c()`: stringr's vectorized string concatenation
- `unite()` plus `arrange()`: build a sortable composite key

For complex composite IDs, `glue("{first}_{year}_{country}")` inside `mutate()` is more flexible than `unite()`.

## FAQ

**How do I combine multiple columns into one in R?**

Use `tidyr::unite("new", col1, col2, sep = "_")` for tidyr style. Or base R: `mutate(new = paste(col1, col2, sep = "_"))`. Both produce a single character column from multiple inputs.

**What is the difference between unite and paste in R?**

`unite()` is a dplyr-friendly verb that adds a new column to a data frame and optionally removes the originals. `paste()` is a base R function that concatenates strings; you wrap it in `mutate()` to add to a data frame.

**How do I keep the original columns after unite?**

Set `remove = FALSE`: `unite(df, "new", a, b, sep = "_", remove = FALSE)`. Default `remove = TRUE` drops the columns being combined.

**How do I handle NA values in unite?**

Set `na.rm = TRUE`: `unite("new", a, b, sep = "_", na.rm = TRUE)` skips NA values when concatenating. Default `na.rm = FALSE` includes "NA" as a string in the result.

**What separator should I use for unite?**

Use a separator that does NOT appear in your data. For names: `" "`. For dates: `"-"`. For machine identifiers: `"_"`. Avoid characters used in your data (e.g., `","` if values contain commas).
