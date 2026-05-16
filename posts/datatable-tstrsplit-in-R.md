---
title: "data.table tstrsplit() in R: Split Strings to Columns"
slug: datatable-tstrsplit-in-R
description: "Learn how data.table tstrsplit() in R splits a string column into multiple columns. Covers fixed delimiters, keep, type.convert and fill, with examples."
keywords: "data.table tstrsplit, tstrsplit function R, data.table tstrsplit examples, split column into multiple columns R, tstrsplit vs strsplit, R split string to columns, tstrsplit keep argument"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "tstrsplit()|data.table tstrsplit|data.table::tstrsplit()|split column into multiple columns|transpose strsplit"
auto_link_case_sensitive: true
target_keyword: "data.table tstrsplit"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table tstrsplit() in R: Split Strings to Columns

<p class="lead">data.table <code>tstrsplit()</code> splits a character vector on a delimiter and transposes the result, so each split piece becomes its own column. It is the fastest way to break one column into many inside a data.table.</p>

[QUICK ANSWER]
tstrsplit("a-b-c", "-")                       # split one string to a list
tstrsplit(c("a-1","b-2"), "-")                # split a vector, transposed
DT[, c("x","y") := tstrsplit(col, "-")]       # split into new columns
tstrsplit(x, "-", fixed=TRUE)                 # literal delimiter, safer
tstrsplit(x, "-", keep=c(1,3))                # keep only pieces 1 and 3
tstrsplit(x, "-", type.convert=TRUE)          # auto-convert "1" to integer
tstrsplit(x, "-", fill="")                    # pad short splits with ""

[DECISION TREE: Is tstrsplit() the right tool?]
- split one column into several: DT[, c("a","b") := tstrsplit(x, "-")]
- split but keep pieces grouped: strsplit(x, "-")
- extract a pattern, not split: regmatches(x, regexpr("[0-9]+", x))
- reshape long data to wide: dcast(DT, id ~ key)
- combine columns into a string: paste(a, b, sep = "-")
- pull only the nth piece: tstrsplit(x, "-", keep = 2)

## What tstrsplit() does

**tstrsplit() is a transposing version of strsplit().** Base R's `strsplit()` cuts each string on a delimiter and returns a list with one element per input string. That layout is awkward when you want columns, because the pieces of any single row are bundled together. `tstrsplit()` runs `strsplit()` and then transposes the result, so element one holds every first piece, element two holds every second piece, and so on. That column-shaped list drops straight into a data.table.

The function is built for the `:=` assignment idiom. You pass a column to split, hand the resulting list to a vector of new column names, and data.table adds those columns by reference without copying the table. On a frame with millions of rows this matters: the split happens once and the new columns are written in place.

`tstrsplit()` also forwards extra arguments to `strsplit()`, so options like `fixed` and `perl` work exactly as they do there. On top of that it adds four arguments of its own, `fill`, `type.convert`, `keep`, and `names`, which handle ragged data and tidy up the output.

[KEY INSIGHT]
**The "t" stands for transpose.** `strsplit()` gives you rows of pieces; `tstrsplit()` gives you columns of pieces. Picture splitting `"a-1"` and `"b-2"`: `strsplit()` returns `("a","1")` and `("b","2")`, while `tstrsplit()` returns `("a","b")` and `("1","2")`. The second shape is what a table wants.

## Syntax and arguments

**tstrsplit() takes the vector to split plus split and tidy-up options.** The signature is `tstrsplit(x, ..., fill = NA, type.convert = FALSE, keep, names = FALSE)`. The `...` slot is where the delimiter and any `strsplit()` flags go.

| Argument | Purpose |
|---|---|
| `x` | The character vector (usually a data.table column) to split. |
| `...` | Passed to `strsplit()`: the split pattern, plus `fixed`, `perl`, `useBytes`. |
| `fill` | Value used to pad rows that produce fewer pieces than the longest row. Default `NA`. |
| `type.convert` | If `TRUE`, runs `type.convert()` on each output piece so numeric pieces become numbers. |
| `keep` | Integer positions of the pieces to keep, dropping the rest. |
| `names` | `TRUE`, or a character vector, to name the elements of the returned list. |

