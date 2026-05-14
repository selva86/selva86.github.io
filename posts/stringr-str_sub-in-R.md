---
title: "stringr str_sub() in R: Slice Substrings by Position"
slug: "stringr-str_sub-in-R"
description: "Use stringr str_sub() in R to extract or replace substrings by position. Negative indices, vectorised start/end, NA-safe behaviour, plus 5 worked examples."
keywords: "stringr str_sub, str_sub function R, stringr str_sub examples, R str_sub substring, R extract substring by position, str_sub vs substr, str_sub replace"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_sub()|stringr str_sub|stringr::str_sub()|substring by position|str_sub function"
auto_link_case_sensitive: true
target_keyword: "stringr str_sub"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_sub() in R: Slice Substrings by Position

<p class="lead">stringr str_sub() extracts or replaces a substring from each element of a character vector using start and end character positions. It is vectorised, NA-aware, supports negative indices that count from the end, and unlike base R substr() it lets you assign into a slice to overwrite text in place.</p>

[QUICK ANSWER]
str_sub(x, 1, 3)                    # first 3 characters
str_sub(x, -3, -1)                  # last 3 characters
str_sub(x, 2)                       # from char 2 to end
str_sub(x, end = -2)                # everything except last char
str_sub(x, c(1, 3), c(2, 5))        # vectorised start and end
str_sub("hello", -1)                # last character: "o"
str_sub(NA_character_, 1, 3)        # NA, not empty (NA-safe)
str_sub(c("abc","de"), 1, 2)        # element-wise slice on a vector

[DECISION TREE: Is str_sub() the right tool?]
- get characters at fixed positions: str_sub(x, 1, 3)
- replace characters at fixed positions: assignment form, see scenario 3
- get text matching a regex: str_extract(x, "[A-Z]+")
- get text between two markers: str_extract(x, "between markers regex")
- split a string into pieces: str_split(x, ",")
- find where a pattern occurs: str_locate(x, "pattern")
- count characters in a string: str_length(x)

## What str_sub() does in one sentence

**str_sub(string, start, end) returns the slice of each input string between two character positions.** The slice is inclusive at both ends, NA inputs propagate to NA outputs, and out-of-range positions are silently clamped instead of throwing. The function works element-wise, so a vector of starts and ends extracts a different slice from every string in one call.

Reach for str_sub() when the meaningful piece of a string lives at a stable position. Pattern-driven extraction belongs to str_extract; anything you would solve with brackets in another language belongs here.

```r title="Load stringr and slice the first three characters"
library(stringr)

x <- c("banana", "apple", "kiwi", NA, "")
str_sub(x, 1, 3)
#> [1] "ban" "app" "kiw" NA    ""
```

The output vector has one element per input. NA propagates and positions are 1-indexed.

## Syntax

**str_sub(string, start = 1L, end = -1L) takes three arguments.** Default start is the first character, default end is the last. Negative indices count backwards from the end of each string, with -1 meaning the final character.

```r title="Function signature and defaults"
# str_sub(string, start = 1L, end = -1L)
#
# string : character vector
# start  : integer position(s) to start at (negatives count from end)
# end    : integer position(s) to stop at (inclusive, defaults to last)
```

start and end recycle against the input and against each other, which is the feature that separates str_sub() from base R substr().

```r title="Three slicing idioms in one call"
x <- c("RStudio", "tidyverse", "ggplot2")
str_sub(x, 1, 3)        # first three
#> [1] "RSt" "tid" "ggp"
str_sub(x, -3, -1)      # last three
#> [1] "dio" "rse" "ot2"
str_sub(x, 2, -2)       # drop first and last
#> [1] "Studi"  "idivers" "gplot"
```

The third call reads as "from character 2 through the second-to-last", which trims the outer pair off every string regardless of length.

[NOTE]
**str_sub() is 1-indexed and inclusive on both ends.** That matches R's convention but differs from Python slicing, which is 0-indexed and exclusive at the end. If you are coming from `s[1:3]` in Python, the equivalent in R is `str_sub(s, 1, 3)` to get the same three characters.

## Five common str_sub() scenarios

**Five scenarios cover almost every real use of str_sub().** Each block stands alone so you can paste it into the live console.

