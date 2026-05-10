---
title: "gsub() in R: Replace All Pattern Matches"
slug: "base-gsub-in-R"
description: "Use base R gsub() to replace all regex matches in a character vector. Covers gsub vs sub, fixed = TRUE, backreferences, and 5 worked replacement examples."
keywords: "gsub in R, R replace string, gsub regex, gsub vs sub, R string replace all, gsub backreferences, gsub fixed, base R replace"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Vectors.html"
auto_link_terms: "gsub()|R gsub|sub()|replace pattern|regex replace"
auto_link_case_sensitive: true
target_keyword: "gsub in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# gsub() in R: Replace All Pattern Matches

<p class="lead">The <code>gsub()</code> function in base R replaces ALL regex matches in a character vector with a replacement. <code>sub()</code> replaces only the FIRST match per string. Both are vectorized.</p>

[QUICK ANSWER]
gsub("apple", "orange", x)              # replace all
sub("apple", "orange", x)               # replace first only
gsub("\\d+", "#", x)                    # all digits
gsub("\\s+", " ", x)                    # collapse whitespace
gsub("(\\d+)-(\\d+)", "\\2-\\1", x)     # backreference swap
gsub("apple", "orange", x, fixed = TRUE)# literal
gsub("apple", "orange", x, ignore.case = TRUE)

[DECISION TREE: Is gsub() the right tool?]
- replace ALL matches: gsub()
- replace ONLY first match per string: sub()
- check whether match exists: grepl() / grep()
- extract the match: regmatches() or stringr::str_extract()
- literal replacement (no regex): gsub(..., fixed = TRUE)
- complex multi-step replace: stringr::str_replace_all() with named vector
- remove (replace with ""): gsub("pattern", "", x)

## What gsub() does in one sentence

**`gsub(pattern, replacement, x)` finds every regex match of `pattern` in each string of `x` and replaces it with `replacement`.** `sub()` does the same but stops after the first match per string.

These are the standard base R functions for text cleaning: removing punctuation, normalizing whitespace, swapping codes, masking sensitive values.

## Syntax

**`gsub(pattern, replacement, x, ignore.case = FALSE, perl = FALSE, fixed = FALSE)`.**

```r title="Replace all 'apple' with 'orange'"
x <- c("apple pie with apple", "banana", "apple cake")
gsub("apple", "orange", x)
#> [1] "orange pie with orange" "banana"                 "orange cake"

sub("apple", "orange", x)  # first only
#> [1] "orange pie with apple"  "banana"                "orange cake"
```

[TIP]
**Default is regex; pass `fixed = TRUE` for literal replacement.** Without `fixed`, characters like `.` `*` `+` `(` are special. `gsub(".", "x", "abc")` returns "xxx" (each char). `gsub(".", "x", "abc", fixed = TRUE)` returns "abc" (no `.` in input).

## Five common patterns

### 1. Remove punctuation

```r title="Strip non-word characters"
x <- c("Hello, World!", "How are you?")
gsub("[[:punct:]]", "", x)
#> [1] "Hello World" "How are you"
```

`[[:punct:]]` is a POSIX class for punctuation.

### 2. Collapse whitespace

```r title="Multiple spaces into one"
x <- "  hello   world  "
gsub("\\s+", " ", x)
#> [1] " hello world "

trimws(gsub("\\s+", " ", x))
#> [1] "hello world"
```

`\\s+` matches one or more whitespace chars; `trimws` removes leading/trailing.

### 3. Replace digits with placeholder

```r title="Mask numbers"
x <- c("user123", "item456", "abc")
gsub("\\d+", "#", x)
#> [1] "user#" "item#" "abc"
```

### 4. Backreferences (capture and swap)

```r title="Reorder date components"
dates <- c("2024-01-15", "2025-03-20")
gsub("(\\d{4})-(\\d{2})-(\\d{2})", "\\3/\\2/\\1", dates)
#> [1] "15/01/2024" "20/03/2025"
```

`\\1`, `\\2`, `\\3` reference the 1st, 2nd, 3rd capture groups in the pattern.

### 5. Remove instead of replace

```r title="Empty string deletes the match"
x <- c("apple-pie-123", "banana-456")
gsub("-\\d+$", "", x)
#> [1] "apple-pie" "banana"
```

Replacing with `""` is the standard "delete pattern" idiom.

[KEY INSIGHT]
**`gsub` is REGEX by default; if you want literal text, use `fixed = TRUE`.** Forgetting this is the #1 source of bugs. `gsub(".", "x", "abc")` replaces EVERY character because `.` is regex. Always think: is my pattern regex or literal?

## gsub() vs sub() vs str_replace_all() vs chartr()

**Four "find and replace" functions in R, with different scope.**

