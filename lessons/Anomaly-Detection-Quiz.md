---
title: "Anomaly Detection: Quiz"
description: "A graded check on the anomaly and outlier detection section: the base-rate trap, isolation forests, local outlier factor and one-class SVM, autoencoders, time-series anomalies, kernel/sparse PCA and NMF, and contrastive representations."
keywords: "R quiz, anomaly detection, outlier detection, isolation forest, local outlier factor, one-class SVM, autoencoder, reconstruction error, STL, kernel PCA, NMF, contrastive learning, ds-anomaly"
post_type: "LESSON"
curriculum_id: "6.200.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "8"
course_total: "8"
course_landing: "R-Anomaly-Detection-Course.html"
lesson_kind: "quiz"
course_prev: "Self-Supervised-and-Contrastive-Learning.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have built seven detectors, each seeing a different shape of "does not belong": isolation forests that fence off outliers in a few cuts, the local outlier factor and one-class SVM for density and boundaries, autoencoders that score by how badly a point rebuilds, the decomposition that exposes a time-series anomaly, the factorizations beyond plain PCA, and a contrastive representation learned with no labels. Running through all of them is one honest rule: anomalies are rare, so judge a detector by precision and recall, never accuracy. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## The 99%-accurate detector
A fraud detector is 99% accurate on transactions where 0.5% are truly fraud. Why can that number be almost meaningless?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 99% accuracy is strong on any problem, so the detector is good. ::no When one class is rare, accuracy is dominated by the majority: predicting "never fraud" already scores 99.5% here. High accuracy on imbalanced data is the trap.
- At a 0.5% base rate, a detector can hit 99% accuracy while almost every alert it raises is a false alarm, so its precision can be tiny. ::ok Exactly. Accuracy is swamped by the huge normal class. You must see precision (are the alerts real?) and recall (is fraud caught?) before trusting a rare-event detector.
- The detector must be broken, since a real one would score 100%. ::no No detector scores 100% on overlapping data. The issue is that accuracy is the wrong yardstick when the positive class is rare, not a bug.
- Accuracy is fine; precision and recall measure the same thing. ::no They measure different things: precision is the share of alerts that are real, recall the share of true anomalies caught. Neither is captured by accuracy on imbalanced data.

=== step === quiz
::eyebrow Question 2 of 10
## Global versus local
A charge is not far from the center of a customer's spending, yet it is flagged as anomalous. How can a point that is not extreme still be an outlier?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- It is a local outlier: it sits in a sparse pocket relative to its immediate neighbours, even though other points are farther from the center. ::ok Right. Local outliers are defined by comparing a point's density to its neighbours' density, so a point can be anomalous without being an extreme global value. That is the gap density methods (LOF) fill.
- It cannot be an outlier; distance from the center is the only valid measure. ::no Distance from the center catches global outliers only. A point wedged against a dense cluster but sparse relative to it is a genuine local anomaly a global cutoff misses.
- It must be a measurement error. ::no Local outliers are real structure, not errors. The point breaks the local density pattern, which is exactly what a density-based detector is built to see.
- It belongs to the smallest cluster, which is always anomalous. ::no Cluster size is not the test. A small dense cluster of normal points is not anomalous, and a local outlier can sit at the edge of a large one.

=== step === quiz
::eyebrow Question 3 of 10
## Isolation forests
An isolation forest isolates point A in an average of 3 random cuts and point B in 14 cuts, on the same data. Which is more anomalous, and what does the Extended Isolation Forest change?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- B, because more cuts means the forest worked harder to separate it. ::no The reverse: many cuts means the point was buried among neighbours and hard to peel away, the signature of a normal point. A short path is the anomaly.
- A, and the Extended version grows more trees on larger subsamples for a steadier score. ::no A is right (a short path scores near 1), but "extended" is not about the ensemble size; the number of trees and the score formula are unchanged.
- A, because a short path means the random cuts fenced it off fast; the Extended Isolation Forest replaces axis-aligned cuts with random-slope (oblique) ones, removing the axis-aligned bias. ::ok Exactly. Few cuts to isolate means the point sat apart, so its score is near 1. The extended variant changes only the split geometry (a random direction instead of a single feature), which erases the ghost regions stretched along the axes.
- B, and the Extended version lowers the anomaly threshold. ::no B is the normal point, and "extended" changes the split geometry, not any threshold.

