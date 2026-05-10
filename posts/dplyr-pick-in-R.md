---
title: "dplyr pick() in R: Select Columns Inside dplyr Verbs"
slug: "dplyr-pick-in-R"
description: "Use dplyr pick() to select columns inside summarise, mutate, or filter using tidyselect helpers in R. Covers pick vs across, select, NSE, 5 examples."
keywords: "dplyr pick, R pick columns, pick vs across, dplyr 1.1 pick, pick tidyselect, pick inside summarise, pick mutate"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "pick()|dplyr pick|pick columns|pick inside summarise|pick vs across"
auto_link_case_sensitive: true
target_keyword: "dplyr pick"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr pick() in R: Select Columns Inside dplyr Verbs

<p class="lead">The <code>pick()</code> function in dplyr 1.1 selects columns INSIDE a dplyr verb (mutate, summarise, filter), returning a TIBBLE of the chosen columns for use in expressions. It complements <code>across()</code> for "many columns at once" computations.</p>

[QUICK ANSWER]
df |> mutate(total = rowSums(pick(x:z)))
df |> summarise(across(everything(), mean), n = nrow(pick(everything())))
df |> filter(rowSums(pick(where(is.numeric)) > 0) > 0)
df |> mutate(combo = paste(pick(a, b), collapse = "-"))
across(cols, fn)                   # related: applies fn per column

[DECISION TREE: Is pick() the right tool?]
- pass multiple columns as a tibble to a function: pick()
- apply a function PER column: across()
- select columns to keep (top-level): select()
- row-wise reduction over multiple cols: pick() + rowSums/rowMeans
- in mutate body, select cols dynamically: pick()
- count distinct combinations: n_distinct(pick(cols))

## What pick() does in one sentence

**`pick(...)` selects columns using tidyselect helpers and returns them as a TIBBLE; it is meant for use INSIDE dplyr verbs (mutate, summarise, filter).** Outside those contexts, behavior is undefined.

`pick` was added in dplyr 1.1 as a cleaner replacement for `across(.fns = NULL)` and the older `cur_data()` patterns.

## Syntax

**`pick(...)`. `...` uses tidyselect: `everything()`, `where(is.numeric)`, `x:z`.**

```r title="Row sum across selected columns"
library(dplyr)

df <- data.frame(x = 1:3, y = 4:6, z = 7:9, label = c("a","b","c"))

df |>
  mutate(total = rowSums(pick(x:z)))
#>   x y z label total
#> 1 1 4 7     a    12
#> 2 2 5 8     b    15
#> 3 3 6 9     c    18
```

[TIP]
**Use `pick()` when a function takes a DATA FRAME (or tibble) as input, like `rowSums`, `nrow`, `n_distinct`.** Use `across()` when applying a function PER COLUMN.

## Five common patterns

### 1. Row-wise sum / mean

```r title="rowSums needs a data frame"
df |>
  mutate(total = rowSums(pick(x:z)))
```

`pick(x:z)` returns a tibble; `rowSums` operates on it.

### 2. Count distinct combinations

```r title="Unique tuples across multiple columns"
df |>
  summarise(n = n_distinct(pick(x, y)))
```

`n_distinct(pick(...))` counts distinct combinations of x and y.

### 3. Filter by row-wise condition

```r title="Keep rows where ANY numeric column > 5"
df |>
  filter(rowSums(pick(where(is.numeric)) > 5) > 0)
```

`pick(where(is.numeric))` selects numeric columns; `rowSums(... > 5)` checks if any are > 5 per row.

### 4. Pass multiple columns to a custom function

```r title="Custom aggregator"
df |>
  summarise(custom = my_function(pick(a, b, c)))
```

When `my_function` expects a tibble of inputs.

### 5. Replace older cur_data() pattern

```r title="Modern equivalent of cur_data()"
# Old (deprecated):
# df |> mutate(x = cur_data() |> some_fn())
# New:
df |>
  mutate(x = pick(everything()) |> some_fn())
```

`pick(everything())` is the modern replacement for `cur_data()`.

[KEY INSIGHT]
**`pick()` returns a TIBBLE; `across()` applies a function per column.** They solve different problems: pick when the downstream function takes a data frame; across when it takes a vector and you want to apply per column. Both use tidyselect for column selection.

