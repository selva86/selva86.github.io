---
title: "Unsupervised Learning Lesson 7: t-SNE and UMAP"
catalog_blurb: "Turn high-dimensional data into a 2-D map, and read it without being fooled."
description: "Learn t-SNE and UMAP in R: what a nonlinear embedding does, how perplexity sets the neighborhood size, running Rtsne, and the traps in reading a 2-D map."
keywords: "t-SNE in R, UMAP in R, Rtsne, nonlinear embedding, dimensionality reduction, perplexity, n_neighbors, manifold learning, cluster visualization, unsupervised learning"
post_type: "LESSON"
curriculum_id: "6.9.7"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "7"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "Association-Rules-and-Market-Basket.html"
course_prev: "Cluster-Validation-and-Stability.html"
---

=== step === cover
::eyebrow Lesson 7 of 8
## t-SNE and UMAP

Meet Maya, a data scientist at a music-streaming startup. She has 180 listeners, and for each one she has a row of 10 numbers: the share of their listening time that goes to each of 10 genres (pop, rock, jazz, and seven more). Maya suspects her listeners fall into a few natural "taste tribes", but she cannot see them. Ten numbers per person is far too many to eyeball, and a table of 180 rows tells her nothing at a glance. She wishes she could place every listener as a single dot on a flat map, where similar tastes sit close together and different ones sit far apart.

In [Lesson 1](PCA-in-R.html) you built exactly that kind of map with PCA. The panel below is that map on the classic example from Lesson 1 (three species of iris flower): each dot is one flower, similar flowers sit close, and a four-measurement table collapses into a flat picture you can read.

::widget pca-projection {}

PCA drew that map with straight lines. This lesson introduces two methods, **t-SNE** and **UMAP**, that draw it a different way: by keeping each point close to its nearest neighbors. They can reveal groups a straight-line method blurs, which is why they took over fields like single-cell biology. But that same power lets them paint groups that are not really there, so the second half of this lesson is about reading their maps without being fooled.

By the end of this lesson you will be able to:

- Say what a nonlinear embedding does, and how it differs from PCA
- Describe how t-SNE builds its map: neighbor probabilities, and what perplexity controls
- Run t-SNE in R and read the picture it produces
- Say how UMAP differs from t-SNE, and when to reach for each
- Read an embedding safely: know which parts of the picture are real and which are artifacts

**Prerequisites:** you can run R and read its output, and you know what a variable, a distance, and a scatter plot are. No linear algebra or calculus is assumed; every symbol is defined as it appears. [Lesson 1 on PCA](PCA-in-R.html) is the direct starting point, and [Lesson 6 on validation](Cluster-Validation-and-Stability.html) helps but is not required.

=== step === concept
::eyebrow Where we start
## Why a straight-line map runs out

PCA, from Lesson 1, finds the directions of most spread and keeps the top two as a flat map. It is fast, and it is honest about distances. But it only ever draws **straight lines** through the cloud of points, so when the thing that separates your groups is curved, or hidden in a direction that is not one of the biggest, a flat PCA shadow can smear those groups together.

First, since each lesson runs in a fresh R session, let us build Maya's data. We plant three tribes, each defined by the genres it plays most, and we give them deliberately different sizes and spreads (this matters later).

```r
set.seed(42)
# One tribe: n listeners whose "signature" genres (columns in `hi`) run high.
blob <- function(n, sd, hi) {
  m <- matrix(rnorm(n * 10, mean = 0, sd = sd), ncol = 10)  # 10 genre columns
  m[, hi] <- m[, hi] + 4                                    # lift this tribe's genres
  m
}
listeners <- rbind(
  blob(90, 0.6, c(1, 2)),   # pop:  90 listeners, tight
  blob(60, 2.2, c(3, 4)),   # rock: 60 listeners, much more spread out
  blob(30, 0.5, c(5, 6))    # jazz: 30 listeners, tight
)
colnames(listeners) <- paste0("genre", 1:10)
tribe <- factor(rep(c("pop", "rock", "jazz"), c(90, 60, 30)),
                levels = c("pop", "rock", "jazz"))
X <- scale(listeners)       # put every genre on the same footing, as in Lesson 1
dim(X)
#> [1] 180  10
```

`tribe` is the ground truth. In real life Maya would not have it, but we built the data, so we can check what each method recovers and, more importantly, where it misleads. Now run PCA on it, exactly as in Lesson 1.

