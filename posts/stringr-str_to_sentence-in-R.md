---
title: "stringr str_to_sentence() in R: Capitalize the First Letter"
slug: "stringr-str_to_sentence-in-R"
description: "Use stringr str_to_sentence() in R to capitalize the first letter of a string and lowercase the rest. Vectorised, NA safe, with 4 examples and pitfalls."
keywords: "stringr str_to_sentence, str_to_sentence function R, stringr str_to_sentence examples, R sentence case, convert text to sentence case R, str_to_sentence vs str_to_title, capitalize first letter R string"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_to_sentence()|stringr str_to_sentence|stringr::str_to_sentence()|R sentence case|str_to_sentence function"
auto_link_case_sensitive: true
target_keyword: "stringr str_to_sentence"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_to_sentence() in R: Capitalize the First Letter

<p class="lead">stringr str_to_sentence() converts a character vector to sentence case by capitalizing only the first letter of the first word and lowercasing every other character. It is vectorised, NA safe, and Unicode aware, which makes it the right tool for cleaning ALL-CAPS user input, error logs, and plot captions in R.</p>

[QUICK ANSWER]
str_to_sentence(x)                                # default English locale
str_to_sentence(c("HELLO WORLD", "good DAY"))     # vector input
str_to_sentence("WAR AND PEACE")                  # downcases the rest
str_to_sentence(NA_character_)                    # NA, not "NA" (NA-safe)
str_to_sentence("hello world. goodbye world.")    # only first letter, not each sentence
df |> mutate(comment = str_to_sentence(comment))  # sentence-case a column
str_to_sentence(str_replace_all(x, "_", " "))     # snake_case to sentence case label
str_to_sentence("", locale = "en")                # empty string passes through

[DECISION TREE: Is str_to_sentence() the right tool?]
- capitalize first letter, lowercase rest: str_to_sentence(x)
- capitalize each word: str_to_sentence is wrong, use str_to_title(x)
- uppercase the whole string: str_to_upper(x)
- lowercase the whole string: str_to_lower(x)
- capitalize every sentence separately: split on ".", apply str_to_sentence, rejoin
- preserve acronyms while sentence casing: write a custom regex with str_replace
- snake_case to Sentence case label: str_to_sentence(str_replace_all(x, "_", " "))

## What str_to_sentence() does in one sentence

**str_to_sentence(string, locale = "en") returns a copy of the input with the first character upper cased and every other character lower cased.** It works element-wise on a vector, propagates NA as NA, treats the whole element as one unit (not one sentence at a time), and uses Unicode-aware case mapping from the stringi package so results are identical across Windows, macOS, and Linux.

Reach for str_to_sentence() when you have shouty, mixed-case, or all-lowercase text that should read like a normal sentence: forum comments scraped in caps, error log lines, plot captions assembled from raw column names, or free-text categorical responses.

```r title="Load stringr and sentence case a vector"
library(stringr)

x <- c("HELLO WORLD", "good DAY", "Mixed CaSe StRing", NA, "")
str_to_sentence(x)
#> [1] "Hello world"       "Good day"          "Mixed case string"
#> [4] NA                  ""
```

The output length matches the input, every variation collapses to a clean sentence form, NA stays NA, and the empty string passes through unchanged.

## Syntax

**str_to_sentence() takes two arguments and returns a character vector the same length as the input.** Locale defaults to "en", which is sufficient for ASCII and most Western European text.

```r title="Function signature"
# str_to_sentence(string, locale = "en")
#
# string : a character vector (any length, including length 0).
# locale : ISO 639 language code, e.g. "en", "tr", "de".
#          Affects which Unicode case rules apply.
#
# Returns: a character vector the same length as string,
#          NA preserved, attributes dropped.
```

[TIP]
**Pick a single locale per pipeline.** Mixing "en" on some columns and the system default on others produces subtle differences in non-ASCII characters. Set the locale explicitly even for English data so future you can grep for it.

## Four common str_to_sentence() scenarios

**Sentence case shows up wherever raw text meets human eyes.** Each scenario below starts from a realistic, slightly ugly input and applies str_to_sentence() to produce something safe to display.

### Clean ALL-CAPS user comments for display

**Loud user input becomes readable without losing the original message.** Forum scrapers, survey free-text fields, and chat logs are full of users SHOUTING. Sentence case is friendlier without flattening the message to lowercase.

