---
title: "stringr str_squish() in R: Trim and Collapse Whitespace"
slug: stringr-str_squish-in-R
description: "stringr str_squish() in R trims leading and trailing whitespace and collapses repeated internal spaces into single spaces. Runnable examples and pitfalls."
keywords: "stringr str_squish, str_squish function R, stringr str_squish examples, R str_squish whitespace, remove extra whitespace R, trim whitespace stringr, str_squish vs str_trim"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: stringr-functions
fr_parent: stringr-in-R.html
auto_link_terms: "str_squish()|stringr str_squish|stringr::str_squish()|squish whitespace|collapse whitespace"
auto_link_case_sensitive: true
target_keyword: "stringr str_squish"
sibling_block_enabled: true
difficulty: Beginner
---

# stringr str_squish() in R: Trim and Collapse Whitespace

<p class="lead">stringr str_squish() in R cleans messy text in one step: it trims leading and trailing whitespace and collapses every run of internal spaces, tabs, and newlines into a single space.</p>

[QUICK ANSWER]
str_squish(x)                       # trim ends + collapse inner spaces
str_squish("  a   b  ")             # returns "a b"
str_squish(c(" x ", " y  z "))      # vectorised over a character vector
str_squish(df$col)                  # clean a data frame column
str_squish("a\tb\nc")               # tabs and newlines become one space
str_trim(x)                         # ends only, keeps inner runs
str_replace_all(x, "\\s+", "")      # delete all whitespace instead

[DECISION TREE: Is str_squish() the right tool?]
- trim ends and collapse inner runs: str_squish(x)
- trim ends only, keep inner spaces: str_trim(x)
- delete every space entirely: str_replace_all(x, "\\s+", "")
- pad a string to fixed width: str_pad(x, 10)
- shorten long strings with an ellipsis: str_trunc(x, 20)
- swap one substring for another: str_replace(x, "old", "new")

## What str_squish() does

**str_squish() normalises whitespace in a string.** It removes whitespace at both ends and replaces any internal sequence of whitespace characters with a single space. The result is text where words are separated by exactly one space and there is no padding around the edges.

Whitespace here is not just the space character. `str_squish()` matches the full regular expression class `\s`, which also covers tab characters and newline characters. Any mix of those, in any length of run, collapses down to one ordinary space.

This makes it the go-to function for cleaning free-text input, scraped HTML, survey responses, and copy-pasted values where spacing is inconsistent. Inconsistent spacing is a silent data quality problem: `"New York"` and `"New  York"` look identical on screen but fail an equality test and split into two groups in a `count()`. Squishing every value first removes that whole class of bug.

`str_squish()` is part of the [stringr](stringr-in-R.html) package and is vectorised, so a single call cleans an entire character vector or data frame column at once. It returns a character vector the same length as its input, and `NA` values pass through untouched.

[KEY INSIGHT]
**str_squish() is str_trim() plus internal collapsing.** `str_trim()` only touches the two ends of a string. `str_squish()` does that and also flattens every run of inner whitespace, so `"  R   is   great  "` becomes `"R is great"` in one call.

## str_squish() syntax

**The function takes a single argument.** You pass a character vector and get a cleaned character vector back. There are no options to configure, which is part of its appeal: there is exactly one sensible way to normalise spacing, and `str_squish()` does it.

```r title="Load stringr and squish a string"
library(stringr)

messy <- "   Data   Science   in    R   "
str_squish(messy)
#> [1] "Data Science in R"
```

The signature is `str_squish(string)`, where `string` is a character vector or anything coercible to one. The function processes each element independently. Because there are no extra parameters, you never have to remember argument order, and the call reads cleanly inside a pipe.

If you only ever remember one stringr function for tidying text, make it this one. It covers the most common cleaning need and fails safe on missing values.

## str_squish() examples

**str_squish() shines on real, untidy data.** These use cases cover the situations you will hit most often when preparing text for analysis or joining.

Apply it to a character vector and every element is cleaned independently. Notice how the padded ends disappear and each double space becomes single:

```r title="Clean a character vector"
names <- c("  Alice  ", "Bob   Smith", "  Carol\tJones ")
str_squish(names)
#> [1] "Alice"     "Bob Smith" "Carol Jones"
```

Cleaning a data frame column is the most common production use. Survey tools and spreadsheets routinely export values with stray padding. Assign the squished result back to the column so the change sticks:

```r title="Squish a data frame column"
survey <- data.frame(
  city = c(" New   York ", "Los  Angeles", "  Chicago")
)
survey$city <- str_squish(survey$city)
survey$city
#> [1] "New York"    "Los Angeles" "Chicago"
```

This one step is often what makes a later `group_by()` or join behave. Without it, `" New   York "` and `"New York"` are different keys and your aggregates silently fragment.

Because `str_squish()` matches the full `\s` class, it also flattens tabs and newlines. Text pasted from a PDF or a web page frequently arrives riddled with both:

```r title="Collapse tabs and newlines"
multiline <- "Line one\n\tLine two\n\n  Line three"
str_squish(multiline)
#> [1] "Line one Line two Line three"
```

Every newline and tab here becomes a single space, and the three lines merge into one clean sentence. That is exactly what you want for a value destined for a table cell, and exactly what you do not want if the line breaks were meaningful.

[TIP]
**Combine str_squish() with dplyr to clean many columns at once.** Inside `mutate()`, write `across(where(is.character), str_squish)` to normalise every text column of a data frame in a single statement, rather than naming each column by hand.

