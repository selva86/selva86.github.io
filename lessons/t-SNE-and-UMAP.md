---
title: "Unsupervised Learning Lesson 7: t-SNE and UMAP"
catalog_blurb: "Turn high-dimensional data into a 2D map, and read it without being misled."
description: "Learn t-SNE and UMAP in R: how these nonlinear methods turn many-column data into a 2D map, what perplexity and n_neighbors do, and the traps in reading it."
keywords: "t-SNE in R, UMAP in R, Rtsne, uwot, dimensionality reduction, nonlinear embedding, perplexity, n_neighbors, manifold learning, visualizing high-dimensional data, unsupervised learning"
post_type: "LESSON"
curriculum_id: "6.9.7"
webr: true
mathjax: true
lesson_access: "pro"
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

Meet Priya, a data analyst at a music-streaming service. Her library holds thousands of songs, and for each one the audio engine has measured eight numbers: how energetic it is, its tempo, how danceable it is, how acoustic, how loud, how upbeat (its valence), how instrumental, and how full of spoken words. Eight numbers per song is far too many to eyeball. Priya wishes she could drop every song as a single dot on a flat map, where songs that SOUND alike sit close together, so the genres reveal themselves.

In Lesson 6 you learned to check whether clusters are real. Now you will learn to SEE them. The map below is the kind PCA drew back in Lesson 1 (here, of flowers): a flat 2D picture where similar items sit close. It is a fine start, but PCA can only bend in straight lines, and that turns out to be a real limit. This lesson builds sharper, nonlinear maps, t-SNE and UMAP, and, just as importantly, teaches you the traps in reading them.

By the end of this lesson you will be able to:

- Explain why a nonlinear map can reveal cluster structure that a linear PCA map hides
- Say, in plain words, how t-SNE turns distances into a 2D map, and what perplexity controls
- Run t-SNE in R, meet UMAP, and choose between them
- Read one of these maps without being fooled by its most seductive traps

**Prerequisites:** [Lesson 1 (PCA in R)](PCA-in-R.html) for the idea of a 2D map and variance explained, plus the clustering lessons before this. You should be comfortable running R and reading its output, and know what a mean, a standard deviation, a Euclidean distance, and a scatter plot are. No new linear algebra is assumed; every symbol is defined as it appears.

::widget pca-projection {}

The flat map above is PCA, the linear kind. By the end of this lesson you will build maps that pull apart structure PCA leaves in a smear.

=== step === concept
::eyebrow The problem
## Eight numbers per song

Let us give Priya some data to work with. Each lesson runs in a fresh R session, so we build her song library right here (run this once). We invent six genres and, for each, a characteristic "sound": a couple of audio features it scores high on. Then we scatter individual songs around that signature.

```r
set.seed(1)
genres <- c("lo-fi", "classical", "metal", "EDM", "folk", "hip-hop")
n_per  <- c(90, 45, 45, 30, 60, 30)                 # how many songs in each genre
spread <- c(0.35, 0.50, 0.45, 0.65, 0.45, 0.50)     # how tightly each genre clusters
names(n_per) <- names(spread) <- genres
feat <- c("energy", "tempo", "dance", "acoustic", "loud", "valence", "instr", "speech")

# Each genre is "high" in a couple of characteristic audio features (its sound).
signature <- rbind(
  "lo-fi"     = c(0, -1.3, 0, 0.6, 0, 0, 1.6, 0),
  "classical" = c(0,  0.0, 0, 1.7, 0, 0, 1.4, 0),
  "metal"     = c(1.8, 0.0, 0, 0.0, 1.7, 0, 0, 0),
  "EDM"       = c(1.3, 1.6, 1.5, 0, 0, 0, 0, 0),
  "folk"      = c(0,  0.0, 0, 1.5, 0, 1.6, 0, 0),
  "hip-hop"   = c(0,  0.0, 1.4, 0, 0, 0, 0, 1.9)
)
colnames(signature) <- feat

# scatter each song around its genre's signature
songs <- do.call(rbind, lapply(genres, function(g)
  matrix(rnorm(n_per[g] * 8, 0, spread[g]), n_per[g], 8) +
  matrix(signature[g, ], n_per[g], 8, byrow = TRUE)))
colnames(songs) <- feat
genre <- factor(rep(genres, times = n_per), levels = genres)

dim(songs)
#> [1] 300   8
table(genre)
#> genre
#>     lo-fi classical     metal       EDM      folk   hip-hop 
#>        90        45        45        30        60        30
```