```r title="Sentence case loud comments"
comments <- c(
  "THIS IS THE WORST PRODUCT EVER",
  "loved it!! BUY IT NOW",
  "Meh. nothing special"
)

str_to_sentence(comments)
#> [1] "This is the worst product ever" "Loved it!! buy it now"
#> [3] "Meh. nothing special"
```

The first letter is capitalized, the rest of the message is lower cased, and punctuation is left alone.

### Format error messages into readable prose

**Heterogeneous log levels canonicalise to one display style.** Error and log strings often arrive in lower case from one library and upper case from another. Pipe them through str_to_sentence() before showing them in a UI or dashboard.

```r title="Normalize log lines"
logs <- c(
  "ERROR: connection timed out",
  "warning: retrying request",
  "INFO: connected to db"
)

str_to_sentence(logs)
#> [1] "Error: connection timed out" "Warning: retrying request"
#> [3] "Info: connected to db"
```

The severity prefix becomes a clean leading word, and the rest of each line reads like a sentence.

### Sentence-case plot captions and axis labels from snake_case columns

**Column names become publication-ready captions in two function calls.** ggplot2 axis titles default to the raw column name. Combine str_replace_all() with str_to_sentence() to convert `miles_per_gallon` into `Miles per gallon` for any number of columns.

```r title="Snake case to sentence case captions"
labels <- c("miles_per_gallon", "horse_power", "weight_in_tons")

str_to_sentence(str_replace_all(labels, "_", " "))
#> [1] "Miles per gallon" "Horse power"      "Weight in tons"
```

The underscores become spaces first, then sentence case capitalises only the first word, which matches scientific style conventions for figure captions.

### Normalise headlines scraped from mixed-case sources

**One canonical casing kills duplicate rows hiding behind capitalization.** When you stack data from several APIs, headlines arrive in title case, sentence case, and ALL CAPS. Pick one canonical form for storage and dedup.

```r title="Canonicalize headline casing"
headlines <- c(
  "BREAKING: Markets Tumble Overnight",
  "breaking: markets tumble overnight",
  "Breaking: Markets Tumble Overnight"
)

unique(str_to_sentence(headlines))
#> [1] "Breaking: markets tumble overnight"
```

All three variants collapse to one canonical sentence-cased string, ready for a deduplication step.

[KEY INSIGHT]
**Sentence case treats each element as ONE sentence, even if it contains multiple periods.** "hello world. goodbye world." becomes "Hello world. goodbye world." not "Hello world. Goodbye world." If you need per-sentence capitalization, split, apply, and rejoin.

## str_to_sentence() vs str_to_title() vs str_to_upper() vs toupper()

**Four functions look similar; only one is right for any given task.** Pick the function whose default behaviour matches the form you want, not the function that needs the fewest extra steps.

| Function | Output for `"hello world"` | Output for `"HELLO WORLD"` | Use when |
|---|---|---|---|
| `str_to_sentence(x)` | `"Hello world"` | `"Hello world"` | First letter only, rest lower case |
| `str_to_title(x)` | `"Hello World"` | `"Hello World"` | Every word capitalised |
| `str_to_upper(x)` | `"HELLO WORLD"` | `"HELLO WORLD"` | Whole string upper case |
| `toupper(x)` | `"HELLO WORLD"` | `"HELLO WORLD"` | Base R equivalent, no locale arg |

[NOTE]
**Base R has `toupper()` and `tolower()` but no sentence-case helper.** Before stringr you had to write `paste0(toupper(substr(x, 1, 1)), tolower(substr(x, 2, nchar(x))))`. str_to_sentence() is the one-liner version.

## Common pitfalls

**Three behaviours surprise new users.** Each one has a simple workaround, but you need to know it exists before you can apply it.

### Acronyms get downgraded to lower case

**str_to_sentence() lower cases everything after the first character, even ALL-CAPS substrings.** "NASA found water" becomes "Nasa found water". If acronyms matter, apply a post-process step.

```r title="Protect acronyms after sentence casing"
x <- "NASA found water on the moon"

str_to_sentence(x)
#> [1] "Nasa found water on the moon"

# Restore the acronym with str_replace
str_replace(str_to_sentence(x), "Nasa", "NASA")
#> [1] "NASA found water on the moon"
```

For pipelines with many acronyms, build a vector of corrections and loop, or maintain a named lookup and `str_replace_all()` in one pass.

### Multiple sentences in one string get only one capital letter

