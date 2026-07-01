---
title: "Unsupervised Learning Lesson 6: Cluster Validation and Stability"
catalog_blurb: "How to tell whether the clusters you found are real, not just noise."
description: "Validate clustering in R from scratch: read a silhouette, use the gap statistic to test whether clusters exist at all, and check stability with the bootstrap."
keywords: "cluster validation in R, silhouette, gap statistic, clusGap, cluster stability, bootstrap clustering, choosing k, internal validation, unsupervised learning, clusterboot"
post_type: "LESSON"
curriculum_id: "6.9.6"
webr: true
mathjax: true
lesson_access: "free"
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

Back in Lesson 3, k-means sorted Maria's 90 coffee-shop regulars into three neat loyalty tiers: the occasional crowd, the regulars, and the devotees. Lessons 4 and 5 gave her other ways to draw the same map. Every one of them handed back tidy groups.

Here is the uncomfortable question none of those methods can answer for her: **are the three tiers real?** k-means will just as happily carve three tiers out of pure random noise. It never tells you whether it found structure or invented it. This lesson is the reality check, the set of tools that tell genuine groups from a pattern the algorithm merely painted on.

By the end of this lesson you will be able to:

- Explain why a clustering algorithm always returns groups, even when there are none, so a clustering must be validated rather than trusted
- Read a silhouette as a validation score, and use the gap statistic to test whether clusters exist at all, k=1 included
- Check whether your clusters are stable by resampling the data and measuring how often the same groups come back

**Prerequisites:** you can run R and read its output, and you have done [Lesson 3 on k-means](k-Means-and-Choosing-k.html) (clustering, distance, scaling, the within-cluster spread W, the elbow, and the silhouette). [Lesson 5 on Gaussian mixtures](Gaussian-Mixture-Models.html) helps but is not required. Every symbol is re-defined as it appears.

The scatter below is what we are putting on trial: Maria's customers, coloured by the tier k-means gave them.

::widget chart-plotter {"data":[{"x":3,"y":4.0,"fill":"occasional"},{"x":5,"y":4.4,"fill":"occasional"},{"x":4,"y":3.9,"fill":"occasional"},{"x":6,"y":4.3,"fill":"occasional"},{"x":12,"y":5.1,"fill":"regular"},{"x":14,"y":4.8,"fill":"regular"},{"x":13,"y":5.3,"fill":"regular"},{"x":11,"y":4.9,"fill":"regular"},{"x":19,"y":8.6,"fill":"devotee"},{"x":21,"y":9.0,"fill":"devotee"},{"x":20,"y":8.9,"fill":"devotee"},{"x":22,"y":8.7,"fill":"devotee"}],"geoms":["point"],"x":"visits","y":"spend"}

=== step === concept
::eyebrow The problem
## Clustering always gives an answer

Ask k-means for three groups and it will find three groups. That is the trap: it is a machine that partitions, and a partition exists for any data you feed it, structured or not. To feel how empty that guarantee is, let us cluster data we KNOW has no groups, 90 points scattered completely at random inside a square.

```r
set.seed(1)
noise <- matrix(runif(180), ncol = 2)     # 90 points, thrown down at random - NO real groups
table(kmeans(noise, centers = 3, nstart = 10)$cluster)
#> 
#>  1  2  3
#> 29 31 30
```

Three tidy groups, all a similar size. If you coloured them on a scatter they would look like three tiers, exactly like Maria's picture on the previous step. But we built this data ourselves: there is nothing there. The tiers are an artefact of asking for three.

[KEY INSIGHT]
A clustering algorithm cannot tell you whether its groups are real. It optimises a number (for k-means, the within-cluster spread W), and it will optimise that number on noise just as eagerly as on genuine structure. Validation is a separate job, and it is yours.

So we need outside evidence. The rest of this lesson builds three independent checks: **the silhouette** (are the groups well separated?), **the gap statistic** (is there any grouping at all?), and **stability** (do the groups survive a reshuffle?). We run all three on Maria's tiers and see whether they hold up.

=== step === concept
::eyebrow Check 1
## The silhouette: how well does each point fit?

You met the silhouette in Lesson 3 as a way to pick k. It is also the most direct internal check on a finished clustering, because it scores every single point on how well it sits in its assigned group.

For one customer \(i\), let \(a(i)\) be their average distance to the other members of their OWN cluster (how snug the fit is), and \(b(i)\) their average distance to the members of the nearest OTHER cluster (how far the next-best group is). The silhouette width is

\[ s(i) = \frac{b(i) - a(i)}{\max\big(a(i),\, b(i)\big)} \]

