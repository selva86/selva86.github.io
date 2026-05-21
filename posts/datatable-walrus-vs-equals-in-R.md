---
title: "data.table := vs = in R: When to Use Walrus vs Equals"
slug: datatable-walrus-vs-equals-in-R
description: "Compare data.table := vs = in R: when to use the walrus operator for by-reference column updates versus = for argument naming, equality, and pitfalls."
keywords: "data.table := vs =, data.table walrus operator, := in data.table R, := operator R, data.table column assignment, R data.table assignment, walrus vs equals data.table"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: ":=|data.table :=|walrus operator|data.table walrus|:= operator|data.table assignment"
auto_link_case_sensitive: true
target_keyword: "data.table := vs ="
sibling_block_enabled: true
difficulty: Beginner
---

# data.table := vs = in R: When to Use Walrus vs Equals

<p class="lead">In data.table the := operator (the walrus) updates columns in place by reference, while = is reserved for naming function arguments and testing equality. Mixing them is the most common source of "invalid .internal.selfref" warnings and silent copies.</p>

[QUICK ANSWER]
DT[, x := y * 2]                    # add or overwrite one column
DT[, c("a", "b") := list(x, y)]     # update many columns at once
DT[, `:=`(a = x, b = y)]            # functional form, same as above
DT[i, x := NA]                      # conditional update on matched rows
DT[, x := NULL]                     # delete column x by reference
DT[, mean_x := mean(x), by = grp]   # walrus respects by clause
data.table(x = 1:3, y = 4:6)        # = names arguments, not assignment

[DECISION TREE: Is := the right tool?]
- update or add a column in place: DT[, x := value]
- aggregate to a new table (no in place): DT[, .(s = sum(x)), by = g]
- read a column out: DT[, x] or DT$x
- bulk reorder by reference: setorder(DT, x)
- bulk rename by reference: setnames(DT, old, new)
- conditional update by row match: DT[i, x := value]

## What := does in data.table

**The walrus operator updates a data.table by reference.** Writing `DT[, newcol := expr]` adds or overwrites `newcol` in `DT` without copying the table. The expression on the right is evaluated, the result is stored as a new column, and the function returns the modified table invisibly so a long pipeline of updates does not flood the console.

This is what makes data.table fast on millions of rows. A base R assignment like `DT$x <- y` copies the entire frame before changing one column, which doubles memory use and slows things down whenever the table is wide. The walrus skips that copy entirely and writes directly into the existing column structure. The trade-off is that `:=` mutates its input, so the original object changes whether you assign the result or not, and any other name pointing at the same table sees the change too.

The walrus also has a "set" family of cousins, including `setnames()`, `setcolorder()`, and `setkey()`, that share its by reference semantics for metadata changes. Everything in that family avoids the copy that base R assignment would force.

[KEY INSIGHT]
**:= is a verb, = is a label.** The walrus tells data.table to do something to the table. The equals sign just names an argument or tests equality. They look similar but live in different grammars, which is why mixing them produces such confusing errors.

## What = does inside data.table

**Inside `DT[i, j, by]`, = names arguments to functions, not column assignments.** When you write `data.table(x = 1:3)`, the `=` binds the value `1:3` to the parameter `x`, exactly as it would in any function call. The same role applies inside the `.()` shortcut: `DT[, .(mean_x = mean(x))]` names the output column `mean_x` in the new summary table that the call returns.

None of these create or update columns in `DT` itself. The expression `DT[, .(...)]` always returns a fresh data.table; the original is never touched. That distinction is the whole point of the walrus: when you want to mutate `DT`, the only operator that does it is `:=`. Every other use of `=` in the `j` slot is either argument naming or a silent mistake.

The other use of `=` is the equality test `==`, which compares values. A single `=` in a logical context is a syntax error in R, so the language never confuses assignment with comparison. The confusion is purely in the reader's head when scanning a `DT[, j]` expression that mixes the two roles in one call.

```r title="Equals names a column in a new table"
library(data.table)
DT <- as.data.table(mtcars[1:5, c("mpg", "cyl")], keep.rownames = "model")

# = inside .() names the output columns of a NEW summary table
DT[, .(mean_mpg = mean(mpg), n = .N), by = cyl]
#>    cyl mean_mpg n
#> 1:   6   21.150 3
#> 2:   4   22.800 1
#> 3:   8   18.700 1
```

The result is a fresh summary `data.table`. The original `DT` is untouched, and no `:=` was used.

## := examples

**These examples cover the four shapes of := you will write most often.** Each one mutates `DT` in place, so re-running a block after an earlier change replays history rather than starting from a clean slate. Restart the page or reload the dataset when you want a fresh state to experiment with.

The four shapes are: a single column update, a multi column update with a character vector, the functional form with backticked syntax, and a conditional update gated by the `i` slot. The last two examples cover by group updates and column deletion, which round out almost every real workflow.

The simplest form adds one column. The expression on the right can reference any column already in the table by name.

