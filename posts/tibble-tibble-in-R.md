---
title: "tibble tibble() in R: Build Tibbles Column by Column"
slug: "tibble-tibble-in-R"
description: "Build modern data frames in R with tibble() from the tibble package. Learn syntax, examples, recycling rules, comparisons with data.frame(), and pitfalls."
keywords: "tibble tibble, tibble() function R, create tibble in R, tibble package R, tibble vs data.frame, R tibble examples, tibble package"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "tibble()|tibble package|tibble::tibble()|create tibble|build tibble"
auto_link_case_sensitive: true
target_keyword: "tibble tibble"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble tibble() in R: Build Tibbles Column by Column

<p class="lead">The <code>tibble()</code> function in the tibble package builds modern data frames column-by-column from named vectors, with stricter rules and cleaner printing than <code>data.frame()</code>.</p>

[QUICK ANSWER]
tibble(x = 1:3, y = c("a","b","c"))     # by column
tibble(x = 1:3, y = x * 2)              # refer to prior col
tibble(x = 1, y = 1:4)                  # length-1 recycles
tibble(.rows = 5)                       # empty with N rows
tibble(`bad col` = 1:3)                 # back-ticked names
tibble(z = list(1:2, 1:3, 1:5))         # list-column
as_tibble(mtcars, rownames = "car")     # promote a data.frame

[DECISION TREE: Is tibble() the right tool?]
- create a tibble column-by-column: tibble(x = 1:3, y = letters[1:3])
- convert an existing data.frame: as_tibble(df)
- build row-by-row in code: tribble(~x, ~y, 1, "a", 2, "b")
- convert a named vector to a tibble: enframe(c(a=1, b=2))
- add columns to an existing tibble: add_column(df, z = 1:3)
- add rows to an existing tibble: add_row(df, x = 4, y = "d")
- inspect a tibble structure: glimpse(df)

## What tibble() does in one sentence

**`tibble()` builds a data frame column-by-column.** You pass named vectors of the same length (or length 1 for recycling), and the function returns a tibble: a stricter, better-printing variant of `data.frame`. Unlike base R, it never converts strings to factors, never matches column names by prefix, and never auto-creates row names.

When you reach for `tibble()`, you usually want one of three things. Build a small data frame inline from raw vectors. Prototype a wider transformation step. Or hand off cleaner output to ggplot2 and dplyr. All three are first-class, which is why the tidyverse uses tibbles as its default frame type.

## Syntax

**`tibble()` accepts named expressions and a few control arguments.** Each named expression becomes a column. Later columns can refer to earlier ones in the same call.

```r title="Load tibble and build a small frame"
library(tibble)

t1 <- tibble(
  id    = 1:3,
  name  = c("Ana", "Bo", "Cy"),
  score = c(91, 85, 78)
)
t1
#> # A tibble: 3 x 3
#>      id name  score
#>   <int> <chr> <dbl>
#> 1     1 Ana      91
#> 2     2 Bo       85
#> 3     3 Cy       78
```

The full signature is:

```
tibble(..., .rows = NULL, .name_repair = "check_unique")
```

- `...` is one or more `name = vector` pairs.
- `.rows` sets the row count when no vectors are supplied (for empty-shell frames).
- `.name_repair` controls how duplicate or empty column names are handled: `"check_unique"` (default, errors on duplicates), `"unique"` (deduplicates), `"minimal"` (keeps as-is), or `"universal"` (also fixes syntax).

The return value has class `c("tbl_df", "tbl", "data.frame")`, so any function expecting a data frame still works on it.

[TIP]
**Refer to columns you just declared.** Inside `tibble()`, later arguments can use names defined earlier in the same call: `tibble(x = 1:3, y = x * 2)` is valid. This works because tibble evaluates arguments lazily, in order, in the local frame.

## Six common patterns

### 1. Build from named vectors

```r title="Three columns, three rows"
tibble(
  city   = c("Pune", "Oslo", "Lima"),
  temp_c = c(34, 8, 22),
  rainy  = c(FALSE, TRUE, FALSE)
)
#> # A tibble: 3 x 3
#>   city  temp_c rainy
#>   <chr>  <dbl> <lgl>
#> 1 Pune      34 FALSE
#> 2 Oslo       8 TRUE
#> 3 Lima      22 FALSE
```

