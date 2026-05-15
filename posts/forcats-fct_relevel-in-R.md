---
title: "forcats fct_relevel() in R: Reorder Factor Levels"
slug: "forcats-fct_relevel-in-R"
description: "Learn forcats fct_relevel() in R to manually reorder factor levels. Move one or more levels to the front, set a reference level, or insert at any position."
keywords: "forcats fct_relevel, fct_relevel function R, forcats fct_relevel examples, R reorder factor levels, fct_relevel move level, change factor level order R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_relevel()|forcats fct_relevel|forcats::fct_relevel()|reorder factor levels|fct_relevel|change factor level order"
auto_link_case_sensitive: true
target_keyword: "forcats fct_relevel"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_relevel() in R: Reorder Factor Levels

<p class="lead">The <code>fct_relevel()</code> function in forcats reorders the levels of a factor by hand. You name the levels you want moved, and it puts them where you ask while leaving every other level in place.</p>

[QUICK ANSWER]
fct_relevel(f, "Low")                  # move one level to the front
fct_relevel(f, "Low", "Mid", "High")   # set the full order explicitly
fct_relevel(f, c("Low", "Mid"))        # pass the levels as a vector
fct_relevel(f, "High", after = 1)      # insert after position 1
fct_relevel(f, "Low", after = Inf)     # send a level to the end
fct_relevel(f, rev)                    # reorder with a function
fct_relevel(f, sort)                   # sort levels alphabetically

[DECISION TREE: Is fct_relevel() the right tool?]
- set the level order by hand: fct_relevel(f, "ref", "two")
- order levels by another variable: fct_reorder(f, x)
- order levels by frequency: fct_infreq(f)
- order by first appearance in data: fct_inorder(f)
- just reverse the current order: fct_rev(f)
- rename levels, not reorder them: fct_recode(f, new = "old")

## What fct_relevel() does

**`fct_relevel()` changes the order of a factor's levels without touching the data.** A factor stores its categories as an ordered set of levels, and by default R sorts those levels alphabetically. That alphabetical order is rarely the order you want in a plot, a model summary, or a table. `fct_relevel()` lets you override it.

The values in the factor stay exactly the same. Only the *level order* changes, which controls how the categories appear on chart axes, in regression output, and anywhere the factor is sorted. This matters most for two jobs: putting a logical sequence on an ordinal variable like `Low`, `Medium`, `High`, and setting the reference level for a regression model.

[KEY INSIGHT]
**Level order is metadata, not data.** A factor is a pair: the integer codes for each observation and the lookup table of level labels. `fct_relevel()` only rewrites the lookup table order and remaps the codes to match. No observation is added, dropped, or relabelled.

## fct_relevel() syntax

**`fct_relevel()` takes a factor, the levels to move, and an optional position.** The full signature is short:

```
fct_relevel(.f, ..., after = 0L)
```

- `.f` is a factor (a character vector is coerced to one).
- `...` is one or more level names to move, or a single function.
- `after` is the position the moved levels are inserted *after*. The default `0L` means the front.

```r title="Load forcats and build a factor"
library(forcats)

sizes <- factor(c("Medium", "Low", "High", "Low", "Medium"))
levels(sizes)
#> [1] "High"   "Low"    "Medium"
```

The levels came back alphabetically: `High`, `Low`, `Medium`. That is the order `fct_relevel()` will fix in the examples below.

## fct_relevel() examples

**Each example moves levels on the same `sizes` factor.** `fct_relevel()` always returns a new factor, so assign the result to keep it.

### 1. Move one level to the front

Naming a single level promotes it to first position. The rest keep their relative order.

```r title="Move one level to the front"
sizes2 <- fct_relevel(sizes, "Low")
levels(sizes2)
#> [1] "Low"    "High"   "Medium"
```

This is the pattern for setting a regression reference level: the first level becomes the baseline that other coefficients are compared against.

### 2. Set the full order explicitly

List every level in the order you want. This is the clearest option for ordinal data.

```r title="Reorder all levels at once"
sizes3 <- fct_relevel(sizes, "Low", "Medium", "High")
levels(sizes3)
#> [1] "Low"    "Medium" "High"
```

### 3. Insert a level at a chosen position

Use `after` to drop a level into a specific slot instead of the front. Here `after = 1` places `High` after the first remaining level.

```r title="Insert a level after position 1"
sizes4 <- fct_relevel(sizes, "High", after = 1)
levels(sizes4)
#> [1] "Low"    "High"   "Medium"
```

[TIP]
**Use `after = Inf` to send a level to the very end.** `fct_relevel(sizes, "Low", after = Inf)` produces `High`, `Medium`, `Low`. This is handy for pushing an "Other" or "Unknown" bucket to the bottom of a chart legend.

### 4. Reorder with a function

If you pass a function instead of level names, `fct_relevel()` applies it to the current level vector and uses the result as the new order.

