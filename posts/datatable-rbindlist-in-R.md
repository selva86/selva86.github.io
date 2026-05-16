---
title: "data.table rbindlist() in R: Bind Lists of Tables by Row"
slug: "datatable-rbindlist-in-R"
description: "Use data.table rbindlist() in R to combine a list of data tables or data frames by row. Covers fill, idcol, use.names, and rbindlist vs rbind with examples."
keywords: "data.table rbindlist, rbindlist function R, data.table rbindlist examples, rbindlist R combine data tables, rbindlist vs rbind, rbindlist fill, combine list of data tables R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "rbindlist()|data.table rbindlist|data.table::rbindlist()|rbindlist|rbindlist function|combine list of data tables"
auto_link_case_sensitive: true
target_keyword: "data.table rbindlist"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table rbindlist() in R: Bind Lists of Tables by Row

<p class="lead">The <code>rbindlist()</code> function from data.table stacks a list of data tables, data frames, or lists into one <code>data.table</code> by row, far faster than calling <code>rbind()</code> repeatedly.</p>

[QUICK ANSWER]
rbindlist(list(dt1, dt2))              # stack two tables by row
rbindlist(my_list)                     # stack every table in a list
rbindlist(parts, fill = TRUE)          # pad missing columns with NA
rbindlist(parts, use.names = TRUE)     # match columns by name
rbindlist(parts, idcol = "source")     # tag each row with its origin
rbindlist(lapply(files, fread))        # read and stack many files
rbindlist(list(dt1, NULL, dt2))        # NULL entries are skipped

[DECISION TREE: Is rbindlist() the right tool?]
- stack many tables by row: rbindlist(list_of_tables)
- add columns side by side: cbind(dt1, dt2)
- join tables on a shared key: merge(dt1, dt2, by = "id")
- read and combine many files: rbindlist(lapply(files, fread))
- reshape long format to wide: dcast(dt, id ~ key)
- count distinct values fast: uniqueN(dt$col)

## What rbindlist() does in one sentence

**`rbindlist()` turns a list of many tables into one.** You hand it a list whose elements are data.tables, data.frames, or plain lists, and it returns a single `data.table` with every input stacked vertically. It is the list-aware counterpart of base R `rbind()`, built for the case where you have a variable number of objects to combine.

The reason `data.table rbindlist` exists is speed and convenience. Binding rows one pair at a time with `rbind()` copies the growing result on every step, which becomes slow for many tables. `rbindlist()` measures the total size once, allocates the result in C, and fills it in a single pass. It also handles mismatched columns, tracks which row came from which input, and silently skips `NULL` elements.

## Syntax

**`rbindlist()` takes a list plus four optional controls.** Only the list is required; the rest tune how mismatched inputs are handled.

```r title="Load data.table and stack two tables"
library(data.table)

q1 <- data.table(month = c("Jan", "Feb"), sales = c(100, 150))
q2 <- data.table(month = c("Mar", "Apr"), sales = c(120, 180))

rbindlist(list(q1, q2))
#>     month sales
#>    <char> <num>
#> 1:    Jan   100
#> 2:    Feb   150
#> 3:    Mar   120
#> 4:    Apr   180
```

The full signature is `rbindlist(l, use.names = "check", fill = FALSE, idcol = NULL)`. Its arguments are:

- `l`: a list of data.tables, data.frames, or lists to stack. The only required argument.
- `use.names`: `TRUE` binds columns by matching name, `FALSE` binds by position, `"check"` (the default) warns on a mismatch then binds by position.
- `fill`: `TRUE` pads missing columns with `NA` so inputs need not share the same columns.
- `idcol`: adds a column naming the source element. `TRUE` calls it `.id`; a string sets a custom name.

[TIP]
**Set `use.names = TRUE` whenever column order is not guaranteed.** The default `"check"` only warns and then binds by position, which can interleave the wrong columns. Binding by name is safe and the cost is negligible.

## Binding data: four common patterns

### 1. Fill missing columns with fill = TRUE

**Inputs rarely have identical columns in real pipelines.** When one table has a column another lacks, `fill = TRUE` pads the gap with `NA` instead of erroring.

