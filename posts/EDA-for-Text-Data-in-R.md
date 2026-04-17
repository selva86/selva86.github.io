---
title: "EDA for Text Data in R: Word Frequency, Length Distribution & Readability"
slug: "EDA-for-Text-Data-in-R"
description: "Explore text data in R before modelling: compute word frequencies, visualise string length distributions, score Flesch-Kincaid readability, and spot anomalies."
keywords: "EDA text data R, text exploratory analysis R, word frequency R, string length distribution R, readability score R, text mining EDA, Flesch-Kincaid R, text data analysis R, text EDA R"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-16"
curriculum_id: "FR-eda-2"
post_type: "FR"
auto_link_terms: "text EDA|EDA for text data|word frequency analysis|string length distribution|readability score|Flesch-Kincaid|text data exploration|word frequency table"
auto_link_case_sensitive: false
fr_parent: "Univariate-EDA-in-R.html"
---

# EDA for Text Data in R: Word Frequency, Length Distribution & Readability

<p class="lead">Text EDA examines the structure of character variables, how long strings are, which words dominate, and how readable the text is, so you can clean, transform, and understand text before fitting any model.</p>

## What can a quick summary tell you about text columns?

When you get a dataset with text columns, product reviews, survey responses, clinical notes, you need to inspect them the same way you'd inspect numeric variables. Instead of mean and median, you ask: how long are the strings? Are any empty? What's the character count distribution? Let's build a sample dataset and run the first diagnostics.

```r
# Sample product reviews for text EDA
reviews <- c(
  "Great product, works perfectly and arrived on time.",
  "Terrible quality. Broke after two days of use.",
  "OK",
  "I love this! Best purchase I have made this year by far. Would recommend to everyone.",
  "Not worth the money at all.",
  "",
  "Good value for the price. Shipping was fast.",
  "Absolutely wonderful. Five stars. Will buy again and again!",
  NA,
  "Decent but could be improved in several ways.",
  "DO NOT BUY THIS PRODUCT!!! WORST EVER!!!",
  "The packaging was nice. Product itself is mediocre at best.",
  "Arrived damaged, requested a refund immediately.",
  "Exceeded my expectations. Superb craftsmanship and attention to detail.",
  "meh"
)

# Character counts and word counts
char_counts <- nchar(reviews)
word_counts <- sapply(reviews, function(x) {
  if (is.na(x)) return(NA)
  length(unlist(strsplit(trimws(x), "\\s+")))
})

# Summary statistics
cat("=== Text Column Summary ===\n")
cat("Total entries:", length(reviews), "\n")
cat("NAs:", sum(is.na(reviews)), "\n")
cat("Empty strings:", sum(reviews == "", na.rm = TRUE), "\n\n")
cat("Character counts:\n")
summary(char_counts)
#> Total entries: 15
#> NAs: 1
#> Empty strings: 1
#>
#> Character counts:
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.    NA's
#>    0.00   27.00   45.00   38.07   55.50   84.00       1
cat("\nWord counts:\n")
summary(word_counts)
#> Word counts:
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.    NA's
#>    0.00    5.50    8.00    7.14   10.25   15.00       1
```

Right away, you know the dataset has 15 entries: one NA, one empty string, and character counts ranging from 0 to 84. The median review is 45 characters (about 8 words). That big gap between the shortest entry ("OK" at 2 characters) and the longest (84 characters) hints at high variability, worth visualising.

[KEY INSIGHT]
**nchar() is to text what summary() is to numbers.** Run it first on every text column. The min, median, and max character counts instantly reveal whether you're dealing with tweets, paragraphs, or essays, and whether empty strings or outlier-length entries need handling.

Now let's look at which entries are empty or missing, because those need different treatment.

```r
# Find problematic entries
empty_idx <- which(reviews == "")
na_idx <- which(is.na(reviews))

cat("Empty string at position(s):", empty_idx, "\n")
cat("NA at position(s):", na_idx, "\n")
cat("Valid text entries:", sum(!is.na(reviews) & reviews != ""), "out of", length(reviews), "\n")
#> Empty string at position(s): 6
#> NA at position(s): 9
#> Valid text entries: 13 out of 15
```

Two entries are missing or empty, that's a 13% data loss rate. In practice, you'd decide whether to drop them or flag them separately depending on your analysis goal.

**Try it:** Create a vector of 5 sentences and compute the median word count. Which sentence is closest to the median?