We have 300 songs, each a row of eight numbers, and we happen to know the true genre of every one (that is our ground truth, handy for judging the maps later). The averages confirm each genre really does have its own sound:

```r
# the average of each feature within each genre
round(t(sapply(genres, function(g) colMeans(songs[genre == g, ]))), 2)
#>           energy tempo dance acoustic  loud valence instr speech
#> lo-fi       0.04 -1.30 -0.02     0.64 -0.03    0.00  1.60  -0.08
#> classical  -0.03 -0.01  0.04     1.71  0.02    0.02  1.29   0.02
#> metal       1.81 -0.16  0.05     0.07  1.88   -0.09 -0.10   0.16
#> EDM         1.20  1.54  1.54     0.07 -0.04   -0.06 -0.02  -0.14
#> folk       -0.01 -0.08  0.14     1.39  0.00    1.58 -0.08  -0.01
#> hip-hop     0.02 -0.02  1.46    -0.05  0.06    0.04  0.11   1.93
```

metal is loud and high-energy; classical is acoustic and instrumental; hip-hop is danceable and full of words. Each genre is a cluster somewhere in this eight-dimensional space. The catch: you cannot plot eight dimensions. Priya can view any two features at a time, but the genres overlap in most pairs, and there are 28 pairs to check. She wants ONE picture.

=== step === concept
::eyebrow The linear attempt
## PCA gives a flat map, but it smears the genres

The natural first move is the tool from Lesson 1: PCA. It finds the two straight-line directions of largest spread and plots the songs on them.

```r
pca <- prcomp(songs, scale. = TRUE)   # standardize, then find the linear axes of most spread
round(summary(pca)$importance[, 1:4], 3)
#>                          PC1   PC2   PC3   PC4
#> Standard deviation     1.594 1.275 1.166 0.956
#> Proportion of Variance 0.317 0.203 0.170 0.114
#> Cumulative Proportion  0.317 0.521 0.691 0.805
```

```r
plot(pca$x[, 1:2], col = genre, pch = 19, xlab = "PC1", ylab = "PC2",
     main = "PCA: a linear 2D map of the songs")
legend("topright", levels(genre), col = 1:6, pch = 19, cex = 0.7)
```

PC1 and PC2 together hold 52% of the variation, the best FLAT summary of the eight features. But look at the map. metal claims its own corner, yet lo-fi, classical and folk pile on top of one another, and EDM overlaps hip-hop. PCA found the two directions of biggest OVERALL spread, but the genres are not separated along those two directions; their differences live in features PCA ranked lower and threw away. A straight-line map cannot pull them apart.

=== step === concept
::eyebrow The clue
## Your nearest songs are your genre

PCA looked at the whole cloud at once. Let us look LOCALLY instead, at each song and its close neighbours. First, the raw distances.

```r
D <- as.matrix(dist(songs))   # Euclidean distance between every pair of songs

# song 1 is a lo-fi track. How far is it from another lo-fi song vs a metal and an EDM song?
round(c(lofi = D[1, 2], metal = D[1, 136], EDM = D[1, 181]), 2)
#>  lofi metal   EDM 
#>  1.85  4.17  4.14

# what are the genres of song 1's five closest songs?
genre[order(D[1, ])[2:6]]
#> [1] lo-fi lo-fi lo-fi lo-fi lo-fi
#> Levels: lo-fi classical metal EDM folk hip-hop
```

