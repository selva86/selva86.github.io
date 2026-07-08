---
title: "Anomaly Detection Lesson 2: Isolation Forest and Extended Isolation Forest"
description: "How isolation forests flag anomalies in R: why outliers isolate in fewer random cuts, how path length becomes an anomaly score, and how the extended forest fixes the axis bias."
keywords: "isolation forest, extended isolation forest, anomaly detection, outlier detection, path length, anomaly score, unsupervised learning, R"
mathjax: true
webr: true
curriculum_id: "6.200.2"
post_type: "LESSON"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "2"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Local-Outlier-Factor-and-One-Class-SVM.html"
course_prev: "What-is-an-Anomaly.html"
lesson_access: "pro"
catalog_blurb: "Catch rare outliers by how few random cuts it takes to isolate them."
---

=== step === cover
::eyebrow Lesson 2 of 7
## Isolation Forest and Extended Isolation Forest

In a cold-storage warehouse, 200 freezer units hum along at about 18 degrees below zero, each drawing roughly 3 kilowatts. Then **Unit 27** starts to fail: it drifts up to 8 below and pulls 5.2 kilowatts, working hard and losing. Catch it tonight and the stock is saved; miss it and by morning a room of frozen food is ruined. You have no labels and no history of past failures, just tonight's readings. How do you find the one unit that does not belong?

Lesson 1 defined what an anomaly is and warned about the base-rate trap: at a 1% anomaly rate, even a 99%-accurate flag is mostly false alarms, so we judge detectors by precision and recall. This lesson builds your first real detector, one with a wonderfully simple idea at its heart: **an anomaly is the point that is easiest to isolate.**

By the end of this lesson you will be able to:

- Explain why an anomaly gets fenced off by random cuts in far fewer steps than a normal point
- Grow an isolation path in R and turn the average path length into an anomaly score
- Score a whole fleet, set a threshold, and read what the scores mean
- Say where the standard forest has an axis-aligned blind spot, and how the extended forest fixes it

**Prerequisites:** you can run R and read base R (functions, recursion, `apply` and `replicate`), and you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (global vs local outliers, and the base-rate trap). No tree or ensemble background is needed; an isolation tree is simpler than a decision tree, and every term is defined here.

::widget isolation-forest {}

=== step === concept
::eyebrow The idea
## Few and different are easy to isolate

Picture the 200 normal freezers as a tight cloud of dots: all near 18 below, all drawing about 3 kilowatts, packed close together. Unit 27 sits by itself, far out in empty space. Now play a game. Draw a random straight line across the plot and ask: is Unit 27 alone on its side yet? Because it is out in the open, one or two lines already fence it off with nobody else. A normal unit buried in the middle of the cloud is a different story: line after line still leaves it surrounded by neighbours, and it takes many cuts before it finally stands alone.

That gap is the whole method. The number of random cuts it takes to fence a point off on its own is a measure of how isolated it is.

[KEY INSIGHT]
Anomalies are "few and different", so they live in sparse, empty regions. A handful of random cuts isolates them. Normal points are "many and similar", packed together, so they resist isolation and need many cuts. **Fewer cuts to isolate means more anomalous.** No distances, no density estimates, no labels: just how hard a point is to separate.

This is the reverse of most methods, which describe what normal looks like and then measure distance from it. Isolation forests never model normal at all. They go straight for the odd point, and that is what makes them fast.

=== step === widget
::eyebrow See it move
## Watch it isolate, live

Below is a real cloud of points with one outlier, and a set of random axis-aligned cuts. Toggle between a point inside the cluster and the outlier, and watch the isolating path. The cluster point takes many cuts to fence off; the outlier is cornered in just a few. The average number of cuts over many trees becomes the anomaly score shown beside it.

::widget isolation-forest {}

The runnable code beside the plot is a complete isolation forest in a dozen lines of base R. We will build the same idea up piece by piece, on our freezer fleet, so every line makes sense.

=== step === concept
::eyebrow The building block
## An isolation tree

One round of "keep cutting until this point is alone" is called an **isolation tree**. Growing one is deliberately mindless, which is the beauty of it. At each step you look at the group of points still with your target, and you:

1. **Pick a feature at random** (temperature or power).
2. **Pick a split value at random**, somewhere between that feature's smallest and largest value in the current group.
3. **Keep only the side that still holds your point**, and repeat on that smaller group.

