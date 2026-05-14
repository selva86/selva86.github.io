---
title: "stringr str_replace_all() in R: Replace All Pattern Matches"
slug: "stringr-str_replace_all-in-R"
description: "Use stringr str_replace_all() to replace every match of a pattern in R. Covers named-vector dictionaries, regex, fixed, function callbacks, and gsub comparison."
keywords: "stringr str_replace_all, str_replace_all function R, stringr str_replace_all examples, R str_replace_all multiple patterns, str_replace_all vs gsub, stringr replace all matches, replace all occurrences string R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_replace_all()|stringr str_replace_all|stringr::str_replace_all()|replace all matches|replace every match"
auto_link_case_sensitive: true
target_keyword: "stringr str_replace_all"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_replace_all() in R: Replace All Pattern Matches

<p class="lead">The <code>str_replace_all()</code> function in stringr replaces EVERY match of a pattern in each input string. It accepts a single replacement, a named vector of patterns, or a function callback, making it the workhorse for bulk text substitution in R.</p>

[QUICK ANSWER]
str_replace_all(x, "old", "new")                     # all matches per string
str_replace_all(x, c("a"="1", "b"="2"))              # named-vector dictionary
str_replace_all(x, fixed("a.b"), "X")                # literal match
str_replace_all(x, regex("p", ignore_case=TRUE), "Y")# case-insensitive
str_replace_all(x, "(\\d+)", "[\\1]")                # backreference
str_replace_all(x, "\\d+", \(m) as.numeric(m) * 10)  # function callback
str_replace_all(x, "[aeiou]", "")                    # remove vowels

[DECISION TREE: Is str_replace_all() the right tool?]
- replace EVERY match per string: str_replace_all()
- replace first match only: str_replace()
- delete matches (replace with ""): str_remove_all()
- replace NA values: str_replace_na()
- check if match exists: str_detect()
- extract matched text: str_extract_all()
- split on a pattern: str_split()
- base R alternative: gsub()

## What str_replace_all() does in one sentence

**`str_replace_all(string, pattern, replacement)` substitutes every match of `pattern` in each input string with `replacement`.** Unlike `str_replace()`, which stops after the first match, `str_replace_all()` keeps scanning until no matches remain. The pattern is a regex by default; wrap with `fixed()` for literal text.

This makes it the right tool whenever a string can contain multiple matches: stripping whitespace, masking sensitive tokens, applying dictionary substitutions, or normalizing punctuation across a vector.

## Syntax

**`str_replace_all(string, pattern, replacement)`. Both `pattern` and `replacement` are vectorized; `replacement` can also be a named vector or a function.**

```r title="Load stringr and replace every match"
library(stringr)

x <- c("hello world", "goodbye world", "world peace")

str_replace_all(x, "world", "earth")
#> [1] "hello earth"   "goodbye earth" "earth peace"
```

The output vector always matches the input length. `NA` inputs return `NA`, no error.

[TIP]
**Use `str_replace_all()` whenever your input strings can contain more than one match.** A common bug is reaching for `str_replace()` on free text, where it only swaps the first occurrence. Default to `_all` unless you specifically need a one-shot replacement.

## Six replacement patterns

### 1. Replace every occurrence with one value

```r title="Replace all spaces with underscores"
str_replace_all("data analysis in R", " ", "_")
#> [1] "data_analysis_in_R"
```

Every space becomes an underscore in one pass.

### 2. Named-vector dictionary

```r title="Multiple patterns, multiple replacements"
codes <- c("ord-A confirmed", "ord-B refunded", "ord-C pending")

str_replace_all(codes, c("A" = "alpha", "B" = "beta", "C" = "gamma"))
#> [1] "ord-alpha confirmed" "ord-beta refunded"   "ord-gamma pending"
```

Pass a named character vector. Each name is the pattern (regex), each value is the replacement. All substitutions run in a single pass, so order does not produce cascading rewrites.

[KEY INSIGHT]
**Named-vector dictionary is the killer feature of `str_replace_all()`.** It replaces dozens of patterns in one call without nesting. The same task with base R `gsub` requires `Reduce()` or a loop. Use it for code lookups, abbreviation expansion, or token translation.

### 3. Literal text with fixed()

```r title="Treat dots as literal"
emails <- c("a.b@x.com", "c.d@y.com")

str_replace_all(emails, fixed("."), "_")
#> [1] "a_b@x_com" "c_d@y_com"
```

Without `fixed()`, the regex `.` matches ANY character, replacing everything. `fixed()` opts out of regex.

### 4. Case-insensitive with regex()

```r title="Case-insensitive replacement"
titles <- c("Apple Pie", "APPLE CAKE", "apple tart")

str_replace_all(titles, regex("apple", ignore_case = TRUE), "Mango")
#> [1] "Mango Pie"  "Mango CAKE" "Mango tart"
```

Use `regex(..., ignore_case = TRUE)` to match across capitalization. Other useful flags: `dotall = TRUE` and `multiline = TRUE`.

### 5. Backreferences for structured replacement

```r title="Wrap matched digits in brackets"
str_replace_all("price 100 dollars and 50 cents", "(\\d+)", "[\\1]")
#> [1] "price [100] dollars and [50] cents"
```

