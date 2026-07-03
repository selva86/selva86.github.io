---
title: "Anomaly Detection Lesson 6: Kernel PCA, Sparse PCA and NMF"
catalog_blurb: "Go beyond PCA for curved structure, readable components, and additive parts."
description: "Beyond plain PCA in R: kernel PCA for non-linear structure, sparse PCA for readable loadings, and NMF for additive parts-based components, each built from scratch."
keywords: "kernel PCA, sparse PCA, non-negative matrix factorization, NMF, dimensionality reduction, RBF kernel, eigen-decomposition, multiplicative updates, anomaly detection, R"
post_type: "LESSON"
curriculum_id: "6.200.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "6"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Self-Supervised-and-Contrastive-Learning.html"
course_prev: "Time-Series-Anomaly-Detection.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## Kernel PCA, Sparse PCA and NMF

In Lesson 4 you scored an anomaly by how badly a model rebuilt it, and a linear autoencoder turned out to be plain old PCA: squeeze each customer down to a few numbers, rebuild them, and flag whoever rebuilds worst. It works, but the subspace PCA hands you is a blunt instrument. It only draws straight axes, it spreads every feature across every component, and it happily uses negative weights.

Meet **Bean Box**, a coffee-subscription startup. It wants to understand its customers and flag the odd account, and this lesson upgrades PCA three ways to help it: bend the axes into curves (**kernel PCA**), force each component to name only a few features (**sparse PCA**), and rebuild data from additive parts that can never go negative (**NMF**).

By the end of this lesson you will be able to:

- Say why plain PCA misses curved structure, and build kernel PCA from an RBF kernel matrix
- Turn PCA's dense loadings into a handful you can actually name, with a sparsity penalty
- Decompose a table of counts into additive, parts-based components with NMF
- Pick the right one of the three for a given data shape and anomaly-detection goal

**Prerequisites:** you can read base R (indexing, matrices), and you have done [Lesson 4: Autoencoders](Autoencoders-for-Anomaly-Detection.html) (scoring a point by how badly it rebuilds, and that a linear autoencoder is PCA) and [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html). Plain PCA, its loadings and variance explained are recapped in the next step.

::widget pca-projection {}

=== step === concept
::eyebrow The starting point
## Plain PCA, and three places it falls short

Principal Component Analysis finds new axes, the **principal components**, ordered so the first captures the most spread in the data, the second the most of what is left, and so on. The recipe for the first component is: find the direction \(w\) (a weight per feature) that maximises the variance of the projected data \(\operatorname{Var}(Xw)\), subject to \(\lVert w \rVert = 1\) so the weights cannot just blow up. Those weights \(w\) are the **loadings**: they tell you how much each feature contributes to that component.

Let us give Bean Box six flavour scores for 200 customers, built so one hidden taste, how dark-roast a customer likes, drives bitter, roast and body together, while acidity, fruity and sweet mostly do their own thing. Run this first; it is the data the plain-PCA and sparse-PCA steps both use.

```r
set.seed(7)
m    <- 200
dark <- rnorm(m, 0, 1)                                # a hidden taste: how dark-roast a customer likes
flavor <- data.frame(
  bitter  = round(50 + 13 * dark + rnorm(m, 0, 3)),   # these three track the dark-roast taste closely
  roast   = round(50 + 12 * dark + rnorm(m, 0, 3)),
  body    = round(50 + 10 * dark + rnorm(m, 0, 3)),
  acidity = round(50 +  2 * dark + rnorm(m, 0, 11)),  # these three barely relate to it
  fruity  = round(50 +  2 * dark + rnorm(m, 0, 11)),
  sweet   = round(50 +  2 * dark + rnorm(m, 0, 11))
)
pca6  <- prcomp(flavor, scale. = TRUE)
load1 <- pca6$rotation[, 1]                           # PC1 loadings: one weight per flavour
if (load1["bitter"] < 0) load1 <- -load1             # a component's sign is arbitrary; orient it to read
round(load1, 3)
#>  bitter   roast    body acidity  fruity   sweet
#>   0.540   0.538   0.541   0.220   0.266   0.086
```

