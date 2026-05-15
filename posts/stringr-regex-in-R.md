---
title: "stringr Regex in R: Match, Extract, and Replace Patterns"
slug: "stringr-regex-in-R"
description: "Use stringr regex in R to match, extract, replace, and split text. Covers regex() options, anchors, character classes, capture groups, and 8 worked examples."
keywords: "stringr regex, regex in stringr, stringr pattern matching, str_detect regex, str_extract regex, regex() function R, stringr regular expression"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "stringr regex|regex in stringr|regex()|stringr::regex()|stringr regular expression"
auto_link_case_sensitive: true
target_keyword: "stringr regex"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr Regex in R: Match, Extract, and Replace Patterns

<p class="lead">stringr regex in R is the default pattern language for every <code>str_*</code> function: pass a regular expression as the <code>pattern</code> argument and stringr matches, extracts, replaces, or splits text accordingly. Wrap the pattern in <code>regex()</code> only when you need options like <code>ignore_case</code>, <code>multiline</code>, or <code>dotall</code>.</p>

[QUICK ANSWER]
str_detect(x, "^abc")                              # starts with abc
str_extract(x, "\\d+")                             # first run of digits
str_extract_all(x, "[A-Z][a-z]+")                  # all capitalized words
str_replace(x, "\\s+", " ")                        # collapse whitespace
str_split(x, ",\\s*")                              # split on comma + space
str_detect(x, regex("^err", ignore_case = TRUE))   # case-insensitive prefix
str_match(x, "(\\w+)@(\\w+\\.\\w+)")               # capture user and domain
str_count(x, "\\b\\w+\\b")                         # count words

[DECISION TREE: Is regex the right tool for your pattern?]
- match a pattern with anchors or character classes: leave the string as is, stringr treats it as regex
- match a literal string with metacharacters: fixed("a.b")
- need case-insensitive or multiline options: regex("pat", ignore_case = TRUE)
- compare accents or Turkish i correctly: coll("text", locale = "en")
- match word, line, or sentence boundaries: boundary("word")
- replace only the first match: str_replace(x, "pat", "rep")
- replace every match in each string: str_replace_all(x, "pat", "rep")

## What stringr regex is in one sentence

**Every plain string you pass as the `pattern` argument to a stringr function is parsed as a Perl-compatible regular expression.** That means `.` matches any character, `*` repeats the previous token, `^` and `$` anchor to start and end, and backslash sequences like `\\d` (digit) and `\\s` (whitespace) work as expected.

You only wrap the pattern in `regex()` when you need to set options. For literal text, switch to `fixed()` instead.

## stringr regex syntax cheat sheet

**The five regex building blocks you need are anchors, character classes, quantifiers, groups, and escapes.** Every pattern in this post is composed from this short vocabulary.

| Token | Matches | Example |
|---|---|---|
| `^` `$` | start, end of string | `^abc` `xyz$` |
| `.` | any character except newline | `a.c` matches `abc`, `a-c` |
| `\\d` `\\w` `\\s` | digit, word char, whitespace | `\\d+` matches `42` |
| `[abc]` `[^abc]` | char class, negated class | `[A-Z]` matches one capital |
| `*` `+` `?` | 0+, 1+, 0-or-1 of previous | `colou?r` matches both spellings |
| `{n}` `{n,m}` | exact / range count | `\\d{4}` matches `2026` |
| `()` | capture group | `(\\w+)@` captures user |
| `|` | alternation | `cat|dog` matches either |
| `\\b` | word boundary | `\\bcat\\b` matches `cat` not `cats` |

In R strings, every backslash must be doubled: write `\\d`, not `\d`. The regex engine sees `\d`; R sees `\\d` so it knows to keep the backslash literal.

[KEY INSIGHT]
**stringr does not invent a new regex dialect, it forwards your pattern to the ICU engine via stringi.** That means every standard PCRE feature works: lookaheads, lookbehinds, non-greedy quantifiers, named groups. If a pattern works on regex101.com with PCRE flavor, it works in stringr.

## Four stringr functions that consume regex

**The bulk of regex work in stringr goes through four functions, one per task.** Detect, extract, replace, and match each take a regex as the `pattern` argument and apply it across a vector.

### Detect with str_detect()

**`str_detect()` answers "does this string match the pattern?"** Pass a character vector and a regex; get a logical vector the same length back.

