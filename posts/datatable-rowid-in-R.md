---
title: "data.table rowid() in R: Unique Row IDs Within Groups"
slug: "datatable-rowid-in-R"
description: "Use data.table rowid() in R to generate a within-group row counter, number occurrences of a value, group by multiple keys, and keep the first row per group."
keywords: "data.table rowid, rowid function R, data.table rowid examples, R rowid within groups, rowidv data.table, generate row id R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "rowid()|data.table rowid|data.table::rowid()|rowidv()|within-group counter"
auto_link_case_sensitive: true
target_keyword: "data.table rowid"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table rowid() in R: Unique Row IDs Within Groups

<p class="lead">The data.table <code>rowid()</code> function generates a unique within-group counter, numbering each row 1, 2, 3 within every group defined by the values you pass it, all in a single fast pass.</p>

[QUICK ANSWER]
rowid(c("a", "a", "b"))           # within-group counter: 1 2 1
rowid(dt$cyl)                     # occurrence index for a column
rowid(dt$g1, dt$g2)               # group by two keys at once
rowid(x, prefix = "id")           # character ids: id1, id2, id1
dt[, n := rowid(grp)]             # add a within-group counter column
dt[rowid(id) == 1]                # keep the first row per group
rowidv(dt, cols = c("a", "b"))    # rowid driven by named columns

[DECISION TREE: Is rowid() the right tool?]
- number rows within each value group: rowid(dt$grp)
- number rows within consecutive runs: rleid(dt$grp)
- number every row globally 1 to N: seq_len(nrow(dt))
- rank rows by a value within a group: frank(dt, val)
- count how many rows each group has: dt[, .N, by = grp]
- flag duplicate rows to drop them: duplicated(dt)

## What rowid() does in one sentence

**`rowid()` answers "which occurrence of this group is this row?" with a single integer.** You hand it one or more vectors, and it returns an integer for every position, counting up from 1 each time it meets a new group and continuing the count whenever that group appears again. It is the data.table shorthand for the common `dt[, id := 1:.N, by = group]` idiom.

The reason `data.table rowid` exists is convenience and speed. Writing a grouped `1:.N` works only inside a `data.table` query, while `rowid()` runs on any plain vector anywhere in your code. It computes the counter in C in one pass, reads clearly on its own line, and accepts several grouping vectors at once without nesting.

## Syntax

**`rowid()` takes one or more grouping vectors plus an optional prefix.** Only the grouping input is required.

```r title="Load data.table and number occurrences"
library(data.table)

rowid(c("a", "a", "b", "b", "b"))
#> [1] 1 2 1 2 3
```

The full signature is `rowid(..., prefix = NULL)`. Its arguments are:

- `...`: one or more vectors. Each row's group is the combination of values across every vector at that position.
- `prefix`: an optional string. When set, the result is a character vector like `id1`, `id2` instead of plain integers.

A second form, `rowidv(x, cols = seq_along(x), prefix = NULL)`, takes a single list, `data.frame`, or `data.table` as `x` and a `cols` vector naming which columns to group by. Use `rowid()` for loose vectors and `rowidv()` when the grouping columns already sit inside a table.

[TIP]
**Reach for `rowid()` whenever you need a per-group sequence number.** It replaces the verbose `ave(seq_along(x), x, FUN = seq_along)` base R pattern and works outside a `data.table` query, so you can build the counter first and assign it later.

## Numbering rows within groups: four patterns

### 1. A within-group counter for one vector

**The most common use is a per-group occurrence index.** Pass one column and `rowid()` returns how many times each value has been seen so far.

```r title="Count occurrences within one column"
dt <- as.data.table(mtcars)
head(dt[, .(cyl, cyl_occ = rowid(cyl))])
#>      cyl cyl_occ
#>    <num>   <int>
#> 1:     6       1
#> 2:     6       2
#> 3:     4       1
#> 4:     6       3
#> 5:     8       1
#> 6:     6       4
```

