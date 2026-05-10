---
title: "dplyr anti_join() in R: Keep Rows Without Match in Right"
slug: "dplyr-anti_join-in-R"
description: "Use dplyr anti_join() to keep rows of the left table that have NO match in the right in R. Covers anti_join vs semi_join, multi-key, audit, 5 examples."
keywords: "dplyr anti_join, R anti join, anti_join vs semi_join, dplyr exclude matches, anti_join filter, R rows not in"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "anti_join()|dplyr anti_join|anti join|exclude matches|find unmatched"
auto_link_case_sensitive: true
target_keyword: "dplyr anti_join"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr anti_join() in R: Keep Rows Without Match in Right

<p class="lead">The <code>anti_join()</code> function in dplyr keeps rows from the LEFT table that DO NOT have a match in the right table. It is the opposite of <code>semi_join()</code> and the standard tool for "find rows missing from the master list".</p>

[QUICK ANSWER]
anti_join(x, y, by = "id")             # x rows NOT in y
anti_join(x, y, by = c("id","date"))   # multi-key
semi_join(x, y, by = "id")             # opposite: x rows IN y
filter(x, !(id %in% y$id))             # equivalent for one-col key
anti_join(orders, customers, by = "id") # orphan orders
anti_join(actual, expected, by = "id")  # missing from expected

[DECISION TREE: Is anti_join() the right tool?]
- find x rows that have NO match in y: anti_join()
- find x rows that DO match in y: semi_join()
- single-column negation: filter(x, !col %in% y$col)
- multi-column negation: anti_join() (cleaner)
- data quality audit: anti_join(actual, expected)
- find new rows (in current, not in previous): anti_join(curr, prev)

## What anti_join() does in one sentence

**`anti_join(x, y, by)` returns rows of `x` whose `by` key DOES NOT appear in `y`, with NO columns added from y.** It is a filter: same column count as x, fewer (or equal) rows.

The cleanest tool for "what's in A but not in B?" questions, especially with multi-column keys.

## Syntax

**`anti_join(x, y, by = NULL)`. Same key arguments as semi_join.**

```r title="Customers without orders"
library(dplyr)

customers <- data.frame(id = 1:4, name = c("a","b","c","d"))
orders    <- data.frame(id = c(1, 1, 3, 5), amount = c(10, 20, 30, 40))

anti_join(customers, orders, by = "id")
#>   id name
#> 1  2    b
#> 2  4    d
#> (customers 1 and 3 dropped: they have orders)
```

[TIP]
**`anti_join` is the dplyr idiom for data-quality audits: "what records exist in source A but not in source B?".** Cleaner than the `filter(... !%in% ...)` workaround, especially with multi-column keys.

## Five common patterns

### 1. Find missing customers

```r title="Customers without any order"
anti_join(customers, orders, by = "id")
```

### 2. Multi-column anti-join

```r title="Sales of products NOT in catalog"
sales   <- data.frame(region=c("NA","EU","AS"), product=c("X","Y","Z"))
catalog <- data.frame(region=c("NA","EU"), product=c("X","Y"))

anti_join(sales, catalog, by = c("region","product"))
#>   region product
#> 1     AS       Z
#> (only AS/Z is missing from catalog)
```

For multi-column negation, `filter(... %in% ...)` is awkward; anti_join is clean.

### 3. Find orphan records

```r title="Orders without a known customer"
anti_join(orders, customers, by = "id")
#>   id amount
#> 1  5     40
#> (order 5's customer doesn't exist)
```

### 4. New rows since last snapshot

```r title="Current rows not in previous snapshot"
prev_snapshot <- data.frame(id = 1:5)
curr_data     <- data.frame(id = 1:8, value = 10:17)

new_rows <- anti_join(curr_data, prev_snapshot, by = "id")
new_rows
#>   id value
#> 1  6    15
#> 2  7    16
#> 3  8    17
```

A diff pattern: rows in current but not previous.

### 5. Pair with semi_join for partition

```r title="Split into matched and unmatched"
matched   <- semi_join(customers, orders, by = "id")
unmatched <- anti_join(customers, orders, by = "id")

nrow(matched) + nrow(unmatched) == nrow(customers)
#> [1] TRUE
```

semi + anti partitions x into two non-overlapping groups.

[KEY INSIGHT]
**`anti_join` is the ONLY clean way to express "in left but not in right" for multi-column keys.** With single columns you could use `filter(x, !id %in% y$id)`; with two-column keys, the equivalent filter is awkward and error-prone. anti_join is unambiguous.

