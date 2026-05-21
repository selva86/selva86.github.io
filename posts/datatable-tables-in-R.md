---
title: "data.table tables() in R: List All data.tables in Memory"
slug: datatable-tables-in-R
description: "data.table tables() lists every data.table in an environment with row, column, MB size and key info. Learn the syntax, sorting tricks, and script use here."
keywords: "data.table tables, tables function R, data.table tables examples, R list data tables, data.table memory inventory, data.table tables order"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "tables()|data.table tables|data.table::tables()|list data.tables|data.table inventory"
auto_link_case_sensitive: true
target_keyword: data.table tables
sibling_block_enabled: true
difficulty: Beginner
---

# data.table tables() in R: List All data.tables in Memory

<p class="lead">data.table <code>tables()</code> prints a one-row-per-table summary of every data.table in an environment, showing name, rows, columns, size in MB and key columns. It is the fastest way to take inventory of an R session before a join, a copy, or a memory cleanup.</p>

[QUICK ANSWER]
tables()                                # list every data.table in the calling env
tables(silent = TRUE)                   # return the summary, suppress printing
tables(order.col = "MB")                # sort by memory footprint
tables(env = .GlobalEnv)                # always scan the global environment
tables(index = TRUE)                    # include secondary INDICES column
tables(width = 120)                     # widen output for long column lists
tables(mb = NULL)                       # drop the MB column from output

[DECISION TREE: Is tables() the right tool?]
- list every data.table with size: tables()
- list every object (any class): ls()
- check size of one object: object.size(x)
- check if one table is keyed: haskey(DT)
- get the key column names: key(DT)
- see column types of one table: str(DT)
- list secondary indexes only: indices(DT)

## What tables() does in one sentence

**tables() is a memory inventory for data.tables.** It scans the chosen environment, finds every object whose class includes data.table, and returns a one row per table summary with NAME, NROW, NCOL, MB, COLS and KEY. The summary is itself a data.table, returned invisibly, while a formatted version is printed to the console for quick reading.

The function is purely diagnostic. It never copies your tables, never sorts them and never changes any attribute. That makes it safe to call inside scripts, R Markdown chunks and package code whenever you want a quick "what is loaded right now" report.

## Syntax

**The signature has six arguments, all optional.** A bare `tables()` call covers most uses.

```r title="tables signature and basic call"
library(data.table)

DT1 <- as.data.table(mtcars)
DT2 <- as.data.table(iris)
setkey(DT2, Species)

tables()
#>      NAME NROW NCOL    MB                                          COLS     KEY
#>    <char> <int> <int> <num>                                        <char>   <char>
#> 1:    DT1   32   11  0.01 mpg,cyl,disp,hp,drat,wt,qsec,vs,am,gear,carb
#> 2:    DT2  150    5  0.01 Sepal.Length,Sepal.Width,Petal.Length,Peta... Species
#> Total: 0MB
```

The arguments worth knowing:

- `mb` controls the size column. The default is fine; pass `NULL` to drop the MB column entirely.
- `order.col` sorts the output. Valid values are `"NAME"` (default), `"NROW"`, `"NCOL"`, `"MB"` and `"KEY"`.
- `env` is the environment to scan. Defaults to `parent.frame()`, the caller's environment.
- `silent = TRUE` returns the summary without printing.
- `index = TRUE` adds an `INDICES` column listing secondary indexes from `setindex()`.
- `width` widens the printed COLS column so long column lists are not truncated.

[NOTE]
**tables() ignores plain data.frames.** Only objects that inherit from `data.table` appear in the output. A `data.frame` from `read.csv()` or a tibble from `readr` will not show up until you wrap it with `as.data.table()` or `setDT()`.

## Examples by use case

**Most real calls fall into four patterns.** Each example below uses built in datasets so you can run it directly in the live editor on this page or in your own R session. The patterns scale from quick interactive checks to programmatic audits inside helper functions and reporting scripts.

A quick session inventory after loading several tables. This is the most common interactive use, often run at the top of an R Markdown chunk or after a long script to confirm what is loaded:

