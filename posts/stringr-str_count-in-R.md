---
title: "stringr str_count() in R: Count Pattern Matches in Strings"
slug: "stringr-str_count-in-R"
description: "Count regex or fixed pattern matches per string with stringr str_count() in R. Covers regex, fixed, case-insensitive, words, NA, with worked examples."
keywords: "stringr str_count, str_count function R, stringr str_count examples, R str_count regex, count pattern matches R, count substring occurrences R, R count words in string"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_count()|stringr str_count|stringr::str_count()|count pattern matches|count regex matches"
auto_link_case_sensitive: true
target_keyword: "stringr str_count"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_count() in R: Count Pattern Matches in Strings

<p class="lead">stringr str_count() returns the number of non-overlapping regex or fixed pattern matches inside each element of a character vector. It is vectorized, NA-aware, and the right tool whenever str_detect() would lose information by collapsing counts to TRUE/FALSE.</p>

[QUICK ANSWER]
str_count(x, "a")                                 # count "a" in each string
str_count(x, "[0-9]")                             # count digits per string
str_count(x, fixed("."))                          # count literal dots
str_count(x, regex("foo", ignore_case = TRUE))    # case-insensitive
str_count(x, boundary("word"))                    # count words per string
str_count(x, c("a", "b"))                         # pairwise (recycled) counts
str_count(x)                                      # count characters per string

[DECISION TREE: Is str_count() the right tool?]
- count regex matches per string: str_count(x, "[0-9]")
- check if a pattern exists at all: str_detect(x, "[0-9]")
- extract the matched text: str_extract_all(x, "[0-9]")
- replace matches with another string: str_replace_all(x, "[0-9]", "")
- length of each string in characters: str_length(x)
- count rows per group in a tibble: dplyr::count(df, group)

## What str_count() does in one sentence

**str_count() turns each string into an integer count of regex matches.** Unlike `str_detect()` which returns a logical vector, str_count() reports how many times the pattern hits in every element, preserving zero-match strings as 0 and propagating NA inputs as NA. That makes it the workhorse for token counting, feature engineering on text columns, and quick QA on data cleaning rules.

```r title="Load stringr and set up data"
library(stringr)

x <- c("banana", "apple", "kiwi", NA, "")
str_count(x, "a")
#> [1]  3  1  0 NA  0
```

The result is the same length as the input. Three "a"s in "banana", one in "apple", zero in "kiwi", NA stays NA, and an empty string contributes 0.

## Syntax

**str_count() takes a string and a pattern.** Both are vectorized, and the pattern argument accepts plain regex, `fixed()`, `regex()`, `coll()`, or `boundary()` modifiers.

```r title="Function signature"
# str_count(string, pattern = "")
#
# string  : character vector
# pattern : regex (default ""), or fixed()/regex()/coll()/boundary() helper
```

[NOTE]
**Default pattern counts characters.** `str_count(x)` with no pattern returns the number of code points per string, equivalent to `str_length(x)`. Use it as a quick sanity check before regex counting.

The two arguments recycle against each other. Pass a length-1 string against a vector of patterns and you get one count per pattern; pass two vectors of equal length and you get pairwise counts.

```r title="Pairwise counting via recycling"
y <- c("aabbcc", "abcabc", "ccc")
str_count(y, c("a", "b", "c"))
#> [1] 2 2 3
```

The first call asks "how many a in aabbcc", the second "how many b in abcabc", the third "how many c in ccc". This is how you build per-row character-class features in one line.

## Six counting patterns you will use weekly

**Six patterns cover roughly 90% of real-world str_count() work.** Each block below is independent; copy any block to test it on your data.

### Count a fixed substring

**Use fixed() for literal text.** It skips regex parsing, runs faster, and avoids accidental metacharacter bugs.

```r title="Count occurrences of a substring"
emails <- c("alice@example.com", "bob@@typo.com", "no-at-sign")
str_count(emails, fixed("@"))
#> [1] 1 2 0
```

`fixed("@")` skips regex parsing, which is faster and avoids escaping issues. Use it whenever the pattern is a literal string with no metacharacters.

### Count digits per string

**Character classes count one character at a time.** Switch to a quantifier when you want whole tokens.

