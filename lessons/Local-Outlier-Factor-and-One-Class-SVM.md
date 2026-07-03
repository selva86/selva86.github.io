---
title: "Anomaly Detection Lesson 3: Local Outlier Factor and One-Class SVM"
catalog_blurb: "Find outliers hiding in sparse local pockets, and wrap the normal region."
description: "Local Outlier Factor scores each point against its own neighbours to catch locally sparse outliers a global cutoff misses, plus a one-class SVM boundary in R."
keywords: "local outlier factor, LOF, one-class SVM, novelty detection, density-based anomaly detection, outlier detection, e1071, R"
post_type: "LESSON"
curriculum_id: "6.200.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "3"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Autoencoders-for-Anomaly-Detection.html"
course_prev: "Isolation-Forest-and-Extended-Isolation-Forest.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Local Outlier Factor and One-Class SVM

In Lesson 2, the isolation forest scored every charge on one global question: how few random cuts fence this point off from the whole dataset? That works beautifully for a point sitting far out on its own. But some outliers are not far from everything, they are only far from their own neighbourhood, and a global score walks right past them. That is exactly how a fraudulent $130 charge on Maya's card slips through: it is a touch bigger than her everyday $22 coffees but nowhere near her hundreds-of-dollars big purchases, so nothing global flags it.

This lesson catches those. First the **Local Outlier Factor (LOF)**, which scores each point against the density of its own neighbours. Then the **one-class SVM**, which learns a boundary around the normal region so you can wave any new point at it and ask, inside or out?

By the end of this lesson you will be able to:

- Explain why a single global cutoff both misses a locally-sparse outlier and false-alarms on legitimate spread-out points
- Define LOF as a local density ratio (k-distance, reachability distance, local density, the LOF ratio) and read LOF near 1 versus LOF well above 1
- Compute LOF from scratch in R and interpret the scores
- Fit a one-class SVM on normal data, tune its two knobs, and flag new points that fall outside the learned boundary

**Prerequisites:** you can run R and read base R (`matrix`, `data.frame`, `scale`, `dist`, `sapply`, small functions), and you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (global vs local outliers, distance vs density) and [Lesson 2: Isolation Forest](Isolation-Forest-and-Extended-Isolation-Forest.html) (a global detector). No SVM background is needed; the margin idea is built up here.

::widget lof-density {}

=== step === concept
::eyebrow The problem
## A global cutoff misses a local outlier

Let us keep working with Maya's card, but look at the shape of her spending more carefully. It has two natural clusters. A big, tight crowd of everyday charges: coffee, groceries, a few dollars, a few miles from home. And a small, loose scatter of legitimate big purchases: a laptop, a flight, hundreds of dollars, sometimes far away. Now a fraudulent $130 charge lands, 9 miles out. It is a bit bigger than her everyday spend, but nowhere near her big-purchase range.

Watch what a global rule does with it. First build the card (each lesson runs in a fresh R session, so we create the data here, run this once):

```r
set.seed(1)
everyday <- data.frame(amount = round(rnorm(60, 22, 5), 2),     # 60 small local charges
                       miles  = round(abs(rnorm(60, 3, 1)), 1))
biglegit <- data.frame(amount = round(rnorm(12, 520, 70), 2),   # 12 big, sometimes-far purchases
                       miles  = round(abs(rnorm(12, 18, 4)), 1))
fraud    <- data.frame(amount = 130, miles = 9)                 # the charge we want to catch
card <- rbind(everyday, biglegit, fraud)
card$kind <- c(rep("everyday", 60), rep("big legit", 12), "FRAUD")
Z <- scale(card[, c("amount", "miles")])   # put amount and miles on one common scale
nrow(card)
#> [1] 73
```

