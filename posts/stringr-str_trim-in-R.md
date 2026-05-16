---
title: "stringr str_trim() in R: Trim Whitespace From Strings"
slug: "stringr-str_trim-in-R"
description: "Use stringr str_trim() in R to remove leading and trailing whitespace from strings. Vectorised, NA safe, with a side argument, 5 examples, and pitfalls."
keywords: "stringr str_trim, str_trim function R, stringr str_trim examples, R trim whitespace, remove leading trailing whitespace R, str_trim vs str_squish, str_trim vs trimws"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_trim()|stringr str_trim|stringr::str_trim()|trim whitespace in R|str_trim function"
auto_link_case_sensitive: true
target_keyword: "stringr str_trim"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_trim() in R: Trim Whitespace From Strings

<p class="lead">stringr str_trim() removes leading and trailing whitespace from every element of a character vector. It is vectorised, NA aware, and lets you trim one side or both, which makes it the standard first step when cleaning text scraped from files, forms, or spreadsheets.</p>

[QUICK ANSWER]
str_trim(x)                          # trim both sides (default)
str_trim("  hello  ")                # returns "hello"
str_trim(x, side = "left")           # trim leading whitespace only
str_trim(x, side = "right")          # trim trailing whitespace only
str_trim(c(" a ", " b "))            # vectorised over a vector
str_trim(NA_character_)              # NA stays NA (NA-safe)
df |> mutate(name = str_trim(name))  # trim a data frame column
str_squish(x)                        # trim plus collapse inner spaces

[DECISION TREE: Is str_trim() the right tool?]
- trim leading and trailing whitespace: str_trim(x)
- also collapse inner runs of spaces: str_squish(x)
- pad strings to a fixed width: str_pad(x, 10)
- remove a specific pattern, not whitespace: str_remove(x, "pat")
- truncate long strings to a max length: str_trunc(x, 20)
- replace whitespace with another character: str_replace_all(x, "\\s+", "-")

## What str_trim() does in one sentence

**str_trim(string, side = "both") returns a copy of the input with whitespace stripped from the start, the end, or both.** It works element-wise on a character vector, propagates NA inputs as NA outputs, leaves all internal characters untouched, and recognises spaces, tabs, and newlines as whitespace using the Unicode-aware rules from the underlying stringi engine.

Use str_trim() whenever stray spaces would break a comparison, a join key, or a numeric conversion. It is almost always the first cleanup step before any pattern matching.

```r title="Load stringr and trim a vector"
library(stringr)

x <- c("  hello  ", "world  ", "  RStudio", NA, "   ")
str_trim(x)
#> [1] "hello"   "world"   "RStudio" NA        ""
```

The output keeps the original length, NA stays NA, and a string that was all whitespace collapses to the empty string.

## Syntax

**str_trim(string, side = c("both", "left", "right")) takes two arguments.** The first is the character vector to clean; the second selects which end to trim. The default `"both"` removes whitespace from the start and the end in a single call.

```r title="Function signature and defaults"
# str_trim(string, side = c("both", "left", "right"))
#
# string : character vector to trim
# side   : "both" (default), "left", or "right"
#          which end(s) to strip whitespace from
```

Because str_trim() is vectorised, you can clean thousands of strings in one call without writing a loop.

```r title="Trim one side with the side argument"
padded <- c("  left", "right  ", "  both  ")
str_trim(padded, side = "left")
#> [1] "left"    "right  " "both  "
```

Only the leading whitespace is removed, so trailing spaces on `"right  "` and `"both  "` survive untouched.

[NOTE]
**str_trim() is the stringr twin of base R trimws().** Both strip leading and trailing whitespace and accept a `which` or `side` argument. Prefer str_trim() inside tidyverse pipelines for a consistent `str_` naming style and reliable NA handling.

## Five common str_trim() scenarios

**Five scenarios cover almost every real use of str_trim().** Each block stands alone so you can paste it into the live console.

### Clean a column inside a data frame

