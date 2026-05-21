---
title: "tibble as_tibble() in R: Convert Objects to Tibbles"
slug: "tibble-as_tibble-in-R"
description: "Convert data frames, lists, matrices, and named vectors to tibbles in R using as_tibble(). Learn rownames handling, name repair options, and pitfalls."
keywords: "tibble as_tibble, as_tibble function R, tibble as_tibble examples, R as_tibble data frame, convert to tibble R, as_tibble vs tibble, as_tibble rownames"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "as_tibble()|tibble as_tibble|tibble::as_tibble()|convert to tibble|coerce to tibble"
auto_link_case_sensitive: true
target_keyword: "tibble as_tibble"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble as_tibble() in R: Convert Objects to Tibbles

<p class="lead">The <code>as_tibble()</code> function in the tibble package converts an existing data frame, list, matrix, or named vector into a tibble, with optional <code>rownames</code> handling and stricter name repair than base coercion.</p>

[QUICK ANSWER]
as_tibble(mtcars)                            # data.frame to tibble
as_tibble(mtcars, rownames = "car")          # keep row names as column
as_tibble(list(x = 1:3, y = c("a","b","c"))) # named list to tibble
as_tibble(matrix(1:6, 2, 3))                 # matrix to tibble
as_tibble(c(a = 1, b = 2, c = 3))            # named vector (use enframe)
as_tibble(df, .name_repair = "unique")       # auto-fix duplicate names
as_tibble(df, .name_repair = "minimal")      # keep names as-is

[DECISION TREE: Is as_tibble() the right tool?]
- coerce an existing data.frame: as_tibble(df)
- build a fresh tibble from vectors: tibble(x = 1:3, y = letters[1:3])
- build row-by-row in code: tribble(~x, ~y, 1, "a", 2, "b")
- promote a named vector to two columns: enframe(c(a = 1, b = 2))
- inspect tibble structure without coercing: glimpse(df)
- go back to a plain data.frame: as.data.frame(tbl)
- preserve row names through the coercion: as_tibble(df, rownames = "id")

## What as_tibble() does in one sentence

**`as_tibble()` converts an existing object into a tibble.** You pass a data frame, named list, matrix, or another tibble, and the function returns a `tbl_df` with the same data, optional row-name handling, and stricter checks on column names than `as.data.frame()`. It is the standard coercion function in the tidyverse and the entry point for promoting base-R objects into modern pipelines.

The use case is straightforward. You read a CSV with `read.csv()`, run a base function that returns a `data.frame`, or have a `list` of equal-length vectors. One call to `as_tibble()` and you can pipe straight into `dplyr` and `ggplot2` with predictable printing, no row-name surprises, and no accidental string-to-factor conversion.

## Syntax

**`as_tibble()` is an S3 generic with methods for the common R container types.** Each method honors the same control arguments: `.rows`, `.name_repair`, `rownames`, and `validate`.

```r title="Load tibble and see the basic call"
library(tibble)

as_tibble(mtcars) |> head(3)
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3  22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
```

The full signature for the `data.frame` method is:

```
as_tibble(x, ..., .rows = NULL, .name_repair = "check_unique",
          rownames = NULL, validate = NULL)
```

- `x` is the object to convert (data frame, list, matrix, table, or similar).
- `.name_repair` controls duplicate or empty names: `"check_unique"` (default, errors on duplicates), `"unique"` (auto-suffix), `"minimal"` (keep as-is), `"universal"` (also fix syntax).
- `rownames` controls row-name behavior: `NULL` drops them silently (default for tibbles), `NA` drops them with no warning, or a string keeps them as a new column with that name.
- `validate` is deprecated in favor of `.name_repair`.

The return value always has class `c("tbl_df", "tbl", "data.frame")`.

[TIP]
**Pass `rownames` whenever the input has meaningful row labels.** Built-in datasets like `mtcars` and `USArrests` carry car or state names as row names. Default coercion silently drops them. `as_tibble(mtcars, rownames = "car")` preserves them as a proper character column, ready for joining or plotting.

## Six common patterns

### 1. Convert a data.frame

```r title="Promote a base data.frame"
df <- data.frame(id = 1:3, name = c("Ana", "Bo", "Cy"), score = c(91, 85, 78))
as_tibble(df)
#> # A tibble: 3 x 3
#>      id name  score
#>   <int> <chr> <dbl>
#> 1     1 Ana      91
#> 2     2 Bo       85
#> 3     3 Cy       78
```

Note that the `name` column comes out as `<chr>`, not factor, even though `data.frame()` may have stored it as a factor on older R versions. The coercion is a clean read of the underlying vectors.

### 2. Preserve row names as a column

```r title="Keep car names from mtcars"
as_tibble(mtcars, rownames = "car") |> head(3)
#> # A tibble: 3 x 12
#>   car             mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>         <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Mazda RX4      21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2 Mazda RX4 Wag  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3 Datsun 710     22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
```

