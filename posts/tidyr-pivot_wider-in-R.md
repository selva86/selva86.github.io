---
title: "tidyr pivot_wider() in R: Long to Wide Format"
slug: "tidyr-pivot_wider-in-R"
description: "Use tidyr pivot_wider() to reshape long data to wide format in R. Covers names_from, values_from, multiple value cols, fill, name_glue, and 6 examples."
keywords: "tidyr pivot_wider, R long to wide, reshape long to wide R, pivot wider examples, names_from values_from, spread replacement"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "pivot_wider()|tidyr pivot_wider|long to wide|reshape wide|spread replacement"
auto_link_case_sensitive: true
target_keyword: "tidyr pivot_wider"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr pivot_wider() in R: Long to Wide Format

<p class="lead">The <code>pivot_wider()</code> function in tidyr reshapes long data into wide format by spreading one column's values into MULTIPLE new columns named by another column. It is the modern replacement for <code>spread()</code>.</p>

[QUICK ANSWER]
pivot_wider(df, names_from = year, values_from = sales)        # basic
pivot_wider(df, names_from = year, values_from = c(sales, costs))  # multi-value
pivot_wider(df, names_from = year, values_from = sales, values_fill = 0)
pivot_wider(df, names_from = year, values_from = sales, names_prefix = "y")
pivot_wider(df, names_from = c(metric, year), values_from = value)
pivot_wider(df, names_from = year, values_from = sales, values_fn = sum)

[DECISION TREE: Is pivot_wider() the right tool?]
- one column has names, another values: pivot_wider(names_from, values_from)
- aggregate then pivot: summarise() first, then pivot_wider()
- duplicates need aggregation: values_fn = sum/mean/etc.
- wide -> long: pivot_longer()
- multiple values per cell: pack/unpack or list-cols
- contingency table from raw: table() (base R) or count() then pivot_wider
- pivot then summary: pivot_wider() |> mutate(across(...))

## What pivot_wider() does in one sentence

**`pivot_wider()` takes a long data frame and produces a wide one by using values from one column as NEW COLUMN NAMES, with values from another column filling the cells.** Each row of the wide output corresponds to a unique combination of the columns NOT being pivoted.

This is the inverse of `pivot_longer()`. Use it when you want a presentation-friendly table or when downstream code expects wide format.

## Syntax

**`pivot_wider(data, names_from, values_from)` is the minimum.** `names_from` is the column whose values become NEW column names; `values_from` is the column whose values fill the new columns.

```r title="Build a long data frame and pivot wider"
library(tidyr)

long <- tibble::tribble(
  ~country, ~year, ~sales,
  "USA",    2020,  100,
  "USA",    2021,  110,
  "USA",    2022,  120,
  "UK",     2020,   80,
  "UK",     2021,   85,
  "UK",     2022,   88
)

long |> pivot_wider(names_from = year, values_from = sales)
#> # A tibble: 2 x 4
#>   country `2020` `2021` `2022`
#>   <chr>    <dbl>  <dbl>  <dbl>
#> 1 USA        100    110    120
#> 2 UK          80     85     88
```

[TIP]
**`names_prefix` adds a prefix to new column names.** `pivot_wider(names_from = year, values_from = sales, names_prefix = "y")` produces columns `y2020`, `y2021`, `y2022`. Useful when names_from values are numeric and would create syntactically awkward column names.

## Six common patterns

### 1. Basic long to wide

```r title="One value column"
long |> pivot_wider(names_from = year, values_from = sales)
```

Each unique value of `year` becomes a column; values from `sales` fill the cells. The remaining column (`country`) becomes the row identifier.

### 2. Multiple value columns

