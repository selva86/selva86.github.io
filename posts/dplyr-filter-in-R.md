---
title: "dplyr filter() in R: Subset Rows by Condition"
slug: "dplyr-filter-in-R"
description: "Use dplyr filter() to subset rows by logical conditions in R. Covers AND/OR, %in%, between(), NA-safe filtering, .by grouping, and 7 runnable examples."
keywords: "dplyr filter, filter rows in R, dplyr filter examples, R subset rows, dplyr filter multiple conditions, between, %in%"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "filter()|dplyr filter|dplyr::filter()|filter rows|subset rows"
auto_link_case_sensitive: true
target_keyword: "dplyr filter"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr filter() in R: Subset Rows by Condition

<p class="lead">The <code>filter()</code> function in dplyr keeps rows that satisfy a logical condition and drops the rest. You can combine multiple conditions with <code>&</code>, <code>|</code>, <code>!</code>, or by listing them as separate arguments (treated as AND).</p>

## What filter() does in one sentence

**`filter()` is a row subsetter.** You hand it a data frame and one or more logical conditions, and it returns the rows where every condition evaluates to `TRUE`. Conditions can be simple comparisons (`mpg > 20`), set membership (`cyl %in% c(4, 6)`), range checks (`between(hp, 100, 200)`), or compound expressions joined with `&` and `|`.

Unlike base R `df[df$x > 5, ]`, `filter()` understands the data frame implicitly: you write column names as bare expressions, no `$` or quoting. This is why it slots cleanly into a pipeline.

## Syntax

**`filter()` takes a data frame plus one or more logical expressions.** Multiple expressions are combined with AND by default. Use `&`, `|`, and `!` to express more complex logic explicitly.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

glimpse(mtcars)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, 19.2, ...
#> $ cyl  <dbl> 6, 6, 4, 6, 8, 6, 8, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 4, 4, 4, ...
#> $ disp <dbl> 160.0, 160.0, 108.0, 258.0, 360.0, 225.0, 360.0, 146.7, ...
#> $ hp   <int> 110, 110, 93, 110, 175, 105, 245, 62, 95, 123, 123, 180, ...
#> $ wt   <dbl> 2.620, 2.875, 2.320, 3.215, 3.440, 3.460, 3.570, 3.190, ...
```

The full signature is:

```
filter(.data, ..., .by = NULL, .preserve = FALSE)
```

`.data` is the data frame. The `...` argument takes one or more logical expressions. The optional `.by` argument lets you group on the fly without `group_by()`. The return value has the same columns as the input, but only the rows where all conditions are `TRUE`.

[TIP]
**Multiple conditions separated by commas behave like AND.** `filter(mtcars, mpg > 20, cyl == 4)` is identical to `filter(mtcars, mpg > 20 & cyl == 4)`. Pick whichever reads cleaner; comma form is more idiomatic in pipelines.

## Seven common patterns

### 1. Filter by a single condition

```r title="Cars with mpg over 25"
mtcars |>
  filter(mpg > 25) |>
  head()
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

### 2. Combine conditions with AND

```r title="Cars with mpg over 20 and 4 cylinders"
mtcars |>
  filter(mpg > 20, cyl == 4) |>
  nrow()
#> [1] 11
```

The comma form (`mpg > 20, cyl == 4`) is shorthand for `&`. Both keep rows where both conditions are `TRUE`.

### 3. Combine conditions with OR

```r title="Cars with very high or very low mpg"
mtcars |>
  filter(mpg > 30 | mpg < 12) |>
  select(mpg, cyl, hp)
#>                 mpg cyl  hp
#> Fiat 128       32.4   4  66
#> Honda Civic    30.4   4  52
#> Toyota Corolla 33.9   4  65
#> Lotus Europa   30.4   4 113
```

For OR you must use `|` explicitly. There is no comma shorthand for OR.

### 4. Membership tests with %in%

**`%in%` checks whether a value belongs to a set.** It is the readable way to express "x is one of these N values" without writing a long chain of `==`s connected by `|`.

```r title="Cars with 4 or 6 cylinders using %in%"
mtcars |>
  filter(cyl %in% c(4, 6)) |>
  count(cyl)
#>   cyl  n
#> 1   4 11
#> 2   6  7
```

### 5. Range checks with between()

**`between(x, lo, hi)` is a fast inclusive range check.** It is equivalent to `x >= lo & x <= hi` but reads cleaner and runs faster on large vectors.

```r title="Cars with horsepower between 100 and 150"
mtcars |>
  filter(between(hp, 100, 150)) |>
  select(mpg, hp)
#>                 mpg  hp
#> Mazda RX4      21.0 110
#> Mazda RX4 Wag  21.0 110
#> Hornet 4 Drive 21.4 110
#> Hornet Sport.  18.7 175
#> Valiant        18.1 105
#> ... (more rows)
```

### 6. Filter NA-safely

NA in a condition propagates: `NA > 0` returns `NA`, not `TRUE` or `FALSE`. `filter()` drops `NA` rows by default (treats them as not matching), but if you want to be explicit, combine with `!is.na()`.