```r title="Stack tables with different columns"
east <- data.table(region = "East", units = c(120, 60))
west <- data.table(region = "West", units = c(85, 200), returns = c(3, 7))

rbindlist(list(east, west), fill = TRUE)
#>    region units returns
#>    <char> <num>   <num>
#> 1:   East   120      NA
#> 2:   East    60      NA
#> 3:   West    85       3
#> 4:   West   200       7
```

Setting `fill = TRUE` also turns on `use.names = TRUE` automatically, since filling by position would be meaningless.

### 2. Track the source with idcol

**`idcol` records which list element each row came from.** This is invaluable when you stack files, groups, or scenarios and need to know the origin later.

```r title="Tag rows with their source"
stores <- list(
  downtown = data.table(item = c("A", "B"), qty = c(5, 9)),
  airport  = data.table(item = c("A", "C"), qty = c(2, 7))
)

rbindlist(stores, idcol = "store")
#>       store   item   qty
#>      <char> <char> <num>
#> 1: downtown      A     5
#> 2: downtown      B     9
#> 3:  airport      A     2
#> 4:  airport      C     7
```

When the list has names, those names fill the id column. An unnamed list gets integers `1:length(l)` instead.

### 3. Match columns by name with use.names

**Tables built in different column orders bind correctly only by name.** Pass `use.names = TRUE` so each column lands under its own header.

```r title="Bind columns by name, not position"
a <- data.table(x = 1:2, y = c("p", "q"))
b <- data.table(y = c("r", "s"), x = 3:4)

rbindlist(list(a, b), use.names = TRUE)
#>        x      y
#>    <int> <char>
#> 1:     1      p
#> 2:     2      q
#> 3:     3      r
#> 4:     4      s
```

Without `use.names = TRUE`, table `b` would bind by position and mix the `x` and `y` values.

### 4. Stack a list built by lapply

**The classic use case is a list produced by `lapply()`.** Any function that returns one table per call pairs naturally with `rbindlist()`.

```r title="Combine a list from lapply"
make_part <- function(n) data.table(id = seq_len(n), size = n)
parts <- lapply(c(2, 3), make_part)

rbindlist(parts, idcol = "source")
#>    source    id  size
#>     <int> <int> <num>
#> 1:      1     1     2
#> 2:      1     2     2
#> 3:      2     1     3
#> 4:      2     2     3
#> 5:      2     3     3
```

[KEY INSIGHT]
**Think of `rbindlist()` as the reduce step of a split-apply pipeline.** You split work into a list, apply a function to each piece with `lapply()`, then collapse the list back to one table. That `lapply()` then `rbindlist()` rhythm is the most common data.table pattern for processing many files or groups.

## rbindlist() vs rbind() and do.call(rbind, ...)

**All three stack rows, but they differ in speed and flexibility.** Base `rbind()` joins objects passed as separate arguments. `do.call(rbind, list)` adapts `rbind()` to a list. `rbindlist()` is purpose-built for lists and is the fastest of the three.

```r title="Compare rbindlist with do.call rbind"
parts <- list(q1, q2)

identical(
  as.data.frame(rbindlist(parts)),
  as.data.frame(do.call(rbind, parts))
)
#> [1] TRUE
```

| Feature | `rbindlist()` | `rbind()` | `do.call(rbind, l)` |
|---|---|---|---|
| Input shape | a list | separate arguments | a list |
| Speed on many tables | Fastest | Slow | Slow |
| Fill missing columns | `fill = TRUE` | No | No |
| Source id column | `idcol` | No | No |
| Return type | data.table | matches input | matches input |

Use `rbindlist()` whenever the objects already sit in a list, or when there are more than a handful to combine. Reach for `rbind()` only for a quick two-object stack written inline.

[NOTE]
**Coming from Python pandas?** The equivalent of `rbindlist(list(dt1, dt2))` is `pandas.concat([df1, df2])`. The `fill = TRUE` behaviour matches pandas aligning columns by name and inserting `NaN` for gaps.

## Common pitfalls

**Pitfall 1: mismatched columns error without fill.** If inputs have different column counts and you forget `fill = TRUE`, `rbindlist()` stops rather than guessing.

