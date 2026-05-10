---
title: "dplyr intersect() in R: Rows in Both X and Y"
slug: "dplyr-intersect-in-R"
description: "Use dplyr intersect() to find rows present in both x and y in R. Covers intersect vs base intersect, whole-row matching, vs semi_join, 5 examples."
keywords: "dplyr intersect, R intersect rows, intersect vs semi_join, dplyr common rows, R set intersection data frame, intersect data frames"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr::intersect()|dplyr intersect|set intersection rows|intersect vs semi_join|whole-row intersect"
auto_link_case_sensitive: true
target_keyword: "dplyr intersect"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr intersect() in R: Rows in Both X and Y

<p class="lead">The <code>intersect()</code> function in dplyr returns rows that appear in BOTH x and y, using whole-row equality. It is the data-frame version of mathematical set intersection.</p>

[QUICK ANSWER]
intersect(x, y)                          # rows in both (whole-row eq)
union(x, y)                               # rows in either, deduplicated
setdiff(x, y)                             # rows in x not in y
semi_join(x, y, by = "id")                # rows in x with key match in y
base::intersect(c(1,2), c(2,3))           # vector intersect (different)

[DECISION TREE: Is dplyr intersect() the right tool?]
- whole-row intersection (all columns match): dplyr::intersect()
- key-based intersection: semi_join()
- single-col / vector: base::intersect()
- combine and dedup: union()
- find what's unique to x: setdiff()

## What intersect() does in one sentence

**`intersect(x, y)` returns rows present in BOTH x and y, using whole-row equality, with duplicates removed.** Both inputs must have the same columns and types.

The opposite of setdiff: where setdiff returns rows unique to x, intersect returns rows shared by both.

## Syntax

**`intersect(x, y)`. Both inputs must have identical columns. Returns deduplicated unique rows.**

```r title="Rows in both"
library(dplyr)

library(purrr)
library(tibble)
x <- data.frame(id = 1:4)
y <- data.frame(id = c(2, 3, 5))

intersect(x, y)
#>   id
#> 1  2
#> 2  3
```

[TIP]
**`dplyr::intersect` masks `base::intersect`.** Inside dplyr workflows, you get the data-frame version. For vector intersection, prefix with `base::`.

## Five common patterns

### 1. Find common rows

```r title="Standard intersection"
x <- data.frame(id = 1:4)
y <- data.frame(id = c(2, 3, 5))

intersect(x, y)
```

### 2. Multi-column intersection

```r title="Both region AND product must match"
x <- data.frame(region=c("NA","EU","AS"), product=c("X","Y","Z"))
y <- data.frame(region=c("NA","EU","AS"), product=c("X","Y","Q"))

intersect(x, y)
#>   region product
#> 1     NA       X
#> 2     EU       Y
#> ((AS, Z) and (AS, Q) differ; not intersected)
```

### 3. Using set operations together

```r title="The set-theoretic trio"
x <- data.frame(id = 1:4)
y <- data.frame(id = c(3, 4, 5))

union(x, y)$id      #> 1 2 3 4 5
intersect(x, y)$id  #> 3 4
setdiff(x, y)$id    #> 1 2
```

### 4. vs semi_join (key-based)

```r title="intersect uses ALL columns; semi_join uses key only"
x <- data.frame(id = 1:3, val = c("a","B","c"))
y <- data.frame(id = 1:3, val = c("a","b","c"))

intersect(x, y)
#>   id val
#> 1  1   a
#> 2  3   c
#> ((id=2, val="B") in x doesn't match (id=2, val="b") in y)

semi_join(x, y, by = "id")
#>   id val
#> 1  1   a
#> 2  2   B
#> 3  3   c
#> (all 3 ids exist in y, so all 3 x rows kept)
```

### 5. With reduce for many tables

```r title="Common rows across N tables"
sources <- list(
  data.frame(id = 1:5),
  data.frame(id = 3:7),
  data.frame(id = c(1, 3, 5, 9))
)

purrr::reduce(sources, intersect)
#>   id
#> 1  3
#> 2  5
```

[KEY INSIGHT]
**`dplyr::intersect` operates on WHOLE ROWS, not on keys.** Two rows are equal only if every column matches. For key-based "rows present in both", use `semi_join`. For value-level "are these snapshots identical", use intersect.

## intersect() vs semi_join() vs base intersect

**Three "intersection" operations in R.**