Song 1 sits far closer to another lo-fi song (distance 1.85) than to a metal or EDM song (over 4), and its five nearest songs are ALL lo-fi. The genre structure is right there in the data. You just have to look locally, at each song's near neighbours, instead of at the whole cloud. That is exactly what PCA missed and what t-SNE will exploit.

=== step === concept
::eyebrow Measuring the clue
## PCA throws the local structure away

Let us make "your nearest songs are your genre" into a single number, for all 300 songs at once: what fraction of songs have a same-genre NEAREST neighbour? We can measure it in any space by handing the function a set of coordinates.

```r
# for each song, is its single nearest song the same genre? average that over all 300.
same_genre_neighbour <- function(coords) {
  M <- as.matrix(dist(coords)); diag(M) <- Inf   # ignore each song's distance to itself
  mean(genre[apply(M, 1, which.min)] == genre)    # share whose nearest neighbour shares its genre
}
round(c(full_8D = same_genre_neighbour(scale(songs)),
        PCA_2D  = same_genre_neighbour(pca$x[, 1:2])), 3)
#> full_8D  PCA_2D 
#>   0.977   0.703
```

In the full eight-dimensional space, 98% of songs have a same-genre nearest neighbour: the local structure is almost perfect. Squash the data down to PCA's best 2D and it drops to 70%, so about a third of songs now land next to the wrong genre. PCA's flattening, chosen to preserve global spread, trampled the local neighbourhoods.

[KEY INSIGHT]
What we want is a 2D map that keeps the near-neighbour structure of the full space, even at the cost of the global geometry. That is exactly the bargain t-SNE and UMAP strike: give up faithful global distances to protect who-is-near-whom.

=== step === concept
::eyebrow How t-SNE thinks, part 1
## Turn distances into neighbour probabilities

t-SNE's first idea is to stop thinking in raw distances and think in NEIGHBOUR PROBABILITIES instead. For a song \(i\), it asks: if I had to pick a neighbour at random, weighting nearby songs much more heavily than far ones, how likely would I pick song \(j\)? It uses a bell curve (a Gaussian) on the distance:

\[ p_{j\mid i} = \frac{\exp\!\left(-\lVert x_i - x_j\rVert^2 / 2\sigma_i^2\right)}{\sum_{k \ne i} \exp\!\left(-\lVert x_i - x_k\rVert^2 / 2\sigma_i^2\right)} \]

Here \(x_i\) is song \(i\)'s eight audio features (a point in 8D), \(\lVert x_i - x_j\rVert\) is the Euclidean distance between songs \(i\) and \(j\), and \(\sigma_i\) is the width of song \(i\)'s bell curve. The top is large when \(j\) is close and almost zero when far; the bottom just rescales the values so that, over all other songs, they add up to 1, making \(p_{j\mid i}\) a genuine probability. Let us compute it for song 1:

```r
# turn song 1's distances into neighbour PROBABILITIES with a bell curve (Gaussian)
neighbour_probs <- function(i, sigma) {
  weight <- exp(-D[i, ]^2 / (2 * sigma^2))   # a near song gets a big weight, a far song almost none
  weight[i] <- 0                              # a song is not its own neighbour
  weight / sum(weight)                        # rescale so the weights sum to 1 (a probability)
}
p <- neighbour_probs(1, sigma = 0.8)
round(sum(p[genre == "lo-fi"]), 2)   # how much of song 1's neighbour-probability lands on lo-fi?
#> [1] 0.95
```

So 95% of song 1's neighbour-probability lands on its own genre. In the full space, a song's Gaussian neighbourhood is almost entirely same-genre. These probabilities are the thing t-SNE will try to reproduce on the 2D map.

=== step === concept
::eyebrow How t-SNE thinks, part 2
## The bell's width is the perplexity

Notice the one free choice above: \(\sigma_i\), the width of the bell. It decides how many songs count as neighbours. Watch what it does to song 1:

```r
round(sum(neighbour_probs(1, sigma = 0.6)[genre == "lo-fi"]), 2)   # NARROW bell: only the nearest count
#> [1] 0.97
round(sum(neighbour_probs(1, sigma = 1.2)[genre == "lo-fi"]), 2)   # WIDE bell: farther songs count too
#> [1] 0.83
```

A narrow bell (small \(\sigma\)) listens only to the very closest songs, so almost all the probability (97%) stays on lo-fi. A wide bell (large \(\sigma\)) lets farther songs in, leaking probability onto other genres (down to 83%).

You do not set \(\sigma_i\) by hand. Instead you choose ONE number, the **perplexity**, which is roughly the effective number of neighbours each song should have, and t-SNE quietly solves for the \(\sigma_i\) that hits that target at every point. A small perplexity means a tight, local view; a large one means a broader view. Typical values run from about 5 to 50.

=== step === quiz
::eyebrow Check yourself
## What is t-SNE trying to keep?

You run t-SNE on Priya's songs and it hands you a 2D map. What is it actually trying to keep faithful?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The straight-line distance between every pair of songs, exactly ::no t-SNE does not preserve global distances. It is free to stretch and squeeze the map; only who-is-near-whom is protected.
- Which songs are each song's near neighbours, its local neighbourhood ::ok Right. t-SNE matches high-D neighbour probabilities with 2D ones, so songs that were near in 8D stay near on the map. Global distances are sacrificed.
- The directions of largest variance, exactly like PCA ::no That is PCA, and it is linear. t-SNE is nonlinear and cares about local neighbours, not variance directions.

=== step === concept
::eyebrow The whole algorithm
## Match the map's neighbourhoods to the real ones

You now have the high-dimensional half: neighbour probabilities \(p_{ij}\) (t-SNE averages \(p_{j\mid i}\) and \(p_{i\mid j}\) so each pair has one shared value). Here is the whole method, end to end.

::widget process-flow {"steps":[{"title":"Neighbourhoods","sub":"in the full 8D space, find who sits near each song"},{"title":"Probabilities p","sub":"turn those distances into neighbour probabilities"},{"title":"Lay out in 2D","sub":"give each song a position and measure 2D neighbourhoods q"},{"title":"Match by descent","sub":"nudge the points until q matches p"}]}

On the 2D map each song gets a position \(y_i\), and t-SNE measures the map's neighbourhoods with a heavier-tailed Student-t curve:

\[ q_{ij} = \frac{\left(1 + \lVert y_i - y_j\rVert^2\right)^{-1}}{\sum_{k \ne l}\left(1 + \lVert y_k - y_l\rVert^2\right)^{-1}} \]

where \(y_i\) is song \(i\)'s position on the flat map. t-SNE then slides the points around to make the map neighbourhoods \(q_{ij}\) match the real ones \(p_{ij}\), by minimising the Kullback-Leibler divergence, a measure of how much two sets of probabilities disagree:

\[ C = \sum_i \sum_j p_{ij} \log \frac{p_{ij}}{q_{ij}} \]

It does this by gradient descent: nudge every point a little in the direction that lowers \(C\), and repeat. The term \(p_{ij}\log(p_{ij}/q_{ij})\) grows large only when \(p_{ij}\) is big but \(q_{ij}\) is small, that is, when two TRUE neighbours are drawn far apart on the map. So the cost fiercely punishes splitting up real neighbours, and barely notices far-apart pairs. That is precisely why local structure survives and global distance does not.

[NOTE]
Why the heavier-tailed curve in 2D? Squeezing eight dimensions into two crowds everything together (the "crowding problem"). The Student-t's fat tail gives moderately distant points room to push apart, so clusters separate into clean islands instead of one mush.

=== step === tryit
::eyebrow Your turn
## Run t-SNE in R

Enough theory: let t-SNE do it for real. The `Rtsne` package runs it in R. Two habits matter: set a seed, because t-SNE starts from a random layout, and choose a perplexity, for which about 30 is a sensible default for a few hundred points. Fill in the perplexity and run it.

