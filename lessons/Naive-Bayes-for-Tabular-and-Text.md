---
title: "Classification Lesson 2: Naive Bayes for Tabular and Text"
catalog_blurb: "How Bayes' rule classifies email and tabular data, and why naive works."
description: "Learn Naive Bayes from scratch in R: Bayes' rule for classification, the naive independence assumption, Laplace smoothing, log-space scoring, and Gaussian NB."
keywords: "naive bayes, naive bayes classifier, bayes rule, conditional independence, laplace smoothing, spam filter, text classification, gaussian naive bayes, e1071 naiveBayes, R"
post_type: "LESSON"
curriculum_id: "6.30.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "2"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: "Discriminant-Analysis-LDA-and-QDA.html"
course_prev: "kNN-and-the-Curse-of-Dimensionality.html"
---

=== step === cover
::eyebrow Lesson 2 of 6
## Naive Bayes for Tabular and Text

Lesson 1 classified by distance: to label a new point, look at who it sits next to. That instinct drowned once we piled on features, because in high dimensions everything is roughly equidistant. This lesson takes the opposite route. Instead of measuring distance, it reasons with probability, and it shrugs off the very high-dimensional data that sank kNN.

Picture the spam filter guarding your inbox. A new email arrives: **"free money, claim now"**. The filter has read thousands of past emails, each already stamped **spam** or **real** (in the jargon, real mail is called **ham**). From those labels alone it computes: given these exact words, how likely is spam versus ham, and files the message under whichever wins. That filter is Naive Bayes, and by the end of this lesson you will have built one from scratch, twice: once on the words of an email, once on numeric features in a table.

By the end you will be able to:

- Use **Bayes' rule** to turn a base rate and some evidence into the probability that an email is spam
- Apply the **naive** independence assumption, add **Laplace smoothing**, and classify in **log space**, all in plain R
- Fit **Gaussian Naive Bayes** on numeric features, and explain why an assumption this crude still works so well

**Prerequisites:** you can run R and read its output, you know what a training set and a classifier are (the ML Workflow course), and Lesson 1 (kNN). Basic probability is enough; conditional probability is defined the moment it appears.

::widget process-flow {"steps":[{"title":"Start with the base rate","sub":"how common is each class before we read a single word"},{"title":"Weigh every clue","sub":"fold in how spammy or hammy each word is"},{"title":"Pick the winner","sub":"the class with the highest combined score wins"}]}

Those three moves are the whole method. The rest of this lesson is where each number comes from.

=== step === concept
::eyebrow The core idea
## Bayes' rule flips the question

The question we want answered is awkward: **given these words, what is the probability the email is spam?** We have no direct way to know that. But we can easily measure the reverse from labeled history: **among known spam, how often do these words show up?** Bayes' rule is the bridge that flips one into the other.

First, one piece of notation. \(P(A \mid B)\) is read "the probability of \(A\) **given** \(B\)", meaning the probability that \(A\) is true once we already know \(B\) is true. So \(P(\text{spam} \mid \text{"free"})\) is the chance an email is spam given that it contains the word "free". Bayes' rule says:

\[ P(y = k \mid x) = \frac{P(y = k)\,P(x \mid y = k)}{P(x)} \]

Read it left to right. \(y\) is the label and \(k\) is one class (spam or ham); \(x\) is the evidence (the words). The three named pieces:

- \(P(y = k)\) is the **prior**: how common class \(k\) is before we look at the email at all (the base rate).
- \(P(x \mid y = k)\) is the **likelihood**: how typical this evidence is for class \(k\).
- \(P(y = k \mid x)\) is the **posterior**: what we actually want, the probability of the class after seeing the evidence.

Let us make it concrete with one word. Suppose that of the last 100 emails, 40 were spam, the word "free" appeared in 30 of those 40 spam emails, and in just 6 of the 60 real ones. What is the probability an email is spam **given** it says "free"?

