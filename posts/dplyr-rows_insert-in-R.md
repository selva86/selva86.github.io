---
title: "dplyr rows_insert() in R: Add New Rows by Key"
slug: "dplyr-rows_insert-in-R"
description: "Use dplyr rows_insert() to append new rows to a tibble matched by key in R. Covers conflict handling, rows_insert vs bind_rows, in_place, 5 worked examples."
keywords: "dplyr rows_insert, R add rows by key, rows_insert vs bind_rows, dplyr conflict, rows_insert by, R upsert insert only"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rows_insert()|dplyr rows_insert|insert rows|rows_insert by key|conflict handling"
auto_link_case_sensitive: true
target_keyword: "dplyr rows_insert"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr rows_insert() in R: Add New Rows by Key

<p class="lead">The <code>rows_insert()</code> function in dplyr appends rows from y into x, errors if y contains keys already in x. It is the SQL <code>INSERT</code> equivalent: insert new, never overwrite.</p>

[QUICK ANSWER]
rows_insert(x, y, by = "id")              # error on duplicate keys
rows_insert(x, y, by = "id", conflict = "ignore") # silently skip dups
rows_upsert(x, y, by = "id")              # insert OR update
rows_update(x, y, by = "id")              # update only
bind_rows(x, y)                            # appends without key check
rows_append(x, y)                          # append (no key check, dplyr 1.1+)

[DECISION TREE: Is rows_insert() the right tool?]
- add NEW rows; error on key conflict: rows_insert()
- add new + update existing: rows_upsert()
- update only existing: rows_update()
- append blindly (no key check): bind_rows() or rows_append()
- delete rows by key: rows_delete()
- patch only NA values: rows_patch()

## What rows_insert() does in one sentence

**`rows_insert(x, y, by)` returns x with all rows from y appended, IF none of y's keys already exist in x; otherwise it errors (unless `conflict = "ignore"`).** It is "insert new keys only".

This and the rows_* family (rows_update, rows_upsert, rows_delete, rows_patch) implement SQL-style row mutations on data frames.

## Syntax

**`rows_insert(x, y, by = NULL, conflict = "error", in_place = FALSE)`. by defaults to common columns.**

```r title="Insert new rows"
library(dplyr)

x <- data.frame(id = 1:2, name = c("a","b"))
y <- data.frame(id = 3:4, name = c("c","d"))

rows_insert(x, y, by = "id")
#>   id name
#> 1  1    a
#> 2  2    b
#> 3  3    c
#> 4  4    d
```

[TIP]
**`rows_insert` ERRORS on duplicate keys by default.** Pass `conflict = "ignore"` to silently skip rows whose keys already exist in x. Use this to enforce the invariant "key is unique".

## Five common patterns

### 1. Insert new keys

```r title="Append rows that don't already exist"
x <- data.frame(id = 1:2, name = c("a","b"))
y <- data.frame(id = 3:4, name = c("c","d"))

rows_insert(x, y, by = "id")
#> 4 rows
```

### 2. Conflict on existing key

```r title="Errors when key already exists"
x <- data.frame(id = 1:2, name = c("a","b"))
y <- data.frame(id = c(2, 3), name = c("X","c"))

rows_insert(x, y, by = "id")
#> Error: y has 1 row with a key that already exists in x
```

### 3. Ignore conflicts

```r title="Skip duplicates silently"
rows_insert(x, y, by = "id", conflict = "ignore")
#>   id name
#> 1  1    a
#> 2  2    b
#> 3  3    c
#> (id=2 in y skipped because it already exists)
```

### 4. Multi-column key

```r title="Composite key"
x <- data.frame(region=c("NA","EU"), product=c("X","Y"), qty=c(100, 50))
y <- data.frame(region=c("AS","EU"), product=c("X","Z"), qty=c(30, 20))

rows_insert(x, y, by = c("region","product"))
#> 4 rows; (EU,Y) and (AS,X), (EU,Z) all unique tuples
```

### 5. In-place modification (data.table style)

```r title="Mutate in place (in_place = TRUE for data.tables)"
# For tibbles, in_place is FALSE; for data.tables, can be TRUE for speed.
rows_insert(x, y, by = "id", in_place = FALSE)
```

[KEY INSIGHT]
**The rows_* family (rows_insert, rows_update, rows_upsert, rows_delete, rows_patch) implements SQL-style upsert semantics on data frames.** Each handles one specific mutation. Combined, they replace ad-hoc filter + bind_rows patterns.

## rows_insert() vs bind_rows() vs rows_upsert()

**Three append/update patterns in dplyr.**

