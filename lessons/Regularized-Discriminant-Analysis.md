---
title: "Advanced Supervised Learning Lesson 3: Regularized Discriminant Analysis"
description: "Learn Regularized Discriminant Analysis in R from scratch: shrink the covariance between LDA and QDA with two dials, and pick the sweet spot by cross-validation."
keywords: "regularized discriminant analysis, RDA, LDA, QDA, covariance shrinkage, Friedman 1989, discriminant analysis, classification, cross-validation, klaR rda, R"
mathjax: true
webr: true
curriculum_id: "6.140.3"
post_type: "LESSON"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "3"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "Gaussian-Processes-for-Regression.html"
course_prev: "Kernel-SVMs-and-the-Kernel-Trick.html"
lesson_access: "pro"
catalog_blurb: "Blend LDA and QDA when you have many classes or thin data."
---

=== step === cover
::eyebrow Lesson 3 of 8
## Regularized Discriminant Analysis

Back in the Classification course's [LDA and QDA lesson](Discriminant-Analysis-LDA-and-QDA.html) you met two ways to draw a boundary between Gaussian clouds. LDA assumes every class shares one covariance and draws a **straight** boundary; QDA gives each class its own covariance and draws a **curved** one. QDA is more flexible, so it should win, and often it does. But flexibility is paid for in data, and when a lab has **four kinds of tea to tell apart from only a dozen samples of each**, QDA runs out of data to pay with.

Regularized Discriminant Analysis (RDA) is the dial between them. It starts from QDA's per-class covariance and slides it toward LDA's shared one by however much the data can afford, and often lands somewhere in the middle that beats both ends. The interactive below is that dial in miniature: slide it right for a rigid straight-ish boundary (LDA-like), left for a flexible one that hugs every point (QDA-like), and watch where held-out accuracy is actually highest.

By the end of this lesson you will be able to:

- Explain why QDA overfits when classes are many or the data is thin, and why LDA can be too rigid
- Write RDA's two dials, \(\lambda\) (blend QDA toward LDA) and \(\gamma\) (shrink toward a simple round covariance), as formulas
- Read how the boundary morphs from straight to curved as \(\lambda\) changes, and pick the best \(\lambda\) by cross-validation

**Prerequisites:** the [LDA and QDA lesson](Discriminant-Analysis-LDA-and-QDA.html) (the Gaussian-per-class model, the discriminant \(\delta_k\), and why a shared covariance gives a straight boundary), and the bias-variance trade-off from the ML Workflow course.

::widget decision-region {"labels":{"c0":"first flush","c1":"second flush"},"start":3}

=== step === concept
::eyebrow The problem
## When QDA runs out of data

Here is the tension in one number. A covariance matrix for \(p\) features holds \(p(p+1)/2\) free numbers, one variance per feature plus one covariance per pair. LDA estimates **one** such matrix, pooling every class together. QDA estimates **one per class**, so for \(K\) classes it must pin down \(K\) times as many.

|  | Covariances to estimate | For \(K=4\) classes, \(p=2\) features |
|---|---|---|
| LDA | one shared matrix: \(p(p+1)/2\) | 3 numbers |
| QDA | one per class: \(K \cdot p(p+1)/2\) | 12 numbers |

Three numbers versus twelve. When each class has only a dozen samples, QDA is estimating twelve covariance numbers from thin, noisy data, and a covariance estimated from twelve points is a wobbly thing. Its curved boundary starts bending around accidents of the sample instead of real structure. LDA is steadier because it pools everything into one estimate, but it pays for that steadiness by forcing four genuinely different-shaped clouds to share a single shape.

Let us make that concrete with a running example. A Darjeeling estate grades its tea into four **flushes** (harvest seasons): first, second, monsoon, and autumn. Grading by taste needs a master taster, so the lab has verified only **twelve leaf samples per flush**. Each sample carries two cheap machine measurements: **briskness** (an astringency index) and **colour** (liquor brightness). Each lesson runs in a fresh R session, so we build that grading log right here.

