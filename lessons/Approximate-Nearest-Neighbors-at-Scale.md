---
title: "Advanced Supervised Learning Lesson 7: Approximate Nearest Neighbors at Scale"
catalog_blurb: "Fast similarity search over millions of items, by trading a little exactness."
description: "Approximate nearest neighbors in R: why exact kNN search fails at scale, navigable graphs, beam search and recall@10, and a real HNSW index on a live catalog."
keywords: "approximate nearest neighbors, HNSW, ANN search, vector search, kNN at scale, recall at k, RcppHNSW, navigable small world, similarity search, nearest neighbor index, R"
post_type: "LESSON"
curriculum_id: "6.140.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "7"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "A-Tuned-Stacked-Model-End-to-End.html"
course_prev: "Bayesian-Optimization-for-Hyperparameters.html"
---

=== step === cover
::eyebrow Lesson 7 of 8
## Approximate Nearest Neighbors at Scale

In Lesson 6 the expensive thing was training: one cross-validated fit cost 25 minutes, so we spent evaluations like a scientist. This lesson flips the ledger. For nearest-neighbor methods, training is free, and the bill arrives at prediction time, once per query, forever.

Meet Priya, a search engineer at a music-streaming service. Under every song sits a "More like this" shelf: the 10 tracks that sound most similar to the one playing. Each of her 4,000,000 tracks is stored as an **embedding**, a list of 64 numbers describing its sound, chosen so that similar-sounding tracks get nearby lists. Finding the shelf is exactly a nearest-neighbor query, the method you know from the classification course. The catch is the contract: the shelf must come back in under **15 milliseconds**, and at peak the service builds about 2,000 shelves a second. Exact kNN answers this query perfectly, and cannot possibly answer it fast enough.

By the end of this lesson you will be able to:

- Count the true cost of exact nearest-neighbor search, and say why no clever exact index rescues it in high dimension
- Read recall@10 as the honesty meter of an approximate answer
- Build a navigable graph in R and run the greedy and beam searches that power HNSW-style indexes, watching recall rise as the beam widens
- Run a production HNSW index in R, and know which dial to turn when recall falls short in the real system

**Prerequisites:** [kNN and the Curse of Dimensionality](kNN-and-the-Curse-of-Dimensionality.html) (what a kNN prediction is, Euclidean distance, and the fact that distances blur together in high dimension), and comfort reading R matrices. Everything else is built from scratch here.

The widget below is kNN exactly as you met it: place a query, the k nearest points light up. Notice what the highlight hides: to find those k points, the distance to EVERY point was measured. At 18 points that is invisible. At 4 million it is the whole problem.

::widget knn-vote {}

=== step === concept
::eyebrow The problem
## One query pays for the whole catalog

kNN "trains" by memorizing the data, and does all of its work at prediction time: measure the distance from the query to every stored point, keep the k closest. One shelf therefore costs \(n\) distance measurements, and each measurement compares \(d\) numbers, so the price per query is proportional to \(n \times d\), where \(n\) is the number of tracks in the catalog and \(d\) is the length of one embedding.

Put Priya's numbers in. One distance in 64 dimensions is roughly 200 arithmetic operations (a subtraction, a squaring and an addition per dimension). Times 4,000,000 tracks, that is around 800 million operations for ONE shelf. Even at two billion operations a second in tight compiled code, that is a few tenths of a second, against a budget of 15 milliseconds, for one listener, with 2,000 more arriving that second. Buying hundreds of servers to brute-force it is exactly what Priya's infrastructure bill cannot absorb.

Each lesson runs in a fresh interactive R session, so we build a small replica of her catalog right here: 2,000 tracks, embeddings of 8 numbers, and 6 broad style pockets (think lo-fi, metal, salsa) so that "similar tracks" genuinely exist. Small enough that every experiment runs in your browser in seconds; the mechanics are identical at 4 million.

