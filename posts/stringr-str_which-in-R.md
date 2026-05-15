---
title: "stringr str_which() in R: Find Indexes of Matches"
slug: "stringr-str_which-in-R"
description: "Use stringr str_which() in R to find integer indexes of regex matches in a character vector. Covers fixed, case insensitive, negate, NA, with 5 examples."
keywords: "stringr str_which, str_which function R, stringr str_which examples, R str_which regex, R which match index, find string indexes R, str_which vs str_subset"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_which()|stringr str_which|stringr::str_which()|match indexes|matching positions"
auto_link_case_sensitive: true
target_keyword: "stringr str_which"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_which() in R: Find Indexes of Matches

<p class="lead">The <code>str_which()</code> function in stringr returns the integer positions of strings that match a regex inside a character vector. It is the stringr equivalent of <code>which(str_detect(x, pattern))</code> and a direct replacement for base R <code>grep()</code>.</p>

[QUICK ANSWER]
str_which(x, "pattern")                          # indexes of regex matches
str_which(x, fixed("text"))                      # literal (skip regex)
str_which(x, regex("a", ignore_case = TRUE))     # case insensitive
str_which(x, "pattern", negate = TRUE)           # indexes of non-matches
x[str_which(x, "pattern")]                       # subset by indexes
length(str_which(x, "pattern"))                  # count matching strings
which(str_detect(x, "pattern"))                  # base equivalent

[DECISION TREE: Is str_which() the right tool?]
- need INDEX positions of matching strings: str_which()
- need the matching strings themselves: str_subset()
- need TRUE / FALSE per string: str_detect()
- need the matched substring: str_extract()
- need positions WITHIN each string: str_locate()
- need a count of matches per string: str_count()
- need positions for replacement: pair str_which() with `[<-`

## What str_which() does in one sentence

**`str_which(string, pattern)` returns an integer vector of indexes pointing to every element of `string` whose pattern matches.** Non-matching strings, including NAs, are simply omitted from the result.

The output length is the number of matches, not the input length. If nothing matches you get `integer(0)`. That makes `str_which()` the natural input to indexing (`x[idx]`), assignment (`x[idx] <- "fixed"`), or any function expecting integer row positions, such as `dplyr::slice()`.

## Syntax

**`str_which(string, pattern, negate = FALSE)`. The pattern is a regex; wrap with `fixed()` for a literal match.**

```r title="Load stringr and find matching indexes"
library(stringr)

x <- c("apple", "banana", "cherry", "Date", NA)

str_which(x, "an")
#> [1] 1 2
```

Two strings match: "apple" (contains "an") and "banana". The NA is silently dropped. Indexes are 1-based and reference positions in the input vector.

[TIP]
**Use `str_which()` whenever you would otherwise write `which(grepl(...))`.** It reads in one step, stays inside the stringr namespace, and treats NAs predictably (dropped, not returned as integer-NA).

## Five common patterns

### 1. Basic regex match

```r title="Indexes of strings containing 'an'"
fruits <- c("apple", "banana", "cherry", "grape", "mango")
str_which(fruits, "an")
#> [1] 2 5
```

Default pattern is a regular expression. "banana" and "mango" both contain the literal substring "an", so positions 2 and 5 are returned.

### 2. Literal match with fixed()

```r title="Match a literal dot"
versions <- c("1.0", "1x0", "2.5", "no version")
str_which(versions, fixed("."))
#> [1] 1 3
```

Without `fixed()`, the `.` in regex means "any character" and would match every non-empty string. `fixed("text")` skips regex parsing entirely, the simplest way to match a literal substring.

### 3. Case insensitive match

```r title="Find 'apple' regardless of case"
items <- c("apple", "Apple", "APPLE", "banana")
str_which(items, regex("apple", ignore_case = TRUE))
#> [1] 1 2 3
```

`regex(pattern, ignore_case = TRUE)` is the canonical case insensitive modifier. Three of the four strings match, irrespective of capitalization.

### 4. Negate (indexes of non-matches)

```r title="Strings that DO NOT contain 'an'"
str_which(fruits, "an", negate = TRUE)
#> [1] 1 3 4
```

`negate = TRUE` flips the meaning. Equivalent to `which(!str_detect(fruits, "an"))`. Use it when "find rows missing pattern X" reads cleaner than the double negative.

### 5. Subset and assign by index

```r title="Replace matching elements in place"
emails <- c("alice@x.com", "bob_AT_y.org", "carol@z.net", "no contact")
bad <- str_which(emails, "AT", negate = FALSE)
emails[bad] <- str_replace(emails[bad], "_AT_", "@")
emails
#> [1] "alice@x.com" "bob@y.org"   "carol@z.net" "no contact"
```

This is the canonical reason to want indexes over values: you can both read and write back through the same positions. `str_subset()` would only let you read the matching strings.