It runs from \(-1\) to \(1\): near \(1\) the point sits deep inside its own group and far from any other (a clean fit); near \(0\) it straddles the border between two groups; **negative** means it is on average closer to a neighbouring group than to its own, a sign it may be in the wrong cluster. Two numbers turn this into a verdict: the **overall average** width (one score for the whole clustering) and the **per-cluster average** width (which reveals a single weak group that a good overall score would hide). As a rough guide (Kaufman and Rousseeuw), an overall width above 0.7 is strong, 0.5 to 0.7 is reasonable, and below 0.25 means no real structure.

First rebuild Maria's data, since each lesson runs in a fresh R session, then score the k-means clustering.

```r
set.seed(42)
make_group <- function(n, v, s) data.frame(
  visits = round(pmax(rnorm(n, v, 1.6), 1), 1),   # coffees per month
  spend  = round(pmax(rnorm(n, s, 0.5), 1), 2)    # average dollars per visit
)
cafe <- rbind(make_group(30,  4, 4.2),    # occasional
              make_group(30, 13, 5.0),    # regulars
              make_group(30, 20, 8.8))    # devotees
cafe <- cafe[sample(nrow(cafe)), ]        # shuffle so row order hides the groups
rownames(cafe) <- NULL
x  <- scale(cafe)                         # standardise: visits and spend get an equal say
km <- kmeans(x, centers = 3, nstart = 25)
km$size
#> [1] 30 30 30
```

```r
library(cluster)                          # ships with R; provides silhouette()
sil <- silhouette(km$cluster, dist(x))
round(mean(sil[, "sil_width"]), 2)        # overall average silhouette width
#> [1] 0.74
round(summary(sil)$clus.avg.widths, 2)    # average width within each tier
#>    1    2    3
#> 0.67 0.81 0.73
mean(sil[, "sil_width"] < 0)              # share of customers who fit better elsewhere
#> [1] 0
```

An overall width around 0.74 is a strong, well-separated clustering (comfortably past the 0.7 mark), and no customer has a negative width, so nobody is obviously misfiled. Notice the per-tier line, though: one tier (0.67) is a little less tight than the other two (0.81 and 0.73). That is the silhouette earning its keep, pointing straight at the group whose separation is weakest.

The interactive below lets you feel the silhouette across values of k. Switch to the **silhouette** view and drag the k marker: it peaks at the k with the cleanest separation, and slumps when you ask for too many or too few groups.

::widget cluster-validate {}

=== step === quiz
::eyebrow Check yourself
## Reading the two numbers

You cluster a new dataset and get an **overall** average silhouette width of 0.62, which looks healthy. But the **per-cluster** widths are 0.81, 0.79, and 0.06. What is the most useful reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The clustering is uniformly good; 0.62 is above the 0.5 "reasonable" line, so all three groups are well separated ::no The overall number is an average, and averages hide their worst member. Two strong groups can prop up a healthy-looking mean while the third is barely a cluster at all.
- Two groups are well separated but the third (width 0.06) is essentially not a real cluster; its members sit on the border and would be worth re-examining ::ok Right. The per-cluster widths are exactly what the overall average conceals. A 0.06 group is not separated from its neighbours, so the honest move is to question that third group, maybe the true k is 2.
- A width of 0.06 is fine because it is still positive, and only negative widths signal a problem ::no Positive but near zero means "sitting on the boundary," not "well fitted." You reserve alarm for negatives, but a near-zero cluster is still a weak, questionable group.

=== step === concept
::eyebrow Check 2
## The gap statistic: is there any grouping at all?

The silhouette has a blind spot. It is only defined for two or more clusters, because \(b(i)\), the distance to the nearest OTHER group, needs another group to exist. So it can rank k=2 against k=3, but it can never test the most important hypothesis of all: **k=1, there are no groups**. That is the gap statistic's job.

