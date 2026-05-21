---
title: "tibble column_to_rownames() in R: Move Column Into Rownames"
slug: "tibble-column_to_rownames-in-R"
description: "Move a data frame column into row names with tibble column_to_rownames() in R. Learn syntax, mtcars round-trip, dist() matrix prep, and three common pitfalls."
keywords: "tibble column_to_rownames, column_to_rownames function R, tibble column_to_rownames examples, R column to rownames, set rownames from column R, convert column to row names R, column_to_rownames tidyverse"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "column_to_rownames()|tibble column_to_rownames|tibble::column_to_rownames()|set rownames from column|column to row names"
auto_link_case_sensitive: true
target_keyword: "tibble column_to_rownames"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble column_to_rownames() in R: Move Column Into Rownames

<p class="lead">The <code>column_to_rownames()</code> function in the tibble package moves the values of a chosen column into a data frame's row names, drops that column, and returns a base <code>data.frame</code> ready for matrix routines that need labeled rows.</p>

[QUICK ANSWER]
column_to_rownames(df, "id")                       # canonical: explicit var
column_to_rownames(df)                              # default var = "rowname"
df |> column_to_rownames("model")                   # pipe-friendly
mtcars_t |> column_to_rownames("model")             # restore mtcars rownames
df |> mutate(id = paste0("s", row_number())) |>     # create then promote
  column_to_rownames("id")
rownames_to_column(df, "id") |>                     # round-trip
  column_to_rownames("id")
as.matrix(column_to_rownames(df, "id"))             # feed to matrix routines

[DECISION TREE: Is column_to_rownames() the right tool?]
- move a column into rownames: column_to_rownames(df, "id")
- move existing rownames OUT to a column: rownames_to_column(df, "id")
- drop rownames entirely without saving: remove_rownames(df)
- check whether a frame has rownames: has_rownames(df)
- assign rownames from an arbitrary character vector: rownames(df) = vec
- add a sequential id without touching rownames: rowid_to_column(df, "id")
- keep rownames during tibble conversion: as_tibble(df, rownames = "var")

## What column_to_rownames() does in one sentence

**`column_to_rownames()` returns a base data frame whose row names are the values of one of its columns, with that column removed.** You pass a data frame and the name of the column to promote, and the function shifts those values into the row names attribute while stripping the column from the result. The return type is always a base data frame, never a tibble, because tibbles by design carry no row names.

The function lives in the tibble package and exists to bridge tidyverse pipelines back into base R territory. Routines like `stats::dist()`, `stats::cor()`, `as.matrix()`, and most heatmap and PCA helpers expect row names as the sample or observation label, then propagate those labels into their output. `column_to_rownames()` is the canonical promotion step at the end of a dplyr chain that prepares a frame for these label-carrying routines.

## Syntax

**`column_to_rownames()` takes the data frame first, then a `var` string naming the column to promote.** The column must contain unique non-NA values; duplicates or missing values trigger an error.

```r title="Load tibble and dplyr"
library(tibble)
library(dplyr)

# A small data frame with a label column
df <- data.frame(
  model = c("Mazda RX4", "Datsun 710", "Camaro Z28"),
  mpg   = c(21.0, 22.8, 13.3),
  hp    = c(110, 93, 245)
)
df
#>        model  mpg  hp
#> 1  Mazda RX4 21.0 110
#> 2 Datsun 710 22.8  93
#> 3 Camaro Z28 13.3 245
```

The full signature is:

```
column_to_rownames(.data, var = "rowname")
```

Arguments:

- `.data`: a `data.frame` or tibble. The return type is always base `data.frame`.
- `var`: a string naming the column to promote. Defaults to `"rowname"` for round-trips with `rownames_to_column()`.

The result has one fewer column than the input, with row names set to the promoted values.

[TIP]
**Always pass `var` explicitly.** The default `"rowname"` only exists to make round-trips with `rownames_to_column()` work without arguments. In a fresh pipeline, passing `var = "model"` or `var = "sample_id"` documents intent.

