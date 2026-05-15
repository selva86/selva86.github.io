---
title: "forcats fct_lump_prop() in R: Lump Rare Factor Levels"
slug: forcats-fct_lump_prop-in-R
description: "Learn forcats fct_lump_prop() in R to lump factor levels below a proportion into Other, with examples for negative prop, weighted shares, and pitfalls."
keywords: "forcats fct_lump_prop, fct_lump_prop function R, forcats fct_lump_prop examples, lump factor levels by proportion R, fct_lump_prop vs fct_lump_n, collapse rare factor levels R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_lump_prop()|forcats fct_lump_prop|forcats::fct_lump_prop()|lump factor levels by proportion|lump rare factor levels"
auto_link_case_sensitive: true
target_keyword: forcats fct_lump_prop
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_lump_prop() in R: Lump Rare Factor Levels

<p class="lead">The forcats fct_lump_prop() function lumps factor levels in R that appear below a proportion threshold into a single "Other" category, so the cutoff scales with your data instead of being a fixed count.</p>

[QUICK ANSWER]
fct_lump_prop(x, prop = 0.1)                       # keep levels above 10% of rows
fct_lump_prop(x, prop = 0.05)                      # stricter 5% threshold
fct_lump_prop(x, prop = -0.1)                      # keep the rare tail instead
fct_lump_prop(x, prop = 0.1, w = wt)               # rank levels by a weighted share
fct_lump_prop(x, prop = 0.1, other_level = "Misc") # rename the catch-all bucket
fct_count(fct_lump_prop(x, prop = 0.1))            # tally the lumped result

[DECISION TREE: Is fct_lump_prop() the right tool?]
- keep levels above a frequency share: fct_lump_prop(x, prop = 0.1)
- keep a fixed number of levels: fct_lump_n(x, n = 5)
- keep levels seen at least k times: fct_lump_min(x, min = 10)
- keep named levels by hand: fct_other(x, keep = c("a", "b"))
- merge levels into named groups: fct_collapse(x, big = c("a", "b"))
- order levels by frequency: fct_infreq(x)

## What fct_lump_prop() does in one sentence

**fct_lump_prop() collapses factor levels by their share of the data, not by a raw count.** It comes from the forcats package in the tidyverse. You pass a factor and a proportion `prop`, and the function keeps every level that appears more often than `prop` of the time while merging the rest into one labelled bucket. Because the threshold is a fraction, the same `prop = 0.05` rule means "below 5 percent" whether the factor has 100 rows or 100,000.

## Syntax

**fct_lump_prop() takes a factor and a proportion cutoff.** The signature has just four arguments:

```r title="The fct_lump_prop signature"
fct_lump_prop(f, prop, w = NULL, other_level = "Other")
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to one (character, numeric, or logical).
- `prop`: the proportion threshold, a number between -1 and 1. A positive `prop` keeps levels that appear *more* than `prop` of the time; a negative `prop` keeps levels that appear *less* than `-prop` of the time.
- `w`: an optional numeric weight vector, one value per observation. Each level's share is then its summed weight divided by the total weight, instead of a plain row proportion.
- `other_level`: the name of the catch-all level. Defaults to `"Other"`.

fct_lump_prop() never drops rows. It only rewrites the `levels` attribute, so the result has the same length as the input and slots straight into a pipeline.

## fct_lump_prop() examples

**Example 1 lumps every religion below 10 percent of survey responses.** The `relig` column of `gss_cat`, a dataset bundled with forcats, has 15 religion levels with a long tail.

```r title="Lump religions below 10 percent"
library(forcats)
library(dplyr)

gss_cat |>
  mutate(big_relig = fct_lump_prop(relig, prop = 0.10)) |>
  count(big_relig, sort = TRUE)
#> # A tibble: 4 x 2
#>   big_relig      n
#>   <fct>      <int>
#> 1 Protestant 10846
#> 2 Catholic    5124
#> 3 None        3523
#> 4 Other       1990
```

Only three religions clear the 10 percent line; the remaining twelve levels collapse into a single `Other` level holding 1,990 rows.

**Example 2 shows that `prop` judges share, not raw count.** A level with the exact same number of rows can survive in a small factor and get lumped in a large one.

```r title="The cutoff is a share, not a count"
rare_in_small <- rep(c("common", "rare"), times = c(10, 5))
rare_in_big   <- rep(c("common", "rare"), times = c(200, 5))