```r title="Reverse the level order with a function"
sizes5 <- fct_relevel(sizes, rev)
levels(sizes5)
#> [1] "Medium" "Low"    "High"
```

## fct_relevel() vs other forcats ordering functions

**`fct_relevel()` is the manual option; the others derive order from the data.** Reach for `fct_relevel()` when you already know the order you want. When the order should follow a statistic or a count, a sibling function is a better fit.

| Function | Orders levels by | Use when |
|---|---|---|
| `fct_relevel()` | a manual specification | you know the exact order you want |
| `fct_reorder()` | another numeric variable | order should track a summary value |
| `fct_infreq()` | frequency (most common first) | the popular category should lead |
| `fct_inorder()` | order of first appearance | data already arrives in a meaningful sequence |
| `fct_rev()` | reversing the current order | you only need to flip the existing order |

The decision rule is simple: if a human picks the order, use `fct_relevel()`; if the data picks the order, use one of the others.

## Common pitfalls

**Pitfall 1: misspelling a level name.** `fct_relevel()` does not error on an unknown level. It emits a warning and leaves that level untouched, so a typo silently produces the wrong order.

```r title="A misspelled level is ignored with a warning"
sizes_typo <- fct_relevel(sizes, "low")
#> Warning: Unknown levels in `f`: low
levels(sizes_typo)
#> [1] "High"   "Low"    "Medium"
```

**Pitfall 2: expecting in-place modification.** `fct_relevel()` returns a new factor and never changes the original. If you forget to assign the result, the reorder is lost.

[WARNING]
**`after` counts positions among the levels that stay put.** It does not count the original level positions. With three levels, `after = 1` inserts the moved level into the second slot, regardless of where that level started. When in doubt, list every level explicitly instead of using `after`.

**Pitfall 3: confusing reordering with renaming.** `fct_relevel()` never changes a label. To rename a level, use `fct_recode()`; to merge several levels into one, use `fct_collapse()`.

## Try it yourself

**Try it:** The `ex_days` factor has its levels in alphabetical order. Reorder them to `Mon`, `Wed`, `Fri` and save the result to `ex_ordered`.

```r title="Your turn: set weekday order"
ex_days <- factor(c("Wed", "Mon", "Fri", "Mon"))
levels(ex_days)
#> [1] "Fri" "Mon" "Wed"

# Reorder levels to Mon, Wed, Fri
ex_ordered <- # your code here

levels(ex_ordered)
#> Expected: "Mon" "Wed" "Fri"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ordered <- fct_relevel(ex_days, "Mon", "Wed", "Fri")
levels(ex_ordered)
#> [1] "Mon" "Wed" "Fri"
```

**Explanation:** Listing every level by name gives `fct_relevel()` the complete target order. The factor values are unchanged; only the level lookup table is reordered.

</details>

## Related forcats functions

After `fct_relevel()`, these forcats functions cover the rest of factor-order work:

- `fct_reorder()`: order levels by a summary of another variable, ideal before plotting.
- `fct_infreq()`: order levels from most to least common.
- `fct_inorder()`: order levels by when each value first appears.
- `fct_rev()`: reverse the current level order in one call.
- `fct_recode()`: rename levels without changing their order.

For the bigger picture on how factors store and display categories, see the forcats reference at [forcats.tidyverse.org](https://forcats.tidyverse.org/reference/fct_relevel.html).

## FAQ

**What does fct_relevel do in R?**

`fct_relevel()` reorders the levels of a factor by hand. You pass the factor and the level names in the order you want, and it returns a new factor with that level order. The underlying observations are not changed, so it is safe to use purely for display and modelling purposes, such as fixing chart axis order.

**How do I move a factor level to the end with fct_relevel?**

Use the `after` argument set to `Inf`: `fct_relevel(f, "Other", after = Inf)` moves the `Other` level to the last position. Any finite `after` value inserts the level after that many remaining positions, so `after = 0` is the front and `after = Inf` is the back.

**What is the difference between fct_relevel and fct_reorder?**

`fct_relevel()` sets the level order manually from names you supply. `fct_reorder()` sets the order automatically from another variable, for example sorting groups by their median value. Use `fct_relevel()` for ordinal data with a known sequence, and `fct_reorder()` when you want bars or boxes sorted by a statistic.

**Does fct_relevel change the data values?**

No. `fct_relevel()` only changes the order of the level labels and remaps the integer codes to match. Every observation keeps the same category. This is why it is safe to apply right before plotting or modelling without affecting counts, means, or any other computed result.

**Can fct_relevel reorder levels without naming each one?**

Yes. Pass a function instead of level names and `fct_relevel()` applies it to the current level vector. `fct_relevel(f, sort)` sorts levels alphabetically and `fct_relevel(f, rev)` reverses them. This is useful when the rule is mechanical rather than a hand-picked sequence.