The fourth row is the third six-cylinder car, so its counter reads 3 even though a four-cylinder and an eight-cylinder car appeared in between.

### 2. Grouping by multiple keys

**Pass several vectors and `rowid()` groups by their combination.** The counter restarts only when the full tuple of values is new.

```r title="Group by two keys at once"
visits <- data.table(
  user = c("a", "a", "b", "a", "b", "b"),
  site = c("x", "x", "x", "y", "x", "y")
)

rowid(visits$user)
#> [1] 1 2 1 3 2 3

rowid(visits$user, visits$site)
#> [1] 1 2 1 1 2 1
```

Grouping by `user` alone, user `a` reaches 3. Grouping by `user` and `site` together, the `(a, y)` pair is brand new, so its counter resets to 1.

### 3. Character ids with a prefix

**Set `prefix` to get labelled character ids instead of integers.** This is handy for building readable keys before a reshape.

```r title="Generate prefixed character ids"
rowid(c("a", "a", "b"), prefix = "v")
#> [1] "v1" "v2" "v1"

rowidv(visits, cols = c("user", "site"))
#> [1] 1 2 1 1 2 1
```

`rowidv()` produces the same counter as `rowid()` but reads the grouping columns out of a table by name, which keeps long pipelines tidy.

### 4. Adding a counter column inside a data.table

**Assign the result with `:=` to attach a sequence number to every row.** This is the canonical way to tag repeated records.

```r title="Add a within-group counter column"
visits[, visit_no := rowid(user)]
visits[]
#>      user   site visit_no
#>    <char> <char>    <int>
#> 1:      a      x        1
#> 2:      a      x        2
#> 3:      b      x        1
#> 4:      a      y        3
#> 5:      b      x        2
#> 6:      b      y        3
```

Each user now carries a running visit number. The first visit of every user is `visit_no == 1`, which is exactly the filter you use to keep one row per group.

[KEY INSIGHT]
**`rowid()` turns "is this a repeat?" into a number you can filter on.** Once every row knows its occurrence index, deduplication, "first event" analysis, and long-to-wide reshaping all become simple comparisons against that integer instead of custom grouping logic.

## rowid() vs rleid(), 1:.N, and row_number()

**All four number rows, but they disagree on what counts as a group.** `rowid()` groups by value identity, while `rleid()` groups by consecutive runs.

```r title="rowid groups by value, rleid by run"
g <- c("a", "a", "b", "a")

rowid(g)
#> [1] 1 2 1 3

rleid(g)
#> [1] 1 1 2 3
```

The final `a` is the third occurrence of value `a`, so `rowid()` gives it 3. To `rleid()` it starts a fresh run, so it becomes run 3. Inside a query, a grouped `1:.N` matches `rowid()` exactly:

```r title="rowid matches 1:.N by group"
dt[, n_query := 1:.N, by = cyl]
dt[, n_rowid := rowid(cyl)]
identical(dt$n_query, dt$n_rowid)
#> [1] TRUE
```

| Function | Numbers by | Works outside a query |
|---|---|---|
| `rowid()` | value identity, any position | yes |
| `rleid()` | consecutive runs | yes |
| `1:.N` with `by` | group, inside `j` | no |
| `dplyr::row_number()` | group, after `group_by()` | no |

[NOTE]
**Coming from dplyr?** The equivalent of `rowid(dt$grp)` is `row_number()` inside a grouped pipeline: `df |> group_by(grp) |> mutate(n = row_number())`. Both number rows within each group following the table's current order.

## Common pitfalls

**Pitfall 1: `rowid()` groups by value, not by consecutive runs.** A value that reappears later keeps counting up rather than restarting.

```r title="rowid ignores run boundaries"
rowid(c("a", "a", "b", "a"))
#> [1] 1 2 1 3
```

If you expected the last `a` to reset to 1 because a `b` interrupted it, you want `rleid()`, not `rowid()`.

**Pitfall 2: the counter follows the table's current row order.** `rowid()` numbers rows as they sit right now, so a meaningful sequence (oldest to newest, for example) requires sorting first with `setorder()`.

