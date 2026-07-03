---
title: "Anomaly Detection Lesson 7: Self-Supervised and Contrastive Learning"
catalog_blurb: "How to learn a useful representation of your data without any labels."
description: "Self-supervised and contrastive learning in R from scratch: pretext tasks, the InfoNCE loss, representation collapse, and why a spread, decorrelated map surfaces anomalies."
keywords: "self-supervised learning, contrastive learning, InfoNCE, representation learning, pretext task, representation collapse, decorrelation, anomaly detection, R"
post_type: "LESSON"
curriculum_id: "6.200.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "7"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: ""
course_prev: "Kernel-PCA-Sparse-PCA-and-NMF.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## Self-Supervised and Contrastive Learning

Nadia looks after a herbarium: 150 pressed iris flowers in a wooden drawer, each with four pencil measurements on its card, the length and width of a sepal and a petal. Decades ago the species tags fell off. She has no labels, yet she still wants two things. First, a tidy MAP of the drawer where similar flowers sit near each other. Second, an automatic flag for the odd specimen that does not belong with the rest.

Both wishes are really one wish: a good REPRESENTATION of each flower, learned from the flowers alone. Building that representation with no labels is what self-supervised and contrastive learning are for, and it is the last tool this course adds to your anomaly-detection kit.

The map below is exactly what she is after. We fed a computer only the four raw numbers, never the species, and asked for the two directions along which the flowers vary most. Three natural clumps fell out on their own. The colours were painted on afterwards, to check the structure it found, not to build it.

By the end of this lesson you will be able to:

- Describe a self-supervised pretext task and say where its "label" secretly comes from
- Read the contrastive objective: pull two views of the same item together, push different items apart
- Explain representation collapse, and why a spread, decorrelated map is the thing that makes anomalies visible
- Score an anomaly by its distance in a learned representation, and see why a collapsed one is useless for it

**Prerequisites:** you can run R and read base R (matrices, `scale`, `lm`, indexing), and you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (distance and density scores, the base-rate trap) and [Lesson 6: Kernel PCA, Sparse PCA and NMF](Kernel-PCA-Sparse-PCA-and-NMF.html) (a representation is a new set of coordinates for each item). No deep-learning background is needed; contrastive learning is built from scratch here.

::widget pca-projection {}

=== step === concept
::eyebrow The goal
## A representation is a better set of coordinates

A representation is just a new set of numbers for each flower, chosen so that DISTANCE means something: two flowers close together should be alike, two far apart should be different. Once distance is trustworthy, every tool from this course, a density score, a nearest-neighbour count, a boundary, works on top of it.

The four raw measurements are already coordinates, so why not use them? Because they are redundant. Let us build Nadia's table and look at how the four numbers relate. Each lesson runs in a fresh R session, so we build the data first; press Run.

```r
X <- scale(as.matrix(iris[, 1:4]))            # standardize: each measurement to mean 0, sd 1
colnames(X) <- c("sep_len", "sep_wid", "pet_len", "pet_wid")
round(cor(X), 2)                              # how much do the four measurements overlap?
#>         sep_len sep_wid pet_len pet_wid
#> sep_len    1.00   -0.12    0.87    0.82
#> sep_wid   -0.12    1.00   -0.43   -0.37
#> pet_len    0.87   -0.43    1.00    0.96
#> pet_wid    0.82   -0.37    0.96    1.00
```

Petal length and petal width move almost in lockstep (correlation 0.96), and both track sepal length too. Three of the four axes are largely saying the same thing. A representation like that wastes its dimensions: it spends three coordinates describing one underlying "how big is this flower" direction, and distances along it double-count. The heatmap makes the redundancy plain.

::widget correlation-heatmap {"vars":["sep_len","sep_wid","pet_len","pet_wid"],"matrix":[[1,-0.12,0.87,0.82],[-0.12,1,-0.43,-0.37],[0.87,-0.43,1,0.96],[0.82,-0.37,0.96,1]]}

