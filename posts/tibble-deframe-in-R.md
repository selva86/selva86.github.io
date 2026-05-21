---
title: "tibble deframe() in R: Two-Column Tibble to Named Vector"
slug: "tibble-deframe-in-R"
description: "Collapse a two-column tibble into a named vector in R using tibble::deframe(). Examples for lookup tables, enframe round-trips, pitfalls, and alternatives."
keywords: "tibble deframe, deframe function R, tibble deframe examples, R deframe named vector, enframe vs deframe, two column tibble to vector, deframe lookup table"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "deframe()|tibble deframe|tibble::deframe()|two column tibble to vector|named vector from tibble"
auto_link_case_sensitive: true
target_keyword: "tibble deframe"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble deframe() in R: Two-Column Tibble to Named Vector

<p class="lead">The <code>tibble deframe()</code> function collapses a one- or two-column data frame into a vector. A one-column input becomes an unnamed vector; a two-column input becomes a named vector where the first column supplies the names and the second column supplies the values.</p>

[QUICK ANSWER]
deframe(tibble(x = 1:5))                          # one column, unnamed vector
deframe(tibble(name = letters[1:3], value = 1:3)) # two columns, named vector
deframe(enframe(c(a = 1, b = 2)))                 # round-trip with enframe()
df |> select(key, val) |> deframe()               # pipe-friendly lookup
deframe(count(mtcars, cyl))                       # frequency table as named vector
deframe(prices)["apple"]                          # one-step name lookup

[DECISION TREE: Is deframe() the right tool?]
- two-column tibble to a named vector: deframe(df)
- single column to a bare vector: dplyr::pull(df, col)
- named vector to a two-column tibble: tibble::enframe(x)
- vector to a one-column tibble: tibble::as_tibble_col(x, "name")
- attach names to an existing vector: stats::setNames(v, names_vec)
- convert a whole frame to a list of vectors: as.list(df)

## What deframe() does in one sentence

**`deframe()` is the inverse of `enframe()`.** You pass a tibble (or any data frame) with one or two columns, and the function returns the data as a single vector. With one column the output is an unnamed atomic vector. With two columns the first column becomes the `names()` and the second column becomes the values.

The use case is leaving the rectangular world. After a dplyr pipeline produces a small key-value summary, `deframe()` collapses it into a named vector you can index by name or feed to a base R function. It is the bridge from tidyverse output back to vector-based code.

## Syntax

**`deframe()` takes one argument and applies a fixed contract.** The input must be a data frame with 1 or 2 columns; anything else errors.

```r title="Load tibble and collapse a two-column frame"
library(tibble)

prices <- tibble(item = c("apple", "bread", "cheese"),
                 price = c(0.40, 2.10, 5.75))
deframe(prices)
#>  apple  bread cheese 
#>   0.40   2.10   5.75
```

The full signature is:

```
deframe(x)
```

- `x` is a data frame (tibble or `data.frame`) with exactly 1 or 2 columns.
- With 1 column: returns that column as a bare vector, names dropped.
- With 2 columns: returns the second column as a vector named by the first column.

The output type follows the source column: a numeric column produces a `<dbl>` vector, a character column produces `<chr>`. Row order is preserved.

[TIP]
**Pair `deframe()` with `select()` to pick the two columns you want.** A frame with more than two columns errors, so chain `df |> select(key, value) |> deframe()` whenever you start with a wider tibble. Naming the columns explicitly also documents which one becomes the names and which one the values, since position alone determines the role.

## Four common patterns

### 1. Lookup table from a two-column tibble

```r title="Build a named price lookup"
library(tibble)

prices <- tibble(item = c("apple", "bread", "cheese", "eggs"),
                 price = c(0.40, 2.10, 5.75, 3.20))
lookup <- deframe(prices)
lookup["cheese"]
#> cheese 
#>   5.75
lookup[c("apple", "eggs")]
#>  apple  eggs 
#>   0.40  3.20
```

