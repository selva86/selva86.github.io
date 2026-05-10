---
title: "dplyr summarize vs summarise in R: Same Function"
slug: "dplyr-summarize-vs-summarise-in-R"
description: "Compare dplyr summarize() vs summarise() in R: same function, different spellings. Covers when to use each, style guide notes, .by, and 5 examples."
keywords: "dplyr summarize vs summarise, R summarise summarize, dplyr alias, summarise spelling, summarize American British, dplyr summary"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "summarize vs summarise|dplyr summarize|summarise spelling|British American summarise"
auto_link_case_sensitive: true
target_keyword: "dplyr summarize vs summarise"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr summarize vs summarise in R: Same Function

<p class="lead">In dplyr, <code>summarize()</code> (American spelling) and <code>summarise()</code> (British spelling) are EXACT ALIASES of the same function. Pick one and stick with it; both produce identical results.</p>

[QUICK ANSWER]
df |> summarise(avg = mean(x))           # British
df |> summarize(avg = mean(x))           # American (same function)
identical(summarise, summarize)           # TRUE
df |> group_by(g) |> summarise(avg = mean(x))
df |> summarise(.by = g, avg = mean(x))   # dplyr 1.1+ scoped grouping

[DECISION TREE: Which spelling to use?]
- tidyverse style guide: summarise (British)
- US-style codebases: summarize (American)
- consistency in your project: pick one and never mix

## What summarize / summarise does in one sentence

**`summarise(.data, ...)` and `summarize(.data, ...)` collapse rows into one (or more) per group, computing aggregations specified in `...`.** They are EXACT aliases — both are defined to point at the same internal function.

## Syntax

**Both spellings: identical signatures, identical behavior.**

```r title="Mean MPG per cylinder, two spellings"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg))

mtcars |>
  group_by(cyl) |>
  summarize(avg_mpg = mean(mpg))   # Same result
```

[TIP]
**The tidyverse style guide prefers `summarise` (British).** dplyr was written by Hadley Wickham (NZ-based), so British spelling is the canonical choice. American developers may prefer `summarize`; the function literally doesn't care.

## Five common patterns

### 1. Grouped aggregation

```r title="Per-group statistics"
mtcars |>
  group_by(cyl) |>
  summarise(
    n          = n(),
    mean_mpg   = mean(mpg),
    sd_mpg     = sd(mpg)
  )
```

### 2. Same with American spelling

```r title="summarize works identically"
mtcars |>
  group_by(cyl) |>
  summarize(
    n        = n(),
    mean_mpg = mean(mpg),
    sd_mpg   = sd(mpg)
  )
```

### 3. Modern .by syntax (dplyr 1.1+)

```r title="No group_by needed"
mtcars |>
  summarise(.by = cyl, avg = mean(mpg))
```

`summarize` with `.by` works the same way.

### 4. Both spellings can coexist (but don't mix)

```r title="Mixed spellings work but are bad style"
mtcars |>
  group_by(cyl) |>
  summarize(avg = mean(mpg)) |>      # American
  arrange(desc(avg))

# Same code, with summarise:
mtcars |>
  group_by(cyl) |>
  summarise(avg = mean(mpg)) |>      # British
  arrange(desc(avg))
```

### 5. Verify they're the same

```r title="Identical functions"
identical(dplyr::summarise, dplyr::summarize)
#> [1] TRUE
```

[KEY INSIGHT]
**Aliasing both spellings was a deliberate dplyr decision.** It avoids forcing one camp's preference on the other. The function's behavior is 100% identical regardless of which spelling you call.

## summarise() vs summarize() vs aggregate()

**Three "summarise" approaches in R.**

| Function | Package | Spelling |
|---|---|---|
| `summarise(...)` | dplyr | British |
| `summarize(...)` | dplyr | American |
| `aggregate(...)` | base R | n/a |

`summarise` and `summarize` are aliases. `aggregate` is the base R alternative; it has different syntax and is less pipe-friendly.

When to use which:

- `summarise` for tidyverse style.
- `summarize` for American teams.
- `aggregate` only when avoiding tidyverse dependency.

## A practical workflow

**Pick one spelling per project and stick with it.** Mixing the two within one codebase doesn't break anything but makes code review harder. Most tidyverse codebases use `summarise`; many enterprise R codebases use `summarize`.

```r
# Tidyverse style guide example:
df |>
  group_by(category) |>
  summarise(
    n        = n(),
    revenue  = sum(amount),
    avg      = mean(amount),
    .groups  = "drop"
  )
```

The lintr / styler tools generally don't enforce one spelling over the other.

## Common pitfalls

**Pitfall 1: searching code with the wrong spelling.** If you search for `summarise` and the codebase uses `summarize`, you miss results. Use a regex search: `summari[sz]e`.

**Pitfall 2: editor autocompletion lock-in.** Some IDEs autocomplete one spelling but not the other depending on which you type first. Be deliberate.

[WARNING]
**`summarise` and `summarize` BOTH have a `.by` argument in dplyr 1.1+.** Don't assume only one supports the modern features. They are exact aliases.

## Try it yourself

**Try it:** Compute mean mpg per cyl using BOTH summarise and summarize, then verify the results are identical. Save to `ex_check`.

```r title="Your turn: verify aliasing"
ex_a <- mtcars |> group_by(cyl) |> summarise(avg = mean(mpg))
ex_b <- mtcars |> group_by(cyl) |> summarize(avg = mean(mpg))

ex_check <- # your code here

ex_check
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_check <- identical(ex_a, ex_b)

ex_check
#> [1] TRUE
```

**Explanation:** Both spellings produce byte-identical results.

</details>

## Related dplyr functions

After mastering both spellings, look at:

- `reframe()`: variable-row-output cousin (1.1+)
- `mutate()`: per-row transformation
- `group_by()`: grouping context
- `.by`: scoped grouping (1.1+)
- `count()`: shortcut for group_by + summarise(n = n())

For most workflows, summarise/summarize is the workhorse — pick one and use it consistently.

## Why dplyr supports both spellings

**Hadley Wickham (dplyr's author) is from New Zealand and uses British spelling.** US users repeatedly asked for the American spelling. Adding both as aliases satisfies both camps with zero behavioral cost. This is a small but representative example of the tidyverse's openness to multiple regional preferences (the same pattern applies to `colour`/`color` in ggplot2).

## FAQ

**Is summarize the same as summarise in dplyr?**

Yes. They are exact aliases. `identical(dplyr::summarise, dplyr::summarize)` returns TRUE.

**Which spelling should I use?**

Personal preference. The tidyverse style guide uses summarise (British). American developers often prefer summarize. Pick one and be consistent within a project.

**Does the dplyr documentation use summarise or summarize?**

Both. The official dplyr help pages document `summarise` first with `summarize` listed as an alias.

**Can I mix both spellings in the same script?**

Yes, technically, but it's bad style. Mixing harms readability without any benefit. Pick one.

**Do other dplyr verbs have American spellings?**

Mostly no. `summarise/summarize` is the main aliased pair. Other functions like `select`, `mutate`, `filter` have only one spelling each.
