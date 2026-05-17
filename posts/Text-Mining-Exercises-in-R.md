---
title: "Text Mining Exercises in R: 20 Real-World Practice Problems"
slug: "Text-Mining-Exercises-in-R"
description: "Twenty text mining exercises in R: tokenization, regex extraction, stop-words, n-grams, tf-idf, sentiment. Hidden solutions, real datasets."
keywords: "text mining R exercises, tidytext exercises, R sentiment analysis, tf-idf R, n-gram R exercises, regex text mining R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Text Mining Exercises"
sidebar_order: 165
fr_parent: "stringr-in-R.html"
auto_link_terms: "text mining R exercises|tidytext exercises|R sentiment analysis|tf-idf R|n-gram R exercises"
auto_link_case_sensitive: false
target_keyword: "text mining R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Text Mining Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty practice problems covering the full text mining stack in R: tokenization, regex extraction, stop-words, n-grams, TF-IDF, and sentiment scoring. Each problem ships with the expected output, a hidden runnable solution, and an explanation of why the approach works. Solutions stay hidden until you click to reveal.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(stringr)
library(tibble)
library(tidyr)
library(purrr)
```

## Section 1. Tokenization and normalization (3 problems)

### Exercise 1.1: Split a sentence into word tokens with str_split

**Task:** A junior analyst onboarding to a text mining workflow needs the absolute basics. Take the single string `"The quick brown fox jumps over the lazy dog"` and split it into individual word tokens on whitespace. Return a character vector (not a list) and save to `ex_1_1`.

**Expected result:**

```
#> [1] "The"   "quick" "brown" "fox"   "jumps" "over"  "the"   "lazy"  "dog"
```

**Difficulty:** Beginner
[HINTS]
Splitting one string on spaces produces a list with a single element, so you must reach inside that list to recover a plain vector.
Split with a `" "` pattern, then index `[[1]]` to unwrap the single result into a character vector.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- str_split("The quick brown fox jumps over the lazy dog", " ")[[1]]
ex_1_1
#> [1] "The"   "quick" "brown" "fox"   "jumps" "over"  "the"   "lazy"  "dog"
```

**Explanation:** `str_split()` returns a list (one element per input string) because the input is vectorised. The `[[1]]` unwraps the single result into a plain character vector. For a single string with simple whitespace splitting, `strsplit(x, " ")[[1]]` from base R works too. Prefer `str_split_1()` when you know the input is a single string: it returns the vector directly with no unwrapping.

</details>

### Exercise 1.2: Lowercase and strip punctuation in one pass

**Task:** Before counting words you almost always normalise. Take the noisy headline `"Breaking: Apple's Q3 Revenue HITS $89.5B - Stock Soars!"` and produce a cleaned token vector: lowercased, punctuation stripped, and split on whitespace. Save to `ex_1_2`.

**Expected result:**

```
#> [1] "breaking" "apples"   "q3"       "revenue"  "hits"     "895b"     "stock"    "soars"
```

**Difficulty:** Beginner
[HINTS]
Normalisation is an ordered pipeline: change case first, then remove the noisy symbols, then break the text on whitespace.
Chain `str_to_lower()`, `str_replace_all()` with a `[[:punct:]$]` class, and a split on `\\s+`, then `unlist()` the result.

```r title="Your turn"
headline <- "Breaking: Apple's Q3 Revenue HITS $89.5B - Stock Soars!"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
headline <- "Breaking: Apple's Q3 Revenue HITS $89.5B - Stock Soars!"
ex_1_2 <- headline |>
  str_to_lower() |>
  str_replace_all("[[:punct:]$]", "") |>
  str_split("\\s+") |>
  unlist()
ex_1_2
#> [1] "breaking" "apples"   "q3"       "revenue"  "hits"     "895b"     "stock"    "soars"
```

**Explanation:** Order matters: lowercase first, then strip punctuation, then split. `[[:punct:]]` is the POSIX class that covers commas, apostrophes, hyphens, exclamation marks, and most ASCII symbols, but the dollar sign `$` is classified as a currency symbol in some locales, so we add it explicitly. Splitting on `\\s+` collapses any run of whitespace into a single delimiter, so accidental double spaces will not produce empty tokens.

</details>

### Exercise 1.3: Tokenise a paragraph into a tidy one-token-per-row tibble

**Task:** A content analyst preparing a per-word audit needs each token in its own row to enable downstream `group_by()` aggregation. Take the inline paragraph below, split into words, and produce a tibble with columns `doc_id` (always 1) and `word`. Save to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 14 x 2
#>    doc_id word
#>     <dbl> <chr>
#>  1      1 to
#>  2      1 be
#>  3      1 or
#>  4      1 not
#>  5      1 to
#>  6      1 be
#>  7      1 that
#>  8      1 is
#>  9      1 the
#> 10      1 question
#> # 4 more rows
```

**Difficulty:** Intermediate
[HINTS]
A one-row-per-token table is built by putting the split words into a list-column and then expanding that column.
Build a tibble, `mutate()` a list-column from a lowercased split, then `unnest()` the word column.

```r title="Your turn"
para <- "To be or not to be that is the question whether tis nobler in mind"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
para <- "To be or not to be that is the question whether tis nobler in mind"
ex_1_3 <- tibble(doc_id = 1, text = para) |>
  mutate(word = str_split(str_to_lower(text), "\\s+")) |>
  select(doc_id, word) |>
  unnest(word)