=== step === quiz
::eyebrow Question 4 of 10
## Local Outlier Factor
LOF scores each point with a ratio. A point scores LOF near 1, another scores LOF around 9. What does the ratio compare, and what do those two values mean?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- It compares a point's own local density to the average local density of its neighbours: near 1 means "as dense as my neighbours" (normal), well above 1 means "in a far sparser pocket than them" (an outlier). ::ok Right. LOF is a relative density ratio, so a point wedged against a dense cluster but much sparser than it scores high, while a point in a genuinely sparse-but-uniform cluster scores near 1.
- It compares the point's distance from the global mean to the average distance; 9 means nine standard deviations out. ::no LOF never uses the global mean. It is a ratio of local densities, not a distance-from-center or a z-score.
- It compares the point to the single nearest neighbour only. ::no LOF uses the k nearest neighbours (a whole local neighbourhood), not just one, to estimate and compare densities.
- A LOF of 9 means the point belongs to cluster 9. ::no LOF is not a cluster label. It is a density-contrast score; higher means more locally anomalous.

=== step === quiz
::eyebrow Question 5 of 10
## One-class SVM
You must score each incoming transaction in real time against a fixed set of known-good historical data, without recomputing over the whole set each time. Which detector fits best?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- LOF, because it gives the most accurate local score. ::no LOF must place the new point among all the others and recompute neighbourhood densities every time; there is no reusable model to score a lone incoming point cheaply.
- A standard isolation forest, because it is fastest. ::no Fast for a batch sweep, but it is built from the data you score, not framed as "learn normal once, then judge new points." That novelty framing belongs to the one-class SVM.
- The one-class SVM, because it learns a boundary around the known-good data once, then judges any new point on its own as inside or outside. ::ok Exactly. That is novelty detection: fit once on trusted-normal data, then score each incoming point against the saved boundary in constant time. LOF and the isolation forest are computed relative to the dataset.
- None; only a supervised classifier can score new points. ::no All three are unsupervised. The one-class SVM in particular is designed for "train on normal, judge new points," which is what streaming against a fixed reference needs.

=== step === quiz
::eyebrow Question 6 of 10
## Autoencoders and reconstruction error
An autoencoder flags a charge that is ordinary on every single feature (each z-score near 0), yet its reconstruction error is more than ten times any normal charge. Why, and what makes the method work?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because the charge has the largest values, so it is farthest from everything. ::no It is not extreme on any feature; a per-feature or global-distance rule ranks it as ordinary. Reconstruction error is not measuring distance-from-everything.
- Because the charge breaks the relationship between features, so it sits off the low-dimensional manifold the bottleneck learned and cannot be rebuilt from the squeezed code; the narrow bottleneck is what creates the signal. ::ok Exactly. The bottleneck carries only the shared pattern, so an off-pattern point is rebuilt as an on-pattern one and the leftover gap is the large error. Keep every dimension (no squeeze) and every point rebuilds perfectly, so nothing can be flagged.
- Because a linear autoencoder uses a neural network that memorizes fraud. ::no A linear autoencoder is exactly PCA, no neural network involved, and it does not memorize anything; it projects onto the principal subspace of the normal data.
- Because reconstruction error ignores feature scaling. ::no The opposite: you must scale features first, or the squared error is dominated by the feature with the larger range. Scaling is one of the method's assumptions.

