---
title: "Unsupervised Learning in R: Quiz"
description: "A short, graded check on the unsupervised-learning section: PCA and factor analysis, k-means and choosing k, hierarchical and density clustering, mixture models, cluster validation, t-SNE and UMAP, and association rules."
keywords: "R quiz, unsupervised learning, PCA, k-means, DBSCAN, gaussian mixture, cluster validation, t-SNE, UMAP, association rules, lift, ds-unsupervised"
post_type: "LESSON"
curriculum_id: "6.9.9"
webr: true
lesson_access: "pro"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "9"
course_total: "9"
course_landing: "R-Unsupervised-Learning-Course.html"
lesson_kind: "quiz"
course_prev: "Association-Rules-and-Market-Basket.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have compressed correlated columns with PCA and factor analysis, clustered with k-means, hierarchical, density-based and mixture methods, chosen and validated the number of groups, mapped high-dimensional data with t-SNE and UMAP, and mined association rules. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## Why scale before PCA
You should usually standardize variables before running PCA because otherwise:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- PCA cannot run on more than two variables. ::no PCA handles many variables regardless of scaling.
- A variable measured in large units (say, salary in dollars) dominates the components purely because of its scale. ::ok Correct: PCA maximizes variance, and unscaled large-range variables carry the most raw variance.
- The components will always be uncorrelated. ::no Principal components are uncorrelated by construction, scaled or not; that is not the reason.
- It converts the data to categories. ::no Scaling keeps the data numeric.

=== step === quiz
::eyebrow Question 2 of 6
## Choosing k for k-means
k-means needs you to choose the number of clusters. A sound way to pick k is:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Always use k equal to the number of variables. ::no The number of clusters is unrelated to the number of columns.
- Pick whatever k gives the smallest total within-cluster sum of squares. ::no That always favors more clusters; k equal to n makes it zero.
- Look for an elbow in within-cluster variance and check the silhouette. ::ok Correct: these balance tightness against needless splitting instead of just minimizing scatter.
- Choose k at random and trust it. ::no Guessing defeats the purpose of validation.

=== step === quiz
::eyebrow Question 3 of 6
## What DBSCAN adds
Density-based clustering (DBSCAN) is useful because, unlike k-means, it:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Finds clusters of arbitrary shape and labels sparse points as noise, without a preset number of clusters. ::ok Correct: it grows clusters by density, so it handles rings and blobs and leaves outliers unassigned.
- Always produces perfectly round clusters. ::no Round, similar-sized blobs are the k-means assumption, not DBSCAN's strength.
- Requires you to specify the number of clusters up front. ::no DBSCAN infers the count from density, not a preset k.
- Guarantees every point belongs to a cluster. ::no It explicitly marks low-density points as noise.

=== step === quiz
::eyebrow Question 4 of 6
## Soft versus hard assignment
A Gaussian mixture model differs from k-means mainly because it:
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Requires the data to be one-dimensional. ::no Mixture models work in many dimensions.
- Gives each point a probability of belonging to each cluster instead of one hard label. ::ok Correct: a point on a boundary can be, say, 60% cluster A and 40% cluster B.
- Cannot model clusters of different sizes. ::no It can, via per-component variances and weights.
- Never needs the number of components chosen. ::no You still choose the number of components.

=== step === quiz
::eyebrow Question 5 of 6
## Clusters on noise
Running k-means on pure random noise will:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Return an error, since there are no clusters. ::no It runs happily and returns clusters anyway.
- Correctly report that there is no structure. ::no The algorithm has no way to say "none"; it always partitions.
- Still return k clusters that look real, which is why you validate with the silhouette or gap statistic. ::ok Correct: every algorithm returns clusters, so validation is what separates signal from artifact.
- Only work if the data is standardized. ::no Standardizing does not stop it from clustering noise.

=== step === quiz
::eyebrow Question 6 of 6
## Reading a t-SNE map
When interpreting a t-SNE or UMAP plot, you should remember that:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The size of a cluster and the distance between clusters are not reliable and can mislead. ::ok Correct: these methods preserve local neighbors, not global sizes or between-cluster distances.
- Distances on the map are exact real-world distances. ::no The layout distorts global distances by design.
- A bigger blob always means a more important cluster. ::no Blob size is largely an artifact of the algorithm's settings.
- The axes have meaningful units. ::no The axes carry no interpretable units.

=== step === concept
::eyebrow Run it: PCA and variance explained
## How much each component captures
Run PCA on the numeric iris columns (scaled) and read how much variance each component explains. The first one or two usually carry most of it.

```r
p <- prcomp(iris[, 1:4], scale. = TRUE)
round(summary(p)$importance[2, ], 3)   # proportion of variance per component
```

The first component alone captures the bulk of the variation, which is exactly why PCA lets you keep a few directions and drop the rest.

=== step === concept
::eyebrow Run it: k-means recovers the groups
## Clustering without labels
Run k-means with k = 3 on the iris measurements (ignoring the species label), then compare the clusters it found to the true species.

```r
set.seed(1)
km <- kmeans(scale(iris[, 1:4]), centers = 3, nstart = 10)
table(cluster = km$cluster, species = iris$Species)
```

Without ever seeing the labels, the clusters line up closely with the real species, though versicolor and virginica overlap, exactly the kind of ambiguity validation is meant to catch.

=== step === complete
## Section complete
Excellent. You can reduce dimensions with PCA and factor analysis, cluster four different ways, choose and validate the number of groups, read t-SNE and UMAP without being fooled, and mine association rules. Next: moving from patterns to causes.