You stop when your point is alone. The **path length** is simply how many cuts that took: the depth of the branch that ends in your point sitting by itself. There is no cleverness in the splits, no purity score, no best-cut search like a decision tree. Every cut is a coin flip. The anomaly signal comes entirely from the fact that isolated points run out of neighbours fast.

[NOTE]
A decision tree chooses each split to separate labelled classes as cleanly as possible. An isolation tree chooses each split at random and has no labels at all. Randomness is a feature here: it is what lets many cheap, independent trees vote together.

=== step === tryit
::eyebrow Your turn
## Count the cuts in R

First, build the fleet. Each lesson runs in a fresh R session, so we make the data right here (run this once). We keep the full-precision numbers for the algorithm and round only for display.

```r
set.seed(1)
n <- 200
load  <- rnorm(n)                                    # each unit's latent operating load
temp  <- -18 + 1.2 * load  + rnorm(n, 0, 0.30)       # freezer temperature, deg C
power <-   3 + 0.35 * load + rnorm(n, 0, 0.08)       # compressor power draw, kW
fleet <- data.frame(unit = 1:n, temp, power)
fleet[27, c("temp", "power")] <- c(-8.0, 5.2)        # Unit 27: warm AND straining, a fault
X <- as.matrix(fleet[, c("temp", "power")])
cat("correlation of the two readings:", round(cor(temp, power), 2), "\n")
print(round(fleet[c(1, 27), ], 2))
#> correlation of the two readings: 0.93
#>    unit   temp power
#> 1     1 -18.63  2.87
#> 27   27  -8.00  5.20
```

Now the isolation path itself. It recurses: pick a random feature, pick a random split between that feature's min and max in the current group, keep the side holding `x`, and count one cut. Fill in the blank so the split value is drawn between the node's minimum `lo` and maximum `hi`.

```r
ipath <- function(x, d, e = 0) {          # count cuts to fence x off alone
  m <- nrow(d)
  if (m <= 1 || e > 60) return(e)         # x is alone: e cuts did it
  j  <- sample(ncol(d), 1)                # a random feature
  lo <- min(d[, j]); hi <- max(d[, j])
  if (lo == hi) return(e)
  sp <- runif(1, ____)                    # a random split between this node's min and max
  keep <- if (x[j] < sp) d[, j] < sp else d[, j] >= sp
  ipath(x, d[keep, , drop = FALSE], e + 1)  # recurse into the side holding x
}
set.seed(7)
cat("cluster unit (row 1), 5 trees:", replicate(5, ipath(X[1, ],  X)), "\n")
cat("Unit 27      (row 27), 5 trees:", replicate(5, ipath(X[27, ], X)), "\n")
```
::check {"regex":"lo\\s*,\\s*hi","gate":true,"difficulty":"intermediate","ok":"That is the heart of it: runif(1, lo, hi) draws a random split between the group's smallest and largest value on the chosen feature. Notice Unit 27 needs 1 to 3 cuts; a normal unit needs 9 to 14.","no":"The split must land between the node's minimum and maximum on the chosen feature. Use runif(1, lo, hi)."}
::solution
```r
ipath <- function(x, d, e = 0) {
  m <- nrow(d)
  if (m <= 1 || e > 60) return(e)
  j  <- sample(ncol(d), 1)
  lo <- min(d[, j]); hi <- max(d[, j])
  if (lo == hi) return(e)
  sp <- runif(1, lo, hi)
  keep <- if (x[j] < sp) d[, j] < sp else d[, j] >= sp
  ipath(x, d[keep, , drop = FALSE], e + 1)
}
set.seed(7)
cat("cluster unit (row 1), 5 trees:", replicate(5, ipath(X[1, ],  X)), "\n")
cat("Unit 27      (row 27), 5 trees:", replicate(5, ipath(X[27, ], X)), "\n")
#> cluster unit (row 1), 5 trees: 9 12 14 9 14
#> Unit 27      (row 27), 5 trees: 1 1 2 3 1
```

=== step === quiz
::eyebrow Check yourself
## Which one is the anomaly?

