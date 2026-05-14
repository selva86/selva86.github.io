---
title: "stringr str_to_lower() in R: Lowercase Strings With Locale"
slug: "stringr-str_to_lower-in-R"
description: "Use stringr str_to_lower() in R to convert character vectors to lowercase. Locale aware via stringi, NA safe, vectorised, plus 5 examples and pitfalls."
keywords: "stringr str_to_lower, str_to_lower function R, stringr str_to_lower examples, R lowercase string, R convert text to lowercase, str_to_lower vs tolower, str_to_lower locale"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_to_lower()|stringr str_to_lower|stringr::str_to_lower()|R lowercase strings|str_to_lower function"
auto_link_case_sensitive: true
target_keyword: "stringr str_to_lower"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_to_lower() in R: Lowercase Strings With Locale

<p class="lead">stringr str_to_lower() converts every element of a character vector to lowercase. It is vectorised, NA aware, and locale aware via the underlying stringi engine, which makes it more predictable than base R tolower() across platforms and Unicode inputs.</p>

[QUICK ANSWER]
str_to_lower(x)                          # default English locale
str_to_lower(c("Hello", "WORLD"))        # vector input
str_to_lower(x, locale = "tr")           # Turkish dotless i rules
str_to_lower(NA_character_)              # NA, not "na" (NA-safe)
str_to_lower(c("Resume", "RESUME"))      # normalize for matching
df |> mutate(name = str_to_lower(name))  # lowercase a column
str_to_lower("CAFE")                     # diacritics untouched
str_to_lower(c("ABC", "Mixed", ""))      # empty string stays ""

[DECISION TREE: Is str_to_lower() the right tool?]
- lowercase the whole string: str_to_lower(x)
- uppercase instead: str_to_upper(x)
- title case (each word capitalized): str_to_title(x)
- sentence case (first letter only): str_to_sentence(x)
- case-insensitive match without changing data: str_detect(x, regex("foo", ignore_case = TRUE))
- strip accents along with case: stringi::stri_trans_general(x, "Latin-ASCII")
- trim whitespace as well: str_squish(str_to_lower(x))

## What str_to_lower() does in one sentence

**str_to_lower(string, locale = "en") returns a copy of the input with every character mapped to its lowercase equivalent.** It works element-wise on a character vector, propagates NA inputs as NA outputs, leaves digits and punctuation unchanged, and uses Unicode-aware rules drawn from the stringi package so the result is identical on Windows, macOS, and Linux.

Use str_to_lower() whenever you need a normalized form of text, for example when comparing free-text user input to a lookup table, or when preparing values for case-insensitive joins.

```r title="Load stringr and lowercase a vector"
library(stringr)

x <- c("Hello", "World", "RStudio", NA, "")
str_to_lower(x)
#> [1] "hello"   "world"   "rstudio" NA        ""
```

The output keeps the original length, NA stays NA, and the empty string is returned unchanged.

## Syntax

**str_to_lower(string, locale = "en") takes two arguments.** The first is the character vector you want to transform; the second is an ISO 639 language code that selects locale-specific rules. The default `"en"` covers most ASCII and Latin text.

```r title="Function signature and defaults"
# str_to_lower(string, locale = "en")
#
# string : character vector to lowercase
# locale : ISO 639 language code, e.g. "en", "tr", "de"
#          determines locale-specific casing rules
```

Because str_to_lower() is vectorised, you can apply it to thousands of strings in one call without writing a loop.

```r title="Vectorised across an entire column"
words <- c("APPLE", "Banana", "cherry", "DATE")
str_to_lower(words)
#> [1] "apple"  "banana" "cherry" "date"
```

Every element is processed independently and the original order is preserved, so str_to_lower() drops cleanly into a `mutate()` or `sapply()` pipeline.

[NOTE]
**str_to_lower() is the stringi-backed twin of base R tolower().** They agree on plain ASCII but diverge on locale-sensitive characters, where tolower() depends on the system locale and str_to_lower() reads its `locale` argument. Use str_to_lower() in production code that runs on multiple machines.

## Five common str_to_lower() scenarios

**Five scenarios cover almost every real use of str_to_lower().** Each block stands alone so you can paste it into the live console.

### Normalize free-text input for matching

**User input rarely arrives in a consistent case.** Lowercasing both sides of a comparison removes trivial mismatches without losing any information.

