---
title: "Classification Lesson 2: Naive Bayes for Tabular and Text"
catalog_blurb: "How Bayes' rule classifies email and tabular data, and why naive works."
description: "Learn naive Bayes from scratch in R: Bayes' rule, the naive independence assumption, Laplace smoothing for unseen words, and why it classifies text so well."
keywords: "naive Bayes, Bayes rule, classification, conditional independence, Laplace smoothing, spam filter, Gaussian naive Bayes, e1071, text classification, R"
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

In Lesson 1, kNN classified by measuring distance to its neighbors, and you watched it drown when the features piled up. Naive Bayes takes the opposite route. It never measures distance. It reasons with probabilities, asking a single question: **of the possible classes, which one makes this evidence most likely?**

Picture the spam filter guarding your inbox. A new email arrives: "WIN a FREE prize NOW". Is it spam, or a real message? A naive Bayes filter weighs the words as clues, scores each class, and files the email under whichever score wins. And it thrives on exactly the high-dimensional data, thousands of possible words, that just sank kNN.

By the end of this lesson you will be able to:

- Use Bayes' rule to turn "which class?" into "which class makes these clues most likely?"
- Apply the naive independence assumption to score an email by multiplying per-word probabilities, and fix the zero-frequency trap with smoothing
- Run naive Bayes on numeric, tabular data in one R call, and explain why a wrong assumption still classifies well

**Prerequisites:** you can run R and read its output, you know what a training set and a classifier are (the ML Workflow course), and Lesson 1 (kNN).

::widget process-flow {"steps":[{"title":"Start with the prior","sub":"how common each class is before reading the email"},{"title":"Weigh the evidence","sub":"multiply by how well each clue fits each class"},{"title":"Pick the winner","sub":"the higher score is the prediction"}]}

=== step === concept
::eyebrow The idea
## Bayes' rule: flip the question

We want \(P(\text{spam} \mid \text{words})\): the probability the email is spam **given** the words we can see. That is hard to estimate directly, because we would need to have seen this exact combination of words before. Bayes' rule flips it into two pieces we *can* estimate from training emails:

\[ P(\text{spam} \mid \text{words}) \;\propto\; P(\text{spam}) \times P(\text{words} \mid \text{spam}) \]

Read the three pieces in plain words:

- \(P(\text{spam})\) is the **prior**: how common spam is before we read a single word. If 40% of past email was spam, the prior is 0.4.
- \(P(\text{words} \mid \text{spam})\) is the **likelihood**: if an email *were* spam, how typical are these particular words? Spam says "free" and "prize" a lot, so those push the likelihood up.
- \(P(\text{spam} \mid \text{words})\) is the **posterior**: our updated belief after seeing the words. The \(\propto\) ("proportional to") means we can skip the constant denominator, because we only need to compare spam against ham, not get an exact percentage.

[KEY INSIGHT]
Instead of asking the hard question ("given these words, is it spam?"), Bayes' rule lets us ask the easy one ("if it were spam, how likely are these words?") for each class, then pick the class that explains the evidence best.

=== step === concept
::eyebrow The naive leap
## Why it is called "naive"

One term in Bayes' rule is still hard: \(P(\text{words} \mid \text{spam})\), the chance of seeing this whole bundle of words together. Naive Bayes makes one bold simplifying assumption to crack it. It pretends every word is an **independent** clue, so the probability of the bundle is just the product of the individual word probabilities:

\[ P(\text{words} \mid \text{spam}) \;=\; \prod_{j} P(\text{word}_j \mid \text{spam}) \]

The \(\prod\) symbol means "multiply together", and \(\text{word}_j\) is the \(j\)-th word in the email. So instead of one impossible joint probability, we estimate one easy probability per word and multiply.

[NOTE]
This is the "naive" part, and it is plainly false: in real email "free" and "prize" travel together, they are not independent. The surprise of this lesson is that the classifier works well anyway. We will see exactly why a few steps from now.

=== step === concept
::eyebrow In R
## Count the clues