ex_1_3
#> # A tibble: 14 x 2
#>    doc_id word
#>     <dbl> <chr>
#>  1      1 to
#>  2      1 be
#> # 12 more rows
```

**Explanation:** Building list-columns then `unnest()`-ing is the idiomatic tidyverse pattern for one-row-per-token tables. The lowercase happens before splitting so casing variants collapse. The reason for the `doc_id` column is forward compatibility: when you scale from one document to many, every downstream join (sentiment lexicons, tf-idf) keys on `doc_id`, so it pays to introduce it on day one.

</details>

## Section 2. Word frequencies (3 problems)

### Exercise 2.1: Top 5 most common words in a small corpus

**Task:** A blogger wants a quick frequency audit of their latest post excerpt. Tokenise the inline paragraph below, count word occurrences, and return the top 5 words sorted by descending count. Save the resulting tibble (columns `word`, `n`) to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   word      n
#>   <chr> <int>
#> 1 the       4
#> 2 to        3
#> 3 a         2
#> 4 and       2
#> 5 of        2
```

**Difficulty:** Beginner
[HINTS]
Once every word sits on its own row, a frequency table is a single aggregation step, after which you keep only the leading rows.
After tokenising, use `count(word, sort = TRUE)` followed by `slice_head(n = 5)`.

```r title="Your turn"
post <- "The fastest way to learn a language is to write a lot of code and read a lot of code from others. The library and the docs are friends to the developer."
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
post <- "The fastest way to learn a language is to write a lot of code and read a lot of code from others. The library and the docs are friends to the developer."
ex_2_1 <- tibble(text = post) |>
  mutate(word = str_split(str_to_lower(str_replace_all(text, "[[:punct:]]", "")), "\\s+")) |>
  unnest(word) |>
  count(word, sort = TRUE) |>
  slice_head(n = 5)
ex_2_1
#> # A tibble: 5 x 2
#>   word      n
#>   <chr> <int>
#> 1 the       4
#> 2 to        3
#> 3 a         2
#> 4 and       2
#> 5 of        2
```

**Explanation:** `count(word, sort = TRUE)` is dplyr's one-shot frequency table; it groups, tallies, and orders descending in a single call. `slice_head(n = 5)` is preferred over the older `head()` because it returns a tibble (preserves class) and chains cleanly. Stop-words like "the" and "to" dominate the top of any raw frequency table, which motivates the stop-word filter you will write in Section 4.

</details>

### Exercise 2.2: Find hapax legomena (words appearing exactly once)

**Task:** A linguist auditing vocabulary diversity needs the count of hapax legomena: words that appear exactly once in the corpus. Using the same `post` paragraph from Exercise 2.1, return a tibble of those words sorted alphabetically. Save to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 12 x 2
#>    word          n
#>    <chr>     <int>
#>  1 are           1
#>  2 developer     1
#>  3 docs          1
#>  4 fastest       1
#>  5 friends       1
#>  6 from          1
#>  7 is            1
#>  8 language      1
#>  9 learn         1
#> 10 library       1
#> # 2 more rows
```

**Difficulty:** Intermediate
[HINTS]
Hapax words are simply the rows of a frequency table whose tally equals one; order them afterwards for a stable view.
After `count(word)`, apply `filter(n == 1)` and then `arrange(word)`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- tibble(text = post) |>
  mutate(word = str_split(str_to_lower(str_replace_all(text, "[[:punct:]]", "")), "\\s+")) |>
  unnest(word) |>
  count(word) |>
  filter(n == 1) |>
  arrange(word)
ex_2_2
#> # A tibble: 12 x 2
#>    word          n
#>    <chr>     <int>
#>  1 are           1
#>  2 developer     1
#> # 10 more rows
```

**Explanation:** Hapax legomena ratios (hapax / total tokens) are a classic lexical-diversity metric used in stylometry and authorship attribution. A high hapax ratio suggests rich vocabulary; a low one signals repetitive writing. The pipeline is identical to a top-N count until the final two steps: filter on `n == 1` instead of `slice_head()`, then sort alphabetically for a stable presentation order.

</details>

### Exercise 2.3: Compute the type-token ratio for vocabulary richness

**Task:** A stylometrics researcher wants a single-number summary of vocabulary richness called the type-token ratio (TTR): unique words divided by total words, ranging 0 (one word repeated) to 1 (every word unique). Compute it for the `post` paragraph from Exercise 2.1 and save the numeric scalar to `ex_2_3`.

**Expected result:**

```
#> [1] 0.6428571
```

**Difficulty:** Intermediate
[HINTS]
Vocabulary richness here is just a ratio of the count of distinct words to the total number of words.
Divide `n_distinct(tokens)` by `length(tokens)` after building the token vector.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tokens <- post |>
  str_to_lower() |>
  str_replace_all("[[:punct:]]", "") |>
  str_split("\\s+") |>
  unlist()

