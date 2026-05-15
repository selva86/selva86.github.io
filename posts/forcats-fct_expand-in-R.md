---
title: "forcats fct_expand() in R: Add New Factor Levels"
slug: "forcats-fct_expand-in-R"
description: "Learn forcats fct_expand() in R to add new levels to a factor. See worked examples, the after argument, the fct_drop contrast, and common pitfalls to avoid."
keywords: "forcats fct_expand, fct_expand function R, forcats fct_expand examples, R add factor levels, expand factor levels R, fct_expand vs fct_drop"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_expand()|forcats fct_expand|forcats::fct_expand()|add factor levels|fct_expand"
auto_link_case_sensitive: true
target_keyword: "forcats fct_expand"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_expand() in R: Add New Factor Levels

<p class="lead">The <code>fct_expand()</code> function in forcats adds new levels to a factor. It widens the level table to include categories you name, even when no observation uses them yet.</p>

[QUICK ANSWER]
fct_expand(f, "new")                 # add one new level at the end
fct_expand(f, "x", "y", "z")         # add several levels at once
fct_expand(f, c("x", "y"))           # a character vector also works
fct_expand(f, "new", after = 0)      # add the level at the front
fct_expand(f, "S")                   # adding an existing level is a no-op
levels(fct_expand(f, "new"))         # inspect the expanded table

[DECISION TREE: Is fct_expand() the right tool?]
- add empty levels to a factor: fct_expand(f, "new")
- remove unused levels instead: fct_drop(f)
- rename a level label: fct_recode(f, new = "old")
- reorder existing levels: fct_relevel(f, "a")
- turn NA into a real level: fct_na_value_to_level(f, "Missing")
- combine factors with different levels: fct_c(f1, f2)

## What fct_expand() does

**`fct_expand()` adds levels to a factor's lookup table without touching the data.** A factor is a pair of parts: an integer code for every observation and a table of level labels those codes point into. The function appends the labels you pass to that table and leaves every stored value unchanged.

The new levels start empty. They exist in the table but no observation maps to them, so they carry a count of zero. That is the whole point. An empty level is a placeholder that makes a missing category visible in tables, plots, and models instead of silently absent.

This is the exact inverse of `fct_drop()`, which removes levels that have no observations. Where `fct_drop()` shrinks the table to match the data, `fct_expand()` grows the table beyond the data on purpose.

[KEY INSIGHT]
**An empty level is a feature, not a bug.** A factor with a level no row uses still produces a zero-count row in `table()` and an empty bar in a chart. When you expect a category that this data slice happens to miss, `fct_expand()` reserves its slot so downstream output stays complete and comparable.

## fct_expand() syntax

**`fct_expand()` takes the factor plus the new levels and an optional `after` argument.** The signature is short:

```
fct_expand(f, ..., after = Inf)
```

- `f` is a factor. A character vector is accepted and coerced to a factor first.
- `...` are the new levels to add, passed as separate strings or as a single character vector. Levels already present are ignored, so no duplicates are created.
- `after` is the position in the existing level table where the new levels are inserted. The default `Inf` appends them at the end; `after = 0` places them first.

The code below builds a small factor whose level table the examples then widen.

```r title="Load forcats and build a factor"
library(forcats)

quarters <- factor(c("Q1", "Q2", "Q1", "Q3"))
levels(quarters)
#> [1] "Q1" "Q2" "Q3"
```

The factor knows three quarters because that is all the data contains. The examples below add the missing fourth.

## fct_expand() examples

**Each example adds one or more levels and prints the resulting table.** `fct_expand()` returns a new factor, so assign the result to keep it.

### 1. Add a new empty level

Pass the factor and the level name. The new level lands at the end of the table.

```r title="Add a new empty level"
quarters <- fct_expand(quarters, "Q4")
levels(quarters)
#> [1] "Q1" "Q2" "Q3" "Q4"
```

The level `Q4` now exists even though no row holds it. The data values in `quarters` are untouched; only the lookup table grew.

### 2. Add several levels at once

List multiple names in one call. They are appended in the order given.

```r title="Add several levels at once"
sizes <- factor(c("S", "M"))
sizes <- fct_expand(sizes, "L", "XL")
levels(sizes)
#> [1] "S"  "M"  "L"  "XL"
```

A single character vector works the same way, so `fct_expand(sizes, c("L", "XL"))` produces an identical result. This is handy when the level names come from another object.

### 3. Control placement with `after`

By default new levels go last. Set `after = 0` to insert them at the front instead.

```r title="Place a new level at the front"
grades <- factor(c("B", "C"), levels = c("B", "C"))
levels(fct_expand(grades, "A", after = 0))
#> [1] "A" "B" "C"
```

Here `A` belongs ahead of `B` and `C` to keep the grade order natural. The `after` argument counts existing levels, so `after = 1` would place the new level just after `B`.

[TIP]
**Reserve levels before counting or plotting.** Call `fct_expand()` on a factor before `fct_count()` or a bar chart so every expected category appears, even the empty ones. This keeps tables and axes identical across data slices that happen to lack a category.

### 4. Empty levels show up in counts

The reason to add an empty level is so it surfaces in summaries. `fct_count()` reports the reserved level with a count of zero.