## anti_join() vs semi_join() vs filter() vs setdiff()

**Four ways to express "exclude" in R.**

| Approach | Best for |
|---|---|
| `anti_join(x, y)` | Multi-key membership negation |
| `semi_join(x, y)` | Opposite (positive membership) |
| `filter(x, !(col %in% y$col))` | Single-column negation in a quick script |
| `setdiff(x, y)` | Whole-row difference (all columns must match) |

When to use which:

- `anti_join` for key-based exclusion.
- `setdiff` for whole-row set difference.
- `filter` for single-column scripts.

## A practical workflow

**Use anti_join in data audits to find what's expected vs what's there.**

```r title="Bidirectional audit"
# Audit: which IDs are in actual but not expected?
unexpected <- actual |> anti_join(expected, by = "id")

# Which IDs are expected but missing from actual?
missing <- expected |> anti_join(actual, by = "id")
```

A pair of anti_joins gives a complete diff between two sources.

For incremental loads:

```r title="Find new rows for incremental load"
existing  <- read_csv("history.csv")
new_batch <- read_csv("today.csv")

new_rows <- new_batch |> anti_join(existing, by = "id")
```

Only insert rows that don't already exist.

## Common pitfalls

**Pitfall 1: forgetting which side has the negation.** `anti_join(x, y)` returns rows from X NOT in Y. Reversing the args inverts the meaning.

**Pitfall 2: NA in the join column.** `NA == NA` is NA, so rows with NA in the key may NOT match (and thus appear in anti_join output). Filter NAs first if surprising.

[WARNING]
**`anti_join` does NOT count duplicates in y.** A single match in y is enough to exclude an x row, regardless of how many duplicates y has. Same semantics as semi_join (membership only).

## Why anti_join beats filter(!%in%)

**For multi-column keys, anti_join is the only clean expression of "exclude these tuples".** The filter equivalent `filter(!(col1 %in% y$col1) & !(col2 %in% y$col2))` is wrong: it tests each column independently, not as a tuple. The correct filter form requires building a composite key string or using `paste0` tricks, both of which are clunky. anti_join handles tuple membership natively and clearly. Single-column negation can use `filter(!col %in% y$col)`, which is fine for quick scripts; for production code, anti_join is more robust against accidental key changes.

## Try it yourself

**Try it:** Find all `mtcars` cars whose name is NOT in a `featured` lookup. Save to `ex_unfeatured`.

```r title="Your turn: find non-featured cars"
featured <- data.frame(car = c("Mazda RX4", "Honda Civic"))

mtcars_named <- mtcars |> tibble::rownames_to_column("car")

ex_unfeatured <- mtcars_named |>
  # your code here

nrow(ex_unfeatured)
#> Expected: 30 (32 cars - 2 featured)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_unfeatured <- mtcars_named |>
  anti_join(featured, by = "car")

nrow(ex_unfeatured)
#> [1] 30

# Equivalent (single-column):
ex_alt <- mtcars_named |> filter(!(car %in% featured$car))
```

**Explanation:** anti_join keeps cars whose name is NOT in featured. 30 of 32 mtcars survive.

</details>

## Related dplyr functions

After mastering anti_join, look at:

- `semi_join()`: opposite filtering join
- `inner_join()` / `left_join()`: mutating joins
- `setdiff()`: whole-row set difference (requires same columns)
- `filter()`: single-column negation
- `match()`, `%in%`: base R membership tests

For "rows that exist in both AND match value-for-value", `intersect()` works on whole-row equality.

## FAQ

**What does anti_join do in dplyr?**

`anti_join(x, y, by)` keeps rows of x whose `by` key does NOT appear in y. Used to find records missing from a master list or new since a previous snapshot.

**What is the difference between anti_join and semi_join?**

They are opposites. semi_join keeps x rows that DO match in y. anti_join keeps x rows that DO NOT match in y. Together they partition x.

**How does anti_join differ from setdiff?**

anti_join uses a key (subset of columns); setdiff requires whole-row equality. Use anti_join for key-based exclusion; setdiff for full-row difference.

**Can anti_join handle multi-column keys?**

Yes. `anti_join(x, y, by = c("region","product"))` excludes x rows whose (region, product) tuple appears in y.

**Why does anti_join handle NA strangely?**

Because `NA == NA` is NA, not TRUE. NA values in the join key may not match, so rows with NA appear in anti_join output. Filter NAs first if needed.
