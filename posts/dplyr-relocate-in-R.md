---
title: "dplyr relocate() in R: Reorder Columns Easily"
slug: "dplyr-relocate-in-R"
description: "Use dplyr relocate() to move columns to specific positions in R. Covers .before, .after anchors, tidyselect helpers, last_col(), and 6 worked examples."
keywords: "dplyr relocate, reorder columns R, move columns dplyr, dplyr column position, .before .after dplyr, R rearrange columns"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "relocate()|dplyr relocate|dplyr::relocate()|reorder columns|move columns"
auto_link_case_sensitive: true
target_keyword: "dplyr relocate"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr relocate() in R: Reorder Columns Easily

<p class="lead">The <code>relocate()</code> function in dplyr moves columns to a specific position without renaming or dropping them. Use <code>.before</code> or <code>.after</code> to anchor the move; tidyselect helpers like <code>where()</code> and <code>starts_with()</code> let you move groups of columns at once.</p>

[QUICK ANSWER]
relocate(df, hp)                           # move hp to front
relocate(df, hp, .before = mpg)            # move hp before mpg
relocate(df, hp, .after = cyl)             # move hp after cyl
relocate(df, hp, .after = last_col())      # move hp to end
relocate(df, where(is.character))          # move all chr cols to front
relocate(df, starts_with("m"))             # move m-cols to front
relocate(df, name, .before = everything()) # name column first

[DECISION TREE: Is relocate() the right tool?]
- move columns to a position: relocate(df, hp, .before = mpg)
- rename without moving: rename(df, new = old)
- pick subset and reorder: select(df, name, mass, everything())
- sort rows (not columns): arrange(df, x)
- transpose data: t(df) (base R, returns matrix)
- pivot wide to long: pivot_longer(df, cols = ...)
- alphabetize column names: select(df, sort(tidyselect::peek_vars()))

## What relocate() does in one sentence

**`relocate()` moves columns to a specific position without renaming, dropping, or transforming them.** You select columns with bare names or tidyselect helpers, then anchor the move with `.before` or `.after`. Without an anchor, the selected columns move to the front.

Unlike `select(df, hp, mpg, everything())` (which renames implicitly via order), `relocate()` is a pure positioning operation. The data and names are unchanged; only the column order shifts.

## Syntax

**`relocate()` takes columns to move plus an optional `.before` or `.after` anchor.** Without an anchor, columns move to the front (position 1).

```r title="Load dplyr and inspect mtcars"
library(dplyr)

names(mtcars)
#> [1] "mpg"  "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "vs"   "am"   "gear" "carb"
```

The full signature:

```
relocate(.data, ..., .before = NULL, .after = NULL)
```

`.before` and `.after` are mutually exclusive. Both accept a single column name or a tidyselect expression.

[TIP]
**Use `last_col()` to refer to the rightmost column.** `relocate(df, hp, .after = last_col())` moves `hp` to the end. `relocate(df, hp, .before = last_col())` puts `hp` second-to-last. Useful when you do not know the exact column count.

## Six common patterns

### 1. Move column to the front

```r title="Move hp to position 1"
mtcars |>
  relocate(hp) |>
  names() |>
  head(5)
#> [1] "hp"   "mpg"  "cyl"  "disp" "drat"
```

Without an anchor, the named columns move to position 1, in the order specified.

### 2. Move with .before

```r title="Move hp before mpg"
mtcars |>
  relocate(hp, .before = mpg) |>
  names() |>
  head(5)
#> [1] "hp"   "mpg"  "cyl"  "disp" "drat"
```

In this case `.before = mpg` produces the same result as no anchor (because mpg is currently first), but the intent is clearer.

### 3. Move with .after

```r title="Move hp after cyl"
mtcars |>
  relocate(hp, .after = cyl) |>
  names() |>
  head(5)
#> [1] "mpg"  "cyl"  "hp"   "disp" "drat"
```

`.after = cyl` places hp directly after cyl. Other columns shift right.

### 4. Move to the end

```r title="Move mpg to the last position"
mtcars |>
  relocate(mpg, .after = last_col()) |>
  names() |>
  head(5)
#> [1] "cyl"  "disp" "hp"   "drat" "wt"
```

`last_col()` references whichever column is last after the move. Combined with `.after`, this puts the named column at the very end.

### 5. Move a group of columns by predicate

```r title="Move all character columns to the front"
starwars |>
  relocate(where(is.character)) |>
  names() |>
  head(5)
#> [1] "name"       "hair_color" "skin_color" "eye_color"  "sex"
```

Tidyselect helpers like `where()`, `starts_with()`, `contains()` work inside relocate. Multiple columns move as a group.

### 6. Identifier columns first idiom

```r title="Put name column first"
starwars |>
  relocate(name, .before = everything()) |>
  names() |>
  head(5)
#> [1] "name"   "height" "mass"   "hair_color" "skin_color"
```