```r
# Priors: 40 of the last 100 emails were spam.
p_spam <- 0.40
p_ham  <- 0.60

# Likelihoods: how often "free" shows up in each class.
p_free_spam <- 30 / 40      # 0.75
p_free_ham  <-  6 / 60      # 0.10

# Bayes' rule. The numerator for each class is prior * likelihood;
# the denominator P("free") is just the two numerators added up.
num_spam <- p_spam * p_free_spam
num_ham  <- p_ham  * p_free_ham
c(num_spam = num_spam, num_ham = num_ham)
#> num_spam  num_ham
#>     0.30     0.06

p_spam_given_free <- num_spam / (num_spam + num_ham)
round(p_spam_given_free, 3)
#> [1] 0.833
```

One word swings the odds from a 40% base rate to **83%** spam. Notice the denominator \(P(x)\) is the same for every class (it is just the two numerators summed), so it never changes which class is larger. For the decision we can drop it entirely and compare only the numerators:

\[ P(y = k \mid x) \;\propto\; P(y = k)\,P(x \mid y = k) \]

The symbol \(\propto\) means "proportional to". The rule for classifying is now one sentence: **compute prior times likelihood for each class, and pick the bigger one.**

[KEY INSIGHT]
Bayes' rule lets us answer a question we cannot measure directly (is this spam, given the words?) using two things we can count from labeled history (how common spam is, and how typical these words are for spam).

=== step === quiz
::eyebrow Check yourself
## Which piece is which?

In the calculation above, the number **0.75** came from "free appears in 30 of the 40 spam emails". In Bayes' rule, which piece is that, and what role does it play?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It is the prior: how common spam is before reading the email ::no The prior is the base rate, 0.40 here (40 of 100 emails were spam). 0.75 is measured only after conditioning on the word "free", so it is not the prior.
- It is the likelihood P("free" given spam): how typical the evidence is for the spam class ::ok Right. It reads "given spam, how often does free appear", which is exactly the likelihood P(evidence given class). Bayes' rule multiplies it by the prior to get the posterior.
- It is the posterior: the probability the email is spam given that it says "free" ::no The posterior is what we solved FOR, 0.833. 0.75 is an ingredient (the likelihood), not the answer. Mixing up the likelihood P(word given class) with the posterior P(class given word) is the single most common Bayes mistake.

=== step === concept
::eyebrow The naive shortcut
## Why "naive": one assumption, one product

A real email is not one word, it is many. Our arriving message "free money claim now" is four clues at once, so the likelihood we need is the **joint** probability of all of them together given a class:

\[ P(\text{free},\, \text{money},\, \text{claim},\, \text{now} \mid \text{spam}) \]

Estimating that joint probability honestly is hopeless. To count how often those four exact words co-occur, we would need spam emails containing that precise combination, and for a vocabulary of thousands of words and emails many words long, the number of possible combinations explodes far past any inbox we could ever collect. We would almost always be dividing by zero.

Naive Bayes makes one bold, deliberately simple assumption to escape this: **given the class, the features are independent of one another.** In words, once we know an email is spam, seeing "free" tells us nothing extra about whether "money" also appears. That lets the joint probability break apart into a plain product of one-word likelihoods:

\[ P(x_1, \dots, x_p \mid y = k) \;\approx\; \prod_{j=1}^{p} P(x_j \mid y = k) \]

where \(x_1, \dots, x_p\) are the \(p\) features (here, the words) and \(\prod\) means "multiply these together". Each factor \(P(x_j \mid y = k)\) is a single-word likelihood we can actually count.

[NOTE]
The assumption is called **naive** because it is usually false: in real spam, "free" and "money" travel together, they are not independent at all. We assume it anyway, purely because it turns an impossible joint probability into an easy product. The last step of this lesson explains why such a crude assumption still classifies email so well.

=== step === concept
::eyebrow From history to numbers
## Count the clues per class

Time to build the real thing. Each lesson runs in a fresh R session, so we create a tiny labeled inbox inline: three spam emails and three real ones, each just a short string.