```r
set.seed(42)
n <- 2000
d <- 8
genre   <- sample(1:6, n, replace = TRUE)              # each track's broad style
centers <- matrix(rnorm(6 * d, sd = 2), nrow = 6)      # each style's typical sound
X <- centers[genre, ] + matrix(rnorm(n * d), ncol = d) # tracks scatter around their style
dim(X)
#> [1] 2000    8
round(X[1:3, ], 2)
#>       [,1]  [,2]  [,3]  [,4] [,5]  [,6] [,7]  [,8]
#> [1,]  2.50 -0.55  2.90 -1.44 0.06  0.71 0.91 -1.19
#> [2,] -2.91 -1.95 -1.40  3.76 0.46 -0.32 4.84  1.07
#> [3,]  2.33 -2.06  4.49 -2.53 1.52  0.56 1.85  0.03
```

Row 1 IS track 1: its sound, compressed to 8 numbers. Now the search itself. Because wall-clock time depends on your machine, we count the thing that actually costs money: **distance measurements**. Every distance our code ever computes passes through one metered function, so the price of any search is a number we can read, not a stopwatch we have to trust. The query is a listener's **taste vector**: the average embedding of their last three plays, tracks 6, 10 and 14, all from the same style pocket.

```r
n_dist <- 0                        # the meter: every distance we compute gets counted
dist_to <- function(q, idx) {
  n_dist <<- n_dist + length(idx)
  sqrt(colSums((t(X[idx, , drop = FALSE]) - q)^2))
}

picks <- which(genre == 4)[1:3]    # the listener's last three plays
picks
#> [1]  6 10 14
q <- colMeans(X[picks, ])          # their taste vector: the average sound profile

n_dist  <- 0
d_all   <- dist_to(q, 1:n)         # measure the whole catalog
exact10 <- order(d_all)[1:10]      # the true top 10: the shelf, done exactly
exact10
#>  [1] 1610 1251  729 1588   14   10 1816  541  351 1160
round(d_all[exact10], 2)
#>  [1] 1.42 1.46 1.60 1.66 1.75 1.80 1.86 1.87 1.89 1.92
n_dist
#> [1] 2000
```

There is the exact shelf: track 1610 is the closest match at distance 1.42 (two of their own recent plays, 14 and 10, also make the cut; a real system would filter those out downstream). And there is the bill: 2,000 distance measurements, the entire catalog, for one query. Every future query pays it again in full.

[KEY INSIGHT]
Exact nearest-neighbor search has no warm-up discount: every query measures every stored point. The cost line is straight, cost proportional to n times d per query, and it passes through "unaffordable" long before 4 million tracks.

=== step === quiz
::eyebrow Check yourself
## The cost model

Priya's catalog doubles from 4 million to 8 million tracks, same 64-number embeddings, still exact search. What happens to the cost of one "More like this" shelf?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- It roughly doubles: exact search measures the distance to every stored track, so per-query cost scales directly with catalog size ::ok Right. The bill is n times d per query. Double n, double the bill, and it is paid on every single query, forever.
- It stays about the same, because the shelf still only needs the 10 nearest tracks ::no k sets how many results you KEEP, not how many you MEASURE. To know which 10 are nearest, exact search still has to measure all 8 million.
- It grows only slightly, because stored data can be indexed and searched in logarithmic time, like a database key lookup ::no That is exactly the right instinct, and in 64 dimensions it fails. A database key is one-dimensional; the next step shows precisely why that trick dies as dimensions grow.

=== step === concept
::eyebrow The dead end
## Why clever exact indexes stop helping

The obvious response to "we scan everything" is "so index it, like a database". For spatial data the classic index is the **k-d tree**: cut the space in half at the median of one coordinate, cut each half again on another coordinate, and keep going until each box holds a few points. At query time you descend to the query's box, measure its points, and here is the crucial move: you only search the OTHER side of a cut if the ball around the query, with radius equal to the best distance found so far, pokes across that cut. Every cut the ball does not cross is a whole chunk of catalog you never measure. In 2 dimensions this is glorious: map apps find your nearest cafe this way in microseconds.