```r title="Add a single column by reference"
DT <- as.data.table(mtcars, keep.rownames = "model")

DT[, kpl := mpg * 0.425]
DT[1:4, .(model, mpg, kpl)]
#>                model  mpg     kpl
#> 1:         Mazda RX4 21.0 8.92500
#> 2:     Mazda RX4 Wag 21.0 8.92500
#> 3:        Datsun 710 22.8 9.69000
#> 4:    Hornet 4 Drive 21.4 9.09500
```

To update many columns at once, pass a character vector on the left and a list on the right. The lengths must match.

```r title="Update many columns at once"
DT[, c("hp_kw", "wt_kg") := list(hp * 0.7457, wt * 453.592)]
DT[1:3, .(model, hp, hp_kw, wt, wt_kg)]
#>            model  hp   hp_kw    wt    wt_kg
#> 1:     Mazda RX4 110 82.0270 2.620 1188.411
#> 2: Mazda RX4 Wag 110 82.0270 2.875 1303.577
#> 3:    Datsun 710  93 69.3501 2.320 1052.333
```

The functional form `` `:=`(a = ..., b = ...) `` does the same job and reads more naturally when you have several updates. Here the equals sign labels the column being assigned, but the walrus is still doing the work.

```r title="Functional form for many columns"
DT[, `:=`(
  hp_per_cyl = hp / cyl,
  mpg_per_wt = mpg / wt
)]
DT[1:3, .(model, hp_per_cyl, mpg_per_wt)]
#>            model hp_per_cyl mpg_per_wt
#> 1:     Mazda RX4   18.33333   8.015267
#> 2: Mazda RX4 Wag   18.33333   7.304348
#> 3:    Datsun 710   23.25000   9.827586
```

Combine `i` with `:=` to update only the rows that match a condition. This is the in place equivalent of an SQL `UPDATE ... WHERE`.

```r title="Conditional update on matched rows"
DT[cyl == 4, mpg_band := "efficient"]
DT[is.na(mpg_band), mpg_band := "other"]
DT[, .N, by = mpg_band]
#>    mpg_band  N
#> 1:    other 21
#> 2: efficient 11
```

Adding `by` evaluates the right hand expression inside each group, then writes the result back to every row of that group.

```r title="Walrus respects by clause"
DT[, group_mean_mpg := mean(mpg), by = cyl]
DT[1:4, .(model, cyl, mpg, group_mean_mpg)]
#>                model cyl  mpg group_mean_mpg
#> 1:         Mazda RX4   6 21.0       19.74286
#> 2:     Mazda RX4 Wag   6 21.0       19.74286
#> 3:        Datsun 710   4 22.8       26.66364
#> 4:    Hornet 4 Drive   6 21.4       19.74286
```

To delete a column, assign `NULL` with the walrus. No copy, no warning.

```r title="Delete a column by reference"
DT[, c("hp_kw", "wt_kg") := NULL]
"hp_kw" %in% names(DT)
#> [1] FALSE
```

[NOTE]
**Coming from Python pandas?** The walrus is the data.table equivalent of `df.loc[:, "x"] = y` or `df["x"] = y`. Both mutate the frame in place. The aggregate form `DT[, .(s = sum(x)), by = g]` is closer to `df.groupby("g")["x"].sum().reset_index()`, which returns a new frame.

## := vs = vs <- in data.table

**Each operator has one job. Mixing them produces silent copies or invalid table errors.** This table is the lookup you will reach for most often.

| Operator | Role | Copies DT? | Example |
|---|---|---|---|
| `:=` | Update column by reference | No | `DT[, x := y * 2]` |
| `=` | Name a function argument | n/a | `data.table(x = 1:3)` |
| `==` | Test equality | n/a | `DT[cyl == 4]` |
| `<-` outside `[ ]` | Bind a name | Yes (whole frame) | `DT2 <- DT` (shallow) |
| `DT$x <- y` | Replace a column | Yes | `DT$x <- DT$y * 2` |
| `set(DT, i, j, v)` | Loop-friendly walrus | No | `set(DT, NULL, "x", y)` |

The decision rule is simple. Use `:=` for any in place column write. Use `=` only to name arguments and `.()` outputs. Use `<-` to bind whole objects to names, never to assign data.table columns. For tight loops where `:=` adds overhead per call, drop to `set()` (see [data.table set in R](datatable-set-in-R.html)).

## Common pitfalls

**Most := bugs come from forgetting the by reference semantics.** Three patterns cover almost every case.

The first trap is using `=` where `:=` is required. Inside `DT[, j]`, a bare `=` creates a named element in `j` rather than mutating `DT`. The expression evaluates without an error, but the table is unchanged.

```r title="Equals does not mutate the table"
DT <- as.data.table(mtcars[1:3, "mpg"])

DT[, mpg_x2 = mpg * 2]   # silently builds a named list, DT is unchanged
"mpg_x2" %in% names(DT)
#> [1] FALSE
```

The fix is `DT[, mpg_x2 := mpg * 2]`. The single colon is the difference between a no op and a real update.