You send two freezer units through the same isolation trees. Unit A is fenced off on its own after about 2 cuts; Unit B takes about 13. Which is the more likely anomaly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Unit A: a point that isolates in a couple of cuts is sitting out in empty space, exactly what an anomaly looks like ::ok Right. Few cuts to fence a point off means it has almost no near neighbours, so a slice or two already separates it. Short path, high anomaly score.
- Unit B: 13 cuts means the trees worked much harder to isolate it, so it must be the stranger one ::no Effort is backwards here. A point that takes many cuts is buried among neighbours: each random slice still leaves it with company, so it sits deep in the crowd. Many cuts means normal.
- You cannot tell without the raw temperature and power values ::no You do not need them. The path length already summarises how isolated the point is; measuring that isolation is the whole point of the method.

=== step === concept
::eyebrow From one tree to many
## One tree is noisy, so average a forest

Look again at those numbers for the normal unit: 9, 12, 14, 9, 14. One isolation tree is a coin-flip machine, so a single path length wobbles from run to run. Trust any one of them and you are trusting a lucky or unlucky sequence of random cuts.

The fix is the same trick behind any forest: grow **many** trees and average. Send a point down hundreds of independent random trees, take its mean path length, and the wobble smooths away into a stable number.

[KEY INSIGHT]
A single isolation tree is a weak, noisy detector. Averaging the path length over a whole forest of independent trees turns that noise into a reliable score, the same way averaging many noisy measurements sharpens an estimate.

[NOTE]
There is one more twist that makes isolation forests fast and, surprisingly, more accurate: each tree is grown on only a small **random subsample** of the data (a few hundred rows), not the whole set. Fewer points per tree means shallower trees and less work, and it also stops dense clumps of normal points from hiding a nearby anomaly. We will use a subsample of \(\psi = 128\) rows per tree.

=== step === concept
::eyebrow The formalism
## The anomaly score

Averaging gives a mean path length, but a raw cut count is awkward to read: is 6 cuts a lot? It depends on how many points the tree started with. So we normalise it into a clean score between 0 and 1.

Let \(h(x)\) be the **path length** of point \(x\) in one isolation tree: the number of random cuts from the top of the tree down to where \(x\) sits alone. Let \(E[h(x)]\) be its average over all the trees in the forest. To make that comparable, divide by the path length a *typical* point would need. Over a subsample of \(\psi\) points, an average point isolates in about

\( c(\psi) = 2H(\psi - 1) - \dfrac{2(\psi - 1)}{\psi} \)

cuts, where \(H(k) = \ln(k) + \gamma\) approximates the \(k\)-th harmonic number and \(\gamma \approx 0.5772\) is the Euler-Mascheroni constant. (This is the average depth of a point in a random binary tree of \(\psi\) items, a classic result.) The **anomaly score** is then

\( s(x) = 2^{\,-\,\frac{E[h(x)]}{c(\psi)}} \)

Read it off the exponent. If a point isolates almost instantly, \(E[h(x)] \to 0\), the exponent goes to 0, and \(s(x) \to 2^0 = 1\): a clear anomaly. If a point behaves like a typical member of the crowd, \(E[h(x)] \approx c(\psi)\), the exponent is about \(-1\), and \(s(x) \approx 2^{-1} = 0.5\): ordinary. And a point buried deep, needing far more cuts than average, pushes \(s(x)\) down toward 0: very normal.

[KEY INSIGHT]
The score is a relative isolation measure, not a probability. Near 1 = isolates fast = anomaly. Near 0.5 = typical. Below 0.5 = deeper in the crowd than average. You compare units to each other, not to a fixed "50% chance of failure" meaning.

=== step === concept
::eyebrow For real
## Score the whole fleet

Now put the pieces together on all 200 units. `iscore` builds `trees` isolation paths for a point, each on a fresh subsample of `psi` rows, averages the path length, and turns it into the score with the formula above. Then we rank the fleet.

```r
cn <- function(m) 2 * (log(m - 1) + 0.5772157) - 2 * (m - 1) / m    # c(psi): avg path over m points

iscore <- function(x, data, trees = 100, psi = 128) {
  psi <- min(psi, nrow(data))                                       # subsample size per tree
  h <- mean(replicate(trees,                                        # average path length over many trees
    ipath(x, data[sample(nrow(data), psi), , drop = FALSE])))
  2^(-h / cn(psi))                                                  # short average path -> score near 1
}
set.seed(42)
fleet$score <- apply(X, 1, function(x) iscore(x, X, trees = 60, psi = 128))
top <- head(fleet[order(-fleet$score), ], 5)
print(data.frame(unit = top$unit, temp = round(top$temp, 1),
                 power = round(top$power, 2), score = round(top$score, 3)), row.names = FALSE)
#>  unit  temp power score
#>    27  -8.0  5.20 0.824
#>    14 -21.1  2.16 0.742
#>    24 -20.5  2.16 0.696
#>    61 -14.8  3.80 0.644
#>   166 -15.2  3.86 0.636
```