```r title="Count digits in each element"
log <- c("error 404 at 12:30", "ok", "code 500, retry 3x")
str_count(log, "[0-9]")
#> [1] 6 0 4
```

The regex `[0-9]` is a character class. `str_count()` finds every non-overlapping match, so "404" counts as 3 digits, not 1 number. To count whole numbers instead, switch to `"\\d+"`.

```r title="Count whole numbers vs individual digits"
str_count(log, "\\d+")
#> [1] 3 0 3
```

[TIP]
**Match width changes the count.** `[0-9]` matches one digit at a time; `\\d+` matches a run of digits as a single token. Choose based on whether you are counting characters or counting numeric tokens.

### Case-insensitive count

**Wrap the pattern in regex() to fold case.** This is the idiomatic stringr way to ignore case for one call.

```r title="Ignore case via regex() modifier"
text <- c("R is great. r is fun. R rocks.")
str_count(text, regex("r", ignore_case = TRUE))
#> [1] 5
```

Wrapping the pattern in `regex(..., ignore_case = TRUE)` is the idiomatic way to switch on case folding for one call. Avoid the older `(?i)` inline flag for clarity.

### Count words

**boundary("word") counts tokens, not characters.** It is Unicode-aware and tolerates messy whitespace.

```r title="Count words using a word boundary"
sentences <- c("Hello world", "  many   spaces  ", "one")
str_count(sentences, boundary("word"))
#> [1] 2 2 1
```

`boundary("word")` is Unicode-aware and handles repeated whitespace correctly. For ASCII-only text you can also use `"\\w+"`, but `boundary("word")` is safer with multilingual data.

### Count overlapping cases (and why str_count does not)

**str_count() returns non-overlapping matches by default.** A lookahead converts that to overlapping counts when you need them.

```r title="Non-overlapping match behavior"
str_count("aaaa", "aa")
#> [1] 2
```

str_count() returns 2, not 3. After matching positions 1-2, the scanner restarts at position 3, so positions 2-3 cannot match. If you need overlapping counts, use a lookahead.

```r title="Overlapping matches via lookahead"
str_count("aaaa", "(?=aa)")
#> [1] 3
```

The lookahead matches at every position without consuming characters, so all three start positions count.

### Count rows in a tibble that match a pattern

**Per-row counts feed text feature engineering.** Combine str_count() with dplyr to summarize counts across a column.

```r title="Count matching rows in mtcars row names"
library(dplyr)
library(tibble)
mtcars |>
  rownames_to_column("car") |>
  mutate(has_v8_hint = str_count(car, regex("v", ignore_case = TRUE))) |>
  summarise(total_v_letters = sum(has_v8_hint))
#> # A tibble: 1 x 1
#>   total_v_letters
#>             <int>
#> 1               6
```

This pattern (per-row count then summarize) shows up constantly in text feature engineering. Compare to `str_detect()` which would give you a logical and lose the per-row magnitude.

## str_count() vs str_detect() vs base R

**Three functions answer different questions about the same regex.** Picking the wrong one is the most common stringr error.

| Function | Returns | When to use |
|---|---|---|
| `str_count(x, p)` | integer vector of match counts | quantify how many hits per string |
| `str_detect(x, p)` | logical vector | only need yes/no per string |
| `str_extract_all(x, p)` | list of character vectors | need the matched text itself |
| `lengths(regmatches(x, gregexpr(p, x)))` | integer (base R) | no stringr dependency |
| `nchar(x)` or `str_length(x)` | integer length | counting characters, not matches |

The base R equivalent works but requires three nested calls and does not handle NA cleanly. str_count() collapses that to one vectorized call with sensible NA propagation.

[KEY INSIGHT]
**Counts beat booleans for feature engineering.** Whenever a downstream model could benefit from "how many" instead of "any", reach for str_count(). Converting to a logical later is easy; reconstructing counts after the fact is not.

## Common pitfalls

**Three pitfalls cause most str_count() bugs.** Each has a one-line fix.

### Regex special characters in fixed text

**Dot, plus, and parens are regex metacharacters.** Wrap them in fixed() or escape them, or you will count more than you expected.

