---
title: "Unsupervised Learning Lesson 3: k-Means and Choosing k"
catalog_blurb: "Group customers into segments, and decide how many groups the data supports."
description: "Learn k-means in R from scratch: how Lloyd's algorithm assigns points and moves centroids, why you standardize first, and how the elbow and silhouette choose k."
keywords: "k-means clustering in R, kmeans, Lloyd's algorithm, choosing k, elbow method, silhouette, within-cluster sum of squares, standardize, unsupervised learning, customer segmentation"
post_type: "LESSON"
curriculum_id: "6.9.3"
webr: true
mathjax: true
lesson_access: "pro"
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

Maria runs a coffee shop. For each of her 200 loyalty-card customers she has two numbers from the past year: how many times they visited, and how much they spent per visit on average. She is sure there are a few natural kinds of customer hiding in there, but nobody labeled them. k-means is the algorithm that finds those groups, and this lesson is about how it works and how to decide how many groups to look for.

By the end you will be able to:

- Explain what k-means does and the quantity it is trying to make small
- Step through Lloyd's algorithm, the two moves that actually do the clustering
- Run k-means in R, standardize your features first, and choose the number of clusters with the elbow and the silhouette

**Prerequisites:** you can run R, and you have met the idea (from [PCA](PCA-in-R.html) and [Factor Analysis](Factor-Analysis.html)) that unsupervised methods find structure with no labels to guide them.

::widget kmeans-cluster {"k":3}

=== step === concept
::eyebrow Where we are
## Finding groups nobody labeled

The last two lessons worked on the *columns* of your data: PCA and factor analysis compressed many correlated variables into a few underlying ones. Clustering turns the other way and works on the *rows*. Given a table of customers, which ones belong together?

That is exactly Maria's question. Let us build her 200-customer table so we have something concrete to cluster. We plant three real segments (occasional visitors, regulars, and big spenders) only so we can check later whether k-means rediscovers them; the algorithm itself never sees these labels.

```r
set.seed(1)
# 200 loyalty-card customers. Two numbers each:
#   visits = store visits per year, spend = average spend per visit (dollars)
occasional  <- data.frame(visits = rnorm(70,  45, 10), spend = rnorm(70,  4.6, 0.7))
regulars    <- data.frame(visits = rnorm(70, 220, 22), spend = rnorm(70,  5.4, 0.9))
big_spender <- data.frame(visits = rnorm(60,  70, 14), spend = rnorm(60, 13.0, 1.4))
coffee <- rbind(occasional, regulars, big_spender)
coffee$visits <- round(pmax(6, coffee$visits))    # whole visits, floor at 6
coffee$spend  <- round(pmax(1, coffee$spend), 1)   # dollars, one decimal
truth  <- rep(c("occasional", "regular", "big_spender"), c(70, 70, 60))
head(coffee, 4)
#>   visits spend
#> 1     39   4.9
#> 2     47   4.1
#> 3     37   5.0
#> 4     61   3.9
```

Each row is a dot in a two-dimensional space: visits along one axis, spend along the other. Clustering means finding the clumps of dots.

=== step === concept
::eyebrow The idea
## Every group has a center

k-means describes each group by a single representative point called its **centroid**: the average customer in that group. If a cluster \(C_j\) contains some set of customers, its centroid is

\[ \mu_j = \frac{1}{|C_j|} \sum_{x \in C_j} x \]

where \(x\) is a customer's pair of numbers (visits, spend), \(|C_j|\) is how many customers are in cluster \(j\), and \(\mu_j\) is just their average position: the mean visits and the mean spend of that group.

The rule k-means follows is simple: **every point belongs to the cluster whose centroid is nearest to it.** You tell it how many clusters to make (that number is the "k"), and it finds \(k\) centroids and the assignment of points to them.

[KEY INSIGHT]
The "k" in k-means is a number you choose before you start, not something the algorithm discovers. Choosing it well is the second half of this lesson.

=== step === concept
::eyebrow The goal, precisely
## What k-means is really minimizing

Of all the ways to place \(k\) centroids and assign points to them, which is best? k-means scores a clustering by how tightly each group hugs its own centroid. Add up, over every point, the squared distance from that point to its cluster's centroid:

\[ W = \sum_{j=1}^{k} \sum_{x \in C_j} \lVert x - \mu_j \rVert^2 \]

Here \(\lVert x - \mu_j \rVert^2\) is the squared straight-line (Euclidean) distance from customer \(x\) to its centroid \(\mu_j\), and \(W\) is the **within-cluster sum of squares**: the total spread of points around their centers. Small \(W\) means tight, well-separated groups.

[KEY INSIGHT]
k-means has one goal: choose the centroids and the assignments that make \(W\) as small as possible. Everything the algorithm does is in service of shrinking that one number.