table(fct_lump_prop(rare_in_small, prop = 0.10))
#>
#> common   rare
#>     10      5
table(fct_lump_prop(rare_in_big, prop = 0.10))
#>
#> common  Other
#>    200      5
```

The `"rare"` level has 5 rows in both factors. In the small factor that is 33 percent and survives; in the big factor it is 2.4 percent and gets lumped.

[KEY INSIGHT]
**fct_lump_prop() answers a threshold question, not a count question.** When the business rule is "anything under 5 percent is noise", `prop` encodes that rule directly and keeps holding as the dataset grows. If instead you need a fixed number of categories for a chart axis or a model formula, that is a count question and `fct_lump_n()` is the right tool.

**Example 3 keeps the rare tail with a negative `prop`.** A negative value inverts the rule: it keeps the uncommon levels and lumps the frequent ones.

```r title="Negative prop keeps the rare tail"
pets <- rep(c("dog", "cat", "fox"), times = c(6, 3, 1))

# positive prop: keep the common levels
table(fct_lump_prop(pets, prop = 0.20))
#>
#>   cat   dog Other
#>     3     6     1

# negative prop: keep the rare levels
table(fct_lump_prop(pets, prop = -0.20))
#>
#>   fox Other
#>     1     9
```

With `prop = -0.20`, only `fox` appears in fewer than 20 percent of rows, so it stays named while `dog` and `cat` merge into `Other`. This is handy when the rare categories are the signal, such as unusual error codes or fraud flags.

**Example 4 ranks levels by a weighted share and renames the bucket.** Pass a numeric `w` so a level is judged by its summed weight rather than its row count.

```r title="Rank levels by a weighted share"
animal <- c("cat", "cat", "dog", "dog", "dog", "fox", "owl")
spend  <- c(50, 50, 5, 5, 5, 200, 180)

# unweighted: ranked by row share
table(fct_lump_prop(animal, prop = 0.25))
#>
#>   cat   dog Other
#>     2     3     2

# weighted: ranked by share of total spend
table(fct_lump_prop(animal, prop = 0.25, w = spend, other_level = "Minor"))
#>
#>   fox   owl Minor
#>     1     1     5
```

By row share, `cat` and `dog` win. By spend share, `fox` and `owl` dominate even though each appears once, and the catch-all carries the friendlier `Minor` label.

[TIP]
**Lump first, then order with fct_infreq().** fct_lump_prop() leaves the kept levels in their original order and appends "Other" last, so a bar chart looks unsorted. Wrapping the result in `fct_infreq()` ranks the bars by frequency in one extra step.

## fct_lump_prop() vs the other fct_lump_*() functions

**fct_lump_prop() is one of four lumping variants, each naming a different keep rule.** Pick the variant whose rule matches the decision you actually want to make.

| Function | Keep rule | Example |
|---|---|---|
| fct_lump_prop() | Levels above a proportion share | `fct_lump_prop(x, prop = 0.1)` |
| fct_lump_n() | The `n` most common levels | `fct_lump_n(x, n = 5)` |
| fct_lump_min() | Levels seen at least `min` times | `fct_lump_min(x, min = 10)` |
| fct_lump_lowfreq() | Only the rare tail, automatically | `fct_lump_lowfreq(x)` |

Use fct_lump_prop() when the cutoff should scale with the data, fct_lump_n() when you need a predictable category count, and fct_lump_min() when a raw frequency floor matters more than a share.

[NOTE]
**fct_lump_prop() superseded the `prop` argument of fct_lump().** Older code wrote `fct_lump(x, prop = 0.1)`; recent forcats versions split that umbrella function into the explicit `fct_lump_n()`, `fct_lump_prop()`, and `fct_lump_min()` functions. Both still run, but `fct_lump_prop(x, prop = 0.1)` states the intent more clearly and is the recommended form for new code.

## Common pitfalls

**`prop` is a fraction, not a percentage.** Passing `prop = 10` to mean "10 percent" sets the threshold to 1,000 percent. No level can clear that, so every level lumps into one `Other` bucket.

```r title="Pitfall: prop is a fraction not a percent"
table(fct_lump_prop(pets, prop = 10))
#>
#> Other
#>    10
```

Write `prop = 0.10` for a 10 percent cutoff. Values of `prop` always live between -1 and 1.

[WARNING]
**A moderately high `prop` can silently lump a level you wanted to keep.** With `prop = 0.5`, only a level holding an outright majority survives, so a substantial 30 percent category disappears into "Other" without any error or warning. Inspect the level shares with `fct_count(f, prop = TRUE)` before choosing a threshold.

```r title="Pitfall: a high prop drops a real category"
table(fct_lump_prop(pets, prop = 0.5))
#>
#>   dog Other
#>     6     4
```

Here `cat` is 30 percent of the data, a meaningful group, yet it merges into `Other` because it fell short of the 50 percent line.

## Try it yourself

**Try it:** Collapse the `relig` column of `gss_cat` so only religions appearing in more than 15% of responses stay named. Save the factor to `ex_relig`.

```r title="Your turn: lump gss_cat relig"
# Try it: keep religions above a 15% share
ex_relig <- # your code here

