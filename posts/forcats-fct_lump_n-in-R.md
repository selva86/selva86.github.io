---
title: "forcats fct_lump_n() in R: Keep the Top N Levels"
slug: forcats-fct_lump_n-in-R
description: "Learn forcats fct_lump_n() in R to keep the n most frequent factor levels and lump the rest into Other, with examples for weights, ties, and pitfalls."
keywords: "forcats fct_lump_n, fct_lump_n function R, forcats fct_lump_n examples, R lump factor levels, fct_lump_n top n levels, collapse factor levels R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_lump_n()|forcats fct_lump_n|forcats::fct_lump_n()|lump factor levels|keep top n factor levels"
auto_link_case_sensitive: true
target_keyword: forcats fct_lump_n
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_lump_n() in R: Keep the Top N Levels

<p class="lead">The forcats fct_lump_n() function keeps the n most common factor levels in R and collapses everything else into a single "Other" category, so you control exactly how many categories survive.</p>

[QUICK ANSWER]
fct_lump_n(x, n = 5)                        # keep the 5 most common levels
fct_lump_n(x, n = -3)                       # keep the 3 least common levels
fct_lump_n(x, n = 5, w = wt)                # rank levels by a weighted total
fct_lump_n(x, n = 4, other_level = "Misc")  # rename the catch-all bucket
fct_lump_n(x, n = 3, ties.method = "first") # break ties to keep exactly n
fct_count(fct_lump_n(x, n = 5))             # tally the lumped result

[DECISION TREE: Is fct_lump_n() the right tool?]
- keep the n most common levels: fct_lump_n(x, n = 5)
- keep levels above a frequency: fct_lump_prop(x, prop = 0.1)
- keep levels seen at least k times: fct_lump_min(x, min = 10)
- keep named levels by hand: fct_other(x, keep = c("a", "b"))
- merge levels into named groups: fct_collapse(x, big = c("a", "b"))
- order levels by frequency: fct_infreq(x)

## What fct_lump_n() does in one sentence

**fct_lump_n() keeps a fixed number of factor levels and lumps the rest into "Other".** It comes from the forcats package in the tidyverse. You pass a factor and an integer `n`, and the function keeps the `n` most frequent levels while merging every remaining level into one labelled bucket. Unlike `fct_lump_prop()`, which uses a frequency threshold, fct_lump_n() guarantees you think in whole categories: "show me the top 5".

## Syntax

**fct_lump_n() takes a factor and a count of levels to keep.** The signature is compact:

```r title="The fct_lump_n signature"
fct_lump_n(f, n, w = NULL, other_level = "Other",
           ties.method = c("min", "average", "first", "last", "random", "max"))
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to one (character, numeric, or logical).
- `n`: how many levels to keep. A positive `n` keeps the `n` most common levels; a negative `n` keeps the `n` least common and lumps the frequent head.
- `w`: an optional numeric weight vector, one value per observation. Levels are then ranked by summed weight rather than a plain row count.
- `other_level`: the name of the catch-all level. Defaults to `"Other"`.
- `ties.method`: how to rank levels whose counts tie near the `n` cutoff. One of `"min"`, `"average"`, `"first"`, `"last"`, `"random"`, or `"max"`; the default is `"min"`.

fct_lump_n() never drops rows. It only rewrites the `levels` attribute, so the result has the same length as the input and is safe to drop into a pipeline.

## fct_lump_n() examples

**Example 1 keeps the top three levels of a long-tailed factor.** The `relig` column of `gss_cat`, a survey dataset bundled with forcats, has 15 religion levels with a heavy tail.

```r title="Keep the top three religions"
library(forcats)
library(dplyr)

gss_cat |>
  mutate(top_relig = fct_lump_n(relig, n = 3)) |>
  count(top_relig, sort = TRUE)
