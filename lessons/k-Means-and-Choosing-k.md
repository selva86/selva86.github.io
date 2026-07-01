---
title: "Unsupervised Learning Lesson 3: k-Means and Choosing k"
catalog_blurb: "How k-means groups similar rows, and how to choose the number of groups."
description: "Learn k-means clustering in R from scratch: what it minimises, Lloyd's algorithm step by step, scaling and nstart, and choosing k with the elbow and silhouette."
keywords: "k-means in R, kmeans, clustering, Lloyd's algorithm, within-cluster sum of squares, elbow method, silhouette, choosing k, unsupervised learning, standardize"
post_type: "LESSON"
curriculum_id: "6.9.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "3"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "Hierarchical-and-Density-Clustering.html"
course_prev: "Factor-Analysis.html"
---

=== step === cover
::eyebrow Lesson 3 of 8
## k-Means and Choosing k

Lessons 1 and 2 worked on the columns: PCA and factor analysis both took the measured variables and boiled them down. This lesson turns the table on its side and works on the rows, the individual people.

Meet Maria. She runs a small neighbourhood coffee shop, and over the last few months she has quietly logged two numbers for each of her 90 regular customers: how many times they visit per month, and how much they spend on an average visit. She suspects her regulars are not all alike, that a handful of loyal devotees behave nothing like the once-in-a-while crowd, and she wants to build loyalty tiers around those groups. But nobody labelled her customers for her. She does not know how many tiers there are, or who belongs in each.

k-means is the machine that finds those groups from the two numbers alone. Choosing k is how she decides how many tiers to make. The panel below runs k-means on a small demo cloud so you can watch it work; Maria's data behaves exactly the same way.

By the end of this lesson you will be able to:

- Say what clustering is and what k-means is trying to make tight
- Follow Lloyd's algorithm, the two-move loop k-means runs, and grow the clusters yourself in R
- Choose k with the elbow and the silhouette, and know when there is no honest answer

**Prerequisites:** you can run R and read its output, and you have done [Lesson 1 on PCA](Principal-Component-Analysis.html) and [Lesson 2 on factor analysis](Factor-Analysis.html) (scaling a variable, reading a scatter plot). No new maths is assumed; every symbol is defined as it appears.

::widget kmeans-cluster {"k":3}

=== step === concept
::eyebrow The goal
## What makes a grouping tight

Clustering means sorting rows into groups so that members of a group resemble each other and differ from the other groups. It is unsupervised: unlike churn or a test score, nobody hands you the right answer, so the data itself has to reveal the groups.

To make "resemble" precise, k-means measures the straight-line distance between two customers. For customers \(x_i\) and \(x_j\) described by features \(f\) (here visits and spend), the Euclidean distance is

\[ d(x_i, x_j) = \sqrt{\sum_f (x_{if} - x_{jf})^2} \]

which is just the length of the line between their two dots on Maria's scatter plot. Each group is summarised by its centroid \(\mu_c\), the average customer of that group: \(\mu_c = \frac{1}{|C_c|}\sum_{i \in C_c} x_i\), where \(|C_c|\) is how many customers are in group \(c\).

Now the whole objective in one line. A grouping is good when every customer sits close to their own group's centroid. k-means scores that with the within-cluster sum of squares (WCSS): add up the squared distance from every point to its centroid, across all \(k\) groups.

\[ W = \sum_{c=1}^{k} \sum_{i \in C_c} \lVert x_i - \mu_c \rVert^2 \]

[KEY INSIGHT]
k-means has exactly one goal: choose the k centroids, and the assignment of points to them, that make W (the total within-cluster spread) as small as possible. Tight groups mean a small W.

=== step === widget
::eyebrow The algorithm
## Lloyd's algorithm, one move at a time

Finding the split that truly minimises W is hard: there are astronomically many ways to divide 90 customers into 3 groups. So k-means uses a beautifully simple loop, called Lloyd's algorithm, that improves W a little at a time. Drop k centroids anywhere to start, then repeat two moves:

1. **Assign:** attach every point to its nearest centroid. That carves the space into k groups.
2. **Update:** move each centroid to the mean of the points now assigned to it.

Press **step** below to alternate the two moves and watch the within-SS number fall. After a few rounds the centroids stop moving: no point wants to switch groups, so assigning and updating change nothing. That settled state is the answer.

::widget kmeans-cluster {"k":3}

[WARNING]
Each round can only lower W or leave it unchanged, so the loop always stops. But it stops at a local optimum, the best grouping near wherever the centroids happened to start, which is not always the best grouping overall. Start them badly and you can settle on a poor split. The fix is to run the whole thing several times from different random starts and keep the lowest-W result. In R that is the `nstart` argument, and you should always set it.