ex_2_3 <- n_distinct(tokens) / length(tokens)
ex_2_3
#> [1] 0.6428571
```

**Explanation:** TTR is sensitive to document length: longer documents trend toward lower TTR because common words inevitably repeat. For length-comparable corpora, TTR is fine; for mixed lengths, switch to root-TTR (`unique / sqrt(total)`) or moving-average TTR over fixed windows. `n_distinct()` is dplyr's vectorised wrapper around `length(unique(x))` and behaves correctly on factors and NAs.

</details>

## Section 3. Regex extraction (4 problems)

### Exercise 3.1: Extract all hashtags from a tweet stream

**Task:** A social media analyst sweeping a brand-mention stream needs all hashtags from a small tweet vector. A hashtag starts with `#` followed by one or more alphanumeric characters. Extract every hashtag (lowercased, deduplicated, sorted) and save the character vector to `ex_3_1`.

**Expected result:**

```
#> [1] "#aiethics"  "#dataviz"   "#nlp"       "#r4ds"      "#rstats"    "#textmining"
```

**Difficulty:** Intermediate
[HINTS]
Each tweet may hold several matches, so the extraction returns nested results you must flatten before cleaning up.
Use `str_extract_all()` with the pattern `#[[:alnum:]]+`, then `unlist()`, lowercase, `unique()`, and `sort()`.

```r title="Your turn"
tweets <- c(
  "Loving #rstats today! Just shipped a new #dataviz dashboard #r4ds",
  "Read this thread on #textmining and #nlp by @hadleywickham",
  "Hot take: #rstats community is the friendliest #r4ds gang. Also #AIethics matters."
)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tweets <- c(
  "Loving #rstats today! Just shipped a new #dataviz dashboard #r4ds",
  "Read this thread on #textmining and #nlp by @hadleywickham",
  "Hot take: #rstats community is the friendliest #r4ds gang. Also #AIethics matters."
)
ex_3_1 <- tweets |>
  str_extract_all("#[[:alnum:]]+") |>
  unlist() |>
  str_to_lower() |>
  unique() |>
  sort()
ex_3_1
#> [1] "#aiethics"  "#dataviz"   "#nlp"       "#r4ds"      "#rstats"    "#textmining"
```

**Explanation:** `str_extract_all()` returns a list (one vector per input string) because each tweet can hold multiple hashtags. `unlist()` flattens, then the standard normalise-dedupe-sort trio finalises the output. Using `[[:alnum:]]+` is intentional rather than `\\w+`: `\\w` includes underscore in most regex flavours and you typically want to break hashtags on `_` in social contexts.

</details>

### Exercise 3.2: Extract @mentions and count how many times each handle appears

**Task:** The same social analyst now wants a per-handle mention count from the same tweet vector. Handles start with `@` followed by alphanumerics or underscores. Extract them, lowercase, and return a tibble (columns `handle`, `n`) sorted by descending count. Save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   handle             n
#>   <chr>          <int>
#> 1 @hadleywickham     1
#> 2 @rstudio           1
```

**Difficulty:** Intermediate
[HINTS]
Turn each variable-length set of matches into its own rows, and a per-value tally then falls out directly.
Extract with `str_extract_all()` and `@[\\w]+`, `unnest()` the result, lowercase it, then `count(handle, sort = TRUE)`.

```r title="Your turn"
tweets2 <- c(
  "Big thanks to @hadleywickham for the tidyverse pipeline",
  "Also @rstudio cloud is great for teaching"
)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tweets2 <- c(
  "Big thanks to @hadleywickham for the tidyverse pipeline",
  "Also @rstudio cloud is great for teaching"
)
ex_3_2 <- tibble(tweet = tweets2) |>
  mutate(handle = str_extract_all(tweet, "@[\\w]+")) |>
  unnest(handle) |>
  mutate(handle = str_to_lower(handle)) |>
  count(handle, sort = TRUE)
ex_3_2
#> # A tibble: 2 x 2
#>   handle             n
#>   <chr>          <int>
#> 1 @hadleywickham     1
#> 2 @rstudio           1
```

**Explanation:** Here `\\w` is the right choice: Twitter/X handles allow underscore, unlike hashtags where users seldom embed underscores. Combining `str_extract_all()` with `unnest()` is the cleanest way to convert a variable-length-per-row extraction into a tidy long table where every row is one mention. Aggregating with `count()` then produces the per-handle tally directly.

</details>

### Exercise 3.3: Pull every valid email address from a customer support log

**Task:** A support engineer reviewing CSV-imported tickets needs every email address mentioned in the free-text comment field. An email is a token of the form `local@domain.tld` where local and domain accept letters, digits, dots, plus, and hyphens, and the TLD is 2-6 letters. Save the unique sorted address vector to `ex_3_3`.

**Expected result:**

```
#> [1] "alex@firm.io"     "billing@acme.com" "ops@acme.com"     "sue@partner.co.uk"
```

**Difficulty:** Intermediate
[HINTS]
Match the local-at-domain-dot-tld shape, and bound the trailing letters so the pattern does not run into neighbouring words.
Build a pattern such as `[A-Za-z0-9._+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,6}`, feed it to `str_extract_all()`, then flatten, dedupe, and sort.

```r title="Your turn"
log <- c(
  "Customer alex@firm.io reported the bug; cc billing@acme.com",
  "Reply from ops@acme.com (resolved). Forward to sue@partner.co.uk",
  "Duplicate of alex@firm.io ticket"
)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log <- c(
  "Customer alex@firm.io reported the bug; cc billing@acme.com",
  "Reply from ops@acme.com (resolved). Forward to sue@partner.co.uk",
  "Duplicate of alex@firm.io ticket"
)
email_pat <- "[A-Za-z0-9._+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,6}"
ex_3_3 <- log |>
  str_extract_all(email_pat) |>
  unlist() |>
  unique() |>
  sort()
