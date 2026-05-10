---
title: "dplyr rows_delete() in R: Remove Rows by Key"
slug: "dplyr-rows_delete-in-R"
description: "Use dplyr rows_delete() to remove rows from a tibble matched by key in R. Covers rows_delete vs filter and anti_join, unmatched arg, 5 worked examples."
keywords: "dplyr rows_delete, R delete rows by key, rows_delete vs filter, dplyr remove rows, rows_delete unmatched, R sql delete"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rows_delete()|dplyr rows_delete|delete rows by key|rows_delete vs filter|sql delete"
auto_link_case_sensitive: true
target_keyword: "dplyr rows_delete"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr rows_delete() in R: Remove Rows by Key

<p class="lead">The <code>rows_delete()</code> function in dplyr removes rows from x whose keys appear in y. It is the SQL <code>DELETE</code> equivalent: precise key-based removal in a dplyr-friendly verb.</p>

[QUICK ANSWER]
rows_delete(x, y, by = "id")              # remove rows matching y's keys
rows_delete(x, y, by = "id", unmatched = "ignore") # tolerate y keys not in x
filter(x, !id %in% y$id)                  # base alternative for one-col key
anti_join(x, y, by = "id")                # equivalent (idiomatic alternative)

[DECISION TREE: Is rows_delete() the right tool?]
- delete x rows whose key is in y: rows_delete()
- single-col key, simple filter: filter(x, !col %in% y$col)
- equivalent semantically: anti_join(x, y, by = ...)
- delete by condition (not key): filter()
- delete duplicates: distinct() (different)
- update existing: rows_update()

## What rows_delete() does in one sentence

**`rows_delete(x, y, by)` returns x with the rows whose `by` key appears in y removed; errors if y has keys not present in x (use `unmatched = "ignore"` to tolerate).** Equivalent to `anti_join(x, y, by)` but expressed as a row-mutation operation.

Part of the rows_* family (rows_insert, rows_update, rows_upsert, rows_delete, rows_patch).

## Syntax

**`rows_delete(x, y, by = NULL, unmatched = "error", in_place = FALSE)`. `unmatched = "ignore"` skips y rows whose keys aren't in x.**

```r title="Delete two records by key"
library(dplyr)

library(tibble)
x <- data.frame(id = 1:5, val = c(10, 20, 30, 40, 50))
y <- data.frame(id = c(2, 4))

rows_delete(x, y, by = "id")
#>   id val
#> 1  1  10
#> 2  3  30
#> 3  5  50
#> (id 2 and 4 removed)
```

[TIP]
**`rows_delete` and `anti_join` produce the same result for one-table-key deletion.** Pick the one that fits your pipeline's style. rows_delete emphasizes the mutation semantics; anti_join emphasizes the filtering semantics.

## Five common patterns

### 1. Delete by single key

```r title="Remove rows whose id is in y"
x <- data.frame(id = 1:5, name = letters[1:5])
y <- data.frame(id = c(2, 4))

rows_delete(x, y, by = "id")
```

### 2. Error on unmatched (default)

```r title="If y has key not in x, error"
x <- data.frame(id = 1:3, val = c(10, 20, 30))
y <- data.frame(id = c(2, 99))

rows_delete(x, y, by = "id")
#> Error: y has 1 row with a key not in x (id = 99)
```

### 3. Ignore unmatched

```r title="Skip y rows whose keys aren't in x"
rows_delete(x, y, by = "id", unmatched = "ignore")
#>   id val
#> 1  1  10
#> 2  3  30
#> (id 2 deleted; id 99 in y silently ignored)
```

### 4. Composite key

```r title="Delete by multi-column key"
x <- data.frame(region=c("NA","NA","EU"), product=c("X","Y","X"), qty=c(100, 200, 50))
y <- data.frame(region=c("NA"), product=c("Y"))

rows_delete(x, y, by = c("region","product"))
#> 2 rows: (NA,X) and (EU,X) survive; (NA,Y) deleted
```

### 5. Equivalent anti_join

```r title="Same result, different verb"
identical(
  rows_delete(x, y, by = c("region","product")),
  anti_join(x, y, by = c("region","product"))
)
#> [1] TRUE  (modulo column types)
```

[KEY INSIGHT]
**`rows_delete` and `anti_join` are functionally equivalent.** Both keep x rows whose key is NOT in y. Choose based on framing: rows_delete reads as "I am removing"; anti_join reads as "I am filtering". Within the rows_* family, rows_delete fits the SQL CRUD vocabulary.

