---
title: "stringr str_dup() in R: Repeat a String N Times"
slug: "stringr-str_dup-in-R"
description: "Use stringr str_dup() in R to repeat a string a fixed number of times. Build separator lines and indentation, with 5 examples, a comparison table, and pitfalls."
keywords: "stringr str_dup, str_dup function R, stringr str_dup examples, R repeat string, duplicate string R, str_dup vs strrep, R string repeat"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_dup()|stringr str_dup|stringr::str_dup()|repeat a string|str_dup function"
auto_link_case_sensitive: true
target_keyword: "stringr str_dup"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_dup() in R: Repeat a String N Times

<p class="lead">stringr str_dup() repeats each element of a character vector a fixed number of times and concatenates the copies into one string. It is vectorised, NA aware, and accepts a per-element repeat count, which makes it the standard tool for building separator lines, indentation, and simple text bars.</p>

[QUICK ANSWER]
str_dup("ab", 3)                # "ababab" repeat 3 times
str_dup("-", 20)                # a 20-dash separator line
str_dup(" ", 4)                 # "    " a 4-space indent
str_dup(c("a", "b"), 2)         # "aa" "bb" vectorised
str_dup(c("a", "b"), c(2, 3))   # "aa" "bbb" times varies per element
str_dup("ab", 0)                # "" zero repeats give an empty string
str_dup(NA, 3)                  # NA stays NA (NA-safe)
str_dup("=", n)                 # build a divider n characters wide

[DECISION TREE: Is str_dup() the right tool?]
- repeat one string n times: str_dup("ab", 3)
- join several different strings: str_c("a", "b", "c")
- pad a string to a fixed width: str_pad(x, 10, pad = "0")
- shorten strings past a length: str_trunc(x, 10)
- repeat without a package: strrep("ab", 3)
- collapse a vector into one string: str_flatten(x)

## What str_dup() does in one sentence

**str_dup(string, times) returns a copy of each input element repeated and joined together `times` times.** It works element-wise on a character vector, propagates NA inputs as NA outputs, and accepts a `times` vector so each element can be repeated a different number of times.

Use str_dup() whenever you need a value made of one repeated unit: a row of dashes for a console rule, a block of spaces for indentation, or a string of symbols for a quick text bar. It is the counterpart to str_c(), which joins several different strings rather than repeating one.

```r title="Load stringr and repeat a vector"
library(stringr)

x <- c("ab", "-", NA)
str_dup(x, times = 3)
#> [1] "ababab" "---"    NA
```

Each element is repeated three times, and the NA input stays NA.

## Syntax

**str_dup(string, times) takes just two arguments.** The first is the character vector to repeat and the second is the number of repeats. There are no side or separator options, so the result is always the input copies pasted directly together.

```r title="Function signature and defaults"
# str_dup(string, times)
#
# string : character vector to repeat
# times  : whole number of times to repeat each element
```

Because str_dup() is vectorised, `times` can itself be a vector. When it is, each element of `string` is repeated by the matching element of `times`.

```r title="Give each element its own repeat count"
str_dup(c("a", "b", "c"), times = c(1, 2, 3))
#> [1] "a"   "bb"  "ccc"
```

Each element is repeated by its matching count, all in a single call.

[NOTE]
**str_dup() is the repeat-one-string counterpart to str_c().** Where str_c() joins several different strings end to end, str_dup() takes a single string and concatenates copies of it. For padding a string to a fixed width instead of repeating it, reach for str_pad().

## Five common str_dup() scenarios

**Five scenarios cover almost every real use of str_dup().** Each block stands alone so you can paste it straight into the live console.

### Build a separator line

**The most common use of str_dup() is drawing a divider rule.** Repeat a single character to the width you want.

```r title="Build a divider line"
str_dup("-", 30)
#> [1] "------------------------------"
```

Thirty dashes form a clean horizontal rule for console output or reports.

### Indent text with repeated spaces

**str_dup() builds indentation by repeating a space.** Combine the result with str_c() to prefix any line.

```r title="Create an indent with repeated spaces"
indent <- str_dup(" ", 4)
str_c(indent, "nested item")
#> [1] "    nested item"
```

The four-space block can be reused for every nested line, which keeps indentation uniform.

### Repeat a column inside a data frame

**Most repeating happens inside a tidyverse pipeline.** Pass a numeric column as `times` to repeat a marker per row.

```r title="Repeat a string column with mutate"
library(dplyr)
df <- tibble(level = c(1, 2, 3))
df |> mutate(bullet = str_dup(">", level))
#> # A tibble: 3 x 2
#>   level bullet
#>   <dbl> <chr>
#> 1     1 >
#> 2     2 >>
#> 3     3 >>>
```

Each row gets a `bullet` whose length matches its `level`, which is handy for outline-style displays.

### Draw a simple text bar

**Repeating a symbol by a count produces a quick text bar chart.** This needs no plotting package at all.

```r title="Draw text bars from counts"
counts <- c(5, 2, 8)
str_dup("#", counts)
#> [1] "#####"    "##"       "########"
```

Each bar is as long as its count, so a glance at the strings shows the relative sizes.

### Repeat a multi-character unit

**str_dup() repeats whole strings, not just single characters.** Pass a multi-character unit to build a patterned line.

```r title="Repeat a multi-character unit"
str_dup("=-", 5)
#> [1] "=-=-=-=-=-"
```

The two-character unit `"=-"` is repeated five times to produce a ten-character patterned rule.

[KEY INSIGHT]
**str_dup() turns a count into a length.** Because the result string is exactly `times` units long, the output length encodes a number visually. That is what makes str_dup() the engine behind text bars, progress indicators, and width-driven separators: the count you pass becomes something you can see.