That single component already tells a story: bitter, roast and body carry the big weights, so PC1 is essentially the dark-roast axis. But look closely, and three cracks appear, one for each tool in this lesson.

| Crack in plain PCA | What goes wrong | The fix |
|---|---|---|
| The axes are **straight lines** | it cannot follow structure that curves | kernel PCA |
| Every loading is **non-zero** (dense) | acidity, fruity and sweet still get weights, cluttering the story | sparse PCA |
| Loadings can be **negative** | a weight of "minus sweetness" makes no sense for counts | NMF |

We take them in that order.

=== step === concept
::eyebrow Fix one, the motivation
## Kernel PCA: finding curves a straight axis misses

PCA can only draw straight axes, so it is blind to structure that curves. Here is a Bean Box case where that blindness bites. Two kinds of customer live in a two-flavour map: **regulars** cluster near the middle (mild, predictable tastes), and **explorers** ring around the outside (they roam to extremes). The two groups form concentric rings. Run plain PCA and ask where each group sits on the first component:

```r
set.seed(1)
n   <- 60
ang <- runif(2 * n, 0, 2 * pi)                        # a random direction for each customer
rad <- c(rnorm(n, 0.6, 0.08), rnorm(n, 2.4, 0.10))   # inner ring (regulars) + outer ring (explorers)
flavor2 <- data.frame(x = rad * cos(ang), y = rad * sin(ang))
group   <- rep(c("regular", "explorer"), each = n)

pcr <- prcomp(flavor2)                                # plain PCA on the two flavour axes
round(tapply(pcr$x[, 1], group, mean), 3)            # average PC1 position of each group
#> explorer  regular
#>   -0.058    0.058
```

The two groups land almost on top of each other, near zero, because a straight axis through concentric rings cannot separate an inside from an outside. The trick that fixes it is the **kernel trick**: instead of comparing customers by their raw coordinates, compare them by a **similarity**. The RBF (Gaussian) kernel scores every pair of customers \(x_i\) and \(x_j\) by

\( k(x_i, x_j) = \exp\!\left(-\dfrac{\lVert x_i - x_j \rVert^2}{2\sigma^2}\right) \)

which is \(1\) when two customers are identical and fades toward \(0\) as the distance \(\lVert x_i - x_j \rVert\) between them grows; \(\sigma\) sets how quickly it fades. Collect those similarities into an \(N \times N\) **kernel matrix** \(K\), and doing PCA on \(K\) (after centering it) is exactly PCA in a curved, higher-dimensional space, without ever visiting that space. The widget below shows the same trick powering a classifier: a straight boundary fails on an inner blob inside a ring, but an RBF kernel wraps it perfectly. Kernel PCA borrows that exact machinery.

::widget kernel-svm {}

=== step === tryit
::eyebrow Your turn
## Build kernel PCA from scratch

Three moves turn the rings into something a straight axis can split: build the RBF **kernel matrix** \(K\) from the pairwise distances, **center** it (the columns of the implicit feature space must have mean zero, and the formula below does that using \(\mathbf{1}_N\), the \(N \times N\) matrix whose every entry is \(1/N\)), then **eigen-decompose** it (find the directions it varies along most, the **eigenvectors**, each tagged by an **eigenvalue** saying how much variance that direction carries) and read off the top components. Fill in the kernel itself.

