---
title: "Anomaly Detection Lesson 2: Isolation Forest and Extended Isolation Forest"
catalog_blurb: "Why anomalies isolate in fewer random splits, and how that becomes a score."
description: "Build an isolation forest in R from scratch: random splits fence off outliers in fewer cuts, average path length becomes the anomaly score, and the extended oblique-split variant."
keywords: "isolation forest, extended isolation forest, anomaly detection, outlier detection, path length, anomaly score, unsupervised learning, R"
post_type: "LESSON"
curriculum_id: "6.200.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "2"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Local-Outlier-Factor-and-One-Class-SVM.html"
course_prev: "What-is-an-Anomaly.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Isolation Forest and Extended Isolation Forest

In Lesson 1 you scored "unusual" by modelling what normal looks like and then measuring how far a point sat from it. Isolation forests throw that idea out. They never model normal at all. They just chop the space with random cuts and ask a single question: how many cuts does it take to fence this one point off, alone?

Maya's $2,400 charge from an electronics store 300 miles from home needs only a handful of cuts to end up by itself. Her thousandth $20 coffee, buried among all the others, needs many. That gap, few cuts versus many, is the whole anomaly score. Toggle the panel below between a crowded point and the outlier and watch the isolating path get much shorter for the outlier.

By the end of this lesson you will be able to:

- Explain isolation: why an outlier is fenced off by random splits in far fewer cuts than a crowded point
- Turn the average number of cuts (the path length) into an anomaly score with the standard formula
- Score points in R with an isolation forest you build from scratch
- Say what the Extended Isolation Forest changes, why axis-aligned cuts leave a blind spot, and when the fix matters

**Prerequisites:** you can run R and read base R (`matrix`, `apply`, `runif`/`rnorm`, and a small recursive function), and you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (global vs local outliers, distance vs density, precision and recall). No prior tree knowledge needed: an isolation tree is simpler than a decision tree, because its splits are random rather than chosen.

::widget isolation-forest {}

=== step === concept
::eyebrow The mindset flip
## Stop modelling normal. Isolate the odd one.

Every method in Lesson 1 shared one shape: build a picture of "normal" (a center, a density, a neighbourhood), then score how far each point falls from it. That works, but it spends all its effort describing the huge, boring majority just to catch the rare few.

Isolation turns the problem inside out. Pick a feature at random, pick a random split value inside its range, and cut. Now do it again inside whichever half your point landed in. Keep going until your point sits alone in its own little box. An **isolation tree** is exactly this: a stack of random yes/no splits, grown until every point is isolated.

Here is the key intuition. A point out in empty space, like Maya's far-away $2,400 charge, gets sliced off from everyone else in just a couple of random cuts. A point deep inside the crowd shares its neighbourhood with dozens of others, so it takes many cuts to peel it away from all of them. The tree below is one such isolation tree: the outliers drop into shallow leaves after one or two questions, while the crowd keeps splitting.

::widget tree-diagram {"root":"miles over 100 from home?","l":"amount over $40?","r":"amount over $1000?","leaves":["crowd, keep splitting","crowd, keep splitting","far $55 charge, alone","the $2,400 charge, alone"]}

[KEY INSIGHT]
An anomaly is a point that is *easy to isolate*. Because it sits apart from the crowd, a few random cuts already fence it off. Normal points, packed together, resist isolation. Isolation forests measure that resistance directly, with no model of "normal" anywhere in sight.

=== step === concept
::eyebrow The measurement
## How many cuts to fence one point off?

Let us make "how many cuts" concrete and countable. First, rebuild Maya's card as points in a two-feature space, the charge amount and how many miles from home it was, with three suspicious charges at the end. Each lesson runs in a fresh R session, so we create the data right here (run this once):

```r
set.seed(1)
n <- 120
normal <- data.frame(
  amount = round(rlnorm(n, meanlog = log(20), sdlog = 0.4), 2),  # everyday charges ~ $20
  miles  = round(abs(rnorm(n, 3, 2)), 1)                         # a few miles from home
)
anom <- data.frame(amount = c(2400, 1800, 55), miles = c(300, 210, 260))  # 3 to scrutinise
tx <- rbind(normal, anom)
tx$kind <- c(rep("normal", n), rep("anomaly", 3))
M <- as.matrix(tx[, c("amount", "miles")])   # the 2 numeric features the forest splits on
tail(tx, 4)
#>     amount miles    kind
#> 120  18.63   3.0  normal
#> 121 2400.00 300.0 anomaly
#> 122 1800.00 210.0 anomaly
#> 123   55.00 260.0 anomaly
```