levels(ex_relig)
#> Expected: 3 religion names plus "Other"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_relig <- fct_lump_prop(gss_cat$relig, prop = 0.15)
levels(ex_relig)
#> [1] "None"       "Catholic"   "Protestant" "Other"
```

**Explanation:** fct_lump_prop() computes each religion's share of the 21,483 rows, keeps the three above 15% ("None", "Catholic", "Protestant"), and merges every remaining level into a single "Other" level appended last.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_lump_prop() for level management.**

- [fct_lump_n()](forcats-fct_lump_n-in-R.html): keep a fixed number of levels instead of a proportion.
- [fct_lump_min()](forcats-fct_lump_min-in-R.html): keep levels by a raw frequency floor.
- [fct_lump()](forcats-fct_lump-in-R.html): the umbrella lumping function that switches on `n`, `prop`, or a heuristic.
- [fct_infreq()](forcats-fct_infreq-in-R.html): order levels by frequency, the natural follow-up after lumping.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to working with factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_lump.html) for the official documentation.

## FAQ

**What does fct_lump_prop() do in R?**

fct_lump_prop() collapses the infrequent levels of a factor into a single "Other" category based on a proportion threshold. You give it a factor and a `prop` value, and it keeps every level whose share of the rows exceeds `prop`, merging the rest. Because the cutoff is a fraction of the data rather than a fixed count, the same rule keeps working as the dataset grows or shrinks. It is part of the forcats package in the tidyverse.

**What is the difference between fct_lump_prop() and fct_lump_n()?**

They answer different questions. fct_lump_prop() keeps every level above a proportion share, so the number of surviving levels depends on how the data is distributed. fct_lump_n() keeps a fixed count of the most common levels, so you always get at most `n` named levels plus "Other". Use fct_lump_prop() when the rule is "drop anything under 5 percent" and fct_lump_n() when a chart or model needs a known, predictable number of categories.

**How does a negative prop work in fct_lump_prop()?**

A negative `prop` inverts the keep rule. Instead of keeping the common levels, `fct_lump_prop(x, prop = -0.1)` keeps the levels that appear in fewer than 10 percent of rows and lumps the frequent ones into "Other". This is useful when the rare categories carry the signal you care about, such as uncommon survey answers, rare diagnoses, or anomalous error codes that you want to isolate from the bulk of the data.

**Why is fct_lump_prop() putting everything into "Other"?**

Almost always because `prop` is too high. Remember `prop` is a fraction between 0 and 1, so passing `prop = 10` instead of `prop = 0.10` sets an impossible 1,000 percent threshold and lumps every level. Even a valid value like `prop = 0.5` lumps any level without an outright majority. Check the level shares first with `fct_count(f, prop = TRUE)`, then pick a `prop` below the share you want to preserve.

**How do I rename the "Other" level from fct_lump_prop()?**

Pass the `other_level` argument with your preferred label, for example `fct_lump_prop(x, prop = 0.1, other_level = "Smaller groups")`. The catch-all level then carries that name instead of the default `"Other"`. This is worth doing whenever the factor appears on a chart axis or in a report, where a generic "Other" reads poorly. The `other_level` argument behaves identically across fct_lump_prop(), fct_lump_n(), and fct_lump_min().
</content>
</invoke>
