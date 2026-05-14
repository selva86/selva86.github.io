---
title: "stringr str_remove_all() in R: Delete Every Match"
slug: "stringr-str_remove_all-in-R"
description: "Use stringr str_remove_all() to delete every regex or fixed-text match from each string in R. Covers digits, stopwords, HTML, vs str_remove, vs gsub examples."
keywords: "stringr str_remove_all, str_remove_all function R, stringr str_remove_all examples, R str_remove_all multiple matches, str_remove_all vs str_remove, str_remove_all vs gsub, remove all occurrences string R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_remove_all()|stringr str_remove_all|stringr::str_remove_all()|remove every match|delete all matches"
auto_link_case_sensitive: true
target_keyword: "stringr str_remove_all"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_remove_all() in R: Delete Every Match

<p class="lead">The <code>str_remove_all()</code> function in stringr deletes EVERY match of a pattern from each input string. It is the multi-match counterpart of <code>str_remove()</code> and a shorthand for <code>str_replace_all(x, pattern, "")</code>.</p>

[QUICK ANSWER]
str_remove_all(x, "old")                       # delete all matches per string
str_remove_all(x, "\\d+")                      # strip every digit run
str_remove_all(x, "\\s+")                      # collapse all whitespace
str_remove_all(x, "[[:punct:]]")               # strip all punctuation
str_remove_all(x, fixed("."))                  # literal match
str_remove_all(x, regex("the", ignore_case=TRUE)) # case-insensitive
str_remove_all(x, paste(stops, collapse="|"))  # bulk dictionary
gsub("old", "", x)                             # base R equivalent

[DECISION TREE: Is str_remove_all() the right tool?]
- delete EVERY match per string: str_remove_all()
- delete only the FIRST match: str_remove()
- replace with non-empty text: str_replace_all()
- keep only the matched text: str_extract_all()
- check if a pattern exists: str_detect()
- count how many matches per string: str_count()
- trim whitespace at boundaries only: str_trim() or str_squish()
- split a string on a pattern: str_split()

## What str_remove_all() does in one sentence

**`str_remove_all(string, pattern)` deletes every match of `pattern` from each input string.** It keeps scanning until no matches remain, then returns a character vector the same length as the input. Pattern is a regex by default; wrap with `fixed()` for literal text.

It is the right tool whenever a single string can hold multiple matches: stripping digits from product codes, removing stopwords from free text, deleting HTML tags from scraped pages, or collapsing whitespace before tokenization.

## Syntax

**`str_remove_all(string, pattern)`. There is no replacement argument; the replacement is always the empty string.**

```r title="Load stringr and delete every match"
library(stringr)

x <- c("aaa", "banana", "no a here")

str_remove_all(x, "a")
#> [1] ""        "bnn"     "no  here"
```

The output keeps `NA` inputs as `NA`. Length and order match the input vector exactly.

[TIP]
**Default to `str_remove_all()` for free text and `str_remove()` only when you know the pattern appears at most once.** Reaching for the singular form on multi-match strings is the most common cause of "the cleanup left half my targets behind".

## Five cleanup patterns

### 1. Delete every digit

```r title="Strip digits from product codes"
codes <- c("SKU-100-A", "SKU-22-B", "SKU-9999-C")

str_remove_all(codes, "\\d+")
#> [1] "SKU--A" "SKU--B" "SKU--C"
```

`\\d+` matches one or more digit characters. Without `_all`, only the first run would disappear (`"SKU--A"` would still be right for this example, but a string like `"v1.2.3"` would lose only `1`). Pair with `str_remove_all(x, "-+")` to collapse the leftover separators.

### 2. Remove every stopword (bulk dictionary)

```r title="Strip a list of stopwords"
text <- c("the cat sat on the mat", "a dog and the bird")
stops <- c("\\bthe\\b", "\\ba\\b", "\\band\\b", "\\bon\\b")

str_remove_all(text, paste(stops, collapse = "|"))
#> [1] " cat sat   mat" " dog   bird"
```