=== step === concept
::eyebrow How it does it
## Lloyd's algorithm, in three moves

We cannot try every possible grouping, there are far too many. Instead k-means uses a beautifully simple loop, called Lloyd's algorithm, that improves \(W\) a little at a time:

::widget process-flow {"steps":[{"title":"Start","sub":"drop k centroids at random positions"},{"title":"Assign","sub":"send each point to its nearest centroid"},{"title":"Move and repeat","sub":"slide each centroid to the mean of its points, then re-assign"}]}

Two moves alternate: **assign** every point to its nearest centroid, then **move** every centroid to the mean of the points that just joined it. Each move can only lower \(W\) or leave it unchanged, so the loop keeps improving and eventually nothing moves. That is convergence.

=== step === widget
::eyebrow Feel it
## Step through it yourself

Here is Lloyd's algorithm running on a small cloud of points. Press **step** to alternate the two moves, and watch the within-cluster spread (the "within-SS" readout) drop and then settle as the centroids stop moving. This is exactly what happens to Maria's customers, plotted as visits against spend.

::widget kmeans-cluster {"k":3}

After a few steps the centroids stop moving and the colors stop changing: the algorithm has converged on a grouping it cannot improve with either move.

=== step === quiz
::eyebrow Check yourself
## Does the spread ever go back up?

You step through Lloyd's algorithm and watch the within-cluster sum of squares \(W\) after each move. What can happen to \(W\) from one move to the next?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It goes up and down until it randomly lands on a good grouping ::no Neither move ever increases \(W\). Assigning points to their nearest centroid can only shorten distances, and moving a centroid to its points' mean is the point that minimizes their squared distances.
- It only ever falls or stays the same, until it settles and stops ::ok Right. Both moves can only lower \(W\) or leave it unchanged, so it decreases monotonically to a resting point. That guaranteed descent is why the loop always converges.
- It falls all the way to zero every time ::no It settles at the lowest \(W\) this run can reach, which is almost never zero. Zero would need every point sitting exactly on its centroid.

=== step === concept
::eyebrow The catch in the distance
## Distance, and why the units bite

k-means lives or dies by that word "nearest," and nearest is measured with Euclidean distance: for two customers, square the gap in visits, square the gap in spend, add, and take the root. The trouble is that the two gaps are in different units, and the bigger-numbered feature quietly takes over.

Compare a typical occasional visitor with a typical big spender, and look at what each feature contributes to the *squared* distance between them:

```r
sds <- sapply(coffee, sd)     # how spread out each feature is
round(sds, 1)
#> visits  spend
#>   80.3    3.8
occ <- c(visits = 45, spend =  5)   # a typical occasional visitor
big <- c(visits = 70, spend = 13)   # a typical big spender
gap <- big - occ
gap
#> visits  spend
#>     25      8
gap^2                               # each feature's share of the RAW squared distance
#> visits  spend
#>    625     64
```

Visits contributes 625 and spend only 64: about 90% of the distance comes from visits, purely because visits are counted in the tens and hundreds while spend is a handful of dollars. The feature that actually separates a big spender (their spend) is almost invisible. The fix is to put both features on the same footing by dividing each by its own spread (its standard deviation), which is what `scale()` does:

```r
round((gap / sds)^2, 3)             # each feature's share AFTER standardizing
#> visits  spend
#>  0.097  4.346
```

Now spend dominates, exactly as it should: an \$8 gap is huge next to spend's \$3.8 spread, while a 25-visit gap is small next to visits' 80-visit spread. Standardizing lets each feature speak in proportion to how unusual its difference is, not how big its raw numbers are.

=== step === concept
::eyebrow See the damage
## Watch scaling fix it

This is not a nicety, it changes the answer. Run k-means on the raw columns and then on the standardized columns, and cross-tabulate each result against the three planted segments:

```r
set.seed(20)
raw_fit <- kmeans(coffee, centers = 3, nstart = 25)           # NO scaling
table(cluster = raw_fit$cluster, truth)
#>        truth
#> cluster big_spender occasional regular
#>       1           0          0      39
#>       2          60         70       0
#>       3           0          0      31
set.seed(20)
scaled_fit <- kmeans(scale(coffee), centers = 3, nstart = 25) # scaled
table(cluster = scaled_fit$cluster, truth)
#>        truth
#> cluster big_spender occasional regular
#>       1           0         70       0
#>       2          60          0       0
#>       3           0          0      70
```

On the raw data, one cluster swallows all 60 big spenders together with all 70 occasional customers, 130 very different people lumped as one, while the regulars get split in two. Because visits dominates the distance, k-means clustered on visits alone and never noticed that big spenders spend three times as much. On the standardized data each cluster is exactly one segment. Same algorithm, same k, one call to `scale()` between failure and success.