```r
library(Rtsne)
set.seed(42)
ts <- Rtsne(songs, perplexity = ____, verbose = FALSE)
plot(ts$Y, col = genre, pch = 19, xlab = "", ylab = "",
     main = "t-SNE map of the song library")
legend("topright", levels(genre), col = 1:6, pch = 19, cex = 0.7)
```
::check {"regex":"perplexity\\s*=\\s*30","gate":true,"difficulty":"beginner","ok":"There it is: six clean islands, one per genre, from data PCA left in a smear. ts$Y holds the two map coordinates for each song.","no":"Set perplexity = 30 (a good default for a few hundred points)."}
::solution
```r
library(Rtsne)
set.seed(42)
ts <- Rtsne(songs, perplexity = 30, verbose = FALSE)
plot(ts$Y, col = genre, pch = 19, xlab = "", ylab = "",
     main = "t-SNE map of the song library")
legend("topright", levels(genre), col = 1:6, pch = 19, cex = 0.7)
```

=== step === concept
::eyebrow Did it work?
## The map keeps the local structure PCA lost

The picture looks convincing, six separate islands, but let us hold it to the same yardstick we used on PCA: does the map keep each song next to a same-genre neighbour?

```r
round(same_genre_neighbour(ts$Y), 3)   # does the t-SNE map keep near-neighbours together?
#> [1] 0.993
```

About 99%, essentially matching the full eight-dimensional space (98%) and far above PCA's flat map (70%). t-SNE gave Priya a picture she can actually look at that barely lost any local structure.

[KEY INSIGHT]
This is the whole point of a nonlinear embedding: a 2D picture that preserves who-is-near-whom, exactly where a straight-line projection cannot.

(Your exact figure will wobble a little from run to run, because t-SNE starts from a random layout. It will always land near the full-space number and well above PCA.)

=== step === concept
::eyebrow The other one
## UMAP: same goal, a neighbour graph

t-SNE is not the only nonlinear map. UMAP (Uniform Manifold Approximation and Projection) chases the same goal, keep near things near, by a different route. Instead of pairwise probabilities, it builds a NEIGHBOUR GRAPH: connect each song to its nearest neighbours with fuzzy weights, then find the 2D layout of that graph that best preserves it. In practice UMAP tends to be faster on large data, keeps a little more of the global arrangement, and can place brand-new points onto an existing map.

UMAP is not built into this in-browser R, so run these lines in your own R session:

```r-static
# install.packages("uwot"), then:
set.seed(42)
um <- uwot::umap(songs, n_neighbors = 15, min_dist = 0.1)
plot(um, col = genre, pch = 19, main = "UMAP map of the song library")
same_genre_neighbour(um)
#> [1] 0.983
```

Its two main knobs are **n_neighbors** (how many neighbours to wire into the graph; larger looks more global, much like a bigger perplexity) and **min_dist** (how tightly points may pack; smaller clumps clusters tighter). On Priya's songs UMAP keeps about 98% of same-genre neighbours, right alongside t-SNE.

=== step === concept
::eyebrow Choosing
## t-SNE versus UMAP

The two are close cousins. This table is the practical summary.

| | t-SNE | UMAP |
|---|---|---|
| Goal | keep near points near in 2D | the same |
| Builds | pairwise neighbour probabilities | a fuzzy neighbour graph |
| Main knob(s) | perplexity | n_neighbors, min_dist |
| Speed on large data | slower | faster |
| Global structure | mostly discarded | somewhat better kept |
| New points | must re-run from scratch | can add to an existing map |
| R package | `Rtsne` | `uwot` |

For a few thousand points and a careful look at local structure, t-SNE is a fine default. For larger data, repeated runs, or when you need to project new points onto the same map later, reach for UMAP. Both obey the SAME cautions, and those cautions are the rest of this lesson.

=== step === quiz
::eyebrow Check yourself
## UMAP's knobs