`paste(stops, collapse = "|")` builds one regex with `|` (regex OR) joining every term. `\\b` is a word boundary, so `"a"` does not delete the `a` inside `"cat"`. Follow with `str_squish()` to collapse the gaps.

### 3. Strip every HTML tag

```r title="Remove tags from scraped fragments"
html <- c("<p>Hello <b>world</b></p>", "<div>R is <i>great</i></div>")

str_remove_all(html, "<[^>]+>")
#> [1] "Hello world" "R is great"
```

`<[^>]+>` matches a `<`, one or more non-`>` characters, then `>`. Every tag in the string disappears in one pass. Good enough for simple fragments; reach for `rvest` or `xml2` for real HTML.

[KEY INSIGHT]
**Regex alternation (`|`) plus `str_remove_all()` is the cleanest bulk-delete pattern in R.** Combining a vector of literals into one regex with `paste(..., collapse = "|")` lets a single call delete dozens of targets. Always anchor terms with `\\b` to avoid clipping the middle of unrelated words.

### 4. Collapse every whitespace character

```r title="Delete all spaces, tabs, and newlines"
messy <- c("  hello\tworld\n", "line  one\n\nline  two")

str_remove_all(messy, "\\s+")
#> [1] "helloworld"        "lineonelinetwo"
```

`\\s+` matches any run of whitespace (space, tab, newline). `str_trim()` only handles boundaries; `str_squish()` collapses runs to one space. Use `str_remove_all()` when you want zero whitespace anywhere.

### 5. Strip every parenthesized aside

```r title="Remove parenthetical asides"
notes <- c("R (the language) is great", "Try ggplot2 (a viz package) today")

str_remove_all(notes, "\\s*\\([^)]*\\)")
#> [1] "R is great"        "Try ggplot2 today"
```

`\\s*\\([^)]*\\)` matches an optional run of leading whitespace, an opening paren, any non-paren text, and a closing paren. Every aside in the string disappears in one pass. Use this pattern to clean up text before tokenization or display.

## str_remove_all() vs str_remove() vs gsub()

**All three delete pattern matches, but they differ in scope, ergonomics, and dependency footprint.**

| Feature | str_remove_all() | str_remove() | gsub() |
|---|---|---|---|
| Matches deleted | All | First only | All |
| First argument | string (pipe-friendly) | string (pipe-friendly) | pattern |
| Default pattern type | regex | regex | regex |
| `fixed()` opt-out | Yes | Yes | Use `fixed=TRUE` arg |
| NA input | Returns NA | Returns NA | Returns NA |
| Package | stringr | stringr | base R |

For a single delete-all operation, `str_remove_all(x, p)` and `gsub(p, "", x)` produce identical output. Pick `str_remove_all()` inside a tidyverse pipeline and `gsub()` when you want zero dependencies.

[NOTE]
**Coming from Python pandas?** The equivalent of `str_remove_all(x, p)` is `x.str.replace(p, "", regex=True)`. Pandas removes every match by default, so there is no `_all` variant; `n=1` is the option for "first match only".

## Common pitfalls

**Pitfall 1: regex metacharacters treated as patterns.** `str_remove_all("a.b.c", ".")` returns `""` because `.` matches any character and `_all` clears the lot. Use `str_remove_all("a.b.c", fixed("."))` to strip literal dots only.

**Pitfall 2: forgetting word boundaries in dictionary alternation.** `str_remove_all("category", "cat")` returns `"egory"`. Wrap each term in `\\b...\\b` (or use `regex(..., word_boundary = TRUE)`) when deleting standalone words.

**Pitfall 3: confusing with `str_trim()` for whitespace cleanup.** `str_remove_all(x, "\\s+")` deletes every whitespace character, including the spaces between words. For boundary-only trimming, use `str_trim(x)` or `str_squish(x)` instead.