=== step === quiz
::eyebrow Check yourself
## Why standardize first?

Why does k-means give a much better grouping when you run it on standardized features instead of the raw columns?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Euclidean distance lets the feature with the larger numeric range dominate; scaling gives every feature an equal say ::ok Exactly. Visits spanning hundreds swamps spend spanning a few dollars, so the raw distance is almost all visits. Dividing each feature by its standard deviation puts them on a common footing.
- Scaling makes the algorithm run faster so it can find a better answer ::no Speed is not the issue; both runs finish instantly. Scaling changes *which* grouping is best by rebalancing the distance, not how fast it is found.
- Scaling forces every cluster to end up the same size ::no Scaling says nothing about cluster sizes. It only changes how distance weighs each feature; the clusters can still come out any size.

=== step === concept
::eyebrow In R
## Run k-means in R

You have seen the pieces; here is the whole thing in one call. `kmeans()` takes the data, the number of clusters (`centers`), and `nstart`, the number of random starts to try. That last argument matters: Lloyd's algorithm only finds a *local* best, and a bad random start can settle on a poor grouping, so `nstart = 25` runs it 25 times from different starts and keeps the one with the smallest \(W\).

```r
set.seed(20)
km <- kmeans(scale(coffee), centers = 3, nstart = 25)
km$size                                # customers in each cluster
#> [1] 70 60 70
round(km$tot.withinss, 1)              # total within-cluster spread W
#> [1] 22.8
aggregate(coffee, list(cluster = km$cluster),
          function(x) round(mean(x), 1))   # cluster profiles in real units
#>   cluster visits spend
#> 1       1   46.6   4.6
#> 2       2   72.1  13.0
#> 3       3  221.2   5.3
```

Read the profiles back in Maria's language: cluster 3 visits about 221 times a year and spends around \$5, her regulars; cluster 2 visits only about 72 times but spends \$13 a visit, her big spenders; cluster 1 is the occasional crowd. k-means handed her three actionable loyalty tiers.

=== step === tryit
::eyebrow Your turn
## Standardize first

The single most important habit in k-means: standardize before you cluster. Fill in the function that puts both features in the same units so neither dominates the distance, then check it.

```r
km <- kmeans(____(coffee), centers = 3, nstart = 25)
km$size
```
::check {"regex":"scale","gate":true,"difficulty":"intermediate","ok":"Right: scale() standardizes each column to a standard deviation of one, so visits and spend get an equal say in the distance.","no":"Wrap the data in scale() so the features are standardized before clustering."}
::solution
```r
set.seed(20)
km <- kmeans(scale(coffee), centers = 3, nstart = 25)
km$size
#> [1] 70 60 70
```

=== step === concept
::eyebrow The real question
## Choosing k: the elbow

So far we told k-means to make 3 clusters because we planted 3. In real data you do not know the number. You cannot just pick the k with the smallest \(W\), because \(W\) always falls as k rises: more clusters mean smaller, tighter groups, and at \(k = n\) every point is its own centroid and \(W = 0\). Minimizing \(W\) would always choose "one cluster per customer," which tells you nothing.

Instead, plot \(W\) against k and look for the **elbow**, the k where the curve stops dropping steeply and flattens out. That bend marks the point where adding another cluster stops buying you much.

```r
set.seed(20)
z <- scale(coffee)
wss <- sapply(1:8, function(k) kmeans(z, centers = k, nstart = 25)$tot.withinss)
round(wss, 1)
#> [1] 398.0 181.0  22.8  17.4  13.0  10.9   9.8   8.2
```

Look at the drops: 398 to 181 to 22.8 is a cliff, then 22.8 to 17.4 to 13.0 is a gentle slope. The curve elbows hard at k = 3. Splitting the customers into three groups explains almost all the structure; a fourth group barely helps.

=== step === concept
::eyebrow A second opinion
## A sharper check: the silhouette

The elbow is a judgment call; sometimes the bend is fuzzy. The **silhouette** gives a number. For each point \(i\), let \(a(i)\) be its average distance to the other points in its own cluster (how tight its home is) and \(b(i)\) be its average distance to the points in the nearest *other* cluster (how far the next group is). Its silhouette is

\[ s(i) = \frac{b(i) - a(i)}{\max\big(a(i),\, b(i)\big)} \]

which runs from \(-1\) to \(1\): near \(1\) means the point sits deep inside a well-separated cluster, near \(0\) means it is on the border between two, and negative means it is probably in the wrong cluster. Average \(s(i)\) over all points and you get a single score for a given k; the k with the highest average silhouette is the best-separated.