**Most cleanup happens inside a tidyverse pipeline.** Combine str_trim() with `mutate()` to rewrite a messy column in place.

```r title="Trim a character column with mutate"
library(dplyr)
df <- tibble(city = c("  Paris", "Berlin  ", "  Rome  "))
df |> mutate(city = str_trim(city))
#> # A tibble: 3 x 1
#>   city
#>   <chr>
#> 1 Paris
#> 2 Berlin
#> 3 Rome
```

Every value loses its surrounding spaces, which is essential before you use the column as a join key or a grouping variable.

### Fix a comparison broken by stray spaces

**A trailing space makes two visually identical strings unequal.** Trim both sides before comparing so the test reflects the content, not the formatting.

```r title="Trim both sides of a comparison"
"  yes" == "yes"
#> [1] FALSE
str_trim("  yes") == "yes"
#> [1] TRUE
```

The first test fails because the left value carries two leading spaces. After str_trim(), the comparison returns TRUE.

### Match against a lookup vector

**Stray spaces cause `%in%` to silently miss valid matches.** Trim the input before testing membership against a known set.

```r title="Membership test after trimming"
known <- c("apple", "banana", "cherry")
typed <- c("apple ", "  banana", "cherry")
str_trim(typed) %in% known
#> [1] TRUE TRUE TRUE
```

Without str_trim(), the first two values would return FALSE even though they name real fruit.

### Prepare strings for numeric conversion

**Numbers pasted from spreadsheets often arrive wrapped in spaces.** Trim before converting so the parse is clean and predictable.

```r title="Trim before as.numeric"
amounts <- c(" 12.5 ", "  99", "3.0  ")
as.numeric(str_trim(amounts))
#> [1] 12.5 99.0  3.0
```

Trimming first keeps the conversion explicit and protects you from edge cases where padding interferes with parsing.

### Strip whitespace from one side only

**Sometimes leading indentation is meaningful and only trailing space is noise.** The `side` argument lets you target exactly one end.

```r title="Trim trailing whitespace, keep leading indent"
lines <- c("  indented line   ", "flush line  ")
str_trim(lines, side = "right")
#> [1] "  indented line" "flush line"
```

The leading two spaces on the first element are preserved, while the trailing spaces on both lines are removed.

[KEY INSIGHT]
**str_trim() is a normalization step, not a content change.** Treat it as the first stage of a cleaning pipeline that often continues with str_to_lower(), str_squish(), or str_replace(). Trimming early makes every downstream comparison and join more reliable.

## str_trim() vs str_squish() vs trimws()

**Three functions look similar but solve different problems.** Picking the wrong one usually shows up as leftover internal spaces or inconsistent base R behaviour.

| Function | Source | Trims edges? | Collapses inner spaces? | Best for |
|---|---|---|---|---|
| `str_trim(x)` | stringr | yes | no | edge whitespace only |
| `str_squish(x)` | stringr | yes | yes | fully normalised spacing |
| `trimws(x)` | base R | yes | no | base-only scripts |

Reach for str_trim() when only the leading and trailing whitespace is noise, str_squish() when runs of spaces inside the string also need collapsing, and trimws() when you want to avoid a package dependency.

## Common pitfalls

**Three pitfalls cause most str_trim() surprises.** Each has a one-line fix.

### Expecting it to collapse internal whitespace

**str_trim() only touches the two ends of the string.** Double spaces in the middle of the text survive untouched.

```r title="Internal spaces are not collapsed"
str_trim("  hello   world  ")
#> [1] "hello   world"
```

To collapse internal runs of whitespace as well, use `str_squish()`, which trims the edges and squeezes inner spaces down to one.

### Comparing or joining without trimming both sides

**Trimming only one value still leaves a case mismatch.** The result looks subtly wrong rather than throwing an error.

```r title="Trim every value you compare"
str_trim(" id_1") == "id_1 "
#> [1] FALSE
str_trim(" id_1") == str_trim("id_1 ")
#> [1] TRUE
```

