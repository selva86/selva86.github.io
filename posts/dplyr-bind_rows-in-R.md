---
title: "dplyr bind_rows() and bind_cols() in R: Combine Tables"
slug: "dplyr-bind_rows-in-R"
description: "Use dplyr bind_rows() and bind_cols() to combine data frames vertically or horizontally in R. Covers .id origin, missing columns, and 6 worked examples."
keywords: "dplyr bind_rows, bind_cols dplyr, combine data frames R, bind_rows vs rbind, R stack data frames, dplyr concatenate tables"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "bind_rows()|bind_cols()|dplyr bind_rows|dplyr::bind_rows()|combine data frames"
auto_link_case_sensitive: true
target_keyword: "dplyr bind_rows"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr bind_rows() and bind_cols() in R: Combine Tables

<p class="lead">The <code>bind_rows()</code> and <code>bind_cols()</code> functions in dplyr stack data frames vertically (more rows) or horizontally (more columns). Unlike base R <code>rbind()</code> and <code>cbind()</code>, they handle column-name mismatches gracefully and return a tibble.</p>

[QUICK ANSWER]
bind_rows(df1, df2)                       # stack vertically
bind_rows(df1, df2, df3)                  # multiple data frames
bind_rows(list_of_dfs)                    # from a list
bind_rows(df1, df2, .id = "source")       # add origin column
bind_cols(df1, df2)                       # stack horizontally (must match nrows)
bind_rows(df1, df2)                       # missing cols filled with NA
do.call(bind_rows, list_of_dfs)           # equivalent to bind_rows(list)

[DECISION TREE: Is bind_rows() the right tool?]
- stack vertically (same cols): bind_rows(df1, df2)
- stack horizontally (same rows): bind_cols(df1, df2)
- match by key (joins): left_join, inner_join, full_join
- add new column to existing df: mutate(df, new = ...)
- combine list of dfs from map(): bind_rows(list_of_dfs)
- stack with origin tracking: bind_rows(df1, df2, .id = "source")
- merge with type coercion: full_join (handles different schemas)

## What bind_rows() and bind_cols() do in one sentence

**`bind_rows()` stacks data frames VERTICALLY (more rows); `bind_cols()` stacks them HORIZONTALLY (more columns).** They are pipe-friendly replacements for base R `rbind()` and `cbind()`, with smarter handling of mismatched columns and consistent tibble output.

`bind_rows()` is forgiving: missing columns in one input become NA in the output. `bind_cols()` is strict: the inputs must have the same number of rows.

## Syntax

**Both functions accept any number of data frames as separate arguments OR a single list of data frames.** `.id` adds a column tracking which input each row came from.

```r title="Load dplyr and create two small data frames"
library(dplyr)

q1 <- tibble(month = c("Jan","Feb","Mar"), sales = c(100, 120, 130))
q2 <- tibble(month = c("Apr","May","Jun"), sales = c(150, 140, 160))
```

The full signatures:

```
bind_rows(..., .id = NULL)
bind_cols(..., .name_repair = c("unique","universal","check_unique","minimal"))
```

`...` accepts any number of data frames (or a single list of them). `.id` (bind_rows only) creates an origin tracking column.

[TIP]
**`bind_rows(list_of_dfs)` accepts a list, no `do.call` needed.** `purrr::map(files, read_csv) |> bind_rows()` is the standard idiom for combining many files into one data frame.

## Six common patterns

### 1. Stack vertically with bind_rows

```r title="Combine two quarters of sales data"
bind_rows(q1, q2)
#> # A tibble: 6 x 2
#>   month sales
#>   <chr> <dbl>
#> 1 Jan     100
#> 2 Feb     120
#> 3 Mar     130
#> 4 Apr     150
#> 5 May     140
#> 6 Jun     160
```

The two data frames share columns; the result has the union of all rows.

### 2. Track origin with .id

```r title="Add a column showing which df each row came from"
bind_rows(q1 = q1, q2 = q2, .id = "quarter")
#> # A tibble: 6 x 3
#>   quarter month sales
#>   <chr>   <chr> <dbl>
#> 1 q1      Jan     100
#> 2 q1      Feb     120
#> 3 q1      Mar     130
#> 4 q2      Apr     150
#> 5 q2      May     140
#> 6 q2      Jun     160
```