| Function | Behavior | Best for |
|---|---|---|
| `rows_insert(x, y, by)` | Error on dup keys, append new | Strict "no duplicates" |
| `rows_upsert(x, y, by)` | Insert new, update existing | Sync from updated source |
| `rows_update(x, y, by)` | Update existing, error on new | Patch existing only |
| `bind_rows(x, y)` | Append blindly, no key check | Quick stack |
| `rows_append(x, y)` | Append (no key check) | dplyr 1.1+ explicit append |

When to use which:

- `rows_insert` for adding new records, validating no duplicates.
- `rows_upsert` for incremental sync from a source.
- `rows_update` for patching existing records.
- `bind_rows` for ignore-the-key vertical stacking.

## A practical workflow

**Use rows_insert in incremental load pipelines where duplicate keys are bugs.**

```r title="Validated incremental insert"
library(dplyr)

current   <- read_csv("master.csv")
new_batch <- read_csv("today.csv")

# Validate no key collisions, then append:
updated <- current |> rows_insert(new_batch, by = "id")
```

If today's batch has any id that already exists in master, the insert errors out: a forced data-quality check.

For "either insert new or update existing":

```r title="Upsert variant"
updated <- current |> rows_upsert(new_batch, by = "id")
```

## Common pitfalls

**Pitfall 1: forgetting that conflict defaults to "error".** A single duplicate key crashes the whole call. Use `conflict = "ignore"` to silently skip; or pre-filter to ensure uniqueness.

**Pitfall 2: column order or types must match.** y must have all columns x has (or be a subset). Type mismatches error.

[WARNING]
**`rows_insert` and friends are NOT in-place for tibbles by default.** They return a new data frame. The `in_place = TRUE` option only applies to data.tables for speed; for tibbles the result must be assigned.

## Why the rows_* family exists

**Before the rows_* family (added in dplyr 1.0), incremental updates to data frames required hand-rolled patterns: filter the rows to update, modify, bind_rows, watch for duplicates.** This is error-prone and verbose. The rows_* family encapsulates the SQL-style operations as named verbs. rows_insert says "append new", rows_update says "patch existing", rows_upsert says "do both", rows_delete says "remove", rows_patch says "fill NA only". Each is one clear semantics, easy to reason about. For analytic workflows that mimic production data pipelines (incremental loads, corrections, deletions), this family is the right toolkit.

## Try it yourself

**Try it:** Append 3 new car rows to a small `mtcars_top` (first 3 rows of mtcars). Verify the result has 6 rows. Save to `ex_added`.

```r title="Your turn: insert 3 new car rows"
mtcars_top <- mtcars[1:3, ] |> tibble::rownames_to_column("car")
new_cars   <- data.frame(
  car  = c("Tesla S","Tesla 3","Tesla X"),
  mpg  = c(120, 130, 90),
  cyl  = c(0, 0, 0),
  disp = c(0, 0, 0),
  hp   = c(670, 480, 670),
  drat = c(0, 0, 0),
  wt   = c(2.5, 1.8, 2.4),
  qsec = c(11, 13, 15),
  vs   = c(0, 0, 0),
  am   = c(1, 1, 1),
  gear = c(1, 1, 1),
  carb = c(0, 0, 0)
)

ex_added <- mtcars_top |>
  # your code here

nrow(ex_added)
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_added <- mtcars_top |>
  rows_insert(new_cars, by = "car")

nrow(ex_added)
#> [1] 6
```

**Explanation:** `rows_insert` appends the 3 Tesla rows because their car names don't conflict with the existing 3.

</details>

## Related dplyr functions

After mastering rows_insert, look at:

- `rows_update()`: update only existing rows
- `rows_upsert()`: insert or update
- `rows_delete()`: remove rows by key
- `rows_patch()`: update only NA values
- `bind_rows()`: append without key check
- `rows_append()`: dplyr 1.1+; explicit append

For SQL-style upsert workflows on data frames, the rows_* family covers the standard CRUD operations.

## FAQ

**What does rows_insert do in dplyr?**

`rows_insert(x, y, by)` appends rows from y to x; errors if any of y's keys already exist in x. The "insert new only" semantics.

**What is the difference between rows_insert and bind_rows?**

bind_rows ignores keys, just stacks vertically. rows_insert validates that y's keys don't collide with x's. Use rows_insert when key uniqueness matters.

**What is the conflict argument in rows_insert?**

`conflict = "error"` (default) errors on duplicate keys. `conflict = "ignore"` silently skips conflicting rows. No `replace` option (use `rows_upsert` for that).

**Can rows_insert handle multi-column keys?**

Yes: `rows_insert(x, y, by = c("col1","col2"))`. The composite is the key; conflicts are detected by tuple matching.

**Does rows_insert modify x in place?**

For tibbles, no: it returns a new data frame. For data.tables with `in_place = TRUE`, modification can be in place (rare in dplyr workflows).