In the [kNN lesson](kNN-and-the-Curse-of-Dimensionality.html) you watched distances concentrate as dimensions pile up: the nearest point ends up almost as far away as the farthest. Here is the consequence for indexes: the query's nearest-neighbor ball becomes FAT relative to every cut, so the ball crosses cut after cut, and each crossing forces the search into both halves. We can measure exactly that. For each dimensionality, the code drops 3,000 random points in a cube, makes one median cut per axis (a k-d tree's opening moves), and asks: what share of those cuts does the nearest-neighbor ball cross?

```r
set.seed(7)
crosses <- function(p) {
  P  <- matrix(runif(3000 * p), ncol = p)   # 3000 points in a p-dimensional cube
  qq <- runif(p)                            # one query
  di <- sqrt(colSums((t(P) - qq)^2))
  r  <- min(di)                             # radius to the true nearest neighbor
  meds <- apply(P, 2, median)               # one median cut per axis
  mean(abs(qq - meds) < r)                  # share of cuts the search ball crosses
}
data.frame(dimensions = c(2, 8, 32, 128),
           cuts_crossed = sapply(c(2, 8, 32, 128), crosses))
#>   dimensions cuts_crossed
#> 1          2         0.00
#> 2          8         0.75
#> 3         32         1.00
#> 4        128         1.00
```

In 2 dimensions the ball crosses no cuts: prune everything, log-time search, the cafe lookup. At 8 dimensions it already crosses three quarters of them. By 32, every single cut: the tree must explore both sides of every split, which is a full scan wearing an index costume. In Priya's 64 dimensions, exact indexing buys essentially nothing.

So the thing that has to give is exactness itself. The new contract: return 10 genuinely close tracks fast, without proving they are THE closest 10, and measure the quality of that bargain honestly. The measure is **recall@k**:

\[ \text{recall@}k = \frac{|A \cap E|}{k} \]

where \(A\) is the set of \(k\) ids the fast search returned, \(E\) is the set of true \(k\) nearest ids (computed the slow exact way, offline, as a yardstick), and \(|A \cap E|\) counts how many ids appear in both. Recall 1.0 means the fast answer IS the exact shelf; 0.9 means it found 9 of the true 10. Calibrate the scale on two searches you already understand:

```r
set.seed(1)
random10 <- sample(n, 10)                  # a "search" that just guesses 10 tracks
length(intersect(random10, exact10)) / 10  # recall@10 of guessing
#> [1] 0
length(intersect(exact10, exact10)) / 10   # recall@10 of exact search
#> [1] 1
```

Guessing scores 0, exact search scores 1, and every method in the rest of this lesson lives between them, judged on two axes at once: recall on one, distance measurements on the other.

[KEY INSIGHT]
"Approximate" does not mean sloppy. It is a measured contract: recall@k tells you exactly what fraction of the true answer you are getting, and the distance meter tells you exactly what you paid for it. The entire field of ANN search is the art of pushing recall toward 1.0 while the meter barely moves.

=== step === concept
::eyebrow The idea
## A graph you can navigate

If boxes and cuts die in high dimension, what structure survives? Relationships. Instead of carving space, give every track a short list of LINKS to other tracks, and answer queries by walking the links. The inspiration is the small-world experiment you already know informally as "six degrees of separation": hand a letter to anyone, ask them to pass it to whichever acquaintance seems closest to the target, and it lands in about six hops. Two kinds of connection make that work, and our graph copies both:

- **Short links:** each track points to its 10 most similar tracks, its sonic siblings. Once the walk is nearby, these let it home in on the exact target.
- **Long links:** each track also points to 4 random tracks anywhere in the catalog. These are the wormholes that let a walk cross the whole space in a hop or two instead of shuffling through thousands of neighbors.