## str_dup() vs strrep() vs paste()

**Three functions can repeat a string, but they differ in source and ergonomics.** Picking the right one is mostly about whether you want a package dependency.

```r title="Three ways to repeat a string"
str_dup("ab", 3)
#> [1] "ababab"
strrep("ab", 3)
#> [1] "ababab"
paste(rep("ab", 3), collapse = "")
#> [1] "ababab"
```

| Function | Source | Vectorised | Best for |
|---|---|---|---|
| `str_dup(x, 3)` | stringr | yes | repeating inside tidyverse pipelines |
| `strrep(x, 3)` | base R | yes | repeating with no package dependency |
| `paste(rep(x, 3), collapse = "")` | base R | no | one-off repeats, but more verbose |

Reach for str_dup() when you are already using stringr and want a consistent string toolkit, and use base R `strrep()` when you want the same behaviour without loading a package.

[TIP]
**str_dup() and strrep() are interchangeable for plain repeats.** They return identical results, so a stringr pipeline can drop to base `strrep()` with no behaviour change. Pick one per project and stay consistent rather than mixing both.

## Common pitfalls

**Three pitfalls cause most str_dup() surprises.** Each has a one-line fix.

### Confusing str_dup() with str_c()

**str_dup() repeats one string; str_c() joins several different ones.** Mixing them up is the most common mistake.

```r title="str_dup repeats, str_c joins"
str_dup("ab", 3)
#> [1] "ababab"
str_c("a", "b", "c")
#> [1] "abc"
```

Use str_dup() when the input is a single repeated unit, and use str_c() when you are assembling distinct pieces into one string.

### Mismatched lengths in a vectorised call

**When both `string` and `times` are vectors, their lengths must be compatible.** A length that is neither equal nor one raises a recycling error.

```r title="Mismatched lengths raise a recycling error"
str_dup(c("a", "b", "c"), times = c(2, 3))
#> Error in `str_dup()`:
#> ! Can't recycle `string` (size 3) to match `times` (size 2).
```

Make `times` either a single value or a vector the same length as `string`, and the call recycles cleanly.

### Forgetting that zero and fractional times are accepted

**A `times` of 0 returns an empty string, and a fractional value is truncated toward zero.** Neither raises an error, so a bad count fails silently.

```r title="Zero and fractional times"
str_dup("ab", 0)
#> [1] ""
str_dup("ab", 2.9)
#> [1] "abab"
```

Pass a whole, positive number for `times` so the result length is exactly what you expect.

[WARNING]
**str_dup() with NA in `times` returns NA, not an error.** A missing repeat count silently produces a missing string, which can quietly shrink a column. Check `times` for NA values before the call, or handle the NA outputs deliberately afterwards.

## Try it yourself

**Try it:** Build a separator line of exactly 12 equals signs and save the result to `ex_rule`.

```r title="Your turn: build a separator line"
# Try it: repeat "=" twelve times
ex_rule <- # your code here

ex_rule
#> Expected: "============"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rule <- str_dup("=", 12)
ex_rule
#> [1] "============"
```

**Explanation:** str_dup() repeats the single character `"="` twelve times and joins the copies together, producing a fixed-width rule you can reuse anywhere a divider is needed.

</details>

## Related stringr functions

When str_dup() is not quite what you need, these are the next stops:

- [str_c()](stringr-str_c-in-R.html) joins several different strings end to end, rather than repeating one.
- [str_pad()](stringr-str_pad-in-R.html) grows a string to a fixed width by adding a pad character on one side.
- [str_flatten()](stringr-str_flatten-in-R.html) collapses a whole vector into a single string with an optional separator.
- [str_trunc()](stringr-str_trunc-in-R.html) shortens strings that exceed a maximum length.
- [str_length()](stringr-str_length-in-R.html) counts characters, which helps you pick the right `times`.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_dup.html) documents str_dup() and its arguments.

## FAQ

**How do I repeat a string multiple times in R?**

Use `str_dup(string, times)` from stringr: `str_dup("ab", 3)` returns `"ababab"`. The function repeats the input and joins the copies into one string. Because it is vectorised, the same call repeats a whole character vector at once, and `times` can be a vector so each element is repeated a different number of times.

**What is the difference between str_dup() and strrep()?**

They do the same job: both repeat each element of a character vector a given number of times and return the joined copies. str_dup() comes from the stringr package and strrep() is built into base R. The results are identical, so the choice is about dependencies. Use str_dup() when you are already working in a stringr or tidyverse pipeline, and use strrep() when you want to avoid loading a package.

**How do I create a separator line in R?**

Repeat a single character with str_dup(): `str_dup("-", 40)` returns a 40-dash rule, and `str_dup("=", 40)` gives a heavier one. Pass the width you want as the `times` argument. Because str_dup() repeats whole strings, you can also build patterned rules such as `str_dup("=-", 20)`. The result is a plain character string you can print, write to a log, or paste above a heading.

**Can str_dup() repeat each element a different number of times?**

Yes. The `times` argument can be a vector the same length as `string`. `str_dup(c("a", "b", "c"), c(1, 2, 3))` returns `"a"`, `"bb"`, and `"ccc"`, repeating each element by its matching count. This is what makes str_dup() useful inside `mutate()`, where you can pass a numeric column as `times` to repeat a marker once per row. If the two lengths are incompatible, str_dup() raises a recycling error.

**Does str_dup() work with NA values?**

Yes, and it is NA-safe. An NA in the `string` argument produces an NA output, so `str_dup(NA, 3)` returns `NA`. An NA in the `times` argument also returns NA rather than raising an error. This means a missing repeat count can quietly create a missing string, so check `times` for NA values before the call if a clean result matters.
