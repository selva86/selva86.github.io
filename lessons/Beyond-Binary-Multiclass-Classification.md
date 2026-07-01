---
title: "Imbalanced Classification Lesson 1: Beyond Binary: Multiclass Classification"
catalog_blurb: "How to classify into more than two categories, and measure it fairly."
description: "Classify into more than two classes: one-vs-rest and one-vs-one decomposition, the K-by-K confusion matrix, and macro, micro and weighted precision and recall in R."
keywords: "multiclass classification, one-vs-rest, one-vs-one, OvR, OvO, confusion matrix, macro average, micro average, per-class recall, multiclass ROC, R"
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

Your photo app sorts each picture into people, pets, or food. A support system routes each ticket to billing, technical, or account. Neither is a yes/no question: there are three buckets, and every item lands in exactly one.

Meet Maya. She runs a plant nursery and keeps a crate of 150 iris seedlings a botanist already sorted into three species (setosa, versicolor, virginica). She wants to learn the pattern in their petal and sepal measurements so she can sort next season's crates on sight. That is a **multiclass** problem, and most of what you learned for two classes needs a small twist to work for three or more.

By the end of this lesson you will be able to:

- Turn a many-class problem into simple yes/no problems with **one-vs-rest** and **one-vs-one**
- Read a **K-by-K confusion matrix** and see which classes get mistaken for which
- Compute **per-class** precision and recall, and combine them with **macro, micro and weighted** averaging
- Read a per-class **ROC** curve when there are more than two classes

**Prerequisites:** you can run R and read its output, and you have met a binary classifier that outputs a score (logistic regression), plus the confusion matrix and accuracy/precision/recall from binary problems.

::widget chart-plotter {"x":"petal_length","y":"petal_width","geoms":["point"],"data":[{"x":1.4,"y":0.2,"fill":"setosa"},{"x":1.5,"y":0.2,"fill":"setosa"},{"x":1.3,"y":0.2,"fill":"setosa"},{"x":1.7,"y":0.4,"fill":"setosa"},{"x":1.4,"y":0.3,"fill":"setosa"},{"x":1.5,"y":0.1,"fill":"setosa"},{"x":4.5,"y":1.5,"fill":"versicolor"},{"x":4.0,"y":1.3,"fill":"versicolor"},{"x":4.7,"y":1.4,"fill":"versicolor"},{"x":4.2,"y":1.5,"fill":"versicolor"},{"x":4.9,"y":1.5,"fill":"versicolor"},{"x":3.9,"y":1.1,"fill":"versicolor"},{"x":5.5,"y":2.1,"fill":"virginica"},{"x":6.0,"y":2.5,"fill":"virginica"},{"x":5.8,"y":1.8,"fill":"virginica"},{"x":5.1,"y":1.9,"fill":"virginica"},{"x":6.1,"y":2.3,"fill":"virginica"},{"x":5.6,"y":2.1,"fill":"virginica"}],"code":{"point":"ggplot(df, aes(petal_length, petal_width, colour = group)) + geom_point(size = 2.5)"}}

Three species, three colored clouds. Setosa sits off on its own with tiny petals; versicolor and virginica crowd together, which is where the trouble will be.

=== step === concept
::eyebrow The setup
## One target, three answers

A **binary** classifier answers a yes/no question: churn or not, spam or not. A **multiclass** classifier picks exactly one label from three or more. We write \(K\) for the number of classes, so Maya's problem has \(K = 3\). Each seedling gets one label, never two.

Some models handle this out of the box. A decision tree, a random forest, or a multinomial logistic model looks at all three species at once and predicts one directly. Here is a forest doing exactly that on Maya's crate:

```r
library(randomForest)
set.seed(1)

# Maya's crate: 150 seedlings, each one of THREE species.
table(iris$Species)
#>     setosa versicolor  virginica
#>         50         50         50

# A random forest is natively multiclass: it predicts one of three labels directly.
rf <- randomForest(Species ~ ., data = iris)
head(predict(rf), 3)
#>      1      2      3
#> setosa setosa setosa
#> Levels: setosa versicolor virginica
```

