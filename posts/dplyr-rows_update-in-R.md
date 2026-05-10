---
title: "dplyr rows_update() in R: Update Existing Rows by Key"
slug: "dplyr-rows_update-in-R"
description: "Use dplyr rows_update() to update existing rows in a tibble matched by key in R. Covers vs rows_upsert, unmatched arg, in_place, and 5 worked examples."
keywords: "dplyr rows_update, R update rows by key, rows_update vs rows_upsert, dplyr unmatched, rows_update in_place, R sql update"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rows_update()|dplyr rows_update|update existing rows|rows_update vs rows_upsert|sql update"
auto_link_case_sensitive: true
target_keyword: "dplyr rows_update"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr rows_update() in R: Update Existing Rows by Key

<p class="lead">The <code>rows_update()</code> function in dplyr modifies columns of EXISTING rows in x using values from y, matched by key. Errors if y has keys not present in x (use <code>rows_upsert</code> for insert-or-update semantics).</p>

[QUICK ANSWER]
rows_update(x, y, by = "id")              # update existing; error on missing
rows_update(x, y, by = "id", unmatched = "ignore") # ignore unmatched in y
rows_upsert(x, y, by = "id")              # insert OR update
rows_insert(x, y, by = "id")              # insert only
rows_patch(x, y, by = "id")               # only update NAs in x

[DECISION TREE: Is rows_update() the right tool?]
- update only existing rows: rows_update()
- insert OR update: rows_upsert()
- insert only (error on dup): rows_insert()
- update only NA values: rows_patch()
- delete by key: rows_delete()
- append blindly: bind_rows()

## What rows_update() does in one sentence

**`rows_update(x, y, by)` returns x with each row whose key appears in y replaced by y's values for the matching columns; errors if y has keys not in x.** It is "UPDATE existing only".

Part of the rows_* family (rows_insert, rows_update, rows_upsert, rows_delete, rows_patch) for SQL-style row mutations.

## Syntax

**`rows_update(x, y, by = NULL, unmatched = "error", in_place = FALSE)`. `unmatched = "ignore"` skips y's rows whose keys aren't in x.**

```r title="Update price for two products"
library(dplyr)

library(tibble)
x <- data.frame(id = 1:4, price = c(10, 20, 30, 40))
y <- data.frame(id = c(2, 4), price = c(99, 88))

rows_update(x, y, by = "id")
#>   id price
#> 1  1    10
#> 2  2    99   <-- updated
#> 3  3    30
#> 4  4    88   <-- updated
```

[TIP]
**Use `rows_update` when y is a list of CHANGES and every key in y must exist in x.** For mixed insert+update, use `rows_upsert` instead.

## Five common patterns

### 1. Update existing rows

```r title="Patch a few records"
x <- data.frame(id = 1:3, status = c("a","b","c"))
y <- data.frame(id = c(1, 3), status = c("X","Z"))

rows_update(x, y, by = "id")
#>   id status
#> 1  1      X
#> 2  2      b
#> 3  3      Z
```

### 2. Error on unmatched in y

```r title="y has key not in x"
x <- data.frame(id = 1:2, val = c(10, 20))
y <- data.frame(id = c(1, 99), val = c(100, 999))

rows_update(x, y, by = "id")
#> Error: y has 1 row with a key not in x (id = 99)
```

### 3. Ignore unmatched

```r title="Skip y rows whose keys aren't in x"
rows_update(x, y, by = "id", unmatched = "ignore")
#>   id val
#> 1  1 100   <-- updated
#> 2  2  20
#> (id=99 in y was skipped silently)
```

### 4. Multi-column update

```r title="Update multiple fields per row"
x <- data.frame(id = 1:3, name = c("a","b","c"), score = c(10, 20, 30))
y <- data.frame(id = c(1, 3), name = c("ALICE","CAROL"), score = c(15, 35))

rows_update(x, y, by = "id")
#>   id  name score
#> 1  1 ALICE    15
#> 2  2     b    20
#> 3  3 CAROL    35
```

All non-key columns in y overwrite the corresponding columns in x.

### 5. Composite key

```r title="Update by multiple key columns"
x <- data.frame(region=c("NA","NA","EU"), product=c("X","Y","X"), qty=c(100, 200, 50))
y <- data.frame(region=c("NA","EU"),     product=c("Y","X"),       qty=c(999, 49))

rows_update(x, y, by = c("region","product"))
```

[KEY INSIGHT]
**The rows_* family covers SQL-style row mutations: INSERT, UPDATE, UPSERT, DELETE, PATCH.** Each is one verb with key-based semantics. They replace ad-hoc patterns like `bind_rows + filter + summarise` for incremental updates.

