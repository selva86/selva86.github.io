---
title: "Imbalanced Classification Lesson 1: Beyond Binary: Multiclass Classification"
catalog_blurb: "How to classify into three or more classes and score it fairly."
description: "Classify into three or more classes in R: one-vs-rest and one-vs-one, native multiclass models, the K-by-K confusion matrix, and macro, micro and weighted F1."
keywords: "multiclass classification, one-vs-rest, one-vs-one, multinomial logistic regression, macro F1, micro average, weighted average, confusion matrix, per-class precision recall, R"
post_type: "LESSON"
curriculum_id: "6.80.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "1"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_next: "Class-Imbalance-and-Resampling.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 6
## Beyond Binary: Multiclass Classification

Every classifier you have met so far answers a yes-or-no question: sick or healthy, spam or not, churn or stay. It draws one boundary and picks a side. But most real problems have more than two answers.

Meena is a botanist. Each iris she pulls from a field tray must be labelled as one of THREE species: *setosa*, *versicolor*, or *virginica*. The flower in her hand has a petal 4.7 cm long and 1.4 cm wide. That is not a yes-or-no question; it is a one-of-three question, and the tools built for two classes do not obviously apply.

This lesson is how you get from a two-class classifier to a many-class one, and how the scorecard changes when there are more than two classes to keep track of.

By the end you will be able to:

- Turn a K-class problem into binary sub-problems with **one-vs-rest** and **one-vs-one**, and count how many models each needs
- Fit a natively multiclass model in R and read its per-class predictions
- Read a **K-by-K confusion matrix** and compute per-class precision, recall and F1
- Collapse those into one score with **macro**, **micro** and **weighted** averaging, and know which to trust when a class is rare
- Extend the **ROC curve** and **AUC** past two classes

**Prerequisites:** you can run R and read its output, and you have met a binary classifier that outputs a probability score, the confusion matrix, and precision, recall and ROC/AUC (the [Reading a Classifier](Reading-a-Classifier.html) lesson).

The panel below is a single classifier separating two classes: the atom every idea in this lesson is built from. Drag the slider to watch it carve the boundary.

::widget decision-region {"labels":{"c0":"class A","c1":"class B"},"seed":7}

=== step === concept
::eyebrow The jump
## From two answers to many

A binary classifier's whole job is to split the world in two. It produces one score (a probability that the answer is "yes") and you compare that score to a threshold. One number, one boundary, two possible verdicts.

Meena's problem breaks that in a small but important way. She does not need a yes-or-no; she needs to pick exactly ONE label out of a fixed set. With \(K\) possible classes (here \(K = 3\)), a **multiclass classifier** takes an input and returns one of the \(K\) labels.

[NOTE]
This lesson is about **single-label** multiclass: each flower is exactly one species, never two at once. That is different from *multi-label* problems (a news article tagged both "sports" and "politics"), which need different tools. Everything here assumes one true label per item.

Two honest questions follow, and the rest of the lesson answers them in order:

- **How do we train a classifier that can choose among three species, when the classifiers we know only say yes or no?**
- **How do we grade it, when "accuracy" is now spread across three classes that may not be equally easy or equally common?**

=== step === concept
::eyebrow Why it is not automatic
## Most classifiers can only say yes or no

Here is the obstacle. Many of the most useful classifiers are **binary at heart**. Logistic regression fits a single S-curve and reads off one probability. A support vector machine finds a single separating boundary. Both were designed to divide the world into exactly two groups; neither has any built-in notion of a third class.

So to handle Meena's three species we have two routes, and this lesson walks both:

- **Decompose** the one three-class problem into several two-class problems that a binary classifier CAN solve, then combine their answers. Two standard recipes do this: **one-vs-rest** and **one-vs-one**.
- **Use a model that is natively multiclass** and skip decomposition entirely. Decision trees, random forests, k-nearest-neighbours, naive Bayes and multinomial logistic regression all predict across many classes directly.