| Function | Scope | Matches by |
|---|---|---|
| `dplyr::intersect(x, y)` | Whole rows of df | All columns |
| `semi_join(x, y, by)` | Rows of df | Key columns only |
| `base::intersect(x, y)` | Vector elements | Equality |

When to use which:

- `dplyr::intersect` for whole-row dataset comparison.
- `semi_join` for key-based row filter.
- `base::intersect` for vector intersection.

## A practical workflow

**Use intersect to find rows that are identical across two snapshots.**

```r title="Find unchanged rows across snapshots"
prev <- read_csv("data_v1.csv")
curr <- read_csv("data_v2.csv")

# Rows unchanged between the two versions:
unchanged <- intersect(prev, curr)
cat("Unchanged rows:", nrow(unchanged), "\n")
```

For cohort overlap analysis:

```r title="Cohort overlap"
campaign_a_users <- read_csv("a_users.csv")
campaign_b_users <- read_csv("b_users.csv")

both_campaigns <- intersect(campaign_a_users, campaign_b_users)
```

## Common pitfalls

**Pitfall 1: column mismatch errors.** Both inputs must have identical column names AND order. Use `select` to align first.

**Pitfall 2: confusing with semi_join.** intersect is whole-row; semi_join is by-key. Pick by question.

[WARNING]
**`dplyr::intersect` masks `base::intersect`.** After loading dplyr, plain `intersect(c(1,2,3), c(2))` errors because dplyr expects data frames. For vectors, use `base::intersect(...)`.

## Why use intersect at all

**Intersect occupies a niche between joins and filtering: it answers "are these two row sets the same?".** For most data work the answer is "no, use a join", but a small number of patterns are cleaner with intersect. Think of intersect as one of the four set operations (union, intersect, setdiff, complement) that complete the algebra of row-set comparisons. They form a closed family: any pairwise comparison of two row sets can be expressed using these. For one-off snapshot diffs, this algebra is direct and self-documenting; for real analytic work joins are usually clearer.

## Try it yourself

**Try it:** Find which rows appear in both `top_5_v1` and `top_5_v2` snapshots. Save to `ex_common`.

```r title="Your turn: snapshot intersection"
top_5_v1 <- mtcars |> tibble::rownames_to_column("car") |> head(5)
top_5_v2 <- mtcars |> tibble::rownames_to_column("car") |> head(5) |>
              filter(car != "Datsun 710")

ex_common <- # your code here

nrow(ex_common)
#> Expected: 4 (Datsun 710 not in v2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_common <- intersect(top_5_v1, top_5_v2)
nrow(ex_common)
#> [1] 4
```

**Explanation:** Datsun 710 is in v1 but not v2; the intersection has the other 4 rows.

</details>

## Related dplyr / base functions

After mastering intersect, look at:

- `dplyr::union()`: combine + dedup
- `dplyr::setdiff()`: rows in x not in y
- `semi_join()`: key-based intersection
- `base::intersect()`: vector intersection
- `dplyr::distinct()`: dedup without intersection
- `dplyr::all_equal()` / `waldo::compare()`: rich diff output

For element-wise intersection in pipelines (vectors), `base::intersect()` is the right tool.

## When to use intersect over the alternatives

**Intersect is the rare-case tool: most data work is better served by joins.** It is right when (a) both tables represent SETS of rows where order doesn't matter, (b) you care about whole-row equality not key matching, and (c) duplicates are noise to be removed. For all other cases, `semi_join` (key-based) or `inner_join` (key-based + adds columns) is more appropriate. The narrow but important use case: comparing two SNAPSHOTS to find unchanged rows, or finding overlap between two LISTS of records.

## FAQ

**What does intersect do in dplyr?**

`dplyr::intersect(x, y)` returns rows present in both x and y, using whole-row equality. Both inputs need the same columns. Duplicates are removed.

**What is the difference between intersect and semi_join?**

intersect uses WHOLE-ROW equality. semi_join uses KEY equality. If x has (id=2, val="B") and y has (id=2, val="b"), intersect drops the row but semi_join keeps it.

**Does dplyr::intersect mask base::intersect?**

Yes. After `library(dplyr)`, `intersect` calls the data-frame version. For vectors, use `base::intersect(...)` explicitly.

**How do I intersect more than 2 tables?**

Chain or reduce: `purrr::reduce(list(x, y, z), intersect)` or `x |> intersect(y) |> intersect(z)`.

**Can I intersect tables with different columns?**

No. dplyr::intersect errors. Use `select()` to align columns first, or use `semi_join` if you only care about key matching.