=== step === quiz
::eyebrow Check yourself
## Why scale first?

Maria's visits run from about 1 to 24, while spend runs from about $3 to $10. Before clustering, the standard advice is to standardise both columns to a common scale. Why does that matter for k-means?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It makes the algorithm converge in fewer iterations ::no Scaling is not about speed. Even if it changed the iteration count, that would not be the reason: the real danger is a distorted distance.
- Because distance adds up each feature's difference, the feature with the larger numeric range would dominate, so k-means would cluster almost entirely on that one feature ::ok Exactly. Euclidean distance squares the raw differences, so a feature measured in bigger units swamps the others. Standardising gives visits and spend an equal say.
- Scaling guarantees the three clusters come out the same size ::no Nothing forces equal-size clusters, and scaling does not either. It only makes the features comparable so no single one dominates the distance.

=== step === tryit
::eyebrow Your turn
## Cluster Maria's customers in R

Each lesson runs in its own fresh R session, so we build Maria's data right here. We secretly stack three groups, then drop the labels, exactly the situation Maria is in: she sees only the two numbers, and k-means has to rediscover the groups.

```r
set.seed(42)
# visits = coffees per month; spend = average dollars per visit
make_group <- function(n, v, s) data.frame(
  visits = round(pmax(rnorm(n, v, 1.6), 1), 1),
  spend  = round(pmax(rnorm(n, s, 0.5), 1), 2)
)
cafe <- rbind(make_group(30,  4, 4.2),    # occasional
              make_group(30, 13, 5.0),    # regulars
              make_group(30, 20, 8.8))    # devotees
cafe <- cafe[sample(nrow(cafe)), ]        # shuffle so row order hides the groups
rownames(cafe) <- NULL
nrow(cafe)
#> [1] 90
```

Now cluster them into three tiers. The one thing you must not forget: visits and spend are on different scales, so wrap the data in the function that standardises every column before the distance is computed. Fill in the blank.

```r
set.seed(1)                                  # nstart uses randomness; seed it for a repeatable result
km <- kmeans(____, centers = 3, nstart = 25) # 25 random starts, keep the best
km$size
```
::check {"regex":"scale\\s*\\(\\s*cafe","gate":true,"difficulty":"beginner","ok":"Right: scale(cafe) standardises both columns so visits and spend get an equal say in the distance.","no":"Wrap the data in scale(): kmeans(scale(cafe), centers = 3, nstart = 25)."}
::solution
```r
set.seed(1)
km <- kmeans(scale(cafe), centers = 3, nstart = 25)
km$size
#> [1] 30 30 30

# describe each tier back in real units (dollars and visits):
aggregate(cafe, by = list(tier = km$cluster), FUN = mean)
#>   tier visits spend
#> 1    1   20.0  8.79
#> 2    2    4.0  4.19
#> 3    3   13.0  5.01
```

k-means recovered the three tiers from the two numbers alone: occasional (about 4 visits a month), regulars (about 13), and devotees (about 20 visits at nearly $9 a cup). The tier numbers themselves are arbitrary labels; what matters is the three clean groups. Maria has her loyalty tiers.

=== step === concept
::eyebrow The catch
## You have to tell it k

Notice what you just did: you told k-means `centers = 3`. It never chose the number of tiers, you did. So the real question of this lesson is, how do you pick k when you do not already know it?

The tempting idea, "just try every k and keep the one with the smallest W", does not work, and it is worth seeing why. Add more centroids and every point can only get closer to its nearest one, so W falls at every step. Push it to the extreme: give each of the 90 customers their own centroid (\(k = 90\)) and W drops all the way to zero, a perfect score for a completely useless grouping.

\[ W(k{=}1) \; > \; W(k{=}2) \; > \; \dots \; > \; W(k{=}n) = 0 \]

[KEY INSIGHT]
Within-cluster spread always shrinks as k grows, so you can never pick k by minimising W. You have to look at HOW it shrinks, and that is the idea behind the elbow.

=== step === widget
::eyebrow Choosing k, part 1
## The elbow

Plot W against k and you get a curve that drops steeply at first, then flattens. The steep part is real structure: going from 1 group to 2 to 3 genuinely separates customers who belong apart. Once you pass the true number of groups, extra centroids only carve up already-tight groups, so the curve bends and crawls. That bend, the "elbow", is a good estimate of k.

Drag the k marker below along the curve. For data with three real groups the elbow sits at k=3: a sharp drop up to 3, a gentle slide after. Then switch to the silhouette view to preview the next idea.

::widget cluster-validate {}