```r title="Pivot two values at once"
long2 <- tibble::tribble(
  ~country, ~year, ~sales, ~costs,
  "USA",    2020,  100, 50,
  "USA",    2021,  110, 55,
  "UK",     2020,   80, 40,
  "UK",     2021,   85, 42
)

long2 |> pivot_wider(names_from = year, values_from = c(sales, costs))
#> # A tibble: 2 x 5
#>   country sales_2020 sales_2021 costs_2020 costs_2021
#>   <chr>        <dbl>      <dbl>      <dbl>      <dbl>
#> 1 USA            100        110         50         55
#> 2 UK              80         85         40         42
```

`values_from = c(sales, costs)` produces TWO sets of columns: `sales_<year>` and `costs_<year>`.

### 3. Fill missing combinations

```r title="Fill missing cells with 0"
sparse <- tibble::tribble(
  ~country, ~year, ~sales,
  "USA",    2020,  100,
  "USA",    2021,  110,
  "UK",     2021,   85
)

sparse |> pivot_wider(names_from = year, values_from = sales, values_fill = 0)
#> # A tibble: 2 x 3
#>   country `2020` `2021`
#>   <chr>    <dbl>  <dbl>
#> 1 USA        100    110
#> 2 UK           0     85
```

`values_fill = 0` replaces missing combinations with 0 instead of NA. Useful for count tables where missing means "zero observed".

### 4. Aggregate when there are duplicates

```r title="Sum when multiple rows map to one cell"
dups <- tibble::tribble(
  ~country, ~year, ~sales,
  "USA",    2020,  100,
  "USA",    2020,   50,
  "USA",    2021,  110
)

dups |> pivot_wider(names_from = year, values_from = sales, values_fn = sum)
#> # A tibble: 1 x 3
#>   country `2020` `2021`
#>   <chr>    <dbl>  <dbl>
#> 1 USA        150    110
```

`values_fn = sum` aggregates duplicate rows (here: USA in 2020 has two rows; sum = 150). Without `values_fn`, pivot_wider warns and creates a list-column.

### 5. Composite column names from multiple keys

```r title="names_from with multiple columns"
multi <- tibble::tribble(
  ~country, ~metric, ~year, ~value,
  "USA",    "sales", 2020,  100,
  "USA",    "sales", 2021,  110,
  "USA",    "costs", 2020,   50,
  "USA",    "costs", 2021,   55
)

multi |> pivot_wider(names_from = c(metric, year), values_from = value)
#> # A tibble: 1 x 5
#>   country sales_2020 sales_2021 costs_2020 costs_2021
#>   <chr>        <dbl>      <dbl>      <dbl>      <dbl>
#> 1 USA            100        110         50         55
```

`names_from = c(metric, year)` combines both column values to build new column names.

### 6. Custom name template with names_glue

```r title="Build column names with a template"
multi |>
  pivot_wider(names_from = c(metric, year),
              values_from = value,
              names_glue = "{year}_{metric}")
#> # A tibble: 1 x 5
#>   country `2020_sales` `2021_sales` `2020_costs` `2021_costs`
#>   <chr>          <dbl>        <dbl>        <dbl>        <dbl>
#> 1 USA              100          110           50           55
```

`names_glue` is a glue-style template referencing the names_from columns. Lets you control the order and separators of generated column names.

[KEY INSIGHT]
**If your data has duplicates for the same `(id, names_from)` combination, `pivot_wider()` will warn or create a list-column.** Solutions: aggregate first with `summarise()`, or pass `values_fn` to aggregate during the pivot. Never let pivot_wider silently make wrong choices about duplicates.

## pivot_wider() vs spread() vs reshape

**`pivot_wider()` is the modern (tidyr 1.0+) replacement for `spread()`. Both reshape long to wide.**

| Operation | Modern tidyr | Old tidyr | reshape2 |
|---|---|---|---|
| Long to wide | pivot_wider | spread | dcast |
| Multiple values | values_from = c(a, b) | (impossible) | (manual) |
| Fill missing | values_fill | fill arg | fill arg |
| Aggregate dups | values_fn | (errors) | fun.aggregate |
| Composite names | names_from = c(a, b) | (manual) | (manual) |

When to use which:

