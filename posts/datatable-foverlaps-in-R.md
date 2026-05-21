---
title: "data.table foverlaps() in R: Fast Overlap Joins on Intervals"
slug: datatable-foverlaps-in-R
description: "Learn data.table foverlaps() in R to join interval data fast. Covers setkey setup, overlap types, maxgap, mult, and grouped overlap joins with examples."
keywords: "data.table foverlaps, foverlaps function R, data.table foverlaps examples, R interval join, R overlap join, foverlaps data.table, foverlaps R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "foverlaps()|data.table foverlaps|data.table::foverlaps()|foverlaps|overlap join"
auto_link_case_sensitive: true
target_keyword: "data.table foverlaps"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table foverlaps() in R: Fast Overlap Joins on Intervals

<p class="lead">The data.table <code>foverlaps()</code> function performs fast overlap joins between two interval-keyed tables in R. It matches each row of <code>x</code> to every row of <code>y</code> whose interval overlaps, with control over the overlap type, minimum overlap, and allowed gap.</p>

[QUICK ANSWER]
foverlaps(x, y)                         # default "any" overlap
foverlaps(x, y, type = "within")        # x interval fully inside y
foverlaps(x, y, type = "start")         # intervals share a start
foverlaps(x, y, type = "equal")         # intervals match exactly
foverlaps(x, y, mult = "first")         # one match per x row
foverlaps(x, y, nomatch = NULL)         # inner join, drop unmatched
foverlaps(x, y, maxgap = 5)             # treat 5-unit gap as overlap
foverlaps(x, y, which = TRUE)           # return row indices only

[DECISION TREE: Is foverlaps() the right tool?]
- join two interval tables by overlap: foverlaps(x, y)
- equi-join on key columns, no intervals: y[x, on = "id"]
- nearest match on sorted key: y[x, on = "date", roll = TRUE]
- find self-overlaps inside one table: foverlaps(dt, dt)
- rolling window aggregate over rows: frollsum(x, 7)
- stack many data.tables row-wise: rbindlist(list_of_dts)

## What foverlaps() does

**foverlaps() joins two data.tables by interval overlap instead of by equality.** Each row in `x` is matched to every row in `y` whose `[start, end]` interval intersects with the `x` row's interval, and the matched columns are returned side by side. It is the data.table answer to GenomicRanges-style overlap joins.

The function is written in C and runs without a quadratic scan, so it scales to millions of rows. Both tables stay in memory; no SQL window is needed.

Before any overlap join, `y` must be keyed on at least two columns that define the interval, set with `setkey(y, start, end)` or with `setkeyv()`.

## foverlaps() syntax and arguments

**The signature looks long, but only the first two arguments are mandatory.** The defaults cover the most common case: an "any" overlap, all matches returned, and the keys inferred from `y`.

```r title="foverlaps function signature"
foverlaps(x, y, by.x = key(x), by.y = key(y),
          maxgap = 0L, minoverlap = 1L,
          type = c("any", "within", "start", "end", "equal"),
          mult = c("all", "first", "last"),
          nomatch = NA, which = FALSE, verbose = FALSE)
```

Each argument shapes how the overlap is detected and which matches are returned:

| Argument | Purpose |
|---|---|
| `x`, `y` | Two data.tables. `y` must be keyed; `x` must have matching interval columns. |
| `by.x`, `by.y` | Column names defining the interval, last two are the start and end. |
| `type` | Overlap rule: `"any"`, `"within"`, `"start"`, `"end"`, or `"equal"`. |
| `mult` | When multiple `y` rows match, return `"all"`, `"first"`, or `"last"`. |
| `nomatch` | `NA` keeps unmatched `x` rows (left join), `NULL` drops them (inner join). |
| `maxgap` | A non-overlap up to this distance still counts as a match. |
| `minoverlap` | Minimum overlap length required to count as a match. |
| `which` | If `TRUE`, return only row indices instead of the merged columns. |

[NOTE]
**Coming from another package?** `foverlaps()` is the data.table equivalent of GenomicRanges' `findOverlaps()` and of dplyr's experimental `join_by(overlaps())` helper. Unlike SQL, no `BETWEEN` self-join is needed.

## foverlaps() examples

**These examples use small inline tables so each overlap is easy to verify by eye.** Each example targets a different real use case for interval joins.

A basic call matches sessions to events. Here every event whose timestamp falls inside a session window is paired with that session.

