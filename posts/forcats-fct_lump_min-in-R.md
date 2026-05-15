---
title: "forcats fct_lump_min() in R: Lump Levels by Frequency Floor"
slug: forcats-fct_lump_min-in-R
description: "Learn forcats fct_lump_min() in R to keep factor levels seen at least min times and lump the rare tail into Other, with examples for weights and pitfalls."
keywords: "forcats fct_lump_min, fct_lump_min function R, forcats fct_lump_min examples, R lump rare factor levels, collapse factor levels by count, fct_lump_min vs fct_lump_n"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_lump_min()|forcats fct_lump_min|forcats::fct_lump_min()|lump rare factor levels|frequency floor"
auto_link_case_sensitive: true
target_keyword: forcats fct_lump_min
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_lump_min() in R: Lump Levels by Frequency Floor

<p class="lead">The forcats fct_lump_min() function keeps every factor level in R that appears at least <code>min</code> times and collapses the rarer levels into a single "Other" category, so a raw frequency floor decides which categories survive.</p>

[QUICK ANSWER]
fct_lump_min(x, min = 10)                       # keep levels seen >= 10 times
fct_lump_min(x, min = 100, w = wt)              # rank levels by summed weight
fct_lump_min(x, min = 10, other_level = "Misc") # rename the catch-all bucket
fct_lump_min(df$col, min = 5)                   # works on a data-frame column
fct_count(fct_lump_min(x, min = 10))            # tally the lumped result
fct_infreq(fct_lump_min(x, min = 10))           # order the lumped result

[DECISION TREE: Is fct_lump_min() the right tool?]
- keep levels seen at least k times: fct_lump_min(x, min = 10)
- keep a fixed number of levels: fct_lump_n(x, n = 5)
- keep levels above a proportion: fct_lump_prop(x, prop = 0.05)
- keep named levels by hand: fct_other(x, keep = c("a", "b"))
- merge levels into named groups: fct_collapse(x, grp = c("a", "b"))
- order levels by frequency: fct_infreq(x)

## What fct_lump_min() does in one sentence

**fct_lump_min() keeps factor levels that clear a count threshold and lumps the rest into "Other".** It comes from the forcats package in the tidyverse. You pass a factor and an integer `min`, and the function keeps every level seen at least `min` times while merging every rarer level into one labelled bucket. Unlike `fct_lump_n()`, which keeps a fixed number of levels, fct_lump_min() lets the data decide how many categories survive.

## Syntax

**fct_lump_min() takes a factor and a minimum count.** The signature is short and has no tie-breaking argument:

```r title="The fct_lump_min signature"
fct_lump_min(f, min, w = NULL, other_level = "Other")
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to one (character, numeric, or logical).
- `min`: the frequency floor. A level is kept when its count is greater than or equal to `min`; anything below the floor is lumped.
- `w`: an optional numeric weight vector, one value per observation. Levels are then judged by summed weight rather than a plain row count.
- `other_level`: the name of the catch-all level. Defaults to `"Other"`.

fct_lump_min() never drops rows. It only rewrites the `levels` attribute, so the result has the same length as the input and is safe to drop into a pipeline.

## fct_lump_min() examples

**Example 1 keeps the well-populated levels of a survey factor.** The `partyid` column of `gss_cat`, a dataset bundled with forcats, has ten political-affiliation levels with a thin tail.

```r title="Keep partyid levels seen 1000+ times"
library(forcats)
library(dplyr)

gss_cat |>
  count(party = fct_lump_min(partyid, min = 1000), sort = TRUE)
#> # A tibble: 8 x 2
#>   party                  n
#>   <fct>              <int>
#> 1 Independent         4119
#> 2 Not str democrat    3690
#> 3 Strong democrat     3490
#> 4 Not str republican  3032
#> 5 Ind,near dem        2499
#> 6 Strong republican   2314
#> 7 Ind,near rep        1791
#> 8 Other                548
```

Seven levels clear the floor of 1,000 rows. The three rare levels fall below it and collapse into a single `Other` level holding 548 rows.

[KEY INSIGHT]
**fct_lump_min() answers a "how rare is too rare" question, not a "how many" question.** When a category is meaningful only if it has enough observations to model or chart reliably, `min` encodes that minimum sample size directly. You do not pick a category count; you pick the smallest group you are willing to trust, and the data tells you how many survive.

**Example 2 makes the threshold concrete on a small vector.** A handful of letter grades shows exactly which counts pass and which get lumped.

```r title="Lump grades below a count of two"
grades <- c("A", "A", "A", "B", "B", "C", "D", "D", "D", "D", "F")