- Use `pivot_wider()` for new code.
- `spread()` is deprecated but still works.
- `reshape2::dcast()` is still common in some tutorials but supersedeed by tidyr.

## Common pitfalls

**Pitfall 1: forgetting to name the value column.** `pivot_wider(names_from = year)` is incomplete; you must specify `values_from` too. The error message is reasonably clear but easy to miss.

**Pitfall 2: duplicate keys causing list-columns.** If `(id, year)` appears more than once, pivot_wider may produce a list-column instead of a value. Aggregate first with `summarise()` or use `values_fn`.

[WARNING]
**Numeric `names_from` produces NUMERIC-looking column names that are actually strings.** `pivot_wider(names_from = year, values_from = sales)` with year = 2020:2022 makes columns named "2020", "2021", "2022" (strings). Refer to them with backticks: `df$\`2020\`` or `df[["2020"]]`. Use `names_prefix` to make them syntactically valid (e.g., "y2020").

**Pitfall 3: `id_cols` confusion.** When you have many columns and only some should be the row identifier, use `id_cols` to specify them explicitly: `pivot_wider(id_cols = c(country, region), ...)`. Otherwise tidyr infers them from non-pivoted columns.

## Try it yourself

**Try it:** Take the long iris-like data below and pivot it wider so each `Species` becomes a column with the mean `Sepal.Length` as values. Save to `ex_wide`.

```r title="Your turn: pivot iris means wider"
iris_long <- iris |>
  dplyr::summarise(mean_sl = mean(Sepal.Length), .by = Species)

iris_long
#> # A tibble: 3 x 2
#>   Species    mean_sl
#>   <fct>        <dbl>
#> 1 setosa        5.01
#> 2 versicolor    5.94
#> 3 virginica     6.59

# Try it: pivot wider so each Species is a column
ex_wide <- iris_long |>
  # your code here

ex_wide
#> Expected: 1-row tibble with 3 columns (setosa, versicolor, virginica)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_wide <- iris_long |>
  pivot_wider(names_from = Species, values_from = mean_sl)

ex_wide
#> # A tibble: 1 x 3
#>   setosa versicolor virginica
#>    <dbl>      <dbl>     <dbl>
#> 1   5.01       5.94      6.59
```

**Explanation:** `names_from = Species` makes each Species value a new column. `values_from = mean_sl` fills those columns with the mean Sepal.Length. The result has one row total because there were no other id columns.

</details>

## Related tidyr functions

After mastering pivot_wider, look at:

- `pivot_longer()`: inverse operation, wide to long
- `nest()`, `unnest()`: list-column reshaping
- `complete()`: fill in missing combinations before pivoting
- `expand()`, `expand_grid()`: generate combinations
- `crossing()`: Cartesian product of vectors

For data.table users, `dcast()` is the equivalent and is faster on large data.

## FAQ

**How do I reshape long to wide in R?**

Use `tidyr::pivot_wider(data, names_from = key_col, values_from = value_col)`. The values in `key_col` become NEW column names; the values in `value_col` fill the cells.

**What is the difference between spread() and pivot_wider()?**

`pivot_wider()` is the modern replacement (tidyr 1.0+). It supports multiple value columns (`values_from = c(a, b)`), composite names (`names_from = c(a, b)`), fill values (`values_fill`), and aggregation (`values_fn`). `spread()` is deprecated but still works in old code.

**How do I handle duplicates when pivoting wider?**

Pass `values_fn = sum` (or `mean`, `first`, etc.) to aggregate duplicates during the pivot. Or aggregate beforehand with `summarise()`. Without one of these, pivot_wider produces a list-column for duplicate keys.

**How do I fill missing values in pivot_wider?**

Use `values_fill = 0` (or another value). Missing combinations of `names_from` keys become 0 instead of NA.

**How do I keep multiple value columns when pivoting wider?**

Pass a vector to `values_from`: `pivot_wider(names_from = year, values_from = c(sales, costs))`. The result has one set of columns per value column, named by the convention `<value>_<name>`.
