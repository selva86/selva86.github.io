---
title: "forcats fct_lump() in R: Collapse Rare Factor Levels"
slug: forcats-fct_lump-in-R
description: "Learn how forcats fct_lump() collapses rare factor levels into an Other category in R, with runnable examples for n, prop, weights, and ggplot2 charts."
keywords: "forcats fct_lump, fct_lump function R, forcats fct_lump examples, R collapse factor levels, lump rare factor levels R, fct_lump_n, fct_lump vs fct_lump_n"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_lump()|forcats fct_lump|forcats::fct_lump()|lump factor levels|collapse rare factor levels"
auto_link_case_sensitive: true
target_keyword: forcats fct_lump
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_lump() in R: Collapse Rare Factor Levels

<p class="lead">The forcats fct_lump() function collapses rare factor levels in R into a single "Other" category, turning a long-tailed factor into a tidy handful of groups.</p>

[QUICK ANSWER]
fct_lump(x)                          # auto-lump rare levels into "Other"
fct_lump(x, n = 5)                   # keep the 5 most common levels
fct_lump(x, prop = 0.1)              # keep levels above 10% frequency
fct_lump(x, n = -3)                  # lump the 3 most common, keep the rest
fct_lump(x, w = weights)             # rank levels by weighted counts
fct_lump(x, other_level = "Misc")    # rename the catch-all bucket
fct_lump_min(x, min = 10)            # keep levels seen at least 10 times

[DECISION TREE: Is fct_lump() the right tool?]
- collapse rare levels into "Other": fct_lump(x, n = 5)
- merge named levels by hand: fct_collapse(x, big = c("a", "b"))
- keep named levels, lump the rest: fct_other(x, keep = c("a", "b"))
- recode levels one to one: fct_recode(x, new = "old")
- drop unused empty levels: fct_drop(x)
- order levels by frequency: fct_infreq(x)

## What fct_lump() does in one sentence

**fct_lump() collapses a factor's infrequent levels into a single "Other" level.** It comes from the forcats package, part of the tidyverse. A categorical column with dozens of rare values, such as product names or cities, is hard to chart and model. fct_lump() keeps the levels that matter and sweeps the long tail into one labelled bucket, controlled by a count (`n`), a proportion (`prop`), or an automatic heuristic.

## Syntax

**fct_lump() takes a factor plus one rule for how many levels to keep.** The signature is short:

```r title="The fct_lump signature"
fct_lump(f, n, prop, w = NULL, other_level = "Other",
         ties.method = c("min", "average", "first", "last", "random"))
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to one (character, numeric, or logical).
- `n`: keep the `n` most common levels and lump the rest. A negative `n` flips it, lumping the `n` most common and keeping the rare tail.
- `prop`: keep levels that appear at least proportion `prop` of the time. A negative `prop` lumps the common levels instead.
- `w`: an optional numeric weight vector, one value per observation, so levels are ranked by summed weight rather than a plain row count.
- `other_level`: the name of the catch-all level. Defaults to `"Other"`.
- `ties.method`: how to break ties when two levels share a count near the `n` cutoff.

Supply either `n` or `prop`, never both. With neither, fct_lump() uses a heuristic that lumps the least common levels as long as the "Other" level stays the smallest.

## fct_lump() examples

**Example 1 shows the automatic heuristic with no `n` or `prop`.** Load forcats and call fct_lump() on a vector with a clear long tail.

```r title="Collapse rare levels automatically"
library(forcats)
x <- c("a", "a", "a", "a", "a", "b", "b", "b", "b", "c", "d", "e")
table(fct_lump(x))
#> 
#>     a     b Other 
#>     5     4     3
```

The rare levels `c`, `d`, and `e` (one each) merge into `Other`, which totals 3. fct_lump() stopped there because lumping `b` as well would make `Other` larger than the levels it kept.

**Example 2 keeps a fixed number of levels with `n`.** This is the most common use: a bar chart or model needs a manageable count of categories.

```r title="Keep the top levels with n"
library(dplyr)
mpg |>
  mutate(maker = fct_lump(manufacturer, n = 3)) |>
  count(maker, sort = TRUE)
#> # A tibble: 4 x 2
#>   maker          n
#>   <fct>      <int>
#> 1 Other        136
#> 2 dodge         37
#> 3 toyota        34
#> 4 volkswagen    27
```

The three busiest manufacturers stay named; the other twelve collapse into `Other`.

[KEY INSIGHT]
**fct_lump() rewrites the levels, it never drops rows.** Every observation keeps a value, so the row count of `mpg` is unchanged. What changes is the `levels` attribute: twelve sparse categories become one. That is why fct_lump() is safe to drop into a pipeline ahead of `count()`, `ggplot2`, or a model formula.

**Example 3 keeps levels above a frequency threshold with `prop`.** Use `prop` when the cutoff should scale with the data instead of a hard count.

```r title="Keep levels above a frequency threshold"
levels(fct_lump(mpg$manufacturer, prop = 0.1))
#> [1] "dodge"      "ford"       "toyota"     "volkswagen" "Other"
```

`prop = 0.1` keeps any manufacturer that makes up at least 10 percent of the 234 rows. Four brands clear the bar; the rest become `Other`.

**Example 4 renames the catch-all bucket with `other_level`.** The default label `"Other"` is generic, so set a name that reads well on a chart axis or in a report.

```r title="Rename the catch-all bucket"
mpg |>
  mutate(maker = fct_lump(manufacturer, n = 4, other_level = "Smaller brands")) |>
  count(maker, sort = TRUE)