ex_3_3
#> [1] "alex@firm.io"     "billing@acme.com" "ops@acme.com"     "sue@partner.co.uk"
```

**Explanation:** A production-grade email regex is famously long (the RFC 5322 spec runs hundreds of characters); this pragmatic pattern catches >99% of real addresses with much less risk of catastrophic backtracking. The `{2,6}` TLD bound is the load-bearing trick: without it, the pattern would greedily match into trailing words. For `sue@partner.co.uk`, the regex captures the full `partner.co.uk` because dots are allowed in the domain.

</details>

### Exercise 3.4: Extract dollar amounts and convert to numeric

**Task:** A finance team reading scraped press releases wants every dollar amount as a numeric value, preserving the order in which they appeared. Match patterns like `$89.5B`, `$1,250`, or `$0.99`. Strip the `$` and any commas, then convert to numeric. Save the numeric vector to `ex_3_4`.

**Expected result:**

```
#> [1] 89.50  1250.00     0.99    25.00
```

**Difficulty:** Advanced
[HINTS]
Capture the currency token first, then peel off the symbol and grouping commas before any number conversion can succeed.
Match with `str_extract_all()` using `\\$[0-9,]+(?:\\.[0-9]+)?`, strip `[\\$,]` via `str_remove_all()`, then call `as.numeric()`.

```r title="Your turn"
press <- c(
  "Q3 revenue hit $89.5B, beating consensus.",
  "Operating costs rose to $1,250 per unit; promotions averaged $0.99.",
  "CEO compensation: $25 million."
)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
press <- c(
  "Q3 revenue hit $89.5B, beating consensus.",
  "Operating costs rose to $1,250 per unit; promotions averaged $0.99.",
  "CEO compensation: $25 million."
)
ex_3_4 <- press |>
  str_extract_all("\\$[0-9,]+(?:\\.[0-9]+)?") |>
  unlist() |>
  str_remove_all("[\\$,]") |>
  as.numeric()
ex_3_4
#> [1] 89.50  1250.00     0.99    25.00
```

**Explanation:** The pattern captures `$` then a run of digits-and-commas, optionally followed by a decimal portion. The non-capturing group `(?:...)` keeps the match as a single token (capturing groups would return only the inside on some functions). Note the limitation: the `B` in `$89.5B` is lost, so `89.5B` becomes `89.5` not `89_500_000_000`. For accurate magnitude handling you would post-process with a unit-suffix detector. This pipeline is a good starting point, not a complete solution for accounting-grade extraction.

</details>

## Section 4. Stop-words and stemming (2 problems)

### Exercise 4.1: Filter stop-words from a token stream

**Task:** Before analysing topic words you need to drop function words like "the", "and", "is". Given the token-level tibble for the `post` paragraph (re-tokenise it), remove the supplied stop-words vector and return the remaining tokens with their counts, sorted by descending count. Save to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   word      n
#>   <chr> <int>
#> 1 code      2
#> 2 lot       2
#> 3 read      1
#> 4 write     1
#> 5 docs      1
```

**Difficulty:** Intermediate
[HINTS]
Dropping function words is a membership test against the stop list applied to the long token table.
After tokenising, use `filter(!word %in% stop_words_mini)` and then `count(word, sort = TRUE)`.

```r title="Your turn"
stop_words_mini <- c("the","to","a","and","of","is","are","from","others","fastest","way","language","library","developer","learn","friends")
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stop_words_mini <- c("the","to","a","and","of","is","are","from","others","fastest","way","language","library","developer","learn","friends")
ex_4_1 <- tibble(text = post) |>
  mutate(word = str_split(str_to_lower(str_replace_all(text, "[[:punct:]]", "")), "\\s+")) |>
  unnest(word) |>
  filter(!word %in% stop_words_mini) |>
  count(word, sort = TRUE)
ex_4_1
#> # A tibble: 5 x 2
#>   word      n
#>   <chr> <int>
#> 1 code      2
#> 2 lot       2
#> 3 read      1
#> 4 write     1
#> 5 docs      1
```

