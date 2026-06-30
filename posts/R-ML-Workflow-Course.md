---
title: "The Machine Learning Workflow in R: A Hands-On Course"
slug: "R-ML-Workflow-Course"
description: "Learn the machine learning workflow in R from scratch in four interactive lessons: frame the problem, the bias-variance tradeoff, honest evaluation without leakage, and your first end-to-end model."
keywords: "machine learning workflow R, framing a problem as ML, bias variance tradeoff, train validation test split, data leakage, end to end model R, supervised learning, interactive course"
mathjax: false
webr: false
date: "2026-06-30"
curriculum_id: "6.10.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "ML Workflow (Course)"
sidebar_order: "10"
---

# The Machine Learning Workflow in R: A Hands-On Course

<p class="lead">Machine learning is far more than fitting a model: it is the disciplined path from a fuzzy business question to an honest, reproducible prediction you can trust. This four-lesson interactive course teaches that whole workflow in R from the ground up, with one running example carried the whole way through.</p>

Most tutorials drop you straight into `lm()` or `randomForest()` and call that machine learning. The hard parts live on either side of that one line: deciding what to predict and why, choosing a model that neither underfits nor overfits, evaluating it without fooling yourself, and stitching it all into a script you can run again tomorrow. Get those right and the modeling really is almost mechanical.

This is the first stop on the Data Scientist path. Each lesson is a guided, interactive experience: you manipulate live diagrams in the browser, answer checkpoints, and write R as you go.

## The four lessons

### Lesson 1: Framing a problem as machine learning

Turn a plain business question ("who is about to stop buying?") into a well-posed supervised task: pick the target, the unit of analysis, the features known at prediction time, and the metric that matches the decision. The move that decides whether the whole project succeeds.

[Start Lesson 1: Framing a problem as machine learning](Framing-a-Problem-as-ML.html)

### Lesson 2: The bias-variance tradeoff

Underfitting and overfitting, seen as bias versus variance, and the U-shaped test-error curve that connects them. Slide a model from too simple to too flexible and watch why "more powerful" is not the same as "better."

[Start Lesson 2: The bias-variance tradeoff](The-Bias-Variance-Tradeoff.html)

### Lesson 3: Train, validation, test, and data leakage

Why you split data three ways, and the cardinal sin that quietly inflates almost every beginner's accuracy: leakage. Spot fitting on the test set, target leakage, and temporal leakage, and learn to evaluate honestly.

[Start Lesson 3: Train, validation, test, and data leakage](Train-Validation-Test-and-Data-Leakage.html)

### Lesson 4: Your first end-to-end model in R

One dataset from start to finish: split, fit, predict, evaluate, and make it all reproducible with a seed and a script. Ends with the path to your Data Scientist certificate.

[Start Lesson 4: Your first end-to-end model in R](Your-First-End-to-End-Model-in-R.html)

## Who this is for

You can run R and load a package with `library()`, and you have seen a data frame before. You do not need any prior machine learning experience. By the end you will be able to take a business question and turn it into a trained, honestly evaluated, reproducible model.

## What you will be able to do

- Frame a vague question as a supervised learning task with a clear target and metric
- Diagnose underfitting and overfitting through the lens of bias and variance
- Split data correctly and recognise the common forms of data leakage
- Fit, predict, and evaluate a model end to end in R, reproducibly

Ready? [Begin with Lesson 1](Framing-a-Problem-as-ML.html).
