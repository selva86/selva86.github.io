---
title: "data.table as.data.table() in R: Convert Objects Fast"
slug: "datatable-as-data-table-in-R"
description: "Use data.table as.data.table() in R to convert data.frames, lists, matrices, and tables. Covers keep.rownames, as.data.table vs setDT, methods, and pitfalls."
keywords: "data.table as.data.table, as.data.table function R, as.data.table examples, convert data.frame to data.table, as.data.table vs setDT, coerce to data.table, as.data.table r"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "as.data.table()|data.table as.data.table|data.table::as.data.table()|coerce to data.table|as.data.table function"
auto_link_case_sensitive: true
target_keyword: "data.table as.data.table"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table as.data.table() in R: Convert Objects Fast

<p class="lead">The <code>as.data.table()</code> function from data.table converts an existing object, a data.frame, list, matrix, table, or vector, into a <code>data.table</code>, returning a fresh copy while leaving the original untouched.</p>

[QUICK ANSWER]
as.data.table(df)                            # data.frame to data.table
as.data.table(my_list)                       # named list to data.table
as.data.table(my_matrix)                     # matrix to data.table
as.data.table(df, keep.rownames = TRUE)      # keep row names as column 'rn'
as.data.table(df, keep.rownames = "id")      # keep row names, name it 'id'
as.data.table(table(x))                      # frequency table to long form
as.data.table(1:5)                           # atomic vector to one-column DT

[DECISION TREE: Is as.data.table() the right tool?]
- convert a copy of any object to a data.table: as.data.table(x)
- convert a data.frame in place, no copy: setDT(df)
- turn a data.table back into a data.frame: setDF(dt)
- read a file straight into a data.table: fread("data.csv")
- stack a list of tables into one data.table: rbindlist(lst)
- check if an object already is a data.table: is.data.table(x)

## What as.data.table() does in one sentence

**`as.data.table()` coerces an object into a `data.table`.** You hand it a data.frame, list, matrix, `table`, or plain vector, and it returns a new `data.table` carrying the same values. The original object is not modified, because `as.data.table()` works on a copy.

That copy behaviour is the single most important thing to know about `data.table as.data.table`. It is a safe, functional converter: nothing changes until you assign the result. Its in-place sibling `setDT()` does the opposite, mutating the object you pass without copying. Choosing between them is the main decision this page helps you make.

## Syntax

**`as.data.table()` is a generic with a method for each input type.** Every method shares two arguments, and the data.frame method adds one more.

```r title="Load data.table and convert a data.frame"
library(data.table)

roster <- data.frame(
  name  = c("Ada", "Linus", "Grace"),
  score = c(91, 78, 88),
  stringsAsFactors = FALSE
)

dt <- as.data.table(roster)
class(dt)
#> [1] "data.table" "data.frame"
```

The arguments you will actually use are:

- `x`: the object to convert. A data.frame, named or unnamed list, matrix, `table`, array, or atomic vector.
- `keep.rownames`: how to treat row names. `FALSE` drops them, `TRUE` saves them in a column called `rn`, and a string uses that string as the column name.
- `key`: an optional column name (or vector of names) to set as the data.table key in the same call.

[NOTE]
**`as.data.table()` does not convert strings to factors.** Unlike `as.data.frame()` on older R versions, character columns stay character. This matches modern R defaults and avoids surprise factor levels.

## Converting different objects

### 1. Convert a named list

A list of equal-length vectors becomes a data.table with one column per element. Element names become column names.

```r title="Convert a named list"
metrics <- list(
  city = c("Oslo", "Lima", "Cairo"),
  temp = c(12, 19, 34)
)
as.data.table(metrics)
#>      city  temp
#>    <char> <num>
#> 1:   Oslo    12
#> 2:   Lima    19
#> 3:  Cairo    34
```

### 2. Convert a matrix

A matrix becomes a data.table with one column per matrix column. Use `keep.rownames` to retain the matrix row names.