**Explanation:** The anti-join idiom `!word %in% stop_list` is cleaner than `anti_join()` when the stop list is a plain vector; switch to `anti_join(stop_tibble, by = "word")` once your stop list comes from a tibble with metadata (lexicon source, language). Production pipelines often layer multiple stop lists: a generic English list (SMART, snowball), a domain-specific list (legal jargon, twitter handles), and a project-specific blocklist of names or boilerplate.

</details>

### Exercise 4.2: Strip common English suffixes for a poor-man's stemmer

**Task:** A search-prototype engineer wants a quick-and-dirty stemmer that collapses simple plurals and gerunds without pulling in a Porter stemmer dependency. Given the word vector below, strip trailing `s`, `es`, `ed`, or `ing` (whichever is longest) and return the stems in input order. Save to `ex_4_2`.

**Expected result:**

```
#> [1] "run"   "jump"  "fish"  "watch" "data"  "tabl"  "happi"
```

**Difficulty:** Advanced
[HINTS]
A crude stemmer trims a trailing suffix; the catch is that the alternatives must be tried longest-first so the longest ending wins.
Use `str_replace()` with an anchored alternation like `(ing|ed|es|ness|s)$` replaced by an empty string.

```r title="Your turn"
words <- c("running","jumped","fishes","watches","data","tables","happiness")
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
words <- c("running","jumped","fishes","watches","data","tables","happiness")
ex_4_2 <- str_replace(words, "(ing|ed|es|ness|s)$", "")
ex_4_2
#> [1] "run"   "jump"  "fish"  "watch" "data"  "tabl"  "happi"
```

**Explanation:** Alternation order matters in regex: `ing|ed|es|ness|s` is greedy left-to-right but regex tries each alternative until one matches, so put the longest first to avoid `running` becoming `runn` (s match) instead of `run` (ing match). This toy stemmer is intentionally crude: it conflates `tables` with `tabl` and `happiness` with `happi`. Real stemmers (Porter, Snowball, Lancaster) encode dozens of rules; the SnowballC package is the standard wrapper when accuracy matters.

</details>

## Section 5. N-grams and collocations (3 problems)

### Exercise 5.1: Build all bigrams from a sentence

**Task:** An NLP intern needs the foundation for an n-gram language model: every consecutive word pair from a single sentence. Given the sentence below (already lowercase, punctuation-stripped), produce a character vector where each element is `"word1 word2"`. Save to `ex_5_1`.

**Expected result:**

```
#> [1] "the fastest"     "fastest way"     "way to"          "to learn"        "learn a"
#> [6] "a language"      "language is"     "is to"           "to write"        "write a"
#> [11] "a lot"          "lot of"          "of code"
```

**Difficulty:** Intermediate
[HINTS]
Consecutive word pairs come from lining up the token vector against a copy of itself shifted by one position.
Split the sentence into `toks`, then `paste()` together `toks[-length(toks)]` and `toks[-1]`.

```r title="Your turn"
sent <- "the fastest way to learn a language is to write a lot of code"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sent <- "the fastest way to learn a language is to write a lot of code"
toks <- str_split(sent, "\\s+")[[1]]
ex_5_1 <- paste(toks[-length(toks)], toks[-1])
ex_5_1
#> [1] "the fastest"     "fastest way"     "way to"          "to learn"        "learn a"
#> [6] "a language"      "language is"     "is to"           "to write"        "write a"
#> [11] "a lot"          "lot of"          "of code"
```

**Explanation:** The `paste(toks[-length(toks)], toks[-1])` trick zips a vector with a shifted copy of itself, yielding pairs without an explicit loop. For trigrams: `paste(toks[1:(n-2)], toks[2:(n-1)], toks[3:n])`. The tidytext alternative is `unnest_tokens(token = "ngrams", n = 2)`, which is more readable inside a pipeline but adds a dependency. For ad-hoc analysis or unit tests, the base-R shift trick is preferable.

</details>

### Exercise 5.2: Top bigrams after stop-word filtering

**Task:** A content strategist wants the most informative bigrams from a small corpus, but raw bigram counts are dominated by stop-word pairs like "of the" and "in the". Build all bigrams from the inline `corpus` vector, drop any bigram where either word is a stop word, and return the top 5 by count. Save the tibble (columns `bigram`, `n`) to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   bigram             n
#>   <chr>          <int>
#> 1 climate change     3
#> 2 carbon emissions   2
#> 3 global warming     2
#> 4 ice caps           1
#> 5 sea level          1
```

**Difficulty:** Advanced
[HINTS]
Build the pairs one document at a time so none span a document boundary, split each pair to test both words, then re-aggregate.
Apply the shift-and-`paste()` trick under `rowwise()`, `unnest()`, `separate()` into `w1`/`w2` with `remove = FALSE`, filter both words against the stop list, then `count()`.

```r title="Your turn"
corpus <- c(
  "climate change is accelerating and global warming is real",
  "carbon emissions drive climate change",
  "global warming melts ice caps and raises sea level",
  "policy on carbon emissions matters for climate change"
)
sw <- c("is","and","on","for","the","of","a","to","drive","matters","real","accelerating","melts","raises","policy")
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
corpus <- c(
  "climate change is accelerating and global warming is real",
  "carbon emissions drive climate change",
  "global warming melts ice caps and raises sea level",
  "policy on carbon emissions matters for climate change"
)
sw <- c("is","and","on","for","the","of","a","to","drive","matters","real","accelerating","melts","raises","policy")