```r
library(ggplot2)
set.seed(7)

# Correlated draws in base R. The Cholesky factor of a covariance is unique,
# so this generates the exact same data in any R, here or in your browser.
rmv <- function(n, mu, S) sweep(matrix(rnorm(n * 2), ncol = 2) %*% chol(S), 2, mu, "+")

flush_sample <- function(mu, S, label) {
  z <- rmv(12, mu, S)
  data.frame(briskness = round(z[, 1], 1), colour = round(z[, 2], 1), flush = label)
}

tea <- rbind(
  flush_sample(c(42, 54), matrix(c(46,  20,  20, 12), 2), "first"),   # long, tilted one way
  flush_sample(c(50, 50), matrix(c(46, -22, -22, 14), 2), "second"),  # long, tilted the other
  flush_sample(c(46, 58), matrix(c( 9,   0,   0, 52), 2), "monsoon"), # tall and narrow
  flush_sample(c(46, 50), matrix(c(30,   0,   0, 30), 2), "autumn"))  # round and wide
tea$flush <- factor(tea$flush, levels = c("first", "second", "monsoon", "autumn"))
table(tea$flush)
#>
#>   first  second monsoon  autumn
#>      12      12      12      12
```

Plot the two measurements against each other. The four flushes overlap heavily near the centre, and, crucially, they are genuinely **different shapes**: two long tilted ellipses, one tall narrow one, one round one. That shape difference is what QDA wants to model and LDA is forced to ignore.

```r
palette <- c(first = "#b5631a", second = "#2563a8", monsoon = "#1f7a55", autumn = "#8a46b0")
ggplot(tea, aes(briskness, colour, colour = flush)) +
  geom_point(size = 2.6) +
  scale_colour_manual(values = palette) +
  labs(title = "Four flushes, two lab numbers, twelve samples each",
       x = "briskness", y = "colour (liquor brightness)") +
  theme_minimal(base_size = 13)
```

=== step === concept
::eyebrow The fix
## Blend the two covariances

RDA's idea is beautifully simple: do not choose between the wobbly per-class covariance and the rigid shared one. **Blend them.** For each class \(k\), take a weighted average of its own covariance \(\hat\Sigma_k\) and the pooled covariance \(\hat\Sigma\), controlled by a single dial \(\lambda\) between 0 and 1:

\[ \hat\Sigma_k(\lambda) = (1-\lambda)\,\hat\Sigma_k + \lambda\,\hat\Sigma \]

Read every symbol. \(\hat\Sigma_k\) is class \(k\)'s **own** covariance, estimated from just its dozen samples (this is what QDA uses). \(\hat\Sigma\) is the **pooled** covariance, one shared matrix estimated from all classes at once (this is what LDA uses). The dial \(\lambda\) (lambda) sets the mix. At \(\lambda = 0\) the blend is pure \(\hat\Sigma_k\), so you get **QDA**. At \(\lambda = 1\) it is pure \(\hat\Sigma\), so you get **LDA**. Anything in between is a class covariance pulled part-way toward the group average, steadier than QDA's, more flexible than LDA's.

Friedman's original RDA adds a **second** dial, \(\gamma\) (gamma), that shrinks each blended covariance toward a plain round one (equal variance on every feature, zero correlation):

\[ \hat\Sigma_k(\lambda,\gamma) = (1-\gamma)\,\hat\Sigma_k(\lambda) + \gamma\,\frac{\operatorname{tr}\!\big(\hat\Sigma_k(\lambda)\big)}{p}\,I \]

Here \(\operatorname{tr}(\cdot)\) is the **trace** (the sum of the diagonal, i.e. the total variance), \(p\) is the number of features, and \(I\) is the identity matrix. So \(\frac{\operatorname{tr}}{p} I\) is a sphere whose radius is the average variance. \(\gamma = 0\) leaves the blend untouched; \(\gamma = 1\) throws away all correlation and shape and treats every class as a round ball. That extra dial matters most in high dimensions where even the pooled covariance is poorly estimated; here, with two features, \(\lambda\) does the heavy lifting and we will keep \(\gamma\) small.

