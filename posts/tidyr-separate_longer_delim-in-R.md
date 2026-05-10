---
title: "tidyr separate_longer_delim() in R: Split Column Into Rows"
slug: "tidyr-separate_longer_delim-in-R"
description: "Use tidyr separate_longer_delim() to split a column's value into multiple rows by a delimiter in R. Covers vs separate_rows, vs separate_wider, 5 examples."
keywords: "tidyr separate_longer_delim, R split column rows, separate_longer vs separate_wider, separate_rows superseded, tidyr 1.3"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "separate_longer_delim()|tidyr separate_longer_delim|split column into rows|separate rows"
auto_link_case_sensitive: true
target_keyword: "tidyr separate_longer_delim"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr separate_longer_delim() in R: Split Column Into Rows

<p class="lead">The <code>separate_longer_delim()</code> function in tidyr 1.3 splits a column's values by a delimiter and creates ONE NEW ROW per part. It is the tidy-data unstacking idiom: comma-separated lists become individual rows.</p>

[QUICK ANSWER]
df |> separate_longer_delim(tags, delim = ",")    # one row per tag
df |> separate_longer_delim(items, delim = "; ")
df |> separate_longer_delim(c(col1, col2), delim = ",") # multiple cols
tidyr::separate_rows(df, tags, sep = ",")          # superseded predecessor
df |> separate_wider_delim(...)                    # different: into columns

[DECISION TREE: Is separate_longer_delim() the right tool?]
- comma-list -> rows: separate_longer_delim()
- comma-list -> columns: separate_wider_delim()
- old code with separate_rows: works but superseded
- positional split into rows: separate_longer_position()
- list-column to rows: tidyr::unnest_longer()

## What separate_longer_delim() does in one sentence

**`separate_longer_delim(data, cols, delim)` splits each value of `cols` by `delim` and creates ONE NEW ROW per resulting part.** Other columns' values are duplicated for each new row.

This unstacks delimiter-separated lists into the standard tidy "one observation per row" format.

## Syntax

**`separate_longer_delim(data, cols, delim)`. delim is a literal string (not regex).**

```r title="Comma-separated tags to rows"
library(tidyr)
library(dplyr)

df <- tibble(id = 1:2, tags = c("a,b,c","d,e"))

df |>
  separate_longer_delim(tags, delim = ",")
#>   id tags
#> 1  1 a
#> 2  1 b
#> 3  1 c
#> 4  2 d
#> 5  2 e
```

[TIP]
**This is a key tidy-data operation: convert "list inside a cell" to "one cell per item, one row per cell".** Standard input prep for many downstream operations.

## Five common patterns

### 1. Comma-separated tags

```r title="Each tag becomes a row"
df <- tibble(post_id = 1:2, tags = c("R,dplyr,tidyr","ggplot2,R"))
df |>
  separate_longer_delim(tags, delim = ",")
```

### 2. Multi-character delimiter

```r title="'; ' separator"
df |>
  separate_longer_delim(items, delim = "; ")
```

### 3. Multiple columns at once

```r title="Both authors and keywords"
df |>
  separate_longer_delim(c(authors, keywords), delim = ",")
```

### 4. Trim whitespace post-split

```r title="Combine with stringr"
library(stringr)
df |>
  separate_longer_delim(tags, delim = ",") |>
  mutate(tags = str_trim(tags))
```

### 5. Empty / NA handling

```r title="NAs and empties"
df <- tibble(id = 1:3, tags = c("a,b","", NA))
df |>
  separate_longer_delim(tags, delim = ",")
#> id 1 produces 2 rows (a, b)
#> id 2 produces 1 row (empty string)
#> id 3 produces 1 row (NA)
```

[KEY INSIGHT]
**`separate_longer_delim()` is the modern replacement for `separate_rows()`.** Same semantics; cleaner name and consistency with separate_wider_*. The `_longer_` and `_wider_` naming aligns with pivot_longer / pivot_wider conventions.

## separate_longer_delim() vs separate_rows() vs unnest()

| Function | Status | Input | Best for |
|---|---|---|---|
| `separate_longer_delim()` | Recommended | String column | Modern delimiter-to-rows |
| `tidyr::separate_rows()` | Superseded | String column | Same; older API |
| `tidyr::unnest()` | Recommended | List column | Already-list-shaped data |
| `unnest_longer()` | Recommended | List column | Single column to rows |

When to use which:

- separate_longer_delim for delimiter-separated strings.
- unnest for list columns (e.g., from JSON).
- Avoid separate_rows in new code.

## A practical workflow

**Use separate_longer_delim for "tags" or "tags-like" data normalization.**

```r
posts |>
  separate_longer_delim(tags, delim = ",") |>
  mutate(tags = trimws(tags)) |>
  count(tags, sort = TRUE)
```

Tag frequency analysis from comma-separated tag strings. Common pre-processing for text data.

## Common pitfalls

**Pitfall 1: forgetting to trim whitespace.** `"a, b, c"` splits to "a", " b", " c". Use `mutate(col = trimws(col))` after.

**Pitfall 2: confusing wider vs longer.** wider splits into COLUMNS. longer splits into ROWS. Pick by what you want.

[WARNING]
**`separate_longer_delim()` requires tidyr 1.3+.** Earlier versions only have `separate_rows()`. Check `packageVersion("tidyr")` if confused.

## Try it yourself

**Try it:** Split a `genres` column of comma-separated movie genres into one row per genre. Save to `ex_long`.

```r title="Your turn: split genres"
df <- tibble(
  movie = c("Inception","La La Land"),
  genres = c("Sci-Fi,Thriller","Drama,Musical,Romance")
)

ex_long <- df |>
  # your code here

nrow(ex_long)
#> Expected: 5 (2 + 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_long <- df |>
  separate_longer_delim(genres, delim = ",")

ex_long
#>   movie       genres
#> 1 Inception   Sci-Fi
#> 2 Inception   Thriller
#> 3 La La Land  Drama
#> 4 La La Land  Musical
#> 5 La La Land  Romance
```

**Explanation:** Each comma-separated genre becomes its own row; movie name is repeated.

</details>

## Related tidyr functions

After mastering separate_longer_delim, look at:

- `separate_longer_position()`: split into rows by character position
- `separate_wider_delim()`: split into columns
- `separate_rows()`: superseded predecessor
- `unnest_longer()`: list column to rows
- `tidyr::nest()` / `unnest()`: list-column workflows

For combining rows back into delimiter-separated strings, use `summarise(col = paste(col, collapse = ","))` after grouping.

## FAQ

**What does separate_longer_delim do in tidyr?**

Splits a column's values by a delimiter and creates one row per resulting part. Other columns are duplicated to match.

**What is the difference between separate_longer_delim and separate_rows?**

separate_rows is superseded by separate_longer_delim (and separate_longer_position). Same semantics, modern naming.

**What is the difference between separate_longer_delim and separate_wider_delim?**

longer creates new ROWS (one per part). wider creates new COLUMNS (one per part). Same input; different output shape.

**How do I trim whitespace after split?**

`mutate(col = trimws(col))` after the split. Or strip whitespace with `strsplit + trimws` before separate.

**What happens with NAs?**

NA values produce one row with NA. Empty strings produce one row with "". Filter after if you don't want them.
