---
title: "Anomaly Detection Lesson 7: Self-Supervised and Contrastive Learning"
description: "Learn representations without labels in R: pretext tasks, the contrastive pull-and-push idea, and why a decorrelated representation makes anomalies stand out."
keywords: "self-supervised learning, contrastive learning, representation learning, SimCLR, InfoNCE, pretext task, Barlow Twins, decorrelation, anomaly detection, R"
mathjax: true
webr: true
curriculum_id: "6.200.7"
post_type: "LESSON"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "7"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: ""
course_prev: "Kernel-PCA-Sparse-PCA-and-NMF.html"
lesson_access: "pro"
catalog_blurb: "Learn a useful representation from unlabeled data so odd points stand out."
---

=== step === cover
::eyebrow Lesson 7 of 7
## Self-Supervised and Contrastive Learning

Aurora runs 50,000 home-security cameras. Every night, each camera turns its motion clip into a short numeric fingerprint: total **motion**, the number of moving **blobs** (people, pets, headlights, swaying branches), the **active seconds**, and the **brightness**. Last night one camera logged clip #201: motion 70, one moving blob, 23 seconds of activity, brightness 54. Was it a family member fetching a parcel, or an intruder? Nobody knows, because nobody has labeled which of the millions of nightly clips are break-ins. Hand-labeling them all is impossible.

Lesson 6 upgraded PCA three ways to reshape the coordinates you score a point against. But every method so far, PCA included, is still hand-built: **you** pick the transform. This finale asks the machine to *learn* the representation itself, straight from the unlabeled clips, using a trick with a wonderful name: **contrastive learning**. Two slightly different views of the same clip should end up close together; two different clips should end up far apart. From that one rule, and no labels at all, a representation emerges in which a genuine intruder finally stands out.

By the end of this lesson you will be able to:

- Say why anomaly detection is so often label-free, and what a "representation" is and why a good one matters
- Describe a **pretext task**: how hiding part of the data and predicting it turns unlabeled data into a learning signal
- Explain the **contrastive** idea, positive pairs pulled together and negatives pushed apart, and read the InfoNCE loss
- Explain **representational collapse**, and why a good representation must be well-spread and decorrelated
- Show, in a few lines of base R, that a decorrelated representation makes a relationship-breaking anomaly stand out