[KEY INSIGHT]
"Multiclass" is not one algorithm. It is either a wrapper that stitches binary classifiers together, or a model that was multiclass all along. Knowing which you are using tells you how many models are really being trained under the hood.

We start with the wrappers, because they show exactly what "handle three classes" has to mean.

=== step === concept
::eyebrow Strategy one
## One-vs-rest: one classifier per class

The first recipe is **one-vs-rest** (also called one-vs-all). The idea is almost too simple: to sort flowers into three species, train three separate yes-or-no classifiers.

- Classifier 1: *is this setosa, or not?* (setosa = yes, the other two = no)
- Classifier 2: *is this versicolor, or not?*
- Classifier 3: *is this virginica, or not?*

Each is an ordinary binary classifier, trained on ALL the flowers, with the labels rewritten to "this class" versus "everything else". To classify a new flower you run all three; each returns a score (its confidence that the flower is its class). You then predict the class whose classifier is most confident, the **argmax** of the scores:

\[ \hat{y} = \arg\max_{k \in \{1,\dots,K\}} \; s_k(x) \]

Here \(s_k(x)\) is the score classifier \(k\) gives to flower \(x\), and \(\arg\max_k\) means "the class \(k\) with the largest score". For \(K\) classes, one-vs-rest trains exactly \(K\) classifiers.

Every one of those classifiers faces the same shape of task: peel ONE class away from all the others. The panel below is that task made visible, one class (blue) against the rest (orange).

::widget decision-region {"labels":{"c0":"this class","c1":"the rest"},"seed":11}

=== step === concept
::eyebrow In R
## One-vs-rest, built by hand

Let us build it on Meena's flowers. R ships with the `iris` dataset: 150 flowers, 50 of each species, each with petal and sepal measurements. We will use petal length and width as the features. There is no external file to load; `iris` is always available.

First, the three "one class vs the rest" logistic regressions:

```r
species <- levels(iris$Species)          # "setosa" "versicolor" "virginica"

# One-vs-rest: one logistic regression per species (that species = 1, the other two = 0).
ovr <- lapply(species, function(sp) {
  target <- as.integer(iris$Species == sp)
  glm(target ~ Petal.Length + Petal.Width, data = iris, family = binomial)
})
names(ovr) <- species

# Every model scores every flower; line the three score columns up side by side.
scores <- sapply(ovr, function(m) predict(m, type = "response"))
round(head(scores, 5), 2)
#>   setosa versicolor virginica
#> 1      1       0.21         0
#> 2      1       0.21         0
#> 3      1       0.19         0
#> 4      1       0.24         0
#> 5      1       0.21         0
```

The first five flowers are all setosa, and sure enough the setosa classifier is fully confident (1.00) while the other two are near zero. Now predict each flower as the argmax of its three scores, and measure how often that matches the truth:

```r
# Predict = the species whose one-vs-rest model is most confident.
ovr_pred <- factor(species[max.col(scores, ties.method = "first")], levels = species)
mean(ovr_pred == iris$Species)
#> [1] 0.96
```

**96% correct** from three ordinary logistic regressions and an argmax. That is one-vs-rest in full: no special multiclass algorithm, just \(K\) binary models and a "pick the most confident" rule.

[NOTE]
Setosa is perfectly separable from the other two species by its petals, so its logistic regression cannot settle on finite coefficients and R prints a harmless "fitted probabilities numerically 0 or 1" warning. It does not change the scores or the prediction; it is just R telling you those two groups are cleanly split.

=== step === quiz
::eyebrow Check yourself
## How many one-vs-rest models?