The named vector behaves like a small dictionary. Indexing by name returns the matching value in one step, far faster to write than filtering the original tibble. This is the most common reason to reach for `deframe()`: convert a small reference table into a vector you can subset by key.

### 2. Round-trip with enframe()

```r title="enframe then deframe is the identity"
named_vec <- c(a = 10, b = 20, c = 30)
enframed <- enframe(named_vec)
enframed
#> # A tibble: 3 x 2
#>   name  value
#>   <chr> <dbl>
#> 1 a        10
#> 2 b        20
#> 3 c        30

deframe(enframed)
#>  a  b  c 
#> 10 20 30
```

`enframe()` lifts a named vector into a two-column tibble; `deframe()` collapses it back. The pair is useful when you need to apply tidyverse operations (filter, mutate, join) to what is fundamentally a named vector, then return to vector form for downstream code.

### 3. Frequency table as a named vector

```r title="Counts as a lookup-friendly vector"
library(dplyr)

cyl_counts <- mtcars |>
  count(cyl) |>
  deframe()
cyl_counts
#>  4  6  8 
#> 11  7 14

cyl_counts["6"]
#>  6 
#>  7
```

`dplyr::count()` returns a two-column tibble of group and frequency; `deframe()` is the natural finisher when you want to index those counts by group later. The names are character even when the original grouping column was numeric, which matches base R's `table()` output convention.

### 4. Single-column collapse to bare vector

```r title="One column becomes unnamed vector"
library(tibble)

ids <- tibble(id = 101:105)
deframe(ids)
#> [1] 101 102 103 104 105
```

With a single column, `deframe()` returns the values with no names attached, equivalent to `df[[1]]`. The advantage over `pull()` is consistency: the same function works for one-column and two-column inputs, so generic pipelines do not need to branch on column count.

## deframe() vs pull() vs setNames()

**Three functions take a frame or vector and emit a vector, but they differ in shape and intent.** Pick by what you start with and what you want as names.

| Behavior | `deframe()` | `pull()` | `setNames()` |
|---|---|---|---|
| Input | Data frame (1 or 2 cols) | Data frame (any width) | Vector + names vector |
| Output | Named or unnamed vector | Bare vector (always unnamed) | Named vector |
| Names source | First column | None | Second argument |
| Multi-column input? | Errors | Picks one column | N/A |
| Typical use | Lookup-table conversion | Extract one column | Attach names to existing vector |

Decision rule:

- Reach for `deframe()` when a two-column tibble should become a name to value map.
- Reach for `dplyr::pull()` when you only need the values of one column from a wider frame.
- Reach for `setNames()` when you already have a vector and a parallel names vector but no tibble.

[KEY INSIGHT]
**Think of `deframe()` as the exit gate from the tidyverse.** Most tidyverse functions take a tibble and return a tibble, keeping you inside the rectangular world. `deframe()` is the deliberate step out: it hands you a named vector for use with base R, with `[`, `match()`, `names()`, or any function that expects a vector. That asymmetry with `enframe()` (the entry gate) makes the pair a clean boundary between tidyverse pipelines and vector-based code.

## Common pitfalls

**Pitfall 1: more than two columns errors.** `deframe()` does not pick a default column pair; it refuses to guess.

```r title="Three columns triggers an error"
library(tibble)

wide <- tibble(id = 1:3, name = c("a", "b", "c"), value = c(10, 20, 30))
# This errors:
# deframe(wide)
# Error in `deframe()`: ! `x` must be a one- or two-column data frame.

# Fix: pick two columns first
library(dplyr)
deframe(select(wide, name, value))
#>  a  b  c 
#> 10 20 30
```

Always reduce to one or two columns with `select()` before calling `deframe()`. Position matters in the two-column case: the first column is the names, the second is the values.

[WARNING]
**Duplicate keys in the first column produce a vector with duplicate names, not a merged one.** R allows duplicate names on a vector but indexing by a duplicate key returns only the first match. If two rows in the names column share a value, the second occurrence becomes unreachable by name. Use `dplyr::distinct()` or `dplyr::summarise()` to dedupe before deframing if you need a true lookup.