table(fct_lump_min(grades, min = 2))
#>
#>     A     B     D Other
#>     3     2     4     2
```

`A`, `B`, and `D` each appear at least twice and stay named. `C` and `F` appear once, so they merge into `Other`, which holds their two combined rows.

**Example 3 ranks levels by a weighted total instead of a row count.** Pass a numeric `w` so a level clears the floor on its summed weight, not how many rows carry it.

```r title="Apply the floor to a weighted total"
animal <- c("cat", "cat", "dog", "dog", "dog", "fox", "owl")
spend  <- c(50, 50, 5, 5, 5, 200, 180)

# unweighted: floor applies to row counts
table(fct_lump_min(animal, min = 2))
#>
#>   cat   dog Other
#>     2     3     2

# weighted: floor applies to summed spend
table(fct_lump_min(animal, min = 100, w = spend))
#>
#>   cat   fox   owl Other
#>     2     1     1     3
```

By row count, `cat` and `dog` clear a floor of 2. By spend, `dog` totals only 15 and gets lumped, while `fox` and `owl` survive on a single high-value row each.

**Example 4 renames the bucket and orders the result by frequency.** The default `"Other"` label reads poorly on a chart, and fct_lump_min() does not sort, so chain `fct_infreq()`.

```r title="Rename Other and order by frequency"
gss_cat |>
  mutate(party = fct_lump_min(partyid, min = 2500,
                              other_level = "Smaller groups")) |>
  mutate(party = fct_infreq(party)) |>
  count(party)
#> # A tibble: 5 x 2
#>   party                  n
#>   <fct>              <int>
#> 1 Smaller groups      7152
#> 2 Independent         4119
#> 3 Not str democrat    3690
#> 4 Strong democrat     3490
#> 5 Not str republican  3032
```

[TIP]
**Lump first, then order with fct_infreq().** fct_lump_min() leaves the kept levels in their original order and appends "Other" last, so a bar chart looks unsorted. Wrapping the result in `fct_infreq()` ranks the bars by frequency in one extra step.

## fct_lump_min() vs the other fct_lump_*() functions

**fct_lump_min() is one of four lumping variants, each naming a different keep rule.** Pick the variant whose rule matches the decision you actually want to make.

| Function | Keep rule | Example |
|---|---|---|
| fct_lump_min() | Levels seen at least `min` times | `fct_lump_min(x, min = 10)` |
| fct_lump_n() | The `n` most common levels | `fct_lump_n(x, n = 5)` |
| fct_lump_prop() | Levels above a proportion | `fct_lump_prop(x, prop = 0.1)` |
| fct_lump_lowfreq() | Only the rare tail, automatically | `fct_lump_lowfreq(x)` |

Use fct_lump_min() when a raw sample-size floor matters, fct_lump_n() when you need a predictable category count, and fct_lump_prop() when the cutoff should scale with the size of the data.

[NOTE]
**fct_lump_min() superseded part of the older fct_lump().** Early forcats code leaned on the single umbrella `fct_lump()`; recent versions split it into the explicit `fct_lump_n()`, `fct_lump_prop()`, `fct_lump_min()`, and `fct_lump_lowfreq()` functions. The umbrella still runs, but the named variants state intent more clearly and are the recommended form for new code.

## Common pitfalls

**An existing "Other" level absorbs the lumped rows silently.** If the factor already has a level named `"Other"`, fct_lump_min() merges the rare tail into it rather than creating a fresh bucket.

```r title="Pitfall: lumping merges into an existing Other"
gss_cat |>
  count(relig2 = fct_lump_min(relig, min = 100), sort = TRUE)