```r title="Expanding keeps empty levels visible"
resp <- factor(c("Yes", "Yes", "No"), levels = c("Yes", "No"))
resp <- fct_expand(resp, "Maybe")
fct_count(resp)
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 Yes       2
#> 2 No        1
#> 3 Maybe     0
```

Without the `fct_expand()` call, `Maybe` would be missing from the count entirely. Reserving it makes the zero explicit, which is what a complete survey summary needs.

## fct_expand() vs fct_drop() and base R

**`fct_expand()` adds levels; `fct_drop()` removes them; base R does the same with a level assignment.** The three approaches solve mirrored problems. You can also widen a level table with base R by assigning a longer vector to `levels()`.

```r title="The base R way to add a level"
f <- factor(c("a", "b"))
levels(f) <- c(levels(f), "c")
levels(f)
#> [1] "a" "b" "c"
```

The table below sums up when to reach for each tool.

| Function | Effect on levels | Key argument | Use when |
|---|---|---|---|
| `fct_expand()` | adds named levels | `after` sets placement | you reserve categories in a forcats pipeline |
| `fct_drop()` | removes unused levels | `only` limits the drop | you clean a factor after subsetting |
| `levels(f) <-` | adds via reassignment | none | you want a base R one-liner with no dependency |

The decision rule is short. To reserve categories cleanly inside a tidyverse workflow, use `fct_expand()`. To strip empty categories back out, use `fct_drop()`.

[NOTE]
**Coming from Python pandas?** The closest equivalent of `fct_expand()` is `series.cat.add_categories(["new"])`, which appends categories to a categorical column without changing any values.

## Common pitfalls

**Pitfall 1: forgetting to assign the result.** `fct_expand()` returns a new factor and never edits the original in place. Call it without assigning the output and the widened factor is discarded.

**Pitfall 2: expecting an empty level to vanish on its own.** A reserved level stays in the table until you remove it. If a later step should not show empty categories, follow up with `fct_drop()` to clear them.

[WARNING]
**Adding an existing level does nothing, and that is intended.** Passing a level name already in the table is a silent no-op, not an error. `fct_expand()` never creates a duplicate level, so it is safe to run defensively even when you are unsure which levels already exist.

**Pitfall 3: confusing expanding with recoding.** `fct_expand()` only adds empty levels. To rename an existing level or merge several into one, use `fct_recode()` or `fct_collapse()` instead.

## Try it yourself

**Try it:** The `ex_days` factor holds three weekdays. Add the two missing weekend days, `Sat` and `Sun`, and save the result to `ex_full`.

```r title="Your turn: add the weekend levels"
ex_days <- factor(c("Fri", "Wed", "Mon"))
levels(ex_days)
#> [1] "Fri" "Mon" "Wed"

# Add Sat and Sun
ex_full <- # your code here

levels(ex_full)
#> Expected: "Fri" "Mon" "Wed" "Sat" "Sun"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_full <- fct_expand(ex_days, "Sat", "Sun")
levels(ex_full)
#> [1] "Fri" "Mon" "Wed" "Sat" "Sun"
```

**Explanation:** `fct_expand()` appends each named level to the end of the table. `Sat` and `Sun` now exist as empty levels, while the three weekday values stay exactly as they were.

</details>

## Related forcats functions

After `fct_expand()`, these forcats functions cover the rest of factor-level work:

- `fct_drop()`: remove unused empty levels, the inverse of expanding.
- `fct_relevel()`: set the order of the levels once they exist.
- `fct_recode()`: rename level labels without changing their order.
- `fct_na_value_to_level()`: turn missing values into an explicit level.
- `fct_c()`: combine factors and union their level tables.

For the full argument reference, see the forcats documentation at [forcats.tidyverse.org](https://forcats.tidyverse.org/reference/fct_expand.html).

## FAQ

**What does fct_expand do in R?**

`fct_expand()` adds new levels to a factor. You pass a factor and one or more level names, and you get back a new factor whose level table includes those names. The new levels start empty, meaning no observation uses them. The stored data values are not changed at all; only the lookup table of labels grows wider.

**How do I add a level to a factor in R?**

The tidyverse way is `fct_expand(f, "new")`, which appends one or more levels to the factor's table. In base R you can assign a longer vector to `levels()`, as in `levels(f) <- c(levels(f), "new")`. Both leave the data values untouched. `fct_expand()` reads more clearly in a forcats pipeline and accepts several level names in a single call.

**What is the difference between fct_expand and fct_drop?**

They are exact opposites. `fct_expand()` adds levels to the table, including empty ones with no observations. `fct_drop()` removes levels that have no observations. Use `fct_expand()` to reserve a category you expect, and `fct_drop()` to clean out a category that a subset left behind. Running one then the other returns you close to the original level set.

**Does fct_expand change my data?**

No. `fct_expand()` only widens the level table. Every observation keeps its original category and integer code, so counts, means, and model results computed from the values are identical before and after. The only visible change is that empty levels now appear in `levels()`, `table()`, and `fct_count()` output.

**Why would I add an empty factor level?**

Reserving an empty level keeps output complete and comparable. A survey response factor might lack the `Maybe` answer in one batch of data. Adding it with `fct_expand()` makes `Maybe` show up as a zero-count row rather than disappearing, so tables and bar charts have the same categories across every data slice.