**Pitfall 2: column order matters, names always come first.** Swapping the column order in your `select()` swaps the names and values silently.

```r title="Column order determines which becomes names"
library(tibble); library(dplyr)

stock <- tibble(qty = c(5, 12, 3), item = c("nail", "screw", "bolt"))

# qty becomes names (likely not what you want):
deframe(select(stock, qty, item))
#>      5      12       3 
#> "nail" "screw"  "bolt"

# Reorder so the label becomes names:
deframe(select(stock, item, qty))
#>  nail screw  bolt 
#>     5    12     3
```

The function never inspects column types to guess; it always treats column 1 as names and column 2 as values. Always reorder with `select(name_col, value_col)` to be explicit.

## Try it yourself

**Try it:** Build a tibble of three U.S. cities and their populations (in millions), then collapse it to a named vector and look up the population of "Chicago". Save the lookup vector to `ex_pop` and the looked-up value to `ex_chicago`.

```r title="Your turn: build a city-to-population lookup"
library(tibble)

# Try it: build a tibble, deframe, then index
ex_pop <- # your code here
ex_chicago <- # your code here

ex_chicago
#> Expected: a named numeric, e.g. Chicago 2.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tibble)

cities <- tibble(city = c("New York", "Los Angeles", "Chicago"),
                 pop  = c(8.3, 3.9, 2.7))
ex_pop <- deframe(cities)
ex_pop
#>    New York Los Angeles     Chicago 
#>         8.3         3.9         2.7

ex_chicago <- ex_pop["Chicago"]
ex_chicago
#> Chicago 
#>     2.7
```

**Explanation:** `deframe()` turns the two-column tibble into a named numeric vector keyed by `city`. Once it is a named vector, `ex_pop["Chicago"]` is the standard base R name-based subset, returning the matching element with its name attribute intact.

</details>

## Related tibble functions

After mastering `deframe()`, look at:

- `tibble::enframe()`: the inverse, turns a named vector into a two-column `name`/`value` tibble.
- `tibble::as_tibble_col()`: lift a single vector into a one-column tibble.
- `tibble::as_tibble_row()`: lift a named vector into a one-row tibble.
- `dplyr::pull()`: extract a single column from a tibble as a bare vector.
- `stats::setNames()`: attach a names vector to an existing vector without going through a tibble.
- `base::unlist()`: collapse a list (including a list-column) into a single vector.

For the full API, the [official deframe() documentation](https://tibble.tidyverse.org/reference/enframe.html) lists the contract alongside `enframe()`.

## FAQ

**What is the difference between deframe() and pull() in R?**

`deframe()` works on a one- or two-column data frame and returns a vector, with the first column becoming the names when two columns are present. `pull()` extracts any single column from a frame of any width and always returns a bare unnamed vector. Reach for `deframe()` when you want a name-to-value lookup map. Reach for `pull()` when you only need the values from one specific column in a wider tibble and do not care about names.

**Why does deframe() error on a three-column tibble?**

The function refuses to guess which two columns to use; it has no rule to pick a names column and a values column from three or more candidates. Errors are preferable to silent column selection because the wrong choice would produce a misleading lookup vector. The fix is to call `dplyr::select(df, names_col, values_col)` first, then `deframe()`, so the column choice is explicit and visible at the call site.

**Does deframe() preserve the type of the values column?**

Yes. The values column's type carries through unchanged: a `<dbl>` column produces a numeric vector, `<chr>` a character vector, `<lgl>` a logical, and so on. Only the names column is coerced; it is always converted to character because R vector names must be character. Factor levels become character strings, integers become character digits, dates become character ISO strings.

**Can deframe() handle duplicate keys?**

Yes, but with a caveat: R allows duplicate names on a vector, so `deframe()` will return a vector with repeated names if your first column has duplicates. Indexing by name then returns only the first match, making later duplicates unreachable. If you need a true lookup, dedupe with `dplyr::distinct()` or aggregate with `dplyr::summarise()` before deframing.