The delimiter sits in `...`, not in a named argument, which is why `tstrsplit(x, "-")` works with no argument name. Reach for `keep` when a string has more pieces than you need, and `fill` when rows split into different counts.

## Examples by use case

**Split a plain vector to see the transposed layout.** With no data.table involved, `tstrsplit()` returns a list where each element is one position across all the input strings.

```r title="Split a character vector"
library(data.table)
tstrsplit(c("a-1", "b-2", "c-3"), "-")
#> [[1]]
#> [1] "a" "b" "c"
#>
#> [[2]]
#> [1] "1" "2" "3"
```

**Use it inside `:=` to split one column into several.** This is the canonical use case. Supply a vector of new names on the left and `tstrsplit()` on the right, and data.table writes the columns in place.

```r title="Split a column into new columns"
DT <- data.table(sku = c("RED-LARGE", "BLUE-SMALL", "RED-SMALL"))
DT[, c("color", "size") := tstrsplit(sku, "-", fixed = TRUE)]
DT
#>           sku color   size
#>        <char> <char> <char>
#> 1:  RED-LARGE    RED  LARGE
#> 2: BLUE-SMALL   BLUE  SMALL
#> 3:  RED-SMALL    RED  SMALL
```

**Pass `keep` to pull only the pieces you want.** When a string has more parts than you need, `keep` selects positions and discards the rest, so you do not create columns you will only drop later.

```r title="Keep selected pieces only"
dates <- c("2024-01-15", "2025-06-30", "2023-12-01")
tstrsplit(dates, "-", keep = c(1, 3))
#> [[1]]
#> [1] "2024" "2025" "2023"
#>
#> [[2]]
#> [1] "15" "30" "01"
```

**Combine `fill` and `type.convert` for ragged, mixed data.** When rows split into different counts, `fill` pads the short ones; `type.convert` then converts any all-numeric piece to a proper numeric vector.

```r title="Handle ragged input with fill and type.convert"
parts <- c("item-10-A", "item-5", "item-20-C")
tstrsplit(parts, "-", fill = NA, type.convert = TRUE)
#> [[1]]
#> [1] "item" "item" "item"
#>
#> [[2]]
#> [1] 10  5 20
#>
#> [[3]]
#> [1] "A" NA  "C"
```

Here the middle piece comes back as an integer vector because every value was numeric, while the third piece stays character and gets an `NA` where `"item-5"` had no third part.

## Compare tstrsplit() with alternatives

**tstrsplit() is the column-shaped option; the alternatives differ in output shape and package.** Pick based on whether you want columns, which package you already depend on, and whether you are splitting or extracting.

| Approach | Output | Best for |
|---|---|---|
| `tstrsplit(x, "-")` | Transposed list, one element per piece | Splitting a column into many |
| `strsplit(x, "-")` | List, one element per input string | Keeping a row's pieces grouped |
| `tidyr::separate(df, col, into)` | New tibble columns | tidyverse pipelines |
| `regmatches() + regexpr()` | Matched substrings | Extracting a pattern, not splitting |

The decision rule is short. Inside a data.table, use `tstrsplit()` with `:=`. If you are in a dplyr or tidyr pipeline, `separate()` or its successor `separate_wider_delim()` reads more naturally. Use `regmatches()` only when you want to pull a pattern out rather than cut on a delimiter.

[NOTE]
**Coming from tidyr?** The `tstrsplit()` equivalent is `separate(df, col, into = c("a", "b"), sep = "-")`. Both turn one delimited column into several, but `tstrsplit()` works by reference inside `:=`, while `separate()` returns a new data frame.

## Common pitfalls

**A regex-special delimiter splits in the wrong place.** The delimiter is a regular expression by default, so characters like `.`, `|`, and `+` do not mean what you expect. Splitting on `"."` matches every character.

```r title="Regex delimiter splits wrong"
tstrsplit("a.b.c", ".")
#> [[1]]
#> [1] ""
#> ... every character treated as a split point
```

Add `fixed = TRUE` to treat the delimiter as a literal string: `tstrsplit("a.b.c", ".", fixed = TRUE)` gives the expected three pieces.

**The new-name count must match the piece count.** When you assign with `:=`, the number of names must equal the number of pieces `tstrsplit()` produces, or data.table raises an error.