#> # A tibble: 9 x 2
#>   relig2                      n
#>   <fct>                   <int>
#> 1 Protestant              10846
#> 2 Catholic                 5124
#> 3 None                     3523
#> 4 Christian                 689
#> 5 Other                     553
#> 6 Jewish                    388
#> 7 Buddhism                  147
#> 8 Inter-nondenominational   109
#> 9 Moslem/islam              104
```

The `relig` factor already has an "Other" level with 224 rows. After lumping, it holds 553, because six rare levels quietly merged into it. Rename the bucket with `other_level` if that conflation would mislead a reader.

[WARNING]
**A `min` above every level count collapses the whole factor into one bucket.** If no level clears the floor, fct_lump_min() returns a factor with a single "Other" level and raises no error or warning. A pipeline that expected named categories then breaks downstream. Check the maximum level count before choosing `min`.

```r title="Pitfall: too high a floor lumps everything"
levels(fct_lump_min(grades, min = 100))
#> [1] "Other"
```

**The floor is inclusive, so a level exactly at `min` is kept.** fct_lump_min() keeps levels whose count is greater than or equal to `min`, not strictly greater. A `B` seen twice survives `min = 2` but is lumped at `min = 3`.

```r title="Pitfall: min is an inclusive floor"
"B" %in% levels(fct_lump_min(grades, min = 2))
#> [1] TRUE
"B" %in% levels(fct_lump_min(grades, min = 3))
#> [1] FALSE
```

## Try it yourself

**Try it:** Collapse the `marital` column of `gss_cat` so only marital statuses seen at least 5,000 times remain, with everything rarer in "Other". Save the factor to `ex_marital`.

```r title="Your turn: lump gss_cat marital"
# Try it: keep marital levels seen 5000+ times
ex_marital <- # your code here

levels(ex_marital)
#> Expected: the frequent statuses plus "Other"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_marital <- fct_lump_min(gss_cat$marital, min = 5000)
levels(ex_marital)
#> [1] "Divorced"      "Married"       "Never married" "Other"
```

**Explanation:** fct_lump_min() keeps each marital level whose count reaches 5,000 ("Divorced", "Married", "Never married") and merges the rarer levels ("No answer", "Separated", "Widowed") into a single "Other" level appended last.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_lump_min() for level management.**

- [fct_lump_n()](forcats-fct_lump_n-in-R.html): keep a fixed number of levels instead of a frequency floor.
- [fct_lump()](forcats-fct_lump-in-R.html): the umbrella lumping function that switches on `n`, `prop`, or a heuristic.
- [fct_infreq()](forcats-fct_infreq-in-R.html): order levels by frequency, the natural follow-up after lumping.
- [fct_other()](forcats-fct_other-in-R.html): keep or drop named levels explicitly instead of by count.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_lump.html) for the official documentation.

## FAQ

**What does fct_lump_min() do in R?**

fct_lump_min() collapses the rare levels of a factor into a single "Other" category. You give it a factor and an integer `min`, and it keeps every level seen at least `min` times while merging every rarer level into one bucket. The result has the same number of rows as the input; only the `levels` attribute changes. It suits any case where a category needs enough observations to be trustworthy.

**What is the difference between fct_lump_min() and fct_lump_n()?**

Both lump rare levels into "Other", but they use different keep rules. fct_lump_min() keeps every level whose count clears a frequency floor, so the number of surviving levels depends on the data. fct_lump_n() keeps a fixed count of levels, the `n` most common ones, regardless of how frequent they actually are. Use fct_lump_min() when a raw sample-size threshold matters and fct_lump_n() when you need a predictable number of categories.

**Does fct_lump_min() keep a level whose count equals min?**

Yes. The floor is inclusive: fct_lump_min() keeps levels whose count is greater than or equal to `min`, not strictly greater. A level seen exactly `min` times survives, and a level seen `min - 1` times is lumped. If you want a strict cutoff, set `min` one higher than the boundary count you want to exclude. This inclusive behavior is consistent across the forcats lumping variants.

**How do I rename the "Other" level created by fct_lump_min()?**

Pass the `other_level` argument with your preferred label, for example `fct_lump_min(x, min = 10, other_level = "Rare groups")`. The catch-all level then carries that name instead of the default `"Other"`. Renaming is especially important when the factor already has a level named "Other", because fct_lump_min() would otherwise merge the rare tail into that existing level and inflate its count without any warning.

**Can fct_lump_min() rank levels by a value other than count?**

Yes, through the `w` argument. Supply a numeric vector the same length as the factor, and fct_lump_min() compares each level's summed weight against `min` instead of its row count. For example, keeping products whose total revenue reaches a threshold: `fct_lump_min(product, min = 1000, w = revenue)`. A level that appears in few rows but carries large weights can then clear the floor, while a frequent low-weight level falls below it.
</content>
</invoke>