Building the graph costs real work, but it is paid ONCE, offline, and every future query rides on it. That precomputed structure is the **index**. (Our toy build below measures every pair of tracks, the simplest possible construction; in a few steps we hand this job to a library that builds far more cleverly.)

```r
set.seed(99)
K <- 10   # short links: the 10 closest tracks
R <- 4    # long links: 4 random tracks anywhere
nb <- matrix(0L, n, K + R)
for (i in 1:n) {
  di <- sqrt(colSums((t(X) - X[i, ])^2))
  nb[i, 1:K] <- order(di)[2:(K + 1)]        # skip position 1: the track itself
  nb[i, (K + 1):(K + R)] <- sample(setdiff(1:n, c(i, nb[i, 1:K])), R)
}
nb[picks[1], ]   # one track's 14 links: 10 sonic siblings + 4 wormholes
#>  [1]  357  867 1721 1758 1713  196  653 1670  639  630  603 1189  601 1887
```

Now the search, and it is almost embarrassingly simple. Start at a fixed entry track. Measure the taste vector against the current track's 14 links only. If any link is closer than where you stand, hop to the closest one. Repeat until no link improves. That is **greedy search**:

::widget process-flow {"steps":[{"title":"Start at the entry track","sub":"a fixed door into the graph, here track 1"},{"title":"Measure the links","sub":"the 14 links of the current track against the taste vector"},{"title":"Hop to the closest link","sub":"whenever it beats the track you stand on"},{"title":"Stop when nothing improves","sub":"no link is closer: the walk has arrived"}]}

```r
greedy_search <- function(q, start = 1L) {
  cur   <- start
  d_cur <- dist_to(q, cur)
  path  <- cur
  repeat {
    d_nb <- dist_to(q, nb[cur, ])          # measure only the current track's 14 links
    if (min(d_nb) >= d_cur) break          # no link gets closer: stop
    cur   <- nb[cur, which.min(d_nb)]      # hop to the closest link
    d_cur <- min(d_nb)
    path  <- c(path, cur)
  }
  list(found = cur, path = path)
}

n_dist <- 0
g <- greedy_search(q)
g$path
#> [1]    1  839  194 1588 1610
c(found = g$found, true_nearest = exact10[1])
#>        found true_nearest 
#>         1610         1610 
n_dist
#> [1] 71
```

Read that carefully, because it is the whole promise of this lesson in three lines. Four hops: track 1 to 839 to 194 to 1588 to 1610. The destination, 1610, is the TRUE nearest track, the same one exact search found. And the meter reads 71, not 2,000: the walk measured about 3 percent of the catalog. Watch it move across the sound map (the 8 dimensions flattened to 2 for plotting only):

```r
library(ggplot2)
pc   <- prcomp(X)                          # flatten 8 dims to 2, for plotting only
proj <- data.frame(pc$x[, 1:2])
walk <- proj[g$path, ]
qp   <- data.frame(predict(pc, rbind(q))[, 1:2, drop = FALSE])
ggplot(proj, aes(PC1, PC2)) +
  geom_point(colour = "grey78", size = 1) +
  geom_path(data = walk, colour = "#b5631a", linewidth = 0.9) +
  geom_point(data = walk, colour = "#b5631a", size = 2.6) +
  geom_point(data = qp, aes(PC1, PC2), shape = 8, size = 4, stroke = 1.2, colour = "#2563a8") +
  annotate("text", x = proj$PC1[1], y = proj$PC2[1], label = "start", vjust = -1, size = 3.5) +
  labs(title = "Four hops across a 2,000-track catalog",
       x = "sound map, direction 1", y = "sound map, direction 2") +
  theme_minimal(base_size = 13)
```

The early hops leap across the map on long links; the last hop is a short-link shuffle into the exact right spot, ending on the blue star's doorstep. Before we celebrate, the honeymoon test: 200 different listeners, one greedy walk each. How often does the walk end on the true nearest track?

