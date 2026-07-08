---
title: "Unsupervised Learning Lesson 6: Cluster Validation and Stability"
catalog_blurb: "How to tell whether the clusters you found are real, not just imposed."
description: "Validate clusters in R: the silhouette for cohesion and separation, the gap statistic versus a null, and bootstrap stability to judge whether clusters are real."
keywords: "cluster validation in R, silhouette, gap statistic, cluster stability, bootstrap clustering, choosing k, unsupervised learning, internal validation, are clusters real"
post_type: "LESSON"
curriculum_id: "6.9.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "6"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "t-SNE-and-UMAP.html"
course_prev: "Gaussian-Mixture-Models.html"
---

=== step === cover
::eyebrow Lesson 6 of 8
## Cluster Validation and Stability

Dr. Nadia, an entomologist, measured 150 beetles. For each one she wrote down two numbers with calipers: its body length and its antenna length, both in millimetres. She ran k-means, asked for three groups, and got three tidy clusters back. She is about to write "our beetles fall into three species" in her paper.

But here is the uncomfortable question this lesson answers: k-means would have handed her three tidy groups even if the beetles had no species at all. Finding clusters is easy; the algorithm always finds them. Knowing whether they are **real** is the hard part, and it is a separate job.

By the end of this lesson you will be able to:

- Explain why a tidy clustering is not evidence that the groups are real
- Score cohesion and separation with the **silhouette**, and use it to pick the number of clusters
- Test for structure at all with the **gap statistic**, which can vote "there are no clusters"
- Measure **stability** by resampling, and combine all three into an honest verdict

**Prerequisites:** the earlier lessons in this course, where you learned to run a clustering (k-means in Lesson 3, hierarchical and density in Lesson 4, Gaussian mixtures in Lesson 5). You should be comfortable running R and reading its output, and know what a mean, a standard deviation, a Euclidean distance, and a scatter plot are. No linear algebra is assumed; every symbol is defined as it appears.

::widget cluster-validate {}

The panel above previews the two curves you will learn to read: an elbow that bends at the right number of clusters, and silhouette bars that peak there. Move the slider to get a feel for them, then let us build the real thing on Nadia's beetles.

=== step === concept
::eyebrow Where we are
## Every method hands you clusters

Over the last three lessons you clustered data three different ways: k-means split it into round groups (Lesson 3), hierarchical and density methods found groups of other shapes (Lesson 4), and Gaussian mixtures gave soft, probabilistic memberships (Lesson 5). They disagree on the how, but they share one habit: **every one of them returns clusters, whatever you feed it.** Ask for three groups and you get three groups. The algorithm never says "actually, there are no groups here."

So the real question, and the whole subject of this lesson, is: once you have a clustering, how do you know it reflects real structure in the data rather than lines the algorithm drew through a shapeless cloud?

Let us meet Nadia's data. We simulate the beetles as three species so that, at the very end, we can check the verdict against the truth. Real data never comes with an answer key, which is exactly why the validation tools in this lesson exist.

```r
# Dr. Nadia's 150 beetles: body length and antenna length, in millimetres.
set.seed(42)
blob <- function(n, body_mu, antenna_mu, spread)
  data.frame(body    = rnorm(n, body_mu,    spread),
             antenna = rnorm(n, antenna_mu, spread))
beetles <- rbind(blob(50,  9,  5.5, 0.8),   # small body, short antenna
                 blob(50, 15,  9.5, 0.9),   # large body, long antenna
                 blob(50, 10, 12.0, 0.9))   # small body, long antenna
beetles$body    <- round(beetles$body, 1)
beetles$antenna <- round(beetles$antenna, 1)
truth <- rep(c("A", "B", "C"), each = 50)   # the answer key; set aside until the end
head(beetles, 3)
#>   body antenna
#> 1 10.1     5.8
#> 2  8.5     4.9
#> 3  9.3     6.8
```

Because there are only two measurements, we can simply plot every beetle and look. How many groups do you see?

```r
library(ggplot2)
ggplot(beetles, aes(body, antenna)) +
  geom_point(size = 2, alpha = 0.8) +
  labs(x = "body length (mm)", y = "antenna length (mm)",
       title = "Nadia's 150 beetles - how many groups do you see?")
```