Each lesson runs in a fresh R session, so we build a tiny training inbox right here: ten past emails we have already labeled, four of them spam and six ham (not-spam). Each email is summarized by how often four words appear in it.

```r
emails <- data.frame(
  label   = c("spam","spam","spam","spam",  "ham","ham","ham","ham","ham","ham"),
  free    = c( 2, 1, 3, 1,    0, 0, 1, 0, 0, 0),
  prize   = c( 1, 1, 0, 1,    0, 0, 0, 0, 0, 0),
  meeting = c( 0, 0, 0, 0,    2, 1, 1, 0, 1, 2),
  report  = c( 0, 0, 0, 1,    1, 2, 1, 2, 1, 0)
)
emails
```

The **prior** is just how common each class is in the inbox: 4 of 10 spam, 6 of 10 ham. The **likelihood** of a word given a class is that word's share of all the words used in that class. Spam used 11 words in total, 7 of them "free", so \(P(\text{free} \mid \text{spam}) = 7/11 \approx 0.64\).

```r
priors <- c(spam = 4/10, ham = 6/10)

# Total times each word appears within each class:
spam_tot <- colSums(emails[emails$label == "spam", -1])
ham_tot  <- colSums(emails[emails$label == "ham",  -1])

# P(word | class) = the word's share of all words used in that class:
p_word_spam <- spam_tot / sum(spam_tot)
p_word_ham  <- ham_tot  / sum(ham_tot)
round(rbind(spam = p_word_spam, ham = p_word_ham), 3)
#>       free prize meeting report
#> spam 0.636 0.273   0.000  0.091
#> ham  0.067 0.000   0.467  0.467
```

Read the table as two word-fingerprints. Spam leans on "free" and "prize"; ham leans on "meeting" and "report". A naive Bayes **score** for an email is the prior times the product of its word likelihoods, each raised to how many times that word appears:

```r
score <- function(pw, prior, email) prior * prod(pw[names(email)] ^ email)
```

=== step === tryit
::eyebrow Your turn
## Score the email and pick a class

A new email arrives: **"free free prize"**, so the word counts are free = 2, prize = 1, and the others 0. We score it under each class with the function you just built. The last move is the whole decision rule: naive Bayes predicts the class with the **higher** score. Fill in the blank so `which.max` looks at the two scores.

```r
new_email <- c(free = 2, prize = 1, meeting = 0, report = 0)   # "free free prize"

spam_score <- score(p_word_spam, priors[["spam"]], new_email)
ham_score  <- score(p_word_ham,  priors[["ham"]],  new_email)
scores <- c(spam = spam_score, ham = ham_score)

prediction <- names(which.max(____))    # pick the higher-scoring class
prediction
```
::check {"regex":"which\\.max\\(\\s*scores","gate":true,"difficulty":"beginner","ok":"That is the entire decision rule: score each class, take the argmax. Spam wins, 0.044 to 0, so the email is filed as spam.","no":"Point which.max at the vector of scores: which.max(scores). It returns the position of the larger score, and names() turns that into the class label."}
::solution
```r
new_email <- c(free = 2, prize = 1, meeting = 0, report = 0)   # "free free prize"

spam_score <- score(p_word_spam, priors[["spam"]], new_email)
ham_score  <- score(p_word_ham,  priors[["ham"]],  new_email)
scores <- c(spam = spam_score, ham = ham_score)

prediction <- names(which.max(scores))
prediction
#> [1] "spam"
```

=== step === concept
::eyebrow A trap, and the fix
## When one word vetoes a class

Look again at the fingerprint table: \(P(\text{prize} \mid \text{ham}) = 0\), because "prize" never appeared in a ham email. That zero is dangerous. Since the score is a product, **a single zero wipes out the entire class**, no matter how strong the other evidence is. Watch it backfire on the email "a free meeting":

```r
spammy <- c(free = 1, meeting = 1, prize = 0, report = 0)   # "a free meeting"
c(spam = score(p_word_spam, priors[["spam"]], spammy),
  ham  = score(p_word_ham,  priors[["ham"]],  spammy))
#>       spam        ham
#> 0.00000000 0.01866667
```