`(\\d+)` captures one or more digits. `\\1` in the replacement refers to that group. Useful for reformatting numbers, dates, or tagging matched spans.

### 6. Function callback for dynamic replacement

```r title="Multiply every embedded number by 10"
str_replace_all("a1 b2 c3", "\\d+", \(m) as.character(as.numeric(m) * 10))
#> [1] "a10 b20 c30"
```

A function in the replacement position receives each matched substring and returns its replacement. Perfect for arithmetic, lookups, or anything you cannot express as a fixed string.

## str_replace_all() vs str_replace() vs gsub()

**The three functions look similar but differ in scope, return type, and edge-case handling.**

| Feature | str_replace_all() | str_replace() | gsub() |
|---|---|---|---|
| Matches replaced | All | First only | All |
| NA input | Returns NA | Returns NA | Returns NA |
| Named-vector dictionary | Supported | Not supported | Not supported |
| Function callback | Supported | Supported | Not supported |
| Vectorized over pattern | Yes (recycles) | Yes (recycles) | No (single pattern) |
| Package | stringr | stringr | base R |

For one-off replacements, `gsub()` and `str_replace_all()` give identical output. For dictionary or callback work, `str_replace_all()` is dramatically shorter.

## Common pitfalls

**Pitfall 1: special regex characters interpreted literally.** Characters like `.`, `+`, `*`, `?`, `(`, `)`, `[`, `]`, `$`, `^` carry regex meaning. `str_replace_all("a.b.c", ".", "X")` returns `"XXXXX"` because `.` matches any character. Wrap with `fixed()` or escape with `\\.` for literal dots.

**Pitfall 2: NA inputs silently produced.** If the input string is `NA`, the output is `NA`. Filter or use `str_replace_na()` first if you need a sentinel string instead.

**Pitfall 3: replacement vector length mismatch.** A named-vector replacement is treated as a single dictionary, not a per-element map. To apply different replacements to different elements, use `mapply` or `purrr::map2_chr`.

[WARNING]
**Backslashes need double-escaping in replacement strings.** Use `"\\1"` (not `"\1"`) for backreference 1; use `"\\\\"` for a literal backslash in the output. Forgetting this is the most common cause of "the replacement looks wrong" reports.

## Try it yourself

**Try it:** Anonymize the `emails` vector by replacing the local part (everything before `@`) with `"user"`. Save the result to `ex_anon`.

```r title="Your turn: anonymize email local parts"
emails <- c("alice@example.com", "bob.smith@work.org", "c@d.io")

ex_anon <- # your code here

ex_anon
#> Expected: c("user@example.com", "user@work.org", "user@d.io")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_anon <- str_replace_all(emails, "^[^@]+", "user")
ex_anon
#> [1] "user@example.com" "user@work.org"    "user@d.io"
```

**Explanation:** `^[^@]+` matches one or more non-`@` characters anchored at the start. `str_replace_all()` swaps that whole match for `"user"`. Anchoring at `^` guarantees only the local part is touched.

</details>

## Related stringr functions

After mastering `str_replace_all()`, look at:

- `str_replace()`: replaces only the first match per string
- `str_remove_all()`: shortcut for `str_replace_all(x, pattern, "")`
- `str_replace_na()`: turn `NA` values into a fixed string before further cleaning
- `str_detect()`, `str_count()`: check whether or how many matches exist before replacing
- `str_extract_all()`: pull the matched text instead of substituting it
- `gsub()` from base R: drop-in equivalent without a stringr dependency

For bulk dictionary substitutions, the named-vector form of `str_replace_all()` is the cleanest pattern in R. Reach for `dplyr::case_when()` only when the replacement logic depends on the full row rather than the matched text.

## FAQ

**What is the difference between str_replace and str_replace_all?**

`str_replace()` substitutes only the FIRST match of the pattern in each input string and then stops. `str_replace_all()` keeps scanning and replaces EVERY match. For strings that may contain multiple occurrences (free text, paragraphs, CSV cells with repeated tokens), `str_replace_all()` is almost always the safer default.

**What does str_replace_all do in R?**

`str_replace_all()` from the stringr package takes a character vector, a regex (or `fixed()`) pattern, and a replacement, and returns a new vector where every match of the pattern has been swapped with the replacement. The replacement can also be a named vector for dictionary substitution or a function that computes the replacement from the matched text.

**How to replace all occurrences in a string in R?**

Use `str_replace_all(x, "pattern", "new")` from stringr or `gsub("pattern", "new", x)` from base R. Both replace every match. With stringr you also get `fixed()` for literal patterns, `regex(ignore_case = TRUE)` for case-insensitive replacement, and named-vector dictionaries for multi-pattern substitution.

**How do I replace many patterns at once with str_replace_all?**

Pass a named character vector as the second argument: `str_replace_all(x, c("apple" = "A", "banana" = "B"))`. Each name is searched as a regex, and each value replaces its match. All substitutions run in one pass, so earlier replacements never feed into later ones.

**How is str_replace_all different from gsub?**

For simple regex replacements they produce identical output. `str_replace_all()` adds three capabilities `gsub()` lacks: named-vector dictionaries, function callbacks in the replacement, and consistent `NA`-in `NA`-out semantics. `gsub()` wins when you want zero dependencies, since it ships with base R.