```r
pca <- prcomp(X)                          # X is already scaled
round(summary(pca)$importance[, 1:4], 3)  # variance kept per component
#>                          PC1   PC2   PC3   PC4
#> Standard deviation     1.615 1.372 1.115 1.052
#> Proportion of Variance 0.261 0.188 0.124 0.111
#> Cumulative Proportion  0.261 0.449 0.573 0.684
plot(pca$x[, 1], pca$x[, 2], col = tribe, pch = 19,
     xlab = "PC1", ylab = "PC2", main = "Maya's listeners, PCA")
legend("topright", levels(tribe), col = 1:3, pch = 19)
```

[NOTE]
The first two components keep only about **45%** of the spread (the `Cumulative Proportion` at PC2 is 0.449). More than half of what makes Maya's listeners differ lives in later components that a flat PC1-versus-PC2 picture simply throws away. On tidy iris that number was 96%; here the signal is scattered across many genres, so the linear shadow is lossy. That gap is the opening t-SNE and UMAP were built to fill.

=== step === concept
::eyebrow The big idea
## Keep near neighbors close

t-SNE and UMAP throw out the "straight line" rule. Instead of asking "which directions have the most spread?", they ask a purely local question, one point at a time: **who are this point's nearest neighbors in the full high-dimensional space?** Then they drop every point onto a blank 2-D canvas and shuffle the dots around until each point's neighbors on the canvas match its neighbors in the original data. Points that were never neighbors are free to drift wherever the layout finds convenient. That finished 2-D map has a name: an **embedding** (the high-dimensional data "embedded" into two dimensions).

That is the whole idea, and this is the pipeline every one of these methods follows:

::widget process-flow {"steps":[{"title":"Find the neighbors of each point","sub":"for every listener, find who sits closest in the full 10-genre space"},{"title":"Turn closeness into a probability","sub":"a near listener gets a high neighbor score, a far one gets almost zero"},{"title":"Scatter the dots on a 2-D canvas","sub":"start them at random positions"},{"title":"Nudge until the neighborhoods agree","sub":"move dots so 2-D neighbors match the high-D neighbors"}]}

Because the method only ever tries to reproduce **local** neighborhoods, the picture is trustworthy about who-sits-with-whom and unreliable about everything else.

[KEY INSIGHT]
t-SNE and UMAP preserve **neighbors, not distances**. If two listeners were near each other in the real 10-genre data, they will sit near each other on the map. But the distance between two clusters on the page, and their sizes, are not something you can read off as "how different" or "how big" they are.

=== step === quiz
::eyebrow Check yourself
## Reading a gap on the map

Maya runs one of these methods and gets a map with three islands. The pop island sits far from the jazz island, while pop and rock sit closer together. A teammate concludes: "So pop fans are far more different from jazz fans than from rock fans." What is the right response?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Agree: the distance between two islands measures how different those groups are ::no That is exactly the trap. These methods are built to keep near neighbors close; the space between clusters is stretched however the layout finds convenient, so between-island distance is not a measure of how different the groups are.
- Push back: within-island closeness is meaningful because it reflects real neighbors, but the distance between two islands is not something you can read ::ok Right. The method reproduces local neighborhoods faithfully and treats the gaps between clusters as free space, so the between-island distance carries no reliable meaning.
- Agree, but only if Maya remembered to fix the random seed first ::no Fixing the seed makes the picture reproducible, which is good practice, but it does nothing to make between-cluster distance meaningful. The gap is an artifact either way.

=== step === concept
::eyebrow Under the hood
## Distances become neighbor probabilities

Let us make "who are this point's neighbors" precise, because the formula explains every trap later in this lesson. We will focus on t-SNE; UMAP uses a close cousin of the same idea.

Write \( \lVert x_i - x_j \rVert \) for the ordinary straight-line distance between listeners \(i\) and \(j\) in the full 10-genre space. t-SNE turns that distance into a **neighbor probability** using a bell curve (a Gaussian) centred on listener \(i\):

\[ p_{j\mid i} = \frac{\exp\!\left(-\lVert x_i - x_j \rVert^2 / 2\sigma_i^2\right)}{\sum_{k \ne i} \exp\!\left(-\lVert x_i - x_k \rVert^2 / 2\sigma_i^2\right)} \]

Read the top line as "the closer \(j\) is to \(i\), the bigger this number." The bottom line adds up that quantity over everyone else, so dividing by it makes listener \(i\)'s scores add to 1: that is what turns them into probabilities. The symbol \(\sigma_i\) (sigma) is the width of the bell curve for point \(i\). You can compute one such row by hand:

