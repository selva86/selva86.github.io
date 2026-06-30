---
title: "Classification in R: A Hands-On Course"
slug: "R-Classification-Course"
description: "Learn classification in R from scratch in six interactive lessons: kNN, Naive Bayes, LDA and QDA, decision trees, decision boundaries, and how to read a classifier."
keywords: "classification in R, kNN R, naive bayes R, LDA QDA R, decision tree classifier, decision boundary, confusion matrix, precision recall, ROC curve, interactive course"
mathjax: false
webr: false
date: "2026-06-30"
curriculum_id: "6.30.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Classification (Course)"
sidebar_order: "30"
---

# Classification in R: A Hands-On Course

<p class="lead">Classification is the half of supervised learning that answers "which kind?" instead of "how much?": spam or not, churn or stay, benign or malignant. This six-lesson interactive course builds the main classifiers in R from the ground up, from the nearest-neighbor vote to the confusion matrix you use to judge any of them, with live diagrams you steer as you learn.</p>

Most tutorials hand you a `predict()` call and an accuracy number, then stop. The judgment lives in everything around that: knowing which classifier draws which kind of boundary, why a model that is 99% accurate can still be useless, and what to actually look at before you trust a prediction. This course teaches that judgment, one classifier at a time, with no black boxes.

This is the classification stop on the Data Scientist path. Each lesson is a guided, interactive experience: you manipulate live charts in the browser, answer checkpoints, and write and run R as you go.

## The six lessons

### Lesson 1: kNN and the Curse of Dimensionality

The most intuitive classifier of all: label a new case by the majority vote of its nearest neighbors. How to measure "nearest," why you must scale your features first, how to choose **k**, and why piling on more features eventually breaks distance itself.

[Start Lesson 1: kNN and the Curse of Dimensionality](kNN-and-the-Curse-of-Dimensionality.html)

### Lesson 2: Naive Bayes for Tabular and Text

Bayes' rule turned into a classifier, the "naive" independence assumption that makes it fast, and why it stays surprisingly accurate even when that assumption is plainly false. The classic choice for text and high-dimensional counts.

[Start Lesson 2: Naive Bayes for Tabular and Text](Naive-Bayes-for-Tabular-and-Text.html)

### Lesson 3: Discriminant Analysis (LDA and QDA)

Linear versus quadratic discriminant analysis, the Gaussian assumption each one leans on, and the shape of the boundary that assumption produces. When a straight divide is enough and when you need a curved one.

[Start Lesson 3: Discriminant Analysis (LDA and QDA)](Discriminant-Analysis-LDA-and-QDA.html)

### Lesson 4: Decision Trees for Classification

A single tree as a standalone classifier: recursive splits, impurity measured by Gini and entropy, growing and pruning with `rpart`, how to read the tree it produces, and why one tree overfits. The bridge to the ensemble methods.

[Start Lesson 4: Decision Trees for Classification](Decision-Trees-for-Classification.html)

### Lesson 5: Decision Boundaries and Model Geometry

What a classifier's boundary actually looks like, linear versus nonlinear, generative versus discriminative, and how the boundary you see reflects the assumptions baked into the model that drew it.

[Start Lesson 5: Decision Boundaries and Model Geometry](Decision-Boundaries-and-Model-Geometry.html)

### Lesson 6: Reading a Classifier

The confusion matrix and everything that comes from it: accuracy, precision, recall, and F1, plus ROC and PR curves and the threshold that ties them together. Why accuracy on its own can hide a broken model.

[Start Lesson 6: Reading a Classifier](Reading-a-Classifier.html)

## Who this is for

You can run R and read its output, and you know what a training set is and what a classifier does (the ML Workflow course). You do not need any prior classification background; every term is defined as it appears. By the end you will be able to fit the main classifiers in R, understand the boundary each one draws, and judge whether its predictions are any good.

## What you will be able to do

- Fit kNN, Naive Bayes, discriminant analysis, and decision trees in R, and say what each one assumes
- Explain why feature scaling and the number of dimensions change how a distance-based classifier behaves
- Recognize the boundary shape a given classifier draws, and pick a model whose geometry fits the problem
- Read a confusion matrix and choose the right metric, instead of trusting accuracy alone

Ready? [Begin with Lesson 1](kNN-and-the-Curse-of-Dimensionality.html).