```r title="Inventory after loading several tables"
DT_mt   <- as.data.table(mtcars)
DT_iris <- as.data.table(iris)
DT_air  <- as.data.table(airquality)
setkey(DT_air, Month)

tables()
#>        NAME NROW NCOL    MB                                          COLS    KEY
#>      <char> <int> <int> <num>                                        <char> <char>
#> 1:   DT_air  153    6  0.01 Ozone,Solar.R,Wind,Temp,Month,Day              Month
#> 2:  DT_iris  150    5  0.01 Sepal.Length,Sepal.Width,Petal.Length,Peta...
#> 3:    DT_mt   32   11  0.01 mpg,cyl,disp,hp,drat,wt,qsec,vs,am,gear,carb
```

Sorting by memory to find the largest table first. This is the quickest way to spot a data.table that grew unexpectedly inside a loop or during a `merge()`:

```r title="Sort by size to find memory hogs"
big <- as.data.table(matrix(rnorm(1e5), ncol = 10))
small <- as.data.table(mtcars)

tables(order.col = "MB")
#>      NAME  NROW NCOL    MB                                        COLS    KEY
#>    <char> <int> <int> <num>                                      <char> <char>
#> 1:    big 10000   10  0.76 V1,V2,V3,V4,V5,V6,V7,V8,V9,V10
#> 2:  small    32   11  0.01 mpg,cyl,disp,hp,drat,wt,qsec,vs,am,gear,carb
```

Capturing the result as a data.table for programmatic checks. The `silent = TRUE` flag is the key here: it suppresses the printed banner and returns the summary as a value you can subset, filter, or feed into a test:

```r title="Use silent = TRUE to capture the summary"
inv <- tables(silent = TRUE)
inv[NROW > 1000, NAME]
#> [1] "big"

inv[, sum(MB)]
#> [1] 0.77
```

Scanning a specific environment instead of the caller. This pattern matters when `tables()` is wrapped inside a helper function, because the default `parent.frame()` no longer points at your interactive session:

```r title="Scan the global environment explicitly"
report_tables <- function() {
  tables(env = .GlobalEnv, silent = TRUE)
}

report_tables()[, .(NAME, NROW, NCOL)]
#>        NAME  NROW NCOL
#>      <char> <int> <int>
#> 1:      big 10000   10
#> 2:   DT_air   153    6
#> 3:  DT_iris   150    5
#> 4:    DT_mt    32   11
#> 5:    small    32   11
```

The `env = .GlobalEnv` line matters: inside a function, the default `parent.frame()` is the function's caller, not the global session, so a bare `tables()` may return an empty summary.

## tables() vs ls(), object.size() and str()

**Four functions answer different "what do I have" questions.** Pick by what you need back.

| Function | Returns | Use it to |
|----------|---------|-----------|
| `tables()` | data.table of all data.tables with size and key | Inventory data.tables in one shot |
| `ls()` | Character vector of object names | List every object, any class |
| `object.size(x)` | Size of one object in bytes | Measure a single object |
| `str(DT)` | Compact structure printout | Inspect one table in depth |

Decision rule: use `tables()` when you specifically want the data.table subset of memory and want it sorted, sized and keyed in one printout. Use `ls()` when you also need data.frames, models and lists; pair it with `sapply(ls(), function(n) object.size(get(n)))` for a generic size report. For one specific table you already know the name of, `str(DT)` and `object.size(DT)` are more direct than filtering a `tables()` result.

The keyed output is what makes `tables()` worth typing over `ls()`. Spotting a missing key on a table you expected to join keyed is a one-glance fix instead of a per-table `key(DT)` check, and the MB column saves a separate `object.size()` call per object.

[TIP]
**Add tables() to the bottom of long scripts.** A final `tables(order.col = "MB")` line acts as a free memory audit: you instantly see which tables grew unexpectedly and which keys are missing before a join.

## Common pitfalls

**Three mistakes account for most tables surprises.** Each follows the same root cause: forgetting that the function looks at one specific environment for one specific class, and nothing else.

Calling tables inside a function and getting an empty result. The default `env = parent.frame()` resolves to the function's caller, not your global session. Wrap the call with `env = .GlobalEnv` when you mean the interactive session:

```r title="Right environment for inside-function calls"
audit <- function() {
  cat("Caller env:\n"); print(tables(silent = TRUE)[, .N])
  cat("Global env:\n"); print(tables(env = .GlobalEnv, silent = TRUE)[, .N])
}

DT <- as.data.table(mtcars)
audit()
#> Caller env:
#> [1] 0
#> Global env:
#> [1] 1
```

