---
title: "stringr str_remove() in R: Remove Patterns From Strings"
slug: "stringr-str_remove-in-R"
description: "Use stringr str_remove() and str_remove_all() to delete patterns from strings in R. Covers regex, fixed match, prefix and suffix removal, vs gsub, 5 examples."
keywords: "stringr str_remove, str_remove function R, stringr str_remove examples, R str_remove_all, str_remove vs gsub, remove pattern from string R, stringr remove text"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_remove()|str_remove_all()|stringr str_remove|stringr::str_remove()|remove pattern from string"
auto_link_case_sensitive: true
target_keyword: "stringr str_remove"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_remove() in R: Remove Patterns From Strings

<p class="lead">The <code>str_remove()</code> function in stringr deletes the FIRST match of a pattern from each input string. Use <code>str_remove_all()</code> to delete EVERY match. Both are shortcuts for <code>str_replace()</code> with an empty replacement.</p>

[QUICK ANSWER]
str_remove(x, "old")                          # delete first match per string
str_remove_all(x, "old")                      # delete all matches
str_remove(x, fixed("a.b"))                   # literal match
str_remove(x, regex("p", ignore_case=TRUE))   # case-insensitive
str_remove(x, "^\\s+")                        # strip leading whitespace
str_remove(x, "\\.csv$")                      # strip suffix
str_remove_all(x, "[[:punct:]]")              # remove all punctuation
gsub("old", "", x)                            # base R alternative

[DECISION TREE: Is str_remove() the right tool?]
- delete first match per string: str_remove()
- delete EVERY match per string: str_remove_all()
- replace with non-empty text: str_replace() or str_replace_all()
- keep only the matched text: str_extract()
- check if a pattern exists: str_detect()
- trim leading and trailing whitespace: str_trim() or str_squish()
- drop NA values: str_replace_na() or na.omit()

## What str_remove() does in one sentence

**`str_remove(string, pattern)` deletes the FIRST match of `pattern` from each input string.** `str_remove_all()` deletes every match. Pattern is a regex by default; wrap with `fixed()` for literal text. Both return a character vector the same length as the input.

These are the cleanup workhorses of stringr: stripping prefixes, suffixes, file extensions, HTML tags, punctuation, units, and stop words.

## Syntax

**`str_remove(string, pattern)`. There is no replacement argument because the replacement is always the empty string.**

```r title="Load stringr and remove simple text"
library(stringr)

x <- c("apple pie", "apple cake", "banana bread")

str_remove(x, "apple ")
#> [1] "pie"          "cake"         "banana bread"
```

The pattern `"apple "` (note the trailing space) is dropped from the first two strings. The third has no match, so it returns unchanged.

[TIP]
**`str_remove(x, p)` is exactly `str_replace(x, p, "")`.** Both produce identical output. Use `str_remove` when the intent is deletion, since the name is clearer at the read site. The `_all` variants behave the same way.

## Five common patterns

### 1. Strip a prefix

```r title="Drop the leading Mr. or Ms."
names <- c("Mr. Smith", "Ms. Jones", "Dr. Brown")

str_remove(names, "^(Mr|Ms|Dr)\\.\\s")
#> [1] "Smith" "Jones" "Brown"
```

The anchor `^` ties the pattern to the start of the string. The alternation `(Mr|Ms|Dr)` matches any of the three honorifics.

### 2. Strip a suffix or file extension

```r title="Remove .csv from filenames"
files <- c("data.csv", "report.csv", "log.txt")

str_remove(files, "\\.csv$")
#> [1] "data"    "report"  "log.txt"
```

The anchor `$` ties the pattern to the end of the string. `log.txt` is left alone because it does not match.

### 3. Remove all punctuation

```r title="Strip punctuation with str_remove_all"
text <- c("Hello, world!", "R is great.")

str_remove_all(text, "[[:punct:]]")
#> [1] "Hello world" "R is great"
```

`[[:punct:]]` is a POSIX character class that matches any punctuation. Use `_all` to delete every occurrence in one pass.

### 4. Strip HTML tags

```r title="Remove HTML tags from scraped text"
html <- c("<p>Hello</p>", "<b>bold</b> text")

str_remove_all(html, "<[^>]+>")
#> [1] "Hello"     "bold text"
```

`<[^>]+>` matches a `<`, one or more non-`>` characters, then `>`. Good enough for simple scraped fragments; use an HTML parser for production work.

### 5. Strip leading and trailing whitespace

```r title="Use str_remove_all with anchored whitespace"
padded <- c("  hello  ", "\tworld\n")

str_remove_all(padded, "^\\s+|\\s+$")
#> [1] "hello" "world"
```