```r
train <- data.frame(
  text  = c("free money claim now",
            "free claim your prize",
            "cheap meds free shipping",
            "team lunch tomorrow",
            "project meeting friday",
            "reschedule our lunch"),
  label = c("spam", "spam", "spam", "ham", "ham", "ham"),
  stringsAsFactors = FALSE
)
train
#>                       text label
#> 1     free money claim now  spam
#> 2    free claim your prize  spam
#> 3 cheap meds free shipping  spam
#> 4      team lunch tomorrow   ham
#> 5   project meeting friday   ham
#> 6     reschedule our lunch   ham
```

To use words as features we split each email into lowercase tokens (a **bag of words**: we care which words appear, not their order), then collect every distinct word into a **vocabulary**.

```r
tokens <- function(s) unlist(strsplit(tolower(s), " "))
vocab  <- sort(unique(unlist(lapply(train$text, tokens))))
length(vocab)
#> [1] 17
```

Now the raw material of the classifier: how many times each vocabulary word appears in the spam emails, and in the ham emails.

```r
word_counts <- function(texts) {
  toks <- unlist(lapply(texts, tokens))
  as.integer(table(factor(toks, levels = vocab)))
}
spam_counts <- word_counts(train$text[train$label == "spam"])
ham_counts  <- word_counts(train$text[train$label == "ham"])
data.frame(word = vocab, spam = spam_counts, ham = ham_counts)
#>          word spam ham
#> 1       cheap    1   0
#> 2       claim    2   0
#> 3        free    3   0
#> 4      friday    0   1
#> 5       lunch    0   2
#> 6        meds    1   0
#> 7     meeting    0   1
#> 8       money    1   0
#> 9         now    1   0
#> 10        our    0   1
#> 11      prize    1   0
#> 12    project    0   1
#> 13 reschedule    0   1
#> 14   shipping    1   0
#> 15       team    0   1
#> 16   tomorrow    0   1
#> 17       your    1   0
```

The table already tells the story: **free** (3 in spam, 0 in ham) and **claim** (2, 0) scream spam, while **lunch** (0, 2) is a marker of ordinary mail. Naive Bayes just turns these counts into probabilities.

=== step === concept
::eyebrow A trap in the counts
## The zero that eats everything

The obvious estimate of a word's likelihood is its share of the words in a class: count the word, divide by the total words in that class.

```r
spam_total <- sum(spam_counts)   # total words across spam emails
ham_total  <- sum(ham_counts)
c(spam_total = spam_total, ham_total = ham_total)
#> spam_total  ham_total
#>         12          9

# "free" appears 3 times out of 12 spam words:
spam_counts[match("free", vocab)] / spam_total
#> [1] 0.25

# but "lunch" never appears in a spam email at all:
spam_counts[match("lunch", vocab)] / spam_total
#> [1] 0
```

There is the landmine. \(P(\text{lunch} \mid \text{spam}) = 0\) because "lunch" happened not to appear in our three spam examples. But recall the naive likelihood is a **product**. A single zero factor drags the entire product to zero, so any email containing "lunch" would be judged **impossible** as spam, no matter how many blatant spam words sit beside it. One unseen word should not carry a veto.

The standard fix is **Laplace smoothing** (also called add-one smoothing): pretend every vocabulary word was seen one extra time in each class. Nothing is ever exactly zero, just very small:

\[ \hat{P}(w \mid k) = \frac{\text{count}(w, k) + 1}{N_k + V} \]

where \(\text{count}(w, k)\) is how often word \(w\) appears in class \(k\), \(N_k\) is the total words in class \(k\), and \(V\) is the vocabulary size. We add 1 on top and \(V\) on the bottom (one for each vocabulary word we nudged) so the probabilities still sum to 1.

```r
V <- length(vocab)                              # 17 distinct words
p_word_spam <- (spam_counts + 1) / (spam_total + V)
p_word_ham  <- (ham_counts  + 1) / (ham_total  + V)

# "lunch" is no longer impossible in spam, just unlikely:
round(p_word_spam[match("lunch", vocab)], 3)
#> [1] 0.034
# and "free" stays clearly spammy:
round(p_word_spam[match("free", vocab)], 3)
#> [1] 0.138
```