When inputs are NAMED arguments, `.id = "quarter"` creates a column with the name of each input.

### 3. Stack horizontally with bind_cols

```r title="Add metadata columns to existing rows"
sales <- tibble(month = c("Jan","Feb","Mar"), sales = c(100, 120, 130))
metadata <- tibble(year = c(2024, 2024, 2024), region = c("US","US","US"))

bind_cols(sales, metadata)
#> # A tibble: 3 x 4
#>   month sales  year region
#>   <chr> <dbl> <dbl> <chr>
#> 1 Jan     100  2024 US
#> 2 Feb     120  2024 US
#> 3 Mar     130  2024 US
```

`bind_cols()` requires the same number of rows. It does NOT match by key; it concatenates positionally (row 1 with row 1, etc.).

### 4. Mismatched columns get NA

```r title="bind_rows fills missing columns with NA"
df1 <- tibble(a = 1:3, b = c("x","y","z"))
df2 <- tibble(a = 4:5, c = c("p","q"))

bind_rows(df1, df2)
#> # A tibble: 5 x 3
#>       a b     c
#>   <int> <chr> <chr>
#> 1     1 x     NA
#> 2     2 y     NA
#> 3     3 z     NA
#> 4     4 NA    p
#> 5     5 NA    q
```

`b` exists in df1 but not df2; `c` exists in df2 but not df1. The bound result has both columns; missing values are NA.

### 5. Stack a list of data frames

```r title="Read several CSVs and combine"
# Suppose files <- list.files("data/", "*.csv", full.names = TRUE)
# dfs <- lapply(files, read.csv)
# combined <- bind_rows(dfs)

# Demo with built-in data:
dfs <- list(
  tibble(x = 1:3),
  tibble(x = 4:6),
  tibble(x = 7:9)
)
bind_rows(dfs)
#> # A tibble: 9 x 1
#>       x
#>   <int>
#> 1     1
#> 2     2
#> 3     3
#> 4     4
#> 5     5
#> 6     6
#> 7     7
#> 8     8
#> 9     9
```

A common pattern: read N files via `lapply()`/`map()`, combine via `bind_rows()`.

### 6. bind_cols with name conflict handling

```r title="When both data frames have same column name"
a <- tibble(id = 1:3, value = c(10, 20, 30))
b <- tibble(id = 1:3, value = c(100, 200, 300))

bind_cols(a, b, .name_repair = "universal")
#> New names:
#> * `id` -> `id...1`
#> * `value` -> `value...2`
#> * `id` -> `id...3`
#> * `value` -> `value...4`
#> # A tibble: 3 x 4
#>   id...1 value...2 id...3 value...4
#>    <int>     <dbl>  <int>     <dbl>
#> 1      1        10      1       100
#> 2      2        20      2       200
#> 3      3        30      3       300
```

When columns conflict, `.name_repair = "universal"` appends position numbers to make names unique. Default is `"unique"` which prepends a position prefix.

[KEY INSIGHT]
**Use `bind_cols()` ONLY when row order is meaningful and you trust the alignment.** It zips rows positionally with no matching by key. If you have an id column and want to combine by matching, use `left_join()` instead. `bind_cols()` is dangerous when row counts match by coincidence rather than design.

## bind_rows() / bind_cols() vs base R

**Base R `rbind()` and `cbind()` behave similarly but are stricter about column-name matches and convert to data.frame (not tibble).**

| Task | dplyr | Base R |
|---|---|---|
| Stack rows | `bind_rows(df1, df2)` | `rbind(df1, df2)` |
| Stack rows, mismatched cols | `bind_rows()` (NA fills missing) | `rbind()` errors |
| Stack rows, list input | `bind_rows(list_of_dfs)` | `do.call(rbind, list_of_dfs)` |
| Track origin | `bind_rows(.id="src")` | (manual: add column before binding) |
| Stack cols | `bind_cols(df1, df2)` | `cbind(df1, df2)` |
| Output type | tibble | data.frame |

When to use which:

