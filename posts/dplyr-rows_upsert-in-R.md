---
title: "dplyr rows_upsert() in R: Insert New OR Update Existing"
slug: "dplyr-rows_upsert-in-R"
description: "Use dplyr rows_upsert() to insert new rows or update existing rows by key in R. Covers rows_upsert vs rows_insert and rows_update, sync, 5 examples."
keywords: "dplyr rows_upsert, R upsert, rows_upsert vs rows_insert, dplyr sql upsert, rows_upsert by, R sync table"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rows_upsert()|dplyr rows_upsert|upsert table|insert or update|rows_upsert vs rows_insert"
auto_link_case_sensitive: true
target_keyword: "dplyr rows_upsert"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr rows_upsert() in R: Insert New OR Update Existing

<p class="lead">The <code>rows_upsert()</code> function in dplyr is the SQL-style UPSERT: rows from y replace matching rows in x by key, and rows in y with new keys are appended. It is "insert or update" in one verb.</p>

[QUICK ANSWER]
rows_upsert(x, y, by = "id")              # insert new + update existing
rows_insert(x, y, by = "id")              # insert only; error on dup
rows_update(x, y, by = "id")              # update only; error on new
rows_patch(x, y, by = "id")               # update only NA cells
bind_rows(x, y) |> distinct(id, .keep_all = TRUE) # rough alternative

[DECISION TREE: Is rows_upsert() the right tool?]
- sync from a source: insert new + update existing: rows_upsert()
- insert only (error on dup): rows_insert()
- update only (error on new): rows_update()
- update only NA: rows_patch()
- delete by key: rows_delete()
- append blindly: bind_rows()

## What rows_upsert() does in one sentence

**`rows_upsert(x, y, by)` returns x with: existing rows whose key matches y replaced by y's values, AND new rows from y (whose keys aren't in x) appended.** It is "insert or update".

This is the standard incremental-sync operation: take a fresh batch, merge it with the master, end up with the union of both.

## Syntax

**`rows_upsert(x, y, by = NULL, in_place = FALSE)`. Combines rows_insert + rows_update.**

```r title="Sync master with batch"
library(dplyr)

x <- data.frame(id = 1:3, val = c(10, 20, 30))
y <- data.frame(id = c(2, 4), val = c(99, 40))

rows_upsert(x, y, by = "id")
#>   id val
#> 1  1  10
#> 2  2  99   <-- updated
#> 3  3  30
#> 4  4  40   <-- inserted
```

[TIP]
**`rows_upsert` is the dplyr equivalent of SQL `INSERT ... ON CONFLICT (key) DO UPDATE`.** It is the standard sync verb when y might contain a mix of new and updated records.

## Five common patterns

### 1. Standard upsert

```r title="Sync master with batch"
master <- data.frame(id = 1:3, status = c("a","b","c"))
batch  <- data.frame(id = c(2, 4), status = c("X","Z"))

rows_upsert(master, batch, by = "id")
#> 4 rows: id=1, 2 (updated), 3, 4 (inserted)
```

### 2. Multi-column update

```r title="Update multiple fields"
master <- data.frame(id=1:3, name=c("a","b","c"), score=c(10,20,30))
batch  <- data.frame(id=c(1,4), name=c("ALICE","D"), score=c(15, 40))

rows_upsert(master, batch, by = "id")
```

All non-key columns in batch overwrite (or extend) master's columns.

### 3. Composite key

```r title="Upsert on multi-column key"
master <- data.frame(region=c("NA","EU"), product=c("X","Y"), qty=c(100, 50))
batch  <- data.frame(region=c("NA","AS"), product=c("X","Z"), qty=c(99, 30))

rows_upsert(master, batch, by = c("region","product"))
#> 3 rows: (NA,X) updated, (EU,Y) unchanged, (AS,Z) inserted
```

### 4. Subset of columns updated

```r title="Update only some fields"
master <- data.frame(id=1:3, name=c("a","b","c"), score=c(10,20,30))
batch_score_only <- data.frame(id=c(1,2), score=c(99, 88))

rows_upsert(master, batch_score_only, by = "id")
#>   id name score
#> 1  1    a    99
#> 2  2    b    88
#> 3  3    c    30
```

batch_score_only has no `name` column, so master's `name` is preserved.

### 5. Idempotent batch

```r title="Re-running upsert is safe"
master_v1 <- rows_upsert(master, batch, by = "id")
master_v2 <- rows_upsert(master_v1, batch, by = "id")
identical(master_v1, master_v2)
#> [1] TRUE
```

upsert is idempotent: applying the same batch twice gives the same result.

[KEY INSIGHT]
**`rows_upsert` is "merge with replacement".** Existing rows are OVERWRITTEN by their match in y; new rows are APPENDED. The semantics match SQL `MERGE` and Postgres `INSERT ON CONFLICT DO UPDATE`. Use it for incremental sync where the batch is the source of truth for the keys it contains.