```r
Xk  <- as.matrix(flavor2)
D2  <- as.matrix(dist(Xk))^2                 # squared distance between every pair of customers
sig <- 1
K   <- ____                                  # RBF kernel: turn those squared distances into similarities

N   <- nrow(K); ones <- matrix(1 / N, N, N)
Kc  <- K - ones %*% K - K %*% ones + ones %*% K %*% ones   # center the kernel in feature space
ev  <- eigen(Kc, symmetric = TRUE)                          # eigen-decompose the centered kernel
kpc <- ev$vectors[, 1:2] %*% diag(sqrt(pmax(ev$values[1:2], 0)))   # project onto 2 kernel components
if (mean(kpc[group == "explorer", 1]) < 0) kpc <- -kpc     # orient the sign for reading
round(tapply(kpc[, 1], group, mean), 3)
```
::check {"regex":"exp\\(\\s*-","gate":true,"difficulty":"intermediate","ok":"That is it. On the first kernel component the two rings now sit far apart (about +0.43 and -0.43), a gap plain PCA could not find. The curved structure became linear in kernel space.","no":"Turn distances into similarities with the RBF kernel: exp(-D2 / (2 * sig^2)). Big distance gives a small number; zero distance gives 1."}
::solution
```r
Xk  <- as.matrix(flavor2)
D2  <- as.matrix(dist(Xk))^2
sig <- 1
K   <- exp(-D2 / (2 * sig^2))                # RBF kernel: turn distances into similarities

N   <- nrow(K); ones <- matrix(1 / N, N, N)
Kc  <- K - ones %*% K - K %*% ones + ones %*% K %*% ones
ev  <- eigen(Kc, symmetric = TRUE)
kpc <- ev$vectors[, 1:2] %*% diag(sqrt(pmax(ev$values[1:2], 0)))
if (mean(kpc[group == "explorer", 1]) < 0) kpc <- -kpc
round(tapply(kpc[, 1], group, mean), 3)
#> explorer  regular
#>    0.429   -0.429
```

[WARNING]
Kernel PCA is powerful but not free. You must choose \(\sigma\) (too small and every point looks unique; too large and everything looks identical). The kernel matrix is \(N \times N\), so it grows with the square of the number of customers. And there is the **pre-image problem**: kernel PCA gives each point new coordinates but no easy way back to the original flavours, so using its reconstruction error as an anomaly score takes extra work. For catching a customer who sits off a curved manifold, though, nothing linear comes close.

=== step === concept
::eyebrow Fix two
## Sparse PCA: components you can name

Back to the six flavour scores. Plain PCA's first component put a weight on all six: bitter 0.54, roast 0.54, body 0.54, but also acidity 0.22, fruity 0.27, sweet 0.09. Those last three are small, yet they are not zero, so strictly the component is "a bit of everything." When you have six features that is mildly annoying; when you have six hundred, a dense component is unreadable. You cannot point at it and say what it means.

**Sparse PCA** fixes this by adding a penalty that pushes small loadings all the way to zero. Plain PCA maximises \(w^\top \Sigma w\) (the variance along \(w\), where \(\Sigma\) is the covariance matrix); sparse PCA maximises the same thing minus an **L1 penalty** \(\lambda \lVert w \rVert_1 = \lambda \sum_j |w_j|\), the sum of the absolute loadings. That penalty is what forces exact zeros: the same reason the lasso zeros out regression coefficients. The widget makes it concrete: as the penalty \(\lambda\) rises, lasso snaps weak coefficients to exactly zero one by one, while ridge only shrinks them.

::widget coef-path {}

A full sparse PCA jointly re-optimises the loadings under that penalty. To feel the mechanism without leaving base R, we approximate it by **soft-thresholding** the loadings PCA already gave us: shrink every loading toward zero by \(\lambda\), and any that reaches zero stays there, \(\tilde w_j = \operatorname{sign}(w_j)\,\max(|w_j| - \lambda,\, 0)\).

```r
lambda  <- 0.30                                          # how hard to shrink each loading
sp_load <- sign(load1) * pmax(abs(load1) - lambda, 0)    # soft-threshold: small loadings -> exactly 0
sp_load <- sp_load / sqrt(sum(sp_load^2))                # rescale back to unit length
round(sp_load, 3)
#>  bitter   roast    body acidity  fruity   sweet
#>   0.578   0.574   0.581   0.000   0.000   0.000
```

