---
title: "tidyr separate_longer_position() in R: Split Into Rows by Position"
slug: "tidyr-separate_longer_position-in-R"
description: "Use tidyr separate_longer_position() to split a column at fixed character widths into multiple rows in R. Covers width, vs separate_longer_delim, 5 examples."
keywords: "tidyr separate_longer_position, R split column position rows, separate_longer_position width, fixed-width to rows, tidyr 1.3"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "separate_longer_position()|tidyr separate_longer_position|fixed-width to rows|split column rows position"
auto_link_case_sensitive: true
target_keyword: "tidyr separate_longer_position"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr separate_longer_position() in R: Split Into Rows by Position

<p class="lead">The <code>separate_longer_position()</code> function in tidyr 1.3 splits a string column at FIXED CHARACTER WIDTHS, creating one row per chunk. Useful for fixed-width strings that should expand to multiple rows.</p>

[QUICK ANSWER]
df |> separate_longer_position(col, width = 1)        # one char per row
df |> separate_longer_position(col, width = 2)        # 2-char chunks per row
df |> separate_longer_delim(col, delim = ",")         # delimiter alternative
df |> separate_wider_position(col, widths = c(...))   # to columns instead

[DECISION TREE: Is separate_longer_position() the right tool?]
- fixed-width chunks to rows: separate_longer_position()
- delimiter to rows: separate_longer_delim()
- fixed-width to columns: separate_wider_position()
- per-character split: separate_longer_position(width = 1)

## What separate_longer_position() does in one sentence

**`separate_longer_position(data, cols, width)` splits each value of `cols` into chunks of `width` characters and creates one row per chunk.** Other columns' values are duplicated for each new row.

## Syntax

**`separate_longer_position(data, cols, width)`. width is an integer.**

```r title="One character per row"
library(tidyr)
library(dplyr)

df <- tibble(id = 1:2, code = c("ABC","XY"))

df |>
  separate_longer_position(code, width = 1)
#>   id code
#> 1  1 A
#> 2  1 B
#> 3  1 C
#> 4  2 X
#> 5  2 Y
```

[TIP]
**This is rare in everyday work but useful for fixed-width data formats where each chunk represents a separate observation.** Often pairs with downstream `mutate` to assign a chunk ID.

## Five common patterns

### 1. Single-character split

```r title="Each char its own row"
df <- tibble(s = "ABCDE")
df |>
  separate_longer_position(s, width = 1)
#> 5 rows: A, B, C, D, E
```

### 2. Two-character chunks

```r title="Pairs of chars"
df <- tibble(s = "AABBCC")
df |>
  separate_longer_position(s, width = 2)
#> 3 rows: AA, BB, CC
```

### 3. Combine with row index

```r title="Track which chunk each row came from"
df |>
  separate_longer_position(s, width = 2) |>
  group_by(s) |>
  mutate(chunk_pos = row_number())
```

### 4. Decode bit-string

```r title="Each bit as a row"
df <- tibble(person = "alice", flags = "1010")
df |>
  separate_longer_position(flags, width = 1) |>
  group_by(person) |>
  mutate(bit_position = row_number())
```

### 5. Rare: variable-row decoding

```r title="Mix with mutate for analysis"
df |>
  separate_longer_position(code, width = 1) |>
  mutate(is_vowel = code %in% c("A","E","I","O","U"))
```

[KEY INSIGHT]
**`separate_longer_position` is uncommon — most fixed-width data goes wider (into columns), not longer (into rows).** Reach for it when each character (or fixed chunk) is its own observation, not a field of an observation.

## separate_longer_position() vs separate_longer_delim() vs strsplit

| Function | Splits by | Output |
|---|---|---|
| `separate_longer_position()` | Fixed width | New rows |
| `separate_longer_delim()` | Delimiter | New rows |
| `separate_wider_position()` | Fixed width | New columns |
| `strsplit(x, "")` | Per character | List vectors |

When to use which:

- separate_longer_position for fixed chunks to rows.
- separate_longer_delim for delimited to rows.
- separate_wider_position for fixed widths to columns.

## A practical workflow

**Use for character-level analysis of strings within a tidy framework.**

```r
words |>
  separate_longer_position(word, width = 1) |>
  group_by(word) |>
  mutate(letter_pos = row_number()) |>
  count(word, letter_pos)
```

For per-letter analysis with row indices.

## Common pitfalls

**Pitfall 1: width must divide string length cleanly.** A 5-char string with width=2 produces "AA","BB","C" (the last chunk is shorter). Verify if this is desired.

**Pitfall 2: confusing wider vs longer.** wider creates COLUMNS; longer creates ROWS. Pick by output shape.

[WARNING]
**`separate_longer_position()` requires tidyr 1.3+.** Earlier versions don't have it. The pre-1.3 alternative was hand-rolled with `substring` + bind_rows.

## Try it yourself

**Try it:** Take a single string "ABCDEF" and split into 2-character chunks (rows). Save to `ex_chunks`.

```r title="Your turn: 2-char chunks"
df <- tibble(id = 1, code = "ABCDEF")

ex_chunks <- df |>
  # your code here

ex_chunks
#> Expected: 3 rows (AB, CD, EF)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_chunks <- df |>
  separate_longer_position(code, width = 2)

ex_chunks
#>   id code
#> 1  1 AB
#> 2  1 CD
#> 3  1 EF
```

**Explanation:** Each 2-character chunk becomes a separate row.

</details>

## Related tidyr functions

After mastering separate_longer_position, look at:

- `separate_longer_delim()`: delimiter-based
- `separate_wider_position()`: fixed widths to columns
- `unnest_longer()`: list column to rows
- `strsplit()`: base R alternative

## FAQ

**What does separate_longer_position do in tidyr?**

Splits a string column into chunks of fixed character width and creates one row per chunk.

**What if width does not divide the string length cleanly?**

The last chunk is whatever characters remain (shorter than width). No error.

**What is the difference between separate_longer_position and separate_longer_delim?**

position uses fixed character widths. delim uses a delimiter. Use position when chunks are equal-length; delim for variable parts.

**Can I use this for character-level analysis?**

Yes. Pass `width = 1` to get one row per character.

**Is separate_longer_position the same as strsplit?**

Similar but: separate_longer_position is dplyr/tidyverse-friendly, returns a tibble, integrates with group_by. strsplit is base R, returns a list.