## rows_delete() vs anti_join() vs filter()

**Three ways to remove rows by key.**

| Approach | Multi-key | Errors on bad key | Best for |
|---|---|---|---|
| `rows_delete(x, y, by)` | Yes | Default yes (validates) | SQL-style mutation |
| `anti_join(x, y, by)` | Yes | No | Filtering pipelines |
| `filter(x, !col %in% y$col)` | One col only | No | Quick scripts |

When to use which:

- `rows_delete` for SQL-style row mutations + validation.
- `anti_join` for tidy filtering.
- `filter` for one-column negation.

## A practical workflow

**Use rows_delete in audit-validated deletion pipelines.**

```r title="Validated deletion pipeline"
master       <- read_csv("master.csv")
to_remove    <- read_csv("deletions.csv")

# Validate every deletion key exists in master, then remove:
master_v2 <- master |> rows_delete(to_remove, by = "id")
```

If deletions.csv has stray IDs, the call errors. This catches bugs where the deletion list doesn't match the master.

For tolerance-needed cases (e.g., re-running a deletion that has already partially applied):

```r title="Tolerant rerun"
master_v2 <- master |> rows_delete(to_remove, by = "id", unmatched = "ignore")
```

## Common pitfalls

**Pitfall 1: errors on unmatched in y by default.** A single stray key in y crashes the call. Use `unmatched = "ignore"` for resilience.

**Pitfall 2: rows_delete returns a NEW data frame.** It doesn't modify x in place (unless `in_place = TRUE` for data.tables). Always assign the result.

[WARNING]
**`rows_delete` does NOT count duplicates.** A single match in y is enough to remove an x row. If x has duplicates with the same key, ALL are deleted. For exact-row deletion, use `setdiff()` (full-row matching).

## Why validate-then-delete matters

**The default `unmatched = "error"` for rows_delete is a feature, not an annoyance.** It catches bugs where your deletion list references IDs that don't exist in the master, which usually means the deletion list is from a stale source or has typos. Erroring out forces you to investigate before silently corrupting your data. For repeatable / retry-able pipelines, switch to `unmatched = "ignore"` once you've confirmed the deletion list is clean. This pattern (validate first, then ignore for production retries) is common in ETL pipelines.

## Try it yourself

**Try it:** Remove cars from a small `mtcars_top` (first 5 rows of mtcars) whose names appear in a `to_drop` list. Save to `ex_kept`.

```r title="Your turn: delete by name"
mtcars_top <- mtcars[1:5, ] |> tibble::rownames_to_column("car")
to_drop    <- data.frame(car = c("Mazda RX4", "Datsun 710"))

ex_kept <- mtcars_top |>
  # your code here

nrow(ex_kept)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_kept <- mtcars_top |>
  rows_delete(to_drop, by = "car")

nrow(ex_kept)
#> [1] 3

# Equivalent anti_join:
ex_kept2 <- mtcars_top |> anti_join(to_drop, by = "car")
identical(ex_kept, ex_kept2)
#> [1] TRUE (when columns line up)
```

**Explanation:** rows_delete removes the 2 cars whose names match to_drop, leaving 3.

</details>

## Related dplyr functions

After mastering rows_delete, look at:

- `anti_join()`: filter-style alternative
- `rows_insert()` / `rows_update()` / `rows_upsert()` / `rows_patch()`: companion CRUD verbs
- `filter()`: arbitrary condition
- `distinct()`: drop duplicates
- `setdiff()`: full-row set difference

For "delete by complex condition" (not just key), use `filter()` directly.

## FAQ

**What does rows_delete do in dplyr?**

`rows_delete(x, y, by)` removes rows from x whose `by` key appears in y. Errors by default if y has keys not in x.

**What is the difference between rows_delete and anti_join?**

Functionally equivalent. rows_delete is part of the rows_* SQL-style family; anti_join is part of the join family. Choose based on framing.

**What is the unmatched argument?**

`unmatched = "error"` (default) errors if y has keys not in x. `unmatched = "ignore"` silently skips. Use ignore when y may legitimately have extra IDs.

**Does rows_delete handle composite keys?**

Yes: `rows_delete(x, y, by = c("col1","col2"))`. Tuple matching applies.

**How do I delete by condition instead of key?**

Use `filter()`: `filter(x, !condition)`. rows_delete is for KEY-based deletion only.
