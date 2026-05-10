---
title: "dplyr arrange() in R: Sort Rows by Column"
slug: "dplyr-arrange-in-R"
description: "Use dplyr arrange() to sort rows ascending or descending in R. Covers desc(), multi-column sort, NA placement, .by_group flag, and 6 runnable examples."
keywords: "dplyr arrange, sort data frame R, dplyr arrange examples, R sort rows, arrange desc, sort by multiple columns dplyr"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "arrange()|dplyr arrange|dplyr::arrange()|sort rows|order rows"
auto_link_case_sensitive: true
target_keyword: "dplyr arrange"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr arrange() in R: Sort Rows by Column

<p class="lead">The <code>arrange()</code> function in dplyr sorts the rows of a data frame by one or more columns. Default order is ascending; wrap a column in <code>desc()</code> to sort descending. The data frame structure stays the same, only the row order changes.</p>

[QUICK ANSWER]
arrange(df, mpg)                       # ascending by mpg
arrange(df, desc(mpg))                 # descending by mpg
arrange(df, cyl, desc(mpg))            # cyl asc, then mpg desc
arrange(df, desc(is.na(mpg)), mpg)     # put NAs first
arrange(df, .by_group = TRUE)          # respect group_by()
arrange(df, factor(grade, levels = c("A","B","C")))  # custom order
arrange(df, pick(starts_with("date"))) # sort by tidyselect

[DECISION TREE: How do I sort?]
- ascending: arrange(df, mpg)
- descending: arrange(df, desc(mpg))
- multi-column: arrange(df, cyl, desc(mpg))
- NAs first: arrange(df, desc(is.na(x)), x)
- within groups: group_by(df, cyl) |> arrange(mpg, .by_group = TRUE)
- custom order: arrange(df, factor(grade, levels = c("A","B","C")))
- by pattern: arrange(df, pick(starts_with("date")))

## What arrange() does in one sentence

**`arrange()` is a row sorter.** You pass a data frame and one or more sort keys; it returns the same rows reordered by those keys. Sort keys can be column names (ascending) or `desc(column)` for descending. Multi-column sort is implicit when you pass several keys: ties on the first key break by the second, and so on.

Unlike base R `df[order(df$x), ]`, arrange handles missing values consistently (NA always goes last), works inside a pipeline, and keeps row names intact for tibbles.

## Syntax

**`arrange()` takes a data frame plus sort keys.** Use `desc()` for descending. Use `.by_group = TRUE` to sort within group_by groups. Use `pick()` and tidyselect helpers for column-set sorting.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

mtcars |> select(mpg, cyl, hp) |> head(3)
#>                    mpg cyl  hp
#> Mazda RX4         21.0   6 110
#> Mazda RX4 Wag     21.0   6 110
#> Datsun 710        22.8   4  93
```

The full signature is:

```
arrange(.data, ..., .by_group = FALSE, .locale = NULL)
```

`.data` is the data frame. The `...` argument takes one or more sort keys. `.by_group = TRUE` makes arrange respect the grouping set by `group_by()`. `.locale` controls collation for character sorting (English by default).

[TIP]
**NA values always sort to the END regardless of asc/desc.** This is intentional and matches base R's `na.last = TRUE` default. To force NAs to the top, sort by `desc(is.na(col))` first: `arrange(df, desc(is.na(x)), x)`.

## Six common patterns

### 1. Sort ascending by one column

```r title="Sort by mpg ascending"
mtcars |>
  arrange(mpg) |>
  select(mpg, cyl) |>
  head(3)
#>                      mpg cyl
#> Cadillac Fleetwood  10.4   8
#> Lincoln Continental 10.4   8
#> Camaro Z28          13.3   8
```

### 2. Sort descending with desc()

```r title="Sort by mpg descending"
mtcars |>
  arrange(desc(mpg)) |>
  select(mpg, cyl) |>
  head(3)
#>                  mpg cyl
#> Toyota Corolla  33.9   4
#> Fiat 128        32.4   4
#> Honda Civic     30.4   4
```

`desc()` reverses the sort order for that key only. Other keys remain ascending.

### 3. Sort by multiple columns

```r title="Cyl ascending, then mpg descending within each"
mtcars |>
  arrange(cyl, desc(mpg)) |>
  select(cyl, mpg) |>
  head(6)
#>                cyl  mpg
#> Toyota Corolla   4 33.9
#> Fiat 128         4 32.4
#> Honda Civic      4 30.4
#> Lotus Europa     4 30.4
#> Fiat X1-9        4 27.3
#> Porsche 914-2    4 26.0
```

The first key (`cyl`) defines the primary order. Ties on `cyl` break by the second key (`desc(mpg)`).

### 4. Put NAs first

```r title="Show rows with missing mass first in starwars"
starwars |>
  arrange(desc(is.na(mass)), mass) |>
  select(name, mass) |>
  head(4)
#> # A tibble: 4 x 2
#>   name                  mass
#>   <chr>                <dbl>
#> 1 Beru Whitesun lars      NA
#> 2 R5-D4                   NA
#> 3 Arvel Crynyd            NA
#> 4 Ratts Tyerell            15
```

`desc(is.na(mass))` evaluates to TRUE for NA rows and sorts them first. Then `mass` sorts the rest ascending.

### 5. Sort within groups using .by_group

```r title="Within each cyl group, sort by mpg desc"
mtcars |>
  group_by(cyl) |>
  arrange(desc(mpg), .by_group = TRUE) |>
  select(cyl, mpg) |>
  head(6)