[WARNING]
Never skip smoothing on a product-of-probabilities model. Without it, the first word a class has never seen sets that class's whole score to zero, and no amount of other evidence can recover it. This is not a rare edge case: new emails contain unseen words constantly.

=== step === tryit
::eyebrow Your turn
## Add the one

Laplace smoothing adds a fixed number to every word count so nothing is ever impossible. The vocabulary, counts, and totals already exist from the steps above. Fill in the number Laplace smoothing adds to each count.

```r
V <- length(vocab)                                 # 17 distinct words
p_word_spam <- (spam_counts + ____) / (spam_total + V)
round(p_word_spam[match("free", vocab)], 3)        # target: 0.138
```
::check {"regex":"spam_counts\\s*\\+\\s*1","gate":true,"difficulty":"beginner","ok":"Exactly. Add-one smoothing lifts every count by 1, so P(free given spam) = (3+1)/(12+17) = 0.138, and a word with count 0 lands at 1/29 = 0.034 instead of a fatal zero.","no":"Laplace (add-one) smoothing adds exactly 1 to each count: (spam_counts + 1) / (spam_total + V). The 1 is what rescues words a class has never seen."}
::solution
```r
V <- length(vocab)
p_word_spam <- (spam_counts + 1) / (spam_total + V)
round(p_word_spam[match("free", vocab)], 3)
#> [1] 0.138
```

=== step === quiz
::eyebrow Check yourself
## What does smoothing fix?

A teammate removed Laplace smoothing "to keep the code simple", and now the filter labels many obvious spam emails as ham. What is the mechanism behind the failure?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Any word in the new email that never appeared in the spam training set gives P(word given spam) = 0, which zeroes the entire spam product and rules spam out regardless of the other words ::ok Right. The likelihood is a product, so one zero factor kills the whole class score. Real emails routinely contain a word the spam examples never had, so without smoothing the spam score collapses to zero constantly.
- Without smoothing the prior is ignored, so every email defaults to the more common class ::no Smoothing only touches the word likelihoods, not the prior. The prior is still multiplied in either way; the failure is the zero-valued likelihood factor, not a missing prior.
- Smoothing normally deletes rare words, and without it those rare words dominate the score ::no Smoothing deletes nothing; it lifts every count by one so no probability is zero. Rare words are handled, not dropped. The real problem is unseen words forcing an exact zero.

=== step === concept
::eyebrow Making the decision
## Multiply, but in log space

We can now score the arriving email. For each class, multiply the prior by the smoothed likelihood of every word, then pick the winner. But there is a numerical snag: multiplying many probabilities, each well below 1, produces a number so tiny it can underflow to zero on a computer. The standard cure is to work with **logarithms**. Because \(\log(ab) = \log a + \log b\), a product of probabilities becomes a **sum** of their logs, and adding moderate negative numbers never underflows. Comparing sums of logs picks the exact same winner as comparing the raw products.

\[ \text{score}(k) = \log P(y = k) + \sum_{j} \log P(x_j \mid y = k) \]

Our priors here are equal (three spam, three ham), so the words alone decide. We classify by taking the class with the largest score (the **argmax**).

```r
p_spam_prior <- mean(train$label == "spam")   # 0.5
p_ham_prior  <- mean(train$label == "ham")    # 0.5

score <- function(text) {
  w   <- tokens(text)
  w   <- w[w %in% vocab]                       # ignore words we never trained on
  idx <- match(w, vocab)
  logp_spam <- log(p_spam_prior) + sum(log(p_word_spam[idx]))
  logp_ham  <- log(p_ham_prior)  + sum(log(p_word_ham[idx]))
  c(spam = logp_spam, ham = logp_ham)
}

s <- score("free claim lunch")
round(s, 2)
#>  spam   ham
#> -8.31 -9.37
names(which.max(s))
#> [1] "spam"
```

The email "free claim lunch" scores higher for spam (-8.31 beats -9.37), so it is filed as spam: two spammy words (free, claim) outweigh one hammy one (lunch). To turn the two log scores back into probabilities that sum to 1, exponentiate and normalize:

```r
post <- exp(s - max(s))          # subtract the max first for numerical safety
round(post / sum(post), 3)
#> spam  ham
#> 0.742 0.258
```

A clean 74% spam. That is a complete Naive Bayes classifier: count, smooth, sum logs, take the argmax.

=== step === tryit
::eyebrow Your turn
## Call the winner

The `score()` function returns the log score for spam and for ham. Classify one more borderline email, "cheap prize meeting", by picking the class with the higher score. Fill in the function that returns the position of the maximum.

```r
s <- score("cheap prize meeting")
round(s, 2)
names(s)[____(s)]        # which class wins?
```
::check {"regex":"which\\.max","gate":true,"difficulty":"intermediate","ok":"That is the decision rule: which.max returns the index of the larger score, so names(s)[which.max(s)] gives the winning class. Here spam wins -9.41 to -9.77, two spammy words just edging out one hammy one.","no":"You want which.max(s): it returns the position of the largest score, and names(s)[...] turns that position into the class name."}
::solution
```r
s <- score("cheap prize meeting")
round(s, 2)
#>  spam   ham
#> -9.41 -9.77
names(s)[which.max(s)]
#> [1] "spam"
```

=== step === concept
::eyebrow The tabular case
## Numeric features: Gaussian Naive Bayes

Bayes' rule and the naive product do not care whether the features are words. Swap the emails' text for numbers and the exact same machine works. A spam filter also has plenty of numeric clues per email: how many **links** it contains, what **percent of characters are capitalized**, and so on. Spam tends to run high on both.

The only piece that must change is the likelihood \(P(x_j \mid y = k)\). For a word we counted occurrences, but a continuous number like "percent capitals" cannot be counted that way, there are infinitely many possible values. Instead we assume each numeric feature follows a **bell curve** (a Gaussian) within each class, and estimate that curve's center and spread from the training rows of that class. That is all "Gaussian Naive Bayes" means. The boxplot makes the idea visible: for the feature "number of links", the spam and ham classes have clearly different distributions, and a new email's link count is scored against each.

::widget chart-plotter {"data":[{"x":"spam","y":6},{"x":"spam","y":7},{"x":"spam","y":5},{"x":"spam","y":10},{"x":"spam","y":8},{"x":"spam","y":9},{"x":"spam","y":6},{"x":"ham","y":2},{"x":"ham","y":1},{"x":"ham","y":3},{"x":"ham","y":0},{"x":"ham","y":2},{"x":"ham","y":1},{"x":"ham","y":2}],"geoms":["boxplot"],"x":"class","y":"links","code":{"boxplot":"ggplot(emails, aes(class, links)) +\n  geom_boxplot()"}}

The likelihood of a numeric feature value \(x_j\) under class \(k\) is the height of that class's bell curve at \(x_j\):

\[ P(x_j \mid y = k) = \frac{1}{\sqrt{2\pi}\,\sigma_{jk}} \exp\!\left(-\frac{(x_j - \mu_{jk})^2}{2\sigma_{jk}^2}\right) \]

where \(\mu_{jk}\) is the **mean** of feature \(j\) among class-\(k\) training rows and \(\sigma_{jk}\) is its **standard deviation** (its spread). A value near a class's mean scores high for that class; a value far out in the tail scores low. Everything else, priors, the product across features, the argmax, is unchanged from the text case.

=== step === concept
::eyebrow Fitting it
## Gaussian Naive Bayes in R

Let us fit it on real numbers. We simulate a labeled batch of 120 emails (60 spam, 60 ham) with two numeric features: `links` and `caps_pct` (the percent of capital letters). The `set.seed` makes the random draw reproducible, so your numbers match these exactly.

```r
set.seed(1)
n <- 60
emails <- data.frame(
  # pmax(0, ...) keeps counts and percentages from ever going negative
  links    = pmax(0, round(c(rnorm(n, 7, 2), rnorm(n, 1.5, 1.2)))),   # spam ~7 links, ham ~1.5
  caps_pct = pmax(0, round(c(rnorm(n, 22, 6), rnorm(n, 6, 3)), 1)),   # spam ~22% caps, ham ~6%
  label    = factor(rep(c("spam", "ham"), each = n))
)
aggregate(cbind(links, caps_pct) ~ label, data = emails, mean)
#>   label    links  caps_pct
#> 1   ham 1.683333  5.806667
#> 2  spam 7.266667 21.725000
```

