---
title: "dplyr union() in R: Combine Rows From X and Y, Deduplicated"
slug: "dplyr-union-in-R"
description: "Use dplyr union() to combine rows from x and y removing duplicates in R. Covers union vs union_all, vs bind_rows, base R alternative, 5 worked examples."
keywords: "dplyr union, R union rows, union vs bind_rows, dplyr union_all, R combine deduplicate, set union data frame"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr::union()|dplyr union|union rows|union vs bind_rows|union_all"
auto_link_case_sensitive: true
target_keyword: "dplyr union"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr union() in R: Combine Rows From X and Y, Deduplicated

<p class="lead">The <code>union()</code> function in dplyr stacks rows from x and y vertically, REMOVING DUPLICATES. It is the SQL <code>UNION</code> equivalent. Both inputs must have the same columns.</p>

[QUICK ANSWER]
union(x, y)                          # rows in x OR y (deduplicated)
union_all(x, y)                       # union without dedup (= bind_rows)
intersect(x, y)                       # rows in BOTH
setdiff(x, y)                         # rows in x not in y
bind_rows(x, y)                       # stack vertically (no dedup)

[DECISION TREE: Is union() the right tool?]
- combine x + y rows, dedup: union()
- combine x + y rows, keep all: union_all() or bind_rows()
- only common rows: intersect()
- only unique to x: setdiff()
- combine with column-name flexibility: bind_rows()

## What union() does in one sentence

**`union(x, y)` stacks rows from both x and y and removes duplicates based on whole-row equality.** Both inputs must have the same columns and types.

It is the data-frame version of mathematical set union. Use it when you want a deduplicated combined table.

## Syntax

**`union(x, y)`. Both must have identical columns (same names and order).**

```r title="Combine two tables, dedup"
library(dplyr)

x <- data.frame(id = c(1, 2, 3))
y <- data.frame(id = c(2, 3, 4))

union(x, y)
#>   id
#> 1  1
#> 2  2
#> 3  3
#> 4  4
```

[TIP]
**Use `union_all` (or `bind_rows`) if you need to keep duplicates.** `union` always deduplicates, which can hide important counts.

## Five common patterns

### 1. Combine and dedup

```r title="x | y, no duplicates"
x <- data.frame(id = c(1, 2, 3))
y <- data.frame(id = c(2, 3, 4))

union(x, y)
```

### 2. Multi-column dedup

```r title="Whole-row equality"
x <- data.frame(region=c("NA","EU"), product=c("X","Y"))
y <- data.frame(region=c("NA","AS"), product=c("X","Z"))

union(x, y)
#>   region product
#> 1     NA       X
#> 2     EU       Y
#> 3     AS       Z
#> ((NA,X) appears in both; deduped to one)
```

### 3. union_all (no dedup)

```r title="Like bind_rows"
union_all(x, y)
#>   region product
#> 1     NA       X
#> 2     EU       Y
#> 3     NA       X   <-- duplicate kept
#> 4     AS       Z
```

union_all and bind_rows produce the same result when columns align.

### 4. Combine three tables

```r title="union is variadic via reduce"
x <- data.frame(id = 1:2)
y <- data.frame(id = 2:3)
z <- data.frame(id = 3:4)

purrr::reduce(list(x, y, z), union)
#>   id
#> 1  1
#> 2  2
#> 3  3
#> 4  4
```

`union` takes 2 args; chain with reduce for many.

### 5. Compare with intersect and setdiff

```r title="The set-theoretic trio"
x <- data.frame(id = 1:4)
y <- data.frame(id = c(3, 4, 5))

union(x, y)$id      #> 1 2 3 4 5  (all unique)
intersect(x, y)$id  #> 3 4         (in both)
setdiff(x, y)$id    #> 1 2         (in x not y)
```

[KEY INSIGHT]
**dplyr's `union`, `intersect`, `setdiff` operate on WHOLE ROWS, not on keys.** Two rows are "equal" only if every column matches. For key-based set operations, use `semi_join` (intersect) or `anti_join` (setdiff). For non-deduplicating combination, use `bind_rows`.

## union() vs union_all() vs bind_rows() vs base union