```r title="Case-insensitive lookup against a known list"
known_brands <- c("apple", "google", "microsoft")
typed <- c("APPLE", "Google", "MICROsoft", "amazon")

str_to_lower(typed) %in% known_brands
#> [1]  TRUE  TRUE  TRUE FALSE
```

The four typed values vary in case, but `%in%` returns TRUE wherever the lowercased input matches an entry in the lookup vector.

### Lowercase a column inside a data frame

**Most cleanup happens inside a tidyverse pipeline.** Combine str_to_lower() with `mutate()` to rewrite a column in place.

```r title="Lowercase the Species column of iris"
library(dplyr)
iris |>
  mutate(species_lc = str_to_lower(Species)) |>
  distinct(Species, species_lc) |>
  head(3)
#>      Species species_lc
#> 1     setosa     setosa
#> 2 versicolor versicolor
#> 3  virginica  virginica
```

Working on a copy column (`species_lc`) keeps the original factor untouched, which is helpful when the original case carries a label you want to preserve elsewhere.

### Deduplicate a vector ignoring case

**"APPLE" and "apple" are usually the same record.** Lowercase before deduplicating to collapse spurious duplicates.

```r title="Unique values regardless of case"
tags <- c("R", "r", "Python", "python", "SQL", "sql", "R")
unique(str_to_lower(tags))
#> [1] "r"      "python" "sql"
```

`unique()` on the lowercased vector returns three tags. Apply this pattern before any join or summary that should be case-insensitive.

### Locale-aware lowercasing for non-English text

**The Turkish locale treats "I" and "i" differently from English.** The default `"en"` rules give you a dotted i; `"tr"` produces the dotless ı.

```r title="Turkish dotless i versus English dotted i"
word <- "ISTANBUL"
str_to_lower(word, locale = "en")
#> [1] "istanbul"
str_to_lower(word, locale = "tr")
#> [1] "ıstanbul"
```

Pick the locale that matches your data, or stick with `"en"` when you want stable cross-platform output for ASCII-dominant text.

### Combine with whitespace cleanup

**Real text usually needs both case normalization and whitespace trimming.** Chain str_to_lower() with str_squish() for a one-line cleanup.

```r title="Lowercase plus collapse internal whitespace"
messy <- c("  Hello  World", "GOOD\tmorning  ", "   ")
str_squish(str_to_lower(messy))
#> [1] "hello world"  "good morning" ""
```

`str_squish()` strips leading and trailing whitespace and collapses runs of internal whitespace to single spaces. The order matters only for performance; the result is identical either way.

[KEY INSIGHT]
**str_to_lower() is a normalization step, not a content change.** Treat it as the first stage of a cleaning pipeline that often continues with str_squish(), str_replace(), or str_remove(). Each step makes downstream comparisons and joins more reliable.

## str_to_lower() vs tolower() vs str_to_upper() vs str_to_title()

**Four functions look similar but solve different problems.** Picking the wrong one usually shows up as inconsistent output across platforms or as overly aggressive casing.

| Function | Source | Locale aware? | NA safe? | Best for |
|---|---|---|---|---|
| `str_to_lower(x)` | stringr / stringi | yes (`locale = "en"` default) | yes (NA in, NA out) | tidyverse code, cross-platform output |
| `tolower(x)` | base R | system-dependent | yes | base-only scripts, ASCII-only data |
| `str_to_upper(x)` | stringr / stringi | yes | yes | uppercasing for display or codes |
| `str_to_title(x)` | stringr / stringi | yes | yes | proper-noun formatting |

Reach for str_to_lower() in pipelines that ship to multiple machines, tolower() in quick base R scripts, str_to_upper() when you need a uniform uppercase form, and str_to_title() when you want a Headline Style result.

## Common pitfalls

**Three pitfalls cause most str_to_lower() surprises.** Each has a one-line fix.

### Forgetting that NA stays NA

**str_to_lower() does not silently coerce NA into the literal string "na".** That is usually what you want, but it can break code that expects every element to be a real string.

```r title="NA propagates through str_to_lower"
str_to_lower(c("Yes", NA, "No"))
#> [1] "yes" NA    "no"
```

If you need a placeholder, replace NA before lowercasing with `replace_na(x, "")` or `coalesce(x, "")`.

### Expecting it to strip accents or punctuation

**Lowercasing changes case only.** Diacritics, emoji, and punctuation pass through unchanged.

```r title="str_to_lower preserves diacritics"
str_to_lower("CAFE-Resume")
#> [1] "cafe-resume"
```

