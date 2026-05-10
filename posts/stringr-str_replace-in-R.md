---
title: "stringr str_replace() in R: Replace Pattern in Strings"
slug: "stringr-str_replace-in-R"
description: "Use stringr str_replace() and str_replace_all() to replace patterns in strings in R. Covers backreferences, fixed match, case-insensitive, and 5 examples."
keywords: "str_replace, stringr str_replace, str_replace_all R, replace pattern in R, R gsub alternative, regex replace R, stringr replace"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "str_replace()|str_replace_all()|stringr str_replace|stringr::str_replace()|regex replace"
auto_link_case_sensitive: true
target_keyword: "stringr str_replace"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_replace() in R: Replace Pattern in Strings

<p class="lead">The <code>str_replace()</code> function in stringr replaces the FIRST match of a pattern with a replacement string. Use <code>str_replace_all()</code> to replace EVERY match. Both are vectorized and pipe-friendly.</p>

[QUICK ANSWER]
str_replace(x, "old", "new")                       # first match per string
str_replace_all(x, "old", "new")                   # all matches
str_replace(x, fixed("text"), "other")             # literal
str_replace(x, regex("p", ignore_case = TRUE), "X")# case-insensitive
str_replace(x, "(\\d+)", "[\\1]")                  # backreference (\\1)
str_replace_all(x, c("a"="1", "b"="2"))            # named vector of replacements
gsub("old", "new", x)                              # base R alternative

[DECISION TREE: Is str_replace() the right tool?]
- replace first match per string: str_replace()
- replace ALL matches per string: str_replace_all()
- replace by named lookup: str_replace_all(x, c(old1=new1,...))
- conditional replace: str_replace(x, "p", function(m) ...) or case_when
- detect (don't replace): str_detect()
- extract matched part: str_extract()
- remove matched part: str_remove() / str_remove_all()

## What str_replace() does in one sentence

**`str_replace(string, pattern, replacement)` substitutes the FIRST match of `pattern` in each input string with `replacement`.** `str_replace_all()` is the same but replaces every match. Pattern is a regex by default; wrap with `fixed()` for literal text.

These are the workhorses of text cleanup: standardizing case, fixing typos, masking sensitive data, applying token substitutions.

## Syntax

**`str_replace(string, pattern, replacement)`. Pattern is regex; replacement may use `\\1`, `\\2` etc. for capture groups.**

```r title="Load stringr and replace simple text"
library(stringr)

x <- c("apple pie", "apple cake", "banana bread")

str_replace(x, "apple", "orange")
#> [1] "orange pie"  "orange cake" "banana bread"
```

[TIP]
**Use `str_replace_all()` when you might have MULTIPLE matches per string.** `str_replace("aaa", "a", "x")` returns "xaa" (first match only). `str_replace_all("aaa", "a", "x")` returns "xxx".

## Five common patterns

### 1. Replace first match

```r title="One replacement per string"
str_replace("hello world", "o", "0")
#> [1] "hell0 world"
```

The FIRST "o" is replaced. Subsequent "o"s remain.

### 2. Replace all matches

```r title="Replace every occurrence"
str_replace_all("hello world", "o", "0")
#> [1] "hell0 w0rld"
```

`str_replace_all` substitutes every match.

### 3. Use backreferences

```r title="Wrap digits in brackets"
str_replace("price 100 dollars", "(\\d+)", "[\\1]")
#> [1] "price [100] dollars"
```

`(\\d+)` captures digits. `\\1` in the replacement refers to that captured group.

### 4. Named vector of replacements

```r title="Multiple substitutions in one call"
str_replace_all(c("a is 1", "b is 2"), c("a" = "alpha", "b" = "beta"))
#> [1] "alpha is 1" "beta is 2"
```

Pass a named character vector. Each name is searched (regex); each value replaces the match.

### 5. Replace with a function

```r title="Compute replacement dynamically"
str_replace_all("a1 b2 c3", "(\\d+)", function(m) as.character(as.numeric(m) * 10))
#> [1] "a10 b20 c30"
```

A function in the replacement position receives matched text and returns the replacement. Useful for arithmetic or lookups.

[KEY INSIGHT]
**`str_replace_all()` with a NAMED VECTOR is the dplyr equivalent of multiple `mutate()` substitutions.** `str_replace_all(x, c("foo"="bar","baz"="qux"))` does two substitutions in one pass. Cleaner than chaining individual `str_replace()` calls.

## Common pitfalls

**Pitfall 1: regex characters interpreted literally.** `str_replace("a.b", ".", "X")` replaces ANY character (because `.` is regex). Use `str_replace("a.b", fixed("."), "X")` for literal dot.

**Pitfall 2: forgetting backreference escape.** Replacement `\\1` (R string for `\1`) refers to capture group 1. `\1` (one backslash) is interpreted by R first; you need `\\1` in source code.

[WARNING]
**`str_replace()` only replaces the FIRST match. `str_replace_all()` replaces ALL.** New users often use `str_replace()` and wonder why only the first "old" became "new". Always pick the variant that matches your need.

## Try it yourself

**Try it:** Standardize phone numbers in `phones` to remove spaces. Save to `ex_clean`.

```r title="Your turn: strip spaces from phone numbers"
phones <- c("123 456 7890", "555 123 4567")

ex_clean <- # your code here

ex_clean
#> Expected: c("1234567890", "5551234567")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- str_replace_all(phones, " ", "")
ex_clean
#> [1] "1234567890" "5551234567"
```

**Explanation:** `str_replace_all` replaces EVERY space with empty string. Use `_all` because there are multiple spaces per phone.

</details>

## Related stringr functions

After mastering str_replace, look at:

- `str_remove()`, `str_remove_all()`: shortcut for replace with empty string
- `str_replace_na()`: replace NA values with a string
- `str_to_lower()`, `str_to_upper()`, `str_to_title()`: case conversion
- `str_trim()`, `str_squish()`: whitespace cleanup
- `gsub()` (base R): equivalent without dependency

For multi-pattern dictionary replacements, named vectors with `str_replace_all` are the cleanest pattern.

## FAQ

**How do I replace text in R using stringr?**

Use `str_replace(x, "old", "new")` for the first match per string. Use `str_replace_all(x, "old", "new")` for every match. Both are vectorized; the input vector and output have the same length.

**What is the difference between str_replace and gsub?**

Both replace patterns in strings. `str_replace_all()` and `gsub()` give identical results for simple cases. stringr is more consistent (NA in -> NA out, predictable lengths). gsub is base R with no package dependency.

**How do I do a case-insensitive replace in R?**

Wrap pattern in `regex(pattern, ignore_case = TRUE)`: `str_replace_all(x, regex("apple", ignore_case = TRUE), "X")`.

**How do I replace using regex backreferences in R?**

In the replacement string, use `\\1`, `\\2`, etc. to refer to capture groups: `str_replace(x, "(\\d+)", "[\\1]")` wraps the matched digits in brackets.

**How do I use a lookup table to replace many patterns at once?**

Pass a named character vector to `str_replace_all`: `str_replace_all(x, c("apple"="A", "banana"="B"))`. Each name is the pattern; each value is the replacement. Done in one pass.