The idea is a comparison against a null. Recall from Lesson 3 the within-cluster spread \(W_k\), the total squared distance from every point to its cluster centre; it always shrinks as k grows. The gap statistic asks: does \(W_k\) shrink FASTER for our data than it would for structureless data spread over the same range? It measures that against a **uniform reference** (points scattered at random across the data's range, the same kind of structureless noise we built two steps ago) and defines

\[ \mathrm{Gap}(k) = \underbrace{E_n^*\!\left[\log W_k\right]}_{\text{null: averaged over random references}} - \; \log W_k \]

where \(E_n^*[\log W_k]\) is the average \(\log W_k\) across many random reference datasets, and \(\log W_k\) is the value for your real data. A big gap means your data clusters much more tightly than random noise would; a gap near zero means it is no better than noise. You pick k by the **one-standard-error rule**: the smallest k whose gap is within one standard error of the following one,

\[ \text{choose the smallest } k \text{ such that } \mathrm{Gap}(k) \ge \mathrm{Gap}(k+1) - s_{k+1} \]

where \(s_{k+1}\) is the standard error of the reference average at \(k+1\). Crucially, this rule can land on **k=1**, its way of saying "stop, there are no real clusters here." The `clusGap()` function in the `cluster` package does the whole computation, references and all.

```r
set.seed(1)
gap <- clusGap(x, FUN = kmeans, nstart = 10, K.max = 6, B = 25)   # x = Maria's scaled data
round(gap$Tab[, "gap"], 3)                                        # the gap at k = 1..6
#> [1] -0.062  0.228  0.649  0.593  0.545  0.533
maxSE(gap$Tab[, "gap"], gap$Tab[, "SE.sim"], method = "firstSEmax")
#> [1] 3
```

The gap climbs steeply, peaks at k=3, and then falls back, so the one-SE rule selects **k=3**. Maria's three tiers pass. Now the acid test: run the identical procedure on the pure-noise data, which we know has no groups.

```r
set.seed(1)
gap0 <- clusGap(noise, FUN = kmeans, nstart = 10, K.max = 6, B = 25)
maxSE(gap0$Tab[, "gap"], gap0$Tab[, "SE.sim"], method = "firstSEmax")
#> [1] 1
```

On the noise, the gap statistic returns **k=1**. It refuses to invent tiers where there are none.

[KEY INSIGHT]
Of the three checks, only the gap statistic can vote "no clusters." The elbow and the silhouette both assume you have already decided to cluster and only help you tune k; the gap tests the prior question of whether you should cluster at all. Run it first.

The panel below is the elbow view of that same \(W_k\) curve, the raw material the gap statistic compares against a random baseline.

::widget cluster-validate {}

=== step === quiz
::eyebrow Check yourself
## Where each tool stops

A colleague hands you a dataset, insists it has "obviously three segments," and shows you a silhouette that peaks at k=3. You are not convinced the data has ANY real segments. Which check settles it, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The gap statistic, because it compares the data against a structureless reference and can return k=1, the verdict that there are no genuine segments ::ok Exactly. A silhouette peaking at k=3 only means 3 beats 2 or 4; it cannot say whether even one split is justified, because it is undefined at k=1. The gap statistic tests against random noise, so it alone can conclude "no clusters."
- The silhouette at k=3 already proves the segments are real; a peak is conclusive ::no A silhouette compares candidate values of k against each other, never against "no clustering." It will happily peak somewhere even on noise, so a peak is not evidence that any real structure exists.
- Neither can tell; you would have to eyeball the scatter plot and decide by hand ::no Eyeballing is a fine sanity check but not a settled answer, and it fails in more than two dimensions. The gap statistic gives a principled test of exactly this question.

=== step === concept
::eyebrow Check 3
## Stability: do the groups survive a reshuffle?

A silhouette and a gap both judge one fixed clustering of one fixed dataset. But a real, meaningful grouping should be **stable**: if Maria had happened to log a slightly different sample of customers, she should get essentially the same tiers back. If tiny changes to the data reshuffle everyone into different groups, the structure was fragile and probably not real.

We test that with the **bootstrap**: resample the customers with replacement to make a slightly different dataset, re-cluster it, and measure how much the new grouping agrees with the original. Repeat many times and average the agreement. The widget shows one bootstrap draw, some customers picked more than once, some left out.

::widget bootstrap-sample {"tail":"Re-cluster this resample and compare it back to the original tiers."}

To turn "agree" into a number we use the **Rand index**: over every possible pair of customers, what fraction of pairs do the two clusterings treat the same way, both-together or both-apart? It runs from 0 to 1; near 1 means the two groupings are nearly identical. There is a neat one-liner for it: `outer(a, a, "==")` builds the table of "are customers \(i\) and \(j\) in the same group?", and comparing that table for the two clusterings gives the fraction of pairs that agree.

```r
# Rand index: the share of customer PAIRS on which two clusterings agree
coagree <- function(a, b) mean(outer(a, a, "==") == outer(b, b, "=="))

# assign every original customer to the nearest centre of a new clustering
assign_to <- function(x, centers) {
  d <- as.matrix(dist(rbind(centers, x)))
  k <- nrow(centers)
  max.col(-d[-(1:k), seq_len(k)])          # for each point, the closest centre
}
```

The plan: bootstrap-resample the rows, cluster the resample, project its centres back onto ALL the original customers, and compare that labelling to the original with `coagree()`. A high average across many resamples means the tiers keep coming back.

=== step === tryit
::eyebrow Your turn
## Measure the stability of Maria's tiers

Below is the stability loop. The one thing that makes it a bootstrap is drawing the resample **with replacement**, so some customers repeat and some drop out, giving each resample its own slightly different shape. Fill in the blank that does that. (`km`, `x`, `coagree` and `assign_to` were built in the previous steps.)

```r
set.seed(7)
ref <- km$cluster                          # the original tiers we want to trust
stability <- replicate(50, {
  idx <- sample(nrow(x), ____)             # a bootstrap resample of the customers
  cb  <- kmeans(x[idx, ], centers = 3, nstart = 10)
  coagree(ref, assign_to(x, cb$centers))   # how well this resample's tiers match the original
})
round(mean(stability), 2)
```
::check {"regex":"replace\\s*=\\s*TRUE","gate":true,"difficulty":"intermediate","ok":"Right: sampling with replacement is what makes it a bootstrap. Maria's tiers come back with essentially 1.00 agreement across resamples - very stable.","no":"A bootstrap resamples WITH replacement: sample(nrow(x), replace = TRUE)."}
::solution
```r
set.seed(7)
ref <- km$cluster
stability <- replicate(50, {
  idx <- sample(nrow(x), replace = TRUE)
  cb  <- kmeans(x[idx, ], centers = 3, nstart = 10)
  coagree(ref, assign_to(x, cb$centers))
})
round(mean(stability), 2)
#> [1] 1
```

An average agreement of essentially 1.00 means Maria's tiers reappear almost perfectly no matter which customers happen to land in the sample. Run the same measurement on the pure-noise data and the agreement drops well below that, because there is no real structure for the resamples to reproduce. Stable clusters are reproducible clusters.

=== step === concept
::eyebrow Putting it together
## Three checks, one honest verdict

No single number certifies a clustering. You triangulate:

- **Gap statistic first** - does the data cluster at all, or is k=1 the honest answer?
- **Silhouette** - if it does cluster, are the groups well separated, overall AND per cluster?
- **Stability** - do the same groups survive resampling, or do they dissolve?

Maria's tiers passed all three: a gap that selected k=3, a strong silhouette, and near-perfect bootstrap agreement. That is a clustering you can build a loyalty program on. When the three disagree, treat k as genuinely uncertain and let the decision the clusters will drive break the tie.

In production R you would not hand-roll the stability loop. The `fpc` package wraps exactly this idea in `clusterboot()`, reporting a bootstrap Jaccard stability per cluster (rule of thumb: above 0.85 stable, below 0.6 probably not real).

```r-static
library(fpc)
# clusterboot resamples B times, re-clusters, and scores each cluster's mean
# Jaccard similarity to the original. Run this in your own R session (fpc is
# not preinstalled in the interactive R here).
cb <- clusterboot(scale(cafe), B = 100, clustermethod = kmeansCBI,
                  krange = 3, seed = 7)
cb$bootmean          # one stability score per tier: higher is more reproducible
```

[NOTE]
Validation cannot conjure structure that is not there. If the gap says k=1 and the silhouette never clears 0.25, the honest report is "no clusters," not a prettier k. In Lesson 7 you will meet t-SNE and UMAP, which draw striking 2-D pictures of high-dimensional data, and precisely because they always produce a compelling picture, these same validation instincts are what stop you from reading groups into an embedding that has none.

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take cluster validation further:

- [Tibshirani, Walther and Hastie (2001), Estimating the number of clusters via the gap statistic, JRSS-B](https://doi.org/10.1111/1467-9868.00293) - the paper that introduced the gap statistic and the one-SE selection rule you used.
- [Rousseeuw (1987), Silhouettes, J. Computational and Applied Mathematics](https://doi.org/10.1016/0377-0427(87)90125-7) - the original silhouette paper, with the \(s(i)\) definition in full.
- [Hennig (2007), Cluster-wise assessment of cluster stability, Comp. Statistics and Data Analysis](https://doi.org/10.1016/j.csda.2006.11.025) - the bootstrap-and-Jaccard stability idea behind `fpc::clusterboot`.
- [An Introduction to Statistical Learning, chapter 12 (free PDF)](https://www.statlearning.com/) - clustering with a clear, honest treatment of its practical pitfalls.
- [clusGap {cluster}: the R function you used](https://stat.ethz.ch/R-manual/R-devel/library/cluster/html/clusGap.html) - every argument of the gap-statistic implementation, and the `maxSE` selection methods.

=== step === complete
## Lesson 6 complete

You can now interrogate a clustering instead of trusting it. You saw that k-means will carve tiers out of pure noise, so validation is a separate job. You read the silhouette as a per-point and per-cluster score of separation, used the gap statistic to test the prior question of whether any clustering is justified (watching it return k=1 on noise and k=3 on Maria's real tiers), and measured stability by bootstrap-resampling the customers and checking how often the same groups came back. Together those three checks turn "the algorithm found groups" into "the groups are real."

Next, Lesson 7: t-SNE and UMAP. These methods make gorgeous two-dimensional maps of high-dimensional data, and their very persuasiveness is the danger. You will learn to read those embeddings, and to spot the traps that make them show groups and distances that are not really there.