Let us watch the \(\lambda\) blend work on the "second" flush, whose own covariance is tilted the opposite way to the group.

```r
p   <- 2
cls <- levels(tea$flush)
X   <- as.matrix(tea[, c("briskness", "colour")])

# the ingredients: each class mean, each class covariance, and the pooled covariance
mu     <- lapply(cls, function(g) colMeans(X[tea$flush == g, ])); names(mu) <- cls
Sigma  <- lapply(cls, function(g) cov(X[tea$flush == g, ]));      names(Sigma) <- cls
n_k    <- sapply(cls, function(g) sum(tea$flush == g))
pooled <- Reduce(`+`, Map(function(S, n) S * (n - 1), Sigma, n_k)) / (sum(n_k) - length(cls))

round(Sigma[["second"]], 1)                      # lambda = 0  (QDA): this class alone
round(0.5 * Sigma[["second"]] + 0.5 * pooled, 1) # lambda = 0.5 (RDA): half-way blend
round(pooled, 1)                                 # lambda = 1  (LDA): the shared pooled matrix
#>           briskness colour
#> briskness      22.5  -12.5
#> colour        -12.5    9.6
#>           briskness colour
#> briskness      29.7   -2.2
#> colour         -2.2   13.9
#>           briskness colour
#> briskness      36.9    8.1
#> colour          8.1   18.3
```

[KEY INSIGHT]
Watch the off-diagonal number: the "second" flush's own covariance says briskness and colour are strongly **negatively** related (-12.5), the pooled matrix says **positively** (+8.1), and the half-way blend sits between them (-2.2). RDA does not trust the thin per-class estimate completely; it pulls it toward the steadier group estimate by the fraction \(\lambda\).

=== step === concept
::eyebrow Show it
## Watch the boundary morph

The classifier itself is unchanged from the LDA and QDA lesson: score a new sample by the Gaussian discriminant \(\delta_k(x) = -\tfrac12\log|\Sigma_k| - \tfrac12(x-\mu_k)^\top\Sigma_k^{-1}(x-\mu_k) + \log\pi_k\), where \(\pi_k\) is the class prior, class \(k\)'s share of the training samples (12/48 for every flush here), and assign the sample to the class with the highest score. The **only** difference is that we feed it the regularized covariance \(\hat\Sigma_k(\lambda,\gamma)\) instead of a raw one. Let us build exactly that in a few lines.

```r
rda_sigma <- function(g, lambda, gamma = 0) {
  S <- (1 - lambda) * Sigma[[g]] + lambda * pooled                 # blend QDA <-> LDA
  if (gamma > 0) S <- (1 - gamma) * S + gamma * (sum(diag(S)) / p) * diag(p)  # shrink to round
  S
}

predict_rda <- function(newX, lambda, gamma = 0) {
  newX  <- as.matrix(newX)
  score <- sapply(cls, function(g) {
    S <- rda_sigma(g, lambda, gamma)
    # mahalanobis() computes (x - mu)' S^-1 (x - mu), the quadratic term in delta_k
    -0.5 * log(det(S)) - 0.5 * mahalanobis(newX, mu[[g]], S) + log(n_k[g] / sum(n_k))
  })
  if (is.null(dim(score))) score <- matrix(score, nrow = 1)
  factor(cls[max.col(score)], levels = cls)
}

# training accuracy at four settings of the dial
round(sapply(c(QDA = 0, RDA = 0.25, half = 0.5, LDA = 1),
             function(l) mean(predict_rda(X, l) == tea$flush)), 3)
#>   QDA   RDA  half   LDA
#> 0.812 0.812 0.792 0.688
```

QDA and the light \(\lambda = 0.25\) blend tie for the top training score (0.812): a flexible model flatters itself on the data it learned from. LDA scores lowest (0.688), too rigid to fit four different shapes. Now colour the whole plane by each model's prediction and the difference becomes visible.

