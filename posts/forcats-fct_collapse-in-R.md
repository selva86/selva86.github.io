---
title: "forcats fct_collapse() in R: Merge Factor Levels by Group"
slug: forcats-fct_collapse-in-R
description: "Learn forcats fct_collapse() in R to merge several factor levels into new named groups. Combine, rename, and bucket levels with runnable code examples."
keywords: "forcats fct_collapse, fct_collapse function R, forcats fct_collapse examples, R collapse factor levels, group factor levels R, merge factor levels R, recode factor levels"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_collapse()|forcats fct_collapse|forcats::fct_collapse()|collapse factor levels|merge factor levels"
auto_link_case_sensitive: true
target_keyword: "forcats fct_collapse"
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_collapse() in R: Merge Factor Levels by Group

<p class="lead">forcats fct_collapse() in R merges several named factor levels into new, fewer groups in a single call. You pass it a factor and one named argument per output group, and it rewrites every listed level to that group's name.</p>

[QUICK ANSWER]
fct_collapse(f, new = c("a", "b"))             # merge a and b into new
fct_collapse(f, x = c("a","b"), y = "c")       # several groups at once
fct_collapse(f, big = grp, other_level = "X")  # bucket unnamed levels into X
fct_collapse(f, kept = "a")                    # rename one level, keep rest
df |> mutate(g = fct_collapse(g, lo = "a"))    # inside a dplyr pipeline
fct_count(fct_collapse(f, lo = "a"))           # tally the collapsed factor

[DECISION TREE: Is fct_collapse() the right tool?]
- merge named level sets into new groups: fct_collapse(f, new = c("a","b"))
- collapse every unnamed level into Other: fct_other(f, keep = top)
- lump rare levels automatically: fct_lump_n(f, n = 5)
- rename levels one-to-one: fct_recode(f, new = "old")
- reorder levels, not merge them: fct_relevel(f, "a")
- tally levels before grouping: fct_count(f)

## What fct_collapse() does

**fct_collapse() performs a many-to-few mapping on factor levels.** You give it a factor and one named argument for each group you want in the result. Every level you list under a name is rewritten to that name, so a dozen messy levels become three or four meaningful ones.

This is the manual, many-group counterpart to `fct_other()`. Where `fct_other()` produces exactly one catch-all bucket, `fct_collapse()` lets you define as many target groups as you need in the same call. The return value is always a factor, ready for plots, models, and `dplyr` summaries.

## Syntax

**fct_collapse() takes a factor plus one named argument per output group.** The signature is short:

```r title="The fct_collapse signature"
fct_collapse(.f, ..., other_level = NULL)
```

The arguments behave like this:

| Argument | What it does |
|---|---|
| `.f` | The factor (or character vector) to modify. |
| `...` | Named arguments. Each name is a new group; its value is a character vector of old levels to merge. |
| `other_level` | Optional label for a catch-all group. Every level not named in `...` is collapsed into it. |

Each `...` name becomes a level in the output. A level you do not mention anywhere stays unchanged unless you set `other_level`, in which case it joins the catch-all group.

[NOTE]
**Coming from base R?** `fct_collapse()` replaces a chain of `levels(f)[levels(f) %in% c("a","b")] <- "new"` assignments. The forcats version handles every group in one call, manages level ordering, and never mutates the original factor.

## Examples by use case

**Run these examples top to bottom.** Each block builds on a shared session, so objects created earlier stay available in the blocks that follow.

### Merge level sets into new groups

**Pass one named argument per group to define the mapping.** Here six month abbreviations collapse into two quarters.

```r title="Merge months into quarters"
library(forcats)

f <- factor(c("Jan", "Feb", "Mar", "Apr", "May", "Jun"))
fct_collapse(f, Q1 = c("Jan", "Feb", "Mar"), Q2 = c("Apr", "May", "Jun"))
#> [1] Q1 Q1 Q1 Q2 Q2 Q2
#> Levels: Q1 Q2
```