[KEY INSIGHT]
**Indexes are composable in a way that substrings are not.** Once you have an integer vector of positions, you can pass it to `[`, `slice()`, `seq_along()`, or store it as a row pointer. Reach for `str_which()` whenever downstream code needs to refer back to the original input, not just the matched text.

## str_which() vs str_subset() vs str_detect()

**Pick the matcher whose return shape matches what you want to do next.** The three functions share the same pattern engine and only differ in what they hand back.

| Function | Returns | Length | Reach for it when you need |
|---|---|---|---|
| `str_which(x, p)` | integer indexes of matches | number of matches | row pointers, indexing, assignment |
| `str_subset(x, p)` | matching strings themselves | number of matches | the values, not their positions |
| `str_detect(x, p)` | logical vector | same as input | mask for `filter()`, `ifelse()`, or counts |
| `grep(p, x)` | integer indexes (base R) | number of matches | zero-dependency equivalent of str_which |
| `grep(p, x, value = TRUE)` | matching strings (base R) | number of matches | zero-dependency equivalent of str_subset |

The stringr trio (`str_which`, `str_subset`, `str_detect`) is preferred inside tidyverse pipelines because every function in the family obeys the same NA, vectorization, and pattern modifier rules.

## Common pitfalls

**Pitfall 1: forgetting that the output length differs from the input.** `str_which(x, p)` returns one element per match, not one per input string. Do not assume `length(str_which(x, p)) == length(x)`; use `str_detect()` if you need a same-length vector.

**Pitfall 2: special regex characters treated as patterns.** `str_which(x, "1.5")` matches "1a5", "1-5", and any "1X5" sequence, not just literal "1.5". Use `fixed("1.5")` or escape the dot: `"1\\.5"`.

[WARNING]
**`str_which()` silently drops NAs; it does not return integer-NA at their positions.** `str_which(c("a", NA, "ab"), "a")` returns `c(1, 3)`. If you need a same-length output (one entry per input), use `str_detect()` and apply `which()` yourself only after deciding how to handle NAs.

## Try it yourself

**Try it:** Find the indexes of `iris$Species` (as a character vector) where the species name contains "color". Save the integer vector to `ex_idx`.

```r title="Your turn: find indexes of 'color' species"
species <- as.character(iris$Species)

ex_idx <- # your code here

length(ex_idx)
#> Expected: 50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
species <- as.character(iris$Species)
ex_idx <- str_which(species, "color")
length(ex_idx)
#> [1] 50
head(ex_idx)
#> [1] 51 52 53 54 55 56
```

**Explanation:** `str_which(species, "color")` returns the positions where "color" appears as a substring. Only the 50 "versicolor" rows match; they sit at indexes 51 through 100 in the species vector.

</details>

## Related stringr functions

After mastering str_which, look at:

- `str_subset()`: returns the matching strings (values, not indexes)
- `str_detect()`: returns a logical vector for masking and filtering
- `str_locate()`: returns positions WITHIN each string, not across the vector
- `str_extract()`: pulls out the matched substring
- `grep()`: base R equivalent of `str_which()` with no dependency

For complete regex grammar (anchors, classes, quantifiers, lookarounds), the official [stringr regular expressions vignette](https://stringr.tidyverse.org/articles/regular-expressions.html) is the authoritative reference.

## FAQ

**How do I find the index of a string matching a pattern in R?**

Use `stringr::str_which(x, "pattern")`. It returns an integer vector of positions where the pattern matches in the character vector `x`. The output length equals the number of matches, not the input length. For a same-length logical vector, use `str_detect()` instead, then apply `which()` if you still want indexes.

**What is the difference between str_which and str_subset in R?**

Both filter a character vector by pattern, but they return different things. `str_which(x, p)` returns integer indexes (positions in `x`); `str_subset(x, p)` returns the matching strings themselves. Use `str_which()` when you need to refer back to the original positions for assignment or row indexing; use `str_subset()` when you only care about the values.

**Is str_which the same as grep in R?**

Yes, for typical use. `str_which(x, p)` and `grep(p, x)` both return integer indexes of matches. The differences are stylistic and ecosystem: `str_which()` lives in stringr and shares pattern modifiers (`fixed()`, `regex()`, `coll()`, `boundary()`) with the rest of the package, while `grep()` is base R with its own `fixed = TRUE` and `ignore.case = TRUE` arguments.

**How do I do a case insensitive str_which match?**

Wrap the pattern in `regex(pattern, ignore_case = TRUE)`: `str_which(x, regex("apple", ignore_case = TRUE))`. The plain `ignore.case` argument from base R does not exist on stringr functions; modifier functions like `regex()`, `fixed()`, and `coll()` are the unified way to control match behavior.

**Why does str_which return fewer values than my input has?**

Because the result reports indexes of matches, not a verdict per input. Strings that do not match (including NAs) are omitted. If `x` has 10 elements and 3 match, `str_which()` returns a length-3 integer vector. Use `str_detect()` for a length-10 logical vector that aligns row-for-row with the input.