Now write one isolation tree as a short recursion. Starting from all the rows, it picks a random feature, picks a random split inside that feature's range, keeps only the side holding our point `x`, and repeats. The **path length** is the number of cuts `e` it takes until `x` is alone (one row left). We add `cn(m)`, a small correction for the few points that would still be together if we stopped early; the next step explains it.

```r
cn <- function(m) if (m > 2) 2 * (log(m - 1) + 0.5772157) - 2 * (m - 1) / m else if (m == 2) 1 else 0

iso_path <- function(x, d, e = 0, lim = 30) {   # cuts to isolate row x within data d
  m <- nrow(d)
  if (m <= 1 || e >= lim) return(e + cn(m))     # x is alone (or we hit the depth cap)
  j  <- sample(ncol(d), 1)                       # a random feature
  lo <- min(d[, j]); hi <- max(d[, j])
  if (lo == hi) return(e + cn(m))
  sp <- runif(1, lo, hi)                          # a random split inside its range
  side <- if (x[j] < sp) d[, j] < sp else d[, j] >= sp
  iso_path(x, d[side, , drop = FALSE], e + 1, lim)  # recurse into the side holding x
}

set.seed(7)
iso_path(M[1, ],   M)   # a normal $16 charge
#> [1] 14
iso_path(M[121, ], M)   # the $2,400 charge, 300 miles away
#> [1] 3
```

The normal charge took **14** cuts to isolate; the outlier took **3**. That single tree is random and noisy, so one number is not enough. The fix, next, is to average many trees.

=== step === concept
::eyebrow From cuts to a score
## Average path length becomes the score

One random tree is a coin flip. A **forest** is many isolation trees, each grown on the same points with its own random cuts, and the signal is the *average* path length across them. Write \( h(x) \) for the path length of point \( x \) in one tree, and \( E[h(x)] \) for its average over the whole forest, the typical number of cuts to isolate \( x \).

There is one wrinkle: bigger datasets take more cuts to isolate anyone, so raw path lengths are not comparable across sample sizes. We divide by \( c(n) \), the average path length you would expect by chance in a random tree over \( n \) points. It comes from the theory of binary search trees:

\( c(n) = 2H(n-1) - \dfrac{2(n-1)}{n}, \qquad H(k) \approx \ln(k) + 0.5772 \)

where \( H(k) \) is the \( k \)-th harmonic number and \( 0.5772 \) is the Euler-Mascheroni constant (that is exactly the `cn()` function above). The **anomaly score** normalizes and flips the path length so bigger means more anomalous:

\( s(x) = 2^{-\,E[h(x)]\,/\,c(n)} \)

Read the scale like this: when a point isolates far faster than chance (\( E[h(x)] \) much smaller than \( c(n) \)), the exponent is near 0 and \( s \) climbs toward **1**, an anomaly. When it isolates at the typical rate (\( E[h(x)] \approx c(n) \)), \( s \approx 0.5 \), ordinary. Score every suspect against the forest:

```r
score <- function(x, D, trees = 200)   # anomaly score of point x, 0 (normal) .. 1 (anomaly)
  2^(-mean(replicate(trees, iso_path(x, D))) / cn(nrow(D)))

set.seed(42)
round(c(normal      = score(M[1, ],   M),
        far_and_big = score(M[121, ], M),
        large       = score(M[122, ], M),
        far_small   = score(M[123, ], M)), 3)
#>      normal far_and_big       large   far_small
#>       0.356       0.851       0.826       0.808
```

The normal charge scores **0.356** (comfortably below 0.5). All three suspects score above **0.80**, including the $55 charge whose *amount* is unremarkable but whose location, 260 miles from home, isolates it fast. Distance and density both would have needed the right feature scaling to catch that one; isolation caught it for free.

[NOTE]
There is no training step and no labels. The forest never saw which points were "anomaly", it only ever cut the space at random. That is why isolation forests are a favourite for genuinely unsupervised anomaly detection: you feed in raw points and read out a score.

=== step === widget
::eyebrow Feel it
## Short path, high score

Now that you know what the number means, play with the mechanism. Toggle between a crowded cluster point and the lone outlier. Watch the random cuts fence the point off, count how many it takes, and read how the average path length becomes the anomaly score. The outlier's short path pushes its score toward 1; the cluster point's long path settles near 0.5.

::widget isolation-forest {}

Notice something about those cuts as they appear: every single one is either perfectly horizontal or perfectly vertical. Hold that thought. It is the small flaw the Extended Isolation Forest exists to fix, and we get there in two steps.

=== step === quiz
::eyebrow Check yourself
## Which point is more anomalous?

