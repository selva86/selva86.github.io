---
title: "data.table haskey() in R: Check If a Table Has a Key"
slug: datatable-haskey-in-R
description: "data.table haskey() returns TRUE if a data.table has a key, FALSE if not. Learn syntax, guard-clause examples, and how it differs from key() and setkey()."
keywords: "data.table haskey, haskey function R, data.table haskey examples, R data.table key check, check data.table key, haskey vs key"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "haskey()|data.table haskey|data.table::haskey()|check data.table key|haskey function"
auto_link_case_sensitive: true
target_keyword: data.table haskey
sibling_block_enabled: true
difficulty: Beginner
---

# data.table haskey() in R: Check If a Table Has a Key

<p class="lead">data.table <code>haskey()</code> returns <code>TRUE</code> if a data.table has a key set and <code>FALSE</code> if it does not. It is the fast, side-effect-free way to test key status before a keyed join or subset.</p>

[QUICK ANSWER]
haskey(DT)                          # TRUE if DT has a key set
key(DT)                             # the key column names, or NULL
setkey(DT, id)                      # set a key on column id
setkey(DT, NULL)                    # remove the key
if (!haskey(DT)) setkey(DT, id)     # set the key only if missing
haskey(as.data.table(mtcars))       # FALSE for a freshly built table
indices(DT)                         # secondary indexes (haskey ignores these)

[DECISION TREE: Is haskey() the right tool?]
- check whether a table is keyed: haskey(DT)
- get the key column names: key(DT)
- set or change the key: setkey(DT, col)
- check for a secondary index: indices(DT)
- remove the key entirely: setkey(DT, NULL)
- order rows without keying: setorder(DT, col)

## What haskey() does in one sentence

**haskey() is a yes/no key probe.** It takes one data.table and returns a single logical value: `TRUE` when a primary key is attached, `FALSE` when none is. Internally it is just `!is.null(key(x))`, so it never sorts, copies, or modifies your table. That makes it cheap to call inside loops, package code, and assertions.

A key in data.table is an attribute recording which columns the table is sorted by. Keyed tables support fast binary-search joins and the `DT[.(value)]` subset syntax. Before you rely on either, `haskey()` tells you whether the key you expect is actually present.

## Syntax

**The signature has one argument.** You pass a data.table and get a logical back.

```r title="haskey signature and basic call"
library(data.table)

DT <- as.data.table(mtcars)
haskey(DT)
#> [1] FALSE

setkey(DT, cyl)
haskey(DT)
#> [1] TRUE
```

`haskey(x)` accepts a single object `x`. A freshly built data.table has no key, so `haskey()` returns `FALSE` until you call `setkey()` or `setkeyv()`. There are no other arguments and no options to configure.

[NOTE]
**haskey() never errors on a plain data frame.** Passing a `data.frame` or other object returns `FALSE` rather than raising an error, because no `sorted` attribute exists. Treat a `FALSE` result as "not keyed", not as proof the input is a data.table.

## Examples by use case

**Most real uses fall into four patterns.** Each example below uses a built-in dataset so you can run it directly.

A direct check on a converted table:

```r title="Check key status after conversion"
DT <- as.data.table(iris)
haskey(DT)
#> [1] FALSE

setkey(DT, Species)
haskey(DT)
#> [1] TRUE
```

A guard clause that sets a key only when one is missing, which avoids re-sorting an already-keyed table:

```r title="Set the key only when missing"
sales <- as.data.table(data.frame(id = c(3L, 1L, 2L), amt = c(30, 10, 20)))

if (!haskey(sales)) setkey(sales, id)

haskey(sales)
#> [1] TRUE
sales[.(2L)]
#>    id amt
#> 1:  2  20
```

Comparing `haskey()` with `key()` to see what each returns:

```r title="haskey versus key return values"
DT <- as.data.table(mtcars)
haskey(DT)   # logical
#> [1] FALSE
key(DT)      # character vector or NULL
#> NULL

setkey(DT, gear, carb)
haskey(DT)
#> [1] TRUE
key(DT)
#> [1] "gear" "carb"
```

Confirming that a secondary index does not count as a key:

```r title="Secondary index is not a key"
DT <- as.data.table(mtcars)
setindex(DT, gear)

haskey(DT)
#> [1] FALSE
indices(DT)
#> [1] "gear"
```

