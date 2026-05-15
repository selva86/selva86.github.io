---
title: "stringr str_to_title() in R: Capitalize Each Word"
slug: "stringr-str_to_title-in-R"
description: "Use stringr str_to_title() in R to capitalize the first letter of each word. Vectorised, NA safe, locale aware, with 5 examples, comparisons, and pitfalls."
keywords: "stringr str_to_title, str_to_title function R, stringr str_to_title examples, R title case conversion, capitalize first letter of each word R, R string title case, stringr capitalize words"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_to_title()|stringr str_to_title|stringr::str_to_title()|R title case|str_to_title function"
auto_link_case_sensitive: true
target_keyword: "stringr str_to_title"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_to_title() in R: Capitalize Each Word

<p class="lead">stringr str_to_title() converts a character vector to title case by capitalizing the first letter of every word and lowercasing the rest. It is vectorised, NA safe, and locale aware, which makes it the go-to function for cleaning names, headlines, and plot labels in R.</p>

[QUICK ANSWER]
str_to_title(x)                              # default English locale
str_to_title(c("hello world", "good day"))   # vector input
str_to_title("WAR AND PEACE")                # downcases all-caps input
str_to_title(NA_character_)                  # NA, not "NA" (NA-safe)
str_to_title(c("ada lovelace", "alan turing")) # clean person names
df |> mutate(name = str_to_title(name))      # title-case a column
str_to_title("the_lord_of_the_rings")        # underscores split words
str_to_title("don't stop", locale = "en")    # apostrophe quirk: Don'T

[DECISION TREE: Is str_to_title() the right tool?]
- title case each word: str_to_title(x)
- uppercase the whole string: str_to_upper(x)
- lowercase the whole string: str_to_lower(x)
- only capitalize the first letter of the sentence: str_to_sentence(x)
- AP-style headline (skip short words): tools::toTitleCase(x)
- proper nouns inside free text: stringr::str_replace_all(x, "\\b([a-z])", toupper)
- snake_case to Title Case label: str_to_title(str_replace_all(x, "_", " "))

## What str_to_title() does in one sentence

**str_to_title(string, locale = "en") returns a copy of the input with the first character of every word in title case and the rest in lower case.** It works element-wise, treats whitespace and most punctuation as word boundaries, propagates NA as NA, and uses Unicode-aware rules from the stringi package so output is identical on Windows, macOS, and Linux.

Use str_to_title() whenever you need a presentable form of free-text data: cleaning person names from mixed casing, building plot labels from snake_case columns, or normalising titles before deduplication.

```r title="Load stringr and title case a vector"
library(stringr)

x <- c("ada lovelace", "ALAN TURING", "grace HOPPER", NA, "")
str_to_title(x)
#> [1] "Ada Lovelace" "Alan Turing"  "Grace Hopper" NA             ""
```

The output length matches the input, mixed case is normalised to title case, NA stays NA, and the empty string passes through unchanged.

## Syntax

**str_to_title(string, locale = "en") takes two arguments.** The first is the character vector you want to transform; the second is an ISO 639 language code selecting locale-specific casing rules. The default `"en"` covers ASCII and Latin text.

```r title="Function signature and defaults"
# str_to_title(string, locale = "en")
#
# string : character vector to title case
# locale : ISO 639 language code, e.g. "en", "tr", "de"
#          determines locale-specific casing rules
```

Because str_to_title() is vectorised, you can title case an entire column or thousands of rows in a single call without writing a loop.

```r title="Vectorised across an entire vector"
words <- c("the great gatsby", "MOBY DICK", "war and peace", "to kill a mockingbird")
str_to_title(words)
#> [1] "The Great Gatsby"       "Moby Dick"              "War And Peace"
#> [4] "To Kill A Mockingbird"
```

Notice that `"And"` and `"A"` are capitalized too. str_to_title() applies a uniform rule to every word; it does not implement AP or Chicago style smart-casing where short words stay lowercase.

[NOTE]
**str_to_title() is the stringi-backed counterpart of base R tools::toTitleCase().** They produce different output: str_to_title() capitalizes every word, while tools::toTitleCase() leaves articles and short prepositions in lowercase. Pick str_to_title() for consistent vectorised output, tools::toTitleCase() when you need AP-style headlines.

## Four common str_to_title() scenarios

**Four scenarios cover almost every real use of str_to_title().** Each block stands alone so you can paste it into the live console.

### Clean person names from a survey

**Free-text name fields rarely arrive in consistent casing.** Title casing them before joining or display removes a class of duplicate-row bugs caused by `"john smith"` and `"JOHN SMITH"` looking different to a join.

```r title="Normalise mixed-case person names"
raw_names <- c("ada lovelace", "ALAN TURING", "grace HOPPER", "linus torvalds")
str_to_title(raw_names)
#> [1] "Ada Lovelace"   "Alan Turing"    "Grace Hopper"   "Linus Torvalds"
```

