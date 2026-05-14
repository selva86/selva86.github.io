---
title: "stringr str_length() in R: Count Characters in Strings"
slug: "stringr-str_length-in-R"
description: "Count characters per string with stringr str_length() in R. Vectorized, NA-aware, Unicode-safe, plus comparisons to nchar(), length() and width helpers."
keywords: "stringr str_length, str_length function R, stringr str_length examples, R string length, str_length vs nchar, character count R, length of string in R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_length()|stringr str_length|stringr::str_length()|string length in R|character count in R"
auto_link_case_sensitive: true
target_keyword: "stringr str_length"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_length() in R: Count Characters in Strings

<p class="lead">stringr str_length() returns the number of characters in each element of a character vector, counting by Unicode code points so accented letters, emoji, and CJK text all score correctly. It is vectorized, NA-aware, and the safe replacement for base R nchar() in modern UTF-8 code.</p>

[QUICK ANSWER]
str_length("hello")                          # length of one string
str_length(c("a", "bb", "ccc"))              # length per element
str_length(x)                                # vectorized over a column
str_length(NA)                               # NA, not 0
str_length("")                               # 0 for empty string
str_length("naïve")                          # 5, not 6 (codepoints)
str_length(c("hi", "नमस्ते"))                  # 2, 6 (CJK / Devanagari safe)
nchar(x, type = "chars") == str_length(x)    # base R equivalence

[DECISION TREE: Is str_length() the right tool?]
- character count per string: str_length(x)
- display width with wide CJK characters: stringi::stri_width(x)
- bytes consumed by each string: nchar(x, type = "bytes")
- number of strings in a vector: length(x)
- count pattern matches per string: str_count(x, "[0-9]")
- pad strings to a fixed length: str_pad(x, 10)
- truncate strings to a max length: str_trunc(x, 10)

## What str_length() does in one sentence

**str_length() turns each string into an integer count of its Unicode code points.** Unlike `length()` which returns how many strings are in a vector, str_length() reports how many characters live inside every string, NA stays NA, and empty strings score 0. That makes it the workhorse for validating IDs, padding columns, trimming display strings, and any downstream check that cares about content size rather than container size.

```r title="Load stringr and check basic lengths"
library(stringr)

x <- c("banana", "apple", "kiwi", NA, "")
str_length(x)
#> [1]  6  5  4 NA  0
```

The output vector is the same length as the input. Six characters in "banana", five in "apple", four in "kiwi", NA propagates, the empty string contributes 0. There is no pattern argument and no recycling to reason about; the function is intentionally minimal.

## Syntax

**str_length() takes one argument: a character vector.** It does not accept a pattern, encoding flag, or weight argument. Anything more complex belongs to `str_count()` or `stringi::stri_width()`.

```r title="Function signature"
# str_length(string)
#
# string : character vector (factors are coerced to character)
```

The function is a thin wrapper around `stringi::stri_length()`, which counts Unicode code points using ICU. That sounds academic but matters in practice. The next block shows why.

```r title="Codepoint counting works for non-ASCII"
str_length(c("hi", "café", "नमस्ते", "🙂🙂"))
#> [1] 2 4 6 2
```

"café" is 4 characters even though it takes 5 bytes in UTF-8. "नमस्ते" is 6 code points (Devanagari is a script with combining marks). Two smileys score 2. Compare this with `nchar(x, type = "bytes")` below to see why str_length() is the right default for user-facing text.

[NOTE]
**Default behavior changed in base R 4.0.** Recent versions of `nchar()` default to `type = "chars"`, which matches str_length() on most platforms. Older code that relied on `type = "bytes"` semantics will return different numbers.

## Five common str_length() scenarios

**Five scenarios cover almost every real use of str_length().** Each block is independent so you can paste it into the live console.

### Filter rows by string length

**Length predicates are the most common use.** Combine str_length() with a comparator in dplyr to keep rows whose strings fall in a range.

```r title="Keep states with short names"
library(dplyr)

tibble(state = state.name) |>
  filter(str_length(state) <= 5) |>
  pull(state)
#> [1] "Idaho" "Iowa"  "Maine" "Ohio"  "Texas" "Utah"
```