Without `rownames = "car"` the labels would vanish on the way in. With it, every downstream `dplyr` or `ggplot2` step can use `car` as a regular column.

### 3. Convert a named list

```r title="A list of equal-length vectors"
lst <- list(year = 2020:2023, sales = c(120, 145, 180, 210))
as_tibble(lst)
#> # A tibble: 4 x 2
#>    year sales
#>   <int> <dbl>
#> 1  2020   120
#> 2  2021   145
#> 3  2022   180
#> 4  2023   210
```

All vectors must have the same length (or length 1 for recycling). Unnamed list elements trigger an error unless you set `.name_repair = "unique"` or `"minimal"`.

### 4. Convert a matrix

```r title="Matrix to tibble preserves column names"
m <- matrix(1:6, nrow = 2, dimnames = list(NULL, c("a", "b", "c")))
as_tibble(m)
#> # A tibble: 2 x 3
#>       a     b     c
#>   <int> <int> <int>
#> 1     1     3     5
#> 2     2     4     6
```

If the matrix has no `dimnames`, `as_tibble()` auto-generates `V1`, `V2`, ... or errors with the default `"check_unique"` repair. Set `.name_repair = "unique"` for matrices that arrive nameless.

### 5. Handle duplicate column names with `.name_repair`

```r title="Auto-suffix duplicates"
df_dup <- data.frame(x = 1:3, x = 4:6, check.names = FALSE)
as_tibble(df_dup, .name_repair = "unique")
#> New names:
#> * `x` -> `x...1`
#> * `x` -> `x...2`
#> # A tibble: 3 x 2
#>   x...1 x...2
#>   <int> <int>
#> 1     1     4
#> 2     2     5
#> 3     3     6
```

The four repair levels trade strictness for convenience. `"check_unique"` is safest for code, `"unique"` is most ergonomic for messy imports, `"minimal"` is rare but useful when you must round-trip duplicate names.

### 6. Convert a named vector (use enframe)

```r title="Use enframe for named vectors"
counts <- c(apple = 3, banana = 5, cherry = 2)
enframe(counts, name = "fruit", value = "count")
#> # A tibble: 3 x 2
#>   fruit  count
#>   <chr>  <dbl>
#> 1 apple      3
#> 2 banana     5
#> 3 cherry     2
```

`as_tibble()` on a bare vector returns a single-column tibble. For the more useful two-column "name, value" shape, reach for `enframe()` instead. Its inverse, `deframe()`, turns a two-column tibble back into a named vector.

## as_tibble() vs as.data.frame() vs tibble()

**The three coercion paths solve different problems.** `as_tibble()` validates names, drops row names by default, and never auto-converts strings to factors. `as.data.frame()` is the base-R workhorse with permissive name handling. `tibble()` builds fresh from vectors rather than coercing an object.

| Behavior | `as_tibble()` | `as.data.frame()` | `tibble()` |
|---|---|---|---|
| Input | Existing object | Existing object | Bare vectors |
| Row names | Dropped or kept via `rownames =` | Always preserved | None |
| Strings to factors | Never | Was default before R 4.0 | Never |
| Duplicate column names | Errors (default) | Mangled or suffixed | Errors |
| List input | Equal-length vectors only | More lenient | Not directly |
| Sequential column refs | N/A (no expressions) | N/A | Allowed |

Decision rule:

- Use `as_tibble()` when you already have a `data.frame`, `list`, or `matrix` and want a tibble.
- Use `tibble()` when you are building columns inline from raw vectors.
- Use `as.data.frame()` only when a downstream function explicitly demands the base class.

[KEY INSIGHT]
**`as_tibble()` is a one-way door into the tidyverse.** Once an object is a tibble, every dplyr verb, every ggplot2 mapping, and every tidyr pivot works without surprise. The function is small but it is the threshold that separates messy base-R objects from a clean, predictable pipeline.

## Common pitfalls

**Pitfall 1: silently losing row names.** Default coercion drops them. If they encode information (state names, gene IDs, time stamps), pass `rownames = "your_column"`.

```r title="Silent drop vs explicit preservation"
# Loses 'state' identity:
as_tibble(USArrests) |> head(2)
#> # A tibble: 2 x 4
#>   Murder Assault UrbanPop  Rape
#>    <dbl>   <int>    <int> <dbl>
#> 1   13.2     236       58  21.2
#> 2   10       263       48  44.5

# Preserves it:
as_tibble(USArrests, rownames = "state") |> head(2)
#> # A tibble: 2 x 5
#>   state   Murder Assault UrbanPop  Rape
#>   <chr>    <dbl>   <int>    <int> <dbl>
#> 1 Alabama   13.2     236       58  21.2
#> 2 Alaska    10       263       48  44.5
```