To remove accents at the same time, follow up with `stringi::stri_trans_general(x, "Latin-ASCII")`. To strip punctuation, follow with `str_remove_all(x, "[[:punct:]]")`.

### Comparing without lowercasing both sides

**Lowercasing only one side of a comparison still produces case mismatches.** The result looks subtly wrong rather than throwing.

```r title="Lowercase BOTH sides of a comparison"
str_to_lower("Apple") == "Apple"
#> [1] FALSE
str_to_lower("Apple") == str_to_lower("Apple")
#> [1] TRUE
```

If you control only one side, prefer `str_detect(x, regex("apple", ignore_case = TRUE))` so the comparison is explicit about case insensitivity.

[WARNING]
**str_to_lower() returns a character vector even if you pass a factor.** That changes the column type silently. Wrap with `as.factor()` or use `forcats::fct_relabel(f, str_to_lower)` if you need to keep factor levels.

## Try it yourself

**Try it:** Use the built-in `state.name` vector to produce lowercase, hyphenated state slugs (e.g. `"new-york"`). Save the result to `ex_slugs`.

```r title="Your turn: build lowercase state slugs"
# Try it: lowercase + hyphenate state names
ex_slugs <- # your code here

head(ex_slugs)
#> Expected: c("alabama", "alaska", "arizona", "arkansas", "california", "colorado")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_slugs <- str_replace_all(str_to_lower(state.name), " ", "-")
head(ex_slugs)
#> [1] "alabama"    "alaska"     "arizona"    "arkansas"   "california" "colorado"
length(ex_slugs)
#> [1] 50
```

**Explanation:** str_to_lower() converts each name to lowercase, then str_replace_all() swaps any spaces for hyphens so multi-word names like "New York" become URL-safe slugs.

</details>

## Related stringr functions

When str_to_lower() is not quite what you need, these are the next stops:

- [str_to_upper()](stringr-str_to_upper-in-R.html) returns the uppercase form, useful for display codes and uniform headers.
- [str_to_title()](stringr-str_to_title-in-R.html) capitalizes the first letter of each word for headline-style output.
- [str_to_sentence()](stringr-str_to_sentence-in-R.html) capitalizes only the first letter of the entire string.
- [str_detect()](stringr-str_detect-in-R.html) checks for pattern presence and accepts an `ignore_case` flag for case-insensitive matching.
- [str_squish()](stringr-str_squish-in-R.html) trims and collapses whitespace, often paired with str_to_lower() in cleanup chains.
- The full [stringr reference](https://stringr.tidyverse.org/reference/case.html) documents every case-conversion helper.

## FAQ

**What is the difference between str_to_lower() and tolower() in R?**

Both convert text to lowercase, but str_to_lower() uses the stringi engine and accepts an explicit `locale` argument, while tolower() depends on the system locale set by the operating system. That makes str_to_lower() preferable when your code runs on multiple machines or when the input contains non-English characters that need locale-specific rules, such as Turkish dotted and dotless i.

**How do I lowercase a column in a data frame?**

Inside a dplyr pipeline, use `mutate()` with str_to_lower(): `df |> mutate(name = str_to_lower(name))`. The function is vectorised, so it processes the entire column in one call without a loop. If the column is a factor, str_to_lower() returns a character vector; wrap with `as.factor()` or use `forcats::fct_relabel(name, str_to_lower)` to preserve factor structure.

**Does str_to_lower() handle accented and Unicode characters?**

Yes. str_to_lower() uses Unicode-aware case mapping from the stringi package, so accented Latin letters, Cyrillic, Greek, and similar scripts are lowercased correctly. The original accents are preserved; only the case changes. To strip diacritics at the same time, follow up with `stringi::stri_trans_general(x, "Latin-ASCII")`.

**Why do Turkish characters not lowercase the way I expect?**

Turkish has both a dotless I (uppercase) that maps to dotless ı (lowercase) and a dotted I that maps to dotted i. The default `"en"` locale uses English rules, so `"I"` becomes `"i"`. Pass `locale = "tr"` to str_to_lower() to get the Turkish behaviour where `"I"` becomes `"ı"`. Always set the locale explicitly when you process multilingual text.

**Can I use str_to_lower() for case-insensitive comparisons?**

Yes, by lowercasing both sides of the comparison: `str_to_lower(x) == str_to_lower(y)`. For pattern matching, an alternative is `str_detect(x, regex("pattern", ignore_case = TRUE))`, which avoids mutating the data and reads more clearly when only the comparison itself needs to be case-insensitive.
