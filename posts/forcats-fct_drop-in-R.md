---
title: "forcats fct_drop() in R: Drop Unused Factor Levels"
slug: "forcats-fct_drop-in-R"
description: "Learn forcats fct_drop() in R to drop unused factor levels after subsetting. See examples, the only argument, the droplevels difference, and common pitfalls."
keywords: "forcats fct_drop, fct_drop function R, forcats fct_drop examples, drop unused factor levels R, remove unused levels R, fct_drop vs droplevels"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_drop()|forcats fct_drop|forcats::fct_drop()|drop unused factor levels|fct_drop|remove unused levels"
auto_link_case_sensitive: true
target_keyword: "forcats fct_drop"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_drop() in R: Drop Unused Factor Levels

<p class="lead">The <code>fct_drop()</code> function in forcats drops unused levels from a factor. It removes any level that has zero observations, so the level table matches the data that is actually present.</p>

[QUICK ANSWER]
fct_drop(f)                          # drop every unused level
fct_drop(df$grp)                     # drop on a data frame column
fct_drop(f, only = "b")              # drop only the level "b"
fct_drop(f, only = c("b", "c"))      # drop a chosen set
fct_drop(f[f != "b"])                # drop after subsetting a factor
levels(fct_drop(f))                  # inspect the kept levels

[DECISION TREE: Is fct_drop() the right tool?]
- drop levels with zero rows: fct_drop(f)
- add new empty levels instead: fct_expand(f, "new")
- merge rare levels into one: fct_lump(f, n = 3)
- rename a level label: fct_recode(f, new = "old")
- reorder the kept levels: fct_relevel(f, "a")
- collapse several levels into one: fct_collapse(f, big = c("a", "b"))

## What fct_drop() does

**`fct_drop()` removes factor levels that no observation uses.** A factor stores its categories as a fixed table of levels. That table does not shrink on its own. When you subset a vector or filter a data frame, rows disappear but every original level stays behind, even if nothing in the data points to it anymore.

Those leftover levels are called unused or orphan levels. They are harmless to the stored values but they leak into output. An unused level still shows up as an empty bar in a chart, a zero-count row in `table()`, and an extra coefficient slot in a model. `fct_drop()` is the forcats tool that clears them.

By default the function drops every unused level in one call. The optional `only` argument narrows that down to a named set, which is useful when you want to keep a deliberate placeholder level while removing the rest.

[KEY INSIGHT]
**Subsetting trims data, not levels.** A factor is a pair: integer codes per observation and a lookup table of labels. Filtering rows changes the codes but never the table. `fct_drop()` is the step that re-syncs the table to the codes, which is why it almost always follows a filter or a subset.

## fct_drop() syntax

**`fct_drop()` takes the factor to clean plus an optional `only` argument.** The full signature is short:

```
fct_drop(f, only)
```

- `f` is a factor. A character vector is accepted and coerced to a factor first.
- `only` is an optional character vector. When supplied, only the levels you name are considered for dropping, and any of those that are unused get removed. Levels not named are always kept, used or not.

When `only` is omitted, `fct_drop()` drops all unused levels. The code below builds a factor whose level table is wider than its data.

```r title="Load forcats and build a factor"
library(forcats)

sizes <- factor(c("S", "M", "S", "M"), levels = c("S", "M", "L"))
levels(sizes)
#> [1] "S" "M" "L"
```

The level `L` exists in the table but no observation uses it. That is the unused level the examples below remove.

## fct_drop() examples

**Each example removes one or more unused levels and prints the kept set.** `fct_drop()` returns a new factor, so assign the result to keep it.

### 1. Drop every unused level

Pass the factor straight to `fct_drop()`. Every level with zero observations is removed.

```r title="Drop all unused factor levels"
sizes_dropped <- fct_drop(sizes)
levels(sizes_dropped)
#> [1] "S" "M"
```

The orphan level `L` is gone and the data values in `sizes` are untouched. The level table now lists only categories that the data actually contains.

### 2. Drop unused levels after subsetting

The most common real use is cleaning a factor column after filtering rows. Subsetting keeps every original level, so call `fct_drop()` to catch up.

```r title="Drop unused levels after subsetting"
df <- data.frame(grade = factor(c("A", "B", "C", "A", "B")))
sub <- df[df$grade != "C", ]
levels(sub$grade)
#> [1] "A" "B" "C"

sub$grade <- fct_drop(sub$grade)
levels(sub$grade)
#> [1] "A" "B"
```

After the filter, no row holds grade `C`, yet the level survived until `fct_drop()` removed it. Assigning the result back to `sub$grade` updates the column in place.

### 3. Drop only a chosen level

The `only` argument restricts which unused levels are eligible. Here two levels are unused but just one is named.

```r title="Drop only a chosen level"
f <- factor(c("a", "b"), levels = c("a", "b", "c", "d"))
levels(fct_drop(f, only = "c"))
#> [1] "a" "b" "d"
```

Both `c` and `d` are unused, but `only = "c"` limits the drop to `c`. The level `d` is kept as a deliberate placeholder.

[TIP]
**Use `only` to keep a known-future level.** If a category has no rows yet but you expect it soon, naming the other orphans in `only` clears the clutter while preserving the placeholder. This keeps chart axes and factor tables stable across data refreshes.

### 4. fct_drop() is a safe no-op when all levels are used