```r
D <- as.matrix(dist(X))              # straight-line distance between every pair
sigma <- 0.8                         # one fixed bell-curve width, for illustration
aff <- exp(-D[1, ]^2 / (2 * sigma^2))
aff[1] <- 0                          # a listener is not its own neighbor
p <- aff / sum(aff)                  # listener 1's neighbor probabilities (they sum to 1)

round(sort(p, decreasing = TRUE)[1:5], 3)   # its five strongest neighbors (by listener id)
#>    33    50    41    88    55
#> 0.032 0.031 0.028 0.027 0.024
sum(p[tribe == "pop"])               # share of the probability mass on fellow pop fans
#> [1] 0.9999875
```

Listener 1 is a pop fan. Its five strongest neighbors each carry about 0.03 of the probability, a distant listener carries essentially 0, and **essentially all** of its neighbor-probability mass (0.99999) lands on fellow pop fans. That is the raw material t-SNE works from.

**Perplexity** is the one dial you turn, and it sets those widths \(\sigma_i\). Formally, perplexity is \( \mathrm{Perp}(P_i) = 2^{H(P_i)} \), where \( H(P_i) = -\sum_j p_{j\mid i}\log_2 p_{j\mid i} \) is the entropy of point \(i\)'s neighbor probabilities (a measure of how many neighbors carry real weight). t-SNE tunes each \(\sigma_i\) until the perplexity hits the value you chose. In plain words: **perplexity is roughly the number of nearest neighbors each point pays attention to.** Perplexity 30 means every listener is placed to respect its 30 or so closest neighbors.

On the flat canvas, t-SNE measures closeness between the 2-D positions \( y_i \) with a heavier-tailed curve (a Student-t, the "t" in t-SNE), giving a second set of probabilities \( q_{ij} \). It then slides the dots until the canvas probabilities \(q\) match the high-D ones \(p\) as closely as possible, by minimizing the Kullback-Leibler divergence

\[ C = \sum_i \sum_{j \ne i} p_{ij} \log \frac{p_{ij}}{q_{ij}} \]

which simply scores how far apart the two sets of neighbor probabilities are. (t-SNE averages \(p_{j\mid i}\) and \(p_{i\mid j}\) into a symmetric \(p_{ij}\) first; the idea is unchanged.) Here is the part that matters: this score punishes putting a **true neighbor** far away (high \(p\), low \(q\)) very harshly, and barely notices what happens to pairs that were never neighbors.

[KEY INSIGHT]
t-SNE optimizes one thing: keep true neighbors close. It has almost no stake in where far-apart points land. That single fact is why, later, cluster sizes and the gaps between clusters will turn out to carry no reliable meaning.

=== step === tryit
::eyebrow Your turn
## Run t-SNE on Maya's listeners

The `Rtsne` package runs t-SNE for you. Maya's table `X` is already scaled, so you just pass it in with a perplexity and a fixed seed (t-SNE starts from a random layout, so the seed keeps the result reproducible). Fill in the blank to ask for a neighborhood of about 30, a sensible choice for 180 points.

```r
library(Rtsne)
set.seed(1)
ts <- Rtsne(X, dims = 2, perplexity = ____, verbose = FALSE)
plot(ts$Y, col = tribe, pch = 19,
     xlab = "t-SNE 1", ylab = "t-SNE 2", main = "Maya's listeners, t-SNE")
legend("topright", levels(tribe), col = 1:3, pch = 19)
```
::check {"regex":"perplexity\\s*=\\s*30","gate":true,"difficulty":"beginner","ok":"That is it. t-SNE pulls the three tribes into three clear islands, cleaner than the PCA shadow you saw earlier.","no":"Set perplexity to about 30 for 180 points: perplexity = 30. (t-SNE needs 3 times perplexity to be below the number of points.)"}
::solution
```r
library(Rtsne)
set.seed(1)
ts <- Rtsne(X, dims = 2, perplexity = 30, verbose = FALSE)
plot(ts$Y, col = tribe, pch = 19,
     xlab = "t-SNE 1", ylab = "t-SNE 2", main = "Maya's listeners, t-SNE")
legend("topright", levels(tribe), col = 1:3, pch = 19)
```

=== step === concept
::eyebrow The other method
## UMAP: same goal, a different route

