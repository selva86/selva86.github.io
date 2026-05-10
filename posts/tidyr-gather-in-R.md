---
title: "tidyr gather() in R: Wide to Long (Superseded by pivot_longer)"
slug: "tidyr-gather-in-R"
description: "Use tidyr gather() to reshape wide to long format in R (superseded by pivot_longer). Covers migration, key/value, vs pivot_longer, and 5 examples."
keywords: "tidyr gather, R gather vs pivot_longer, gather superseded, wide to long R, tidyr reshape, gather migration"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::gather()|tidyr gather|gather superseded|gather vs pivot_longer|wide to long"
auto_link_case_sensitive: true
target_keyword: "tidyr gather"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr gather() in R: Wide to Long (Superseded by pivot_longer)

<p class="lead">The <code>gather()</code> function in tidyr reshapes data from WIDE to LONG format. As of tidyr 1.0, it is SUPERSEDED by <code>pivot_longer()</code>; existing code works but new code should use pivot_longer.</p>

[QUICK ANSWER]
df |> gather(key = "var", value = "val", a, b, c)         # superseded
df |> pivot_longer(cols = c(a, b, c), names_to = "var", values_to = "val")  # modern
df |> gather(key, value, -id)                              # gather all but id
df |> pivot_longer(-id, names_to = "key", values_to = "value")              # modern

[DECISION TREE: Should I use gather()?]
- new code: NO. Use pivot_longer().
- legacy code: works.
- migration: gather(key=X, value=Y, cols) -> pivot_longer(cols, names_to=X, values_to=Y).

## What gather() did in one sentence

**`gather(data, key, value, cols)` took a wide data frame and stacked the named columns into TWO new columns: a `key` column (column names) and a `value` column (the values).** Since tidyr 1.0, it is superseded by the more flexible `pivot_longer()`.

## Migration

**Replace `gather(key = X, value = Y, cols)` with `pivot_longer(cols, names_to = X, values_to = Y)`.**

```r title="Old vs new"
library(tidyr)

wide <- tibble(id = 1:3, a = 10:12, b = 20:22, c = 30:32)

# OLD (still works):
wide |> gather(key = "var", value = "val", a, b, c)

# NEW:
wide |> pivot_longer(cols = c(a, b, c), names_to = "var", values_to = "val")
#>   id var val
#>   1  a   10
#>   1  b   20
#>   1  c   30
#>   2  a   11
#>   ...
```

[TIP]
**`pivot_longer()` supports more than one value column at once and has cleaner argument naming.** For new code, always use pivot_longer.

## Five common patterns (legacy)

### 1. Standard gather

```r title="Wide to long"
df |> gather(key = "var", value = "val", -id)
```

Modern: `pivot_longer(-id, names_to = "var", values_to = "val")`.

### 2. Specific columns

```r title="Only some columns"
df |> gather(key = "metric", value = "value", a, b, c)
```

Modern: `pivot_longer(c(a, b, c), names_to = "metric", values_to = "value")`.

### 3. Tidyselect

```r title="Use tidyselect helpers"
df |> gather(key = "key", value = "val", starts_with("score_"))
```

Modern: `pivot_longer(starts_with("score_"), names_to = "key", values_to = "val")`.

### 4. Drop NA

```r title="na.rm = TRUE"
df |> gather(key = "var", value = "val", a, b, na.rm = TRUE)
```

Modern: `pivot_longer(c(a, b), names_to = "var", values_to = "val", values_drop_na = TRUE)`.

### 5. Verify same result

```r title="Identical output"
old <- df |> gather(key = "var", value = "val", a, b, c)
new <- df |> pivot_longer(c(a, b, c), names_to = "var", values_to = "val")
identical(old, new)
```

[KEY INSIGHT]
**Gather was superseded because pivot_longer is more powerful.** pivot_longer handles names_pattern (regex), multiple value columns, and complex naming via names_glue. Gather had none of these.

## gather() vs pivot_longer()

| Feature | gather() | pivot_longer() |
|---|---|---|
| Wide -> long | Yes | Yes |
| Multiple value columns | No | Yes |
| names_pattern (regex) | No | Yes |
| names_sep (split key) | No | Yes |
| values_drop_na | Yes (na.rm) | Yes |
| Status | Superseded | Recommended |

## A practical migration

```r
# Before:
df |> gather(key, value, -id)

# After:
df |> pivot_longer(-id, names_to = "key", values_to = "value")
```

Argument names are explicit; positional args of gather were less obvious.

## Common pitfalls

**Pitfall 1: confusing key and value.** gather takes (key, value, ...) where key gets the COLUMN names and value gets the values. pivot_longer makes this explicit with names_to and values_to.

**Pitfall 2: forgetting tidyselect.** gather uses tidyselect for its column args. So does pivot_longer.

[WARNING]
**`gather` and `spread` were superseded in tidyr 1.0 (2019).** That's many years ago. Most current tutorials use pivot_longer/pivot_wider. Migrating saves you from outdated examples.

## Try it yourself

**Try it:** Reshape a wide data frame to long using BOTH gather and pivot_longer, then verify identical output. Save check to `ex_check`.

```r title="Your turn: confirm gather == pivot_longer"
wide <- tibble(id = 1:2, x = c(10, 20), y = c(100, 200))

old <- wide |> gather(key = "var", value = "val", -id)
new <- wide |> pivot_longer(-id, names_to = "var", values_to = "val")

ex_check <- # your code here

ex_check
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_check <- identical(old, new)

ex_check
#> [1] TRUE
```

**Explanation:** For simple wide-to-long, both produce identical output.

</details>

## Related tidyr functions

After understanding gather's deprecation, look at:

- `pivot_longer()`: modern replacement
- `pivot_wider()`: opposite direction
- `tidyr::spread()`: also superseded
- `tidyr::unite()`: combine columns into one
- `tidyr::separate_wider_delim()`: split column

## FAQ

**Is gather deprecated in tidyr?**

Superseded since tidyr 1.0 (2019). Use `pivot_longer()` for new code.

**What is the modern replacement for gather?**

`pivot_longer(cols, names_to = "key", values_to = "value")`.

**Why was gather superseded?**

It couldn't handle multiple value columns or complex name parsing. pivot_longer is a strict superset.

**Are gather and spread both superseded?**

Yes. gather -> pivot_longer; spread -> pivot_wider. Both since tidyr 1.0.

**Will gather be removed?**

Possibly in a future major version. Migrate proactively.