UMAP and t-SNE aim at the same thing. Which pair of knobs does UMAP give you, and what do they roughly control?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- n_neighbors, how much local versus global structure to weigh, and min_dist, how tightly points may pack ::ok Right. A larger n_neighbors takes in a wider neighbourhood (more global); a smaller min_dist lets clusters clump tighter.
- learning_rate and momentum, the speed of the gradient descent ::no Those are optimiser settings, not UMAP's structural knobs. UMAP's are n_neighbors and min_dist.
- The number of principal components to keep first ::no That is a PCA choice. UMAP works from the neighbour graph, not a fixed component count.

=== step === concept
::eyebrow Trap 1
## Blob size means nothing

Now the part every practitioner needs and half of them skip: how to READ these maps without fooling yourself. Look again at your t-SNE map, this time with each genre's true song count in the legend.

```r
plot(ts$Y, col = genre, pch = 19, xlab = "", ylab = "",
     main = "the same t-SNE map, with genre sizes")
legend("topright", paste0(levels(genre), " (n=", table(genre), ")"),
       col = 1:6, pch = 19, cex = 0.7)
```

classical and metal have the SAME number of songs (45 each), yet their blobs are noticeably different sizes. lo-fi has 90 songs and hip-hop only 30, three times fewer, but their blobs are nowhere near three times different. The reason: t-SNE (and UMAP) inflate dense clusters and shrink sparse ones to spread everything evenly across the plane.

[WARNING]
A blob's size on a t-SNE or UMAP map tells you almost nothing about how many points are in it or how spread out they are. Never read population or variance off cluster size.

=== step === concept
::eyebrow Trap 2
## Distance between clusters means nothing either

Here is the second trap, and it is subtle. Run t-SNE twice on the very same data, changing only the random seed, and compare.

```r
set.seed(1);    run_a <- Rtsne(songs, perplexity = 30, verbose = FALSE)$Y
set.seed(2026); run_b <- Rtsne(songs, perplexity = 30, verbose = FALSE)$Y
par(mfrow = c(1, 2))
plot(run_a, col = genre, pch = 19, xlab = "", ylab = "", main = "t-SNE, seed 1")
plot(run_b, col = genre, pch = 19, xlab = "", ylab = "", main = "t-SNE, seed 2026")
```

The same six islands show up in both, so cluster MEMBERSHIP is stable, but they are rotated, flipped, and rearranged, and the gaps between islands are completely different. So the distance between two clusters on the map is not a real quantity; it is whatever this particular layout happened to settle on. Two islands sitting close together does NOT mean those genres are similar.

[TIP]
Set a seed so your own map is reproducible, but never interpret how far apart two clusters sit, or which clusters are neighbours on the map.

=== step === concept
::eyebrow Trap 3
## It will draw clusters in pure noise

The most dangerous trap: these methods ALWAYS give you a picture, even when there is nothing to see. Here is data with no structure at all, 150 rows of pure random numbers, run at two perplexities.

```r
set.seed(7)
noise <- matrix(rnorm(150 * 8), 150, 8)   # 150 fake songs of pure random numbers, no genres at all
par(mfrow = c(1, 2))
set.seed(7); plot(Rtsne(noise, perplexity = 5,  verbose = FALSE)$Y, pch = 19,
                  col = "grey40", xlab = "", ylab = "", main = "noise, perplexity 5")
set.seed(7); plot(Rtsne(noise, perplexity = 40, verbose = FALSE)$Y, pch = 19,
                  col = "grey40", xlab = "", ylab = "", main = "noise, perplexity 40")
```

At perplexity 5 (left), t-SNE carves the random cloud into little clumps and filaments that look for all the world like clusters. They are mirages: there is no structure to find. At perplexity 40 (right) it correctly shows one shapeless blob.

[KEY INSIGHT]
A cluster on a t-SNE or UMAP map is a HYPOTHESIS, not a fact. Before you believe it, confirm it on the raw data, with the validation tools from Lesson 6 (silhouette, stability) or by inspecting the original features of the candidate group.