The spam score is exactly 0, not because the email looks innocent, but because "meeting" never showed up in our spam training. One unseen word silenced the whole spam class. The cure is **Laplace (add-one) smoothing**: pretend we saw every word one extra time in every class, so no probability is ever exactly zero. For a vocabulary of \(V\) words,

\[ \hat{P}(\text{word} \mid \text{class}) = \frac{\text{count} + 1}{N_{\text{class}} + V} \]

where \(\text{count}\) is how often the word appeared in the class and \(N_{\text{class}}\) is the total word count in that class.

```r
V <- ncol(emails) - 1     # vocabulary size: the number of word columns = 4

p_word_spam_s <- (spam_tot + 1) / (sum(spam_tot) + V)
p_word_ham_s  <- (ham_tot  + 1) / (sum(ham_tot)  + V)

c(spam = score(p_word_spam_s, priors[["spam"]], spammy),
  ham  = score(p_word_ham_s,  priors[["ham"]],  spammy))
#>       spam       ham
#> 0.01422222 0.02659279
```

[WARNING]
Without smoothing, any test email containing a word your training never saw in a class gets that class zeroed out, a brittle, all-or-nothing failure. Smoothing is not optional polish; real naive Bayes always uses it.

=== step === quiz
::eyebrow Check yourself
## What does smoothing actually change?

Before smoothing, every email mentioning "meeting" scored spam = 0, because "meeting" never appeared in a spam training email. After add-one smoothing, that same email scored spam = 0.014. What did smoothing change, and what did it leave alone?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It gives every word a tiny non-zero probability in every class, so one never-before-seen word can no longer force a class's whole score to zero ::ok Right. Smoothing only lifts the floor off the likelihoods. The class can still lose, but now it loses on the weight of the evidence, not because a single missing word vetoed it.
- It makes the two classes equally likely by throwing away the prior ::no Smoothing never touches the prior. It adjusts only the per-word likelihoods; the prior (4/10 spam, 6/10 ham) is untouched.
- It deletes rare words from the vocabulary so they cannot cause zeros ::no The opposite: it adds a pretend count to every word, keeping all of them. Nothing is deleted, the zeros are filled in.

=== step === concept
::eyebrow The surprise
## Why a wrong assumption still wins

The independence assumption is false, so naive Bayes computes the probability *numbers* wrong, usually too confident, pushed toward 0 or 1, because correlated words like "free" and "prize" get counted as if they were separate, independent evidence. So why does the classifier work?

Because classification does not need the numbers to be right. It only needs the **ranking** to be right. The prediction is the class with the highest score:

\[ \hat{y} = \operatorname*{arg\,max}_{c}\; P(c)\prod_{j} P(\text{word}_j \mid c) \]

Here \(\operatorname*{arg\,max}_{c}\) means "the class \(c\) that makes the expression largest". Even when the assumption distorts both scores, it usually distorts them in the same direction, so the *winner* stays the same. You get the right label from probabilities you should not trust as exact chances.

[KEY INSIGHT]
Naive Bayes is often a great classifier and a poor probability estimator at the same time. Trust its predicted class; be skeptical of its 99.9% confidence.

When does the assumption actually bite? When features are strongly redundant. Ten near-duplicate clues get counted as ten independent votes, and that pile-up can occasionally overwhelm the prior and flip the winner. That is the one case where "naive" genuinely hurts.

=== step === quiz
::eyebrow Check yourself
## The broken assumption

In real email, words are clearly **not** independent: "free" and "prize" tend to appear together. Yet naive Bayes still labels spam well. Why does the false assumption not break the classifier?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Classification needs only the correct class to get the highest score; the independence assumption distorts the probability values but usually not which class comes out on top ::ok Exactly. The argmax is robust even when the underlying probabilities are off, so the predicted label is usually right despite the wrong assumption.
- Because in email, words genuinely are independent once you condition on the class ::no That is the assumption restated as if it were true. It is not: "free" and "prize" really do co-occur. The point is that the classifier survives the assumption being false.
- Because naive Bayes produces well-calibrated probabilities you can read as exact chances ::no The reverse is true. Double-counting correlated words makes naive Bayes overconfident, so its probabilities are usually poorly calibrated even when its labels are right.