```r
grid_pts <- expand.grid(
  briskness = seq(min(X[, 1]) - 4, max(X[, 1]) + 4, length.out = 80),
  colour    = seq(min(X[, 2]) - 4, max(X[, 2]) + 4, length.out = 80))

region <- function(lambda, label) {
  g <- grid_pts
  g$pred  <- predict_rda(g, lambda)
  g$model <- label
  g
}
regions <- rbind(region(1, "LDA (lambda = 1)"),
                 region(0.25, "RDA (lambda = 0.25)"),
                 region(0, "QDA (lambda = 0)"))
regions$model <- factor(regions$model,
  levels = c("LDA (lambda = 1)", "RDA (lambda = 0.25)", "QDA (lambda = 0)"))
tea_mid <- transform(tea, model = factor("RDA (lambda = 0.25)", levels = levels(regions$model)))

ggplot(regions, aes(briskness, colour)) +
  geom_raster(aes(fill = pred), alpha = 0.3) +
  geom_point(data = tea_mid, aes(colour = flush), size = 1.4) +
  facet_wrap(~ model) +
  scale_fill_manual(values = palette) + scale_colour_manual(values = palette) +
  labs(x = "briskness", y = "colour") + theme_minimal(base_size = 12)
```

Read the three panels left to right. **LDA** carves the plane into straight-edged wedges, so clean it nearly erases the central "autumn" class. **QDA** bends its regions hard around the twelve points of each flush, producing contorted shapes that are chasing noise. **RDA** at \(\lambda = 0.25\) keeps a sensible curve without the QDA contortions: a little flexibility, a lot of stability.

=== step === quiz
::eyebrow Check yourself
## What is the lambda dial actually doing?

You set RDA's \(\lambda = 1\) and the decision boundary comes out perfectly straight, identical to LDA. Why does turning \(\lambda\) all the way up straighten the boundary?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- At lambda = 1 the model drops the quadratic discriminant and switches to a linear classifier like logistic regression
- At lambda = 1 every class covariance becomes the single pooled matrix, so the quadratic term is identical for all classes and cancels, leaving a boundary linear in x ::ok Exactly. \(\hat\Sigma_k(1) = \hat\Sigma\) for every class, which is precisely LDA's shared-covariance assumption. The shared covariance is what cancels the quadratic term and forces a straight boundary.
- At lambda = 1 the data is projected onto one dimension, and a boundary in one dimension is always a straight line ::no RDA does no projection (that is a different technique, discriminant-coordinate reduction). The boundary is straight because the shared covariance cancels the quadratic part of the discriminant, not because of any dimension change.

=== step === widget
::eyebrow Feel it
## Regularization is a bias-variance dial

Strip away the tea and the covariance math, and RDA's \(\lambda\) is just a **complexity dial**, the same knob you have met on every model in this track. Turn it toward flexibility (QDA) and the model fits the training data tighter but memorizes noise; turn it toward simplicity (LDA) and it is steadier but can miss real structure. The sweet spot is in between, and you can only find it with held-out data.

The interactive below fits polynomials of rising degree, a different model from RDA, but the shape of the story is identical: the training error keeps falling as complexity rises, while the test error traces a **U**, high on the left (underfit, LDA's failure mode), high on the right (overfit, QDA's failure mode), lowest in the middle (where a well-tuned RDA lives). Drag the slider and find the bottom of the U.

RDA's whole job is to let cross-validation find that bottom for you, along the \(\lambda\) axis instead of the polynomial-degree axis.

::widget bias-variance {}

=== step === concept
::eyebrow The payoff
## Let cross-validation pick lambda

Training accuracy is no guide: it rewards flexibility, so it steers you toward the QDA end of the dial. The honest question is which \(\lambda\) classifies **unseen** tea best. With only 48 samples we cannot spare a big test set, so we use **leave-one-out cross-validation**: set one sample aside, refit RDA on the other 47, predict the held-out one, and repeat for all 48. The fraction correct is an honest estimate of accuracy on new tea.