`str_length(state)` returns a numeric vector with one entry per row, so dplyr can vectorize the comparison. Use this pattern any time you want a "strings between X and Y chars" filter.

### Validate fixed-width identifiers

**Phone numbers, SKUs, postal codes all have known widths.** A quick str_length() check catches truncated rows before they reach a join.

```r title="Flag rows where the ID is the wrong width"
ids <- c("0012345678", "12345678", "9876543210", "abc")
tibble(id = ids) |>
  mutate(ok = str_length(id) == 10) |>
  filter(!ok)
#> # A tibble: 2 x 2
#>   id        ok
#>   <chr>  <lgl>
#> 1 12345678 FALSE
#> 2 abc      FALSE
```

The check is one line and survives NA values: `str_length(NA) == 10` returns `NA`, which `filter()` drops. That is usually what you want when validating data quality.

### Pad strings to a common width

**str_pad() uses str_length() internally to decide how many characters to add.** When you need fixed-width strings for printing or alignment, reach for the pair.

```r title="Left-pad codes to width 6"
codes <- c("1", "42", "350", "9999")
str_pad(codes, width = 6, side = "left", pad = "0")
#> [1] "000001" "000042" "000350" "009999"
```

You rarely call str_length() directly here, but the underlying contract is the same: count code points, then add what is missing on the chosen side.

### Truncate long strings safely

**str_trunc() pairs with str_length() for safe display.** It avoids the off-by-one bugs that plague manual substring slicing.

```r title="Truncate descriptions to 20 chars"
desc <- c("Short", "A medium length description here", "Tiny")
str_trunc(desc, width = 20, side = "right", ellipsis = "...")
#> [1] "Short"
#> [2] "A medium length d..."
#> [3] "Tiny"
```

`str_trunc()` only truncates strings whose `str_length()` exceeds the width, leaving shorter strings unchanged. Compare with `substr(x, 1, 20)` which silently passes shorter strings but produces the same result. The named arguments make intent clear.

### Build a length histogram for QA

**Distribution shapes catch encoding bugs.** Plotting str_length() over a column reveals whether a CSV import dropped a multi-byte prefix or duplicated rows.

```r title="Length distribution of state names"
lengths <- str_length(state.name)
table(lengths)
#> lengths
#>  4  5  6  7  8  9 10 11 12 13 14
#>  3  3  4  9  4 11  3  2  4  4  3
```

The result is a small frequency table you can pass to `barplot()` or `ggplot()`. Use this pattern as a one-line data quality check on any text column with expected width bounds.

## str_length() vs nchar() vs length() vs str_width()

**Four functions return integers from strings, but they answer four different questions.** Picking the wrong one is the most common bug in string-length code.

| Function | Returns | Counts | Best for |
|---|---|---|---|
| `str_length(x)` | integer vector | code points | content size of each string |
| `nchar(x, "chars")` | integer vector | code points (default) | base R equivalent of str_length |
| `nchar(x, "bytes")` | integer vector | UTF-8 bytes | byte budget, e.g., MySQL VARCHAR |
| `length(x)` | scalar integer | elements in the vector | how many strings you have |
| `stringi::stri_width(x)` | integer vector | display columns (wide CJK = 2) | terminal alignment, fixed-width output |

[KEY INSIGHT]
**Bytes, characters, and columns are different.** UTF-8 lets one character span 1 to 4 bytes, and some CJK or emoji glyphs occupy 2 display columns. Use str_length() for content, `nchar(x, "bytes")` for storage budgets, and `stri_width()` for terminal layout. Mixing them is the source of most "string is too long" production bugs.

## Common pitfalls

**Three pitfalls cause most str_length() surprises.** Each has a one-line fix.

### Confusing str_length() with length()

**length() counts containers; str_length() counts contents.** Calling the wrong one returns plausible but useless numbers.

```r title="length() returns the wrong answer for a vector"
words <- c("hello", "world")
length(words)
#> [1] 2
str_length(words)
#> [1] 5 5
```

`length(words)` says "2 strings". `str_length(words)` says "5 chars each". Mixing them is one of the top causes of off-by-one errors when wiring text features into models.

### Treating NA as 0

**NA propagates to NA, not 0.** Summing a column with NAs produces NA unless you handle them.