## rows_update() vs rows_upsert() vs rows_patch()

**Three update patterns in dplyr's rows_* family.**

| Function | Inserts new? | Updates existing? | Touches NA only? |
|---|---|---|---|
| `rows_insert(x, y)` | Yes | No | n/a |
| `rows_update(x, y)` | No | Yes | No (overwrites all) |
| `rows_upsert(x, y)` | Yes | Yes | No (overwrites all) |
| `rows_patch(x, y)` | No | Only NA cells | Yes |
| `rows_delete(x, y)` | No (removes) | n/a | n/a |

When to use which:

- `rows_update` to apply CORRECTIONS to existing records.
- `rows_upsert` to SYNC from an authoritative source.
- `rows_patch` to FILL IN missing values without overwriting good ones.

## A practical workflow

**Use rows_update for "apply corrections" workflows.**

```r title="Apply corrections to master"
master      <- read_csv("master.csv")
corrections <- read_csv("corrections.csv")

# Apply corrections; error if any correction's key isn't in master
master_v2 <- master |> rows_update(corrections, by = "id")
```

The error-on-unmatched behaviour catches bugs where corrections.csv has stray IDs not in master.

For incremental sync (add new + update existing):

```r title="Upsert sync"
master_v3 <- master |> rows_upsert(latest_batch, by = "id")
```

## Common pitfalls

**Pitfall 1: errors on unmatched in y.** Default `unmatched = "error"` errors if y has keys not in x. Use `"ignore"` to silently skip.

**Pitfall 2: column order or types must match.** y's update columns must exist in x with compatible types. Mismatch errors at the call site.

[WARNING]
**`rows_update` overwrites ALL non-key columns in y, even if the value is NA.** If y has NA in a column, the corresponding x value is set to NA. Use `rows_patch` if you only want to update NA values in x.

## Why rows_update beats hand-rolled filter+mutate

**Before rows_update existed, applying corrections required filter to the matching rows, modifying their columns, then binding back.** This is verbose, easy to misorder, and silently corrupts data if you mistakenly join on the wrong key. rows_update encapsulates the safe pattern: validate keys, replace columns, return a clean result. The error-on-unmatched default catches a common bug class (corrections referencing non-existent IDs). For data-quality-sensitive pipelines, this safety check pays for itself within the first few runs.

## Try it yourself

**Try it:** Update car names in a small `mtcars_top` (first 3 rows) with new SEO-friendly labels. Save to `ex_updated`.

```r title="Your turn: update 2 car names"
mtcars_top <- mtcars[1:3, ] |> tibble::rownames_to_column("car")
updates    <- data.frame(
  car  = c("Mazda RX4", "Datsun 710"),
  mpg  = c(99, 88)
)

ex_updated <- mtcars_top |>
  # your code here

ex_updated[, c("car","mpg")]
#> Expected: 2 rows updated, 1 unchanged
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_updated <- mtcars_top |>
  rows_update(updates, by = "car")

ex_updated[, c("car","mpg")]
#>             car mpg
#> 1     Mazda RX4  99
#> 2 Mazda RX4 Wag  21
#> 3    Datsun 710  88
```

**Explanation:** rows_update overwrites mpg for matching car names (Mazda RX4 and Datsun 710); Mazda RX4 Wag keeps its original mpg.

</details>

## Related dplyr functions

After mastering rows_update, look at:

- `rows_insert()`: insert only
- `rows_upsert()`: insert OR update
- `rows_patch()`: only fill NA cells
- `rows_delete()`: remove by key
- `mutate()`: change values without key matching
- `case_when()`: conditional update inside mutate

For "selective update by condition" (not key-based), `mutate(col = case_when(condition ~ new_value, TRUE ~ col))` is the right pattern.

## FAQ

**What does rows_update do in dplyr?**

`rows_update(x, y, by)` updates rows in x whose key matches a row in y, replacing non-key columns with y's values. Errors if y has keys not in x.

**What is the difference between rows_update and rows_upsert?**

rows_update only updates existing rows (errors on new keys in y). rows_upsert updates existing AND inserts new. Use upsert for sync; update for corrections.

**What is the unmatched argument?**

`unmatched = "error"` (default) errors if y has keys not in x. `unmatched = "ignore"` silently skips them. Use ignore when y may legitimately have extra keys.

**Does rows_update overwrite NAs?**

Yes. If y has NA in a column, the corresponding x value is set to NA. Use `rows_patch` to update ONLY x's existing NA cells.

**Can rows_update handle composite keys?**

Yes: `rows_update(x, y, by = c("col1","col2"))`. Tuple matching applies.