```r
loo_accuracy <- function(lambda, gamma = 0) {
  hits <- 0
  for (i in seq_len(nrow(tea))) {
    keep <- tea[-i, ]; Xk <- X[-i, , drop = FALSE]          # the other 47 samples
    m2 <- lapply(cls, function(g) colMeans(Xk[keep$flush == g, ]))
    S2 <- lapply(cls, function(g) cov(Xk[keep$flush == g, ]))
    nk <- sapply(cls, function(g) sum(keep$flush == g))
    pl <- Reduce(`+`, Map(function(S, n) S * (n - 1), S2, nk)) / (sum(nk) - length(cls))
    names(m2) <- names(S2) <- cls
    sc <- sapply(cls, function(g) {                          # score the held-out sample
      S <- (1 - lambda) * S2[[g]] + lambda * pl
      if (gamma > 0) S <- (1 - gamma) * S + gamma * (sum(diag(S)) / p) * diag(p)
      -0.5 * log(det(S)) - 0.5 * mahalanobis(X[i, , drop = FALSE], m2[[g]], S) + log(nk[g] / sum(nk))
    })
    if (cls[which.max(sc)] == as.character(tea$flush[i])) hits <- hits + 1
  }
  hits / nrow(tea)
}

lambdas <- seq(0, 1, by = 0.1)
cv <- sapply(lambdas, loo_accuracy)
data.frame(lambda = lambdas, loo_accuracy = round(cv, 3))
#>    lambda loo_accuracy
#> 1     0.0        0.667
#> 2     0.1        0.729
#> 3     0.2        0.750
#> 4     0.3        0.729
#> 5     0.4        0.688
#> 6     0.5        0.708
#> 7     0.6        0.688
#> 8     0.7        0.667
#> 9     0.8        0.646
#> 10    0.9        0.646
#> 11    1.0        0.604
```

There it is. Pure QDA (\(\lambda = 0\)) gets 66.7% of held-out tea right; pure LDA (\(\lambda = 1\)) does **worse**, 60.4%, because a single shared shape cannot fit four different ones. A blend near \(\lambda = 0.2\) beats both, at 75%. The curve makes the peak obvious.

```r
ggplot(data.frame(lambda = lambdas, loo = cv), aes(lambda, loo)) +
  geom_line(colour = "#2563a8", linewidth = 1) + geom_point(size = 2) +
  labs(title = "Held-out accuracy peaks between QDA and LDA",
       x = "lambda   (0 = QDA ... 1 = LDA)", y = "leave-one-out accuracy") +
  theme_minimal(base_size = 13)
```

=== step === tryit
::eyebrow Your turn
## Write the blend

The engine of RDA is that one blend line. Write a function that returns the regularized covariance for a class: its own covariance `Sigma_g` pulled toward the `pooled` matrix by the fraction `lambda`. Fill in the blank so `rda_blend(Sigma[["second"]], pooled, 0.5)` reproduces the half-way matrix you saw earlier.

```r
rda_blend <- function(Sigma_g, pooled, lambda) ____
round(rda_blend(Sigma[["second"]], pooled, 0.5), 1)
```
::check {"regex":"1\\s*-\\s*lambda","gate":true,"difficulty":"intermediate","ok":"That is the whole idea of RDA in one line: a weighted mix of the wobbly per-class covariance and the steady pooled one. At lambda = 0.5 the off-diagonal lands at -2.2, exactly halfway between -12.5 and +8.1.","no":"You want a weighted average: (1 - lambda) of the class covariance plus lambda of the pooled one. Write (1 - lambda) times Sigma_g plus lambda times pooled."}
::solution
```r
rda_blend <- function(Sigma_g, pooled, lambda) (1 - lambda) * Sigma_g + lambda * pooled
round(rda_blend(Sigma[["second"]], pooled, 0.5), 1)
#>           briskness colour
#> briskness      29.7   -2.2
#> colour         -2.2   13.9
```