=== step === concept
::eyebrow Trap 4
## The picture changes with perplexity

One last knob to respect. Here is Priya's real data at three perplexities.

```r
par(mfrow = c(1, 3))
for (p in c(5, 30, 90)) {
  set.seed(42)
  plot(Rtsne(songs, perplexity = p, verbose = FALSE)$Y, col = genre, pch = 19,
       xlab = "", ylab = "", main = paste("perplexity", p))
}
```

Same data, three very different pictures. At perplexity 5 the neighbourhood is so small that some real genres shatter into sub-blobs. At 30 you get six clean islands. At 90 the neighbourhood is so wide that the islands drift together. Perplexity is roughly "how many neighbours to trust": too small invents detail, too large blurs it. The fix is simple, try several values (5 to 50 is typical) and keep only what stays stable across them.

=== step === quiz
::eyebrow Check yourself
## Reading a map safely

On your t-SNE map, genre A's blob is twice as wide as genre B's, and sits far from genre C's. What can you safely conclude?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Genre A is twice as spread out, or has twice as many songs, as genre B ::no Blob size on these maps is an artifact of how points get packed; it reflects neither population nor spread.
- Genre A is much more different from C than from B, because it is drawn farther from C ::no Between-cluster distances are not reliable; the gaps are set by the layout and change from run to run.
- Very little about sizes or gaps; only that songs inside one blob are near-neighbours of each other ::ok Exactly. These methods preserve local membership, not global sizes or distances. Read who-groups-with-whom, and verify the rest on the data.

=== step === concept
::eyebrow The habit
## How to read one of these maps

Put the four traps together into a routine. Every time you look at a t-SNE or UMAP plot, run this checklist in your head.

::widget process-flow {"steps":[{"title":"Trust membership","sub":"read which points group together, not the sizes or the gaps"},{"title":"Run it twice","sub":"vary the seed and perplexity; keep only what stays stable"},{"title":"Confirm on the data","sub":"check a candidate cluster against the raw features"},{"title":"Treat it as a hypothesis","sub":"the map suggests structure; other tools verify it"}]}

Used this way, t-SNE and UMAP are superb tools: they turn an unplottable table into a picture that reveals real local structure. Abused, by reading sizes, distances, or a single lucky run as truth, they invent stories that were never in the data.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [van der Maaten and Hinton (2008), Visualizing Data using t-SNE (JMLR)](https://www.jmlr.org/papers/v9/vandermaaten08a.html) - the original t-SNE paper, with the probabilities and KL cost you saw here.
- [McInnes, Healy and Melville (2018), UMAP (arXiv:1802.03426)](https://arxiv.org/abs/1802.03426) - the UMAP paper: the neighbour graph and its layout.
- [Wattenberg, Viegas and Johnson (2016), How to Use t-SNE Effectively (Distill)](https://distill.pub/2016/misread-tsne/) - the definitive, interactive tour of the traps (sizes, distances, perplexity).
- [Rtsne package documentation (CRAN)](https://cran.r-project.org/package=Rtsne) - the R package you ran, and all of its arguments.
- [uwot package documentation (CRAN)](https://cran.r-project.org/package=uwot) - the R implementation of UMAP, with n_neighbors and min_dist.

=== step === complete
## Lesson 7 complete

You can now take a wide table of numbers that no scatter plot could show and turn it into a 2D map that preserves real local structure. You saw why PCA's straight-line map smears genres whose differences hide in lower-variance features, how t-SNE turns distances into neighbour probabilities and matches them in 2D, what perplexity does, how UMAP reaches the same goal through a neighbour graph, and, above all, the four traps: blob size, between-cluster distance, phantom clusters in noise, and perplexity sensitivity.

Next, Lesson 8: Association Rules and Market Basket. You leave continuous measurements behind for a different kind of pattern, which items show up together, like songs dropped into the same playlist, and you learn to tell a genuine co-occurrence from a coincidence.