=== step === concept
::eyebrow The clustering
## Nadia asks for three groups

Nadia standardizes the two columns (so body length, which has bigger numbers, does not dominate the distance) and runs k-means for three clusters.

```r
# scale() puts each column on a mean-0, standard-deviation-1 footing.
x <- scale(beetles)
set.seed(1)
km <- kmeans(x, centers = 3, nstart = 25)   # ask for 3 groups
km$size                                      # how many beetles per group
#> [1] 50 50 50
```

Three clean groups of fifty. Coloured in, it looks convincing:

```r
library(ggplot2)
plotdf <- beetles
plotdf$cluster <- factor(km$cluster)
ggplot(plotdf, aes(body, antenna, colour = cluster)) +
  geom_point(size = 2) +
  labs(x = "body length (mm)", y = "antenna length (mm)",
       colour = "k-means group", title = "The three groups k-means returned")
```

That picture is exactly what makes clustering dangerous: it looks like a result. Before we believe it, we have to rule out the possibility that k-means would draw the same tidy picture on data with no groups at all.

=== step === concept
::eyebrow The trap
## The same three groups, from nothing

Let us feed k-means a **structureless cloud**: 150 points spread uniformly over the same two ranges, with no groups planted anywhere. If tidy output meant real groups, k-means should struggle here. It does not.

```r
# A cloud with NO structure: uniform over the same ranges as the beetles.
set.seed(7)
noise <- apply(x, 2, function(col) runif(150, min(col), max(col)))
kmn <- kmeans(noise, centers = 3, nstart = 25)$cluster
table(kmn)                     # three full groups, from data with no groups
#> kmn
#>  1  2  3
#> 57 47 46
```

```r
library(ggplot2)
noisedf <- as.data.frame(noise)
noisedf$cluster <- factor(kmn)
ggplot(noisedf, aes(body, antenna, colour = cluster)) +
  geom_point(size = 2) +
  labs(colour = "k-means group", title = "Three tidy groups, carved out of pure noise")
```

[KEY INSIGHT]
k-means partitioned a shapeless cloud into three neat regions that look just as convincing as Nadia's. A clustering is not evidence of structure. Something has to test the structure independently, and that is what the rest of this lesson builds.

=== step === quiz
::eyebrow Check yourself
## What can you conclude?

You run k-means with `centers = 3` on a dataset and get three clean-looking groups of roughly equal size. Based on that alone, what can you conclude?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There are three real groups in the data ::no That is the exact trap. k-means returns three groups on ANY data, including the structureless cloud you just saw. Tidy output is not evidence.
- Nothing yet: k-means returns k groups on any data, even noise, so the tidiness has to be validated before you trust it ::ok Right. The clustering is a hypothesis, not a finding. Silhouette, the gap statistic, and stability are the tests that turn it into one.
- The clustering failed, because real groups never come out this evenly ::no Even sizes are not a failure signal. The point is the opposite: k-means produces clean, balanced-looking groups even when none exist.

=== step === concept
::eyebrow Check 1: quality
## Silhouette: is each point in the right group?

The first tool asks, for **every single beetle**, a simple question: is it closer to the beetles in its own group than to the beetles in the nearest neighbouring group? A point that sits snugly inside its own group and far from every other group is well clustered. A point wedged on a border is not.

To make that precise we need two average distances for a beetle \(i\):

- \(a(i)\) = the average distance from beetle \(i\) to the **other beetles in its own cluster**. Small \(a(i)\) means its group is tight around it (good **cohesion**).
- \(b(i)\) = the average distance from beetle \(i\) to the beetles of the **single nearest other cluster**. Large \(b(i)\) means the next group is far away (good **separation**).

[KEY INSIGHT]
A well-clustered point has small \(a(i)\) and large \(b(i)\): close to its own, far from the rest. The silhouette is just the gap between those two, scaled so it always lands between -1 and +1.

=== step === concept
::eyebrow The formula
## The silhouette score, shown on a point

Rousseeuw's silhouette combines those two distances into one number for each point:

\[ s(i) = \frac{b(i) - a(i)}{\max\{\,a(i),\, b(i)\,\}} \]

