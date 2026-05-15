---
title: "stringr fixed() in R: Match Literal Strings Without Regex"
slug: "stringr-fixed-in-R"
description: "Use stringr fixed() in R to match literal strings without regex interpretation. Covers syntax, ignore_case, performance vs regex, and 6 worked examples."
keywords: "stringr fixed, fixed function R, stringr fixed examples, R literal string match, stringr regex vs fixed, fixed pattern R, escape regex special characters R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "fixed()|stringr fixed|stringr::fixed()|literal string match|fixed pattern"
auto_link_case_sensitive: true
target_keyword: "stringr fixed"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr fixed() in R: Match Literal Strings Without Regex

<p class="lead">The <code>stringr::fixed()</code> function wraps a pattern so stringr matches it as a literal string instead of a regular expression. Use it whenever your pattern contains characters like <code>.</code>, <code>*</code>, <code>?</code>, or <code>(</code> that you want treated as themselves, not as regex metacharacters.</p>

[QUICK ANSWER]
str_detect(x, fixed("."))                       # match literal dot
str_replace(x, fixed("a.b"), "X")               # replace literal "a.b"
str_extract(x, fixed("ver1.0"))                 # extract literal "ver1.0"
str_count(x, fixed("$"))                        # count literal "$"
str_detect(x, fixed("apple", ignore_case=TRUE)) # case-insensitive literal
str_split(x, fixed("|"))                        # split on literal pipe
str_locate(x, fixed("(1)"))                     # locate literal "(1)"

[DECISION TREE: Is fixed() the right tool?]
- match a literal string (no regex): fixed("text")
- match with regex metacharacters as patterns: leave as plain string
- locale-aware comparison (accents, Turkish i): coll("text")
- match word, line, or sentence boundaries: boundary("word")
- tune regex options (multiline, dotall): regex("pat", multiline = TRUE)
- case-insensitive literal match: fixed("text", ignore_case = TRUE)

## What fixed() does in one sentence

**`fixed(pattern, ignore_case = FALSE)` returns a pattern wrapper that tells any `str_*` function to compare bytes verbatim, with no regex parsing.** Wrap your needle in `fixed()` whenever the literal characters in it (`.`, `*`, `+`, `?`, `(`, `)`, `[`, `]`, `{`, `}`, `^`, `$`, `|`, `\`) would otherwise be interpreted by the regex engine.

It is not a matching function on its own. You pass its output to `str_detect()`, `str_replace()`, `str_extract()`, `str_count()`, `str_split()`, and similar.

## Syntax

**`fixed(pattern, ignore_case = FALSE)`. Always pass the result into another `str_*` function.**

```r title="Load stringr and wrap a literal pattern"
library(stringr)

x <- c("v1.5", "v125", "v15", "v1-5")
str_detect(x, fixed("1.5"))
#> [1]  TRUE FALSE FALSE FALSE
```

Without `fixed()`, the dot would mean "any single character" and would match `"v125"` too. With `fixed()`, the dot is just a dot.

[TIP]
**Use `fixed()` whenever the pattern is user input or a known literal.** Regex parsing of unsanitized input is a frequent silent-bug source: a stray `(` or `*` from user data turns a "did this column contain X?" query into a regex error or false positive.

## Six common patterns

### 1. Match a literal dot, dollar, or other metacharacter

```r title="Literal dot in version strings"
versions <- c("1.5", "1a5", "1b5", "15")
str_detect(versions, fixed("."))
#> [1]  TRUE FALSE FALSE FALSE
```

`.` is the most common regex metacharacter and a frequent surprise. `fixed(".")` matches exactly one dot. The bare pattern `"."` matches every non-empty string.

### 2. Replace a literal substring containing parens

```r title="Strip footnote markers like (1)"
x <- c("alpha(1)", "beta(2)", "gamma")
str_replace(x, fixed("(1)"), "")
#> [1] "alpha" "beta(2)" "gamma"
```

Parentheses are regex grouping operators. Without `fixed()`, you would have to escape them as `"\\(1\\)"`.

### 3. Case-insensitive literal match

```r title="Find apple regardless of case"
fruits <- c("Apple pie", "applesauce", "BANANA", "pineapple")
str_detect(fruits, fixed("apple", ignore_case = TRUE))
#> [1]  TRUE  TRUE FALSE  TRUE
```

The `ignore_case = TRUE` argument is the literal-match equivalent of `regex(..., ignore_case = TRUE)`. It uses simple ASCII case folding, not locale rules.

### 4. Count a literal special character

```r title="Count dollar signs in receipts"
lines <- c("$12 and $5", "no money", "$$$ jackpot")
str_count(lines, fixed("$"))
#> [1] 2 0 3
```

`$` is the regex anchor for end-of-string. `fixed("$")` counts the literal character.

### 5. Split on a pipe or other delimiter

```r title="Split records on literal pipe"
records <- c("Alice|30|NY", "Bob|45|CA")
str_split(records, fixed("|"))
#> [[1]]
#> [1] "Alice" "30"    "NY"
#>
#> [[2]]
#> [1] "Bob" "45"  "CA"
```

`|` is regex alternation. `fixed("|")` splits on the literal pipe character with no escaping needed.

### 6. Use inside dplyr filter

```r title="Filter rows by literal file extension"
library(dplyr)
library(tibble)
files <- tibble(name = c("report.pdf", "report-pdf.docx", "data.pdf.bak"))

files |> filter(str_detect(name, fixed(".pdf")))
#> # A tibble: 2 x 1
#>   name
#>   <chr>
#> 1 report.pdf
#> 2 data.pdf.bak
```

The literal `.pdf` matches the substring exactly. The bare regex `".pdf"` would also match `"-pdf"` because `.` is "any character".

[KEY INSIGHT]
**`fixed()` is faster than regex for literal needles, and the speed gap grows with pattern length.** stringr uses a Boyer-Moore-style scan for fixed patterns and the full regex engine for everything else. For short patterns the difference is tiny; for long literals or millions of strings, `fixed()` is the right default.

## fixed() vs regex() vs coll() vs boundary()

**stringr ships four pattern modifiers, and each one trades speed for matching power.** Pick by what you need to match:

| Modifier | Use when | Speed | Locale-aware |
|---|---|---|---|
| `fixed("x")` | Literal byte-by-byte match | Fastest | No |
| `regex("x")` | Regular expression (default) | Fast | No |
| `coll("x")` | Accents, ligatures, Turkish i, locale rules | Slowest | Yes |
| `boundary("word")` | Split or detect word, line, sentence | Fast | Locale-aware boundaries |

**Decision rule:** start with the default (regex). Switch to `fixed()` when your pattern contains metacharacters you want literal, or you need a speed boost on big data. Switch to `coll()` only for human-facing text comparisons where `"e"` and `"é"` must match.

```r title="Same input, three modifiers"
x <- c("naive", "naïve", "Naive")

str_detect(x, "naive")                                 # regex (default)
#> [1]  TRUE FALSE FALSE
str_detect(x, fixed("naive", ignore_case = TRUE))      # case-insensitive literal
#> [1]  TRUE FALSE  TRUE
str_detect(x, coll("naive", ignore_case = TRUE, locale = "en"))  # locale-aware
#> [1]  TRUE  TRUE  TRUE
```

[NOTE]
**`fixed(x, ignore_case = TRUE)` uses ASCII case rules.** It does NOT treat accented letters or non-Latin scripts as case variants. For Unicode-correct case folding, use `coll(x, ignore_case = TRUE, locale = "en")` instead.

## Common pitfalls

**Pitfall 1: forgetting to wrap when the pattern came from user input.** If your pattern is a variable from a CSV or form field, assume it may contain regex metacharacters and wrap with `fixed()` unless you specifically want regex behavior. Otherwise a single user-supplied `(` raises `invalid regular expression`.

**Pitfall 2: using `fixed()` when you actually want word boundaries.** `str_detect("pineapple", fixed("apple"))` returns TRUE. To match `apple` as a whole word, use the regex `"\\bapple\\b"` or `boundary("word")` plus equality.

[WARNING]
**`fixed()` does NOT escape backslashes for you, but it also does not interpret them.** `fixed("\\d")` matches the literal two-character sequence backslash-d, not a digit. If you want digit detection, drop `fixed()` and use the regex `"\\d"` directly.

**Pitfall 3: trying to combine `fixed()` with regex anchors or character classes.** `fixed("^apple")` matches a literal caret followed by `"apple"`, not "starts with apple". For anchored matches, use regex: `str_detect(x, "^apple")` or `str_starts(x, "apple")`.

## Try it yourself

**Try it:** Use `fixed()` to count how many times the literal substring `"."` appears in each element of `c("a.b.c", "no dots", "1.5.0")`. Save the counts to `ex_dot_counts`.

```r title="Your turn: count literal dots"
strings <- c("a.b.c", "no dots", "1.5.0")

ex_dot_counts <- # your code here

ex_dot_counts
#> Expected: 2 0 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
strings <- c("a.b.c", "no dots", "1.5.0")
ex_dot_counts <- str_count(strings, fixed("."))
ex_dot_counts
#> [1] 2 0 2
```

**Explanation:** `fixed(".")` tells `str_count()` to look for a literal dot, not the regex "any character". Without `fixed()`, every non-empty string would return its full length because `.` matches any character.

</details>

## Related stringr functions and modifiers

After `fixed()`, the modifiers and functions you most often pair it with:

- `regex()`: opt back into regex behaviour with options like `ignore_case`, `multiline`, `dotall`
- `coll()`: locale-sensitive literal match for accents and Unicode
- `boundary()`: match word, line, sentence, or character boundaries
- `str_detect()`: TRUE/FALSE per string for the wrapped pattern
- `str_replace()` / `str_replace_all()`: substitute matched text
- `str_extract()` / `str_extract_all()`: pull out the matched substring

For multi-pattern lookups, see `str_subset()` (filter) and `str_locate()` (position). The full reference lives in the [stringr documentation](https://stringr.tidyverse.org/reference/modifiers.html).

## FAQ

**What is the difference between fixed() and regex() in stringr?**

`fixed()` matches the pattern as a literal sequence of bytes, with no regex interpretation. `regex()` (the default for plain string patterns) treats characters like `.`, `*`, `+`, `?`, `(`, `)` as metacharacters. Use `fixed()` for speed on literal needles or when your pattern includes regex specials you want treated literally.

**Is fixed() faster than regex in R?**

Yes, especially for long literal patterns and large input vectors. stringr scans fixed patterns with an algorithm tuned for literal substring search and skips regex compilation. For short patterns and small data, the difference is negligible; for production text pipelines, `fixed()` can be several times faster.

**Can fixed() be case-insensitive in stringr?**

Yes. Pass `ignore_case = TRUE`: `fixed("apple", ignore_case = TRUE)`. The match uses ASCII case folding, so `A` matches `a` but `é` does not match `E`. For Unicode-correct case folding, use `coll(pattern, ignore_case = TRUE, locale = "en")` instead.

**How do I match a literal dot or special character in stringr?**

Wrap the pattern in `fixed()`: `str_detect(x, fixed("."))` matches a literal dot. The alternative is escaping in regex: `str_detect(x, "\\.")`. `fixed()` is clearer when several special characters appear in the same pattern, like `fixed("v1.0.0(beta)")`.

**Does fixed() work with stri_ functions from stringi?**

Not directly. `fixed()` returns a stringr-specific wrapper. The stringi equivalent is the `stri_*` functions that already accept `opts_fixed = list()` and `opts_regex = list()` argument lists, or the lower-level `stri_detect_fixed()`, `stri_replace_all_fixed()` family.

**Can I use fixed() with vectorized patterns?**

Yes, `fixed()` is vectorized over `pattern`: `str_detect(c("a.b","x*y"), fixed(c(".", "*")))` returns `c(TRUE, TRUE)`. Each element of the input is matched against the corresponding element of the pattern. Lengths must match or one of them must be length one.