```r title="Match events to session intervals"
library(data.table)
sessions <- data.table(
  user  = c("a", "a", "b"),
  start = c(1, 10, 1),
  end   = c(5, 15, 8)
)
events <- data.table(
  user = c("a", "a", "b"),
  t1   = c(3, 12, 6),
  t2   = c(3, 12, 6)
)
setkey(sessions, user, start, end)
foverlaps(events, sessions, by.x = c("user", "t1", "t2"))
#>      user start   end    t1    t2
#>    <char> <num> <num> <num> <num>
#> 1:      a     1     5     3     3
#> 2:      a    10    15    12    12
#> 3:      b     1     8     6     6
```

Use `type = "within"` to keep only matches where the `x` interval lies fully inside a `y` interval. This is strict containment, not partial overlap.

```r title="Keep only fully-contained intervals"
windows <- data.table(g = "x", s = 0,  e = 10)
items   <- data.table(g = "x", a = c(2, 8), b = c(4, 12))
setkey(windows, g, s, e)
foverlaps(items, windows, by.x = c("g", "a", "b"), type = "within")
#>         g     s     e     a     b
#>    <char> <num> <num> <num> <num>
#> 1:      x     0    10     2     4
#> 2:      x    NA    NA     8    12
```

For pricing or rate lookups, you often want exactly one matching window per row. Pass `mult = "first"` so each `x` row returns its first match instead of every overlap.

```r title="Return only the first matching interval"
rates <- data.table(
  region = "EU",
  from   = as.Date(c("2024-01-01", "2024-07-01")),
  to     = as.Date(c("2024-06-30", "2024-12-31")),
  rate   = c(0.10, 0.12)
)
orders <- data.table(
  region = "EU",
  d1     = as.Date(c("2024-03-15", "2024-08-20")),
  d2     = as.Date(c("2024-03-15", "2024-08-20"))
)
setkey(rates, region, from, to)
foverlaps(orders, rates, by.x = c("region", "d1", "d2"), mult = "first")[
  , .(region, d1, rate)]
#>    region         d1  rate
#>    <char>     <Date> <num>
#> 1:     EU 2024-03-15  0.10
#> 2:     EU 2024-08-20  0.12
```

Self-joining a table on itself finds rows whose intervals overlap any other row. This is the standard recipe for detecting double-booked rooms or duplicate ranges.

```r title="Find overlapping rows in one table"
bookings <- data.table(
  room  = c("A", "A", "A"),
  start = c(9, 11, 14),
  end   = c(12, 13, 16)
)
setkey(bookings, room, start, end)
hits <- foverlaps(bookings, bookings, which = TRUE)
hits[xid != yid]
#>      xid   yid
#>    <int> <int>
#> 1:     1     2
#> 2:     2     1
```

[KEY INSIGHT]
**An overlap join is just a merge whose match rule is an inequality.** `foverlaps()` lets you express "this point falls inside that range" without writing a Cartesian self-join. Once you frame your data as intervals, joins that looked expensive become a single sorted scan.

## foverlaps() vs other join tools

**foverlaps() is the right pick only when the match rule involves an interval.** For equality, nearest-neighbour, or row-wise window logic, a different tool is faster or simpler.

| Tool | Use it when |
|---|---|
| `foverlaps(x, y)` | You need to join on overlap of `[start, end]` ranges. |
| `y[x, on = .(id)]` | You are joining on equal keys, not intervals. |
| `y[x, on = "date", roll = TRUE]` | You want the nearest preceding key, not an overlap. |
| `dplyr::join_by(overlaps())` | You are already in dplyr and the data is small. |
| `GenomicRanges::findOverlaps()` | You work with biological ranges and need Bioconductor methods. |

Use `maxgap` to relax the overlap rule. With `maxgap = 5`, intervals that are within five units of touching still count as overlapping, which is useful for "near match" logic in genomics or sensor data.

```r title="Allow a small gap with maxgap"
near <- data.table(g = "x", s = 0,  e = 5)
hits <- data.table(g = "x", a = 7, b = 8)
setkey(near, g, s, e)
foverlaps(hits, near, by.x = c("g", "a", "b"), maxgap = 5)
#>         g     s     e     a     b
#>    <char> <num> <num> <num> <num>
#> 1:      x     0     5     7     8
```

## Common pitfalls