## Six common patterns

### 1. Promote a label column with an explicit var

```r title="Promote model column into rownames"
df_rn <- column_to_rownames(df, var = "model")
df_rn
#>             mpg  hp
#> Mazda RX4  21.0 110
#> Datsun 710 22.8  93
#> Camaro Z28 13.3 245
```

The `model` column is gone from the body; its values are the new row labels. The remaining columns retain their original order. A call to `rownames(df_rn)` now returns the model strings instead of integer indices.

### 2. Default var = "rowname" round-trips with the inverse function

```r title="Default works after rownames_to_column"
mtcars |>
  rownames_to_column() |>
  column_to_rownames() |>
  head(3)
#>                mpg cyl disp  hp drat   wt qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.62 16.5  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.88 17.0  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.32 18.6  1  1    4    1
```

With no arguments, `rownames_to_column()` creates a column called `"rowname"`, and `column_to_rownames()` consumes the same name on the way back. The output is identical to the original `mtcars`. In production code, prefer the explicit `var = "model"` so a future reader does not need to remember the default convention.

### 3. Pipe-friendly placement at the end of a dplyr chain

```r title="Filter then promote inside a pipe"
mtcars |>
  rownames_to_column("model") |>
  filter(cyl == 4) |>
  column_to_rownames("model") |>
  head(3)
#>              mpg cyl  disp hp drat    wt qsec vs am gear carb
#> Datsun 710  22.8   4 108.0 93 3.85 2.320 18.6  1  1    4    1
#> Merc 240D   24.4   4 146.7 62 3.69 3.190 20.0  1  0    4    2
#> Merc 230    22.8   4 140.8 95 3.92 3.150 22.9  1  0    4    2
```

Push the promotion to the end of the chain. Dplyr verbs cannot reference rownames, so the recipe is: lift rownames into a column, do all dplyr work, then promote back to rownames when you're ready to hand the frame to a base R routine.

### 4. Build a labeled matrix for dist() or heatmap()

```r title="Prepare a labeled matrix from a tibble"
samples <- tibble(
  sample = paste0("s", 1:4),
  gene_a = c(2.1, 3.4, 1.2, 4.5),
  gene_b = c(0.8, 1.1, 2.3, 1.0),
  gene_c = c(5.0, 4.8, 3.9, 5.2)
)
samples_mat <- samples |>
  column_to_rownames("sample") |>
  as.matrix()
samples_mat
#>    gene_a gene_b gene_c
#> s1    2.1    0.8    5.0
#> s2    3.4    1.1    4.8
#> s3    1.2    2.3    3.9
#> s4    4.5    1.0    5.2

dist(samples_mat)
#>          s1       s2       s3
#> s2 1.345...
#> s3 2.572...
#> s4 2.408...
```

`dist()`, `heatmap()`, `prcomp()`, and friends label their output rows by rownames. Promoting `sample` into rownames before `as.matrix()` keeps `s1`, `s2`, `s3`, `s4` flowing through the distance matrix, cluster dendrogram, or biplot. Without this step, the same routines fall back to integer indices and you lose the link back to the original samples.

### 5. Promote a freshly created id column

```r title="Create an id then promote it"
df_id <- mtcars |>
  rownames_to_column("model") |>
  filter(cyl == 6) |>
  mutate(id = paste0("car_", row_number())) |>
  select(id, mpg, hp, wt) |>
  column_to_rownames("id")
df_id
#>        mpg  hp    wt
#> car_1 21.0 110 2.620
#> car_2 21.0 110 2.875
#> car_3 21.4 110 3.215
#> car_4 18.1 105 3.460
#> car_5 19.2 123 3.440
#> car_6 17.8 123 3.440
#> car_7 19.7 175 2.770
```

You can promote any column you create mid-pipeline. The `paste0("car_", row_number())` step guarantees uniqueness, which `column_to_rownames()` will enforce on the next line. This pattern attaches synthetic identifiers (composite keys, batch numbers, condition labels) just before exporting to a labelled matrix.