## haskey() vs key(), setkey() and indices()

**Four functions touch keys, and each answers a different question.** Pick by what you need back.

| Function | Returns | Use it to |
|----------|---------|-----------|
| `haskey(DT)` | `TRUE` / `FALSE` | Test whether any key exists |
| `key(DT)` | Character vector or `NULL` | Read which columns form the key |
| `setkey(DT, col)` | Invisibly, the table | Set or remove the key (sorts the data) |
| `indices(DT)` | Character vector or `NULL` | List secondary indexes, not the key |

Decision rule: use `haskey()` for a boolean branch, and `key()` when you need the column names themselves. `haskey()` is the cheaper call when the names do not matter.

[TIP]
**Combine haskey() with stopifnot() for defensive code.** Inside a function that depends on a keyed join, `stopifnot(haskey(dt))` fails fast with a clear message instead of returning silently wrong results from an unkeyed subset.

## Common pitfalls

**Three mistakes account for most haskey() bugs.**

Treating the return value as column names. `haskey()` gives a logical, never a string, so comparing it to a column name never matches:

```r title="Logical result, not a column name"
DT <- as.data.table(mtcars)
setkey(DT, cyl)

# WRONG: haskey() is TRUE/FALSE, not "cyl"
if (identical(haskey(DT), "cyl")) "keyed by cyl" else "no match"
#> [1] "no match"

# RIGHT: compare key() for the column names
if (identical(key(DT), "cyl")) "keyed by cyl" else "no match"
#> [1] "keyed by cyl"
```

Expecting `haskey()` to detect secondary indexes. A table built with `setindex()` but no `setkey()` returns `FALSE`; check `indices()` for those. Finally, remember that subsetting with `DT[order(...)]` or `setorder()` reorders rows without setting a key, so `haskey()` still returns `FALSE` afterward.

## Try it yourself

**Try it:** Convert `airquality` to a data.table, then set a key on `Month` only if the table does not already have one. Save the result to `ex_dt`.

```r title="Your turn: guard with haskey"
ex_dt <- as.data.table(airquality)
# Try it: key ex_dt on Month only if it has no key

ex_dt
#> Expected: haskey(ex_dt) is TRUE after your code
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(airquality)
if (!haskey(ex_dt)) setkey(ex_dt, Month)
haskey(ex_dt)
#> [1] TRUE
```

**Explanation:** `haskey()` returns `FALSE` for the freshly converted table, so the `if` branch runs and `setkey()` sorts `ex_dt` by `Month`. A second call to `haskey()` now returns `TRUE`.

</details>

## Related data.table functions

**These functions pair naturally with haskey() when managing keys.**

- `setkey()` sets the primary key and physically sorts the table.
- `key()` returns the key column names so you can act on them.
- `setindex()` and `indices()` manage fast secondary indexes.
- `setorder()` reorders rows without attaching a key.
- `setkeyv()` sets a key from a character vector of column names.

## FAQ

**What does haskey() return in R?**

`haskey()` returns a single logical value: `TRUE` if the data.table has a primary key attached and `FALSE` otherwise. It never returns column names or `NULL`. Because it only reads the table's `sorted` attribute, the call is instant and has no side effects, which makes it safe to use inside loops, assertions, and conditional branches.

**What is the difference between haskey() and key() in data.table?**

`haskey()` answers "is there a key?" with `TRUE` or `FALSE`. `key()` answers "which columns form the key?" by returning a character vector, or `NULL` when no key is set. Use `haskey()` for a boolean branch and `key()` when you need the actual column names. `haskey()` is effectively shorthand for `!is.null(key(x))`.

**Does haskey() detect secondary indexes?**

No. `haskey()` only reports the primary key created by `setkey()`. A table with one or more secondary indexes from `setindex()` but no primary key returns `FALSE`. To check for secondary indexes, call `indices()`, which lists their column names, or returns `NULL` when none exist.

**How do I remove a key so haskey() returns FALSE?**

Call `setkey(DT, NULL)`. This drops the `sorted` attribute without changing the row order, so a following `haskey(DT)` call returns `FALSE`. The data stays sorted in memory, but data.table no longer treats it as keyed, and keyed subsetting like `DT[.(value)]` will no longer work until you set a key again.

For the full key reference, see the [data.table setkey documentation](https://rdatatable.gitlab.io/data.table/reference/setkey.html).
