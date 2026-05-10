---
title: "dplyr coalesce() in R: First Non-NA Value Across Vectors"
slug: "dplyr-coalesce-in-R"
description: "Use dplyr coalesce() to fill NA from a fallback value or vector in R. Covers scalar fallback, vector chains, vs replace_na, vs ifelse, and 5 examples."
keywords: "dplyr coalesce, R coalesce NA, coalesce vs replace_na, fill NA fallback R, first non-NA dplyr, R coalesce vector chain"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "coalesce()|dplyr coalesce|first non-NA|fill NA fallback|coalesce chain"
auto_link_case_sensitive: true
target_keyword: "dplyr coalesce"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr coalesce() in R: First Non-NA Value Across Vectors

<p class="lead">The <code>coalesce()</code> function in dplyr returns the first non-<code>NA</code> value across multiple vectors element-wise. It is the SQL <code>COALESCE</code> ported to R, and the cleanest way to fill missing values with a fallback.</p>

[QUICK ANSWER]
coalesce(x, 0)                       # NA in x becomes 0
coalesce(x, y)                       # NA in x replaced from y elementwise
coalesce(x, y, z)                    # tries x, then y, then z
coalesce(c(1, NA, 3), c(99, 99, 99)) # c(1, 99, 3)
df |> mutate(name = coalesce(name, "anonymous"))
tidyr::replace_na(x, 0)              # equivalent for scalar fallback

[DECISION TREE: Is coalesce() the right tool?]
- fill NA with one scalar fallback: coalesce(x, value) or replace_na()
- fill NA from another vector: coalesce(x, y)
- chain multiple fallbacks: coalesce(x, y, z, ...)
- convert specific value to NA: na_if() (inverse direction)
- conditional logic, not just NA: case_when() or if_else()
- for sums/means with na.rm: sum(x, na.rm = TRUE), a different problem

## What coalesce() does in one sentence

**`coalesce(...)` returns a vector where each element is the first non-NA value taken from the corresponding element of each input vector.** Inputs must be the same length (or recyclable) and the same type.

This is the canonical "fill NA with a fallback" function. Use it whenever you have a primary source and one or more backup sources.

## Syntax

**`coalesce(...)`. Variadic; pass any number of vectors. Returns the first non-NA per element.**

```r title="Replace NAs with zero"
library(dplyr)

x <- c(1, NA, 3, NA, 5)
coalesce(x, 0)
#> [1] 1 0 3 0 5
```

[TIP]
**For a scalar fallback, `coalesce(x, 0)` and `tidyr::replace_na(x, 0)` are equivalent.** Pick the one your pipeline already uses. coalesce shines when the fallback is itself a vector.

## Five common patterns

### 1. Scalar fallback

```r title="Default to 0 for any NA"
x <- c(10, NA, 30, NA, 50)
coalesce(x, 0)
#> [1] 10  0 30  0 50
```

### 2. Vector fallback (column-wise)

```r title="Fill from a backup column"
primary  <- c(1, NA, 3, NA)
backup   <- c(99, 99, 99, 99)
coalesce(primary, backup)
#> [1]  1 99  3 99
```

### 3. Chain of fallbacks

```r title="Try several backups in order"
x <- c(1, NA, NA, NA)
y <- c(NA, 2, NA, NA)
z <- c(NA, NA, 3, NA)
coalesce(x, y, z, 0)
#> [1] 1 2 3 0
```

The first non-NA per position wins.

### 4. Use inside mutate

```r title="Fill missing names with placeholder"
df <- data.frame(name = c("Alice", NA, "Carol"))

df |>
  mutate(name = coalesce(name, "anonymous"))
#>        name
#> 1     Alice
#> 2 anonymous
#> 3     Carol
```

### 5. Coalesce columns of mixed sources

```r title="Take primary column when present, secondary when not"
df <- data.frame(
  primary   = c(10, NA, 30, NA),
  secondary = c(99, 88, 77, 66)
)

df |>
  mutate(value = coalesce(primary, secondary))
#>   primary secondary value
#> 1      10        99    10
#> 2      NA        88    88
#> 3      30        77    30
#> 4      NA        66    66
```

A staple in data-merging pipelines: prefer column A's value, fall back to column B if NA.

