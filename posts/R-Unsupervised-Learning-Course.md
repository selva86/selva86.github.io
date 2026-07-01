---
title: "Unsupervised Learning in R: A Hands-On Course"
slug: "R-Unsupervised-Learning-Course"
description: "Learn unsupervised learning in R across eight interactive lessons: PCA, factor analysis, k-means, hierarchical and density clustering, mixture models, cluster validation, t-SNE and UMAP, and association rules."
keywords: "unsupervised learning in R, PCA, factor analysis, k-means, hierarchical clustering, DBSCAN, gaussian mixture models, cluster validation, t-SNE, UMAP, association rules, dimensionality reduction, interactive course"
mathjax: false
webr: false
date: "2026-07-01"
curriculum_id: "6.90.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Unsupervised Learning (Course)"
sidebar_order: "90"
---

# Unsupervised Learning in R: A Hands-On Course

<p class="lead">Most data arrives without labels. This eight-lesson interactive course teaches unsupervised learning in R from the ground up: how to compress many correlated columns into a few meaningful directions, how to find the natural groups hiding in your data, and how to tell a real pattern from noise. You run live R in the browser at every step.</p>

Supervised learning has a teacher: every row comes with the right answer, and the model learns to match it. Unsupervised learning has none. You hand the machine a table with no target column and ask a harder question: what is the structure here? Which variables move together, which rows belong together, and how many groups are there really? The answers are not graded against a truth column, which is exactly what makes this the part of machine learning where it is easiest to fool yourself.

This course builds the judgment to do it honestly. You will reduce a wide dataset to the few dimensions that carry the signal, cluster rows four different ways and understand when each fits, and then validate what you found so a "cluster" is a real group and not an artifact of the algorithm. The recurring discipline is skepticism: every method will happily return an answer on pure noise, so the skill is knowing when to believe it.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints, and write code as you go.

## The eight lessons

### Lesson 1: PCA in R

Many columns, mostly telling the same story. Principal component analysis compresses correlated variables into a few directions that capture most of the variation. Learn what a principal component is, why you scale first, and how to read variance explained, a scree plot and a biplot.

[Start Lesson 1: PCA in R](Principal-Component-Analysis.html)

### Lesson 2: Factor Analysis

PCA finds directions of variance; factor analysis asks a different question: what hidden factors could have produced these correlations? Learn the factor model, communalities and uniqueness, running `factanal` to read loadings, and exactly how it differs from PCA.

[Start Lesson 2: Factor Analysis](Factor-Analysis.html)

### Lesson 3: k-Means and Choosing k

The workhorse clustering method, and its one hard question. Learn how k-means assigns and updates clusters, why you standardize first, and how to choose k with the elbow and silhouette instead of guessing.

[Start Lesson 3: k-Means and Choosing k](k-Means-and-Choosing-k.html)

### Lesson 4: Hierarchical and Density Clustering

k-means assumes round, similar-sized blobs. Real groups are not always so tidy. Learn hierarchical clustering and the dendrogram, and DBSCAN, which finds arbitrary shapes and calls out noise instead of forcing every point into a group.

[Start Lesson 4: Hierarchical and Density Clustering](Hierarchical-and-Density-Clustering.html)

### Lesson 5: Gaussian Mixture Models

Hard clusters draw a hard line; real membership is often a matter of degree. Learn mixture models, where each point gets a probability of belonging to each cluster, and how soft assignment fixes what k-means gets wrong on overlapping groups.

[Start Lesson 5: Gaussian Mixture Models](Gaussian-Mixture-Models.html)

### Lesson 6: Cluster Validation and Stability

Every clustering algorithm returns clusters, even on random noise. Learn to validate what you found: the silhouette and gap statistic for how many groups are real, and stability checks so a cluster survives a small change to the data.

[Start Lesson 6: Cluster Validation and Stability](Cluster-Validation-and-Stability.html)

### Lesson 7: t-SNE and UMAP

The modern way to see high-dimensional data on a flat screen. Learn how t-SNE and UMAP lay out neighbors, the traps that make them easy to misread (cluster sizes and distances mean less than they look), and how to use them without over-trusting the picture.

[Start Lesson 7: t-SNE and UMAP](t-SNE-and-UMAP.html)

### Lesson 8: Association Rules and Market Basket

Which items get bought together? Learn association-rule mining from scratch: support, confidence and lift, how to read a rule, and why lift keeps you from being fooled by items that are simply popular.

[Start Lesson 8: Association Rules and Market Basket](Association-Rules-and-Market-Basket.html)

## Who this is for

You can run R and read its output, and you have worked with a data frame of numeric columns. You do not need any prior clustering or dimensionality-reduction experience: every idea is built from scratch as it arrives. Having once stared at a wide dataset and wondered where to even start helps you feel why this matters.

## What you will be able to do

- Reduce a wide, correlated dataset to a few meaningful directions with PCA and factor analysis, and read the diagnostics
- Cluster data four ways (k-means, hierarchical, density-based and mixture models) and know which one fits a given shape
- Choose the number of clusters with the elbow, silhouette and gap statistic instead of guessing
- Validate a clustering so you can tell a real group from an artifact of the algorithm
- Visualize high-dimensional data with t-SNE and UMAP without misreading the map
- Mine association rules and read support, confidence and lift correctly

Ready? [Begin with Lesson 1](Principal-Component-Analysis.html).