### Extract a fixed prefix or suffix

**ID columns and codes often pack meaning into the first or last few characters.** str_sub() pulls those tokens out without writing a regex.

```r title="Pull country code from order IDs"
ids <- c("US-10042", "UK-90211", "JP-77001")
str_sub(ids, 1, 2)
#> [1] "US" "UK" "JP"
str_sub(ids, 4)
#> [1] "10042" "90211" "77001"
```

The first call grabs the two-letter prefix; the second defaults end to -1, returning everything from position 4 onward.

### Get the last N characters

**Negative indices count from the end of each string, even when strings have different lengths.** That makes "last 4 chars" a one-liner regardless of input width.

```r title="Last 4 chars from variable-length strings"
files <- c("report.csv", "summary.txt", "data_2026.parquet")
str_sub(files, -4)
#> [1] ".csv"   ".txt"   "quet"
```

`str_sub(files, -4)` is shorthand for `str_sub(files, -4, -1)`. Each element is sliced relative to its own end, regardless of length.

### Replace a slice in place (assignment form)

**str_sub() supports assignment, which base R substr() also offers but is rarely advertised.** This rewrites a slice of every element of the vector in one call.

```r title="Mask the first 4 characters of each card number"
cards <- c("4111111111111111", "5500000000000004", "340000000000009")
str_sub(cards, 1, 4) <- "XXXX"
cards
#> [1] "XXXX111111111111" "XXXX000000000004" "XXXX000000000009"
```

The replacement is recycled across all elements and the vector is mutated in place.

### Vectorised slices with different bounds per row

**Pass vectors as start and end to extract a different slice from every input.** This is the single biggest reason to choose str_sub() over substr().

```r title="Per-row start and end positions"
x <- c("alpha", "beta", "gamma")
str_sub(x, c(1, 2, 3), c(3, 4, 5))
#> [1] "alp" "et"  "mma"
```

Element 1 gets positions 1-3, element 2 gets 2-4, element 3 gets 3-5. Index vectors recycle, so a length-1 start with a length-3 end also works.

### Trim N characters from each end

**A common cleanup is "drop the first character and the last character" (e.g., stripping outer quotes).** Combine a positive start with a negative end.

```r title="Strip surrounding quotes from a vector"
quoted <- c('"alpha"', '"beta"', '"gamma"')
str_sub(quoted, 2, -2)
#> [1] "alpha" "beta"  "gamma"
```

Position 2 skips the leading quote, -2 stops before the trailing one. The pattern generalises to `str_sub(x, k+1, -(k+1))` for dropping the first and last k characters.

[KEY INSIGHT]
**str_sub() is the position-based cousin of str_extract().** Reach for str_sub() when the slice is defined by character offsets, str_extract when it is defined by content. The two functions cover almost all string-extraction needs in tidy R code.

## str_sub() vs substr() vs substring() vs str_extract()

**Four functions return substrings, but only one is fully vectorised, NA-safe, and accepts negative indices.** Picking the wrong one causes silent off-by-one bugs.

| Function | Vector start/end? | Negative indices? | NA-safe? | Best for |
|---|---|---|---|---|
| `str_sub(x, s, e)` | yes | yes (count from end) | yes (NA in, NA out) | tidyverse code, per-row slices |
| `substr(x, s, e)` | partial (recycles) | no | no (treats NA as empty) | base R, no extra packages |
| `substring(x, s, e)` | yes | no | no | legacy code, multi-slice extraction |
| `str_extract(x, p)` | n/a | n/a | yes | content-based extraction by regex |

str_sub() is the tidyverse default; substr() works for base-only scripts; substring() is legacy; str_extract() is the choice when the substring is identified by content rather than position. For mixed data, str_locate returns the start and end positions of a regex match, which you can pass straight into str_sub.

## Common pitfalls

**Three pitfalls cause most str_sub() surprises.** Each has a one-line fix.

### Confusing 1-indexed with 0-indexed

**str_sub() is 1-indexed.** Position 1 is the first character, not position 0.

```r title="Position 1 is the first character"
str_sub("hello", 1, 1)
#> [1] "h"
str_sub("hello", 0, 1)
#> [1] "h"
```

Position 0 is silently clamped to 1, so the bug is invisible. Always start counting from 1, especially when porting code from Python or JavaScript.