The numerator \(b(i) - a(i)\) is "how much farther the nearest other group is than my own group." Dividing by the larger of the two, \(\max\{a(i), b(i)\}\), pins the result to the range \(-1 \le s(i) \le 1\). Read it like this: near **+1** the point is deep inside its own cluster; near **0** it sits on the border between two clusters; **negative** means it is actually closer to a neighbouring cluster than to its own, a sign it was probably put in the wrong group.

Rather than take that on faith, compute it on two concrete points. First, a beetle that is comfortably in its own group:

```r
a <- 0.5      # average distance to its OWN cluster (close)
b <- 2.0      # average distance to the NEAREST other cluster (far)
(b - a) / max(a, b)
#> [1] 0.75
```

A score of 0.75: firmly in its own cluster. Now a beetle that is closer to a neighbour than to its own group:

```r
a <- 2.0      # far from its own cluster
b <- 0.8      # but close to a neighbouring one
(b - a) / max(a, b)
#> [1] -0.6
```

A negative score. This point is almost certainly assigned to the wrong cluster. Averaging \(s(i)\) over every point gives the **average silhouette width**, a single 0-to-1 score for the whole clustering.

=== step === tryit
::eyebrow Your turn
## Complete the silhouette

A beetle sits on average 0.6 units from its own cluster and 1.8 units from the nearest other cluster. Fill in the **denominator** of the silhouette so the score stays between -1 and 1, then check it.

```r
a <- 0.6   # distance to its own cluster
b <- 1.8   # distance to the nearest other cluster
(b - a) / ____
```
::check {"regex":"max\\(\\s*a\\s*,\\s*b\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right: you divide by max(a, b), the larger of the two averages. That is what keeps the silhouette pinned between -1 and 1.","no":"The silhouette divides by max(a, b), the LARGER of the two average distances, not by a + b and not by b alone. That scaling keeps s(i) in the -1 to 1 range."}
::solution
```r
a <- 0.6
b <- 1.8
(b - a) / max(a, b)
#> [1] 0.6666667
```

=== step === concept
::eyebrow On the real data
## Silhouette on Nadia's beetles

Now compute it from scratch on the actual clustering. `dist(x)` gives every pairwise distance; the helper turns those into \(a(i)\), \(b(i)\), and \(s(i)\) for each beetle.

```r
D  <- as.matrix(dist(x))     # 150 x 150 matrix of distances between beetles
cl <- km$cluster

sil_one <- function(i, cl) {
  own <- cl == cl[i]
  a <- mean(D[i, own & (seq_along(cl) != i)])                 # dist to own cluster
  b <- min(sapply(setdiff(unique(cl), cl[i]),                 # nearest other cluster
                  function(g) mean(D[i, cl == g])))
  (b - a) / max(a, b)
}
s <- sapply(seq_along(cl), sil_one, cl = cl)
round(mean(s), 3)            # average silhouette width for the whole clustering
#> [1] 0.734
```