```r
set.seed(9)
Q <- X[sample(n, 200), ] + matrix(rnorm(200 * d, sd = 0.4), ncol = d)  # 200 taste vectors
exact_list <- vector("list", 200)
for (i in 1:200) exact_list[[i]] <- order(sqrt(colSums((t(X) - Q[i, ])^2)))[1:10]

hits <- sapply(1:200, function(i) greedy_search(Q[i, ])$found == exact_list[[i]][1])
mean(hits)
#> [1] 0.535
```

54 percent. Barely better than a coin flip. Our beautiful walk gets stuck short of the true nearest track almost half the time, and understanding exactly WHY is the key to everything that follows.

=== step === quiz
::eyebrow Check yourself
## Diagnose the 46 percent

For 93 of the 200 taste vectors, greedy search stopped on a track that was not the true nearest, even though the graph is connected and the true nearest was reachable. What went wrong on those queries?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The entry point is the bug: starting every walk at track 1 biases the search, and starting from a random track each time would fix it ::no A different door trades one set of failures for another set; over many queries the hit rate barely moves. The failure is not where the walk starts but what it remembers along the way, which is exactly what the next step fixes.
- The walk reached a track none of whose 14 links was closer to the taste vector, so the stop rule fired: a local minimum. A closer track exists elsewhere, but greedy has no way to step backward or sideways to find it ::ok Exactly. Greedy's rule is "hop only if a link improves RIGHT NOW", so any track whose links all point slightly the wrong way becomes a trap. The fix is not a better rule for the single walker, it is remembering more than one candidate at a time.
- Asking for more neighbors would fix it: the walk fails because k = 10 is too small a target ::no k sets how many results you keep at the END. These walks failed during the SEARCH, before k mattered at all: they stopped at a track with no improving link. A bigger shopping list does not help a shopper stuck in the wrong aisle.

=== step === concept
::eyebrow The fix
## Remember more than one path: beam search

Greedy carries exactly one candidate in its head, so one dead end kills the whole search. The fix used by every serious graph index is **beam search**: carry a shortlist of the best **ef** tracks seen so far (the "beam"), and repeatedly expand the closest shortlist member you have not expanded yet, adding its links to the pool. Stop when every track on the shortlist has been expanded. A dead end for one candidate is now just a detour: the beam keeps exploring from its other members, flows around the trap, and closes in from several directions at once. At ef = 1 this collapses back to plain greedy; the wider the beam, the harder it is to trap, and the more distances it pays along the way.

```r
beam_search <- function(q, ef = 16, k = 10, start = 1L) {
  ids <- start                    # every track measured so far
  ds  <- dist_to(q, start)
  expanded <- FALSE               # which of them we already expanded
  repeat {
    beam <- order(ds)[1:min(ef, length(ds))]     # the ef closest found so far
    todo <- beam[!expanded[beam]]
    if (length(todo) == 0) break                 # whole beam expanded: done
    cur <- todo[1]                               # closest not-yet-expanded track
    expanded[cur] <- TRUE
    new <- setdiff(nb[ids[cur], ], ids)          # its links we have not visited
    if (length(new)) {
      ids      <- c(ids, new)
      ds       <- c(ds, dist_to(q, new))
      expanded <- c(expanded, rep(FALSE, length(new)))
    }
  }
  ids[order(ds)[1:k]]             # the k best of everything measured
}

n_dist <- 0
beam10 <- beam_search(q, ef = 16)
identical(beam10, exact10)
#> [1] TRUE
n_dist
#> [1] 178
```

On the taste vector, a beam of 16 returns the exact shelf, all 10 tracks, for 178 distance measurements: recall 1.0 at 9 percent of the exact bill. But one query proves nothing, as the greedy honeymoon just taught us. Run the honest experiment: all 200 listeners, four beam widths, recall and cost averaged over every query.