### 6. Tibble inputs work, output is always data.frame

```r title="Tibble in, data.frame out"
tb <- tibble(id = c("a", "b", "c"), x = 1:3, y = 4:6)
result <- column_to_rownames(tb, "id")
result
#>   x y
#> a 1 4
#> b 2 5
#> c 3 6

class(result)
#> [1] "data.frame"
```

Tibble inputs are accepted. The return type is always base `data.frame` because tibbles cannot carry row names. To convert back, wrap the result with `as_tibble(result, rownames = "id")`.

## column_to_rownames() vs alternatives

**Pick `column_to_rownames()` when you need rownames on the output and the labels live in a column.** Several adjacent tools cover related row-axis tasks.

| Behavior | `column_to_rownames()` | `rownames(df) <- df$col` | `tibble::deframe()` | `as_tibble(rownames=)` |
|---|---|---|---|---|
| Source | tibble | base R | tibble | tibble |
| Best for | End of dplyr chain | Quick base R one-liner | Two-column to named vector | Lift rownames during conversion |
| Drops promoted column | Yes | No (manual) | N/A (returns vector) | N/A (reverse direction) |
| Errors on duplicates | Yes | Silent (recycles) | No | No |
| Returns | data.frame | data.frame | named vector | tibble |
| Direction | column to rownames | column to rownames | column to vector | rownames to column |

When to use which:

- Use `column_to_rownames()` for explicit, error-checked promotion at the end of a tidy pipeline.
- Use base R `rownames(df) = df$col; df$col = NULL` for one-off scripts; expect silent duplicate recycling.
- Use `tibble::deframe()` when you want a named vector, not a labeled data frame.
- Use `as_tibble(df, rownames = "var")` for the reverse direction: lifting rownames out as a column during tibble conversion.

[KEY INSIGHT]
**The tidyverse treats rownames as a return-trip artifact, not a storage format.** Pipelines should hold row identifiers as ordinary columns where dplyr verbs can see them. `column_to_rownames()` exists for the final hop, when a base R routine like `dist()` or `prcomp()` expects rownames as its label channel.

## Common pitfalls

**Pitfall 1: duplicate values in the promoted column.** Row names must be unique. The function passes values straight to `row.names<-`, which rejects duplicates with a base R error.

```r title="Duplicates trigger an error"
df_dup <- data.frame(id = c("a", "a", "b"), x = 1:3)
# This errors:
# column_to_rownames(df_dup, "id")
# Error: `df` must have unique row names.

# Fix: deduplicate or compose a unique key first
df_dup |>
  group_by(id) |>
  mutate(id = paste0(id, "_", row_number())) |>
  ungroup() |>
  column_to_rownames("id")
#>     x
#> a_1 1
#> a_2 2
#> b_1 3
```

**Pitfall 2: forgetting the result is a data.frame, not a tibble.** Even with a tibble input, the output prints with base R formatting and downstream tibble-specific code may break.

```r title="Output type changes"
tb_in <- tibble(id = c("a", "b"), x = 1:2)
class(column_to_rownames(tb_in, "id"))
#> [1] "data.frame"
```

If the next step expects a tibble, wrap the result with `as_tibble(rownames = "id")` to round-trip the rownames into a column.

[WARNING]
**The default `var = "rowname"` silently fails on unprepared frames.** Calling `column_to_rownames(df)` without an explicit `var` only works if a column called `"rowname"` exists. On any other frame, you'll see `Can't extract columns that don't exist`. Pass `var` explicitly in production code.

**Pitfall 3: missing values in the promoted column.** Row names cannot be `NA`. Any missing value errors out the call.