#> # A tibble: 4 x 2
#>   top_relig      n
#>   <fct>      <int>
#> 1 Protestant 10846
#> 2 Catholic    5124
#> 3 None        3523
#> 4 Other       1990
```

The three largest religions stay named; the other twelve levels collapse into a single `Other` level holding 1,990 rows.

[KEY INSIGHT]
**fct_lump_n() answers a count question, not a threshold question.** When a chart axis or a model formula needs a known number of categories, `n` is the argument that delivers it. You ask for the top 3 and you get at most 3 named levels plus "Other", regardless of how the frequencies are distributed.

**Example 2 keeps the rarest levels with a negative `n`.** A negative value inverts the logic: it keeps the least common levels and lumps the frequent ones.

```r title="Keep the rarest levels with a negative n"
gss_cat |>
  mutate(rare_relig = fct_lump_n(relig, n = -3)) |>
  count(rare_relig, sort = TRUE)
#> # A tibble: 4 x 2
#>   rare_relig          n
#>   <fct>           <int>
#> 1 Other           21413
#> 2 Other eastern      32
#> 3 Native american    23
#> 4 Don't know         15
```

This is useful when the rare categories are the signal, such as unusual survey responses or uncommon error codes.

**Example 3 ranks levels by a weighted total instead of a row count.** Pass a numeric `w` so a level is judged by its summed weight, not how many rows carry it.

```r title="Rank levels by a weighted total"
animal <- c("cat", "cat", "dog", "dog", "dog", "fox", "owl")
spend  <- c(50, 50, 5, 5, 5, 200, 180)

# unweighted: ranked by row count
table(fct_lump_n(animal, n = 2))
#>
#>   cat   dog Other
#>     2     3     2

# weighted: ranked by summed spend
table(fct_lump_n(animal, n = 2, w = spend))
#>
#>   fox   owl Other
#>     1     1     5
```

By row count, `dog` and `cat` win. By spend, `fox` and `owl` win even though each appears just once, because their weights dominate.

**Example 4 renames the bucket and orders the result by frequency.** The default `"Other"` label reads poorly on a chart, and fct_lump_n() does not sort, so chain `fct_infreq()`.

```r title="Rename Other and order by frequency"
gss_cat |>
  mutate(party = fct_lump_n(partyid, n = 3, other_level = "Minor parties")) |>
  mutate(party = fct_infreq(party)) |>
  count(party)
#> # A tibble: 4 x 2
#>   party                n
#>   <fct>            <int>
#> 1 Minor parties    10184
#> 2 Independent       4119
#> 3 Not str democrat  3690
#> 4 Strong democrat   3490
```

[TIP]
**Lump first, then order with fct_infreq().** fct_lump_n() leaves the kept levels in their original order and appends "Other" last, so a bar chart looks unsorted. Wrapping the result in `fct_infreq()` ranks the bars by frequency in one extra step.

## fct_lump_n() vs the other fct_lump_*() functions

**fct_lump_n() is one of four variants, each naming a different keep rule.** Pick the variant whose rule matches the decision you actually want to make.

| Function | Keep rule | Example |
|---|---|---|
| fct_lump_n() | The `n` most common levels | `fct_lump_n(x, n = 5)` |
| fct_lump_prop() | Levels above a proportion | `fct_lump_prop(x, prop = 0.1)` |
| fct_lump_min() | Levels seen at least `min` times | `fct_lump_min(x, min = 10)` |
| fct_lump_lowfreq() | Only the rare tail, automatically | `fct_lump_lowfreq(x)` |

Use fct_lump_n() when you need a predictable category count, fct_lump_prop() when the cutoff should scale with the data, and fct_lump_min() when a raw frequency floor matters more than rank.

[NOTE]
**fct_lump_n() superseded the `n` argument of fct_lump().** Older code wrote `fct_lump(x, n = 5)`; recent forcats versions split that umbrella function into the explicit `fct_lump_n()`, `fct_lump_prop()`, and `fct_lump_min()` functions. Both still run, but `fct_lump_n(x, 5)` states the intent more clearly and is the recommended form for new code.

## Common pitfalls

**Ties at the cutoff can keep more than `n` levels.** With the default `ties.method = "min"`, every level tied at the cutoff count is kept, so asking for the top 2 can return three named levels.

```r title="Pitfall: ties keep more levels than n"
pets <- c("dog", "dog", "cat", "cat", "fox", "fox", "owl")
table(fct_lump_n(pets, n = 2))
#>
#>   cat   dog   fox Other
#>     2     2     2     1
```

To keep exactly `n`, pass a tie-breaking rule such as `ties.method = "first"`, which ranks tied levels by order of appearance.

```r title="Break ties to keep exactly n"
table(fct_lump_n(pets, n = 2, ties.method = "first"))
#>
#>   cat   dog Other
#>     2     2     3
```

[WARNING]
**An `n` larger than the level count does nothing, silently.** If `n` is bigger than the number of distinct levels, fct_lump_n() returns the factor unchanged with no "Other" level and no error or warning. A pipeline that assumed an "Other" level would exist then breaks downstream. Always confirm the factor actually has more than `n` levels before lumping.

```r title="Pitfall: n larger than the level count"
levels(fct_lump_n(pets, n = 10))
#> [1] "cat" "dog" "fox" "owl"
```

## Try it yourself

**Try it:** Collapse the `marital` column of `gss_cat` so only the 2 most common marital statuses remain, with everything else in "Other". Save the factor to `ex_marital`.

```r title="Your turn: lump gss_cat marital"
# Try it: keep the top 2 marital statuses
ex_marital <- # your code here