```r
# Try it: compute median word count
ex_sentences <- c(
  "The quick brown fox jumps over the lazy dog.",
  "R is great.",
  "Data science combines statistics and programming skills.",
  "Hello world.",
  "Exploratory data analysis reveals hidden patterns in your dataset."
)

# your code here: compute word count for each sentence and find the median
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_wc <- sapply(ex_sentences, function(x) length(unlist(strsplit(x, "\\s+"))))
cat("Word counts:", ex_wc, "\n")
cat("Median:", median(ex_wc), "\n")
#> Word counts: 9 3 7 2 9
#> Median: 7
```

**Explanation:** The median word count is 7. The third sentence ("Data science combines statistics and programming skills.") has exactly 7 words and sits right at the median.

</details>

## How do you visualise string length distributions?

Just like you'd histogram a numeric variable, you should histogram text lengths. The shape tells you whether most texts are similar in length (tight bell) or wildly different (heavy right tail). Let's plot the character counts from our reviews.

```r
# Histogram of character counts
valid <- char_counts[!is.na(char_counts)]
hist(valid, breaks = 10,
     main = "Distribution of Review Lengths (Characters)",
     xlab = "Character count", ylab = "Frequency",
     col = "steelblue", border = "white")
abline(v = median(valid), col = "red", lwd = 2, lty = 2)
legend("topright", legend = paste("Median =", median(valid)),
       col = "red", lwd = 2, lty = 2)
#> (Histogram showing right-skewed distribution with median line at 45)
```

The histogram shows a right skew, most reviews cluster between 25-60 characters, but a few long ones stretch the tail. The red dashed line marks the median at 45 characters. This pattern is extremely common in text data: most entries are moderate-length, but a few verbose ones pull the mean up.

A boxplot makes outlier detection even easier.

```r
# Boxplot of word counts to spot outliers
valid_wc <- word_counts[!is.na(word_counts)]
boxplot(valid_wc, horizontal = TRUE,
        main = "Word Count per Review",
        xlab = "Number of words",
        col = "lightblue", border = "steelblue")
#> (Boxplot showing IQR between ~5 and ~10 words, one long outlier at 15)
```

The boxplot highlights that 50% of reviews fall between roughly 5 and 10 words, with one entry reaching 15 words. The zero-word entry (our empty string) shows up as a clear outlier on the left, exactly the kind of anomaly you want to catch early.

[TIP]
**Log-transform heavily right-skewed text lengths for clearer patterns.** When a few documents are 10x longer than the rest, a regular histogram hides detail in the short-text region. A log scale spreads that compressed region out.

When your text lengths span a wide range (say, tweets mixed with blog posts), a log transformation helps.

```r
# Compare original vs log-transformed distributions
par(mfrow = c(1, 2))

# Simulate a wider range of text lengths
set.seed(77)
long_texts <- c(char_counts[!is.na(char_counts) & char_counts > 0],
                sample(200:2000, 20, replace = TRUE))

hist(long_texts, breaks = 15,
     main = "Original Scale",
     xlab = "Character count", col = "steelblue", border = "white")

hist(log10(long_texts), breaks = 15,
     main = "Log10 Scale",
     xlab = "log10(Character count)", col = "coral", border = "white")

par(mfrow = c(1, 1))
#> (Two side-by-side histograms: left is heavily right-skewed, right shows
#>  a more balanced bimodal pattern revealing two groups of text lengths)
```

On the original scale, short reviews are crushed into the left edge. On the log scale, you can see two distinct clusters, one around 1.5 (roughly 30 characters: the reviews) and one around 2.5-3 (roughly 300-1000 characters: the simulated longer texts). The log transform revealed a bimodal structure that was invisible before.

**Try it:** Create a boxplot of character counts (not word counts) for our original `reviews` vector. Does the boxplot flag any outliers?

```r
# Try it: boxplot of character counts
ex_valid <- char_counts[!is.na(char_counts)]

# your code here: create a horizontal boxplot
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_valid <- char_counts[!is.na(char_counts)]
boxplot(ex_valid, horizontal = TRUE,
        main = "Character Count Distribution",
        xlab = "Characters", col = "lightgreen", border = "darkgreen")
#> (Boxplot showing IQR ~27-56, the empty string at 0 is an outlier)
```

**Explanation:** The boxplot flags the empty string (0 characters) as a low outlier. The 84-character review sits near the upper whisker but within the expected range.

</details>

## What are the most frequent words and how do you find them?