Your forest isolates point A in an average of **3** cuts and point B in an average of **14** cuts (same dataset, same forest). Which point is more anomalous, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Point A: a short path means the random cuts fenced it off quickly, which is what happens to points sitting apart from the crowd ::ok Right. Fewer cuts to isolate means the point was already out on its own, so its score sits near 1. Isolation forests read a short average path as anomalous.
- Point B: 14 cuts means the forest worked harder to separate it, so it must be the stranger one ::no It is the reverse. Needing many cuts means the point was buried among neighbours and hard to peel away, the signature of a normal point. Effort to isolate is high exactly when the point is crowded.
- You cannot tell without the raw amount and miles values for A and B ::no You do not need them. The whole point of isolation forests is that the average path length already encodes how apart a point sits; the score is a function of the path length alone.

=== step === concept
::eyebrow The blind spot
## Every cut goes straight up or straight across

Look again at what `iso_path` does: `j <- sample(ncol(d), 1)` picks *one* feature, then it splits on that feature alone. In two dimensions that means every cut is a horizontal or a vertical line, never a diagonal. The forest can only carve the plane into rectangles.

Usually that is fine. But it quietly biases the score map. Take a perfectly round, symmetric cloud of normal points. By symmetry, a test point sitting a fixed distance out should get the *same* anomaly score no matter which direction it lies in, north, north-east, east, they are all equally far from the crowd. Let us put that to the test. We place points on a ring at equal distance from the center and score each with the standard forest:

```r
set.seed(3)
B <- matrix(rnorm(400), 200, 2)   # 200 normal points, a round symmetric cloud
r <- 4.5
angle <- seq(0, 315, by = 45)     # 8 directions around the ring
ring  <- t(sapply(angle * pi / 180, function(a) c(r * cos(a), r * sin(a))))

set.seed(1)
std <- apply(ring, 1, function(p) score(p, rbind(B, p), trees = 250))
data.frame(angle = angle, standard = round(std, 3))
#>   angle standard
#> 1     0    0.737
#> 2    45    0.772
#> 3    90    0.736
#> 4   135    0.761
#> 5   180    0.765
#> 6   225    0.797
#> 7   270    0.737
#> 8   315    0.794
sd(std)   # by symmetry this should be ~0; it is not
#> [1] 0.025
```

The scores should all be identical. Instead they swing from about 0.74 to 0.80. Look at the pattern: the points lying straight along an axis (0, 90, 270 degrees) score *lowest*, while the ones on the diagonals (45, 225, 315) score *highest*. The forest treats the diagonal directions as more anomalous purely because its rectangular cuts fence off diagonal points faster. That is an artifact of the tool, not a truth about the data.

[WARNING]
This axis-aligned bias creates "ghost" regions: bands of misleadingly low anomaly score stretched along the feature axes through the data. A genuinely odd point that happens to line up with an axis can hide in that shadow. The effect grows when features are correlated (the cloud lies on a diagonal) and in higher dimensions.

=== step === concept
::eyebrow The fix
## Extended Isolation Forest: cut at an angle

The Extended Isolation Forest (Hariri, Carrasco Kind and Brunner, 2019) changes exactly one thing: instead of cutting along a single feature, it cuts along a random *direction*. Pick a random vector \( \mathbf{w} \) (a random slope) and a random point \( \mathbf{p} \) inside the data's box, then split by which side of the sloped line each point falls on:

\( \text{point } \mathbf{z} \text{ goes left if } (\mathbf{z} - \mathbf{p}) \cdot \mathbf{w} < 0, \text{ else right} \)

The dot with \( \mathbf{w} \) projects every point onto the random direction; the cut is a hyperplane at any angle, not just horizontal or vertical. It is a one-line change to the split, and nothing else about the forest moves:

```r
iso_ext <- function(x, d, e = 0, lim = 30) {
  m <- nrow(d)
  if (m <= 1 || e >= lim) return(e + cn(m))
  w <- rnorm(ncol(d))                                    # a random direction (a sloped cut)
  p <- apply(d, 2, function(col) runif(1, min(col), max(col)))  # a random point in the box
  proj <- as.numeric(d %*% w); cut <- sum(p * w); px <- sum(x * w)
  side <- if (px < cut) proj < cut else proj >= cut       # which side of the sloped line
  if (all(side) || !any(side)) return(e + cn(m))
  iso_ext(x, d[side, , drop = FALSE], e + 1, lim)
}
score_ext <- function(x, D, trees = 200)
  2^(-mean(replicate(trees, iso_ext(x, D))) / cn(nrow(D)))

set.seed(1)
ext <- apply(ring, 1, function(p) score_ext(p, rbind(B, p), trees = 250))
data.frame(angle = angle, standard = round(std, 3), extended = round(ext, 3))
#>   angle standard extended
#> 1     0    0.737    0.688
#> 2    45    0.772    0.711
#> 3    90    0.736    0.702
#> 4   135    0.761    0.707
#> 5   180    0.765    0.708
#> 6   225    0.797    0.696
#> 7   270    0.737    0.699
#> 8   315    0.794    0.708
c(standard_sd = round(sd(std), 3), extended_sd = round(sd(ext), 3))
#> standard_sd extended_sd
#>       0.025       0.008
```