### 2. Use a prior column inside the same call

```r title="Compute one column from another"
tibble(
  radius = c(1, 2, 3, 5),
  area   = pi * radius^2
)
#> # A tibble: 4 x 2
#>   radius  area
#>    <dbl> <dbl>
#> 1      1  3.14
#> 2      2 12.6
#> 3      3 28.3
#> 4      5 78.5
```

This sequential evaluation is the most-cited reason to prefer `tibble()` over `data.frame()`.

### 3. Recycle length-1 values

```r title="Length-1 vectors get recycled"
tibble(
  group = "A",
  obs   = 1:4,
  score = c(0.2, 0.5, 0.7, 0.9)
)
#> # A tibble: 4 x 3
#>   group   obs score
#>   <chr> <int> <dbl>
#> 1 A         1   0.2
#> 2 A         2   0.5
#> 3 A         3   0.7
#> 4 A         4   0.9
```

`group = "A"` is recycled to length 4 to match the other columns. Any other length mismatch (length 2 paired with length 4, for example) errors.

### 4. List-columns for nested data

```r title="A column whose cells are vectors"
tibble(
  id           = 1:3,
  measurements = list(
    c(1.1, 1.2),
    c(2.3, 2.4, 2.5),
    c(3.6)
  )
)
#> # A tibble: 3 x 2
#>      id measurements
#>   <int> <list>
#> 1     1 <dbl [2]>
#> 2     2 <dbl [3]>
#> 3     3 <dbl [1]>
```

List-columns are first-class in tibbles. They cleanly hold ragged data, nested models, or any object you want stored per row.

### 5. Empty shell with a row count

```r title="Build an empty 5-row scaffold"
tibble(.rows = 5)
#> # A tibble: 5 x 0
```

Useful when you want to assemble columns one at a time with `add_column()` or `mutate()`.

### 6. Allow non-syntactic column names

```r title="Spaces and special chars need back-ticks"
tibble(
  `country code`      = c("IN", "NO", "PE"),
  `gdp_2024 (B USD)`  = c(3568, 549, 251)
)
#> # A tibble: 3 x 2
#>   `country code` `gdp_2024 (B USD)`
#>   <chr>                       <dbl>
#> 1 IN                          3568
#> 2 NO                           549
#> 3 PE                           251
```

`tibble()` keeps these names exactly. `data.frame()` would mangle them via `make.names()` unless you pass `check.names = FALSE`.

## tibble() vs data.frame()

**`tibble()` enforces stricter, more predictable rules.** That predictability is the real value. No surprise type conversions, no silent recycling, no prefix matching, no row-name magic. The cost is a small learning curve for anyone arriving from base R workflows.

| Behavior | `tibble()` | `data.frame()` |
|---|---|---|
| Strings to factors | Never | Was default before R 4.0 |
| Column names | Preserved | Mangled by `make.names()` |
| Recycling | Length 1 only | Any divisor of N |
| Refer to prior col | Allowed | Errors |
| Row names | None | Always present |
| Partial matching | No | `df$na` matches `name` |
| Printing | First 10 rows, fitted width | Full frame, all columns |

When to use which:

- Use `tibble()` for tidyverse pipelines, interactive analysis, and any code that will be read by someone else later.
- Use `data.frame()` when you need legacy compatibility (older packages that rely on row names) or zero tidyverse dependencies.

[KEY INSIGHT]
**The strictness is a feature, not a tax.** Most "weird" base-R issues, name mangling, factor surprises, partial matching, simply vanish once your pipeline starts with a tibble. Strictness costs nothing for new code and saves debugging time on the rare day base R rules bite you.

## Common pitfalls

**Pitfall 1: vector length mismatch.** `tibble()` recycles only length-1 vectors. Anything else errors.

```r title="Length-3 and length-4 are incompatible"
# This would error:
# tibble(x = 1:3, y = 1:4)
# Error: Tibble columns must have compatible sizes.

# Fix: match lengths, or use length 1
tibble(x = 1:3, y = 0)
#> # A tibble: 3 x 2
#>       x     y
#>   <int> <dbl>
#> 1     1     0
#> 2     2     0
#> 3     3     0
```