Unit 27 tops the list at 0.824, well clear of the pack. To turn scores into an actual alert, pick a threshold. With no labels, a common choice is a high quantile of the scores: flag the most isolated few percent and have a human check them.

```r
cutoff <- quantile(fleet$score, 0.98)      # flag the top 2% most isolated units
fleet$alert <- fleet$score > cutoff
print(table(alert = fleet$alert))
cat("Unit 27 alert:", fleet$alert[27], "  score:", round(fleet$score[27], 2), "\n")
#> alert
#> FALSE  TRUE
#>   196     4
#> Unit 27 alert: TRUE   score: 0.82
```

Four units are flagged for a look, Unit 27 among them. This is exactly Lesson 1's base-rate lesson in action: the threshold is a dial between catching real faults (recall) and drowning in false alarms (precision), and where you set it is a business decision, not a statistical one.

=== step === quiz
::eyebrow Check yourself
## Reading a score

A freezer unit comes back with an anomaly score of 0.51. What does that tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is about half an anomaly: roughly a 51% chance the unit is faulty ::no The score is not a probability of failure. 0.51 sits right next to 0.5, the value an ordinary, well-surrounded point earns. It reads as normal, not "half faulty".
- It is an ordinary unit: a score near 0.5 is what a normal, well-surrounded point earns, so nothing here stands out ::ok Right. The score is a relative isolation measure. Values near 0.5 are typical of the crowd; only scores climbing toward 1 (very short paths) mark a unit as isolated and worth a look.
- It is a strong anomaly, since any score above 0.5 is a red flag ::no Not any score above 0.5. Normal points hover around 0.5, so a hard 0.5 cutoff would flag half your fleet. You raise the alarm on the ones that climb well above it, toward 1.

=== step === concept
::eyebrow In production
## The same thing, at scale

Our from-scratch forest is for understanding. On real data you would reach for a tuned, compiled implementation. In R that is the `isotree` package, which fits both the standard and the extended forest and scales to millions of rows. It runs locally rather than in the browser, so here it is for reference:

```r-static
# The isotree package: a fast, production isolation forest. Run this locally.
library(isotree)
iso <- isolation.forest(fleet[, c("temp", "power")],
                        ntrees = 100, sample_size = 128, ndim = 1)   # ndim = 1: standard iForest
fleet$score <- predict(iso, fleet[, c("temp", "power")])            # higher = more anomalous

# ndim = 2 (or more) switches on the EXTENDED isolation forest: oblique cuts (next up)
eif <- isolation.forest(fleet[, c("temp", "power")], ntrees = 100, ndim = 2)
```

[NOTE]
The one knob to know is `ndim`. With `ndim = 1` every cut uses a single feature, the standard forest you just built. With `ndim = 2` or more, each cut combines features, giving the extended forest. That one parameter is the whole subject of the rest of this lesson.

=== step === concept
::eyebrow The flaw
## Every cut is axis-aligned

Look closely at the cut lines in the widget again: every single one is either perfectly vertical or perfectly horizontal. That is baked into the algorithm: each cut picks one feature and splits on it, so it can only ever slice straight across temperature or straight across power. Never at an angle.

::widget isolation-forest {}

That restriction quietly bends the scores. Imagine a round, symmetric cloud of normal units. A faulty unit that is off in **both** readings at once sits out in a corner: whether a random cut slices on temperature or on power, it helps fence the unit off, so it isolates fast and scores high. But a unit that is off in a **single** reading (say its power spiked while its temperature stayed normal) lines up with the crowd on the other axis. Half the random cuts, the ones on the normal axis, barely help isolate it, so it takes more cuts and scores lower, even though it is just as far from normal.

[WARNING]
Standard isolation forest scores partly reflect the *direction* of an anomaly, not only its distance from normal. Points strung out along a feature axis get systematically under-scored, and empty "ghost" regions lined up with the axes can look falsely normal. This is the axis-aligned bias, and it is worst exactly when the features are correlated, like our temperature and power.