```r title="Convert a matrix and keep row names"
m <- matrix(1:6, nrow = 2,
            dimnames = list(c("r1", "r2"), c("a", "b", "c")))
as.data.table(m, keep.rownames = "row")
#>       row     a     b     c
#>    <char> <int> <int> <int>
#> 1:     r1     1     3     5
#> 2:     r2     2     4     6
```

### 3. Convert a frequency table

Passing the output of `table()` reshapes a cross-tabulation into tidy long form: one row per cell, with an `N` count column.

```r title="Convert a table to long form"
freq <- table(mtcars$cyl, mtcars$gear)
as.data.table(freq)
#>        V1     V2     N
#>    <char> <char> <int>
#> 1:      4      3     1
#> 2:      6      3     2
#> 3:      8      3    12
#> 4:      4      4     8
#> 5:      6      4     4
#> 6:      8      4     0
#> 7:      4      5     2
#> 8:      6      5     1
#> 9:      8      5     2
```

### 4. Keep data.frame row names

Many built-in datasets store labels as row names. `keep.rownames` rescues them into a real column so you do not lose them in the conversion.

```r title="Keep mtcars row names as a column"
cars_dt <- as.data.table(mtcars, keep.rownames = "model")
head(cars_dt[, .(model, mpg, cyl)], 3)
#>             model   mpg   cyl
#>            <char> <num> <num>
#> 1:      Mazda RX4  21.0     6
#> 2:  Mazda RX4 Wag  21.0     6
#> 3:     Datsun 710  22.8     4
```

[KEY INSIGHT]
**The result is both a `data.table` and a `data.frame`.** `data.table` inherits from `data.frame`, so every base R function that expects a data frame keeps working. The conversion only adds capability, it never takes any away.

## as.data.table() vs setDT()

**`as.data.table()` copies; `setDT()` converts by reference.** This is the defining difference. `as.data.table()` leaves your original object alone and hands back a new one. `setDT()` rewrites the object in place with no copy, which is faster on large data but mutates what you passed.

```r title="as.data.table leaves the original alone"
orig <- data.frame(x = 1:3)
dt_copy <- as.data.table(orig)
dt_copy[, y := x * 2]
"y" %in% names(orig)
#> [1] FALSE
```

```r title="setDT converts the object itself"
orig2 <- data.frame(x = 1:3)
setDT(orig2)
class(orig2)
#> [1] "data.table" "data.frame"
```

| Feature | `as.data.table()` | `setDT()` |
|---|---|---|
| Original object | Unchanged | Converted in place |
| Memory | Copies the data | No copy |
| Accepts | data.frame, list, matrix, table, vector | data.frame and list only |
| Best for | Matrices, tables, safe pipelines | Large data.frames you own |

Use `as.data.table()` when the input is not a data.frame, when you must keep the original intact, or inside a function that should not surprise its caller. Reach for `setDT()` when you own a large data.frame and want the conversion to cost nothing.

[TIP]
**Inside functions, prefer `as.data.table()`.** A function that calls `setDT()` on its argument silently mutates the caller's variable. Copying with `as.data.table()` keeps the function predictable and side-effect free.

## Common pitfalls

**Pitfall 1: discarding the return value.** Because `as.data.table()` copies, the conversion is lost unless you assign it. Calling it on a line by itself does nothing useful.

```r title="Return value discarded then captured"
df <- data.frame(a = 1:3)
as.data.table(df)        # result thrown away
class(df)
#> [1] "data.frame"

df <- as.data.table(df)  # capture the result
class(df)
#> [1] "data.table" "data.frame"
```

**Pitfall 2: unnamed list elements become V1, V2.** A list with no names produces auto-generated column names. Name the elements before converting.

```r title="Unnamed list gets V1, V2 columns"
as.data.table(list(1:3, 4:6))
#>       V1    V2
#>    <int> <int>
#> 1:     1     4
#> 2:     2     5
#> 3:     3     6
```