=== step === concept
::eyebrow In practice
## Reaching for RDA (and its neighbours)

You built RDA by hand to see the machinery, but in real work one function does the blend and even tunes both dials for you by cross-validation. The `klaR` package provides it, with the same formula interface as `lda()` and `qda()`.

```r-static
# install.packages("klaR")
fit <- klaR::rda(flush ~ briskness + colour, data = tea)  # cross-validates lambda and gamma
fit$regularization        # the chosen (gamma, lambda) pair
predict(fit, tea)$class   # predicted flushes, just like lda()/qda()
```

RDA is not a new model so much as a slider across a whole family of Gaussian classifiers. Reading the covariance column below shows the dial turning from most restrictive to most flexible:

| Method | Covariance | Boundary | Best when |
|---|---|---|---|
| Gaussian Naive Bayes | diagonal, per class | curved | features truly independent |
| LDA | one full matrix, shared | straight | thin data, or classes share a shape |
| **RDA** | **blended, tuned per class** | **straight to curved** | **you are unsure, or between the two** |
| QDA | full matrix, per class | curved | plenty of data per class, different shapes |

**Where RDA earns its keep:** many classes, few samples per class, or many features, exactly where a full per-class covariance is unstable or even impossible to invert. **Where it does not help much:** two well-separated classes with generous data, where plain QDA is already stable and adds no tuning to worry about. And note that \(\gamma = 1\) with equal priors reduces RDA to a nearest-centroid rule, so the same two dials quietly span a surprisingly wide family.

=== step === quiz
::eyebrow Check yourself
## Read the curve

Your cross-validation curve shows QDA (\(\lambda=0\)) at 66.7%, LDA (\(\lambda=1\)) at 60.4%, and a peak of 75% near \(\lambda=0.2\). A colleague says: "RDA is just a safety net; the best it can ever do is tie whichever of LDA or QDA is better." Are they right?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No: a blended covariance is a genuinely different estimator, so an intermediate lambda can beat both endpoints, as it does here (75% versus 66.7% and 60.4%) ::ok Right. The blend at lambda = 0.2 is not LDA and not QDA; it is a steadier-than-QDA, more-flexible-than-LDA covariance that neither endpoint can produce. That is exactly why the curve peaks in the interior instead of at an end.
- Yes: RDA only interpolates, so its accuracy must lie between the LDA and QDA numbers
- Yes, because leave-one-out cross-validation always favours the simpler model, so lambda = 1 would win with more folds ::no Leave-one-out did not favour the simpler model here; LDA (lambda = 1) was the worst. And RDA won on this very cross-validation, not despite it.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [Friedman (1989), "Regularized Discriminant Analysis", JASA 84(405)](https://doi.org/10.1080/01621459.1989.10478752) - the original paper that introduced the two-parameter shrinkage you built here.
- [The Elements of Statistical Learning, ch. 4.3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - "Regularized Discriminant Analysis" in full, alongside LDA and QDA.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the gentler companion on discriminant analysis and the bias-variance trade behind shrinkage.
- [klaR::rda reference (CRAN)](https://cran.r-project.org/package=klaR) - the production function, documenting the `lambda` and `gamma` arguments and their cross-validated tuning.

=== step === complete
## Lesson 3 complete

You can now place a classifier anywhere on the line between LDA and QDA. RDA blends each class's wobbly covariance toward the steady pooled one by a fraction \(\lambda\), optionally shrinks toward a round covariance by \(\gamma\), and feeds the result into the same Gaussian discriminant. You saw the boundary morph from straight to contorted as \(\lambda\) fell, watched leave-one-out cross-validation pick a blend that beat both pure QDA and pure LDA on unseen tea, wrote the blend yourself, and learned exactly when RDA is worth reaching for: many classes, thin data, or many features.

Next, Lesson 4: Gaussian Processes for Regression. We leave classification behind for a method that does not just predict a number but reports how sure it is, a full distribution over functions whose uncertainty widens honestly wherever the data runs thin.