The two classes separate cleanly on both features. Now the whole classifier from scratch: for each class, store its prior, and each feature's mean and standard deviation. To predict, score a new email under each class with the Gaussian formula (using `dnorm`, R's built-in normal density) and take the argmax.

```r
classes <- levels(emails$label)
model <- lapply(classes, function(k) {
  rows <- emails[emails$label == k, c("links", "caps_pct")]
  list(prior = mean(emails$label == k),
       mean  = sapply(rows, mean),
       sd    = sapply(rows, sd))
})
names(model) <- classes

predict_nb <- function(model, x) {
  scores <- sapply(names(model), function(k) {
    m <- model[[k]]
    log(m$prior) + sum(dnorm(x, mean = m$mean, sd = m$sd, log = TRUE))
  })
  names(which.max(scores))
}

predict_nb(model, c(links = 8, caps_pct = 25))   # many links, lots of caps
#> [1] "spam"
predict_nb(model, c(links = 1, caps_pct = 4))     # few links, little shouting
#> [1] "ham"
```

Both calls land where common sense says they should. In practice you would reach for a package rather than hand-roll this. The `naiveBayes()` function in **e1071** fits the identical Gaussian model in one line, and scores every training email so we can check the accuracy:

```r
library(e1071)
nb <- naiveBayes(label ~ links + caps_pct, data = emails)
round(mean(predict(nb, emails) == emails$label), 4)   # training accuracy
#> [1] 0.9917
round(nb$tables$links, 2)                     # per-class mean and sd of 'links'
#>       links
#> Y      [,1] [,2]
#>   ham  1.68 1.07
#>   spam 7.27 1.73
```

The library agrees with our from-scratch model: the same per-class means and standard deviations, and 99% of the training emails classified correctly.

=== step === quiz
::eyebrow Check yourself
## Which flavor of Naive Bayes?

You have now seen two versions. One counted word occurrences (multinomial); one fit a bell curve per feature (Gaussian). You are handed a spam dataset where each email is described by two continuous numbers, its length in kilobytes and its percent of capital letters. Which likelihood should each feature use?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Multinomial, because Naive Bayes on spam always uses word counts ::no The multinomial version is for count features (how many times each word occurs). These features are continuous measurements, not counts of vocabulary words, so word-count likelihoods do not apply.
- Either one works identically; the choice of likelihood never matters ::no The choice matters a great deal. The likelihood P(feature given class) must match the feature type, or the probabilities it produces are meaningless. That is the one part of Naive Bayes you tailor to your data.
- Gaussian, because both features are continuous numbers, so each is modeled with a per-class mean and standard deviation ::ok Right. Continuous features call for the Gaussian likelihood: estimate a mean and spread per class and read the bell-curve height. Bayes' rule, the naive product, and the argmax stay exactly the same; only the likelihood swaps.

=== step === concept
::eyebrow The payoff
## Why naive works so well anyway

We built the whole method on an assumption we admitted is false: words in an email are not independent. So why does Naive Bayes routinely rival far fancier classifiers on text and tabular data alike? Two reasons.

**First, classification only needs the argmax to be right, not the probabilities.** The naive product does distort the actual probability values, often pushing them absurdly close to 0 or 1, because correlated features get double-counted as if they were separate evidence. But we never use those probabilities; we only ask **which class scored higher**. As long as the true class comes out on top, the exact scores can be badly miscalibrated and the classification is still correct. This is a proven result: under zero-one loss (right or wrong, with no partial credit) Naive Bayes is optimal far more often than its shaky assumption suggests.

\[ \hat{y} = \arg\max_{k}\; \Big[\log P(y = k) + \sum_{j} \log P(x_j \mid y = k)\Big] \]

