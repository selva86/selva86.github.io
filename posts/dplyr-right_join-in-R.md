---
title: "dplyr right_join() in R: Keep All Rows From the Right Table"
slug: "dplyr-right_join-in-R"
description: "Use dplyr right_join() to merge two tables keeping all rows from the right table in R. Covers right_join vs left_join flip, by, NA, and 5 worked examples."
keywords: "dplyr right_join, R right join, right_join vs left_join, dplyr keep right, right_join by, R join right table"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "right_join()|dplyr right_join|right join|keep right table|right_join vs left_join"
auto_link_case_sensitive: true
target_keyword: "dplyr right_join"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr right_join() in R: Keep All Rows From the Right Table

<p class="lead">The <code>right_join()</code> function in dplyr merges two tables by key, KEEPING all rows from the RIGHT table and adding matching columns from the left. It is the mirror of <code>left_join()</code>; flipping the inputs gives an equivalent result.</p>

[QUICK ANSWER]
right_join(x, y, by = "id")           # keep all rows of y
right_join(x, y, by = c("id" = "uid")) # mapped key
left_join(y, x, by = "id")             # equivalent (flipped)
inner_join(x, y, by = "id")            # only matched
full_join(x, y, by = "id")             # all rows from both
right_join(x, y, by = join_by(id))     # tidy-style key

[DECISION TREE: Is right_join() the right tool?]
- keep all rows of right table: right_join() (or flip and use left_join)
- keep all rows of LEFT table: left_join()
- keep only MATCHED rows: inner_join()
- keep all from BOTH: full_join()
- filter left by membership in right: semi_join()
- filter left by NON-membership in right: anti_join()
- combine without key (by position): bind_cols()

## What right_join() does in one sentence

**`right_join(x, y, by)` returns a data frame with EVERY row of `y`, plus matching columns from `x` joined on the `by` key; rows in `y` with no match get NA in x's columns.** Functionally identical to `left_join(y, x, by)`.

right_join is rarely the cleanest call: most dplyr style guides recommend flipping inputs and using left_join for consistency.

## Syntax

**`right_join(x, y, by = NULL, suffix = c(".x", ".y"))`. Same arguments as left_join.**

```r title="Keep all rows from right (orders), augment with customers"
library(dplyr)

customers <- data.frame(id = 1:3, name = c("a","b","c"))
orders    <- data.frame(id = c(1, 1, 4), amount = c(10, 20, 30))

right_join(customers, orders, by = "id")
#>   id name amount
#> 1  1    a     10
#> 2  1    a     20
#> 3  4 <NA>     30   <-- order from unknown customer; left has no match
```

[TIP]
**Most dplyr style guides recommend `left_join(y, x, by = ...)` over `right_join(x, y, by = ...)`.** The two are equivalent; left_join with the data flipped is more idiomatic and reads more naturally in pipes.

## Five common patterns

### 1. Keep all rows of right table

```r title="Augment orders with customer info"
right_join(customers, orders, by = "id")
```

### 2. Equivalent left_join (preferred style)

```r title="Same result, more idiomatic"
left_join(orders, customers, by = "id")
```

### 3. Multiple keys

```r title="Match on two columns"
inventory <- data.frame(region=c("NA","EU"), product=c("X","X"), stock=c(50, 30))
sales     <- data.frame(region=c("NA","NA","EU"), product=c("X","Y","X"), qty=c(10, 5, 20))

right_join(inventory, sales, by = c("region", "product"))
#>   region product stock qty
#> 1     NA       X    50  10
#> 2     NA       Y    NA   5
#> 3     EU       X    30  20
```

### 4. Differently-named keys

```r title="Map column names"
right_join(customers, orders, by = c("id" = "user_id"))
# (when orders.user_id is the FK to customers.id)
```

### 5. Empty left input

```r title="If left has no rows, all values are NA"
empty <- customers[0, ]
right_join(empty, orders, by = "id")
#>   id name amount
#> 1  1   NA     10
#> 2  1   NA     20
#> 3  4   NA     30
```

[KEY INSIGHT]
**`right_join(x, y) == left_join(y, x)` (column order may differ).** They are mathematically equivalent. dplyr keeps right_join for completeness; in practice almost everyone uses left_join with flipped arguments. Pick one convention per project.

## right_join() vs left_join() vs inner_join() vs full_join()