## pick() vs across() vs select()

**Three "select columns" verbs in dplyr.**

| Function | Returns | Where used | Best for |
|---|---|---|---|
| `pick(cols)` | Tibble of cols | Inside mutate/summarise/filter | Pass multiple cols to one function |
| `across(cols, fn)` | Auto-named columns | Inside mutate/summarise | Apply fn per column |
| `select(df, cols)` | Filtered data frame | Top-level pipeline | Keep only chosen columns |

When to use which:

- `select` for picking columns to keep in the output.
- `across` for "apply fn to each of these columns".
- `pick` for "give me these columns as a tibble for a single computation".

## A practical workflow

**The "row-wise computation" pattern is pick's killer use case.**

```r title="Multi-column row-wise computation"
df |>
  mutate(
    total       = rowSums(pick(starts_with("score_"))),
    n_filled    = rowSums(!is.na(pick(starts_with("score_")))),
    avg_score   = total / n_filled
  )
```

Compute total, count of non-NA, and average across all `score_*` columns. Without pick, you'd need to list each score column manually or use rowwise (slower).

For categorical concatenation:

```r title="Concatenate two categorical columns"
df |>
  mutate(combo = apply(pick(category, subcategory), 1, paste, collapse = "_"))
```

## Common pitfalls

**Pitfall 1: pick outside dplyr verbs.** `mtcars |> pick(mpg:wt)` errors. pick must be called inside `mutate`, `summarise`, or `filter`.

**Pitfall 2: confusing pick with across.** pick returns a tibble (one object); across applies a function and returns multiple columns. They are different shapes.

[WARNING]
**`pick()` is dplyr 1.1+ only.** Older dplyr installations don't have it. For older code, the equivalent was `select(df, cols)` outside the verb, or `across(cols)` with NULL function (deprecated).

## When pick replaced cur_data

**Before pick was added in dplyr 1.1, accessing the current group's data inside summarise required `cur_data()`.** This was confusing because cur_data sometimes meant "all columns" and sometimes meant "selected columns" depending on context. pick replaces it with explicit column selection: `pick(everything())` is the modern equivalent of `cur_data()`, and `pick(specific, cols)` is the explicit subset version. This change makes it clearer in code reviews exactly which columns a function call operates on, reducing the cognitive overhead of debugging summarise expressions.

## Try it yourself

**Try it:** Compute a row-wise total of `mpg`, `disp`, and `hp` for each car using pick + rowSums. Save to `ex_total`.

```r title="Your turn: row-wise total of 3 columns"
ex_total <- mtcars |>
  # your code here

head(ex_total$total)
#> Expected: numeric vector of row totals
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_total <- mtcars |>
  mutate(total = rowSums(pick(mpg, disp, hp)))

head(ex_total$total)
#> [1] 281.0 281.0 224.8 282.4 543.7 333.1
```

**Explanation:** `pick(mpg, disp, hp)` returns a 3-column tibble; `rowSums` adds them per row.

</details>

## Related dplyr functions

After mastering pick, look at:

- `across()`: per-column transformation
- `select()`: top-level column selection
- `cur_data()`: deprecated; use pick(everything())
- `c_across()`: rowwise sister of across
- `rowwise()`: per-row evaluation context
- `n_distinct()`: count unique combinations

For "apply fn to each column", `across` is correct. For "operate on multi-column block", `pick` is the modern tool.

## FAQ

**What does pick do in dplyr?**

`pick(...)` selects columns using tidyselect helpers and returns them as a tibble. Used inside dplyr verbs to pass multiple columns to a function that expects a data frame.

**What is the difference between pick and across in dplyr?**

pick returns ONE tibble of the selected columns. across applies a function PER column and returns multiple columns. Different return shapes, different use cases.

**When was pick introduced in dplyr?**

In dplyr 1.1.0 (Jan 2023). Older versions don't have it; use `cur_data()` or `across()` workarounds.

**Can pick be used outside dplyr verbs?**

No. pick errors outside `mutate`, `summarise`, `filter`. For top-level column selection, use `select()`.

**How do I count distinct combinations of multiple columns?**

`n_distinct(pick(col1, col2))` returns the count of unique (col1, col2) tuples. Cleaner than `n_distinct(col1, col2)` which works on the same data but is less explicit.