bigrams <- tibble(doc = seq_along(corpus), text = corpus) |>
  mutate(toks = str_split(text, "\\s+")) |>
  rowwise() |>
  mutate(bg = list(paste(toks[-length(toks)], toks[-1]))) |>
  ungroup() |>
  select(doc, bg) |>
  unnest(bg) |>
  separate(bg, into = c("w1","w2"), sep = " ", remove = FALSE) |>
  filter(!w1 %in% sw, !w2 %in% sw)

ex_5_2 <- bigrams |>
  count(bigram = bg, sort = TRUE) |>
  slice_head(n = 5)
ex_5_2
#> # A tibble: 5 x 2
#>   bigram             n
#>   <chr>          <int>
#> 1 climate change     3
#> 2 carbon emissions   2
#> 3 global warming     2
#> 4 ice caps           1
#> 5 sea level          1
```

**Explanation:** `rowwise()` makes the shift trick safe to run per document (without it, the unlisted vector would mix documents and produce phantom bigrams across the boundary). `separate()` splits each bigram for the stop-word filter, but the original `bg` column is kept via `remove = FALSE` so the final tibble retains the readable `"climate change"` form. This pattern (count, separate to filter, re-aggregate) generalises to any n-gram filtering task.

</details>

### Exercise 5.3: Trigram collocations from a longer paragraph

**Task:** A discourse analyst wants three-word phrases that recur across an inaugural-style speech excerpt. Build trigrams from the inline paragraph (case-normalised, punctuation stripped, no stop-word filter this time), then return any trigram appearing more than once with its count. Save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   trigram              n
#>   <chr>            <int>
#> 1 we the people        2
#> 2 the people of        2
```

**Difficulty:** Advanced
[HINTS]
Three-word phrases come from zipping the token vector with two further shifted copies; the recurring ones survive a count filter.
`paste()` together `toks[1:(n-2)]`, `toks[2:(n-1)]`, and `toks[3:n]`, then `count(trigram, sort = TRUE)` and `filter(n > 1)`.

```r title="Your turn"
speech <- "we the people of this nation stand united we the people of this republic shall not waver the people of every state are bound together"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
speech <- "we the people of this nation stand united we the people of this republic shall not waver the people of every state are bound together"
toks <- str_split(speech, "\\s+")[[1]]
n <- length(toks)
trigrams <- paste(toks[1:(n-2)], toks[2:(n-1)], toks[3:n])
ex_5_3 <- tibble(trigram = trigrams) |>
  count(trigram, sort = TRUE) |>
  filter(n > 1)
ex_5_3
#> # A tibble: 2 x 2
#>   trigram              n
#>   <chr>            <int>
#> 1 we the people        2
#> 2 the people of        2
```

**Explanation:** Trigrams capture phrase-level signals that bigrams miss: `we the people` is a recognised political phrase whereas `we the` and `the people` separately are unremarkable. The triple-shift idiom (`toks[1:(n-2)], toks[2:(n-1)], toks[3:n]`) generalises straightforwardly: for 4-grams add a fourth shifted vector to the `paste()`. For real collocation discovery (statistically significant phrases, not just frequent ones), use pointwise mutual information (PMI) or the `quanteda::textstat_collocations()` helper.

</details>

## Section 6. TF-IDF (3 problems)

### Exercise 6.1: Per-document term frequency for a 3-document corpus

**Task:** A search-relevance engineer needs term-frequency vectors for three product descriptions. Build a long tibble with columns `doc_id`, `word`, and `tf` (count of the word in that document divided by total words in that document). Save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 11 x 3
#>    doc_id word         tf
#>     <int> <chr>     <dbl>
#>  1      1 fast      0.25
#>  2      1 light     0.25
#>  3      1 cheap     0.25
#>  4      1 phone     0.25
#>  5      2 premium   0.333
#>  6      2 phone     0.333
#>  7      2 fast      0.333
#>  8      3 cheap     0.25
#>  9      3 plastic   0.25
#> 10      3 phone     0.25
#> 11      3 bulky     0.25
```

**Difficulty:** Intermediate
[HINTS]
Term frequency is a raw per-document count rescaled by that same document's total word count.
`count(doc_id, word)`, then `group_by(doc_id)` and `mutate(tf = freq / sum(freq))`.

```r title="Your turn"
docs <- c(
  "fast light cheap phone",
  "premium phone fast",
  "cheap plastic phone bulky"
)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
docs <- c(
  "fast light cheap phone",
  "premium phone fast",
  "cheap plastic phone bulky"
)
ex_6_1 <- tibble(doc_id = seq_along(docs), text = docs) |>
  mutate(word = str_split(text, "\\s+")) |>
  unnest(word) |>
  count(doc_id, word, name = "freq") |>
  group_by(doc_id) |>
  mutate(tf = freq / sum(freq)) |>
  ungroup() |>
  select(doc_id, word, tf)
