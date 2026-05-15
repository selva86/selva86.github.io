---
title: "forcats fct_other() in R: Collapse Levels Into Other"
slug: forcats-fct_other-in-R
description: "Learn forcats fct_other() in R to collapse rare factor levels into an Other category. Keep, drop, and lump levels with runnable, copy-paste code examples."
keywords: "forcats fct_other, fct_other function R, forcats fct_other examples, R fct_other factor levels, collapse factor levels R, lump factor levels other, recode rare levels R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_other()|forcats fct_other|forcats::fct_other()|lump factor levels|collapse factor levels"
auto_link_case_sensitive: true
target_keyword: "forcats fct_other"
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_other() in R: Collapse Levels Into Other

<p class="lead">forcats fct_other() in R collapses the factor levels you do not name into a single "Other" group, using either a <code>keep</code> list or a <code>drop</code> list. It is the manual counterpart to the automatic fct_lump() family.</p>

[QUICK ANSWER]
fct_other(f, keep = c("a", "b"))            # keep these, rest -> Other
fct_other(f, drop = c("c", "d"))            # drop these to Other, rest kept
fct_other(f, keep = top, other_level = "X") # custom Other label
fct_other(f, keep = levels(f)[1:3])         # keep the first 3 levels
df |> mutate(g = fct_other(g, keep = top))  # inside a dplyr pipeline
fct_count(fct_other(f, keep = top))         # tally with the Other bucket

[DECISION TREE: Is fct_other() the right tool?]
- keep or drop levels you name: fct_other(f, keep = c("a","b"))
- lump rarest levels automatically: fct_lump_n(f, n = 5)
- lump levels below a share: fct_lump_prop(f, prop = 0.1)
- rename levels, not collapse them: fct_recode(f, new = "old")
- merge several levels into one: fct_collapse(f, big = c("a","b"))
- reorder levels by frequency: fct_infreq(f)

## What fct_other() does

**forcats fct_other() collapses unwanted factor levels into one bucket.** You hand it a factor and tell it which levels matter, and every other level is rewritten to a single catch-all level named `"Other"`. The result stays a factor, so it drops straight into plots, models, and `dplyr` summaries.

Unlike the `fct_lump()` family, `fct_other()` never guesses. You decide which levels survive by name. That makes it the right tool when domain knowledge, not frequency, dictates the grouping.

## Syntax

**fct_other() takes one factor and exactly one of `keep` or `drop`.** The full signature is short:

```r title="The fct_other signature"
fct_other(f, keep, drop, other_level = "Other")
```

The arguments behave like this:

| Argument | What it does |
|---|---|
| `f` | The factor (or character vector) to modify. |
| `keep` | Character vector of level names to keep. Everything else becomes `other_level`. |
| `drop` | Character vector of level names to push into `other_level`. Everything else is kept. |
| `other_level` | The label for the catch-all level. Defaults to `"Other"`. |

You must supply `keep` **or** `drop`, never both and never neither. The `other_level` is always appended last in the level ordering, which keeps "Other" out of the way when you plot or sort.

[NOTE]
**Coming from base R?** `fct_other()` replaces a verbose `levels(f)[!levels(f) %in% keep] <- "Other"` assignment. The forcats version is one call, handles the level ordering, and never mutates the original object.

## Examples by use case

**Run these examples top to bottom.** Each block builds on a shared session, so objects created earlier stay available in the ones that follow.

### Keep only the levels you want

**Pass a `keep` vector to whitelist levels.** Any level not in the list is rewritten to `"Other"`.

```r title="Keep selected levels with fct_other"
library(forcats)

f <- factor(c("a", "a", "b", "c", "d", "e"))
fct_other(f, keep = c("a", "b"))
#> [1] a     a     b     Other Other Other
#> Levels: a b Other
```

Levels `c`, `d`, and `e` collapse into `Other`, while `a` and `b` keep their original labels and order.

### Drop specific levels into Other

**Pass a `drop` vector to blacklist levels.** This is the inverse of `keep`: the named levels go to `"Other"` and the rest stay untouched.

```r title="Drop selected levels into Other"
fct_other(f, drop = c("d", "e"))
#> [1] a     a     b     c     Other Other
#> Levels: a b c Other
```

Use `drop` when you only need to remove a couple of nuisance levels and `keep` when most levels should disappear.

### Rename the Other bucket

**Set `other_level` to give the bucket a meaningful name.** A label like `"Other faiths"` reads better on a chart axis than a bare `"Other"`. The example below uses `gss_cat`, the survey dataset bundled with forcats.

```r title="Custom Other label on real data"
relig2 <- fct_other(
  gss_cat$relig,
  keep = c("Protestant", "Catholic", "None"),
  other_level = "Other faiths"
)
fct_count(relig2)
#> # A tibble: 4 x 2
#>   f                n
#>   <fct>        <int>
#> 1 None          3523
#> 2 Catholic      5124
#> 3 Protestant   10846
#> 4 Other faiths  1990
```

All twelve minor religion levels merge into the single `Other faiths` level with 1,990 rows.

### Use fct_other() inside a dplyr pipeline

**Wrap fct_other() in `mutate()` to clean a column in place.** This is the most common production use: collapse a high-cardinality factor right before a `count()` or a plot.