When every level already has data, `fct_drop()` returns the factor unchanged.

```r title="No unused levels means no change"
full <- factor(c("x", "y", "z"))
identical(levels(fct_drop(full)), levels(full))
#> [1] TRUE
```

This makes the call safe to run defensively in a pipeline. It never errors and never removes a level that the data still needs.

## fct_drop() vs droplevels()

**`fct_drop()` cleans one factor; base R `droplevels()` also cleans a whole data frame.** The two solve the same problem from different angles. `droplevels()` is built into base R and accepts a data frame, dropping unused levels from every factor column at once.

```r title="droplevels handles a whole data frame"
df2 <- data.frame(
  grade = factor(c("A", "B"), levels = c("A", "B", "C")),
  size  = factor(c("S", "M"), levels = c("S", "M", "L"))
)
df2 <- droplevels(df2)
levels(df2$grade)
#> [1] "A" "B"
```

The table below sums up when to reach for each.

| Function | Works on | Restricting argument | Use when |
|---|---|---|---|
| `fct_drop()` | a single factor | `only` keeps a named set | you clean one factor and want forcats consistency |
| `droplevels()` | a factor or a data frame | `exclude` protects named levels | you clean every factor column at once |

The decision rule is short. For one factor inside a forcats or dplyr pipeline, use `fct_drop()`. To sweep an entire data frame in one call, use `droplevels()`.

[NOTE]
**Coming from Python pandas?** The closest equivalent of `fct_drop()` is `series.cat.remove_unused_categories()`, which drops categories with no observations from a categorical column.

## Common pitfalls

**Pitfall 1: expecting subsetting to drop levels.** Indexing a factor with `f[f != "b"]` or filtering a data frame removes rows but keeps the full level table. The unused level lingers until you call `fct_drop()`, so a stray empty bar or zero-count row is almost always a missing drop step.

**Pitfall 2: forgetting to assign the result.** `fct_drop()` returns a new factor and never edits the original in place. Call it without assigning the output and the cleaned factor is discarded.

[WARNING]
**`only` never drops a level that is in use.** The `only` argument restricts which levels are eligible for dropping, but `fct_drop()` still removes a named level only when it is unused. Naming a level that has observations does nothing, so `only` cannot delete real categories by mistake.

**Pitfall 3: confusing dropping with collapsing.** `fct_drop()` removes empty levels only. To merge several small levels into one bucket, use `fct_lump()` or `fct_collapse()` instead.

## Try it yourself

**Try it:** The `ex_team` factor was built with four levels but only three appear in the data. Drop the unused level and save the result to `ex_clean`.

```r title="Your turn: drop the unused level"
ex_team <- factor(c("Red", "Blue", "Green", "Red"),
                  levels = c("Red", "Blue", "Green", "Gold"))
levels(ex_team)
#> [1] "Red"   "Blue"  "Green" "Gold"

# Drop the unused level
ex_clean <- # your code here

levels(ex_clean)
#> Expected: "Red" "Blue" "Green"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- fct_drop(ex_team)
levels(ex_clean)
#> [1] "Red"   "Blue"  "Green"
```

**Explanation:** `fct_drop()` scans the level table for entries with zero observations. The level `Gold` has no rows, so it is removed, while the three used levels and every data value stay intact.

</details>

## Related forcats functions

After `fct_drop()`, these forcats functions cover the rest of factor-level work:

- `fct_expand()`: add new empty levels to a factor, the inverse of dropping.
- `fct_lump()`: merge infrequent levels into a single `Other` category.
- `fct_collapse()`: combine named levels into broader groups by hand.
- `fct_recode()`: rename level labels without changing their order.
- `fct_relevel()`: set the order of the levels that remain.

For the full argument reference, see the forcats documentation at [forcats.tidyverse.org](https://forcats.tidyverse.org/reference/fct_drop.html).

## FAQ

**What does fct_drop do in R?**

`fct_drop()` removes unused levels from a factor. An unused level is one that exists in the factor's level table but has no observations pointing to it. You pass a factor and get back a new factor whose level table lists only categories present in the data. The stored values are not changed, only the lookup table is trimmed.

**Why does my factor still show levels with no data?**

Factors keep a fixed level table. When you subset a vector or filter a data frame, the rows are removed but the level table is left intact, so levels with zero rows remain. This is by design, since R cannot know whether the missing category is gone permanently or just absent from this slice. Call `fct_drop()` to remove those orphan levels once you are sure.

**What is the difference between fct_drop and droplevels?**

Both drop unused levels. `droplevels()` is base R and accepts either a single factor or a whole data frame, cleaning every factor column in one call. `fct_drop()` is from forcats, works on one factor, and offers the `only` argument to restrict which levels are eligible. Use `fct_drop()` inside a forcats pipeline and `droplevels()` to sweep a full data frame.

**Can fct_drop keep some unused levels?**

Yes. Pass the `only` argument a character vector naming the levels you want to consider. `fct_drop()` will drop only those named levels when they are unused and leave every other level alone. This is useful for keeping a deliberate placeholder category that has no rows yet.

**Does fct_drop change my data values?**

No. `fct_drop()` only edits the level table and remaps the integer codes to match the smaller table. Every observation keeps its original category, so counts, means, and other computed results are identical before and after. This makes it safe to run right before plotting or modeling.