Now the ring scores barely move: the spread drops from 0.025 to **0.008**, about three times more even. With no privileged direction, the score map becomes smoothly radial and the axis-aligned ghost regions disappear.

[NOTE]
Be honest about the size of the win. On simple, axis-aligned data the two forests score almost the same, and the standard forest still flags every real outlier here. The extended variant is a refinement, not a revolution: it matters most when features are correlated or high-dimensional. In practice you rarely hand-roll this. The `isotree` package fits both, tunes the subsample size (the classic default draws 256 points per tree), sets a contamination rate, and runs fast; building it from scratch, as you just did, is how you understand what it is doing.

=== step === tryit
::eyebrow Your turn
## Turn a path length into a score

A new transaction is run through your forest and comes back with an average path length of `h = 4.2` cuts, against the same 123-row dataset (so `cn(nrow(M))` is the normalizer). Fill in the blank so `s` is the anomaly score, then decide from the number whether it is worth a second look.

```r
h <- 4.2                 # this point's average isolation path length
s <- 2^(____)            # convert it to an anomaly score in (0, 1)
round(s, 3)
```
::check {"regex":"-\\s*h\\s*/\\s*cn","gate":true,"difficulty":"intermediate","ok":"Correct. The score is 2^(-h / cn(nrow(M))) = 0.718. Above 0.5 and climbing toward 1, so this transaction isolates faster than a typical point: flag it for review.","no":"The score flips and normalizes the path length: raise 2 to the power of MINUS h divided by the normalizer, 2^(-h / cn(nrow(M)))."}
::solution
```r
h <- 4.2
s <- 2^(-h / cn(nrow(M)))
round(s, 3)
#> [1] 0.718
```

=== step === quiz
::eyebrow Check yourself
## What does "Extended" actually change?

Compared to a standard isolation forest, what does the Extended Isolation Forest change, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It grows more trees on larger subsamples, so the average path length is more stable ::no The ensemble is the same: same number of trees, same sampling, same path-length-to-score formula. Growing more trees reduces noise but does nothing about the axis-aligned bias, which is what "extended" targets.
- It replaces axis-aligned cuts with random-slope (oblique) hyperplanes, removing the bias that made the score map depend on direction ::ok Exactly. The only change is the split geometry: a random direction instead of a single feature. That erases the axis-aligned ghost regions and makes the score map smoothly radial.
- It always produces a more accurate detector on every dataset ::no It is a refinement, not a universal upgrade. On axis-aligned or low-dimensional data the two score almost identically; the extended version pays off mainly when features are correlated or high-dimensional.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Liu, Ting and Zhou (2008), Isolation Forest, IEEE ICDM](https://doi.org/10.1109/ICDM.2008.17) - the original paper that introduced isolating anomalies instead of profiling normal, and the path-length score.
- [Hariri, Carrasco Kind and Brunner (2019), Extended Isolation Forest (arXiv, open access)](https://arxiv.org/abs/1811.02141) - the oblique-split variant, with the score-map figures that show the axis-aligned artifact you measured here.
- [isotree: Isolation-Based Outlier Detection (CRAN)](https://cran.r-project.org/package=isotree) - the fast R package that fits both the standard and extended forests, with subsampling and contamination controls.
- [Aggarwal (2017), Outlier Analysis, 2nd ed. (Springer), ch. 5-6](https://doi.org/10.1007/978-3-319-47578-3) - where isolation forests sit among the wider family of ensemble and high-dimensional detectors.

=== step === complete
## Lesson 2 complete

You now have a whole anomaly detector that never models normal. It cuts the space at random, counts how many cuts isolate each point, averages that path length over a forest, and turns it into a score near 1 for the easy-to-isolate outliers. You saw why the standard cuts, always horizontal or vertical, tilt the score map, and how the Extended Isolation Forest fixes it by cutting at random angles.

Next, Lesson 3: Local Outlier Factor and the One-Class SVM. Isolation forests are a global, distance-flavoured detector. Next you will go back to the density idea from Lesson 1 and make it rigorous, catching the locally-sparse points a global score still misses, then draw a learned boundary around the normal region with a one-class support vector machine.