#> # A tibble: 6 x 2
#> # Groups:   cyl [2]
#>     cyl   mpg
#>   <dbl> <dbl>
#> 1     4  33.9
#> 2     4  32.4
#> 3     4  30.4
#> 4     4  30.4
#> 5     4  27.3
#> 6     4  26.0
```

Without `.by_group = TRUE`, arrange ignores groupings and sorts globally.

### 6. Custom sort order with factor()

```r title="Sort grades A, B, C, D explicitly"
df <- tibble(name = c("Alice","Bob","Cara","Dan"),
             grade = c("B","A","D","C"))

df |>
  arrange(factor(grade, levels = c("A","B","C","D"))) |>
  print()
#> # A tibble: 4 x 2
#>   name  grade
#>   <chr> <chr>
#> 1 Bob   A
#> 2 Alice B
#> 3 Cara  C
#> 4 Dan   D
```

Wrapping the sort key in `factor()` with explicit `levels` lets you define any order you want, including non-alphabetical or custom domain orders like "Low/Medium/High".

[KEY INSIGHT]
**arrange() does not change data, only row order.** Filtering, mutating, and summarising work on whatever rows you pass them, regardless of sort. The reason to arrange is human-readable output, top-N selection (`arrange |> head`), or window functions that depend on row order (`lead`, `lag`, `cumsum`).

## arrange() vs base R sorting

**Base R uses `order()` and bracket subsetting; arrange wraps that into a single readable call.** The semantics are nearly identical. The main practical differences are pipe-friendliness, NA handling consistency, and the readable `desc()` helper.

| Task | dplyr | Base R |
|---|---|---|
| Sort ascending | `arrange(df, mpg)` | `df[order(df$mpg), ]` |
| Sort descending | `arrange(df, desc(mpg))` | `df[order(-df$mpg), ]` |
| Multi-key | `arrange(df, cyl, desc(mpg))` | `df[order(df$cyl, -df$mpg), ]` |
| NAs first | `arrange(df, desc(is.na(x)), x)` | `df[order(df$x, na.last=FALSE), ]` |
| Custom order | `arrange(df, factor(g, levels=...))` | `df[order(factor(df$g, levels=...)), ]` |

When to use which:

- Use `arrange()` inside any dplyr pipeline.
- Use base R `order()` for one-line scripts or when sorting matrices and vectors that are not data frames.

## Common pitfalls

**Pitfall 1: arrange does not stick.** A subsequent `summarise()` or `group_by()` may reorder rows. If you need a guaranteed final order, place `arrange()` LAST in your pipeline before saving or displaying.

**Pitfall 2: forgetting `.by_group` after `group_by()`.** `mtcars |> group_by(cyl) |> arrange(desc(mpg))` ignores the grouping and sorts globally. To sort within groups, add `.by_group = TRUE`.

[WARNING]
**`desc()` only reverses the SORT ORDER, it does not negate the value.** `arrange(df, desc(name))` sorts character names Z to A. It does not transform the column. If you need the negated values themselves (for math), use `arrange(df, -mpg)` for numeric columns instead. `desc()` works on any type; `-` only on numeric.

**Pitfall 3: locale surprises with character sorting.** Sort order for non-ASCII characters depends on the system locale. Pass `.locale = "en"` (or another explicit locale) to get reproducible results across machines.

## Related dplyr functions

After mastering `arrange()`, look at:

- `desc()`: descending sort wrapper
- `slice_max()`, `slice_min()`: select top/bottom N rows by value (sorts implicitly)
- `pick()`: tidyselect inside `arrange()` for column-set sorting
- `with_order()`: arrange-and-compute, useful for window functions
- `group_by()` plus `.by_group = TRUE`: per-group sorting

For sorting that should be a transformation rather than a subset, also consider `mutate()` with rank functions like `min_rank()`, `dense_rank()`, and `row_number()`.

## FAQ

**How do I sort by multiple columns in dplyr?**

List them comma-separated: `arrange(df, cyl, desc(mpg))` sorts cyl ascending then mpg descending within each cyl group. The first column is the primary sort key.

**What is the difference between arrange and sort in R?**

`sort()` works on a single vector and returns a vector. `arrange()` works on a data frame and returns a data frame with rows reordered. For multi-column sorting in a data frame, only `arrange()` (or `order()`) makes sense.

**How do I sort descending in dplyr?**

Wrap the column in `desc()`: `arrange(df, desc(mpg))`. For numeric columns you can also use `arrange(df, -mpg)`. The `desc()` helper is more readable and works on any type.

**Where do NA values go when I arrange?**

NA values always sort to the END regardless of ascending or descending. This matches base R's default `na.last = TRUE`. To put NAs at the top, sort by `desc(is.na(col))` first, then by the column.

**Can I sort within groups using dplyr arrange?**

Yes. Add `.by_group = TRUE` after `group_by()`: `df |> group_by(cyl) |> arrange(mpg, .by_group = TRUE)`. Without that flag, arrange ignores grouping.
