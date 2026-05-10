---
title: "tidyr nesting() in R: Preserve Column Pairs in Combinations"
slug: "tidyr-nesting-in-R"
description: "Use tidyr nesting() to preserve existing column pairings when generating combinations in R. Covers vs cross-product, expand, complete, 5 examples."
keywords: "tidyr nesting, R nesting tidyr, nesting vs cross product, preserve column pairs, nesting expand, hierarchical combinations"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::nesting()|tidyr nesting|preserve pairs|hierarchical combinations|nesting expand"
auto_link_case_sensitive: true
target_keyword: "tidyr nesting"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr nesting() in R: Preserve Column Pairs in Combinations

<p class="lead">The <code>nesting()</code> function in tidyr preserves existing column pairings inside <code>expand()</code> or <code>complete()</code>, instead of generating their full cross product.</p>

[QUICK ANSWER]
df |> expand(nesting(year, quarter), product)
df |> complete(nesting(user, plan), month)
df |> expand(year, quarter)            # without nesting: full cross product
expand(year = 2020:2024, quarter = 1:4) # all 5 * 4 = 20 combos

[DECISION TREE: When to use nesting()?]
- preserve existing (year, quarter) pairs inside cross-product: nesting(year, quarter)
- full cross-product including nonexistent pairs: don't use nesting
- hierarchical data with parent-child: nesting(parent, child)

## What nesting() does in one sentence

**`nesting(...)` is a tidyselect helper used inside `expand()` or `complete()` that keeps the named columns' EXISTING pairings together (treats them as one composite column) instead of cross-producting them.**

## Syntax

**`nesting(...)`. Used inside `expand()` or `complete()`. Not called standalone.**

```r title="Preserve year-quarter pairs"
library(tidyr)
library(dplyr)

sales <- tibble(
  year    = c(2024, 2024, 2025),
  quarter = c(1, 2, 1),
  product = c("X","Y","X")
)

# Without nesting (cross product):
sales |> expand(year, quarter, product)
#> 2 years * 2 quarters * 2 products = 8 rows
#> But (2025, q2) doesn't exist in data - it's still generated!

# With nesting (preserve year-quarter pairs):
sales |> expand(nesting(year, quarter), product)
#> 3 (year, quarter) pairs * 2 products = 6 rows
#> (2025, q2) is NOT generated because it didn't exist
```

[TIP]
**Use `nesting()` when some column combinations should not be cross-producted.** E.g., year-quarter where (2025, q2) might not yet exist; you want to preserve actual time periods only.

## Five common patterns

### 1. Year-quarter as a unit

```r title="Don't cross years with all quarters"
sales |> expand(nesting(year, quarter), product)
```

### 2. Hierarchical: parent-child

```r title="Each customer has a tier; cross with month"
df |> expand(nesting(customer_id, tier), month)
```

### 3. complete() with nesting

```r title="Complete missing month entries within existing pairs"
df |> complete(nesting(user_id, plan), month = 1:12)
```

### 4. Multi-level nesting

```r title="Country-state preserved"
df |> expand(nesting(country, state), year)
```

### 5. Without nesting comparison

```r title="Cross product can produce nonsense rows"
df |> expand(country, state, year)
#> Cross-products country with EVERY state, even unrelated ones (e.g., US x Bavaria)
```

[KEY INSIGHT]
**`nesting()` is the cure for "I don't want a Cartesian product of columns A and B".** When A and B have a natural pairing (like year-quarter, country-state), nesting keeps that intact while cross-producting them with OTHER columns.

## nesting() vs cross-product (default)

| Behavior | Without nesting | With nesting |
|---|---|---|
| Year x Quarter | All combos | Only existing pairs |
| Output rows | n_year * n_quarter | n_unique_pairs |
| Generates impossible rows | Yes | No |

When to use nesting:

- Hierarchical structures (country-state, year-quarter, customer-plan).
- Time-stamped pairs that mustn't be artificially split.
- When you only want combinations that EXIST in the data.

## A practical workflow

**Use nesting in time-series with multiple subjects to avoid generating cross-subject combinations.**

```r
patients_visits |>
  complete(
    nesting(patient_id, treatment),
    visit = 1:10,
    fill = list(measurement = NA)
  )
```

Each (patient, treatment) pair gets visits 1-10; doesn't cross-product patient with all treatments.

## Common pitfalls

**Pitfall 1: confusing nesting with cross-product.** Default behavior in expand/complete is FULL cross-product. nesting prevents that for the named columns.

**Pitfall 2: trying to use nesting outside expand/complete.** It is a tidyselect helper, not a standalone function.

[WARNING]
**`nesting()` only preserves pairs that EXIST in the data.** It doesn't generate any new pairs, only cross-products with the OTHER expand/complete arguments.

## Try it yourself

**Try it:** Generate all (cyl, gear) x am combinations using nesting to preserve cyl-gear pairs from mtcars. Save to `ex_nested`.

```r title="Your turn: nest cyl-gear, cross with am"
ex_nested <- mtcars |>
  # your code here

# With nesting: only existing (cyl, gear) pairs * 2 am values
nrow(ex_nested)
#> Expected: rows = unique(cyl, gear) pairs * 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_nested <- mtcars |>
  expand(nesting(cyl, gear), am)

# 8 unique (cyl, gear) pairs * 2 am = 16 rows
nrow(ex_nested)
#> [1] 16
```

**Explanation:** Without nesting, you'd get 3*3*2 = 18 rows (including nonexistent (4, 5) etc). With nesting, only the actual cyl-gear pairs.

</details>

## Related tidyr functions

After mastering nesting, look at:

- `expand()`: combinations from existing data
- `complete()`: expand + merge with original
- `expand_grid()` / `crossing()`: from vectors
- `tidyr::nest()` / `unnest()`: list-column workflows
- `dplyr::group_by()`: alternative for some uses

## FAQ

**What does nesting do in tidyr?**

`nesting(...)` is a helper used inside expand/complete that preserves existing column pairings. Instead of cross-producting the named columns, it keeps them as observed pairs.

**When should I use nesting?**

When two or more columns have a natural pairing (year-quarter, country-state) and cross-producting them would create impossible rows.

**Does nesting work outside expand/complete?**

No. It is a tidyselect helper specifically for those functions.

**What is the difference between nesting and group_by?**

group_by changes how subsequent verbs operate (per-group). nesting controls combination generation in expand/complete only. Different scopes.

**Can I use nesting with three or more columns?**

Yes. `nesting(country, state, city)` preserves all three together. Use any number of columns.