UMAP (Uniform Manifold Approximation and Projection) arrived a decade after t-SNE and chases the same goal, a neighbor-preserving 2-D map, by a different path. It first builds a **neighbor graph** (it connects each point to its nearest neighbors), then lays that graph out in 2-D so connected points stay close. Two knobs matter:

- `n_neighbors` plays the role perplexity plays in t-SNE: small values chase very local detail, large values pull in broader context.
- `min_dist` controls how tightly packed a cluster is allowed to look: small values make crisp, dense blobs, large values spread points out.

UMAP runs faster on large data and tends to keep more of the **global** layout (which cluster sits near which), where t-SNE often exaggerates the gaps. In R you would reach for the `uwot` package (or the `umap` package). These need a compiled component that the interactive R here does not include, so run the block below in your own R session.

```r-static
# Run this in your own R session (UMAP's package is not available in the
# interactive R on this page; t-SNE above is). Install it once with
# install.packages("uwot").
set.seed(1)
um <- uwot::umap(X, n_neighbors = 15, min_dist = 0.1)   # X is Maya's scaled listener table
plot(um, col = tribe, pch = 19,
     xlab = "UMAP 1", ylab = "UMAP 2", main = "Maya's listeners, UMAP")
legend("topright", levels(tribe), col = 1:3, pch = 19)
```

Which should Maya pick? For a few thousand rows, either is fine. The differences show up at the margins:

| Question | t-SNE (Rtsne) | UMAP (uwot or umap) |
|---|---|---|
| Neighborhood knob | `perplexity` (5 to 50) | `n_neighbors` (5 to 50) |
| Cluster packing knob | built in | `min_dist` |
| Speed on 50,000+ rows | slow | fast |
| Global layout (cluster-to-cluster) | often distorted | better preserved |
| Project new points later | not supported | supported |
| Reproducibility | fix with `set.seed()` | fix with `set.seed()` |

[NOTE]
UMAP keeping "more of the global layout" is only a matter of degree, not a green light: the gap between two clusters still is not a distance you should measure off the page. Both methods share every trap in the rest of this lesson. Whichever Maya picks, the rules for reading the picture are the same, so from here on we demonstrate with t-SNE (which runs right here) and everything carries over to UMAP.

=== step === concept
::eyebrow The traps, part 1
## The picture lies about size and distance

Now the payoff of that formula. Because t-SNE only fights to keep true neighbors close, two things you would naturally read off the plot are not real. Watch what happens to the sizes of Maya's tribes.

```r
library(Rtsne)
set.seed(1)
ts <- Rtsne(X, dims = 2, perplexity = 30, verbose = FALSE)

# average within-tribe distance = how spread out each tribe REALLY is
raw_spread <- tapply(seq_len(nrow(X)), tribe, function(i) round(mean(dist(X[i, ])), 2))
raw_spread   # in the real 10-genre data: rock is far more spread out than pop or jazz
#>  pop rock jazz
#> 1.54 5.62 1.31

plot(ts$Y, col = tribe, pch = 19, xlab = "t-SNE 1", ylab = "t-SNE 2",
     main = "On the map, the three tribes look about the same size")
legend("topright", levels(tribe), col = 1:3, pch = 19)
```

In the real data the rock tribe is genuinely sprawling: its within-tribe spread (5.62) is about **3.6 times** pop's (1.54), and we built it that way. But look at the map. The three tribes come out looking about the same size, because t-SNE stretches tight clusters and squeezes loose ones until every clump has a similar density. Rock's real sprawl simply vanishes from the picture. If Maya eyeballed the plot and reported "the rock tribe is tighter than I expected", she would be flatly wrong. **The area of a blob is not the size or the spread of the group.**

The same freedom moves the whole layout around. Because far-apart points barely enter the cost, t-SNE starts from a random scatter and can settle into a different arrangement each time. Change the seed and the islands rotate and reshape, even though who-belongs-with-whom does not change. Run it twice and compare:

```r
set.seed(10); a <- Rtsne(X, perplexity = 30, verbose = FALSE)
set.seed(99); b <- Rtsne(X, perplexity = 30, verbose = FALSE)
par(mfrow = c(1, 2))   # same data, same settings, two random seeds
plot(a$Y, col = tribe, pch = 19, main = "seed 10", xlab = "", ylab = "")
plot(b$Y, col = tribe, pch = 19, main = "seed 99", xlab = "", ylab = "")
```