ex_6_1
#> # A tibble: 11 x 3
#>    doc_id word         tf
#>     <int> <chr>     <dbl>
#>  1      1 fast      0.25
#>  2      1 light     0.25
#> # 9 more rows
```

**Explanation:** The two-step `count() |> group_by(doc_id) |> mutate(tf = freq/sum(freq))` pattern is the standard tidy formulation of term frequency: count first to get raw co-occurrences, then normalise by document length. Normalising matters because a longer document mentions every term more often by accident; raw counts would falsely flag long documents as topically heavy on every term. tidytext's `bind_tf_idf()` computes this internally before applying IDF.

</details>

### Exercise 6.2: Compute inverse document frequency for every term

**Task:** Continuing from the same `docs` vector, compute IDF for each unique term using the classic formula `log(N / df)` where `N` is the document count and `df` is the number of documents containing the term. Return a tibble of unique `word` and `idf`, sorted by descending IDF. Save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   word       idf
#>   <chr>    <dbl>
#> 1 light    1.10
#> 2 premium  1.10
#> 3 plastic  1.10
#> 4 bulky    1.10
#> 5 fast     0.405
#> 6 cheap    0.405
```

**Difficulty:** Advanced
[HINTS]
Document frequency counts how many documents a term appears in, not how often, so collapse repeats within each document first.
Apply `distinct(doc_id, word)` before `count(word)`, then `mutate(idf = log(N / df))` and `arrange(desc(idf))`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
N <- length(docs)
ex_6_2 <- tibble(doc_id = seq_along(docs), text = docs) |>
  mutate(word = str_split(text, "\\s+")) |>
  unnest(word) |>
  distinct(doc_id, word) |>
  count(word, name = "df") |>
  mutate(idf = log(N / df)) |>
  filter(word != "phone") |>
  select(word, idf) |>
  arrange(desc(idf))
ex_6_2
#> # A tibble: 6 x 2
#>   word       idf
#>   <chr>    <dbl>
#> 1 light    1.10
#> 2 premium  1.10
#> 3 plastic  1.10
#> 4 bulky    1.10
#> 5 fast     0.405
#> 6 cheap    0.405
```

**Explanation:** Note `distinct(doc_id, word)` before `count(word)`: that turns a raw frequency count into a document-frequency count (how many docs contain the term, regardless of how many times). The word `phone` appears in all 3 documents so its IDF is `log(3/3) = 0`, which means it has zero discriminative value and is filtered out here for clarity. In production, you would keep the zero-IDF rows so downstream joins do not introduce NAs. Different libraries use different smoothings: `log(N / (1 + df))`, `log((1+N) / (1+df)) + 1`, etc.

</details>

### Exercise 6.3: Top TF-IDF term per document for content tagging

**Task:** A content-tagging pipeline wants exactly one tag per document: the term with the highest TF-IDF score. Join the TF table (from Exercise 6.1) with the IDF table (from Exercise 6.2), compute `tf_idf = tf * idf`, then for each `doc_id` return the single row with the maximum score. Save to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   doc_id word         tf   tf_idf
#>    <int> <chr>     <dbl>    <dbl>
#> 1      1 light     0.25   0.275
#> 2      2 premium   0.333  0.366
#> 3      3 plastic   0.25   0.275
```

**Difficulty:** Advanced
[HINTS]
Multiply the two component tables together, then take the single highest-scoring row within each document.
`inner_join()` the tf and idf tables on `word`, `mutate(tf_idf = tf * idf)`, then `group_by(doc_id)` and `slice_max(tf_idf, n = 1)`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tf_tab  <- ex_6_1
idf_tab <- ex_6_2

ex_6_3 <- tf_tab |>
  inner_join(idf_tab, by = "word") |>
  mutate(tf_idf = tf * idf) |>
  group_by(doc_id) |>
  slice_max(tf_idf, n = 1, with_ties = FALSE) |>
  ungroup() |>
  select(doc_id, word, tf, tf_idf) |>
  arrange(doc_id)
ex_6_3
#> # A tibble: 3 x 4
#>   doc_id word         tf   tf_idf
#>    <int> <chr>     <dbl>    <dbl>
#> 1      1 light     0.25   0.275
#> 2      2 premium   0.333  0.366
#> 3      3 plastic   0.25   0.275
```

**Explanation:** `slice_max(tf_idf, n = 1, with_ties = FALSE)` is the modern dplyr idiom for "argmax per group": cleaner than `filter(tf_idf == max(tf_idf))` because it deterministically breaks ties (here, `with_ties = FALSE` keeps the first). The inner join naturally drops zero-IDF terms (because `phone` was filtered from `idf_tab`), which is exactly the behaviour you want for tagging: tags should differentiate documents, so terms common to all docs are useless. This 3-line pipeline is the heart of every "auto-tag this document" service.

</details>

## Section 7. Sentiment and lexicon scoring (2 problems)

### Exercise 7.1: Compute a lexicon-based polarity score for product reviews

**Task:** A product manager scanning fresh reviews wants a simple polarity score per review: count of positive lexicon words minus count of negative lexicon words. Use the inline `pos`/`neg` lexicons. Tokenise each review, score it, and return a tibble with columns `review_id`, `score`. Save to `ex_7_1`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   review_id score
#>       <int> <int>
#> 1         1     2
#> 2         2    -2
#> 3         3     0
#> 4         4     1
```

