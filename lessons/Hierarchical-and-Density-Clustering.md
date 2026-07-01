---
title: "Unsupervised Learning Lesson 4: Hierarchical and Density Clustering"
catalog_blurb: "Find clusters of any shape, without deciding how many groups up front."
description: "Learn hierarchical clustering and DBSCAN in R: build a dendrogram to read every number of clusters at once, and find odd-shaped, noisy groups by density."
keywords: "hierarchical clustering in R, hclust, dendrogram, cutree, linkage, ward, DBSCAN, density clustering, eps, minPts, unsupervised learning, clustering shapes"
post_type: "LESSON"
curriculum_id: "6.9.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "4"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "Gaussian-Mixture-Models.html"
course_prev: "k-Means-and-Choosing-k.html"
---

=== step === cover
::eyebrow Lesson 4 of 8
## Hierarchical and Density Clustering

In Lesson 3, k-means sorted Maria's coffee-shop regulars into three neat loyalty tiers. But it asked two things of her that will not always be fair. First, she had to tell it the number of groups up front (`centers = 3`). Second, it only ever draws round, blob-shaped groups, because it measures everything by distance to a centre.

Now Maria is scouting a second location, so she pulls a map of where her 88 regulars actually live: each customer is a dot, placed by how many kilometres east and north of downtown they are. Two problems break k-means here. Her neighbourhoods are not round (one runs in a long thin strip along Main Street), and a handful of customers live scattered far out in the countryside, belonging to no neighbourhood at all.

This lesson gives Maria two tools that fix exactly those two limits:

- **Hierarchical clustering** builds a whole tree of nested groups, so she can read every possible number of neighbourhoods at once and never has to guess a number.
- **Density clustering (DBSCAN)** finds groups by where the dots are crowded, so it traces a group of any shape and quietly sets the far-flung stragglers aside as noise.

By the end of this lesson you will be able to:

- Explain how a dendrogram is built by merging, and cut it into any number of clusters you want
- Run `hclust` and `cutree` in R, and pick a linkage rule
- Say why k-means fails on odd shapes and outliers, and use DBSCAN's core, border and noise points to cluster by density instead

**Prerequisites:** you can run R and read its output, and you have done [Lesson 3 on k-means](k-Means-and-Choosing-k.html) (what clustering is, Euclidean distance, and why you scale features before measuring distance). Every new symbol is defined as it appears.

::widget dendrogram {}

=== step === concept
::eyebrow The idea
## A tree built by merging

Hierarchical clustering never asks you for a number of groups. Instead it builds a family tree of the data, from the bottom up, using one stubbornly simple rule:

1. Start with every customer in a group of their own: 88 dots, 88 tiny groups.
2. Find the two groups that are closest together and merge them into one.
3. Repeat, merging the next-closest pair, until every dot has joined a single group at the top.

The record of which groups merged, and at what distance, is drawn as a **dendrogram**, the interactive tree below. Read it from the bottom up. Each leaf is one customer. Every time two branches join, that is a merge, and the **height** of the join is how far apart those two groups were when they merged. Similar customers join low down; groups that are very different only join near the top.

Here is the payoff. Because the tree holds every merge, you get every possible clustering at once. A horizontal line sliding down through the tree turns each branch it crosses into one cluster. Cut high and you get a few big groups; cut low and you get many small ones. Drag the cut line in the dendrogram below and watch the number of clusters change: that single tree is really many clusterings stacked on top of each other, and you choose the one you want after seeing them all.

::widget dendrogram {}

[KEY INSIGHT]
k-means commits to a number of clusters before it starts. A dendrogram defers that decision: it shows you the whole hierarchy first, and you pick where to cut once you can see how the groups nest.

=== step === concept
::eyebrow The one real choice
## Linkage: how far apart are two groups?

The merge rule says "merge the two closest groups", but that hides a real question. The distance between two single dots is just the straight-line (Euclidean) distance you met in Lesson 3. But once a group holds several dots, what does "the distance between two groups" even mean? That choice is called the **linkage**, and it is the one decision that shapes the whole tree. For two groups \(A\) and \(B\):