Same data, same settings, two different pictures. The three tribes stay intact (that is the part you can trust), but where each island sits, how it is turned, and how far it lands from the others all shuffle. The coordinates, cluster sizes, and orientation are not fixed facts about the data.

[WARNING]
Do not read cluster **size**, the **gap** between clusters, or the **orientation** of the map as meaningful. They are byproducts of the layout, not measurements of the data. Only who-clusters-with-whom is trustworthy, and even that you should confirm across a couple of seeds.

=== step === quiz
::eyebrow Check yourself
## What can Maya safely report?

Maya runs t-SNE and sees three clean islands. One island looks about twice as wide as another. She reruns with a new seed: the islands rotate and change shape, but each listener stays with the same island. Which conclusion is safe to put in her report?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There are three groups; one is twice as spread out as another; and their positions show how related the groups are ::no Width and position are t-SNE artifacts. The doubled width and the island positions are byproducts of the layout, not measurements. Reporting them would be reporting noise.
- There are three candidate groups worth checking; the widths, the gaps, and the orientation are artifacts and should not be reported ::ok Right. Membership held steady across seeds, so three groups is a reasonable hypothesis, but size, distance, and orientation are not reliable and stay out of the report.
- The result is worthless: because a new seed changed the layout, t-SNE cannot be trusted for anything ::no Too harsh. A new seed is supposed to change the layout. The fact that membership stayed stable across seeds is actually evidence the groups are real. t-SNE is still useful, just not for size or distance.

=== step === concept
::eyebrow The traps, part 2
## It will draw clusters in pure noise

Here is the trap that catches the most people, and it should feel familiar from [Lesson 6](Cluster-Validation-and-Stability.html), where you saw k-means carve tidy tiers out of random points. t-SNE does the same. Feed it data with no groups at all, and it still returns a picture full of clumps and gaps.

```r
set.seed(7)
noise <- matrix(rnorm(150 * 10), ncol = 10)   # 150 rows of pure random numbers: NO groups
nt <- Rtsne(noise, perplexity = 30, verbose = FALSE)
plot(nt$Y, pch = 19, col = "#6b7280",
     xlab = "t-SNE 1", ylab = "t-SNE 2", main = "t-SNE of pure noise")
```

Nothing in `noise` has any structure, yet the plot is not an even blob: t-SNE's local pull always bunches points into little islands with gaps between them. A reader who did not know the data was random would happily circle "clusters" that do not exist. This is why a t-SNE or UMAP map is a **hypothesis generator, never a verdict**.

[KEY INSIGHT]
Treat every t-SNE or UMAP picture as a question, not an answer. It suggests "there might be groups here". You then go back to the original high-dimensional data and confirm with the tools from Lesson 6: cluster it for real, check the silhouette, run the gap statistic, and test whether the groups survive a resample. If the structure is real, it will hold up. If it was only in the picture, it will not.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [van der Maaten and Hinton (2008), Visualizing Data using t-SNE, JMLR (free PDF)](https://www.jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf) - the original t-SNE paper, with the neighbor-probability and KL-divergence math you saw here.
- [McInnes, Healy and Melville (2018), UMAP (arXiv)](https://arxiv.org/abs/1802.03426) - the paper that introduced UMAP and its neighbor-graph formulation.
- [Wattenberg, Viegas and Johnson (2016), How to Use t-SNE Effectively, Distill](https://distill.pub/2016/misread-tsne/) - a superb interactive tour of exactly the traps in this lesson: cluster size, distance, and perplexity.
- [Coenen and Pearce, Understanding UMAP (Google PAIR)](https://pair-code.github.io/understanding-umap/) - the same careful treatment for UMAP, including what `n_neighbors` and `min_dist` really do.

=== step === complete
## Lesson 7 complete

You can now build and read a nonlinear map of high-dimensional data. You saw why a linear PCA shadow can lose more than half the story, how t-SNE turns distances into neighbor probabilities and lets perplexity set the neighborhood size, and how to run it in R with `Rtsne`. You met UMAP as the faster, more global-minded cousin. Most importantly, you learned to read these maps honestly: only cluster membership is trustworthy, while sizes, gaps, orientation, and even clusters-in-noise are artifacts to confirm on the raw data.

Next, Lesson 8: Association Rules and Market Basket. We leave geometry behind and ask a different unsupervised question, not "which points group together?" but "which items tend to be bought together?", and learn to measure those patterns with support, confidence, and lift.