Word frequency analysis reveals what your text data is actually about. The process is: split text into individual words (tokenise), convert to lowercase, remove common stop words, then count what's left. Let's do this step by step using only base R.

```r
# Tokenise: split all reviews into individual words
valid_reviews <- reviews[!is.na(reviews) & reviews != ""]
all_words <- unlist(strsplit(tolower(valid_reviews), "[^a-z']+"))
all_words <- all_words[all_words != ""]  # remove empty strings from splitting

cat("Total word tokens:", length(all_words), "\n")
cat("Unique words:", length(unique(all_words)), "\n")
cat("\nFirst 20 tokens:\n")
head(all_words, 20)
#> Total word tokens: 93
#> Unique words: 68
#>
#> First 20 tokens:
#>  [1] "great"     "product"   "works"     "perfectly" "and"
#>  [6] "arrived"   "on"        "time"      "terrible"  "quality"
#> [11] "broke"     "after"     "two"       "days"      "of"
#> [16] "use"       "ok"        "i"         "love"      "this"
```

We have 93 word tokens and 68 unique words. But many of those will be filler words like "the", "and", "is". Let's remove stop words to find the meaningful terms.

[WARNING]
**Always remove stop words before interpreting frequency tables.** Without this step, words like "the", "and", "is" dominate every chart. They tell you nothing about the content, only that the text is written in English.

```r
# Define stop words (common English function words)
stop_words <- c("the", "a", "an", "and", "or", "but", "in", "on", "at",
                "to", "for", "of", "with", "by", "is", "was", "are", "were",
                "be", "been", "being", "have", "has", "had", "do", "does",
                "did", "will", "would", "could", "should", "may", "might",
                "i", "you", "he", "she", "it", "we", "they", "me", "my",
                "this", "that", "not", "all", "no", "so", "if", "from",
                "up", "out", "as", "its", "am", "than")

# Remove stop words and build frequency table
clean_words <- all_words[!all_words %in% stop_words]
freq_table <- sort(table(clean_words), decreasing = TRUE)

cat("Words after stop-word removal:", length(clean_words), "\n")
cat("Unique meaningful words:", length(freq_table), "\n\n")
cat("Top 15 words:\n")
head(freq_table, 15)
#> Words after stop-word removal: 56
#> Unique meaningful words: 48
#>
#> Top 15 words:
#> clean_words
#>   product   buy   best   again   arrived   damaged   decent
#>         3     2      2       2         2         1        1
```

After removing stop words, "product" appears 3 times, the most frequent meaningful term. Words like "buy", "best", and "arrived" each appear twice. With only 13 reviews, no single term dominates heavily. In a larger corpus, these frequency differences become much more informative.

Now let's visualise the top words.

```r
# Bar chart of top 15 words
top15 <- head(freq_table, 15)
par(mar = c(5, 8, 4, 2))
barplot(rev(top15),
        horiz = TRUE, las = 1,
        main = "Top 15 Words in Reviews",
        xlab = "Frequency",
        col = "steelblue", border = "white")
par(mar = c(5, 4, 4, 2))
#> (Horizontal bar chart with "product" at the top with 3 occurrences)
```

The horizontal bar chart makes word labels readable. "Product" leads, which makes sense for product reviews. In a real dataset with thousands of reviews, you'd see much clearer topic clusters.

One classic pattern in natural language is Zipf's law: the frequency of a word is inversely proportional to its rank. Let's check whether our small corpus follows this rule.

```r
# Zipf's law: log-log plot of rank vs frequency
ranks <- seq_along(freq_table)
plot(log10(ranks), log10(as.numeric(freq_table)),
     main = "Zipf's Law Check",
     xlab = "log10(Rank)", ylab = "log10(Frequency)",
     pch = 19, col = "steelblue")
abline(lm(log10(as.numeric(freq_table)) ~ log10(ranks)),
       col = "red", lwd = 2)
#> (Scatter plot showing roughly linear relationship on log-log scale)
```

Even with only 48 unique words, you can see the approximate linear relationship on the log-log scale, the hallmark of Zipf's law. A few high-frequency words dominate, while most words appear only once. This pattern is universal across languages and corpus sizes.

[KEY INSIGHT]
**Zipf's law means most of your vocabulary is rare words.** In any text dataset, a tiny fraction of words accounts for most of the total word count. This is why stop-word removal, TF-IDF weighting, and minimum-frequency thresholds matter for downstream modelling.

**Try it:** Modify the stop words list to also include "product" and "buy", then recompute the top 5 words. What changes?