Now the component is honest and nameable: it is the dark-roast axis, bitter plus roast plus body, and nothing else. The three distracting weights are gone. You trade a sliver of explained variance (and the components are no longer perfectly at right angles) for something you can hand to the marketing team and they will understand.

=== step === quiz
::eyebrow Check yourself
## What did sparse PCA buy?

Plain PCA's first component had loadings bitter 0.54, roast 0.54, body 0.54, acidity 0.22, fruity 0.27, sweet 0.09. Sparse PCA rewrote it to keep only bitter, roast and body. Why might Bean Box prefer the sparse version?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The three small loadings add clutter without much signal, so zeroing them gives a component you can name (the dark-roast axis) while keeping almost all its meaning ::ok Exactly. Sparsity buys interpretability: a component defined by three flavours is something a human can act on, at the cost of a little explained variance and exact orthogonality.
- The small loadings were a mistake; a correctly computed PCA would have set them to zero on its own ::no Dense loadings are not a bug. Plain PCA is doing exactly what it should, spreading weight across every feature. Sparse PCA changes the objective (it adds an L1 penalty), it does not fix an error.
- Sparse PCA always explains more variance, so it is simply the better method ::no It is the other way around. Zeroing loadings can only lower or match the variance the component captures. You accept slightly less variance in exchange for a readable component.

=== step === concept
::eyebrow Fix three
## NMF: rebuilding data from additive parts

The last crack is negativity. Plain PCA and kernel PCA both use negative weights, which is fine for abstract axes but strange for things you count. Bean Box's monthly orders are counts: nobody buys minus two croissants. When every number is non-negative, we can ask for a decomposition where the pieces are non-negative too, and that one constraint changes everything.

**Non-negative matrix factorization (NMF)** approximates a non-negative data matrix \(V\) (customers by products) as a product of two smaller non-negative matrices, \(V \approx W H\), with \(V \ge 0\), \(W \ge 0\), \(H \ge 0\). The \(k\) rows of \(H\) are **parts** (each a recipe over the products, a "basket"), and each row of \(W\) says how much of each part a customer is made of. Because nothing can be negative, parts can only **add**, never cancel, so NMF discovers additive, parts-based structure. It minimises the reconstruction error \(\lVert V - WH \rVert_F^2\) (the Frobenius norm, the square root of the sum of squared entries) using **multiplicative updates**, \(H \leftarrow H \odot \dfrac{W^\top V}{W^\top W H}\) and \(W \leftarrow W \odot \dfrac{V H^\top}{W H H^\top}\), where \(\odot\) means multiply entry by entry. Because every factor in an update is non-negative, \(W\) and \(H\) can never go negative.

Let us build Bean Box's order counts for 120 customers, each a blend of a morning basket and an afternoon basket, then look at what one recovered part will turn out to be.

```r
set.seed(3)
cust      <- 120
morning   <- runif(cust, 0, 3)                        # how strongly each customer leans "morning"
afternoon <- runif(cust, 0, 3)                        # ... and "afternoon"
baskets   <- rbind(c(espresso = 3,   croissant = 2.5, tea = 0.2, cake = 0.1, cookie = 0.3),
                   c(espresso = 0.2, croissant = 0.3, tea = 3,   cake = 2.5, cookie = 2))
V <- round(cbind(morning, afternoon) %*% baskets + matrix(runif(cust * 5, 0, 0.6), cust, 5))
head(V, 3)
#>      espresso croissant tea cake cookie
#> [1,]        2         2   7    5      5
#> [2,]        8         7   8    7      6
#> [3,]        4         4   8    7      6
```

Here is what one part NMF recovers looks like: mostly tea, cake and cookie, with almost no espresso or croissant. NMF found the "afternoon treat" basket on its own, purely from the counts. You will compute it yourself in the next step.