=== step === quiz
::eyebrow Question 7 of 10
## Time-series anomalies
A coffee cart sells 60 cups on a Thursday. Across the whole series 60 is common (most weekends sit there), but a Thursday is normally a 160-cup day. A global 3-sigma fence called it ordinary; after STL decomposition its remainder scored a robust z of 17. What changed?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- STL's seasonal component encodes the expected weekday level, so a busy-weekday slot filled with a weekend-sized number leaves a huge remainder. ::ok Exactly. STL subtracts the roughly +30 cups a Thursday should carry: expected near 160, actual 60, so the remainder is enormous next to the tiny remainders of normal days. Context invisible to a global fence is now measured explicitly.
- STL uses a lower threshold, so it flags more days. ::no The threshold is the same 3 in both. What changed is the quantity being thresholded: a remainder with trend and season removed, instead of the raw value.
- STL is robust and the global fence was not, and robustness alone catches contextual anomalies. ::no Robustness helps with the point spike, but a robust global fence would still heap weekdays and weekends together and miss the Thursday. Removing the seasonal expectation is what exposes it.
- The Thursday is a collective anomaly that STL groups correctly. ::no It is a single contextual anomaly, one day wrong for its slot, not a run of days wrong as a group.

=== step === quiz
::eyebrow Question 8 of 10
## The hard case
A five-day road-closure slump drops the same cart to a lower level for a week. On the STL remainder, only one of the five days clears the fence. Why are collective anomalies the hard case for residual detection?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Because five days is too few to matter statistically. ::no It is not a sample-size issue. The problem is structural: the decomposition itself reshapes to absorb a sustained shift.
- A sustained shift is partly absorbed by the decomposition: the trend bends down to follow the slump, so most of the drop is explained away as a temporary trend change rather than left in the remainder. ::ok Exactly. Residual fences are built for points that stick out against a stable background; a level shift gets folded into the trend, so a change-point method that tests whether the whole level moved is the right tool, not a per-point residual fence.
- The MAD is not robust enough for a run of anomalies. ::no Robustness is not the issue here; even a perfectly robust fence on the remainder misses the slump, because the slump has largely left the remainder.
- Collective anomalies do not exist in real data. ::no They are common and important (an outage, a closure, a policy change). They are simply a different shape than a single spike and need a different detector.

=== step === quiz
::eyebrow Question 9 of 10
## Beyond plain PCA
You have a customer-by-product matrix of monthly purchase counts and want to describe each customer as a blend of a few interpretable baskets, with weights the marketing team can read. Which method fits best, and why?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Kernel PCA, because purchase data has non-linear structure only a kernel can capture. ::no Kernel PCA unfolds curved structure but hands back abstract, signed coordinates with no easy map to the products. It answers "off the manifold?", not "which baskets is this customer made of?"
- Sparse PCA, because it zeroes small loadings. ::no Sparse PCA makes components nameable, but its loadings can still be negative, so a "basket" could contain negative espresso. Counts call for a non-negative decomposition.
- NMF, because non-negativity makes the parts add rather than cancel, giving additive, readable baskets and customers who are simple non-negative blends of them. ::ok Exactly. Counts are non-negative, so a non-negative factorization yields parts that are themselves baskets (all weights >= 0), precisely the interpretable, additive story asked for.
- Plain PCA, because its components are orthogonal and explain the most variance. ::no PCA's components are dense and signed. Maximum variance and orthogonality are not what make a decomposition into readable, additive baskets.

=== step === quiz
::eyebrow Question 10 of 10
## Contrastive collapse
A contrastive encoder that maps every item to the same point makes each positive pair perfectly similar (cosine 1), yet it scores the WORST possible InfoNCE loss, log N. Why is collapse the worst case, not the best?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Because InfoNCE compares the positive against all the negatives; if everything is equally similar, the true partner cannot win, so its softmax probability is only 1/N and the loss bottoms out at log N. ::ok Right. InfoNCE rewards the positive being MORE similar than the negatives, not just similar. Collapse makes positives and negatives equally similar, so the true partner can never be singled out. The negatives exist precisely to push the representation to stay spread.
- Because cosine similarity is undefined when all vectors are identical. ::no Cosine is well defined (it equals 1 for identical directions). The problem is that no item is distinguishable from any other, not a broken similarity.
- Because the temperature is too small when everything collapses. ::no The collapsed loss is log N at any temperature; the failure is structural, not a tuning issue.
- Because collapse overfits the training views. ::no Collapse is the opposite of overfitting: the encoder learns nothing item-specific at all, mapping everything to one point.