**The four mutating-join family.**

| Function | Keeps |
|---|---|
| `left_join(x, y)` | All rows of x; y matches added |
| `right_join(x, y)` | All rows of y; x matches added |
| `inner_join(x, y)` | Only rows in BOTH x and y |
| `full_join(x, y)` | All rows of x and y; NA for unmatched |
| `semi_join(x, y)` | Rows of x that have a match in y (no y cols) |
| `anti_join(x, y)` | Rows of x that have NO match in y |

When to use which:

- `left_join` (with the main table on the left): almost always preferred.
- `right_join` if it makes the data flow clearer in your specific case.
- `inner_join` for "where both have data".
- `full_join` for outer joins.

## A practical workflow

**The "keep right table's structure" pattern is right_join's only natural use case.**

```r title="Right_join with main table on the right"
# orders is the main table; we want every order row, augmented with customer info
right_join(customers, orders, by = "id")
```

Equivalent and more readable:

```r title="Idiomatic flipped left_join"
left_join(orders, customers, by = "id")
```

The general guidance: rewrite right_join as flipped left_join unless the order of arguments matters for readability (rare).

## Common pitfalls

**Pitfall 1: right_join is unfamiliar to many readers.** Code reviewers often misread it. Prefer left_join with flipped inputs for clarity.

**Pitfall 2: row count multiplication.** Like left_join, right_join multiplies rows when keys are duplicated in the OTHER table. Always check row counts.

[WARNING]
**`right_join` and `left_join` produce results with potentially DIFFERENT column ORDERING.** The "keep" side's columns come first. If your downstream code expects a specific column order, this matters.

## When right_join is genuinely the right call

**right_join exists for symmetry, but in practice almost every right_join can be rewritten as a flipped left_join.** The one case where right_join reads more naturally is in functional pipelines where the right argument is the "main" table and you don't want to break the chain by reordering. For instance: `transactions |> right_join(customers, by = "id")` keeps every customer (the right side) and augments with their transactions. Rewriting as `customers |> left_join(transactions, by = "id")` is cleaner. If your code reviewer doesn't immediately see why right_join was chosen, it probably should be left_join.

## Try it yourself

**Try it:** Augment an `orders` table with customer info, keeping all rows from `orders`. Save to `ex_aug`.

```r title="Your turn: augment orders"
customers <- data.frame(id = 1:3, name = c("Alice","Bob","Carol"))
orders    <- data.frame(id = c(1, 1, 4), amount = c(10, 20, 30))

ex_aug <- # your code here

ex_aug
#> Expected: 3 rows (all orders), name=NA where no match
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
# Idiomatic (flipped left_join):
ex_aug <- left_join(orders, customers, by = "id")

# Equivalent right_join:
ex_aug2 <- right_join(customers, orders, by = "id")

ex_aug
#>   id amount  name
#> 1  1     10 Alice
#> 2  1     20 Alice
#> 3  4     30  <NA>
```

**Explanation:** Both keep every order row. left_join is more idiomatic; right_join is equivalent but less common in modern code.

</details>

## Related dplyr functions

After mastering right_join, look at:

- `left_join()`: idiomatic alternative
- `inner_join()`: matched rows only
- `full_join()`: all rows from both
- `semi_join()` / `anti_join()`: filtering joins
- `join_by()`: dplyr 1.1+ key spec
- `merge(x, y, all.y = TRUE)`: base R equivalent

For tidyverse style consistency, prefer left_join with the main table on the left.

## FAQ

**What does right_join do in dplyr?**

`right_join(x, y, by)` keeps all rows of y and adds matching columns from x. Rows in y without a match get NA in x's columns.

**What is the difference between right_join and left_join?**

right_join keeps all rows of y; left_join keeps all rows of x. `right_join(x, y) == left_join(y, x)` (with possibly different column order).

**Should I use right_join or flip and use left_join?**

Most style guides recommend flipping and using left_join. left_join is more common, more idiomatic, and easier to read.

**How does right_join handle multiple keys?**

Same as left_join: pass `by = c("col1", "col2")` for multi-column keys, or `by = c("id" = "uid")` for differently-named columns.

**Why does my right_join produce duplicates?**

Because the LEFT table has duplicate keys. right_join multiplies right rows when left has multiple matches per key. Deduplicate the left table first or check `relationship`.