The names `Q1` and `Q2` become the new levels, and each appears where its first member sat in the original ordering.

### Collapse a real survey factor

**fct_collapse() shines on high-cardinality survey data.** The `gss_cat$partyid` factor bundled with forcats has ten levels. The call below folds them into three political groups and leaves the rest alone.

```r title="Collapse partyid into three groups"
partyid2 <- fct_collapse(gss_cat$partyid,
  Republican  = c("Strong republican", "Not str republican"),
  Democrat    = c("Strong democrat", "Not str democrat"),
  Independent = c("Ind,near rep", "Independent", "Ind,near dem"))

fct_count(partyid2)
#> # A tibble: 6 x 2
#>   f               n
#>   <fct>       <int>
#> 1 No answer     154
#> 2 Don't know      1
#> 3 Other party   393
#> 4 Republican   5346
#> 5 Independent  8409
#> 6 Democrat     7180
```

The three minor levels (`No answer`, `Don't know`, `Other party`) survive untouched because they were never named.

### Bucket the leftover levels with other_level

**Set `other_level` to sweep every unnamed level into one group.** This combines a precise mapping with a single catch-all in the same call.

```r title="Use other_level for the remainder"
partyid3 <- fct_collapse(gss_cat$partyid,
  Republican  = c("Strong republican", "Not str republican"),
  Democrat    = c("Strong democrat", "Not str democrat"),
  Independent = c("Ind,near rep", "Independent", "Ind,near dem"),
  other_level = "Other")

fct_count(partyid3)
#> # A tibble: 4 x 2
#>   f               n
#>   <fct>       <int>
#> 1 Republican   5346
#> 2 Independent  8409
#> 3 Democrat     7180
#> 4 Other         548
```

[TIP]
**Reach for `other_level` when leftover levels would clutter a chart.** Without it, the three minor partyid levels stay as separate slivers. With it, they merge into a tidy `Other` group of 548 rows that sorts last.

### Use fct_collapse() inside a dplyr pipeline

**Wrap fct_collapse() in `mutate()` to clean a column in place.** This is the most common production use: simplify a factor right before a `count()` or a plot.

```r title="fct_collapse inside a dplyr mutate"
library(dplyr)

gss_cat |>
  mutate(status = fct_collapse(marital,
                    Single  = c("Never married", "Separated",
                                "Divorced", "Widowed"),
                    Married = "Married",
                    other_level = "Unknown")) |>
  count(status)
#> # A tibble: 3 x 2
#>   status      n
#>   <fct>   <int>
#> 1 Single  11349
#> 2 Married 10117
#> 3 Unknown    17
```

The six marital levels collapse into a clean three-level factor that drops straight into a bar chart.

## fct_collapse() vs fct_recode and friends

**fct_collapse() merges many levels into few; the alternatives each solve a narrower problem.** Choosing the right one keeps your code readable and your intent obvious.

| Function | What it does | You specify |
|---|---|---|
| `fct_collapse()` | Merges named level sets into new groups | One named vector per output group |
| `fct_recode()` | Renames levels one-to-one | A new name for each old level |
| `fct_other()` | Collapses unnamed levels into one bucket | A `keep` or `drop` list |
| `fct_lump_n()` | Lumps rare levels by frequency | How many levels to keep (`n`) |
| `fct_relevel()` | Reorders levels without merging | The desired level order |

[KEY INSIGHT]
**Use fct_collapse() when one new level absorbs several old ones.** If every old level maps to exactly one new name, that is a rename, so reach for `fct_recode()`. The moment two or more old levels share a single new name, the operation is a collapse, and `fct_collapse()` expresses it in one readable call.

## Common pitfalls

**1. Expecting unnamed levels to disappear.** A level you never mention stays in the result unchanged. If you want the remainder gone, set `other_level` so they collapse into a catch-all instead of lingering:

```r title="Unnamed levels are kept, not dropped"
fct_collapse(f, Half1 = c("Jan", "Feb", "Mar"))
#> [1] Half1 Half1 Half1 Apr   May   Jun
#> Levels: Half1 Apr May Jun
```