levels(ex_marital)
#> Expected: 2 status names plus "Other"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_marital <- fct_lump_n(gss_cat$marital, n = 2)
levels(ex_marital)
#> [1] "Married"       "Never married" "Other"
```

**Explanation:** fct_lump_n() ranks the marital levels by count, keeps the two most common ("Married" and "Never married"), and merges the remaining levels into a single "Other" level appended last.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_lump_n() for level management.**

- [fct_lump()](forcats-fct_lump-in-R.html): the umbrella lumping function that switches on `n`, `prop`, or a heuristic.
- [fct_infreq()](forcats-fct_infreq-in-R.html): order levels by frequency, the natural follow-up after lumping.
- [fct_other()](forcats-fct_other-in-R.html): keep or drop named levels explicitly instead of by rank.
- [fct_count()](forcats-fct_count-in-R.html): tabulate a factor to inspect what was lumped.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_lump.html) for the official documentation.

## FAQ

**What is the difference between fct_lump() and fct_lump_n()?**

They produce the same result for a count-based rule. `fct_lump(x, n = 5)` and `fct_lump_n(x, 5)` both keep the five most common levels and lump the rest. fct_lump() is the older umbrella function that changes behavior depending on whether you pass `n`, `prop`, or nothing. fct_lump_n() is the newer variant that names the rule directly. Recent forcats versions supersede fct_lump() in favor of fct_lump_n(), fct_lump_prop(), and fct_lump_min(), so new code reads more clearly with the explicit variant.

**How do I keep the top 5 categories of a factor in R?**

Call `fct_lump_n(x, n = 5)` on the factor. It keeps the five most frequent levels and collapses every other level into a single "Other" level. If you are working inside a data frame, combine it with `mutate()`: `df |> mutate(cat = fct_lump_n(cat, n = 5))`. To rank the levels by a summed value rather than a row count, pass a numeric weight vector through the `w` argument.

**Does fct_lump_n() always keep exactly n levels?**

Not always. When several levels tie at the count near the cutoff, the default `ties.method = "min"` keeps all of the tied levels, so the result can have more than `n` named levels. To force an exact count, pass `ties.method = "first"` or `"last"`, which break ties by order of appearance. Also, if the factor has `n` or fewer levels to begin with, fct_lump_n() returns it unchanged with no "Other" level.

**How do I rename the "Other" level created by fct_lump_n()?**

Pass the `other_level` argument with your preferred label, for example `fct_lump_n(x, n = 4, other_level = "Smaller groups")`. The catch-all level then carries that name instead of the default `"Other"`. This is worth doing whenever the factor will appear on a chart axis or in a report, where a generic "Other" reads poorly. The argument works identically across fct_lump_n(), fct_lump_prop(), and the other lumping variants.

**Can fct_lump_n() rank levels by a value other than count?**

Yes, through the `w` argument. Supply a numeric vector the same length as the factor, and fct_lump_n() ranks levels by their summed weight instead of how many rows they occupy. For example, ranking customers by total revenue rather than transaction count: `fct_lump_n(customer, n = 10, w = revenue)`. A level that appears rarely but carries large weights can then outrank a frequent, low-weight level.