=== step === concept
::eyebrow From text to tables
## The same recipe for numeric data

Nothing about Bayes' rule was specific to words. For **tabular** data with numeric features, the only thing that changes is how we compute the likelihood \(P(x \mid \text{class})\). Instead of a word's share, we fit a bell curve (a Gaussian) to each numeric feature within each class, using that class's mean \(\mu_c\) and standard deviation \(\sigma_c\):

\[ P(x \mid c) = \frac{1}{\sqrt{2\pi}\,\sigma_c}\, \exp\!\left(-\frac{(x-\mu_c)^2}{2\sigma_c^2}\right) \]

The intuition is the same as the word fingerprints: each class has its own typical range for each feature, and a new point is scored by how well it fits each class's range. The chart shows one such numeric clue, the number of links in an email. Spam emails cluster high, ham low: that separation is exactly the signal Gaussian naive Bayes reads.

::widget chart-plotter {"data":[{"x":"spam","y":6},{"x":"spam","y":9},{"x":"spam","y":5},{"x":"spam","y":8},{"x":"spam","y":7},{"x":"ham","y":1},{"x":"ham","y":0},{"x":"ham","y":2},{"x":"ham","y":1},{"x":"ham","y":0}],"geoms":["boxplot"],"x":"class","y":"links"}

In R, the `e1071` package does the whole recipe, priors, per-feature Gaussians, and the product, in one call. Here two numeric clues per email: the count of links and of ALL-CAPS words.

```r
library(e1071)

mail <- data.frame(
  label = factor(c("spam","spam","spam","spam","spam",
                   "ham","ham","ham","ham","ham")),
  links = c( 6, 9, 5, 8, 7,    1, 0, 2, 1, 0),
  caps  = c( 4, 6, 3, 5, 7,    0, 1, 0, 2, 1)
)

model <- naiveBayes(label ~ ., data = mail)    # Gaussian naive Bayes on the numeric clues

new <- data.frame(links = 6, caps = 4)
predict(model, new)                            # the predicted class
predict(model, new, type = "raw")              # the class probabilities
#> [1] spam
#> Levels: ham spam
#>           ham spam
#> [1,] 1.45e-11    1
```

The model calls the new email spam, with a probability rounded to 1. **Where naive Bayes shines:** text and other high-dimensional data, tiny training sets, and any time you need a fast, strong baseline. **Where it struggles:** strongly correlated features (the redundancy problem above), and any time you need the probabilities themselves to be trustworthy.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Domingos and Pazzani (1997), "On the Optimality of the Simple Bayesian Classifier under Zero-One Loss"](https://doi.org/10.1023/A:1007413511361) - the paper that explains why the wrong independence assumption still classifies well.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the gentle treatment of naive Bayes alongside the other classifiers, with R labs.
- [The Elements of Statistical Learning, ch. 6.6 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - naive Bayes with the full density-estimation math.
- [Introduction to Information Retrieval, ch. 13 (free online)](https://nlp.stanford.edu/IR-book/) - multinomial naive Bayes for text, with the counting and smoothing you did by hand here.
- [e1071 (Meyer et al.) on CRAN](https://cran.r-project.org/package=e1071) - the package whose naiveBayes() you called above.

=== step === complete
## Lesson 2 complete

You can now run Bayes' rule as a classifier: estimate a prior and per-feature likelihoods, multiply them under the naive independence assumption, smooth away the zeros, and read off the higher-scoring class. You know why the false assumption rarely breaks the prediction, and you saw the very same recipe handle numeric, tabular features through a Gaussian likelihood in one e1071 call.

Next, Lesson 3: Discriminant Analysis, LDA and QDA. Like Gaussian naive Bayes it assumes the classes are bell-shaped, but it drops the independence assumption and lets the features correlate, then draws an explicit boundary between the classes. You will see exactly what that boundary buys you, and what it costs.
