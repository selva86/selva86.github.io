---
title: "The Machine Learning Workflow in R: Quiz"
description: "A short, graded check on the machine learning workflow section: framing, the bias-variance tradeoff, data leakage, and a first end-to-end model."
keywords: "R quiz, machine learning workflow, bias variance, data leakage, ds-ml-workflow"
post_type: "LESSON"
curriculum_id: "6.10.5"
webr: true
lesson_access: "free"
course_id: "ds-ml-workflow"
course_title: "The Machine Learning Workflow in R"
course_lesson: "5"
course_total: "5"
course_landing: "R-ML-Workflow-Course.html"
lesson_kind: "quiz"
course_prev: "Your-First-End-to-End-Model-in-R.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have framed a problem as machine learning, met the bias-variance tradeoff, learned how data leakage sneaks in, and built a first end-to-end model. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## What makes it supervised
A problem counts as *supervised* learning when:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- You have labelled examples: known target values to learn from. ::ok Correct: supervised learning maps inputs to a known target observed in the training data.
- You have no target and look for structure. ::no That describes unsupervised learning, like clustering.
- A human supervises the model while it trains. ::no The "supervision" is the labelled target, not a person watching.
- The data is fully numeric. ::no Supervised learning works with numeric or categorical features.

=== step === quiz
::eyebrow Question 2 of 6
## Reading the gap
A model scores 0.99 on the training set but 0.70 on the test set. This is a classic sign of:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- High bias (underfitting). ::no Underfitting scores poorly on both sets, not just the test set.
- High variance (overfitting). ::ok Correct: it memorised the training data and fails to generalise.
- A data loading bug. ::no The pattern (great train, weak test) is the textbook overfit signature.
- Too little training time. ::no More training would widen the gap, not close it.

=== step === quiz
::eyebrow Question 3 of 6
## Spot the leak
Which step leaks information and inflates your score?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Splitting into train and test before doing anything else. ::no That is exactly the right order.
- Fitting the model only on the training rows. ::no Correct practice, no leak.
- Scaling features using the mean and standard deviation of the whole dataset, then splitting. ::ok Correct: the scaler saw the test rows, so test performance is optimistic. Fit preprocessing on train only.
- Choosing the metric before you train. ::no Picking the metric up front is good discipline.

=== step === quiz
::eyebrow Question 4 of 6
## Why a held-out test set
You keep a test set you never tune on because:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- It gives an honest, unbiased estimate of performance on new data. ::ok Correct: once you tune on a set, its score is no longer unbiased, so the final test set stays untouched.
- It makes training faster. ::no Holding data out gives you less to train on, not faster training.
- Models cannot run without one. ::no A model trains fine; the test set is for honest evaluation.
- It guarantees the model is correct. ::no It estimates performance; it guarantees nothing.

=== step === quiz
::eyebrow Question 5 of 6
## Pick the task
Predicting whether a customer will churn (yes or no) is a:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Regression problem. ::no Regression predicts a continuous number, not a yes/no class.
- Classification problem. ::ok Correct: a categorical target (churn / no churn) is classification.
- Clustering problem. ::no Clustering has no target; here churn is a known label.
- Dimensionality reduction. ::no That compresses features; it does not predict a label.

=== step === quiz
::eyebrow Question 6 of 6
## The accuracy trap
On a dataset where 99% of cases are negative, a model that always predicts "negative" scores 99% accuracy. The lesson is:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Accuracy of 99% always means a great model. ::no Here it means a useless model that never finds a positive.
- You should delete the negative cases. ::no That throws away real data and distorts the problem.
- On imbalanced data, judge the model with precision, recall, or AUC, not accuracy. ::ok Correct: match the metric to the decision; accuracy hides failure on the rare class.
- Imbalance has no effect on metrics. ::no Imbalance is exactly why accuracy misleads here.

=== step === concept
::eyebrow Run it: split before you model
## A clean train/test split
Run this to split `mtcars` into train and test rows before any modelling, the order that prevents leakage.

```r
set.seed(1)
n <- nrow(mtcars)
train <- sample(n, round(0.7 * n))
cat("train rows:", length(train), " test rows:", n - length(train), "\n")
```

Splitting first means every later step (scaling, fitting) only ever sees the training rows.

=== step === concept
::eyebrow Run it: score on the held-out rows
## Honest evaluation
Fit on the training rows, then measure error on the test rows the model never saw.

```r
fit <- lm(mpg ~ wt + hp, data = mtcars[train, ])
pred <- predict(fit, mtcars[-train, ])
rmse <- sqrt(mean((mtcars$mpg[-train] - pred)^2))
round(rmse, 2)
```

That RMSE is an honest estimate because the test rows played no part in fitting.

=== step === complete
## Section complete
Strong work. You can frame a problem as supervised learning, read the bias-variance gap, keep data leakage out, and evaluate a model honestly. Next: regression, done properly.