```r title="Filter starwars characters with known mass over 100 kg"
starwars |>
  filter(!is.na(mass), mass > 100) |>
  select(name, mass) |>
  head()
#> # A tibble: 6 x 2
#>   name                   mass
#>   <chr>                 <dbl>
#> 1 Darth Vader             136
#> 2 Owen Lars               120
#> 3 Chewbacca               112
#> 4 Jabba Desilijic Tiure  1358
#> 5 Jek Tono Porkins        110
#> 6 IG-88                   140
```

### 7. Filter within groups using .by

```r title="Top mpg car within each cylinder group"
mtcars |>
  filter(mpg == max(mpg), .by = cyl) |>
  select(cyl, mpg)
#>     cyl  mpg
#> 1     6 21.4
#> 2     4 33.9
#> 3     8 19.2
```

The `.by` argument groups on the fly for the duration of the call. The result is automatically ungrouped, unlike `group_by() |> filter()`.

[KEY INSIGHT]
**`.by` and `group_by()` produce the same result for grouped filters, but `.by` does not leave the data grouped afterwards.** Use `.by` for one-off grouped operations to avoid surprising downstream behavior; use `group_by()` when subsequent verbs in the pipeline also need the grouping.

## filter() vs base R row subsetting

**`filter()` reads as English; base R bracket subsetting reads as algebra.** That is the real difference. Both produce identical results; the choice is style and pipeline ergonomics.

| Task | dplyr | Base R |
|---|---|---|
| Single condition | `filter(df, x > 5)` | `df[df$x > 5, ]` |
| AND | `filter(df, x > 5, y < 10)` | `df[df$x > 5 & df$y < 10, ]` |
| OR | `filter(df, x > 5 | y < 10)` | `df[df$x > 5 | df$y < 10, ]` |
| Membership | `filter(df, x %in% c(1,2,3))` | `df[df$x %in% c(1,2,3), ]` |
| Range | `filter(df, between(x, 1, 10))` | `df[df$x >= 1 & df$x <= 10, ]` |
| NA-safe | `filter(df, !is.na(x), x > 5)` | `df[!is.na(df$x) & df$x > 5, ]` |

When to use which:

- Use `filter()` inside any pipeline that uses other dplyr verbs.
- Use base R `[, ]` for one-line scripts with no other tidyverse code, or when squeezing the last drop of speed for very large in-memory data.

## Common pitfalls

**Pitfall 1: using `=` instead of `==`.** `filter(mtcars, cyl = 4)` errors with "unused argument". Use `==` for equality. This is the single most common dplyr mistake.

**Pitfall 2: NA in conditions silently drops rows.** A row where `x` is `NA` will never satisfy `x > 5` (the comparison returns `NA`, which `filter()` treats as not matching). If you want NA rows kept, use `is.na(x) | x > 5`. If you want them excluded explicitly, write `!is.na(x), x > 5`.

[WARNING]
**Confusing `filter()` with `select()` is the most common dplyr error after `=` vs `==`.** `filter()` picks rows by condition; `select()` picks columns by name. If you write `filter(mtcars, mpg, cyl)` (no condition), R errors because `mpg` and `cyl` are not logical vectors. If you wanted the columns, use `select()`.

**Pitfall 3: chained `&` is faster than separate filter calls in some cases.** `filter(df, a > 0, b > 0)` and `filter(df, a > 0) |> filter(b > 0)` produce the same result, but the single call evaluates conditions in one pass. For large data, prefer the comma form.

## Related dplyr functions

After mastering `filter()`, look at:

- `slice()`, `slice_head()`, `slice_tail()`, `slice_min()`, `slice_max()`: row selection by position or sorted value
- `distinct()`: remove duplicate rows
- `arrange()`: sort rows (does not subset)
- `between()`, `if_any()`, `if_all()`: helpers for compound row conditions
- `dplyr::filter()` vs `stats::filter()`: the latter is for time-series filtering, unrelated. Use `dplyr::filter()` explicitly when both packages are loaded.

## FAQ

**How do I filter for multiple conditions in dplyr?**

List them comma-separated for AND: `filter(df, x > 5, y < 10)`. Use `|` for OR: `filter(df, x > 5 | y < 10)`. Negate with `!`: `filter(df, !(x > 5))`. Combine freely with parentheses: `filter(df, (x > 5 & y < 10) | z == "A")`.

**What is the difference between filter() and subset() in R?**

`subset()` is a base R function with similar behavior, but it uses non-standard evaluation in ways that differ subtly from dplyr. The R documentation for `subset()` advises against using it in scripts. `filter()` is the modern, predictable replacement.

**How do I filter rows where a column is NA?**

Use `is.na()` inside `filter()`: `filter(df, is.na(x))` returns rows where x is NA. To EXCLUDE NA rows, use `filter(df, !is.na(x))`. The `drop_na()` function from tidyr does this for multiple columns at once.

**Can I filter using a regular expression?**

Yes, with `grepl()` or `str_detect()` inside the condition: `filter(df, grepl("pattern", x))` or `filter(df, str_detect(x, "pattern"))`. Both return logical vectors that `filter()` accepts.

**How do I filter the top N rows by a column?**

Use `slice_max()` or `slice_min()`, not `filter()`. `slice_max(df, mpg, n = 5)` returns the top 5 rows by mpg. `filter()` is for arbitrary conditions, not for ranking-based selection.