```r
trade <- data.frame(ef = c(2, 8, 32, 64), recall = NA, distances = NA)
for (j in 1:4) {
  rec <- numeric(200)
  nd  <- numeric(200)
  for (i in 1:200) {
    n_dist <- 0
    approx10 <- beam_search(Q[i, ], ef = trade$ef[j])
    nd[i]  <- n_dist
    rec[i] <- length(intersect(approx10, exact_list[[i]])) / 10
  }
  trade$recall[j]    <- round(mean(rec), 3)
  trade$distances[j] <- round(mean(nd))
}
trade$share_of_catalog <- paste0(round(trade$distances / n * 100), "%")
trade
#>   ef recall distances share_of_catalog
#> 1  2  0.726        78               4%
#> 2  8  0.922       124               6%
#> 3 32  0.981       265              13%
#> 4 64  0.992       420              21%
```

This table is the entire economics of approximate search. A beam of 2 finds 73 percent of the true shelf for 4 percent of the work. Widen to 8 and recall jumps to 0.92 while the bill grows to just 6 percent. By ef = 32 you hold 98 percent of the exact answer for an eighth of the cost. And notice the shape: each doubling of ef buys less recall than the last, because the missing tracks are the pathological ones hiding behind stubborn local minima. The last few hundredths of recall are always the most expensive. Draw the frontier:

```r
ggplot(trade, aes(distances, recall)) +
  geom_line(colour = "#2563a8", linewidth = 1) +
  geom_point(size = 3, colour = "#2563a8") +
  geom_text(aes(label = paste0("ef = ", ef)), vjust = -0.9, size = 3.6) +
  geom_hline(yintercept = 1, linetype = 3) +
  labs(title = "The trade: recall against distance measurements per query",
       x = "distance measurements per query (exact search = 2000)",
       y = "recall@10, averaged over 200 queries") +
  theme_minimal(base_size = 13)
```

One honest caveat about our small stage: at n = 2,000 the savings look like 5x to 25x. The walk length grows roughly with the logarithm of the catalog while brute force grows in direct proportion to it, so at Priya's 4 million tracks the same beam measures a few thousand tracks instead of 4 million: the gap does not shrink at scale, it explodes.

[KEY INSIGHT]
ef is a dial, not a setting. The graph is built once; at query time the OPERATOR chooses a point on the recall-versus-cost frontier, per query if need be. Cheap-and-rough for an infinite-scroll shelf, wide-and-careful for a plagiarism check, same index underneath.

=== step === tryit
::eyebrow Your turn
## Price a skinny beam

Everything sits in your session: `beam_search`, the taste vector `q`, the exact shelf `exact10`, and the `n_dist` meter. Run a narrow beam, ef = 4, and compute its recall@10 against the exact shelf. The last line reports both the honesty score and the price paid.

```r
n_dist <- 0
approx10 <- beam_search(q, ef = 4)
recall <- ____
c(recall = recall, distances = n_dist)
```
::check {"regex":"intersect","gate":true,"difficulty":"intermediate","ok":"Recall 0.8 for 83 distance measurements: 8 of the true 10 tracks, for 4 percent of the exact bill. That is the whole trade in one line of R.","no":"Count the overlap between the approximate and exact id sets, as a share of k: length(intersect(approx10, exact10)) / 10."}
::solution
```r
n_dist <- 0
approx10 <- beam_search(q, ef = 4)
recall <- length(intersect(approx10, exact10)) / 10
c(recall = recall, distances = n_dist)
#>    recall distances 
#>       0.8      83.0
```

=== step === concept
::eyebrow The real thing
## HNSW: express lanes over the graph

Our flat graph mixes long and short links in one layer, so every walk pays the same shuffling cost. **HNSW**, Hierarchical Navigable Small World, takes the same two ingredients and arranges them properly: as a stack of layers, like a road network. The top layer holds a handful of tracks connected by long-range links, the motorways. Each layer down holds more tracks with shorter links. The ground layer holds every track, linked to its close neighbors, the streets. A search enters at the top, rides the motorways greedily until it stops improving, drops one layer, and repeats; only on the ground layer does it switch to the careful beam search you just built:

::widget process-flow {"steps":[{"title":"Enter at the top layer","sub":"a few tracks, long-range links: the motorways"},{"title":"Greedy until stuck, then drop down","sub":"each layer has shorter links than the last"},{"title":"Beam search on the ground layer","sub":"the ef dial you already know, on the street network"},{"title":"Return the k best","sub":"of everything measured on the descent"}]}

The hierarchy is what makes the whole thing scale: the number of hops grows roughly like \(\log n\), the logarithm of the catalog size, while brute force grows like \(n\) itself. At \(n = 4{,}000{,}000\), \(\log_2 n \approx 22\): a couple dozen hops to cross a catalog that exact search must scan end to end. The dials all have familiar meanings now. **M** is how many links each track keeps per layer, our K. **efConstruction** is the beam width used while BUILDING the graph (a wider build beam finds better links, at build-time cost). **ef** is the search beam you tuned in the last step. Memory is the quiet fourth dial: every track stores about M links per layer, so index RAM grows with n times M.

This is not a toy design: HNSW is the algorithm inside most vector databases and semantic-search engines you have heard of. In R it ships as `RcppHNSW`, a binding of hnswlib, the reference implementation. Point it at the same 2,000-track catalog (the package announces itself on load, so we keep the output clean):

```r
suppressMessages(library(RcppHNSW))
ann <- hnsw_build(X, distance = "l2", M = 16, ef = 200)   # build once: ef here is efConstruction
data.frame(hnsw  = as.vector(hnsw_search(rbind(q), ann, k = 10, ef = 32)$idx),
           exact = exact10)
#>    hnsw exact
#> 1  1610  1610
#> 2  1251  1251
#> 3   729   729
#> 4  1588  1588
#> 5    14    14
#> 6    10    10
#> 7  1816  1816
#> 8   541   541
#> 9   351   351
#> 10 1160  1160
```

The exact shelf, in the exact order, from an index that never scans the catalog. One detail deserves a hard look before you trust it: `distance = "l2"`. The metric you search with must be the metric your embeddings were trained for; models trained for cosine similarity need `distance = "cosine"`, and a mismatch returns wrong neighbors with no warning of any kind. Now the honest experiment, all 200 listeners:

```r
hres <- hnsw_search(Q, ann, k = 10, ef = 32)
mean(sapply(1:200, function(i) length(intersect(hres$idx[i, ], exact_list[[i]])) / 10))
#> [1] 1
```

Recall 1.000: every track of every listener's exact shelf, found without a single full scan. The layered build (a proper efConstruction beam instead of our 10-nearest-plus-4-random shortcut) simply produces a better-navigable graph than ours. Keep it in perspective: a 2,000-track catalog is easy mode. On million-scale catalogs, recall at this ef typically lands in the high 0.90s rather than at 1.0, which is exactly why you measure it on your own data instead of trusting anyone's benchmark, ours included.

=== step === quiz
::eyebrow The honest boundary
## When to reach for it, and which dial to turn

The machinery you now own is not always the right purchase. The honest decision table:

| Situation | Sensible search |
|---|---|
| Tens of thousands of items, relaxed latency | Brute force: exact, simple, fast matrix code, nothing to tune |
| Millions of items, millisecond budget | An HNSW-style ANN index |
| The answer must be provably exact (audits, deduplication with legal weight) | Exact search, and budget the hardware for it |
| The catalog churns constantly with inserts and deletes | ANN still works, but plan periodic rebuilds or pick a library with real delete support |

