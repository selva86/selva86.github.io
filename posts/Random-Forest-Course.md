---
title: "Random Forests in R: A Hands-On Interactive Course"
slug: "Random-Forest-Course"
description: "Learn random forests from the ground up in three interactive lessons: decision trees, bagging and decorrelation, and tuning a real forest in R with out-of-bag error."
keywords: "random forest course, random forest R, decision tree, bagging, OOB error, mtry, ranger, interactive"
mathjax: false
webr: false
date: "2026-06-23"
curriculum_id: "6.3.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Random Forests (Course)"
sidebar_order: "30"
---

# Random Forests in R: A Hands-On Interactive Course

<p class="lead">Random forests are the strongest model you can train with almost no tuning. This three-lesson interactive course builds one from the ground up: what a decision tree is, why averaging many of them works, and how to train, tune and read a real forest in R.</p>

Most tutorials start at "call this function." This course starts one level deeper, with the single decision tree a forest is made of, and builds up until you can train and tune a forest with confidence and know exactly why every piece is there.

Each lesson is a guided, interactive experience: you drive live models in the browser, answer checkpoints, and write R as you go.

## The three lessons

### Lesson 1: The building block, Decision Trees

How a tree splits data, how to grow one in R, and a live demo where you raise a tree's depth and watch it overfit before your eyes. This is the flaw the whole forest exists to fix.

[Start Lesson 1: Decision Trees](RF-Course-Lesson-1.html)

### Lesson 2: From one tree to a forest

Why averaging many noisy trees cancels their errors, how bootstrap samples make trees differ, and the random-feature trick that makes a random forest beat plain bagging. You will drag a slider and watch a jagged boundary smooth into an accurate one.

[Start Lesson 2: Bagging and decorrelation](RF-Course-Lesson-2.html)

### Lesson 3: Train, tune and read a forest in R

Out-of-bag error (a free test set), tuning mtry and the number of trees on a live forest, reading variable importance, and the ranger code to do it for real. Ends with the path to your Machine Learning certificate.

[Start Lesson 3: Training and tuning in R](RF-Course-Lesson-3.html)

## Who this is for

You are comfortable running R and know what a training and test set are. You do not need any prior machine learning. By the end you will understand random forests well enough to use them on your own data and to explain, precisely, why they work.

## What you will be able to do

- Explain how a decision tree chooses its splits and why a single deep tree overfits
- Describe how bootstrap sampling and random feature selection decorrelate the trees
- Train a random forest in R, read its out-of-bag error, and tune mtry and the number of trees
- Read variable importance and recognise where random forests are the wrong tool

Ready? [Begin with Lesson 1](RF-Course-Lesson-1.html).