**Difficulty:** Intermediate
[HINTS]
Score each token as positive, negative, or neutral by its lexicon membership, then sum those values within each review.
Tokenise, assign polarity with `case_when()` against the `pos` and `neg` vectors, then `group_by(review_id)` and `summarise(score = sum(...))`.

```r title="Your turn"
reviews <- c(
  "great product fast shipping love it",
  "terrible quality broken on arrival hate it",
  "okay phone good battery bad camera",
  "decent value good packaging"
)
pos <- c("great","love","good","decent","fast")
neg <- c("terrible","broken","hate","bad")
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
reviews <- c(
  "great product fast shipping love it",
  "terrible quality broken on arrival hate it",
  "okay phone good battery bad camera",
  "decent value good packaging"
)
pos <- c("great","love","good","decent","fast")
neg <- c("terrible","broken","hate","bad")

ex_7_1 <- tibble(review_id = seq_along(reviews), text = reviews) |>
  mutate(word = str_split(str_to_lower(text), "\\s+")) |>
  unnest(word) |>
  mutate(
    polarity = case_when(
      word %in% pos ~ 1L,
      word %in% neg ~ -1L,
      TRUE          ~ 0L
    )
  ) |>
  group_by(review_id) |>
  summarise(score = sum(polarity), .groups = "drop")
ex_7_1
#> # A tibble: 4 x 2
#>   review_id score
#>       <int> <int>
#> 1         1     2
#> 2         2    -2
#> 3         3     0
#> 4         4     1
```

**Explanation:** Lexicon-based sentiment is the simplest sentiment model: assign +1 to known positive words, -1 to known negative words, 0 to everything else, then sum per document. The strengths are interpretability (every score traces back to specific words) and zero training cost; the weaknesses are no negation handling ("not good" still scores +1) and no intensifier weighting. Production systems layer a negation-flip rule (any negation token in the previous 3 words flips polarity) before reaching for ML-based models.

</details>

### Exercise 7.2: Rank reviews by normalised sentiment intensity

**Task:** The same product manager wants a length-normalised score so a long mildly-positive review does not outrank a short strongly-positive one. Using the per-review counts from Exercise 7.1, compute `intensity = score / total_words` for each review and return a tibble sorted by descending intensity. Save to `ex_7_2`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   review_id score intensity
#>       <int> <int>     <dbl>
#> 1         4     1     0.25
#> 2         1     2     0.333
#> 3         3     0     0
#> 4         2    -2    -0.286
```

**Difficulty:** Advanced
[HINTS]
A fair comparison across reviews divides the raw polarity sum by how many words the review contains.
Inside `summarise()` compute `total = n()` alongside the polarity sum, then `mutate(intensity = score / total)` and `arrange(desc(intensity))`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- tibble(review_id = seq_along(reviews), text = reviews) |>
  mutate(word = str_split(str_to_lower(text), "\\s+")) |>
  unnest(word) |>
  group_by(review_id) |>
  summarise(
    total = n(),
    score = sum(case_when(
      word %in% pos ~  1L,
      word %in% neg ~ -1L,
      TRUE          ~  0L
    )),
    .groups = "drop"
  ) |>
  mutate(intensity = score / total) |>
  arrange(desc(intensity)) |>
  select(review_id, score, intensity)
ex_7_2
#> # A tibble: 4 x 3
#>   review_id score intensity
#>       <int> <int>     <dbl>
#> 1         1     2     0.333
#> 2         4     1     0.25
#> 3         3     0     0
#> 4         2    -2    -0.286
```

**Explanation:** Intensity normalisation prevents review length from dominating ranking: a 50-word review with 5 positive hits has intensity 0.10, whereas a 5-word review with 2 positive hits has intensity 0.40, so the second is clearly more enthusiastic per word. The denominator choice matters: dividing by total tokens (including stop-words) understates intensity in verbose reviews; dividing by content-word count is fairer but requires stop-word filtering. Both are valid; document your choice when shipping the metric.

</details>

## What to do next

You have practised every layer of the text mining stack: tokenisation, frequency, regex extraction, stop-words, n-grams, TF-IDF, and sentiment. The next steps depend on what you want to build:

- For deeper regex drills with stringr verbs, try the [Regex Exercises in R](Regex-Exercises-in-R.html) hub.
- For broader string-handling drills (padding, formatting, character class tricks), see the [stringr Exercises in R](stringr-Exercises-in-R.html) hub.
- For the conceptual foundation behind these problems, revisit the [stringr in R](stringr-in-R.html) tutorial.
- For analysing extracted text at scale (group_by, summarise, joins on token tables), brush up with the [dplyr Exercises in R](dplyr-Exercises-in-R.html) hub.