[WARNING]
**:= mutates the original, even when you assign the result.** Writing `DT2 <- DT[, x := y]` does not give you a fresh copy; both names point to the same mutated table. Use `copy(DT)` first when you need an independent snapshot.

The second trap is assigning a data.table to a new name. Without `copy()`, both names share the same underlying object, so a later `:=` mutates what looks like two tables.

```r title="Names share the same table without copy"
DT <- data.table(x = 1:3)
DT2 <- DT
DT[, x := x * 10]
DT2
#>     x
#> 1: 10
#> 2: 20
#> 3: 30
```

`DT2 <- copy(DT)` is the fix when you want an independent snapshot.

The third trap is passing a `data.table` into a function that subsets it, then reassigning. The internal pointers can drift, triggering `invalid .internal.selfref` the next time you run a `:=` call on the result. Always create new data.tables with `data.table()` or convert with `setDT()`, and apply `:=` directly to the returned object rather than to a saved subset that lost its self reference.

A fourth subtle case is using `:=` inside a `for` loop over many columns. Each `:=` call carries a small overhead from parsing and dispatch, which adds up when the loop runs thousands of times. For those cases the lower level `set(DT, i, j, value)` skips the parsing step and runs noticeably faster. Reserve plain `:=` for one off updates and reach for `set()` when the loop body is the bottleneck.

## Try it yourself

**Try it:** Use the walrus operator to add two columns to a data.table of mtcars: `power_band` ("high" when hp > 150, else "low") and `disp_per_cyl` (disp divided by cyl). Save the result to `ex_dt`.

```r title="Your turn: add two columns by reference"
# Try it: walrus assignment with two columns
ex_dt <- as.data.table(mtcars)
ex_dt[, # your code here]

ex_dt[1:3, .(hp, cyl, disp, power_band, disp_per_cyl)]
#> Expected: 3 rows with power_band and disp_per_cyl filled in
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(mtcars)
ex_dt[, `:=`(
  power_band   = ifelse(hp > 150, "high", "low"),
  disp_per_cyl = disp / cyl
)]
ex_dt[1:3, .(hp, cyl, disp, power_band, disp_per_cyl)]
#>     hp cyl disp power_band disp_per_cyl
#> 1: 110   6  160        low     26.66667
#> 2: 110   6  160        low     26.66667
#> 3:  93   4  108        low     27.00000
```

**Explanation:** The functional form `` `:=`(name1 = expr1, name2 = expr2) `` adds both columns in one pass without copying the table. `ifelse()` returns the band as a character vector; the second expression is a simple ratio.

</details>

## Related data.table functions

**The walrus operator pairs with several helpers for bulk by reference updates.** These keep your pipeline copy-free end to end:

- `set()`: lower overhead walrus for tight loops. See [data.table set in R](datatable-set-in-R.html).
- `setnames()`: rename columns by reference. See [data.table setnames in R](datatable-setnames-in-R.html).
- `setcolorder()`: reorder columns by reference. See [data.table setcolorder in R](datatable-setcolorder-in-R.html).
- `setkey()`: index a table by reference for fast joins and lookups. See [data.table setkey in R](datatable-setkey-in-R.html).
- `copy()`: take an independent snapshot before mutating. See [data.table copy in R](datatable-copy-in-R.html).
- `fcase()`: vectorized conditional often paired with `:=`. See [data.table fcase in R](datatable-fcase-in-R.html).

See the [official data.table `:=` reference](https://rdatatable.gitlab.io/data.table/reference/assign.html) for the full argument list and grammar.

## FAQ

**What is the difference between := and = in data.table?**

The walrus `:=` updates a `data.table` by reference, while `=` names a function argument or column inside `.()`. Writing `DT[, x := y]` mutates `DT` so `x` is added or overwritten with no copy. Writing `DT[, x = y]` instead builds an unnamed list internally and leaves `DT` unchanged, which is the classic silent bug. Inside `data.table(x = 1:3)` and `DT[, .(m = mean(y))]`, the `=` is doing argument binding, not assignment.

**Why does := change my data.table even when I do not assign the result?**

Because `:=` mutates the input by reference. Unlike base R assignment such as `DT$x <- y`, the walrus does not copy the table before changing it. The function call returns the modified table invisibly, but the change has already happened in place. To work on a snapshot, wrap the input in `copy(DT)` first, then run `:=` on the copy.

**When should I use the functional form `` `:=`(a = x, b = y) ``?**

Use the functional form when you are updating more than one column and want each assignment on its own line. It is identical in behaviour to `DT[, c("a", "b") := list(x, y)]` but reads better for three or more columns. The backticks are required because `:=` is not a normal R name. Pick whichever form keeps your column assignments visually aligned with their expressions.

**Can := work with by groups?**

Yes. `DT[, group_mean := mean(x), by = grp]` evaluates `mean(x)` separately for each group of `grp` and writes the group's mean back to every row of that group. The result is a new column in `DT` with the same row count as the original, not a collapsed summary. To get the collapsed summary instead, omit `:=` and write `DT[, .(mean = mean(x)), by = grp]`, which returns a new aggregated table.
