---
title: "data.table merge() in R: Join Two Tables by Key"
slug: datatable-merge-in-R
description: "data.table merge() in R joins two tables on shared key columns. Learn inner, left, right and full outer joins, the by.x and by.y arguments, and pitfalls."
keywords: "data.table merge, merge function R, data.table merge examples, R merge data.table, data.table join, merge two data.tables R, data.table left join"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "merge()|data.table merge|data.table::merge()|merge.data.table|merge two data.tables"
auto_link_case_sensitive: true
target_keyword: "data.table merge"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table merge() in R: Join Two Tables by Key

<p class="lead">The <code>data.table merge()</code> function joins two data.tables on one or more shared key columns, supporting inner, left, right and full outer joins through the <code>all.x</code>, <code>all.y</code> and <code>all</code> arguments.</p>

[QUICK ANSWER]
merge(x, y, by = "id")                  # inner join on id
merge(x, y, by = "id", all.x = TRUE)    # left join
merge(x, y, by = "id", all.y = TRUE)    # right join
merge(x, y, by = "id", all = TRUE)      # full outer join
merge(x, y, by.x = "id", by.y = "code") # keys named differently
merge(x, y)                             # join on shared key columns
x[y, on = "id"]                         # data.table-native join

[DECISION TREE: Is merge() the right tool?]
- join two tables on a key column: merge(x, y, by = "id")
- stack tables with the same columns: rbindlist(list(x, y))
- look up values without a full join: y[x, val, on = "id"]
- rolling or nearest-match join: x[y, on = "id", roll = TRUE]
- range or interval overlap join: foverlaps(x, y)
- update columns in place during a join: x[y, on = "id", v := i.v]

## What merge() does in one sentence

**merge() combines two data.tables into one by matching rows on shared key columns.** You pass two data.tables, name the column or columns they have in common, and get back a single data.table where each row pairs a left-side record with its matching right-side record.

By default `merge()` keeps only rows that match in both tables, which is an inner join. The `all.x`, `all.y` and `all` arguments widen that to left, right and full outer joins. The method is `merge.data.table`, a data.table-aware version of base R's `merge()`, so it accepts data.table inputs and returns a data.table.

## Syntax

**merge() for data.tables mirrors the base R signature with join-type switches.** The full call exposes every option you need for column matching and join type.

```r title="merge data.table signature"
merge(x, y, by = NULL, by.x = NULL, by.y = NULL,
      all = FALSE, all.x = all, all.y = all,
      sort = TRUE, suffixes = c(".x", ".y"),
      no.dups = TRUE, allow.cartesian = getOption("datatable.allow.cartesian"))
```

The arguments you reach for most often are:

- `x`, `y`: the two data.tables to join. `x` is the left table, `y` is the right.
- `by`: a character vector of column names present in both tables. If omitted, `merge()` uses the shared key columns, or the shared column names if neither table is keyed.
- `by.x`, `by.y`: use these when the join columns have different names in each table.
- `all`, `all.x`, `all.y`: control the join type. All default to `FALSE`, giving an inner join.
- `sort`: if `TRUE` (default), the result is sorted by the join columns.
- `suffixes`: the tags appended to non-join columns that share a name.

## Examples by use case

**Start with two small data.tables that share a `dept_id` column.** One holds employees, the other holds department names.

```r title="Create two data.tables to join"
library(data.table)

emp <- data.table(
  id      = 1:4,
  name    = c("Ann", "Bob", "Cara", "Dan"),
  dept_id = c(10, 20, 10, 30)
)
dept <- data.table(
  dept_id = c(10, 20, 40),
  dept    = c("Sales", "IT", "HR")
)
emp
#>       id   name dept_id
#>    <int> <char>   <num>
#> 1:     1    Ann      10
#> 2:     2    Bob      20
#> 3:     3   Cara      10
#> 4:     4    Dan      30
```

**An inner join keeps only rows that match in both tables.** Department 30 has no name and department 40 has no employee, so both drop out.

```r title="Inner join on a shared column"
merge(emp, dept, by = "dept_id")
#>    dept_id    id   name   dept
#>      <num> <int> <char> <char>
#> 1:      10     1    Ann  Sales
#> 2:      10     3   Cara  Sales
#> 3:      20     2    Bob     IT
```