::widget importance-bars {"items":[{"label":"tea","value":79},{"label":"cake","value":66},{"label":"cookie","value":53},{"label":"croissant","value":11},{"label":"espresso","value":9}]}

=== step === tryit
::eyebrow Your turn
## Factor the counts into two baskets

The function below is NMF's multiplicative-update loop, running until the two parts rebuild the counts well. All you decide is the one modelling choice that matters: how many parts, \(k\), to look for. Bean Box mixed two baskets, so ask for two.

```r
nmf_mu <- function(V, k, iters = 300, seed = 1) {
  set.seed(seed); eps <- 1e-9
  W <- matrix(runif(nrow(V) * k), nrow(V), k)          # random non-negative start
  H <- matrix(runif(k * ncol(V)), k, ncol(V))
  for (i in 1:iters) {
    H <- H * (t(W) %*% V) / ((t(W) %*% W %*% H) + eps)  # multiplicative update keeps H >= 0
    W <- W * (V %*% t(H)) / ((W %*% H %*% t(H)) + eps)  # ... and W >= 0
  }
  list(W = W, H = H)
}

fit   <- nmf_mu(V, k = ____)                            # how many baskets to look for?
parts <- fit$H
colnames(parts) <- colnames(V); rownames(parts) <- c("part 1", "part 2")
round(parts, 2)
```
::check {"regex":"k\\s*=\\s*2","gate":true,"difficulty":"intermediate","ok":"Two baskets it is. The two recovered parts are the tea/cake/cookie basket and the espresso/croissant basket, pulled straight out of the raw counts with no labels.","no":"Bean Box blended two baskets (morning and afternoon), so ask NMF for k = 2 parts."}
::solution
```r
nmf_mu <- function(V, k, iters = 300, seed = 1) {
  set.seed(seed); eps <- 1e-9
  W <- matrix(runif(nrow(V) * k), nrow(V), k)
  H <- matrix(runif(k * ncol(V)), k, ncol(V))
  for (i in 1:iters) {
    H <- H * (t(W) %*% V) / ((t(W) %*% W %*% H) + eps)
    W <- W * (V %*% t(H)) / ((W %*% H %*% t(H)) + eps)
  }
  list(W = W, H = H)
}

fit   <- nmf_mu(V, k = 2)
parts <- fit$H
colnames(parts) <- colnames(V); rownames(parts) <- c("part 1", "part 2")
round(parts, 2)
#>        espresso croissant  tea cake cookie
#> part 1     0.91      1.08 7.85 6.61   5.31
#> part 2     6.85      5.74 0.95 0.69   1.00
round(mean(abs(V - fit$W %*% fit$H)), 2)   # how well two parts rebuild every customer's 5 counts
#> [1] 0.2
```

Read the two rows: part 1 is tea, cake and cookie; part 2 is espresso and croissant. Those are Bean Box's two real baskets, recovered from nothing but the count matrix, and the average rebuild is off by only 0.2 of a cup. Every customer is now a simple, non-negative blend of two nameable habits.

[NOTE]
NMF has honest edges too. The objective is not convex, so the answer depends on the random start (the seed), and different runs can land on different parts. You must choose \(k\), the number of parts, yourself. And the factorization is not unique. In practice you fit it a few times and keep the most stable, interpretable result.

=== step === quiz
::eyebrow Check yourself
## Which tool for the job?