**Most foverlaps() errors trace back to keys, column order, or NA endpoints.** These three mistakes cover almost every confused bug report.

Calling `foverlaps()` before keying `y` raises an error because the function cannot guess which columns hold the interval. Always run `setkey(y, group, start, end)` first; the last two key columns must be the start and end.

```r title="Key y before joining"
y <- data.table(g = "a", s = 1, e = 5)
x <- data.table(g = "a", a = 2, b = 3)
setkey(y, g, s, e)
foverlaps(x, y, by.x = c("g", "a", "b"))[, .(g, s, e, a, b)]
#>         g     s     e     a     b
#>    <char> <num> <num> <num> <num>
#> 1:      a     1     5     2     3
```

Mixing up `start` and `end` in `x` lets the function read inverted intervals and silently miss matches. The convention `[low, high]` must hold for every row in both tables.

Joining on a single point in `x` still requires two columns, so write `t2 = t1` for point events. A missing endpoint becomes `NA` and is treated as non-overlapping, which usually returns no matches.

[WARNING]
**Empty results often mean the key types do not match.** If `y` is keyed on integers but `x` passes numerics or dates, the join silently returns zero matches. Confirm `class(y$start)` equals `class(x$t1)` before debugging logic.

## Try it yourself

**Try it:** Build a 2-row `windows` table with `start = c(0, 10)` and `end = c(5, 15)`, key it, then use `foverlaps()` to match a single event at `t = 3`. Save the result to `ex_match`.

```r title="Your turn: match an event to a window"
# Try it: match t = 3 to one of two windows
ex_windows <- data.table(g = "x", start = c(0, 10), end = c(5, 15))
ex_event   <- data.table(g = "x", t1 = 3, t2 = 3)
ex_match   <- # your code here

ex_match
#> Expected: one row with start = 0, end = 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(data.table)
ex_windows <- data.table(g = "x", start = c(0, 10), end = c(5, 15))
ex_event   <- data.table(g = "x", t1 = 3, t2 = 3)
setkey(ex_windows, g, start, end)
ex_match <- foverlaps(ex_event, ex_windows, by.x = c("g", "t1", "t2"))
ex_match
#>         g start   end    t1    t2
#>    <char> <num> <num> <num> <num>
#> 1:      x     0     5     3     3
```

**Explanation:** After keying `ex_windows` on `g, start, end`, `foverlaps()` knows which columns define the interval. The event `t = 3` falls inside the first window only, so the second window is filtered out.

</details>

## Related data.table functions

These functions pair naturally with `foverlaps()` for keyed and joined work:

- `setkey()` sorts and indexes the right-hand table before any overlap join.
- `merge()` performs a standard equi-join when no interval logic is needed.
- `shift()` lags or leads a column, often used to build a `[start, end]` pair.
- `rbindlist()` stacks the rows returned from many overlap joins quickly.

See the official [data.table foverlaps reference](https://rdatatable.gitlab.io/data.table/reference/foverlaps.html) for the full argument list.

## FAQ

**What is the difference between foverlaps and merge in data.table?**

`merge()` (or the `y[x, on = ...]` syntax) matches rows by equal key values. `foverlaps()` matches rows whose intervals overlap, so the join condition is `x.start <= y.end AND x.end >= y.start` rather than `x.id == y.id`. Use `merge()` when you have shared identifiers and `foverlaps()` when you need interval logic such as "event falls inside session" or "two date ranges intersect".

**Why does foverlaps require setkey on y?**

The function uses the key on `y` to identify the interval columns and to drive a binary-search-based scan that avoids comparing every pair of rows. Without a key it cannot know which columns are the start and end of the range, so it stops with an explicit error. Always call `setkey(y, group_cols, start, end)` first; the last two key columns must be the interval bounds.

**Can foverlaps join on more than just intervals?**

Yes. Any columns listed before `start` and `end` in the key are treated as equi-join columns. For example, `setkey(y, region, from, to)` joins rows only when `region` matches exactly and the date range overlaps. This is how you join interval data within groups, such as price windows per region or sessions per user.

**How is foverlaps different from a rolling join?**

A rolling join (`y[x, on = "date", roll = TRUE]`) finds the single nearest preceding key value for each row. An overlap join returns every `y` row whose interval intersects the `x` interval. Use rolling joins for snapshot-style lookups, such as the most recent price before a transaction, and `foverlaps()` when one or both sides has a range with a defined start and end.