An average width of 0.734 is strong (Rousseeuw's rough guide: above 0.7 is strong structure, 0.5 to 0.7 reasonable, below 0.25 essentially none). It is worth looking per cluster too, because one weak group can hide inside a good average:

```r
round(tapply(s, cl, mean), 2)   # average silhouette within each cluster
#> 1    2    3
#> 0.74 0.69 0.77
```

All three groups are cohesive. Compare that with the noise cloud, where the same computation gives an average width around 0.38: weak, and exactly what a clustering imposed on structureless data looks like.

=== step === widget
::eyebrow Feel it
## Move k, watch both curves

Here are the two curves you will use to choose the number of clusters, on a worked example. The **elbow** (total within-cluster spread) drops steeply while extra clusters are still capturing real structure, then flattens once you are just splitting hairs. The **silhouette** rises to a peak at the natural number of groups, then falls. Drag the slider and watch where they agree.

::widget cluster-validate {}

=== step === concept
::eyebrow Choosing k
## Let the curves pick the number of groups

Two numbers, read across a range of `k`, tell you how many clusters to keep. First the **elbow**: total within-cluster spread \(W_k\) always falls as `k` rises (more centres always fit tighter), so you look for the `k` where it stops falling *sharply*.

```r
set.seed(1)
wss <- sapply(1:6, function(k) kmeans(x, centers = k, nstart = 10)$tot.withinss)
round(wss, 1)
#> [1] 298.0 128.8  28.7  24.7  21.2  18.1
```

The drop from k=2 to k=3 is huge (129 down to 29), and after k=3 it barely moves. The bend is at three. Now the silhouette across the same range: it should **peak** at the right `k`.

::widget chart-plotter {"data":[{"x":2,"y":0.573},{"x":3,"y":0.734},{"x":4,"y":0.596},{"x":5,"y":0.456},{"x":6,"y":0.325}],"geoms":["bar","point","line"],"x":"k","y":"avg_silhouette"}

The average silhouette width is highest at k=3 (0.734) and falls away on either side. Both curves agree, which is the reassuring case. When the elbow and the silhouette disagree, treat it as a warning that the number of groups is genuinely ambiguous.

=== step === quiz
::eyebrow Check yourself
## Reading a silhouette

A colleague clusters a different dataset and reports an average silhouette width of 0.15. What does that number tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The clusters are excellent and well separated ::no A width near 0.15 is close to zero, which means points sit almost as near a neighbouring cluster as their own. That is the opposite of well separated.
- The structure is weak and possibly artificial: points sit almost as close to a neighbouring cluster as to their own ::ok Exactly. On Rousseeuw's scale anything below about 0.25 signals little real structure. The clustering may just be lines through a cloud.
- Exactly 15% of the points are in the wrong cluster ::no The silhouette is an average of separation scores between -1 and 1, not a misclassification rate. It does not translate into a percentage of wrong assignments.

=== step === concept
::eyebrow Check 2: is there anything?
## The gap statistic: more structure than random?

The silhouette measures how good a clustering is, but it needs at least two clusters to compute, so it can never tell you the honest answer might be "there are no clusters here at all." For that you need a baseline: **how much would the within-cluster spread shrink just by chance, if the data had no structure?**

That is the idea behind the gap statistic. Cluster the real data and record \(\log W_k\). Then generate many fake datasets with **no** structure (points scattered uniformly over the same ranges), cluster each, and record their \(\log W_k\) too. If the real data has genuine groups, its spread shrinks *faster* than the structureless clouds' as `k` rises. The gap between them measures that head start.

- Big gap that grows then flattens: real structure, and the flattening point is a good `k`.
- Gap near zero at every `k`: the data clusters no better than random noise. There are no real groups.

=== step === concept
::eyebrow The formula
## The gap, precisely

Let \(W_k\) be the total within-cluster spread with `k` clusters, the same quantity as the elbow:

\[ W_k = \sum_{c=1}^{k} \; \sum_{i \in C_c} \lVert x_i - \bar{x}_c \rVert^2 \]

where \(C_c\) is cluster \(c\), \(\bar{x}_c\) is its centre, and \(\lVert x_i - \bar{x}_c \rVert^2\) is the squared distance from point \(i\) to that centre. The gap at `k` compares the real \(\log W_k\) to its average over the structureless reference datasets:

\[ \operatorname{Gap}(k) = \operatorname{E}^{*}_{n}\!\left[\log W_k\right] - \log W_k \]

Here \(\operatorname{E}^{*}_{n}[\log W_k]\) is that reference average (the star marks it as the null, no-cluster world). Because the reference is random, its average carries a standard error \(s_k\). Tibshirani's rule picks the smallest `k` that is already within one standard error of the next:

\[ \hat{k} = \text{the smallest } k \text{ with } \operatorname{Gap}(k) \ge \operatorname{Gap}(k+1) - s_{k+1} \]

In plain words: keep adding clusters only while the gap keeps climbing meaningfully; stop as soon as the next `k` fails to beat the current one by more than noise.

=== step === concept
::eyebrow On the real data
## The gap on beetles, then on noise

Compute it from scratch. `Wk()` is the within-cluster spread; `gap_ref()` averages \(\log W_k\) over `B` structureless clouds.

```r
Wk <- function(mat, k) {
  if (k == 1) return(sum(scale(mat, scale = FALSE)^2))   # k=1: spread about the mean
  sum(kmeans(mat, centers = k, nstart = 10)$withinss)
}
gap_ref <- function(mat, k, B = 20) {
  logW <- replicate(B, {
    ref <- apply(mat, 2, function(col) runif(nrow(mat), min(col), max(col)))
    log(Wk(ref, k))
  })
  c(mean = mean(logW), sd = sd(logW))
}
set.seed(1)
Wobs      <- sapply(1:6, function(k) Wk(x, k))
ref_stats <- sapply(1:6, function(k) gap_ref(x, k))
gap <- ref_stats["mean", ] - log(Wobs)
round(gap, 3)                                  # the gap at k = 1..6
#> [1] 0.276 0.569 1.581 1.310 1.258 1.160
```

The gap jumps to 1.58 at k=3 and then drifts down. Apply Tibshirani's rule:

```r
s_k  <- ref_stats["sd", ] * sqrt(1 + 1/20)      # standard error of the reference
which(gap[-6] >= (gap[-1] - s_k[-1]))[1]         # smallest k that beats the next
#> [1] 3
```

The gap picks three, agreeing with the elbow and the silhouette. Now the acid test: run the identical procedure on the structureless cloud from earlier.

```r
set.seed(1)
Wobs_n      <- sapply(1:6, function(k) Wk(noise, k))
ref_stats_n <- sapply(1:6, function(k) gap_ref(noise, k))
gap_n <- ref_stats_n["mean", ] - log(Wobs_n)
round(gap_n, 3)                                  # near zero everywhere
#> [1]  0.088  0.031 -0.016  0.031  0.059  0.021
s_kn <- ref_stats_n["sd", ] * sqrt(1 + 1/20)
which(gap_n[-6] >= (gap_n[-1] - s_kn[-1]))[1]     # the honest answer
#> [1] 1
```

On noise the gap hovers around zero and the rule votes **k = 1**: no real clusters. This is the one internal check that can say "there is nothing to cluster here." Plotting both makes the contrast obvious:

```r
plot(1:6, gap, type = "b", pch = 19, ylim = range(c(gap, gap_n)),
     xlab = "number of clusters k", ylab = "gap statistic",
     main = "Gap: real beetles vs a structureless cloud")
lines(1:6, gap_n, type = "b", pch = 19, col = "red")
legend("right", c("beetles", "noise"), col = c("black", "red"), pch = 19, lty = 1)
```

=== step === quiz
::eyebrow Check yourself
## When the gap says nothing

You run the gap statistic on a dataset and it is near zero at every `k`, and largest at k=1. What is the honest conclusion?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Report a single cluster as your main finding ::no "One cluster" is the gap's way of saying there are no groups, not a discovery to report. There is no structure to describe.
- The data has no real cluster structure: it clusters no better than a structureless cloud, so there is nothing to cluster ::ok Right. A flat, near-zero gap peaking at k=1 is precisely the "no clusters" verdict. Any k-means grouping here would be an artefact.
- The method failed; keep increasing k until the gap turns clearly positive ::no The gap did not fail, it answered. Forcing a larger k would manufacture groups that the data does not support.

=== step === concept
::eyebrow Check 3: does it hold up?
## Stability: would a different sample agree?

A clustering can look cohesive and still be fragile. Nadia collected 150 beetles, but she could just as easily have caught a slightly different 150. If her three groups are real, a slightly different sample should recover essentially the same groups. If they are an artefact, a new sample would carve the cloud up differently.

[KEY INSIGHT]
Real structure is reproducible. Stability asks: if I perturb the data a little, do the same clusters come back? Groups that survive resampling are trustworthy; groups that reshuffle every time are not.

The standard way to perturb without collecting new beetles is the **bootstrap**: draw a resample of the same size, with replacement, re-cluster it, and see how well the new clusters match the originals. Repeat many times and average.

=== step === concept
::eyebrow The measure
## Jaccard: how much do two groups overlap?

To compare an original cluster with a cluster from a resample, we need a number for "how much do these two sets of beetles overlap?" The **Jaccard similarity** is exactly that: the share of members they have in common out of all the distinct members between them.

\[ J(A, B) = \frac{\lvert A \cap B \rvert}{\lvert A \cup B \rvert} \]

Here \(\lvert A \cap B \rvert\) is the count of members in both sets and \(\lvert A \cup B \rvert\) is the count in either. It runs from 0 (no overlap) to 1 (identical). See it on two small sets:

```r
jaccard <- function(a, b) length(intersect(a, b)) / length(union(a, b))
jaccard(c(1, 2, 3, 4), c(3, 4, 5, 6))   # share {3,4}; 6 distinct in all -> 2/6
#> [1] 0.3333333
```

=== step === concept
::eyebrow On the real data
## Bootstrap stability, beetles vs noise

Cluster the full data once to get the reference groups. Then, many times over, resample the rows with replacement, re-cluster, and record each original cluster's **best Jaccard match** among the new clusters. The average, per cluster, is its stability.

```r
ref <- km$cluster
set.seed(1)
B    <- 40
stab <- matrix(NA, B, 3)
for (bb in 1:B) {
  idx  <- sample(nrow(x), replace = TRUE)                 # a bootstrap resample
  cl_b <- kmeans(x[idx, ], centers = 3, nstart = 10)$cluster
  for (g in 1:3) {
    members     <- which(ref[idx] == g)                   # resampled rows from cluster g
    stab[bb, g] <- max(sapply(1:3, function(h) jaccard(members, which(cl_b == h))))
  }
}
round(colMeans(stab), 2)     # mean Jaccard per cluster
#> [1] 1 1 1
```

All three beetle clusters score 1.0: every resample reproduces them exactly. Now the same on the noise cloud:

```r
set.seed(1)
ref_n  <- kmeans(noise, centers = 3, nstart = 25)$cluster
stab_n <- matrix(NA, B, 3)
for (bb in 1:B) {
  idx  <- sample(nrow(noise), replace = TRUE)
  cl_b <- kmeans(noise[idx, ], centers = 3, nstart = 10)$cluster
  for (g in 1:3) {
    members       <- which(ref_n[idx] == g)
    stab_n[bb, g] <- max(sapply(1:3, function(h) jaccard(members, which(cl_b == h))))
  }
}
round(colMeans(stab_n), 2)   # the noise "clusters" reshuffle every time
#> [1] 0.73 0.67 0.69
```

```r
barplot(rbind(beetles = colMeans(stab), noise = colMeans(stab_n)),
        beside = TRUE, ylim = c(0, 1), col = c("steelblue", "grey70"),
        names.arg = paste("cluster", 1:3), ylab = "bootstrap Jaccard stability",
        legend.text = c("beetles", "noise"),
        main = "Real clusters survive resampling; noise clusters drift")
abline(h = 0.75, lty = 2)
```

[NOTE]
Hennig's rough thresholds for bootstrap Jaccard: above **0.85** is highly stable, **0.75 to 0.85** is a valid, stable pattern, **0.6 to 0.75** indicates a pattern but with real doubt, and below **0.5** the cluster is "dissolved", not a real group. The beetle clusters are as stable as it gets; the noise clusters sit in the doubtful band and never settle.

=== step === quiz
::eyebrow Check yourself
## Reading a stability score

One cluster in your solution has a bootstrap Jaccard stability of 0.40. What does that mean?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The cluster is correct 40% of the time ::no Jaccard stability is not an accuracy. It measures how much the cluster overlaps with itself across resamples, not how often it is "right".
- The cluster dissolves under resampling: a different sample would not reproduce it, so it is not a trustworthy group ::ok Exactly. Below about 0.5 the group reshuffles every time you perturb the data. It reflects the sample, not a real structure.
- 40% of the cluster's points are outliers ::no The score says nothing about outliers within the cluster. It is about whether the whole cluster reappears when the data is resampled.

=== step === concept
::eyebrow Putting it together
## The four-question verdict

No single number decides whether clusters are real. You triangulate. Run these four questions in order, and let the weakest link govern your confidence.

::widget process-flow {"steps":[{"title":"Is there any structure?","sub":"gap statistic vs a random null; if it votes k=1, stop, there are no real clusters"},{"title":"How many groups?","sub":"the within-SS elbow and the peak of the average silhouette should agree on k"},{"title":"Are the groups cohesive?","sub":"average silhouette above ~0.5, and no cluster with a negative or tiny width"},{"title":"Do they survive resampling?","sub":"bootstrap Jaccard above ~0.75 is stable; below ~0.5 the cluster dissolves"}]}

For Nadia's beetles all four agree: the gap says structure exists and picks three, the elbow and silhouette both point to three, every cluster is cohesive, and every cluster is perfectly stable. That is a clustering you can defend. Because we simulated the data, we can now lift the lid and check against the answer key:

```r
table(km$cluster, truth)     # each found cluster is exactly one species
#>    truth
#>      A  B  C
#>   1  0 50  0
#>   2  0  0 50
#>   3 50  0  0
```

Every found cluster is one pure species. The validation was right, and on real data those four checks are all you would have.

=== step === quiz
::eyebrow Check yourself
## When the checks disagree

A clustering scores a healthy average silhouette of 0.68, but its bootstrap Jaccard stability is only 0.35. Do you trust the clusters?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: a silhouette above 0.5 already confirms the clusters are real ::no A good silhouette on one particular sample is not enough. Stability of 0.35 means those same cohesive-looking groups vanish when you resample, so the silhouette was a feature of this sample.
- No: stability below ~0.5 means the groups vanish under resampling, so the clustering is not trustworthy however good the silhouette looks on one sample ::ok Right. The weakest link governs. An unstable clustering describes the sample you happened to draw, not the population, no matter how clean it looks once.
- Yes, but only after increasing k ::no More clusters will not fix instability; it usually makes it worse. The signal here is that the structure is not reproducible.

=== step === concept
::eyebrow Know the limits
## Where these tools break

The three checks are powerful, but they carry assumptions, and knowing them keeps you honest.

[WARNING]
The elbow, the silhouette, and the standard gap statistic all lean on **compact, roughly round clusters** measured by Euclidean distance. On elongated, curved, or nested shapes (the kind DBSCAN finds), a low silhouette can be misleading rather than damning, so pair these indices with a density-aware check. None of them is proof: they are evidence that, together, make a clustering defensible. And validation never rescues structureless data, it only tells you it is structureless, which is itself a valuable finding.

In practice you would not hand-roll these computations. The `cluster` and `fpc` packages provide them directly (run this in a full local R session):

```r-static
library(cluster)
sil <- silhouette(km$cluster, dist(x))       # per-point silhouette widths
summary(sil)$avg.width                       # the average silhouette width
gp  <- clusGap(x, FUN = kmeans, nstart = 25, K.max = 6, B = 50)
maxSE(gp$Tab[, "gap"], gp$Tab[, "SE.sim"])    # the chosen k by the gap rule

library(fpc)
boot <- clusterboot(x, B = 50, clustermethod = kmeansCBI, k = 3)
boot$bootmean                                # per-cluster bootstrap Jaccard stability
```

Hand-rolling them once, as we did, is the best way to understand what those functions return.

=== step === concept
::eyebrow Go deeper
## References

- [Rousseeuw (1987), Silhouettes: a graphical aid to the interpretation and validation of cluster analysis](https://doi.org/10.1016/0377-0427(87)90125-7) - the original silhouette, with the cohesion-vs-separation reasoning.
- [Tibshirani, Walther & Hastie (2001), Estimating the number of clusters via the gap statistic (JRSS-B)](https://doi.org/10.1111/1467-9868.00293) - the gap statistic and the one-standard-error selection rule used here.
- [Hennig (2007), Cluster-wise assessment of cluster stability](https://doi.org/10.1016/j.csda.2006.11.025) - the bootstrap-Jaccard stability idea and its interpretation thresholds.
- [cluster: the R package](https://cran.r-project.org/package=cluster) - production `silhouette()` and `clusGap()`, the tools behind the from-scratch code.
- [fpc: the R package](https://cran.r-project.org/package=fpc) - `clusterboot()`, bootstrap cluster stability out of the box.

=== step === complete
## Lesson complete

You can now tell a real clustering from an imposed one. You saw that every algorithm returns clusters even on pure noise, so a tidy result is a hypothesis, not a finding. Then you built the three tests that turn it into one: the **silhouette** (is each point closer to its own group than to the nearest other?), the **gap statistic** (does the data cluster better than a structureless cloud, and is the honest answer maybe "no"?), and **bootstrap stability** (do the groups survive resampling?). The four-question verdict combines them, and the weakest link decides.

Next, Lesson 7: t-SNE and UMAP. So far you have clustered and validated in the raw coordinate space. These nonlinear maps squeeze high-dimensional data onto a flat picture where clusters can leap out at the eye, along with some seductive traps in reading them that your new validation instincts will help you avoid.