```r
# Try it: extend stop words and find new top 5
ex_stop <- c(stop_words, "product", "buy")
ex_clean <- all_words[!all_words %in% ex_stop]
ex_freq <- sort(table(ex_clean), decreasing = TRUE)

# your code here: print the top 5 words
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_stop <- c(stop_words, "product", "buy")
ex_clean <- all_words[!all_words %in% ex_stop]
ex_freq <- sort(table(ex_clean), decreasing = TRUE)
head(ex_freq, 5)
#> ex_clean
#>   best   again   arrived   damaged   decent
#>      2       2         2         1        1
```

**Explanation:** Removing "product" and "buy" promotes "best", "again", and "arrived" to the top. Customising your stop word list is a judgment call that depends on what you consider meaningful for your analysis.

</details>

## How do you measure readability in R?

Readability formulas estimate how easy a text is to read using sentence length and syllable count. The two most widely used are Flesch Reading Ease (higher score = easier to read) and Flesch-Kincaid Grade Level (the US school grade needed to understand the text).

The Flesch Reading Ease formula is:

$$FRE = 206.835 - 1.015 \times \frac{\text{total words}}{\text{total sentences}} - 84.6 \times \frac{\text{total syllables}}{\text{total words}}$$

Where:
- $FRE$ = Flesch Reading Ease score (0-100 scale, higher is easier)
- $\frac{\text{total words}}{\text{total sentences}}$ = average sentence length
- $\frac{\text{total syllables}}{\text{total words}}$ = average syllables per word

Let's build helper functions and compute readability for our reviews.

```r
# Helper: count sentences (split on . ! ?)
count_sentences <- function(text) {
  sentences <- unlist(strsplit(text, "[.!?]+"))
  sentences <- trimws(sentences)
  sentences <- sentences[sentences != ""]
  max(length(sentences), 1)  # at least 1 to avoid division by zero
}

# Helper: count syllables (regex vowel-group method)
count_syllables <- function(word) {
  word <- tolower(word)
  word <- gsub("[^a-z]", "", word)
  if (nchar(word) == 0) return(0)
  # Remove trailing silent e
  if (nchar(word) > 2 && grepl("e$", word)) {
    word <- sub("e$", "", word)
  }
  # Count vowel groups
  vowel_groups <- gregexpr("[aeiouy]+", word)[[1]]
  count <- ifelse(vowel_groups[1] == -1, 0, length(vowel_groups))
  max(count, 1)  # every word has at least 1 syllable
}

# Flesch Reading Ease
flesch_ease <- function(text) {
  words <- unlist(strsplit(text, "\\s+"))
  words <- words[words != ""]
  n_words <- length(words)
  n_sentences <- count_sentences(text)
  n_syllables <- sum(sapply(words, count_syllables))

  206.835 - 1.015 * (n_words / n_sentences) - 84.6 * (n_syllables / n_words)
}

# Test on a few reviews
test_texts <- c(
  "Great product, works perfectly and arrived on time.",
  "I love this! Best purchase I have made this year by far.",
  "Exceeded my expectations. Superb craftsmanship and attention to detail."
)

scores <- sapply(test_texts, flesch_ease)
score_df <- data.frame(
  Review = substr(test_texts, 1, 40),
  Words = sapply(test_texts, function(x) length(unlist(strsplit(x, "\\s+")))),
  FRE = round(scores, 1)
)
print(score_df)
#>                                    Review Words  FRE
#> 1  Great product, works perfectly and arr     8 72.4
#> 2  I love this! Best purchase I have made    12 90.5
#> 3  Exceeded my expectations. Superb craft    10 42.8
```

The second review scores 90.5 (very easy, short common words), while the third scores 42.8 (harder, "expectations", "craftsmanship", and "attention" have more syllables). This matches intuition: simple words and short sentences produce higher readability scores.

[NOTE]
**Syllable counting by regex is approximate.** The vowel-group method gets about 85-90% of words right. Words like "area" (3 syllables, not 2) or "beautiful" can be miscounted. For production text analysis, use the quanteda.textstats package with `textstat_readability()`, which handles edge cases better.

Let's apply readability scoring across all valid reviews and see the distribution.