When you build a join key from text, run str_trim() on both tables before the join so neither side carries hidden padding.

### Assuming it strips characters other than whitespace

**str_trim() removes whitespace only, never quotes, zeros, or punctuation.** Those characters need a pattern-based tool.

```r title="str_trim leaves non-whitespace characters"
str_trim('"quoted"')
#> [1] "\"quoted\""
```

To strip a specific leading or trailing character, use `str_remove()` with an anchored pattern, for example `str_remove(x, '^"|"$')`.

[WARNING]
**str_trim() returns a character vector even if you pass a factor.** That silently changes the column type. Wrap the result with `as.factor()` or use `forcats::fct_relabel(f, str_trim)` when you need to keep factor levels.

## Try it yourself

**Try it:** The vector `c(" Mon ", "Tue  ", "  Wed")` has inconsistent padding. Trim every element and save the cleaned vector to `ex_days`.

```r title="Your turn: trim the day labels"
# Try it: trim leading and trailing whitespace
ex_days <- # your code here

ex_days
#> Expected: c("Mon", "Tue", "Wed")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_days <- str_trim(c(" Mon ", "Tue  ", "  Wed"))
ex_days
#> [1] "Mon" "Tue" "Wed"
```

**Explanation:** str_trim() with the default `side = "both"` strips whitespace from each end of every element, so all three labels become clean three-letter strings ready for grouping or joining.

</details>

## Related stringr functions

When str_trim() is not quite what you need, these are the next stops:

- [str_squish()](stringr-str_squish-in-R.html) trims the edges and also collapses runs of internal whitespace to single spaces.
- [str_pad()](stringr-str_pad-in-R.html) does the opposite job, adding whitespace to reach a fixed string width.
- [str_remove()](stringr-str_remove-in-R.html) deletes a pattern from a string, useful for stripping non-whitespace characters.
- [str_replace_all()](stringr-str_replace_all-in-R.html) swaps every match of a pattern, for example replacing whitespace with hyphens.
- [str_to_lower()](stringr-str_to_lower-in-R.html) lowercases text, a common partner step after trimming during cleanup.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_trim.html) documents str_trim() and its arguments.

## FAQ

**What is the difference between str_trim() and trimws() in R?**

Both remove leading and trailing whitespace and return a character vector. str_trim() comes from the stringr package and accepts a `side` argument of `"both"`, `"left"`, or `"right"`, while base R trimws() uses a `which` argument with the same three choices. The behaviour is effectively identical, so the choice is mostly about style: use str_trim() inside tidyverse pipelines and trimws() when you want to avoid loading a package.

**Does str_trim() remove spaces in the middle of a string?**

No. str_trim() only strips whitespace from the start and the end of each string. Internal spaces, including double or triple spaces between words, are left exactly as they are. If you also need to collapse internal runs of whitespace down to a single space, use str_squish() instead, which trims the edges and squeezes the middle in one call.

**How do I trim whitespace from a whole column in a data frame?**

Use str_trim() inside a dplyr `mutate()` call: `df |> mutate(name = str_trim(name))`. Because str_trim() is vectorised, it processes the entire column in one pass without a loop. If the column is a factor, str_trim() returns a character vector, so wrap the result with `as.factor()` or use `forcats::fct_relabel()` when you need to keep the factor structure.

**Can str_trim() handle tabs and newlines?**

Yes. str_trim() treats tabs, newlines, and carriage returns as whitespace, so a string like `"\t hello \n"` trims down to `"hello"`. It uses Unicode-aware whitespace rules from the stringi engine, which means the behaviour is consistent across Windows, macOS, and Linux rather than depending on the system locale.

**What does str_trim() return for an NA value?**

str_trim() is NA safe: an NA input produces an NA output, and the length of the result always matches the length of the input. It does not convert NA into the literal string `"na"`. If you need a placeholder instead of NA, replace the missing values before trimming with `tidyr::replace_na(x, "")` or `dplyr::coalesce(x, "")`.
</content>
</invoke>