But some of the most useful models are binary at heart. Plain logistic regression and the classic support vector machine each draw ONE boundary between two sides. To use them here, we have to break the three-class problem into two-class pieces. There are two standard ways to do that, and they are the heart of this lesson.

=== step === concept
::eyebrow The first recipe
## One-vs-rest: K yes/no models

The simplest trick is **one-vs-rest** (also called one-vs-all). Train one binary model per class, each asking a single yes/no question: "is this a setosa, or not?", "is this a versicolor, or not?", "is this a virginica, or not?". Three classes, three little models. To classify a new seedling, run all three and keep the class whose model is most confident.

The prediction is the class whose model gives the highest score: \( \hat{y} = \arg\max_{k}\, f_k(x) \), where \(f_k(x)\) is the probability the class-\(k\) model assigns to seedling \(x\), and \(k\) runs over the \(K\) classes. "Argmax" just means "the \(k\) that makes \(f_k\) largest".

::widget process-flow {"steps":[{"title":"3 species","sub":"one target, three possible labels"},{"title":"3 yes/no models","sub":"setosa vs rest, versicolor vs rest, virginica vs rest"},{"title":"3 scores","sub":"each model gives a probability for its own class"},{"title":"argmax","sub":"predict the class whose model is most confident"}]}

You can build it by hand with three ordinary logistic regressions. Watch the argmax stitch the three yes/no answers back into one three-way prediction:

```r
# One-vs-rest by hand: three yes/no logistic models, then keep the most confident.
classes <- levels(iris$Species)

models <- lapply(classes, function(cl) {
  is_class <- as.integer(iris$Species == cl)     # 1 for this species, 0 for the rest
  glm(is_class ~ Petal.Length + Petal.Width, data = iris, family = binomial)
})

scores <- sapply(models, function(m) predict(m, type = "response"))
colnames(scores) <- classes                      # P(setosa), P(versicolor), P(virginica)
pred <- classes[max.col(scores)]                 # argmax: the most confident class wins
table(predicted = pred, actual = iris$Species)
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         48         4
#>   virginica       0          2        46
```

Setosa is caught perfectly; versicolor and virginica trade a few mistakes, exactly the overlap you saw on the cover.

=== step === quiz
::eyebrow Check yourself
## Count the models

You are building a handwritten-digit recognizer with ten classes, the digits 0 through 9. Using **one-vs-rest**, how many binary classifiers do you train?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- 10, one per class, each asking "this digit vs all the others" ::ok Right. One-vs-rest trains exactly one yes/no model per class, so ten classes means ten models, and you predict the digit whose model is most confident.
- 45, one for every pair of digits ::no That is one-vs-ONE, which trains a model for each pair: with ten classes that is 45. One-vs-rest is one model per class, so 10.
- 1 model that outputs all ten at once ::no That would be a natively multiclass model like a random forest. One-vs-rest deliberately splits the job into separate binary models, one per class, giving 10.

=== step === concept
::eyebrow The second recipe
## One-vs-one: every pair votes

The other decomposition is **one-vs-one**. Instead of "each class against the world", train a model for every PAIR of classes: setosa vs versicolor, setosa vs virginica, versicolor vs virginica. Each model only ever sees its two classes. To predict, run all the pairwise models and let them vote; the class with the most wins takes the seedling.

How many models is that? One for each way to choose 2 classes out of \(K\):
\[ \binom{K}{2} = \frac{K(K-1)}{2} \]
For Maya's three species that is 3, the same as one-vs-rest. But the two recipes scale very differently as classes pile up:

| | One-vs-rest (OvR) | One-vs-one (OvO) |
|---|---|---|
| Models trained | \(K\) (one per class) | \(K(K-1)/2\) (one per pair) |
| For 3 species | 3 | 3 |
| For 10 classes | 10 | 45 |
| Each model trains on | all the data | only its two classes |
| Predict by | highest score (argmax) | majority vote |