**2. Misspelling an old level name.** A typo is not a hard error, but forcats warns and leaves the real level uncollapsed, so a wrong result can ship if you ignore the warning:

```r title="A typo triggers a warning"
fct_collapse(f, Half1 = c("Jan", "Febuary", "Mar"))
#> Warning: Unknown levels in `.f`: Febuary
```

**3. Using the deprecated `group_other` argument.** Older code passed `group_other = TRUE` to bucket the remainder. Modern forcats deprecates it. Use `other_level = "Other"` instead, which also lets you choose the label.

## Try it yourself

**Try it:** Collapse `gss_cat$rincome` so the three highest brackets become `High` and the rest collapse into `Other`. Save the result to `ex_income`.

```r title="Your turn: collapse income brackets"
# Try it: merge three levels, bucket the rest
ex_income <- # your code here

fct_count(ex_income)
#> Expected: 2 rows, High and Other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_income <- fct_collapse(gss_cat$rincome,
  High = c("$25000 or more", "$20000 - 24999", "$15000 - 19999"),
  other_level = "Other")
fct_count(ex_income)
#> # A tibble: 2 x 2
#>   f          n
#>   <fct>  <int>
#> 1 High   13412
#> 2 Other   8071
```

**Explanation:** The named `High` argument merges the three top brackets, and `other_level` sweeps every remaining level into a single `Other` group.

</details>

## Related forcats functions

These functions pair well with `fct_collapse()` when you reshape categorical data:

- [fct_recode()](forcats-fct_recode-in-R.html) renames levels one-to-one without merging them.
- [fct_other()](forcats-fct_other-in-R.html) collapses every unnamed level into a single Other bucket.
- [fct_lump_n()](forcats-fct_lump_n-in-R.html) lumps the rarest levels automatically by frequency.
- [fct_relevel()](forcats-fct_relevel-in-R.html) reorders levels after you collapse them.
- [fct_count()](forcats-fct_count-in-R.html) tallies levels so you can verify the result.

For the wider picture, see the guide to [categorical data in R](Categorical-Data-in-R.html) and the official [forcats reference](https://forcats.tidyverse.org/reference/fct_collapse.html).

## FAQ

**What is the difference between fct_collapse() and fct_recode()?**
`fct_recode()` renames levels one-to-one: each old level maps to exactly one new name. `fct_collapse()` merges many levels into few: you list several old levels under one new group name. If two or more old levels should share a single label, use `fct_collapse()`. If every level just needs a cleaner name, `fct_recode()` is the simpler choice. Both return a factor and leave the original untouched.

**How do I collapse the levels I did not name?**
Set the `other_level` argument. Any level not listed in a named group collapses into a catch-all level with that label, for example `other_level = "Other"`. Without `other_level`, unnamed levels stay in the result unchanged. This makes `other_level` the clean way to combine a precise mapping with a single remainder bucket in one call.

**Does fct_collapse() work on character vectors?**
Yes. If you pass a character vector, forcats coerces it to a factor first and then applies the collapsing. The return value is always a factor, never a character vector. To keep your code explicit, wrap the input in `factor()` yourself before the call so the level set is clear to anyone reading it.

**Why does fct_collapse() warn about unknown levels?**
The warning means a level name you passed inside `...` does not exist in the factor, usually because of a typo. forcats reports it as `Unknown levels in .f` and leaves the genuine level uncollapsed. Check the names against `levels(f)` and fix the spelling. The warning is easy to miss in a long script, so treat it as a real error.

**Can fct_collapse() merge levels into more than one group at once?**
Yes, that is its main purpose. Pass one named argument per output group, such as `Republican = c(...)`, `Democrat = c(...)`. Each name becomes a level in the result, and every old level you list under it is rewritten to that name. This many-group capability is what separates `fct_collapse()` from `fct_other()`, which always produces a single Other bucket.
</content>
</invoke>