The elbow is a judgement call, not a formula: sometimes the bend is obvious, sometimes it is soft. That is exactly why it helps to have a second, more quantitative opinion.

=== step === concept
::eyebrow Choosing k, part 2
## The silhouette: a score for separation

The silhouette turns "are these clusters well separated?" into a number you can compare across values of k. For one customer \(i\), let \(a(i)\) be their average distance to the other members of their own cluster (how snug the fit is), and \(b(i)\) their average distance to the members of the nearest OTHER cluster (how far the next-best group is). The silhouette width is

\[ s(i) = \frac{b(i) - a(i)}{\max\big(a(i),\, b(i)\big)} \]

It runs from \(-1\) to \(1\): near \(1\) means the point sits deep inside its own cluster and far from any other (a clean fit); near \(0\) means it lies on the border between two clusters; negative means it is probably in the wrong cluster. Average \(s(i)\) over everyone and you get one score for the whole clustering. To choose k, compute that average at several k and take the peak.

```r
library(cluster)                 # ships with R; provides silhouette()
x <- scale(cafe)                 # the same standardised data k-means saw
set.seed(1)
avg_sil <- sapply(2:6, function(k) {
  cl <- kmeans(x, centers = k, nstart = 25)$cluster
  mean(silhouette(cl, dist(x))[, "sil_width"])
})
names(avg_sil) <- 2:6
round(avg_sil, 2)
#>    2    3    4    5    6
#> 0.58 0.74 0.61 0.53 0.48
```

The average silhouette is highest at k=3, agreeing with the elbow. When the elbow and the silhouette point at the same k, you can trust it. When they disagree, treat k as genuinely uncertain and let what the tiers will be used for break the tie.

=== step === quiz
::eyebrow Check yourself
## When the elbow refuses to bend

You try the same recipe on a different dataset. The W-versus-k curve slides down smoothly with no clear bend, and the average silhouette never climbs above about 0.2 for any k. What is the most honest reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Keep increasing k until W finally drops to zero ::no W always reaches zero at k = n; that is the degenerate "everyone is their own cluster" case, never a real answer.
- The data has no strong cluster structure; k-means will still return k groups, but they are not genuinely separated ::ok Right. A smooth curve plus low silhouettes is the signature of data with no natural groups. k-means always returns SOMETHING, so it is on you to notice when that something is not real.
- The code is broken; a correct elbow is always sharp ::no Real elbows are often soft or absent. A missing bend is information about the data, not a bug.

=== step === concept
::eyebrow Know your tool
## Where k-means shines, and where it breaks

k-means is fast, simple, and scales to large data, which is why it is the first clustering tool most people reach for. But it makes strong assumptions, and knowing them is what keeps you from trusting a bad answer.

**Works well when**

- The groups are roughly round, similar in size, and similar in spread
- The features are scaled so distance is fair
- You have a defensible k from the elbow and the silhouette

**Breaks down when**

- The true clusters are elongated, nested, or crescent-shaped: k-means only cuts space into straight-edged, roughly spherical cells, so it splits those shapes wrongly
- Clusters have very different sizes or densities
- There are strong outliers: because centroids are means, a few extreme points drag them off target

[NOTE]
Two of those failures are exactly what Lesson 4 fixes. Hierarchical clustering builds a whole tree of nested groups instead of committing to one k, and DBSCAN finds clusters by density, so it can trace crescents and rings that k-means never could.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take k-means further:

- [An Introduction to Statistical Learning, chapter 12 (free PDF)](https://www.statlearning.com/) - k-means and clustering explained gently, with the algorithm in full.
- [The Elements of Statistical Learning, section 14.3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - cluster analysis and k-means as within-cluster variance minimisation, with the maths.
- [kmeans {stats}: the R function you used](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kmeans.html) - every argument, including nstart and the algorithm variants.
- [Rousseeuw (1987), Silhouettes, J. Computational and Applied Mathematics](https://doi.org/10.1016/0377-0427(87)90125-7) - the original paper that introduced the silhouette score.

=== step === complete
## Lesson 3 complete

You can now group unlabelled data from scratch. You saw what k-means minimises (the within-cluster spread W), ran Lloyd's two-move loop until it settled, and clustered Maria's 90 customers into three honest loyalty tiers, remembering to scale first and to use several random starts. Then you chose k the right way, reading the elbow and the silhouette together instead of chasing the smallest W, and you know the shapes that fool k-means.

Next, Lesson 4: Hierarchical and Density Clustering. When you do not want to fix k in advance, or your groups are shaped like crescents and rings, you need clustering that does not assume round blobs. You will build a dendrogram that shows every possible number of clusters at once, and meet DBSCAN, which finds groups by density.