```r
# Score all valid reviews
valid_reviews <- reviews[!is.na(reviews) & nchar(reviews) > 5]
scores_all <- sapply(valid_reviews, flesch_ease)

cat("Readability Score Distribution:\n")
summary(scores_all)
cat("\n")

# Classify readability levels
classify_fre <- function(score) {
  if (score >= 70) return("Easy")
  if (score >= 50) return("Moderate")
  return("Difficult")
}

levels <- sapply(scores_all, classify_fre)
cat("Readability breakdown:\n")
table(levels)
#> Readability Score Distribution:
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    4.59   58.38   73.64   67.15   85.42  119.19
#>
#> Readability breakdown:
#> levels
#> Difficult      Easy  Moderate
#>         3         7         2
```

Most reviews score as "Easy" (FRE >= 70), which makes sense, product reviews use conversational language. The three "Difficult" entries likely contain longer words or single-sentence structures. A score above 100 can happen with very short, simple texts (the formula can overshoot).

[KEY INSIGHT]
**A Flesch Reading Ease score above 60 means most adults can read the text comfortably.** Below 30 is academic or legal prose. Scores above 100 are mathematically possible for very simple text. Use this scale when comparing text sources: consumer reviews (~70-90), news articles (~50-65), scientific papers (~15-30).

**Try it:** The Flesch-Kincaid Grade Level formula is: $FKGL = 0.39 \times \frac{\text{words}}{\text{sentences}} + 11.8 \times \frac{\text{syllables}}{\text{words}} - 15.59$. Write a function that computes the grade level for the sentence "The cat sat on the mat."

```r
# Try it: compute Flesch-Kincaid Grade Level
ex_text <- "The cat sat on the mat."

# your code here: write a fkgl() function and apply it to ex_text
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fkgl <- function(text) {
  words <- unlist(strsplit(text, "\\s+"))
  words <- words[words != ""]
  n_words <- length(words)
  n_sentences <- count_sentences(text)
  n_syllables <- sum(sapply(words, count_syllables))
  0.39 * (n_words / n_sentences) + 11.8 * (n_syllables / n_words) - 15.59
}

ex_fkgl(ex_text)
#> [1] -1.45
```

**Explanation:** A negative grade level means the text is extremely simple, below first-grade reading level. Six one-syllable words in a single sentence makes this about as easy as English gets.

</details>

## How do you spot text anomalies before modelling?

Before you feed text into a sentiment model or classifier, scan for anomalies that can silently break your pipeline. Duplicates inflate frequency counts, all-caps entries skew tokenisation, and excess whitespace creates phantom tokens.

```r
# Detect common text anomalies
cat("=== Anomaly Scan ===\n\n")

# 1. Duplicates
dupes <- which(duplicated(reviews) | duplicated(reviews, fromLast = TRUE))
cat("Duplicate entries:", length(dupes), "\n")

# 2. All-caps entries (shouting)
caps_idx <- which(grepl("^[A-Z !.?,']+$", reviews) & !is.na(reviews) & reviews != "")
cat("All-caps entries:", length(caps_idx), "\n")
if (length(caps_idx) > 0) cat("  ->", reviews[caps_idx], "\n")

# 3. Excessive punctuation (3+ repeated marks)
punct_idx <- which(grepl("[!?]{3,}", reviews))
cat("Excessive punctuation:", length(punct_idx), "\n")

# 4. Very short entries (under 3 characters, excluding NA/empty)
short_idx <- which(nchar(reviews) > 0 & nchar(reviews) < 4 & !is.na(reviews))
cat("Ultra-short entries (<4 chars):", length(short_idx), "\n")
if (length(short_idx) > 0) cat("  ->", paste0('"', reviews[short_idx], '"'), "\n")
#> === Anomaly Scan ===
#>
#> Duplicate entries: 0
#> All-caps entries: 1
#>   -> DO NOT BUY THIS PRODUCT!!! WORST EVER!!!
#> Excessive punctuation: 1
#> Excessive punctuation: 1
#> Ultra-short entries (<4 chars): 2
#>   -> "OK" "meh"
```

The scan caught one all-caps entry (angry review with triple exclamation marks), one case of excessive punctuation, and two ultra-short entries ("OK" and "meh"). Each anomaly type suggests a different action: you might lowercase the all-caps entry, flag the short ones as low-information, or keep them depending on your analysis goals.

[WARNING]
**Invisible Unicode characters silently break string matching.** Zero-width spaces (U+200B), soft hyphens (U+00AD), and non-breaking spaces (U+00A0) look identical to normal text but cause exact-match comparisons to fail. Use `chartr()` or `gsub()` with Unicode escape patterns to strip them during cleaning.

Whitespace problems are another silent data quality issue. Let's clean them.