[NOTE]
Redundant, correlated features are not wrong, just inefficient: they crowd the flowers along one direction and leave other directions empty. The goal for the rest of the lesson is a representation that SPREADS the flowers out and lets each axis carry its own information. We will reach it without ever touching a label.

=== step === concept
::eyebrow Learning without labels
## Invent a label out of the data itself

Here is the trick that makes label-free learning possible. If you have no labels, MANUFACTURE a prediction task out of the data you already have, then solve it. Hide part of each example and train a model to fill the blank back in. The answer key is the piece you hid, so the "labels" are free. A made-up task like this is called a PRETEXT task, and learning from it is SELF-SUPERVISED learning.

Concretely: hide one measurement of a flower, say its petal length, and predict it from the other three. Formally we minimise the squared error of the reconstruction,

\( \min_{f}\; \sum_{i=1}^{N} \big(x_{ij} - f(x_{i,-j})\big)^2 \)

where \(x_{ij}\) is the hidden measurement \(j\) of flower \(i\), \(x_{i,-j}\) is that flower's other three measurements, and \(f\) is the model we fit. Nothing here needs a species label; the target \(x_{ij}\) is part of the flower's own record. A plain linear model is enough to show it works.

```r
dat     <- as.data.frame(X)
pretext <- lm(pet_len ~ sep_len + sep_wid + pet_wid, data = dat)   # predict the hidden measurement
round(summary(pretext)$r.squared, 3)          # how much of it can the other three explain?
#> [1] 0.968
```

The other three measurements explain 96.8% of petal length. To solve its made-up fill-in-the-blank task, the model had to learn the real relationships between a flower's parts, genuine structure, extracted with zero labels. That learned structure is the seed of a representation. Real self-supervised systems use the same move on far richer data: hide a patch of an image, a word in a sentence, the next second of audio, and predict it back.

[KEY INSIGHT]
Self-supervision turns "I have no labels" into "I have unlimited labels." Every example secretly contains its own target, because you get to choose which part to hide.

=== step === quiz
::eyebrow Check yourself
## Where did the label come from?

In the pretext task above, a model predicted each flower's petal length from its other three measurements and scored 0.968. It used no species tags at all. What played the role of the "label" the model trained against?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The species (setosa, versicolor, virginica), read in quietly behind the scenes ::no No species information touched this model. The formula predicts pet_len from the other three measurements only; the tags never entered the fit. That is the whole point of self-supervision.
- The petal-length column itself, which we hid and then asked the model to reconstruct ::ok Exactly. The target was a piece of the data we chose to hide. The answer key is free because it is part of every flower's own record, which is what makes the task self-supervised.
- Nothing; with no labels there is no target, so the model must have clustered instead ::no There is very much a target: petal length. A regression must have something to predict. The move is to carve that target out of the data itself rather than take it from an external label.

=== step === widget
::eyebrow The contrastive idea
## Pull the same item together, push others apart

Predicting a hidden column is one way to learn without labels. Contrastive learning is another, and it is the one behind most modern self-supervised systems. The idea is simple and comes in four moves.

Take one flower. Make two slightly different VIEWS of it, for example by re-measuring with a shaky ruler so each number wobbles by a hair. Both views are still the same flower, so a good representation should place them close together. That pair is called a POSITIVE pair. Every other flower in the drawer is a NEGATIVE: its views should land somewhere else. Learning means adjusting the representation until positives are close and negatives are far.

::widget process-flow {"steps":[{"title":"Augment","sub":"make two views of each item that keep its identity (jitter, crop, mask)"},{"title":"Embed","sub":"map every view into the representation with the same encoder"},{"title":"Pull together","sub":"the two views of one item form a positive pair, drawn close"},{"title":"Push apart","sub":"views of different items are negatives, driven apart"}]}

To turn "close" and "far" into a number we can optimise, we need a similarity. The cosine similarity of two embedding vectors \(a\) and \(b\) is

\( \text{sim}(a,b) = \dfrac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert} \)