**Pitfall 3: row names vanish by default.** `keep.rownames` is `FALSE`, so a data.frame's labels are dropped unless you ask for them.

```r title="Row names dropped without keep.rownames"
plain <- as.data.table(mtcars)
"rn" %in% names(plain)
#> [1] FALSE
```

[WARNING]
**Check `keep.rownames` whenever the source has meaningful row names.** Datasets like `mtcars` carry identifiers as row names. Convert without `keep.rownames` and those labels are gone with no warning.

## Try it yourself

**Try it:** Convert the named list below to a data.table, then set its key on the `id` column in the same call. Save the result to `ex_dt`.

```r title="Your turn: convert a list"
# Try it: list to keyed data.table
people <- list(id = c(3, 1, 2), name = c("C", "A", "B"))
ex_dt <- # your code here

ex_dt
#> Expected: 3 rows, sorted by id
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
people <- list(id = c(3, 1, 2), name = c("C", "A", "B"))
ex_dt <- as.data.table(people, key = "id")
ex_dt
#>       id   name
#>    <num> <char>
#> 1:     1      A
#> 2:     2      B
#> 3:     3      C
```

**Explanation:** Passing `key = "id"` inside `as.data.table()` converts the list and sets the key in one step. Setting a key sorts the data.table by that column, which is why the rows come back in `id` order.

</details>

## Related data.table functions

These functions pair naturally with `as.data.table()` when you build or reshape tables:

- `setDT()`: convert a data.frame or list to a data.table in place, with no copy.
- `setDF()`: the reverse, converting a data.table back to a plain data.frame by reference.
- `fread()`: read a file directly as a data.table, skipping the conversion step entirely.
- `rbindlist()`: stack a list of data.frames or data.tables into one data.table.
- `data.table()`: build a data.table from scratch instead of converting an existing object.

A frequent pattern is `rbindlist(lapply(my_list_of_frames, as.data.table))`, which converts and stacks a collection of data.frames in a single line.

## FAQ

**What is the difference between as.data.table and setDT?**

`as.data.table()` returns a new data.table and leaves the original object untouched, because it works on a copy. `setDT()` converts the object in place by reference, with no copy, so the variable you passed is itself changed. Use `as.data.table()` for safety and for inputs that are not data.frames, such as matrices or tables. Use `setDT()` when you want a fast, zero-copy conversion of a data.frame you own.

**Does as.data.table copy the data?**

Yes. `as.data.table()` always produces a copy, so the object you pass in is never modified. This makes it safe to use inside functions and pipelines where mutating a caller's variable would be a surprise. The trade-off is memory: on a very large data.frame the copy doubles peak usage briefly. If that matters and the input is a data.frame, `setDT()` converts without copying.

**How do I convert a data.frame to a data.table in R?**

Call `as.data.table(your_data_frame)` and assign the result, for example `dt <- as.data.table(df)`. The returned object is a `data.table` that also inherits from `data.frame`, so existing code keeps working. If the data.frame has meaningful row names, add `keep.rownames = TRUE` to save them as a column. For an in-place conversion with no copy, use `setDT(df)` instead.

**Can as.data.table convert a list to a data.table?**

Yes. A named list whose elements are equal-length vectors converts to a data.table with one column per element, using the element names as column names. An unnamed list still converts, but the columns are auto-named `V1`, `V2`, and so on. Lists with elements of differing lengths will error or recycle, so make the vectors the same length first.

**What does keep.rownames do in as.data.table?**

`keep.rownames` controls whether a data.frame's or matrix's row names survive the conversion. The default `FALSE` drops them. Setting it to `TRUE` stores them in a new column named `rn`. Passing a string, such as `keep.rownames = "model"`, stores them in a column with that name. Use it whenever the row names hold real information you do not want to lose.

For the full argument reference, see the [data.table as.data.table documentation](https://rdatatable.gitlab.io/data.table/reference/as.data.table.html).