The obvious global rule (and the natural next step from Lesson 1's z-score) is: how far does each charge sit from the center of Maya's spending? Rank by that distance and look at the top of the list.

```r
card$global_dist <- sqrt(rowSums(Z^2))   # distance from the center, in 2-D (Lesson 1's z-score idea)

head(card[order(-card$global_dist), c("kind", "amount", "miles")], 5)   # the "most unusual" charges
#>         kind amount miles
#> 70 big legit 497.30  22.7
#> 61 big legit 484.58  20.1
#> 63 big legit 504.98  19.2
#> 68 big legit 517.37  17.8
#> 66 big legit 569.89  15.9

rank(-card$global_dist)[card$kind == "FRAUD"]   # where the fraud ranks (1 = most extreme)
#> [1] 22
```

The 12 charges a global cutoff screams about are all 12 of Maya's legitimate big purchases, pure false alarms. And the actual fraud? It ranks **22nd of 73**, buried in the crowd of ordinary charges. By distance-from-center, the fraud looks completely normal.

[KEY INSIGHT]
The fraud is not a global outlier. It is a **local** one: it sits in a sparse pocket right beside Maya's dense everyday cluster. To catch it we must stop asking "how far from everyone?" and start asking "how does this point's crowding compare to the crowding of the points around it?"

=== step === concept
::eyebrow The idea, made exact
## LOF is a local density ratio

The Local Outlier Factor turns "compare a point's crowding to its neighbours' crowding" into one number. It is built in four small steps, each one plain once you see it. Let \(A\) be the point we are scoring and fix a neighbourhood size \(k\) (say \(k = 8\)).

**1. k-distance.** \( d_k(A) \) is the distance from \(A\) to its \(k\)-th nearest neighbour. Small when \(A\) is crowded, large when \(A\) is off on its own. Call the set of those \(k\) nearest neighbours \( N_k(A) \).

**2. Reachability distance.** How far \(A\) is from a neighbour \(B\), but never counted as closer than \(B\)'s own k-distance:

\( \text{reach-dist}_k(A, B) = \max\{\, d_k(B),\ d(A, B) \,\} \)

where \( d(A,B) \) is the plain distance between them. That floor is just smoothing: it stops one freakishly close neighbour from making the density estimate jumpy.

**3. Local reachability density.** \(A\)'s own density is one divided by its average reachability distance to its neighbours:

\( \text{lrd}_k(A) = \left( \dfrac{1}{k} \displaystyle\sum_{B \in N_k(A)} \text{reach-dist}_k(A, B) \right)^{-1} \)

High when \(A\)'s neighbours sit close (a dense pocket), low when they sit far (a sparse pocket).

**4. The LOF ratio.** Finally, compare \(A\)'s density to the density of its neighbours:

\( \text{LOF}_k(A) = \dfrac{\dfrac{1}{k} \displaystyle\sum_{B \in N_k(A)} \text{lrd}_k(B)}{\text{lrd}_k(A)} \)

[KEY INSIGHT]
Read the LOF ratio like this. \( \text{LOF} \approx 1 \): \(A\) is as dense as its neighbours, so it belongs (a normal point). \( \text{LOF} \gg 1 \): \(A\) is in a far sparser pocket than the points around it, an outlier. \( \text{LOF} < 1 \): \(A\) is even denser than its neighbours, deep inside a cluster. Because the score is always relative to the local neighbourhood, a sparse-but-self-consistent cluster (Maya's big purchases) scores near 1, while a lone point wedged against a dense cluster (the fraud) scores high.

=== step === widget
::eyebrow Feel it
## Slide k and watch LOF light up

Here is LOF computed live on two clusters of different density plus one point stranded in a sparse pocket between them, exactly the shape of Maya's card. Each dot is coloured and sized by its LOF. Slide \(k\), the neighbourhood size, and watch the stranded point flare red (LOF well above 1) while the ordinary cluster points stay near 1. The panel also shows the from-scratch LOF in base R, the same few lines you will complete next.

::widget lof-density {}

Notice the stranded point is not the farthest from the overall center, it is simply much sparser than its immediate neighbours. That local comparison is the whole idea, and it is what the global distance in the previous step could not see.

=== step === tryit
::eyebrow Your turn
## Compute LOF on Maya's card

Let us score Maya's real charges. First build the pieces from the formula: all pairwise distances, each point's \(k\) neighbours, its k-distance, the reachability distance, and its local density `lrd`. Run this to see how sparse the fraud is compared to its neighbours:

```r
k <- 8                                   # judge each charge against its 8 nearest neighbours
D <- as.matrix(dist(Z))                  # all pairwise distances on the scaled features
knn   <- function(i) order(D[i, ])[2:(k + 1)]        # the k nearest neighbours of point i (drop self)
kdist <- function(i) D[i, knn(i)[k]]                 # k-distance: distance to the k-th neighbour
rd    <- function(i, o) max(D[i, o], kdist(o))       # reachability distance of i from neighbour o
lrd   <- function(i) 1 / mean(sapply(knn(i), function(o) rd(i, o)))   # local reachability density

lrd(73)                                  # the fraud (row 73): its own density is low
#> [1] 0.97
mean(sapply(knn(73), lrd))               # but its neighbours' density is high
#> [1] 8.7
```

The fraud's own density is `0.97`; its neighbours (the tight everyday cluster) sit at `8.7`. Their ratio is the LOF. Assemble the ratio, then score every charge. Fill in the blank with the fraud's own density so the ratio is neighbours-over-self.

```r
# LOF = average density of my neighbours / my own density
lof <- function(i) mean(sapply(knn(i), lrd)) / ____
card$lof <- sapply(seq_len(nrow(card)), lof)
aggregate(lof ~ kind, card, function(x) round(mean(x), 2))
```
::check {"regex":"lrd\\s*\\(\\s*i\\s*\\)","gate":true,"difficulty":"intermediate","ok":"Right: LOF = mean(neighbours' lrd) / lrd(i). The fraud scores about 9, every legitimate charge sits near 1.","no":"Divide by the point's OWN density: lrd(i). The ratio is neighbours' density over the point's own density."}
::solution
```r
lof <- function(i) mean(sapply(knn(i), lrd)) / lrd(i)   # neighbours' density / my own
card$lof <- sapply(seq_len(nrow(card)), lof)
aggregate(lof ~ kind, card, function(x) round(mean(x), 2))
#>        kind  lof
#> 1     FRAUD 8.98
#> 2 big legit 1.02
#> 3  everyday 1.17
```

The fraud scores **8.98**, while both the everyday charges and the legitimate big purchases average near **1**, exactly the local outlier a global cutoff ranked 22nd.

[WARNING]
LOF has real limits. It hinges on `k`: too small and the score is noisy, too large and it smears across genuinely separate clusters. It computes all pairwise distances, so it is \(O(n^2)\) and slow on large data. And in very high dimensions distances concentrate (everything looks equally far), which blunts every density method. In production reach for a fast, tested implementation such as `dbscan::lof()` rather than hand-rolling; you built it here to see exactly what it does.

=== step === quiz
::eyebrow Check yourself
## Why did LOF catch what distance missed?

A global distance-from-center score ranked the fraud 22nd of 73, but its LOF was about 9, the highest on the card. Which statement best explains why LOF flags it and distance does not?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- LOF measures distance from the overall mean more accurately, so it simply found a point the global rule mis-ranked ::no LOF is not a better global distance. It never compares the point to the overall center at all; it compares the point's local density to its neighbours' local density. That is a different question, which is why it sees a different answer.
- The fraud sits in a much sparser pocket than the dense everyday points right beside it, so its density-to-neighbour-density ratio is high, even though it is not far from the center ::ok Exactly. LOF is relative: a point wedged against a dense cluster but far sparser than it scores high, while a point in a genuinely sparse cluster scores near 1. Distance-from-center cannot make that local comparison.
- The fraud has the largest amount and miles values, so any density method would rank it first ::no It does not. Maya's legitimate big purchases have far larger values, yet their LOF is near 1 because they are normal relative to their own sparse cluster. LOF ranks by local density contrast, not by raw magnitude.

=== step === concept
::eyebrow From a score to a boundary
## One-class SVM: wrap the normal region

LOF hands you a number per point, recomputed over the whole dataset each time. Often you want something different: a reusable model, learned once from data you trust is normal, that can judge any future charge on its own. That framing is called **novelty detection**, and the classic tool for it is the **one-class SVM**.

The idea: train on normal data only, and learn a boundary that wraps it. Anything landing inside is normal; anything outside is a novelty, an anomaly. The trick is that Maya's normal spending is not a simple blob a straight line can fence off, it is two separate clusters. This is where kernels earn their keep.

The widget below shows the kernel trick on a two-class problem: no straight line can separate an inner group from a ring around it, but switch to an RBF kernel and the boundary bends into a closed curve that wraps the inner group exactly. Toggle the kernels and watch the training error fall to zero.

::widget kernel-svm {}

A one-class SVM uses this same closed-boundary machinery, with just one class. Instead of separating group A from group B, it separates your normal data from everything else (formally, from the origin in the kernel's feature space), drawing a boundary that hugs the shape of normal, however many clusters that shape has.

=== step === concept
::eyebrow The two knobs
## nu and gamma

A one-class SVM has two dials worth understanding. Its decision function scores a new point \(x\) as

\( f(x) = \operatorname{sign}\!\Big( \textstyle\sum_i \alpha_i\, K(x, x_i) - \rho \Big) \)

where \(K\) is the kernel, the \(\alpha_i\) are weights on the training points, and \(\rho\) is an offset. When \(f(x) < 0\) the point falls outside the boundary: flag it. With the RBF (radial) kernel,

\( K(x, x') = \exp\!\big( -\gamma\, \lVert x - x' \rVert^2 \big) \)

the two knobs are:

- **nu** \((\nu \in (0, 1])\): an upper bound on the fraction of training points allowed to fall outside the boundary, and a lower bound on the fraction that become support vectors. Set \(\nu = 0.05\) and you are telling the model "expect about 5% of my normal data to look like noise." Raise it to loosen how much slack you allow.
- **gamma** \((\gamma)\): the width of the RBF kernel. Large \(\gamma\) makes a tight, wiggly boundary that hugs each point (and risks memorizing noise); small \(\gamma\) makes a smooth, loose boundary that can swallow real anomalies.

[WARNING]
A one-class SVM is only as good as these two settings and your input scaling. It has no free lunch: too tight and it flags your own spread-out normal points, too loose and it lets anomalies in. Always scale features first (an RBF kernel is dominated by whichever feature has the larger range otherwise), and tune \(\nu\) and \(\gamma\) against data you trust. It also assumes the training set really is (mostly) normal; a contaminated training set moves the boundary.

=== step === tryit
::eyebrow Your turn
## Fit a one-class SVM in R

The `e1071` package fits a one-class SVM through its `svm()` function. The key is the `type` argument, which switches it from ordinary two-class classification into one-class "learn the normal region" mode. Train it on Maya's legitimate charges only, then score every charge. Fill in the blank with the one-class type.

```r
library(e1071)
train_normal <- Z[card$kind != "FRAUD", ]        # learn the shape of NORMAL spending only
oc <- svm(train_normal, type = "____",           # one-class: wrap the normal region
          nu = 0.05, kernel = "radial", gamma = 0.35)
card$outside <- !predict(oc, Z)                   # TRUE = falls OUTSIDE the learned boundary
table(outside = card$outside, kind = card$kind)
```
::check {"regex":"one-classification","gate":true,"difficulty":"intermediate","ok":"That is the one-class mode. The fraud lands outside the boundary; about 5% of the normal charges do too, which is exactly what nu = 0.05 allows.","no":"The one-class type in e1071 is \"one-classification\" (hyphenated). It tells svm() to wrap a single class rather than separate two."}
::solution
```r
library(e1071)
train_normal <- Z[card$kind != "FRAUD", ]
oc <- svm(train_normal, type = "one-classification",
          nu = 0.05, kernel = "radial", gamma = 0.35)
card$outside <- !predict(oc, Z)
table(outside = card$outside, kind = card$kind)
#>        kind
#> outside FRAUD big legit everyday
#>   FALSE     0        11       58
#>   TRUE      1         1        2
```

The fraud (never in training) lands **outside** the boundary: caught. So do 3 of the 72 normal charges, which is not a bug, it is `nu = 0.05` doing its job (about 5% of 72 is roughly 3 or 4). Tighten `nu` and fewer normal points spill out but a borderline anomaly might sneak in; that trade is the tuning.

=== step === quiz
::eyebrow Check yourself
## Pick the right detector

You now have three unsupervised detectors: the isolation forest (Lesson 2, a fast global score), LOF (a local density ratio), and the one-class SVM (a learned boundary around normal). A payments team wants to score each **incoming** transaction in real time against a fixed set of known-good historical transactions, without recomputing over the whole dataset every time. Which detector fits best, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- LOF, because it gives the most accurate anomaly score of the three ::no LOF has to place the new point among all the others and recompute neighbourhood densities every time; there is no reusable model to score a lone incoming point cheaply. It is excellent for locally-sparse outliers in a fixed batch, not for streaming against a frozen reference set.
- The isolation forest, because it is the fastest to score ::no Fast, yes, and great for a one-off unsupervised sweep of a batch, but the standard isolation forest is built from the dataset you score; it is not framed as "learn normal once, then judge new points." That novelty-detection framing is the one-class SVM's.
- The one-class SVM, because it learns a boundary from the known-good data once and then judges any new point on its own as inside or outside ::ok Exactly. That is novelty detection: fit once on trusted-normal data, then score each incoming point against the saved boundary in constant time. LOF and the isolation forest are computed relative to the dataset, so they fit a batch sweep better than streaming against a frozen reference.
- None; only a supervised classifier can score new transactions ::no All three are unsupervised and need no anomaly labels. The one-class SVM in particular is designed exactly for "train on normal, judge new points," which is what this team needs.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Breunig, Kriegel, Ng and Sander (2000), LOF: Identifying Density-Based Local Outliers, ACM SIGMOD](https://doi.org/10.1145/342009.335388) - the original paper that defined LOF and the local-density-ratio score you built here.
- [Schölkopf, Platt, Shawe-Taylor, Smola and Williamson (2001), Estimating the Support of a High-Dimensional Distribution, Neural Computation](https://doi.org/10.1162/089976601750264965) - the one-class SVM, the meaning of nu, and the origin-separating boundary.
- [e1071 (CRAN)](https://cran.r-project.org/package=e1071) - the R package whose svm(type = "one-classification") you used; the docs cover nu, gamma and kernels.
- [dbscan (CRAN)](https://cran.r-project.org/package=dbscan) - a fast, tested lof() (and other density methods) to reach for instead of hand-rolling LOF on real data.

=== step === complete
## Lesson 3 complete

You now have two detectors that see what a global score cannot. **LOF** scores each point by how its local density compares to its neighbours', catching an outlier wedged against a dense cluster that distance-from-center ranked as ordinary. The **one-class SVM** learns a boundary around normal data once, then judges any new point as inside or out, the novelty-detection framing you want for scoring incoming data in real time. And you saw the honest cost of each: LOF's dependence on `k` and \(O(n^2)\) distances, the one-class SVM's sensitivity to `nu`, `gamma` and scaling.

Three detectors down: isolation (global), density (local), and boundary (novelty). Next, Lesson 4: **Autoencoders for Anomaly Detection**. Instead of distance, density or a boundary, you will score a point by how badly a compressed model rebuilds it, the reconstruction error, and see why for a linear model that turns out to be exactly PCA.