=== step === concept
::eyebrow The fix
## Extended Isolation Forest: cut at an angle

The Extended Isolation Forest changes one thing, and only one thing: the shape of the cut. Instead of "pick a feature, pick a threshold", it slices along a **random direction**.

A standard cut picks a single feature \(q\) and a threshold \(v\), sending \(x\) to the left when \(x_q < v\). Every such cut is an axis-aligned line. An oblique cut instead picks a random unit direction \(\mathbf{n}\) (draw each component from a standard normal, then divide by its length so \(\lVert \mathbf{n} \rVert = 1\)) and a random point \(\mathbf{p}\) whose each coordinate is uniform within the group's range. It sends \(x\) to the left when

\( (\mathbf{x} - \mathbf{p}) \cdot \mathbf{n} < 0 \)

where \(\cdot\) is the dot product. Geometrically, \((\mathbf{x} - \mathbf{p}) \cdot \mathbf{n} = 0\) is a line (a hyperplane in higher dimensions) through \(\mathbf{p}\) facing direction \(\mathbf{n}\), and it can point any way at all, not just along an axis. The standard forest is just the special case where \(\mathbf{n}\) happens to point exactly along one axis.

[NOTE]
How free the direction is called the **extension level**. In two dimensions, level 0 forces \(\mathbf{n}\) onto an axis (the standard forest) and full extension lets it face anywhere (the widget above hints at what non-axis cuts would look like). With more features you can dial the level between the two. Because the cuts no longer favour the axes, no direction is special, and the scores stop caring which way an anomaly points.

=== step === concept
::eyebrow See it
## See the fix in R

Let us prove it. To isolate the effect cleanly, take a simple case: two standardized readings with no correlation, so the normal units form a round cloud. Now compare two faulty units the same distance from normal, one off in a **single** reading, one off in **both**. A fair detector should score them equally. The oblique path is the same recursion as before, but the cut is a random direction instead of a single feature.

```r
opath <- function(x, d, e = 0) {                    # oblique path: cut along a random direction
  m <- nrow(d)
  if (m <= 1 || e > 60) return(e)
  nv <- rnorm(ncol(d)); nv <- nv / sqrt(sum(nv^2))  # a random unit direction n
  p  <- apply(d, 2, function(col) runif(1, min(col), max(col)))  # a random point to cut through
  proj <- as.numeric(sweep(d, 2, p) %*% nv)         # each row's position along n
  keep <- if (sum((x - p) * nv) < 0) proj < 0 else proj >= 0
  opath(x, d[keep, , drop = FALSE], e + 1)
}
escore <- function(x, data, trees = 200, psi = 128) {
  psi <- min(psi, nrow(data))
  2^(-mean(replicate(trees, opath(x, data[sample(nrow(data), psi), , drop = FALSE]))) / cn(psi))
}
set.seed(3)
blob   <- matrix(rnorm(400 * 2), 400, 2)            # a round, symmetric cloud of normal units
d      <- 4
single <- c(d, 0)                                   # a fault in ONE reading only
both   <- c(d / sqrt(2), d / sqrt(2))               # a fault in BOTH, the same distance out
cat("both probes sit", round(sqrt(sum(single^2)), 1), "units from normal\n")
set.seed(11); s_single <- iscore(single, blob, 200, 128); set.seed(12); s_both <- iscore(both, blob, 200, 128)
set.seed(11); e_single <- escore(single, blob, 200, 128); set.seed(12); e_both <- escore(both, blob, 200, 128)
cat("standard iForest  single-reading:", round(s_single, 2), " both-reading:", round(s_both, 2), "\n")
cat("extended iForest  single-reading:", round(e_single, 2), " both-reading:", round(e_both, 2), "\n")
#> both probes sit 4 units from normal
#> standard iForest  single-reading: 0.64  both-reading: 0.72
#> extended iForest  single-reading: 0.68  both-reading: 0.68
```

There it is. The standard forest calls the both-reading fault (0.72) clearly more anomalous than the single-reading fault (0.64), even though both are the same distance from normal: the axis bias, exactly as predicted. The extended forest scores them both about 0.68. It raised the under-scored single-reading fault and tempered the over-scored both-reading one, until the score depends on distance alone.

=== step === quiz
::eyebrow Check yourself
## What did oblique cuts fix?