**Pitfall 2: lists with unequal lengths.** `as_tibble()` recycles length-1 only. Anything else raises a "Tibble columns must have compatible sizes" error.

```r title="Mismatched list lengths"
# This errors:
# as_tibble(list(x = 1:3, y = 1:4))
# Error: Tibble columns must have compatible sizes.

# Fix: pad or trim before coercion
as_tibble(list(x = 1:3, y = c(1:3, NA)))
#> # A tibble: 3 x 2
#>       x     y
#>   <int> <int>
#> 1     1     1
#> 2     2     2
#> 3     3     3
```

The second call shows the standard fix: pad the short side with `NA` (or trim the long side) so all elements share a length.

[WARNING]
**Default `.name_repair = "check_unique"` errors on duplicates.** This is a hard stop, not a warning. If your input source legitimately has duplicate names (a wide format with collision-prone variable codes, for example), set `.name_repair = "unique"` explicitly. Silent acceptance is intentionally unavailable to prevent ambiguous column references downstream.

**Pitfall 3: assuming `as_tibble()` works on every object.** It only handles types with an S3 method: `data.frame`, `list`, `matrix`, `table`, and a few others. Custom classes need `as.data.frame()` first, then `as_tibble()`.

## Try it yourself

**Try it:** Convert the built-in `airquality` dataset to a tibble while preserving the original row numbers as a column called `obs_id`.

```r title="Your turn: convert airquality with row IDs"
# Try it: airquality to tibble, keep row numbers
ex_air <- # your code here

head(ex_air, 3)
#> Expected: 3 rows, 7 columns (obs_id + 6 originals)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_air <- as_tibble(airquality, rownames = "obs_id")
head(ex_air, 3)
#> # A tibble: 3 x 7
#>   obs_id Ozone Solar.R  Wind  Temp Month   Day
#>   <chr>  <int>   <int> <dbl> <int> <int> <int>
#> 1 1         41     190   7.4    67     5     1
#> 2 2         36     118   8       72     5     2
#> 3 3         12     149  12.6    74     5     3
```

**Explanation:** `airquality` uses default integer row names. Passing `rownames = "obs_id"` materializes them as a character column at the front of the tibble, so downstream joins and labels can use them directly.

</details>

## Related tibble functions

After mastering `as_tibble()`, look at:

- `tibble()`: build a tibble column-by-column from raw vectors.
- `tribble()`: build a tibble row-by-row, useful for fixed lookup tables.
- `enframe()`: convert a named vector into a two-column tibble.
- `deframe()`: the inverse, turn a two-column tibble back into a named vector.
- `rownames_to_column()` and `column_to_rownames()`: round-trip row names through a column.
- `is_tibble()`: check whether an object is already a tibble.

For the full coercion reference, the [official as_tibble() documentation](https://tibble.tidyverse.org/reference/as_tibble.html) lists every method, argument, and edge case.

## FAQ

**What is the difference between as_tibble() and tibble() in R?**

`as_tibble()` converts an existing object (a data frame, list, matrix, or another tibble) into a tibble. `tibble()` builds a fresh tibble from raw vectors passed as named arguments. Use `as_tibble()` when you already have data in another container and want to enter the tidyverse. Use `tibble()` when you are constructing a small frame inline, especially when later columns depend on earlier ones. Both return identical tibble objects; only the input differs.

**How do I keep row names when converting to a tibble?**

Pass the `rownames` argument: `as_tibble(mtcars, rownames = "car")`. The argument value becomes the new column name. If you omit it, row names are silently dropped because tibbles do not carry row names by design. For built-in datasets like `mtcars` and `USArrests` where row names encode identity, always set `rownames`. To go the other way later, use `column_to_rownames()`.

**Why does as_tibble() error on duplicate column names?**

The default `.name_repair = "check_unique"` rejects duplicates as a safety measure. Duplicate names make column references ambiguous in `dplyr` and `tidyr`. To accept duplicates, pass `.name_repair = "unique"` (auto-suffixes them as `x...1`, `x...2`) or `"minimal"` (keeps them as-is, only safe if you never reference by name). The error message tells you exactly which names collided.

**Is as_tibble() faster than as.data.frame()?**

For typical sizes (thousands to millions of rows) the difference is negligible because both functions are essentially pointer rewrites of the underlying columns, not data copies. `as_tibble()` does extra name validation, so on pathological inputs (tens of thousands of columns) it can be slower. For everyday work the choice should be about behavior (row-name handling, name repair, type preservation), not speed.

**Can I convert a tibble back to a data.frame?**

Yes, use `as.data.frame(tbl)`. It drops the tibble class and re-creates row names as `1, 2, 3, ...`. You rarely need this because tibbles already inherit from `data.frame`, so any function expecting a data frame accepts a tibble directly. The one case to convert back is when you pass to a function that explicitly checks `class(x) == "data.frame"` or relies on partial column-name matching.