[KEY INSIGHT]
One-vs-one trains many more models for large \(K\), but each one is smaller and faster because it sees only two classes of data, and each pairwise contest is often better balanced. One-vs-rest keeps the model count low but each model trains on everything. Most libraries pick one of these for you; it is worth knowing which.

=== step === tryit
::eyebrow Your turn
## How many pairwise models?

Suppose Maya adds a fourth species to the crate, so \(K = 4\). One-vs-one trains a model for every pair of classes. Fill in the blank with the count, using R as a calculator.

```r
# One-vs-one trains one model for every PAIR of classes.
# For a 4-class problem, how many pairwise models is that?
K <- 4
n_models <- ____
n_models
```
::check {"regex":"choose\\s*\\(\\s*(K|4)\\s*,\\s*2\\s*\\)|(K|4)\\s*\\*\\s*\\(?\\s*(K\\s*-\\s*1|3)\\s*\\)?\\s*/\\s*2|<-\\s*6\\b","gate":true,"difficulty":"beginner","ok":"Right: choose(4, 2) = 4 * 3 / 2 = 6 pairwise models. One-vs-rest would need only 4 here, one per class.","no":"Count the pairs: choose(K, 2), which is K * (K - 1) / 2. For K = 4 that is 6. Type choose(K, 2)."}
::solution
```r
K <- 4
n_models <- choose(K, 2)   # K * (K - 1) / 2 = 6 pairs
n_models
#> [1] 6
```

=== step === concept
::eyebrow How scoring changes
## The confusion matrix goes K-by-K

For a binary model the confusion matrix is a 2-by-2 grid: two ways to be right, two ways to be wrong. With \(K\) classes it becomes a \(K\)-by-\(K\) grid. The diagonal counts correct predictions; every off-diagonal cell tells you a specific mistake, which class was confused for which. Split the crate into training and test seedlings, fit a forest, and look:

```r
library(randomForest)
set.seed(1)

train_idx <- sample(nrow(iris), 100)   # 100 seedlings to learn from
train <- iris[train_idx, ]
test  <- iris[-train_idx, ]            # 50 held-out seedlings to score on

rf   <- randomForest(Species ~ ., data = train)
pred <- predict(rf, test)
cm   <- table(predicted = pred, actual = test$Species)
cm
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         18          0         0
#>   versicolor      0         15         2
#>   virginica       0          1        14
```

Read it like a map. Every setosa is caught (its row and column are clean). The only errors sit between versicolor and virginica: 2 true virginicas called versicolor, 1 true versicolor called virginica. A single accuracy number would hide exactly that: it would tell you "94% right" and never mention that all the trouble is on one pair.

=== step === concept
::eyebrow Reading it fairly
## Per-class metrics, then averaged

With more than two classes, precision and recall are computed **per class**, treating that class as "positive" and everything else as "negative". For class \(k\), recall is
\[ \text{recall}_k = \frac{TP_k}{TP_k + FN_k} \]
where \(TP_k\) is the number of true class-\(k\) seedlings the model caught and \(FN_k\) is the number it missed (called something else). So each class gets its own recall, its own precision.

To report a single headline number you average the per-class scores, and there are three honest ways to do it:

- **Macro** averages the per-class scores equally: \( \text{recall}_{\text{macro}} = \frac{1}{K}\sum_{k=1}^{K}\text{recall}_k \). Every class counts the same, whether it has 5 members or 5000.
- **Micro** pools the counts first: \( \text{recall}_{\text{micro}} = \frac{\sum_k TP_k}{\sum_k (TP_k + FN_k)} \). In a single-label problem this equals overall accuracy, so big classes dominate.
- **Weighted** is macro but each class is weighted by its size: \( \sum_k w_k\,\text{recall}_k \) with \( w_k = n_k / N \), where \(n_k\) is how many true class-\(k\) seedlings there are and \(N\) is the total.