## str_squish() vs str_trim() vs gsub()

**Pick the function that matches how much whitespace you want gone.** All three touch whitespace, but only `str_squish()` both trims the ends and collapses the middle. Choosing wrongly leaves you with values that still fail to match.

```r title="Compare str_squish and str_trim"
x <- "  R   is    great  "
str_trim(x)
#> [1] "R   is    great"
str_squish(x)
#> [1] "R is great"
```

The contrast is clear: `str_trim()` strips the padding but keeps the three- and four-space gaps between words, while `str_squish()` resolves both problems. The table below summarises the whitespace family.

| Function | Trims ends | Collapses inner runs | Typical use |
|---|---|---|---|
| `str_squish()` | Yes | Yes | Cleaning free-text input |
| `str_trim()` | Yes | No | Trimming padded fixed fields |
| `str_pad()` | No (adds) | No | Aligning to a fixed width |
| `gsub("\\s+", " ", x)` | No | Yes | Base R, ends still padded |

The base R equivalent of `str_squish()` is `trimws(gsub("\\s+", " ", x))`. It needs two function calls and is easy to get half right. The stringr version is one call, reads cleanly in a pipe, and returns `NA` for `NA` input instead of the literal string `"NA"`, which matters when missing values flow downstream.

[NOTE]
**Coming from Python?** The pandas equivalent of `str_squish()` is `s.str.split().str.join(" ")`, or `" ".join(s.split())` for a single string. Both split on any whitespace and rejoin the pieces with single spaces.

## Common pitfalls

**str_squish() collapses spaces, it does not delete them.** This is the mistake people hit most. If you need text with no whitespace at all, such as a slug or a numeric string, `str_squish()` will not get you there because it always leaves one space between words.

```r title="Remove all whitespace instead"
code <- " a + b "
str_squish(code)
#> [1] "a + b"
str_replace_all(code, "\\s+", "")
#> [1] "a+b"
```

Reach for `str_replace_all(x, "\\s+", "")` or `str_remove_all(x, "\\s")` when total removal is the goal. `str_squish()` is a normaliser, not an eraser.

[WARNING]
**str_squish() flattens newlines into single spaces.** If your text is multi-line and the line breaks carry meaning, such as an address block, a poem, or formatted notes, `str_squish()` will destroy that structure. Split the text into lines first and apply `str_trim()` to each line instead.

A third trap is forgetting that `str_squish()` does not modify its input in place. R strings are immutable, so the function returns a new vector and leaves the original alone. Running `str_squish(survey$city)` on its own line cleans nothing permanently; you must reassign with `survey$city <- str_squish(survey$city)` for the change to persist. This catches people who expect spreadsheet-style editing.

## Try it yourself

**Try it:** Clean the messy vector below so each element has no padding and single internal spaces. Save the result to `ex_clean`.

```r title="Your turn: squish a vector"
ex_messy <- c("  hello   world ", "good\t bye", " R  stats ")
# Try it: squish ex_messy
ex_clean <- # your code here

ex_clean
#> Expected: "hello world" "good bye" "R stats"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_messy <- c("  hello   world ", "good\t bye", " R  stats ")
ex_clean <- str_squish(ex_messy)
ex_clean
#> [1] "hello world" "good bye"    "R stats"
```

**Explanation:** `str_squish()` is vectorised, so one call cleans every element. It trims the padded ends and collapses each internal run of spaces, tabs, and newlines into a single space.

</details>

## Related stringr functions

**str_squish() works alongside the rest of the stringr whitespace toolkit.** These functions handle the cases it deliberately does not.

- [`str_trim()`](stringr-str_trim-in-R.html) trims leading and trailing whitespace but keeps internal runs intact.
- `str_pad()` adds whitespace to reach a target width, the inverse of trimming.
- `str_replace_all()` deletes or rewrites whitespace with a custom pattern.
- [`str_length()`](stringr-str_length-in-R.html) counts characters, useful for confirming a squish worked.
- [`str_detect()`](stringr-str_detect-in-R.html) flags strings that still contain double spaces before you squish.

See the official [stringr whitespace reference](https://stringr.tidyverse.org/reference/str_trim.html) for the full family and their edge cases.

## FAQ

**What is the difference between str_squish() and str_trim() in R?**

`str_trim()` removes whitespace only from the start and end of a string. `str_squish()` does the same and additionally collapses every run of internal whitespace into a single space. Use `str_trim()` when inner spacing is already correct and you only need to strip padding. Use `str_squish()` when the text has erratic internal spacing, tabs, or newlines that should all become single spaces.

**Does str_squish() remove all spaces?**

No. `str_squish()` keeps exactly one space between words; it never produces a string with zero spaces. To delete every whitespace character, use `str_replace_all(x, "\\s+", "")` or `str_remove_all(x, "\\s")`. Think of `str_squish()` as a normaliser that standardises spacing, not an eraser that removes it entirely.

**How do I remove extra whitespace from a column in R?**

Apply `str_squish()` to the column and assign the result back: `df$col <- str_squish(df$col)`. In a dplyr pipeline, use `df |> mutate(col = str_squish(col))`. To clean every text column at once, write `mutate(across(where(is.character), str_squish))`.

**Does str_squish() handle tabs and newlines?**

Yes. `str_squish()` matches the full regular expression whitespace class `\s`, which includes spaces, tab characters (`\t`), and newline characters (`\n`). Each run of these is replaced by a single space, so multi-line text is flattened into one line. If you need to preserve line breaks, apply `str_trim()` to each line separately instead.
