---
title: "dplyr rows_patch() in R: Fill NA Cells Without Overwriting"
slug: "dplyr-rows_patch-in-R"
description: "Use dplyr rows_patch() to fill NA cells in x using values from y matched by key in R. Covers rows_patch vs rows_update, NA semantics, 5 worked examples."
keywords: "dplyr rows_patch, R fill NA by key, rows_patch vs rows_update, dplyr patch missing, sql update NA only, R patch table"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rows_patch()|dplyr rows_patch|patch NA cells|rows_patch vs rows_update|fill missing by key"
auto_link_case_sensitive: true
target_keyword: "dplyr rows_patch"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr rows_patch() in R: Fill NA Cells Without Overwriting

<p class="lead">The <code>rows_patch()</code> function in dplyr updates ONLY the NA cells in x with values from y, matched by key. Existing non-NA values in x are preserved, even if y has different values.</p>

[QUICK ANSWER]
rows_patch(x, y, by = "id")              # fill NAs in x from y
rows_update(x, y, by = "id")              # different: overwrites all
rows_upsert(x, y, by = "id")              # different: insert + overwrite

[DECISION TREE: Is rows_patch() the right tool?]
- fill ONLY x's NA cells: rows_patch()
- overwrite ALL non-key columns: rows_update()
- insert OR overwrite: rows_upsert()
- column-wise NA fill (no key): coalesce()
- conditional fill: case_when()

## What rows_patch() does in one sentence

**`rows_patch(x, y, by)` returns x with each cell that is NA replaced by the corresponding value from y (when the key matches); non-NA cells in x are PRESERVED.** The "patch" semantic: fill in missing data, don't overwrite good data.

This is the safest mutation in the rows_* family. Useful when y is a "best-effort" data source that may have stale or wrong values for some cells.

## Syntax

**`rows_patch(x, y, by = NULL, unmatched = "error", in_place = FALSE)`. NA cells in x are filled from y; non-NA cells stay.**

```r title="Fill missing prices from a backup source"
library(dplyr)

x <- data.frame(id = 1:3, price = c(10, NA, 30))
y <- data.frame(id = 1:3, price = c(99, 20, 99))

rows_patch(x, y, by = "id")
#>   id price
#> 1  1    10   <-- preserved (was not NA)
#> 2  2    20   <-- patched (was NA)
#> 3  3    30   <-- preserved
```

[TIP]
**`rows_patch` is the dplyr equivalent of "fill NA from a lookup" without overwriting good data.** Use when y is supplementary/fallback information rather than authoritative.

## Five common patterns

### 1. Fill missing values from y

```r title="Patch only NA cells"
x <- data.frame(id = 1:3, name = c("a", NA, "c"))
y <- data.frame(id = 1:3, name = c("X", "B", "Y"))

rows_patch(x, y, by = "id")
#>   id name
#> 1  1    a   <-- preserved
#> 2  2    B   <-- patched (NA in x)
#> 3  3    c   <-- preserved
```

### 2. Multi-column patch

```r title="Fill multiple columns selectively"
x <- data.frame(id=1:3, name=c("a",NA,"c"), score=c(10, NA, 30))
y <- data.frame(id=1:3, name=c("X","B","Y"), score=c(99, 20, 99))

rows_patch(x, y, by = "id")
#>   id name score
#> 1  1    a    10
#> 2  2    B    20
#> 3  3    c    30
```

### 3. Patch from a fallback source

```r title="Use cached lookup as fallback"
data    <- data.frame(id=1:3, country=c("US", NA, "FR"))
fallback <- data.frame(id=1:3, country=c("CA","CA","BE"))

rows_patch(data, fallback, by = "id")
#>   id country
#> 1  1      US   <-- preserved
#> 2  2      CA   <-- patched
#> 3  3      FR   <-- preserved
```

### 4. Compare with rows_update

```r title="Same call but rows_update overwrites"
rows_update(data, fallback, by = "id")
#>   id country
#> 1  1      CA   <-- overwritten!
#> 2  2      CA   <-- patched
#> 3  3      BE   <-- overwritten!
```

rows_update overwrites every non-key column; rows_patch only fills NAs.

### 5. Composite key

```r title="Patch with multi-column key"
rows_patch(x, y, by = c("region","product"))
```

[KEY INSIGHT]
**`rows_patch` is the SAFE version of rows_update.** rows_update overwrites everything; rows_patch only fills NAs. When merging from a less-trusted source (e.g., a cache or third-party feed), rows_patch protects your authoritative data while still benefiting from the supplementary information.