```r title="fct_other inside a dplyr mutate"
library(dplyr)

gss_cat |>
  mutate(party = fct_other(partyid,
                           keep = c("Strong republican", "Strong democrat"))) |>
  count(party)
#> # A tibble: 3 x 2
#>   party                 n
#>   <fct>             <int>
#> 1 Strong republican  2314
#> 2 Strong democrat    3490
#> 3 Other             15679
```

The eight moderate party levels collapse into `Other`, leaving a clean three-level factor for charts.

## fct_other() vs fct_lump and friends

**fct_other() groups by name; the fct_lump() family groups by frequency.** Reach for `fct_other()` when you can list the levels that matter. Reach for a `fct_lump_*` function when you want the data to decide.

| Function | Groups by | You specify |
|---|---|---|
| `fct_other()` | Levels you name | Exact names to `keep` or `drop` |
| `fct_lump_n()` | Frequency rank | How many levels survive (`n`) |
| `fct_lump_prop()` | Share of rows | Minimum proportion to survive (`prop`) |
| `fct_lump_min()` | Raw count | Minimum count to survive (`min`) |
| `fct_collapse()` | Manual mapping | A new group name per set of levels |

[KEY INSIGHT]
**Naming beats counting when the grouping is a decision, not a discovery.** If a stakeholder says "show me Married and Never married, bucket the rest," that is a fixed business rule. `fct_other(keep = ...)` encodes it exactly. `fct_lump_n()` would silently change the output the moment the data shifts.

## Common pitfalls

**1. Supplying both `keep` and `drop`.** forcats rejects this immediately. The call below errors with "Must supply exactly one of `keep` and `drop`":

```r title="This errors: keep and drop together"
fct_other(f, keep = "a", drop = "b")
#> Error in `fct_other()`:
#> ! Must supply exactly one of `keep` and `drop`.
```

**2. Misspelling a level name.** A typo in `keep` is not an error. The misspelled level simply fails to match and gets swept into `Other`, so a wrong result ships silently. Always check spelling against `levels(f)`.

**3. Reusing an existing level name.** If your data already has a level called `"Other"` and you set `other_level = "Other"`, the real and collapsed values merge into one level. Pick a distinct `other_level` when an `"Other"` category already exists.

## Try it yourself

**Try it:** Collapse `gss_cat$marital` so only `Married` and `Never married` survive, and label the rest `Not in those two`. Save the result to `ex_marital`.

```r title="Your turn: collapse marital status"
# Try it: keep two levels, rename the rest
ex_marital <- # your code here

fct_count(ex_marital)
#> Expected: 3 rows, with the renamed bucket last
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_marital <- fct_other(
  gss_cat$marital,
  keep = c("Married", "Never married"),
  other_level = "Not in those two"
)
fct_count(ex_marital)
#> # A tibble: 3 x 2
#>   f                    n
#>   <fct>            <int>
#> 1 Never married     5416
#> 2 Married          10117
#> 3 Not in those two  5950
```

**Explanation:** `keep` whitelists the two levels of interest. The remaining four marital levels collapse into the custom `other_level`, which forcats appends last.

</details>

## Related forcats functions

These functions pair well with `fct_other()` when you reshape categorical data:

- [fct_lump_n()](forcats-fct_lump_n-in-R.html) keeps the *n* most common levels automatically.
- [fct_lump_prop()](forcats-fct_lump_prop-in-R.html) lumps levels below a share of the data.
- [fct_collapse()](forcats-fct_collapse-in-R.html) merges named levels into several new groups.
- [fct_recode()](forcats-fct_recode-in-R.html) renames levels without collapsing them.
- [fct_count()](forcats-fct_count-in-R.html) tallies levels so you can verify the result.

For the wider picture, see the guide to [categorical data in R](Categorical-Data-in-R.html) and the official [forcats reference](https://forcats.tidyverse.org/reference/fct_other.html).

## FAQ

**What is the difference between fct_other() and fct_lump()?**
`fct_other()` collapses levels you name explicitly through `keep` or `drop`. The `fct_lump()` family collapses levels by frequency, such as the rarest ones or those below a proportion. Use `fct_other()` when a business rule fixes the grouping, and `fct_lump_*` when you want the data's distribution to drive it. Both return a factor with an `Other` level appended last.

**Can fct_other() use both keep and drop at the same time?**
No. forcats requires exactly one of `keep` or `drop` per call and raises an error if you pass both or neither. The two arguments are complementary views of the same operation: `keep` whitelists levels, `drop` blacklists them. If you need both behaviors, run `fct_other()` twice or restructure the level list so a single argument covers it.

**How do I rename the "Other" category in fct_other()?**
Set the `other_level` argument to any string, for example `fct_other(f, keep = top, other_level = "All other")`. The label appears as a normal factor level and sorts last by default. A descriptive label such as `"Other regions"` reads better than the generic `"Other"` on chart axes and in tables.

**Does fct_other() work on character vectors?**
Yes. If you pass a character vector, forcats coerces it to a factor first, then applies the collapsing. The return value is always a factor, never a character vector. To keep code explicit, wrap the input in `factor()` yourself before calling `fct_other()`.

**How do I move "Other" to a specific position?**
`fct_other()` always appends `other_level` last. To reposition it, chain a reordering function such as `fct_relevel()` afterward, for example `fct_relevel(result, "Other", after = 0)` to push it to the front. This is common when a plot legend should list "Other" first or last regardless of the data.