**Second, the assumption buys enormous stability.** Because features are treated independently, the model estimates only a handful of numbers per feature per class (a count, or a mean and a standard deviation) instead of the vast web of interactions a richer model chases. Few parameters means low variance: Naive Bayes learns from very little data and, crucially, does not fall apart as the number of features grows. This is the exact opposite of kNN from Lesson 1, whose neighborhoods dissolved in high dimensions. Naive Bayes was the workhorse of early spam filters precisely because text has thousands of features and it handles them effortlessly. In the bias-variance language of the ML Workflow course, it is a high-bias, low-variance model: it gives up some flexibility for a lot of robustness.

It sits at one end of a family you will meet across this course:

| Method | Features may correlate? | What it estimates |
|---|---|---|
| Gaussian Naive Bayes | No (assumed independent) | a mean and sd per feature, per class |
| LDA (next lesson) | Yes | one shared full covariance matrix |
| QDA (next lesson) | Yes | a full covariance matrix per class |

[KEY INSIGHT]
Naive Bayes trades a false assumption for speed and stability, and gets away with it because a classifier is graded on its argmax, not on calibrated probabilities. Treat its probability outputs as rankings, not as trustworthy confidences.

The honest limits: because it double-counts correlated evidence, its probabilities are unreliable as confidences, and if you feed it two nearly duplicate features (say, the same signal twice), that evidence is counted twice and can wrongly tip the argmax. When you truly need calibrated probabilities, or when feature correlations carry the signal, the models in the next lessons do better.

=== step === quiz
::eyebrow Check yourself
## The false assumption

Naive Bayes assumes an email's words are independent given its class, which is plainly untrue, yet it classifies spam accurately. Which explanation is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Classification only needs the winning class to be right; the independence assumption skews the probability values but usually not which class scores highest ::ok Exactly. The argmax is what gets used, and it holds up surprisingly well against the distorted probabilities the naive product produces. The scores can be badly miscalibrated while the ranking, and therefore the label, stays correct.
- In practice the words in an email really are independent given the class, so the assumption holds after all ::no They are not independent at all ("free" and "money" co-occur in spam). The assumption is genuinely false; Naive Bayes works despite that, not because the assumption is secretly true.
- Naive Bayes produces well-calibrated probabilities, so its confidence values can be trusted directly ::no The opposite is true. Double-counting correlated words pushes its probabilities toward 0 or 1, so they are poorly calibrated. Its strength is the argmax, not the confidence numbers.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the gentlest rigorous treatment of Naive Bayes alongside the Bayes-rule derivation, with R labs.
- [Manning, Raghavan and Schutze, Introduction to Information Retrieval, ch. 13](https://nlp.stanford.edu/IR-book/) - the canonical account of text classification, the multinomial model, and Laplace smoothing.
- [Domingos and Pazzani (1997), "On the Optimality of the Simple Bayesian Classifier under Zero-One Loss"](https://doi.org/10.1023/A:1007413511361) - the paper that explains why the naive assumption still classifies well.
- [The Elements of Statistical Learning, ch. 6.6 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - Naive Bayes placed in the wider frame of density estimation.
- [e1071 reference manual (CRAN)](https://cran.r-project.org/package=e1071) - the naiveBayes() function you fitted here, with its options.

=== step === complete
## Lesson 2 complete

You built a Naive Bayes classifier from the ground up. You flipped an unanswerable question into a countable one with **Bayes' rule** (posterior proportional to prior times likelihood), tamed the impossible joint likelihood with the **naive** independence assumption (a plain product of per-feature likelihoods), rescued unseen words with **Laplace smoothing**, classified safely in **log space** by taking the argmax, and then swapped the word-count likelihood for a **Gaussian** to handle numeric features in a table, fitting it both by hand and with `e1071` at 99% accuracy. Finally you saw why an assumption this crude still wins: classification needs only the argmax, and the independence bet buys the low variance that lets Naive Bayes thrive on little data and many features.

Next, Lesson 3: Discriminant Analysis, LDA and QDA. It keeps the "which class most likely produced this?" idea but drops the naive pretence, letting features move together, and turns each class into a tilted Gaussian cloud with an explicit boundary drawn between them.