```r title="Mismatched column count errors"
DT <- data.table(x = c("a-b-c", "d-e-f"))
DT[, c("p", "q") := tstrsplit(x, "-")]
#> Error: Supplied 3 items to be assigned to 2 items of column 'p'
```

**Numbers come back as text.** `type.convert` defaults to `FALSE`, so `tstrsplit("id-42", "-")` returns `"42"` as a character string, not the number 42. Set `type.convert = TRUE` when you need numeric output.

[WARNING]
**Ragged rows silently produce NA, not an error.** If some strings split into fewer pieces than others, `tstrsplit()` pads the gaps with `fill` (NA by default) instead of failing. Check for unexpected `NA` values in your new columns when the source data is inconsistent.

## Try it yourself

**Try it:** Split the `email` column of the data.table below into `user` and `domain` columns on the `@` sign. Save the result to `ex_dt`.

```r title="Your turn: split an email column"
# Try it: split email into user and domain
ex_dt <- data.table(email = c("ann@site.com", "bob@mail.org"))
# your code here

ex_dt
#> Expected: user and domain columns appear
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- data.table(email = c("ann@site.com", "bob@mail.org"))
ex_dt[, c("user", "domain") := tstrsplit(email, "@", fixed = TRUE)]
ex_dt
#>           email user   domain
#>          <char> <char>  <char>
#> 1: ann@site.com    ann site.com
#> 2: bob@mail.org    bob mail.org
```

**Explanation:** `tstrsplit()` cuts each email on `@` and transposes the pieces into two columns. Using `fixed = TRUE` is good practice even though `@` is not a regex metacharacter, and `:=` writes both columns by reference.

</details>

## Related data.table functions

**tstrsplit() pairs with the reshaping and assignment tools in data.table.** Learning the neighbours makes string-heavy cleaning tasks far quicker.

- `strsplit()` is the base R function `tstrsplit()` wraps; use it when you want pieces grouped per row.
- `melt()` reshapes wide data to long format, often a step before or after splitting.
- `dcast()` reshapes long data to wide, the reverse direction.
- `setnames()` renames the new columns `tstrsplit()` creates if the defaults are not what you want.

For a fuller picture of how data.table's by-reference style compares with the tidyverse, see the [data.table vs dplyr](data-table-vs-dplyr.html) comparison. The official [data.table reference](https://rdatatable.gitlab.io/data.table/reference/tstrsplit.html) documents every argument.

## FAQ

**What does tstrsplit() do in R?**

`tstrsplit()` splits a character vector on a delimiter and transposes the result. Where base R's `strsplit()` returns a list with one element per input string, `tstrsplit()` returns a list with one element per split position. That column-shaped output is what you need to break one data.table column into several. It is shorthand for `transpose(strsplit(...))` with extra options for padding and type conversion.

**How do I split a column into multiple columns with tstrsplit?**

Use the `:=` operator: `DT[, c("a", "b") := tstrsplit(col, "-")]`. The left side lists the new column names, and the right side splits the source column. data.table writes the new columns by reference, so no copy of the table is made. The number of names must match the number of pieces each string produces, or you get an error.

**What is the difference between tstrsplit and strsplit?**

Both cut strings on a delimiter, but the output shape differs. `strsplit()` returns one list element per input string, so a row's pieces stay grouped together. `tstrsplit()` transposes that, returning one list element per piece position, so all first pieces are together, all second pieces are together, and so on. Use `tstrsplit()` for columns and `strsplit()` when you want per-row groups.

**Why does tstrsplit return text instead of numbers?**

By default `type.convert` is `FALSE`, so every piece comes back as a character string even when it looks numeric. Set `type.convert = TRUE` to have `tstrsplit()` convert each piece to its natural type, turning `"42"` into the integer 42. Without it, you would need to coerce the new columns yourself with `as.integer()` or `as.numeric()`.

**How does tstrsplit handle rows with different numbers of pieces?**

It pads the short rows using the `fill` argument, which defaults to `NA`. If `"a-b-c"` and `"a-b"` are split together, the second string's missing third piece becomes `NA`. No error is raised, so inconsistent input fails quietly. Set `fill = ""` to pad with empty strings instead, and always check the new columns for unexpected `NA` values.
