---
title: "Anomaly and Outlier Detection in R: A Course"
slug: "R-Anomaly-Detection-Course"
description: "Seven interactive R lessons on spotting the point that does not belong: isolation forests, local outlier factor, one-class SVM, autoencoders, and time-series anomaly detection."
keywords: "anomaly detection in R, outlier detection, isolation forest, extended isolation forest, local outlier factor, LOF, one-class SVM, autoencoder anomaly detection, time series anomaly detection, kernel PCA, sparse PCA, NMF, self-supervised learning, contrastive learning, base rate, precision recall, interactive course"
mathjax: false
webr: false
date: "2026-07-03"
curriculum_id: "6.200.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Anomaly Detection (Course)"
sidebar_order: "200"
---

# Anomaly and Outlier Detection in R: A Course

<p class="lead">One point in your data is not like the others, and the whole job is to find it before it costs you: a fraudulent charge, a failing sensor, a corrupt record, an input your model has never seen. This seven-lesson interactive course builds a detector for each way a point can betray itself, the base-rate trap and precision-recall, isolation forests, local outlier factor and one-class SVM, autoencoders, time-series anomalies, and kernel PCA, sparse PCA and NMF, each taught in R with live diagrams you steer as you learn.</p>

Most of machine learning learns what normal looks like from thousands of examples of it. Anomaly detection asks the opposite, harder question: which handful of points are not normal, when almost everything you hold is? The anomalies are rare, usually unlabeled, and each can be strange for a different reason, a value that is simply extreme, a point stranded in a low-density gap, or a reading that is only odd given its context. This course assembles a toolbox of detectors, one per failure mode, and pairs each with the honest question every real deployment forces: how many false alarms will you accept to catch the thing you care about?

This is the anomaly and unsupervised stop on the advanced Data Scientist path. Every runnable example is plain base R built up from first principles, so instead of calling a black-box function you watch the score take shape: path lengths, density ratios, reconstruction errors, residual bands. Every lesson is a guided, interactive experience: you steer live charts in the browser, answer checkpoints, and write and run R as you go. Every term is defined the moment it appears. The first lesson is free to try; the rest unlock with a subscription.

## The seven lessons

### Lesson 1: What Is an Anomaly?

Start where every detector should, with the definition. Separate the two ways a point can be unusual, far from the others (distance) or sitting in a sparse pocket while everything else crowds together (density), tell global, local and contextual outliers apart, and meet the base-rate trap: at a 1% anomaly rate a 99%-accurate flag is still mostly false alarms, which is exactly why precision and recall, not accuracy, are the score.

[Start Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html)

### Lesson 2: Isolation Forest and Extended Isolation Forest

Turn "hard to reach" into a number. Random axis-aligned splits fence an outlier off in far fewer cuts than a point buried in a crowd, so the average path length across many random trees becomes the anomaly score. Then see how the extended, oblique-split variant removes the axis-aligned bias that can fool the classic version.

[Start Lesson 2: Isolation Forest and Extended Isolation Forest](Isolation-Forest-and-Extended-Isolation-Forest.html)

### Lesson 3: Local Outlier Factor and One-Class SVM

Score how unusual a point is relative to its own neighbourhood. The Local Outlier Factor flags a point far sparser than the neighbours around it (LOF well above 1), catching a locally-sparse outlier that a single global cutoff walks straight past, while the one-class SVM learns a boundary wrapped around the normal region itself.

[Start Lesson 3: Local Outlier Factor and One-Class SVM](Local-Outlier-Factor-and-One-Class-SVM.html)

### Lesson 4: Autoencoders for Anomaly Detection

Use reconstruction error as the score. An autoencoder squeezed through a bottleneck rebuilds normal data well and off-manifold points poorly, so the size of the rebuild error is the flag. See why the linear case is exactly PCA, which turns the error into the distance to a learned subspace you can reason about.

[Start Lesson 4: Autoencoders for Anomaly Detection](Autoencoders-for-Anomaly-Detection.html)

### Lesson 5: Time-Series Anomaly Detection

Handle anomalies that only make sense in time order. Separate point, contextual and collective outliers, build a robust rolling-median and MAD control band that ignores the very spikes it is hunting, and strip trend and seasonality with STL decomposition so a large leftover residual is what raises the flag.

[Start Lesson 5: Time-Series Anomaly Detection](Time-Series-Anomaly-Detection.html)

### Lesson 6: Kernel PCA, Sparse PCA and NMF

Reach the structure plain PCA misses. Kernel PCA finds non-linear structure through an eigen-decomposition of a centered kernel matrix, sparse PCA trades a little variance for loadings you can actually read, and non-negative matrix factorization breaks data into additive, parts-based components that often map to something meaningful.

[Start Lesson 6: Kernel PCA, Sparse PCA and NMF](Kernel-PCA-Sparse-PCA-and-NMF.html)

### Lesson 7: Self-Supervised and Contrastive Learning

Learn useful features without a single label. Meet pretext tasks and the contrastive idea, pull two views of the same item together and push different items apart, and see why a well-spread, decorrelated representation hands every downstream detector, and your clustering, a better space to work in.

[Start Lesson 7: Self-Supervised and Contrastive Learning](Self-Supervised-and-Contrastive-Learning.html)

## Who this is for

You can run R and read its output, and you are comfortable with the basics of statistics: means, standard deviations, a covariance matrix, and reading a scatter of points. No prior anomaly-detection background is assumed, and because every method is built from scratch in base R, you see exactly what each score is measuring rather than trusting a package default. Data scientists, analysts and ML engineers who need to flag fraud, faults, novel inputs or bad records will get the most out of this, as will anyone who has been burned by a detector that cried wolf and wants to understand why.

## What you will be able to do

- Say what makes a point an anomaly, score "unusual" by both distance and density, and tell global, local and contextual outliers apart
- Sidestep the base-rate trap and judge a detector by precision and recall instead of a flattering accuracy number
- Build an isolation forest from random splits and read its path-length score, including the extended oblique-split variant
- Catch a locally-sparse outlier with the Local Outlier Factor and wrap the normal region with a one-class SVM
- Turn autoencoder reconstruction error (and its linear cousin, PCA) into an anomaly score you can threshold on purpose
- Flag point, contextual and collective anomalies in a time series with a robust MAD band and STL residuals
- Reach non-linear and parts-based structure with kernel PCA, sparse PCA and NMF, and build label-free features with self-supervised and contrastive learning

Ready? [Begin with Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html). It is free to try.