- Use `bind_rows()` when columns might differ between inputs.
- Use `rbind()` when columns are guaranteed identical and you want zero dependencies.
- Use `bind_cols()` for tibble output; `cbind()` for base data.frame.

## Common pitfalls

**Pitfall 1: bind_cols silently aligns by row position, not key.** If you have `customer_data` and `order_data` both with 1000 rows but different orders, `bind_cols()` returns garbage. Use `left_join()` to match by key.

**Pitfall 2: type coercion with bind_rows.** If column `x` is integer in df1 and character in df2, the bound result coerces to character (the more permissive type). This silent coercion can change downstream behavior.

[WARNING]
**`bind_cols()` requires EXACT row counts. `bind_rows()` does not require matching column counts.** Mixing these up causes confusing errors. Remember: rows = vertical (more rows ok), cols = horizontal (must align rows).

**Pitfall 3: factor columns may bind weirdly.** Two factor columns with different levels get coerced to character or to the union of levels (depending on dplyr version). For predictable results, convert factors to character before binding, or use `forcats::fct_unify()` first.

## Try it yourself

**Try it:** Combine these two tibbles with `bind_rows()` and add a column tracking which one each row came from.

```r title="Your turn: bind with origin tracking"
storeA <- tibble(item = c("apple","bread"), price = c(1.0, 2.5))
storeB <- tibble(item = c("milk","eggs"), price = c(3.0, 4.0))

# Try it: combine + track origin
ex_combined <- # your code here

ex_combined
#> Expected: 4 rows, 3 cols (origin, item, price)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_combined <- bind_rows(A = storeA, B = storeB, .id = "origin")
ex_combined
#> # A tibble: 4 x 3
#>   origin item  price
#>   <chr>  <chr> <dbl>
#> 1 A      apple   1
#> 2 A      bread   2.5
#> 3 B      milk    3
#> 4 B      eggs    4
```

**Explanation:** Naming the inputs (`A = storeA`, `B = storeB`) lets `.id = "origin"` use those names as the origin column values. Without naming, `.id` would use position numbers ("1", "2") instead.

</details>

## Related dplyr functions

After mastering `bind_rows()` and `bind_cols()`, look at:

- `left_join()`, `inner_join()`, `full_join()`: combine by KEY (not position)
- `rows_insert()`, `rows_update()`, `rows_upsert()`: surgical row updates by key
- Base R `rbind()`, `cbind()`: zero-dependency alternatives
- `purrr::list_rbind()`, `list_cbind()`: variants for purrr workflows
- `do.call(rbind, list_of_dfs)`: pre-dplyr idiom, still works

For most data combination tasks, `bind_rows()` is the right choice. Reach for `bind_cols()` only when you really mean positional column-stacking (rare).

## FAQ

**What is the difference between bind_rows and rbind in R?**

`bind_rows()` is from dplyr; `rbind()` is base R. Both stack data frames vertically. Differences: `bind_rows()` handles mismatched columns by filling NA (rbind errors), accepts lists directly, and returns a tibble. `rbind()` is faster on identically-shaped inputs and zero-dependency.

**How do I combine multiple data frames in dplyr?**

For VERTICAL stacking: `bind_rows(df1, df2, df3)` or `bind_rows(list_of_dfs)`. For HORIZONTAL stacking: `bind_cols(df1, df2)` (rows must match). For COMBINING BY KEY: `left_join()` or other join verbs.

**What is the difference between bind_cols and cbind?**

`bind_cols()` is from dplyr; `cbind()` is base R. Both stack horizontally. `bind_cols()` returns a tibble and uses `.name_repair` for column-name conflict handling. `cbind()` returns a data.frame and may error or recycle on mismatched row counts.

**How do I track the source of each row when binding?**

Use `.id` with named inputs: `bind_rows(a = df1, b = df2, .id = "source")`. The result has a `source` column with values "a" and "b" indicating where each row came from.

**Can I bind data frames with different columns in dplyr?**

Yes, with `bind_rows()`. Missing columns are filled with NA. `bind_rows(df1, df2)` where df1 has columns (a, b) and df2 has columns (a, c) returns a data frame with columns (a, b, c) and NAs in the missing cells.