**The function reads each vector element as one sentence regardless of internal periods.** A single element can contain several periods, but str_to_sentence() treats the whole element as one sentence. To capitalize each sentence separately, split first.

```r title="Capitalize every sentence in a paragraph"
para <- "this is one. this is two. this is three."

# Wrong: only the first letter is capitalized
str_to_sentence(para)
#> [1] "This is one. this is two. this is three."

# Right: split, sentence-case each piece, rejoin
sentences <- str_split(para, "(?<=\\.)\\s+")[[1]]
paste(str_to_sentence(sentences), collapse = " ")
#> [1] "This is one. This is two. This is three."
```

The regex lookbehind keeps the period attached to each sentence so the join is faithful.

### Locale arguments do not unlock special casing for English

**The locale arg controls Unicode casing rules, not grammar or acronym handling.** It matters for Turkish dotted-i, German sharp-s, and similar scripts. For English data, setting `locale = "en"` is the same as omitting it; do not expect locale to fix acronym or grammar problems.

[WARNING]
**Turkish `i` casing is the classic gotcha.** Under `locale = "tr"`, lower case `i` upper cases to `I` with a dot above, not plain `I`. Use `locale = "en"` explicitly when processing English text on a Turkish system, or you will see surprising glyphs.

## Try it yourself

**Try it:** Convert `c("the QUICK brown fox", "JUMPS over the lazy DOG")` to sentence case, then store the result in `ex_sentence`.

```r title="Your turn sentence case two strings"
# Try it: sentence case two strings
ex_sentence <- # your code here

ex_sentence
#> Expected: c("The quick brown fox", "Jumps over the lazy dog")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sentence <- str_to_sentence(c("the QUICK brown fox", "JUMPS over the lazy DOG"))
ex_sentence
#> [1] "The quick brown fox"      "Jumps over the lazy dog"
```

**Explanation:** str_to_sentence() is vectorised, so a single call handles both elements. Each element is treated independently: the first character of each becomes upper case, every other character becomes lower case.

</details>

## Related stringr functions

**stringr ships a small family of case-conversion helpers, all built on the same stringi engine.** Pick the one whose default output matches your target form.

- `str_to_title()` capitalizes the first letter of every word; use for names, headlines, and book titles.
- `str_to_lower()` lowercases the entire string; use before fuzzy matching or deduplication.
- `str_to_upper()` uppercases the entire string; use for codes, tickers, and SQL keywords.
- `str_trim()` removes leading and trailing whitespace; chain before any case-conversion to avoid stray spaces.
- `str_replace_all()` runs regex-based substitutions; combine with case helpers to protect acronyms or split on custom boundaries.

For the full reference, see the [stringr case conversion docs](https://stringr.tidyverse.org/reference/case.html) on tidyverse.org.

## FAQ

**What is the difference between str_to_sentence and str_to_title in R?**

str_to_sentence() capitalizes only the first letter of the first word, while str_to_title() capitalizes the first letter of every word. For `"hello world"`, str_to_sentence() returns `"Hello world"` and str_to_title() returns `"Hello World"`. Pick str_to_sentence() for prose-style display and str_to_title() for headlines, names, and figure titles.

**How do I capitalize each sentence in a paragraph in R?**

str_to_sentence() treats each vector element as one sentence, so a paragraph with three periods gets only one capital letter. Split the paragraph on sentence boundaries first with `str_split(x, "(?<=\\.)\\s+")`, apply str_to_sentence() to the resulting vector, then paste it back together with `paste(..., collapse = " ")`. The lookbehind keeps the period attached to each piece.

**Does str_to_sentence handle NA values safely?**

Yes. NA character values pass through unchanged, returning NA in the same position. Empty strings also pass through as empty strings. This matters when you sentence-case a column inside `mutate()` because you do not need a `na.rm` step or an `ifelse()` guard.

**Is str_to_sentence available in base R?**

No. Base R provides `toupper()` and `tolower()` but no sentence-case helper. Without stringr you would write `paste0(toupper(substr(x, 1, 1)), tolower(substr(x, 2, nchar(x))))` element by element, which is verbose and slow for long vectors. stringr's str_to_sentence() is the vectorised, NA safe one-liner.

**Why does str_to_sentence lowercase my acronyms?**

The function applies a blanket lower case to every character after the first, so `"NASA found water"` becomes `"Nasa found water"`. There is no built-in protection. The standard fix is a follow-up `str_replace()` or `str_replace_all()` with a named lookup of acronyms to restore the original casing.