- **Single linkage** uses the closest pair: \( D(A,B) = \min_{a \in A,\, b \in B} d(a,b) \). It can follow a long, stringy shape, because each new dot only has to be near *one* member to join.
- **Complete linkage** uses the farthest pair: \( D(A,B) = \max_{a \in A,\, b \in B} d(a,b) \). It insists every member be close, so it makes tight, compact balls.
- **Average linkage** uses the mean over all pairs: \( D(A,B) = \frac{1}{|A|\,|B|} \sum_{a \in A} \sum_{b \in B} d(a,b) \), where \(|A|\) is the number of dots in group \(A\). A middle ground.
- **Ward's method** merges the pair that increases the total within-group spread (the same sum-of-squares \(W\) k-means minimised) by the least. It strongly favours compact, similar-size groups, and is the most popular default.

Let us put this to work on Maria's map. Each lesson runs in its own fresh R session, so we build the map right here. We secretly stack three neighbourhoods (two round ones and a long Main Street strip) plus a handful of rural stragglers, then shuffle and drop the labels, exactly Maria's situation: she sees only the dots. This page shares one R session top to bottom, so run this once and the later steps reuse it.

```r
set.seed(7)
blob <- function(n, cx, cy, s) data.frame(x = rnorm(n, cx, s), y = rnorm(n, cy, s))
downtown <- blob(25, 2.0, 2.0, 0.30)                     # a round neighbourhood
harbor   <- blob(25, 7.0, 2.5, 0.30)                     # another round neighbourhood
main_st  <- data.frame(x = runif(30, 3.8, 8.0),          # Main Street: a long thin strip
                       y = 6.0 + rnorm(30, 0, 0.15))
rural    <- data.frame(x = runif(8, 0, 9), y = runif(8, 0, 8))  # scattered outliers
town <- rbind(downtown, harbor, main_st, rural)
town <- round(town[sample(nrow(town)), ], 2)             # shuffle so row order hides the groups
rownames(town) <- NULL
nrow(town)
#> [1] 88
```

Now cluster the same 88 customers two ways. Single linkage chains dots together into a lopsided tree; Ward builds balanced, compact groups (in R, `method = "ward.D2"` is the name for Ward's method). Same data, same distances, different linkage, different tree.

```r
d <- dist(scale(town))                 # standardise x and y, then all pairwise distances
par(mfrow = c(1, 2))                    # two plots side by side
plot(hclust(d, method = "single"),  labels = FALSE, main = "single linkage", xlab = "", sub = "")
plot(hclust(d, method = "ward.D2"), labels = FALSE, main = "Ward linkage",   xlab = "", sub = "")
```

[NOTE]
Notice we wrap the data in `scale()` before `dist()`, exactly as in Lesson 3. Distance treats every unit equally, so if one axis were measured in metres and the other in kilometres, that axis would dominate every merge. Standardising first gives both directions an equal say.

=== step === tryit
::eyebrow Your turn
## Grow the tree and cut it in R

You built Maria's map in the last step and saw two dendrograms. Now grow the Ward tree once more and cut it. Maria wants to check her hunch that there are three neighbourhoods, so cut the tree into 3 groups. Fill in the blank with the number of clusters you want.

```r
hc <- hclust(dist(scale(town)), method = "ward.D2")   # the dendrogram, Ward linkage
groups <- cutree(hc, k = ____)                        # cut it into this many clusters
table(groups)
```
::check {"regex":"k\\s*=\\s*3","gate":true,"difficulty":"beginner","ok":"Right: cutree(hc, k = 3) slides the cut down until the tree splits into exactly 3 groups.","no":"Cut the tree into three clusters: cutree(hc, k = 3)."}
::solution
```r
hc <- hclust(dist(scale(town)), method = "ward.D2")
groups <- cutree(hc, k = 3)
table(groups)
#> groups
#>  1  2  3
#> 27 33 28
```

Three groups, 88 customers split 27 / 33 / 28. Notice something, though: every single customer landed in a group, including the far-out rural dots. Hierarchical clustering, just like k-means, must give every point a home. Hold that thought, because it is exactly what our second tool refuses to do.

=== step === quiz
::eyebrow Check yourself
## Reading the cut

You have a finished dendrogram on screen. You cut it once and get 3 clusters, but you decide you want MORE, finer clusters. Which way do you move the cut line?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Cut lower: a lower line crosses more of the vertical branches, so the tree splits into more, smaller groups ::ok Exactly. Lower down, the branches have not merged yet, so more of them are separate clusters. At the very bottom every dot is its own cluster.
- Cut higher: higher up the tree shows finer detail ::no It is the other way around. Higher up, more branches have already merged, so a higher cut gives FEWER clusters. At the very top everything is a single group.
- You cannot change the count: the number of clusters is fixed once the tree is built ::no The tree is fixed, but where you cut is entirely your choice, and every height gives a different number of clusters. That freedom is the whole point of the dendrogram.

=== step === concept
::eyebrow The other limit
## Why k-means cannot map this town

The dendrogram fixed the "how many groups?" problem. Now for the second limit: shape. Look at Maria's map honestly. Two neighbourhoods are round blobs, but Main Street is a long thin strip, and eight customers are scattered noise with no neighbourhood at all. k-means measures everything by distance to a centre, so it can only carve space into round, straight-edged cells. Run it here and watch it struggle:

```r
set.seed(1)
km <- kmeans(scale(town), centers = 3, nstart = 25)   # force exactly 3 round groups
plot(town, col = c("#c0392b", "#2980b9", "#27ae60")[km$cluster], pch = 19,
     xlab = "km east", ylab = "km north", main = "k-means forces 3 round groups")
km$size
#> [1] 28 27 33
```

Two things go wrong, and both are baked into how k-means works. It slices the long Main Street strip wherever a centroid boundary happens to fall, because a single round cell cannot stretch to cover a line. And it has no way to say "this dot belongs to nobody", so it drags every rural straggler into whichever group is nearest, quietly distorting that group's centre. k-means always returns exactly the round groups you asked for, even when the real structure is a strip plus some noise.

=== step === concept
::eyebrow The fix
## DBSCAN: clustering by crowding

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) throws out the idea of a centre entirely. Its intuition is the way you would read the map yourself: a neighbourhood is simply a place where the dots are crowded together, and a crowded region can be any shape at all. Everything hangs on two numbers you choose:

- \(\varepsilon\) (**eps**): a radius. Two dots are neighbours if they sit within \(\varepsilon\) of each other. The neighbourhood of a dot \(p\) is \( N_\varepsilon(p) = \{\, q : d(p,q) \le \varepsilon \,\} \), every dot inside that circle.
- **minPts**: how crowded counts as crowded, the minimum number of neighbours a dot needs to sit in a dense region.

With those two numbers, every dot is sorted into one of three kinds:

- **Core point:** has at least minPts neighbours within \(\varepsilon\), that is \( |N_\varepsilon(p)| \ge \text{minPts} \). It sits deep inside a crowd.
- **Border point:** not crowded itself, but within \(\varepsilon\) of a core point, so it clings to the edge of a cluster.
- **Noise point:** neither. It is out in the sparse middle of nowhere, and DBSCAN leaves it in no cluster at all.

A cluster is then just a chain of core points that are within \(\varepsilon\) of each other, plus the border points hanging off them. Because clusters grow dot-to-dot along the crowd, they follow a strip, a ring or a crescent as happily as a blob, and nobody sets the number of clusters in advance: it falls out of where the crowds are. Run it on Maria's map:

```r
library(dbscan)
db <- dbscan(town, eps = 0.5, minPts = 5)   # crowd = 5 neighbours within 0.5 km
cols <- c("grey65", "#c0392b", "#2980b9", "#27ae60")   # cluster 0 = noise, drawn grey
plot(town, col = cols[db$cluster + 1], pch = 19,
     xlab = "km east", ylab = "km north", main = "DBSCAN: density clusters + noise")
table(cluster = db$cluster)
#> cluster
#>  0  1  2  3
#>  9 25 28 26
```

DBSCAN recovered all three neighbourhoods, the two round ones and the long Main Street strip, without being told there were three, and it set 9 customers aside as cluster `0`, its name for noise: the scattered stragglers who sit in no crowd at all. Maria gets clean neighbourhoods AND an honest "these people belong to none of them", which is often the most useful answer of all.