## rows_patch() vs rows_update() vs coalesce()

**Three ways to fill missing data in dplyr.**

| Function | Scope | Best for |
|---|---|---|
| `rows_patch(x, y, by)` | NA cells only | Key-based merge with existing values preserved |
| `rows_update(x, y, by)` | All non-key columns | Overwriting authoritative values |
| `coalesce(x, y)` | Element-wise (no key) | Simple "first non-NA" fill |
| `tidyr::replace_na()` | Scalar default | "If NA then 0" |

When to use which:

- `rows_patch` for selective key-based fills.
- `rows_update` when y is more authoritative than x.
- `coalesce` for simple vector / column-wise fills.
- `replace_na` for scalar defaults.

## A practical workflow

**The "augment with lookup, preserve manual edits" pattern is rows_patch's sweet spot.**

```r title="Patch missing values from lookup"
library(dplyr)

# Manual edits in x (may have NAs where unverified)
records <- read_csv("records_with_edits.csv")
# Auto-fetched lookup (best effort)
lookup  <- read_csv("auto_lookup.csv")

records_patched <- records |> rows_patch(lookup, by = "id")
write_csv(records_patched, "records_with_edits.csv")
```

Manual edits stay; missing values are filled from the auto lookup. Re-running is idempotent.

For data-quality auditing of what was patched:

```r title="Audit how many NAs were filled"
n_before <- sum(is.na(records$some_col))
n_after  <- sum(is.na(records_patched$some_col))
cat("Filled", n_before - n_after, "missing values\n")
```

## Common pitfalls

**Pitfall 1: confusing rows_patch with rows_update.** rows_patch only fills NAs. rows_update overwrites all non-key columns. Always pick the right one for your data trust hierarchy.

**Pitfall 2: errors on unmatched in y.** Default `unmatched = "error"`. Use `"ignore"` if y may have extra keys.

[WARNING]
**`rows_patch` does NOT fill NAs in y itself, only in x.** If y has NAs where x has values, x's values are kept. If both have NAs, the result has NA. Patch goes from y -> x for missing values only.

## Trust hierarchy: when to patch vs update

**The choice between rows_patch and rows_update encodes a TRUST hierarchy in your data sources.** rows_patch says "x is authoritative; y supplies missing values". rows_update says "y is authoritative; overwrite x where y has a match". Most workflows have one source you trust more than the other. If your master record has been manually edited and the lookup is auto-fetched, patch protects the manual work. If a daily refresh from a system-of-record should always win, update is correct. Articulating the trust hierarchy explicitly (in code or comments) prevents subtle bugs.

## Try it yourself

**Try it:** Fill missing `mpg` values in a small data frame using a fallback lookup. Save to `ex_filled`.

```r title="Your turn: patch missing mpg"
x <- data.frame(id = 1:5, mpg = c(21, NA, 18, NA, 33))
y <- data.frame(id = 1:5, mpg = c(99, 22, 99, 30, 99))

ex_filled <- # your code here

ex_filled$mpg
#> Expected: c(21, 22, 18, 30, 33)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_filled <- rows_patch(x, y, by = "id")

ex_filled$mpg
#> [1] 21 22 18 30 33
```

**Explanation:** rows_patch fills the NA mpg values (id 2 and 4) from y, keeps the non-NA values from x intact.

</details>

## Related dplyr functions

After mastering rows_patch, look at:

- `rows_insert()`: insert new rows
- `rows_update()`: overwrite existing
- `rows_upsert()`: insert OR overwrite
- `rows_delete()`: remove by key
- `coalesce()`: column-wise NA fill
- `tidyr::replace_na()`: scalar NA fill

For mass NA filling in a single column from a fallback column, `coalesce()` is more direct than rows_patch.

## FAQ

**What does rows_patch do in dplyr?**

`rows_patch(x, y, by)` fills NA cells in x using values from y, matched by key. Non-NA values in x are preserved.

**What is the difference between rows_patch and rows_update?**

rows_update overwrites ALL non-key columns. rows_patch ONLY fills NAs in x. Use patch when x's existing values are authoritative; use update when y is.

**Does rows_patch overwrite NAs in y?**

No. If x has a non-NA value, it stays. If y has a value where x has NA, x is patched. The direction is y -> x for NAs only.

**What if both x and y have NA in the same cell?**

The result has NA. rows_patch can only fill what y provides.

**Can rows_patch handle composite keys?**

Yes: `rows_patch(x, y, by = c("col1","col2"))`. Tuple matching applies.