=== step === concept
::eyebrow Run it: isolation forest
## Anomalies isolate in fewer cuts
An isolation forest never models "normal." It cuts the space at random and counts how many cuts fence a point off alone: an outlier in empty space needs only a few, a crowded point needs many. The average path length, normalized and flipped, becomes an anomaly score near 1 for outliers and near 0.5 for ordinary points.

```r
set.seed(1)
X <- rbind(matrix(rnorm(200), 100, 2), c(4, 4))   # 100 normal points + 1 outlier (row 101)
cn <- function(m) if (m > 2) 2*(log(m-1)+0.5772157) - 2*(m-1)/m else if (m == 2) 1 else 0
ipath <- function(x, d, e = 0) {                   # random-split depth to isolate x within d
  m <- nrow(d); if (m <= 1 || e > 25) return(e + cn(m))
  j <- sample(ncol(d), 1); lo <- min(d[,j]); hi <- max(d[,j]); if (lo == hi) return(e + cn(m))
  s <- runif(1, lo, hi); side <- if (x[j] < s) d[,j] < s else d[,j] >= s
  ipath(x, d[side, , drop = FALSE], e + 1)
}
score <- function(i) 2^(-mean(replicate(100, ipath(X[i, ], X))) / cn(nrow(X)))
round(c(normal = score(1), outlier = score(101)), 3)
#>  normal outlier
#>   0.395   0.815
```

The ordinary point scores **0.395** (well below 0.5); the outlier isolates fast and scores **0.815**, pushed toward 1. No labels, no model of normal, just how easily each point is fenced off.

=== step === concept
::eyebrow Run it: reconstruction error
## Off-manifold points rebuild badly
An autoencoder scores a point by how badly a model that only knows normal rebuilds it. The linear case is PCA: compress each point onto the principal subspace normal data lives on, decode, and measure the leftover. A point off that subspace (here, off the line the data hugs) reconstructs poorly, so its error spikes.

```r
set.seed(1)
n <- 150; a <- rnorm(n)
V <- cbind(a, 0.9 * a + rnorm(n, 0, 0.12))   # 2D data hugging a line (the learned manifold)
V <- rbind(V, c(2, -2))                       # an anomaly off the line (row 151)
p     <- prcomp(V, rank. = 1)                 # 1-component bottleneck: keep 1 of 2 directions
recon <- sweep(p$x %*% t(p$rotation), 2, p$center, "+")   # decode from the code
err   <- rowSums((V - recon)^2)               # reconstruction error per point
round(c(typical = median(err[1:150]), anomaly = err[151]), 3)
#> typical anomaly
#>   0.004   7.896
```

A typical point reconstructs with error **0.004**; the off-manifold anomaly rebuilds at **7.896**, nearly two thousand times worse. Distance to the learned subspace is the anomaly score.

=== step === complete
## Section complete
Strong work. You can now reach for the right detector by the shape of the anomaly: an isolation forest for a fast, global, unsupervised score; the local outlier factor for a point sparse only relative to its neighbours; a one-class SVM to learn the normal region once and judge new points; an autoencoder (linear = PCA) to flag points that break the feature relationships; STL plus a robust residual fence for contextual anomalies in a series (and a change-point method for collective ones); kernel PCA, sparse PCA and NMF to rebuild from a curved, nameable, or additive subspace; and a self-supervised, contrastive representation when you have no labels at all. Through every one runs the same discipline: anomalies are rare, so a score is only as good as the precision and recall it buys.
