---
title: "forcats fct_unique() in R: List a Factor's Unique Levels"
slug: forcats-fct_unique-in-R
description: "Learn how forcats fct_unique() returns each level of an R factor exactly once in level order, and how it differs from base R unique(), with runnable examples."
keywords: "forcats fct_unique, fct_unique function R, forcats fct_unique examples, R unique factor values, fct_unique vs unique, unique factor levels R, forcats unique factor"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_unique()|forcats fct_unique|forcats::fct_unique()|unique factor values|unique factor levels"
auto_link_case_sensitive: true
target_keyword: forcats fct_unique
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_unique() in R: List a Factor's Unique Levels

<p class="lead">The forcats fct_unique() function returns each level of an R factor exactly once, in level order, giving you a clean factor of every value the variable can take.</p>

[QUICK ANSWER]
fct_unique(f)                          # every level once, in level order
fct_unique(factor(x))                  # coerce a vector first
fct_unique(ordered_f)                  # keeps the ordered factor class
unique(f)                              # base R: observed values, appearance order
levels(f)                              # level names as a character vector
as.character(fct_unique(f))            # level names as plain text
fct_unique(fct_drop(f))                # observed levels only

[DECISION TREE: Is fct_unique() the right tool?]
- list every level as a factor: fct_unique(f)
- get level names as a character vector: levels(f)
- keep observed values in appearance order: unique(f)
- count rows in each level: fct_count(f)
- remove levels with no observations: fct_drop(f)
- reorder levels by first appearance: fct_inorder(f)

## What fct_unique() does in one sentence

**fct_unique() returns a factor containing each level of its input exactly once, ordered by the level definition.** It comes from the forcats package, part of the tidyverse. For a factor, the set of possible unique values is the set of levels, so fct_unique() effectively hands back the levels as a factor object rather than as the plain character vector that `levels()` produces.

## Syntax

**The function takes a single argument: the factor to summarise.** The signature could not be shorter:

```r title="The fct_unique signature"
fct_unique(f)
```

The only argument is:

- `f`: a factor, or any vector that fct_unique() can coerce to a factor. Character, numeric, and logical vectors are converted for you, with levels created in sorted order.

The result is always a factor. It has one element per level, listed in the order the levels are stored, and it keeps the ordered status of the input. If the input contains any `NA` values, a trailing `NA` element is appended to the result.

## fct_unique() examples

**Example 1 returns the levels of a factor, in level order.** Load forcats and call fct_unique() on a small factor.

```r title="List the levels of a factor"
library(forcats)
sizes <- factor(c("M", "S", "L", "M", "S"), levels = c("S", "M", "L"))
fct_unique(sizes)
#> [1] S M L
#> Levels: S M L
```

The five observations collapse to one entry per level. The order is `S`, `M`, `L` because that is the order passed to `factor()`, not the order the values first appear in the data.

**Example 2 contrasts fct_unique() with base R unique().** The two functions answer different questions.

```r title="Compare fct_unique with base unique"
unique(sizes)
#> [1] M S L
#> Levels: S M L

fct_unique(sizes)
#> [1] S M L
#> Levels: S M L
```

`unique()` returns the distinct values in the order they appear: `M` is first in the data, then `S`, then `L`. fct_unique() ignores appearance order and follows the level order instead.

[KEY INSIGHT]
**fct_unique() is level-driven, unique() is data-driven.** unique() walks the data and reports values as it meets them. fct_unique() reads the level attribute and reports it directly. That is why fct_unique() can return a level that never appears in the data, while unique() can only return values it actually saw.

**Example 3 shows that fct_unique() keeps unused levels.** A factor can carry levels with zero observations.

```r title="fct_unique keeps unused levels"
grades <- factor(c("A", "A", "C"), levels = c("A", "B", "C", "D"))
fct_unique(grades)
#> [1] A B C D
#> Levels: A B C D
```

Levels `B` and `D` have no rows, yet fct_unique() still lists them. `unique(grades)` would return only `A` and `C`. This makes fct_unique() the right tool when you need the full set of allowed categories, such as building a complete axis for a chart.

**Example 4 confirms that ordered factors keep their class.** fct_unique() preserves the ordered attribute.

```r title="Ordered factors keep their class"
temp <- factor(c("Low", "High", "Low"),
               levels = c("Low", "Med", "High"), ordered = TRUE)
fct_unique(temp)
#> [1] Low  Med  High
#> Levels: Low < Med < High
```

The `<` signs in the printed levels confirm the result is still an ordered factor. The unused level `Med` appears in its correct ranked position between `Low` and `High`.