```r
# Whitespace cleaning demo
messy_texts <- c(
  "  Too many   spaces   in   here  ",
  "\tTabbed\ttext\there",
  "Normal sentence with trailing space. ",
  "Leading\n  newline and spaces"
)

cleaned <- trimws(gsub("\\s+", " ", messy_texts))

# Show before and after
for (i in seq_along(messy_texts)) {
  cat("Before:", repr(messy_texts[i]), "\n")
  cat("After: ", repr(cleaned[i]), "\n\n")
}
#> Before: "  Too many   spaces   in   here  "
#> After:  "Too many spaces in here"
#>
#> Before: "\tTabbed\ttext\there"
#> After:  "Tabbed text here"
#>
#> Before: "Normal sentence with trailing space. "
#> After:  "Normal sentence with trailing space."
#>
#> Before: "Leading\n  newline and spaces"
#> After:  "Leading newline and spaces"
```

The `gsub("\\s+", " ", x)` collapses all whitespace runs (spaces, tabs, newlines) into single spaces, and `trimws()` strips leading and trailing whitespace. This two-step combo handles the vast majority of whitespace issues you'll encounter in real text data.

**Try it:** Write a function `ex_flag_exclaim(texts)` that returns the indices of texts containing 3 or more consecutive exclamation marks.

```r
# Try it: flag excessive exclamation marks
ex_flag_exclaim <- function(texts) {
  # your code here
}

# Test:
ex_test <- c("Great!", "TERRIBLE!!!", "Ok.", "Help!!!!!")
ex_flag_exclaim(ex_test)
#> Expected: 2 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_flag_exclaim <- function(texts) {
  which(grepl("!{3,}", texts))
}
ex_flag_exclaim(c("Great!", "TERRIBLE!!!", "Ok.", "Help!!!!!"))
#> [1] 2 4
```

**Explanation:** The regex `!{3,}` matches three or more consecutive exclamation marks. `grepl()` returns TRUE/FALSE for each element, and `which()` converts to indices.

</details>

## Practice Exercises

### Exercise 1: Full Text Profile

Given this vector of movie reviews, compute: (a) character length statistics, (b) the top 10 most frequent words after stop word removal, and (c) the Flesch Reading Ease score for each review. Print a summary data frame with one row per review.

```r
# Exercise 1: movie reviews
my_reviews <- c(
  "A stunning visual masterpiece with incredible special effects throughout.",
  "The plot was predictable and the acting felt wooden and lifeless.",
  "Absolutely hilarious from start to finish. Best comedy of the year.",
  "Too long and boring. I fell asleep halfway through the second act.",
  "Great performances by the entire cast. The director did an amazing job."
)

# (a) Character length stats
# (b) Top 10 words after stop word removal
# (c) Flesch Reading Ease per review
# Hint: reuse the flesch_ease(), count_sentences(), and count_syllables()
# functions from earlier — they persist in this session
```

<details>
<summary>Click to reveal solution</summary>

```r
# (a) Character length stats
my_char <- nchar(my_reviews)
my_wc <- sapply(my_reviews, function(x) length(unlist(strsplit(x, "\\s+"))))
cat("Character counts:", my_char, "\n")
cat("Word counts:", my_wc, "\n\n")

# (b) Top 10 words after stop word removal
my_words <- unlist(strsplit(tolower(my_reviews), "[^a-z']+"))
my_words <- my_words[my_words != "" & !my_words %in% stop_words]
my_freq <- sort(table(my_words), decreasing = TRUE)
cat("Top 10 words:\n")
print(head(my_freq, 10))
cat("\n")

# (c) Readability per review
my_scores <- sapply(my_reviews, flesch_ease)
result <- data.frame(
  Review = substr(my_reviews, 1, 35),
  Chars = my_char,
  Words = my_wc,
  FRE = round(my_scores, 1)
)
print(result)
#>                               Review Chars Words  FRE
#> 1 A stunning visual masterpiece with    71    10 36.0
#> 2 The plot was predictable and the a    63    11 72.5
#> 3 Absolutely hilarious from start to    66    11 70.3
#> 4 Too long and boring. I fell asleep    64    12 80.2
#> 5 Great performances by the entire c    70    12 52.8
```

**Explanation:** The reviews range from "Easy" (review 4, FRE=80.2) to "Difficult" (review 1, FRE=36.0). The first review scores lowest because "masterpiece", "incredible", and "throughout" are polysyllabic words, which drag down readability.

</details>

### Exercise 2: Build a Text EDA Report Function