```r title="Load stringr and detect a pattern"
library(stringr)

emails <- c("ann@example.com", "bob.smith@x.io", "not-an-email", "carol@y.org")
str_detect(emails, "@.+\\.")
#> [1]  TRUE  TRUE FALSE  TRUE
```

`str_detect()` returns a logical vector the same length as input. The pattern `"@.+\\."` requires an `@`, then one or more characters, then a literal dot, so it filters email-shaped strings.

[TIP]
**Anchor your patterns whenever you can.** `str_detect(x, "abc")` returns TRUE for `"abc"`, `"xabcy"`, and `"123abc456"`. Anchored `^abc$` matches only the exact string `"abc"`. Unanchored patterns are a common silent-bug source on validation tasks.

### Extract with str_extract() and str_extract_all()

**`str_extract()` pulls the first matched substring; `str_extract_all()` pulls every match.** Both accept the same regex argument and differ only in output shape.

```r title="Extract digits from log lines"
logs <- c("error 404 at /home", "200 OK", "503 retry-after 30")
str_extract(logs, "\\d+")
#> [1] "404" "200" "503"

str_extract_all(logs, "\\d+")
#> [[1]]
#> [1] "404"
#>
#> [[2]]
#> [1] "200"
#>
#> [[3]]
#> [1] "503" "30"
```

`str_extract()` returns the first match per string; `str_extract_all()` returns every match as a list. Add `simplify = TRUE` to get a character matrix when every string has the same number of matches.

### Replace with str_replace() and str_replace_all()

**`str_replace()` swaps the first match; `str_replace_all()` swaps every match.** The replacement string can reference capture groups with `\\1`, `\\2`.

```r title="Mask phone numbers and reorder names"
text <- c("call 415-555-0100", "fax 510-555-0123, cell 415-555-0199")
str_replace_all(text, "\\d{3}-\\d{3}-\\d{4}", "XXX-XXX-XXXX")
#> [1] "call XXX-XXX-XXXX"
#> [2] "fax XXX-XXX-XXXX, cell XXX-XXX-XXXX"

names <- c("Smith, Ann", "Lee, Bob")
str_replace(names, "(\\w+),\\s*(\\w+)", "\\2 \\1")
#> [1] "Ann Smith" "Bob Lee"
```

`str_replace()` substitutes only the first match in each string; `str_replace_all()` substitutes every match. Both accept regex back-references in the replacement string: write `\\1`, `\\2` to insert capture groups.

### Capture with str_match()

**`str_match()` returns capture groups as a matrix, one column per group.** Use it when you need to split a matched string into named pieces.

```r title="Split email into user and domain"
emails <- c("ann@example.com", "bob.smith@x.io")
str_match(emails, "([\\w.]+)@([\\w.]+)")
#>      [,1]                [,2]        [,3]
#> [1,] "ann@example.com"   "ann"       "example.com"
#> [2,] "bob.smith@x.io"    "bob.smith" "x.io"
```

`str_match()` returns a character matrix: column 1 is the full match, columns 2..N are each capture group. `str_match_all()` does the same for every match in each string and returns a list of matrices.

## regex() options: case, multiline, dotall, comments

**Wrap your pattern in `regex()` only when you need to flip an engine option.** Plain string patterns get the default options, which is what 90% of code wants.

```r title="Case-insensitive prefix match"
msgs <- c("ERROR: disk full", "Error: timeout", "ok")
str_detect(msgs, regex("^error", ignore_case = TRUE))
#> [1]  TRUE  TRUE FALSE
```

The `regex()` modifier accepts five options:

| Option | Effect |
|---|---|
| `ignore_case = TRUE` | case-insensitive matching |
| `multiline = TRUE` | `^` and `$` match line boundaries inside each string |
| `dotall = TRUE` | `.` also matches newline characters |
| `comments = TRUE` | whitespace and `#` comments ignored in the pattern |
| `literal = TRUE` | shortcut for `fixed()` behavior |

```r title="Multiline anchors across lines in one string"
block <- "line1\nERROR line2\nline3"
str_extract_all(block, regex("^ERROR.*$", multiline = TRUE))[[1]]
#> [1] "ERROR line2"
```

[NOTE]
**`fixed()` is the right tool when your pattern is a literal needle.** It is a separate wrapper, not a `regex()` option. See the fixed() post for byte-by-byte literal matching and ASCII case folding.

## Common pitfalls

**Pitfall 1: single backslash in R strings.** R parses `"\d"` as an unknown escape and warns. Always write `"\\d"`, `"\\s"`, `"\\b"` with two backslashes. Raw strings work too: `r"(\d+)"` is identical to `"\\d+"` and easier to read for complex patterns.