[KEY INSIGHT]
**`coalesce(x, y, z, default)` is the idiomatic way to express "pick the first available source".** Common scenarios: primary key from main table, fallback to a join key, default to a constant if both are NA. SQL programmers know this pattern; dplyr ports it cleanly to R.

## coalesce() vs replace_na() vs ifelse() vs if_else()

**Four ways to handle NAs in R, with different shapes.**

| Function | Use case | Shape |
|---|---|---|
| `coalesce(x, y)` | First non-NA across vectors | x, y same length |
| `tidyr::replace_na(x, v)` | NA in x -> v | x is vector, v scalar |
| `dplyr::if_else(is.na(x), y, x)` | Equivalent to coalesce(x, y) | More verbose |
| `base::ifelse(is.na(x), y, x)` | Same; less type-strict | Less safe |
| `dplyr::na_if(x, val)` | Convert val to NA | Inverse direction |

When to use which:

- `coalesce` for fallback-chain semantics.
- `replace_na` for one scalar default.
- `if_else` if you need explicit logic.
- `na_if` for converting sentinels TO NA.

## A practical workflow

**The most common coalesce pattern is "merge two columns": prefer A, fall back to B.**

```r title="Three-source merge"
df |>
  mutate(price = coalesce(price_v2, price_v1, 0))
```

Three-source merge: try the new price column, then the legacy column, then default to 0. One line replaces a nested if_else chain.

For text fields, coalesce with a placeholder is the classic "show something or else 'unknown'" idiom:

```r title="Label fallback chain"
df |> mutate(label = coalesce(label, alt_label, "unknown"))
```

## Common pitfalls

**Pitfall 1: type mismatch.** `coalesce(c(1, 2), c("a", "b"))` errors because numeric and character don't share a type. Convert one side first.

**Pitfall 2: scalar recycling surprises.** `coalesce(c(1, NA, 3), 0)` works because the scalar 0 recycles. But `coalesce(c(1, NA, 3), c(0, 0))` errors because length 2 doesn't recycle to length 3. Use a length-1 fallback or a length-matching vector.

[WARNING]
**`coalesce()` returns NA only if EVERY input is NA at that position.** If any input has a non-NA value, that wins. To test "ALL are NA", use `all(is.na(c(x[i], y[i], z[i])))` per row, or `rowwise() + mutate`.

## Try it yourself

**Try it:** Merge `price_new` and `price_old`, falling back to 0 when both are NA. Save to `ex_price`.

```r title="Your turn: merge two price columns"
df <- data.frame(
  price_new = c(10, NA, 30, NA),
  price_old = c(NA, 20, 25, NA)
)

ex_price <- df |>
  # your code here

ex_price$price
#> Expected: c(10, 20, 30, 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_price <- df |>
  mutate(price = coalesce(price_new, price_old, 0))
ex_price$price
#> [1] 10 20 30  0
```

**Explanation:** `coalesce` tries `price_new` first; if NA, falls to `price_old`; if still NA, the scalar 0.

</details>

## Related dplyr functions

After mastering coalesce, look at:

- `tidyr::replace_na()`: scalar fallback only
- `dplyr::na_if()`: inverse (value -> NA)
- `dplyr::if_else()`: 2-way conditional
- `dplyr::case_when()`: multi-condition mapping
- `dplyr::across()`: apply coalesce across multiple columns
- `mean(x, na.rm = TRUE)`: ignoring NAs in aggregates is a different operation

For multi-column NA filling, `mutate(across(everything(), ~ coalesce(.x, 0)))` cleans every column at once.

## FAQ

**What does coalesce do in dplyr?**

`coalesce(x, y, ...)` returns the first non-NA value across the inputs, element-wise. Used to fill NAs with a fallback vector or scalar.

**What is the difference between coalesce and replace_na?**

`replace_na(x, v)` replaces NA with a scalar v. `coalesce(x, v)` does the same. coalesce additionally allows multiple fallback vectors and a chain. Use replace_na for simple scalar; coalesce for vector chains.

**Can coalesce handle multiple fallback columns?**

Yes. `coalesce(x, y, z, default)` tries each in order. The first non-NA per position wins.

**What happens if all inputs are NA?**

coalesce returns NA. To convert to a default, append a non-NA scalar at the end: `coalesce(x, y, 0)`.

**Does coalesce work on character columns?**

Yes. All inputs must share a type. `coalesce(c("a", NA, "c"), "unknown")` works; `coalesce(c("a", NA), 1)` errors.