### Forgetting that end is INCLUSIVE

**str_sub(x, 1, 3) returns 3 characters, not 2.** The end position is included in the slice.

```r title="Inclusive end means count = end - start + 1"
nchar(str_sub("abcdefg", 1, 3))
#> [1] 3
nchar(str_sub("abcdefg", 2, 5))
#> [1] 4
```

If you want exactly N characters from position k, the end argument is `k + N - 1`. Misreading this as exclusive (Python style) is the most common off-by-one error in R substring code.

### Out-of-range positions silently clamp

**str_sub() never errors on positions beyond the string length.** It just returns the available portion or an empty string.

```r title="Beyond the end returns what is available"
str_sub("abc", 1, 100)
#> [1] "abc"
str_sub("abc", 5, 10)
#> [1] ""
```

This is usually convenient but can mask data quality bugs. If you need a hard check, validate first with `str_length(x) >= k` before slicing.

[WARNING]
**Assignment via str_sub() mutates the original vector.** `str_sub(x, 1, 3) <- "XXX"` rewrites x in place. Copy first with `y <- x` if you need the original, or use `str_replace(x, "^.{3}", "XXX")` for a non-mutating alternative.

## Try it yourself

**Try it:** Use the built-in `state.name` vector to extract the first 3 characters of each state name and uppercase them. Save the result to `ex_codes`.

```r title="Your turn: build 3-letter state codes"
# Try it: 3-letter uppercase codes from state names
ex_codes <- # your code here

ex_codes
#> Expected: c("ALA", "ALA", "ARI", "ARK", "CAL", ...) length 50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_codes <- toupper(str_sub(state.name, 1, 3))
head(ex_codes, 5)
#> [1] "ALA" "ALA" "ARI" "ARK" "CAL"
length(ex_codes)
#> [1] 50
```

**Explanation:** str_sub(state.name, 1, 3) returns the first 3 characters of each name as a 50-element character vector. toupper() then forces uppercase, producing the abbreviated codes.

</details>

## Related stringr functions

When str_sub() is not quite what you need, these are the next stops:

- [str_length()](stringr-str_length-in-R.html) returns the character count, useful before slicing to validate width.
- [str_extract()](stringr-str_extract-in-R.html) extracts by regex pattern instead of by position.
- [str_locate()](stringr-str_locate-in-R.html) returns the start and end positions of a pattern, often piped into str_sub().
- [str_split()](stringr-str_split-in-R.html) breaks a string into pieces at a delimiter.
- [str_replace()](stringr-str_replace-in-R.html) replaces matched text instead of fixed positions.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_sub.html) documents every helper.

## FAQ

**What is the difference between str_sub() and substr() in R?**

Both extract a substring by position, but str_sub() supports negative indices that count from the end of each string and propagates NA inputs as NA outputs. substr() does neither: negative positions are treated as 1, and NA inputs return empty strings. Prefer str_sub() in tidyverse code.

**How do I get the last N characters of a string in R?**

Use `str_sub(x, -N)` or equivalently `str_sub(x, -N, -1)`. The negative index counts backward from the end, so str_sub("hello", -3) returns "llo". This works element-wise: each element is sliced relative to its own end, and short strings are returned whole instead of erroring.

**Can I use str_sub() to replace part of a string?**

Yes. The assignment form `str_sub(x, start, end) <- value` overwrites the slice in place. For example, `str_sub(x, 1, 3) <- "XXX"` rewrites the first three characters of every element. Note this MUTATES the original vector; copy x first if you need to keep the original.

**What happens if start or end is out of range in str_sub()?**

str_sub() silently clamps the bounds to the string length rather than throwing an error. `str_sub("abc", 1, 100)` returns "abc", and `str_sub("abc", 5, 10)` returns "". If you need to enforce a minimum length, check `str_length(x) >= k` first.

**Does str_sub() handle Unicode and multibyte characters correctly?**

Yes. str_sub() counts Unicode code points via the underlying stringi package, so accented Latin characters and basic emoji each count as one position. For grapheme clusters made of multiple code points (some compound emoji), str_sub() may split a glyph mid-sequence; use `stringi::stri_sub()` if you need grapheme-aware slicing.