| Function | Replaces | Regex | Best for |
|---|---|---|---|
| `gsub()` | All matches | Yes (default) | Standard regex replace |
| `sub()` | First match per string | Yes (default) | "Replace first occurrence" |
| `stringr::str_replace_all()` | All matches | Yes | Tidyverse pipelines |
| `stringr::str_replace()` | First match | Yes | Tidyverse, single replace |
| `chartr()` | Char-by-char map | No | Translate single chars |

When to use which:

- **gsub** for default base R replacement.
- **sub** when you only want the first hit (useful for "trim leading X" patterns).
- **str_replace_all** for tidyverse code.
- **chartr** for fast 1-to-1 character mapping (no regex needed).

## A practical text-cleaning workflow

**Most text cleaning is a chain of gsub calls.** A typical pipeline:

1. Lowercase: `tolower(x)`
2. Strip punctuation: `gsub("[[:punct:]]", "", x)`
3. Collapse whitespace: `gsub("\\s+", " ", x)`
4. Trim: `trimws(x)`
5. Standardize specific tokens: `gsub("usa|united states", "US", x, ignore.case = TRUE)`

Build the chain incrementally and inspect intermediate results. The biggest source of bugs is a regex that matches more (or less) than you intended.

## Common pitfalls

**Pitfall 1: backslash escaping.** Regex `\d` is `"\\d"` in an R string. `gsub("\d+", ...)` ERRORS or behaves unexpectedly. Always use `\\d` (double backslash).

**Pitfall 2: greedy vs lazy quantifiers.** `gsub("<.*>", "", "<a>text<b>")` returns "" (greedy). For lazy match, use `<.*?>` (works in `perl = TRUE` mode) or anchor more precisely.

[WARNING]
**Replacing with backreferences requires a CAPTURE group in the pattern.** `gsub("\\d+", "(\\1)", x)` does NOT work because there are no parentheses around `\\d+`. Wrap in `(...)` to capture: `gsub("(\\d+)", "(\\1)", x)`.

## Performance and Unicode notes

**For most everyday inputs, gsub is fast enough that you should not think about performance.** It runs in compiled C and handles vectors of millions of strings without issue. Two situations where performance does matter: very long strings (megabyte-class text) and patterns with catastrophic backtracking (alternation inside a quantifier, e.g., `(a|a)*`). For megabyte text, `stringi::stri_replace_all_regex()` is faster and Unicode-aware. For pathological patterns, simplify or use `perl = TRUE` which has different backtracking rules. Unicode handling in base gsub depends on locale; use stringi or stringr for consistent UTF-8 behaviour across platforms.

## Try it yourself

**Try it:** Clean these phone numbers by stripping all non-digit characters. Save to `ex_phones`.

```r title="Your turn: digits-only"
phones <- c("(555) 123-4567", "555.234.5678", "+1 555 345 6789")

ex_phones <- # your code here

ex_phones
#> Expected: c("5551234567", "5552345678", "15553456789")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_phones <- gsub("\\D", "", phones)
ex_phones
#> [1] "5551234567"  "5552345678"  "15553456789"
```

**Explanation:** `\\D` matches any NON-digit character. Replacing with `""` removes them. Result is digits-only.

</details>

## Related replace functions

After mastering gsub, look at:

- `sub()`: first-match variant
- `stringr::str_replace_all()`: tidyverse equivalent
- `stringr::str_replace()`: first-match tidyverse
- `chartr()`: character-by-character translation
- `regexec()` + `regmatches()`: extract capture groups for inspection
- `tools::toTitleCase()`: capitalize words

For replacing many specific patterns at once, `stringr::str_replace_all(x, named_vector)` is cleaner than chaining gsubs.

## FAQ

**What is the difference between gsub and sub in R?**

`gsub` replaces ALL matches in each string. `sub` replaces only the FIRST match per string. They share the same arguments.

**How do I replace multiple patterns at once with gsub?**

Chain calls: `gsub("p2", "r2", gsub("p1", "r1", x))`. Or use `stringr::str_replace_all(x, c("p1" = "r1", "p2" = "r2"))` for a cleaner named-vector approach.

**How do I do a literal replace with gsub?**

Pass `fixed = TRUE`: `gsub(".", "x", x, fixed = TRUE)` replaces literal periods, not "any character".

**What is a backreference in gsub?**

`\\1`, `\\2`, etc. in the replacement refer to capture groups (parenthesized parts of the pattern). They let you reorder or reuse matched parts in the output.

**How do I make gsub case-insensitive?**

Pass `ignore.case = TRUE`. Or use the inline regex flag with `perl = TRUE`: `gsub("(?i)apple", "fruit", x, perl = TRUE)`.