**A left join keeps every row of `x` and fills unmatched right columns with NA.** Set `all.x = TRUE` to keep Dan even though department 30 is missing from `dept`.

```r title="Left join keeps every left row"
merge(emp, dept, by = "dept_id", all.x = TRUE)
#>    dept_id    id   name   dept
#>      <num> <int> <char> <char>
#> 1:      10     1    Ann  Sales
#> 2:      10     3   Cara  Sales
#> 3:      20     2    Bob     IT
#> 4:      30     4    Dan   <NA>
```

**Right and full outer joins keep unmatched rows from the other side.** `all.y = TRUE` keeps every department; `all = TRUE` keeps every row from both tables.

```r title="Right and full outer joins"
merge(emp, dept, by = "dept_id", all.y = TRUE)   # keep every dept row
#>    dept_id    id   name   dept
#>      <num> <int> <char> <char>
#> 1:      10     1    Ann  Sales
#> 2:      10     3   Cara  Sales
#> 3:      20     2    Bob     IT
#> 4:      40    NA   <NA>     HR

merge(emp, dept, by = "dept_id", all = TRUE)      # keep every row from both
#>    dept_id    id   name   dept
#>      <num> <int> <char> <char>
#> 1:      10     1    Ann  Sales
#> 2:      10     3   Cara  Sales
#> 3:      20     2    Bob     IT
#> 4:      30     4    Dan   <NA>
#> 5:      40    NA   <NA>     HR
```

**Use `by.x` and `by.y` when the key columns have different names.** Here the lookup table calls the key `code` instead of `dept_id`.

```r title="Join when key columns are named differently"
lookup <- data.table(
  code = c(10, 20, 40),
  dept = c("Sales", "IT", "HR")
)
merge(emp, lookup, by.x = "dept_id", by.y = "code")
#>    dept_id    id   name   dept
#>      <num> <int> <char> <char>
#> 1:      10     1    Ann  Sales
#> 2:      10     3   Cara  Sales
#> 3:      20     2    Bob     IT
```

[NOTE]
**Coming from Python pandas?** The equivalent of `merge(x, y, by = "id", all.x = TRUE)` is `x.merge(y, on="id", how="left")`. The `all.x` / `all.y` / `all` switches map to pandas `how="left"` / `"right"` / `"outer"`.

## merge() vs the x[y] join

**data.table offers a second join style with bracket syntax, `x[y, on = ...]`.** It does the same matching work but reads as a subset and returns columns in `x`-first order.

```r title="The data.table-native join"
emp[dept, on = "dept_id"]
#>       id   name dept_id   dept
#>    <int> <char>   <num> <char>
#> 1:     1    Ann      10  Sales
#> 2:     3   Cara      10  Sales
#> 3:     2    Bob      20     IT
#> 4:    NA   <NA>      40     HR
```

The two approaches differ in defaults and intent:

| Aspect | `merge(x, y, by =)` | `x[y, on =]` |
|---|---|---|
| Default join | Inner | Right (every row of `y`) |
| Result sorted | Yes, by key | No, follows `y` order |
| Update by reference | No | Yes, with `:=` |
| Reads like | A SQL join | A keyed subset |

The decision rule is short. Use `merge()` when you want a SQL-style join with explicit `all.x` / `all.y` control, or when porting code from base R or dplyr. Use `x[y, on = ]` when you want speed inside a data.table pipeline or need to update columns in place during the join.

[KEY INSIGHT]
**merge() is the familiar API; x[y] is the native one.** Both call the same fast binary join under the hood. `merge()` exists so base R and dplyr users have a drop-in path, while `x[y, on = ]` unlocks data.table-only features like `:=` updates and rolling joins.

## Common pitfalls

**A many-to-many match silently multiplies rows.** When a key value repeats on both sides, `merge()` returns every pairing, so two left rows and two right rows become four.

```r title="Many-to-many joins explode row counts"
x <- data.table(k = c(1, 1), v = c("a", "b"))
y <- data.table(k = c(1, 1), w = c("x", "y"))
merge(x, y, by = "k")
#>        k      v      w
#>    <num> <char> <char>
#> 1:     1      a      x
#> 2:     1      a      y
#> 3:     1      b      x
#> 4:     1      b      y
```