```r
suppressMessages(library(cluster))
set.seed(20)
z <- scale(coffee)
avg_sil <- sapply(2:6, function(k) {
  cl <- kmeans(z, centers = k, nstart = 25)$cluster
  mean(silhouette(cl, dist(z))[, 3])   # column 3 is each point's s(i)
})
round(setNames(avg_sil, 2:6), 3)
#>     2     3     4     5     6
#> 0.588 0.810 0.710 0.568 0.569
```

The silhouette peaks sharply at k = 3 (0.810), agreeing with the elbow. When the elbow and the silhouette point at the same k, you can be confident; when they disagree, it is a sign the clusters are not clean, which is a real and useful thing to learn about your data.

=== step === widget
::eyebrow Feel it
## The elbow and the silhouette, live

Toggle between the two views and drag the k marker. On the left the elbow curve bends; on the right the silhouette bars peak. Both point to the same natural number of clusters, just as they did for Maria's customers.

::widget cluster-validate {}

=== step === quiz
::eyebrow Check yourself
## Read the elbow

You compute the within-cluster sum of squares for k from 1 to 8 and get: 398, 181, 23, 17, 13, 11, 10, 8. Which k should you choose, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- k = 8, because it has the smallest within-cluster sum of squares ::no \(W\) always falls as k rises, so the smallest \(W\) just means the most clusters. Taken to the end, k = n gives \(W = 0\) and one customer per cluster, which is useless.
- k = 3, because that is where the steep drop ends and the curve flattens ::ok Right. The big falls are 398 to 181 to 23; after that the curve is nearly flat. The elbow at k = 3 is where extra clusters stop buying much.
- k = 1, because a single cluster is the simplest ::no k = 1 has the largest \(W\) of all and does not separate anyone; the whole point is to find distinct groups. The elbow, not the extreme, is what you want.

=== step === concept
::eyebrow Know your tool
## Where k-means breaks

k-means is fast, simple, and often exactly right, but it makes strong assumptions. Knowing where it fails is what keeps you from trusting a bad grouping.

[WARNING]
k-means quietly assumes your clusters are round, roughly equal-sized blobs of similar spread. When that is false, it forces the data into round groups anyway.

- **You must pick k.** The elbow and silhouette guide you, but there is no k baked into the data.
- **It is scale- and outlier-sensitive.** Always standardize first; a few extreme points can drag a centroid badly.
- **It only finds round blobs.** Two interleaved crescents, or a small dense cluster inside a big loose ring, defeat it: the straight-line distance to a centroid cannot describe those shapes.
- **The random start matters.** Use `nstart` well above 1 so a single unlucky initialization does not decide your answer.

When the shapes are not round, you need a different tool, which is exactly where the next lesson goes.

=== step === quiz
::eyebrow Check yourself
## Would k-means handle this?

Your data forms two long, interleaving crescent moons that curl around each other. You run k-means with k = 2. What happens?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It recovers the two crescents cleanly, since you set k = 2 correctly ::no Setting the right k does not help here. k-means groups by distance to a centroid, and a crescent's points are not all near any single center.
- It fails only because the crescents are not standardized ::no Scaling cannot rescue this. The problem is the *shape*: no single centroid sits inside a crescent, so straight-line distance cannot capture it.
- It slices each crescent in half, splitting the data into two round blobs that ignore the true shape ::ok Right. k-means can only carve space into round regions around centroids, so it cuts straight across the moons. Non-globular shapes need density- or linkage-based methods instead.

=== step === concept
::eyebrow Go deeper
## References

- [An Introduction to Statistical Learning, ch. 12 (free PDF)](https://www.statlearning.com/) - the gentle, applied treatment of k-means and choosing k.
- [The Elements of Statistical Learning, ch. 14 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - k-means, the within-cluster criterion, and its place among clustering methods.
- [Hartigan and Wong (1979), A k-means clustering algorithm](https://doi.org/10.2307/2346830) - the efficient algorithm R's `kmeans()` uses by default.
- [Rousseeuw (1987), Silhouettes](https://doi.org/10.1016/0377-0427(87)90125-7) - the paper that introduced the silhouette for judging and choosing k.
- [stats::kmeans (R manual)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kmeans.html) - the function you used, its arguments, and what it returns.

=== step === complete
## Lesson 3 complete

You can now cluster from the ground up: k-means describes each group by a centroid, Lloyd's algorithm alternates assigning points and moving centroids to shrink the within-cluster spread, you standardize first so no feature dominates the distance, and you choose k where the elbow bends and the silhouette peaks. Maria has her three loyalty tiers, and you know exactly why they are trustworthy.

You also saw the edge of the method: k-means only finds round, similar-sized blobs, and it makes you pick k. Next, Lesson 4 lifts both limits. Hierarchical clustering builds a dendrogram that shows every k at once, and DBSCAN finds clusters of any shape, and even decides how many there are, by following density instead of distance to a centroid.