[WARNING]
**Empty patterns silently match between every character.** `str_remove_all("abc", "")` returns `"abc"` (no harm here), but inside a pipeline this hides bugs. Guard with `nzchar(pattern)` if the pattern comes from a variable that might be empty.

## Try it yourself

**Try it:** Clean the `tweets` vector by deleting every URL and every hashtag. Save the result to `ex_clean`.

```r title="Your turn: strip URLs and hashtags"
tweets <- c(
  "Check https://r-statistics.co for #rstats tips",
  "Love #ggplot2 see https://ggplot2.tidyverse.org",
  "Just #base"
)

ex_clean <- # your code here

ex_clean
#> Expected: c("Check  for  tips", "Love  see ", "Just ")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- str_remove_all(tweets, "https?://\\S+|#\\w+")
ex_clean
#> [1] "Check  for  tips" "Love  see "       "Just "
```

**Explanation:** The regex `https?://\\S+` matches a URL (the `?` makes the `s` optional, `\\S+` is one-or-more non-whitespace). The `|` adds a second alternative `#\\w+` for hashtags. `str_remove_all()` removes every match of either alternative in one pass.

</details>

## Related stringr functions

After mastering `str_remove_all()`, look at:

- `str_remove()`: deletes only the first match per string
- `str_replace_all()`: substitute every match with non-empty text
- `str_extract_all()`: keep every matched substring instead of deleting it
- `str_detect()`, `str_count()`: ask whether or how many matches exist before deleting
- `str_squish()`, `str_trim()`: idiomatic whitespace cleanup at the boundaries
- `gsub()` from base R: drop-in equivalent without a stringr dependency

For bulk dictionary deletion, `str_remove_all(x, paste(terms, collapse = "|"))` is the cleanest pattern in R. Wrap each term in `\\b` to avoid clipping unrelated substrings.

## FAQ

**What is the difference between str_remove and str_remove_all?**

`str_remove(x, p)` deletes only the FIRST match of the pattern in each input string, while `str_remove_all(x, p)` deletes EVERY match. For strings that can contain multiple matches (free text, log lines, scraped HTML), `str_remove_all()` is almost always the right default. Both return a character vector the same length as the input, with `NA` inputs preserved as `NA`.

**How do I remove all occurrences of a pattern in R?**

Use `str_remove_all(x, "pattern")` from stringr or `gsub("pattern", "", x)` from base R. Both delete every match in one pass. With stringr you also get `fixed()` for literal patterns, `regex(ignore_case = TRUE)` for case-insensitive deletion, and a pipe-friendly first argument that fits cleanly into a dplyr or tidyr pipeline.

**How do I remove all numbers from a string in R?**

Use `str_remove_all(x, "\\d+")`. The `\\d+` regex matches one or more digit characters; `_all` keeps scanning so every digit run disappears. To also strip negative signs or decimal points, broaden the pattern: `str_remove_all(x, "[-\\d.]+")`. For thousands-separated numbers like `"1,234"`, include the comma: `[-\\d.,]+`.

**Can str_remove_all use fixed strings instead of regex?**

Yes. Wrap the pattern in `fixed()` to opt out of regex: `str_remove_all(x, fixed("a.b"))` deletes the literal three characters `a`, `.`, `b`. Without `fixed()`, the `.` matches any character. Use `fixed()` whenever your target text contains regex metacharacters like `.`, `*`, `+`, `?`, `(`, `)`, `[`, `]`, `$`, `^`, `\`, or `|`.

**How is str_remove_all different from gsub?**

For simple regex deletions, `str_remove_all(x, p)` and `gsub(p, "", x)` produce identical output. The differences are ergonomic: `str_remove_all()` takes the string as its first argument (pipe-friendly), supports `fixed()` and `regex()` modifiers, and has consistent `NA`-in `NA`-out semantics. `gsub()` wins on zero dependencies and is usually faster on long vectors.