```r title="Sum total characters in a column with NAs"
x <- c("alpha", NA, "beta")
sum(str_length(x))
#> [1] NA
sum(str_length(x), na.rm = TRUE)
#> [1] 9
```

Pass `na.rm = TRUE` to `sum()`, or coerce NAs to empty strings with `str_replace_na(x, "")` before counting. Choose based on whether NA-as-missing should count as 0 or be dropped.

### Byte vs codepoint confusion

**Multibyte characters break naive byte-based length code.** Use str_length() for content; reserve byte counts for storage decisions.

```r title="Bytes are not characters for UTF-8"
emoji <- "🙂"
str_length(emoji)
#> [1] 1
nchar(emoji, type = "bytes")
#> [1] 4
```

The smiley is one code point but four bytes in UTF-8. A database column declared `VARCHAR(1)` rejects it; a logical "this string has one character" check accepts it. Match the function to the question you are actually asking.

[WARNING]
**Surrogate pairs and graphemes are still tricky.** Some emoji like the family glyphs are sequences of multiple code points joined by zero-width joiners. str_length() counts the code points (e.g., 7 for a four-person family), not the visual glyph. Use `stringi::stri_count_boundaries(x, type = "character")` if you need grapheme cluster counts.

## Try it yourself

**Try it:** Use the built-in `state.name` vector to find the longest state name and its length. Return them as a one-row tibble.

```r title="Your turn: find the longest state name"
# Try it: longest state name
ex_longest <- # your code here

ex_longest
#> Expected: 1 row, columns name and len
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_longest <- tibble(name = state.name) |>
  mutate(len = str_length(name)) |>
  slice_max(len, n = 1)
ex_longest
#> # A tibble: 1 x 2
#>   name             len
#>   <chr>          <int>
#> 1 North Carolina    14
```

**Explanation:** `mutate()` adds a per-row character count using str_length(). `slice_max()` then keeps the single row with the highest value, which is "North Carolina" at 14 characters.

</details>

## Related stringr functions

When str_length() is not quite what you need, these are the next stops:

- [str_count()](stringr-str_count-in-R.html) counts pattern matches per string instead of total characters.
- [str_pad()](stringr-str_pad-in-R.html) extends short strings to a fixed width.
- [str_trunc()](stringr-str_trunc-in-R.html) shortens long strings with an ellipsis.
- [str_sub()](stringr-str_sub-in-R.html) extracts or replaces substrings by position.
- [str_trim()](stringr-str_trim-in-R.html) and `str_squish()` strip whitespace before length checks.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_length.html) documents every helper.

## FAQ

**What is the difference between str_length() and length() in R?**

`length(x)` returns a single integer: the number of elements in the vector. str_length() returns a vector of the same length where each entry is the number of characters in that element. So `length(c("a", "bb"))` is 2 (two strings), while `str_length(c("a", "bb"))` is `c(1, 2)` (one character, then two). Use length() for vector size, str_length() for string size.

**Is str_length() the same as nchar() in base R?**

For modern UTF-8 locales, `nchar(x, type = "chars")` and `str_length(x)` return the same values on regular strings. The differences appear at the edges: nchar() can produce platform-dependent results on malformed encodings, while str_length() delegates to ICU via stringi for consistent behavior. str_length() also has cleaner NA handling. Prefer str_length() in new code; both are valid.

**How does str_length() handle emoji and Unicode?**

str_length() counts Unicode code points, so most accented Latin letters score 1 and basic emoji score 1. Combined sequences like family emoji or skin-tone modified faces score higher because they are several code points joined together. If you need the count of visible glyphs (grapheme clusters), use `stringi::stri_count_boundaries(x, type = "character")` instead.

**Why does str_length() return NA?**

NA inputs always return NA outputs by design, so missing data is never silently treated as a zero-length string. If you want NAs to count as 0, replace them first with `str_replace_na(x, "")` or `tidyr::replace_na(x, "")`. If you want to ignore them in aggregations, pass `na.rm = TRUE` to `sum()` or `mean()` over the result.

**Does str_length() work on factors?**

Yes, but with a coercion. Passing a factor calls `as.character()` first, so str_length() returns the character count of each level label, not the integer code. If you only want unique level lengths, pass `levels(f)` explicitly to avoid the per-row coercion cost on large vectors.