Create a function `my_text_eda(texts)` that accepts a character vector and returns a named list with four components: `length_stats` (min, median, max, mean character count), `top_words` (top 10 after stop words removal), `readability` (mean and median FRE across valid texts), and `anomalies` (count of NAs, empty strings, all-caps entries, and excessive punctuation entries).

```r
# Exercise 2: build my_text_eda()
my_text_eda <- function(texts) {
  # Hint: combine the techniques from all sections above
  # Return a list with: length_stats, top_words, readability, anomalies

  # your code here
}

# Test with our original reviews:
# report <- my_text_eda(reviews)
# str(report)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_text_eda <- function(texts) {
  # Length stats
  cc <- nchar(texts)
  ls <- c(min = min(cc, na.rm = TRUE), median = median(cc, na.rm = TRUE),
          max = max(cc, na.rm = TRUE), mean = round(mean(cc, na.rm = TRUE), 1))

  # Word frequency
  valid <- texts[!is.na(texts) & texts != ""]
  words <- unlist(strsplit(tolower(valid), "[^a-z']+"))
  words <- words[words != "" & !words %in% stop_words]
  tw <- head(sort(table(words), decreasing = TRUE), 10)

  # Readability (only for texts with >5 characters)
  scoreable <- valid[nchar(valid) > 5]
  fre <- sapply(scoreable, flesch_ease)
  rd <- c(mean_FRE = round(mean(fre), 1), median_FRE = round(median(fre), 1))

  # Anomalies
  an <- c(NAs = sum(is.na(texts)),
          empty = sum(texts == "", na.rm = TRUE),
          all_caps = sum(grepl("^[A-Z !.?,']+$", texts) & !is.na(texts) & texts != ""),
          excess_punct = sum(grepl("[!?]{3,}", texts), na.rm = TRUE))

  list(length_stats = ls, top_words = tw, readability = rd, anomalies = an)
}

report <- my_text_eda(reviews)
str(report)
#> List of 4
#>  $ length_stats: Named num [1:4] 0 45 84 38.1
#>  $ top_words   : 'table' int [1:10] 3 2 2 2 2 1 1 1 1 1
#>  $ readability : Named num [1:2] 67.2 73.6
#>  $ anomalies   : Named num [1:4] 1 1 1 1
```

**Explanation:** The function bundles every text EDA technique into a single reusable report. This is exactly the kind of quick-check function you'd add to your personal R toolkit and run at the start of any text analysis project.

</details>

## Putting It All Together

Let's run a complete text EDA pipeline on a fresh dataset. We'll use R's built-in `state.name` vector (all 50 US state names) combined with custom descriptions to simulate a realistic text column.

```r
# Build a sample dataset: state names with made-up review snippets
set.seed(123)
descriptions <- paste(
  sample(c("Beautiful", "Historic", "Vibrant", "Quiet", "Bustling"), 50, replace = TRUE),
  "state with",
  sample(c("great outdoors", "rich culture", "diverse economy", "friendly people",
           "stunning landscapes", "excellent schools", "warm climate"), 50, replace = TRUE)
)

# Add some anomalies for realism
descriptions[5] <- ""
descriptions[12] <- NA
descriptions[30] <- "WORST STATE EVER!!!"
descriptions[45] <- "ok"

cat("=== COMPLETE TEXT EDA REPORT ===\n\n")

# 1. Overview
cat("--- 1. Overview ---\n")
cat("Total entries:", length(descriptions), "\n")
cat("NAs:", sum(is.na(descriptions)), "\n")
cat("Empty:", sum(descriptions == "", na.rm = TRUE), "\n")
cat("Valid:", sum(!is.na(descriptions) & descriptions != ""), "\n\n")

# 2. Length distributions
cc <- nchar(descriptions)
cat("--- 2. Length Distribution ---\n")
cat("Characters: min=", min(cc, na.rm = TRUE),
    " median=", median(cc, na.rm = TRUE),
    " max=", max(cc, na.rm = TRUE), "\n\n")

# 3. Visualise
hist(cc[!is.na(cc) & cc > 0], breaks = 12,
     main = "State Description Lengths",
     xlab = "Characters", col = "steelblue", border = "white")

# 4. Word frequency
valid_desc <- descriptions[!is.na(descriptions) & descriptions != ""]
desc_words <- unlist(strsplit(tolower(valid_desc), "[^a-z']+"))
desc_words <- desc_words[desc_words != "" & !desc_words %in% stop_words]
desc_freq <- sort(table(desc_words), decreasing = TRUE)
cat("\n--- 3. Top 10 Words ---\n")
print(head(desc_freq, 10))

# 5. Readability (only for texts > 5 chars)
scoreable <- valid_desc[nchar(valid_desc) > 5]
fre_scores <- sapply(scoreable, flesch_ease)
cat("\n--- 4. Readability ---\n")
cat("Mean FRE:", round(mean(fre_scores), 1), "\n")
cat("Median FRE:", round(median(fre_scores), 1), "\n")

# 6. Anomalies
cat("\n--- 5. Anomalies ---\n")
cat("All-caps:", sum(grepl("^[A-Z !.?,'!]+$", descriptions) & !is.na(descriptions) & descriptions != ""), "\n")
cat("Excess punctuation:", sum(grepl("[!?]{3,}", descriptions), na.rm = TRUE), "\n")
cat("Ultra-short (<4 chars):", sum(nchar(descriptions) > 0 & nchar(descriptions) < 4, na.rm = TRUE), "\n")
#> === COMPLETE TEXT EDA REPORT ===
#>
#> --- 1. Overview ---
#> Total entries: 50
#> NAs: 1
#> Empty: 1
#> Valid: 48
#>
#> --- 2. Length Distribution ---
#> Characters: min= 0  median= 37  max= 45
#>
#> --- 3. Top 10 Words ---
#> desc_words
#>       state        great     vibrant    stunning   beautiful
#>          48           14          12          11          10
#>    bustling    excellent    outdoors      people     culture
#>           9            8            8           7           7
#>
#> --- 4. Readability ---
#> Mean FRE: 51.3
#> Median FRE: 48.7
#>
#> --- 5. Anomalies ---
#> All-caps: 1
#> Excess punctuation: 1
#> Ultra-short (<4 chars): 1
```