## rows_upsert() vs rows_insert() vs rows_update() vs bind_rows()

**Four "merge x and y" strategies in dplyr.**

| Function | Updates? | Inserts? | Errors |
|---|---|---|---|
| `rows_insert` | No | Yes | On duplicate key |
| `rows_update` | Yes | No | On new key in y |
| `rows_upsert` | Yes | Yes | Never (in normal usage) |
| `bind_rows` | No | Appends all | Never (no key) |
| `rows_patch` | Only NA cells | No | On new key in y |

When to use which:

- `rows_upsert` for incremental sync.
- `rows_insert` when duplicates indicate a bug.
- `rows_update` for corrections-only.
- `bind_rows` when keys don't matter.

## A practical workflow

**The "incremental ETL load" pattern uses rows_upsert.**

```r title="Daily ETL upsert"
library(dplyr)

master <- read_csv("master.csv")
daily  <- read_csv("today.csv")

master_v2 <- master |>
  rows_upsert(daily, by = "id")

write_csv(master_v2, "master.csv")
```

Each day's load merges with the master. New keys append; existing keys update. No row count surprises; idempotent.

For audit logging, capture diffs first:

```r title="Audit upsert diffs"
new_keys      <- daily |> anti_join(master, by = "id") |> pull(id)
updated_keys  <- daily |> semi_join(master, by = "id") |> pull(id)

cat("Inserted:", length(new_keys), " Updated:", length(updated_keys), "\n")
master_v2 <- rows_upsert(master, daily, by = "id")
```

## Common pitfalls

**Pitfall 1: column order matters when types differ.** y's columns must match x's types. A type mismatch errors at the call site.

**Pitfall 2: NAs in batch overwrite good data.** If batch has NA in a column, the corresponding master row gets NA. Use `rows_patch` if you only want to fill NAs in master.

[WARNING]
**`rows_upsert` is NOT in-place by default.** It returns a new data frame. For data.tables with `in_place = TRUE`, modification can be in place; for tibbles always assign the result.

## Idempotency makes upsert pipelines safe

**Idempotency means applying the same operation twice produces the same result as applying it once.** rows_upsert is idempotent: re-running yesterday's batch on an already-updated master leaves the master unchanged. This property is enormously useful for ETL pipelines that may retry on failure or be re-run after manual fixes. Without idempotency, retries can multiply rows or corrupt data; with it, retries are safe by construction. The same property holds for rows_update and rows_patch, but not for rows_insert (which errors on retry due to duplicate keys) or bind_rows (which appends every time).

## Try it yourself

**Try it:** Apply a batch update + insert to a small master table. Save to `ex_synced`.

```r title="Your turn: sync master with batch"
master <- data.frame(id = 1:3, mpg = c(21, 22, 18))
batch  <- data.frame(id = c(2, 4), mpg = c(99, 40))

ex_synced <- master |>
  # your code here

ex_synced
#> Expected: 4 rows; id=2 updated, id=4 inserted
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_synced <- master |>
  rows_upsert(batch, by = "id")

ex_synced
#>   id mpg
#> 1  1  21
#> 2  2  99
#> 3  3  18
#> 4  4  40
```

**Explanation:** rows_upsert updates id=2 with the batch value and appends id=4 as a new row.

</details>

## Related dplyr functions

After mastering rows_upsert, look at:

- `rows_insert()`: insert only
- `rows_update()`: update only
- `rows_patch()`: only fill NA cells
- `rows_delete()`: remove by key
- `rows_append()`: bind_rows alias (dplyr 1.1+)
- `mutate()`: modify without key matching

For point-in-time data versioning (preserve history), tools like `dplyr::rows_*` aren't sufficient: you need a proper SCD-2 pattern with effective dates.

## FAQ

**What does rows_upsert do in dplyr?**

`rows_upsert(x, y, by)` updates rows of x whose keys match y, AND inserts y's rows whose keys aren't in x. The "insert or update" verb.

**What is the difference between rows_upsert and rows_insert?**

rows_insert errors if any of y's keys already exist. rows_upsert overwrites the existing rows AND inserts new ones. Use upsert for sync; insert for strict no-duplicates.

**Is rows_upsert idempotent?**

Yes. Applying the same batch twice produces the same result. Useful for retry-safe pipelines.

**Does rows_upsert overwrite NAs?**

Yes. If y has NA in a column, the corresponding x row gets NA. Use rows_patch to fill ONLY x's existing NAs without overwriting non-NA values.

**Can rows_upsert handle composite keys?**

Yes: `rows_upsert(x, y, by = c("col1","col2"))`. Tuple matching applies.
