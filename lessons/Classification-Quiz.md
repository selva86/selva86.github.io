---
title: "Classification in R: Quiz"
description: "A short, graded check on the classification section: kNN, Naive Bayes, LDA and QDA, decision trees, decision boundaries, and reading a classifier."
keywords: "R quiz, classification, kNN, naive bayes, decision trees, confusion matrix, ds-classification"
post_type: "LESSON"
curriculum_id: "6.30.7"
webr: true
lesson_access: "pro"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Classification-Course.html"
lesson_kind: "quiz"
course_prev: "Reading-a-Classifier.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have worked through kNN and the curse of dimensionality, Naive Bayes, LDA and QDA, decision trees, decision boundaries, and how to read a classifier's scorecard. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## Choosing k
In k-nearest-neighbours, increasing k tends to:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Make the boundary more jagged and overfit. ::no That is *small* k; a single neighbour chases every point.
- Smooth the decision boundary, raising bias and lowering variance. ::ok Correct: averaging over more neighbours steadies the boundary.
- Have no effect on the boundary. ::no k is the main knob that sets how wiggly the boundary is.
- Always improve accuracy. ::no Too large a k washes out real structure and can hurt.

=== step === quiz
::eyebrow Question 2 of 6
## The curse of dimensionality
As the number of features grows, the problem for distance-based methods like kNN is that:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Points become nearly equidistant, so "nearest" loses meaning. ::ok Correct: in high dimensions distances concentrate, and the nearest neighbour is barely closer than the farthest.
- Distances can no longer be computed. ::no Distances compute fine; they just stop being informative.
- The model always overfits. ::no The issue is meaningless neighbourhoods, not guaranteed overfitting.
- Every feature becomes categorical. ::no Dimensionality does not change a feature's type.

=== step === quiz
::eyebrow Question 3 of 6
## Why "naive"
The "naive" in Naive Bayes is the assumption that:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The prior probabilities are all equal. ::no Priors can be unequal; that is not the naive part.
- The data is normally distributed. ::no Some versions use a normal likelihood, but that is not what "naive" names.
- Features are conditionally independent given the class. ::ok Correct: it multiplies per-feature likelihoods as if features never interact, which is rarely true but works well.
- The classes are balanced. ::no Balance is unrelated to the independence assumption.

=== step === quiz
::eyebrow Question 4 of 6
## LDA versus QDA
LDA produces a straight (linear) boundary while QDA produces a curved one because:
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- QDA uses more training data. ::no The difference is the covariance assumption, not the data size.
- LDA assumes all classes share one covariance; QDA lets each class have its own. ::ok Correct: a shared covariance gives a linear boundary; per-class covariances give a quadratic one.
- LDA can only handle two classes. ::no LDA handles many classes.
- QDA ignores the class means. ::no Both use the class means; they differ on covariance.

=== step === quiz
::eyebrow Question 5 of 6
## How a tree splits
A decision tree chooses each split by:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Greedily picking the split that most reduces impurity (for example Gini or entropy). ::ok Correct: at each node it takes the locally best split, one node at a time.
- Trying every possible whole tree and keeping the best. ::no That is computationally infeasible; trees grow greedily.
- Splitting on a randomly chosen feature every time. ::no Pure randomness is a feature of random forests, not a single tree's splits.
- Always splitting on the first column. ::no It evaluates candidate splits and picks the most informative.

=== step === quiz
::eyebrow Question 6 of 6
## Precision versus recall
Precision answers which question?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Of all real positives, how many did the model catch? ::no That is recall (sensitivity).
- What fraction of all predictions were correct? ::no That is accuracy.
- Of the cases the model flagged positive, how many truly are? ::ok Correct: precision is true positives divided by all predicted positives.
- How fast the model runs. ::no Precision is about correctness of positive calls, not speed.

=== step === concept
::eyebrow Run it: train a tree and read the matrix
## A classifier and its confusion matrix
Run this to grow a decision tree on `iris`, predict the species, and lay the predictions against the truth.

```r
library(rpart)
tree <- rpart(Species ~ ., data = iris)
pred <- predict(tree, iris, type = "class")
table(predicted = pred, actual = iris$Species)
```

The diagonal is correct calls; off-diagonal cells are the mistakes, and they show *which* species get confused.

=== step === concept
::eyebrow Run it: turn the matrix into accuracy
## One number from the matrix
Collapse the confusion matrix into a single accuracy score.

```r
round(mean(pred == iris$Species), 3)
```

Accuracy is a fine summary here because the three species are balanced; on skewed classes you would reach for precision and recall instead.

=== step === complete
## Section complete
Strong work. You can reason about kNN and high-dimensional distance, the Naive Bayes independence assumption, the LDA/QDA boundary difference, how trees split, and how to read a classifier through its confusion matrix. Next: trees and gradient boosting.