[WARNING]
**Check key uniqueness before you join.** Run `anyDuplicated(dt, by = "k")` on each table. If a key is meant to be unique but is not, the join inflates row counts and quietly corrupts every downstream aggregate. A duplicated key on both sides is the most common cause of a result that is suddenly far larger than expected.

**Shared non-key columns get `.x` and `.y` suffixes.** If both tables carry a column with the same name that is not a join key, `merge()` keeps both and renames them rather than dropping one.

```r title="Shared non-key columns are suffixed"
a <- data.table(id = 1:2, val = c(10, 20))
b <- data.table(id = 1:2, val = c(99, 88))
merge(a, b, by = "id")
#>       id  val.x  val.y
#>    <int>  <num>  <num>
#> 1:     1     10     99
#> 2:     2     20     88
```

**The result is sorted by the key, not left in input order.** `merge()` sorts by the join columns by default. Pass `sort = FALSE` if you need to preserve the original row order of `x`.

[TIP]
**Set a key first when you merge the same tables repeatedly.** Calling `setkey(emp, dept_id)` and `setkey(dept, dept_id)` lets `merge()` skip the sort step and run a pure binary join. For a one-off merge it makes little difference, but inside a loop the saved sorts add up fast.

## Try it yourself

**Try it:** Join `emp` to `dept` so that every employee is kept even when the department is unknown. Save the result to `ex_join`.

```r title="Your turn: left join two tables"
# Try it: keep every employee row
ex_join <- # your code here

nrow(ex_join)
#> Expected: 4 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_join <- merge(emp, dept, by = "dept_id", all.x = TRUE)
nrow(ex_join)
#> [1] 4
```

**Explanation:** `all.x = TRUE` makes a left join, so all four employees survive. Dan's department (30) is absent from `dept`, so his `dept` value is filled with `NA` instead of dropping the row.

</details>

## Related data.table functions

**merge() works alongside the rest of data.table's combining and joining toolkit.** Explore these next:

- `rbindlist()`: stack many data.tables that share columns into one table.
- `setkey()`: sort and tag key columns so joins skip the sort step.
- `foverlaps()`: join two tables on overlapping numeric or date ranges.
- `setDT()`: convert a data.frame or list to a data.table by reference before joining.
- `[.data.table`: the `x[y, on = ]` bracket join, the native alternative to `merge()`.

See the official [merge.data.table reference](https://rdatatable.gitlab.io/data.table/reference/merge.html) for the complete argument list.

## FAQ

**How do you merge two data.tables in R?**

Load the data.table package, then call `merge(x, y, by = "key")` with the name of the column the two tables share. By default this is an inner join, returning only rows whose key value appears in both tables. The result is a new data.table sorted by the key column. Add `all.x`, `all.y` or `all` to switch to a left, right or full outer join.

**What is the difference between merge() and the x[y] join in data.table?**

Both run the same fast binary join. `merge()` defaults to an inner join, sorts the result by the key, and reads like a SQL join, which suits code ported from base R or dplyr. The `x[y, on = ]` bracket form defaults to a right join, keeps `y`'s row order, and can update columns in place with `:=`. Use the bracket form inside a data.table pipeline.

**How do I do a left join in data.table?**

Pass `all.x = TRUE` to `merge()`: `merge(x, y, by = "id", all.x = TRUE)`. Every row of `x` is kept, and columns from `y` that have no match are filled with `NA`. This matches a SQL `LEFT JOIN`. The bracket equivalent is `y[x, on = "id"]`, which keeps every row of the table written inside the brackets.

**Does data.table merge() need keys to be set?**

No. `merge()` works on unkeyed data.tables; you just name the join columns with `by`. Setting a key with `setkey()` is an optimization, not a requirement. It lets `merge()` skip an internal sort, which speeds up repeated joins on large tables. For a single join on modest data the difference is negligible.

**Why does merge() create .x and .y columns?**

When both tables contain a column with the same name that is not a join key, `merge()` cannot keep one name for two columns. It appends the `suffixes` tags, `.x` for the left table and `.y` for the right, so both columns survive. Rename or drop the unwanted one afterward, or change the defaults with the `suffixes` argument.
</content>
</invoke>