[WARNING]
DBSCAN is not magic. It assumes clusters have roughly similar density: one global \(\varepsilon\) cannot be loose enough for a sparse cluster and tight enough for a dense one at the same time. When densities differ wildly, or in very high dimensions where "distance" loses meaning, DBSCAN and its variant HDBSCAN need care, or another method entirely.

=== step === quiz
::eyebrow Check yourself
## Pick the tool

A different client shows you a scatter of GPS pings. The points form two long curved bands that wrap around a lake, plus a scattering of isolated pings far from either band. You do not know how many groups there are, and you want the isolated pings flagged, not forced into a group. Which method fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- k-means with `centers = 2` ::no k-means draws only round, straight-edged cells, so it slices each curved band in half. And it must assign every isolated ping to some cluster: it has no way to call a point noise.
- DBSCAN ::ok Right. DBSCAN grows clusters along connected dense regions, so it traces curved bands of any shape, it needs no k, and it labels the isolated pings as noise instead of forcing them in.
- k-means after standardising the coordinates ::no Scaling fixes unfair units, not shape. Round centroid cells still cannot follow a curved band, and k-means still has no way to set outliers aside as noise.

=== step === concept
::eyebrow Making it work
## Choosing eps, and which tool when

DBSCAN's result lives or dies by \(\varepsilon\). Too small and everything becomes noise; too large and separate neighbourhoods merge into one blob. There is a standard way to find a good value: for every dot, measure the distance to its k-th nearest neighbour (k around minPts), sort those distances, and plot them. The curve stays low and flat while you are inside the crowds, then bends sharply upward at the point where you start reaching out to the sparse noise. That elbow is a good \(\varepsilon\).

```r
kNNdistplot(town, k = 4)                    # sorted distance to each dot's 4th nearest neighbour
abline(h = 0.5, lty = 2, col = "#c0392b")   # the elbow sits near 0.5, so eps = 0.5
```

The curve is flat until about the 80th percentile then shoots up, and the bend sits right around 0.5, which is exactly the \(\varepsilon\) we used. A sensible starting point for minPts is roughly twice the number of dimensions (so 4 to 5 for a 2-D map), raised if the data is noisy.

With both tools in hand, here is how to choose:

- **Hierarchical clustering:** when you want to see the whole nested structure, do not want to fix k in advance, or the dataset is small enough to read a tree. It gives you a story, not just labels.
- **DBSCAN:** when clusters are oddly shaped, when there are outliers you want flagged as noise, and when density is roughly even across groups.
- **k-means:** when the groups really are round and similar in size, and the data is large (it is fast and scales well). Reach for it first when its assumptions hold, and for these other two when they do not.

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take this further:

- [An Introduction to Statistical Learning, chapter 12 (free PDF)](https://www.statlearning.com/) - hierarchical clustering and the dendrogram, explained gently with the algorithm in full.
- [The Elements of Statistical Learning, section 14.3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - agglomerative clustering and the linkage methods, with the maths.
- [Ester, Kriegel, Sander & Xu (1996): the original DBSCAN paper (PDF)](https://cdn.aaai.org/KDD/1996/KDD96-037.pdf) - where core, border and noise points were defined.
- [hclust {stats}: the R function you used](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/hclust.html) - every linkage method and how to read the object it returns.
- [Hahsler, Piekenbrock & Doran: the dbscan R package (CRAN)](https://cran.r-project.org/package=dbscan) - the fast implementation used here, including kNNdistplot for choosing eps.

=== step === complete
## Lesson 4 complete

You now have two clustering tools that go where k-means cannot. Hierarchical clustering builds a dendrogram, a whole tree of merges, so you can read every possible number of clusters at once and cut it wherever the structure tells you to, rather than guessing k up front. DBSCAN clusters by density instead of distance-to-a-centre, so it finds groups of any shape and hands you an honest noise label for the points that belong nowhere. You saw both fail-safes on Maria's map: the tree gave her neighbourhoods at any granularity, and DBSCAN traced the Main Street strip while setting the rural stragglers aside.

Next, Lesson 5: Gaussian Mixture Models. So far every method has given hard answers, each point belongs to exactly one group. But real membership is often fuzzy: a customer might be 70% a regular and 30% a devotee. Gaussian mixtures cluster with probabilities, giving each point a soft share of every group, and they come with a proper statistical model underneath.