And the failure modes, honestly. **Filtered search:** "the 10 nearest JAZZ tracks" runs the walk on a graph that was built ignoring genre; heavy filters can strand the beam in regions where nothing qualifies, and recall quietly collapses. **Out-of-distribution queries:** a taste vector unlike anything in the catalog gives the walk no gradient to follow; recall measured on typical traffic says nothing about weird traffic. **Memory:** n times M links must live in RAM next to the vectors themselves. **Staleness:** the offline recall you measured is only as good as the queries you measured it on.

[WARNING]
An approximate index answers with the confidence of an exact one. No error, no warning, no confidence score tells you recall has dropped. The only way to know is to sample live queries, compute the exact answer for them offline, and track recall@k as a monitored metric, the way Priya is about to.

Priya ships HNSW with M = 16 and ef = 32. A week later her offline audit job, which recomputes exact shelves for a sample of live queries every night, reports recall@10 = 0.86 against a product target of 0.95. What should she reach for FIRST?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- Rebuild the index with a larger M, so every track carries more links ::no This genuinely raises recall, and it is the SECOND move. A rebuild of a 4-million-track index costs hours of compute and a re-deploy; you try it after the free knob falls short.
- Raise ef at query time: no rebuild, effective immediately, each query simply pays a few hundred more distance measurements ::ok Right. ef is the runtime dial on the recall frontier, the same one you turned in your own beam search. Widen it, re-check the nightly recall number, and only reach for a rebuild (bigger M or efConstruction) if the frontier itself is too low.
- Raise k, asking the index for 30 results, and keep the best 10 ::no k changes how many results you keep, not how thoroughly the graph is searched. The missing tracks were never found by the walk, so a longer results list still does not contain them.
- Switch the shelf back to exact search until recall reaches 1.0 ::no Recall 1.0 at a few tenths of a second per query, times 2,000 queries a second, is the exact bill that made this lesson necessary. The product target is 0.95, not 1.0, and the frontier reaches it for a few hundred extra distance measurements.

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take this further, in reading order:

- [Malkov and Yashunin (2016), "Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs"](https://arxiv.org/abs/1603.09320) - the HNSW paper: the layer hierarchy, the link-selection heuristic, and the benchmarks that made it the default.
- [RcppHNSW on CRAN](https://cran.r-project.org/package=RcppHNSW) - the R binding you used, with the full argument reference for M, ef and the distance metrics.
- [hnswlib](https://github.com/nmslib/hnswlib) - the reference C++ implementation living inside RcppHNSW and most vector databases; the README is a compact practitioner's guide to the dials.
- [ANN-Benchmarks](https://ann-benchmarks.com/) - the standard public benchmark: recall-versus-throughput frontiers, exactly like the one you drew, for dozens of libraries on real datasets.
- [Annoy](https://github.com/spotify/annoy) - the random-projection-tree alternative, built at a music-streaming company for precisely the "similar tracks" shelf; a good contrast to graph-based search.

=== step === complete
## Lesson 7 complete

You gave Priya her shelf back. You counted the exact bill, one distance measurement for every stored track on every query, and watched a k-d tree's pruning power evaporate as the nearest-neighbor ball crossed every cut past a few dozen dimensions. You replaced the guarantee with a measured contract, recall@k, and built the machine that earns it: a navigable graph of sonic siblings and wormholes, a greedy walk that found the true nearest track in 4 hops and 71 measurements, then got trapped at local minima on 46 percent of real queries, and the beam search that flows around those traps, hitting recall 0.98 for 13 percent of the exact cost. Finally you ran the production version, HNSW, whose layered motorways-to-streets build returned every listener's exact shelf on this catalog, and you learned which dial to turn when the nightly recall audit disappoints: ef first, M second, exact search never (at this scale).

Next, Lesson 8: A Tuned Stacked Model End to End. You have spent seven lessons collecting powerful, tunable parts: SVMs with kernels, Gaussian processes, stacking, Bayesian optimization, and fast neighbors. The final lesson assembles them into one honest pipeline: tune the base learners, stack them, and evaluate the whole thing without fooling yourself.