which is \(+1\) when they point the same way and \(0\) when they are unrelated. The contrastive loss, called InfoNCE, then says: for each anchor view \(z_i\), its matching view \(z_i^{+}\) should be more similar than every other flower \(z_j\).

\( \mathcal{L} = -\dfrac{1}{N}\sum_{i=1}^{N} \log \dfrac{\exp\!\big(\text{sim}(z_i, z_i^{+})/\tau\big)}{\sum_{j=1}^{N}\exp\!\big(\text{sim}(z_i, z_j)/\tau\big)} \)

Read it as a softmax: the fraction is the probability the model assigns to picking the true partner \(z_i^{+}\) out of the whole drawer. Here \(N\) is the number of flowers and \(\tau\) (the temperature) is a small positive number that sharpens the contrast. Minimising \(\mathcal{L}\) drives that probability toward 1, which is exactly "positives close, negatives far." Next we compute it for real.

=== step === concept
::eyebrow The trap
## The lazy shortcut: collapse

There is a cheap way to make every positive pair perfectly similar: map EVERY flower to the same point. Then any two views, positives and negatives alike, sit on top of each other, and the encoder has done no real work. This failure has a name, representation COLLAPSE, and it is the central danger of contrastive learning.

Let us measure it. We build two views of every flower with a shaky ruler, then compute the InfoNCE loss for two encoders: one that keeps the flowers spread across all four axes, and one that collapses them onto a single point.

```r
set.seed(1)
augment <- function(M) M + matrix(rnorm(length(M), 0, 0.35), nrow(M))  # a shaky re-measure
V1 <- augment(X)                              # view 1 of every flower
V2 <- augment(X)                              # view 2 of every flower

cosim <- function(A, B) {                     # cosine similarity, every row of A vs every row of B
  A <- A / sqrt(rowSums(A^2)); B <- B / sqrt(rowSums(B^2))
  A %*% t(B)
}
infonce <- function(emb) {                    # the InfoNCE loss for an encoder `emb`
  z1 <- emb(V1); z2 <- emb(V2)
  S  <- cosim(z1, z2) / 0.2                    # 0.2 is the temperature
  -mean(diag(S) - log(rowSums(exp(S))))        # matching pair up top, everyone else in the sum
}
spread   <- function(v) v                      # keep the flowers spread out
collapse <- function(v) v * 0 + 1              # crush every flower to the same point
round(c(spread = infonce(spread), collapse = infonce(collapse)), 2)
#>   spread collapse
#>     3.82     5.01
```

The spread encoder scores 3.82; the collapsed one scores 5.01, and that number is no coincidence. When every embedding is identical, the softmax cannot tell the true partner from any of the \(N\) flowers, so it gives each a probability of \(1/N\) and the loss is exactly \(\log N = \log 150 = 5.01\), the worst value possible. Collapse is not a good solution that happens to fail; it is the single highest-loss point, and the whole job of the negatives in the denominator is to steer the encoder away from it.

[WARNING]
Collapse is why you cannot learn a contrastive representation from positives alone. Pulling matching views together, with nothing pushing different items apart, has a trivial winner: send everything to one dot. The negatives are what keep the representation SPREAD.

=== step === quiz
::eyebrow Check yourself
## Why is collapse the worst case, not the best?

Collapsing every flower to one point makes each positive pair perfectly similar, cosine 1. A learner might think that is ideal for a loss that wants positives close. Yet the collapsed encoder scored the WORST possible InfoNCE loss, log 150. Why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Because the loss compares the positive against all the negatives; if everything is equally similar, the true partner cannot win, so its softmax probability is only 1/N ::ok Right. InfoNCE rewards the positive being MORE similar than the negatives, not just similar. Collapse makes positives and negatives equally similar, so the model can never single out the true partner, and the loss bottoms out at log N.
- Because cosine similarity is undefined when all the vectors are identical ::no Cosine is perfectly well defined here (it equals 1 for identical directions), and the code computes it without trouble. The problem is not a broken similarity, it is that no flower is distinguishable from any other.
- Because a temperature of 0.2 is too small and destabilises the loss ::no The temperature only scales the sharpness; the collapsed loss is log N at any temperature. The failure is structural: identical embeddings carry no information to separate positives from negatives.