Read all three straight off the confusion matrix:

```r
# Recall per class = correct / actually-that-class = diagonal / column total.
recall <- diag(cm) / colSums(cm)
round(recall, 2)
#>     setosa versicolor  virginica
#>       1.00       0.94       0.88

macro_recall <- mean(recall)             # every class weighted equally
round(macro_recall, 2)
#> [1] 0.94

micro_recall <- sum(diag(cm)) / sum(cm)  # pool all cases; equals overall accuracy
round(micro_recall, 2)
#> [1] 0.94
```

[KEY INSIGHT]
When classes are balanced, macro and micro look almost identical. They diverge when one class is rare: micro (and accuracy) are dominated by the big classes and stay high, while macro gives the rare class an equal vote and drops the moment the model neglects it. That is why macro-averaged recall is the number to watch on an imbalanced problem, the theme of the rest of this course.

=== step === quiz
::eyebrow Check yourself
## Which average tells the truth?

A fraud system sorts transactions into three classes: legit (9,000 cases), suspicious (900), and fraud (100). A lazy model nails legit but is hopeless on fraud. Which averaged recall will most clearly expose that failure?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Macro recall, the unweighted mean of the three per-class recalls ::ok Exactly. Macro gives fraud the same one-third weight as legit, so a class the model ignores drags the macro score down hard. Micro and weighted are ruled by the 9,000 legit cases and stay comfortably high.
- Micro recall, pooled over every transaction ::no Micro pools all cases, so the 9,000 legit transactions dominate the sum and hide the fraud failure. It stays high. Macro weights each class equally, which is what exposes fraud.
- Overall accuracy ::no Accuracy is also dominated by the huge legit class (about 90% of all cases), so it stays high and never reveals the fraud miss. Macro-averaged recall is what surfaces it.

=== step === widget
::eyebrow One more picture
## Per-class ROC

You met the ROC curve for binary problems: sweep the threshold and trace true-positive rate against false-positive rate. For multiclass you draw **one ROC per class**, using the same one-vs-rest idea: class \(k\)'s positives against every other class pooled as the negative. Averaging the per-class areas gives a single **macro-AUC**.

The widget below is one such curve, say "virginica vs the rest". Slide the threshold and watch the confusion counts and the operating point move, exactly as they would for any one of the \(K\) one-vs-rest curves you would draw for a multiclass model.

::widget roc-curve {}

Draw one of these for each class and you can see at a glance which class your model ranks well and which it struggles to separate, far more than a single AUC number ever tells you.

=== step === concept
::eyebrow Go deeper
## References

- [scikit-learn: Multiclass and multioutput algorithms](https://scikit-learn.org/stable/modules/multiclass.html) - a clear, language-agnostic reference on one-vs-rest and one-vs-one and when each is used.
- [yardstick: Multiclass averaging (tidymodels)](https://yardstick.tidymodels.org/articles/multiclass.html) - exactly how macro, micro and weighted averaging are computed on real R model output.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - classification, the confusion matrix, and sensitivity and specificity, gently explained.
- [Grandini, Bagli and Visani (2020), Metrics for Multi-Class Classification: an Overview](https://arxiv.org/abs/2008.05756) - a compact survey of every multiclass metric and averaging scheme in one place.

=== step === complete
## Lesson 1 complete

You can now take a problem with more than two classes and handle it end to end. One-vs-rest turns it into \(K\) yes/no models and predicts the argmax; one-vs-one trains \(K(K-1)/2\) pairwise models and votes; the confusion matrix grows to \(K\)-by-\(K\) and names every mistake; and precision and recall become per-class scores you combine with macro, micro or weighted averaging, macro being the one that refuses to let a rare class hide.

That last point is the doorway to the rest of this course. The moment one class is rare, accuracy and micro-averaging flatter a model that quietly ignores it. Next, Lesson 2: Class Imbalance and Resampling, where you will fix that with under-sampling, over-sampling and SMOTE, applied without leaking into your evaluation.