## fct_unique() vs other ways to list values

**Several functions report the distinct values of a variable, and each returns a different shape.** Pick by the output you need.

| Function | Returns | Use when |
|---|---|---|
| fct_unique() | A factor, one element per level | You want the levels as a factor, in order |
| unique() | Observed values, appearance order | You want only values present in the data |
| levels() | A character vector of level names | You need plain text, not a factor |
| fct_count() | A tibble of levels and counts | You also want how many rows each has |
| fct_drop() | A factor with unused levels removed | You want to discard empty levels |

The decision rule: reach for fct_unique() when you want every defined level as a factor object. Use `unique()` when only observed values matter, and `levels()` when you need a character vector to loop over or paste into labels.

[NOTE]
**Coming from Python pandas?** The equivalent of fct_unique() is the `.categories` attribute of a `pd.Categorical`, which lists every category whether or not it occurs. pandas `Series.unique()` matches base R `unique()` instead, reporting only observed values.

## Common pitfalls

**fct_unique() includes levels that never appear in the data.** If you expect only observed values, this surprises you.

```r title="Pitfall: drop unused levels first"
fct_unique(fct_drop(grades))
#> [1] A C
#> Levels: A C
```

Call `fct_drop()` before fct_unique() to discard empty levels, or use `unique()` if appearance order is acceptable.

[WARNING]
**fct_unique() appends NA when the factor contains missing values.** The result then has more elements than the factor has levels. The trailing `NA` is a value, not a level, so `levels()` of the result is unchanged.

```r title="Pitfall: NA is appended to the result"
with_na <- factor(c("x", "y", NA, "x"))
fct_unique(with_na)
#> [1] x    y    <NA>
#> Levels: x y
```

**fct_unique() returns a factor, not a character vector.** Passing it where text is expected can cause subtle bugs.

```r title="Pitfall: the result is still a factor"
class(fct_unique(sizes))
#> [1] "factor"
```

Wrap the call in `as.character()`, or use `levels()` directly, when you need plain strings for labels or joins.

## Try it yourself

**Try it:** Return every level of `factor(c("red", "blue", "red"), levels = c("red", "green", "blue"))` as a factor in level order. Save the result to `ex_colors`.

```r title="Your turn: list factor levels"
# Try it: list every level of the factor
ex_colors <- # your code here

ex_colors
#> Expected: red green blue
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_colors <- fct_unique(factor(c("red", "blue", "red"),
                               levels = c("red", "green", "blue")))
ex_colors
#> [1] red   green blue 
#> Levels: red green blue
```

**Explanation:** fct_unique() returns one element per level in level order, so `green` appears even though no observation uses it. The order follows the `levels` argument, not the data.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_unique() when working with factors.**

- [fct_count()](forcats-fct_count-in-R.html): count how many rows fall in each level.
- [fct_drop()](forcats-fct_drop-in-R.html): remove levels that have no observations.
- [fct_inorder()](forcats-fct_inorder-in-R.html): set level order to match first appearance.
- [fct_relevel()](forcats-fct_relevel-in-R.html): move chosen levels to a new position.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_unique.html) for the official documentation.

## FAQ

**What is the difference between fct_unique() and unique()?**

Both return the distinct values of a variable, but they read different things. `unique()` walks the data and reports values in the order it first meets them, so it returns only values that actually appear. fct_unique() reads the factor's level attribute and returns every level once, in level order, including levels with no observations. Use fct_unique() for the full set of defined categories and `unique()` when only observed values matter.

**Does fct_unique() return unused factor levels?**

Yes. fct_unique() lists every level defined on the factor, whether or not any row uses it. This is intentional: the levels describe the complete set of categories the variable can take. If you want only the levels that appear in the data, call `fct_drop()` first to remove empty levels, then pass the result to fct_unique(), or use base R `unique()` instead.

**How do I get factor levels as a character vector?**

fct_unique() returns a factor, not text. To get plain character strings, either call `levels(f)` directly, which always returns a character vector, or wrap the result with `as.character(fct_unique(f))`. The `levels()` route is simpler and faster when you just need the names. Use `as.character(fct_unique(f))` only when you specifically want the NA-aware ordering that fct_unique() applies.

**Does fct_unique() handle NA values?**

Yes. If the factor contains missing values, fct_unique() appends a single trailing `NA` to its result. The `NA` is a value in the returned factor, not a new level, so `levels()` of the result is unaffected. If you do not want the trailing `NA`, drop missing values from the factor before calling fct_unique(), or subset the result with `!is.na()`.