Forgetting that the return value is invisible. Typing `tables()` at the prompt prints the formatted summary, but `tables()$NAME` returns `NULL` in older versions because the invisible return wraps a print-then-discard step. Assign first, then subset: `inv <- tables(silent = TRUE); inv$NAME`. Using `silent = TRUE` is the explicit, version-safe form.

Expecting plain `data.frame` objects to appear. A `data.frame` from `data.frame()` or `read.csv()` is invisible to `tables()` until you convert it. Use `setDT(df)` for in-place conversion or `as.data.table(df)` for a copy. Conversion is cheap; the inventory benefit is worth the one extra line at load time.

[KEY INSIGHT]
**Treat the MB column as a lower bound for list-column tables.** The size accounting covers the table's own pointers and atomic columns, but not external objects referenced through list columns of nested data, models, or environments. For ordinary tables of atomic columns it matches `object.size(DT)` exactly.

## Try it yourself

**Try it:** Convert `mtcars` and `iris` to data.tables, set a key on `iris`'s `Species` column, then capture the `tables()` summary into `ex_inv` sorted by row count.

```r title="Your turn: capture a sorted inventory"
DT_cars <- as.data.table(mtcars)
DT_flw  <- as.data.table(iris)
# Try it: capture summary into ex_inv, sorted by NROW
ex_inv <- # your code here

ex_inv
#> Expected: 2 rows with NAME and NROW columns; DT_flw before DT_cars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
DT_cars <- as.data.table(mtcars)
DT_flw  <- as.data.table(iris)
setkey(DT_flw, Species)

ex_inv <- tables(order.col = "NROW", silent = TRUE)
ex_inv[, .(NAME, NROW, KEY)]
#>        NAME  NROW     KEY
#>      <char> <int>  <char>
#> 1:  DT_flw   150 Species
#> 2: DT_cars    32
```

**Explanation:** `silent = TRUE` returns the summary instead of just printing it, and `order.col = "NROW"` sorts ascending by row count. Selecting `NAME`, `NROW` and `KEY` produces a focused inventory you can use in checks.

</details>

## Related data.table functions

**These functions pair naturally with tables() when auditing a session.**

- `setDT()` converts a data.frame to a data.table in place, making it visible to `tables()`.
- `as.data.table()` returns a converted copy when in-place conversion is unsafe.
- `key()` reads the key column names from a single data.table.
- `haskey()` returns `TRUE` or `FALSE` for one table.
- `indices()` lists secondary indexes; pass `index = TRUE` to `tables()` to fold them in.
- `setkey()` and `setkeyv()` attach a key that will then appear in the KEY column.

## FAQ

**What does tables() do in data.table?**

`tables()` scans an environment, finds every object that inherits from `data.table`, and returns a one-row-per-table summary with NAME, NROW, NCOL, MB, COLS and KEY. The summary is itself a data.table, returned invisibly, while a formatted version is printed to the console. It is a pure diagnostic: no copying, no sorting and no attribute changes happen to your tables.

**Why does tables() return an empty result?**

Two reasons cover almost every empty result. First, no objects in the scanned environment inherit from the data.table class. Plain data frames and tibbles do not count. Convert them with setDT for an in place change or as.data.table for a copy, then call tables again. Second, you called the function from inside another function, so the default env parent frame resolved to the calling function rather than your interactive session. Passing env equal to the global environment makes tables always scan the session level objects regardless of where the call sits in the call stack.

**How do I sort tables() output by size or row count?**

Use the order col argument. Valid values are NAME which is the default, NROW for row count, NCOL for column count, MB for memory footprint and KEY for tables that have a key set. For example, sorting by MB puts the largest table at the top, which is useful when you suspect a memory leak inside a loop. The sort is ascending; for descending order capture the summary with the silent flag and reorder using normal data.table syntax such as the negative MB pattern. You can chain any other data.table operation on the result the same way.

**Does tables() list data.frames or tibbles?**

No. `tables()` only reports objects whose class includes `data.table`. A plain `data.frame` from `read.csv()` or a tibble from `readr::read_csv()` will not appear in the summary. Convert them with `setDT(df)` for an in-place conversion or `as.data.table(df)` for a safe copy. For a generic listing across all classes, use `ls()` paired with `sapply(ls(), function(n) class(get(n))[1])`.

For the full reference and source, see the [data.table tables documentation](https://rdatatable.gitlab.io/data.table/reference/tables.html).