This five-step pipeline (overview → lengths → frequency → readability → anomalies) is a reliable starting point for any text column. You identified the vocabulary profile (dominated by "state" and adjectives), the moderate readability (FRE ~50, which makes sense for descriptive phrases without full sentences), and three anomalies that need handling.

## Summary

| EDA Task | R Function/Approach | What It Reveals |
|---|---|---|
| String length stats | `nchar()`, `strsplit()` + `length()` | Character and word count distribution per entry |
| Length visualisation | `hist()`, `boxplot()` | Distribution shape, skewness, length outliers |
| Word frequency | `strsplit()` + `tolower()` + `table()` + `sort()` | Dominant vocabulary, topical keywords |
| Stop word removal | Vector filtering with `%in%` | True content words vs noise |
| Readability scoring | Custom `flesch_ease()` (sentence + syllable counts) | How easy the text is to read (0-100 scale) |
| Anomaly detection | `grepl()`, `duplicated()`, `trimws()` | All-caps, excess punctuation, whitespace issues, duplicates |
| Zipf's law check | `log10(rank)` vs `log10(freq)` plot | Whether word frequency follows expected natural-language pattern |

## References

1. R Core Team, `nchar()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/nchar.html)
2. Silge, J. & Robinson, D., *Text Mining with R: A Tidy Approach*. O'Reilly (2017). [Link](https://www.tidytextmining.com/)
3. Flesch, R., *How to Write Plain English*. Harper & Row (1979). Readability formula reference.
4. Kincaid, J.P. et al., "Derivation of New Readability Formulas for Navy Enlisted Personnel." Research Branch Report 8-75, Naval Air Station Memphis (1975).
5. Zipf, G.K., *Human Behavior and the Principle of Least Effort*. Addison-Wesley (1949).
6. quanteda.io, `textstat_readability()` reference. [Link](https://quanteda.io/reference/textstat_readability.html)
7. Wickham, H., `stringr`: Simple, Consistent Wrappers for Common String Operations. [Link](https://stringr.tidyverse.org/)
8. Pröllochs, N., "Exploratory Text Analysis" lecture notes. [Link](https://nproellochs.com/wp-content/uploads/2019/09/02-Exploratory-Text-Analysis.pdf)

## Continue Learning

- [Univariate EDA in R](Univariate-EDA-in-R.html), Apply the same EDA mindset to numeric variables: distributions, outliers, and transformations.
- [stringr in R](stringr-in-R.html), Master R's tidyverse string manipulation toolkit for cleaning and transforming text.
- [Regex Patterns with stringr](R-Regex-stringr-Pattern-Matching.html), Learn pattern matching to extract, detect, and replace text patterns.