=== step === concept
::eyebrow The property that matters
## A spread, decorrelated map

So a useful representation must do two things at once: keep the two views of one flower CLOSE (invariance), and keep different flowers SPREAD APART (no collapse). When a representation is well spread, something nice happens to its axes: they DECORRELATE. Each dimension ends up carrying its own slice of information instead of echoing the others, so the map uses its full space.

We do not need a neural network to see this. The principal components of the flowers, the directions of most spread from Lesson 6, give a quick label-free representation with exactly that property. Watch what happens to the correlations.

```r
Z <- prcomp(X)$x                              # a spread representation: the flowers on their principal axes
round(cor(Z), 2)                              # are the new axes redundant like the raw ones were?
#>     PC1 PC2 PC3 PC4
#> PC1   1   0   0   0
#> PC2   0   1   0   0
#> PC3   0   0   1   0
#> PC4   0   0   0   1
round(apply(Z, 2, var), 2)                    # and how much spread does each axis carry?
#> PC1  PC2  PC3  PC4
#> 2.92 0.91 0.15 0.02
```

Every off-diagonal correlation is 0: the axes are perfectly decorrelated, the exact opposite of the raw measurements where petal length and width sat at 0.96. Compare the heatmap below with the one from earlier, all the colour has drained out of the off-diagonal cells. And the variances line up in order, most spread on PC1, less on each next axis, so distance in this map is honest and efficient.