```r title="NA values block promotion"
df_na <- data.frame(id = c("a", NA, "c"), x = 1:3)
# This errors:
# column_to_rownames(df_na, "id")
# Error: missing values in 'row.names' are not allowed

# Fix: filter or impute before promoting
df_na |>
  filter(!is.na(id)) |>
  column_to_rownames("id")
#>   x
#> a 1
#> c 3
```

## Try it yourself

**Try it:** Take `USArrests`, lift its state row names into a column called `state`, filter to states whose `Murder` rate is above 10, then promote `state` back into rownames so the result is a labeled data frame ready for `dist()`. Save the labeled frame to `ex_arrests_mat`.

```r title="Your turn: round-trip USArrests through dplyr"
library(tibble)
library(dplyr)
# Try it: build ex_arrests_mat
ex_arrests_mat <- # your code here

ex_arrests_mat
#> Expected: 5 rows, rownames Alabama/Florida/Georgia/Mississippi/South Carolina
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_arrests_mat <- USArrests |>
  rownames_to_column("state") |>
  filter(Murder > 10) |>
  column_to_rownames("state")

ex_arrests_mat
#>                Murder Assault UrbanPop Rape
#> Alabama          13.2     236       58 21.2
#> Florida          15.4     335       80 31.9
#> Georgia          17.4     211       60 25.8
#> Mississippi      16.1     259       44 17.1
#> South Carolina   14.4     279       48 22.5

dist(as.matrix(ex_arrests_mat))
#>                  Alabama  Florida  Georgia Mississippi
#> Florida        103.83...
#> Georgia         27.83...
#> Mississippi     34.39...
#> South Carolina  46.06...
```

**Explanation:** `rownames_to_column("state")` lifts the labels into a column so `filter()` can see them. After filtering, `column_to_rownames("state")` promotes them back so the matrix passed to `dist()` carries its row labels through into the distance output.

</details>

## Related tibble functions

Alongside `column_to_rownames()`, look at:

- `rownames_to_column()`: the inverse operation, moves row names out into a new column.
- `has_rownames()`: returns `TRUE` if a data frame carries non-trivial row names.
- `remove_rownames()`: drops row names entirely without saving them.
- `rowid_to_column()`: adds a fresh integer id column without touching existing row names.
- `as_tibble(rownames = "var")`: combines rowname lifting with tibble conversion in one call.
- `tibble::deframe()`: converts a two-column data frame into a named vector instead.

For the full reference, see the [official tibble documentation](https://tibble.tidyverse.org/reference/rownames.html).

## FAQ

**How do I move a column to row names in R?**

Call `column_to_rownames()` from the tibble package, passing the data frame and the column to promote: `column_to_rownames(df, "id")`. The values in the named column become the row names, and the column itself is removed. The return type is base `data.frame` even if the input was a tibble. Values in the promoted column must be unique and non-NA.

**What is the difference between column_to_rownames() and `rownames(df) <- df$col`?**

`column_to_rownames()` is safer: it errors on duplicates and missing values, and it drops the promoted column for you. The base R assignment recycles duplicates silently into `1, 2, 3` row numbers in some R versions, leaves the original column in place, and returns whatever class the input was. For tidy pipelines, prefer the tibble call for the explicit error path.

**Why does column_to_rownames() return a data.frame instead of a tibble?**

Tibbles intentionally do not support row names; they make every per-row identifier a first-class column. `column_to_rownames()` exists precisely to bridge into base R routines that need rownames (`dist()`, `prcomp()`, `heatmap()`, `as.matrix()`), so it returns a base `data.frame` even when handed a tibble.

**Can I undo column_to_rownames()?**

Yes. `rownames_to_column(df, "id")` is the exact inverse: it lifts the row names back into a column. Round-tripping is lossless as long as no rows are reordered between the two calls. Note that `rownames_to_column()` returns a tibble.

**Does column_to_rownames() modify the original data frame?**

No. `column_to_rownames()` returns a new data frame; the original is unchanged. Assign the result back to persist the change, for example `df = column_to_rownames(df, "id")`. Tidyverse functions are pure, so changes only persist through explicit assignment.