`^\\s+` matches leading whitespace; `\\s+$` matches trailing whitespace; `|` is regex OR. `str_trim()` does the same thing more idiomatically, but the pattern is useful when you also want to remove other characters at the boundaries.

[KEY INSIGHT]
**str_remove is read-time documentation, not new behavior.** `str_replace(x, p, "")` is functionally identical, but `str_remove(x, p)` signals intent: deleting, not substituting. Pick the name that matches what the reader needs to understand.

## str_remove vs gsub

**Both delete matches, but they differ on defaults, pipe ergonomics, and NA handling.** Pick `str_remove_all()` inside the tidyverse and `gsub()` when you need zero dependencies.

| Feature | str_remove_all | gsub (base R) |
|---|---|---|
| Default match type | regex | regex |
| Replace all matches | yes (always) | yes |
| Replace first match only | use str_remove() | use sub() |
| NA in input | NA in output | NA in output |
| Encoding | UTF-8 by default | locale-dependent |
| Pipe-friendly first argument | yes (string first) | no (pattern first) |

**Decision rule.** Use `str_remove_all()` inside a tidyverse pipeline. Use `gsub()` when you want zero dependencies, especially inside a package or a base R script.

[NOTE]
**Coming from Python pandas?** The equivalent of `str_remove_all(x, p)` is `x.str.replace(p, '', regex=True)`. The equivalent of `str_remove(x, p)` is `x.str.replace(p, '', regex=True, n=1)`.

## Common pitfalls

**Pitfall 1: regex characters treated as patterns.** `str_remove("a.b.c", ".")` deletes the FIRST character (because `.` is regex for any char). Use `str_remove("a.b.c", fixed("."))` to strip a literal dot.

**Pitfall 2: forgetting `_all`.** `str_remove("aaa", "a")` returns `"aa"` (first match only). Use `str_remove_all("aaa", "a")` to get `""`.

**Pitfall 3: no escape for `$` or `^` inside a literal.** To remove a literal dollar sign, use `str_remove(x, fixed("$"))` or escape it: `str_remove(x, "\\$")`.

[WARNING]
**`str_remove()` only deletes the FIRST match.** New users often expect every match to disappear and then debug for minutes. If you want to delete every occurrence, always pick `str_remove_all()`.

## Try it yourself

**Try it:** From `paths`, drop the leading `/users/` directory prefix. Save to `ex_clean`.

```r title="Your turn: strip directory prefix"
paths <- c("/users/data.csv", "/users/log.txt", "/users/report.csv")

ex_clean <- # your code here

ex_clean
#> Expected: c("data.csv", "log.txt", "report.csv")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- str_remove(paths, "^/users/")
ex_clean
#> [1] "data.csv"   "log.txt"    "report.csv"
```

**Explanation:** `^/users/` anchors the match to the start of the string. `str_remove` (not `_all`) is fine here because the prefix can appear at most once.

</details>

## Related stringr functions

After mastering str_remove, look at:

- `str_replace()`, `str_replace_all()`: substitute matched text with a non-empty replacement
- `str_extract()`, `str_extract_all()`: keep only the matched text instead of deleting it
- `str_detect()`: test whether a pattern matches without modifying the string
- `str_trim()`, `str_squish()`: idiomatic whitespace cleanup
- `gsub()`, `sub()` (base R): equivalent without the stringr dependency

For bulk dictionary deletion, prefer `str_remove_all(x, paste(patterns, collapse = "|"))` with regex alternation.

## FAQ

**How do I remove a string in R using stringr?**

Use `str_remove(x, "old")` to delete the first match per element. Use `str_remove_all(x, "old")` to delete every match. Both are vectorized: the output is a character vector with the same length as the input, even when some elements have no match.

**What is the difference between str_remove and str_replace?**

`str_remove(x, p)` is shorthand for `str_replace(x, p, "")`. They produce identical output. The difference is intent: `str_remove` signals deletion to the reader, while `str_replace` is for substitution with non-empty text.

**How do I remove all occurrences of a pattern from a string?**

Use `str_remove_all(x, p)`. The plain `str_remove(x, p)` only deletes the first match in each string; `_all` deletes every match in one pass.

**How do I remove a literal dot or special character?**

Wrap the pattern in `fixed()`: `str_remove(x, fixed("."))`. Without `fixed`, the `.` is a regex metacharacter that matches any single character. The same applies to `*`, `+`, `?`, `(`, `)`, `[`, `]`, `^`, `$`, `\`, and `|`.

**How do I remove whitespace from a string in R?**

For leading and trailing whitespace, prefer `str_trim(x)` (or `str_squish(x)` to also collapse internal runs). To delete every whitespace character including internal ones, use `str_remove_all(x, "\\s+")`.