On the round cloud above, two faults sat the same distance from normal: one off in a single reading, one off in both. Standard isolation forest scored them 0.64 and 0.72; the extended forest scored both about 0.68. What did switching to oblique cuts actually fix?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The score now depends on how far a unit is from normal, not on whether its fault happens to line up with a feature axis ::ok Exactly. Axis-aligned cuts isolate a both-reading fault faster than an equally-distant single-reading fault, inflating one score and deflating the other. Oblique cuts slice in every direction, so two equally-distant faults score the same.
- The extended forest simply grows more and deeper trees, so its scores are just more accurate ::no Nothing about the number or depth of the trees changed. The only change is the cut geometry, from axis-aligned to oblique. Same trees, same path-length score, fairer cuts.
- Oblique cuts always push every anomaly score higher, so more faults get caught ::no They do not uniformly raise scores. Here the single-reading fault rose (0.64 to 0.68) while the both-reading fault fell (0.72 to 0.68). The fix is consistency, not a blanket increase.

=== step === concept
::eyebrow Know your tool
## When to reach for it, and the limits

Isolation forests are one of the great default anomaly detectors, and knowing their edges is what separates a practitioner from a button-pusher.

**Strengths**

- **Fast and scalable.** Cost grows about linearly with the number of rows, and each tree sees only a small subsample, so it handles large, high-dimensional data comfortably.
- **No distance or density to estimate.** It never computes pairwise distances, so it sidesteps the curse of dimensionality that hobbles distance-based detectors.
- **Almost no tuning and no labels.** A few hundred trees and a subsample size, and you are running.

**Limits**

- **Scores are relative, not calibrated.** A 0.7 means "more isolated than most here", not a probability. Compare within a dataset; do not read it as a chance of failure.
- **It sees global anomalies, not local ones.** A point that is normal overall but sparse relative to its own tight neighbourhood can slip through. That local case is exactly what the Local Outlier Factor, next lesson, is built for.
- **The standard version has the axis bias** you just fixed with the extended forest; prefer the extended variant when features are correlated.
- **Subsample size and threshold matter.** Too small a subsample misses structure; the alert threshold is a precision-recall dial you must set for your cost of a miss versus a false alarm.

[WARNING]
An isolation forest gives you a ranking, not a verdict. It says "these units are the most isolated"; whether that means "faulty" still needs a threshold you own and, ideally, a human check on the flagged few. Lesson 1's base-rate warning never goes away.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Liu, Ting and Zhou (2008), Isolation Forest, IEEE ICDM](https://doi.org/10.1109/ICDM.2008.17) - the original paper that introduced isolation as an anomaly signal.
- [Liu, Ting and Zhou (2012), Isolation-Based Anomaly Detection, ACM TKDD 6(1)](https://doi.org/10.1145/2133360.2133363) - the fuller journal version with subsampling, the \(c(\psi)\) normaliser, and the score you used.
- [Hariri, Carrasco Kind and Brunner (2021), Extended Isolation Forest, IEEE TKDE 33(4)](https://doi.org/10.1109/TKDE.2019.2947676) - the oblique-split variant that removes the axis bias.
- [isotree (CRAN)](https://cran.r-project.org/package=isotree) - the production R package that fits both the standard and extended forests.
- [Aggarwal (2017), Outlier Analysis, 2nd ed., Springer](https://doi.org/10.1007/978-3-319-47578-3) - a book-length map of where isolation sits among all the detectors.

=== step === complete
## Lesson 2 complete

You built an anomaly detector from an idea a child could grasp: the odd point is the one that is easiest to fence off. You saw a normal freezer take 9 to 14 random cuts to isolate while Unit 27 fell in 1 to 3, turned the average path length into a clean score \(s(x) = 2^{-E[h(x)]/c(\psi)}\), scored the whole fleet, and set a threshold that flagged Unit 27. Then you met the standard forest's one blind spot, its axis-aligned cuts, and watched the Extended Isolation Forest's oblique cuts restore distance-fair scores.

One honest limit points straight to the next lesson. An isolation forest is a **global** detector: it finds points far from everything. But a point can be perfectly ordinary against the whole fleet and still be an anomaly relative to its own tight little cluster, a fault a global view cannot see. Next, Lesson 3: **Local Outlier Factor and One-Class SVM**, where we detect anomalies by local density and learn a boundary around the normal region.