A bank wants to sort each loan application into one of **four** risk bands: low, medium, high, or reject. Using one-vs-rest with logistic regression, how many separate binary classifiers must it train?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- 1, because logistic regression is already one model ::no Plain logistic regression is binary; it cannot output four bands on its own. One-vs-rest is exactly the wrapper that fixes that, and it needs more than one model.
- 4, one "this band vs the rest" classifier per band ::ok Right. One-vs-rest trains one binary classifier per class, so K classes need K classifiers: here four, one per risk band, each asking "this band, or not?"
- 6, one classifier for every pair of bands ::no That is the count for one-vs-ONE (every pair of classes), not one-vs-rest. One-vs-rest trains one model per class (4 here), not one per pair.

=== step === concept
::eyebrow Strategy two
## One-vs-one: let every pair vote

The second recipe attacks the problem from the other side. Instead of "each class against everyone", **one-vs-one** trains a classifier for every PAIR of classes:

- setosa vs versicolor
- setosa vs virginica
- versicolor vs virginica

Each classifier is trained only on the flowers of its two species and only ever chooses between those two. To classify a new flower you run all the pairwise classifiers, each casts one vote for a species, and the species with the most votes wins.

For \(K\) classes the number of pairs is

\[ \binom{K}{2} = \frac{K(K-1)}{2}, \]

which for \(K = 3\) is 3, but grows quickly: 10 classes need \(\tfrac{10 \cdot 9}{2} = 45\) pairwise classifiers. The flow below is the whole procedure.

::widget process-flow {"steps":[{"title":"Pair up","sub":"one classifier for every pair of classes"},{"title":"Each votes","sub":"every classifier picks one of its two classes"},{"title":"Tally","sub":"count the votes each class received"},{"title":"Majority wins","sub":"the class with the most votes is the prediction"}]}

=== step === concept
::eyebrow In R
## One-vs-one, built by hand

The same flowers, the other recipe. First enumerate the pairs, then train one logistic regression per pair on just that pair's rows:

```r
pairs <- combn(species, 2)     # every pair of species, as columns
pairs
#>      [,1]         [,2]        [,3]
#> [1,] "setosa"     "setosa"    "versicolor"
#> [2,] "versicolor" "virginica" "virginica"

# One binary classifier per pair; each votes for one of its two species on every flower.
vote <- sapply(seq_len(ncol(pairs)), function(j) {
  pr  <- pairs[, j]
  sub <- iris[iris$Species %in% pr, ]
  y   <- factor(sub$Species, levels = pr)
  fit <- glm(y ~ Petal.Length + Petal.Width, data = sub, family = binomial)
  p   <- predict(fit, newdata = iris, type = "response")   # P(second species of the pair)
  ifelse(p >= 0.5, pr[2], pr[1])
})
colnames(vote) <- apply(pairs, 2, paste, collapse = "_vs_")
head(vote, 3)
#>   setosa_vs_versicolor setosa_vs_virginica versicolor_vs_virginica
#> 1 "setosa"             "setosa"            "versicolor"
#> 2 "setosa"             "setosa"            "versicolor"
#> 3 "setosa"             "setosa"            "versicolor"
```

For each of the first three flowers (all setosa), the two classifiers that involve setosa both vote "setosa", so setosa gets 2 votes and wins. Take the majority vote for every flower and score it:

```r
# The prediction is the species with the most votes across the 3 classifiers.
ovo_pred <- apply(vote, 1, function(v) names(which.max(table(factor(v, levels = species)))))
mean(ovo_pred == iris$Species)
#> [1] 0.96
```

Also **96%**. On this easy, balanced problem one-vs-rest and one-vs-one land in the same place. They differ most when classes are hard to separate or very uneven in size, which is exactly where the rest of this course lives.

=== step === tryit
::eyebrow Your turn
## Count the pairwise classifiers

A handwriting recognizer sorts each scanned digit into one of **10** classes (0 through 9). With one-vs-one it trains one classifier for every pair of digits. Fill in the formula for the number of pairwise classifiers, then run it.