```r title="Column mismatch error and the fix"
rbindlist(list(east, west))
#> Error: Item 2 has 3 columns, inconsistent with item 1 which has 2 columns.
#> To fill missing columns use fill=TRUE.

# Fix: allow padding
nrow(rbindlist(list(east, west), fill = TRUE))
#> [1] 4
```

**Pitfall 2: the default binds by position, not name.** `use.names = "check"` only warns on a name mismatch, then proceeds positionally. A silently reordered column is worse than an error, so set `use.names = TRUE` explicitly.

**Pitfall 3: the result is always a data.table.** Even if every input is a plain `data.frame`, `rbindlist()` returns a `data.table`. Wrap the result in `as.data.frame()` if downstream code depends on data frame behaviour.

[WARNING]
**Never trust the default `use.names` on tables from different sources.** Files exported by different tools, or tables built in separate functions, often carry columns in different orders. Binding them by position quietly mixes values, and the error surfaces only much later as nonsense numbers.

## Try it yourself

**Try it:** Stack the two data tables below. They have different columns, so use `fill = TRUE`, and add a source column named `quarter` with `idcol`. Save the result to `ex_bound`.

```r title="Your turn: rbindlist with fill and idcol"
# Try it: bind a named list with fill and idcol
parts <- list(
  q1 = data.table(month = "Jan", sales = 100),
  q2 = data.table(month = "Feb", sales = 150, refunds = 5)
)
ex_bound <- # your code here

ex_bound
#> Expected: 2 rows, columns quarter, month, sales, refunds
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bound <- rbindlist(parts, fill = TRUE, idcol = "quarter")
ex_bound
#>    quarter  month sales refunds
#>     <char> <char> <num>   <num>
#> 1:      q1    Jan   100      NA
#> 2:      q2    Feb   150       5
```

**Explanation:** `fill = TRUE` pads the missing `refunds` column in `q1` with `NA`, and `idcol = "quarter"` adds a column carrying each list element's name. Together they handle ragged inputs without losing track of where rows came from.

</details>

## Related data.table functions

These functions pair naturally with `rbindlist()` when reshaping or combining data:

- `fread()`: the fast file reader; `rbindlist(lapply(files, fread))` reads and stacks a folder of files.
- `merge()`: joins two tables on a shared key, the column-wise counterpart to row binding.
- `melt()`: reshapes a wide table to long format, often before stacking.
- `setDT()`: converts a data.frame to a data.table in place.
- `uniqueN()`: counts distinct values, handy for checking a stacked result.

## FAQ

**What is the difference between rbind and rbindlist in R?**

`rbind()` takes objects as separate arguments and stacks them; `rbindlist()` takes a single list of objects. For a variable or large number of tables, `rbindlist()` is far faster because it allocates the result once instead of copying a growing object on every bind. `rbindlist()` also adds features `rbind()` lacks, namely `fill` for ragged columns and `idcol` for source tracking.

**How do I combine a list of data frames in R?**

Pass the list straight to `rbindlist()`: `rbindlist(my_list_of_dfs)`. It accepts data.frames, data.tables, and plain lists, and always returns a `data.table`. If the data frames have different columns, add `fill = TRUE`. If they were built in different column orders, add `use.names = TRUE` so columns align by name rather than position.

**Does rbindlist work with data frames?**

Yes. Each element of the input list can be a `data.table`, a `data.frame`, or a plain `list`, and you can mix types within one call. Regardless of input, the output is always a `data.table`. If you need a plain data frame back, wrap the call in `as.data.frame()`.

**How do I add a column showing which table each row came from?**

Use the `idcol` argument: `rbindlist(my_list, idcol = "source")`. If the input list is named, those names become the values in the new column. If it is unnamed, the column holds integers `1` to `length(l)`. Passing `idcol = TRUE` names the column `.id` by default.

**Why does rbindlist say columns are inconsistent?**

The inputs have different numbers of columns and `fill` is `FALSE`. `rbindlist()` refuses to guess how to align them and stops. Add `fill = TRUE` to pad missing columns with `NA`, which also enables binding by name so the columns line up correctly.

For the official argument reference, see the [data.table rbindlist documentation](https://rdatatable.gitlab.io/data.table/reference/rbindlist.html).