Once names are uniform, downstream joins on `name` behave predictably and a grouped count will not split the same person across casings.

### Turn snake_case column names into plot labels

**Database columns travel in snake_case but plots read better with words.** Pairing str_replace_all() with str_to_title() converts identifiers into presentable axis or legend labels.

```r title="snake_case to Title Case for ggplot labels"
cols <- c("avg_session_duration", "click_through_rate", "bounce_rate")
str_to_title(str_replace_all(cols, "_", " "))
#> [1] "Avg Session Duration" "Click Through Rate"   "Bounce Rate"
```

The transformation is non-destructive: the original column names stay intact so you can keep using them in dplyr expressions while the new labels feed `labs()` or `xlab()`.

### Format book and movie titles

**Title fields are often the loudest data quality issue in a catalog.** str_to_title() gives you a uniform starting point even when the source mixes all-caps marketing copy with lowercase exports.

```r title="Normalise a movie title column"
library(dplyr)
movies <- tibble::tibble(
  title = c("the godfather", "PULP FICTION", "schindler's list", "FORREST GUMP")
)
movies |> mutate(title = str_to_title(title))
#> # A tibble: 4 x 1
#>   title
#>   <chr>
#> 1 The Godfather
#> 2 Pulp Fiction
#> 3 Schindler'S List
#> 4 Forrest Gump
```

Notice row 3: `"Schindler's"` became `"Schindler'S"` because the apostrophe is treated as a word boundary. The Pitfalls section below shows how to fix that.

### Tidy free-text categorical responses

**Survey responses with free text often need normalising before tabulation.** Title casing makes the category labels presentable and merges casing duplicates in the same step.

```r title="Title case survey response categories"
responses <- c("very satisfied", "VERY SATISFIED", "Satisfied", "neutral", "very satisfied")
clean <- str_to_title(responses)
table(clean)
#> clean
#>      Neutral      Satisfied Very Satisfied
#>            1              1              3
```

Without the title case step, `"very satisfied"` and `"VERY SATISFIED"` would appear as separate categories and inflate the cardinality of your factor.

[KEY INSIGHT]
**str_to_title() applies a uniform rule, not an editorial rule.** It capitalizes every word boundary identically, which is great for cleaning data but wrong for prose where short words should stay lowercase. Treat it as a normalisation step, then post-process with tools::toTitleCase() or a manual lookup if you need editorial style.

## str_to_title() vs str_to_upper() vs str_to_sentence() vs tools::toTitleCase()

**Four functions look similar but solve different problems.** Picking the wrong one shows up as over-capitalized output or inconsistent results.

| Function | Source | Capitalizes | Locale aware? | Best for |
|---|---|---|---|---|
| `str_to_title(x)` | stringr / stringi | every word | yes (`locale = "en"` default) | data cleaning, plot labels, name normalisation |
| `str_to_upper(x)` | stringr / stringi | every character | yes | ticker codes, ISO identifiers, all-caps display |
| `str_to_sentence(x)` | stringr / stringi | first letter only | yes | sentence-style captions, bullet points |
| `tools::toTitleCase(x)` | base R `tools` | major words only (AP style) | no | headlines, prose titles in print style |

Use str_to_title() for uniform Word-By-Word capitalisation, tools::toTitleCase() for editorial Headline Style, str_to_upper() for ALL CAPS, and str_to_sentence() when only the first letter should be capital.

## Common pitfalls

**Three pitfalls cause most str_to_title() surprises.** Each has a one-line fix.

### Every word gets capitalized, including articles and prepositions

**str_to_title() has no notion of "small words".** Articles like `"the"`, conjunctions like `"and"`, and prepositions like `"of"` all receive a capital first letter, which is wrong for AP-style or Chicago-style headlines.

```r title="Uniform capitalisation vs AP style"
title <- "the lord of the rings"
str_to_title(title)
#> [1] "The Lord Of The Rings"

tools::toTitleCase(title)
#> [1] "The Lord of the Rings"
```

Use `tools::toTitleCase()` from base R when editorial style matters; use str_to_title() when you need vectorised, predictable output for data cleaning.

### Apostrophes split words and capitalize the next letter

**str_to_title() treats apostrophes as word boundaries.** Names like `"O'Brien"` and contractions like `"don't"` come out broken because the letter after the apostrophe is capitalized too.

```r title="Apostrophe word-boundary trap"
str_to_title(c("o'brien", "don't stop", "i'm here"))
#> [1] "O'Brien"   "Don'T Stop" "I'M Here"
```

Patch the output with a targeted replacement: `str_replace_all(str_to_title(x), "'([A-Z])", "'\\L\\1")` lowercases the letter after each apostrophe via a perl-style replacement, or build a manual whitelist for known names.

### Acronyms and initialisms get downgraded