**Prerequisites:** you can read base R (indexing, matrices, `scale`, `cov`, `lm`), and you have done [Lesson 4: Autoencoders](Autoencoders-for-Anomaly-Detection.html) (scoring a point by how badly it rebuilds, and that a linear autoencoder is PCA), [Lesson 6: Kernel PCA, Sparse PCA and NMF](Kernel-PCA-Sparse-PCA-and-NMF.html) (PCA, loadings, variance explained), and [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (the base-rate trap). No deep-learning background is needed; every idea is built here from scratch.

::widget process-flow {"steps":[{"title":"Unlabeled clips","sub":"thousands of night clips, none tagged normal or intruder"},{"title":"Make two views","sub":"jitter each clip into two versions of the same event"},{"title":"Pull and push","sub":"pull the two views of one clip together, push different clips apart"},{"title":"A useful map","sub":"a spread, decorrelated representation where the odd clip stands out"}]}

=== step === concept
::eyebrow The problem
## No labels, and single features lie

Start with what makes this hard. A **representation** is just a re-description of each clip as a list of numbers, chosen so that distance between two lists means "how different are these two clips." The raw fingerprint is one representation, and a poor one, as you are about to see. We have no labels, so we cannot train a classifier of normal-versus-intruder. We can only learn from the *shape* of the data itself.

Let us build Aurora's clips and plant one intruder, then check whether any single feature gives it away. Normal clips share a simple habit: a busier night means more motion, more moving blobs, and longer activity, all rising together. The intruder (clip #201) has busy motion and long activity but only **one** moving blob, a lone figure where a busy clip would show many small blobs.

```r
set.seed(1)
n <- 200
a <- runif(n, 0, 1)                                  # latent "how busy" level of each clip
motion     <- round(20 + 60*a + rnorm(n, 0, 3), 1)   # busier clip -> more total motion
blobs      <- round( 1 +  8*a + rnorm(n, 0, 0.5))    # busier clip -> more moving blobs
active_sec <- round( 4 + 22*a + rnorm(n, 0, 1.5), 1) # busier clip -> longer active time
brightness <- round(55 + rnorm(n, 0, 6), 1)          # ambient light, unrelated to how busy it is
clips <- data.frame(motion, blobs, active_sec, brightness)
clips <- rbind(clips, data.frame(motion = 70, blobs = 1, active_sec = 23, brightness = 54))
kind  <- c(rep("normal", n), "INTRUDER")             # kept only to CHECK our work, never to train
tail(clips, 2)
#>     motion blobs active_sec brightness
#> 200   66.1     7       20.8       51.8
#> 201   70.0     1       23.0       54.0

# how extreme is the intruder on each single feature? (z-score against the normal clips)
nm <- kind == "normal"
z  <- sapply(names(clips), function(v)
        (clips[nrow(clips), v] - mean(clips[nm, v])) / sd(clips[nm, v]))
round(z, 2)
#>     motion      blobs active_sec brightness
#>       1.16      -1.85       1.26      -0.16
```

Look at those z-scores: 1.16, -1.85, 1.26, -0.16. Not one of them is past 2 standard deviations. Every single-feature rule, an amount fence, an IQR whisker, a per-column z-score, waves this clip through as unremarkable. Yet busy motion with a single blob is not how a normal night looks. The tell is in the *relationship between* the features, exactly the kind of anomaly Lesson 4 caught with reconstruction error. Here we will catch it a different way: by learning a representation in which that broken relationship becomes a long distance.

=== step === concept
::eyebrow Self-supervision
## Pretext tasks: invent a label from the data

If we have no labels, we manufacture one. That is the whole trick behind **self-supervised learning**: take a **pretext task**, an artificial puzzle whose answer is already hidden inside the data, and make the model solve it. The answer is free, so no human has to label anything, and to solve the puzzle the model is forced to learn the structure of normal data.

The simplest pretext task for a table of numbers: **hide one column and predict it from the others.** If a model can guess a clip's active seconds from its motion, blobs and brightness, then it has discovered how the features relate. Let us measure how well that works, using an ordinary linear model as the "solver" and \(R^2\) (the fraction of variance it explains, where 1 is perfect and 0 is useless) as the score.

```r
Xdf  <- as.data.frame(scale(clips))                      # standardize each feature (mean 0, sd 1)
fit  <- lm(active_sec ~ motion + blobs + brightness, data = Xdf[nm, ])   # learn on normal clips
pred <- predict(fit, Xdf)                                # predict the hidden column for every clip
r2   <- 1 - var(Xdf$active_sec - pred) / var(Xdf$active_sec)
round(r2, 2)
#> [1] 0.91
```

An \(R^2\) of 0.91 means the hidden column was 91% predictable from the others: normal clips carry a strong, learnable pattern, and no labels were needed to find it. A model good at this pretext task has, as a side effect, built an internal sense of "what a normal clip looks like." That side effect is the representation we are after. Masked-feature prediction is the tabular cousin of the pretext tasks that power modern systems: fill in a blanked-out word, or un-rotate a photo. Solving the puzzle is never the goal; the *representation* you build along the way is.

=== step === widget
::eyebrow The big idea
## The contrastive idea

Contrastive learning is a sharper pretext task, and the one that reliably builds the best representations. It rests on a single, intuitive rule about **views**. A **view** of a clip is a lightly altered copy of it: nudge each number a little, dim the brightness, briefly drop a feature. It is obviously still the same event, just seen through a slightly different filter. So:

- Two views of the **same** clip form a **positive pair**. They should land *close together* in the representation.
- Any **other** clip in the batch is a **negative**. It should land *far apart*.

That is the entire objective: **pull positives together, push negatives apart.** No labels anywhere, the only "supervision" is the free fact that two views came from the same source clip. Train on that rule across thousands of clips and the representation self-organizes: similar clips cluster, the space spreads out to use every direction, and a clip that resembles nothing else, our intruder, ends up stranded far from the crowd.

::widget process-flow {"steps":[{"title":"Anchor","sub":"pick one clip as the anchor"},{"title":"Two views","sub":"augment it twice: the positive pair, one event seen two ways"},{"title":"Negatives","sub":"every other clip in the batch is a negative"},{"title":"Pull and push","sub":"pull the anchor and its positive together, push the negatives away"}]}

=== step === concept
::eyebrow The formal picture
## The contrastive loss, precisely

Now the exact machinery. An **encoder** \(f\) maps a clip \(x\) to an embedding \(z = f(x)\), which we **L2-normalize** so it has length 1 (\(\lVert z \rVert = 1\)). For unit vectors, the **cosine similarity** is just their dot product, \(\operatorname{sim}(z_a, z_b) = z_a^\top z_b\): it runs from \(+1\) (same direction) down to \(-1\) (opposite). Take an anchor \(a\), its positive \(p\) (the other view of the same clip), and \(m\) negatives \(n_1, \dots, n_m\). The **InfoNCE** loss for the anchor is

\( \ell = -\log \dfrac{\exp\!\big(\operatorname{sim}(z_a, z_p)/\tau\big)}{\exp\!\big(\operatorname{sim}(z_a, z_p)/\tau\big) + \sum_{k=1}^{m}\exp\!\big(\operatorname{sim}(z_a, z_{n_k})/\tau\big)} \)

Read it as a softmax: the numerator is the anchor's agreement with its positive, the denominator adds in its agreement with every negative, and \(\tau > 0\) (the **temperature**) sharpens the contrast. Making \(\ell\) small means making the positive similarity large *relative to* the negatives, which is exactly "pull the positive close, push the negatives away."

Let us watch the two halves of that rule on real numbers. We do not have a trained encoder yet, so we use the standardized fingerprint itself as a stand-in embedding, just to see the arithmetic of the loss.

```r
X <- scale(clips)                                    # our stand-in embedding: the standardized clip
augment <- function(x, sd = 0.15) x + rnorm(length(x), 0, sd)   # a "view": jitter each feature a little
set.seed(42)
v1 <- augment(X[7, ]); v2 <- augment(X[7, ])         # two views of the SAME clip (#7): a positive pair
vn <- augment(X[150, ])                              # a view of a DIFFERENT clip: a negative
round(rbind(view1 = v1, view2 = v2), 2)
#>       motion blobs active_sec brightness
#> view1   1.89  1.64       1.26      -1.30
#> view2   1.75  1.71       1.43      -1.41

unit    <- function(z) z / sqrt(sum(z^2))            # L2-normalize: rescale to length 1
cos_pos <- sum(unit(v1) * unit(v2))                  # same clip     -> should be high
cos_neg <- sum(unit(v1) * unit(vn))                  # different clip -> should be lower
round(c(positive_pair = cos_pos, negative_pair = cos_neg), 3)
#> positive_pair negative_pair
#>         0.997         0.727
```

The positive pair agrees at 0.997, the negative at 0.727: the rule already separates them. Now assemble the full InfoNCE loss for this anchor with one positive and three negatives.

```r
tau    <- 0.2                                        # temperature: smaller = sharper contrast
others <- rbind(v2, vn, augment(X[42, ]), augment(X[99, ]))   # row 1 = positive, rows 2 to 4 = negatives
sims   <- apply(others, 1, function(o) sum(unit(v1) * unit(o)) / tau)
loss   <- -log(exp(sims[1]) / sum(exp(sims)))        # positive share of the softmax
round(unname(loss), 3)
#> [1] 0.773
```

A loss of 0.773. Training an encoder means adjusting \(f\) to drive that number down across millions of anchors, which nudges every positive pair closer and every negative farther, one gradient step at a time.

=== step === quiz
::eyebrow Check yourself
## What is contrastive learning actually doing?

Aurora's night clips have no labels at all. Which statement correctly describes what a contrastive model does with them?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It needs each clip tagged normal or intruder first, then it learns to separate the two labeled groups ::no The opposite is the whole point: contrastive learning uses NO labels. Its only supervision is free and automatic, that two augmented views of one clip belong together. Nobody tags anything.
- It pulls the two augmented views of one clip together and pushes different clips apart, so similar clips end up grouped without any labels ::ok Exactly. The positive pair (two views of one clip) is pulled together; every other clip is a negative and pushed apart. The supervision is manufactured from the data itself, which is what "self-supervised" means.
- The negatives in each batch are the anomalies, so the loss is really flagging intruders while it trains ::no No: a "negative" just means "a different clip", almost always another normal clip. Negatives are the contrast that keeps every clip from collapsing to one point, not anomalies. Flagging happens later, using the learned representation.

=== step === concept
::eyebrow The trap
## Collapse: the easy way to cheat

There is a lazy way for the encoder to make every positive pair close: **map every clip to the same point.** Then all embeddings are identical, every positive similarity is a perfect 1, and the "pull together" half of the loss is trivially satisfied. This is **representational collapse**, and a collapsed representation is worthless: if every clip sits on top of every other, no clip can ever be an outlier. This is why the negatives matter. They punish collapse.

Put \(z_a = z_p = z_{n_k} = c\) into the InfoNCE loss. Every similarity equals \(1\), so every exponential equals \(e^{1/\tau}\), and

\( \ell = -\log \dfrac{e^{1/\tau}}{(1+m)\, e^{1/\tau}} = \log(1+m) \)

which is the *largest* value the loss can take, not the smallest. Collapse is the worst solution, not a shortcut: the denominator's negatives make sure of it. But InfoNCE guards against only the crudest collapse. A subtler failure remains, where the representation does not collapse to a point but wastes itself by making its features redundant. Look at the correlation between our four raw features across the clips.

```r
round(cor(X), 2)
#>            motion blobs active_sec brightness
#> motion       1.00  0.93       0.95       0.02
#> blobs        0.93  1.00       0.91       0.02
#> active_sec   0.95  0.91       1.00       0.00
#> brightness   0.02  0.02       0.00       1.00
```

Motion, blobs and active seconds are near-duplicates of one another (correlations around 0.93). The raw representation *looks* four-dimensional but really carries only about two independent directions. Three of its axes are saying the same thing three times, and that redundancy is what will let the intruder hide.

=== step === concept
::eyebrow The fix
## Spread out and decorrelate

A good representation needs two properties, and researchers have names for both. **Alignment**: positive pairs land close (the "pull together" we already have). **Uniformity**: the embeddings spread out to fill the space instead of clumping, which is the same as saying the representation's features should be **decorrelated**, each axis carrying its own, non-redundant information. Methods such as **Barlow Twins** and **VICReg** make this explicit: they drive the cross-correlation matrix \(C\) of the two views' embeddings toward the identity,

\( \mathcal{L} = \sum_i (1 - C_{ii})^2 \;+\; \lambda \sum_{i \neq j} C_{ij}^2 \)

pushing the diagonal to 1 (each feature agrees with itself across the two views, alignment) and the off-diagonal to 0 (different features stop copying each other, decorrelation). We cannot train a deep network in the browser, but we can do the exact linear version and see decorrelation happen: **whitening**. Whitening rotates and rescales the data so that its covariance becomes the identity matrix, every direction equal spread, zero correlation left over.

```r
S  <- cov(X)                                         # covariance of the raw representation
E  <- eigen(S)                                       # its principal directions and spreads
Wz <- E$vectors %*% diag(1 / sqrt(E$values)) %*% t(E$vectors)   # the ZCA whitening matrix
Z  <- X %*% Wz                                        # the DECORRELATED representation
round(cor(Z), 2)
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    0    0    0
#> [2,]    0    1    0    0
#> [3,]    0    0    1    0
#> [4,]    0    0    0    1
```

The correlation matrix of the new representation `Z` is the identity: the redundancy is gone, and all four directions now carry independent information.

[KEY INSIGHT]
Contrastive learning wants alignment (positives close) AND uniformity (a spread, decorrelated representation). Alignment alone allows collapse. It is the second property, decorrelation, that makes distance in the representation meaningful, and that is precisely what surfaces an anomaly.

=== step === concept
::eyebrow The payoff
## Why this catches the intruder

Now the reward, and the reason this whole course cares about representations. Score every clip by how far it sits from the centre of the normal clips, and compare two rulers: plain distance in the raw standardized space, versus distance in the decorrelated space. Distance in the whitened space has a classic name, the **Mahalanobis distance**,

\( d_M(x)^2 = (x - \mu)^\top \Sigma^{-1} (x - \mu) \)

where \(\mu\) and \(\Sigma\) are the mean and covariance of the normal clips. Dividing by \(\Sigma\) is exactly the whitening from the last step, so Mahalanobis distance *is* Euclidean distance measured in the decorrelated representation.

```r
ctr   <- colMeans(X[nm, ])                           # centre of the normal clips
d_raw <- sqrt(rowSums(sweep(X, 2, ctr)^2))           # plain distance in the raw representation
d_dec <- mahalanobis(X, ctr, cov(X[nm, ]))           # distance in the DECORRELATED representation
cat("intruder rank by raw distance:         ", rank(-d_raw)[nrow(clips)], "of", nrow(clips), "\n")
cat("intruder rank by decorrelated distance:", rank(-d_dec)[nrow(clips)], "of", nrow(clips), "\n")
#> intruder rank by raw distance:          44 of 201
#> intruder rank by decorrelated distance: 1 of 201
o <- order(-d_dec)[1:3]
data.frame(rank = 1:3, kind = kind[o], decorrelated_dist = round(d_dec[o], 1))
#>   rank     kind decorrelated_dist
#> 1    1 INTRUDER             104.9
#> 2    2   normal              12.2
#> 3    3   normal              11.9
```

In the raw representation the intruder is buried at rank 44 of 201, lost in the crowd, because plain distance lets the three redundant "busy-ness" features drown out the one direction that matters. In the decorrelated representation it leaps to rank 1, and not by a whisker: its distance is 104.9 against about 12 for the next clip. Decorrelating the space stretched the thin "busy motion, few blobs" direction that normal clips barely use, and the intruder, which lives exactly there, shot to the top. The picture below shows the same idea: in a spread representation, items separate into groups and a point belonging to none sits alone.

::widget pca-projection {}

=== step === tryit
::eyebrow Your turn
## Rank the clips in the decorrelated space

Put it together. Score every clip by its distance from the normal centre, but measured in the decorrelated representation. `mahalanobis(points, center, cov)` returns exactly that: the squared distance after whitening by a covariance. Fill the blank with the covariance that decorrelates the space, the covariance of the **normal** clips, so the intruder rises to the top.

```r
ctr   <- colMeans(X[nm, ])                 # centre of the normal clips
d_dec <- mahalanobis(X, ctr, ____)         # distance in the DECORRELATED space
kind[order(-d_dec)[1]]                      # the single most anomalous clip
```
::check {"regex":"mahalanobis\\(X, ctr, cov","gate":true,"difficulty":"intermediate","ok":"That is it. cov(X[nm, ]) is the covariance of the normal clips, and dividing distance by it (whitening) puts every direction on equal footing. The intruder, sitting along a direction the normal clips barely use, jumps to the top with a decorrelated distance of 104.9 versus about 12 for the next clip; in the raw space it was only 44th.","no":"The third argument is the covariance that defines the SHAPE of normal, and it must come from the normal clips: cov(X[nm, ]). That is what whitens the space so a clip breaking the normal relationship stands out, because mahalanobis divides the distance by this covariance."}
::solution
```r
ctr   <- colMeans(X[nm, ])
d_dec <- mahalanobis(X, ctr, cov(X[nm, ]))
kind[order(-d_dec)[1]]
#> [1] "INTRUDER"
```

=== step === quiz
::eyebrow Check yourself
## Why did the decorrelated distance win?

Raw distance ranked the intruder 44th of 201; the decorrelated (Mahalanobis) distance ranked it 1st, at 104.9 versus about 12 for the next clip. Which statement best explains why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Because the intruder clip has the largest, most extreme feature values, so it is far from everything by any ruler ::no Not so: its feature z-scores were ordinary (1.16, -1.85, 1.26, -0.16) and raw distance buried it at rank 44. Extremeness is not what caught it.
- Because raw distance already ranked it near the top, and decorrelating only reshuffled a few ties ::no No: raw distance put it at 44th, deep in the normal crowd. Decorrelation did not fine-tune the order, it moved the intruder from 44th all the way to 1st.
- Because whitening rescales the correlated directions to equal footing, so a clip that breaks the motion-blobs-activity relationship lands far out along a direction normal clips barely use ::ok Right. Motion, blobs and active seconds are highly correlated for normal clips, so the normal cloud is razor-thin in the "busy motion, few blobs" direction. Whitening stretches that thin direction, and the intruder, which lives exactly there, shoots to a Mahalanobis distance of 104.9.

=== step === concept
::eyebrow Know the limits
## When it breaks, and the real thing

The linear whitening you built is the honest, runnable core of the idea, but be clear about its limits, and about what a full contrastive system adds.

- **Clean-ish normal data.** Like every method in this course, it learns "normal" from the training clips. Salt them with undetected intruders and the covariance widens to include that pattern, and the flag goes quiet. Curate the training set.
- **Augmentations must preserve identity.** A "view" has to be a clip that is still recognizably the same event. Jitter and small dropout are safe; an augmentation that erases the very signal you care about would teach the encoder to ignore it.
- **Whitening is linear.** It can only decorrelate along straight axes. Real clip fingerprints often lie on a curved manifold, and that is where a genuine contrastive **neural** encoder earns its keep: same pull-and-push rule, but a nonlinear \(f\) that can bend the representation.

[WARNING]
A real contrastive encoder (SimCLR, MoCo) trains a neural network with a deep-learning toolkit, which does not run in the browser. Here it is for reference only, to run locally. Notice it is the same rule you just learned, an encoder, augmented views, and the InfoNCE loss, only nonlinear:

```r-static
# A real contrastive encoder (torch): a NONLINEAR representation, not just linear whitening.
# torch needs a native backend, so run this locally, not in the browser.
library(torch)
encoder <- nn_sequential(nn_linear(4, 16), nn_relu(), nn_linear(16, 8))   # f: clip -> 8-d embedding
augment <- function(x) x + torch_randn_like(x) * 0.15                     # a random view
info_nce <- function(z, tau = 0.2) {                                      # z: 2N x d, rows i and i+N paired
  z   <- nnf_normalize(z, dim = 2)                                        # L2-normalize each embedding
  sim <- torch_mm(z, z$t()) / tau                                         # all pairwise cosine similarities
  nnf_cross_entropy(sim, target_indices)                                  # positives vs the rest (softmax)
}
opt <- optim_adam(encoder$parameters, lr = 1e-3)
for (step in 1:2000) {                                                    # train on NORMAL clips only
  batch <- normal_clips[sample(nrow(normal_clips), 256), ]
  z <- encoder(torch_cat(list(augment(batch), augment(batch))))
  loss <- info_nce(z); opt$zero_grad(); loss$backward(); opt$step()
}
```

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Chen, Kornblith, Norouzi and Hinton (2020), A Simple Framework for Contrastive Learning (SimCLR)](https://arxiv.org/abs/2002.05709) - the paper that made the augment-and-contrast recipe and the InfoNCE (NT-Xent) loss a standard, with careful ablations of which augmentations matter.
- [van den Oord, Li and Vinyals (2018), Representation Learning with Contrastive Predictive Coding](https://arxiv.org/abs/1807.03748) - where the InfoNCE loss you used comes from, framed as maximizing mutual information.
- [Zbontar, Jing, Misra, LeCun and Deny (2021), Barlow Twins: Self-Supervised Learning via Redundancy Reduction](https://arxiv.org/abs/2103.03230) - the decorrelation objective this lesson leaned on: drive the cross-correlation matrix toward the identity, no negatives needed.
- [Wang and Isola (2020), Understanding Contrastive Learning through Alignment and Uniformity](https://arxiv.org/abs/2005.10242) - the theory behind the two properties we kept returning to, alignment and uniformity (spread), on the unit sphere.
- [Tack, Mo, Jeong and Shin (2020), CSI: Novelty Detection via Contrastive Learning](https://arxiv.org/abs/2007.08176) - contrastive representations used directly for anomaly and novelty detection, the exact bridge from this lesson to this course.

=== step === complete
## Lesson 7 complete, and the course with it

You just closed the loop that this whole course has been building toward. When there are no labels, you do not give up, you **manufacture** a learning signal from the data itself. A pretext task (hide a feature, predict it) already extracts real structure; contrastive learning sharpens it into a single rule, pull two views of one clip together and push different clips apart, and from that rule, with no labels, a representation self-organizes. You saw why it must avoid **collapse** and instead be well-spread and **decorrelated** (alignment plus uniformity, the target that Barlow Twins and VICReg optimize directly), and then you cashed the payoff in a few lines of base R: a decorrelated representation, via whitening and Mahalanobis distance, lifted a relationship-breaking intruder from rank 44 to rank 1, a clip that every single-feature rule had waved through.

Step back and look at the seven detectors you now command. Isolation forests fence off a point with random cuts; the Local Outlier Factor compares a point's density to its neighbours'; one-class SVMs and autoencoders learn the shape of normal and flag whatever falls off it; time-series methods strip out rhythm before judging a point; kernel PCA, sparse PCA and NMF reshape the space you score against; and now self-supervised, contrastive learning lets the machine *learn* that space from unlabeled data. Every one of them, in the end, answers the same question in its own way: how surprising is this point, given everything normal? You can now pick the right tool for the data in front of you, build it in R, and, remembering Lesson 1, judge it honestly by precision and recall rather than accuracy. That is anomaly detection, from the ground up.
