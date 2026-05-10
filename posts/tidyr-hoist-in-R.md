---
title: "tidyr hoist() in R: Extract Specific List Column Elements"
slug: "tidyr-hoist-in-R"
description: "Use tidyr hoist() to extract specific named elements from list columns in R. Covers vs unnest_wider, deep paths, and 5 worked examples."
keywords: "tidyr hoist, R hoist list column, hoist vs unnest_wider, deep extraction R, JSON specific fields, hoist path"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::hoist()|tidyr hoist|extract list elements|hoist vs unnest_wider|JSON specific fields"
auto_link_case_sensitive: true
target_keyword: "tidyr hoist"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr hoist() in R: Extract Specific List Column Elements

<p class="lead">The <code>hoist()</code> function in tidyr extracts SPECIFIC named elements from a list column into new top-level columns. Unlike <code>unnest_wider()</code> which spreads ALL elements, hoist picks only what you ask for.</p>

[QUICK ANSWER]
df |> hoist(json_col, name = "name", age = "age")
df |> hoist(json_col, city = list("address", "city"))   # deep path
df |> hoist(json_col, n = "count", .remove = FALSE)
df |> unnest_wider(json_col)              # different: ALL elements

[DECISION TREE: Is hoist() the right tool?]
- extract a few SPECIFIC fields from list column: hoist()
- extract ALL fields: unnest_wider()
- deep nested path: hoist(col, x = list("a","b","c"))
- preserve original list column: .remove = FALSE
- vectors -> rows: unnest_longer()

## What hoist() does in one sentence

**`hoist(data, col, ...)` extracts SPECIFIC named (or pathed) elements from a list column into new columns; the original list column is removed by default.** Unlike unnest_wider, you specify exactly which fields to extract.

## Syntax

**`hoist(data, col, ..., .remove = TRUE, .ptype = NULL)`. `...` is `new_col_name = "field_name"` or `new_col_name = list(path)`.**

```r title="Extract specific fields"
library(tidyr)
library(dplyr)

df <- tibble(
  user = c("a","b"),
  details = list(
    list(age = 30, city = "NYC", country = "US"),
    list(age = 25, city = "LA",  country = "US")
  )
)

df |>
  hoist(details, age = "age", city = "city")
#>   user age city
#> 1    a  30  NYC
#> 2    b  25   LA
```

[TIP]
**Use `hoist` when you only need a few fields from a deeply nested list column.** unnest_wider extracts ALL fields, which is often more than you want for downstream analysis.

## Five common patterns

### 1. Extract two specific fields

```r title="Just age and city"
df |> hoist(details, age = "age", city = "city")
```

### 2. Deep path via list

```r title="Nested object access"
df <- tibble(
  user = "a",
  data = list(list(profile = list(address = list(city = "NYC"))))
)

df |>
  hoist(data, city = list("profile", "address", "city"))
#>   user city
#> 1    a  NYC
```

The list path navigates nested structures.

### 3. Keep the original list column

```r title="Don't remove, keep for further extraction"
df |> hoist(details, age = "age", .remove = FALSE)
#> Both age column AND details list column survive
```

### 4. Specify type

```r title="Force the new column type"
df |> hoist(details, age = "age", .ptype = list(age = integer()))
```

### 5. Combine with unnest_wider for hybrid

```r title="Hoist some, unnest the rest"
df |>
  hoist(details, age = "age", .remove = FALSE) |>
  unnest_wider(details)
```

[KEY INSIGHT]
**`hoist` is more efficient than `unnest_wider` when you only need a few fields.** unnest_wider creates a column for every name in every list cell; hoist creates only the columns you ask for. For wide JSON with 50+ fields and you only need 3, hoist is much cleaner.

## hoist() vs unnest_wider() vs purrr::map

| Function | Extracts | Best for |
|---|---|---|
| `hoist(col, x = "x")` | Specific named fields | A few fields from many |
| `unnest_wider(col)` | ALL named fields | Most fields needed |
| `purrr::map_chr(col, "x")` | One field, vector output | Quick scalar extraction |

When to use which:

- hoist for selective extraction with deep paths.
- unnest_wider when you want everything.
- purrr::map_* for one-off vector extraction.

## A practical workflow

**Use hoist for selective JSON parsing in API response pipelines.**

```r
library(jsonlite)

api_responses |>
  mutate(parsed = lapply(json_str, fromJSON)) |>
  hoist(parsed,
        user_id = "user_id",
        name    = list("user", "name"),
        email   = list("user", "contact", "email"))
```

Extract only the fields you need; ignore the rest of the JSON.

## Common pitfalls

**Pitfall 1: deep path syntax.** Use `list("a", "b", "c")` for nested paths, not `"a.b.c"`. Strings are field names; lists are path navigators.

**Pitfall 2: missing fields.** If a list cell lacks the requested field, the new column has NA for that row. Useful for sparse data.

[WARNING]
**`hoist()` with `.remove = TRUE` (default) removes the source list column.** Pass `.remove = FALSE` if you want to do further extraction or keep the original.

## Try it yourself

**Try it:** Extract only "age" from a list column. Save to `ex_age`.

```r title="Your turn: hoist age"
df <- tibble(
  user = c("a","b","c"),
  info = list(list(age = 30, city = "NYC"),
               list(age = 25, city = "LA"),
               list(age = 40, city = "SF"))
)

ex_age <- df |>
  # your code here

ex_age
#> Expected: user, age columns (no city, no info)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_age <- df |>
  hoist(info, age = "age")

ex_age
#>   user age
#> 1    a  30
#> 2    b  25
#> 3    c  40
```

**Explanation:** hoist extracts only the "age" field; the rest of info is discarded (because .remove = TRUE).

</details>

## Related tidyr / purrr functions

After mastering hoist, look at:

- `unnest_wider()`: extract all fields
- `unnest_longer()`: vectors to rows
- `purrr::map_chr()` / `map_dbl()`: scalar extraction
- `jsonlite::fromJSON()`: JSON to R objects
- `pluck()`: deep list navigation

## FAQ

**What does hoist do in tidyr?**

`hoist(data, col, ...)` extracts specific named elements from a list column into new columns. Unlike unnest_wider, it picks only what you specify.

**What is the difference between hoist and unnest_wider?**

hoist extracts SPECIFIC fields (you name them). unnest_wider extracts ALL fields. hoist is selective; unnest_wider is comprehensive.

**How do I extract a deeply nested field with hoist?**

Use `list("path","to","field")`: `hoist(col, x = list("a", "b", "c"))` navigates obj$a$b$c.

**Does hoist remove the original list column?**

By default yes (.remove = TRUE). Pass `.remove = FALSE` to keep it.

**What happens if a field is missing in some cells?**

That row's new column gets NA. hoist tolerates missing fields gracefully.
