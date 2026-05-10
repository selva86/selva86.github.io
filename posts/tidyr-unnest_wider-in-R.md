---
title: "tidyr unnest_wider() in R: Spread Named Lists Into Columns"
slug: "tidyr-unnest_wider-in-R"
description: "Use tidyr unnest_wider() to spread a list-column of named lists into separate columns in R. Covers names_sep, JSON unnesting, and 5 worked examples."
keywords: "tidyr unnest_wider, R unnest_wider names_sep, JSON to columns R, unnest_wider vs unnest, named list to columns"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::unnest_wider()|tidyr unnest_wider|named list to columns|JSON unnest|spread list to columns"
auto_link_case_sensitive: true
target_keyword: "tidyr unnest_wider"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr unnest_wider() in R: Spread Named Lists Into Columns

<p class="lead">The <code>unnest_wider()</code> function in tidyr spreads a list-column where each cell is a NAMED LIST into multiple new columns, one per name. It is essential for unnesting JSON-shaped data.</p>

[QUICK ANSWER]
df |> unnest_wider(json_col)             # spread named list to columns
df |> unnest_wider(json_col, names_sep = "_") # prefix new column names
df |> unnest_wider(json_col, names_repair = "unique")
df |> unnest_longer(col)                  # different: vectors to rows
df |> unnest(col)                         # different: tibbles to rows

[DECISION TREE: Is unnest_wider() the right tool?]
- list column of named lists -> columns: unnest_wider()
- list column of tibbles (one row each) -> columns: unnest_wider() works too
- list column of vectors -> rows: unnest_longer()
- JSON parsed via jsonlite::fromJSON -> columns: unnest_wider()
- handle name conflicts: names_sep / names_repair

## What unnest_wider() does in one sentence

**`unnest_wider(data, col, names_sep = NULL)` spreads a list-column where each cell is a named list (or 1-row tibble) into multiple new columns, named after the list elements.** Each name in the list becomes a new column.

## Syntax

**`unnest_wider(data, col, names_sep = NULL, names_repair = "check_unique")`. names_sep prefixes column names.**

```r title="Spread a JSON-like list column"
library(tidyr)
library(dplyr)

df <- tibble(
  user = c("a","b"),
  details = list(
    list(age = 30, city = "NYC"),
    list(age = 25, city = "LA")
  )
)

df |>
  unnest_wider(details)
#>   user age city
#> 1    a  30  NYC
#> 2    b  25   LA
```

[TIP]
**Use `unnest_wider` after `jsonlite::fromJSON()` to extract JSON object fields into separate columns.** Common ETL pattern for API responses.

## Five common patterns

### 1. Standard wide unnest

```r title="Each list name -> column"
df |> unnest_wider(details)
```

### 2. Prefix new column names

```r title="Avoid name conflicts"
df |> unnest_wider(details, names_sep = "_")
#> Columns become details_age, details_city
```

### 3. JSON parsing workflow

```r title="Parse JSON then unnest"
library(jsonlite)
df <- tibble(json = c('{"a":1,"b":2}', '{"a":3,"b":4}'))

df |>
  mutate(parsed = lapply(json, fromJSON)) |>
  unnest_wider(parsed)
#>   json          a b
#> 1 {"a":1,"b":2} 1 2
#> 2 {"a":3,"b":4} 3 4
```

### 4. From a list of one-row tibbles

```r title="Each cell is a 1-row tibble"
df <- tibble(id = 1:2,
             info = list(tibble(a = 1, b = 2),
                         tibble(a = 3, b = 4)))
df |> unnest_wider(info)
```

### 5. Handle missing names

```r title="When some elements have different names"
df <- tibble(id = 1:2,
             obj = list(list(a = 1, b = 2),
                        list(a = 3)))
df |> unnest_wider(obj)
#>   id  a    b
#> 1  1  1    2
#> 2  2  3   NA   <-- b missing in second list
```

[KEY INSIGHT]
**`unnest_wider` is the standard tool for "JSON object -> columns".** Combined with `purrr::map()` and `jsonlite::fromJSON`, it turns nested API responses into tabular data.

## unnest_wider() vs unnest_longer() vs unnest() vs hoist

| Function | Input shape | Output |
|---|---|---|
| `unnest_wider()` | Named lists | New columns |
| `unnest_longer()` | Vectors | New rows |
| `unnest()` | Tibbles | New rows |
| `hoist()` | Named lists, specific elements | Specific new columns |

When to use which:

- unnest_wider for ALL fields of a named list.
- hoist for SPECIFIC fields by name.
- unnest_longer for vectors.
- unnest for tibbles.

## A practical workflow

**The "API response to data frame" pattern uses unnest_wider extensively.**

```r
library(jsonlite)

api_responses |>
  mutate(parsed = lapply(json_str, fromJSON)) |>
  unnest_wider(parsed) |>
  unnest_wider(user_info, names_sep = "_user")  # nested object
```

JSON with nested objects requires multiple unnest_wider calls.

## Common pitfalls

**Pitfall 1: name conflicts.** If the list contains a name that already exists in the data frame (e.g., both have an "id"), unnest_wider errors. Use `names_sep` or `names_repair` to handle.

**Pitfall 2: confusing with unnest.** unnest expects each cell to be a tibble; output is rows. unnest_wider also works on 1-row tibbles but more naturally on named lists; output is columns.

[WARNING]
**`unnest_wider()` may produce many NA values if the list elements have different names.** Each row gets a column for EVERY name seen across all list cells.

## Try it yourself

**Try it:** Spread a list column of `list(score, grade)` into two columns. Save to `ex_wide`.

```r title="Your turn: list to columns"
df <- tibble(
  student = c("a","b"),
  results = list(list(score = 90, grade = "A"),
                  list(score = 75, grade = "C"))
)

ex_wide <- df |>
  # your code here

ex_wide
#> Expected: 2 rows with student, score, grade columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_wide <- df |>
  unnest_wider(results)

ex_wide
#>   student score grade
#> 1       a    90     A
#> 2       b    75     C
```

**Explanation:** Each list's named elements become columns. score and grade are extracted from each cell.

</details>

## Related tidyr / purrr functions

After mastering unnest_wider, look at:

- `unnest_longer()`: vectors to rows
- `unnest()`: tibbles to rows
- `hoist()`: extract specific elements
- `pack()`: opposite (combine columns into list)
- `jsonlite::fromJSON()`: JSON to R objects

## FAQ

**What does unnest_wider do in tidyr?**

`unnest_wider(data, col)` spreads a list column where each cell is a named list (or 1-row tibble) into multiple new columns, named after the list elements.

**What is the difference between unnest_wider and unnest_longer?**

unnest_wider creates new COLUMNS (one per name). unnest_longer creates new ROWS (one per element). Different output shapes.

**How do I avoid column name conflicts with unnest_wider?**

Pass `names_sep = "_"` to prefix new column names with the original list-column's name, or use `names_repair = "unique"`.

**Can I use unnest_wider on JSON?**

Yes. After parsing JSON with `jsonlite::fromJSON()`, unnest_wider spreads each top-level field into a column.

**What if my list elements have different names?**

unnest_wider creates a column for EVERY name seen across all cells. Cells without that name get NA in the corresponding column.
