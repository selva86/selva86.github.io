---
title: "Text Mining Exercises in R: 20 Practice Problems"
slug: "Text-Mining-Exercises-in-R"
description: "Master text mining in R with 20 practice problems: tidytext, tm, sentiment, word counts, tf-idf, n-grams. Hidden solutions."
keywords: "text mining R exercises, tidytext exercises, R sentiment analysis, tf-idf R, n-gram R exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Text Mining Exercises"
sidebar_order: 165
fr_parent: "R-Tutorial.html"
auto_link_terms: "text mining R exercises|tidytext exercises|R sentiment analysis|tf-idf R"
auto_link_case_sensitive: false
target_keyword: "text mining R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Text Mining Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on text mining in R: tokenization, word counts, tf-idf, n-grams, sentiment, stop-words. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(stringr)
library(tibble)
```

### Exercise 1: Tokenize a sentence

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_split("hello world from R", " ")[[1]]
```

</details>

### Exercise 2: Lowercase tokens

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_to_lower(c("Hello","WORLD","R"))
```

</details>

### Exercise 3: Word frequencies

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
words <- str_split("the cat sat on the mat the dog ran", " ")[[1]]
table(words)
```

</details>

### Exercise 4: Remove stopwords

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
stops <- c("the","a","is","on","to","and")
words <- c("the","cat","is","on","the","mat")
words[!words %in% stops]
```

</details>

### Exercise 5: tidytext unnest_tokens

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1, text = "Hello world from R")
tidytext::unnest_tokens(df, word, text)
```

</details>

### Exercise 6: Sentiment with bing lexicon

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, text = c("I love R", "This is terrible"))
df |>
  tidytext::unnest_tokens(word, text) |>
  inner_join(tidytext::get_sentiments("bing"), by = "word") |>
  count(id, sentiment)
```

</details>

### Exercise 7: TF-IDF

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(doc = c("d1","d2"), text = c("R is great R is powerful", "Python is great"))
df |>
  tidytext::unnest_tokens(word, text) |>
  count(doc, word) |>
  tidytext::bind_tf_idf(word, doc, n)
```

</details>

### Exercise 8: Bigrams

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1, text = "the cat sat on the mat")
tidytext::unnest_tokens(df, bigram, text, token = "ngrams", n = 2)
```

</details>

### Exercise 9: Word cloud (concept)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# wordcloud::wordcloud(words, freq, min.freq = 1)
```

</details>

### Exercise 10: Document-term matrix

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(doc = c("d1","d2"), text = c("hello world", "world R"))
df |>
  tidytext::unnest_tokens(word, text) |>
  count(doc, word) |>
  tidyr::pivot_wider(names_from = word, values_from = n, values_fill = 0)
```

</details>

### Exercise 11: Text length

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_count(c("hello world", "hi"), "\\w+")
```

</details>

### Exercise 12: Detect language (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# cld3::detect_language("Bonjour le monde")
```

</details>

### Exercise 13: Replace contractions

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_replace_all("don't can't won't", c("don't" = "do not",
                                       "can't" = "cannot",
                                       "won't" = "will not"))
```

</details>

### Exercise 14: Stem words

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
SnowballC::wordStem(c("running","runner","runs"))
```

</details>

### Exercise 15: Frequent terms by group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(group = c("A","A","B"), text = c("R is great", "R is powerful", "Python is also great"))
df |>
  tidytext::unnest_tokens(word, text) |>
  count(group, word, sort = TRUE) |>
  group_by(group) |> slice_head(n = 3)
```

</details>

### Exercise 16: Document similarity (cosine)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(doc = c("d1","d2"), text = c("R is great", "R is great"))
dtm <- df |> tidytext::unnest_tokens(word, text) |>
  count(doc, word) |>
  tidyr::pivot_wider(names_from = word, values_from = n, values_fill = 0)
v1 <- as.numeric(dtm[1,-1]); v2 <- as.numeric(dtm[2,-1])
sum(v1*v2) / (sqrt(sum(v1^2)) * sqrt(sum(v2^2)))
```

</details>

### Exercise 17: Top tf-idf per doc

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(doc = c("d1","d1","d2","d2"), word = c("r","stats","python","stats"), n = c(2,1,3,1))
df |> tidytext::bind_tf_idf(word, doc, n) |>
  group_by(doc) |> slice_max(tf_idf, n = 2)
```

</details>

### Exercise 18: Filter very rare/common words

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(doc = c("d1","d1","d2"), word = c("r","stats","r"), n = c(2,1,3))
df |> group_by(word) |> filter(n() >= 2)
```

</details>

### Exercise 19: Lemmatize (textstem)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# textstem::lemmatize_words(c("running","runs","ran"))
```

</details>

### Exercise 20: Word context (kwic)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# quanteda::kwic(quanteda::tokens("the quick brown fox"), pattern = "quick", window = 2)
```

</details>

## What to do next

- **NLP-Exercises** (coming) — language modeling beyond bag-of-words.
- **stringr-Exercises** (shipped) — string ops.