**Four ways to combine rows in R.**

| Function | Dedup | Same columns required |
|---|---|---|
| `dplyr::union(x, y)` | Yes | Yes |
| `dplyr::union_all(x, y)` | No | Yes |
| `dplyr::bind_rows(x, y)` | No | No (fills missing with NA) |
| `base::union(x, y)` | Yes | Vector input, not df |
| `rbind(x, y)` | No | Yes (errors if mismatch) |

When to use which:

- `union` for set-style combination (dedup).
- `union_all` for "stack but enforce same columns".
- `bind_rows` for flexible combination (different columns ok).
- `base::union` for vector inputs.

## A practical workflow

**Use union for "merge two sources of records, drop duplicates" workflows.**

```r title="Union two sources, dedup"
batch_a <- read_csv("source_a.csv")
batch_b <- read_csv("source_b.csv")

combined <- union(batch_a, batch_b)
```

Both sources contribute rows; identical rows appear once. For "any row in either" without caring about duplication, `union_all` is faster.

For multi-source combination:

```r title="Union of multiple sources via reduce"
sources <- list(read_csv("a.csv"), read_csv("b.csv"), read_csv("c.csv"))
combined <- purrr::reduce(sources, union)
```

## Common pitfalls

**Pitfall 1: column mismatch errors.** `union(x, y)` requires identical column names AND order. Use `bind_rows` or `select` to align first.

**Pitfall 2: dedup hides count information.** `union(x, x)` returns x (deduplicated), not 2x. If row counts matter, use `union_all` or `bind_rows`.

[WARNING]
**`dplyr::union` masks `base::union`.** After `library(dplyr)`, plain `union(...)` calls dplyr's data-frame version. For vector inputs, use `base::union(...)` explicitly.

## When union beats bind_rows + distinct

**The two equivalent ways to "combine and dedup" are `union(x, y)` and `bind_rows(x, y) |> distinct()`.** They produce the same result when x and y have identical columns. union is more concise and signals intent (set semantics). The bind_rows + distinct chain is more flexible (allows different columns, fills with NA) but verbose. For pipelines where you control both inputs and want strict structure validation, union is preferred. For combining heterogeneous sources where columns may differ, bind_rows is more forgiving.

## Try it yourself

**Try it:** Combine two halves of mtcars (rows 1-16 and 15-32, with overlap) and dedup. Save to `ex_full`.

```r title="Your turn: union two overlapping halves"
half_a <- mtcars[1:16, ] |> tibble::rownames_to_column("car")
half_b <- mtcars[15:32, ] |> tibble::rownames_to_column("car")

ex_full <- # your code here

nrow(ex_full)
#> Expected: 32 (overlapping rows deduplicated)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_full <- union(half_a, half_b)

nrow(ex_full)
#> [1] 32
```

**Explanation:** Rows 15 and 16 appear in both halves. union deduplicates them, returning 32 unique rows.

</details>

## Related dplyr / base functions

After mastering union, look at:

- `dplyr::intersect()`: rows in both
- `dplyr::setdiff()`: rows in x not in y
- `dplyr::union_all()`: union without dedup
- `dplyr::bind_rows()`: flexible combination
- `base::rbind()`: strict same-shape rbind
- `base::union()` / `base::intersect()` / `base::setdiff()`: vector versions

For combining tables with different columns, `bind_rows()` is more flexible than `union`.

## FAQ

**What does union do in dplyr?**

`union(x, y)` combines rows from x and y, removing duplicates based on whole-row equality. Both inputs must have the same columns.

**What is the difference between union and union_all in dplyr?**

union deduplicates; union_all keeps all rows (equivalent to bind_rows when columns align).

**What is the difference between union and bind_rows?**

union dedupes and requires identical columns. bind_rows keeps duplicates and fills missing columns with NA. bind_rows is more flexible; union enforces structure.

**Does dplyr::union mask base::union?**

Yes. After loading dplyr, plain `union` calls the data-frame version. For vector union, use `base::union(...)`.

**Can I union three or more tables?**

Yes, via reduce: `purrr::reduce(list(x, y, z), union)` or chained: `x |> union(y) |> union(z)`.