```r
K <- 10                    # ten digit classes
# one-vs-one trains one classifier per PAIR of classes:
n_ovo <- ____
n_ovo
```
::check {"regex":"K\\s*\\*\\s*\\(\\s*K\\s*-\\s*1\\s*\\)\\s*/\\s*2|choose\\s*\\(\\s*K\\s*,\\s*2\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right: K(K-1)/2 = (10 x 9)/2 = 45 pairwise classifiers. One-vs-one trains far more models than one-vs-rest (which would train just 10), but each sees only two classes' data.","no":"Every pair of K classes: K*(K-1)/2 (or choose(K, 2)). For K = 10 that is 45."}
::solution
```r
K <- 10
n_ovo <- K * (K - 1) / 2
n_ovo
#> [1] 45
```

=== step === concept
::eyebrow Which decomposition
## One-vs-rest or one-vs-one?

Both recipes work; they trade off differently.

| | One-vs-rest | One-vs-one |
|---|---|---|
| Number of models (K classes) | K | K(K-1)/2 |
| Data per model | all rows | only the two classes' rows |
| For 3 classes | 3 models | 3 models |
| For 10 classes | 10 models | 45 models |
| Each model's job | one class vs a big mixed "rest" | a clean two-class split |

One-vs-rest trains fewer models, so it is the common default. One-vs-one trains many more, but each is smaller and often easier (telling setosa from virginica is cleaner than telling setosa from "versicolor-and-virginica lumped together"), and each trains on less data. That makes one-vs-one attractive when the base classifier scales badly with the number of rows, or when the classes are hard to separate.

[NOTE]
You rarely write either wrapper by hand in practice. Libraries like `caret` and `tidymodels` apply one-vs-rest or one-vs-one for you when you hand a binary engine a multiclass target. Building them here, once, is so you know exactly what those libraries are doing under the hood.

=== step === concept
::eyebrow The shortcut
## Some models never needed a wrapper

Decomposition exists to rescue binary-only classifiers. But several models are **natively multiclass**: they handle any number of classes directly, with no wrapper at all.

- **Decision trees and random forests** split on features and can hold as many class labels in their leaves as you like.
- **k-nearest-neighbours** looks at a new point's closest neighbours and takes a majority vote among whatever classes appear.
- **Naive Bayes** computes a probability for each class and picks the largest.
- **Multinomial logistic regression** is the direct generalization of the logistic regression you already know: instead of one probability it outputs a probability for every class, and they sum to 1.

When a natively multiclass model fits your problem, reach for it first: one model, one fit, per-class probabilities for free. We will use multinomial logistic regression, because it is the natural next step from the binary logistic regression already in your toolkit.

=== step === concept
::eyebrow In R
## A native multiclass model

`multinom` from the `nnet` package fits multinomial logistic regression: one model, all three species at once. It predicts a class directly and, like its binary cousin, a probability for each class.

```r
library(nnet)
multi <- multinom(Species ~ Petal.Length + Petal.Width, data = iris, trace = FALSE)

# A probability for EVERY species (each row sums to 1).
round(head(predict(multi, type = "probs"), 3), 3)
#>   setosa versicolor virginica
#> 1      1          0         0
#> 2      1          0         0
#> 3      1          0         0
```

The first three flowers are setosa with probability essentially 1. Ask for the single best label instead of the probabilities and you get a predicted species per flower:

```r
pred <- predict(multi)     # the most probable species for each flower
head(pred, 3)
#> [1] setosa setosa setosa
#> Levels: setosa versicolor virginica
```

One model, no wrapper, a full probability distribution over the three species. Now we grade it.

=== step === concept
::eyebrow The scorecard grows
## The confusion matrix goes K-by-K

With two classes the confusion matrix was 2-by-2. With three species it becomes **3-by-3**: one row per predicted species, one column per actual species. The diagonal counts correct predictions; every off-diagonal cell is a specific confusion (predicted this, was really that).

```r
cm <- table(predicted = pred, actual = iris$Species)
cm
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         47         3
#>   virginica       0          3        47
```

