---
title: "forcats fct_explicit_na() in R: Make NA an Explicit Level"
slug: "forcats-fct_explicit_na-in-R"
description: "Learn forcats fct_explicit_na() in R to turn NA in a factor into a visible level so missing data shows in tables and plots. Examples and the modern replacement."
keywords: "forcats fct_explicit_na, fct_explicit_na function R, forcats fct_explicit_na examples, R factor NA level, fct_explicit_na deprecated, fct_na_value_to_level R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_explicit_na()|forcats fct_explicit_na|forcats::fct_explicit_na()|explicit NA level|fct_explicit_na"
auto_link_case_sensitive: true
target_keyword: "forcats fct_explicit_na"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_explicit_na() in R: Make NA an Explicit Level

<p class="lead">The forcats <code>fct_explicit_na()</code> function turns NA values in a factor into a named, visible level. Missing data then appears as its own category in tables, counts, and plots instead of being silently dropped.</p>

[QUICK ANSWER]
fct_explicit_na(f)                            # NA becomes "(Missing)"
fct_explicit_na(f, na_level = "Unknown")      # custom missing label
table(fct_explicit_na(f))                     # NA now gets a count
levels(fct_explicit_na(f))                    # "(Missing)" added last
fct_na_value_to_level(f, level = "Unknown")   # modern replacement
fct_explicit_na(factor(c("a", NA)))           # works on any factor

[DECISION TREE: Is fct_explicit_na() the right tool?]
- make NA a visible factor level: fct_explicit_na(f)
- count NAs without changing data: sum(is.na(f))
- drop unused levels instead: fct_drop(f)
- combine rare levels into one: fct_collapse(f, big = c("a", "b"))
- rename an existing level label: fct_recode(f, new = "old")
- replace NA in a numeric column: tidyr::replace_na(x, 0)

## What fct_explicit_na() does

**`fct_explicit_na()` converts missing values in a factor into a real level.** A factor stores each observation as an integer code that points into a table of level labels. An `NA` value has no code at all, so it belongs to no level. This function assigns those gaps a code and adds a matching label to the level table.

The effect is purely about visibility. Before the call, `NA` is a silent gap that most summary functions ignore. After the call, the missing observations belong to a level named `(Missing)` by default, and every function that respects factor levels now treats them as a genuine category.

This matters most for reporting. `table()` skips `NA` unless you ask for it, and `ggplot2` drops or footnotes missing categories. Making `NA` explicit forces missing data into the open where a reader can see how much of it there is.

[KEY INSIGHT]
**Missing data you can see is missing data you can fix.** A silent `NA` quietly shrinks every count and bar without warning. Promoting it to a level keeps the totals honest: the `(Missing)` count is a built-in data-quality check that travels with the factor into every downstream table and chart.

## fct_explicit_na() syntax

**`fct_explicit_na()` takes the factor and one optional label argument.** The signature is short:

```
fct_explicit_na(f, na_level = "(Missing)")
```

- `f` is a factor. A character vector is accepted and coerced to a factor first.
- `na_level` is the label given to the new level. It defaults to the string `"(Missing)"`. The parentheses are intentional, sorting the level apart from ordinary words.

The function returns a factor the same length as `f`. The new level is appended as the last entry of the level table, so existing level order is never disturbed.

[NOTE]
**`fct_explicit_na()` is superseded as of forcats 1.0.0.** It still works and is not going away, but new code should prefer `fct_na_value_to_level()`. The two do the same job; the comparison section below shows the swap.

## fct_explicit_na() examples

**Start with a factor that contains a missing value.** Load forcats and build a small ratings factor so the gap is easy to spot.

```r title="Load forcats and create a factor"
library(forcats)

ratings <- factor(c("good", "bad", NA, "good", "bad", NA))
ratings
#> [1] good bad  <NA> good bad  <NA>
#> Levels: bad good
```

The two `<NA>` entries have no level. The level table lists only `bad` and `good`.

**Call `fct_explicit_na()` to give those gaps a level.** With no second argument, the new level is labelled `(Missing)`.

```r title="Turn NA into an explicit level"
fct_explicit_na(ratings)
#> [1] good      bad       (Missing) good      bad       (Missing)
#> Levels: bad good (Missing)
```

The `<NA>` markers are gone. Every observation now belongs to a named level, and `(Missing)` sits last in the table.

**Pass `na_level` to control the label.** A report-friendly name often reads better than the default.

```r title="Use a custom missing label"
fct_explicit_na(ratings, na_level = "Not rated")
#> [1] good      bad       Not rated good      bad       Not rated
#> Levels: bad good Not rated
```

**See the payoff in a frequency table.** Plain `table()` ignores `NA`; after the conversion, the missing rows get counted.

```r title="Count missing values in a table"
table(ratings)
#> ratings
#>  bad good
#>    2    2

table(fct_explicit_na(ratings))
#>
#>       bad      good (Missing)
#>         2         2         2
```