**str_to_title() lowercases all letters that are not at a word boundary.** That destroys all-caps tokens you want to preserve, such as `"USA"`, `"NASA"`, `"API"`, `"R"`, and `"SQL"`.

```r title="Acronyms become title-cased"
str_to_title(c("USA today", "NASA mission", "intro to SQL"))
#> [1] "Usa Today"     "Nasa Mission"  "Intro To Sql"
```

If the input contains a small, known set of acronyms, run str_to_title() first and then `str_replace_all()` to restore the all-caps form: `str_replace_all(out, "\\bUsa\\b", "USA")`. For arbitrary mixed text, consider title casing only the columns you control and leaving annotation fields alone.

[WARNING]
**Coming from Python pandas?** The pandas equivalent is `df["col"].str.title()`. Both are vectorised and NA-safe, and both share the same apostrophe quirk (`"don't"` becomes `"Don'T"`). Only stringr exposes a `locale` argument; pandas uses the Python locale, which behaves like base R tools::toTitleCase() for ASCII text.

## Try it yourself

**Try it:** Use the `state.name` vector to build a tibble whose `display` column shows each state as if it arrived in lowercase from a free-text form. First lowercase it, then title case it back, and save the result to `ex_states`.

```r title="Your turn: round-trip a state name through title case"
# Try it: round-trip lowercased state names back to title case
ex_states <- # your code here

head(ex_states)
#> Expected: tibble with columns lower, display (50 rows)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tibble)
ex_states <- tibble(
  lower   = str_to_lower(state.name),
  display = str_to_title(str_to_lower(state.name))
)
head(ex_states)
#> # A tibble: 6 x 2
#>   lower      display
#>   <chr>      <chr>
#> 1 alabama    Alabama
#> 2 alaska     Alaska
#> 3 arizona    Arizona
#> 4 arkansas   Arkansas
#> 5 california California
#> 6 colorado   Colorado
nrow(ex_states)
#> [1] 50
```

**Explanation:** str_to_lower() simulates the messy lowercase input you might receive from a form, and str_to_title() restores presentable casing in a single vectorised call across all 50 names.

</details>

## Related stringr functions

When str_to_title() is not quite what you need, these are the next stops:

- [str_to_upper()](stringr-str_to_upper-in-R.html) returns the all-uppercase form, useful for ticker codes and ISO identifiers.
- [str_to_lower()](stringr-str_to_lower-in-R.html) returns the all-lowercase form, useful for normalising search keys.
- [str_to_sentence()](stringr-str_to_sentence-in-R.html) capitalizes only the first letter of the entire string for sentence-style captions.
- [str_replace_all()](stringr-str_replace_all-in-R.html) handles the apostrophe and acronym patch-ups described above.
- [str_trim()](stringr-str_trim-in-R.html) removes leading and trailing whitespace, often paired with str_to_title() in name cleaning.
- The full [stringr reference](https://stringr.tidyverse.org/reference/case.html) documents every case-conversion helper.

## FAQ

**What is the difference between str_to_title() and tools::toTitleCase() in R?**

Both produce title-cased output, but str_to_title() capitalizes every word while tools::toTitleCase() keeps articles, conjunctions, and short prepositions in lowercase. For `"the lord of the rings"`, str_to_title() returns `"The Lord Of The Rings"` while tools::toTitleCase() returns `"The Lord of the Rings"`. Pick str_to_title() for vectorised data cleaning and tools::toTitleCase() for editorial headlines.

**How do I title case a column in a data frame?**

Inside a dplyr pipeline, use `mutate()` with str_to_title(): `df |> mutate(name = str_to_title(name))`. The function is vectorised, so the column is processed in one call. If the column is a factor, str_to_title() returns a character vector; wrap with `factor()` or use `forcats::fct_relabel(name, str_to_title)` to keep level order.

**Why does str_to_title() turn "don't" into "Don'T"?**

str_to_title() treats apostrophes as word boundaries, so the letter immediately after each apostrophe is capitalized. Contractions like `"don't"` become `"Don'T"` and names like `"o'brien"` become `"O'Brien"`. Patch with a perl regex: `str_replace_all(str_to_title(x), "'([A-Z])", "'\\L\\1")` lowercases the captured letter.

**Does str_to_title() preserve all-caps acronyms like USA or NASA?**

No. str_to_title() lowercases every letter that is not at a word boundary, so `"USA today"` becomes `"Usa Today"`. If your input mixes prose and acronyms, run str_to_title() first and then restore each known token with `str_replace_all(out, "\\bUsa\\b", "USA")`, or split prose and identifiers into separate columns.

**Is str_to_title() locale aware?**

Yes. str_to_title() accepts a `locale` argument and uses Unicode-aware case mapping from the stringi package, so accented Latin, Cyrillic, and Greek scripts are title-cased correctly. The default `"en"` handles ASCII and most Latin text; pass `"tr"` for Turkish or `"de"` for German when characters need locale-specific casing rules.