Read it slowly. All 50 setosa flowers are caught perfectly (setosa is never confused with anything; its petals are unmistakable). The model's only mistakes sit in the versicolor/virginica block: **3** true virginica were called versicolor, and **3** true versicolor were called virginica. That is the entire story of this model's errors, and no single accuracy number would have told you WHERE they are.

[KEY INSIGHT]
The diagonal is your correct predictions; the off-diagonal tells you which classes the model mixes up. In a K-class problem the interesting information is almost always in specific off-diagonal cells, not in one overall score.

=== step === quiz
::eyebrow Check yourself
## Where are the mistakes?

From the 3-by-3 matrix above, which statement is true of this model?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- It confuses setosa with virginica most often ::no Look at the setosa row and column: every setosa is classified correctly and nothing else is called setosa. Setosa is never confused with anything.
- Its errors are spread evenly across all three species ::no The errors are not spread out; the setosa row and column are error-free. All six mistakes sit in one place.
- Setosa is perfectly classified; the only confusions are between versicolor and virginica ::ok Exactly. The setosa row and column are clean (50 correct, 0 errors), and all six mistakes are versicolor-virginica swaps. Those two species overlap in petal size, which is precisely what the off-diagonal cells reveal.

=== step === concept
::eyebrow Per class
## Precision, recall and F1, one class at a time

Precision, recall and F1 were defined for a positive class versus a negative one. With three species there is no single "positive" class, so we compute them **once per class**, each time treating that class as positive and lumping the other two as negative, exactly the one-vs-rest view again.

For class \(k\), read three counts off the matrix: \(TP_k\) (predicted \(k\) and truly \(k\), the diagonal cell), \(FP_k\) (predicted \(k\) but truly another class, the rest of row \(k\)), and \(FN_k\) (truly \(k\) but predicted another class, the rest of column \(k\)). Then

\[ \text{precision}_k = \frac{TP_k}{TP_k + FP_k}, \qquad \text{recall}_k = \frac{TP_k}{TP_k + FN_k}, \qquad F_{1,k} = 2\cdot\frac{\text{precision}_k \cdot \text{recall}_k}{\text{precision}_k + \text{recall}_k}. \]

In code, one function that collapses the K-by-K matrix to the 2-by-2 view for class \(k\):

```r
per_class <- function(cm, k) {
  tp <- cm[k, k]
  fp <- sum(cm[k, ]) - tp        # predicted k, actually something else
  fn <- sum(cm[, k]) - tp        # actually k, predicted something else
  precision <- tp / (tp + fp)
  recall    <- tp / (tp + fn)
  f1        <- 2 * precision * recall / (precision + recall)
  c(precision = precision, recall = recall, f1 = f1)
}
per <- t(sapply(seq_len(nrow(cm)), function(k) per_class(cm, k)))
rownames(per) <- rownames(cm)
round(per, 3)
#>            precision recall  f1
#> setosa          1.00   1.00 1.00
#> versicolor      0.94   0.94 0.94
#> virginica       0.94   0.94 0.94
```

Now every species has its own scorecard. Setosa is flawless (1.00 across the board); versicolor and virginica each score 0.94, because each loses 3 flowers to the other. This per-class table is the honest picture of a multiclass model, and it is what we summarize next.

=== step === tryit
::eyebrow Your turn
## Recall for one class, by hand

Per-class recall works on ANY K-class confusion matrix. Here is a fruit sorter's 3-by-3 matrix (rows = predicted, columns = actual). Compute the **recall for oranges**: of all the truly-orange fruit, the fraction the sorter caught. Fill in the blank.