```r title="Dot matches any character, not literal dot"
ip <- c("10.0.0.1", "192.168.1.1")
str_count(ip, ".")          # wrong: . matches any character
#> [1]  8 11
str_count(ip, fixed("."))   # right: literal dot
#> [1] 3 3
```

Always wrap literal punctuation in `fixed()` unless you specifically want regex semantics.

### Forgetting NA propagation

**NA inputs return NA, not 0.** That preserves missingness but can break sums; coerce first if you want 0.

```r title="NA stays NA, not 0"
x <- c("abc", NA, "ab")
str_count(x, "a")
#> [1]  1 NA  1
```

If you want NA strings to count as 0, replace them first with `str_replace_na(x, "")` or `coalesce(x, "")`.

### Pattern length recycled silently

**Recycling mismatched lengths warns but does not stop.** Verify lengths match if you want pairwise counts.

```r title="Recycling a 2-element pattern across 3 strings warns"
str_count(c("aa", "bb", "cc"), c("a", "b"))
#> Warning message:
#> longer object length is not a multiple of shorter object length
#> [1] 2 2 0
```

When you really want one pattern per string, ensure `length(pattern) == length(string)` or pass a scalar.

[WARNING]
**stringr 1.5 removed silent recycling for incompatible lengths.** If you upgrade from an older project, run str_count() over your test data first. The new behavior raises a clear error instead of returning a misleading short vector.

## Try it yourself

**Try it:** Build a per-row count of vowels in the `state.name` built-in vector and return the names with the most vowels.

```r title="Your turn: count vowels in state names"
# Try it: count vowels per state name
ex_vowels <- # your code here

head(ex_vowels, 3)
#> Expected: a numeric vector with 50 entries
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_vowels <- str_count(state.name, regex("[aeiou]", ignore_case = TRUE))
state.name[ex_vowels == max(ex_vowels)]
#> [1] "North Carolina" "South Carolina"
```

**Explanation:** `regex(..., ignore_case = TRUE)` matches both upper and lowercase vowels in one pass. We then index `state.name` by the max count to find the tied winners.

</details>

## Related stringr functions

When str_count() is not quite what you need, these are the next stops:

- [str_detect()](stringr-str_detect-in-R.html) returns a logical for yes/no presence checks.
- [str_extract()](stringr-str_extract-in-R.html) and `str_extract_all()` return the matched text itself.
- [str_replace()](stringr-str_replace-in-R.html) substitutes the match with another string.
- [str_split()](stringr-str_split-in-R.html) breaks each string on the pattern.
- [str_locate()](stringr-str_locate-in-R.html) returns the start and end position of the first match.
- [str_length()](stringr-in-R.html) returns the character count per string without a regex.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_count.html) on the tidyverse site documents every helper modifier.

## FAQ

**How is str_count() different from length() in base R?**

`length()` returns the number of elements in a vector. str_count() returns a vector of the same length where each entry is the number of pattern matches inside that element. They answer different questions: `length(x)` tells you how many strings you have; `str_count(x, p)` tells you how many times the pattern occurs in each string.

**Does str_count() count overlapping matches?**

No. str_count() returns non-overlapping match counts because it relies on `gregexpr()` semantics under the hood. If you need overlapping counts, use a regex lookahead: `str_count(x, "(?=pattern)")`. The lookahead matches at every position without consuming characters, so all overlapping starts count.

**How do I count words in a column with stringr?**

Use `str_count(text, boundary("word"))`. The `boundary("word")` helper is Unicode-aware, handles repeated whitespace, and counts tokens rather than characters. For ASCII-only text `"\\w+"` works too, but the boundary helper is safer with multilingual data and contractions.

**Is str_count() faster than gregexpr() in base R?**

For typical vectors (under 1M elements), str_count() and `lengths(gregexpr(p, x))` perform within 10% of each other because both call the same regex engine. str_count() wins on readability and NA handling. For tight inner loops, profile both; otherwise prefer the stringr version.

**Why does str_count() return NA for some rows?**

NA inputs propagate to NA outputs by design. This avoids hiding missing data behind a 0 count. If you specifically want missing strings to count as 0, replace NA values first with `tidyr::replace_na(x, "")` or `dplyr::coalesce(x, "")` before counting.