The first table hides four observations across two `NA` rows. The second accounts for all six.

## fct_explicit_na() vs fct_na_value_to_level() and base R

**The modern replacement is `fct_na_value_to_level()`.** It was introduced in forcats 1.0.0 to supersede `fct_explicit_na()`. The behaviour is identical; only the argument name changes from `na_level` to `level`.

```r title="Modern replacement for fct_explicit_na"
fct_na_value_to_level(ratings, level = "(Missing)")
#> [1] good      bad       (Missing) good      bad       (Missing)
#> Levels: bad good (Missing)
```

Base R can do the same job with `addNA()`, but the result is rougher. `addNA()` adds a literal `NA` level rather than a named one, which prints as `<NA>` and is awkward to reference in code.

| Approach | Missing label | Recommended |
|---|---|---|
| `fct_explicit_na(f)` | Named, default `(Missing)` | Superseded, still safe |
| `fct_na_value_to_level(f)` | Named, default `NA` then set via `level` | Yes, current API |
| `addNA(f)` | Literal `<NA>` level | Only without forcats |

Use `fct_na_value_to_level()` for new code. Reach for `fct_explicit_na()` only when you maintain an older script that already depends on it.

## Common pitfalls

**The string `"NA"` is not a missing value.** `fct_explicit_na()` only catches true `NA`. A factor level whose label is the text `"NA"` is an ordinary category and is left untouched. Inspect the data with `is.na()` first if counts look wrong.

**The new level lands last, not first.** `(Missing)` is appended to the end of the level table. If a plot or model needs it elsewhere, follow up with `fct_relevel()` to move it into position.

**Character vectors are coerced silently.** Passing a plain character vector works because forcats converts it to a factor for you. That is convenient but hides the conversion, so wrap input in `factor()` yourself when you want the level set to be explicit and predictable.

## Try it yourself

**Try it:** Take the factor `survey` below, which has two missing values. Convert the `NA` entries into a level labelled `"No response"` and save the result to `ex_survey`.

```r title="Your turn: make NA explicit"
survey <- factor(c("yes", NA, "no", "yes", NA))

# Try it: label the NA values "No response"
ex_survey <- # your code here

ex_survey
#> Expected: 3 levels including "No response"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
survey <- factor(c("yes", NA, "no", "yes", NA))
ex_survey <- fct_explicit_na(survey, na_level = "No response")
levels(ex_survey)
#> [1] "no"          "yes"         "No response"
```

**Explanation:** The `na_level` argument names the new level. The two `NA` entries are reassigned to `"No response"`, which is appended after the existing `no` and `yes` levels.

</details>

## Related forcats functions

**`fct_explicit_na()` sits in the forcats family of level-management helpers.** These functions pair well with it when cleaning categorical data:

- `fct_drop()` removes levels that have zero observations.
- `fct_expand()` adds empty levels you expect but the data lacks.
- `fct_recode()` renames level labels one by one.
- `fct_collapse()` merges several levels into a single group.
- `fct_count()` returns a tidy table of level frequencies, including the new `(Missing)` level.

## FAQ

**Is fct_explicit_na() deprecated?**

Not deprecated, but superseded. As of forcats 1.0.0, `fct_explicit_na()` is marked superseded, which means it still works, runs without a warning, and will keep being maintained. The forcats team simply recommends `fct_na_value_to_level()` for new code. Existing scripts that call `fct_explicit_na()` do not need to change, but switching is a small, safe edit.

**What is the default missing label in fct_explicit_na()?**

The default is the string `"(Missing)"`, parentheses included. The parentheses are deliberate: they make the level visually distinct from ordinary category labels and push it to a predictable spot when levels are sorted. Override the default at any time with the `na_level` argument, for example `fct_explicit_na(f, na_level = "Unknown")`.

**Does fct_explicit_na() work on character vectors?**

Yes. If you pass a character vector, forcats coerces it to a factor before adding the missing level. The conversion is silent, so the return value is always a factor even when the input was not. For predictable level ordering, it is cleaner to call `factor()` on the input yourself first.

**Why don't my NA values show up in ggplot bar charts?**

`ggplot2` treats `NA` as a missing category and either drops it or prints a removed-rows message. Converting the column with `fct_explicit_na()` before plotting turns `NA` into a real level, so it draws as its own bar. This is the most common reason to reach for the function in a visualization workflow.

**What is the difference between fct_explicit_na() and fct_na_value_to_level()?**

They do the same thing: both turn `NA` into a named factor level. `fct_na_value_to_level()` is the current function and uses the argument `level`; `fct_explicit_na()` is the superseded older function and uses `na_level`. Output is identical for the same input. Choose `fct_na_value_to_level()` for new work and keep `fct_explicit_na()` only in legacy code.