```r
fruit <- matrix(c(30, 2, 1,
                   3, 24, 4,
                   0, 5, 21),
                nrow = 3, byrow = TRUE,
                dimnames = list(pred   = c("apple", "orange", "lemon"),
                                actual = c("apple", "orange", "lemon")))
tp_orange     <- fruit["orange", "orange"]   # oranges correctly called orange = 24
actual_orange <- sum(fruit[, "orange"])      # every truly-orange fruit (the orange COLUMN)
recall_orange <- ____
round(recall_orange, 3)
```
::check {"regex":"tp_orange\\s*/\\s*actual_orange","gate":true,"difficulty":"beginner","ok":"Right: recall = 24 / 31 = 0.774. Recall for a class is its diagonal cell divided by the sum of its actual COLUMN, however many classes there are.","no":"Recall is (correctly caught) / (all truly that class). Here that is tp_orange / actual_orange."}
::solution
```r
fruit <- matrix(c(30, 2, 1,
                   3, 24, 4,
                   0, 5, 21),
                nrow = 3, byrow = TRUE,
                dimnames = list(pred   = c("apple", "orange", "lemon"),
                                actual = c("apple", "orange", "lemon")))
tp_orange     <- fruit["orange", "orange"]
actual_orange <- sum(fruit[, "orange"])
recall_orange <- tp_orange / actual_orange
round(recall_orange, 3)
#> [1] 0.774
```

=== step === concept
::eyebrow One number, three ways
## Macro, micro and weighted averaging

Sometimes you must report ONE number, not a per-class table. There are three standard ways to average per-class scores into a single figure, and on an uneven problem they can disagree sharply.

- **Macro** average: the plain mean of the per-class scores. Every class counts equally, no matter how rare. \[ \text{macro-}F_1 = \frac{1}{K}\sum_{k=1}^{K} F_{1,k} \]
- **Weighted** average: the mean weighted by each class's **support** \(n_k\) (how many true examples it has). \[ \text{weighted-}F_1 = \sum_{k=1}^{K} \frac{n_k}{N}\, F_{1,k} \]
- **Micro** average: pool the counts across all classes first, then compute one score. For single-label multiclass, micro-F1 equals plain **accuracy**.

On balanced iris all three land near 0.96 and the choice would not matter. To see them split apart we need an uneven problem. Here is a support-ticket router, deliberately imbalanced: "technical" tickets are common, "account" tickets are rare.

```r
# rows = predicted, columns = actual
tickets <- matrix(c(540,  60,  20,
                     40, 120,  15,
                     20,  20,  15),
                  nrow = 3, byrow = TRUE,
                  dimnames = list(pred   = c("technical", "billing", "account"),
                                  actual = c("technical", "billing", "account")))

prf <- function(cm, k) {
  tp <- cm[k, k]; fp <- sum(cm[k, ]) - tp; fn <- sum(cm[, k]) - tp
  prec <- tp / (tp + fp); rec <- tp / (tp + fn)
  c(f1 = 2 * prec * rec / (prec + rec), support = sum(cm[, k]),
    tp = tp, fp = fp, fn = fn)
}
stats <- t(sapply(1:3, function(k) prf(tickets, k)))
rownames(stats) <- rownames(tickets)
round(stats[, c("f1", "support")], 3)
#>              f1 support
#> technical 0.885     600
#> billing   0.640     200
#> account   0.286      50
```

The rare "account" class has a dismal F1 of 0.29, while common "technical" scores 0.89. Watch what each average does with that spread:

```r
macro    <- mean(stats[, "f1"])                                              # every class equal
weighted <- sum(stats[, "f1"] * stats[, "support"]) / sum(stats[, "support"])
micro    <- sum(stats[, "tp"]) / (sum(stats[, "tp"]) + sum(stats[, "fp"]))   # = accuracy
round(c(macro = macro, micro = micro, weighted = weighted), 3)
#>    macro    micro weighted
#>    0.604    0.794    0.792
```

Macro is **0.60**; micro and weighted are both about **0.79**. That gap is the whole point of the next step.

=== step === concept
::eyebrow The lesson of the gap
## Which average, and why it matters