Bean Box hands you a customer-by-product matrix of monthly purchase **counts** and asks you to describe each customer as a blend of a few interpretable baskets, with weights the marketing team can read. Which method fits best?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Kernel PCA, because purchase data has non-linear structure that only a kernel can capture ::no Kernel PCA can unfold curved structure, but it hands back abstract coordinates (with negative values) and no easy map to the products. It answers "is this customer off the manifold?", not "which baskets is this customer made of?"
- NMF, because non-negativity makes the parts add rather than cancel, giving additive, readable baskets ::ok Exactly. Counts are non-negative, so a non-negative factorization yields parts that are themselves baskets (all weights >= 0) and customers that are simple additive blends of them, precisely the interpretable story asked for.
- Plain PCA, because its components are orthogonal and explain the most variance ::no PCA's components are dense and signed, so a "basket" could include negative espresso. Maximum variance and orthogonality are not what makes a decomposition into readable, additive baskets.

=== step === concept
::eyebrow Putting it together
## Back to anomalies: which factorization, when

Every method here is still, at heart, the Lesson 4 move: compress each customer into a small representation, rebuild them, and flag whoever rebuilds worst. What changes is the subspace you rebuild from, and each choice catches a different kind of odd account. Plain PCA flags customers off a flat subspace; kernel PCA flags customers off a curved manifold (a taste profile that fits no smooth pattern); NMF flags customers who fit no combination of the usual baskets. So the choice is really about the shape of "normal" in your data.

| Method | Fixes which PCA crack | Weights can be negative? | Reach for it when |
|---|---|---|---|
| Plain PCA | (the baseline) | yes | fast linear compression, a quick first look |
| Kernel PCA | straight axes | yes (abstract coordinates) | structure that curves or is not linearly separable |
| Sparse PCA | dense loadings | yes | you need components a human can name |
| NMF | negative weights | no (everything >= 0) | counts or intensities, additive parts-based structure |

In production you would reach for the battle-tested packages rather than the from-scratch versions above. They are not compiled for the in-browser R here, so run these locally:

```r-static
library(kernlab)                              # kernel PCA
kp <- kpca(~ ., data = flavor2, kernel = "rbfdot", kpar = list(sigma = 0.5), features = 2)

library(sparsepca)                            # sparse PCA (jointly optimised, not a post-hoc threshold)
sp <- spca(as.matrix(flavor), k = 2, alpha = 1e-3)

library(NMF)                                  # non-negative matrix factorization
nm <- nmf(V, rank = 2, method = "lee")        # the Lee-Seung multiplicative updates you just wrote
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Scholkopf, Smola, Muller (1998), Nonlinear Component Analysis as a Kernel Eigenvalue Problem](https://doi.org/10.1162/089976698300017467) - the paper that introduced kernel PCA, with the centered-kernel eigenproblem you built.
- [Lee and Seung (1999), Learning the parts of objects by non-negative matrix factorization, Nature](https://doi.org/10.1038/44565) - the classic that showed NMF recovers parts, and the multiplicative updates.
- [Zou, Hastie and Tibshirani (2006), Sparse Principal Component Analysis](https://doi.org/10.1198/106186006X113430) - the L1-penalised formulation of sparse PCA.
- [The Elements of Statistical Learning, ch. 14 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - kernel PCA, sparse PCA and NMF together under unsupervised learning, with the full math.

=== step === complete
## Lesson 6 complete

Plain PCA gives you a fast linear subspace, but it draws only straight axes, spreads every feature across every component, and uses negative weights. You fixed each in turn. Kernel PCA swapped raw coordinates for RBF similarities and eigen-decomposed the centered kernel matrix, separating Bean Box's ring-shaped regulars and explorers that a straight axis smeared together. Sparse PCA added an L1 penalty that snapped small loadings to exactly zero, turning a dense component into the nameable dark-roast axis. And NMF factored the order counts into two additive, non-negative baskets, recovering Bean Box's morning and afternoon habits from nothing but the numbers. Each gives a different subspace to rebuild from, and so a different lens on what counts as an anomalous account.

Next, Lesson 7: **Self-Supervised and Contrastive Learning**, where instead of hand-choosing a factorization you let the data teach its own representation, pulling two views of the same item together and pushing different items apart, so a well-spread, decorrelated embedding makes the downstream anomaly and cluster work easier.