**Pitfall 3: with `prefix` set, the result is character, not integer.** `rowid(x, prefix = "id") == 1` is always `FALSE` because it compares strings to a number. Drop the prefix when you need to filter the counter numerically.

[WARNING]
**Do not swap `rowid()` for `rleid()` when records are unsorted.** `rowid()` will happily count scattered occurrences of the same value as one group, while `rleid()` treats every interrupted stretch as new. Picking the wrong one silently produces a counter that looks plausible but is wrong.

## Try it yourself

**Try it:** Add a column `ex_visit` that numbers each row within its `user` group, then save the updated table to `ex_log`.

```r title="Your turn: number rows per user"
# Try it: add a within-user counter
ex_log <- data.table(
  user = c("u1", "u2", "u1", "u1", "u2"),
  page = c("home", "home", "about", "shop", "faq")
)
ex_log[, ex_visit := NA_integer_]  # replace NA_integer_ with your code

ex_log
#> Expected: ex_visit = 1, 1, 2, 3, 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_log[, ex_visit := rowid(user)]
ex_log
#>      user   page ex_visit
#>    <char> <char>    <int>
#> 1:     u1   home        1
#> 2:     u2   home        1
#> 3:     u1  about        2
#> 4:     u1   shop        3
#> 5:     u2    faq        2
```

**Explanation:** `rowid()` walks the `user` column and hands out 1, 2, 3 each time it meets a value again. User `u1` appears in rows 1, 3, and 4 so it gets 1, 2, 3, and `u2` appears in rows 2 and 5 so it gets 1, 2.

</details>

## Related data.table functions

These functions pair naturally with `rowid()` when sequencing or deduplicating rows:

- `rleid()`: numbers consecutive runs rather than every occurrence of a value.
- `.N`: the row count of the current group inside a `data.table` query.
- `frank()`: ranks rows by a value, with ties control, instead of by occurrence order.
- `setorder()`: sorts a table in place, so the `rowid()` counter follows a meaningful order.
- `duplicated()`: flags repeat rows, a companion when you filter with `rowid() == 1`.

## FAQ

**What does rowid() do in data.table?**

`rowid()` generates a within-group counter. For every element you pass it, it returns an integer saying which occurrence of that group the row is: the first time a value appears it gets 1, the second time 2, and so on. It is the vector-friendly equivalent of `dt[, id := 1:.N, by = group]` and runs anywhere, not only inside a `data.table` query.

**What is the difference between rowid and rleid in R?**

Both number rows, but they define groups differently. `rowid()` groups by value identity, so every occurrence of the same value continues one shared count no matter where it sits. `rleid()` groups by consecutive runs, so an interrupted stretch of the same value starts a fresh id. For `c("a", "a", "b", "a")`, `rowid()` returns `1 2 1 3` and `rleid()` returns `1 1 2 3`.

**How do I keep the first row of each group with rowid()?**

Filter on `rowid()` equal to 1: `dt[rowid(group) == 1]`. data.table numbers each row within its group, and only the first occurrence of every group carries the value 1, so the filter returns exactly one row per group. To keep the first by a particular order, call `setorder()` on the table before applying the filter.

**How do I add a row number within a group in data.table?**

Assign `rowid()` with the `:=` operator: `dt[, n := rowid(group)]`. This writes a within-group sequence number into every row. Inside a query you can also use `dt[, n := 1:.N, by = group]`, which produces an identical result. Both follow the table's current row order, so sort first if the count must reflect a specific sequence.

**Can rowid() group by more than one column?**

Yes. Pass several vectors and `rowid()` groups by their combination: `rowid(dt$a, dt$b)` numbers rows within each distinct pair of `a` and `b`. When the columns already live inside a table, `rowidv(dt, cols = c("a", "b"))` does the same job by reading them out by name, which keeps longer pipelines easier to read.

For the official argument reference, see the [data.table rowid documentation](https://rdatatable.gitlab.io/data.table/reference/rowid.html).