That gap is not a quirk; it is the two averages answering different questions.

| Average | Question it answers | Who dominates it |
|---|---|---|
| Macro | "How well does the model do on a TYPICAL class?" | every class equally, so a rare class can sink it |
| Micro / accuracy | "How well does the model do on a TYPICAL prediction?" | the frequent classes, because they supply most rows |
| Weighted | a compromise: per-class scores weighted by class size | the frequent classes, but less brutally than micro |

On the ticket router, micro (0.79) looks healthy because the common "technical" class is handled well and it makes up most of the traffic. Macro (0.60) is far grimmer, because it refuses to let "technical" drown out the fact that the rare "account" class is barely working (F1 0.29).

[KEY INSIGHT]
When classes are imbalanced and the rare class is the one you care about (fraud, disease, a rare support category), report the **macro** average. Micro and accuracy will flatter a model that is quietly failing on the minority class, the exact trap this whole course is about.

That is the bridge into the rest of this course: multiclass metrics are where imbalance first bites, and macro averaging is the tool that makes it visible.

=== step === quiz
::eyebrow Check yourself
## The rare class that matters

A hospital model sorts scans into four categories; one, a rare aggressive tumour, appears in only 2% of scans and is the one that must not be missed. The model reports 95% accuracy. Which single number would best expose whether it actually handles the rare tumour?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The macro-averaged F1, which weights all four categories equally so the rare tumour cannot be hidden by the common ones ::ok Right. Macro averaging gives the rare tumour the same weight as every other category, so a poor F1 on it drags the macro score down and makes the failure visible. Accuracy and micro are dominated by the 98% of common scans and would stay high.
- The overall accuracy, since 95% is already a high number ::no Accuracy is exactly the trap here: with the tumour at 2%, a model that misses every tumour still scores about 98% accuracy. A high accuracy tells you nothing about the rare class.
- The micro-averaged F1, because pooling all classes gives the fairest overall view ::no Micro pools every prediction, so the common categories dominate it just as they dominate accuracy (in fact micro-F1 equals accuracy here). It would stay high while the rare tumour fails.

=== step === concept
::eyebrow The curve, extended
## ROC and AUC beyond two classes

The ROC curve and its AUC were built for two classes: sweep a threshold on the positive class's score and trace true-positive rate against false-positive rate. With more than two classes there is no single positive class, so we use the one-vs-rest trick one more time: pick a class, treat it as positive and the rest as negative, and draw ITS ROC curve from its predicted probabilities. Each class gets its own curve and its own AUC.

The panel below is one such one-vs-rest ROC (one class against the rest) with a draggable threshold, the binary building block again. Every class in a multiclass model gets one of these.

::widget roc-curve {}

To make it concrete, take versicolor as the positive class and use the multinomial model's versicolor probabilities:

```r
score_versi  <- predict(multi, type = "probs")[, "versicolor"]   # P(versicolor) per flower
actual_versi <- as.integer(iris$Species == "versicolor")         # 1 if truly versicolor

thr <- seq(0, 1, by = 0.01)
roc <- t(sapply(thr, function(t) {
  flag <- score_versi >= t
  c(FPR = sum(flag & actual_versi == 0) / sum(actual_versi == 0),
    TPR = sum(flag & actual_versi == 1) / sum(actual_versi == 1))
}))
o   <- order(roc[, "FPR"])
auc <- sum(diff(roc[o, "FPR"]) * (head(roc[o, "TPR"], -1) + tail(roc[o, "TPR"], -1)) / 2)
round(auc, 3)
#> [1] 0.993
```

Versicolor's one-vs-rest AUC is **0.993**: the model ranks versicolor flowers above non-versicolor ones almost perfectly. Do this for each class and you have three AUCs, which you summarize the same way as F1: **macro-AUC** (the plain mean, every class equal) or **micro-AUC** (pool all the one-vs-rest scores first). The macro/micro choice carries exactly the same warning as before.