#> # A tibble: 5 x 2
#>   maker              n
#>   <fct>          <int>
#> 1 Smaller brands   111
#> 2 dodge             37
#> 3 toyota            34
#> 4 volkswagen        27
#> 5 ford              25
```

[TIP]
**Lump first, then order with fct_infreq().** Call `fct_infreq(fct_lump(x, n = 5))` so the chart shows the five named bars ranked tallest to shortest, with the `Other` bar wherever its total lands. The two functions are designed to chain.

## fct_lump() vs the fct_lump_*() family

**fct_lump() is the umbrella; the fct_lump_*() variants each expose one rule.** Reach for the variant that names the rule you want.

| Function | What it keeps | Example |
|---|---|---|
| fct_lump_n() | The `n` most common levels | `fct_lump_n(x, n = 5)` |
| fct_lump_prop() | Levels above a proportion | `fct_lump_prop(x, prop = 0.1)` |
| fct_lump_min() | Levels seen at least `min` times | `fct_lump_min(x, min = 10)` |
| fct_lump_lowfreq() | Only the rare tail, automatically | `fct_lump_lowfreq(x)` |

[NOTE]
**fct_lump() is superseded, not deprecated.** Recent forcats versions split it into the explicit fct_lump_n(), fct_lump_prop(), fct_lump_min(), and fct_lump_lowfreq() functions. fct_lump() still works and remains widely used, but new code reads more clearly with the specific variant: `fct_lump_n(x, 5)` says exactly what `fct_lump(x, n = 5)` does.

## Common pitfalls

**fct_lump() rejects `n` and `prop` supplied together.** The two arguments are competing rules, so passing both is an error rather than a silent choice.

```r title="Pitfall: n and prop are mutually exclusive"
fct_lump(mpg$manufacturer, n = 3, prop = 0.1)
#> Error in `fct_lump()`:
#> ! Must supply only one of `n` and `prop`.
```

Pick one rule: use `n` for a fixed number of bars, `prop` for a frequency cutoff that scales with the data.

**The "Other" bucket can outgrow every level you keep.** When you lump aggressively, the catch-all sums many small levels and can become the single largest category.

```r title="Pitfall: Other dominates after heavy lumping"
sort(table(fct_lump(mpg$manufacturer, n = 2)), decreasing = TRUE)
#> 
#> Other  dodge toyota 
#>   163     37     34
```

With `n = 2`, `Other` holds 163 of 234 rows and dwarfs the two named brands.

[WARNING]
**A dominant "Other" level distorts both charts and models.** A bar chart then leads with a meaningless "Other" bar, and a model treats a grab-bag category as if it were coherent. Raise `n`, switch to fct_lump_min() with a sensible threshold, or lump by `prop` so the cutoff tracks the data.

## Try it yourself

**Try it:** Collapse the `manufacturer` column of `mpg` so only the 5 most common brands remain, with everything else in "Other". Save the factor to `ex_makers`.

```r title="Your turn: lump mpg manufacturers"
# Try it: keep the top 5 manufacturers
ex_makers <- # your code here

levels(ex_makers)
#> Expected: 5 brand names plus "Other"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_makers <- fct_lump(mpg$manufacturer, n = 5)
levels(ex_makers)
#> [1] "chevrolet"  "dodge"      "ford"       "toyota"     "volkswagen"
#> [6] "Other"
```

**Explanation:** fct_lump() ranks the levels by count, keeps the five most common manufacturers, and merges the remaining ten into a single "Other" level. The kept levels stay in alphabetical order, with "Other" appended last.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_lump() for level management.**

- [fct_other()](forcats-fct_other-in-R.html): keep or drop named levels explicitly, lumping the rest into "Other".
- [fct_collapse()](forcats-fct_collapse-in-R.html): merge groups of levels into named categories by hand.
- [fct_recode()](forcats-fct_recode-in-R.html): rename levels one by one.
- [fct_infreq()](forcats-fct_infreq-in-R.html): order levels by frequency, a natural follow-up after lumping.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_lump.html) for the official documentation.

## FAQ

**What is the difference between fct_lump() and fct_lump_n()?**

They do the same job with different ergonomics. `fct_lump(x, n = 5)` and `fct_lump_n(x, 5)` both keep the five most common levels and lump the rest. fct_lump() is the older umbrella function that switches behavior based on which argument you pass. fct_lump_n() is the newer variant that names the rule directly. Recent forcats versions supersede fct_lump() in favor of the explicit fct_lump_n(), fct_lump_prop(), and fct_lump_min() functions, so new code reads better with the variant.

**How do I rename the "Other" category created by fct_lump()?**

Pass the `other_level` argument with the label you want, for example `fct_lump(x, n = 4, other_level = "Smaller brands")`. The catch-all level then carries your name instead of the default `"Other"`. This is worth doing whenever the factor will appear on a chart axis or in a report, where a generic "Other" reads poorly. The argument works the same way across fct_lump_n(), fct_lump_prop(), and the other variants.

**Does fct_lump() work on character vectors?**

Yes. fct_lump() accepts a factor or any vector that can be coerced to one, including character, numeric, and logical vectors. When you pass a character vector, fct_lump() converts it to a factor first, then returns a factor with the rare levels collapsed. The original values are preserved for the levels that are kept. If you need the result back as plain text, wrap the call in `as.character()`.

**How do I keep the rarest levels instead of the most common?**

Pass a negative `n` or `prop`. The call `fct_lump(x, n = -3)` lumps the three most common levels into "Other" and keeps the rare tail untouched. Likewise `fct_lump(x, prop = -0.1)` lumps any level above 10 percent frequency. This inversion is useful when the frequent categories are the noise and the rare ones are the signal, such as flagging unusual error codes or uncommon transactions.