**Pitfall 2: forgetting `as_tibble()` for existing frames.** `tibble()` builds fresh from vectors. To promote a `data.frame` to a tibble, use `as_tibble()`.

```r title="Promote mtcars to a tibble"
as_tibble(mtcars, rownames = "car") |> head(3)
#> # A tibble: 3 x 12
#>   car             mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>         <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Mazda RX4      21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2 Mazda RX4 Wag  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3 Datsun 710     22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
```

[WARNING]
**Duplicate column names error by default.** `tibble(x = 1, x = 2)` raises an error because `.name_repair = "check_unique"` blocks it. Pass `.name_repair = "minimal"` to keep duplicates intentionally, or `"unique"` to auto-suffix them.

**Pitfall 3: expecting row names.** Tibbles do not carry row names. If your workflow depends on them (heatmaps keyed off `rownames`, for example), use `rownames_to_column()` first to preserve them as a real column before converting.

## Try it yourself

**Try it:** Build a tibble named `ex_grades` with three students (`Aki`, `Mei`, `Sol`), their scores (`88`, `75`, `92`), and a `grade` column computed as `"A"` if score is at least 85, else `"B"`.

```r title="Your turn: build a grades tibble"
# Try it: 3 students with computed grade
ex_grades <- # your code here

ex_grades
#> Expected: 3 rows, 3 columns (name, score, grade)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grades <- tibble(
  name  = c("Aki", "Mei", "Sol"),
  score = c(88, 75, 92),
  grade = ifelse(score >= 85, "A", "B")
)
ex_grades
#> # A tibble: 3 x 3
#>   name  score grade
#>   <chr> <dbl> <chr>
#> 1 Aki      88 A
#> 2 Mei      75 B
#> 3 Sol      92 A
```

**Explanation:** Inside `tibble()`, the `grade` column can reference `score` because columns evaluate in declaration order. `ifelse()` is vectorized, so it produces one value per row.

</details>

## Related tibble functions

After mastering `tibble()`, look at:

- `as_tibble()`: convert a data.frame, matrix, or list into a tibble.
- `tribble()`: build a tibble row-by-row, useful for fixed lookup tables.
- `enframe()`: convert a named vector into a two-column tibble.
- `add_row()` and `add_column()`: append rows or columns to an existing tibble.
- `glimpse()`: print a tibble structure horizontally, one line per column.

For the package as a whole, the [official tibble reference](https://tibble.tidyverse.org/) lists every constructor, helper, and option.

## FAQ

**What is the difference between tibble and data.frame in R?**

A tibble is a data.frame with stricter rules and nicer printing. It never converts strings to factors, never mangles column names, never auto-creates row names, and only recycles length-1 vectors. Printing shows the first 10 rows and only the columns that fit the console width, with a class summary at the top. Every tibble inherits from `data.frame`, so any function that expects a data.frame still works.

**Do I need the tibble package or is it in tidyverse?**

Both work. `library(tibble)` loads only `tibble()`, `as_tibble()`, and related helpers. `library(tidyverse)` loads tibble along with dplyr, ggplot2, tidyr, and the rest in one call. For lightweight scripts or package code, importing only tibble keeps the dependency footprint small.

**How do I convert a data.frame to a tibble?**

Use `as_tibble()`: `as_tibble(mtcars)`. Pass `rownames = "name_of_col"` to keep row names as a real column: `as_tibble(mtcars, rownames = "car")`. The reverse direction, `as.data.frame(tbl)`, drops the tibble class, but you rarely need it because tibbles already behave as data frames.

**Can a tibble have duplicate column names?**

By default no. `tibble()` uses `.name_repair = "check_unique"`, which errors on duplicates. Pass `.name_repair = "minimal"` to keep duplicates intentionally (useful when you round-trip data from a system that allows them), or `"unique"` to auto-suffix the dupes.

**Why does tibble print only 10 rows?**

To prevent runaway console output. Use `print(tbl, n = 100)` to show more, or set per-session defaults with `options(tibble.print_max = 50, tibble.print_min = 20)`. The compact default is one of the main reasons interactive users prefer tibbles over base data frames.