=== step === quiz
::eyebrow Check yourself
## What a macro-AUC hides

A five-class model reports a **macro-AUC of about 0.94**. Digging in, four classes have one-vs-rest AUCs near 0.99, but the fifth, rarest class has a one-vs-rest AUC of just **0.75**. What does the 0.94 tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model ranks every class well, since 0.94 is close to 1 ::no A single averaged number never guarantees that every class is good. Here one class sits at 0.75, which the average quietly absorbs.
- The headline number is an average that hides one weak class; you only see the 0.75 by reading the per-class AUCs ::ok Right. Even macro averaging, which is kinder to rare classes than micro, still collapses five numbers into one, and a strong-vs-weak spread disappears into the mean. Per-class metrics are the only way to catch it.
- The 0.75 must be a mistake, because it is far below the macro-AUC ::no There is nothing contradictory: an average of four 0.99s and one 0.75 is about 0.94. The low class is real, and the average is doing exactly what averages do.

=== step === concept
::eyebrow Putting it together
## Choosing your approach

You now have every piece. A quick guide for a new K-class problem:

| Decision | Rule of thumb |
|---|---|
| Model type | If a natively multiclass model fits (tree, forest, kNN, multinomial), use it: one fit, per-class probabilities for free. |
| If your base learner is binary-only | Wrap it. One-vs-rest is the solid default (K models); reach for one-vs-one when the learner scales badly with data, or classes barely separate. |
| Reading results | Always look at the K-by-K confusion matrix and per-class precision/recall/F1 first, never a lone accuracy number. |
| One headline number | Report **macro** when a rare class matters (the usual case in this course); micro or accuracy only when every class is equally common and equally important. |

[NOTE]
None of this made the classes any more balanced; it only made the imbalance VISIBLE. The next lessons tackle the imbalance itself: resampling a rare class, moving the decision threshold, and calibrating probabilities, so the model does not just get graded fairly but actually gets better at the class you care about.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - multinomial logistic regression and multiclass classification, with R labs.
- [scikit-learn User Guide: Multiclass and multioutput algorithms](https://scikit-learn.org/stable/modules/multiclass.html) - the clearest reference on one-vs-rest and one-vs-one, with framework-agnostic explanations.
- [scikit-learn: Precision, recall and F-measures (averaging)](https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-and-f-measures) - exactly how macro, micro and weighted averaging are defined and when each applies.
- [nnet reference manual (CRAN)](https://cran.r-project.org/web/packages/nnet/nnet.pdf) - the R package used here to fit multinomial logistic regression.
- [yardstick: multiclass averaging (tidymodels)](https://yardstick.tidymodels.org/articles/multiclass.html) - how the standard R metrics package computes macro/micro/weighted metrics for real projects.

=== step === complete
## Lesson 1 complete

You can now take a classifier past two classes. When a model is **natively multiclass** (a tree, a forest, k-nearest-neighbours, multinomial logistic regression) it predicts across all classes directly. When your base learner is binary-only, you wrap it: **one-vs-rest** trains K "class vs the rest" models and predicts the argmax; **one-vs-one** trains K(K-1)/2 pairwise models and takes a majority vote. You grade the result with a **K-by-K confusion matrix**, read **per-class** precision, recall and F1 off it, and collapse those into one number with **macro**, **micro** or **weighted** averaging, knowing that macro is the one that refuses to let a common class hide a failing rare one. You extended the **ROC curve** and **AUC** the same way, one one-vs-rest curve per class.

On Meena's three iris species, one-vs-rest, one-vs-one and a native multinomial model all reached 96% accuracy, and the per-class table showed exactly where the model slips: versicolor and virginica, never setosa.

Next, Lesson 2: **Class Imbalance and Resampling.** You have seen how imbalance distorts the SCORE; now you will learn to fight it in TRAINING, undersampling, oversampling and SMOTE, applied without leaking into your evaluation.