::widget correlation-heatmap {"vars":["PC1","PC2","PC3","PC4"],"matrix":[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}

[KEY INSIGHT]
Contrastive learning chases this same target on data far too complex for principal components: a representation that is spread and decorrelated, so that "far apart in the map" reliably means "genuinely different." PCA lets us SEE the property cheaply; contrastive learning LEARNS it when the structure is non-linear.

=== step === tryit
::eyebrow Your turn
## Flag the odd flower

Now the payoff, and the reason this lesson closes the course. In a spread, decorrelated representation, an anomaly is simply a flower that lands far from the crowd. Nadia suspects one pressed specimen has impossible proportions: long, narrow sepals with short but unusually broad petals, a shape no real iris in her drawer shows. We add it as row 151 and score every flower by its distance from the centre of the map. Euclidean distance squares each coordinate, sums, and takes the square root, so fill in the exponent.

```r
odd  <- c(sep_len = 3.0, sep_wid = -3.4, pet_len = -1.6, pet_wid = 3.1)  # the suspicious specimen
Zall <- predict(prcomp(X), rbind(X, odd))     # project all 150 flowers plus the odd one onto the spread axes
dist <- sqrt(rowSums(Zall^____))              # each flower's Euclidean distance from the centre
which.max(dist)                               # which row is the most anomalous?
```
::check {"regex":"\\^\\s*2","gate":true,"difficulty":"intermediate","ok":"That is Euclidean distance, and row 151, the odd flower, tops the ranking. In a spread map, does not fit becomes simply far away.","no":"Euclidean distance squares each coordinate before summing: raise Zall to the power 2."}
::solution
```r
odd  <- c(sep_len = 3.0, sep_wid = -3.4, pet_len = -1.6, pet_wid = 3.1)
Zall <- predict(prcomp(X), rbind(X, odd))
dist <- sqrt(rowSums(Zall^2))
which.max(dist)                               # row 151 = the odd flower
#> odd
#> 151
round(c(odd = unname(dist[151]), worst_real = max(dist[1:150])), 2)
#>        odd worst_real
#>       9.56       7.24
```

The odd flower sits 9.56 from the centre, clear of the most extreme real flower at 7.24, so it ranks first. Here is the whole course in one line: a good representation turned an unlabelled "this looks wrong" hunch into a number you can threshold. And notice what a COLLAPSED representation would have done. It maps every flower to the same point, so every distance from the centre is 0, and the odd specimen hides in the crowd with all the rest. The spread we fought for in the last three steps is precisely what makes the anomaly visible.

=== step === concept
::eyebrow When it breaks
## The honest edges

Self-supervised representations are powerful, but not magic, and three limits matter especially for anomaly work.

**The augmentation has to preserve identity.** Contrastive learning only works if your two views are genuinely the same item seen differently. A shaky ruler is safe. But an augmentation that changes what the flower IS, say scrambling its measurements, teaches the encoder to treat different things as the same, and the representation stops meaning anything. Choosing augmentations is the real craft, and it is domain-specific: a harmless view of a photo is nothing like a harmless view of a fraud record.

**Collapse can return by the back door.** We prevented it with negatives, but real systems fight it in other ways too. Some methods (such as BYOL) drop negatives entirely and lean on architectural tricks to stay spread; they can still collapse if those tricks are misconfigured. Always check that your learned representation is actually spread, not quietly piling up.

**A representation is not a detector.** As in Lesson 1, a distance score still needs a threshold, and at a low anomaly rate a loose threshold is mostly false alarms. Judge the flags by precision and recall on whatever labelled examples you can find, not by the score alone.

Our whole demo stayed in base R with a linear representation so every line runs here in your browser. Production self-supervised learning trains a neural-network encoder to minimise the very InfoNCE loss you computed. That needs a deep-learning framework and a GPU, so it runs on your own machine, not in this page:

```r-static
# Real contrastive learning (SimCLR-style), run locally with torch.
# The loss is the InfoNCE you computed by hand; the encoder is a neural net.
library(torch)
encoder <- nn_sequential(nn_linear(4, 32), nn_relu(), nn_linear(32, 8))
info_nce <- function(z1, z2, tau = 0.2) {
  z1 <- nnf_normalize(z1, dim = 2); z2 <- nnf_normalize(z2, dim = 2)
  logits <- torch_mm(z1, z2$t()) / tau
  labels <- torch_arange(1, z1$size(1), dtype = torch_long())
  nnf_cross_entropy(logits, labels)            # exactly the log-softmax of the matching pair
}
# ... augment each batch into two views, embed, step the optimiser on info_nce ...
```

The principle is identical to what you built; only the encoder and the scale change.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Chen et al. (2020), A Simple Framework for Contrastive Learning of Visual Representations (SimCLR)](https://arxiv.org/abs/2002.05709) - the paper that made contrastive learning simple, and showed how much the choice of augmentation matters.
- [van den Oord et al. (2018), Representation Learning with Contrastive Predictive Coding](https://arxiv.org/abs/1807.03748) - where the InfoNCE loss you computed comes from.
- [Grill et al. (2020), Bootstrap Your Own Latent (BYOL)](https://arxiv.org/abs/2006.07733) - a self-supervised method that avoids collapse WITHOUT negatives, the back door from the limits step.
- [Bergman and Hoshen (2020), Classification-Based Anomaly Detection for General Data (GOAD)](https://arxiv.org/abs/2005.02359) - self-supervised anomaly detection for tabular, non-image data, exactly this course's setting.
- [Hastie, Tibshirani and Friedman, The Elements of Statistical Learning, ch. 14 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - principal components and unsupervised representation, the classical grounding.

=== step === complete
## Lesson 7 complete, and the course with it

You closed the loop. When there are no labels, you MANUFACTURE a task from the data: hide a part and predict it (self-supervised), or make two views of each item and pull them together while pushing other items apart (contrastive). You read the InfoNCE loss, watched a collapsed representation score the worst possible log N, and saw why the negatives exist, to keep the map spread. Then you cashed it in: in a spread, decorrelated representation, the odd flower simply sat far from the crowd, distance 9.56 against 7.24, and an unlabelled hunch became a number you can threshold.

That is the last tool in your anomaly kit. Across seven lessons you have gone from what an anomaly even is, through isolation forests, local density, autoencoders, time and the decomposition that tames it, the linear and non-linear ways to compress data, and finally to learning the representation itself without a single label. You now have a detector for almost any shape of "does not belong." Take them to your own data, and go find what does not fit.