**Pitfall 2: greedy quantifiers eat too much.** `str_extract("'a' and 'b'", "'.+'")` returns `"'a' and 'b'"`, not `"'a'"`. Make the quantifier non-greedy with `?`: `"'.+?'"` returns `"'a'"`.

[WARNING]
**`str_detect()` returns TRUE for partial matches by default.** `str_detect("apple pie", "apple")` is TRUE. To require an exact full-string match, anchor the pattern: `str_detect("apple pie", "^apple$")` is FALSE. Validators that forget this anchor silently accept too much.

**Pitfall 3: forgetting to escape special characters in user input.** If your pattern comes from a CSV column or form field, a stray `(` or `*` raises `invalid regular expression`. Either wrap the pattern in `fixed()` or escape with `str_escape()` (stringr 1.5+).

## Try it yourself

**Try it:** Extract every word that starts with a capital letter from `c("Hello World", "the BBC said Hi", "no caps here")`. Save the result list to `ex_caps`.

```r title="Your turn: extract capitalized words"
strings <- c("Hello World", "the BBC said Hi", "no caps here")

ex_caps <- # your code here

ex_caps
#> Expected: list of 3 character vectors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
strings <- c("Hello World", "the BBC said Hi", "no caps here")
ex_caps <- str_extract_all(strings, "[A-Z][a-z]*")
ex_caps
#> [[1]]
#> [1] "Hello" "World"
#>
#> [[2]]
#> [1] "B" "B" "C" "Hi"
#>
#> [[3]]
#> character(0)
```

**Explanation:** `[A-Z][a-z]*` matches a single uppercase letter followed by zero or more lowercase letters. `BBC` returns three single-character matches because each capital is followed by another capital, not a lowercase. To capture full acronyms, switch to `[A-Z][A-Za-z]*`.

</details>

## Related stringr functions and modifiers

After regex patterns, the most-paired stringr tools are:

- `str_detect()`: TRUE / FALSE per string for a regex pattern
- `str_extract()` and `str_extract_all()`: pull out matched substrings
- `str_replace()` and `str_replace_all()`: substitute matched text
- `str_split()`: split a string on a regex separator
- `str_match()` and `str_match_all()`: capture groups as a matrix
- `regex()`: wrap a pattern to set `ignore_case`, `multiline`, or `dotall`
- `fixed()`: opt out of regex for literal byte matching
- `boundary()`: split or detect by word, line, or sentence boundaries

The full reference and modifier comparison live in the [stringr documentation](https://stringr.tidyverse.org/articles/regular-expressions.html).

## FAQ

**What regex flavor does stringr use?**

stringr forwards every pattern to the stringi package, which uses the ICU regex engine. ICU is a Perl-compatible flavor and supports lookaheads, lookbehinds, named groups, Unicode property escapes (`\\p{L}`), and non-greedy quantifiers. Patterns that work on regex101.com with the PCRE flavor work in stringr with minimal changes; only a few obscure constructs differ.

**Do I need to wrap patterns in regex() in stringr?**

No. Plain strings passed as the `pattern` argument are already treated as regex. Wrap in `regex()` only when you need to set options like `ignore_case = TRUE`, `multiline = TRUE`, or `dotall = TRUE`. For literal text matching, wrap in `fixed()`. For locale-sensitive comparisons, wrap in `coll()`.

**How do I write a backslash in a stringr regex?**

Double every backslash in a regular R string: `"\\d"` matches a digit, `"\\s"` matches whitespace, `"\\."` matches a literal dot. R parses the first backslash as an escape, leaving a single backslash for the regex engine. R 4.0+ also supports raw strings: `r"(\d+)"` is identical to `"\\d+"` and avoids the double-backslash for complex patterns.

**Why does str_extract() only return the first match?**

By design. `str_extract()` returns a single character vector, one match per input. For every match in each string, use `str_extract_all()`, which returns a list of character vectors (one per input). Add `simplify = TRUE` if every input has the same number of matches and you want a character matrix instead.

**How do I do a case-insensitive regex in stringr?**

Wrap the pattern in `regex()` with `ignore_case = TRUE`: `str_detect(x, regex("^error", ignore_case = TRUE))`. The `(?i)` inline flag also works inside any plain pattern: `str_detect(x, "(?i)^error")`. For literal needles, use `fixed(x, ignore_case = TRUE)` instead, which uses ASCII case folding.