`.before = everything()` puts the column at the start. This is a common idiom for "make this the identifier column".

[KEY INSIGHT]
**`relocate()` and `select()` can both reorder, but they differ in dropping behavior.** `relocate()` keeps every column, only moving the named ones. `select(df, mpg, cyl, everything())` keeps mpg first, cyl second, then everything else, but if you forget `everything()` it DROPS the unlisted columns. Use `relocate()` when you only want to move; use `select()` when you also want to drop.

## relocate() vs select() vs base R

**Both verbs can reorder; only `select()` drops columns. Base R requires manual index manipulation.**

| Task | relocate | select | Base R |
|---|---|---|---|
| Move to front | `relocate(df, hp)` | `select(df, hp, everything())` | `df[, c("hp", setdiff(names(df), "hp"))]` |
| Move after specific col | `relocate(df, hp, .after = cyl)` | (manual: list all in order) | (manual indexing) |
| Move all numeric | `relocate(df, where(is.numeric))` | `select(df, where(is.numeric), everything())` | (loop and reconstruct) |
| Move + drop | (does not drop) | `select(df, hp, mpg)` | `df[, c("hp","mpg")]` |
| Reverse order | `relocate(df, last_col():1)` | `select(df, last_col():1)` | `df[, ncol(df):1]` |

When to use which:

- Use `relocate()` when you ONLY want to move columns.
- Use `select()` when you want to move AND drop.
- Use base R when zero dependencies matter.

## Common pitfalls

**Pitfall 1: forgetting `everything()` in select-based reorders.** `select(df, hp, mpg)` returns ONLY hp and mpg, dropping the rest. To reorder without dropping, use `relocate(df, hp, mpg)` or `select(df, hp, mpg, everything())`.

**Pitfall 2: `.before` and `.after` are mutually exclusive.** Passing both errors. Choose one; if you need to position relative to two anchors (e.g., "between A and B"), use `.before = B` and rely on the columns to settle correctly.

[WARNING]
**`relocate()` does not change column COUNT, only order.** This sounds obvious but bites users who confuse it with `select()`. If your row of names is shorter after relocate, you used the wrong verb.

**Pitfall 3: relocating into the middle of a tidyselect group.** `relocate(df, x, .after = where(is.numeric))` is ambiguous if there are multiple numeric columns. dplyr places after the LAST matching column. To be specific, name the anchor column directly.

## Try it yourself

**Try it:** In `mtcars`, move `hp` and `wt` columns immediately after `mpg`. Save the result to `ex_mt` and print the column names.

```r title="Your turn: reorder columns"
# Try it: hp and wt should follow mpg
ex_mt <- mtcars |>
  # your code here

names(ex_mt) |> head(6)
#> Expected: c("mpg", "hp", "wt", "cyl", "disp", "drat")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mt <- mtcars |>
  relocate(hp, wt, .after = mpg)

names(ex_mt) |> head(6)
#> [1] "mpg"  "hp"   "wt"   "cyl"  "disp" "drat"
```

**Explanation:** `relocate(hp, wt, .after = mpg)` moves both `hp` and `wt` to the position right after `mpg`, in the order specified. Other columns (cyl, disp, etc.) keep their relative order.

</details>

## Related dplyr functions

After mastering `relocate()`, look at:

- `select()` with `everything()`: alternative reorder that can also drop
- `rename()`: change column names without moving them
- `last_col()`: tidyselect helper for the rightmost column
- `everything()`: tidyselect helper that matches all remaining columns
- Base R `df[, order]`: manual reorder using a name vector

For sorting column names alphabetically, the idiom is `select(df, sort(tidyselect::peek_vars()))` or simpler: `select(df, sort(names(df)))`.

## FAQ

**How do I move a column to the front in dplyr?**

`relocate(df, col_name)` moves it to position 1. Or `relocate(df, col_name, .before = everything())` if you want to be explicit. Both produce the same result.

**How do I reorder columns without dropping any in R?**

Use `relocate()` from dplyr. It only changes positions; never drops columns. `select(df, ...)` reorders too but drops any columns you do not name unless you add `, everything()`.

**What is the difference between relocate and select in dplyr?**

`relocate()` is positioning only: it never drops columns. `select()` can rename, drop, AND reorder, but you must explicitly include `everything()` if you want to keep unmentioned columns. For a pure reorder, prefer `relocate()`.

**How do I move multiple columns at once with relocate?**

List them comma-separated: `relocate(df, hp, wt, .after = mpg)`. Both move together as a block, in the order you specified, to the position after `mpg`.

**How do I move columns to the end of a data frame?**

Use `.after = last_col()`: `relocate(df, mpg, .after = last_col())` moves `mpg` to the rightmost position. `last_col()` refers to whichever column is currently at the end.
